import { test, expect } from '@playwright/test';

/**
 * Runtime behaviour of `<sk-nav-pill>` — driven through the real consumer path.
 *
 * Added in M2 (#68) against `skToggleDrawer`, the only executable code in
 * @spec-kitty/styles at the time. The adversarial gate had found that the seven visual
 * baselines, cited as that mission's behaviour-neutrality proof, could not have caught a break
 * here: if the demo's import path broke, the drawer would silently stop working while every
 * gate stayed green.
 *
 * #73 replaced the helper with an element, and this spec follows it rather than being deleted.
 * The vitest browser lane asserts the CONTRACT (`fixtures/elements-behaviour/src/sk-nav-pill.test.ts`,
 * SC-006 … SC-013) against a freshly constructed element. This asserts the DEPLOYED ARTIFACT:
 * dashboard-demo.html is real HTML loading the real IIFE with no bundler, which is how every
 * no-build consumer in the ADR-12 audit actually uses this package. A contract test cannot
 * catch a broken script src, a 404, or a control that is unclickable because something overlays
 * it.
 */

const DEMO = '/dashboard-demo.html';

// The hamburger is display:none above the drawer breakpoint (sk-nav-pill-drawer.css reveals it
// at max-width: 720px). At the default desktop viewport a real click is impossible, so testing
// there would have required dispatchEvent — which bypasses actionability and would keep passing
// even if the control became permanently unclickable for every user.
test.use({ viewport: { width: 390, height: 844 } });

test('sk-nav-pill opens and closes from the deployed artifact and tracks ARIA state', async ({
  page,
}) => {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    // Same-origin only: tokens.css @imports Google Fonts, and an upstream 5xx there must not
    // turn an enforced gate red for no repo-side reason.
    if (new URL(r.url()).origin !== new URL(page.url() || 'http://localhost').origin) return;
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });

  const response = await page.goto(DEMO);
  expect(response?.ok(), `${DEMO} did not load — was the demo surface assembled?`).toBe(true);

  const host = page.locator('sk-nav-pill');
  await expect(host).toHaveCount(1);

  // UPGRADED, not merely present. An unknown element is an inert <sk-nav-pill> that still
  // matches the locator above and still shows its slotted links — so every assertion about the
  // items would pass with the script 404ing. The shadow root is the discriminator.
  await expect
    .poll(() => host.evaluate((el) => !!el.shadowRoot), {
      message: 'the element never upgraded — is elements.js reaching the page?',
    })
    .toBe(true);

  // Playwright's CSS engine pierces open shadow roots, which is why the part is addressable
  // from here at all. ADR-9 chose open roots partly for this.
  const hamburger = host.locator('[part="hamburger"]');
  const items = host.locator('[part="items"]');

  // A broken module specifier surfaces as a 404 plus a page error rather than a failed
  // assertion, so assert on it directly.
  expect(failures, `asset or module failures on ${DEMO}`).toEqual([]);

  await expect(hamburger).toBeVisible();
  await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  await expect(host).not.toHaveAttribute('open', /.*/);
  await expect(items).toBeHidden();

  // No `id="sk-nav-drawer"` anywhere: the contract this mission removed. The panel is the
  // element's own, named by an aria-controls that resolves INSIDE the shadow root (ADR-9).
  await expect(page.locator('#sk-nav-drawer')).toHaveCount(0);
  const controls = await hamburger.getAttribute('aria-controls');
  expect(
    await host.evaluate((el, id) => !!el.shadowRoot?.getElementById(id!), controls),
    'aria-controls must resolve within the element root',
  ).toBe(true);

  // A real click, so actionability, pointer-events and overlays are exercised too.
  await hamburger.click();
  await expect(host).toHaveAttribute('open', /.*/);
  await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  await expect(hamburger).toHaveAttribute('aria-label', 'Close navigation');
  await expect(items).toBeVisible();

  // Escape closes and returns focus to the invoker — the keyboard path, on the real page.
  await page.keyboard.press('Escape');
  await expect(host).not.toHaveAttribute('open', /.*/);
  await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  await expect(hamburger).toHaveAttribute('aria-label', 'Open navigation');
  await expect(hamburger).toBeFocused();

  // Re-assert: an error thrown by the click itself lands here, and would otherwise only
  // surface as a slower, less informative timeout.
  expect(failures, 'errors raised while toggling the panel').toEqual([]);
});
