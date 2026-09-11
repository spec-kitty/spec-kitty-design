import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// #395 — ten-lane Mission Kanban pattern. The #278 five-stage family is asserted here only to prove
// it is still exactly what it was; its own suite (sk-mission-kanban-pattern.spec.ts) is unchanged.
const PREFIX = 'patterns-mission-kanban-ten-lane--';
const FIVE_STAGE_PREFIX = 'patterns-mission-kanban--';
const SOURCE = 'packages/elements/src/patterns/mission-kanban-ten-lane.stories.ts';
const STORY_IDS = [
  'default',
  'forced-colors',
  'k-2-narrow-contained',
  'k-3-filtered-lanes',
  'k-4-snapshot-behind-log',
  'k-5-unverified-overlay',
  'k-6-empty-lanes',
  'light-mode',
  'long-content',
  'reduced-motion',
  'rtl',
] as const;
const FIVE_STAGE_STORY_IDS = [
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

// The oracle. These values are restated ONLY here; the story derives them from #278's fixture.
const LANES = [
  'genesis', 'planned', 'claimed', 'in_progress', 'for_review',
  'in_review', 'approved', 'done', 'blocked', 'canceled',
] as const;
const LANE_LABELS = [
  'Genesis', 'Planned', 'Claimed', 'In progress', 'For review',
  'In review', 'Approved', 'Done', 'Blocked', 'Canceled',
] as const;
const LANE_COUNTS = [0, 2, 1, 3, 2, 1, 1, 4, 1, 0] as const;
type Lane = typeof LANES[number];
const CARDS_BY_LANE: Readonly<Record<Lane, ReadonlyArray<string>>> = {
  genesis: [],
  planned: ['WP04', 'WP06'],
  claimed: ['WP07'],
  in_progress: ['WP03', 'WP08', 'WP09'],
  for_review: ['WP02', 'WP11'],
  in_review: ['WP10'],
  approved: ['WP01'],
  done: ['WP12', 'WP13', 'WP14', 'WP15'],
  blocked: ['WP05'],
  canceled: [],
};
const RENDERED_ORDER = LANES.flatMap((lane) => CARDS_BY_LANE[lane]);
const PROFILES: Readonly<Record<string, string>> = {
  WP01: 'reviewer-rachel', WP02: 'reviewer-rachel', WP03: 'implementer-ivan', WP04: 'implementer-ivan',
  WP05: 'researcher-robbie', WP06: 'implementer-ivan', WP07: 'reviewer-rachel', WP08: 'implementer-ivan',
  WP09: 'implementer-ivan', WP10: 'reviewer-rachel', WP11: 'reviewer-rachel', WP12: 'implementer-ivan',
  WP13: 'implementer-ivan', WP14: 'implementer-ivan', WP15: 'implementer-ivan',
};
const TRACKERS: Readonly<Record<string, string>> = {
  WP01: '1043', WP02: '1046', WP03: '1048', WP04: '1051', WP05: '1054',
};
const REGION_NAME = 'Kanban lanes. Scroll horizontally to see all lanes.';
const GUARDS = [
  'duplicateLane', 'emptyLanes', 'blankLaneLabel', 'noCurrentNavigation', 'duplicateWorkPackage',
  'blankRoute', 'duplicateRoute', 'unknownCommittedLane', 'duplicateTrackerControl',
  'blankTrackerControl', 'blankTrackerHref', 'overlayUnknownWorkPackage', 'overlayUnknownLane',
  'duplicateOverlay', 'overlayNotUnverified', 'overlayUnknownTone', 'blankOverlayLabel',
  'blankOverlayTier', 'incompleteStressLabels', 'blankStressLabel', 'unknownIndicatorTone',
  'unknownSelection', 'repeatedSelection', 'unknownWorkPackage', 'repeatedInclusion',
] as const;

const DESKTOP = { width: 1440, height: 1024 } as const;
const NARROW = { width: 390, height: 844 } as const;

async function openStory(
  page: Page,
  id: StoryId,
  viewport: Readonly<{ width: number; height: number }> = DESKTOP,
): Promise<Locator> {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=${PREFIX}${id}&viewMode=story`);
  const root = page.locator('[data-mission-kanban-ten-lane-pattern]');
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

async function expectNoDocumentOverflow(page: Page): Promise<void> {
  const geometry = await documentGeometry(page);
  expect(geometry.scrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

const scrollerOf = (root: Locator): Locator => root.locator('[data-committed-board] > [data-board-scroller]');

async function triad(scroller: Locator) {
  return scroller.evaluate((node) => [
    node.getAttribute('role'),
    node.getAttribute('aria-label'),
    node.getAttribute('tabindex'),
  ]);
}

async function overflows(scroller: Locator): Promise<boolean> {
  return scroller.evaluate((node) => node.scrollWidth > node.clientWidth);
}

async function expectOverflowingTriad(scroller: Locator): Promise<void> {
  expect(await overflows(scroller)).toBe(true);
  await expect.poll(() => triad(scroller)).toEqual(['region', REGION_NAME, '0']);
  await expect(scroller).toHaveAccessibleName(REGION_NAME);
}

async function expectFittingWithoutTriad(scroller: Locator): Promise<void> {
  expect(await overflows(scroller)).toBe(false);
  await expect.poll(() => triad(scroller)).toEqual([null, null, null]);
}

async function focusGeometry(control: Locator) {
  return control.evaluate((node) => {
    const tolerance = 1;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const extent = Math.max(
      0,
      Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset),
    );
    const composedParent = (element: Element): Element | null => {
      if (element.parentElement) return element.parentElement;
      const rootNode = element.getRootNode();
      return rootNode instanceof ShadowRoot ? rootNode.host : null;
    };
    let clippedStart = false;
    let clippedEnd = false;
    let clippedBlock = false;
    for (let ancestor = composedParent(node); ancestor; ancestor = composedParent(ancestor)) {
      const ancestorStyle = getComputedStyle(ancestor);
      const clipsX = ['hidden', 'clip', 'auto', 'scroll'].includes(ancestorStyle.overflowX);
      const clipsY = ['hidden', 'clip', 'auto', 'scroll'].includes(ancestorStyle.overflowY);
      if (!clipsX && !clipsY) continue;
      const bounds = ancestor.getBoundingClientRect();
      if (clipsX && rect.left - extent < bounds.left - tolerance) clippedStart = true;
      if (clipsX && rect.right + extent > bounds.right + tolerance) clippedEnd = true;
      if (clipsY && (rect.top - extent < bounds.top - tolerance || rect.bottom + extent > bounds.bottom + tolerance)) {
        clippedBlock = true;
      }
    }
    const viewport = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };
    return {
      clipped: clippedStart || clippedEnd || clippedBlock,
      clippedLeft: clippedStart,
      clippedRight: clippedEnd,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
      viewport,
      withinViewport:
        rect.left - extent >= -tolerance &&
        rect.right + extent <= viewport.width + tolerance &&
        rect.top - extent >= -tolerance &&
        rect.bottom + extent <= viewport.height + tolerance,
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

// Keyboard only: the browser scrolls a focused control into view; arrow and page keys finish the
// job where it does not. No script ever sets scrollLeft or calls scrollIntoView.
async function revealFocusedControlByKeyboard(page: Page, control: Locator): Promise<void> {
  await expect(control).toBeFocused();
  // Arrow steps, not page steps: a focused box taller than half the viewport (the K2 scroller)
  // overshoots on PageDown and oscillates on PageUp.
  for (let index = 0; index < 80; index += 1) {
    const geometry = await focusGeometry(control);
    if (!geometry.clipped && geometry.withinViewport) break;
    if (geometry.rect.bottom > geometry.viewport.height) await page.keyboard.press('ArrowDown');
    else if (geometry.rect.top < 0) await page.keyboard.press('ArrowUp');
    if (geometry.clippedRight || geometry.rect.right > geometry.viewport.width) {
      await page.keyboard.press('ArrowRight');
    } else if (geometry.clippedLeft || geometry.rect.left < 0) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }
  await assertVisibleFocus(control);
}

async function focusByKeyboard(page: Page, control: Locator, maximumTabs = 140): Promise<void> {
  await page.locator('[data-mission-kanban-ten-lane-pattern] h1').click();
  for (let index = 0; index < maximumTabs; index += 1) {
    await page.keyboard.press('Tab');
    if (await control.evaluate((node) => node.matches(':focus'))) return;
  }
  throw new Error(`Keyboard traversal did not reach the target after ${maximumTabs} Tab presses.`);
}

// The narrowest board that still fits: lane minimums plus gaps plus the scroller's own padding.
async function measuredFitWidth(scroller: Locator): Promise<number> {
  return scroller.evaluate((node) => {
    const style = getComputedStyle(node);
    const lanes = [...node.children] as HTMLElement[];
    const lanesWidth = lanes.reduce((sum, lane) => sum + Number.parseFloat(getComputedStyle(lane).minInlineSize), 0);
    return Math.ceil(
      lanesWidth +
      Number.parseFloat(style.columnGap) * (lanes.length - 1) +
      Number.parseFloat(style.paddingInlineStart) +
      Number.parseFloat(style.paddingInlineEnd),
    );
  });
}

const routeOf = (root: Locator, id: string): Locator =>
  root.locator(`[data-work-package-id="${id}"] sk-action-row [part="trigger"]`);

async function laneSignature(root: Locator) {
  return root.locator('[data-lane-id]').evaluateAll((lanes) => lanes.map((lane) => ({
    lane: lane.getAttribute('data-lane-id'),
    cards: [...lane.querySelectorAll(':scope > ol > li')].map((item) => item.getAttribute('data-work-package-id')),
  })));
}

test('[T001] the built index holds the eleven ten-lane stories and the unchanged ten #278 stories', async ({
  request,
}) => {
  const response = await request.get('/index.json');
  expect(response.ok()).toBe(true);
  const index = await response.json() as { entries: Record<string, unknown> };
  const ids = Object.keys(index.entries).filter((id) => !id.endsWith('--docs'));
  expect(ids.filter((id) => id.startsWith(PREFIX)).sort())
    .toEqual(STORY_IDS.map((id) => `${PREFIX}${id}`).sort());
  expect(ids.filter((id) => id.startsWith(FIVE_STAGE_PREFIX)).sort())
    .toEqual(FIVE_STAGE_STORY_IDS.map((id) => `${FIVE_STAGE_PREFIX}${id}`).sort());
});

test('[T002] both fixtures stay frozen and single-source, counts are derived, and every guard fails closed', async ({
  page,
}) => {
  const root = await openStory(page, 'default');
  const proof = JSON.parse((await root.getAttribute('data-guard-proof')) ?? '{}') as Record<string, boolean>;
  expect(Object.keys(proof).sort()).toEqual([...GUARDS].sort());
  expect(Object.values(proof).every((failedClosed) => failedClosed)).toBe(true);
  await expect(root).toHaveAttribute('data-fixture-deeply-frozen', 'true');
  await expect(root).toHaveAttribute('data-projection-deeply-frozen', 'true');

  const evidence = await root.evaluate((node) => {
    type Json = Record<string, unknown>;
    type Projection = {
      lanes: Array<{ id: string; count: number; workPackages: Array<{ id: string }> }>;
      selectedLaneIds: string[];
      unverifiedOverlays: unknown[];
    };
    type Seam = {
      base: Json & {
        detailedLanes: Array<{ id: string }>;
        workPackages: Array<Json & { id: string; href: string; committedLaneId: string }>;
      };
      extension: Json & { stress: { laneLabels: Record<string, string> } };
      projection: Projection;
      derive: (base: unknown, extension: unknown, options?: unknown) => Projection;
    };
    const seam = (node as HTMLElement & { __missionKanbanTenLaneTestSeam?: Seam }).__missionKanbanTenLaneTestSeam;
    if (!seam) return { available: false };
    const deeplyFrozen = (value: unknown): boolean => value === null || typeof value !== 'object' || (
      Object.isFrozen(value) && Object.values(value as Json).every(deeplyFrozen)
    );
    const baseBefore = JSON.stringify(seam.base);
    const extensionBefore = JSON.stringify(seam.extension);
    const first = seam.derive(seam.base, seam.extension, { includeUnverifiedOverlays: true });
    const firstBefore = JSON.stringify(first);
    let baseMutationBlocked = false;
    let projectionMutationBlocked = false;
    try {
      baseMutationBlocked = !Reflect.set(seam.base.workPackages[0]!, 'committedLaneId', 'done');
    } catch {
      baseMutationBlocked = true;
    }
    try {
      first.lanes.push({ id: 'intruder', count: 0, workPackages: [] });
    } catch {
      projectionMutationBlocked = true;
    }
    const repeated = seam.derive(seam.base, seam.extension, { includeUnverifiedOverlays: true });
    const moved = seam.derive({
      ...seam.base,
      workPackages: seam.base.workPackages.map((workPackage) =>
        workPackage.id === 'WP04' ? { ...workPackage, committedLaneId: 'genesis' } : workPackage),
    }, seam.extension);
    const reversedSelection = seam.derive(seam.base, seam.extension, { selectedLaneIds: ['blocked', 'in_review'] });
    const { base, extension } = seam;
    const subsetIds = ['canceled', 'blocked', 'done'];
    const subset = seam.derive({
      ...base,
      detailedLanes: subsetIds.map((id) => base.detailedLanes.find((lane) => lane.id === id)!),
      workPackages: base.workPackages.filter(({ committedLaneId }) => subsetIds.includes(committedLaneId)),
    }, {
      ...extension,
      stress: { laneLabels: Object.fromEntries(subsetIds.map((id) => [id, extension.stress.laneLabels[id]!])) },
      unverifiedOverlays: [],
    });
    const serializedExtension = JSON.stringify(seam.extension);
    return {
      available: true,
      frozen: deeplyFrozen(seam.base) && deeplyFrozen(seam.extension) && deeplyFrozen(first),
      baseMutationBlocked,
      projectionMutationBlocked,
      baseUnchanged: JSON.stringify(seam.base) === baseBefore,
      extensionUnchanged: JSON.stringify(seam.extension) === extensionBefore,
      priorProjectionUnchanged: JSON.stringify(first) === firstBefore,
      repeatedEqual: JSON.stringify(repeated) === firstBefore,
      renderedProjectionIndependent: seam.projection !== first,
      movedCounts: moved.lanes.map(({ count }) => count),
      reversedSelectionLanes: reversedSelection.lanes.map(({ id }) => id),
      reversedSelectionIds: reversedSelection.selectedLaneIds,
      subsetLanes: subset.lanes.map(({ id }) => id),
      subsetCounts: subset.lanes.map(({ count }) => count),
      extensionKeys: Object.keys(seam.extension).sort(),
      extensionRestatesNoWorkPackageRoute: seam.base.workPackages.every(({ href }) => !serializedExtension.includes(href)),
      neverObserved: !firstBefore.includes('Observed') && !firstBefore.includes('up to 60 s behind'),
    };
  });
  expect(evidence).toEqual({
    available: true,
    frozen: true,
    baseMutationBlocked: true,
    projectionMutationBlocked: true,
    baseUnchanged: true,
    extensionUnchanged: true,
    priorProjectionUnchanged: true,
    repeatedEqual: true,
    renderedProjectionIndependent: true,
    movedCounts: [1, 1, 1, 3, 2, 1, 1, 4, 1, 0],
    reversedSelectionLanes: ['in_review', 'blocked'],
    reversedSelectionIds: ['in_review', 'blocked'],
    subsetLanes: ['canceled', 'blocked', 'done'],
    subsetCounts: [0, 1, 4],
    extensionKeys: ['copy', 'format', 'routes', 'stress', 'tones', 'unverifiedOverlays'],
    extensionRestatesNoWorkPackageRoute: true,
    neverObserved: true,
  });
});

test('[T006] the module stays story-only, owns no application machinery, and imports #278 truth', () => {
  const source = readFileSync(SOURCE, 'utf8');
  expect(source).toMatch(/from '\.\/mission-kanban(?:\.stories|\.fixture)\.js'/);
  for (const forbidden of [
    /customElements\.define/,
    /<sk-mission-kanban\b/,
    /from\s+['"][^'"]*apps\//,
    /\.shadowRoot\b|\.renderRoot\b|getRootNode\(/,
    /@(?:click|change|input|keydown)=|addEventListener\(/,
    /\bfetch\s*\(|\bsetTimeout\s*\(|\bsetInterval\s*\(|requestAnimationFrame\(/,
    /localStorage|sessionStorage|history\.(?:pushState|replaceState)/,
    /\b(?:router|polling|dragAndDrop|blockedReason|estimate|priority|owner)\b/i,
    /\bselectable\b|sk-action-row-activate/,
    /\battributes\s*:\s*true/,
    /(?:animation|transition)[\w-]*\s*:|scroll-behavior\s*:/,
    /\bobservedActivity\b/,
    /\.style\b/,
    /(?:^|[\s;{])(?:order|direction)\s*:|-reverse\b/m,
  ]) {
    expect(source, `forbidden ten-lane source surface: ${forbidden}`).not.toMatch(forbidden);
  }
  const styles = source.slice(source.indexOf('const PATTERN_STYLES'), source.indexOf('type Presentation'));
  expect(styles.length).toBeGreaterThan(0);
  expect(styles).not.toMatch(/(?:^|[\s;{])(?:left|right|top|bottom|(?:margin|padding|border)-(?:left|right|top|bottom)[a-z-]*|(?:min-|max-)?(?:width|height))\s*:/m);
  // Single-quantifier patterns only (security/detect-unsafe-regex): `\d(?:px|...)` still catches
  // `1.5rem` through its `5rem` tail, and `border[a-z-]*-color` still covers the logical longhands.
  expect(styles).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|oklab\(|\blab\(|\blch\(|hwb\(|color-mix\(|\d(?:px|rem|em|pt|ch|ex|vw|vi|vb|vmin|vmax)\b/i);
  expect(styles).not.toMatch(/(?:^|[\s;{])(?:float|clear)\s*:|text-align\s*:\s*(?:left|right)|(?:scroll-margin|scroll-padding)-(?:left|right|top|bottom)/m);
  const [ordinaryStyles, forcedStyles = ''] = styles.split('@media (forced-colors: active)');
  const colourDeclarations = (block: string) => [...block.matchAll(
    /(?:^|[\s;{])(background(?:-color)?|color|fill|stroke|outline-color|caret-color|accent-color|text-decoration-color|border[a-z-]*-color)\s*:\s*([^;}]+)/g,
  )].map(([, property, value]) => [property!, value!.trim()] as const);
  expect(colourDeclarations(ordinaryStyles).length).toBeGreaterThan(5);
  for (const [property, value] of colourDeclarations(ordinaryStyles)) {
    expect(value, `${property} must be a token outside forced colors`).toMatch(/^var\(--sk-[\w-]+\)$/);
  }
  for (const [property, value] of colourDeclarations(forcedStyles)) {
    expect(value, `${property} under forced colors`).toMatch(/^(?:var\(--sk-[\w-]+\)|CanvasText|Canvas|Highlight|HighlightText|LinkText|ButtonText|ButtonBorder|GrayText)$/);
  }
  // Typography and stacking come from tokens too. Colour-bearing and physical multi-value
  // shorthands are refused outright: a shorthand can smuggle a raw colour or a single side.
  for (const [, property, value] of styles.matchAll(/(?:^|[\s;{])(font-weight|font-size|line-height|letter-spacing|z-index)\s*:\s*([^;}]+)/g)) {
    expect(value!.trim(), `${property} must be a token`).toMatch(/^var\(--sk-[\w-]+\)$/);
  }
  expect(styles).not.toMatch(/(?:^|[\s;{])(?:outline|border|border-block|border-inline|border-block-start|border-block-end|border-inline-start|border-inline-end|box-shadow|text-decoration)\s*:/m);
  expect(styles).not.toMatch(/(?:^|[\s;{])(?:margin|padding|inset)\s*:\s*[^\s;}]+\s+[^\s;}]+\s+[^\s;}]+/m);
  expect([...new Set(styles.match(/\d+vh\b/g) ?? [])]).toEqual(['100vh']);
  expect(styles).not.toMatch(/\.sk-(?:action-row|app-shell|workflow-board|workflow-lane|notice|status-indicator|pill-tag|button|context-nav|breadcrumbs|disclosure|checkbox-choice-group|empty-state)[\w-]*\s*[{,:]/);
  // Only #278's shared overlay id (by reference) and the guard's deliberate unknown id may appear.
  expect([...new Set(source.match(/['"]WP\d{2}['"]/g))].sort()).toEqual(["'WP03'", "'WP99'"]);
});

test('[T006] every rendered string and accessible name is supplied by a fixture', async ({ page }) => {
  for (const id of STORY_IDS) {
    const root = await openStory(page, id, id === 'k-2-narrow-contained' || id === 'long-content' ? NARROW : DESKTOP);
    const offenders = await root.evaluate((node) => {
      type Seam = {
        base: Record<string, unknown> & {
          missionId: string;
          teamLabel: string;
          repositoryLabel: string;
          stress: Record<string, string>;
          detailedLanes: Array<{ id: string }>;
        };
        extension: Record<string, unknown> & {
          format: {
            eyebrow: (id: string) => string;
            subtitle: (repository: string) => string;
            compactBrand: (team: string) => string;
            laneCount: (count: number) => string;
            detailedLane: (lane: string) => string;
            overlayDestination: (lane: string) => string;
          };
        };
      };
      const seam = (node as HTMLElement & { __missionKanbanTenLaneTestSeam?: Seam }).__missionKanbanTenLaneTestSeam!;
      const allowed = new Set<string>();
      const collect = (value: unknown): void => {
        if (typeof value === 'string') allowed.add(value);
        else if (value && typeof value === 'object') Object.values(value).forEach(collect);
      };
      collect(seam.base);
      collect(seam.extension);
      const { format } = seam.extension;
      for (const team of [seam.base.teamLabel, seam.base.stress['teamLabel']!]) allowed.add(format.compactBrand(team));
      for (const repository of [seam.base.repositoryLabel, seam.base.stress['repositoryLabel']!]) allowed.add(format.subtitle(repository));
      allowed.add(format.eyebrow(seam.base.missionId));
      for (let count = 0; count <= 20; count += 1) {
        allowed.add(String(count));
        allowed.add(format.laneCount(count));
      }
      for (const { id: lane } of seam.base.detailedLanes) {
        allowed.add(format.detailedLane(lane));
        allowed.add(format.overlayDestination(lane));
      }
      const found: string[] = [];
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        if (text.parentElement?.closest('style')) continue;
        const value = (text.textContent ?? '').trim();
        if (value && !allowed.has(value)) found.push(value);
      }
      const userFacing = ['aria-label', 'aria-description', 'aria-roledescription', 'label', 'message', 'title', 'alt', 'placeholder'];
      for (const element of node.querySelectorAll(userFacing.map((attribute) => `[${attribute}]`).join(', '))) {
        for (const attribute of userFacing) {
          const value = element.getAttribute(attribute);
          if (value !== null && !allowed.has(value)) found.push(`${attribute}=${value}`);
        }
      }
      return found;
    });
    expect(offenders, `${id} renders strings no fixture supplies`).toEqual([]);
  }
});

// Static half of the copy boundary (#286), read with the TypeScript parser rather than a hand
// lexer. For every html-tagged template it checks the static markup (no text between tags, no
// literal or partly literal user-facing attribute, no style attribute) and every string literal
// inside its ${} expressions; attribute writes from script are held to the same rule. The runtime
// audit cannot tell a hard-coded 'Presence · unverified' from the fixture value it duplicates.
const ALLOWED_EXPRESSION_LITERALS = new Set(['', ' sk-light', 'rtl', 'page']);
// A script-side attribute write is copy only when a literal value lands in a user-facing
// attribute; test hooks (`data-play-proof`) and ARIA tokens (`role="region"`) are not copy.
const USER_FACING_ATTRIBUTES = new Set([
  'aria-label', 'aria-description', 'aria-roledescription', 'title', 'alt', 'placeholder', 'label', 'message',
]);

function scanRenderCode(text: string): { templates: number; offenders: string[] } {
  const file = ts.createSourceFile('scan.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const markup: string[] = [];
  const offenders: string[] = [];
  const isHtml = (node: ts.Node): node is ts.TaggedTemplateExpression =>
    ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && node.tag.text === 'html';
  const literalsIn = (node: ts.Node): void => {
    if (isHtml(node)) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!ALLOWED_EXPRESSION_LITERALS.has(node.text)) offenders.push(`literal in expression: ${node.text}`);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      offenders.push(`template literal in expression: ${node.getText().slice(0, 60)}`);
      return;
    }
    ts.forEachChild(node, literalsIn);
  };
  const visit = (node: ts.Node): void => {
    if (isHtml(node)) {
      const template = node.template;
      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        markup.push(template.text);
      } else {
        markup.push([template.head.text, ...template.templateSpans.map((span) => span.literal.text)].join('§'));
        for (const span of template.templateSpans) literalsIn(span.expression);
      }
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'setAttribute') {
      const [name, value] = node.arguments;
      const literalText = (argument?: ts.Expression): string | undefined =>
        argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) ? argument.text : undefined;
      const attribute = literalText(name);
      if (attribute && USER_FACING_ATTRIBUTES.has(attribute) && value && (literalText(value) !== undefined || ts.isTemplateExpression(value))) {
        offenders.push(`setAttribute literal copy: ${attribute}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  for (const template of markup) {
    const html = template.replace(/<style>[\s\S]*?<\/style>/g, '');
    const text = html.replace(/<[^>]*>/g, ' ').replace(/§/g, ' ').trim();
    if (text) offenders.push(`text: ${text.slice(0, 80)}`);
    for (const tag of html.match(/<[^>]*>/g) ?? []) {
      if (/\sstyle\s*=/.test(tag)) offenders.push(`style attribute in ${tag.slice(0, 40)}`);
      for (const match of tag.matchAll(/\b(aria-label|aria-description|aria-roledescription|title|alt|placeholder|label|message)\s*=\s*(?:"([^"]*)"|([^\s>]*))/g)) {
        const value = match[2] ?? match[3] ?? '';
        if (value !== '§') offenders.push(`${match[1]}=${value}`);
      }
    }
  }
  return { templates: markup.length, offenders };
}

test('[T006] render code holds no copy: template text, attributes, expression literals, attribute writes', () => {
  for (const probe of [
    'html`<p>Literal copy</p>`',
    'html`<a aria-label="Home" href=${route}>${label}</a>`',
    'html`<div>${ready ? html`<span>Nested copy</span>` : nothing}</div>`',
    'html`<div style="margin-left:1px">${label}</div>`',
    "html`<span>${'Clear'}</span>`",
    "html`<span>${overlay.tierLabel || 'Presence · unverified'}</span>`",
    "html`<h2>${ready ? 'Live now' : nothing}</h2>`",
    'html`<span aria-label="${count} work packages">${count}</span>`',
    'html`<span>${`Mission ${id}`}</span>`',
    "html`<i aria-roledescription=${'lane'}></i>`",
    "element.setAttribute('aria-label', 'Kanban lanes');",
    "element.setAttribute('title', `Mission ${id}`);",
  ]) {
    expect(scanRenderCode(probe).offenders, `self-probe must go red: ${probe}`).not.toEqual([]);
  }
  expect(scanRenderCode("html`<p class=\"x${light ? ' sk-light' : ''}\" dir=${rtl ? 'rtl' : nothing} aria-label=${name}>${copy.label}</p>`").offenders).toEqual([]);
  expect(scanRenderCode("root.setAttribute('data-play-proof', 'passed'); scroller.setAttribute('role', 'region'); scroller.setAttribute('aria-label', name);").offenders).toEqual([]);
  const source = readFileSync(SOURCE, 'utf8');
  const { templates, offenders } = scanRenderCode(source);
  expect(templates, 'every html template in the module is reached').toBe((source.match(/\bhtml`/g) ?? []).length);
  expect(templates).toBeGreaterThan(10);
  expect(offenders).toEqual([]);
});

async function focusedControl(page: Page): Promise<string> {
  return page.evaluate(() => {
    const host = document.activeElement;
    let focused: Element | null = host;
    while (focused?.shadowRoot?.activeElement) focused = focused.shadowRoot.activeElement;
    if (!host || !focused) return 'none';
    if (focused instanceof HTMLInputElement && focused.type === 'checkbox') return `checkbox:${focused.value}`;
    if (host.localName === 'sk-button') return `button:${host.textContent?.trim()}`;
    if (host.localName === 'sk-action-row') {
      return `route:${host.closest('[data-work-package-id]')?.getAttribute('data-work-package-id')}`;
    }
    if (focused.localName === 'summary') return 'summary';
    if (focused.localName === 'a') return `link:${focused.textContent?.trim()}`;
    return focused.localName;
  });
}

test('[T007] K3 keyboard order equals DOM order through choices, Apply, Clear, routes and trackers', async ({ page }) => {
  const root = await openStory(page, 'k-3-filtered-lanes');
  const summary = root.locator('details[data-lane-filters] > summary');
  await focusByKeyboard(page, summary);
  await revealFocusedControlByKeyboard(page, summary);
  const stops: ReadonlyArray<readonly [string, Locator]> = [
    ...LANES.map((lane) => [`checkbox:${lane}`, root.locator(`input[type="checkbox"][value="${lane}"]`)] as const),
    ['button:Apply', root.getByRole('button', { name: 'Apply', exact: true })],
    ['button:Clear', root.getByRole('button', { name: 'Clear', exact: true })],
    ['route:WP10', routeOf(root, 'WP10')],
    ['route:WP05', routeOf(root, 'WP05')],
    ['link:#1054', root.getByRole('link', { name: '#1054', exact: true })],
  ];
  for (const [name, control] of stops) {
    await page.keyboard.press('Tab');
    expect(await focusedControl(page)).toBe(name);
    await revealFocusedControlByKeyboard(page, control);
  }
});

test('[T007] the closed K1 disclosure opens by keyboard and hands focus to the native choices', async ({ page }) => {
  const root = await openStory(page, 'default');
  const details = root.locator('details[data-lane-filters]');
  await expect(details).not.toHaveAttribute('open', /.*/);
  const summary = details.locator(':scope > summary');
  await focusByKeyboard(page, summary);
  await revealFocusedControlByKeyboard(page, summary);
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  expect(await focusedControl(page)).toBe('checkbox:genesis');
  const genesis = root.locator('input[type="checkbox"][value="genesis"]');
  await revealFocusedControlByKeyboard(page, genesis);
  await page.keyboard.press('Space');
  await expect(genesis).toBeChecked();
  expect(await laneSignature(root)).toEqual(LANES.map((lane) => ({ lane, cards: CARDS_BY_LANE[lane] })));
});

test('[T006] K1 renders ten ordered lanes, fifteen committed cards, and no stage reduction', async ({ page }) => {
  const root = await openStory(page, 'default');
  await expect(root).toHaveAttribute('data-lane-ids', JSON.stringify(LANES));
  await expect(root).toHaveAttribute('data-lane-counts', JSON.stringify(LANE_COUNTS));
  await expect(root).toHaveAttribute('data-work-package-ids', JSON.stringify(RENDERED_ORDER));
  const lanes = scrollerOf(root).locator(':scope > section.sk-workflow-lane');
  await expect(lanes).toHaveCount(10);
  expect(await lanes.locator(':scope > header > h3').allTextContents()).toEqual(LANE_LABELS);
  expect(await laneSignature(root)).toEqual(LANES.map((lane) => ({ lane, cards: CARDS_BY_LANE[lane] })));

  for (const [index, lane] of LANES.entries()) {
    const section = lanes.nth(index);
    const count = LANE_COUNTS[index]!;
    await expect(section).toHaveAccessibleName(LANE_LABELS[index]!);
    await expect(section.locator(':scope > header .sk-workflow-lane__count')).toHaveText(String(count));
    await expect(section.locator(':scope > header .sk-workflow-lane__count'))
      .toHaveAttribute('aria-label', count === 1 ? '1 work package' : `${count} work packages`);
    await expect(section.locator(':scope > ol')).toHaveCount(1);
    await expect(section.locator(':scope > ol > li')).toHaveCount(count);
    if (count === 0) {
      await expect(section.locator(':scope > ol')).toBeEmpty();
      await expect(section.locator(':scope > ol + [data-empty-lane]')).toHaveText('No work packages in this lane.');
    } else {
      await expect(section.locator('[data-empty-lane]')).toHaveCount(0);
    }
    for (const id of CARDS_BY_LANE[lane]) {
      const item = section.locator(`:scope > ol > li[data-work-package-id="${id}"]`);
      await expect(item).toHaveAttribute('data-committed-lane', lane);
      const row = item.locator('sk-action-row');
      const href = `/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/${id}/`;
      await expect(row).toHaveAttribute('layout', 'card');
      await expect(row).toHaveAttribute('href', href);
      await expect(row).not.toHaveAttribute('selectable', /.*/);
      const route = row.locator('[part="trigger"]');
      await expect(route).toHaveJSProperty('tagName', 'A');
      await expect(route).toHaveAttribute('href', href);
      await expect(route).toHaveAccessibleName(id);
      await expect(item.locator('[slot="reference"]')).toHaveText(`Detailed lane · ${lane}`);
      await expect(item.locator('[slot="metadata"]')).toHaveText(PROFILES[id]!);
      await expect(item.locator('[slot="tags"]')).toHaveCount(0);
      const tracker = TRACKERS[id];
      if (tracker) {
        await expect(item.getByRole('link', { name: `#${tracker}`, exact: true }))
          .toHaveAttribute('href', `https://github.com/spec-kitty/EXPERIMENTAL-spec-kitty-saas/issues/${tracker}`);
      } else {
        await expect(item.locator('[slot="controls"]')).toHaveCount(0);
      }
    }
  }
  await expect(root.locator('[data-stage-id]')).toHaveCount(0);
  await expect(root.locator('[data-unverified-overlay], [data-snapshot-behind-log], [data-live-overlays-shown]')).toHaveCount(0);
  await expect(root.locator('details[data-lane-filters]')).not.toHaveAttribute('open', /.*/);
  await expect(root.locator('details[data-lane-filters] sk-button')).toHaveCount(1);
  await expect(root.locator('[data-reported-live]')).toHaveCount(2);
  await expectOverflowingTriad(scrollerOf(root));
  await expectNoDocumentOverflow(page);
});

test('[T006] K1 routes keep native keyboard and pointer semantics beside independent tracker links', async ({
  page,
}) => {
  const root = await openStory(page, 'default');
  const row = root.locator('[data-work-package-id="WP04"] sk-action-row');
  const route = row.locator('[part="trigger"]');
  await focusByKeyboard(page, route);
  await revealFocusedControlByKeyboard(page, route);
  await row.evaluate(async (node) => {
    const host = node as HTMLElement & { href: string; updateComplete: Promise<unknown> };
    host.href = '#wp04-native-route-probe';
    await host.updateComplete;
  });
  await route.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe('#wp04-native-route-probe');
  const gestures = await route.evaluate((node) => ({
    ctrl: node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })),
    meta: node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true })),
    context: node.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
  }));
  expect(gestures).toEqual({ ctrl: true, meta: true, context: true });
  const tracker = row.getByRole('link', { name: '#1051', exact: true });
  await route.focus();
  await page.keyboard.press('Tab');
  await revealFocusedControlByKeyboard(page, tracker);
});

test('[T005/T007] K2 keeps the ten lanes in one local scroller with equal gutters and a lane glimpse', async ({
  page,
}) => {
  const root = await openStory(page, 'k-2-narrow-contained', NARROW);
  await expect(root.locator('[slot="compact-header"]')).not.toHaveAttribute('inert', /.*/);
  await expect(root).toHaveAttribute('data-lane-ids', JSON.stringify(LANES));
  await expect(root).toHaveAttribute('data-lane-counts', JSON.stringify(LANE_COUNTS));
  expect(await documentGeometry(page)).toEqual({ clientWidth: 390, scrollWidth: 390 });
  const scroller = scrollerOf(root);
  await expectOverflowingTriad(scroller);
  const geometry = await root.evaluate((node) => {
    const board = node.querySelector<HTMLElement>('[data-committed-board]')!;
    const scrollerNode = board.querySelector<HTMLElement>('[data-board-scroller]')!;
    const [first, second] = [...scrollerNode.querySelectorAll<HTMLElement>(':scope > section')];
    const bounds = scrollerNode.getBoundingClientRect();
    const boardBounds = board.getBoundingClientRect();
    return {
      startGutter: boardBounds.left,
      endGutter: document.documentElement.clientWidth - boardBounds.right,
      firstLeft: first!.getBoundingClientRect().left,
      firstRight: first!.getBoundingClientRect().right,
      secondLeft: second!.getBoundingClientRect().left,
      secondRight: second!.getBoundingClientRect().right,
      left: bounds.left,
      right: bounds.right,
    };
  });
  expect(Math.abs(geometry.startGutter - geometry.endGutter), JSON.stringify(geometry)).toBeLessThanOrEqual(1);
  expect(geometry.startGutter).toBeGreaterThan(0);
  expect(geometry.firstLeft).toBeGreaterThanOrEqual(geometry.left - 1);
  expect(geometry.firstRight).toBeLessThanOrEqual(geometry.right + 1);
  expect(geometry.secondLeft).toBeLessThan(geometry.right);
  expect(geometry.secondRight).toBeGreaterThan(geometry.right);

  const lastRoute = routeOf(root, 'WP05');
  const before = await scroller.evaluate((node) => node.scrollLeft);
  await focusByKeyboard(page, lastRoute);
  await revealFocusedControlByKeyboard(page, lastRoute);
  expect(await scroller.evaluate((node) => node.scrollLeft)).toBeGreaterThan(before);
  await expectNoDocumentOverflow(page);
});

test('[T006] K3 keeps ten native choices while only In review and Blocked render', async ({ page }) => {
  const root = await openStory(page, 'k-3-filtered-lanes');
  const details = root.locator('details[data-lane-filters]');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator(':scope > summary')).toHaveText('Filter lanes');
  const fieldset = details.locator('fieldset.sk-checkbox-choice-group');
  await expect(fieldset).toHaveCount(1);
  await expect(fieldset.locator(':scope > legend')).toHaveText('Committed detailed lanes');
  const checkboxes = fieldset.getByRole('checkbox');
  await expect(checkboxes).toHaveCount(10);
  expect(await checkboxes.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value))).toEqual(LANES);
  expect(await checkboxes.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).name))).toEqual(Array(10).fill('lanes'));
  expect(await fieldset.locator('.sk-checkbox-choice-group__label').allTextContents()).toEqual(LANE_LABELS);
  expect(await fieldset.locator('.sk-checkbox-choice-group__metadata').allTextContents()).toEqual(LANE_COUNTS.map(String));
  expect(await checkboxes.evaluateAll((nodes) => nodes
    .filter((node) => (node as HTMLInputElement).checked)
    .map((node) => (node as HTMLInputElement).value))).toEqual(['in_review', 'blocked']);
  for (const checkbox of await checkboxes.all()) await expect(checkbox).toHaveAccessibleName(/\S/);
  await expect(root).toHaveAttribute('data-selected-lane-ids', '["in_review","blocked"]');

  const board = async () => laneSignature(root);
  const expected = [{ lane: 'in_review', cards: ['WP10'] }, { lane: 'blocked', cards: ['WP05'] }];
  expect(await board()).toEqual(expected);
  const planned = checkboxes.nth(1);
  await planned.focus();
  await page.keyboard.press('Space');
  await expect(planned).toBeChecked();
  await root.getByRole('button', { name: 'Apply', exact: true }).click();
  await root.getByRole('button', { name: 'Clear', exact: true }).click();
  expect(await board()).toEqual(expected);
  await expectFittingWithoutTriad(scrollerOf(root));
  await expectNoDocumentOverflow(page);
});

test('[T006] K4 adds one same-commit notice to an otherwise identical K1 board', async ({ page }) => {
  const signature = async (id: 'default' | 'k-4-snapshot-behind-log') => {
    const root = await openStory(page, id);
    return {
      commit: await root.getAttribute('data-commit'),
      lanes: await root.getAttribute('data-lane-counts'),
      ids: await root.getAttribute('data-work-package-ids'),
      truth: (await root.locator('[data-commit-truth]').innerText()).replace(/\s+/g, ' ').trim(),
      notices: await root.locator('[data-snapshot-behind-log]').count(),
    };
  };
  const k1 = await signature('default');
  const k4 = await signature('k-4-snapshot-behind-log');
  expect({ ...k4, notices: 0 }).toEqual(k1);
  expect(k4.notices).toBe(1);
  const root = page.locator('[data-mission-kanban-ten-lane-pattern]');
  const notice = root.locator('[data-snapshot-behind-log]');
  await expect(notice).toHaveAttribute('tone', 'attention');
  await expect(notice).toHaveAttribute('announce', 'polite');
  await expect(notice.locator('[slot="heading"]')).toHaveText('Snapshot behind log');
  await expect(notice).toHaveAttribute('message', 'The saved status summary and Mission history disagree at this same commit.');
  await expect(notice.locator('a, button, sk-button')).toHaveCount(0);
  const shas = await root.locator('code').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim() ?? '').filter((text) => /^[0-9a-f]{7,40}$/.test(text)));
  expect(shas).toEqual(['72c4e9a']);
});

test('[T006] K5 shows one visibly unverified overlay subordinate to committed WP03', async ({ page }) => {
  const k1 = await laneSignature(await openStory(page, 'default'));
  const root = await openStory(page, 'k-5-unverified-overlay');
  expect(await laneSignature(root)).toEqual(k1);
  const wp03 = root.locator('[data-work-package-id="WP03"]');
  await expect(wp03).toHaveAttribute('data-committed-lane', 'in_progress');
  await expect(wp03.locator('xpath=ancestor::section[@data-lane-id][1]')).toHaveAttribute('data-lane-id', 'in_progress');
  await expect(wp03.locator('[slot="reference"]')).toHaveText('Detailed lane · in_progress');
  const overlay = wp03.locator('[data-unverified-overlay]');
  await expect(overlay).toHaveCount(1);
  const tier = overlay.locator('sk-status-indicator');
  await expect(tier).toBeVisible();
  await expect(tier).toHaveAttribute('tone', 'neutral');
  expect((await tier.innerText()).replace(/\s+/g, ' ').trim()).toMatch(/Presence · unverified$/);
  await expect(overlay.getByText('lynn', { exact: true })).toBeVisible();
  await expect(overlay.getByText('→ for_review, not yet pushed', { exact: true })).toBeVisible();
  await expect(root.locator('[data-unverified-overlay]')).toHaveCount(1);
  await expect(root.locator('[data-live-overlays-shown]')).toHaveCount(1);
  await expect(root.locator('[data-live-overlays-shown]')).toHaveText('live overlays shown');
  expect(await overlay.evaluate((node) => node.closest('[data-reported-activity]'))).toBeNull();
  const text = await root.innerText();
  expect(text).not.toContain('Observed');
  expect(text).not.toContain('up to 60 s behind');
  await expect(root.locator('[data-reported-activity]')).toContainText('Reported live · ≤90s');
});

test('[T006] K6 keeps ten honest empty lanes with no action and a quiet reported-live panel', async ({ page }) => {
  const root = await openStory(page, 'k-6-empty-lanes');
  await expect(root).toHaveAttribute('data-lane-ids', JSON.stringify(LANES));
  await expect(root).toHaveAttribute('data-lane-counts', JSON.stringify(Array(10).fill(0)));
  await expect(root).toHaveAttribute('data-choice-counts', JSON.stringify(Array(10).fill(0)));
  await expect(root).toHaveAttribute('data-work-package-ids', '[]');
  const lanes = root.locator('[data-lane-id]');
  await expect(lanes).toHaveCount(10);
  expect(await lanes.locator(':scope > header > h3').allTextContents()).toEqual(LANE_LABELS);
  for (const lane of await lanes.all()) {
    await expect(lane.locator(':scope > header .sk-workflow-lane__count')).toHaveText('0');
    await expect(lane.locator(':scope > ol')).toBeEmpty();
    await expect(lane.locator(':scope > ol + [data-empty-lane]')).toHaveText('No work packages in this lane.');
  }
  await expect(root.locator('.sk-empty-state')).toHaveCount(10);
  await expect(root.locator('[data-committed-board] :is(a, button, sk-button, [role="button"], [role="link"])')).toHaveCount(0);
  await expect(root.locator('[data-reported-activity]')).toContainText('No live activity reported.');
  await expect(root.locator('[data-reported-live]')).toHaveCount(0);
});

test('[T007] the triad exists exactly while the board overflows, and a fitting board is never a tab stop', async ({
  page,
}) => {
  for (const [id, viewport] of [
    ['default', DESKTOP],
    ['k-2-narrow-contained', NARROW],
    ['k-3-filtered-lanes', NARROW],
    ['k-6-empty-lanes', DESKTOP],
  ] as const) {
    const root = await openStory(page, id, viewport);
    const scroller = scrollerOf(root);
    await expectOverflowingTriad(scroller);
    await focusByKeyboard(page, scroller);
    // Firefox scrolls a newly focused box only partly into view; the contract is that the whole
    // ring can be revealed by keyboard and is never clipped, which is what this asserts.
    await revealFocusedControlByKeyboard(page, scroller);
    await expectNoDocumentOverflow(page);
  }
  for (const [id, viewport, lastRoute] of [
    ['k-3-filtered-lanes', DESKTOP, 'WP05'],
    ['k-6-empty-lanes', { width: 2800, height: 1000 }, undefined],
  ] as const) {
    const root = await openStory(page, id, viewport);
    const scroller = scrollerOf(root);
    await expectFittingWithoutTriad(scroller);
    await page.locator('[data-mission-kanban-ten-lane-pattern] h1').click();
    let landedOnScroller = false;
    for (let index = 0; index < 90; index += 1) {
      await page.keyboard.press('Tab');
      if (await scroller.evaluate((node) => node.matches(':focus'))) landedOnScroller = true;
      if (lastRoute && await routeOf(root, lastRoute).evaluate((node) => node.matches(':focus'))) break;
    }
    expect(landedOnScroller, `${id} exposed a dead tab stop`).toBe(false);
    await expectNoDocumentOverflow(page);
  }
});

test('[T007] one mounted board follows live resize in both directions', async ({ page }) => {
  const root = await openStory(page, 'k-3-filtered-lanes', DESKTOP);
  await root.evaluate((node) => node.setAttribute('data-live-resize-sentinel', 'same-root'));
  const scroller = scrollerOf(root);
  await expectFittingWithoutTriad(scroller);
  await page.setViewportSize(NARROW);
  await expect.poll(() => overflows(scroller)).toBe(true);
  await expect.poll(() => triad(scroller)).toEqual(['region', REGION_NAME, '0']);
  await expectNoDocumentOverflow(page);
  await page.setViewportSize(DESKTOP);
  await expect.poll(() => overflows(scroller)).toBe(false);
  await expect.poll(() => triad(scroller)).toEqual([null, null, null]);
  await expect(root).toHaveAttribute('data-live-resize-sentinel', 'same-root');
});

test('[T007] one mounted board follows a content change that resizes neither the scroller nor a lane', async ({ page }) => {
  const root = await openStory(page, 'k-3-filtered-lanes', DESKTOP);
  await root.evaluate((node) => node.setAttribute('data-content-sentinel', 'same-root'));
  const board = root.locator('[data-committed-board]');
  const scroller = scrollerOf(root);
  // At the measured fit width every lane already sits at its minimum, so adding or removing a lane
  // changes scrollWidth while the scroller box and every existing lane box stay put. Chromium runs
  // headless with hidden scrollbars, so there the content observer is the only thing that can see
  // this change.
  const fitWidth = await measuredFitWidth(scroller);
  await board.evaluate((node, width) => { (node as HTMLElement).style.inlineSize = `${width}px`; }, fitWidth);
  await expect.poll(() => scroller.evaluate((node) => node.clientWidth)).toBe(fitWidth);
  await expectFittingWithoutTriad(scroller);
  const boxes = () => scroller.evaluate((node) => ({
    width: node.clientWidth,
    height: node.clientHeight,
    lanes: [...node.children].map((lane) => (lane as HTMLElement).getBoundingClientRect().width),
  }));
  const before = await boxes();
  await scroller.evaluate((node) => {
    const clone = node.querySelector(':scope > section')!.cloneNode(true) as HTMLElement;
    clone.querySelector('ol')?.replaceChildren();
    clone.setAttribute('data-content-change-probe', '');
    node.append(clone);
  });
  await expect.poll(() => triad(scroller)).toEqual(['region', REGION_NAME, '0']);
  const during = await boxes();
  expect({ width: during.width, height: during.height, lanes: during.lanes.slice(0, before.lanes.length) }).toEqual(before);
  await scroller.evaluate((node) => node.querySelector('[data-content-change-probe]')?.remove());
  await expect.poll(() => triad(scroller)).toEqual([null, null, null]);
  expect(await boxes()).toEqual(before);
  await expect(root).toHaveAttribute('data-content-sentinel', 'same-root');
});

test('[T007] the triad flips exactly at the measured board-fit width', async ({ page }) => {
  const root = await openStory(page, 'k-3-filtered-lanes', DESKTOP);
  const board = root.locator('[data-committed-board]');
  const scroller = scrollerOf(root);
  const fitWidth = await measuredFitWidth(scroller);
  expect(fitWidth).toBeGreaterThan(0);
  await board.evaluate((node, width) => { (node as HTMLElement).style.inlineSize = `${width}px`; }, fitWidth);
  await expect.poll(() => scroller.evaluate((node) => node.clientWidth)).toBe(fitWidth);
  await expect.poll(() => triad(scroller)).toEqual([null, null, null]);
  expect(await overflows(scroller)).toBe(false);
  await board.evaluate((node, width) => { (node as HTMLElement).style.inlineSize = `${width}px`; }, fitWidth - 1);
  await expect.poll(() => overflows(scroller)).toBe(true);
  await expect.poll(() => triad(scroller)).toEqual(['region', REGION_NAME, '0']);
  await board.evaluate((node, width) => { (node as HTMLElement).style.inlineSize = `${width}px`; }, fitWidth);
  await expect.poll(() => triad(scroller)).toEqual([null, null, null]);
  await expectNoDocumentOverflow(page);
});

test('[T007] the triad flips at the viewport width where K3 stops fitting, with the document contained', async ({ page }) => {
  const root = await openStory(page, 'k-3-filtered-lanes', NARROW);
  const scroller = scrollerOf(root);
  const fitWidth = await measuredFitWidth(scroller);
  // In the compact shell the scroller is the viewport minus a fixed gutter, so the flip sits at the
  // fit width plus that gutter, and both sides of it stay inside the compact range.
  const gutter = NARROW.width - (await scroller.evaluate((node) => node.clientWidth));
  const flip = fitWidth + gutter;
  expect(flip).toBeGreaterThan(NARROW.width);
  expect(flip).toBeLessThanOrEqual(860);
  await page.setViewportSize({ width: flip, height: NARROW.height });
  await expect.poll(() => scroller.evaluate((node) => node.clientWidth)).toBe(fitWidth);
  await expect.poll(() => triad(scroller)).toEqual([null, null, null]);
  await expectNoDocumentOverflow(page);
  await page.setViewportSize({ width: flip - 1, height: NARROW.height });
  await expect.poll(() => triad(scroller)).toEqual(['region', REGION_NAME, '0']);
  await expectNoDocumentOverflow(page);
});

type ObserverSnapshot = Readonly<{
  documentTimeOrigin: number;
  resizeActive: ReadonlyArray<number>;
  resizeDetached: ReadonlyArray<number>;
  contentActive: ReadonlyArray<number>;
  contentDetached: ReadonlyArray<number>;
  resizeObserved: number;
  resizeReleased: number;
  mountWatchers: number;
}>;

async function installObserverProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const NativeResizeObserver = window.ResizeObserver;
    const NativeMutationObserver = window.MutationObserver;
    const ids = new WeakMap<Node, number>();
    let nextId = 1;
    const idOf = (target: Node): number => {
      const known = ids.get(target);
      if (known !== undefined) return known;
      ids.set(target, nextId);
      nextId += 1;
      return nextId - 1;
    };
    const isScroller = (target: Node): boolean =>
      target instanceof Element && target.classList.contains('sk-workflow-board__scroller');
    const resizeActive = new Set<Element>();
    const contentActive = new Set<Node>();
    // The pattern builds its body mount watcher synchronously right after it starts observing a
    // scroller, so the next body observation after a scroller observation is the pattern's. Only
    // those are counted: Storybook's own body observers come and go on their own schedule.
    const mountWatchers = new Set<MutationObserver>();
    let expectingMountWatcher = false;
    let resizeObserved = 0;
    let resizeReleased = 0;

    class ProbedResizeObserver implements ResizeObserver {
      readonly native: ResizeObserver;
      readonly scrollers = new Set<Element>();
      constructor(callback: ResizeObserverCallback) {
        this.native = new NativeResizeObserver(callback);
      }
      observe(target: Element, options?: ResizeObserverOptions): void {
        this.native.observe(target, options);
        if (!isScroller(target) || this.scrollers.has(target)) return;
        this.scrollers.add(target);
        resizeActive.add(target);
        resizeObserved += 1;
        idOf(target);
      }
      unobserve(target: Element): void {
        this.native.unobserve(target);
        if (this.scrollers.delete(target) && resizeActive.delete(target)) resizeReleased += 1;
      }
      disconnect(): void {
        this.native.disconnect();
        for (const target of this.scrollers) if (resizeActive.delete(target)) resizeReleased += 1;
        this.scrollers.clear();
      }
    }

    class ProbedMutationObserver implements MutationObserver {
      readonly native: MutationObserver;
      readonly scrollers = new Set<Node>();
      constructor(callback: MutationCallback) {
        this.native = new NativeMutationObserver(callback);
      }
      observe(target: Node, options?: MutationObserverInit): void {
        this.native.observe(target, options);
        if (target === document.body && expectingMountWatcher) {
          mountWatchers.add(this);
          expectingMountWatcher = false;
        }
        if (!isScroller(target)) return;
        expectingMountWatcher = true;
        this.scrollers.add(target);
        contentActive.add(target);
        idOf(target);
      }
      disconnect(): void {
        this.native.disconnect();
        mountWatchers.delete(this);
        for (const target of this.scrollers) contentActive.delete(target);
        this.scrollers.clear();
      }
      takeRecords(): MutationRecord[] {
        return this.native.takeRecords();
      }
    }

    Object.defineProperty(window, 'ResizeObserver', { configurable: true, writable: true, value: ProbedResizeObserver });
    Object.defineProperty(window, 'MutationObserver', { configurable: true, writable: true, value: ProbedMutationObserver });
    Object.defineProperty(window, '__tenLaneObserverProbe', {
      configurable: true,
      value: {
        snapshot: () => ({
          documentTimeOrigin: performance.timeOrigin,
          resizeActive: [...resizeActive].map(idOf).sort((a, b) => a - b),
          resizeDetached: [...resizeActive].filter((target) => !target.isConnected).map(idOf),
          contentActive: [...contentActive].map(idOf).sort((a, b) => a - b),
          contentDetached: [...contentActive].filter((target) => !target.isConnected).map(idOf),
          resizeObserved,
          resizeReleased,
          mountWatchers: mountWatchers.size,
        }),
      },
    });
  });
}

test('[T005/T007] real Storybook reloads release every observer of the previous board', async ({ page }) => {
  await installObserverProbe(page);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(`/?path=/story/${PREFIX}k-6-empty-lanes`);
  const preview = page.frameLocator('#storybook-preview-iframe');
  const root = preview.locator('[data-mission-kanban-ten-lane-pattern]');
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root).toHaveAttribute('data-play-proof', 'passed');
  const frameDocument = preview.locator('html');
  const snapshot = () => frameDocument.evaluate(() => (window as typeof window & {
    __tenLaneObserverProbe?: { snapshot: () => ObserverSnapshot };
  }).__tenLaneObserverProbe!.snapshot());
  const reload = page.getByRole('button', { name: 'Reload story' });
  await expect(reload).toBeEnabled();

  const snapshots = [await snapshot()];
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await root.evaluate((node, value) => node.setAttribute('data-remount-cycle', String(value)), cycle);
    await reload.click();
    await expect(root).not.toHaveAttribute('data-remount-cycle', /.*/, { timeout: 20000 });
    await expect(root).toHaveAttribute('data-play-proof', 'passed');
    await expect.poll(async () => (await snapshot()).resizeActive.length).toBe(1);
    snapshots.push(await snapshot());
  }
  console.info('Ten-lane observer lifecycle evidence', JSON.stringify(snapshots));
  let sameDocument = 0;
  for (const [index, current] of snapshots.entries()) {
    expect.soft(current.resizeActive, `cycle ${index} resize targets`).toHaveLength(1);
    expect.soft(current.resizeDetached, `cycle ${index} detached resize targets`).toEqual([]);
    expect.soft(current.contentActive, `cycle ${index} content targets`).toHaveLength(1);
    expect.soft(current.contentDetached, `cycle ${index} detached content targets`).toEqual([]);
    expect.soft(current.resizeObserved - current.resizeReleased, `cycle ${index} balance`).toBe(1);
    expect.soft(current.mountWatchers, `cycle ${index} pattern mount watchers`).toBe(1);
    const previous = snapshots[index - 1];
    if (index > 0 && previous && current.documentTimeOrigin === previous.documentTimeOrigin) sameDocument += 1;
  }
  expect(sameDocument, 'at least one reload must remount inside the same document').toBeGreaterThan(0);
});

test('[T007] the shell threshold switches presentation and gutters without document overflow', async ({ page }) => {
  for (const [width, compact, gutter] of [[861, false, '24px'], [860, true, '16px']] as const) {
    const root = await openStory(page, 'default', { width, height: 900 });
    const header = root.locator('[slot="compact-header"]');
    if (compact) await expect(header).not.toHaveAttribute('inert', /.*/);
    else await expect(header).toHaveAttribute('inert', '');
    expect(await root.locator('.sk-mission-kanban-ten-lane-pattern__page')
      .evaluate((node) => [getComputedStyle(node).paddingInlineStart, getComputedStyle(node).paddingInlineEnd]))
      .toEqual([gutter, gutter]);
    await expectOverflowingTriad(scrollerOf(root));
    await expectNoDocumentOverflow(page);
  }
});

test('[T007] short viewports keep containment and keyboard-reachable, unobscured focus', async ({ page }) => {
  for (const [id, viewport] of [
    ['default', { width: 1440, height: 600 }],
    ['k-2-narrow-contained', { width: 390, height: 480 }],
  ] as const) {
    const root = await openStory(page, id, viewport);
    await expectNoDocumentOverflow(page);
    await expectOverflowingTriad(scrollerOf(root));
    const route = routeOf(root, 'WP05');
    await focusByKeyboard(page, route);
    await revealFocusedControlByKeyboard(page, route);
    const unobscured = await route.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const host = (node.getRootNode() as ShadowRoot).host;
      return hit !== null && (hit === host || host.contains(hit));
    });
    expect(unobscured, `${id} focus is covered at ${viewport.width}x${viewport.height}`).toBe(true);
  }
});

test.describe('200% zoom, layout-equivalent', () => {
  // Browser zoom at 200% halves the CSS viewport and doubles the device pixel ratio; a 1440x1024
  // window therefore lays out exactly as a 720x512 viewport at deviceScaleFactor 2.
  test.use({ viewport: { width: 720, height: 512 }, deviceScaleFactor: 2 });

  test('[T007] K1 at 200% stays contained with a compact shell and revealable focus', async ({ page }) => {
    const root = await openStory(page, 'default', { width: 720, height: 512 });
    expect(await page.evaluate(() => [window.devicePixelRatio, document.documentElement.clientWidth])).toEqual([2, 720]);
    await expect(root.locator('[slot="compact-header"]')).not.toHaveAttribute('inert', /.*/);
    await expectNoDocumentOverflow(page);
    await expectOverflowingTriad(scrollerOf(root));
    const route = routeOf(root, 'WP05');
    await focusByKeyboard(page, route);
    await revealFocusedControlByKeyboard(page, route);
  });
});

test('[T007] CSS zoom stress on K2 and long content keeps overflow local', async ({ page }) => {
  for (const id of ['k-2-narrow-contained', 'long-content'] as const) {
    const root = await openStory(page, id, { width: 780, height: 1600 });
    await root.evaluate((node) => { node.style.zoom = '2'; });
    expect(await root.evaluate((node) => getComputedStyle(node).zoom)).toBe('2');
    await expectNoDocumentOverflow(page);
    expect(await overflows(scrollerOf(root))).toBe(true);
    const route = routeOf(root, 'WP05');
    await focusByKeyboard(page, route);
    await revealFocusedControlByKeyboard(page, route);
  }
});

test('[T007] RTL runs the lanes from the inline start without document overflow', async ({ page }) => {
  for (const viewport of [DESKTOP, NARROW]) {
    const root = await openStory(page, 'rtl', viewport);
    await expect(root).toHaveAttribute('dir', 'rtl');
    await expectNoDocumentOverflow(page);
    const scroller = scrollerOf(root);
    await expectOverflowingTriad(scroller);
    const edges = await scroller.evaluate((node) => {
      const [genesis, planned] = [...node.querySelectorAll<HTMLElement>(':scope > section')];
      return {
        genesisRight: genesis!.getBoundingClientRect().right,
        plannedRight: planned!.getBoundingClientRect().right,
        scrollerRight: node.getBoundingClientRect().right,
      };
    });
    expect(edges.genesisRight).toBeGreaterThan(edges.plannedRight);
    expect(edges.genesisRight).toBeLessThanOrEqual(edges.scrollerRight + 1);
    const route = routeOf(root, 'WP05');
    await focusByKeyboard(page, route);
    await revealFocusedControlByKeyboard(page, route);
    expect(await scroller.evaluate((node) => node.scrollLeft)).toBeLessThan(0);
    await expectNoDocumentOverflow(page);
  }
});

test('[T008] LightMode is semantically identical to K1 with a resolved theme delta', async ({ page }) => {
  const facts = async (id: 'default' | 'light-mode') => {
    const root = await openStory(page, id);
    return {
      semantic: {
        lanes: await root.getAttribute('data-lane-counts'),
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

test('[T007] long localized labels and opaque values wrap or stay in the local scroller', async ({ page }) => {
  for (const viewport of [NARROW, { width: 780, height: 1200 }]) {
    const root = await openStory(page, 'long-content', viewport);
    await expectNoDocumentOverflow(page);
    await expect(root.locator('[data-lane-id="in_review"] h3')).toHaveText('Arbeitspakete in laufender Qualitätssicherungsüberprüfung');
    await expect(root).toContainText('deliberately-long-supplied-repository-label');
    const overflowingLabels = await root.locator('.sk-workflow-lane__title, .sk-checkbox-choice-group__choice').evaluateAll((nodes) =>
      nodes.filter((node) => node.scrollWidth > node.clientWidth + 1).map((node) => node.textContent?.trim()));
    expect(overflowingLabels).toEqual([]);
    expect(await overflows(scrollerOf(root))).toBe(true);
    const route = routeOf(root, 'WP05');
    await focusByKeyboard(page, route, 180);
    await revealFocusedControlByKeyboard(page, route);
  }
});

test('[T008] forced colors keep boundaries, focus, checked cues, and every truth-tier label', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const root = await openStory(page, 'forced-colors');
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  for (const label of ['Snapshot behind log', 'Presence · unverified', 'Reported live · ≤90s', 'live overlays shown', 'Git activity · factual · rendered']) {
    await expect(root).toContainText(label);
  }
  const canvasText = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'CanvasText';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  const overlay = await root.locator('[data-unverified-overlay]').evaluate((node) => ({
    style: getComputedStyle(node).borderBlockStartStyle,
    color: getComputedStyle(node).borderBlockStartColor,
  }));
  expect(overlay).toEqual({ style: 'dashed', color: canvasText });
  const laneBorder = await root.locator('[data-lane-id="genesis"]').evaluate((node) => ({
    style: getComputedStyle(node).borderBlockStartStyle,
    width: Number.parseFloat(getComputedStyle(node).borderBlockStartWidth),
  }));
  expect(laneBorder.style).not.toBe('none');
  expect(laneBorder.width).toBeGreaterThan(0);
  const route = routeOf(root, 'WP03');
  await focusByKeyboard(page, route);
  await revealFocusedControlByKeyboard(page, route);

  const filters = await openStory(page, 'k-3-filtered-lanes');
  const checked = filters.locator('input[type="checkbox"]:checked').first();
  const unchecked = filters.locator('input[type="checkbox"]:not(:checked)').first();
  const cue = (control: Locator) => control.evaluate((node) => {
    const style = getComputedStyle(node.closest('.sk-checkbox-choice-group__choice')!);
    return [style.borderBlockEndStyle, style.borderBlockEndWidth, style.fontWeight];
  });
  expect(await cue(checked)).not.toEqual(await cue(unchecked));
  await focusByKeyboard(page, checked);
  await assertVisibleFocus(checked);
});

test('[T008] reduced motion is real media emulation with no running animation and complete K5 content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const root = await openStory(page, 'reduced-motion');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
  await expect(root).toHaveAttribute('data-lane-counts', JSON.stringify(LANE_COUNTS));
  await expect(root.locator('[data-unverified-overlay]')).toContainText('→ for_review, not yet pushed');
  await expect(root.locator('[data-reported-live]')).toHaveCount(2);
});

test('[T010] K1–K6 accessibility trees expose one H1, logical headings, and separated truth tiers', async ({ page }) => {
  const evidence: Record<string, string> = {};
  for (const id of [
    'default',
    'k-2-narrow-contained',
    'k-3-filtered-lanes',
    'k-4-snapshot-behind-log',
    'k-5-unverified-overlay',
    'k-6-empty-lanes',
  ] as const) {
    const root = await openStory(page, id, id === 'k-2-narrow-contained' ? NARROW : DESKTOP);
    await expect(root.locator('h1')).toHaveCount(1);
    const snapshot = await root.ariaSnapshot();
    evidence[id] = snapshot;
    expect(snapshot).toContain('heading "Work packages" [level=1]');
    expect(snapshot).toContain('heading "Work package kanban board" [level=2]');
    expect(snapshot).toContain('heading "Live now" [level=2]');
    const expectedLanes = id === 'k-3-filtered-lanes' ? ['In review', 'Blocked'] : LANE_LABELS;
    for (const label of expectedLanes) expect(snapshot).toContain(`heading "${label}" [level=3]`);
    if (id === 'k-3-filtered-lanes') expect(snapshot).not.toContain(`region "${REGION_NAME}"`);
    else expect(snapshot).toContain(`region "${REGION_NAME}"`);
  }
  expect(evidence['default']).toContain('link "WP04"');
  expect(evidence['k-3-filtered-lanes']).toContain('group "Committed detailed lanes"');
  expect(evidence['k-3-filtered-lanes']).toContain('checkbox "In review 1" [checked]');
  expect(evidence['k-4-snapshot-behind-log']).toContain('heading "Snapshot behind log" [level=2]');
  expect(evidence['k-5-unverified-overlay']).toContain('Presence · unverified');
  expect(evidence['k-6-empty-lanes']).toContain('No work packages in this lane.');
  expect(evidence['k-6-empty-lanes']).toContain('No live activity reported.');
  console.info('Ten-lane K1–K6 accessibility-tree evidence', JSON.stringify(evidence));
});
