import { expect, test, type Page } from '@playwright/test';

/**
 * <sk-button> busy axis (#305) — narrow-width/200%-zoom containment and RTL/logical-layout.
 *
 * SCOPED TO THESE TWO CONCERNS ONLY. Reduced-motion, forced-colors, geometry, and
 * accessible-name are already covered by `fixtures/elements-behaviour/src/sk-button.test.ts`'s
 * vitest-in-browser suite — this file exists for what a real Storybook page render can verify
 * more precisely than that jsdom-adjacent environment: actual viewport reflow and the
 * PHYSICAL side a logical CSS property resolves to under `dir="rtl"`.
 *
 * Follows `sk-copy-field.spec.ts`'s `story()` + `page.setViewportSize()` technique — no
 * `*.spec.ts` file exists for `sk-button` today (confirmed before this mission: only the
 * pre-existing `visual.spec.ts` snapshot PNGs reference it).
 */
const story = async (page: Page, id = 'busy'): Promise<void> => {
  await page.goto(`/iframe.html?id=elements-skbutton--${id}&viewMode=story`);
  await page.locator('sk-button').first().waitFor({ state: 'visible' });
};

test('a long-labelled busy button causes no horizontal page overflow at a narrow viewport', async ({ page }) => {
  // Narrow width AND simulated 400%-zoom (a 195px CSS viewport, mirroring
  // sk-copy-field.spec.ts's own fixed-window-zoom technique), both against a fixture with a
  // label long enough to approach the wrapping boundary.
  for (const viewport of [
    { width: 390, height: 300 },
    { width: 195, height: 253 },
  ]) {
    await page.setViewportSize(viewport);
    await story(page);
    const dimensions = await page.evaluate(() => {
      // Built ad hoc in the real page (the technique sk-copy-field.spec.ts's own
      // "normal-flow, flex-item, and grid-item hosts" test already establishes): the loaded
      // story page has `sk-button` registered, so a fresh element with a LONG label — a
      // fixture none of this mission's named stories carries — can be measured directly
      // without adding a story whose only consumer would be this one assertion.
      const el = document.createElement('sk-button') as HTMLElement & { busy: boolean };
      el.setAttribute('variant', 'primary');
      el.busy = true;
      el.textContent =
        'A considerably longer button label that approaches the narrow-viewport wrapping boundary';
      document.body.append(el);
      return {
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(
      dimensions.pageWidth,
      `at ${viewport.width}px: a busy long-label button caused horizontal page overflow`,
    ).toBe(dimensions.viewportWidth);
  }
});

test('the cue resolves to the correct PHYSICAL side under RTL, proving the logical property is real', async ({ page }) => {
  await story(page, 'busy-icon');
  const result = await page.evaluate(() => {
    const host = document.querySelector('sk-button')!;
    // `dir="rtl"` on the HOST: `direction` is an inherited CSS property that crosses the
    // shadow boundary via inheritance, so the shadow-DOM cue's `inset-inline-start`
    // resolves against the direction of the element it is declared on, following the host's.
    host.setAttribute('dir', 'rtl');
    const cue = host.shadowRoot!.querySelector('[part="busy-cue"]') as HTMLElement;
    const hostRect = host.getBoundingClientRect();
    const cueRect = cue.getBoundingClientRect();
    return {
      distanceFromLeft: cueRect.left - hostRect.left,
      distanceFromRight: hostRect.right - cueRect.right,
    };
  });
  // `inset-inline-start` in RTL resolves to the PHYSICAL RIGHT edge — so the cue must sit
  // closer to the host's right edge than its left, proving the CSS strategy's use of a
  // logical property (not physical `left`) is real, not merely intended.
  expect(
    result.distanceFromRight,
    'under dir="rtl" the cue did not resolve to the physical right edge (inset-inline-start not honoured)',
  ).toBeLessThan(result.distanceFromLeft);
});
