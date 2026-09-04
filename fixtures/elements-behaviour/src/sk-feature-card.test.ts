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
  expect(getComputedStyle(el).display, 'the host must be a block box').toBe('block');
  el.style.maxWidth = '200px';
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  // 200px, not a width the lane cannot distinguish: at 414px a `max-width: 640px` host measures
  // 414 when correct and 0 when regressed, so both would pass — the cannot-fail shape #77
  // shipped once and had to repair.
  expect(Math.round(el.getBoundingClientRect().width), 'max-width did not apply to the host').toBe(200);
});

test('the card and the chip PAINT, and each accent is distinct', async () => {
  // The assertion sk-section-banner was missing until #77's second gate pass: its variants were
  // asserted by classList alone, so deleting a `background:` line, swapping in a defined-but-
  // wrong token, or renaming a modifier in the CSS only would all have shipped green.
  const backgrounds = new Map<string, string>();
  for (const accent of ['yellow', 'green', 'purple'] as const) {
    const el = await mount({ accent });
    const chip = partOf(el, 'chip');
    const bg = getComputedStyle(chip).backgroundColor;
    expect(bg, `accent="${accent}" chip has no background`).not.toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(chip).color, `accent="${accent}" chip has no colour`).not.toBe('');
    backgrounds.set(accent, bg);
  }
  expect(
    new Set(backgrounds.values()).size,
    `the three accents are not distinct: ${[...backgrounds].map(([k, v]) => `${k}=${v}`).join(', ')}`,
  ).toBe(3);

  // The card frame itself, which no accent touches.
  const plain = await mount();
  expect(getComputedStyle(partOf(plain, 'card')).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('the border variants change the BORDER colour, and only that', async () => {
  const borders = new Map<string, string>();
  const plain = await mount();
  const plainBorder = getComputedStyle(partOf(plain, 'card')).borderColor;
  for (const variant of ['border-yellow', 'border-green', 'border-purple'] as const) {
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
  expect(new Set(borders.values()).size, 'the three border variants are not distinct').toBe(3);
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
