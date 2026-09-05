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
  const RE =
    /(?:\bdefine\(|@customElement\(|customElements\.define\()\s*['"]([a-z][a-z0-9]*-[a-z0-9-]*)['"]/g;
  for (const m of code.matchAll(RE)) registered.add(m[1]);
}

// ---------------------------------------------------------------------------------------
// --selftest: probe the DOCUMENTATION assertions.
//
// Every gate landed since f8af689 ships one of these, and this file's own history is the
// argument for it: its `registered` scan once matched two JSDoc examples in define.ts, so the
// vacuity guard could never fire and the gate printed green with the real registration deleted.
// A lens found that, not the author.
//
// The description ratchet added in #129 introduced five silent-skip predicates and two floors
// with no probe behind any of them. Both pre-merge lenses said so independently.
// ---------------------------------------------------------------------------------------
if (process.argv.includes('--selftest')) {
  const base = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const clone = () => JSON.parse(JSON.stringify(base));
  const tagged = (m) => m.modules.flatMap((x) => x.declarations ?? []).filter((d) => d.tagName);

  /** Run the doc assertions over an arbitrary manifest, returning the problems. */
  const audit = (m, expected) => {
    const out = [];
    let docs = 0;
    const per = new Map();
    for (const mod of m.modules ?? []) {
      for (const decl of mod.declarations ?? []) {
        if (!decl.tagName) continue;
        let a = 0;
        let p = 0;
        let me = 0;
        const attributedFields = new Set(
          (decl.attributes ?? []).map((attr) => attr.fieldName ?? attr.name),
        );
        for (const attr of decl.attributes ?? []) {
          docs++;
          a++;
          if (!String(attr.description ?? '').trim()) out.push(`attr ${decl.tagName}.${attr.name}`);
        }
        for (const mem of decl.members ?? []) {
          if (Object.hasOwn(mem, 'x-spec-kitty-property-only')) {
            if (mem['x-spec-kitty-property-only'] !== true) {
              out.push(`invalid property-only marker ${decl.tagName}.${mem.name}`);
            } else {
              docs++;
              p++;
              if (mem.kind !== 'field')
                out.push(`property-only non-field ${decl.tagName}.${mem.name}`);
              if (
                mem.readonly ||
                mem.static ||
                mem.name.startsWith('#') ||
                mem.privacy === 'protected' ||
                mem.privacy === 'private'
              )
                out.push(`property-only non-settable ${decl.tagName}.${mem.name}`);
              if (mem.state === true || mem['x-spec-kitty-internal-state'] === true) {
                out.push(`property-only internal state ${decl.tagName}.${mem.name}`);
              }
              if (attributedFields.has(mem.name)) {
                out.push(`both property-only and observed attribute ${decl.tagName}.${mem.name}`);
              }
              if (!String(mem.description ?? '').trim()) {
                out.push(`property ${decl.tagName}.${mem.name}`);
              }
            }
          }
          if (mem.kind !== 'method') continue;
          if (mem.privacy === 'protected' || mem.privacy === 'private') continue;
          if (mem.name.startsWith('#')) continue;
          docs++;
          me++;
          if (!String(mem.description ?? '').trim()) out.push(`method ${decl.tagName}.${mem.name}`);
        }
        per.set(decl.tagName, { attributes: a, properties: p, methods: me });
      }
    }
    for (const [tag, want] of Object.entries(expected.elements ?? {})) {
      const got = per.get(tag);
      if (!got) out.push(`missing element ${tag}`);
      else if (
        got.attributes !== want.attributes ||
        got.properties !== want.properties ||
        got.methods !== want.methods
      )
        out.push(`surface changed ${tag}`);
    }
    for (const tag of per.keys())
      if (!(tag in (expected.elements ?? {}))) out.push(`unratcheted ${tag}`);
    if (docs !== expected.total) out.push('total mismatch');
    if (docs === 0) out.push('zero examined');
    return out;
  };

  const EXPECTED = JSON.parse(readFileSync('expected-docs.json', 'utf8'));
  const addProperty = (m, overrides = {}) => {
    const declaration = tagged(m)[0];
    declaration.members ??= [];
    declaration.members.push({
      kind: 'field',
      name: 'syntheticData',
      type: { text: 'ReadonlyArray<string>' },
      description: 'Structured test data.',
      'x-spec-kitty-property-only': true,
      ...overrides,
    });
    return declaration;
  };
  const PROBES = [
    ['the real manifest, untouched', null, (m) => m],
    [
      'an explicit documented public property-only field with a matching ratchet count',
      null,
      (m, expected) => {
        const declaration = addProperty(m);
        expected.elements[declaration.tagName].properties++;
        expected.total++;
        return m;
      },
    ],
    [
      'a property-only description blanked',
      'property ',
      (m) => {
        addProperty(m, { description: '' });
        return m;
      },
    ],
    [
      'a property-only marker weakened from exact true',
      'invalid property-only marker',
      (m) => {
        addProperty(m, { 'x-spec-kitty-property-only': 'true' });
        return m;
      },
    ],
    [
      'a property-only marker attached to internal state',
      'property-only internal state',
      (m) => {
        addProperty(m, { state: true });
        return m;
      },
    ],
    [
      'a property-only marker attached to a readonly field',
      'property-only non-settable',
      (m) => {
        addProperty(m, { readonly: true });
        return m;
      },
    ],
    [
      'a field published as both a property and an observed attribute',
      'both property-only and observed attribute',
      (m) => {
        const declaration = addProperty(m);
        declaration.attributes ??= [];
        declaration.attributes.push({
          name: 'synthetic-data',
          fieldName: 'syntheticData',
          description: 'Structured test data.',
        });
        return m;
      },
    ],
    [
      'an attribute description blanked',
      'attr ',
      (m) => {
        tagged(m)[1].attributes[0].description = '';
        return m;
      },
    ],
    [
      "an attribute description reduced to whitespace — `?? ''` alone would pass this",
      'attr ',
      (m) => {
        tagged(m)[1].attributes[0].description = '   \n  ';
        return m;
      },
    ],
    [
      'a public method description blanked',
      'method ',
      (m) => {
        const d = tagged(m).find((x) => (x.members ?? []).some((y) => y.kind === 'method'));
        d.members.find(
          (y) => y.kind === 'method' && y.privacy !== 'protected' && y.privacy !== 'private',
        ).description = '';
        return m;
      },
    ],
    [
      'a method with NO privacy field — the skip must not swallow it',
      'method ',
      (m) => {
        const d = tagged(m).find((x) => (x.members ?? []).some((y) => y.kind === 'method'));
        const mem = d.members.find(
          (y) => y.kind === 'method' && y.privacy !== 'protected' && y.privacy !== 'private',
        );
        delete mem.privacy;
        mem.description = '';
        return m;
      },
    ],
    [
      'THE VACUITY CASE: every element stripped of attributes, property-only fields, and methods, so the old ' +
        'declaration-only floor printed a green "all carry a description" over zero items',
      'zero examined',
      (m) => {
        for (const d of tagged(m)) {
          d.attributes = [];
          d.members = (d.members ?? []).filter(
            (y) => y.kind !== 'method' && y['x-spec-kitty-property-only'] !== true,
          );
        }
        return m;
      },
    ],
    [
      'one documented attribute silently removed — the count ratchet, in isolation',
      'surface changed',
      (m) => {
        tagged(m)[1].attributes.pop();
        return m;
      },
    ],
    [
      'a new element added without a row in expected-docs.json',
      'unratcheted',
      (m) => {
        m.modules[0].declarations.push({
          kind: 'class',
          name: 'SkGhost',
          tagName: 'sk-ghost',
          customElement: true,
          attributes: [{ name: 'a', fieldName: 'a', description: 'x' }],
          members: [],
        });
        return m;
      },
    ],
  ];

  let bad = 0;
  let caught = 0;
  for (const [note, expect, mutate] of PROBES) {
    const expected = JSON.parse(JSON.stringify(EXPECTED));
    const problemsFound = audit(mutate(clone(), expected), expected);
    const hit =
      expect === null ? problemsFound.length === 0 : problemsFound.some((p) => p.includes(expect));
    if (!hit) {
      console.error(
        `  ✗ ${note}\n     expected ${expect === null ? 'no problem' : JSON.stringify(expect)}, got ` +
          (problemsFound.length ? problemsFound.join('; ') : 'none'),
      );
      bad++;
    }
    if (expect !== null) caught++;
  }
  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  // Shrink-only floor on the table itself, named rather than a copied literal.
  const FLOOR = { mustCatch: 12, mustPass: 2 };
  if (caught < FLOOR.mustCatch || PROBES.length - caught < FLOOR.mustPass) {
    console.error(
      `\n❌ Degenerate probe table: ${caught} must-catch (floor ${FLOOR.mustCatch}), ` +
        `${PROBES.length - caught} must-pass (floor ${FLOOR.mustPass}).`,
    );
    process.exit(1);
  }
  console.log(
    `\n✅ All ${PROBES.length} probes behaved as recorded (${caught} must-catch, ` +
      `${PROBES.length - caught} must-pass).`,
  );
  process.exit(0);
}

const problems = [];
if (declared.length === 0) {
  problems.push(
    'the manifest declares NO custom elements at all — every `@element <tag>` JSDoc is ' +
      'missing, and the analyzer cannot follow the guarded define() helper without one',
  );
}
if (registered.size === 0) {
  problems.push(
    "no define('<tag>', …) call found in packages/elements/src — refusing to pass vacuously",
  );
}
for (const tag of registered) {
  if (!declared.some((d) => d.tag === tag)) {
    problems.push(
      `<${tag}> is registered in source but absent from the manifest — add an ` +
        `\`@element ${tag}\` JSDoc to its class (see packages/elements/src/define.ts)`,
    );
  }
}
for (const d of declared) {
  if (d.tag === 'tag')
    problems.push(`manifest declares an element literally named "tag" (${d.name})`);
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
        `module collide, and which declaration survives is iteration order`,
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
          `or point the path at one that is already exported.`,
      );
    } else if (err.code !== 'MODULE_NOT_FOUND' && err.code !== 'ERR_MODULE_NOT_FOUND') {
      problems.push(
        `module path "${mod.path}" failed to resolve as "${spec}": ${err.code ?? err.message}`,
      );
    }
  }
}

/**
 * EVERY PUBLIC ATTRIBUTE, PROPERTY-ONLY FIELD, AND METHOD CARRIES A DESCRIPTION — WP01's
 * Definition of Done, #75 and #149.
 *
 * The manifest is ADR-11's only input, and #126 made it consumer-facing: the React generator
 * copies `attributes[].description` into the emitted prop docs, so an attribute with none ships
 * `/** undefined *\/` into a consumer's editor. #129 cleared 22 of those blocks. Nothing held
 * them cleared.
 *
 * A RATCHET, because the two gates that already run are EQUALITY checks, not floors: the
 * manifest's `git diff --exit-code` and `build-react-wrappers.mjs --check` both compare
 * committed-to-regenerated. Delete a JSDoc, re-run `nx run elements:analyze`, regenerate the
 * wrappers, commit — everything agrees with everything, `undefined` is back, and CI is green.
 * That is the shape this repo keeps re-learning, and the reason `.wrapper-floor`,
 * `expected-parts.json` and `expected-stories.json` all exist.
 *
 * The floors below are not decoration. A gate that walks zero declarations and prints a green
 * line is the defect class this programme has hit often enough to name, so an empty examined
 * set fails, and a declaration is counted as examined even when it has nothing to examine —
 * `sk-stub` has zero attributes and zero public methods, and without the second floor a
 * regression could hide behind it.
 */
let examinedDeclarations = 0;
let examinedDocs = 0;
/** tag -> { attributes, properties, methods } actually found, for the ratchet below. */
const perElement = new Map();
for (const mod of manifest.modules ?? []) {
  for (const decl of mod.declarations ?? []) {
    if (!decl.tagName) continue;
    examinedDeclarations++;
    let attrCount = 0;
    let propertyCount = 0;
    let methodCount = 0;
    const attributedFields = new Set(
      (decl.attributes ?? []).map((attr) => attr.fieldName ?? attr.name),
    );

    for (const attr of decl.attributes ?? []) {
      examinedDocs++;
      attrCount++;
      if (!String(attr.description ?? '').trim()) {
        problems.push(
          `<${decl.tagName}> attribute "${attr.name}" has no description, so the generated ` +
            'React prop documents itself as `undefined`. Add JSDoc to the property that ' +
            'declares it — normalise-manifest.mjs propagates it, including from the base class.',
        );
      }
    }

    for (const mem of decl.members ?? []) {
      if (Object.hasOwn(mem, 'x-spec-kitty-property-only')) {
        if (mem['x-spec-kitty-property-only'] !== true) {
          problems.push(
            `<${decl.tagName}> field "${mem.name}" has a non-exact property-only marker. ` +
              'The only admitted value is boolean true.',
          );
        } else {
          examinedDocs++;
          propertyCount++;
          if (
            mem.kind !== 'field' ||
            mem.readonly ||
            mem.static ||
            mem.name.startsWith('#') ||
            mem.privacy === 'protected' ||
            mem.privacy === 'private'
          ) {
            problems.push(
              `<${decl.tagName}> field "${mem.name}" is marked property-only but is not a ` +
                'public settable field.',
            );
          }
          if (mem.state === true || mem['x-spec-kitty-internal-state'] === true) {
            problems.push(
              `<${decl.tagName}> field "${mem.name}" is internal state and cannot be property-only.`,
            );
          }
          if (attributedFields.has(mem.name)) {
            problems.push(
              `<${decl.tagName}> field "${mem.name}" is both property-only and an observed ` +
                'attribute. Structured property inputs must never be double-published.',
            );
          }
          if (!String(mem.description ?? '').trim()) {
            problems.push(
              `<${decl.tagName}> property-only field "${mem.name}" has no consumer-facing ` +
                'description, so the generated React prop would be undocumented.',
            );
          }
        }
      }
      if (mem.kind !== 'method') continue;
      if (mem.privacy === 'protected' || mem.privacy === 'private') continue;
      if (mem.name.startsWith('#')) continue;
      examinedDocs++;
      methodCount++;
      if (!String(mem.description ?? '').trim()) {
        problems.push(
          `<${decl.tagName}> public method "${mem.name}()" has no description; it reaches the ` +
            "wrapper's class-level `## Methods` block as `: undefined`.",
        );
      }
    }
    perElement.set(decl.tagName, {
      attributes: attrCount,
      properties: propertyCount,
      methods: methodCount,
    });
  }
}
// THE ANTI-VACUITY HALF, against a COMMITTED count. The first version of this block floored on
// `examinedDeclarations`, which is subsumed by the `declared.length === 0` check far above and
// so could never fire alone — while `examinedDocs`, the number that actually measures whether
// anything was examined, had no floor at all. A manifest with five tagged elements and zero
// attributes, zero property-only fields and zero methods printed
//
//     ✅ 0 public attribute(s), property-only field(s), and method(s) across 5 element(s).
//
// which is a green line over an empty set, in the gate whose docstring names that defect class.
// Both pre-merge lenses on #129 found it independently.
//
// EXACT equality per element, not a floor: deleting a documented prop or method is an API change
// and must be a deliberate line in expected-docs.json, not a number that quietly drops. A floor
// would also miss a swap — one added, one removed — which per-element equality catches.
const expectedDocs = JSON.parse(readFileSync('expected-docs.json', 'utf8'));
for (const [tag, want] of Object.entries(expectedDocs.elements ?? {})) {
  const got = perElement.get(tag);
  if (!got) {
    problems.push(
      `expected-docs.json records <${tag}> but the manifest declares no such element. If it was ` +
        'removed, remove its row in the same commit.',
    );
    continue;
  }
  if (
    got.attributes !== want.attributes ||
    got.properties !== want.properties ||
    got.methods !== want.methods
  ) {
    problems.push(
      `<${tag}> documented surface changed: expected ${want.attributes} attribute(s), ` +
        `${want.properties} property-only field(s), and ${want.methods} method(s); found ` +
        `${got.attributes}, ${got.properties}, and ${got.methods}. If that is ` +
        'intended, update expected-docs.json in the same commit and say why.',
    );
  }
}
for (const tag of perElement.keys()) {
  if (!(tag in (expectedDocs.elements ?? {}))) {
    problems.push(
      `<${tag}> is not in expected-docs.json. A new element must be added to the ratchet in the ` +
        'same commit, or its documentation is unheld.',
    );
  }
}
if (examinedDocs !== expectedDocs.total) {
  problems.push(
    `${examinedDocs} documented item(s) examined but expected-docs.json records ` +
      `${expectedDocs.total}.`,
  );
}
if (examinedDocs === 0) {
  problems.push(
    'zero public attributes, property-only fields, or methods were examined — refusing to ' +
      'report green over an empty ' +
      'set, whatever the per-element rows say.',
  );
}

if (problems.length) {
  console.error(`❌ ${MANIFEST} does not describe the package's elements (FR-006, SC-004):`);
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}
console.log(
  `✅ Manifest describes all ${registered.size} registered element(s) by real tag name: ` +
    declared.map((d) => `<${d.tag}> → ${d.name}`).join(', '),
);
console.log(
  `✅ ${examinedDocs} public attribute(s), property-only field(s), and method(s) across ` +
    `${examinedDeclarations} element(s) all carry a description.`,
);
