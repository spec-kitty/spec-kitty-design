import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";
import esbuild from "esbuild";

/**
 * Focused Storybook Playwright suite for the CLI Auth pattern family
 * (spec-kitty/spec-kitty-design#329), following the shape of
 * `sk-repository-dossier-pattern.spec.ts` and `sk-mission-reading-pattern.spec.ts` (T001).
 *
 * IC-06 — all three dependencies have landed on `train/elements-first` and this lane has
 * rebased onto it: `#320`'s `.sk-button--danger-secondary` class (Story 2's Deny), `#321`'s
 * `--sk-border-control` contrast fix (Story 1's input boundary), and `#303`'s real
 * `sk-boundary-page` frame (Stories 3 and 4). Every assertion below is a real, green
 * composition check — no `pending #NNN` markers remain in this file.
 *
 * WHY THE THREE FORM ACTIONS ARE `button.sk-button`, NOT `sk-button` LOCATORS. `<sk-button>`
 * hard-codes `type="button"` on its shadow-root control and cannot submit an enclosing form
 * (its own source comment says so). Story 1's submit action and Story 2's Approve/Deny are
 * therefore native `<button type="submit" class="sk-button sk-button--*">` — see
 * `cli-auth.stories.ts`'s file-level doc comment for the full reasoning.
 *
 * WHY STORIES 3/4 OPEN AS `<main data-cli-auth-pattern>`. `sk-boundary-page` is a styles-only
 * frame with no custom element (`packages/styles/src/boundary-page/sk-boundary-page.css`'s own
 * header comment); its root is a consumer-owned `<main>` landmark, matching every one of that
 * file's own HTML exemplars.
 */

const STORY_PREFIX = "patterns-cli-auth--";
const STORY_IDS = [
  "code-entry-default",
  "code-entry-invalid",
  "code-entry-light-mode",
  "authorization-decision",
  "authorization-decision-light-mode",
  "terminal-success",
  "terminal-success-light-mode",
  "terminal-denied",
  "terminal-denied-light-mode",
  "terminal-error-no-action",
  "terminal-error-no-action-light-mode",
  "terminal-error-with-action",
  "terminal-error-with-action-light-mode",
] as const;

const TERMINAL_STORY_IDS = [
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

/** WCAG contrast ratio between two `rgb(...)`/`rgba(...)` color strings, computed in Node from
 *  colors read out of the page — never `eval`'d into the page itself. */
const contrastRatio = (c1: string, c2: string): number => {
  const parse = (color: string): [number, number, number] => {
    const match = color.match(/[0-9.]+/g);
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
  const l1 = luminance(parse(c1));
  const l2 = luminance(parse(c2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
};

test("source is Storybook-only composition with no forbidden reader, private reach, or application surface", () => {
  const source = readFileSync(
    "packages/elements/src/patterns/cli-auth.stories.ts",
    "utf8",
  );
  // Comment-stripped, the same way check-pattern-composition.mjs reads this file — so a doc
  // comment that NAMES a forbidden tag while explaining why it is forbidden cannot
  // false-positive a check meant for real markup usage.
  const code = esbuild.transformSync(source, { loader: "ts", format: "esm" }).code;

  // C-002's forbidden abstractions — no custom element with these names is ever used.
  expect(code).not.toMatch(
    /<\s*(?:auth-card|scope-chip|form-action-row|sk-terminal-frame|sk-boundary-stage)(?:\s|>)/,
  );
  // No custom element is DEFINED by this fixture (it composes, it does not build).
  expect(code).not.toMatch(/customElements\.define\s*\(/);
  // C-004 — no private-root reach, the same three spellings check-pattern-composition.mjs's R1
  // treats as the natural ones.
  expect(code).not.toMatch(/\.shadowRoot\b|\.renderRoot\b|getRootNode\s*\(/);
  // C-005 — no invented auth/session/persistence/fetch behavior.
  expect(code).not.toMatch(
    /\b(?:fetch|setTimeout|setInterval|requestAnimationFrame)\s*\(/,
  );
  expect(code).not.toMatch(
    /\b(?:localStorage|sessionStorage|Math\.random|new\s+Date)\b/,
  );
  // <sk-button> cannot submit an enclosing form; the three form actions must stay native
  // <button type="submit" class="sk-button ...">, not the custom element.
  expect(code).not.toMatch(/<\s*sk-button(?:\s|>)/);
  expect(code).not.toMatch(/from\s*["']\.\.\/button\/sk-button\.js["']/);
  expect(code).toMatch(
    /<button[^>]*\btype="submit"[^>]*\bclass="sk-button sk-button--primary"/,
  );
  // IC-06's real compositions must be present — Deny's real class and sk-boundary-page's real
  // BEM classes, composed as markup, not merely referenced in comments.
  expect(code).toMatch(/class="sk-button sk-button--danger-secondary"/);
  expect(code).toMatch(/class="sk-boundary-page sk-boundary-page__stage/);
  expect(code).toMatch(/class="sk-boundary-page__card"/);
  expect(code).toMatch(/class="sk-boundary-page__title"/);
  expect(code).toMatch(/class="sk-boundary-page__body"/);
  expect(code).toMatch(/class="sk-boundary-page__action-group"/);
  // No stale pending markers survive IC-06 — a leftover marker in shipped code would be worse
  // than none (mission brief).
  expect(source).not.toMatch(/pending #(?:320|321|303)\b/);
  expect(source).not.toContain("TODO(#303)");
  expect(code).toMatch(/excludeStories:\s*\[[\s\S]*["']CLI_AUTH_FIXTURES["']/);
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

test("heading order: at most one h1 per story, no skipped level, and terminal stories carry the fixture heading", async ({
  page,
}) => {
  for (const storyId of STORY_IDS) {
    const root = await openStory(page, storyId);
    const headings = await root
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((elements) =>
        elements.map((el) => Number(el.tagName.slice(1))),
      );
    // Stories 1 and 2 carry no page-level heading at all (their fixtures have no heading
    // field — inventing one would be a component default, C-006); Stories 3/4 carry exactly
    // the one `<h1>` sk-boundary-page's own anatomy requires.
    expect(headings.length).toBeLessThanOrEqual(1);
    if (headings.length === 1) expect(headings[0]).toBe(1);
  }

  const successRoot = await openStory(page, "terminal-success");
  await expect(successRoot.locator("h1")).toHaveText("Device connected");
  const deniedRoot = await openStory(page, "terminal-denied");
  await expect(deniedRoot.locator("h1")).toHaveText("Authorization denied");
});

test("Story 1 composes one labelled sk-form-input, its description association, the fixture-sourced aria-invalid branch, target-size, and #321's real contrast fix", async ({
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

  // DOM order (FR-007): input, then the native primary submit button.
  const tagOrder = await defaultRoot
    .locator("form > *")
    .evaluateAll((elements) => elements.map((el) => el.tagName.toLowerCase()));
  expect(tagOrder).toEqual(["sk-form-input", "button"]);
  await expect(defaultRoot.locator("form > button")).toHaveAttribute(
    "type",
    "submit",
  );
  await expect(defaultRoot.locator("form > button")).toHaveClass(
    "sk-button sk-button--primary",
  );

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

  // FR-011's target-size floor (WCAG 2.5.8 AA, 24px).
  const controlHeight = await defaultInput.evaluate((element) => {
    const input = element.shadowRoot?.querySelector("input");
    return input?.getBoundingClientRect().height ?? 0;
  });
  expect(controlHeight).toBeGreaterThanOrEqual(24);

  // FR-012's non-text contrast floor — now green against #321's real, landed
  // `--sk-border-control` token (packages/tokens/src/tokens.css,
  // packages/styles/src/form-field/sk-form-field.css), measured directly against the real
  // rendered control's own computed colors rather than assumed from the token value alone.
  // The colors are READ in the page and the ratio is COMPUTED in Node (contrastRatio above) —
  // no `eval` crosses the browser boundary.
  const controlColors = await defaultRoot.locator("sk-form-input").evaluate((element) => {
    const input = element.shadowRoot?.querySelector("input");
    if (!input) return null;
    const style = getComputedStyle(input);
    return { border: style.borderTopColor, background: style.backgroundColor };
  });
  expect(controlColors).not.toBeNull();
  const realRatio = contrastRatio(controlColors!.border, controlColors!.background);
  expect(realRatio).toBeGreaterThanOrEqual(3);

  // Proves the assertion mechanism itself can register red, not merely that it currently
  // passes: the SAME contrastRatio() function, fed the PRE-#321 pair this file used to fail
  // against (`--sk-border-default` #2B313B on `--sk-surface-input` #1C1F25, research.md), must
  // still compute the too-low ratio that made this a real red-first assertion before #321
  // landed — confirming this is not a check that is structurally incapable of failing.
  const regressedRatio = contrastRatio("rgb(43, 49, 59)", "rgb(28, 31, 37)");
  expect(regressedRatio).toBeLessThan(3);
});

test("Story 2 renders the authorization fixture's facts, scopes, and Approve-then-Deny DOM order — Deny composing #320's real danger-secondary class", async ({
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

  // List structure (squad pass 2, item 1): the scopes locator above is a descendant read that
  // would match identically through a bare <div> — it enumerates AROUND the <ul>/<li> wrapper
  // rather than asserting it exists. Assert the real list structure directly: three <li>, each
  // holding one <sk-pill-tag>, inside the one <ul class="sk-cli-auth-pattern__scopes">.
  await expect(
    root.locator("ul.sk-cli-auth-pattern__scopes > li > sk-pill-tag"),
  ).toHaveCount(3);

  const actionOrder = await root
    .locator("form button")
    .evaluateAll((elements) =>
      elements.map((el) => ({
        type: el.getAttribute("type"),
        name: el.getAttribute("name"),
        value: el.getAttribute("value"),
        classes: el.className,
        text: el.textContent?.trim(),
      })),
    );
  // `name`/`value` (squad pass 2, item 1): the prior `{type, classes, text}` projection
  // enumerated AROUND these two attributes — deleting them would leave every one of this
  // test's checks green. Distinct `value`s are the actual security-relevant assertion: Approve
  // and Deny must produce a differentiable request.
  expect(actionOrder).toEqual([
    {
      type: "submit",
      name: "decision",
      value: "approve",
      classes: "sk-button sk-button--primary",
      text: "Approve",
    },
    {
      type: "submit",
      name: "decision",
      value: "deny",
      classes: "sk-button sk-button--danger-secondary",
      text: "Deny",
    },
  ]);

  // Target-size floor (FR-011/NFR-001) for both actions — real geometry, not a class-presence
  // check alone.
  const heights = await root
    .locator("form button")
    .evaluateAll((elements) =>
      elements.map((el) => el.getBoundingClientRect().height),
    );
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(24);
});

test("keyboard focus order equals DOM order for Story 1, Story 2, and Story 4's native actions (FR-007)", async ({
  page,
}) => {
  // Real Tab-key traversal, not just a DOM-order read: `<sk-form-input>` does not set
  // `delegatesFocus`, so `document.activeElement` stays the host while its shadow root's own
  // `activeElement` reaches the real `<input>` — this walks that chain rather than assuming it.
  const activeElementChain = () =>
    page.evaluate(() => {
      const chain: string[] = [];
      let node: Element | null = document.activeElement;
      while (node) {
        chain.push(node.tagName.toLowerCase());
        node = (node as Element & { shadowRoot?: ShadowRoot }).shadowRoot
          ?.activeElement as Element | null;
      }
      return chain.join(">");
    });

  await openStory(page, "code-entry-default");
  await page.keyboard.press("Tab");
  expect(await activeElementChain()).toBe("sk-form-input>input");
  await page.keyboard.press("Tab");
  expect(await activeElementChain()).toBe("button");
  expect(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
  ).toBe("Continue");

  await openStory(page, "authorization-decision");
  await page.keyboard.press("Tab");
  expect(await activeElementChain()).toBe("button");
  expect(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
  ).toBe("Approve");
  await page.keyboard.press("Tab");
  expect(await activeElementChain()).toBe("button");
  expect(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
  ).toBe("Deny");

  await openStory(page, "terminal-error-with-action");
  await page.keyboard.press("Tab");
  expect(await activeElementChain()).toBe("a");
  expect(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
  ).toBe("Verify your account");
});

test("Stories 3 and 4 compose sk-boundary-page's real anatomy: stage/card/title/body/action-group, no mark or footnote", async ({
  page,
}) => {
  const expectations: Record<
    (typeof TERMINAL_STORY_IDS)[number],
    { heading: string; body: string; action: { label: string; href: string } | null }
  > = {
    "terminal-success": {
      heading: "Device connected",
      body: "Kitty CLI is now authorized on this account. Close this window and return to your terminal.",
      action: null,
    },
    "terminal-denied": {
      heading: "Authorization denied",
      body: "You denied Kitty CLI access to this account. No permissions were granted, and your terminal session was not connected.",
      action: null,
    },
    "terminal-error-no-action": {
      heading: "This code has expired",
      body: "The device code you approved is no longer valid. Start a new sign-in from your terminal to get a fresh code.",
      action: null,
    },
    "terminal-error-with-action": {
      heading: "Your account needs verification first",
      body: "Team Kitty could not finish device authorization until your account email is verified.",
      action: {
        label: "Verify your account",
        href: "https://team-kitty.example/account/verify",
      },
    },
  };

  for (const storyId of TERMINAL_STORY_IDS) {
    await openStory(page, storyId);

    await expect(page.locator("main[data-cli-auth-pattern]")).toHaveCount(1);
    const stage = page.locator(".sk-boundary-page.sk-boundary-page__stage");
    await expect(stage).toHaveCount(1);
    await expect(stage.locator("> .sk-boundary-page__card")).toHaveCount(1);

    const card = stage.locator(".sk-boundary-page__card");
    // Exact anatomy order: title, body, action-group — no mark, no footnote (this mission's
    // fixtures carry neither field).
    const childTags = await card
      .locator("> *")
      .evaluateAll((elements) =>
        elements.map((el) => ({
          tag: el.tagName.toLowerCase(),
          classes: el.className,
        })),
      );
    expect(childTags).toEqual([
      { tag: "h1", classes: "sk-boundary-page__title" },
      { tag: "p", classes: "sk-boundary-page__body" },
      { tag: "div", classes: "sk-boundary-page__action-group" },
    ]);
    await expect(card.locator(".sk-boundary-page__mark")).toHaveCount(0);
    await expect(card.locator(".sk-boundary-page__footnote")).toHaveCount(0);

    const expected = expectations[storyId];
    await expect(card.locator(".sk-boundary-page__title")).toHaveText(
      expected.heading,
    );
    await expect(card.locator(".sk-boundary-page__body")).toHaveText(
      expected.body,
    );

    const actionGroup = card.locator(".sk-boundary-page__action-group");
    if (expected.action) {
      await expect(actionGroup.locator("> *")).toHaveCount(1);
      const action = actionGroup.locator("a");
      await expect(action).toHaveText(expected.action.label);
      await expect(action).toHaveAttribute("href", expected.action.href);
      // Target-size floor sk-boundary-page's own action-group rule supplies (48px).
      const height = await action.evaluate(
        (el) => el.getBoundingClientRect().height,
      );
      expect(height).toBeGreaterThanOrEqual(44);
    } else {
      await expect(actionGroup.locator("> *")).toHaveCount(0);
    }
  }
});

// The terminal action-count invariant (0 or exactly 1, per fixture) is asserted against the
// fixture module directly in tests/node/cli-auth-no-literal.test.ts — not duplicated here.
// A Node-side dynamic import of packages/elements/src/patterns/cli-auth.fixture.js from this
// apps/storybook-scoped spec file would also trip @nx/enforce-module-boundaries (relative
// cross-project import), which the node lane's own test is not subject to.

test("every story stays contained at 390px with equal gutters and unclipped actions (FR-006, NFR-003)", async ({
  page,
}) => {
  for (const storyId of STORY_IDS) {
    if (storyId.endsWith("-light-mode")) continue; // covered by its dark counterpart already
    const root = await openStory(page, storyId, { width: 390, height: 844 });
    expect(await documentGeometry(page)).toEqual({
      clientWidth: 390,
      scrollWidth: 390,
    });
    const buttons = root.locator("form button, .sk-boundary-page__action-group a");
    const count = await buttons.count();
    for (let index = 0; index < count; index += 1) {
      const box = await buttons.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
  }
});

test("every story remains operable and unclipped at 200% zoom (FR-013)", async ({ page }) => {
  for (const storyId of STORY_IDS) {
    if (storyId.endsWith("-light-mode")) continue;
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

test("every story introduces no motion of its own under prefers-reduced-motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const storyId of STORY_IDS) {
    if (storyId.endsWith("-light-mode")) continue;
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

test("forced colors keep both button tones, scope pill-tags, and the boundary-page card visible", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Playwright forced-colors emulation is Chromium-owned",
  );
  await page.emulateMedia({ forcedColors: "active" });

  const authRoot = await openStory(page, "authorization-decision");
  const buttons = await authRoot
    .locator("form button")
    .evaluateAll((elements) =>
      elements.map((element) => ({
        display: getComputedStyle(element).display,
      })),
    );
  expect(buttons).toHaveLength(2);
  expect(buttons.every((b) => b.display !== "none")).toBe(true);

  // #320's danger-secondary tone declares a forced-colors-only border-width bump
  // (`sk-button.css`'s own `@media (forced-colors: active) { .sk-button--danger-secondary {
  // border-width: var(--sk-border-width-2); } }`) — assert it actually widens versus the
  // normal-rendering width, not merely that the button remains visible.
  await page.emulateMedia({ forcedColors: "none" });
  const normalRoot = await openStory(page, "authorization-decision");
  const normalDenyBorder = await normalRoot
    .locator("form button")
    .nth(1)
    .evaluate((el) => getComputedStyle(el).borderTopWidth);
  // The scope pill-tags carry no `status` attribute (this story's fixture never sets one), so
  // sk-pill-tag.css's own forced-colors block (`.sk-pill-tag--status-*` only) declares nothing
  // for them — a status-less pill's protection is the UA's own forced-colors remap of
  // `background`/`color` to the system Canvas/CanvasText pair, not authored CSS (that file's own
  // header comment). Read from the shadow root's real `.sk-pill-tag` span, not the host: the host
  // carries none of `pillTagClasses()`'s classes — they render on the slotted `<span>`.
  const normalPillColors = await normalRoot
    .locator("sk-pill-tag")
    .first()
    .evaluate((element) => {
      const span = (element as Element & { shadowRoot: ShadowRoot }).shadowRoot.querySelector(
        ".sk-pill-tag",
      );
      const style = span ? getComputedStyle(span) : null;
      return { background: style?.backgroundColor, color: style?.color };
    });
  await page.emulateMedia({ forcedColors: "active" });
  const forcedRoot = await openStory(page, "authorization-decision");
  const forcedDenyBorder = await forcedRoot
    .locator("form button")
    .nth(1)
    .evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(Number.parseFloat(forcedDenyBorder)).toBeGreaterThan(
    Number.parseFloat(normalDenyBorder),
  );

  // Assert the UA remap actually happened — a real, falsifiable check, not merely that a
  // computed value exists (`getComputedStyle(...).borderWidth` always returns a string,
  // `"0px"` included, which is why a bare `toBeDefined()` here could never fail): the
  // status-less pill's background/text colours must differ from their normal-mode values once
  // forced colors are active.
  const forcedPillColors = await forcedRoot
    .locator("sk-pill-tag")
    .first()
    .evaluate((element) => {
      const span = (element as Element & { shadowRoot: ShadowRoot }).shadowRoot.querySelector(
        ".sk-pill-tag",
      );
      const style = span ? getComputedStyle(span) : null;
      return { background: style?.backgroundColor, color: style?.color };
    });
  expect(forcedPillColors.background).not.toBe(normalPillColors.background);
  expect(forcedPillColors.color).not.toBe(normalPillColors.color);

  // sk-boundary-page's own card carries no border normally (a surface/background distinction
  // only) but declares one under forced colors as the first and only place its edge exists
  // (that file's own header comment) — assert the card gets a real, visible border here.
  const terminalRoot = await openStory(page, "terminal-success");
  const cardBorder = await terminalRoot
    .locator(".sk-boundary-page__card")
    .evaluate((el) => ({
      width: getComputedStyle(el).borderTopWidth,
      style: getComputedStyle(el).borderTopStyle,
    }));
  expect(Number.parseFloat(cardBorder.width)).toBeGreaterThan(0);
  expect(cardBorder.style).toBe("solid");
});

test("LightMode is a real class=\"sk-light\" wrapper, asserted by computed style, for every story family", async ({
  page,
}) => {
  // Backgrounds are checked on the element that actually PAINTS one: `.sk-cli-auth-pattern`
  // for Story 1/2 (Story 1/2's own wrapper), `.sk-boundary-page__stage` for Story 3/4 (the
  // real `background: var(--sk-surface-page)` declaration lives there, not on `<main>` — the
  // `[data-cli-auth-pattern]` root is transparent in both themes by design).
  const pairs: ReadonlyArray<
    [StoryId, StoryId, string]
  > = [
    ["code-entry-default", "code-entry-light-mode", "[data-cli-auth-pattern]"],
    [
      "authorization-decision",
      "authorization-decision-light-mode",
      "[data-cli-auth-pattern]",
    ],
    ["terminal-success", "terminal-success-light-mode", ".sk-boundary-page__stage"],
    ["terminal-denied", "terminal-denied-light-mode", ".sk-boundary-page__stage"],
    [
      "terminal-error-no-action",
      "terminal-error-no-action-light-mode",
      ".sk-boundary-page__stage",
    ],
    [
      "terminal-error-with-action",
      "terminal-error-with-action-light-mode",
      ".sk-boundary-page__stage",
    ],
  ];

  for (const [darkId, lightId, backgroundSelector] of pairs) {
    await openStory(page, darkId);
    const darkBg = await page
      .locator(backgroundSelector)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const light = await openStory(page, lightId);
    await expect(light).toHaveClass(/\bsk-light\b/);
    const lightBg = await page
      .locator(backgroundSelector)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(lightBg, `${lightId} must resolve a different background than ${darkId}`).not.toBe(
      darkBg,
    );
  }
});
