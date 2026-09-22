import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  SkBarChart,
  type BarChartSelectDetail,
  type SkBarChartElement,
} from '@spec-kitty/react';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const series = Object.freeze([
  Object.freeze({ id: 'aug-11', label: 'Aug 11', value: 320, displayValue: '€320' }),
  Object.freeze({ id: 'aug-18', label: 'Aug 18', value: 510, displayValue: '€510' }),
]) satisfies SkBarChartElement['series'];

const replacement = Object.freeze([
  Object.freeze({ id: 'sep-1', label: 'Sep 1', value: 604, displayValue: '€604' }),
]) satisfies SkBarChartElement['series'];

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

test('[SC-010] the generated bar-chart wrapper preserves, replaces, and resets readonly series', async () => {
  expect(
    customElements.get('sk-bar-chart'),
    'the element loaded before React could exercise pre-definition property delivery',
  ).toBeUndefined();

  render(<SkBarChart series={series} selectable selectedId="aug-18" />);
  const element = host.querySelector('sk-bar-chart') as SkBarChartElement;

  expect(element, 'the generated wrapper rendered no custom element').toBeTruthy();
  expect(element.series, 'the initial series did not reach the undefined element').toBe(series);
  expect(element.hasAttribute('series')).toBe(false);
  expect(element.hasAttribute('selectable')).toBe(true);
  expect(element.getAttribute('selected-id')).toBe('aug-18');

  const production = await import('@spec-kitty/elements');
  await customElements.whenDefined('sk-bar-chart');
  await element.updateComplete;

  expect(customElements.get('sk-bar-chart'), 'the probe did not upgrade through the production definition').toBe(
    production.SkBarChart,
  );
  expect(element.series, 'the production custom-element upgrade replaced the series identity').toBe(series);
  expect(element.shadowRoot?.querySelectorAll('[part="item"]')).toHaveLength(series.length);
  expect(element.hasAttribute('series')).toBe(false);

  render(<SkBarChart series={replacement} selectable={false} />);
  await element.updateComplete;

  expect(element.series, 'rerendering did not replace the series identity').toBe(replacement);
  expect(element.hasAttribute('series')).toBe(false);
  expect(element.hasAttribute('selectable')).toBe(false);
  expect(element.hasAttribute('selected-id')).toBe(false);

  render(<SkBarChart />);
  await element.updateComplete;

  const reset = element.series;
  expect(reset).toEqual([]);
  expect(Object.isFrozen(reset), 'removed series did not receive an immutable reset').toBe(true);
  expect(reset, 'removed series retained the consumer array').not.toBe(replacement);
  expect(element.hasAttribute('series')).toBe(false);

  render(<SkBarChart series={series} />);
  await element.updateComplete;
  expect(element.series).toBe(series);
  render(<SkBarChart />);
  await element.updateComplete;
  expect(element.series).toEqual([]);
  expect(Object.isFrozen(element.series)).toBe(true);
  expect(element.series, 'separate removals must receive fresh frozen arrays').not.toBe(reset);
});

test('[SC-006] the generated bar-chart wrapper delivers one typed selection event', async () => {
  const received: BarChartSelectDetail[] = [];
  render(
    <SkBarChart
      onSkBarChartSelect={(event) => {
        received.push(event.detail);
      }}
    />,
  );

  const element = host.querySelector('sk-bar-chart') as SkBarChartElement;
  expect(element, 'the generated wrapper rendered no custom element').toBeTruthy();

  const detail = Object.freeze({ id: 'sentinel-bar' });
  await act(async () => {
    element.dispatchEvent(
      new CustomEvent<BarChartSelectDetail>('sk-bar-chart-select', {
        detail,
        bubbles: true,
        composed: true,
        cancelable: false,
      }),
    );
  });

  expect(received).toHaveLength(1);
  expect(received[0], 'the wrapper changed the event detail identity').toBe(detail);
});
