import { expect, test, type Locator, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const BOARD_CSS = "packages/styles/src/workflow-board/sk-workflow-board.css";
const LANE_CSS = "packages/styles/src/workflow-lane/sk-workflow-lane.css";
const BOARD_BARREL = "packages/styles/src/workflow-board/index.ts";
const LANE_BARREL = "packages/styles/src/workflow-lane/index.ts";
const TOKEN_SOURCE = "packages/tokens/src/tokens.css";
const STYLES_PACKAGE = "packages/styles/package.json";
const STYLES_ROOT = "packages/styles/src/index.ts";
const COMPONENT_USAGE_DOC = "docs/design-system/using-components.md";
const TOKEN_LITERAL_CHECKER = "scripts/check-component-token-literals.mjs";

const BOARD_STORY_PREFIX = "primitives-skworkflowboard-html";
const LANE_STORY_PREFIX = "primitives-skworkflowlane-html";

const ALLOWED_CLASSES = [
  "sk-workflow-board",
  "sk-workflow-board__scroller",
  "sk-workflow-lane",
  "sk-workflow-lane__header",
  "sk-workflow-lane__title",
  "sk-workflow-lane__count",
  "sk-workflow-lane__list",
] as const;

const boardStoryCases = [
  { id: "default", fixture: "populated", alias: true },
  { id: "populated", fixture: "populated", alias: false },
  { id: "fitting", fixture: "fitting", alias: false },
  { id: "all-empty", fixture: "all-empty", alias: false },
  { id: "one-empty-lane", fixture: "one-empty-lane", alias: false },
  { id: "fifty-items", fixture: "fifty-items", alias: false },
  {
    id: "long-labels-and-items",
    fixture: "long-labels-and-items",
    alias: false,
  },
  {
    id: "single-lane-narrow",
    fixture: "single-lane-narrow",
    alias: false,
  },
  { id: "forced-colors", fixture: "one-empty-lane", alias: true },
  { id: "default-dark", fixture: "populated", alias: true },
  { id: "light-mode", fixture: "populated", alias: true },
] as const;

type BoardStoryId = (typeof boardStoryCases)[number]["id"];

const declaredViewport: Record<
  BoardStoryId,
  { width: number; height: number }
> = {
  default: { width: 1024, height: 720 },
  populated: { width: 1024, height: 720 },
  fitting: { width: 1600, height: 720 },
  "all-empty": { width: 1024, height: 720 },
  "one-empty-lane": { width: 1024, height: 720 },
  "fifty-items": { width: 1024, height: 900 },
  "long-labels-and-items": { width: 360, height: 720 },
  "single-lane-narrow": { width: 320, height: 720 },
  "forced-colors": { width: 1024, height: 720 },
  "default-dark": { width: 1024, height: 720 },
  "light-mode": { width: 1024, height: 720 },
};

type LoadedStory = {
  root: Locator;
  consoleErrors: string[];
  pageErrors: string[];
};

async function openStory(
  page: Page,
  prefix: string,
  id: string,
  rootSelector: string,
): Promise<LoadedStory> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await page.goto(`/iframe.html?id=${prefix}--${id}&viewMode=story`);
  const root = page.locator(rootSelector).first();
  await root.waitFor({ state: "visible", timeout: 20000 });
  await expect(root).not.toBeEmpty();
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  return { root, consoleErrors, pageErrors };
}

async function openBoard(page: Page, id: BoardStoryId): Promise<LoadedStory> {
  await page.setViewportSize(declaredViewport[id]);
  return openStory(page, BOARD_STORY_PREFIX, id, ".sk-workflow-board");
}

function readGeneratedFixtures(
  path: string,
): Array<{ name: string; html: string }> {
  const source = readFileSync(path, "utf8");
  const fixtures: Array<{ name: string; html: string }> = [];
  for (const match of source.matchAll(/^export const (\w+) = (".*");$/gm)) {
    fixtures.push({ name: match[1], html: JSON.parse(match[2]) as string });
  }
  if (fixtures.length === 0)
    throw new Error(`no generated fixtures parsed from ${path}`);
  return fixtures;
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

async function pageGeometry(page: Page) {
  return page.evaluate(() => {
    const documentScroller =
      document.scrollingElement ?? document.documentElement;
    return {
      clientWidth: documentScroller.clientWidth,
      scrollWidth: documentScroller.scrollWidth,
    };
  });
}

async function assertNativeLaneContract(root: Locator): Promise<void> {
  const lanes = root.locator(".sk-workflow-lane");
  const laneCount = await lanes.count();
  expect(laneCount).toBeGreaterThan(0);

  for (let index = 0; index < laneCount; index += 1) {
    const lane = lanes.nth(index);
    expect(await lane.evaluate((node) => node.tagName)).toBe("SECTION");
    const titleId = await lane.getAttribute("aria-labelledby");
    expect(titleId).toBeTruthy();
    const title = lane.locator(`#${titleId}`);
    await expect(title).toHaveCount(1);
    await expect(title).toHaveClass(/\bsk-workflow-lane__title\b/);
    expect(await title.evaluate((node) => /^H[2-6]$/.test(node.tagName))).toBe(
      true,
    );
    await expect(lane).toHaveRole("region");
    await expect(lane).toHaveAccessibleName(await title.innerText());

    const list = lane.locator(":scope > .sk-workflow-lane__list");
    await expect(list).toHaveCount(1);
    expect(await list.evaluate((node) => node.tagName)).toBe("OL");
    await expect(list).toHaveRole("list");
    const directItems = list.locator(":scope > li");
    const roleItems = list.getByRole("listitem");
    await expect(roleItems).toHaveCount(await directItems.count());
    expect(await roleItems.allInnerTexts()).toEqual(
      await directItems.allInnerTexts(),
    );
    const suppliedCount = (
      await lane.locator(".sk-workflow-lane__count").innerText()
    ).trim();
    expect(suppliedCount).toBe(String(await directItems.count()));
  }
}

async function assertConditionalScrollerContract(root: Locator): Promise<void> {
  const scroller = root.locator(".sk-workflow-board__scroller");
  const facts = await scroller.evaluate((node) => {
    const ariaLabel = node.getAttribute("aria-label");
    const ariaLabelledBy = node.getAttribute("aria-labelledby");
    const labelledByIds =
      ariaLabelledBy?.trim().split(/\s+/).filter(Boolean) ?? [];
    const labelledByTargets = labelledByIds.map((id) =>
      document.getElementById(id),
    );
    return {
      overflowing: node.scrollWidth > node.clientWidth,
      role: node.getAttribute("role"),
      tabindex: node.getAttribute("tabindex"),
      ariaLabel,
      ariaLabelledBy,
      labelTargetCount: labelledByTargets.filter(Boolean).length,
      labelledByIdCount: labelledByIds.length,
      labelledText: labelledByTargets
        .map((target) => target?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" "),
    };
  });

  const namingMethods = [facts.ariaLabel, facts.ariaLabelledBy].filter(
    (value): value is string => value !== null,
  );
  if (facts.overflowing) {
    expect(facts.role).toBe("region");
    expect(facts.tabindex).toBe("0");
    expect(namingMethods).toHaveLength(1);
    expect(namingMethods[0]!.trim().length).toBeGreaterThan(0);
    if (facts.ariaLabelledBy !== null) {
      expect(facts.labelledByIdCount).toBeGreaterThan(0);
      expect(facts.labelTargetCount).toBe(facts.labelledByIdCount);
      expect(facts.labelledText.length).toBeGreaterThan(0);
    }
    await expect(scroller).toHaveRole("region");
    await expect(scroller).toHaveAccessibleName(/\S/);
  } else {
    expect(facts.role).toBeNull();
    expect(facts.tabindex).toBeNull();
    expect(namingMethods).toHaveLength(0);
  }
}

test.describe("workflow board source and distribution contract", () => {
  test("the public CSS inventory is exactly the seven approved classes and contains no adjacent behavior", () => {
    const source = `${readFileSync(BOARD_CSS, "utf8")}\n${readFileSync(LANE_CSS, "utf8")}`;
    const code = stripComments(source);
    const classes = [
      ...new Set(
        [
          ...code.matchAll(/\.((?:sk-workflow-(?:board|lane))[a-z0-9_-]*)/g),
        ].map((match) => match[1]),
      ),
    ].sort();
    expect(classes).toEqual([...ALLOWED_CLASSES].sort());
    expect(code).not.toMatch(
      /(?:^|[;{])\s*(?:content|order|transition|animation|scroll-behavior)\s*:/m,
    );
    expect(code).not.toMatch(/forced-color-adjust\s*:\s*none/);
    expect(code).not.toMatch(/(?:\.sk-light|data-theme|:root|:host-context)/);
    expect(code).not.toMatch(
      /(?:planned|doing|review|approved|done|kanban|work-package-card|workflow-item)/i,
    );
  });

  test("the surface remains styles-only and does not enter element, wrapper, manifest, or behavior ownership", () => {
    expect(existsSync("packages/elements/src/workflow-board")).toBe(false);
    expect(existsSync("packages/elements/src/workflow-lane")).toBe(false);
    expect(existsSync("packages/react/src/SkWorkflowBoard.tsx")).toBe(false);
    expect(existsSync("packages/react/src/SkWorkflowLane.tsx")).toBe(false);
    for (const path of [
      "packages/elements/custom-elements.json",
      "expected-parts.json",
      "expected-docs.json",
      "behaviours.json",
      "mutations.json",
    ]) {
      expect(readFileSync(path, "utf8")).not.toMatch(
        /sk-workflow-(?:board|lane)/,
      );
    }
  });

  test("one measured, theme-invariant layout token backs every lane minimum", () => {
    const tokens = readFileSync(TOKEN_SOURCE, "utf8");
    const declarations = [
      ...tokens.matchAll(
        /--sk-layout-workflow-lane-min-inline-size:\s*([^;]+);/g,
      ),
    ].map((match) => match[1].trim());
    expect(declarations).toHaveLength(2);
    expect(new Set(declarations).size).toBe(1);

    const laneCss = stripComments(readFileSync(LANE_CSS, "utf8"));
    expect(laneCss).toMatch(
      /min-inline-size:\s*var\(--sk-layout-workflow-lane-min-inline-size\)/,
    );
    expect(laneCss).not.toMatch(
      /var\(--sk-layout-(?:personal-rail|context-sidebar)/,
    );
  });

  test("the parsed token-literal gate proves its red probes and checks both workflow stylesheets", () => {
    const selftestOutput = execFileSync(
      process.execPath,
      [TOKEN_LITERAL_CHECKER, "--selftest"],
      { encoding: "utf8" },
    );
    expect(selftestOutput).toContain("governed token classes fail red");

    const output = execFileSync(
      process.execPath,
      [TOKEN_LITERAL_CHECKER, BOARD_CSS, LANE_CSS],
      { encoding: "utf8" },
    );
    expect(output).toContain(
      "2 explicit component stylesheet(s) use tokens for all governed values",
    );
  });

  test("the canonical fitting documentation omits the overflow-only scroller triad", () => {
    const docs = readFileSync(COMPONENT_USAGE_DOC, "utf8");
    const section = docs.slice(
      docs.indexOf("## Workflow board and lanes"),
      docs.indexOf("## Installation"),
    );
    const firstScroller = section.match(
      /<div\s+class="sk-workflow-board__scroller"[^>]*>/,
    );
    expect(firstScroller).not.toBeNull();
    expect(firstScroller![0]).not.toMatch(
      /(?:role|aria-label|aria-labelledby|tabindex)=/,
    );
    expect(section).toContain("scroller.scrollWidth > scroller.clientWidth");
    expect(section).toMatch(
      /scroller\.setAttribute\(["']role["'], ["']region["']\)/,
    );
    expect(section).toMatch(
      /scroller\.setAttribute\(["']tabindex["'], ["']0["']\)/,
    );
  });

  test("generated fixtures, root exports, and package subpaths expose both styles-only families", () => {
    expect(readGeneratedFixtures(BOARD_BARREL)).toHaveLength(7);
    expect(readGeneratedFixtures(LANE_BARREL)).toHaveLength(2);

    const root = readFileSync(STYLES_ROOT, "utf8");
    expect(root).toMatch(/export \* from ["']\.\/workflow-board\/index["'];/);
    expect(root).toMatch(/export \* from ["']\.\/workflow-lane\/index["'];/);
    const packageJson = JSON.parse(readFileSync(STYLES_PACKAGE, "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(packageJson.exports["./workflow-board/*"]).toBe(
      "./dist/workflow-board/*",
    );
    expect(packageJson.exports["./workflow-lane/*"]).toBe(
      "./dist/workflow-lane/*",
    );
  });

  test("authored fixtures forge no list/grid semantics and generate no accessible text", () => {
    const markup = [
      ...readGeneratedFixtures(BOARD_BARREL),
      ...readGeneratedFixtures(LANE_BARREL),
    ]
      .map(({ html }) => html)
      .join("\n");
    expect(markup).not.toMatch(
      /role="(?:grid|row|list|listitem|listbox|option)"/,
    );
    expect(markup).not.toMatch(/<sk-workflow-(?:board|lane)\b/);
    expect(markup).not.toMatch(/sk-workflow-(?:item|lane--|board--)/);
  });
});

test.describe("workflow board stories are non-vacuous and console-clean", () => {
  for (const { id } of boardStoryCases) {
    test(`${id} renders a visible board without browser errors or page overflow`, async ({
      page,
    }) => {
      const loaded = await openBoard(page, id);
      expect(loaded.consoleErrors).toEqual([]);
      expect(loaded.pageErrors).toEqual([]);
      const geometry = await pageGeometry(page);
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
    });
  }

  for (const id of ["default", "empty", "light-mode"] as const) {
    test(`lane ${id} renders a visible native lane without browser errors`, async ({
      page,
    }) => {
      const loaded = await openStory(
        page,
        LANE_STORY_PREFIX,
        id,
        ".sk-workflow-lane",
      );
      expect(loaded.consoleErrors).toEqual([]);
      expect(loaded.pageErrors).toEqual([]);
      await assertNativeLaneContract(loaded.root.locator(".."));
    });
  }
});

test.describe("native sections, lists, counts, and source order", () => {
  test("Populated exposes five named native lanes and ordered lists in consumer order", async ({
    page,
  }) => {
    const { root } = await openBoard(page, "populated");
    await assertNativeLaneContract(root);
    await expect(root.locator(".sk-workflow-lane__title")).toHaveText([
      "Planned",
      "Doing",
      "In review",
      "Approved",
      "Done",
    ]);
    await expect(root.getByRole("list")).toHaveCount(5);
  });

  test("AllEmpty keeps five zero-item lists and five visible sibling empty treatments", async ({
    page,
  }) => {
    const { root } = await openBoard(page, "all-empty");
    await assertNativeLaneContract(root);
    await expect(root.locator(".sk-workflow-lane__list")).toHaveCount(5);
    await expect(root.getByRole("listitem")).toHaveCount(0);
    const emptyStates = root.locator(".sk-empty-state");
    await expect(emptyStates).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      expect(
        await emptyStates
          .nth(index)
          .evaluate((node) => node.previousElementSibling?.tagName),
      ).toBe("OL");
      await expect(emptyStates.nth(index)).toBeVisible();
    }
  });

  test("OneEmptyLane has exactly one empty list and every supplied count matches cardinality", async ({
    page,
  }) => {
    const { root } = await openBoard(page, "one-empty-lane");
    await assertNativeLaneContract(root);
    const lists = root.locator(
      ".sk-workflow-lane > .sk-workflow-lane__list",
    );
    const lengths = await lists.evaluateAll((laneLists) =>
      laneLists.map((list) => list.querySelectorAll(":scope > li").length),
    );
    const emptyListIndexes = lengths.flatMap((count, index) =>
      count === 0 ? [index] : [],
    );
    expect(emptyListIndexes).toHaveLength(1);

    const emptyLane = lists.nth(emptyListIndexes[0]!).locator("..");
    await expect(emptyLane).toHaveClass(/\bsk-workflow-lane\b/);
    const laneEmptyState = emptyLane.locator(":scope > .sk-empty-state");
    await expect(laneEmptyState).toHaveCount(1);
    await expect(laneEmptyState).toBeVisible();
    await expect(root.locator(".sk-empty-state")).toHaveCount(1);
  });

  test("FiftyItems exposes fifty direct native items in unmodified source order and supplied count 50", async ({
    page,
  }) => {
    const { root } = await openBoard(page, "fifty-items");
    await assertNativeLaneContract(root);
    const lane = root.locator(".sk-workflow-lane").first();
    const items = lane.locator(".sk-workflow-lane__list > li");
    await expect(items).toHaveCount(50);
    await expect(lane.getByRole("listitem")).toHaveCount(50);
    await expect(lane.locator(".sk-workflow-lane__count")).toHaveText("50");
    expect(await items.allTextContents()).toEqual(
      Array.from(
        { length: 50 },
        (_, index) => `Work package ${String(index + 1).padStart(2, "0")}`,
      ),
    );
  });
});

test.describe("conditional overflow semantics and keyboard operation", () => {
  for (const { id, fixture, alias } of boardStoryCases) {
    test(`${id} (${alias ? "alias of " : "fixture "}${fixture}) derives the complete scroller triad from measured overflow`, async ({
      page,
    }) => {
      const { root } = await openBoard(page, id);
      await assertConditionalScrollerContract(root);
    });
  }

  test("focused overflow shows an outline and ArrowRight/ArrowLeft scroll without losing focus", async ({
    page,
  }) => {
    const { root } = await openBoard(page, "populated");
    const scroller = root.locator(".sk-workflow-board__scroller");
    await scroller.evaluate((node) => {
      node.scrollLeft = 0;
    });
    await page.locator("body").press("Tab");
    await expect(scroller).toBeFocused();
    const focusStyle = await scroller.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focusStyle.outlineStyle).not.toBe("none");
    expect(focusStyle.outlineWidth).toBeGreaterThan(0);

    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => scroller.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(0);
    const movedRight = await scroller.evaluate((node) => node.scrollLeft);
    await page.keyboard.press("ArrowLeft");
    await expect
      .poll(() => scroller.evaluate((node) => node.scrollLeft))
      .toBeLessThan(movedRight);
    await expect(scroller).toBeFocused();
  });
});

test.describe("calibrated geometry, themes, and forced colors", () => {
  test("the 320px single-lane composition fits and resolves the measured lane token", async ({
    page,
  }) => {
    const { root } = await openBoard(page, "single-lane-narrow");
    await expect(root.locator(".sk-workflow-lane")).toHaveCount(1);
    const values = await root.locator(".sk-workflow-lane").evaluate((lane) => ({
      laneMinimum: getComputedStyle(lane).minInlineSize,
      token: getComputedStyle(lane)
        .getPropertyValue("--sk-layout-workflow-lane-min-inline-size")
        .trim(),
    }));
    expect(values.token).toBe("13.75rem");
    expect(values.laneMinimum).toBe("220px");
  });

  test("long lane and item labels wrap without overlap or lane-internal overflow", async ({
    page,
  }) => {
    const { root } = await openBoard(page, "long-labels-and-items");
    for (const lane of await root.locator(".sk-workflow-lane").all()) {
      const laneGeometry = await lane.evaluate((node) => ({
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
      }));
      expect(laneGeometry.scrollWidth).toBeLessThanOrEqual(
        laneGeometry.clientWidth,
      );
      const header = lane.locator(".sk-workflow-lane__header");
      const title = lane.locator(".sk-workflow-lane__title");
      const count = lane.locator(".sk-workflow-lane__count");
      const boxes = await Promise.all([
        header.boundingBox(),
        title.boundingBox(),
        count.boundingBox(),
      ]);
      expect(boxes.every(Boolean)).toBe(true);
      expect(boxes[1]!.x + boxes[1]!.width).toBeLessThanOrEqual(boxes[2]!.x);
    }
    const focusTarget = root.getByRole("link").last();
    await page.locator("body").press("Tab");
    await expect(root.locator(".sk-workflow-board__scroller")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(focusTarget).toBeFocused();
    const [targetBox, laneBox, scrollerBox] = await Promise.all([
      focusTarget.boundingBox(),
      focusTarget.locator("xpath=ancestor::section[1]").boundingBox(),
      root.locator(".sk-workflow-board__scroller").boundingBox(),
    ]);
    expect(targetBox).not.toBeNull();
    expect(laneBox).not.toBeNull();
    expect(scrollerBox).not.toBeNull();
    expect(targetBox!.x).toBeGreaterThanOrEqual(laneBox!.x);
    expect(targetBox!.x + targetBox!.width).toBeLessThanOrEqual(
      laneBox!.x + laneBox!.width,
    );
    expect(targetBox!.x).toBeLessThan(scrollerBox!.x + scrollerBox!.width);
    expect(targetBox!.x + targetBox!.width).toBeGreaterThan(scrollerBox!.x);
  });

  test("220px is the smallest qualifying candidate in the 220–360px browser sweep", async ({
    page,
  }) => {
    const candidates = [220, 240, 260, 280, 300, 320, 340, 360];
    const rows: Array<{
      candidate: number;
      populatedClient: number;
      populatedScroll: number;
      single320Client: number;
      single320Scroll: number;
      single360Client: number;
      single360Scroll: number;
      longContained: boolean;
      pageContained: boolean;
    }> = [];

    for (const candidate of candidates) {
      await page.setViewportSize({ width: 1024, height: 720 });
      let loaded = await openStory(
        page,
        BOARD_STORY_PREFIX,
        "populated",
        ".sk-workflow-board",
      );
      await loaded.root.evaluate((node, value) => {
        node.style.setProperty(
          "--sk-layout-workflow-lane-min-inline-size",
          `${value}px`,
        );
      }, candidate);
      const populated = await loaded.root
        .locator(".sk-workflow-board__scroller")
        .evaluate((node) => ({
          client: node.clientWidth,
          scroll: node.scrollWidth,
        }));

      const singleMeasurements: Record<
        320 | 360,
        { client: number; scroll: number }
      > = {
        320: { client: 0, scroll: 0 },
        360: { client: 0, scroll: 0 },
      };
      let pageContained = true;
      for (const width of [320, 360] as const) {
        await page.setViewportSize({ width, height: 720 });
        loaded = await openStory(
          page,
          BOARD_STORY_PREFIX,
          "single-lane-narrow",
          ".sk-workflow-board",
        );
        await loaded.root.evaluate((node, value) => {
          node.style.setProperty(
            "--sk-layout-workflow-lane-min-inline-size",
            `${value}px`,
          );
        }, candidate);
        singleMeasurements[width] = await loaded.root
          .locator(".sk-workflow-board__scroller")
          .evaluate((node) => ({
            client: node.clientWidth,
            scroll: node.scrollWidth,
          }));
        const documentGeometry = await pageGeometry(page);
        pageContained &&=
          documentGeometry.scrollWidth <= documentGeometry.clientWidth;
      }

      await page.setViewportSize({ width: 360, height: 720 });
      loaded = await openStory(
        page,
        BOARD_STORY_PREFIX,
        "long-labels-and-items",
        ".sk-workflow-board",
      );
      await loaded.root.evaluate((node, value) => {
        node.style.setProperty(
          "--sk-layout-workflow-lane-min-inline-size",
          `${value}px`,
        );
      }, candidate);
      const longContained = await loaded.root
        .locator(".sk-workflow-lane")
        .evaluateAll((lanes) =>
          lanes.every((lane) => lane.scrollWidth <= lane.clientWidth),
        );
      const longPage = await pageGeometry(page);
      pageContained &&= longPage.scrollWidth <= longPage.clientWidth;

      rows.push({
        candidate,
        populatedClient: populated.client,
        populatedScroll: populated.scroll,
        single320Client: singleMeasurements[320].client,
        single320Scroll: singleMeasurements[320].scroll,
        single360Client: singleMeasurements[360].client,
        single360Scroll: singleMeasurements[360].scroll,
        longContained,
        pageContained,
      });
    }

    test.info().annotations.push({
      type: "workflow-lane-calibration",
      description: JSON.stringify(rows),
    });
    const firstQualifying = rows.find(
      (row) =>
        row.populatedScroll > row.populatedClient &&
        row.single320Scroll <= row.single320Client &&
        row.single360Scroll <= row.single360Client &&
        row.longContained &&
        row.pageContained,
    );
    expect(firstQualifying?.candidate).toBe(220);
  });

  test("LightMode changes real token-dependent values while preserving semantic markup", async ({
    page,
  }) => {
    const dark = await openBoard(page, "default-dark");
    const darkHtml = await dark.root.innerHTML();
    const darkStyle = await dark.root
      .locator(".sk-workflow-lane")
      .first()
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          background: style.backgroundColor,
          border: style.borderColor,
          color: style.color,
        };
      });

    const light = await openBoard(page, "light-mode");
    await expect(
      light.root.locator(
        'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " sk-light ")]',
      ),
    ).toHaveCount(1);
    expect(await light.root.innerHTML()).toBe(darkHtml);
    const lightStyle = await light.root
      .locator(".sk-workflow-lane")
      .first()
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          background: style.backgroundColor,
          border: style.borderColor,
          color: style.color,
        };
      });
    expect(lightStyle).not.toEqual(darkStyle);
  });

  test("forced colors preserves lane boundaries, empty treatment, focus, names, counts, and containment", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Playwright forced-colors emulation is Chromium-specific",
    );
    await page.emulateMedia({ forcedColors: "active" });
    const { root } = await openBoard(page, "forced-colors");
    await assertNativeLaneContract(root);
    const emptyState = root.locator(".sk-empty-state");
    await expect(emptyState).toBeVisible();
    const paint = await root.evaluate((board) => {
      const isTransparent = (color: string) =>
        color === "transparent" ||
        color === "rgba(0, 0, 0, 0)" ||
        color === "rgba(0,0,0,0)";
      const effectiveBackground = (start: Element): string => {
        let node: Element | null = start;
        while (node) {
          const background = getComputedStyle(node).backgroundColor;
          if (!isTransparent(background)) return background;
          node = node.parentElement;
        }
        return getComputedStyle(document.documentElement).backgroundColor;
      };
      const lanes = [
        ...board.querySelectorAll<HTMLElement>(".sk-workflow-lane"),
      ].map((lane) => {
        const style = getComputedStyle(lane);
        return {
          borderStyle: style.borderInlineStartStyle,
          borderWidth: Number.parseFloat(style.borderInlineStartWidth),
          borderColor: style.borderInlineStartColor,
          background: effectiveBackground(lane),
        };
      });
      const emptyCopy = board.querySelector<HTMLElement>(
        ".sk-empty-state__body",
      )!;
      const emptyStyle = getComputedStyle(emptyCopy);
      return {
        lanes,
        empty: {
          color: emptyStyle.color,
          background: effectiveBackground(emptyCopy),
        },
      };
    });
    for (const lane of paint.lanes) {
      expect(lane.borderStyle).not.toBe("none");
      expect(lane.borderWidth).toBeGreaterThan(0);
      expect(lane.borderColor).not.toBe("");
      expect(lane.borderColor).not.toBe(lane.background);
    }
    expect(paint.empty.color).not.toBe("");
    expect(paint.empty.color).not.toBe(paint.empty.background);
    const scroller = root.locator(".sk-workflow-board__scroller");
    await page.locator("body").press("Tab");
    await expect(scroller).toBeFocused();
    const focusPaint = await scroller.evaluate((node) => {
      const isTransparent = (color: string) =>
        color === "transparent" ||
        color === "rgba(0, 0, 0, 0)" ||
        color === "rgba(0,0,0,0)";
      let ancestor: Element | null = node;
      let ground = "";
      while (ancestor) {
        const background = getComputedStyle(ancestor).backgroundColor;
        if (!isTransparent(background)) {
          ground = background;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      const style = getComputedStyle(node);
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
        color: style.outlineColor,
        ground,
      };
    });
    expect(focusPaint.style).not.toBe("none");
    expect(focusPaint.width).toBeGreaterThan(0);
    expect(focusPaint.color).not.toBe("");
    expect(focusPaint.color).not.toBe(focusPaint.ground);
    const geometry = await pageGeometry(page);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  });
});
