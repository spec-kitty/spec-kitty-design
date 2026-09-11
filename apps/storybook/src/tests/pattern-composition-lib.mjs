#!/usr/bin/env node
/**
 * The pure, side-effect-free derivation primitives behind `check-pattern-composition.mjs`'s R1-
 * R3 checks, split into their own module for exactly one reason: `check-pattern-composition.mjs`
 * is a CLI script (`run()`/`selftest()` execute and call `process.exit()` from module scope, and
 * its `--selftest` sandbox needs `import.meta.url` to locate itself on disk), and `import.meta`
 * syntax anywhere in a file — even inside a guarded, never-executed branch — makes that file
 * impossible to bundle into a CommonJS output. #418 needs `ownedClasses()` (and its new
 * DOM-inventory siblings below) importable from a Playwright spec
 * (`apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts`), and Playwright's own test transform
 * bundles every `.spec.ts` and its imports to CJS. MEASURED, not assumed: importing
 * `check-pattern-composition.mjs` (even after it gained a run-as-CLI `process.exit()` guard)
 * from that spec failed at collection time with `SyntaxError: Cannot use 'import.meta' outside a
 * module` — the mere PRESENCE of the syntax broke the bundle, regardless of whether the guarded
 * branch containing it ever ran. This file contains no `import.meta` anywhere, so it bundles
 * cleanly; `check-pattern-composition.mjs` imports everything it needs from here and re-exports
 * it, so its own existing public API is unchanged for any other consumer.
 *
 * WHY THIS FILE LIVES IN `apps/storybook/src/tests/`, NOT `scripts/` (where it was first
 * written). Also MEASURED, not assumed: even after the `import.meta` split, a Playwright spec
 * importing this file from `scripts/` via a deep relative path (`../../../../scripts/...`)
 * failed lint — `@nx/enforce-module-boundaries` refuses any `apps/**` file reaching a relative
 * path into `scripts/`, which has no `project.json` and sits outside the Nx project graph
 * entirely. `scripts/**` files are not covered by that ESLint rule's `files` glob, so
 * `check-pattern-composition.mjs` can import FROM here without tripping it, but the reverse
 * direction structurally cannot exist under this repo's lint config. Co-locating here also puts
 * it beside every future pattern mission's spec file (`apps/storybook/src/tests/*.spec.ts`),
 * which is exactly who else is meant to import it.
 */
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import esbuild from 'esbuild';
import postcss from 'postcss';

/** Every `packages/styles` sheet R3 (and `ownedClasses()`) reads. */
export const OWNED_SHEETS = 'packages/styles/src/**/sk-*.css';
/** The cross-cutting light-mode toggle's sheet — see `tokensOwnedClasses()`. */
export const TOKENS_SHEET = 'packages/tokens/src/tokens.css';
/** The generated Custom Elements Manifest — see `knownElementTags()`. */
export const MANIFEST_FILE = 'packages/elements/custom-elements.json';

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
 *
 * THE `i` FLAG IS LOAD-BEARING AND WAS MISSING. HTML tag names are case-insensitive, so `<STYLE>`
 * renders identically and a case-only edit disabled the ENTIRE CSS half of this gate — R2, R3 and
 * the piercing-combinator arm together, the last of which has no source-side counterpart. The
 * gate's own rule counter is what makes it visible: 54 rules with `<style>`, 44 with `<STYLE>`,
 * green either way. One character, and the file read clean without being read.
 */
export const styleBlocks = (rendition) => {
  const out = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(rendition)) !== null) {
    out.push(
      m[1]
        .replace(/\$\{[\s\S]*?\}/g, 'SK-INTERPOLATED-SELECTOR')
        // THE JS ESCAPE LAYER, and there are TWO of them here. This block is the SOURCE TEXT of a
        // template literal, not the string it evaluates to, so a literal backslash in the CSS is
        // written `\\` and reaches postcss as two characters. `.sk\\-card` therefore decoded to
        // `.sk\-card`, whose class name the CSS decoder then read as `sk` — a name no sheet owns,
        // so an escaped-hyphen spelling of `.sk-card` walked through R3 while the single-backslash
        // spelling was caught. Collapsing the JS layer first puts both on the same footing.
        .replace(/\\\\/g, '\\'),
    );
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
export const decodeCssEscapes = (text) =>
  String(text)
    // `\64 ` and `\0064` — a hex code point, optionally closed by one whitespace character.
    .replace(/\\([0-9a-fA-F]{1,6})[ \t\n]?/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    // `\-` — any other escaped character stands for itself.
    .replace(/\\(.)/g, '$1');

/**
 * Every class name a selector names — through a class selector, or through a `[class]` attribute
 * selector in any of its operator and flag spellings.
 *
 * ESCAPES ARE DECODED FIRST, and that is not theoretical tidiness. `.sk\-card` and `.sk-car\64`
 * are the SAME SELECTOR as `.sk-card` to every browser, and against the raw text the class regex
 * stopped at the backslash and yielded `sk` and `sk-car` — two names no sheet owns, so both walked
 * straight through R3. One backslash defeated the whole rule.
 *
 * THE ATTRIBUTE FORMS, all of them. `[class~="sk-card"]` selects exactly what `.sk-card` selects.
 * `[class^="sk-"]` selects EVERY library class at once, which is the broadest possible override and
 * was the quietest hole here. And `[class~="sk-card" i]` — the case-insensitivity flag — walked
 * past the earlier pattern because its `\s*\]` tail could not cross the ` i`, so the very form
 * this file cites as a review self-catch was bypassable by two characters.
 *
 * SUBSTRING OPERATORS ARE RESOLVED AGAINST THE OWNED SET, not treated as literal names: `^=`, `$=`
 * and `*=` name every owned class stand in the stated relation to the value. That is what makes
 * `[class^="sk-"]` report the classes it actually reaches instead of a name nobody owns.
 */
export const classesIn = (selector, ownedNames = []) => {
  const decoded = decodeCssEscapes(selector);
  const out = (decoded.match(/\.(-?[_a-zA-Z][\w-]*)/g) ?? []).map((c) => c.slice(1));
  const attr = /\[\s*class\s*([~|^$*]?)=\s*(['"]?)([^'"\]]*)\2\s*(?:[isIS]\s*)?\]/g;
  for (const m of decoded.matchAll(attr)) {
    const op = m[1];
    const value = m[3].trim();
    if (!value) continue;
    if (op === '^' || op === '$' || op === '*') {
      for (const name of ownedNames) {
        const hit =
          op === '^' ? name.startsWith(value) : op === '$' ? name.endsWith(value) : name.includes(value);
        if (hit) out.push(name);
      }
      continue;
    }
    for (const name of value.split(/\s+/).filter(Boolean)) out.push(name);
  }
  return out;
};

/** The leftmost compound's type selector, if it has one. `sk-card > .x` -> `sk-card`. */
export const leadingTag = (selector) => {
  const m = decodeCssEscapes(selector).trim().match(/^([a-zA-Z][\w-]*)/);
  return m ? m[1].toLowerCase() : null;
};

/** The rightmost compound's bare type selector, if the compound is ONLY a type selector. */
export const trailingBareTag = (selector) => {
  const parts = decodeCssEscapes(selector).trim().split(/[\s>+~]+/).filter(Boolean);
  const last = parts[parts.length - 1] ?? '';
  return /^[a-zA-Z][\w-]*$/.test(last) && parts.length > 1 ? last.toLowerCase() : null;
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
  for (const m of rendition.matchAll(/<\s*([a-zA-Z][\w-]*)([^>]*)>/g)) {
    const tag = m[1].toLowerCase();
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

// ── #418's derived DOM-inventory arm ────────────────────────────────────────────────────────
//
// A per-pattern Playwright spec (`sk-cli-auth-pattern.spec.ts` today; four more pattern
// missions in flight will need the same thing) wants to assert that EVERY `sk`-prefixed tag or
// class its own rendered markup names is either a real registered custom element or a class
// some public sheet owns — replacing a hand-written denylist that could not fail for a name
// nobody thought to enumerate. These three helpers are that derivation, factored here (not
// duplicated per spec file) so the property stays as derived as R3's already is.

/** Classes any CSS text declares rules for — the shared primitive behind `ownedClasses()`,
 *  `tokensOwnedClasses()` and `localClassesIn()`. Kept separate from `ownedClasses()`'s own body
 *  (rather than refactoring it to call this) so `ownedClasses()` — covered by this file's own
 *  `--selftest` probe table — is untouched by this addition. */
function classNamesDeclaredIn(css, label) {
  const names = new Set();
  let parsed;
  try {
    parsed = postcss.parse(css, { from: label });
  } catch (err) {
    throw new Error(`${label} does not parse as CSS: ${err?.message ?? err}`);
  }
  parsed.walkRules((rule) => {
    for (const selector of rule.selectors ?? []) {
      for (const name of classesIn(selector)) names.add(name);
    }
  });
  return names;
}

/**
 * Every class `packages/tokens/src/tokens.css` declares rules for — separate from
 * `ownedClasses()` (scoped to `packages/styles`) because the cross-cutting light-mode toggle
 * `.sk-light` lives in the TOKENS sheet, not a component sheet, and every pattern story that
 * renders a light-mode variant (all of them — MEASURED: `.sk-light` is referenced by name in
 * over 40 `packages/styles/src/**` files and used directly as a rendered class by
 * `cli-auth.stories.ts`'s `light` story parameter) composes it. A DOM-arm check that consulted
 * only `ownedClasses()` would red on `.sk-light` in EVERY pattern family — the exact
 * false-positive-avalanche a "derived, not invented" check must not produce.
 */
export function tokensOwnedClasses(root = '.') {
  const file = join(root, TOKENS_SHEET);
  return classNamesDeclaredIn(readFileSync(file, 'utf8'), file);
}

/** `sk-boundary-page` from `sk-boundary-page__stage`; `null` for a name with no `__`/`--`
 *  suffix. The shared primitive behind `bemBlockRoots()` and `ownBlockRoots()` below. */
function bemRootOf(name) {
  const m = /^([a-z][a-z0-9-]*?)(?:__|--)[a-z0-9-]+$/.exec(name);
  return m ? m[1] : null;
}

/**
 * Whether `name` is trusted by a set of BEM roots — either `name` itself IS one of the roots,
 * or `name`'s own BEM root (`bemRootOf`) is. The single membership test both
 * `ownedClasses()`-derived acceptance and a spec file's own hardcoded local-block allowance
 * (see `pattern-composition-lib.mjs`'s header note on #418 FINDING 1's fix, and
 * `sk-cli-auth-pattern.spec.ts`'s `LOCAL_BLOCK` constant) run through.
 */
export function isBemMemberOf(name, roots) {
  return roots.has(name) || roots.has(bemRootOf(name));
}

/**
 * Arms a MutationObserver-based watch covering the WHOLE document (`document` itself, not
 * `document.body` and not `document.documentElement` — see the `watch(document)` call below for
 * why even the latter is unsafe here) and recursing into every OPEN shadow root it can reach,
 * that accumulates every `sk`-prefixed tag name and class name seen from the moment it starts
 * until
 * `stopSkPrimitiveWatch()` reads and disarms it. Paired with that function; state bridges the
 * two via `window.__skPrimitiveWatch` because each is a SEPARATE `page.evaluate()`/
 * `addInitScript()` invocation with no shared closure.
 *
 * DESIGNED TO RUN INSIDE THE BROWSER: register with `page.addInitScript(startSkPrimitiveWatch)`
 * — NOT `page.evaluate()` — so it re-arms on EVERY subsequent navigation (`openStory()`'s own
 * `page.goto()`), before that page's own scripts run. Has no closure over any outer variable and
 * imports nothing — only `document`/`Element`/`MutationObserver`/`Set`/`window`, which exist in
 * the browser.
 *
 * REPLACES `collectSkPrimitives()` (a single-read snapshot; deleted, not kept as a weaker
 * sibling) and, before that, the source-text mechanism (`skPrimitivesIn()` + `ownBlockRoots()`,
 * also deleted). Each of the THREE mechanisms this repo has tried for #418's DOM-inventory arm
 * was SELF-ATTACKED before being reported closed, and each attack that found a real gap is
 * fixed here rather than only in the one reproduction that found it — re-verified against a
 * REBUILT `storybook-static/` every time (a stale build silently passes every plant; MEASURED
 * the hard way after a first false all-clear during this exact round):
 *
 *   - `ownBlockRoots()` trusted any element carrying a `data-*-pattern`-shaped attribute as a
 *     "real story root" — an INVENTED attribute name, and the REAL attribute repeated on an
 *     inner element, both minted their own credential.
 *   - A follow-up ban list (`classList.add/remove/toggle/replace`, `setAttribute("class", ...)`,
 *     `.className=`, bracket/Reflect spellings) was defeated by `Object.assign(element, {
 *     className: ... })` — a fifth spelling none of the four banned.
 *   - `collectSkPrimitives()`'s first draft, scoped to `document.body`, missed
 *     `document.documentElement.appendChild(el)` — `el` lands as a SIBLING of `<body>`, never
 *     inside it. Rescoping to `document.documentElement` was the OBVIOUS fix and the WRONG one:
 *     registered via `page.addInitScript()`, this function can run before `<html>` exists, and
 *     `document.documentElement` was observed `null` at that point — SELF-ATTACKED, found by
 *     rerunning the very reproduction this rescope was meant to close and watching it pass for
 *     the wrong reason (the crash never armed the watch at all; see `stopSkPrimitiveWatch()`'s
 *     new `armed` flag, added because of this exact failure). `document` itself — always
 *     available the instant any script runs, and both a valid `querySelectorAll()` host via
 *     `ParentNode` and a valid `MutationObserver.observe()` target as a `Node` — has no such
 *     window and is what `watch()` is actually called with, below.
 *   - The same draft, scoped to `querySelectorAll('*')` only, could not cross a shadow
 *     boundary — a plain `<div>` with `attachShadow({mode:'open'})` holding a forbidden class
 *     was invisible. `watch()` below checks `el.shadowRoot` and descends explicitly.
 *     VERIFIED SAFE against this repo's OWN composed elements before relying on it: every
 *     `sk-form-input`/`sk-card`/`sk-pill-tag` shadow-DOM class (e.g. `sk-form-input__control`,
 *     `cardClasses()`'s `sk-card`/`sk-card--*` output) is declared with a real rule in
 *     `packages/styles/src/**\/sk-*.css` — the SAME file `ownedClasses()` reads — because that
 *     IS the source `build-elements-css.mjs` compiles each element's shadow stylesheet from.
 *     Shadow recursion reveals nothing new as unowned inside this repo's own elements; only an
 *     INVENTED shadow tree is unowned.
 *     DISCLOSED, NOT CHASED — `mode: 'closed'` shadow roots return `null` from
 *     `Element.shadowRoot` BY DESIGN; that is what closed mode is FOR (a platform property, not
 *     a defect), and no DOM-based check can reach one. Also disclosed: a shadow root
 *     `attachShadow()`-ed onto an element AFTER that element was already recorded by this walk
 *     (i.e. appended first, given a shadow root and populated only later) has no observer
 *     attached to it, since nothing observable marks "a shadow root was just attached" the way
 *     `childList`/`attributes` mutations mark other changes. CHECKED, NOT SKIPPED: `grep -rn
 *     "extends:" packages/elements/src` found zero customized built-ins (`is="..."`) in this
 *     repo — a `<button is="sk-x">` keeps `tagName === "BUTTON"` and stays invisible to the tag
 *     arm; a future author who introduces one should revisit this file.
 *   - A single READ, taken right after `data-render-complete="true"`, missed
 *     `setTimeout(() => element.classList.add("sk-consent-row"), 300)` inside a `ref()`
 *     callback — the mutation simply had not happened yet at read time. This is what the
 *     observer (rather than a second read) is for.
 *
 * THE GUARANTEE THIS BUYS, STATED PRECISELY (the previous version of this file asserted more
 * than a single read could actually prove, and was told directly that silence on that gap would
 * not be accepted a second time): no unknown `sk`-prefixed tag or class appears ANYWHERE in the
 * light DOM or any OPEN shadow root, at ANY point from just before the story's own script begins
 * through the caller's observation window (currently 500ms past `data-render-complete` — see
 * `sk-cli-auth-pattern.spec.ts`'s use of this pair). "No mutation EVER, however deferred" is NOT
 * claimed and is not obtainable by a bounded test: a mutation timed to land after the
 * observation window closes is not caught, and neither is one inside a `mode: 'closed'` shadow
 * root or one attached to an already-recorded element only after the fact (both above). These
 * are disclosed limits of what a rendered-DOM check can prove, not silent gaps.
 */
export function startSkPrimitiveWatch() {
  // Captured HERE, before any story script has run (`addInitScript` fires before the page's
  // own scripts) — SELF-ATTACKED, a real bug this round: `(Set.prototype as any).has =
  // function () { return true; }` patches the GLOBAL lookup `stopSkPrimitiveWatch()`'s canary
  // check uses, for every `Set` on the page, including `seen.classes` itself. Reading
  // `Set.prototype.has` FRESH at stop time (after the story's own script — and therefore this
  // patch — has already run) reads the always-true version; `state.seen.classes.has(canary)`
  // then reported `armed: true` over a COMPLETELY EMPTY decoy `Set`, not merely an unfed real
  // one. Capturing the pristine method reference now, before any story script exists to patch
  // it, and calling THROUGH that captured reference later, is immune to the patch — the same
  // shape as `Node.prototype.appendChild.call(...)` in `stopSkPrimitiveWatch()`, applied to the
  // one lookup in the canary's own verification path that had been left as a plain instance
  // call.
  const hasMethod = Set.prototype.has;
  const record = (el, seen) => {
    const tag = el.tagName.toLowerCase();
    if (tag.startsWith('sk-')) seen.tags.add(tag);
    for (const cls of el.classList) {
      // Case-INSENSITIVE prefix test (SELF-ATTACKED, a prior round: `class="SK-Terminal-Frame"`
      // passed a case-sensitive `startsWith('sk-')`). The ORIGINAL casing is still what gets
      // recorded and compared — every real, committed class in this repo is lowercase-kebab, so
      // a mixed-case variant still fails every acceptance check under its own real spelling.
      if (cls.slice(0, 3).toLowerCase() === 'sk-') seen.classes.add(cls);
    }
  };
  const seen = { tags: new Set(), classes: new Set() };
  const observers = [];
  // `root` is `document`, an `Element`, or a `ShadowRoot`. THE `root.shadowRoot` CHECK AT THE
  // TOP IS LOAD-BEARING, NOT REDUNDANT WITH THE LOOP BELOW — SELF-ATTACKED, a real bug this
  // round: a `<div>` created via `document.createElement`, given `attachShadow({mode:'open'})`
  // and shadow content BEFORE being appended, then appended via `document.body.appendChild`,
  // passed. The childList handler below calls `watch(node)` for that newly added `div` itself
  // — and the FIRST version of this function checked `el.shadowRoot` only for DESCENDANTS
  // found by `querySelectorAll('*')`, never for `root` itself. A `<div>` with no light-DOM
  // children (all of its content lives in its shadow root) has an EMPTY `querySelectorAll('*')`
  // result, so nothing about it was ever inspected. Checking `root.shadowRoot` before walking
  // descendants closes this for both the initial sweep and every future `childList` addition.
  const watch = (root) => {
    if (root.shadowRoot) watch(root.shadowRoot);
    for (const el of root.querySelectorAll('*')) {
      record(el, seen);
      if (el.shadowRoot) watch(el.shadowRoot);
    }
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          record(mutation.target, seen);
          if (mutation.target.shadowRoot) watch(mutation.target.shadowRoot);
        } else if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (!(node instanceof Element)) continue;
            record(node, seen);
            watch(node);
          }
        }
      }
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });
    observers.push(observer);
  };
  // `document`, NOT `document.documentElement`. SELF-ATTACKED, a real bug this round: when
  // registered via `page.addInitScript()`, this function can run BEFORE the browser has
  // created `<html>` — `document.documentElement` was observed `null` at that point, so
  // `watch(document.documentElement)` threw INSIDE `querySelectorAll` on a null reference,
  // `startSkPrimitiveWatch()` never reached the line that sets `window.__skPrimitiveWatch`, and
  // every subsequent `stopSkPrimitiveWatch()` call silently returned `{ tags: [], classes: [] }`
  // — an empty, trivially-passing result, with NOTHING that surfaced the crash to the test's own
  // assertions (`page.on('pageerror')` is wired into a DIFFERENT test in this file). The
  // "document.documentElement.appendChild" reproduction this function exists to catch therefore
  // passed for the WRONG reason: the whole watch had never armed, not because the escape was
  // closed. `document` (the `Document` node itself) is ALWAYS available the instant ANY script
  // executes in a page context — no null-reference window — and supports both
  // `querySelectorAll()` (via `ParentNode`) and `MutationObserver.observe()` (it is a `Node`)
  // identically to an Element root.
  watch(document);
  // `Object.freeze` + a non-configurable, non-writable window property, NOT a plain assignment
  // — SELF-ATTACKED, a real bug in the `hasMethod` fix above: storing the captured reference
  // AS A FIELD of the same plain object a story script can reassign wholesale does not protect
  // it. A decoy anticipating the fix — `window.__skPrimitiveWatch = { seen: {...}, observers:
  // [], hasMethod: () => true }` — supplies ITS OWN fake `hasMethod` and passed, because
  // `state.hasMethod.call(...)` in `stopSkPrimitiveWatch()` reads `hasMethod` OFF `state`, and
  // `state` IS whatever object `window.__skPrimitiveWatch` currently points to. Freezing the
  // state object (blocks `state.hasMethod = X`, `state.seen = X` — reassigning any OWN
  // property — while still allowing `seen.classes.add(...)`/`observers.push(...)`, which mutate
  // what those properties point to, not the properties themselves) and defining the WINDOW
  // property itself as `configurable: false, writable: false` (blocks `window.__skPrimitiveWatch
  // = anotherDecoy` outright — reassigning the window property to a DIFFERENT object entirely,
  // which an object-level freeze cannot prevent) closes both directions at once, and — unlike
  // choosing an obscure property name — does not rely on the attacker failing to read this
  // file's own source, which is committed, public, and reused by design.
  const frozenState = Object.freeze({ seen, observers, hasMethod });
  try {
    Object.defineProperty(window, '__skPrimitiveWatch', {
      value: frozenState,
      writable: false,
      configurable: false,
      enumerable: true,
    });
  } catch {
    // Extremely defensive fallback only — `defineProperty` on a fresh `window` property should
    // never throw here; if it somehow does, a plain assignment is no worse than the prior round.
    window.__skPrimitiveWatch = frozenState;
  }
}

/**
 * Reads and disarms the watch `startSkPrimitiveWatch()` armed, returning `{ tags, classes,
 * armed }` as plain data (`MutationObserver` instances and `Set`s are not structured-cloneable
 * across the `page.evaluate()` boundary, so this must run IN the page and hand back only
 * serializable data).
 *
 * `armed` IS PROVEN, NOT INFERRED — a canary, not a shape check. SELF-ATTACKED TWICE now, and
 * the second attack is why this function looks the way it does:
 *
 *   1. `startSkPrimitiveWatch()` used to crash (see its own header) when
 *      `document.documentElement` was `null` at `addInitScript` time, and because it crashed
 *      BEFORE setting `window.__skPrimitiveWatch`, an earlier version of THIS function — which
 *      inferred `armed` from `Boolean(window.__skPrimitiveWatch)` — could not tell that crash
 *      apart from "nothing unusual was ever rendered." Fixed, in the previous round, by adding
 *      `armed` as an explicit field.
 *   2. That fix was ITSELF forgeable, and WAS forged: `window.__skPrimitiveWatch =
 *      { seen: { tags: new Set(), classes: new Set() }, observers: [] }`, written from a story
 *      script, satisfies `Boolean(window.__skPrimitiveWatch)` completely — the decoy has the
 *      right SHAPE, the real observer chain is gone, and nothing observes anything. A real
 *      mutation on a real rendered element was recorded nowhere, and `armed: true` was reported
 *      anyway. This is the SAME defect class as `ownBlockRoots()`'s forgeable root-marker
 *      attribute and the classList ban list's missed spelling, one level further down: a
 *      self-reported "I am watching" signal that anything else on the page can write is not
 *      evidence of watching.
 *
 * THE FIX: inject a synthetic CANARY mutation — append a throwaway element carrying a
 * randomly-named `sk`-prefixed class — and require the watch's OWN accumulated state to
 * actually contain it before trusting ANYTHING else it reports. A decoy cannot satisfy this by
 * matching a shape; it would have to genuinely observe the canary mutation to pass, at which
 * point it is a real, working observer chain and not a decoy. `Promise.resolve()` is awaited
 * twice after the canary mutation because a `MutationObserver` callback fires as a QUEUED
 * MICROTASK, not synchronously — the canary's own append queues that microtask before either
 * `await` does, so both ticks complete after it by FIFO microtask ordering. Any exception while
 * probing a malformed decoy (e.g. `state.seen.classes` not actually being a `Set`) is caught and
 * treated as `armed: false`, the same conclusion as if nothing were armed at all — never a
 * thrown error the caller has to specifically handle.
 *
 * SELF-ATTACKED A SECOND TIME, and the canary changed shape again as a direct result. The FIRST
 * version of this canary called `document.documentElement.classList.add(canary)` — an INSTANCE
 * method call. A story script defeated it by shadowing exactly that one instance's `.add`
 * (`document.documentElement.classList.add = (...tokens) => { for (const t of tokens)
 * decoySeen.add(t); return realAdd(...tokens); }`) while leaving a REAL payload on a different
 * element (`sk-form-input.classList.add('sk-consent-row')`) completely untouched by the patch —
 * the canary passed, the payload went unrecorded. See `Node.prototype.appendChild.call(...)`
 * below for why the canary now goes through the PROTOTYPE method instead.
 *
 * SELF-ATTACKED A THIRD TIME, and this one found a gap in the VERIFICATION READ ITSELF, not the
 * mutation: `(Set.prototype as any).has = function () { return true; }`, then a decoy of the
 * exact earlier shape (`{ seen: { tags: new Set(), classes: new Set() }, observers: [] }`) with
 * NO further selectivity needed. `state.seen.classes.has(canary)` reported `true` over a
 * completely EMPTY decoy `Set`, because the LOOKUP had been made to always return `true`, not
 * because the canary was actually recorded. See `state.hasMethod.call(...)` below — the same
 * capture-then-call-through shape as `appendChild`, applied to the one remaining plain instance
 * call in this function's own verification path. Once both are captured early, the residual is
 * exactly what the `appendChild` paragraph below states and no more: a whole-page PROTOTYPE
 * patch, disclosed rather than chased.
 */
export async function stopSkPrimitiveWatch() {
  const state = window.__skPrimitiveWatch;
  if (!state) return { tags: [], classes: [], armed: false };
  let armed = false;
  let probe = null;
  try {
    const canary = `sk-canary-${Math.random().toString(36).slice(2)}`;
    probe = document.createElement('div');
    probe.className = canary;
    // Node.prototype.appendChild.call(...), NOT `document.documentElement.appendChild(...)` —
    // SELF-ATTACKED, a real bypass of an earlier version of this canary that DID call the
    // instance method directly (`document.documentElement.classList.add(canary)`): a story
    // script shadowed THAT ONE INSTANCE's own `.add` (`document.documentElement.classList.add =
    // (...) => { relayIntoDecoy(...); return realAdd(...); }`) — a narrow, plausible-looking
    // wrapper around one element's own method — while the REAL payload landed on a completely
    // different, unpatched element (`sk-form-input.classList.add('sk-consent-row')`). The
    // canary passed; the payload went unrecorded. Calling the PROTOTYPE method explicitly
    // bypasses any such instance-level shadow, because it never does a property lookup on the
    // instance at all.
    Node.prototype.appendChild.call(document.documentElement, probe);
    await Promise.resolve();
    await Promise.resolve();
    // `state.hasMethod.call(...)`, NOT `state.seen.classes.has(canary)` — SELF-ATTACKED A THIRD
    // TIME, and this one falsified the disclosure two paragraphs above rather than just adding
    // to it. `(Set.prototype as any).has = function () { return true; }` patches the LOOKUP
    // itself, globally, for every `Set` on the page — including `seen.classes`. It needs no
    // selectivity and does not care which element the real payload lands on: `state.seen.
    // classes.has(canary)` returned `true` over a COMPLETELY EMPTY decoy `Set`, because `.has()`
    // itself had been made to always return `true`, not because anything was actually recorded.
    // `startSkPrimitiveWatch()` captures `Set.prototype.has` before any story script can run and
    // stores it as `hasMethod`; calling THROUGH that captured reference is immune to the global
    // patch for the same reason the `appendChild` call above is immune to an instance shadow —
    // neither reads a property off anything the page can still influence at call time.
    //
    // THE EARLIER VERSION OF THIS COMMENT CLAIMED ONLY A WHOLE-PAGE `Node.prototype.appendChild`
    // PATCH COULD STILL INTERCEPT THIS CANARY. That was WRONG, not merely incomplete: `Set.
    // prototype.has` needed no page-breaking selectivity trade-off at all — a blanket `() =>
    // true` sufficed, and the composition test gave zero signal (it surfaced only as an
    // incidental failure in an unrelated test, because Playwright's own injected machinery also
    // uses `Set`).
    //
    // CAPTURING `hasMethod` WAS ITSELF NOT ENOUGH ON ITS OWN, FOUND BY SELF-ATTACK, NOT REPORTED:
    // storing the captured reference as a plain field of the SAME object a story script can
    // reassign wholesale does not protect it. A decoy anticipating this exact fix —
    // `window.__skPrimitiveWatch = { seen: {...}, observers: [], hasMethod: () => true }` —
    // supplies its OWN fake `hasMethod`, and `state.hasMethod.call(...)` reads whatever `state`
    // (i.e. `window.__skPrimitiveWatch`, whatever it currently points to) says `hasMethod` is.
    // See `startSkPrimitiveWatch()`'s own tail: the state object is now `Object.freeze`d AND
    // installed via `Object.defineProperty(window, '__skPrimitiveWatch', { writable: false,
    // configurable: false, ... })`, so `window.__skPrimitiveWatch = anything` and
    // `window.__skPrimitiveWatch.hasMethod = anything` both fail outright — the assignment
    // never takes effect, the ORIGINAL state (real observers, real captured `hasMethod`) stays
    // in place, and the real observer chain simply keeps recording, catching the real payload
    // directly rather than needing `armed` to catch a decoy at all.
    //
    // With BOTH closed, the original argument is true again: the remaining residual is a
    // PROTOTYPE-level patch of `Node.prototype.appendChild` ITSELF, intercepting every node's
    // own appends across the entire page (Lit's and Storybook's own rendering included), which
    // — to avoid visibly breaking the page — would have to relay every real append faithfully,
    // at which point it is a real observer and would also relay the actual attack payload. That
    // residual is disclosed, not chased further, the same class of limit as `mode: 'closed'`
    // shadow roots, above. Two weaker candidates were probed and could NOT exploit this canary:
    // a patched `document.createElement` returning a non-genuine node throws on the
    // `appendChild.call` above (a safe failure, caught below) rather than silently passing, and
    // `Math.random` predictability alone grants no write access to the accumulated state.
    armed = state.hasMethod.call(state.seen.classes, canary);
    state.seen.classes.delete(canary);
  } catch {
    armed = false;
  } finally {
    try {
      probe?.remove();
    } catch {
      // Cleanup only; a failure here does not change the liveness verdict already recorded.
    }
  }
  if (Array.isArray(state.observers)) {
    for (const observer of state.observers) {
      if (observer instanceof MutationObserver) observer.disconnect();
    }
  }
  try {
    // Best-effort only, now that `startSkPrimitiveWatch()` defines this as
    // `configurable: false` — `delete` on a non-configurable property fails (silently in
    // sloppy mode, throws in strict mode) rather than removing it. Harmless either way: the
    // next story's `page.goto()` is a full navigation, discarding this `window` object and
    // everything on it regardless of whether this line succeeded.
    delete window.__skPrimitiveWatch;
  } catch {
    // See above — not security-relevant, the property is inert either way once disarmed.
  }
  if (!armed) return { tags: [], classes: [], armed: false };
  return { tags: [...state.seen.tags], classes: [...state.seen.classes], armed: true };
}

/**
 * Every custom element tag name the generated Custom Elements Manifest registers — the DOM
 * arm's tag-side ground truth, the same relationship `ownedClasses()` has to the CSS arm.
 *
 * GENERATED, NOT HAND-MAINTAINED — verified, not assumed, before this was written to depend on
 * it: the manifest is produced by `cem analyze` (`packages/elements/project.json`'s `analyze`
 * target, run via `nx run elements:analyze`) and `.github/workflows/ci-quality.yml`'s
 * "[ENFORCED] Custom Elements Manifest is current" step fails the build on ANY drift
 * (`git diff --exit-code`) plus an anti-vacuity floor (`scripts/check-manifest-content.mjs`)
 * that fails if any registered element is missing its real tag. `npx nx run elements:analyze
 * --skip-nx-cache && git diff --exit-code -- packages/elements/custom-elements.json` was run
 * for real against this mission's own checkout and printed no diff.
 */
export function knownElementTags(root = '.') {
  const file = join(root, MANIFEST_FILE);
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  const tags = new Set();
  for (const mod of manifest.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (decl.tagName) tags.add(decl.tagName);
    }
  }
  return tags;
}

/**
 * The BEM block root of every `__element`/`--modifier` class in a set — `sk-boundary-page` from
 * `sk-boundary-page__stage`, `sk-button` from `sk-button--danger-secondary`.
 *
 * WHY THIS EXISTS. `.sk-boundary-page`'s own file documents that the bare block class "CARRIES
 * NO RULE OF ITS OWN — it exists purely as a component-host identification hook" (a convention
 * it shares with `sk-context-nav`, `sk-data-table` and `sk-workflow-board`, and that
 * `scripts/run-axe-storybook.js`'s own `BLOCK_CLASS` regex depends on). `ownedClasses()` and
 * `tokensOwnedClasses()` only see classes a CSS RULE targets, so a rule-less block-hook class is
 * invisible to both — MEASURED, not assumed: probing `cli-auth.stories.ts`'s own rendered
 * `class="sk-boundary-page sk-boundary-page__stage"` against `ownedClasses()` alone left
 * `sk-boundary-page` as the ONE unexplained name, while `sk-boundary-page__stage` (which DOES
 * carry a rule) passed. This derives the missing bucket from the classes that already ARE
 * owned, rather than hand-listing `sk-boundary-page`/`sk-context-nav`/`sk-data-table`/
 * `sk-workflow-board` as a fifth escape hatch — which would be the exact denylist shape #418
 * exists to remove, just moved one file over. A genuinely invented bare block (no owned
 * `__`/`--` sibling anywhere) has no owned name to derive a root from and stays unknown.
 */
export function bemBlockRoots(classNames) {
  const roots = new Set();
  for (const name of classNames) {
    const root = bemRootOf(name);
    if (root) roots.add(root);
  }
  return roots;
}

// `skPrimitivesIn()` — a source-text scan for `sk`-prefixed tags/classes bounded to each
// element's own opening tag — lived here through WP01's first reject fix. REMOVED, not kept
// disclosed-and-weaker, on WP01's second reject: it is a proven-defeated mechanism for the
// composition-inventory purpose (see `collectSkPrimitives()`'s header for both defeats), and
// leaving a defeated function exported from a file four more pattern missions are meant to
// reuse is the failure mode the reviewer named directly — "it ships forward into every sibling
// that adopts it." `collectSkPrimitives()` (runtime, DOM-anchored) is what pattern spec files
// should import for this purpose now.


