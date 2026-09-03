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
import { createRequire } from 'node:module';

const MANIFEST = 'packages/elements/custom-elements.json';
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

const declared = [];
for (const mod of manifest.modules ?? []) {
  for (const dec of mod.declarations ?? []) {
    if (dec.customElement && dec.tagName) declared.push({ tag: dec.tagName, name: dec.name });
  }
}

/**
 * Strip comments before matching.
 *
 * Without this the scan matched two JSDoc EXAMPLES in define.ts — prose showing what
 * the analyzer does and does not follow — so `registered` was non-empty even with the
 * real `define('sk-stub', SkStub)` deleted, and the vacuity guard below could never
 * fire. Demonstrated by a squad lens: it removed the registration and this script
 * still printed a green line. A gate written to stop a vacuous pass, passing
 * vacuously.
 *
 * Crude but adequate: this is a scan for a registration call, not a parser, and
 * over-stripping can only make the check STRICTER (a missed registration fails).
 */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

// What the package actually registers, read from source: `define('<tag>', X)` or Lit's
// `@customElement('<tag>')` decorator, which the first cut missed entirely.
const registered = new Set();
for (const f of globSync('packages/elements/src/**/*.ts', {})) {
  const code = stripComments(readFileSync(f, 'utf8'));
  const RE = /(?:\bdefine\(|@customElement\(|customElements\.define\()\s*['"]([a-z][a-z0-9]*-[a-z0-9-]*)['"]/g;
  for (const m of code.matchAll(RE)) registered.add(m[1]);
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

/**
 * Every module path must actually RESOLVE from the package name.
 *
 * This is the assertion that closes the class rather than pinning a better constant.
 * Two shapes have already shipped here and both were unresolvable: a
 * workspace-relative `packages/elements/src/stub/sk-stub.ts` (a .ts file outside
 * `files`), and then `./dist/index.js`, which LOOKED right and threw
 * ERR_PACKAGE_PATH_NOT_EXPORTED because `exports` declared no such subpath. A
 * generator joins this path onto the package name; if that import throws, ADR-11's
 * wrapper generation cannot reach the element it just read.
 */
const require_ = createRequire(import.meta.url);
const PKG = JSON.parse(readFileSync('packages/elements/package.json', 'utf8')).name;
const seenPaths = new Set();
for (const mod of manifest.modules ?? []) {
  if (seenPaths.has(mod.path)) {
    problems.push(
      `two modules share the path "${mod.path}" — generators that emit one file per ` +
        `module collide, and which declaration survives is iteration order`
    );
  }
  seenPaths.add(mod.path);

  const spec = `${PKG}/${String(mod.path).replace(/^\.\//, '')}`;
  try {
    require_.resolve(spec);
  } catch (err) {
    // TWO different failures wear one exception, and only one is a defect.
    //
    //   ERR_PACKAGE_PATH_NOT_EXPORTED -- the package's `exports` map refuses this
    //     subpath. The path can never resolve for anyone. This is the bug, and it is
    //     what shipped at f2c4508.
    //   MODULE_NOT_FOUND / ERR_MODULE_NOT_FOUND -- the exports map permits it and the
    //     file is simply absent. `dist/` is gitignored and the lint-code job never
    //     builds, so this is the NORMAL state there. Failing on it would make the
    //     check environmental rather than structural — and an assertion that is red
    //     for a reason unrelated to its claim gets disabled, not fixed.
    if (err.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      problems.push(
        `module path "${mod.path}" is not exported: "${spec}" throws ` +
          `ERR_PACKAGE_PATH_NOT_EXPORTED. A generator joins this path onto the package ` +
          `name, so it resolves for nobody. Add the subpath to package.json "exports", ` +
          `or point the path at one that is already exported.`
      );
    } else if (err.code !== 'MODULE_NOT_FOUND' && err.code !== 'ERR_MODULE_NOT_FOUND') {
      problems.push(`module path "${mod.path}" failed to resolve as "${spec}": ${err.code ?? err.message}`);
    }
  }
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
