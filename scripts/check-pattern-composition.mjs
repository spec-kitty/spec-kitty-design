#!/usr/bin/env node
/**
 * EPIC #183's LAST EXIT CRITERION, MADE FALSIFIABLE (#259).
 *
 * > A composition fixture demonstrates that the [operational dashboard] patterns can be
 * > assembled from public surfaces without private shadow-root reach-through or duplicated
 * > component CSS.
 *
 * That sentence contains TWO CLAIMS, and a fixture that merely renders asserts both without
 * being able to fail either. This programme shipped five greens over unfalsifiable things in the
 * week before this gate was written — #193's probe table tripping on collateral, #197's
 * collapsed extractor, #232's ungated derivation, #234's heading hidden from the a11y tree with
 * the test still green, #249's inert mutation filter — so the epic's own closing artifact gets a
 * gate rather than a promise.
 *
 * WHY A NEW GATE AND NOT AN EXISTING ONE. `check-adopted-css-boundaries.mjs` was assumed to
 * cover the reach-through half. It does not reach a pattern fixture, and the assumption was
 * MEASURED rather than reasoned about: four cross-root selectors and two duplicated-component
 * rules planted into the inline `<style>` of `packages/elements/src/patterns/
 * team-overview.stories.ts` left it printing the identical line —
 *
 *     ✅ No cross-root selectors: 28 of 28 element(s) checked, 30 adopted stylesheet(s), 451 rule(s).
 *
 * — at exit 0, with the same 451 rules and 30 sheets as the clean tree. Its scope is
 * `globSync('packages/elements/src/**\/sk-*.ts')` narrowed by `/^sk-[a-z0-9-]+\.ts$/`, then the
 * sheets each ELEMENT ADOPTS through its own `./sk-*.css.js` imports; a `.stories.ts` matches
 * neither half of that derivation. `check-element-css-hygiene.mjs`,
 * `check-no-css-in-source.mjs`, `check-part-ratchet.mjs` and `check-story-theme-wrapper.mjs`
 * were green over the same plant, and `quality:stylelint` globs `packages/**\/*.css` so it never
 * parses an inline `<style>` inside a `.ts` at all. A pattern fixture's CSS was subject to no
 * check of any kind.
 *
 * THE TWO GATES ALSO POINT IN OPPOSITE DIRECTIONS, which is why widening the old one would have
 * been the wrong repair even where its glob could be made to reach. ADR-9 Confirmation #1 asks
 * whether an element's OWN ADOPTED SHEET reaches OUT of its root. This criterion asks whether a
 * CONSUMER reaches IN to a component's private root. Same words, different assertion.
 *
 * ── WHAT IS CHECKED ────────────────────────────────────────────────────────────────────────
 *
 * Over every `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs` and `.css` file under
 * `packages/elements/src/patterns/`:
 *
 *   R1  No reach into a private root: `.shadowRoot`, `attachShadow(`, `::shadow`, `/deep/`,
 *       `>>>`, and two spellings that are not evasions at all but the NATURAL ones —
 *       `.renderRoot`, Lit's own public alias for the shadow root on every element in this repo,
 *       and `getRootNode()`, the standard un-deprecated way to obtain one. Also the property
 *       NAMED AS A STRING, which closes bracket access, `Reflect.get` and
 *       `getOwnPropertyDescriptor(...).get.call` with one pattern instead of an enumeration.
 *       And no runtime CSS injection, whose text no static rule below could read.
 *
 *   R2  Every `::part(name)` resolves to an ELEMENT and that element records that part in
 *       `expected-parts.json`. `::part()` is the sanctioned seam, but only for parts the
 *       shrink-only public ratchet actually carries: a part the manifest does not declare is as
 *       private as a shadow child. The element is resolved from a type selector, or from the
 *       class this fixture's own markup binds to exactly one `sk-` tag.
 *
 *   R3  No duplicated component CSS, in FOUR spellings, because the first three of them name no
 *       library class and a class-only rule is therefore a naming convention rather than a rule:
 *         * a selector naming a class a `packages/styles` sheet OWNS — through a class selector
 *           or any `[class]` attribute operator, with CSS and JS escapes decoded first;
 *         * a bare UNSCOPED `sk-*` type selector, which restyles every instance in the document;
 *         * a bare type selector for a native tag this fixture's own markup gives a library-owned
 *           class to — the `.x dt { … }` that restates `.sk-facts__term` with the class left out,
 *           which is the most realistic spelling of this defect because #176's primitives are
 *           light-DOM classes on native tags;
 *         * `@import`, which pulls in CSS `walkRules()` never visits.
 *       USING an owned class in MARKUP is composition and stays legal — every rule here is about
 *       writing CSS *for* it. A type selector SCOPED by a fixture class also stays legal: that
 *       places the host in the page rather than reaching into the component, and both fixtures in
 *       this directory rely on it.
 *
 *   R4  Floors, because every rule above passes vacuously over an empty set. No fixtures, no
 *       owned classes, no recorded parts, an unreadable `expected-parts.json`, a file that does
 *       not parse, a `<style>` block that parsed to no rules, or a patterns directory composing
 *       fewer than MIN_COMPOSED_TAGS distinct `sk-` element tags, are each a refusal rather than
 *       a green line.
 *
 * ── WHAT IS DELIBERATELY NOT CHECKED, AND WHY ──────────────────────────────────────────────
 *
 * A gate that states its boundaries is honest; one that reads as total and is not is the defect
 * this file exists to refuse. Each limit below was MEASURED, not assumed.
 *
 * THE BEHAVIOUR AND BROWSER SUITES. `fixtures/elements-behaviour/` and `tests/browser/` are out
 * of scope and must stay so. Those suites reach `element.shadowRoot` on purpose — that is how a
 * test VERIFIES that a public surface produced the right private structure, and 30 existing files
 * do it. Scoping R1 to them would red the suite that proves the criterion holds.
 *
 * ONE DIRECTORY, BY CONVENTION. The criterion is enforced for `packages/elements/src/patterns/`
 * and nowhere else. A composition fixture placed at, say, `apps/storybook/patterns/` is entirely
 * outside this gate. That is a CONVENTION, stated as one: this gate cannot make "wherever someone
 * puts a pattern fixture" decidable, and the honest form of that is to name the directory rather
 * than to imply a reach it does not have.
 *
 * `style="…"` ATTRIBUTES. Not read. #177's own composition story sets
 * `style="margin-block-start:var(--sk-space-4)"` on a slotted `<dl>`, and that is ordinary
 * consumer layout; deciding whether an arbitrary inline declaration "restates component CSS"
 * is not decidable from the attribute, and a rule that reds the legitimate case gets deleted.
 *
 * OVERRIDING A `--sk-*` TOKEN IS NOT A VIOLATION — it is the DOCUMENTED PUBLIC API, and this was
 * checked against doctrine before being declined rather than after. ADR-9: "Consumers lose
 * arbitrary class-based overrides and gain only what `::part()` and the documented custom
 * properties expose", and "custom properties are the one thing that crosses a shadow boundary
 * unimpeded". `docs/design-system/using-components.md` says in as many words: "you override the
 * token." A fixture setting `--sk-surface-card` is therefore USING the styling API, not
 * duplicating component CSS, and R3 leaves it alone on purpose.
 *
 * SK-D01, THE TOKENS-ONLY RULE, IS NOT ENFORCED HERE. `quality:stylelint` globs
 * `packages/**\/*.css`, so a raw `#fff` or a bare `12px` inside an inline `<style>` in a `.ts` is
 * linted by nothing — including this gate. Reproducing `stylelint-declaration-strict-value`'s
 * property list against the generated token catalogue is disproportionate machinery for one
 * directory, so it is named as an open limit instead. An earlier revision of the fixture's own
 * docstring claimed this gate covered it; that claim was false and has been withdrawn.
 *
 * `new CSSStyleSheet(` AND `unsafeCSS(` ARE A NEIGHBOUR'S JOB, not an omission.
 * `check-no-css-in-source.mjs` rejects both anywhere under `packages/elements` — verified by
 * planting `new CSSStyleSheet()` + `replaceSync('.sk-card { border: 0 }')` into this directory's
 * fixture and watching that gate name the file and the line. Restating them here would be a
 * second copy of an enforced rule, which this repo has removed four times. The same gate also
 * rejects any `.css` file under `packages/elements`, so R3's `.css` arm is defence in depth.
 *
 * R1'S RESIDUAL, NAMED. The string-literal rule closes every spelling that writes the property
 * name out, and esbuild's constant folding extends that further than it looks: `"shadow" +
 * "Root"` is folded to `"shadowRoot"` in the rendition and IS caught — measured, not assumed.
 * What escapes is a key assembled at RUNTIME, `['shadow','Root'].join('')`, which no static check
 * can decide. An AST walk would not close that either, so the limit is stated rather than chased.
 *
 * PARSED, NOT GREPPED. esbuild strips comments before the source rules run, for the reason
 * `check-no-css-in-source.mjs` states at length: a regex "comment stripper" also blanks
 * comment-shaped text inside string literals, and one apostrophe then disables every check for
 * the rest of the file. This file's OWN docstring names `.shadowRoot`, `::shadow` and `/deep/`
 * repeatedly, and the fixtures' docstrings do too — none of it may flag. postcss, not a regex,
 * reads the extracted CSS, for the reason `check-adopted-css-boundaries.mjs` states: a
 * functional pseudo-class hides its argument list from a regex.
 *
 * Usage: node scripts/check-pattern-composition.mjs [--selftest]
 */
import { cpSync, globSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import postcss from 'postcss';

const SCAN = 'packages/elements/src/patterns/**/*.{ts,tsx,js,mjs,cjs,css}';
const PARTS_FILE = 'expected-parts.json';

/** A patterns directory composing fewer than this many distinct `sk-` tags is not composing. */
const MIN_COMPOSED_TAGS = 3;
/** Below this the owned-class set is broken, and R3 would pass over anything. */
const MIN_OWNED_CLASSES = 20;

// ── R1: constructs that reach a private root ─────────────────────────────────────────────────
//
// Stated over the COMMENT-STRIPPED rendition. `>>>` is checked only inside extracted CSS: in
// JavaScript it is the unsigned right shift, and a gate that reds `a >>> b` is a gate that gets
// deleted. The other five cannot mean anything else in this directory.
const REACH_THROUGH = [
  [/\.shadowRoot\b/, '`.shadowRoot` — reads a private root the consumer does not own'],
  [/\bshadowRoot\s*\?\./, '`shadowRoot?.` — same reach, optional-chained'],
  [/\battachShadow\s*\(/, '`attachShadow(` — a fixture composes elements, it does not build roots'],
  // LIT'S OWN PUBLIC ALIAS FOR THE SHADOW ROOT, and in this repo the NATURAL spelling rather than
  // an evasion — `ReactiveElement.renderRoot` is documented API and every element here is a
  // LitElement. An implementer reaching for a component's internals from a fixture writes this
  // one innocently, which makes it the single most important string in this list.
  [/\.renderRoot\b/, "`.renderRoot` — Lit's public alias for the shadow root; same reach"],
  // The standard, un-deprecated way to obtain a root. `el.getRootNode()` from inside a component's
  // subtree returns its ShadowRoot, so this is `.shadowRoot` spelled through the DOM API.
  [/\bgetRootNode\s*\(/, '`getRootNode(` — returns the ShadowRoot; same reach through the DOM API'],
  // THE BRACKET AND REFLECTION SPELLINGS, closed by ONE rule rather than an enumeration.
  // `e['shadowRoot']`, `Reflect.get(e, 'shadowRoot')`,
  // `Object.getOwnPropertyDescriptor(Element.prototype, 'shadowRoot').get.call(e)` and a computed
  // key all share one property: every one of them must NAME the property as a string literal
  // somewhere in the source. Matching the quoted name catches the whole family at the cost of a
  // single pattern, and there is no legitimate reason for a composition fixture to contain that
  // string at all.
  [/['"`](?:shadowRoot|renderRoot)['"`]/, 'the shadow root named as a string — bracket access, `Reflect.get`, or a computed key'],
];

/**
 * Runtime CSS injection, which no composition fixture has a reason to do.
 *
 * A fixture that builds a stylesheet at runtime puts its CSS outside every static rule below —
 * R2 and R3 read `<style>` bodies, and a string handed to `insertRule()` is not one.
 *
 * `new CSSStyleSheet(` and `unsafeCSS(` are DELIBERATELY ABSENT: `check-no-css-in-source.mjs`
 * already rejects both anywhere under `packages/elements`, verified by planting
 * `new CSSStyleSheet()` + `replaceSync('.sk-card { border: 0 }')` into this directory's fixture
 * and watching that gate name the file and the line. Restating them here would be a second copy
 * of a rule that is already enforced, which this repo has removed four times.
 */
const RUNTIME_CSS = [
  [/createElement\s*\(\s*['"`]style['"`]/i, "`createElement('style')` — injects CSS no static rule here can read"],
  [/\.insertRule\s*\(/, '`insertRule(` — injects a rule no static rule here can read'],
  [/\.replaceSync\s*\(|\.replace\s*\(\s*[`'"][^`'"]*\{/, '`replaceSync(`/`replace(` on a stylesheet — same'],
];
const CSS_PIERCING = [
  [/::shadow\b/, '`::shadow` — a removed piercing combinator'],
  [/\/deep\//, '`/deep/` — a removed piercing combinator'],
  [/>>>/, '`>>>` — a removed piercing combinator'],
];

/**
 * Comments removed by a real lexer. A file esbuild cannot parse FAILS rather than being skipped:
 * "could not be checked" and "was checked and is clean" must never print the same line.
 */
// ── Shared derivation primitives ────────────────────────────────────────────────────────────
//
// Moved to pattern-composition-lib.mjs (no `import.meta` anywhere in that file) so #418's DOM
// arm can import `ownedClasses()` and its siblings from a Playwright spec without pulling in
// this file's CLI tail — MEASURED: importing THIS file after only a `process.exit()` guard was
// added still broke Playwright's CJS test bundle with `SyntaxError: Cannot use 'import.meta'
// outside a module`, because `import.meta.url` appears elsewhere in this file (the `--selftest`
// sandbox) regardless of whether the guarded CLI branch runs. Re-exported here so this file's
// own previously-exported names (`ownedClasses` etc.) are unchanged for any other consumer.
import {
  OWNED_SHEETS,
  bemBlockRoots,
  classTagBindings,
  classesIn,
  knownElementTags,
  leadingTag,
  localClassesIn,
  ownedClasses,
  partsIn,
  skPrimitivesIn,
  stripComments,
  styleBlocks,
  tokensOwnedClasses,
  trailingBareTag,
} from './pattern-composition-lib.mjs';
export {
  OWNED_SHEETS,
  bemBlockRoots,
  classTagBindings,
  classesIn,
  knownElementTags,
  leadingTag,
  localClassesIn,
  ownedClasses,
  partsIn,
  skPrimitivesIn,
  stripComments,
  styleBlocks,
  tokensOwnedClasses,
  trailingBareTag,
};


export function run(root = '.') {
  const violations = [];
  const notes = { files: 0, rules: 0, parts: 0, tags: new Set() };

  // ── The two derived inputs, each with its own floor. ──
  const owned = ownedClasses(root);
  if (owned.size < MIN_OWNED_CLASSES) {
    violations.push(
      `the owned-class set has ${owned.size} entr(ies), below the floor of ${MIN_OWNED_CLASSES} — ` +
        `R3 would accept anything. Check the ${OWNED_SHEETS} glob.`,
    );
  }

  let recordedParts;
  try {
    recordedParts = JSON.parse(readFileSync(join(root, PARTS_FILE), 'utf8')).byElement ?? {};
  } catch (err) {
    return { violations: [`${PARTS_FILE} could not be read: ${err?.message ?? err}`], notes };
  }
  const totalParts = Object.values(recordedParts).reduce((n, list) => n + list.length, 0);
  notes.parts = totalParts;
  if (totalParts === 0) {
    violations.push(`${PARTS_FILE} records no parts — R2 would accept anything.`);
  }

  const ownedNames = [...owned.keys()];

  const files = globSync(join(root, SCAN), {}).sort();
  notes.files = files.length;
  if (files.length === 0) {
    violations.push(`no pattern fixture matched ${SCAN} — refusing to report green over nothing.`);
  }

  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    // A `.css` file IS one style block, and postcss handles its comments — esbuild would reject
    // it outright. Note such a file is ALSO a hard red in `check-no-css-in-source.mjs`, whose
    // stray-stylesheet glob covers all of `packages/elements`; it is scanned here so that this
    // gate's own counts describe everything in the directory rather than resting on a neighbour.
    const isCss = file.endsWith('.css');
    let rendition;
    if (isCss) {
      rendition = '';
    } else {
      try {
        rendition = stripComments(raw, file);
      } catch (err) {
        violations.push(`${file} does not parse — it cannot be checked: ${err?.message ?? err}`);
        continue;
      }
    }

    // R1 over source.
    for (const [re, why] of REACH_THROUGH) {
      if (re.test(rendition)) violations.push(`${file} — ${why}`);
    }
    for (const [re, why] of RUNTIME_CSS) {
      if (re.test(rendition)) violations.push(`${file} — ${why}`);
    }

    // Which elements this fixture composes, for R4's floor.
    for (const m of rendition.matchAll(/<\s*(sk-[a-z0-9-]+)/g)) notes.tags.add(m[1]);

    // Which element each of this fixture's classes sits on, for R2's class spelling, and the
    // reverse index — which classes each TAG carries — for R3's light-DOM primitive rule.
    const classToTags = classTagBindings(rendition);
    const bindings = new Map();
    for (const [cls, tags] of classToTags) {
      for (const tag of tags) {
        if (!bindings.has(tag)) bindings.set(tag, new Set());
        bindings.get(tag).add(cls);
      }
    }

    // R1 (piercing), R2 and R3 over the inline CSS.
    for (const block of isCss ? [raw] : styleBlocks(rendition)) {
      for (const [re, why] of CSS_PIERCING) {
        if (re.test(block)) violations.push(`${file} (inline <style>) — ${why}`);
      }

      let sheet;
      try {
        sheet = postcss.parse(block, { from: file });
      } catch (err) {
        violations.push(`${file} — its inline <style> does not parse as CSS: ${err?.message ?? err}`);
        continue;
      }

      // ── AT-RULES, WHICH `walkRules()` DOES NOT VISIT ────────────────────────────────
      // `@import url('./duplicated-card.css')` reaches the parser as an AtRule whose `params`
      // no rule below ever reads, so every selector it pulls in is unexamined and the pass
      // still printed green. An input this gate cannot read must not be reported as clean —
      // the same principle as the interpolated-selector refusal.
      sheet.walkAtRules((at) => {
        if (!/^(import|use|charset)$/i.test(at.name)) return;
        violations.push(
          `${file} — \`@${at.name} ${at.params}\` pulls in CSS this gate never reads, so nothing ` +
            `here can decide whether it duplicates component CSS. Inline the rules instead.`,
        );
      });

      let ruleCount = 0;
      sheet.walkRules((rule) => {
        ruleCount += 1;
        for (const selector of rule.selectors ?? []) {
          if (selector.includes('SK-INTERPOLATED-SELECTOR')) {
            violations.push(
              `${file} — the selector \`${rule.selector}\` is built by interpolation, so no ` +
                `check here can decide it. Write the selector out.`,
            );
            continue;
          }

          for (const { tag, classes, part } of partsIn(selector)) {
            // The element this part is written against: the type selector if there is one,
            // otherwise the tag this fixture's own markup puts the compound's class on.
            let subject = tag;
            if (subject === null) {
              const candidates = new Set();
              for (const name of classes) {
                for (const bound of classToTags.get(name) ?? []) candidates.add(bound);
              }
              if (candidates.size === 1) [subject] = [...candidates];
            }

            if (subject === null) {
              // THE WEAKENED ARM, stated rather than hidden. Nothing in the fixture says which
              // element carries this compound, so the per-element contract cannot be applied and
              // the check falls back to "some element declares this part". That still rejects a
              // part name that exists nowhere — the failure mode that matters — and it does NOT
              // reject reaching a real part on the wrong element. Name the tag, or put the class
              // on the element in markup, to get the strict check.
              const anywhere = Object.entries(recordedParts).filter(([, list]) => list.includes(part));
              if (anywhere.length === 0) {
                violations.push(
                  `${file} — \`${selector}\` reaches ::part(${part}), which NO element records in ` +
                    `${PARTS_FILE}. An undeclared part is as private as a shadow child.`,
                );
              }
              continue;
            }

            const declared = recordedParts[subject];
            if (!declared) {
              violations.push(
                `${file} — \`${selector}\` targets <${subject}>, which ${PARTS_FILE} does not ` +
                  `record. A part on an unrecorded element is not a public surface.`,
              );
            } else if (!declared.includes(part)) {
              violations.push(
                `${file} — \`${selector}\` reaches ::part(${part}) on <${subject}>, which is NOT ` +
                  `in that element's ${PARTS_FILE} contract (${declared.join(', ') || 'none'}). ` +
                  `An undeclared part is as private as a shadow child.`,
              );
            }
          }

          for (const name of classesIn(selector, ownedNames)) {
            const sheetFile = owned.get(name);
            if (sheetFile === undefined) continue;
            violations.push(
              `${file} — \`${selector}\` writes rules for \`.${name}\`, which ${sheetFile} owns. ` +
                `That is duplicated component CSS. Use the class in MARKUP and let the library's ` +
                `own sheet style it; restyle through the element's documented ::part() or tokens.`,
            );
          }

          // ── A BARE, UNSCOPED ELEMENT TYPE SELECTOR ──────────────────────────────────────
          // `sk-card { border: 0 }` restyles EVERY instance in the document from outside the
          // component, without going through a part or a token. R3's class rule never saw it
          // because there is no class in it. A selector carrying `::part()` is exempt — that is
          // the sanctioned seam and R2 checks it — and so is a type selector SCOPED by an
          // ancestor (`.sk-pattern-operations sk-card { min-inline-size: 0 }`), which sets the
          // host's own layout in the page rather than reaching into the component. Both fixtures
          // in this directory use the scoped form.
          const lead = leadingTag(selector);
          if (lead?.startsWith('sk-') && !selector.includes('::part(')) {
            violations.push(
              `${file} — \`${selector}\` is an unscoped type selector for <${lead}>, so it ` +
                `restyles every instance in the document from outside the component. Reach the ` +
                `element through its documented ::part() or tokens, or scope the rule to this ` +
                `fixture's own ancestor class if you only mean to place the host in the page.`,
            );
          }

          // ── THE LIGHT-DOM PRIMITIVE, RESTYLED THROUGH ITS TAG ───────────────────────────
          // `.sk-op-status dt { font-weight: 400; margin: 0 }` restates what `.sk-facts__term`
          // already declares, for the LIBRARY'S OWN markup, and names no library class at all —
          // so it is duplicated component CSS that the class rule structurally cannot see. It is
          // also the most realistic spelling of this defect, because #176's primitives are
          // light-DOM classes on native tags.
          //
          // Decided from the fixture's OWN MARKUP rather than from a list of tag names: a bare
          // trailing type selector is rejected only when this file's markup puts a library-owned
          // class on that tag. A fixture with no `.sk-facts` in it may style `dt` freely, which is
          // what keeps this from reddening ordinary page CSS.
          const trailing = trailingBareTag(selector);
          if (trailing && !trailing.startsWith('sk-')) {
            const ownedOnTag = [...(bindings.get(trailing) ?? [])].filter((c) => owned.has(c));
            if (ownedOnTag.length > 0) {
              violations.push(
                `${file} — \`${selector}\` styles <${trailing}> directly, and this fixture's own ` +
                  `markup puts the library-owned class(es) ${ownedOnTag.map((c) => `.${c}`).join(', ')} ` +
                  `on that tag. Restating a light-DOM primitive's declarations through its tag is ` +
                  `duplicated component CSS with the class name left out.`,
              );
            }
          }
        }
      });

      notes.rules += ruleCount;
      if (ruleCount === 0) {
        violations.push(
          `${file} — an inline <style> block parsed to 0 rules. Either it is empty, or the ` +
            `extractor is broken and this file is being reported clean without being read.`,
        );
      }
    }
  }

  if (notes.tags.size < MIN_COMPOSED_TAGS) {
    violations.push(
      `the patterns directory composes ${notes.tags.size} distinct sk- element tag(s), below the ` +
        `floor of ${MIN_COMPOSED_TAGS}. A composition fixture that composes nothing satisfies ` +
        `every rule above vacuously.`,
    );
  }

  return { violations, notes };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// --selftest
// ─────────────────────────────────────────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * A minimal but REAL fixture, used as the accepting baseline every reject probe mutates. It
 * composes three tags, styles one declared part, and names only classes it owns.
 */
const CLEAN_FIXTURE = `import { html } from 'lit';
export const styles = html\`<style>
  .sk-probe { display: grid; gap: var(--sk-space-4); }
  .sk-probe sk-card { min-inline-size: 0; }
  sk-page-header::part(header) { position: static; }
  .sk-probe__header::part(text) { gap: var(--sk-space-2); }
</style>\`;
export const view = () => html\`
  <div class="sk-probe">
    <sk-page-header class="sk-probe__header"><h1 slot="title">Probe</h1></sk-page-header>
    <sk-card status="info"><sk-status-indicator tone="info">Fine</sk-status-indicator></sk-card>
  </div>\`;
`;

/**
 * PROBES, red-first and accept-first in the same table.
 *
 * Each entry replaces a fragment of CLEAN_FIXTURE and records whether the repository pass must
 * reject it. The accepting arms are as load-bearing as the rejecting ones: a gate that reds
 * everything is a gate that gets switched off, and three of this repo's own gates shipped with a
 * probe table whose every arm expected red.
 */
const PROBES = [
  ['the clean fixture itself', (s) => s, false],
  ['a comment naming the forbidden constructs', (s) =>
    `// .shadowRoot, ::shadow, /deep/ and attachShadow( are what this gate rejects\n${s}`, false],
  ['a doc comment quoting a piercing selector inside a style block sentence', (s) =>
    `/** \`sk-card::shadow .x\` — the shape R1 rejects. */\n${s}`, false],
  ['.shadowRoot', (s) => s.replace('export const view', 'const inner = (e) => e.shadowRoot;\nexport const view'), true],
  ['optional-chained shadowRoot', (s) => s.replace('export const view', 'const inner = (e) => e.shadowRoot?.firstChild;\nexport const view'), true],
  ['attachShadow(', (s) => s.replace('export const view', 'const mk = (e) => e.attachShadow({ mode: "open" });\nexport const view'), true],
  ['::shadow in the style block', (s) => s.replace('.sk-probe sk-card {', 'sk-card::shadow .x { color: red; }\n  .sk-probe sk-card {'), true],
  ['/deep/ in the style block', (s) => s.replace('.sk-probe sk-card {', 'sk-card /deep/ .x { color: red; }\n  .sk-probe sk-card {'), true],
  ['>>> in the style block', (s) => s.replace('.sk-probe sk-card {', 'sk-card >>> .x { color: red; }\n  .sk-probe sk-card {'), true],
  ['>>> as an unsigned right shift in code, which is NOT a selector', (s) =>
    s.replace('export const view', 'const shift = (a, b) => a >>> b;\nexport const view'), false],
  ['a part that no element records', (s) => s.replace('::part(header)', '::part(not-a-real-part)'), true],
  ['a part recorded for a DIFFERENT element', (s) => s.replace('sk-page-header::part(header)', 'sk-card::part(header)'), true],
  ['a declared part on the element that declares it', (s) => s.replace('sk-page-header::part(header)', 'sk-card::part(card)'), false],
  ['a class the markup binds to TWO tags, reaching a part one of them declares — ambiguous, so the weakened arm', (s) =>
    s.replace('.sk-probe__header::part(text)', '.sk-probe__both::part(card)')
      .replace('<sk-page-header class="sk-probe__header">', '<sk-page-header class="sk-probe__both">')
      .replace('<sk-card status="info">', '<sk-card status="info" class="sk-probe__both">'), false],
  ['a rule written for a library-owned class', (s) => s.replace('.sk-probe { display: grid;', '.sk-card { border: 0; }\n  .sk-probe { display: grid;'), true],
  ['a rule written for a library-owned ELEMENT class', (s) => s.replace('.sk-probe { display: grid;', '.sk-facts__term { margin: 0; }\n  .sk-probe { display: grid;'), true],
  ['a library-owned class hidden inside :is()', (s) => s.replace('.sk-probe { display: grid;', ':is(.sk-probe, .sk-disclosure__summary) { margin: 0; }\n  .sk-probe { display: grid;'), true],
  ['a library-owned class USED IN MARKUP, which is composition and must pass', (s) =>
    s.replace('<sk-card status="info">', '<sk-card status="info"><dl class="sk-facts"><dt class="sk-facts__term">A</dt><dd class="sk-facts__value">B</dd></dl>'), false],
  // ── R2 THROUGH THE CLASS SPELLING. `team-overview.stories.ts` already ships this form and a
  // first cut of this gate red it, which is why these four arms exist.
  ['a declared part reached through a class the markup binds to that element', (s) => s, false],
  ['an UNdeclared part reached through a bound class', (s) => s.replace('.sk-probe__header::part(text)', '.sk-probe__header::part(not-a-real-part)'), true],
  ['a part declared for another element, reached through a bound class', (s) => s.replace('.sk-probe__header::part(text)', '.sk-probe__header::part(card)'), true],
  ['an unbound class reaching a part no element records', (s) => s.replace('.sk-probe__header::part(text)', '.sk-unbound::part(not-a-real-part)'), true],
  ['an unbound class reaching a part SOME element records — the weakened arm, accepted by design', (s) => s.replace('.sk-probe__header::part(text)', '.sk-unbound::part(card)'), false],
  ['a library-owned class named through a [class~=] attribute selector', (s) =>
    s.replace('.sk-probe { display: grid;', '[class~="sk-card"] { border: 0; }\n  .sk-probe { display: grid;'), true],
  ['a library-owned class named through an exact [class=] attribute selector', (s) =>
    s.replace('.sk-probe { display: grid;', '[class="sk-facts__term"] { margin: 0; }\n  .sk-probe { display: grid;'), true],
  ['a fixture-owned class named through a [class~=] attribute selector, which is fine', (s) =>
    s.replace('.sk-probe { display: grid;', '[class~="sk-probe__own"] { margin: 0; }\n  .sk-probe { display: grid;'), false],
  ['a <style> carrying attributes, whose CSS must still be read', (s) =>
    s.replace('<style>', '<style type="text/css">').replace('.sk-probe { display: grid;', '.sk-card { border: 0; }\n  .sk-probe { display: grid;'), true],
  ['an interpolated selector, which cannot be decided', (s) => s.replace('.sk-probe {', '${sel} {'), true],
  ['an empty style block', (s) => s.replace(/<style>[\s\S]*?<\/style>/, '<style></style>'), true],
  ['a fixture composing too few tags', (s) =>
    s.replace('<sk-page-header><h1 slot="title">Probe</h1></sk-page-header>', '').replace('<sk-status-indicator tone="info">Fine</sk-status-indicator>', ''), true],

  // ── F2. AN UPPERCASE TAG, which renders identically and disabled the whole CSS half.
  ['<STYLE> uppercase, carrying a piercing combinator', (s) =>
    s.replace('<style>', '<STYLE>').replace('</style>', '</STYLE>').replace('.sk-probe sk-card {', 'sk-card >>> .x { color: red; }\n  .sk-probe sk-card {'), true],
  ['<STYLE> uppercase, carrying a duplicated class', (s) =>
    s.replace('<style>', '<STYLE>').replace('</style>', '</STYLE>').replace('.sk-probe { display: grid;', '.sk-card { border: 0; }\n  .sk-probe { display: grid;'), true],

  // ── F4. The two spellings an implementer writes INNOCENTLY.
  ['renderRoot, Lit\'s own public alias for the shadow root', (s) =>
    s.replace('export const view', 'const inner = (e) => e.renderRoot.querySelector(".internal");\nexport const view'), true],
  ['getRootNode(), the standard way to obtain a root', (s) =>
    s.replace('export const view', 'const inner = (e) => e.firstElementChild.getRootNode();\nexport const view'), true],

  // ── F1. Duplication that names no class at all.
  ['a bare unscoped sk- type selector', (s) =>
    s.replace('.sk-probe { display: grid;', 'sk-card { border: 0; padding: 0; }\n  .sk-probe { display: grid;'), true],
  ['a type selector SCOPED by the fixture\'s own class, which places the host and must pass', (s) => s, false],
  ['a light-DOM primitive restyled through its tag', (s) =>
    s.replace('<sk-card status="info">', '<sk-card status="info"><dl class="sk-facts"><dt class="sk-facts__term">A</dt><dd class="sk-facts__value">B</dd></dl>')
      .replace('.sk-probe { display: grid;', '.sk-probe dt { font-weight: 400; margin: 0; }\n  .sk-probe { display: grid;'), true],
  ['the same tag styled where the markup gives it NO owned class, which must pass', (s) =>
    s.replace('.sk-probe { display: grid;', '.sk-probe dt { font-weight: 400; margin: 0; }\n  .sk-probe { display: grid;'), false],
  ['@import, an at-rule walkRules() never visits', (s) =>
    s.replace('.sk-probe { display: grid;', "@import url('./duplicated-card.css');\n  .sk-probe { display: grid;"), true],

  // ── F3. Escapes and attribute-operator variation.
  ['an escaped hyphen, .sk\\-card', (s) => s.replace('.sk-probe { display: grid;', '.sk\\-card { border: 0; }\n  .sk-probe { display: grid;'), true],
  ['a hex escape, .sk-car\\64', (s) => s.replace('.sk-probe { display: grid;', '.sk-car\\64  { border: 0; }\n  .sk-probe { display: grid;'), true],
  ['[class^="sk-"], which reaches every library class at once', (s) =>
    s.replace('.sk-probe { display: grid;', '[class^="sk-"] { border: 0; }\n  .sk-probe { display: grid;'), true],
  ['[class~="sk-card" i], the case-insensitivity flag', (s) =>
    s.replace('.sk-probe { display: grid;', '[class~="sk-card" i] { border: 0; }\n  .sk-probe { display: grid;'), true],
  ['[class*="facts__"], substring containment', (s) =>
    s.replace('.sk-probe { display: grid;', '[class*="facts__"] { margin: 0; }\n  .sk-probe { display: grid;'), true],
  ['[class^="sk-probe"], which reaches only fixture-owned classes and must pass', (s) =>
    s.replace('.sk-probe { display: grid;', '[class^="sk-probe"] { margin: 0; }\n  .sk-probe { display: grid;'), false],

  // ── F5. Runtime CSS injection, which no static rule above can read.
  ['createElement("style") at runtime', (s) =>
    s.replace('export const view', 'const inject = () => document.createElement("style");\nexport const view'), true],
  ['insertRule at runtime', (s) =>
    s.replace('export const view', 'const inject = (sh) => sh.insertRule(".sk-card { border: 0 }");\nexport const view'), true],
];

/**
 * A sandbox carrying only what the repository pass reads, so a probe cannot see the real tree.
 *
 * `parts` and `filename` exist for the INPUT_PROBES below, which vary the gate's INPUTS rather
 * than a fixture's source — the class of arm that had no coverage at all until it was pointed out
 * that five problem-emitting branches survived a green `--selftest`.
 */
function sandbox(fixtureSource, { patterns = true, parts = null, filename = 'probe.ts' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sk-pattern-composition-'));
  mkdirSync(join(dir, 'packages/styles/src'), { recursive: true });
  cpSync('packages/styles/src', join(dir, 'packages/styles/src'), { recursive: true });
  if (parts === null) cpSync(PARTS_FILE, join(dir, PARTS_FILE));
  else if (parts !== false) writeFileSync(join(dir, PARTS_FILE), parts);
  if (patterns) {
    mkdirSync(join(dir, 'packages/elements/src/patterns'), { recursive: true });
    writeFileSync(join(dir, `packages/elements/src/patterns/${filename}`), fixtureSource);
  }
  return dir;
}

/**
 * PROBLEM-EMITTING BRANCHES THAT NO SOURCE MUTATION REACHES.
 *
 * Every one of these was live code with no arm over it while `--selftest` printed green. Two of
 * them had WRITTEN PROMISES against them in this very file — the four-floor claim in the header
 * listed "no recorded parts" when only three floors had arms, and `stripComments`' docstring
 * promises that a file esbuild cannot parse FAILS rather than being skipped, with nothing testing
 * it. A gate whose subject is unfalsifiable greens had two of its own, one level up.
 *
 * Each entry names a sandbox and the substring the resulting refusal must contain.
 */
const INPUT_PROBES = [
  ['expected-parts.json is unreadable', () => sandbox(CLEAN_FIXTURE, { parts: 'not json {' }), 'could not be read'],
  ['expected-parts.json is absent entirely', () => sandbox(CLEAN_FIXTURE, { parts: false }), 'could not be read'],
  ['expected-parts.json records no parts at all', () => sandbox(CLEAN_FIXTURE, { parts: '{"byElement":{}}' }), 'records no parts'],
  ['a fixture esbuild cannot parse', () => sandbox('export const broken = (;'), 'does not parse'],
  ['an inline <style> postcss cannot parse', () =>
    sandbox(CLEAN_FIXTURE.replace('<style>', '<style>@media (min-width: 1px) { .a { color: red; }')), 'does not parse as CSS'],
  ['::part() on an element the contract does not record at all', () =>
    sandbox(CLEAN_FIXTURE.replace('sk-page-header::part(header)', 'sk-not-an-element::part(header)')), 'does not record'],
  // ── F8. The criterion is scoped to ONE DIRECTORY by convention; these hold the file TYPES
  // inside it, which the scan missed until it named only `.ts`/`.tsx`.
  ['a .js fixture in the same directory', () =>
    sandbox(CLEAN_FIXTURE.replace('.sk-probe { display: grid;', '.sk-card { border: 0; }\n  .sk-probe { display: grid;'), { filename: 'legacy.js' }), 'duplicated component CSS'],
  ['a .mjs fixture in the same directory', () =>
    sandbox(CLEAN_FIXTURE.replace('.sk-probe { display: grid;', '.sk-card { border: 0; }\n  .sk-probe { display: grid;'), { filename: 'legacy.mjs' }), 'duplicated component CSS'],
];

function selftest() {
  let failures = 0;
  let rejects = 0;
  let accepts = 0;

  for (const [name, mutate, mustReject] of PROBES) {
    const dir = sandbox(mutate(CLEAN_FIXTURE));
    let result;
    try {
      result = run(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    const rejected = result.violations.length > 0;
    if (rejected !== mustReject) {
      failures += 1;
      console.error(
        `❌ probe "${name}": expected ${mustReject ? 'REJECT' : 'ACCEPT'}, got ` +
          `${rejected ? 'REJECT' : 'ACCEPT'}${rejected ? `\n   ${result.violations[0]}` : ''}`,
      );
    }
    if (mustReject) rejects += 1;
    else accepts += 1;
  }

  // ── The input probes: branches no source mutation reaches. ──
  let inputs = 0;
  for (const [name, make, expect] of INPUT_PROBES) {
    const dir = make();
    let result;
    try {
      result = run(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    inputs += 1;
    const hit = result.violations.some((v) => v.includes(expect));
    if (!hit) {
      failures += 1;
      console.error(
        `❌ input probe "${name}": expected a refusal containing "${expect}", got ` +
          `${result.violations.length === 0 ? 'GREEN' : `\n   ${result.violations.join('\n   ')}`}`,
      );
    }
  }

  // ── The floor arms, which no source mutation can express. ──
  const noFixtures = sandbox('', { patterns: false });
  const emptyDir = run(noFixtures);
  rmSync(noFixtures, { recursive: true, force: true });
  if (!emptyDir.violations.some((v) => v.includes('refusing to report green over nothing'))) {
    failures += 1;
    console.error('❌ floor arm "no pattern fixtures at all": expected a refusal, got none.');
  }

  const noSheets = mkdtempSync(join(tmpdir(), 'sk-pattern-composition-bare-'));
  mkdirSync(join(noSheets, 'packages/elements/src/patterns'), { recursive: true });
  writeFileSync(join(noSheets, 'packages/elements/src/patterns/probe.ts'), CLEAN_FIXTURE);
  cpSync(PARTS_FILE, join(noSheets, PARTS_FILE));
  const bare = run(noSheets);
  rmSync(noSheets, { recursive: true, force: true });
  if (!bare.violations.some((v) => v.includes('owned-class set'))) {
    failures += 1;
    console.error('❌ floor arm "no styles sheets": expected the owned-class floor to fire, got none.');
  }

  // ── THE ARM THAT PROVES SCOPE, and the one `check-adopted-css-boundaries.mjs` could not have
  // passed. Every arm above runs against a synthetic fixture in a sandbox; this one plants a
  // violation into a COPY OF THE REAL patterns directory and runs the real repository pass over
  // it, so "the glob reaches the fixtures that actually exist" is measured rather than assumed.
  // That assumption is exactly what #259 found false of the gate this one replaces.
  const real = mkdtempSync(join(tmpdir(), 'sk-pattern-composition-real-'));
  mkdirSync(join(real, 'packages/styles/src'), { recursive: true });
  cpSync('packages/styles/src', join(real, 'packages/styles/src'), { recursive: true });
  cpSync(PARTS_FILE, join(real, PARTS_FILE));
  mkdirSync(join(real, 'packages/elements/src'), { recursive: true });
  cpSync('packages/elements/src/patterns', join(real, 'packages/elements/src/patterns'), {
    recursive: true,
  });
  const realFiles = globSync(join(real, 'packages/elements/src/patterns/**/*.ts'), {}).sort();
  const cleanReal = run(real);
  let plantVerdicts = [];
  for (const target of realFiles) {
    const before = readFileSync(target, 'utf8');
    // The CSS plant applies only where there IS an inline <style>. A pattern file that carries
    // none is the ideal shape, not a defect — `operational-status.stories.ts` delegates its CSS
    // to the composition module — so the arm is required to land at least ONCE across the
    // directory rather than in every file. Both halves of that are asserted below.
    const hasStyle = styleBlocks(stripComments(before, target)).length > 0;
    for (const [label, planted] of [
      ['a reach-through', `const reach = (e) => e.shadowRoot;\n${before}`],
      // BEFORE THE CLOSING TAG, not after the opening one. The first `<style>` in
      // operational-status.ts is inside a DOC COMMENT explaining this gate, so an opening-tag
      // plant landed in prose, was stripped with the comments, and the arm reported a silent
      // pass over an unplanted file. Caught by this table on its first run, which is the whole
      // argument for the table.
      ...(hasStyle
        ? [['duplicated component CSS', before.replace('</style>', '  .sk-card { border: 0; }\n</style>')]]
        : []),
    ]) {
      if (planted === before) {
        // A plant that changes nothing is an arm that proves nothing. Recorded as a FAILURE
        // rather than skipped: `continue` here is how this arm would go quietly vacuous the next
        // time a fixture is renamed or restructured.
        plantVerdicts.push({ target, label, red: false, inert: true });
        continue;
      }
      writeFileSync(target, planted);
      const after = run(real);
      writeFileSync(target, before);
      plantVerdicts.push({ target, label, red: after.violations.length > cleanReal.violations.length });
    }
  }
  rmSync(real, { recursive: true, force: true });

  if (cleanReal.violations.length > 0) {
    failures += 1;
    console.error('❌ end-to-end arm: the real patterns directory is not clean before planting:');
    for (const v of cleanReal.violations) console.error(`   ${v}`);
  }
  if (plantVerdicts.length === 0) {
    failures += 1;
    console.error('❌ end-to-end arm: nothing was planted — the real patterns directory resolved to no file.');
  }
  if (!plantVerdicts.some((v) => v.label === 'duplicated component CSS')) {
    failures += 1;
    console.error(
      '❌ end-to-end arm: no fixture in the real patterns directory carries an inline <style>, so ' +
        'the duplicated-CSS half was never planted against real code.',
    );
  }
  for (const { target, label, red, inert } of plantVerdicts) {
    if (inert) {
      failures += 1;
      console.error(
        `❌ end-to-end arm: ${label} could not be planted into ${target} — the plant changed ` +
          `nothing, so the arm proves nothing.`,
      );
    } else if (!red) {
      failures += 1;
      console.error(`❌ end-to-end arm: ${label} planted in ${target} did NOT go red.`);
    }
  }

  // ── THE TABLE'S OWN RATCHET, EXACT RATHER THAN A FLOOR (#249's defect class) ──────────────
  //
  // `PROBES.length < N` counts ROWS, not coverage: the table could shed the two forms this file
  // cites as review self-catches and still announce green, because a row floor cannot tell which
  // rows left. Deleting arms is exactly what a later refactor does under time pressure.
  //
  // So the counts are EXACT and the reject/accept split is asserted SEPARATELY. Dropping a reject
  // arm and adding an accept arm keeps the total and is caught by the split; adding a genuine
  // probe is a one-line update here, made deliberately rather than absorbed silently. Same shape
  // as `expected-parts.json`, which is exact for the same reason.
  const EXPECTED_PROBES = 47;
  const EXPECTED_REJECTS = 34;
  const EXPECTED_ACCEPTS = 13;
  const EXPECTED_INPUT_PROBES = 8;
  for (const [what, actual, expected] of [
    ['probe rows', PROBES.length, EXPECTED_PROBES],
    ['reject arms', rejects, EXPECTED_REJECTS],
    ['accept arms', accepts, EXPECTED_ACCEPTS],
    ['input probes', inputs, EXPECTED_INPUT_PROBES],
  ]) {
    if (actual !== expected) {
      failures += 1;
      console.error(
        `❌ ${what}: ${actual}, recorded ${expected}. A table that can shrink is a gate whose ` +
          `defeated forms quietly reopen — update this number deliberately or restore the arm.`,
      );
    }
  }

  if (failures > 0) process.exit(1);
  console.log(
    `\n✅ All ${PROBES.length} probes behaved as recorded (${rejects} reject, ${accepts} accept), ` +
      `all ${inputs} input probes refused their own branch, both floor arms refused, and ` +
      `${plantVerdicts.length} planted violation(s) went red in a copy of the real patterns directory.`,
  );
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

// Run-as-CLI guard, matching check-release-graph.mjs / check-adr-index.mjs — without it,
// importing this module for its exported checks (`ownedClasses`, `classesIn`, `stripComments`,
// …) runs the full CLI pass as a side effect of the import and can call `process.exit()` out
// from under whatever imported it. MEASURED, not assumed: `node -e "import('./check-pattern-
// composition.mjs')"` printed the "✅ Pattern composition: …" banner before this guard existed,
// and running the same import from an empty cwd (no `expected-parts.json` to read) called
// `process.exit(1)` — inside a Playwright test worker that terminates the worker, not the one
// test, with no test-runner-visible failure at all. #418's derived DOM-inventory check needs
// `ownedClasses()` importable from a `.spec.ts`, so this file must be safe to import as a
// library, not just runnable as a script.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();

  const { violations, notes } = run('.');
  if (violations.length > 0) {
    console.error('❌ Pattern composition (#183 exit criterion, #259):');
    for (const v of violations) console.error(`   ${v}`);
    console.error(
      '\n   A composition fixture is evidence that the PUBLIC surfaces suffice. Reaching a private\n' +
        '   root, or restating a component\'s own CSS, makes it evidence that they do not.',
    );
    process.exit(1);
  }
  console.log(
    `✅ Pattern composition: ${notes.files} fixture(s), ${notes.rules} inline CSS rule(s), ` +
      `${notes.tags.size} composed element tag(s), every ::part() inside the ${notes.parts}-part ` +
      `public ratchet, no reach-through, no duplicated component CSS.`,
  );
}
