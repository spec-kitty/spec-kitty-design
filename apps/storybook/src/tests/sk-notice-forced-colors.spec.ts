import { expect, test, type Page } from '@playwright/test';

/**
 * IS THE FORCED-COLORS BLOCK LOAD-BEARING, OR MERELY PRESENT?
 *
 * #178 requires that a notice's tone survive `forced-colors: active`. A sibling mission shipped a
 * forced-colors block that satisfied review and did nothing, so this file measures rather than
 * asserts the block exists.
 *
 * The trap it is written against: `border-*-color` is remapped to a system colour by the
 * forced-colors algorithm with ZERO author CSS. A test that only compared the border COLOUR
 * across the two modes would therefore pass with `sk-notice.css`'s entire `@media
 * (forced-colors: active)` block deleted — it would be measuring the browser, not the
 * stylesheet. `transparent` is no escape either: it maps to `CanvasText` like any other border
 * colour rather than staying invisible.
 *
 * What the stylesheet contributes that no remap supplies is the WIDTH step — the tone edge
 * doubles — so that is what is measured here, against the same element in normal mode.
 */

const noticeIn = async (page: Page, storyId: string) => {
  await page.goto(`/iframe.html?id=elements-sknotice--${storyId}&viewMode=story`);
  const host = page.locator('sk-notice').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  return host;
};

const edgeWidth = (page: Page, storyId: string) =>
  noticeIn(page, storyId).then((host) =>
    host.evaluate((node) => {
      const part = node.shadowRoot!.querySelector('[part="notice"]')!;
      const style = getComputedStyle(part);
      return {
        width: style.borderInlineStartWidth,
        color: style.borderInlineStartColor,
        background: style.backgroundColor,
      };
    }),
  );

test.describe('sk-notice forced colors', () => {
  test('the tone edge is genuinely widened by the stylesheet, not merely recoloured by the engine', async ({
    page,
  }) => {
    const normal = await edgeWidth(page, 'forced-colors');

    await page.emulateMedia({ forcedColors: 'active' });
    const forced = await edgeWidth(page, 'forced-colors');

    // THE LOAD-BEARING ASSERTION. Width is not a property the forced-colors algorithm touches,
    // so a difference here can only have come from the authored `@media (forced-colors: active)`
    // block. Delete that block and this line reds; delete only its `border-inline-start-color`
    // declaration and this line still passes, correctly, because the colour was never what made
    // the block do work.
    expect(
      parseFloat(forced.width),
      'the forced-colors block is inert: the tone edge is the same width in both modes',
    ).toBeGreaterThan(parseFloat(normal.width));

    // The edge is still painted with something, and it is not the flattened ground.
    expect(forced.color).not.toBe('');
    expect(forced.color).not.toBe(forced.background);
  });

  test('the dismiss control keeps a visible focus ring, drawn with outline rather than box-shadow', async ({
    page,
  }) => {
    // `box-shadow` computes away entirely under forced colors, so a ring built from it would
    // disappear exactly where a visible ring matters most. `outline` is preserved and remapped.
    await page.emulateMedia({ forcedColors: 'active' });
    const host = await noticeIn(page, 'forced-colors');
    const ring = await host.evaluate(async (node) => {
      const button = node.shadowRoot!.querySelector('[part="dismiss"]') as HTMLElement | null;
      // The dismissible sample is the last notice in the story, not the first.
      const all = [...document.querySelectorAll('sk-notice')];
      const withButton = all
        .map((n) => n.shadowRoot!.querySelector('[part="dismiss"]') as HTMLElement | null)
        .find((b) => b !== null);
      const target = button ?? withButton;
      if (!target) return null;
      target.focus();
      const style = getComputedStyle(target);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });

    expect(ring, 'the forced-colors story renders no dismissible notice').not.toBe(null);
    expect(ring!.outlineStyle).not.toBe('none');
    expect(parseFloat(ring!.outlineWidth)).toBeGreaterThan(0);
    // Recorded rather than merely avoided: this is what "box-shadow computes away" looks like,
    // and it is why the ring is not built from one.
    expect(ring!.boxShadow).toBe('none');
  });
});
