// The AUTHORED markup source for sk-site-footer (ADR-10 §3). The static HTML and the styles-layer
// module are GENERATED from this file by scripts/build-element-markup.mjs, and CI fails on drift.
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL, which has no
// module base.

/**
 * The class names this component renders, named once.
 *
 * The element imports these rather than re-typing them. #78's blog-card shipped the opposite —
 * the only element in the repo that imported nothing from its own markup module — and four class
 * strings were authored twice on the component whose whole argument was that the two paths are
 * one shape. That is ADR-8 criterion 3, and it is measured by a proxy that has now been wrong
 * twice (#142), so the safe construction is to leave no literal in `render()` at all.
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

// BOTH ARE DECLARED EMPTY ON PURPOSE, and omitting either is an error: the generator HARD-FAILS
// rather than reading `?? {}`, which could not distinguish "this component has none" from "I
// looked for the wrong export name".

/** No non-variant axes. */
export const SITE_FOOTER_AXES = {} as const;

// NO CLOCK. THIS IS THE POINT OF THE MISSION.
//
// The hand-written barrel this replaces opened with `const year = new Date().getFullYear()` and
// interpolated it into the legal line. That was invisible while the file was hand-written and
// nothing regenerated it — but this module's output is now a COMMITTED, DRIFT-GATED artifact, and
// an artifact whose bytes depend on the wall clock stops matching a fresh generation on 1 January:
// CI red for everyone, no code change, and the "fix" is to re-run the generator. ADR-11 item 9
// names exactly that as generation determinism, and #140 found the same class making the manifest
// gate a coin flip.
//
// So the year is a PLACEHOLDER constant, pinned, in the same family as sk-card's `Card content`
// and sk-blog-card's PLACEHOLDER_THUMBNAIL: it exists so the generated artifact demonstrates the
// structure it documents. The element never renders it — the legal line is slotted, because a
// consumer's copyright is their own text and no component should be asserting it for them.
/**
 * The legal line's placeholder, for the generated static form.
 *
 * NO YEAR AT ALL, not even a pinned one. A pinned `2026` delivered determinism — the artifact
 * stops depending on the clock — but it MOVED the staleness rather than removing it: the
 * generated `.html`, the styles barrel and the autodocs page would all read "© 2026" to a
 * consumer in 2028. A lens made the point, and it is right: nothing requires the placeholder to
 * look like a year. `YYYY` is deterministic, obviously a template, and cannot read stale.
 *
 * NOT `<year>`, which the first attempt used: htmlhint parses it as an unclosed HTML TAG in the
 * generated `.html` and fails the gate. A placeholder still has to be valid markup.
 *
 * It also makes the determinism test discriminating instead of decorative — see the fixture.
 * A consumer replaces the whole line; it is not a default the element falls back to.
 */
export const PLACEHOLDER_LEGAL = '© YYYY Your Company. All rights reserved.';

export interface SiteFooterStaticOptions {
  /** The brand column: a mark and a tagline. Omitted entirely when absent. */
  brand?: string;
  /** The legal line. Defaults to the placeholder above. */
  legal?: string;
}

/**
 * A placeholder brand column.
 *
 * NO LOGO `src`. The markup this replaces carried
 * `src="../../packages/tokens/assets/logo.webp"` — a REPO-relative path, so every consumer who
 * copied the snippet got a broken image. The asset does ship (`packages/tokens/package.json`
 * lists `assets/**`), but at `@spec-kitty/tokens/assets/logo.webp`, which is not that path. A
 * consumer's footer carries their own mark anyway, so the brand column is a slot and the
 * placeholder shows the shape without asserting an image that cannot resolve.
 */
const PLACEHOLDER_BRAND =
  `<div class="${SITE_FOOTER_CLASSES.column}"><div class="${SITE_FOOTER_CLASSES.brand}">` +
  `<span class="${SITE_FOOTER_CLASSES.wordmark}">Your Brand</span></div>` +
  `<p class="${SITE_FOOTER_CLASSES.tagline}">One sentence on what you do.</p></div>`;

/**
 * Placeholder link columns — CHILDREN, not a text node.
 *
 * #77 learned this in the other direction: sk-grid's generated artifact was a single text node,
 * which showed ADR-10 §3's no-JavaScript consumer nothing about the component they were copying.
 * Two columns, because the grid is `1.5fr 1fr 1fr` and one column would not show the layout.
 */
const PLACEHOLDER_COLUMNS = ['Product', 'Connect']
  .map(
    (heading) =>
      `<nav class="${SITE_FOOTER_CLASSES.column}" aria-label="${heading} links">` +
      `<div class="${SITE_FOOTER_CLASSES.heading}">${heading}</div>` +
      `<ul class="${SITE_FOOTER_CLASSES.links}">` +
      `<li><a href="#" class="${SITE_FOOTER_CLASSES.link}">First link</a></li>` +
      `<li><a href="#" class="${SITE_FOOTER_CLASSES.link}">Second link</a></li>` +
      `</ul></nav>`,
  )
  .join('');

/**
 * The static form, for a consumer with no JavaScript.
 *
 * The link columns are the `content` argument, which is deliberately RAW — a footer's columns are
 * markup, not text, so escaping them would break the documented use. That is the same convention
 * every sibling keeps for its content slot, and the residual is recorded in #163.
 */
export function siteFooterStaticHtml(
  opts: SiteFooterStaticOptions = {},
  content = PLACEHOLDER_COLUMNS,
): string {
  const { brand = PLACEHOLDER_BRAND, legal = PLACEHOLDER_LEGAL } = opts;
  return (
    `<footer class="${SITE_FOOTER_CLASSES.root}">` +
    `<div class="${SITE_FOOTER_CLASSES.grid}">${brand}${content}</div>` +
    `<hr class="${SITE_FOOTER_CLASSES.divider}" />` +
    `<p class="${SITE_FOOTER_CLASSES.legal}">${legal}</p>` +
    `</footer>`
  );
}
