import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// spec FR-009 through FR-013. Narrow width / 200%-zoom containment, RTL mirroring via logical
// properties alone, forced-colors edge visibility, target size, and the reduced-motion
// "no motion introduced" claim — asserted, not assumed (spec FR-012).

const CSS_PATH = 'packages/styles/src/boundary-page/sk-boundary-page.css';

// Every source-level regex assertion below reads RULE text only, comments stripped —
// this file's own header comment discusses `left`/`right`/`transition`/`::part()` etc. in
// PROSE (explaining what the CSS deliberately does NOT do), and a bare match over the raw
// file text would flag its own explanation rather than an actual declaration.
const readCssRules = () => readFileSync(CSS_PATH, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const storyUrl = (story: string) => `/iframe.html?id=components-skboundarypage-html--${story}&viewMode=story`;

const openStory = async (page: Page, story: string) => {
  await page.goto(storyUrl(story));
  const card = page.locator('.sk-boundary-page__card').first();
  await card.waitFor({ state: 'visible', timeout: 20_000 });
  return card;
};

const pageOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('sk-boundary-page long-content containment (spec FR-008)', () => {
  for (const story of ['long-identifier', 'long-email'] as const) {
    // Narrow, physical 320px, and a fixed-window 200%-zoom simulation (a 1280px desktop
    // baseline halved to a 640px CSS viewport — the same technique sk-copy-field.spec.ts's
    // 400%-zoom test uses), plus the plain default desktop width.
    for (const width of [320, 640, 1280]) {
      test(`${story} produces zero document-level horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 720 });
        await openStory(page, story);
        expect(await pageOverflow(page)).toBeLessThanOrEqual(0);
      });
    }
  }
});

test.describe('sk-boundary-page action-group target size (spec FR-013)', () => {
  for (const width of [320, 1280]) {
    test(`every interactive target in the action-group measures at least 44px at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await openStory(page, 'several-actions');
      const targets = page.locator('.sk-boundary-page__action-group > *');
      const count = await targets.count();
      expect(count).toBeGreaterThan(1);
      for (let i = 0; i < count; i++) {
        const box = await targets.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height, `target ${i} at ${width}px`).toBeGreaterThanOrEqual(44);
      }
    });
  }
});

test.describe('sk-boundary-page forced-colors (spec FR-011)', () => {
  test('the card gains a non-zero border under forced-colors, the FIRST and only place this file declares that edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await openStory(page, 'forced-colors');
    const borderWidth = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>('.sk-boundary-page__card')!;
      return parseFloat(getComputedStyle(card).borderTopWidth);
    });
    expect(borderWidth).toBeGreaterThan(0);
  });

  test('the default (non-forced-colors) card renders zero border width, proving the forced-colors block is load-bearing rather than a redundant restatement', async ({ page }) => {
    await openStory(page, 'forced-colors');
    const borderWidth = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>('.sk-boundary-page__card')!;
      return parseFloat(getComputedStyle(card).borderTopWidth);
    });
    expect(borderWidth).toBe(0);
  });
});

test.describe('sk-boundary-page reduced motion (spec FR-012) — asserted, not assumed', () => {
  test('no anatomy part carries a transition or animation property, under reduced-motion emulation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, 'form-card');
    const motion = await page.evaluate(() => {
      const selectors = [
        '.sk-boundary-page__stage',
        '.sk-boundary-page__card',
        '.sk-boundary-page__mark',
        '.sk-boundary-page__title',
        '.sk-boundary-page__body',
        '.sk-boundary-page__action-group',
        '.sk-boundary-page__footnote',
      ];
      return selectors.map((selector) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!el) return { selector, present: false, transition: null, animation: null };
        const style = getComputedStyle(el);
        // `transition-property`'s CSS-spec INITIAL value is `all` (not `none`) — every
        // element without a single `transition` declaration anywhere still computes `all`
        // there, so `transitionProperty` cannot prove absence by itself. `transitionDuration`
        // is what actually governs whether anything visibly animates: its initial value is
        // `0s`, and nothing in this file sets a duration, so THAT is the property this test
        // reads. `animation-name`'s initial value genuinely is `none`, so that one still
        // proves absence directly.
        return {
          selector,
          present: true,
          transitionDuration: style.transitionDuration,
          animation: style.animationName,
        };
      });
    });
    for (const part of motion) {
      if (!part.present) continue; // .sk-boundary-page__footnote is absent on some stories by design
      expect(part.transitionDuration, `${part.selector} transitionDuration`).toBe('0s');
      expect(part.animation, `${part.selector} animationName`).toBe('none');
    }
  });

  test('no anatomy part carries a transition or animation property, WITHOUT reduced-motion emulation either — the claim is unconditional, not a fallback', async ({ page }) => {
    await openStory(page, 'form-card');
    const motion = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>('.sk-boundary-page__card')!;
      const style = getComputedStyle(card);
      return { transitionDuration: style.transitionDuration, animation: style.animationName };
    });
    expect(motion.transitionDuration).toBe('0s');
    expect(motion.animation).toBe('none');
  });

  test('the source CSS declares no @media (prefers-reduced-motion: reduce) block, because it sets no transition/animation anywhere to guard — a dead guard is the defect this repo has already named (sk-transition-matrix.css:237), not a safety margin', () => {
    const css = readCssRules();
    expect(css).not.toMatch(/transition\s*:/);
    expect(css).not.toMatch(/animation(-name)?\s*:/);
    expect(css).not.toMatch(/prefers-reduced-motion/);
  });
});

test.describe('sk-boundary-page logical properties only (spec FR-010)', () => {
  test('the source CSS declares no physical left/right/top/bottom/width/height property', () => {
    const css = readCssRules();
    expect(css).not.toMatch(/(?<![-a-z])(left|right|top|bottom)\s*:/i);
    expect(css).not.toMatch(/(?<![-a-z])width\s*:/i);
    expect(css).not.toMatch(/(?<![-a-z])height\s*:/i);
  });

  test('the source CSS never writes a `::part()` selector reaching sk-entity-marker or sk-pill-tag (spec C-005)', () => {
    const css = readCssRules();
    expect(css).not.toMatch(/::part\(/);
  });

  test('the several-actions action-group order mirrors under dir="rtl" using logical properties alone, with no dir-specific CSS override needed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // LOW-6 (WP01 review remediation): this test's title has always advertised
    // "several-actions" — it previously opened 'form-card' (2 actions) instead, and its
    // `count === 2` assertion happened to pass against the WRONG fixture without anyone
    // noticing the title/body mismatch. Now opens the four-action fixture the title names.
    await openStory(page, 'several-actions');

    const order = async () =>
      page.evaluate(() => {
        const children = Array.from(document.querySelectorAll<HTMLElement>('.sk-boundary-page__action-group > *'));
        const rects = children.map((el) => el.getBoundingClientRect());
        return { firstLeft: rects[0].left, lastLeft: rects[rects.length - 1].left, count: rects.length };
      });

    const ltr = await order();
    expect(ltr.count).toBe(4);
    expect(ltr.firstLeft).toBeLessThan(ltr.lastLeft);

    await page.evaluate(() => {
      document.querySelector('.sk-boundary-page__stage')!.setAttribute('dir', 'rtl');
    });
    const rtl = await order();
    expect(rtl.firstLeft).toBeGreaterThan(rtl.lastLeft);
  });
});
