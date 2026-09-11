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

/**
 * Every class declared inside a rendition's OWN `<style>…</style>` block(s) — a story's
 * story-local BEM frame (e.g. `.sk-cli-auth-pattern` and its `__`-children), which is legitimate
 * per-story scoping and not an invented sub-component. Reuses `styleBlocks()` so this reads
 * `<style>` bodies the same case-insensitive, interpolation-masking way the CSS arm already
 * does.
 */
export function localClassesIn(rendition) {
  const names = new Set();
  for (const css of styleBlocks(rendition)) {
    for (const name of classNamesDeclaredIn(css, 'inline <style>')) names.add(name);
  }
  return names;
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
    const m = /^([a-z][a-z0-9-]*?)(?:__|--)[a-z0-9-]+$/.exec(name);
    if (m) roots.add(m[1]);
  }
  return roots;
}

/**
 * Every `sk`-prefixed tag name and class name a rendition's markup names, bounded to each
 * element's own opening tag (`<tag ...>`) so neither a doc comment (stripped by the caller's
 * `stripComments()` before this ever sees the text) nor an unrelated string literal elsewhere
 * in the file can contribute a false candidate.
 *
 * DELIBERATELY PERMISSIVE INSIDE THAT BOUND — a bare `sk-[\w-]+` scan across the whole opening
 * tag, not a strict `class="..."`-only attribute parse — because a class reaching the DOM
 * through a ternary (`class="sk-cli-auth-pattern${light ? " sk-light" : ""}"`, the real shape
 * `cli-auth.stories.ts` uses for its light-mode toggle) still has to be written as a literal
 * `sk-...` token somewhere inside that same opening tag, whatever the surrounding JS syntax
 * looks like. An interpolation block (`${…}`) is consumed as one unit first so a stray `<`/`>`
 * inside it (there is none here, but a future pattern's fixture data could contain one) cannot
 * truncate the tag match early.
 */
export function skPrimitivesIn(rendition) {
  const tags = new Set();
  const classes = new Set();
  const openTag = /<\s*([a-zA-Z][\w-]*)((?:[^<>]|\$\{[^{}]*\})*)>/g;
  for (const m of rendition.matchAll(openTag)) {
    const tag = m[1].toLowerCase();
    if (tag.startsWith('sk-')) tags.add(tag);
    for (const cls of m[2].matchAll(/\bsk-[\w-]+\b/g)) classes.add(cls[0]);
  }
  return { tags, classes };
}


