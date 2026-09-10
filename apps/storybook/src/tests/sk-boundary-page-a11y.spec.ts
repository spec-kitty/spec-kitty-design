import { expect, test, type Page } from '@playwright/test';

// spec SC-004 and US1 AS3. MEDIUM-4 (WP01 review remediation): grepping both new spec files for
// h1|heading|landmark|tabindex|focus|skip previously returned nothing — SC-004 (exactly one
// <h1>, correct heading order, focus order matching visual order, a working skip target, zero
// extra tab stops) and US1 AS3 (no additional landmark introduced) had no coverage at all.
// Separately, every exemplar opened `<main>` with no `id`, so the `href="#main"` skip-target
// convention the CSS header comment cites as precedent (`sk-skip-link`'s own exemplar) could not
// resolve; every exemplar now carries `id="main"` on its own `<main>` (part of this fix).
//
// FR-003 is binding throughout: the consumer keeps its own landmarks and `<h1>` — this file
// tests that the FRAME introduces none of its own, not that the frame owns or manufactures them.

const storyUrl = (story: string) => `/iframe.html?id=components-skboundarypage-html--${story}&viewMode=story`;

const openStory = async (page: Page, story: string) => {
  await page.goto(storyUrl(story));
  const card = page.locator('.sk-boundary-page__card').first();
  await card.waitFor({ state: 'visible', timeout: 20_000 });
  return card;
};

const ALL_STORIES = [
  'form-card',
  'terminal-card',
  'without-mark',
  'without-footnote',
  'with-footnote',
  'several-actions',
  'no-action',
  'long-identifier',
  'long-email',
  'forced-colors',
  'light-mode',
] as const;

test.describe('sk-boundary-page heading/landmark contract (spec SC-004, US1 AS3)', () => {
  for (const story of ALL_STORIES) {
    test(`the ${story} story renders exactly one <h1> and no other heading level`, async ({ page }) => {
      await openStory(page, story);
      const headingCounts = await page.evaluate(() => {
        // Scoped to #storybook-root, not `document` — Storybook's own iframe.html ships a
        // permanently-present (display:none, but still in the DOM) loading/no-preview skeleton
        // with its OWN <h1>s ("No Preview", an empty #error-message) outside the story root.
        // querySelectorAll does not care about visibility, so an unscoped query over `document`
        // silently counts those too — this is exactly why this test failed red against the
        // frame's OWN correct markup on first write (received 3, not 1) until scoped here.
        const root = document.getElementById('storybook-root')!;
        const levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
        return Object.fromEntries(levels.map((tag) => [tag, root.querySelectorAll(tag).length]));
      });
      expect(headingCounts.h1).toBe(1);
      for (const level of ['h2', 'h3', 'h4', 'h5', 'h6'] as const) {
        expect(headingCounts[level], `${level} count`).toBe(0);
      }
    });

    test(`the ${story} story introduces no landmark beyond the consumer's own <main>`, async ({ page }) => {
      await openStory(page, story);
      const result = await page.evaluate(() => {
        // Scoped to #storybook-root — see the h1 test above for why an unscoped query is unsafe
        // on this page.
        const root = document.getElementById('storybook-root')!;
        const mains = root.querySelectorAll('main').length;
        // Every part this frame itself owns (a mix of <div> and <p>, per the anatomy table in
        // data-model.md — footnote is a <p>) must carry no landmark TAG and no landmark ROLE.
        const landmarkTags = new Set(['main', 'nav', 'header', 'footer', 'aside', 'form', 'section']);
        const landmarkRoles = new Set([
          'main', 'navigation', 'banner', 'contentinfo', 'complementary', 'region', 'form', 'search',
        ]);
        const frameParts = [
          '.sk-boundary-page__stage',
          '.sk-boundary-page__card',
          '.sk-boundary-page__mark',
          '.sk-boundary-page__action-group',
          '.sk-boundary-page__footnote',
        ];
        const frameIntroducesLandmark = frameParts.some((selector) => {
          const el = root.querySelector(selector);
          if (!el) return false;
          const role = el.getAttribute('role');
          return landmarkTags.has(el.tagName.toLowerCase()) || (role !== null && landmarkRoles.has(role));
        });
        // No OTHER landmark-tagged element exists anywhere in the story (nav/header/footer/
        // aside) — the frame owns none of these and none should have been introduced.
        const otherLandmarkTags = root.querySelectorAll('nav, header, footer, aside').length;
        return { mains, frameIntroducesLandmark, otherLandmarkTags };
      });
      expect(result.mains).toBe(1);
      expect(result.frameIntroducesLandmark).toBe(false);
      expect(result.otherLandmarkTags).toBe(0);
    });

    test(`the ${story} story's skip target (#main) is satisfiable and a real fragment navigation to it resolves`, async ({ page }) => {
      await openStory(page, story);
      const before = await page.evaluate(() => ({
        mainCount: document.querySelectorAll('[id="main"]').length,
        idIsMain: document.getElementById('main') === document.querySelector('main'),
      }));
      expect(before.mainCount).toBe(1);
      expect(before.idIsMain).toBe(true);

      // A real, working skip target — not merely an id existing. Inject a skip link the same
      // way a consumer composing sk-skip-link would (this frame does not own or ship one itself,
      // per FR-003/C-003), click it, and confirm the browser's own fragment-navigation actually
      // resolved to the frame's <main>, not a no-op or a dangling reference.
      await page.evaluate(() => {
        const link = document.createElement('a');
        link.href = '#main';
        link.textContent = 'Skip to main content';
        link.id = 'probe-skip-link';
        document.body.prepend(link);
      });
      await page.locator('#probe-skip-link').click();
      const after = await page.evaluate(() => ({
        hash: location.hash,
        targetExists: document.getElementById(location.hash.slice(1)) === document.querySelector('main'),
      }));
      expect(after.hash).toBe('#main');
      expect(after.targetExists).toBe(true);
    });
  }
});

/**
 * Reads the DOM's own focusable-element order (a[href], button, input, select, textarea, not
 * disabled) — this is also the VISUAL order for every story, because nothing in this frame's CSS
 * reorders content (no `order`, no `position: absolute` pulling an element out of flow, no
 * negative `tabindex`; sk-boundary-page-responsive.spec.ts's own logical-properties test already
 * proves no physical-property tricks exist). Comparing this list's length AND per-step identity
 * against a real Tab-key walk proves both "focus order matches visual order" and "no extra tab
 * stops" at once: an extra stop would land the Nth press on the wrong element (never reaching the
 * real Nth item on schedule), and a missing one would do the same in the other direction.
 */
const focusableSignature = (page: Page) =>
  page.evaluate(() => {
    // Scoped to #storybook-root — Storybook's iframe.html also ships a permanently-present
    // (display:none) docs-skeleton with its OWN buttons/links outside the story root; an
    // unscoped query pulled those in as "expected" focusable elements even though `display:none`
    // makes them untabbable, which is exactly why the real Tab walk below landed on nothing
    // (`document.activeElement` stayed `<body>`) against an `expected` list padded with content
    // that was never actually reachable.
    const root = document.getElementById('storybook-root')!;
    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea'),
    ).filter((el) => !el.hasAttribute('disabled'));
    const sig = (el: HTMLElement) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'a') return `a[href=${el.getAttribute('href')}]`;
      if (tag === 'button') return `button:${el.textContent?.trim()}`;
      return `${tag}#${el.id}`;
    };
    return nodes.map(sig);
  });

test.describe('sk-boundary-page focus order matches visual order, with no extra tab stops (spec SC-004)', () => {
  // MEDIUM/HIGH-B (pre-merge squad finding): 'no-action' was previously in this same loop.
  // sk-boundary-page-no-action.html has ZERO a[href]/button/input/select/textarea, so
  // `expected` was `[]`, the `for (let i = 0; i < expected.length; i++)` body ran zero times,
  // and `expect([]).toEqual([])` passed green while asserting nothing — a green line over a
  // zero-input set, in every browser project. 'no-action' has no Tab order to compare against
  // a visual order in the first place (there is nothing to walk), so it is the wrong fixture
  // for THIS test; it gets its own assertion below instead, of the thing that is actually true
  // about it — zero tab stops — rather than being iterated as if it had an order.
  for (const story of ['form-card', 'several-actions'] as const) {
    test(`the ${story} story's Tab order exactly matches its DOM/visual order`, async ({ page }) => {
      await openStory(page, story);
      const expected = await focusableSignature(page);
      // Non-empty floor (matches sk-boundary-page-responsive.spec.ts:50's pattern): without
      // this, a fixture that silently lost its focusable elements would make the loop below a
      // vacuous, always-green no-op again, exactly like the 'no-action' defect this comment
      // describes.
      expect(expected.length).toBeGreaterThan(0);

      // Start from a known, unfocused state.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

      const actual: string[] = [];
      for (let i = 0; i < expected.length; i++) {
        await page.keyboard.press('Tab');
        const sig = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el) return null;
          const tag = el.tagName.toLowerCase();
          if (tag === 'a') return `a[href=${el.getAttribute('href')}]`;
          if (tag === 'button') return `button:${el.textContent?.trim()}`;
          return `${tag}#${el.id}`;
        });
        actual.push(sig ?? '<none>');
      }

      expect(actual).toEqual(expected);
    });
  }

  test('the no-action story has zero focusable elements and Tab does not enter the card', async ({ page }) => {
    await openStory(page, 'no-action');
    const expected = await focusableSignature(page);
    // The real assertion for this fixture: it has NO tab stops at all (asserted positively,
    // not inferred from an empty loop never running).
    expect(expected).toEqual([]);

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Tab');
    const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase() ?? null);
    // With nothing focusable in the story, a real Tab press must leave focus on <body> (or
    // nowhere) — it must NOT land on anything inside the card.
    expect(activeTag === 'body' || activeTag === null).toBe(true);
  });
});
