import { expect, test, type Page } from '@playwright/test';

/**
 * DOES THE DIFFERENTIATION ACTUALLY SURVIVE FORCED COLORS, OR ONLY IN THE STYLESHEET?
 *
 * The behaviour fixture asserts the authored `@media (forced-colors: active)` block by PARSING
 * the CSS. That proves the rules were written; it cannot prove the engine still tells four series
 * apart once every ink has collapsed. `sk-notice-forced-colors.spec.ts` records why the
 * distinction matters: a sibling mission shipped a forced-colors block that satisfied review and
 * did nothing.
 *
 * The trap this file is written against is specific to a chart. Under `forced-colors: active`
 * every series stroke is remapped to the same system colour, so a test comparing STROKE across
 * series would pass with the whole block deleted and would also pass for a chart that had become
 * unreadable. What has to survive is the two channels the algorithm does NOT touch:
 * `stroke-dasharray` and the marker geometry. Those are measured here, in forced-colors mode,
 * against the real built Storybook.
 */

const chartIn = async (page: Page, storyId: string) => {
  await page.goto(`/iframe.html?id=elements-sktimeserieschart--${storyId}&viewMode=story`);
  const host = page.locator('sk-time-series-chart').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  return host;
};

test.describe('sk-time-series-chart forced colors', () => {
  test('four series stay apart by dash and marker shape once every ink has collapsed', async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const host = await chartIn(page, 'multiple-series');

    const measured = await host.evaluate((node) => {
      const root = node.shadowRoot!;
      const lines = [...root.querySelectorAll('[part="line"]')];
      const shapes = [...root.querySelectorAll('[part="marker"]')].map((m) =>
        m.getAttribute('data-shape'),
      );
      return {
        strokes: lines.map((line) => getComputedStyle(line).stroke),
        dashes: lines.map((line) => getComputedStyle(line).strokeDasharray),
        shapes: [...new Set(shapes)],
      };
    });

    // The premise, asserted rather than assumed: ink really has collapsed. If this ever stops
    // holding, the assertions below stop being about forced colors at all.
    expect(
      new Set(measured.strokes).size,
      `ink did not collapse under forced colors: ${measured.strokes.join(' | ')}`,
    ).toBe(1);

    // THE LOAD-BEARING ASSERTIONS. Neither `stroke-dasharray` nor an SVG shape is touched by the
    // forced-colors algorithm, so a difference here can only have come from the authored
    // `--sk-chart-dash-*` tokens and from the element's own marker geometry.
    expect(
      new Set(measured.dashes).size,
      `dash patterns collapsed with the ink: ${measured.dashes.join(' | ')}`,
    ).toBe(4);
    expect(measured.shapes.sort()).toEqual(['circle', 'diamond', 'square', 'triangle']);
  });

  test('a gap is still drawn once the band has flattened to the ground', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const host = await chartIn(page, 'interior-gap');

    const gap = await host.evaluate((node) => {
      const group = node.shadowRoot!.querySelector('[part="gap"]')!;
      const band = group.querySelector('.sk-time-series-chart__gap-band')!;
      const edge = group.querySelector('.sk-time-series-chart__gap-edge')!;
      const bandStyle = getComputedStyle(band);
      const edgeStyle = getComputedStyle(edge);
      return {
        bandFill: bandStyle.fill,
        edgeStroke: edgeStyle.stroke,
        edgeDash: edgeStyle.strokeDasharray,
        edgeWidth: edgeStyle.strokeWidth,
        lines: node.shadowRoot!.querySelectorAll('[part="line"]').length,
      };
    });

    // `fill` does not survive: the band flattens to the ground. That is exactly why the gap is
    // EDGED rather than only filled — the stroke is what a reader is left with.
    expect(gap.edgeStroke).not.toBe(gap.bandFill);
    expect(gap.edgeDash, 'the gap edge lost its dash under forced colors').not.toBe('none');
    expect(parseFloat(gap.edgeWidth)).toBeGreaterThan(0);
    // And the break itself is geometry, so it cannot be recoloured away.
    expect(gap.lines, 'the interior gap was drawn as one continuous line').toBe(2);
  });
});

test.describe('sk-time-series-chart published values', () => {
  test('every value is in the DOM with no pointer and no focus, and a null reads "No data"', async ({
    page,
  }) => {
    const host = await chartIn(page, 'interior-gap');
    const table = await host.evaluate((node) => {
      const rows = [...node.shadowRoot!.querySelectorAll('[part="row"]')];
      return {
        values: rows.map((row) => row.querySelector('[part="value"]')!.textContent!.trim()),
        missing: rows.filter((row) => row.getAttribute('data-no-data') === 'true').length,
        tabStops: node.shadowRoot!.querySelectorAll('[tabindex], button').length,
      };
    });

    expect(table.values).toEqual([
      '40 req/s', '55 req/s', 'No data', 'No data', '62 req/s', '58 req/s',
    ]);
    // Not blank and not zero. A blank cell says "we did not render this"; a zero says something
    // false about the world.
    expect(table.missing).toBe(2);
    // Non-selectable: the only thing that may be focusable is a scroller that genuinely overflows.
    expect(table.tabStops).toBeLessThanOrEqual(1);
  });
});

test.describe('sk-time-series-chart reduced motion', () => {
  test('the selection control has no transition under prefers-reduced-motion', async ({ page }) => {
    const transitionOf = async () => {
      const host = await chartIn(page, 'controlled-selection');
      return host.evaluate((node) => {
        const control = node.shadowRoot!.querySelector('[part="point"]')!;
        return getComputedStyle(control).transitionProperty;
      });
    };

    const normal = await transitionOf();
    expect(normal, 'the component should author a transition to suppress').not.toBe('none');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await transitionOf();
    expect(reduced, 'the reduced-motion block is inert: the transition still runs').toBe('none');
  });
});
