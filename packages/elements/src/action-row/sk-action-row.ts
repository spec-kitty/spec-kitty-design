import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import sheet from './sk-action-row.css.js';

export type ActionRowActivateDetail = Readonly<{ id: string }>;
export type ActionRowLayout = 'card';

type ActionRowState = HTMLElement & {
  href: string | undefined;
  rowId: string | undefined;
  selectable: boolean;
};

const isRoute = (row: ActionRowState): boolean =>
  typeof row.href === 'string' && row.href.trim() !== '';

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

const actionRowLayout = (value: unknown): ActionRowLayout | undefined => {
  if (value === 'card') return value;
  if (value !== undefined && value !== '') {
    console.warn(`unknown action-row layout "${String(value)}"; using row`);
  }
  return undefined;
};

const ACTION_ROW_TITLE_ID = 'sk-action-row-title';

const scanContent = (syncSlot: (slot: HTMLSlotElement) => void) => html`
  <span part="marker" class="sk-action-row__marker" hidden
    ><slot name="marker" @slotchange=${(event: Event) => syncSlot(event.currentTarget as HTMLSlotElement)}></slot
  ></span>
  <span id=${ACTION_ROW_TITLE_ID} part="title" class="sk-action-row__title"><slot name="title"></slot></span>
  <span part="reference" class="sk-action-row__reference"><slot name="reference"></slot></span>
  <span part="tags" class="sk-action-row__tags" hidden
    ><slot name="tags" @slotchange=${(event: Event) => syncSlot(event.currentTarget as HTMLSlotElement)}></slot
  ></span>
  <span part="metadata" class="sk-action-row__metadata"><slot name="metadata"></slot></span>
  <span part="supporting" class="sk-action-row__supporting" hidden
    ><slot name="supporting" @slotchange=${(event: Event) => syncSlot(event.currentTarget as HTMLSlotElement)}></slot
  ></span>
`;

/**
 * A controlled, consumer-composed action row with optional native-route and flush presentation modes.
 *
 * Token dependencies: --sk-border-default, --sk-border-strong, --sk-border-width-1,
 * --sk-border-width-2, --sk-color-accent, --sk-fg-body, --sk-fg-default, --sk-fg-muted,
 * --sk-font-display, --sk-font-mono, --sk-font-sans, --sk-motion-duration-fast,
 * --sk-motion-ease-out, --sk-radius-md, --sk-space-1, --sk-space-2, --sk-space-3,
 * --sk-space-4, --sk-space-5, --sk-surface-card, --sk-surface-muted, --sk-surface-pill,
 * --sk-text-base, --sk-text-xs, --sk-weight-semibold.
 *
 * @element sk-action-row
 * @slot marker - Consumer-supplied visual marker.
 * @slot title - Primary consumer-authored title.
 * @slot reference - Consumer-authored reference or path.
 * @slot tags - Consumer-authored semantic tags.
 * @slot metadata - Consumer-authored trailing metadata.
 * @slot supporting - Optional consumer-authored secondary context.
 * @slot controls - Independent trailing controls.
 * @csspart row - Stable row root.
 * @csspart trigger - Primary scan-content surface.
 * @csspart marker - Marker projection wrapper.
 * @csspart title - Title projection wrapper.
 * @csspart reference - Reference projection wrapper.
 * @csspart tags - Tags projection wrapper.
 * @csspart metadata - Metadata projection wrapper.
 * @csspart supporting - Optional secondary-context wrapper.
 * @csspart controls - Independent controls wrapper.
 * @fires {CustomEvent<ActionRowActivateDetail>} sk-action-row-activate - Requests activation for the exact consumer row ID in selectable-button mode. Native-route mode does not emit this event. The event bubbles, is composed, and is not cancelable.
 */
export class SkActionRow extends LitElement {
  static styles = [sheet];

  static properties = {
    rowId: { type: String, attribute: 'row-id', reflect: true },
    selectable: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    layout: { type: String, reflect: true },
    href: { type: String, reflect: true },
    presentation: { type: String, reflect: true },
  };

  /** Stable consumer-owned identifier included in activation requests. */
  declare rowId: string | undefined;

  /** Enables the native primary trigger when `rowId` is non-empty. */
  selectable = false;

  /** Consumer-controlled current-row presentation. Activation never changes this value. */
  selected = false;

  /** Optional compact presentation. Only `card` is supported; invalid values use the default row layout. */
  declare layout: 'card' | undefined;

  /** Opaque native route destination. A non-blank value takes precedence over selectable-button mode. */
  declare href: string | undefined;

  /** Optional container-owned presentation. Only `flush` is supported; invalid values use the bordered row. */
  declare presentation: 'flush' | undefined;

  #lastWarnedPresentation: string | undefined;
  #warnedMixed: string | undefined;

  #actionRowPresentation(value: unknown): 'flush' | undefined {
    if (value === 'flush') {
      this.#lastWarnedPresentation = undefined;
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      if (this.#lastWarnedPresentation !== value) {
        console.warn(`unknown action-row presentation "${String(value)}"; using bordered row`);
        this.#lastWarnedPresentation = value;
      }
    } else {
      this.#lastWarnedPresentation = undefined;
    }
    return undefined;
  }

  protected willUpdate(): void {
    const mixed = isRoute(this) && this.selectable ? this.href : undefined;
    if (mixed !== undefined && this.#warnedMixed !== mixed) {
      console.warn('action-row href and selectable are both set; using native route mode');
    }
    this.#warnedMixed = mixed;
  }

  #syncSlot(slot: HTMLSlotElement): void {
    const hasContent = slot.assignedNodes({ flatten: true }).some(
      (node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent?.trim().length ?? 0) > 0,
    );
    slot.parentElement?.toggleAttribute('hidden', !hasContent);
  }

  protected firstUpdated(): void {
    this.renderRoot
      .querySelectorAll<HTMLSlotElement>(
        'slot[name="marker"], slot[name="tags"], slot[name="supporting"], slot[name="controls"]',
      )
      .forEach((slot) => this.#syncSlot(slot));
  }

  render() {
    const content = scanContent((slot) => this.#syncSlot(slot));
    const layout = actionRowLayout(this.layout);
    const presentation = this.#actionRowPresentation(this.presentation);
    const route = isRoute(this);
    return html`<div
      part="row"
      class="sk-action-row${layout === 'card' ? ' sk-action-row--card' : ''}${
        presentation === 'flush' ? ' sk-action-row--flush' : ''
      }"
      aria-current=${this.selected && !route ? 'true' : nothing}
    >
      ${
        route
          ? html`<a
              part="trigger"
              class="sk-action-row__trigger"
              href=${this.href!}
              aria-labelledby=${ACTION_ROW_TITLE_ID}
              aria-current=${this.selected ? 'page' : nothing}
            >
              ${content}
            </a>`
          : isActionable(this)
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
      <div part="controls" class="sk-action-row__controls" hidden>
        <slot name="controls" @slotchange=${(event: Event) => this.#syncSlot(event.currentTarget as HTMLSlotElement)}></slot>
      </div>
    </div>`;
  }
}

define('sk-action-row', SkActionRow);
