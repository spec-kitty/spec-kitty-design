/* eslint-disable @nx/enforce-module-boundaries -- WP04 owns package entries; this WP tests its unregistered modules directly. */
import { beforeEach, expect, test } from 'vitest';
import '../../../packages/elements/src/app-shell/sk-app-shell.js';
import skAppShellSheet from '../../../packages/elements/src/app-shell/sk-app-shell.css.js';
import type { SkAppShell } from '../../../packages/elements/src/app-shell/sk-app-shell.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async () => {
  const el = document.createElement('sk-app-shell') as SkAppShell;
  el.innerHTML = `
    <aside slot="personal-rail">Personal</aside>
    <aside slot="context-sidebar">Context</aside>
    <header slot="page-header">Header</header>
    <article>Main</article>
  `;
  document.body.append(el);
  await el.updateComplete;
  return el;
};

const part = (el: SkAppShell, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

test('the four regions are slots in document order and empty regions stay present', async () => {
  const el = await mount();
  const slots = Array.from(el.shadowRoot!.querySelectorAll('slot'));
  expect(slots.map((slot) => slot.name)).toEqual([
    'personal-rail',
    'context-sidebar',
    'page-header',
    '',
  ]);
  expect(slots.map((slot) => slot.assignedElements().map((node) => node.textContent))).toEqual([
    ['Personal'],
    ['Context'],
    ['Header'],
    ['Main'],
  ]);
  expect(part(el, 'main')?.tagName).toBe('MAIN');

  const empty = document.createElement('sk-app-shell') as SkAppShell;
  document.body.append(empty);
  await empty.updateComplete;
  expect(empty.shadowRoot!.querySelectorAll('slot')).toHaveLength(4);
  expect(Array.from(empty.shadowRoot!.querySelectorAll('slot'), (slot) => slot.assignedNodes())).toEqual([
    [], [], [], [],
  ]);
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const el = await mount();
  const style = document.createElement('style');
  style.textContent = `
    sk-app-shell::part(shell) { outline-style: dashed; }
    sk-app-shell::part(personal) { outline-style: dotted; }
    sk-app-shell::part(context) { outline-style: double; }
    sk-app-shell::part(content) { outline-style: solid; }
    sk-app-shell::part(header) { outline-style: groove; }
    sk-app-shell::part(main) { outline-style: ridge; }
  `;
  document.head.append(style);
  try {
    const expected = new Map([
      ['shell', 'dashed'],
      ['personal', 'dotted'],
      ['context', 'double'],
      ['content', 'solid'],
      ['header', 'groove'],
      ['main', 'ridge'],
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
  expect(el.shadowRoot!.adoptedStyleSheets).toEqual([skAppShellSheet]);
  expect(el.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
});

test('desktop columns resolve to 56px and 240px at both approved widths', async () => {
  for (const width of [1280, 1440]) {
    const frame = document.createElement('div');
    frame.style.width = `${width}px`;
    document.body.append(frame);
    const el = document.createElement('sk-app-shell') as SkAppShell;
    frame.append(el);
    await el.updateComplete;
    const shell = part(el, 'shell')!;
    const personal = part(el, 'personal')!;
    const context = part(el, 'context')!;
    expect(Math.round(shell.getBoundingClientRect().width)).toBe(width);
    expect(Math.round(personal.getBoundingClientRect().width)).toBe(56);
    expect(Math.round(context.getBoundingClientRect().width)).toBe(240);
    frame.remove();
  }
});

test('narrow layout reflows in DOM order without hiding regions or creating visibility state', async () => {
  const frame = document.createElement('div');
  frame.style.width = '600px';
  document.body.append(frame);
  const el = document.createElement('sk-app-shell') as SkAppShell;
  el.innerHTML = `
    <span slot="personal-rail">Personal</span>
    <span slot="context-sidebar">Context</span>
    <span slot="page-header">Header</span>
    <span>Main</span>
  `;
  frame.append(el);
  await el.updateComplete;

  const regions = ['personal', 'context', 'content'].map((name) => part(el, name)!);
  expect(regions.map((node) => Math.round(node.getBoundingClientRect().width))).toEqual([600, 600, 600]);
  expect(regions.map((node) => Math.round(node.getBoundingClientRect().top)))
    .toEqual([...regions.map((node) => Math.round(node.getBoundingClientRect().top))].sort((a, b) => a - b));
  for (const node of regions) expect(getComputedStyle(node).display).not.toBe('none');
  expect(el.attributes).toHaveLength(0);
  expect(Object.keys(el).filter((key) => /open|hidden|visible/i.test(key))).toEqual([]);
  frame.remove();
});

test('native descendant events pass through once without element redispatch', async () => {
  const el = await mount();
  const button = document.createElement('button');
  button.textContent = 'Consumer action';
  el.querySelector('article')!.append(button);
  const slot = el.shadowRoot!.querySelector('slot:not([name])') as HTMLSlotElement | null;
  expect(slot?.assignedElements(), 'the consumer action is not projected through the main slot')
    .toEqual([el.querySelector('article')]);
  const seen: Event[] = [];
  el.addEventListener('click', (event) => seen.push(event));
  button.click();
  expect(seen).toHaveLength(1);
  expect(seen[0]!.target).toBe(button);
  expect(seen[0]).toBeInstanceOf(MouseEvent);
});
