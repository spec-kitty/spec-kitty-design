import { test, expect } from '@playwright/test';

/**
 * `<sk-grid>` actually lays out its columns — at a DESKTOP viewport, in three engines.
 *
 * WHY THIS SPEC EXISTS, and why the assertion is not in the vitest lane with the rest of
 * sk-grid's tests.
 *
 * #77's pre-merge gate found that the column modifiers — the whole reason this component
 * exists — could be deleted with every gate green, because the only assertion covering them
 * sat in a `matchMedia` branch that the vitest browser lane's 414px viewport never took.
 *
 * The obvious repair, `page.viewport(1200, 800)` inside that lane, works in chromium and does
 * not work in webkit. CI proved it three times, and the diagnostic was `computed "1200px"`:
 * one track at the full resized width, so the resize landed and the box really was 1200 wide,
 * while the `@media (max-width: 720px)` block inside the ADOPTED CONSTRUCTED stylesheet had
 * not been re-evaluated. Waiting on `matchMedia` to flip did not help; polling the computed
 * value for two seconds did not help.
 *
 * THIS LANE DOES NOT HAVE THAT PROBLEM, because nothing is resized: playwright.config.ts
 * creates the context at a Desktop viewport (1280 wide in all three projects) and the page is
 * laid out at that size from first paint. `nav-pill-behaviour.spec.ts` established the same
 * pattern in the other direction, pinning a mobile viewport to test the drawer.
 *
 * So sk-grid.test.ts asserts the sheet DECLARES the right tracks, and this asserts a browser
 * APPLIES them. An earlier revision of that file's comment claimed this gap was covered by
 * "the Storybook visual layer" — it was not: visual.spec.ts carries exactly three baselines
 * (sk-stub, sk-feature-card, sk-ribbon-card) and none is a grid. Two pass-2 lenses caught the
 * claim independently. This spec is the coverage that comment described.
 */

const tracksOf = async (page: import('@playwright/test').Page, selector: string) =>
  page.evaluate((sel) => {
    const host = document.querySelector(sel);
    if (!host) throw new Error(`no element matched ${sel}`);
    const box = host.shadowRoot?.querySelector('[part="grid"]') ?? host;
    return getComputedStyle(box).gridTemplateColumns;
  }, selector);

// The ELEMENT path and the STATIC path, because ADR-8 confirmation #1 is that one CSS source
// serves both — and a regression in the shared stylesheet must not be observable in only one.
const CASES = [
  { story: 'elements-skgrid--two-column', selector: 'sk-grid', expected: 2, label: 'element, cols-2' },
  { story: 'elements-skgrid--three-column', selector: 'sk-grid', expected: 3, label: 'element, cols-3' },
  { story: 'elements-skgrid--four-column', selector: 'sk-grid', expected: 4, label: 'element, cols-4' },
  { story: 'components-skgrid--three-column', selector: '.sk-grid--cols-3', expected: 3, label: 'static, cols-3' },
] as const;

for (const { story, selector, expected, label } of CASES) {
  test(`sk-grid lays out ${expected} columns at a desktop viewport (${label})`, async ({ page }, testInfo) => {
    // The viewport is the whole point of this spec, so it is asserted rather than assumed —
    // a config change that shrank it below 720px would otherwise turn every case here into a
    // silent one-column pass.
    const width = page.viewportSize()?.width ?? 0;
    expect(width, `${testInfo.project.name} must run above the 720px breakpoint`).toBeGreaterThan(720);

    await page.goto(`/iframe.html?id=${story}&viewMode=story`);
    await page.waitForSelector(selector);
    const tracks = await tracksOf(page, selector);
    const count = tracks.split(/\s+/).filter(Boolean).length;
    expect(count, `${label}: expected ${expected} tracks, computed "${tracks}"`).toBe(expected);

    // Distinct widths, not merely a track count: `repeat(3, 0)` would satisfy a count.
    const widths = new Set(tracks.split(/\s+/).filter(Boolean));
    expect(widths.size, `${label}: the tracks have no width — computed "${tracks}"`).toBe(1);
    expect(parseFloat(tracks), `${label}: the first track has zero width`).toBeGreaterThan(0);
  });
}

test('the base grid stays single-column at a desktop viewport', async ({ page }) => {
  // The control. Without it, a stylesheet that gave EVERY grid the same track count would
  // satisfy each case above if its expectation were ever loosened.
  await page.goto('/iframe.html?id=elements-skgrid--default&viewMode=story');
  await page.waitForSelector('sk-grid');
  const tracks = await tracksOf(page, 'sk-grid');
  expect(tracks.split(/\s+/).filter(Boolean).length, `the base grid must be one track, computed "${tracks}"`).toBe(1);
});
