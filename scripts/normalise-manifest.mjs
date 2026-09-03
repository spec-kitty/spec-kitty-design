#!/usr/bin/env node
/**
 * Make `custom-elements.json` byte-stable across analyzer runs.
 *
 * `ci-quality.yml` asserts the committed manifest is current with
 * `git diff --exit-code -- packages/elements/custom-elements.json`, and ADR-11 generates the
 * React wrapper FROM that manifest — so it has to be committed and it has to be checkable.
 *
 * But `cem analyze` does not emit a stable order. Measured: two consecutive runs on an
 * unchanged tree swapped `SkFormInput` and `SkFormTextarea`, producing a 219-line diff over
 * identical content. That makes the ENFORCED gate FLAKY — it fails at random, and each failure
 * looks like "someone forgot to regenerate".
 *
 * It has been latent since #70 and surfaced in #74, which is simply the first mission to add
 * two elements whose declarations sort adjacently. With one more component per batch in
 * #77–#79, it would have started firing constantly.
 *
 * So: sort what the analyzer leaves unordered — modules by path, declarations and exports by
 * name — and leave everything else exactly as emitted. Sorting is safe because every consumer
 * reads by name: check-manifest-content.mjs, check-part-ratchet.mjs, and the FR-009 arm in
 * config-contract.test.ts all look declarations up rather than indexing them.
 *
 * Usage: node scripts/normalise-manifest.mjs [path]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const path = process.argv[2] ?? 'packages/elements/custom-elements.json';
const manifest = JSON.parse(readFileSync(path, 'utf8'));

const byName = (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''));

if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) {
  console.error(`❌ ${path} has no modules — refusing to normalise an empty manifest.`);
  process.exit(1);
}

manifest.modules.sort((a, b) => String(a.path ?? '').localeCompare(String(b.path ?? '')));
for (const mod of manifest.modules) {
  if (Array.isArray(mod.declarations)) mod.declarations.sort(byName);
  if (Array.isArray(mod.exports)) mod.exports.sort(byName);
  for (const decl of mod.declarations ?? []) {
    // Members, parts, slots and events are all name-keyed collections the analyzer emits in
    // source order. Sorting them removes the last source of churn when a class is reordered.
    for (const key of ['members', 'cssParts', 'cssProperties', 'slots', 'events', 'attributes']) {
      if (Array.isArray(decl[key])) decl[key].sort(byName);
    }
  }
}

writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`normalise-manifest: ${path} sorted (${manifest.modules.length} module(s))`);
