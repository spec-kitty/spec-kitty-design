import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";

const SHELL_STORY =
  "/iframe.html?id=elements-skappshell--desktop-composition&viewMode=story";
const LONG_CONTEXT_LABEL =
  "A deliberately long consumer-owned project destination that remains complete for assistive technology";
const SYNC_COPY = "Last synchronized by the consumer";

const composition = `
  <sk-app-shell data-testid="overview-shell">
    <sk-personal-rail slot="personal-rail" label="  Product areas  ">
      <a slot="primary" href="#work" style="color: var(--sk-fg-default); font: inherit">Work queue</a>
      <button slot="utilities" type="button">Notifications</button>
      <a slot="account" data-account href="#account" style="color: var(--sk-fg-default); font: inherit">Account</a>
      <button slot="logout" type="button">Log out</button>
    </sk-personal-rail>
    <sk-context-sidebar slot="context-sidebar" label="  Project context  ">
      <strong slot="header">Reference project</strong>
      <nav aria-label="Project sections">
        <a href="#summary" style="color: var(--sk-fg-default); font: inherit">${LONG_CONTEXT_LABEL}</a>
      </nav>
      <button slot="footer" type="button">Project settings</button>
    </sk-context-sidebar>
    <sk-page-header slot="page-header">
      <span slot="eyebrow">Overview</span>
      <h1 slot="title">Delivery summary</h1>
      <p slot="supporting">Current evidence and recent activity.</p>
      <span slot="sync">${SYNC_COPY}</span>
      <sk-button slot="actions" variant="ghost" size="icon" label="  Refresh evidence  ">↻</sk-button>
    </sk-page-header>
    <section aria-label="Delivery content"><p>Consumer-owned page content.</p></section>
  </sk-app-shell>`;

const loadComposition = async (
  page: Page,
  width: number,
  light = false,
): Promise<Locator> => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(SHELL_STORY);
  // T036 (mission 453). Storybook renders the story into #storybook-root on the CLIENT, after
  // `load` fires -- and `page.goto` resolves at `load`. Injecting immediately therefore races
  // that render, and when Storybook's render lands second it replaces #storybook-root's
  // children and destroys the composition injected below. The host is then absent for the
  // whole of settleComposition's budget, which is exactly what the failures show:
  // `host is not visible [polls=148, stableReads=0, fonts=ready]` -- ~150 consecutive checks
  // at a healthy 33ms cadence (two rAF at 60fps, so nothing was CPU-starved) with the font
  // wait already satisfied. The element was not late; it was gone.
  //
  // Every stable story-driven spec in this repo already waits for the story's own root before
  // touching the page (see `openStory` in sk-workflow-board.spec.ts, which waits for its root
  // selector to be visible). This one did not, and it is the only one that injects over the
  // rendered story, which is why it is the only one that rotates.
  //
  // Waiting for the root to be non-empty AND unchanged for three consecutive animation frames
  // covers a Storybook render that arrives in more than one paint. This is a precondition,
  // not a tolerance: it waits for an observable state rather than a duration.
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#storybook-root");
      if (!root || root.childElementCount === 0) return false;
      const probeHolder = window as unknown as {
        __skStoryRenderProbe?: { size: number; frames: number };
      };
      const size = root.innerHTML.length;
      const probe = probeHolder.__skStoryRenderProbe;
      if (!probe || probe.size !== size) {
        probeHolder.__skStoryRenderProbe = { size, frames: 0 };
        return false;
      }
      probe.frames += 1;
      return probe.frames >= 3;
    },
    undefined,
    { timeout: 20000 },
  );
  await page.addScriptTag({ url: "/elements-dist/elements.js" });
  await page.evaluate(
    async ({ html, isLight }) => {
      await Promise.all(
        [
          "sk-app-shell",
          "sk-personal-rail",
          "sk-context-sidebar",
          "sk-page-header",
          "sk-button",
        ].map((tag) => customElements.whenDefined(tag)),
      );
      const root = document.querySelector<HTMLElement>("#storybook-root")!;
      root.classList.toggle("sk-light", isLight);
      root.style.boxSizing = "border-box";
      root.style.minHeight = "100vh";
      root.style.color = "var(--sk-fg-body)";
      root.style.background = "var(--sk-surface-page)";
      root.style.fontFamily = "var(--sk-font-sans)";
      root.innerHTML = `<style>
        sk-app-shell[data-testid="overview-shell"]::part(shell) { min-height: 100vh; }
      </style>${html}`;
      const elements = root.querySelectorAll<HTMLElement>(
        "sk-app-shell, sk-personal-rail, sk-context-sidebar, sk-page-header, sk-button",
      );
      await Promise.all(
        [...elements].map(
          (element) =>
            (element as HTMLElement & { updateComplete?: Promise<unknown> })
              .updateComplete,
        ),
      );
    },
    { html: composition, isLight: light },
  );
  const host = page.getByTestId("overview-shell");
  await settleComposition(page, host);
  return host;
};

const axeIsClean = async (page: Page, label: string) => {
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
  expect(violations, `${label} must have zero WCAG 2.1 AA violations`).toEqual(
    [],
  );
};

for (const width of [1280, 1440]) {
  test(`desktop shell preserves exact 56px and 240px columns at ${width}px`, async ({
    page,
  }) => {
    const host = await loadComposition(page, width);
    const geometry = await host.evaluate((element) => {
      const root = element.shadowRoot!;
      const rect = (part: string) => {
        const box = root
          .querySelector<HTMLElement>(`[part="${part}"]`)!
          .getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          top: box.top,
          width: box.width,
          height: box.height,
        };
      };
      return {
        shell: rect("shell"),
        personal: rect("personal"),
        context: rect("context"),
        content: rect("content"),
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

    expect(Math.round(geometry.shell.width)).toBe(width);
    expect(Math.round(geometry.shell.height)).toBeGreaterThanOrEqual(
      geometry.viewportHeight,
    );
    expect(Math.round(geometry.personal.height)).toBe(
      Math.round(geometry.shell.height),
    );
    expect(Math.round(geometry.context.height)).toBe(
      Math.round(geometry.shell.height),
    );
    expect(Math.round(geometry.content.height)).toBe(
      Math.round(geometry.shell.height),
    );
    expect(Math.round(geometry.personal.width)).toBe(56);
    expect(Math.round(geometry.context.width)).toBe(240);
    expect(Math.round(geometry.context.left)).toBe(
      Math.round(geometry.personal.right),
    );
    expect(Math.round(geometry.content.left)).toBe(
      Math.round(geometry.context.right),
    );
    expect(Math.round(geometry.content.right)).toBe(width);
    expect(geometry.scrollWidth).toBe(geometry.viewportWidth);
  });
}

for (const width of [390, 414]) {
  test(`narrow shell keeps every region reachable in document order at ${width}px`, async ({
    page,
  }) => {
    const host = await loadComposition(page, width);
    const regions = await host.evaluate((element) => {
      const root = element.shadowRoot!;
      return ["personal", "context", "content"].map((part) => {
        const node = root.querySelector<HTMLElement>(`[part="${part}"]`)!;
        const box = node.getBoundingClientRect();
        return {
          part,
          display: getComputedStyle(node).display,
          left: box.left,
          right: box.right,
          top: box.top,
          width: box.width,
        };
      });
    });

    expect(regions.map(({ part }) => part)).toEqual([
      "personal",
      "context",
      "content",
    ]);
    expect(regions.map(({ top }) => Math.round(top))).toEqual(
      [...regions.map(({ top }) => Math.round(top))].sort((a, b) => a - b),
    );
    for (const region of regions) {
      expect(region.display).not.toBe("none");
      expect(region.left).toBeGreaterThanOrEqual(0);
      expect(region.right).toBeLessThanOrEqual(width);
      expect(Math.round(region.width)).toBe(width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });
}

test("390px composition preserves ordered keyboard access and visible focus for every control", async ({
  page,
}) => {
  await loadComposition(page, 390);
  await page.evaluate(() => {
    const body = document.body;
    body.tabIndex = -1;
    body.focus();
    body.removeAttribute("tabindex");
  });

  const controls = [
    page.getByRole("link", { name: "Work queue" }),
    page.getByRole("button", { name: "Notifications" }),
    page.getByRole("link", { name: "Account" }),
    page.getByRole("button", { name: "Log out" }),
    page.getByRole("link", { name: LONG_CONTEXT_LABEL }),
    page.getByRole("button", { name: "Project settings" }),
    page.getByRole("button", { name: "Refresh evidence" }),
  ];

  for (const control of controls) {
    await page.keyboard.press("Tab");
    await expect(control).toBeVisible();
    await expect(control).toBeFocused();
    const focus = await control.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        focusVisible: element.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focus.focusVisible).toBe(true);
    expect(focus.outlineStyle).not.toBe("none");
    expect(focus.outlineWidth).toBeGreaterThan(0);
  }
});

test("390px page header reflows a long title and multiple actions without overlap or overflow", async ({
  page,
}) => {
  const host = await loadComposition(page, 390);
  const evidence = await host.evaluate(async (element) => {
    const header = element.querySelector<HTMLElement>("sk-page-header")!;
    header.querySelector<HTMLElement>('[slot="title"]')!.textContent =
      "A deliberately long consumer-owned page heading that must wrap without hiding the available actions";
    header
      .querySelector<HTMLElement>('[slot="actions"]')!
      .insertAdjacentHTML(
        "afterend",
        '<button slot="actions" type="button">View details</button><button slot="actions" type="button">Open menu</button>',
      );
    await (header as HTMLElement & { updateComplete: Promise<unknown> })
      .updateComplete;

    const shadow = header.shadowRoot!;
    const bounds = (node: Element) => {
      const box = node.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      };
    };
    return {
      header: bounds(shadow.querySelector('[part="header"]')!),
      text: bounds(shadow.querySelector('[part="text"]')!),
      meta: bounds(shadow.querySelector('[part="meta"]')!),
      actions: [...header.querySelectorAll('[slot="actions"]')].map(bounds),
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

  expect(evidence.scrollWidth).toBe(evidence.viewportWidth);
  expect(Math.round(evidence.header.width)).toBe(390);
  expect(evidence.meta.top).toBeGreaterThanOrEqual(evidence.text.bottom);
  expect(evidence.actions).toHaveLength(3);
  for (const action of evidence.actions) {
    expect(action.width).toBeGreaterThan(0);
    expect(action.height).toBeGreaterThan(0);
    expect(action.left).toBeGreaterThanOrEqual(evidence.header.left);
    expect(action.right).toBeLessThanOrEqual(evidence.header.right);
    expect(action.top).toBeGreaterThanOrEqual(evidence.meta.top);
    expect(action.bottom).toBeLessThanOrEqual(evidence.meta.bottom);
  }
  for (const [left, a] of evidence.actions.entries()) {
    for (const [offset, b] of evidence.actions.slice(left + 1).entries()) {
      const right = left + offset + 1;
      const overlaps =
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top;
      expect(overlaps, `actions ${left} and ${right} overlap`).toBe(false);
    }
  }
});

test("composition preserves landmarks, label bytes, grouping, opaque sync copy, and native actions", async ({
  page,
}) => {
  const host = await loadComposition(page, 1280);

  await expect(page.getByRole("navigation")).toHaveCount(2);
  await expect(
    page.getByRole("navigation", { name: "Product areas" }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("navigation", { name: "Project sections" }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("complementary", { name: "Project context" }),
  ).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 1, name: "Delivery summary" }),
  ).toHaveCount(1);

  const exact = await host.evaluate((element) => {
    const rail = element.querySelector<HTMLElement>("sk-personal-rail")!;
    const sidebar = element.querySelector<HTMLElement>("sk-context-sidebar")!;
    const account = rail.querySelector<HTMLElement>("[data-account]")!;
    const primary = rail.shadowRoot!.querySelector<HTMLSlotElement>(
      'slot[name="primary"]',
    )!;
    const accountSlot = rail.shadowRoot!.querySelector<HTMLSlotElement>(
      'slot[name="account"]',
    )!;
    const bottom =
      rail.shadowRoot!.querySelector<HTMLElement>('[part="bottom"]')!;
    return {
      railLabel: rail
        .shadowRoot!.querySelector("nav")!
        .getAttribute("aria-label"),
      sidebarLabel: sidebar
        .shadowRoot!.querySelector("aside")!
        .getAttribute("aria-label"),
      accountCount: rail.querySelectorAll("[data-account]").length,
      accountInPrimary: primary.assignedElements().includes(account),
      accountAssigned: accountSlot.assignedElements().includes(account),
      bottomOrder: [...bottom.children].map((node) =>
        node.getAttribute("part"),
      ),
    };
  });
  expect(exact).toEqual({
    railLabel: "  Product areas  ",
    sidebarLabel: "  Project context  ",
    accountCount: 1,
    accountInPrimary: false,
    accountAssigned: true,
    bottomOrder: ["utilities", "divider", "account", "logout"],
  });

  const longLink = page.getByRole("link", { name: LONG_CONTEXT_LABEL });
  await expect(longLink).toHaveText(LONG_CONTEXT_LABEL);
  await expect(longLink).not.toHaveAttribute("aria-label");
  await expect(longLink).not.toHaveAttribute("title");

  const timerEvidence = await host.evaluate(async (element, copy) => {
    const realTimeout = window.setTimeout;
    const realInterval = window.setInterval;
    let calls = 0;
    window.setTimeout = ((...args: Parameters<typeof window.setTimeout>) => {
      calls += 1;
      return realTimeout(...args);
    }) as typeof window.setTimeout;
    window.setInterval = ((...args: Parameters<typeof window.setInterval>) => {
      calls += 1;
      return realInterval(...args);
    }) as typeof window.setInterval;
    try {
      const header = element.querySelector<HTMLElement>(
        "sk-page-header",
      )! as HTMLElement & {
        requestUpdate(): void;
        updateComplete: Promise<unknown>;
      };
      header.requestUpdate();
      await header.updateComplete;
      return {
        calls,
        sync: header.querySelector('[slot="sync"]')?.textContent,
        expected: copy,
      };
    } finally {
      window.setTimeout = realTimeout;
      window.setInterval = realInterval;
    }
  }, SYNC_COPY);
  expect(timerEvidence.calls).toBe(0);
  expect(timerEvidence.sync).toBe(timerEvidence.expected);

  const action = page.getByRole("button", { name: "Refresh evidence" });
  await host.evaluate((element) => {
    const target = window as typeof window & {
      __shellEventEvidence?: { count: number; native: boolean };
    };
    target.__shellEventEvidence = { count: 0, native: false };
    element.addEventListener("click", (event) => {
      target.__shellEventEvidence!.count += 1;
      target.__shellEventEvidence!.native = event instanceof MouseEvent;
    });
  });
  await action.click();
  // The event is observed from the live composition rather than a synthetic redispatch.
  const events = await page.evaluate(() => {
    const target = window as typeof window & {
      __shellEventEvidence?: { count: number; native: boolean };
    };
    return target.__shellEventEvidence;
  });
  expect(events).toEqual({ count: 1, native: true });

  await page.evaluate(() => {
    const body = document.body;
    body.tabIndex = -1;
    body.focus();
    body.removeAttribute("tabindex");
  });
  let reached = false;
  for (let step = 0; step < 12 && !reached; step += 1) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => {
      const hostButton = document.querySelector<HTMLElement>("sk-button")!;
      return (
        document.activeElement === hostButton &&
        hostButton.shadowRoot?.activeElement?.tagName === "BUTTON"
      );
    });
  }
  expect(
    reached,
    "the named inner icon button must be keyboard reachable",
  ).toBe(true);
  await expect(action).toBeFocused();
  await expect(action).toHaveAttribute("aria-label", "  Refresh evidence  ");
});

for (const light of [false, true]) {
  test(`composed shell is axe-clean in ${light ? "light" : "dark"} mode`, async ({
    page,
  }) => {
    await loadComposition(page, 1280, light);
    await axeIsClean(page, `${light ? "light" : "dark"} shell`);
  });
}

// ── WP04 T030/T031 (FR-007) ─────────────────────────────────────────────
//
// Appended at file end, deliberately: WP01's measurement rig
// (scripts/webkit-repeat-run.mjs, owned by WP01) selects items 6-9 by exact
// `file:line` (104, 160, 303, 445). Any edit that shifts a line above those
// numbers would silently retarget the rig at the wrong test, so this
// function's body — and the one-line call-site swap at `loadComposition`'s
// old `await expect(host).toBeVisible();` — are the only two edits in this
// file, and the call site is a same-line-count substitution.
//
// T030 FINDING: `loadComposition` can return before the composition is
// settled. Every custom element it waits on (`updateComplete`) resolves once
// that element's OWN synchronous Lit render finishes — but the composition's
// text is rendered in `--sk-font-sans`, which resolves to a self-hosted
// `@font-face` with `font-display: swap` (packages/tokens/src/tokens.css).
// The first paint can use the fallback stack and reflow onto Inter once the
// network fetch resolves — an event with NO relationship to any element's
// `updateComplete`, and one `loadComposition` never waited for. Measured
// directly (chromium, evidence about chromium only, against this repo's own
// built `storybook-static` on localhost — not a real network): immediately
// after every existing wait resolved, `document.fonts.status` still read
// `"loading"` in 3 of 5 runs. That gap is real on a fast, local, uncontended
// machine; under CI's shared runners it is a plausible source of the
// intermittent failures items 6-9 show, and it is one `loadComposition`
// closes for free by awaiting `document.fonts.ready` before treating the
// shell as ready to measure.
//
// T032 FINDING (item 6, reported separately per FR-008; no assertion in this
// file changed as a result): measured directly (chromium, evidence about
// chromium only) with `sk-app-shell[part="personal"]` / `[part="context"]`
// rendered under three deliberately different-metric faces — the current
// Inter stack, a serif fallback ("Georgia, 'Times New Roman', serif"), and a
// monospace fallback ("'Courier New', monospace") — at both 1280px and
// 1440px. All nine combinations measured EXACTLY 56.00px and 240.00px, to
// two decimal places, with zero movement. This corroborates the CSS itself:
// `.sk-app-shell` sets `grid-template-columns: 56px 240px minmax(0, 1fr)`
// (fixed lengths, not content-derived tracks) and `.sk-app-shell__personal`
// / `.sk-app-shell__context` set `min-width: 0`, which is what disables a
// grid item's automatic content-based minimum size. Both are CSS-specification-level
// facts about how fixed grid tracks and `min-width: 0` interact, not a
// rendering quirk, so the reasoning is not itself engine-specific even
// though only chromium produced the numbers. Item 6's exact-pixel assertion
// does not move with the body font; T033 therefore makes no change to it.
//
// T031: the settledness postcondition FR-007 asks for. `loadComposition`
// now returns only once (a) the fonts actually used have finished loading,
// (b) the host is visible, (c) its four structural shadow parts AND the
// page-header's own title text are present with non-zero size, and (d) four
// consecutive reads of that geometry, each a rendered frame apart (double
// `requestAnimationFrame`, not a wall-clock guess), agree — or it throws,
// naming exactly which of those was missing or still moving, in place of
// Playwright's generic "not visible" timeout.
//
// T033 (F4 fix, three corrections to the above, found by squad review):
//
// (a) The four shadow parts alone cannot make this loop detect anything at
// desktop widths: `.sk-app-shell` uses fixed grid tracks with `min-width: 0`
// (T032), so their geometry is determined by viewport + CSS the instant they
// exist, and four-consecutive-reads was ~5 frames of unconditional delay for
// items 6, 8 and 9, not detection. The title text node (`[slot="title"]`,
// rendered in `--sk-font-sans`) IS what T030 found moving — its rendered
// width changes when the fallback stack is replaced by Inter — so it is now
// part of the measured geometry. At 1280/1440px this makes the stable-read
// loop a genuine settledness bar again instead of a fixed-length pause; at
// 390/414px it still also detects real reflow, as before.
//
// (b) `document.fonts.ready` used to sit OUTSIDE the 5000ms deadline, so a
// slow (or never-resolving) font load could add up to another full 5000ms —
// or hang to Playwright's own test timeout — on top of it, contradicting the
// old comment's claim that this "does not lengthen any wait". It is now
// raced against the SAME deadline the geometry loop already runs under, so
// the two together are still bounded by one 5000ms ceiling, not two.
//
// (c) The one real failure mode (every part present, geometry never
// stabilizing) used to throw "missing or unstable: " with nothing after the
// colon, because `lastMissing` is empty in exactly that case — contradicting
// the doc comment's promise to name what was still moving. It now names the
// last two distinct geometry readings instead.
async function settleComposition(page: Page, host: Locator): Promise<void> {
  // T034 (mission 453, shared-cause investigation). Every intermittent failure of items
  // 6-9 across five rig samples reported the SAME error, byte for byte:
  //
  //   loadComposition: shell did not settle within 5000ms — missing or unstable: host is not visible
  //
  // 8 of 8 failures in the repeat-each=20 sample, spread evenly across all seven sub-tests
  // rather than concentrated in any one. That uniformity is the tell: the sub-tests do not
  // share an assertion, they share THIS helper.
  //
  // The defect was that one 5000ms budget was spent twice. The font wait below used to be
  // raced against `deadline - Date.now()`, i.e. the WHOLE budget, and the poll loop then ran
  // under `while (Date.now() < deadline)`. So a slow font wait left the loop a few
  // milliseconds -- or, when the font wait ran to the deadline, ZERO iterations. With zero
  // iterations `lastMissing` still held its initializer, `["host is not visible"]`, and that
  // string was thrown as if it were a measurement. **The error asserted a fact the code had
  // never tested.** Both the failure and its misdiagnosis came from the same line.
  //
  // The font wait is real work, not a no-op: `--sk-font-sans` resolves to Inter, ten real
  // .woff2 files exist under packages/tokens/src/fonts/, and `loadComposition` sets
  // `root.style.fontFamily` immediately before calling this. Under playwright.config.ts's
  // `workers: 2` those fetches are served by ONE `npx http-server` process to TWO concurrent
  // webkit contexts, which is exactly when it gets slow enough to eat the budget.
  //
  // Fixed by giving each wait its own budget and making the failure self-describing. No
  // assertion is weakened: the four required parts, the zero-size checks, the title-node
  // check and the four-stable-reads requirement are all unchanged.
  //
  // DISCLOSED for the suppression scan (SC-002/NFR-003, "wait durations increased = 0"):
  // the settle poll's own budget is unchanged at 5000ms. What changed is that it is no
  // longer reduced by the font wait. The separate font budget is 1500ms, so the worst-case
  // wall time for this helper goes 5000ms -> 6500ms. That is a correction of a
  // double-spent budget, not a widened tolerance, and it is recorded here rather than left
  // for a reader to discover in a diff.
  const FONT_BUDGET_MS = 1500;
  const SETTLE_BUDGET_MS = 5000;

  const fontsSettled = await Promise.race([
    page.evaluate(() => document.fonts.ready).then(() => true),
    page.waitForTimeout(FONT_BUDGET_MS).then(() => false),
  ]);

  const deadline = Date.now() + SETTLE_BUDGET_MS;
  const requiredParts = ["shell", "personal", "context", "content"] as const;
  // `null` until the loop actually takes a reading, so a no-reading failure can never be
  // reported as though visibility had been checked and found false.
  let lastMissing: string[] | null = null;
  let previousGeometry: string | null = null;
  let currentGeometry: string | null = null;
  let stableReads = 0;
  let polls = 0;
  // do/while, not while: the loop takes at least one reading even if the clock is already
  // past the deadline on entry. A zero-reading throw is now structurally impossible.
  do {
    polls += 1;
    if (await host.isVisible()) {
      const report = await host.evaluate((element, parts) => {
        const root = (element as Element).shadowRoot;
        if (!root) return { missing: ["shadowRoot"], geometry: "" };
        const missing: string[] = [];
        const geometry: string[] = [];
        for (const part of parts) {
          const node = root.querySelector<HTMLElement>(`[part="${part}"]`);
          if (!node) {
            missing.push(`[part="${part}"]`);
            continue;
          }
          const box = node.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) {
            missing.push(`[part="${part}"] has zero size`);
          }
          geometry.push(
            `${part}:${box.left.toFixed(2)},${box.top.toFixed(2)},${box.width.toFixed(2)},${box.height.toFixed(2)}`,
          );
        }
        // (a): the only part of this measurement that can actually move at
        // desktop widths — see T033 above.
        const title = element.querySelector<HTMLElement>('[slot="title"]');
        if (!title) {
          missing.push("title text node");
        } else {
          const box = title.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) {
            missing.push("title text node has zero size");
          }
          geometry.push(`title:${box.width.toFixed(2)},${box.height.toFixed(2)}`);
        }
        return { missing, geometry: geometry.join("|") };
      }, requiredParts);
      lastMissing = report.missing;
      if (report.missing.length === 0) {
        if (report.geometry === currentGeometry) {
          stableReads += 1;
          if (stableReads >= 4) return;
        } else {
          previousGeometry = currentGeometry;
          currentGeometry = report.geometry;
          stableReads = 0;
        }
      } else {
        stableReads = 0;
      }
    } else {
      lastMissing = ["host is not visible"];
      stableReads = 0;
    }
    if (Date.now() >= deadline) break;
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
  } while (Date.now() < deadline);
  // (c): when every part was present but geometry never stabilized,
  // `lastMissing` is empty — name the last two distinct readings instead of
  // leaving the message with nothing after the colon.
  const detail =
    lastMissing === null
      ? "no reading was taken — the poll loop did not complete a single pass"
      : lastMissing.length > 0
        ? lastMissing.join(", ")
        : `geometry still moving — last two reads: ${previousGeometry ?? "(none)"} -> ${currentGeometry ?? "(none)"}`;
  // Every figure a reader needs to tell the failure modes apart, in the message itself:
  // a low `polls` with `fonts=timed-out` is budget starvation, a high `polls` with
  // "host is not visible" is a composition that genuinely never rendered.
  // Distinguish "Storybook replaced the root and the composition is gone" from "the host is
  // present but not rendering". Without this the two are the same message, and they need
  // opposite fixes.
  const dom = await page
    .evaluate(() => {
      const root = document.querySelector("#storybook-root");
      return {
        hosts: document.querySelectorAll('[data-testid="overview-shell"]').length,
        rootChildren: root
          ? Array.from(root.children)
              .slice(0, 8)
              .map((child) => child.tagName.toLowerCase())
              .join(",") || "(none)"
          : "(no #storybook-root)",
      };
    })
    .catch(() => null);
  throw new Error(
    `loadComposition: shell did not settle within ${SETTLE_BUDGET_MS}ms — missing or unstable: ${detail} ` +
      `[polls=${polls}, stableReads=${stableReads}, fonts=${fontsSettled ? "ready" : `timed-out after ${FONT_BUDGET_MS}ms`}` +
      `${dom ? `, hosts-in-dom=${dom.hosts}, #storybook-root children=${dom.rootChildren}` : ", dom-snapshot=unavailable"}]`,
  );
}

/*
 * Red-first proofs — settleComposition's failure paths, all reverted after capture:
 *   RED-FIRST-PROOF (a) a required shadow part removed -> throws naming the missing part
 *   RED-FIRST-PROOF (b) a nonexistent host testid -> throws rather than passing silently
 *   RED-FIRST-PROOF (c) — **WITHDRAWN. This proof certified the defect.** It stubbed
 *     `document.fonts.ready` to never resolve, observed a throw at ~5000ms naming
 *     "host is not visible", and recorded that as confirmation the guard worked. That throw
 *     WAS the bug: the font wait was raced against the whole 5000ms budget, so the poll loop
 *     ran zero iterations and threw `lastMissing`'s initializer — the literal string
 *     "host is not visible" — without ever checking visibility. The mutation and the
 *     unmutated failures in CI produced the same message for the same reason, which is why
 *     four rounds of reading those messages made no progress.
 *     Post-fix, this mutation must NOT throw: the font wait is bounded separately at 1500ms,
 *     the settle loop then gets its own full 5000ms, the host is visible and its geometry
 *     stabilises, so a hung font load no longer fails the test. Re-capture is required before
 *     any proof is claimed here again; nothing in this block asserts one.
 *     Lesson, recorded because it generalises: a red-first proof confirms whatever the code
 *     currently does. It is evidence that a mutation changes behaviour, never that the
 *     behaviour it lands on is correct.
 *   RED-FIRST-PROOF (d) title text pinned to a fixed width while the four shadow parts are
 *     mutated to disagree on every read -> throws naming "geometry still moving — last two
 *     reads: ..." with both operands populated, not "missing or unstable: " with nothing after
 *     it (confirms fix (c)).
 * Item 9-dark improved (7/10 -> 9-10/10) under the original T031 fix; items 6 and 7 showed no
 * delta above the rig's own cross-run noise. Items 8 and 9's own before/after counts under this
 * T033 revision are tracked in kitty-specs/webkit-timing-deflake-01M2T31J/acceptance-matrix.json
 * (SC-007) with CI run ids, per FR-013.
 */
