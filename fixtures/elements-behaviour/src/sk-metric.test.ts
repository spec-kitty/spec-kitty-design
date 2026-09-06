import { beforeEach, expect, test } from 'vitest';
// eslint-disable-next-line @nx/enforce-module-boundaries -- WP01 requires direct local imports until WP03 adds package exports.
import '../../../packages/elements/src/metric/sk-metric.js';
// eslint-disable-next-line @nx/enforce-module-boundaries -- WP01 requires direct local imports until WP03 adds package exports.
import skMetricSheet from '../../../packages/elements/src/metric/sk-metric.css.js';
// eslint-disable-next-line @nx/enforce-module-boundaries -- WP01 requires direct local imports until WP03 adds package exports.
import type { SkMetric } from '../../../packages/elements/src/metric/sk-metric.js';
import { installTokenSheet } from './token-sheet.js';

type Metric = SkMetric & { updateComplete: Promise<unknown> };

beforeEach(installTokenSheet);

const mount = async (
  attributes: Readonly<Record<string, string>> = {
    label: 'Completed items',
    'display-value': '128',
  },
): Promise<Metric> => {
  const element = document.createElement('sk-metric') as Metric;
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.append(element);
  await element.updateComplete;
  return element;
};

test('preserves every supplied display-value byte', async () => {
  const values = [
    '€1,840',
    '91%',
    '000000000000000000000000000000000000000000000000000001',
    'pending / unknown',
  ] as const;

  for (const displayValue of values) {
    const element = await mount({ label: '  Supplied label  ', 'display-value': displayValue });
    expect(element.shadowRoot!.querySelector('[part="label"]')?.textContent).toBe('  Supplied label  ');
    expect(element.shadowRoot!.querySelector('[part="value"]')?.textContent).toBe(displayValue);
  }

  const hierarchy = await mount({ label: 'Supplied label', 'display-value': values[2] });
  const labelStyle = getComputedStyle(hierarchy.shadowRoot!.querySelector('[part="label"]')!);
  const valueStyle = getComputedStyle(hierarchy.shadowRoot!.querySelector('[part="value"]')!);
  expect(labelStyle.textTransform).toBe('uppercase');
  expect(valueStyle.fontVariantNumeric).toContain('tabular-nums');
  expect(parseFloat(valueStyle.fontSize)).toBeGreaterThan(parseFloat(labelStyle.fontSize));
});

test('exposes one native definition relationship without a heading', async () => {
  const element = await mount();
  const root = element.shadowRoot!;
  const lists = root.querySelectorAll('dl');
  expect(lists).toHaveLength(1);
  expect(Array.from(lists[0]!.children).map((node) => node.localName)).toEqual(['dt', 'dd']);
  expect(lists[0]!.querySelectorAll(':scope > dt')).toHaveLength(1);
  expect(lists[0]!.querySelectorAll(':scope > dd')).toHaveLength(1);
  expect(root.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]')).toBe(null);
});

test('composes the existing pill tag and omits absent annotation chrome', async () => {
  const mappings = [
    ['neutral', null],
    ['info', 'purple'],
    ['success', 'green'],
    ['attention', 'yellow'],
  ] as const;
  const painted = new Set<string>();

  for (const [tone, variant] of mappings) {
    const element = await mount({
      label: 'Requests',
      'display-value': '42',
      annotation: 'Within range',
      tone,
    });
    const pill = element.shadowRoot!.querySelector('sk-pill-tag');
    expect(pill?.tagName).toBe('SK-PILL-TAG');
    expect(pill?.textContent).toBe('Within range');
    expect(pill?.getAttribute('variant')).toBe(variant);
    expect(element.getAttribute('tone')).toBe(tone);
    painted.add(getComputedStyle(element.shadowRoot!.querySelector('[part="metric"]')!).borderInlineStartColor);
  }
  expect(painted.size, 'each tone needs its own generic accent treatment').toBe(4);

  const withoutAnnotation = await mount({
    label: 'Requests',
    'display-value': '42',
    annotation: '',
  });
  expect(withoutAnnotation.shadowRoot!.querySelector('[part="annotation"]')).toBe(null);
  expect(withoutAnnotation.shadowRoot!.querySelector('sk-pill-tag')).toBe(null);
});

test('compact changes density without changing supplied content or semantics', async () => {
  const regular = await mount({
    label: 'Average latency',
    'display-value': '12.40 ms',
    annotation: 'Sampled',
  });
  const compact = await mount({
    label: 'Average latency',
    'display-value': '12.40 ms',
    annotation: 'Sampled',
    compact: '',
  });

  for (const element of [regular, compact]) {
    expect(element.shadowRoot!.querySelectorAll('dl')).toHaveLength(1);
    expect(element.shadowRoot!.querySelector('dt')?.textContent).toBe('Average latency');
    expect(element.shadowRoot!.querySelector('dd')?.textContent).toContain('12.40 ms');
    expect(element.shadowRoot!.querySelector('sk-pill-tag')?.textContent).toBe('Sampled');
  }
  expect(compact.compact).toBe(true);
  expect(compact.hasAttribute('compact')).toBe(true);
  expect(getComputedStyle(compact.shadowRoot!.querySelector('[part="metric"]')!).padding).not.toBe(
    getComputedStyle(regular.shadowRoot!.querySelector('[part="metric"]')!).padding,
  );
});

test('fails closed for invalid required content or tone', async () => {
  const invalid = [
    {},
    { label: '', 'display-value': '8' },
    { label: '   ', 'display-value': '8' },
    { label: 'Requests', 'display-value': '' },
    { label: 'Requests', 'display-value': '\t\n' },
    { label: 'Requests', 'display-value': '8', tone: 'urgent' },
  ] as const;

  for (const attributes of invalid) {
    const element = await mount(attributes);
    const root = element.shadowRoot!;
    expect(root.querySelector('[part="empty-state"]')?.textContent).toBe('Metric unavailable.');
    expect(root.querySelector('[part="metric"], [part="label"], [part="value"], [part="annotation"]')).toBe(
      null,
    );
    expect(root.querySelector('dl, dt, dd, sk-pill-tag')).toBe(null);
  }
});

test('observes all five public attributes with their documented defaults', async () => {
  const defaults = document.createElement('sk-metric') as Metric;
  document.body.append(defaults);
  await defaults.updateComplete;
  expect({
    label: defaults.label,
    displayValue: defaults.displayValue,
    annotation: defaults.annotation,
    tone: defaults.tone,
    compact: defaults.compact,
  }).toEqual({ label: '', displayValue: '', annotation: '', tone: 'neutral', compact: false });

  const element = await mount({
    label: 'Open items',
    'display-value': '7',
    annotation: 'Current',
    tone: 'success',
    compact: '',
  });
  expect({
    label: element.label,
    displayValue: element.displayValue,
    annotation: element.annotation,
    tone: element.tone,
    compact: element.compact,
  }).toEqual({
    label: 'Open items',
    displayValue: '7',
    annotation: 'Current',
    tone: 'success',
    compact: true,
  });
});

test('[SC-013] targets all five public parts and adopts only skMetricSheet', async () => {
  const valid = await mount({
    label: 'Open items',
    'display-value': '7',
    annotation: 'Current',
  });
  const invalid = await mount();
  invalid.removeAttribute('label');
  await invalid.updateComplete;

  const style = document.createElement('style');
  style.textContent = `
    sk-metric::part(metric) { outline-style: solid; }
    sk-metric::part(label) { outline-style: dotted; }
    sk-metric::part(value) { outline-style: dashed; }
    sk-metric::part(annotation) { outline-style: double; }
    sk-metric::part(empty-state) { outline-style: groove; }
  `;
  document.head.append(style);

  const targets = [
    [valid, 'metric', 'solid'],
    [valid, 'label', 'dotted'],
    [valid, 'value', 'dashed'],
    [valid, 'annotation', 'double'],
    [invalid, 'empty-state', 'groove'],
  ] as const;
  for (const [element, part, outline] of targets) {
    const node = element.shadowRoot!.querySelector<HTMLElement>(`[part="${part}"]`);
    expect(node, `part="${part}" must be rendered`).not.toBe(null);
    expect(getComputedStyle(node!).outlineStyle, `part="${part}" must be externally targetable`).toBe(
      outline,
    );
  }
  expect(targets).toHaveLength(5);
  for (const element of [valid, invalid]) {
    expect(element.shadowRoot!.adoptedStyleSheets).toEqual([skMetricSheet]);
    expect(element.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
  }
});
