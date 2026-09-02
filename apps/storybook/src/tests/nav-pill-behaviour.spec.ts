import { test, expect } from '@playwright/test';

/**
 * Runtime behaviour of `skToggleDrawer` — the only executable code in
 * @spec-kitty/styles — driven through the real consumer path.
 *
 * Added in M2 (#68). The adversarial gate found that the seven visual baselines,
 * cited as that mission's behaviour-neutrality proof, could not have caught a
 * break here: `dashboard-demo.html` imports `skToggleDrawer` from
 * `sk-nav-pill.js`, and if that import path broke the drawer would silently stop
 * working while every gate stayed green.
 *
 * It exercises the deployed artifact rather than a Storybook story, deliberately.
 * Historically this mattered because Storybook ran on `@storybook/angular`, which
 * created an empty host for the HTML stories so nothing rendered and the visual
 * baselines were blank frames (#88). #69 moved Storybook to the web-components
 * renderer and those stories now mount, but this test stays pointed at the deployed
 * artifact: the demo page is real HTML loading a real ES module, which is how
 * every no-build consumer in the ADR-12 audit actually uses this package.
 */

const DEMO = '/dashboard-demo.html';

// The hamburger is display:none above the drawer breakpoint
// (sk-nav-pill-drawer.css reveals it at max-width: 720px). At the default desktop
// viewport a real click is impossible, so testing there would have required
// dispatchEvent — which bypasses actionability and would keep passing even if the
// control became permanently unclickable for every user.
test.use({ viewport: { width: 390, height: 844 } });

test('skToggleDrawer opens and closes the drawer and tracks ARIA state', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    // Same-origin only: tokens.css @imports Google Fonts, and an upstream 5xx
    // there must not turn an enforced gate red for no repo-side reason.
    if (new URL(r.url()).origin !== new URL(page.url() || 'http://localhost').origin) return;
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });

  const response = await page.goto(DEMO);
  expect(response?.ok(), `${DEMO} did not load — was the demo surface assembled?`).toBe(true);

  const hamburger = page.locator('.sk-nav-pill__hamburger');
  const drawer = page.locator('#sk-nav-drawer');

  // skToggleDrawer resolves the drawer by this exact id and no-ops without it.
  await expect(drawer).toHaveCount(1);
  await expect(hamburger).toHaveAttribute('aria-controls', 'sk-nav-drawer');

  // A broken module specifier surfaces as a 404 plus a page error rather than a
  // failed assertion, so assert on it directly.
  expect(failures, `asset or module failures on ${DEMO}`).toEqual([]);

  await expect(hamburger).toBeVisible();
  await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  await expect(drawer).not.toHaveClass(/is-open/);

  // A real click, so actionability, pointer-events and overlays are exercised too.
  await hamburger.click();
  await expect(drawer).toHaveClass(/is-open/);
  await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  await expect(hamburger).toHaveAttribute('aria-label', 'Close navigation');

  await hamburger.click();
  await expect(drawer).not.toHaveClass(/is-open/);
  await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  await expect(hamburger).toHaveAttribute('aria-label', 'Open navigation');

  // Re-assert: a ReferenceError thrown by the click itself lands here, and
  // would otherwise only surface as a slower, less informative timeout.
  expect(failures, `errors raised while toggling the drawer`).toEqual([]);
});
