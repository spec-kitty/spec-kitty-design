#!/usr/bin/env node
/**
 * Two assertions over ADOPTED stylesheets, made over PARSED CSS rather than raw text.
 *
 *   1. No `is-focused`-style class that simulates a state the browser owns. The static sheets
 *      needed one to show focus in a screenshot; an element that can have real focus has no
 *      business shipping a simulation, and it tells the accessibility tree something untrue.
 *   2. No `var()` fallback naming a custom property that @spec-kitty/tokens does not define.
 *      `min-height: var(--sk-space-30, 120px)` in the legacy form-field sheet is a hardcoded
 *      120px wearing a token's clothes — `--sk-space-30` exists nowhere, the scale runs 1..12,
 *      and `min-height` is not in stylelint's strict-value property list so nothing objected.
 *
 * PARSED, NOT GREPPED — and this one was found the hard way. The first version of these checks
 * was `grep -c is-focused`, run against a sheet whose header comment EXPLAINS why is-focused was
 * excluded. The grep returned 3 and the check "failed" over prose describing its own success.
 * That is this repo's `::part()`-mention-in-a-comment looseness, arriving as a false positive
 * instead of a false negative. postcss sees declarations and selectors; comments are not either.
 *
 * Usage: node scripts/check-element-css-hygiene.mjs
 */
import { readFileSync, globSync } from 'node:fs';
import { basename } from 'node:path';
import postcss from 'postcss';

const OUT_DIR = 'packages/elements/src';

const elements = globSync(`${OUT_DIR}/**/sk-*.ts`, {})
  .filter((f) => /^sk-[a-z0-9-]+\.ts$/.test(basename(f)))
  .map((f) => basename(f).replace(/^sk-/, '').replace(/\.ts$/, ''))
  .sort();

if (elements.length === 0) {
  console.error(`❌ Refusing to report green over an empty set: no elements under ${OUT_DIR}.`);
  process.exit(1);
}

/** Every custom property @spec-kitty/tokens defines. */
const tokenSource = readFileSync('packages/tokens/src/tokens.css', 'utf8');
const defined = new Set([...tokenSource.matchAll(/^\s*(--sk-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));
if (defined.size === 0) {
  console.error('❌ Parsed zero token definitions from packages/tokens/src/tokens.css.');
  process.exit(1);
}

const problems = [];
let sheetCount = 0;
let ruleCount = 0;

for (const name of elements) {
  const sheets = globSync(`packages/styles/src/${name}/sk-*.css`, {}).sort();
  if (sheets.length === 0) {
    problems.push(`<sk-${name}> has no adopted stylesheet — nothing was checked for it`);
    continue;
  }
  for (const file of sheets) {
    sheetCount += 1;
    const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });
    root.walkRules((rule) => {
      ruleCount += 1;
      const line = rule.source?.start?.line ?? 0;
      if (/\.is-[a-z-]*(focus|hover|active)/i.test(rule.selector)) {
        problems.push(
          `${file}:${line} — ${rule.selector.trim()} — a class simulating a state the browser ` +
            `owns; use the real pseudo-class`
        );
      }
    });
    root.walkDecls((decl) => {
      const line = decl.source?.start?.line ?? 0;
      for (const m of decl.value.matchAll(/var\(\s*(--sk-[a-z0-9-]+)\s*,/g)) {
        if (!defined.has(m[1])) {
          problems.push(
            `${file}:${line} — ${decl.prop}: ${decl.value.trim()} — ${m[1]} is defined nowhere in ` +
              `@spec-kitty/tokens, so the fallback is the only live value: a hardcoded number ` +
              `wearing a token's clothes`
          );
        }
      }
    });
  }
}

if (ruleCount === 0) {
  console.error(`❌ Parsed ${sheetCount} stylesheet(s) and found zero rules.`);
  process.exit(1);
}

if (problems.length) {
  console.error('❌ Adopted stylesheet hygiene:');
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}

console.log(
  `✅ Adopted CSS hygiene: ${elements.length} element(s), ${sheetCount} sheet(s), ${ruleCount} ` +
    `rule(s) — no simulated states, no undefined-token fallbacks.`
);
