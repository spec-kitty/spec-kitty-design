import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import sheet from './sk-action-row.css.js';

export type ActionRowActivateDetail = Readonly<{ id: string }>;

type ActionRowState = HTMLElement & {
  rowId: string | undefined;
  selectable: boolean;
};

const isActionable = (row: ActionRowState): boolean =>
  row.selectable && typeof row.rowId === 'string' && row.rowId.trim() !== '';

const requestActivation = (row: ActionRowState): void => {
  if (!isActionable(row)) return;
  const event = new CustomEvent<ActionRowActivateDetail>('sk-action-row-activate', {
    detail: { id: row.rowId! },
    bubbles: true,
    composed: true,
    cancelable: false,
  });
  row.dispatchEvent(event);
};

const suppressRepeatedActivation = (event: KeyboardEvent): void => {
  if (!event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
};

const scanContent = () => html`
  <span part="marker" class="sk-action-row__marker"><slot name="marker"></slot></span>
  <span part="title" class="sk-action-row__title"><slot name="title"></slot></span>
  <span part="reference" class="sk-action-row__reference"><slot name="reference"></slot></span>
  <span part="tags" class="sk-action-row__tags"><slot name="tags"></slot></span>
  <span part="metadata" class="sk-action-row__metadata"><slot name="metadata"></slot></span>
`;

/**
 * A controlled, consumer-composed action row.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-fg-body, --sk-fg-default, --sk-fg-muted,
 * --sk-font-display, --sk-font-mono, --sk-font-sans, --sk-motion-duration-fast,
 * --sk-motion-ease-out, --sk-radius-md, --sk-space-1, --sk-space-2, --sk-space-3,
 * --sk-space-4, --sk-space-5, --sk-surface-card, --sk-surface-muted, --sk-surface-pill,
 * --sk-text-base, --sk-text-sm, --sk-text-xs, --sk-weight-medium, --sk-weight-semibold.
 *
 * @element sk-action-row
 * @slot marker - Consumer-supplied visual marker.
 * @slot title - Primary consumer-authored title.
 * @slot reference - Consumer-authored reference or path.
 * @slot tags - Consumer-authored semantic tags.
 * @slot metadata - Consumer-authored trailing metadata.
 * @slot controls - Independent trailing controls.
 * @csspart row - Stable row root.
 * @csspart trigger - Primary scan-content surface.
 * @csspart marker - Marker projection wrapper.
 * @csspart title - Title projection wrapper.
 * @csspart reference - Reference projection wrapper.
 * @csspart tags - Tags projection wrapper.
 * @csspart metadata - Metadata projection wrapper.
 * @csspart controls - Independent controls wrapper.
 * @fires {CustomEvent<ActionRowActivateDetail>} sk-action-row-activate - Requests activation for the exact consumer row ID. The event bubbles, is composed, and is not cancelable.
 */
export class SkActionRow extends LitElement {
  static styles = [sheet];

  static properties = {
    rowId: { type: String, attribute: 'row-id', reflect: true },
    selectable: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
  };

  /** Stable consumer-owned identifier included in activation requests. */
  declare rowId: string | undefined;

  /** Enables the native primary trigger when `rowId` is non-empty. */
  selectable = false;

  /** Consumer-controlled current-row presentation. Activation never changes this value. */
  selected = false;

  render() {
    const content = scanContent();
    return html`<div part="row" class="sk-action-row" aria-current=${this.selected ? 'true' : nothing}>
      ${
        isActionable(this)
          ? html`<button
              part="trigger"
              class="sk-action-row__trigger"
              type="button"
              @click=${() => requestActivation(this)}
              @keydown=${suppressRepeatedActivation}
            >
              ${content}
            </button>`
          : html`<div part="trigger" class="sk-action-row__trigger sk-action-row__trigger--static">${content}</div>`
      }
      <div part="controls" class="sk-action-row__controls">
        <slot name="controls"></slot>
      </div>
    </div>`;
  }
}

define('sk-action-row', SkActionRow);
