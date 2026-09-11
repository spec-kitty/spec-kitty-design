import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { getViolations, injectAxe } from 'axe-playwright';

const STORY_IDS = [
  'default',
  'light-mode',
  'narrow',
  'scale-50-w-ps',
  'controlled-interactions',
  'empty-partial-data',
] as const;

const loadStory = async (
  page: Page,
  id: (typeof STORY_IDS)[number],
  width = 1440,
  height = 1000,
  args = '',
): Promise<Locator> => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=patterns-team-overview--${id}&viewMode=story${args ? `&args=${args}` : ''}`);
  const root = page.locator('[data-team-overview-pattern]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root.locator('sk-app-shell')).toBeVisible();
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  return root;
};

type IntentRecord = Readonly<{
  count: number;
  detail: Readonly<Record<string, string>>;
  bubbles: boolean;
  composed: boolean;
  cancelable: boolean;
}>;

const readIntentRecords = async (root: Locator): Promise<Readonly<Record<string, IntentRecord>>> =>
  root.locator('[data-intent-log]').evaluate((element) => ({
    row: JSON.parse(element.getAttribute('data-row-event') ?? '{}') as IntentRecord,
    bar: JSON.parse(element.getAttribute('data-bar-event') ?? '{}') as IntentRecord,
    route: JSON.parse(element.getAttribute('data-route-event') ?? '{}') as IntentRecord,
  }));

const expectedIntentRecords = (): Readonly<Record<string, IntentRecord>> => ({
  row: { count: 1, detail: { id: 'recent-dashboard-polish' }, bubbles: true, composed: true, cancelable: false },
  bar: { count: 1, detail: { id: 'aug-18' }, bubbles: true, composed: true, cancelable: false },
  route: { count: 1, detail: { routeId: 'progress-review' }, bubbles: true, composed: true, cancelable: false },
});

const axeIsClean = async (page: Page, storyId: string): Promise<void> => {
  await injectAxe(page);
  let violations: Awaited<ReturnType<typeof getViolations>> = [];
  await expect
    .poll(async () => {
      try {
        violations = await getViolations(page, 'body', {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        });
        return 'ready';
      } catch (error) {
        if (String(error).includes('Axe is already running')) return 'busy';
        throw error;
      }
    })
    .toBe('ready');
  expect(violations, `${storyId} must have zero WCAG 2.1 AA violations`).toEqual([]);
};

test('source keeps the pattern outside the public element and application boundaries', () => {
  const source = readFileSync(
    'packages/elements/src/patterns/team-overview.stories.ts',
    'utf8',
  );

  expect(source).not.toMatch(/<sk-team-overview(?:\s|>)/);
  expect(source).not.toMatch(/customElements\.define\s*\(/);
  expect(source).not.toMatch(/shadowRoot/);
  expect(source).not.toMatch(/from\s+['"][^'"]*team-kitty/i);
  expect(source).not.toMatch(/\b(?:fetch|setTimeout|setInterval)\s*\(/);
  expect(source).not.toMatch(/\bnew\s+Date\s*\(/);
  expect(source).toContain('deepFreeze');
  expect(source).toContain('deriveDelivery');
  expect(source).toContain('deriveFlow');
  expect(source).toContain('deriveOperationalSections');
  expect(source).toContain('PUBLIC_CONTRACT_WIRING_PROOF');
  expect(source).toContain('dedicated Playwright tests prove real pointer/keyboard origin');
  expect(source).toMatch(/new CustomEvent<ActionRowActivateDetail>\('sk-action-row-activate'/);
  expect(source).toMatch(/new CustomEvent<BarChartSelectDetail>\('sk-bar-chart-select'/);
  expect(source).toMatch(/new CustomEvent<TransitionMatrixSelectDetail>\('sk-transition-matrix-select'/);
});

test('approved story derives exact delivery and independent flow totals from one frozen fixture', async ({
  page,
}) => {
  const root = await loadStory(page, 'default');
  const proof = await root.evaluate((element) => ({ ...element.dataset }));

  expect(proof['fixtureDeeplyFrozen']).toBe('true');
  expect(proof['investmentTotal']).toBe('1840');
  expect(proof['unattributedTotal']).toBe('166');
  expect(proof['attributedTotal']).toBe('1674');
  expect(proof['bucketTotal']).toBe('1674');
  expect(proof['attributionPercent']).toBe('91');
  expect(proof['moveTotal']).toBe('62');
  expect(proof['openTotal']).toBe('50');
  expect(JSON.parse(proof['columns'] ?? '[]')).toEqual([
    'Tue 1',
    'Wed 2',
    'Thu 3',
    'Today · Fri 4',
  ]);
  expect(JSON.parse(proof['legendTones'] ?? '[]')).toEqual([
    'forward',
    'completed',
    'blocked',
    'recovery',
    'backward',
  ]);

  const stages = await root.locator('sk-evidence-chain').evaluate((element) =>
    (element as HTMLElement & { stages: ReadonlyArray<Record<string, unknown>> }).stages,
  );
  expect(stages.map(({ displayValue }) => displayValue)).toEqual([
    '€1,840',
    '42 WPs',
    '6 missions',
    '2 verified',
  ]);
  expect(stages.map(({ annotation }) => annotation)).toEqual([
    '€166 unattributed',
    '34 first pass',
    'Production evidence',
    '4 awaiting evidence',
  ]);

  const series = await root.locator('sk-bar-chart').evaluate((element) =>
    (element as HTMLElement & { series: ReadonlyArray<{ value: number }> }).series,
  );
  expect(series.map(({ value }) => value)).toEqual([320, 410, 340, 604]);
  expect(series.reduce((sum, { value }) => sum + value, 0)).toBe(1674);
  await expect(root.getByRole('list', { name: 'Return chart legend' }).getByRole('listitem')).toHaveCount(2);

  const matrix = await root.locator('sk-transition-matrix').evaluate((element) => {
    const typed = element as HTMLElement & {
      columns: ReadonlyArray<{ label: string }>;
      routes: ReadonlyArray<{ label: string; tone: string; values: Readonly<Record<string, number>> }>;
    };
    return { columns: typed.columns, routes: typed.routes };
  });
  expect(matrix.routes.reduce(
    (sum, route) => sum + Object.values(route.values).reduce((routeSum, value) => routeSum + value, 0),
    0,
  )).toBe(62);
  expect(matrix.routes.every(({ label }) => label.includes(' → '))).toBe(true);
  expect(matrix.routes.find(({ tone }) => tone === 'recovery')?.label).toBe('Blocked → In progress');
  expect(matrix.routes.find(({ tone }) => tone === 'backward')?.label).toContain('(backward)');

  await expect(root.getByText('91% spend attributed')).toHaveCount(1);
  await expect(root.getByText('62 moves · last 72 hours')).toHaveCount(1);
  await expect(root.getByText('50 open WPs')).toHaveCount(1);
  await expect(root.getByRole('button', { name: 'View 50 WPs' })).toHaveCount(1);
  await expect(root.locator('[data-visual-region="delivery-evidence"]')).toContainText('91% spend attributed');

  const outcomes = root.locator('.sk-pattern-overview__outcome-list > li');
  await expect(outcomes).toHaveCount(3);
  await expect(outcomes).toContainText([
    'Local setup under 10 min',
    'Faster team-status assembly',
    'Blocked work visible',
  ]);
  await expect(root.getByText('View evidence →', { exact: true })).toHaveCount(1);
  await expect(root.locator('[data-intent-log]')).toBeHidden();
});

test('composition uses the required public elements and preserves shell/feed integrity', async ({ page }) => {
  const root = await loadStory(page, 'default');
  const tags = await root.locator('*').evaluateAll((elements) =>
    [...new Set(elements
      .map((element) => element.tagName.toLowerCase())
      .filter((tag) => tag.startsWith('sk-')))].sort(),
  );
  expect(tags).toEqual([
    'sk-action-row',
    'sk-app-shell',
    'sk-bar-chart',
    'sk-button',
    'sk-card',
    'sk-context-sidebar',
    'sk-entity-marker',
    'sk-evidence-chain',
    'sk-grid',
    'sk-metric',
    'sk-nav-pill',
    'sk-page-header',
    'sk-personal-rail',
    'sk-pill-tag',
    'sk-section-header',
    'sk-status-indicator',
    'sk-transition-matrix',
  ]);

  const rail = root.locator('sk-personal-rail');
  await expect(rail.locator('[data-account-identity]')).toHaveCount(1);
  expect(await rail.locator(':scope > [slot]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('slot')),
  )).toEqual(['primary', 'primary', 'primary', 'utilities', 'account', 'logout']);

  const sections = root.locator('[data-operational-section]');
  await expect(sections).toHaveCount(3);
  await expect(sections.locator(':scope > ul')).toHaveCount(3);
  await expect(sections.locator(':scope > ul > li')).toHaveCount(4);

  const rows = sections.locator('sk-action-row');
  await expect(rows).toHaveCount(4);
  const firstSlots = await rows.first().locator(':scope > [slot]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('slot')),
  );
  expect(firstSlots).toEqual(['marker', 'title', 'reference', 'tags', 'tags', 'metadata']);

  const references = await rows.locator('code[slot="reference"]').allTextContents();
  expect(references).toContain('17bd28375d5f');
  expect(references.every((reference) => reference === reference.toLowerCase())).toBe(true);

  const fingerprints = await rows.evaluateAll((elements) => elements.map((element) => ({
    id: element.getAttribute('row-id'),
    text: element.textContent?.replace(/\s+/g, ' ').trim(),
  })));
  expect(new Set(fingerprints.map(({ text }) => text)).size).toBe(fingerprints.length);

  const context = root.locator('sk-context-sidebar');
  await expect(context.getByRole('navigation', { name: 'Team sections' })).toBeVisible();
  const contextLinks = context.locator('a.sk-pattern-overview__context-link');
  await expect(contextLinks).toHaveCount(4);
  const navigationLayout = await contextLinks.evaluateAll((links) => links.map((link) => {
    const box = link.getBoundingClientRect();
    return {
      top: box.top,
      bottom: box.bottom,
      left: box.left,
      right: box.right,
      clipped: link.scrollWidth > link.clientWidth,
    };
  }));
  let priorBottom = Number.NEGATIVE_INFINITY;
  for (const item of navigationLayout) {
    expect(item.clipped).toBe(false);
    expect(item.top).toBeGreaterThanOrEqual(priorBottom);
    priorBottom = item.bottom;
  }
  const contextBounds = await context.locator('[part~="sidebar"]').boundingBox();
  expect(contextBounds).not.toBeNull();
  for (const item of navigationLayout) {
    expect(item.left).toBeGreaterThanOrEqual(contextBounds?.x ?? 0);
    expect(item.right).toBeLessThanOrEqual((contextBounds?.x ?? 0) + (contextBounds?.width ?? 0));
  }

  const warning = root.locator('[data-non-link-warning]');
  await expect(warning).toHaveCount(1);
  await expect(warning).not.toHaveAttribute('href');
  await expect(warning).not.toHaveAttribute('role', 'link');
  expect(await warning.evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe('none');
  const attentionStatuses = await root.locator('sk-status-indicator[tone="attention"]').allTextContents();
  const attentionPills = await root.locator('sk-pill-tag[variant="yellow"]').allTextContents();
  const attentionMetrics = await root.locator('sk-metric[tone="attention"]').allTextContents();
  const attentionStages = await root.locator('sk-evidence-chain').evaluate((element) =>
    (element as HTMLElement & { stages: ReadonlyArray<{ label: string; tone: string }> })
      .stages.filter(({ tone }) => tone === 'attention').map(({ label }) => label),
  );
  expect({ attentionStatuses, attentionPills, attentionMetrics, attentionStages }).toEqual({
    attentionStatuses: ['Pending'],
    attentionPills: ['1 mission off default branch'],
    attentionMetrics: [],
    attentionStages: [],
  });
  await expect(root.locator('sk-metric').filter({ hasText: 'Blocked' })).toHaveAttribute('tone', 'neutral');
});

test('desktop Flow exposes every date cell while keeping Current usable', async ({ page }) => {
  for (const width of [1280, 1440]) {
    const root = await loadStory(page, 'default', width, 1000);
    const flowCard = root.locator('#flow-health > sk-card');
    const flowLayout = root.locator('.sk-pattern-overview__flow-layout');
    const matrix = root.locator('sk-transition-matrix');
    const scroller = matrix.locator('[part~="scroller"]');
    const scrollGeometry = await scroller.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(scrollGeometry.scrollWidth, `${width}px must expose the complete matrix`).toBeLessThanOrEqual(
      scrollGeometry.clientWidth + 1,
    );

    const dateHeaders = matrix.locator('thead th:nth-child(n+2):nth-child(-n+5)');
    await expect(dateHeaders).toHaveText(['Tue 1', 'Wed 2', 'Thu 3', 'Today · Fri 4']);
    const cells = matrix.locator('tbody tr[data-route-id] td:not([part~="total"])');
    await expect(cells).toHaveCount(24);
    const scrollerBox = await scroller.boundingBox();
    expect(scrollerBox).not.toBeNull();
    const exposedItems = matrix.locator(
      'thead th:nth-child(n+2):nth-child(-n+5), tbody tr[data-route-id] td:not([part~="total"])',
    );
    for (const item of await exposedItems.all()) {
      const box = await item.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.x ?? 0).toBeGreaterThanOrEqual((scrollerBox?.x ?? 0) - 1);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
        (scrollerBox?.x ?? 0) + (scrollerBox?.width ?? 0) + 1,
      );
    }

    const current = root.locator('.sk-pattern-overview__current');
    await expect(current.getByText('50 open WPs')).toBeVisible();
    await expect(current.getByRole('button', { name: 'View 50 WPs' })).toBeVisible();
    const layoutBox = await flowLayout.boundingBox();
    const matrixBox = await matrix.boundingBox();
    const currentBox = await current.boundingBox();
    const flowCardBox = await flowCard.boundingBox();
    expect(layoutBox).not.toBeNull();
    expect(matrixBox).not.toBeNull();
    expect(currentBox).not.toBeNull();
    expect(flowCardBox).not.toBeNull();
    expect(matrixBox?.x ?? 0).toBeGreaterThanOrEqual((layoutBox?.x ?? 0) - 1);
    expect((matrixBox?.x ?? 0) + (matrixBox?.width ?? 0)).toBeLessThanOrEqual((currentBox?.x ?? 0) + 1);
    expect(currentBox?.y ?? 0).toBeLessThanOrEqual((matrixBox?.y ?? 0) + 1);
    expect((currentBox?.x ?? 0) + (currentBox?.width ?? 0)).toBeLessThanOrEqual(
      (layoutBox?.x ?? 0) + (layoutBox?.width ?? 0) + 1,
    );
    expect(flowCardBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(650);

    if (width === 1280) {
      const metrics = current.locator('sk-metric');
      await expect(metrics).toHaveCount(4);
      const metricBoxes = await metrics.evaluateAll((elements) => elements.map((element) => {
        const box = element.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y), width: box.width, height: box.height };
      }));
      expect(metricBoxes[0]?.y).toBe(metricBoxes[1]?.y);
      expect(metricBoxes[2]?.y).toBe(metricBoxes[3]?.y);
      expect(metricBoxes[0]?.y).toBeLessThan(metricBoxes[2]?.y ?? 0);
      expect(metricBoxes[0]?.x).toBe(metricBoxes[2]?.x);
      expect(metricBoxes[1]?.x).toBe(metricBoxes[3]?.x);
      expect(metricBoxes[0]?.x).toBeLessThan(metricBoxes[1]?.x ?? 0);
      expect(metricBoxes.every(({ width: metricWidth, height }) => metricWidth > 0 && height > 0)).toBe(true);
    }
  }
});

test('real pointer intent stays controlled until Storybook args rerender each child', async ({ page }) => {
  let root = await loadStory(page, 'controlled-interactions');
  await expect(root).toHaveAttribute('data-play-proof', 'passed');
  await expect(root).toHaveAttribute('data-play-proof-layer', 'public-contract-wiring');
  expect(Object.values(await readIntentRecords(root)).map(({ count }) => count)).toEqual([0, 0, 0]);

  let selectedRow = root.locator('sk-action-row[row-id="flight-team-landing"]');
  let requestedRow = root.locator('sk-action-row[row-id="recent-dashboard-polish"]');
  let chart = root.locator('sk-bar-chart');
  let matrix = root.locator('sk-transition-matrix');
  await expect(selectedRow.locator('[part~="row"]')).toHaveAttribute('aria-current', 'true');
  await expect(requestedRow.locator('[part~="row"]')).not.toHaveAttribute('aria-current', 'true');

  await requestedRow.getByRole('button').click();
  await chart.getByRole('button', { name: '€410 Aug 18' }).click();
  await matrix.getByRole('row', { name: /In progress → For review/ }).click();
  expect(await readIntentRecords(root)).toEqual(expectedIntentRecords());

  await expect(selectedRow.locator('[part~="row"]')).toHaveAttribute('aria-current', 'true');
  await expect(requestedRow.locator('[part~="row"]')).not.toHaveAttribute('aria-current', 'true');
  await expect(chart.getByRole('button', { name: '€320 Aug 11' })).toHaveAttribute('aria-pressed', 'true');
  await expect(chart.getByRole('button', { name: '€410 Aug 18' })).toHaveAttribute('aria-pressed', 'false');
  await expect(matrix.getByRole('row', { name: /Planned → In progress/ })).toHaveAttribute(
    'aria-selected', 'true',
  );
  await expect(matrix.getByRole('row', { name: /In progress → For review/ })).toHaveAttribute(
    'aria-selected', 'false',
  );

  root = await loadStory(
    page,
    'controlled-interactions',
    1440,
    1000,
    'selectedRowId:recent-dashboard-polish;selectedBarId:aug-18;selectedRouteId:progress-review',
  );
  await expect(root).toHaveAttribute('data-play-proof', 'passed');
  selectedRow = root.locator('sk-action-row[row-id="flight-team-landing"]');
  requestedRow = root.locator('sk-action-row[row-id="recent-dashboard-polish"]');
  chart = root.locator('sk-bar-chart');
  matrix = root.locator('sk-transition-matrix');
  await expect(selectedRow.locator('[part~="row"]')).not.toHaveAttribute('aria-current', 'true');
  await expect(requestedRow.locator('[part~="row"]')).toHaveAttribute('aria-current', 'true');
  await expect(chart.getByRole('button', { name: '€410 Aug 18' })).toHaveAttribute('aria-pressed', 'true');
  await expect(matrix.getByRole('row', { name: /In progress → For review/ })).toHaveAttribute(
    'aria-selected', 'true',
  );
});

test('real keyboard intent carries exact non-cancelable child event contracts', async ({ page }) => {
  const root = await loadStory(page, 'controlled-interactions');
  expect(Object.values(await readIntentRecords(root)).map(({ count }) => count)).toEqual([0, 0, 0]);
  const targets = [
    root.locator('sk-action-row[row-id="recent-dashboard-polish"]').getByRole('button'),
    root.locator('sk-bar-chart').getByRole('button', { name: '€410 Aug 18' }),
    root.locator('sk-transition-matrix').getByRole('row', { name: /In progress → For review/ }),
  ];
  for (const target of targets) {
    await target.focus();
    await page.keyboard.press('Enter');
  }
  expect(await readIntentRecords(root)).toEqual(expectedIntentRecords());
});

test('dark and light stories expose identical content and selector signatures', async ({ page }) => {
  let root = await loadStory(page, 'default');
  const dark = {
    signature: await root.getAttribute('data-semantic-signature'),
    text: (await root.innerText()).replace(/\s+/g, ' ').trim(),
    surface: await root.evaluate((element) => getComputedStyle(element).backgroundColor),
  };

  root = await loadStory(page, 'light-mode');
  const light = {
    signature: await root.getAttribute('data-semantic-signature'),
    text: (await root.innerText()).replace(/\s+/g, ' ').trim(),
    surface: await root.evaluate((element) => getComputedStyle(element).backgroundColor),
  };

  expect(light.signature).toBe(dark.signature);
  expect(light.text).toBe(dark.text);
  expect(light.surface).not.toBe(dark.surface);
});

test('fixed labels and selector output remain stable across timezones', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('Playwright baseURL is required for isolated Storybook runs');
  const signatures: string[] = [];
  const labels: string[][] = [];
  for (const timezoneId of ['UTC', 'America/Los_Angeles']) {
    const context = await browser.newContext({ timezoneId, baseURL });
    const page = await context.newPage();
    await page.goto('/iframe.html?id=patterns-team-overview--default&viewMode=story');
    const root = page.locator('[data-team-overview-pattern]');
    await root.waitFor({ state: 'visible', timeout: 20000 });
    signatures.push(await root.getAttribute('data-semantic-signature') ?? '');
    labels.push(JSON.parse(await root.getAttribute('data-columns') ?? '[]'));
    await context.close();
  }

  expect(signatures[1]).toBe(signatures[0]);
  expect(labels[0]).toEqual(['Tue 1', 'Wed 2', 'Thu 3', 'Today · Fri 4']);
  expect(labels[1]).toEqual(labels[0]);
});

test('390 by 844 story preserves region order, reachability, and page overflow ownership', async ({ page }) => {
  const root = await loadStory(page, 'narrow', 390, 844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  const regions = root.locator(
    'sk-personal-rail, sk-context-sidebar, sk-page-header, [data-page-content]',
  );
  const geometry = await regions.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { top: box.top, left: box.left, right: box.right, width: box.width, height: box.height };
  }));
  expect(geometry.map(({ top }) => Math.round(top))).toEqual(
    [...geometry.map(({ top }) => Math.round(top))].sort((left, right) => left - right),
  );
  for (const box of geometry) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(390);
  }

  for (const control of await root.getByRole('link').all()) {
    await expect(control).toBeVisible();
  }
  for (const control of await root.getByRole('button').all()) {
    await expect(control).toBeVisible();
  }

  const rail = root.locator('sk-personal-rail');
  const context = root.locator('sk-context-sidebar');
  const contextLinks = context.locator('a.sk-pattern-overview__context-link');
  const expectedTabOrder = [
    rail.getByRole('link', { name: 'Overview' }),
    rail.getByRole('link', { name: 'Work' }),
    rail.getByRole('link', { name: 'Connectors' }),
    rail.getByRole('button', { name: 'Notifications' }),
    rail.getByRole('link', { name: 'Collaborative Demo account' }),
    rail.getByRole('button', { name: 'Log out' }),
    contextLinks.nth(0),
    contextLinks.nth(1),
    contextLinks.nth(2),
    contextLinks.nth(3),
    context.locator('sk-button').getByRole('button', { name: 'Manage team' }),
    root.getByRole('button', { name: 'Refresh evidence' }),
  ];
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (const expectedControl of expectedTabOrder) {
    await page.keyboard.press('Tab');
    await expect(expectedControl).toBeFocused();
  }

  const childScrollers = [
    root.locator('sk-bar-chart').locator('[part~="plot"]'),
    root.locator('sk-transition-matrix').locator('[part~="scroller"]'),
  ];
  for (const scroller of childScrollers) {
    const evidence = await scroller.evaluate((element) => {
      const start = element.scrollLeft;
      const overflow = getComputedStyle(element).overflowX;
      element.scrollLeft = element.scrollWidth;
      const end = element.scrollLeft;
      element.scrollLeft = start;
      return {
        overflow,
        ownsOverflow: element.scrollWidth > element.clientWidth,
        movesWhenOverflowing: element.scrollWidth <= element.clientWidth || end > start,
      };
    });
    expect(evidence.overflow).toBe('auto');
    expect(evidence.movesWhenOverflowing).toBe(true);
  }
  expect(await childScrollers[1].evaluate(
    (element) => element.scrollWidth > element.clientWidth,
  )).toBe(true);
});

test('Scale50WPs keeps 50 items separate from a six-route aggregate matrix', async ({ page }) => {
  let root = await loadStory(page, 'default');
  const defaultMatrixWidth = await root.locator('sk-transition-matrix').evaluate(
    (element) => element.getBoundingClientRect().width,
  );
  root = await loadStory(page, 'scale-50-w-ps');
  const matrix = root.locator('sk-transition-matrix');
  await expect(root.getByText('50 open WPs')).toHaveCount(1);
  await expect(root.getByText('62 moves · last 72 hours')).toHaveCount(1);
  await expect(root.locator('[data-scale-proof]')).toContainText('six aggregate routes and 24 time cells');
  expect(await matrix.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(
    defaultMatrixWidth,
  );

  const shape = await matrix.evaluate((element) => {
    const typed = element as HTMLElement & {
      columns: ReadonlyArray<unknown>;
      routes: ReadonlyArray<unknown>;
    };
    return { columns: typed.columns.length, routes: typed.routes.length };
  });
  expect(shape).toEqual({ columns: 4, routes: 6 });

  const routeRows = matrix.locator('tbody tr[data-route-id]');
  await expect(routeRows).toHaveCount(6);
  const rowRects = await routeRows.evaluateAll((rows) => rows.map((row) => {
    const box = row.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
  }));
  for (let index = 0; index < rowRects.length - 1; index += 1) {
    expect(rowRects.at(index)?.bottom).toBeLessThanOrEqual((rowRects.at(index + 1)?.top ?? 0) + 1);
  }

  const cells = routeRows.locator('td:not([part~="total"])');
  await expect(cells).toHaveCount(24);
  for (const cell of await cells.all()) {
    const evidence = await cell.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const rowBox = element.parentElement?.getBoundingClientRect();
      const headerIds = element.getAttribute('headers')?.trim().split(/\s+/) ?? [];
      return {
        headers: headerIds.length,
        allHeadersResolve: headerIds.every(
          (id) => (element.getRootNode() as Document | ShadowRoot).getElementById(id) !== null,
        ),
        width: box.width,
        height: box.height,
        ownedByRow: rowBox !== undefined
          && box.top >= rowBox.top - 1
          && box.bottom <= rowBox.bottom + 1
          && box.left >= rowBox.left - 1
          && box.right <= rowBox.right + 1,
      };
    });
    expect(evidence.headers).toBe(2);
    expect(evidence.allHeadersResolve).toBe(true);
    expect(evidence.ownedByRow).toBe(true);
    expect(evidence.width).toBeGreaterThan(0);
    expect(evidence.height).toBeGreaterThan(0);
  }
});

test('partial story labels incomplete evidence without inventing links or full coverage', async ({ page }) => {
  const root = await loadStory(page, 'empty-partial-data');
  expect(await root.getAttribute('data-coverage-mode')).toBe('partial');
  expect(await root.getAttribute('data-bucket-total')).toBe('730');
  await expect(root.getByText('Partial coverage · €730 of €1,674 attributed')).toHaveCount(1);
  await expect(root.getByText('Outcome evidence pending')).toHaveCount(1);
  await expect(root.getByText('No recent activity is available.')).toHaveCount(1);
  await expect(root.getByRole('link', { name: /pending|unavailable|missing/i })).toHaveCount(0);
});

for (const storyId of STORY_IDS) {
  test(`${storyId} is non-empty and axe-clean`, async ({ page }) => {
    const root = await loadStory(page, storyId, storyId === 'narrow' ? 390 : 1440, 1000);
    await expect(root).not.toBeEmpty();
    await axeIsClean(page, storyId);
  });
}
