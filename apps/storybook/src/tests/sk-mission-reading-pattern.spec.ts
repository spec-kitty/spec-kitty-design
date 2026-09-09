import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";

const STORY_PREFIX = "patterns-mission-reading--";
const STORY_IDS = [
  "default",
  "m-2-responsive-390",
  "m-2-controlled-drawer-open",
  "m-3-fragment-loading",
  "m-4-canonical-page-unavailable",
  "m-5-snapshot-behind-log",
  "m-6-a-other-artifacts-present",
  "m-6-b-other-artifacts-absent",
  "m-7-a-ops-present",
  "m-7-b-ops-absent",
  "m-8-truth-regions",
  "light-mode",
  "long-content",
  "rtl",
] as const;

type StoryId = (typeof STORY_IDS)[number];

const openStory = async (
  page: Page,
  id: StoryId,
  viewport: Readonly<{ width: number; height: number }> = {
    width: 1440,
    height: 1024,
  },
): Promise<Locator> => {
  // Disconnect the prior route before a viewport change can notify its shell.
  await page.goto("about:blank");
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=${STORY_PREFIX}${id}&viewMode=story`);
  const root = page.locator("[data-mission-reading-pattern]").first();
  await root.waitFor({ state: "visible", timeout: 20_000 });
  await expect(root).toHaveAttribute("data-render-complete", "true");
  return root;
};

const documentGeometry = (page: Page) =>
  page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

const axeIsClean = async (page: Page, storyId: StoryId): Promise<void> => {
  await injectAxe(page);
  let violations: Awaited<ReturnType<typeof getViolations>> | undefined;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      violations = await getViolations(page, "body", {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      });
      break;
    } catch (error) {
      const storybookAxeIsRunning =
        error instanceof Error &&
        error.message.includes("Axe is already running");
      if (!storybookAxeIsRunning || attempt === 9) throw error;
      await page.waitForTimeout(100);
    }
  }
  expect(
    violations,
    `${storyId} must have zero WCAG 2.1 AA violations`,
  ).toEqual([]);
};

test("source is Storybook-only composition with no forbidden reader or application surface", () => {
  const source = readFileSync(
    "packages/elements/src/patterns/mission-reading.stories.ts",
    "utf8",
  );

  expect(source).not.toMatch(
    /<sk-(?:mission-reader|tier-badge|skeleton|spinner|artifact-row|ops-row|mission-row|link-list|truth-band|document-tree)(?:\s|>)/,
  );
  expect(source).not.toMatch(/customElements\.define\s*\(/);
  expect(source).not.toMatch(/\.shadowRoot\b|\.renderRoot\b|getRootNode\s*\(/);
  expect(source).not.toMatch(
    /\b(?:fetch|setTimeout|setInterval|requestAnimationFrame)\s*\(/,
  );
  expect(source).not.toMatch(
    /\b(?:localStorage|sessionStorage|Math\.random|new\s+Date)\b/,
  );
  expect(source).not.toMatch(/marked|markdown-it|sanitize|highlight\.js/i);
  const rawWidthMediaQueries = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("@media"))
    .filter((line) => line.includes("min-width") || line.includes("max-width"))
    .filter((line) => /\d(?:px|rem|em)\b/.test(line));
  expect(rawWidthMediaQueries).toEqual([]);
  expect(source).toContain("deepFreezeMissionReadingFixture");
  expect(source).toContain("MISSION_READING_FIXTURE");
  expect(source).toContain("projectMissionReading");
  expect(source).not.toContain("data-fixture-guards");
  expect(source).not.toContain("data-fixture-deeply-frozen");
  expect(source).toMatch(
    /excludeStories:\s*\[[\s\S]*["']renderMissionReading["']/,
  );
});

test("built index discovers the complete reviewed family and excludes fixture helpers", async ({
  request,
}) => {
  const response = await request.get("/index.json");
  expect(response.ok()).toBe(true);
  const index = (await response.json()) as {
    entries: Readonly<
      Record<string, Readonly<{ type: string; title: string }>>
    >;
  };
  const entries = Object.entries(index.entries)
    .filter(
      ([, entry]) =>
        entry.type === "story" && entry.title === "Patterns/Mission Reading",
    )
    .map(([id]) => id)
    .sort();

  expect(entries).toEqual(STORY_IDS.map((id) => `${STORY_PREFIX}${id}`).sort());
});

test("every story is non-empty, story-error-free, one-H1, and axe-clean", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    const source = message.location().url;
    const isKnownChromiumFontResolution =
      message.type() === "error" &&
      source.includes("/assets/fonts/") &&
      text ===
        "Failed to load resource: the server responded with a status of 404 (Not Found)";
    const isKnownFirefoxFontResolution =
      message.type() === "error" &&
      text.includes("downloadable font: download failed") &&
      text.includes("/assets/fonts/");
    if (
      message.type() === "error" &&
      !isKnownChromiumFontResolution &&
      !isKnownFirefoxFontResolution
    )
      errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const storyId of STORY_IDS) {
    const viewport = storyId.startsWith("m-2-")
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1024 };
    const root = await openStory(page, storyId, viewport);
    await expect(root).toBeVisible();
    await expect(root.locator("h1")).toHaveCount(1);
    await expect(root.getByRole("heading", { level: 2 }).first()).toBeVisible();
    expect(
      await root
        .locator("[aria-current]")
        .evaluateAll((elements) =>
          elements.every((element) => element instanceof HTMLAnchorElement),
        ),
    ).toBe(true);
    await expect(root.locator("sk-app-shell")).toHaveCount(1);
    await axeIsClean(page, storyId);
  }

  expect(errors).toEqual([]);
});

test("M1 composes only the approved public surfaces and native families", async ({
  page,
}) => {
  const root = await openStory(page, "default");
  const tags = await root
    .locator("*")
    .evaluateAll((elements) =>
      [
        ...new Set(
          elements
            .map((element) => element.tagName.toLowerCase())
            .filter((tag) => tag.startsWith("sk-")),
        ),
      ].sort(),
    );

  expect(tags).toEqual([
    "sk-app-shell",
    "sk-card",
    "sk-context-sidebar",
    "sk-page-header",
    "sk-personal-rail",
    "sk-pill-tag",
    "sk-section-header",
    "sk-status-indicator",
  ]);
  await expect(root.locator(".sk-context-nav")).toHaveCount(2);
  await expect(root.locator(".sk-breadcrumbs")).toHaveCount(1);
  await expect(root.locator(".sk-facts")).toHaveCount(1);
  await expect(root.locator(".sk-prose")).toHaveCount(1);
  await expect(root.locator(".sk-data-table")).toHaveCount(1);
  await expect(
    root.locator('sk-section-header > [slot="title"]').first(),
  ).toBeVisible();

  const desktopContext = root.locator('[slot="context-sidebar"]');
  const compactHeader = root.locator('[slot="compact-header"]');
  await expect(compactHeader).toHaveAttribute("inert", "");
  await expect(compactHeader).toHaveAttribute("aria-hidden", "true");
  const firstDestination = desktopContext.locator("a[href]").first();
  await expect(firstDestination).toHaveText("Back to repository");
  await expect(firstDestination).toHaveAttribute("href", "#repository");
  expect(
    await root
      .locator(".sk-mission-reading-pattern__content")
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          inlineStart: style.paddingInlineStart,
          inlineEnd: style.paddingInlineEnd,
        };
      }),
  ).toEqual({ inlineStart: "24px", inlineEnd: "24px" });
});

test("fixture invariants and exact-git truth are exposed from one deeply frozen source", async ({
  page,
}) => {
  const root = await openStory(page, "default");
  const evidence = await page.evaluate(async () => {
    const preview = (
      window as typeof window & {
        __STORYBOOK_PREVIEW__: {
          importFn: (path: string) => Promise<{
            MISSION_READING_FIXTURE: {
              catalogue: readonly Readonly<{ key: string }>[];
              git: Readonly<{ sha: string; branch: string }>;
              pushedMarker: Readonly<{
                sha: string;
                branch: string;
                pushedAt: string;
              }>;
              snapshot: Readonly<{ sha: string }>;
              ops: readonly Readonly<Record<string, string>>[];
              reportedLive: Readonly<Record<string, string>>;
            };
            projectMissionReading: (
              fixture: unknown,
              state: string,
            ) => Readonly<{
              content: string;
              snapshotBehind: boolean;
              page: Readonly<{ label: string }>;
              current: string | undefined;
            }>;
            selectPushedTime: (
              git: unknown,
              marker?: unknown,
            ) => string | undefined;
          }>;
        };
      }
    ).__STORYBOOK_PREVIEW__;
    const module = await preview.importFn(
      "./packages/elements/src/patterns/mission-reading.stories.ts",
    );
    const fixture = module.MISSION_READING_FIXTURE;
    const isDeeplyFrozen = (value: unknown): boolean => {
      if (value === null || typeof value !== "object") return true;
      return (
        Object.isFrozen(value) &&
        Object.values(value).every((child) => isDeeplyFrozen(child))
      );
    };
    const projections = {
      m3: module.projectMissionReading(fixture, "m3"),
      m5: module.projectMissionReading(fixture, "m5"),
      m6b: module.projectMissionReading(fixture, "m6b"),
      m7b: module.projectMissionReading(fixture, "m7b"),
      m8: module.projectMissionReading(fixture, "m8"),
    };
    return {
      deeplyFrozen: isDeeplyFrozen(fixture),
      catalogueKeys: fixture.catalogue.map(
        (entry: Readonly<{ key: string }>) => entry.key,
      ),
      loadingContent: projections.m3.content,
      snapshotBehind: projections.m5.snapshotBehind,
      snapshotSha: fixture.snapshot.sha,
      gitSha: fixture.git.sha,
      unmatchedPushedTime: module.selectPushedTime(fixture.git, {
        ...fixture.pushedMarker,
        sha: "not-the-selected-commit",
      }),
      matchingPushedTime: module.selectPushedTime(
        fixture.git,
        fixture.pushedMarker,
      ),
      m6bPage: projections.m6b.page.label,
      m6bCurrent: projections.m6b.current,
      m7bPage: projections.m7b.page.label,
      m7bCurrent: projections.m7b.current,
      m8Page: projections.m8.page.label,
      m8Current: projections.m8.current,
      opsFields: Object.keys(fixture.ops[0] ?? {}),
      liveHasWorkPackage: Object.hasOwn(fixture.reportedLive, "workPackage"),
    };
  });
  expect(evidence).toEqual({
    deeplyFrozen: true,
    catalogueKeys: [
      "overview",
      "specify",
      "plan",
      "tasks",
      "implement",
      "research",
      "contracts",
      "checklists",
      "quickstart",
      "data-model",
      "other",
      "ops",
    ],
    loadingContent: "loading",
    snapshotBehind: true,
    snapshotSha: "72c4e9a",
    gitSha: "72c4e9a",
    unmatchedPushedTime: undefined,
    matchingPushedTime: "2026-08-31 14:12 UTC",
    m6bPage: "Other artifacts",
    m6bCurrent: undefined,
    m7bPage: "Ops",
    m7bCurrent: undefined,
    m8Page: "Overview",
    m8Current: "overview",
    opsFields: ["invocation", "action", "status"],
    liveHasWorkPackage: false,
  });
  await expect(
    root.getByText("Collaborative Demo Team", { exact: true }),
  ).toHaveCount(1);
  await expect(
    root.getByText("Launch resilience tranche A", { exact: true }),
  ).toHaveCount(1);
  await expect(root.getByText("72c4e9a", { exact: true })).toHaveCount(1);
  await expect(
    root.getByText("feature/launch-resilience", { exact: true }),
  ).toHaveCount(1);
  await expect(root.getByText(/Pushed/)).toHaveCount(0);
});

test("catalogue keeps native links, static unavailable entries, bounded children, and terminal Ops", async ({
  page,
}) => {
  const root = await openStory(page, "default");
  const expectedAvailable = [
    ["overview", "#overview"],
    ["specify", "#specify"],
    ["plan", "#plan"],
    ["tasks", "#tasks"],
    ["implement", "#implement"],
    ["research", "#research"],
    ["contracts", "#contracts"],
    ["ops", "#ops"],
  ] as const;

  for (const placement of ["desktop", "compact"] as const) {
    const nav = root.locator(`[data-context-nav="${placement}"]`);
    const unavailable = nav.locator(".sk-context-nav__unavailable");

    await expect(nav.locator(":scope > div > ul > li")).toHaveCount(12);
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
    await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute(
      "href",
      "#specify",
    );
    await expect(unavailable).toHaveCount(4);
    for (const entry of await unavailable.all()) {
      await expect(entry).toHaveAttribute("aria-disabled", "true");
      await expect(entry).not.toHaveAttribute("href");
      await expect(entry).not.toHaveAttribute("role");
      await expect(entry).not.toHaveAttribute("tabindex");
      await expect(entry.locator("a, button")).toHaveCount(0);
      await expect(entry).toContainText("Unavailable");
      expect(await entry.evaluate((element) => element.onclick)).toBeNull();
    }
    for (const [key, href] of expectedAvailable) {
      await expect(
        nav.locator(`[data-catalogue-key="${key}"] > a`),
      ).toHaveAttribute("href", href);
    }
    await expect(
      nav.locator('[data-catalogue-key="research"] > ul'),
    ).toHaveCount(1);
    await expect(
      nav.locator('[data-catalogue-key="contracts"] > ul'),
    ).toHaveCount(1);
    await expect(
      nav.locator('[data-catalogue-key="checklists"] > ul'),
    ).toHaveCount(0);
    await expect(nav.locator('[data-catalogue-key="ops"] > ul')).toHaveCount(0);
  }
});

test("command table exposes a named tab stop only while it genuinely overflows", async ({
  page,
}) => {
  const desktop = await openStory(page, "default");
  const fitting = desktop.locator("[data-command-table-scroller]");
  await expect
    .poll(() =>
      fitting.evaluate((element) => ({
        rendered: element.clientWidth > 0,
        fits: element.scrollWidth === element.clientWidth,
      })),
    )
    .toEqual({ rendered: true, fits: true });
  await expect(fitting).not.toHaveAttribute("role");
  await expect(fitting).not.toHaveAttribute("aria-label");
  await expect(fitting).not.toHaveAttribute("tabindex");

  const narrow = await openStory(page, "m-2-responsive-390", {
    width: 390,
    height: 844,
  });
  const overflowing = narrow.locator("[data-command-table-scroller]");
  await expect
    .poll(() =>
      overflowing.evaluate((element) => ({
        overflow: element.scrollWidth > element.clientWidth,
        role: element.getAttribute("role"),
        label: element.getAttribute("aria-label"),
        tabindex: element.getAttribute("tabindex"),
      })),
    )
    .toEqual({
      overflow: true,
      role: "region",
      label: "Mission command reference, narrow view",
      tabindex: "0",
    });
});

test("M2 uses the controlled compact drawer and restores trigger focus after Escape", async ({
  page,
}) => {
  const root = await openStory(page, "m-2-responsive-390", {
    width: 390,
    height: 844,
  });
  const shell = root.locator("sk-app-shell");
  const trigger = root.getByRole("button", { name: "Open Mission navigation" });
  const compactNavigation = root.locator('[slot="compact-navigation"]');

  await expect(shell).not.toHaveAttribute("open");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(compactNavigation).toHaveAttribute("inert", "");
  await expect(compactNavigation).toHaveAttribute("aria-hidden", "true");
  await expect(
    root.getByRole("navigation", { name: "Compact Mission pages" }),
  ).toHaveCount(0);
  await trigger.click();
  await expect(shell).toHaveAttribute("open", "");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect
    .soft(
      await compactNavigation.evaluate(
        (element) => element.getBoundingClientRect().width,
      ),
    )
    .toBe(240);
  expect(
    await root
      .locator(".sk-mission-reading-pattern__content")
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          inlineStart: style.paddingInlineStart,
          inlineEnd: style.paddingInlineEnd,
        };
      }),
  ).toEqual({ inlineStart: "16px", inlineEnd: "16px" });
  const lastDestination = root.locator(
    '[data-context-nav="compact"] [data-catalogue-key="ops"]',
  );
  await lastDestination.scrollIntoViewIfNeeded();
  await expect(lastDestination).toBeInViewport();
  await expect(
    root.getByRole("link", { name: "Back to repository" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(shell).not.toHaveAttribute("open");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("route pairs preserve current-state and supplied collection truth", async ({
  page,
}) => {
  const m4 = await openStory(page, "m-4-canonical-page-unavailable");
  await expect(
    m4.getByRole("heading", { level: 2, name: "Specify" }),
  ).toBeVisible();
  await expect(
    m4.locator('[data-context-nav="desktop"] a[aria-current="page"]'),
  ).toHaveText("Specify");
  await expect(
    m4.locator(
      '[data-context-nav="desktop"] [data-catalogue-key="plan"] > .sk-context-nav__unavailable',
    ),
  ).toContainText("Unavailable");

  const m6a = await openStory(page, "m-6-a-other-artifacts-present");
  await expect(
    m6a.getByRole("heading", { level: 2, name: "Other artifacts" }),
  ).toBeVisible();
  await expect(m6a.locator("[data-other-artifact-list] a")).toHaveCount(4);
  await expect(
    m6a.locator(
      '[data-context-nav="desktop"] [data-catalogue-key="other"] > ul a',
    ),
  ).toHaveCount(4);
  expect(
    await m6a
      .locator("[data-other-artifact-list] a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
  ).toEqual(
    await m6a
      .locator(
        '[data-context-nav="desktop"] [data-catalogue-key="other"] > ul a',
      )
      .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
  );

  const m6b = await openStory(page, "m-6-b-other-artifacts-absent");
  await expect(
    m6b.getByText("Artifacts absent in this commit", { exact: true }),
  ).toHaveCount(1);
  for (const placement of ["desktop", "compact"] as const) {
    const nav = m6b.locator(`[data-context-nav="${placement}"]`);
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(0);
    await expect(nav.locator('[data-catalogue-key="other"] > ul')).toHaveCount(
      0,
    );
    await expect(
      nav.locator(
        '[data-catalogue-key="other"] > .sk-context-nav__unavailable',
      ),
    ).toHaveAttribute("aria-disabled", "true");
  }
  await expect(
    m6b.locator(".sk-mission-reading-pattern__breadcrumb-current"),
  ).toHaveText("Other artifacts");
  await expect(
    m6b.locator('.sk-breadcrumbs [aria-current="page"]'),
  ).toHaveCount(0);
  await expect(
    m6b.locator(
      "[data-document-frame] [data-other-artifact-list], [data-document-frame] button",
    ),
  ).toHaveCount(0);

  const m7a = await openStory(page, "m-7-a-ops-present");
  await expect(m7a.locator("[data-ops-row]")).toHaveCount(1);
  expect(
    await m7a
      .locator("[data-ops-row]")
      .evaluate((row) =>
        [...row.children].map((child) => child.getAttribute("data-field")),
      ),
  ).toEqual(["invocation", "action", "status"]);
  await expect(
    m7a.locator("[data-ops-row] a, [data-ops-row] button"),
  ).toHaveCount(0);
  await expect(
    m7a.locator('[data-context-nav="desktop"] [data-catalogue-key="ops"] > a'),
  ).toHaveAttribute("aria-current", "page");

  const m7b = await openStory(page, "m-7-b-ops-absent");
  await expect(
    m7b.getByText("Ops absent in this commit", { exact: true }),
  ).toHaveCount(1);
  for (const placement of ["desktop", "compact"] as const) {
    const nav = m7b.locator(`[data-context-nav="${placement}"]`);
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(0);
    await expect(
      nav.locator('[data-catalogue-key="ops"] > .sk-context-nav__unavailable'),
    ).toHaveAttribute("aria-disabled", "true");
    await expect(nav.locator('[data-catalogue-key="ops"] > ul')).toHaveCount(0);
  }
  await expect(
    m7b.locator(".sk-mission-reading-pattern__breadcrumb-current"),
  ).toHaveText("Ops");
  await expect(
    m7b.locator('.sk-breadcrumbs [aria-current="page"]'),
  ).toHaveCount(0);
  await expect(
    m7b.locator(
      "[data-document-frame] [data-ops-row], [data-document-frame] button",
    ),
  ).toHaveCount(0);
});

test("loading and snapshot states never fabricate facts or a second commit", async ({
  page,
}) => {
  const loading = await openStory(page, "m-3-fragment-loading");
  await expect(loading.locator('[aria-busy="true"]')).toHaveCount(1);
  await expect(loading.getByRole("status")).toHaveText(
    "Loading rendered content…",
  );
  await expect(
    loading.locator("[data-document-facts], [data-document-action], article"),
  ).toHaveCount(0);

  const behind = await openStory(page, "m-5-snapshot-behind-log");
  await expect(behind.locator("sk-notice")).toHaveCount(1);
  await expect(behind.getByText("72c4e9a", { exact: true })).toHaveCount(1);
  await expect(
    behind.getByText(/behind the activity log.*72c4e9a/),
  ).toHaveCount(1);
  expect(
    await behind
      .locator("sk-notice")
      .evaluate((notice) =>
        (notice as HTMLElement & { message: string }).message.match(/72c4e9a/g),
      ),
  ).toHaveLength(1);
});

test("M8 separates factual, observed, and reported-live regions without a live Work Package join", async ({
  page,
}) => {
  const root = await openStory(page, "m-8-truth-regions");
  const factual = root.locator('[data-truth-region="factual"]');
  const observed = root.locator('[data-truth-region="observed"]');
  const live = root.locator('[data-truth-region="reported-live"]');

  await expect(root.locator("[data-truth-region]")).toHaveCount(3);
  await expect(factual).toHaveAccessibleName("Overview");
  await expect(observed).toHaveAccessibleName("Observed activity");
  await expect(live).toHaveAccessibleName("Reported presence");
  await expect(
    factual.getByRole("heading", { level: 2, name: "Overview" }),
  ).toBeVisible();
  await expect(
    factual.getByRole("heading", { level: 3, name: "Mission overview" }),
  ).toBeVisible();
  await expect(factual).toContainText("Factual · exact commit");
  await expect(factual).not.toContainText("Observed · up to 60 s behind");
  await expect(factual).not.toContainText("Reported live · ≤90s");
  await expect(observed).toContainText("Observed · up to 60 s behind");
  await expect(observed).toContainText("WP02");
  await expect(observed).toContainText("for_review");
  await expect(live).toContainText("Reported live · ≤90s");
  await expect(live).toContainText("lynn");
  await expect(live).toContainText("spec-kitty/EXPERIMENTAL-spec-kitty-saas");
  await expect(live).toContainText("feature/launch-resilience");
  await expect(live).toContainText("47 s");
  await expect(live).not.toContainText("WP02");
  await expect(live).not.toContainText("for_review");
  await expect(observed).not.toContainText("Reported live · ≤90s");
  await expect(live).not.toContainText("Observed · up to 60 s behind");
  await expect(
    root.locator('.sk-breadcrumbs a[aria-current="page"]'),
  ).toHaveText("Overview");
});

test("theme, RTL, long values, zoom, and threshold edges remain contained", async ({
  page,
}) => {
  const dark = await openStory(page, "default");
  const darkSurface = await dark.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const light = await openStory(page, "light-mode");
  const lightSurface = await light.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(lightSurface).not.toBe(darkSurface);

  for (const width of [861, 860, 859, 900, 390]) {
    const root = await openStory(
      page,
      width === 390 ? "long-content" : "default",
      { width, height: 1000 },
    );
    const compactHeader = root.locator('[slot="compact-header"]');
    const compact = width <= 860;
    if (compact) {
      await expect(compactHeader).not.toHaveAttribute("inert", "");
      await expect(compactHeader).not.toHaveAttribute("aria-hidden", "true");
    } else {
      await expect(compactHeader).toHaveAttribute("inert", "");
      await expect(compactHeader).toHaveAttribute("aria-hidden", "true");
    }
    expect(
      await root
        .locator(".sk-mission-reading-pattern__content")
        .evaluate((element) => getComputedStyle(element).paddingInlineStart),
    ).toBe(compact ? "16px" : "24px");
    expect(await documentGeometry(page)).toEqual({
      clientWidth: width,
      scrollWidth: width,
    });
    await expect(root.locator("[data-document-frame]")).toBeVisible();
  }

  await page.setViewportSize({ width: 780, height: 844 });
  await page.goto(`/iframe.html?id=${STORY_PREFIX}long-content&viewMode=story`);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect
    .poll(() =>
      page.evaluate(() => ({
        zoom: getComputedStyle(document.documentElement).zoom,
        contained:
          document.documentElement.scrollWidth ===
          document.documentElement.clientWidth,
      })),
    )
    .toEqual({ zoom: "2", contained: true });
  await expect
    .poll(() =>
      page.locator("[data-command-table-scroller]").evaluate((element) => ({
        overflow: element.scrollWidth > element.clientWidth,
        role: element.getAttribute("role"),
        label: element.getAttribute("aria-label"),
        tabindex: element.getAttribute("tabindex"),
      })),
    )
    .toEqual({
      overflow: true,
      role: "region",
      label: "Mission command reference, narrow view",
      tabindex: "0",
    });

  const rtl = await openStory(page, "rtl", { width: 390, height: 844 });
  await expect(rtl).toHaveAttribute("dir", "rtl");
  expect(await documentGeometry(page)).toEqual({
    clientWidth: 390,
    scrollWidth: 390,
  });
});

test("long unavailable label and visible annotation remain contained in the 240px drawer", async ({
  page,
}) => {
  const root = await openStory(page, "long-content", {
    width: 390,
    height: 844,
  });
  const shell = root.locator("sk-app-shell");
  const compactNavigation = root.locator('[slot="compact-navigation"]');
  const unavailable = root
    .locator('[data-context-nav="compact"]')
    .locator(
      '[data-catalogue-key="quickstart"] > .sk-context-nav__unavailable',
    );

  await expect(shell).toHaveAttribute("open", "");
  expect(
    await compactNavigation.evaluate(
      (element) => element.getBoundingClientRect().width,
    ),
  ).toBe(240);
  await expect(unavailable).toContainText("Unavailable");
  expect(
    await unavailable.evaluate((element) => ({
      contained: element.scrollWidth <= element.clientWidth,
      annotation: element
        .querySelector(".sk-context-nav__annotation")
        ?.textContent?.trim(),
    })),
  ).toEqual({ contained: true, annotation: "Unavailable" });
  expect(await documentGeometry(page)).toEqual({
    clientWidth: 390,
    scrollWidth: 390,
  });
});

test("forced colors and reduced motion preserve structure without pattern-owned animation", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Playwright forced-colors emulation is Chromium-owned",
  );
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const root = await openStory(page, "m-4-canonical-page-unavailable");
  await expect(
    root.locator(
      '[data-context-nav="desktop"] [data-catalogue-key="plan"] .sk-context-nav__annotation',
    ),
  ).toHaveText("Unavailable");
  expect(
    await root
      .locator("*")
      .evaluateAll((elements) =>
        elements.every(
          (element) =>
            getComputedStyle(element).animationName === "" ||
            getComputedStyle(element).animationName === "none" ||
            getComputedStyle(element).animationDuration === "0s",
        ),
      ),
  ).toBe(true);
});
