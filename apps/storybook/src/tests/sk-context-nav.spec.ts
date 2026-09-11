import { expect, test, type Locator, type Page } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const CONTEXT_NAV_CSS = 'packages/styles/src/context-nav/sk-context-nav.css';
const CONTEXT_NAV_BARREL = 'packages/styles/src/context-nav/index.ts';
const STYLES_PACKAGE = 'packages/styles/package.json';
const STYLES_ROOT = 'packages/styles/src/index.ts';
const COMPONENT_USAGE_DOC = 'docs/design-system/using-components.md';
const STORY_RATCHET = 'expected-stories.json';
const TOKEN_LITERAL_CHECKER = 'scripts/check-component-token-literals.mjs';
const STORY_PREFIX = 'navigation-skcontextnav-html';

const PUBLIC_CLASSES = [
  'sk-context-nav',
  'sk-context-nav__annotation',
  'sk-context-nav__children',
  'sk-context-nav__empty-copy',
  'sk-context-nav__group',
  'sk-context-nav__heading',
  'sk-context-nav__icon',
  'sk-context-nav__item',
  'sk-context-nav__label',
  'sk-context-nav__link',
  'sk-context-nav__list',
  'sk-context-nav__overflow-link',
  'sk-context-nav__unavailable',
] as const;

const storyIds = [
  'default',
  'current-top-level',
  'current-nested',
  'current-parent',
  'no-current',
  'empty',
  'empty-overflow',
  'long-labels',
  'one-child',
  'three-children',
  'twenty-children',
  'narrow',
  'forced-colors',
  'rtl',
  'light-mode',
  'unavailable-mixed',
  'unavailable-annotation-free',
  'unavailable-all',
  'unavailable-parent',
  'unavailable-long',
  'unavailable-forced-colors',
  'unavailable-rtl',
  'unavailable-light-mode',
] as const;

type StoryId = (typeof storyIds)[number];

type LoadedStory = {
  nav: Locator;
  consoleErrors: string[];
  pageErrors: string[];
};

async function openStory(page: Page, id: StoryId): Promise<LoadedStory> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  await page.goto(`/iframe.html?id=${STORY_PREFIX}--${id}&viewMode=story`);
  const root = page.locator('#storybook-root');
  const nav = root.locator('.sk-context-nav').first();
  await nav.waitFor({ state: 'visible', timeout: 20000 });
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  return { nav, consoleErrors, pageErrors };
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function classSelectorInventory(source: string): string[] {
  const classes = new Set<string>();
  const root = postcss.parse(source, { from: CONTEXT_NAV_CSS });
  root.walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walkClasses((className) => classes.add(className.value));
    }).processSync(rule.selector);
  });
  return [...classes].sort();
}

function selectorStrings(selector: string): string[] {
  const values: string[] = [];
  selectorParser((selectors) => {
    for (const node of selectors.nodes) values.push(node.toString().trim());
  }).processSync(selector);
  return values;
}

function unpairedVisitedSelectors(source: string): string[] {
  const unpaired: string[] = [];
  postcss.parse(source, { from: CONTEXT_NAV_CSS }).walkRules((rule) => {
    const selectors = selectorStrings(rule.selector);
    for (const selector of selectors.filter((value) => value.includes(':visited'))) {
      if (!selectors.includes(selector.replaceAll(':visited', ':link'))) unpaired.push(selector);
    }
  });
  return unpaired;
}

function readGeneratedFixtures(): Array<{ name: string; html: string }> {
  const source = readFileSync(CONTEXT_NAV_BARREL, 'utf8');
  const fixtures: Array<{ name: string; html: string }> = [];
  for (const match of source.matchAll(/^export const (\w+) = (".*");$/gm)) {
    fixtures.push({ name: match[1], html: JSON.parse(match[2]) as string });
  }
  if (fixtures.length === 0) throw new Error(`no generated fixtures parsed from ${CONTEXT_NAV_BARREL}`);
  return fixtures;
}

function expectTrackedFilesNotToContain(pattern: string, paths: string[]): void {
  const result = spawnSync(
    'git',
    ['grep', '--files-with-matches', '--extended-regexp', pattern, '--', ...paths],
    { encoding: 'utf8' },
  );
  expect(result.status, result.stderr || result.stdout).toBe(1);
  expect(result.stdout).toBe('');
}

async function documentGeometry(page: Page) {
  return page.evaluate(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    return { clientWidth: scroller.clientWidth, scrollWidth: scroller.scrollWidth };
  });
}

async function linkCue(link: Locator) {
  return link.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      borderBlockEndColor: style.borderBlockEndColor,
      borderBlockEndStyle: style.borderBlockEndStyle,
      borderBlockEndWidth: style.borderBlockEndWidth,
      borderBlockStartColor: style.borderBlockStartColor,
      borderBlockStartStyle: style.borderBlockStartStyle,
      borderBlockStartWidth: style.borderBlockStartWidth,
      borderInlineEndColor: style.borderInlineEndColor,
      borderInlineEndStyle: style.borderInlineEndStyle,
      borderInlineEndWidth: style.borderInlineEndWidth,
      borderInlineStartColor: style.borderInlineStartColor,
      borderInlineStartStyle: style.borderInlineStartStyle,
      borderInlineStartWidth: style.borderInlineStartWidth,
      boxShadow: style.boxShadow,
      color: style.color,
      cursor: style.cursor,
      fill: style.fill,
      fontWeight: style.fontWeight,
      opacity: style.opacity,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      stroke: style.stroke,
      textDecorationColor: style.textDecorationColor,
      textDecorationLine: style.textDecorationLine,
      textDecorationStyle: style.textDecorationStyle,
      textDecorationThickness: style.textDecorationThickness,
    };
  });
}

async function focusVisibility(link: Locator) {
  return link.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const outlineWidth = Number.parseFloat(style.outlineWidth);
    const outlineOffset = Number.parseFloat(style.outlineOffset);
    const expansion = Math.max(0, outlineWidth + outlineOffset);
    const outlineRect = {
      top: rect.top - expansion,
      right: rect.right + expansion,
      bottom: rect.bottom + expansion,
      left: rect.left - expansion,
    };
    let clippedByAncestor = false;
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const ancestorStyle = getComputedStyle(ancestor);
      const clipsX = ['hidden', 'clip'].includes(ancestorStyle.overflowX);
      const clipsY = ['hidden', 'clip'].includes(ancestorStyle.overflowY);
      if (!clipsX && !clipsY) continue;
      const ancestorRect = ancestor.getBoundingClientRect();
      if (
        (clipsX && (outlineRect.left < ancestorRect.left || outlineRect.right > ancestorRect.right))
        || (clipsY && (outlineRect.top < ancestorRect.top || outlineRect.bottom > ancestorRect.bottom))
      ) {
        clippedByAncestor = true;
        break;
      }
    }
    return {
      clippedByAncestor,
      outlineStyle: style.outlineStyle,
      outlineWidth,
      withinViewport:
        outlineRect.left >= 0
        && outlineRect.right <= document.documentElement.clientWidth
        && outlineRect.top >= 0
        && outlineRect.bottom <= document.documentElement.clientHeight,
    };
  });
}

function nonColourCue(cue: Awaited<ReturnType<typeof linkCue>>): string {
  return JSON.stringify({
    borderBlockEndStyle: cue.borderBlockEndStyle,
    borderBlockEndWidth: cue.borderBlockEndWidth,
    borderBlockStartStyle: cue.borderBlockStartStyle,
    borderBlockStartWidth: cue.borderBlockStartWidth,
    borderInlineEndStyle: cue.borderInlineEndStyle,
    borderInlineEndWidth: cue.borderInlineEndWidth,
    borderInlineStartStyle: cue.borderInlineStartStyle,
    borderInlineStartWidth: cue.borderInlineStartWidth,
    fontWeight: cue.fontWeight,
    outlineStyle: cue.outlineStyle,
    outlineWidth: cue.outlineWidth,
    textDecorationLine: cue.textDecorationLine,
    textDecorationStyle: cue.textDecorationStyle,
    textDecorationThickness: cue.textDecorationThickness,
  });
}

function parseRgb(color: string): [number, number, number] {
  const channels = color.match(/^rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)/);
  if (channels === null) throw new Error(`expected an RGB color, received ${color}`);
  return [Number(channels[1]), Number(channels[2]), Number(channels[3])];
}

function relativeLuminance(color: string): number {
  const channels = parseRgb(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

test('the chromium project the describe below depends on still exists', () => {
  expect(test.info().config.projects.map((project) => project.name),
    'the browser-independent-once skip below is keyed on this project name').toContain('chromium');
});

test.describe('sk-context-nav source, markup, and distribution contract', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'browser-independent contracts run once');

  test('the public selector inventory is exact, token-only, logical, and behavior-free', () => {
    const source = readFileSync(CONTEXT_NAV_CSS, 'utf8');
    const code = stripComments(source);
    expect(classSelectorInventory(source)).toEqual([...PUBLIC_CLASSES].sort());
    expect(code).toContain('.sk-context-nav__link[aria-current]:not([aria-current="false"])');
    expect(code).not.toMatch(/\.is-current\b/);
    expect(code).not.toMatch(/(?:^|[;{])\s*(?:content|order|transition|animation|scroll-behavior)\s*:/m);
    expect(code).not.toMatch(/(?:\.sk-light|data-theme|:root|:host-context)/);
    expect(code).not.toMatch(/(?:margin|padding|border)-(?:left|right)|(?:left|right)\s*:/);
    expect(code).not.toMatch(/44px/i);
    expect(code).toMatch(/min-inline-size\s*:\s*0/);
    expect(code).toMatch(/overflow-wrap\s*:\s*anywhere/);
    expect(unpairedVisitedSelectors(source)).toEqual([]);
    expect((code.match(/:visited/g) ?? []).length).toBe(2);

    const unavailableSelectors: string[] = [];
    const unavailableDeclarations = new Map<string, string>();
    postcss.parse(source, { from: CONTEXT_NAV_CSS }).walkRules((rule) => {
      const selectors = selectorStrings(rule.selector).filter((selector) =>
        selector.includes('.sk-context-nav__unavailable'),
      );
      unavailableSelectors.push(...selectors);
      if (selectors.includes('.sk-context-nav__unavailable')) {
        rule.walkDecls((declaration) =>
          unavailableDeclarations.set(declaration.prop, declaration.value),
        );
      }
    });
    expect(unavailableSelectors).not.toEqual([]);
    expect(
      unavailableSelectors.every(
        (selector) => !/:hover|:active|:focus|:link|:visited/.test(selector),
      ),
    ).toBe(true);
    expect(unavailableDeclarations.get('border-inline-start-style')).toBe(
      'dashed',
    );
    expect(unavailableDeclarations.get('cursor')).not.toBe('pointer');
    expect(unavailableDeclarations.has('pointer-events')).toBe(false);
    expect(unavailableDeclarations.has('content')).toBe(false);

    const ordinaryLinkDeclarations = new Map<string, string>();
    postcss.parse(source, { from: CONTEXT_NAV_CSS }).walkRules('.sk-context-nav__link', (rule) => {
      rule.walkDecls((declaration) => ordinaryLinkDeclarations.set(declaration.prop, declaration.value));
    });
    expect(ordinaryLinkDeclarations.get('color')).toBe('inherit');
    expect(ordinaryLinkDeclarations.get('background')).toBe('transparent');
    expect(ordinaryLinkDeclarations.get('border-inline-start-color')).toBe('transparent');

    const currentSelectors: string[] = [];
    postcss.parse(source, { from: CONTEXT_NAV_CSS }).walkRules((rule) => {
      currentSelectors.push(...selectorStrings(rule.selector).filter((selector) => selector.includes('[aria-current')));
    });
    const currentSelector = '.sk-context-nav__link[aria-current]:not([aria-current="false"])';
    expect(new Set(currentSelectors)).toEqual(new Set([currentSelector, `${currentSelector}:active`]));

    const audit = execFileSync(process.execPath, [TOKEN_LITERAL_CHECKER, CONTEXT_NAV_CSS], { encoding: 'utf8' });
    expect(audit).toContain('1 explicit component stylesheet(s) use tokens for all governed values');
  });

  test('ten canonical native fixtures generate the complete exemplar barrel', () => {
    const fixtures = readGeneratedFixtures();
    expect(fixtures.map(({ name }) => name).sort()).toEqual([
      'SkContextNavCurrentNestedHTML',
      'SkContextNavDefaultHTML',
      'SkContextNavEmptyHTML',
      'SkContextNavEmptyOverflowHTML',
      'SkContextNavLongLabelsHTML',
      'SkContextNavScaleHTML',
      'SkContextNavUnavailableAllHTML',
      'SkContextNavUnavailableLongHTML',
      'SkContextNavUnavailableMixedHTML',
      'SkContextNavUnavailableParentHTML',
    ]);
    for (const { name, html } of fixtures) {
      expect(html, `${name} uses a native named nav`).toMatch(/<nav\b[^>]*class="[^"]*\bsk-context-nav\b[^>]*aria-label=/);
      expect(html, `${name} has no custom context navigation element`).not.toMatch(/<sk-context-nav\b/);
      expect(html, `${name} adds no widget role`).not.toMatch(/\brole=/);
      expect(html, `${name} adds no tab stop`).not.toMatch(/\btabindex=/);
      expect(html, `${name} carries no application behavior`).not.toMatch(/\b(?:data-|onclick|onkeydown|open=)/);
    }
  });

  test('fixtures preserve native lists, link ownership, current semantics, and decorative icon naming', () => {
    const fixtures = readGeneratedFixtures();
    const combined = fixtures.map(({ html }) => html).join('\n');
    expect(combined).toMatch(/<section\b[^>]*class="sk-context-nav__group"[^>]*aria-labelledby=/);
    expect(combined).toMatch(/<h[2-6]\b[^>]*class="sk-context-nav__heading"/);
    expect(combined).toMatch(/<ul\b[^>]*class="sk-context-nav__list"/);
    expect(combined).toMatch(/<ul\b[^>]*class="sk-context-nav__children"/);
    expect(combined).toMatch(/<li\b[^>]*class="sk-context-nav__item"/);
    expect(combined).toMatch(/<a\b[^>]*class="sk-context-nav__link"[^>]*href=/);
    expect(combined).toMatch(/<svg\b[^>]*class="sk-context-nav__icon"[^>]*aria-hidden="true"/);
    expect(combined).toMatch(/aria-current="page"/);
    expect(combined).toMatch(/aria-current="false"/);
    expect(combined).not.toMatch(/aria-expanded|aria-selected|role="(?:tree|treeitem|menu|menuitem)"/);
  });

  test('unavailable fixtures use static native content and never fabricate annotation, current state, or children', () => {
    const fixtures = readGeneratedFixtures();
    const unavailableFixtures = fixtures.filter(({ name }) =>
      name.includes('Unavailable'),
    );
    expect(unavailableFixtures).toHaveLength(4);
    const combined = unavailableFixtures.map(({ html }) => html).join('\n');
    expect(combined).toMatch(
      /<span class="sk-context-nav__unavailable" aria-disabled="true">/,
    );
    expect(combined).toMatch(
      /<span class="sk-context-nav__annotation">Unavailable<\/span>/,
    );
    expect(combined).toMatch(
      /<span class="sk-context-nav__unavailable" aria-disabled="true">\s*<span class="sk-context-nav__label">[^<]+<\/span>\s*<\/span>/,
    );
    expect(combined).not.toMatch(
      /<(?:a|button)\b[^>]*class="[^"]*sk-context-nav__unavailable/,
    );
    expect(combined).not.toMatch(
      /class="[^"]*sk-context-nav__unavailable[^>]*(?:href|role|tabindex|onclick|onkeydown)=/,
    );

    const allUnavailable = unavailableFixtures.find(
      ({ name }) => name === 'SkContextNavUnavailableAllHTML',
    )?.html;
    expect(allUnavailable).toBeTruthy();
    expect(allUnavailable).not.toMatch(/<a\b|aria-current/);

    const parent = unavailableFixtures.find(
      ({ name }) => name === 'SkContextNavUnavailableParentHTML',
    )?.html;
    expect(parent).toBeTruthy();
    expect(parent).toMatch(
      /<li class="sk-context-nav__item">\s*<span class="sk-context-nav__unavailable"[\s\S]*?<\/span>\s*<\/span>\s*<\/li>/,
    );
  });

  test('the surface remains absent from custom elements, wrappers, behavior, and mutation registries', () => {
    expect(existsSync('packages/elements/src/context-nav')).toBe(false);
    const trackedSourceFiles = execFileSync('git', ['ls-files', 'packages/elements/src', 'packages/react/src'], {
      encoding: 'utf8',
    }).trim().split('\n').filter(Boolean);
    expect(trackedSourceFiles.some((path) => /context-nav|skcontextnav/i.test(path))).toBe(false);
    const implementationTreeFiles = trackedSourceFiles.filter(
      (path) => !path.startsWith('packages/elements/src/patterns/'),
    );
    expectTrackedFilesNotToContain('sk-context-nav|SkContextNav', [
      ...implementationTreeFiles,
      'packages/elements/custom-elements.json',
      'packages/elements/vue.d.ts',
      'expected-parts.json',
      'expected-docs.json',
      'behaviours.json',
      'mutations.json',
    ]);
  });

  test('generated markup, CSS subpath, docs, and every acceptance story are public and ratcheted', () => {
    expect(readFileSync(STYLES_ROOT, 'utf8')).toMatch(/export \* from ['"]\.\/context-nav\/index['"];/);
    const packageJson = JSON.parse(readFileSync(STYLES_PACKAGE, 'utf8')) as { exports: Record<string, unknown> };
    expect(packageJson.exports['./context-nav/*']).toBe('./dist/context-nav/*');

    const ratchet = JSON.parse(readFileSync(STORY_RATCHET, 'utf8')) as { byElement: Record<string, string[]> };
    expect(ratchet.byElement['sk-context-nav']).toEqual(storyIds.map((id) => `${STORY_PREFIX}--${id}`));

    const docs = readFileSync(COMPONENT_USAGE_DOC, 'utf8');
    const start = docs.indexOf('## Native context navigation');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = docs.indexOf('\n## ', start + 4);
    const section = docs.slice(start, end === -1 ? undefined : end);
    expect(section).toMatch(/@spec-kitty\/styles\/context-nav\/sk-context-nav\.css/);
    expect(section).toMatch(/aria-current/);
    expect(section).toMatch(/aria-hidden/);
    expect(section).toMatch(/empty/i);
    expect(section).toMatch(/overflow/i);
    expect(section).toMatch(/order|count/);
    expect(section).toMatch(/URLs?/i);
    expect(section).toMatch(/ADR-10/);
    expect(section).toMatch(/sk-context-sidebar/);
    expect(section).toMatch(/no (?:JavaScript )?behavio(?:u)?r/i);

    const dependencyClaim = section.match(/The stylesheet depends on these existing semantic tokens:([\s\S]*?)\n\n/);
    expect(dependencyClaim).not.toBeNull();
    const documentedTokens = new Set(dependencyClaim![1]!.match(/--sk-[a-z0-9-]+/g) ?? []);
    const stylesheetTokens = new Set(readFileSync(CONTEXT_NAV_CSS, 'utf8').match(/var\((--sk-[a-z0-9-]+)/g)?.map((value) => value.slice(4)) ?? []);
    expect([...documentedTokens].sort()).toEqual([...stylesheetTokens].sort());
  });
});

test.describe('sk-context-nav live native semantics', () => {
  for (const id of storyIds) {
    test(`${id} loads a named native light-DOM navigation without errors`, async ({ page }) => {
      if (id === 'narrow') await page.setViewportSize({ width: 390, height: 720 });
      const { nav, consoleErrors, pageErrors } = await openStory(page, id);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(await nav.evaluate((node) => node instanceof HTMLElement && node.tagName === 'NAV')).toBe(true);
      expect(await nav.evaluate((node) => node.getRootNode() === document)).toBe(true);
      await expect(nav).toHaveRole('navigation');
      await expect(nav).toHaveAccessibleName(/\S/);
      expect(await nav.locator('[role], [tabindex]').count()).toBe(0);
    });
  }

  test('named routes render their exact current, nested, empty, and overflow states', async ({ page }) => {
    const cases = [
      ['current-top-level', '#overview', 0, 0, 0],
      ['current-nested', '#item-2', 3, 0, 0],
      ['current-parent', '#collection', 3, 0, 0],
      ['no-current', null, 0, 0, 0],
      ['empty', null, 0, 1, 0],
      ['empty-overflow', null, 0, 1, 1],
    ] as const;
    for (const [id, currentHref, childCount, emptyCount, overflowCount] of cases) {
      const { nav } = await openStory(page, id);
      const current = nav.locator('.sk-context-nav__link[aria-current]:not([aria-current="false"])');
      await expect(current).toHaveCount(currentHref === null ? 0 : 1);
      if (currentHref !== null) await expect(current).toHaveAttribute('href', currentHref);
      await expect(nav.locator('.sk-context-nav__children > .sk-context-nav__item')).toHaveCount(childCount);
      await expect(nav.locator('.sk-context-nav__empty-copy')).toHaveCount(emptyCount);
      await expect(nav.locator('a.sk-context-nav__overflow-link[href]')).toHaveCount(overflowCount);
    }
  });

  test('mixed unavailable content preserves native order, disabled state, real-link current state, and tab order', async ({
    page,
  }) => {
    const { nav } = await openStory(page, 'unavailable-mixed');
    const unavailable = nav.locator('.sk-context-nav__unavailable');
    await expect(unavailable).toHaveCount(2);
    for (const row of await unavailable.all()) {
      expect(await row.evaluate((node) => node.tagName)).toBe('SPAN');
      await expect(row).toHaveAttribute('aria-disabled', 'true');
      await expect(row).not.toHaveAttribute('href', /.+/);
      await expect(row).not.toHaveAttribute('role', /.+/);
      await expect(row).not.toHaveAttribute('tabindex', /.+/);
      expect(
        await row.evaluate((node) => ({
          contentEditable: node.isContentEditable,
          onclick: node.getAttribute('onclick'),
          onkeydown: node.getAttribute('onkeydown'),
          tabIndex: (node as HTMLElement).tabIndex,
        })),
      ).toEqual({
        contentEditable: false,
        onclick: null,
        onkeydown: null,
        tabIndex: -1,
      });
    }
    await expect(nav.getByRole('button')).toHaveCount(0);
    await expect(unavailable.getByRole('link')).toHaveCount(0);
    await expect(nav.locator('[aria-current]')).toHaveCount(1);
    await expect(
      nav.locator('a.sk-context-nav__link[href][aria-current="page"]'),
    ).toHaveCount(1);
    await expect(nav.locator(':not(a)[aria-current]')).toHaveCount(0);
    await expect(
      nav.locator('.sk-context-nav__children > .sk-context-nav__item'),
    ).toHaveCount(2);

    const hrefs = await nav
      .locator('a[href]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    await page.evaluate(() => {
      const sentinel = document.createElement('button');
      sentinel.type = 'button';
      sentinel.dataset.contextNavTabSentinel = '';
      sentinel.textContent = 'Tab-order sentinel';
      document.body.append(sentinel);
    });
    const focused: Array<string | null> = [];
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    for (let index = 0; index <= hrefs.length; index += 1) {
      await page.keyboard.press('Tab');
      focused.push(
        await page.evaluate(() => {
          const active = document.activeElement;
          if (active instanceof HTMLAnchorElement)
            return active.getAttribute('href');
          if (active?.hasAttribute('data-context-nav-tab-sentinel'))
            return 'sentinel';
          return active?.tagName ?? null;
        }),
      );
    }
    expect(focused).toEqual([...hrefs, 'sentinel']);
  });

  test('Chromium accessibility tree exposes the unavailable state and visible annotation without an action role', async ({
    page,
    browserName,
  }) => {
    expect(test.info().config.projects.map((project) => project.name), 'the chromium skip below is keyed on this project name').toContain('chromium');
    test.skip(
      browserName !== 'chromium',
      'Chromium CDP supplies the inspectable platform accessibility tree',
    );
    await openStory(page, 'unavailable-mixed');
    const session = await page.context().newCDPSession(page);
    await session.send('DOM.enable');
    await session.send('Accessibility.enable');
    const { root } = await session.send('DOM.getDocument');
    const { nodeId } = await session.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: '.sk-context-nav__unavailable',
    });
    const { node: domNode } = await session.send('DOM.describeNode', {
      nodeId,
    });
    const { nodes } = await session.send('Accessibility.getPartialAXTree', {
      nodeId,
      fetchRelatives: true,
    });
    const target = nodes.find(
      (node) => node.backendDOMNodeId === domNode.backendNodeId,
    );
    expect(target).toBeDefined();
    expect(
      target!.properties?.some(
        (property) =>
          property.name === 'disabled' && property.value?.value === true,
      ),
    ).toBe(true);

    const subtreeIds = new Set(target!.childIds ?? []);
    for (const subtreeId of subtreeIds) {
      const node = nodes.find((candidate) => candidate.nodeId === subtreeId);
      for (const childId of node?.childIds ?? []) subtreeIds.add(childId);
    }
    const subtree = [
      target!,
      ...nodes.filter((node) =>
        node.nodeId === undefined ? false : subtreeIds.has(node.nodeId),
      ),
    ];
    expect(subtree.some((node) => node.name?.value === 'Reports')).toBe(true);
    expect(subtree.some((node) => node.name?.value === 'Unavailable')).toBe(
      true,
    );
    expect(
      subtree.some((node) =>
        ['link', 'button'].includes(String(node.role?.value)),
      ),
    ).toBe(false);
  });

  test('all-unavailable and unavailable-parent routes expose no invented current item or child list', async ({
    page,
  }) => {
    const allUnavailable = (await openStory(page, 'unavailable-all')).nav;
    await expect(
      allUnavailable.locator('.sk-context-nav__unavailable'),
    ).toHaveCount(3);
    await expect(
      allUnavailable.locator('a, button, [aria-current], [tabindex]'),
    ).toHaveCount(0);

    const parent = (await openStory(page, 'unavailable-parent')).nav;
    const unavailableParent = parent.locator(
      '.sk-context-nav__item:has(> .sk-context-nav__unavailable)',
    );
    await expect(
      unavailableParent.locator(':scope > .sk-context-nav__unavailable'),
    ).toHaveCount(1);
    await expect(
      unavailableParent.locator('.sk-context-nav__children'),
    ).toHaveCount(0);
    const availableParent = parent.locator(
      '.sk-context-nav__item:has(> a.sk-context-nav__link):has(> .sk-context-nav__children)',
    );
    await expect(
      availableParent.locator(':scope > a.sk-context-nav__link[href]'),
    ).toHaveCount(1);
    await expect(
      availableParent.locator(
        ':scope > .sk-context-nav__children > .sk-context-nav__item',
      ),
    ).toHaveCount(2);
  });

  test('annotation-free route stays explicit without generated fallback copy', async ({
    page,
  }) => {
    const { nav } = await openStory(page, 'unavailable-annotation-free');
    const unavailable = nav.locator('.sk-context-nav__unavailable');
    expect(await unavailable.count()).toBeGreaterThan(0);
    await expect(
      unavailable.locator('.sk-context-nav__annotation'),
    ).toHaveCount(0);
    for (const row of await unavailable.all()) {
      await expect(row).toHaveAttribute('aria-disabled', 'true');
      await expect(row.locator('.sk-context-nav__label')).not.toHaveText('');
    }
  });

  test('Default exposes named groups, native list nesting/order, link names, and a hidden decorative icon', async ({ page }) => {
    const { nav } = await openStory(page, 'default');
    const group = nav.locator('.sk-context-nav__group').first();
    const headingId = await group.getAttribute('aria-labelledby');
    expect(headingId).toBeTruthy();
    const heading = group.locator(`#${headingId}`);
    await expect(heading).toHaveCount(1);
    expect(await heading.evaluate((node) => /^H[2-6]$/.test(node.tagName))).toBe(true);
    await expect(group).toHaveRole('region');
    await expect(group).toHaveAccessibleName(await heading.innerText());

    const topList = group.locator(':scope > .sk-context-nav__list');
    expect(await topList.evaluate((node) => node.tagName)).toBe('UL');
    await expect(topList).toHaveRole('list');
    const directItems = topList.locator(':scope > .sk-context-nav__item');
    expect(await directItems.count()).toBeGreaterThan(1);
    expect(await topList.getByRole('listitem').count()).toBeGreaterThanOrEqual(await directItems.count());

    const links = nav.getByRole('link');
    expect(await links.allInnerTexts()).toEqual(await nav.locator('a[href]').allInnerTexts());
    await expect(nav.getByRole('link', { name: 'Overview' })).toHaveCount(1);
    const icon = nav.locator('.sk-context-nav__icon').first();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect((await nav.ariaSnapshot()).match(/Overview/g)?.length).toBe(1);
  });

  test('sequential keyboard focus visits each native link once in DOM order with an unclipped outline', async ({ page }) => {
    const { nav } = await openStory(page, 'current-nested');
    const hrefs = await nav.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    const focused: Array<string | null> = [];
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    for (let index = 0; index < hrefs.length; index += 1) {
      await page.keyboard.press('Tab');
      const focusedLink = page.locator(':focus');
      focused.push(await focusedLink.getAttribute('href'));
      const focusFacts = await focusVisibility(focusedLink);
      expect(focusFacts.outlineStyle).not.toBe('none');
      expect(focusFacts.outlineWidth).toBeGreaterThan(0);
      expect(focusFacts.withinViewport).toBe(true);
      expect(focusFacts.clippedByAncestor).toBe(false);
    }
    expect(focused).toEqual(hrefs);

    const overflowNav = (await openStory(page, 'empty-overflow')).nav;
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('Tab');
    const overflowLink = overflowNav.locator('.sk-context-nav__overflow-link');
    await expect(overflowLink).toBeFocused();
    const overflowFocus = await focusVisibility(overflowLink);
    expect(overflowFocus.outlineStyle).not.toBe('none');
    expect(overflowFocus.outlineWidth).toBeGreaterThan(0);
    expect(overflowFocus.withinViewport).toBe(true);
    expect(overflowFocus.clippedByAncestor).toBe(false);
  });

  test('one, three, and twenty child routes preserve native child counts and authored order', async ({ page }) => {
    for (const [id, count] of [
      ['one-child', 1],
      ['three-children', 3],
      ['twenty-children', 20],
    ] as const) {
      const { nav } = await openStory(page, id);
      const children = nav.locator('.sk-context-nav__children').first();
      expect(await children.evaluate((node) => node.tagName)).toBe('UL');
      await expect(children.locator(':scope > .sk-context-nav__item')).toHaveCount(count);
      await expect(children.getByRole('listitem')).toHaveCount(count);
      const childItems = children.locator(':scope > .sk-context-nav__item');
      for (const item of await childItems.all()) {
        await expect(item.locator(':scope > a.sk-context-nav__link[href]')).toHaveCount(1);
      }
      const links = children.locator(':scope > li > a.sk-context-nav__link[href]');
      await expect(links).toHaveCount(count);
      const actual = await links.evaluateAll((nodes) => nodes.map((node) => ({
        href: node.getAttribute('href'),
        name: node.textContent?.trim(),
      })));
      const expected = Array.from({ length: count }, (_, index) => {
        const number = id === 'twenty-children' ? String(index + 1).padStart(2, '0') : String(index + 1);
        return {
          href: id === 'twenty-children' ? `#entry-${number}` : `#item-${number}`,
          name: `Item ${number}`,
        };
      });
      expect(actual).toEqual(expected);
    }
  });

  test('consumer markup composes through the public context-sidebar slot without shadow-root reach-through', async ({ page }) => {
    const { nav } = await openStory(page, 'current-nested');
    await page.addScriptTag({ url: '/elements-dist/elements.js' });
    await page.evaluate(async () => customElements.whenDefined('sk-context-sidebar'));
    const sidebar = await nav.evaluateHandle((node) => {
      const host = document.createElement('sk-context-sidebar') as HTMLElement & { updateComplete?: Promise<unknown> };
      host.setAttribute('label', 'Collection context container');
      host.style.inlineSize = '240px';
      node.replaceWith(host);
      host.append(node);
      return host;
    });
    await sidebar.evaluate(async (host: HTMLElement & { updateComplete?: Promise<unknown> }) => host.updateComplete);
    const facts = await sidebar.evaluate((host) => {
      const lightDomNav = host.querySelector('.sk-context-nav')!;
      const renderedSidebar = host.shadowRoot?.querySelector('[part~="sidebar"]');
      return {
        lightDom: lightDomNav.getRootNode() === document,
        assignedToPublicSlot: Boolean((lightDomNav as HTMLElement).assignedSlot),
        hasRenderedSidebar: Boolean(renderedSidebar),
        hostWidth: host.getBoundingClientRect().width,
        navWidth: lightDomNav.getBoundingClientRect().width,
        documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(facts.lightDom).toBe(true);
    expect(facts.assignedToPublicSlot).toBe(true);
    expect(facts.hasRenderedSidebar).toBe(true);
    expect(facts.hostWidth).toBe(240);
    expect(facts.navWidth).toBeGreaterThan(0);
    expect(facts.navWidth).toBeLessThanOrEqual(facts.hostWidth);
    expect(facts.documentOverflow).toBe(false);
  });
});

test.describe('sk-context-nav state and resilience contract', () => {
  test('only non-false aria-current links receive current non-colour cues', async ({ page }) => {
    const { nav } = await openStory(page, 'long-labels');
    const current = nav.locator('.sk-context-nav__link[aria-current]:not([aria-current="false"])');
    const explicitFalse = nav.locator('.sk-context-nav__link[aria-current="false"]');
    const ordinary = nav.locator('.sk-context-nav__link:not([aria-current])').first();
    await expect(current).toHaveCount(0);
    await expect(explicitFalse).toHaveCount(1);
    expect(await linkCue(explicitFalse)).toEqual(await linkCue(ordinary));

    const nested = (await openStory(page, 'current-nested')).nav;
    const nestedCurrent = nested.locator('.sk-context-nav__link[aria-current]:not([aria-current="false"])');
    await expect(nestedCurrent).toHaveCount(1);
    const currentCue = await linkCue(nestedCurrent);
    const ordinaryCue = await linkCue(nested.locator('.sk-context-nav__link:not([aria-current])').first());
    expect(currentCue.fontWeight).not.toBe(ordinaryCue.fontWeight);
    expect(currentCue.borderInlineStartWidth).not.toBe(ordinaryCue.borderInlineStartWidth);

    for (const [id, href] of [
      ['current-top-level', '#overview'],
      ['current-nested', '#item-2'],
      ['current-parent', '#collection'],
    ] as const) {
      const routeNav = (await openStory(page, id)).nav;
      const routeCurrent = routeNav.locator('.sk-context-nav__link[aria-current]:not([aria-current="false"])');
      await expect(routeCurrent).toHaveCount(1);
      await expect(routeCurrent).toHaveAttribute('href', href);
    }
    await expect((await openStory(page, 'no-current')).nav.locator('.sk-context-nav__link[aria-current]:not([aria-current="false"])')).toHaveCount(0);
  });

  test('hover, active, focus-visible, and current have distinct shape/weight/border/outline cues', async ({ page }) => {
    const { nav } = await openStory(page, 'current-top-level');
    const ordinary = nav.locator('.sk-context-nav__link:not([aria-current])').first();
    const current = nav.locator('.sk-context-nav__link[aria-current]:not([aria-current="false"])');
    const restCue = await linkCue(ordinary);
    await ordinary.hover();
    const hoverCue = await linkCue(ordinary);
    const box = await ordinary.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    const activeCue = await linkCue(ordinary);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(ordinary).toBeFocused();
    const focusCue = await linkCue(ordinary);
    const currentCue = await linkCue(current);

    expect(hoverCue.textDecorationLine).not.toBe(restCue.textDecorationLine);
    expect(activeCue.borderInlineStartStyle).not.toBe(restCue.borderInlineStartStyle);
    expect(activeCue.borderInlineStartWidth).not.toBe(restCue.borderInlineStartWidth);
    expect(focusCue.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(focusCue.outlineWidth)).toBeGreaterThan(0);
    expect(currentCue.fontWeight).not.toBe(restCue.fontWeight);
    expect(currentCue.borderInlineStartWidth).not.toBe(restCue.borderInlineStartWidth);
    expect(new Set([restCue, hoverCue, activeCue, focusCue, currentCue].map(nonColourCue))).toHaveProperty('size', 5);
  });

  test('unavailable content is non-colour distinct and gains no hover, active, pointer, focus, or activation affordance', async ({
    page,
  }) => {
    const { nav } = await openStory(page, 'unavailable-mixed');
    const unavailable = nav.locator('.sk-context-nav__unavailable').first();
    const link = nav.locator('.sk-context-nav__link').first();
    const restCue = await linkCue(unavailable);
    const linkRestCue = await linkCue(link);
    expect(restCue.borderInlineStartStyle).toBe('dashed');
    expect(restCue.borderInlineStartStyle).not.toBe(
      linkRestCue.borderInlineStartStyle,
    );
    expect(restCue.cursor).not.toBe('pointer');
    await expect(unavailable.locator('.sk-context-nav__annotation')).toHaveText(
      /unavailable/i,
    );

    await unavailable.hover();
    expect(await linkCue(unavailable)).toEqual(restCue);
    const box = await unavailable.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    expect(await unavailable.evaluate((node) => node.matches(':active'))).toBe(
      true,
    );
    expect(await linkCue(unavailable)).toEqual(restCue);
    await page.mouse.up();

    const url = page.url();
    await unavailable.click();
    expect(page.url()).toBe(url);
    await unavailable.evaluate((node) => (node as HTMLElement).focus());
    await expect(unavailable).not.toBeFocused();
    expect(await linkCue(unavailable)).toEqual(restCue);
  });

  test('current rest, hover, and trusted mouse-down have distinct non-colour cues', async ({ page }) => {
    const { nav } = await openStory(page, 'current-top-level');
    const current = nav.locator('.sk-context-nav__link[aria-current]:not([aria-current="false"])');
    const restCue = await linkCue(current);
    await current.hover();
    const hoverCue = await linkCue(current);
    const box = await current.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    expect(await current.evaluate((node) => node.matches(':active'))).toBe(true);
    const activeCue = await linkCue(current);
    await page.mouse.up();

    expect(new Set([restCue, hoverCue, activeCue].map(nonColourCue))).toHaveProperty('size', 3);
  });

  test('focused LightMode link outline reaches 3:1 against every adjacent light surface', async ({ page }) => {
    const { nav } = await openStory(page, 'light-mode');
    const link = nav.locator('.sk-context-nav__link:not([aria-current])').first();
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    const colors = await link.evaluate((node) => {
      const style = getComputedStyle(node);
      const frame = node.closest('[data-context-nav-story-frame]');
      if (frame === null) throw new Error('context navigation story frame is missing');
      return {
        frameBackground: getComputedStyle(frame).backgroundColor,
        linkBackground: style.backgroundColor,
        outlineColor: style.outlineColor,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });
    expect(colors.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(colors.outlineWidth)).toBeGreaterThan(0);
    expect(colors.linkBackground).toBe('rgba(0, 0, 0, 0)');
    expect(
      contrastRatio(colors.outlineColor, colors.frameBackground),
      `${colors.outlineColor} focus outline against frame background ${colors.frameBackground}`,
    ).toBeGreaterThanOrEqual(3);
  });

  test('primary rows meet the minimum target and visited history remains presentation-neutral', async ({ page }) => {
    for (const id of ['default', 'narrow', 'rtl', 'light-mode'] as const) {
      if (id === 'narrow') await page.setViewportSize({ width: 390, height: 720 });
      const { nav } = await openStory(page, id);
      for (const link of await nav.locator('.sk-context-nav__list > .sk-context-nav__item > .sk-context-nav__link').all()) {
        const box = await link.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }

    await page.setViewportSize({ width: 1280, height: 720 });
    const { nav } = await openStory(page, 'default');
    const visitedCandidate = nav.locator('.sk-context-nav__link[href="#context-nav-visited"]');
    const before = await linkCue(visitedCandidate);
    await visitedCandidate.click();
    await expect(page).toHaveURL(/#context-nav-visited$/);
    await page.mouse.move(0, 0);
    const after = await linkCue(visitedCandidate);
    expect(after).toEqual(before);
  });

  test('long, narrow, scale, RTL, and 390px routes do not widen the document or clip full names', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    for (const id of ['long-labels', 'narrow', 'twenty-children', 'rtl'] as const) {
      const { nav } = await openStory(page, id);
      const geometry = await documentGeometry(page);
      expect(geometry.scrollWidth).toBe(geometry.clientWidth);
      const navGeometry = await nav.evaluate((node) => ({ clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }));
      expect(navGeometry.scrollWidth).toBeLessThanOrEqual(navGeometry.clientWidth);
      for (const label of await nav.locator('.sk-context-nav__label').all()) {
        const text = (await label.innerText()).trim().replace(/\s+/g, ' ');
        const link = label.locator('xpath=ancestor::a[1]');
        await expect(link).toHaveAccessibleName(text);
        const facts = await label.evaluate((node) => {
          const link = node.closest('a')!;
          return {
          visible: node.getClientRects().length > 0,
          overflowWrap: getComputedStyle(node).overflowWrap,
            labelHorizontalClip: node.scrollWidth > node.clientWidth + 1,
            labelVerticalClip: node.scrollHeight > node.clientHeight + 1,
            linkHorizontalClip: link.scrollWidth > link.clientWidth + 1,
            linkVerticalClip: link.scrollHeight > link.clientHeight + 1,
          };
        });
        expect(text).not.toBe('');
        expect(facts.visible).toBe(true);
        expect(facts.overflowWrap).toBe('anywhere');
        expect(facts.labelHorizontalClip).toBe(false);
        expect(facts.labelVerticalClip).toBe(false);
        expect(facts.linkHorizontalClip).toBe(false);
        expect(facts.linkVerticalClip).toBe(false);
      }
    }
  });

  test('unavailable labels and annotations remain complete at 240px and a 390px viewport in LTR and RTL', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    for (const id of ['unavailable-long', 'unavailable-rtl'] as const) {
      const { nav } = await openStory(page, id);
      const frame = nav.locator(
        'xpath=ancestor::*[@data-context-nav-story-frame]',
      );
      const frameBox = await frame.boundingBox();
      expect(frameBox).not.toBeNull();
      expect(frameBox!.width).toBeLessThanOrEqual(240);
      expect(await documentGeometry(page)).toEqual({
        clientWidth: 390,
        scrollWidth: 390,
      });
      const navGeometry = await nav.evaluate((node) => ({
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
      }));
      expect(navGeometry.scrollWidth).toBeLessThanOrEqual(
        navGeometry.clientWidth,
      );
      for (const content of await nav
        .locator(
          '.sk-context-nav__unavailable .sk-context-nav__label, .sk-context-nav__annotation',
        )
        .all()) {
        const text = (await content.innerText()).trim();
        expect(text).not.toBe('');
        const facts = await content.evaluate((node) => {
          const row = node.closest('.sk-context-nav__unavailable')!;
          return {
            contentHorizontalClip: node.scrollWidth > node.clientWidth + 1,
            contentVerticalClip: node.scrollHeight > node.clientHeight + 1,
            overflowWrap: getComputedStyle(node).overflowWrap,
            rowHorizontalClip: row.scrollWidth > row.clientWidth + 1,
            rowVerticalClip: row.scrollHeight > row.clientHeight + 1,
          };
        });
        expect(facts.overflowWrap).toBe('anywhere');
        expect(facts.contentHorizontalClip).toBe(false);
        expect(facts.contentVerticalClip).toBe(false);
        expect(facts.rowHorizontalClip).toBe(false);
        expect(facts.rowVerticalClip).toBe(false);
      }
      if (id === 'unavailable-rtl')
        expect(
          await nav.evaluate((node) => getComputedStyle(node).direction),
        ).toBe('rtl');
    }
  });

  test('forced colours preserve focus, current, and nested hierarchy cues', async ({ page, browserName }) => {
    expect(test.info().config.projects.map((project) => project.name), 'the chromium skip below is keyed on this project name').toContain('chromium');
    test.skip(browserName !== 'chromium', 'Playwright forced-colours emulation is Chromium-only');
    await page.emulateMedia({ forcedColors: 'active' });
    const { nav } = await openStory(page, 'forced-colors');
    const current = nav.locator('.sk-context-nav__link[aria-current]:not([aria-current="false"])');
    const children = nav.locator('.sk-context-nav__children').first();
    const currentCue = await linkCue(current);
    expect(currentCue.borderInlineStartStyle).not.toBe('none');
    expect(Number.parseFloat(currentCue.borderInlineStartWidth)).toBeGreaterThan(0);
    expect(currentCue.borderInlineStartColor).not.toBe(currentCue.backgroundColor);
    const hierarchyCue = await children.evaluate((node) => ({
      backgroundColor: getComputedStyle(node).backgroundColor,
      borderColor: getComputedStyle(node).borderInlineStartColor,
      borderStyle: getComputedStyle(node).borderInlineStartStyle,
    }));
    expect(hierarchyCue.borderStyle).not.toBe('none');
    expect(hierarchyCue.borderColor).not.toBe(hierarchyCue.backgroundColor);
    const ordinary = nav.locator('.sk-context-nav__link:not([aria-current])').first();
    await ordinary.focus();
    const focusCue = await linkCue(ordinary);
    expect(focusCue.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(focusCue.outlineWidth)).toBeGreaterThan(0);
    expect(focusCue.outlineColor).not.toBe(focusCue.backgroundColor);
  });

  test('forced colours preserve a visibly static unavailable cue', async ({
    page,
    browserName,
  }) => {
    expect(test.info().config.projects.map((project) => project.name), 'the chromium skip below is keyed on this project name').toContain('chromium');
    test.skip(
      browserName !== 'chromium',
      'Playwright forced-colours emulation is Chromium-only',
    );
    await page.emulateMedia({ forcedColors: 'active' });
    const { nav } = await openStory(page, 'unavailable-forced-colors');
    const unavailable = nav.locator('.sk-context-nav__unavailable').first();
    const cue = await linkCue(unavailable);
    expect(cue.borderInlineStartStyle).toBe('dashed');
    expect(Number.parseFloat(cue.borderInlineStartWidth)).toBeGreaterThan(0);
    expect(cue.borderInlineStartColor).not.toBe(cue.backgroundColor);
    expect(cue.cursor).not.toBe('pointer');
  });

  test('the component owns no motion under reduced-motion emulation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { nav } = await openStory(page, 'default');
    for (const link of await nav.locator('.sk-context-nav__link').all()) {
      expect(await link.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0s');
      expect(await link.evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
    }
    const unavailableNav = (await openStory(page, 'unavailable-mixed')).nav;
    for (const row of await unavailableNav
      .locator('.sk-context-nav__unavailable')
      .all()) {
      expect(
        await row.evaluate((node) => getComputedStyle(node).transitionDuration),
      ).toBe('0s');
      expect(
        await row.evaluate((node) => getComputedStyle(node).animationName),
      ).toBe('none');
    }
  });

  test('LightMode uses a real sk-light ancestor and resolves different token-derived styles', async ({ page }) => {
    const darkNav = (await openStory(page, 'default')).nav;
    const dark = await darkNav.evaluate((node) => ({
      color: getComputedStyle(node).color,
      frameBackground: getComputedStyle(node.closest('[data-context-nav-story-frame]')!).backgroundColor,
      linkBackground: getComputedStyle(node.querySelector('.sk-context-nav__link:not([aria-current]:not([aria-current="false"]))')!).backgroundColor,
    }));
    const lightNav = (await openStory(page, 'light-mode')).nav;
    expect(await lightNav.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " sk-light ")]').count()).toBeGreaterThan(0);
    const light = await lightNav.evaluate((node) => ({
      color: getComputedStyle(node).color,
      frameBackground: getComputedStyle(node.closest('[data-context-nav-story-frame]')!).backgroundColor,
      linkBackground: getComputedStyle(node.querySelector('.sk-context-nav__link:not([aria-current]:not([aria-current="false"]))')!).backgroundColor,
    }));
    expect(light.color).not.toBe(dark.color);
    expect(light.frameBackground).not.toBe(dark.frameBackground);
    expect(light.linkBackground).toBe('rgba(0, 0, 0, 0)');
    expect(dark.linkBackground).toBe('rgba(0, 0, 0, 0)');

    const darkUnavailable = (await openStory(page, 'unavailable-mixed')).nav
      .locator('.sk-context-nav__unavailable')
      .first();
    const darkUnavailableColor = await darkUnavailable.evaluate(
      (node) => getComputedStyle(node).color,
    );
    const lightUnavailableNav = (
      await openStory(page, 'unavailable-light-mode')
    ).nav;
    expect(
      await lightUnavailableNav
        .locator(
          'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " sk-light ")]',
        )
        .count(),
    ).toBeGreaterThan(0);
    const lightUnavailableColor = await lightUnavailableNav
      .locator('.sk-context-nav__unavailable')
      .first()
      .evaluate((node) => getComputedStyle(node).color);
    expect(lightUnavailableColor).not.toBe(darkUnavailableColor);
  });
});
