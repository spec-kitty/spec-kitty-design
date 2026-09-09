/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
import { beforeEach, expect, test, vi } from 'vitest';
import '../../../packages/elements/src/action-row/sk-action-row.js';
import '../../../packages/elements/src/button/sk-button.js';
import skActionRowSheet from '../../../packages/elements/src/action-row/sk-action-row.css.js';
import {
  type ActionRowActivateDetail,
  SkActionRow,
} from '../../../packages/elements/src/action-row/sk-action-row.js';
import { userEvent } from 'vitest/browser';
import actionRowCss from '../../../packages/styles/src/action-row/sk-action-row.css?raw';
import { assertThemesDiffered, contrast } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

type ActionRow = SkActionRow & {
  updateComplete: Promise<unknown>;
  href: string | undefined;
  presentation: 'flush' | undefined;
};

const content = `
  <span slot="marker">SP</span>
  <strong slot="title">team-landing-pivots</strong>
  <code slot="reference">spec-kitty/e2e-team-landing</code>
  <span slot="tags">Fresh</span>
  <time slot="metadata">2 hours ago</time>
  <a slot="controls" href="#details">Details</a>
  <button slot="controls" type="button">Pin</button>
  <sk-button slot="controls" size="sm">Inspect</sk-button>
`;

beforeEach(installTokenSheet);

const mount = async ({
  rowId = 'row-17',
  selectable = true,
  selected = false,
  layout,
  href,
  presentation,
  children = content,
}: {
  rowId?: string | undefined;
  selectable?: boolean;
  selected?: boolean;
  layout?: 'card' | undefined;
  href?: string | undefined;
  presentation?: 'flush' | undefined;
  children?: string;
} = {}): Promise<ActionRow> => {
  const element = document.createElement('sk-action-row') as ActionRow;
  element.rowId = rowId;
  element.selectable = selectable;
  element.selected = selected;
  element.layout = layout;
  element.href = href;
  element.presentation = presentation;
  element.innerHTML = children;
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const partOf = (element: Element, name: string) =>
  element.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

const triggerOf = <T extends HTMLElement = HTMLButtonElement>(element: Element) => partOf(element, 'trigger') as T;

const authoredActionRowSheet = new CSSStyleSheet();
authoredActionRowSheet.replaceSync(actionRowCss);

const mediaRuleFor = (query: string): CSSMediaRule | undefined =>
  Array.from(authoredActionRowSheet.cssRules).find(
    (rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.media.mediaText === query,
  );

const styleRuleFor = (media: CSSMediaRule, selector: string): CSSStyleRule | undefined =>
  Array.from(media.cssRules).find(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === selector,
  );

const rootStyleRuleFor = (selector: string): CSSStyleRule | undefined =>
  Array.from(authoredActionRowSheet.cssRules).find(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === selector,
  );

test('the six consumer channels preserve the approved scan order and keep controls outside the trigger', async () => {
  const element = await mount();
  const trigger = triggerOf(element);
  const projected = Array.from(trigger.querySelectorAll<HTMLSlotElement>('slot')).map((slot) => slot.name);
  expect(projected).toEqual(['marker', 'title', 'reference', 'tags', 'metadata', 'supporting']);
  expect(trigger.tagName).toBe('BUTTON');
  expect(trigger.type).toBe('button');

  const controls = partOf(element, 'controls')!;
  expect(trigger.contains(controls)).toBe(false);
  expect(trigger.parentElement).toBe(controls.parentElement);
  expect(controls.querySelector('slot')?.getAttribute('name')).toBe('controls');
  expect(element.shadowRoot!.textContent!.trim()).toBe('');
});

test('a non-blank href renders one native anchor named only by the slotted title', async () => {
  const element = await mount({ href: '/missions/WP-272?view=detail#current', selectable: false });
  const trigger = triggerOf<HTMLAnchorElement>(element);
  expect(trigger.tagName).toBe('A');
  expect(trigger.getAttribute('href')).toBe('/missions/WP-272?view=detail#current');
  expect(trigger.hasAttribute('target')).toBe(false);
  expect(trigger.hasAttribute('rel')).toBe(false);
  expect(trigger.hasAttribute('tabindex')).toBe(false);

  const title = partOf(element, 'title')!;
  expect(title.id).not.toBe('');
  expect(trigger.getAttribute('aria-labelledby')).toBe(title.id);
  expect((title.querySelector('slot') as HTMLSlotElement).assignedElements()[0]?.textContent).toBe(
    'team-landing-pivots',
  );
  expect(trigger.querySelectorAll('slot')).toHaveLength(6);
  expect(trigger.contains(partOf(element, 'controls'))).toBe(false);
  expect(trigger.parentElement).toBe(partOf(element, 'controls')!.parentElement);
});

test('href add, opaque change, blank fallback, removal, and re-add re-evaluate route precedence', async () => {
  const element = await mount({ selectable: true });
  expect(triggerOf(element).tagName).toBe('BUTTON');

  element.setAttribute('href', '  /opaque route?x=1#two  ');
  await element.updateComplete;
  expect(triggerOf<HTMLAnchorElement>(element).tagName).toBe('A');
  expect(triggerOf<HTMLAnchorElement>(element).getAttribute('href')).toBe('  /opaque route?x=1#two  ');

  element.setAttribute('href', '/changed');
  await element.updateComplete;
  expect(triggerOf<HTMLAnchorElement>(element).getAttribute('href')).toBe('/changed');

  element.setAttribute('href', ' \t ');
  await element.updateComplete;
  expect(triggerOf(element).tagName).toBe('BUTTON');

  element.removeAttribute('href');
  await element.updateComplete;
  expect(triggerOf(element).tagName).toBe('BUTTON');

  element.setAttribute('href', '#again');
  await element.updateComplete;
  expect(triggerOf<HTMLAnchorElement>(element).getAttribute('href')).toBe('#again');
});

test('[SC-006][SC-007][SC-008] route mode never emits the selectable activation event', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const element = await mount({ href: '#native-route', selectable: true });
    const trigger = triggerOf<HTMLAnchorElement>(element);
    const events: Event[] = [];
    element.addEventListener('sk-action-row-activate', (event) => events.push(event));
    trigger.addEventListener('click', (event) => event.preventDefault());

    trigger.click();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    const modifiedClick = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    expect(trigger.dispatchEvent(modifiedClick)).toBe(false);
    expect(modifiedClick.defaultPrevented).toBe(true);
    expect(events).toHaveLength(0);
    expect(trigger.tagName).toBe('A');
  } finally {
    warn.mockRestore();
  }
});

test('route mode wins over selectable and warns once per distinct mixed-state transition', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const element = await mount({ href: '#first', selectable: true });
    expect(triggerOf(element).tagName).toBe('A');
    expect(warn).toHaveBeenCalledTimes(1);

    element.selected = true;
    await element.updateComplete;
    expect(warn).toHaveBeenCalledTimes(1);

    element.href = '#second';
    await element.updateComplete;
    expect(triggerOf<HTMLAnchorElement>(element).getAttribute('href')).toBe('#second');
    expect(warn).toHaveBeenCalledTimes(2);

    element.selectable = false;
    await element.updateComplete;
    element.selectable = true;
    await element.updateComplete;
    expect(warn).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenLastCalledWith(expect.stringContaining('href and selectable'));
  } finally {
    warn.mockRestore();
  }
});

test('layout is additive, accepts only card, and unknown values fail open without losing projections', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const element = await mount({ children: `${content}<span slot="supporting">Claimed by Mia</span>` });
    const row = partOf(element, 'row')!;
    expect(element.layout).toBeUndefined();
    expect(row.classList.contains('sk-action-row--card')).toBe(false);

    element.setAttribute('layout', 'card');
    await element.updateComplete;
    expect(element.layout).toBe('card');
    expect(row.classList.contains('sk-action-row--card')).toBe(true);

    element.setAttribute('layout', 'stacked');
    await element.updateComplete;
    expect(row.classList.contains('sk-action-row--card')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown action-row layout'));
    expect(triggerOf(element).querySelectorAll('slot')).toHaveLength(6);
    expect((triggerOf(element).querySelector('slot[name="supporting"]') as HTMLSlotElement).assignedElements()).toHaveLength(1);

    element.setAttribute('layout', '');
    await element.updateComplete;
    expect(row.classList.contains('sk-action-row--card')).toBe(false);
  } finally {
    warn.mockRestore();
  }
});

test('flush presentation removes only the resting container surface and preserves anatomy', async () => {
  const element = await mount({ selectable: false, presentation: 'flush' });
  const row = partOf(element, 'row')!;
  const trigger = triggerOf(element);
  const beforeSlots = Array.from(trigger.querySelectorAll<HTMLSlotElement>('slot'), (slot) => slot.name);
  expect(row.classList.contains('sk-action-row--flush')).toBe(true);
  expect(getComputedStyle(row).backgroundImage).toBe('none');
  expect(getComputedStyle(row).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(row).borderTopWidth).toBe('0px');
  expect(getComputedStyle(row).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(row).borderTopLeftRadius).toBe('0px');
  expect(getComputedStyle(trigger).paddingInlineStart).not.toBe('0px');
  expect(Array.from(trigger.querySelectorAll<HTMLSlotElement>('slot'), (slot) => slot.name)).toEqual(beforeSlots);
});

test('unknown presentation warns once per distinct transition and fails open to the bordered row', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const element = await mount({ selectable: false });
    const row = partOf(element, 'row')!;

    element.setAttribute('presentation', 'edge-to-edge');
    await element.updateComplete;
    expect(row.classList.contains('sk-action-row--flush')).toBe(false);
    expect(getComputedStyle(row).borderTopWidth).not.toBe('0px');
    expect(warn).toHaveBeenCalledTimes(1);

    element.selected = true;
    await element.updateComplete;
    expect(warn).toHaveBeenCalledTimes(1);

    element.setAttribute('presentation', 'frameless');
    await element.updateComplete;
    expect(warn).toHaveBeenCalledTimes(2);

    element.setAttribute('presentation', '');
    await element.updateComplete;
    element.setAttribute('presentation', 'frameless');
    await element.updateComplete;
    expect(warn).toHaveBeenCalledTimes(3);
    expect(row.classList.contains('sk-action-row--flush')).toBe(false);
  } finally {
    warn.mockRestore();
  }
});

test('removing an invalid presentation resets warning state without misclassifying null', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const element = await mount({ selectable: false });
    element.setAttribute('presentation', 'invalid');
    await element.updateComplete;
    expect(warn).toHaveBeenCalledTimes(1);

    element.removeAttribute('presentation');
    await element.updateComplete;
    expect(warn).toHaveBeenCalledTimes(1);
    expect(partOf(element, 'row')!.classList.contains('sk-action-row--flush')).toBe(false);

    element.setAttribute('presentation', 'invalid');
    await element.updateComplete;
    expect(warn).toHaveBeenCalledTimes(2);
  } finally {
    warn.mockRestore();
  }
});

test('selected flush preserves the selected surface while removing every row border', async () => {
  const selectedFlush = await mount({ selected: true, presentation: 'flush' });
  const selectedBordered = await mount({ selected: true });
  const flushRow = partOf(selectedFlush, 'row')!;
  const borderedRow = partOf(selectedBordered, 'row')!;
  expect(flushRow.getAttribute('aria-current')).toBe('true');
  expect(getComputedStyle(flushRow).backgroundColor).toBe(getComputedStyle(borderedRow).backgroundColor);
  expect(getComputedStyle(flushRow).borderTopWidth).toBe('0px');
  expect(getComputedStyle(flushRow).borderInlineStartWidth).toBe('0px');
  expect(getComputedStyle(flushRow).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(flushRow).borderTopLeftRadius).toBe('0px');
  expect(getComputedStyle(borderedRow).borderTopWidth).not.toBe('0px');
});

test('[SC-013] supporting keeps one targetable stable part while assignment controls visibility', async () => {
  const element = await mount({ children: '<strong slot="title">Compact item</strong>' });
  const supporting = element.shadowRoot!.querySelector('.sk-action-row__supporting') as HTMLElement;
  expect(supporting.getAttribute('part')).toBe('supporting');
  const slot = supporting.querySelector('slot[name="supporting"]') as HTMLSlotElement;
  expect(supporting.hidden).toBe(true);
  expect(slot.assignedNodes()).toHaveLength(0);

  const style = document.createElement('style');
  style.textContent = 'sk-action-row::part(supporting) { outline-style: dashed; }';
  document.head.append(style);
  expect(getComputedStyle(supporting).outlineStyle).toBe('dashed');

  const line = document.createElement('span');
  line.slot = 'supporting';
  line.textContent = 'Claimed by Mia';
  let changed = new Promise((resolve) => slot.addEventListener('slotchange', resolve, { once: true }));
  element.append(line);
  await changed;
  expect(slot.assignedElements()).toEqual([line]);
  expect(supporting.hidden).toBe(false);

  changed = new Promise((resolve) => slot.addEventListener('slotchange', resolve, { once: true }));
  line.remove();
  await changed;
  expect(supporting.hidden).toBe(true);

  changed = new Promise((resolve) => slot.addEventListener('slotchange', resolve, { once: true }));
  element.append(line);
  await changed;
  expect(element.shadowRoot!.querySelector('.sk-action-row__supporting')).toBe(supporting);
  expect(supporting.hidden).toBe(false);
  style.remove();
});

test('non-selectable and blank-ID rows fail closed without false interaction affordance', async () => {
  for (const layout of [undefined, 'card'] as const) {
    for (const options of [
      { rowId: 'row-17', selectable: false },
      { rowId: '', selectable: true },
      { rowId: ' \t ', selectable: true },
    ]) {
      const element = await mount({ ...options, layout });
      let count = 0;
      element.addEventListener('sk-action-row-activate', () => {
        count += 1;
      });
      const trigger = triggerOf(element);
      expect(trigger.tagName).not.toBe('BUTTON');
      expect(trigger.hasAttribute('tabindex')).toBe(false);
      expect(getComputedStyle(trigger).cursor).not.toBe('pointer');
      trigger.click();
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(count).toBe(0);
      element.remove();
    }
  }
});

test('[SC-006] native pointer, Enter, Space, and held-key sequences each request activation once in both layouts', async () => {
  for (const layout of [undefined, 'card'] as const) {
    const element = await mount({ layout });
    const trigger = triggerOf(element);
    const events: CustomEvent<ActionRowActivateDetail>[] = [];
    element.addEventListener('sk-action-row-activate', (event) => {
      events.push(event as CustomEvent<ActionRowActivateDetail>);
    });

    await userEvent.click(trigger);
    expect(events).toHaveLength(1);

    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(events).toHaveLength(2);

    await userEvent.keyboard('{Space}');
    expect(events).toHaveLength(3);

    const keydowns: Array<{ key: string; repeat: boolean; defaultPrevented: boolean }> = [];
    trigger.addEventListener('keydown', (event) => {
      keydowns.push({ key: event.key, repeat: event.repeat, defaultPrevented: event.defaultPrevented });
    });
    await userEvent.keyboard('{Enter>2/}');
    expect(events).toHaveLength(4);
    expect(keydowns).toContainEqual({ key: 'Enter', repeat: true, defaultPrevented: true });

    keydowns.length = 0;
    await userEvent.keyboard('{Space>2/}');
    expect(events).toHaveLength(5);
    expect(keydowns).toContainEqual({ key: ' ', repeat: true, defaultPrevented: true });
    element.remove();
  }
});

test('[SC-007] activation preserves the consumer ID verbatim and exposes no extra detail keys', async () => {
  const element = await mount({ rowId: '  consumer-row  ' });
  let detail: ActionRowActivateDetail | null = null;
  element.addEventListener(
    'sk-action-row-activate',
    (event) => {
      detail = (event as CustomEvent<ActionRowActivateDetail>).detail;
    },
    { once: true },
  );

  triggerOf(element).click();
  expect(detail).toEqual({ id: '  consumer-row  ' });
  expect(Object.keys(detail!)).toEqual(['id']);
});

test('[SC-008] the non-cancelable event crosses shadow roots and has no component default action', async () => {
  const wrapper = document.createElement('div');
  const outerRoot = wrapper.attachShadow({ mode: 'open' });
  document.body.append(wrapper);
  const element = document.createElement('sk-action-row') as ActionRow;
  element.rowId = 'cross-shadow';
  element.selectable = true;
  element.selected = true;
  element.innerHTML = '<strong slot="title">Cross shadow</strong>';
  outerRoot.append(element);
  await element.updateComplete;

  let seen: CustomEvent<ActionRowActivateDetail> | null = null;
  let dispatchResult: boolean | undefined;
  const originalDispatch = element.dispatchEvent.bind(element);
  element.dispatchEvent = ((event: Event) => {
    dispatchResult = originalDispatch(event);
    return dispatchResult;
  }) as typeof element.dispatchEvent;
  document.addEventListener(
    'sk-action-row-activate',
    (event) => {
      event.preventDefault();
      seen = event as CustomEvent<ActionRowActivateDetail>;
    },
    { once: true },
  );
  const locationBefore = window.location.href;

  triggerOf(element).click();

  expect(seen).not.toBe(null);
  expect(seen!.bubbles).toBe(true);
  expect(seen!.composed).toBe(true);
  expect(seen!.cancelable).toBe(false);
  expect(seen!.defaultPrevented).toBe(false);
  expect(dispatchResult).toBe(true);
  expect(element.selected).toBe(true);
  expect(window.location.href).toBe(locationBefore);
});

test('selection remains controlled and maps only to aria-current on the stable row root', async () => {
  for (const layout of [undefined, 'card'] as const) {
    for (const selectable of [true, false]) {
      const element = await mount({ selectable, selected: true, layout });
      const row = partOf(element, 'row')!;
      expect(row.getAttribute('aria-current')).toBe('true');
      expect(element.shadowRoot!.querySelector('[aria-selected],[aria-pressed],[role="checkbox"],[role="switch"]')).toBe(
        null,
      );

      if (selectable) triggerOf(element).click();
      await element.updateComplete;
      expect(element.selected).toBe(true);
      expect(partOf(element, 'row')).toBe(row);

      element.selected = false;
      await element.updateComplete;
      expect(partOf(element, 'row')).toBe(row);
      expect(row.hasAttribute('aria-current')).toBe(false);
      element.remove();
    }
  }
});

test('route selection maps page-current to the anchor only and never duplicates row current state', async () => {
  const element = await mount({ href: '#current', selected: true, selectable: false });
  const row = partOf(element, 'row')!;
  const trigger = triggerOf<HTMLAnchorElement>(element);
  expect(trigger.getAttribute('aria-current')).toBe('page');
  expect(row.hasAttribute('aria-current')).toBe(false);
  expect(Array.from(element.shadowRoot!.querySelectorAll('[aria-current]'))).toEqual([trigger]);

  element.selected = false;
  await element.updateComplete;
  expect(trigger.hasAttribute('aria-current')).toBe(false);
  expect(row.hasAttribute('aria-current')).toBe(false);
});

test.each([
  { mode: 'static', options: { selectable: false }, primaryCount: 0 },
  { mode: 'button', options: { selectable: true }, primaryCount: 1 },
  { mode: 'route', options: { selectable: false, href: '#details' }, primaryCount: 1 },
])('$mode mode keeps controls outside the trigger without a compounded host tab stop', async ({ options, primaryCount }) => {
  const element = await mount(options);
  const trigger = triggerOf(element);
  const controls = partOf(element, 'controls')!;
  expect(trigger.contains(controls)).toBe(false);
  expect(element.hasAttribute('tabindex')).toBe(false);
  expect(element.shadowRoot!.querySelectorAll('button,a,[tabindex]')).toHaveLength(primaryCount);
  expect((controls.querySelector('slot') as HTMLSlotElement).assignedElements()).toHaveLength(3);
});

test.each([
  { label: 'default row', layout: undefined },
  { label: 'card', layout: 'card' as const },
])('native and custom trailing controls remain independently operable in $label layout', async ({ layout }) => {
  const element = await mount({ layout });
  let rowEvents = 0;
  let controlEvents = 0;
  element.addEventListener('sk-action-row-activate', () => {
    rowEvents += 1;
  });

  const link = element.querySelector<HTMLAnchorElement>('a')!;
  const button = element.querySelector<HTMLButtonElement>('button')!;
  const custom = element.querySelector('sk-button')!;
  link.addEventListener('click', (event) => {
    event.preventDefault();
    controlEvents += 1;
  });
  button.addEventListener('click', () => {
    controlEvents += 1;
  });
  custom.addEventListener('click', () => {
    controlEvents += 1;
  });

  await userEvent.click(link);
  await userEvent.click(button);
  const customTrigger = custom.shadowRoot!.querySelector('button')!;
  await userEvent.click(customTrigger);
  expect(controlEvents).toBe(3);
  expect(rowEvents).toBe(0);
});

test('consumer-authored ul and li retain native ownership without shadow list semantics', async () => {
  const list = document.createElement('ul');
  const item = document.createElement('li');
  const element = await mount();
  element.remove();
  item.append(element);
  list.append(item);
  document.body.append(list);

  expect(element.parentElement).toBe(item);
  expect(item.parentElement).toBe(list);
  expect(element.shadowRoot!.querySelector('ul,li,[role="list"],[role="listitem"]')).toBe(null);
  expect(element.getAttribute('role')).toBe(null);
});

test('[SC-010] row properties assigned before definition survive upgrade and drive every public axis', async () => {
  const element = document.createElement('sk-action-row-late') as ActionRow;
  element.rowId = 'late-row';
  element.selectable = true;
  element.selected = true;
  element.layout = 'card';
  element.href = '#late-route';
  element.presentation = 'flush';
  element.innerHTML = '<strong slot="title">Late row</strong>';
  document.body.append(element);
  customElements.define('sk-action-row-late', class extends SkActionRow {});
  await customElements.whenDefined('sk-action-row-late');
  await element.updateComplete;

  expect({
    rowId: element.rowId,
    selectable: element.selectable,
    selected: element.selected,
    layout: element.layout,
    href: element.href,
    presentation: element.presentation,
  }).toEqual({
    rowId: 'late-row',
    selectable: true,
    selected: true,
    layout: 'card',
    href: '#late-route',
    presentation: 'flush',
  });
  expect(element.getAttribute('row-id')).toBe('late-row');
  expect(element.hasAttribute('selectable')).toBe(true);
  expect(element.hasAttribute('selected')).toBe(true);
  expect(element.getAttribute('layout')).toBe('card');
  expect(element.getAttribute('href')).toBe('#late-route');
  expect(element.getAttribute('presentation')).toBe('flush');
  expect(triggerOf(element).tagName).toBe('A');
  expect(triggerOf(element).getAttribute('aria-current')).toBe('page');
  expect(partOf(element, 'row')?.hasAttribute('aria-current')).toBe(false);
  expect(partOf(element, 'row')?.classList.contains('sk-action-row--card')).toBe(true);
  expect(partOf(element, 'row')?.classList.contains('sk-action-row--flush')).toBe(true);

  element.href = undefined;
  element.presentation = undefined;
  await element.updateComplete;
  expect(element.hasAttribute('href')).toBe(false);
  expect(element.hasAttribute('presentation')).toBe(false);
  expect(triggerOf(element).tagName).toBe('BUTTON');
  expect(partOf(element, 'row')?.getAttribute('aria-current')).toBe('true');
  expect(partOf(element, 'row')?.classList.contains('sk-action-row--flush')).toBe(false);

  element.layout = undefined;
  await element.updateComplete;
  expect(element.hasAttribute('layout')).toBe(false);
  expect(partOf(element, 'row')?.classList.contains('sk-action-row--card')).toBe(false);

  element.layout = 'card';
  await element.updateComplete;
  expect(element.getAttribute('layout')).toBe('card');
  expect(partOf(element, 'row')?.classList.contains('sk-action-row--card')).toBe(true);

  element.selectable = false;
  await element.updateComplete;
  expect(triggerOf(element).tagName).not.toBe('BUTTON');
  expect(partOf(element, 'row')?.getAttribute('aria-current')).toBe('true');
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const element = await mount();
  const cases: readonly (readonly [string, string])[] = [
    ['row', 'sk-action-row::part(row) { outline-style: dashed; }'],
    ['trigger', 'sk-action-row::part(trigger) { outline-style: dashed; }'],
    ['marker', 'sk-action-row::part(marker) { outline-style: dashed; }'],
    ['title', 'sk-action-row::part(title) { outline-style: dashed; }'],
    ['reference', 'sk-action-row::part(reference) { outline-style: dashed; }'],
    ['tags', 'sk-action-row::part(tags) { outline-style: dashed; }'],
    ['metadata', 'sk-action-row::part(metadata) { outline-style: dashed; }'],
    ['supporting', 'sk-action-row::part(supporting) { outline-style: dashed; }'],
    ['controls', 'sk-action-row::part(controls) { outline-style: dashed; }'],
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
  expect(cases).toHaveLength(9);
});

test('[SC-014] the element adopts the generated sheet by identity and injects no style tag', async () => {
  const element = await mount();
  const root = element.shadowRoot!;
  expect(root.adoptedStyleSheets).toHaveLength(1);
  expect(root.adoptedStyleSheets[0]).toBe(skActionRowSheet);
  expect(root.querySelectorAll('style')).toHaveLength(0);
});

test('the focus ring resolves to the theme accent and clears 3:1 on every action-state surface', async () => {
  const palettes = new Map<string, string>();
  for (const theme of ['dark', 'light'] as const) {
    const wrapper = document.createElement('div');
    if (theme === 'light') wrapper.className = 'sk-light';
    document.body.append(wrapper);
    const element = await mount();
    wrapper.append(element);
    element.shadowRoot!.adoptedStyleSheets = [authoredActionRowSheet];

    await userEvent.tab();
    const trigger = triggerOf(element);
    const row = partOf(element, 'row')!;
    expect(element.shadowRoot!.activeElement).toBe(trigger);
    const focus = getComputedStyle(trigger);

    const probe = document.createElement('span');
    wrapper.append(probe);
    probe.style.color = 'var(--sk-color-accent)';
    const accent = getComputedStyle(probe).color;
    expect(focus.outlineColor, `${theme} focus ring uses the theme accent`).toBe(accent);
    expect(focus.outlineStyle, `${theme} focus ring remains visible`).toBe('solid');

    const surfaces = new Map<string, string>([['rest', getComputedStyle(row).backgroundColor]]);
    element.selected = true;
    await element.updateComplete;
    surfaces.set('selected', getComputedStyle(row).backgroundColor);
    element.selected = false;
    await element.updateComplete;
    for (const [state, selector] of [
      ['hover', 'button.sk-action-row__trigger:hover, a.sk-action-row__trigger:hover'],
      ['pressed', 'button.sk-action-row__trigger:active, a.sk-action-row__trigger:active'],
    ] as const) {
      const stateRule = rootStyleRuleFor(selector);
      expect(stateRule, `the ${state}-state rule was not parsed`).not.toBeUndefined();
      probe.style.background = stateRule!.style.background;
      surfaces.set(state, getComputedStyle(probe).backgroundColor);
    }

    for (const [state, surface] of surfaces) {
      expect(surface, `${theme} ${state} surface is painted`).not.toBe('rgba(0, 0, 0, 0)');
      expect(contrast(accent, surface), `${theme} ${state} focus contrast`).toBeGreaterThanOrEqual(3);
    }
    palettes.set(theme, `${accent}|${[...surfaces.values()].join('|')}`);
    wrapper.remove();
  }
  assertThemesDiffered(palettes);
});

test('the authored sheet scopes reduced motion and preserves every forced-colors action affordance', () => {
  const reducedMotion = mediaRuleFor('(prefers-reduced-motion: reduce)');
  expect(reducedMotion, 'the reduced-motion media rule was not parsed').not.toBeUndefined();
  expect(styleRuleFor(reducedMotion!, '.sk-action-row')?.style.transition).toBe('none');
  expect(styleRuleFor(reducedMotion!, '.sk-action-row__trigger')?.style.transition).toBe('none');
  expect(Array.from(reducedMotion!.cssRules, (rule) => (rule as CSSStyleRule).selectorText).sort()).toEqual([
    '.sk-action-row',
    '.sk-action-row__trigger',
  ]);

  const forcedColors = mediaRuleFor('(forced-colors: active)');
  expect(forcedColors, 'the forced-colors media rule was not parsed').not.toBeUndefined();
  const selected = styleRuleFor(forcedColors!, '.sk-action-row[aria-current="true"]')!;
  const flushSelected = styleRuleFor(forcedColors!, '.sk-action-row--flush[aria-current="true"]')!;
  const hover = styleRuleFor(
    forcedColors!,
    'button.sk-action-row__trigger:hover, a.sk-action-row__trigger:hover',
  )!;
  const pressed = styleRuleFor(
    forcedColors!,
    'button.sk-action-row__trigger:active, a.sk-action-row__trigger:active',
  )!;
  const focus = styleRuleFor(
    forcedColors!,
    'button.sk-action-row__trigger:focus-visible, a.sk-action-row__trigger:focus-visible',
  )!;
  for (const [state, rule] of [
    ['selected', selected],
    ['hover', hover],
    ['pressed', pressed],
    ['focus', focus],
  ] as const) {
    expect(rule, `${state} forced-colors rule was not parsed`).not.toBeUndefined();
  }
  expect(selected.style.borderInlineStartColor.toLowerCase()).toBe('highlight');
  expect(selected.style.borderInlineStartWidth).toBe('var(--sk-border-width-2)');
  expect(flushSelected.style.borderInlineStartWidth).toBe('0px');
  expect(hover.style.outlineColor.toLowerCase()).toBe('canvastext');
  expect(hover.style.outlineStyle).toBe('solid');
  expect(hover.style.outlineWidth).toBe('var(--sk-border-width-1)');
  expect(pressed.style.outlineColor.toLowerCase()).toBe('buttontext');
  expect(pressed.style.outlineStyle).toBe('dashed');
  expect(pressed.style.outlineWidth).toBe('var(--sk-border-width-2)');
  expect(focus.style.outlineColor.toLowerCase()).toBe('highlight');
  expect(focus.style.outlineStyle).toBe('solid');
  expect(focus.style.outlineWidth).toBe('var(--sk-border-width-2)');
  expect(hover.style.outlineWidth).not.toBe(focus.style.outlineWidth);
  expect(pressed.style.outlineStyle).not.toBe(focus.style.outlineStyle);
  expect(
    Array.from(forcedColors!.cssRules).some(
      (rule) => rule instanceof CSSStyleRule && rule.style.forcedColorAdjust === 'none',
    ),
    'an affordance must not freeze authored colours in forced-colors mode',
  ).toBe(false);
});

test('long content wraps at 320px without overflow or controls/metadata collision in both themes', async () => {
  const surfaces = new Map<string, string>();
  for (const theme of ['dark', 'light'] as const) {
    const wrapper = document.createElement('div');
    wrapper.style.width = '320px';
    if (theme === 'light') wrapper.className = 'sk-light';
    document.body.append(wrapper);
    const element = await mount({
      children: `
        <span slot="marker">SP</span>
        <strong slot="title">A long consumer-supplied title remains readable</strong>
        <code slot="reference">spec-kitty/a-very-long-unbroken-reference-without-a-natural-break</code>
        <span slot="tags">One</span><span slot="tags">Two</span><span slot="tags">Three</span>
        <time slot="metadata">2 hours ago</time>
        <button slot="controls" type="button">Inspect evidence</button>
      `,
    });
    wrapper.append(element);
    await element.updateComplete;
    const row = partOf(element, 'row')!;
    const trigger = triggerOf(element);
    await userEvent.tab();
    expect(element.shadowRoot!.activeElement).toBe(trigger);
    const rowRect = row.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const focusStyle = getComputedStyle(trigger);
    const focusOutside = Math.max(
      0,
      Number.parseFloat(focusStyle.outlineWidth) + Number.parseFloat(focusStyle.outlineOffset),
    );
    const metadata = partOf(element, 'metadata')!.getBoundingClientRect();
    const controls = partOf(element, 'controls')!.getBoundingClientRect();
    expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
    expect(focusStyle.outlineStyle).toBe('solid');
    expect(triggerRect.left - focusOutside).toBeGreaterThanOrEqual(rowRect.left - 0.5);
    expect(triggerRect.right + focusOutside).toBeLessThanOrEqual(rowRect.right + 0.5);
    expect(triggerRect.top - focusOutside).toBeGreaterThanOrEqual(rowRect.top - 0.5);
    expect(triggerRect.bottom + focusOutside).toBeLessThanOrEqual(rowRect.bottom + 0.5);
    expect(metadata.bottom <= controls.top || controls.bottom <= metadata.top).toBe(true);
    surfaces.set(theme, getComputedStyle(row).backgroundColor);
    wrapper.remove();
  }
  expect(surfaces.get('dark')).not.toBe(surfaces.get('light'));
});

test('card layout contains long and sparse content at every compact lane width without CSS reordering', async () => {
  expect(actionRowCss).not.toMatch(/\border\s*:/);
  for (const width of [220, 280, 360]) {
    const wrapper = document.createElement('div');
    wrapper.style.width = `${width}px`;
    document.body.append(wrapper);
    const element = await mount({
      layout: 'card',
      children: `
        <strong slot="title">A long consumer-supplied title remains readable at every lane width</strong>
        <code slot="reference">spec-kitty/a-very-long-unbroken-reference-without-a-natural-break</code>
        <time slot="metadata">2 hours ago</time>
        <span slot="supporting">Claimed by a consumer with complete visible text</span>
      `,
    });
    wrapper.append(element);
    await element.updateComplete;
    const row = partOf(element, 'row')!;
    const trigger = triggerOf(element);
    expect(row.classList.contains('sk-action-row--card')).toBe(true);
    expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
    expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth);
    expect(partOf(element, 'marker')!.hidden).toBe(true);
    expect(partOf(element, 'tags')!.hidden).toBe(true);
    expect(partOf(element, 'controls')!.hidden).toBe(true);
    expect(partOf(element, 'marker')!.getBoundingClientRect().height).toBe(0);
    expect(partOf(element, 'tags')!.getBoundingClientRect().height).toBe(0);
    wrapper.remove();
  }
});

test('the public attributes are exactly the four controlled inputs plus route and presentation', async () => {
  expect([...SkActionRow.observedAttributes].sort()).toEqual([
    'href',
    'layout',
    'presentation',
    'row-id',
    'selectable',
    'selected',
  ]);
});
