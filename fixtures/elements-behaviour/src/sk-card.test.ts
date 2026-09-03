import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import tokensCss from '../../../packages/tokens/src/tokens.css?raw';

/**
 * <sk-card> — ADR-8 confirmation #1, and the repair #72 carries.
 *
 * These tests carry no `behaviours.json` id: sk-card owns no ADR-11 required behaviour
 * (no form association, no events, no focus contract). They assert the two things this
 * mission's exit criteria call out — that LightMode actually renders light-mode styling,
 * and that the element and the static card agree — which are component claims, not
 * behaviour-registry claims.
 */

/**
 * Loads the REAL @spec-kitty/tokens sheet.
 *
 * An earlier version injected fabricated values, which meant the test asserted only that
 * sk-card.css DEREFERENCES the token — never that the token package DEFINES it. A lens
 * measured the consequence: deleting the two light-block declarations from tokens.css
 * killed light mode for every real card and this suite stayed 24/24 green. That is the
 * eighth instance of this programme's defect class, inside the test the story docstring
 * cites as "asserted, not eyeballed".
 */
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

test('the ADR-9 styling API is targetable from outside', async () => {
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
