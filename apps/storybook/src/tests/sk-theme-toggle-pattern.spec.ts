import { expect, test, type Locator, type Page } from '@playwright/test';
import { getViolations, injectAxe } from 'axe-playwright';

const STORY_PREFIX = 'patterns-operational-status';
const STORAGE_KEY = 'spec-kitty-theme';

type StoryId =
  | 'default'
  | 'light-mode'
  | 'system-light'
  | 'system-dark'
  | 'manual-light'
  | 'manual-dark'
  | 'greyscale'
  | 'forced-colors'
  | 'narrow'
  | 'zoom-200';

const openStory = async (
  page: Page,
  id: StoryId,
  viewport = { width: 1440, height: 1000 },
): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=${STORY_PREFIX}--${id}&viewMode=story`);
  const root = page.locator('[data-theme-composition]').first();
  await root.waitFor({ state: 'visible', timeout: 20_000 });
  const toggle = root.locator('sk-theme-toggle[data-theme-control]');
  await toggle.waitFor({ state: 'visible', timeout: 20_000 });
  await toggle.evaluate(async (element: Element & { updateComplete?: Promise<unknown> }) => {
    await element.updateComplete;
  });
  return root;
};

const luminance = (color: string): number => {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`cannot measure ${color}`);
  const linear = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
};

const contrast = (first: string, second: string): number => {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
};

const measuredTheme = async (page: Page, root: Locator) => {
  const state = await root.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      rootTheme: document.documentElement.dataset.theme,
      colorScheme: document.documentElement.style.colorScheme,
      foreground: style.color,
      background: style.backgroundColor,
      stored: localStorage.getItem('spec-kitty-theme'),
    };
  });
  expect(state.rootTheme).toBe(state.colorScheme);
  expect(contrast(state.foreground, state.background)).toBeGreaterThanOrEqual(4.5);
  return state;
};

test('Default and LightMode apply distinct root palettes with AA page contrast', async ({ page }) => {
  const dark = await measuredTheme(page, await openStory(page, 'default'));
  expect(dark.rootTheme).toBe('dark');
  expect(dark.stored).toBe('dark');

  const lightRoot = await openStory(page, 'light-mode');
  const light = await measuredTheme(page, lightRoot);
  expect(light.rootTheme).toBe('light');
  expect(light.stored).toBe('light');
  await expect(lightRoot).toHaveClass(/\bsk-light\b/);

  expect(light.background).not.toBe(dark.background);
  expect(luminance(dark.background)).toBeLessThan(0.5);
  expect(luminance(light.background)).toBeGreaterThan(0.5);
});

for (const resolved of ['light', 'dark'] as const) {
  test(`System-${resolved} follows the emulated operating-system preference`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: resolved });
    const root = await openStory(page, `system-${resolved}`);
    const state = await measuredTheme(page, root);

    expect(state.rootTheme).toBe(resolved);
    expect(state.stored).toBe('system');
    await expect(root.getByRole('radio', { name: 'System' })).toBeChecked();
  });
}

test('manual Light and Dark each override the opposing operating-system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  let root = await openStory(page, 'manual-light');
  expect((await measuredTheme(page, root)).rootTheme).toBe('light');
  await expect(root.getByRole('radio', { name: 'Light' })).toBeChecked();

  await page.emulateMedia({ colorScheme: 'light' });
  root = await openStory(page, 'manual-dark');
  expect((await measuredTheme(page, root)).rootTheme).toBe('dark');
  await expect(root.getByRole('radio', { name: 'Dark' })).toBeChecked();
});

test('the composition uses only the generic public toggle, toned cards, and facts primitive', async ({ page }) => {
  const root = await openStory(page, 'default');
  await expect(root.locator('sk-theme-toggle[data-theme-control]')).toHaveCount(1);
  await expect(root.locator('sk-card[status]')).toHaveCount(3);
  await expect(root.locator('dl.sk-facts')).toHaveCount(3);
  await expect(root).not.toContainText(/\b(?:queue|job|agent|authentication|refresh)\b/i);

  const toggleAttributes = await root.locator('sk-theme-toggle').evaluate((element) =>
    Array.from(element.attributes, ({ name }) => name).sort(),
  );
  expect(toggleAttributes).toEqual([
    'class',
    'dark-label',
    'data-theme-control',
    'label',
    'light-label',
    'preference',
    'system-label',
  ]);
});

test('greyscale keeps the selected state understandable from text and native semantics', async ({ page }) => {
  const root = await openStory(page, 'greyscale');
  expect(await root.evaluate((element) => getComputedStyle(element).filter)).toContain('grayscale(1)');
  await expect(root.getByRole('group', { name: 'Theme' })).toBeVisible();
  await expect(root.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(root.getByRole('radio', { name: 'System' })).toHaveCount(1);
  await expect(root.getByRole('radio', { name: 'Light' })).toHaveCount(1);
});

test('forced colours keep the three-state control operable while root preference still resolves', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Playwright forced-colors emulation is Chromium-owned');
  await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' });
  const root = await openStory(page, 'forced-colors');
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);

  const light = root.getByRole('radio', { name: 'Light' });
  await light.click();
  await expect(light).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe('light');
});

test('narrow and 200% zoom routes keep controls and content contained', async ({
  page,
  browser,
  browserName,
}) => {
  let root = await openStory(page, 'narrow', { width: 390, height: 844 });
  let geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  await expect(root.getByRole('radio', { name: 'System' })).toBeVisible();
  await expect(root.getByRole('radio', { name: 'Light' })).toBeVisible();
  await expect(root.getByRole('radio', { name: 'Dark' })).toBeVisible();

  test.skip(
    browserName !== 'chromium',
    'the 780-physical-pixel / 390-CSS-pixel effective 200% zoom lane is Chromium-owned',
  );
  const zoomContext = await browser.newContext({
    viewport: { width: 390, height: 500 },
    deviceScaleFactor: 2,
  });
  try {
    const zoomPage = await zoomContext.newPage();
    const zoomRoot = await openStory(zoomPage, 'zoom-200', { width: 390, height: 500 });
    const zoomGeometry = await zoomPage.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      devicePixelRatio: window.devicePixelRatio,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(zoomGeometry.devicePixelRatio).toBe(2);
    expect(zoomGeometry.clientWidth).toBe(390);
    expect(zoomGeometry.scrollWidth).toBeLessThanOrEqual(zoomGeometry.clientWidth);

    const system = zoomRoot.getByRole('radio', { name: 'System' });
    const light = zoomRoot.getByRole('radio', { name: 'Light' });
    const dark = zoomRoot.getByRole('radio', { name: 'Dark' });
    await expect(system).toBeVisible();
    await expect(light).toBeVisible();
    await expect(dark).toBeVisible();
    await light.click();
    await expect(light).toBeChecked();
    expect(await zoomPage.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  } finally {
    await zoomContext.close();
  }
});

test('the composed Default, LightMode, System, and forced-colors stories are axe-clean', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'the repository-wide axe lane runs once in Chromium');
  for (const story of ['default', 'light-mode', 'system-light', 'forced-colors'] as const) {
    if (story === 'system-light') await page.emulateMedia({ colorScheme: 'light' });
    if (story === 'forced-colors') await page.emulateMedia({ forcedColors: 'active' });
    await openStory(page, story);
    await injectAxe(page);
    const violations = await getViolations(page, 'body', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
    expect(violations, `${story} must have zero WCAG 2.1 AA violations`).toEqual([]);
  }
});
