import { expect, test, type Locator, type Page } from '@playwright/test';

const story = async (page: Page, id: string): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-skmetric--${id}&viewMode=story`);
  const host = page.locator('sk-metric').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect.poll(() => host.evaluate((element) =>
    customElements.get('sk-metric') !== undefined &&
    element.shadowRoot !== null &&
    element.shadowRoot.innerHTML.trim().length > 0,
  )).toBe(true);
  return host;
};

test('Default renders one native definition relationship and preserves opaque strings', async ({ page }) => {
  const host = await story(page, 'default');
  const facts = await host.evaluate((element) => {
    const root = element.shadowRoot!;
    const list = root.querySelector('dl');
    return {
      dlCount: root.querySelectorAll('dl').length,
      directTags: [...(list?.children ?? [])].map((child) => child.tagName),
      label: root.querySelector('dt')?.textContent,
      value: root.querySelector('[part="value"]')?.textContent,
      annotations: root.querySelectorAll('[part="annotation"]').length,
    };
  });
  expect(facts).toEqual({
    dlCount: 1,
    directTags: ['DT', 'DD'],
    label: 'Items processed',
    value: '128',
    annotations: 0,
  });
});

test('annotation composes the real pill tag and all five public parts are reachable', async ({ page }) => {
  const host = await story(page, 'with-annotation');
  await expect(host.locator('[part="annotation"] sk-pill-tag')).toHaveCount(1);
  await expect(host.locator('[part="annotation"] sk-pill-tag')).toHaveText('Sampled');

  const validParts = await host.evaluate((element) =>
    [...element.shadowRoot!.querySelectorAll('[part]')].flatMap((node) =>
      (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean),
    ),
  );
  expect(validParts).toEqual(expect.arrayContaining(['metric', 'label', 'value', 'annotation']));

  await host.evaluate(async (element) => {
    const metric = element as HTMLElement & { tone: string; updateComplete: Promise<unknown> };
    metric.tone = 'unsupported';
    await metric.updateComplete;
  });
  await expect(host.locator('[part="empty-state"]')).toHaveText('Metric unavailable.');
});

test('tone and compact stories render upgraded, nonblank metric states', async ({ page }) => {
  let host = await story(page, 'tones');
  const tones = page.locator('sk-metric');
  await expect(tones).toHaveCount(4);
  expect(await tones.evaluateAll((elements) => elements.map((element) => element.getAttribute('tone'))))
    .toEqual(['neutral', 'info', 'success', 'attention']);
  await expect(tones.locator('[part="metric"]')).toHaveCount(4);

  host = await story(page, 'compact');
  await expect(host).toHaveAttribute('compact', '');
  await expect(host.locator('[part="metric"]')).toBeVisible();
});

test('Default dark and LightMode keep content and semantics while a named token-driven color changes', async ({ page }) => {
  const facts = async (id: string) => {
    const host = await story(page, id);
    return host.evaluate((element) => {
      const root = element.shadowRoot!;
      const metric = root.querySelector<HTMLElement>('[part="metric"]')!;
      const value = root.querySelector<HTMLElement>('[part="value"]')!;
      return {
        content: {
          label: root.querySelector('dt')?.textContent,
          value: value.textContent,
          definitions: root.querySelectorAll('dl > dt + dd').length,
        },
        paint: {
          foregroundToken: getComputedStyle(element).getPropertyValue('--sk-fg-default').trim(),
          valueColor: getComputedStyle(value).color,
          edgeColor: getComputedStyle(metric).borderInlineStartColor,
        },
      };
    });
  };

  const dark = await facts('default');
  const light = await facts('light-mode');
  expect(light.content).toEqual(dark.content);
  expect(dark.paint.valueColor).not.toBe(light.paint.valueColor);
  expect(dark.paint.foregroundToken).not.toBe(light.paint.foregroundToken);
});
