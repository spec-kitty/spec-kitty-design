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

test('SK-progress HTML default dark — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=primitives-skprogress-html--default&viewMode=story');
  const target = page.locator('.sk-progress').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-progress-html-default-dark.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-progress HTML light mode — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=primitives-skprogress-html--light-mode&viewMode=story');
  const target = page.locator('.sk-progress').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-progress-html-light.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-progress HTML forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/iframe.html?id=primitives-skprogress-html--forced-colors&viewMode=story');
  const target = page.locator('.sk-progress').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-progress-html-forced-colors.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

const eventTimelineStory = async (page: Page, id: string): Promise<Locator> => {
  await page.goto(`/iframe.html?id=primitives-skeventtimeline-html--${id}&viewMode=story`);
  const target = page.locator('.sk-event-timeline').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).not.toBeEmpty();
  return target;
};

test('SK-event-timeline same fixture default and compact — visual baselines', async ({ page }) => {
  const target = await eventTimelineStory(page, 'compact-default');
  await target.evaluate((node) => node.classList.remove('sk-event-timeline--compact'));
  await expect(target).toHaveScreenshot('sk-event-timeline-compact-fixture-default.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
  await target.evaluate((node) => node.classList.add('sk-event-timeline--compact'));
  await expect(target).toHaveScreenshot('sk-event-timeline-compact-dark.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-event-timeline compact narrow — visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const target = await eventTimelineStory(page, 'compact-narrow');
  await expect(target).toHaveScreenshot('sk-event-timeline-compact-narrow.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-event-timeline compact light — visual baseline', async ({ page }) => {
  const target = await eventTimelineStory(page, 'compact-light-mode');
  await expect(target).toHaveScreenshot('sk-event-timeline-compact-light.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-event-timeline compact forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const target = await eventTimelineStory(page, 'compact-forced-colors');
  const anchor = target.locator('a[href="#forced-colors-event"]');
  await anchor.focus();
  await expect(anchor).toBeFocused();
  await expect(target).toHaveScreenshot('sk-event-timeline-compact-forced-colors.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

const copyFieldStory = async (page: Page, id: string, requireValue = true): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-skcopyfield--${id}&viewMode=story`);
  const target = page.locator('sk-copy-field').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  if (requireValue) await expect(target.locator('[part="value"]')).not.toBeEmpty();
  return target;
};

test('SK-copy-field default dark — visual baseline', async ({ page }) => {
  const target = await copyFieldStory(page, 'default-dark');
  await expect(target).toHaveScreenshot('sk-copy-field-default-dark.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-copy-field light mode — visual baseline', async ({ page }) => {
  const target = await copyFieldStory(page, 'light-mode');
  await expect(target).toHaveScreenshot('sk-copy-field-light.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-copy-field long wrapping — visual baseline', async ({ page }) => {
  const target = await copyFieldStory(page, 'long-wrapping-command');
  await expect(target).toHaveScreenshot('sk-copy-field-long.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-copy-field narrow — visual baseline', async ({ page }) => {
  const target = await copyFieldStory(page, 'narrow');
  await expect(target).toHaveScreenshot('sk-copy-field-narrow.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-copy-field focus — visual baseline', async ({ page }) => {
  const target = await copyFieldStory(page, 'focused');
  await expect(target.locator('button')).toBeFocused();
  await expect(target).toHaveScreenshot('sk-copy-field-focus.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-copy-field disabled empty — visual baseline', async ({ page }) => {
  const target = await copyFieldStory(page, 'disabled-empty', false);
  await expect(target.locator('button')).toBeDisabled();
  await expect(target).toHaveScreenshot('sk-copy-field-disabled-empty.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-copy-field manual fallback — visual baseline', async ({ page }) => {
  const target = await copyFieldStory(page, 'manual-fallback');
  await expect(target.locator('[part="status"]')).toContainText('system copy shortcut');
  await expect(target).toHaveScreenshot('sk-copy-field-manual.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-copy-field failure — visual baseline', async ({ page }) => {
  const target = await copyFieldStory(page, 'failure');
  await expect(target.locator('[part="status"]')).toContainText('Unable to copy');
  await expect(target).toHaveScreenshot('sk-copy-field-failure.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-copy-field forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const target = await copyFieldStory(page, 'forced-colors');
  await expect(target.locator('[part="status"]')).toHaveText('Value copied.');
  await expect(target).toHaveScreenshot('sk-copy-field-forced-colors.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

const workflowBoardStory = async (page: Page, id: string, viewport: { width: number; height: number }): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=primitives-skworkflowboard-html--${id}&viewMode=story`);
  const target = page.locator('.sk-workflow-board').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).not.toBeEmpty();
  return target;
};

const workflowBoardVisuals = [
  ['populated', 'sk-workflow-board-populated-dark.png', { width: 1024, height: 720 }],
  ['fitting', 'sk-workflow-board-fitting.png', { width: 1600, height: 720 }],
  ['all-empty', 'sk-workflow-board-all-empty.png', { width: 1024, height: 720 }],
  ['one-empty-lane', 'sk-workflow-board-one-empty-lane.png', { width: 1024, height: 720 }],
  ['fifty-items', 'sk-workflow-board-fifty-items.png', { width: 1024, height: 1200 }],
  ['long-labels-and-items', 'sk-workflow-board-long-labels-and-items.png', { width: 360, height: 720 }],
  ['single-lane-narrow', 'sk-workflow-board-single-lane-narrow.png', { width: 320, height: 720 }],
  ['light-mode', 'sk-workflow-board-light.png', { width: 1024, height: 720 }],
] as const;

for (const [id, snapshot, viewport] of workflowBoardVisuals) {
  test(`SK-workflow-board ${id} — visual baseline`, async ({ page }) => {
    const target = await workflowBoardStory(page, id, viewport);
    await expect(target).toHaveScreenshot(snapshot, { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  });
}

test('SK-workflow-board forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const target = await workflowBoardStory(page, 'forced-colors', { width: 1024, height: 720 });
  const scroller = target.locator('.sk-workflow-board__scroller');
  await page.locator('body').press('Tab');
  await expect(scroller).toBeFocused();
  await expect(target).toHaveScreenshot('sk-workflow-board-forced-colors.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
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
      <style>
        sk-app-shell[data-visual-shell]::part(shell) { min-height: 100vh; }
      </style>
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
  const viewportHeight = await page.evaluate(() => document.documentElement.clientHeight);
  await expect
    .poll(() =>
      host.evaluate((element) =>
        Math.round(element.getBoundingClientRect().height)
      )
    )
    .toBeGreaterThanOrEqual(viewportHeight);
  return host;
};

const appShellStory = async (
  page: Page,
  id: string,
  width: number,
  height: number,
): Promise<Locator> => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=elements-skappshell--${id}&viewMode=story`);
  const host = page.locator('sk-app-shell').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await host.evaluate((element) =>
    (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete);
  return host;
};

const actionRowStory = async (page: Page, id: string): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-skactionrow--${id}&viewMode=story`);
  const host = page.locator('sk-action-row').first();
  await expect(host.locator('[part="row"]')).toBeVisible({ timeout: 20000 });
  return host;
};

const barChartStory = async (page: Page, id: string): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-skbarchart--${id}&viewMode=story`);
  const host = page.locator('sk-bar-chart').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host.locator('[part="chart"]')).toBeVisible();
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

for (const visual of [
  { id: 'rail-preserving-1024', width: 1024, height: 900, name: 'sk-app-shell-rail-preserving-1024-dark.png' },
  { id: 'rail-preserving-light-mode', width: 1024, height: 900, name: 'sk-app-shell-rail-preserving-1024-light.png' },
  { id: 'rail-preserving-390', width: 390, height: 900, name: 'sk-app-shell-rail-preserving-390-dark.png' },
] as const) {
  test(`SK-app-shell ${visual.name} — visual baseline`, async ({ page }) => {
    const host = await appShellStory(page, visual.id, visual.width, visual.height);
    await expect(host).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    });
  });
}

test('SK-app-shell rail-preserving forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const host = await appShellStory(page, 'rail-preserving-forced-colors', 1024, 900);
  await expect(host).toHaveScreenshot('sk-app-shell-rail-preserving-forced-colors.png', {
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

test('SK-section-header long content — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=elements-sksectionheader--long-content&viewMode=story');
  const host = page.locator('sk-section-header').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host.locator('[part="title"]')).toBeVisible();
  const action = host.locator('sk-button[slot="action"]');
  await expect(action.locator('button')).toBeVisible();
  await expect(action).toHaveText('Open activity');
  await expect(host).toHaveScreenshot('sk-section-header-long-content.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-section-header light mode — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=elements-sksectionheader--light-mode&viewMode=story');
  const host = page.locator('sk-section-header').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host.locator('[part="title"]')).toBeVisible();
  await expect(host).toHaveScreenshot('sk-section-header-light.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-status-indicator all tones — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=elements-skstatusindicator--all-tones&viewMode=story');
  const indicators = page.locator('sk-status-indicator');
  await expect(indicators).toHaveCount(6);
  await indicators.first().waitFor({ state: 'visible', timeout: 20000 });
  await expect(indicators.first().locator('..')).toHaveScreenshot('sk-status-indicator-all-tones.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-status-indicator light mode — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=elements-skstatusindicator--light-mode&viewMode=story');
  const indicators = page.locator('sk-status-indicator');
  await expect(indicators).toHaveCount(6);
  await indicators.first().waitFor({ state: 'visible', timeout: 20000 });
  await expect(indicators.first().locator('..')).toHaveScreenshot('sk-status-indicator-light.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-entity-marker meaningful and decorative modes — visual baselines', async ({ page }) => {
  await page.goto('/iframe.html?id=elements-skentitymarker--meaningful-icon&viewMode=story');
  let host = page.locator('sk-entity-marker').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host).toHaveScreenshot('sk-entity-marker-meaningful.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });

  await page.goto('/iframe.html?id=elements-skentitymarker--decorative&viewMode=story');
  host = page.locator('sk-entity-marker').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host).toHaveScreenshot('sk-entity-marker-decorative.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-action-row default and light — visual baselines', async ({ page }) => {
  let host = await actionRowStory(page, 'default');
  await expect(host).toHaveScreenshot('sk-action-row-default-dark.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  host = await actionRowStory(page, 'light-mode');
  await expect(host).toHaveScreenshot('sk-action-row-light.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  host = await actionRowStory(page, 'route-flush-light-mode');
  await expect(host).toHaveScreenshot('sk-action-row-route-flush-light.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-action-row route and flush states — visual baselines', async ({ page }) => {
  for (const [storyId, snapshot] of [
    ['route', 'sk-action-row-route.png'],
    ['route-flush', 'sk-action-row-route-flush.png'],
    ['button-flush', 'sk-action-row-button-flush.png'],
    ['selected-flush', 'sk-action-row-selected-flush.png'],
    ['route-selected', 'sk-action-row-route-selected.png'],
    ['unknown-presentation', 'sk-action-row-unknown-presentation.png'],
  ] as const) {
    const host = await actionRowStory(page, storyId);
    await expect(host).toHaveScreenshot(snapshot, { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  }
});

test('SK-action-row forced-colors selected comparison — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await actionRowStory(page, 'forced-colors');
  const comparison = page.locator('[data-forced-colors-comparison]').first();
  await comparison.waitFor({ state: 'visible', timeout: 20000 });
  await expect(comparison).toHaveScreenshot('sk-action-row-forced-colors.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-action-row long content at 320px — visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const host = await actionRowStory(page, 'long-content');
  await expect(host).toHaveScreenshot('sk-action-row-long-content-320.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-action-row selectable rest, hover, focus and pressed — visual baselines', async ({ page }) => {
  const host = await actionRowStory(page, 'selectable-states');
  const trigger = host.locator('button[part="trigger"]');
  await expect(host).toHaveScreenshot('sk-action-row-selectable-rest.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await trigger.hover();
  await expect(host).toHaveScreenshot('sk-action-row-selectable-hover.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await trigger.focus();
  await expect(host).toHaveScreenshot('sk-action-row-selectable-focus-visible.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await page.keyboard.down('Space');
  await expect(host).toHaveScreenshot('sk-action-row-selectable-keyboard-pressed.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await page.keyboard.up('Space');
});

test('SK-action-row pointer active — visual baseline', async ({ page }) => {
  const host = await actionRowStory(page, 'selectable-states');
  const trigger = host.locator('button[part="trigger"]');
  const box = await trigger.boundingBox();
  expect(box).not.toBe(null);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(host).toHaveScreenshot('sk-action-row-selectable-pointer-active.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await page.mouse.up();
});

test('SK-action-row selected and non-selectable analogues — visual baselines', async ({ page }) => {
  let host = await actionRowStory(page, 'selected');
  await expect(host).toHaveScreenshot('sk-action-row-selected.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  host = await actionRowStory(page, 'non-selectable');
  await expect(host).toHaveScreenshot('sk-action-row-non-selectable.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('compact work-item extensions T10 dark — visual baseline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const host = await actionRowStory(page, 't-10-compact-item');
  await expect(host).toHaveScreenshot('sk-compact-work-item-extensions-t10-dark.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('compact work-item extensions T10 light — visual baseline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const host = await actionRowStory(page, 't-10-compact-item-light-mode');
  await expect(host).toHaveScreenshot('sk-compact-work-item-extensions-t10-light.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('compact work-item extensions narrow long card — visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const host = await actionRowStory(page, 'card-long-content');
  await host.evaluate((element) => {
    const frame = element.parentElement!;
    frame.style.width = '220px';
    frame.style.inlineSize = '220px';
    frame.style.maxInlineSize = '220px';
  });
  await expect(host).toHaveScreenshot('sk-compact-work-item-extensions-narrow-long-card.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('compact work-item extensions marker axis matrix — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=elements-skentitymarker--axis-matrix&viewMode=story');
  const markers = page.locator('sk-entity-marker');
  await expect(markers).toHaveCount(4);
  await markers.first().waitFor({ state: 'visible', timeout: 20000 });
  await expect(markers.first().locator('..')).toHaveScreenshot(
    'sk-compact-work-item-extensions-marker-axis-matrix.png',
    { threshold: 0.02, maxDiffPixelRatio: 0.02 },
  );
});

test('compact work-item extensions portrait and landscape crop — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=elements-skentitymarker--image-naming&viewMode=story');
  const first = page.locator('sk-entity-marker').first();
  await first.waitFor({ state: 'visible', timeout: 20000 });
  await page.evaluate(() => {
    const marker = document.createElement('sk-entity-marker');
    marker.setAttribute('label', 'Landscape subject');
    marker.setAttribute('size', 'sm');
    marker.setAttribute('shape', 'circle');
    marker.innerHTML =
      '<img data-landscape alt="" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2260%22%3E%3Crect width=%22120%22 height=%2260%22 fill=%22%238fcb8f%22/%3E%3Ccircle cx=%2280%22 cy=%2230%22 r=%2218%22 fill=%22%231f2228%22/%3E%3C/svg%3E">';
    document.querySelector('sk-entity-marker')!.parentElement!.append(marker);
  });
  await expect.poll(() => page.locator('img[data-landscape]').evaluate((image: HTMLImageElement) => image.complete))
    .toBe(true);
  await expect(first.locator('..')).toHaveScreenshot(
    'sk-compact-work-item-extensions-marker-image-crop.png',
    { threshold: 0.02, maxDiffPixelRatio: 0.02 },
  );
});

test('compact work-item extensions pulse off/on reduced-motion fallback — visual baseline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/iframe.html?id=elements-skstatusindicator--pulsing-preferences&viewMode=story');
  const indicators = page.locator('sk-status-indicator');
  await expect(indicators).toHaveCount(2);
  await indicators.first().waitFor({ state: 'visible', timeout: 20000 });
  await expect(indicators.first().locator('..')).toHaveScreenshot(
    'sk-compact-work-item-extensions-pulse-reduced-motion.png',
    { threshold: 0.02, maxDiffPixelRatio: 0.02 },
  );
});

test('compact work-item extensions inline short and long dark — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=primitives-skemptystate-html--inline&viewMode=story');
  let target = page.locator('[data-inline-empty-frame]');
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-compact-work-item-extensions-inline-short-dark.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });

  await page.goto('/iframe.html?id=primitives-skemptystate-html--inline-long-narrow&viewMode=story');
  target = page.locator('[data-inline-empty-frame]');
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-compact-work-item-extensions-inline-long-dark.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('compact work-item extensions inline light — visual baseline', async ({ page }) => {
  await page.goto('/iframe.html?id=primitives-skemptystate-html--inline-light-mode&viewMode=story');
  const target = page.locator('[data-inline-empty-frame]');
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-compact-work-item-extensions-inline-light.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('compact work-item extensions inline forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/iframe.html?id=primitives-skemptystate-html--inline-preferences&viewMode=story');
  const target = page.locator('[data-inline-empty-frame]');
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target).toHaveScreenshot('sk-compact-work-item-extensions-inline-forced-colors.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

const metricStory = async (page: Page, id: string): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-skmetric--${id}&viewMode=story`);
  const host = page.locator('sk-metric').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host.locator('[part="metric"]')).toBeVisible();
  return host;
};

const evidenceChainStory = async (page: Page, id: string): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-skevidencechain--${id}&viewMode=story`);
  const host = page.locator('sk-evidence-chain').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await expect(host.locator('[part="list"]')).toBeVisible();
  return host;
};

test('SK-metric default dark and light — visual baselines', async ({ page }) => {
  let host = await metricStory(page, 'default');
  await expect(host).toHaveScreenshot('sk-metric-default-dark.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  host = await metricStory(page, 'light-mode');
  await expect(host).toHaveScreenshot('sk-metric-light.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-metric compact and long content — visual baselines', async ({ page }) => {
  let host = await metricStory(page, 'compact');
  await expect(host).toHaveScreenshot('sk-metric-compact.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await page.setViewportSize({ width: 390, height: 844 });
  host = await metricStory(page, 'long-content');
  await expect(host).toHaveScreenshot('sk-metric-long-content.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-evidence-chain approved composition and light — visual baselines', async ({ page }) => {
  await evidenceChainStory(page, 'approved-example');
  let target = page.locator('sk-grid').first();
  await expect(target).toHaveScreenshot('sk-evidence-chain-approved-dark.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  await evidenceChainStory(page, 'light-mode');
  target = page.locator('sk-grid').first();
  await expect(target).toHaveScreenshot('sk-evidence-chain-light.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-evidence-chain two and six stages — visual baselines', async ({ page }) => {
  let host = await evidenceChainStory(page, 'two-stages');
  await expect(host).toHaveScreenshot('sk-evidence-chain-two-stages.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  host = await evidenceChainStory(page, 'six-stages');
  await expect(host).toHaveScreenshot('sk-evidence-chain-six-stages.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-evidence-chain narrow — visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const host = await evidenceChainStory(page, 'narrow');
  await expect(host).toHaveScreenshot('sk-evidence-chain-narrow.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-bar-chart approved dark — visual baseline', async ({ page }) => {
  const host = await barChartStory(page, 'default');
  await expect(host).toHaveScreenshot('sk-bar-chart-approved-dark.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-bar-chart approved light — visual baseline', async ({ page }) => {
  const host = await barChartStory(page, 'light-mode');
  await expect(host).toHaveScreenshot('sk-bar-chart-approved-light.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-bar-chart narrow scrolled ownership — visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const host = await barChartStory(page, 'long-labels');
  const plot = host.locator('[part="plot"]');
  await plot.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
  await expect.poll(() => plot.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await expect(host).toHaveScreenshot('sk-bar-chart-narrow-scrolled.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-bar-chart zero and empty states — visual baselines', async ({ page }) => {
  let host = await barChartStory(page, 'zero-values');
  await expect(host).toHaveScreenshot('sk-bar-chart-zero-values.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  host = await barChartStory(page, 'empty');
  await expect(host).toHaveScreenshot('sk-bar-chart-empty.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

test('SK-bar-chart selectable states — visual baseline', async ({ page }) => {
  await barChartStory(page, 'selectable-states');
  const states = page.locator('[data-bar-chart-selectable-states]');
  await expect(states.locator('sk-bar-chart')).toHaveCount(3);
  const rest = states.locator('sk-bar-chart[data-selectable-states]');
  const selected = states.locator('sk-bar-chart[data-selected-state]');
  const nonSelectable = states.locator('sk-bar-chart[data-non-selectable-state]');
  await expect(rest.getByRole('button')).toHaveCount(4);
  await expect(rest.locator('[aria-pressed="true"]')).toHaveCount(0);
  await expect(selected.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(nonSelectable.getByRole('button')).toHaveCount(0);
  await expect(states).toHaveScreenshot('sk-bar-chart-selectable-states.png', { threshold: 0.02, maxDiffPixelRatio: 0.02 });
});

const formSelectStory = async (
  page: Page,
  id: string,
  viewport: { width: number; height: number } = { width: 720, height: 480 },
): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=form-skformselect-html--${id}&viewMode=story`);
  const target = page.locator('.sk-form-field').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target.locator('select.sk-form-select')).toBeVisible();
  return target;
};

const formSelectVisuals = [
  ['default', 'sk-form-select-default-dark.png', { width: 720, height: 480 }],
  ['light-mode', 'sk-form-select-light.png', { width: 720, height: 480 }],
  ['compact', 'sk-form-select-compact.png', { width: 720, height: 480 }],
  ['required-invalid', 'sk-form-select-invalid.png', { width: 720, height: 480 }],
  ['narrow', 'sk-form-select-narrow.png', { width: 320, height: 720 }],
] as const;

for (const [id, snapshot, viewport] of formSelectVisuals) {
  test(`SK-form-select ${id} — visual baseline`, async ({ page }) => {
    const field = await formSelectStory(page, id, viewport);
    const target = id === 'narrow' ? page.locator('#storybook-root') : field;
    if (id === 'narrow') {
      await target.evaluate((node: HTMLElement) => {
        node.style.inlineSize = '100vw';
      });
      const geometry = await target.evaluate((node) => {
        const scroller = document.scrollingElement ?? document.documentElement;
        return {
          targetWidth: node.getBoundingClientRect().width,
          viewportWidth: document.documentElement.clientWidth,
          documentScrollWidth: scroller.scrollWidth,
        };
      });
      expect(geometry).toEqual({
        targetWidth: viewport.width,
        viewportWidth: viewport.width,
        documentScrollWidth: viewport.width,
      });
    }
    await expect(target).toHaveScreenshot(snapshot, { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  });
}

test('SK-form-select forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const target = await formSelectStory(page, 'forced-colors');
  await target.locator('.sk-form-select').focus();
  await expect(target).toHaveScreenshot('sk-form-select-forced-colors.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

const checkboxChoiceGroupStory = async (
  page: Page,
  id: string,
  viewport: { width: number; height: number } = { width: 720, height: 640 },
): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=form-skcheckboxchoicegroup-html--${id}&viewMode=story`);
  const target = page.locator('[data-checkbox-choice-group-story-frame]').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target.locator('fieldset.sk-checkbox-choice-group')).toBeVisible();
  return target;
};

const checkboxChoiceGroupVisuals = [
  [
    'default-dark',
    'sk-checkbox-choice-group-default-dark.png',
    { width: 1024, height: 720 },
  ],
  [
    'light-mode',
    'sk-checkbox-choice-group-light.png',
    { width: 1024, height: 720 },
  ],
  [
    'k-3-detailed-lane-filters',
    'sk-checkbox-choice-group-k3.png',
    { width: 1024, height: 800 },
  ],
  [
    'narrow',
    'sk-checkbox-choice-group-narrow.png',
    { width: 390, height: 844 },
  ],
  [
    'long-content',
    'sk-checkbox-choice-group-long-content.png',
    { width: 390, height: 844 },
  ],
  [
    'disabled-choices',
    'sk-checkbox-choice-group-disabled.png',
    { width: 720, height: 480 },
  ],
] as const;

for (const [id, snapshot, viewport] of checkboxChoiceGroupVisuals) {
  test(`SK-checkbox-choice-group ${id} — visual baseline`, async ({ page }) => {
    const target = await checkboxChoiceGroupStory(page, id, viewport);
    const geometry = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        documentScrollWidth: scroller.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(geometry.documentScrollWidth).toBeLessThanOrEqual(geometry.viewportWidth);
    await expect(target).toHaveScreenshot(snapshot, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    });
  });
}

test('SK-checkbox-choice-group focus — visual baseline', async ({ page }) => {
  const target = await checkboxChoiceGroupStory(page, 'focus-states');
  const control = target.locator('.sk-checkbox-choice-group__control:not(:checked)').first();
  await control.focus();
  await expect(control).toBeFocused();
  await expect(target).toHaveScreenshot('sk-checkbox-choice-group-focus.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-checkbox-choice-group forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const target = await checkboxChoiceGroupStory(page, 'forced-colors');
  const control = target.locator('.sk-checkbox-choice-group__control:not(:disabled)').last();
  await control.focus();
  await expect(control).toBeFocused();
  await expect(target).toHaveScreenshot('sk-checkbox-choice-group-forced-colors.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

const segmentedChoiceStory = async (
  page: Page,
  id: string,
  viewport: { width: number; height: number } = { width: 720, height: 320 },
): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=components-sksegmentedchoice-html--${id}&viewMode=story`);
  const target = page.locator('[data-segmented-choice-story-frame]').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target.getByRole('group')).toBeVisible();
  return target;
};

test('SK-segmented-choice selected — visual baseline', async ({ page }) => {
  const target = await segmentedChoiceStory(page, 'default');
  await expect(target).toHaveScreenshot('sk-segmented-choice-selected.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-segmented-choice unselected — visual baseline', async ({ page }) => {
  const target = await segmentedChoiceStory(page, 'no-selection');
  await expect(target).toHaveScreenshot('sk-segmented-choice-unselected.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-segmented-choice hover — visual baseline', async ({ page }) => {
  const target = await segmentedChoiceStory(page, 'default');
  await target.locator('.sk-segmented-choice__item').nth(1).hover();
  await expect(target).toHaveScreenshot('sk-segmented-choice-hover.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-segmented-choice active — visual baseline', async ({ page }) => {
  const target = await segmentedChoiceStory(page, 'default');
  const item = target.locator('.sk-segmented-choice__item').nth(1);
  const box = await item.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  try {
    await expect(target).toHaveScreenshot('sk-segmented-choice-active.png', {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    });
  } finally {
    await page.mouse.up();
  }
});

test('SK-segmented-choice disabled — visual baseline', async ({ page }) => {
  const target = await segmentedChoiceStory(page, 'one-disabled');
  await expect(target).toHaveScreenshot('sk-segmented-choice-disabled.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-segmented-choice focus — visual baseline', async ({ page }) => {
  const target = await segmentedChoiceStory(page, 'default');
  await page.keyboard.press('Tab');
  await expect(target.locator('.sk-segmented-choice__item').first()).toBeFocused();
  await expect(target).toHaveScreenshot('sk-segmented-choice-focus.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-segmented-choice long content — visual baseline', async ({ page }) => {
  const target = await segmentedChoiceStory(page, 'long-labels', { width: 390, height: 420 });
  await expect(target).toHaveScreenshot('sk-segmented-choice-long-content.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-segmented-choice dark — visual baseline', async ({ page }) => {
  const target = await segmentedChoiceStory(page, 'default-dark');
  await expect(target).toHaveScreenshot('sk-segmented-choice-dark.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-segmented-choice light — visual baseline', async ({ page }) => {
  const target = await segmentedChoiceStory(page, 'light-mode');
  await expect(target).toHaveScreenshot('sk-segmented-choice-light.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-segmented-choice forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const target = await segmentedChoiceStory(page, 'forced-colors');
  await target.locator('.sk-segmented-choice__item').nth(2).focus();
  await expect(target).toHaveScreenshot('sk-segmented-choice-forced-colors.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

const contextNavStory = async (
  page: Page,
  id: string,
  viewport: { width: number; height: number } = { width: 720, height: 720 },
): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=navigation-skcontextnav-html--${id}&viewMode=story`);
  const target = page.locator('[data-context-nav-story-frame]').first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await expect(target.locator('nav.sk-context-nav')).toBeVisible();
  return target;
};

const contextNavVisuals = [
  ['default', 'sk-context-nav-default-dark.png', { width: 720, height: 720 }],
  ['current-nested', 'sk-context-nav-current-nested.png', { width: 720, height: 720 }],
  ['long-labels', 'sk-context-nav-long-labels-240.png', { width: 390, height: 720 }],
  ['light-mode', 'sk-context-nav-light.png', { width: 720, height: 720 }],
  [
    'unavailable-mixed',
    'sk-context-nav-unavailable-mixed-dark.png',
    { width: 720, height: 720 },
  ],
  [
    'unavailable-long',
    'sk-context-nav-unavailable-long-240.png',
    { width: 390, height: 720 },
  ],
  [
    'unavailable-light-mode',
    'sk-context-nav-unavailable-light.png',
    { width: 720, height: 720 },
  ],
] as const;

for (const [id, snapshot, viewport] of contextNavVisuals) {
  test(`SK-context-nav ${id} — visual baseline`, async ({ page }) => {
    const target = await contextNavStory(page, id, viewport);
    await expect(target).toHaveScreenshot(snapshot, { threshold: 0.02, maxDiffPixelRatio: 0.02 });
  });
}

test('SK-context-nav forced colors — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const target = await contextNavStory(page, 'forced-colors');
  await target.locator('.sk-context-nav__link[aria-current]').focus();
  await expect(target).toHaveScreenshot('sk-context-nav-forced-colors.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  });
});

test('SK-context-nav unavailable forced colors — visual baseline', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const target = await contextNavStory(page, 'unavailable-forced-colors', {
    width: 390,
    height: 720,
  });
  await expect(target).toHaveScreenshot(
    'sk-context-nav-unavailable-forced-colors.png',
    {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    },
  );
});

type TeamOverviewStoryId =
  | 'default'
  | 'light-mode'
  | 'narrow'
  | 'scale-50-w-ps'
  | 'controlled-interactions'
  | 'empty-partial-data';

// #150 visual authority is the operator-supplied 1123×1600 capture at
// /tmp/codex-clipboard-LwdjJW.png (sha256
// ca08a0cbe1120233a1619d6b58da1bc2b84e3b9edeea41aff24a151321dbef04). It is
// not an authenticated clean-v4 export. Flow-health comparison also uses #149's committed
// sk-transition-matrix-approved-dark baseline (sha256
// 870eb7c6aff160a324d2477cfcc2b00ecfa0d3e16a6f7eeb8826082df339d277). New baselines below
// remain CI-authoritative and require explicit visual disposition before acceptance.

const teamOverviewPatternStory = async (
  page: Page,
  id: TeamOverviewStoryId,
  width: number,
  height: number,
): Promise<Locator> => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=patterns-team-overview--${id}&viewMode=story`);
  const root = page.locator('[data-team-overview-pattern]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  await page.evaluate(() => document.fonts.ready);
  await expect(root.locator('sk-app-shell')).toBeVisible();
  await expect(root.locator('sk-evidence-chain').locator('[part~="list"]')).toBeVisible();
  await expect(root.locator('sk-bar-chart').locator('[part~="chart"]')).toBeVisible();
  await expect(root.locator('sk-transition-matrix').locator('[part~="table"]')).toBeVisible();
  if (id === 'controlled-interactions') {
    await expect(root).toHaveAttribute('data-play-proof', 'passed');
  }
  return root;
};

const teamOverviewFullCases = [
  { id: 'default', width: 1280, height: 1600, name: 'team-overview-approved-dark-1280.png' },
  { id: 'default', width: 1440, height: 1600, name: 'team-overview-approved-dark-1440.png' },
  { id: 'light-mode', width: 1440, height: 1600, name: 'team-overview-light-1440.png' },
  { id: 'narrow', width: 390, height: 844, name: 'team-overview-narrow-390.png' },
  { id: 'scale-50-w-ps', width: 1440, height: 1200, name: 'team-overview-scale-50-wps.png' },
  { id: 'controlled-interactions', width: 1440, height: 1200, name: 'team-overview-controlled-interactions.png' },
  { id: 'empty-partial-data', width: 1440, height: 1200, name: 'team-overview-empty-partial-data.png' },
] as const satisfies ReadonlyArray<{
  id: TeamOverviewStoryId;
  width: number;
  height: number;
  name: string;
}>;

for (const visual of teamOverviewFullCases) {
  test(`Team overview ${visual.name} — full pattern baseline`, async ({ page }) => {
    const root = await teamOverviewPatternStory(page, visual.id, visual.width, visual.height);
    await expect(root).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    });
  });
}

const teamOverviewFocusedCases = [
  { id: 'default', region: 'rail-identity', name: 'team-overview-rail-identity.png' },
  { id: 'default', region: 'delivery-evidence', name: 'team-overview-delivery-evidence.png' },
  { id: 'default', region: 'return-chart', name: 'team-overview-return-chart.png' },
  { id: 'scale-50-w-ps', region: 'flow-matrix', name: 'team-overview-flow-matrix.png' },
] as const;

for (const visual of teamOverviewFocusedCases) {
  test(`Team overview ${visual.region} — focused baseline`, async ({ page }) => {
    const root = await teamOverviewPatternStory(page, visual.id, 1440, 1600);
    const region = root.locator(`[data-visual-region="${visual.region}"]`).first();
    await region.waitFor({ state: 'visible', timeout: 20000 });
    await expect(region).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    });
  });
}

const detailStory = async (
  page: Page,
  storyId: string,
  selector: string,
  viewport: { width: number; height: number } = { width: 960, height: 720 },
): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
  const target = page.locator(selector).first();
  await target.waitFor({ state: 'visible', timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  return target;
};

test('SK-check-bullet active forced colors retains visible, distinct complete and pending state', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Playwright forced-colors emulation is Chromium-owned');
  await page.emulateMedia({ forcedColors: 'active' });
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  const root = await detailStory(page, 'elements-skcheckbullet--mixed', '#storybook-root');
  await page.evaluate(() => customElements.whenDefined('sk-check-bullet'));
  const bullets = root.locator('sk-check-bullet');
  const presentations = await Promise.all(
    [bullets.nth(0), bullets.nth(2)].map(async (bullet) => {
      const icon = bullet.locator('[part="icon"]');
      const box = await icon.boundingBox();
      return {
        glyph: await icon.textContent(),
        label: await bullet.locator('.sk-check-bullet__state').textContent(),
        color: await icon.evaluate((node) => getComputedStyle(node).color),
        fontWeight: await icon.evaluate((node) => getComputedStyle(node).fontWeight),
        width: box?.width ?? 0,
        height: box?.height ?? 0,
      };
    }),
  );
  expect(presentations[0].glyph).toBe('✓');
  expect(presentations[0].label).toBe('Complete');
  expect(presentations[1].glyph).toBe('○');
  expect(presentations[1].label).toBe('Pending');
  expect(presentations[0].glyph).not.toBe(presentations[1].glyph);
  for (const presentation of presentations) {
    expect(presentation.color).not.toBe('rgba(0, 0, 0, 0)');
    expect(Number(presentation.fontWeight)).toBeGreaterThanOrEqual(700);
    expect(presentation.width).toBeGreaterThan(0);
    expect(presentation.height).toBeGreaterThan(0);
  }
});

const workPackageDetailVisuals = [
  {
    id: 'primitives-skbreadcrumbs-html--default',
    selector: '.sk-breadcrumbs',
    name: 'sk-breadcrumbs-default-dark.png',
    viewport: { width: 960, height: 480 },
  },
  {
    id: 'primitives-skbreadcrumbs-html--light-mode',
    selector: '.sk-light',
    name: 'sk-breadcrumbs-light.png',
    viewport: { width: 960, height: 480 },
  },
  {
    id: 'primitives-skbreadcrumbs-html--long-labels',
    selector: '.sk-breadcrumbs',
    name: 'sk-breadcrumbs-long-narrow.png',
    viewport: { width: 320, height: 480 },
  },
  {
    id: 'primitives-skprose-html--prompt',
    selector: '.sk-prose',
    name: 'sk-prose-prompt-dark.png',
    viewport: { width: 960, height: 720 },
  },
  {
    id: 'primitives-skprose-html--light-mode',
    selector: '.sk-light',
    name: 'sk-prose-light.png',
    viewport: { width: 960, height: 720 },
  },
  {
    id: 'primitives-skprose-html--long-code',
    selector: '.sk-prose',
    name: 'sk-prose-long-code-narrow.png',
    viewport: { width: 360, height: 720 },
  },
  {
    id: 'primitives-skeventtimeline-html--default',
    selector: '.sk-event-timeline',
    name: 'sk-event-timeline-default-dark.png',
    viewport: { width: 960, height: 720 },
  },
  {
    id: 'primitives-skeventtimeline-html--light-mode',
    selector: '.sk-light',
    name: 'sk-event-timeline-light.png',
    viewport: { width: 960, height: 720 },
  },
  {
    id: 'primitives-skeventtimeline-html--twenty-events',
    selector: '.sk-event-timeline',
    name: 'sk-event-timeline-twenty-events.png',
    viewport: { width: 960, height: 1200 },
  },
  {
    id: 'elements-skcheckbullet--mixed',
    selector: '#storybook-root',
    name: 'sk-check-bullet-state-mixed.png',
    viewport: { width: 720, height: 480 },
  },
  {
    id: 'elements-skcheckbullet--light-mode',
    selector: '.sk-light',
    name: 'sk-check-bullet-state-light.png',
    viewport: { width: 720, height: 480 },
  },
  {
    id: 'elements-skcheckbullet--long-items',
    selector: '#storybook-root',
    name: 'sk-check-bullet-state-long-narrow.png',
    viewport: { width: 320, height: 720 },
  },
] as const;

for (const visual of workPackageDetailVisuals) {
  test(`Work package detail ${visual.name} — targeted visual baseline`, async ({ page }) => {
    const target = await detailStory(page, visual.id, visual.selector, visual.viewport);
    await expect(target).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    });
  });
}

type WorkPackagePatternStoryId =
  | 'default'
  | 'light-mode'
  | 'all-lanes-empty'
  | 'scale-50-work-packages'
  | 'live-claim'
  | 'stale-claim'
  | 'snapshot-behind-log'
  | 'narrow-overview'
  | 'detail-populated'
  | 'detail-light-mode'
  | 'detail-no-subtasks'
  | 'detail-absent-prompt'
  | 'detail-history-unavailable'
  | 'detail-long-content'
  | 'detail-narrow';

const workPackagePatternStory = async (
  page: Page,
  id: WorkPackagePatternStoryId,
  width: number,
  height: number,
): Promise<Locator> => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=patterns-work-package-views--${id}&viewMode=story`);
  const root = page.locator('[data-work-package-overview], [data-work-package-detail]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  await page.evaluate(() => document.fonts.ready);
  return root;
};

const workPackagePatternFullCases = [
  { id: 'default', width: 1280, height: 1000, name: 'work-package-overview-dark-1280.png' },
  { id: 'light-mode', width: 1280, height: 1000, name: 'work-package-overview-light-1280.png' },
  { id: 'narrow-overview', width: 390, height: 844, name: 'work-package-overview-narrow-390.png' },
  { id: 'all-lanes-empty', width: 1280, height: 900, name: 'work-package-overview-empty-lanes.png' },
  { id: 'scale-50-work-packages', width: 1440, height: 1000, name: 'work-package-overview-scale-50.png' },
  { id: 'detail-populated', width: 1280, height: 1100, name: 'work-package-detail-dark-1280.png' },
  { id: 'detail-light-mode', width: 1280, height: 1100, name: 'work-package-detail-light-1280.png' },
  { id: 'detail-narrow', width: 390, height: 1000, name: 'work-package-detail-narrow-390.png' },
] as const satisfies ReadonlyArray<{
  id: WorkPackagePatternStoryId;
  width: number;
  height: number;
  name: string;
}>;

for (const visual of workPackagePatternFullCases) {
  test(`Work Package pattern ${visual.name} — full route baseline`, async ({ page }) => {
    const root = await workPackagePatternStory(page, visual.id, visual.width, visual.height);
    await expect(root).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    });
  });
}

const workPackagePatternFocusedCases = [
  { id: 'default', selector: '[data-work-package-progress]', name: 'work-package-overview-progress.png' },
  { id: 'scale-50-work-packages', selector: '.sk-workflow-board', name: 'work-package-overview-board-overflow.png' },
  { id: 'live-claim', selector: '[data-claim-state="live"]', name: 'work-package-overview-live-claim.png' },
  { id: 'stale-claim', selector: '[data-claim-state="stale"]', name: 'work-package-overview-stale-claim.png' },
  { id: 'snapshot-behind-log', selector: '[data-snapshot-notice]', name: 'work-package-overview-snapshot-notice.png' },
  { id: 'detail-populated', selector: '.sk-work-package-pattern__checklist', name: 'work-package-detail-checklist-states.png' },
  { id: 'detail-populated', selector: '.sk-event-timeline', name: 'work-package-detail-history-connector.png' },
  { id: 'detail-no-subtasks', selector: '[data-no-subtasks]', name: 'work-package-detail-no-subtasks.png' },
  { id: 'detail-absent-prompt', selector: '[data-absent-prompt]', name: 'work-package-detail-absent-prompt.png' },
  { id: 'detail-history-unavailable', selector: '[data-history-unavailable]', name: 'work-package-detail-history-unavailable.png' },
  { id: 'detail-long-content', selector: '[data-long-code]', name: 'work-package-detail-long-code.png' },
] as const satisfies ReadonlyArray<{
  id: WorkPackagePatternStoryId;
  selector: string;
  name: string;
}>;

for (const visual of workPackagePatternFocusedCases) {
  test(`Work Package pattern ${visual.name} — focused route state`, async ({ page }) => {
    const root = await workPackagePatternStory(page, visual.id, 1280, 1100);
    const region = root.locator(visual.selector).first();
    await region.waitFor({ state: 'visible', timeout: 20000 });
    await expect(region).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
    });
  });
}

type MissionReadingStoryId =
  | 'default'
  | 'm-2-responsive-390'
  | 'm-2-controlled-drawer-open'
  | 'm-3-fragment-loading'
  | 'm-4-canonical-page-unavailable'
  | 'm-5-snapshot-behind-log'
  | 'm-6-a-other-artifacts-present'
  | 'm-6-b-other-artifacts-absent'
  | 'm-7-a-ops-present'
  | 'm-7-b-ops-absent'
  | 'm-8-truth-regions'
  | 'light-mode'
  | 'long-content';

const missionReadingStory = async (
  page: Page,
  id: MissionReadingStoryId,
  viewport: Readonly<{ width: number; height: number }>,
): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=patterns-mission-reading--${id}&viewMode=story`);
  const root = page.locator('[data-mission-reading-pattern]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  await page.evaluate(() => document.fonts.ready);
  return root;
};

const missionReadingFullCases = [
  { id: 'default', width: 1440, height: 1024, name: 'sk-mission-reading-m1-desktop-dark.png' },
  { id: 'm-2-responsive-390', width: 390, height: 844, name: 'sk-mission-reading-m2-responsive-390.png' },
  { id: 'm-2-controlled-drawer-open', width: 390, height: 844, name: 'sk-mission-reading-m2-drawer-open-390.png' },
  { id: 'm-3-fragment-loading', width: 1280, height: 1000, name: 'sk-mission-reading-m3-loading.png' },
  { id: 'm-4-canonical-page-unavailable', width: 1280, height: 1000, name: 'sk-mission-reading-m4-unavailable.png' },
  { id: 'm-5-snapshot-behind-log', width: 1280, height: 1000, name: 'sk-mission-reading-m5-snapshot-notice.png' },
  { id: 'm-6-a-other-artifacts-present', width: 1280, height: 1000, name: 'sk-mission-reading-m6a-artifacts-present.png' },
  { id: 'm-6-b-other-artifacts-absent', width: 1280, height: 1000, name: 'sk-mission-reading-m6b-artifacts-absent.png' },
  { id: 'm-7-a-ops-present', width: 1280, height: 1000, name: 'sk-mission-reading-m7a-ops-present.png' },
  { id: 'm-7-b-ops-absent', width: 1280, height: 1000, name: 'sk-mission-reading-m7b-ops-absent.png' },
  { id: 'm-8-truth-regions', width: 1440, height: 1200, name: 'sk-mission-reading-m8-truth-regions.png' },
  { id: 'light-mode', width: 1440, height: 1024, name: 'sk-mission-reading-light.png' },
  { id: 'long-content', width: 390, height: 1000, name: 'sk-mission-reading-long-390.png' },
] as const satisfies ReadonlyArray<{
  id: MissionReadingStoryId;
  width: number;
  height: number;
  name: string;
}>;

for (const visual of missionReadingFullCases) {
  test(`Mission Reading ${visual.name} — full route baseline`, async ({ page }) => {
    const root = await missionReadingStory(page, visual.id, { width: visual.width, height: visual.height });
    if (visual.id === 'm-2-controlled-drawer-open') {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await root.getByRole('link', { name: 'Back to repository' }).focus();
    }
    await expect(root).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
      timeout: 20000,
    });
  });
}

for (const width of [859, 860, 861] as const) {
  test(`Mission Reading threshold ${width}px — visual baseline`, async ({ page }) => {
    const root = await missionReadingStory(page, 'default', { width, height: 1000 });
    await expect(root).toHaveScreenshot(`sk-mission-reading-threshold-${width}.png`, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
      timeout: 20000,
    });
  });
}

test('Mission Reading forced colors unavailable entry — visual baseline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const root = await missionReadingStory(page, 'm-4-canonical-page-unavailable', { width: 1280, height: 1000 });
  const unavailable = root.locator(
    '[data-context-nav="desktop"] [data-catalogue-key="plan"] > .sk-context-nav__unavailable',
  );
  await expect(unavailable).toHaveScreenshot('sk-mission-reading-forced-colors-unavailable.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});

// This is an additional rendering stress baseline only. The mission's actual 200% browser-UI
// zoom evidence is captured separately with headed Chrome UI and native Ctrl+Plus key chords.
test('Mission Reading long content CSS zoom stress — visual baseline', async ({ page }) => {
  const root = await missionReadingStory(page, 'long-content', { width: 780, height: 1000 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await expect(root).toHaveScreenshot('sk-mission-reading-long-css-zoom-stress.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});

type MissionKanbanVisualStoryId =
  | 'default'
  | 'k-2-narrow-contained'
  | 'k-3-detailed-lane-filters'
  | 'k-4-snapshot-behind-log'
  | 'k-5-observed-not-yet-pushed'
  | 'k-6-stable-empty-board'
  | 'light-mode'
  | 'long-content'
  | 'forced-colors'
  | 'reduced-motion';

const missionKanbanVisuals = [
  { id: 'default', width: 1600, height: 1000, name: 'mission-kanban-k1-populated-desktop.png' },
  { id: 'k-2-narrow-contained', width: 390, height: 844, name: 'mission-kanban-k2-narrow-contained.png' },
  { id: 'k-3-detailed-lane-filters', width: 1440, height: 1100, name: 'mission-kanban-k3-detailed-lane-filters.png' },
  { id: 'k-4-snapshot-behind-log', width: 1600, height: 1100, name: 'mission-kanban-k4-snapshot-behind-log.png' },
  { id: 'k-5-observed-not-yet-pushed', width: 1600, height: 1100, name: 'mission-kanban-k5-observed-not-yet-pushed.png' },
  { id: 'k-6-stable-empty-board', width: 1600, height: 1000, name: 'mission-kanban-k6-stable-empty-board.png' },
  { id: 'light-mode', width: 1600, height: 1000, name: 'mission-kanban-light-mode.png' },
  { id: 'long-content', width: 780, height: 1200, name: 'mission-kanban-long-content.png' },
  { id: 'forced-colors', width: 1600, height: 1100, name: 'mission-kanban-forced-colors.png', forcedColors: true },
  { id: 'reduced-motion', width: 1600, height: 1000, name: 'mission-kanban-reduced-motion.png', reducedMotion: true },
] as const satisfies ReadonlyArray<{
  id: MissionKanbanVisualStoryId;
  width: number;
  height: number;
  name: `mission-kanban-${string}.png`;
  forcedColors?: boolean;
  reducedMotion?: boolean;
}>;

for (const visual of missionKanbanVisuals) {
  test(`Mission Kanban ${visual.id} — full pattern baseline`, async ({ page }) => {
    if ('forcedColors' in visual && visual.forcedColors) {
      await page.emulateMedia({ forcedColors: 'active' });
    }
    if ('reducedMotion' in visual && visual.reducedMotion) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
    await page.setViewportSize({ width: visual.width, height: visual.height });
    await page.goto(`/iframe.html?id=patterns-mission-kanban--${visual.id}&viewMode=story`);
    const root = page.locator('[data-mission-kanban-pattern]');
    await root.waitFor({ state: 'visible', timeout: 20000 });
    await expect(root).toHaveAttribute('data-render-complete', 'true');
    await expect(root).toHaveAttribute('data-play-proof', 'passed');
    await page.evaluate(() => document.fonts.ready);
    await expect(root).not.toBeEmpty();
    await expect(root).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
      timeout: 20000,
    });
  });
}

type RepositoryDossierStoryId =
  | 'default'
  | 'd-2-narrow-closed'
  | 'd-2-narrow-open'
  | 'd-4-cross-branch'
  | 'd-5-not-spec-kitty'
  | 'd-6-snapshot-behind-log'
  | 'd-7-indexing'
  | 'd-8-no-missions'
  | 'light-mode'
  | 'long-data'
  | 'progress-thresholds'
  | 'layout-threshold-860'
  | 'layout-threshold-861'
  | 'tracker-destinations'
  | 'forced-colors'
  | 'reduced-motion'
  | 'zoom-200'
  | 'zoom-400';

const repositoryDossierStory = async (
  page: Page,
  id: RepositoryDossierStoryId,
  viewport: Readonly<{ width: number; height: number }>,
): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=patterns-repository-dossier--${id}&viewMode=story`);
  const root = page.locator('[data-repository-dossier-pattern]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  await page.evaluate(() => document.fonts.ready);
  return root;
};

const repositoryDossierFullCases = [
  { id: 'default', width: 1440, height: 1024, name: 'sk-repository-dossier-d1-desktop-dark.png' },
  { id: 'd-2-narrow-closed', width: 390, height: 844, name: 'sk-repository-dossier-d2-closed-390.png' },
  { id: 'd-2-narrow-open', width: 390, height: 844, name: 'sk-repository-dossier-d2-open-390.png' },
  { id: 'd-4-cross-branch', width: 1440, height: 1024, name: 'sk-repository-dossier-d4-cross-branch.png' },
  { id: 'd-5-not-spec-kitty', width: 1440, height: 900, name: 'sk-repository-dossier-d5-not-spec-kitty.png' },
  { id: 'd-6-snapshot-behind-log', width: 1440, height: 1024, name: 'sk-repository-dossier-d6-snapshot-behind-log.png' },
  { id: 'd-7-indexing', width: 1440, height: 900, name: 'sk-repository-dossier-d7-indexing.png' },
  { id: 'd-8-no-missions', width: 1440, height: 1024, name: 'sk-repository-dossier-d8-no-missions.png' },
  { id: 'light-mode', width: 1440, height: 1024, name: 'sk-repository-dossier-light.png' },
  { id: 'long-data', width: 390, height: 1000, name: 'sk-repository-dossier-long-390.png' },
  { id: 'progress-thresholds', width: 1440, height: 1024, name: 'sk-repository-dossier-progress-thresholds.png' },
  { id: 'layout-threshold-860', width: 860, height: 900, name: 'sk-repository-dossier-layout-threshold-860.png' },
  { id: 'layout-threshold-861', width: 861, height: 900, name: 'sk-repository-dossier-layout-threshold-861.png' },
  { id: 'tracker-destinations', width: 1440, height: 1024, name: 'sk-repository-dossier-tracker-destinations.png' },
] as const satisfies ReadonlyArray<{
  id: RepositoryDossierStoryId;
  width: number;
  height: number;
  name: string;
}>;

for (const visual of repositoryDossierFullCases) {
  test(`Repository Dossier ${visual.name} — full route baseline`, async ({ page }) => {
    const root = await repositoryDossierStory(page, visual.id, {
      width: visual.width,
      height: visual.height,
    });
    if (visual.id === 'd-2-narrow-open') {
      await root.locator('[slot="compact-navigation"]')
        .getByRole('link', { name: 'Overview', exact: true }).focus();
    }
    await expect(root).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
      timeout: 20000,
    });
  });
}

test('Repository Dossier active forced colors — visual baseline', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Playwright forced-colors emulation is Chromium-owned');
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const root = await repositoryDossierStory(page, 'forced-colors', { width: 1440, height: 1024 });
  await root.locator('[data-context-nav="desktop"] [aria-current="page"]').focus();
  await expect(root).toHaveScreenshot('sk-repository-dossier-forced-colors.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});

test('Repository Dossier reduced motion indexing — visual baseline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const root = await repositoryDossierStory(page, 'reduced-motion', { width: 1440, height: 900 });
  await expect(root).toHaveScreenshot('sk-repository-dossier-reduced-motion.png', {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});

for (const zoom of [
  { id: 'zoom-200', value: '2', width: 780, name: 'sk-repository-dossier-zoom-200.png' },
  { id: 'zoom-400', value: '4', width: 1280, name: 'sk-repository-dossier-zoom-400.png' },
] as const) {
  test(`Repository Dossier ${zoom.value}00% CSS zoom stress — visual baseline`, async ({ page }) => {
    const root = await repositoryDossierStory(page, zoom.id, { width: zoom.width, height: 1000 });
    await page.evaluate((value) => { document.documentElement.style.zoom = value; }, zoom.value);
    await expect(root).toHaveScreenshot(zoom.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
      timeout: 20000,
    });
  });
}
type WorkExplorerStoryId =
  | "w-1-by-lane-desktop-dark"
  | "w-2-by-person-desktop-dark"
  | "w-3-by-type-desktop-dark"
  | "w-4-by-lane-1024-dark"
  | "w-5-by-lane-light-mode"
  | "w-6-filtered-empty-dark"
  | "w-7-no-active-work-dark"
  | "w-8-degraded-context-dark"
  | "w-9-loading-dark"
  | "w-10-no-admitted-repositories-dark";

const workExplorerStory = async (
  page: Page,
  id: WorkExplorerStoryId,
  viewport: Readonly<{ width: number; height: number }>,
): Promise<Locator> => {
  await page.goto("about:blank");
  await page.setViewportSize(viewport);
  await page.goto(
    `/iframe.html?id=patterns-work-explorer--${id}&viewMode=story`,
  );
  const root = page.locator("[data-work-explorer-pattern]").first();
  await root.waitFor({ state: "visible", timeout: 20000 });
  await expect(root).toHaveAttribute("data-render-complete", "true");
  await page.evaluate(() => document.fonts.ready);
  return root;
};

const workExplorerFullCases = [
  {
    id: "w-1-by-lane-desktop-dark",
    width: 1280,
    height: 1248,
    name: "work-explorer-w1-lane-dark.png",
  },
  {
    id: "w-2-by-person-desktop-dark",
    width: 1280,
    height: 1126,
    name: "work-explorer-w2-person-dark.png",
  },
  {
    id: "w-3-by-type-desktop-dark",
    width: 1280,
    height: 1126,
    name: "work-explorer-w3-type-dark.png",
  },
  {
    id: "w-4-by-lane-1024-dark",
    width: 1024,
    height: 1620,
    name: "work-explorer-w4-rail-1024.png",
  },
  {
    id: "w-5-by-lane-light-mode",
    width: 1280,
    height: 1248,
    name: "work-explorer-w5-light.png",
  },
  {
    id: "w-6-filtered-empty-dark",
    width: 1280,
    height: 1024,
    name: "work-explorer-w6-filtered-empty.png",
  },
  {
    id: "w-7-no-active-work-dark",
    width: 1280,
    height: 1024,
    name: "work-explorer-w7-no-work.png",
  },
  {
    id: "w-8-degraded-context-dark",
    width: 1280,
    height: 1024,
    name: "work-explorer-w8-degraded.png",
  },
  {
    id: "w-9-loading-dark",
    width: 1280,
    height: 1024,
    name: "work-explorer-w9-loading.png",
  },
  {
    id: "w-10-no-admitted-repositories-dark",
    width: 1280,
    height: 1024,
    name: "work-explorer-w10-no-repositories.png",
  },
] as const satisfies ReadonlyArray<{
  id: WorkExplorerStoryId;
  width: number;
  height: number;
  name: string;
}>;

for (const visual of workExplorerFullCases) {
  test(`Work Explorer ${visual.name} — full composition baseline`, async ({
    page,
  }) => {
    const root = await workExplorerStory(page, visual.id, {
      width: visual.width,
      height: visual.height,
    });
    await expect(root).toHaveScreenshot(visual.name, {
      threshold: 0.02,
      maxDiffPixelRatio: 0.02,
      timeout: 20000,
    });
  });
}

for (const width of [1099, 1100, 1101] as const) {
  test(`Work Explorer rail-preserving ${width}px threshold — visual baseline`, async ({
    page,
  }) => {
    const root = await workExplorerStory(page, "w-4-by-lane-1024-dark", {
      width,
      height: 1000,
    });
    await expect(root).toHaveScreenshot(
      `work-explorer-threshold-${width}.png`,
      {
        threshold: 0.02,
        maxDiffPixelRatio: 0.02,
        timeout: 20000,
      },
    );
  });
}

test("Work Explorer controlled collection and blocked exception — visual baseline", async ({
  page,
}) => {
  const root = await workExplorerStory(page, "w-1-by-lane-desktop-dark", {
    width: 1280,
    height: 1000,
  });
  const planned = root.locator('[data-work-group="planned"]');
  await expect(planned).toHaveScreenshot("work-explorer-collection-closed.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
  await planned.locator(".sk-collection__toggle").click();
  await page.mouse.move(0, 0);
  await expect(planned).toHaveScreenshot("work-explorer-collection-open.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await expect(root.locator("[data-blocked-exception]")).toHaveScreenshot(
    "work-explorer-blocked-forced-colors.png",
    { threshold: 0.02, maxDiffPixelRatio: 0.02, timeout: 20000 },
  );
});

test("Work Explorer focused native route and active filters — visual baseline", async ({
  page,
}) => {
  const root = await workExplorerStory(page, "w-1-by-lane-desktop-dark", {
    width: 1280,
    height: 1000,
  });
  await root.locator('[data-filter="repositoryId"]').selectOption("saas");
  await root.locator('[data-filter="personId"]').selectOption("noor");
  const plannedToggle = root.locator(
    '[data-work-group="planned"] .sk-collection__toggle',
  );
  await plannedToggle.focus();
  await page.keyboard.press("Enter");
  const focusedRow = root
    .locator('[data-work-group="planned"] sk-action-row[href]')
    .first();
  const focusedLink = focusedRow.getByRole("link");
  await page.keyboard.press("Tab");
  await expect(focusedLink).toBeFocused();
  expect(
    await focusedLink.evaluate((link) => link.matches(":focus-visible")),
  ).toBe(true);
  await expect(focusedLink).toHaveCSS("outline-style", "solid");
  await expect(focusedRow).toHaveScreenshot("work-explorer-focused-route.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
  await expect(
    root.locator(".sk-work-explorer-pattern__filters"),
  ).toHaveScreenshot("work-explorer-active-filters.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});

test("Work Explorer W4 controlled drawer open and dismissed — visual baselines", async ({
  page,
}) => {
  const root = await workExplorerStory(page, "w-4-by-lane-1024-dark", {
    width: 1024,
    height: 900,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const trigger = root.getByRole("button", { name: "Open team navigation" });
  await trigger.click();
  await expect(root).toHaveScreenshot("work-explorer-w4-drawer-open.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(root).toHaveScreenshot("work-explorer-w4-drawer-dismissed.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});

test("Work Explorer compact timeline and delayed context — visual baselines", async ({
  page,
}) => {
  const root = await workExplorerStory(page, "w-8-degraded-context-dark", {
    width: 1280,
    height: 1000,
  });
  await expect(root.locator('[data-truth-tier="activity"]')).toHaveScreenshot(
    "work-explorer-delayed-activity.png",
    { threshold: 0.02, maxDiffPixelRatio: 0.02, timeout: 20000 },
  );
});

test("Work Explorer loading stays static under reduced motion — visual baseline", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const root = await workExplorerStory(page, "w-9-loading-dark", {
    width: 1024,
    height: 900,
  });
  await expect(
    root.locator(".sk-work-explorer-pattern__layout"),
  ).toHaveScreenshot("work-explorer-loading-reduced-motion.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});

test("Work Explorer long supplied labels remain contained — visual baseline", async ({
  page,
}) => {
  const root = await workExplorerStory(page, "w-1-by-lane-desktop-dark", {
    width: 1024,
    height: 900,
  });
  await root
    .locator('[data-work-group="in-progress"] code[slot="reference"]')
    .first()
    .evaluate((element) => {
      element.textContent =
        "spec-kitty/EXPERIMENTAL-spec-kitty-saas-with-a-supplied-extraordinarily-long-repository-name";
    });
  await expect(
    root.locator(".sk-work-explorer-pattern__work"),
  ).toHaveScreenshot("work-explorer-long-content.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});

test("Work Explorer effective 200 percent CSS zoom stress — visual baseline", async ({
  page,
}) => {
  const root = await workExplorerStory(page, "w-4-by-lane-1024-dark", {
    width: 1024,
    height: 1000,
  });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect(root).toHaveScreenshot("work-explorer-css-zoom-200.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});

test("Work Explorer short viewport keeps focused work unobscured — visual baseline", async ({
  page,
}) => {
  const root = await workExplorerStory(page, "w-4-by-lane-1024-dark", {
    width: 1024,
    height: 480,
  });
  const toggle = root.locator('[data-work-group="in-progress"] .sk-collection__toggle');
  await toggle.focus();
  await expect(root).toHaveScreenshot("work-explorer-short-viewport-focus.png", {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    timeout: 20000,
  });
});
