import { test, expect } from '@playwright/test';

test.setTimeout(60000);

// #69 re-baselined all three of these.
//
// Before this mission sk-stub-html-default, sk-feature-card-html-default and
// sk-ribbon-card-html-with-ribbon were byte-identical to each other — one md5
// (f642335856be21c8fb251d2dce35c383), 4257 bytes, a uniform #0D0E11 frame. Three
// different components cannot produce one identical image: the styles-package
// stories did not mount under @storybook/angular, so all three were pictures of
// an empty canvas and passed unchanged whatever happened to those components.
// That was the same certifying-absence failure the axe gate had (#90), in the
// gate next to it. Tracked as #88.
//
// Two things fixed it, and both must stay: the web-components renderer mounts
// these stories, and each test now waits on its component's selector. They
// previously screenshotted after domcontentloaded alone, which is why the blank
// frames were never noticed. Do not replace a waitForSelector with a bare
// waitForLoadState here.

test('SK-stub HTML default — visual baseline', async ({ page }) => {
  // HTML story renders via the @storybook/html framework in the Storybook iframe
  await page.goto('/iframe.html?id=primitives-skstub-html--default&viewMode=story');
  // #69: wait on the component, not just domcontentloaded. These three tests
  // screenshotted after domcontentloaded alone, which is why three DIFFERENT
  // components all produced the same blank frame and nobody noticed (#88).
  const target = page.locator('.sk-stub').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  // Screenshot the COMPONENT, not the page. A full-page shot made the gate
  // blind: .sk-stub is 277x19px, ~0.6% of a 1280x720 viewport, so a blank
  // render differed from a full render by less than maxDiffPixelRatio and
  // Playwright called them equal. That is how three identical blank baselines
  // survived (#88). Clipping to the component makes the ratio meaningful.
  await expect(target).toHaveScreenshot('sk-stub-html-default.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-feature-card HTML default — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=components-skfeaturecard-html--default&viewMode=story');
  // #69: wait on the component, not just domcontentloaded (see #88).
  const target = page.locator('.sk-feature-card').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  // Screenshot the COMPONENT, not the page. A full-page shot made the gate
  // blind: .sk-stub is 277x19px, ~0.6% of a 1280x720 viewport, so a blank
  // render differed from a full render by less than maxDiffPixelRatio and
  // Playwright called them equal. That is how three identical blank baselines
  // survived (#88). Clipping to the component makes the ratio meaningful.
  await expect(target).toHaveScreenshot('sk-feature-card-html-default.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});


test('SK-ribbon-card HTML with ribbon — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=components-skribboncard-html--with-ribbon&viewMode=story');
  // #69: wait on the component, not just domcontentloaded (see #88).
  const target = page.locator('.sk-ribbon-card').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  // Screenshot the COMPONENT, not the page. A full-page shot made the gate
  // blind: .sk-stub is 277x19px, ~0.6% of a 1280x720 viewport, so a blank
  // render differed from a full render by less than maxDiffPixelRatio and
  // Playwright called them equal. That is how three identical blank baselines
  // survived (#88). Clipping to the component makes the ratio meaningful.
  await expect(target).toHaveScreenshot('sk-ribbon-card-html-with-ribbon.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});
