import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import { skSectionHeaderSheet } from '@spec-kitty/elements';
import { assertThemesDiffered, contrast } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async (content = `
  <span slot="eyebrow">In flight</span>
  <h3 slot="title">Recent activity</h3>
  <p slot="description">What needs attention now.</p>
  <span slot="metadata">12 items</span>
  <button slot="action">View all</button>
`, container: HTMLElement = document.body) => {
  const element = document.createElement('sk-section-header');
  element.innerHTML = content;
  container.append(element);
  await (element as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return element;
};

const partOf = (element: Element, name: string) =>
  element.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

test('the five consumer channels reach their named slots without inventing content', async () => {
  const element = await mount();
  const expected = new Map([
    ['eyebrow', 'In flight'],
    ['title', 'Recent activity'],
    ['description', 'What needs attention now.'],
    ['metadata', '12 items'],
    ['action', 'View all'],
  ]);

  for (const [name, text] of expected) {
    const slot = element.shadowRoot!.querySelector(`slot[name="${name}"]`) as HTMLSlotElement;
    expect(slot, `${name} must have a named slot`).not.toBe(null);
    expect(slot.assignedNodes({ flatten: true }).map((node) => node.textContent).join('').trim()).toBe(text);
  }
  expect(expected.size, 'the slot table went empty').toBe(5);
  expect(element.shadowRoot!.textContent!.trim(), 'the component must not invent copy').toBe('');
});

test('the consumer heading owns its level and the component creates no heading or banner semantics', async () => {
  const element = await mount('<h4 slot="title">Delivery return</h4>');
  const heading = element.querySelector('h4');
  const titleSlot = element.shadowRoot!.querySelector('slot[name="title"]') as HTMLSlotElement;

  expect(heading?.tagName).toBe('H4');
  expect(titleSlot.assignedElements()).toEqual([heading]);
  expect(element.shadowRoot!.querySelector('h1,h2,h3,h4,h5,h6')).toBe(null);
  expect(element.shadowRoot!.querySelector('[role="heading"]')).toBe(null);
  expect(element.shadowRoot!.querySelector('header,[role="banner"]')).toBe(null);
  expect(partOf(element, 'title')?.getAttribute('role')).toBe(null);
});

test('empty optional regions collapse and respond to consumer projection changes', async () => {
  const element = await mount('<h2 slot="title">Flow health</h2>');
  for (const name of ['eyebrow', 'description', 'metadata', 'action']) {
    expect(partOf(element, name)?.hidden, `${name} should collapse while empty`).toBe(true);
  }
  expect(partOf(element, 'title')?.hidden).toBe(false);

  const metadata = document.createElement('span');
  metadata.slot = 'metadata';
  metadata.textContent = '62 moves';
  element.append(metadata);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(partOf(element, 'metadata')?.hidden).toBe(false);

  metadata.remove();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(partOf(element, 'metadata')?.hidden).toBe(true);
});

test('identical consumer content resolves distinct dark/light surfaces with AA text contrast', async () => {
  const content = `
    <span slot="eyebrow">In flight</span>
    <h3 slot="title">Recent activity</h3>
    <p slot="description">What needs attention now.</p>
    <span slot="metadata">12 items</span>
    <span slot="action">View all</span>
  `;
  const surfaces = new Map<string, string>();
  const projectedText: string[] = [];

  for (const theme of ['dark', 'light'] as const) {
    const wrapper = document.createElement('div');
    if (theme === 'light') wrapper.className = 'sk-light';
    wrapper.style.background = 'var(--sk-surface-page)';
    document.body.append(wrapper);
    const element = await mount(content, wrapper);
    const surface = getComputedStyle(wrapper).backgroundColor;
    surfaces.set(theme, surface);
    projectedText.push(element.textContent!.replace(/\s+/g, ' ').trim());

    for (const slot of ['eyebrow', 'title', 'description', 'metadata', 'action'] as const) {
      const node = element.querySelector<HTMLElement>(`[slot="${slot}"]`)!;
      const foreground = getComputedStyle(node).color;
      const ratio = contrast(foreground, surface);
      expect(ratio, `${slot} text in ${theme} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  }

  expect(projectedText).toEqual([projectedText[0], projectedText[0]]);
  assertThemesDiffered(surfaces);
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const element = await mount();
  const cases: readonly (readonly [string, string])[] = [
    ['header', 'sk-section-header::part(header) { outline-style: dashed; }'],
    ['eyebrow', 'sk-section-header::part(eyebrow) { outline-style: dashed; }'],
    ['title', 'sk-section-header::part(title) { outline-style: dashed; }'],
    ['description', 'sk-section-header::part(description) { outline-style: dashed; }'],
    ['metadata', 'sk-section-header::part(metadata) { outline-style: dashed; }'],
    ['action', 'sk-section-header::part(action) { outline-style: dashed; }'],
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
  expect(cases.length, 'the part table went empty').toBe(6);
});

test('[SC-014] the element adopts the generated sheet by identity and injects no style tag', async () => {
  const element = await mount();
  const root = element.shadowRoot!;
  expect(root.adoptedStyleSheets).toHaveLength(1);
  expect(root.adoptedStyleSheets[0]).toBe(skSectionHeaderSheet);
  expect(root.querySelectorAll('style')).toHaveLength(0);
});
