import { expect, test } from '@playwright/test';
import type { Browser } from '@playwright/test';
import { readFileSync } from 'node:fs';

// The built bytes copied into Storybook are the published, zero-build-step surface. Reading the
// authored source here would miss the generated System fallback this test exists to certify.
const generatedTokens = readFileSync(
  'apps/storybook/storybook-static/tokens-dist/tokens.css',
  'utf8',
);

const surface = async (browser: Browser, colorScheme: 'light' | 'dark', theme?: 'light' | 'dark') => {
  const context = await browser.newContext({ colorScheme, javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.setContent(
      `<html${theme ? ` data-theme="${theme}"` : ''}><head><style>${generatedTokens}</style></head>` +
      `<body><p>system fallback</p></body></html>`,
    );
    return await page.locator('p').evaluate(() => ({
      background: getComputedStyle(document.documentElement).getPropertyValue('--sk-surface-page').trim(),
      foreground: getComputedStyle(document.documentElement).getPropertyValue('--sk-fg-body').trim(),
    }));
  } finally {
    await context.close();
  }
};

test('generated token CSS follows the OS without JavaScript and explicit root choices win', async ({ browser }) => {
  const systemLight = await surface(browser, 'light');
  const systemDark = await surface(browser, 'dark');
  const manualDark = await surface(browser, 'light', 'dark');
  const manualLight = await surface(browser, 'dark', 'light');

  expect(systemLight).not.toEqual(systemDark);
  expect(manualDark).toEqual(systemDark);
  expect(manualLight).toEqual(systemLight);
});

test('a no-JS custom-element host exposes no inert interactive controls', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.setContent(`<style>${generatedTokens}</style><sk-theme-toggle
      label="Theme" system-label="System" light-label="Light" dark-label="Dark"
    ></sk-theme-toggle>`);
    await expect(page.locator('sk-theme-toggle input, sk-theme-toggle button')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
