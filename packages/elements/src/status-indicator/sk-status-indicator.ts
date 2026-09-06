import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-status-indicator.css.js';

export type StatusIndicatorTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'attention'
  | 'danger'
  | 'recovery';

// EXPORTED at #177, and the export is the point rather than a convenience.
//
// This array was module-private, so a second component needing the same tone set had no way to
// consume it and would have spelled the six values again — a fork nothing could detect. It is now
// the library's ONE authored tone list. `sk-card`'s status axis is held to it by an assertion
// (fixtures/elements-behaviour/src/sk-card.test.ts) rather than by an import, because
// `sk-card.markup.ts` is evaluated by scripts/build-element-markup.mjs from a `data:` URL and a
// relative import there is a named generator error.
//
// `//`, not `/** */`: a doc comment above an export is lifted verbatim into custom-elements.json.
/** The tone vocabulary, in presentation order. */
export const STATUS_TONES: ReadonlyArray<StatusIndicatorTone> = Object.freeze([
  'neutral',
  'info',
  'success',
  'attention',
  'danger',
  'recovery',
]);

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
