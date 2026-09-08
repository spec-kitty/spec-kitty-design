import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const fixtureRoot = "packages/styles/src/event-timeline";
const tokensCss = readFileSync("packages/tokens/src/tokens.css", "utf8");

function fixtureHtml(name: string): string {
  return readFileSync(`${fixtureRoot}/${name}`, "utf8");
}

async function mountFixture(page: Page, name: string): Promise<Locator> {
  const timelineCss = readFileSync(
    `${fixtureRoot}/sk-event-timeline.css`,
    "utf8",
  );
  await page.setContent(`<style>${tokensCss}\n${timelineCss}</style>${fixtureHtml(name)}`);
  const root = page.locator("ol.sk-event-timeline");
  await expect(root).toBeVisible();
  return root;
}

test.describe("compact event timeline accessibility", () => {
  test("leading markers never contribute to the supplied event name", async ({
    page,
  }) => {
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-leading-marker.html",
    );
    const item = root.locator(":scope > li.sk-event-timeline__item").first();
    const snapshot = await item.ariaSnapshot();

    expect(snapshot).toContain("1. Evidence received");
    expect(snapshot).not.toContain("Decorative milestone");
  });
});

test.describe("compact event timeline native interaction", () => {
  test("only a supplied native link adds a tab stop", async ({ page }) => {
    let root = await mountFixture(
      page,
      "sk-event-timeline-compact-one-event.html",
    );
    await expect(
      root.locator("a, button, input, select, textarea, [tabindex]"),
    ).toHaveCount(0);

    root = await mountFixture(page, "sk-event-timeline-compact-linked.html");
    const tabbable = root.locator(
      "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    await expect(tabbable).toHaveCount(1);
    await expect(tabbable).toHaveAttribute("href", "#linked-event");
    await expect(tabbable).not.toHaveAttribute("onclick");
    await page.keyboard.press("Tab");
    await expect(tabbable).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(
      "#linked-event",
    );
  });
});

test.describe("compact event timeline marker geometry", () => {
  test("a supplied leading marker replaces only its own pseudo-marker and anchors the connector", async ({
    page,
  }) => {
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-leading-marker.html",
    );
    const items = root.locator(":scope > li.sk-event-timeline__item");
    const markerItem = items.first();
    const unmarkedItem = items.nth(1);

    const [markerPseudo, unmarkedPseudo] = await Promise.all([
      markerItem.evaluate(
        (node) => getComputedStyle(node, "::before").display,
      ),
      unmarkedItem.evaluate(
        (node) => getComputedStyle(node, "::before").display,
      ),
    ]);
    expect(markerPseudo).toBe("none");
    expect(unmarkedPseudo).not.toBe("none");

    const connectorAlignment = await markerItem.evaluate((node) => {
      const marker = node.querySelector<HTMLElement>(
        ".sk-event-timeline__leading-marker",
      )!;
      const itemBox = node.getBoundingClientRect();
      const markerBox = marker.getBoundingClientRect();
      return {
        connectorStart: Number.parseFloat(
          getComputedStyle(node, "::after").insetInlineStart,
        ),
        markerCenter: markerBox.left - itemBox.left + markerBox.width / 2,
      };
    });
    expect(connectorAlignment.connectorStart).toBeCloseTo(
      connectorAlignment.markerCenter,
      0,
    );
  });
});

async function documentWidth(page: Page) {
  return page.evaluate(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    return { client: scroller.clientWidth, scroll: scroller.scrollWidth };
  });
}

async function expectTimesInsideItems(root: Locator) {
  const geometry = await root
    .locator(":scope > li.sk-event-timeline__item")
    .evaluateAll((items) =>
      items.map((item) => {
        const itemBox = item.getBoundingClientRect();
        const timeBox = item.querySelector("time")!.getBoundingClientRect();
        return { itemBox, timeBox };
      }),
    );
  for (const { itemBox, timeBox } of geometry) {
    expect(timeBox.left).toBeGreaterThanOrEqual(itemBox.left);
    expect(timeBox.right).toBeLessThanOrEqual(itemBox.right + 1);
    expect(timeBox.top).toBeGreaterThanOrEqual(itemBox.top);
    expect(timeBox.bottom).toBeLessThanOrEqual(itemBox.bottom + 1);
  }
}

test.describe("compact event timeline density and resilience", () => {
  test("the compact modifier reduces measure, type, and item spacing", async ({
    page,
  }) => {
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-default.html",
    );
    const item = root.locator(":scope > li.sk-event-timeline__item").first();
    const compact = await root.evaluate((node) => {
      const rootStyle = getComputedStyle(node);
      const itemStyle = getComputedStyle(
        node.querySelector(".sk-event-timeline__item")!,
      );
      return {
        maxInlineSize: Number.parseFloat(rootStyle.maxInlineSize),
        fontSize: Number.parseFloat(rootStyle.fontSize),
        paddingBlockEnd: Number.parseFloat(itemStyle.paddingBlockEnd),
        paddingInlineStart: Number.parseFloat(itemStyle.paddingInlineStart),
      };
    });
    await root.evaluate((node) =>
      node.classList.remove("sk-event-timeline--compact"),
    );
    const regular = await root.evaluate((node) => {
      const rootStyle = getComputedStyle(node);
      const itemStyle = getComputedStyle(
        node.querySelector(".sk-event-timeline__item")!,
      );
      return {
        maxInlineSize: Number.parseFloat(rootStyle.maxInlineSize),
        fontSize: Number.parseFloat(rootStyle.fontSize),
        paddingBlockEnd: Number.parseFloat(itemStyle.paddingBlockEnd),
        paddingInlineStart: Number.parseFloat(itemStyle.paddingInlineStart),
      };
    });
    await root.evaluate((node) =>
      node.classList.add("sk-event-timeline--compact"),
    );

    expect(compact.maxInlineSize).toBeLessThan(regular.maxInlineSize);
    expect(compact.fontSize).toBeLessThan(regular.fontSize);
    expect(compact.paddingBlockEnd).toBeLessThan(regular.paddingBlockEnd);
    expect(compact.paddingInlineStart).toBeLessThan(
      regular.paddingInlineStart,
    );
    await expect(item).toBeVisible();
  });

  for (const [name, width] of [
    ["sk-event-timeline-compact-long-content.html", 320],
    ["sk-event-timeline-compact-narrow.html", 320],
    ["sk-event-timeline-compact-default.html", 1024],
  ] as const) {
    test(`${name} remains contained at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      const root = await mountFixture(page, name);
      await expectTimesInsideItems(root);
      expect(await documentWidth(page)).toEqual({ client: width, scroll: width });
    });
  }

  test("long values remain contained at 320px and 200% zoom", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-long-content.html",
    );
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await expectTimesInsideItems(root);
    const width = await documentWidth(page);
    expect(width.scroll).toBeLessThanOrEqual(width.client);
  });

  for (const condition of [
    { width: 320, zoom: false },
    { width: 1024, zoom: false },
    { width: 320, zoom: true },
  ]) {
    test(`native focus stays visible at ${condition.width}px${condition.zoom ? " and 200% zoom" : ""}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: condition.width, height: 720 });
      await mountFixture(page, "sk-event-timeline-compact-linked.html");
      if (condition.zoom) {
        await page.evaluate(() => {
          document.documentElement.style.zoom = "2";
        });
      }
      const anchor = page.locator('a[href="#linked-event"]');
      await anchor.focus();
      await expect(anchor).toBeFocused();
      const geometry = await anchor.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const outline = Number.parseFloat(style.outlineWidth) || 0;
        const offset = Math.abs(Number.parseFloat(style.outlineOffset) || 0);
        const scroller = document.scrollingElement ?? document.documentElement;
        return {
          left: box.left - outline - offset,
          right: box.right + outline + offset,
          viewport: scroller.clientWidth,
        };
      });
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
    });
  }
});

test.describe("compact event timeline supplied truth and preferences", () => {
  test("twenty native list items retain supplied source order and time", async ({
    page,
  }) => {
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-twenty-events.html",
    );
    const contract = await root.evaluate((node) => {
      const items = [...node.children] as HTMLElement[];
      return {
        rootTag: node.tagName,
        rootRole: node.getAttribute("role"),
        childTags: items.map((item) => item.tagName),
        summaries: items.map(
          (item) =>
            item.querySelector(".sk-event-timeline__summary")?.textContent?.trim(),
        ),
        datetimes: items.map((item) =>
          item.querySelector("time")?.getAttribute("datetime"),
        ),
        orders: items.map((item) => getComputedStyle(item).order),
        counterResets: items.map((item) => getComputedStyle(item).counterReset),
      };
    });

    expect(contract.rootTag).toBe("OL");
    expect(contract.rootRole).toBeNull();
    expect(contract.childTags).toEqual(Array(20).fill("LI"));
    expect(contract.summaries).toEqual(
      Array.from({ length: 20 }, (_, index) =>
        `${index + 1}. Transition recorded`,
      ),
    );
    expect(contract.datetimes).toEqual(
      Array.from(
        { length: 20 },
        (_, index) =>
          `2026-09-08T08:${String(index + 1).padStart(2, "0")}:00Z`,
      ),
    );
    expect(new Set(contract.orders)).toEqual(new Set(["0"]));
    expect(new Set(contract.counterResets)).toEqual(new Set(["none"]));
  });

  test("consumer-muted presentation changes no supplied truth and never announces", async ({
    page,
  }) => {
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-degraded.html",
    );
    const suppliedTruth = async () =>
      root.evaluate((node) => ({
        text: node.textContent,
        summaries: [...node.querySelectorAll(".sk-event-timeline__summary")].map(
          (summary) => summary.textContent,
        ),
        times: [...node.querySelectorAll("time")].map((time) => ({
          datetime: time.getAttribute("datetime"),
          text: time.textContent,
        })),
      }));
    const degraded = await suppliedTruth();
    await root.evaluate((node) => node.removeAttribute("style"));
    expect(await suppliedTruth()).toEqual(degraded);
    await expect(root.locator('[aria-live], [role="status"], [role="alert"]')).toHaveCount(
      0,
    );
  });

  test("forced colors preserve marker, connector, and native focus boundaries", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-forced-colors.html",
    );
    const firstItem = root.locator(":scope > li").first();
    const marker = firstItem.locator(".sk-event-timeline__leading-marker");
    const boundary = await firstItem.evaluate((node) => ({
      connectorWidth: Number.parseFloat(
        getComputedStyle(node, "::after").inlineSize,
      ),
      connectorColor: getComputedStyle(node, "::after").backgroundColor,
    }));
    await expect(marker).toHaveCSS("border-top-style", "solid");
    expect(boundary.connectorWidth).toBeGreaterThan(0);
    expect(boundary.connectorColor).not.toBe("rgba(0, 0, 0, 0)");

    const anchor = root.locator('a[href="#forced-colors-destination"]');
    await anchor.focus();
    await expect(anchor).toBeFocused();
    const outline = await anchor.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThan(0);
  });

  test("the compact fixture responds to the documented light wrapper", async ({
    page,
  }) => {
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-default.html",
    );
    const defaultColor = await root.evaluate((node) => getComputedStyle(node).color);
    await root.evaluate((node) => node.classList.add("sk-light"));
    const lightColor = await root.evaluate((node) => getComputedStyle(node).color);
    expect(lightColor).not.toBe(defaultColor);
  });
});
