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

// #365(b), the named #304 trap: sk-entity-marker's `border` property is a validated String
// enum (only "true" is legal), never a native Boolean — packages/elements/src/entity-marker/
// sk-entity-marker.ts's own comment records why (FR-011 needs a warn-and-fall-open invalid
// state, which a Lit `type: Boolean` property cannot represent). A BARE `<sk-entity-marker
// border>` (no value) reflects the attribute as `""`, `entityMarkerBorder("")` treats that as
// "absent" per its own `value !== ''` guard, and the marker renders UNBORDERED — silently,
// with no console.warn, unlike every OTHER invalid value on this axis. Every boundary-page
// exemplar that composes a mark uses the explicit `border="true"` form (sk-boundary-page-form-
// card.html's own comment names this exact trap) — but until now nothing in this mission's
// four spec files ever measured that `border="true"` genuinely renders a border, or that the
// bare form genuinely does not. Both measured directly via the marker's own shadow `[part=
// "marker"]` computed border, never a light-DOM attribute or a class-string match.
test.describe('sk-boundary-page composed sk-entity-marker border modifier actually renders (spec FR-004, #304 trap)', () => {
  test('the form-card story composes border="true" and its sk-entity-marker genuinely renders a border', async ({
    page,
  }) => {
    await openStory(page, 'form-card');
    const marker = page.locator('.sk-boundary-page__mark sk-entity-marker').first();
    await expect(marker).toHaveAttribute('border', 'true');
    const measured = await marker.evaluate((element) => {
      const part = element.shadowRoot!.querySelector<HTMLElement>('[part="marker"]')!;
      const style = getComputedStyle(part);
      return { borderStyle: style.borderStyle, borderWidth: parseFloat(style.borderWidth) };
    });
    expect(measured.borderStyle).toBe('solid');
    expect(measured.borderWidth).toBeGreaterThan(0);
  });

  test('a bare border attribute (no value) silently renders unbordered, unlike border="true" — proving the #304 trap rather than transcribing it', async ({
    page,
  }) => {
    // Any page with the elements bundle loaded works; form-card already has one composed.
    await openStory(page, 'form-card');
    const measured = await page.evaluate(() => {
      const makeMarker = (borderValue: string) => {
        const el = document.createElement('sk-entity-marker');
        el.setAttribute('border', borderValue);
        document.body.appendChild(el);
        return el;
      };
      const waitForPart = (el: Element) =>
        new Promise<HTMLElement>((resolve) => {
          const check = () => {
            const part = el.shadowRoot?.querySelector<HTMLElement>('[part="marker"]');
            if (part) resolve(part);
            else requestAnimationFrame(check);
          };
          check();
        });

      const bare = makeMarker(''); // <sk-entity-marker border> in real HTML
      const trueForm = makeMarker('true'); // <sk-entity-marker border="true">

      return Promise.all([waitForPart(bare), waitForPart(trueForm)]).then(([barePart, truePart]) => {
        const result = {
          bareBorderStyle: getComputedStyle(barePart).borderStyle,
          bareBorderWidth: parseFloat(getComputedStyle(barePart).borderWidth),
          trueBorderStyle: getComputedStyle(truePart).borderStyle,
          trueBorderWidth: parseFloat(getComputedStyle(truePart).borderWidth),
        };
        bare.remove();
        trueForm.remove();
        return result;
      });
    });
    // The explicit form genuinely renders bordered — the control for the assertion below.
    expect(measured.trueBorderStyle).toBe('solid');
    expect(measured.trueBorderWidth).toBeGreaterThan(0);
    // The trap: the bare attribute form is indistinguishable from no border attribute at all.
    expect(measured.bareBorderWidth).toBe(0);
  });
});
