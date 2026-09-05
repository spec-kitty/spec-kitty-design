/* eslint-disable @nx/enforce-module-boundaries -- WP04 owns package entries; this WP tests its unregistered modules directly. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../packages/elements/src/page-header/sk-page-header.js';
import skPageHeaderSheet from '../../../packages/elements/src/page-header/sk-page-header.css.js';
import type { SkPageHeader } from '../../../packages/elements/src/page-header/sk-page-header.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);
afterEach(() => vi.restoreAllMocks());

const mount = async () => {
  const el = document.createElement('sk-page-header') as SkPageHeader;
  el.innerHTML = `
    <span slot="eyebrow">Overview</span>
    <h2 slot="title">Delivery summary</h2>
    <p slot="supporting">Current evidence and activity.</p>
    <span slot="sync">Last synced 1 min ago</span>
    <button slot="actions" type="button">Refresh</button>
  `;
  document.body.append(el);
  await el.updateComplete;
  return el;
};

const part = (el: SkPageHeader, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

test('the five slots preserve exact order including empty regions', async () => {
  const el = await mount();
  const slots = Array.from(el.shadowRoot!.querySelectorAll('slot'));
  expect(slots.map((slot) => slot.name)).toEqual([
    'eyebrow',
    'title',
    'supporting',
    'sync',
    'actions',
  ]);
  expect(slots.map((slot) => slot.assignedElements().map((node) => node.textContent?.trim())))
    .toEqual([
      ['Overview'],
      ['Delivery summary'],
      ['Current evidence and activity.'],
      ['Last synced 1 min ago'],
      ['Refresh'],
    ]);

  const empty = document.createElement('sk-page-header') as SkPageHeader;
  document.body.append(empty);
  await empty.updateComplete;
  expect(Array.from(empty.shadowRoot!.querySelectorAll('slot'), (slot) => [
    slot.name,
    slot.assignedNodes(),
  ])).toEqual([
    ['eyebrow', []],
    ['title', []],
    ['supporting', []],
    ['sync', []],
    ['actions', []],
  ]);
});

test('consumer heading level and bytes remain consumer-owned', async () => {
  const el = await mount();
  const title = el.querySelector('[slot="title"]') as HTMLHeadingElement;
  const assigned = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="title"]')!
    .assignedElements();
  expect(title.tagName).toBe('H2');
  expect(title.textContent).toBe('Delivery summary');
  expect(assigned).toEqual([title]);
  expect(el.shadowRoot!.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0);
});

test('sync text is opaque across elapsed time and the element schedules no clock work', async () => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(0);
  const timeout = vi.spyOn(globalThis, 'setTimeout');
  const interval = vi.spyOn(globalThis, 'setInterval');
  const el = await mount();
  const sync = el.querySelector('[slot="sync"]') as HTMLElement;
  const exact = 'Last synced 1 min ago';
  expect(sync.textContent).toBe(exact);
  expect(el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="sync"]')!.assignedElements())
    .toEqual([sync]);

  now.mockReturnValue(3_600_000);
  await Promise.resolve();
  await el.updateComplete;
  expect(sync.textContent).toBe(exact);
  expect(now).not.toHaveBeenCalled();
  expect(timeout).not.toHaveBeenCalled();
  expect(interval).not.toHaveBeenCalled();
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const el = await mount();
  const style = document.createElement('style');
  style.textContent = `
    sk-page-header::part(header) { outline-style: dashed; }
    sk-page-header::part(text) { outline-style: dotted; }
    sk-page-header::part(eyebrow) { outline-style: double; }
    sk-page-header::part(title) { outline-style: solid; }
    sk-page-header::part(supporting) { outline-style: groove; }
    sk-page-header::part(meta) { outline-style: ridge; }
    sk-page-header::part(sync) { outline-style: inset; }
    sk-page-header::part(actions) { outline-style: outset; }
  `;
  document.head.append(style);
  try {
    const expected = new Map([
      ['header', 'dashed'],
      ['text', 'dotted'],
      ['eyebrow', 'double'],
      ['title', 'solid'],
      ['supporting', 'groove'],
      ['meta', 'ridge'],
      ['sync', 'inset'],
      ['actions', 'outset'],
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
  expect(el.shadowRoot!.adoptedStyleSheets).toEqual([skPageHeaderSheet]);
  expect(el.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
});

test('at the narrow boundary metadata follows text and actions remain reachable', async () => {
  const frame = document.createElement('div');
  frame.style.width = '600px';
  document.body.append(frame);
  const el = document.createElement('sk-page-header') as SkPageHeader;
  el.innerHTML = `
    <h2 slot="title">Narrow heading</h2>
    <span slot="sync">Exact sync bytes</span>
    <button slot="actions" type="button">Open actions</button>
  `;
  frame.append(el);
  await el.updateComplete;

  const header = part(el, 'header')!;
  const text = part(el, 'text')!;
  const meta = part(el, 'meta')!;
  expect(Array.from(header.children)).toEqual([text, meta]);
  expect(Math.round(header.getBoundingClientRect().width)).toBe(600);
  expect(Math.round(text.getBoundingClientRect().width)).toBeGreaterThan(0);
  expect(Math.round(meta.getBoundingClientRect().width))
    .toBe(Math.round(text.getBoundingClientRect().width));
  expect(meta.getBoundingClientRect().top).toBeGreaterThanOrEqual(text.getBoundingClientRect().bottom);
  const action = el.querySelector('button[slot="actions"]') as HTMLButtonElement;
  expect(action.getBoundingClientRect().width).toBeGreaterThan(0);
  expect(action.getBoundingClientRect().height).toBeGreaterThan(0);
  action.focus();
  expect(document.activeElement).toBe(action);
  frame.remove();
});

test('native descendant events pass through once without element redispatch', async () => {
  const el = await mount();
  const button = el.querySelector('button[slot="actions"]') as HTMLButtonElement;
  const slot = el.shadowRoot!.querySelector('slot[name="actions"]') as HTMLSlotElement | null;
  expect(slot?.assignedElements(), 'the native control is not projected through the actions slot')
    .toEqual([button]);
  const seen: Event[] = [];
  el.addEventListener('click', (event) => seen.push(event));
  button.click();
  expect(seen).toHaveLength(1);
  expect(seen[0]!.target).toBe(button);
  expect(seen[0]).toBeInstanceOf(MouseEvent);
});
