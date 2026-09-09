import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";

const fixtureRoot = "packages/styles/src/event-timeline";
const tokensCss = readFileSync("packages/tokens/src/tokens.css", "utf8");

const compactFixtures = [
  "sk-event-timeline-compact-default.html",
  "sk-event-timeline-compact-degraded.html",
  "sk-event-timeline-compact-forced-colors.html",
  "sk-event-timeline-compact-leading-marker.html",
  "sk-event-timeline-compact-linked.html",
  "sk-event-timeline-compact-long-content.html",
  "sk-event-timeline-compact-narrow.html",
  "sk-event-timeline-compact-one-event.html",
  "sk-event-timeline-compact-twenty-events.html",
] as const;

type CompactFixture = (typeof compactFixtures)[number];

type EventTruth = {
  summary: string;
  detail: string | null;
  actor: string;
  metadata: string[];
  visibleTime: string;
  timestamp: string;
  leadingMarkerIcon: string | null;
  trailingMarker: string | null;
  tone: string | null;
  trust: string | null;
  freshness: string | null;
};

function eventTruth(
  summary: string,
  actor: string,
  timestamp: string,
  visibleTime: string,
  options: Partial<
    Pick<
      EventTruth,
      | "detail"
      | "leadingMarkerIcon"
      | "trailingMarker"
      | "tone"
      | "trust"
      | "freshness"
    >
  > = {},
): EventTruth {
  const tone = options.tone ?? null;
  const trust = options.trust ?? null;
  const freshness = options.freshness ?? null;
  return {
    summary,
    detail: options.detail ?? null,
    actor,
    metadata: [
      actor,
      ...[tone, trust, freshness].filter(
        (value): value is string => value !== null,
      ),
    ],
    visibleTime,
    timestamp,
    leadingMarkerIcon: options.leadingMarkerIcon ?? null,
    trailingMarker: options.trailingMarker ?? null,
    tone,
    trust,
    freshness,
  };
}

const expectedTruth: Record<CompactFixture, EventTruth[]> = {
  "sk-event-timeline-compact-default.html": [
    eventTruth(
      "1. Mission created",
      "Alex",
      "2026-09-08T07:00:00Z",
      "07:00 UTC",
      {
        detail: "Consumer-supplied context remains attached to the event.",
        trailingMarker: "Verified by consumer",
      },
    ),
    eventTruth("2. Plan recorded", "Sam", "2026-09-08T08:30:00Z", "08:30 UTC"),
    eventTruth(
      "3. Implementation started",
      "Noor",
      "2026-09-08T10:15:00Z",
      "10:15 UTC",
    ),
  ],
  "sk-event-timeline-compact-degraded.html": [
    eventTruth(
      "1. Evidence observed",
      "Alex",
      "2026-09-08T15:20:00Z",
      "15:20 UTC",
    ),
    eventTruth(
      "2. Review recorded",
      "Sam",
      "2026-09-08T15:45:00Z",
      "15:45 UTC",
    ),
  ],
  "sk-event-timeline-compact-forced-colors.html": [
    eventTruth(
      "1. Linked transition",
      "Alex",
      "2026-09-08T16:10:00Z",
      "16:10 UTC",
    ),
    eventTruth(
      "2. Destination transition",
      "Noor",
      "2026-09-08T16:25:00Z",
      "16:25 UTC",
    ),
  ],
  "sk-event-timeline-compact-leading-marker.html": [
    eventTruth(
      "1. Evidence received",
      "Alex",
      "2026-09-08T08:15:00Z",
      "08:15 UTC",
      {
        leadingMarkerIcon: "Decorative milestone",
        tone: "Tone: observation",
        trust: "Trust: consumer verified",
        freshness: "Freshness: observed 12 minutes ago",
      },
    ),
    eventTruth(
      "2. Review recorded",
      "Sam",
      "2026-09-08T09:30:00Z",
      "09:30 UTC",
    ),
    eventTruth(
      "3. Acceptance recorded",
      "Noor",
      "2026-09-08T10:45:00Z",
      "10:45 UTC",
      { leadingMarkerIcon: "Decorative completion" },
    ),
  ],
  "sk-event-timeline-compact-linked.html": [
    eventTruth(
      "1. Review the recorded transition",
      "Sam",
      "2026-09-08T11:20:00Z",
      "11:20 UTC",
    ),
    eventTruth(
      "2. Destination event",
      "Noor",
      "2026-09-08T11:45:00Z",
      "11:45 UTC",
    ),
  ],
  "sk-event-timeline-compact-long-content.html": [
    eventTruth(
      "1. A deliberately long consumer-authored transition summary remains attached to its complete metadata even when the contextual column is narrow and the browser zoom level increases",
      "Consumer-supplied actor with an exceptionally long display name",
      "2026-09-08T12:34:56Z",
      "Consumer-formatted observation at 12:34:56 UTC",
    ),
    eventTruth(
      "2. The following supplied transition also wraps without changing order",
      "Another consumer-supplied actor",
      "2026-09-08T13:45:00Z",
      "Consumer-formatted observation at 13:45 UTC",
    ),
  ],
  "sk-event-timeline-compact-narrow.html": [
    eventTruth(
      "1. A long supplied transition wraps inside the narrow contextual column",
      "Consumer-authored actor",
      "2026-09-08T14:10:00Z",
      "14:10 UTC",
    ),
    eventTruth(
      "2. Next transition",
      "Another actor",
      "2026-09-08T14:25:00Z",
      "14:25 UTC",
    ),
  ],
  "sk-event-timeline-compact-one-event.html": [
    eventTruth(
      "1. Mission created",
      "Alex",
      "2026-09-08T07:00:00Z",
      "07:00 UTC",
    ),
  ],
  "sk-event-timeline-compact-twenty-events.html": [
    eventTruth(
      "1. Transition recorded",
      "Actor 1",
      "2026-09-08T08:01:00Z",
      "08:01 UTC",
    ),
    eventTruth(
      "2. Transition recorded",
      "Actor 2",
      "2026-09-08T08:02:00Z",
      "08:02 UTC",
    ),
    eventTruth(
      "3. Transition recorded",
      "Actor 3",
      "2026-09-08T08:03:00Z",
      "08:03 UTC",
    ),
    eventTruth(
      "4. Transition recorded",
      "Actor 4",
      "2026-09-08T08:04:00Z",
      "08:04 UTC",
    ),
    eventTruth(
      "5. Transition recorded",
      "Actor 5",
      "2026-09-08T08:05:00Z",
      "08:05 UTC",
    ),
    eventTruth(
      "6. Transition recorded",
      "Actor 6",
      "2026-09-08T08:06:00Z",
      "08:06 UTC",
    ),
    eventTruth(
      "7. Transition recorded",
      "Actor 7",
      "2026-09-08T08:07:00Z",
      "08:07 UTC",
    ),
    eventTruth(
      "8. Transition recorded",
      "Actor 8",
      "2026-09-08T08:08:00Z",
      "08:08 UTC",
    ),
    eventTruth(
      "9. Transition recorded",
      "Actor 9",
      "2026-09-08T08:09:00Z",
      "08:09 UTC",
    ),
    eventTruth(
      "10. Transition recorded",
      "Actor 10",
      "2026-09-08T08:10:00Z",
      "08:10 UTC",
    ),
    eventTruth(
      "11. Transition recorded",
      "Actor 11",
      "2026-09-08T08:11:00Z",
      "08:11 UTC",
    ),
    eventTruth(
      "12. Transition recorded",
      "Actor 12",
      "2026-09-08T08:12:00Z",
      "08:12 UTC",
    ),
    eventTruth(
      "13. Transition recorded",
      "Actor 13",
      "2026-09-08T08:13:00Z",
      "08:13 UTC",
    ),
    eventTruth(
      "14. Transition recorded",
      "Actor 14",
      "2026-09-08T08:14:00Z",
      "08:14 UTC",
    ),
    eventTruth(
      "15. Transition recorded",
      "Actor 15",
      "2026-09-08T08:15:00Z",
      "08:15 UTC",
    ),
    eventTruth(
      "16. Transition recorded",
      "Actor 16",
      "2026-09-08T08:16:00Z",
      "08:16 UTC",
    ),
    eventTruth(
      "17. Transition recorded",
      "Actor 17",
      "2026-09-08T08:17:00Z",
      "08:17 UTC",
    ),
    eventTruth(
      "18. Transition recorded",
      "Actor 18",
      "2026-09-08T08:18:00Z",
      "08:18 UTC",
    ),
    eventTruth(
      "19. Transition recorded",
      "Actor 19",
      "2026-09-08T08:19:00Z",
      "08:19 UTC",
    ),
    eventTruth(
      "20. Transition recorded",
      "Actor 20",
      "2026-09-08T08:20:00Z",
      "08:20 UTC",
    ),
  ],
};

const truthByFixture = new Map<CompactFixture, EventTruth[]>(
  Object.entries(expectedTruth) as [CompactFixture, EventTruth[]][],
);

const linkTargets = new Map<CompactFixture, string>([
  ["sk-event-timeline-compact-linked.html", "#linked-event"],
  ["sk-event-timeline-compact-forced-colors.html", "#forced-colors-event"],
]);

function fixtureHtml(name: CompactFixture): string {
  // The name is closed over compactFixtures and exact-inventory asserted below.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return readFileSync(`${fixtureRoot}/${name}`, "utf8");
}

async function mountFixture(
  page: Page,
  name: CompactFixture,
): Promise<Locator> {
  const timelineCss = readFileSync(
    `${fixtureRoot}/sk-event-timeline.css`,
    "utf8",
  );
  await page.setContent(
    `<style>${tokensCss}\n${timelineCss}</style>${fixtureHtml(name)}`,
  );
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

test.describe("compact event timeline closed fixture inventory", () => {
  test("contains exactly the nine approved fixtures and class vocabulary", () => {
    const discovered = readdirSync(fixtureRoot)
      .filter((name) => /^sk-event-timeline-compact-.*\.html$/.test(name))
      .sort();
    expect(discovered).toEqual([...compactFixtures].sort());

    const allowedClasses = new Set([
      "sk-event-timeline",
      "sk-event-timeline--compact",
      "sk-event-timeline--narrow",
      "sk-event-timeline__content",
      "sk-event-timeline__item",
      "sk-event-timeline__leading-marker",
      "sk-event-timeline__marker",
      "sk-event-timeline__metadata",
      "sk-event-timeline__summary",
    ]);

    for (const fixture of compactFixtures) {
      const markup = fixtureHtml(fixture);
      const classTokens = [...markup.matchAll(/class="([^"]+)"/g)].flatMap(
        ([, value]) => value.split(/\s+/),
      );
      expect(
        [...new Set(classTokens)].filter((token) => !allowedClasses.has(token)),
        `${fixture} contains an unapproved class`,
      ).toEqual([]);
      expect(
        markup,
        `${fixture} must not copy a prototype wrapper`,
      ).not.toMatch(
        /\b(?:relative flex gap-3|before:absolute|flex-1 flex flex-col)\b/,
      );
    }
  });
});

test.describe("compact event timeline native interaction", () => {
  for (const fixture of compactFixtures) {
    test(`${fixture} exposes only supplied tab stops`, async ({ page }) => {
      const root = await mountFixture(page, fixture);
      const tabbable = root.locator(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      );
      const expectedHref = linkTargets.get(fixture);
      await expect(tabbable).toHaveCount(expectedHref === undefined ? 0 : 1);
      expect(fixtureHtml(fixture)).not.toMatch(/<script\b|\bonclick\s*=/i);

      if (expectedHref !== undefined) {
        await expect(tabbable).toHaveAttribute("href", expectedHref);
        await expect(tabbable).not.toHaveAttribute("onclick");
        await page.keyboard.press("Tab");
        await expect(tabbable).toBeFocused();
        await page.keyboard.press("Enter");
        await expect
          .poll(() => page.evaluate(() => location.hash))
          .toBe(expectedHref);
      }
    });
  }
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
      markerItem.evaluate((node) => getComputedStyle(node, "::before").display),
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

async function expectContentContained(root: Locator) {
  const containment = await root
    .locator(":scope > li.sk-event-timeline__item")
    .evaluateAll((items) =>
      items.map((item) => {
        const box = item.getBoundingClientRect();
        return {
          scrollWidth: item.scrollWidth,
          clientWidth: item.clientWidth,
          left: box.left,
          right: box.right,
          viewport: window.innerWidth,
        };
      }),
    );
  for (const item of containment) {
    expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth + 1);
    expect(item.left).toBeGreaterThanOrEqual(0);
    expect(item.right).toBeLessThanOrEqual(item.viewport + 1);
  }
}

async function expectFocusInsideViewport(anchor: Locator) {
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
    expect(compact.paddingInlineStart).toBeLessThan(regular.paddingInlineStart);
    await expect(item).toBeVisible();
  });

  for (const name of compactFixtures) {
    for (const width of [320, 1024] as const) {
      test(`${name} remains contained at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 720 });
        const root = await mountFixture(page, name);
        await expectTimesInsideItems(root);
        await expectContentContained(root);
        const documentSize = await documentWidth(page);
        expect(documentSize.scroll).toBeLessThanOrEqual(documentSize.client);

        const anchor = root.locator("a[href]");
        if ((await anchor.count()) > 0) {
          await expectFocusInsideViewport(anchor);
        }
      });
    }
  }

  test("the W4 evidence uses the default compact fixture at 1024px", async ({
    page,
  }) => {
    const width = 1024;
    await page.setViewportSize({ width, height: 720 });
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-default.html",
    );
    await expectTimesInsideItems(root);
    await expectContentContained(root);
    expect(await documentWidth(page)).toEqual({ client: width, scroll: width });
  });

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
    await expectContentContained(root);
    const width = await documentWidth(page);
    expect(width.scroll).toBeLessThanOrEqual(width.client);
  });

  for (const [fixture, href] of linkTargets) {
    test(`${fixture} native focus stays visible at 320px and 200% zoom`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      const root = await mountFixture(page, fixture);
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
      });
      await expectFocusInsideViewport(root.locator(`a[href="${href}"]`));
    });
  }
});

test.describe("compact event timeline supplied truth and preferences", () => {
  for (const fixture of compactFixtures) {
    test(`${fixture} preserves every supplied event tuple and native structure`, async ({
      page,
    }) => {
      const root = await mountFixture(page, fixture);
      const innerHtml = await root.evaluate((node) => node.innerHTML);
      const capture = () =>
        root.evaluate((node) => {
          const text = (element: Element | null) =>
            element?.textContent?.replace(/\s+/g, " ").trim() ?? null;
          const items = [...node.children] as HTMLElement[];
          return {
            rootTag: node.tagName,
            rootRole: node.getAttribute("role"),
            childTags: items.map((item) => item.tagName),
            childClasses: items.map((item) => [...item.classList]),
            truth: items.map((item) => {
              const metadata = [
                ...item.querySelectorAll(
                  ":scope > .sk-event-timeline__metadata > span",
                ),
              ].map((value) => text(value)!);
              const time = item.querySelector(
                ":scope > .sk-event-timeline__metadata > time",
              );
              return {
                summary: text(
                  item.querySelector(":scope > .sk-event-timeline__summary"),
                )!,
                detail: text(
                  item.querySelector(":scope > .sk-event-timeline__content"),
                ),
                actor: metadata[0],
                metadata,
                visibleTime: text(time)!,
                timestamp: time!.getAttribute("datetime")!,
                leadingMarkerIcon: text(
                  item.querySelector(
                    ":scope > .sk-event-timeline__leading-marker title",
                  ),
                ),
                trailingMarker: text(
                  item.querySelector(":scope > .sk-event-timeline__marker"),
                ),
                tone:
                  metadata.find((value) => value.startsWith("Tone:")) ?? null,
                trust:
                  metadata.find((value) => value.startsWith("Trust:")) ?? null,
                freshness:
                  metadata.find((value) => value.startsWith("Freshness:")) ??
                  null,
              } satisfies EventTruth;
            }),
            orders: items.map((item) => getComputedStyle(item).order),
            counterResets: items.map(
              (item) => getComputedStyle(item).counterReset,
            ),
            generatedContent: items.flatMap((item) => [
              getComputedStyle(item, "::before").content,
              getComputedStyle(item, "::after").content,
            ]),
          };
        });

      const compact = await capture();
      const expected = truthByFixture.get(fixture)!;
      expect(compact.rootTag).toBe("OL");
      expect(compact.rootRole).toBeNull();
      expect(compact.childTags).toEqual(Array(expected.length).fill("LI"));
      expect(
        compact.childClasses.every((classes) =>
          classes.includes("sk-event-timeline__item"),
        ),
      ).toBe(true);
      expect(compact.truth).toEqual(expected);
      expect(new Set(compact.orders)).toEqual(new Set(["0"]));
      expect(new Set(compact.counterResets)).toEqual(new Set(["none"]));
      expect(
        [...new Set(compact.generatedContent)].filter(
          (content) => content !== '""' && content !== "none",
        ),
      ).toEqual([]);

      await root.evaluate((node) =>
        node.classList.remove("sk-event-timeline--compact"),
      );
      const regular = await capture();
      expect(regular.truth).toEqual(compact.truth);
      expect(await root.evaluate((node) => node.innerHTML)).toBe(innerHtml);
      await root.evaluate((node) =>
        node.classList.add("sk-event-timeline--compact"),
      );
    });
  }

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
        summaries: [
          ...node.querySelectorAll(".sk-event-timeline__summary"),
        ].map((summary) => summary.textContent),
        times: [...node.querySelectorAll("time")].map((time) => ({
          datetime: time.getAttribute("datetime"),
          text: time.textContent,
        })),
      }));
    const degraded = await suppliedTruth();
    await root.evaluate((node) => node.removeAttribute("style"));
    expect(await suppliedTruth()).toEqual(degraded);
    await expect(
      root.locator('[aria-live], [role="status"], [role="alert"]'),
    ).toHaveCount(0);
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
    const unmarkedItem = root.locator(":scope > li").nth(1);
    const marker = firstItem.locator(".sk-event-timeline__leading-marker");
    const boundaries = await Promise.all([
      marker.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          borderStyle: style.borderTopStyle,
          borderWidth: Number.parseFloat(style.borderTopWidth),
          borderColor: style.borderTopColor,
          backgroundColor: style.backgroundColor,
        };
      }),
      firstItem.evaluate((node) => {
        const style = getComputedStyle(node, "::after");
        return {
          width: Number.parseFloat(style.inlineSize),
          color: style.backgroundColor,
        };
      }),
      unmarkedItem.evaluate((node) => {
        const style = getComputedStyle(node, "::before");
        return {
          display: style.display,
          borderStyle: style.borderTopStyle,
          borderWidth: Number.parseFloat(style.borderTopWidth),
          borderColor: style.borderTopColor,
          backgroundColor: style.backgroundColor,
        };
      }),
    ]);
    const [leadingMarker, connector, pseudoMarker] = boundaries;
    expect(leadingMarker.borderStyle).toBe("solid");
    expect(leadingMarker.borderWidth).toBeGreaterThan(0);
    expect(leadingMarker.borderColor).not.toBe(leadingMarker.backgroundColor);
    expect(connector.width).toBeGreaterThan(0);
    expect(connector.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(pseudoMarker.display).not.toBe("none");
    expect(pseudoMarker.borderStyle).toBe("solid");
    expect(pseudoMarker.borderWidth).toBeGreaterThan(0);
    expect(pseudoMarker.borderColor).not.toBe(pseudoMarker.backgroundColor);

    const anchor = root.locator('a[href="#forced-colors-event"]');
    await anchor.focus();
    await expect(anchor).toBeFocused();
    const outline = await anchor.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
        color: style.outlineColor,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThan(0);
    expect(outline.color).not.toBe(outline.backgroundColor);
  });

  test("the compact fixture responds to the documented light wrapper", async ({
    page,
  }) => {
    const root = await mountFixture(
      page,
      "sk-event-timeline-compact-default.html",
    );
    const defaultColor = await root.evaluate(
      (node) => getComputedStyle(node).color,
    );
    await root.evaluate((node) => node.classList.add("sk-light"));
    const lightColor = await root.evaluate(
      (node) => getComputedStyle(node).color,
    );
    expect(lightColor).not.toBe(defaultColor);
  });
});
