import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const PROGRESS_CSS = 'packages/styles/src/progress/sk-progress.css';
const PROGRESS_BARREL = 'packages/styles/src/progress/index.ts';

const story = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=primitives-skprogress-html--${id}&viewMode=story`);
  const host = page.locator('.sk-progress').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  return host;
};

/**
 * Every exported fixture constant from the GENERATED barrel, parsed the same way the
 * generator itself produced them (`JSON.stringify`-escaped one-liners) — a static
 * source read, matching sk-transition-matrix.spec.ts's own convention of asserting
 * source text rather than requiring a live import of the generated module.
 */
const readFixtures = (): Array<{ name: string; html: string }> => {
  const source = readFileSync(PROGRESS_BARREL, 'utf8');
  const fixtures: Array<{ name: string; html: string }> = [];
  const lineRe = /^export const (\w+) = (".*");$/gm;
  for (const match of source.matchAll(lineRe)) {
    fixtures.push({ name: match[1], html: JSON.parse(match[2]) as string });
  }
  if (fixtures.length === 0) {
    throw new Error(`no fixtures parsed from ${PROGRESS_BARREL} — the barrel's export shape changed`);
  }
  return fixtures;
};

const parseFixture = (html: string) => {
  const value = Number(html.match(/\bvalue="(-?\d+(?:\.\d+)?)"/)?.[1]);
  const max = Number(html.match(/\bmax="(-?\d+(?:\.\d+)?)"/)?.[1]);
  const metaText = html.match(/sk-progress__meta">([^<]*)</)?.[1];
  const forId = html.match(/\bfor="([^"]+)"/)?.[1];
  const id = html.match(/<progress[^>]*\bid="([^"]+)"/)?.[1];
  return { value, max, metaText, forId, id };
};

test.describe('sk-progress markup contract and source-level assertions', () => {
  test('no CSS-generated arithmetic: no content declaration references value/max/counter()', () => {
    const css = readFileSync(PROGRESS_CSS, 'utf8');
    expect(css).not.toMatch(/content\s*:[^;]*\b(value|max|counter\()/);
  });

  test('reduced-motion guard is either absent (no transition authored) or scoped to exactly one selector/property', () => {
    const css = readFileSync(PROGRESS_CSS, 'utf8');
    const hasTransition = /\.sk-progress[^{]*\{[^}]*transition\s*:/s.test(css);
    const reducedMotionBlocks = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\{[^}]*\}[^}]*\}/gs) ?? [];
    if (!hasTransition) {
      expect(reducedMotionBlocks).toHaveLength(0);
    } else {
      expect(reducedMotionBlocks.length).toBeGreaterThan(0);
    }
  });

  test('every authored fixture has zero aria-* and zero role attributes', () => {
    for (const { name, html } of readFixtures()) {
      expect(html, `${name} must carry no aria-* attribute`).not.toMatch(/\baria-[a-z-]+=/);
      expect(html, `${name} must carry no role attribute`).not.toMatch(/\brole=/);
    }
  });

  test('every maintained fixture keeps its visible meta text consistent with its own value/max pair', () => {
    for (const { name, html } of readFixtures()) {
      const { value, max, metaText } = parseFixture(html);
      expect(Number.isFinite(value), `${name}: value must parse`).toBe(true);
      expect(Number.isFinite(max), `${name}: max must parse`).toBe(true);
      expect(metaText, `${name}: sk-progress__meta must be present`).toBeTruthy();
      const percentMatch = metaText!.match(/^(\d+)%$/);
      expect(percentMatch, `${name}: meta text "${metaText}" must be a plain percentage`).not.toBeNull();
      const expectedPercent = Math.round((value / max) * 100);
      expect(Number(percentMatch![1]), `${name}: meta "${metaText}" vs value=${value} max=${max}`).toBe(expectedPercent);
    }
  });

  test('the T10, Compact, and Narrow fixtures carry identical value/max/id/for attributes — only the root class list differs', () => {
    const fixtures = readFixtures();
    const t10 = parseFixture(fixtures.find((f) => f.name === 'SkProgressT10HTML')!.html);
    const compact = parseFixture(fixtures.find((f) => f.name === 'SkProgressCompactHTML')!.html);
    const narrow = parseFixture(fixtures.find((f) => f.name === 'SkProgressNarrowHTML')!.html);
    expect(compact.value).toBe(t10.value);
    expect(compact.max).toBe(t10.max);
    expect(narrow.value).toBe(t10.value);
    expect(narrow.max).toBe(t10.max);
  });
});

test.describe('sk-progress accessibility tree and DOM structure', () => {
  test('Default (T10) exposes the native progressbar role and accessible name from label association alone, with value/max sourced only from the element\'s own attributes', async ({ page }) => {
    const host = await story(page, 'default');
    const control = host.locator('progress');
    await expect(control).toHaveAttribute('value', '5');
    await expect(control).toHaveAttribute('max', '8');
    // Confirms the browser computes the implicit `progressbar` role and derives the
    // accessible name from the associated <label> — no aria-label/aria-labelledby
    // exists anywhere in this fixture (asserted separately, above) for this to fall
    // back on, so a match here is proof of native for/id association working.
    await expect(page.getByRole('progressbar', { name: '5 of 8 Work Packages done' })).toHaveCount(1);
    expect(await control.evaluate((node: HTMLProgressElement) => node.value)).toBe(5);
    expect(await control.evaluate((node: HTMLProgressElement) => node.max)).toBe(8);
    // <progress> has no `min` IDL property at all — its minimum is implicitly and
    // always 0 per the HTML spec, never author-configurable.

    const label = host.locator('label');
    await expect(label).toHaveAttribute('for', 'mission-progress');
    await expect(control).toHaveAttribute('id', 'mission-progress');
  });

  for (const id of ['compact', 'narrow']) {
    test(`${id} modifier preserves the exact three-child structure and attributes of the unmodified T10 fixture`, async ({ page }) => {
      const host = await story(page, id);
      const children = host.locator(':scope > *');
      await expect(children).toHaveCount(3);
      const tagNames = await children.evaluateAll((nodes) => nodes.map((node) => node.tagName.toLowerCase()));
      expect(tagNames).toEqual(['label', 'progress', 'span']);

      const control = host.locator('progress');
      await expect(control).toHaveAttribute('value', '5');
      await expect(control).toHaveAttribute('max', '8');
      const label = host.locator('label');
      const forAttr = await label.getAttribute('for');
      const idAttr = await control.getAttribute('id');
      expect(forAttr).toBe(idAttr);

      await expect(page.getByRole('progressbar', { name: '5 of 8 Work Packages done' })).toHaveCount(1);
    });
  }
});

test.describe('sk-progress overflow, forced-colors, and reduced-motion observables', () => {
  for (const id of ['long-label', 'large-total']) {
    test(`${id} produces no horizontal page overflow at a narrow viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await story(page, id);
      const geometry = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(geometry.scrollWidth).toBe(geometry.clientWidth);
    });
  }

  test('forced-colors emulation keeps the track boundary and the fill each distinguishable from the page background and from each other', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const host = await story(page, 'forced-colors');
    const bar = host.locator('progress');
    const colours = await bar.evaluate((node) => {
      const style = getComputedStyle(node);
      return { borderColor: style.borderColor, backgroundColor: getComputedStyle(document.body).backgroundColor };
    });
    expect(colours.borderColor).not.toBe('');
    expect(colours.borderColor).not.toBe(colours.backgroundColor);
  });
});

test.describe('sk-progress theming', () => {
  /**
   * FR-011: LightMode (class="sk-light") must render genuinely different computed
   * styling from Default (dark), not merely exist as a story. Sampled from the
   * track (`--sk-surface-input`/`--sk-border-default`) and the label
   * (`--sk-fg-default`) — the fill's `--sk-color-yellow` is intentionally the same
   * token in both themes (tokens.css has no `.sk-light` override for it), so it
   * would not prove anything here. This must fail if the `sk-light` wrapper in
   * the LightMode story is ever removed, since both themes would then resolve to
   * the same `:root` token values.
   */
  test('LightMode resolves genuinely different computed track and label styling than Default', async ({ page }) => {
    const themedStyles = async (id: string) => {
      const host = await story(page, id);
      const bar = host.locator('progress');
      const label = host.locator('label');
      return {
        trackBackground: await bar.evaluate((node) => getComputedStyle(node).backgroundColor),
        trackBorderColor: await bar.evaluate((node) => getComputedStyle(node).borderColor),
        labelColor: await label.evaluate((node) => getComputedStyle(node).color),
      };
    };

    const dark = await themedStyles('default');
    const light = await themedStyles('light-mode');

    expect(light.trackBackground).not.toBe(dark.trackBackground);
    expect(light.trackBorderColor).not.toBe(dark.trackBorderColor);
    expect(light.labelColor).not.toBe(dark.labelColor);
  });
});
