import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';

const story = async (page: Page, id: string): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-skevidencechain--${id}&viewMode=story`);
  const host = page.locator('sk-evidence-chain').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect.poll(() => host.evaluate((element) =>
    customElements.get('sk-evidence-chain') !== undefined &&
    element.shadowRoot !== null &&
    element.shadowRoot.innerHTML.trim().length > 0,
  )).toBe(true);
  return host;
};

const chainFacts = (host: Locator) => host.evaluate((element) => {
  const root = element.shadowRoot!;
  const list = root.querySelector('ol');
  const stages = [...(list?.children ?? [])];
  const metrics = stages.map((stage) =>
    stage.querySelector('sk-metric') as (HTMLElement & {
      label?: string;
      displayValue?: string;
      annotation?: string;
    }) | null,
  );
  return {
    lists: root.querySelectorAll('ol').length,
    directTags: stages.map((stage) => stage.tagName),
    labels: metrics.map((metric) => metric?.label),
    values: metrics.map((metric) => metric?.displayValue),
    annotations: metrics.map((metric) => metric?.annotation),
    metrics: root.querySelectorAll('sk-metric').length,
    connectors: root.querySelectorAll('[part="connector"]').length,
    connectorText: [...root.querySelectorAll('[part="connector"]')].map((node) => node.textContent),
    connectorHidden: [...root.querySelectorAll('[part="connector"]')].map((node) => node.getAttribute('aria-hidden')),
  };
});

for (const [id, labels] of [
  ['two-stages', ['Items received', 'Items reviewed']],
  ['default', ['Items received', 'Items reviewed', 'Items accepted', 'Items remaining']],
  ['six-stages', [
    'Items received',
    'Items reviewed',
    'Items accepted',
    'Items remaining',
    'Items archived',
    'Items reported',
  ]],
] as const) {
  test(`${id} preserves direct ordered-list items and composes exactly one metric per stage`, async ({ page }) => {
    const host = await story(page, id);
    const facts = await chainFacts(host);
    const count = labels.length;
    expect(facts.lists).toBe(1);
    expect(facts.directTags).toEqual(Array(count).fill('LI'));
    expect(facts.labels).toEqual(labels);
    expect(facts.metrics).toBe(count);
    expect(facts.connectors).toBe(count - 1);
    expect(facts.connectorText).toEqual(Array(count - 1).fill(''));
    expect(facts.connectorHidden).toEqual(Array(count - 1).fill('true'));
    await expect(host.getByRole('list')).toHaveCount(1);
    await expect(host.getByRole('listitem')).toHaveCount(count);
  });
}

test('Narrow changes CSS direction without changing ordered DOM content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const host = await story(page, 'narrow');
  const facts = await host.evaluate((element) => {
    const list = element.shadowRoot!.querySelector<HTMLOListElement>('[part="list"]')!;
    const stages = [...list.children] as HTMLElement[];
    const connectors = [...list.querySelectorAll<HTMLElement>('[part="connector"]')];
    return {
      direction: getComputedStyle(list).flexDirection,
      labels: stages.map((stage) =>
        (stage.querySelector('sk-metric') as HTMLElement & { label?: string } | null)?.label,
      ),
      connectors: connectors.map((connector, index) => {
        const before = getComputedStyle(connector, '::before');
        const after = getComputedStyle(connector, '::after');
        const connectorRect = connector.getBoundingClientRect();
        const currentMetric = stages[index]!.querySelector('sk-metric')!.getBoundingClientRect();
        const nextMetric = stages[index + 1]!.querySelector('sk-metric')!.getBoundingClientRect();
        return {
          glyph: after.content,
          topBorder: Number.parseFloat(before.borderBlockStartWidth),
          inlineBorder: Number.parseFloat(before.borderInlineStartWidth),
          afterCurrent: connectorRect.top >= currentMetric.bottom,
          beforeNext: connectorRect.bottom <= nextMetric.top,
        };
      }),
    };
  });
  expect(facts.direction).toBe('column');
  expect(facts.labels).toEqual(['Items received', 'Items reviewed', 'Items accepted', 'Items remaining']);
  expect(facts.connectors).toHaveLength(3);
  for (const connector of facts.connectors) {
    expect(connector.glyph).toContain('↓');
    expect(connector.topBorder).toBe(0);
    expect(connector.inlineBorder).toBe(1);
    expect(connector.afterCurrent).toBe(true);
    expect(connector.beforeNext).toBe(true);
  }
});

test('ApprovedExample uses actual grid/card wrappers and nested metric pill tags', async ({ page }) => {
  const host = await story(page, 'approved-example');
  await expect.poll(() => host.evaluate((element) => ({
    parent: element.parentElement?.tagName,
    grandparent: element.parentElement?.parentElement?.tagName,
    metrics: element.shadowRoot!.querySelectorAll('sk-metric').length,
    nestedPills: [...element.shadowRoot!.querySelectorAll('sk-metric')]
      .filter((metric) => metric.shadowRoot?.querySelector('sk-pill-tag')).length,
  }))).toEqual({ parent: 'SK-CARD', grandparent: 'SK-GRID', metrics: 4, nestedPills: 4 });
  const facts = await chainFacts(host);
  expect(facts.labels).toEqual(['Investment', 'Completed', 'Deployed', 'Verified']);
  expect(facts.values).toEqual(['€1,840', '42 WPs', '6 missions', '2 outcomes']);
  expect(facts.annotations).toEqual([
    '€166 unattributed',
    '34 first pass',
    'Production evidence',
    '4 awaiting evidence',
  ]);
  const grid = await page.locator('sk-grid').first().evaluate((element) => ({
    maxInlineSize: element.style.maxInlineSize,
    renderedWidth: element.getBoundingClientRect().width,
    computedMaximum: Number.parseFloat(getComputedStyle(element).maxInlineSize),
  }));
  expect(grid.maxInlineSize).toBe('calc(var(--sk-space-12) * 6 + var(--sk-space-8))');
  expect(grid.renderedWidth).toBeGreaterThan(0);
  expect(grid.renderedWidth).toBeLessThanOrEqual(grid.computedMaximum);
});

test('empty and invalid whole inputs fail closed to one status and no list', async ({ page }) => {
  for (const id of ['empty', 'invalid-input']) {
    const host = await story(page, id);
    await expect(host.locator('[part="empty-state"][role="status"]')).toHaveText('No evidence available.');
    await expect(host.locator('ol')).toHaveCount(0);
  }
});

test('Approved dark and LightMode preserve the exact composition while connector token paint changes', async ({ page }) => {
  const facts = async (id: string) => {
    const host = await story(page, id);
    return host.evaluate((element) => {
      const root = element.shadowRoot!;
      const connector = root.querySelector<HTMLElement>('[part="connector"]')!;
      const grid = element.parentElement!.parentElement!;
      const probe = document.createElement('span');
      probe.style.borderBlockStart = 'var(--sk-border-width-1) solid var(--sk-border-strong)';
      element.before(probe);
      const token = getComputedStyle(probe).borderBlockStartColor;
      probe.remove();
      return {
        content: {
          labels: [...root.querySelectorAll<HTMLElement & { label?: string }>('sk-metric')].map((metric) => metric.label),
          values: [...root.querySelectorAll<HTMLElement & { displayValue?: string }>('sk-metric')].map((metric) => metric.displayValue),
          annotations: [...root.querySelectorAll<HTMLElement & { annotation?: string }>('sk-metric')].map((metric) => metric.annotation),
          tones: [...root.querySelectorAll<HTMLElement & { tone?: string }>('sk-metric')].map((metric) => metric.tone),
          stages: root.querySelectorAll('ol > li').length,
          connectors: root.querySelectorAll('[part="connector"]').length,
          pills: [...root.querySelectorAll('sk-metric')].filter((metric) => metric.shadowRoot?.querySelector('sk-pill-tag')).length,
          parent: element.parentElement?.tagName,
          grandparent: grid.tagName,
          maxInlineSize: grid.style.maxInlineSize,
        },
        paint: {
          token,
          connector: getComputedStyle(connector, '::before').borderBlockStartColor,
        },
      };
    });
  };
  const dark = await facts('approved-example');
  const light = await facts('light-mode');
  expect(light.content).toEqual(dark.content);
  expect(dark.content).toMatchObject({
    tones: ['neutral', 'info', 'success', 'success'],
    stages: 4,
    connectors: 3,
    pills: 4,
    parent: 'SK-CARD',
    grandparent: 'SK-GRID',
    maxInlineSize: 'calc(var(--sk-space-12) * 6 + var(--sk-space-8))',
  });
  expect(dark.paint.connector).toBe(dark.paint.token);
  expect(light.paint.connector).toBe(light.paint.token);
  expect(light.paint.token).not.toBe(dark.paint.token);
  expect(light.paint.connector).not.toBe(dark.paint.connector);
});

test('wide connectors are directional one-pixel paths aligned with the label band', async ({ page }) => {
  const host = await story(page, 'approved-example');
  const facts = await host.evaluate((element) => {
    const root = element.shadowRoot!;
    const stages = [...root.querySelectorAll<HTMLElement>('ol > li')];
    return [...root.querySelectorAll<HTMLElement>('[part="connector"]')].map((connector, index) => {
      const before = getComputedStyle(connector, '::before');
      const after = getComputedStyle(connector, '::after');
      const connectorRect = connector.getBoundingClientRect();
      const metric = stages[index]!.querySelector('sk-metric')!;
      const label = metric.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!.getBoundingClientRect();
      const value = metric.shadowRoot!.querySelector<HTMLElement>('[part="value"]')!.getBoundingClientRect();
      const lineCenter = connectorRect.top + connectorRect.height / 2;
      return {
        glyph: after.content,
        borderStyle: before.borderBlockStartStyle,
        borderWidth: Number.parseFloat(before.borderBlockStartWidth),
        borderColor: before.borderBlockStartColor,
        inLabelBand: lineCenter >= label.top && lineCenter <= label.bottom,
        beforeValue: connectorRect.top < value.top,
        stageRailWidth: Number.parseFloat(getComputedStyle(stages[index]!).borderInlineStartWidth),
      };
    });
  });
  expect(facts).toHaveLength(3);
  for (const connector of facts) {
    expect(connector.glyph).toContain('→');
    expect(connector.borderStyle).not.toBe('none');
    expect(connector.borderWidth).toBe(1);
    expect(connector.borderColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(connector.borderColor).not.toBe('transparent');
    expect(connector.inLabelBand).toBe(true);
    expect(connector.beforeValue).toBe(true);
    expect(connector.stageRailWidth).toBe(0);
  }
});

test('active forced colors preserves ordered semantics and visible decorative boundaries', async ({ browser, browserName }, testInfo) => {
  expect(test.info().config.projects.map((project) => project.name), 'the chromium skip below is keyed on this project name').toContain('chromium');
  test.skip(browserName !== 'chromium', 'forced-colors coverage is a Chromium-owned case');
  const context = await (browser as Browser).newContext({
    baseURL: String(testInfo.project.use.baseURL),
    forcedColors: 'active',
  });
  const page = await context.newPage();
  try {
    const host = await story(page, 'default');
    await expect.poll(() => host.evaluate((element) =>
      [...element.shadowRoot!.querySelectorAll('sk-metric')].every((metric) =>
        metric.shadowRoot?.querySelector('[part="metric"]') !== null,
      ),
    )).toBe(true);
    const facts = await host.evaluate((element) => {
      const root = element.shadowRoot!;
      const connectors = [...root.querySelectorAll<HTMLElement>('[part="connector"]')];
      const stages = [...root.querySelectorAll<HTMLElement>('ol > li')];
      return {
        stages: stages.length,
        connectorCount: connectors.length,
        decorative: connectors.every((connector) => connector.getAttribute('aria-hidden') === 'true'),
        boundaries: connectors.map((connector) => {
          const style = getComputedStyle(connector, '::before');
          const glyph = getComputedStyle(connector, '::after');
          return {
            style: style.borderBlockStartStyle,
            width: Number.parseFloat(style.borderBlockStartWidth),
            color: style.borderBlockStartColor,
            glyph: glyph.content,
            glyphColor: glyph.color,
          };
        }),
        stageBoundaries: stages.map((stage) => {
          const style = getComputedStyle(stage);
          return {
            style: style.borderInlineStartStyle,
            width: Number.parseFloat(style.borderInlineStartWidth),
            color: style.borderInlineStartColor,
          };
        }),
      };
    });
    expect(facts.stages).toBe(4);
    expect(facts.connectorCount).toBe(3);
    expect(facts.decorative).toBe(true);
    for (const boundary of facts.boundaries) {
      expect(boundary.style).not.toBe('none');
      expect(boundary.width).toBeGreaterThan(0);
      expect(boundary.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(boundary.color).not.toBe('transparent');
      expect(boundary.glyph).toContain('→');
      expect(boundary.glyphColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(boundary.glyphColor).not.toBe('transparent');
    }
    expect(facts.stageBoundaries).toHaveLength(4);
    for (const boundary of facts.stageBoundaries) {
      expect(boundary.style).not.toBe('none');
      expect(boundary.width).toBeGreaterThan(0);
      expect(boundary.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(boundary.color).not.toBe('transparent');
    }
  } finally {
    await context.close();
  }
});
