import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

const STORY_PREFIX = 'patterns-work-package-views--';
const STORY_IDS = [
  'default',
  'light-mode',
  'all-lanes-empty',
  'scale-50-work-packages',
  'live-claim',
  'stale-claim',
  'snapshot-behind-log',
  'narrow-overview',
  'detail-populated',
  'detail-light-mode',
  'detail-no-subtasks',
  'detail-absent-prompt',
  'detail-history-unavailable',
  'detail-long-content',
  'detail-narrow',
] as const;

type StoryId = (typeof STORY_IDS)[number];
type ActionTrace = Array<{
  detail: unknown;
  bubbles: boolean;
  composed: boolean;
  cancelable: boolean;
}>;
type FocusStop = Readonly<{
  outerTag: string;
  outerRowId: string | null;
  innerTag: string;
  innerPart: string | null;
  id: string | null;
  href: string | null;
  longCode: boolean;
}>;

const openStory = async (
  page: Page,
  id: StoryId,
  viewport: Readonly<{ width: number; height: number }> = {
    width: 1280,
    height: 900,
  },
): Promise<void> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=${STORY_PREFIX}${id}&viewMode=story`);
};

const overview = async (
  page: Page,
  id: Extract<
    StoryId,
    | 'default'
    | 'light-mode'
    | 'all-lanes-empty'
    | 'scale-50-work-packages'
    | 'live-claim'
    | 'stale-claim'
    | 'snapshot-behind-log'
    | 'narrow-overview'
  >,
  viewport?: Readonly<{ width: number; height: number }>,
): Promise<Locator> => {
  await openStory(page, id, viewport);
  const root = page.locator('[data-work-package-overview]').first();
  await root.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  return root;
};

const detail = async (
  page: Page,
  id: Extract<
    StoryId,
    | 'detail-populated'
    | 'detail-light-mode'
    | 'detail-no-subtasks'
    | 'detail-absent-prompt'
    | 'detail-history-unavailable'
    | 'detail-long-content'
    | 'detail-narrow'
  >,
  viewport?: Readonly<{ width: number; height: number }>,
): Promise<Locator> => {
  await openStory(page, id, viewport);
  const root = page.locator('[data-work-package-detail]').first();
  await root.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  return root;
};

const documentGeometry = (page: Page) =>
  page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

const resetKeyboardFocus = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await expect.poll(() => page.evaluate(() => document.activeElement === document.body)).toBe(true);
};

const currentFocusStop = (page: Page): Promise<FocusStop> =>
  page.evaluate(() => {
    const outer = document.activeElement as HTMLElement;
    let inner = outer;
    while (inner.shadowRoot?.activeElement instanceof HTMLElement) {
      inner = inner.shadowRoot.activeElement;
    }

    return {
      outerTag: outer.localName,
      outerRowId: outer.getAttribute('row-id'),
      innerTag: inner.localName,
      innerPart: inner.getAttribute('part'),
      id: inner.id || null,
      href: inner.getAttribute('href'),
      longCode: inner.hasAttribute('data-long-code'),
    };
  });

const tabToVisibleStop = async (page: Page, target: Locator): Promise<FocusStop> => {
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
  await expect(target).toBeInViewport();
  const geometry = await target.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      width: bounds.width,
      height: bounds.height,
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom,
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: window.innerHeight,
      outlineStyle: getComputedStyle(element).outlineStyle,
    };
  });
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.height).toBeGreaterThan(0);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.bottom).toBeGreaterThan(0);
  expect(geometry.top).toBeLessThan(geometry.viewportHeight);
  expect(geometry.outlineStyle).not.toBe('none');
  return currentFocusStop(page);
};

test('source keeps the patterns inside immutable Storybook-only public boundaries', () => {
  const source = readFileSync('packages/elements/src/patterns/work-package-views.stories.ts', 'utf8');

  expect(source).not.toMatch(/<sk-work-package-(?:overview|detail|card)(?:\s|>)/);
  expect(source).not.toMatch(/<sk-(?:workflow-board|workflow-lane)(?:\s|>)/);
  expect(source).not.toMatch(/customElements\.define\s*\(/);
  expect(source).not.toMatch(/shadowRoot/);
  expect(source).not.toMatch(/from\s+['"][^'"]*team-kitty/i);
  expect(source).not.toMatch(/\b(?:fetch|setTimeout|setInterval)\s*\(/);
  expect(source).not.toMatch(/\bnew\s+Date\s*\(/);
  expect(source).not.toMatch(/\b(?:localStorage|sessionStorage|Math\.random)\b/);
  expect(source).not.toMatch(/marked|markdown-it|sanitize|highlight\.js/i);
  expect(source).toContain('completedLaneId');
  expect(source).toContain('scaleWorkPackages: SCALE_WORK_PACKAGES');
  expect(source).toContain('deepFreezeWorkPackageFixture');
  expect(source).toContain('deriveOverview');
  expect(source).toContain('deriveDetail');
  expect(source).toMatch(/excludeStories:\s*\[[\s\S]*'renderWorkPackageDetail'/);
});

test('built index discovers exactly the fifteen route states and no helper exports', async ({ request }) => {
  const response = await request.get('/index.json');
  expect(response.ok()).toBe(true);
  const index = (await response.json()) as {
    entries: Readonly<Record<string, Readonly<{ type: string; title: string }>>>;
  };
  const entries = Object.entries(index.entries)
    .filter(([, entry]) => entry.type === 'story' && entry.title === 'Patterns/Work Package Views')
    .map(([id]) => id)
    .sort();

  expect(entries).toEqual(STORY_IDS.map((id) => `${STORY_PREFIX}${id}`).sort());
});

test('default overview reconciles one frozen 5-of-8 fixture across lanes and progress', async ({ page }) => {
  const root = await overview(page, 'default');
  await expect(root).toHaveAttribute('data-play-proof', 'passed');
  await expect(root).toHaveAttribute('data-fixture-deeply-frozen', 'true');
  await expect(root).toHaveAttribute('data-completed-count', '5');
  await expect(root).toHaveAttribute('data-total-count', '8');
  await expect(root).toHaveAttribute('data-percentage', '63');
  expect(JSON.parse((await root.getAttribute('data-projection-guards')) ?? '{}')).toEqual({
    duplicateLane: true,
    unknownCompletedLane: true,
    duplicateWorkPackage: true,
    unknownWorkPackageLane: true,
    unknownVisibleLane: true,
  });

  const progress = root.getByRole('progressbar', {
    name: '5 of 8 Work Packages done',
  });
  await expect(progress).toHaveJSProperty('value', 5);
  await expect(progress).toHaveJSProperty('max', 8);
  await expect(root.locator('.sk-progress__meta')).toHaveText('63%');

  const lanes = root.locator('[data-lane-id]');
  await expect(lanes).toHaveCount(5);
  expect(
    await lanes.evaluateAll((nodes) =>
      nodes.map((lane) => ({
        tag: lane.localName,
        directLists: lane.querySelectorAll(':scope > ol.sk-workflow-lane__list').length,
        headingTag: document.getElementById(lane.getAttribute('aria-labelledby') ?? '')?.localName,
      })),
    ),
  ).toEqual(
    Array.from({ length: 5 }, () => ({
      tag: 'section',
      directLists: 1,
      headingTag: 'h3',
    })),
  );
  const counts = await lanes.evaluateAll((nodes) =>
    nodes.map((lane) => ({
      visible: Number(lane.querySelector('.sk-workflow-lane__count')?.textContent),
      items: lane.querySelectorAll(':scope > .sk-workflow-lane__list > li').length,
    })),
  );
  expect(counts).toEqual([
    { visible: 1, items: 1 },
    { visible: 1, items: 1 },
    { visible: 1, items: 1 },
    { visible: 0, items: 0 },
    { visible: 5, items: 5 },
  ]);
  expect(counts.reduce((sum, lane) => sum + lane.items, 0)).toBe(8);

  const scroller = root.locator('.sk-workflow-board__scroller');
  const scrollerGeometry = await scroller.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(scrollerGeometry.scrollWidth).toBeLessThanOrEqual(scrollerGeometry.clientWidth);
  await expect(scroller).not.toHaveAttribute('role');
  await expect(scroller).not.toHaveAttribute('aria-labelledby');
  await expect(scroller).not.toHaveAttribute('tabindex');
});

test('empty and scale overview states preserve valid native progress and fixture-owned counts', async ({ page }) => {
  const empty = await overview(page, 'all-lanes-empty');
  await expect(empty).toHaveAttribute('data-completed-count', '0');
  await expect(empty).toHaveAttribute('data-total-count', '0');
  await expect(empty).toHaveAttribute('data-percentage', '0');
  const emptyProgress = empty.getByRole('progressbar', {
    name: '0 of 0 Work Packages done',
  });
  await expect(emptyProgress).toHaveJSProperty('value', 0);
  await expect(emptyProgress).toHaveJSProperty('max', 1);
  await expect(empty.locator('.sk-workflow-lane__list > li')).toHaveCount(0);
  await expect(empty.locator('.sk-empty-state--inline')).toHaveCount(5);

  const scale = await overview(page, 'scale-50-work-packages', {
    width: 1440,
    height: 1000,
  });
  await expect(scale).toHaveAttribute('data-total-count', '50');
  await expect(scale.locator('.sk-workflow-lane__list > li')).toHaveCount(50);
  const scaleIds = JSON.parse((await scale.getAttribute('data-work-package-ids')) ?? '[]') as string[];
  expect(scaleIds).toHaveLength(50);
  expect(new Set(scaleIds).size).toBe(50);
  expect(scaleIds.every((id) => id.startsWith('scale-wp-'))).toBe(true);
  const scaleProgress = scale.getByRole('progressbar', {
    name: '10 of 50 Work Packages done',
  });
  await expect(scaleProgress).toHaveJSProperty('value', 10);
  await expect(scaleProgress).toHaveJSProperty('max', 50);
  const scroller = scale.locator('.sk-workflow-board__scroller');
  const scrollerGeometry = await scroller.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(scrollerGeometry.scrollWidth).toBeGreaterThan(scrollerGeometry.clientWidth);
  await expect(scroller).toHaveRole('region');
  await expect(scroller).toHaveAccessibleName('Work Package workflow');
  await expect(scroller).toHaveAttribute('tabindex', '0');
  await resetKeyboardFocus(page);
  expect(await tabToVisibleStop(page, scroller)).toEqual({
    outerTag: 'div',
    outerRowId: null,
    innerTag: 'div',
    innerPart: null,
    id: null,
    href: null,
    longCode: false,
  });
  const initialScrollLeft = await scroller.evaluate((node) => node.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => scroller.evaluate((node) => node.scrollLeft)).toBeGreaterThan(initialScrollLeft);
});

test('claim and announcement states use supplied public presentations', async ({ page }) => {
  const live = await overview(page, 'live-claim');
  const liveStatus = live.locator('sk-status-indicator[data-claim-state="live"]');
  await expect(liveStatus).toHaveCount(1);
  await expect(liveStatus).toHaveAttribute('pulsing', '');
  await expect(liveStatus).toContainText('Live claim');
  await expect(live.getByText('Claimed by Mia', { exact: true })).toBeVisible();

  const stale = await overview(page, 'stale-claim');
  const staleStatus = stale.locator('sk-status-indicator[data-claim-state="stale"]');
  await expect(staleStatus).toHaveCount(1);
  await expect(staleStatus).not.toHaveAttribute('pulsing');
  await expect(stale.getByText(/Claim signal is stale; activation remains available/)).toBeVisible();
  await expect(stale.locator('sk-action-row button[part="trigger"]')).toBeEnabled();

  const snapshot = await overview(page, 'snapshot-behind-log');
  await expect(snapshot.locator('sk-notice[data-snapshot-notice]')).toHaveCount(1);
  await expect(snapshot.locator('[data-snapshot-banner]')).toHaveCount(0);
});

test('overview logs exact pointer, Enter, and Space intent without mutating selection', async ({ page }) => {
  const root = await overview(page, 'default');
  const host = root.locator('sk-action-row[row-id="wp-02"]');
  const trigger = host.locator('button[part="trigger"]');
  await expect(host).toHaveAttribute('selected', '');
  await host.evaluate((element) => {
    const trace: ActionTrace = [];
    (window as typeof window & { __workPackageActionTrace?: ActionTrace }).__workPackageActionTrace = trace;
    element.addEventListener('sk-action-row-activate', (event) => {
      const custom = event as CustomEvent<unknown>;
      trace.push({
        detail: custom.detail,
        bubbles: custom.bubbles,
        composed: custom.composed,
        cancelable: custom.cancelable,
      });
    });
  });

  const assertLast = async (count: number): Promise<void> => {
    const trace = await page.evaluate(
      () => (window as typeof window & { __workPackageActionTrace: ActionTrace }).__workPackageActionTrace,
    );
    expect(trace).toHaveLength(count);
    expect(trace.at(-1)).toEqual({
      detail: { id: 'wp-02' },
      bubbles: true,
      composed: true,
      cancelable: false,
    });
    await expect(host).toHaveAttribute('selected', '');
    await expect(root).toHaveAttribute('data-selected-work-package-id', 'wp-02');
  };

  await trigger.click();
  await assertLast(1);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await assertLast(2);
  await page.keyboard.press('Space');
  await assertLast(3);
  await expect(root.locator('[data-activation-log]')).toHaveAttribute('data-count', '3');
  await expect(root.locator('[data-activation-log]')).toHaveAttribute('data-id', 'wp-02');
});

test('sequential keyboard traversal has exact overview and detail focus stops', async ({ page }) => {
  const root = await overview(page, 'default');
  await resetKeyboardFocus(page);

  const overviewStops: FocusStop[] = [];
  for (const rowId of ['wp-01', 'wp-02', 'wp-03', 'wp-04', 'wp-05', 'wp-06', 'wp-07', 'wp-08']) {
    overviewStops.push(
      await tabToVisibleStop(page, root.locator(`sk-action-row[row-id="${rowId}"] button[part="trigger"]`)),
    );
  }
  expect(overviewStops).toEqual(
    ['wp-01', 'wp-02', 'wp-03', 'wp-04', 'wp-05', 'wp-06', 'wp-07', 'wp-08'].map((rowId) => ({
      outerTag: 'sk-action-row',
      outerRowId: rowId,
      innerTag: 'button',
      innerPart: 'trigger',
      id: null,
      href: null,
      longCode: false,
    })),
  );

  const detailRoot = await detail(page, 'detail-long-content');
  await resetKeyboardFocus(page);
  const detailStops = [
    await tabToVisibleStop(page, detailRoot.locator('a[href="#repository"]')),
    await tabToVisibleStop(page, detailRoot.locator('a[href="#mission"]')),
    await tabToVisibleStop(page, detailRoot.locator('[data-long-code]')),
  ];
  expect(detailStops).toEqual([
    {
      outerTag: 'a',
      outerRowId: null,
      innerTag: 'a',
      innerPart: null,
      id: null,
      href: '#repository',
      longCode: false,
    },
    {
      outerTag: 'a',
      outerRowId: null,
      innerTag: 'a',
      innerPart: null,
      id: null,
      href: '#mission',
      longCode: false,
    },
    {
      outerTag: 'pre',
      outerRowId: null,
      innerTag: 'pre',
      innerPart: null,
      id: null,
      href: null,
      longCode: true,
    },
  ]);
});

test('narrow overview uses a controlled native selector and keeps one supplied lane visible', async ({ page }) => {
  const root = await overview(page, 'narrow-overview', {
    width: 390,
    height: 844,
  });
  const select = root.getByRole('combobox', { name: 'Lane' });
  await expect(select.locator('option')).toHaveCount(5);
  await expect(select).toHaveValue('in-progress');
  await expect(root.locator('[data-lane-id]')).toHaveCount(1);
  await expect(root.locator('[data-lane-id="in-progress"]')).toHaveCount(1);

  await resetKeyboardFocus(page);
  expect(await tabToVisibleStop(page, select)).toEqual({
    outerTag: 'select',
    outerRowId: null,
    innerTag: 'select',
    innerPart: null,
    id: 'work-package-overview-narrow-lane',
    href: null,
    longCode: false,
  });
  await page.keyboard.press('d');
  await expect(select).toHaveValue('done');
  await expect(root.locator('[data-lane-intent-log]')).toHaveAttribute('data-count', '1');
  await expect(root.locator('[data-lane-intent-log]')).toHaveAttribute('data-lane-id', 'done');
  await expect(root).toHaveAttribute('data-visible-lane-id', 'in-progress');
  await expect(root.locator('[data-lane-id="in-progress"]')).toHaveCount(1);
  await expect(root.locator('sk-action-row[row-id="wp-02"]')).toHaveAttribute('selected', '');
  await expect(root).toHaveAttribute('data-selected-work-package-id', 'wp-02');
  expect(await tabToVisibleStop(page, root.locator('sk-action-row[row-id="wp-02"] button[part="trigger"]'))).toEqual({
    outerTag: 'sk-action-row',
    outerRowId: 'wp-02',
    innerTag: 'button',
    innerPart: 'trigger',
    id: null,
    href: null,
    longCode: false,
  });
  await expect(root.locator('[data-lane-intent-log]')).toHaveAttribute('data-count', '1');
  expect(await documentGeometry(page)).toEqual(expect.objectContaining({ clientWidth: 390 }));
  expect((await documentGeometry(page)).scrollWidth).toBeLessThanOrEqual(390);
});

test('detail preserves breadcrumb, direct-child passive checklist, facts, and supplied history order', async ({
  page,
}) => {
  const root = await detail(page, 'detail-populated');
  const breadcrumb = root.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumb.getByRole('link')).toHaveCount(2);
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('WP01');

  const checklist = root.locator('.sk-work-package-pattern__checklist');
  await expect(checklist).toHaveRole('list');
  await expect(checklist.locator(':scope > sk-check-bullet')).toHaveCount(3);
  await expect(checklist.locator(':scope > li')).toHaveCount(0);
  expect(
    await checklist.locator(':scope > sk-check-bullet').evaluateAll((items) =>
      items.map((item) => ({
        role: item.getAttribute('role'),
        tabindex: item.getAttribute('tabindex'),
        state: item.getAttribute('state'),
      })),
    ),
  ).toEqual([
    { role: 'listitem', tabindex: null, state: 'complete' },
    { role: 'listitem', tabindex: null, state: 'complete' },
    { role: 'listitem', tabindex: null, state: 'pending' },
  ]);
  await expect(checklist.getByRole('checkbox')).toHaveCount(0);
  await expect(root).toHaveAttribute('data-subtask-completed', '2');
  await expect(root).toHaveAttribute('data-subtask-total', '3');
  await expect(root).toHaveAttribute('data-subtask-percentage', '67');

  await expect(root.locator('.sk-facts')).toHaveCount(1);
  await expect(root.locator('.sk-facts > dt')).toHaveCount(4);
  await expect(root.locator('.sk-facts > dd')).toHaveCount(4);
  expect(JSON.parse((await root.getAttribute('data-event-order')) ?? '[]')).toEqual([
    'event-created',
    'event-started',
    'event-review',
  ]);
  await expect(root.locator('.sk-event-timeline > li')).toHaveCount(3);
});

test('detail empty, retention, and long-content states make absence and overflow explicit', async ({ page }) => {
  const noSubtasks = await detail(page, 'detail-no-subtasks');
  await expect(noSubtasks.locator('[data-no-subtasks].sk-empty-state--inline')).toHaveCount(1);
  await expect(noSubtasks.locator('sk-check-bullet')).toHaveCount(0);

  const absentPrompt = await detail(page, 'detail-absent-prompt');
  await expect(absentPrompt.locator('[data-absent-prompt].sk-empty-state--inline')).toHaveCount(1);
  await expect(absentPrompt.locator('[data-work-package-prompt]')).toHaveCount(0);

  const unavailable = await detail(page, 'detail-history-unavailable');
  await expect(unavailable.locator('sk-notice[data-history-unavailable]')).toHaveCount(1);
  await expect(unavailable.locator('.sk-event-timeline')).toHaveCount(0);

  const long = await detail(page, 'detail-long-content', {
    width: 390,
    height: 844,
  });
  await expect(long.locator('.sk-event-timeline > li')).toHaveCount(20);
  const code = long.locator('[data-long-code]');
  await expect(code).toBeVisible();
  const geometry = await code.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    overflowX: getComputedStyle(element).overflowX,
  }));
  expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
  expect(geometry.overflowX).toMatch(/auto|scroll/);
  await expect(code).toHaveAttribute('role', 'region');
  await expect(code).toHaveAttribute('tabindex', '0');
  await code.focus();
  await expect(code).toBeFocused();
  expect((await documentGeometry(page)).scrollWidth).toBeLessThanOrEqual(390);
});

test('dark and LightMode preserve identical semantic data with a real token delta', async ({ page }) => {
  const signatures: Array<Readonly<{ text: string; ids: string | null; surface: string }>> = [];
  for (const id of ['default', 'light-mode'] as const) {
    const root = await overview(page, id);
    signatures.push(
      await root.evaluate((element) => ({
        text: element.innerText.replace(/\s+/g, ' ').trim(),
        ids: element.getAttribute('data-work-package-ids'),
        surface: getComputedStyle(element).getPropertyValue('--sk-surface-page').trim(),
      })),
    );
  }
  expect(signatures[0]?.text).toBe(signatures[1]?.text);
  expect(signatures[0]?.ids).toBe(signatures[1]?.ids);
  expect(signatures[0]?.surface).not.toBe(signatures[1]?.surface);

  const detailSignatures: Array<Readonly<{ text: string; order: string | null }>> = [];
  for (const id of ['detail-populated', 'detail-light-mode'] as const) {
    const root = await detail(page, id);
    detailSignatures.push(
      await root.evaluate((element) => ({
        text: element.innerText.replace(/\s+/g, ' ').trim(),
        order: element.getAttribute('data-event-order'),
      })),
    );
  }
  expect(detailSignatures[0]).toEqual(detailSignatures[1]);
});

test('desktop, 640px reflow, and narrow views contain the document and visible focus', async ({ page }) => {
  for (const [id, viewport] of [
    ['default', { width: 1280, height: 900 }],
    ['narrow-overview', { width: 640, height: 900 }],
    ['narrow-overview', { width: 390, height: 844 }],
  ] as const) {
    const root = await overview(page, id, viewport);
    const geometry = await documentGeometry(page);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
    const focusTarget =
      id === 'default'
        ? root.locator('sk-action-row button[part="trigger"]').first()
        : root.getByRole('combobox', { name: 'Lane' });
    await focusTarget.focus();
    await expect(focusTarget).toBeFocused();
    const focusBox = await focusTarget.boundingBox();
    expect(focusBox).not.toBeNull();
    expect(focusBox!.x).toBeGreaterThanOrEqual(0);
    expect(focusBox!.x + focusBox!.width).toBeLessThanOrEqual(viewport.width);
  }

  const narrowDetail = await detail(page, 'detail-narrow', {
    width: 390,
    height: 844,
  });
  const tracks = await narrowDetail
    .locator('.sk-work-package-pattern__detail-grid')
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/));
  expect(tracks).toHaveLength(1);
  const geometry = await documentGeometry(page);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});
