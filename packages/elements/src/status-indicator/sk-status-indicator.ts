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

const TONES: ReadonlyArray<StatusIndicatorTone> = Object.freeze([
  'neutral',
  'info',
  'success',
  'attention',
  'danger',
  'recovery',
]);

const statusTone = (value: unknown): StatusIndicatorTone => {
  if (typeof value === 'string' && TONES.includes(value as StatusIndicatorTone)) {
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
