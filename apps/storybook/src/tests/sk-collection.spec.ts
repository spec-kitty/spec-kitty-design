import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const COLLECTION_CSS = 'packages/styles/src/collection/sk-collection.css';
const STORY_PREFIX = 'primitives-skcollection-html';
const DEFAULT_ITEMS = ['Collection item 01', 'Collection item 02', 'Collection item 03'];
const FIFTY_ITEMS = Array.from(
  { length: 50 },
  (_, index) => `Collection item ${String(index + 1).padStart(2, '0')}`,
);

type StoryId =
  | 'default'
  | 'closed'
  | 'one-item'
  | 'fifty-items'
  | 'empty'
  | 'no-count'
  | 'no-footer'
  | 'long-text'
  | 'narrow'
  | 'forced-colors'
  | 'blocked'
  | 'blocked-light-mode'
  | 'blocked-forced-colors'
  | 'light-mode';

type FixtureExpectation = {
  id: StoryId;
  heading: string;
  items: string[];
  count?: string;
  action?: { name: string; href: string };
};

const FIXTURES: FixtureExpectation[] = [
  {
    id: 'default',
    heading: 'Sample collection',
    items: DEFAULT_ITEMS,
    count: '3 items',
    action: { name: 'View more', href: '#more-items' },
  },
  {
    id: 'one-item',
    heading: 'Single-item collection',
    items: ['Only collection item'],
    count: '1 item',
    action: { name: 'View more', href: '#more-items' },
  },
  {
    id: 'fifty-items',
    heading: 'Large collection',
    items: FIFTY_ITEMS,
    count: '50 items',
    action: { name: 'View more', href: '#more-items' },
  },
  {
    id: 'empty',
    heading: 'Empty collection',
    items: [],
    count: '0 items',
    action: { name: 'View more', href: '#more-items' },
  },
  {
    id: 'no-count',
    heading: 'Collection without a count',
    items: DEFAULT_ITEMS,
    action: { name: 'View more', href: '#more-items' },
  },
  {
    id: 'no-footer',
    heading: 'Collection without a footer',
    items: DEFAULT_ITEMS,
    count: '3 items',
  },
];

async function openStory(page: Page, id: StoryId): Promise<Locator> {
  await page.goto(`/iframe.html?id=${STORY_PREFIX}--${id}&viewMode=story`);
  const collection = page.locator('#storybook-root .sk-collection').first();
  await collection.waitFor({ state: 'visible', timeout: 20000 });
  return collection;
}

function readCollectionCss(): string {
  if (!existsSync(COLLECTION_CSS)) {
    throw new Error(
      `ENOENT: expected sk-collection source at ${COLLECTION_CSS}; ` +
        'the test-first production stylesheet has not been authored yet',
    );
  }
  return readFileSync(COLLECTION_CSS, 'utf8');
}

export function assertNoForbiddenBlockedSurface(cssText: string): void {
  const statusToken = cssText.match(/--(?:sk-status|sk-on-status)-[a-z0-9-]+/i)?.[0];
  if (statusToken !== undefined) {
    throw new Error(`sk-collection must not expose a direct status token: ${statusToken}`);
  }

  const forbiddenNames: string[] = [];
  const root = postcss.parse(cssText);
  root.walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walkClasses((className) => {
        if (/blocked/i.test(className.value)) forbiddenNames.push(`.${className.value}`);
      });
      selectors.walkAttributes((attribute) => {
        if (/blocked/i.test(attribute.attribute)) {
          forbiddenNames.push(`[${attribute.attribute}]`);
        }
      });
    }).processSync(rule.selector);
  });
  if (forbiddenNames.length > 0) {
    throw new Error(
      `sk-collection must not expose blocked-named selector surfaces: ${forbiddenNames.join(', ')}`,
    );
  }
}

async function focusVisibility(control: Locator) {
  return control.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const outlineWidth = Number.parseFloat(style.outlineWidth);
    const outlineOffset = Number.parseFloat(style.outlineOffset);
    const expansion = Math.max(0, outlineWidth + outlineOffset);
    const outlineRect = {
      top: rect.top - expansion,
      right: rect.right + expansion,
      bottom: rect.bottom + expansion,
      left: rect.left - expansion,
    };
    let clippedByAncestor = false;
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const ancestorStyle = getComputedStyle(ancestor);
      const clipsX = ['hidden', 'clip'].includes(ancestorStyle.overflowX);
      const clipsY = ['hidden', 'clip'].includes(ancestorStyle.overflowY);
      if (!clipsX && !clipsY) continue;
      const ancestorRect = ancestor.getBoundingClientRect();
      if (
        (clipsX && (outlineRect.left < ancestorRect.left || outlineRect.right > ancestorRect.right)) ||
        (clipsY && (outlineRect.top < ancestorRect.top || outlineRect.bottom > ancestorRect.bottom))
      ) {
        clippedByAncestor = true;
        break;
      }
    }
    return {
      clippedByAncestor,
      outlineStyle: style.outlineStyle,
      outlineWidth,
      withinViewport:
        outlineRect.left >= 0 &&
        outlineRect.right <= document.documentElement.clientWidth &&
        outlineRect.top >= 0 &&
        outlineRect.bottom <= document.documentElement.clientHeight,
    };
  });
}

async function assertNoHorizontalOverflow(page: Page, collection: Locator): Promise<void> {
  const geometry = await page.evaluate(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    return { clientWidth: scroller.clientWidth, scrollWidth: scroller.scrollWidth };
  });
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  const containment = await collection.evaluate((node) => {
    const root = node.getBoundingClientRect();
    const descendants = [...node.querySelectorAll<HTMLElement>(
      '.sk-collection__heading, .sk-collection__count, .sk-collection__list, .sk-collection__item, .sk-collection__action',
    )];
    return descendants.map((descendant) => {
      const rect = descendant.getBoundingClientRect();
      return {
        identity: `${descendant.tagName.toLowerCase()}.${descendant.className}`,
        left: rect.left,
        right: rect.right,
        rootLeft: root.left,
        rootRight: root.right,
        scrolls: descendant.scrollWidth > descendant.clientWidth + 1,
      };
    });
  });
  for (const item of containment) {
    expect(item.left).toBeGreaterThanOrEqual(item.rootLeft - 1);
    expect(item.right).toBeLessThanOrEqual(item.rootRight + 1);
    expect(item.scrolls, `${item.identity} must not scroll internally`).toBe(false);
  }
}

type ZoomMetrics = {
  root: { left: number; right: number; width: number };
  content: { left: number; right: number; width: number };
  list: { left: number; right: number; width: number };
  clientWidth: number;
  scrollWidth: number;
  lineFragments: number;
  outlineWidth: number;
  outlineOffset: number;
};

async function zoomMetrics(page: Page, normalizeBy: number): Promise<ZoomMetrics> {
  return page.evaluate((divisor) => {
    const rect = (node: Element) => {
      const value = node.getBoundingClientRect();
      return {
        left: value.left / divisor,
        right: value.right / divisor,
        width: value.width / divisor,
      };
    };
    const root = document.querySelector<HTMLElement>('[data-zoom-root]')!;
    const content = root.querySelector<HTMLElement>('[data-zoom-content]')!;
    const list = root.querySelector<HTMLElement>('[data-zoom-list]')!;
    const focus = root.querySelector<HTMLElement>('[data-zoom-focus]')!;
    const range = document.createRange();
    range.selectNodeContents(content);
    const focusStyle = getComputedStyle(focus);
    return {
      root: rect(root),
      content: rect(content),
      list: rect(list),
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      lineFragments: range.getClientRects().length,
      outlineWidth: Number.parseFloat(focusStyle.outlineWidth),
      outlineOffset: Number.parseFloat(focusStyle.outlineOffset),
    };
  }, normalizeBy);
}

function expectEquivalentZoomMetrics(reference: ZoomMetrics, candidate: ZoomMetrics): void {
  const numericPairs = [
    [reference.root.left, candidate.root.left],
    [reference.root.right, candidate.root.right],
    [reference.root.width, candidate.root.width],
    [reference.content.left, candidate.content.left],
    [reference.content.right, candidate.content.right],
    [reference.content.width, candidate.content.width],
    [reference.list.left, candidate.list.left],
    [reference.list.right, candidate.list.right],
    [reference.list.width, candidate.list.width],
    [reference.clientWidth, candidate.clientWidth],
    [reference.scrollWidth, candidate.scrollWidth],
    [reference.outlineWidth, candidate.outlineWidth],
    [reference.outlineOffset, candidate.outlineOffset],
  ];
  for (const [expected, actual] of numericPairs) {
    expect(Math.abs(expected! - actual!)).toBeLessThanOrEqual(1);
  }
  expect(candidate.lineFragments).toBe(reference.lineFragments);
}

test.describe('sk-collection neutral source boundary', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'browser-independent source checks run once');

  test('the production stylesheet has no forbidden Blocked/status surface', () => {
    assertNoForbiddenBlockedSurface(readCollectionCss());
  });

  test('matcher catches a --sk-status-* token', () => {
    expect(() => assertNoForbiddenBlockedSurface('.sk-collection { color: var(--sk-status-danger); }')).toThrow(
      /direct status token/,
    );
  });

  test('matcher catches a --sk-on-status-* token', () => {
    expect(() => assertNoForbiddenBlockedSurface('.sk-collection { color: var(--sk-on-status-danger); }')).toThrow(
      /direct status token/,
    );
  });

  test('matcher catches the .sk-collection--blocked modifier', () => {
    expect(() => assertNoForbiddenBlockedSurface('.sk-collection--blocked { display: block; }')).toThrow(
      /blocked-named selector/,
    );
  });

  test('matcher catches mixed-case data-Blocked-reason', () => {
    expect(() => assertNoForbiddenBlockedSurface('.sk-collection[data-Blocked-reason] { display: block; }')).toThrow(
      /blocked-named selector/,
    );
  });

  test('matcher accepts ordinary collection CSS with an unrelated token', () => {
    expect(() => assertNoForbiddenBlockedSurface('.sk-collection { color: var(--sk-fg-body); }')).not.toThrow();
  });

  test('matcher accepts Blocked as consumer-facing generated content', () => {
    expect(() => assertNoForbiddenBlockedSurface(".sk-collection::before { content: 'Blocked'; }")).not.toThrow();
  });
});

test('the 200% zoom plumbing is active and matches the calibrated half-viewport probe', async ({ page }) => {
  const fixture = `
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; }
      [data-zoom-root] { width: 320px; padding: 8px; }
      [data-zoom-content] { width: 200px; }
      [data-zoom-list] { width: 240px; }
      [data-zoom-focus]:focus { outline: 2px solid; outline-offset: 1px; }
    </style>
    <main data-zoom-root>
      <p data-zoom-content>Deterministic zoom calibration text.</p>
      <ul data-zoom-list><li>Probe item</li></ul>
      <button data-zoom-focus>Focus probe</button>
      <div data-width-probe style="width: 100px"></div>
    </main>`;

  await page.setViewportSize({ width: 780, height: 1440 });
  await page.setContent(fixture);
  await page.locator('[data-zoom-root]').evaluate((root) => {
    root.style.zoom = '2';
  });
  await page.locator('[data-zoom-focus]').focus();
  expect(await page.locator('[data-zoom-root]').evaluate((root) => getComputedStyle(root).zoom)).toBe('2');
  expect(await page.locator('[data-width-probe]').evaluate((probe) => probe.getBoundingClientRect().width)).toBe(200);
  const reference = await zoomMetrics(page, 2);

  await page.setViewportSize({ width: 390, height: 720 });
  await page.setContent(fixture);
  await page.locator('[data-zoom-focus]').focus();
  const candidate = await zoomMetrics(page, 1);
  console.info('T002 zoom plumbing', JSON.stringify({ reference, candidate }));
  expectEquivalentZoomMetrics(reference, candidate);
});

test('native fixture scale, naming, order, counts, and optional regions are exact', async ({ page }) => {
  for (const fixture of FIXTURES) {
    const collection = await openStory(page, fixture.id);
    const heading = collection.locator('.sk-collection__heading');
    await expect(heading).toHaveText(fixture.heading);
    const headingId = await heading.getAttribute('id');
    expect(headingId).toBeTruthy();
    await expect(collection).toHaveAttribute('aria-labelledby', headingId!);
    await expect(page.getByRole('region', { name: fixture.heading })).toHaveCount(1);

    const button = collection.getByRole('button', { name: 'Collapse collection' });
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const bodyId = await button.getAttribute('aria-controls');
    expect(bodyId).toBeTruthy();
    const body = collection.locator(`#${bodyId}`);
    await expect(body).not.toHaveAttribute('hidden', '');
    await expect(body).toBeVisible();

    const list = body.getByRole('list');
    await expect(list).toHaveCount(1);
    const items = body.getByRole('listitem');
    await expect(items).toHaveCount(fixture.items.length);
    expect(await items.allInnerTexts()).toEqual(fixture.items);
    const snapshot = await collection.ariaSnapshot();
    let previousIndex = -1;
    for (const item of fixture.items) {
      const index = snapshot.indexOf(item);
      expect(index).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }

    const count = collection.locator('.sk-collection__count');
    if (fixture.count === undefined) await expect(count).toHaveCount(0);
    else await expect(count).toHaveText(fixture.count);

    const footer = collection.locator('.sk-collection__footer');
    const action = collection.locator('.sk-collection__action');
    if (fixture.action === undefined) {
      await expect(footer).toHaveCount(0);
      await expect(action).toHaveCount(0);
    } else {
      await expect(footer).toHaveCount(1);
      await expect(action).toHaveAccessibleName(fixture.action.name);
      await expect(action).toHaveAttribute('href', fixture.action.href);
    }

    const marker = collection.locator('.sk-collection__marker');
    if ((await marker.count()) > 0) {
      await expect(marker).toHaveAttribute('aria-hidden', 'true');
      await expect(button).toHaveAccessibleName('Collapse collection');
      expect(snapshot).not.toContain('▸');
    }
    if (fixture.id === 'empty') {
      await expect(list).toHaveText('');
    }
  }
});

for (const activation of ['pointer', 'Enter', 'Space'] as const) {
  test(`${activation} activation synchronizes aria-expanded, hidden, state label, and accessible name`, async ({ page }) => {
    const collection = await openStory(page, 'default');
    const button = collection.locator('.sk-collection__toggle');
    const body = collection.locator('.sk-collection__body');
    const stateLabel = button.locator('.sk-collection__state-label');
    await expect(button).toHaveAccessibleName('Collapse collection');
    if (activation === 'pointer') await button.click();
    else {
      await button.focus();
      await page.keyboard.press(activation);
    }
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(body).toHaveAttribute('hidden', '');
    await expect(body).toBeHidden();
    await expect(stateLabel).toHaveText('Expand collection');
    await expect(button).toHaveAccessibleName('Expand collection');
    await expect(page.getByRole('list')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'View more' })).toHaveCount(0);
    await page.keyboard.press('Tab');
    await expect(body.locator(':focus')).toHaveCount(0);
  });
}

test('closed descendants leave and then return to the accessibility tree and tab order', async ({ page }) => {
  const collection = await openStory(page, 'default');
  const button = collection.locator('.sk-collection__toggle');
  const body = collection.locator('.sk-collection__body');
  const items = DEFAULT_ITEMS;
  await expect(button).toHaveAccessibleName('Collapse collection');
  await button.click();
  await expect(page.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'View more' })).toHaveCount(0);
  await button.click();
  await expect(button).toHaveAccessibleName('Collapse collection');
  await expect(body).toBeVisible();
  await expect(body.getByRole('listitem')).toHaveCount(items.length);
  expect(await body.getByRole('listitem').allInnerTexts()).toEqual(items);
  const action = body.getByRole('link', { name: 'View more' });
  await action.focus();
  await expect(action).toBeFocused();
});

for (const id of ['long-text', 'fifty-items'] as const) {
  for (const condition of ['narrow', 'zoom-200'] as const) {
    test(`${id} remains contained with visible focus at ${condition}`, async ({ page }) => {
      if (condition === 'narrow') await page.setViewportSize({ width: 390, height: 720 });
      else await page.setViewportSize({ width: 780, height: 1440 });
      const collection = await openStory(page, id);
      const root = page.locator('#storybook-root');
      if (condition === 'zoom-200') {
        await root.evaluate((node) => {
          node.style.zoom = '2';
        });
        expect(await root.evaluate((node) => getComputedStyle(node).zoom)).toBe('2');
        const probe = await root.evaluate((node) => {
          const element = document.createElement('div');
          element.style.width = '100px';
          node.prepend(element);
          const width = element.getBoundingClientRect().width;
          element.remove();
          return width;
        });
        expect(probe).toBe(200);
      }
      await assertNoHorizontalOverflow(page, collection);
      for (const control of await collection.locator('.sk-collection__toggle, .sk-collection__action').all()) {
        await control.scrollIntoViewIfNeeded();
        await control.focus();
        const visibility = await focusVisibility(control);
        expect(visibility.outlineStyle).not.toBe('none');
        expect(visibility.outlineWidth).toBeGreaterThan(0);
        expect(visibility.withinViewport).toBe(true);
        expect(visibility.clippedByAncestor).toBe(false);
      }
    });
  }
}

test('actual-story zoom metrics are recorded against the optional half-viewport candidate', async ({ page }) => {
  const tables: Record<string, { reference: ZoomMetrics; candidate: ZoomMetrics; shortcutAccepted: boolean }> = {};
  for (const id of ['long-text', 'fifty-items'] as const) {
    await page.setViewportSize({ width: 780, height: 1440 });
    let collection = await openStory(page, id);
    let root = page.locator('#storybook-root');
    await root.evaluate((node) => {
      node.dataset.zoomRoot = '';
      node.style.zoom = '2';
      const heading = node.querySelector<HTMLElement>('.sk-collection__heading')!;
      const list = node.querySelector<HTMLElement>('.sk-collection__list')!;
      const focus = node.querySelector<HTMLElement>('.sk-collection__toggle')!;
      heading.dataset.zoomContent = '';
      list.dataset.zoomList = '';
      focus.dataset.zoomFocus = '';
    });
    expect(await root.evaluate((node) => getComputedStyle(node).zoom)).toBe('2');
    await collection.locator('.sk-collection__toggle').focus();
    const reference = await zoomMetrics(page, 2);

    await page.setViewportSize({ width: 390, height: 720 });
    collection = await openStory(page, id);
    root = page.locator('#storybook-root');
    await root.evaluate((node) => {
      node.dataset.zoomRoot = '';
      const heading = node.querySelector<HTMLElement>('.sk-collection__heading')!;
      const list = node.querySelector<HTMLElement>('.sk-collection__list')!;
      const focus = node.querySelector<HTMLElement>('.sk-collection__toggle')!;
      heading.dataset.zoomContent = '';
      list.dataset.zoomList = '';
      focus.dataset.zoomFocus = '';
    });
    await collection.locator('.sk-collection__toggle').focus();
    const candidate = await zoomMetrics(page, 1);
    const numeric = [
      Math.abs(reference.root.width - candidate.root.width),
      Math.abs(reference.content.width - candidate.content.width),
      Math.abs(reference.list.width - candidate.list.width),
      Math.abs(reference.clientWidth - candidate.clientWidth),
      Math.abs(reference.scrollWidth - candidate.scrollWidth),
      Math.abs(reference.outlineWidth - candidate.outlineWidth),
      Math.abs(reference.outlineOffset - candidate.outlineOffset),
    ];
    tables[id] = {
      reference,
      candidate,
      shortcutAccepted:
        numeric.every((delta) => delta <= 1) && reference.lineFragments === candidate.lineFragments,
    };
  }
  console.info('T014 actual-story zoom calibration', JSON.stringify(tables));
  expect(Object.values(tables).every(({ reference }) => reference.root.width > 0)).toBe(true);
});

test('Default and LightMode preserve content while verified foreground values differ', async ({ page }) => {
  const facts = async (id: 'default' | 'light-mode') => {
    const collection = await openStory(page, id);
    return collection.evaluate((node) => {
      const heading = node.querySelector<HTMLElement>('.sk-collection__heading')!;
      return {
        content: {
          heading: heading.textContent?.trim(),
          items: [...node.querySelectorAll('.sk-collection__item')].map((item) => item.textContent?.trim()),
          button: node.querySelector('button')?.textContent?.trim(),
        },
        foregroundToken: getComputedStyle(node).getPropertyValue('--sk-fg-default').trim(),
        headingColor: getComputedStyle(heading).color,
      };
    });
  };
  const dark = await facts('default');
  const light = await facts('light-mode');
  expect(light.content).toEqual(dark.content);
  expect(light.foregroundToken).not.toBe(dark.foregroundToken);
  expect(light.headingColor).not.toBe(dark.headingColor);
});

test('reduced motion suppresses exactly the collection marker transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let collection = await openStory(page, 'default');
  const duration = await collection.locator('.sk-collection__marker').evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(duration).not.toBe('0s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  collection = await openStory(page, 'default');
  await expect(collection.locator('.sk-collection__marker')).toHaveCSS('transition-duration', '0s');
});

test('forced colours preserve all six load-bearing borders and outlines', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Playwright forced-colours emulation is Chromium-only');
  await page.emulateMedia({ forcedColors: 'active' });
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  let collection = await openStory(page, 'forced-colors');
  const toggle = collection.locator('.sk-collection__toggle');
  await toggle.focus();
  const cues = await collection.evaluate((node) => {
    const cue = (element: Element, side: 'all' | 'block-end' | 'block-start') => {
      const style = getComputedStyle(element);
      if (side === 'all') return { style: style.borderStyle, width: Number.parseFloat(style.borderWidth) };
      if (side === 'block-end') {
        return { style: style.borderBlockEndStyle, width: Number.parseFloat(style.borderBlockEndWidth) };
      }
      return { style: style.borderBlockStartStyle, width: Number.parseFloat(style.borderBlockStartWidth) };
    };
    return {
      root: cue(node, 'all'),
      header: cue(node.querySelector('.sk-collection__header')!, 'block-end'),
      item: cue(node.querySelectorAll('.sk-collection__item')[1]!, 'block-start'),
      footer: cue(node.querySelector('.sk-collection__footer')!, 'block-start'),
      focus: {
        style: getComputedStyle(node.querySelector('.sk-collection__toggle')!).outlineStyle,
        width: Number.parseFloat(getComputedStyle(node.querySelector('.sk-collection__toggle')!).outlineWidth),
      },
    };
  });
  for (const cue of Object.values(cues)) {
    expect(cue.style).not.toBe('none');
    expect(cue.width).toBeGreaterThan(0);
  }

  collection = await openStory(page, 'blocked-forced-colors');
  const outerCard = collection.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " sk-card ")]').first();
  const cardCue = await outerCard.evaluate((node) => {
    const style = getComputedStyle(node);
    return { style: style.borderStyle, width: Number.parseFloat(style.borderWidth) };
  });
  expect(cardCue.style).not.toBe('none');
  expect(cardCue.width).toBeGreaterThan(0);
});

test('temporary visual evidence captures remain in Playwright output only', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'one browser owns temporary review captures');
  for (const id of ['default', 'light-mode', 'narrow', 'blocked'] as const) {
    if (id === 'narrow') await page.setViewportSize({ width: 390, height: 720 });
    else await page.setViewportSize({ width: 1280, height: 960 });
    const collection = await openStory(page, id);
    const path = testInfo.outputPath(`sk-collection-${id}.png`);
    await collection.screenshot({ path });
    await testInfo.attach(`sk-collection-${id}`, { path, contentType: 'image/png' });
  }
});
