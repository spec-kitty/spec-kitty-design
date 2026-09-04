import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import { cardClasses, cardStaticHtml } from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';

/**
 * <sk-card> — ADR-8 confirmation #1, and the repair #72 carries.
 *
 * These tests carry no `behaviours.json` id: sk-card owns no ADR-11 required behaviour
 * (no form association, no events, no focus contract). They assert the two things this
 * mission's exit criteria call out — that LightMode actually renders light-mode styling,
 * and that the element and the static card agree — which are component claims, not
 * behaviour-registry claims.
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
  const el = document.createElement('sk-card');
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

  const s = document.createElement('style');
  s.textContent = 'sk-card::part(card) { outline-style: dashed; }';
  document.head.append(s);
  try {
    const inner = el.shadowRoot!.querySelector('[part="card"]') as HTMLElement;
    expect(getComputedStyle(inner).outlineStyle).toBe('dashed');
  } finally {
    s.remove();
  }
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
