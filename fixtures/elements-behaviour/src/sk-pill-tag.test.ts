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
    // Interpolated so the only literal `::part(tag)` in this file is the real selector
    // above — check-part-ratchet.mjs greps for that literal, so a copy in a message would
    // keep the ratchet green if the rule were deleted.
    expect(
      getComputedStyle(node).outlineStyle,
      `::part(${'tag'}) is not targetable`,
    ).toBe('dashed');
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

test('every tinted variant meets AA contrast in BOTH themes', async () => {
  // THE BUG THE INERT WRAPPER WAS HIDING. Every tinted variant paired --sk-color-* (tuned for
  // the dark page) with --sk-surface-tint-* (pastel in light mode), against AA's 4.5: 1.51:1
  // yellow, 1.67:1 green, 1.82:1 purple and 2.48:1 breaking — all FOUR, where an earlier
  // revision of this note listed three and left out the one that moved furthest. The gate
  // never saw it because this
  // component's LightMode story carried the inert `data-theme="light"` wrapper, so it rendered
  // the DARK palette (#93). Retiring that wrapper in #79 exposed it; the on-tint inks fix it.
  //
  // Asserted here as well as in axe, because axe only sees the stories that exist — this holds
  // for every variant in the module map, in both themes, whether or not a story renders it.
  const contrast = (fg: string, bg: string) => {
    const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const lum = (c: string) => {
      const [r, g, b] = c.match(/\d+/g)!.slice(0, 3).map((n) => channel(Number(n) / 255));
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const [a, z] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a! + 0.05) / (z! + 0.05);
  };

  for (const theme of ['dark', 'light'] as const) {
    const wrap = document.createElement('div');
    if (theme === 'light') wrap.className = 'sk-light';
    document.body.append(wrap);
    for (const variant of Object.keys(PILL_TAG_VARIANTS)) {
      const el = document.createElement('sk-pill-tag');
      el.setAttribute('variant', variant);
      el.textContent = 'Label';
      wrap.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      const cs = getComputedStyle(el.shadowRoot!.querySelector('[part="tag"]')!);
      const ratio = contrast(cs.color, cs.backgroundColor);
      expect(
        ratio,
        `variant="${variant}" in ${theme} mode is ${ratio.toFixed(2)}:1 — WCAG AA needs 4.5`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
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
  // It inherits the base's background rather than restating it.
  expect(getComputedStyle(partOf(eyebrow)).backgroundColor).toBe(
    getComputedStyle(partOf(base)).backgroundColor,
  );

  // AND THE TWO AXES COMPOSE — this is the assertion that actually holds the modelling claim.
  // A lens pointed out the comment above was on the wrong line: a re-split that restated the
  // base background verbatim would leave that assertion green, whereas a tinted eyebrow keeping
  // BOTH the tint and the shape can only pass if --eyebrow sets no colour of its own.
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
