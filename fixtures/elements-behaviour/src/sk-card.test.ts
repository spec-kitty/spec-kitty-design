import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import { CARD_STATUSES, STATUS_TONES, cardClasses, cardStaticHtml } from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';

/**
 * <sk-card> — ADR-8 confirmation #1, and the repair #72 carries.
 *
 * Most of these tests carry no `behaviours.json` id, and that is still right: sk-card has no
 * form association, no events and no focus contract. They assert component claims — that
 * LightMode actually renders light-mode styling, and that the element and the static card
 * agree.
 *
 * TWO ids ARE claimed, both since #177 and both because the card newly owns the behaviour
 * rather than because a test needed a label:
 *   [SC-013] the card already carried, and it now also covers the fail-open path — an unknown
 *            `status` must leave `::part(card)` present and targetable. That is not a
 *            relabelling: a throw inside render() blanks the shadow root, so the part stops
 *            existing, so the declared styling API stops being targetable. The mutation that
 *            makes the status path throw reds this test for exactly the right reason.
 *   [SC-010] is new to sk-card. `status` is its first reflected string property, so "a property
 *            assigned before the definition loads is applied on upgrade" is now a claim the
 *            card makes and can lose.
 */


beforeEach(installTokenSheet);

test('the blue variant reads its border colour from a TOKEN, so light mode crosses the shadow boundary', async () => {
  // This is the mission's known repair, asserted rather than assumed.
  //
  // `:root[data-theme="light"] .sk-card--blue` and `.sk-light .sk-card--blue` both cross a
  // shadow boundary and are inert inside this element. If either were reintroduced — or if
  // the token were replaced by a hardcoded rgba() — the two computed values below would be
  // IDENTICAL, and the LightMode story would render dark styling silently.
  const dark = document.createElement('sk-card');
  dark.setAttribute('variant', 'blue');
  document.body.append(dark);

  const lightWrap = document.createElement('div');
  lightWrap.className = 'sk-light';
  const light = document.createElement('sk-card');
  light.setAttribute('variant', 'blue');
  lightWrap.append(light);
  document.body.append(lightWrap);

  await (dark as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  await (light as unknown as { updateComplete: Promise<unknown> }).updateComplete;

  const border = (el: Element) =>
    getComputedStyle(el.shadowRoot!.querySelector('[part="card"]')!).borderColor;

  // Values come from the SHIPPED sheet, so removing or breaking either declaration in
  // packages/tokens/src/tokens.css fails here.
  expect(border(dark), 'the dark border did not resolve from the shipped token').toContain('169, 199, 232');
  expect(
    border(light),
    'light mode did not reach inside the shadow root — either a selector was used where a ' +
      'token is required, or the light block no longer defines --sk-border-tint-sky',
  ).toContain('46, 74, 107');
  expect(border(dark)).not.toBe(border(light));
});

test('variants are attributes, and they map to the static layer\'s classes', async () => {
  // One CSS source (ADR-8 confirmation #1): the adopted sheet is byte-identical to the
  // static card's, so the element must put the same classes on the internal node — that
  // mapping is the element's only job here.
  for (const [attr, cls] of [['blue', 'sk-card--blue'], ['purple', 'sk-card--purple']] as const) {
    const el = document.createElement('sk-card');
    el.setAttribute('variant', attr);
    document.body.append(el);
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const inner = el.shadowRoot!.querySelector('[part="card"]')!;
    expect(inner.classList.contains('sk-card'), 'the base class is missing').toBe(true);
    expect(inner.classList.contains(cls), `variant="${attr}" did not map to .${cls}`).toBe(true);
  }
});

test('[SC-013] the ADR-9 styling API is targetable from outside', async () => {
  // BOTH branches, deliberately. The plain card proves the part exists at all; the
  // unknown-status card proves the part SURVIVES the degrade path — which is the assertion the
  // fail-open policy actually needs, because the failure it replaced was a blanked shadow root
  // with no `[part="card"]` in it. A test that only mounted the plain card would stay green
  // through a reintroduced throw.
  const warn = console.warn;
  console.warn = () => {};
  let cards: HTMLElement[];
  try {
    cards = await Promise.all(
      [undefined, 'definitely-not-a-status'].map(async (status) => {
        const el = document.createElement('sk-card');
        if (status) el.setAttribute('status', status);
        document.body.append(el);
        await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
        return el;
      }),
    );
  } finally {
    console.warn = warn;
  }

  const s = document.createElement('style');
  s.textContent = 'sk-card::part(card) { outline-style: dashed; }';
  document.head.append(s);
  try {
    for (const el of cards) {
      const inner = el.shadowRoot!.querySelector('[part="card"]') as HTMLElement | null;
      expect(
        inner,
        'the card part must exist on both the plain and the degraded card — a throw in ' +
          'render() blanks the shadow root and the declared styling API stops being targetable',
      ).not.toBe(null);
      expect(getComputedStyle(inner!).outlineStyle).toBe('dashed');
    }
  } finally {
    s.remove();
  }
});

test('[SC-010] a status property assigned before definition survives upgrade and reflects', async () => {
  const el = document.createElement('sk-card-late') as HTMLElement & {
    status?: string;
    updateComplete: Promise<unknown>;
  };
  el.status = 'danger';
  el.textContent = 'Failed';
  document.body.append(el);
  const { SkCard } = await import('@spec-kitty/elements');
  customElements.define('sk-card-late', class extends SkCard {});
  await customElements.whenDefined('sk-card-late');
  await el.updateComplete;

  expect(el.status).toBe('danger');
  // Reflection is what a static consumer and a CSS author both read. An unreflected status is
  // an axis that silently does nothing outside the shadow root.
  expect(el.getAttribute('status'), 'status must reflect to the attribute').toBe('danger');
  // `firstElementChild`, NOT `[part="card"]`. The [SC-013] arm that drops the part attribute
  // would otherwise red this test too, and the harness rejected exactly that as collateral —
  // correctly: SC-010 is a claim about property upgrade, and binding it to another behaviour's
  // anchor makes one mutation red two ids and hides which one was actually broken.
  expect(
    (el.shadowRoot!.firstElementChild as HTMLElement).classList.contains('sk-card--status-danger'),
  ).toBe(true);

  el.status = 'recovery';
  await el.updateComplete;
  expect(el.getAttribute('status')).toBe('recovery');
});

/**
 * The unknown-variant policy, both halves.
 *
 * #72's first fold made `cardClasses` throw on an unknown variant, which was right for the
 * build path and wrong for the render path: Lit rejects `updateComplete`, `render()` never
 * returns a tree, and the element paints an EMPTY shadow root — no `<div part="card">`, no
 * `<slot>`, so its light-DOM children vanish. Pass 2 measured exactly that. `variant` is
 * untrusted markup input; blanking the element is worse than mis-tinting it.
 *
 * Neither half was asserted anywhere, which is why the regression was free to happen.
 */
test('an unknown variant degrades on the RENDER path — the card still paints and still slots', async () => {
  const el = document.createElement('sk-card');
  el.setAttribute('variant', 'definitely-not-a-variant');
  el.textContent = 'IMPORTANT SLOTTED CONTENT';
  document.body.append(el);

  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  try {
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  } finally {
    console.warn = realWarn;
  }

  const inner = el.shadowRoot!.querySelector('[part="card"]') as HTMLElement | null;
  expect(inner, 'the card must still render a part — a throw in render() blanks the root').not.toBe(
    null,
  );
  expect(inner!.classList.contains('sk-card')).toBe(true);
  // Degraded, not decorated with a garbage class.
  expect(inner!.className.trim()).toBe('sk-card');
  // The slot survives, so light-DOM children are still painted.
  expect(el.shadowRoot!.querySelector('slot'), 'the slot must survive').not.toBe(null);
  expect((el.shadowRoot!.querySelector('slot') as HTMLSlotElement).assignedNodes().length).toBe(1);
  // And it is not silent.
  expect(warnings.length, 'degrading must warn — fail-open with no signal is what this replaced').toBe(1);
  expect(String(warnings[0]?.[0])).toContain('definitely-not-a-variant');
});

test('an unknown variant THROWS on the authoring path — a bad variant never reaches generated output', () => {
  expect(() => cardStaticHtml({ variant: 'definitely-not-a-variant' })).toThrow(/unknown card variant/);
  // Prototype-chain keys are not variants. `in` reached them and emitted
  // `sk-card function Object() { [native code] }` into real markup.
  for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    expect(() => cardStaticHtml({ variant: key }), `${key} must not be accepted`).toThrow(/unknown card variant/);
    expect(cardClasses(key).trim(), `${key} must degrade to the base card`).toBe('sk-card');
  }
  // The known variants still work on both paths.
  expect(cardStaticHtml({ variant: 'blue' })).toContain('sk-card--blue');
  expect(cardClasses('purple')).toContain('sk-card--purple');
});

/**
 * ONE VOCABULARY, held by assertion rather than by an import.
 *
 * `sk-card.markup.ts` is a leaf: `scripts/build-element-markup.mjs` evaluates it from a `data:`
 * URL, which has no module base, and exits with a named error on any relative import. So
 * `CARD_STATUSES` cannot import `STATUS_TONES` even though `STATUS_TONES` is the one authored
 * list. This test is what makes the map a derivation instead of a fork: a tone added to #146,
 * removed from it, renamed on either side, or reordered, reds here.
 *
 * ORDER, not just membership. The tones are a presentation scale — neutral through recovery —
 * and stories, the token block and the docs all iterate them. A set-equality assertion would
 * pass over a reordering that silently reorders every one of those surfaces.
 */
test('the card\'s status keys are sk-status-indicator\'s tone vocabulary, in order', () => {
  expect(Object.keys(CARD_STATUSES)).toEqual([...STATUS_TONES]);
  // And the modifiers are the BEM family for THIS block — a status key that mapped to another
  // component's class would satisfy the line above and still be wrong.
  for (const [tone, cls] of Object.entries(CARD_STATUSES)) {
    expect(cls).toBe(`sk-card--status-${tone}`);
  }
});

/**
 * The unknown-STATUS policy, both halves — the same split `variant` already carries, asserted
 * separately because a shared implementation is not a shared guarantee.
 */
test('an unknown status degrades on the RENDER path — the card still paints and still slots', async () => {
  const el = document.createElement('sk-card');
  el.setAttribute('status', 'failed');
  el.textContent = 'IMPORTANT SLOTTED CONTENT';
  document.body.append(el);

  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  try {
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  } finally {
    console.warn = realWarn;
  }

  const inner = el.shadowRoot!.querySelector('[part="card"]') as HTMLElement | null;
  expect(inner, 'the card must still render a part — a throw in render() blanks the root').not.toBe(
    null,
  );
  expect(inner!.className.trim()).toBe('sk-card');
  expect(el.shadowRoot!.querySelector('slot'), 'the slot must survive').not.toBe(null);
  expect((el.shadowRoot!.querySelector('slot') as HTMLSlotElement).assignedNodes().length).toBe(1);
  expect(warnings.length, 'degrading must warn exactly once').toBe(1);
  expect(String(warnings[0]?.[0])).toContain('failed');
  // "failed" is the exact string #177 names: the card must NOT infer that a value containing
  // "failed" means danger. It holds no domain mapping.
  expect(inner!.classList.contains('sk-card--status-danger')).toBe(false);
});

test('an empty status attribute is ABSENT, not unknown — no class, no warning', async () => {
  const el = document.createElement('sk-card');
  el.setAttribute('status', '');
  document.body.append(el);

  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  try {
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  } finally {
    console.warn = realWarn;
  }
  expect(el.shadowRoot!.querySelector('[part="card"]')!.className.trim()).toBe('sk-card');
  expect(warnings.length, 'present-but-empty is how a template writes "no status"').toBe(0);
});

test('an unknown status THROWS on the authoring path — it never reaches generated output', () => {
  expect(() => cardStaticHtml({ status: 'failed' })).toThrow(/unknown card status/);
  // Prototype-chain keys are not statuses. `in` would reach them and this module generates
  // server-rendered HTML.
  for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    expect(() => cardStaticHtml({ status: key }), `${key} must not be accepted`).toThrow(
      /unknown card status/,
    );
    expect(
      cardClasses(undefined, false, key).trim(),
      `${key} must degrade to the base card`,
    ).toBe('sk-card');
  }
  // Every real tone works on both paths, derived from the map rather than hardcoded.
  for (const [tone, cls] of Object.entries(CARD_STATUSES)) {
    expect(cardStaticHtml({ status: tone })).toContain(cls);
    expect(cardClasses(undefined, false, tone)).toContain(cls);
  }
});

/**
 * ORTHOGONALITY. #177 makes the separation binding, so it is asserted rather than described:
 * `variant` is the brand axis, `status` the operational one, and a card carries both.
 */
test('status and variant are independent axes on one card', async () => {
  const both = document.createElement('sk-card');
  both.setAttribute('variant', 'purple');
  both.setAttribute('status', 'attention');
  document.body.append(both);

  const purpleOnly = document.createElement('sk-card');
  purpleOnly.setAttribute('variant', 'purple');
  document.body.append(purpleOnly);

  await (both as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  await (purpleOnly as unknown as { updateComplete: Promise<unknown> }).updateComplete;

  const inner = (el: Element) => el.shadowRoot!.querySelector('[part="card"]') as HTMLElement;
  expect(inner(both).classList.contains('sk-card--purple')).toBe(true);
  expect(inner(both).classList.contains('sk-card--status-attention')).toBe(true);

  // Not merely both classes present: the status surface must actually win, and the brand
  // variant must still be the thing that changes when only IT is removed.
  expect(
    getComputedStyle(inner(both)).backgroundColor,
    'a card carrying both axes must not render as if it carried only the variant',
  ).not.toBe(getComputedStyle(inner(purpleOnly)).backgroundColor);

  both.removeAttribute('status');
  await (both as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  expect(inner(both).classList.contains('sk-card--purple')).toBe(true);
  expect(getComputedStyle(inner(both)).backgroundColor).toBe(
    getComputedStyle(inner(purpleOnly)).backgroundColor,
  );
});

/**
 * The status surface must cross the shadow boundary as a VALUE. Same claim the blue-variant
 * test at the top of this file makes, and for the same reason: a theme SELECTOR in
 * sk-card.css would be inert inside the shadow root, and every LightMode story would render
 * dark styling with no error and no warning.
 */
test('every status tone resolves a different surface in each theme', async () => {
  const mount = async (tone: string, light: boolean) => {
    const host = document.createElement('div');
    if (light) host.className = 'sk-light';
    const el = document.createElement('sk-card');
    el.setAttribute('status', tone);
    host.append(el);
    document.body.append(host);
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    return getComputedStyle(el.shadowRoot!.querySelector('[part="card"]')!);
  };

  for (const tone of Object.keys(CARD_STATUSES)) {
    const dark = await mount(tone, false);
    const light = await mount(tone, true);
    expect(dark.backgroundColor, `${tone}: the dark surface did not resolve`).not.toBe('');
    expect(
      light.backgroundColor,
      `${tone}: light mode did not reach inside the shadow root — either a selector was used ` +
        'where a token is required, or the light block does not define --sk-status-' + tone,
    ).not.toBe(dark.backgroundColor);
    // The edge is a second, independent carrier: the surface flattens under forced-colors and
    // the border does not, so a tone whose border matched the base card would be colour-only
    // in exactly the mode that matters most.
    expect(dark.borderLeftColor, `${tone}: the edge did not resolve`).not.toBe('');
    expect(light.borderLeftColor).not.toBe(dark.borderLeftColor);
  }
});
