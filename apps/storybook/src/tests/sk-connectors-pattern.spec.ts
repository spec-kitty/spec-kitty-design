import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { getViolations, injectAxe } from 'axe-playwright';

const STORY_PREFIX = 'patterns-connectors--';

// Built by construction from the exact index the Playwright webServer serves
// (apps/storybook/storybook-static/index.json — see playwright.config.ts), never
// by hand-listing canvas ids. A hand-list silently stops covering a family the
// moment a new canvas is added; this reads whatever actually shipped in the build.
const nonC5ConnectorsStoryIds = (): string[] => {
  const index = JSON.parse(readFileSync('apps/storybook/storybook-static/index.json', 'utf8')) as {
    entries: Record<string, { type: string }>;
  };
  return Object.keys(index.entries)
    .filter((id) => id.startsWith(STORY_PREFIX))
    .filter((id) => index.entries[id]?.type === 'story')
    .map((id) => id.slice(STORY_PREFIX.length))
    .filter((id) => !id.startsWith('c-5-gitlab-group'));
};

const loadStory = async (page: Page, id: string, width = 1440, height = 1000): Promise<Locator> => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${STORY_PREFIX}${id}&viewMode=story`);
  const root = page.locator('[data-connectors-pattern]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  await expect(root).toHaveAttribute('data-render-complete', 'true');
  return root;
};

// Pre-merge review 2026-09-11 (debugger-debbie, MINOR): the four "mutation-free submit never
// navigates" assertions used a fixed `page.waitForTimeout(250)` before checking the URL. CI runs
// `workers: 2` with `retries: 2`; a navigation that lands at, say, 300ms would read as a pass —
// a fail-open in exactly the assertions carrying FR-018. This actively waits the full window for
// ANY url change and only treats a timeout (no navigation observed across the whole window) as
// success, so slowness cannot masquerade as compliance the way a blind sleep-then-check could.
const assertNoNavigation = async (page: Page, before: string, timeout = 1000): Promise<void> => {
  await expect(page.waitForURL((url) => url.toString() !== before, { timeout })).rejects.toThrow();
  expect(page.url()).toBe(before);
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

  // FR-018: forms are mutation-free — every form present intercepts its own submit. Pre-merge
  // review 2026-09-11 (reviewer-renata) measured that a HARD-CODED expected count is silent about
  // its own premise: adding a 10th form with no `preventDefault` still passed a fixed
  // `toBe(9)` assertion. Fixed to derive both numbers from the SAME comment-stripped source, so a
  // new unguarded form changes `formCount` without changing `preventDefaultCount` and the
  // assertion catches the mismatch directly, whatever the count is. Comments are stripped (not
  // just excluded from a regex) because this file's OWN doc comments legitimately discuss
  // `<form>` in prose — a naive substring count over-counts against them.
  const stripComments = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<!:)\/\/.*$/gm, '');
  const strippedStories = stripComments(storiesSource);
  const formCount = (strippedStories.match(/<form\b/g) ?? []).length;
  const preventDefaultCount = (strippedStories.match(/@submit=\$\{\(event: Event\) => event\.preventDefault\(\)\}/g) ?? [])
    .length;
  expect(formCount).toBeGreaterThan(0);
  expect(preventDefaultCount).toBe(formCount);
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

  test('member sees the same provider CARD facts but no admin-only controls (FR-020)', async ({ page }) => {
    const adminRoot = await loadStory(page, 'c-2-operating-admin');
    const adminFacts = await adminRoot.locator('.sk-facts').allTextContents();

    const memberRoot = await loadStory(page, 'c-2-operating-member');
    const memberFacts = await memberRoot.locator('.sk-facts').allTextContents();

    // Scoped to the provider cards' `.sk-facts` specifically — the truly shared health/account/
    // mapping facts (FR-020). Relay status and the linked-account summary row are a documented,
    // deliberate exception (see the next test): admin-only FACTS, not controls stripped from a
    // shared fact — pre-merge review 2026-09-11 found the code's own comment claiming "permission
    // removes the control, not the row" while this exact field removed the row too.
    expect(memberFacts).toEqual(adminFacts);
    await expect(memberRoot.locator('sk-button', { hasText: 'Manage on GitHub' })).toHaveCount(0);
    await expect(memberRoot.locator('sk-action-row')).toHaveCount(0);
  });

  test('relay status and the linked-account row are admin-only BY DESIGN, not a stripped control', async ({
    page,
  }) => {
    const adminRoot = await loadStory(page, 'c-2-operating-admin');
    await expect(adminRoot.locator('sk-notice', { hasText: 'Relay status' })).toBeVisible();

    const memberRoot = await loadStory(page, 'c-2-operating-member');
    await expect(memberRoot.locator('sk-notice', { hasText: 'Relay status' })).toHaveCount(0);
    // The whole linked-account ROW is gone for a member, not just its disconnect control — the
    // row's own label/reference text (`sk-action-row`) is entirely absent, distinct from GitHub's
    // provider-card fact (also literally "acme-org") which members DO legitimately keep seeing.
    await expect(memberRoot.locator('sk-action-row')).toHaveCount(0);
  });

  test('mixed provider health: GitHub active, GitLab needs_reauth (issue-required, not all-success)', async ({
    page,
  }) => {
    // Pre-merge review 2026-09-11: both providers were 'active' before this fix, so C2 had zero
    // danger-tone coverage despite the spec's own FR-016 claiming C2 was independently verified.
    const root = await loadStory(page, 'c-2-operating-admin');
    await expect(root.locator('sk-status-indicator[tone="success"]')).toBeVisible();
    await expect(root.locator('sk-status-indicator[tone="danger"]')).toBeVisible();
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
    await assertNoNavigation(page, before);
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

test.describe('C5 — GitLab exactly-one group selection', () => {
  test('populated: exactly-one native radio semantics, no pre-checked selection', async ({ page }) => {
    const root = await loadStory(page, 'c-5-gitlab-group-populated');
    const radios = root.locator('input[type="radio"]');
    await expect(radios).toHaveCount(2);
    const name0 = await radios.nth(0).getAttribute('name');
    const name1 = await radios.nth(1).getAttribute('name');
    // Pre-merge review 2026-09-11 (reviewer-renata) measured that `expect(name0).toBe(name1)`
    // alone is true-by-construction when BOTH names are null (an unnamed radio is not a group at
    // all) — 57/57 tests stayed green with `name=${groupName}` deleted from the source. Assert
    // the name is non-empty FIRST, then prove the actual exactly-one BEHAVIOUR: checking both
    // inputs must leave exactly one checked, not two.
    expect(name0).toBeTruthy();
    expect(name0).toBe(name1);
    await expect(root.locator('input[type="radio"]:checked')).toHaveCount(0);
    await radios.nth(0).check();
    await radios.nth(1).check();
    await expect(root.locator('input[type="radio"]:checked')).toHaveCount(1);
    await expect(root.locator('fieldset.sk-radio-choice-group')).toHaveCount(1);
  });

  test('no-groups: honest empty state, no radio group rendered', async ({ page }) => {
    const root = await loadStory(page, 'c-5-gitlab-group-no-groups');
    await expect(root.locator('fieldset.sk-radio-choice-group')).toHaveCount(0);
    await expect(root.locator('.sk-empty-state')).toHaveCount(1);
  });

  test('validation: missing-selection message present, form still evidence-only', async ({ page }) => {
    const root = await loadStory(page, 'c-5-gitlab-group-validation');
    await expect(root.locator('sk-notice', { hasText: 'Please choose a GitLab group' })).toBeVisible();
    await expect(root.locator('form[data-mutation-free="true"]')).toHaveAttribute(
      'action',
      '/a/gl-select-team/connectors/install/00000000-0000-4000-8000-000000000005/gitlab-group/',
    );
  });

  test('connected-refresh-failed: shows the connected group and the refresh failure, no picker', async ({ page }) => {
    const root = await loadStory(page, 'c-5-gitlab-group-connected-refresh-failed');
    await expect(root.locator('fieldset.sk-radio-choice-group')).toHaveCount(0);
    await expect(root.locator('sk-notice', { hasText: 'Connected group: Acme' })).toBeVisible();
    await expect(root.locator('sk-notice', { hasText: 'Failed to refresh repositories' })).toBeVisible();
  });

  test('no submission-success theater: submitting never shows a success message and never navigates', async ({
    page,
  }) => {
    const root = await loadStory(page, 'c-5-gitlab-group-populated');
    const before = page.url();
    await root.locator('input[type="radio"]').first().check();
    await root.locator('form button[type="submit"]').click();
    await assertNoNavigation(page, before);
    await expect(root.getByText(/success|connected successfully/i)).toHaveCount(0);
  });

  test('only C5 exposes another-group connection / exactly-one selection (FR-013)', async ({ page }) => {
    const ids = nonC5ConnectorsStoryIds();
    // Floor: this must actually enumerate every other canvas family (C1-C4, C6-C9a,
    // C9b, light-mode), not silently degrade to an empty, vacuously-green loop if the
    // index read ever comes back empty.
    expect(ids.length).toBeGreaterThanOrEqual(30);
    for (const id of ids) {
      const root = await loadStory(page, id);
      await expect(root.locator('input[type="radio"]'), `${id} must not expose a radio group`).toHaveCount(0);
    }
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-5-gitlab-group-populated');
    await axeIsClean(page, 'c-5-gitlab-group-populated');
  });
});

test.describe('C9b — Slack public-channel selection', () => {
  test('populated: native select, option contract is "<id>|<name>"', async ({ page }) => {
    const root = await loadStory(page, 'c-9-b-slack-channel-populated');
    const select = root.locator('select.sk-form-select');
    await expect(select).toHaveCount(1);
    await expect(select.locator('option')).toHaveCount(6); // placeholder + 5 channels
    await expect(select.locator('option[value="C03TEAMMOMENTS|team-moments"]')).toHaveAttribute(
      'value',
      'C03TEAMMOMENTS|team-moments',
    );
  });

  test('empty: honest empty state, no select rendered', async ({ page }) => {
    const root = await loadStory(page, 'c-9-b-slack-channel-empty');
    await expect(root.locator('select.sk-form-select')).toHaveCount(0);
    await expect(root.locator('.sk-empty-state')).toHaveCount(1);
  });

  test('refused: shows the exact refusal message', async ({ page }) => {
    const root = await loadStory(page, 'c-9-b-slack-channel-refused');
    await expect(root.locator('sk-notice', { hasText: 'invalid_auth' })).toBeVisible();
  });

  test('rate-limited: shows the exact rate-limit message', async ({ page }) => {
    const root = await loadStory(page, 'c-9-b-slack-channel-rate-limited');
    await expect(root.locator('sk-notice', { hasText: 'asking us to slow down' })).toBeVisible();
  });

  test('incomplete: shows the incomplete-enumeration notice alongside the partial list', async ({ page }) => {
    const root = await loadStory(page, 'c-9-b-slack-channel-incomplete');
    await expect(root.locator('sk-notice', { hasText: 'may be incomplete' })).toBeVisible();
    await expect(root.locator('select option')).toHaveCount(4); // placeholder + 3 channels
  });

  test('outbound-only: no inbound preview, readback, or delivery-test control anywhere (FR-012)', async ({ page }) => {
    const root = await loadStory(page, 'c-9-b-slack-channel-populated');
    await expect(root.getByRole('button', { name: /preview|readback|test post|delivery test/i })).toHaveCount(0);
    await expect(root.getByRole('textbox')).toHaveCount(0); // no search/filter input exists
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-9-b-slack-channel-populated');
    await axeIsClean(page, 'c-9-b-slack-channel-populated');
  });
});

test.describe('C6 — installation detail shell', () => {
  test('admin and member shells share the section-nav strip, native semantics', async ({ page }) => {
    const admin = await loadStory(page, 'c-6-installation-admin-active');
    const nav = admin.locator('nav.sk-section-nav');
    await expect(nav).toHaveAttribute('aria-label', 'Installation navigation');
    const links = nav.locator('a.sk-section-nav__link');
    await expect(links).toHaveCount(3); // admin sees all three tabs
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);

    const member = await loadStory(page, 'c-6-installation-member-active');
    await expect(member.locator('nav.sk-section-nav a.sk-section-nav__link')).toHaveCount(2); // no Workspace scope
    // Pre-merge review 2026-09-11: `C6InstallationMemberActive` originally passed `activeTab:
    // 'workspace'`, a tab a member's `visibleTabs` never includes — the nav rendered with ZERO
    // `aria-current="page"` anywhere, an incoherent shell state nothing asserted. Fixed to land
    // members on Team accounts; this assertion is the one that would have caught the original bug.
    await expect(member.locator('nav.sk-section-nav a[aria-current="page"]')).toHaveCount(1);
  });

  test('needs_reauth/revoked map to danger and expose no recovery action (FR-016)', async ({ page }) => {
    for (const id of ['c-6-installation-health-needs-reauth', 'c-6-installation-health-revoked']) {
      const root = await loadStory(page, id);
      await expect(root.locator('sk-status-indicator[tone="danger"]')).toBeVisible();
      await expect(root.getByRole('button', { name: /reconnect|reauthoriz/i })).toHaveCount(0);
      await expect(root.getByRole('link', { name: /reconnect|reauthoriz/i })).toHaveCount(0);
    }
  });

  test('degraded maps to attention, not danger — tones are not interchangeable', async ({ page }) => {
    const root = await loadStory(page, 'c-6-installation-health-degraded');
    await expect(root.locator('sk-status-indicator[tone="attention"]')).toBeVisible();
    await expect(root.locator('sk-status-indicator[tone="danger"]')).toHaveCount(0);
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-6-installation-admin-active');
    await axeIsClean(page, 'c-6-installation-admin-active');
  });
});

test.describe('C7 — workspace scope tab', () => {
  test('member boundary: Workspace scope tab link is entirely absent, other tabs unaffected', async ({ page }) => {
    const root = await loadStory(page, 'c-7-workspace-scope-member-boundary');
    const linkTexts = await root.locator('nav.sk-section-nav a.sk-section-nav__link').allTextContents();
    expect(linkTexts).not.toContain('Workspace scope');
    expect(linkTexts).toContain('Project routing');
    expect(linkTexts).toContain('Team accounts');
  });

  test('installation shell facts stay identical for the member who cannot reach this tab (FR-020, C6-scoped)', async ({
    page,
  }) => {
    // Pre-merge review 2026-09-11 (debugger-debbie): this test's previous title and comment
    // claimed to prove C7's OWN workspace-scope facts (Discovered/Included) are unchanged by
    // role. They are not compared here. `c-7-workspace-scope-member-boundary` renders
    // `renderInstallationShell` (data-connectors-pattern="c6"), not `renderWorkspaceScope` — the
    // Workspace scope tab is admin-only (see the previous test), so no member ever renders C7's
    // own panel at all, and no genuine member-role C7 story can exist without fabricating a state
    // the real product never produces. What this test actually proves, honestly relabeled: the
    // shared C6 installation-shell facts (`.sk-facts` — health/account) are byte-identical whether
    // reached as an admin or as the member who is shown the C7-adjacent boundary shell instead.
    // C7's own Discovered/Included facts carry no role branch at all — selectWorkspaceScopeProjection
    // takes only (fixture, state), never a role — so there is nothing role-conditional in them to prove.
    const adminRoot = await loadStory(page, 'c-6-installation-admin-active');
    const adminFacts = await adminRoot.locator('.sk-facts').first().allTextContents();
    const memberRoot = await loadStory(page, 'c-7-workspace-scope-member-boundary');
    const memberFacts = await memberRoot.locator('.sk-facts').first().allTextContents();
    expect(memberFacts).toEqual(adminFacts);
  });

  test('empty: honest empty state, no fabricated containers', async ({ page }) => {
    const root = await loadStory(page, 'c-7-workspace-scope-empty');
    await expect(root.locator('table.sk-data-table')).toHaveCount(0);
    await expect(root.locator('.sk-empty-state')).toBeVisible();
  });

  test('unavailable: distinct from empty — an explicit unavailable message, not a zero count', async ({ page }) => {
    const root = await loadStory(page, 'c-7-workspace-scope-unavailable');
    await expect(root.getByText('Workspace scope unavailable')).toBeVisible();
    await expect(root.locator('.sk-facts', { hasText: 'Discovered' })).toHaveCount(0);
  });

  test('stale-after-refresh-failure: prior data persists distinctly from a fresh success', async ({ page }) => {
    const root = await loadStory(page, 'c-7-workspace-scope-stale-after-refresh-failure');
    // Pre-merge review 2026-09-11 (both lenses): the fixture's original refresh-failure message
    // named GitLab while this installation's provider is Linear. Fixed to a provider-neutral
    // string; this test now pins that corrected copy rather than the wrong one.
    await expect(
      root.locator('sk-notice', { hasText: 'Could not verify the workspace scope for this installation' }),
    ).toBeVisible();
    await expect(root.locator('table.sk-data-table tbody tr')).toHaveCount(2); // stale rows still shown
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-7-workspace-scope-populated');
    await axeIsClean(page, 'c-7-workspace-scope-populated');
  });
});

test.describe('C8 — project routing / admitted repositories', () => {
  test('active and disabled mappings, active and withdrawn repositories all render truthfully', async ({ page }) => {
    const root = await loadStory(page, 'c-8-project-routing-populated');
    await expect(root.locator('table.sk-data-table').first().locator('tbody tr')).toHaveCount(3);
    await expect(root.getByText('Purged — removed', { exact: false })).toBeVisible();
  });

  test('hard purge blocks automatic readmission — no tombstone-lift action anywhere (FR-015)', async ({ page }) => {
    const root = await loadStory(page, 'c-8-project-routing-populated');
    await expect(root.getByRole('button', { name: /re-?admit|restore|lift|un-?purge/i })).toHaveCount(0);
    await expect(root.getByRole('link', { name: /re-?admit|restore|lift|un-?purge/i })).toHaveCount(0);
  });

  test('hard-purge confirmation composes the public sk-confirm-dialog with the danger-secondary tone', async ({
    page,
  }) => {
    const root = await loadStory(page, 'c-8-project-routing-purge-confirm');
    const dialog = root.locator('sk-confirm-dialog');
    await expect(dialog).toHaveAttribute('confirm-variant', 'danger-secondary');
    await expect(dialog).toHaveAttribute('open', '');
    const confirmButton = dialog.locator('[part="confirm"]');
    await expect(confirmButton).toHaveClass(/sk-button--danger-secondary/);
  });

  test('/discovery/ is represented only as a compatibility-redirect fact, never a browse link, on every C8 state (FR-014)', async ({
    page,
  }) => {
    // Pre-merge review 2026-09-11 (reviewer-renata) measured that the source-text guard at the
    // top of this file cannot see a lit `href=${…}` binding (replacing the `<code>` rendering
    // with `<a href=${routing.discoveryRedirect.path}>Browse discovery</a>` still passed all 57
    // tests) and that running the rendered-DOM check on only ONE C8 story misses the rest. Run
    // the real assertion across every C8 state.
    for (const id of [
      'c-8-project-routing-populated',
      'c-8-project-routing-empty',
      'c-8-project-routing-validation',
      'c-8-project-routing-jira-rescue',
      'c-8-project-routing-purge-confirm',
    ]) {
      const root = await loadStory(page, id);
      await expect(root.locator('a[href*="/discovery/"]')).toHaveCount(0);
    }
    const populated = await loadStory(page, 'c-8-project-routing-populated');
    await expect(populated.getByText('/a/sm-team/connectors/discovery/', { exact: false })).toBeVisible();
  });

  test('no GitHub repository picker / no "Admit selected" anywhere (FR-011)', async ({ page }) => {
    const root = await loadStory(page, 'c-8-project-routing-populated');
    await expect(root.locator('input[type="checkbox"]')).toHaveCount(0);
    await expect(root.getByText('Admit selected', { exact: false })).toHaveCount(0);
  });

  test('empty: honest empty state, no fabricated mappings/repositories', async ({ page }) => {
    // Pre-merge review 2026-09-11 (minor finding): this state was exercised by no assertion, and
    // the render function had no empty-state branch for it at all — zero mappings/repositories
    // rendered nothing, rather than an honest "no project routing yet" message.
    const root = await loadStory(page, 'c-8-project-routing-empty');
    await expect(root.locator('table.sk-data-table')).toHaveCount(0);
    await expect(root.locator('.sk-empty-state')).toBeVisible();
  });

  test('validation: exact mapping-conflict message present', async ({ page }) => {
    const root = await loadStory(page, 'c-8-project-routing-validation');
    await expect(root.locator('sk-notice', { hasText: 'already mapped to project' })).toBeVisible();
  });

  test('jira-rescue: honest empty state names the manual rescue path', async ({ page }) => {
    const root = await loadStory(page, 'c-8-project-routing-jira-rescue');
    await expect(root.getByText('No Jira mappings discovered')).toBeVisible();
  });

  test('mapping toggle forms are mutation-free and never navigate', async ({ page }) => {
    const root = await loadStory(page, 'c-8-project-routing-populated');
    const before = page.url();
    await root.locator('form[data-mutation-free="true"] button[type="submit"]').first().click();
    await assertNoNavigation(page, before);
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-8-project-routing-populated');
    await axeIsClean(page, 'c-8-project-routing-populated');
  });
});

test.describe('C9a — team account links', () => {
  test('active links render without any destructive/danger tone', async ({ page }) => {
    const root = await loadStory(page, 'c-9-a-team-accounts-admin-active');
    await expect(root.locator('sk-status-indicator[tone="danger"]')).toHaveCount(0);
    await expect(root.locator('sk-action-row')).toHaveCount(2);
  });

  test('needs_reauth/revoked map to danger and expose no reauthorization action (FR-016)', async ({ page }) => {
    const root = await loadStory(page, 'c-9-a-team-accounts-admin-unhealthy');
    await expect(root.locator('sk-status-indicator[tone="danger"]')).toHaveCount(2); // needs_reauth + revoked
    await expect(root.getByRole('button', { name: /reconnect|reauthoriz|retry/i })).toHaveCount(0);
    await expect(root.getByRole('link', { name: /reconnect|reauthoriz|retry/i })).toHaveCount(0);
  });

  test('self-owned mutation only: the disconnect control appears on the viewer row alone', async ({ page }) => {
    const root = await loadStory(page, 'c-9-a-team-accounts-admin-unhealthy');
    const forms = root.locator('form[data-mutation-free="true"]');
    await expect(forms).toHaveCount(1); // 3 links, only "you" (Jeroen) gets a disconnect control
  });

  test('account activity (linkedAt) stays independent of authorization health (FR-022)', async ({ page }) => {
    // Pre-merge review 2026-09-11 (reviewer-renata): an earlier revision proved this clause using
    // `isViewer` as a stand-in for "activity", which only shows whether a row is the signed-in
    // user's own — not activity. `linkedAt` is the real fact. Jeroen's row carries the OLDEST
    // `linkedAt` (2026-08-19) paired with the FRESHEST danger health (needs_reauth) — if either
    // fact were derived from the other, this pairing could not exist.
    const root = await loadStory(page, 'c-9-a-team-accounts-admin-unhealthy');
    const viewerRow = root.locator('sk-action-row', { hasText: 'Jeroen' });
    await expect(viewerRow.locator('sk-status-indicator[tone="danger"]')).toBeVisible();
    await expect(viewerRow.getByText('Linked 2026-08-19')).toBeVisible();
    const lynnRow = root.locator('sk-action-row', { hasText: 'Lynn' });
    await expect(lynnRow.locator('sk-status-indicator[tone="danger"]')).toBeVisible(); // revoked
    await expect(lynnRow.getByText('Linked 2026-07-28')).toBeVisible(); // oldest link, also danger
  });

  test('expired maps to attention, not danger or success — tones are not interchangeable (FR-016)', async ({
    page,
  }) => {
    // Pre-merge review 2026-09-11 (debugger-debbie): the fold moved health→tone into
    // linkAuthTone(), the correct structural fix, but no test pinned the `attention` case —
    // only the `danger` pair. A ladder collapsed to `dangerHealth ? 'danger' : 'success'`
    // (expired shown as healthy) stayed 57/57 green until this assertion existed.
    const root = await loadStory(page, 'c-9-a-team-accounts-admin-unhealthy');
    const miaRow = root.locator('sk-action-row', { hasText: 'Mia' });
    await expect(miaRow.locator('sk-status-indicator[tone="attention"]')).toBeVisible();
    await expect(miaRow.locator('sk-status-indicator[tone="danger"]')).toHaveCount(0);
    await expect(miaRow.locator('sk-status-indicator[tone="success"]')).toHaveCount(0);
  });

  test('member-unlinked: own-link-start control available, no other member visible beyond the fixture', async ({
    page,
  }) => {
    const root = await loadStory(page, 'c-9-a-team-accounts-member-unlinked');
    await expect(root.getByRole('button', { name: 'Link your account' })).toBeVisible();
  });

  test('member-empty: honest empty state with the exact fixture copy', async ({ page }) => {
    const root = await loadStory(page, 'c-9-a-team-accounts-member-empty');
    await expect(root.getByText('No team members have linked their accounts yet.')).toBeVisible();
  });

  test('disconnect form is mutation-free and never navigates', async ({ page }) => {
    const root = await loadStory(page, 'c-9-a-team-accounts-admin-active');
    const before = page.url();
    await root.locator('form[data-mutation-free="true"] button[type="submit"]').first().click();
    await assertNoNavigation(page, before);
  });

  test('has zero WCAG 2.1 AA violations', async ({ page }) => {
    await loadStory(page, 'c-9-a-team-accounts-admin-active');
    await axeIsClean(page, 'c-9-a-team-accounts-admin-active');
  });
});

test('LightMode required system proof renders', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/iframe.html?id=${STORY_PREFIX}light-mode&viewMode=story`);
  const root = page.locator('[data-connectors-pattern]').first();
  await root.waitFor({ state: 'visible', timeout: 20000 });
  const wrapper = page.locator('.sk-light');
  await expect(wrapper).toHaveCount(1);
  // Pre-merge review 2026-09-11 (minor finding): the wrapper-presence check alone would pass over
  // a blank `.sk-light` with nothing inside it. Assert real content is actually there too.
  await expect(root.locator('h1')).toBeVisible();
  await expect(root).not.toBeEmpty();
});

// -------------------------------------------------------------------------------------------
// Viewport/preference coverage — pre-merge review 2026-09-11 (both lenses): every test above ran
// at loadStory's 1440 default; the issue explicitly requires forced-colors, reduced-motion, RTL,
// 390px, and 200% zoom. Functional (not just visual) assertions below; visual.spec.ts carries the
// corresponding screenshot baselines.
// -------------------------------------------------------------------------------------------

test.describe('Viewport and preference coverage', () => {
  test('390px: no document-level horizontal overflow on the four most content-dense canvases', async ({ page }) => {
    for (const id of [
      'c-2-operating-admin',
      'c-7-workspace-scope-populated',
      'c-8-project-routing-populated',
      'c-9-a-team-accounts-admin-unhealthy',
    ]) {
      await loadStory(page, id, 390, 844);
      const overflowsX = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflowsX, `${id} must have zero document-level horizontal overflow at 390px`).toBe(false);
    }
  });

  test('200% zoom: C8 project routing stays operable with zero document-level horizontal overflow', async ({
    page,
  }) => {
    const root = await loadStory(page, 'c-8-project-routing-populated');
    await page.evaluate(() => {
      (document.documentElement.style as CSSStyleDeclaration & { zoom?: string }).zoom = '2';
    });
    const overflowsX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflowsX, 'no document-level horizontal overflow at 200% zoom').toBe(false);
    await expect(root.locator('table.sk-data-table').first()).toBeVisible();
  });

  test('forced colors: C6 danger status keeps a visible, non-color-only distinction', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Playwright forced-colors emulation is Chromium-owned');
    await page.emulateMedia({ forcedColors: 'active' });
    const root = await loadStory(page, 'c-6-installation-health-needs-reauth');
    const indicator = root.locator('sk-status-indicator[tone="danger"]');
    await expect(indicator).toBeVisible();
    // The visible TEXT ("needs_reauth") is the non-color-dependent signal — forced colors strips
    // custom tone coloring, but the status word itself must still read.
    await expect(indicator).toHaveText('needs_reauth');
  });

  test('reduced motion: C3 handoff waiting/completing states carry no motion-dependent meaning', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const id of ['c-3-handoff-installation-waiting', 'c-3-handoff-reconnect-completing']) {
      const root = await loadStory(page, id);
      // The phase text itself (not an animation) carries the state under reduced motion.
      await expect(root.locator('sk-notice')).toBeVisible();
    }
  });

  test('RTL: C2 operating index keeps native semantics and legible content under dir="rtl"', async ({ page }) => {
    const root = await loadStory(page, 'c-2-operating-admin');
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await expect(root.locator('h1')).toBeVisible();
    await expect(root.locator('sk-card')).toHaveCount(2);
    const overflowsX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflowsX, 'no document-level horizontal overflow under RTL').toBe(false);
  });
});
