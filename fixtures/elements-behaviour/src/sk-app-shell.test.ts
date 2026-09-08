/* eslint-disable @nx/enforce-module-boundaries -- WP04 owns package entries; this WP tests its unregistered modules directly. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../packages/elements/src/app-shell/sk-app-shell.js';
import skAppShellSheet from '../../../packages/elements/src/app-shell/sk-app-shell.css.js';
import type { SkAppShell } from '../../../packages/elements/src/app-shell/sk-app-shell.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

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

test('the four legacy regions and two opt-in compact regions preserve document order', async () => {
  const el = await mount();
  const slots = Array.from(el.shadowRoot!.querySelectorAll('slot'));
  expect(slots.map((slot) => slot.name)).toEqual([
    'personal-rail',
    'context-sidebar',
    'compact-header',
    'compact-navigation',
    'page-header',
    '',
  ]);
  expect(slots.map((slot) => slot.assignedElements().map((node) => node.textContent))).toEqual([
    ['Personal'],
    ['Context'],
    [],
    [],
    ['Header'],
    ['Main'],
  ]);
  expect(part(el, 'main')?.tagName).toBe('MAIN');

  const empty = document.createElement('sk-app-shell') as SkAppShell;
  document.body.append(empty);
  await empty.updateComplete;
  expect(empty.shadowRoot!.querySelectorAll('slot')).toHaveLength(6);
  expect(Array.from(empty.shadowRoot!.querySelectorAll('slot'), (slot) => slot.assignedNodes())).toEqual([
    [], [], [], [], [], [],
  ]);
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const el = await mount();
  const style = document.createElement('style');
  style.textContent = `
    sk-app-shell::part(shell) { outline-style: dashed; }
    sk-app-shell::part(personal) { outline-style: dotted; }
    sk-app-shell::part(context) { outline-style: double; }
    sk-app-shell::part(compact-header) { outline-style: inset; }
    sk-app-shell::part(compact-navigation) { outline-style: outset; }
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
      ['compact-header', 'inset'],
      ['compact-navigation', 'outset'],
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
  expect(el.shadowRoot!.adoptedStyleSheets).toHaveLength(1);
  expect(el.shadowRoot!.adoptedStyleSheets[0]).toBe(skAppShellSheet);
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

const settleResize = async (el: SkAppShell) => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await el.updateComplete;
};

const mountCompact = async (width = 390) => {
  const frame = document.createElement('div');
  frame.style.width = `${width}px`;
  document.body.append(frame);
  const el = document.createElement('sk-app-shell') as SkAppShell;
  // Use the consumer's declarative route here so the dedicated reflection arm
  // remains surgical: layout behaviour must not depend on property reflection.
  el.setAttribute('presentation', 'compact');
  el.open = true;
  el.innerHTML = `
    <button slot="compact-header" aria-expanded="true" aria-controls="compact-navigation">Menu</button>
    <nav slot="compact-navigation" id="compact-navigation" aria-label="Repository navigation">
      <a href="#missions">Missions</a>
    </nav>
    <header slot="page-header">Header</header>
    <article>Main</article>
  `;
  frame.append(el);
  el.compactTrigger = el.querySelector('button');
  await el.updateComplete;
  await settleResize(el);
  return { el, frame, trigger: el.querySelector('button')!, link: el.querySelector('a')! };
};

const acceptEscape = async (el: SkAppShell, origin: HTMLElement) => {
  const onDismiss = () => el.open = false;
  el.addEventListener('sk-app-shell-dismiss', onDismiss, { once: true });
  origin.focus();
  origin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  await el.updateComplete;
  await Promise.resolve();
};

test('[SC-010] presentation and controlled open retain pre-upgrade assignment and reflect', async () => {
  const tag = `sk-app-shell-preupgrade-${Math.random().toString(36).slice(2)}`;
  const pending = document.createElement(tag) as SkAppShell;
  pending.presentation = 'compact';
  pending.open = true;
  const trigger = document.createElement('button');
  pending.compactTrigger = trigger;
  document.body.append(pending);

  customElements.define(tag, class extends (customElements.get('sk-app-shell') as typeof SkAppShell) {});
  await customElements.whenDefined(tag);
  await pending.updateComplete;

  expect(pending.presentation).toBe('compact');
  expect(pending.getAttribute('presentation')).toBe('compact');
  expect(pending.open).toBe(true);
  expect(pending.hasAttribute('open')).toBe(true);
  expect(pending.compactTrigger).toBe(trigger);
  expect(pending.hasAttribute('compact-trigger')).toBe(false);
});

test('[SC-010] removing the native presentation attribute restores the omitted property state', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { el, frame } = await mountCompact();
  expect(el.presentation).toBe('compact');
  expect(el.getAttribute('presentation')).toBe('compact');
  expect(el.open).toBe(true);
  expect(el.hasAttribute('open')).toBe(true);
  expect(getComputedStyle(part(el, 'personal')!).display).toBe('none');
  expect(getComputedStyle(part(el, 'context')!).display).toBe('none');
  expect(part(el, 'compact-navigation')?.hidden).toBe(false);
  el.removeAttribute('presentation');
  await el.updateComplete;

  expect.soft(el.presentation).toBe(undefined);
  expect(el.hasAttribute('presentation')).toBe(false);
  expect(el.open).toBe(true);
  expect(el.hasAttribute('open')).toBe(true);
  expect.soft(warn).not.toHaveBeenCalled();
  expect(getComputedStyle(part(el, 'personal')!).display).not.toBe('none');
  expect(getComputedStyle(part(el, 'context')!).display).not.toBe('none');
  expect(part(el, 'compact-header')?.getBoundingClientRect().width).toBe(0);
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
  el.presentation = 'compact';
  await el.updateComplete;
  expect(el.presentation).toBe('compact');
  expect(el.getAttribute('presentation')).toBe('compact');
  frame.remove();
});

test('unknown presentation warns once per real Lit transition and fails open', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const el = await mount();
  el.open = true;

  const setPresentation = async (value: string | undefined) => {
    (el as unknown as { presentation: string | undefined }).presentation = value;
    await el.updateComplete;
  };

  await setPresentation('sidebar');
  await setPresentation('sidebar');
  el.open = false;
  await el.updateComplete;
  await setPresentation('drawer');
  await setPresentation('compact');
  await setPresentation('drawer');
  await setPresentation(undefined);
  await setPresentation('drawer');

  expect(warn.mock.calls).toEqual([
    ['unknown sk-app-shell presentation "sidebar"; using legacy layout'],
    ['unknown sk-app-shell presentation "drawer"; using legacy layout'],
    ['unknown sk-app-shell presentation "drawer"; using legacy layout'],
    ['unknown sk-app-shell presentation "drawer"; using legacy layout'],
  ]);
  expect(part(el, 'personal')?.hidden).toBe(false);
  expect(part(el, 'context')?.hidden).toBe(false);
  expect(part(el, 'content')?.hidden).toBe(false);
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
});

test.each([390, 768, 860])('[SC-012] [SC-017] compact presentation is active at %ipx and closed content is inert', async (width) => {
  const { el, frame } = await mountCompact(width);
  const header = part(el, 'compact-header')!;
  const navigation = part(el, 'compact-navigation')! as HTMLElement & { inert: boolean };
  expect(getComputedStyle(header).display).not.toBe('none');
  expect(navigation.hidden).toBe(false);
  expect(navigation.inert).toBe(false);

  el.open = false;
  await el.updateComplete;
  expect(navigation.hidden).toBe(true);
  expect(navigation.inert).toBe(true);
  expect(navigation.getAttribute('aria-hidden')).toBe('true');
  frame.remove();
});

test('[SC-014] [SC-017] compact presentation ends at 861px while the controlled value is retained', async () => {
  const { el, frame } = await mountCompact(861);
  expect(el.open).toBe(true);
  expect(part(el, 'compact-header')?.getBoundingClientRect().width).toBe(0);
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);

  frame.style.width = '860px';
  await settleResize(el);
  expect(el.open).toBe(true);
  expect(part(el, 'compact-header')!.getBoundingClientRect().width).toBeGreaterThan(0);
  expect(part(el, 'compact-navigation')?.hidden).toBe(false);
});

test('[SC-012] assigned region roots follow effective exposure without losing consumer attributes', async () => {
  const frame = document.createElement('div');
  frame.style.width = '390px';
  document.body.append(frame);
  const el = document.createElement('sk-app-shell') as SkAppShell;
  el.presentation = 'compact';
  el.open = true;
  el.innerHTML = `
    <nav slot="personal-rail" inert="personal-owned" aria-hidden="false">Personal</nav>
    <aside slot="context-sidebar">Context</aside>
    <div slot="compact-header" inert aria-hidden="header-owned">Menu</div>
    <nav slot="compact-navigation" aria-hidden="false">Compact</nav>
  `;
  frame.append(el);
  await el.updateComplete;
  await settleResize(el);

  const personal = el.querySelector<HTMLElement>('[slot="personal-rail"]')!;
  const context = el.querySelector<HTMLElement>('[slot="context-sidebar"]')!;
  const compactHeader = el.querySelector<HTMLElement>('[slot="compact-header"]')!;
  const compactNavigation = el.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
  expect([
    [personal.getAttribute('inert'), personal.getAttribute('aria-hidden')],
    [context.getAttribute('inert'), context.getAttribute('aria-hidden')],
    [compactHeader.getAttribute('inert'), compactHeader.getAttribute('aria-hidden')],
    [compactNavigation.getAttribute('inert'), compactNavigation.getAttribute('aria-hidden')],
  ]).toEqual([
    ['', 'true'],
    ['', 'true'],
    ['', 'header-owned'],
    [null, 'false'],
  ]);

  el.open = false;
  await el.updateComplete;
  expect(compactHeader.getAttribute('inert')).toBe('');
  expect(compactHeader.getAttribute('aria-hidden')).toBe('header-owned');
  expect(compactNavigation.getAttribute('inert')).toBe('');
  expect(compactNavigation.getAttribute('aria-hidden')).toBe('true');

  personal.setAttribute('inert', 'consumer-write-while-suppressed');
  personal.setAttribute('aria-hidden', 'consumer-write-while-suppressed');
  expect(personal.getAttribute('inert')).toBe('consumer-write-while-suppressed');
  expect(personal.getAttribute('aria-hidden')).toBe('consumer-write-while-suppressed');

  el.presentation = undefined;
  await el.updateComplete;
  expect([
    [personal.getAttribute('inert'), personal.getAttribute('aria-hidden')],
    [context.getAttribute('inert'), context.getAttribute('aria-hidden')],
    [compactHeader.getAttribute('inert'), compactHeader.getAttribute('aria-hidden')],
    [compactNavigation.getAttribute('inert'), compactNavigation.getAttribute('aria-hidden')],
  ]).toEqual([
    ['personal-owned', 'false'],
    [null, null],
    ['', 'true'],
    ['', 'true'],
  ]);

  el.presentation = 'compact';
  el.open = true;
  await el.updateComplete;
  expect(compactHeader.getAttribute('inert')).toBe('');
  expect(compactHeader.getAttribute('aria-hidden')).toBe('header-owned');
  expect(compactNavigation.getAttribute('inert')).toBe(null);
  expect(compactNavigation.getAttribute('aria-hidden')).toBe('false');
  frame.remove();
});

test('[SC-017] assigned compact roots cross the inclusive content-box boundary at 860 and 861', async () => {
  const { el, frame, trigger } = await mountCompact(860);
  const compactNavigation = el.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
  compactNavigation.setAttribute('aria-hidden', 'consumer-navigation');

  expect(trigger.getAttribute('inert')).toBe(null);
  expect(trigger.getAttribute('aria-hidden')).toBe(null);
  expect(compactNavigation.getAttribute('inert')).toBe(null);
  expect(compactNavigation.getAttribute('aria-hidden')).toBe('consumer-navigation');
  expect(el.open).toBe(true);

  frame.style.width = '861px';
  await settleResize(el);
  expect(trigger.getAttribute('inert')).toBe('');
  expect(trigger.getAttribute('aria-hidden')).toBe('true');
  expect(compactNavigation.getAttribute('inert')).toBe('');
  expect(compactNavigation.getAttribute('aria-hidden')).toBe('true');
  expect(el.open).toBe(true);
  frame.remove();
});

test('[SC-012] slot changes restore stale roots before suppressing newly inactive direct roots', async () => {
  const { el, frame } = await mountCompact();
  const settleSlotChange = async () => {
    await Promise.resolve();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await el.updateComplete;
  };
  const compactNavigation = el.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
  compactNavigation.setAttribute('aria-hidden', 'consumer-navigation');
  compactNavigation.setAttribute('inert', 'consumer-navigation');
  el.open = false;
  await el.updateComplete;

  compactNavigation.slot = 'compact-header';
  await settleSlotChange();
  expect(compactNavigation.getAttribute('inert')).toBe('consumer-navigation');
  expect(compactNavigation.getAttribute('aria-hidden')).toBe('consumer-navigation');

  const replacement = document.createElement('section');
  replacement.slot = 'compact-navigation';
  replacement.setAttribute('aria-hidden', 'replacement-owned');
  const nestedButton = document.createElement('button');
  nestedButton.setAttribute('aria-hidden', 'nested-owned');
  replacement.append(nestedButton);
  el.append(replacement);
  await settleSlotChange();
  expect(replacement.getAttribute('inert')).toBe('');
  expect(replacement.getAttribute('aria-hidden')).toBe('true');
  expect(nestedButton.getAttribute('inert')).toBe(null);
  expect(nestedButton.getAttribute('aria-hidden')).toBe('nested-owned');

  const personal = document.createElement('nav');
  personal.slot = 'personal-rail';
  el.append(personal);
  await settleSlotChange();
  expect(personal.getAttribute('inert')).toBe('');
  expect(personal.getAttribute('aria-hidden')).toBe('true');

  const context = document.createElement('aside');
  context.slot = 'context-sidebar';
  el.append(context);
  await settleSlotChange();
  expect(context.getAttribute('inert')).toBe('');
  expect(context.getAttribute('aria-hidden')).toBe('true');

  replacement.remove();
  await settleSlotChange();
  expect(replacement.getAttribute('inert')).toBe(null);
  expect(replacement.getAttribute('aria-hidden')).toBe('replacement-owned');

  compactNavigation.removeAttribute('slot');
  await settleSlotChange();
  expect(compactNavigation.getAttribute('inert')).toBe('consumer-navigation');
  expect(compactNavigation.getAttribute('aria-hidden')).toBe('consumer-navigation');

  el.presentation = undefined;
  await el.updateComplete;
  const compactHeader = document.createElement('div');
  compactHeader.slot = 'compact-header';
  el.append(compactHeader);
  await settleSlotChange();
  expect(compactHeader.getAttribute('inert')).toBe('');
  expect(compactHeader.getAttribute('aria-hidden')).toBe('true');
  frame.remove();
});

test('[SC-012] disconnect restores assigned roots and reconnect reapplies current inactive exposure', async () => {
  const { el, frame } = await mountCompact();
  el.open = false;
  await el.updateComplete;
  const compactNavigation = el.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
  expect(compactNavigation.getAttribute('inert')).toBe('');
  expect(compactNavigation.getAttribute('aria-hidden')).toBe('true');

  el.remove();
  expect(compactNavigation.getAttribute('inert')).toBe(null);
  expect(compactNavigation.getAttribute('aria-hidden')).toBe(null);
  el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="compact-navigation"]')!
    .dispatchEvent(new Event('slotchange'));
  expect(compactNavigation.getAttribute('inert')).toBe(null);
  expect(compactNavigation.getAttribute('aria-hidden')).toBe(null);

  frame.append(el);
  expect(compactNavigation.getAttribute('inert')).toBe('');
  expect(compactNavigation.getAttribute('aria-hidden')).toBe('true');
  await el.updateComplete;
  await settleResize(el);
  expect(compactNavigation.getAttribute('inert')).toBe('');
  expect(compactNavigation.getAttribute('aria-hidden')).toBe('true');

  el.remove();
  expect(compactNavigation.getAttribute('inert')).toBe(null);
  expect(compactNavigation.getAttribute('aria-hidden')).toBe(null);
  frame.remove();
});

test('[SC-012] an inactive shell inherits the original exposure lease across move, disconnect, and reconnect', async () => {
  const frame = document.createElement('div');
  frame.style.width = '390px';
  document.body.append(frame);

  const first = document.createElement('sk-app-shell') as SkAppShell;
  first.presentation = 'compact';
  first.open = false;
  const roots = [
    document.createElement('nav'),
    document.createElement('nav'),
    document.createElement('nav'),
    document.createElement('nav'),
  ];
  for (const root of roots) root.slot = 'compact-navigation';
  roots[1]!.setAttribute('inert', '');
  roots[1]!.setAttribute('aria-hidden', '');
  roots[2]!.setAttribute('inert', 'consumer-inert');
  roots[2]!.setAttribute('aria-hidden', 'consumer-hidden');
  roots[3]!.setAttribute('inert', 'false');
  roots[3]!.setAttribute('aria-hidden', 'false');
  first.append(...roots);
  frame.append(first);
  await first.updateComplete;
  await settleResize(first);

  const exposure = () => roots.map((root) => [
    root.getAttribute('inert'),
    root.getAttribute('aria-hidden'),
  ]);
  const original = [
    [null, null],
    ['', ''],
    ['consumer-inert', 'consumer-hidden'],
    ['false', 'false'],
  ];
  expect(exposure()).toEqual(roots.map(() => ['', 'true']));

  const second = document.createElement('sk-app-shell') as SkAppShell;
  second.presentation = 'compact';
  second.open = false;
  frame.append(second);
  await second.updateComplete;
  await settleResize(second);
  second.remove();

  second.append(...roots);
  frame.append(second);
  expect(exposure()).toEqual(roots.map(() => ['', 'true']));

  first.remove();
  expect(exposure()).toEqual(roots.map(() => ['', 'true']));

  await settleResize(first);
  await settleResize(second);
  expect(exposure()).toEqual(roots.map(() => ['', 'true']));

  second.open = true;
  await second.updateComplete;
  expect(exposure()).toEqual(original);
  frame.remove();
});

test('[SC-012] an active destination shell releases a stale exposure lease before the old owner reconciles', async () => {
  const frame = document.createElement('div');
  frame.style.width = '390px';
  document.body.append(frame);
  const first = document.createElement('sk-app-shell') as SkAppShell;
  first.presentation = 'compact';
  first.open = false;
  const root = document.createElement('nav');
  root.slot = 'compact-navigation';
  root.setAttribute('inert', 'false');
  root.setAttribute('aria-hidden', 'consumer-visible');
  first.append(root);
  frame.append(first);
  await first.updateComplete;
  await settleResize(first);
  expect([root.getAttribute('inert'), root.getAttribute('aria-hidden')]).toEqual(['', 'true']);

  const second = document.createElement('sk-app-shell') as SkAppShell;
  second.presentation = 'compact';
  second.open = true;
  frame.append(second);
  await second.updateComplete;
  await settleResize(second);
  second.remove();
  second.append(root);
  frame.append(second);

  expect([root.getAttribute('inert'), root.getAttribute('aria-hidden')])
    .toEqual(['false', 'consumer-visible']);
  await settleResize(first);
  await settleResize(second);
  expect([root.getAttribute('inert'), root.getAttribute('aria-hidden')])
    .toEqual(['false', 'consumer-visible']);
  frame.remove();
});

test('[SC-006] [SC-007] [SC-008] [SC-012] Escape emits one exact dismissal intent and accepted close restores focus after render', async () => {
  const { el, trigger, link } = await mountCompact();
  const events: CustomEvent[] = [];
  el.addEventListener('sk-app-shell-dismiss', (event) => {
    events.push(event as CustomEvent);
    expect(part(el, 'compact-navigation')?.hidden).toBe(false);
    el.open = false;
  });
  link.focus();
  link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));

  expect(events).toHaveLength(1);
  expect(events[0]?.detail).toEqual({ reason: 'escape' });
  expect(events[0]?.bubbles).toBe(true);
  expect(events[0]?.composed).toBe(true);
  expect(events[0]?.cancelable).toBe(false);
  expect(el.open).toBe(false);
  expect(document.activeElement).toBe(link);
  await el.updateComplete;
  await Promise.resolve();
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
  expect(document.activeElement).toBe(trigger);
});

test('[SC-006] nested shells assign one composed Escape to the nearest effectively-open shell', async () => {
  const frame = document.createElement('div');
  frame.style.width = '390px';
  document.body.append(frame);
  const outer = document.createElement('sk-app-shell') as SkAppShell;
  const inner = document.createElement('sk-app-shell') as SkAppShell;
  for (const [shell, id] of [[outer, 'outer-navigation'], [inner, 'inner-navigation']] as const) {
    shell.presentation = 'compact';
    shell.open = true;
    shell.innerHTML = `
      <button slot="compact-header" aria-controls="${id}">Menu</button>
      <nav slot="compact-navigation" id="${id}"><a href="#${id}">${id}</a></nav>
    `;
  }
  outer.append(inner);
  frame.append(outer);
  await outer.updateComplete;
  await inner.updateComplete;
  await settleResize(outer);
  await settleResize(inner);

  const emissions: Element[] = [];
  let propagatedEscapes = 0;
  outer.addEventListener('sk-app-shell-dismiss', (event) => emissions.push(event.target as Element));
  outer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') propagatedEscapes += 1;
  });
  inner.querySelector('a')!.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );
  expect(emissions.filter((target) => target === inner)).toHaveLength(1);
  expect(emissions.filter((target) => target === outer)).toHaveLength(0);
  expect(propagatedEscapes).toBe(1);

  emissions.length = 0;
  inner.open = false;
  await inner.updateComplete;
  inner.querySelector('a')!.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );
  expect(emissions.filter((target) => target === inner)).toHaveLength(0);
  expect(emissions.filter((target) => target === outer)).toHaveLength(1);
  expect(propagatedEscapes).toBe(2);

  emissions.length = 0;
  outer.querySelector<HTMLAnchorElement>(':scope > [slot="compact-navigation"] a')!.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );
  expect(emissions.filter((target) => target === outer)).toHaveLength(1);
  expect(propagatedEscapes).toBe(3);
  frame.remove();
});

test('[SC-012] ordinary controlled close releases focus from hidden compact navigation without restoring the trigger', async () => {
  const { el, trigger, link } = await mountCompact();
  const navigation = el.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
  link.focus();
  expect(document.activeElement).toBe(link);

  el.open = false;
  await el.updateComplete;

  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
  expect(navigation.contains(document.activeElement)).toBe(false);
  expect(document.activeElement).not.toBe(trigger);

  el.open = true;
  await el.updateComplete;
  link.focus();
  link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  await el.updateComplete;
  expect(el.open).toBe(true);

  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  el.open = false;
  await el.updateComplete;
  expect(navigation.contains(document.activeElement)).toBe(false);
  expect(document.activeElement).not.toBe(trigger);
});

test('[SC-010] Escape never mutates open and rejected dismissal cannot steal focus on a later route close', async () => {
  const { el, trigger, link } = await mountCompact();
  el.addEventListener('sk-app-shell-dismiss', () => undefined);
  link.focus();
  link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  await el.updateComplete;
  expect(el.open).toBe(true);

  el.open = false;
  await el.updateComplete;
  expect(document.activeElement).not.toBe(trigger);

  el.open = true;
  await el.updateComplete;
  el.compactTrigger = trigger;
  trigger.remove();
  link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  el.open = false;
  await el.updateComplete;
  expect(document.activeElement).not.toBe(trigger);
});

test('[SC-012] accepted dismissal does not focus a trigger without a same-root navigation target', async () => {
  const { el, trigger, link } = await mountCompact();
  trigger.setAttribute('aria-controls', 'outside-this-shell');
  el.addEventListener('sk-app-shell-dismiss', () => el.open = false);
  link.focus();
  link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  await el.updateComplete;
  await Promise.resolve();
  expect(document.activeElement).not.toBe(trigger);
});

test('[SC-012] accepted dismissal requires real compact-header and compact-navigation assignment', async () => {
  const { el, trigger, link } = await mountCompact();
  const navigation = el.querySelector<HTMLElement>('[slot="compact-navigation"]')!;

  const falseHeader = document.createElement('section');
  trigger.replaceWith(falseHeader);
  falseHeader.append(trigger);
  expect(trigger.assignedSlot).toBe(null);
  await acceptEscape(el, link);
  expect(document.activeElement).not.toBe(trigger);

  const validHeader = document.createElement('section');
  validHeader.slot = 'compact-header';
  falseHeader.replaceWith(validHeader);
  trigger.removeAttribute('slot');
  validHeader.append(trigger);
  el.open = true;
  await el.updateComplete;
  await acceptEscape(el, link);
  expect(document.activeElement).toBe(trigger);

  const falseNavigation = document.createElement('section');
  navigation.replaceWith(falseNavigation);
  falseNavigation.append(navigation);
  navigation.slot = 'compact-navigation';
  expect(navigation.assignedSlot).toBe(null);
  el.open = true;
  await el.updateComplete;
  await acceptEscape(el, link);
  expect(document.activeElement).not.toBe(trigger);
});

test('[SC-012] cross-shell and cross-root controlled targets cannot receive focus-return authority', async () => {
  const { el, trigger, link } = await mountCompact();
  const ownNavigation = el.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
  ownNavigation.removeAttribute('id');

  const otherShell = document.createElement('sk-app-shell') as SkAppShell;
  otherShell.innerHTML = '<nav slot="compact-navigation" id="cross-shell-navigation"></nav>';
  document.body.append(otherShell);
  await otherShell.updateComplete;
  trigger.setAttribute('aria-controls', 'cross-shell-navigation');
  await acceptEscape(el, link);
  expect(document.activeElement).not.toBe(trigger);

  const shadowHost = document.createElement('div');
  shadowHost.attachShadow({ mode: 'open' }).innerHTML =
    '<nav id="cross-root-navigation" slot="compact-navigation"></nav>';
  document.body.append(shadowHost);
  trigger.setAttribute('aria-controls', 'cross-root-navigation');
  el.open = true;
  await el.updateComplete;
  await acceptEscape(el, link);
  expect(document.activeElement).not.toBe(trigger);
});

test('[SC-012] [SC-017] JavaScript uses the CSS content-box boundary for effective open', async () => {
  const { el, frame, link } = await mountCompact();
  el.style.boxSizing = 'border-box';
  el.style.paddingInline = '1px';
  el.style.width = '862px';
  await settleResize(el);

  const contentInlineSize = () =>
    el.clientWidth - Number.parseFloat(getComputedStyle(el).paddingLeft)
      - Number.parseFloat(getComputedStyle(el).paddingRight);
  expect(contentInlineSize()).toBe(860);
  expect(getComputedStyle(part(el, 'compact-header')!).display).not.toBe('none');
  expect(part(el, 'compact-navigation')?.hidden).toBe(false);

  let dismissals = 0;
  el.addEventListener('sk-app-shell-dismiss', () => dismissals += 1);
  link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  expect(dismissals).toBe(1);

  el.style.width = '863px';
  await settleResize(el);
  expect(contentInlineSize()).toBe(861);
  expect(getComputedStyle(part(el, 'compact-header')!).display).toBe('none');
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
  link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  expect(dismissals).toBe(1);
  expect(el.open).toBe(true);
  frame.remove();
});

test('[SC-012] [SC-017] vertical writing uses logical inline-size for CSS placement, exposure, and Escape', async () => {
  const { el, frame, link, trigger } = await mountCompact();
  const personal = document.createElement('nav');
  personal.slot = 'personal-rail';
  el.append(personal);
  el.style.writingMode = 'vertical-rl';
  el.style.blockSize = '390px';
  el.style.inlineSize = '860px';
  await settleResize(el);

  const compactNavigation = el.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
  let dismissals = 0;
  el.addEventListener('sk-app-shell-dismiss', () => dismissals += 1);
  expect(getComputedStyle(part(el, 'compact-header')!).display).not.toBe('none');
  expect(getComputedStyle(part(el, 'compact-navigation')!).display).not.toBe('none');
  expect(part(el, 'compact-navigation')?.hidden).toBe(false);
  expect([personal.getAttribute('inert'), personal.getAttribute('aria-hidden')]).toEqual(['', 'true']);
  expect([trigger.getAttribute('inert'), trigger.getAttribute('aria-hidden')]).toEqual([null, null]);
  expect([compactNavigation.getAttribute('inert'), compactNavigation.getAttribute('aria-hidden')])
    .toEqual([null, null]);
  link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  expect(dismissals).toBe(1);

  el.style.inlineSize = '861px';
  await settleResize(el);
  expect(getComputedStyle(part(el, 'compact-header')!).display).toBe('none');
  expect(getComputedStyle(part(el, 'compact-navigation')!).display).toBe('none');
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
  expect([personal.getAttribute('inert'), personal.getAttribute('aria-hidden')]).toEqual([null, null]);
  expect([trigger.getAttribute('inert'), trigger.getAttribute('aria-hidden')]).toEqual(['', 'true']);
  expect([compactNavigation.getAttribute('inert'), compactNavigation.getAttribute('aria-hidden')])
    .toEqual(['', 'true']);
  link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  expect(dismissals).toBe(1);
  expect(el.open).toBe(true);
  frame.remove();
});

test('[SC-012] presentation changes release focus hidden in compact navigation without changing open', async () => {
  const { el, link } = await mountCompact();
  link.focus();
  expect(document.activeElement).toBe(link);

  el.presentation = undefined;
  await el.updateComplete;

  expect(el.open).toBe(true);
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
  expect(document.activeElement).not.toBe(link);
});

test('Escape emits nothing for absent, unknown, desktop, or controlled-closed compact state', async () => {
  const { el, frame, link } = await mountCompact();
  let count = 0;
  el.addEventListener('sk-app-shell-dismiss', () => count += 1);
  const escape = () => link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));

  el.open = false;
  await el.updateComplete;
  escape();
  el.open = true;
  el.presentation = undefined;
  await el.updateComplete;
  escape();
  (el as unknown as { presentation: string }).presentation = 'wide';
  await el.updateComplete;
  escape();
  el.presentation = 'compact';
  frame.style.width = '861px';
  await settleResize(el);
  escape();

  expect(count).toBe(0);
  expect(el.open).toBe(true);
});

const mountRailPreserving = async (width = 1024) => {
  const frame = document.createElement('div');
  frame.style.width = `${width}px`;
  document.body.append(frame);
  const el = document.createElement('sk-app-shell') as SkAppShell;
  el.presentation = 'rail-preserving';
  el.open = true;
  el.innerHTML = `
    <nav slot="personal-rail" aria-label="Product areas"><a href="#work">Work</a></nav>
    <aside slot="context-sidebar" aria-label="Current workspace"><a href="#overview">Overview</a></aside>
    <div slot="compact-header"><button aria-expanded="true" aria-controls="rail-navigation">Menu</button></div>
    <nav slot="compact-navigation" id="rail-navigation" aria-label="Repository navigation">
      <a href="#missions">Missions</a>
    </nav>
    <header slot="page-header">Header</header>
    <article>Main</article>
  `;
  frame.append(el);
  el.compactTrigger = el.querySelector('button');
  await el.updateComplete;
  await settleResize(el);
  return {
    el,
    frame,
    personal: el.querySelector<HTMLElement>('[slot="personal-rail"]')!,
    context: el.querySelector<HTMLElement>('[slot="context-sidebar"]')!,
    trigger: el.querySelector<HTMLButtonElement>('button')!,
    navigation: el.querySelector<HTMLElement>('[slot="compact-navigation"]')!,
    link: el.querySelector<HTMLAnchorElement>('[slot="compact-navigation"] a')!,
  };
};

test('[SC-010] rail-preserving survives pre-upgrade assignment, reflects, and removes to undefined', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const tag = `sk-app-shell-rail-preupgrade-${Math.random().toString(36).slice(2)}`;
  const pending = document.createElement(tag) as SkAppShell;
  pending.presentation = 'rail-preserving';
  pending.open = true;
  document.body.append(pending);

  customElements.define(tag, class extends (customElements.get('sk-app-shell') as typeof SkAppShell) {});
  await customElements.whenDefined(tag);
  await pending.updateComplete;

  expect(pending.presentation).toBe('rail-preserving');
  expect(pending.getAttribute('presentation')).toBe('rail-preserving');
  expect(pending.open).toBe(true);
  pending.removeAttribute('presentation');
  await pending.updateComplete;
  expect(pending.presentation).toBe(undefined);
  expect(pending.hasAttribute('presentation')).toBe(false);
  expect(warn).not.toHaveBeenCalled();
  pending.remove();
});

test.each([1100, 1024, 768, 390])(
  '[SC-012] [SC-017] rail-preserving is effective at %ipx, retains personal, and suppresses context',
  async (width) => {
    const { el, frame, personal, context, trigger, navigation } = await mountRailPreserving(width);
    expect(getComputedStyle(part(el, 'personal')!).display).not.toBe('none');
    expect(Math.round(part(el, 'personal')!.getBoundingClientRect().width)).toBe(56);
    expect(getComputedStyle(part(el, 'context')!).display).toBe('none');
    expect(getComputedStyle(part(el, 'compact-header')!).display).not.toBe('none');
    expect(part(el, 'compact-navigation')?.hidden).toBe(false);
    expect([personal.getAttribute('inert'), personal.getAttribute('aria-hidden')]).toEqual([null, null]);
    expect([context.getAttribute('inert'), context.getAttribute('aria-hidden')]).toEqual(['', 'true']);
    expect([trigger.parentElement!.getAttribute('inert'), trigger.parentElement!.getAttribute('aria-hidden')])
      .toEqual([null, null]);
    expect([navigation.getAttribute('inert'), navigation.getAttribute('aria-hidden')]).toEqual([null, null]);
    frame.remove();
  },
);

test('[SC-012] [SC-017] rail-preserving ends at 1101px and restores exact consumer exposure', async () => {
  const { el, frame, personal, context, trigger, navigation } = await mountRailPreserving(1100);
  context.setAttribute('aria-hidden', 'consumer-context');
  navigation.setAttribute('aria-hidden', 'consumer-navigation');
  await el.updateComplete;
  expect(getComputedStyle(part(el, 'context')!).display).toBe('none');

  frame.style.width = '1101px';
  await settleResize(el);
  expect(el.open).toBe(true);
  expect(getComputedStyle(part(el, 'personal')!).display).not.toBe('none');
  expect(getComputedStyle(part(el, 'context')!).display).not.toBe('none');
  expect(getComputedStyle(part(el, 'compact-header')!).display).toBe('none');
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
  expect([personal.getAttribute('inert'), personal.getAttribute('aria-hidden')]).toEqual([null, null]);
  expect([context.getAttribute('inert'), context.getAttribute('aria-hidden')]).toEqual([null, null]);
  expect([trigger.parentElement!.getAttribute('inert'), trigger.parentElement!.getAttribute('aria-hidden')])
    .toEqual(['', 'true']);
  expect([navigation.getAttribute('inert'), navigation.getAttribute('aria-hidden')]).toEqual(['', 'true']);
  frame.remove();
});

test('[SC-006] [SC-012] rail-preserving reuses accepted Escape dismissal and focus return', async () => {
  const { el, frame, trigger, link } = await mountRailPreserving();
  await acceptEscape(el, link);
  expect(el.open).toBe(false);
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
  expect(document.activeElement).toBe(trigger);
  frame.remove();
});

test('[SC-012] presentation transitions release focus only when the destination becomes hidden', async () => {
  const retained = await mountRailPreserving(768);
  retained.link.focus();
  retained.el.presentation = 'compact';
  await retained.el.updateComplete;
  expect(part(retained.el, 'compact-navigation')?.hidden).toBe(false);
  expect(document.activeElement).toBe(retained.link);
  retained.frame.remove();

  const released = await mountRailPreserving(1024);
  released.link.focus();
  released.el.presentation = 'compact';
  await released.el.updateComplete;
  expect(part(released.el, 'compact-navigation')?.hidden).toBe(true);
  expect(document.activeElement).not.toBe(released.link);
  expect(released.el.open).toBe(true);
  released.frame.remove();
});

test('[SC-012] [SC-017] rail-preserving uses logical content-box size in vertical writing mode', async () => {
  const { el, frame, personal, context } = await mountRailPreserving();
  el.style.writingMode = 'vertical-rl';
  el.style.blockSize = '390px';
  el.style.inlineSize = '1100px';
  await settleResize(el);
  expect(getComputedStyle(part(el, 'personal')!).display).not.toBe('none');
  expect(getComputedStyle(part(el, 'context')!).display).toBe('none');
  expect([personal.getAttribute('inert'), personal.getAttribute('aria-hidden')]).toEqual([null, null]);
  expect([context.getAttribute('inert'), context.getAttribute('aria-hidden')]).toEqual(['', 'true']);

  el.style.inlineSize = '1101px';
  await settleResize(el);
  expect(getComputedStyle(part(el, 'context')!).display).not.toBe('none');
  expect([context.getAttribute('inert'), context.getAttribute('aria-hidden')]).toEqual([null, null]);
  frame.remove();
});

test('[SC-012] [SC-017] rail-preserving uses the CSS content-box boundary with border-box padding', async () => {
  const { el, frame, link } = await mountRailPreserving();
  el.style.boxSizing = 'border-box';
  el.style.paddingInline = '1px';
  el.style.width = '1102px';
  await settleResize(el);
  const contentInlineSize = () =>
    el.clientWidth - Number.parseFloat(getComputedStyle(el).paddingLeft)
      - Number.parseFloat(getComputedStyle(el).paddingRight);
  expect(contentInlineSize()).toBe(1100);
  expect(part(el, 'compact-navigation')?.hidden).toBe(false);

  el.style.width = '1103px';
  link.focus();
  await settleResize(el);
  expect(contentInlineSize()).toBe(1101);
  expect(part(el, 'compact-navigation')?.hidden).toBe(true);
  expect(document.activeElement).not.toBe(link);
  expect(el.open).toBe(true);
  frame.remove();
});

test('[SC-012] rail-preserving restores dynamic and disconnected context roots exactly', async () => {
  const { el, frame, context } = await mountRailPreserving();
  el.presentation = undefined;
  await el.updateComplete;
  context.setAttribute('inert', 'consumer-context');
  context.setAttribute('aria-hidden', 'consumer-context');
  el.presentation = 'rail-preserving';
  await el.updateComplete;
  expect([context.getAttribute('inert'), context.getAttribute('aria-hidden')]).toEqual(['', 'true']);

  el.remove();
  expect([context.getAttribute('inert'), context.getAttribute('aria-hidden')])
    .toEqual(['consumer-context', 'consumer-context']);
  frame.append(el);
  await el.updateComplete;
  expect([context.getAttribute('inert'), context.getAttribute('aria-hidden')]).toEqual(['', 'true']);

  context.slot = '';
  await Promise.resolve();
  await settleResize(el);
  expect([context.getAttribute('inert'), context.getAttribute('aria-hidden')])
    .toEqual(['consumer-context', 'consumer-context']);

  const replacement = document.createElement('aside');
  replacement.slot = 'context-sidebar';
  replacement.setAttribute('aria-hidden', 'replacement-context');
  el.append(replacement);
  await Promise.resolve();
  await settleResize(el);
  expect([replacement.getAttribute('inert'), replacement.getAttribute('aria-hidden')])
    .toEqual(['', 'true']);
  frame.remove();
  expect([replacement.getAttribute('inert'), replacement.getAttribute('aria-hidden')])
    .toEqual([null, 'replacement-context']);
});

test('[SC-006] nested rail-preserving shells assign Escape to the nearest effective shell', async () => {
  const outer = await mountRailPreserving();
  const inner = document.createElement('sk-app-shell') as SkAppShell;
  inner.presentation = 'rail-preserving';
  inner.open = true;
  inner.innerHTML = `
    <div slot="compact-header"><button aria-controls="inner-navigation">Inner menu</button></div>
    <nav slot="compact-navigation" id="inner-navigation"><a href="#inner">Inner</a></nav>
  `;
  outer.el.querySelector('article')!.append(inner);
  await inner.updateComplete;
  await settleResize(inner);
  const emissions: Element[] = [];
  outer.el.addEventListener('sk-app-shell-dismiss', (event) => emissions.push(event.target as Element));
  inner.querySelector('a')!.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );
  expect(emissions).toEqual([inner]);
  outer.frame.remove();
});

test('[SC-017] generated rail-preserving CSS pins logical threshold, token geometry, and forced colors', () => {
  const cssText = Array.from(skAppShellSheet.cssRules, (rule) => rule.cssText).join('\n');
  expect(cssText).toContain('@container (max-inline-size: 1100px)');
  expect(cssText).toMatch(
    /grid-template-columns:\s*var\(--sk-layout-personal-rail-width\)\s*minmax\(0, 1fr\)/,
  );
  expect(cssText).toContain('@media (forced-colors: active)');
  expect(cssText).toContain(':host([presentation="rail-preserving"])');
});
