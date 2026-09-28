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
    status: { type: String, reflect: true },
  };

  /** Colour: `green`, `purple`, `breaking` or `yellow`. Omit for the neutral tag. An unknown
   *  value renders the base tag and warns rather than throwing. */
  declare variant: 'green' | 'purple' | 'breaking' | 'yellow' | undefined;

  /** Shape: `eyebrow` for the larger, square-cornered lead-in label. Omit for the compact pill. */
  declare shape: 'eyebrow' | undefined;

  // THE UNION IS SPELLED OUT HERE BECAUSE THE PIPELINE REQUIRES IT, not because the tag owns a
  // second vocabulary — the same reason `sk-card.ts`'s own `status` field records at length.
  // `scripts/build-vue-types.mjs` emits `'<attr>'?: <the manifest's type text>` verbatim into
  // packages/elements/vue.d.ts, and that file imports nothing from this package, so a
  // `StatusIndicatorTone` alias here would emit an unresolved identifier and fail typecheck-all.
  /** Operational status tone, orthogonal to `variant` and `shape` — a tag may carry any
   *  combination. The vocabulary is `sk-status-indicator`'s; this element holds no domain mapping
   *  and never infers a tone. An unknown value renders the base tag and warns rather than
   *  throwing. */
  declare status: 'neutral' | 'info' | 'success' | 'attention' | 'danger' | 'recovery' | undefined;

  render() {
    return html`<span part="tag" class=${pillTagClasses(this.variant, this.shape, this.status)}><slot></slot></span>`;
  }
}

define('sk-pill-tag', SkPillTag);
