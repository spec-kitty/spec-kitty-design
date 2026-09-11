import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import sheet from './sk-site-footer.css.js';
import { SITE_FOOTER_CLASSES, siteFooterClasses } from './sk-site-footer.markup.js';

// Doc comments below are PUBLISHED API — the analyzer copies them into custom-elements.json and
// the React generator into the consumer's editor hover. Maintainer rationale goes in `//`.
//
// `@element sk-site-footer` is required: registration goes through the guarded `define()` helper
// (ADR-10 §5) and the analyzer cannot follow that indirection.
/**
 * A site footer: a brand column, two link columns, and a legal line.
 *
 * The element owns the structure — the grid, the `<nav>`s, the headings, the `<ul>`s, the divider
 * and the legal line. Text arrives as properties; only the link ITEMS are slotted, as `<li>`
 * elements that land directly inside the element's own `<ul>`.
 *
 * @element sk-site-footer
 * @slot column-one - `<li>` items for the first link column
 * @slot column-two - `<li>` items for the second link column
 * @slot compact-links - the compact presentation's links, as native `<a>` elements
 *
 * The slot NAMES keep their hyphens — a slot name is a string, not a property key, so the
 * constraint that shaped `headingOne`/`headingTwo` does not reach them.
 * @csspart footer - the footer element, for padding and border overrides
 * @csspart grid - the column grid, for layouts outside the provided one
 * @csspart divider - the rule above the legal line, absent when `legal` is empty
 * @csspart legal - the legal line
 */
export class SkSiteFooter extends LitElement {
  static styles = [sheet];

  static properties = {
    wordmark: { type: String, reflect: true },
    tagline: { type: String, reflect: true },
    legal: { type: String, reflect: true },
    // NO `attribute:` OVERRIDE, and the names are chosen so Lit's default lowercasing yields a
    // valid JS key. An earlier revision declared `column-one-heading`, and the wrapper gate
    // refused it: under ssrSafe the first render writes an ATTRIBUTE, so the generated
    // createElement prop key must BE the attribute name — and a hyphenated name is not a valid
    // key. This repo has paid for that twice already, renaming `thumbnailAlt` -> `alt` and
    // `ribbonColour` -> `accent`. `headingOne` observes `headingone`, which round-trips.
    headingOne: { type: String, reflect: true },
    headingTwo: { type: String, reflect: true },
    presentation: { type: String, reflect: true },
  };

  /** The brand wordmark. */
  declare wordmark: string | undefined;

  /** One sentence under the wordmark. */
  declare tagline: string | undefined;

  /** The copyright line. Omit it and the divider above it is not rendered either. */
  declare legal: string | undefined;

  /** Heading for the first link column. */
  declare headingOne: string | undefined;

  /** Heading for the second link column. */
  declare headingTwo: string | undefined;

  /** Selects the compact, server-renderable presentation. Omit for the full presentation. */
  declare presentation: 'full' | 'compact' | undefined;

  render() {
    // BRANCHED FIRST, on the property alone — `undefined` and any unsupported string both fall
    // through to the full presentation below, which is otherwise completely untouched by this
    // mission: nothing here edits its template literal or its `#column()` helper.
    if (this.presentation === 'compact') {
      return this.#renderCompact();
    }
    // EVERY STRING IS A PROPERTY AND EVERY LIST IS A SLOT — the operator's ruling on #77.
    //
    // The `<ul>` is the element's, so `::slotted(li)` reaches the items a consumer supplies: they
    // are DIRECTLY assigned, which is the whole reason the ruling put the boundary here rather
    // than around the column. It keeps `<ul>`/`<li>` semantics intact and keeps structured data
    // off an attribute boundary, which matters because the React wrappers' ssrSafe mode delivers
    // first-render props as attributes and those carry only strings.
    //
    // THE DIVIDER IS CONDITIONAL ON A PROPERTY, read synchronously during render. An earlier
    // revision of this component derived it from a `slotchange` handler, and a lens measured the
    // consequence: `updateComplete` resolved `true` while the tree was still going to change,
    // because the handler's `requestUpdate` lands after `__enqueueUpdate` has already decided no
    // update is pending. A property has no such gap.
    const legal = (this.legal ?? '').trim();
    return html`<footer part="footer" class=${SITE_FOOTER_CLASSES.root}>
      <div part="grid" class=${SITE_FOOTER_CLASSES.grid}>
        <div class=${SITE_FOOTER_CLASSES.column}>
          <div class=${SITE_FOOTER_CLASSES.brand}>
            <span class=${SITE_FOOTER_CLASSES.wordmark}>${this.wordmark ?? nothing}</span>
          </div>
          <p class=${SITE_FOOTER_CLASSES.tagline}>${this.tagline ?? nothing}</p>
        </div>
        ${this.#column(this.headingOne, 'column-one')}
        ${this.#column(this.headingTwo, 'column-two')}
      </div>
      ${legal ? html`<hr part="divider" class=${SITE_FOOTER_CLASSES.divider} />` : nothing}
      <p part="legal" class=${SITE_FOOTER_CLASSES.legal}>${legal || nothing}</p>
    </footer>`;
  }

  // One column, written once rather than twice. `aria-label` is derived from the heading so the
  // two cannot drift, which is the defect the static form's `column()` helper also closes.
  #column(heading: string | undefined, slot: string) {
    return html`<nav
      class=${SITE_FOOTER_CLASSES.column}
      aria-label=${heading ? `${heading} links` : nothing}
    >
      <div class=${SITE_FOOTER_CLASSES.heading}>${heading ?? nothing}</div>
      <ul class=${SITE_FOOTER_CLASSES.links}>
        <slot name=${slot}></slot>
      </ul>
    </nav>`;
  }

  // THE COMPACT PRESENTATION (#354, plan.md D-4) — a bare `<slot>` for the links, NOT a `<ul>`.
  // No `<nav>`, no heading, no `<ul>` under any input: a slot with no assigned nodes and no
  // fallback content contributes nothing to the accessibility tree and paints nothing, so zero
  // links needs no conditional — there is nothing to be empty, structurally.
  //
  // `wordmark`/`tagline`/`legal` are each rendered only when set, so a consumer who supplies the
  // Family 6 shape (tagline + legal, no wordmark) gets exactly that tree and nothing else.
  #renderCompact() {
    const legal = (this.legal ?? '').trim();
    return html`<footer part="footer" class=${siteFooterClasses(this.presentation)}>
      <div class=${SITE_FOOTER_CLASSES.row}>
        <div class=${SITE_FOOTER_CLASSES.meta}>
          ${this.wordmark
            ? html`<div class=${SITE_FOOTER_CLASSES.brand}>
                <span class=${SITE_FOOTER_CLASSES.wordmark}>${this.wordmark}</span>
              </div>`
            : nothing}
          ${this.tagline
            ? html`<p class=${SITE_FOOTER_CLASSES.tagline}>${this.tagline}</p>`
            : nothing}
          ${legal ? html`<p part="legal" class=${SITE_FOOTER_CLASSES.legal}>${legal}</p>` : nothing}
        </div>
        <slot name="compact-links"></slot>
      </div>
    </footer>`;
  }
}

define('sk-site-footer', SkSiteFooter);
