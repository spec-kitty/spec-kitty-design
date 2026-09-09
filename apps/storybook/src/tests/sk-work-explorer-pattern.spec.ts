import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";

const STORY_SOURCE = "packages/elements/src/patterns/work-explorer.stories.ts";
const STORY_TITLE = "Patterns/Work Explorer";
const STORY_PREFIX = "patterns-work-explorer--";
const STORY_IDS = [
  "w-1-by-lane-desktop-dark",
  "w-2-by-person-desktop-dark",
  "w-3-by-type-desktop-dark",
  "w-4-by-lane-1024-dark",
  "w-5-by-lane-light-mode",
  "w-6-filtered-empty-dark",
  "w-7-no-active-work-dark",
  "w-8-degraded-context-dark",
  "w-9-loading-dark",
  "w-10-no-admitted-repositories-dark",
] as const;

type StoryId = (typeof STORY_IDS)[number];

const openStory = async (
  page: Page,
  id: StoryId,
  viewport: Readonly<{ width: number; height: number }> = {
    width: 1280,
    height: 960,
  },
): Promise<Locator> => {
  await page.goto("about:blank");
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=${STORY_PREFIX}${id}&viewMode=story`);
  const root = page.locator("[data-work-explorer-pattern]").first();
  await root.waitFor({ state: "visible", timeout: 20_000 });
  await expect(root).toHaveAttribute("data-render-complete", "true");
  return root;
};

const axeIsClean = async (page: Page, storyId: StoryId): Promise<void> => {
  await injectAxe(page);
  let violations: Awaited<ReturnType<typeof getViolations>> = [];
  await expect
    .poll(async () => {
      try {
        violations = await getViolations(page, "body", {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
        });
        return "ready";
      } catch (error) {
        if (String(error).includes("Axe is already running")) return "busy";
        throw error;
      }
    })
    .toBe("ready");
  expect(violations, `${storyId} must have zero WCAG violations`).toEqual([]);
};

test("the Work Explorer proof remains a Storybook-only public-surface composition", () => {
  const source = readFileSync(STORY_SOURCE, "utf8");

  expect(source).toContain("WORK_EXPLORER_FIXTURE");
  expect(source).toContain("deepFreezeWorkExplorerFixture");
  expect(source).toContain("groupWorkPackages");
  expect(source).toContain("filterWorkPackages");
  expect(source).toContain("projectWorkExplorer");
  expect(source).not.toMatch(/<sk-work-explorer(?:\s|>)/);
  expect(source).not.toMatch(/customElements\.define\s*\(/);
  expect(source).not.toMatch(/\.shadowRoot\b|\.renderRoot\b|getRootNode\s*\(/);
  expect(source).not.toMatch(
    /\b(?:fetch|setTimeout|setInterval|requestAnimationFrame)\s*\(/,
  );
  expect(source).not.toMatch(
    /\b(?:localStorage|sessionStorage|Math\.random|new\s+Date)\b/,
  );
  expect(source).not.toMatch(/from\s+["'][^"']*team-kitty/i);
  expect(source).not.toMatch(
    /\b(?:router|createStore|presenceJoin|verifyTrust|polling)\b/i,
  );
  expect(source).not.toMatch(
    /\b(?:wpTitle|blockedReason|teamUpdatedAt|lastSyncedAt)\b/,
  );
  expect(source).not.toMatch(
    /<sk-(?:work-package-group|work-explorer-summary|work-explorer-filter|presence-panel|activity-panel|loading-skeleton)(?:\s|>)/,
  );
  expect(source).toMatch(
    /excludeStories:\s*\[[\s\S]*["']WORK_EXPLORER_FIXTURE["']/,
  );

  const styleBlock = source.match(
    /const workExplorerPatternStyles\s*=\s*html`<style>([\s\S]*?)<\/style>`/,
  )?.[1];
  expect(styleBlock, "the pattern owns one auditable style block").toBeTruthy();
  expect(styleBlock).not.toMatch(/#[\da-f]/i);
  expect(styleBlock).not.toMatch(/rgba?\(/i);
  expect(styleBlock).not.toMatch(/hsla?\(/i);
  expect(styleBlock).not.toMatch(/\d(?:px|rem|em|ch|vh|vw|ms)\b/i);
  expect(styleBlock).not.toMatch(
    /@media\s*\(prefers-reduced-motion:[^)]+\)[\s\S]*?\.sk-work-explorer-pattern\s+\*/,
  );
});

test("the built index discovers exactly the W1–W10 family and no helpers", async ({
  request,
}) => {
  const response = await request.get("/index.json");
  expect(response.ok()).toBe(true);
  const index = (await response.json()) as {
    entries: Readonly<
      Record<string, Readonly<{ type: string; title: string }>>
    >;
  };
  const ids = Object.entries(index.entries)
    .filter(
      ([, entry]) => entry.type === "story" && entry.title === STORY_TITLE,
    )
    .map(([id]) => id)
    .sort();

  expect(ids).toEqual(STORY_IDS.map((id) => `${STORY_PREFIX}${id}`).sort());
});

test("documentation and the shrink-only ratchet pin the private pattern seam and exact stories", () => {
  const docs = readFileSync("docs/design-system/using-components.md", "utf8");
  expect(docs).toMatch(/^## Work Explorer pattern$/m);
  expect(docs).toMatch(/not a\s+registered or published `sk-work-explorer`/);
  expect(docs).toMatch(/Consumers own[^.]*pressed[^.]*expanded[^.]*hidden/i);
  expect(docs).toMatch(/independent supplied\s+branches/i);
  expect(docs).toMatch(/page-owned story CSS/i);

  const ratchet = JSON.parse(readFileSync("expected-stories.json", "utf8")) as {
    byElement: Readonly<Record<string, readonly string[]>>;
    total: number;
  };
  expect(ratchet.byElement["work-explorer-pattern"]).toEqual(
    STORY_IDS.map((id) => `${STORY_PREFIX}${id}`),
  );
  expect(ratchet.total).toBe(444);
});

test("one deeply frozen fixture reconciles all exact margins without replacing identities", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=patterns-mission-reading--default&viewMode=story",
  );
  const facts = await page.evaluate(async () => {
    const preview = (
      window as typeof window & {
        __STORYBOOK_PREVIEW__: {
          importFn: (path: string) => Promise<Record<string, unknown>>;
        };
      }
    ).__STORYBOOK_PREVIEW__;
    const module = (await preview.importFn(
      "./packages/elements/src/patterns/work-explorer.stories.ts",
    )) as {
      WORK_EXPLORER_FIXTURE: {
        workPackages: ReadonlyArray<{
          id: string;
          missionName: string;
          workPackageId: string;
          repositoryId: string;
          lane: string;
          person: string | null;
          type: string;
          transitionLabel: string;
        }>;
      };
      isDeeplyFrozenWorkExplorerFixture: (value: unknown) => boolean;
      groupWorkPackages: (
        records: ReadonlyArray<Record<string, unknown>>,
        axis: "lane" | "person" | "type",
      ) => ReadonlyArray<{
        id: string;
        records: ReadonlyArray<{ id: string }>;
      }>;
    };
    const fixture = module.WORK_EXPLORER_FIXTURE;
    const axes = ["lane", "person", "type"] as const;
    const projections = Object.fromEntries(
      axes.map((axis) => [
        axis,
        module.groupWorkPackages(fixture.workPackages, axis),
      ]),
    );
    const totals = Object.fromEntries(
      Object.entries(projections).map(([axis, groups]) => [
        axis,
        Object.fromEntries(
          groups.map((group) => [group.id, group.records.length]),
        ),
      ]),
    );
    const identityAndOrder = Object.fromEntries(
      Object.entries(projections).map(([axis, groups]) => [
        axis,
        groups.every((group) =>
          group.records.every(
            (record, index) =>
              fixture.workPackages.indexOf(record) >= 0 &&
              (index === 0 ||
                fixture.workPackages.indexOf(group.records[index - 1]!) <
                  fixture.workPackages.indexOf(record)),
          ),
        ),
      ]),
    );
    const flattenedIds = Object.fromEntries(
      Object.entries(projections).map(([axis, groups]) => [
        axis,
        groups.flatMap((group) => group.records.map(({ id }) => id)),
      ]),
    );
    return {
      total: fixture.workPackages.length,
      identities: fixture.workPackages.map(({ id }) => id),
      compositeIdentities: fixture.workPackages.map(
        ({ repositoryId, missionName, workPackageId }) =>
          `${repositoryId}:${missionName}:${workPackageId}`,
      ),
      deeplyFrozen: module.isDeeplyFrozenWorkExplorerFixture(fixture),
      totals,
      identityAndOrder,
      flattenedIds,
      representatives: Object.fromEntries(
        ["WP03", "WP02", "WP04", "WP01", "WP06", "WP08"].map(
          (workPackageId) => [
            workPackageId,
            fixture.workPackages.find(
              (record) => record.workPackageId === workPackageId,
            ),
          ],
        ),
      ),
      wp05: fixture.workPackages.find(
        ({ missionName, workPackageId }) =>
          missionName === "Team landing pivots" && workPackageId === "WP05",
      ),
    };
  });

  expect(facts.total).toBe(50);
  expect(new Set(facts.identities).size).toBe(50);
  expect(new Set(facts.compositeIdentities).size).toBe(50);
  expect(facts.deeplyFrozen).toBe(true);
  expect(facts.totals).toEqual({
    lane: {
      planned: 12,
      "in-progress": 21,
      "for-review": 8,
      "in-review": 5,
      blocked: 4,
    },
    person: {
      mia: 9,
      ravi: 8,
      lynn: 7,
      "docker-dev": 6,
      noor: 5,
      jeroen: 5,
      stijn: 4,
      unassigned: 6,
    },
    type: { implementer: 28, reviewer: 10, researcher: 6, planner: 6 },
  });
  expect(facts.identityAndOrder).toEqual({
    lane: true,
    person: true,
    type: true,
  });
  for (const ids of Object.values(facts.flattenedIds)) {
    expect(ids).toHaveLength(50);
    expect(new Set(ids).size).toBe(50);
  }
  expect(facts.wp05).toMatchObject({
    missionName: "Team landing pivots",
    repositoryId: "saas",
    lane: "in-progress",
    person: "noor",
    type: "researcher",
  });
  expect(facts.representatives).toMatchObject({
    WP03: {
      missionName: "Team landing pivots",
      repositoryId: "saas",
      lane: "in-progress",
      person: "mia",
      type: "implementer",
      transitionLabel: "18 min ago",
    },
    WP02: {
      missionName: "Team landing pivots",
      repositoryId: "saas",
      lane: "in-progress",
      person: "ravi",
      type: "implementer",
      transitionLabel: "41 min ago",
    },
    WP04: {
      missionName: "E2E landing pivots",
      repositoryId: "e2e",
      lane: "for-review",
      person: "lynn",
      type: "reviewer",
      transitionLabel: "12 min ago",
    },
    WP01: {
      missionName: "E2E landing pivots",
      repositoryId: "e2e",
      lane: "for-review",
      person: "docker-dev",
      type: "implementer",
      transitionLabel: "2 hr ago",
    },
    WP06: {
      missionName: "Team landing pivots",
      repositoryId: "saas",
      lane: "blocked",
      person: "stijn",
      transitionLabel: "3 hr ago",
    },
    WP08: {
      missionName: "Repository dossier render",
      repositoryId: "saas",
      lane: "blocked",
      person: "jeroen",
      transitionLabel: "5 hr ago",
    },
  });
});

test("filtering is pure, W6 is exactly 0 of 50, and invalid values fail closed", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=patterns-mission-reading--default&viewMode=story",
  );
  const facts = await page.evaluate(async () => {
    const preview = (
      window as typeof window & {
        __STORYBOOK_PREVIEW__: {
          importFn: (path: string) => Promise<Record<string, unknown>>;
        };
      }
    ).__STORYBOOK_PREVIEW__;
    const module = (await preview.importFn(
      "./packages/elements/src/patterns/work-explorer.stories.ts",
    )) as {
      WORK_EXPLORER_FIXTURE: {
        workPackages: ReadonlyArray<Record<string, unknown>>;
      };
      filterWorkPackages: (
        records: ReadonlyArray<Record<string, unknown>>,
        filters: Readonly<Record<string, string>>,
      ) => { sourceTotal: number; filteredTotal: number };
      groupWorkPackages: (
        records: ReadonlyArray<Record<string, unknown>>,
        axis: string,
      ) => unknown;
      validateWorkExplorerFixture: (value: unknown) => unknown;
    };
    const records = module.WORK_EXPLORER_FIXTURE.workPackages;
    const before = JSON.stringify(records);
    const filtered = module.filterWorkPackages(records, {
      repositoryId: "e2e",
      personId: "unassigned",
      query: "release notes",
    });
    const errors: string[] = [];
    const capture = (callback: () => unknown) => {
      try {
        callback();
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    };
    const fixtureWith = (changes: Readonly<Record<string, unknown>>) => {
      const fixture = structuredClone(module.WORK_EXPLORER_FIXTURE);
      fixture.workPackages[0] = { ...fixture.workPackages[0], ...changes };
      return fixture;
    };
    capture(() => module.groupWorkPackages(records, "unknown"));
    capture(() => {
      const fixture = structuredClone(module.WORK_EXPLORER_FIXTURE);
      fixture.workPackages[49] = structuredClone(fixture.workPackages[0]!);
      module.validateWorkExplorerFixture(fixture);
    });
    capture(() =>
      module.validateWorkExplorerFixture(
        fixtureWith({ repositoryId: "unknown" }),
      ),
    );
    capture(() =>
      module.validateWorkExplorerFixture(fixtureWith({ href: "" })),
    );
    capture(() =>
      module.validateWorkExplorerFixture(fixtureWith({ lane: "unknown" })),
    );
    capture(() =>
      module.validateWorkExplorerFixture(fixtureWith({ person: "unknown" })),
    );
    capture(() =>
      module.validateWorkExplorerFixture(fixtureWith({ type: "unknown" })),
    );
    return {
      before,
      after: JSON.stringify(records),
      filtered,
      errors,
    };
  });

  expect(facts.filtered).toMatchObject({ sourceTotal: 50, filteredTotal: 0 });
  expect(facts.after).toBe(facts.before);
  expect(facts.errors).toHaveLength(7);
  expect(facts.errors.every(Boolean)).toBe(true);
  expect(facts.errors.join(" ")).toMatch(/grouping axis/i);
  expect(facts.errors.join(" ")).toMatch(/duplicate/i);
  expect(facts.errors.join(" ")).toMatch(/repository/i);
  expect(facts.errors.join(" ")).toMatch(/blank route/i);
  expect(facts.errors.join(" ")).toMatch(/lane/i);
  expect(facts.errors.join(" ")).toMatch(/person/i);
  expect(facts.errors.join(" ")).toMatch(/type/i);
});

test("story projections keep truth tiers independent and enforce W7/W9/W10 absence", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=patterns-mission-reading--default&viewMode=story",
  );
  const facts = await page.evaluate(async () => {
    const preview = (
      window as typeof window & {
        __STORYBOOK_PREVIEW__: {
          importFn: (path: string) => Promise<Record<string, unknown>>;
        };
      }
    ).__STORYBOOK_PREVIEW__;
    const module = (await preview.importFn(
      "./packages/elements/src/patterns/work-explorer.stories.ts",
    )) as {
      WORK_EXPLORER_FIXTURE: unknown;
      WORK_EXPLORER_STORY_MODELS: Readonly<{
        w1: Readonly<Record<string, unknown>>;
        w7: Readonly<Record<string, unknown>>;
        w8: Readonly<Record<string, unknown>>;
        w9: Readonly<Record<string, unknown>>;
        w10: Readonly<Record<string, unknown>>;
      }>;
      projectWorkExplorer: (
        fixture: unknown,
        state: Readonly<Record<string, unknown>>,
      ) => {
        workPackages: ReadonlyArray<{ id: string }>;
        repositories: ReadonlyArray<unknown>;
        sourceTotal: number | null;
        filteredTotal: number | null;
        mission: unknown;
        presence: unknown;
        activity: unknown;
      };
    };
    const project = (state: Readonly<Record<string, unknown>>) =>
      module.projectWorkExplorer(module.WORK_EXPLORER_FIXTURE, state);
    const w1 = project(module.WORK_EXPLORER_STORY_MODELS.w1);
    const w7 = project(module.WORK_EXPLORER_STORY_MODELS.w7);
    const w8 = project(module.WORK_EXPLORER_STORY_MODELS.w8);
    const w9 = project(module.WORK_EXPLORER_STORY_MODELS.w9);
    const w10 = project(module.WORK_EXPLORER_STORY_MODELS.w10);
    return {
      w1Ids: w1.workPackages.map(({ id }) => id),
      w8Ids: w8.workPackages.map(({ id }) => id),
      missionUnchanged:
        JSON.stringify(w1.mission) === JSON.stringify(w8.mission),
      presenceChanged:
        JSON.stringify(w1.presence) !== JSON.stringify(w8.presence),
      activityChanged:
        JSON.stringify(w1.activity) !== JSON.stringify(w8.activity),
      w7: {
        records: w7.workPackages.length,
        repositories: w7.repositories.length,
        sourceTotal: w7.sourceTotal,
        filteredTotal: w7.filteredTotal,
        mission: w7.mission,
        presence: w7.presence,
        activity: w7.activity,
      },
      w9: {
        records: w9.workPackages.length,
        repositories: w9.repositories.length,
        sourceTotal: w9.sourceTotal,
        filteredTotal: w9.filteredTotal,
        mission: w9.mission,
        presence: w9.presence,
        activity: w9.activity,
      },
      w10: {
        records: w10.workPackages.length,
        repositories: w10.repositories.length,
        sourceTotal: w10.sourceTotal,
        filteredTotal: w10.filteredTotal,
        mission: w10.mission,
        presence: w10.presence,
        activity: w10.activity,
      },
    };
  });

  expect(facts.w8Ids).toEqual(facts.w1Ids);
  expect(facts.missionUnchanged).toBe(true);
  expect(facts.presenceChanged).toBe(true);
  expect(facts.activityChanged).toBe(true);
  expect(facts.w7).toMatchObject({ records: 0, repositories: 2 });
  expect(facts.w7.sourceTotal).toBeNull();
  expect(facts.w7.filteredTotal).toBeNull();
  expect(facts.w9).toEqual({
    records: 0,
    repositories: 0,
    sourceTotal: null,
    filteredTotal: null,
    mission: null,
    presence: null,
    activity: null,
  });
  expect(facts.w10).toEqual(facts.w9);
});

test("W1–W10 render one H1 and pass axe from their shared public composition", async ({
  page,
}) => {
  for (const storyId of STORY_IDS) {
    const viewport =
      storyId === "w-4-by-lane-1024-dark"
        ? { width: 1024, height: 960 }
        : { width: 1280, height: 960 };
    const root = await openStory(page, storyId, viewport);
    await expect(root.locator("h1")).toHaveCount(1);
    await expect(root.locator("sk-app-shell")).toHaveAttribute(
      "presentation",
      "rail-preserving",
    );
    await axeIsClean(page, storyId);
  }
});

test("W1 composes exact lane counts, supplied expansion, native collections, and native route rows", async ({
  page,
}) => {
  const root = await openStory(page, "w-1-by-lane-desktop-dark");

  await expect(
    root.getByRole("heading", { level: 1, name: "Who is doing what, now" }),
  ).toBeVisible();
  await expect(root.locator('sk-page-header [slot="eyebrow"]')).toHaveText(
    "Work Explorer",
  );
  await expect(root.locator('sk-page-header [slot="supporting"]')).toHaveText(
    "Illustrative workload",
  );
  await expect(
    root.locator('sk-context-sidebar[slot="context-sidebar"] [slot="header"]'),
  ).toBeVisible();
  await expect(
    root.locator('sk-context-sidebar[slot="context-sidebar"] [slot="header"]'),
  ).toHaveText("Collaborative Demo Team");
  await expect(root.locator("[data-active-work-summary]")).toHaveText(
    "50 active Work Packages across 2 admitted repositories",
  );
  const summaryFacts = await root
    .locator("[data-summary-lane]")
    .evaluateAll((items) =>
      Object.fromEntries(
        items.map((item) => [
          item.getAttribute("data-summary-lane") ?? "",
          {
            label: item.querySelector("dt")?.textContent?.trim(),
            count: Number(item.querySelector("dd")?.textContent),
          },
        ]),
      ),
    );
  expect(summaryFacts).toEqual({
    planned: { label: "Planned", count: 12 },
    "in-progress": { label: "In progress", count: 21 },
    "for-review": { label: "For review", count: 8 },
    "in-review": { label: "In review", count: 5 },
    blocked: { label: "Blocked", count: 4 },
  });
  await expect(root.getByText("Clear filters", { exact: true })).toHaveCount(0);
  const desktopFilterEdges = await root
    .locator(
      ".sk-segmented-choice, [data-filter='repositoryId'], [data-filter='personId'], [data-filter='query']",
    )
    .evaluateAll((controls) =>
      controls.map((control) =>
        Math.round(control.getBoundingClientRect().bottom),
      ),
    );
  expect(new Set(desktopFilterEdges).size).toBe(1);
  await expect(root.locator(".sk-collection")).toHaveCount(5);
  await expect(root).toHaveAttribute("data-source-total", "50");
  await expect(root.locator("[data-work-package-id]:visible")).toHaveCount(7);
  await expect(
    root.locator('[data-work-group="in-progress"] [data-work-package-id]'),
  ).toHaveCount(3);
  await expect(
    root.locator('[data-work-group="for-review"] [data-work-package-id]'),
  ).toHaveCount(2);
  await expect(
    root.locator('[data-work-group="blocked"] [data-work-package-id]'),
  ).toHaveCount(2);
  await expect(
    root.locator("sk-action-row[href][presentation='flush']"),
  ).toHaveCount(7);
  await expect(
    root.getByRole("button", { name: "View 18 more in progress" }),
  ).toBeVisible();
  await expect(
    root.getByRole("button", { name: "View 6 more for review" }),
  ).toBeVisible();
  await expect(
    root.getByRole("button", { name: "View 2 more blocked" }),
  ).toBeVisible();
  await expect(root.locator(".sk-event-timeline--compact")).toHaveCount(1);
  await expect(root.locator(".sk-event-timeline--compact > li")).toHaveCount(3);
  await expect(root.locator("[data-truth-tier='mission']")).toHaveCount(1);
  await expect(root.locator("[data-truth-tier='presence']")).toHaveCount(1);
  await expect(root.locator("[data-truth-tier='activity']")).toHaveCount(1);
  await expect(root.locator("[data-truth-tier='presence']")).toContainText(
    "Mia · WP03",
  );
  await expect(root.locator("[data-truth-tier='presence']")).toContainText(
    "Ravi · WP02",
  );
  await expect(root.locator("[data-truth-tier='presence']")).toContainText(
    "Noor · WP05",
  );
  await expect(root.locator("[data-truth-tier='presence']")).toContainText(
    "Reported live · ≤90s",
  );
  await expect(root.locator("[data-truth-tier='presence']")).toContainText(
    "Current relay sessions only. Activity does not imply presence.",
  );
  await expect(root.locator("[data-truth-tier='presence']")).toContainText(
    "Relay status affects presence only.",
  );
  const liveFocusLinks = root.locator(
    "[data-truth-tier='presence'] a[data-live-focus]",
  );
  await expect(liveFocusLinks).toHaveCount(3);
  await expect(liveFocusLinks.nth(0)).toHaveAttribute(
    "href",
    /\/work\/.*\/WP03$/,
  );
  await expect(liveFocusLinks.nth(0)).toHaveAttribute(
    "aria-label",
    "Mia working on WP03",
  );
  await expect(liveFocusLinks.nth(0)).toContainText("Mia");
  await expect(liveFocusLinks.nth(0)).toContainText("WP03");
  await expect(root.locator("[data-truth-tier='activity']")).toContainText(
    "E2E landing pivots · WP04 · Moved to review",
  );
  await expect(root.locator("[data-truth-tier='activity']")).toContainText(
    "Team landing pivots · WP05 · Assignee changed to Noor",
  );
  await expect(root.locator("[data-truth-tier='activity']")).toContainText(
    "Team landing pivots · WP06 · Blocker added",
  );
  await expect(root.locator("[data-truth-tier='activity']")).toContainText(
    "Observed · up to 60 s behind",
  );
  await expect(root.locator("[data-truth-tier='activity']")).toContainText(
    "Last observed 14:32",
  );
  await expect(root.locator("[data-truth-tier='activity']")).not.toContainText(
    "Tone:",
  );
  const activityMarkers = root.locator(
    "[data-truth-tier='activity'] [data-activity-tone]",
  );
  await expect(activityMarkers).toHaveCount(3);
  await expect(activityMarkers.locator("svg")).toHaveCount(3);
  const markerPresentation = await activityMarkers.evaluateAll((markers) =>
    markers.map((marker) => ({
      tone: marker.getAttribute("data-activity-tone"),
      color: getComputedStyle(marker).color,
    })),
  );
  expect(markerPresentation.map(({ tone }) => tone)).toEqual([
    "info",
    "success",
    "attention",
  ]);
  expect(new Set(markerPresentation.map(({ color }) => color)).size).toBe(3);
  await expect(root.locator("[data-blocked-exception]")).toContainText(
    "Blocked · exception",
  );

  const groupStates = await root
    .locator(".sk-collection")
    .evaluateAll((collections) =>
      Object.fromEntries(
        collections.map((collection) => {
          const id = collection.getAttribute("data-work-group") ?? "";
          const button = collection.querySelector<HTMLButtonElement>(
            ".sk-collection__toggle",
          );
          const body = collection.querySelector<HTMLElement>(
            ".sk-collection__body",
          );
          return [
            id,
            {
              expanded: button?.getAttribute("aria-expanded"),
              hidden: body?.hidden,
            },
          ];
        }),
      ),
    );
  expect(groupStates).toEqual({
    planned: { expanded: "false", hidden: true },
    "in-progress": { expanded: "true", hidden: false },
    "for-review": { expanded: "true", hidden: false },
    "in-review": { expanded: "false", hidden: true },
    blocked: { expanded: "true", hidden: false },
  });

  const firstRow = root
    .locator('[data-work-group="in-progress"] sk-action-row[href]')
    .first();
  const route = firstRow.getByRole("link");
  await expect(firstRow).toContainText("Team landing pivots · WP03");
  await expect(route).toHaveAttribute("href", /\/work-packages\/WP03$/);
  await route.focus();
  await expect(route).toBeFocused();
  await expect(firstRow.locator("button, input, select, textarea")).toHaveCount(
    0,
  );

  const firstToggle = root.locator(".sk-collection__toggle").first();
  await firstToggle.click();
  await expect(firstToggle).toHaveAttribute("aria-expanded", "true");
  const controlledBody = root.locator(
    `#${await firstToggle.getAttribute("aria-controls")}`,
  );
  await expect(controlledBody).not.toHaveAttribute("hidden", "");
  await firstToggle.click();
  await expect(firstToggle).toHaveAttribute("aria-expanded", "false");
  await expect(controlledBody).toHaveAttribute("hidden", "");

  await root.getByRole("button", { name: "View 18 more in progress" }).click();
  await expect(
    root.locator('[data-work-group="in-progress"] [data-work-package-id]'),
  ).toHaveCount(21);
  await expect(
    root.getByRole("button", { name: "View 18 more in progress" }),
  ).toHaveCount(0);

  const storyUrl = page.url();
  await route.click({ button: "right" });
  expect(page.url()).toBe(storyUrl);

  await route.evaluate((link) => {
    link.addEventListener(
      "click",
      (event) => {
        (
          window as typeof window & {
            __workExplorerModifiedClick?: Readonly<{
              button: number;
              ctrlKey: boolean;
              defaultPrevented: boolean;
            }>;
          }
        ).__workExplorerModifiedClick = {
          button: event.button,
          ctrlKey: event.ctrlKey,
          defaultPrevented: event.defaultPrevented,
        };
        event.preventDefault();
      },
      { once: true },
    );
  });
  await route.click({ modifiers: ["Control"] });
  expect(
    await page.evaluate(
      () =>
        (
          window as typeof window & {
            __workExplorerModifiedClick?: unknown;
          }
        ).__workExplorerModifiedClick,
    ),
  ).toEqual({ button: 0, ctrlKey: true, defaultPrevented: false });

  await route.focus();
  await route.press("Enter");
  await expect(page).toHaveURL(/\/work-packages\/WP03$/);
});

test("W2 and W3 expose exact DOM margins and their supplied controlled expansion states", async ({
  page,
}) => {
  const cases = [
    {
      id: "w-2-by-person-desktop-dark" as const,
      counts: {
        mia: 9,
        ravi: 8,
        lynn: 7,
        "docker-dev": 6,
        noor: 5,
        jeroen: 5,
        stijn: 4,
        unassigned: 6,
      },
      expanded: ["mia", "lynn", "docker-dev", "unassigned"],
    },
    {
      id: "w-3-by-type-desktop-dark" as const,
      counts: { implementer: 28, reviewer: 10, researcher: 6, planner: 6 },
      expanded: ["implementer", "reviewer", "researcher"],
    },
  ];
  for (const fixtureCase of cases) {
    const root = await openStory(page, fixtureCase.id);
    const groups = await root
      .locator("[data-work-group]")
      .evaluateAll((elements) =>
        Object.fromEntries(
          elements.map((element) => [
            element.getAttribute("data-work-group") ?? "",
            {
              count: Number.parseInt(
                element.querySelector(".sk-collection__count")?.textContent ??
                  "",
                10,
              ),
              expanded:
                element
                  .querySelector(".sk-collection__toggle")
                  ?.getAttribute("aria-expanded") === "true",
            },
          ]),
        ),
      );
    expect(
      Object.fromEntries(
        Object.entries(groups).map(([id, value]) => [id, value.count]),
      ),
    ).toEqual(fixtureCase.counts);
    expect(
      Object.entries(groups)
        .filter(([, value]) => value.expanded)
        .map(([id]) => id),
    ).toEqual(fixtureCase.expanded);
    await expect(root).toHaveAttribute("data-source-total", "50");
    await expect(root.locator("[data-work-package-id]")).toHaveCount(
      fixtureCase.expanded.length,
    );
    await expect(root.locator("[data-work-package-id]:visible")).toHaveCount(
      fixtureCase.expanded.length,
    );
    for (const groupId of fixtureCase.expanded) {
      await expect(
        root.locator(`[data-work-group="${groupId}"] [data-work-package-id]`),
      ).toHaveCount(1);
    }
  }
});

test("W1 and W5 preserve semantic/data parity while real theme tokens change", async ({
  page,
}) => {
  const read = async (
    id: "w-1-by-lane-desktop-dark" | "w-5-by-lane-light-mode",
  ) => {
    const root = await openStory(page, id);
    return {
      text: await root
        .locator(".sk-work-explorer-pattern__content")
        .innerText(),
      ids: await root
        .locator("[data-work-package-id]")
        .evaluateAll((rows) =>
          rows.map((row) => row.getAttribute("data-work-package-id")),
        ),
      expanded: await root
        .locator(".sk-collection__toggle")
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getAttribute("aria-expanded")),
        ),
      background: await root.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
      foreground: await root.evaluate(
        (element) => getComputedStyle(element).color,
      ),
    };
  };
  const dark = await read("w-1-by-lane-desktop-dark");
  const light = await read("w-5-by-lane-light-mode");
  expect(light.text).toBe(dark.text);
  expect(light.ids).toEqual(dark.ids);
  expect(light.expanded).toEqual(dark.expanded);
  expect(light.background).not.toBe(dark.background);
  expect(light.foreground).not.toBe(dark.foreground);
});

test("grouping intent reprojects the same 50 identities and updates exactly one pressed button", async ({
  page,
}) => {
  const root = await openStory(page, "w-1-by-lane-desktop-dark");
  await expect(root).toHaveAttribute("data-source-total", "50");
  await expect(root.locator("[data-work-package-id]:visible")).toHaveCount(7);
  await root.locator("[data-grouping='person']").click();
  await expect(root).toHaveAttribute("data-grouping", "person");
  await expect(root).toHaveAttribute("data-source-total", "50");
  await expect(
    root.locator("[data-grouping][aria-pressed='true']"),
  ).toHaveCount(1);
  await expect(root.locator("[data-work-group]")).toHaveCount(8);
  await expect(root.locator("[data-work-package-id]")).toHaveCount(4);
  await expect(root.locator("[data-work-package-id]:visible")).toHaveCount(4);
});

test("W6 derives 0 of 50 and both real clear actions restore populated work", async ({
  page,
}) => {
  for (const clearIndex of [0, 1]) {
    const root = await openStory(page, "w-6-filtered-empty-dark");
    await expect(root.locator('[data-filter="repositoryId"]')).toHaveValue(
      "e2e",
    );
    await expect(root.locator('[data-filter="personId"]')).toHaveValue(
      "unassigned",
    );
    await expect(root.locator('[data-filter="query"]')).toHaveValue(
      "release notes",
    );
    await expect(root.locator("[data-filtered-empty]")).toContainText(
      "0 of 50",
    );
    const clearActions = root.getByText("Clear filters", {
      exact: true,
    });
    await expect(clearActions).toHaveCount(2);
    await clearActions.nth(clearIndex).click();
    await expect(root).toHaveAttribute("data-filtered-total", "50");
    await expect(root.locator("[data-work-package-id]:visible")).toHaveCount(7);
  }
});

test("W7, W8, W9, and W10 preserve their distinct truth and absence contracts", async ({
  page,
}) => {
  const w7 = await openStory(page, "w-7-no-active-work-dark");
  await expect(w7.locator('sk-status-indicator[slot="sync"]')).toHaveText(
    "Mission state · verified",
  );
  await expect(w7.locator("[data-no-work-summary]")).toHaveText(
    "No active Work Packages across 2 admitted repositories",
  );
  await expect(w7.locator("[data-summary-lane]")).toHaveCount(0);
  await expect(w7.locator("[data-work-package-id]")).toHaveCount(0);
  await expect(
    w7.getByText("No reported-live presence", { exact: true }),
  ).toBeVisible();
  await expect(
    w7.getByText("No activity in the last 72 hours.", { exact: true }),
  ).toBeVisible();
  await expect(w7.locator("[data-truth-tier='presence']")).toContainText(
    "Reported live · ≤90s",
  );
  await expect(w7.locator("[data-truth-tier='activity']")).toContainText(
    "Observed · up to 60 s behind",
  );

  const w8 = await openStory(page, "w-8-degraded-context-dark");
  await expect(w8).toHaveAttribute("data-source-total", "50");
  await expect(w8.locator("[data-work-package-id]:visible")).toHaveCount(7);
  await expect(
    w8.getByText("Presence unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    w8.getByText("Presence is unavailable. Mission state is unaffected.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    w8.getByText("Observed · delayed", { exact: true }),
  ).toBeVisible();
  await expect(
    w8.getByText("Last observed 18 min ago", { exact: true }),
  ).toBeVisible();

  const w9 = await openStory(page, "w-9-loading-dark");
  await expect(w9.locator("[aria-busy='true']")).toHaveCount(2);
  const loadingStatus = w9.getByRole("status");
  await expect(loadingStatus).toHaveText("Loading Work Packages");
  await expect(loadingStatus).toHaveClass(
    /sk-work-explorer-pattern__visually-hidden/,
  );
  const loadingLayout = w9.locator("sk-grid.sk-work-explorer-pattern__layout");
  await expect(loadingLayout).toHaveCount(1);
  await expect(
    loadingLayout.locator(":scope > [aria-busy='true']"),
  ).toHaveCount(2);
  await expect(
    w9.locator(
      "[aria-hidden='true'] .sk-work-explorer-pattern__skeleton-shape",
    ),
  ).toHaveCount(6);
  await expect(
    w9
      .locator('[aria-label="Loading verified Mission work"]')
      .locator(".sk-work-explorer-pattern__skeleton-shape"),
  ).toHaveCount(4);
  await expect(
    w9
      .locator('[aria-label="Loading reported and observed context"]')
      .locator(".sk-work-explorer-pattern__skeleton-shape"),
  ).toHaveCount(2);
  await expect(
    w9.locator(
      "form[aria-label='Work filters'] button:not([disabled]), form[aria-label='Work filters'] select:not([disabled]), form[aria-label='Work filters'] input:not([disabled])",
    ),
  ).toHaveCount(0);
  await expect(
    w9.locator("[data-work-package-id], time, [data-summary-lane]"),
  ).toHaveCount(0);
  await expect(w9.getByText("Lynn", { exact: true })).toHaveCount(0);

  const w10 = await openStory(page, "w-10-no-admitted-repositories-dark");
  await expect(w10.locator('a[href="/connectors"]')).toHaveCount(1);
  await expect(
    w10.getByRole("heading", { name: "No admitted repositories", exact: true }),
  ).toBeVisible();
  await expect(
    w10.getByText(
      "Presence and activity appear after a repository is admitted.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    w10.getByRole("heading", { name: "What appears here", exact: true }),
  ).toBeVisible();
  const setupLayout = w10.locator("sk-grid.sk-work-explorer-pattern__layout");
  await expect(setupLayout).toHaveCount(1);
  await expect(
    setupLayout.locator(
      ":scope > .sk-work-explorer-pattern__work, :scope > .sk-work-explorer-pattern__context",
    ),
  ).toHaveCount(2);
  await expect(
    w10.locator(
      "[data-work-package-id], time, [data-summary-lane], [data-truth-tier]",
    ),
  ).toHaveCount(0);
  await expect(w10.getByText(/spec-kitty\//)).toHaveCount(0);
  await expect(w10.getByText("Lynn", { exact: true })).toHaveCount(0);
});

test("W4 retains the personal rail, suppresses desktop context, stacks work first, and contains overflow at shell edges", async ({
  page,
}) => {
  for (const width of [1024, 1099, 1100, 1101]) {
    const root = await openStory(page, "w-4-by-lane-1024-dark", {
      width,
      height: 900,
    });
    const compactHeader = root.locator('[slot="compact-header"]');
    if (width <= 1100) {
      await expect(compactHeader).not.toHaveAttribute("inert", "");
      await expect(
        root.getByRole("button", { name: "Open team navigation" }),
      ).toBeVisible();
    } else {
      await expect(compactHeader).toHaveAttribute("inert", "");
    }
    const geometry = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(geometry.scrollWidth - geometry.clientWidth).toBe(0);
    const order = await root
      .locator(".sk-work-explorer-pattern__layout > *")
      .evaluateAll((children) => children.map((child) => child.className));
    expect(String(order[0])).toContain("__work");
    expect(String(order[1])).toContain("__context");
    await expect(
      root.locator('sk-personal-rail[slot="personal-rail"]'),
    ).toBeVisible();
  }

  const compact = await openStory(page, "w-4-by-lane-1024-dark", {
    width: 1024,
    height: 900,
  });
  const railWidth = await compact
    .locator('sk-personal-rail[slot="personal-rail"]')
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(railWidth).toBe(56);
  const searchLayout = await compact
    .locator(".sk-work-explorer-pattern__search")
    .evaluate((element) => ({
      start: getComputedStyle(element).gridColumnStart,
      end: getComputedStyle(element).gridColumnEnd,
    }));
  expect(searchLayout).toEqual({ start: "1", end: "-1" });
  const compactFilterLayout = await compact
    .locator(".sk-work-explorer-pattern__filters")
    .evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.split(" ").length,
      groupingEdge: Math.round(
        element.querySelector(".sk-segmented-choice")!.getBoundingClientRect()
          .bottom,
      ),
      repositoryEdge: Math.round(
        element
          .querySelector<HTMLElement>('[data-filter="repositoryId"]')!
          .getBoundingClientRect().bottom,
      ),
      personEdge: Math.round(
        element
          .querySelector<HTMLElement>('[data-filter="personId"]')!
          .getBoundingClientRect().bottom,
      ),
      searchTop: Math.round(
        element
          .querySelector<HTMLElement>('[data-filter="query"]')!
          .getBoundingClientRect().top,
      ),
    }));
  expect(compactFilterLayout.columns).toBe(3);
  expect(compactFilterLayout.repositoryEdge).toBe(
    compactFilterLayout.groupingEdge,
  );
  expect(compactFilterLayout.personEdge).toBe(compactFilterLayout.groupingEdge);
  expect(compactFilterLayout.searchTop).toBeGreaterThan(
    compactFilterLayout.groupingEdge,
  );

  const shell = compact.locator("sk-app-shell");
  const trigger = compact.locator(".sk-work-explorer-pattern__drawer-trigger");
  await expect(trigger).toHaveAttribute("aria-label", "Open team navigation");
  await expect(trigger).toHaveText("Open team navigation");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAttribute("aria-label", "Close team navigation");
  await expect(trigger).toHaveText("Close team navigation");
  expect(
    await shell.evaluate(
      (element) => (element as HTMLElement & { open: boolean }).open,
    ),
  ).toBe(true);
  await expect(
    compact.locator('[slot="compact-navigation"] a[href]').first(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveAttribute("aria-label", "Open team navigation");
  await expect(trigger).toHaveText("Open team navigation");
  await expect(trigger).toBeFocused();
  expect(
    await shell.evaluate(
      (element) => (element as HTMLElement & { open: boolean }).open,
    ),
  ).toBe(false);

  await page.setViewportSize({ width: 1024, height: 480 });
  const toggle = compact.locator(
    '[data-work-group="in-progress"] .sk-collection__toggle',
  );
  await toggle.focus();
  const focusBox = await toggle.boundingBox();
  expect(focusBox).not.toBeNull();
  expect(focusBox!.y).toBeGreaterThanOrEqual(0);
  expect(focusBox!.y + focusBox!.height).toBeLessThanOrEqual(480);

  await compact
    .locator('[data-work-group="in-progress"] code[slot="reference"]')
    .first()
    .evaluate((element) => {
      element.textContent =
        "spec-kitty/EXPERIMENTAL-spec-kitty-saas-with-a-supplied-extraordinarily-long-repository-name";
    });
  const longGeometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(longGeometry.scrollWidth - longGeometry.clientWidth).toBe(0);

  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  const zoomGeometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(zoomGeometry.scrollWidth - zoomGeometry.clientWidth).toBe(0);
});

test("forced colors preserves labelled boundaries and reduced motion keeps skeletons static", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const w1 = await openStory(page, "w-1-by-lane-desktop-dark");
  const blocked = w1.locator("[data-blocked-exception]");
  await expect(blocked).toContainText("Blocked · exception");
  expect(
    await blocked.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).not.toBe("none");

  const w9 = await openStory(page, "w-9-loading-dark");
  const motion = await w9
    .locator(".sk-work-explorer-pattern__skeleton-shape")
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).animationName),
    );
  expect(motion.every((animation) => animation === "none")).toBe(true);
});
