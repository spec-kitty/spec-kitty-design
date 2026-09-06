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

test('tone values and pills use their exact theme-safe mappings without default rails', async ({ page }) => {
  let host = await story(page, 'tones');
  const tones = page.locator('sk-metric');
  await expect(tones).toHaveCount(4);
  expect(await tones.evaluateAll((elements) => elements.map((element) => element.getAttribute('tone'))))
    .toEqual(['neutral', 'info', 'success', 'attention']);
  await expect(tones.locator('[part="metric"]')).toHaveCount(4);

  const facts = () => tones.evaluateAll((elements) => {
    const tokens = [
      '--sk-fg-default',
      '--sk-on-tint-sky',
      '--sk-on-tint-mint',
      '--sk-on-tint-butter',
    ];
    return elements.map((element, index) => {
      const root = element.shadowRoot!;
      const metric = root.querySelector<HTMLElement>('[part="metric"]')!;
      const value = root.querySelector<HTMLElement>('[part="value"]')!;
      const annotation = root.querySelector<HTMLElement>('[part="annotation"]')!;
      const pill = annotation.querySelector('sk-pill-tag');
      const probe = document.createElement('span');
      probe.style.color = `var(${tokens[index]})`;
      element.before(probe);
      const tokenColor = getComputedStyle(probe).color;
      probe.remove();
      return {
        valueColor: getComputedStyle(value).color,
        tokenColor,
        pillVariant: pill?.getAttribute('variant') ?? null,
        railWidth: Number.parseFloat(getComputedStyle(metric).borderInlineStartWidth),
        valueBottom: value.getBoundingClientRect().bottom,
        annotationTop: annotation.getBoundingClientRect().top,
      };
    });
  });

  const dark = await facts();
  expect(dark.map(({ valueColor }) => valueColor)).toEqual(dark.map(({ tokenColor }) => tokenColor));
  expect(dark.map(({ pillVariant }) => pillVariant)).toEqual([null, 'purple', 'green', 'yellow']);
  expect(dark.every(({ railWidth }) => railWidth === 0)).toBe(true);
  expect(dark.every(({ valueBottom, annotationTop }) => annotationTop >= valueBottom)).toBe(true);

  await page.locator('#storybook-root').evaluate((root) => root.classList.add('sk-light'));
  const light = await facts();
  expect(light.map(({ valueColor }) => valueColor)).toEqual(light.map(({ tokenColor }) => tokenColor));
  expect(light.map(({ pillVariant }) => pillVariant)).toEqual([null, 'purple', 'green', 'yellow']);
  expect(light.some(({ valueColor }, index) => valueColor !== dark[index]!.valueColor)).toBe(true);
});

test('compact centers its three tiers and long annotation content stays bounded', async ({ page }) => {
  let host = await story(page, 'compact');
  await expect(host).toHaveAttribute('compact', '');
  await expect(host.locator('[part="metric"]')).toBeVisible();
  const compact = await host.evaluate((element) => {
    const root = element.shadowRoot!;
    const metric = root.querySelector<HTMLElement>('[part="metric"]')!;
    const label = root.querySelector<HTMLElement>('[part="label"]')!;
    const value = root.querySelector<HTMLElement>('[part="value"]')!;
    const annotation = root.querySelector<HTMLElement>('[part="annotation"]')!;
    const center = (node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return rect.left + rect.width / 2;
    };
    return {
      metric: center(metric),
      label: center(label),
      value: center(value),
      annotation: center(annotation),
      annotationTop: annotation.getBoundingClientRect().top,
      valueBottom: value.getBoundingClientRect().bottom,
    };
  });
  expect(Math.abs(compact.metric - compact.label)).toBeLessThanOrEqual(1);
  expect(Math.abs(compact.metric - compact.value)).toBeLessThanOrEqual(1);
  expect(Math.abs(compact.metric - compact.annotation)).toBeLessThanOrEqual(1);
  expect(compact.annotationTop).toBeGreaterThanOrEqual(compact.valueBottom);

  await page.setViewportSize({ width: 390, height: 844 });
  host = await story(page, 'long-content');
  const bounds = await host.evaluate((element) => {
    const root = element.shadowRoot!;
    const metric = root.querySelector<HTMLElement>('[part="metric"]')!.getBoundingClientRect();
    const annotation = root.querySelector<HTMLElement>('[part="annotation"]')!.getBoundingClientRect();
    const pill = root.querySelector('sk-pill-tag')!.shadowRoot!
      .querySelector<HTMLElement>('[part="tag"]')!.getBoundingClientRect();
    return { metricLeft: metric.left, metricRight: metric.right, annotationLeft: annotation.left,
      annotationRight: annotation.right, pillLeft: pill.left, pillRight: pill.right };
  });
  expect(bounds.annotationLeft).toBeGreaterThanOrEqual(bounds.metricLeft);
  expect(bounds.annotationRight).toBeLessThanOrEqual(bounds.metricRight);
  expect(bounds.pillLeft).toBeGreaterThanOrEqual(bounds.metricLeft);
  expect(bounds.pillRight).toBeLessThanOrEqual(bounds.metricRight);
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
