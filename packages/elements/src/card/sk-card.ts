import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-card.css.js';
import { cardClasses } from './sk-card.markup.js';

/**
 * The card primitive — the first real component on the ADR-8 base layer.
 *
 * THE PART DESCRIPTION IS PUBLISHED API — IDE hovers and docs sites render it, and the
 * analyzer takes everything after `@csspart card - ` up to the next tag. An unterminated tag
 * swallowed this entire docblock into custom-elements.json, so all prose lives ABOVE the tag
 * block. The ADR-9 rule is that a consumer restyles through the part, never by reaching into
 * the shadow tree.
 *
 * @element sk-card
 *
 * The `@element` annotation is REQUIRED, not decorative: registration goes through the
 * guarded `define()` helper (ADR-10 §5) and the manifest analyzer cannot follow that
 * indirection. Without it the manifest carries no definition for this element, and
 * scripts/check-manifest-content.mjs fails.
 *
 * @csspart card - the card surface
 */
export class SkCard extends LitElement {
  static styles = [sheet];

  static properties = {
    variant: { type: String, reflect: true },
    inset: { type: Boolean, reflect: true },
  };

  declare variant: 'blue' | 'purple' | undefined;
  declare inset: boolean;

  constructor() {
    super();
    this.inset = false;
  }

  render() {
    // The class list comes from sk-card.markup.ts, which is also what generates the static
    // HTML and the template-literal exports — ADR-10 §3's "authored once".
    return html`<div part="card" class=${cardClasses(this.variant, this.inset)}><slot></slot></div>`;
  }
}

define('sk-card', SkCard);
