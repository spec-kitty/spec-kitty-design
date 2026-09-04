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
 * and invalid are all inheritedFrom FormControlBase with privacy public, and SEVEN of the
 * eight correctly become props. The eighth is errorMessage, excluded via
 * EXPECTED_NON_PROP_FIELDS below because the element observes no attribute for it. Implemented literally it would emit a form wrapper with no `value`.
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
import {
  cpSync, existsSync, globSync, mkdirSync, mkdtempSync, readdirSync, readFileSync,
  rmSync, statSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
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

/**
 * Public fields that are deliberately NOT props, with the reason. Asserted as a SET, so a field
 * that stops being deliverable starts failing instead of silently vanishing from the API.
 *
 * `errorMessage` is Lit `state: true` on both form elements: the element observes no attribute
 * for it. The analyzer does not honour `state`, so the manifest used to claim one, and #126's
 * pre-merge squad caught this gate reporting GREEN over that exact case — the guard read the
 * manifest's claim rather than the element's declaration. normalise-manifest.mjs now corrects
 * the manifest with a TypeScript AST pass, which is what makes the entry below derivable at all.
 *
 * Why it cannot simply stay a prop: `ssrSafe` defers registration, so React delivers
 * first-render props as ATTRIBUTES. `setAttribute('errorMessage', ...)` lowercases to
 * `errormessage`, Lit observes neither, and the value is dropped with no error and no warning.
 * `setCustomError()` is the element's own sanctioned lever for this state.
 */
const EXPECTED_NON_PROP_FIELDS = new Map([
  ['sk-form-input', ['errorMessage']],
  ['sk-form-textarea', ['errorMessage']],
  // DERIVED FROM SLOTTED CONTENT, so an attribute would let the two disagree. `hasLegal` is Lit
  // `state: true`, set from the legal slot's `slotchange`, and it exists so the divider is not
  // drawn above nothing. A consumer never sets it — they slot a legal line or they do not — so
  // "cannot reach the element on first render" is not a defect here: the slot content IS light
  // DOM and is present before upgrade, and the first render simply draws no divider until the
  // slotchange fires. Recorded rather than given an attribute, which is what this map is for.
  ['sk-site-footer', ['hasLegal']],
]);

const check = process.argv.includes('--check');
// REFUSED TOGETHER. `--selftest` is tested first and exits 0 without consulting `check`, so
// appending it to the drift step would turn an ENFORCED gate into a probe run that prints
// green. check-gate-wiring's entry now carries a negative lookahead for the same reason; this
// closes it at the other end, where a reader of the CI step will actually see it.
if (check && process.argv.includes('--selftest')) {
  console.error('❌ --check and --selftest are different jobs; run them as separate steps.');
  process.exit(1);
}
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
      const settable = (decl.members ?? [])
        // privacy is the discriminator. `inheritedFrom` is NOT: a public inherited field is
        // public API. See the header.
        .filter((m) => m.kind === 'field' && m.privacy !== 'protected' && m.privacy !== 'private')
        // readonly: a prop is settable, a getter is not. See manifestForGeneration().
        .filter((m) => !m.readonly && !m.static && !m.name.startsWith('#'))
        .map((m) => m.name);
      // field name -> the attribute name Lit actually OBSERVES. These differ: sk-nav-pill
      // declares `isOpen: { attribute: 'open' }`, so the field is `isOpen` and the observed
      // attribute is `open`. Keeping only the field name loses exactly the thing first-render
      // delivery depends on.
      const attrNameByField = new Map(
        (decl.attributes ?? []).map((a) => [a.fieldName ?? a.name, a.name])
      );
      const fields = [...new Set(settable)].filter((f) => attrNameByField.has(f)).sort();
      const unattributed = [...new Set(settable)].filter((f) => !attrNameByField.has(f)).sort();
      const events = (decl.events ?? []).map((e) => e.name).filter(Boolean).sort();
      out.set(decl.tagName, {
        name: decl.name,
        fields,
        unattributed,
        attrNameByField,
        events,
      });
    }
  }
  return out;
}

/**
 * Props a generated .d.ts declares, split into value props and event-handler props.
 *
 * The `on` prefix is a proxy for "event handler", so a real public field named `once` or
 * `online` would be classified as an event and reported as a mismatch. That fails LOUDLY
 * (the field is in `fields` and not in `values`), which is the safe direction, but it is a
 * proxy and not a fact — worth knowing before naming such a field.
 */
function emittedProps(dts) {
  const values = [];
  const handlers = [];
  for (const line of dts.split('\n')) {
    const m = /^\s{2}([A-Za-z_$][\w$]*)\??:/.exec(line);
    if (!m || REACT_PROPS.has(m[1])) continue;
    if (/^on[A-Z]/.test(m[1])) handlers.push(m[1]);
    else values.push(m[1]);
  }
  return {
    values: [...new Set(values)].sort(),
    handlers: [...new Set(handlers)].sort(),
  };
}

/** `sk-nav-pill-toggle` -> `onSkNavPillToggle`, the generator's handler-prop convention. */
function handlerName(eventName) {
  return 'on' + eventName.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
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
 *
 * 3. Members with no OBSERVED ATTRIBUTE are dropped, because under `ssrSafe` they cannot be
 *    delivered on first render — React has no upgraded element to assign a property to, so it
 *    writes an attribute, and there is none to write. See EXPECTED_NON_PROP_FIELDS.
 */
function manifestForGeneration(manifest) {
  return {
    ...manifest,
    modules: (manifest.modules ?? []).map((mod) => ({
      ...mod,
      declarations: (mod.declarations ?? [])
        .filter((d) => d.tagName)
        .map((d) => {
          const attributed = new Set(
            (d.attributes ?? []).map((a) => a.fieldName ?? a.name).filter(Boolean)
          );
          return {
            ...d,
            members: (d.members ?? []).filter((m) => {
              if (m.readonly) return false;
              // Keep methods and non-field members; only FIELDS become props.
              if (m.kind !== 'field') return true;
              if (m.static || m.name.startsWith('#')) return true;
              if (m.privacy === 'protected' || m.privacy === 'private') return true;
              return attributed.has(m.name);
            }),
          };
        }),
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
  // EXACT EQUALITY, not `>=`. After any write run the two are equal by construction, so
  // equality costs nothing — and `>=` leaves slack: edit .wrapper-floor down to 4 while five
  // wrappers are emitted and --check stays green, because the auto-raise only runs on a local
  // write and CI never performs one. A later commit could then remove an element under the
  // weakened floor with every gate green. Found at the pre-merge gate's second pass.
  if (emittedClasses.length !== floor) {
    problems.push(
      `${emittedClasses.length} wrapper(s) emitted but the committed floor is ${floor}. ` +
        'Refusing to report green over a shrunken set, or over a floor that has been slackened ' +
        'below the current count. If an element was deliberately removed, edit the floor in the ' +
        'same commit and say why.'
    );
  }

  // --- COUNT 1 == COUNT 2: disk vs manifest ---------------------------------------------
  // Also asserted by tests/node/config-contract.test.ts:236-252. Re-checked here because this
  // gate's whole argument is that two readings of one predicate cannot disagree.
  const tags = [...tagged.keys()].sort();
  if (JSON.stringify(tags) !== JSON.stringify(onDisk)) {
    problems.push(
      `the source glob and the manifest disagree about which elements exist.\n` +
        `   manifest: ${tags.join(', ') || '(none)'}\n   on disk:  ${onDisk.join(', ') || '(none)'}`
    );
  }

  // --- COUNT 2 == COUNT 3: manifest vs emitted ------------------------------------------
  const expectedClasses = [...tagged.values()].map((d) => d.name).sort();
  if (JSON.stringify(emittedClasses) !== JSON.stringify(expectedClasses)) {
    problems.push(
      `the emitted wrappers and the manifest's tagged declarations do not match.\n` +
        `   expected: ${expectedClasses.join(', ') || '(none)'}\n` +
        `   emitted:  ${emittedClasses.join(', ') || '(none)'}`
    );
  }

  // --- PROPS, per element ----------------------------------------------------------------
  for (const [tag, decl] of tagged) {
    const f = join(outdir, `${decl.name}.d.ts`);
    if (!existsSync(f)) continue; // already reported by the set comparison above
    const dts = readFileSync(f, 'utf8');
    const got = emittedProps(dts);
    const want = decl.fields;
    if (JSON.stringify(got.values) !== JSON.stringify(want)) {
      problems.push(
        `${decl.name} (${tag}) props do not match the manifest's attributed public fields.\n` +
          `   manifest: ${want.join(', ') || '(none)'}\n` +
          `   emitted:  ${got.values.join(', ') || '(none)'}`
      );
    }
    // A per-element floor. Set equality alone is satisfied by both sides being empty.
    if (want.length > 0 && got.values.length === 0) {
      problems.push(`${decl.name} emitted ZERO props for ${want.length} public field(s).`);
    }

    // --- EVENTS. The same argument as props, and the first draft did not apply it. ---------
    // File-set equality is insufficient because a generator emitting empty props objects
    // satisfies it; verbatim, a generator emitting no event handlers satisfies the props arm.
    // Only sk-nav-pill has an event today, so without this the NEXT element to gain a `@fires`
    // would get no handler prop and nothing would say so.
    const wantHandlers = decl.events.map(handlerName).sort();
    if (JSON.stringify(got.handlers) !== JSON.stringify(wantHandlers)) {
      problems.push(
        `${decl.name} (${tag}) event handlers do not match the manifest's events.\n` +
          `   manifest: ${wantHandlers.join(', ') || '(none)'}\n` +
          `   emitted:  ${got.handlers.join(', ') || '(none)'}`
      );
    }

    // --- THE EMITTED KEY MUST BE THE OBSERVED ATTRIBUTE NAME -------------------------------
    // Under ssrSafe React writes an ATTRIBUTE on first render, so the createElement key has to
    // be the name Lit observes, not the field name. These diverge exactly once today:
    // sk-nav-pill declares `isOpen: { attribute: 'open' }`, and the toolkit happens to emit
    // `open:`. Nothing read that emitted key, so a toolkit change dropping the rename would
    // emit `isOpen:` -> React writes `isopen` -> Lit observes `open` -> silently dropped, and
    // the byte-diff would red exactly once before "just regenerate" made it green forever.
    const js = join(outdir, `${decl.name}.js`);
    if (existsSync(js)) {
      const body = readFileSync(js, 'utf8');
      for (const field of want) {
        const attr = decl.attrNameByField.get(field);
        if (attr === field) continue; // no rename to verify
        const emitsAttr = new RegExp(`^\\s+${attr}:`, 'm').test(body);
        if (!emitsAttr) {
          problems.push(
            `${decl.name} (${tag}) renames ${field} -> attribute "${attr}", but the emitted\n` +
              `   createElement props do not carry a "${attr}" key. Under ssrSafe the first\n` +
              '   render writes an attribute, so the key must be the observed attribute name.'
          );
        }
      }
    }

    // WHICH PUBLIC FIELDS ARE NOT DELIVERABLE, asserted as a SET against a committed record.
    //
    // The first draft asserted "every prop has an attribute" and claimed to be "green on
    // arrival". It was green over a live counter-example: `errorMessage` is Lit `state: true`,
    // the element observes no attribute for it, and the analyzer recorded one anyway — so the
    // guard read the manifest's claim instead of the element's declaration and passed. Found by
    // #126's pre-merge squad. normalise-manifest.mjs now corrects the manifest at source.
    //
    // A set assertion rather than a floor: a field that stops being deliverable must start
    // FAILING, not quietly disappear from the published API.
    const expectedNonProp = [...(EXPECTED_NON_PROP_FIELDS.get(tag) ?? [])].sort();
    if (JSON.stringify(decl.unattributed) !== JSON.stringify(expectedNonProp)) {
      problems.push(
        `${decl.name} (${tag}) non-deliverable public field set changed.\n` +
          `   recorded: ${expectedNonProp.join(', ') || '(none)'}\n` +
          `   actual:   ${decl.unattributed.join(', ') || '(none)'}\n` +
          '   A public field with no observed attribute cannot reach the element on first\n' +
          '   render under ssrSafe. Give it an attribute, or add it to EXPECTED_NON_PROP_FIELDS\n' +
          '   with the reason in the same commit.'
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
  // DERIVED from the manifest the probes actually run against, not a literal.
  //
  // This was `= 5`, the element count on the day the probe table was written. `audit()` runs
  // over BASE_MANIFEST — the REAL packages/elements/custom-elements.json — so the first
  // mission to add an element made the must-pass row ("the real thing, untouched") report a
  // floor violation, and `--selftest` went red in CI on a tree where nothing was wrong. #77
  // added two elements and hit it. Every element-adding mission would have.
  //
  // The floor is a property of the fixture, so it is computed from the fixture. Note this does
  // NOT make the floor arm probed — no row asserts its message, which the SCOPE note above
  // already records as filed rather than bodged; it makes the arm stop firing spuriously.
  // `.size` — taggedDeclarations returns a MAP. `.length` on it is `undefined`, and the first
  // draft of this line used it: the floor became undefined, `emittedClasses.length !== undefined`
  // was true, and the probe failed with "the committed floor is undefined". The `< 1` guard
  // below did not catch it either, because `undefined < 1` is false — the exact comparison trap
  // this file already documents for NaN at the .wrapper-floor read. So the guard tests the TYPE.
  const FLOOR_UNDER_TEST = taggedDeclarations(BASE_MANIFEST).size;
  if (!Number.isInteger(FLOOR_UNDER_TEST) || FLOOR_UNDER_TEST < 1) {
    console.error(
      `❌ the self-test fixture floor computed as ${JSON.stringify(FLOOR_UNDER_TEST)}, not a\n` +
        '   positive integer. Either the fixture manifest declares no tagged elements — in which\n' +
        '   case every probe runs against an empty tree and the table is vacuous — or the count\n' +
        '   was read off the wrong shape.'
    );
    process.exit(1);
  }
  let bad = 0;
  let caught = 0;

  /**
   * Each row is [note, expect, mutate]. `expect` is a substring of the problem the row is
   * SUPPOSED to trigger, or null for a row that must pass cleanly.
   *
   * SCOPE: these rows exercise `audit`, which runs over a FRESHLY GENERATED tree. The orphan
   * sweep proper (a file committed under OUTDIR that the generator no longer emits) lives in
   * the `--check` branch and compares committed-vs-generated, so this table cannot reach it.
   * Its fail-closed behaviour was demonstrated by hand and recorded in the commit that added it;
   * bringing it under a probe needs the check path factored out, and is filed rather than
   * bodged in here. Two rows above previously CLAIMED to prove it and were in fact caught by
   * the set comparison — corrected rather than relabelled.
   *
   * Matching the message rather than `problems.length > 0` is the whole point. With a boolean,
   * three rows — including both rows that advertise the floor — passed because a DIFFERENT
   * assertion fired, and the floor blocks could be deleted with all eleven probes still
   * "behaving as recorded". #126's pre-merge squad traced that; the table now names its guard.
   */
  const PROBES = [
    ['the real thing, untouched', null, () => {}],
    [
      'a file in the output tree that no tagged declaration justifies (a stale wrapper left ' +
        'behind, in audit terms)',
      'do not match',
      ({ out }) => cpSync(join(out, 'SkCard.d.ts'), join(out, 'SkGone.d.ts')),
    ],
    [
      'a hand-added file in the output directory',
      'do not match',
      ({ out }) => writeFileSync(join(out, 'SkHand.d.ts'), 'export const hand = 1;\n'),
    ],
    [
      'one element missing from the emitted set while the manifest still declares it',
      'do not match',
      ({ out }) => {
        rmSync(join(out, 'SkCard.d.ts'));
        rmSync(join(out, 'SkCard.js'));
      },
    ],
    [
      'THE FLOOR IN ISOLATION: an element removed from disk AND from the manifest, so all ' +
        'three counts agree and only the committed ratchet objects',
      'Refusing to report green over a shrunken set',
      ({ probeDir, out, src }) => {
        rmSync(join(src, 'card'), { recursive: true, force: true });
        const mp = join(probeDir, 'manifest.json');
        const m = JSON.parse(readFileSync(mp, 'utf8'));
        for (const mod of m.modules ?? []) {
          mod.declarations = (mod.declarations ?? []).filter((d) => d.tagName !== 'sk-card');
        }
        writeFileSync(mp, JSON.stringify(m));
        rmSync(out, { recursive: true, force: true });
        mkdirSync(out, { recursive: true });
        generate(mp, out);
      },
    ],
    [
      'ALL elements deleted — the empty set, which build-elements-css.mjs still reports green ' +
        'over today (#123)',
      'Refusing to report green over a shrunken set',
      ({ out }) => {
        for (const f of readdirSync(out)) if (!NON_ELEMENT_FILES.has(f)) rmSync(join(out, f));
      },
    ],
    [
      'a declaration the generator skipped while the manifest still declares it — the ' +
        'TAUTOLOGY case, green if both sides read decl.tagName',
      'do not match',
      ({ out }) => {
        rmSync(join(out, 'SkStub.d.ts'));
        rmSync(join(out, 'SkStub.js'));
      },
    ],
    [
      'props silently dropped from a wrapper — file set still equal',
      'props do not match',
      ({ out }) => {
        const f = join(out, 'SkFormInput.d.ts');
        writeFileSync(f, readFileSync(f, 'utf8').replace(/^ {2}value\?:.*$/m, '  // gone'));
      },
    ],
    [
      'THE PER-ELEMENT PROP FLOOR IN ISOLATION: every prop stripped, file set intact',
      'emitted ZERO props',
      ({ out }) => {
        const f = join(out, 'SkFormInput.d.ts');
        const kept = readFileSync(f, 'utf8')
          .split('\n')
          .filter((l) => !/^ {2}[A-Za-z_$][\w$]*\??:/.test(l))
          .join('\n');
        writeFileSync(f, kept);
      },
    ],
    [
      'the ONE event handler dropped — the props arm alone does not see events',
      'event handlers do not match',
      ({ out }) => {
        const f = join(out, 'SkNavPill.d.ts');
        writeFileSync(
          f,
          readFileSync(f, 'utf8').replace(/^ {2}onSkNavPillToggle\?:.*$/m, '  // gone')
        );
      },
    ],
    [
      'the isOpen -> open attribute rename lost in the emitted runtime, so React would write ' +
        '"isopen" and Lit would observe nothing',
      'do not carry a "open" key',
      ({ out }) => {
        const f = join(out, 'SkNavPill.js');
        writeFileSync(f, readFileSync(f, 'utf8').replace(/^(\s+)open:/m, '$1isOpen:'));
      },
    ],
    [
      'the "use client" directive stripped — FR-009 decided, then silently undecided',
      'no "use client" directive',
      ({ out }) => {
        const f = join(out, 'SkCard.js');
        writeFileSync(f, readFileSync(f, 'utf8').replace('"use client";\n', ''));
      },
    ],
    [
      'a public field that loses its observed attribute — undeliverable on first render under ' +
        'ssrSafe, and the manifest cannot see Lit state: true unaided',
      'non-deliverable public field set changed',
      ({ probeDir, out }) => {
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
        // Only the MANIFEST is narrowed. The tree generated before this mutation already carries
        // `variant`, which is what makes this the undeliverable-field case rather than a plain
        // set mismatch — no regeneration is needed or performed. (An earlier version wrote the
        // file back byte-for-byte under a comment claiming it regenerated; a no-op under a false
        // comment, in the file whose thesis is that prose must not outrun code.)
      },
    ],
    [
      'the readonly filter removed, so a getter returns as a settable prop — the measured ' +
        'off-the-shelf defect this gate narrows the manifest to prevent',
      'props do not match',
      ({ out }) => {
        const f = join(out, 'SkFormInput.d.ts');
        const body = readFileSync(f, 'utf8').replace(
          /^ {2}value\?:/m,
          '  error?: SkFormInputElement["error"];\n  value?:'
        );
        writeFileSync(f, body);
      },
    ],
    [
      'an element on disk that the manifest does not declare — the analyzer dropped it',
      'source glob and the manifest disagree',
      ({ src }) => {
        mkdirSync(join(src, 'ghost'), { recursive: true });
        writeFileSync(join(src, 'ghost/sk-ghost.ts'), 'export class SkGhost {}\n');
      },
    ],
  ];

  try {
    for (const [i, [note, expect, mutate]] of PROBES.entries()) {
      const probeDir = join(dir, `probe-${i}`);
      const out = join(probeDir, 'out');
      const src = join(probeDir, 'src');
      mkdirSync(out, { recursive: true });
      cpSync(SRC, src, { recursive: true });
      const manifestPath = join(probeDir, 'manifest.json');
      writeFileSync(manifestPath, JSON.stringify(BASE_MANIFEST));
      generate(manifestPath, out);
      mutate({ out, src, probeDir });
      const problems = audit({
        outdir: out,
        manifestPath,
        srcDir: src,
        floor: FLOOR_UNDER_TEST,
      });
      const joined = problems.join('\n');
      const didCatch = expect === null ? problems.length === 0 : joined.includes(expect);
      const wanted = expect === null ? 'no problem' : `a problem matching ${JSON.stringify(expect)}`;
      if (!didCatch) {
        console.error(
          `  ✗ ${note}\n     expected ${wanted}, got ` +
            (problems.length
              ? `${problems.length} problem(s):\n       ${problems.join('\n       ')}`
              : 'none')
        );
        bad++;
      }
      if (expect !== null) caught++;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }

  /**
   * A SHRINK-ONLY FLOOR on the table itself, named rather than a copied literal.
   *
   * The first draft used `caught < 8` — lifted verbatim from check-elements-entries.mjs:90 —
   * against a table with 10 must-catch rows, so two probes could be deleted with the gate still
   * green, including the empty-set and tautology rows the header names as the reason this gate
   * exists. check-adopted-css-boundaries.mjs:240-251 already argues this against its own earlier
   * shape and uses a named two-dimensional floor; this follows it.
   */
  const FLOOR = { mustCatch: 14, mustPass: 1 };
  const mustPass = PROBES.length - caught;
  if (caught < FLOOR.mustCatch || mustPass < FLOOR.mustPass) {
    console.error(
      `\n❌ Degenerate probe table: ${caught} must-catch (floor ${FLOOR.mustCatch}), ` +
        `${mustPass} must-pass (floor ${FLOOR.mustPass}).\n` +
        '   Every form this gate has ever been defeated by must stay in the table, and at least\n' +
        '   one row must expect a clean pass — otherwise `audit` returning a constant passes.\n' +
        '   Raise the floor when you add a row; never lower it to make a deletion fit.'
    );
    process.exit(1);
  }
  console.log(
    `\n✅ All ${PROBES.length} probes behaved as recorded (${caught} must-catch, ${mustPass} must-pass).`
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
  // ABSENCE IS A FAILURE, not a floor of zero, and a non-integer is a failure too.
  //
  // The first draft read `existsSync(p) ? Number(...) : 0`, so deleting the file set the floor
    // to 0 and garbage in it produced NaN — and `n < NaN` is false. Both made the floor vacuous
  // in silence, which is the certifying-absence shape this whole file argues against.
  // check-part-ratchet.mjs:34-41 refuses absence for exactly this reason and says so.
  if (!existsSync(floorPath)) {
    console.error(
      `❌ ${floorPath} is missing. It is the committed wrapper-count ratchet; treating its` +
        ' absence as "no floor" is how a shrunken set ships. Restore it from git.'
    );
    process.exit(1);
  }
  const floorRaw = readFileSync(floorPath, 'utf8').trim();
  // >= 1, not >= 0. `/^\d+$/` admits "0", and `length < 0` is never true — a one-character
  // edit would make the ratchet vacuous while every message still read as if a floor applied.
  // This file's whole argument is that `> 0` is too weak; `>= 0` is weaker.
  if (!/^\d+$/.test(floorRaw) || Number(floorRaw) < 1) {
    console.error(
      `❌ ${floorPath} must be a positive integer (read ${JSON.stringify(floorRaw)}). A package\n` +
        '   that genuinely emits zero elements should delete this gate, not zero its floor.'
    );
    process.exit(1);
  }
  const floor = Number(floorRaw);
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
    // RATCHET UP ONLY. The first draft wrote the count unconditionally, so removing an element
    // rewrote 5 -> 4 as a side effect of the regenerate you are forced to run to make --check
    // green: the guard lowered itself, with no decision and no justification, exactly as its own
    // docstring instructed a human to do deliberately. Found by #126's pre-merge squad.
    if (count > floor) {
      writeFileSync(floorPath, `${count}\n`);
      console.log(`build-react-wrappers: floor raised ${floor} -> ${count}`);
    } else if (count < floor) {
      // UNREACHABLE in practice: audit() ran above with the same floor over the same tree and
      // exited. Kept as a backstop so the write path is safe if the two ever diverge — but
      // audit owns this failure, and its message is the one a reader will actually see.
      console.error(
        `❌ ${count} element(s) emitted but the committed floor is ${floor}.\n` +
          `   Refusing to lower it as a side effect. If an element was deliberately removed,\n` +
          `   edit ${floorPath} in the same commit and say why in the message.`
      );
      process.exit(1);
    }
    console.log(`build-react-wrappers: wrote ${generated.length} file(s) to ${OUTDIR} (${count} element(s))`);
  }
} finally {
  rmSync(fresh, { recursive: true, force: true });
}
