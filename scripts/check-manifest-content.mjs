#!/usr/bin/env node
/**
 * Assert the Custom Elements Manifest DESCRIBES SOMETHING (FR-006, SC-004).
 *
 * The drift check beside this one (`nx run elements:analyze && git diff --exit-code`)
 * proves the committed manifest EQUALS what the analyzer emits. It cannot tell you
 * that what the analyzer emits is worth anything. Delete the `@element sk-stub` JSDoc
 * from an element, regenerate, commit: the manifest is internally consistent, the diff
 * is clean, CI is green — and ADR-11's React wrapper generator, two missions from now,
 * receives a manifest describing no elements at all.
 *
 * `define.ts` says of the JSDoc and the no-`tag` assertion: "Do not remove either
 * without replacing the other." Only the negative half was asserted. This is the
 * positive half.
 *
 * It is deliberately a FLOOR, not a fixed list: every element the package registers
 * must appear with a real tag name. Adding a component to the package without adding
 * it here is impossible, because the source of truth is the registration itself.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const MANIFEST = 'packages/elements/custom-elements.json';
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

const declared = [];
for (const mod of manifest.modules ?? []) {
  for (const dec of mod.declarations ?? []) {
    if (dec.customElement && dec.tagName) declared.push({ tag: dec.tagName, name: dec.name });
  }
}

// What the package actually registers, read from source: every `define('<tag>', X)`.
const registered = new Set();
for (const f of globSync('packages/elements/src/**/*.ts', {})) {
  for (const m of readFileSync(f, 'utf8').matchAll(/\bdefine\(\s*['"]([a-z][a-z0-9]*-[a-z0-9-]*)['"]/g)) {
    registered.add(m[1]);
  }
}

const problems = [];
if (declared.length === 0) {
  problems.push(
    'the manifest declares NO custom elements at all — every `@element <tag>` JSDoc is ' +
      'missing, and the analyzer cannot follow the guarded define() helper without one'
  );
}
if (registered.size === 0) {
  problems.push('no define(\'<tag>\', …) call found in packages/elements/src — refusing to pass vacuously');
}
for (const tag of registered) {
  if (!declared.some((d) => d.tag === tag)) {
    problems.push(
      `<${tag}> is registered in source but absent from the manifest — add an ` +
        `\`@element ${tag}\` JSDoc to its class (see packages/elements/src/define.ts)`
    );
  }
}
for (const d of declared) {
  if (d.tag === 'tag') problems.push(`manifest declares an element literally named "tag" (${d.name})`);
}

if (problems.length) {
  console.error(`❌ ${MANIFEST} does not describe the package's elements (FR-006, SC-004):`);
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}
console.log(
  `✅ Manifest describes all ${registered.size} registered element(s) by real tag name: ` +
    declared.map((d) => `<${d.tag}> → ${d.name}`).join(', ')
);
