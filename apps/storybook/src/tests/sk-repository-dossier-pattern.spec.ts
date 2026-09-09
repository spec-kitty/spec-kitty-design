import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";

const STORY_PREFIX = "patterns-repository-dossier--";
const STORY_IDS = [
  "default",
  "d-2-narrow-closed",
  "d-2-narrow-open",
  "d-4-cross-branch",
  "d-5-not-spec-kitty",
  "d-6-snapshot-behind-log",
  "d-7-indexing",
  "d-8-no-missions",
  "light-mode",
  "long-data",
  "progress-thresholds",
  "forced-colors",
  "reduced-motion",
  "zoom-200",
  "zoom-400",
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
  await page.goto("about:blank");
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=${STORY_PREFIX}${id}&viewMode=story`);
  const root = page.locator("[data-repository-dossier-pattern]").first();
  await root.waitFor({ state: "visible", timeout: 20_000 });
  await expect(root).toHaveAttribute("data-render-complete", "true");
  return root;
};

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
      const concurrentAxe =
        error instanceof Error &&
        error.message.includes("Axe is already running");
      if (!concurrentAxe || attempt === 9) throw error;
      await page.waitForTimeout(100);
    }
  }
  expect(
    violations,
    `${storyId} must have zero WCAG 2.1 AA violations`,
  ).toEqual([]);
};

const documentGeometry = (page: Page) =>
  page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

test("source is a Storybook-only public composition", () => {
  const storySource = readFileSync(
    "packages/elements/src/patterns/repository-dossier.stories.ts",
    "utf8",
  );
  const fixtureSource = readFileSync(
    "packages/elements/src/patterns/repository-dossier.fixture.ts",
    "utf8",
  );
  const packageIndex = readFileSync("packages/elements/src/index.ts", "utf8");
  const buildConfig = readFileSync(
    "packages/elements/tsconfig.lib.json",
    "utf8",
  );
  const source = `${storySource}\n${fixtureSource}`;

  expect(fixtureSource).toContain("deepFreezeRepositoryDossierFixture");
  expect(fixtureSource).toContain("REPOSITORY_DOSSIER_FIXTURES");
  expect(fixtureSource).toContain("projectRepositoryDossier");
  expect(storySource).toContain("renderRepositoryDossier");
  expect(storySource).toMatch(
    /excludeStories:[\s\S]*deepFreezeRepositoryDossierFixture/,
  );
  expect(source).not.toMatch(
    /<sk-(?:mission-row|repository-dossier|truth-band|provenance-band|section-list)(?:\s|>)/,
  );
  expect(source).not.toMatch(/customElements\.define\s*\(/);
  expect(source).not.toMatch(/\.shadowRoot\b|\.renderRoot\b|getRootNode\s*\(/);
  expect(source).not.toMatch(
    /\b(?:fetch|setTimeout|setInterval|requestAnimationFrame|localStorage|sessionStorage)\b/,
  );
  expect(source).not.toMatch(
    /\b(?:router|routeTo|executeCommand|spawn|exec)\b/,
  );
  expect(source).not.toMatch(/new\s+Date|Date\.now|Math\.random/);
  expect(packageIndex).not.toContain("repository-dossier");
  expect(buildConfig).toContain('"src/**/*.fixture.ts"');
  expect(source).not.toContain('data-theme="light"');
  expect(storySource).not.toContain("defaultViewport");
  expect(storySource).toContain('globals: { viewport: { value: "dossier390"');
});

test("built index discovers every required Dossier story and excludes helpers", async ({
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
        entry.type === "story" && entry.title === "Patterns/Repository Dossier",
    )
    .map(([id]) => id)
    .sort();

  expect(entries).toEqual(STORY_IDS.map((id) => `${STORY_PREFIX}${id}`).sort());
});

test("every story is non-empty, has native structure, and is axe-clean", async ({
  page,
}) => {
  for (const storyId of STORY_IDS) {
    const viewport = storyId.startsWith("d-2-")
      ? { width: 390, height: 844 }
      : undefined;
    const root = await openStory(page, storyId, viewport);
    await expect(root.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(root.locator("main")).toHaveCount(1);
    await expect(root.locator("sk-app-shell")).toHaveCount(1);
    await axeIsClean(page, storyId);
  }
});

test("D1 composes the approved public tags and native information families", async ({
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
    "sk-action-row",
    "sk-app-shell",
    "sk-card",
    "sk-context-sidebar",
    "sk-copy-field",
    "sk-page-header",
    "sk-personal-rail",
    "sk-pill-tag",
    "sk-status-indicator",
  ]);
  await expect(root.locator(".sk-context-nav")).toHaveCount(2);
  await expect(root.locator(".sk-breadcrumbs")).toHaveCount(1);
  await expect(root.locator(".sk-facts")).toHaveCount(1);
  await expect(
    root.locator("ul.sk-repository-dossier-pattern__mission-list > li"),
  ).toHaveCount(3);
  await expect(root.locator("progress")).toHaveCount(3);
  await expect(root.locator("time[datetime]")).toHaveCount(1);
  await expect(root.locator("code").first()).toBeVisible();
  await expect(
    root
      .locator('[data-mission-id="#1042"] sk-action-row')
      .getByRole("link", { name: /Launch resilience tranche A/ }),
  ).toHaveAttribute("href", "#mission-1042");
  await expect(
    root
      .locator('[data-mission-id="#1042"] a')
      .filter({ hasText: "Tracker #1042" }),
  ).toHaveCount(0);
  await expect(
    root.locator('[data-mission-id="#1042"] sk-pill-tag').filter({
      hasText: "Tracker #1042",
    }),
  ).toBeVisible();
  await expect(root.locator("[data-branch-copies]")).toHaveCount(0);
  await expect(
    root.locator('[data-mission-id="#1042"] .sk-progress__label'),
  ).toHaveText("8 Work Packages");
  await expect(
    root.locator('[data-mission-id="#1042"] .sk-progress__meta'),
  ).toHaveText("62% done");
  await expect(
    root.getByRole("link", { name: "Charter", exact: true }),
  ).toHaveAttribute("href", "#charter");
  await expect(
    root.getByRole("button", { name: "Copy Charter interview command" }),
  ).toBeVisible();

  const missionLink = root
    .locator('[data-mission-id="#1042"]')
    .getByRole("link", { name: /Launch resilience tranche A/ });
  await missionLink.click();
  await expect.poll(() => new URL(page.url()).hash).toBe("#mission-1042");
  await root.getByRole("link", { name: "Charter", exact: true }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe("#charter");

  const currentElementsAreAnchors = await root
    .locator("[aria-current]")
    .evaluateAll((elements) =>
      elements.every((element) => element instanceof HTMLAnchorElement),
    );
  expect(currentElementsAreAnchors).toBe(true);
});

test("D4 presents supplied branch copies and merged fact without collapsing them", async ({
  page,
}) => {
  const root = await openStory(page, "d-4-cross-branch");
  await expect(root.locator('[data-branch-copies="#1042"] code')).toHaveText([
    "feature/launch-resilience",
    "release/launch-resilience",
  ]);
  const mergedMission = root.locator('[data-mission-id="#1017"]');
  const copies = mergedMission.locator('[data-branch-copies="#1017"] code');
  await expect(copies).toHaveText(["feature/repo-dossier", "main"]);
  await expect(root.locator('[data-branch-copies="#998"] code')).toHaveText([
    "feature/fold-docstrings",
  ]);
  await expect(
    mergedMission.locator('sk-status-indicator[slot="tags"]'),
  ).toContainText("Merged to default");
  await expect(
    root.locator('[data-mission-id="#1042"] sk-status-indicator[slot="tags"]'),
  ).toHaveCount(0);
  await expect(root.locator("[data-repository-branch]")).toHaveText("main");
  await expect(
    root.locator('[data-context-nav] a[href="#mission-1017"]'),
  ).toHaveCount(0);
  await expect(
    root.locator('[data-context-nav] a[href="#mission-1042"]'),
  ).toHaveCount(2);
  await expect(
    root.locator('[data-context-nav] a[href="#mission-998"]'),
  ).toHaveCount(2);
});

test("D5, D7, and D8 keep terminal, pending, and completed-empty truth distinct", async ({
  page,
}) => {
  let root = await openStory(page, "d-5-not-spec-kitty");
  await expect(root.locator("[data-terminal-state]")).toBeVisible();
  await expect(root.locator("[data-git-context]")).toHaveCount(0);
  await expect(
    root.locator("sk-action-row, progress, sk-copy-field"),
  ).toHaveCount(0);
  await expect(
    root.getByText("Set up in this repo", { exact: true }),
  ).toHaveCount(0);
  await expect(
    root.locator('[data-context-nav] a[href="#repository"]'),
  ).toHaveCount(0);
  await expect(
    root.locator('[data-context-nav="desktop"] .sk-context-nav__empty-copy'),
  ).toHaveText("No repos with Missions yet.");
  await expect(
    root.locator('[data-context-nav="desktop"] .sk-context-nav__overflow-link'),
  ).toHaveText("1 more admitted repo without Missions");

  await page.addInitScript(() => {
    const state = globalThis as typeof globalThis & {
      __dossierAnnouncementTransitions?: Array<{
        oldState: string | null;
        newState: string | null;
        message: string;
      }>;
    };
    state.__dossierAnnouncementTransitions = [];
    new MutationObserver((records) => {
      for (const record of records) {
        if (
          record.type !== "attributes" ||
          !(record.target instanceof HTMLElement) ||
          record.target.tagName.toLowerCase() !== "sk-notice"
        ) {
          continue;
        }
        const notice = record.target as HTMLElement & { message?: string };
        state.__dossierAnnouncementTransitions?.push({
          oldState: record.oldValue,
          newState: notice.getAttribute("data-announcement-state"),
          message: notice.message ?? "",
        });
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["data-announcement-state"],
    });
  });
  root = await openStory(page, "d-7-indexing");
  const pending = root.locator("[data-indexing-state]");
  await expect(pending).toHaveAttribute("aria-busy", "true");
  await expect(pending.locator("sk-notice")).toHaveAttribute(
    "announce",
    "polite",
  );
  await expect(
    pending.getByText("Building the first repository view", { exact: true }),
  ).toBeVisible();
  await expect(
    root.locator("[data-git-context], sk-action-row, progress, sk-copy-field"),
  ).toHaveCount(0);
  await expect(root.locator("[data-mission-count]")).toHaveCount(0);
  const notice = pending.locator("sk-notice");
  await expect(notice).toHaveAttribute("data-announcement-state", "assigned");
  const busyMessage =
    "The first complete render has not been published yet. This page will fill in automatically when rendering finishes.";
  await expect(notice).toHaveJSProperty("message", busyMessage);
  expect(
    await page.evaluate(
      () =>
        (
          globalThis as typeof globalThis & {
            __dossierAnnouncementTransitions?: unknown[];
          }
        ).__dossierAnnouncementTransitions,
    ),
  ).toEqual([
    { oldState: "empty", newState: "assigned", message: busyMessage },
  ]);

  root = await openStory(page, "d-8-no-missions");
  await expect(root.locator("[data-git-context]")).toBeVisible();
  await expect(root.locator("[data-completed-empty]")).toBeVisible();
  await expect(
    root.locator("[data-mission-count], sk-action-row, progress"),
  ).toHaveCount(0);
  await expect(
    root.getByText("Set up in this repo", { exact: true }),
  ).toBeVisible();
  await expect(
    root.locator('[data-context-nav] a[href="#repository"]'),
  ).toHaveCount(0);
  const commit = await root.locator("[data-repository-sha]").textContent();
  await expect(root.locator("[data-empty-sha]")).toHaveText(commit ?? "");
});

test("D6 scopes snapshot disagreement to one Mission and preserves one exact SHA", async ({
  page,
}) => {
  const root = await openStory(page, "d-6-snapshot-behind-log");
  await expect(root.locator("[data-snapshot-warning]")).toHaveCount(1);
  const repositorySha = await root
    .locator("[data-repository-sha]")
    .textContent();
  await expect(root.locator("[data-affected-sha]")).toHaveText(
    repositorySha ?? "",
  );
  await expect(
    root.locator('[data-mission-id="#998"] [data-snapshot-warning]'),
  ).toBeVisible();
  await expect(
    root.locator('[data-mission-id="#1042"] [data-snapshot-warning]'),
  ).toHaveCount(0);
});

test("controlled compact navigation enters focus, dismisses with Escape, and restores focus", async ({
  page,
}) => {
  const root = await openStory(page, "d-2-narrow-closed", {
    width: 390,
    height: 844,
  });
  const shell = root.locator("sk-app-shell");
  const trigger = root.getByRole("button", {
    name: "Repository navigation",
  });
  const drawer = root.locator('[slot="compact-navigation"]');
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(drawer).toHaveAttribute("inert", "");
  await expect(drawer).toHaveAttribute("aria-hidden", "true");
  await trigger.click();
  await expect(shell).toHaveAttribute("open", "");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(drawer).not.toHaveAttribute("inert", "");
  await expect(
    drawer.getByRole("link", { name: "Overview", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(shell).not.toHaveAttribute("open", "");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(drawer).toHaveAttribute("inert", "");
  await expect(trigger).toBeFocused();
});

test("390px layout keeps exact gutters, reflow, drawer, and focus inside the viewport", async ({
  page,
}) => {
  let root = await openStory(page, "d-2-narrow-closed", {
    width: 390,
    height: 844,
  });
  const missionCard = root.locator(
    ".sk-repository-dossier-pattern__mission-card",
  );
  const setupCard = root.locator(".sk-repository-dossier-pattern__setup-card");
  for (const card of [missionCard, setupCard]) {
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.x)).toBe(16);
    expect(Math.round(box!.x + box!.width)).toBe(374);
  }

  const firstMission = root.locator('[data-mission-id="#1042"]');
  const titleBox = await firstMission.locator('[slot="title"]').boundingBox();
  const referenceBox = await firstMission
    .locator('[slot="reference"]')
    .boundingBox();
  expect(titleBox).not.toBeNull();
  expect(referenceBox).not.toBeNull();
  expect(referenceBox!.y).toBeGreaterThanOrEqual(
    titleBox!.y + titleBox!.height,
  );

  const commandBox = await setupCard
    .locator("sk-copy-field")
    .last()
    .boundingBox();
  expect(commandBox).not.toBeNull();
  expect(commandBox!.x).toBeGreaterThanOrEqual(16);
  expect(commandBox!.x + commandBox!.width).toBeLessThanOrEqual(374);

  const trigger = root.getByRole("button", { name: "Repository navigation" });
  await trigger.focus();
  await expect(trigger).toBeFocused();
  const focusBox = await trigger.boundingBox();
  expect(focusBox).not.toBeNull();
  expect(focusBox!.x).toBeGreaterThanOrEqual(0);
  expect(focusBox!.x + focusBox!.width).toBeLessThanOrEqual(390);

  root = await openStory(page, "d-2-narrow-open", {
    width: 390,
    height: 844,
  });
  const drawerBox = await root
    .locator('[slot="compact-navigation"]')
    .boundingBox();
  expect(drawerBox).not.toBeNull();
  expect(drawerBox!.x).toBeGreaterThanOrEqual(0);
  expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(390);
  expect((await documentGeometry(page)).scrollWidth).toBeLessThanOrEqual(390);
});

test("copy fields request exact visible bytes and report real success or failure", async ({
  page,
}) => {
  let root = await openStory(page, "default");
  let host = root
    .locator("sk-copy-field")
    .filter({ hasText: "spec-kitty charter interview" });
  await host.evaluate((element) => {
    const state = globalThis as typeof globalThis & {
      __dossierWrites: string[];
    };
    state.__dossierWrites = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => state.__dossierWrites.push(value),
      },
    });
  });
  const visible = await host.locator('[part="value"]').textContent();
  await host
    .getByRole("button", { name: "Copy Charter interview command" })
    .click();
  await expect(host.getByRole("status")).toHaveText("Value copied.");
  const dispatchHost = root
    .locator("sk-copy-field")
    .filter({ hasText: "spec-kitty dispatch" });
  const dispatchValue = await dispatchHost
    .locator('[part="value"]')
    .textContent();
  await dispatchHost
    .getByRole("button", { name: "Copy Mission dispatch command" })
    .click();
  await expect(dispatchHost.getByRole("status")).toHaveText("Value copied.");
  expect(
    await host.evaluate(
      () =>
        (globalThis as typeof globalThis & { __dossierWrites: string[] })
          .__dossierWrites,
    ),
  ).toEqual([visible, dispatchValue]);

  root = await openStory(page, "d-8-no-missions");
  host = root
    .locator("sk-copy-field")
    .filter({ hasText: "spec-kitty charter interview" });
  await page.evaluate(() => {
    Object.defineProperty(globalThis, "isSecureContext", {
      configurable: true,
      value: false,
    });
    Object.defineProperty(globalThis, "getSelection", {
      configurable: true,
      value: () => null,
    });
  });
  await host
    .getByRole("button", { name: "Copy Charter interview command" })
    .click();
  await expect(host.getByRole("status")).toHaveText(
    "Unable to copy or select the value.",
  );
});

test("progress threshold proof preserves supplied adjacent values and labels", async ({
  page,
}) => {
  const root = await openStory(page, "progress-thresholds");
  const progress = root.locator("progress");
  await expect(progress).toHaveCount(3);
  expect(
    await progress.evaluateAll((elements) =>
      elements.map((element) => ({
        value: (element as HTMLProgressElement).value,
        max: (element as HTMLProgressElement).max,
        text: element.textContent?.trim(),
      })),
    ),
  ).toEqual([
    { value: 59, max: 100, text: "59% done" },
    { value: 60, max: 100, text: "60% done" },
    { value: 61, max: 100, text: "61% done" },
  ]);
  await expect(root.locator(".sk-progress__label")).toHaveText([
    "100 Work Packages",
    "100 Work Packages",
    "100 Work Packages",
  ]);
});

test("narrow, long-data, 200%, and 400% viewport equivalents have no page overflow", async ({
  page,
}) => {
  const cases = [
    { id: "d-2-narrow-closed", width: 390, height: 844 },
    { id: "d-2-narrow-open", width: 390, height: 844 },
    { id: "long-data", width: 390, height: 900 },
    { id: "zoom-200", width: 390, height: 640 },
    { id: "zoom-400", width: 320, height: 640 },
  ] as const;
  for (const item of cases) {
    const root = await openStory(page, item.id, {
      width: item.width,
      height: item.height,
    });
    const geometry = await documentGeometry(page);
    expect(geometry.scrollWidth, item.id).toBeLessThanOrEqual(
      geometry.clientWidth,
    );
    await expect(
      root.getByRole("button", { name: "Copy Mission dispatch command" }),
    ).toBeVisible();
  }

  const root = await openStory(page, "long-data", { width: 390, height: 900 });
  await expect(
    root
      .locator("sk-copy-field")
      .filter({ hasText: "evidence-preserving Repository Dossier capability" })
      .locator('[part="value"]'),
  ).toHaveText(
    'spec-kitty dispatch "Add an intentionally long evidence-preserving Repository Dossier capability without shortening the exact consumer-supplied command value"',
  );
});

test("Chromium CSS zoom stress retains compact containment", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "CSS zoom stress is Chromium-owned");
  for (const item of [
    { id: "zoom-200", width: 780, zoom: "2" },
    { id: "zoom-400", width: 1280, zoom: "4" },
  ] as const) {
    await openStory(page, item.id, { width: item.width, height: 1000 });
    await page.evaluate((zoom) => {
      document.documentElement.style.zoom = zoom;
    }, item.zoom);
    const geometry = await documentGeometry(page);
    expect(geometry.scrollWidth, item.id).toBeLessThanOrEqual(
      geometry.clientWidth,
    );
  }
});

test("LightMode changes authoritative surface tokens without changing content", async ({
  page,
}) => {
  let root = await openStory(page, "default");
  const dark = await root.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const darkHeading = await root
    .getByRole("heading", { level: 1 })
    .textContent();
  root = await openStory(page, "light-mode");
  const light = await root.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(light).not.toBe(dark);
  await expect(root.getByRole("heading", { level: 1 })).toHaveText(
    darkHeading ?? "",
  );
  await expect(root).toHaveClass(/\bsk-light\b/);
});

test("forced colors and reduced motion retain non-color and non-motion meaning", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  let root = await openStory(page, "forced-colors");
  expect(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
  ).toBe(true);
  await expect(root.locator('sk-status-indicator[slot="tags"]')).toContainText(
    "Merged to default",
  );
  const current = root.locator(
    '[data-context-nav="desktop"] [aria-current="page"]',
  );
  await expect(current).toBeVisible();
  expect(
    await current.evaluate(
      (element) => getComputedStyle(element).borderInlineStartStyle,
    ),
  ).not.toBe("none");

  root = await openStory(page, "reduced-motion");
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  await expect(root.locator("sk-status-indicator")).toContainText(
    "Rendering from git",
  );
  const notice = root.locator("sk-notice").locator('[part="notice"]');
  const marker = root.locator("sk-status-indicator").locator('[part="marker"]');
  await expect(notice).toHaveCSS("animation-name", "none");
  await expect(marker).toHaveCSS("animation-name", "none");
});
