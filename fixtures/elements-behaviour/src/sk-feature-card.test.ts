/**
 * <sk-feature-card> — #78's cards batch.
 *
 * SC-013 (both declared parts targetable) and SC-014 (the adopted sheet is the generated one,
 * by identity). The rest are component claims with no registry id: the two axes are genuinely
 * independent, both degrade paths work, and the card PAINTS — the assertion #77's gate pass
 * showed was missing from sk-section-banner, where a variant could lose its background and no
 * test would notice.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import {
  FEATURE_CARD_ACCENTS,
  FEATURE_CARD_VARIANTS,
  featureCardChipClasses,
  featureCardClasses,
  featureCardStaticHtml,
  skFeatureCardSheet,
} from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async (attrs: Record<string, string> = {}) => {
  const el = document.createElement('sk-feature-card');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.innerHTML = '<svg slot="icon" aria-hidden="true"></svg><h4>Title</h4><p>Body</p>';
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

const partOf = (el: Element, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement;

test('[SC-013] every declared part is targetable from outside', async () => {
  const el = await mount({ variant: 'border-green', accent: 'purple' });
  // Each selector written OUT IN FULL: check-part-ratchet.mjs is a source scan for the literal
  // text, so a loop over `::part(${name})` targets both at runtime and records neither.
  const cases: readonly (readonly [string, string])[] = [
    ['card', 'sk-feature-card::part(card) { outline-style: dashed; }'],
    ['chip', 'sk-feature-card::part(chip) { outline-style: dashed; }'],
  ];
  for (const [name, rule] of cases) {
    const s = document.createElement('style');
    s.textContent = rule;
    document.head.append(s);
    try {
      const node = partOf(el, name);
      expect(node, `part="${name}" is declared but not rendered`).not.toBe(null);
      expect(getComputedStyle(node).outlineStyle, `::part(${name}) is not targetable`).toBe('dashed');
    } finally {
      s.remove();
    }
  }
  expect(cases.length, 'the case table went empty').toBe(2);
});

test('[SC-014] the element adopts the GENERATED sheet by identity and injects no <style>', async () => {
  const el = await mount();
  const sr = el.shadowRoot!;
  expect(sr.adoptedStyleSheets.length).toBe(1);
  expect(sr.adoptedStyleSheets[0]).toBe(skFeatureCardSheet);
  expect(sr.querySelectorAll('style').length).toBe(0);
});

test('SLOTTED content inherits a legible colour from the host', async () => {
  // The a11y gate reported color-contrast on EVERY element story of this component before this
  // was fixed. The title and body classes style shadow-tree nodes; slotted content is not in
  // the shadow tree, so those classes reach nothing and the text fell back to UA black on a
  // dark card. `color` on :host reaches it, because inheritance follows the flattened tree.
  //
  // Asserted on a slotted node with NO colour of its own — the case that was broken — and
  // against the token's own value, so DELETING the declaration reds. Replacing it with a
  // hardcoded colour would not red here: stylelint's declaration-strict-value rule is what
  // refuses that, which an earlier version of this comment credited to the test.
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
  expect(getComputedStyle(el).display, 'the host must be a block box').toBe('block');
  el.style.maxWidth = '200px';
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  // 200px, not a width the lane cannot distinguish: at 414px a `max-width: 640px` host measures
  // 414 when correct and 0 when regressed, so both would pass — the cannot-fail shape #77
  // shipped once and had to repair.
  expect(Math.round(el.getBoundingClientRect().width), 'max-width did not apply to the host').toBe(200);
});

test('SLOTTED typography matches the static path, not just the colour', async () => {
  // THE OTHER HALF OF THE SLOTTING CLASS. `:host { color }` fixed contrast, which is the part
  // axe could see; the title's font-size, weight and margin were still UA defaults in the
  // element path while the static path applied the design system's, because a shadow-tree
  // class selector cannot match a slotted node. All three pre-merge lenses found it.
  //
  // Asserted against a NON-COLOUR property, deliberately — the previous test covers colour and
  // would have gone on passing through this entire divergence.
  const el = document.createElement('sk-feature-card');
  el.innerHTML =
    '<h4 class="sk-feature-card__title" slot="">Title</h4>' +
    '<p class="sk-feature-card__body">Body</p>';
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

  const title = el.querySelector('.sk-feature-card__title')!;
  const body = el.querySelector('.sk-feature-card__body')!;
  // The UA default for an h4 is bold-ish but its MARGIN is not zero, and the design system sets
  // `margin: 0` — that single property separates "the rule reached it" from "it did not".
  expect(getComputedStyle(title).marginTop, 'the slotted title did not receive its rule').toBe('0px');
  expect(getComputedStyle(body).marginTop, 'the slotted body did not receive its rule').toBe('0px');
  // And a token-driven size, so removing the ::slotted() rule reds rather than merely changing.
  expect(parseFloat(getComputedStyle(title).fontSize)).toBeGreaterThan(
    parseFloat(getComputedStyle(body).fontSize),
  );
});

test('the card and the chip PAINT, and each accent is distinct', async () => {
  // The assertion sk-section-banner was missing until #77's second gate pass: its variants were
  // asserted by classList alone, so deleting a `background:` line, swapping in a defined-but-
  // wrong token, or renaming a modifier in the CSS only would all have shipped green.
  // DERIVED from the module's own map, not a hardcoded list. The sibling ribbon-card test
  // already did this; feature-card hardcoded `['yellow','green','purple']` and `.toBe(3)`, so a
  // fourth accent would have shipped with no coverage AND a generated static export whose class
  // is in no stylesheet. A lens named that as the realistic next edit.
  const accents = Object.keys(FEATURE_CARD_ACCENTS);
  // A LITERAL FLOOR as well: `size === accents.length` is true by construction and an empty map
  // would satisfy it, which is this programme's named defect inside the guard against it.
  expect(accents.length, 'the accent map went empty or grew uncovered').toBe(3);

  const backgrounds = new Map<string, string>();
  const foregrounds = new Map<string, string>();
  for (const accent of accents) {
    const el = await mount({ accent });
    const chip = partOf(el, 'chip');
    const bg = getComputedStyle(chip).backgroundColor;
    expect(bg, `accent="${accent}" chip has no background`).not.toBe('rgba(0, 0, 0, 0)');
    backgrounds.set(accent, bg);
    // THE FOREGROUND, asserted against the accent's own token rather than `!== ''`.
    // `getComputedStyle().color` is never the empty string, so the previous assertion could not
    // fail — and worse, deleting the chip's `color` now leaves it inheriting --sk-fg-body from
    // the :host rule this same PR added, so the fix was masking its own missing coverage. The
    // chip's foreground is what the slotted icon paints with, via `stroke="currentColor"`.
    foregrounds.set(accent, getComputedStyle(chip).color);
  }
  expect(
    new Set(backgrounds.values()).size,
    `the accents' backgrounds are not distinct: ${[...backgrounds].map(([k, v]) => `${k}=${v}`).join(', ')}`,
  ).toBe(accents.length);
  expect(
    new Set(foregrounds.values()).size,
    `the accents' foregrounds are not distinct: ${[...foregrounds].map(([k, v]) => `${k}=${v}`).join(', ')}`,
  ).toBe(accents.length);

  // The card frame itself, which no accent touches.
  const plain = await mount();
  expect(getComputedStyle(partOf(plain, 'card')).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('the border variants change the BORDER colour, and only that', async () => {
  const borders = new Map<string, string>();
  const plain = await mount();
  const plainBorder = getComputedStyle(partOf(plain, 'card')).borderColor;
  const variants = Object.keys(FEATURE_CARD_VARIANTS);
  expect(variants.length, 'the variant map went empty or grew uncovered').toBe(3);
  for (const variant of variants) {
    const el = await mount({ variant });
    const card = partOf(el, 'card');
    const border = getComputedStyle(card).borderColor;
    expect(border, `${variant} did not change the border from the default`).not.toBe(plainBorder);
    borders.set(variant, border);
    // The chip is untouched by a border variant — the two axes are independent, and this is the
    // assertion that fails if they are ever coupled.
    expect(getComputedStyle(partOf(el, 'chip')).backgroundColor).toBe(
      getComputedStyle(partOf(plain, 'chip')).backgroundColor,
    );
  }
  expect(new Set(borders.values()).size, 'the border variants are not distinct').toBe(variants.length);

  // THE OTHER DIRECTION. The loop above proves a border variant leaves the chip alone; this
  // proves an accent leaves the BORDER alone. Only one direction was asserted, so a chip rule
  // that also tinted the frame would have shipped green.
  for (const accent of Object.keys(FEATURE_CARD_ACCENTS)) {
    const el = await mount({ accent });
    expect(
      getComputedStyle(partOf(el, 'card')).borderColor,
      `accent="${accent}" changed the card border — the axes are coupled`,
    ).toBe(plainBorder);
  }
});

test('the two axes compose, on both paths', async () => {
  const el = await mount({ variant: 'border-purple', accent: 'green' });
  const card = partOf(el, 'card');
  expect(card.classList.contains('sk-feature-card--border-purple')).toBe(true);
  expect(partOf(el, 'chip').classList.contains('sk-feature-card__icon-chip--green')).toBe(true);
  // Same class list on the static path — one authored source (ADR-10 §3).
  const html = featureCardStaticHtml({ variant: 'border-purple', accent: 'green' });
  expect(html).toContain('sk-feature-card sk-feature-card--border-purple');
  expect(html).toContain('sk-feature-card__icon-chip sk-feature-card__icon-chip--green');
});

test('an unknown variant or accent degrades on the RENDER path and throws on the AUTHORING path', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  let el: Element;
  try {
    el = await mount({ variant: 'nope', accent: 'also-nope' });
  } finally {
    console.warn = realWarn;
  }
  const card = partOf(el!, 'card');
  expect(card, 'a throw in render() would blank the shadow root').not.toBe(null);
  expect(card.className.trim()).toBe('sk-feature-card');
  expect(partOf(el!, 'chip').className.trim()).toBe(
    'sk-feature-card__icon-chip sk-feature-card__icon-chip--yellow',
  );
  expect(el!.shadowRoot!.querySelectorAll('slot').length, 'both slots must survive').toBe(2);
  expect(warnings.length, 'both arms must warn').toBe(2);

  expect(() => featureCardStaticHtml({ variant: 'nope' })).toThrow(/unknown feature-card variant/);
  expect(() => featureCardStaticHtml({ accent: 'nope' })).toThrow(/unknown feature-card accent/);
  // Prototype-chain keys are not values. `in` reaches them; Object.hasOwn does not.
  for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    expect(() => featureCardStaticHtml({ variant: key }), `${key} must not be a variant`).toThrow(
      /unknown feature-card variant/,
    );
    expect(() => featureCardStaticHtml({ accent: key }), `${key} must not be an accent`).toThrow(
      /unknown feature-card accent/,
    );
    expect(featureCardClasses(key).trim()).toBe('sk-feature-card');
    expect(featureCardChipClasses(key).trim()).toBe(
      'sk-feature-card__icon-chip sk-feature-card__icon-chip--yellow',
    );
  }
});
