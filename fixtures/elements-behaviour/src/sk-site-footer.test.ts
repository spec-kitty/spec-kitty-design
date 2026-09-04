/**
 * <sk-site-footer> — #77's remaining component, and the last in the catalogue apart from
 * form-field (#141).
 *
 * SC-013 and SC-014, plus the two claims specific to this component: its generated artifact does
 * not depend on the wall clock, and its content belongs to the consumer.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import { PLACEHOLDER_LEGAL, siteFooterStaticHtml, skSiteFooterSheet } from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';
import { contrast, assertThemesDiffered } from './contrast.js';

beforeEach(installTokenSheet);

const mount = async () => {
  const el = document.createElement('sk-site-footer');
  el.innerHTML =
    '<div slot="brand" class="sk-site-footer__column">' +
    '<p class="sk-site-footer__tagline">Tagline</p></div>' +
    '<nav class="sk-site-footer__column" aria-label="Product links">' +
    '<div class="sk-site-footer__heading">Product</div>' +
    '<ul class="sk-site-footer__links">' +
    '<li><a href="#" class="sk-site-footer__link">Docs</a></li></ul></nav>' +
    '<span slot="legal">© 2026 Your Company.</span>';
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

const partOf = (el: Element, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

test('[SC-013] every declared part is targetable from outside', async () => {
  const el = await mount();
  const cases: readonly (readonly [string, string])[] = [
    ['footer', 'sk-site-footer::part(footer) { outline-style: dashed; }'],
    ['grid', 'sk-site-footer::part(grid) { outline-style: dashed; }'],
    ['divider', 'sk-site-footer::part(divider) { outline-style: dashed; }'],
    ['legal', 'sk-site-footer::part(legal) { outline-style: dashed; }'],
  ];
  // A FLOOR, so trimming the table cannot quietly shrink what this asserts.
  expect(cases.length, 'every declared part must have a case here').toBe(4);
  for (const [name, rule] of cases) {
    const s = document.createElement('style');
    s.textContent = rule;
    document.head.append(s);
    try {
      const node = partOf(el, name);
      expect(node, `part="${name}" is not rendered`).not.toBe(null);
      // INTERPOLATED. check-part-ratchet.mjs greps the concatenated test sources for the literal
      // `::part(<name>)`; a copy in a failure message is a second, non-selector occurrence that
      // would keep the arm green if the real rule above were deleted (#140).
      expect(
        getComputedStyle(node!).outlineStyle,
        `::part(${name}) is not targetable`,
      ).toBe('dashed');
    } finally {
      s.remove();
    }
  }
});

test('[SC-014] the element adopts the GENERATED sheet by identity and injects no <style>', async () => {
  const el = await mount();
  const sr = el.shadowRoot!;
  expect(sr.adoptedStyleSheets.length).toBe(1);
  expect(sr.adoptedStyleSheets[0]).toBe(skSiteFooterSheet);
  expect(sr.querySelector('style'), 'a constructed sheet, not a <style> element').toBe(null);
});

test('the content is the CONSUMER\'S — all three slots reach their region', async () => {
  const el = await mount();
  const named = (name: string) =>
    (el.shadowRoot!.querySelector(`slot[name="${name}"]`) as HTMLSlotElement).assignedNodes();

  expect(named('brand').length, 'the brand slot must take assigned content').toBe(1);
  expect(named('legal')[0]!.textContent).toContain('Your Company');

  // The default slot takes the link columns, and they become grid items — a <slot> is
  // `display: contents`, so the assigned nodes are laid out as children of the grid div.
  const columns = (el.shadowRoot!.querySelector('slot:not([name])') as HTMLSlotElement)
    .assignedElements();
  expect(columns.length, 'the default slot takes the link columns').toBe(1);
  expect(columns[0]!.tagName).toBe('NAV');
  expect(getComputedStyle(partOf(el, 'grid')!).display).toBe('grid');
});

test('the generated form does not read the clock', async () => {
  // THE DEFECT THIS MISSION EXISTS TO PREVENT. The barrel this component replaces opened with
  // `const year = new Date().getFullYear()`. Once the artifact is generated and drift-gated, a
  // clock-dependent byte means the committed file stops matching a fresh generation on 1 January
  // — CI red for everyone, with no code change. ADR-11 item 9.
  //
  // Asserted two ways: the placeholder is a fixed string, and generating twice is identical.
  // A year-shaped assertion alone would pass in 2026 for the wrong reason.
  expect(PLACEHOLDER_LEGAL).not.toMatch(new RegExp(String(new Date().getFullYear() + 1)));
  expect(PLACEHOLDER_LEGAL).toContain('2026');
  expect(siteFooterStaticHtml()).toBe(siteFooterStaticHtml());

  // And the element renders NO year of its own: the legal line is slotted, because a component
  // asserting a consumer's copyright is wrong on its own terms.
  const el = await mount();
  const legal = partOf(el, 'legal')!;
  expect(legal.textContent!.trim(), 'the element must not author a legal line').toBe('');
});

test('every ink meets AA in BOTH themes', async () => {
  // Retiring this component's inert `data-theme="light"` wrapper (#93) is what makes its light
  // stories render the light palette for the first time. The same move exposed four failing
  // pill-tag variants and a 1.73:1 check-bullet tick, so this is measured rather than assumed.
  const surfaces = new Map<string, string>();

  for (const theme of ['dark', 'light'] as const) {
    const wrap = document.createElement('div');
    if (theme === 'light') wrap.className = 'sk-light';
    wrap.style.background = 'var(--sk-surface-page)';
    document.body.append(wrap);

    const el = document.createElement('sk-site-footer');
    el.innerHTML = '<span slot="legal">© 2026 Your Company.</span>';
    wrap.append(el);
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

    const bg = getComputedStyle(wrap).backgroundColor;
    surfaces.set(theme, bg);

    const ratio = contrast(getComputedStyle(partOf(el, 'legal')!).color, bg);
    expect(
      ratio,
      `the legal line in ${theme} mode is ${ratio.toFixed(2)}:1 — AA needs 4.5`,
    ).toBeGreaterThanOrEqual(4.5);
  }

  // Without this a light arm silently rendering the dark palette passes every ratio above.
  assertThemesDiffered(surfaces);
});
