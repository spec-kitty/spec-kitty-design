#!/usr/bin/env node
/**
 * React wrappers, GENERATED from custom-elements.json (#75, ADR-11 behaviour 9).
 *
 * Same contract as build-elements-css.mjs and build-element-markup.mjs: output is committed and
 * `--check` fails CI on drift. Those two scripts do NOT agree with each other, and this one
 * takes the union rather than whichever half it happened to copy:
 *
 *   - build-element-markup.mjs:29-31 refuses to report green over an empty set.
 *     build-elements-css.mjs prints `✅ … (0 component(s))` and exits 0 — filed as #123.
 *   - build-elements-css.mjs:167-191 has an ORPHAN SWEEP. build-element-markup.mjs does not.
 *
 * Both halves are load-bearing, and a lens proved it in a throwaway repo: for a file the
 * generator no longer emits but that stays committed, `git diff --exit-code` is GREEN (nothing
 * changed) and a per-emitted-file compare is GREEN (never iterated). Only an expected-set sweep
 * catches it. The generator does not clean its outdir either — a planted STALE.d.ts survived
 * regeneration.
 *
 * THREE COUNTS, NOT TWO. The first draft of this gate asserted "emitted set == the manifest's
 * tagName-bearing declarations". That is a TAUTOLOGY: the generator filters on decl.tagName and
 * the assertion reads decl.tagName from the same manifest, so if the generator's effective
 * filter is narrower (it honours `exclude`, and skips declarations it cannot type) BOTH SIDES
 * SHRINK TOGETHER and the sets stay equal. build-elements-css.mjs:57-62 records the identical
 * defect — `expected` built from the same wrong mapping the generator used, so the orphan sweep
 * could not catch it either. Fixed there in f2c4508.
 *
 * So the chain is:  elements on disk  ==  manifest tagNames  ==  emitted files
 * The first link is already asserted by tests/node/config-contract.test.ts:236-252; this gate
 * adds the second and re-checks the first so neither end can drift alone.
 *
 * PROPS ARE COMPARED TOO. File-set equality is satisfied by a generator emitting empty props
 * objects: sk-form-input could drop from 10 props to 2 and every other criterion here stays
 * green. That is this programme's named defect one dimension in.
 *
 * The discriminator for a prop is `privacy`, NEVER `inheritedFrom`. FR-004 said "protected and
 * inheritedFrom-base members do not become props" through every draft and all three review
 * lenses, and it is wrong: value, label, name, required, disabled, description, errorMessage
 * and invalid are all inheritedFrom FormControlBase with privacy public, and all eight
 * correctly become props. Implemented literally it would emit a form wrapper with no `value`.
 *
 * OUTDIR IS UNDER src/, DELIBERATELY. `.gitignore:5-6` ignores `dist` both at the root and one level inside any package, and a
 * bare `dist/` matches a directory of that name at ANY depth. A TypeScript package's natural
 * outdir is packages/react/dist/ — which would make the whole committed artifact invisible to
 * git, `git diff` permanently green, and a fresh CI clone contain no wrappers. This is the
 * price build-elements-css.mjs already paid once; its docstring records it.
 *
 * ssrSafe: true. Measured, not assumed — it emits `"use client"` and moves the element import
 * into a useEffect, so the custom element registers after hydration instead of during a server
 * render where it cannot run at all. That is FR-009's decision, and it is greppable (SC-309)
 * rather than recorded in prose.
 */
import { execFileSync } from 'node:child_process';
import { globSync } from 'node:fs';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync,
  rmSync, statSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

/**
 * The generator reads package.json from `process.cwd()` AT MODULE LOAD and throws ENOENT
 * without one — it does not resolve relative to the manifest. Every path here is therefore
 * anchored to the repo root rather than to the caller's cwd. Assuming the cwd is exactly what
 * lets `build-elements-css.mjs --check` print green from /tmp (#123).
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);

const SRC = 'packages/elements/src';
const MANIFEST = 'packages/elements/custom-elements.json';
const OUTDIR = 'packages/react/src';
const MODULE = '@spec-kitty/elements';
/** Emitted by the generator for every run; carry no tagName and are not elements. */
const NON_ELEMENT_FILES = new Set(['index.d.ts', 'index.js', 'react-utils.js']);
/** Supplied by the generator's reactProps, not by the manifest. Excluded from prop comparison. */
const REACT_PROPS = new Set([
  'className', 'exportparts', 'htmlFor', 'key', 'part', 'ref', 'tabIndex', 'style', 'slot', 'id',
  'children', 'dangerouslySetInnerHTML',
]);

const check = process.argv.includes('--check');
const selftest = process.argv.includes('--selftest');

/** Elements as they exist ON DISK — the third count, which the generator never consults. */
function elementsOnDisk(src = SRC) {
  return globSync(`${src}/**/sk-*.ts`, {})
    .filter((f) => /^sk-[a-z0-9-]+\.ts$/.test(basename(f)))
    .map((f) => `sk-${basename(f).replace(/^sk-/, '').replace(/\.ts$/, '')}`)
    .sort();
}

/** Tagged declarations from the manifest, with their PUBLIC field names. */
function taggedDeclarations(manifest) {
  const out = new Map();
  for (const mod of manifest.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (!decl.tagName) continue;
      const fields = (decl.members ?? [])
        // privacy is the discriminator. `inheritedFrom` is NOT: a public inherited field is
        // public API. See the header.
        .filter((m) => m.kind === 'field' && m.privacy !== 'protected' && m.privacy !== 'private')
        // readonly: a prop is settable, a getter is not. See manifestForGeneration().
        .filter((m) => !m.readonly && !m.static && !m.name.startsWith('#'))
        .map((m) => m.name);
      const attributed = new Set(
        (decl.attributes ?? []).map((a) => a.fieldName ?? a.name).filter(Boolean)
      );
      out.set(decl.tagName, {
        name: decl.name,
        fields: [...new Set(fields)].sort(),
        attributed,
      });
    }
  }
  return out;
}

/** Props a generated .d.ts actually declares, minus the React-supplied ones. */
function emittedProps(dts) {
  const props = [];
  for (const line of dts.split('\n')) {
    const m = /^\s{2}([A-Za-z_$][\w$]*)\??:/.exec(line);
    if (m && !REACT_PROPS.has(m[1]) && !m[1].startsWith('on')) props.push(m[1]);
  }
  return [...new Set(props)].sort();
}

/**
 * The manifest the GENERATOR sees, narrowed by two derived rules — never a denylist.
 *
 * 1. Declarations with no `tagName` are dropped. Off the shelf the generator emits
 *    FormControlBase.d.ts: a full ForwardRefExoticComponent for an abstract class that
 *    `src/index.ts` does not export, so the emitted import is a TYPE ERROR, and
 *    FormControlBase.js emits React.createElement("undefined", …) — the literal string
 *    "undefined" as a tag name. `exclude: ['FormControlBase']` would fix today and miss the
 *    next non-element declaration; the manifest has six of them (CARD_VARIANTS, cardClasses,
 *    cardStaticHtml, isCardVariant, unknownVariantMessage, FormControlBase).
 *
 * 2. `readonly` fields are dropped, because a prop is settable and a getter is not. Measured:
 *    off the shelf the generator emits `error?: SkFormInputElement["error"]` — a WRITABLE prop
 *    for a member whose own docstring says "READ-ONLY, derived from validity — never a settable
 *    property". `<SkFormInput error="boom" />` would typecheck and then assign to a getter.
 *    Its treatment is also inconsistent: `validationMessage` and `validity` are readonly too and
 *    are NOT emitted. Consumers still read these through the typed ref, which is the correct
 *    channel. Filed upstream — see the mission's SC-305 answer.
 */
function manifestForGeneration(manifest) {
  return {
    ...manifest,
    modules: (manifest.modules ?? []).map((mod) => ({
      ...mod,
      declarations: (mod.declarations ?? [])
        .filter((d) => d.tagName)
        .map((d) => ({ ...d, members: (d.members ?? []).filter((m) => !m.readonly) })),
    })),
  };
}

/** Generate into `outdir`. Isolated in a child process: the generator mutates module state. */
function generate(manifestPath, outdir) {
  // Its own temp dir: writing beside `outdir` puts it in /tmp for the real run, where the
  // two --check passes and any concurrent invocation would race on one filename.
  const scratch = mkdtempSync(join(tmpdir(), 'react-wrappers-manifest-'));
  const narrowed = join(scratch, 'manifest-for-generation.json');
  writeFileSync(narrowed, JSON.stringify(manifestForGeneration(JSON.parse(readFileSync(manifestPath, 'utf8')))));
  const script = `
    const { generateReactWrappers } = require(${JSON.stringify(join(ROOT, 'node_modules/@wc-toolkit/react-wrappers'))});
    const m = require(${JSON.stringify(resolve(narrowed))});
    generateReactWrappers(m, {
      outdir: ${JSON.stringify(resolve(outdir))},
      modulePath: () => ${JSON.stringify(MODULE)},
      ssrSafe: true,
    });
  `;
  try {
    execFileSync(process.execPath, ['-e', script], { cwd: ROOT, stdio: 'pipe' });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/** Every regular file under `dir`, relative, sorted by CODEPOINT. */
function treeFiles(dir) {
  const out = [];
  const walk = (d, prefix) => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      // globSync and readdirSync both return directories whose names match a file glob —
      // check-part-ratchet.mjs:76-78 exists because __screenshots__/ matched *.test.ts.
      if (statSync(full).isDirectory()) walk(full, `${prefix}${entry}/`);
      else out.push(`${prefix}${entry}`);
    }
  };
  walk(dir, '');
  // Codepoint order, NOT localeCompare: ICU and LC_ALL=C disagree on punctuation, and that is
  // the mechanism that would make FR-003's byte-identical criterion flaky off ubuntu.
  return out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Every assertion, over a generated tree. Returns a list of problems.
 * Pulled out of the CLI paths so --selftest exercises THIS, not a paraphrase of it.
 */
function audit({ outdir, manifestPath, srcDir, floor }) {
  const problems = [];
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const tagged = taggedDeclarations(manifest);
  const onDisk = elementsOnDisk(srcDir);
  const files = treeFiles(outdir);

  const componentFiles = files.filter((f) => f.endsWith('.d.ts') && !NON_ELEMENT_FILES.has(f));
  const emittedClasses = componentFiles.map((f) => f.replace(/\.d\.ts$/, '')).sort();

  // --- FLOOR. A ratchet on a committed number, not `length > 0`. -------------------------
  // `> 0` is satisfied by ONE file: emit SkCard.d.ts alone, expected one, sets equal, green,
  // four of five elements missing. check-elements-entries.mjs:107-109 is the house pattern.
  if (emittedClasses.length < floor) {
    problems.push(
      `only ${emittedClasses.length} wrapper(s) emitted, floor is ${floor}. Refusing to report ` +
        'green over a shrunken set. If an element was deliberately removed, lower the floor in ' +
        'the same commit and say why.'
    );
  }

  // --- COUNT 1 == COUNT 2: disk vs manifest ---------------------------------------------
  // Also asserted by tests/node/config-contract.test.ts:236-252. Re-checked here because this
  // gate's whole argument is that two readings of one predicate cannot disagree.
  const tags = [...tagged.keys()].sort();
  if (JSON.stringify(tags) !== JSON.stringify(onDisk)) {
    problems.push(
      `the manifest's tagged declarations and the source glob disagree.\n` +
        `   manifest: ${tags.join(', ') || '(none)'}\n   on disk:  ${onDisk.join(', ') || '(none)'}`
    );
  }

  // --- COUNT 2 == COUNT 3: manifest vs emitted ------------------------------------------
  const expectedClasses = [...tagged.values()].map((d) => d.name).sort();
  if (JSON.stringify(emittedClasses) !== JSON.stringify(expectedClasses)) {
    problems.push(
      `the emitted wrappers and the manifest's tagged declarations disagree.\n` +
        `   expected: ${expectedClasses.join(', ') || '(none)'}\n` +
        `   emitted:  ${emittedClasses.join(', ') || '(none)'}`
    );
  }

  // --- PROPS, per element ----------------------------------------------------------------
  for (const [tag, decl] of tagged) {
    const f = join(outdir, `${decl.name}.d.ts`);
    if (!existsSync(f)) continue; // already reported by the set comparison above
    const got = emittedProps(readFileSync(f, 'utf8'));
    const want = decl.fields;
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      problems.push(
        `${decl.name} (${tag}) props do not match the manifest's public fields.\n` +
          `   manifest: ${want.join(', ') || '(none)'}\n   emitted:  ${got.join(', ') || '(none)'}`
      );
    }
    // A per-element floor. Set equality alone is satisfied by both sides being empty.
    if (want.length > 0 && got.length === 0) {
      problems.push(`${decl.name} emitted ZERO props for ${want.length} public field(s).`);
    }

    // EVERY PROP NEEDS AN ATTRIBUTE, and this is a consequence of the ssrSafe decision.
    //
    // ssrSafe defers `import("@spec-kitty/elements")` into a useEffect, so at FIRST render the
    // custom element is not yet defined — and React, with no property to assign to on an
    // unupgraded element, sets the value as an ATTRIBUTE. Measured in the React fixture: the
    // `value` attribute appears on the node even though `value: { type: String }` is NOT
    // reflected, so React put it there.
    //
    // It works today only because Lit maps that attribute back onto the property on upgrade.
    // A prop the manifest gives no attribute would be delivered to nothing on first render,
    // silently — no error, no warning, the element simply never receives it. Every prop has an
    // attribute right now, so this is green on arrival and exists to stay that way.
    const unattributed = want.filter((f) => !decl.attributed.has(f));
    if (unattributed.length) {
      problems.push(
        `${decl.name} (${tag}) has prop(s) with no attribute mapping: ${unattributed.join(', ')}.\n` +
          '   ssrSafe defers element registration, so React delivers first-render props as\n' +
          '   ATTRIBUTES. A prop with no attribute is dropped silently on first render. Either\n' +
          '   give the property an attribute, or drop the ssrSafe decision (FR-009) knowingly.'
      );
    }
  }

  // --- FR-009 / SC-309: the SSR decision is IN the output, not in prose -------------------
  // A .d.ts with no matching .js is its own defect — types for a component with no runtime.
  // Reported rather than thrown: the first draft crashed here on a probe instead of failing it.
  const orphanTypes = componentFiles
    .map((f) => f.replace(/\.d\.ts$/, '.js'))
    .filter((f) => !existsSync(join(outdir, f)));
  if (orphanTypes.length) {
    problems.push(`${orphanTypes.length} wrapper type(s) have no runtime file: ${orphanTypes.join(', ')}`);
  }
  const missingDirective = componentFiles
    .map((f) => f.replace(/\.d\.ts$/, '.js'))
    .filter((f) => existsSync(join(outdir, f)))
    .filter((f) => !readFileSync(join(outdir, f), 'utf8').startsWith('"use client"'));
  if (missingDirective.length) {
    problems.push(
      `${missingDirective.length} wrapper(s) carry no "use client" directive: ` +
        `${missingDirective.join(', ')}. FR-009 is decided as ssrSafe — a custom element cannot ` +
        'run in a server render, so registration is deferred to a client effect.'
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------------------
// --selftest: probe the ASSERTIONS, not a paraphrase of them.
//
// Every gate landed since f8af689 ships one of these. The first draft of this WP asked for a
// REQUIRED_LINT entry and no probe table, which is half the lesson from the episode it cited.
// ---------------------------------------------------------------------------------------
if (selftest) {
  const BASE_MANIFEST = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'react-wrappers-selftest-'));
  let bad = 0;
  let caught = 0;

  // Each probe mutates a freshly generated tree (or the manifest feeding it) and says whether
  // `audit` must report a problem. Every "must catch" form here is one this gate was written
  // for, or one that defeated an earlier draft of it.
  const PROBES = [
    ['the real thing, untouched', false, () => {}],
    [
      'a wrapper the generator no longer emits, left committed — git diff AND a per-file ' +
        'compare are both green on this',
      true,
      ({ out }) => cpSync(join(out, 'SkCard.d.ts'), join(out, 'SkGone.d.ts')),
    ],
    [
      'a hand-added file in the output directory',
      true,
      ({ out }) => writeFileSync(join(out, 'SkHand.d.ts'), 'export const hand = 1;\n'),
    ],
    [
      'one element deleted from the emitted set — the floor, not `length > 0`',
      true,
      ({ out }) => { rmSync(join(out, 'SkCard.d.ts')); rmSync(join(out, 'SkCard.js')); },
    ],
    [
      'ALL elements deleted — the empty set, which build-elements-css.mjs still reports green ' +
        'over today (#123)',
      true,
      ({ out }) => {
        for (const f of readdirSync(out)) if (!NON_ELEMENT_FILES.has(f)) rmSync(join(out, f));
      },
    ],
    [
      'a declaration the generator skipped while the manifest still declares it — the ' +
        'TAUTOLOGY case, green if both sides read decl.tagName',
      true,
      ({ out }) => { rmSync(join(out, 'SkStub.d.ts')); rmSync(join(out, 'SkStub.js')); },
    ],
    [
      'props silently dropped from a wrapper — file set still equal',
      true,
      ({ out }) => {
        const f = join(out, 'SkFormInput.d.ts');
        writeFileSync(f, readFileSync(f, 'utf8').replace(/^ {2}value\?:.*$/m, '  // gone'));
      },
    ],
    [
      'a wrapper emitting NO props at all for an element that has ten',
      true,
      ({ out }) => {
        const f = join(out, 'SkFormInput.d.ts');
        writeFileSync(f, readFileSync(f, 'utf8').replace(/^ {2}\w+\?:.*$/gm, ''));
      },
    ],
    [
      'the "use client" directive stripped — FR-009 decided, then silently undecided',
      true,
      ({ out }) => {
        const f = join(out, 'SkCard.js');
        writeFileSync(f, readFileSync(f, 'utf8').replace('"use client";\n', ''));
      },
    ],
    [
      'a prop the manifest gives no attribute — silently undelivered on first render under ' +
        'ssrSafe, because React has no upgraded element to assign a property to',
      true,
      ({ probeDir, out }) => {
        // Strip sk-card's `variant` attribute while leaving the field, then regenerate so the
        // emitted prop set still contains it. The audit must notice the prop can only be
        // delivered as an attribute that no longer exists.
        const mp = join(probeDir, 'manifest.json');
        const m = JSON.parse(readFileSync(mp, 'utf8'));
        for (const mod of m.modules ?? []) {
          for (const d of mod.declarations ?? []) {
            if (d.tagName === 'sk-card') {
              d.attributes = (d.attributes ?? []).filter(
                (a) => (a.fieldName ?? a.name) !== 'variant'
              );
            }
          }
        }
        writeFileSync(mp, JSON.stringify(m));
        generate(mp, out);
      },
    ],
    [
      'an element on disk that the manifest does not declare — the analyzer dropped it',
      true,
      ({ src }) => {
        mkdirSync(join(src, 'ghost'), { recursive: true });
        writeFileSync(join(src, 'ghost/sk-ghost.ts'), 'export class SkGhost {}\n');
      },
    ],
  ];

  try {
    for (const [note, mustCatch, mutate] of PROBES) {
      const probeDir = join(dir, `probe-${PROBES.indexOf(PROBES.find(([n]) => n === note))}`);
      const out = join(probeDir, 'out');
      const src = join(probeDir, 'src');
      mkdirSync(out, { recursive: true });
      cpSync(SRC, src, { recursive: true });
      const manifestPath = join(probeDir, 'manifest.json');
      writeFileSync(manifestPath, JSON.stringify(BASE_MANIFEST));
      generate(manifestPath, out);
      mutate({ out, src, probeDir });
      const problems = audit({ outdir: out, manifestPath, srcDir: src, floor: 5 });
      const didCatch = problems.length > 0;
      if (didCatch !== mustCatch) {
        console.error(
          `  ✗ ${note}\n     expected ${mustCatch ? 'a problem' : 'no problem'}, got ` +
            `${didCatch ? problems.length + ' problem(s)' : 'none'}`
        );
        bad++;
      }
      if (mustCatch) caught++;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  // A table with no "must catch" rows would pass with `audit` stubbed to return [].
  if (caught < 8 || caught === PROBES.length) {
    console.error(
      `\n❌ Degenerate probe table: ${caught} must-catch row(s) of ${PROBES.length}. Every form ` +
        'this gate has ever been defeated by must stay in the table, and at least one row must ' +
        'expect a clean pass — otherwise `audit` returning a constant satisfies it.'
    );
    process.exit(1);
  }
  console.log(
    `\n✅ All ${PROBES.length} probes behaved as recorded (${caught} must-catch, ` +
      `${PROBES.length - caught} must-pass).`
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------------------
// Normal and --check paths.
// ---------------------------------------------------------------------------------------

// The outdir must be TRACKED. A dist/ path is silently ignored by git, which makes `git diff`
// permanently green and leaves a fresh CI clone with no wrappers at all.
if (/(^|\/)dist(\/|$)/.test(OUTDIR)) {
  console.error(`❌ OUTDIR ${OUTDIR} is under a dist/ path, which .gitignore ignores.`);
  process.exit(1);
}

const fresh = mkdtempSync(join(tmpdir(), 'react-wrappers-'));
try {
  generate(MANIFEST, fresh);

  const floorPath = 'packages/react/.wrapper-floor';
  const floor = existsSync(floorPath) ? Number(readFileSync(floorPath, 'utf8').trim()) : 0;
  const problems = audit({ outdir: fresh, manifestPath: MANIFEST, srcDir: SRC, floor });
  if (problems.length) {
    console.error('❌ build-react-wrappers:\n' + problems.map((p) => `   ${p}`).join('\n'));
    process.exit(1);
  }

  const generated = treeFiles(fresh);

  if (check) {
    if (!existsSync(OUTDIR)) {
      console.error(`❌ ${OUTDIR} does not exist. Run: node scripts/build-react-wrappers.mjs`);
      process.exit(1);
    }
    const committed = treeFiles(OUTDIR);

    // ORPHAN SWEEP FIRST, and it hard-exits. A file the generator no longer emits is green
    // under `git diff --exit-code` (nothing changed) and green under a per-emitted-file
    // compare (never iterated). Only this catches it.
    const orphans = committed.filter((f) => !generated.includes(f));
    if (orphans.length) {
      console.error(
        `❌ ${orphans.length} file(s) in ${OUTDIR} the generator does not emit:\n` +
          orphans.map((f) => `   ${f}`).join('\n') +
          '\n   The generator does not clean its outdir, so these survive regeneration ' +
          'and drift silently.'
      );
      process.exit(1);
    }

    const missing = generated.filter((f) => !committed.includes(f));
    const drifted = generated
      .filter((f) => committed.includes(f))
      .filter((f) => readFileSync(join(fresh, f), 'utf8') !== readFileSync(join(OUTDIR, f), 'utf8'));

    if (missing.length || drifted.length) {
      console.error(`❌ ${OUTDIR} is stale. Run: node scripts/build-react-wrappers.mjs`);
      for (const f of missing) console.error(`   missing:  ${f}`);
      for (const f of drifted) console.error(`   drifted:  ${f}`);
      process.exit(1);
    }

    // FR-003 / SC-302: regenerating from an unchanged manifest is a no-op. Asserted by
    // generating TWICE, not by trusting that the first run was deterministic. Only achievable
    // because #74's normalise-manifest.mjs fixed the analyzer's declaration order — without
    // it this is flaky by construction, and the flake looks like a generator defect.
    const second = mkdtempSync(join(tmpdir(), 'react-wrappers-2nd-'));
    try {
      generate(MANIFEST, second);
      const a = treeFiles(fresh);
      const b = treeFiles(second);
      const differ = JSON.stringify(a) !== JSON.stringify(b)
        ? ['the two runs emitted different file sets']
        : a.filter((f) => readFileSync(join(fresh, f), 'utf8') !== readFileSync(join(second, f), 'utf8'));
      if (differ.length) {
        console.error(
          `❌ Two runs on an unchanged manifest are not identical (FR-003):\n` +
            differ.map((f) => `   ${f}`).join('\n')
        );
        process.exit(1);
      }
    } finally {
      rmSync(second, { recursive: true, force: true });
    }

    console.log(
      `✅ ${OUTDIR} is up to date (${generated.length} file(s), ` +
        `${generated.filter((f) => f.endsWith('.d.ts') && !NON_ELEMENT_FILES.has(f)).length} element(s)), ` +
        'and two runs are byte-identical.'
    );
  } else {
    rmSync(OUTDIR, { recursive: true, force: true });
    mkdirSync(OUTDIR, { recursive: true });
    for (const f of generated) {
      mkdirSync(dirname(join(OUTDIR, f)), { recursive: true });
      cpSync(join(fresh, f), join(OUTDIR, f));
    }
    const count = generated.filter((f) => f.endsWith('.d.ts') && !NON_ELEMENT_FILES.has(f)).length;
    writeFileSync(floorPath, `${count}\n`);
    console.log(`build-react-wrappers: wrote ${generated.length} file(s) to ${OUTDIR} (${count} element(s))`);
  }
} finally {
  rmSync(fresh, { recursive: true, force: true });
}
