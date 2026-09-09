import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const STORY_PREFIX = 'patterns-mission-kanban--';
const STORY_SOURCE = 'packages/elements/src/patterns/mission-kanban.stories.ts';
const STAGES = ['planned', 'doing', 'for_review', 'approved', 'done'] as const;
const STAGE_LABELS = ['Planned', 'Doing', 'For review', 'Approved', 'Done'] as const;
const STORY_IDS = [
  'default',
  'forced-colors',
  'k-2-narrow-contained',
  'k-3-detailed-lane-filters',
  'k-4-snapshot-behind-log',
  'k-5-observed-not-yet-pushed',
  'k-6-stable-empty-board',
  'light-mode',
  'long-content',
  'reduced-motion',
] as const;
type StoryId = typeof STORY_IDS[number];

const WORK_PACKAGES = [
  ['WP04', 'planned', 'implementer-ivan', '1051', 'neutral'],
  ['WP05', 'blocked', 'researcher-robbie', '1054', 'danger'],
  ['WP06', 'planned', 'implementer-ivan', '', 'neutral'],
  ['WP03', 'in_progress', 'implementer-ivan', '1048', 'info'],
  ['WP07', 'claimed', 'reviewer-rachel', '', 'info'],
  ['WP08', 'in_progress', 'implementer-ivan', '', 'info'],
  ['WP09', 'in_progress', 'implementer-ivan', '', 'info'],
  ['WP02', 'for_review', 'reviewer-rachel', '1046', 'recovery'],
  ['WP10', 'in_review', 'reviewer-rachel', '', 'recovery'],
  ['WP11', 'for_review', 'reviewer-rachel', '', 'recovery'],
  ['WP01', 'approved', 'reviewer-rachel', '1043', 'success'],
  ['WP12', 'done', 'implementer-ivan', '', 'success'],
  ['WP13', 'done', 'implementer-ivan', '', 'success'],
  ['WP14', 'done', 'implementer-ivan', '', 'success'],
  ['WP15', 'done', 'implementer-ivan', '', 'success'],
] as const;

async function openStory(
  page: Page,
  id: StoryId,
  viewport: { width: number; height: number } = { width: 1600, height: 1000 },
): Promise<Locator> {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=${STORY_PREFIX}${id}&viewMode=story`);
  const root = page.locator('[data-mission-kanban-pattern]');
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  await expect(root).toHaveAttribute('data-play-proof', 'passed');
  await page.evaluate(() => document.fonts.ready);
  return root;
}

async function documentGeometry(page: Page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
}

async function focusGeometry(control: Locator) {
  return control.evaluate((node) => {
    const subpixelTolerance = 1;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const extent = Math.max(
      0,
      Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset),
    );
    const composedParent = (element: Element): Element | null => {
      if (element.parentElement) return element.parentElement;
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    };
    let clipped = false;
    const clippingAncestors: Array<{
      name: string;
      left: number;
      right: number;
      clientWidth: number;
      scrollLeft: number;
      scrollWidth: number;
    }> = [];
    for (let ancestor = composedParent(node); ancestor; ancestor = composedParent(ancestor)) {
      const ancestorStyle = getComputedStyle(ancestor);
      const clipsX = ['hidden', 'clip', 'auto', 'scroll'].includes(ancestorStyle.overflowX);
      const clipsY = ['hidden', 'clip', 'auto', 'scroll'].includes(ancestorStyle.overflowY);
      if (!clipsX && !clipsY) continue;
      const ancestorRect = ancestor.getBoundingClientRect();
      const boundary = {
        left: ancestorRect.left,
        right: ancestorRect.right,
        top: ancestorRect.top,
        bottom: ancestorRect.bottom,
      };
      clippingAncestors.push({
        name: ancestor.getAttribute('data-board-scroller') !== null
          ? 'board-scroller'
          : ancestor.localName,
        left: boundary.left,
        right: boundary.right,
        clientWidth: ancestor.clientWidth,
        scrollLeft: ancestor.scrollLeft,
        scrollWidth: ancestor.scrollWidth,
      });
      if (
        (clipsX && (
          rect.left - extent < boundary.left - subpixelTolerance ||
          rect.right + extent > boundary.right + subpixelTolerance
        )) ||
        (clipsY && (
          rect.top - extent < boundary.top - subpixelTolerance ||
          rect.bottom + extent > boundary.bottom + subpixelTolerance
        ))
      ) clipped = true;
    }
    return {
      clipped,
      clippingAncestors,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      outlineExtent: extent,
      rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
      viewport: {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      },
      withinViewport:
        rect.left - extent >= -subpixelTolerance &&
        rect.right + extent <= document.documentElement.clientWidth + subpixelTolerance &&
        rect.top - extent >= -subpixelTolerance &&
        rect.bottom + extent <= document.documentElement.clientHeight + subpixelTolerance,
    };
  });
}

async function assertVisibleFocus(control: Locator): Promise<void> {
  await expect(control).toBeFocused();
  const geometry = await focusGeometry(control);
  expect(geometry.outlineStyle).not.toBe('none');
  expect(geometry.outlineWidth).toBeGreaterThan(0);
  expect(geometry.clipped, JSON.stringify(geometry)).toBe(false);
  expect(geometry.withinViewport, JSON.stringify(geometry)).toBe(true);
}

async function revealFocusedControlByKeyboard(page: Page, control: Locator): Promise<void> {
  await expect(control).toBeFocused();
  for (let index = 0; index < 48; index += 1) {
    const geometry = await focusGeometry(control);
    if (!geometry.clipped && geometry.withinViewport) {
      await assertVisibleFocus(control);
      return;
    }
    if (geometry.rect.bottom > geometry.viewport.height) {
      await page.keyboard.press('PageDown');
    } else if (geometry.rect.top < 0) {
      await page.keyboard.press('PageUp');
    }
    if (geometry.clipped || geometry.rect.right > geometry.viewport.width) {
      await page.keyboard.press('ArrowRight');
    }
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }
  await assertVisibleFocus(control);
}

async function focusByKeyboard(page: Page, control: Locator, maximumTabs = 96): Promise<void> {
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  for (let index = 0; index < maximumTabs; index += 1) {
    await page.keyboard.press('Tab');
    if (await control.evaluate((node) => node.matches(':focus'))) return;
  }
  throw new Error(`Keyboard traversal did not reach target after ${maximumTabs} Tab presses.`);
}

type ObserverProbeSnapshot = Readonly<{
  documentTimeOrigin: number;
  constructed: number;
  observedTargets: number;
  disconnectedTargets: number;
  activeTargetIds: ReadonlyArray<number>;
  detachedActiveTargetIds: ReadonlyArray<number>;
  disconnectedTargetIds: ReadonlyArray<number>;
}>;

async function installObserverProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const NativeResizeObserver = window.ResizeObserver;
    const targetIds = new WeakMap<Element, number>();
    const activeTargets = new Set<Element>();
    const disconnectedTargetIds = new Set<number>();
    let constructed = 0;
    let observedTargets = 0;
    let disconnectedTargets = 0;
    let nextTargetId = 1;
    const targetId = (target: Element) => {
      const current = targetIds.get(target);
      if (current !== undefined) return current;
      const next = nextTargetId;
      nextTargetId += 1;
      targetIds.set(target, next);
      return next;
    };

    class InstrumentedResizeObserver implements ResizeObserver {
      readonly nativeObserver: ResizeObserver;
      readonly scrollerTargets = new Set<Element>();

      constructor(callback: ResizeObserverCallback) {
        constructed += 1;
        this.nativeObserver = new NativeResizeObserver(callback);
      }

      observe(target: Element, options?: ResizeObserverOptions): void {
        this.nativeObserver.observe(target, options);
        if (!target.classList.contains('sk-workflow-board__scroller') || this.scrollerTargets.has(target)) return;
        this.scrollerTargets.add(target);
        activeTargets.add(target);
        observedTargets += 1;
        targetId(target);
      }

      unobserve(target: Element): void {
        this.nativeObserver.unobserve(target);
        if (!this.scrollerTargets.delete(target) || !activeTargets.delete(target)) return;
        disconnectedTargets += 1;
        disconnectedTargetIds.add(targetId(target));
      }

      disconnect(): void {
        this.nativeObserver.disconnect();
        for (const target of this.scrollerTargets) {
          if (!activeTargets.delete(target)) continue;
          disconnectedTargets += 1;
          disconnectedTargetIds.add(targetId(target));
        }
        this.scrollerTargets.clear();
      }
    }

    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: InstrumentedResizeObserver,
    });
    Object.defineProperty(window, '__missionKanbanObserverProbe', {
      configurable: true,
      value: {
        snapshot: () => {
          const activeTargetIds = [...activeTargets].map(targetId).sort((left, right) => left - right);
          return {
            documentTimeOrigin: performance.timeOrigin,
            constructed,
            observedTargets,
            disconnectedTargets,
            activeTargetIds,
            detachedActiveTargetIds: [...activeTargets]
              .filter((target) => !target.isConnected)
              .map(targetId)
              .sort((left, right) => left - right),
            disconnectedTargetIds: [...disconnectedTargetIds].sort((left, right) => left - right),
          };
        },
      },
    });
  });
}

type StorybookRemountSnapshot = Readonly<{
  requested: number;
  finished: number;
}>;

async function installStorybookRemountProbe(page: Page): Promise<void> {
  await page.evaluate((storyId) => {
    type StorybookChannel = {
      on: (event: string, listener: (payload: { storyId?: string }) => void) => void;
    };
    const manager = window as typeof window & {
      __STORYBOOK_ADDONS_CHANNEL__?: StorybookChannel;
      __missionKanbanRemountProbe?: { snapshot: () => StorybookRemountSnapshot };
    };
    const channel = manager.__STORYBOOK_ADDONS_CHANNEL__;
    if (!channel) throw new Error('Storybook manager channel was not available');
    let requested = 0;
    let finished = 0;
    channel.on('forceRemount', (payload) => {
      if (payload.storyId === storyId) requested += 1;
    });
    channel.on('storyFinished', (payload) => {
      if (payload.storyId === storyId) finished += 1;
    });
    manager.__missionKanbanRemountProbe = {
      snapshot: () => ({ requested, finished }),
    };
  }, `${STORY_PREFIX}k-6-stable-empty-board`);
}

async function storybookRemountSnapshot(page: Page): Promise<StorybookRemountSnapshot> {
  return page.evaluate(() => {
    const probe = (window as typeof window & {
      __missionKanbanRemountProbe?: { snapshot: () => StorybookRemountSnapshot };
    }).__missionKanbanRemountProbe;
    if (!probe) throw new Error('Storybook remount probe was not installed');
    return probe.snapshot();
  });
}

async function observerProbeSnapshot(frameDocument: Locator): Promise<ObserverProbeSnapshot> {
  return frameDocument.evaluate(() => {
    const probe = (window as typeof window & {
      __missionKanbanObserverProbe?: { snapshot: () => ObserverProbeSnapshot };
    }).__missionKanbanObserverProbe;
    if (!probe) throw new Error('Mission Kanban ResizeObserver probe was not installed');
    return probe.snapshot();
  });
}

test('[T001/T009] the built catalogue contains exactly the ten Mission Kanban stories', async ({
  request,
}) => {
  const response = await request.get('/index.json');
  expect(response.ok()).toBe(true);
  const index = await response.json() as { entries: Record<string, unknown> };
  const missionKanbanIds = Object.keys(index.entries)
    .filter((id) => id.startsWith(STORY_PREFIX))
    .filter((id) => !id.endsWith('--docs'))
    .sort();

  expect(missionKanbanIds).toEqual(STORY_IDS.map((id) => `${STORY_PREFIX}${id}`).sort());
});

test('[T002/T009] fixture guards, deep freeze, and source ownership invariants fail closed', async ({
  page,
}) => {
  const root = await openStory(page, 'default');
  await expect(root).toHaveAttribute('data-fixture-deeply-frozen', 'true');
  await expect(root).toHaveAttribute('data-projection-deeply-frozen', 'true');
  await expect(root).toHaveAttribute(
    'data-guard-proof',
    JSON.stringify({
      duplicateStageId: true,
      duplicateDetailedLaneId: true,
      duplicateWorkPackageId: true,
      duplicateRoute: true,
      blankRoute: true,
      duplicateTrackerControl: true,
      multipleStageMembership: true,
      wrongStageMembership: true,
    nonEmptyUnmappedLane: true,
    wrongDetailedLaneCounts: true,
    wrongStatusTone: true,
    wrongK3Selection: true,
      unknownSelection: true,
      unknownWorkPackage: true,
    }),
  );

  const directImmutabilityProof = await root.evaluate((node) => {
    type TestSeam = {
      fixture: {
        workPackages: Array<{ id: string }>;
      };
      projection: {
        stages: Array<{ workPackages: Array<{ id: string }> }>;
      };
      derive: () => {
        stages: Array<{ workPackages: Array<{ id: string }> }>;
      };
    };
    const seam = (node as HTMLElement & { __missionKanbanTestSeam?: TestSeam })
      .__missionKanbanTestSeam;
    if (!seam) return { available: false };

    const deeplyFrozen = (value: unknown): boolean => value === null || typeof value !== 'object' || (
      Object.isFrozen(value) && Object.values(value as Record<string, unknown>).every(deeplyFrozen)
    );
    const fixtureBefore = JSON.stringify(seam.fixture);
    const firstProjection = seam.derive();
    const firstBefore = JSON.stringify(firstProjection);
    let fixtureMutationBlocked = false;
    let projectionMutationThrew = false;
    try {
      fixtureMutationBlocked = !Reflect.set(seam.fixture.workPackages[0]!, 'id', 'WP99');
    } catch {
      fixtureMutationBlocked = true;
    }
    try {
      firstProjection.stages[0]!.workPackages.push({ id: 'WP99' });
    } catch {
      projectionMutationThrew = true;
    }
    const repeatedProjection = seam.derive();
    return {
      available: true,
      fixtureDeeplyFrozen: deeplyFrozen(seam.fixture),
      projectionDeeplyFrozen: deeplyFrozen(firstProjection),
      fixtureMutationBlocked,
      projectionMutationThrew,
      fixtureUnchanged: JSON.stringify(seam.fixture) === fixtureBefore,
      priorProjectionUnchanged: JSON.stringify(firstProjection) === firstBefore,
      repeatedProjectionEqual: JSON.stringify(repeatedProjection) === firstBefore,
      renderedProjectionIndependent: seam.projection !== firstProjection,
    };
  });
  expect(directImmutabilityProof).toEqual({
    available: true,
    fixtureDeeplyFrozen: true,
    projectionDeeplyFrozen: true,
    fixtureMutationBlocked: true,
    projectionMutationThrew: true,
    fixtureUnchanged: true,
    priorProjectionUnchanged: true,
    repeatedProjectionEqual: true,
    renderedProjectionIndependent: true,
  });

  const source = readFileSync(STORY_SOURCE, 'utf8');
  for (const forbidden of [
    /customElements\.define/,
    /<sk-mission-kanban\b/,
    /from\s+['"][^'"]*apps\//,
    /\.shadowRoot\b|\.renderRoot\b|getRootNode\(/,
    /@(?:click|change|input)=|addEventListener\(/,
    /\bfetch\s*\(|\bsetTimeout\s*\(|\bsetInterval\s*\(/,
    /localStorage|sessionStorage|history\.(?:pushState|replaceState)/,
    /\b(?:router|polling|dragAndDrop|blockedReason|estimate|priority|owner)\b/i,
    /\bselectable\b|sk-action-row-activate/,
    /\bconst\s+\w*(?:route|href)\w*\s*=\s*\(/i,
    /(?:animation|transition|scroll-behavior)\s*:/,
  ]) {
    expect(source, `forbidden Mission Kanban source surface: ${forbidden}`).not.toMatch(forbidden);
  }
  const localStyles = source.slice(
    source.indexOf('const PATTERN_STYLES'),
    source.indexOf('const renderContextNavigation'),
  );
  expect(localStyles).not.toMatch(/(?:color|background|border-color|outline-color)\s*:\s*(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i);
  expect(localStyles).not.toMatch(/\.sk-(?:action-row|app-shell|workflow-board|workflow-lane|notice|status-indicator|pill-tag|button)__/);
});

test('[T004] K1 has the exact native stage/list reduction and all supplied facts once', async ({
  page,
}) => {
  const root = await openStory(page, 'default');
  await expect(root).toHaveAttribute('data-stage-counts', '[3,4,3,1,4]');
  await expect(root).toHaveAttribute('data-detailed-lane-counts', '[0,2,1,3,2,1,1,4,1,0]');
  await expect(root).toHaveAttribute('data-work-package-ids', JSON.stringify(WORK_PACKAGES.map(([id]) => id)));
  const stages = root.locator('[data-committed-board] > [data-board-scroller] > [data-stage-id]');
  await expect(stages).toHaveCount(5);
  expect(await stages.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-stage-id')))).toEqual(STAGES);
  expect(await stages.locator(':scope > header > h3').allTextContents()).toEqual(STAGE_LABELS);

  for (const [index, expectedCount] of [3, 4, 3, 1, 4].entries()) {
    const stage = stages.nth(index);
    await expect(stage.locator(':scope > ol')).toHaveCount(1);
    await expect(stage.locator(':scope > ol > li')).toHaveCount(expectedCount);
    await expect(stage.locator(':scope > header .sk-workflow-lane__count')).toHaveText(String(expectedCount));
  }

  const renderedIds = await root.locator('[data-work-package-id]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-work-package-id')),
  );
  expect(renderedIds).toEqual(WORK_PACKAGES.map(([id]) => id));
  expect(new Set(renderedIds).size).toBe(15);

  for (const [id, lane, profile, tracker, tone] of WORK_PACKAGES) {
    const item = root.locator(`[data-work-package-id="${id}"]`);
    await expect(item).toHaveAttribute('data-committed-lane', lane);
    await expect(item.getByText(profile, { exact: true })).toBeVisible();
    await expect(item.locator('sk-status-indicator[slot="tags"]')).toHaveAttribute('tone', tone);
    const row = item.locator('sk-action-row');
    await expect(row).toHaveAttribute('layout', 'card');
    await expect(row).toHaveAttribute(
      'href',
      `/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/${id}/`,
    );
    await expect(row).not.toHaveAttribute('selectable', /.*/);
    const route = row.locator('[part="trigger"]');
    await expect(route).toHaveJSProperty('tagName', 'A');
    await expect(route).toHaveAccessibleName(id);
    await expect(route).toHaveAttribute(
      'href',
      `/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/${id}/`,
    );
    if (tracker) {
      await expect(item.getByRole('link', { name: `#${tracker}`, exact: true })).toHaveAttribute(
        'href',
        `https://github.com/spec-kitty/EXPERIMENTAL-spec-kitty-saas/issues/${tracker}`,
      );
    } else {
      await expect(item.locator('.sk-mission-kanban-pattern__tracker-link')).toHaveCount(0);
    }
  }

  const scroller = root.locator('[data-board-scroller]');
  await expect(scroller).not.toHaveAttribute('role', /.*/);
  await expect(scroller).not.toHaveAttribute('aria-label', /.*/);
  await expect(scroller).not.toHaveAttribute('tabindex', /.*/);
  expect(await scroller.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
});

test('[T004/T010] K1 route rows preserve native keyboard and pointer gesture semantics', async ({
  page,
}) => {
  const root = await openStory(page, 'default');
  const row = root.locator('[data-work-package-id="WP04"] sk-action-row');
  const route = row.locator('[part="trigger"]');
  await focusByKeyboard(page, route);
  await assertVisibleFocus(route);

  await row.evaluate(async (node) => {
    const host = node as HTMLElement & { href: string; updateComplete: Promise<unknown> };
    host.href = '#wp04-native-route-probe';
    await host.updateComplete;
    (window as Window & { __missionKanbanActivationCount?: number }).__missionKanbanActivationCount = 0;
    host.addEventListener('sk-action-row-activate', () => {
      (window as Window & { __missionKanbanActivationCount?: number }).__missionKanbanActivationCount! += 1;
    });
  });
  await route.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe('#wp04-native-route-probe');
  expect(await page.evaluate(() => (window as Window & { __missionKanbanActivationCount?: number }).__missionKanbanActivationCount)).toBe(0);
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search));
  await route.focus();
  await page.keyboard.press('Space');
  expect(new URL(page.url()).hash).toBe('');

  const gestures = await route.evaluate((node) => ({
    ctrl: node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })),
    meta: node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true })),
    context: node.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
  }));
  expect(gestures).toEqual({ ctrl: true, meta: true, context: true });
  const tracker = row.getByRole('link', { name: '#1051', exact: true });
  await route.focus();
  await page.keyboard.press('Tab');
  await assertVisibleFocus(tracker);
  await expect(route).not.toBeFocused();
});

test('[T005] K2 owns genuine local overflow at 390px with a lane glimpse and focus scroll', async ({
  page,
}) => {
  const root = await openStory(page, 'k-2-narrow-contained', { width: 390, height: 844 });
  await expect(root.locator('sk-app-shell')).toHaveAttribute('presentation', 'compact');
  await expect(root).toHaveAttribute('data-stage-counts', '[3,4,3,1,4]');
  expect(await documentGeometry(page)).toEqual({ clientWidth: 390, scrollWidth: 390 });

  const scroller = root.locator('[data-board-scroller]');
  await expect(scroller).toHaveAttribute('role', 'region');
  await expect(scroller).toHaveAccessibleName('Work package Kanban');
  await expect(scroller).toHaveAttribute('tabindex', '0');
  const laneGeometry = await scroller.evaluate((node) => {
    const lanes = [...node.querySelectorAll<HTMLElement>('[data-stage-id]')];
    const bounds = node.getBoundingClientRect();
    return {
      overflows: node.scrollWidth > node.clientWidth + 1,
      clientWidth: node.clientWidth,
      firstWidth: lanes[0]!.getBoundingClientRect().width,
      secondLeft: lanes[1]!.getBoundingClientRect().left,
      right: bounds.right,
    };
  });
  expect(laneGeometry.overflows).toBe(true);
  expect(laneGeometry.firstWidth).toBeLessThanOrEqual(laneGeometry.clientWidth);
  expect(laneGeometry.secondLeft).toBeLessThan(laneGeometry.right);

  const lastRoute = root.locator('[data-work-package-id="WP15"] sk-action-row [part="trigger"]');
  const scrollLeftBeforeFocus = await scroller.evaluate((node) => node.scrollLeft);
  await focusByKeyboard(page, lastRoute);
  await revealFocusedControlByKeyboard(page, lastRoute);
  expect(await scroller.evaluate((node) => node.scrollLeft)).toBeGreaterThan(scrollLeftBeforeFocus);
  const [focusedRect, scrollerRect] = await Promise.all([lastRoute.boundingBox(), scroller.boundingBox()]);
  const focusedWithinScroller = focusedRect !== null && scrollerRect !== null &&
    focusedRect.x >= scrollerRect.x - 1 &&
    focusedRect.x + focusedRect.width <= scrollerRect.x + scrollerRect.width + 1;
  expect(focusedWithinScroller).toBe(true);
});

test('[T005/T010] K2 CSS zoom stress keeps overflow local and long-path focus visible', async ({
  page,
}) => {
  const root = await openStory(page, 'k-2-narrow-contained', { width: 780, height: 1688 });
  await root.evaluate((node) => { node.style.zoom = '2'; });
  expect(await root.evaluate((node) => getComputedStyle(node).zoom)).toBe('2');
  expect(await root.evaluate((node) => {
    const probe = document.createElement('span');
    probe.style.display = 'block';
    probe.style.width = '100px';
    node.prepend(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  })).toBe(200);
  const geometry = await documentGeometry(page);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  const scroller = root.locator('[data-board-scroller]');
  expect(await scroller.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(true);
  const lastRoute = root.locator('[data-work-package-id="WP15"] sk-action-row [part="trigger"]');
  await focusByKeyboard(page, lastRoute);
  await revealFocusedControlByKeyboard(page, lastRoute);
  if (process.env['PW_CAPTURE_MISSION_KANBAN']) {
    await page.screenshot({ path: '/tmp/mission-kanban-k2-zoom-200.png', fullPage: true });
  }
});

test('[T005/T010] long-content CSS zoom stress remains locally contained', async ({
  page,
}) => {
  const root = await openStory(page, 'long-content', { width: 780, height: 2400 });
  await root.evaluate((node) => { node.style.zoom = '2'; });
  expect(await root.evaluate((node) => getComputedStyle(node).zoom)).toBe('2');
  const geometry = await documentGeometry(page);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  const scroller = root.locator('[data-board-scroller]');
  expect(await scroller.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(true);
  const lastRoute = root.locator('[data-work-package-id="WP15"] sk-action-row [part="trigger"]');
  await focusByKeyboard(page, lastRoute);
  await revealFocusedControlByKeyboard(page, lastRoute);
  if (process.env['PW_CAPTURE_MISSION_KANBAN']) {
    await page.screenshot({ path: '/tmp/mission-kanban-long-zoom-200.png', fullPage: true });
  }
});

test('[T006] K3 exposes native filter semantics while the projected board stays fixed', async ({
  page,
}) => {
  const root = await openStory(page, 'k-3-detailed-lane-filters');
  const details = root.locator('details[data-detailed-filters]');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator(':scope > summary')).toContainText('2 of 15 work packages');
  const fieldset = details.locator('fieldset.sk-checkbox-choice-group');
  await expect(fieldset.locator(':scope > legend')).toHaveText('Committed detailed lanes');
  const checkboxes = fieldset.getByRole('checkbox');
  await expect(checkboxes).toHaveCount(10);
  expect(await checkboxes.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value))).toEqual([
    'genesis', 'planned', 'claimed', 'in_progress', 'for_review',
    'in_review', 'approved', 'done', 'blocked', 'canceled',
  ]);
  expect(await fieldset.locator('.sk-checkbox-choice-group__label').allTextContents()).toEqual([
    'Genesis', 'Planned', 'Claimed', 'In progress', 'For review',
    'In review', 'Approved', 'Done', 'Blocked', 'Canceled',
  ]);
  expect(await fieldset.locator('.sk-checkbox-choice-group__metadata').allTextContents()).toEqual([
    '0', '2', '1', '3', '2', '1', '1', '4', '1', '0',
  ]);
  expect(await checkboxes.evaluateAll((nodes) => nodes.filter((node) => (node as HTMLInputElement).checked).map((node) => (node as HTMLInputElement).value))).toEqual(['in_review', 'blocked']);
  for (const checkbox of await checkboxes.all()) await expect(checkbox).toHaveAccessibleName(/\S/);

  const boardSignature = async () => ({
    ids: await root.locator('[data-work-package-id]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-work-package-id'))),
    stages: await root.locator('[data-stage-id]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-stage-id'))),
  });
  expect(await boardSignature()).toEqual({ ids: ['WP05', 'WP10'], stages: ['planned', 'for_review'] });
  const planned = checkboxes.nth(1);
  await planned.focus();
  await page.keyboard.press('Space');
  await expect(planned).toBeChecked();
  await root.getByRole('button', { name: 'Apply', exact: true }).click();
  await root.getByRole('button', { name: 'Clear', exact: true }).click();
  expect(await boardSignature()).toEqual({ ids: ['WP05', 'WP10'], stages: ['planned', 'for_review'] });
});

test('[T007] K4 adds one same-commit snapshot notice without changing K1', async ({ page }) => {
  const signature = async (id: 'default' | 'k-4-snapshot-behind-log') => {
    const root = await openStory(page, id);
    return {
      commit: await root.getAttribute('data-commit'),
      stages: await root.getAttribute('data-stage-counts'),
      ids: await root.getAttribute('data-work-package-ids'),
      cards: await root.locator('[data-work-package-id]').count(),
      noticeCount: await root.locator('[data-snapshot-behind-log]').count(),
    };
  };
  const k1 = await signature('default');
  const k4 = await signature('k-4-snapshot-behind-log');
  expect({ ...k4, noticeCount: 0 }).toEqual(k1);
  expect(k4.noticeCount).toBe(1);
  const root = page.locator('[data-mission-kanban-pattern]');
  const notice = root.locator('[data-snapshot-behind-log]');
  await expect(notice).toHaveAttribute('tone', 'attention');
  await expect(notice).toHaveAttribute('announce', 'polite');
  await expect(notice).toContainText('Snapshot behind log');
  await expect(notice).toHaveAttribute('message', 'The saved status summary and Mission history disagree at this same commit.');
});

test('[T007] K5 keeps committed, observed, and reported-live truth in separate regions', async ({
  page,
}) => {
  const root = await openStory(page, 'k-5-observed-not-yet-pushed');
  const wp03 = root.locator('[data-work-package-id="WP03"]');
  await expect(wp03).toHaveAttribute('data-committed-lane', 'in_progress');
  await expect(wp03.locator('xpath=ancestor::section[@data-stage-id][1]')).toHaveAttribute('data-stage-id', 'doing');
  const observation = wp03.locator('[data-observed-activity]');
  await expect(observation).toContainText('Observed · up to 60 s behind');
  await expect(observation).toContainText('lynn → for_review, not yet pushed');
  const reported = root.locator('[data-reported-activity]');
  await expect(reported.getByRole('heading', { name: 'Live now' })).toBeVisible();
  await expect(reported.locator('[data-reported-live]')).toHaveCount(2);
  await expect(reported).toContainText('Reported live · ≤90s');
  await expect(reported).toContainText('Presence · unverified');
  expect(await observation.evaluate((node) => node.closest('[data-reported-activity]'))).toBeNull();
});

test('[T008] fitting K6 retains five labelled empty lists without a dead overflow tab stop', async ({
  page,
}) => {
  const root = await openStory(page, 'k-6-stable-empty-board');
  await expect(root).toHaveAttribute('data-stage-counts', '[0,0,0,0,0]');
  await expect(root).toHaveAttribute('data-work-package-ids', '[]');
  const stages = root.locator('[data-stage-id]');
  await expect(stages).toHaveCount(5);
  expect(await stages.locator(':scope > header > h3').allTextContents()).toEqual(STAGE_LABELS);
  for (const stage of await stages.all()) {
    await expect(stage.locator(':scope > ol')).toBeEmpty();
    await expect(stage.locator(':scope > ol + .sk-empty-state')).toHaveText('No work packages in this stage.');
  }
  const scroller = root.locator('[data-board-scroller]');
  expect(await scroller.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await expect(scroller).not.toHaveAttribute('role', /.*/);
  await expect(scroller).not.toHaveAttribute('aria-label', /.*/);
  await expect(scroller).not.toHaveAttribute('tabindex', /.*/);
  const committedAndLive = root.locator('[data-committed-board], [data-reported-activity]');
  await expect(committedAndLive.locator('a, button, sk-button, [role="button"], [role="link"]')).toHaveCount(0);
  await expect(root.locator('[data-reported-activity]')).toContainText('No live activity reported.');
});

test('[T008/T010] genuinely overflowing K6 owns the complete scroller triad and contained focus', async ({
  page,
}) => {
  const root = await openStory(page, 'k-6-stable-empty-board', { width: 1280, height: 800 });
  const scroller = root.locator('[data-board-scroller]');
  expect(await scroller.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(true);
  await expect(scroller).toHaveAttribute('role', 'region');
  await expect(scroller).toHaveAccessibleName('Work package Kanban');
  await expect(scroller).toHaveAttribute('tabindex', '0');
  await focusByKeyboard(page, scroller);
  await assertVisibleFocus(scroller);
});

test('[T005/T008/T010] one mounted K6 synchronizes the scroller triad across bidirectional live resize', async ({
  page,
}) => {
  const root = await openStory(page, 'k-6-stable-empty-board');
  await root.evaluate((node) => node.setAttribute('data-live-resize-sentinel', 'same-root'));
  const scroller = root.locator('[data-board-scroller]');

  expect(await scroller.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await expect(scroller).not.toHaveAttribute('role', /.*/);
  await expect(scroller).not.toHaveAttribute('aria-label', /.*/);
  await expect(scroller).not.toHaveAttribute('tabindex', /.*/);
  let geometry = await documentGeometry(page);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => scroller.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(true);
  await expect.poll(() => scroller.evaluate((node) => [
    node.getAttribute('role'),
    node.getAttribute('aria-label'),
    node.getAttribute('tabindex'),
  ])).toEqual(['region', 'Work package Kanban', '0']);
  await expect(root).toHaveAttribute('data-live-resize-sentinel', 'same-root');
  geometry = await documentGeometry(page);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  await focusByKeyboard(page, scroller);
  await assertVisibleFocus(scroller);

  await page.setViewportSize({ width: 1600, height: 1000 });
  await expect.poll(() => scroller.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await expect.poll(() => scroller.evaluate((node) => [
    node.getAttribute('role'),
    node.getAttribute('aria-label'),
    node.getAttribute('tabindex'),
  ])).toEqual([null, null, null]);
  await expect(root).toHaveAttribute('data-live-resize-sentinel', 'same-root');
  geometry = await documentGeometry(page);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
});

test('[T005/T008/T010] real Storybook reloads disconnect remounted scroller observers', async ({
  page,
}) => {
  await installObserverProbe(page);
  await page.goto(`/?path=/story/${STORY_PREFIX}k-6-stable-empty-board`);
  const preview = page.frameLocator('#storybook-preview-iframe');
  const root = preview.locator('[data-mission-kanban-pattern]');
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  await expect(root).toHaveAttribute('data-play-proof', 'passed');
  const frameDocument = preview.locator('html');
  const reloadStory = page.getByRole('button', { name: 'Reload story' });
  await expect(reloadStory).toBeVisible();
  await expect(reloadStory).toBeEnabled();
  await installStorybookRemountProbe(page);

  const snapshots = [await observerProbeSnapshot(frameDocument)];
  for (let reload = 0; reload < 3; reload += 1) {
    await root.evaluate((node, cycle) => node.setAttribute('data-remount-cycle', String(cycle)), reload);
    const eventsBefore = await storybookRemountSnapshot(page);
    await reloadStory.click();
    await expect.poll(async () => (await storybookRemountSnapshot(page)).requested, { timeout: 20000 })
      .toBeGreaterThan(eventsBefore.requested);
    await expect.poll(async () => (await storybookRemountSnapshot(page)).finished, { timeout: 20000 })
      .toBeGreaterThan(eventsBefore.finished);
    await expect(root).toHaveAttribute('data-render-complete', 'true');
    await expect(root).toHaveAttribute('data-play-proof', 'passed');
    await expect(root).not.toHaveAttribute('data-remount-cycle', /.*/);
    snapshots.push(await observerProbeSnapshot(frameDocument));
  }

  console.info('Mission Kanban observer lifecycle evidence', JSON.stringify(snapshots));
  let sameDocumentRemounts = 0;
  for (const [index, snapshot] of snapshots.entries()) {
    expect.soft(snapshot.activeTargetIds, `reload ${index} active target`).toHaveLength(1);
    expect.soft(snapshot.detachedActiveTargetIds, `reload ${index} detached active targets`).toEqual([]);
    expect.soft(snapshot.observedTargets - snapshot.disconnectedTargets, `reload ${index} observer balance`).toBe(1);
    if (index === 0) continue;
    const previous = snapshots[index - 1]!;
    if (snapshot.documentTimeOrigin !== previous.documentTimeOrigin) continue;
    sameDocumentRemounts += 1;
    expect.soft(snapshot.observedTargets, `reload ${index} observed replacement target`)
      .toBeGreaterThan(previous.observedTargets);
    const previousTargetId = previous.activeTargetIds.at(-1)!;
    expect.soft(snapshot.disconnectedTargetIds, `reload ${index} disconnected old target`)
      .toContain(previousTargetId);
  }
  expect(sameDocumentRemounts, 'at least one manager reload must exercise same-document teardown')
    .toBeGreaterThan(0);
});

test('[T008] LightMode is semantic/data-identical to K1 with a resolved theme delta', async ({
  page,
}) => {
  const facts = async (id: 'default' | 'light-mode') => {
    const root = await openStory(page, id);
    return {
      semantic: {
        stages: await root.getAttribute('data-stage-counts'),
        lanes: await root.getAttribute('data-detailed-lane-counts'),
        ids: await root.getAttribute('data-work-package-ids'),
        text: (await root.innerText()).replace(/\s+/g, ' ').trim(),
      },
      theme: await root.evaluate((node) => {
        const style = getComputedStyle(node);
        return { background: style.backgroundColor, foreground: style.color };
      }),
    };
  };
  const dark = await facts('default');
  const light = await facts('light-mode');
  expect(light.semantic).toEqual(dark.semantic);
  expect(light.theme).not.toEqual(dark.theme);
});

test('[T008/T010] long content remains locally contained with visible route focus', async ({
  page,
}) => {
  const root = await openStory(page, 'long-content', { width: 780, height: 1200 });
  const geometry = await documentGeometry(page);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  const scroller = root.locator('[data-board-scroller]');
  expect(await scroller.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(true);
  await expect(root).toContainText('deliberately-long-supplied-repository-label');
  const breadcrumbScroller = root.locator('.sk-breadcrumbs__list');
  expect(await breadcrumbScroller.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(true);
  const finalBreadcrumb = breadcrumbScroller.getByRole('link', { name: 'Kanban', exact: true });
  await focusByKeyboard(page, finalBreadcrumb);
  await assertVisibleFocus(finalBreadcrumb);
  const [breadcrumbRect, breadcrumbBoundary] = await Promise.all([
    finalBreadcrumb.boundingBox(),
    breadcrumbScroller.boundingBox(),
  ]);
  expect(
    breadcrumbRect !== null && breadcrumbBoundary !== null &&
    breadcrumbRect.x >= breadcrumbBoundary.x - 1 &&
    breadcrumbRect.x + breadcrumbRect.width <= breadcrumbBoundary.x + breadcrumbBoundary.width + 1,
  ).toBe(true);
  const lastRoute = root.locator('[data-work-package-id="WP15"] sk-action-row [part="trigger"]');
  const scrollLeftBeforeFocus = await root.locator('[data-board-scroller]').evaluate((node) => node.scrollLeft);
  await focusByKeyboard(page, lastRoute);
  await revealFocusedControlByKeyboard(page, lastRoute);
  expect(await root.locator('[data-board-scroller]').evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(scrollLeftBeforeFocus);
});

test('[T008/T010] forced colors retain boundaries, focus, and non-color truth labels', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const root = await openStory(page, 'forced-colors');
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  await expect(root).toContainText('Snapshot behind log');
  await expect(root).toContainText('Observed · up to 60 s behind');
  await expect(root).toContainText('Reported live · ≤90s');
  const checkboxes = root.getByRole('checkbox');
  await expect(checkboxes).toHaveCount(10);
  expect(await checkboxes.evaluateAll((nodes) => nodes
    .filter((node) => (node as HTMLInputElement).checked)
    .map((node) => (node as HTMLInputElement).value))).toEqual(['in_review', 'blocked']);
  const checked = root.locator('input[type="checkbox"]:checked').first();
  const unchecked = root.locator('input[type="checkbox"]:not(:checked)').first();
  const cue = (control: Locator) => control.evaluate((node) => {
    const choice = node.closest('.sk-checkbox-choice-group__choice')!;
    const style = getComputedStyle(choice);
    return {
      borderStyle: style.borderBlockEndStyle,
      borderWidth: style.borderWidth,
      borderBlockEndWidth: style.borderBlockEndWidth,
      fontWeight: style.fontWeight,
    };
  });
  expect(await cue(checked)).not.toEqual(await cue(unchecked));
  await focusByKeyboard(page, checked);
  await assertVisibleFocus(checked);
  const checkedBoundary = await checked.evaluate((node) => {
    const choice = node.closest('.sk-checkbox-choice-group__choice')!;
    const choiceStyle = getComputedStyle(choice);
    const controlRect = node.getBoundingClientRect();
    return {
      controlWidth: controlRect.width,
      controlHeight: controlRect.height,
      choiceBorderStyle: choiceStyle.borderBlockEndStyle,
      choiceBorderWidth: Number.parseFloat(choiceStyle.borderBlockEndWidth),
    };
  });
  expect(checkedBoundary.controlWidth).toBeGreaterThan(0);
  expect(checkedBoundary.controlHeight).toBeGreaterThan(0);
  expect(checkedBoundary.choiceBorderStyle).not.toBe('none');
  expect(checkedBoundary.choiceBorderWidth).toBeGreaterThan(0);
  const route = root.locator('[data-work-package-id="WP03"] sk-action-row [part="trigger"]');
  await focusByKeyboard(page, route);
  await assertVisibleFocus(route);
  const boundary = await root.locator('[data-reported-activity]').evaluate((node) => {
    const probe = document.createElement('span');
    probe.style.color = 'CanvasText';
    document.body.append(probe);
    const result = {
      border: getComputedStyle(node).borderColor,
      canvasText: getComputedStyle(probe).color,
    };
    probe.remove();
    return result;
  });
  expect(boundary.border).toBe(boundary.canvasText);
});

test('[T008/T010] reduced motion is real media emulation and preserves K5 content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const root = await openStory(page, 'reduced-motion');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await expect(root).toHaveAttribute('data-stage-counts', '[3,4,3,1,4]');
  await expect(root).toContainText('lynn → for_review, not yet pushed');
  await expect(root.locator('[data-reported-live]')).toHaveCount(2);
});

test('[T010] K1–K6 accessibility trees expose the intended hierarchy and truth tiers', async ({
  page,
}) => {
  const evidence: Record<string, string> = {};
  for (const id of [
    'default',
    'k-2-narrow-contained',
    'k-3-detailed-lane-filters',
    'k-4-snapshot-behind-log',
    'k-5-observed-not-yet-pushed',
    'k-6-stable-empty-board',
  ] as const) {
    const root = await openStory(
      page,
      id,
      id === 'k-2-narrow-contained' ? { width: 390, height: 844 } : { width: 1600, height: 1000 },
    );
    const snapshot = await root.ariaSnapshot();
    evidence[id] = snapshot;
    expect(snapshot).toContain('heading "Work packages" [level=1]');
    const expectedLabels = id === 'k-3-detailed-lane-filters'
      ? ['Planned', 'For review']
      : STAGE_LABELS;
    for (const label of expectedLabels) expect(snapshot).toContain(`heading "${label}" [level=3]`);
  }
  expect(evidence['default']).toContain('link "WP04"');
  expect(evidence['k-2-narrow-contained']).toContain('region "Work package Kanban"');
  expect(evidence['k-3-detailed-lane-filters']).toContain('group "Committed detailed lanes"');
  expect(evidence['k-3-detailed-lane-filters']).toContain('checkbox "In review 1" [checked]');
  expect(evidence['k-4-snapshot-behind-log']).toContain('Snapshot behind log');
  expect(evidence['k-5-observed-not-yet-pushed']).toContain('Observed · up to 60 s behind');
  expect(evidence['k-5-observed-not-yet-pushed']).toContain('heading "Live now" [level=2]');
  expect(evidence['k-6-stable-empty-board']).toContain('No work packages in this stage.');
  expect(evidence['k-6-stable-empty-board']).toContain('No live activity reported.');
  console.info('Mission Kanban K1–K6 accessibility-tree evidence', JSON.stringify(evidence));
});
