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

    const currentSelectors: string[] = [];
    postcss.parse(source, { from: CONTEXT_NAV_CSS }).walkRules((rule) => {
      currentSelectors.push(...selectorStrings(rule.selector).filter((selector) => selector.includes('[aria-current')));
    });
    expect(currentSelectors.length).toBeGreaterThan(0);
    expect(currentSelectors.every((selector) => selector === '.sk-context-nav__link[aria-current]:not([aria-current="false"])')).toBe(true);

    const audit = execFileSync(process.execPath, [TOKEN_LITERAL_CHECKER, CONTEXT_NAV_CSS], { encoding: 'utf8' });
    expect(audit).toContain('1 explicit component stylesheet(s) use tokens for all governed values');
  });

  test('six canonical native fixtures generate the complete exemplar barrel', () => {
    const fixtures = readGeneratedFixtures();
    expect(fixtures.map(({ name }) => name).sort()).toEqual([
      'SkContextNavCurrentNestedHTML',
      'SkContextNavDefaultHTML',
      'SkContextNavEmptyHTML',
      'SkContextNavEmptyOverflowHTML',
      'SkContextNavLongLabelsHTML',
      'SkContextNavScaleHTML',
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

  test('the surface remains absent from custom elements, wrappers, behavior, and mutation registries', () => {
    expect(existsSync('packages/elements/src/context-nav')).toBe(false);
    const forbiddenTreeFiles = execFileSync('git', ['ls-files', 'packages/elements/src', 'packages/react/src'], {
      encoding: 'utf8',
    }).trim().split('\n').filter(Boolean);
    expect(forbiddenTreeFiles.some((path) => /context-nav|skcontextnav/i.test(path))).toBe(false);
    expectTrackedFilesNotToContain('sk-context-nav|SkContextNav', [
      ...forbiddenTreeFiles,
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

  test('forced colours preserve focus, current, and nested hierarchy cues', async ({ page, browserName }) => {
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

  test('the component owns no motion under reduced-motion emulation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { nav } = await openStory(page, 'default');
    for (const link of await nav.locator('.sk-context-nav__link').all()) {
      expect(await link.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0s');
      expect(await link.evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
    }
  });

  test('LightMode uses a real sk-light ancestor and resolves different token-derived styles', async ({ page }) => {
    const darkNav = (await openStory(page, 'default')).nav;
    const dark = await darkNav.evaluate((node) => ({
      color: getComputedStyle(node).color,
      linkBackground: getComputedStyle(node.querySelector('.sk-context-nav__link')!).backgroundColor,
    }));
    const lightNav = (await openStory(page, 'light-mode')).nav;
    expect(await lightNav.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " sk-light ")]').count()).toBeGreaterThan(0);
    const light = await lightNav.evaluate((node) => ({
      color: getComputedStyle(node).color,
      linkBackground: getComputedStyle(node.querySelector('.sk-context-nav__link')!).backgroundColor,
    }));
    expect(light.color).not.toBe(dark.color);
    expect(light.linkBackground).not.toBe(dark.linkBackground);
  });
});
