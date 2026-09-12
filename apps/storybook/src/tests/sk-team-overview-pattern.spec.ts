import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";

const STORY_IDS = [
  "default",
  "alternate-retention",
  "first-run",
  "light-mode",
  "long-content",
  "copy-outcomes",
] as const;

type StoryId = (typeof STORY_IDS)[number];

const NORMAL_STORY_VIEWPORT = Object.freeze({ width: 1440, height: 1024 });
const ZOOM_200_VIEWPORT = Object.freeze({
  width: NORMAL_STORY_VIEWPORT.width / 2,
  height: NORMAL_STORY_VIEWPORT.height / 2,
});

const loadStory = async (
  page: Page,
  id: StoryId,
  width = 1440,
  height = 1024,
): Promise<Locator> => {
  await page.setViewportSize({ width, height });
  await page.goto(
    `/iframe.html?id=patterns-team-overview--${id}&viewMode=story`,
  );
  const root = page.locator("[data-team-overview-pattern]:visible").first();
  await root.waitFor({ state: "visible", timeout: 20_000 });
  await expect(root).toHaveAttribute("data-render-complete", "true");
  await expect(root.locator("sk-app-shell")).toBeVisible();
  return root;
};

const expectNoDocumentOverflow = async (page: Page): Promise<void> => {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
};

const expectAxeClean = async (page: Page, storyId: StoryId): Promise<void> => {
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
  expect(
    violations,
    `${storyId} must have zero WCAG 2.1 AA violations`,
  ).toEqual([]);
};

const retentionTruth = async (
  root: Locator,
): Promise<
  Readonly<{
    hours: number;
    eventTotal: number;
    summary: string;
    cellCount: number;
  }>
> => {
  const strip = root.locator("[data-retention-hours]");
  const summaryNode = root.locator("[data-event-total]");
  const hours = Number(await strip.getAttribute("data-retention-hours"));
  const eventTotal = Number(await summaryNode.getAttribute("data-event-total"));
  const summary = (await summaryNode.innerText()).trim();
  const cells = root.locator("[data-cell-count]");
  const projectedCellTotal = await cells.evaluateAll((nodes) =>
    nodes.reduce(
      (total, node) =>
        total + Number(node.getAttribute("data-cell-count")),
      0,
    ),
  );

  expect(Number.isFinite(hours)).toBe(true);
  expect(Number.isFinite(eventTotal)).toBe(true);
  expect(summary).toContain(String(hours));
  expect(summary).toContain(String(eventTotal));
  expect(projectedCellTotal).toBe(eventTotal);
  await expect(strip).toHaveAttribute("aria-label", summary);

  return {
    hours,
    eventTotal,
    summary,
    cellCount: await cells.count(),
  };
};

test("source keeps current Team Overview evidence outside runtime and private component APIs", () => {
  const stories = readFileSync(
    "packages/elements/src/patterns/team-overview.stories.ts",
    "utf8",
  );
  const fixture = readFileSync(
    "packages/elements/src/patterns/team-overview.fixture.ts",
    "utf8",
  );
  const source = `${stories}\n${fixture}`;

  expect(source).not.toMatch(/<sk-team-overview(?:\s|>)/u);
  expect(source).not.toMatch(/customElements\.define\s*\(/u);
  expect(source).not.toMatch(/shadowRoot/u);
  expect(source).not.toMatch(/from\s+['"][^'"]*team-kitty/iu);
  expect(source).not.toMatch(/\b(?:fetch|setTimeout|setInterval)\s*\(/u);
  expect(source).not.toMatch(/\bnew\s+Date\s*\(/u);
  expect(source).not.toMatch(/navigator\.clipboard/u);
  expect(stories).toMatch(/['"]\.\.\/copy-field\/sk-copy-field\.js['"]/u);
  expect(stories).toContain("sk-copy-field::part(copy-control)");
  expect(fixture).toContain("TEAM_OVERVIEW_FIRST_RUN_RESPONSES");
  expect(fixture).toContain("deepFreezeTeamOverviewFixture");
  expect(fixture).toContain("retentionCellId");
  expect(fixture).not.toMatch(
    /summary:\s*["'`]\d+\s+events?\s+·\s+last\s+\d+\s+hours?["'`]/u,
  );
});

test("TO1 exposes current semantics, truth boundaries, derived totals, caps, routes, and passive activity", async ({
  page,
}) => {
  const root = await loadStory(page, "default");

  await expect(root.getByRole("heading", { level: 1 })).toHaveText(
    "Collaborative Demo Team",
  );
  await expect(root.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(root.getByRole("heading", { level: 2 })).toHaveText([
    "Velocity",
    "In flight",
    "Admitted repos",
    "Recent activity",
  ]);
  const retention = await retentionTruth(root);
  await expect(root.locator('sk-personal-rail > a[slot="primary"]')).toHaveText(
    ["O", "W"],
  );
  expect(retention.cellCount).toBeGreaterThan(0);
  await expect(root.locator("[data-in-flight-row]")).toHaveCount(1);
  await expect(root.locator("[data-activity-row]")).toHaveCount(
    retention.eventTotal,
  );
  await expect(root.locator("[data-passive-activity] a")).toHaveCount(0);
  await expect(root.locator("[data-passive-activity] button")).toHaveCount(0);
  await expect(root.locator('[data-truth-region="factual"]')).not.toContainText(
    "Observed · up to 60 s behind",
  );
  await expect(root.locator('[data-truth-region="observed"]')).toHaveCount(3);
  await expect(
    root.getByRole("link", { name: "spec-kitty/e2e-team-landing" }).last(),
  ).toHaveAttribute(
    "href",
    "/a/collaborative-demo-team/repos/e2e-team-landing/",
  );

  const links = await root
    .locator("a[href]")
    .evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")),
    );
  expect(
    links.every((href) => href?.startsWith("/a/collaborative-demo-team/")),
  ).toBe(true);
  await expect(root).not.toContainText("Delivery return");
  await expect(root).not.toContainText("Flow health");
  await expect(root).not.toContainText("spend attributed");
});

test("alternate retention derives a different window, cell total, and ordered rows", async ({
  page,
}) => {
  let root = await loadStory(page, "default");
  const defaultRetention = await retentionTruth(root);
  const defaultRows = await root
    .locator("[data-activity-row]")
    .allTextContents();

  root = await loadStory(page, "alternate-retention");
  const alternateRetention = await retentionTruth(root);
  expect(alternateRetention.hours).not.toBe(defaultRetention.hours);
  expect(alternateRetention.summary).not.toBe(defaultRetention.summary);
  expect(alternateRetention.cellCount).toBeGreaterThan(
    defaultRetention.cellCount,
  );
  expect(alternateRetention.eventTotal).not.toBe(defaultRetention.eventTotal);
  expect(await root.locator("[data-activity-row]")).toHaveCount(
    alternateRetention.eventTotal,
  );
  expect(await root.locator("[data-activity-row]").allTextContents()).not.toEqual(
    defaultRows,
  );
  expect(alternateRetention.summary).not.toContain(
    String(defaultRetention.hours),
  );
});

test("default dark and LightMode render the identical fixture with distinct surfaces", async ({
  page,
}) => {
  let root = await loadStory(page, "default");
  const darkText = (await root.innerText()).replace(/\s+/gu, " ").trim();
  const darkSurface = await root.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );

  root = await loadStory(page, "light-mode");
  const lightText = (await root.innerText()).replace(/\s+/gu, " ").trim();
  const lightSurface = await root.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );

  expect(lightText).toBe(darkText);
  expect(lightSurface).not.toBe(darkSurface);
  await expect(root).toHaveClass(/\bsk-light\b/u);
});

test("TO2 switcher exposes exactly six response fixtures and preserves focus/a11y state", async ({
  page,
}) => {
  let root = await loadStory(page, "first-run");
  const selector = root.getByRole("combobox", {
    name: "Server-response fixture",
  });
  await expect(selector.getByRole("option")).toHaveText([
    "Administrator · install current",
    "Joined Team · sign-in current",
    "Administrator · repository current",
    "Administrator · mission current",
    "Member · repository current",
    "Private Teamspace · install current",
  ]);
  await expect(root.locator("[data-review-scaffolding]")).toContainText(
    "outside the product contract",
  );

  const cases = [
    ["admin-install", "Administrator", "Install the Spec Kitty CLI", 0],
    ["joined", "Administrator", "Sign in with the CLI", 1],
    ["admin-repo", "Administrator", "Admit a repository", 2],
    ["admin-mission", "Administrator", "Run a mission together", 3],
    ["member-repo", "Member", "Admit a repository", 2],
    ["private-install", "Private setup", "Install the Spec Kitty CLI", 0],
  ] as const;

  for (const [id, meta, current, completedCount] of cases) {
    await root
      .getByRole("combobox", { name: "Server-response fixture" })
      .selectOption(id);
    root = page.locator("[data-team-overview-pattern]:visible").first();
    await expect(root.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(root.locator("[data-server-response]")).toHaveAttribute(
      "data-server-response",
      id,
    );
    await expect(
      root.locator(".sk-team-overview-pattern__welcome-meta"),
    ).toHaveText(meta);
    await expect(
      root.locator('[data-setup-step][data-state="current"] h3'),
    ).toContainText(current);
    await expect(
      root.locator('[data-setup-step][data-state="completed"]'),
    ).toHaveCount(completedCount);
    await expect(
      root.getByRole("combobox", { name: "Server-response fixture" }),
    ).toBeFocused();
    const aria = await root.ariaSnapshot();
    expect(aria).not.toContain("Delivery return");
    expect(aria).not.toContain("Flow health");
  }
});

test("TO2 role and privacy fixtures omit unauthorized admission and Members routes", async ({
  page,
}) => {
  let root = await loadStory(page, "first-run");
  await root
    .getByRole("combobox", { name: "Server-response fixture" })
    .selectOption("member-repo");
  root = page.locator("[data-team-overview-pattern]:visible").first();
  await expect(
    root.getByRole("link", { name: /Admit a repository/u }),
  ).toHaveCount(0);
  await expect(
    root.getByRole("link", {
      name: /Members|Manage members|Invite teammates/u,
    }),
  ).toHaveCount(0);
  await expect(root).toContainText(
    "An admin admits the first repository for the team.",
  );

  await root
    .getByRole("combobox", { name: "Server-response fixture" })
    .selectOption("private-install");
  root = page.locator("[data-team-overview-pattern]:visible").first();
  await expect(
    root.getByRole("link", { name: "Admit a repository" }),
  ).toHaveCount(1);
  await expect(
    root.getByRole("link", {
      name: /Members|Manage members|Invite teammates/u,
    }),
  ).toHaveCount(0);
  expect(await root.ariaSnapshot()).not.toContain("Members");
});

for (const outcome of ["copied", "manual", "failed"] as const) {
  test(`public copy-field reports ${outcome} with supplied copy and focus retained inside the field`, async ({
    page,
  }) => {
    await page.addInitScript((expectedOutcome) => {
      Object.defineProperty(window, "isSecureContext", {
        configurable: true,
        value: true,
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText:
            expectedOutcome === "copied"
              ? async () => Promise.resolve()
              : async () => Promise.reject(new Error("denied by fixture")),
        },
      });
      if (expectedOutcome === "failed") {
        Object.defineProperty(window, "getSelection", {
          configurable: true,
          value: () => null,
        });
      }
    }, outcome);
    const root = await loadStory(page, "copy-outcomes", 390, 844);
    const field = root.locator(
      'sk-copy-field[data-copy-command="install-commands"]',
    );
    await field.evaluate((element) => {
      element.addEventListener("sk-copy-field-result", (event) => {
        const result = event as CustomEvent<{ readonly outcome: string }>;
        document.body.dataset["copyResult"] = JSON.stringify({
          outcome: result.detail.outcome,
          frozen: Object.isFrozen(result.detail),
          bubbles: result.bubbles,
          composed: result.composed,
          cancelable: result.cancelable,
        });
      });
    });
    await field.getByRole("button", { name: "Copy commands" }).click();
    await expect
      .poll(() => page.locator("body").getAttribute("data-copy-result"))
      .not.toBeNull();
    expect(
      JSON.parse(
        (await page.locator("body").getAttribute("data-copy-result")) ?? "{}",
      ),
    ).toEqual({
      outcome,
      frozen: true,
      bubbles: true,
      composed: true,
      cancelable: false,
    });
    await expect(field).toBeFocused();
    const expectedMessage =
      outcome === "copied"
        ? "Copied to clipboard."
        : outcome === "manual"
          ? "Command selected. Use your system copy shortcut to copy it."
          : "Copy failed. Select the command and copy it manually.";
    await expect(field.getByRole("status")).toHaveText(expectedMessage);
    await expectNoDocumentOverflow(page);
  });
}

test("compact shell drawer is consumer-controlled and returns focus after accepted Escape", async ({
  page,
}) => {
  const root = await loadStory(page, "default", 390, 844);
  const trigger = root.getByRole("button", { name: "Open team navigation" });
  const appShell = root.locator("sk-app-shell");

  await trigger.click();
  await expect(appShell).toHaveAttribute("open");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    root.getByRole("link", { name: "Overview" }).last(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(appShell).not.toHaveAttribute("open");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("responsive, short-viewport, long-copy, RTL, and media modes preserve containment", async ({
  page,
}) => {
  for (const [id, width, height] of [
    ["default", NORMAL_STORY_VIEWPORT.width, NORMAL_STORY_VIEWPORT.height],
    ["default", 1123, 1024],
    ["default", 860, 844],
    ["default", 859, 844],
    ["default", 390, 844],
    ["first-run", 390, 540],
    ["long-content", 390, 844],
  ] as const) {
    const root = await loadStory(page, id, width, height);
    await expectNoDocumentOverflow(page);
    const boxes = await root
      .locator("a:visible, button:visible, select:visible")
      .evaluateAll((controls) =>
        controls.map((control) => {
          const box = control.getBoundingClientRect();
          return {
            width: box.width,
            height: box.height,
            left: box.left,
            right: box.right,
          };
        }),
      );
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width + 1);
      if (width === 390)
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    }
  }

  const root = await loadStory(page, "default", 390, 844);
  await root.evaluate((node) => node.setAttribute("dir", "rtl"));
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await expect(root).toHaveAttribute("dir", "rtl");
  await expectNoDocumentOverflow(page);
  await root.getByRole("button", { name: "Open team navigation" }).focus();
  await expect(
    root.getByRole("button", { name: "Open team navigation" }),
  ).toBeFocused();
});

test("CSS zoom is supplemental magnification stress and remains contained", async ({
  page,
  browserName,
}) => {
  const root = await loadStory(page, "long-content", 780, 844);
  await root.evaluate((node) => {
    node.style.zoom = "2";
  });
  expect(await root.evaluate((node) => getComputedStyle(node).zoom)).toBe("2");
  if (browserName === "chromium") await expectNoDocumentOverflow(page);
});

test("real 200% zoom halves the CSS viewport and crosses the compact-shell breakpoint", async ({
  page,
  browser,
  baseURL,
}) => {
  const normalRoot = await loadStory(
    page,
    "long-content",
    NORMAL_STORY_VIEWPORT.width,
    NORMAL_STORY_VIEWPORT.height,
  );
  const normalRail = normalRoot.locator('sk-personal-rail[slot="personal-rail"]');
  const normalCompactHeader = normalRoot.locator('[slot="compact-header"]');
  await expect(normalRail).not.toHaveAttribute("inert");
  await expect(normalRail).not.toHaveAttribute("aria-hidden");
  await expect(normalCompactHeader).toHaveAttribute("inert", "");
  await expect(normalCompactHeader).toHaveAttribute("aria-hidden", "true");

  const zoomContext = await browser.newContext({
    baseURL,
    deviceScaleFactor: 2,
    viewport: ZOOM_200_VIEWPORT,
  });
  try {
    const zoomPage = await zoomContext.newPage();
    const root = await loadStory(
      zoomPage,
      "long-content",
      ZOOM_200_VIEWPORT.width,
      ZOOM_200_VIEWPORT.height,
    );
    const viewport = await zoomPage.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      deviceScaleFactor: window.devicePixelRatio,
    }));
    expect(
      viewport,
      "200% zoom must halve the normal CSS viewport; retaining the old 780px CSS viewport is not equivalent",
    ).toEqual({
      width: NORMAL_STORY_VIEWPORT.width / 2,
      height: NORMAL_STORY_VIEWPORT.height / 2,
      deviceScaleFactor: 2,
    });

    const compactHeader = root.locator('[slot="compact-header"]');
    const rail = root.locator('sk-personal-rail[slot="personal-rail"]');
    await expect(compactHeader).not.toHaveAttribute("inert");
    await expect(compactHeader).not.toHaveAttribute("aria-hidden");
    await expect(rail).toHaveAttribute("inert", "");
    await expect(rail).toHaveAttribute("aria-hidden", "true");

    await expectNoDocumentOverflow(zoomPage);
    const rootBox = await root.boundingBox();
    expect(rootBox).not.toBeNull();
    expect(rootBox!.x).toBeGreaterThanOrEqual(0);
    expect(rootBox!.x + rootBox!.width).toBeLessThanOrEqual(
      ZOOM_200_VIEWPORT.width + 1,
    );

    const trigger = root.getByRole("button", { name: "Open team navigation" });
    await trigger.focus();
    await expect(trigger).toBeFocused();
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(Math.min(triggerBox!.width, triggerBox!.height)).toBeGreaterThanOrEqual(
      44,
    );
    expect(triggerBox!.x).toBeGreaterThanOrEqual(0);
    expect(triggerBox!.x + triggerBox!.width).toBeLessThanOrEqual(
      ZOOM_200_VIEWPORT.width + 1,
    );
  } finally {
    await zoomContext.close();
  }
});

test("all six discovered stories are non-empty and axe-clean", async ({
  page,
}) => {
  for (const id of STORY_IDS) {
    const root = await loadStory(page, id, 1440, 1024);
    await expect(root.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect((await root.innerText()).trim().length).toBeGreaterThan(80);
    await expectAxeClean(page, id);
  }
});
