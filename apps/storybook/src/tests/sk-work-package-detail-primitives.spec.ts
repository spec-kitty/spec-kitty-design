import { expect, test, type Locator, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

const storyPrefixes = {
  breadcrumbs: "primitives-skbreadcrumbs-html",
  prose: "primitives-skprose-html",
  timeline: "primitives-skeventtimeline-html",
} as const;

async function openStory(
  page: Page,
  prefix: string,
  id: string,
  selector: string,
): Promise<Locator> {
  await page.goto(`/iframe.html?id=${prefix}--${id}&viewMode=story`);
  const root = page.locator(selector).first();
  await root.waitFor({ state: "visible", timeout: 20_000 });
  return root;
}

async function openCheckBulletStory(
  page: Page,
  id: string,
  viewport: { width: number; height: number } = { width: 720, height: 720 },
): Promise<Locator> {
  await page.setViewportSize(viewport);
  await page.goto(`/iframe.html?id=elements-skcheckbullet--${id}&viewMode=story`);
  await page.evaluate(() => customElements.whenDefined("sk-check-bullet"));
  const root = page.locator("#storybook-root");
  await root.waitFor({ state: "visible", timeout: 20_000 });
  return root;
}

async function documentGeometry(page: Page) {
  return page.evaluate(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    return {
      clientWidth: scroller.clientWidth,
      scrollWidth: scroller.scrollWidth,
    };
  });
}

test.describe("work package detail source and distribution boundaries", () => {
  test("the three surfaces stay styles-only and publish generated markup exports", () => {
    const names = ["breadcrumbs", "prose", "event-timeline"] as const;
    const packageJson = JSON.parse(
      readFileSync("packages/styles/package.json", "utf8"),
    ) as {
      exports: Record<string, unknown>;
    };
    const rootIndex = readFileSync("packages/styles/src/index.ts", "utf8");

    for (const name of names) {
      expect(existsSync(`packages/styles/src/${name}/sk-${name}.css`)).toBe(
        true,
      );
      expect(existsSync(`packages/styles/src/${name}/index.ts`)).toBe(true);
      expect(existsSync(`packages/elements/src/${name}`)).toBe(false);
      expect(packageJson.exports[`./${name}/*`]).toBe(`./dist/${name}/*`);
      expect(rootIndex).toContain(`export * from './${name}/index';`);
    }
  });
});

test.describe("breadcrumbs native semantics and containment", () => {
  for (const [id, count] of [
    ["one-level", 1],
    ["three-level", 3],
    ["six-level", 6],
  ] as const) {
    test(`${id} preserves list depth and one current link`, async ({
      page,
    }) => {
      const root = await openStory(
        page,
        storyPrefixes.breadcrumbs,
        id,
        ".sk-breadcrumbs",
      );
      await expect(root).toHaveRole("navigation", { name: "Breadcrumb" });
      const items = root.locator(
        ".sk-breadcrumbs__list > .sk-breadcrumbs__item",
      );
      await expect(items).toHaveCount(count);
      await expect(root.locator('a[aria-current="page"]')).toHaveCount(1);
      await expect(
        items.last().locator(':scope > a[aria-current="page"]'),
      ).toHaveCount(1);
      await expect(
        root.locator(
          '.sk-breadcrumbs__item:not(:last-child) > a[aria-current="page"]',
        ),
      ).toHaveCount(0);
      await expect(root.getByRole("link")).toHaveCount(count);
      expect(await root.ariaSnapshot()).not.toContain('text: "/"');
    });
  }

  test("long labels retain full accessible text while narrow overflow stays local", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const root = await openStory(
      page,
      storyPrefixes.breadcrumbs,
      "long-labels",
      ".sk-breadcrumbs",
    );
    await expect(
      root.getByRole("link", {
        name: /repository-with-an-intentionally-complete-name/,
      }),
    ).toBeVisible();
    const list = root.locator(".sk-breadcrumbs__list");
    const itemBoxes = await root
      .locator(":scope .sk-breadcrumbs__list > li.sk-breadcrumbs__item")
      .evaluateAll((items) =>
        items.map((item) => {
          const itemBox = item.getBoundingClientRect();
          const linkBox = item.querySelector("a")!.getBoundingClientRect();
          return {
            itemLeft: itemBox.left,
            itemRight: itemBox.right,
            itemWidth: itemBox.width,
            linkLeft: linkBox.left,
            linkRight: linkBox.right,
          };
        }),
      );
    for (const item of itemBoxes) {
      expect(item.itemWidth).toBeGreaterThan(0);
      expect(item.linkLeft).toBeGreaterThanOrEqual(item.itemLeft);
      expect(item.linkRight).toBeLessThanOrEqual(item.itemRight);
    }
    for (let index = 0; index < itemBoxes.length - 1; index += 1) {
      expect(
        itemBoxes[index].linkRight,
        `breadcrumb link ${index + 1} overpaints item ${index + 2}`,
      ).toBeLessThanOrEqual(itemBoxes[index + 1].itemLeft);
    }
    const geometry = await list.evaluate((node) => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      overflowX: getComputedStyle(node).overflowX,
    }));
    expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
    expect(geometry.overflowX).toBe("auto");
    expect(await documentGeometry(page)).toMatchObject({
      clientWidth: 320,
      scrollWidth: 320,
    });
  });

  test("every breadcrumb link is independently focusable with a visible focus ring", async ({
    page,
  }) => {
    const root = await openStory(
      page,
      storyPrefixes.breadcrumbs,
      "three-level",
      ".sk-breadcrumbs",
    );
    const links = root.getByRole("link");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    for (let index = 0; index < 3; index += 1) {
      await page.keyboard.press("Tab");
      await expect(links.nth(index)).toBeFocused();
      expect(await links.nth(index).getAttribute("tabindex")).not.toBe("-1");
      expect(
        await links
          .nth(index)
          .evaluate((node) => parseFloat(getComputedStyle(node).outlineWidth)),
      ).toBeGreaterThan(0);
    }
  });
});

test.describe("prose native semantics, measure, and local overflow", () => {
  test("prompt keeps native headings, lists, links, and code", async ({
    page,
  }) => {
    const root = await openStory(
      page,
      storyPrefixes.prose,
      "prompt",
      ".sk-prose",
    );
    await expect(root.getByRole("heading", { level: 2 })).toHaveCount(1);
    await expect(root.getByRole("list")).toHaveCount(2);
    await expect(root.getByRole("link")).toBeVisible();
    await expect(root.locator("code")).not.toHaveCount(0);
  });

  test("the wide readable measure is bounded and deletion-resistant, then contracts on narrow screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    let root = await openStory(
      page,
      storyPrefixes.prose,
      "prompt",
      ".sk-prose",
    );
    const wide = await root.evaluate((node) => ({
      width: node.getBoundingClientRect().width,
      maxInlineSize: getComputedStyle(node).maxInlineSize,
    }));
    expect(wide.maxInlineSize).not.toBe("none");
    expect(wide.width).toBeLessThan(800);

    await page.setViewportSize({ width: 320, height: 640 });
    root = await openStory(page, storyPrefixes.prose, "narrow", ".sk-prose");
    expect(
      await root.evaluate((node) => node.getBoundingClientRect().width),
    ).toBeLessThanOrEqual(320);
    expect(await documentGeometry(page)).toMatchObject({
      clientWidth: 320,
      scrollWidth: 320,
    });
  });

  test("long code and a wide native table scroll locally without widening the page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 720 });
    let root = await openStory(
      page,
      storyPrefixes.prose,
      "long-code",
      ".sk-prose",
    );
    const pre = root.locator("pre");
    const codeGeometry = await pre.evaluate((node) => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }));
    expect(codeGeometry.scrollWidth).toBeGreaterThan(codeGeometry.clientWidth);
    expect(await documentGeometry(page)).toMatchObject({
      clientWidth: 360,
      scrollWidth: 360,
    });

    root = await openStory(
      page,
      storyPrefixes.prose,
      "wide-table",
      ".sk-prose",
    );
    await expect(root.getByRole("table")).toBeVisible();
    const tableScroller = root.locator(".sk-data-table__scroller");
    expect(
      await tableScroller.evaluate((node) => node.scrollWidth),
    ).toBeGreaterThan(await tableScroller.evaluate((node) => node.clientWidth));
    expect(await documentGeometry(page)).toMatchObject({
      clientWidth: 360,
      scrollWidth: 360,
    });
  });

  test("an absent prompt composes the existing empty state instead of inventing prose state", async ({
    page,
  }) => {
    const root = await openStory(
      page,
      storyPrefixes.prose,
      "absent-prompt",
      ".sk-empty-state",
    );
    await expect(
      root.getByRole("heading", { name: "No prompt available" }),
    ).toBeVisible();
    await expect(page.locator(".sk-prose")).toHaveCount(0);
  });
});

test.describe("check bullet state and composed absence", () => {
  test("complete, pending, mixed, long, empty, and fifty-item stories preserve passive list semantics", async ({
    page,
  }) => {
    let root = await openCheckBulletStory(page, "complete");
    await expect(root.getByRole("list")).toHaveCount(1);
    await expect(root.getByRole("listitem")).toHaveCount(1);
    expect(await root.ariaSnapshot()).toContain(
      "Complete Implementation complete",
    );

    root = await openCheckBulletStory(page, "pending");
    expect(await root.ariaSnapshot()).toContain("Pending Review pending");

    root = await openCheckBulletStory(page, "mixed");
    await expect(root.getByRole("listitem")).toHaveCount(3);
    const snapshot = await root.ariaSnapshot();
    expect(snapshot).toContain("Complete Specification approved");
    expect(snapshot).toContain("Pending Independent review pending");
    await expect(root.getByRole("checkbox")).toHaveCount(0);
    await expect(root.getByRole("switch")).toHaveCount(0);
    await expect(
      root.locator("sk-check-bullet[aria-checked], sk-check-bullet[tabindex]"),
    ).toHaveCount(0);

    root = await openCheckBulletStory(page, "long-items", {
      width: 320,
      height: 720,
    });
    await expect(root.getByRole("listitem")).toHaveCount(2);
    expect(await documentGeometry(page)).toMatchObject({
      clientWidth: 320,
      scrollWidth: 320,
    });

    root = await openCheckBulletStory(page, "no-subtasks");
    await expect(root.locator("sk-check-bullet")).toHaveCount(0);
    const emptyState = root.locator(".sk-empty-state");
    await expect(
      emptyState.getByRole("heading", { name: "No subtasks" }),
    ).toBeVisible();
    expect(
      await emptyState.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          alignItems: style.alignItems,
          display: style.display,
          flexDirection: style.flexDirection,
          textAlign: style.textAlign,
        };
      }),
    ).toEqual({
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
      textAlign: "center",
    });

    root = await openCheckBulletStory(page, "fifty-items", {
      width: 720,
      height: 1200,
    });
    await expect(root.getByRole("listitem")).toHaveCount(50);
  });

  test("LightMode changes icon ink and keeps a real theme wrapper", async ({
    page,
  }) => {
    let root = await openCheckBulletStory(page, "complete");
    const dark = await root
      .locator("sk-check-bullet")
      .first()
      .locator('[part="icon"]')
      .evaluate((node) => getComputedStyle(node).color);
    root = await openCheckBulletStory(page, "light-mode");
    await expect(root.locator(".sk-light")).toHaveCount(1);
    const light = await root
      .locator("sk-check-bullet")
      .first()
      .locator('[part="icon"]')
      .evaluate((node) => getComputedStyle(node).color);
    expect(light).not.toBe(dark);
    test.info().annotations.push({
      type: "computed-icon-ink",
      description: `dark=${dark}; light=${light}`,
    });
  });
});

test.describe("timeline native order and attached metadata", () => {
  const timelineCases = [
    {
      id: "one-event",
      summaries: ["1. Created"],
      actors: ["Alex"],
      times: ["09:00 UTC"],
    },
    {
      id: "two-events",
      summaries: ["1. Created", "2. Reviewed"],
      actors: ["Alex", "Sam"],
      times: ["09:00 UTC", "10:30 UTC"],
    },
    {
      id: "twenty-events",
      summaries: Array.from(
        { length: 20 },
        (_, index) => `${index + 1}. Transition`,
      ),
      actors: Array.from({ length: 20 }, (_, index) => `Actor ${index + 1}`),
      times: Array.from(
        { length: 20 },
        (_, index) => `09:${String(index + 1).padStart(2, "0")} UTC`,
      ),
    },
  ] as const;

  for (const { id, summaries, actors, times } of timelineCases) {
    test(`${id} keeps exact consumer order and count`, async ({ page }) => {
      const root = await openStory(
        page,
        storyPrefixes.timeline,
        id,
        ".sk-event-timeline",
      );
      await expect(root).toHaveRole("list");
      await expect(root.getByRole("listitem")).toHaveCount(summaries.length);
      const items = root.locator(":scope > li.sk-event-timeline__item");
      await expect(items).toHaveCount(summaries.length);
      for (let index = 0; index < summaries.length; index += 1) {
        const item = items.nth(index);
        await expect(
          item.locator(":scope > .sk-event-timeline__summary"),
        ).toHaveText(summaries[index]);
        await expect(
          item.locator(
            ":scope > .sk-event-timeline__metadata > span:first-child",
          ),
        ).toHaveText(actors[index]);
        await expect(
          item.locator(":scope > .sk-event-timeline__metadata > time"),
        ).toHaveText(times[index]);
      }
    });
  }

  test("long narrow entries keep metadata inside their list item and avoid page overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const root = await openStory(
      page,
      storyPrefixes.timeline,
      "narrow",
      ".sk-event-timeline",
    );
    const item = root.getByRole("listitem").first();
    const metadata = item.locator(".sk-event-timeline__metadata");
    await expect(metadata).toBeVisible();
    const [itemBox, metadataBox] = await Promise.all([
      item.boundingBox(),
      metadata.boundingBox(),
    ]);
    expect(itemBox).not.toBeNull();
    expect(metadataBox).not.toBeNull();
    expect(metadataBox!.x).toBeGreaterThanOrEqual(itemBox!.x);
    expect(metadataBox!.x + metadataBox!.width).toBeLessThanOrEqual(
      itemBox!.x + itemBox!.width + 1,
    );
    expect(await documentGeometry(page)).toMatchObject({
      clientWidth: 320,
      scrollWidth: 320,
    });
  });

  test("a supplied marker stays authored content and connectors add no text", async ({
    page,
  }) => {
    const root = await openStory(
      page,
      storyPrefixes.timeline,
      "verified-marker",
      ".sk-event-timeline",
    );
    await expect(root.getByText("Verified by consumer")).toBeVisible();
    const text = (await root.innerText()).trim();
    expect(text).not.toContain("•");
    expect(text).not.toContain("│");
  });

  test("long content and unavailable retention remain separate consumer-authored compositions", async ({
    page,
  }) => {
    let root = await openStory(
      page,
      storyPrefixes.timeline,
      "long-transition",
      ".sk-event-timeline",
    );
    const firstItem = root.getByRole("listitem").first();
    await expect(
      firstItem.locator(".sk-event-timeline__summary"),
    ).toContainText("deliberately long");
    await expect(
      firstItem.locator(".sk-event-timeline__metadata"),
    ).toContainText("Consumer-supplied actor");

    root = await openStory(
      page,
      storyPrefixes.timeline,
      "unavailable-retention",
      ".sk-empty-state",
    );
    await expect(
      root.getByRole("heading", { name: "History unavailable" }),
    ).toBeVisible();
    await expect(page.locator(".sk-event-timeline")).toHaveCount(0);
  });
});

test("LightMode wrappers are real and change named token-derived values for all three families", async ({
  page,
}) => {
  const cases = [
    [storyPrefixes.breadcrumbs, ".sk-breadcrumbs__link"],
    [storyPrefixes.prose, ".sk-prose"],
    [storyPrefixes.timeline, ".sk-event-timeline__metadata"],
  ] as const;

  for (const [prefix, selector] of cases) {
    const dark = await openStory(page, prefix, "default", selector);
    const darkColor = await dark.evaluate(
      (node) => getComputedStyle(node).color,
    );
    const light = await openStory(page, prefix, "light-mode", selector);
    await expect(page.locator(".sk-light")).toHaveCount(1);
    const lightColor = await light.evaluate(
      (node) => getComputedStyle(node).color,
    );
    expect(lightColor).not.toBe(darkColor);
  }
});

test("active forced colors preserves focus, separator, timeline geometry, and code boundaries", async ({
  page,
  browserName,
}) => {
  expect(test.info().config.projects.map((project) => project.name), "the chromium skip below is keyed on this project name").toContain("chromium");
  test.skip(
    browserName !== "chromium",
    "Playwright forced-colors emulation is Chromium-owned",
  );
  await page.emulateMedia({ forcedColors: "active" });
  expect(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
  ).toBe(true);

  let root = await openStory(
    page,
    storyPrefixes.breadcrumbs,
    "forced-colors",
    ".sk-breadcrumbs",
  );
  const link = root.getByRole("link").first();
  await link.focus();
  expect(
    await link.evaluate((node) =>
      parseFloat(getComputedStyle(node).outlineWidth),
    ),
  ).toBeGreaterThan(0);
  const separator = await root
    .locator(".sk-breadcrumbs__item")
    .nth(1)
    .evaluate((node) => {
      const style = getComputedStyle(node, "::before");
      return {
        blockSize: parseFloat(style.blockSize),
        color: style.color,
        content: style.content,
        inlineSize: parseFloat(style.inlineSize),
      };
    });
  expect(separator.content).not.toBe("none");
  expect(separator.inlineSize).toBeGreaterThan(0);
  expect(separator.blockSize).toBeGreaterThan(0);
  expect(separator.color).not.toBe("rgba(0, 0, 0, 0)");

  root = await openStory(
    page,
    storyPrefixes.timeline,
    "forced-colors",
    ".sk-event-timeline",
  );
  const timelineDot = await root
    .getByRole("listitem")
    .first()
    .evaluate((node) => {
      const style = getComputedStyle(node, "::before");
      return {
        blockSize: parseFloat(style.blockSize),
        borderColor: style.borderColor,
        borderWidth: parseFloat(style.borderWidth),
        backgroundColor: style.backgroundColor,
        inlineSize: parseFloat(style.inlineSize),
      };
    });
  expect(timelineDot.inlineSize).toBeGreaterThan(0);
  expect(timelineDot.blockSize).toBeGreaterThan(0);
  expect(timelineDot.borderWidth).toBeGreaterThan(0);
  expect(timelineDot.borderColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(timelineDot.borderColor).not.toBe(timelineDot.backgroundColor);

  root = await openStory(page, storyPrefixes.prose, "long-code", ".sk-prose");
  expect(
    await root
      .locator("pre")
      .evaluate((node) => parseFloat(getComputedStyle(node).borderWidth)),
  ).toBeGreaterThan(0);
});
