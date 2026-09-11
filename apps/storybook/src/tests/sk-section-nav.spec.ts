import { expect, test, type Locator, type Page } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const SECTION_NAV_CSS = 'packages/styles/src/section-nav/sk-section-nav.css';
const SECTION_NAV_BARREL = 'packages/styles/src/section-nav/index.ts';
const STYLES_PACKAGE = 'packages/styles/package.json';
const STYLES_ROOT = 'packages/styles/src/index.ts';
const COMPONENT_USAGE_DOC = 'docs/design-system/using-components.md';
const STORY_RATCHET = 'expected-stories.json';
const TOKEN_LITERAL_CHECKER = 'scripts/check-component-token-literals.mjs';
const STORY_PREFIX = 'navigation-sksectionnav-html';

const PUBLIC_CLASSES = ['sk-section-nav', 'sk-section-nav__link'] as const;

const storyIds = [
  'default',
  'current-first',
  'current-last',
  'no-current',
  'one-route',
  'two-route',
  'many-routes',
  'long-labels',
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
  const nav = root.locator('.sk-section-nav').first();
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
  const root = postcss.parse(source, { from: SECTION_NAV_CSS });
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
  postcss.parse(source, { from: SECTION_NAV_CSS }).walkRules((rule) => {
    const selectors = selectorStrings(rule.selector);
    for (const selector of selectors.filter((value) => value.includes(':visited'))) {
      if (!selectors.includes(selector.replaceAll(':visited', ':link'))) unpaired.push(selector);
    }
  });
  return unpaired;
}

function readGeneratedFixtures(): Array<{ name: string; html: string }> {
  const source = readFileSync(SECTION_NAV_BARREL, 'utf8');
  const fixtures: Array<{ name: string; html: string }> = [];
  for (const match of source.matchAll(/^export const (\w+) = (".*");$/gm)) {
    fixtures.push({ name: match[1], html: JSON.parse(match[2]) as string });
  }
  if (fixtures.length === 0) throw new Error(`no generated fixtures parsed from ${SECTION_NAV_BARREL}`);
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
      color: style.color,
      cursor: style.cursor,
      fontWeight: style.fontWeight,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
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

/**
 * Presses Tab up to `maxPresses` times, recording the href of every native anchor that receives
 * focus (or 'sentinel' for the tab-order sentinel button, which ends collection).
 *
 * A non-anchor Tab stop (e.g. the browser's own scrollport-focusability default on the family's
 * `overflow-x: auto` container in Chromium/Firefox) is skipped rather than recorded — that is a
 * platform behaviour orthogonal to this family's own contract, which owns no keyboard script and
 * makes no claim about whether its scroll container is ALSO independently tab-reachable. FR-016
 * is about the anchors: reaching every link exactly once, in source order.
 */
async function collectAnchorTabSequence(page: Page, maxPresses: number): Promise<string[]> {
  const sequence: string[] = [];
  for (let index = 0; index < maxPresses; index += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const active = document.activeElement;
      if (active instanceof HTMLAnchorElement) return { kind: 'anchor' as const, href: active.getAttribute('href') };
      if (active?.hasAttribute('data-section-nav-tab-sentinel')) return { kind: 'sentinel' as const };
      return { kind: 'other' as const };
    });
    if (info.kind === 'anchor') sequence.push(info.href ?? '');
    else if (info.kind === 'sentinel') {
      sequence.push('sentinel');
      break;
    }
  }
  return sequence;
}

/**
 * Establishes real keyboard-Tab modality (a prerequisite for :focus-visible in every evergreen
 * engine) by clicking a neutral point well clear of any rendered link, then presses Tab up to
 * `maxPresses` times until a native anchor with the given href is focused. Tolerates an extra,
 * non-anchor Tab stop landing first (e.g. the browser's own scrollport-focusability default on
 * this family's `overflow-x: auto` container) the same way collectAnchorTabSequence does.
 */
async function focusViaKeyboard(page: Page, href: string, maxPresses: number): Promise<boolean> {
  await page.mouse.click(600, 600);
  for (let index = 0; index < maxPresses; index += 1) {
    await page.keyboard.press('Tab');
    const activeHref = await page.evaluate(() =>
      document.activeElement instanceof HTMLAnchorElement ? document.activeElement.getAttribute('href') : null,
    );
    if (activeHref === href) return true;
  }
  return false;
}

/**
 * HOST-PREFERENCE LIMITATION, NOT A LIBRARY ONE — read before touching any Tab-entry assertion
 * below.
 *
 * WebKit (Safari) ships with sequential-focus navigation scoped to text fields and lists by
 * default; anchors are excluded unless the user's own OS "Full Keyboard Access" preference is on.
 * `playwright.config.ts:28-38` already carries the precedent for exactly this class of gap —
 * `firefoxUserPrefs: { 'accessibility.tabfocus': 7 }` widens Firefox's own default the same way —
 * but Playwright exposes no equivalent override for WebKit, and this shared config is not the
 * place to invent one (every other family's WebKit lane would inherit it unreviewed). So a real
 * `page.keyboard.press('Tab')` walk that expects to land on `.sk-section-nav__link` never will on
 * WebKit, regardless of anything this family's own CSS or markup does.
 *
 * The fix below is CI-verified against a real WebKit with proper deps by
 * `form-input-contrast-touch-target-contract-01M25STR` (mission #336), which hit the identical gap
 * for a radio group and confirmed empirically that scoping the Tab-ENTRY step to chromium/firefox,
 * then reaching the same target via a direct `.focus()` on WebKit and running the identical
 * downstream assertions, goes green there. This checkout cannot run WebKit locally (the sandbox is
 * missing its system libraries), so this specific scoping has not been locally re-confirmed here —
 * only #336's own instance of the pattern has been. CI is what actually proves it for this file.
 */

function nonColourCue(cue: Awaited<ReturnType<typeof linkCue>>): string {
  return JSON.stringify({
    borderBlockEndStyle: cue.borderBlockEndStyle,
    borderBlockEndWidth: cue.borderBlockEndWidth,
    fontWeight: cue.fontWeight,
    outlineStyle: cue.outlineStyle,
    outlineWidth: cue.outlineWidth,
    textDecorationLine: cue.textDecorationLine,
    textDecorationStyle: cue.textDecorationStyle,
    textDecorationThickness: cue.textDecorationThickness,
  });
}

test.describe('sk-section-nav source, markup, and distribution contract', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'browser-independent contracts run once');

  test('the public selector inventory is exact, token-only, logical, and behavior-free', () => {
    const source = readFileSync(SECTION_NAV_CSS, 'utf8');
    const code = stripComments(source);
    expect(classSelectorInventory(source)).toEqual([...PUBLIC_CLASSES].sort());
    expect(code).toContain('.sk-section-nav__link[aria-current]:not([aria-current="false"])');
    expect(code).not.toMatch(/\.is-current\b/);
    expect(code).not.toMatch(/(?:^|[;{])\s*(?:content|order|transition|animation|scroll-behavior)\s*:/m);
    expect(code).not.toMatch(/(?:\.sk-light|data-theme|:root|:host-context)/);
    expect(code).not.toMatch(/(?:margin|padding|border)-(?:left|right)|(?:left|right)\s*:/);
    expect(code).not.toMatch(/44px/i);
    expect(code).not.toMatch(/\brole\s*[:=]/);
    expect(code).not.toMatch(/tablist|tabpanel|aria-controls|aria-selected/);
    expect(code).toMatch(/min-inline-size\s*:\s*0/);
    expect(code).toMatch(/overflow-wrap\s*:\s*anywhere/);
    expect(code).toMatch(/overflow-x\s*:\s*auto/);
    expect(unpairedVisitedSelectors(source)).toEqual([]);
    expect((code.match(/:visited/g) ?? []).length).toBe(1);

    const ordinaryLinkDeclarations = new Map<string, string>();
    postcss.parse(source, { from: SECTION_NAV_CSS }).walkRules('.sk-section-nav__link', (rule) => {
      rule.walkDecls((declaration) => ordinaryLinkDeclarations.set(declaration.prop, declaration.value));
    });
    expect(ordinaryLinkDeclarations.get('color')).toBe('inherit');
    expect(ordinaryLinkDeclarations.get('background')).toBe('transparent');
    expect(ordinaryLinkDeclarations.get('border-block-end-color')).toBe('transparent');

    const currentSelectors: string[] = [];
    postcss.parse(source, { from: SECTION_NAV_CSS }).walkRules((rule) => {
      currentSelectors.push(...selectorStrings(rule.selector).filter((selector) => selector.includes('[aria-current')));
    });
    const currentSelector = '.sk-section-nav__link[aria-current]:not([aria-current="false"])';
    expect(new Set(currentSelectors)).toEqual(new Set([currentSelector, `${currentSelector}:active`]));

    const audit = execFileSync(process.execPath, [TOKEN_LITERAL_CHECKER, SECTION_NAV_CSS], { encoding: 'utf8' });
    expect(audit).toContain('1 explicit component stylesheet(s) use tokens for all governed values');
  });

  test('six canonical native fixtures generate the complete exemplar barrel', () => {
    const fixtures = readGeneratedFixtures();
    expect(fixtures.map(({ name }) => name).sort()).toEqual([
      'SkSectionNavDefaultHTML',
      'SkSectionNavLongLabelsHTML',
      'SkSectionNavManyRoutesHTML',
      'SkSectionNavNoCurrentHTML',
      'SkSectionNavOneRouteHTML',
      'SkSectionNavTwoRouteHTML',
    ]);
    for (const { name, html } of fixtures) {
      expect(html, `${name} uses a native labelled nav`).toMatch(/<nav\b[^>]*class="[^"]*\bsk-section-nav\b[^>]*aria-label=/);
      expect(html, `${name} has no custom section navigation element`).not.toMatch(/<sk-section-nav\b/);
      expect(html, `${name} adds no widget role`).not.toMatch(/\brole=/);
      expect(html, `${name} adds no tab stop`).not.toMatch(/\btabindex=/);
      expect(html, `${name} carries no application behavior`).not.toMatch(/\b(?:data-|onclick|onkeydown)/);
      expect(html, `${name} adds no tab/controls wiring`).not.toMatch(/aria-controls|aria-selected|aria-expanded/);
      expect(html, `${name} every destination is a real anchor`).toMatch(/<a\b[^>]*class="sk-section-nav__link"[^>]*href=/);
    }
  });

  test('fixtures preserve native link ownership and current semantics with no default copy', () => {
    const fixtures = readGeneratedFixtures();
    const combined = fixtures.map(({ html }) => html).join('\n');
    expect(combined).toMatch(/aria-current="page"/);
    expect(combined).toMatch(/aria-current="false"/);
    // Six links across six fixtures carry no aria-current at all — a fully valid absent form.
    const linksWithoutCurrent = combined.match(/<a\b(?![^>]*aria-current)[^>]*class="sk-section-nav__link"[^>]*>/g) ?? [];
    expect(linksWithoutCurrent.length).toBeGreaterThan(0);
  });

  test('the surface remains absent from custom elements, wrappers, behavior, and mutation registries', () => {
    expect(existsSync('packages/elements/src/section-nav')).toBe(false);
    const trackedSourceFiles = execFileSync('git', ['ls-files', 'packages/elements/src', 'packages/react/src'], {
      encoding: 'utf8',
    }).trim().split('\n').filter(Boolean);
    expect(trackedSourceFiles.some((path) => /section-nav|sksectionnav/i.test(path))).toBe(false);
    const implementationTreeFiles = trackedSourceFiles.filter(
      (path) => !path.startsWith('packages/elements/src/patterns/'),
    );
    expectTrackedFilesNotToContain('sk-section-nav|SkSectionNav', [
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
    expect(readFileSync(STYLES_ROOT, 'utf8')).toMatch(/export \* from ['"]\.\/section-nav\/index['"];/);
    const packageJson = JSON.parse(readFileSync(STYLES_PACKAGE, 'utf8')) as { exports: Record<string, unknown> };
    expect(packageJson.exports['./section-nav/*']).toBe('./dist/section-nav/*');

    const ratchet = JSON.parse(readFileSync(STORY_RATCHET, 'utf8')) as { byElement: Record<string, string[]> };
    expect(ratchet.byElement['sk-section-nav']).toEqual(storyIds.map((id) => `${STORY_PREFIX}--${id}`));

    const docs = readFileSync(COMPONENT_USAGE_DOC, 'utf8');
    const start = docs.indexOf('## Section navigation');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = docs.indexOf('\n## ', start + 4);
    const section = docs.slice(start, end === -1 ? undefined : end);
    expect(section).toMatch(/@spec-kitty\/styles\/section-nav\/sk-section-nav\.css/);
    expect(section).toMatch(/aria-current/);
    expect(section).toMatch(/permission/i);
    expect(section).toMatch(/44/);
    expect(section).toMatch(/forced-colors/);
    expect(section).toMatch(/rtl/i);
    expect(section).toMatch(/tablist/);
    expect(section).toMatch(/ADR-10/);
    expect(section).toMatch(/sk-context-nav/);
    expect(section).toMatch(/sk-nav-pill/);
    expect(section).toMatch(/sk-breadcrumbs/);
    expect(section).toMatch(/sk-segmented-choice/);
    expect(section).toMatch(/no (?:JavaScript )?behavio(?:u)?r|roving/i);

    const dependencyClaim = section.match(/The stylesheet depends on these existing semantic tokens:([\s\S]*?)\n\n/);
    expect(dependencyClaim).not.toBeNull();
    const documentedTokens = new Set(dependencyClaim![1]!.match(/--sk-[a-z0-9-]+/g) ?? []);
    const stylesheetTokens = new Set(readFileSync(SECTION_NAV_CSS, 'utf8').match(/var\((--sk-[a-z0-9-]+)/g)?.map((value) => value.slice(4)) ?? []);
    expect([...documentedTokens].sort()).toEqual([...stylesheetTokens].sort());
  });
});

test.describe('sk-section-nav live native semantics', () => {
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
      // No tab-widget role and no explicit tabindex anywhere in the subtree (FR-014/FR-015).
      expect(await nav.locator('[role], [tabindex]').count()).toBe(0);
      const links = nav.locator('a[href]');
      expect(await links.count()).toBeGreaterThan(0);
      await expect(nav.getByRole('link')).toHaveCount(await links.count());
    });
  }

  test('current-first, current-middle, current-last, and no-current routes report exactly the consumer-supplied current link', async ({ page }) => {
    const cases = [
      ['current-first', '#overview'],
      ['default', '#members'],
      ['current-last', '#settings'],
    ] as const;
    for (const [id, href] of cases) {
      const { nav } = await openStory(page, id);
      const current = nav.locator('.sk-section-nav__link[aria-current]:not([aria-current="false"])');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute('href', href);
    }
    const { nav: noCurrentNav } = await openStory(page, 'no-current');
    await expect(noCurrentNav.locator('.sk-section-nav__link[aria-current]:not([aria-current="false"])')).toHaveCount(0);
    await expect(noCurrentNav.locator('.sk-section-nav__link[aria-current="false"]')).toHaveCount(1);
  });

  test('permission-supplied subsets render exactly the given links, in order, with no reserved space', async ({ page }) => {
    const { nav: oneRoute } = await openStory(page, 'one-route');
    await expect(oneRoute.locator('.sk-section-nav__link')).toHaveCount(1);

    const { nav: twoRoute } = await openStory(page, 'two-route');
    const links = twoRoute.locator('.sk-section-nav__link');
    await expect(links).toHaveCount(2);
    const hrefs = await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    expect(hrefs).toEqual(['#overview', '#members']);
    // No placeholder, disabled affordance, or non-link child stands in for the omitted third route.
    await expect(twoRoute.locator(':scope > *:not(a.sk-section-nav__link)')).toHaveCount(0);
  });

  test('six routes overflow locally without widening the document, and Tab reaches every link once in DOM order', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const { nav } = await openStory(page, 'many-routes');
    const geometry = await documentGeometry(page);
    expect(geometry.scrollWidth).toBe(geometry.clientWidth);
    const navGeometry = await nav.evaluate((node) => ({ clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }));
    expect(navGeometry.scrollWidth).toBeGreaterThan(navGeometry.clientWidth);

    const hrefs = await nav.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    expect(hrefs).toEqual(['#route-1', '#route-2', '#route-3', '#route-4', '#route-5', '#route-6']);

    if (browserName === 'webkit') {
      // See the WEBKIT TAB-ENTRY note above collectAnchorTabSequence/focusViaKeyboard: WebKit
      // excludes anchors from sequential-focus navigation by default, so a real Tab walk can never
      // reach them here. ENGINE-INDEPENDENT invariant instead: focus lands on the exact anchor the
      // consumer's own DOM order designates, whichever path put it there — proven per link, in
      // source order, with no Tab semantics involved. Kept isolated to this branch (not run before
      // the chromium/firefox Tab walk below): programmatically focusing the last link first was
      // measured to leave Chromium's AND Firefox's own sequential-navigation cursor anchored past
      // it, so a real Tab afterwards resumed from there instead of the top of the document — this
      // engine-independent proof and the real Tab walk must not share one test invocation.
      for (const href of hrefs) {
        const link = nav.locator(`a[href="${href}"]`);
        await link.evaluate((node) => (node as HTMLElement).focus());
        await expect(link).toBeFocused();
      }
      return;
    }

    await page.evaluate(() => {
      const sentinel = document.createElement('button');
      sentinel.type = 'button';
      sentinel.dataset.sectionNavTabSentinel = '';
      sentinel.textContent = 'Tab-order sentinel';
      document.body.append(sentinel);
    });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    const sequence = await collectAnchorTabSequence(page, hrefs.length + 3);
    expect(sequence).toEqual([...hrefs, 'sentinel']);
  });

  test('the last, off-screen-at-rest link scrolls fully into view on focus with an unclipped outline', async ({ page, browserName }) => {
    const { nav } = await openStory(page, 'narrow');
    const links = nav.locator('.sk-section-nav__link');
    const count = await links.count();
    expect(count).toBeGreaterThan(1);
    const lastLink = links.nth(count - 1);
    const lastHref = await lastLink.getAttribute('href');

    if (browserName === 'webkit') {
      // See the WEBKIT TAB-ENTRY note above: a real Tab walk never reaches an anchor on WebKit, so
      // reach the target directly instead. The SCROLL/GEOMETRY half of this claim is proven here —
      // .focus() triggers the same native "scroll the newly focused element into view" behaviour
      // regardless of how focus was requested, so withinScroller below is real evidence on this
      // engine. The FOCUS-RING half is deliberately NOT asserted here: this repo has not verified
      // that a bare .focus() reliably produces :focus-visible on WebKit (unlike Chromium/Firefox,
      // where collectAnchorTabSequence's real Tab walk supplies the keyboard-modality signal
      // :focus-visible's heuristic looks for), and guessing would be exactly the speculative,
      // unverified assertion this family's own review has already refused once for a different
      // engine. That half stays scoped to chromium/firefox below.
      await lastLink.evaluate((node) => (node as HTMLElement).focus());
      await expect(lastLink).toBeFocused();
      const withinScrollerWebkit = await lastLink.evaluate((node) => {
        const scroller = node.closest('.sk-section-nav')!;
        const linkRect = node.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        return linkRect.left >= scrollerRect.left - 1 && linkRect.right <= scrollerRect.right + 1;
      });
      expect(withinScrollerWebkit).toBe(true);
      return;
    }

    const reached = await focusViaKeyboard(page, lastHref!, count + 3);
    expect(reached, `Tab never reached the last link (${lastHref})`).toBe(true);
    await expect(lastLink).toBeFocused();
    const facts = await focusVisibility(lastLink);
    expect(facts.outlineStyle).not.toBe('none');
    expect(facts.outlineWidth).toBeGreaterThan(0);
    expect(facts.withinViewport).toBe(true);
    expect(facts.clippedByAncestor).toBe(false);
    const withinScroller = await lastLink.evaluate((node) => {
      const scroller = node.closest('.sk-section-nav')!;
      const linkRect = node.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      return linkRect.left >= scrollerRect.left - 1 && linkRect.right <= scrollerRect.right + 1;
    });
    expect(withinScroller).toBe(true);
  });

  test('no arrow-key, roving-tabindex, or activation script exists: ArrowRight/ArrowLeft/Home/End move no focus', async ({ page }) => {
    const { nav } = await openStory(page, 'many-routes');
    const links = nav.locator('.sk-section-nav__link');
    const first = links.first();
    // .focus() gives a deterministic starting point; the arrow-key claim under test is what
    // happens AFTER focus lands on a link, not how Tab-order reached it (proven separately).
    await first.focus();
    await expect(first).toBeFocused();
    const firstHref = await first.getAttribute('href');
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
      await page.keyboard.press(key);
      const activeHref = await page.evaluate(() => document.activeElement?.getAttribute('href') ?? null);
      expect(activeHref, `${key} must not move focus (no arrow-key script)`).toBe(firstHref);
    }
    // No JS reads or sets tabindex anywhere in the loaded document for this family.
    expect(await links.evaluateAll((nodes) => nodes.every((node) => node.getAttribute('tabindex') === null))).toBe(true);
  });

  test('native anchor activation is never intercepted: an unmodified click navigates via the real href', async ({ page }) => {
    const { nav } = await openStory(page, 'default');
    const link = nav.locator('a[href="#members"]');
    // Arm a listener BEFORE clicking, then read the flag it sets after the click resolves —
    // never await a Promise that only settles once the click we haven't issued yet fires.
    await page.evaluate(() => {
      const anchor = document.querySelector('a[href="#members"]') as HTMLAnchorElement;
      anchor.addEventListener(
        'click',
        (event) => {
          // Runs AFTER the family's own listeners (there are none); if any upstream
          // listener had called preventDefault, this would already read true.
          (window as unknown as { __sectionNavDefaultPrevented?: boolean }).__sectionNavDefaultPrevented =
            event.defaultPrevented;
        },
        { once: true },
      );
    });
    await link.click();
    const defaultPrevented = await page.evaluate(
      () => (window as unknown as { __sectionNavDefaultPrevented?: boolean }).__sectionNavDefaultPrevented,
    );
    expect(defaultPrevented).toBe(false);
    await expect(page).toHaveURL(/#members$/);
  });

  test('visited history remains presentation-neutral: :visited is not forced to differ from :link', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const { nav } = await openStory(page, 'default');
    const visitedCandidate = nav.locator('a[href="#members"]');
    const before = await linkCue(visitedCandidate);
    await visitedCandidate.click();
    await expect(page).toHaveURL(/#members$/);
    await page.mouse.move(0, 0);
    const after = await linkCue(visitedCandidate);
    expect(after).toEqual(before);
  });
});

test.describe('sk-section-nav state and resilience contract', () => {
  test('rest, hover, active, focus-visible, and current each carry a distinct non-colour cue', async ({ page, browserName }) => {
    const { nav } = await openStory(page, 'current-first');
    const ordinary = nav.locator('.sk-section-nav__link:not([aria-current])').first();
    const current = nav.locator('.sk-section-nav__link[aria-current]:not([aria-current="false"])');
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
    const currentCue = await linkCue(current);

    // ENGINE-INDEPENDENT half: hover/active/current are pointer- and attribute-driven, not
    // keyboard-driven, so they hold on every project including WebKit.
    expect(hoverCue.textDecorationLine).not.toBe(restCue.textDecorationLine);
    expect(activeCue.borderBlockEndStyle).not.toBe(restCue.borderBlockEndStyle);
    expect(currentCue.fontWeight).not.toBe(restCue.fontWeight);

    if (browserName === 'webkit') {
      // See the WEBKIT TAB-ENTRY note above: reach the target with .focus() rather than a real Tab
      // walk. That proves "focus lands on the anchor the consumer designated" (toBeFocused(),
      // engine-independent) but NOT the :focus-visible outline itself — this repo has verified
      // that a bare .focus() right after a mouse interaction on the SAME element does not reliably
      // register :focus-visible in Chromium/Firefox either (that is why focusViaKeyboard's real
      // Tab walk exists at all), and WebKit's own :focus-visible heuristic under a bare .focus()
      // has not been verified here one way or the other. Asserting it would be exactly the kind of
      // unverified, speculative claim this family's review has already refused once for a
      // different engine, so it stays unasserted on WebKit rather than guessed. The four-way
      // distinctness check below is scoped to rest/hover/active/current only — no focusCue.
      await ordinary.evaluate((node) => (node as HTMLElement).focus());
      await expect(ordinary).toBeFocused();
      expect(new Set([restCue, hoverCue, activeCue, currentCue].map(nonColourCue))).toHaveProperty('size', 4);
      return;
    }

    const ordinaryHref = await ordinary.getAttribute('href');
    const reached = await focusViaKeyboard(page, ordinaryHref!, 6);
    expect(reached, `Tab never reached the ordinary link (${ordinaryHref})`).toBe(true);
    await expect(ordinary).toBeFocused();
    const focusCue = await linkCue(ordinary);

    expect(focusCue.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(focusCue.outlineWidth)).toBeGreaterThan(0);
    expect(new Set([restCue, hoverCue, activeCue, focusCue, currentCue].map(nonColourCue))).toHaveProperty('size', 5);
  });

  test('primary links meet the minimum 44x44 target across default, subset, overflow, and narrow compositions', async ({ page }) => {
    for (const id of ['default', 'two-route', 'many-routes', 'narrow'] as const) {
      if (id === 'narrow') await page.setViewportSize({ width: 390, height: 720 });
      const { nav } = await openStory(page, id);
      for (const link of await nav.locator('.sk-section-nav__link').all()) {
        const box = await link.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('long and narrow routes stay fully available without clipping or widening the document', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    for (const id of ['long-labels', 'narrow', 'many-routes'] as const) {
      const { nav } = await openStory(page, id);
      const geometry = await documentGeometry(page);
      expect(geometry.scrollWidth).toBe(geometry.clientWidth);
      for (const link of await nav.locator('.sk-section-nav__link').all()) {
        const text = (await link.innerText()).trim().replace(/\s+/g, ' ');
        expect(text).not.toBe('');
        await expect(link).toHaveAccessibleName(text);
        const facts = await link.evaluate((node) => ({
          horizontalClip: node.scrollWidth > node.clientWidth + 1,
          verticalClip: node.scrollHeight > node.clientHeight + 1,
        }));
        expect(facts.horizontalClip).toBe(false);
        expect(facts.verticalClip).toBe(false);
      }
    }
  });

  test('RTL mirrors logically with no added document overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const { nav } = await openStory(page, 'rtl');
    expect(await nav.evaluate((node) => getComputedStyle(node).direction)).toBe('rtl');
    const geometry = await documentGeometry(page);
    expect(geometry.scrollWidth).toBe(geometry.clientWidth);
  });

  test('forced colours preserve the current-location border and the focus outline via border/outline recolor', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Playwright forced-colours emulation is Chromium-only');
    await page.emulateMedia({ forcedColors: 'active' });
    const { nav } = await openStory(page, 'forced-colors');
    const current = nav.locator('.sk-section-nav__link[aria-current]:not([aria-current="false"])');
    const currentCue = await linkCue(current);
    expect(currentCue.borderBlockEndStyle).not.toBe('none');
    expect(currentCue.borderBlockEndColor).not.toBe(currentCue.backgroundColor);

    const ordinary = nav.locator('.sk-section-nav__link:not([aria-current])').first();
    await ordinary.focus();
    const focusCue = await linkCue(ordinary);
    expect(focusCue.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(focusCue.outlineWidth)).toBeGreaterThan(0);
    expect(focusCue.outlineColor).not.toBe(focusCue.backgroundColor);
  });

  test('the component owns no motion under reduced-motion emulation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { nav } = await openStory(page, 'default');
    for (const link of await nav.locator('.sk-section-nav__link').all()) {
      expect(await link.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0s');
      expect(await link.evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
    }
  });

  test('LightMode uses a real sk-light ancestor and resolves genuinely different token-derived styling than the dark default', async ({ page }) => {
    const darkNav = (await openStory(page, 'default')).nav;
    const dark = await darkNav.evaluate((node) => ({
      color: getComputedStyle(node).color,
      linkBackground: getComputedStyle(node.querySelector('.sk-section-nav__link:not([aria-current])')!).backgroundColor,
    }));
    const lightNav = (await openStory(page, 'light-mode')).nav;
    expect(
      await lightNav.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " sk-light ")]').count(),
    ).toBeGreaterThan(0);
    const light = await lightNav.evaluate((node) => ({
      color: getComputedStyle(node).color,
      linkBackground: getComputedStyle(node.querySelector('.sk-section-nav__link:not([aria-current])')!).backgroundColor,
    }));
    expect(light.color).not.toBe(dark.color);
    expect(light.linkBackground).toBe('rgba(0, 0, 0, 0)');
    expect(dark.linkBackground).toBe('rgba(0, 0, 0, 0)');
  });

  /**
   * CDP-APPROXIMATED 200%/400% REFLOW — NOT genuine browser-chrome zoom.
   *
   * `native-context-navigation-styles-01M1Y3MG`'s own task file is explicit that "viewport
   * resizing or CSS `zoom` does not substitute for browser zoom" (T006), and that mission's
   * reviewer filed the absence of real 200%/400% zoom evidence as [HIGH] (review-cycle-1.md:15)
   * — this sandbox has no host browser UI to drive real ctrl/cmd-+ zoom through, so that exact
   * evidence remains permanently out of reach here too (tracked at programme level, not a claim
   * this WP makes; see the mission's implementation-evidence.md for the full disposition).
   *
   * What CDP's `Emulation.setDeviceMetricsOverride` DOES approximate: halving (then quartering)
   * the CSS viewport while doubling (then quadrupling) `deviceScaleFactor` reproduces the REFLOW
   * a page sees under real 200%/400% browser zoom (less available inline space, same physical
   * pixels) — it does not reproduce the browser chrome's own zoom mechanism, UI scaling, or
   * input/hit-testing behavior. Treat this test's result as reflow-under-constraint evidence only,
   * never as "zoom was tested."
   *
   * SCOPE NOTE, measured rather than assumed: this suite's own `storyFrame()` helper wraps every
   * fixture in a FIXED-width demo box (240px narrow / 320px default) simulating "a column this
   * wide", not a fluid page. At the most aggressive scale factor (4, ~98px effective viewport) the
   * fixed 240px demo frame legitimately exceeds that width and the outer HTML document scrolls —
   * that is the fixed-size DEMO FIXTURE's own choice, not `.sk-section-nav` forcing document
   * overflow (a real consumer's fluid container would shrink with the viewport; this demo frame
   * deliberately does not, the same way every other story in this file is a fixed-width box).
   * So this test asserts what is actually attributable to the family under test: the strip never
   * exceeds the width its own immediate container gives it, and no content is lost — not a
   * document-level scrollWidth equality the fixed demo frame cannot honestly satisfy at 400%.
   */
  test('CDP-approximated 200%/400% reflow: the strip stays within its container and no content is lost', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Emulation.setDeviceMetricsOverride is a Chromium CDP method');
    const session = await page.context().newCDPSession(page);
    try {
      for (const scaleFactor of [2, 4] as const) {
        await session.send('Emulation.setDeviceMetricsOverride', {
          width: Math.round(390 / scaleFactor),
          height: Math.round(720 / scaleFactor),
          deviceScaleFactor: scaleFactor,
          mobile: false,
        });
        const { nav } = await openStory(page, 'many-routes');
        const containment = await nav.evaluate((node) => {
          const frame = node.closest('[data-section-nav-story-frame]');
          if (frame === null) throw new Error('section-nav story frame is missing');
          const navRect = node.getBoundingClientRect();
          const frameRect = frame.getBoundingClientRect();
          return {
            navWithinFrame: navRect.right <= frameRect.right + 1 && navRect.left >= frameRect.left - 1,
            navOwnsItsOverflow: node.scrollWidth >= node.clientWidth,
          };
        });
        expect(containment.navWithinFrame, `scaleFactor=${scaleFactor}: strip exceeded its own container`).toBe(true);
        expect(containment.navOwnsItsOverflow, `scaleFactor=${scaleFactor}`).toBe(true);
        const links = nav.locator('.sk-section-nav__link');
        expect(await links.count(), `scaleFactor=${scaleFactor}`).toBe(6);
        for (const link of await links.all()) {
          const text = (await link.innerText()).trim();
          expect(text, `scaleFactor=${scaleFactor}`).not.toBe('');
        }
      }
    } finally {
      await session.send('Emulation.clearDeviceMetricsOverride');
      await session.detach();
    }
  });
});
