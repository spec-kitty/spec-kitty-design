/* eslint-disable @nx/enforce-module-boundaries -- WP04 owns package entries; this WP tests its unregistered modules directly. */
import { beforeEach, expect, test } from 'vitest';
import '../../../packages/elements/src/personal-rail/sk-personal-rail.js';
import skPersonalRailSheet from '../../../packages/elements/src/personal-rail/sk-personal-rail.css.js';
import type { SkPersonalRail } from '../../../packages/elements/src/personal-rail/sk-personal-rail.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async (label?: string) => {
  const el = document.createElement('sk-personal-rail') as SkPersonalRail;
  if (label !== undefined) el.label = label;
  el.innerHTML = `
    <a slot="primary" href="#primary">Primary</a>
    <button slot="utilities">Utility</button>
    <a slot="account" href="#account">Consumer account</a>
    <button slot="logout">Log out</button>
  `;
  document.body.append(el);
  await el.updateComplete;
  return el;
};

const part = (el: SkPersonalRail, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

test('one named nav preserves group and account-before-logout order without synthesized identity', async () => {
  const el = await mount('Workspace rail');
  const navs = el.shadowRoot!.querySelectorAll('nav');
  expect(navs).toHaveLength(1);
  expect(navs[0]!.getAttribute('aria-label')).toBe('Workspace rail');
  expect(Array.from(el.shadowRoot!.querySelectorAll('slot'), (slot) => slot.name)).toEqual([
    'primary',
    'utilities',
    'account',
    'logout',
  ]);
  expect(part(el, 'bottom')!.children[0]).toBe(part(el, 'utilities'));
  expect(part(el, 'bottom')!.children[1]).toBe(part(el, 'divider'));
  expect(part(el, 'bottom')!.children[2]).toBe(part(el, 'account'));
  expect(part(el, 'bottom')!.children[3]).toBe(part(el, 'logout'));
  expect(el.shadowRoot!.textContent).not.toContain('Consumer account');
  expect((el.querySelector('[slot="account"]') as HTMLElement).textContent).toBe('Consumer account');
});

test('missing and blank labels use the exact fallback while valid label bytes remain unchanged', async () => {
  for (const value of [undefined, '', '   ', '\n\t']) {
    const el = await mount(value);
    expect(el.shadowRoot!.querySelector('nav')!.getAttribute('aria-label')).toBe('Personal navigation');
  }
  const exact = '  Personal navigation for A & B  ';
  const supplied = await mount(exact);
  expect(supplied.label).toBe(exact);
  expect(supplied.shadowRoot!.querySelector('nav')!.getAttribute('aria-label')).toBe(exact);
});

test('empty groups retain the public slot and part structure', async () => {
  const el = document.createElement('sk-personal-rail') as SkPersonalRail;
  document.body.append(el);
  await el.updateComplete;
  expect(Array.from(el.shadowRoot!.querySelectorAll('slot'), (slot) => [slot.name, slot.assignedNodes()]))
    .toEqual([['primary', []], ['utilities', []], ['account', []], ['logout', []]]);
});

test('[SC-010] a whitespace-bearing label assigned before definition survives upgrade exactly', async () => {
  const exact = '  Pre-upgrade personal navigation  ';
  const el = document.createElement('sk-personal-rail-late') as SkPersonalRail;
  el.label = exact;
  document.body.append(el);

  const { SkPersonalRail } = await import('../../../packages/elements/src/personal-rail/sk-personal-rail.js');
  customElements.define('sk-personal-rail-late', class extends SkPersonalRail {});
  await customElements.whenDefined('sk-personal-rail-late');
  await el.updateComplete;

  expect(el.label).toBe(exact);
  expect(el.getAttribute('label')).toBe(exact);
  const nav = el.shadowRoot!.querySelector('nav');
  expect(nav?.tagName).toBe('NAV');
  expect(nav?.getAttribute('aria-label')).toBe(exact);
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const el = await mount();
  const style = document.createElement('style');
  style.textContent = `
    sk-personal-rail::part(rail) { outline-style: dashed; }
    sk-personal-rail::part(primary) { outline-style: dotted; }
    sk-personal-rail::part(bottom) { outline-style: double; }
    sk-personal-rail::part(utilities) { outline-style: solid; }
    sk-personal-rail::part(divider) { outline-style: groove; }
    sk-personal-rail::part(account) { outline-style: ridge; }
    sk-personal-rail::part(logout) { outline-style: inset; }
  `;
  document.head.append(style);
  try {
    const expected = new Map([
      ['rail', 'dashed'],
      ['primary', 'dotted'],
      ['bottom', 'double'],
      ['utilities', 'solid'],
      ['divider', 'groove'],
      ['account', 'ridge'],
      ['logout', 'inset'],
    ]);
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
  expect(el.shadowRoot!.adoptedStyleSheets).toEqual([skPersonalRailSheet]);
  expect(el.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
});

test('native descendant events pass through once without element redispatch', async () => {
  const el = await mount();
  const button = el.querySelector('button[slot="utilities"]') as HTMLButtonElement;
  const slot = el.shadowRoot!.querySelector('slot[name="utilities"]') as HTMLSlotElement | null;
  expect(slot?.assignedElements(), 'the native control is not projected through the utilities slot')
    .toEqual([button]);
  const seen: Event[] = [];
  el.addEventListener('click', (event) => seen.push(event));
  button.click();
  expect(seen).toHaveLength(1);
  expect(seen[0]!.target).toBe(button);
  expect(seen[0]).toBeInstanceOf(MouseEvent);
});
