import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { getViolations, injectAxe } from 'axe-playwright';

const STORY_PREFIX = 'patterns-connectors--';

const loadStory = async (page: Page, id: string, width = 1440, height = 1000): Promise<Locator> => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${STORY_PREFIX}${id}&viewMode=story`);
  const root = page.locator('[data-connectors-pattern]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  return root;
};

const axeIsClean = async (page: Page, storyId: string): Promise<void> => {
  await injectAxe(page);
  let violations: Awaited<ReturnType<typeof getViolations>> = [];
  await expect
    .poll(async () => {
      try {
        violations = await getViolations(page, 'body', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
        return 'ready';
      } catch (error) {
        if (String(error).includes('Axe is already running')) return 'busy';
        throw error;
      }
    })
    .toBe('ready');
  expect(violations, `${storyId} must have zero WCAG 2.1 AA violations`).toEqual([]);
};

// -------------------------------------------------------------------------------------------
// Source-boundary tests — no browser required, mirror the established convention in
// sk-team-overview-pattern.spec.ts and sk-repository-dossier-pattern.spec.ts.
// -------------------------------------------------------------------------------------------

test('fixture and stories keep the pattern outside the public element and application boundaries', () => {
  const fixtureSource = readFileSync('packages/elements/src/patterns/connectors.fixture.ts', 'utf8');
  const storiesSource = readFileSync('packages/elements/src/patterns/connectors.stories.ts', 'utf8');
  const source = `${fixtureSource}\n${storiesSource}`;

  expect(source).not.toMatch(/<sk-connectors(?:\s|>)/);
  expect(source).not.toMatch(/customElements\.define\s*\(/);
  expect(source).not.toMatch(/\.shadowRoot\b/);
  expect(source).not.toMatch(/\.renderRoot\b/);
  expect(source).not.toMatch(/attachShadow\s*\(/);
  expect(source).not.toMatch(/from\s+['"][^'"]*team-kitty/i);
  expect(source).not.toMatch(/\b(?:fetch|setTimeout|setInterval)\s*\(/);
  expect(source).not.toMatch(/\bnew\s+Date\s*\(/);
  expect(fixtureSource).toContain('deepFreeze');
  expect(fixtureSource).toContain('healthTone');

  // FR-011: no GitHub repository picker markup anywhere in source (checked against rendered DOM
  // too, below — this only checks the mechanical construct, not prose discussing the boundary).
  expect(source).not.toMatch(/type="checkbox"/);
  // FR-014: /discovery/ never appears as a link target.
  expect(source).not.toMatch(/href=.*\/discovery\//);
  // FR-018: forms are mutation-free — every form present intercepts its own submit.
  // Two real rendered forms (C2's disconnect form, C3's entry form) — counted from the template
  // markup only, not from doc-comment mentions of `<form>` (the header comments above legitimately
  // discuss forms in prose, which a naive "<form" substring count would over-count).
  const preventDefaultCount = (storiesSource.match(/@submit=\$\{\(event: Event\) => event\.preventDefault\(\)\}/g) ?? [])
    .length;
  expect(preventDefaultCount).toBe(2);
});

// -------------------------------------------------------------------------------------------
// Browser tests — render each unblocked canvas and assert the reachable truth boundaries.
// -------------------------------------------------------------------------------------------

test.describe('C1 — setup index', () => {
  test('shows the real gaps, never a fabricated all-clear', async ({ page }) => {
    const root = await loadStory(page, 'c-1-setup-admin-empty');
    await expect(root.locator('sk-notice')).toHaveCount(3);
    await expect(root.locator('.sk-empty-state')).toHaveCount(0);
    await expect(root.locator('h1')).toHaveText('Connectors');
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-1-setup-admin-empty');
    await axeIsClean(page, 'c-1-setup-admin-empty');
  });
});

test.describe('C2 — operating index', () => {
  test('admin sees the manage action and the linked-account disconnect control', async ({ page }) => {
    const root = await loadStory(page, 'c-2-operating-admin');
    await expect(root.locator('sk-button', { hasText: 'Manage on GitHub' })).toBeVisible();
    await expect(root.locator('sk-action-row')).toHaveCount(1);
    await expect(root.locator('form[data-mutation-free="true"]')).toHaveCount(1);
  });

  test('member sees the same provider facts but no admin-only controls (FR-020)', async ({ page }) => {
    const adminRoot = await loadStory(page, 'c-2-operating-admin');
    const adminFacts = await adminRoot.locator('.sk-connectors-pattern__facts').allTextContents();

    const memberRoot = await loadStory(page, 'c-2-operating-member');
    const memberFacts = await memberRoot.locator('.sk-connectors-pattern__facts').allTextContents();

    expect(memberFacts).toEqual(adminFacts);
    await expect(memberRoot.locator('sk-button', { hasText: 'Manage on GitHub' })).toHaveCount(0);
    await expect(memberRoot.locator('sk-action-row')).toHaveCount(0);
  });

  test('no GitHub repository picker and no "Admit selected" control anywhere (FR-011)', async ({ page }) => {
    const root = await loadStory(page, 'c-2-operating-admin');
    await expect(root.locator('input[type="checkbox"]')).toHaveCount(0);
    await expect(root.getByText('Admit selected', { exact: false })).toHaveCount(0);
  });

  test('Slack is represented outbound-only, with no inbound control (FR-012)', async ({ page }) => {
    const root = await loadStory(page, 'c-2-operating-admin');
    await expect(root.locator('sk-notice', { hasText: 'Outbound only' })).toBeVisible();
    // "no inbound preview" as honest prose is correct (and expected in the not-ready message);
    // what FR-012 actually forbids is an inbound AFFORDANCE — a button, link, or form control that
    // would let a consumer preview, read back, or delivery-test a Slack message. None exists.
    await expect(root.getByRole('button', { name: /preview|readback|delivery test/i })).toHaveCount(0);
    await expect(root.getByRole('link', { name: /preview|readback|delivery test/i })).toHaveCount(0);
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-2-operating-admin');
    await axeIsClean(page, 'c-2-operating-admin');
  });
});

test.describe('C3 — provider authorization handoff', () => {
  test('the entry form carries the exact fixture method/action as evidence', async ({ page }) => {
    const root = await loadStory(page, 'c-3-handoff-installation-waiting');
    const form = root.locator('form[data-mutation-free="true"]');
    await expect(form).toHaveAttribute('method', 'GET');
    await expect(form).toHaveAttribute('action', '/a/sm-team/connectors/install/linear/');
  });

  test('submitting the entry form is intercepted and never navigates (FR-018)', async ({ page }) => {
    const root = await loadStory(page, 'c-3-handoff-installation-waiting');
    const before = page.url();
    await root.locator('form[data-mutation-free="true"] button[type="submit"]').click();
    await page.waitForTimeout(250);
    expect(page.url()).toBe(before);
  });

  test('the failed variant shows the source-exact failure text', async ({ page }) => {
    const root = await loadStory(page, 'c-3-handoff-user-link-failed');
    await expect(
      root.locator('sk-notice', { hasText: 'Installation failed: connection failed' }),
    ).toBeVisible();
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-3-handoff-reconnect-completing');
    await axeIsClean(page, 'c-3-handoff-reconnect-completing');
  });
});

test.describe('C4 — GitHub App setup failure', () => {
  test('resolved-Team variant renders the back route', async ({ page }) => {
    const root = await loadStory(page, 'c-4-github-app-failure-resolved-team');
    await expect(root.locator('.sk-connectors-pattern__back-link')).toHaveCount(1);
  });

  test('no-Team boundary variant omits the back route entirely (FR-004)', async ({ page }) => {
    const root = await loadStory(page, 'c-4-github-app-failure-no-team-boundary');
    await expect(root.locator('.sk-connectors-pattern__back-link')).toHaveCount(0);
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-4-github-app-failure-resolved-team');
    await axeIsClean(page, 'c-4-github-app-failure-resolved-team');
  });
});

test('LightMode required system proof renders', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/iframe.html?id=${STORY_PREFIX}light-mode&viewMode=story`);
  const root = page.locator('[data-connectors-pattern]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  const wrapper = page.locator('.sk-light');
  await expect(wrapper).toHaveCount(1);
});
