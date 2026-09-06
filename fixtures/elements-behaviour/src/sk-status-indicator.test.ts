import { beforeEach, expect, test, vi } from 'vitest';
import '@spec-kitty/elements';
import { skStatusIndicatorSheet } from '@spec-kitty/elements';
import { assertThemesDiffered, contrast } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const tones = ['neutral', 'info', 'success', 'attention', 'danger', 'recovery'] as const;

const mount = async (tone?: string, text = 'Evidence pending') => {
  const element = document.createElement('sk-status-indicator') as HTMLElement & { tone?: string; updateComplete: Promise<unknown> };
  if (tone !== undefined) element.tone = tone;
  const marker = document.createElement('span');
  marker.slot = 'marker';
  marker.textContent = '●';
  element.append(marker, text);
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const partOf = (element: Element, name: string) =>
  element.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

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

test('[SC-010] a tone property assigned before definition survives upgrade and remains reactive', async () => {
  const element = document.createElement('sk-status-indicator-late') as HTMLElement & { tone?: string; updateComplete: Promise<unknown> };
  element.tone = 'info';
  element.textContent = 'Measuring';
  document.body.append(element);
  const { SkStatusIndicator } = await import('@spec-kitty/elements');
  customElements.define('sk-status-indicator-late', class extends SkStatusIndicator {});
  await customElements.whenDefined('sk-status-indicator-late');
  await element.updateComplete;

  expect(element.tone).toBe('info');
  expect(element.getAttribute('tone')).toBe('info');
  expect(partOf(element, 'status')?.dataset['tone']).toBe('info');
  element.tone = 'recovery';
  await element.updateComplete;
  expect(element.getAttribute('tone')).toBe('recovery');
  expect(partOf(element, 'status')?.dataset['tone']).toBe('recovery');
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
