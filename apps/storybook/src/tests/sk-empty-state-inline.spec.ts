import { expect, test, type Page } from '@playwright/test';

const storyUrl = (story: 'inline' | 'inline-long-narrow' | 'inline-preferences' | 'inline-light-mode') =>
  `/iframe.html?id=primitives-skemptystate-html--${story}&viewMode=story`;

const openInline = async (page: Page, story: Parameters<typeof storyUrl>[0]) => {
  await page.goto(storyUrl(story));
  const message = page.locator('.sk-empty-state--inline').first();
  await message.waitFor({ state: 'visible', timeout: 20_000 });
  return message;
};

const measureAt = async (page: Page, width: number) =>
  page.evaluate((inlineSize) => {
    const message = document.querySelector<HTMLElement>('.sk-empty-state--inline')!;
    const frame = message.closest<HTMLElement>('[data-inline-empty-frame]') ?? message.parentElement!;
    frame.style.inlineSize = `${inlineSize}px`;
    frame.style.maxInlineSize = `${inlineSize}px`;
    const style = getComputedStyle(message);
    const rect = message.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(message);
    const textRect = range.getBoundingClientRect();
    return {
      text: message.textContent,
      descendants: message.childElementCount,
      role: message.getAttribute('role'),
      live: message.getAttribute('aria-live'),
      atomic: message.getAttribute('aria-atomic'),
      headings: message.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
      actions: message.querySelectorAll('a,button,input,select,textarea').length,
      frameOverflow: frame.scrollWidth - frame.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      messageOverflow: message.scrollWidth - message.clientWidth,
      overflowX: style.overflowX,
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      lineBoxes: [...range.getClientRects()].filter((box) => box.width > 0 && box.height > 0).length,
      messageHeight: rect.height,
      textInside:
        textRect.left >= rect.left - 1 &&
        textRect.right <= rect.right + 1 &&
        textRect.top >= rect.top - 1 &&
        textRect.bottom <= rect.bottom + 1,
      color: style.color,
      background: getComputedStyle(document.body).backgroundColor,
    };
  }, width);

test.describe('native inline empty state', () => {
  test('short supplied copy stays passive and unclipped at every required lane width', async ({ page }) => {
    const message = await openInline(page, 'inline');
    await expect(message).toHaveText('Nothing here');

    for (const width of [220, 288, 360]) {
      const measured = await measureAt(page, width);
      expect(measured.text).toBe('Nothing here');
      expect(measured.role).toBe(null);
      expect(measured.live).toBe(null);
      expect(measured.atomic).toBe(null);
      expect(measured.headings).toBe(0);
      expect(measured.actions).toBe(0);
      expect(measured.frameOverflow, `${width}px frame overflow`).toBeLessThanOrEqual(0);
      expect(measured.pageOverflow, `${width}px page overflow`).toBeLessThanOrEqual(0);
      expect(measured.messageOverflow, `${width}px message overflow`).toBeLessThanOrEqual(0);
      expect(measured.overflowX).not.toMatch(/hidden|clip/);
      expect(measured.whiteSpace).not.toBe('nowrap');
      expect(measured.textOverflow).not.toBe('ellipsis');
      expect(measured.textInside).toBe(true);
    }
  });

  test('long supplied copy wraps completely in dark and light presentation', async ({ page }) => {
    const expected =
      'No Work Packages match the current consumer-supplied filters, so broaden them to review the complete lane.';
    for (const story of ['inline-long-narrow', 'inline-light-mode'] as const) {
      const message = await openInline(page, story);
      await expect(message).toHaveText(expected);
      for (const width of [220, 288, 360]) {
        const measured = await measureAt(page, width);
        expect(measured.text).toBe(expected);
        expect(measured.lineBoxes, `${story} ${width}px should wrap to more than one line`)
          .toBeGreaterThan(1);
        expect(measured.frameOverflow, `${story} ${width}px frame overflow`).toBeLessThanOrEqual(0);
        expect(measured.pageOverflow, `${story} ${width}px page overflow`).toBeLessThanOrEqual(0);
        expect(measured.textInside).toBe(true);
        expect(measured.color).not.toBe(measured.background);
      }
    }
  });

  test('forced colors keeps supplied copy paintable without adding semantics', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await openInline(page, 'inline-preferences');
    for (const width of [220, 288, 360]) {
      const measured = await measureAt(page, width);
      expect(measured.text?.trim().length).toBeGreaterThan(0);
      expect(measured.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(measured.role).toBe(null);
      expect(measured.live).toBe(null);
      expect(measured.frameOverflow).toBeLessThanOrEqual(0);
      expect(measured.pageOverflow).toBeLessThanOrEqual(0);
    }
  });

  test('empty consumer content remains empty and synthesizes no fallback', async ({ page }) => {
    const message = await openInline(page, 'inline');
    const empty = await message.evaluate((node) => {
      node.replaceChildren();
      const before = getComputedStyle(node, '::before').content;
      const after = getComputedStyle(node, '::after').content;
      return {
        text: node.textContent,
        children: node.childElementCount,
        role: node.getAttribute('role'),
        live: node.getAttribute('aria-live'),
        pseudo: [before, after],
      };
    });
    expect(empty).toEqual({
      text: '',
      children: 0,
      role: null,
      live: null,
      pseudo: expect.arrayContaining([expect.stringMatching(/^(none|normal)$/)]),
    });
    expect(empty.pseudo.every((value) => /^(none|normal)$/.test(value))).toBe(true);
  });
});
