/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
import { beforeEach, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../../packages/elements/src/time-series-chart/sk-time-series-chart.js';
import skTimeSeriesChartSheet from '../../../packages/elements/src/time-series-chart/sk-time-series-chart.css.js';
import {
  SkTimeSeriesChart,
  type TimeSeriesChartSelectDetail,
  type TimeSeriesDatum,
  type TimeSeriesPoint,
} from '../../../packages/elements/src/time-series-chart/sk-time-series-chart.js';
import chartCss from '../../../packages/styles/src/time-series-chart/sk-time-series-chart.css?raw';
import tokensCss from '@spec-kitty/tokens/tokens.css?raw';
import { assertThemesDiffered, contrast } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

type Chart = SkTimeSeriesChart & { updateComplete: Promise<unknown> };

const HOUR = 3_600_000;
const START = 1_767_225_600_000;

const point = (
  index: number,
  value: number | null,
  resolution: 'raw' | 'hour' = 'raw',
): TimeSeriesPoint =>
  Object.freeze({
    id: `p-${index}`,
    at: START + index * HOUR,
    value,
    displayValue: value === null ? 'unused' : `${value} req/s`,
    label: `Hour ${index}`,
    resolution,
  });

const seriesOf = (
  id: string,
  name: string,
  values: ReadonlyArray<number | null>,
  resolution: 'raw' | 'hour' = 'raw',
): TimeSeriesDatum =>
  Object.freeze({
    id,
    name,
    points: Object.freeze(
      values.map((value, index) =>
        Object.freeze({
          ...point(index, value, resolution),
          id: `${id}-${index}`,
        }),
      ),
    ),
  });

/** Six evenly sampled hours with an interior two-hour outage. */
const withGap = Object.freeze([seriesOf('throughput', 'Throughput', [40, 55, null, null, 62, 58])]);
const dense = Object.freeze([seriesOf('throughput', 'Throughput', [40, 55, 51, 62, 58])]);

beforeEach(installTokenSheet);

const mount = async ({
  series = dense,
  label = 'Throughput over time',
  description = 'Requests per second by hour',
  selectable = false,
  selectedId = '',
  gapThreshold = 0,
}: {
  series?: unknown;
  label?: string;
  description?: string;
  selectable?: boolean;
  selectedId?: string;
  gapThreshold?: number;
} = {}): Promise<Chart> => {
  const element = document.createElement('sk-time-series-chart') as Chart;
  element.series = series as ReadonlyArray<TimeSeriesDatum>;
  element.label = label;
  element.description = description;
  element.selectable = selectable;
  element.selectedId = selectedId;
  element.gapThreshold = gapThreshold;
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const partOf = (element: Element, name: string): Element | null =>
  element.shadowRoot!.querySelector(`[part="${name}"]`);

const partsOf = (element: Element, name: string): Element[] =>
  Array.from(element.shadowRoot!.querySelectorAll(`[part="${name}"]`));

const rowsOf = (element: Element): HTMLTableRowElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll<HTMLTableRowElement>('[part="row"]'));

const cellText = (row: Element, index: number): string =>
  row.querySelectorAll('td')[index]!.textContent!.replace(/\s+/g, ' ').trim();

const eventRecords = (element: Element) => {
  const records: Array<{
    detail: TimeSeriesChartSelectDetail;
    bubbles: boolean;
    composed: boolean;
    cancelable: boolean;
  }> = [];
  element.addEventListener('sk-time-series-chart-select', (event) => {
    const selectEvent = event as CustomEvent<TimeSeriesChartSelectDetail>;
    records.push({
      detail: selectEvent.detail,
      bubbles: selectEvent.bubbles,
      composed: selectEvent.composed,
      cancelable: selectEvent.cancelable,
    });
  });
  return records;
};

const authoredSheet = new CSSStyleSheet();
authoredSheet.replaceSync(chartCss);

const mediaRuleFor = (query: string): CSSMediaRule | undefined =>
  Array.from(authoredSheet.cssRules).find(
    (rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.media.mediaText === query,
  );

const styleRuleFor = (media: CSSMediaRule, selector: string): CSSStyleRule | undefined =>
  Array.from(media.cssRules).find(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === selector,
  );

const xOf = (polyline: Element): number[] =>
  polyline
    .getAttribute('points')!
    .trim()
    .split(/\s+/)
    .map((pair) => Number(pair.split(',')[0]));

test('a null run breaks the line rather than interpolating it or drawing it to the baseline', async () => {
  const element = await mount({ series: withGap });
  const lines = partsOf(element, 'line');

  // TWO polylines, not one. One would be the interpolation this element exists to refuse.
  expect(lines).toHaveLength(2);
  expect(xOf(lines[0])).toHaveLength(2);
  expect(xOf(lines[1])).toHaveLength(2);

  const markers = partsOf(element, 'marker');
  expect(markers).toHaveLength(4);
  expect(markers.map((marker) => marker.getAttribute('data-point-id'))).toEqual([
    'throughput-0',
    'throughput-1',
    'throughput-4',
    'throughput-5',
  ]);

  // No vertex sits at either missing timestamp, so nothing is drawn AT a null — neither an
  // interpolated point nor a zero on the baseline.
  const nullXs = [2, 3].map((index) => {
    const observed = partsOf(element, 'marker').map((marker) => Number(marker.getAttribute('cx')));
    return observed.length && index;
  });
  expect(nullXs).toHaveLength(2);
  const drawnX = new Set(lines.flatMap(xOf));
  const gap = partOf(element, 'gap')!;
  const band = gap.querySelector('rect')!;
  const gapStart = Number(band.getAttribute('x'));
  const gapEnd = gapStart + Number(band.getAttribute('width'));
  for (const x of drawnX) {
    expect(x > gapStart && x < gapEnd, `a vertex at ${x} sits inside the gap`).toBe(false);
  }
  expect(gapEnd).toBeGreaterThan(gapStart);

  // The published representation reports the interval as having NO OBSERVATION — not blank,
  // not zero.
  const rows = rowsOf(element);
  expect(rows).toHaveLength(6);
  expect(rows.map((row) => row.getAttribute('data-no-data'))).toEqual([
    'false', 'false', 'true', 'true', 'false', 'false',
  ]);
  expect(rows.map((row) => cellText(row, 2))).toEqual([
    '40 req/s', '55 req/s', 'No data', 'No data', '62 req/s', '58 req/s',
  ]);
});

test('leading and trailing nulls keep the window and an all-null series draws no line', async () => {
  const bounded = await mount({
    series: Object.freeze([seriesOf('t', 'Throughput', [null, null, 51, 62, null, null])]),
  });
  const observedLine = partsOf(bounded, 'line');
  expect(observedLine).toHaveLength(1);

  // The two observations sit at index 2 and 3 of six. If leading/trailing nulls had shortened
  // the window they would sit at the extremes instead.
  const [first, second] = xOf(observedLine[0]);
  expect(first).toBeGreaterThan(12);
  expect(second).toBeLessThan(988);
  expect(first).toBeCloseTo(12 + (2 / 5) * 976, 1);
  expect(second).toBeCloseTo(12 + (3 / 5) * 976, 1);
  expect(partsOf(bounded, 'gap')).toHaveLength(2);

  const blank = await mount({
    series: Object.freeze([seriesOf('t', 'Throughput', [null, null, null])]),
  });
  expect(partsOf(blank, 'line')).toHaveLength(0);
  expect(partsOf(blank, 'marker')).toHaveLength(0);
  expect(partsOf(blank, 'gap')).toHaveLength(1);
  expect(rowsOf(blank).map((row) => cellText(row, 2))).toEqual(['No data', 'No data', 'No data']);
});

test('position derives from the timestamp, not from the index', async () => {
  const uneven = Object.freeze([
    Object.freeze({
      id: 'uneven',
      name: 'Latency',
      points: Object.freeze([
        Object.freeze({ id: 'a', at: 0, value: 1, displayValue: '1 ms', label: 'A', resolution: 'raw' as const }),
        Object.freeze({ id: 'b', at: 10, value: 2, displayValue: '2 ms', label: 'B', resolution: 'raw' as const }),
        Object.freeze({ id: 'c', at: 100, value: 3, displayValue: '3 ms', label: 'C', resolution: 'raw' as const }),
      ]),
    }),
  ]);
  const element = await mount({ series: uneven });
  const [x1, x2, x3] = xOf(partsOf(element, 'line')[0]);
  expect(x2 - x1).toBeCloseTo(97.6, 1);
  expect(x3 - x2).toBeCloseTo(878.4, 1);
  expect(x3 - x2).toBeGreaterThan((x2 - x1) * 5);
});

test('a supplied resolution change is drawn and stated, and the axis does not rescale', async () => {
  const mixed = Object.freeze([
    Object.freeze({
      id: 'mixed',
      name: 'Throughput',
      points: Object.freeze([
        point(0, 40),
        point(1, 55),
        Object.freeze({ ...point(2, 51, 'hour') }),
        Object.freeze({ ...point(3, 62, 'hour') }),
      ]),
    }),
  ]);
  const element = await mount({ series: mixed });
  const lines = partsOf(element, 'line');
  expect(lines.map((line) => line.getAttribute('data-resolution'))).toEqual(['raw', 'hour']);
  // The boundary observation is REPEATED, so a resolution change is not drawn as a break.
  expect(xOf(lines[0]).at(-1)).toBe(xOf(lines[1])[0]);
  expect(partsOf(element, 'resolution-boundary')).toHaveLength(1);
  expect(rowsOf(element).map((row) => cellText(row, 3))).toEqual([
    'Raw sample', 'Raw sample', 'Hourly aggregate', 'Hourly aggregate',
  ]);

  // Same points, one resolution throughout: the extents are identical, so nothing rescaled.
  const uniform = await mount({ series: Object.freeze([seriesOf('mixed', 'Throughput', [40, 55, 51, 62])]) });
  expect(xOf(partsOf(uniform, 'line')[0])).toEqual([
    ...xOf(lines[0]).slice(0, -1),
    ...xOf(lines[1]),
  ]);
});

test('gap annotation fires only beyond a SUPPLIED threshold', async () => {
  const none = await mount({ series: withGap });
  expect(partsOf(none, 'gap-note')).toHaveLength(0);
  expect(partOf(none, 'gap')!.getAttribute('data-annotated')).toBe('false');

  for (const inert of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const element = await mount({ series: withGap, gapThreshold: inert });
    expect(partsOf(element, 'gap-note'), `threshold ${inert}`).toHaveLength(0);
  }

  const above = await mount({ series: withGap, gapThreshold: 3 * HOUR + 1 });
  expect(partsOf(above, 'gap-note')).toHaveLength(0);

  const annotated = await mount({ series: withGap, gapThreshold: 3 * HOUR });
  expect(partOf(annotated, 'gap')!.getAttribute('data-annotated')).toBe('true');
  const notes = partsOf(annotated, 'gap-note');
  expect(notes).toHaveLength(1);
  expect(notes[0].textContent!.replace(/\s+/g, ' ').trim()).toBe(
    'No observation for Throughput between Hour 1 and Hour 4',
  );
  expect(partOf(annotated, 'gap-notes')).not.toBeNull();
});

test('every value is published without pointer or focus, and stays usable at 500 points', async () => {
  const values = Array.from({ length: 500 }, (_, index) => (index % 37 === 0 ? null : index));
  const element = await mount({ series: Object.freeze([seriesOf('load', 'Load', values)]) });
  const rows = rowsOf(element);
  expect(rows).toHaveLength(500);
  expect(rows.map((row) => cellText(row, 2))).toEqual(
    values.map((value) => (value === null ? 'No data' : `${value} req/s`)),
  );
  // No tab stop other than the scroller, which genuinely overflows here.
  expect(element.shadowRoot!.querySelectorAll('button')).toHaveLength(0);
  const scroller = partOf(element, 'scroller') as HTMLElement;
  expect(scroller.dataset['overflows']).toBe('true');
  expect(scroller.getAttribute('tabindex')).toBe('0');
  expect(scroller.getAttribute('role')).toBe('region');
  expect(element.shadowRoot!.querySelectorAll('[tabindex]')).toHaveLength(1);
  // Above the marker density limit the line and the legend carry the series, and nothing is
  // dropped from the published table — 500 markers is a DOM cost with no reading value.
  expect(partsOf(element, 'marker')).toHaveLength(0);
  expect(partsOf(element, 'line').length).toBeGreaterThan(1);
  expect(element.shadowRoot!.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
});

test('a short chart does not receive the scroller region triad', async () => {
  const element = await mount({ series: Object.freeze([seriesOf('t', 'Throughput', [1, 2])]) });
  const scroller = partOf(element, 'scroller') as HTMLElement;
  expect(scroller.dataset['overflows']).toBe('false');
  expect(scroller.hasAttribute('tabindex')).toBe(false);
  expect(scroller.hasAttribute('role')).toBe(false);
  expect(scroller.hasAttribute('aria-label')).toBe(false);
});

test('series differentiation survives greyscale and forced colors', async () => {
  const element = await mount({
    series: Object.freeze([
      seriesOf('a', 'Alpha', [10, 20, 30]),
      seriesOf('b', 'Beta', [30, 20, 10]),
      seriesOf('c', 'Gamma', [15, 25, 15]),
      seriesOf('d', 'Delta', [25, 15, 25]),
    ]),
  });
  const lines = partsOf(element, 'line');
  expect(lines).toHaveLength(4);
  const dashes = lines.map((line) => getComputedStyle(line).strokeDasharray);
  expect(new Set(dashes).size, `dash patterns collapsed: ${dashes.join(' | ')}`).toBe(4);

  const shapes = ['a', 'b', 'c', 'd'].map(
    (id) =>
      element.shadowRoot!.querySelector(`[part="marker"][data-series-id="${id}-0"], [part="marker"][data-series-id="${id}"]`)!
        .getAttribute('data-shape'),
  );
  expect(new Set(shapes).size, `marker shapes collapsed: ${shapes.join(' | ')}`).toBe(4);
  expect(shapes).toEqual(['circle', 'square', 'triangle', 'diamond']);

  // The legend carries the same two non-colour channels, because the legend is where a reader
  // in forced colors has to match a line to a name.
  const legendShapes = Array.from(
    element.shadowRoot!.querySelectorAll('.sk-time-series-chart__legend-mark [data-shape]'),
  ).map((node) => node.getAttribute('data-shape'));
  expect(legendShapes).toEqual(['circle', 'square', 'triangle', 'diamond']);
  expect(partsOf(element, 'series-name').map((node) => node.textContent)).toEqual([
    'Alpha', 'Beta', 'Gamma', 'Delta',
  ]);
});

test('the chart token family is the one #148 could consume, measured rather than asserted', async () => {
  const lightStart = tokensCss.indexOf(':root[data-theme="light"],');
  expect(lightStart).toBeGreaterThan(0);
  for (const block of [tokensCss.slice(0, lightStart), tokensCss.slice(lightStart)]) {
    for (const name of [
      '--sk-chart-series-1', '--sk-chart-series-2', '--sk-chart-series-3', '--sk-chart-series-4',
      '--sk-chart-grid', '--sk-chart-baseline', '--sk-chart-gap', '--sk-chart-gap-fill',
      '--sk-chart-dash-1', '--sk-chart-dash-2', '--sk-chart-dash-3', '--sk-chart-dash-4',
      '--sk-chart-gap-dash', '--sk-chart-stroke-width', '--sk-chart-plot-block-size',
    ]) {
      expect(block.split(`${name}:`), `${name} is not declared exactly once in this theme block`).toHaveLength(2);
    }
  }

  const palettes = new Map<string, string>();
  for (const theme of ['dark', 'light'] as const) {
    const wrapper = document.createElement('div');
    if (theme === 'light') wrapper.className = 'sk-light';
    document.body.append(wrapper);
    const probe = document.createElement('span');
    wrapper.append(probe);
    const value = (name: string, property: 'color' | 'backgroundColor' = 'color') => {
      probe.style[property] = `var(${name})`;
      return getComputedStyle(probe)[property];
    };
    const surface = value('--sk-surface-card', 'backgroundColor');

    // THE FAMILY IS ONE FAMILY. #179 asked this mission to consume a --sk-chart-* family #148
    // was expected to land; it landed --sk-color-data-* instead. The three shared roles resolve
    // to the SAME computed value here, in both themes, which is what makes the eventual
    // retrofit of sk-bar-chart a rename rather than a redesign.
    expect(value('--sk-chart-series-1')).toBe(value('--sk-color-data-series-primary'));
    expect(value('--sk-chart-grid')).toBe(value('--sk-color-data-grid'));
    expect(value('--sk-chart-baseline')).toBe(value('--sk-color-data-baseline'));

    for (const ink of [
      '--sk-chart-series-1', '--sk-chart-series-2', '--sk-chart-series-3', '--sk-chart-series-4',
      '--sk-chart-gap', '--sk-chart-baseline',
    ]) {
      expect(contrast(value(ink), surface), `${theme} ${ink} contrast`).toBeGreaterThanOrEqual(3);
    }
    palettes.set(theme, [
      value('--sk-chart-series-1'), value('--sk-chart-series-2'), value('--sk-chart-series-3'),
      value('--sk-chart-series-4'), value('--sk-chart-gap'), surface,
    ].join('|'));
    wrapper.remove();
  }
  assertThemesDiffered(palettes);
});

test('rendered geometry binds the chart tokens in both themes', async () => {
  const palettes = new Map<string, string>();
  for (const theme of ['dark', 'light'] as const) {
    const wrapper = document.createElement('div');
    if (theme === 'light') wrapper.className = 'sk-light';
    document.body.append(wrapper);
    const element = await mount({ series: withGap });
    wrapper.append(element);
    await element.updateComplete;
    const probe = document.createElement('span');
    wrapper.append(probe);
    const value = (name: string) => {
      probe.style.color = `var(${name})`;
      return getComputedStyle(probe).color;
    };
    const line = partOf(element, 'line')!;
    const gapEdge = partOf(element, 'gap')!.querySelector('.sk-time-series-chart__gap-edge')!;
    expect(getComputedStyle(line).stroke).toBe(value('--sk-chart-series-1'));
    expect(getComputedStyle(gapEdge).stroke).toBe(value('--sk-chart-gap'));
    palettes.set(theme, `${getComputedStyle(line).stroke}|${getComputedStyle(gapEdge).stroke}`);
    wrapper.remove();
  }
  assertThemesDiffered(palettes);
});

test('empty and malformed input fails closed to one labelled state', async () => {
  const good = { id: 'a', at: 0, value: 1, displayValue: '1', label: 'A', resolution: 'raw' };
  const invalid: unknown[] = [
    'not-an-array',
    null,
    [null],
    [{ id: '', name: 'A', points: [] }],
    [{ id: 'a', name: ' ', points: [] }],
    [{ id: 'a', name: 'A', points: 'nope' }],
    [{ id: 'a', name: 'A', points: [{ ...good, id: '' }] }],
    [{ id: 'a', name: 'A', points: [{ ...good, label: '' }] }],
    [{ id: 'a', name: 'A', points: [{ ...good, displayValue: '' }] }],
    [{ id: 'a', name: 'A', points: [{ ...good, resolution: 'minute' }] }],
    [{ id: 'a', name: 'A', points: [{ ...good, at: Number.NaN }] }],
    [{ id: 'a', name: 'A', points: [{ ...good, value: Number.POSITIVE_INFINITY }] }],
    [{ id: 'a', name: 'A', points: [{ ...good, value: 'one' }] }],
    // Out-of-order timestamps: the element never sorts, so it refuses instead — a sorted
    // picture would silently disagree with the source-ordered table beside it.
    [{ id: 'a', name: 'A', points: [good, { ...good, id: 'b', at: -1 }] }],
    // Duplicate point ids ACROSS series: `selectedId` could not resolve to one point.
    [
      { id: 'a', name: 'A', points: [good] },
      { id: 'b', name: 'B', points: [good] },
    ],
    [
      { id: 'a', name: 'A', points: [good] },
      { id: 'a', name: 'B', points: [{ ...good, id: 'b' }] },
    ],
  ];

  const unassigned = document.createElement('sk-time-series-chart') as Chart;
  document.body.append(unassigned);
  await unassigned.updateComplete;
  expect(partOf(unassigned, 'empty-state')?.textContent).toContain('No data to display');

  for (const series of [[], [{ id: 'a', name: 'A', points: [] }]]) {
    const element = await mount({ series });
    expect(rowsOf(element)).toHaveLength(0);
    expect(partOf(element, 'empty-state')?.textContent).toContain('No data to display');
  }

  for (const series of invalid) {
    const element = await mount({ series, selectable: true });
    expect(rowsOf(element), JSON.stringify(series)).toHaveLength(0);
    expect(element.shadowRoot!.querySelectorAll('button')).toHaveLength(0);
    expect(partOf(element, 'empty-state')?.textContent).toContain('Chart unavailable');
  }

  const recovered = await mount({ series: withGap });
  expect(rowsOf(recovered)).toHaveLength(6);
  recovered.series = invalid[3] as ReadonlyArray<TimeSeriesDatum>;
  await recovered.updateComplete;
  expect(rowsOf(recovered)).toHaveLength(0);
  recovered.series = withGap;
  await recovered.updateComplete;
  expect(rowsOf(recovered)).toHaveLength(6);
});

test('degenerate extents render without dividing by zero', async () => {
  const sameTime = await mount({
    series: Object.freeze([
      Object.freeze({
        id: 'flat',
        name: 'Flat',
        points: Object.freeze([
          Object.freeze({ id: 'a', at: 5, value: 1, displayValue: '1', label: 'A', resolution: 'raw' as const }),
          Object.freeze({ id: 'b', at: 5, value: 9, displayValue: '9', label: 'B', resolution: 'raw' as const }),
        ]),
      }),
    ]),
  });
  expect(xOf(partsOf(sameTime, 'line')[0]).every(Number.isFinite)).toBe(true);

  const sameValue = await mount({ series: Object.freeze([seriesOf('z', 'Zeroes', [0, 0, 0])]) });
  const ys = partsOf(sameValue, 'line')[0]
    .getAttribute('points')!
    .trim()
    .split(/\s+/)
    .map((pair) => Number(pair.split(',')[1]));
  expect(ys.every(Number.isFinite)).toBe(true);
  expect(new Set(ys).size).toBe(1);

  const single = await mount({ series: Object.freeze([seriesOf('s', 'Single', [7])]) });
  expect(partsOf(single, 'line')).toHaveLength(0);
  expect(partsOf(single, 'marker')).toHaveLength(1);
  expect(rowsOf(single)).toHaveLength(1);
});

test('consumer text stays literal and cannot create markup, handlers, scripts, or requests', async () => {
  const label = '<img src=x onerror="globalThis.__skTimeSeriesProbe=1"> & "label"';
  const displayValue = '<script>globalThis.__skTimeSeriesProbe=2</script> 42 req/s';
  const target = globalThis as typeof globalThis & { __skTimeSeriesProbe?: number };
  target.__skTimeSeriesProbe = 0;
  const errors: string[] = [];
  const onError = (event: ErrorEvent) => errors.push(event.message);
  window.addEventListener('error', onError);
  try {
    const element = await mount({
      series: Object.freeze([
        Object.freeze({
          id: 'unsafe',
          name: '<b>Series</b>',
          points: Object.freeze([
            Object.freeze({ id: 'u', at: 0, value: 42, displayValue, label, resolution: 'raw' as const }),
          ]),
        }),
      ]),
    });
    const row = rowsOf(element)[0];
    expect(cellText(row, 1)).toBe(label);
    expect(row.querySelector('[part="value"]')!.textContent).toBe(displayValue);
    expect(element.shadowRoot!.querySelectorAll('img,script,iframe,object,embed,link')).toHaveLength(0);
    expect(element.shadowRoot!.querySelectorAll('[onerror],[onclick],[src],[href]')).toHaveLength(0);
    expect(partOf(element, 'series-name')!.textContent).toBe('<b>Series</b>');
    expect(target.__skTimeSeriesProbe).toBe(0);
    expect(errors).toEqual([]);
  } finally {
    window.removeEventListener('error', onError);
    delete target.__skTimeSeriesProbe;
  }
});

test('presentational mode has no interactive residue and keeps the figure naming', async () => {
  const element = await mount({ selectable: false, selectedId: 'throughput-1' });
  expect(element.shadowRoot!.querySelectorAll('button,[aria-pressed]')).toHaveLength(0);
  expect(partOf(element, 'chart')!.getAttribute('aria-label')).toBe('Throughput over time');
  expect(partOf(element, 'chart')!.getAttribute('aria-describedby')).not.toBeNull();
  expect(element.shadowRoot!.querySelector('[data-chart-description]')!.textContent).toBe(
    'Requests per second by hour',
  );
  expect(partOf(element, 'table')!.querySelector('caption')!.textContent).toContain(
    'Throughput over time',
  );
  expect(
    Array.from(partOf(element, 'table')!.querySelectorAll('th[scope="col"]')).map((th) => th.textContent),
  ).toEqual(['Series', 'Time', 'Value', 'Resolution']);
  expect(eventRecords(element)).toHaveLength(0);
});

test('controlled selection projects the supplied id and never the activation', async () => {
  const element = await mount({ selectable: true, selectedId: 'throughput-1' });
  const records = eventRecords(element);
  const buttons = Array.from(element.shadowRoot!.querySelectorAll<HTMLButtonElement>('button'));
  expect(buttons).toHaveLength(5);
  expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
    'false', 'true', 'false', 'false', 'false',
  ]);
  expect(
    partsOf(element, 'marker').filter((marker) =>
      marker.classList.contains('sk-time-series-chart__marker--selected'),
    ).map((marker) => marker.getAttribute('data-point-id')),
  ).toEqual(['throughput-1']);

  buttons[3].click();
  await element.updateComplete;
  expect(records).toEqual([
    { detail: { seriesId: 'throughput', pointId: 'throughput-3' }, bubbles: true, composed: true, cancelable: true },
  ]);
  expect(element.selectedId).toBe('throughput-1');

  element.selectedId = 'missing';
  await element.updateComplete;
  expect(element.shadowRoot!.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
});

test('[SC-006] native pointer, Enter, Space, and held-key sequences each emit once', async () => {
  const element = await mount({ selectable: true });
  const trigger = element.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
  const records = eventRecords(element);

  await userEvent.click(trigger);
  expect(records).toHaveLength(1);
  trigger.focus();
  await userEvent.keyboard('{Enter}');
  expect(records).toHaveLength(2);
  await userEvent.keyboard('{Space}');
  expect(records).toHaveLength(3);
  await userEvent.keyboard('{Enter>2/}');
  expect(records).toHaveLength(4);
  await userEvent.keyboard('{Space>2/}');
  expect(records).toHaveLength(5);
  expect(records.every((record) => record.detail.pointId === 'throughput-0')).toBe(true);
});

test('[SC-007] selection intent carries the exact identity and no extra detail keys', async () => {
  const element = await mount({
    selectable: true,
    series: Object.freeze([
      Object.freeze({
        id: '  verbatim-series  ',
        name: 'Verbatim',
        points: Object.freeze([
          Object.freeze({ id: '  verbatim-point  ', at: 0, value: 1, displayValue: '1', label: 'A', resolution: 'raw' as const }),
        ]),
      }),
    ]),
  });
  const records = eventRecords(element);
  element.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
  expect(records[0].detail).toEqual({ seriesId: '  verbatim-series  ', pointId: '  verbatim-point  ' });
  expect(Object.keys(records[0].detail)).toEqual(['seriesId', 'pointId']);
  expect(Object.isFrozen(records[0].detail)).toBe(true);
});

test('[SC-008] selection intent bubbles and crosses a shadow boundary', async () => {
  const wrapper = document.createElement('div');
  const root = wrapper.attachShadow({ mode: 'open' });
  document.body.append(wrapper);
  const element = document.createElement('sk-time-series-chart') as Chart;
  element.series = dense;
  element.selectable = true;
  root.append(element);
  await element.updateComplete;

  let seen: CustomEvent<TimeSeriesChartSelectDetail> | null = null;
  document.addEventListener(
    'sk-time-series-chart-select',
    (event) => {
      seen = event as CustomEvent<TimeSeriesChartSelectDetail>;
    },
    { once: true },
  );
  element.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
  expect(seen).not.toBeNull();
  expect(seen!.bubbles).toBe(true);
  expect(seen!.composed).toBe(true);
  // Cancelability is asserted in [SC-009] and in the unmarked controlled-selection test, not
  // here: an arm that flips `cancelable` must red the behaviour that DEPENDS on it, and an
  // extra assertion in this test would make that arm collateral on a second marked behaviour.
  wrapper.remove();
});

test('[SC-009] preventDefault suppresses the element’s own focus move and nothing else', async () => {
  // element.click(), NOT userEvent.click(): userEvent focuses the control first and the
  // platform's own focus behaviour would satisfy this assertion for the wrong reason. A
  // programmatic click never focuses, so the only thing that can move focus here is the
  // element's own default action.
  const uncancelled = await mount({ selectable: true, selectedId: 'throughput-0' });
  const target = Array.from(uncancelled.shadowRoot!.querySelectorAll<HTMLButtonElement>('button'))[2];
  target.click();
  await uncancelled.updateComplete;
  // Focus inside a shadow root reports the HOST at document level, so the assertion has to be
  // made inside the root or it holds whether or not focus moved.
  expect(uncancelled.shadowRoot!.activeElement).toBe(target);
  expect(uncancelled.selectedId).toBe('throughput-0');

  const cancelled = await mount({ selectable: true, selectedId: 'throughput-0' });
  cancelled.addEventListener('sk-time-series-chart-select', (event) => event.preventDefault());
  const blocked = Array.from(cancelled.shadowRoot!.querySelectorAll<HTMLButtonElement>('button'))[2];
  blocked.click();
  await cancelled.updateComplete;
  expect(cancelled.shadowRoot!.activeElement).not.toBe(blocked);
  // Cancelling prevents the focus move and NOTHING else: selection was never the element's.
  expect(cancelled.selectedId).toBe('throughput-0');
  expect(rowsOf(cancelled)).toHaveLength(5);
});

test('[SC-010] properties assigned before definition survive upgrade and first render', async () => {
  const element = document.createElement('sk-time-series-chart-late') as Chart;
  element.series = withGap;
  element.label = 'Late chart';
  element.description = 'Assigned before upgrade';
  element.selectable = true;
  element.selectedId = 'throughput-4';
  element.gapThreshold = 3 * HOUR;
  document.body.append(element);
  customElements.define('sk-time-series-chart-late', class extends SkTimeSeriesChart {});
  await customElements.whenDefined('sk-time-series-chart-late');
  await element.updateComplete;

  expect(element.series).toBe(withGap);
  expect(element.label).toBe('Late chart');
  expect(element.description).toBe('Assigned before upgrade');
  expect(element.selectable).toBe(true);
  expect(element.selectedId).toBe('throughput-4');
  expect(element.gapThreshold).toBe(3 * HOUR);
  expect(rowsOf(element)).toHaveLength(6);
  // The gap-note DOM is deliberately NOT asserted here. It would make this test red under the
  // SC-013 interpolation arm as well, and an arm that reds two MARKED behaviours cannot say
  // which one it proves. `gapThreshold` reaching the upgraded element is asserted above, which
  // is the property claim this behaviour is about; the notes themselves are covered by the
  // supplied-threshold test.
  expect(
    element.shadowRoot!.querySelector('[aria-pressed="true"]')!.closest('[part="row"]')!
      .getAttribute('data-point-id'),
  ).toBe('throughput-4');
});

test('[SC-013] all sixteen declared parts are rendered and externally targetable', async () => {
  // The rich mount carries an INTERIOR NULL RUN and a supplied gap threshold on purpose. With a
  // dense series only, the interpolation mutation would leave every remaining part present and
  // this test would stay green through a missing `gap` — the certifying-absence shape sk-card's
  // #177 arm records.
  const rich = await mount({
    series: Object.freeze([
      Object.freeze({
        id: 'throughput',
        name: 'Throughput',
        points: Object.freeze([
          point(0, 40),
          point(1, 55),
          point(2, null),
          point(3, null),
          Object.freeze({ ...point(4, 62, 'hour') }),
          Object.freeze({ ...point(5, 58, 'hour') }),
        ]),
      }),
    ]),
    selectable: true,
    gapThreshold: 3 * HOUR,
  });
  const empty = await mount({ series: [] });
  const cases: ReadonlyArray<readonly [string, Chart, string]> = [
    ['chart', rich, 'sk-time-series-chart::part(chart)'],
    ['legend', rich, 'sk-time-series-chart::part(legend)'],
    ['series-name', rich, 'sk-time-series-chart::part(series-name)'],
    ['plot', rich, 'sk-time-series-chart::part(plot)'],
    ['line', rich, 'sk-time-series-chart::part(line)'],
    ['marker', rich, 'sk-time-series-chart::part(marker)'],
    ['gap', rich, 'sk-time-series-chart::part(gap)'],
    ['resolution-boundary', rich, 'sk-time-series-chart::part(resolution-boundary)'],
    ['gap-notes', rich, 'sk-time-series-chart::part(gap-notes)'],
    ['gap-note', rich, 'sk-time-series-chart::part(gap-note)'],
    ['scroller', rich, 'sk-time-series-chart::part(scroller)'],
    ['table', rich, 'sk-time-series-chart::part(table)'],
    ['row', rich, 'sk-time-series-chart::part(row)'],
    ['value', rich, 'sk-time-series-chart::part(value)'],
    ['point', rich, 'sk-time-series-chart::part(point)'],
    ['empty-state', empty, 'sk-time-series-chart::part(empty-state)'],
  ];
  for (const [name, host, selector] of cases) {
    const style = document.createElement('style');
    style.textContent = `${selector} { outline-style: dashed; }`;
    document.head.append(style);
    try {
      const part = partOf(host, name);
      expect(part, `part="${name}" is declared but absent`).not.toBeNull();
      expect(getComputedStyle(part!).outlineStyle, `part="${name}" is not targetable`).toBe('dashed');
    } finally {
      style.remove();
    }
  }
  expect(cases).toHaveLength(16);
});

test('[SC-014] the generated sheet is the sole adopted stylesheet by identity', async () => {
  const element = await mount();
  expect(element.shadowRoot!.adoptedStyleSheets).toHaveLength(1);
  // The sheet is imported from the GENERATED module, not re-exported through the package
  // barrel — #225 banned that here, and it makes this identity claim stronger rather than
  // weaker: it now names the exact artifact build-elements-css.mjs writes.
  expect(element.shadowRoot!.adoptedStyleSheets[0]).toBe(skTimeSeriesChartSheet);
  expect(element.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
});

test('authored CSS has scoped reduced-motion and forced-colors mechanisms that keep the gap visible', () => {
  const reducedMotion = mediaRuleFor('(prefers-reduced-motion: reduce)');
  expect(reducedMotion).not.toBeUndefined();
  expect(styleRuleFor(reducedMotion!, '.sk-time-series-chart__point')?.style.transition).toBe('none');

  const forcedColors = mediaRuleFor('(forced-colors: active)');
  expect(forcedColors).not.toBeUndefined();
  // The gap has to survive ink collapse, and it does so through a STROKE: `fill` flattens to
  // Canvas under forced-colors and a stroke does not, which is why the gap is edged rather than
  // only filled.
  expect(styleRuleFor(forcedColors!, '.sk-time-series-chart__gap-edge')?.style.stroke.toLowerCase()).toBe('canvastext');
  expect(styleRuleFor(forcedColors!, '.sk-time-series-chart__gap-band')?.style.fill.toLowerCase()).toBe('canvas');
  expect(styleRuleFor(forcedColors!, '.sk-time-series-chart__line')?.style.stroke.toLowerCase()).toBe('canvastext');
  const focus = styleRuleFor(forcedColors!, 'button.sk-time-series-chart__point:focus-visible')!;
  expect(focus.style.outlineStyle).toBe('solid');
  expect(focus.style.outlineColor.toLowerCase()).toBe('highlight');
  const selected = styleRuleFor(forcedColors!, 'button.sk-time-series-chart__point[aria-pressed="true"]')!;
  expect(selected.style.borderStyle).toBe('double');
  expect(selected.style.borderColor.toLowerCase()).toBe('highlight');
  // No forced-colors rule anywhere may freeze an affordance at its authored colour.
  expect(
    Array.from(forcedColors!.cssRules).some(
      (rule) => rule instanceof CSSStyleRule && rule.style.forcedColorAdjust === 'none',
    ),
  ).toBe(false);
  // The dash channel is NOT overridden under forced-colors — it is the channel that survives.
  expect(
    Array.from(forcedColors!.cssRules).some(
      (rule) => rule instanceof CSSStyleRule && rule.style.strokeDasharray !== '',
    ),
  ).toBe(false);
});

test('the public attributes are exactly the five scalar inputs', () => {
  expect([...SkTimeSeriesChart.observedAttributes].sort()).toEqual([
    'description',
    'gap-threshold',
    'label',
    'selectable',
    'selected-id',
  ]);
});
