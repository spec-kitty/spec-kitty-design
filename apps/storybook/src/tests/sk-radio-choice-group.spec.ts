import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

const COMPONENT_DIR = "packages/styles/src/radio-choice-group";
const CHOICE_GROUP_CSS = `${COMPONENT_DIR}/sk-radio-choice-group.css`;
const CHOICE_GROUP_BARREL = `${COMPONENT_DIR}/index.ts`;
const STYLES_PACKAGE = "packages/styles/package.json";
const STYLES_ROOT = "packages/styles/src/index.ts";
const COMPONENT_USAGE_DOC = "docs/design-system/using-components.md";
const EXPECTED_STORIES = "expected-stories.json";
const TOKEN_LITERAL_CHECKER = "scripts/check-component-token-literals.mjs";
const STORY_PREFIX = "form-skradiochoicegroup-html";

const PUBLIC_CLASSES = [
  "sk-radio-choice-group",
  "sk-radio-choice-group__choice",
  "sk-radio-choice-group__control",
  "sk-radio-choice-group__label",
  "sk-radio-choice-group__legend",
  "sk-radio-choice-group__options",
  "sk-radio-choice-group__secondary-value",
] as const;

const STORY_IDS = [
  "form-skradiochoicegroup-html--default",
  "form-skradiochoicegroup-html--two-choice",
  "form-skradiochoicegroup-html--one-option",
  "form-skradiochoicegroup-html--none-selected",
  "form-skradiochoicegroup-html--required-invalid",
  "form-skradiochoicegroup-html--disabled-option",
  "form-skradiochoicegroup-html--disabled-group",
  "form-skradiochoicegroup-html--long-content",
  "form-skradiochoicegroup-html--narrow",
  "form-skradiochoicegroup-html--rtl",
  "form-skradiochoicegroup-html--focus-states",
  "form-skradiochoicegroup-html--forced-colors",
  "form-skradiochoicegroup-html--default-dark",
  "form-skradiochoicegroup-html--light-mode",
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
  const group = root.locator("fieldset.sk-radio-choice-group").first();
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

const legendCueOf = (
  legend: Locator,
): Promise<{
  color: string;
  borderBlockEndColor: string;
  borderBlockEndStyle: string;
  borderBlockEndWidth: string;
  fontWeight: string;
}> =>
  legend.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      color: style.color,
      borderBlockEndColor: style.borderBlockEndColor,
      borderBlockEndStyle: style.borderBlockEndStyle,
      borderBlockEndWidth: style.borderBlockEndWidth,
      fontWeight: style.fontWeight,
    };
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

// Attaches the group to a throwaway <form> for FormData/validation/reset proofs, then restores
// the group to its original position. The maintained stories deliberately do not wrap the group
// in a <form> (a consumer concern, not a library one) — this reproduces the consumer's own form
// ownership for the duration of one assertion, exactly as sk-checkbox-choice-group.spec.ts does.
async function withForm<T>(
  group: Locator,
  fn: (form: Locator) => Promise<T>,
): Promise<T> {
  await group.evaluate((node) => {
    const form = document.createElement("form");
    form.setAttribute("data-radio-choice-group-test-form", "");
    node.before(form);
    form.append(node);
  });
  const form = group.page().locator("form[data-radio-choice-group-test-form]");
  try {
    return await fn(form);
  } finally {
    await group.evaluate((node) => {
      const form = node.closest(
        "form[data-radio-choice-group-test-form]",
      ) as HTMLFormElement | null;
      form?.replaceWith(node);
    });
  }
}

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

test.describe("sk-radio-choice-group source and public contract", () => {
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
    expect(code).not.toContain(".sk-radio-choice-group--");
    expect(code).not.toMatch(/(?:\.sk-light|data-theme|:root|:host-context)/);
    expect(code).not.toMatch(
      /\b(?:gitlab|group_id|full_path)\b/i,
    );
    expect(code).not.toMatch(/transition\s*:|animation\s*:|@keyframes/);

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
      /export \* from ['"]\.\/radio-choice-group\/index['"];/,
    );
    const packageJson = JSON.parse(readFileSync(STYLES_PACKAGE, "utf8")) as {
      exports: Record<string, unknown>;
    };
    expect(packageJson.exports["./radio-choice-group/*"]).toBe(
      "./dist/radio-choice-group/*",
    );
  });

  test("the public surface contains no element, wrapper, behavior, mutation, or component JavaScript", () => {
    expect(existsSync("packages/elements/src/radio-choice-group")).toBe(
      false,
    );
    expect(existsSync("packages/react/src/SkRadioChoiceGroup.js")).toBe(
      false,
    );
    expect(existsSync("packages/react/src/SkRadioChoiceGroup.d.ts")).toBe(
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
        /(?:sk-radio-choice-group|SkRadioChoiceGroup)/,
      );
    }
    for (const path of filesBelow(COMPONENT_DIR)) {
      expect(path).not.toMatch(/\.(?:c?js|mjs)$/);
      if (path.endsWith(".html")) {
        expect(stripComments(readFileSync(path, "utf8")), path).not.toMatch(
          /<sk-radio-choice-group\b/,
        );
      }
    }
    // sk-checkbox-choice-group (#277) must remain untouched and non-aliased.
    const checkboxCss = readFileSync(
      "packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group.css",
      "utf8",
    );
    expect(checkboxCss).not.toMatch(/sk-radio-choice-group/);
  });

  test("eight generated exemplars preserve one native fieldset, legend, options container, and labelled radios sharing one name", async ({
    page,
  }) => {
    const source = readFileSync(CHOICE_GROUP_BARREL, "utf8");
    const fixtures = [
      ...source.matchAll(/^export const (\w+) = (".*");$/gm),
    ].map((match) => ({
      name: match[1],
      html: JSON.parse(match[2]) as string,
    }));
    expect(fixtures.map(({ name }) => name).sort()).toEqual(
      [
        "SkRadioChoiceGroupDefaultHTML",
        "SkRadioChoiceGroupDisabledGroupHTML",
        "SkRadioChoiceGroupDisabledHTML",
        "SkRadioChoiceGroupLongHTML",
        "SkRadioChoiceGroupNoneHTML",
        "SkRadioChoiceGroupOneHTML",
        "SkRadioChoiceGroupRequiredInvalidHTML",
        "SkRadioChoiceGroupTwoHTML",
      ].sort(),
    );
    for (const { name, html } of fixtures) {
      const facts = await page.evaluate((markup) => {
        const document = new DOMParser().parseFromString(markup, "text/html");
        const fieldsets = document.querySelectorAll(
          "fieldset.sk-radio-choice-group",
        );
        const fieldset = fieldsets[0];
        const options =
          fieldset?.querySelectorAll(
            ":scope > .sk-radio-choice-group__options",
          ) ?? [];
        const choices =
          options[0]?.querySelectorAll(
            ":scope > label.sk-radio-choice-group__choice",
          ) ?? [];
        const controls = [...choices].map(
          (choice) =>
            choice.querySelector<HTMLInputElement>(
              ':scope > input.sk-radio-choice-group__control[type="radio"]',
            ),
        );
        return {
          fieldsets: fieldsets.length,
          legends:
            fieldset?.querySelectorAll(
              ":scope > legend.sk-radio-choice-group__legend",
            ).length ?? 0,
          options: options.length,
          choices: choices.length,
          controlCounts: [...choices].map(
            (choice) =>
              choice.querySelectorAll(
                ':scope > input.sk-radio-choice-group__control[type="radio"]',
              ).length,
          ),
          labelCounts: [...choices].map(
            (choice) =>
              choice.querySelectorAll(":scope > .sk-radio-choice-group__label")
                .length,
          ),
          names: [...new Set(controls.map((control) => control?.name))],
        };
      }, html);
      expect(facts.fieldsets, name).toBe(1);
      expect(facts.legends, name).toBe(1);
      expect(facts.options, name).toBe(1);
      expect(facts.choices, name).toBeGreaterThan(0);
      expect(
        facts.controlCounts.every((count) => count === 1),
        name,
      ).toBe(true);
      expect(
        facts.labelCounts.every((count) => count === 1),
        name,
      ).toBe(true);
      expect(facts.names.length, `${name} must share one name`).toBe(1);
      expect(html, name).not.toMatch(
        /<sk-radio-choice-group\b|role="(?:group|radio)"|aria-checked=/,
      );
    }
  });

  test("consumer documentation and the story ratchet pin the complete contract", () => {
    const docs = readFileSync(COMPONENT_USAGE_DOC, "utf8");
    expect(docs).toMatch(/^## Radio choice group$/m);
    for (const className of PUBLIC_CLASSES) expect(docs).toContain(className);
    expect(docs).toMatch(/consumers? own[^.]*(?:checked|routing)/i);
    expect(docs).toMatch(/routing/i);
    expect(docs).toMatch(/validation.messages?/i);
    expect(docs).toMatch(/44px/);
    expect(docs).toMatch(/right-to-left|rtl/i);

    const ratchet = JSON.parse(readFileSync(EXPECTED_STORIES, "utf8")) as {
      byElement: Record<string, string[]>;
      total: number;
    };
    expect(ratchet.byElement["sk-radio-choice-group"]).toEqual(STORY_IDS);
    // sk-checkbox-choice-group's own ratchet entry must be unchanged.
    expect(ratchet.byElement["sk-checkbox-choice-group"]).toEqual([
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
    ]);
  });
});

test.describe("sk-radio-choice-group live native semantics and presentation", () => {
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
        ":scope > .sk-radio-choice-group__options > .sk-radio-choice-group__choice",
      );
      expect(await choices.count()).toBeGreaterThan(0);
      const names = new Set<string | undefined>();
      for (let index = 0; index < (await choices.count()); index += 1) {
        const choice = choices.nth(index);
        const control = choice.locator(
          ':scope > input.sk-radio-choice-group__control[type="radio"]',
        );
        await expect(control).toHaveCount(1);
        const meta = await control.evaluate((node) => ({
          isRadio:
            node instanceof HTMLInputElement && node.type === "radio",
          name: (node as HTMLInputElement).name,
        }));
        expect(meta.isRadio).toBe(true);
        names.add(meta.name);
        await expect(control).toHaveAccessibleName(/\S/);
        await expect(
          choice.locator(":scope > .sk-radio-choice-group__label"),
        ).toHaveCount(1);
        const containment = await choice.evaluate((node) => {
          const choiceRect = node.getBoundingClientRect();
          const descendants = [
            ...node.querySelectorAll<HTMLElement>(
              ".sk-radio-choice-group__label, .sk-radio-choice-group__secondary-value",
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
        // NFR-009/NI-011: the full visible label is the pointer/touch target and computes at
        // least 44px in the narrow-floor dimension.
        const box = await choice.boundingBox();
        expect(box).not.toBeNull();
        expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(44);
      }
      expect(names.size, "every control in one group shares one name").toBe(
        1,
      );
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

  test("the default fixture exposes five radio names, order, and exactly one selected workspace", async ({
    page,
  }) => {
    const { group } = await openStory(page, "default");
    await expect(group).toHaveAccessibleName("Connect a workspace");
    const controls = group.getByRole("radio");
    await expect(controls).toHaveCount(5);
    expect(
      await controls.evaluateAll((nodes) =>
        nodes.map((node) => ({
          label: node.parentElement
            ?.querySelector(".sk-radio-choice-group__label")
            ?.textContent?.trim(),
          secondary: node.parentElement
            ?.querySelector(".sk-radio-choice-group__secondary-value")
            ?.textContent?.trim(),
        })),
      ),
    ).toEqual([
      { label: "Acme", secondary: "acme" },
      { label: "Acme / Platform", secondary: "acme/platform" },
      { label: "Northwind", secondary: "northwind" },
      { label: "Northwind / Labs", secondary: "northwind/labs" },
      { label: "Orbital", secondary: undefined },
    ]);
    expect(
      await controls.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLInputElement).checked),
      ),
    ).toEqual([true, false, false, false, false]);
  });

  test("Chromium accessibility tree exposes one named group and exact radio names and states", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Chromium CDP supplies the inspectable platform accessibility tree",
    );
    await openStory(page, "default");
    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable");
    await session.send("Accessibility.enable");
    const { root } = await session.send("DOM.getDocument");
    const { nodeId } = await session.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: "fieldset.sk-radio-choice-group",
    });
    const { node: domNode } = await session.send("DOM.describeNode", {
      nodeId,
    });
    const { nodes } = await session.send("Accessibility.getFullAXTree");
    const groupNode = nodes.find(
      (node) =>
        node.backendDOMNodeId === domNode.backendNodeId &&
        node.role?.value === "group" &&
        node.name?.value === "Connect a workspace",
    );
    expect(groupNode).toBeDefined();
    const descendantIds = new Set(groupNode?.childIds ?? []);
    for (const nodeId of descendantIds) {
      const node = nodes.find((candidate) => candidate.nodeId === nodeId);
      for (const childId of node?.childIds ?? []) descendantIds.add(childId);
    }
    const radios = nodes.filter(
      (node) =>
        node.nodeId !== undefined &&
        descendantIds.has(node.nodeId) &&
        node.role?.value === "radio",
    );
    expect(radios.map((node) => node.name?.value)).toEqual([
      "Acme acme",
      "Acme / Platform acme/platform",
      "Northwind northwind",
      "Northwind / Labs northwind/labs",
      "Orbital",
    ]);
    expect(
      radios.map(
        (node) =>
          node.properties?.find((property) => property.name === "checked")
            ?.value?.value,
      ),
    ).toEqual(["true", "false", "false", "false", "false"]);
    expect(
      radios.map((node) =>
        Boolean(
          node.properties?.find((property) => property.name === "disabled")
            ?.value?.value,
        ),
      ),
    ).toEqual(Array.from({ length: 5 }, () => false));
  });

  test("arrow keys roam and select within the group, moving the single checked radio", async ({
    page,
  }) => {
    const { group } = await openStory(page, "default");
    const controls = group.getByRole("radio");
    await controls.nth(0).focus();
    await expect(controls.nth(0)).toBeChecked();
    await page.keyboard.press("ArrowDown");
    await expect(controls.nth(1)).toBeFocused();
    await expect(controls.nth(1)).toBeChecked();
    await expect(controls.nth(0)).not.toBeChecked();
    await page.keyboard.press("ArrowUp");
    await expect(controls.nth(0)).toBeFocused();
    await expect(controls.nth(0)).toBeChecked();
    expect(
      await controls.evaluateAll(
        (nodes) =>
          nodes.filter((node) => (node as HTMLInputElement).checked).length,
      ),
    ).toBe(1);
  });

  test("Space, nested-label activation, FormData (exactly one value), and reset remain browser-owned", async ({
    page,
  }) => {
    const { group } = await openStory(page, "default");
    const controls = group.getByRole("radio");
    // Space selects a focused-but-unchecked radio.
    await controls.nth(2).focus();
    await controls.nth(2).press("Space");
    await expect(controls.nth(2)).toBeChecked();
    // Label activation.
    await controls.nth(3).locator("..").click();
    await expect(controls.nth(3)).toBeChecked();
    expect(
      await controls.evaluateAll(
        (nodes) =>
          nodes.filter((node) => (node as HTMLInputElement).checked).length,
      ),
    ).toBe(1);

    await withForm(group, async (form) => {
      expect(
        await form.evaluate((node: HTMLFormElement) => [
          ...new FormData(node).entries(),
        ]),
      ).toEqual([["workspace", "northwind-labs"]]);
      await form.evaluate((node: HTMLFormElement) => node.reset());
    });
    expect(
      await controls.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLInputElement).checked),
      ),
    ).toEqual([true, false, false, false, false]);
  });

  test("a required group with nothing checked blocks native submission and reports its own validation message", async ({
    page,
  }) => {
    const { group } = await openStory(page, "required-invalid");
    const controls = group.getByRole("radio");
    await expect(controls).toHaveCount(3);
    expect(
      await controls.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLInputElement).checked),
      ),
    ).toEqual([false, false, false]);

    await withForm(group, async (form) => {
      const before = await form.evaluate((node: HTMLFormElement) => {
        let submitted = false;
        node.addEventListener("submit", (event) => {
          submitted = true;
          event.preventDefault();
        });
        const valid = node.checkValidity();
        const message = (
          node.querySelector("input") as HTMLInputElement
        ).validationMessage;
        node.requestSubmit();
        return { valid, message, submitted };
      });
      expect(before.valid).toBe(false);
      expect(before.message).not.toBe("");
      expect(before.submitted).toBe(false);

      await controls.nth(1).check();
      const after = await form.evaluate((node: HTMLFormElement) => {
        let submitted = false;
        node.addEventListener("submit", (event) => {
          submitted = true;
          event.preventDefault();
        });
        const valid = node.checkValidity();
        const message = (
          node.querySelector("input") as HTMLInputElement
        ).validationMessage;
        node.requestSubmit();
        return { valid, message, submitted };
      });
      expect(after.valid).toBe(true);
      expect(after.message).toBe("");
      expect(after.submitted).toBe(true);
    });
  });

  test("disabled controls are excluded from sequential focus, arrow roving, label activation, and FormData", async ({
    page,
  }) => {
    const { group } = await openStory(page, "disabled-option");
    const controls = group.getByRole("radio");
    await expect(controls).toHaveCount(4);
    await expect(controls.nth(0)).toBeDisabled();
    await expect(controls.nth(2)).toBeDisabled();
    await expect(controls.nth(0)).toBeChecked();

    const disabledBefore = await controls.nth(2).isChecked();
    await controls.nth(2).locator("..").click({ force: true });
    expect(await controls.nth(2).isChecked()).toBe(disabledBefore);

    await focusDocumentBody(page);
    await page.keyboard.press("Tab");
    // The checked-but-disabled radio (index 0) is never the tab stop; sequential focus lands on
    // an enabled control only.
    const firstFocused = await page.evaluate(
      () => (document.activeElement as HTMLInputElement | null)?.disabled,
    );
    expect(firstFocused).toBe(false);
    await expect(controls.nth(0)).not.toBeFocused();
    await expect(controls.nth(2)).not.toBeFocused();

    // Arrow roving only ever lands on and checks enabled controls (indices 1 and 3), never the
    // disabled ones at 0 and 2, however many times it is pressed.
    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press("ArrowDown");
      const disabled = await page.evaluate(
        () => (document.activeElement as HTMLInputElement | null)?.disabled,
      );
      expect(disabled).toBe(false);
      await expect(controls.nth(0)).not.toBeFocused();
      await expect(controls.nth(2)).not.toBeFocused();
    }
    expect(
      await controls.evaluateAll(
        (nodes) =>
          nodes.filter((node) => (node as HTMLInputElement).checked).length,
      ),
    ).toBe(1);
    await expect(controls.nth(0)).not.toBeChecked();
    await expect(controls.nth(2)).not.toBeChecked();

    await withForm(group, async (form) => {
      const entries = await form.evaluate((node: HTMLFormElement) => [
        ...new FormData(node).entries(),
      ]);
      expect(entries).toHaveLength(1);
      expect(entries[0][0]).toBe("workspace_disabled");
      expect(["acme-platform", "northwind-labs"]).toContain(entries[0][1]);
    });
  });

  test("checked, hover, active, focus-visible, and disabled choices have non-colour cues", async ({
    page,
  }) => {
    const { group } = await openStory(page, "disabled-option");
    const choices = group.locator(".sk-radio-choice-group__choice");
    const checked = await cueOf(choices.nth(0));
    const rest = await cueOf(choices.nth(1));
    expect(nonColourCue(checked)).not.toBe(nonColourCue(rest));

    const interactive = choices.nth(1);
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

    // `:focus-visible` is a keyboard-triggered heuristic in Chromium — use real Tab navigation,
    // not a programmatic `.focus()`, so the assertion exercises the same cue a keyboard user sees.
    const focusTarget = interactive.locator(".sk-radio-choice-group__control");
    await focusDocumentBody(page);
    await page.keyboard.press("Tab");
    await expect(focusTarget).toBeFocused();
    const focusedChoice = await cueOf(interactive);
    expect(nonColourCue(focusedChoice)).not.toBe(nonColourCue(rest));
    const focused = await cueOf(focusTarget);
    expect(focused.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0);

    const disabled = await cueOf(choices.nth(2));
    expect(nonColourCue(disabled)).not.toBe(nonColourCue(rest));
  });

  test("a required group's invalid legend cue is distinct from an ordinary, non-required legend", async ({
    page,
  }) => {
    const { group: ordinary } = await openStory(page, "none-selected");
    const ordinaryCue = await legendCueOf(
      ordinary.locator(".sk-radio-choice-group__legend"),
    );
    const { group: invalid } = await openStory(page, "required-invalid");
    const invalidCue = await legendCueOf(
      invalid.locator(".sk-radio-choice-group__legend"),
    );
    expect(invalidCue.borderBlockEndStyle).not.toBe(
      ordinaryCue.borderBlockEndStyle,
    );
    expect(Number.parseFloat(invalidCue.borderBlockEndWidth)).toBeGreaterThan(
      Number.parseFloat(ordinaryCue.borderBlockEndWidth),
    );
    // The instant any radio in the group is checked, the group becomes valid and the cue clears.
    const controls = invalid.getByRole("radio");
    await controls.nth(0).check();
    const clearedCue = await legendCueOf(
      invalid.locator(".sk-radio-choice-group__legend"),
    );
    expect(clearedCue.borderBlockEndStyle).toBe(ordinaryCue.borderBlockEndStyle);
  });

  test("narrow layout uses one grid column and keeps DOM, visual, and tab order stable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { group } = await openStory(page, "narrow");
    const choices = group.locator(".sk-radio-choice-group__choice");
    const source = await choices
      .locator(".sk-radio-choice-group__label")
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
            node.querySelector(".sk-radio-choice-group__label")
              ?.textContent ?? "",
        ),
    );
    expect(visual).toEqual(source);
    await focusDocumentBody(page);
    await page.keyboard.press("Tab");
    await expect(
      choices.first().locator(".sk-radio-choice-group__control"),
    ).toBeFocused();
  });

  test("long labels and secondary values keep a readable phrase-width column at narrow viewports", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { group } = await openStory(page, "long-content");
    const measurements = await group.evaluate((node) => {
      const controlWidth = node
        .querySelector<HTMLElement>(".sk-radio-choice-group__control")!
        .getBoundingClientRect().width;
      const labelWidths = [
        ...node.querySelectorAll<HTMLElement>(".sk-radio-choice-group__label"),
      ].map((label) => label.getBoundingClientRect().width);
      return { controlWidth, labelWidths };
    });
    expect(
      measurements.labelWidths.every(
        (width) => width >= measurements.controlWidth * 4,
      ),
    ).toBe(true);
    const overflow = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        scrollWidth: scroller.scrollWidth,
        clientWidth: scroller.clientWidth,
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test("long labels use at most two columns at a 200%-zoom-equivalent width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 599, height: 400 });
    const { group } = await openStory(page, "long-content");
    const measurements = await group.evaluate((node) => {
      const choices = [
        ...node.querySelectorAll<HTMLElement>(".sk-radio-choice-group__choice"),
      ];
      return {
        columns: new Set(
          choices.map((choice) =>
            Math.round(choice.getBoundingClientRect().left),
          ),
        ).size,
      };
    });
    expect(measurements.columns).toBeLessThanOrEqual(2);
  });

  test("focus outlines stay inside viewport and outside local clipping", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 320 });
    const { group } = await openStory(page, "narrow");
    const controls = group.getByRole("radio");
    await focusDocumentBody(page);
    await page.keyboard.press("Tab");
    const geometry = await controls.first().evaluate((node) => {
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
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  });

  test("RTL mirrors layout and text alignment with no horizontal overflow", async ({
    page,
  }) => {
    const { group, root } = await openStory(page, "rtl");
    await expect(root.locator("[dir='rtl']").first()).toBeVisible();
    const choice = group.locator(".sk-radio-choice-group__choice").first();
    const rtl = await choice.evaluate((node) => {
      const control = node.querySelector<HTMLElement>(
        ".sk-radio-choice-group__control",
      )!;
      const label = node.querySelector<HTMLElement>(
        ".sk-radio-choice-group__label",
      )!;
      const secondary = node.querySelector<HTMLElement>(
        ".sk-radio-choice-group__secondary-value",
      );
      return {
        direction: getComputedStyle(node).direction,
        controlLeft: control.getBoundingClientRect().left,
        labelLeft: label.getBoundingClientRect().left,
        secondaryLeft: secondary?.getBoundingClientRect().left ?? null,
      };
    });
    expect(rtl.direction).toBe("rtl");
    // The inline-start grid track (the control) renders at the RIGHT edge under RTL, and the
    // trailing secondary-value track renders at the LEFT — the mirror image of LTR.
    expect(rtl.controlLeft).toBeGreaterThan(rtl.labelLeft);
    if (rtl.secondaryLeft !== null) {
      expect(rtl.labelLeft).toBeGreaterThan(rtl.secondaryLeft);
    }

    const { group: ltrGroup } = await openStory(page, "default");
    const ltrChoice = ltrGroup.locator(".sk-radio-choice-group__choice").first();
    const ltr = await ltrChoice.evaluate((node) => {
      const control = node.querySelector<HTMLElement>(
        ".sk-radio-choice-group__control",
      )!;
      const label = node.querySelector<HTMLElement>(
        ".sk-radio-choice-group__label",
      )!;
      return {
        controlLeft: control.getBoundingClientRect().left,
        labelLeft: label.getBoundingClientRect().left,
      };
    });
    expect(ltr.controlLeft).toBeLessThan(ltr.labelLeft);

    const overflow = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        scrollWidth: scroller.scrollWidth,
        clientWidth: scroller.clientWidth,
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test("prefers-reduced-motion changes nothing observable, because no transition or animation exists", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const { group: normal } = await openStory(page, "default");
    const normalDuration = await normal
      .locator(".sk-radio-choice-group__choice")
      .first()
      .evaluate((node) => getComputedStyle(node).transitionDuration);

    await page.emulateMedia({ reducedMotion: "reduce" });
    const { group: reduced } = await openStory(page, "default");
    const reducedDuration = await reduced
      .locator(".sk-radio-choice-group__choice")
      .first()
      .evaluate((node) => getComputedStyle(node).transitionDuration);

    expect(normalDuration).toBe("0s");
    expect(reducedDuration).toBe("0s");
    expect(reducedDuration).toBe(normalDuration);
  });

  test("LightMode is a real wrapper with token-derived visual differences", async ({
    page,
  }) => {
    const computed = async (id: "default-dark" | "light-mode") => {
      const { group } = await openStory(page, id);
      const choice = group.locator(".sk-radio-choice-group__choice").first();
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

  test("forced colors retains native glyph plus checked, disabled, required-invalid, and focus cues, with accessible state proven to match rendered appearance", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Playwright forced-colors emulation is Chromium-owned",
    );
    await page.emulateMedia({ forcedColors: "active" });
    const { group } = await openStory(page, "forced-colors");
    const choices = group.locator(".sk-radio-choice-group__choice");
    const controls = group.getByRole("radio");
    expect(
      await controls
        .nth(0)
        .evaluate((node) => getComputedStyle(node).appearance),
    ).not.toBe("none");
    await expect(controls.nth(0)).toBeChecked();
    await expect(controls.nth(0)).toBeDisabled();
    await expect(controls.nth(2)).toBeDisabled();
    const checked = await cueOf(choices.nth(0));
    const unchecked = await cueOf(choices.nth(1));
    const disabled = await cueOf(choices.nth(2));
    expect(nonColourCue(checked)).not.toBe(nonColourCue(unchecked));
    expect(nonColourCue(disabled)).not.toBe(nonColourCue(unchecked));
    await controls.nth(1).focus();
    const focusedChoice = await cueOf(choices.nth(1));
    expect(nonColourCue(focusedChoice)).not.toBe(nonColourCue(unchecked));
    const focused = await cueOf(controls.nth(1));
    expect(focused.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0);
    expect(focused.outlineColor).not.toBe(focused.backgroundColor);

    // NI-009/FR-009: the accent-color-customized control's rendered appearance is paired with
    // its real accessible checked/unchecked state via the platform accessibility tree — a
    // screenshot alone cannot prove this, so the DOM ground truth and the CDP AX-tree state are
    // compared directly for every radio in the fixture, under forced-colors emulation.
    const domChecked = await controls.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLInputElement).checked),
    );
    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable");
    await session.send("Accessibility.enable");
    const { root } = await session.send("DOM.getDocument");
    const { nodeId } = await session.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: "fieldset.sk-radio-choice-group",
    });
    const { node: domNode } = await session.send("DOM.describeNode", {
      nodeId,
    });
    const { nodes: axNodes } = await session.send(
      "Accessibility.getFullAXTree",
    );
    const groupNode = axNodes.find(
      (node) =>
        node.backendDOMNodeId === domNode.backendNodeId &&
        node.role?.value === "group",
    );
    const descendantIds = new Set(groupNode?.childIds ?? []);
    for (const id of descendantIds) {
      const node = axNodes.find((candidate) => candidate.nodeId === id);
      for (const childId of node?.childIds ?? []) descendantIds.add(childId);
    }
    const axRadios = axNodes.filter(
      (node) =>
        node.nodeId !== undefined &&
        descendantIds.has(node.nodeId) &&
        node.role?.value === "radio",
    );
    const axChecked = axRadios.map(
      (node) =>
        node.properties?.find((property) => property.name === "checked")
          ?.value?.value === "true",
    );
    expect(axChecked).toEqual(domChecked);
  });
});
