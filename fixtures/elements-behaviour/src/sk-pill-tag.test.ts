/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
/**
 * <sk-pill-tag> — #79's primitives batch, plus #302's status-tone axis.
 *
 * SC-013 and SC-014, plus the claim this migration turns on: colour and shape are independent
 * axes of ONE component, where the shape used to be a second component sharing the directory.
 *
 * SC-010 IS NEW, added by #302, exactly the way #177 added it to sk-card: `status` is this
 * element's first reflected STRING property. `variant` and `shape` predate SC-010 becoming a
 * live obligation for this element and are not retroactively claimed.
 */
import { beforeEach, expect, test } from 'vitest';
import '../../../packages/elements/src/pill-tag/sk-pill-tag.js';
import skPillTagSheet from '../../../packages/elements/src/pill-tag/sk-pill-tag.css.js';
import {
  PILL_TAG_SHAPES,
  PILL_TAG_STATUSES,
  PILL_TAG_VARIANTS,
  pillTagClasses,
  pillTagStaticHtml,
} from '../../../packages/elements/src/pill-tag/sk-pill-tag.markup.js';
import { STATUS_TONES } from '../../../packages/elements/src/status-indicator/status-tones.js';
import { installTokenSheet } from './token-sheet.js';
import { contrast, assertThemesDiffered } from './contrast.js';

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
    // Interpolated so the only literal `::part(<name>)` in this file is the real selector
    // above — check-part-ratchet.mjs greps the CONCATENATED test sources for that literal, so
    // a copy in a message would keep the ratchet green if the rule were deleted.
    //
    // AND THE PLACEHOLDER FORM IS THE POINT: an earlier revision of this very comment spelled
    // the real part name, which put the grep target back into the file and defeated the fix it
    // was explaining. A lens simulated deleting the rule above and found the ratchet still
    // green. sk-button.test.ts got this right; these two disagreed until now.
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
  // Records the surface each theme resolved, so the loop can prove it saw TWO themes.
  const surfaces = new Map<string, string>();

  for (const theme of ['dark', 'light'] as const) {
    const wrap = document.createElement('div');
    if (theme === 'light') wrap.className = 'sk-light';
    wrap.style.background = 'var(--sk-surface-page)';
    document.body.append(wrap);
    surfaces.set(theme, getComputedStyle(wrap).backgroundColor);
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

  // Without this, a light arm that silently rendered the dark palette would pass.
  assertThemesDiffered(surfaces);
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

/**
 * THE ABSENT CASE, ASSERTED — not merely relied on as "whatever `status ? … : ''` returns when
 * `status` is undefined". #308's own pre-merge squad found a HIGH exactly here, in a sibling
 * mission: `.sk-confirm-dialog { display: flex }` shipped with no `[open]` qualifier, so the
 * closed state never rendered, and 602 tests plus a full mutation-harness run all missed it
 * because every test exercised the PRESENT state and nothing exercised the ABSENT one. `status`
 * is the same present/absent shape one axis over — a tone axis with no way to turn it off, or
 * that silently ships one anyway, is that defect class.
 *
 * NFR-005 requires every pre-existing story and static export to render pixel-identical to its
 * pre-mission baseline when `status` is absent. This is the direct check: no `status` attribute
 * at all, one per pre-existing axis combination, and the class list must carry NO
 * `sk-pill-tag--status-*` modifier and must equal exactly what `pillTagClasses` produced before
 * this mission touched the file.
 */
test('with no status attribute, every pre-existing combination renders EXACTLY as it did before this mission', async () => {
  const cases: [Record<string, string>, string][] = [
    [{}, 'sk-pill-tag'],
    [{ variant: 'green' }, 'sk-pill-tag sk-pill-tag--green'],
    [{ variant: 'purple' }, 'sk-pill-tag sk-pill-tag--purple'],
    [{ variant: 'breaking' }, 'sk-pill-tag sk-pill-tag--breaking'],
    [{ variant: 'yellow' }, 'sk-pill-tag sk-pill-tag--yellow'],
    [{ shape: 'eyebrow' }, 'sk-pill-tag sk-pill-tag--eyebrow'],
    [{ variant: 'yellow', shape: 'eyebrow' }, 'sk-pill-tag sk-pill-tag--yellow sk-pill-tag--eyebrow'],
  ];
  for (const [attrs, expected] of cases) {
    const el = await mount(attrs);
    expect(
      partOf(el).className,
      `attrs=${JSON.stringify(attrs)}: an absent status must add NO class and change NOTHING`,
    ).toBe(expected);
    expect(
      partOf(el).className.includes('--status-'),
      `attrs=${JSON.stringify(attrs)}: no status modifier may appear when status is absent`,
    ).toBe(false);
    expect(el.hasAttribute('status'), 'no status attribute means no status attribute').toBe(false);
  }
  // Same claim on the static-authoring path — no status key in the options bag at all, not
  // merely `status: undefined`.
  expect(pillTagStaticHtml({ variant: 'yellow', shape: 'eyebrow' })).toBe(
    '<span class="sk-pill-tag sk-pill-tag--yellow sk-pill-tag--eyebrow">Label</span>',
  );
  expect(pillTagStaticHtml({ variant: 'yellow', shape: 'eyebrow' }).includes('--status-')).toBe(false);
});

/**
 * ONE VOCABULARY, ORDER-PINNED (#302 User Story 2, mirroring #177's identical assertion for
 * sk-card). `PILL_TAG_STATUSES` is an EXPRESSION derived from `STATUS_TONES`, and nothing gates
 * the expression: a rogue entry appended inside the `Object.fromEntries` argument still
 * type-checks, still regenerates, and still passes every static gate in this repo. This is the
 * only thing that would catch it.
 */
test('the pill-tag\'s status keys are sk-status-indicator\'s tone vocabulary, in order', () => {
  expect(Object.keys(PILL_TAG_STATUSES)).toEqual([...STATUS_TONES]);
});

/** THE VALUES, separately — self-fulfilling for any key, so it cannot stand in for the assertion
 *  above, but it does catch a value pointing at another component's BEM block. */
test('every pill-tag status modifier is the BEM family for this block', () => {
  expect(Object.keys(PILL_TAG_STATUSES).length).toBeGreaterThan(0);
  for (const [tone, cls] of Object.entries(PILL_TAG_STATUSES)) {
    expect(cls).toBe(`sk-pill-tag--status-${tone}`);
  }
});

test('an unknown status degrades on the RENDER path — the tag still paints and still slots', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  let el: Element;
  try {
    el = await mount({ status: 'rogue' });
  } finally {
    console.warn = realWarn;
  }
  expect(partOf(el!).className.trim(), 'an unknown status must degrade to the base tag').toBe(
    'sk-pill-tag',
  );
  expect(el!.shadowRoot!.querySelector('slot'), 'the slot must survive').not.toBe(null);
  expect(
    (el!.shadowRoot!.querySelector('slot') as HTMLSlotElement).assignedNodes().length,
    'the slotted label must survive',
  ).toBe(1);
  expect(warnings.length, 'degrading must warn exactly once').toBe(1);
  expect(String(warnings[0]?.[0])).toContain('rogue');
});

test('an empty status attribute is ABSENT, not unknown — no class, no warning', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  let el: Element;
  try {
    el = await mount({ status: '' });
  } finally {
    console.warn = realWarn;
  }
  expect(partOf(el!).className.trim()).toBe('sk-pill-tag');
  expect(warnings.length, 'present-but-empty is how a template writes "no status"').toBe(0);
});

test('an unknown status THROWS on the authoring path — it never reaches generated output', () => {
  expect(() => pillTagStaticHtml({ status: 'rogue' })).toThrow(/unknown pill-tag status/);
  // Prototype-chain keys are not statuses. `in` would reach them, and this module generates
  // server-rendered HTML.
  for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    expect(() => pillTagStaticHtml({ status: key }), `${key} must not be accepted`).toThrow(
      /unknown pill-tag status/,
    );
    expect(
      pillTagClasses(undefined, undefined, key).trim(),
      `${key} must degrade to the base tag`,
    ).toBe('sk-pill-tag');
  }
  // Every real tone works on both paths, derived from the map rather than hardcoded.
  for (const [tone, cls] of Object.entries(PILL_TAG_STATUSES)) {
    expect(pillTagStaticHtml({ status: tone })).toContain(cls);
    expect(pillTagClasses(undefined, undefined, tone)).toContain(cls);
  }
});

/**
 * BRAND-VS-STATUS PRECEDENCE (#302 User Story 3, C-011 of the spec, mirroring sk-card's #177
 * precedence test). Both axes stay live as INPUTS — the first assertions pin that — but the
 * RENDERING is precedence, not co-existence: while a status is present it supersedes the brand
 * variant's `background`/`color` entirely, because `.sk-pill-tag--<variant>` and each
 * `.sk-pill-tag--status-<tone>` rule both declare exactly those two properties, at equal
 * specificity, with the status rule authored after. `toBe`, not `not.toBe`: the honest assertion
 * is that the variant contributes NOTHING once a status is set.
 */
test('status supersedes variant in rendering, while both axes stay live as inputs', async () => {
  const paint = (el: Element) => {
    const cs = getComputedStyle(partOf(el));
    return `${cs.backgroundColor}|${cs.color}`;
  };

  for (const tone of Object.keys(PILL_TAG_STATUSES)) {
    const variantAndStatus = await mount({ variant: 'purple', status: tone });
    const statusOnly = await mount({ status: tone });

    // Inputs: both axes survive as attributes and as classes. Neither erases the other.
    expect(partOf(variantAndStatus).classList.contains('sk-pill-tag--purple')).toBe(true);
    expect(partOf(variantAndStatus).classList.contains(`sk-pill-tag--status-${tone}`)).toBe(true);
    expect(variantAndStatus.getAttribute('variant')).toBe('purple');

    // Rendering: identical paint whether or not the brand variant is also set.
    expect(
      paint(variantAndStatus),
      `tone="${tone}": a status tag must render identically whether or not a brand variant is ` +
        'also set — if this differs, `variant` has gained a surviving visual contribution and ' +
        'the precedence documented in sk-pill-tag.css is no longer what ships',
    ).toBe(paint(statusOnly));
  }

  // And the variant is not inert in general — a variant with no status still paints its own tint.
  const variantOnly = await mount({ variant: 'purple' });
  const statusOnly = await mount({ status: 'danger' });
  expect(paint(variantOnly)).not.toBe(paint(statusOnly));
});

/**
 * DISJOINT AXES COMPOSE. `shape="eyebrow"` sets padding/radius/font-size; `status` sets
 * background/color; the two rules share no declaration, so both survive together.
 */
test('shape and status compose — disjoint declarations, nothing dropped', async () => {
  const base = await mount();
  const eyebrow = await mount({ shape: 'eyebrow' });
  const eyebrowStatus = await mount({ shape: 'eyebrow', status: 'success' });
  const statusOnly = await mount({ status: 'success' });

  expect(partOf(eyebrowStatus).classList.contains('sk-pill-tag--eyebrow')).toBe(true);
  expect(partOf(eyebrowStatus).classList.contains('sk-pill-tag--status-success')).toBe(true);

  // The eyebrow's size axis survives (padding matches the plain eyebrow, not the base).
  expect(getComputedStyle(partOf(eyebrowStatus)).paddingLeft).toBe(
    getComputedStyle(partOf(eyebrow)).paddingLeft,
  );
  expect(getComputedStyle(partOf(eyebrowStatus)).paddingLeft).not.toBe(
    getComputedStyle(partOf(base)).paddingLeft,
  );
  // The status colour axis survives (matches the plain status tag, not the base).
  expect(getComputedStyle(partOf(eyebrowStatus)).backgroundColor).toBe(
    getComputedStyle(partOf(statusOnly)).backgroundColor,
  );
});

/**
 * [SC-010] a status property assigned before definition survives upgrade and reflects —
 * mirroring sk-card.test.ts's own SC-010 case line for line. `status` is this element's first
 * reflected string property, so "a property assigned before the definition loads is applied on
 * upgrade" is now a claim this element makes and can lose.
 */
test('[SC-010] a status property assigned before definition survives upgrade and reflects', async () => {
  const el = document.createElement('sk-pill-tag-late') as HTMLElement & {
    status?: string;
    updateComplete: Promise<unknown>;
  };
  el.status = 'danger';
  el.textContent = 'Failed';
  document.body.append(el);
  const { SkPillTag } = await import('../../../packages/elements/src/pill-tag/sk-pill-tag.js');
  customElements.define('sk-pill-tag-late', class extends SkPillTag {});
  await customElements.whenDefined('sk-pill-tag-late');
  await el.updateComplete;

  expect(el.status).toBe('danger');
  // Reflection is what a static consumer and a CSS author both read. An unreflected status is
  // an axis that silently does nothing outside the shadow root.
  expect(el.getAttribute('status'), 'status must reflect to the attribute').toBe('danger');
  expect(
    (el.shadowRoot!.firstElementChild as HTMLElement).classList.contains('sk-pill-tag--status-danger'),
  ).toBe(true);

  el.status = 'recovery';
  await el.updateComplete;
  expect(el.getAttribute('status')).toBe('recovery');
});

/**
 * BOTH THEMES: the status surface must cross the shadow boundary as a VALUE — the same claim
 * the tinted-variant contrast test above makes, and for the same reason: a theme SELECTOR in
 * sk-pill-tag.css would be inert inside the shadow root.
 */
test('every status tone resolves a different surface in each theme', async () => {
  const surfaces = new Map<string, string>();

  for (const theme of ['dark', 'light'] as const) {
    const wrap = document.createElement('div');
    if (theme === 'light') wrap.className = 'sk-light';
    wrap.style.background = 'var(--sk-surface-page)';
    document.body.append(wrap);
    surfaces.set(theme, getComputedStyle(wrap).backgroundColor);

    for (const tone of Object.keys(PILL_TAG_STATUSES)) {
      const el = document.createElement('sk-pill-tag');
      el.setAttribute('status', tone);
      el.textContent = 'Label';
      wrap.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      const cs = getComputedStyle(el.shadowRoot!.querySelector('[part="tag"]')!);
      const ratio = contrast(cs.color, cs.backgroundColor);
      expect(
        ratio,
        `status="${tone}" in ${theme} mode is ${ratio.toFixed(2)}:1 — WCAG AA needs 4.5`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }

  assertThemesDiffered(surfaces);
});
