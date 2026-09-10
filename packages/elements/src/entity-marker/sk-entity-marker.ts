import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import sheet from './sk-entity-marker.css.js';

export type EntityMarkerSize = 'sm' | 'lg';
export type EntityMarkerShape = 'circle';
export type EntityMarkerBorder = 'true';

const entityMarkerSize = (value: unknown): EntityMarkerSize | undefined => {
  if (value === 'sm' || value === 'lg') return value;
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

// Reflected as a validated string enum, not a native boolean attribute: FR-011 requires this
// axis to warn-and-fall-open on an invalid value exactly like size/shape, and a Lit
// `type: Boolean` property has no "invalid value" state — any attribute presence (even
// `border="false"`) reads as true. A single legal value (`"true"`) keeps the authoring surface
// as close to a boolean as this fail-open contract allows.
const entityMarkerBorder = (value: unknown): EntityMarkerBorder | undefined => {
  if (value === 'true') return value;
  if (value != null && value !== '') {
    console.warn(`unknown entity-marker border "${String(value)}"; using unbordered`);
  }
  return undefined;
};

/**
 * A compact consumer-supplied icon, initials, or short mark with explicit accessible naming.
 *
 * Token dependencies: --sk-border-default, --sk-border-width-1, --sk-font-sans,
 * --sk-on-tint-butter, --sk-radius-pill, --sk-radius-sm, --sk-space-1, --sk-space-5,
 * --sk-space-7, --sk-space-9, --sk-surface-tint-butter, --sk-text-xs, --sk-weight-bold.
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
    border: { type: String, reflect: true },
  };

  /** Accessible name for a meaningful mark. Empty or whitespace-only values make it decorative. */
  declare label: string | undefined;

  /** Optional presentation size. Only `sm`/`lg` are supported; invalid values use the default size. */
  declare size: 'sm' | 'lg' | undefined;

  /** Optional circular presentation. Only `circle` is supported; invalid values use the square shape. */
  declare shape: 'circle' | undefined;

  /** Optional bordered presentation whose outer box is identical to the unbordered form. Only `true` is supported; invalid values render unbordered. */
  declare border: 'true' | undefined;

  render() {
    const label = this.label?.trim() ?? '';
    const size = entityMarkerSize(this.size);
    const shape = entityMarkerShape(this.shape);
    const border = entityMarkerBorder(this.border);
    return html`<span
      part="marker"
      class="sk-entity-marker${size ? ` sk-entity-marker--${size}` : ''}${
        shape === 'circle' ? ' sk-entity-marker--circle' : ''
      }${border === 'true' ? ' sk-entity-marker--bordered' : ''}"
      role=${label ? 'img' : nothing}
      aria-label=${label || nothing}
      aria-hidden=${label ? nothing : 'true'}
    >
      <span part="content" class="sk-entity-marker__content"><slot></slot></span>
    </span>`;
  }
}

define('sk-entity-marker', SkEntityMarker);
