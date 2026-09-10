import { expect, test, type Page } from '@playwright/test';

/**
 * Rendered target-size (FR-007, User Story 2) and forced-colors distinguishability (FR-008,
 * User Story 4) proof for the #321 control-boundary contract, on BOTH consumption paths:
 *
 *  - static:  `form-formfield-html--form-input-default`, `.sk-form-field .sk-input`
 *  - element: `elements-skforminput--default`, `<sk-form-input>`'s shadow-DOM `[part="control"]`
 *
 * Zoom simulation reuses `apps/storybook/src/tests/sk-collection.spec.ts`'s calibrated
 * `style.zoom = '2'` + width-probe technique verbatim (a 100px-wide probe element must measure
 * 200px before the real assertion is trusted). Forced-colors emulation reuses
 * `apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts`'s
 * `page.emulateMedia({ forcedColors: 'active' })` + shadow-root `getComputedStyle` pattern.
 */

const STATIC_STORY_ID = 'form-formfield-html--form-input-default';
const ELEMENT_STORY_ID = 'elements-skforminput--default';
const TARGET_SIZE_FLOOR_PX = 44;

async function openStory(page: Page, id: string): Promise<void> {
  // No `#storybook-root` `.not.toBeEmpty()` readiness check here: the element path's light DOM
  // (`<sk-form-input>...</sk-form-input>`) is text-empty by design — its rendered content lives
  // in the shadow root, which `textContent` does not see, so that assertion would time out on
  // that path even once the element has fully rendered. Each path's own `getControl()` already
  // waits for its control to become visible, which is the real readiness signal here.
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
}

async function staticControl(page: Page) {
  const control = page.locator('#storybook-root .sk-input').first();
  await control.waitFor({ state: 'visible', timeout: 20000 });
  return control;
}

async function elementControl(page: Page) {
  const host = page.locator('#storybook-root sk-form-input').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  const control = host.locator('[part="control"]').first();
  await control.waitFor({ state: 'visible', timeout: 20000 });
  return control;
}

/** Calibrated 200% zoom: prove the probe measures 200px before trusting the real measurement. */
async function applyCalibratedZoom(page: Page): Promise<void> {
  const root = page.locator('#storybook-root');
  await root.evaluate((node) => {
    (node as HTMLElement).style.zoom = '2';
  });
  expect(await root.evaluate((node) => getComputedStyle(node as HTMLElement).zoom)).toBe('2');
  const probeWidth = await root.evaluate((node) => {
    const probe = document.createElement('div');
    probe.style.width = '100px';
    node.prepend(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  });
  expect(probeWidth).toBe(200);
}

const paths = [
  { name: 'static', storyId: STATIC_STORY_ID, getControl: staticControl },
  { name: 'element', storyId: ELEMENT_STORY_ID, getControl: elementControl },
] as const;

test.describe('sk-input / sk-form-input__control — rendered target size (FR-007)', () => {
  for (const { name, storyId, getControl } of paths) {
    test(`${name} path clears 44px at 390px viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 720 });
      await openStory(page, storyId);
      const control = await getControl(page);
      const box = await control.boundingBox();
      expect(box, `${name} path: control has no bounding box`).not.toBeNull();
      expect(
        box!.height,
        `${name} path at 390px: measured block-size ${box!.height}px, below the ${TARGET_SIZE_FLOOR_PX}px floor`,
      ).toBeGreaterThanOrEqual(TARGET_SIZE_FLOOR_PX);
    });

    test(`${name} path clears 44px under calibrated 200% zoom, not clipped`, async ({ page }) => {
      await page.setViewportSize({ width: 780, height: 1440 });
      await openStory(page, storyId);
      await applyCalibratedZoom(page);
      const control = await getControl(page);
      const box = await control.boundingBox();
      expect(box, `${name} path (zoom-200): control has no bounding box`).not.toBeNull();
      expect(
        box!.height,
        `${name} path at 200% zoom: measured block-size ${box!.height}px, below the ${TARGET_SIZE_FLOOR_PX}px floor`,
      ).toBeGreaterThanOrEqual(TARGET_SIZE_FLOOR_PX);
      const viewport = page.viewportSize();
      expect(viewport).not.toBeNull();
      expect(
        box!.y >= 0 && box!.x >= 0,
        `${name} path at 200% zoom: control box (x=${box!.x}, y=${box!.y}) is pushed outside the viewport`,
      ).toBe(true);
      // Not clipped by any ancestor: an intersection-observer-style visibility check against
      // the viewport is what Playwright's own `toBeVisible()` already performs internally, so
      // reuse that rather than re-deriving ancestor-overflow math.
      await expect(control).toBeVisible();
    });
  }
});

test.describe('sk-input / sk-form-input__control — forced-colors distinguishability (FR-008)', () => {
  for (const { name, storyId, getControl } of paths) {
    test(`${name} path: border survives forced-colors: active, resolved color recorded`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'Playwright forced-colours emulation is Chromium-only');
      await page.emulateMedia({ forcedColors: 'active' });
      await openStory(page, storyId);
      const control = await getControl(page);

      const controlPresentation = await control.evaluate((node) => {
        const style = getComputedStyle(node as HTMLElement);
        return {
          borderTopStyle: style.borderTopStyle,
          borderTopColor: style.borderTopColor,
        };
      });
      expect(
        controlPresentation.borderTopStyle,
        `${name} path: control's forced-colors border-top-style is 'none' — the boundary is invisible`,
      ).not.toBe('none');

      // A plain, non-interactive bordered reference element in the SAME document, so its
      // forced-colors remap can be compared against the control's — measured, not assumed,
      // per adding-a-component.md's own corrected-guidance history on exactly this mistake.
      const referencePresentation = await page.evaluate(() => {
        const reference = document.createElement('div');
        reference.style.border = '1px solid CanvasText';
        reference.style.width = '40px';
        reference.style.height = '40px';
        document.body.appendChild(reference);
        const style = getComputedStyle(reference);
        const result = {
          borderTopStyle: style.borderTopStyle,
          borderTopColor: style.borderTopColor,
        };
        reference.remove();
        return result;
      });

      console.info(
        `[FR-008] ${name} path forced-colors resolved colors`,
        JSON.stringify({ control: controlPresentation, reference: referencePresentation }),
      );

      // The comparison this test exists for. Measured (not assumed): under real
      // forced-colors emulation, `--sk-border-control`'s authored hex is NOT what either
      // element renders -- both a correctly forced-colors-compliant control and a plain
      // forced-colors-compliant reference resolve to the SAME UA system colour, because
      // forced-colors overrides author border-color for both alike. That equality is
      // exactly the meaningful, catchable assertion: if this control's forced-colors
      // handling were ever silently disabled (e.g. an author `forced-color-adjust: none`
      // leaking onto it, or an ancestor value inherited unexpectedly) its resolved colour
      // would diverge from the reference and stay pinned to the RAW authored hex instead --
      // measured directly: a control carrying `forced-color-adjust: none` resolves to
      // `rgb(129, 129, 139)` (the literal --sk-border-control value) here, while every
      // properly forced-colors-compliant element in this same document resolves to the
      // same system colour regardless of its own authored hex. Neither reverting the
      // border to --sk-border-default nor setting it to transparent can pass this: both
      // still correctly received the SAME forced system colour as the reference (proving
      // forced-colors itself was never the defect in those cases) -- what this assertion
      // actually guards is forced-colors compliance surviving on this control specifically,
      // which is the literal claim FR-008 makes.
      expect(
        controlPresentation.borderTopColor,
        `${name} path: control's forced-colors border colour (${controlPresentation.borderTopColor}) does not match the reference element's forced-colors border colour (${referencePresentation.borderTopColor}) -- forced-colors compliance may be disabled on this control (check for a leaked forced-color-adjust: none) rather than genuinely applied`,
      ).toBe(referencePresentation.borderTopColor);

      // And the raw authored token must not leak through uncontested -- if it did, forced
      // colors would be silently inert on this control even though the two assertions
      // above happened to still read as "present" and "matching something".
      const rawControlToken = 'rgb(129, 129, 139)'; // --sk-border-control, dark theme
      expect(
        controlPresentation.borderTopColor,
        `${name} path: control's forced-colors border colour is still the raw authored --sk-border-control value -- forced-colors is not overriding it`,
      ).not.toBe(rawControlToken);
    });
  }
});
