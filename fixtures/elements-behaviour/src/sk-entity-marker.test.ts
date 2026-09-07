/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
import { beforeEach, expect, test } from 'vitest';
import '../../../packages/elements/src/entity-marker/sk-entity-marker.js';
import skEntityMarkerSheet from '../../../packages/elements/src/entity-marker/sk-entity-marker.css.js';
import { assertThemesDiffered, contrast } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async (label?: string, mark = 'SK') => {
  const element = document.createElement('sk-entity-marker') as HTMLElement & { label?: string; updateComplete: Promise<unknown> };
  if (label !== undefined) element.label = label;
  const supplied = document.createElement('span');
  supplied.dataset['consumerMark'] = 'true';
  supplied.textContent = mark;
  element.append(supplied);
  document.body.append(element);
  await element.updateComplete;
  return { element, supplied };
};

const partOf = (element: Element, name: string) =>
  element.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

test('a trimmed non-empty label exposes the supplied accessible name and exact mark', async () => {
  const { element, supplied } = await mount('  Spec Kitty  ', 'SP');
  const marker = partOf(element, 'marker')!;
  const slot = partOf(element, 'content')!.querySelector('slot') as HTMLSlotElement;
  expect(marker.getAttribute('role')).toBe('img');
  expect(marker.getAttribute('aria-label')).toBe('Spec Kitty');
  expect(marker.hasAttribute('aria-hidden')).toBe(false);
  expect(slot.assignedElements()).toEqual([supplied]);
  expect(supplied.textContent).toBe('SP');
});

test.each([undefined, '', '   '])('an absent or blank label makes the mark decorative (%s)', async (label) => {
  const { element } = await mount(label, '◇');
  const marker = partOf(element, 'marker')!;
  expect(marker.getAttribute('aria-hidden')).toBe('true');
  expect(marker.hasAttribute('role')).toBe(false);
  expect(marker.hasAttribute('aria-label')).toBe(false);
});

test('[SC-010] a label property assigned before definition survives upgrade and remains reactive', async () => {
  const element = document.createElement('sk-entity-marker-late') as HTMLElement & { label?: string; updateComplete: Promise<unknown> };
  element.label = 'Mission marker';
  element.textContent = 'M';
  document.body.append(element);
  const { SkEntityMarker } = await import('@spec-kitty/elements');
  customElements.define('sk-entity-marker-late', class extends SkEntityMarker {});
  await customElements.whenDefined('sk-entity-marker-late');
  await element.updateComplete;

  expect(element.label).toBe('Mission marker');
  expect(element.getAttribute('label')).toBe('Mission marker');
  expect(partOf(element, 'marker')?.getAttribute('aria-label')).toBe('Mission marker');
  element.label = '   ';
  await element.updateComplete;
  expect(partOf(element, 'marker')?.getAttribute('aria-hidden')).toBe('true');
});

test('the mark remains readable in both themes', async () => {
  const surfaces = new Map<string, string>();
  for (const theme of ['dark', 'light'] as const) {
    const wrapper = document.createElement('div');
    if (theme === 'light') wrapper.className = 'sk-light';
    wrapper.style.background = 'var(--sk-surface-page)';
    document.body.append(wrapper);
    const { element } = await mount('Spec Kitty', 'SK');
    wrapper.append(element);
    await element.updateComplete;
    const marker = partOf(element, 'marker')!;
    const foreground = getComputedStyle(partOf(element, 'content')!).color;
    const background = getComputedStyle(marker).backgroundColor;
    surfaces.set(theme, background);
    expect(contrast(foreground, background), `marker text in ${theme}`).toBeGreaterThanOrEqual(4.5);
  }
  assertThemesDiffered(surfaces);
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const { element } = await mount('Spec Kitty');
  const cases: readonly (readonly [string, string])[] = [
    ['marker', 'sk-entity-marker::part(marker) { outline-style: dashed; }'],
    ['content', 'sk-entity-marker::part(content) { outline-style: dashed; }'],
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
  expect(cases).toHaveLength(2);
});

test('[SC-014] the element adopts the generated sheet by identity and injects no style tag', async () => {
  const { element } = await mount();
  const root = element.shadowRoot!;
  expect(root.adoptedStyleSheets).toHaveLength(1);
  expect(root.adoptedStyleSheets[0]).toBe(skEntityMarkerSheet);
  expect(root.querySelectorAll('style')).toHaveLength(0);
});
