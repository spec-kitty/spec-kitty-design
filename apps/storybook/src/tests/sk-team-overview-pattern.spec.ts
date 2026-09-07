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
): Promise<Locator> => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=patterns-team-overview--${id}&viewMode=story`);
  const root = page.locator('[data-team-overview-pattern]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root.locator('sk-app-shell')).toBeVisible();
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  return root;
};

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

  const outcomes = root.locator('.sk-pattern-overview__outcome-list > li');
  await expect(outcomes).toHaveCount(3);
  await expect(outcomes).toContainText([
    'Local setup under 10 min',
    'Faster team-status assembly',
    'Blocked work visible',
  ]);
  await expect(root.getByText('View evidence →', { exact: true })).toHaveCount(1);
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

  const warning = root.locator('[data-non-link-warning]');
  await expect(warning).toHaveCount(1);
  await expect(warning).not.toHaveAttribute('href');
  await expect(warning).not.toHaveAttribute('role', 'link');
  expect(await warning.evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe('none');
  await expect(root.locator('[data-attention-meaning]')).toHaveCount(2);
});

test('controlled story emits exact row, bar, and route intent without retaining requested state', async ({
  page,
}) => {
  const root = await loadStory(page, 'controlled-interactions');
  await expect(root).toHaveAttribute('data-play-proof', 'passed');

  const log = root.locator('[data-intent-log]');
  const records = await log.evaluate((element) => ({
    row: JSON.parse(element.getAttribute('data-row-event') ?? '{}'),
    bar: JSON.parse(element.getAttribute('data-bar-event') ?? '{}'),
    route: JSON.parse(element.getAttribute('data-route-event') ?? '{}'),
  }));
  expect(records).toEqual({
    row: {
      count: 1,
      detail: { id: 'flight-team-landing' },
      bubbles: true,
      composed: true,
      cancelable: false,
    },
    bar: {
      count: 1,
      detail: { id: 'aug-18' },
      bubbles: true,
      composed: true,
      cancelable: false,
    },
    route: {
      count: 1,
      detail: { routeId: 'progress-review' },
      bubbles: true,
      composed: true,
      cancelable: false,
    },
  });

  const row = root.locator('sk-action-row[row-id="flight-team-landing"]');
  const chart = root.locator('sk-bar-chart');
  const matrix = root.locator('sk-transition-matrix');
  expect(await row.evaluate((element) => (element as HTMLElement & { selected: boolean }).selected)).toBe(false);
  expect(await chart.evaluate((element) => (element as HTMLElement & { selectedId: string }).selectedId)).toBe('aug-11');
  expect(await matrix.evaluate(
    (element) => (element as HTMLElement & { selectedRouteId?: string }).selectedRouteId,
  )).toBe('planned-progress');

  await row.getByRole('button').click();
  await chart.getByRole('button', { name: '€410 Aug 18' }).click();
  await matrix.getByRole('row', { name: /In progress → For review/ }).click();
  expect(await log.evaluate((element) => ({
    row: JSON.parse(element.getAttribute('data-row-event') ?? '{}').count,
    bar: JSON.parse(element.getAttribute('data-bar-event') ?? '{}').count,
    route: JSON.parse(element.getAttribute('data-route-event') ?? '{}').count,
  }))).toEqual({ row: 2, bar: 2, route: 2 });
  expect(await row.evaluate((element) => (element as HTMLElement & { selected: boolean }).selected)).toBe(false);
  expect(await chart.evaluate((element) => (element as HTMLElement & { selectedId: string }).selectedId)).toBe('aug-11');
  expect(await matrix.evaluate(
    (element) => (element as HTMLElement & { selectedRouteId?: string }).selectedRouteId,
  )).toBe('planned-progress');

  await row.evaluate(async (element) => {
    const typed = element as HTMLElement & { selected: boolean; updateComplete: Promise<unknown> };
    typed.selected = true;
    await typed.updateComplete;
  });
  await chart.evaluate(async (element) => {
    const typed = element as HTMLElement & { selectedId: string; updateComplete: Promise<unknown> };
    typed.selectedId = 'aug-18';
    await typed.updateComplete;
  });
  await matrix.evaluate(async (element) => {
    const typed = element as HTMLElement & { selectedRouteId?: string; updateComplete: Promise<unknown> };
    typed.selectedRouteId = 'progress-review';
    await typed.updateComplete;
  });

  await expect(row.locator('[part~="row"]')).toHaveAttribute('aria-current', 'true');
  await expect(chart.getByRole('button', { name: '€410 Aug 18' })).toHaveAttribute('aria-pressed', 'true');
  await expect(matrix.getByRole('row', { name: /In progress → For review/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('keyboard activation emits once through each child contract', async ({ page }) => {
  const root = await loadStory(page, 'controlled-interactions');
  const log = root.locator('[data-intent-log]');

  const exercise = async (target: Locator, attribute: string): Promise<void> => {
    const before = Number(JSON.parse(await log.getAttribute(attribute) ?? '{}').count ?? 0);
    await target.focus();
    await page.keyboard.press('Enter');
    await expect.poll(async () =>
      Number(JSON.parse(await log.getAttribute(attribute) ?? '{}').count ?? 0),
    ).toBe(before + 1);
  };

  await exercise(
    root.locator('sk-action-row[row-id="flight-team-landing"]').getByRole('button'),
    'data-row-event',
  );
  await exercise(root.locator('sk-bar-chart').getByRole('button', { name: '€410 Aug 18' }), 'data-bar-event');
  await exercise(
    root.locator('sk-transition-matrix').getByRole('row', { name: /In progress → For review/ }),
    'data-route-event',
  );
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

test('fixed labels and selector output remain stable across timezones', async ({ browser }) => {
  const signatures: string[] = [];
  const labels: string[][] = [];
  for (const timezoneId of ['UTC', 'America/Los_Angeles']) {
    const context = await browser.newContext({ timezoneId });
    const page = await context.newPage();
    await page.goto('http://localhost:6006/iframe.html?id=patterns-team-overview--default&viewMode=story');
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
    await expect(control).toBeAttached();
  }
  for (const control of await root.getByRole('button').all()) {
    await expect(control).toBeAttached();
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
  const root = await loadStory(page, 'scale-50-w-ps');
  const matrix = root.locator('sk-transition-matrix');
  await expect(root.getByText('50 open WPs')).toHaveCount(1);
  await expect(root.getByText('62 moves · last 72 hours')).toHaveCount(1);

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
