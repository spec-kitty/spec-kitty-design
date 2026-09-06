import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { define } from '../define.js';
import sheet from './sk-bar-chart.css.js';

export type BarDatum = Readonly<{
  id: string;
  label: string;
  value: number;
  displayValue: string;
}>;

export type BarSeries = ReadonlyArray<BarDatum>;

export type BarChartSelectDetail = Readonly<{ id: string }>;

type ValidSeries = Readonly<{
  data: BarSeries;
  maximum: number;
}>;

let nextBarChartInstanceId = 0;

const validText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const validateSeries = (series: BarSeries): ValidSeries | null => {
  if (!Array.isArray(series) || series.length === 0) return null;

  const ids = series.map((datum) => datum?.id);
  if (ids.some((id) => !validText(id)) || new Set(ids).size !== ids.length) return null;

  let maximum = 0;
  for (const datum of series) {
    if (
      !datum ||
      !validText(datum.label) ||
      !validText(datum.displayValue) ||
      !Number.isFinite(datum.value) ||
      datum.value < 0
    ) return null;
    maximum = Math.max(maximum, datum.value);
  }

  return { data: series, maximum };
};

const suppressRepeatedActivation = (event: KeyboardEvent): void => {
  if (!event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
};

/**
 * A controlled, property-fed bar chart for compact numeric comparisons.
 *
 * Token dependencies: --sk-border-default, --sk-border-strong, --sk-border-width-1,
 * --sk-border-focus, --sk-border-width-2, --sk-color-data-baseline,
 * --sk-color-data-grid, --sk-color-data-series-primary, --sk-fg-body, --sk-fg-default,
 * --sk-fg-muted, --sk-font-mono, --sk-font-sans,
 * --sk-motion-duration-fast, --sk-motion-ease-out, --sk-radius-md, --sk-radius-sm,
 * --sk-space-2, --sk-space-3, --sk-space-4, --sk-space-5, --sk-space-6,
 * --sk-space-10, --sk-surface-card, --sk-surface-muted, --sk-surface-pill,
 * --sk-text-sm, --sk-text-xs, --sk-weight-semibold.
 *
 * @element sk-bar-chart
 * @csspart chart - Accessible figure root.
 * @csspart plot - Ordered collection of chart items.
 * @csspart item - A single datum container.
 * @csspart bar - The numeric SVG bar geometry.
 * @csspart value - Consumer-authored display value.
 * @csspart label - Consumer-authored category label.
 * @csspart empty-state - Stable empty or unavailable state.
 * @fires {CustomEvent<BarChartSelectDetail>} sk-bar-chart-select - Requests selection for the exact consumer datum ID. The event bubbles, is composed, and is not cancelable.
 */
export class SkBarChart extends LitElement {
  static styles = [sheet];

  static properties = {
    series: { attribute: false },
    label: { type: String },
    description: { type: String },
    selectable: { type: Boolean, reflect: true },
    selectedId: { type: String, attribute: 'selected-id' },
  };

  /** Complete consumer-owned data series. Invalid series fail closed. */
  series: ReadonlyArray<BarDatum> = Object.freeze([]);

  /** Accessible name for the chart figure. */
  label = 'Bar chart';

  /** Optional visible description associated with the chart figure. */
  description = '';

  /** Enables native button surfaces that request datum selection. */
  selectable = false;

  /** Controlled selected datum identifier. The component never mutates it. */
  selectedId = '';

  readonly #descriptionId = `sk-bar-chart-description-${++nextBarChartInstanceId}`;

  #requestSelection(id: string): void {
    const valid = validateSeries(this.series);
    if (!this.selectable || !valid?.data.some((datum) => datum.id === id)) return;
    this.dispatchEvent(new CustomEvent<BarChartSelectDetail>('sk-bar-chart-select', {
      detail: Object.freeze({ id }),
      bubbles: true,
      composed: true,
      cancelable: false,
    }));
  }

  #surface(datum: BarDatum, chart: ValidSeries): TemplateResult {
    const ratio = chart.maximum === 0 ? 0 : datum.value / chart.maximum;
    const height = ratio * 100;
    const y = 100 - height;
    const selected = this.selectedId === datum.id;
    const content = html`
      <span part="value" class="sk-bar-chart__value">${datum.displayValue}</span>
      <svg class="sk-bar-chart__graphic" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line class="sk-bar-chart__grid" x1="0" y1="50" x2="100" y2="50"></line>
        <rect part="bar" class="sk-bar-chart__bar" x="15" y=${y} width="70" height=${height}></rect>
        <line class="sk-bar-chart__baseline" x1="0" y1="99" x2="100" y2="99"></line>
      </svg>
      <span part="label" class="sk-bar-chart__label">${datum.label}</span>
    `;

    return this.selectable
      ? html`<button
          type="button"
          class="sk-bar-chart__surface"
          aria-pressed=${selected ? 'true' : 'false'}
          @click=${() => this.#requestSelection(datum.id)}
          @keydown=${suppressRepeatedActivation}
        >${content}</button>`
      : html`<div class="sk-bar-chart__surface">${content}</div>`;
  }

  render() {
    const chart = validateSeries(this.series);
    const describedBy = this.description ? this.#descriptionId : nothing;

    return html`<figure
      part="chart"
      class="sk-bar-chart"
      aria-label=${this.label}
      aria-describedby=${describedBy}
    >
      ${this.description
        ? html`<figcaption
            id=${this.#descriptionId}
            class="sk-bar-chart__description"
            data-chart-description
          >${this.description}</figcaption>`
        : nothing}
      ${chart
        ? html`<ol part="plot" class="sk-bar-chart__plot">
            ${chart.data.map((datum) => {
              const ratio = chart.maximum === 0 ? 0 : datum.value / chart.maximum;
              return html`<li
                part="item"
                class="sk-bar-chart__item"
                data-datum-id=${datum.id}
                data-ratio=${ratio}
              >
                ${this.#surface(datum, chart)}
              </li>`;
            })}
          </ol>`
        : html`<p part="empty-state" class="sk-bar-chart__empty-state">
            ${Array.isArray(this.series) && this.series.length === 0
              ? 'No data to display'
              : 'Chart unavailable'}
          </p>`}
    </figure>`;
  }
}

define('sk-bar-chart', SkBarChart);

declare global {
  interface HTMLElementTagNameMap {
    'sk-bar-chart': SkBarChart;
  }
}
