/**
 * <sk-ribbon-card> — #78's cards batch.
 *
 * SC-013 and SC-014, plus the component claims: the ribbon's ABSENCE is real absence, the two
 * colour axes are independent, and both degrade paths work.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import {
  RIBBON_CARD_COLOURS,
  ribbonCardClasses,
  ribbonCardStaticHtml,
  ribbonClasses,
  skRibbonCardSheet,
} from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async (attrs: Record<string, string> = {}) => {
  const el = document.createElement('sk-ribbon-card');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.innerHTML = '<h4>Title</h4><p>Body</p>';
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

const partOf = (el: Element, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

test('[SC-013] every declared part is targetable from outside', async () => {
  // Mounted WITH a ribbon, because the ribbon part does not exist without one — that absence is
  // asserted separately below. Selectors written out in full: check-part-ratchet.mjs is a
  // source scan for the literal text.
  const el = await mount({ ribbon: 'Primary', variant: 'border-green' });
  const cases: readonly (readonly [string, string])[] = [
    ['card', 'sk-ribbon-card::part(card) { outline-style: dashed; }'],
    ['ribbon', 'sk-ribbon-card::part(ribbon) { outline-style: dashed; }'],
    ['content', 'sk-ribbon-card::part(content) { outline-style: dashed; }'],
  ];
  for (const [name, rule] of cases) {
    const s = document.createElement('style');
    s.textContent = rule;
    document.head.append(s);
    try {
      const node = partOf(el, name);
      expect(node, `part="${name}" is declared but not rendered`).not.toBe(null);
      expect(getComputedStyle(node!).outlineStyle, `::part(${name}) is not targetable`).toBe('dashed');
    } finally {
      s.remove();
    }
  }
  expect(cases.length, 'the case table went empty').toBe(3);
});

test('[SC-014] the element adopts the GENERATED sheet by identity and injects no <style>', async () => {
  const el = await mount();
  const sr = el.shadowRoot!;
  expect(sr.adoptedStyleSheets.length).toBe(1);
  expect(sr.adoptedStyleSheets[0]).toBe(skRibbonCardSheet);
  expect(sr.querySelectorAll('style').length).toBe(0);
});

test('SLOTTED content inherits a legible colour from the host', async () => {
  // The a11y gate reported color-contrast on EVERY element story of this component before this
  // was fixed. The title and body classes style shadow-tree nodes; slotted content is not in
  // the shadow tree, so those classes reach nothing and the text fell back to UA black on a
  // dark card. `color` on :host reaches it, because inheritance follows the flattened tree.
  //
  // Asserted on a slotted node with NO colour of its own — the case that was broken — and
  // against the token's own value, so replacing it with a hardcoded colour or deleting the
  // declaration both red.
  const el = await mount();
  const slotted = el.querySelector('p')!;
  const expected = getComputedStyle(document.documentElement)
    .getPropertyValue('--sk-fg-body')
    .trim();
  expect(expected, '--sk-fg-body is not defined — the token sheet is not loaded').not.toBe('');
  const asColour = (value: string) => {
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  };
  expect(getComputedStyle(slotted).color, 'slotted text does not inherit the card colour').toBe(
    asColour(expected),
  );
  // And it is not the UA default, which is what the bug looked like.
  expect(getComputedStyle(slotted).color).not.toBe('rgb(0, 0, 0)');
});

test('the HOST is a block box, so a consumer can size it', async () => {
  const el = await mount();
  expect(getComputedStyle(el).display).toBe('block');
  el.style.maxWidth = '200px';
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  expect(Math.round(el.getBoundingClientRect().width), 'max-width did not apply to the host').toBe(200);
});

test('with no label the ribbon is ABSENT, not an empty tab', async () => {
  // The element renders `nothing`, not ''. An empty coloured tab reads as a rendering bug, and
  // a consumer's `::part(ribbon)` rule must have nothing to match on a plain card.
  const plain = await mount();
  expect(partOf(plain, 'ribbon'), 'a card with no label must not render a ribbon').toBe(null);
  expect(plain.shadowRoot!.textContent?.trim() ?? '', 'an empty text node was rendered').not.toContain('undefined');

  const withRibbon = await mount({ ribbon: 'Primary' });
  expect(partOf(withRibbon, 'ribbon')).not.toBe(null);
  expect(partOf(withRibbon, 'ribbon')!.textContent).toBe('Primary');

  // The static path agrees — one authored source (ADR-10 §3).
  expect(ribbonCardStaticHtml({})).not.toContain('sk-ribbon-card__ribbon');
  expect(ribbonCardStaticHtml({ ribbon: 'Primary' })).toContain('sk-ribbon-card__ribbon');
});

test('every ribbon colour PAINTS, and they are distinct', async () => {
  const backgrounds = new Map<string, string>();
  for (const colour of RIBBON_CARD_COLOURS) {
    const el = await mount({ ribbon: 'Tab', 'accent': colour });
    const bg = getComputedStyle(partOf(el, 'ribbon')!).backgroundColor;
    expect(bg, `accent="${colour}" has no background`).not.toBe('rgba(0, 0, 0, 0)');
    backgrounds.set(colour, bg);
  }
  // Derived from the module's own list, so a sixth colour cannot be added without being covered.
  expect(backgrounds.size, 'the colour list went empty').toBe(RIBBON_CARD_COLOURS.length);
  expect(
    new Set(backgrounds.values()).size,
    `ribbon colours are not distinct: ${[...backgrounds].map(([k, v]) => `${k}=${v}`).join(', ')}`,
  ).toBe(RIBBON_CARD_COLOURS.length);
});

test('the border variants change the border, and leave the ribbon alone', async () => {
  const plain = await mount({ ribbon: 'Tab' });
  const plainBorder = getComputedStyle(partOf(plain, 'card')!).borderColor;
  const plainRibbon = getComputedStyle(partOf(plain, 'ribbon')!).backgroundColor;
  const borders = new Set<string>();
  for (const colour of RIBBON_CARD_COLOURS) {
    const el = await mount({ ribbon: 'Tab', variant: `border-${colour}` });
    const border = getComputedStyle(partOf(el, 'card')!).borderColor;
    expect(border, `border-${colour} did not change the border`).not.toBe(plainBorder);
    borders.add(border);
    // Independence: a border variant must not tint the ribbon.
    expect(getComputedStyle(partOf(el, 'ribbon')!).backgroundColor).toBe(plainRibbon);
  }
  expect(borders.size, 'the border variants are not distinct').toBe(RIBBON_CARD_COLOURS.length);
});

test('an unknown variant or ribbon colour degrades on RENDER and throws on AUTHORING', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  let el: Element;
  try {
    el = await mount({ variant: 'nope', ribbon: 'Tab', 'accent': 'also-nope' });
  } finally {
    console.warn = realWarn;
  }
  expect(partOf(el!, 'card')!.className.trim()).toBe('sk-ribbon-card');
  expect(partOf(el!, 'ribbon')!.className.trim()).toBe(
    'sk-ribbon-card__ribbon sk-ribbon-card__ribbon--yellow',
  );
  expect(el!.shadowRoot!.querySelector('slot'), 'the slot must survive').not.toBe(null);
  expect(warnings.length, 'both arms must warn').toBe(2);

  expect(() => ribbonCardStaticHtml({ variant: 'nope' })).toThrow(/unknown ribbon-card variant/);
  expect(() => ribbonCardStaticHtml({ accent: 'nope' })).toThrow(/unknown ribbon colour/);
  for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    expect(() => ribbonCardStaticHtml({ variant: key })).toThrow(/unknown ribbon-card variant/);
    expect(() => ribbonCardStaticHtml({ accent: key })).toThrow(/unknown ribbon colour/);
    expect(ribbonCardClasses(key).trim()).toBe('sk-ribbon-card');
    expect(ribbonClasses(key).trim()).toBe('sk-ribbon-card__ribbon sk-ribbon-card__ribbon--yellow');
  }
});
