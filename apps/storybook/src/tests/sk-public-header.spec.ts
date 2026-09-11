import { expect, test, type Locator, type Page } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const PUBLIC_HEADER_CSS = 'packages/styles/src/public-header/sk-public-header.css';
const PUBLIC_HEADER_BARREL = 'packages/styles/src/public-header/index.ts';
const PUBLIC_HEADER_STORIES =
  'packages/styles/src/public-header/sk-public-header-html.stories.ts';
const STYLES_PACKAGE = 'packages/styles/package.json';
const STYLES_ROOT = 'packages/styles/src/index.ts';
const COMPONENT_USAGE_DOC = 'docs/design-system/using-components.md';
const STORY_RATCHET = 'expected-stories.json';
const TOKEN_LITERAL_CHECKER = 'scripts/check-component-token-literals.mjs';
const STORY_PREFIX = 'navigation-skpublicheader-html';

const PUBLIC_CLASSES = [
  'sk-public-header',
  'sk-public-header__action',
  'sk-public-header__actions',
  'sk-public-header__brand',
  'sk-public-header__brand-context',
  'sk-public-header__inner',
] as const;

const storyIds = [
  'default',
  'brand-only',
  'one-action',
  'many-actions',
  'long-labels',
  'current-action',
  'mixed-controls',
  'theme-toggle-composition',
  'narrow',
  'short-viewport',
  'rtl',
  'forced-colors',
  'light-mode',
] as const;

const fixtureStoryIds = [
  'brand-only',
  'one-action',
  'default',
  'many-actions',
  'long-labels',
  'current-action',
  'mixed-controls',
  'theme-toggle-composition',
] as const;

type StoryId = (typeof storyIds)[number];

type LoadedStory = {
  header: Locator;
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
  const header = page.locator('#storybook-root .sk-public-header').first();
  await header.waitFor({ state: 'visible', timeout: 20000 });
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  return { header, consoleErrors, pageErrors };
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function classSelectorInventory(source: string): string[] {
  const classes = new Set<string>();
  const root = postcss.parse(source, { from: PUBLIC_HEADER_CSS });
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

function readGeneratedFixtures(): Array<{ name: string; html: string }> {
  const source = readFileSync(PUBLIC_HEADER_BARREL, 'utf8');
  const fixtures: Array<{ name: string; html: string }> = [];
  for (const match of source.matchAll(/^export const (\w+) = (".*");$/gm)) {
    fixtures.push({ name: match[1], html: JSON.parse(match[2]) as string });
  }
  if (fixtures.length === 0)
    throw new Error(`no generated fixtures parsed from ${PUBLIC_HEADER_BARREL}`);
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

async function focusVisibility(control: Locator) {
  return control.evaluate((node) => {
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
        (clipsX
          && (outlineRect.left < ancestorRect.left
            || outlineRect.right > ancestorRect.right))
        || (clipsY
          && (outlineRect.top < ancestorRect.top
            || outlineRect.bottom > ancestorRect.bottom))
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

async function actionCue(action: Locator) {
  return action.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      borderBlockEndStyle: style.borderBlockEndStyle,
      borderBlockEndWidth: style.borderBlockEndWidth,
      fontWeight: style.fontWeight,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      textDecorationLine: style.textDecorationLine,
      textDecorationStyle: style.textDecorationStyle,
      textDecorationThickness: style.textDecorationThickness,
    };
  });
}

function nonColourCue(cue: Awaited<ReturnType<typeof actionCue>>): string {
  return JSON.stringify(cue);
}

/**
 * Read a resolved border colour.
 *
 * Deliberately NOT folded into `actionCue`: that shape is stringified by `nonColourCue` and fed
 * to the "five distinct non-colour cues" assertion, so a colour added there would let that test
 * pass on exactly the signal it exists to exclude.
 */
async function borderBlockEndColour(target: Locator): Promise<string> {
  return target.evaluate((node) => getComputedStyle(node).borderBlockEndColor);
}

test.describe('sk-public-header source, markup, and distribution contract', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'browser-independent contracts run once',
  );

  test('the public selector inventory is exact, token-only, logical, and reach-through-free', () => {
    const source = readFileSync(PUBLIC_HEADER_CSS, 'utf8');
    const code = stripComments(source);
    expect(classSelectorInventory(source)).toEqual([...PUBLIC_CLASSES].sort());
    expect(code).toContain(
      '.sk-public-header__action[aria-current]:not([aria-current="false"])',
    );
    expect(code).not.toMatch(/\.sk-button|sk-theme-toggle|::part\(|:host/);
    expect(code).not.toMatch(/(?:\.sk-light|data-theme|:root|:host-context)/);
    expect(code).not.toMatch(/\[dir=["']?rtl/);
    expect(code).not.toMatch(
      /(?:margin|padding|border)-(?:left|right)|(?:^|[;{])\s*(?:left|right)\s*:/m,
    );
    expect(code).not.toMatch(/(?:^|[;{])\s*order\s*:|(?:row|column)-reverse/);
    expect(code).not.toMatch(/position\s*:\s*(?:sticky|fixed)/);
    // Case-insensitive: CSS at-rules and property names are, and `@-webkit-keyframes` does not
    // match a bare `@keyframes`.
    expect(code).not.toMatch(
      /(?:^|[;{-])\s*(?:transition|animation)[-\w]*\s*:|@[-\w]*keyframes/im,
    );
    // #286: the library owns no user-visible string. `classSelectorInventory` collects class
    // names only, so a `content:` declaration on a pseudo-element is invisible to every other
    // assertion in this block — `.sk-public-header__brand::before { content: "Spec Kitty" }`
    // would otherwise pass the whole file. Banning the property closes the class by construction
    // rather than relying on nobody trying it.
    expect(code).not.toMatch(/(?:^|[;{])\s*content\s*:/im);
    expect(code).not.toMatch(/44px/i);
    expect(code).not.toMatch(/(?:display\s*:\s*none|visibility\s*:\s*hidden|clip-path\s*:)/);

    const root = postcss.parse(source, { from: PUBLIC_HEADER_CSS });
    const systemColours =
      /\b(?:Canvas|CanvasText|Highlight|HighlightText|ButtonText|LinkText|GrayText)\b/;
    root.walkDecls((declaration) => {
      if (!systemColours.test(declaration.value)) return;
      let parent = declaration.parent;
      let insideForcedColours = false;
      while (parent !== undefined) {
        if (
          parent.type === 'atrule'
          && parent.name === 'media'
          && parent.params === '(forced-colors: active)'
        ) {
          insideForcedColours = true;
          break;
        }
        parent = parent.parent;
      }
      expect(
        insideForcedColours,
        `${declaration.prop}: ${declaration.value} must stay inside forced colours`,
      ).toBe(true);
    });

    const actionDeclarations = new Map<string, string>();
    root.walkRules('.sk-public-header__action', (rule) => {
      rule.walkDecls((declaration) =>
        actionDeclarations.set(declaration.prop, declaration.value),
      );
    });
    expect(actionDeclarations.get('display')).toBe('inline-flex');
    expect(actionDeclarations.get('min-block-size')).toMatch(
      /^var\(--sk-space-[a-z0-9-]+\)$/,
    );
    expect(actionDeclarations.get('min-inline-size')).toMatch(
      /^var\(--sk-space-[a-z0-9-]+\)$/,
    );

    const audit = execFileSync(
      process.execPath,
      [TOKEN_LITERAL_CHECKER, PUBLIC_HEADER_CSS],
      { encoding: 'utf8' },
    );
    expect(audit).toContain(
      '1 explicit component stylesheet(s) use tokens for all governed values',
    );
  });

  test('eight canonical native fixtures generate the complete exemplar barrel', () => {
    const fixtures = readGeneratedFixtures();
    expect(fixtures.map(({ name }) => name).sort()).toEqual([
      'SkPublicHeaderBrandOnlyHTML',
      'SkPublicHeaderCurrentActionHTML',
      'SkPublicHeaderLongLabelsHTML',
      'SkPublicHeaderManyActionsHTML',
      'SkPublicHeaderMixedControlsHTML',
      'SkPublicHeaderOneActionHTML',
      'SkPublicHeaderThemeSlotHTML',
      'SkPublicHeaderTwoActionsHTML',
    ]);
    for (const { name, html } of fixtures) {
      expect(html, `${name} uses a native header`).toMatch(
        /<header\b[^>]*class="sk-public-header"/,
      );
      expect(html, `${name} uses a native brand anchor`).toMatch(
        /<a\b[^>]*class="[^"]*\bsk-public-header__brand\b[^"]*"[^>]*href=/,
      );
      expect(html, `${name} has no custom header element`).not.toMatch(
        /<sk-public-header\b/,
      );
      expect(html, `${name} adds no manual role`).not.toMatch(/\brole=/);
      expect(html, `${name} adds no manual tab stop`).not.toMatch(/\btabindex=/);
      expect(html, `${name} carries no review scaffolding`).not.toMatch(/\bdata-od-id=/);

      const actionChildren =
        html.match(
          /<nav\b[^>]*class="sk-public-header__actions"[^>]*>[\s\S]*?<\/nav>/,
        )?.[0].match(/<(?:a|button)\b[^>]*>/g) ?? [];
      for (const child of actionChildren) {
        expect(child, `${name} opts every action into the target-size slot`).toMatch(
          /class="[^"]*\bsk-public-header__action\b/,
        );
      }
    }
    const brandOnly = fixtures.find(
      ({ name }) => name === 'SkPublicHeaderBrandOnlyHTML',
    );
    expect(brandOnly?.html).not.toMatch(/<nav\b/);

    const combined = fixtures.map(({ html }) => html).join('\n');
    expect(combined).not.toMatch(
      /class="[^"]*\b(?:topnav|topnav-inner|logo|nav-actions|brand-context|theme-picker|theme-toggle|theme-options)\b/,
    );
    expect(combined).not.toMatch(/data-theme-choice|<details\b|<summary\b|aria-pressed/);
  });

  test('the family remains absent from elements, wrappers, manifests, and behaviour registries', () => {
    expect(existsSync('packages/elements/src/public-header')).toBe(false);
    const trackedSourceFiles = execFileSync(
      'git',
      ['ls-files', 'packages/elements/src', 'packages/react/src'],
      { encoding: 'utf8' },
    )
      .trim()
      .split('\n')
      .filter(Boolean);
    expect(
      trackedSourceFiles.some((path) => /public-header|skpublicheader/i.test(path)),
    ).toBe(false);
    expectTrackedFilesNotToContain('sk-public-header|SkPublicHeader', [
      'packages/elements/custom-elements.json',
      'packages/elements/vue.d.ts',
      'expected-parts.json',
      'expected-docs.json',
      'behaviours.json',
      'mutations.json',
    ]);
  });

  test('the generator rationale, exports, docs, and acceptance stories are exact', () => {
    const barrel = readFileSync(PUBLIC_HEADER_BARREL, 'utf8');
    expect(barrel).toContain('See #353.');
    expect(readFileSync(STYLES_ROOT, 'utf8')).toMatch(
      /export \* from ['"]\.\/public-header\/index['"];/,
    );
    const packageJson = JSON.parse(readFileSync(STYLES_PACKAGE, 'utf8')) as {
      exports: Record<string, unknown>;
    };
    expect(packageJson.exports['./public-header/*']).toBe(
      './dist/public-header/*',
    );

    const ratchet = JSON.parse(readFileSync(STORY_RATCHET, 'utf8')) as {
      byElement: Record<string, string[]>;
    };
    expect(ratchet.byElement['sk-public-header']).toEqual(
      storyIds.map((id) => `${STORY_PREFIX}--${id}`),
    );

    const stories = readFileSync(PUBLIC_HEADER_STORIES, 'utf8');
    expect(stories).toMatch(/blocked on #323/i);
    expect(stories).toMatch(/merges into `train\/elements-first`/);
    expect(stories).toMatch(/owns no theme state/i);

    const docs = readFileSync(COMPONENT_USAGE_DOC, 'utf8');
    const start = docs.indexOf('## Public header');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = docs.indexOf('\n## ', start + 4);
    const section = docs.slice(start, end === -1 ? undefined : end);
    for (const className of PUBLIC_CLASSES) expect(section).toContain(className);
    expect(section).toMatch(/non-empty[^\n]*aria-label|aria-label[^\n]*non-empty/i);
    expect(section).toMatch(/exactly one[^\n]*sk-public-header/i);
    expect(section).toMatch(/every action[^\n]*sk-public-header__action/i);
    expect(section).toMatch(/aria-current/);
    expect(section).toMatch(/colour alone|color alone/i);
    expect(section).toMatch(/#323/);
    expect(section).toMatch(/ADR-10/);
    expect(section).toMatch(/form-field/);
    for (const neighbour of [
      'sk-app-shell',
      'sk-page-header',
      'sk-nav-pill',
      'sk-skip-link',
    ])
      expect(section).toContain(neighbour);

    const dependencyClaim = section.match(
      /The stylesheet depends on these existing semantic tokens:([\s\S]*?)\n\n/,
    );
    expect(dependencyClaim).not.toBeNull();
    const documentedTokens = new Set(
      dependencyClaim![1]!.match(/--sk-[a-z0-9-]+/g) ?? [],
    );
    const stylesheetTokens = new Set(
      readFileSync(PUBLIC_HEADER_CSS, 'utf8')
        .match(/var\((--sk-[a-z0-9-]+)/g)
        ?.map((value) => value.slice(4)) ?? [],
    );
    expect([...documentedTokens].sort()).toEqual([...stylesheetTokens].sort());
  });
});

test.describe('sk-public-header live native semantics', () => {
  for (const id of storyIds) {
    test(`${id} loads one native light-DOM header without errors`, async ({ page }) => {
      if (id === 'narrow') await page.setViewportSize({ width: 390, height: 720 });
      if (id === 'short-viewport')
        await page.setViewportSize({ width: 720, height: 320 });
      const { header, consoleErrors, pageErrors } = await openStory(page, id);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(
        await header.evaluate(
          (node) => node instanceof HTMLElement && node.tagName === 'HEADER',
        ),
      ).toBe(true);
      expect(await header.evaluate((node) => node.getRootNode() === document)).toBe(
        true,
      );
      await expect(header).toHaveRole('banner');
      // Counted on an UNSCOPED locator. `header` is `…locator(…).first()`, which resolves to at
      // most one node by construction and had already been awaited visible — so counting it
      // could never fail, including on a page rendering three headers. That left NFR-006's
      // "exactly one banner landmark" resting on a chromium-only test.
      await expect(page.locator('header.sk-public-header')).toHaveCount(1);
    });
  }

  test('Chromium accessibility trees expose one banner and only named, non-empty action navigation', async ({
    page,
    browserName,
  }) => {
    expect(test.info().config.projects.map((project) => project.name), 'the chromium skip below is keyed on this project name').toContain('chromium');
    test.skip(
      browserName !== 'chromium',
      'Chromium CDP supplies the inspectable platform accessibility tree',
    );
    const session = await page.context().newCDPSession(page);
    await session.send('DOM.enable');
    await session.send('Accessibility.enable');
    for (const id of storyIds) {
      const { header } = await openStory(page, id);
      await expect(page.locator('header.sk-public-header')).toHaveCount(1);
      const { root } = await session.send('DOM.getDocument');
      const { nodeId: headerNodeId } = await session.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: 'header.sk-public-header',
      });
      const { node: headerNode } = await session.send('DOM.describeNode', {
        nodeId: headerNodeId,
      });
      const { nodes: headerAxNodes } = await session.send(
        'Accessibility.getPartialAXTree',
        { nodeId: headerNodeId, fetchRelatives: true },
      );
      const banner = headerAxNodes.find(
        (node) => node.backendDOMNodeId === headerNode.backendNodeId,
      );
      expect(banner?.role?.value, `${id} exposes a banner`).toBe('banner');

      const expectedNavigationCount = id === 'brand-only' ? 0 : 1;
      await expect(header.locator('nav')).toHaveCount(expectedNavigationCount);
      if (expectedNavigationCount === 0) continue;
      const { nodeId: navigationNodeId } = await session.send(
        'DOM.querySelector',
        { nodeId: root.nodeId, selector: 'nav.sk-public-header__actions' },
      );
      const { node: navigationNode } = await session.send('DOM.describeNode', {
        nodeId: navigationNodeId,
      });
      const { nodes: navigationAxNodes } = await session.send(
        'Accessibility.getPartialAXTree',
        { nodeId: navigationNodeId, fetchRelatives: true },
      );
      const navigation = navigationAxNodes.find(
        (node) => node.backendDOMNodeId === navigationNode.backendNodeId,
      );
      expect(navigation?.role?.value, `${id} exposes navigation`).toBe(
        'navigation',
      );
      expect(String(navigation?.name?.value ?? '')).toMatch(/\S/);
    }
  });

  test('source order is the sequential keyboard focus order for every fixture shape', async ({
    page,
  }) => {
    for (const id of fixtureStoryIds) {
      const { header } = await openStory(page, id);
      const expected = await header
        .locator('a[href], button:not([disabled])')
        .evaluateAll((nodes) =>
          nodes.map((node, index) => {
            const value = `${index}`;
            (node as HTMLElement).dataset.publicHeaderFocusOrder = value;
            return value;
          }),
        );
      await page.evaluate(() => {
        const sentinel = document.createElement('button');
        sentinel.type = 'button';
        sentinel.dataset.publicHeaderFocusSentinel = '';
        sentinel.textContent = 'Focus sentinel';
        document.body.append(sentinel);
        (document.activeElement as HTMLElement | null)?.blur();
      });
      const focused: string[] = [];
      for (let index = 0; index <= expected.length; index += 1) {
        await page.keyboard.press('Tab');
        focused.push(
          await page.evaluate(() => {
            const active = document.activeElement as HTMLElement | null;
            if (active?.hasAttribute('data-public-header-focus-sentinel'))
              return 'sentinel';
            return active?.dataset.publicHeaderFocusOrder ?? active?.tagName ?? '';
          }),
        );
      }
      expect(focused).toEqual([...expected, 'sentinel']);
    }
  });
});

test.describe('sk-public-header geometry, state, and resilience contract', () => {
  test('every action fixture has a non-vacuous 44px target floor at narrow and wide widths', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 390, height: 900 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      for (const id of fixtureStoryIds.filter((story) => story !== 'brand-only')) {
        const { header } = await openStory(page, id);
        const actions = header.locator('.sk-public-header__action');
        const directChildren = header.locator('.sk-public-header__actions > *');
        const count = await directChildren.count();
        expect(count, `${id} has action-region children`).toBeGreaterThan(0);
        await expect(actions, `${id} classes every direct action child`).toHaveCount(
          count,
        );
        for (const action of await actions.all()) {
          const box = await action.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('all stories avoid root overflow at narrow, wide, 200%-zoom, and short viewport approximations', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 390, height: 720 },
      { width: 1440, height: 900 },
      { width: 720, height: 450 },
      { width: 390, height: 320 },
    ]) {
      await page.setViewportSize(viewport);
      for (const id of storyIds) {
        await openStory(page, id);
        const geometry = await documentGeometry(page);
        expect(
          geometry.scrollWidth,
          `${id} does not overflow at ${viewport.width}x${viewport.height}`,
        ).toBeLessThanOrEqual(geometry.clientWidth);
      }
    }
  });

  test('long labels remain visible and wrap without clipping', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const { header } = await openStory(page, 'long-labels');
    const wrapping = header.locator('.sk-public-header__brand, .sk-public-header__action');
    // Same non-vacuity guard the target-size test carries: an empty selector set makes every
    // assertion in the loop below pass without measuring anything, so a future fixture edit
    // could silently reduce this test to a no-op.
    expect(
      await wrapping.count(),
      'long-labels has wrapping candidates to measure',
    ).toBeGreaterThan(0);
    for (const node of await wrapping.all()) {
      const text = (await node.innerText()).trim();
      const facts = await node.evaluate((element) => ({
        horizontalClip: element.scrollWidth > element.clientWidth + 1,
        overflowWrap: getComputedStyle(element).overflowWrap,
        verticalClip: element.scrollHeight > element.clientHeight + 1,
        visible: element.getClientRects().length > 0,
      }));
      expect(text).not.toBe('');
      expect(facts.visible).toBe(true);
      expect(facts.overflowWrap).toBe('anywhere');
      expect(facts.horizontalClip).toBe(false);
      expect(facts.verticalClip).toBe(false);
    }
  });

  test('keyboard focus outlines remain visible and unclipped at narrow and wide widths', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 390, height: 900 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      for (const id of fixtureStoryIds) {
        const { header } = await openStory(page, id);
        const controls = header.locator('a[href], button:not([disabled])');
        await page.evaluate(() =>
          (document.activeElement as HTMLElement | null)?.blur(),
        );
        for (let index = 0; index < (await controls.count()); index += 1) {
          await page.keyboard.press('Tab');
          const focused = page.locator(':focus');
          const facts = await focusVisibility(focused);
          expect(facts.outlineStyle).not.toBe('none');
          expect(facts.outlineWidth).toBeGreaterThan(0);
          expect(facts.withinViewport).toBe(true);
          expect(facts.clippedByAncestor).toBe(false);
        }
      }
    }
  });

  test('rest, hover, active, focus-visible, and current use five distinct non-colour cues', async ({
    page,
  }) => {
    // Two story loads plus a pointer and a keyboard sequence in one test; `openStory` alone may
    // wait up to 20s for the story to paint on a loaded runner. Declared rather than left to the
    // default 30s. Scoped to this test — `test.slow()` at describe level would silently retimebox
    // every sibling test too.
    test.slow();
    const { header } = await openStory(page, 'current-action');
    // Addressed by href, NOT by `:not([aria-current])`. The tail of this test sets
    // `aria-current="false"` on this very element to prove the CSS treats that as not-current;
    // a locator keyed on the absence of that attribute stops matching the moment it is set, and
    // the element can never re-enter its own match set. That hung `actionCue` until the test
    // timeout on all three engines (CI run 34526412236) — a live Locator re-resolves on every
    // use, so it is not a snapshot of the element it first found.
    const ordinary = header.locator(
      '.sk-public-header__action[href="/accounts/profile/"]',
    );
    const current = header.locator(
      '.sk-public-header__action[aria-current]:not([aria-current="false"])',
    );
    const restCue = await actionCue(ordinary);
    await ordinary.hover();
    const hoverCue = await actionCue(ordinary);
    const box = await ordinary.boundingBox();
    expect(box).not.toBeNull();
    await ordinary.evaluate((node) =>
      node.addEventListener('click', (event) => event.preventDefault(), {
        once: true,
      }),
    );
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    expect(await ordinary.evaluate((node) => node.matches(':active'))).toBe(true);
    const activeCue = await actionCue(ordinary);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await openStory(page, 'current-action');
    await page.evaluate(() => {
      const start = document.createElement('button');
      start.type = 'button';
      start.textContent = 'Focus start';
      document.body.prepend(start);
      start.focus();
    });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(ordinary).toBeFocused();
    const focusCue = await actionCue(ordinary);
    const currentCue = await actionCue(current);

    expect(hoverCue.textDecorationLine).not.toBe(restCue.textDecorationLine);
    expect(activeCue.textDecorationStyle).not.toBe(hoverCue.textDecorationStyle);
    expect(focusCue.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(focusCue.outlineWidth)).toBeGreaterThan(0);
    expect(currentCue.fontWeight).not.toBe(restCue.fontWeight);
    expect(currentCue.borderBlockEndWidth).not.toBe(
      restCue.borderBlockEndWidth,
    );
    expect(
      new Set(
        [restCue, hoverCue, activeCue, focusCue, currentCue].map(nonColourCue),
      ),
    ).toHaveProperty('size', 5);

    await ordinary.evaluate((node) => node.setAttribute('aria-current', 'false'));
    expect(await actionCue(ordinary)).toEqual(focusCue);
    await ordinary.blur();
    await ordinary.evaluate((node) => node.removeAttribute('aria-current'));
    const noAttributeCue = await actionCue(ordinary);
    await ordinary.evaluate((node) => node.setAttribute('aria-current', 'false'));
    expect(await actionCue(ordinary)).toEqual(noAttributeCue);
  });

  test('the action slot normalises a composed anchor and button to one row', async ({
    page,
  }) => {
    // The mixed-controls fixture co-classes `sk-public-header__action` with `sk-button--ghost`
    // on an <a> and `sk-button--secondary` on a <button>. Both control classes declare colour,
    // background, border colour, font and text-decoration at the same (0,1,0) specificity this
    // family used to use, so the winner was bundle order — and it differed BY ELEMENT TYPE,
    // because only the anchor matched the `:link` rule. Two adjacent actions therefore rendered
    // at different foregrounds in the fixture whose purpose is proving they compose as one row.
    // These assertions pin the normalisation; they fail if the specificity scoping is removed.
    const { header } = await openStory(page, 'mixed-controls');
    const readSlot = (target: Locator) =>
      target.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          textDecorationLine: style.textDecorationLine,
        };
      });
    const anchor = await readSlot(header.locator('a.sk-public-header__action'));
    const button = await readSlot(
      header.locator('button.sk-public-header__action'),
    );
    expect(anchor).toEqual(button);

    // …and the shared value is the header's own inherited foreground, not either control's.
    const inherited = await header.evaluate(
      (node) => getComputedStyle(node).color,
    );
    expect(anchor.color).toBe(inherited);

    // HOVER TOO. `.sk-button--ghost:hover { color }` is itself two classes, so before the state
    // selectors were scoped this comparison held at rest and broke on pointer-over — and broke
    // asymmetrically, since only the <a> matches the `:link` rule that rescued it.
    // Hover BOTH and compare hovered-to-hovered. An earlier revision compared the hovered button
    // against the resting anchor and failed on `textDecorationLine`, which was the test being
    // wrong rather than the sheet: the family's own `:hover` rule adds the underline deliberately,
    // to both element types. What must not diverge is the pair under the same state.
    await header.locator('button.sk-public-header__action').hover();
    const hoveredButton = await readSlot(
      header.locator('button.sk-public-header__action'),
    );
    await header.locator('a.sk-public-header__action').hover();
    const hoveredAnchor = await readSlot(header.locator('a.sk-public-header__action'));
    expect(
      hoveredButton,
      'a hovered composed button does not diverge from a hovered anchor sibling',
    ).toEqual(hoveredAnchor);
  });

  test('the action slot normalises BARE controls, where UA defaults differ', async ({ page }) => {
    // `mixed-controls` co-classes both actions with `.sk-button`, which itself declares
    // font-family, font-weight, text-decoration and a transparent background — so comparing its
    // anchor to its button is, in mutation terms, a `color`-only test: delete `background`,
    // `font-family`, `font-weight` or `text-decoration` from the slot and it still passes.
    // `theme-toggle-composition` carries NO control classes, so the UA's own <a>-vs-<button>
    // defaults differ on all four at once and each becomes independently falsifiable.
    const { header } = await openStory(page, 'theme-toggle-composition');
    const read = (target: Locator) =>
      target.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          textDecorationLine: style.textDecorationLine,
        };
      });
    const bareAnchor = await read(header.locator('a.sk-public-header__action').first());
    const bareButton = await read(header.locator('button.sk-public-header__action'));
    expect(bareButton, 'a bare <button> matches a bare <a> in the slot').toEqual(bareAnchor);

    // Absolute, not just mutual: a transparent background and the family font are what the slot
    // owes, and a mutual comparison alone cannot tell "both correct" from "both wrong".
    const headerStyle = await header.evaluate((node) => {
      const style = getComputedStyle(node);
      return { color: style.color, fontFamily: style.fontFamily };
    });
    expect(bareButton.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(bareButton.fontFamily).toBe(headerStyle.fontFamily);
    expect(bareButton.color).toBe(headerStyle.color);
    expect(bareButton.textDecorationLine).toBe('none');
  });

  test('forced colours preserve the header boundary, current cue, and focus outline', async ({
    page,
    browserName,
  }) => {
    expect(test.info().config.projects.map((project) => project.name), 'the chromium skip below is keyed on this project name').toContain('chromium');
    test.skip(
      browserName !== 'chromium',
      'Playwright forced-colours emulation is Chromium-only',
    );
    // Baseline WITHOUT emulation first. Every "is it still non-none / still non-zero" assertion
    // below is satisfied by declarations outside the forced-colors block, so on their own the
    // whole `@media (forced-colors: active)` block could be deleted with this test still green.
    // What the block uniquely determines is the resolved COLOURS, so those are what get compared.
    const { header: plainHeader } = await openStory(page, 'forced-colors');
    const plainOrdinary = plainHeader.locator(
      '.sk-public-header__action:not([aria-current])',
    );
    const plainBoundaryColour = await plainHeader.evaluate(
      (node) => getComputedStyle(node).borderBlockEndColor,
    );
    const plainCurrentColour = await borderBlockEndColour(
      plainHeader.locator(
        '.sk-public-header__action[aria-current]:not([aria-current="false"])',
      ),
    );
    const plainOrdinaryColour = await borderBlockEndColour(plainOrdinary);

    await page.emulateMedia({ forcedColors: 'active' });
    const { header } = await openStory(page, 'forced-colors');
    const boundary = await header.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderBlockEndColor,
        borderStyle: style.borderBlockEndStyle,
      };
    });
    expect(boundary.borderStyle).not.toBe('none');
    expect(boundary.borderColor).not.toBe(boundary.backgroundColor);

    const current = header.locator(
      '.sk-public-header__action[aria-current]:not([aria-current="false"])',
    );
    const currentCue = await actionCue(current);
    expect(currentCue.borderBlockEndStyle).not.toBe('none');
    expect(Number.parseFloat(currentCue.borderBlockEndWidth)).toBeGreaterThan(0);

    // Compare against RESOLVED SYSTEM COLOURS, using the probe pattern
    // `apps/storybook/src/tests/sk-action-row.spec.ts:231-249` already established.
    //
    // An earlier revision of this test asserted only that things "recoloured" under emulation
    // and called that the falsifying half. It was not: `sk-card.css:202-211` records the #218
    // ruling that the forced-colors algorithm remaps border colours with ZERO author CSS, so a
    // mere "it changed" assertion passes whether or not this sheet's block exists. These read the
    // specific system colour each declaration names, so deleting a declaration changes the value.
    const system = await header.evaluate(() => {
      const resolve = (value: string) => {
        const probe = document.createElement('span');
        probe.style.color = value;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      return {
        buttonText: resolve('ButtonText'),
        canvasText: resolve('CanvasText'),
        highlight: resolve('Highlight'),
      };
    });

    // #218's question was ASKED here rather than assumed, and CI answered it: `ButtonText` and
    // `CanvasText` both resolve to rgb(0,0,0) under Chromium's emulation, so the two boundary
    // declarations this block used to carry restated what the UA computes anyway. Per the ruling
    // recorded in `sk-card.css`, they were DELETED rather than kept — a block that reads as the
    // mechanism while doing none of the work is worse than no block. What remains is `Highlight`,
    // which is a different colour and therefore does real work; this precondition proves that
    // rather than presuming it, and turns red if a future palette collapses the two.
    expect(
      system.highlight,
      'Highlight must differ from CanvasText, or the current-cue declaration is a no-op too',
    ).not.toBe(system.canvasText);

    const forcedCurrentColour = await borderBlockEndColour(current);
    expect(forcedCurrentColour, 'current cue uses Highlight').toBe(system.highlight);
    // The band itself needs no declaration: the UA remaps a border colour with zero author CSS.
    // Asserted so the deletion is evidenced, not merely assumed.
    expect(boundary.borderStyle, 'band survives on the UA remap alone').not.toBe('none');
    expect(plainCurrentColour).not.toBe(plainOrdinaryColour);

    await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.blur(),
    );
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(current).toBeFocused();
    const focusCue = await actionCue(current);
    expect(focusCue.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(focusCue.outlineWidth)).toBeGreaterThan(0);
  });

  test('the family owns no motion under reduced-motion emulation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { header } = await openStory(page, 'default');
    for (const box of await header
      .locator(
        ':scope, .sk-public-header__inner, .sk-public-header__brand',
      )
      .all()) {
      expect(
        await box.evaluate((node) => getComputedStyle(node).transitionDuration),
      ).toBe('0s');
      expect(
        await box.evaluate((node) => getComputedStyle(node).animationName),
      ).toBe('none');
    }
  });

  test('desktop layout keeps the brand at inline start and actions at inline end', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { header } = await openStory(page, 'default');
    const facts = await header.evaluate((node) => {
      const inner = node.querySelector('.sk-public-header__inner')!;
      const brand = node.querySelector('.sk-public-header__brand')!;
      const actions = node.querySelector('.sk-public-header__actions')!;
      const innerRect = inner.getBoundingClientRect();
      const brandRect = brand.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      const style = getComputedStyle(inner);
      return {
        actionsEnd: actionsRect.right,
        brandStart: brandRect.left,
        contentEnd: innerRect.right - Number.parseFloat(style.paddingInlineEnd),
        contentStart: innerRect.left + Number.parseFloat(style.paddingInlineStart),
      };
    });
    expect(Math.abs(facts.brandStart - facts.contentStart)).toBeLessThanOrEqual(1);
    expect(Math.abs(facts.actionsEnd - facts.contentEnd)).toBeLessThanOrEqual(1);
  });

  test('RTL mirrors through logical layout without changing the layout mechanism', async ({
    page,
  }) => {
    const ltrHeader = (await openStory(page, 'default')).header;
    const ltrLayout = await ltrHeader.evaluate((node) => {
      const style = getComputedStyle(
        node.querySelector('.sk-public-header__inner')!,
      );
      return {
        alignItems: style.alignItems,
        display: style.display,
        flexWrap: style.flexWrap,
        gap: style.gap,
        justifyContent: style.justifyContent,
        paddingInlineEnd: style.paddingInlineEnd,
        paddingInlineStart: style.paddingInlineStart,
      };
    });

    const rtlHeader = (await openStory(page, 'rtl')).header;
    const rtlFacts = await rtlHeader.evaluate((node) => {
      const inner = node.querySelector('.sk-public-header__inner')!;
      const brand = node.querySelector('.sk-public-header__brand')!;
      const actions = node.querySelector('.sk-public-header__actions')!;
      const innerRect = inner.getBoundingClientRect();
      const brandRect = brand.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      const style = getComputedStyle(inner);
      return {
        actionsEnd: actionsRect.left,
        brandStart: brandRect.right,
        contentEnd: innerRect.left + Number.parseFloat(style.paddingInlineEnd),
        contentStart:
          innerRect.right - Number.parseFloat(style.paddingInlineStart),
        direction: style.direction,
        layout: {
          alignItems: style.alignItems,
          display: style.display,
          flexWrap: style.flexWrap,
          gap: style.gap,
          justifyContent: style.justifyContent,
          paddingInlineEnd: style.paddingInlineEnd,
          paddingInlineStart: style.paddingInlineStart,
        },
      };
    });
    expect(rtlFacts.direction).toBe('rtl');
    expect(Math.abs(rtlFacts.brandStart - rtlFacts.contentStart)).toBeLessThanOrEqual(
      1,
    );
    expect(Math.abs(rtlFacts.actionsEnd - rtlFacts.contentEnd)).toBeLessThanOrEqual(
      1,
    );
    expect(rtlFacts.layout).toEqual(ltrLayout);
  });

  test('LightMode has a real sk-light ancestor and resolves different token values', async ({
    page,
  }) => {
    const darkHeader = (await openStory(page, 'default')).header;
    const dark = await darkHeader.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderBlockEndColor,
        color: style.color,
      };
    });
    const lightHeader = (await openStory(page, 'light-mode')).header;
    expect(
      await lightHeader
        .locator(
          'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " sk-light ")] ',
        )
        .count(),
    ).toBeGreaterThan(0);
    const light = await lightHeader.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderBlockEndColor,
        color: style.color,
      };
    });
    expect(light.backgroundColor).not.toBe(dark.backgroundColor);
    expect(light.borderColor).not.toBe(dark.borderColor);
    expect(light.color).not.toBe(dark.color);
  });

  test('BrandOnly reserves no action region or navigation landmark', async ({ page }) => {
    const { header } = await openStory(page, 'brand-only');
    await expect(header.locator('.sk-public-header__actions')).toHaveCount(0);
    await expect(header.locator('nav')).toHaveCount(0);
    await expect(header.getByRole('navigation')).toHaveCount(0);
  });
});
