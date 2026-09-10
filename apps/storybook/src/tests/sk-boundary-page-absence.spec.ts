import { expect, test, type Page } from '@playwright/test';

// spec FR-006/FR-007, research.md Decision 4. The mission's highest-risk defect pattern per
// #308's own precedent: `display: flex` with no `[open]` qualifier, missed by 602 tests
// because everything exercised the PRESENT state and nothing asserted the ABSENT one. Every
// assertion below targets the absent case directly, with computed geometry — never a
// visibility check, never a transcribed pixel literal (defect pattern #4).

const storyUrl = (story: string) => `/iframe.html?id=components-skboundarypage-html--${story}&viewMode=story`;

const openStory = async (page: Page, story: string) => {
  await page.goto(storyUrl(story));
  const card = page.locator('.sk-boundary-page__card').first();
  await card.waitFor({ state: 'visible', timeout: 20_000 });
  return card;
};

/**
 * Reads the DOM directly, in-run — never a transcribed pixel figure. `rowGap` is the
 * relevant axis: `.sk-boundary-page__card` is a single-column flex container (no wrap), so
 * `gap`'s row-gap component is what separates its stacked direct children.
 */
const measure = (page: Page) =>
  page.evaluate(() => {
    const card = document.querySelector<HTMLElement>('.sk-boundary-page__card')!;
    const actionGroup = document.querySelector<HTMLElement>('.sk-boundary-page__action-group')!;
    const footnote = document.querySelector<HTMLElement>('.sk-boundary-page__footnote');
    const mark = document.querySelector<HTMLElement>('.sk-boundary-page__mark');
    const title = document.querySelector<HTMLElement>('.sk-boundary-page__title')!;
    const cardRect = card.getBoundingClientRect();
    const actionRect = actionGroup.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const cardStyle = getComputedStyle(card);
    return {
      footnotePresent: footnote !== null,
      markPresent: mark !== null,
      actionGroupChildCount: actionGroup.childElementCount,
      distanceActionGroupBottomToCardBottom: cardRect.bottom - actionRect.bottom,
      // Mirrors distanceActionGroupBottomToCardBottom on the START edge: the first REAL child's
      // (the title's) distance from the card's top edge. Absolute, not a presence boolean and
      // not merely a with/without diff — see this file's header comment on why the diff alone is
      // not sufficient.
      distanceCardTopToTitleTop: titleRect.top - cardRect.top,
      cardPaddingBlockStart: parseFloat(cardStyle.paddingBlockStart),
      cardPaddingBlockEnd: parseFloat(cardStyle.paddingBlockEnd),
      cardRowGap: parseFloat(cardStyle.rowGap),
      footnoteHeight: footnote ? footnote.getBoundingClientRect().height : null,
      markHeight: mark ? mark.getBoundingClientRect().height : null,
    };
  });

test.describe('sk-boundary-page mark DOM-absence contract', () => {
  test('the without-mark story renders no .sk-boundary-page__mark node at all', async ({ page }) => {
    await openStory(page, 'without-mark');
    const measured = await measure(page);
    expect(measured.markPresent).toBe(false);
  });

  test('the form-card story (with mark) renders exactly one .sk-boundary-page__mark node', async ({ page }) => {
    await openStory(page, 'form-card');
    const measured = await measure(page);
    expect(measured.markPresent).toBe(true);
  });

  // MEDIUM-3 (WP01 review remediation): the two tests above are a tautology over fixtures that
  // by construction contain (or omit) a mark node — they prove nothing about GEOMETRY. The
  // reviewer proved the gap directly: a 48px phantom mark
  // (`.sk-boundary-page__card::before { content:""; display:block; block-size:48px; }`) left the
  // whole suite green, including both tests above, because neither one measures space. This test
  // is the geometry guard, mirroring the footnote pair's own ABSOLUTE assertion (not the diff
  // one — see that describe block's second test for why an absolute measurement is what actually
  // catches a phantom, while a with/without diff can be fooled by one that adds equally to both
  // fixtures compared).
  test('the without-mark story: the title sits exactly padding-block-start below the card top — no leaked mark space', async ({ page }) => {
    await openStory(page, 'without-mark');
    const measured = await measure(page);
    expect(measured.markPresent).toBe(false);
    expect(measured.cardPaddingBlockStart).toBeGreaterThan(0);
    expect(Math.abs(measured.distanceCardTopToTitleTop - measured.cardPaddingBlockStart)).toBeLessThan(1.5);
  });

  test('the form-card story (with mark): the title sits strictly further from the card top than padding-block-start alone', async ({ page }) => {
    await openStory(page, 'form-card');
    const measured = await measure(page);
    expect(measured.markPresent).toBe(true);
    expect(measured.markHeight).not.toBeNull();
    // Absolute character preserved here too: the mark's own height plus the gap step is
    // consumed on top of the padding, not merely "greater than zero".
    const expectedMinimum = measured.cardPaddingBlockStart + (measured.markHeight as number) + measured.cardRowGap;
    expect(Math.abs(measured.distanceCardTopToTitleTop - expectedMinimum)).toBeLessThan(1.5);
  });
});

test.describe('sk-boundary-page footnote DOM-absence contract', () => {
  test('the without-footnote story renders no .sk-boundary-page__footnote node, and the action-group sits exactly padding-block-end above the card edge', async ({ page }) => {
    await openStory(page, 'without-footnote');
    const measured = await measure(page);
    expect(measured.footnotePresent).toBe(false);
    expect(measured.cardPaddingBlockEnd).toBeGreaterThan(0);
    expect(Math.abs(measured.distanceActionGroupBottomToCardBottom - measured.cardPaddingBlockEnd)).toBeLessThan(1.5);
  });

  test('the with-footnote story measures a strictly larger action-group-to-card-bottom distance, by at least the footnote height plus one gap step', async ({ page }) => {
    await openStory(page, 'without-footnote');
    const without = await measure(page);
    await openStory(page, 'with-footnote');
    const withFootnote = await measure(page);

    expect(withFootnote.footnotePresent).toBe(true);
    expect(withFootnote.footnoteHeight).not.toBeNull();
    expect(withFootnote.cardRowGap).toBeGreaterThan(0);

    const difference = withFootnote.distanceActionGroupBottomToCardBottom - without.distanceActionGroupBottomToCardBottom;
    const expectedMinimum = (withFootnote.footnoteHeight as number) + withFootnote.cardRowGap;

    expect(difference).toBeGreaterThan(0);
    // Exact under this component's own single-gap-step flex-column geometry (see this file's
    // header comment): difference === rowGap + footnote content height. A small tolerance
    // absorbs subpixel font-metrics rounding across engines, never a transcribed literal.
    expect(Math.abs(difference - expectedMinimum)).toBeLessThan(1.5);
  });
});

test.describe('sk-boundary-page action-group present-but-empty contract (distinct from mark/footnote DOM-absence)', () => {
  test('the no-action story keeps the action-group container present with zero children', async ({ page }) => {
    await openStory(page, 'no-action');
    const measured = await measure(page);
    expect(measured.actionGroupChildCount).toBe(0);
    // The container itself is never omitted — contrast with markPresent/footnotePresent above,
    // which are `false` because the ELEMENT does not exist. Here the element exists and is
    // simply empty; asserting on the live locator (not just the measure() payload) proves the
    // node itself is really there, not merely absent-but-truthy from a stale reference.
    await expect(page.locator('.sk-boundary-page__action-group')).toHaveCount(1);
  });

  // HIGH-C (pre-merge squad finding): the two assertions above are node counts — they prove the
  // container EXISTS, not that it still occupies its own place in the layout. `.sk-boundary-page
  // __action-group:empty { display: none }` leaves BOTH of them green (childElementCount and
  // locator count are unaffected by `display`) while the container drops out of flex layout
  // entirely — no longer a flex item, no gap allocated for it, and (per the CSS spec)
  // `getBoundingClientRect()` on it collapses to an all-zero rect. `measure()` already computes
  // `distanceActionGroupBottomToCardBottom` (line 38); this uses that SAME field, geometrically,
  // rather than a node count: with the action-group genuinely present and participating in
  // layout, its bottom edge sits exactly `padding-block-end` above the card's own bottom edge,
  // the identical relationship the without-footnote/without-mark tests above assert for their
  // own last-real-child. Verified directly (not assumed) that the `:empty { display: none }`
  // mutation breaks this: the action-group's rect degenerates to (0,0,0,0) once it stops
  // participating in layout, which drives this measured distance from ~0 to several hundred
  // pixels — see this file's mutation-revert exercise (reported in the mission handoff, matching
  // the same manual-proof convention already used for the mark's own MEDIUM-3 remediation
  // above, not re-run automatically on every CI pass).
  test('the no-action story: the present-but-empty action-group still sits in normal flow, exactly padding-block-end above the card bottom', async ({ page }) => {
    await openStory(page, 'no-action');
    const measured = await measure(page);
    expect(measured.actionGroupChildCount).toBe(0);
    expect(measured.cardPaddingBlockEnd).toBeGreaterThan(0);
    expect(Math.abs(measured.distanceActionGroupBottomToCardBottom - measured.cardPaddingBlockEnd)).toBeLessThan(1.5);
  });

  test('the several-actions story renders more than one direct child in the action-group', async ({ page }) => {
    await openStory(page, 'several-actions');
    const measured = await measure(page);
    expect(measured.actionGroupChildCount).toBeGreaterThan(1);
  });
});
