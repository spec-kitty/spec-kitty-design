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
 * Over every file under `packages/elements/src/patterns/`:
 *
 *   R1  No `.shadowRoot`, no `attachShadow(`, no `::shadow`, no `/deep/`, no `>>>`. A fixture
 *       that reaches a component's internals is not evidence that the public surface suffices —
 *       it is evidence that it does not.
 *
 *   R2  Every `::part(name)` names an ELEMENT TAG and that element records that part in
 *       `expected-parts.json`. `::part()` is the sanctioned seam, but only for parts the
 *       shrink-only public ratchet actually carries: a part the manifest does not declare is as
 *       private as a shadow child. A `::part()` with no resolvable element tag in front of it is
 *       rejected too, rather than skipped — an unresolvable selector is the shape #197 shipped.
 *
 *   R3  No selector in an inline `<style>` writes rules for a class a `packages/styles` sheet
 *       OWNS. That is "duplicated component CSS" stated so a machine can decide it: the library
 *       owns the appearance of `.sk-card`, `.sk-facts__term`, `.sk-disclosure__summary`; a
 *       fixture that declares rules for them has either copied them or is overriding them from
 *       outside, and both are the thing the criterion forbids. USING such a class in MARKUP is
 *       composition and stays legal — this rule is about writing CSS *for* it, never about
 *       naming it.
 *
 *   R4  Floors, because every rule above passes vacuously over an empty set. No fixtures, no
 *       owned classes, no recorded parts, a `<style>` block that parsed to no rules, or a
 *       patterns directory composing fewer than MIN_COMPOSED_TAGS distinct `sk-` element tags,
 *       are each a refusal rather than a green line.
 *
 * ── WHAT IS DELIBERATELY NOT CHECKED ───────────────────────────────────────────────────────
 *
 * `fixtures/elements-behaviour/` and `tests/browser/` are OUT OF SCOPE and must stay so. Those
 * suites reach `element.shadowRoot` on purpose — that is how a test VERIFIES that a public
 * surface produced the right private structure, and 30 existing files do it. Scoping R1 to them
 * would red the suite that proves the criterion holds. The criterion is about the COMPOSITION
 * FIXTURE, and so is this gate.
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
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import postcss from 'postcss';

const SCAN = 'packages/elements/src/patterns/**/*.{ts,tsx}';
const OWNED_SHEETS = 'packages/styles/src/**/sk-*.css';
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
  [/::shadow\b/, '`::shadow` — a removed piercing combinator'],
  [/\/deep\//, '`/deep/` — a removed piercing combinator'],
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
export function stripComments(source, file = 'source.ts') {
  return esbuild.transformSync(source, {
    loader: file.endsWith('.tsx') ? 'tsx' : 'ts',
    format: 'esm',
  }).code;
}

/**
 * Every `<style>…</style>` body in a rendition, with `${…}` interpolations masked.
 *
 * The mask is a CLASS-SHAPED token rather than a blank, so an interpolated selector still parses
 * and is then REJECTED by name below — a computed selector cannot be checked, and silently
 * dropping it is the certifying-absence shape this file exists to refuse.
 */
export const styleBlocks = (rendition) => {
  const out = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = re.exec(rendition)) !== null) {
    out.push(m[1].replace(/\$\{[\s\S]*?\}/g, 'SK-INTERPOLATED-SELECTOR'));
  }
  return out;
};

/**
 * Every class name a selector names — through a class selector OR through a `[class]` attribute
 * selector, and inside functional pseudo-class argument lists either way.
 *
 * THE ATTRIBUTE FORM IS NOT PEDANTRY. `[class~="sk-card"] { border: 0 }` selects exactly what
 * `.sk-card { border: 0 }` selects and is the first thing a `.`-only rule teaches an author to
 * write. Adding it costs one alternation; leaving it out would have made R3 a naming convention
 * rather than a rule.
 */
export const classesIn = (selector) => {
  const out = (selector.match(/\.(-?[_a-zA-Z][\w-]*)/g) ?? []).map((c) => c.slice(1));
  for (const m of selector.matchAll(/\[\s*class\s*[~|^$*]?=\s*(['"]?)([^'"\]]*)\1\s*\]/g)) {
    for (const name of m[2].trim().split(/\s+/).filter(Boolean)) out.push(name);
  }
  return out;
};

/**
 * Every `::part()` in a selector, paired with the element tag it is written against.
 *
 * The tag is the leading type selector of the compound the pseudo-element is attached to. A
 * compound with no type selector (`.some-class::part(x)`) yields `null` and is REJECTED by the
 * caller: which element's contract that part belongs to is then unknowable, and a check that
 * cannot resolve its subject must not pass it.
 */
export const partsIn = (selector) => {
  const out = [];
  const re = /(^|[\s>+~,(])([A-Za-z][\w-]*)?((?:[.#][\w-]+|\[[^\]]*\]|:not\([^)]*\))*)::part\(\s*([^)]*)\s*\)/g;
  let m;
  while ((m = re.exec(selector)) !== null) {
    const compoundClasses = classesIn(m[3] ?? '');
    for (const name of m[4].trim().split(/\s+/).filter(Boolean)) {
      out.push({ tag: m[2] ?? null, classes: compoundClasses, part: name });
    }
  }
  return out;
};

/**
 * Which element tag each class in this fixture's own markup is applied to.
 *
 * WHY THIS EXISTS, and it is the correction a first cut of this gate needed. R2 wants the part
 * checked against THE ELEMENT IT IS WRITTEN AGAINST, and the natural spelling of that is a type
 * selector (`sk-nav-pill::part(nav)`). But the legitimate and already-shipped spelling in
 * `team-overview.stories.ts` is a CLASS on the element —
 * `.sk-pattern-overview__context-navigation::part(nav)`, where the class sits on `<sk-nav-pill>`
 * and `nav`, `items` and `hamburger` are all three recorded for it. Rejecting that would have
 * been a checker reddening correct code, which in this repo gets the checker deleted.
 *
 * So the binding is read from the markup instead: a class that appears in the `class="…"` of
 * exactly one `sk-` tag resolves to that tag, and R2 then runs at full per-element strength
 * through the class spelling too.
 *
 * ONLY LITERAL `class="…"` ATTRIBUTES ARE READ. A class bound by interpolation
 * (`class=${…}`) resolves to nothing and lands in the weakened arm below, which is stated
 * rather than hidden.
 */
export const classTagBindings = (rendition) => {
  const bindings = new Map();
  for (const m of rendition.matchAll(/<\s*(sk-[a-z0-9-]+)([^>]*)>/g)) {
    const tag = m[1];
    for (const attr of m[2].matchAll(/class\s*=\s*"([^"]*)"/g)) {
      for (const name of attr[1].split(/\s+/).filter(Boolean)) {
        if (!bindings.has(name)) bindings.set(name, new Set());
        bindings.get(name).add(tag);
      }
    }
  }
  return bindings;
};

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The repository pass, factored so --selftest can run it against a sandbox.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Every class any `packages/styles` sheet declares rules for. R3's subject. */
export function ownedClasses(root = '.') {
  const owned = new Map();
  for (const file of globSync(join(root, OWNED_SHEETS), {}).sort()) {
    const css = readFileSync(file, 'utf8');
    let parsed;
    try {
      parsed = postcss.parse(css, { from: file });
    } catch (err) {
      throw new Error(`${file} does not parse as CSS: ${err?.message ?? err}`);
    }
    parsed.walkRules((rule) => {
      for (const selector of rule.selectors ?? []) {
        for (const name of classesIn(selector)) {
          if (!owned.has(name)) owned.set(name, file);
        }
      }
    });
  }
  return owned;
}

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

  const files = globSync(join(root, SCAN), {}).sort();
  notes.files = files.length;
  if (files.length === 0) {
    violations.push(`no pattern fixture matched ${SCAN} — refusing to report green over nothing.`);
  }

  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    let rendition;
    try {
      rendition = stripComments(raw, file);
    } catch (err) {
      violations.push(`${file} does not parse — it cannot be checked: ${err?.message ?? err}`);
      continue;
    }

    // R1 over source.
    for (const [re, why] of REACH_THROUGH) {
      const m = rendition.match(re);
      if (m) violations.push(`${file} — ${why}`);
    }

    // Which elements this fixture composes, for R4's floor.
    for (const m of rendition.matchAll(/<\s*(sk-[a-z0-9-]+)/g)) notes.tags.add(m[1]);

    // Which element each of this fixture's classes sits on, for R2's class spelling.
    const bindings = classTagBindings(rendition);

    // R1 (piercing), R2 and R3 over the inline CSS.
    for (const block of styleBlocks(rendition)) {
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
                for (const bound of bindings.get(name) ?? []) candidates.add(bound);
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

          for (const name of classesIn(selector)) {
            const sheetFile = owned.get(name);
            if (sheetFile === undefined) continue;
            violations.push(
              `${file} — \`${selector}\` writes rules for \`.${name}\`, which ${sheetFile} owns. ` +
                `That is duplicated component CSS. Use the class in MARKUP and let the library's ` +
                `own sheet style it; restyle through the element's documented ::part() or tokens.`,
            );
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
];

/** A sandbox carrying only what the repository pass reads, so a probe cannot see the real tree. */
function sandbox(fixtureSource, { patterns = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sk-pattern-composition-'));
  mkdirSync(join(dir, 'packages/styles/src'), { recursive: true });
  cpSync('packages/styles/src', join(dir, 'packages/styles/src'), { recursive: true });
  cpSync(PARTS_FILE, join(dir, PARTS_FILE));
  if (patterns) {
    mkdirSync(join(dir, 'packages/elements/src/patterns'), { recursive: true });
    writeFileSync(join(dir, 'packages/elements/src/patterns/probe.ts'), fixtureSource);
  }
  return dir;
}

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

  if (PROBES.length < 24) {
    failures += 1;
    console.error(`❌ the probe table shrank to ${PROBES.length}, below its floor of 24.`);
  }

  if (failures > 0) process.exit(1);
  console.log(
    `\n✅ All ${PROBES.length} probes behaved as recorded (${rejects} reject, ${accepts} accept), ` +
      `both floor arms refused, and ${plantVerdicts.length} planted violation(s) went red in a ` +
      `copy of the real patterns directory.`,
  );
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

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
