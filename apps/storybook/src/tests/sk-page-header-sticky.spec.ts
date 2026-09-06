import { test, expect, type Page } from '@playwright/test';

/**
 * `<sk-page-header sticky>` actually sticks — in three engines, at a real viewport, over a real
 * scroll — and stops sticking at both documented thresholds.
 *
 * WHY THIS SPEC EXISTS, and why these assertions are not in the vitest lane with the rest of
 * sk-page-header's tests. Exactly the reason `sk-grid-layout.spec.ts` exists, one component over:
 *
 *   - the vitest browser lane runs at a 414px viewport, so the `@media (max-width: 720px)` block
 *     that DROPS stickiness is always active there. `position: sticky` never computes in that
 *     lane, and the axis's whole point is unobservable;
 *   - resizing to escape it is the repair that lane already rejected. `sk-grid.test.ts` records
 *     CI proving twice that WebKit does not re-evaluate a media block inside an ADOPTED
 *     CONSTRUCTED stylesheet after a viewport change — waiting on `matchMedia` and polling the
 *     computed value both failed.
 *
 * Nothing is resized here after layout: `setViewportSize` runs BEFORE `goto`, so every page is
 * laid out at its size from first paint. `nav-pill-behaviour.spec.ts` pins a mobile viewport the
 * same way.
 *
 * So sk-page-header.test.ts asserts the sheet DECLARES the geometry, and this asserts a browser
 * APPLIES it — including the assertion no sheet read can make: that a focused control below the
 * header does not end up behind it (WCAG 2.4.11).
 */

const STORY = '/iframe.html?id=elements-skpageheader--compact-sticky&viewMode=story';

/**
 * WCAG 2.4.11 runs against BOTH densities, and the second arm exists because the first one
 * pinned this whole spec to the compact story while `<sk-page-header sticky>` WITHOUT
 * `density="compact"` is a supported, documented combination — the axes are orthogonal. A
 * reviewer measured the consequence: the published 64px scroll margin against a default-density
 * header 227-533px tall, a shortfall of 163px or more with no wrapping involved, and nothing in
 * the suite exercising it. The contract is now scoped to the compact single row, and the default
 * density's remedy — the consumer setting the token from their own header — is what this second
 * arm asserts. Remove the override from that story and this arm reds.
 */
const WCAG_STORIES = [
  { label: 'compact, on the derived default token', id: 'elements-skpageheader--compact-sticky' },
  { label: 'default density, on the documented override', id: 'elements-skpageheader--default-sticky' },
] as const;

const ready = async (page: Page) => {
  await page.waitForSelector('sk-page-header');
  await page.evaluate(async () => {
    await customElements.whenDefined('sk-page-header');
    const el = document.querySelector('sk-page-header') as HTMLElement & {
      updateComplete?: Promise<unknown>;
    };
    await el.updateComplete;
  });
};

const rects = (page: Page) =>
  page.evaluate(() => {
    const header = document.querySelector('sk-page-header')!;
    const scroller = document.querySelector('[data-scroller]')!;
    const action = document.querySelector('button[slot="actions"]')!;
    const r = (node: Element) => {
      const { top, bottom, left, right, width, height } = node.getBoundingClientRect();
      return { top, bottom, left, right, width, height };
    };
    return {
      header: r(header),
      scroller: r(scroller),
      action: r(action),
      position: getComputedStyle(header).position,
      scrollTop: scroller.scrollTop,
    };
  });

test('a sticky compact header stays put over a long list, with its trailing action reachable', async ({ page }, testInfo) => {
  // The viewport IS the assertion's precondition, so it is checked rather than assumed: a config
  // change that shrank a project below 720px wide or 480px high would turn this test into a
  // silent pass over a header that correctly refuses to stick.
  const viewport = page.viewportSize();
  expect(viewport!.width, `${testInfo.project.name} must run above the 720px width threshold`)
    .toBeGreaterThan(720);
  expect(viewport!.height, `${testInfo.project.name} must run above the 480px height threshold`)
    .toBeGreaterThan(480);

  await page.goto(STORY);
  await ready(page);

  const before = await rects(page);
  expect(before.position, 'the header is not a sticky box at a desktop viewport').toBe('sticky');
  expect(Math.round(before.header.top)).toBe(Math.round(before.scroller.top));

  await page.evaluate(() => {
    document.querySelector('[data-scroller]')!.scrollTop = 600;
  });
  const after = await rects(page);

  expect(after.scrollTop, 'the fixture did not scroll — nothing below proves anything')
    .toBeGreaterThan(400);
  // THE HEADER STAYED. Compared against the scroller's own top rather than 0, so the assertion
  // survives a story frame that is not flush with the viewport.
  expect(
    Math.round(after.header.top),
    `the header scrolled away with the list (top ${after.header.top} vs scroller ${after.scroller.top})`,
  ).toBe(Math.round(after.scroller.top));
  // AND THE ACTION CAME WITH IT — visible, inside the scroller, and clickable.
  expect(after.action.width).toBeGreaterThan(0);
  expect(after.action.top).toBeGreaterThanOrEqual(after.scroller.top - 1);
  expect(after.action.bottom).toBeLessThanOrEqual(after.scroller.bottom + 1);
  await page.locator('button[slot="actions"]').click({ trial: true });
});

/**
 * THE CONFIGURATION MATTERS MORE THAN THE ASSERTION, and the first version of this test got it
 * wrong in a way that made it green over nothing.
 *
 * It scrolled to the top and focused row 30. Measured afterwards: Chromium CENTRES an element it
 * has to scroll to for focus, so the row landed at y=381 against a header bottom of 71 or 214 —
 * clear by hundreds of pixels, in every configuration, with any scroll margin including ZERO.
 * The assertion could not fail. Both the compact arm shipped in the first round and the
 * default-density arm added for the reviewer's finding passed for that reason.
 *
 * The configuration that actually produces WCAG 2.4.11's failure is the one where the browser has
 * NO REASON TO SCROLL: a row that is already inside the scroll port but sitting UNDER the sticky
 * header. Focus then either leaves it there — entirely hidden — or, if a scroll margin is set and
 * unsatisfied, forces a scroll that lifts it clear. Measured on the default-density story, header
 * bottom 214:
 *
 *     scroll-margin   0px  -> focused row top  88   ENTIRELY HIDDEN
 *     scroll-margin  64px  -> focused row top  88   ENTIRELY HIDDEN  (shorter than the header)
 *     scroll-margin 288px  -> focused row top 288   clear
 *
 * So the margin is load-bearing, and the number has to exceed the header. The target row is
 * CHOSEN AT RUNTIME rather than hard-coded, because "which row is behind the header at full
 * scroll" is a function of the header's height, the list's length and the viewport — three things
 * a literal row number silently stops tracking. If no row qualifies, the test fails rather than
 * passes: a configuration that cannot exhibit the defect cannot certify its absence.
 */
for (const { label, id } of WCAG_STORIES) {
  test(`a focused row sitting under the sticky header is lifted clear of it — ${label} (WCAG 2.4.11)`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await ready(page);

    const target = await page.evaluate(() => {
      const scroller = document.querySelector('[data-scroller]')!;
      scroller.scrollTop = scroller.scrollHeight;
      const header = document.querySelector('sk-page-header')!.getBoundingClientRect();
      const behind = [...document.querySelectorAll<HTMLAnchorElement>('[data-scroller] a[href^="#row-"]')]
        .find((row) => {
          const box = row.getBoundingClientRect();
          return box.top >= 0 && box.bottom <= header.bottom;
        });
      return {
        href: behind?.getAttribute('href') ?? null,
        headerBottom: header.bottom,
        scrolledToBottom: scroller.scrollTop > 0,
      };
    });

    expect(target.scrolledToBottom, 'the fixture did not scroll').toBe(true);
    expect(
      target.href,
      'no row is sitting under the sticky header at full scroll, so focusing one cannot ' +
        'demonstrate anything — this assertion would be green over a configuration that cannot ' +
        'exhibit the defect',
    ).not.toBe(null);

    await page.locator(`a[href="${target.href}"]`).focus();

    const geometry = await page.evaluate(() => {
      const host = document.querySelector('sk-page-header')!;
      const header = host.getBoundingClientRect();
      const focused = document.activeElement!.getBoundingClientRect();
      return {
        headerBottom: header.bottom,
        headerHeight: header.height,
        position: getComputedStyle(host).position,
        focusedTop: focused.top,
        focusedBottom: focused.bottom,
        focusedHeight: focused.height,
      };
    });

    // The header must actually BE sticky here, or the assertion below passes for the wrong
    // reason: a header that scrolled away obscures nothing.
    expect(geometry.position, 'the header is not sticky — the assertion would be vacuous')
      .toBe('sticky');
    expect(geometry.focusedHeight, 'the focused row has no box — the comparison is vacuous')
      .toBeGreaterThan(0);
    // The STRONG form — fully clear, not merely "not entirely hidden". 2.4.11 Minimum would be
    // satisfied by a partially visible row; there is no reason to ship a contract that only just
    // clears the minimum when the token that governs it is the consumer's to set.
    expect(
      geometry.focusedTop,
      `${label}: the focused row spans ${geometry.focusedTop}-${geometry.focusedBottom} against a ` +
        `header bottom edge at ${geometry.headerBottom} (header height ${geometry.headerHeight}) ` +
        '— the sticky header covers it',
    ).toBeGreaterThanOrEqual(geometry.headerBottom);
  });
}

// BOTH THRESHOLDS, each on its own, because the two live in two separate media blocks precisely
// so that one can fail without the other. A single combined condition would let a sheet that
// handled only the width pass a test that set both.
const DROPS = [
  { label: 'below the documented 720px width', size: { width: 600, height: 900 } },
  { label: 'below the documented 480px height', size: { width: 1280, height: 400 } },
] as const;

for (const { label, size } of DROPS) {
  test(`stickiness is dropped ${label}, and nothing is lost in the reflow`, async ({ page }) => {
    // BEFORE goto, so the page is laid out at this size from first paint and no re-evaluation of
    // an adopted constructed stylesheet is required — the failure mode sk-grid.test.ts records.
    await page.setViewportSize(size);
    await page.goto(STORY);
    await ready(page);

    const measured = await page.evaluate(() => {
      const header = document.querySelector('sk-page-header')!;
      const box = (sel: string) => {
        const node =
          sel.startsWith('[part')
            ? header.shadowRoot!.querySelector(sel)!
            : document.querySelector(sel)!;
        const { width, height } = node.getBoundingClientRect();
        return { width, height };
      };
      return {
        position: getComputedStyle(header).position,
        title: box('[part="title"]'),
        sync: box('[slot="sync"]'),
        action: box('button[slot="actions"]'),
        syncText: document.querySelector('[slot="sync"]')!.textContent,
      };
    });

    expect(measured.position, 'the header is still sticky past the threshold').toBe('static');
    // NOTHING IS DROPPED TO MAKE ROOM. All three regions still have a box.
    for (const [name, box] of Object.entries({
      title: measured.title,
      sync: measured.sync,
      action: measured.action,
    })) {
      expect(box.width, `${name} has no width after the reflow`).toBeGreaterThan(0);
      expect(box.height, `${name} has no height after the reflow`).toBeGreaterThan(0);
    }
    expect(measured.syncText, 'the freshness string is not rendered verbatim')
      .toBe('Updated 12 seconds ago');
    await page.locator('button[slot="actions"]').click({ trial: true });
  });
}
