/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
import { beforeEach, expect, test } from 'vitest';
import '../../../packages/elements/src/bar-chart/sk-bar-chart.js';
import skBarChartSheet from '../../../packages/elements/src/bar-chart/sk-bar-chart.css.js';
import {
  type BarChartSelectDetail,
  type BarSeries,
  SkBarChart,
} from '../../../packages/elements/src/bar-chart/sk-bar-chart.js';
import { userEvent } from 'vitest/browser';
import barChartCss from '../../../packages/styles/src/bar-chart/sk-bar-chart.css?raw';
import tokensCss from '@spec-kitty/tokens/tokens.css?raw';
import { assertThemesDiffered, contrast } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

type BarChart = SkBarChart & { updateComplete: Promise<unknown> };

const approvedSeries: BarSeries = Object.freeze([
  Object.freeze({ id: 'aug-11', label: 'Aug 11', value: 320, displayValue: '€320' }),
  Object.freeze({ id: 'aug-18', label: 'Aug 18', value: 510, displayValue: '€510' }),
  Object.freeze({ id: 'aug-25', label: 'Aug 25', value: 440, displayValue: '€440' }),
  Object.freeze({ id: 'sep-1', label: 'Sep 1', value: 604, displayValue: '€604' }),
]);

beforeEach(installTokenSheet);

const mount = async ({
  series = approvedSeries,
  label = 'Return over time',
  description = 'Attributed value by observation date',
  selectable = false,
  selectedId = '',
}: {
  series?: unknown;
  label?: string;
  description?: string;
  selectable?: boolean;
  selectedId?: string;
} = {}): Promise<BarChart> => {
  const element = document.createElement('sk-bar-chart') as BarChart;
  element.series = series as BarSeries;
  element.label = label;
  element.description = description;
  element.selectable = selectable;
  element.selectedId = selectedId;
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const partOf = (element: Element, name: string): Element | null =>
  element.shadowRoot!.querySelector(`[part="${name}"]`);

const itemsOf = (element: Element): HTMLElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]'));

const barOf = (item: Element): SVGRectElement =>
  item.querySelector<SVGRectElement>('[part="bar"]')!;

const surfaceOf = (item: Element): HTMLElement =>
  item.querySelector<HTMLElement>('.sk-bar-chart__surface')!;

const eventRecords = (element: Element) => {
  const records: Array<{
    detail: BarChartSelectDetail;
    bubbles: boolean;
    composed: boolean;
    cancelable: boolean;
  }> = [];
  element.addEventListener('sk-bar-chart-select', (event) => {
    const selectEvent = event as CustomEvent<BarChartSelectDetail>;
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
authoredSheet.replaceSync(barChartCss);

const mediaRuleFor = (query: string): CSSMediaRule | undefined =>
  Array.from(authoredSheet.cssRules).find(
    (rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.media.mediaText === query,
  );

const styleRuleFor = (media: CSSMediaRule, selector: string): CSSStyleRule | undefined =>
  Array.from(media.cssRules).find(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === selector,
  );

test('empty and malformed series fail closed without partial or stale targets', async () => {
  const invalidSeries: unknown[] = [
    null,
    {},
    'not-an-array',
    [null],
    [{ id: '', label: 'A', value: 1, displayValue: '1' }],
    [{ id: ' ', label: 'A', value: 1, displayValue: '1' }],
    [
      { id: 'same', label: 'A', value: 1, displayValue: '1' },
      { id: 'same', label: 'B', value: 2, displayValue: '2' },
    ],
    [{ id: 'a', label: '', value: 1, displayValue: '1' }],
    [{ id: 'a', label: 'A', value: -1, displayValue: '-1' }],
    [{ id: 'a', label: 'A', value: Number.NaN, displayValue: 'NaN' }],
    [{ id: 'a', label: 'A', value: Number.POSITIVE_INFINITY, displayValue: '∞' }],
    [{ id: 'a', label: 'A', value: '1', displayValue: '1' }],
    [{ id: 'a', label: 'A', value: 1, displayValue: '' }],
  ];

  const unassigned = document.createElement('sk-bar-chart') as BarChart;
  document.body.append(unassigned);
  await unassigned.updateComplete;
  expect(itemsOf(unassigned)).toHaveLength(0);
  expect(partOf(unassigned, 'empty-state')?.textContent).toContain('No data to display');

  for (const series of [[]]) {
    const element = await mount({ series });
    expect(itemsOf(element)).toHaveLength(0);
    expect(element.shadowRoot!.querySelectorAll('button')).toHaveLength(0);
    expect(partOf(element, 'empty-state')?.textContent).toContain('No data to display');
  }

  for (const series of invalidSeries) {
    const element = await mount({ series, selectable: true });
    expect(itemsOf(element), JSON.stringify(series)).toHaveLength(0);
    expect(element.shadowRoot!.querySelectorAll('button')).toHaveLength(0);
    expect(partOf(element, 'empty-state')?.textContent).toContain('Chart unavailable');
  }

  const element = await mount({ selectable: true });
  expect(itemsOf(element)).toHaveLength(4);
  element.series = invalidSeries[6] as BarSeries;
  await element.updateComplete;
  expect(itemsOf(element)).toHaveLength(0);
  expect(element.shadowRoot!.querySelectorAll('button')).toHaveLength(0);
  element.series = approvedSeries;
  await element.updateComplete;
  expect(itemsOf(element).map((item) => item.dataset['datumId'])).toEqual([
    'aug-11',
    'aug-18',
    'aug-25',
    'sep-1',
  ]);
});

test('numeric SVG geometry is exact, zero anchored, ordered, and independent of display text', async () => {
  const element = await mount();
  const items = itemsOf(element);
  expect(items.map((item) => item.dataset['datumId'])).toEqual(['aug-11', 'aug-18', 'aug-25', 'sep-1']);
  expect(items.map((item) => item.querySelector('[part="label"]')?.textContent)).toEqual([
    'Aug 11',
    'Aug 18',
    'Aug 25',
    'Sep 1',
  ]);
  expect(items.map((item) => item.querySelector('[part="value"]')?.textContent)).toEqual([
    '€320',
    '€510',
    '€440',
    '€604',
  ]);
  const ratios = [320 / 604, 510 / 604, 440 / 604, 1];
  expect(items.map((item) => Number(item.dataset['ratio']))).toEqual(ratios);
  expect(items.map((item) => Number(barOf(item).getAttribute('height')))).toEqual(
    ratios.map((ratio) => ratio * 100),
  );
  expect(items.map((item) => Number(barOf(item).getAttribute('y')))).toEqual(
    ratios.map((ratio) => 100 - ratio * 100),
  );
  expect(element.shadowRoot!.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
  expect(element.shadowRoot!.querySelectorAll('[style]')).toHaveLength(0);

  element.series = Object.freeze([
    Object.freeze({ id: 'close-a', label: 'A', value: 510, displayValue: 'same' }),
    Object.freeze({ id: 'close-b', label: 'B', value: 570, displayValue: 'same' }),
    Object.freeze({ id: 'equal-a', label: 'C', value: 570, displayValue: 'other' }),
    Object.freeze({ id: 'zero', label: 'Zero', value: 0, displayValue: 'zero' }),
    Object.freeze({ id: 'tiny', label: 'Tiny', value: Number.MIN_VALUE, displayValue: 'tiny' }),
  ]);
  await element.updateComplete;
  const varied = itemsOf(element);
  expect(Number(varied[0].dataset['ratio'])).toBe(510 / 570);
  expect(Number(varied[1].dataset['ratio'])).toBe(1);
  expect(Number(varied[2].dataset['ratio'])).toBe(1);
  expect(Number(varied[3].dataset['ratio'])).toBe(0);
  expect(Number(varied[4].dataset['ratio'])).toBe(Number.MIN_VALUE / 570);
  expect(barOf(varied[0]).getAttribute('height')).not.toBe(barOf(varied[1]).getAttribute('height'));
  expect(barOf(varied[1]).getAttribute('height')).toBe(barOf(varied[2]).getAttribute('height'));

  element.series = Object.freeze([
    Object.freeze({ id: 'zero-a', label: 'A', value: 0, displayValue: '£0' }),
    Object.freeze({ id: 'zero-b', label: 'B', value: 0, displayValue: '$0' }),
  ]);
  await element.updateComplete;
  expect(itemsOf(element).map((item) => Number(item.dataset['ratio']))).toEqual([0, 0]);

  element.series = Object.freeze([
    Object.freeze({ id: 'copy', label: 'Copy', value: 5, displayValue: '€5.00' }),
  ]);
  await element.updateComplete;
  const before = barOf(itemsOf(element)[0]).getAttribute('height');
  element.series = Object.freeze([
    Object.freeze({ id: 'copy', label: 'Copy', value: 5, displayValue: 'USD five' }),
  ]);
  await element.updateComplete;
  expect(barOf(itemsOf(element)[0]).getAttribute('height')).toBe(before);
  expect(itemsOf(element)[0].querySelector('[part="value"]')?.textContent).toBe('USD five');
});

test('consumer text stays literal and cannot create markup, handlers, scripts, or requests', async () => {
  const label = '<img src=x onerror="globalThis.__skBarChartProbe=1"> & "label"';
  const displayValue = '<script>globalThis.__skBarChartProbe=2</script> £510';
  const target = globalThis as typeof globalThis & { __skBarChartProbe?: number };
  target.__skBarChartProbe = 0;
  const resources: string[] = [];
  const onError = (event: ErrorEvent) => resources.push(event.message);
  window.addEventListener('error', onError);
  try {
    const element = await mount({
      series: Object.freeze([Object.freeze({ id: 'unsafe', label, value: 510, displayValue })]),
    });
    const item = itemsOf(element)[0];
    expect(item.querySelector('[part="label"]')?.textContent).toBe(label);
    expect(item.querySelector('[part="value"]')?.textContent).toBe(displayValue);
    expect(item.querySelectorAll('img,script,iframe,object,embed,link')).toHaveLength(0);
    expect(item.querySelectorAll('[onerror],[onclick],[src],[href]')).toHaveLength(0);
    expect(target.__skBarChartProbe).toBe(0);
    expect(resources).toEqual([]);
  } finally {
    window.removeEventListener('error', onError);
    delete target.__skBarChartProbe;
  }
});

test('presentational mode has native list semantics and zero interactive residue', async () => {
  const element = await mount({ selectable: false, selectedId: 'aug-18' });
  const list = partOf(element, 'plot')!;
  expect(list.tagName).toBe('OL');
  expect(itemsOf(element).every((item) => item.tagName === 'LI')).toBe(true);
  expect(element.shadowRoot!.querySelectorAll('button,[tabindex],[aria-pressed]')).toHaveLength(0);
  expect(itemsOf(element).some((item) => item.hasAttribute('data-selected'))).toBe(false);
  expect(itemsOf(element).map((item) => item.textContent!.replace(/\s+/g, ' ').trim())).toEqual([
    '€320 Aug 11',
    '€510 Aug 18',
    '€440 Aug 25',
    '€604 Sep 1',
  ]);
  expect(partOf(element, 'chart')?.getAttribute('aria-label')).toBe('Return over time');
  expect(partOf(element, 'chart')?.getAttribute('aria-describedby')).not.toBeNull();
  expect(element.shadowRoot!.querySelector('[data-chart-description]')?.textContent).toBe(
    'Attributed value by observation date',
  );
  expect(eventRecords(element)).toHaveLength(0);
});

test('controlled selected projection follows stable current IDs and never activation', async () => {
  const element = await mount({ selectable: true, selectedId: 'aug-18' });
  const records = eventRecords(element);
  const buttons = Array.from(element.shadowRoot!.querySelectorAll<HTMLButtonElement>('button'));
  expect(buttons).toHaveLength(4);
  expect(buttons.map((button) => button.type)).toEqual(['button', 'button', 'button', 'button']);
  expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false', 'false']);

  buttons[2].click();
  await element.updateComplete;
  expect(records).toEqual([{ detail: { id: 'aug-25' }, bubbles: true, composed: true, cancelable: false }]);
  expect(element.selectedId).toBe('aug-18');
  expect(element.shadowRoot!.querySelector('[aria-pressed="true"]')?.closest('[part="item"]')?.getAttribute('data-datum-id')).toBe('aug-18');

  element.selectedId = 'missing';
  await element.updateComplete;
  expect(element.shadowRoot!.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  element.selectedId = 'aug-25';
  element.series = Object.freeze([
    Object.freeze({ id: 'new', label: 'New', value: 1, displayValue: 'One' }),
  ]);
  await element.updateComplete;
  expect(element.shadowRoot!.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  expect(itemsOf(element).map((item) => item.dataset['datumId'])).toEqual(['new']);
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
});

test('[SC-007] selection intent has the exact stable ID and no extra detail keys', async () => {
  const element = await mount({
    selectable: true,
    series: Object.freeze([
      Object.freeze({ id: '  verbatim-id  ', label: 'A', value: 1, displayValue: '1' }),
    ]),
  });
  const records = eventRecords(element);
  element.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
  expect(records[0].detail).toEqual({ id: '  verbatim-id  ' });
  expect(Object.keys(records[0].detail)).toEqual(['id']);
});

test('[SC-008] selection intent bubbles and crosses a shadow boundary without cancellation', async () => {
  const wrapper = document.createElement('div');
  const root = wrapper.attachShadow({ mode: 'open' });
  document.body.append(wrapper);
  const element = document.createElement('sk-bar-chart') as BarChart;
  element.series = approvedSeries;
  element.selectable = true;
  element.selectedId = 'aug-11';
  root.append(element);
  await element.updateComplete;

  let seen: CustomEvent<BarChartSelectDetail> | null = null;
  document.addEventListener(
    'sk-bar-chart-select',
    (event) => {
      event.preventDefault();
      seen = event as CustomEvent<BarChartSelectDetail>;
    },
    { once: true },
  );
  element.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
  expect(seen).not.toBeNull();
  expect(seen!.bubbles).toBe(true);
  expect(seen!.composed).toBe(true);
  expect(seen!.cancelable).toBe(false);
  expect(seen!.defaultPrevented).toBe(false);
  expect(element.selectedId).toBe('aug-11');
});

test('[SC-010] properties assigned before definition survive upgrade and first render', async () => {
  const element = document.createElement('sk-bar-chart-late') as BarChart;
  element.series = approvedSeries;
  element.label = 'Late chart';
  element.description = 'Assigned before upgrade';
  element.selectable = true;
  element.selectedId = 'aug-25';
  document.body.append(element);
  customElements.define('sk-bar-chart-late', class extends SkBarChart {});
  await customElements.whenDefined('sk-bar-chart-late');
  await element.updateComplete;

  expect(element.series).toBe(approvedSeries);
  expect(element.label).toBe('Late chart');
  expect(element.description).toBe('Assigned before upgrade');
  expect(element.selectable).toBe(true);
  expect(element.selectedId).toBe('aug-25');
  expect(itemsOf(element)).toHaveLength(4);
  expect(element.shadowRoot!.querySelector('[aria-pressed="true"]')?.closest('[part="item"]')?.getAttribute('data-datum-id')).toBe('aug-25');
});

test('[SC-013] all seven declared parts are rendered and externally targetable', async () => {
  const element = await mount();
  const empty = await mount({ series: [] });
  const cases: ReadonlyArray<readonly [string, BarChart, string]> = [
    ['chart', element, 'sk-bar-chart::part(chart)'],
    ['plot', element, 'sk-bar-chart::part(plot)'],
    ['item', element, 'sk-bar-chart::part(item)'],
    ['bar', element, 'sk-bar-chart::part(bar)'],
    ['value', element, 'sk-bar-chart::part(value)'],
    ['label', element, 'sk-bar-chart::part(label)'],
    ['empty-state', empty, 'sk-bar-chart::part(empty-state)'],
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
  expect(cases).toHaveLength(7);
});

test('[SC-014] the generated sheet is the sole adopted stylesheet by identity', async () => {
  const element = await mount();
  expect(element.shadowRoot!.adoptedStyleSheets).toHaveLength(1);
  expect(element.shadowRoot!.adoptedStyleSheets[0]).toBe(skBarChartSheet);
  expect(element.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
});

test('semantic data aliases exist exactly once per theme and bind rendered geometry', async () => {
  const lightStart = tokensCss.indexOf(':root[data-theme="light"],');
  expect(lightStart).toBeGreaterThan(0);
  const defaultBlock = tokensCss.slice(0, lightStart);
  const lightBlock = tokensCss.slice(lightStart);
  const aliases = {
    '--sk-color-data-series-primary': 'var(--sk-on-tint-sky)',
    '--sk-color-data-grid': 'var(--sk-border-default)',
    '--sk-color-data-baseline': 'var(--sk-fg-subtle)',
  } as const;
  for (const [name, value] of Object.entries(aliases)) {
    const declaration = `${name}: ${value};`;
    expect(defaultBlock.split(declaration)).toHaveLength(2);
    expect(lightBlock.split(declaration)).toHaveLength(2);
  }

  const palettes = new Map<string, string>();
  for (const theme of ['dark', 'light'] as const) {
    const wrapper = document.createElement('div');
    if (theme === 'light') wrapper.className = 'sk-light';
    document.body.append(wrapper);
    const element = await mount();
    wrapper.append(element);
    await element.updateComplete;
    const item = itemsOf(element)[0];
    const bar = barOf(item);
    const grid = item.querySelector<SVGLineElement>('.sk-bar-chart__grid')!;
    const baseline = item.querySelector<SVGLineElement>('.sk-bar-chart__baseline')!;
    const probe = document.createElement('span');
    wrapper.append(probe);
    const computedToken = (name: string, property: 'color' | 'backgroundColor' = 'color') => {
      probe.style[property] = `var(${name})`;
      return getComputedStyle(probe)[property];
    };
    const series = computedToken('--sk-color-data-series-primary');
    const gridColor = computedToken('--sk-color-data-grid');
    const baselineColor = computedToken('--sk-color-data-baseline');
    const focus = computedToken('--sk-border-focus');
    const surface = computedToken('--sk-surface-card', 'backgroundColor');
    expect(getComputedStyle(bar).fill).toBe(series);
    expect(getComputedStyle(grid).stroke).toBe(gridColor);
    expect(getComputedStyle(baseline).stroke).toBe(baselineColor);
    expect(series).not.toBe(focus);
    expect(contrast(series, surface), `${theme} series contrast`).toBeGreaterThanOrEqual(3);
    expect(contrast(baselineColor, surface), `${theme} baseline contrast`).toBeGreaterThanOrEqual(3);
    palettes.set(theme, `${series}|${gridColor}|${baselineColor}|${surface}`);
    wrapper.remove();
  }
  assertThemesDiffered(palettes);
});

test('authored CSS has scoped reduced-motion and forced-colors focus/selection mechanisms', () => {
  const reducedMotion = mediaRuleFor('(prefers-reduced-motion: reduce)');
  expect(reducedMotion).not.toBeUndefined();
  expect(styleRuleFor(reducedMotion!, '.sk-bar-chart__surface')?.style.transition).toBe('none');

  const forcedColors = mediaRuleFor('(forced-colors: active)');
  expect(forcedColors).not.toBeUndefined();
  const focus = styleRuleFor(forcedColors!, 'button.sk-bar-chart__surface:focus-visible')!;
  const selected = styleRuleFor(forcedColors!, 'button.sk-bar-chart__surface[aria-pressed="true"]')!;
  expect(focus.style.outlineStyle).toBe('solid');
  expect(focus.style.outlineWidth).toBe('var(--sk-border-width-2)');
  expect(focus.style.outlineColor.toLowerCase()).toBe('highlight');
  expect(selected.style.borderStyle).toBe('double');
  expect(selected.style.borderColor.toLowerCase()).toBe('highlight');
  expect(
    Array.from(forcedColors!.cssRules).some(
      (rule) => rule instanceof CSSStyleRule && rule.style.forcedColorAdjust === 'none',
    ),
  ).toBe(false);
});

test('long labels remain inside their own horizontally scrollable item before and after scrolling', async () => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '320px';
  document.body.append(wrapper);
  const element = await mount({
    series: Object.freeze([
      Object.freeze({ id: 'one', label: 'Monday 1 September 2026 — first observation', value: 10, displayValue: 'Ten' }),
      Object.freeze({ id: 'two', label: 'Tuesday 2 September 2026 — second observation', value: 20, displayValue: 'Twenty' }),
      Object.freeze({ id: 'three', label: 'Wednesday 3 September 2026 — third observation', value: 30, displayValue: 'Thirty' }),
      Object.freeze({ id: 'four', label: 'Thursday 4 September 2026 — fourth observation', value: 40, displayValue: 'Forty' }),
    ]),
    selectable: true,
  });
  wrapper.append(element);
  await element.updateComplete;
  const plot = partOf(element, 'plot') as HTMLElement;
  expect(plot.scrollWidth).toBeGreaterThan(plot.clientWidth);
  expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
  for (const item of itemsOf(element)) {
    const itemRect = item.getBoundingClientRect();
    for (const child of [item.querySelector('[part="value"]')!, item.querySelector('svg')!, item.querySelector('[part="label"]')!]) {
      const rect = child.getBoundingClientRect();
      expect(rect.left).toBeGreaterThanOrEqual(itemRect.left - 0.5);
      expect(rect.right).toBeLessThanOrEqual(itemRect.right + 0.5);
    }
  }
  plot.scrollLeft = plot.scrollWidth;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(plot.scrollLeft).toBeGreaterThan(0);
  const last = itemsOf(element).at(-1)!;
  expect(last.querySelector('[part="label"]')?.textContent).toContain('fourth observation');
});

test('the public attributes are exactly the four scalar inputs', () => {
  expect([...SkBarChart.observedAttributes].sort()).toEqual([
    'description',
    'label',
    'selectable',
    'selected-id',
  ]);
});
