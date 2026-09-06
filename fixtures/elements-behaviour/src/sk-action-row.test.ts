import { beforeEach, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import '@spec-kitty/elements';
import { SkActionRow, skActionRowSheet, type ActionRowActivateDetail } from '@spec-kitty/elements';
// eslint-disable-next-line @nx/enforce-module-boundaries -- raw authored CSS is the accessibility-contract test subject
import actionRowCss from '../../../packages/styles/src/action-row/sk-action-row.css?raw';
import { assertThemesDiffered, contrast } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

type ActionRow = SkActionRow & { updateComplete: Promise<unknown> };

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
  children = content,
}: {
  rowId?: string | undefined;
  selectable?: boolean;
  selected?: boolean;
  children?: string;
} = {}): Promise<ActionRow> => {
  const element = document.createElement('sk-action-row') as ActionRow;
  element.rowId = rowId;
  element.selectable = selectable;
  element.selected = selected;
  element.innerHTML = children;
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const partOf = (element: Element, name: string) =>
  element.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

const triggerOf = (element: Element) => partOf(element, 'trigger') as HTMLButtonElement;

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
  expect(projected).toEqual(['marker', 'title', 'reference', 'tags', 'metadata']);
  expect(trigger.tagName).toBe('BUTTON');
  expect(trigger.type).toBe('button');

  const controls = partOf(element, 'controls')!;
  expect(trigger.contains(controls)).toBe(false);
  expect(trigger.parentElement).toBe(controls.parentElement);
  expect(controls.querySelector('slot')?.getAttribute('name')).toBe('controls');
  expect(element.shadowRoot!.textContent!.trim()).toBe('');
});

test('non-selectable and blank-ID rows fail closed without false interaction affordance', async () => {
  for (const options of [
    { rowId: 'row-17', selectable: false },
    { rowId: '', selectable: true },
    { rowId: ' \t ', selectable: true },
  ]) {
    const element = await mount(options);
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
  }
});

test('[SC-006] native pointer, Enter, Space, and held-key sequences each request activation once', async () => {
  const element = await mount();
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

  const keydowns: Array<{
    key: string;
    repeat: boolean;
    defaultPrevented: boolean;
  }> = [];
  trigger.addEventListener('keydown', (event) => {
    keydowns.push({
      key: event.key,
      repeat: event.repeat,
      defaultPrevented: event.defaultPrevented,
    });
  });
  await userEvent.keyboard('{Enter>2/}');
  expect(events).toHaveLength(4);
  expect(keydowns).toContainEqual({
    key: 'Enter',
    repeat: true,
    defaultPrevented: true,
  });

  keydowns.length = 0;
  await userEvent.keyboard('{Space>2/}');
  expect(events).toHaveLength(5);
  expect(keydowns).toContainEqual({
    key: ' ',
    repeat: true,
    defaultPrevented: true,
  });
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
  for (const selectable of [true, false]) {
    const element = await mount({ selectable, selected: true });
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
  }
});

test('native and custom trailing controls remain independently operable and emit no row event', async () => {
  const element = await mount();
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

test('[SC-010] row properties assigned before definition survive upgrade and drive both render branches', async () => {
  const element = document.createElement('sk-action-row-late') as ActionRow;
  element.rowId = 'late-row';
  element.selectable = true;
  element.selected = true;
  element.innerHTML = '<strong slot="title">Late row</strong>';
  document.body.append(element);
  customElements.define('sk-action-row-late', class extends SkActionRow {});
  await customElements.whenDefined('sk-action-row-late');
  await element.updateComplete;

  expect({
    rowId: element.rowId,
    selectable: element.selectable,
    selected: element.selected,
  }).toEqual({
    rowId: 'late-row',
    selectable: true,
    selected: true,
  });
  expect(element.getAttribute('row-id')).toBe('late-row');
  expect(element.hasAttribute('selectable')).toBe(true);
  expect(element.hasAttribute('selected')).toBe(true);
  expect(triggerOf(element).tagName).toBe('BUTTON');
  expect(partOf(element, 'row')?.getAttribute('aria-current')).toBe('true');

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
  expect(cases).toHaveLength(8);
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
      ['hover', 'button.sk-action-row__trigger:hover'],
      ['pressed', 'button.sk-action-row__trigger:active'],
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
  const hover = styleRuleFor(forcedColors!, 'button.sk-action-row__trigger:hover')!;
  const pressed = styleRuleFor(forcedColors!, 'button.sk-action-row__trigger:active')!;
  const focus = styleRuleFor(forcedColors!, 'button.sk-action-row__trigger:focus-visible')!;
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

test('the public attributes are exactly the three controlled inputs', async () => {
  expect([...SkActionRow.observedAttributes].sort()).toEqual(['row-id', 'selectable', 'selected']);
});
