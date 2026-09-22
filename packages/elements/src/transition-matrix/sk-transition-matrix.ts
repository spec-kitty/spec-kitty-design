import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { define } from '../define.js';
import sheet from './sk-transition-matrix.css.js';

export type TransitionColumn = Readonly<{ id: string; label: string }>;
export type TransitionTone = 'forward' | 'completed' | 'blocked' | 'recovery' | 'backward';
export type TransitionRoute = Readonly<{
  id: string;
  label: string;
  tone: TransitionTone;
  group?: string;
  values: Readonly<Record<string, number>>;
}>;
export type TransitionMatrixSelectDetail = Readonly<{ routeId: string }>;

type ValidMatrix = Readonly<{
  columns: ReadonlyArray<TransitionColumn>;
  routes: ReadonlyArray<TransitionRoute>;
  maximum: number;
  overallTotal: number;
}>;

const TONES: ReadonlyArray<TransitionTone> = Object.freeze([
  'forward', 'completed', 'blocked', 'recovery', 'backward',
]);
const TONE_LABELS: Readonly<Record<TransitionTone, string>> = Object.freeze({
  forward: 'Forward',
  completed: 'Completed',
  blocked: 'Blocked',
  recovery: 'Recovery',
  backward: 'Backward',
});
let nextMatrixInstanceId = 0;

const validId = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const isTone = (value: unknown): value is TransitionTone =>
  typeof value === 'string' && TONES.includes(value as TransitionTone);

const validateMatrix = (
  columns: ReadonlyArray<TransitionColumn>,
  routes: ReadonlyArray<TransitionRoute>,
): ValidMatrix | null => {
  if (!Array.isArray(columns) || !Array.isArray(routes)) return null;
  if (columns.length === 0 || routes.length === 0) return null;

  const columnIds = columns.map((column) => column?.id);
  const routeIds = routes.map((route) => route?.id);
  if (
    columnIds.some((id) => !validId(id)) ||
    routeIds.some((id) => !validId(id)) ||
    new Set(columnIds).size !== columnIds.length ||
    new Set(routeIds).size !== routeIds.length
  ) return null;

  let maximum = 0;
  let overallTotal = 0;
  const expectedKeys = new Set(columnIds);
  for (const route of routes) {
    if (!route || !isTone(route.tone) || route.values === null || typeof route.values !== 'object') {
      return null;
    }
    const actualKeys = Object.keys(route.values);
    if (actualKeys.length !== columnIds.length || actualKeys.some((key) => !expectedKeys.has(key))) {
      return null;
    }
    for (const columnId of columnIds) {
      const value = route.values[columnId];
      if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) return null;
      maximum = Math.max(maximum, value);
      overallTotal += value;
    }
  }
  return { columns, routes, maximum, overallTotal };
};

const toneIcon = (tone: TransitionTone): TemplateResult => {
  switch (tone) {
    case 'blocked':
      return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m7 7 10 10"></path></svg>`;
    case 'completed':
      return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>`;
    case 'recovery':
      return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 3-6"></path><path d="M4 4v6h6"></path></svg>`;
    case 'backward':
      return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>`;
    default:
      return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg>`;
  }
};

/**
 * An aggregate route-by-time-bucket transition matrix with controlled route-selection intent.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-color-blue, --sk-color-green,
 * --sk-color-purple, --sk-color-red, --sk-fg-body, --sk-fg-default, --sk-fg-muted,
 * --sk-fg-on-card, --sk-font-mono, --sk-font-sans, --sk-radius-lg, --sk-radius-sm,
 * --sk-space-1, --sk-space-2, --sk-space-3, --sk-space-4, --sk-space-5,
 * --sk-space-6, --sk-space-10, --sk-space-12, --sk-surface-card,
 * --sk-surface-muted, --sk-surface-pill, --sk-text-lg, --sk-text-sm, --sk-text-xs,
 * --sk-weight-medium, --sk-weight-semibold.
 *
 * @element sk-transition-matrix
 * @fires {CustomEvent<TransitionMatrixSelectDetail>} sk-transition-matrix-select - Requests that the consumer inspect a route. The event bubbles, is composed, and is not cancelable.
 * @csspart header - Title, derived move total, and consumer-supplied window label.
 * @csspart legend - Ordered labels for the tones present in the supplied routes.
 * @csspart scroller - Horizontally scrollable table viewport.
 * @csspart table - Native transition matrix table.
 * @csspart group - Visible separator for a contiguous named route group.
 * @csspart row - A route row.
 * @csspart route - A route row header.
 * @csspart bar - A proportional magnitude bar.
 * @csspart total - A derived route total.
 * @csspart empty-state - Labelled empty or invalid-data state.
 */
export class SkTransitionMatrix extends LitElement {
  static styles = [sheet];
  static properties = {
    columns: { attribute: false },
    routes: { attribute: false },
    selectedRouteId: { type: String, attribute: 'selected-route-id' },
    selectable: { type: Boolean, reflect: true },
    windowLabel: { type: String, attribute: 'window-label' },
    description: { type: String },
    selectionHint: { type: String, attribute: 'selection-hint' },
  };

  /** Consumer-labelled time buckets, assigned as a JavaScript property. */
  columns: ReadonlyArray<TransitionColumn> = Object.freeze([]);
  /** Aggregate transition routes, assigned as a JavaScript property. */
  routes: ReadonlyArray<TransitionRoute> = Object.freeze([]);
  /** Consumer-controlled selected route id. */
  declare selectedRouteId: string | undefined;
  /** Enables route-selection intent without taking ownership of selection. */
  selectable = false;
  /** Optional consumer-authored label for the reporting window. */
  windowLabel = '';
  /** Optional consumer-authored explanation shown above the matrix. */
  description = '';
  /** Optional consumer-authored selectable-row instruction. */
  selectionHint = '';

  readonly #idPrefix = `sk-transition-matrix-${++nextMatrixInstanceId}`;
  #pressedRouteId: string | null = null;

  #id(suffix: string): string {
    return `${this.#idPrefix}-${suffix}`;
  }

  #activate(routeId: string): void {
    if (!this.selectable) return;
    this.dispatchEvent(new CustomEvent<TransitionMatrixSelectDetail>('sk-transition-matrix-select', {
      detail: { routeId }, bubbles: true, composed: true, cancelable: false,
    }));
  }

  #onClick(event: Event, routeId: string): void {
    if (!event.defaultPrevented) this.#activate(routeId);
  }

  #onKeyDown(event: KeyboardEvent, routeId: string): void {
    if (!this.selectable || (event.key !== 'Enter' && event.key !== ' ')) return;
    if (event.key === ' ') event.preventDefault();
    if (event.repeat) return;
    this.#pressedRouteId = routeId;
    this.requestUpdate();
    this.#activate(routeId);
  }

  #clearPressed(routeId: string): void {
    if (this.#pressedRouteId !== routeId) return;
    this.#pressedRouteId = null;
    this.requestUpdate();
  }

  willUpdate(): void {
    if (
      this.#pressedRouteId !== null &&
      (!this.selectable ||
        validateMatrix(this.columns, this.routes) === null ||
        !this.routes.some((route) => route.id === this.#pressedRouteId))
    ) {
      this.#pressedRouteId = null;
    }
  }

  #renderLegend(routes: ReadonlyArray<TransitionRoute>): TemplateResult {
    const present = new Set(routes.map((route) => route.tone));
    return html`<ul part="legend" class="sk-transition-matrix__legend" aria-label="Move tone legend">
      ${TONES.filter((tone) => present.has(tone)).map((tone) => html`
        <li class="sk-transition-matrix__legend-item sk-transition-matrix__legend-item--${tone}" data-tone=${tone}>
          <span class="sk-transition-matrix__icon">${toneIcon(tone)}</span><span>${TONE_LABELS[tone]}</span>
        </li>`)}
    </ul>`;
  }

  #renderRoute(route: TransitionRoute, routeIndex: number, matrix: ValidMatrix): TemplateResult {
    const routeHeaderId = this.#id(`route-${routeIndex}`);
    const routeTotalId = this.#id(`route-total-${routeIndex}`);
    const routeTotal = matrix.columns.reduce((sum, column) => sum + route.values[column.id], 0);
    const selected = route.id === this.selectedRouteId;
    const pressed = this.selectable && route.id === this.#pressedRouteId;
    const events = this.selectable;
    return html`<tr
      part="row"
      class="sk-transition-matrix__row sk-transition-matrix__row--${route.tone}"
      data-route-id=${route.id}
      data-tone=${route.tone}
      data-pressed=${pressed ? 'true' : nothing}
      tabindex=${this.selectable ? '0' : nothing}
      aria-selected=${selected ? 'true' : 'false'}
      @click=${events ? (event: Event) => this.#onClick(event, route.id) : nothing}
      @keydown=${events ? (event: KeyboardEvent) => this.#onKeyDown(event, route.id) : nothing}
      @keyup=${events ? () => this.#clearPressed(route.id) : nothing}
      @pointerdown=${events ? () => { this.#pressedRouteId = route.id; this.requestUpdate(); } : nothing}
      @pointerup=${events ? () => this.#clearPressed(route.id) : nothing}
      @pointercancel=${events ? () => this.#clearPressed(route.id) : nothing}
      @pointerleave=${events ? () => this.#clearPressed(route.id) : nothing}
      @blur=${events ? () => this.#clearPressed(route.id) : nothing}
    >
      <th part="route" class="sk-transition-matrix__route" id=${routeHeaderId} scope="row">
        <span class="sk-transition-matrix__route-label">
          <span class="sk-transition-matrix__icon sk-transition-matrix__icon--${route.tone}">${toneIcon(route.tone)}</span>
          <span>${route.label}</span>
        </span>
      </th>
      ${matrix.columns.map((column, columnIndex) => {
        const value = route.values[column.id];
        const ratio = matrix.maximum === 0 ? 0 : value / matrix.maximum;
        return html`<td class="sk-transition-matrix__cell" headers="${routeHeaderId} ${this.#id(`column-${columnIndex}`)}" aria-describedby=${routeTotalId} data-value=${value} data-ratio=${ratio}>
          <span class="sk-transition-matrix__magnitude">
            <span class="sk-transition-matrix__track" aria-hidden="true"><span part="bar" class="sk-transition-matrix__bar" style=${`--_sk-transition-ratio: ${ratio}`}></span></span>
            <span class="sk-transition-matrix__value">${value === 0 ? '—' : value}</span>
          </span>
        </td>`;
      })}
      <td part="total" class="sk-transition-matrix__total" id=${routeTotalId} headers="${routeHeaderId} ${this.#id('total')}" data-route-total=${routeTotal}>${routeTotal}</td>
    </tr>`;
  }

  #renderBodies(matrix: ValidMatrix): ReadonlyArray<TemplateResult> {
    const bodies: TemplateResult[] = [];
    let start = 0;
    while (start < matrix.routes.length) {
      const group = matrix.routes[start].group ?? '';
      let end = start + 1;
      while (end < matrix.routes.length && (matrix.routes[end].group ?? '') === group) end += 1;
      const bodyRoutes = matrix.routes.slice(start, end);
      const groupHeadingId = group ? this.#id(`group-${start}`) : '';
      bodies.push(html`<tbody aria-labelledby=${groupHeadingId || nothing}>
        ${group ? html`<tr class="sk-transition-matrix__group-row"><th part="group" class="sk-transition-matrix__group" id=${groupHeadingId} colspan=${matrix.columns.length + 2}><span class="sk-transition-matrix__group-label">${group}</span></th></tr>` : nothing}
        ${bodyRoutes.map((route, index) => this.#renderRoute(route, start + index, matrix))}
      </tbody>`);
      start = end;
    }
    return bodies;
  }

  render() {
    const matrix = validateMatrix(this.columns, this.routes);
    if (!matrix) {
      return html`<section class="sk-transition-matrix" aria-labelledby=${this.#id('title')}>
        <header part="header" class="sk-transition-matrix__header"><h2 id=${this.#id('title')} class="sk-transition-matrix__title">Flow health</h2></header>
        <p part="empty-state" class="sk-transition-matrix__empty" role="status">No transition data.</p>
      </section>`;
    }

    const describedBy = [
      this.description ? this.#id('description') : '',
      this.selectable && this.selectionHint ? this.#id('selection-hint') : '',
    ].filter(Boolean).join(' ');

    return html`<section class="sk-transition-matrix" aria-labelledby=${this.#id('title')} aria-describedby=${describedBy || nothing}>
      <header part="header" class="sk-transition-matrix__header">
        <div class="sk-transition-matrix__heading">
          <h2 id=${this.#id('title')} class="sk-transition-matrix__title">Flow health</h2>
          <p class="sk-transition-matrix__measure" data-overall-total>${matrix.overallTotal} moves${this.windowLabel ? html`<span aria-hidden="true"> · </span>${this.windowLabel}` : nothing}</p>
        </div>
        ${this.#renderLegend(matrix.routes)}
      </header>
      ${this.description ? html`<p id=${this.#id('description')} class="sk-transition-matrix__description">${this.description}</p>` : nothing}
      <p class="sk-transition-matrix__scale">bar length ∝ moves</p>
      <div part="scroller" class="sk-transition-matrix__scroller">
        <table part="table" class="sk-transition-matrix__table">
          <thead><tr>
            <th class="sk-transition-matrix__route sk-transition-matrix__route--heading" scope="col">Route</th>
            ${matrix.columns.map((column, index) => html`<th id=${this.#id(`column-${index}`)} scope="col">${column.label}</th>`)}
            <th id=${this.#id('total')} scope="col">Total</th>
          </tr></thead>
          ${this.#renderBodies(matrix)}
        </table>
      </div>
      ${this.selectable && this.selectionHint ? html`<p id=${this.#id('selection-hint')} class="sk-transition-matrix__hint">${this.selectionHint}</p>` : nothing}
    </section>`;
  }
}

type TransitionMatrixPropertyName = keyof typeof SkTransitionMatrix.properties;
type RequiredTransitionMatrixPropertyName = Extract<
  TransitionMatrixPropertyName,
  'columns' | 'routes' | 'selectable'
>;
type OptionalTransitionMatrixPropertyName = Exclude<
  TransitionMatrixPropertyName,
  RequiredTransitionMatrixPropertyName
>;

export type TransitionMatrixProperties = Readonly<
  Pick<SkTransitionMatrix, RequiredTransitionMatrixPropertyName> &
    Partial<Pick<SkTransitionMatrix, OptionalTransitionMatrixPropertyName>>
>;

define('sk-transition-matrix', SkTransitionMatrix);
