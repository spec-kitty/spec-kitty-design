import { expect, test, type Locator, type Page } from '@playwright/test';

type ActionTrace = Array<{
  detail: unknown;
  bubbles: boolean;
  composed: boolean;
  cancelable: boolean;
}>;

const openStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root').waitFor({ state: 'visible', timeout: 20_000 });
};

const actionRow = async (page: Page, story: string, index = 0) => {
  await openStory(page, `elements-skactionrow--${story}`);
  const host = page.locator('sk-action-row').nth(index);
  await expect(host.locator('[part="row"]')).toBeVisible({ timeout: 20_000 });
  return host;
};

const installActionTrace = (host: Locator) =>
  host.evaluate((element) => {
    const trace: ActionTrace = [];
    (window as typeof window & { __compactActionTrace?: ActionTrace }).__compactActionTrace = trace;
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

const readActionTrace = (page: Page) =>
  page.evaluate(
    () => (window as typeof window & { __compactActionTrace: ActionTrace }).__compactActionTrace,
  );

const clearActionTrace = (page: Page) =>
  page.evaluate(() => {
    (window as typeof window & { __compactActionTrace: ActionTrace }).__compactActionTrace.length = 0;
  });

test.describe('compact work-item composition', () => {
  test('keeps the T10 card in DOM/reading order in dark and light themes', async ({ page }) => {
    const themes = [
      ['t-10-compact-item', false],
      ['t-10-compact-item-light-mode', true],
    ] as const;
    const themeSurfaces: string[] = [];

    for (const [story, light] of themes) {
      const host = await actionRow(page, story);
      await expect(host).toHaveAttribute('layout', 'card');
      await expect(host.locator('sk-entity-marker[slot="marker"][size="sm"][shape="circle"]')).toHaveCount(1);
      await expect(host.locator('sk-status-indicator[slot="tags"][pulsing]')).toContainText('Live claim');
      await expect(host.locator('[slot="supporting"]')).toContainText('Claimed by Mia');
      await expect(host.locator('button[slot="controls"]')).toHaveText('Review');
      expect(await host.ariaSnapshot()).toContain('Review compact Work Package extensions');

      const contract = await host.evaluate((element) => {
        const parts = [...element.shadowRoot!.querySelectorAll<HTMLElement>('[part]')];
        const visibleOrder = parts
          .filter((node) => !['row', 'trigger'].includes(node.getAttribute('part') ?? ''))
          .map((node) => ({
            part: node.getAttribute('part'),
            order: getComputedStyle(node).order,
          }));
        return {
          parts: visibleOrder.map(({ part }) => part),
          cssOrder: visibleOrder.map(({ order }) => order),
          triggerContainsControls: !!element.shadowRoot!
            .querySelector('[part="trigger"]')
            ?.querySelector('[part="controls"]'),
          light: !!element.closest('.sk-light'),
          surface: getComputedStyle(element).getPropertyValue('--sk-surface-page').trim(),
        };
      });

      expect(contract.parts).toEqual([
        'marker',
        'title',
        'reference',
        'tags',
        'metadata',
        'supporting',
        'controls',
      ]);
      expect(new Set(contract.cssOrder)).toEqual(new Set(['0']));
      expect(contract.triggerContainsControls).toBe(false);
      expect(contract.light).toBe(light);
      themeSurfaces.push(contract.surface);
    }

    expect(themeSurfaces[0]).not.toBe(themeSurfaces[1]);
  });

  test('spans visible supporting content across the wide default trigger', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const host = await actionRow(page, 'default');
    await host.evaluate(async (element) => {
      const supporting = document.createElement('span');
      supporting.slot = 'supporting';
      supporting.textContent = 'Consumer supplied supporting context';
      element.append(supporting);
      await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    });
    await expect(host.locator('[part="supporting"]')).toBeVisible();

    const geometry = await host.evaluate((element) => {
      const trigger = element.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
      const supporting = element.shadowRoot!.querySelector<HTMLElement>('[part="supporting"]')!;
      const triggerRect = trigger.getBoundingClientRect();
      const supportingRect = supporting.getBoundingClientRect();
      const triggerStyle = getComputedStyle(trigger);
      const availableLeft = triggerRect.left + Number.parseFloat(triggerStyle.paddingLeft);
      const availableRight = triggerRect.right - Number.parseFloat(triggerStyle.paddingRight);
      return {
        hostWidth: element.getBoundingClientRect().width,
        layout: element.getAttribute('layout'),
        leftDelta: Math.abs(supportingRect.left - availableLeft),
        rightDelta: Math.abs(supportingRect.right - availableRight),
        widthDelta: Math.abs(supportingRect.width - (availableRight - availableLeft)),
      };
    });

    expect(geometry.hostWidth).toBeGreaterThan(400);
    expect(geometry.layout).toBeNull();
    expect(geometry.leftDelta).toBeLessThanOrEqual(0.5);
    expect(geometry.rightDelta).toBeLessThanOrEqual(0.5);
    expect(geometry.widthDelta).toBeLessThanOrEqual(1);
  });

  test('covers selected, static, sparse, live/stale supporting and trailing-control card states', async ({ page }) => {
    await openStory(page, 'elements-skactionrow--card-states');
    const hosts = page.locator('sk-action-row');
    await expect(hosts).toHaveCount(4);

    await expect(hosts.nth(0).locator('[slot="supporting"]')).toContainText('live signal supplied');
    await expect(hosts.nth(1)).toHaveAttribute('selected', '');
    await expect(hosts.nth(1).locator('[part="row"]')).toHaveAttribute('aria-current', 'true');
    await expect(hosts.nth(1).locator('[slot="supporting"]')).toContainText('stale status supplied');

    const sparse = hosts.nth(2);
    await expect(sparse.locator('button[part="trigger"]')).toHaveCount(0);
    await expect(sparse.locator('[slot="marker"],[slot="tags"],[slot="supporting"],[slot="controls"]')).toHaveCount(0);
    const hiddenParts = await sparse.evaluate((element) =>
      ['marker', 'tags', 'supporting', 'controls'].map((part) => ({
        part,
        hidden: element.shadowRoot!.querySelector<HTMLElement>(`[part="${part}"]`)?.hidden,
      })),
    );
    expect(hiddenParts).toEqual([
      { part: 'marker', hidden: true },
      { part: 'tags', hidden: true },
      { part: 'supporting', hidden: true },
      { part: 'controls', hidden: true },
    ]);

    await expect(hosts.nth(3).locator('button[slot="controls"]')).toHaveText('Inspect');
    expect(await hosts.nth(3).evaluate((element) => element.shadowRoot!.querySelector('[part="controls"]')!.hidden))
      .toBe(false);
  });

  test('preserves exact pointer/Enter/Space activation and controlled selection in card layout', async ({ page }) => {
    const host = await actionRow(page, 't-10-compact-item');
    const trigger = host.locator('button[part="trigger"]');
    await installActionTrace(host);

    const assertOneExactEvent = async () => {
      expect(await readActionTrace(page)).toEqual([
        {
          detail: { id: 't10-compact-item' },
          bubbles: true,
          composed: true,
          cancelable: false,
        },
      ]);
      expect(await host.evaluate((element) => (element as HTMLElement & { selected: boolean }).selected)).toBe(false);
      await expect(host.locator('[part="row"]')).not.toHaveAttribute('aria-current', 'true');
    };

    await trigger.click();
    await assertOneExactEvent();

    await clearActionTrace(page);
    await trigger.focus();
    await page.keyboard.press('Enter');
    await assertOneExactEvent();

    await clearActionTrace(page);
    await page.keyboard.press('Space');
    await assertOneExactEvent();

    await clearActionTrace(page);
    const repeated = await trigger.evaluate((node) => {
      const event = new KeyboardEvent('keydown', {
        key: ' ',
        repeat: true,
        bubbles: true,
        cancelable: true,
      });
      const dispatched = node.dispatchEvent(event);
      return { dispatched, defaultPrevented: event.defaultPrevented };
    });
    expect(repeated).toEqual({ dispatched: false, defaultPrevented: true });
    expect(await readActionTrace(page)).toEqual([]);

    await host.locator('button[slot="controls"]').click();
    expect(await readActionTrace(page)).toEqual([]);
  });

  test('keeps native/custom controls isolated and non-actionable rows out of the tab order in both layouts', async ({ page }) => {
    for (const layout of [undefined, 'card'] as const) {
      const host = await actionRow(page, 'with-controls');
      await host.evaluate(async (element, value) => {
        const row = element as HTMLElement & { layout: 'card' | undefined; updateComplete: Promise<unknown> };
        row.layout = value;
        await row.updateComplete;
      }, layout);
      expect(
        await host.locator('[part="row"]').evaluate((row) => row.classList.contains('sk-action-row--card')),
      ).toBe(layout === 'card');
      await installActionTrace(host);

      await host.locator('[data-native-link]').click();
      await host.locator('[data-native-button]').click();
      await host.locator('[data-sk-button]').locator('button').click();
      expect(await readActionTrace(page)).toEqual([]);

      await host.evaluate(async (element) => {
        const row = element as HTMLElement & {
          rowId: string;
          selectable: boolean;
          updateComplete: Promise<unknown>;
        };
        row.rowId = '   ';
        row.selectable = true;
        await row.updateComplete;
      });
      await expect(host.locator('button[part="trigger"]')).toHaveCount(0);
      expect(await host.evaluate((element) => (element as HTMLElement).tabIndex)).toBe(-1);
      expect(await host.locator('[part="trigger"]').evaluate((element) => (element as HTMLElement).tabIndex)).toBe(-1);
    }
  });

  test('contains long row/card layouts and focus at every compact width', async ({ page }) => {
    await page.setViewportSize({ width: 520, height: 900 });
    const variants = [
      ['long-content', false],
      ['card-long-content', true],
    ] as const;

    for (const [story, card] of variants) {
      const host = await actionRow(page, story);
      for (const width of [220, 288, 360]) {
        await host.evaluate((element, inlineSize) => {
          const frame = element.parentElement!;
          frame.style.boxSizing = 'border-box';
          frame.style.width = `${inlineSize}px`;
          frame.style.inlineSize = `${inlineSize}px`;
          frame.style.maxInlineSize = `${inlineSize}px`;
          (element as HTMLElement).style.inlineSize = '100%';
        }, width);
        const trigger = host.locator('button[part="trigger"]');
        await trigger.focus();
        const geometry = await host.evaluate((element) => {
          const row = element.shadowRoot!.querySelector<HTMLElement>('[part="row"]')!;
          const trigger = element.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
          const focus = getComputedStyle(trigger);
          const hostRect = element.getBoundingClientRect();
          const rowRect = row.getBoundingClientRect();
          const triggerRect = trigger.getBoundingClientRect();
          const projected = [...element.querySelectorAll<HTMLElement>('[slot]')].map((node) => {
            const rect = node.getBoundingClientRect();
            return rect.left >= rowRect.left - 1 && rect.right <= rowRect.right + 1;
          });
          return {
            width: Math.round(hostRect.width),
            pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            rowOverflow: row.scrollWidth - row.clientWidth,
            triggerOverflow: trigger.scrollWidth - trigger.clientWidth,
            triggerInside:
              triggerRect.left >= rowRect.left - 1 &&
              triggerRect.right <= rowRect.right + 1 &&
              triggerRect.top >= rowRect.top - 1 &&
              triggerRect.bottom <= rowRect.bottom + 1,
            allProjectedInside: projected.every(Boolean),
            focusVisible: focus.outlineStyle !== 'none' && Number.parseFloat(focus.outlineWidth) > 0,
            focusInset: Number.parseFloat(focus.outlineOffset) <= 0,
            layout: element.getAttribute('layout'),
          };
        });
        expect(geometry.width).toBe(width);
        expect(geometry.pageOverflow, `${story} ${width}px page overflow`).toBeLessThanOrEqual(0);
        expect(geometry.rowOverflow, `${story} ${width}px row overflow`).toBeLessThanOrEqual(0);
        expect(geometry.triggerOverflow, `${story} ${width}px trigger overflow`).toBeLessThanOrEqual(0);
        expect(geometry.triggerInside).toBe(true);
        expect(geometry.allProjectedInside).toBe(true);
        expect(geometry.focusVisible).toBe(true);
        expect(geometry.focusInset).toBe(true);
        expect(geometry.layout === 'card').toBe(card);
      }
    }
  });
});

test.describe('entity-marker axes and consumer images', () => {
  test('keeps size and shape independent across the full 2x2 matrix', async ({ page }) => {
    await openStory(page, 'elements-skentitymarker--axis-matrix');
    const hosts = page.locator('sk-entity-marker');
    await expect(hosts).toHaveCount(4);
    const measurements = await hosts.evaluateAll((elements) =>
      elements.map((element) => {
        const marker = element.shadowRoot!.querySelector<HTMLElement>('[part="marker"]')!;
        const rect = marker.getBoundingClientRect();
        return {
          size: element.getAttribute('size'),
          shape: element.getAttribute('shape'),
          width: rect.width,
          height: rect.height,
          radius: Number.parseFloat(getComputedStyle(marker).borderRadius),
          text: element.textContent?.trim(),
        };
      }),
    );

    expect(measurements.map(({ size, shape }) => [size, shape])).toEqual([
      [null, null],
      ['sm', null],
      [null, 'circle'],
      ['sm', 'circle'],
    ]);
    expect(measurements.every(({ width, height }) => width === height)).toBe(true);
    expect(measurements[0]!.width).toBe(measurements[2]!.width);
    expect(measurements[1]!.width).toBe(measurements[3]!.width);
    expect(measurements[1]!.width).toBeLessThan(measurements[0]!.width);
    expect(measurements[2]!.radius).toBeGreaterThan(measurements[0]!.radius);
    expect(measurements[3]!.radius).toBeGreaterThan(measurements[1]!.radius);
    expect(measurements.map(({ text }) => text)).toEqual(['DS', 'CS', 'DC', 'CC']);
  });

  test('uses one host-owned name and cover-crops portrait and landscape images', async ({ page }) => {
    await openStory(page, 'elements-skentitymarker--image-naming');
    await expect(page.getByRole('img', { name: 'Ada Lovelace' })).toHaveCount(1);
    await expect(page.locator('sk-entity-marker img')).toHaveAttribute('alt', '');

    await page.evaluate(() => {
      const landscape = document.createElement('sk-entity-marker');
      landscape.setAttribute('label', 'Landscape subject');
      landscape.setAttribute('size', 'sm');
      landscape.setAttribute('shape', 'circle');
      landscape.innerHTML =
        '<img data-landscape alt="" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2260%22%3E%3Crect width=%22120%22 height=%2260%22 fill=%22green%22/%3E%3C/svg%3E">';
      document.querySelector('#storybook-root')!.append(landscape);
    });
    await expect(page.getByRole('img', { name: 'Landscape subject' })).toHaveCount(1);
    await expect.poll(() => page.locator('img[data-landscape]').evaluate((image: HTMLImageElement) => image.complete))
      .toBe(true);

    const images = await page.locator('sk-entity-marker').evaluateAll((elements) =>
      elements.map((element) => {
        const image = element.querySelector<HTMLImageElement>('img')!;
        const content = element.shadowRoot!.querySelector<HTMLElement>('[part="content"]')!;
        const marker = element.shadowRoot!.querySelector<HTMLElement>('[part="marker"]')!;
        const imageRect = image.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const style = getComputedStyle(image);
        return {
          natural: [image.naturalWidth, image.naturalHeight],
          fit: style.objectFit,
          contained:
            Math.abs(imageRect.width - contentRect.width) <= 1 &&
            Math.abs(imageRect.height - contentRect.height) <= 1 &&
            imageRect.left >= contentRect.left - 1 &&
            imageRect.right <= contentRect.right + 1,
          clipped: getComputedStyle(marker).overflow === 'hidden',
        };
      }),
    );
    expect(images).toHaveLength(2);
    expect(images[0]!.natural[1]).toBeGreaterThan(images[0]!.natural[0]);
    expect(images[1]!.natural[0]).toBeGreaterThan(images[1]!.natural[1]);
    expect(images.every(({ fit, contained, clipped }) => fit === 'cover' && contained && clipped)).toBe(true);
  });

  test('preserves decorative and trimmed long-label behavior without changing geometry', async ({ page }) => {
    await openStory(page, 'elements-skentitymarker--decorative');
    const decorative = page.locator('sk-entity-marker');
    await expect(decorative.getByRole('img')).toHaveCount(0);
    await expect(decorative.locator('[part="marker"]')).toHaveAttribute('aria-hidden', 'true');

    await openStory(page, 'elements-skentitymarker--long-label');
    const meaningful = page.locator('sk-entity-marker');
    const before = await meaningful.locator('[part="marker"]').boundingBox();
    await meaningful.evaluate(async (element) => {
      const marker = element as HTMLElement & { label: string; updateComplete: Promise<unknown> };
      marker.label = '  A deliberately long consumer-authored accessible name  ';
      await marker.updateComplete;
    });
    await expect(page.getByRole('img', { name: 'A deliberately long consumer-authored accessible name' })).toHaveCount(1);
    expect(await meaningful.locator('[part="marker"]').boundingBox()).toEqual(before);
  });
});

test.describe('marker-only pulse and user preferences', () => {
  test('reflects pulse per host, never animates text and keeps no-marker states empty', async ({ page }) => {
    await openStory(page, 'elements-skstatusindicator--pulsing-states');
    const indicators = page.locator('sk-status-indicator');
    await expect(indicators).toHaveCount(3);
    const beforeText = await indicators.allTextContents();

    const state = await indicators.evaluateAll((elements) =>
      elements.map((element) => {
        const marker = element.shadowRoot!.querySelector<HTMLElement>('[part="marker"]')!;
        const text = element.shadowRoot!.querySelector<HTMLElement>('[part="text"]')!;
        return {
          pulsing: element.hasAttribute('pulsing'),
          markerHidden: marker.hidden,
          markerAnimation: getComputedStyle(marker).animationName,
          textAnimation: getComputedStyle(text).animationName,
        };
      }),
    );
    expect(state[0]!.pulsing).toBe(false);
    expect(state[1]!.pulsing).toBe(true);
    expect(state[0]!.markerAnimation).toBe('none');
    expect(state[1]!.markerAnimation).toContain('sk-status-indicator-pulse');
    expect(state.every(({ textAnimation }) => textAnimation === 'none')).toBe(true);
    expect(state[2]!.markerHidden).toBe(true);

    await indicators.nth(0).evaluate(async (element) => {
      const status = element as HTMLElement & { pulsing: boolean; updateComplete: Promise<unknown> };
      status.pulsing = true;
      await status.updateComplete;
    });
    await expect(indicators.nth(0)).toHaveAttribute('pulsing', '');
    await indicators.nth(0).evaluate(async (element) => {
      const status = element as HTMLElement & { pulsing: boolean; updateComplete: Promise<unknown> };
      status.pulsing = false;
      await status.updateComplete;
    });
    await expect(indicators.nth(0)).not.toHaveAttribute('pulsing');
    expect(await indicators.allTextContents()).toEqual(beforeText);
  });

  test('keeps all six tones and multiple pulse instances independent', async ({ page }) => {
    await openStory(page, 'elements-skstatusindicator--multiple-pulsing-all-tones');
    const indicators = page.locator('sk-status-indicator');
    await expect(indicators).toHaveCount(6);
    expect(await indicators.evaluateAll((elements) =>
      elements.map((element) => element.shadowRoot!.querySelector('[part="status"]')!.getAttribute('data-tone')),
    )).toEqual(['neutral', 'info', 'success', 'attention', 'danger', 'recovery']);

    await indicators.nth(0).evaluate(async (element) => {
      const status = element as HTMLElement & { pulsing: boolean; updateComplete: Promise<unknown> };
      status.pulsing = false;
      await status.updateComplete;
    });
    expect(await indicators.evaluateAll((elements) => elements.map((element) => element.hasAttribute('pulsing'))))
      .toEqual([false, true, true, true, true, true]);
  });

  test('uses differential static reduced-motion and forced-colors emphasis', async ({ page }) => {
    const markerPaint = (indicator: Locator) => indicator.locator('[part="marker"]').evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        animationName: style.animationName,
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        outlineOffset: Number.parseFloat(style.outlineOffset),
      };
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, 'elements-skstatusindicator--pulsing-preferences');
    let indicators = page.locator('sk-status-indicator');
    let off = await markerPaint(indicators.nth(0));
    let on = await markerPaint(indicators.nth(1));
    expect(on.animationName).toBe('none');
    expect(off.outlineStyle).toBe('none');
    expect(on.outlineStyle).not.toBe('none');
    expect(`${on.outlineStyle}|${on.outlineWidth}|${on.outlineOffset}`)
      .not.toBe(`${off.outlineStyle}|${off.outlineWidth}|${off.outlineOffset}`);

    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
    await openStory(page, 'elements-skstatusindicator--pulsing-preferences');
    indicators = page.locator('sk-status-indicator');
    off = await markerPaint(indicators.nth(0));
    on = await markerPaint(indicators.nth(1));
    expect(off.outlineStyle).toBe('solid');
    expect(on.outlineStyle).toBe('double');
    expect(`${on.outlineStyle}|${on.outlineWidth}`).not.toBe(`${off.outlineStyle}|${off.outlineWidth}`);
    expect(await indicators.locator('[part="text"]').evaluateAll((nodes) =>
      nodes.every((node) => getComputedStyle(node).animationName === 'none'),
    )).toBe(true);
  });
});
