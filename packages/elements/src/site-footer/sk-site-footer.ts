import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import sheet from './sk-site-footer.css.js';
import { SITE_FOOTER_CLASSES } from './sk-site-footer.markup.js';

// EVERYTHING IN THE `/** */` BELOW IS PUBLISHED API — the analyzer copies it verbatim into
// custom-elements.json and the React generator copies property descriptions into the prop docs a
// consumer reads in their editor. Rationale for maintainers goes in `//`, which the analyzer does
// not read.
//
// `@element sk-site-footer` is required: registration goes through the guarded `define()` helper
// (ADR-10 §5) and the analyzer cannot follow that indirection.
//
// THIS COMPONENT OWNS LAYOUT AND THEMING, NOT WORDS. Every previous migration in this batch
// carried at most a variant or two of content; this one carried a tagline, nine link labels, a
// legal line and a brand mark — all of them Spec Kitty's. Under #77's content-as-property ruling
// they are slotted, and what remains in the shadow root is the grid, the divider and the spacing.
/**
 * A site footer: a brand column, link columns, and a legal line.
 *
 * The component owns the layout — a responsive grid that collapses to one column, and the
 * divider above the legal line. Everything a reader sees is yours, supplied through the slots.
 *
 * @element sk-site-footer
 * @slot brand - a SINGLE element containing the mark, wordmark and tagline. Each assigned node
 *   becomes its own grid item, so wrap them in one box.
 * @slot - one element per link column, each becoming a grid item
 * @slot legal - the copyright line. When empty, the divider and legal row are not rendered.
 * @csspart footer - the footer element, for padding and border overrides
 * @csspart grid - the column grid, for layouts outside the provided one
 * @csspart divider - the rule above the legal line
 * @csspart legal - the legal line
 */
export class SkSiteFooter extends LitElement {
  static styles = [sheet];

  static properties = {
    // Internal, not an attribute: it is derived from what the consumer slotted, so an attribute
    // would let the two disagree.
    hasLegal: { state: true },
  };

  /** @internal Whether the `legal` slot has assigned content. */
  declare hasLegal: boolean;

  constructor() {
    super();
    this.hasLegal = false;
  }

  render() {
    // A wrapper div carries the grid, and the slotted children still become its grid items —
    // because a `<slot>` is `display: contents` by default, so it does not itself participate in
    // layout and its assigned nodes are laid out as children of the div. Setting `display: block`
    // on the slot would break that and make the slot the single grid item. sk-grid records the
    // same reasoning; this is the second component to depend on it.
    //
    // THE DIVIDER IS CONDITIONAL. A lens found that an unconditional `<hr>` renders over
    // nothing when a consumer slots no legal line: `<p part="legal">` collapses to zero height,
    // but the rule still draws with `margin: var(--sk-space-7) 0` above the root's
    // `--sk-space-8` bottom padding — a separator introducing nothing, which AT announces as
    // `role="separator"`. The static path never showed it because `siteFooterStaticHtml`
    // defaults `legal` to the placeholder, so this was an element/static divergence too.
    //
    // NO YEAR, AND NO FALLBACK LEGAL TEXT. The barrel this replaces computed
    // `new Date().getFullYear()` at module load. A component asserting a consumer's copyright is
    // wrong on its own terms, and reading a clock would make the GENERATED static form
    // non-deterministic — the artifact would stop matching a fresh generation on 1 January, with
    // no code change. ADR-11 item 9; see the markup module.
    return html`<footer part="footer" class=${SITE_FOOTER_CLASSES.root}>
      <div part="grid" class=${SITE_FOOTER_CLASSES.grid}>
        <slot name="brand"></slot>
        <slot></slot>
      </div>
      ${this.hasLegal
        ? html`<hr part="divider" class=${SITE_FOOTER_CLASSES.divider} />`
        : nothing}
      <p part="legal" class=${SITE_FOOTER_CLASSES.legal}>
        <slot
          name="legal"
          @slotchange=${(e: Event) => {
            this.hasLegal = (e.target as HTMLSlotElement).assignedNodes().length > 0;
          }}
        ></slot>
      </p>
    </footer>`;
  }
}

define('sk-site-footer', SkSiteFooter);
