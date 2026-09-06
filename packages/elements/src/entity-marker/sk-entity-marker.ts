import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import sheet from './sk-entity-marker.css.js';

/**
 * A compact consumer-supplied icon, initials, or short mark with explicit accessible naming.
 *
 * Token dependencies: --sk-font-sans, --sk-on-tint-butter, --sk-radius-sm, --sk-space-1,
 * --sk-space-7, --sk-surface-tint-butter, --sk-text-xs, --sk-weight-bold.
 *
 * @element sk-entity-marker
 * @slot - Consumer-supplied icon, initials, or short mark.
 * @csspart marker - The marker layout root.
 * @csspart content - The supplied-mark wrapper.
 */
export class SkEntityMarker extends LitElement {
  static styles = [sheet];
  static properties = {
    label: { type: String, reflect: true },
  };

  /** Accessible name for a meaningful mark. Empty or whitespace-only values make it decorative. */
  declare label: string | undefined;

  render() {
    const label = this.label?.trim() ?? '';
    return html`<span
      part="marker"
      class="sk-entity-marker"
      role=${label ? 'img' : nothing}
      aria-label=${label || nothing}
      aria-hidden=${label ? nothing : 'true'}
    >
      <span part="content" class="sk-entity-marker__content"><slot></slot></span>
    </span>`;
  }
}

define('sk-entity-marker', SkEntityMarker);
