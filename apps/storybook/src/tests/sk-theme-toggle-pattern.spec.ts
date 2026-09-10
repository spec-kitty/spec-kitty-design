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

const axeIsClean = async (page: Page, storyId: StoryId): Promise<void> => {
  await injectAxe(page);
  let violations: Awaited<ReturnType<typeof getViolations>> | undefined;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      violations = await getViolations(page, 'body', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      });
      break;
    } catch (error) {
      const concurrentAxe =
        error instanceof Error && error.message.includes('Axe is already running');
      if (!concurrentAxe || attempt === 9) throw error;
      await page.waitForTimeout(100);
    }
  }
  expect(violations, `${storyId} must have zero WCAG 2.1 AA violations`).toEqual([]);
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
  const forcedPresentation = await light.evaluate((radio) => {
    const choice = radio.closest('label');
    if (!choice) throw new Error('theme choice has no label');
    const systemProbe = document.createElement('span');
    systemProbe.style.color = 'CanvasText';
    systemProbe.style.backgroundColor = 'Canvas';
    systemProbe.style.position = 'fixed';
    systemProbe.style.insetInlineStart = '-10000px';
    document.body.append(systemProbe);
    const choiceStyle = getComputedStyle(choice);
    const probeStyle = getComputedStyle(systemProbe);
    const result = {
      background: choiceStyle.backgroundColor,
      color: choiceStyle.color,
      forcedColorAdjust: choiceStyle.forcedColorAdjust,
      systemBackground: probeStyle.backgroundColor,
      systemColor: probeStyle.color,
    };
    systemProbe.remove();
    return result;
  });
  expect(forcedPresentation.forcedColorAdjust).toBe('auto');
  expect(forcedPresentation.color).toBe(forcedPresentation.systemColor);
  expect(forcedPresentation.background).toBe(forcedPresentation.systemBackground);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe('light');
});

test('narrow and supplemental HiDPI routes keep controls and content contained', async ({
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
    'the 2x device-density supplement is Chromium-owned; genuine zoom has headed evidence',
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

/** The complete strings the composition supplies to its page header's text slots. */
const HEADER_COPY = [
  { slot: 'eyebrow', text: 'Operations' },
  { slot: 'title', text: 'Regional service status' },
  {
    slot: 'supporting',
    text: 'Every value below is supplied by the application. The library styles none of it.',
  },
  { slot: 'sync', text: 'Updated 4 minutes ago' },
] as const;

/**
 * Measure whether every supplied header string is VISIBLY available, not merely present.
 *
 * `text-overflow: ellipsis` changes painting, not the DOM, so a truncated string still has its
 * full text content and accessible name. What does change is geometry: the string's own line
 * boxes extend past the clipping box that paints the ellipsis. Each line box of each string is
 * therefore compared with every overflow-clipping box between it and the document, walking the
 * flat tree across slot assignment and shadow boundaries, and with the viewport's inline extent.
 */
const headerCopyVisibility = (composition: Locator) =>
  composition.evaluate((element, slots) => {
    const header = element.querySelector('sk-page-header');
    if (!header) throw new Error('the composition has no page header');
    const viewportWidth = document.documentElement.clientWidth;
    const flatParent = (node: Element): Element | null => {
      if (node.assignedSlot) return node.assignedSlot;
      const parent = node.parentNode;
      if (parent instanceof ShadowRoot) return parent.host;
      return parent instanceof Element ? parent : null;
    };
    const describe = (node: Element) =>
      node.localName + (node.classList.length ? `.${Array.from(node.classList).join('.')}` : '');

    return slots.map((slot) => {
      const copy = header.querySelector<HTMLElement>(`:scope > [slot="${slot}"]`);
      if (!copy) return { slot, text: null, visible: false, lines: 0, clippedBy: ['missing'] };
      const range = document.createRange();
      range.selectNodeContents(copy);
      const lines = Array.from(range.getClientRects()).filter((line) => line.width > 0);
      const outside = (left: number, top: number, right: number, bottom: number) =>
        lines.some((line) =>
          line.left < left - 1 || line.right > right + 1 ||
          line.top < top - 1 || line.bottom > bottom + 1);
      const clippedBy: string[] = [];
      for (
        let node: Element | null = copy;
        node && node !== document.body && node !== document.documentElement;
        node = flatParent(node)
      ) {
        const style = getComputedStyle(node);
        if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
        const box = node.getBoundingClientRect();
        const left = box.left + node.clientLeft;
        const top = box.top + node.clientTop;
        if (outside(left, top, left + node.clientWidth, top + node.clientHeight)) {
          clippedBy.push(describe(node));
        }
      }
      if (lines.some((line) => line.left < -1 || line.right > viewportWidth + 1)) {
        clippedBy.push('viewport');
      }
      return {
        slot,
        text: copy.textContent?.trim() ?? null,
        visible: copy.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }),
        lines: lines.length,
        clippedBy,
      };
    });
  }, HEADER_COPY.map(({ slot }) => slot));

/**
 * Three CSS geometries of the SAME composition. The middle one is the effective CSS viewport the
 * genuine headed-Chrome capture measured at 200% browser zoom (`browser-zoom/metrics.json`):
 * layout sees CSS pixels, so this is the layout genuine zoom produces. It is not itself browser
 * zoom — the committed headed captures remain that evidence.
 */
const HEADER_GEOMETRIES = [
  { name: 'desktop 100%', story: 'zoom-200', width: 1199, height: 712, deviceScaleFactor: 1 },
  { name: '200% zoom CSS viewport', story: 'zoom-200', width: 599, height: 356, deviceScaleFactor: 2 },
  { name: 'narrow', story: 'narrow', width: 390, height: 844, deviceScaleFactor: 1 },
] as const;

for (const geometry of HEADER_GEOMETRIES) {
  test(`the composed header keeps every supplied string visibly available at ${geometry.name}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: geometry.width, height: geometry.height },
      deviceScaleFactor: geometry.deviceScaleFactor,
    });
    try {
      const page = await context.newPage();
      const root = await openStory(page, geometry.story, {
        width: geometry.width,
        height: geometry.height,
      });

      const copy = await headerCopyVisibility(root);
      expect(copy.map(({ lines, ...visibility }) => visibility)).toEqual(
        HEADER_COPY.map(({ slot, text }) => ({ slot, text, visible: true, clippedBy: [] })),
      );
      for (const { slot, lines } of copy) expect(lines, `${slot} line boxes`).toBeGreaterThan(0);

      const document = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(document.scrollWidth).toBeLessThanOrEqual(document.clientWidth);
      for (const name of ['System', 'Light', 'Dark']) {
        await expect(root.getByRole('radio', { name })).toBeVisible();
      }
      await expect(root.getByRole('radio', { name: 'Dark' })).toBeChecked();
    } finally {
      await context.close();
    }
  });
}

test('the composed Default, LightMode, System, and forced-colors stories are axe-clean', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'the repository-wide axe lane runs once in Chromium');
  for (const story of ['default', 'light-mode', 'system-light', 'forced-colors'] as const) {
    if (story === 'system-light') await page.emulateMedia({ colorScheme: 'light' });
    if (story === 'forced-colors') await page.emulateMedia({ forcedColors: 'active' });
    await openStory(page, story);
    await axeIsClean(page, story);
  }
});
