import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import sheet from './sk-ribbon-card.css.js';
import { checkRibbonLabel, ribbonCardClasses, ribbonClasses } from './sk-ribbon-card.markup.js';

/**
 * A card with an optional diagonal ribbon tab in its corner.
 *
 * The title and body are slotted, because they are the consuming page's content. The ribbon's
 * LABEL is a property rather than a slot — it is a short string the component positions and
 * rotates, and ADR-9 §4 took the same route for the form controls' `label`.
 *
 * The two colour axes are independent: `variant` tints the card's border, `accent` tints
 * the tab, and a card may use either, both or neither.
 *
 * @element sk-ribbon-card
 * @slot - the card's title and body
 * @csspart card - the card frame
 * @csspart ribbon - the ribbon tab, absent from the DOM when no `ribbon` label is set
 * @csspart content - the content wrapper
 */
export class SkRibbonCard extends LitElement {
  static styles = [sheet];

  static properties = {
    variant: { type: String, reflect: true },
    ribbon: { type: String, reflect: true },
    accent: { type: String, reflect: true },
  };

  /** Border colour: `border-yellow`, `-green`, `-purple`, `-blue` or `-red`. Omit for the
   *  default neutral hairline. An unknown value renders the plain card and warns. */
  declare variant: string | undefined;

  /** The ribbon's label. The ribbon is rendered ONLY when this is set — an empty tab is a
   *  coloured shape with no text, which reads as a bug rather than as a plain card. */
  declare ribbon: string | undefined;

  /** The ribbon's colour: `yellow` (the default), `green`, `purple`, `blue` or `red`. Ignored
   *  when no `ribbon` label is set. */
  declare accent: string | undefined;

  render() {
    // `nothing`, not an empty string: Lit renders '' as an empty text node, and the ribbon's
    // absence must be absence — the [SC-013] test asserts `[part="ribbon"]` is null on a plain
    // card, and a consumer's `::part(ribbon)` rule must have nothing to match.
    //
    // ONE WORD, CHOSEN FOR VOCABULARY — and the first version of this comment overstated why.
    //
    // It claimed the rename was FORCED. It was not: a field name may differ from its attribute
    // name and that path is supported and tested — sk-nav-pill declares `isOpen` with
    // `attribute: 'open'` and packages/react/src/SkNavPill.js emits `open: isOpen`, with a gate
    // in build-react-wrappers.mjs covering exactly that rename. The real constraint is narrower:
    // an explicitly HYPHENATED `attribute:` value is not a valid JS property key, so the emitted
    // createElement props cannot carry it. `ribbonColour` with Lit's default attribute
    // (`ribboncolour`) would have round-tripped fine.
    //
    // So this is a naming decision, not a forced one, and it stands on its own merit: `accent`
    // is the word sk-feature-card uses in this same batch for the same idea — the colour of the
    // accent element inside the card — and a shared vocabulary across the catalogue is worth
    // more than a component-local noun.

    // Render-time side effect, not markup — hence a statement, not an interpolation.
    checkRibbonLabel(this.ribbon);
    return html`<article part="card" class=${ribbonCardClasses(this.variant, Boolean(this.ribbon))}>
      ${this.ribbon
        ? html`<div part="ribbon" class=${ribbonClasses(this.accent)}>${this.ribbon}</div>`
        : nothing}
      <div part="content" class="sk-ribbon-card__content"><slot></slot></div>
    </article>`;
  }
}

define('sk-ribbon-card', SkRibbonCard);
