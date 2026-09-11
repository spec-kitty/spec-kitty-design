#!/usr/bin/env node
/**
 * Build the published token stylesheet with a no-JavaScript System fallback.
 *
 * `packages/tokens/src/tokens.css` remains the only authored palette: this generator clones the
 * declarations from its existing light override into a media-query rule for a root that has no
 * explicit `data-theme`. Manual `data-theme="light"`/`"dark"` choices therefore win, while an
 * unenhanced document follows the operating system without maintaining a second palette.
 *
 * Usage: node scripts/build-tokens-css.mjs [--check] [--selftest]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import postcss from 'postcss';

const SOURCE = 'packages/tokens/src/tokens.css';
const OUTPUT = 'packages/tokens/dist/tokens.css';
const SYSTEM_SELECTOR = ':root:not([data-theme])';
const LIGHT_SELECTORS = new Set([':root[data-theme="light"]', '.sk-light']);

const selectorSet = (selector) => new Set(selector.split(',').map((part) => part.trim()));
const isAuthoredLightRule = (rule) => {
  const selectors = selectorSet(rule.selector);
  return selectors.size === LIGHT_SELECTORS.size &&
    [...LIGHT_SELECTORS].every((selector) => selectors.has(selector));
};

export function buildTokensCss(source) {
  const root = postcss.parse(source, { from: SOURCE });
  const lightRules = [];
  root.walkRules((rule) => {
    if (isAuthoredLightRule(rule)) lightRules.push(rule);
  });
  if (lightRules.length !== 1) {
    throw new Error(
      `${SOURCE} must contain exactly one authored ` +
      `:root[data-theme="light"], .sk-light block; found ${lightRules.length}`,
    );
  }

  const systemRule = lightRules[0].clone({ selector: SYSTEM_SELECTOR });
  const media = postcss.atRule({ name: 'media', params: '(prefers-color-scheme: light)' });
  media.append(systemRule);
  root.append(postcss.comment({
    text: 'GENERATED SYSTEM FALLBACK — declarations cloned from the authored light block above',
  }));
  root.append(media);
  return `${root.toString()}\n`;
}

const outputProblems = (current, expected) => {
  if (current === null) return [`${OUTPUT} is missing`];
  if (current !== expected) return [`${OUTPUT} is stale`];
  return [];
};

const runSelftest = () => {
  const healthy = `:root { --sk-surface-page: #000; --sk-fg-body: #fff; }\n` +
    `:root[data-theme="light"], .sk-light { --sk-surface-page: #fff; --sk-fg-body: #000; }\n`;
  const built = buildTokensCss(healthy);
  const probes = [
    ['single source is cloned', () => {
      if (!built.includes('@media (prefers-color-scheme: light)')) throw new Error('missing media');
      if (!built.includes(`${SYSTEM_SELECTOR} {`)) throw new Error('missing guarded root');
      if ((built.match(/--sk-surface-page: #fff/g) ?? []).length !== 2) throw new Error('light value drift');
    }],
    ['missing authored light block is rejected', () => {
      try { buildTokensCss(':root { --sk-x: #000 }'); } catch { return; }
      throw new Error('missing block accepted');
    }],
    ['duplicate authored light blocks are rejected', () => {
      try { buildTokensCss(`${healthy}${healthy}`); } catch { return; }
      throw new Error('duplicate block accepted');
    }],
    ['drift checker distinguishes healthy, missing, and stale output', () => {
      if (outputProblems(built, built).length !== 0) throw new Error('healthy output rejected');
      if (outputProblems(null, built).length === 0) throw new Error('missing output accepted');
      if (outputProblems(`${built}/* drift */`, built).length === 0) throw new Error('stale output accepted');
    }],
  ];
  const failures = [];
  for (const [name, probe] of probes) {
    try { probe(); } catch (error) { failures.push(`${name}: ${error.message}`); }
  }
  if (failures.length) throw new Error(failures.join('\n'));
  console.log(`✅ Token System-fallback selftest: ${probes.length}/${probes.length} probes passed.`);
};

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  const check = process.argv.includes('--check');
  const selftest = process.argv.includes('--selftest');
  const unknown = process.argv.slice(2).filter((arg) => !['--check', '--selftest'].includes(arg));
  if (unknown.length) {
    console.error('usage: node scripts/build-tokens-css.mjs [--check] [--selftest]');
    process.exit(1);
  }

  let generated;
  try {
    generated = buildTokensCss(readFileSync(SOURCE, 'utf8'));
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

  if (check) {
    const problems = outputProblems(existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : null, generated);
    if (problems.length) {
      console.error(`❌ ${problems.join('; ')}. Run: node scripts/build-tokens-css.mjs`);
      process.exit(1);
    }
    console.log(`✅ ${OUTPUT} is generated from the one authored light token block.`);
  } else if (!selftest) {
    mkdirSync(dirname(OUTPUT), { recursive: true });
    writeFileSync(OUTPUT, generated);
    console.log(`build-tokens-css: ${SOURCE} -> ${OUTPUT}`);
  }

  if (selftest) {
    try { runSelftest(); } catch (error) {
      console.error(`❌ Token System-fallback selftest:\n${error.message}`);
      process.exit(1);
    }
  }
}
