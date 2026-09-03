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
import tokensCss from '@spec-kitty/tokens/tokens.css?raw';

/** The REAL token sheet, for the same reason sk-card.test.ts loads it: fabricated values
 *  assert that the CSS dereferences a token, never that the token package defines it. */
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

test('the 720px breakpoint collapses the column modifiers, and nothing else', async () => {
  // The element's only runtime behaviour. Both branches assert; neither skips. The lane's
  // viewport decides which one is the live claim, and `matchMedia` is the same query the
  // stylesheet uses rather than a number restated here.
  const { inner } = await mount({ variant: 'cols-3' }, 3);
  const tracks = getComputedStyle(inner).gridTemplateColumns.split(/\s+/).filter(Boolean).length;

  if (window.matchMedia('(max-width: 720px)').matches) {
    expect(tracks, 'below the breakpoint every column modifier must collapse to one track').toBe(1);
  } else {
    expect(tracks, 'above the breakpoint cols-3 must lay out three tracks').toBe(3);
  }

  // The BASE grid is one column at every width, so it is the control: if the media query were
  // written without the modifier selectors it would still pass the branch above.
  const { inner: base } = await mount({}, 3);
  expect(getComputedStyle(base).gridTemplateColumns.split(/\s+/).filter(Boolean).length).toBe(1);
});

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
