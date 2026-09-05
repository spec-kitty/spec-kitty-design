/* eslint-disable @nx/enforce-module-boundaries -- WP04 owns package entries; this WP tests its unregistered modules directly. */
import { beforeEach, expect, test } from 'vitest';
import '../../../packages/elements/src/context-sidebar/sk-context-sidebar.js';
import skContextSidebarSheet from '../../../packages/elements/src/context-sidebar/sk-context-sidebar.css.js';
import type { SkContextSidebar } from '../../../packages/elements/src/context-sidebar/sk-context-sidebar.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async (label?: string) => {
  const el = document.createElement('sk-context-sidebar') as SkContextSidebar;
  if (label !== undefined) el.label = label;
  el.innerHTML = `
    <strong slot="header">Reference</strong>
    <a href="#details">Context details</a>
    <button slot="footer" type="button">Context action</button>
  `;
  document.body.append(el);
  await el.updateComplete;
  return el;
};

const part = (el: SkContextSidebar, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

test('the three slots preserve header, content, and footer order including empty regions', async () => {
  const el = await mount();
  const slots = Array.from(el.shadowRoot!.querySelectorAll('slot'));
  expect(slots.map((slot) => slot.name)).toEqual(['header', '', 'footer']);
  expect(slots.map((slot) => slot.assignedElements().map((node) => node.textContent?.trim())))
    .toEqual([['Reference'], ['Context details'], ['Context action']]);

  const empty = document.createElement('sk-context-sidebar') as SkContextSidebar;
  document.body.append(empty);
  await empty.updateComplete;
  expect(Array.from(empty.shadowRoot!.querySelectorAll('slot'), (slot) => [
    slot.name,
    slot.assignedNodes(),
  ])).toEqual([['header', []], ['', []], ['footer', []]]);
});

test('the labelled landmark falls back only for blank labels and is never navigation', async () => {
  for (const value of [undefined, '', '   ', '\n\t']) {
    const el = await mount(value);
    const aside = el.shadowRoot!.querySelector('aside');
    expect(aside?.getAttribute('aria-label')).toBe('Context');
  }

  const exact = '  Context for A & B  ';
  const supplied = await mount(exact);
  expect(supplied.label).toBe(exact);
  expect(supplied.getAttribute('label')).toBe(exact);
  expect(supplied.shadowRoot!.querySelector('aside')?.getAttribute('aria-label')).toBe(exact);
  expect(supplied.shadowRoot!.querySelectorAll('aside')).toHaveLength(1);
  expect(supplied.shadowRoot!.querySelectorAll('nav')).toHaveLength(0);
});

test('[SC-010] a whitespace-bearing label assigned before definition survives upgrade exactly', async () => {
  const exact = '  Pre-upgrade context label  ';
  const el = document.createElement('sk-context-sidebar-late') as SkContextSidebar;
  el.label = exact;
  document.body.append(el);

  const { SkContextSidebar } = await import(
    '../../../packages/elements/src/context-sidebar/sk-context-sidebar.js'
  );
  customElements.define('sk-context-sidebar-late', class extends SkContextSidebar {});
  await customElements.whenDefined('sk-context-sidebar-late');
  await el.updateComplete;

  expect(el.label).toBe(exact);
  expect(el.getAttribute('label')).toBe(exact);
  const aside = el.shadowRoot!.querySelector('aside');
  expect(aside?.tagName).toBe('ASIDE');
  expect(aside?.getAttribute('aria-label')).toBe(exact);
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const el = await mount();
  const style = document.createElement('style');
  style.textContent = `
    sk-context-sidebar::part(sidebar) { outline-style: dashed; }
    sk-context-sidebar::part(header) { outline-style: dotted; }
    sk-context-sidebar::part(content) { outline-style: double; }
    sk-context-sidebar::part(footer) { outline-style: solid; }
  `;
  document.head.append(style);
  try {
    const expected = new Map([
      ['sidebar', 'dashed'],
      ['header', 'dotted'],
      ['content', 'double'],
      ['footer', 'solid'],
    ]);
    expect(Array.from(el.shadowRoot!.querySelectorAll('[part]'), (node) => node.getAttribute('part')))
      .toEqual(Array.from(expected.keys()));
    for (const [name, outline] of expected) {
      const node = part(el, name);
      expect(node, `part "${name}" is absent`).not.toBe(null);
      expect(getComputedStyle(node!).outlineStyle, `::part(${name}) is not targetable`).toBe(outline);
    }
  } finally {
    style.remove();
  }
});

test('[SC-014] the generated stylesheet is adopted by identity with no style injection', async () => {
  const el = await mount();
  expect(el.shadowRoot!.adoptedStyleSheets).toEqual([skContextSidebarSheet]);
  expect(el.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
});

test('long direct labels truncate visually without changing source or accessible text', async () => {
  const exact = 'A context label deliberately too long to fit in this narrow sidebar';
  const frame = document.createElement('div');
  frame.style.width = '160px';
  document.body.append(frame);
  const el = document.createElement('sk-context-sidebar') as SkContextSidebar;
  const link = document.createElement('a');
  link.href = '#long';
  link.textContent = exact;
  el.append(link);
  frame.append(el);
  await el.updateComplete;

  expect(link.textContent).toBe(exact);
  await expect.element(link).toHaveAccessibleName(exact);
  expect(link.getAttribute('title')).toBe(null);
  expect(link.getAttribute('aria-label')).toBe(null);
  const computed = getComputedStyle(link);
  expect(computed.overflow).toBe('hidden');
  expect(computed.textOverflow).toBe('ellipsis');
  expect(computed.whiteSpace).toBe('nowrap');
  expect(link.scrollWidth).toBeGreaterThan(link.clientWidth);
  frame.remove();
});

test('at the narrow boundary the complementary landmark fills the flow without a side divider', async () => {
  const frame = document.createElement('div');
  frame.style.width = '600px';
  document.body.append(frame);
  const el = document.createElement('sk-context-sidebar') as SkContextSidebar;
  el.innerHTML = '<p>Context content remains visible.</p>';
  frame.append(el);
  await el.updateComplete;

  const aside = part(el, 'sidebar')!;
  const computed = getComputedStyle(aside);
  expect(Math.round(aside.getBoundingClientRect().width)).toBe(600);
  expect(computed.borderInlineEndWidth).toBe('0px');
  expect(computed.borderBlockEndWidth).not.toBe('0px');
  expect(el.textContent).toContain('Context content remains visible.');
  frame.remove();
});

test('native descendant events pass through once without element redispatch', async () => {
  const el = await mount();
  const button = el.querySelector('button[slot="footer"]') as HTMLButtonElement;
  const slot = el.shadowRoot!.querySelector('slot[name="footer"]') as HTMLSlotElement | null;
  expect(slot?.assignedElements(), 'the native control is not projected through the footer slot')
    .toEqual([button]);
  const seen: Event[] = [];
  el.addEventListener('click', (event) => seen.push(event));
  button.click();
  expect(seen).toHaveLength(1);
  expect(seen[0]!.target).toBe(button);
  expect(seen[0]).toBeInstanceOf(MouseEvent);
});
