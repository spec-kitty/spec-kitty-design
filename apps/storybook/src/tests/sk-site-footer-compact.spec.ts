import { expect, test, type Locator, type Page } from '@playwright/test';

// THE COMPACT PRESENTATION (#354) — overflow, target size, the live narrow-stack threshold, RTL
// mirroring, and keyboard order. Idiom follows sk-app-shell-compact-navigation.spec.ts.

const story = (name: string) => `/iframe.html?id=elements-sksitefooter--${name}&viewMode=story`;

const load = async (page: Page, name: string, viewport = { width: 390, height: 400 }) => {
  await page.setViewportSize(viewport);
  await page.goto(story(name));
  const footer = page.locator('sk-site-footer').first();
  await footer.waitFor({ state: 'visible' });
  await page.evaluate(() => customElements.whenDefined('sk-site-footer'));
  await footer.evaluate(
    (element) => (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
  );
  return footer;
};

const rowOf = (footer: Locator) => footer.locator('.sk-site-footer__row');

test('[NFR-001/FR-011] CompactLongContent does not overflow at 390px under 200% zoom emulation', async ({
  page,
}) => {
  // 200% zoom simulated as a halved fixed-window CSS viewport, the same idiom
  // sk-copy-field.spec.ts's "long values remain contained" test uses.
  await load(page, 'compact-long-content', { width: 195, height: 500 });
  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});

const TARGET_SIZE_STORIES = [
  'compact',
  'compact-several-links',
  'compact-long-content',
  'compact-light-mode',
] as const;

for (const name of TARGET_SIZE_STORIES) {
  test(`[NFR-006] every compact link in ${name} meets the 44px target-size floor at 390px`, async ({
    page,
  }) => {
    const footer = await load(page, name);
    const links = footer.locator('.sk-site-footer__link--compact');
    const count = await links.count();
    expect(count, `${name}: at least one compact link to measure`).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const box = await links.nth(i).boundingBox();
      expect(box, `${name}: link ${i} has a box`).not.toBeNull();
      expect(box!.width, `${name}: link ${i} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${name}: link ${i} height`).toBeGreaterThanOrEqual(44);
    }
  });
}

// THE NARROW-STACK THRESHOLD — the sheet's EXISTING 640px figure (D-8/NFR-011), reused, not a
// newly declared breakpoint. Exact-boundary pair: 639px must stack, 641px must not.
test('the compact row stacks at 639px and does not stack at 641px, with DOM/focus order unchanged', async ({
  page,
}) => {
  const footer = await load(page, 'compact-several-links', { width: 641, height: 400 });
  const wideDisplay = await rowOf(footer).evaluate((el) => getComputedStyle(el).flexDirection);
  expect(wideDisplay, '641px must not stack').toBe('row');

  await page.setViewportSize({ width: 639, height: 400 });
  await footer.evaluate(
    (element) => (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
  );
  const narrowDisplay = await rowOf(footer).evaluate((el) => getComputedStyle(el).flexDirection);
  expect(narrowDisplay, '639px must stack').toBe('column');

  // DOM/focus order is unchanged across the transition — the stacking is CSS `flex-direction`
  // only, never a DOM reorder.
  const domOrder = await footer.evaluate((element) =>
    Array.from(element.querySelectorAll('a')).map((a) => a.textContent?.trim()),
  );
  expect(domOrder).toEqual(['Terms', 'Privacy', 'Status']);

  await page.locator('body').click();
  for (const label of domOrder) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focused, `focus order at 639px`).toBe(label);
  }
});

test('[FR-013] CompactRtl mirrors stacking/alignment via logical properties, with no fixed left/right geometry', async ({
  page,
}) => {
  const footer = await load(page, 'compact-rtl', { width: 900, height: 400 });
  const ancestorDir = await page.evaluate(() => document.querySelector('[dir="rtl"]')?.getAttribute('dir'));
  expect(ancestorDir).toBe('rtl');

  const row = rowOf(footer);
  const rowBox = (await row.boundingBox())!;
  const meta = footer.locator('.sk-site-footer__meta');
  const metaBox = (await meta.boundingBox())!;
  const link = footer.locator('.sk-site-footer__link--compact').first();
  const linkBox = (await link.boundingBox())!;

  // In RTL, the meta block (logical start) sits toward the visual RIGHT and the link (logical
  // end) toward the visual LEFT — the mirror of the LTR layout — achieved purely by `flex` +
  // `justify-content: space-between` with no physical left/right/margin declared anywhere.
  expect(metaBox.x, 'meta sits toward the visual right in RTL').toBeGreaterThan(linkBox.x);
  expect(metaBox.x + metaBox.width).toBeLessThanOrEqual(rowBox.x + rowBox.width + 1);
  expect(linkBox.x).toBeGreaterThanOrEqual(rowBox.x - 1);
});

test('keyboard: Tab visits every compact link in DOM order with a visible, unclipped indicator', async ({
  page,
}) => {
  const footer = await load(page, 'compact-several-links', { width: 900, height: 400 });
  const domOrder = await footer.evaluate((element) =>
    Array.from(element.querySelectorAll('a')).map((a) => a.textContent?.trim()),
  );
  expect(domOrder).toEqual(['Terms', 'Privacy', 'Status']);

  await page.locator('body').click();
  for (const label of domOrder) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      let clipped = false;
      for (let node: HTMLElement | null = el; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.overflow !== 'visible' && node !== el) {
          const rect = node.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) clipped = true;
        }
      }
      return {
        text: el.textContent?.trim(),
        outlineStyle: getComputedStyle(el).outlineStyle,
        clipped,
      };
    });
    expect(state, `focus reached ${label}`).not.toBeNull();
    expect(state!.text).toBe(label);
    expect(state!.outlineStyle, `${label}: focus indicator must be visible`).not.toBe('none');
    expect(state!.clipped, `${label}: focus indicator must be unclipped`).toBe(false);
  }
});
