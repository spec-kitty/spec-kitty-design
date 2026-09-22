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
  expect(el.shadowRoot!.adoptedStyleSheets).toHaveLength(1);
  expect(el.shadowRoot!.adoptedStyleSheets[0]).toBe(skPageHeaderSheet);
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

/* ════════════════════════════════════════════════════════════════════════════
   #182 — the compact density axis and the sticky axis.
   ════════════════════════════════════════════════════════════════════════════ */

const SLOT_CONTENT = `
  <span slot="eyebrow">Overview</span>
  <h2 slot="title">Delivery summary</h2>
  <p slot="supporting">Current evidence and activity.</p>
  <span slot="sync">Updated 12 seconds ago</span>
  <button slot="actions" type="button">Refresh</button>
`;

const mountAxes = async (
  density?: string,
  sticky = false,
  parent: HTMLElement = document.body,
): Promise<SkPageHeader> => {
  const el = document.createElement('sk-page-header') as SkPageHeader;
  el.innerHTML = SLOT_CONTENT;
  if (density !== undefined) el.setAttribute('density', density);
  if (sticky) el.setAttribute('sticky', '');
  parent.append(el);
  await el.updateComplete;
  return el;
};

/**
 * Reads ONE declaration out of the ADOPTED sheet, optionally from inside an at-rule block.
 *
 * WHY A SHEET READ AT ALL, since the weaker form needs the stronger justification. Two of the
 * three things this file has to assert about stickiness cannot be observed live in this lane,
 * and for opposite reasons:
 *
 *   - the lane runs at a 414px viewport (measured, and already relied on by sk-grid.test.ts,
 *     which asserts `matchMedia('(max-width: 720px)').matches` is true), so the width drop block
 *     is ALWAYS active here and `position: sticky` never computes;
 *   - resizing to escape it is the repair sk-grid.test.ts records CI rejecting twice — WebKit
 *     does not re-evaluate a media block inside an ADOPTED CONSTRUCTED stylesheet after a
 *     viewport change, and neither waiting on `matchMedia` nor polling the computed value moved
 *     it.
 *
 * So: the DECLARATIONS are asserted here, the width drop is additionally measured live below
 * (the lane is on the dropped side of it), and that a real browser APPLIES `position: sticky`
 * above the threshold — in three engines, at a desktop viewport, with a real scroll — is proved
 * in `apps/storybook/src/tests/sk-page-header-sticky.spec.ts`, exactly as sk-grid-layout.spec.ts
 * does for the grid's columns.
 *
 * DIFFERENT FROM sk-grid.test.ts's VERSION IN ONE WAY, deliberately: an empty value is not
 * counted as a match. That version pushes one entry for every rule carrying the selector,
 * whether or not it declares the property — correct for a sheet with one rule per selector, and
 * wrong the moment a selector legitimately appears in two rules. The ambiguity refusal is kept
 * for the reason that version gives: a later duplicate silently wins in a browser, so a sheet
 * with two live declarations must fail the read rather than have its first one believed.
 */
const declarationIn = (
  sheet: CSSStyleSheet,
  selector: string,
  property: string,
  condition?: string,
): string | undefined => {
  const matches: string[] = [];
  const collect = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue;
      if (!rule.selectorText.split(',').map((x) => x.trim()).includes(selector)) continue;
      const value = rule.style.getPropertyValue(property).trim();
      if (value !== '') matches.push(value);
    }
  };
  if (condition === undefined) {
    collect(sheet.cssRules);
  } else {
    for (const rule of Array.from(sheet.cssRules)) {
      if (!(rule instanceof CSSMediaRule)) continue;
      if (rule.conditionText.replace(/\s+/g, '') !== condition.replace(/\s+/g, '')) continue;
      collect(rule.cssRules);
    }
  }
  if (matches.length > 1) {
    throw new Error(
      `${selector} declares ${property} ${matches.length}× ` +
        `${condition ? `inside ${condition} ` : ''}(${matches.map((m) => JSON.stringify(m)).join(', ')}). ` +
        'A later duplicate silently wins in a browser, so this sheet is ambiguous.',
    );
  }
  return matches[0];
};

test('the compact form resolves from the same five slots, in the same order, as the default', async () => {
  const dense = await mountAxes();
  const compact = await mountAxes('compact');
  const shape = (el: SkPageHeader) =>
    Array.from(el.shadowRoot!.querySelectorAll('slot'), (slot) => [
      slot.name,
      slot.assignedElements().map((node) => node.textContent?.trim()),
    ]);
  // THE WHOLE POINT OF THE MISSION, asserted as identity rather than as a count: the compact
  // header is not a second header. If a future edit rendered a different tree at compact
  // density — the drift observed in the source dashboard — this is what reds.
  expect(shape(compact)).toEqual(shape(dense));
  expect(shape(compact)).toHaveLength(5);
  // The rendered TREE is identical too — same elements, same parts, same order. Only the
  // modifier class differs, which is what "one header, two densities" has to mean.
  const tree = (el: SkPageHeader) =>
    Array.from(el.shadowRoot!.querySelectorAll('[part]'), (node) =>
      `${node.tagName}[${node.getAttribute('part')}]`);
  expect(tree(compact)).toEqual(tree(dense));
  const headerClass = (el: SkPageHeader) =>
    (el.shadowRoot!.querySelector('[part="header"]') as HTMLElement).className;
  expect(headerClass(dense)).toBe('sk-page-header');
  expect(headerClass(compact)).toBe('sk-page-header sk-page-header--compact');
});

test('the two axes are orthogonal across all four combinations', async () => {
  // ONE OBSERVABLE PER AXIS, each chosen because the OTHER axis does not touch it.
  //
  //   density -> the block padding of the header box. A real computed length, not a class name:
  //              a modifier that applied no style would satisfy a classList assertion.
  //   sticky  -> the reserved border band on the header box. NOT `position`, which is `static`
  //              in this lane for both values (see declarationIn's docstring) — the band is the
  //              one part of the sticky contract that survives the width drop, because the drop
  //              removes the elevation and the positioning and leaves the forced-colors
  //              reservation alone.
  const read = async (density: string | undefined, sticky: boolean) => {
    const el = await mountAxes(density, sticky);
    const header = el.shadowRoot!.querySelector('[part="header"]') as HTMLElement;
    const style = getComputedStyle(header);
    return {
      compactClass: header.classList.contains('sk-page-header--compact'),
      paddingBlock: parseFloat(style.getPropertyValue('padding-block-start')),
      band: style.getPropertyValue('border-block-end-style'),
      stickyAttr: el.hasAttribute('sticky'),
    };
  };

  const plain = await read(undefined, false);
  const compact = await read('compact', false);
  const stuck = await read(undefined, true);
  const both = await read('compact', true);

  expect(plain.paddingBlock, 'the token sheet is not loaded').toBeGreaterThan(0);

  // Density moves padding, in BOTH sticky states, by the same amount.
  expect(compact.paddingBlock).toBeLessThan(plain.paddingBlock);
  expect(both.paddingBlock).toBe(compact.paddingBlock);
  expect(stuck.paddingBlock).toBe(plain.paddingBlock);

  // Sticky moves the band, at BOTH densities, and leaves the padding alone.
  expect(plain.band).toBe('none');
  expect(compact.band).toBe('none');
  expect(stuck.band).toBe('solid');
  expect(both.band).toBe('solid');

  // And neither axis writes the other's state.
  expect([plain.compactClass, compact.compactClass, stuck.compactClass, both.compactClass])
    .toEqual([false, true, false, true]);
  expect([plain.stickyAttr, compact.stickyAttr, stuck.stickyAttr, both.stickyAttr])
    .toEqual([false, false, true, true]);
});

test('both axes round-trip attribute to property and property to attribute', async () => {
  const el = await mountAxes();
  expect(el.density).toBe(undefined);
  expect(el.sticky).toBe(false);

  // attribute -> property
  el.setAttribute('density', 'compact');
  el.setAttribute('sticky', '');
  await el.updateComplete;
  expect(el.density).toBe('compact');
  expect(el.sticky).toBe(true);

  // property -> attribute, including the removal half. A boolean that reflects `true` and never
  // clears is the failure a one-direction assertion misses.
  el.density = undefined;
  el.sticky = false;
  await el.updateComplete;
  expect(el.hasAttribute('density')).toBe(false);
  expect(el.hasAttribute('sticky')).toBe(false);

  el.density = 'compact';
  el.sticky = true;
  await el.updateComplete;
  expect(el.getAttribute('density')).toBe('compact');
  expect(el.getAttribute('sticky')).toBe('');
});

test('[SC-010] density and sticky assigned before definition survive upgrade and reflect', async () => {
  const el = document.createElement('sk-page-header-late') as SkPageHeader;
  el.density = 'compact';
  el.sticky = true;
  el.innerHTML = SLOT_CONTENT;
  document.body.append(el);

  const { SkPageHeader: Base } = await import(
    '../../../packages/elements/src/page-header/sk-page-header.js'
  );
  customElements.define('sk-page-header-late', class extends Base {});
  await customElements.whenDefined('sk-page-header-late');
  await el.updateComplete;

  // The pre-upgrade values must survive BOTH the upgrade and the constructor's own
  // `this.sticky = false` default, and must reach the attribute — which is what the sheet reads.
  expect(el.density).toBe('compact');
  expect(el.sticky).toBe(true);
  expect(el.getAttribute('density')).toBe('compact');
  expect(el.getAttribute('sticky')).toBe('');
  const header = el.shadowRoot!.querySelector('[part="header"]') as HTMLElement;
  expect(header.classList.contains('sk-page-header--compact')).toBe(true);

  // NOTHING HERE READS A COMPUTED STYLE, deliberately. An earlier revision asserted the sticky
  // band's `border-block-end-style` as well, and the mutation harness caught the consequence:
  // both of this element's SC-014 arms — which empty `static styles` and swap the adopted sheet —
  // then redded this [SC-010] test too, breaching guard 5's collateral bound. A behaviour test
  // must red for its OWN behaviour. Reflection is a property-and-attribute claim; what the sheet
  // does with the attribute is asserted in the sticky tests above, and adoption is SC-014's.
});

test('an unknown density warns, degrades to the default, and never throws', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const el = await mountAxes('cosy');
  const header = el.shadowRoot!.querySelector('[part="header"]') as HTMLElement;

  expect(header.classList.contains('sk-page-header--compact')).toBe(false);
  expect(header.classList.contains('sk-page-header')).toBe(true);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0]?.[0])).toContain('unknown density "cosy"');

  // DEGRADED, NOT THROWN, and this is the assertion that distinguishes them: a throwing render
  // makes Lit reject `updateComplete`, `render()` never returns a tree, and the element paints a
  // shadow root with no `<slot>` — silently eating the consumer's light-DOM children.
  expect(el.shadowRoot!.querySelectorAll('slot')).toHaveLength(5);
  expect(el.querySelector('[slot="actions"]')).not.toBe(null);
});

test('[SC-017] sticky is declared on the host and dropped at both documented thresholds', async () => {
  // ADR-11 ITEM 11 (#204). The SHEET half of the threshold behaviour: both drop blocks must be
  // declared at their DOCUMENTED figures, which is what a live assertion at one viewport cannot
  // see — a block whose condition drifted from 720px to 500px still fires at the lane's 414px.
  // The live half is the [SC-017] test below.
  const HOST = ':host([sticky])';
  const BOX = ':host([sticky]) .sk-page-header';

  expect(declarationIn(skPageHeaderSheet, HOST, 'position')).toBe('sticky');
  expect(declarationIn(skPageHeaderSheet, HOST, 'inset-block-start'))
    .toBe('var(--sk-layout-page-header-sticky-offset)');
  expect(declarationIn(skPageHeaderSheet, HOST, 'z-index'))
    .toBe('var(--sk-layout-page-header-sticky-layer)');
  expect(declarationIn(skPageHeaderSheet, BOX, 'box-shadow')).toBe('var(--sk-shadow-elev)');

  // THE HOST, NOT AN INNER BOX, and the reason is measured: an inner `position: sticky` box
  // inside a `display: block` host scrolled from top 0 to top -500 after a 500px scroll in a
  // chromium probe — it did not stick, because its containing block IS the host and it has no
  // room to move inside it. The identical markup with the declaration on the host stayed at
  // top 0. So a declaration found on `.sk-page-header` instead of `:host([sticky])` would be a
  // sticky axis that silently does nothing.
  expect(declarationIn(skPageHeaderSheet, '.sk-page-header', 'position')).toBeUndefined();

  // EXACTLY THESE TWO CONDITIONS, AND NO OTHERS. Asserting the two documented blocks exist leaves
  // a third one invisible: a spurious `@media (max-width: 1200px)` dropping stickiness far too
  // early satisfies every assertion below, and the live check further down cannot see it either —
  // the lane sits at 414px, which is under 720 and under 1200 alike, so the bogus rule and the real
  // one agree exactly where the only live measurement is taken. A pre-merge lens found that.
  const stickyDropConditions = Array.from(skPageHeaderSheet.cssRules)
    .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule)
    .filter((rule) =>
      Array.from(rule.cssRules).some(
        (inner) =>
          inner instanceof CSSStyleRule &&
          inner.selectorText.split(',').map((x) => x.trim()).includes(HOST) &&
          inner.style.getPropertyValue('position').trim() !== '',
      ),
    )
    .map((rule) => rule.conditionText.replace(/\s+/g, ' '))
    .sort();
  expect(
    stickyDropConditions,
    'the set of viewport conditions that unstick the host must be exactly the two documented ones',
  ).toEqual(['(max-height: 480px)', '(max-width: 720px)']);

  for (const condition of ['(max-width: 720px)', '(max-height: 480px)']) {
    expect(
      declarationIn(skPageHeaderSheet, HOST, 'position', condition),
      `stickiness must be dropped inside ${condition}`,
    ).toBe('static');
    expect(
      declarationIn(skPageHeaderSheet, BOX, 'box-shadow', condition),
      `the elevation must go with it inside ${condition} — a floating shadow under a header ` +
        'that no longer sticks reads as a bug',
    ).toBe('none');
  }
});

test('[SC-017] the width drop is real, measured at the lane viewport', async () => {
  // The LIVE half of the threshold behaviour (#204). Sticky is driven by the ATTRIBUTE here
  // (`mountAxes` sets it directly), not by the property, and that matters now the test carries an
  // id: the SC-010 sticky arm flips `reflect` on that property, so a property-driven spelling
  // would fail this test's own `hasAttribute` precondition and become collateral for a mutation
  // about something else entirely. Verified against every sk-page-header arm: with the attribute
  // spelling, neither SC-010 arm reds this test.
  //
  // The lane runs at 414px — asserted, not assumed, because a config change that widened it would
  // turn this into a silent pass.
  expect(window.matchMedia('(max-width: 720px)').matches, 'the lane is not below the width threshold')
    .toBe(true);
  const el = await mountAxes('compact', true);
  expect(el.hasAttribute('sticky'), 'the axis is not set — the assertion below would be vacuous')
    .toBe(true);
  expect(
    getComputedStyle(el).position,
    'below the documented width a sticky header must return to normal flow',
  ).toBe('static');
  // AND THE ELEVATION GOES WITH IT, MEASURED rather than read off the sheet. `declarationIn` above
  // matches a rule by its exact selector TEXT, so a later, differently-worded but equally specific
  // rule restoring the shadow inside the same block would leave that assertion reporting the
  // original value while a browser rendered the override — the declared-versus-computed divergence
  // this whole file's SC-016 sibling is about, in CSS. A second pre-merge lens found it.
  expect(
    getComputedStyle(part(el, 'header')!).boxShadow,
    'a header that no longer sticks must not keep floating a shadow over the content',
  ).toBe('none');
});

test('the narrow reflow keeps the title, the metadata and the trailing action reachable', async () => {
  const frame = document.createElement('div');
  frame.style.width = '480px';
  document.body.append(frame);
  const el = await mountAxes('compact', true, frame);

  const part_ = (name: string) => el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement;
  const header = part_('header');
  const text = part_('text');
  const meta = part_('meta');
  const action = el.querySelector('button[slot="actions"]') as HTMLButtonElement;
  const sync = el.querySelector('[slot="sync"]') as HTMLElement;

  expect(Math.round(header.getBoundingClientRect().width)).toBe(480);
  expect(meta.getBoundingClientRect().top)
    .toBeGreaterThanOrEqual(text.getBoundingClientRect().bottom);

  // NOTHING IS DROPPED TO MAKE ROOM. Each of the three is present, laid out, and inside the
  // frame — a rule that hid the metadata at narrow widths would satisfy "the header fits".
  for (const [label, node] of [['title', part_('title')], ['sync', sync], ['action', action]] as const) {
    const box = node.getBoundingClientRect();
    expect(box.width, `${label} has no width in the reflow`).toBeGreaterThan(0);
    expect(box.height, `${label} has no height in the reflow`).toBeGreaterThan(0);
    expect(box.right, `${label} is laid out outside the header`)
      .toBeLessThanOrEqual(header.getBoundingClientRect().right + 1);
  }
  expect(sync.textContent).toBe('Updated 12 seconds ago');

  action.focus();
  expect(document.activeElement).toBe(action);
  frame.remove();
});

test('under pressure the sync text truncates and the trailing action keeps its full box', async () => {
  const frame = document.createElement('div');
  frame.style.width = '360px';
  document.body.append(frame);
  const el = await mountAxes('compact', false, frame);
  const sync = el.querySelector('[slot="sync"]') as HTMLElement;
  const action = el.querySelector('button[slot="actions"]') as HTMLButtonElement;
  const wide = 'Updated 12 seconds ago from the consumer-owned synchronization timer, verbatim, '
    + 'and deliberately far too long for this box';
  sync.textContent = wide;
  await el.updateComplete;

  expect(getComputedStyle(sync).textOverflow, 'the sync text does not truncate').toBe('ellipsis');
  expect(sync.scrollWidth, 'the string is not actually overflowing — the test proves nothing')
    .toBeGreaterThan(sync.clientWidth);
  // TRUNCATION IS VISUAL ONLY: the DOM text is untouched, so assistive technology still reads
  // the whole string.
  expect(sync.textContent).toBe(wide);
  const box = action.getBoundingClientRect();
  expect(box.width, 'the action was squeezed to make room for the metadata').toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  frame.remove();
});

test('the density transition is the only one, and reduced motion suppresses exactly it', () => {
  const base = declarationIn(skPageHeaderSheet, '.sk-page-header', 'transition');
  expect(base, 'the component declares no transition — the guard below would guard nothing')
    .toBeTruthy();
  expect(base).toContain('padding');
  expect(
    declarationIn(skPageHeaderSheet, '.sk-page-header', 'transition', '(prefers-reduced-motion: reduce)'),
    'reduced motion must suppress the density transition',
  ).toBe('none');

  // SCOPED TO THIS COMPONENT'S OWN SELECTOR, never a wildcard over its subtree — the shape
  // packages/styles/src/skip-link/sk-skip-link.css and .../disclosure/sk-disclosure.css
  // establish, and the shape docs/contributing/adding-a-component.md requires.
  const reduce = Array.from(skPageHeaderSheet.cssRules).find(
    (rule): rule is CSSMediaRule =>
      rule instanceof CSSMediaRule &&
      rule.conditionText.replace(/\s+/g, '') === '(prefers-reduced-motion:reduce)',
  );
  expect(Array.from(reduce!.cssRules, (rule) => (rule as CSSStyleRule).selectorText))
    .toEqual(['.sk-page-header']);
});

test('under forced colors the sticky header keeps a system-coloured separator', () => {
  const BOX = ':host([sticky]) .sk-page-header';
  // THE BAND HAS TO EXIST IN NORMAL MODE for the override to paint anything: a `-color` with no
  // width and style draws nothing. Asserting both halves, because either alone passes while the
  // separator is invisible.
  expect(declarationIn(skPageHeaderSheet, BOX, 'border-block-end-style')).toBe('solid');
  expect(declarationIn(skPageHeaderSheet, BOX, 'border-block-end-width'))
    .toBe('var(--sk-border-width-1)');
  // Lower-cased on read: CSSOM normalises the system-colour keyword's case (measured —
  // `CanvasText` in the source reads back as `canvastext`), and the assertion is about WHICH
  // keyword is used, not about how the engine serialises it.
  expect(
    declarationIn(skPageHeaderSheet, BOX, 'border-block-end-color', '(forced-colors: active)')
      ?.toLowerCase(),
    'a sticky header separated only by a box-shadow disappears under forced colors — box-shadow ' +
      'computes away there entirely',
  ).toBe('canvastext');

  // The LONGHAND, and this is the load-bearing part rather than a style preference: stylelint's
  // declaration-strict-value polices `/color/` plus `background`/`background-color` and does not
  // inspect the `border`/`outline` SHORTHANDS at all, so a system color written in shorthand
  // passes because the gate never looks. `CanvasText` on the longhand is a value the gate
  // positively certifies against stylelint.config.mjs's `ignoreValues`.
  //
  // A second reason applies to the reads ABOVE rather than to the gate: a shorthand carrying a
  // `var()` reads back empty from the CSSOM (pending-substitution), so those assertions could
  // not distinguish a reserved band from an absent one. That is NOT a property of the LOGICAL
  // shorthand — `border-bottom: var(--w) solid red` behaves identically, and both expand
  // normally with a literal value. See the measurement table in the stylesheet.
  const forced = Array.from(skPageHeaderSheet.cssRules).find(
    (rule): rule is CSSMediaRule =>
      rule instanceof CSSMediaRule &&
      rule.conditionText.replace(/\s+/g, '') === '(forced-colors:active)',
  );
  const declared = Array.from(forced!.cssRules).flatMap((rule) =>
    Array.from((rule as CSSStyleRule).style),
  );
  expect(declared).toEqual(['border-block-end-color']);
});

test('the documented scroll margin is derived from the sticky offset and the compact height', async () => {
  // WCAG 2.4.11. The header cannot style the consumer's content, so it publishes a NAMED value
  // instead of an offset the consumer computes — and the value is a `calc()` over the same two
  // tokens the header's own geometry reads, so it cannot drift from the header's footprint when
  // either is retuned. That "cannot drift" is the claim, so it is what is measured: both inputs
  // are overridden and the result has to move with them.
  const probe = document.createElement('div');
  probe.style.scrollMarginBlockStart = 'var(--sk-layout-page-header-sticky-scroll-margin)';
  document.body.append(probe);
  expect(getComputedStyle(probe).scrollMarginBlockStart, 'the token does not resolve')
    .toBe('80px'); // 0rem offset + 3rem compact min-height + 2rem (--sk-space-7)

  // THE OVERRIDES GO ON `:root`, NOT ON THE PROBE, and the distinction is the mechanism rather
  // than a detail: a custom property's `var()` references are substituted where the property is
  // DECLARED, so the derived token is already resolved to a length by the time it inherits down.
  // Overriding an input on a descendant changes nothing — measured, and it is the first thing
  // this test got wrong. An inline style on <html> beats the tokens sheet's own `:root` rule on
  // the same element, so the derivation re-resolves there.
  const root = document.documentElement;
  try {
    root.style.setProperty('--sk-layout-page-header-compact-height', '5rem');
    expect(getComputedStyle(probe).scrollMarginBlockStart).toBe('112px');
    root.style.setProperty('--sk-layout-page-header-sticky-offset', '1rem');
    expect(getComputedStyle(probe).scrollMarginBlockStart).toBe('128px');
  } finally {
    root.style.removeProperty('--sk-layout-page-header-compact-height');
    root.style.removeProperty('--sk-layout-page-header-sticky-offset');
  }
  expect(getComputedStyle(probe).scrollMarginBlockStart, 'the override leaked out of the test')
    .toBe('80px');

  // And the header's own minimum block size reads the SAME compact-height token, which is what
  // makes the derivation honest rather than a coincidence of two numbers that happen to agree.
  expect(declarationIn(skPageHeaderSheet, '.sk-page-header--compact', 'min-block-size'))
    .toBe('var(--sk-layout-page-header-compact-height)');
  probe.remove();
});

/**
 * THE FRESHNESS BOUNDARY, ENFORCED BY A TEST RATHER THAN BY A COMMENT.
 *
 * #145 bound this element — "Sync text is supplied verbatim. The component never starts a timer
 * or claims data freshness" — and #182 restates it precisely because a sticky live header is
 * where a timer gets added by reflex. Several pages of the source dashboard each run their own.
 *
 * A comment cannot red a build. These two can, and they fail differently on purpose: the static
 * half catches an API that is present but not yet reached on any path the suite exercises, and
 * the dynamic half catches one reached through an indirection the static scan cannot resolve.
 *
 * SCOPE, STATED EXACTLY, BECAUSE THE FIRST VERSION OVERCLAIMED IT AND WAS DEFEATED.
 *
 * The static half originally read ONE file — `sk-page-header.ts?raw` — while its own failure
 * message talked about the element's boundary. A reviewer walked straight through the gap with
 * three sibling modules imported by the element and reached by it on every render: an
 * `IntersectionObserver` toggling a `stuck` attribute from `connectedCallback`, a
 * `window.addEventListener('scroll', …)`, and a `${Math.round((new Date().getTime() - since) /
 * 1000)}s ago` relative-age helper. Reproduced here before the repair: all three in place, all
 * 316 tests green, and `IntersectionObserver`, `ResizeObserver` and `addEventListener('scroll'`
 * were ALREADY in the pattern list below. The scan named them and could not see them one file
 * over. On a sticky header an IntersectionObserver is the single most likely thing a real
 * implementer adds — the "am I pinned? add the shadow" reflex.
 *
 * So the static half now walks the element's own IMPORT GRAPH: every first-party module
 * reachable from `sk-page-header.ts` by a RELATIVE specifier, transitively. What it still does
 * not cover, said plainly rather than left to be discovered again:
 *
 *   - bare specifiers (`lit`, and anything else from node_modules) are not followed;
 *   - a dynamic `import(expr)` with a computed specifier is not resolvable and is not followed;
 *   - the STORIES file is deliberately outside the graph. It is not shipped element code, the
 *     behaviour lane never loads it, and a timer in a story is a consumer writing a demo.
 *
 * The dynamic half is what covers the first two, and it was widened in the same pass: it
 * previously spied only `Date.now`, `setTimeout`, `setInterval` and `requestAnimationFrame`, so
 * `new Date().getTime()` and `performance.now()` reached it unseen and rested on the static half
 * alone — which is the half that had just been shown to be file-scoped.
 */
const FORBIDDEN_APIS: readonly [string, RegExp][] = [
  ['setInterval', /\bsetInterval\b/],
  ['setTimeout', /\bsetTimeout\b/],
  ['requestAnimationFrame', /\brequestAnimationFrame\b/],
  ['requestIdleCallback', /\brequestIdleCallback\b/],
  ['Date', /\bDate\b/],
  ['performance.now', /\bperformance\s*\.\s*now\b/],
  ['IntersectionObserver', /\bIntersectionObserver\b/],
  ['ResizeObserver', /\bResizeObserver\b/],
  ['MutationObserver', /\bMutationObserver\b/],
  ['a scroll listener', /addEventListener\s*\(\s*['"`]scroll/],
  ['onscroll', /\bonscroll\b/],
  ['scrollTop', /\bscrollTop\b/],
  ['getBoundingClientRect', /\bgetBoundingClientRect\b/],
];

// PARSED PAST THE COMMENTS, NOT GREPPED OVER THEM. A raw grep would match the docblock above
// that explains why these APIs are absent — this repo has already shipped a check that failed on
// the prose describing its own success, and docs/contributing/adding-a-component.md records it.
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const offendersIn = (source: string): string[] =>
  FORBIDDEN_APIS.filter(([, pattern]) => pattern.test(source)).map(([name]) => name);

/**
 * Every first-party element module, keyed by repository-relative path.
 *
 * `import.meta.glob` rather than a directory read: the browser lane has no filesystem, and the
 * graph walk below has to be able to follow a relative import OUT of page-header/ — a sibling
 * helper under `src/shared/` would otherwise be exactly as invisible as the one-file scan was.
 */
const ELEMENT_MODULES: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../../packages/elements/src/**/*.{ts,js}', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  ).map(([key, source]) => [key.slice(key.indexOf('packages/')), source]),
);

const ELEMENT_ROOT = 'packages/elements/src/page-header/sk-page-header.ts';

/** Resolves a relative specifier against the importing module's directory. */
const resolveFrom = (fromPath: string, specifier: string): string => {
  const parts = fromPath.split('/').slice(0, -1);
  for (const segment of specifier.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }
  return parts.join('/');
};

/**
 * The element's transitive first-party import graph, plus every relative specifier the resolver
 * could NOT account for.
 *
 * The unresolved list is returned rather than skipped. A resolver that silently drops what it
 * cannot see is the certifying-absence shape this whole gate exists to close — it would have
 * turned the reviewer's sibling module into "no offenders found" instead of a failure.
 */
const importGraph = (root: string): { files: string[]; unresolved: string[] } => {
  const files = new Set<string>();
  const unresolved: string[] = [];
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (files.has(current)) continue;
    const source = ELEMENT_MODULES[current];
    if (source === undefined) {
      unresolved.push(current);
      continue;
    }
    files.add(current);
    // Static `import`/`export … from`, and a dynamic `import()` with a literal specifier.
    for (const match of stripComments(source).matchAll(
      /(?:\bfrom\s*|\bimport\s*\(\s*)['"](\.[^'"]*)['"]/g,
    )) {
      const target = resolveFrom(current, match[1]!);
      // Source files import with a `.js` extension under NodeNext; the module on disk is `.ts`.
      const candidate = target.endsWith('.js') && ELEMENT_MODULES[`${target.slice(0, -3)}.ts`] !== undefined
        ? `${target.slice(0, -3)}.ts`
        : target;
      queue.push(candidate);
    }
  }
  return { files: [...files].sort(), unresolved };
};

/**
 * The graph the element is EXPECTED to have, as a ratchet rather than as a count.
 *
 * A count would be satisfied by any three modules. Naming them means that adding a module to
 * this element — the exact event that let the reviewer's attack in — fails this test until a
 * human writes the new name down, which is the same shape as expected-parts.json and
 * expected-docs.json. `lit` is absent because bare specifiers are not followed; that limit is
 * stated in the docblock above rather than hidden here.
 */
const EXPECTED_GRAPH = [
  'packages/elements/src/define.ts',
  'packages/elements/src/page-header/sk-page-header.css.js',
  'packages/elements/src/page-header/sk-page-header.ts',
];

test("the element's whole import graph owns no timer, clock, observer or scroll API", () => {
  const { files, unresolved } = importGraph(ELEMENT_ROOT);

  // ANTI-VACUITY FIRST, because a scan over an over-stripped string, or over a graph that
  // collapsed to its root, passes for the wrong reason.
  expect(unresolved, 'a relative import could not be resolved — the scan would silently skip it')
    .toEqual([]);
  expect(files, 'the import graph is not what this element is known to have').toEqual(EXPECTED_GRAPH);

  const stripped = stripComments(ELEMENT_MODULES[ELEMENT_ROOT]!);
  expect(
    stripped.length,
    'nothing was stripped — the comment remover is inert',
  ).toBeLessThan(ELEMENT_MODULES[ELEMENT_ROOT]!.length);
  expect(stripped, 'the stripper ate the class — the scan below would be vacuous')
    .toContain('class SkPageHeader');
  expect(stripped).toContain('static properties');
  expect(stripped).toContain("define('sk-page-header'");

  // The scan's own red, so "it finds nothing" is distinguishable from "it can find nothing".
  expect(offendersIn(stripComments('class SkPageHeader { }\nsetInterval(() => {}, 1000);')))
    .toEqual(['setInterval']);
  // And the WALK's own red: a synthetic root whose relative import names nothing must be
  // REPORTED, never skipped.
  expect(importGraph('packages/elements/src/page-header/does-not-exist.ts').unresolved)
    .toEqual(['packages/elements/src/page-header/does-not-exist.ts']);

  const offenders = files
    .flatMap((file) => offendersIn(stripComments(ELEMENT_MODULES[file]!)).map((api) => `${file}: ${api}`));
  expect(
    offenders,
    'sk-page-header must never own time or liveness — anywhere in its own import graph, not ' +
      'merely in its own file. The consumer owns the timer and passes the resulting string into ' +
      'the sync slot.',
  ).toEqual([]);
});

/**
 * Wraps the three observer constructors and the scroll-listener registration for the duration of
 * one mount, recording what was reached rather than what was written.
 *
 * `Date.now` alone is not the clock. `new Date().getTime()`, `+new Date()` and
 * `performance.now()` are all clock reads that the previous spy set never saw — and one of them
 * is exactly what the reviewer's relative-age helper used.
 */
const clockAndObserverProbe = () => {
  const reached: string[] = [];
  const nativeAdd = EventTarget.prototype.addEventListener;
  const nativeObservers = ['IntersectionObserver', 'ResizeObserver', 'MutationObserver'] as const;
  const originals = new Map<string, unknown>();

  for (const name of nativeObservers) {
    const Native = (globalThis as Record<string, unknown>)[name] as
      | (new (...args: unknown[]) => object)
      | undefined;
    if (Native === undefined) continue;
    originals.set(name, Native);
    (globalThis as Record<string, unknown>)[name] = class {
      constructor(...args: unknown[]) {
        reached.push(name);
        return new Native(...args);
      }
    };
  }
  // BOTH THE PROTOTYPE AND `window`'s OWN PROPERTY, and that is measured rather than belt-and-
  // braces. In this lane `window.addEventListener` is an OWN property of `window` and is NOT
  // `EventTarget.prototype.addEventListener` — the browser runner has already wrapped it
  // (measured: hasOwnProperty true, identity false, while an element's own listener still goes
  // through the prototype). So a prototype-only patch silently misses
  // `window.addEventListener('scroll', …)`, which is precisely the shape a sticky header
  // attracts. The first version of this probe was prototype-only and did not see the reviewer's
  // scroll listener at all, while catching its IntersectionObserver — a half-armed guard reading
  // as an armed one.
  const nativeWindowAdd = window.addEventListener;
  const record = (type: string) => {
    if (type === 'scroll') reached.push("addEventListener('scroll')");
  };
  EventTarget.prototype.addEventListener = function patched(
    this: EventTarget,
    type: string,
    ...rest: unknown[]
  ) {
    record(type);
    return (nativeAdd as (...a: unknown[]) => void).call(this, type, ...rest);
  } as typeof EventTarget.prototype.addEventListener;
  window.addEventListener = function patchedWindow(type: string, ...rest: unknown[]) {
    record(type);
    return (nativeWindowAdd as (...a: unknown[]) => void).call(window, type, ...rest);
  } as typeof window.addEventListener;

  const spies = {
    'Date.now': vi.spyOn(Date, 'now'),
    'Date.prototype.getTime': vi.spyOn(Date.prototype, 'getTime'),
    'Date.prototype.valueOf': vi.spyOn(Date.prototype, 'valueOf'),
    'performance.now': vi.spyOn(performance, 'now'),
    setTimeout: vi.spyOn(globalThis, 'setTimeout'),
    setInterval: vi.spyOn(globalThis, 'setInterval'),
    requestAnimationFrame: vi.spyOn(globalThis, 'requestAnimationFrame'),
  };

  return {
    spies,
    /** Everything reached during the window, in one list, so the failure names the API. */
    reached: () => [
      ...reached,
      ...Object.entries(spies).filter(([, spy]) => spy.mock.calls.length > 0).map(([name]) => name),
    ],
    restore: () => {
      EventTarget.prototype.addEventListener = nativeAdd;
      window.addEventListener = nativeWindowAdd;
      for (const [name, Native] of originals) (globalThis as Record<string, unknown>)[name] = Native;
    },
  };
};

test('a compact sticky header still treats sync bytes as opaque and schedules no clock work', async () => {
  const probe = clockAndObserverProbe();
  probe.spies['Date.now'].mockReturnValue(0);
  const exact = 'Updated 12 seconds ago';

  try {
    const el = await mountAxes('compact', true);
    const sync = el.querySelector('[slot="sync"]') as HTMLElement;
    expect(sync.textContent).toBe(exact);

    probe.spies['Date.now'].mockReturnValue(86_400_000);
    el.sticky = false;
    el.density = undefined;
    await el.updateComplete;
    el.density = 'compact';
    el.sticky = true;
    await el.updateComplete;

    expect(sync.textContent, 'the sync string changed across a density and stickiness change')
      .toBe(exact);
    expect(
      probe.reached(),
      'sk-page-header reached a clock, a scheduler, an observer or a scroll listener — the ' +
        'consumer owns the timer and passes the resulting string into the sync slot',
    ).toEqual([]);
  } finally {
    probe.restore();
  }
});
