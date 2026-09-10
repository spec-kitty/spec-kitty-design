import { expect, test } from '@playwright/test';

// FORCED COLORS (#354, NFR-003/NFR-006). Idiom: sk-copy-field-forced-colors.spec.ts /
// sk-notice-forced-colors.spec.ts. The compact presentation authors no forced-colors CSS of its
// own — this pins that the pre-existing `.sk-site-footer { border-top }` survives untouched, and
// that the compact links keep a visible, unclipped focus outline under forced-colors.

test('forced colors preserves the compact footer boundary and a visible, unclipped link focus outline', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/iframe.html?id=elements-sksitefooter--compact-several-links&viewMode=story');
  const footer = page.locator('sk-site-footer').first();
  await footer.waitFor({ state: 'visible' });

  // `border-top` is on the SHADOW `<footer part="footer">`, not the host element — the host
  // itself carries no border.
  const border = await footer.evaluate(
    (element) => getComputedStyle(element.shadowRoot!.querySelector('[part="footer"]')!).borderTopStyle,
  );
  expect(border, 'the footer top boundary must remain visible').not.toBe('none');

  const links = footer.locator('.sk-site-footer__link--compact');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const link = links.nth(i);
    await link.focus();
    await expect(link).toBeFocused();
    const state = await link.evaluate((element) => {
      let clipped = false;
      for (let node: HTMLElement | null = element; node; node = node.parentElement) {
        if (node === element) continue;
        const style = getComputedStyle(node);
        if (style.overflow !== 'visible') {
          const rect = node.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) clipped = true;
        }
      }
      return { outlineStyle: getComputedStyle(element).outlineStyle, clipped };
    });
    expect(state.outlineStyle, `link ${i}: focus outline must be visible`).not.toBe('none');
    expect(state.clipped, `link ${i}: focus outline must be unclipped`).toBe(false);
  }
});
