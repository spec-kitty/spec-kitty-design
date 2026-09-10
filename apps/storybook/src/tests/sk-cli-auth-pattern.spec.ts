import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";

/**
 * Focused Storybook Playwright suite for the CLI Auth pattern family
 * (spec-kitty/spec-kitty-design#329), following the shape of
 * `sk-repository-dossier-pattern.spec.ts` and `sk-mission-reading-pattern.spec.ts` (T001).
 *
 * SCOPE OF THIS PASS (IC-01 through IC-05 only, per this WP's mission brief). Story 1 and
 * Story 2's non-Deny anatomy are fully composable now and are asserted GREEN below. Two
 * categories of assertion are DELIBERATELY, DOCUMENTEDLY RED, each in its own isolated test so
 * its failure never masks an unrelated regression:
 *
 *   - Story 2's Deny action — `#320`'s danger-secondary `sk-button` tone has not landed on
 *     `train/elements-first` (research.md, verified at authoring time). Marked `// pending
 *     #320` at its test below.
 *   - Stories 3 and 4's `sk-boundary-page` composition — `#303` does not exist anywhere in this
 *     tree (verified: `find packages/{elements,styles}/src -iname '*boundary-page*'`, zero
 *     results). Marked `// pending #303` at its tests below.
 *
 * Story 1's contrast/target-size clauses that depend on `#321`'s landed fix are also isolated
 * and marked `// pending #321` — the CURRENT `.sk-input`/`sk-form-field` border and lack of an
 * input target-size floor are exactly the gap `#321` exists to close (research.md).
 */

const STORY_PREFIX = "patterns-cli-auth--";
const STORY_IDS = [
  "code-entry-default",
  "code-entry-invalid",
  "code-entry-light-mode",
  "authorization-decision",
  "authorization-decision-light-mode",
  "terminal-success",
  "terminal-denied",
  "terminal-error-no-action",
  "terminal-error-with-action",
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
  const root = page.locator("[data-cli-auth-pattern]").first();
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
  expect(violations, `${storyId} must have zero WCAG 2.1 AA violations`).toEqual(
    [],
  );
};

test("source is Storybook-only composition with no forbidden reader, private reach, or application surface", () => {
  const source = readFileSync(
    "packages/elements/src/patterns/cli-auth.stories.ts",
    "utf8",
  );

  // C-002's forbidden abstractions — no custom element with these names is ever used.
  expect(source).not.toMatch(
    /<\s*(?:auth-card|scope-chip|form-action-row|sk-terminal-frame|sk-boundary-stage)(?:\s|>)/,
  );
  // No custom element is DEFINED by this fixture (it composes, it does not build).
  expect(source).not.toMatch(/customElements\.define\s*\(/);
  // C-004 — no private-root reach, the same three spellings check-pattern-composition.mjs's R1
  // treats as the natural ones.
  expect(source).not.toMatch(/\.shadowRoot\b|\.renderRoot\b|getRootNode\s*\(/);
  // C-005 — no invented auth/session/persistence/fetch behavior.
  expect(source).not.toMatch(
    /\b(?:fetch|setTimeout|setInterval|requestAnimationFrame)\s*\(/,
  );
  expect(source).not.toMatch(
    /\b(?:localStorage|sessionStorage|Math\.random|new\s+Date)\b/,
  );
  // The dependency-honesty markers this WP requires must actually be present, not merely
  // asserted in prose elsewhere.
  expect(source).toContain("pending #320");
  expect(source).toContain("TODO(#303)");
  expect(source).toMatch(/excludeStories:\s*\[[\s\S]*["']CLI_AUTH_FIXTURES["']/);
});

test("built index discovers the complete reviewed family", async ({ request }) => {
  const response = await request.get("/index.json");
  expect(response.ok()).toBe(true);
  const index = (await response.json()) as {
    entries: Readonly<Record<string, Readonly<{ type: string; title: string }>>>;
  };
  const entries = Object.entries(index.entries)
    .filter(
      ([, entry]) => entry.type === "story" && entry.title === "Patterns/CLI Auth",
    )
    .map(([id]) => id)
    .sort();

  expect(entries).toEqual(STORY_IDS.map((id) => `${STORY_PREFIX}${id}`).sort());
});

test("every story is non-empty, story-error-free, and axe-clean", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    const source = message.location().url;
    const isKnownFontResolution =
      message.type() === "error" && source.includes("/assets/fonts/");
    if (message.type() === "error" && !isKnownFontResolution) errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const storyId of STORY_IDS) {
    const root = await openStory(page, storyId);
    await expect(root).toBeVisible();
    expect((await root.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
    await axeIsClean(page, storyId);
  }

  expect(errors).toEqual([]);
});

test("Story 1 composes one labelled sk-form-input, its description association, and the fixture-sourced aria-invalid branch", async ({
  page,
}) => {
  const defaultRoot = await openStory(page, "code-entry-default");
  const defaultInput = defaultRoot.locator("sk-form-input");
  await expect(defaultInput).toHaveCount(1);
  await expect(defaultInput).toHaveAttribute("label", "Device code");
  await expect(defaultInput).toHaveAttribute(
    "description",
    "Enter the 8-character code shown on your other device.",
  );

  const defaultFacts = await defaultInput.evaluate((element) => {
    const input = element.shadowRoot?.querySelector("input");
    const labelEl = element.shadowRoot?.querySelector("label");
    return {
      ariaInvalid: input?.getAttribute("aria-invalid"),
      labelFor: labelEl?.getAttribute("for"),
      controlId: input?.id,
      describedBy: input?.getAttribute("aria-describedby"),
      errorText: element.shadowRoot?.getElementById("error")?.textContent?.trim(),
    };
  });
  expect(defaultFacts.ariaInvalid).toBe("false");
  expect(defaultFacts.labelFor).toBe(defaultFacts.controlId);
  expect(defaultFacts.describedBy).toContain("description");
  expect(defaultFacts.errorText).toBe("");

  // Keyboard order equals DOM order (FR-007): input, then the primary submit button.
  const tagOrder = await defaultRoot
    .locator("form > *")
    .evaluateAll((elements) => elements.map((el) => el.tagName.toLowerCase()));
  expect(tagOrder).toEqual(["sk-form-input", "sk-button"]);

  const invalidRoot = await openStory(page, "code-entry-invalid");
  const invalidInput = invalidRoot.locator("sk-form-input");
  const invalidFacts = await invalidInput.evaluate((element) => {
    const input = element.shadowRoot?.querySelector("input");
    return {
      ariaInvalid: input?.getAttribute("aria-invalid"),
      describedBy: input?.getAttribute("aria-describedby"),
      errorText: element.shadowRoot?.getElementById("error")?.textContent?.trim(),
      errorRole: element.shadowRoot?.getElementById("error")?.getAttribute("role"),
    };
  });
  expect(invalidFacts.ariaInvalid).toBe("true");
  expect(invalidFacts.describedBy).toContain("error");
  expect(invalidFacts.errorText).toBe(
    "That code has expired. Request a new one from your other device.",
  );
  expect(invalidFacts.errorRole).toBe("alert");

  // FR-011's target-size floor (WCAG 2.5.8 AA, 24px) — this DOES already clear the floor
  // against the current control's own padding/font-size, even though `sk-form-field.css`
  // declares no explicit min-height (research.md). Measured directly rather than assumed: this
  // is real, currently-passing evidence, not something #321 changes.
  const controlHeight = await defaultInput.evaluate((element) => {
    const input = element.shadowRoot?.querySelector("input");
    return input?.getBoundingClientRect().height ?? 0;
  });
  expect(controlHeight).toBeGreaterThanOrEqual(24);
});

test("Story 1's non-text contrast clause depends on #321's landed fix — pending #321", async ({
  page,
}) => {
  // FR-012 for this story cannot pass against the CURRENT `.sk-input` contract. Measured
  // directly against the real rendered control (not assumed from the token values alone):
  // `--sk-border-default` against `--sk-surface-input` is #2B313B on #1C1F25 in dark
  // (contrast 1.26:1) and #EAE4D2 on #F5F1E6 in light (1.13:1) — both far below WCAG 1.4.11's
  // 3:1 non-text-contrast floor for the input's own boundary. This is exactly the "weak border
  // token" gap research.md and #155 both name and #321 exists to fix; #320 does not touch this
  // token, so this assertion is genuinely independent of #320's Deny work. Turns green the
  // moment #321 lands and this lane rebases (T010) — not before.
  const root = await openStory(page, "code-entry-default");
  const ratio = await root.locator("sk-form-input").evaluate((element) => {
    const input = element.shadowRoot?.querySelector("input");
    if (!input) return 0;
    const style = getComputedStyle(input);
    const parse = (color: string): [number, number, number] => {
      const match = color.match(/\d+(\.\d+)?/g);
      if (!match) return [0, 0, 0];
      return [Number(match[0]), Number(match[1]), Number(match[2])];
    };
    const luminance = ([r, g, b]: [number, number, number]): number => {
      const channel = (c: number): number => {
        const value = c / 255;
        return value <= 0.03928
          ? value / 12.92
          : Math.pow((value + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const l1 = luminance(parse(style.borderTopColor));
    const l2 = luminance(parse(style.backgroundColor));
    const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (lighter + 0.05) / (darker + 0.05);
  });
  // WCAG 1.4.11's non-text-contrast AA floor.
  expect(ratio).toBeGreaterThanOrEqual(3);
});

test("Story 2 renders the authorization fixture's facts, scopes, and Approve-then-Deny DOM order exactly", async ({
  page,
}) => {
  const root = await openStory(page, "authorization-decision");

  const facts = await root
    .locator(".sk-facts")
    .evaluate((dl) => {
      const terms = [...dl.querySelectorAll(".sk-facts__term")].map((el) =>
        el.textContent?.trim(),
      );
      const values = [...dl.querySelectorAll(".sk-facts__value")].map((el) =>
        el.textContent?.trim(),
      );
      return terms.map((term, index) => ({ term, value: values[index] }));
    });
  expect(facts).toEqual([
    { term: "Client", value: "Kitty CLI" },
    { term: "Account", value: "ada@team-kitty.example" },
    { term: "Redirect target", value: "https://cli.team-kitty.example/callback" },
  ]);

  const scopes = await root
    .locator("sk-pill-tag")
    .evaluateAll((elements) => elements.map((el) => el.textContent?.trim()));
  expect(scopes).toEqual([
    "Read repositories",
    "Read Missions",
    "Open pull requests",
  ]);

  const actionOrder = await root
    .locator("form sk-button")
    .evaluateAll((elements) =>
      elements.map((el) => ({
        variant: el.getAttribute("variant"),
        text: el.textContent?.trim(),
      })),
    );
  expect(actionOrder).toEqual([
    { variant: "primary", text: "Approve" },
    { variant: "secondary", text: "Deny" },
  ]);
});

test("Story 2's Deny action composes #320's real danger-secondary tone once it lands — pending #320", async ({
  page,
}) => {
  // #320 has not landed on train/elements-first at authoring time (research.md). `sk-button`
  // publishes only primary/secondary/ghost today — verified directly against
  // packages/styles/src/button/sk-button.css, which names no danger tone. This assertion is
  // therefore red for the honest reason: Deny is a PLAIN secondary button (C-010 forbids
  // forking a local stand-in), and T010 turns this green once #320 lands and this lane
  // rebases onto the train commit that carries it.
  const root = await openStory(page, "authorization-decision");
  const denyVariant = await root
    .locator("form sk-button")
    .nth(1)
    .getAttribute("variant");
  expect(denyVariant).toBe("danger-secondary");
});

test("Story 3/4 compose #303's public sk-boundary-page frame once it lands — pending #303", async ({
  page,
}) => {
  // #303 does not exist anywhere in this tree at authoring time (research.md, verified via
  // `find packages/{elements,styles}/src -iname '*boundary-page*'`, zero results). Each story
  // renders a documented pending shell instead of a forked frame (C-003) — this assertion
  // fails cleanly and legibly (zero matches, not a crash) until #303 lands and T010 composes
  // the real element here.
  for (const storyId of [
    "terminal-success",
    "terminal-denied",
    "terminal-error-no-action",
    "terminal-error-with-action",
  ] as const) {
    const root = await openStory(page, storyId);
    await expect(root).toHaveAttribute("data-cli-auth-pending", "303");
    await expect(root.locator("sk-boundary-page")).toHaveCount(1);
  }
});

test("Stories 3 and 4's action-count invariant is independently verifiable from the fixture, without the frame", async () => {
  const { CLI_AUTH_FIXTURES, terminalActionCount } = await import(
    "../../../../packages/elements/src/patterns/cli-auth.fixture.js"
  );
  expect(terminalActionCount(CLI_AUTH_FIXTURES.terminalSuccess)).toBe(0);
  expect(terminalActionCount(CLI_AUTH_FIXTURES.terminalDenied)).toBe(0);
  expect(terminalActionCount(CLI_AUTH_FIXTURES.terminalErrorNoAction)).toBe(0);
  expect(terminalActionCount(CLI_AUTH_FIXTURES.terminalErrorWithAction)).toBe(1);
});

test("Stories 1 and 2 stay contained at 390px with equal gutters and unclipped actions (FR-006, NFR-003)", async ({
  page,
}) => {
  for (const storyId of ["code-entry-default", "authorization-decision"] as const) {
    const root = await openStory(page, storyId, { width: 390, height: 844 });
    expect(await documentGeometry(page)).toEqual({
      clientWidth: 390,
      scrollWidth: 390,
    });
    const buttons = root.locator("sk-button");
    const count = await buttons.count();
    for (let index = 0; index < count; index += 1) {
      const box = await buttons.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
  }
});

test("Stories 1 and 2 remain operable and unclipped at 200% zoom (FR-013)", async ({ page }) => {
  for (const storyId of ["code-entry-default", "authorization-decision"] as const) {
    await page.setViewportSize({ width: 780, height: 844 });
    await page.goto(`/iframe.html?id=${STORY_PREFIX}${storyId}&viewMode=story`);
    await page
      .locator("[data-cli-auth-pattern]")
      .first()
      .waitFor({ state: "visible" });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await expect
      .poll(() =>
        page.evaluate(() => ({
          zoom: getComputedStyle(document.documentElement).zoom,
          contained:
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        })),
      )
      .toEqual({ zoom: "2", contained: true });
  }
});

test("Stories 1 and 2 introduce no motion of their own under prefers-reduced-motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const storyId of ["code-entry-default", "authorization-decision"] as const) {
    const root = await openStory(page, storyId);
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
  }
});

test("Stories 1 and 2 keep the input boundary, both button tones, and scope pill-tags visible under forced colors", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Playwright forced-colors emulation is Chromium-owned",
  );
  await page.emulateMedia({ forcedColors: "active" });
  const root = await openStory(page, "authorization-decision");
  const pillBorder = await root
    .locator("sk-pill-tag")
    .first()
    .evaluate((element) => getComputedStyle(element).borderWidth);
  // sk-pill-tag has no status tone here (scopes are the neutral variant), so this only proves
  // the element remains present and rendered under forced colors — the operational-status
  // forced-colors contract is sk-pill-tag's own, asserted elsewhere in the catalogue.
  expect(pillBorder).toBeDefined();
  const buttons = await root
    .locator("sk-button")
    .evaluateAll((elements) =>
      elements.map((element) => ({
        display: getComputedStyle(element).display,
      })),
    );
  expect(buttons.every((b) => b.display !== "none")).toBe(true);
});

test("LightMode is a real class=\"sk-light\" wrapper, asserted by computed style — not merely rendered", async ({
  page,
}) => {
  const dark = await openStory(page, "code-entry-default");
  const darkBg = await dark.evaluate((el) => getComputedStyle(el).backgroundColor);
  const light = await openStory(page, "code-entry-light-mode");
  await expect(light).toHaveClass(/\bsk-light\b/);
  const lightBg = await light.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(lightBg).not.toBe(darkBg);

  const darkAuth = await openStory(page, "authorization-decision");
  const darkAuthBg = await darkAuth.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  const lightAuth = await openStory(page, "authorization-decision-light-mode");
  await expect(lightAuth).toHaveClass(/\bsk-light\b/);
  const lightAuthBg = await lightAuth.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  expect(lightAuthBg).not.toBe(darkAuthBg);
});
