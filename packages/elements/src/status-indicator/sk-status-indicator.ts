import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-status-indicator.css.js';

// THE VOCABULARY MOVED, and the re-export is why nothing else had to (#216).
//
// `STATUS_TONES` and its union are now authored in `./status-tones.js`, a leaf module with no
// imports of its own, because `scripts/build-element-markup.mjs` evaluates a `*.markup.ts` in a
// bare Node process and cannot reach this file: it imports `lit`, and `define.js` patches
// `customElements.define` at module scope. `sk-card.markup.ts` consumes the vocabulary from the
// leaf; every existing consumer — the package barrel, the behaviour fixtures, the stories,
// `sk-notice` — still reads it from here, unchanged.
//
// Exported at #177 and still the library's ONE authored tone list. What changed at #216 is that a
// second component no longer has to restate it: the copy `sk-card` carried, and the
// order-sensitive assertion that held the copy honest, are both gone.
import { STATUS_TONES, type StatusIndicatorTone } from './status-tones.js';

export { STATUS_TONES, type StatusIndicatorTone };

const statusTone = (value: unknown): StatusIndicatorTone => {
  if (typeof value === 'string' && STATUS_TONES.includes(value as StatusIndicatorTone)) {
    return value as StatusIndicatorTone;
  }
  if (value !== undefined && value !== '') {
    console.warn(`unknown status-indicator tone "${String(value)}"; using neutral`);
  }
  return 'neutral';
};

/**
 * A consumer-labelled status with a presentation-only tone and decorative marker.
 *
 * Token dependencies: --sk-color-red, --sk-fg-body, --sk-fg-muted, --sk-font-sans,
 * --sk-on-tint-butter, --sk-on-tint-lilac, --sk-on-tint-mint, --sk-on-tint-sky,
 * --sk-space-2, --sk-text-sm.
 *
 * @element sk-status-indicator
 * @slot marker - A decorative consumer-supplied marker or icon.
 * @slot - Visible consumer-supplied status text.
 * @csspart status - The indicator layout root.
 * @csspart marker - The decorative marker wrapper.
 * @csspart text - The visible-text wrapper.
 */
export class SkStatusIndicator extends LitElement {
  static styles = [sheet];
  static properties = {
    tone: { type: String, reflect: true },
  };

  /** Presentation tone. Unknown values render as `neutral` without changing the visible text. */
  declare tone: 'neutral' | 'info' | 'success' | 'attention' | 'danger' | 'recovery' | undefined;

  render() {
    const tone = statusTone(this.tone);
    return html`<span part="status" class="sk-status-indicator sk-status-indicator--${tone}" data-tone=${tone}>
      <span part="marker" class="sk-status-indicator__marker" aria-hidden="true"><slot name="marker"></slot></span>
      <span part="text" class="sk-status-indicator__text"><slot></slot></span>
    </span>`;
  }
}

define('sk-status-indicator', SkStatusIndicator);
