/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
import { beforeEach, expect, test, vi } from 'vitest';
import skStatusIndicatorSheet from '../../../packages/elements/src/status-indicator/sk-status-indicator.css.js';
import { SkStatusIndicator } from '../../../packages/elements/src/status-indicator/sk-status-indicator.js';
import statusIndicatorCss from '../../../packages/styles/src/status-indicator/sk-status-indicator.css?raw';
import statusIndicatorSource from '../../../packages/elements/src/status-indicator/sk-status-indicator.ts?raw';
import { assertThemesDiffered, contrast } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const tones = ['neutral', 'info', 'success', 'attention', 'danger', 'recovery'] as const;

type StatusIndicator = HTMLElement & {
  tone?: string;
  pulsing: boolean;
  updateComplete: Promise<unknown>;
};

const mount = async (tone?: string, text = 'Evidence pending', pulsing = false, withMarker = true) => {
  const element = document.createElement('sk-status-indicator') as StatusIndicator;
  if (tone !== undefined) element.tone = tone;
  element.pulsing = pulsing;
  if (withMarker) {
    const marker = document.createElement('span');
    marker.slot = 'marker';
    marker.textContent = '●';
    element.append(marker);
  }
  element.append(text);
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const partOf = (element: Element, name: string) =>
  element.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

const authoredStatusSheet = new CSSStyleSheet();
authoredStatusSheet.replaceSync(statusIndicatorCss);

const mediaRuleFor = (query: string): CSSMediaRule | undefined =>
  Array.from(authoredStatusSheet.cssRules).find(
    (rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.media.mediaText === query,
  );

const styleRuleFor = (rules: CSSRuleList | readonly CSSRule[], selector: string): CSSStyleRule | undefined =>
  Array.from(rules).find(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === selector,
  );

test('the exact six consumer tones render without replacing visible status text', async () => {
  for (const tone of tones) {
    const element = await mount(tone, `Consumer ${tone} status`);
    expect(partOf(element, 'status')?.dataset['tone']).toBe(tone);
    const textSlot = partOf(element, 'text')!.querySelector('slot') as HTMLSlotElement;
    expect(textSlot.assignedNodes().map((node) => node.textContent).join('').trim()).toBe(`Consumer ${tone} status`);
  }
  expect(tones).toHaveLength(6);
});

test('an unknown tone warns and degrades to neutral without losing content', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const element = await mount('blocked', 'Awaiting evidence');
    expect(partOf(element, 'status')?.dataset['tone']).toBe('neutral');
    expect(partOf(element, 'text')?.textContent).toBe('');
    const slot = partOf(element, 'text')!.querySelector('slot') as HTMLSlotElement;
    expect(slot.assignedNodes().map((node) => node.textContent).join('').trim()).toBe('Awaiting evidence');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown status-indicator tone'));
  } finally {
    warn.mockRestore();
  }
});

test('the marker is decorative while visible text carries meaning', async () => {
  const element = await mount('danger', 'Deployment blocked');
  expect(partOf(element, 'marker')?.getAttribute('aria-hidden')).toBe('true');
  expect(partOf(element, 'text')?.hasAttribute('aria-hidden')).toBe(false);
  expect(element.textContent).toContain('Deployment blocked');
});

test('pulsing defaults false and absent without changing the established static presentation', async () => {
  const element = await mount('neutral', 'Awaiting evidence');
  expect(element.pulsing).toBe(false);
  expect(element.hasAttribute('pulsing')).toBe(false);
  expect(partOf(element, 'status')?.classList.contains('sk-status-indicator--pulsing')).toBe(false);
  expect(getComputedStyle(partOf(element, 'marker')!).animationName).toBe('none');
});

test('pulsing affects only an assigned marker and never creates marker content or changes text and tone', async () => {
  const active = await mount('success', 'Live claim supplied by consumer', true);
  const marker = partOf(active, 'marker')!;
  const text = partOf(active, 'text')!;
  expect(partOf(active, 'status')?.classList.contains('sk-status-indicator--pulsing')).toBe(true);
  expect(marker.hidden).toBe(false);
  expect(getComputedStyle(marker).animationName).toBe('sk-status-indicator-pulse');
  expect(getComputedStyle(text).animationName).toBe('none');
  expect(partOf(active, 'status')?.dataset['tone']).toBe('success');
  expect(active.textContent).toContain('Live claim supplied by consumer');

  const empty = await mount('danger', 'Still visible', true, false);
  const emptyMarker = partOf(empty, 'marker')!;
  expect(emptyMarker.hidden).toBe(true);
  expect((emptyMarker.querySelector('slot') as HTMLSlotElement).assignedNodes()).toHaveLength(0);
  expect(empty.textContent).toContain('Still visible');

  for (const forbidden of ['setInterval', 'setTimeout', 'requestAnimationFrame', 'subscribe']) {
    expect(statusIndicatorSource).not.toContain(forbidden);
  }
});

test('marker presence follows assignment, removal, and reassignment without synthesizing a dot', async () => {
  const element = await mount('info', 'Measured activity', true, false);
  const markerPart = partOf(element, 'marker')!;
  const slot = markerPart.querySelector('slot[name="marker"]') as HTMLSlotElement;
  expect(markerPart.hidden).toBe(true);

  const marker = document.createElement('span');
  marker.slot = 'marker';
  marker.textContent = '●';
  let changed = new Promise((resolve) => slot.addEventListener('slotchange', resolve, { once: true }));
  element.append(marker);
  await changed;
  expect(markerPart.hidden).toBe(false);
  expect(slot.assignedElements()).toEqual([marker]);

  changed = new Promise((resolve) => slot.addEventListener('slotchange', resolve, { once: true }));
  marker.remove();
  await changed;
  expect(markerPart.hidden).toBe(true);

  changed = new Promise((resolve) => slot.addEventListener('slotchange', resolve, { once: true }));
  element.append(marker);
  await changed;
  expect(partOf(element, 'marker')).toBe(markerPart);
  expect(markerPart.hidden).toBe(false);
});

test('several hosts keep independent pulse state across every existing tone', async () => {
  const elements = await Promise.all(tones.map((tone, index) => mount(tone, `${tone} status`, index % 2 === 0)));
  for (const [index, element] of elements.entries()) {
    expect(element.pulsing).toBe(index % 2 === 0);
    expect(partOf(element, 'status')?.dataset['tone']).toBe(element.tone);
    expect(element.textContent).toContain(`${element.tone} status`);
  }
  elements[1]!.pulsing = true;
  await elements[1]!.updateComplete;
  elements[0]!.pulsing = false;
  await elements[0]!.updateComplete;
  expect(elements[0]!.pulsing).toBe(false);
  expect(elements[1]!.pulsing).toBe(true);
  expect(elements[2]!.pulsing).toBe(true);
});

test('authored pulse CSS has marker-only animation and differential reduced-motion and forced-colors fallbacks', () => {
  const pulse = styleRuleFor(authoredStatusSheet.cssRules, '.sk-status-indicator--pulsing .sk-status-indicator__marker')!;
  expect(pulse).not.toBeUndefined();
  expect(pulse.style.animationName).toBe('sk-status-indicator-pulse');
  expect(styleRuleFor(authoredStatusSheet.cssRules, '.sk-status-indicator--pulsing .sk-status-indicator__text')).toBeUndefined();

  const reduced = mediaRuleFor('(prefers-reduced-motion: reduce)')!;
  const reducedPulse = styleRuleFor(reduced.cssRules, '.sk-status-indicator--pulsing .sk-status-indicator__marker')!;
  expect(reducedPulse.style.animationName).toBe('none');
  expect(reducedPulse.style.outlineWidth).toBe('var(--sk-border-width-2)');
  expect(reducedPulse.style.outlineStyle).toBe('solid');

  const forced = mediaRuleFor('(forced-colors: active)')!;
  const forcedMarker = styleRuleFor(forced.cssRules, '.sk-status-indicator__marker')!;
  const forcedPulse = styleRuleFor(forced.cssRules, '.sk-status-indicator--pulsing .sk-status-indicator__marker')!;
  expect(forcedMarker.style.outlineStyle).toBe('solid');
  expect(forcedMarker.style.outlineWidth).toBe('var(--sk-border-width-1)');
  expect(forcedPulse.style.outlineStyle).toBe('double');
  expect(forcedPulse.style.outlineWidth).toBe('var(--sk-border-width-2)');
  expect(forcedPulse.style.outlineStyle).not.toBe(forcedMarker.style.outlineStyle);
  expect(
    Array.from(forced.cssRules).some(
      (rule) => rule instanceof CSSStyleRule && rule.style.forcedColorAdjust === 'none',
    ),
  ).toBe(false);
});

test('status text meets AA and recovery stays distinct from info and danger in both themes', async () => {
  const surfaces = new Map<string, string>();
  for (const theme of ['dark', 'light'] as const) {
    const wrapper = document.createElement('div');
    if (theme === 'light') wrapper.className = 'sk-light';
    wrapper.style.background = 'var(--sk-surface-page)';
    document.body.append(wrapper);

    const colors = new Map<string, string>();
    for (const tone of ['info', 'danger', 'recovery'] as const) {
      const element = await mount(tone, `${tone} status`);
      wrapper.append(element);
      await element.updateComplete;
      colors.set(tone, getComputedStyle(partOf(element, 'marker')!).color);
      const foreground = getComputedStyle(partOf(element, 'text')!).color;
      const background = getComputedStyle(wrapper).backgroundColor;
      expect(contrast(foreground, background), `${tone} text in ${theme}`).toBeGreaterThanOrEqual(4.5);
      surfaces.set(theme, background);
    }
    expect(new Set(colors.values()).size, `${theme} semantic marker colors`).toBe(3);
  }
  assertThemesDiffered(surfaces);
});

test('[SC-010] tone and pulsing assigned before definition survive upgrade, reflect, and remain reactive', async () => {
  const element = document.createElement('sk-status-indicator-late') as StatusIndicator;
  element.tone = 'info';
  element.pulsing = true;
  element.textContent = 'Measuring';
  document.body.append(element);
  const { SkStatusIndicator } = await import('../../../packages/elements/src/status-indicator/sk-status-indicator.js');
  customElements.define('sk-status-indicator-late', class extends SkStatusIndicator {});
  await customElements.whenDefined('sk-status-indicator-late');
  await element.updateComplete;

  expect(element.tone).toBe('info');
  expect(element.getAttribute('tone')).toBe('info');
  expect(element.pulsing).toBe(true);
  expect(element.hasAttribute('pulsing')).toBe(true);
  expect(partOf(element, 'status')?.dataset['tone']).toBe('info');
  expect(partOf(element, 'status')?.classList.contains('sk-status-indicator--pulsing')).toBe(true);
  element.tone = 'recovery';
  element.pulsing = false;
  await element.updateComplete;
  expect(element.getAttribute('tone')).toBe('recovery');
  expect(element.hasAttribute('pulsing')).toBe(false);
  expect(partOf(element, 'status')?.dataset['tone']).toBe('recovery');
  expect(partOf(element, 'status')?.classList.contains('sk-status-indicator--pulsing')).toBe(false);

  element.setAttribute('pulsing', '');
  await element.updateComplete;
  expect(element.pulsing).toBe(true);
  element.removeAttribute('pulsing');
  await element.updateComplete;
  expect(element.pulsing).toBe(false);
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const element = await mount('success');
  const cases: readonly (readonly [string, string])[] = [
    ['status', 'sk-status-indicator::part(status) { outline-style: dashed; }'],
    ['marker', 'sk-status-indicator::part(marker) { outline-style: dashed; }'],
    ['text', 'sk-status-indicator::part(text) { outline-style: dashed; }'],
  ];
  for (const [name, rule] of cases) {
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.append(style);
    try {
      const part = partOf(element, name);
      expect(part, `part="${name}" is declared but not rendered`).not.toBe(null);
      expect(getComputedStyle(part!).outlineStyle, `part="${name}" is not targetable`).toBe('dashed');
    } finally {
      style.remove();
    }
  }
  expect(cases).toHaveLength(3);
});

test('[SC-014] the element adopts the generated sheet by identity and injects no style tag', async () => {
  const element = await mount();
  const root = element.shadowRoot!;
  expect(root.adoptedStyleSheets).toHaveLength(1);
  expect(root.adoptedStyleSheets[0]).toBe(skStatusIndicatorSheet);
  expect(root.querySelectorAll('style')).toHaveLength(0);
});

test('the public attributes add only pulsing to the established tone axis', () => {
  expect([...SkStatusIndicator.observedAttributes].sort()).toEqual(['pulsing', 'tone']);
});
