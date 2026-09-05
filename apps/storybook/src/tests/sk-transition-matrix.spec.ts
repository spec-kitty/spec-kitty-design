import { expect, test, type Page } from '@playwright/test';
import { getViolations, injectAxe } from 'axe-playwright';
import { readFileSync } from 'node:fs';

const TRANSITION_MATRIX_CSS = 'packages/styles/src/transition-matrix/sk-transition-matrix.css';

const story = async (page: Page, id: string, selector = 'table') => {
  await page.goto(`/iframe.html?id=elements-sktransitionmatrix--${id}&viewMode=story`);
  const host = page.locator('sk-transition-matrix').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host.locator(selector)).toBeVisible();
  return host;
};

const axeIsClean = async (page: Page, label: string) => {
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

test('ApprovedExample renders the clean-v4 aggregate facts and excludes current inventory', async ({ page }) => {
  const host = await story(page, 'approved-example');
  await expect(host.locator('[data-route-id]')).toHaveCount(6);
  await expect(host.locator('[data-value]')).toHaveCount(24);
  await expect(host.locator('[data-route-total]')).toHaveText(['21', '17', '11', '6', '4', '3']);
  await expect(host.locator('[data-overall-total]')).toContainText('62 moves · last 72 hours');
  await expect(host.locator('[id$="-description"]')).toHaveText('Moves grouped by route and day.');
  await expect(host.locator('[id$="-selection-hint"]')).toHaveText('Select any row to inspect its WPs.');
  expect(await host.locator('[part~="legend"] [data-tone]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-tone')),
  )).toEqual(['forward', 'completed', 'blocked', 'recovery', 'backward']);
  await expect(host.locator('[part~="group"]')).toHaveText('Exceptions & recovery');
  await expect(host).not.toContainText('Current / 50 open WPs');
  await expect(host).not.toContainText('50 open WPs');
});

test('Default owns no clean-v4 duration, date, day, or WP copy', async ({ page }) => {
  const host = await story(page, 'default');
  const text = await host.textContent();
  expect(text).not.toMatch(/last 72 hours|Today · Fri 4|route and day|WPs/);
});

test('Default dark and LightMode preserve equivalent content and table relationships with token-driven theme variance', async ({ page }) => {
  const facts = async (id: string) => {
    const host = await story(page, id);
    return host.evaluate((element) => {
      const root = element.shadowRoot!;
      const section = root.querySelector<HTMLElement>('.sk-transition-matrix')!;
      const title = root.querySelector<HTMLElement>('.sk-transition-matrix__title')!;
      const hostStyle = getComputedStyle(element);
      const sectionStyle = getComputedStyle(section);
      const titleStyle = getComputedStyle(title);
      const computedHostToken = (token: string) => {
        const probe = document.createElement('span');
        probe.style.color = `var(${token})`;
        root.append(probe);
        const colour = getComputedStyle(probe).color;
        probe.remove();
        return colour;
      };
      const toneTokens = {
        forward: computedHostToken('--sk-color-blue'),
        completed: computedHostToken('--sk-color-green'),
        blocked: computedHostToken('--sk-color-red'),
        recovery: computedHostToken('--sk-color-purple'),
        backward: computedHostToken('--sk-fg-muted'),
      };
      const tones = [...root.querySelectorAll<HTMLElement>('[part~="legend"] [data-tone]')].map((legendItem) => {
        const tone = legendItem.dataset.tone!;
        const row = root.querySelector<HTMLElement>(`[data-route-id][data-tone="${tone}"]`)!;
        const legendIcon = legendItem.querySelector<HTMLElement>('.sk-transition-matrix__icon')!;
        const routeIcon = row.querySelector<HTMLElement>('.sk-transition-matrix__icon')!;
        return {
          tone,
          colour: getComputedStyle(row).color,
          legendColour: getComputedStyle(legendIcon).color,
          legendLabel: legendItem.textContent?.trim(),
          legendHasIcon: legendIcon.querySelector('svg') !== null,
          routeLabel: row.querySelector('[part~="route"]')?.textContent?.trim(),
          routeHasIcon: routeIcon.querySelector('svg') !== null,
        };
      });
      return {
        content: {
          heading: title.textContent,
          measure: root.querySelector('[data-overall-total]')?.textContent,
          description: root.querySelector('[id$="-description"]')?.textContent ?? null,
          hint: root.querySelector('[id$="-selection-hint"]')?.textContent ?? null,
          columns: [...root.querySelectorAll('thead th')].map((node) => node.textContent),
          rows: [...root.querySelectorAll<HTMLElement>('[data-route-id]')].map((row) => ({
            route: row.querySelector('[part~="route"]')?.textContent?.trim(),
            selected: row.getAttribute('aria-selected'),
            values: [...row.querySelectorAll<HTMLElement>('[data-value]')].map((cell) => Number(cell.dataset.value)),
            total: Number(row.querySelector<HTMLElement>('[data-route-total]')?.dataset.routeTotal),
          })),
          legend: [...root.querySelectorAll<HTMLElement>('[part~="legend"] [data-tone]')].map((node) => node.dataset.tone),
          groups: [...root.querySelectorAll('[part~="group"]')].map((node) => node.textContent),
          accessibleGroups: [...root.querySelectorAll<HTMLElement>('[part~="group"]')].map((heading) => ({
            label: heading.textContent,
            labelsBody: heading.id !== '' && heading.closest('tbody')?.getAttribute('aria-labelledby') === heading.id,
          })),
          selectable: element.hasAttribute('selectable'),
          tabStops: root.querySelectorAll('[tabindex]').length,
        },
        theme: {
          hostSurfaceToken: hostStyle.getPropertyValue('--sk-surface-card').trim(),
          shadowSurfaceToken: sectionStyle.getPropertyValue('--sk-surface-card').trim(),
          hostForegroundToken: hostStyle.getPropertyValue('--sk-fg-default').trim(),
          shadowForegroundToken: titleStyle.getPropertyValue('--sk-fg-default').trim(),
          surface: sectionStyle.backgroundColor,
          foreground: titleStyle.color,
          tones,
          toneTokens,
        },
      };
    });
  };

  const dark = await facts('default');
  const light = await facts('light-mode');
  expect(light.content).toEqual(dark.content);
  expect(dark.theme.shadowSurfaceToken).toBe(dark.theme.hostSurfaceToken);
  expect(light.theme.shadowSurfaceToken).toBe(light.theme.hostSurfaceToken);
  expect(dark.theme.shadowForegroundToken).toBe(dark.theme.hostForegroundToken);
  expect(light.theme.shadowForegroundToken).toBe(light.theme.hostForegroundToken);
  expect(light.theme.surface).not.toBe(dark.theme.surface);
  expect(light.theme.foreground).not.toBe(dark.theme.foreground);
  for (const content of [dark.content, light.content]) {
    expect(content.groups).toEqual(['Exceptions & recovery']);
    expect(content.accessibleGroups).toEqual([{ label: 'Exceptions & recovery', labelsBody: true }]);
  }
  const expectedToneLabels = {
    forward: 'Forward',
    completed: 'Completed',
    blocked: 'Blocked',
    recovery: 'Recovery',
    backward: 'Backward',
  };
  const expectedRouteLabels = {
    forward: 'Queued → Active',
    completed: 'Active → Complete',
    blocked: 'Any state → Blocked',
    recovery: 'Blocked → Active',
    backward: 'Any state → Previous state',
  };
  for (const theme of [dark.theme, light.theme]) {
    expect(theme.tones.map(({ tone }) => tone)).toEqual(Object.keys(expectedToneLabels));
    for (const tone of theme.tones) {
      const expectedToken = theme.toneTokens[tone.tone as keyof typeof theme.toneTokens];
      expect(tone.colour).toBe(expectedToken);
      expect(tone.colour).toBe(tone.legendColour);
      expect(tone.legendLabel).toBe(expectedToneLabels[tone.tone as keyof typeof expectedToneLabels]);
      expect(tone.legendHasIcon).toBe(true);
      expect(tone.routeLabel).toBe(expectedRouteLabels[tone.tone as keyof typeof expectedRouteLabels]);
      expect(tone.routeHasIcon).toBe(true);
    }
    expect(new Set(theme.tones.map(({ colour }) => colour)).size).toBe(5);
  }
});

test('ControlledSelection and LightMode remain non-empty and axe-clean', async ({ page }) => {
  await story(page, 'controlled-selection');
  await axeIsClean(page, 'controlled selection');
  await story(page, 'light-mode');
  await axeIsClean(page, 'light mode');
});

test('FiftyActiveWPs uses aggregate routes and exposes no per-WP target', async ({ page }) => {
  const host = await story(page, 'fifty-active-w-ps');
  await expect(host.locator('[data-route-id]')).toHaveCount(6);
  await expect(host.locator('[tabindex]')).toHaveCount(0);
  const facts = await host.evaluate((element) => ({
    text: element.shadowRoot?.textContent ?? '',
    routeIds: [...(element.shadowRoot?.querySelectorAll('[data-route-id]') ?? [])].map((row) => row.getAttribute('data-route-id')),
    connectors: element.shadowRoot?.querySelectorAll('[data-wp-id], [data-edge], [data-connector]').length ?? -1,
  }));
  expect(facts.routeIds).toEqual(['planned-progress', 'progress-review', 'review-done', 'blocked', 'recovery', 'backward']);
  expect(facts.connectors).toBe(0);
  expect(facts.text).not.toMatch(/wp-[0-9]+|open WPs/i);
});

test('pointer, Enter, and Space emit equal controlled non-cancelable intent without key-repeat duplication', async ({ page }) => {
  const host = await story(page, 'approved-example');
  const events = await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & { updateComplete: Promise<unknown>; selectedRouteId?: string };
    const row = matrix.shadowRoot!.querySelector<HTMLElement>('[data-route-id="progress-review"]')!;
    const seen: Array<{ detail: unknown; bubbles: boolean; composed: boolean; cancelable: boolean }> = [];
    matrix.addEventListener('sk-transition-matrix-select', (event) => {
      const custom = event as CustomEvent;
      seen.push({ detail: custom.detail, bubbles: custom.bubbles, composed: custom.composed, cancelable: custom.cancelable });
    });
    matrix.selectedRouteId = 'planned-progress';
    await matrix.updateComplete;
    row.click();
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, repeat: true }));
    await matrix.updateComplete;
    return { seen, selected: matrix.selectedRouteId, rendered: matrix.shadowRoot!.querySelector('[aria-selected="true"]')?.getAttribute('data-route-id') };
  });
  expect(events.seen).toEqual(Array.from({ length: 3 }, () => ({ detail: { routeId: 'progress-review' }, bubbles: true, composed: true, cancelable: false })));
  expect(events.selected).toBe('planned-progress');
  expect(events.rendered).toBe('planned-progress');
});

test('non-selectable selected data has zero interaction residue', async ({ page }) => {
  await story(page, 'selectable-states');
  const disabled = page.locator('sk-transition-matrix[data-disabled-analogue]').first();
  const row = disabled.locator('[data-route-id]').first();
  const route = row.locator('[part~="route"]');
  const styles = async () => ({
    cursor: await row.evaluate((node) => getComputedStyle(node).cursor),
    background: await route.evaluate((node) => getComputedStyle(node).backgroundColor),
    border: await route.evaluate((node) => getComputedStyle(node).borderColor),
    boxShadow: await route.evaluate((node) => getComputedStyle(node).boxShadow),
    outline: await row.evaluate((node) => `${getComputedStyle(node).outlineStyle} ${getComputedStyle(node).outlineWidth} ${getComputedStyle(node).outlineColor}`),
  });
  await disabled.evaluate((element) => {
    (window as typeof window & { __nonSelectableEvents?: number }).__nonSelectableEvents = 0;
    element.addEventListener('sk-transition-matrix-select', () => {
      const target = window as typeof window & { __nonSelectableEvents?: number };
      target.__nonSelectableEvents = (target.__nonSelectableEvents ?? 0) + 1;
    });
  });
  const before = await styles();
  await row.hover();
  const hovered = await styles();
  const box = await row.boundingBox();
  expect(box).not.toBe(null);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  const pointerDown = await styles();
  await expect(row).not.toHaveAttribute('data-pressed');
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await row.focus();
  const focused = await styles();
  expect(await disabled.evaluate((element) => element.shadowRoot?.activeElement)).toBe(null);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  const afterKeyboard = await styles();
  await expect(disabled.locator('[tabindex]')).toHaveCount(0);
  await expect(disabled.locator('[id$="-selection-hint"]')).toHaveCount(0);
  await expect(row).not.toHaveAttribute('data-pressed');
  expect(hovered).toEqual(before);
  expect(pointerDown).toEqual(before);
  expect(focused).toEqual(before);
  expect(afterKeyboard).toEqual(before);
  expect(before.cursor).not.toBe('pointer');
  expect(await page.evaluate(() => (window as typeof window & { __nonSelectableEvents?: number }).__nonSelectableEvents)).toBe(0);
});

test('selectable rows expose positive hover, keyboard focus-visible, and active or pressed deltas', async ({ page }) => {
  await story(page, 'selectable-states');
  const host = page.locator('sk-transition-matrix[data-selectable-states]').first();
  const row = host.locator('[data-route-id="planned-progress"]');
  const route = row.locator('[part~="route"]');
  const styles = async () => ({
    cursor: await row.evaluate((node) => getComputedStyle(node).cursor),
    background: await route.evaluate((node) => getComputedStyle(node).backgroundColor),
    border: await route.evaluate((node) => getComputedStyle(node).borderColor),
    outline: await row.evaluate((node) => `${getComputedStyle(node).outlineStyle} ${getComputedStyle(node).outlineWidth} ${getComputedStyle(node).outlineColor}`),
  });
  const rest = await styles();
  await axeIsClean(page, 'selectable rest');

  await row.hover();
  const hover = await styles();
  expect(hover.cursor).toBe('pointer');
  expect(hover.background).not.toBe(rest.background);
  await axeIsClean(page, 'selectable hover');

  await row.focus();
  const focused = await styles();
  expect(focused.outline).not.toBe(rest.outline);
  expect(focused.outline).not.toContain('none');
  await axeIsClean(page, 'selectable keyboard focus-visible');

  const box = await row.boundingBox();
  expect(box).not.toBe(null);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(row).toHaveAttribute('data-pressed', 'true');
  const pointerActive = await styles();
  expect(pointerActive.background).not.toBe(hover.background);
  await axeIsClean(page, 'selectable pointer active');
  await page.mouse.up();
  await expect(row).not.toHaveAttribute('data-pressed');

  await row.focus();
  await page.keyboard.down('Space');
  await expect(row).toHaveAttribute('data-pressed', 'true');
  const keyboardPressed = await styles();
  expect(keyboardPressed.background).not.toBe(focused.background);
  await axeIsClean(page, 'selectable keyboard pressed');
  await page.keyboard.up('Space');
  await expect(row).not.toHaveAttribute('data-pressed');
  await page.keyboard.press('Tab');
  await expect(row).not.toHaveAttribute('data-pressed');
});

test('real pointer and keyboard releases cannot resurrect a press after disable or route replacement', async ({ page }) => {
  await story(page, 'selectable-states');
  const host = page.locator('sk-transition-matrix[data-selectable-states]').first();
  const pointerRow = host.locator('[data-route-id="planned-progress"]');
  const pointerBox = await pointerRow.boundingBox();
  expect(pointerBox).not.toBe(null);

  await page.mouse.move(
    pointerBox!.x + pointerBox!.width / 2,
    pointerBox!.y + pointerBox!.height / 2,
  );
  await page.mouse.down();
  await expect(pointerRow).toHaveAttribute('data-pressed', 'true');
  await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & { selectable: boolean; updateComplete: Promise<unknown> };
    matrix.selectable = false;
    await matrix.updateComplete;
  });
  await expect(pointerRow).not.toHaveAttribute('data-pressed');
  await page.mouse.up();
  await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & { selectable: boolean; updateComplete: Promise<unknown> };
    matrix.selectable = true;
    await matrix.updateComplete;
  });
  await expect(pointerRow).not.toHaveAttribute('data-pressed');

  const keyboardRow = host.locator('[data-route-id="progress-review"]');
  await keyboardRow.focus();
  await page.keyboard.down('Space');
  await expect(keyboardRow).toHaveAttribute('data-pressed', 'true');
  await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & { selectable: boolean; updateComplete: Promise<unknown> };
    matrix.selectable = false;
    await matrix.updateComplete;
  });
  await expect(keyboardRow).not.toHaveAttribute('data-pressed');
  await page.keyboard.up('Space');
  await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & { selectable: boolean; updateComplete: Promise<unknown> };
    matrix.selectable = true;
    await matrix.updateComplete;
  });
  await expect(keyboardRow).not.toHaveAttribute('data-pressed');

  const routes = await host.evaluate((element) =>
    (element as HTMLElement & { routes: ReadonlyArray<unknown> }).routes,
  );
  await keyboardRow.focus();
  await page.keyboard.down('Space');
  await expect(keyboardRow).toHaveAttribute('data-pressed', 'true');
  await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & {
      routes: ReadonlyArray<{ id: string }>;
      updateComplete: Promise<unknown>;
    };
    matrix.routes = matrix.routes.filter((route) => route.id !== 'progress-review');
    await matrix.updateComplete;
  });
  await expect(host.locator('[data-pressed]')).toHaveCount(0);
  await page.keyboard.up('Space');
  await host.evaluate(async (element, originalRoutes) => {
    const matrix = element as HTMLElement & {
      routes: ReadonlyArray<unknown>;
      updateComplete: Promise<unknown>;
    };
    matrix.routes = originalRoutes;
    await matrix.updateComplete;
  }, routes);
  await expect(host.locator('[data-route-id="progress-review"]')).not.toHaveAttribute('data-pressed');
});

test('an invalid matrix clears pointer press state before valid data is restored', async ({ page }) => {
  await story(page, 'selectable-states');
  const host = page.locator('sk-transition-matrix[data-selectable-states]').first();
  const row = host.locator('[data-route-id="planned-progress"]');
  const box = await row.boundingBox();
  expect(box).not.toBe(null);

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(row).toHaveAttribute('data-pressed', 'true');
  await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & {
      routes: ReadonlyArray<{ id: string; label: string; tone: string; values: Record<string, number> }>;
      updateComplete: Promise<unknown>;
    };
    matrix.routes = matrix.routes.map((route, index) =>
      index === 0 ? { ...route, values: { 'tue-1': 3 } } : route,
    );
    await matrix.updateComplete;
  });
  await expect(host.locator('[part~="empty-state"]')).toBeVisible();
  await expect(host.locator('[data-pressed]')).toHaveCount(0);
  await page.mouse.up();

  await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & {
      routes: ReadonlyArray<{ id: string; label: string; tone: string; values: Record<string, number> }>;
      updateComplete: Promise<unknown>;
    };
    matrix.routes = matrix.routes.map((route, index) =>
      index === 0
        ? { ...route, values: { 'tue-1': 3, 'wed-2': 6, 'thu-3': 7, 'fri-4': 5 } }
        : route,
    );
    await matrix.updateComplete;
  });
  await expect(host.locator('[data-route-id="planned-progress"]')).not.toHaveAttribute('data-pressed');
});

test('ratios are exact, zero remains zero, and a maximum-changing reassignment recomputes them', async ({ page }) => {
  const host = await story(page, 'approved-example');
  const facts = await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & { routes: ReadonlyArray<unknown>; updateComplete: Promise<unknown> };
    const initial = [...matrix.shadowRoot!.querySelectorAll<HTMLElement>('[data-value]')].map((node) => ({ value: Number(node.dataset.value), ratio: Number(node.dataset.ratio) }));
    matrix.routes = [{ id: 'replacement', label: 'Replacement', tone: 'forward', values: { 'tue-1': 2, 'wed-2': 4, 'thu-3': 8, 'fri-4': 16 } }];
    await matrix.updateComplete;
    const replaced = [...matrix.shadowRoot!.querySelectorAll<HTMLElement>('[data-ratio]')].map((node) => Number(node.dataset.ratio));
    return {
      initial,
      replaced,
      replacementRouteTotal: Number(matrix.shadowRoot!.querySelector<HTMLElement>('[data-route-total]')?.dataset.routeTotal),
      replacementOverallText: matrix.shadowRoot!.querySelector('[data-overall-total]')?.textContent,
    };
  });
  for (const cell of facts.initial) expect(cell.ratio).toBe(cell.value / 7);
  expect(facts.initial.filter((cell) => cell.value === 0).every((cell) => cell.ratio === 0)).toBe(true);
  expect(facts.replaced).toEqual([0.125, 0.25, 0.5, 1]);
  expect(facts.replacementRouteTotal).toBe(30);
  expect(facts.replacementOverallText).toContain('30 moves');
});

test('narrow scrolling keeps the sticky route owner visible without overlap', async ({ page }) => {
  expect(readFileSync(TRANSITION_MATRIX_CSS, 'utf8')).not.toMatch(/\bz-index\s*:/);
  await page.setViewportSize({ width: 390, height: 844 });
  const host = await story(page, 'approved-example');
  const scroller = host.locator('[part~="scroller"]');
  const route = host.locator('[data-route-id="planned-progress"] [part~="route"]');
  const cell = host.locator('[data-route-id="planned-progress"] [data-value]').last();
  const inspectPaintOwnership = async (state: string) => host.evaluate((element, stateLabel) => {
    const root = element.shadowRoot!;
    const viewport = root.querySelector<HTMLElement>('[part~="scroller"]')!.getBoundingClientRect();
    const routeOwners = [...root.querySelectorAll<HTMLElement>('.sk-transition-matrix__route')];
    const failures: Array<{ state: string; owner: string; coveredBy: string; hit: string }> = [];
    const owners: Array<{ label: string; overlaps: number }> = [];
    let overlaps = 0;

    for (const owner of routeOwners) {
      const ownerRect = owner.getBoundingClientRect();
      const row = owner.parentElement!;
      let ownerOverlaps = 0;
      const candidates = [...row.children]
        .filter((candidate) => candidate !== owner)
        .flatMap((candidate) => [
          candidate,
          ...candidate.querySelectorAll('.sk-transition-matrix__bar, .sk-transition-matrix__value'),
        ]) as HTMLElement[];

      for (const candidate of candidates) {
        const candidateRect = candidate.getBoundingClientRect();
        const left = Math.max(ownerRect.left, candidateRect.left, viewport.left);
        const right = Math.min(ownerRect.right, candidateRect.right, viewport.right);
        const top = Math.max(ownerRect.top, candidateRect.top, viewport.top);
        const bottom = Math.min(ownerRect.bottom, candidateRect.bottom, viewport.bottom);
        if (right - left < 1 || bottom - top < 1) continue;

        overlaps += 1;
        ownerOverlaps += 1;
        const hit = root.elementFromPoint((left + right) / 2, (top + bottom) / 2);
        if (hit !== owner && !owner.contains(hit)) {
          failures.push({
            state: stateLabel,
            owner: owner.textContent?.trim() ?? '',
            coveredBy: candidate.className,
            hit: hit instanceof Element ? hit.className : String(hit),
          });
        }
      }
      owners.push({ label: owner.textContent?.trim() ?? '', overlaps: ownerOverlaps });
    }

    return { overlaps, owners, failures };
  }, state);
  const before = await route.boundingBox();
  await scroller.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
  await expect.poll(() => scroller.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  const after = await route.boundingBox();
  const cellBox = await cell.boundingBox();
  const groupVisibility = await host.evaluate((element) => {
    const root = element.shadowRoot!;
    const viewport = root.querySelector<HTMLElement>('[part~="scroller"]')!.getBoundingClientRect();
    const group = root.querySelector<HTMLElement>('[part~="group"]')!;
    const range = document.createRange();
    range.selectNodeContents(group);
    const text = range.getBoundingClientRect();
    return {
      label: group.textContent?.trim(),
      textTransform: getComputedStyle(group).textTransform,
      text: { left: text.left, right: text.right, top: text.top, bottom: text.bottom },
      viewport: { left: viewport.left, right: viewport.right, top: viewport.top, bottom: viewport.bottom },
    };
  });
  expect(before).not.toBe(null);
  expect(after).not.toBe(null);
  expect(cellBox).not.toBe(null);
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(2);
  expect(after!.x + after!.width).toBeLessThanOrEqual(cellBox!.x + 1);
  expect(groupVisibility.label).toBe('Exceptions & recovery');
  expect(groupVisibility.textTransform).toBe('uppercase');
  expect(groupVisibility.text.left).toBeGreaterThanOrEqual(groupVisibility.viewport.left);
  expect(groupVisibility.text.right).toBeLessThanOrEqual(groupVisibility.viewport.right);
  expect(groupVisibility.text.top).toBeGreaterThanOrEqual(groupVisibility.viewport.top);
  expect(groupVisibility.text.bottom).toBeLessThanOrEqual(groupVisibility.viewport.bottom);

  const results = [await inspectPaintOwnership('rest')];
  await host.evaluate(async (element) => {
    const matrix = element as HTMLElement & { selectedRouteId?: string; updateComplete: Promise<unknown> };
    matrix.selectedRouteId = 'progress-review';
    await matrix.updateComplete;
  });
  results.push(await inspectPaintOwnership('selected'));

  const hoveredRoute = host.locator('[data-route-id="review-done"] [part~="route"]');
  const hoveredBox = await hoveredRoute.boundingBox();
  expect(hoveredBox).not.toBe(null);
  await page.mouse.move(hoveredBox!.x + hoveredBox!.width / 2, hoveredBox!.y + hoveredBox!.height / 2);
  results.push(await inspectPaintOwnership('hovered'));

  const pressedRoute = host.locator('[data-route-id="recovery"] [part~="route"]');
  const pressedBox = await pressedRoute.boundingBox();
  expect(pressedBox).not.toBe(null);
  await page.mouse.move(pressedBox!.x + pressedBox!.width / 2, pressedBox!.y + pressedBox!.height / 2);
  await page.mouse.down();
  await expect(host.locator('[data-route-id="recovery"]')).toHaveAttribute('data-pressed', 'true');
  results.push(await inspectPaintOwnership('pressed'));
  await page.mouse.up();

  expect(results.every(({ overlaps, owners }) =>
    overlaps > 0 && owners.length === 7 && owners.every((owner) => owner.overlaps > 0),
  )).toBe(true);
  expect(results.flatMap(({ failures }) => failures)).toEqual([]);
});

test('reduced motion preserves every move and route without animation dependency', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const host = await story(page, 'approved-example');
  await expect(host.locator('[data-value]')).toHaveCount(24);
  await expect(host.locator('[data-route-id]')).toHaveCount(6);
  expect(await host.locator('[part~="bar"]').first().evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
});
