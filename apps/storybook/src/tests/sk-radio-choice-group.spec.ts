import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import { PNG } from "pngjs";

// Counts pixels that differ by more than `tolerance` per channel between two same-size PNG
// screenshots. A plain byte-buffer comparison would also trip on PNG-encoder metadata noise
// unrelated to what actually painted; decoding to raw pixels and tolerating small deltas keeps
// the probe sensitive to a real rendered check-glyph while ignoring anti-aliasing jitter.
function countDifferingPixels(a: Buffer, b: Buffer, tolerance = 24): number {
  const pngA = PNG.sync.read(a);
  const pngB = PNG.sync.read(b);
  if (pngA.width !== pngB.width || pngA.height !== pngB.height) {
    // BLOCKING defect, found and fixed after an independent pass-2 review: every call site below
    // uses `toBeGreaterThan` as a FLOOR. Returning the maximum possible pixel count here (as an
    // earlier revision did, reasoning "the caller's threshold still applies") makes a dimension
    // mismatch an UNCONDITIONAL PASS of that floor — exactly backwards. `element.screenshot()`
    // sizes its crop from a live, possibly sub-pixel bounding box, so two elements with even a
    // 0.5px difference in computed geometry (e.g. a `double` vs `solid` border of the same
    // nominal width can shift the rendered box by half a device pixel) can legitimately produce
    // differently-sized crops — silently. Throwing forces every call site to guarantee
    // dimension-stable crops (e.g. via `page.screenshot({ clip })` with integer-rounded boxes)
    // rather than let a size mismatch masquerade as a passing pixel difference.
    throw new Error(
      `countDifferingPixels: screenshot dimensions differ (${pngA.width}x${pngA.height} vs. ` +
        `${pngB.width}x${pngB.height}) — crop the two elements to matching integer-pixel boxes ` +
        "before comparing; a mismatch must never be read as a passing difference.",
    );
  }
  let differing = 0;
  for (let i = 0; i < pngA.data.length; i += 4) {
    const dr = Math.abs(pngA.data[i] - pngB.data[i]);
    const dg = Math.abs(pngA.data[i + 1] - pngB.data[i + 1]);
    const db = Math.abs(pngA.data[i + 2] - pngB.data[i + 2]);
    const da = Math.abs(pngA.data[i + 3] - pngB.data[i + 3]);
    if (dr > tolerance || dg > tolerance || db > tolerance || da > tolerance) {
      differing += 1;
    }
  }
  return differing;
}

// Same comparison as `countDifferingPixels`, expressed as a fraction of the crop's total pixel
// count rather than a raw count. `page.screenshot({ clip })`'s CSS-pixel clip box is rasterised at
// the page's real `devicePixelRatio` — a DSF-2 engine (e.g. WebKit/Safari emulation) returns ~4x
// as many raw pixels for the SAME logical crop as a DSF-1 one, so a hard-coded pixel-COUNT floor
// tuned on one engine reads roughly 4x slacker on the other. The fraction is DPR-invariant because
// both the differing-pixel count and the total scale together.
function differingPixelFraction(a: Buffer, b: Buffer, tolerance = 24): number {
  const count = countDifferingPixels(a, b, tolerance);
  const { width, height } = PNG.sync.read(a);
  return count / (width * height);
}

// Screenshots two locators to GUARANTEED-matching integer-pixel dimensions. `locator.screenshot()`
// derives its clip from the element's own live (fractional) bounding box; two controls whose
// ANCESTOR choices carry different border widths/styles can report bounding boxes that round to
// different integer pixel sizes (measured: 17x16 vs 17x17 for a `double`-vs-plain-bordered choice
// pair), which made `countDifferingPixels`'s old dimension-mismatch branch a silent, permanent
// pass. Using `page.screenshot({ clip })` with a width/height taken as the MINIMUM of both boxes
// (not each box's own independently-rounded size) makes the two crops dimension-identical by
// construction, not by coincidence.
//
// `inset` (default 3 CSS px) shrinks the clip symmetrically to exclude the corners of the native
// radio's square bounding box, where the CIRCLE does not reach and the ANCESTOR choice's own
// background bleeds through instead. Checked vs. unchecked choices intentionally use different
// backgrounds (`--sk-bg-pill` vs. `--sk-surface-card`), and their measured channel delta (up to
// 17) sits just under `countDifferingPixels`'s default `tolerance` of 24 — coincidentally, not by
// any assertion that keeps it that way. A future token retune could push that delta over the
// tolerance and let corner background alone masquerade as "the glyph differs" even with a broken
// glyph. The inset removes the corners from the crop entirely rather than relying on the
// coincidence.
async function screenshotControlPair(
  page: Page,
  a: Locator,
  b: Locator,
  inset = 3,
): Promise<[Buffer, Buffer]> {
  const [boxA, boxB] = await Promise.all([a.boundingBox(), b.boundingBox()]);
  if (!boxA || !boxB) {
    throw new Error(
      "screenshotControlPair: one of the two controls has no bounding box (not rendered?)",
    );
  }
  const width = Math.floor(Math.min(boxA.width, boxB.width)) - inset * 2;
  const height = Math.floor(Math.min(boxA.height, boxB.height)) - inset * 2;
  if (width <= 0 || height <= 0) {
    throw new Error(
      `screenshotControlPair: inset ${inset} leaves a non-positive crop (${width}x${height})`,
    );
  }
  const [shotA, shotB] = await Promise.all([
    page.screenshot({
      clip: { x: Math.round(boxA.x) + inset, y: Math.round(boxA.y) + inset, width, height },
    }),
    page.screenshot({
      clip: { x: Math.round(boxB.x) + inset, y: Math.round(boxB.y) + inset, width, height },
    }),
  ]);
  return [shotA, shotB];
}

// Reads the pixel at the exact centre of a screenshot buffer, as `{r, g, b, a}`. Used to assert a
// checked radio's fill resolves to the authored `accent-color`, not merely that "something is
// different" — a pixel-count probe alone cannot distinguish a correctly yellow dot from a wrongly
// grey one of the same size (both produce the same non-zero diff against an unchecked control).
function centrePixel(shot: Buffer): { r: number; g: number; b: number; a: number } {
  const png = PNG.sync.read(shot);
  // CI on WebKit (`devices['Desktop Safari']`, deviceScaleFactor 2) measured a dark edge-blend
  // (rgb(49,40,4), not the solid yellow fill) from a single centre pixel here. The single-pixel
  // index itself was already computed from the DECODED PNG's own width/height (device pixels,
  // DPR-invariant by construction) rather than any CSS-pixel value — so the miss was not a
  // CSS-vs-device unit bug. It is a real cross-engine rendering difference: WebKit's native
  // checked-radio fill is not guaranteed to cover the exact same single device pixel as
  // Chromium's, especially after `screenshotControlPair`'s 3px inset shrinks the crop. Averaging
  // a small centred PATCH — sized as a fraction of the PNG's own dimensions, so it scales with
  // DPR exactly like the single-pixel index did — is tolerant of a few pixels of engine-specific
  // fill positioning while still sampling only the interior, never the crop's own edge.
  const patchFraction = 0.4;
  const patchWidth = Math.max(1, Math.round(png.width * patchFraction));
  const patchHeight = Math.max(1, Math.round(png.height * patchFraction));
  const startX = Math.floor((png.width - patchWidth) / 2);
  const startY = Math.floor((png.height - patchHeight) / 2);
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let aSum = 0;
  let count = 0;
  for (let y = startY; y < startY + patchHeight; y += 1) {
    for (let x = startX; x < startX + patchWidth; x += 1) {
      const i = (png.width * y + x) << 2;
      rSum += png.data[i];
      gSum += png.data[i + 1];
      bSum += png.data[i + 2];
      aSum += png.data[i + 3];
      count += 1;
    }
  }
  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
    a: Math.round(aSum / count),
  };
}

// Resolves a `--sk-*` token's real computed colour from the live page, as `{r, g, b}`, so an
// assertion can compare against the token's ACTUAL rendered value instead of a hard-coded guess
// at how the browser translates the hex source into RGB.
async function resolveTokenColor(
  page: Page,
  token: string,
): Promise<{ r: number; g: number; b: number }> {
  const rgb = await page.evaluate((cssVar) => {
    const probe = document.createElement("div");
    probe.style.color = `var(${cssVar})`;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, token);
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  if (!match) throw new Error(`resolveTokenColor: could not parse "${rgb}" for ${token}`);
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

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

test("the chromium project the describe below depends on still exists", () => {
  expect(test.info().config.projects.map((project) => project.name),
    "the browser-independent-once skip below is keyed on this project name").toContain("chromium");
});

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
      // `facts.names.length === 1` alone would pass vacuously if every control's `name` were the
      // empty string — a radio with no `name` at all belongs to no native group. Assert the one
      // shared value is genuinely non-empty as well as unique.
      expect(facts.names.length, `${name} must share one name`).toBe(1);
      expect(
        facts.names[0],
        `${name}'s shared name must be non-empty`,
      ).not.toBe("");
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
        // Count floor: `.every()` over an empty array is vacuously true, and the label is
        // already proven present above, so this must never be empty in practice — but assert it
        // explicitly rather than trust that indirectly.
        expect(containment.length).toBeGreaterThan(0);
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
      // A vacuous pass: if every control's `name` were the empty string, `names.size` would
      // still be 1 while none of them belonged to a real native group. Assert the one shared
      // value is genuinely non-empty.
      expect(names.has(""), "the shared name must be non-empty").toBe(false);
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
    expect(test.info().config.projects.map((project) => project.name), "the chromium skip below is keyed on this project name").toContain("chromium");
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
    browserName,
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
    if (browserName === "webkit") {
      // WebKit/Safari's DEFAULT `-webkit-full-page-editable`/sequential-focus preference is "Tab
      // highlights only text fields and lists" — radio buttons are excluded from Tab navigation
      // by design, not by any defect here. This repo already carries the equivalent precedent for
      // Firefox: `playwright.config.ts` pins `firefoxUserPrefs: { 'accessibility.tabfocus': 7 }`
      // specifically so "native Tab-order assertions exercise the repository's documented keyboard
      // contract instead of a host preference." Playwright exposes no equivalent WebKit
      // preference, and adding one to the shared `playwright.config.ts` is out of scope for this
      // WP (it is used by every mission). CI confirmed this empirically: a bounded Tab-press loop
      // genuinely never enters the group on WebKit — a real host-preference limitation, not a
      // library one. Prove the same substantive contract (disabled controls are excluded from
      // focus, roving, and the checked set) through a path the platform does support: focus the
      // first enabled control directly, then continue with the identical arrow-roving and
      // disabled-exclusion assertions every other engine runs.
      await controls.nth(1).focus();
    } else {
      // The checked-but-disabled radio (index 0) is never the tab stop; sequential focus lands on
      // an enabled control only. Do not assume the FIRST Tab from document.body lands inside the
      // group — that is a browser-specific tab-order assumption Chromium/Firefox happen to
      // satisfy. Press Tab in a bounded loop until focus genuinely enters the group, using an
      // auto-retrying locator assertion rather than a raw, snapshot-only `activeElement` read —
      // `?.disabled` on a non-input `activeElement` silently yields `undefined`, which must never
      // be mistaken for a pass (or a fail).
      let enteredGroup = false;
      for (let attempt = 0; attempt < 10 && !enteredGroup; attempt += 1) {
        await page.keyboard.press("Tab");
        enteredGroup = await group.evaluate(
          (node) => node.contains(document.activeElement),
        );
      }
      expect(
        enteredGroup,
        "Tab never moved focus inside the radio group within 10 presses",
      ).toBe(true);
    }
    // The native roving-tabindex tab-stop is the first ENABLED radio (index 1); assert that
    // specific locator, not merely "some enabled control", so a real regression cannot hide
    // behind an unspecific pass.
    await expect(controls.nth(1)).toBeFocused();
    await expect(controls.nth(0)).not.toBeFocused();
    await expect(controls.nth(2)).not.toBeFocused();

    // A DIRECT proof of "excluded from focus" that does not depend on Tab semantics at all (and
    // so runs identically on every engine, WebKit included): calling `.focus()` on a disabled
    // native control is a no-op per the HTML spec — focus must remain exactly where it was.
    await controls.nth(2).focus();
    await expect(controls.nth(1)).toBeFocused();
    await expect(controls.nth(2)).not.toBeFocused();

    // Arrow roving alternates between the two ENABLED controls (indices 1 and 3), skipping the
    // disabled ones at 0 and 2, however many times it is pressed. An "index 1 OR index 3" check
    // alone proves only exclusion, not movement: a regression that froze focus on index 1 for all
    // four presses would satisfy an OR-check every time and the downstream checked-state
    // assertions would still pass. Reads element IDENTITY against the specific enabled locators,
    // rather than `activeElement?.disabled` — a non-input `activeElement` can then never be
    // mistaken for `undefined !== false`. (`.evaluate()` is a one-shot snapshot, not
    // auto-retrying; `.or()` was considered and rejected — with both radios present in the DOM it
    // trips Playwright strict mode.)
    //
    // CI found that the exact alternating sequence [3,1,3,1] — believed to be a cross-engine
    // invariant — is actually CHROMIUM'S WRAPPING behaviour: Chromium/Firefox wrap past the last
    // enabled control back to the first (1 -> 3 -> 1 -> 3), but WebKit's native radio-group arrow
    // navigation does NOT wrap (1 -> 3 -> 3 -> 3, staying at the end). Wrapping is UA-owned, not
    // something #336's CSS/markup implements or controls, so asserting it as a cross-engine
    // invariant over-specified the actual contract claim ("never lands on a disabled control,
    // however many times pressed"). The engine-independent invariants below are asserted on every
    // engine; the wrap-specific exact sequence is asserted only where the platform performs it.
    const actualSequence: number[] = [];
    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press("ArrowDown");
      const [isNth1, isNth3] = await Promise.all([
        controls.nth(1).evaluate((node) => node === document.activeElement),
        controls.nth(3).evaluate((node) => node === document.activeElement),
      ]);
      actualSequence.push(isNth1 ? 1 : isNth3 ? 3 : -1);
      await expect(controls.nth(0)).not.toBeFocused();
      await expect(controls.nth(2)).not.toBeFocused();
    }
    // Invariant (a): the first ArrowDown actually MOVES focus (1 -> 3 in both engines) — guards
    // the frozen-focus regression a bare "1 or 3" check would miss.
    expect(
      actualSequence[0],
      `first ArrowDown landed on ${actualSequence[0]}, expected a move to 3`,
    ).toBe(3);
    // Invariant (b): every one of the four landings is a genuinely enabled control (1 or 3),
    // never -1 (neither) and never the disabled indices 0 or 2.
    expect(
      actualSequence.every((landing) => landing === 1 || landing === 3),
      `ArrowDown sequence was [${actualSequence.join(", ")}] — every landing must be an ` +
        "enabled control (1 or 3)",
    ).toBe(true);
    if (browserName !== "webkit") {
      // The wrap itself (Chromium/Firefox only — see the comment above).
      const expectedSequence = [3, 1, 3, 1];
      expect(
        actualSequence,
        `ArrowDown roving sequence was [${actualSequence.join(", ")}], expected ` +
          `[${expectedSequence.join(", ")}]`,
      ).toEqual(expectedSequence);
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

  test("checked, hover, active, focus-visible, and disabled choices have non-colour cues, pairwise distinct", async ({
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

    // `checked` above (`disabled-option`'s choice 0) is checked AND disabled — the `:disabled`
    // rule's `border-style: dotted` (specified later in the sheet) overrides `:checked`'s
    // `double`, so the pairwise set never actually observed an ENABLED checked choice's own cue.
    // Verified: removing `border-style: double` from the `:checked` rule entirely left this set
    // at 6/6, still green, because nothing here exercised it. Sample a genuinely enabled checked
    // choice from the `default` story and fold it in as a seventh state.
    const { group: enabledGroup } = await openStory(page, "default");
    const checkedEnabled = await cueOf(
      enabledGroup.locator(".sk-radio-choice-group__choice").nth(0),
    );

    // Each state above was only ever compared against `rest`, which proves six one-sided
    // deltas, not that the states are mutually distinguishable from EACH OTHER — e.g. hover
    // (dashed/1px/medium) and focus-visible (dashed/2px/medium) each differ from `rest` in one
    // property but could still collide with one another undetected. "Distinct without colour
    // alone" is a pairwise property: collect every named state's non-colour cue and require them
    // all to be mutually unique.
    const cues = [rest, checked, hover, active, focusedChoice, disabled, checkedEnabled].map(
      nonColourCue,
    );
    const labels = [
      "rest",
      "checked+disabled",
      "hover",
      "active",
      "focus-visible",
      "disabled",
      "checked+enabled",
    ];
    expect(
      new Set(cues).size,
      `expected ${labels.length} pairwise-distinct non-colour cues, got ${new Set(cues).size}: ` +
        labels.map((label, index) => `${label}=${cues[index]}`).join(" | "),
    ).toBe(cues.length);
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
    // NFR-001: the required-invalid legend colour resolves through the authoritative
    // `--sk-color-red` token, not an arbitrary or hard-coded value. Resolve the token's real
    // computed colour from the live page rather than hard-coding an RGB triplet, so the
    // assertion tracks the token's actual value instead of a guess at how the browser renders it.
    const expectedRedColor = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "var(--sk-color-red)";
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    });
    expect(invalidCue.color).toBe(expectedRedColor);
    expect(invalidCue.borderBlockEndColor).toBe(expectedRedColor);
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
    // Count floor: `.every()` over an empty array is vacuously true.
    expect(measurements.labelWidths.length).toBeGreaterThan(0);
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
        choiceCount: choices.length,
        columns: new Set(
          choices.map((choice) =>
            Math.round(choice.getBoundingClientRect().left),
          ),
        ).size,
      };
    });
    // Count floor: a `columns` of 0 from an empty choice set would also satisfy
    // `<= 2` vacuously.
    expect(measurements.choiceCount).toBeGreaterThan(0);
    expect(measurements.columns).toBeLessThanOrEqual(2);
    // NFR-004: containment at the 200%-zoom-equivalent width, not merely a column-count proxy —
    // this is the assertion the zoom evidence README cites as proving "no overflow" at this
    // width; it must actually run for that claim to be true.
    const overflow = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        scrollWidth: scroller.scrollWidth,
        clientWidth: scroller.clientWidth,
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
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

  test("forced colors retains native glyph plus checked, disabled, and focus cues, with accessible state proven to match rendered appearance", async ({
    page,
    browserName,
  }) => {
    expect(test.info().config.projects.map((project) => project.name), "the chromium skip below is keyed on this project name").toContain("chromium");
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

    // SEMANTIC half only: this walk demonstrates that the platform accessibility tree's
    // `checked` property tracks the real DOM `.checked` flag under forced-colors emulation. It
    // is NOT evidence for the VISUAL half of NI-009/FR-009 (that forced colors actually renders a
    // perceivable difference between a checked and an unchecked control) — for a native radio,
    // the AX `checked` property is computed from the same DOM flag regardless of any CSS
    // (`accent-color` included), so this comparison is true by construction and cannot go red
    // from a suppressed/flattened glyph. The paired rendered-pixel probe immediately below this
    // test (`forced colors: a checked control's rendered pixels visibly differ from an unchecked
    // one`) is the actual visual-half evidence; a screenshot there, not here, is what proves it.
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
    // Length floor: an empty `axRadios` against an empty `domChecked` would make the comparison
    // below pass vacuously. The `forced-colors` story's fixture (disabled.html) always has
    // exactly four radios — assert that count explicitly before trusting the array comparison.
    expect(axRadios.length).toBe(4);
    expect(domChecked.length).toBe(4);
    const axChecked = axRadios.map(
      (node) =>
        node.properties?.find((property) => property.name === "checked")
          ?.value?.value === "true",
    );
    expect(axChecked).toEqual(domChecked);
  });

  test("forced colors: a required group's invalid legend cue remains distinct from an ordinary legend", async ({
    page,
    browserName,
  }) => {
    expect(test.info().config.projects.map((project) => project.name), "the chromium skip below is keyed on this project name").toContain("chromium");
    test.skip(
      browserName !== "chromium",
      "Playwright forced-colors emulation is Chromium-owned",
    );
    // The `forced-colors` story renders `disabled.html`, which has no `required` control at all,
    // so it cannot exercise the required-invalid legend rule in the forced-colors block
    // (`sk-radio-choice-group.css`'s `@media (forced-colors: active)` block, the
    // `:required:invalid` legend rule). Open the `required-invalid` and `none-selected` stories
    // directly instead and emulate forced colors on them.
    //
    // `forced-colors` forces only COLOUR properties — never `border-style`/`border-width` — so
    // the LIGHT-PATH rule (`solid`, `--sk-border-width-2`) still applies verbatim under emulation
    // and a `style !== style` / `width > 0` comparison against the ORDINARY (non-required) legend
    // passes whether or not the forced-colors block exists at all. Capture the light-path invalid
    // width first, and compare the forced-colors width against THAT (4px vs. 2px, not 4px vs.
    // 0px). For colour: an independent re-verification found that asserting only "NOT the
    // un-emulated `--sk-color-red`" is satisfied by ANY system-colour override — swapping the
    // CSS's `LinkText` for `CanvasText` left that assertion green, since forced colors replaces
    // the author colour with something else either way. Assert EQUALITY against the resolved
    // `LinkText` value specifically, which is what the CSS actually declares.
    const { group: lightInvalid } = await openStory(page, "required-invalid");
    const lightInvalidCue = await legendCueOf(
      lightInvalid.locator(".sk-radio-choice-group__legend"),
    );
    const expectedLightRedColor = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "var(--sk-color-red)";
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    });
    expect(lightInvalidCue.borderBlockEndColor).toBe(expectedLightRedColor);

    await page.emulateMedia({ forcedColors: "active" });
    const expectedLinkText = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "LinkText";
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    });
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
    // The equality proof: it must be exactly the CSS's declared `LinkText`, not merely "some
    // colour that isn't the light-path red".
    expect(invalidCue.borderBlockEndColor).toBe(expectedLinkText);
    // Compared against the LIGHT-PATH invalid width (2px), not the ordinary legend's 0px, so
    // deleting the forced-colors rule (which would leave the light-path 2px in place) fails this
    // specifically, instead of the light-path rule alone satisfying a "> 0" floor.
    expect(
      Number.parseFloat(invalidCue.borderBlockEndWidth),
      `forced-colors width ${invalidCue.borderBlockEndWidth} must exceed the light-path ` +
        `invalid width ${lightInvalidCue.borderBlockEndWidth}`,
    ).toBeGreaterThan(Number.parseFloat(lightInvalidCue.borderBlockEndWidth));
  });

  test("forced colors: a checked control's rendered pixels visibly differ from an unchecked one (visual half of the accent-color proof)", async ({
    page,
    browserName,
  }) => {
    expect(test.info().config.projects.map((project) => project.name), "the chromium skip below is keyed on this project name").toContain("chromium");
    test.skip(
      browserName !== "chromium",
      "Playwright forced-colors emulation is Chromium-owned",
    );
    // VISUAL half of NI-009/FR-009: the AX/DOM comparison in the previous test proves the
    // accessible state tracks reality; it cannot prove forced colors actually PAINTS a
    // perceivable difference for the customized `accent-color`. Only a rendered-pixel
    // comparison can prove that, so this crops just the native control (not the whole choice,
    // which would also pick up border/background cues already covered elsewhere).
    //
    // The `forced-colors` story renders the `disabled.html` fixture: index 0 is checked+disabled,
    // index 1 is unchecked+enabled, index 2 is unchecked+disabled, index 3 is unchecked+enabled.
    // An earlier version of this test compared index 0 against index 1 — that mixes the
    // checked/unchecked delta with a DIFFERENT disabled/enabled treatment (measured: 68 of the
    // 154 differing pixels came from disabled-vs-enabled alone, with zero contribution from
    // checkedness), so it could pass on a mutant that suppresses the check glyph but still draws
    // some other structural difference between the two controls it happened to compare. Comparing
    // index 0 against index 2 instead holds disabled/enabled constant (both disabled) so
    // checkedness is the only remaining variable — the `disabled` flags are asserted equal
    // immediately below so a later fixture edit cannot silently reintroduce the confound.
    //
    // Screenshots are taken via `screenshotControlPair`, not `locator.screenshot()` directly:
    // index 0's ancestor choice carries a `double`/2px border (the `:checked` rule) while index
    // 2's carries a `dotted`/1px one (the `:disabled` rule), and that structural difference was
    // found to shift the two controls' own live bounding boxes by a fraction of a device pixel —
    // enough that independently-rounded crops came out 17x16 vs 17x17. `countDifferingPixels` now
    // throws on any such mismatch rather than silently returning a passing value, so a dimension-
    // stable crop is required, not optional.
    await page.emulateMedia({ forcedColors: "active" });
    const { group } = await openStory(page, "forced-colors");
    const controls = group.getByRole("radio");
    await expect(controls).toHaveCount(4);
    await expect(controls.nth(0)).toBeChecked();
    await expect(controls.nth(2)).not.toBeChecked();
    const [checkedDisabled, uncheckedDisabled] = await Promise.all([
      controls.nth(0).isDisabled(),
      controls.nth(2).isDisabled(),
    ]);
    expect(
      checkedDisabled,
      "the compared pair must hold disabled/enabled constant so checkedness is the only variable",
    ).toBe(uncheckedDisabled);
    const [checkedShot, uncheckedShot] = await screenshotControlPair(
      page,
      controls.nth(0),
      controls.nth(2),
    );
    const diffPixels = countDifferingPixels(checkedShot, uncheckedShot);
    // With dimension-stable, corner-inset crops the real signal measures 86px (noise floor 0,
    // `appearance:none`+ring mutant 0). 40 sits comfortably above the noise floor and below the
    // real signal, with margin on both sides — not the 100 an earlier revision used, which
    // exceeded the real signal and would have failed a correct implementation.
    expect(
      diffPixels,
      `checked+disabled vs. unchecked+disabled control differed by only ${diffPixels} pixel(s) ` +
        "under forced colors — the check indicator is not visibly rendered",
    ).toBeGreaterThan(40);
  });

  test("normal colours: a checked control's rendered pixels visibly differ from an unchecked one (the 11 committed visual baselines cannot see this)", async ({
    page,
  }) => {
    // Expressed as a FRACTION of the crop's total pixels, not a raw count — `page.screenshot`'s
    // clip is rasterised at the real devicePixelRatio, so a fixed pixel-count floor tuned on one
    // engine reads ~4x slacker on a DSF-2 one (e.g. WebKit/Safari emulation). The fraction is
    // DPR-invariant, so this probe runs on EVERY engine (unlike the colour assertion in the
    // sibling test below, which does not) — geometry-based, it is confirmed passing in CI on
    // WebKit too.
    // MAJOR finding: at visual.spec.ts's `maxDiffPixelRatio: 0.02` over a ~386x336 baseline crop
    // (budget ~2,594px), every one of the five controls in a story totals only ~1,280px — so
    // fully hiding the check glyph (`visibility: hidden` on every control) still measured under
    // that ratio and would report GREEN. This is #88's "a blank render and a full render compared
    // EQUAL" defect re-entered at smaller scale (see visual.spec.ts:10-20's own account of #88).
    // A targeted control-only crop, independent of the story frame's total pixel budget, closes
    // that specific hole — mirroring the forced-colors probe above but without `emulateMedia`.
    //
    // MEASURED LIMIT OF THIS PROBE ALONE, found on independent re-verification: the checked
    // radio's disc-vs-ring geometry produces a real, non-zero pixel delta against an unchecked
    // control INDEPENDENT of the accent colour actually used — `accent-color: transparent`
    // measured 144px, and a token swap toward the card background measured 154px, both
    // comfortably clearing a `>80`-pixel floor while the customized `accent-color` itself was
    // invisible. So this assertion alone guards only "the control paints nothing" (a real but
    // narrower claim); it does NOT guard "the customized `accent-color` renders". The sibling test
    // below is what closes that, on the engines where a colour sample is valid.
    const { group } = await openStory(page, "default");
    const controls = group.getByRole("radio");
    await expect(controls).toHaveCount(5);
    await expect(controls.nth(0)).toBeChecked();
    await expect(controls.nth(1)).not.toBeChecked();
    const [checkedDisabled, uncheckedDisabled] = await Promise.all([
      controls.nth(0).isDisabled(),
      controls.nth(1).isDisabled(),
    ]);
    expect(
      checkedDisabled,
      "the compared pair must hold disabled/enabled constant so checkedness is the only variable",
    ).toBe(uncheckedDisabled);
    const [checkedShot, uncheckedShot] = await screenshotControlPair(
      page,
      controls.nth(0),
      controls.nth(1),
    );
    const diffFraction = differingPixelFraction(checkedShot, uncheckedShot);
    expect(
      diffFraction,
      `checked vs. unchecked control differed by only ${(diffFraction * 100).toFixed(1)}% of ` +
        "pixels in normal colours — the check indicator is not visibly rendered",
    ).toBeGreaterThan(0.2);
  });

  test("normal colours: the checked control's fill resolves to --sk-color-yellow", async ({
    page,
    browserName,
  }) => {
    // CHROMIUM/FIREFOX ONLY. CI measured `rgb(49, 40, 4)` on WebKit — a dark olive blend,
    // unchanged whether the centred sample patch was a single pixel or an averaged 40% of the
    // crop's dimensions. That rules out a sampling-position bug: WebKit renders the native
    // checked-radio fill at a materially smaller size and/or different position within the
    // control's box than Chromium/Firefox do, so even a broad centred patch there averages mostly
    // background rather than the accent fill. This is a real rendering difference, not a defect —
    // scoping the assertion (rather than widening the colour tolerance to paper over it) keeps it
    // meaningful where it runs; widening the tolerance would also let a genuinely wrong accent
    // colour through on the engines where the sample IS valid. The sibling pixel-DIFFERENCE test
    // above stays cross-engine: it is geometry-based, not colour-sampling-based, and already
    // passes on WebKit in CI — this is a distinct test, not a shared `test.skip` mid-body, so that
    // sibling's WebKit result reports as a genuine pass, not folded into this one's skip.
    test.skip(
      browserName === "webkit",
      "WebKit renders the checked fill at a different size/position within the control box, so " +
        "a centred-patch colour sample is not a valid accent-color probe there (see comment)",
    );
    // The token-colour half: the same pattern already used for `--sk-color-red` on the legend
    // (see `legendCueOf`'s live-resolved comparison above) applied to the checked control's own
    // rendered fill, so a regression that leaves SOME visible glyph but the WRONG colour (e.g. the
    // accent swapped toward the card surface) is caught even though it would not move the sibling
    // test's pixel-difference fraction enough to fail its floor.
    const { group } = await openStory(page, "default");
    const controls = group.getByRole("radio");
    await expect(controls.nth(0)).toBeChecked();
    const [checkedShot] = await screenshotControlPair(page, controls.nth(0), controls.nth(1));
    const expectedYellow = await resolveTokenColor(page, "--sk-color-yellow");
    const centre = centrePixel(checkedShot);
    const channelTolerance = 40;
    expect(
      Math.abs(centre.r - expectedYellow.r) <= channelTolerance &&
        Math.abs(centre.g - expectedYellow.g) <= channelTolerance &&
        Math.abs(centre.b - expectedYellow.b) <= channelTolerance,
      `checked control's centre pixel rgb(${centre.r}, ${centre.g}, ${centre.b}) does not ` +
        `resolve to --sk-color-yellow rgb(${expectedYellow.r}, ${expectedYellow.g}, ` +
        `${expectedYellow.b})`,
    ).toBe(true);
  });
});
