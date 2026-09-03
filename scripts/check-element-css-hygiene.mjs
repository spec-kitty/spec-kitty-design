#!/usr/bin/env node
/**
 * Two assertions over ADOPTED stylesheets, made over PARSED CSS rather than raw text.
 *
 *   1. No `is-focused`-style class that simulates a state the browser owns. The static sheets
 *      needed one to show focus in a screenshot; an element that can have real focus has no
 *      business shipping a simulation, and it tells the accessibility tree something untrue.
 *   2. No `var()` reference to a custom property that @spec-kitty/tokens does not define.
 *
 * SCOPE: the sheets an ELEMENT adopts. The two examples below both live in
 * `packages/styles/src/form-field/sk-form-field.css`, which has no element and is therefore
 * NEVER OPENED by this gate — it is published `@spec-kitty/styles@1.0.0` surface that #74
 * deliberately left untouched. A lens pointed out the docstring read as repository-wide.
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
      // BROADER THAN `.is-`, because the message claims a semantic property and the first
      // version implemented a two-token denylist. A lens got `.is-disabled`, `.is-checked`,
      // `.isFocused`, `--focused` and `[data-focus]` all past it — and `.is-disabled` is the
      // exact browser-owned state this mission spent a finding on.
      const STATES = 'focus|focused|hover|hovered|active|disabled|checked|invalid|required|visited';
      const simulated = new RegExp(`[.\\[](?:is[-_]?|state[-_]|data-)?[a-z-]*(?:${STATES})\\b`, 'i');
      // A real pseudo-class in the same compound means the author is using the platform state,
      // so `.sk-x__control:disabled` and `:host([invalid])` are fine; a CLASS or ATTRIBUTE
      // spelling the state is not.
      // ARIA attributes are EXEMPT: `[aria-invalid="true"]` reflects real state into the
      // accessibility tree — it is the platform surface, not a simulation of it. Stripping
      // pseudo-classes too, so `:disabled` and `:host([invalid])` (the reflected
      // ElementInternals state the adopted sheet must see) do not trip the rule they exist to
      // satisfy. Caught by running the widened rule against this mission's own sheets.
      const stripped = rule.selector
        .replace(/:[a-z-]+(\([^)]*\))?/gi, '')
        .replace(/\[aria-[^\]]*\]/gi, '');
      if (simulated.test(stripped)) {
        problems.push(
          `${file}:${line} — ${rule.selector.trim()} — a class or attribute simulating a state ` +
            `the browser owns; use the real pseudo-class`
        );
      }
    });
    root.walkDecls((decl) => {
      const line = decl.source?.start?.line ?? 0;
      // EVERY `--sk-*` reference, not only those followed by a comma. The first version matched
      // `var(--sk-x, fallback)` alone, so `var(--sk-space-99)` with NO fallback passed — and
      // that is the worse defect the docstring describes, because the declaration silently
      // drops at computed-value time instead of quietly using a hardcoded number. Nested
      // `var(--a, var(--b))` was missed for the same reason.
      for (const m of decl.value.matchAll(/var\(\s*(--sk-[a-z0-9-]+)/g)) {
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
