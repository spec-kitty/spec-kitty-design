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

test('a focused row far down the list is never left behind the sticky header (WCAG 2.4.11)', async ({ page }) => {
  await page.goto(STORY);
  await ready(page);

  // The rows carry `scroll-margin-block-start: var(--sk-layout-page-header-sticky-scroll-margin)`
  // — the documented contract this element publishes so consumers do not guess an offset. Focus
  // scrolls the row into view; without that margin the browser stops with the row flush against
  // the top of the scroll port, which is behind the header.
  const link = page.locator('a[href="#row-30"]');
  await link.focus();

  const geometry = await page.evaluate(() => {
    const header = document.querySelector('sk-page-header')!.getBoundingClientRect();
    const focused = document.activeElement!.getBoundingClientRect();
    return { headerBottom: header.bottom, focusedTop: focused.top, focusedHeight: focused.height };
  });

  expect(geometry.focusedHeight, 'the focused row has no box — the comparison is vacuous')
    .toBeGreaterThan(0);
  expect(
    geometry.focusedTop,
    `the focused row starts at ${geometry.focusedTop}, above the header's bottom edge at ` +
      `${geometry.headerBottom} — it is obscured by the sticky header`,
  ).toBeGreaterThanOrEqual(geometry.headerBottom);
});

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
