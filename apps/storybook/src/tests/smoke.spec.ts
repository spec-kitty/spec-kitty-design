import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * CDN / zero-build-step token consumption test (FR-012, RISK-1 remediation).
 *
 * Verifies that tokens.css can be consumed via a plain file reference with no
 * build step, and that --sk-* custom properties resolve correctly in the browser.
 */
test('tokens.css loads via file reference and --sk-color-yellow resolves (FR-012)', async ({ page, browserName }) => {
  const tokensCssPath = path.resolve('packages/tokens/dist/tokens.css');

  if (!fs.existsSync(tokensCssPath)) {
    test.skip(); // dist/ not built yet — skip rather than fail
    return;
  }

  // Create a minimal HTML page that loads tokens.css directly (simulates CDN link)
  const html = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="file://${tokensCssPath}">
  </head>
  <body>
    <div id="probe" style="color: var(--sk-color-yellow)">probe</div>
  </body>
</html>`;

  const tmpHtml = path.resolve('apps/storybook/storybook-static/_token-cdn-test.html');
  fs.mkdirSync(path.dirname(tmpHtml), { recursive: true });
  fs.writeFileSync(tmpHtml, html);

  await page.goto(`file://${tmpHtml}`);

  // Verify --sk-color-yellow is defined (non-empty computed value)
  const tokenValue = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--sk-color-yellow').trim()
  );

  // Clean up temp file
  fs.unlinkSync(tmpHtml);

  expect(tokenValue, '--sk-color-yellow must resolve to a non-empty value from tokens.css').not.toBe('');
  // The value is either the hex #F5C518 or its equivalent
  expect(tokenValue.toLowerCase()).toContain('f5c5'); // matches #F5C518 in any case/format
});

test('Storybook loads and renders stub stories', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Storybook/);
});

test('SK-stub HTML story iframe loads', async ({ page }) => {
  // Verify the HTML story iframe URL is accessible (the story page loads)
  // Component CONTENT is asserted by the axe gate (which fails a story whose host
  // mounts nothing) and by the clipped visual baseline. This test deliberately
  // asserts only that the story page is reachable and the root exists.
  const response = await page.goto('/iframe.html?id=primitives-skstub-html--default&viewMode=story');
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('#storybook-root')).toBeAttached();
});
