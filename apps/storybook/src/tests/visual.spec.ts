import { test, expect } from '@playwright/test';

test.setTimeout(60000);

// Three of the seven baselines below assert nothing.
//
// sk-stub-html-default, sk-feature-card-html-default and
// sk-ribbon-card-html-with-ribbon are byte-identical to each other — one md5,
// 4257 bytes, a uniform #0D0E11 frame. Three different components cannot produce
// one identical image: the styles-package stories do not mount under @storybook/angular,
// so all three are pictures of an empty canvas. They pass unchanged whatever
// happens to those components.
//
// This is the same certifying-absence failure the axe gate had (#90), in the gate
// next to it — and run-axe-storybook.js excludes these exact stories as
// unassessable while this file still commits their blankness as the expectation.
// Recorded rather than skipped so the inconsistency is visible: M3 (#69) moves
// Storybook to the web-components renderer, at which point these three start
// rendering and must be re-baselined against real output. Tracked as #88.
//
// Note also that only the four Angular cases below wait on a selector; the three
// HTML ones take their screenshot after domcontentloaded alone, which is why a
// blank frame was never noticed.

});

test('SK-stub HTML default — visual baseline', async ({ page }) => {
  // HTML story renders via the @storybook/html framework in the Storybook iframe
  await page.goto('/iframe.html?id=primitives-skstub-html--default&viewMode=story');
  // #69: wait on the component, not just domcontentloaded. These three tests
  // screenshotted after domcontentloaded alone, which is why three DIFFERENT
  // components all produced the same blank frame and nobody noticed (#88).
  await page.waitForSelector('.sk-stub', { timeout: 20000 });
  await expect(page).toHaveScreenshot('sk-stub-html-default.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

});

test('SK-feature-card HTML default — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=components-skfeaturecard-html--default&viewMode=story');
  // #69: wait on the component, not just domcontentloaded (see #88).
  await page.waitForSelector('.sk-feature-card', { timeout: 20000 });
  await expect(page).toHaveScreenshot('sk-feature-card-html-default.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

});

});

test('SK-ribbon-card HTML with ribbon — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=components-skribboncard-html--with-ribbon&viewMode=story');
  // #69: wait on the component, not just domcontentloaded (see #88).
  await page.waitForSelector('.sk-ribbon-card', { timeout: 20000 });
  await expect(page).toHaveScreenshot('sk-ribbon-card-html-with-ribbon.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});
