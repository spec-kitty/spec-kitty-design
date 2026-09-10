// The AUTHORED markup source for sk-site-footer (ADR-10 §3). The static HTML and the styles-layer
// module are GENERATED from this file by scripts/build-element-markup.mjs, and CI fails on drift.
//
// EVALUATED IN A BARE NODE PROCESS by scripts/build-element-markup.mjs. It may import a LEAF —
// a module with no imports of its own, like status-indicator/status-tones.ts — and may NOT reach
// anything that needs a browser. It was a strict leaf until #216: the generator evaluated it from
// a `data:` URL, which has no module base, so no import resolved at all.
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
  // COMPACT PRESENTATION (#354). `row`/`meta` are the compact anatomy's own layout nodes;
  // `linkCompact` is a MODIFIER on the existing `link` class, applied only in the light DOM
  // (element path: a consumer-authored `<a>`; static path: a generated `<a>`) — never a
  // descendant selector from the root, because the root class lives inside the shadow root in
  // the element path and the anchor does not descend from it there.
  row: 'sk-site-footer__row',
  meta: 'sk-site-footer__meta',
  linkCompact: 'sk-site-footer__link--compact',
} as const;

/** No colour or shape variants — a site footer is one thing. */
export const SITE_FOOTER_VARIANTS = {} as const;

/**
 * The compact presentation, one of two closed records keyed by `presentation`. Mirrors
 * `sk-check-bullet`'s `CHECK_BULLET_PRESENTATIONS` shape: `full` is the backward-compatible
 * default (no modifier class, so `siteFooterClasses()` output is unchanged for every existing
 * caller), `compact` adds one ordinary BEM modifier class on the root — never a `:host([attr])`
 * rule, which is what keeps ADR-15's #309/#310 host-axis machinery untriggered.
 */
const SITE_FOOTER_PRESENTATIONS = Object.freeze({
  full: Object.freeze({ modifier: '' }),
  compact: Object.freeze({ modifier: 'sk-site-footer--compact' }),
} as const);

/** Normalize untrusted runtime input without mutating or throwing. */
function siteFooterPresentation(presentation?: string) {
  const entry = Object.entries(SITE_FOOTER_PRESENTATIONS).find(([name]) => name === presentation);
  return entry?.[1] ?? SITE_FOOTER_PRESENTATIONS.full;
}

/**
 * The root element's class list, shared by the element and the static form (#354).
 *
 * Every compact CSS rule targets an ordinary root-block BEM class selector — matching identically
 * in a shadow root and in a document — rather than a `:host([attr])` rule.
 */
export function siteFooterClasses(presentation?: string): string {
  return ['sk-site-footer', siteFooterPresentation(presentation).modifier].filter(Boolean).join(' ');
}

// NO CLOCK, WHICH THE RULING ALSO SETTLED. The barrel this replaces opened with
// `new Date().getFullYear()`. Harmless in a hand-authored module a consumer imports at runtime;
// not harmless once GENERATED, because the generator calls it at build time and commits the
// result — so the year is baked in and `--check` fails on 1 January against a tree nobody
// touched (ADR-11 item 9). The legal line is a property, so no date is ever generated.
//
// The placeholder carries no year either: not a pinned one, which would only move the staleness
// into what a consumer reads in 2028, and not `<year>`, which htmlhint parses as an unclosed tag.

/** Which of the two footer presentations to render. Omit for the backward-compatible full presentation. */
export type SiteFooterPresentation = 'full' | 'compact';

/**
 * One compact-presentation link, as structured data.
 *
 * The static path escapes both fields at the only two boundaries that exist: `label` through
 * `text()`, `href` through `attr()`. No markup-bearing string is ever accepted.
 */
export interface SiteFooterLink {
  /** The link's visible text. */
  label: string;
  /** The link's destination. */
  href: string;
}

export interface SiteFooterStaticOptions {
  wordmark?: string;
  tagline?: string;
  headingOne?: string;
  headingTwo?: string;
  legal?: string;
  /** Selects the compact, server-renderable presentation. Omit for the full presentation. */
  presentation?: SiteFooterPresentation;
  /**
   * The compact presentation's links, as `{ label, href }` pairs — rendered in the order given.
   * Deliberately NOT in `DEFAULTS`: a default here would put a library-authored destination into
   * a real consumer footer. Omit for zero links.
   */
  links?: readonly SiteFooterLink[];
}

const DEFAULTS = {
  wordmark: 'Your Brand',
  tagline: 'One sentence on what you do.',
  headingOne: 'Product',
  headingTwo: 'Connect',
  legal: '© YYYY Your Company. All rights reserved.',
} as const;

// Escaping, still local, and no longer because it has to be: the generator evaluated this module
// from a `data:` URL with no module base until #216, and now evaluates from a real module URL, so
// a shared leaf escaper would resolve. `attr` is `text` plus the quote characters — derived, so
// the canonical list exists once. #163 tracks the shared helper and is now unblocked.
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

// THE COMPACT ANATOMY (#354, plan.md D-4) — a bare `<a>` sibling to the tagline/meta block, NOT
// an `<li>` in a `<ul>`. Family 6's public/account screens (`screens/P1`, `P2`, `P16`, `P20` in
// the approved ux_redesign corpus) are byte-identical and contain no `<nav>`, no `<ul>`, no
// `<li>`, no heading — reintroducing a list would depart from the settled corpus shape.
const compactLinkHtml = (link: SiteFooterLink): string =>
  `<a class="${SITE_FOOTER_CLASSES.link} ${SITE_FOOTER_CLASSES.linkCompact}" href="${attr(link.href)}">${text(link.label)}</a>`;

// ZERO LINKS → NO SCAFFOLDING. There is nothing to be empty, structurally: no `<nav>`, no
// heading, no `<ul>` under any input — full stop, not conditionally. `wordmark`/`tagline`/`legal`
// are each rendered only when set, matching the existing full-form discipline for `legal`
// ((legal ?? '').trim() non-blank) and extending it to the two fields the compact anatomy makes
// optional at the block level rather than always rendering an empty node.
const siteFooterCompactHtml = (o: SiteFooterStaticOptions): string => {
  const legal = (o.legal ?? '').trim();
  const links = o.links ?? [];
  return (
    `<footer part="footer" class="${siteFooterClasses(o.presentation)}">` +
    `<div class="${SITE_FOOTER_CLASSES.row}">` +
    `<div class="${SITE_FOOTER_CLASSES.meta}">` +
    (o.wordmark
      ? `<div class="${SITE_FOOTER_CLASSES.brand}">` +
        `<span class="${SITE_FOOTER_CLASSES.wordmark}">${text(o.wordmark)}</span></div>`
      : '') +
    (o.tagline ? `<p class="${SITE_FOOTER_CLASSES.tagline}">${text(o.tagline)}</p>` : '') +
    (legal ? `<p part="legal" class="${SITE_FOOTER_CLASSES.legal}">${text(legal)}</p>` : '') +
    `</div>` +
    links.map(compactLinkHtml).join('') +
    `</div>` +
    `</footer>`
  );
};

/**
 * The static form, for a consumer with no JavaScript.
 *
 * The element renders the same structure from the same class map, so the two paths cannot
 * diverge — the difference is only where the content comes from: properties there, literals here.
 *
 * `presentation: 'compact'` branches to the compact anatomy BEFORE any of the full presentation's
 * template is evaluated — the line below is the only edit this function makes to the full
 * branch, which is otherwise the unedited template literal that predates this mission.
 */
export function siteFooterStaticHtml(opts: SiteFooterStaticOptions = {}): string {
  const o = { ...DEFAULTS, ...opts };
  if (o.presentation === 'compact') {
    return siteFooterCompactHtml(o);
  }
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

// THE _AXES PLACEHOLDER LINKS CARRY NO DIGITS (C-006) — not a year, not a count — and live only
// here, never in DEFAULTS, so `siteFooterStaticHtml({ presentation: 'compact' })` renders zero
// links (the `CompactNoLinks` case) and no library-authored destination reaches a real footer.
const PLACEHOLDER_COMPACT_LINKS: readonly SiteFooterLink[] = Object.freeze([
  Object.freeze({ label: 'Terms', href: '#' }),
]);

/**
 * One additional generated static form beyond the base: the compact presentation, demonstrated
 * with a placeholder link. `CompactNoLinks` demonstrates the zero-links case, which is the same
 * shape a consumer who omits `links` altogether gets. In-repo precedent: `sk-check-bullet` keeps
 * `CHECK_BULLET_VARIANTS = {}` while declaring its own backward-compatible added presentation as
 * `CHECK_BULLET_AXES = { Pending: { state: 'pending' } }` — copied here exactly.
 */
export const SITE_FOOTER_AXES = {
  Compact: { presentation: 'compact', links: PLACEHOLDER_COMPACT_LINKS },
  CompactNoLinks: { presentation: 'compact' },
} as const satisfies Record<string, SiteFooterStaticOptions>;
