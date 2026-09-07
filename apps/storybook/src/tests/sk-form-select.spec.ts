import { expect, test, type Locator, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const SELECT_CSS = 'packages/styles/src/form-select/sk-form-select.css';
const SELECT_BARREL = 'packages/styles/src/form-select/index.ts';
const STYLES_PACKAGE = 'packages/styles/package.json';
const STYLES_ROOT = 'packages/styles/src/index.ts';
const COMPONENT_USAGE_DOC = 'docs/design-system/using-components.md';
const TOKEN_LITERAL_CHECKER = 'scripts/check-component-token-literals.mjs';
const STORY_PREFIX = 'form-skformselect-html';

const storyIds = [
  'default',
  't-12-two-filters',
  'compact',
  'long-options',
  'optgroups',
  'required-invalid',
  'disabled',
  'narrow',
  'forced-colors',
  'light-mode',
] as const;

type StoryId = (typeof storyIds)[number];

type LoadedStory = {
  root: Locator;
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
  await expect(root).not.toBeEmpty();
  await root.locator('.sk-form-select').first().waitFor({ state: 'visible', timeout: 20000 });
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  return { root, consoleErrors, pageErrors };
}

function readGeneratedFixtures(): Array<{ name: string; html: string }> {
  const source = readFileSync(SELECT_BARREL, 'utf8');
  const fixtures: Array<{ name: string; html: string }> = [];
  for (const match of source.matchAll(/^export const (\w+) = (".*");$/gm)) {
    fixtures.push({ name: match[1], html: JSON.parse(match[2]) as string });
  }
  if (fixtures.length === 0) throw new Error(`no generated fixtures parsed from ${SELECT_BARREL}`);
  return fixtures;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
}

function classSelectorInventory(source: string): string[] {
  const classes = new Set<string>();
  const root = postcss.parse(source, { from: SELECT_CSS });
  root.walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walkClasses((className) => classes.add(className.value));
    }).processSync(rule.selector);
  });
  return [...classes].sort();
}

async function assertNativeSelect(select: Locator): Promise<void> {
  const facts = await select.evaluate((node) => ({
    isSelect: node instanceof HTMLSelectElement,
    inLightDom: node.getRootNode() === document,
    descendants: [...node.querySelectorAll('*')].map((child) => child.tagName.toLowerCase()),
    directChildren: [...node.children].map((child) => child.tagName.toLowerCase()),
    roles: [node, ...node.querySelectorAll('*')]
      .map((child) => child.getAttribute('role'))
      .filter((role): role is string => role !== null),
    authoredOptionState: node.querySelectorAll('[aria-selected]').length,
  }));
  expect(facts.isSelect).toBe(true);
  expect(facts.inLightDom).toBe(true);
  expect(facts.descendants.length).toBeGreaterThan(0);
  expect(facts.descendants.every((tag) => tag === 'option' || tag === 'optgroup')).toBe(true);
  expect(facts.directChildren.every((tag) => tag === 'option' || tag === 'optgroup')).toBe(true);
  expect(facts.roles).toEqual([]);
  expect(facts.authoredOptionState).toBe(0);
}

test.describe('sk-form-select source, markup, and distribution contract', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'browser-independent contracts run once');

  test('the public selector inventory is exactly the base and compact classes and preserves native affordances', () => {
    const source = readFileSync(SELECT_CSS, 'utf8');
    const code = stripComments(source);
    expect(classSelectorInventory(source)).toEqual(['sk-form-select', 'sk-form-select--compact']);
    expect(code).not.toMatch(/appearance\s*:\s*none/);
    expect(code).not.toMatch(/forced-color-adjust\s*:\s*none/);
    expect(code).not.toMatch(/(?:background-image|content)\s*:/);
    expect(code).not.toMatch(/(?:transition|animation(?:-[a-z-]+)?)\s*:/);
    expect(code).not.toMatch(/outline\s*:\s*none/);
    expect(code).not.toMatch(/(?:\.sk-light|data-theme|:root|:host-context)/);

    const selftest = execFileSync(process.execPath, [TOKEN_LITERAL_CHECKER, '--selftest'], { encoding: 'utf8' });
    expect(selftest).toContain('governed token classes fail red');
    const audit = execFileSync(process.execPath, [TOKEN_LITERAL_CHECKER, SELECT_CSS], { encoding: 'utf8' });
    expect(audit).toContain('1 explicit component stylesheet(s) use tokens for all governed values');
  });

  test('seven authored fixtures generate seven exports without custom option markup', () => {
    const fixtures = readGeneratedFixtures();
    expect(fixtures.map(({ name }) => name).sort()).toEqual([
      'SkFormSelectCompactHTML',
      'SkFormSelectDisabledHTML',
      'SkFormSelectLongOptionsHTML',
      'SkFormSelectOptgroupsHTML',
      'SkFormSelectRequiredInvalidHTML',
      'SkFormSelectT10LaneHTML',
      'SkFormSelectT12FiltersHTML',
    ]);
    for (const { name, html } of fixtures) {
      expect(html, `${name} styles a native select`).toMatch(/<select\b[^>]*class="[^"]*\bsk-form-select\b/);
      expect(html, `${name} has no custom select element`).not.toMatch(/<sk-form-select\b/);
      expect(html, `${name} has no replacement roles`).not.toMatch(/role="(?:combobox|listbox|option)"/);
      expect(html, `${name} has no custom option classes`).not.toMatch(/sk-form-select__(?:option|indicator)/);
    }
  });

  test('the component remains styles-only and absent from element, wrapper, behavior, and mutation surfaces', () => {
    expect(existsSync('packages/elements/src/form-select')).toBe(false);
    for (const path of ['packages/react/src/SkFormSelect.js', 'packages/react/src/SkFormSelect.d.ts']) {
      expect(existsSync(path)).toBe(false);
    }
    for (const path of [
      'packages/elements/custom-elements.json',
      'packages/elements/vue.d.ts',
      'expected-parts.json',
      'expected-docs.json',
      'behaviours.json',
      'mutations.json',
    ]) {
      expect(readFileSync(path, 'utf8')).not.toMatch(/(?:sk-form-select|SkFormSelect)/);
    }
  });

  test('the generated markup barrel and packed CSS subpath are independently public', () => {
    const root = readFileSync(STYLES_ROOT, 'utf8');
    expect(root).toMatch(/export \* from ['"]\.\/form-select\/index['"];/);
    expect(root).not.toMatch(/import ['"].*sk-form-select\.css['"]/);
    const packageJson = JSON.parse(readFileSync(STYLES_PACKAGE, 'utf8')) as {
      exports: Record<string, unknown>;
    };
    expect(packageJson.exports['./form-select/*']).toBe('./dist/form-select/*');
  });

  test('consumer documentation records native light-DOM, datalist, and state ownership boundaries', () => {
    const docs = readFileSync(COMPONENT_USAGE_DOC, 'utf8');
    const start = docs.indexOf('## Native form select');
    expect(start).toBeGreaterThanOrEqual(0);
    const section = docs.slice(start, docs.indexOf('\n## ', start + 4) === -1 ? undefined : docs.indexOf('\n## ', start + 4));
    expect(section).toContain('sk-form-select--compact');
    expect(section).toMatch(/native light DOM/i);
    expect(section).toMatch(/datalist[^.]*unmatched free text/i);
    expect(section).toMatch(/consumers? own[^.]*options/i);
    expect(section).toMatch(/change/i);
    expect(section).toMatch(/filter|lane/i);
  });
});

test.describe('sk-form-select live native semantics', () => {
  for (const id of storyIds) {
    test(`${id} loads a non-empty native light-DOM select surface without errors`, async ({ page }) => {
      if (id === 'narrow') await page.setViewportSize({ width: 320, height: 720 });
      const loaded = await openStory(page, id);
      expect(loaded.consoleErrors).toEqual([]);
      expect(loaded.pageErrors).toEqual([]);
      const selects = loaded.root.locator('.sk-form-select');
      expect(await selects.count()).toBeGreaterThan(0);
      for (let index = 0; index < (await selects.count()); index += 1) {
        await assertNativeSelect(selects.nth(index));
      }
    });
  }

  test('T10 label activation, ArrowDown, unique-prefix typeahead, reset, and full-width geometry are browser-owned', async ({ page }) => {
    const { root } = await openStory(page, 'default');
    const select = root.locator('#t10-lane');
    const label = root.locator('label[for="t10-lane"]');
    await expect(page.getByRole('combobox', { name: 'Lane' })).toHaveCount(1);
    await label.click();
    await expect(select).toBeFocused();

    await select.press('ArrowDown');
    await expect(select).toHaveValue('in-progress');
    await select.press('d');
    await expect(select).toHaveValue('done');
    await select.evaluate((node: HTMLSelectElement) => node.form?.reset());
    await expect(select).toHaveValue('planned');

    const sizing = await select.evaluate((node) => {
      const field = node.closest('.sk-form-field')!;
      const frame = node.closest('[data-form-select-story-frame]')!;
      const frameStyle = getComputedStyle(frame);
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        selectWidth: node.getBoundingClientRect().width,
        fieldWidth: field.getBoundingClientRect().width,
        frameWidth: frame.getBoundingClientRect().width,
        frameContentWidth:
          frame.getBoundingClientRect().width -
          Number.parseFloat(frameStyle.paddingInlineStart) -
          Number.parseFloat(frameStyle.paddingInlineEnd),
        storyRootWidth: document.querySelector('#storybook-root')!.getBoundingClientRect().width,
        viewportWidth: document.documentElement.clientWidth,
        documentScrollWidth: scroller.scrollWidth,
      };
    });
    expect(sizing.documentScrollWidth).toBe(sizing.viewportWidth);
    expect(sizing.storyRootWidth).toBeCloseTo(sizing.viewportWidth, 0);
    expect(sizing.frameWidth).toBeCloseTo(sizing.storyRootWidth, 0);
    expect(sizing.fieldWidth).toBeCloseTo(sizing.frameContentWidth, 0);
    expect(sizing.selectWidth).toBeCloseTo(sizing.fieldWidth, 0);
  });

  test('required invalid requestSubmit is blocked, then one valid submit exposes exact FormData and same-root help', async ({ page }) => {
    const { root } = await openStory(page, 'required-invalid');
    const form = root.locator('form');
    const select = root.locator('#required-lane');
    await expect(select).toHaveValue('');
    expect(await select.evaluate((node: HTMLSelectElement) => node.validity.valueMissing)).toBe(true);
    expect(await select.evaluate((node: HTMLSelectElement) => node.matches(':invalid'))).toBe(true);
    await expect(select).toHaveAccessibleDescription('Choose a lane before continuing.');
    expect(
      await select.evaluate((node) => {
        const id = node.getAttribute('aria-describedby')!;
        const target = (node.getRootNode() as Document).getElementById(id);
        return Boolean(target && target.getRootNode() === node.getRootNode() && target.getClientRects().length);
      }),
    ).toBe(true);

    await form.evaluate((node: HTMLFormElement) => {
      (window as Window & { formSelectSubmits?: Array<Array<[string, FormDataEntryValue]>> }).formSelectSubmits = [];
      node.addEventListener('submit', (event) => {
        event.preventDefault();
        const entries = [...new FormData(node).entries()];
        (window as Window & { formSelectSubmits: Array<Array<[string, FormDataEntryValue]>> }).formSelectSubmits.push(entries);
      });
      node.requestSubmit();
    });
    expect(await page.evaluate(() => (window as Window & { formSelectSubmits: unknown[] }).formSelectSubmits.length)).toBe(0);

    await select.selectOption('planned');
    await form.evaluate((node: HTMLFormElement) => node.requestSubmit());
    expect(
      await page.evaluate(() => (window as Window & { formSelectSubmits: Array<Array<[string, FormDataEntryValue]>> }).formSelectSubmits),
    ).toEqual([[['lane', 'planned']]]);
  });

  test('T12 submits two independent filters in one canceling submit event', async ({ page }) => {
    const { root } = await openStory(page, 't-12-two-filters');
    const form = root.locator('form');
    await root.locator('#t12-kind').selectOption('feature');
    await root.locator('#t12-outcome').selectOption('approved');
    const evidence = await form.evaluate((node: HTMLFormElement) =>
      new Promise<{ count: number; entries: Array<[string, FormDataEntryValue]> }>((resolve) => {
        let count = 0;
        node.addEventListener('submit', (event) => {
          event.preventDefault();
          count += 1;
          resolve({ count, entries: [...new FormData(node).entries()] });
        });
        node.requestSubmit();
      }),
    );
    expect(evidence).toEqual({ count: 1, entries: [['kind', 'feature'], ['outcome', 'approved']] });
  });

  test('disabled controls retain native exclusion and cannot be focused', async ({ page }) => {
    const { root } = await openStory(page, 'disabled');
    const select = root.locator('#disabled-lane');
    await expect(select).toBeDisabled();
    await select.focus();
    await expect(select).not.toBeFocused();
    expect(await select.evaluate((node: HTMLSelectElement) => [...new FormData(node.form!).entries()])).toEqual([]);
    expect(await select.evaluate((node) => getComputedStyle(node).cursor)).toBe('not-allowed');
  });

  test('native optgroups and flattened option order remain authored and platform-owned', async ({ page }) => {
    const { root } = await openStory(page, 'optgroups');
    const facts = await root.locator('#grouped-lane').evaluate((node: HTMLSelectElement) => ({
      children: [...node.children].map((child) => [child.tagName.toLowerCase(), child.getAttribute('label')]),
      options: [...node.options].map((option) => [option.value, option.text]),
    }));
    expect(facts.children).toEqual([['option', null], ['optgroup', 'Open'], ['optgroup', 'Closed']]);
    expect(facts.options).toEqual([
      ['', 'Choose a lane'],
      ['planned', 'Planned'],
      ['in-progress', 'In progress'],
      ['approved', 'Approved'],
      ['done', 'Done'],
    ]);
  });

  test('long and 320px narrow stories remain inside the document and containing form field', async ({ page }) => {
    for (const id of ['long-options', 'narrow'] as const) {
      await page.setViewportSize({ width: 320, height: 720 });
      const { root } = await openStory(page, id);
      const geometry = await root.locator('.sk-form-select').first().evaluate((node) => {
        const field = node.closest('.sk-form-field')!;
        const scroller = document.scrollingElement ?? document.documentElement;
        const selectRect = node.getBoundingClientRect();
        const fieldRect = field.getBoundingClientRect();
        return {
          documentClient: scroller.clientWidth,
          documentScroll: scroller.scrollWidth,
          selectLeft: selectRect.left,
          selectRight: selectRect.right,
          selectWidth: selectRect.width,
          fieldLeft: fieldRect.left,
          fieldRight: fieldRect.right,
          fieldWidth: fieldRect.width,
        };
      });
      expect(geometry.documentScroll).toBe(geometry.documentClient);
      expect(geometry.selectLeft).toBeGreaterThanOrEqual(geometry.fieldLeft - 0.5);
      expect(geometry.selectRight).toBeLessThanOrEqual(geometry.fieldRight + 0.5);
      expect(geometry.selectWidth).toBeCloseTo(geometry.fieldWidth, 0);
    }
  });

  test('LightMode uses a real sk-light ancestor and changes token-derived computed styles', async ({ page }) => {
    const computed = async (id: 'default' | 'light-mode') => {
      const { root } = await openStory(page, id);
      const select = root.locator('.sk-form-select').first();
      return select.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          hasLightAncestor: Boolean(node.closest('.sk-light')),
          background: style.backgroundColor,
          border: style.borderColor,
          color: style.color,
        };
      });
    };
    const dark = await computed('default');
    const light = await computed('light-mode');
    expect(dark.hasLightAncestor).toBe(false);
    expect(light.hasLightAncestor).toBe(true);
    expect(light.background).not.toBe(dark.background);
    expect(light.border).not.toBe(dark.border);
    expect(light.color).not.toBe(dark.color);
  });

  test('forced colors retains native appearance plus non-color focus, invalid, and disabled cues', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Playwright forced-colors emulation is Chromium-specific');
    await page.emulateMedia({ forcedColors: 'active' });
    const required = await openStory(page, 'forced-colors');
    const invalid = required.root.locator('.sk-form-select').first();
    await invalid.focus();
    const invalidStyle = await invalid.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        appearance: style.appearance,
        borderStyle: style.borderStyle,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });
    expect(invalidStyle.appearance).not.toBe('none');
    expect(invalidStyle.borderStyle).toBe('double');
    expect(invalidStyle.outlineStyle).not.toBe('none');
    expect(invalidStyle.outlineWidth).not.toBe('0px');
    await expect(required.root.locator('#required-lane-error')).toBeVisible();

    const disabled = await openStory(page, 'disabled');
    const disabledStyle = await disabled.root.locator('.sk-form-select').evaluate((node) => ({
      appearance: getComputedStyle(node).appearance,
      borderStyle: getComputedStyle(node).borderStyle,
      cursor: getComputedStyle(node).cursor,
    }));
    expect(disabledStyle.appearance).not.toBe('none');
    expect(disabledStyle.borderStyle).toBe('dashed');
    expect(disabledStyle.cursor).toBe('not-allowed');
  });
});
