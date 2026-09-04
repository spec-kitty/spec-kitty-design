/**
 * <sk-grid> — #77's layout batch.
 *
 * Two registry behaviours, both genuinely owned: SC-013 (the declared ::part() is targetable
 * from outside) and SC-014 (the adopted sheet is the generated one, by identity, with no
 * <style> injected). The rest of this file asserts component claims that carry no id, the way
 * sk-card.test.ts does — the axis/variant mapping, the two failure policies, and the one thing
 * a layout primitive can silently get wrong: blocking its children from being themed.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import { gridClasses, gridStaticHtml, skGridSheet } from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const settled = async (el: Element) => {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el.shadowRoot!.querySelector('[part="grid"]') as HTMLElement;
};

const mount = async (attrs: Record<string, string> = {}, children = 3) => {
  const el = document.createElement('sk-grid');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (let i = 0; i < children; i++) {
    const c = document.createElement('div');
    c.textContent = `item ${i + 1}`;
    el.append(c);
  }
  document.body.append(el);
  return { el, inner: await settled(el) };
};

test('[SC-013] the ADR-9 styling API is targetable from outside', async () => {
  const { inner } = await mount();
  const s = document.createElement('style');
  s.textContent = 'sk-grid::part(grid) { outline-style: dashed; }';
  document.head.append(s);
  try {
    expect(getComputedStyle(inner).outlineStyle).toBe('dashed');
  } finally {
    s.remove();
  }
});

test('[SC-014] the element adopts the GENERATED sheet by identity and injects no <style>', async () => {
  const { el } = await mount();
  const sr = el.shadowRoot!;
  // Identity against the module generated from @spec-kitty/styles — provenance, not the
  // tautology of comparing against the class's own `static styles`.
  expect(sr.adoptedStyleSheets.length).toBe(1);
  expect(sr.adoptedStyleSheets[0]).toBe(skGridSheet);
  expect(sr.querySelectorAll('style').length).toBe(0);
});

test('the slotted children are the GRID ITEMS, not the slot', async () => {
  // The one structural mistake this element can make and still look plausible. The children
  // live in the light DOM and the grid box is a div inside the shadow root; they only become
  // its items because a <slot> is `display: contents`. Give the slot any other display and
  // every child collapses into a single cell — which reads as "the column modifier is broken"
  // rather than "the slot has a display".
  const { el, inner } = await mount({ variant: 'cols-3' }, 3);
  const slot = el.shadowRoot!.querySelector('slot') as HTMLSlotElement;
  expect(getComputedStyle(slot).display, 'the slot must not generate a box').toBe('contents');
  expect(slot.assignedNodes({ flatten: false }).length).toBe(3);
  expect(inner.classList.contains('sk-grid--cols-3')).toBe(true);

  // ASSERTED ON LAYOUT, and on the GAP rather than on column count.
  //
  // This lane runs at a 414px viewport — measured, not assumed — so the 720px media query
  // below always applies here and a column-count assertion could only ever observe one
  // column. The gap discriminates without depending on the viewport: `gap` is a grid property
  // that applies BETWEEN ITEMS, so it separates the children only if the children are the
  // items. If the slot became the single item, its three children would be in normal block
  // flow inside it and butt together at zero spacing, in any number of columns.
  const rowGap = parseFloat(getComputedStyle(inner).rowGap);
  expect(rowGap, 'row-gap did not resolve — the token sheet is not loaded').toBeGreaterThan(0);

  const rects = Array.from(el.children).map((c) => c.getBoundingClientRect());
  const gaps: number[] = [];
  let previous: DOMRect | undefined;
  for (const r of rects) {
    if (previous) gaps.push(Math.round(r.top - previous.bottom));
    previous = r;
  }
  expect(gaps.length, 'nothing was compared — the children did not render').toBe(2);
  for (const g of gaps) {
    expect(
      g,
      'consecutive children are not separated by the grid gap — they are laid out inside the ' +
        'slot rather than as items of the grid',
    ).toBe(Math.round(rowGap));
  }
});

/**
 * Reads a declaration out of the ADOPTED sheet, optionally from inside a media block.
 *
 * WHY THIS IS NOT A LIVE LAYOUT MEASUREMENT, stated plainly because the weaker form needs the
 * stronger justification.
 *
 * Two pre-merge lenses found that `.sk-grid--cols-2/3/4` could be deleted with the whole
 * pipeline green, because the only assertion covering them sat in a `matchMedia` branch that
 * the lane's 414px viewport never took. The obvious repair — `page.viewport(1200, 800)` and
 * measure — works in chromium and does NOT work in webkit, which CI proved twice:
 *
 *   cols-2 above 720px: expected 2 track(s), computed "1200px"
 *
 * `1200px` is one track at the full resized width, so the resize landed and the box really is
 * 1200 wide; webkit simply had not re-evaluated the `@media (max-width: 720px)` block inside
 * the ADOPTED CONSTRUCTED stylesheet. Waiting on `matchMedia`, and then polling the computed
 * value for two seconds, both failed to change it.
 *
 * So the track counts are asserted against the stylesheet the element actually adopts. What
 * that does prove: the rules exist, they declare the right number of tracks, the media block
 * collapses exactly the three modifiers, and deleting or editing any of it reds this test —
 * which is the regression the lenses found. What it does NOT prove is that a browser applies
 * them at a wide viewport.
 *
 * THAT IS PROVED IN `apps/storybook/src/tests/sk-grid-layout.spec.ts`, which loads the real
 * stories in chromium, firefox and webkit at a Desktop viewport. That lane creates its context
 * at 1280 wide, so the media query is evaluated at the right width from first layout and the
 * resize path that fails in webkit is never taken.
 *
 * An earlier revision of this paragraph named "the Storybook visual layer" as the residual net.
 * It was not: visual.spec.ts carries exactly three baselines — sk-stub, sk-feature-card,
 * sk-ribbon-card — and is chromium-only. Three pass-2 lenses caught that independently, in the
 * note written to be honest about the gap. The spec above is the coverage this sentence used to
 * claim.
 */
const declarationIn = (
  sheet: CSSStyleSheet,
  selector: string,
  property: string,
  media?: string,
): string | undefined => {
  // EVERY match, not the first. Returning the first is what makes a cascade regression
  // invisible to a sheet-reading test: appending `.sk-grid--cols-3 { grid-template-columns: 1fr }`
  // at the end of the sheet, or `!important` on the base rule, leaves the first match reading
  // correctly while the modifier is dead in a browser. A pass-2 lens named that hole. Collecting
  // all matches lets the caller refuse an ambiguous sheet outright.
  const matches: string[] = [];
  for (const rule of Array.from(sheet.cssRules)) {
    if (media === undefined && rule instanceof CSSStyleRule && rule.selectorText === selector) {
      matches.push(rule.style.getPropertyValue(property).trim());
    }
    if (media !== undefined && rule instanceof CSSMediaRule) {
      if (rule.conditionText.replace(/\s+/g, '') !== media.replace(/\s+/g, '')) continue;
      for (const inner of Array.from(rule.cssRules)) {
        if (
          inner instanceof CSSStyleRule &&
          inner.selectorText.split(',').map((x) => x.trim()).includes(selector)
        ) {
          matches.push(inner.style.getPropertyValue(property).trim());
        }
      }
    }
  }
  if (matches.length > 1) {
    throw new Error(
      `${selector} declares ${property} ${matches.length} times${media ? ` inside ${media}` : ''} ` +
        `(${matches.map((m) => JSON.stringify(m)).join(', ')}). A later duplicate silently wins ` +
        `in a browser, so this sheet is ambiguous and the single-value assertions below would ` +
        `read the first one and pass.`,
    );
  }
  return matches[0];
};

test('each column modifier declares its own track count in the adopted sheet', () => {
  // Normalised for whitespace only — engines re-serialise `repeat(2, 1fr)` consistently, but
  // the spacing after the comma is not worth depending on.
  const tracks = (selector: string, media?: string) =>
    declarationIn(skGridSheet, selector, 'grid-template-columns', media)?.replace(/\s+/g, ' ');

  expect(tracks('.sk-grid'), 'the base grid must declare a single track').toBe('1fr');
  for (const n of [2, 3, 4] as const) {
    expect(
      tracks(`.sk-grid--cols-${n}`),
      `.sk-grid--cols-${n} must declare ${n} tracks — deleting it is the regression this asserts`,
    ).toBe(`repeat(${n}, 1fr)`);
  }
  // The three declarations must DIFFER from the base, or a stylesheet that gave every grid one
  // track would satisfy the loop above if the expectations were ever loosened.
  expect(new Set([2, 3, 4].map((n) => tracks(`.sk-grid--cols-${n}`))).size).toBe(3);
});

test('the 720px media block collapses exactly the three column modifiers', () => {
  const M = '(max-width: 720px)';
  for (const n of [2, 3, 4] as const) {
    expect(
      declarationIn(skGridSheet, `.sk-grid--cols-${n}`, 'grid-template-columns', M),
      `.sk-grid--cols-${n} must collapse below 720px`,
    ).toBe('1fr');
  }
  // The BASE must not be in the media block: collapsing it would be a no-op that makes the
  // block look correct while the modifiers escaped it.
  expect(
    declarationIn(skGridSheet, '.sk-grid', 'grid-template-columns', M),
    'the base grid must not appear in the collapse block',
  ).toBeUndefined();
});

test('the HOST is a block box, so a consumer can size it', async () => {
  // THE FOLD'S OWN FIX, ASSERTED. #77's pre-merge gate found that five committed stories put
  // `style="max-width: …"` on <sk-grid> and every one was inert: a custom element defaults to
  // `display: inline`, and max-width does not apply to a non-replaced inline box. The repair was
  // one CSS line — and it shipped with no test, so deleting it would have reverted the bug with
  // the whole pipeline green. A pass-2 lens caught that, in the fold that fixed it.
  const el = document.createElement('sk-grid');
  el.style.maxWidth = '640px';
  document.body.append(el);
  await settled(el);
  expect(getComputedStyle(el).display, 'the host must be a block box').toBe('block');
  // And the consequence, not just the property: max-width must actually constrain it.
  expect(el.getBoundingClientRect().width, 'max-width did not apply to the host').toBeLessThanOrEqual(640);
});

test('the collapse below 720px is real, measured at the lane viewport', async () => {
  // The live half. The lane runs at 414px — measured, not assumed — so this is the branch that
  // genuinely executes here, and deleting the @media block reds it.
  expect(window.matchMedia('(max-width: 720px)').matches, 'the lane is not below the breakpoint').toBe(
    true,
  );
  const { inner } = await mount({ variant: 'cols-3' }, 3);
  expect(inner.classList.contains('sk-grid--cols-3'), 'the modifier class is not applied').toBe(true);
  expect(
    getComputedStyle(inner).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
    'below 720px every column modifier collapses to one track',
  ).toBe(1);
});

test('the gap modifiers change the measured gap, not just the class list', async () => {
  // The gap classes were asserted only as strings, so deleting .sk-grid--gap-3 and
  // .sk-grid--gap-6 from the stylesheet left the suite green.
  const gapOf = async (attrs: Record<string, string>) => {
    const { inner } = await mount(attrs, 2);
    return parseFloat(getComputedStyle(inner).rowGap);
  };
  const base = await gapOf({});
  const small = await gapOf({ gap: '3' });
  const large = await gapOf({ gap: '6' });
  expect(base, 'the token sheet is not loaded').toBeGreaterThan(0);
  expect(small, 'gap="3" did not change the computed gap').toBeLessThan(base);
  expect(large, 'gap="6" did not change the computed gap').toBeGreaterThan(base);
  // gap="4" restates the default, so it has no ordering to assert — but the derived GRID_AXES
  // now emits SkGridGap4HTML, so the value is a published surface and is checked for equality
  // rather than left as the one modifier nothing covers.
  expect(await gapOf({ gap: '4' }), 'gap="4" must equal the default gap').toBe(base);
});

// RESTORED. This test was deleted by accident in #77's pass-1 fold — a range replacement that
// rewrote the block between two other tests swallowed it, and the 70-line commit body did not
// mention it because I did not know. A pass-2 lens found it by diffing against the pass-1 head.
// The file's own docstring still advertised the claim while the coverage was gone, which is the
// certifying-absence shape this mission exists to close, produced by the fold that closes it.
//
// It is also load-bearing for a change made in that same fold: `:host { display: block }` was
// added to sk-grid.css, and this test's comment names a `:host` declaration as exactly what it
// guards against.
test('a grid does not block its children from being themed', async () => {
  // The failure mode a layout primitive has. Custom properties inherit through a shadow
  // boundary; selectors do not. If sk-grid ever grew a `:host` colour declaration or an
  // rgba() literal, cards inside it would stop following the theme while the grid itself
  // still looked right — and no visual diff of the GRID would show it.
  const dark = document.createElement('sk-grid');
  const darkCard = document.createElement('sk-card');
  darkCard.setAttribute('variant', 'blue');
  dark.append(darkCard);
  document.body.append(dark);

  const wrap = document.createElement('div');
  wrap.className = 'sk-light';
  const light = document.createElement('sk-grid');
  const lightCard = document.createElement('sk-card');
  lightCard.setAttribute('variant', 'blue');
  light.append(lightCard);
  wrap.append(light);
  document.body.append(wrap);

  await settled(dark);
  await settled(light);
  await (darkCard as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  await (lightCard as unknown as { updateComplete: Promise<unknown> }).updateComplete;

  const border = (c: Element) =>
    getComputedStyle(c.shadowRoot!.querySelector('[part="card"]')!).borderColor;
  expect(border(darkCard)).toContain('169, 199, 232');
  expect(
    border(lightCard),
    'light mode did not reach a card nested inside a grid — the grid is interrupting inheritance',
  ).toContain('46, 74, 107');
});

test('variant and gap are independent attributes, and map to the static layer\'s classes', async () => {
  const { inner } = await mount({ variant: 'cols-2', gap: '6' });
  expect(inner.classList.contains('sk-grid')).toBe(true);
  expect(inner.classList.contains('sk-grid--cols-2')).toBe(true);
  expect(inner.classList.contains('sk-grid--gap-6')).toBe(true);
  // Same class list as the static path — one authored source (ADR-10 §3).
  expect(gridStaticHtml({ variant: 'cols-2', gap: 6 })).toContain('sk-grid sk-grid--cols-2 sk-grid--gap-6');
});

test('an unknown variant degrades on the RENDER path — the grid still paints and still slots', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  let el: Element, inner: HTMLElement;
  try {
    ({ el, inner } = await mount({ variant: 'definitely-not-a-variant' }, 2));
  } finally {
    console.warn = realWarn;
  }
  expect(inner!, 'a throw in render() would blank the shadow root').not.toBe(null);
  expect(inner!.className.trim()).toBe('sk-grid');
  expect(el!.shadowRoot!.querySelector('slot'), 'the slot must survive').not.toBe(null);
  expect(warnings.length, 'degrading must warn — fail-open with no signal is what this replaced').toBe(1);
  expect(String(warnings[0]?.[0])).toContain('definitely-not-a-variant');
});

test('an unknown variant or gap THROWS on the authoring path', () => {
  expect(() => gridStaticHtml({ variant: 'definitely-not-a-variant' })).toThrow(/unknown grid variant/);
  expect(() => gridStaticHtml({ gap: 5 })).toThrow(/unknown grid gap/);
  // Prototype-chain keys are not variants OR gaps. Both arms are asserted because the first
  // draft of the markup module guarded only the variant: `'constructor' in GRID_GAPS` is true
  // and `GRID_GAPS['constructor']` is a function, so the gap arm emitted
  // `class="sk-grid function Object() { [native code] }"` into real markup, exit 0.
  for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    expect(() => gridStaticHtml({ variant: key }), `${key} must not be a variant`).toThrow(
      /unknown grid variant/,
    );
    expect(
      () => gridStaticHtml({ gap: key as unknown as number }),
      `${key} must not be a gap`,
    ).toThrow(/unknown grid gap/);
    expect(gridClasses(key).trim(), `${key} must degrade to the base grid`).toBe('sk-grid');
    expect(
      gridClasses(undefined, key as unknown as number).trim(),
      `${key} as a gap must degrade to the base grid, not stringify a function into the class list`,
    ).toBe('sk-grid');
  }
  expect(gridStaticHtml({ variant: 'cols-4' })).toContain('sk-grid--cols-4');
  expect(gridClasses('cols-3', 3)).toBe('sk-grid sk-grid--cols-3 sk-grid--gap-3');
});
