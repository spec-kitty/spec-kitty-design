/**
 * <sk-pill-tag> — #79's primitives batch.
 *
 * SC-013 and SC-014, plus the claim this migration turns on: colour and shape are independent
 * axes of ONE component, where the shape used to be a second component sharing the directory.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import {
  PILL_TAG_SHAPES,
  PILL_TAG_VARIANTS,
  pillTagClasses,
  pillTagStaticHtml,
  skPillTagSheet,
} from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async (attrs: Record<string, string> = {}, label = 'Label') => {
  const el = document.createElement('sk-pill-tag');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.textContent = label;
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

const partOf = (el: Element) => el.shadowRoot!.querySelector('[part="tag"]') as HTMLElement;

test('[SC-013] the declared part is targetable from outside', async () => {
  const el = await mount({ variant: 'green' });
  const s = document.createElement('style');
  s.textContent = 'sk-pill-tag::part(tag) { outline-style: dashed; }';
  document.head.append(s);
  try {
    const node = partOf(el);
    expect(node, 'part="tag" is declared but not rendered').not.toBe(null);
    expect(getComputedStyle(node).outlineStyle, '::part(tag) is not targetable').toBe('dashed');
  } finally {
    s.remove();
  }
});

test('[SC-014] the element adopts the GENERATED sheet by identity and injects no <style>', async () => {
  const el = await mount();
  const sr = el.shadowRoot!;
  expect(sr.adoptedStyleSheets.length).toBe(1);
  expect(sr.adoptedStyleSheets[0]).toBe(skPillTagSheet);
  expect(sr.querySelectorAll('style').length).toBe(0);
});

test('every colour PAINTS and the colours are distinct', async () => {
  const variants = Object.keys(PILL_TAG_VARIANTS);
  expect(variants.length, 'the variant map went empty or grew uncovered').toBe(4);
  const seen = new Map<string, string>();
  for (const variant of variants) {
    const cs = getComputedStyle(partOf(await mount({ variant })));
    expect(cs.backgroundColor, `variant="${variant}" has no background`).not.toBe('rgba(0, 0, 0, 0)');
    seen.set(variant, `${cs.backgroundColor}|${cs.color}`);
  }
  expect(
    new Set(seen.values()).size,
    `the colours are not distinct: ${[...seen].map(([k, v]) => `${k}=${v}`).join(', ')}`,
  ).toBe(variants.length);
});

test('the EYEBROW shape composes with colour — it is an axis, not a second component', async () => {
  // The modelling claim this migration makes. `.sk-eyebrow-pill` used to be a standalone class
  // restating the base rule, exported as its own function, so a tinted eyebrow was not
  // expressible. Now it is, and this is the assertion that would fail if someone re-split them.
  const shapes = Object.keys(PILL_TAG_SHAPES);
  expect(shapes.length, 'the shape map went empty or grew uncovered').toBe(1);

  const base = await mount();
  const eyebrow = await mount({ shape: 'eyebrow' });
  const basePad = parseFloat(getComputedStyle(partOf(base)).paddingLeft);
  const eyebrowPad = parseFloat(getComputedStyle(partOf(eyebrow)).paddingLeft);
  expect(eyebrowPad, 'the eyebrow shape did not change the padding').toBeGreaterThan(basePad);
  // It inherits the base's own properties rather than restating them — the reduction that made
  // it a modifier. If the rule were standalone again, the base background would not apply.
  expect(getComputedStyle(partOf(eyebrow)).backgroundColor).toBe(
    getComputedStyle(partOf(base)).backgroundColor,
  );

  // And the two axes compose: a tinted eyebrow keeps the tint AND the shape.
  const tinted = await mount({ shape: 'eyebrow', variant: 'purple' });
  const purple = await mount({ variant: 'purple' });
  expect(getComputedStyle(partOf(tinted)).backgroundColor, 'the tint was lost').toBe(
    getComputedStyle(partOf(purple)).backgroundColor,
  );
  expect(parseFloat(getComputedStyle(partOf(tinted)).paddingLeft), 'the shape was lost').toBe(eyebrowPad);
});

test('the class list is identical on both paths', async () => {
  const el = await mount({ variant: 'yellow', shape: 'eyebrow' });
  expect(partOf(el).className).toBe('sk-pill-tag sk-pill-tag--yellow sk-pill-tag--eyebrow');
  expect(pillTagStaticHtml({ variant: 'yellow', shape: 'eyebrow' })).toContain(
    'class="sk-pill-tag sk-pill-tag--yellow sk-pill-tag--eyebrow"',
  );
});

test('an unknown variant or shape degrades on RENDER and throws on AUTHORING', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  let el: Element;
  try {
    el = await mount({ variant: 'nope', shape: 'also-nope' });
  } finally {
    console.warn = realWarn;
  }
  expect(partOf(el!).className.trim()).toBe('sk-pill-tag');
  expect(el!.shadowRoot!.querySelector('slot'), 'the slot must survive').not.toBe(null);
  expect(warnings.length, 'both arms must warn').toBe(2);

  expect(() => pillTagStaticHtml({ variant: 'nope' })).toThrow(/unknown pill-tag variant/);
  expect(() => pillTagStaticHtml({ shape: 'nope' })).toThrow(/unknown pill-tag shape/);
  for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    expect(() => pillTagStaticHtml({ variant: key })).toThrow(/unknown pill-tag variant/);
    expect(() => pillTagStaticHtml({ shape: key })).toThrow(/unknown pill-tag shape/);
    expect(pillTagClasses(key).trim()).toBe('sk-pill-tag');
    expect(pillTagClasses(undefined, key).trim()).toBe('sk-pill-tag');
  }
});
