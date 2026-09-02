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
 * This exercises the deployed artifact, not a Storybook story, deliberately.
 * Storybook is configured with `@storybook/angular` as its only framework, so the
 * HTML stories never leave the "preparing story" state and render nothing — see
 * ADR-13 and M3. The demo page is real HTML loading a real ES module, which is
 * how every no-build consumer in the ADR-12 audit actually uses this package.
 */

const DEMO = '/dashboard-demo.html';

test('skToggleDrawer opens and closes the drawer and tracks ARIA state', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(e.message));
  page.on('response', (r) => {
    if (!r.ok() && new URL(r.url()).pathname !== DEMO) failures.push(`${r.status()} ${r.url()}`);
  });

  await page.goto(DEMO);

  const hamburger = page.locator('.sk-nav-pill__hamburger');
  const drawer = page.locator('#sk-nav-drawer');
  await expect(hamburger).toBeAttached();
  await expect(drawer).toBeAttached();

  // A broken module specifier surfaces as a 404 plus a page error rather than a
  // failed assertion, so assert on it directly — that is the regression this
  // whole file exists to catch.
  expect(failures, `asset or module failures on ${DEMO}`).toEqual([]);

  await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  await expect(drawer).not.toHaveClass(/is-open/);

  await hamburger.dispatchEvent('click');
  await expect(drawer).toHaveClass(/is-open/);
  await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  await expect(hamburger).toHaveAttribute('aria-label', 'Close navigation');

  await hamburger.dispatchEvent('click');
  await expect(drawer).not.toHaveClass(/is-open/);
  await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  await expect(hamburger).toHaveAttribute('aria-label', 'Open navigation');
});

test('the drawer id contract the module depends on is intact', async ({ page }) => {
  await page.goto(DEMO);
  // skToggleDrawer looks the drawer up by this exact id and no-ops without it,
  // so aria-controls and the id must agree or the button silently does nothing.
  await expect(page.locator('.sk-nav-pill__hamburger')).toHaveAttribute('aria-controls', 'sk-nav-drawer');
  await expect(page.locator('#sk-nav-drawer')).toHaveCount(1);
});
