import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-card.css.js';
import { cardClasses } from './sk-card.markup.js';

// EVERYTHING IN THE `/** */` BELOW IS PUBLISHED API. The analyzer copies the class
// description and each `@csspart` description verbatim into custom-elements.json, which IDE
// hovers and docs sites render. #72 shipped a 1144-character `@csspart` blob that way, and
// the first fix merely relocated 376 characters of it into the class description. Rationale
// for maintainers belongs here, in `//` comments the analyzer does not read.
//
// THE ANNOTATIONS ARE REQUIRED, NOT DECORATIVE:
//   * `@element sk-card` — registration goes through the guarded `define()` helper
//     (ADR-10 §5) and the analyzer cannot follow that indirection. Without it the manifest
//     carries no definition for this element and scripts/check-manifest-content.mjs fails.
//   * `@csspart card` — ADR-9's rule is that a consumer restyles through the part, never by
//     reaching into the shadow tree. An UNTERMINATED tag swallows everything after it, which
//     is how the blob above happened; keep tag descriptions to one short line.
//
// The variant contract is not repeated in prose: the manifest already carries
// `variant: 'blue' | 'purple' | undefined` from the field declaration below.
/**
 * The card primitive — the first real component on the ADR-8 base layer.
 *
 * @element sk-card
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
