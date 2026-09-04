// The AUTHORED markup source for sk-site-footer (ADR-10 §3). The static HTML and the styles-layer
// module are GENERATED from this file by scripts/build-element-markup.mjs, and CI fails on drift.
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL, which has no
// module base.
//
// THE SHAPE HERE IS THE OPERATOR'S RULING ON #77 (2026-09-04), not a choice made in this file:
// the element owns the whole structure — the <nav>s, the headings, the <ul>s, the divider and the
// legal line — and content arrives as PROPERTIES. One string property per simple field, and only
// the link LISTS are slotted, as <li> elements directly inside the element-owned <ul>. That keeps
// <ul>/<li> semantics, makes every rule in the sheet reachable, and keeps structured data off an
// attribute boundary — the ruling worked that sub-decision through explicitly, because the React
// wrappers' ssrSafe mode delivers first-render props as ATTRIBUTES, which carry only strings.

/**
 * The class names this component renders, named once.
 *
 * The element imports these rather than re-typing them (ADR-8 criterion 3).
 */
export const SITE_FOOTER_CLASSES = {
  root: 'sk-site-footer',
  grid: 'sk-site-footer__grid',
  column: 'sk-site-footer__column',
  brand: 'sk-site-footer__brand',
  wordmark: 'sk-site-footer__wordmark',
  tagline: 'sk-site-footer__tagline',
  heading: 'sk-site-footer__heading',
  links: 'sk-site-footer__links',
  link: 'sk-site-footer__link',
  divider: 'sk-site-footer__divider',
  legal: 'sk-site-footer__legal',
} as const;

/** No colour or shape variants — a site footer is one thing. */
export const SITE_FOOTER_VARIANTS = {} as const;

/** No non-variant axes. */
export const SITE_FOOTER_AXES = {} as const;

// NO CLOCK, WHICH THE RULING ALSO SETTLED. The barrel this replaces opened with
// `new Date().getFullYear()`. Harmless in a hand-authored module a consumer imports at runtime;
// not harmless once GENERATED, because the generator calls it at build time and commits the
// result — so the year is baked in and `--check` fails on 1 January against a tree nobody
// touched (ADR-11 item 9). The legal line is a property, so no date is ever generated.
//
// The placeholder carries no year either: not a pinned one, which would only move the staleness
// into what a consumer reads in 2028, and not `<year>`, which htmlhint parses as an unclosed tag.

export interface SiteFooterStaticOptions {
  wordmark?: string;
  tagline?: string;
  headingOne?: string;
  headingTwo?: string;
  legal?: string;
}

const DEFAULTS = {
  wordmark: 'Your Brand',
  tagline: 'One sentence on what you do.',
  headingOne: 'Product',
  headingTwo: 'Connect',
  legal: '© YYYY Your Company. All rights reserved.',
} as const;

// Escaping, leaf-local: the generator evaluates this module from a `data:` URL with no module
// base, so it cannot import a helper. `attr` is `text` plus the quote characters — derived, so
// the canonical list exists once. #163 tracks making the generator bundle so this can be shared.
const text = (v: string): string =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (v: string): string => text(v).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Placeholder link items, so the generated artifact demonstrates the structure it documents. */
const PLACEHOLDER_ITEMS = (labels: readonly string[]): string =>
  labels
    .map((l) => `<li><a href="#" class="${SITE_FOOTER_CLASSES.link}">${text(l)}</a></li>`)
    .join('');

const column = (heading: string, items: string): string =>
  `<nav class="${SITE_FOOTER_CLASSES.column}" aria-label="${attr(heading)} links">` +
  `<div class="${SITE_FOOTER_CLASSES.heading}">${text(heading)}</div>` +
  `<ul class="${SITE_FOOTER_CLASSES.links}">${items}</ul></nav>`;

/**
 * The static form, for a consumer with no JavaScript.
 *
 * The element renders the same structure from the same class map, so the two paths cannot
 * diverge — the difference is only where the content comes from: properties there, literals here.
 */
export function siteFooterStaticHtml(opts: SiteFooterStaticOptions = {}): string {
  const o = { ...DEFAULTS, ...opts };
  return (
    `<footer class="${SITE_FOOTER_CLASSES.root}">` +
    `<div class="${SITE_FOOTER_CLASSES.grid}">` +
    `<div class="${SITE_FOOTER_CLASSES.column}">` +
    `<div class="${SITE_FOOTER_CLASSES.brand}">` +
    `<span class="${SITE_FOOTER_CLASSES.wordmark}">${text(o.wordmark)}</span></div>` +
    `<p class="${SITE_FOOTER_CLASSES.tagline}">${text(o.tagline)}</p></div>` +
    column(o.headingOne, PLACEHOLDER_ITEMS(['Platform', 'Docs'])) +
    column(o.headingTwo, PLACEHOLDER_ITEMS(['Contact', 'GitHub'])) +
    `</div>` +
    `<hr class="${SITE_FOOTER_CLASSES.divider}" />` +
    `<p class="${SITE_FOOTER_CLASSES.legal}">${text(o.legal)}</p>` +
    `</footer>`
  );
}

/** The legal placeholder, exported so a test can assert it carries no year. */
export const PLACEHOLDER_LEGAL = DEFAULTS.legal;
