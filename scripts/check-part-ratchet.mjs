#!/usr/bin/env node
/**
 * Shrink-only ratchet over the manifest's declared `::part()`s (#71, C-007, SC-013).
 *
 * THE PROBLEM THIS CLOSES
 *
 * SC-013 asserts every manifest-declared part is present and targetable, with the expected
 * list derived from `custom-elements.json` rather than hardcoded. Correct mechanism — and
 * over an empty list it is a green assertion about nothing. `custom-elements.json` declares
 * **0** cssParts today.
 *
 * So: a part may be REMOVED (the count shrinks, and this file is updated to match), but a
 * part may not be ADDED without updating this file in the same PR.
 *
 * That alone would NOT make "every declared part has a test" true — an earlier version of
 * this docstring claimed it did, and a pre-merge lens pointed out the script never reads a
 * test file at all: a #72 author could add `@csspart label`, regenerate, append "label"
 * here, and ship with zero tests. The inference "updating this file means adding a test"
 * was a convention enforced by a reviewer noticing, which is precisely what the sentence
 * claimed to have replaced.
 *
 * So the script now also REQUIRES a `::part(<name>)` reference in the browser lane's test
 * sources for every recorded part. Same shape as check-manifest-content.mjs: derive the
 * obligation from the source of truth rather than trusting a convention.
 *
 * Same shape as scripts/check-manifest-content.mjs: derive from the source of truth and
 * refuse to pass vacuously.
 */
import { readFileSync, existsSync, globSync, statSync } from 'node:fs';

const MANIFEST = 'packages/elements/custom-elements.json';
const EXPECTED = 'expected-parts.json';

// Absence is a failure, not zero parts. A missing or unreadable manifest would otherwise
// read as "no parts declared" and pass — the certifying-absence shape this repo keeps
// shipping.
for (const f of [MANIFEST, EXPECTED]) {
  if (!existsSync(f)) {
    console.error(`❌ ${f} is missing — refusing to treat its absence as "no parts".`);
    process.exit(1);
  }
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const expected = JSON.parse(readFileSync(EXPECTED, 'utf8'));

const declared = {};
let total = 0;
for (const mod of manifest.modules ?? []) {
  for (const dec of mod.declarations ?? []) {
    const parts = (dec.cssParts ?? []).map((p) => p.name).sort();
    if (parts.length) {
      declared[dec.tagName ?? dec.name] = parts;
      total += parts.length;
    }
  }
}

const problems = [];
if (total > (expected.total ?? 0)) {
  problems.push(
    `the manifest declares ${total} ::part(s) but ${EXPECTED} records ${expected.total ?? 0}.\n` +
      `   A part added without updating that file is a part with no test. Add the test, then\n` +
      `   record the part here in the same PR.`
  );
}

for (const [el, parts] of Object.entries(declared)) {
  const known = expected.byElement?.[el] ?? [];
  const added = parts.filter((p) => !known.includes(p));
  if (added.length) problems.push(`<${el}> declares undeclared part(s): ${added.join(', ')}`);
}

// Every RECORDED part must be targeted by a test. Without this the file is a list someone
// keeps up to date, not an obligation.
// globSync can return directories whose names match; filter to real files.
const testSources = [...globSync('fixtures/**/src/**/*.test.ts', {}), ...globSync('tests/**/*.test.ts', {})]
  .filter((f) => statSync(f).isFile())
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');
for (const [el, parts] of Object.entries(expected.byElement ?? {})) {
  for (const part of parts) {
    if (!testSources.includes(`::part(${part})`)) {
      problems.push(
        `part "${part}" on <${el}> is recorded but no test targets \`::part(${part})\` — ` +
          `recording a part is not the same as testing it, and this file's whole purpose is ` +
          `that the two cannot drift`
      );
    }
  }
}

if (problems.length) {
  console.error('❌ ::part() ratchet (C-007, SC-013):');
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}

console.log(
  total === 0
    ? `✅ ::part() ratchet: 0 declared, 0 recorded. Vacuous BY DESIGN today — the guard is that it cannot grow silently.`
    : `✅ ::part() ratchet: ${total} declared part(s), all recorded in ${EXPECTED}.`
);
