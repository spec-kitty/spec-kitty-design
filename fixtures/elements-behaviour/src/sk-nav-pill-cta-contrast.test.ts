/**
 * <sk-nav-pill>'s CTA button — the contrast verifier that #78's token change needs.
 *
 * WHY THIS FILE EXISTS SEPARATELY. #78 moved light-mode `--sk-color-accent` from
 * `--sk-color-sage` to `--sk-color-sage-deep`, which changes the nav-pill CTA's FILL, and
 * repaired the pairing on that button from `--sk-fg-on-primary` (dark ink, whose own comment
 * scopes it to yellow buttons) to `--sk-color-accent-fg`. A lens then established that nothing
 * in the repo would have noticed if either change were reverted:
 *
 *   - the only story rendering `.sk-nav-pill__cta-btn` in light mode wraps in `data-theme="light"`,
 *     which is INERT (#93) — it renders the dark palette, so axe measures dark-ink-on-yellow and
 *     never the light pairing;
 *   - there is no element-layer nav-pill LightMode story at all;
 *   - `sk-nav-pill.test.ts` deliberately does not load the token sheet, so it cannot assert a
 *     computed colour, and adding the sheet there would change every other assertion in it.
 *
 * So this is a separate file rather than an arm in the nav-pill fixture: it needs the real token
 * sheet, and that fixture's opt-out is deliberate.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';
import { contrast, assertThemesDiffered } from './contrast.js';

// THE SHEET GOES IN THE DOCUMENT, not into a shadow root, and that is the point: <sk-nav-pill>
// renders no CTA button at all — `.sk-nav-pill__cta-btn` exists only on the STATIC arrangement
// that the styles layer publishes and the demo pages copy. So the consumption path under test
// here is the document one, which is what a `<link>` to the published CSS produces.
//
// The sheet is TAKEN FROM A MOUNTED ELEMENT rather than imported by name, so this file needs no
// new barrel export — and it proves in passing that the document path and the shadow path are
// the same constructed stylesheet, which is the claim the styles/elements split rests on.
beforeEach(installTokenSheet);

/**
 * Adopt the component's real sheet into the DOCUMENT and hand it back.
 *
 * Called from inside the test, not from `beforeEach`: the harness resets the document between
 * the two, so a sheet adopted in an async `beforeEach` is gone by the time the test runs — which
 * silently produced a transparent background and a 1.00:1 reading rather than any error.
 */
const adoptNavPillSheetIntoDocument = async () => {
  const probe = document.createElement('sk-nav-pill');
  document.body.append(probe);
  await (probe as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  const sheet = probe.shadowRoot!.adoptedStyleSheets[0]!;
  probe.remove();
  if (!document.adoptedStyleSheets.includes(sheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }
  return sheet;
};

test('the nav-pill CTA meets AA contrast in BOTH themes', async () => {
  const sheet = await adoptNavPillSheetIntoDocument();
  // Guard the setup itself: if the sheet were empty or the wrong one, every ratio below would be
  // measured against UA defaults and the failure would point at contrast rather than at wiring.
  expect(
    Array.from(sheet.cssRules).some((r) => r.cssText.includes('sk-nav-pill__cta-btn')),
    'the adopted sheet must actually contain the CTA rules',
  ).toBe(true);

  const fills = new Map<string, string>();

  for (const theme of ['dark', 'light'] as const) {
    const wrap = document.createElement('div');
    if (theme === 'light') wrap.className = 'sk-light';
    document.body.append(wrap);

    // The static arrangement, which is what the styles layer publishes and what the demo pages
    // copy. The element renders the same class list into its shadow root.
    const btn = document.createElement('button');
    btn.className = 'sk-nav-pill__cta-btn';
    btn.textContent = 'Book a demo';
    wrap.append(btn);

    const cs = getComputedStyle(btn);
    fills.set(theme, cs.backgroundColor);

    const ratio = contrast(cs.color, cs.backgroundColor);
    expect(
      ratio,
      `the CTA in ${theme} mode is ${ratio.toFixed(2)}:1 (${cs.color} on ${cs.backgroundColor}) — AA needs 4.5`,
    ).toBeGreaterThanOrEqual(4.5);
  }

  // Without this the light arm could be measuring the dark palette and passing for it — the
  // exact hole that made the inert `data-theme` wrapper invisible for so long.
  assertThemesDiffered(fills);
});
