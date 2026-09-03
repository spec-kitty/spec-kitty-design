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
import { page } from '@vitest/browser/context';
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
 * Resize, then WAIT FOR THE MEDIA QUERY TO AGREE before returning.
 *
 * `await page.viewport()` resolves when the resize has been dispatched, NOT when the engine has
 * re-evaluated media queries against the new size. Chromium happened to be fast enough that
 * reading a computed style on the next line worked; webkit was not, and CI failed with
 * "cols-2 must lay out 2 tracks: expected 1 to be 2" on the very first assertion — the test
 * measuring the OLD viewport and reporting it as a broken stylesheet.
 *
 * So the precondition is asserted rather than assumed, and it throws with its own message if it
 * never holds: a test that silently measured the wrong viewport is what this whole test exists
 * to stop being.
 */
const resizeTo = async (width: number, height: number, expectNarrow: boolean) => {
  await page.viewport(width, height);
  const deadline = Date.now() + 2000;
  while (window.matchMedia('(max-width: 720px)').matches !== expectNarrow) {
    if (Date.now() > deadline) {
      throw new Error(
        `viewport(${width}, ${height}) did not re-evaluate the 720px media query within 2s — ` +
          `matchMedia still reports ${!expectNarrow}. Every assertion after this point would ` +
          `have measured the previous viewport.`,
      );
    }
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  }
};

test('the column modifiers lay out N tracks above the breakpoint, and collapse below it', async () => {
  // BOTH WIDTHS ARE DRIVEN, and this test previously drove neither.
  //
  // It used to branch on `window.matchMedia('(max-width: 720px)')` and assert `tracks === 1` in
  // one arm and `tracks === 3` in the other, with a comment claiming both arms assert. They do
  // not: vitest defaults `browser.viewport.width` to 414 and vitest.config.mts sets none, so
  // the query always matched, the 3-track arm was dead code, and DELETING .sk-grid--cols-2/3/4
  // from the stylesheet left the entire suite green — the one feature this element exists for,
  // asserted by no line that runs. Two pre-merge lenses found it independently.
  //
  // `page.viewport()` resizes the iframe, so the media query is genuinely re-evaluated.
  // POLLS, and reports the RAW computed value when it gives up.
  //
  // Two CI failures got me here and my first explanation was wrong. Waiting for `matchMedia` to
  // agree was not enough: webkit flipped the query and still computed one track on the next
  // line, so the media query and the style recalculation that follows it are not the same
  // event. Rather than guess at a frame count, this waits for the quantity actually being
  // measured and fails with what the engine returned — a track count alone cannot distinguish
  // "the modifier did not apply" from "the value is a shape I did not anticipate".
  const readTracks = (el: Element) =>
    getComputedStyle(el.shadowRoot!.querySelector('[part="grid"]')!).gridTemplateColumns;

  const tracksFor = async (el: Element, expected: number, label: string) => {
    const deadline = Date.now() + 2000;
    let raw = readTracks(el);
    let count = raw.split(/\s+/).filter(Boolean).length;
    while (count !== expected && Date.now() < deadline) {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      raw = readTracks(el);
      count = raw.split(/\s+/).filter(Boolean).length;
    }
    // Returned rather than asserted here, so the caller owns the message and a genuine
    // regression still reds — this only removes the race, it does not soften the claim.
    return { count, raw, label };
  };

  const expectTracks = (r: { count: number; raw: string; label: string }, expected: number) =>
    expect(
      r.count,
      `${r.label}: expected ${expected} track(s), computed ${JSON.stringify(r.raw)}`,
    ).toBe(expected);

  await resizeTo(1200, 800, false);
  try {
    for (const [variant, expected] of [
      ['cols-2', 2],
      ['cols-3', 3],
      ['cols-4', 4],
    ] as const) {
      const { el } = await mount({ variant }, expected);
      expectTracks(await tracksFor(el, expected, `${variant} above 720px`), expected);
    }
    // The base grid is one track at every width — the control for the assertions above, which
    // would otherwise pass against a stylesheet that gave EVERY grid the same track count.
    const { el: base } = await mount({}, 3);
    expectTracks(await tracksFor(base, 1, 'the base grid above 720px'), 1);
  } finally {
    await resizeTo(414, 896, true);
  }

  // And below the breakpoint every modifier collapses. Deleting the @media block reds this.
  const { el: narrow } = await mount({ variant: 'cols-3' }, 3);
  expectTracks(await tracksFor(narrow, 1, 'cols-3 below 720px'), 1);
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
