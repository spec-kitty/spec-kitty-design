import { expect, test, type Page } from '@playwright/test';

// spec US3/FR-005. Review finding (this mission's WP01 rejection): FR-005 previously had only a
// NEGATIVE assertion — that the frame's own CSS sets no tone (sk-boundary-page-responsive.spec.ts's
// "no ::part()" test, spec C-005/SC-010) — and nothing ever asserted the POSITIVE half: that a
// composed status pill's RENDERED tone is actually the one the exemplar authored. That gap is
// exactly what let three exemplars ship the inert `<sk-pill-tag class="sk-pill-tag--status-*">`
// host-class form — `status` is a PROPERTY on the custom element and `pillTagClasses()` puts the
// modifier on the SHADOW `<span part="tag">`, so a class on the light-DOM host never reaches it —
// with all tests green. The fix uses the styles-layer span form
// (`<span class="sk-pill-tag sk-pill-tag--status-<tone>">`), and every assertion below reads the
// RENDERED computed style, in the tree that form actually occupies (light DOM — there is no
// shadow root involved once the composed element is a plain span), never a light-DOM attribute.

const storyUrl = (story: string) => `/iframe.html?id=components-skboundarypage-html--${story}&viewMode=story`;

const openStory = async (page: Page, story: string) => {
  await page.goto(storyUrl(story));
  const card = page.locator('.sk-boundary-page__card').first();
  await card.waitFor({ state: 'visible', timeout: 20_000 });
  return card;
};

/**
 * Reads the pill's OWN rendered background/color, an untoned reference pill's rendered
 * background/color (same document, `.sk-pill-tag` with no status modifier), and an isolated
 * reference pill carrying only the SAME status class (detached from the page's own DOM, appended
 * to `document.body`, then removed) — all three read via `getComputedStyle`, never a class-string
 * match or a light-DOM attribute.
 */
const measurePillTone = (page: Page, toneClass: string) =>
  page.evaluate((cls) => {
    const pill = document.querySelector<HTMLElement>(`.sk-boundary-page__title .sk-pill-tag`);
    if (!pill) {
      return { found: false as const };
    }
    const toned = getComputedStyle(pill);

    // Reference elements are appended as SIBLINGS of the pill itself (same parent, same cascade
    // scope) rather than to `document.body` — the LightMode story wraps its content in a
    // `.sk-light` class that changes what `--sk-status-*`/`--sk-on-status-*` resolve to, so a
    // reference appended outside that wrapper would read the WRONG theme's tone and the
    // assertion below would fail even though the composed pill is correct (caught on first run:
    // a `document.body`-appended reference measured the DEFAULT theme's info color while the
    // pill itself, inside `.sk-light`, correctly measured the light one).
    const parent = pill.parentElement!;

    const base = document.createElement('span');
    base.className = 'sk-pill-tag';
    parent.appendChild(base);
    const baseColor = getComputedStyle(base).backgroundColor;
    base.remove();

    const ref = document.createElement('span');
    ref.className = `sk-pill-tag ${cls}`;
    parent.appendChild(ref);
    const refColor = getComputedStyle(ref).backgroundColor;
    ref.remove();

    return {
      found: true as const,
      hasToneClass: pill.classList.contains(cls),
      // MEDIUM-D (pre-merge squad finding): the historical defect
      // (`<sk-pill-tag class="sk-pill-tag--status-*">`, modifier class alone on the custom-
      // element host) was caught because the selector below never matched it and `found` went
      // false. But the hybrid form a "fix" is likely to produce —
      // `<sk-pill-tag class="sk-pill-tag sk-pill-tag--status-*">`, base class AND modifier both
      // on the host — matches `.sk-boundary-page__title .sk-pill-tag` and passes every
      // assertion below while the shadow `<span part="tag">` renders untoned, because a class on
      // the host never reaches the shadow part either way. `tagName` is the only thing that
      // distinguishes the correct styles-layer span form from that hybrid custom-element form.
      tagName: pill.tagName,
      backgroundColor: toned.backgroundColor,
      baseColor,
      refColor,
    };
  }, toneClass);

test.describe('sk-boundary-page composed status pill actually renders its authored tone (spec US3/FR-005)', () => {
  const cases: Array<{ story: string; toneClass: string }> = [
    { story: 'form-card', toneClass: 'sk-pill-tag--status-info' },
    { story: 'terminal-card', toneClass: 'sk-pill-tag--status-success' },
    { story: 'forced-colors', toneClass: 'sk-pill-tag--status-danger' },
    // LightMode wraps the SAME FormCardHTML markup as form-card — one of the four visual
    // baselines HIGH-1 changes the pixels of — so the composed pill's rendered tone is checked
    // under the light palette too, not merely under the default dark one.
    { story: 'light-mode', toneClass: 'sk-pill-tag--status-info' },
  ];

  for (const { story, toneClass } of cases) {
    test(`the ${story} story's composed pill carries ${toneClass} and its computed background differs from the untoned default, matching an isolated reference pill`, async ({ page }) => {
      await openStory(page, story);
      const measured = await measurePillTone(page, toneClass);
      expect(measured.found).toBe(true);
      if (!measured.found) return;
      expect(measured.hasToneClass).toBe(true);
      // MEDIUM-D: assert the composed node is the plain-span styles-layer form, not the
      // `<sk-pill-tag>` custom element — this is what catches the hybrid
      // `<sk-pill-tag class="sk-pill-tag sk-pill-tag--status-*">` form that `hasToneClass` alone
      // cannot: that hybrid form also carries both classes on the host, but never on a `SPAN`.
      expect(measured.tagName).toBe('SPAN');
      // POSITIVE assertion: the pill's actual rendered background is not the neutral/untoned
      // default — this is what a `class="sk-pill-tag--status-*"` HOST-class regression (the
      // exact defect this WP fixes) would fail, because the modifier class never reaches the
      // shadow span that form composes, and the pill renders exactly the untoned default.
      expect(measured.backgroundColor).not.toBe(measured.baseColor);
      // And it matches precisely what the SAME status class renders in isolation — proving the
      // composed pill is genuinely carrying the authored tone, not some other non-neutral value.
      expect(measured.backgroundColor).toBe(measured.refColor);
    });
  }
});
