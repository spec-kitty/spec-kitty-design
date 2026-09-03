#!/usr/bin/env node
/**
 * Every element reaches BOTH distribution entries (ADR-10 §2), and reaches them at RUNTIME.
 *
 * `packages/elements/src/elements.ts` — the IIFE entry — was a hand-maintained list of
 * side-effect imports, and `src/index.ts` a hand-maintained list of named exports. #73 added
 * `sk-nav-pill` to the second and not the first, and everything stayed green: the vitest lane
 * resolves `@spec-kitty/elements` to `src/index.ts`, the manifest analyzer reads source, the
 * a11y gate loads Storybook's own module graph. Only the deployed demo — a real page loading
 * the real self-contained bundle with no bundler — went quiet, and it took a Playwright
 * failure to notice.
 *
 * That is the hand-maintained-list defect this repo removed from the CSS pipeline in #71 and
 * from the markup generator in #72, surviving in the one file where nothing derived anything.
 *
 * PARSED, NOT SUBSTRING-MATCHED. The first version of this file did `text.includes(...)`, and
 * three pre-merge lenses each broke it the same way:
 *
 *     // import './nav-pill/sk-nav-pill.js';        green — and the IIFE registers nothing
 *     // TODO: import './nav-pill/sk-nav-pill.js';  green
 *     export type { SkNavPill } from './…';         green — `export type` is ERASED at build
 *
 * A commented-out import is the single most plausible way this defect actually recurs:
 * someone comments it out to bisect a build failure and never restores it. So the gate that
 * exists because of a hand-maintained list was itself defeatable by the most ordinary edit
 * anyone makes to one. esbuild does the reading now — it is pinned, it is already used by
 * scripts/build-element-markup.mjs, and a file it cannot parse fails the gate rather than
 * being skipped.
 *
 * Usage: node scripts/check-elements-entries.mjs
 */
import { readFileSync, globSync } from 'node:fs';
import { basename } from 'node:path';
import * as esbuild from 'esbuild';

const SRC = 'packages/elements/src';

const elements = globSync(`${SRC}/**/sk-*.ts`, {})
  .filter((f) => /^sk-[a-z0-9-]+\.ts$/.test(basename(f)))
  .map((f) => basename(f).replace(/^sk-/, '').replace(/\.ts$/, ''))
  .sort();

if (elements.length === 0) {
  console.error(
    `❌ Refusing to report green over an empty set: no sk-<name>.ts found under ${SRC}.`
  );
  process.exit(1);
}

/**
 * The specifiers an entry still imports AFTER TypeScript is erased and comments are stripped.
 *
 * esbuild's transform is a real lexer, so a commented-out line simply is not in the output and
 * an `export type { X } from './y.js'` re-export is erased before it gets there — which is
 * exactly the distinction a substring match over the raw file cannot make. It also normalises
 * the quote style, so `'./x.js'` and `"./x.js"` compare equal.
 */
function runtimeSpecifiers(file) {
  const { code } = esbuild.transformSync(readFileSync(file, 'utf8'), {
    loader: 'ts',
    format: 'esm',
  });
  return new Set([...code.matchAll(/from\s*"([^"]+)"|import\s*"([^"]+)"/g)].map((m) => m[1] ?? m[2]));
}

const ENTRIES = [
  {
    file: `${SRC}/elements.ts`,
    what: 'the IIFE entry',
    why: 'without it the self-contained browser build does not register the element, and only a no-bundler consumer notices',
  },
  {
    file: `${SRC}/index.ts`,
    what: 'the ESM entry',
    why: 'without it a bundler consumer cannot import the class, and the element is unregistered unless something else pulls it in',
  },
];

const problems = [];
for (const { file, what, why } of ENTRIES) {
  let specifiers;
  try {
    specifiers = runtimeSpecifiers(file);
  } catch (err) {
    problems.push(
      `${file} (${what}) could not be parsed — ${String(err?.message ?? err).split('\n')[0]}`
    );
    continue;
  }
  // A parse that yields no imports at all is not a pass: it is the same silence, one level up.
  if (specifiers.size === 0) {
    problems.push(`${file} (${what}) resolves ZERO runtime imports — it registers nothing`);
    continue;
  }
  for (const name of elements) {
    if (!specifiers.has(`./${name}/sk-${name}.js`)) {
      problems.push(`<sk-${name}> is absent from ${file} (${what}) — ${why}`);
    }
  }
}

if (problems.length) {
  console.error('❌ An element does not reach every distribution entry (ADR-10 §2):');
  for (const p of problems) console.error(`   ${p}`);
  console.error(
    '\n   Checked against the imports esbuild actually RESOLVES, so a commented-out line and\n' +
      "   an erased `export type` both count as absent — which is what they are at runtime."
  );
  process.exit(1);
}

console.log(
  `✅ All ${elements.length} element(s) reach both distribution entries at runtime: ${elements.join(', ')}.`
);
