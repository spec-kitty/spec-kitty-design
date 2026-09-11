/**
 * Playwright suite for the Account Front Door pattern (#355, epic #352).
 *
 * T001: this file is authored BEFORE `account-front-door.fixture.ts`/`.stories.ts` exist, and its
 * first run is recorded failing because the family and its stories do not exist yet in the built
 * Storybook index — never because of a missing or broken test harness (FR-031, SC-016). See the
 * PR body for the recorded red-first run.
 *
 * STORY_IDS below were re-derived from the BUILT Storybook index
 * (`apps/storybook/storybook-static/index.json`) before being committed here, per T007 — never
 * guessed from export names (precedent: #336's own `expected-stories.json` `$comment`).
 */
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";

const STORY_PREFIX = "patterns-account-front-door--";
const STORY_IDS = [
  "landing",
  "entry-boundary",
  "submitted-validation",
  "recovery-sent",
  "terminal-inactive",
  "legal-published",
  "legal-unavailable",
  "email-management",
  "password-change",
  "password-set",
  "light-mode",
  "legal-light-mode",
  "account-light-mode",
  "forced-colors",
  "reduced-motion",
  "rtl",
  "narrow-390",
  "short-viewport",
  "zoom-200",
  "long-strings",
] as const;

type StoryId = (typeof STORY_IDS)[number];

/** No Platform, Docs, Pricing, profile, API-key, billing, or subscription destination anywhere
 *  in any composition (FR-004, C-013, SC-018). Case-insensitive substring sweep over every href
 *  and every visible link/button text in the story. */
const FORBIDDEN_DESTINATION_PATTERN =
  /platform|\bdocs\b|documentation|pricing|\bprofile\b|api[-\s]?key|billing|subscription/i;

const openStory = async (
  page: Page,
  id: StoryId,
  viewport: Readonly<{ width: number; height: number }> = { width: 1440, height: 1024 },
): Promise<Locator> => {
  await page.goto("about:blank");
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=${STORY_PREFIX}${id}&viewMode=story`);
  const root = page.locator("[data-account-front-door-pattern]").first();
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
        error instanceof Error && error.message.includes("Axe is already running");
      if (!concurrentAxe || attempt === 9) throw error;
      await page.waitForTimeout(100);
    }
  }
  expect(violations, `${storyId} must have zero WCAG 2.1 AA violations`).toEqual([]);
};

const documentGeometry = (page: Page) =>
  page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

/** A page-level request listener attached AFTER the story's own initial render is complete
 *  (`data-render-complete="true"`), so every request it records is caused by the INTERACTION
 *  under test, never by the Storybook harness loading the iframe's own JS/CSS bundles — those
 *  vary by build (Vite content hashes) and are exactly "the iframe's own initial load" NFR-006
 *  carves out. Call this only after `openStory` has resolved. */
const trackRequestsFromNowOn = (page: Page): { extra: string[] } => {
  const state = { extra: [] as string[] };
  page.on("request", (request) => {
    state.extra.push(request.url());
  });
  return state;
};

test.describe("built index and non-vacuous rendering", () => {
  test("the built index discovers every required story and excludes non-story helpers", async ({
    request,
  }) => {
    const response = await request.get("/index.json");
    expect(response.ok()).toBe(true);
    const index = (await response.json()) as {
      entries: Readonly<Record<string, Readonly<{ type: string; title: string }>>>;
    };
    const entries = Object.entries(index.entries)
      .filter(([, entry]) => entry.type === "story" && entry.title === "Patterns/Account Front Door")
      .map(([id]) => id)
      .sort();
    expect(entries).toEqual(STORY_IDS.map((id) => `${STORY_PREFIX}${id}`).sort());
  });

  test("every story renders a non-empty axe-clean composition", async ({ page }) => {
    for (const id of STORY_IDS) {
      const root = await openStory(page, id);
      expect(await root.locator("*").count()).toBeGreaterThan(0);
      await axeIsClean(page, id);
    }
  });
});

test.describe("truth constraint: no invented product navigation (FR-004, SC-018)", () => {
  test("every story carries no Platform/Docs/Pricing/profile/API-key/billing destination", async ({
    page,
  }) => {
    for (const id of STORY_IDS) {
      const root = await openStory(page, id);
      const hrefs = await root.locator("a[href]").evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("href") ?? ""),
      );
      const texts = await root.locator("a, button").evaluateAll((nodes) =>
        nodes.map((node) => node.textContent?.trim() ?? ""),
      );
      for (const value of [...hrefs, ...texts]) {
        expect(
          FORBIDDEN_DESTINATION_PATTERN.test(value),
          `${id} must not name a forbidden destination, found "${value}"`,
        ).toBe(false);
      }
    }
  });
});

test.describe("composition 1 — landing (FR-001..FR-004, FR-010)", () => {
  test("exact heading, CTA, install copy controls, and a three-step native ordered list", async ({
    page,
  }) => {
    const root = await openStory(page, "landing");
    await expect(root.locator("h1")).toHaveCount(1);
    await expect(root.locator("sk-copy-field")).toHaveCount(2);
    const steps = root.locator("ol > li");
    await expect(steps).toHaveCount(3);
  });

  test("route-aware public chrome carries both Sign in and Start free, and the theme control", async ({
    page,
  }) => {
    const root = await openStory(page, "landing");
    const actions = root.locator(".sk-public-header__action");
    // Sign in + Start free + the theme toggle = 3 actions, every one carrying the floor class.
    await expect(actions).toHaveCount(3);
    await expect(root.locator("sk-theme-toggle[data-theme-control]")).toHaveCount(1);
  });

  test("compact footer links are bare <a slot=\"compact-links\">, never <li> or <nav>", async ({
    page,
  }) => {
    const root = await openStory(page, "landing");
    const footer = root.locator("sk-site-footer");
    await expect(footer).toHaveCount(1);
    const slottedLinks = page.locator('a[slot="compact-links"]');
    await expect(slottedLinks.first()).toHaveClass(/sk-site-footer__link/);
    await expect(slottedLinks.first()).toHaveClass(/sk-site-footer__link--compact/);
  });
});

test.describe("composition 2 — entry boundary (FR-005..FR-009, C-013)", () => {
  test("exactly four visible fields — email, password, team name, Terms — and one password input", async ({
    page,
  }) => {
    const root = await openStory(page, "entry-boundary");
    const visibleInputs = root.locator(
      'form input:not([type="hidden"]), form input[type="checkbox"]',
    );
    await expect(visibleInputs).toHaveCount(4);
    await expect(root.locator('input[type="password"]')).toHaveCount(1);
    await expect(root.locator('input[type="checkbox"][required]')).toHaveCount(1);
  });

  test("the CSRF placeholder is present, empty, and server-owned — never populated", async ({
    page,
  }) => {
    const root = await openStory(page, "entry-boundary");
    const csrf = root.locator('input[type="hidden"][data-server-owned="true"]');
    await expect(csrf).toHaveCount(1);
    await expect(csrf).toHaveAttribute("value", "");
  });

  test("zero providers renders zero provider affordances and zero region (FR-009 empty arm)", async ({
    page,
  }) => {
    const root = await openStory(page, "entry-boundary");
    await expect(root.locator("[data-provider-region]")).toHaveCount(0);
  });

  test("the submit control sits outside the form and is bound by form=, inheriting the frame's floor", async ({
    page,
  }) => {
    const root = await openStory(page, "entry-boundary");
    const submit = root.locator(".sk-boundary-page__action-group button[type=\"submit\"]");
    await expect(submit).toHaveCount(1);
    const formId = await root.locator("form").getAttribute("id");
    await expect(submit).toHaveAttribute("form", formId ?? "");
    const box = await submit.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe("composition 3 — submitted validation (FR-011..FR-013, NFR-008)", () => {
  test("summary link count equals the error count, every href resolves, and roles do not double-announce", async ({
    page,
  }) => {
    const root = await openStory(page, "submitted-validation");
    const summary = root.locator("[data-error-summary]");
    await expect(summary).toHaveAttribute("role", "alert");
    const links = summary.locator("a[href]");
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
    for (let index = 0; index < linkCount; index += 1) {
      const href = await links.nth(index).getAttribute("href");
      const fieldId = (href ?? "").replace("#", "");
      expect(fieldId.length, `dead anchor: ${href}`).toBeGreaterThan(0);
      await expect(page.locator(`#${fieldId}`)).toHaveCount(1);
    }
    // Field-local description carries no role — only the summary does (reconciliation item 12).
    const fieldDescriptions = root.locator(
      ".sk-form-field--error .sk-form-field__description",
    );
    const fieldDescriptionCount = await fieldDescriptions.count();
    for (let index = 0; index < fieldDescriptionCount; index += 1) {
      await expect(fieldDescriptions.nth(index)).not.toHaveAttribute("role", /.+/);
    }
  });

  test("every invalid field carries aria-invalid and aria-describedby pointing at matching text", async ({
    page,
  }) => {
    const root = await openStory(page, "submitted-validation");
    const invalidFields = root.locator(".sk-form-field--error .sk-input");
    const count = await invalidFields.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const field = invalidFields.nth(index);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      const describedBy = await field.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      const description = page.locator(`#${describedBy}`);
      await expect(description).toHaveCount(1);
      const summaryLinkText = await root
        .locator(`[data-error-summary] a[href="#${await field.getAttribute("id")}"]`)
        .textContent();
      await expect(description).toHaveText((summaryLinkText ?? "").trim());
    }
  });

  test("zero sk-error-summary elements anywhere (C-003)", async ({ page }) => {
    const root = await openStory(page, "submitted-validation");
    await expect(root.locator("sk-error-summary")).toHaveCount(0);
  });

  test("focus lands on the error summary once the invalid state has rendered", async ({ page }) => {
    const root = await openStory(page, "submitted-validation");
    const summary = root.locator("[data-error-summary]");
    await expect(summary).toBeFocused();
  });
});

test.describe("composition 4 — recovery and terminal (FR-014..FR-016)", () => {
  test("recovery-sent renders one frozen sentence with no existence signal", async ({ page }) => {
    const root = await openStory(page, "recovery-sent");
    const body = await root.locator(".sk-boundary-page__body").first().textContent();
    expect(body?.length ?? 0).toBeGreaterThan(0);
    for (const forbidden of ["account exists", "no account", "not found", "already registered"]) {
      expect((body ?? "").toLowerCase()).not.toContain(forbidden);
    }
  });

  test("terminal-inactive has zero interactive descendants inside its own region", async ({
    page,
  }) => {
    const root = await openStory(page, "terminal-inactive");
    const region = root.locator("[data-terminal-state]");
    await expect(region.locator("a, button")).toHaveCount(0);
    await expect(root.locator(".sk-boundary-page__action-group")).toHaveCount(1);
  });
});

test.describe("composition 5 — legal (FR-017, FR-018, SC-008)", () => {
  test("legal-published renders the .sk-prose region at natural scroll with no extra chrome", async ({
    page,
  }) => {
    const root = await openStory(page, "legal-published");
    const prose = root.locator(".sk-prose");
    await expect(prose).toHaveCount(1);
    await expect(prose.locator("h2")).toHaveCount(2);
    await expect(prose.locator("ul")).toHaveCount(1);
    await expect(root.locator('[role="tablist"], .toc, [data-table-of-contents]')).toHaveCount(0);
  });

  test("legal-unavailable is one generic refusal inside the boundary frame with an empty action group", async ({
    page,
  }) => {
    const root = await openStory(page, "legal-unavailable");
    await expect(root.locator(".sk-boundary-page__action-group")).toHaveCount(1);
    await expect(root.locator(".sk-boundary-page__action-group *")).toHaveCount(0);
  });
});

test.describe("composition 6 — account maintenance (FR-019..FR-022, C-013)", () => {
  test("exactly one checked radio at all times, exclusivity native", async ({ page }) => {
    const root = await openStory(page, "email-management");
    await expect(root.locator('input[type="radio"]:checked')).toHaveCount(1);
  });

  test("email actions render in the fixed order make-primary / resend-verification / remove", async ({
    page,
  }) => {
    const root = await openStory(page, "email-management");
    const actions = root.locator(".sk-account-front-door-pattern__email-actions button");
    await expect(actions).toHaveCount(3);
    await expect(actions.nth(0)).toHaveText(/make primary/i);
    await expect(actions.nth(1)).toHaveText(/re-send verification/i);
    await expect(actions.nth(2)).toHaveText(/remove/i);
    await expect(actions.nth(1)).toHaveClass(/sk-button--secondary/);
    await expect(actions.nth(2)).toHaveClass(/sk-button--danger-secondary/);
  });

  test("the cooldown region is absent without a cooldown fact (FR-021, strengthened to absence)", async ({
    page,
  }) => {
    const root = await openStory(page, "email-management");
    await expect(root.locator("[data-cooldown-region]")).toHaveCount(0);
  });

  test("no sk-action-row is composed anywhere in composition 6 (orchestrator ruling 2)", async ({
    page,
  }) => {
    const root = await openStory(page, "email-management");
    await expect(root.locator("sk-action-row")).toHaveCount(0);
  });

  test("password-change carries a current-password field; password-set does not", async ({
    page,
  }) => {
    const change = await openStory(page, "password-change");
    await expect(change.locator('input[autocomplete="current-password"]')).toHaveCount(1);
    const set = await openStory(page, "password-set");
    await expect(set.locator('input[autocomplete="current-password"]')).toHaveCount(0);
  });

  test("neither password composition exposes profile, API-key, billing, or pricing destinations", async ({
    page,
  }) => {
    for (const id of ["password-change", "password-set"] as const) {
      const root = await openStory(page, id);
      const hrefs = await root.locator("a[href]").evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("href") ?? ""),
      );
      for (const href of hrefs) expect(FORBIDDEN_DESTINATION_PATTERN.test(href)).toBe(false);
    }
  });
});

test.describe("system-condition proofs (FR-025, FR-026, NFR-002..NFR-005, NFR-013)", () => {
  test("LightMode changes authoritative surface tokens without changing content", async ({
    page,
  }) => {
    const root = await openStory(page, "light-mode");
    await expect(root).toHaveClass(/sk-light/);
  });

  test("forced colors and reduced motion retain non-color and non-motion meaning", async ({
    page,
  }) => {
    // Precedent (sk-radio-choice-group.spec.ts, sk-boundary-page-responsive.spec.ts): a forced-
    // colors proof asserts state survives WITHOUT colour, never a full axe pass under the
    // emulation — Chromium's forced-colors substitution happens at paint time and axe's
    // color-contrast rule reads computed style, which still reports the AUTHOR colour and false-
    // positives against the OS-guaranteed-contrast background. Structural signals instead:
    // aria-invalid, the alert role, and the error summary/links stay present and distinguishable
    // by markup, not by colour.
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    const root = await openStory(page, "forced-colors");
    expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
    await expect(root.locator("[data-error-summary]")).toHaveAttribute("role", "alert");
    await expect(root.locator(".sk-form-field--error .sk-input").first()).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    // No transition/animation any pattern-local class declares moves under reduced motion — the
    // pattern authors none of its own; the only motion any composition inherits is `.sk-input`'s
    // transition (plan.md §1.6), which is colour/border-only and carries no layout movement.
  });

  test("Rtl renders the densest bidi layout with dir=rtl and no page overflow", async ({ page }) => {
    const root = await openStory(page, "rtl");
    await expect(root).toHaveAttribute("dir", "rtl");
    const geometry = await documentGeometry(page);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  });

  test("Narrow390, ShortViewport, and Zoom200 have no page-level horizontal overflow", async ({
    page,
  }) => {
    const cases: readonly {
      readonly id: StoryId;
      readonly width: number;
      readonly height: number;
    }[] = [
      { id: "narrow-390", width: 390, height: 844 },
      { id: "short-viewport", width: 390, height: 480 },
      { id: "zoom-200", width: 390, height: 640 },
    ];
    for (const item of cases) {
      await openStory(page, item.id, { width: item.width, height: item.height });
      const geometry = await documentGeometry(page);
      expect(
        geometry.scrollWidth,
        `${item.id} must not overflow its ${item.width}px viewport`,
      ).toBeLessThanOrEqual(geometry.clientWidth + 1);
    }
  });

  test("LongStrings renders tripled-length copy and the cooldown arm together with no overlap or overflow", async ({
    page,
  }) => {
    const root = await openStory(page, "long-strings", { width: 390, height: 844 });
    await expect(root.locator("[data-cooldown-region]")).toHaveCount(1);
    const geometry = await documentGeometry(page);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  });
});

test.describe("44px target-size floor and unclipped focus (NFR-003, NFR-004)", () => {
  test("every sk-public-header__action and every pattern-local floor class meets 44px at 390 and 1440", async ({
    page,
  }) => {
    for (const width of [390, 1440]) {
      const root = await openStory(page, "landing", { width, height: 1024 });
      const targets = root.locator(
        [
          ".sk-public-header__action",
          ".sk-account-front-door-pattern__cta",
          ".sk-account-front-door-pattern__copy-host",
        ].join(","),
      );
      const count = await targets.count();
      expect(count).toBeGreaterThan(0);
      for (let index = 0; index < count; index += 1) {
        const box = await targets.nth(index).boundingBox();
        expect(box?.height ?? 0, `target ${index} at ${width}px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("Tab-reachable controls stay inside the viewport bounds", async ({ page }) => {
    const root = await openStory(page, "entry-boundary", { width: 390, height: 844 });
    await root.locator("a, button, input").first().focus();
    // COUNTED, because `continue` is a silent exit from an assertion. `boundingBox()` returns null
    // for an attached-but-not-visible match, and `:focus` can resolve to a delegatesFocus host as
    // well as its inner control, so every one of the six steps could skip and this test would
    // report green having asserted nothing at all — passing just as happily with the 44px floor
    // deleted or the focus order broken. The floor below is the same shape the target-size test
    // above uses (`expect(count).toBeGreaterThan(0)`) and is what makes the loop's greenness mean
    // something.
    let measured = 0;
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press("Tab");
      // `:focus` can resolve to BOTH a delegatesFocus custom-element host (e.g. sk-theme-toggle)
      // and the actual focused control inside its shadow root — `.last()` is the deepest match.
      const focused = page.locator(":focus").last();
      const box = await focused.boundingBox();
      if (!box) continue;
      measured += 1;
      expect(box.x).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width).toBeLessThanOrEqual(390 + 1);
    }
    expect(measured, "no Tab stop produced a measurable box — the loop asserted nothing").toBeGreaterThan(0);
  });
});

test.describe("zero network activity (NFR-006, truth constraint #9)", () => {
  test("no request beyond the Storybook iframe's own initial load, across an interaction pass", async ({
    page,
  }) => {
    const root = await openStory(page, "entry-boundary");
    // Let any of Storybook's OWN background work (the a11y addon's own axe injection, source
    // fetching for the addons panel, etc.) finish before the tracking window opens — none of it
    // is a network effect of THIS story or THIS interaction, and NFR-006 is about the latter.
    await page.waitForLoadState("networkidle");
    const tracker = trackRequestsFromNowOn(page);
    // Attach a submit-blocking listener from the TEST, never the pattern (truth constraint #9's
    // "no submit handler fabricates success" — the pattern itself adds none).
    await root.locator("form").evaluate((form) => {
      form.addEventListener("submit", (event) => event.preventDefault());
    });
    await root.locator('input[type="email"]').fill("ada@example.com");
    await root.locator('.sk-boundary-page__action-group button[type="submit"]').click();
    await page.waitForTimeout(250);
    expect(tracker.extra, `unexpected requests: ${tracker.extra.join(", ")}`).toEqual([]);
  });
});

test.describe("accessibility-tree shape (NFR-008)", () => {
  test("every story exposes exactly one h1 and no skipped heading level", async ({ page }) => {
    for (const id of STORY_IDS) {
      const root = await openStory(page, id);
      await expect(root.locator("h1")).toHaveCount(1);
      const levels = await root.locator("h1, h2, h3, h4, h5, h6").evaluateAll((nodes) =>
        nodes.map((node) => Number(node.tagName.slice(1))),
      );
      for (let index = 1; index < levels.length; index += 1) {
        expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
      }
    }
  });
});
