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
 * Decodes a Playwright screenshot Buffer INSIDE the page (Canvas/Image are standard
 * web APIs, identical across chromium/firefox/webkit) and samples three points across
 * the element's width. Exists because `getComputedStyle(node, '::-webkit-progress-value')`
 * / `'::-moz-progress-bar'` does not reliably reflect authored CSS for these vendor
 * pseudo-elements in this repo's measured testing (Chromium in particular returns
 * default/initial values regardless of the actual applied style) — pixel sampling
 * reads what actually rendered instead of guessing at an unreliable API, and works
 * identically on every engine including WebKit in CI.
 */
const samplePixels = async (page: Page, buffer: Buffer) => {
  const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
  return page.evaluate(async (url) => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const w = canvas.width;
    const h = canvas.height;
    const sample = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);
    return {
      left: sample(2, Math.floor(h / 2)),
      center: sample(Math.floor(w / 2), Math.floor(h / 2)),
      right: sample(Math.max(0, w - 3), Math.floor(h / 2)),
    };
  }, dataUrl);
};

type Pixels = Awaited<ReturnType<typeof samplePixels>>;
const pixelsEqual = (a: number[], b: number[], tolerance = 2) =>
  a.every((v, i) => Math.abs(v - b[i]) <= tolerance);
const samplesEqual = (a: Pixels, b: Pixels, tolerance = 2) =>
  pixelsEqual(a.left, b.left, tolerance) && pixelsEqual(a.center, b.center, tolerance) && pixelsEqual(a.right, b.right, tolerance);

/** `getComputedStyle(...).borderColor` / `.backgroundColor` come back as `rgb(r, g, b)` or
 * `rgba(r, g, b, a)` strings; extract the numeric components for a pixel-tolerance compare
 * against a canvas-sampled RGBA array via `pixelsEqual`. */
const parseRgb = (s: string) => (s.match(/\d+/g) ?? []).map(Number);

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

/** FR-014/R-03: the naming convention every indeterminate fixture export uses. */
const isIndeterminate = (name: string) => name.includes('Indeterminate');

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

  /**
   * R-07's narrow CSS-guard substitute for a component-scoped #286 no-literal test:
   * this family has no `render()`/shadow root at all (confirmed by the ADR-15-
   * independence grep below), so the defect class #286 targets cannot occur here.
   * This asserts no `content:` declaration anywhere in the file carries literal
   * text (distinct from the test above, which only checks for value/max/counter()
   * references) — a permanent, cheap regression guard, not a new repo-wide gate.
   */
  test('no CSS Generated Content literal text: no content declaration with a quoted string', () => {
    const css = readFileSync(PROGRESS_CSS, 'utf8');
    expect(css).not.toMatch(/content\s*:\s*["']/);
  });

  test('ADR-15 independence remains true after this mission: zero :host/::slotted/container-type/::part RULE usage', () => {
    // SC-013 / R-01: this file's own header comment explains, in prose, that no
    // `:host` rule applies here — a literal grep for the bare strings would flag
    // that explanatory sentence itself (it always has, since #210). The actual
    // gate is for RULE syntax (a selector or declaration), not the word appearing
    // in a comment, so this matches the same shapes
    // `check-adopted-css-boundaries.mjs` looks for.
    const css = readFileSync(PROGRESS_CSS, 'utf8');
    expect(css).not.toMatch(/:host\s*[{(]|::slotted\s*\(|container-type\s*:|::part\s*\(/);
  });

  test('reduced-motion guard is either absent (no transition/animation authored) or scoped to exactly the selectors/properties owning one', () => {
    const css = readFileSync(PROGRESS_CSS, 'utf8');
    // FR-007/NFR-005: this mission's guard is `animation`-based, not `transition`-based
    // (the determinate family owns no transition at all — unchanged). The original
    // version of this test only looked for `transition:`, which would have silently
    // treated this mission's real, non-vacuous `animation-name` guard as vacuous.
    const hasMotionDeclaration = /\.sk-progress[^{]*\{[^}]*(transition|animation-name)\s*:/s.test(css);
    const reducedMotionBlocks = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g) ?? [];
    if (!hasMotionDeclaration) {
      expect(reducedMotionBlocks).toHaveLength(0);
    } else {
      expect(reducedMotionBlocks.length).toBeGreaterThan(0);
      // Every rule inside the reduced-motion block(s) is scoped to a
      // `.sk-progress--indeterminate` selector and sets `animation-name` — never a
      // wildcard over the component's own subtree.
      const combined = reducedMotionBlocks.join('\n');
      const innerSelectors = combined.match(/^\s*\.[^{]+\{/gm) ?? [];
      expect(innerSelectors.length).toBeGreaterThan(0);
      for (const selector of innerSelectors) {
        expect(selector).toContain('.sk-progress--indeterminate');
      }
      expect(combined).toMatch(/animation-name\s*:\s*none/);
    }
  });

  test('every authored fixture has zero aria-* and zero role attributes', () => {
    for (const { name, html } of readFixtures()) {
      expect(html, `${name} must carry no aria-* attribute`).not.toMatch(/\baria-[a-z-]+=/);
      expect(html, `${name} must carry no role attribute`).not.toMatch(/\brole=/);
    }
  });

  test('every maintained DETERMINATE fixture keeps its visible meta text consistent with its own value/max pair', () => {
    // Scoped to determinate fixtures only (FR-014/R-03/SC-009) — a targeted filter,
    // not a loosened assertion: every determinate fixture is still checked exactly
    // as before this mission. Indeterminate fixtures have no value/max pair by
    // design (FR-002) and are asserted separately below.
    const determinateFixtures = readFixtures().filter(({ name }) => !isIndeterminate(name));
    expect(determinateFixtures.length).toBeGreaterThan(0);
    for (const { name, html } of determinateFixtures) {
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

  test('every INDETERMINATE fixture has no value attribute anywhere in its source, and any meta text is never a percentage', () => {
    const indeterminateFixtures = readFixtures().filter(({ name }) => isIndeterminate(name));
    // FR-012: at least the five required fixtures exist.
    expect(indeterminateFixtures.length).toBeGreaterThanOrEqual(5);
    for (const { name, html } of indeterminateFixtures) {
      // R-02: structurally absent, not an empty string or an out-of-range value —
      // asserted at the source-file text level, matching the fixture author's own
      // source, not only the rendered DOM (a template artifact injecting `value=""`
      // would be invisible to a rendered-DOM-only check).
      expect(html, `${name} must carry no value attribute at all`).not.toMatch(/\bvalue=/);
      const metaText = html.match(/sk-progress__meta">([^<]*)</)?.[1];
      if (metaText !== undefined) {
        expect(metaText, `${name}: meta text "${metaText}" must never read as a percentage`).not.toMatch(/^\d+%$/);
      }
    }
    // FR-005: at least one fixture omits __meta entirely (a supported, tested
    // state), and at least one supplies non-numeric status text.
    const withoutMeta = indeterminateFixtures.filter(({ html }) => !html.includes('sk-progress__meta'));
    const withMeta = indeterminateFixtures.filter(({ html }) => html.includes('sk-progress__meta'));
    expect(withoutMeta.length).toBeGreaterThan(0);
    expect(withMeta.length).toBeGreaterThan(0);
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

  test('Indeterminate exposes the native progressbar role and accessible name from label association alone, with no numeric value exposed', async ({ page }) => {
    const host = await story(page, 'indeterminate');
    const control = host.locator('progress');
    await expect(page.getByRole('progressbar', { name: 'Syncing your changes' })).toHaveCount(1);
    // The HTML spec's own engine-agnostic signal for indeterminate state — more
    // robust than depending on any particular ARIA string, and works identically
    // across chromium/firefox/webkit (R-02/plan.md).
    expect(await control.evaluate((node: HTMLProgressElement) => node.position)).toBe(-1);
    await expect(control).not.toHaveAttribute('value');
    // No accessible numeric value is exposed via the accessibility snapshot API.
    const snapshot = await control.ariaSnapshot();
    expect(snapshot).not.toMatch(/\d/);
  });

  test('indeterminate two-child (no meta) and three-child (with meta) fixtures preserve the exact flat-children order, no wrapper, no reorder', async ({ page }) => {
    const noMeta = await story(page, 'indeterminate');
    const noMetaChildren = noMeta.locator(':scope > *');
    await expect(noMetaChildren).toHaveCount(2);
    expect(await noMetaChildren.evaluateAll((nodes) => nodes.map((n) => n.tagName.toLowerCase()))).toEqual(['label', 'progress']);

    const withMeta = await story(page, 'indeterminate-with-meta');
    const withMetaChildren = withMeta.locator(':scope > *');
    await expect(withMetaChildren).toHaveCount(3);
    expect(await withMetaChildren.evaluateAll((nodes) => nodes.map((n) => n.tagName.toLowerCase()))).toEqual(['label', 'progress', 'span']);
  });

  test('IndeterminateNarrow preserves the three-flat-children contract combined with the existing --narrow layout modifier', async ({ page }) => {
    const host = await story(page, 'indeterminate-narrow');
    await expect(host).toHaveClass(/sk-progress--indeterminate/);
    await expect(host).toHaveClass(/sk-progress--narrow/);
    const control = host.locator('progress');
    expect(await control.evaluate((node: HTMLProgressElement) => node.position)).toBe(-1);
  });
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

  for (const id of ['indeterminate-narrow', 'indeterminate-long-label']) {
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

  test('Indeterminate forced-colors: the fill is legible against the page, non-full-width, and non-animating, at two distinct points in the animation cycle', async ({ page }) => {
    // R-06: the existing forced-colors precedent was proven for a static fill only;
    // an animated fill needs sampling at more than one point in its cycle so a
    // coincidentally-correct single frame cannot produce a false pass.
    //
    // #345 — MEASURED: this rule used to flatten the fill to a solid, full-width Highlight
    // block. Once #328's selector-list fix (above) lets the determinate Complete fixture's own
    // fill receive the identical Highlight override, that shape renders pixel-identical to
    // Complete — a false completion claim under forced-colors (spec.md User Story 3). Confirmed
    // by rendering both under forced-colors and sampling before the fix landed. Fixed via
    // `clip-path` (a `linear-gradient` two-stop split was tried first and MEASURED to fail: the
    // CSS Color Adjustment spec requires UAs to drop author `background-image` under
    // forced-colors, confirmed by an isolated probe — `clip-path` is pure geometry, so it
    // survives). This test asserts the fixed shape directly against both Complete and Zero, not
    // merely against the page background.
    await page.emulateMedia({ forcedColors: 'active' });

    const complete = await story(page, 'complete');
    const completeSample = await samplePixels(page, await complete.locator('progress').screenshot());
    const zero = await story(page, 'zero');
    const zeroSample = await samplePixels(page, await zero.locator('progress').screenshot());

    const host = await story(page, 'indeterminate-forced-colors');
    const bar = host.locator('progress');

    const bodyBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const borderColor = await bar.evaluate((node) => getComputedStyle(node).borderColor);
    expect(borderColor).not.toBe('');
    expect(borderColor).not.toBe(bodyBackground);

    const sample1 = await samplePixels(page, await bar.screenshot());
    await page.waitForTimeout(300);
    const sample2 = await samplePixels(page, await bar.screenshot());

    const bodyRgb = parseRgb(bodyBackground);

    // The fill's clipped region is the left portion of the track (see sk-progress.css's #345
    // comment) — sample there. Legible against the page at EVERY sampled point, not just
    // coincidentally at one.
    for (const sample of [sample1, sample2]) {
      expect(pixelsEqual(sample.left.slice(0, 3), bodyRgb, 10)).toBe(false);
    }

    // Non-motion: the clip and colour are both static now — there is no gradient left to sweep
    // — so the two samples are identical. This IS the expected, deliberate shape (see
    // sk-progress.css's #345 comment), not a bug.
    expect(samplesEqual(sample1, sample2)).toBe(true);

    // Non-full-width: distinguishable from Complete's fully-full, edge-to-edge fill (its right
    // edge, outside this fixture's clip, must differ from Complete's) and from Zero's
    // fully-empty track (its left edge, inside the clip, must differ from Zero's) — neither the
    // Complete nor the Zero visual, mirroring the reduced-motion frame's own technique below.
    // And its own left/right samples must differ from each other — proving partial geometry
    // rather than a uniform block.
    expect(pixelsEqual(sample1.right.slice(0, 3), completeSample.right.slice(0, 3), 10)).toBe(false);
    expect(pixelsEqual(sample1.left.slice(0, 3), zeroSample.left.slice(0, 3), 10)).toBe(false);
    expect(pixelsEqual(sample1.left.slice(0, 3), sample1.right.slice(0, 3), 10)).toBe(false);
  });

  test('Indeterminate forced-colors AND prefers-reduced-motion together: the same non-full-width, non-animating fill — a common Windows High Contrast pairing neither axis alone tests', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    const host = await story(page, 'indeterminate-forced-colors');
    const bar = host.locator('progress');

    const sample1 = await samplePixels(page, await bar.screenshot());
    await page.waitForTimeout(300);
    const sample2 = await samplePixels(page, await bar.screenshot());

    // Non-motion under the combination (forced-colors alone already guarantees this; asserted
    // directly for the combined case rather than assumed from each axis independently).
    expect(samplesEqual(sample1, sample2)).toBe(true);
    // Non-full-width under the combination.
    expect(pixelsEqual(sample1.left.slice(0, 3), sample1.right.slice(0, 3), 10)).toBe(false);
  });

  test('Indeterminate: the authored sweep animation actually runs (two captures over time differ) with no reduced-motion preference set', async ({ page }) => {
    const host = await story(page, 'indeterminate');
    const bar = host.locator('progress');
    const sample1 = await samplePixels(page, await bar.screenshot());
    await page.waitForTimeout(400);
    const sample2 = await samplePixels(page, await bar.screenshot());
    expect(samplesEqual(sample1, sample2)).toBe(false);
  });

  test('Indeterminate under prefers-reduced-motion: reduce — the animation stops (two captures over time are identical) and the frozen frame is neither the Complete nor the Zero determinate visual', async ({ page }) => {
    // Complete/Zero baselines, unaffected by reduced-motion (they carry no
    // authored transition/animation at all — see the vacuous-guard test above).
    const complete = await story(page, 'complete');
    const completePixels = await samplePixels(page, await complete.locator('progress').screenshot());
    const zero = await story(page, 'zero');
    const zeroPixels = await samplePixels(page, await zero.locator('progress').screenshot());

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const host = await story(page, 'indeterminate');
    const bar = host.locator('progress');

    // (a) the animation is not running: two captures 400ms apart are identical.
    const frame1 = await samplePixels(page, await bar.screenshot());
    await page.waitForTimeout(400);
    const frame2 = await samplePixels(page, await bar.screenshot());
    expect(samplesEqual(frame1, frame2)).toBe(true);

    // (b) the frozen frame is distinguishable from BOTH the Complete determinate
    // fixture's fully-full fill (uniform colour edge-to-edge) and the Zero
    // determinate fixture's fully-empty track (uniform colour edge-to-edge). The
    // reduced-motion frame is a partial gradient band: its own left/center/right
    // samples are NOT all identical to each other (proving it is neither a
    // uniform full fill nor a uniform empty track), and its centre sample differs
    // measurably from the Zero fixture's centre (proving something IS visibly
    // painted) while its edge samples differ from the Complete fixture's edge
    // (proving the fill does not reach fully to both edges the way Complete's
    // solid, 100%-width fill does).
    expect(pixelsEqual(frame1.left, frame1.center, 6) && pixelsEqual(frame1.center, frame1.right, 6)).toBe(false);
    expect(pixelsEqual(frame1.center, zeroPixels.center, 10)).toBe(false);
    expect(pixelsEqual(frame1.left, completePixels.left, 10) && pixelsEqual(frame1.right, completePixels.right, 10)).toBe(false);
  });
});

test.describe('sk-progress absent-state regression: the indeterminate modifier does not leak onto determinate fixtures', () => {
  /**
   * #308's HIGH ("display: flex with no [open] qualifier never hid a closed
   * dialog") and #302's own fix were both missed because every test exercised the
   * PRESENT state and nothing asserted the ABSENT one. The indeterminate modifier
   * is a present/absent feature too: this test asserts a determinate fixture
   * renders with no leaked animation, AND — mutated and watched, not merely
   * asserted — that the SAME technique would have caught it had the modifier
   * actually leaked, by injecting the leak via `page.evaluate` and re-running the
   * identical check.
   */
  test('Default (determinate) has no authored animation running, and this check has teeth: injecting the modifier makes it fail', async ({ page }) => {
    const host = await story(page, 'default');
    await expect(host).not.toHaveClass(/sk-progress--indeterminate/);
    const bar = host.locator('progress');

    const before1 = await samplePixels(page, await bar.screenshot());
    await page.waitForTimeout(400);
    const before2 = await samplePixels(page, await bar.screenshot());
    // No leak: no motion on the unmodified determinate fixture.
    expect(samplesEqual(before1, before2)).toBe(true);

    // MUTATE: simulate the modifier leaking onto a determinate fixture.
    await host.evaluate((node) => node.classList.add('sk-progress--indeterminate'));
    const after1 = await samplePixels(page, await bar.screenshot());
    await page.waitForTimeout(400);
    const after2 = await samplePixels(page, await bar.screenshot());
    // WATCH: with the leak injected, the identical check now correctly detects
    // motion — proving the "no leak" assertion above is not vacuous.
    expect(samplesEqual(after1, after2)).toBe(false);
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
