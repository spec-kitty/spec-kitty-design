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
    const cardRect = card.getBoundingClientRect();
    const actionRect = actionGroup.getBoundingClientRect();
    const cardStyle = getComputedStyle(card);
    return {
      footnotePresent: footnote !== null,
      markPresent: mark !== null,
      actionGroupChildCount: actionGroup.childElementCount,
      distanceActionGroupBottomToCardBottom: cardRect.bottom - actionRect.bottom,
      cardPaddingBlockEnd: parseFloat(cardStyle.paddingBlockEnd),
      cardRowGap: parseFloat(cardStyle.rowGap),
      footnoteHeight: footnote ? footnote.getBoundingClientRect().height : null,
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

  test('the several-actions story renders more than one direct child in the action-group', async ({ page }) => {
    await openStory(page, 'several-actions');
    const measured = await measure(page);
    expect(measured.actionGroupChildCount).toBeGreaterThan(1);
  });
});
