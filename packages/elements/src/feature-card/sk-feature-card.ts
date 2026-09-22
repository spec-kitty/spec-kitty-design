import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-feature-card.css.js';
import { featureCardChipClasses, featureCardClasses } from './sk-feature-card.markup.js';

// Doc comments below are PUBLISHED API — the analyzer copies them into custom-elements.json and
// the React generator into the consumer's editor. Maintainer rationale goes in `//`.
/**
 * A feature card: an accented icon chip above a title and a short body.
 *
 * The icon, title and body are all slotted, because they are the consuming page's content. The
 * component owns the frame, the chip and the two colour axes — which are independent: `accent`
 * colours the chip, `variant` colours the card's border, and a card may have either, both or
 * neither.
 *
 * @element sk-feature-card
 * @slot icon - the chip's glyph, typically an inline SVG. Mark it `aria-hidden` unless it
 *   carries meaning the title does not.
 * @slot - the card's title and body
 * @csspart card - the card frame
 * @csspart chip - the icon chip, for an accent outside the provided set
 */
export class SkFeatureCard extends LitElement {
  static styles = [sheet];

  static properties = {
    variant: { type: String, reflect: true },
    accent: { type: String, reflect: true },
  };

  /** Border colour: `border-yellow`, `border-green` or `border-purple`. Omit for the default
   *  neutral hairline. An unknown value renders the plain card and warns rather than throwing. */
  declare variant: 'border-yellow' | 'border-green' | 'border-purple' | undefined;

  /** Icon-chip colour: `yellow` (the default), `green` or `purple`. An unknown value uses the
   *  default and warns. */
  declare accent: 'yellow' | 'green' | 'purple' | undefined;

  render() {
    // The chip is always rendered, even with nothing slotted into it: its size and fill are
    // part of the card's rhythm, and a card whose chip vanishes when the icon is omitted
    // reflows everything below it. The slot inside it may legitimately be empty.
    return html`<article part="card" class=${featureCardClasses(this.variant)}>
      <div part="chip" class=${featureCardChipClasses(this.accent)}><slot name="icon"></slot></div>
      <slot></slot>
    </article>`;
  }
}

define('sk-feature-card', SkFeatureCard);
