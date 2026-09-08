import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

const SEGMENTED_CHOICE_CSS =
  "packages/styles/src/segmented-choice/sk-segmented-choice.css";
const SEGMENTED_CHOICE_BARREL = "packages/styles/src/segmented-choice/index.ts";
const SEGMENTED_CHOICE_STORIES =
  "packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts";
const COMPONENT_USAGE_DOC = "docs/design-system/using-components.md";
const STORY_PREFIX = "components-sksegmentedchoice-html";

const storyIds = [
  "default",
  "second-selected",
  "third-selected",
  "two-items",
  "five-items",
  "long-labels",
  "no-selection",
  "all-disabled",
  "one-disabled",
  "narrow",
  "forced-colors",
  "default-dark",
  "light-mode",
] as const;

type StoryId = (typeof storyIds)[number];

const pressedByStory: Record<StoryId, boolean[]> = {
  default: [true, false, false],
  "second-selected": [false, true, false],
  "third-selected": [false, false, true],
  "two-items": [true, false],
  "five-items": [false, true, false, false, false],
  "long-labels": [true, false, false],
  "no-selection": [false, false, false],
  "all-disabled": [true, false, false],
  "one-disabled": [true, false, false],
  narrow: [true, false, false],
  "forced-colors": [true, false, false],
  "default-dark": [true, false, false],
  "light-mode": [true, false, false],
};

type LoadedStory = {
  group: Locator;
  consoleErrors: string[];
  pageErrors: string[];
};

type Cue = {
  backgroundColor: string;
  borderColor: string;
  borderStyle: string;
  borderWidth: string;
  borderBlockEndWidth: string;
  borderRadius: string;
  cursor: string;
  fontStyle: string;
  fontWeight: string;
  outlineColor: string;
  outlineStyle: string;
  outlineWidth: string;
};

async function openStory(page: Page, id: StoryId): Promise<LoadedStory> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await page.goto(`/iframe.html?id=${STORY_PREFIX}--${id}&viewMode=story`);
  const group = page.getByRole("group").first();
  await group.waitFor({ state: "visible", timeout: 20_000 });
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  return { group, consoleErrors, pageErrors };
}

const cueOf = (item: Locator): Promise<Cue> =>
  item.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderStyle: style.borderStyle,
      borderWidth: style.borderWidth,
      borderBlockEndWidth: style.borderBlockEndWidth,
      borderRadius: style.borderRadius,
      cursor: style.cursor,
      fontStyle: style.fontStyle,
      fontWeight: style.fontWeight,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });

const nonColourCue = (cue: Cue): string =>
  JSON.stringify({
    borderStyle: cue.borderStyle,
    borderWidth: cue.borderWidth,
    borderRadius: cue.borderRadius,
    cursor: cue.cursor,
    fontStyle: cue.fontStyle,
    fontWeight: cue.fontWeight,
    outlineStyle: cue.outlineStyle,
    outlineWidth: cue.outlineWidth,
  });

async function axeIsClean(page: Page, label: string): Promise<void> {
  await injectAxe(page);
  let violations: Awaited<ReturnType<typeof getViolations>> = [];
  await expect
    .poll(
      async () => {
        try {
          violations = await getViolations(page, "body", {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
          });
          return "ready";
        } catch (error) {
          if (String(error).includes("Axe is already running")) return "busy";
          throw error;
        }
      },
      { timeout: 20_000 },
    )
    .toBe("ready");
  expect(violations, `${label} must have zero WCAG 2.1 AA violations`).toEqual(
    [],
  );
}

const focusDocumentBody = (page: Page): Promise<void> =>
  page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
    document.body.removeAttribute("tabindex");
  });

function classSelectorInventory(source: string): string[] {
  const classes = new Set<string>();
  const root = postcss.parse(source, { from: SEGMENTED_CHOICE_CSS });
  root.walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walkClasses((className) => classes.add(className.value));
    }).processSync(rule.selector);
  });
  return [...classes].sort();
}

function filesBelow(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

test.describe("sk-segmented-choice source and distribution contract", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "browser-independent contracts run once",
  );

  test("the component remains styles-only and absent from element, wrapper, behavior, and mutation surfaces", () => {
    for (const path of [
      "expected-parts.json",
      "expected-docs.json",
      "behaviours.json",
      "mutations.json",
      "packages/elements/custom-elements.json",
      ...filesBelow("packages/react/src"),
    ]) {
      expect(readFileSync(path, "utf8"), path).not.toMatch(
        /(?:sk-segmented-choice|SkSegmentedChoice)/,
      );
    }
  });

  test("no segmented-choice custom-element source directory exists", () => {
    expect(existsSync("packages/elements/src/segmented-choice")).toBe(false);
  });

  test("the authored stylesheet and generated barrel expose exactly the public class family", () => {
    expect(existsSync(SEGMENTED_CHOICE_CSS)).toBe(true);
    expect(existsSync(SEGMENTED_CHOICE_BARREL)).toBe(true);
    expect(
      classSelectorInventory(readFileSync(SEGMENTED_CHOICE_CSS, "utf8")),
    ).toEqual(["sk-segmented-choice", "sk-segmented-choice__item"]);
  });

  test("consumer documentation includes the segmented-choice ownership contract", () => {
    expect(readFileSync(COMPONENT_USAGE_DOC, "utf8")).toMatch(
      /^## Segmented choice$/m,
    );
  });

  test("the Narrow story declares an exact 1024px viewport rather than a named preset", () => {
    const source = readFileSync(SEGMENTED_CHOICE_STORIES, "utf8");
    expect(source).toContain('defaultViewport: "segmentedChoice1024"');
    expect(source).toContain('width: "1024px"');
    expect(source).not.toContain('defaultViewport: "desktop"');
  });
});

test.describe("sk-segmented-choice live native semantics", () => {
  for (const id of storyIds) {
    test(`${id} loads named native buttons in source, visual, and tab order and is axe-clean`, async ({
      page,
    }) => {
      if (id === "narrow")
        await page.setViewportSize({ width: 1024, height: 768 });
      const loaded = await openStory(page, id);
      expect(loaded.consoleErrors).toEqual([]);
      expect(loaded.pageErrors).toEqual([]);
      await expect(loaded.group).toHaveAccessibleName(/\S/);

      const buttons = loaded.group.locator(
        ":scope > .sk-segmented-choice__item",
      );
      await expect(buttons).toHaveCount(pressedByStory[id].length);
      const sourceOrder = await buttons.allTextContents();
      const visualOrder = await buttons.evaluateAll((nodes) =>
        [...nodes]
          .map((node) => ({
            text: node.textContent?.trim() ?? "",
            x: node.getBoundingClientRect().x,
            y: node.getBoundingClientRect().y,
          }))
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .map(({ text }) => text),
      );
      expect(visualOrder).toEqual(sourceOrder);

      const enabledButtons: Locator[] = [];
      for (let index = 0; index < (await buttons.count()); index += 1) {
        const button = buttons.nth(index);
        expect(
          await button.evaluate((node) => node instanceof HTMLButtonElement),
        ).toBe(true);
        await expect(button).toHaveAttribute("type", "button");
        await expect(button).toHaveAccessibleName(/\S/);
        await expect(button).toHaveAttribute(
          "aria-pressed",
          String(pressedByStory[id][index]),
        );
        if (await button.isEnabled()) enabledButtons.push(button);
      }

      await focusDocumentBody(page);
      for (const button of enabledButtons) {
        await page.keyboard.press("Tab");
        await expect(button).toBeFocused();
      }
      await axeIsClean(page, id);

      const overflow = await page.evaluate(() => {
        const scroller = document.scrollingElement ?? document.documentElement;
        return {
          scrollWidth: scroller.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    });
  }

  test("Enter and Space dispatch native activation without changing consumer-supplied pressed state", async ({
    page,
  }) => {
    const { group } = await openStory(page, "default");
    const button = group.locator(".sk-segmented-choice__item").nth(1);
    await button.evaluate((node) => {
      (
        window as Window & { segmentedChoiceActivations?: number }
      ).segmentedChoiceActivations = 0;
      node.addEventListener("click", () => {
        (
          window as Window & { segmentedChoiceActivations: number }
        ).segmentedChoiceActivations += 1;
      });
    });
    await button.focus();
    await button.press("Enter");
    await button.press("Space");
    expect(
      await page.evaluate(
        () =>
          (window as Window & { segmentedChoiceActivations: number })
            .segmentedChoiceActivations,
      ),
    ).toBe(2);
    await expect(button).toHaveAttribute("aria-pressed", "false");
  });

  test("native disabled buttons are excluded from sequential focus and cannot be focused directly", async ({
    page,
  }) => {
    const oneDisabled = await openStory(page, "one-disabled");
    const buttons = oneDisabled.group.locator(".sk-segmented-choice__item");
    await expect(buttons.nth(1)).toBeDisabled();
    await focusDocumentBody(page);
    await page.keyboard.press("Tab");
    await expect(buttons.nth(0)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(buttons.nth(2)).toBeFocused();
    await buttons.nth(1).focus();
    await expect(buttons.nth(1)).not.toBeFocused();

    const allDisabled = await openStory(page, "all-disabled");
    await focusDocumentBody(page);
    await page.keyboard.press("Tab");
    expect(
      await allDisabled.group
        .locator(".sk-segmented-choice__item:focus")
        .count(),
    ).toBe(0);
  });

  test("pressed state differs from an unpressed sibling by a non-colour cue", async ({
    page,
  }) => {
    const { group } = await openStory(page, "default");
    const pressed = await cueOf(group.locator('[aria-pressed="true"]'));
    const unpressed = await cueOf(
      group.locator('[aria-pressed="false"]').first(),
    );
    expect(nonColourCue(pressed)).not.toBe(nonColourCue(unpressed));
  });

  test("hover, active, focus-visible, and disabled states remain non-colour distinct", async ({
    page,
  }) => {
    const { group } = await openStory(page, "one-disabled");
    const item = group.locator(".sk-segmented-choice__item").nth(2);
    const rest = await cueOf(item);

    await item.hover();
    const hover = await cueOf(item);
    expect(nonColourCue(hover)).not.toBe(nonColourCue(rest));

    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    const active = await cueOf(item);
    expect(nonColourCue(active)).not.toBe(nonColourCue(hover));
    expect(nonColourCue(active)).not.toBe(nonColourCue(rest));
    await page.mouse.up();
    await page.mouse.move(0, 0);

    await focusDocumentBody(page);
    await page.keyboard.press("Tab");
    const focused = group.locator(".sk-segmented-choice__item").first();
    await expect(focused).toBeFocused();
    const focus = await cueOf(focused);
    expect(focus.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThan(0);
    const focusGeometry = await focused.evaluate((node) => {
      const itemRect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const extent =
        Number.parseFloat(style.outlineWidth) +
        Number.parseFloat(style.outlineOffset);
      let ancestor = node.parentElement;
      let clippingAncestor: HTMLElement | null = null;
      while (ancestor) {
        const ancestorStyle = getComputedStyle(ancestor);
        if (
          /(?:hidden|clip)/.test(
            `${ancestorStyle.overflow}${ancestorStyle.overflowX}${ancestorStyle.overflowY}`,
          )
        ) {
          clippingAncestor = ancestor;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      return {
        left: itemRect.left - extent,
        right: itemRect.right + extent,
        top: itemRect.top - extent,
        bottom: itemRect.bottom + extent,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: document.documentElement.clientHeight,
        clippingAncestor: clippingAncestor?.className ?? null,
      };
    });
    expect(focusGeometry.clippingAncestor).toBeNull();
    expect(focusGeometry.left).toBeGreaterThanOrEqual(0);
    expect(focusGeometry.top).toBeGreaterThanOrEqual(0);
    expect(focusGeometry.right).toBeLessThanOrEqual(
      focusGeometry.viewportWidth,
    );
    expect(focusGeometry.bottom).toBeLessThanOrEqual(
      focusGeometry.viewportHeight,
    );

    const disabled = await cueOf(group.locator(":disabled"));
    expect(nonColourCue(disabled)).not.toBe(nonColourCue(rest));
  });

  test("forced colors keeps selected, focus-visible, and disabled indicators load-bearing", async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Playwright forced-colors emulation is Chromium-owned",
    );
    const normalStory = await openStory(page, "forced-colors");
    const normalSelected = await cueOf(
      normalStory.group.locator('[aria-pressed="true"]'),
    );
    const normalDisabled = await cueOf(normalStory.group.locator(":disabled"));
    const normalFocusTarget = normalStory.group
      .locator(".sk-segmented-choice__item")
      .nth(2);
    await normalFocusTarget.focus();
    const normalFocus = await cueOf(normalFocusTarget);

    await page.emulateMedia({ forcedColors: "active" });
    const forcedStory = await openStory(page, "forced-colors");
    const forcedSelected = await cueOf(
      forcedStory.group.locator('[aria-pressed="true"]'),
    );
    const forcedUnpressed = await cueOf(
      forcedStory.group.locator(".sk-segmented-choice__item").nth(2),
    );
    const forcedDisabled = await cueOf(forcedStory.group.locator(":disabled"));
    await forcedStory.group
      .locator(".sk-segmented-choice__item")
      .nth(2)
      .focus();
    const forcedFocus = await cueOf(
      forcedStory.group.locator(".sk-segmented-choice__item").nth(2),
    );

    expect(
      Number.parseFloat(forcedSelected.borderBlockEndWidth),
    ).toBeGreaterThan(Number.parseFloat(normalSelected.borderBlockEndWidth));
    expect(forcedSelected.borderStyle).not.toBe(forcedUnpressed.borderStyle);
    expect(
      Number.parseFloat(forcedDisabled.borderBlockEndWidth),
    ).toBeGreaterThan(Number.parseFloat(normalDisabled.borderBlockEndWidth));
    expect(forcedDisabled.borderStyle).not.toBe(forcedUnpressed.borderStyle);
    expect(Number.parseFloat(forcedFocus.outlineWidth)).toBeGreaterThan(
      Number.parseFloat(normalFocus.outlineWidth),
    );
    expect(forcedFocus.outlineStyle).not.toBe("none");
    expect(forcedFocus.outlineColor).not.toBe(forcedFocus.backgroundColor);
  });

  test("the 1024px narrow story meets 44px targets without inflating default density", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    const narrow = await openStory(page, "narrow");
    const narrowHeights = await narrow.group
      .locator(".sk-segmented-choice__item")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
    expect(narrowHeights.every((height) => height >= 44)).toBe(true);

    await page.setViewportSize({ width: 1280, height: 720 });
    const dense = await openStory(page, "default");
    const denseHeights = await dense.group
      .locator(".sk-segmented-choice__item")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
    expect(denseHeights.every((height) => height < 44)).toBe(true);
  });
});
