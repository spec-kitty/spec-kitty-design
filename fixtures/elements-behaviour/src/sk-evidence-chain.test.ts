import { beforeEach, expect, test } from 'vitest';
// eslint-disable-next-line @nx/enforce-module-boundaries -- WP03 owns public entries; this WP tests the unregistered element directly
import {
  SkEvidenceChain,
  type EvidenceStage,
} from '../../../packages/elements/src/evidence-chain/sk-evidence-chain.js';
// eslint-disable-next-line @nx/enforce-module-boundaries -- WP03 owns public entries; this WP verifies the generated local sheet directly
import skEvidenceChainSheet from '../../../packages/elements/src/evidence-chain/sk-evidence-chain.css.js';
// eslint-disable-next-line @nx/enforce-module-boundaries -- authored CSS is the forced-colors contract
import evidenceChainCss from '../../../packages/styles/src/evidence-chain/sk-evidence-chain.css?raw';
// eslint-disable-next-line @nx/enforce-module-boundaries -- WP03 owns public entries; this WP verifies direct metric composition
import type { SkMetric } from '../../../packages/elements/src/metric/sk-metric.js';
import { installTokenSheet } from './token-sheet.js';

type Chain = SkEvidenceChain & { updateComplete: Promise<unknown> };
type Metric = SkMetric & { updateComplete: Promise<unknown> };

const twoStages = Object.freeze([
  Object.freeze({ id: 'received', label: 'Items received', displayValue: '2' }),
  Object.freeze({
    id: 'reviewed',
    label: 'Items reviewed',
    displayValue: '91%',
    annotation: 'Sampled',
    tone: 'info',
  }),
] satisfies ReadonlyArray<EvidenceStage>);

const fourStages = Object.freeze([
  Object.freeze({ id: 'alpha', label: 'Supplied alpha', displayValue: '€1,840' }),
  Object.freeze({
    id: 'beta',
    label: 'Supplied beta',
    displayValue: '91%',
    annotation: 'Source B',
    tone: 'success',
  }),
  Object.freeze({
    id: 'gamma',
    label: 'Supplied gamma',
    displayValue: '000000000000000000000000000000000000000001',
    tone: 'attention',
  }),
  Object.freeze({
    id: 'delta',
    label: 'Supplied delta',
    displayValue: 'pending / unknown',
    annotation: 'Source D',
    tone: 'neutral',
  }),
] satisfies ReadonlyArray<EvidenceStage>);

const sixStages = Object.freeze([
  ...fourStages,
  Object.freeze({
    id: 'epsilon',
    label: 'Supplied epsilon',
    displayValue: '5',
    annotation: 'Source E',
    tone: 'info',
  }),
  Object.freeze({ id: 'zeta', label: 'Supplied zeta', displayValue: '6' }),
] satisfies ReadonlyArray<EvidenceStage>);

const stageSets: ReadonlyArray<ReadonlyArray<EvidenceStage>> = [twoStages, fourStages, sixStages];

beforeEach(installTokenSheet);

const mount = async (stages: unknown = fourStages): Promise<Chain> => {
  const element = document.createElement('sk-evidence-chain') as Chain;
  element.stages = stages as Chain['stages'];
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const directItems = (element: Chain): HTMLElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('ol > li'));

const metrics = async (element: Chain): Promise<Metric[]> => {
  const found = Array.from(element.shadowRoot!.querySelectorAll<Metric>('sk-metric'));
  await Promise.all(found.map((metric) => metric.updateComplete));
  return found;
};

test('preserves supplied order and same-id node identity without caller mutation', async () => {
  const originalArray = fourStages;
  const originalRecords = [...fourStages];
  const originalBytes = JSON.stringify(fourStages);
  const element = await mount(fourStages);
  expect(element.stages).toBe(originalArray);

  const initialItems = directItems(element);
  const initialById = new Map(
    fourStages.map((stage, index) => [stage.id, initialItems[index]!] as const),
  );
  expect((await metrics(element)).map((metric) => metric.label)).toEqual(
    fourStages.map((stage) => stage.label),
  );
  expect(JSON.stringify(fourStages)).toBe(originalBytes);
  expect(fourStages.every((stage, index) => stage === originalRecords[index])).toBe(true);

  const replacement = Object.freeze([
    Object.freeze({ ...fourStages[2], label: 'Gamma updated', displayValue: 'G-2' }),
    Object.freeze({ ...fourStages[0], label: 'Alpha updated', displayValue: 'A-2' }),
    Object.freeze({ ...fourStages[3], label: 'Delta updated', displayValue: 'D-2' }),
    Object.freeze({ ...fourStages[1], label: 'Beta updated', displayValue: 'B-2' }),
  ] satisfies ReadonlyArray<EvidenceStage>);
  const replacementBytes = JSON.stringify(replacement);
  element.stages = replacement;
  await element.updateComplete;

  const movedItems = directItems(element);
  expect(element.stages).toBe(replacement);
  expect((await metrics(element)).map((metric) => metric.label)).toEqual(
    replacement.map((stage) => stage.label),
  );
  expect((await metrics(element)).map((metric) => metric.displayValue)).toEqual(
    replacement.map((stage) => stage.displayValue),
  );
  replacement.forEach((stage, index) => expect(movedItems[index]).toBe(initialById.get(stage.id)));
  expect(JSON.stringify(originalArray)).toBe(originalBytes);
  expect(JSON.stringify(replacement)).toBe(replacementBytes);
  expect(fourStages.every((stage, index) => stage === originalRecords[index])).toBe(true);
});

test('composes one metric per stage with exactly n-minus-one connectors', async () => {
  for (const stages of stageSets) {
    const element = await mount(stages);
    const items = directItems(element);
    const composed = await metrics(element);
    const connectors = element.shadowRoot!.querySelectorAll('[part="connector"]');

    expect(items).toHaveLength(stages.length);
    expect(composed).toHaveLength(stages.length);
    expect(connectors).toHaveLength(stages.length - 1);
    items.forEach((item, index) => {
      const metric = item.querySelector<Metric>(':scope > sk-metric');
      expect(metric?.tagName).toBe('SK-METRIC');
      expect(item.querySelectorAll(':scope > sk-metric')).toHaveLength(1);
      expect(metric?.label).toBe(stages[index]!.label);
      expect(metric?.displayValue).toBe(stages[index]!.displayValue);
      expect(metric?.annotation).toBe(stages[index]!.annotation ?? '');
      expect(metric?.tone).toBe(stages[index]!.tone ?? 'neutral');
      expect(item.querySelectorAll(':scope > [part="connector"]')).toHaveLength(
        index === stages.length - 1 ? 0 : 1,
      );
    });
  }
});

test('accepts absent optional fields and fails closed only for invalid whole input', async () => {
  const absent = twoStages[0]!;
  const absentKeys = Object.keys(absent);
  const valid = await mount(twoStages);
  const firstMetric = (await metrics(valid))[0]!;
  expect(firstMetric.label).toBe(absent.label);
  expect(firstMetric.displayValue).toBe(absent.displayValue);
  expect(firstMetric.tone).toBe('neutral');
  expect(firstMetric.annotation).toBe('');
  expect(firstMetric.shadowRoot!.querySelector('[part="annotation"]')).toBe(null);
  expect(Object.keys(absent)).toEqual(absentKeys);
  expect('tone' in absent).toBe(false);
  expect('annotation' in absent).toBe(false);

  const invalidInputs: readonly unknown[] = [
    Object.freeze([]),
    'not-an-array',
    Object.freeze([null]),
    Object.freeze([Object.freeze({ id: 'missing-fields' })]),
    Object.freeze([Object.freeze({ id: ' ', label: 'Blank id', displayValue: '1' })]),
    Object.freeze([
      Object.freeze({ id: 'same', label: 'First', displayValue: '1' }),
      Object.freeze({ id: 'same', label: 'Second', displayValue: '2' }),
    ]),
    Object.freeze([Object.freeze({ id: 'bad-label', label: 4, displayValue: '1' })]),
    Object.freeze([Object.freeze({ id: 'bad-value', label: 'Bad value', displayValue: false })]),
    Object.freeze([
      twoStages[0],
      Object.freeze({ id: 'bad-second', label: 'Bad second stage', displayValue: null }),
    ]),
    Object.freeze([
      Object.freeze({
        id: 'bad-annotation',
        label: 'Bad annotation',
        displayValue: '1',
        annotation: 4,
      }),
    ]),
    Object.freeze([
      Object.freeze({ id: 'bad-tone', label: 'Bad tone', displayValue: '1', tone: 'urgent' }),
    ]),
  ];
  for (const input of invalidInputs) {
    const element = await mount(input);
    const root = element.shadowRoot!;
    expect(root.querySelector('[part="empty-state"]')?.textContent).toBe('No evidence available.');
    expect(root.querySelector('ol, li, sk-metric, [part="connector"]')).toBe(null);
  }
  expect(invalidInputs.length, 'the invalid-input table must not become vacuous').toBe(11);
});

test('exposes one same-root ordered list with decorative connectors', async () => {
  const element = await mount(fourStages);
  const root = element.shadowRoot!;
  const lists = root.querySelectorAll('ol');
  expect(lists).toHaveLength(1);
  expect(Array.from(lists[0]!.children).map((child) => child.tagName)).toEqual([
    'LI',
    'LI',
    'LI',
    'LI',
  ]);
  expect(lists[0]!.querySelectorAll('li')).toHaveLength(fourStages.length);
  const connectors = Array.from(root.querySelectorAll<HTMLElement>('[part="connector"]'));
  expect(connectors).toHaveLength(fourStages.length - 1);
  for (const connector of connectors) {
    expect(connector.getAttribute('aria-hidden')).toBe('true');
    expect(connector.textContent).toBe('');
    expect(connector.hasAttribute('aria-label')).toBe(false);
    expect(connector.getAttribute('role')).toBe(null);
  }
  expect(root.querySelector('h1, h2, h3, h4, h5, h6, [role="list"], [role="listitem"]')).toBe(
    null,
  );
});

test('ships a scoped forced-colors connector distinction without forced-color-adjust none', () => {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(evidenceChainCss);
  const forcedMedia = Array.from(sheet.cssRules).filter(
    (rule): rule is CSSMediaRule =>
      rule instanceof CSSMediaRule &&
      rule.conditionText.replace(/\s+/g, '') === '(forced-colors:active)',
  );
  expect(forcedMedia).toHaveLength(1);
  const connectorRules = Array.from(forcedMedia[0]!.cssRules).filter(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule && rule.selectorText === '.sk-evidence-chain__connector::before',
  );
  expect(connectorRules).toHaveLength(1);
  expect(connectorRules[0]!.style.getPropertyValue('border-block-start-color').toLowerCase()).toBe(
    'canvastext',
  );
  expect(connectorRules[0]!.style.getPropertyValue('border-inline-start-color').toLowerCase()).toBe(
    'canvastext',
  );
  const stageRules = Array.from(forcedMedia[0]!.cssRules).filter(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule && rule.selectorText === '.sk-evidence-chain__stage',
  );
  expect(stageRules).toHaveLength(1);
  expect(stageRules[0]!.style.getPropertyValue('border-inline-start-color').toLowerCase()).toBe(
    'canvastext',
  );
  expect(evidenceChainCss).not.toMatch(/forced-color-adjust\s*:\s*none/i);
});

test('declares wide flow and preserves DOM order in the live narrow flow', async () => {
  const baseListRule = Array.from(skEvidenceChainSheet.cssRules).find(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule && rule.selectorText === '.sk-evidence-chain__list',
  );
  const narrowMedia = Array.from(skEvidenceChainSheet.cssRules).find(
    (rule): rule is CSSMediaRule =>
      rule instanceof CSSMediaRule &&
      rule.conditionText.replace(/\s+/g, '') === '(max-width:720px)',
  );
  const narrowListRule = narrowMedia && Array.from(narrowMedia.cssRules).find(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule && rule.selectorText === '.sk-evidence-chain__list',
  );
  expect(baseListRule?.style.flexDirection).toBe('row');
  expect(narrowListRule?.style.flexDirection).toBe('column');
  expect(window.matchMedia('(max-width: 720px)').matches, 'the browser lane is not narrow').toBe(true);

  const element = await mount(sixStages);
  expect(getComputedStyle(element.shadowRoot!.querySelector('[part="list"]')!).flexDirection).toBe(
    'column',
  );
  expect((await metrics(element)).map((metric) => metric.label)).toEqual(
    sixStages.map((stage) => stage.label),
  );
});

test('uses token-driven connector contrast in equivalent dark and light chains', async () => {
  const dark = await mount(fourStages);
  const darkConnector = dark.shadowRoot!.querySelector<HTMLElement>('[part="connector"]')!;
  const darkColor = getComputedStyle(darkConnector, '::before').borderBlockStartColor;

  const lightWrapper = document.createElement('div');
  lightWrapper.className = 'sk-light';
  const light = document.createElement('sk-evidence-chain') as Chain;
  light.stages = fourStages;
  lightWrapper.append(light);
  document.body.append(lightWrapper);
  await light.updateComplete;
  const lightConnector = light.shadowRoot!.querySelector<HTMLElement>('[part="connector"]')!;
  const lightColor = getComputedStyle(lightConnector, '::before').borderBlockStartColor;

  expect(darkColor).not.toBe('');
  expect(lightColor).not.toBe('');
  expect(lightColor).not.toBe(darkColor);
  expect((await metrics(dark)).map((metric) => metric.label)).toEqual(
    (await metrics(light)).map((metric) => metric.label),
  );
  expect(directItems(dark).map((item) => item.tagName)).toEqual(
    directItems(light).map((item) => item.tagName),
  );
});

test('stages is property-only with a frozen empty default', async () => {
  const element = document.createElement('sk-evidence-chain') as Chain;
  document.body.append(element);
  await element.updateComplete;
  expect(Object.keys(SkEvidenceChain.properties)).toEqual(['stages']);
  expect(SkEvidenceChain.properties.stages.attribute).toBe(false);
  expect(element.stages).toEqual([]);
  expect(Object.isFrozen(element.stages)).toBe(true);
  expect(element.hasAttribute('stages')).toBe(false);
});

test('[SC-013] targets all four public parts and adopts only skEvidenceChainSheet', async () => {
  const valid = await mount(twoStages);
  const invalid = await mount([]);
  const style = document.createElement('style');
  style.textContent = `
    sk-evidence-chain::part(list) { outline-style: solid; }
    sk-evidence-chain::part(stage) { outline-style: dotted; }
    sk-evidence-chain::part(connector) { outline-style: dashed; }
    sk-evidence-chain::part(empty-state) { outline-style: double; }
  `;
  document.head.append(style);

  const targets = [
    [valid, 'list', 'solid'],
    [valid, 'stage', 'dotted'],
    [valid, 'connector', 'dashed'],
    [invalid, 'empty-state', 'double'],
  ] as const;
  for (const [element, part, outline] of targets) {
    const node = element.shadowRoot!.querySelector<HTMLElement>(`[part="${part}"]`);
    expect(node, `part="${part}" must be rendered`).not.toBe(null);
    expect(getComputedStyle(node!).outlineStyle, `part="${part}" must be externally targetable`).toBe(
      outline,
    );
  }
  expect(targets).toHaveLength(4);
  for (const element of [valid, invalid]) {
    expect(element.shadowRoot!.adoptedStyleSheets).toEqual([skEvidenceChainSheet]);
    expect(element.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
  }
});
