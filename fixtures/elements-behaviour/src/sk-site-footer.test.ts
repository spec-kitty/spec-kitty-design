/**
 * <sk-site-footer> — #77's remaining component, and the last in the catalogue apart from
 * form-field (#141).
 *
 * The shape under test is the operator's ruling on #77: the element owns the structure and text
 * arrives as PROPERTIES; only the link items are slotted, as `<li>` directly inside the element's
 * own `<ul>`. An earlier revision of this component slotted whole columns — which put the
 * headings and lists outside `::slotted()`'s reach — and had to be rebuilt when a lens found the
 * ruling had already been recorded and contradicted.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import { PLACEHOLDER_LEGAL, siteFooterStaticHtml, skSiteFooterSheet } from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';
import { contrast, assertThemesDiffered } from './contrast.js';

beforeEach(installTokenSheet);

const ATTRS = {
  wordmark: 'Your Brand',
  tagline: 'One sentence on what you do.',
  'headingone': 'Product',
  'headingtwo': 'Connect',
  legal: '© YYYY Your Company. All rights reserved.',
} as const;

const mount = async (attrs: Record<string, string> = ATTRS) => {
  const el = document.createElement('sk-site-footer');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.innerHTML =
    '<li slot="column-one"><a href="#" class="sk-site-footer__link">Docs</a></li>' +
    '<li slot="column-two"><a href="#" class="sk-site-footer__link">Contact</a></li>';
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

const partOf = (el: Element, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

/**
 * The component's own sheet, in the DOCUMENT.
 *
 * Only the `<a>` inside each slotted `<li>` needs it — everything else is a shadow node or a
 * directly-assigned `<li>` that `::slotted(li)` reaches. Called from inside a test rather than a
 * hook: adopting in `beforeEach` did not survive to the body here, and the symptom (a
 * transparent surface, which `contrast()`'s alpha guard rejects) is recorded rather than a cause,
 * because the cause was never established — see sk-nav-pill-cta-contrast.test.ts, which retracted
 * an explanation for the same symptom.
 */
const adoptSheetIntoDocument = () => {
  if (!document.adoptedStyleSheets.includes(skSiteFooterSheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, skSiteFooterSheet];
  }
};

test('[SC-013] every declared part is targetable from outside', async () => {
  const el = await mount();
  const cases: readonly (readonly [string, string])[] = [
    ['footer', 'sk-site-footer::part(footer) { outline-style: dashed; }'],
    ['grid', 'sk-site-footer::part(grid) { outline-style: dashed; }'],
    ['divider', 'sk-site-footer::part(divider) { outline-style: dashed; }'],
    ['legal', 'sk-site-footer::part(legal) { outline-style: dashed; }'],
  ];
  expect(cases.length, 'every declared part must have a case here').toBe(4);
  for (const [name, rule] of cases) {
    const s = document.createElement('style');
    s.textContent = rule;
    document.head.append(s);
    try {
      const node = partOf(el, name);
      expect(node, `part="${name}" is not rendered`).not.toBe(null);
      // Interpolated: check-part-ratchet.mjs greps the concatenated test sources for the literal
      // `::part(<name>)`, so a copy in a message would keep the arm green if the rule above were
      // deleted (#140).
      expect(getComputedStyle(node!).outlineStyle, `::part(${name}) is not targetable`).toBe(
        'dashed',
      );
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

test('text is a PROPERTY and the link items are SLOTTED — the #77 ruling', async () => {
  const el = await mount();
  const sr = el.shadowRoot!;

  // The element owns the structure: two <nav>s, each with a heading and its own <ul>.
  expect(sr.querySelectorAll('nav').length, 'the element renders both columns').toBe(2);
  expect(sr.querySelectorAll('ul').length, 'the <ul> belongs to the element, not the consumer').toBe(2);
  expect(sr.querySelector('.sk-site-footer__wordmark')!.textContent).toBe('Your Brand');
  expect(sr.querySelector('.sk-site-footer__heading')!.textContent).toBe('Product');

  // `aria-label` is derived from the heading, so the two cannot drift.
  expect(sr.querySelector('nav')!.getAttribute('aria-label')).toBe('Product links');

  // And the items are DIRECTLY assigned into that <ul>, which is what puts them in
  // `::slotted(li)`'s reach — the whole reason the ruling drew the boundary here.
  const slot = sr.querySelector('slot[name="column-one"]') as HTMLSlotElement;
  const assigned = slot.assignedElements();
  expect(assigned.length, 'the consumer supplies the <li> items').toBe(1);
  expect(assigned[0]!.tagName).toBe('LI');
  expect(slot.closest('ul'), 'the slot sits inside the element-owned <ul>').not.toBe(null);
});

test('the divider is drawn only when there is a legal line to divide', async () => {
  // Read synchronously from a property during render — no slotchange, so no second update after
  // `updateComplete` resolves. A lens measured that gap on the previous, slot-derived design:
  // `updateComplete` resolved `true` while the tree was still going to change.
  const withLegal = await mount();
  expect(partOf(withLegal, 'divider'), 'a legal line gets a divider').not.toBe(null);

  const { legal: _omitted, ...withoutLegal } = ATTRS;
  const bare = await mount(withoutLegal);
  expect(
    partOf(bare, 'divider'),
    'no legal line must not draw a separator over nothing',
  ).toBe(null);

  // Whitespace is not a legal line either.
  const blank = await mount({ ...ATTRS, legal: '   ' });
  expect(partOf(blank, 'divider'), 'whitespace is not a legal line').toBe(null);
});

test('the generated form does not read the clock', async () => {
  // THE DEFECT THIS MISSION EXISTS TO PREVENT, and the one the #77 ruling names: the barrel this
  // replaces opened with `new Date().getFullYear()`. Harmless while hand-authored; not harmless
  // once GENERATED, because the generator calls it at build time and commits the result — so the
  // year is baked in and `--check` fails on 1 January against a tree nobody touched.
  //
  // The placeholder is year-FREE, so any four-digit run in the generated markup is the clock
  // leaking in. This reds TODAY, in any year — unlike the three assertions it replaced, which a
  // lens showed could not fail at all.
  expect(PLACEHOLDER_LEGAL, 'the placeholder must not contain a year').not.toMatch(/\d{4}/);
  expect(
    siteFooterStaticHtml(),
    'no four-digit year may reach the generated markup',
  ).not.toMatch(/\d{4}/);
});

test('every ink meets AA in BOTH themes', async () => {
  adoptSheetIntoDocument();
  const surfaces = new Map<string, string>();

  for (const theme of ['dark', 'light'] as const) {
    const wrap = document.createElement('div');
    if (theme === 'light') wrap.className = 'sk-light';
    wrap.style.background = 'var(--sk-surface-page)';
    document.body.append(wrap);

    const el = document.createElement('sk-site-footer');
    for (const [k, v] of Object.entries(ATTRS)) el.setAttribute(k, v);
    el.innerHTML = '<li slot="column-one"><a href="#" class="sk-site-footer__link">Docs</a></li>';
    wrap.append(el);
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

    const bg = getComputedStyle(wrap).backgroundColor;
    surfaces.set(theme, bg);

    const sr = el.shadowRoot!;
    const inks: readonly (readonly [string, HTMLElement])[] = [
      ['legal', partOf(el, 'legal')!],
      ['wordmark', sr.querySelector('.sk-site-footer__wordmark') as HTMLElement],
      ['tagline', sr.querySelector('.sk-site-footer__tagline') as HTMLElement],
      ['heading', sr.querySelector('.sk-site-footer__heading') as HTMLElement],
      ['link', el.querySelector('.sk-site-footer__link') as HTMLElement],
    ];

    // DERIVED FROM THE SHEET, not a typed count. An earlier revision asserted `inks.length === 5`
    // under the message "every ink the sheet sets must have a case here" — a literal three lines
    // above, so nothing derived it and a new rule never tripped it. Two lenses called that.
    // `:hover` is excluded by name because it cannot be measured without simulating hover.
    const colouredLeaves = new Set(
      Array.from(skSiteFooterSheet.cssRules)
        .filter((r) => r.cssText.includes('color:') && !r.cssText.includes(':hover'))
        .flatMap((r) => [...r.cssText.matchAll(/\.sk-site-footer__([a-z-]+)/g)].map((m) => m[1]!)),
    );
    for (const leaf of colouredLeaves) {
      expect(
        inks.some(([name]) => name === leaf),
        `the sheet sets a colour on .sk-site-footer__${leaf} but no case measures it`,
      ).toBe(true);
    }

    for (const [name, node] of inks) {
      expect(node, `${name} must be present to be measured`).not.toBe(null);
      const ratio = contrast(getComputedStyle(node).color, bg);
      expect(
        ratio,
        `${name} in ${theme} mode is ${ratio.toFixed(2)}:1 — AA needs 4.5`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }

  assertThemesDiffered(surfaces);
});
