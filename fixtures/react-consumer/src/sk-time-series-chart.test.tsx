import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  SkTimeSeriesChart,
  type SkTimeSeriesChartElement,
} from '@spec-kitty/react';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * #179 lists the ssrSafe delivery of an array-of-objects property as an unsolved risk. It is
 * not: #148 measured it and the machinery is in place — `attribute: false` makes
 * normalise-manifest stamp `x-spec-kitty-property-only`, and build-react-wrappers reads that
 * plus `x-spec-kitty-property-reset` to assign the property rather than serialise an attribute.
 * This file re-proves it FOR THIS ELEMENT rather than inheriting it on trust, and the property
 * here is a shape #148 never exercised: a nested array, each series carrying its own points.
 */
const series = Object.freeze([
  Object.freeze({
    id: 'throughput',
    name: 'Throughput',
    points: Object.freeze([
      Object.freeze({ id: 'p0', at: 0, value: 40, displayValue: '40 req/s', label: 'Hour 0', resolution: 'raw' as const }),
      Object.freeze({ id: 'p1', at: 3_600_000, value: null, displayValue: 'unused', label: 'Hour 1', resolution: 'raw' as const }),
      Object.freeze({ id: 'p2', at: 7_200_000, value: 62, displayValue: '62 req/s', label: 'Hour 2', resolution: 'raw' as const }),
    ]),
  }),
]) satisfies SkTimeSeriesChartElement['series'];

const replacement = Object.freeze([
  Object.freeze({
    id: 'latency',
    name: 'Latency',
    points: Object.freeze([
      Object.freeze({ id: 'q0', at: 0, value: 12, displayValue: '12 ms', label: 'Hour 0', resolution: 'hour' as const }),
    ]),
  }),
]) satisfies SkTimeSeriesChartElement['series'];

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function render(ui: React.ReactNode): void {
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>));
}

test('the generated time-series wrapper delivers the nested series on first render', async () => {
  expect(
    customElements.get('sk-time-series-chart'),
    'the element loaded before React could exercise pre-definition property delivery',
  ).toBeUndefined();

  render(<SkTimeSeriesChart series={series} selectable selectedId="p0" gapThreshold={7_200_000} />);
  const element = host.querySelector('sk-time-series-chart') as SkTimeSeriesChartElement;

  expect(element, 'the generated wrapper rendered no custom element').toBeTruthy();
  // An array of objects has no sane attribute serialisation. The wrapper must never try.
  expect(element.series, 'the initial series did not reach the undefined element').toBe(series);
  expect(element.hasAttribute('series')).toBe(false);
  expect(element.hasAttribute('selectable')).toBe(true);
  expect(element.getAttribute('selected-id')).toBe('p0');
  expect(element.getAttribute('gap-threshold')).toBe('7200000');

  const production = await import('@spec-kitty/elements');
  await customElements.whenDefined('sk-time-series-chart');
  await element.updateComplete;

  expect(
    customElements.get('sk-time-series-chart'),
    'the probe did not upgrade through the production definition',
  ).toBe(production.SkTimeSeriesChart);
  expect(element.series, 'the production upgrade replaced the series identity').toBe(series);
  expect(element.shadowRoot?.querySelectorAll('[part="row"]')).toHaveLength(3);
  // The gap survives the wrapper: a null delivered through React is still a break, not a zero.
  expect(element.shadowRoot?.querySelectorAll('[part="gap"]')).toHaveLength(1);
  expect(element.shadowRoot?.querySelectorAll('[part="line"]')).toHaveLength(0);
  expect(element.hasAttribute('series')).toBe(false);

  render(<SkTimeSeriesChart series={replacement} selectable={false} />);
  await element.updateComplete;

  expect(element.series, 'rerendering did not replace the series identity').toBe(replacement);
  expect(element.hasAttribute('series')).toBe(false);
  expect(element.hasAttribute('selectable')).toBe(false);
  expect(element.hasAttribute('selected-id')).toBe(false);

  render(<SkTimeSeriesChart />);
  await element.updateComplete;

  const reset = element.series;
  expect(reset).toEqual([]);
  expect(Object.isFrozen(reset), 'a removed series did not receive an immutable reset').toBe(true);
  expect(reset, 'a removed series retained the consumer array').not.toBe(replacement);

  render(<SkTimeSeriesChart series={series} />);
  await element.updateComplete;
  expect(element.series).toBe(series);
  render(<SkTimeSeriesChart />);
  await element.updateComplete;
  expect(element.series).toEqual([]);
  expect(element.series, 'separate removals must receive fresh frozen arrays').not.toBe(reset);
});

test('the generated time-series wrapper delivers one typed, cancelable selection event', async () => {
  const received: Array<{ detail: unknown; cancelable: boolean }> = [];
  render(
    <SkTimeSeriesChart
      onSkTimeSeriesChartSelect={(event) => {
        received.push({ detail: event.detail, cancelable: event.cancelable });
      }}
    />,
  );

  const element = host.querySelector('sk-time-series-chart') as SkTimeSeriesChartElement;
  expect(element, 'the generated wrapper rendered no custom element').toBeTruthy();

  const detail = Object.freeze({ seriesId: 'throughput', pointId: 'sentinel-point' });
  await act(async () => {
    element.dispatchEvent(
      new CustomEvent('sk-time-series-chart-select', {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
  });

  expect(received).toHaveLength(1);
  expect(received[0].detail, 'the wrapper changed the event detail identity').toBe(detail);
  expect(received[0].cancelable, 'the wrapper stripped cancelability').toBe(true);
});
