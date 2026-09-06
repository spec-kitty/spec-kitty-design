import { expect, test, type Locator, type Page } from '@playwright/test';
import { getViolations, injectAxe } from 'axe-playwright';

const STORY_IDS = [
  'default',
  'close-values',
  'zero-values',
  'empty',
  'long-labels',
  'controlled-selection',
  'selectable-states',
  'light-mode',
] as const;

const story = async (page: Page, id: typeof STORY_IDS[number]): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-skbarchart--${id}&viewMode=story`);
  const host = page.locator('sk-bar-chart').first();
  await host.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(host.locator('[part="chart"]')).toBeVisible();
  return host;
};

const axeIsClean = async (page: Page, label: string): Promise<void> => {
  await injectAxe(page);
  let violations: Awaited<ReturnType<typeof getViolations>> = [];
  await expect.poll(async () => {
    try {
      violations = await getViolations(page, 'body', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      });
      return 'ready';
    } catch (error) {
      if (String(error).includes('Axe is already running')) return 'busy';
      throw error;
    }
  }).toBe('ready');
  expect(violations, `${label} must have zero WCAG 2.1 AA violations`).toEqual([]);
};

for (const id of STORY_IDS) {
  test(`${id} loads non-empty and is axe-clean`, async ({ page }) => {
    const host = await story(page, id);
    await expect(host.locator('[part="chart"]')).not.toBeEmpty();
    await axeIsClean(page, id);
  });
}

test('Default and LightMode have identical semantic ownership before token-driven theme variance', async ({ page }) => {
  const facts = async (id: 'default' | 'light-mode') => {
    const host = await story(page, id);
    return host.evaluate((element) => {
      const root = element.shadowRoot!;
      const figure = root.querySelector<HTMLElement>('[part="chart"]')!;
      const probe = document.createElement('span');
      root.append(probe);
      const token = (name: string) => {
        probe.style.color = `var(${name})`;
        return getComputedStyle(probe).color;
      };
      const items = [...root.querySelectorAll<HTMLElement>('[part="item"]')];
      const theme = {
        page: token('--sk-surface-page'),
        body: token('--sk-fg-body'),
        series: token('--sk-color-data-series-primary'),
        grid: token('--sk-color-data-grid'),
        baseline: token('--sk-color-data-baseline'),
        focus: token('--sk-border-focus'),
      };
      probe.remove();
      return {
        semantic: {
          chartTag: figure.tagName,
          name: figure.getAttribute('aria-label'),
          describedBy: figure.getAttribute('aria-describedby')?.replace(/-[0-9]+$/, '-INSTANCE'),
          description: root.querySelector('[data-chart-description]')?.textContent,
          plotTag: root.querySelector('[part="plot"]')?.tagName,
          buttons: root.querySelectorAll('button').length,
          svgAnnouncements: root.querySelectorAll('svg:not([aria-hidden="true"])').length,
          items: items.map((item) => ({
            tag: item.tagName,
            id: item.dataset.datumId,
            ratio: Number(item.dataset.ratio),
            text: item.textContent?.replace(/\s+/g, ' ').trim(),
            label: item.querySelector('[part="label"]')?.textContent,
            value: item.querySelector('[part="value"]')?.textContent,
            barPart: item.querySelector('[part="bar"]')?.getAttribute('part'),
            height: Number(item.querySelector('[part="bar"]')?.getAttribute('height')),
            y: Number(item.querySelector('[part="bar"]')?.getAttribute('y')),
          })),
        },
        theme,
        rendered: {
          series: getComputedStyle(root.querySelector('[part="bar"]')!).fill,
          grid: getComputedStyle(root.querySelector('.sk-bar-chart__grid')!).stroke,
          baseline: getComputedStyle(root.querySelector('.sk-bar-chart__baseline')!).stroke,
        },
      };
    });
  };

  const dark = await facts('default');
  const light = await facts('light-mode');
  expect(light.semantic).toEqual(dark.semantic);
  expect(dark.semantic.items.map(({ id }) => id)).toEqual(['aug-11', 'aug-18', 'aug-25', 'sep-1']);
  expect(dark.semantic.items.map(({ text }) => text)).toEqual([
    '€320 Aug 11',
    '€510 Aug 18',
    '€440 Aug 25',
    '€604 Sep 1',
  ]);
  for (const facts of [dark, light]) {
    expect(facts.semantic.chartTag).toBe('FIGURE');
    expect(facts.semantic.plotTag).toBe('OL');
    expect(facts.semantic.buttons).toBe(0);
    expect(facts.semantic.svgAnnouncements).toBe(0);
    expect(facts.rendered.series).toBe(facts.theme.series);
    expect(facts.rendered.grid).toBe(facts.theme.grid);
    expect(facts.rendered.baseline).toBe(facts.theme.baseline);
    expect(facts.theme.series).not.toBe(facts.theme.focus);
  }
  expect(light.theme.page).not.toBe(dark.theme.page);
  expect(light.theme.body).not.toBe(dark.theme.body);
  expect(light.theme.series).not.toBe(dark.theme.series);
});

test('accessible list text owns meaning while supplementary SVG remains silent', async ({ page }) => {
  const host = await story(page, 'controlled-selection');
  await expect(host.locator('figure')).toHaveAccessibleName('Return over time');
  await expect(host.locator('[data-chart-description]')).toHaveText('Attributed value by observation date');
  await expect(host.getByRole('list')).toBeVisible();
  await expect(host.getByRole('listitem')).toHaveCount(4);
  await expect(host.getByRole('button')).toHaveText([
    '€320 Aug 11',
    '€510 Aug 18',
    '€440 Aug 25',
    '€604 Sep 1',
  ]);
  await expect(host.locator('svg:not([aria-hidden="true"])')).toHaveCount(0);
});

test('pointer, Enter, Space, and held keys emit byte-equivalent single controlled intents', async ({ page }) => {
  const host = await story(page, 'selectable-states');
  const trigger = host.getByRole('button').first();
  await host.evaluate((element) => {
    const target = window as typeof window & {
      __barEvents?: Array<{ detail: unknown; bubbles: boolean; composed: boolean; cancelable: boolean }>;
    };
    target.__barEvents = [];
    element.addEventListener('sk-bar-chart-select', (event) => {
      const custom = event as CustomEvent;
      target.__barEvents!.push({
        detail: custom.detail,
        bubbles: custom.bubbles,
        composed: custom.composed,
        cancelable: custom.cancelable,
      });
    });
  });

  await trigger.click();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');

  const result = await host.evaluate(async (element) => {
    const chart = element as HTMLElement & { selectedId: string; updateComplete: Promise<unknown> };
    await chart.updateComplete;
    return {
      events: (window as typeof window & { __barEvents?: unknown[] }).__barEvents,
      selectedId: chart.selectedId,
    };
  });
  expect(result.events).toEqual(Array.from({ length: 3 }, () => ({
    detail: { id: 'aug-11' },
    bubbles: true,
    composed: true,
    cancelable: false,
  })));
  expect(result.selectedId).toBe('');
});

test('real rest, hover, focus, active, selected and nonselectable states stay distinct', async ({ page }) => {
  await story(page, 'selectable-states');
  const selectable = page.locator('sk-bar-chart[data-selectable-states]');
  const trigger = selectable.getByRole('button').first();
  const style = () => trigger.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      background: computed.backgroundColor,
      borderColor: computed.borderColor,
      borderStyle: computed.borderStyle,
      borderWidth: computed.borderWidth,
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
    };
  });
  const rest = await style();
  await trigger.hover();
  await expect.poll(async () => (await style()).background).not.toBe(rest.background);
  const hover = await style();
  await trigger.focus();
  const focus = await style();
  const box = await trigger.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await style()).background).not.toBe(hover.background);
  const active = await style();
  await page.mouse.up();

  const selected = page.locator('sk-bar-chart[data-selected-state]').getByRole('button').nth(1);
  const selectedStyle = await selected.evaluate((node) => {
    const computed = getComputedStyle(node);
    return { borderColor: computed.borderColor, borderWidth: computed.borderWidth };
  });
  expect(hover.background).not.toBe(rest.background);
  expect(active.background).not.toBe(hover.background);
  expect(focus.outlineStyle).not.toBe('none');
  expect(focus.outlineWidth).not.toBe('0px');
  expect(selectedStyle.borderColor).not.toBe(rest.borderColor);
  expect(await selected.getAttribute('aria-pressed')).toBe('true');
  await expect(page.locator('sk-bar-chart[data-non-selectable-state]').getByRole('button')).toHaveCount(0);
});

for (const id of ['default', 'light-mode'] as const) {
  test(`${id} preserves focus, selection, bars and baseline in forced colors`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const host = await story(page, id);
    await host.evaluate(async (element) => {
      const chart = element as HTMLElement & {
        selectable: boolean;
        selectedId: string;
        updateComplete: Promise<unknown>;
      };
      chart.selectable = true;
      chart.selectedId = 'aug-18';
      await chart.updateComplete;
    });
    const focused = host.getByRole('button').first();
    const selected = host.getByRole('button').nth(1);
    await focused.focus();
    const facts = await host.evaluate((element) => {
      const root = element.shadowRoot!;
      const focused = root.querySelector<HTMLElement>(':focus-visible')!;
      const selected = root.querySelector<HTMLElement>('[aria-pressed="true"]')!;
      const bar = root.querySelector<SVGRectElement>('[part="bar"]')!;
      const baseline = root.querySelector<SVGLineElement>('.sk-bar-chart__baseline')!;
      return {
        focus: {
          style: getComputedStyle(focused).outlineStyle,
          width: getComputedStyle(focused).outlineWidth,
          color: getComputedStyle(focused).outlineColor,
        },
        selected: {
          borderStyle: getComputedStyle(selected).borderStyle,
          borderColor: getComputedStyle(selected).borderColor,
        },
        bar: getComputedStyle(bar).fill,
        baseline: getComputedStyle(baseline).stroke,
        text: [...root.querySelectorAll('[part="item"]')].map((node) => node.textContent?.replace(/\s+/g, ' ').trim()),
      };
    });
    expect(facts.focus.style).toBe('solid');
    expect(facts.focus.width).not.toBe('0px');
    expect(facts.selected.borderStyle).toBe('double');
    expect(facts.selected.borderStyle).not.toBe(facts.focus.style);
    expect(facts.bar).not.toBe('none');
    expect(facts.baseline).not.toBe('none');
    expect(facts.text).toContain('€320 Aug 11');
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
  });
}

test('reduced motion disables every component transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const host = await story(page, 'selectable-states');
  const transitions = await host.locator('.sk-bar-chart__surface').evaluateAll((nodes) =>
    nodes.map((node) => ({
      duration: getComputedStyle(node).transitionDuration,
      property: getComputedStyle(node).transitionProperty,
    })),
  );
  expect(transitions.length).toBeGreaterThan(0);
  expect(transitions.every(({ duration, property }) =>
    duration.split(', ').every((value) => value === '0s') &&
    (property === 'all' || property === 'none')
  )).toBe(true);
});

test('390px long-label ownership survives horizontal scrolling without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const host = await story(page, 'long-labels');
  const plot = host.locator('[part="plot"]');
  await expect.poll(() => plot.evaluate((node) => node.scrollWidth)).toBeGreaterThan(
    await plot.evaluate((node) => node.clientWidth),
  );

  const ownership = () => host.evaluate((element) => {
    const root = element.shadowRoot!;
    return [...root.querySelectorAll<HTMLElement>('[part="item"]')].map((item) => {
      const itemRect = item.getBoundingClientRect();
      const owned = [
        item.querySelector('[part="value"]')!,
        item.querySelector('svg')!,
        item.querySelector('[part="label"]')!,
      ].map((node) => {
        const rect = node.getBoundingClientRect();
        return rect.left >= itemRect.left - 0.5 && rect.right <= itemRect.right + 0.5;
      });
      return { id: item.dataset.datumId, owned };
    });
  });
  expect((await ownership()).every(({ owned }) => owned.every(Boolean))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await plot.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
  await expect.poll(() => plot.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  expect((await ownership()).every(({ owned }) => owned.every(Boolean))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
