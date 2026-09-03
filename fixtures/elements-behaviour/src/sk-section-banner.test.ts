/**
 * <sk-section-banner> — #77's layout batch.
 *
 * SC-013 (all three declared parts targetable from outside) and SC-014 (the adopted sheet is
 * the generated one, by identity). The rest are component claims with no registry id: the
 * variant mapping, the default-variant rule, the two failure policies, and the accessible name.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import {
  sectionBannerClasses,
  sectionBannerStaticHtml,
  skSectionBannerSheet,
} from '@spec-kitty/elements';
import tokensCss from '@spec-kitty/tokens/tokens.css?raw';

const tokenStyle = () => {
  const s = document.createElement('style');
  s.textContent = tokensCss;
  document.head.append(s);
  return s;
};

let style: HTMLStyleElement;
beforeEach(() => {
  document.body.innerHTML = '';
  style?.remove();
  style = tokenStyle();
});

const mount = async (variant?: string, label = 'Version 1.x') => {
  const el = document.createElement('sk-section-banner');
  if (variant !== undefined) el.setAttribute('variant', variant);
  el.textContent = label;
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

test('[SC-013] every declared part is targetable from outside', async () => {
  const el = await mount();
  // EVERY declared part, and each selector written OUT IN FULL rather than built from a
  // template literal. expected-parts.json is satisfied by a SOURCE SCAN for the literal text
  // `::part(<name>)`, so a loop over `::part(${part})` targets all of them at runtime and
  // records none of them to the ratchet — the gate would report the parts as untested while
  // this test genuinely tested them, and the reverse (a literal in a comment with no test) is
  // the looseness the ratchet already documents.
  const cases: readonly (readonly [string, string])[] = [
    ['banner', 'sk-section-banner::part(banner) { outline-style: dashed; }'],
    ['dot', 'sk-section-banner::part(dot) { outline-style: dashed; }'],
    ['label', 'sk-section-banner::part(label) { outline-style: dashed; }'],
  ];
  for (const [name, rule] of cases) {
    const s = document.createElement('style');
    s.textContent = rule;
    document.head.append(s);
    try {
      const node = el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;
      expect(node, `part="${name}" is declared but not rendered`).not.toBe(null);
      expect(getComputedStyle(node!).outlineStyle, `::part(${name}) is not targetable`).toBe(
        'dashed',
      );
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
  expect(sr.adoptedStyleSheets[0]).toBe(skSectionBannerSheet);
  expect(sr.querySelectorAll('style').length).toBe(0);
});

test('the accessible name is the label alone — the dot is not announced', async () => {
  // The dot is a bullet character in the markup. Without aria-hidden it joins the accessible
  // name and a screen reader announces it before every banner. Nothing else in the suite would
  // notice: it is visually correct either way, and axe does not flag a decorative glyph that
  // has been given a name.
  const el = await mount('green', 'Version 3.x');
  const dot = el.shadowRoot!.querySelector('[part="dot"]')!;
  expect(dot.getAttribute('aria-hidden')).toBe('true');
  expect(el.shadowRoot!.querySelector('[part="label"]')!.textContent).toBe('');
  // The label text is slotted, so it lives in the light DOM and is named by the slot.
  const slot = el.shadowRoot!.querySelector('slot') as HTMLSlotElement;
  expect(slot.assignedNodes().map((n) => n.textContent).join('')).toBe('Version 3.x');
});

test('variants are attributes and map to the static layer\'s classes', async () => {
  for (const v of ['neutral', 'purple', 'green'] as const) {
    const el = await mount(v);
    const banner = el.shadowRoot!.querySelector('[part="banner"]')!;
    expect(banner.classList.contains('sk-section-banner')).toBe(true);
    expect(banner.classList.contains(`sk-section-banner--${v}`), `variant="${v}" did not map`).toBe(
      true,
    );
    expect(sectionBannerStaticHtml({ variant: v })).toContain(`sk-section-banner--${v}`);
  }
});

test('the base form is the NEUTRAL banner, not an unpainted one', async () => {
  // Unlike sk-card, the base class sets no background and no colour — the variant carries
  // both. A base form with no variant would be invisible rather than plainer, so `neutral` is
  // the default on BOTH paths. If they ever disagree, the element and the static card render
  // differently for the same input.
  const el = await mount(undefined);
  expect(el.shadowRoot!.querySelector('[part="banner"]')!.classList.contains(
    'sk-section-banner--neutral',
  )).toBe(true);
  expect(sectionBannerStaticHtml({})).toContain('sk-section-banner--neutral');
  expect(sectionBannerClasses()).toBe('sk-section-banner sk-section-banner--neutral');
});

test('an unknown variant degrades on the RENDER path and throws on the AUTHORING path', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  let el: Element;
  try {
    el = await mount('definitely-not-a-variant');
  } finally {
    console.warn = realWarn;
  }
  const banner = el!.shadowRoot!.querySelector('[part="banner"]') as HTMLElement | null;
  expect(banner, 'a throw in render() would blank the shadow root').not.toBe(null);
  expect(banner!.className.trim()).toBe('sk-section-banner sk-section-banner--neutral');
  expect(el!.shadowRoot!.querySelector('slot'), 'the slot must survive').not.toBe(null);
  expect(warnings.length).toBe(1);
  expect(String(warnings[0]?.[0])).toContain('definitely-not-a-variant');

  expect(() => sectionBannerStaticHtml({ variant: 'definitely-not-a-variant' })).toThrow(
    /unknown section-banner variant/,
  );
  // Prototype-chain keys are not variants.
  for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    expect(() => sectionBannerStaticHtml({ variant: key }), `${key} must not be accepted`).toThrow(
      /unknown section-banner variant/,
    );
    expect(sectionBannerClasses(key), `${key} must degrade to the default variant`).toBe(
      'sk-section-banner sk-section-banner--neutral',
    );
  }
});
