import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-pill-tag.css.js';
import { pillTagClasses } from './sk-pill-tag.markup.js';

/**
 * A small inline label — a version tag, a status chip, or an eyebrow above a headline.
 *
 * `variant` sets the colour and `shape` sets the size; they are independent, so a tinted
 * eyebrow is expressible. The label is slotted, because the text is the consuming page's.
 *
 * @element sk-pill-tag
 * @slot - the label text
 * @csspart tag - the tag itself, for a treatment outside the provided variants
 */
export class SkPillTag extends LitElement {
  static styles = [sheet];

  static properties = {
    variant: { type: String, reflect: true },
    shape: { type: String, reflect: true },
  };

  /** Colour: `green`, `purple`, `breaking` or `yellow`. Omit for the neutral tag. An unknown
   *  value renders the base tag and warns rather than throwing. */
  declare variant: 'green' | 'purple' | 'breaking' | 'yellow' | undefined;

  /** Shape: `eyebrow` for the larger, square-cornered lead-in label. Omit for the compact pill. */
  declare shape: 'eyebrow' | undefined;

  render() {
    return html`<span part="tag" class=${pillTagClasses(this.variant, this.shape)}><slot></slot></span>`;
  }
}

define('sk-pill-tag', SkPillTag);
