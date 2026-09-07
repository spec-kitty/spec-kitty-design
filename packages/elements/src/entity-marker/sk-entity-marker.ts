import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import sheet from './sk-entity-marker.css.js';

export type EntityMarkerSize = 'sm';
export type EntityMarkerShape = 'circle';

const entityMarkerSize = (value: unknown): EntityMarkerSize | undefined => {
  if (value === 'sm') return value;
  if (value != null && value !== '') {
    console.warn(`unknown entity-marker size "${String(value)}"; using default`);
  }
  return undefined;
};

const entityMarkerShape = (value: unknown): EntityMarkerShape | undefined => {
  if (value === 'circle') return value;
  if (value != null && value !== '') {
    console.warn(`unknown entity-marker shape "${String(value)}"; using square`);
  }
  return undefined;
};

/**
 * A compact consumer-supplied icon, initials, or short mark with explicit accessible naming.
 *
 * Token dependencies: --sk-font-sans, --sk-on-tint-butter, --sk-radius-pill, --sk-radius-sm,
 * --sk-space-1, --sk-space-5, --sk-space-7, --sk-surface-tint-butter, --sk-text-xs,
 * --sk-weight-bold.
 *
 * @element sk-entity-marker
 * @slot - Consumer-supplied icon, initials, short mark, or direct image. Meaningful images use a host label and `alt=""`.
 * @csspart marker - The marker layout root.
 * @csspart content - The supplied-mark wrapper.
 */
export class SkEntityMarker extends LitElement {
  static styles = [sheet];
  static properties = {
    label: { type: String, reflect: true },
    size: { type: String, reflect: true },
    shape: { type: String, reflect: true },
  };

  /** Accessible name for a meaningful mark. Empty or whitespace-only values make it decorative. */
  declare label: string | undefined;

  /** Optional compact presentation. Only `sm` is supported; invalid values use the default size. */
  declare size: 'sm' | undefined;

  /** Optional circular presentation. Only `circle` is supported; invalid values use the square shape. */
  declare shape: 'circle' | undefined;

  render() {
    const label = this.label?.trim() ?? '';
    const size = entityMarkerSize(this.size);
    const shape = entityMarkerShape(this.shape);
    return html`<span
      part="marker"
      class="sk-entity-marker${size === 'sm' ? ' sk-entity-marker--sm' : ''}${
        shape === 'circle' ? ' sk-entity-marker--circle' : ''
      }"
      role=${label ? 'img' : nothing}
      aria-label=${label || nothing}
      aria-hidden=${label ? nothing : 'true'}
    >
      <span part="content" class="sk-entity-marker__content"><slot></slot></span>
    </span>`;
  }
}

define('sk-entity-marker', SkEntityMarker);
