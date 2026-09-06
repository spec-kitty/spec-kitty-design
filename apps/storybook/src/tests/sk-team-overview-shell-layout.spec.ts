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
  await expect(host).toBeVisible();
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
