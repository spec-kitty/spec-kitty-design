import { LitElement, html, nothing, svg, type SVGTemplateResult, type TemplateResult } from 'lit';
import { define } from '../define.js';
import sheet from './sk-time-series-chart.css.js';

/** Supplied sampling resolution for one point. The element never chooses or changes it. */
export type TimeSeriesResolution = 'raw' | 'hour';

export type TimeSeriesPoint = Readonly<{
  id: string;
  at: number;
  value: number | null;
  displayValue: string;
  label: string;
  resolution: TimeSeriesResolution;
}>;

export type TimeSeriesDatum = Readonly<{
  id: string;
  name: string;
  points: ReadonlyArray<TimeSeriesPoint>;
}>;

export type TimeSeriesChartSelectDetail = Readonly<{ seriesId: string; pointId: string }>;

type Chart = Readonly<{
  data: ReadonlyArray<TimeSeriesDatum>;
  timeMin: number;
  timeSpan: number;
  valueMin: number;
  valueSpan: number;
  baseline: number;
}>;

type Segment = { resolution: TimeSeriesResolution; points: TimeSeriesPoint[] };

type Gap = Readonly<{
  seriesId: string;
  seriesName: string;
  fromAt: number;
  toAt: number;
  fromLabel: string;
  toLabel: string;
  annotated: boolean;
}>;

// The graphic is a fixed 1000x320 user-space box scaled with `xMidYMid meet`, NOT with
// `preserveAspectRatio="none"`. `none` distorts every marker shape and every dash pattern with
// the viewport, and those are two of this component's three differentiation channels — the two
// that have to survive when ink collapses under forced-colors.
const VIEW_W = 1000;
const VIEW_H = 320;
const PAD_X = 12;
const PAD_Y = 16;
const PLOT_W = VIEW_W - PAD_X * 2;
const PLOT_H = VIEW_H - PAD_Y * 2;

// Above this many observations in one series the per-point markers are not drawn: 500 markers is
// a DOM cost with no reading value at that density, and the line's dash pattern plus the legend
// still carry the series' identity. The threshold is a rendering density rule, never a data rule
// — nothing is dropped from the published table.
const MARKER_LIMIT = 60;

const RESOLUTIONS: ReadonlyArray<TimeSeriesResolution> = Object.freeze(['raw', 'hour']);
const RESOLUTION_LABELS: Readonly<Record<TimeSeriesResolution, string>> = Object.freeze({
  raw: 'Raw sample',
  hour: 'Hourly aggregate',
});
const MARKER_SHAPES = Object.freeze(['circle', 'square', 'triangle', 'diamond'] as const);

/** The literal published for an interval with no observation. Never blank, never zero. */
const NO_DATA = 'No data';

let nextChartInstanceId = 0;

const validText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isResolution = (value: unknown): value is TimeSeriesResolution =>
  typeof value === 'string' && RESOLUTIONS.includes(value as TimeSeriesResolution);

const round = (value: number): number => Math.round(value * 100) / 100;

const suppressRepeatedActivation = (event: KeyboardEvent): void => {
  if (!event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
};

/**
 * Validate the whole chart or none of it.
 *
 * Fail-closed, exactly as sk-bar-chart does: one malformed point takes the entire chart to a
 * labelled unavailable state rather than leaving a partial or stale picture on screen. `null` is
 * NOT invalid — it is the value that means "no observation in this interval", which is the whole
 * reason this element exists.
 */
const validateChart = (series: ReadonlyArray<TimeSeriesDatum>): Chart | null => {
  if (!Array.isArray(series)) return null;

  const seriesIds: unknown[] = [];
  const pointIds: unknown[] = [];
  let timeMin = Number.POSITIVE_INFINITY;
  let timeMax = Number.NEGATIVE_INFINITY;
  let valueMin = Number.POSITIVE_INFINITY;
  let valueMax = Number.NEGATIVE_INFINITY;

  for (const datum of series) {
    if (!datum || !validText(datum.id) || !validText(datum.name)) return null;
    if (!Array.isArray(datum.points)) return null;
    seriesIds.push(datum.id);

    let previousAt = Number.NEGATIVE_INFINITY;
    for (const point of datum.points) {
      if (!point || !validText(point.id) || !validText(point.label)) return null;
      if (!validText(point.displayValue) || !isResolution(point.resolution)) return null;
      if (!Number.isFinite(point.at)) return null;
      if (point.value !== null && !Number.isFinite(point.value)) return null;
      // A timestamp is a position, so the order the consumer supplied has to BE the order on the
      // axis. The element never sorts: sorting would silently disagree with the source order the
      // published table reports, and the two representations must be the same series.
      if (point.at < previousAt) return null;
      previousAt = point.at;
      pointIds.push(point.id);

      // The TIME extent spans every supplied timestamp, nulls included. That is what keeps
      // leading and trailing nulls from shortening the window the consumer asked for.
      if (point.at < timeMin) timeMin = point.at;
      if (point.at > timeMax) timeMax = point.at;
      // The VALUE extent spans observations only. A null is not a zero and must not pull the
      // scale toward the baseline.
      if (point.value !== null) {
        if (point.value < valueMin) valueMin = point.value;
        if (point.value > valueMax) valueMax = point.value;
      }
    }
  }

  if (new Set(seriesIds).size !== seriesIds.length) return null;
  // Point ids are unique across the WHOLE chart, not per series: `selectedId` is a point id, and
  // a controlled selection cannot be resolved from an id that names two points.
  if (new Set(pointIds).size !== pointIds.length) return null;
  if (pointIds.length === 0) return null;

  if (valueMin === Number.POSITIVE_INFINITY) {
    // An entirely unobserved chart still has a time axis. Its value scale is degenerate and the
    // line is drawn nowhere, which is correct: there is nothing to draw.
    valueMin = 0;
    valueMax = 0;
  }

  const timeSpan = timeMax - timeMin;
  const valueSpan = valueMax - valueMin;
  const baseline = valueMin <= 0 && valueMax >= 0 ? 0 : valueMin;

  return { data: series, timeMin, timeSpan, valueMin, valueSpan, baseline };
};

/**
 * Maximal runs of consecutive observations, cut again wherever the SUPPLIED resolution changes.
 *
 * A null ends a run outright — that is what makes the break a break rather than an interpolation.
 * A resolution change starts a new segment that REPEATS the boundary observation, so the line
 * stays connected across a change of sampling while each side can be drawn in its own weight.
 */
const segmentsOf = (points: ReadonlyArray<TimeSeriesPoint>): Segment[] => {
  const segments: Segment[] = [];
  let current: Segment | null = null;
  let previous: TimeSeriesPoint | null = null;
  for (const point of points) {
    if (point.value === null) {
      current = null;
      previous = null;
      continue;
    }
    if (!current) {
      current = { resolution: point.resolution, points: [point] };
      segments.push(current);
    } else if (point.resolution !== current.resolution) {
      current = { resolution: point.resolution, points: previous ? [previous, point] : [point] };
      segments.push(current);
    } else {
      current.points.push(point);
    }
    previous = point;
  }
  return segments;
};

/**
 * Maximal runs of consecutive nulls, expanded to the observations that bound them.
 *
 * A leading or trailing run has only one bounding observation, so it is bounded by its own first
 * or last null timestamp instead — which is what keeps the window the consumer supplied.
 */
const gapsOf = (
  datum: TimeSeriesDatum,
  threshold: number,
): Gap[] => {
  const gaps: Gap[] = [];
  const points = datum.points;
  const annotates = Number.isFinite(threshold) && threshold > 0;
  let index = 0;
  while (index < points.length) {
    if (points[index].value !== null) {
      index += 1;
      continue;
    }
    let end = index;
    while (end + 1 < points.length && points[end + 1].value === null) end += 1;
    const before = index > 0 ? points[index - 1] : null;
    const after = end + 1 < points.length ? points[end + 1] : null;
    const from = before ?? points[index];
    const to = after ?? points[end];
    gaps.push({
      seriesId: datum.id,
      seriesName: datum.name,
      fromAt: from.at,
      toAt: to.at,
      fromLabel: from.label,
      toLabel: to.label,
      // Annotation fires ONLY beyond a threshold the consumer supplied. There is no inferred
      // threshold, no "typical interval" derived from the data, and no clock.
      annotated: annotates && to.at - from.at >= threshold,
    });
    index = end + 1;
  }
  return gaps;
};

/**
 * A controlled, property-fed line chart over a time axis whose missing intervals are drawn as
 * gaps and published as "No data".
 *
 * Every value is published persistently in a paired native table — the element's accessible
 * representation and its narrow-viewport treatment — so no meaning is hover-only. The graphic is
 * aria-hidden and carries no accessible content of its own. Selection is controlled: activation
 * requests a change and never makes one, and the only default action the element owns is moving
 * focus to the activated point, which a listener may cancel.
 *
 * Series are distinguished by three redundant channels — ink, dash pattern and marker shape —
 * because ink is the one of the three that collapses under forced-colors and in greyscale.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-chart-baseline, --sk-chart-dash-1,
 * --sk-chart-dash-2, --sk-chart-dash-3, --sk-chart-dash-4, --sk-chart-gap,
 * --sk-chart-gap-dash, --sk-chart-gap-fill, --sk-chart-grid, --sk-chart-plot-block-size,
 * --sk-chart-series-1, --sk-chart-series-2, --sk-chart-series-3, --sk-chart-series-4,
 * --sk-chart-stroke-width, --sk-fg-body, --sk-fg-default, --sk-fg-muted, --sk-font-mono,
 * --sk-font-sans, --sk-motion-duration-fast, --sk-motion-ease-out, --sk-radius-md,
 * --sk-radius-sm, --sk-space-1, --sk-space-2, --sk-space-3, --sk-space-4, --sk-space-5,
 * --sk-space-6, --sk-space-10, --sk-surface-card, --sk-surface-pill, --sk-text-sm,
 * --sk-text-xs, --sk-weight-medium.
 *
 * @element sk-time-series-chart
 * @csspart chart - Accessible figure root.
 * @csspart legend - Series key carrying ink, dash pattern and marker shape.
 * @csspart series-name - Consumer-authored series name in the legend.
 * @csspart plot - Framed viewport holding the graphic.
 * @csspart line - One drawn segment of one series at one resolution.
 * @csspart marker - One observation's marker, shaped by series.
 * @csspart gap - A drawn interval with no observation.
 * @csspart resolution-boundary - The rule where a supplied resolution changes.
 * @csspart gap-notes - Visible notes for gaps beyond the supplied threshold.
 * @csspart gap-note - One such note.
 * @csspart scroller - Scrollable viewport for the published table.
 * @csspart table - The paired tabular equivalent of the same series.
 * @csspart row - One point's row.
 * @csspart value - One point's display string, or the no-observation literal.
 * @csspart point - Native selection control, present only when selectable.
 * @csspart empty-state - Stable empty or unavailable state.
 * @fires {CustomEvent<TimeSeriesChartSelectDetail>} sk-time-series-chart-select - Requests selection of the exact consumer point. The event bubbles, is composed, and is cancelable; cancelling it suppresses the element's own focus move and nothing else.
 */
export class SkTimeSeriesChart extends LitElement {
  static styles = [sheet];

  static properties = {
    series: { attribute: false },
    label: { type: String },
    description: { type: String },
    selectable: { type: Boolean, reflect: true },
    selectedId: { type: String, attribute: 'selected-id' },
    gapThreshold: { type: Number, attribute: 'gap-threshold' },
  };

  /** Complete consumer-owned series collection. An invalid collection fails closed. */
  series: ReadonlyArray<TimeSeriesDatum> = Object.freeze([]);

  /** Accessible name for the chart figure and the published table's caption. */
  label = 'Time series chart';

  /** Optional visible description associated with the chart figure. */
  description = '';

  /** Enables native controls that request selection of a point. */
  selectable = false;

  /** Controlled selected point identifier. The component never mutates it. */
  selectedId = '';

  /**
   * Consumer-supplied gap duration, in the same unit as the point timestamps, at or beyond which
   * a run with no observation earns a visible note. Zero, negative and non-finite values annotate
   * nothing. The element infers no threshold of its own.
   */
  gapThreshold = 0;

  readonly #descriptionId = `sk-time-series-chart-description-${++nextChartInstanceId}`;

  #requestSelection(seriesId: string, pointId: string, control: HTMLButtonElement): void {
    const chart = validateChart(this.series);
    if (!this.selectable || !chart) return;
    const datum = chart.data.find((entry) => entry.id === seriesId);
    if (!datum?.points.some((point) => point.id === pointId)) return;
    const proceed = this.dispatchEvent(
      new CustomEvent<TimeSeriesChartSelectDetail>('sk-time-series-chart-select', {
        detail: Object.freeze({ seriesId, pointId }),
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    // The ONLY default action this element owns. Selection is the application's and is never
    // touched here, so cancelling this event prevents the focus move and nothing else.
    if (proceed) control.focus();
  }

  #x(chart: Chart, at: number): number {
    if (chart.timeSpan === 0) return round(PAD_X + PLOT_W / 2);
    return round(PAD_X + ((at - chart.timeMin) / chart.timeSpan) * PLOT_W);
  }

  #y(chart: Chart, value: number): number {
    if (chart.valueSpan === 0) return round(PAD_Y + PLOT_H / 2);
    return round(PAD_Y + (1 - (value - chart.valueMin) / chart.valueSpan) * PLOT_H);
  }

  #marker(
    chart: Chart,
    point: TimeSeriesPoint,
    channel: number,
    seriesId: string,
  ): SVGTemplateResult {
    const cx = this.#x(chart, point.at);
    const cy = this.#y(chart, point.value as number);
    const shape = MARKER_SHAPES[channel];
    const selected = this.selectedId === point.id;
    const classes = [
      'sk-time-series-chart__marker',
      `sk-time-series-chart__marker--channel-${channel + 1}`,
      point.resolution === 'hour' ? 'sk-time-series-chart__marker--hour' : '',
      selected ? 'sk-time-series-chart__marker--selected' : '',
    ].filter(Boolean).join(' ');
    const shared = {
      part: 'marker',
      class: classes,
      shape,
      seriesId,
      pointId: point.id,
    };
    switch (shape) {
      case 'square':
        return svg`<rect part=${shared.part} class=${shared.class} data-shape=${shared.shape} data-series-id=${shared.seriesId} data-point-id=${shared.pointId} x=${round(cx - 5)} y=${round(cy - 5)} width="10" height="10"></rect>`;
      case 'triangle':
        return svg`<polygon part=${shared.part} class=${shared.class} data-shape=${shared.shape} data-series-id=${shared.seriesId} data-point-id=${shared.pointId} points=${`${cx},${round(cy - 7)} ${round(cx + 6)},${round(cy + 5)} ${round(cx - 6)},${round(cy + 5)}`}></polygon>`;
      case 'diamond':
        return svg`<polygon part=${shared.part} class=${shared.class} data-shape=${shared.shape} data-series-id=${shared.seriesId} data-point-id=${shared.pointId} points=${`${cx},${round(cy - 7)} ${round(cx + 7)},${cy} ${cx},${round(cy + 7)} ${round(cx - 7)},${cy}`}></polygon>`;
      default:
        return svg`<circle part=${shared.part} class=${shared.class} data-shape=${shared.shape} data-series-id=${shared.seriesId} data-point-id=${shared.pointId} cx=${cx} cy=${cy} r="6"></circle>`;
    }
  }

  #graphic(chart: Chart, gaps: ReadonlyArray<Gap>): TemplateResult {
    const grid = [0.25, 0.5, 0.75].map((ratio) => round(PAD_Y + PLOT_H * ratio));
    const baselineY = this.#y(chart, chart.baseline);

    return html`<svg
      class="sk-time-series-chart__graphic"
      viewBox="0 0 ${VIEW_W} ${VIEW_H}"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      ${grid.map(
        (y) => svg`<line class="sk-time-series-chart__grid" x1=${PAD_X} y1=${y} x2=${VIEW_W - PAD_X} y2=${y}></line>`,
      )}
      <line class="sk-time-series-chart__baseline" x1=${PAD_X} y1=${baselineY} x2=${VIEW_W - PAD_X} y2=${baselineY}></line>
      ${gaps.map((gap) => {
        const x1 = this.#x(chart, gap.fromAt);
        const x2 = this.#x(chart, gap.toAt);
        const width = round(Math.max(x2 - x1, 0));
        return svg`<g
          part="gap"
          class=${`sk-time-series-chart__gap${gap.annotated ? ' sk-time-series-chart__gap--annotated' : ''}`}
          data-series-id=${gap.seriesId}
          data-annotated=${gap.annotated ? 'true' : 'false'}
        >
          <rect class="sk-time-series-chart__gap-band" x=${x1} y=${PAD_Y} width=${width} height=${PLOT_H}></rect>
          <line class="sk-time-series-chart__gap-edge" x1=${x1} y1=${PAD_Y} x2=${x1} y2=${PAD_Y + PLOT_H}></line>
          <line class="sk-time-series-chart__gap-edge" x1=${x2} y1=${PAD_Y} x2=${x2} y2=${PAD_Y + PLOT_H}></line>
        </g>`;
      })}
      ${chart.data.map((datum, index) => {
        const channel = index % MARKER_SHAPES.length;
        const observations = datum.points.filter((point) => point.value !== null);
        const boundaries: number[] = [];
        for (let i = 1; i < datum.points.length; i += 1) {
          if (datum.points[i].resolution !== datum.points[i - 1].resolution) {
            boundaries.push(
              round((this.#x(chart, datum.points[i - 1].at) + this.#x(chart, datum.points[i].at)) / 2),
            );
          }
        }
        return svg`<g class="sk-time-series-chart__series" data-series-id=${datum.id} data-channel=${channel + 1}>
          ${segmentsOf(datum.points)
            .filter((segment) => segment.points.length > 1)
            .map(
              (segment) => svg`<polyline
                part="line"
                class=${`sk-time-series-chart__line sk-time-series-chart__line--channel-${channel + 1}${segment.resolution === 'hour' ? ' sk-time-series-chart__line--hour' : ''}`}
                data-series-id=${datum.id}
                data-resolution=${segment.resolution}
                points=${segment.points
                  .map((point) => `${this.#x(chart, point.at)},${this.#y(chart, point.value as number)}`)
                  .join(' ')}
              ></polyline>`,
            )}
          ${boundaries.map(
            (x) => svg`<line
              part="resolution-boundary"
              class="sk-time-series-chart__resolution-boundary"
              data-series-id=${datum.id}
              x1=${x}
              y1=${PAD_Y}
              x2=${x}
              y2=${PAD_Y + PLOT_H}
            ></line>`,
          )}
          ${observations.length <= MARKER_LIMIT
            ? observations.map((point) => this.#marker(chart, point, channel, datum.id))
            : nothing}
        </g>`;
      })}
    </svg>`;
  }

  #legend(chart: Chart): TemplateResult {
    return html`<ul part="legend" class="sk-time-series-chart__legend">
      ${chart.data.map((datum, index) => {
        const channel = index % MARKER_SHAPES.length;
        const shape = MARKER_SHAPES[channel];
        return html`<li class="sk-time-series-chart__legend-item" data-series-id=${datum.id} data-channel=${channel + 1}>
          <svg class="sk-time-series-chart__legend-mark" viewBox="0 0 24 12" aria-hidden="true">
            <line
              class=${`sk-time-series-chart__line sk-time-series-chart__line--channel-${channel + 1}`}
              x1="0"
              y1="6"
              x2="24"
              y2="6"
            ></line>
            ${shape === 'square'
              ? svg`<rect class=${`sk-time-series-chart__marker sk-time-series-chart__marker--channel-${channel + 1}`} data-shape="square" x="8" y="2" width="8" height="8"></rect>`
              : shape === 'triangle'
                ? svg`<polygon class=${`sk-time-series-chart__marker sk-time-series-chart__marker--channel-${channel + 1}`} data-shape="triangle" points="12,1 17,10 7,10"></polygon>`
                : shape === 'diamond'
                  ? svg`<polygon class=${`sk-time-series-chart__marker sk-time-series-chart__marker--channel-${channel + 1}`} data-shape="diamond" points="12,1 18,6 12,11 6,6"></polygon>`
                  : svg`<circle class=${`sk-time-series-chart__marker sk-time-series-chart__marker--channel-${channel + 1}`} data-shape="circle" cx="12" cy="6" r="5"></circle>`}
          </svg>
          <span part="series-name" class="sk-time-series-chart__series-name">${datum.name}</span>
        </li>`;
      })}
    </ul>`;
  }

  /**
   * Apply the scroller's region triad only when it GENUINELY overflows.
   *
   * `packages/styles/src/data-table/sk-data-table.css` measured both halves of this: on a
   * scroller where the content fits, `role="region"`/`aria-label`/`tabindex="0"` is a dead tab
   * stop and a duplicate landmark whose name repeats the caption; on one that genuinely
   * overflows, axe's `scrollable-region-focusable` correctly flags its absence. A row-count
   * heuristic would have to guess where the two regimes meet, so this measures instead.
   *
   * It is written imperatively rather than as a reactive binding on purpose: the template binds
   * none of these three attributes, so nothing here can start a render loop, and the element
   * gains no reactive field and therefore no published API for an internal layout fact.
   */
  protected updated(): void {
    const scroller = this.renderRoot.querySelector<HTMLElement>('.sk-time-series-chart__scroller');
    if (!scroller) return;
    const overflows =
      scroller.scrollHeight > scroller.clientHeight || scroller.scrollWidth > scroller.clientWidth;
    scroller.dataset['overflows'] = overflows ? 'true' : 'false';
    if (overflows) {
      scroller.setAttribute('role', 'region');
      scroller.setAttribute('aria-label', `${this.label}, published values`);
      scroller.setAttribute('tabindex', '0');
      return;
    }
    scroller.removeAttribute('role');
    scroller.removeAttribute('aria-label');
    scroller.removeAttribute('tabindex');
  }

  #table(chart: Chart): TemplateResult {
    return html`<div part="scroller" class="sk-time-series-chart__scroller">
      <table part="table" class="sk-time-series-chart__table">
        <caption class="sk-time-series-chart__caption">
          ${this.label} — every value in source order, including intervals with no observation
        </caption>
        <thead>
          <tr>
            <th scope="col">Series</th>
            <th scope="col">Time</th>
            <th scope="col">Value</th>
            <th scope="col">Resolution</th>
          </tr>
        </thead>
        <tbody>
          ${chart.data.flatMap((datum) =>
            datum.points.map((point) => {
              const missing = point.value === null;
              const selected = this.selectedId === point.id;
              return html`<tr
                part="row"
                class=${`sk-time-series-chart__row${missing ? ' sk-time-series-chart__row--no-data' : ''}`}
                data-series-id=${datum.id}
                data-point-id=${point.id}
                data-no-data=${missing ? 'true' : 'false'}
              >
                <td>${datum.name}</td>
                <td>
                  ${this.selectable
                    ? html`<button
                        part="point"
                        type="button"
                        class="sk-time-series-chart__point"
                        aria-pressed=${selected ? 'true' : 'false'}
                        @click=${(event: MouseEvent) =>
                          this.#requestSelection(datum.id, point.id, event.currentTarget as HTMLButtonElement)}
                        @keydown=${suppressRepeatedActivation}
                      >${point.label}</button>`
                    : point.label}
                </td>
                <td part="value" class="sk-time-series-chart__value">${missing ? NO_DATA : point.displayValue}</td>
                <td>${RESOLUTION_LABELS[point.resolution]}</td>
              </tr>`;
            }),
          )}
        </tbody>
      </table>
    </div>`;
  }

  render() {
    const chart = validateChart(this.series);
    const describedBy = this.description ? this.#descriptionId : nothing;
    const gaps = chart
      ? chart.data.flatMap((datum) => gapsOf(datum, this.gapThreshold))
      : [];
    const annotated = gaps.filter((gap) => gap.annotated);
    return html`<figure
      part="chart"
      class="sk-time-series-chart"
      aria-label=${this.label}
      aria-describedby=${describedBy}
    >
      ${this.description
        ? html`<figcaption
            id=${this.#descriptionId}
            class="sk-time-series-chart__description"
            data-chart-description
          >${this.description}</figcaption>`
        : nothing}
      ${chart
        ? html`
            ${this.#legend(chart)}
            <div part="plot" class="sk-time-series-chart__plot">${this.#graphic(chart, gaps)}</div>
            ${annotated.length > 0
              ? html`<ul part="gap-notes" class="sk-time-series-chart__gap-notes">
                  ${annotated.map(
                    (gap) => html`<li part="gap-note" class="sk-time-series-chart__gap-note" data-series-id=${gap.seriesId}>
                      No observation for ${gap.seriesName} between ${gap.fromLabel} and ${gap.toLabel}
                    </li>`,
                  )}
                </ul>`
              : nothing}
            ${this.#table(chart)}
          `
        : html`<p part="empty-state" class="sk-time-series-chart__empty-state">
            ${Array.isArray(this.series) &&
            this.series.every(
              (datum) => datum && Array.isArray(datum.points) && datum.points.length === 0,
            )
              ? 'No data to display'
              : 'Chart unavailable'}
          </p>`}
    </figure>`;
  }
}

define('sk-time-series-chart', SkTimeSeriesChart);

declare global {
  interface HTMLElementTagNameMap {
    'sk-time-series-chart': SkTimeSeriesChart;
  }
}
