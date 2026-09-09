import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

const COMPONENT_DIR = "packages/styles/src/checkbox-choice-group";
const CHOICE_GROUP_CSS = `${COMPONENT_DIR}/sk-checkbox-choice-group.css`;
const CHOICE_GROUP_BARREL = `${COMPONENT_DIR}/index.ts`;
const STYLES_PACKAGE = "packages/styles/package.json";
const STYLES_ROOT = "packages/styles/src/index.ts";
const COMPONENT_USAGE_DOC = "docs/design-system/using-components.md";
const EXPECTED_STORIES = "expected-stories.json";
const TOKEN_LITERAL_CHECKER = "scripts/check-component-token-literals.mjs";
const STORY_PREFIX = "form-skcheckboxchoicegroup-html";

const PUBLIC_CLASSES = [
  "sk-checkbox-choice-group",
  "sk-checkbox-choice-group__choice",
  "sk-checkbox-choice-group__control",
  "sk-checkbox-choice-group__label",
  "sk-checkbox-choice-group__legend",
  "sk-checkbox-choice-group__metadata",
  "sk-checkbox-choice-group__options",
] as const;

const STORY_IDS = [
  "form-skcheckboxchoicegroup-html--default",
  "form-skcheckboxchoicegroup-html--k-3-detailed-lane-filters",
  "form-skcheckboxchoicegroup-html--none-selected",
  "form-skcheckboxchoicegroup-html--several-selected",
  "form-skcheckboxchoicegroup-html--zero-counts",
  "form-skcheckboxchoicegroup-html--disabled-choices",
  "form-skcheckboxchoicegroup-html--long-content",
  "form-skcheckboxchoicegroup-html--narrow",
  "form-skcheckboxchoicegroup-html--focus-states",
  "form-skcheckboxchoicegroup-html--forced-colors",
  "form-skcheckboxchoicegroup-html--default-dark",
  "form-skcheckboxchoicegroup-html--light-mode",
] as const;

const STORY_SUFFIXES = STORY_IDS.map((id) =>
  id.slice(`${STORY_PREFIX}--`.length),
);

type StorySuffix = (typeof STORY_SUFFIXES)[number];

type LoadedStory = {
  root: Locator;
  group: Locator;
  consoleErrors: string[];
  pageErrors: string[];
};

type ChoiceCue = {
  backgroundColor: string;
  borderColor: string;
  borderStyle: string;
  borderWidth: string;
  borderBlockEndWidth: string;
  color: string;
  cursor: string;
  fontWeight: string;
  outlineColor: string;
  outlineOffset: string;
  outlineStyle: string;
  outlineWidth: string;
};

function filesBelow(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

async function openStory(page: Page, id: StorySuffix): Promise<LoadedStory> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  await page.goto(`/iframe.html?id=${STORY_PREFIX}--${id}&viewMode=story`);
  const root = page.locator("#storybook-root");
  await expect(root).not.toBeEmpty();
  const group = root.locator("fieldset.sk-checkbox-choice-group").first();
  await group.waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(50);
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  return { root, group, consoleErrors, pageErrors };
}

const cueOf = (choice: Locator): Promise<ChoiceCue> =>
  choice.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderStyle: style.borderStyle,
      borderWidth: style.borderWidth,
      borderBlockEndWidth: style.borderBlockEndWidth,
      color: style.color,
      cursor: style.cursor,
      fontWeight: style.fontWeight,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });

const nonColourCue = (cue: ChoiceCue): string =>
  JSON.stringify({
    borderStyle: cue.borderStyle,
    borderWidth: cue.borderWidth,
    borderBlockEndWidth: cue.borderBlockEndWidth,
    cursor: cue.cursor,
    fontWeight: cue.fontWeight,
    outlineOffset: cue.outlineOffset,
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

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

function classSelectorInventory(source: string): string[] {
  const classes = new Set<string>();
  const root = postcss.parse(source, { from: CHOICE_GROUP_CSS });
  root.walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walkClasses((className) => classes.add(className.value));
    }).processSync(rule.selector);
  });
  return [...classes].sort();
}

test.describe("sk-checkbox-choice-group source and public contract", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "browser-independent contracts run once",
  );

  test("the styles-only family is distributed with exactly seven public selectors", () => {
    expect(existsSync(COMPONENT_DIR), `${COMPONENT_DIR} must exist`).toBe(true);
    expect(existsSync(CHOICE_GROUP_CSS), `${CHOICE_GROUP_CSS} must exist`).toBe(
      true,
    );
    expect(
      existsSync(CHOICE_GROUP_BARREL),
      `${CHOICE_GROUP_BARREL} must be generated`,
    ).toBe(true);

    const css = readFileSync(CHOICE_GROUP_CSS, "utf8");
    const code = stripComments(css);
    expect(classSelectorInventory(css)).toEqual([...PUBLIC_CLASSES].sort());
    expect(code).not.toMatch(/appearance\s*:\s*none/);
    expect(code).not.toMatch(/forced-color-adjust\s*:\s*none/);
    expect(code).not.toMatch(
      /(?:opacity\s*:\s*0|clip(?:-path)?\s*:|position\s*:\s*absolute)/,
    );
    expect(code).not.toContain(".sk-checkbox-choice-group--");
    expect(code).not.toMatch(/(?:\.sk-light|data-theme|:root|:host-context)/);
    expect(code).not.toMatch(
      /\b(?:genesis|planned|claimed|in-progress|for-review|in-review|approved|done|blocked|canceled)\b/i,
    );

    const selftest = execFileSync(
      process.execPath,
      [TOKEN_LITERAL_CHECKER, "--selftest"],
      { encoding: "utf8" },
    );
    expect(selftest).toContain("governed token classes fail red");
    const audit = execFileSync(
      process.execPath,
      [TOKEN_LITERAL_CHECKER, CHOICE_GROUP_CSS],
      { encoding: "utf8" },
    );
    expect(audit).toContain(
      "1 explicit component stylesheet(s) use tokens for all governed values",
    );

    const root = readFileSync(STYLES_ROOT, "utf8");
    expect(root).toMatch(
      /export \* from ['"]\.\/checkbox-choice-group\/index['"];/,
    );
    const packageJson = JSON.parse(readFileSync(STYLES_PACKAGE, "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(packageJson.exports["./checkbox-choice-group/*"]).toBe(
      "./dist/checkbox-choice-group/*",
    );
  });

  test("the public surface contains no element, wrapper, behavior, mutation, or component JavaScript", () => {
    expect(existsSync("packages/elements/src/checkbox-choice-group")).toBe(
      false,
    );
    expect(existsSync("packages/react/src/SkCheckboxChoiceGroup.js")).toBe(
      false,
    );
    expect(existsSync("packages/react/src/SkCheckboxChoiceGroup.d.ts")).toBe(
      false,
    );
    for (const path of [
      "packages/elements/custom-elements.json",
      "packages/elements/vue.d.ts",
      "expected-parts.json",
      "expected-docs.json",
      "behaviours.json",
      "mutations.json",
      ...filesBelow("packages/react/src"),
    ]) {
      expect(readFileSync(path, "utf8"), path).not.toMatch(
        /(?:sk-checkbox-choice-group|SkCheckboxChoiceGroup)/,
      );
    }
    for (const path of filesBelow(COMPONENT_DIR)) {
      expect(path).not.toMatch(/\.(?:c?js|mjs)$/);
      if (path.endsWith(".html")) {
        expect(stripComments(readFileSync(path, "utf8")), path).not.toMatch(
          /<sk-checkbox-choice-group\b/,
        );
      }
    }
  });

  test("five generated exemplars preserve one native fieldset, legend, options container, and labelled checkboxes", async ({
    page,
  }) => {
    const source = readFileSync(CHOICE_GROUP_BARREL, "utf8");
    const fixtures = [
      ...source.matchAll(/^export const (\w+) = (".*");$/gm),
    ].map((match) => ({
      name: match[1],
      html: JSON.parse(match[2]) as string,
    }));
    expect(fixtures.map(({ name }) => name).sort()).toEqual([
      "SkCheckboxChoiceGroupDefaultHTML",
      "SkCheckboxChoiceGroupDisabledHTML",
      "SkCheckboxChoiceGroupLongHTML",
      "SkCheckboxChoiceGroupNoneHTML",
      "SkCheckboxChoiceGroupZeroCountsHTML",
    ]);
    for (const { name, html } of fixtures) {
      const facts = await page.evaluate((markup) => {
        const document = new DOMParser().parseFromString(markup, "text/html");
        const fieldsets = document.querySelectorAll(
          "fieldset.sk-checkbox-choice-group",
        );
        const fieldset = fieldsets[0];
        const options =
          fieldset?.querySelectorAll(
            ":scope > .sk-checkbox-choice-group__options",
          ) ?? [];
        const choices =
          options[0]?.querySelectorAll(
            ":scope > label.sk-checkbox-choice-group__choice",
          ) ?? [];
        return {
          fieldsets: fieldsets.length,
          legends:
            fieldset?.querySelectorAll(
              ":scope > legend.sk-checkbox-choice-group__legend",
            ).length ?? 0,
          options: options.length,
          choices: choices.length,
          controls: [...choices].map(
            (choice) =>
              choice.querySelectorAll(
                ':scope > input.sk-checkbox-choice-group__control[type="checkbox"]',
              ).length,
          ),
          labels: [...choices].map(
            (choice) =>
              choice.querySelectorAll(
                ":scope > .sk-checkbox-choice-group__label",
              ).length,
          ),
        };
      }, html);
      expect(facts.fieldsets, name).toBe(1);
      expect(facts.legends, name).toBe(1);
      expect(facts.options, name).toBe(1);
      expect(facts.choices, name).toBeGreaterThan(0);
      expect(
        facts.controls.every((count) => count === 1),
        name,
      ).toBe(true);
      expect(
        facts.labels.every((count) => count === 1),
        name,
      ).toBe(true);
      expect(html, name).not.toMatch(
        /<sk-checkbox-choice-group\b|role="(?:group|checkbox)"|aria-checked=/,
      );
    }
  });

  test("consumer documentation and the story ratchet pin the complete contract", () => {
    const docs = readFileSync(COMPONENT_USAGE_DOC, "utf8");
    expect(docs).toMatch(/^## Checkbox choice group$/m);
    for (const className of PUBLIC_CLASSES) expect(docs).toContain(className);
    expect(docs).toMatch(/consumers? own[^.]*checked/i);
    expect(docs).toMatch(/filter/i);
    expect(docs).toMatch(/persistence/i);

    const ratchet = JSON.parse(readFileSync(EXPECTED_STORIES, "utf8")) as {
      byElement: Record<string, string[]>;
      total: number;
    };
    expect(ratchet.byElement["sk-checkbox-choice-group"]).toEqual(STORY_IDS);
    expect(ratchet.total).toBe(459);
  });
});

test.describe("sk-checkbox-choice-group live native semantics and presentation", () => {
  for (const id of STORY_SUFFIXES) {
    test(`${id} loads a native named group without errors, overflow, or axe violations`, async ({
      page,
    }) => {
      if (id === "narrow" || id === "long-content")
        await page.setViewportSize({ width: 390, height: 844 });
      const loaded = await openStory(page, id);
      expect(loaded.consoleErrors).toEqual([]);
      expect(loaded.pageErrors).toEqual([]);
      await expect(loaded.group).toHaveAccessibleName(/\S/);
      const choices = loaded.group.locator(
        ":scope > .sk-checkbox-choice-group__options > .sk-checkbox-choice-group__choice",
      );
      expect(await choices.count()).toBeGreaterThan(0);
      for (let index = 0; index < (await choices.count()); index += 1) {
        const choice = choices.nth(index);
        const control = choice.locator(
          ':scope > input.sk-checkbox-choice-group__control[type="checkbox"]',
        );
        await expect(control).toHaveCount(1);
        expect(
          await control.evaluate(
            (node) =>
              node instanceof HTMLInputElement && node.type === "checkbox",
          ),
        ).toBe(true);
        await expect(control).toHaveAccessibleName(/\S/);
        await expect(
          choice.locator(":scope > .sk-checkbox-choice-group__label"),
        ).toHaveCount(1);
        const containment = await choice.evaluate((node) => {
          const choiceRect = node.getBoundingClientRect();
          const descendants = [
            ...node.querySelectorAll<HTMLElement>(
              ".sk-checkbox-choice-group__label, .sk-checkbox-choice-group__metadata",
            ),
          ];
          return descendants.map((descendant) => {
            const rect = descendant.getBoundingClientRect();
            return {
              left: rect.left,
              right: rect.right,
              choiceLeft: choiceRect.left,
              choiceRight: choiceRect.right,
            };
          });
        });
        expect(
          containment.every(({ left, choiceLeft }) => left >= choiceLeft - 0.5),
        ).toBe(true);
        expect(
          containment.every(
            ({ right, choiceRight }) => right <= choiceRight + 0.5,
          ),
        ).toBe(true);
      }
      const overflow = await page.evaluate(() => {
        const scroller = document.scrollingElement ?? document.documentElement;
        return {
          scrollWidth: scroller.scrollWidth,
          clientWidth: scroller.clientWidth,
        };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
      await axeIsClean(page, id);
    });
  }

  test("the K3 fixture exposes ten checkbox names, order, and two selected lanes", async ({
    page,
  }) => {
    const { group } = await openStory(page, "k-3-detailed-lane-filters");
    await expect(group).toHaveAccessibleName("Detailed lanes");
    const controls = group.getByRole("checkbox");
    await expect(controls).toHaveCount(10);
    expect(
      await controls.evaluateAll((nodes) =>
        nodes.map((node) => ({
          label: node.parentElement
            ?.querySelector(".sk-checkbox-choice-group__label")
            ?.textContent?.trim(),
          metadata: node.parentElement
            ?.querySelector(".sk-checkbox-choice-group__metadata")
            ?.textContent?.trim(),
        })),
      ),
    ).toEqual([
      { label: "Genesis", metadata: "0" },
      { label: "Planned", metadata: "2" },
      { label: "Claimed", metadata: "1" },
      { label: "In progress", metadata: "3" },
      { label: "For review", metadata: "2" },
      { label: "In review", metadata: "1" },
      { label: "Approved", metadata: "1" },
      { label: "Done", metadata: "4" },
      { label: "Blocked", metadata: "1" },
      { label: "Canceled", metadata: "0" },
    ]);
    expect(
      await controls.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLInputElement).checked),
      ),
    ).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
    ]);
  });

  test("Chromium accessibility tree exposes one named group and exact checkbox names and states", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Chromium CDP supplies the inspectable platform accessibility tree",
    );
    await openStory(page, "k-3-detailed-lane-filters");
    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable");
    await session.send("Accessibility.enable");
    const { root } = await session.send("DOM.getDocument");
    const { nodeId } = await session.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: "fieldset.sk-checkbox-choice-group",
    });
    const { node: domNode } = await session.send("DOM.describeNode", {
      nodeId,
    });
    const { nodes } = await session.send("Accessibility.getFullAXTree");
    const groupNode = nodes.find(
      (node) =>
        node.backendDOMNodeId === domNode.backendNodeId &&
        node.role?.value === "group" &&
        node.name?.value === "Detailed lanes",
    );
    expect(groupNode).toBeDefined();
    const descendantIds = new Set(groupNode?.childIds ?? []);
    for (const nodeId of descendantIds) {
      const node = nodes.find((candidate) => candidate.nodeId === nodeId);
      for (const childId of node?.childIds ?? []) descendantIds.add(childId);
    }
    const checkboxes = nodes.filter(
      (node) =>
        node.nodeId !== undefined &&
        descendantIds.has(node.nodeId) &&
        node.role?.value === "checkbox",
    );
    expect(checkboxes.map((node) => node.name?.value)).toEqual([
      "Genesis 0",
      "Planned 2",
      "Claimed 1",
      "In progress 3",
      "For review 2",
      "In review 1",
      "Approved 1",
      "Done 4",
      "Blocked 1",
      "Canceled 0",
    ]);
    expect(
      checkboxes.map(
        (node) =>
          node.properties?.find((property) => property.name === "checked")
            ?.value?.value,
      ),
    ).toEqual([
      "false",
      "false",
      "false",
      "false",
      "false",
      "true",
      "false",
      "false",
      "true",
      "false",
    ]);
    expect(
      checkboxes.map((node) =>
        Boolean(
          node.properties?.find((property) => property.name === "disabled")
            ?.value?.value,
        ),
      ),
    ).toEqual(Array.from({ length: 10 }, () => false));
  });

  test("Space, nested-label activation, FormData, reset, and static Apply/Clear remain browser-owned", async ({
    page,
  }) => {
    const { root, group } = await openStory(page, "k-3-detailed-lane-filters");
    const controls = group.getByRole("checkbox");
    const genesis = controls.nth(0);
    await genesis.focus();
    await genesis.press("Space");
    await expect(genesis).toBeChecked();
    const planned = controls.nth(1);
    await planned.locator("..").click();
    await expect(planned).toBeChecked();
    expect(
      await controls.evaluateAll(
        (nodes) =>
          nodes.filter((node) => (node as HTMLInputElement).checked).length,
      ),
    ).toBe(4);

    const form = root.locator("form");
    expect(
      await form.evaluate((node: HTMLFormElement) => [
        ...new FormData(node).entries(),
      ]),
    ).toEqual([
      ["lane", "genesis"],
      ["lane", "planned"],
      ["lane", "in_review"],
      ["lane", "blocked"],
    ]);
    await root.getByRole("button", { name: "Apply" }).click();
    await root.getByRole("button", { name: "Clear" }).click();
    expect(
      await controls.evaluateAll(
        (nodes) =>
          nodes.filter((node) => (node as HTMLInputElement).checked).length,
      ),
    ).toBe(4);
    await form.evaluate((node: HTMLFormElement) => node.reset());
    expect(
      await controls.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLInputElement).checked),
      ),
    ).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
    ]);
  });

  test("disabled controls are excluded from sequential focus, label activation, and FormData", async ({
    page,
  }) => {
    const { group } = await openStory(page, "disabled-choices");
    const controls = group.getByRole("checkbox");
    await expect(controls).toHaveCount(4);
    await expect(controls.nth(1)).toBeDisabled();
    await expect(controls.nth(2)).toBeDisabled();
    const disabledBefore = await controls.nth(1).isChecked();
    await controls.nth(1).locator("..").click({ force: true });
    expect(await controls.nth(1).isChecked()).toBe(disabledBefore);

    await focusDocumentBody(page);
    await page.keyboard.press("Tab");
    await expect(controls.nth(0)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(controls.nth(3)).toBeFocused();
    await controls.nth(1).focus();
    await expect(controls.nth(1)).not.toBeFocused();

    expect(
      await group.evaluate((node) => {
        const form = document.createElement("form");
        node.before(form);
        form.append(node);
        const entries = [...new FormData(form).entries()];
        form.replaceWith(node);
        return entries;
      }),
    ).toEqual([["channel", "email"]]);
  });

  test("checked, hover, active, focus-visible, and disabled choices have non-colour cues", async ({
    page,
  }) => {
    const { group } = await openStory(page, "disabled-choices");
    const choices = group.locator(".sk-checkbox-choice-group__choice");
    const checked = await cueOf(choices.nth(0));
    const rest = await cueOf(choices.nth(3));
    expect(nonColourCue(checked)).not.toBe(nonColourCue(rest));

    const interactive = choices.nth(3);
    await interactive.hover();
    const hover = await cueOf(interactive);
    expect(nonColourCue(hover)).not.toBe(nonColourCue(rest));
    const box = await interactive.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    const active = await cueOf(interactive);
    expect(nonColourCue(active)).not.toBe(nonColourCue(hover));
    await page.mouse.up();
    await page.mouse.move(0, 0);

    const focusTarget = interactive.locator(
      ".sk-checkbox-choice-group__control",
    );
    await focusDocumentBody(page);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(focusTarget).toBeFocused();
    const focusedChoice = await cueOf(interactive);
    expect(nonColourCue(focusedChoice)).not.toBe(nonColourCue(rest));
    const focused = await cueOf(focusTarget);
    expect(focused.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0);

    const disabled = await cueOf(choices.nth(1));
    expect(nonColourCue(disabled)).not.toBe(nonColourCue(rest));
  });

  test("narrow layout uses one grid column and keeps DOM, visual, and tab order stable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { group } = await openStory(page, "narrow");
    const choices = group.locator(".sk-checkbox-choice-group__choice");
    const source = await choices
      .locator(".sk-checkbox-choice-group__label")
      .allTextContents();
    const tops = await choices.evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size).toBe(await choices.count());
    const visual = await choices.evaluateAll((nodes) =>
      [...nodes]
        .sort(
          (a, b) =>
            a.getBoundingClientRect().top - b.getBoundingClientRect().top,
        )
        .map(
          (node) =>
            node.querySelector(".sk-checkbox-choice-group__label")
              ?.textContent ?? "",
        ),
    );
    expect(visual).toEqual(source);
    await focusDocumentBody(page);
    for (const control of await choices
      .locator(".sk-checkbox-choice-group__control")
      .all()) {
      await page.keyboard.press("Tab");
      await expect(control).toBeFocused();
    }
  });

  test("long labels keep a readable phrase-width column at narrow viewports", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { group } = await openStory(page, "long-content");
    const measurements = await group.evaluate((node) => {
      const controlWidth = node
        .querySelector<HTMLElement>(".sk-checkbox-choice-group__control")!
        .getBoundingClientRect().width;
      const labelWidths = [
        ...node.querySelectorAll<HTMLElement>(
          ".sk-checkbox-choice-group__label",
        ),
      ].map((label) => label.getBoundingClientRect().width);
      return { controlWidth, labelWidths };
    });
    expect(
      measurements.labelWidths.every(
        (width) => width >= measurements.controlWidth * 4,
      ),
    ).toBe(true);
  });

  test("long labels use at most two columns at a 200%-zoom-equivalent width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 599, height: 400 });
    const { group } = await openStory(page, "long-content");
    const measurements = await group.evaluate((node) => {
      const controlWidth = node
        .querySelector<HTMLElement>(".sk-checkbox-choice-group__control")!
        .getBoundingClientRect().width;
      const choices = [
        ...node.querySelectorAll<HTMLElement>(
          ".sk-checkbox-choice-group__choice",
        ),
      ];
      return {
        controlWidth,
        columns: new Set(
          choices.map((choice) =>
            Math.round(choice.getBoundingClientRect().left),
          ),
        ).size,
        labelWidths: choices.map(
          (choice) =>
            choice
              .querySelector<HTMLElement>(".sk-checkbox-choice-group__label")!
              .getBoundingClientRect().width,
        ),
      };
    });
    expect(measurements.columns).toBeLessThanOrEqual(2);
    expect(
      measurements.labelWidths.every(
        (width) => width >= measurements.controlWidth * 7,
      ),
    ).toBe(true);
  });

  test("focus outlines stay inside viewport and outside local clipping", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 320 });
    const { group } = await openStory(page, "narrow");
    const controls = group.getByRole("checkbox");
    await focusDocumentBody(page);
    for (let index = 0; index < (await controls.count()); index += 1) {
      const control = controls.nth(index);
      await page.keyboard.press("Tab");
      await expect(control).toBeFocused();
      const geometry = await control.evaluate((node) => {
        const rect = node.getBoundingClientRect();
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
          left: rect.left - extent,
          right: rect.right + extent,
          top: rect.top - extent,
          bottom: rect.bottom + extent,
          clippingAncestor: clippingAncestor?.className ?? null,
          viewportWidth: document.documentElement.clientWidth,
          viewportHeight: window.innerHeight,
        };
      });
      expect(geometry.clippingAncestor).toBeNull();
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.top).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
      expect(
        geometry.bottom,
        `focus ${index}: ${JSON.stringify(geometry)}`,
      ).toBeLessThanOrEqual(geometry.viewportHeight);
    }
  });

  test("LightMode is a real wrapper with token-derived visual differences", async ({
    page,
  }) => {
    const computed = async (id: "default-dark" | "light-mode") => {
      const { group } = await openStory(page, id);
      const choice = group.locator(".sk-checkbox-choice-group__choice").first();
      return choice.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          hasLightAncestor: Boolean(node.closest(".sk-light")),
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          color: style.color,
        };
      });
    };
    const dark = await computed("default-dark");
    const light = await computed("light-mode");
    expect(dark.hasLightAncestor).toBe(false);
    expect(light.hasLightAncestor).toBe(true);
    expect(light.backgroundColor).not.toBe(dark.backgroundColor);
    expect(light.borderColor).not.toBe(dark.borderColor);
    expect(light.color).not.toBe(dark.color);
  });

  test("forced colors retains native glyph plus checked, disabled, and focus cues", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Playwright forced-colors emulation is Chromium-owned",
    );
    await page.emulateMedia({ forcedColors: "active" });
    const { group } = await openStory(page, "forced-colors");
    const choices = group.locator(".sk-checkbox-choice-group__choice");
    const controls = group.getByRole("checkbox");
    expect(
      await controls
        .nth(0)
        .evaluate((node) => getComputedStyle(node).appearance),
    ).not.toBe("none");
    await expect(controls.nth(0)).toBeChecked();
    await expect(controls.nth(1)).toBeDisabled();
    const checked = await cueOf(choices.nth(0));
    const unchecked = await cueOf(choices.nth(3));
    const disabled = await cueOf(choices.nth(1));
    expect(nonColourCue(checked)).not.toBe(nonColourCue(unchecked));
    expect(nonColourCue(disabled)).not.toBe(nonColourCue(unchecked));
    await controls.nth(3).focus();
    const focusedChoice = await cueOf(choices.nth(3));
    expect(nonColourCue(focusedChoice)).not.toBe(nonColourCue(unchecked));
    const focused = await cueOf(controls.nth(3));
    expect(focused.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0);
    expect(focused.outlineColor).not.toBe(focused.backgroundColor);
  });
});
