import { test, expect, type Locator, type Page } from '@playwright/test';

test.setTimeout(60000);

// #69 re-baselined all three of these, and fixed two mechanisms that made the old
// baselines meaningless.
//
// WHY THEY WERE BLANK. Under @storybook/angular the packages/styles stories never
// mounted, so all three baselines were the same empty #0D0E11 frame (one md5,
// f642335856be21c8fb251d2dce35c383). Tracked as #88. That is the primary cause.
//
// WHY RE-SHOOTING ALONE WOULD NOT HAVE FIXED IT. These tests screenshotted the whole
// PAGE. .sk-stub renders ~311x37px in a 1280x720 viewport — about 1.25% of the pixels
// — against maxDiffPixelRatio: 0.02, so for that component a blank render and a full
// render compared EQUAL and --update-snapshots refused to rewrite the file while
// reporting "3 passed". (Only the stub was under the threshold; feature-card at ~14%
// and ribbon-card at ~8% were not. The blindness explains the stub; non-mounting
// explains all three.) Screenshots are now clipped to the component, so the ratio is
// meaningful: hiding .sk-stub__label yields 0.88 instead of 0.006.
//
// THE TRADE. Clipping surrenders layout/position regressions — a component shifted
// 400px still passes, where a full-page shot caught it. Page background and overlay
// collisions are still caught (rounded corners leak surrounding pixels into the crop).
// This is a deliberate trade: a blank render certifies silently, a layout shift is
// visible to anyone opening the catalogue. Filed as #103.
//
// BASELINES ARE CI-AUTHORITATIVE. These PNGs were shot on the ubuntu-latest runner,
// not locally: font rasterization differs and clipping makes the component's box size
// part of the assertion, so a locally-shot baseline fails CI on dimensions alone
// (312x38 local vs 336x34 CI for the stub). Refresh them from the
// visual-regression-diffs artifact of a CI run, never with a local --update-snapshots.
//
// Two things must not be undone: the web-components renderer mounts these stories, and
// each test waits on its component's selector. Do not replace a waitForSelector with a
// bare waitForLoadState, and do not un-clip the screenshots.

test('SK-stub HTML default — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=primitives-skstub-html--default&viewMode=story');
  const target = page.locator('.sk-stub').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-stub-html-default.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-feature-card HTML default — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=components-skfeaturecard-html--default&viewMode=story');
  const target = page.locator('.sk-feature-card').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-feature-card-html-default.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-ribbon-card HTML with ribbon — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=components-skribboncard-html--with-ribbon&viewMode=story');
  const target = page.locator('.sk-ribbon-card').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-ribbon-card-html-with-ribbon.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

const transitionMatrixStory = async (page: Page, id: string): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-sktransitionmatrix--${id}&viewMode=story`);
  const host = page.locator('sk-transition-matrix').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host.locator('table')).toBeVisible();
  return host;
};

const teamOverviewShellStory = async (page: Page, light = false): Promise<Locator> => {
  await page.goto('/iframe.html?id=elements-skappshell--desktop-composition&viewMode=story');
  await page.addScriptTag({ url: '/elements-dist/elements.js' });
  await page.evaluate(async (isLight) => {
    await Promise.all([
      'sk-app-shell',
      'sk-personal-rail',
      'sk-context-sidebar',
      'sk-page-header',
      'sk-button',
    ].map((tag) => customElements.whenDefined(tag)));
    const root = document.querySelector<HTMLElement>('#storybook-root')!;
    root.classList.toggle('sk-light', isLight);
    root.style.minHeight = '100vh';
    root.style.color = 'var(--sk-fg-body)';
    root.style.background = 'var(--sk-surface-page)';
    root.style.fontFamily = 'var(--sk-font-sans)';
    root.innerHTML = `
      <sk-app-shell data-visual-shell>
        <sk-personal-rail slot="personal-rail" label="Product areas">
          <a slot="primary" href="#work" style="color: var(--sk-fg-default)">Work</a>
          <button slot="utilities" type="button">Alerts</button>
          <a slot="account" href="#account" style="color: var(--sk-fg-default)">Account</a>
          <button slot="logout" type="button">Log out</button>
        </sk-personal-rail>
        <sk-context-sidebar slot="context-sidebar" label="Project context">
          <strong slot="header">Reference project</strong>
          <nav aria-label="Project sections"><a href="#summary" style="color: var(--sk-fg-default)">Summary</a></nav>
          <button slot="footer" type="button">Project settings</button>
        </sk-context-sidebar>
        <sk-page-header slot="page-header">
          <span slot="eyebrow">Overview</span>
          <h1 slot="title">Delivery summary</h1>
          <p slot="supporting">Current evidence and recent activity.</p>
          <span slot="sync">Last synchronized by the consumer</span>
          <sk-button slot="actions" variant="ghost" size="icon" label="Refresh evidence">↻</sk-button>
        </sk-page-header>
        <section aria-label="Delivery content"><p>Consumer-owned page content.</p></section>
      </sk-app-shell>`;
    const elements = root.querySelectorAll<HTMLElement>(
      'sk-app-shell, sk-personal-rail, sk-context-sidebar, sk-page-header, sk-button'
    );
    await Promise.all([...elements].map((element) =>
      (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete
    ));
  }, light);
  const host = page.locator('sk-app-shell[data-visual-shell]').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host).not.toBeEmpty();
  return host;
};

test('SK-team-overview shell desktop dark — visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const host = await teamOverviewShellStory(page);
  await expect(host).toHaveScreenshot('sk-team-overview-shell-desktop-dark.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-team-overview shell desktop light — visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const host = await teamOverviewShellStory(page, true);
  await expect(host).toHaveScreenshot('sk-team-overview-shell-desktop-light.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-team-overview shell narrow — visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const host = await teamOverviewShellStory(page);
  await expect(host).toHaveScreenshot('sk-team-overview-shell-narrow.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

for (const light of [false, true]) {
  test(`SK-icon button focus ${light ? 'light' : 'dark'} — visual baseline`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await teamOverviewShellStory(page, light);
    const control = page.getByRole('button', { name: 'Refresh evidence' });
    await control.focus();
    await expect(control).toBeFocused();
    await expect(control).toHaveScreenshot(`sk-icon-button-focus-${light ? 'light' : 'dark'}.png`, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    });
  });
}

test('SK-transition-matrix approved dark — visual baseline', async ({ page }) => {
  const host = await transitionMatrixStory(page, 'approved-example');
  await expect(host).toHaveScreenshot('sk-transition-matrix-approved-dark.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-transition-matrix light — visual baseline', async ({ page }) => {
  const host = await transitionMatrixStory(page, 'light-mode');
  await expect(host).toHaveScreenshot('sk-transition-matrix-light.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-transition-matrix selectable rest and hover — visual baselines', async ({ page }) => {
  await transitionMatrixStory(page, 'selectable-states');
  const host = page.locator('sk-transition-matrix[data-selectable-states]').first();
  const row = host.locator('[data-route-id="planned-progress"]');
  await expect(host).toHaveScreenshot('sk-transition-matrix-selectable-rest.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await row.hover();
  await expect(host).toHaveScreenshot('sk-transition-matrix-selectable-hover.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-transition-matrix keyboard focus and pressed — visual baselines', async ({ page }) => {
  await transitionMatrixStory(page, 'selectable-states');
  const host = page.locator('sk-transition-matrix[data-selectable-states]').first();
  const row = host.locator('[data-route-id="planned-progress"]');
  await row.focus();
  await expect(host).toHaveScreenshot('sk-transition-matrix-selectable-focus-visible.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await page.keyboard.down('Space');
  await expect(row).toHaveAttribute('data-pressed', 'true');
  await expect(host).toHaveScreenshot('sk-transition-matrix-selectable-keyboard-pressed.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await page.keyboard.up('Space');
});

test('SK-transition-matrix pointer active — visual baseline', async ({ page }) => {
  await transitionMatrixStory(page, 'selectable-states');
  const host = page.locator('sk-transition-matrix[data-selectable-states]').first();
  const row = host.locator('[data-route-id="planned-progress"]');
  const box = await row.boundingBox();
  expect(box).not.toBe(null);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(row).toHaveAttribute('data-pressed', 'true');
  await expect(host).toHaveScreenshot('sk-transition-matrix-selectable-pointer-active.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await page.mouse.up();
});

test('SK-transition-matrix non-selectable analogue — visual baseline', async ({ page }) => {
  await transitionMatrixStory(page, 'selectable-states');
  const host = page.locator('sk-transition-matrix[data-disabled-analogue]').first();
  await expect(host.locator('table')).toBeVisible();
  await expect(host).toHaveScreenshot('sk-transition-matrix-non-selectable.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-transition-matrix narrow scrolled ownership — visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const host = await transitionMatrixStory(page, 'approved-example');
  const scroller = host.locator('[part~="scroller"]');
  await scroller.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
  await expect.poll(() => scroller.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await expect(host).toHaveScreenshot('sk-transition-matrix-narrow-scrolled.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});
