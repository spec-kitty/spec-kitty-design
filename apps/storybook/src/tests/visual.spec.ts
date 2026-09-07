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
        node.style.alignSelf = 'stretch';
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
