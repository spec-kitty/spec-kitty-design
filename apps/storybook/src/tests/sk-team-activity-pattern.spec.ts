import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getViolations, injectAxe } from "axe-playwright";

const STORY_PREFIX = "patterns-team-activity--";
const STORY_SOURCE = "packages/elements/src/patterns/team-activity.stories.ts";
const STORY_IDS = [
  "default",
  "l-2-repository-quiet",
  "l-3-repository-degraded",
  "l-4-repository-sequence-gap",
  "l-5-repository-unauthorized",
  "tl-1-team-mixed",
  "oa-1-observed-populated",
  "oa-1-observed-retained-degraded",
  "oa-1-observed-quiet",
  "oa-1-observed-loading",
  "dm-1-decision",
  "light-mode",
  "narrow",
  "intermediate",
  "long-content",
  "rtl",
  "forced-colors",
  "reduced-motion",
] as const;
type StoryId = (typeof STORY_IDS)[number];

const EXPECTED_GUARD_PROOF = {
  l5DenialOnly: true,
  factualHostContextStable: true,
  duplicateTruthRegion: true,
  tl1StateBoundary: true,
  degradedHasNoLiveRows: true,
  gapSentenceComplete: true,
  gapFromSequenceComplete: true,
  gapToSequenceComplete: true,
  observedRetainsRows: true,
  observedExcludesPresence: true,
  decisionIdentifierOnly: true,
};

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
  const denial = id === "l-5-repository-unauthorized";
  const root = page
    .locator(denial ? "main.sk-team-activity-denial" : "[data-team-activity-pattern]")
    .first();
  await root.waitFor({ state: "visible", timeout: 20_000 });
  if (denial) {
    await expect(root).toHaveText(
      "Not authorized to watch this repository's live activity.",
    );
  } else {
    await expect(root).toHaveAttribute("data-render-complete", "true");
    await expect(root).toHaveAttribute("data-play-proof", "passed");
  }
  await page.evaluate(() => document.fonts.ready);
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
      const concurrentStorybookAxe =
        error instanceof Error &&
        error.message.includes("Axe is already running");
      if (!concurrentStorybookAxe || attempt === 9) throw error;
      await page.waitForTimeout(100);
    }
  }
  expect(
    violations,
    `${storyId} must have zero WCAG 2.1 AA violations`,
  ).toEqual([]);
};

test("source stays Storybook-only, public-surface, deterministic, token-local composition", () => {
  const source = readFileSync(STORY_SOURCE, "utf8");
  expect(source).toMatch(/title:\s*["']Patterns\/Team Activity["']/);
  expect(source).toContain("deepFreezeTeamActivity");
  expect(source).toContain("projectTeamActivity");
  expect(source).toContain("renderTeamActivity");
  expect(source).not.toMatch(/customElements\.define\s*\(/);
  expect(source).not.toMatch(/\.shadowRoot\b|\.renderRoot\b|getRootNode\s*\(/);
  expect(source).not.toMatch(
    /\b(?:fetch|setTimeout|setInterval|requestAnimationFrame)\s*\(/,
  );
  expect(source).not.toMatch(
    /\b(?:localStorage|sessionStorage|Math\.random|new\s+Date)\b/,
  );
  expect(source).not.toMatch(
    /\b(?:router|poller|relayClient|permissionCheck|relativeTime)\s*(?:[.=(])/,
  );
  expect(source).not.toMatch(
    /<sk-(?:live|activity|decision|tier|team-overview)[-\s>]/,
  );
  expect(source).not.toMatch(/::part\s*\(/);
  const publicImports = [
    ...source.matchAll(/import ["'](\.\.\/[^"']+)["'];/g),
  ].map((match) => match[1]);
  expect(publicImports).toEqual([
    "../entity-marker/sk-entity-marker.js",
    "../notice/sk-notice.js",
    "../status-indicator/sk-status-indicator.js",
  ]);
  const renderSource = source.slice(source.indexOf("const PATTERN_STYLES"));
  for (const productCopy of [
    "Live now",
    "Reported live · ≤90s",
    "Presence · unverified",
    "No reported-live activity.",
    "Relay unreachable",
    "Observed · up to 60 s behind",
    "Loading activity",
    "Not authorized",
  ]) {
    expect(
      renderSource,
      `${productCopy} must be fixture-supplied`,
    ).not.toContain(productCopy);
  }
  const rawColorDeclarations = [
    ...source.matchAll(
      /(?:color|background(?:-color)?|border-color):\s*([^;]+);/g,
    ),
  ]
    .map((match) => match[1]!.trim())
    .filter((value) => !value.includes("var(--sk-"))
    .filter((value) => !["Canvas", "CanvasText", "Highlight"].includes(value));
  expect(rawColorDeclarations).toEqual([]);
});

test("all eighteen story contracts are present in the built index", () => {
  const index = JSON.parse(
    readFileSync("apps/storybook/storybook-static/index.json", "utf8"),
  ) as {
    entries: Record<string, { type: string }>;
  };
  const built = Object.entries(index.entries)
    .filter(
      ([id, entry]) => id.startsWith(STORY_PREFIX) && entry.type === "story",
    )
    .map(([id]) => id.slice(STORY_PREFIX.length))
    .sort();
  expect(built).toEqual([...STORY_IDS].sort());
});

test("fixture, projections, guards, and repeat projection are deeply frozen and deterministic", async ({
  page,
}) => {
  const root = await openStory(page, "default");
  await expect(root).toHaveAttribute("data-fixture-deeply-frozen", "true");
  await expect(root).toHaveAttribute("data-projection-deeply-frozen", "true");
  await expect(root).toHaveAttribute(
    "data-guard-proof",
    JSON.stringify(EXPECTED_GUARD_PROOF),
  );
  const proof = await root.evaluate((node) => {
    const seam = (
      node as HTMLElement & {
        __teamActivityTestSeam: {
          fixture: unknown;
          projection: unknown;
          project: (state: "l1") => unknown;
        };
      }
    ).__teamActivityTestSeam;
    const deeplyFrozen = (value: unknown): boolean => {
      if (value === null || typeof value !== "object") return true;
      return Object.isFrozen(value) && Object.values(value).every(deeplyFrozen);
    };
    const first = seam.project("l1");
    const second = seam.project("l1");
    return {
      fixtureFrozen: deeplyFrozen(seam.fixture),
      projectionFrozen: deeplyFrozen(seam.projection),
      repeatedProjectionFrozen: deeplyFrozen(first) && deeplyFrozen(second),
      deterministic: JSON.stringify(first) === JSON.stringify(second),
    };
  });
  expect(proof).toEqual({
    fixtureFrozen: true,
    projectionFrozen: true,
    repeatedProjectionFrozen: true,
    deterministic: true,
  });
});

test("projection freeze is detached from caller-owned nested fixture nodes", async ({
  page,
}) => {
  const root = await openStory(page, "default");
  const proof = await root.evaluate((node) => {
    type MutableFixture = {
      repositoryLive: {
        l1: {
          rows: Array<{
            actor: string;
            metadata: string[];
            time: { iso: string; label: string };
          }>;
        };
      };
      hostContext: { facts: Array<{ value: string }> };
      teamLive: Array<{ rows: Array<{ actor: string }> }>;
      observed: {
        populated: {
          moments: Array<{ kind: string }>;
          groups: Array<{ rows: Array<{ subject: string }> }>;
        };
      };
    };
    type Projection = {
      kind: string;
      rows?: Array<{
        actor: string;
        metadata: string[];
        time: { iso: string; label: string };
      }>;
      hostContext?: { facts: Array<{ value: string }> };
      repositories?: Array<{ rows: Array<{ actor: string }> }>;
      moments?: Array<{ kind: string }>;
      groups?: Array<{ rows: Array<{ subject: string }> }>;
    };
    const seam = (
      node as HTMLElement & {
        __teamActivityTestSeam: {
          fixture: MutableFixture;
          projectFixture: (
            candidate: MutableFixture,
            state: "l1" | "tl1" | "oa1-populated",
          ) => Projection;
        };
      }
    ).__teamActivityTestSeam;
    const candidate = structuredClone(seam.fixture);
    const pristine = structuredClone(candidate);
    const descriptorSignature = (value: object) =>
      Object.fromEntries(
        Object.entries(Object.getOwnPropertyDescriptors(value)).map(
          ([key, descriptor]) => [
            key,
            {
              configurable: descriptor.configurable,
              enumerable: descriptor.enumerable,
              writable: "writable" in descriptor ? descriptor.writable : null,
            },
          ],
        ),
      );
    const watched = [
      candidate,
      candidate.repositoryLive.l1,
      candidate.repositoryLive.l1.rows,
      candidate.repositoryLive.l1.rows[0]!,
      candidate.repositoryLive.l1.rows[0]!.metadata,
      candidate.repositoryLive.l1.rows[0]!.time,
      candidate.hostContext,
      candidate.hostContext.facts,
      candidate.observed.populated,
      candidate.observed.populated.moments,
      candidate.observed.populated.groups[0]!.rows[0]!,
    ];
    const descriptorsBefore = watched.map(descriptorSignature);
    const l1 = seam.projectFixture(candidate, "l1");
    const tl1 = seam.projectFixture(candidate, "tl1");
    const observed = seam.projectFixture(candidate, "oa1-populated");
    const descriptorsAfter = watched.map(descriptorSignature);
    const unchangedAfterProjection = JSON.stringify(candidate) === JSON.stringify(pristine);
    const callerNodesRemainMutable = watched.every((value) => !Object.isFrozen(value));

    candidate.repositoryLive.l1.rows[0]!.actor = "caller-mutated-actor";
    candidate.repositoryLive.l1.rows[0]!.metadata.push("caller-mutated-metadata");
    candidate.repositoryLive.l1.rows[0]!.time.label = "caller-mutated-time";
    candidate.hostContext.facts[0]!.value = "caller-mutated-fact";
    candidate.observed.populated.moments[0]!.kind = "caller-mutated-kind";
    candidate.observed.populated.groups[0]!.rows[0]!.subject =
      "caller-mutated-subject";

    return {
      unchangedAfterProjection,
      descriptorsUnchanged:
        JSON.stringify(descriptorsBefore) === JSON.stringify(descriptorsAfter),
      callerNodesRemainMutable,
      mutationsApplied: {
        actor: candidate.repositoryLive.l1.rows[0]!.actor,
        metadata: candidate.repositoryLive.l1.rows[0]!.metadata.at(-1),
        time: candidate.repositoryLive.l1.rows[0]!.time.label,
        fact: candidate.hostContext.facts[0]!.value,
        teamActor: candidate.teamLive[0]!.rows[0]!.actor,
        moment: candidate.observed.populated.moments[0]!.kind,
        subject: candidate.observed.populated.groups[0]!.rows[0]!.subject,
      },
      projectionsStayDetached: {
        actor: l1.rows?.[0]?.actor,
        metadata: l1.rows?.[0]?.metadata.at(-1),
        time: l1.rows?.[0]?.time.label,
        fact: l1.hostContext?.facts[0]?.value,
        teamActor: tl1.repositories?.[0]?.rows[0]?.actor,
        moment: observed.moments?.[0]?.kind,
        subject: observed.groups?.[0]?.rows[0]?.subject,
      },
    };
  });
  expect(proof).toEqual({
    unchangedAfterProjection: true,
    descriptorsUnchanged: true,
    callerNodesRemainMutable: true,
    mutationsApplied: {
      actor: "caller-mutated-actor",
      metadata: "caller-mutated-metadata",
      time: "caller-mutated-time",
      fact: "caller-mutated-fact",
      teamActor: "caller-mutated-actor",
      moment: "caller-mutated-kind",
      subject: "caller-mutated-subject",
    },
    projectionsStayDetached: {
      actor: "lynn",
      metadata: "codex",
      time: "12s ago",
      fact: "72c4e9a",
      teamActor: "lynn",
      moment: "WPStatusChanged",
      subject: "user:alice",
    },
  });
});

test("L1 renders supplied presence, focus, and opaque event rows in one live region", async ({
  page,
}) => {
  const root = await openStory(page, "default");
  const region = root.getByRole("region", {
    name: "spec-kitty/spec-kitty-saas Live now",
  });
  await expect(region).toHaveAttribute("data-truth-region", "reported-live");
  await expect(region.getByText("Reported live · ≤90s")).toBeVisible();
  const rows = region.locator("[data-live-row]");
  await expect(rows).toHaveCount(3);
  expect(
    await rows.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-entry-kind")),
    ),
  ).toEqual(["presence", "focus", "event"]);
  await expect(rows.getByText("Presence · unverified")).toHaveCount(3);
  await expect(region.locator("ol[data-live-list]")).toHaveCount(1);
  await expect(region.locator("time[datetime]")).toHaveCount(3);
  await expect(
    region.getByText("wp.status_changed WP04 from_lane=doing to_lane=review"),
  ).toBeVisible();
  await expect(region.getByText(/Observed/)).toHaveCount(0);
});

test("L1 and L3 share one byte- and semantic-equivalent factual host context", async ({
  page,
}) => {
  const l1 = await openStory(page, "default");
  const l1Factual = l1.locator('[data-truth-region="factual"]');
  await expect(l1Factual).toHaveAttribute("data-host-context", "mission-git");
  await expect(
    l1Factual.getByRole("heading", {
      level: 2,
      name: "Git activity · factual",
    }),
  ).toBeVisible();
  await expect(l1Factual.locator("dl > div")).toHaveCount(2);
  await expect(l1Factual.locator("dt")).toHaveText([
    "Planning commit",
    "Planning branch",
  ]);
  await expect(l1Factual.locator("dd code")).toHaveText([
    "72c4e9a",
    "feature/launch-resilience",
  ]);
  const l1Bytes = await l1Factual.evaluate((node) => {
    const clone = node.cloneNode(true) as Element;
    const comments = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
    const markers: Comment[] = [];
    while (comments.nextNode()) markers.push(comments.currentNode as Comment);
    markers.forEach((marker) => marker.remove());
    return clone.outerHTML;
  });
  const l1Semantics = await l1Factual.ariaSnapshot();

  const l3 = await openStory(page, "l-3-repository-degraded");
  const l3Factual = l3.locator('[data-truth-region="factual"]');
  await expect(l3Factual).toHaveAttribute("data-host-context", "mission-git");
  expect(
    await l3Factual.evaluate((node) => {
      const clone = node.cloneNode(true) as Element;
      const comments = document.createTreeWalker(
        clone,
        NodeFilter.SHOW_COMMENT,
      );
      const markers: Comment[] = [];
      while (comments.nextNode()) markers.push(comments.currentNode as Comment);
      markers.forEach((marker) => marker.remove());
      return clone.outerHTML;
    }),
  ).toBe(l1Bytes);
  expect(await l3Factual.ariaSnapshot()).toBe(l1Semantics);

  const projectionProof = await l3.evaluate((node) => {
    const seam = (
      node as HTMLElement & {
        __teamActivityTestSeam: {
          project: (state: "l1" | "l3") => {
            hostContext?: unknown;
          };
        };
      }
    ).__teamActivityTestSeam;
    const l1Projection = seam.project("l1");
    const l3Projection = seam.project("l3");
    return {
      l1: JSON.stringify(l1Projection.hostContext),
      l3: JSON.stringify(l3Projection.hostContext),
    };
  });
  expect(projectionProof.l1).toBe(projectionProof.l3);
  expect(projectionProof.l1).not.toBeUndefined();
});

test("L2 is exact ordinary quiet absence", async ({ page }) => {
  const root = await openStory(page, "l-2-repository-quiet");
  await expect(root.locator("[data-live-quiet]")).toHaveText(
    "No reported-live activity.",
  );
  await expect(root.locator("[data-live-row], sk-notice")).toHaveCount(0);
  await expect(root.getByText(/history|earlier/i)).toHaveCount(0);
  await expect(root.locator("a, button")).toHaveCount(0);
});

test("L3 keeps the live boundary, notice, and zero stale rows", async ({
  page,
}) => {
  const root = await openStory(page, "l-3-repository-degraded");
  await expect(root.locator('[data-live-state="degraded"]')).toHaveCount(1);
  await expect(root.locator("[data-live-degraded]")).toContainText(
    "Relay unreachable — live activity is unavailable.",
  );
  await expect(root.locator("[data-live-row], [data-live-quiet]")).toHaveCount(
    0,
  );
  await expect(root.getByText(/Observed/)).toHaveCount(0);
});

test("L4 places the complete supplied gap sentence before current rows", async ({
  page,
}) => {
  const root = await openStory(page, "l-4-repository-sequence-gap");
  const gap = root.locator("[data-live-gap]");
  const list = root.locator("[data-live-list]");
  await expect(gap).toContainText(
    "Possible gap in activity: updates between #5 and #9 may be missing (3s ago).",
  );
  await expect(root.locator("[data-live-row]")).toHaveCount(3);
  expect(
    await gap.evaluate(
      (node, candidate) =>
        Boolean(
          node.compareDocumentPosition(candidate as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      await list.elementHandle(),
    ),
  ).toBe(true);
  await expect(
    root.getByText(/missing events|reconstructed|Observed/),
  ).toHaveCount(0);
});

test("L4 built projection accepts changed bounds and rejects each incomplete bound with the guard error", async ({
  page,
}) => {
  const root = await openStory(page, "l-4-repository-sequence-gap");
  const proof = await root.evaluate((node) => {
    type SequenceBound = "fromSequence" | "toSequence";
    type MutableGap = {
      fromSequence?: string;
      toSequence?: string;
      sentence: string;
    };
    type MutableFixture = {
      repositoryLive: {
        l4: {
          gap: MutableGap;
        };
      };
    };
    const seam = (
      node as HTMLElement & {
        __teamActivityTestSeam: {
          fixture: MutableFixture;
          projectFixture: (
            candidate: MutableFixture,
            state: "l4",
          ) => { kind: string; state?: string; gap?: MutableGap };
        };
      }
    ).__teamActivityTestSeam;
    if (typeof seam.projectFixture !== "function") {
      throw new TypeError(
        "The built story must expose its real fixture projection seam.",
      );
    }
    const validCandidate = structuredClone(seam.fixture);
    validCandidate.repositoryLive.l4.gap.fromSequence = "41";
    validCandidate.repositoryLive.l4.gap.toSequence = "58";
    const validProjection = seam.projectFixture(validCandidate, "l4");

    const mutations: ReadonlyArray<
      readonly [SequenceBound, "missing" | "empty" | "whitespace"]
    > = [
      ["fromSequence", "missing"],
      ["fromSequence", "empty"],
      ["fromSequence", "whitespace"],
      ["toSequence", "missing"],
      ["toSequence", "empty"],
      ["toSequence", "whitespace"],
    ] as const;

    const invalid = mutations.map(([field, mutation]) => {
      const candidate = structuredClone(seam.fixture);
      const gap = candidate.repositoryLive.l4.gap;
      const value = mutation === "empty" ? "" : " \t";
      if (field === "fromSequence" && mutation === "missing") {
        delete gap.fromSequence;
      } else if (field === "fromSequence") {
        gap.fromSequence = value;
      } else if (mutation === "missing") {
        delete gap.toSequence;
      } else {
        gap.toSequence = value;
      }
      try {
        seam.projectFixture(candidate, "l4");
        return { field, mutation, rejected: false, name: null, message: null };
      } catch (error) {
        return {
          field,
          mutation,
          rejected: true,
          name: error instanceof Error ? error.name : null,
          message: error instanceof Error ? error.message : null,
        };
      }
    });

    return {
      valid: {
        kind: validProjection.kind,
        state: validProjection.state,
        fromSequence: validProjection.gap?.fromSequence,
        toSequence: validProjection.gap?.toSequence,
      },
      invalid,
    };
  });

  expect(proof.valid).toEqual({
    kind: "repository-live",
    state: "gap",
    fromSequence: "41",
    toSequence: "58",
  });
  expect(proof.invalid).toEqual([
    {
      field: "fromSequence",
      mutation: "missing",
      rejected: true,
      name: "TypeError",
      message:
        "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
    },
    {
      field: "fromSequence",
      mutation: "empty",
      rejected: true,
      name: "TypeError",
      message:
        "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
    },
    {
      field: "fromSequence",
      mutation: "whitespace",
      rejected: true,
      name: "TypeError",
      message:
        "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
    },
    {
      field: "toSequence",
      mutation: "missing",
      rejected: true,
      name: "TypeError",
      message:
        "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
    },
    {
      field: "toSequence",
      mutation: "empty",
      rejected: true,
      name: "TypeError",
      message:
        "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
    },
    {
      field: "toSequence",
      mutation: "whitespace",
      rejected: true,
      name: "TypeError",
      message:
        "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
    },
  ]);
  await expect(root.locator("[data-live-gap]")).toHaveAttribute(
    "message",
    "Possible gap in activity: updates between #5 and #9 may be missing (3s ago).",
  );
});

test("built projection rejects contradictory repository and observed states plus blank supplied gaps", async ({
  page,
}) => {
  const root = await openStory(page, "l-4-repository-sequence-gap");
  const proof = await root.evaluate((node) => {
    type MutableGap = {
      fromSequence?: string;
      toSequence?: string;
      sentence: string;
    };
    type MutableRepository = {
      id: string;
      label: string;
      state: "populated" | "quiet" | "degraded" | "gap";
      rows: unknown[];
      quiet?: string;
      notice?: string;
      gap?: MutableGap;
    };
    type MutableObserved = {
      state: "populated" | "retained-degraded" | "quiet" | "loading";
      notice?: string;
      moments: unknown[];
      groups: unknown[];
    };
    type MutableFixture = {
      copy: { gap: string; observedSummary: string };
      repositoryLive: {
        l1: MutableRepository;
        l2: MutableRepository;
        l3: MutableRepository;
        l4: MutableRepository;
      };
      teamLive: MutableRepository[];
      observed: {
        populated: MutableObserved;
        retainedDegraded: MutableObserved;
        quiet: MutableObserved;
        loading: MutableObserved;
      };
    };
    type State =
      | "l1"
      | "l2"
      | "l3"
      | "l4"
      | "tl1"
      | "oa1-populated"
      | "oa1-retained-degraded"
      | "oa1-quiet"
      | "oa1-loading";
    type Projection = { kind: string; state?: string; summary?: string };
    const seam = (
      node as HTMLElement & {
        __teamActivityTestSeam: {
          fixture: MutableFixture;
          projectFixture: (
            candidate: MutableFixture,
            state: State,
          ) => Projection;
        };
      }
    ).__teamActivityTestSeam;
    if (typeof seam.projectFixture !== "function") {
      throw new TypeError(
        "The built story must expose its real fixture projection seam.",
      );
    }

    const validStates: ReadonlyArray<State> = [
      "l1",
      "l2",
      "l3",
      "l4",
      "tl1",
      "oa1-populated",
      "oa1-retained-degraded",
      "oa1-quiet",
      "oa1-loading",
    ];
    const valid = validStates.map((state) => {
      const projection = seam.projectFixture(
        structuredClone(seam.fixture),
        state,
      );
      return {
        requested: state,
        kind: projection.kind,
        state: projection.state,
      };
    });
    const validChangedCopy = structuredClone(seam.fixture);
    validChangedCopy.copy.observedSummary =
      "Alternate supplied observed summary.";
    const validChangedProjection = seam.projectFixture(
      validChangedCopy,
      "oa1-populated",
    );

    const repositorySlotMessage =
      "L1 through L4 must preserve their populated, quiet, degraded, and gap states.";
    const observedSlotMessage =
      "Observed slots must preserve their populated, retained-degraded, quiet, and loading states.";

    const cases: ReadonlyArray<{
      name: string;
      state: State;
      message: string;
      mutate: (candidate: MutableFixture) => void;
    }> = [
      {
        name: "l1-as-quiet",
        state: "l1",
        message: repositorySlotMessage,
        mutate: (candidate) => {
          const { id, label } = candidate.repositoryLive.l1;
          candidate.repositoryLive.l1 = {
            ...structuredClone(candidate.repositoryLive.l2),
            id,
            label,
          };
        },
      },
      {
        name: "l2-as-populated",
        state: "l2",
        message: repositorySlotMessage,
        mutate: (candidate) => {
          const { id, label } = candidate.repositoryLive.l2;
          candidate.repositoryLive.l2 = {
            ...structuredClone(candidate.repositoryLive.l1),
            id,
            label,
          };
        },
      },
      {
        name: "l3-as-gap",
        state: "l3",
        message: repositorySlotMessage,
        mutate: (candidate) => {
          const { id, label } = candidate.repositoryLive.l3;
          candidate.repositoryLive.l3 = {
            ...structuredClone(candidate.repositoryLive.l4),
            id,
            label,
          };
        },
      },
      {
        name: "l4-as-degraded",
        state: "l4",
        message: repositorySlotMessage,
        mutate: (candidate) => {
          const { id, label } = candidate.repositoryLive.l4;
          candidate.repositoryLive.l4 = {
            ...structuredClone(candidate.repositoryLive.l3),
            id,
            label,
          };
        },
      },
      {
        name: "observed-populated-as-quiet",
        state: "oa1-populated",
        message: observedSlotMessage,
        mutate: (candidate) => {
          candidate.observed.populated = structuredClone(
            candidate.observed.quiet,
          );
        },
      },
      {
        name: "observed-degraded-as-loading",
        state: "oa1-retained-degraded",
        message: observedSlotMessage,
        mutate: (candidate) => {
          candidate.observed.retainedDegraded = structuredClone(
            candidate.observed.loading,
          );
        },
      },
      {
        name: "observed-quiet-as-populated",
        state: "oa1-quiet",
        message: observedSlotMessage,
        mutate: (candidate) => {
          candidate.observed.quiet = structuredClone(
            candidate.observed.populated,
          );
        },
      },
      {
        name: "observed-loading-as-degraded",
        state: "oa1-loading",
        message: observedSlotMessage,
        mutate: (candidate) => {
          candidate.observed.loading = structuredClone(
            candidate.observed.retainedDegraded,
          );
        },
      },
      {
        name: "populated-with-gap",
        state: "l1",
        message:
          "A populated reported-live region requires supplied rows and no quiet, notice, or gap content.",
        mutate: (candidate) => {
          candidate.repositoryLive.l1.gap = structuredClone(
            candidate.repositoryLive.l4.gap,
          );
        },
      },
      {
        name: "quiet-with-notice",
        state: "l2",
        message:
          "A quiet reported-live region must contain only the exact supplied quiet copy.",
        mutate: (candidate) => {
          candidate.repositoryLive.l2.notice =
            candidate.repositoryLive.l3.notice;
        },
      },
      {
        name: "degraded-with-quiet",
        state: "l3",
        message:
          "A degraded reported-live region must contain only its notice and no stale rows.",
        mutate: (candidate) => {
          candidate.repositoryLive.l3.quiet = candidate.repositoryLive.l2.quiet;
        },
      },
      {
        name: "gap-with-notice",
        state: "l4",
        message:
          "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
        mutate: (candidate) => {
          candidate.repositoryLive.l4.notice =
            candidate.repositoryLive.l3.notice;
        },
      },
      {
        name: "l4-blank-gap-sentence",
        state: "l4",
        message:
          "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
        mutate: (candidate) => {
          candidate.repositoryLive.l4.gap!.sentence = " \t";
        },
      },
      {
        name: "tl1-blank-gap-sentence",
        state: "tl1",
        message:
          "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
        mutate: (candidate) => {
          candidate.teamLive.find(
            ({ state }) => state === "gap",
          )!.gap!.sentence = "";
        },
      },
      {
        name: "blank-copy-and-all-gap-sentences",
        state: "tl1",
        message:
          "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
        mutate: (candidate) => {
          candidate.copy.gap = "";
          candidate.repositoryLive.l4.gap!.sentence = "";
          candidate.teamLive.find(
            ({ state }) => state === "gap",
          )!.gap!.sentence = "";
        },
      },
      {
        name: "observed-populated-with-notice",
        state: "oa1-populated",
        message:
          "A populated observed region requires supplied moments and groups and no degraded notice.",
        mutate: (candidate) => {
          candidate.observed.populated.notice =
            candidate.observed.retainedDegraded.notice;
        },
      },
      {
        name: "observed-quiet-with-notice",
        state: "oa1-quiet",
        message:
          "A quiet observed region cannot expose retained rows or a degraded notice.",
        mutate: (candidate) => {
          candidate.observed.quiet.notice =
            candidate.observed.retainedDegraded.notice;
        },
      },
      {
        name: "observed-loading-with-notice",
        state: "oa1-loading",
        message:
          "A loading observed region cannot expose retained rows or a degraded notice.",
        mutate: (candidate) => {
          candidate.observed.loading.notice =
            candidate.observed.retainedDegraded.notice;
        },
      },
    ];

    const invalid = cases.map(({ name, state, message, mutate }) => {
      const candidate = structuredClone(seam.fixture);
      mutate(candidate);
      try {
        seam.projectFixture(candidate, state);
        return {
          name,
          rejected: false,
          errorName: null,
          message: null,
          expected: message,
        };
      } catch (error) {
        return {
          name,
          rejected: true,
          errorName: error instanceof Error ? error.name : null,
          message: error instanceof Error ? error.message : null,
          expected: message,
        };
      }
    });

    return {
      valid,
      validChanged: {
        kind: validChangedProjection.kind,
        state: validChangedProjection.state,
        summary: validChangedProjection.summary,
      },
      invalid,
    };
  });

  expect(proof.valid).toEqual([
    { requested: "l1", kind: "repository-live", state: "populated" },
    { requested: "l2", kind: "repository-live", state: "quiet" },
    { requested: "l3", kind: "repository-live", state: "degraded" },
    { requested: "l4", kind: "repository-live", state: "gap" },
    { requested: "tl1", kind: "team-live", state: undefined },
    { requested: "oa1-populated", kind: "observed", state: "populated" },
    {
      requested: "oa1-retained-degraded",
      kind: "observed",
      state: "retained-degraded",
    },
    { requested: "oa1-quiet", kind: "observed", state: "quiet" },
    { requested: "oa1-loading", kind: "observed", state: "loading" },
  ]);
  expect(proof.validChanged).toEqual({
    kind: "observed",
    state: "populated",
    summary: "Alternate supplied observed summary.",
  });
  for (const result of proof.invalid) {
    expect(result, result.name).toMatchObject({
      rejected: true,
      errorName: "TypeError",
      message: result.expected,
    });
  }
});

test("L5 is the route-exact bare denial with no protected leakage or shell", async ({
  page,
}) => {
  const root = await openStory(page, "l-5-repository-unauthorized");
  await expect(root.locator(":scope > p")).toHaveText(
    "Not authorized to watch this repository's live activity.",
  );
  expect((await root.innerText()).trim()).toBe(
    "Not authorized to watch this repository's live activity.",
  );
  const denialSurface = await root.evaluate((node) => {
    const elements = [node, ...node.querySelectorAll("*")];
    const shape = elements.map((element) => ({
      tag: element.tagName,
      attributes: Object.fromEntries(
        [...element.attributes]
          .map(({ name, value }) => [name, value] as const)
          .sort(([left], [right]) => left.localeCompare(right)),
      ),
    }));
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const humanText: Array<{ parent: string; value: string }> = [];
    while (walker.nextNode()) {
      const text = walker.currentNode;
      const parent = text.parentElement;
      const value = text.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (value && parent?.tagName !== "STYLE") {
        humanText.push({ parent: parent?.tagName ?? "", value });
      }
    }
    return {
      shape,
      humanText,
      ownPropertyNames: Object.getOwnPropertyNames(node).sort(),
      ownPropertySymbols: Object.getOwnPropertySymbols(node).map(String).sort(),
      serialized: node.outerHTML,
    };
  });
  expect(denialSurface.shape).toEqual([
    {
      tag: "MAIN",
      attributes: {
        class: "sk-team-activity-denial",
      },
    },
    { tag: "STYLE", attributes: {} },
    {
      tag: "P",
      attributes: { class: "sk-team-activity-denial__copy" },
    },
  ]);
  expect(denialSurface.humanText).toEqual([
    {
      parent: "P",
      value: "Not authorized to watch this repository's live activity.",
    },
  ]);
  expect(denialSurface.ownPropertyNames).toEqual([]);
  expect(denialSurface.ownPropertySymbols).toEqual([]);
  for (const protectedValue of [
    "spec-kitty/spec-kitty-saas",
    "spec-kitty/spec-kitty-design",
    "spec-kitty/spec-kitty-cli",
    "lynn",
    "bob",
    "feature/launch-resilience",
    "laptop-1",
    "codex",
    "Reported live",
    "Observed activity",
    "Presence · unverified",
    "#5",
    "#9",
    "dp-42",
    "72c4e9a",
    "__teamActivityTestSeam",
    "data-guard-proof",
    "data-fixture-deeply-frozen",
    "data-projection-deeply-frozen",
    "data-story-state",
  ]) {
    expect(denialSurface.serialized, protectedValue).not.toContain(protectedValue);
  }
});

test("TL1 keeps four repository truth regions independent and has no aggregate freshness", async ({
  page,
}) => {
  const root = await openStory(page, "tl-1-team-mixed");
  const team = root.locator("[data-team-live]");
  const regions = team.locator(':scope > [data-truth-region="reported-live"]');
  await expect(regions).toHaveCount(4);
  expect(
    await regions.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-live-state")),
    ),
  ).toEqual(["populated", "quiet", "degraded", "gap"]);
  await expect(
    regions.locator(":scope > header").getByText("Reported live · ≤90s"),
  ).toHaveCount(4);
  await expect(
    team.locator(':scope > sk-status-indicator, :scope > [class*="truth"]'),
  ).toHaveCount(0);
  await expect(regions.nth(1).locator("[data-live-quiet]")).toHaveText(
    "No reported-live activity.",
  );
  await expect(regions.nth(2).locator("[data-live-row]")).toHaveCount(0);
  const gap = regions.nth(3).locator("[data-live-gap]");
  const rows = regions.nth(3).locator("[data-live-list]");
  expect(
    await gap.evaluate(
      (node, candidate) =>
        Boolean(
          node.compareDocumentPosition(candidate as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      await rows.elementHandle(),
    ),
  ).toBe(true);
});

test("OA1 populated uses one observed and supplied retention boundary without live markers", async ({
  page,
}) => {
  const root = await openStory(page, "oa-1-observed-populated");
  const region = root.locator('[data-truth-region="observed"]');
  await expect(
    region.getByRole("heading", { level: 2, name: "Last 72 hours" }),
  ).toBeVisible();
  await expect(
    region
      .locator("sk-status-indicator")
      .filter({ hasText: "Observed · up to 60 s behind" }),
  ).toBeVisible();
  await expect(
    region.locator("sk-status-indicator").filter({ hasText: "Kept 72h" }),
  ).toBeVisible();
  await expect(
    region.getByRole("heading", { level: 3, name: "Moments" }),
  ).toBeVisible();
  await expect(
    region.getByRole("heading", { level: 3, name: "Recorded activity" }),
  ).toBeVisible();
  await expect(region.locator("[data-observed-row]")).toHaveCount(3);
  await expect(region.locator("time[datetime]")).toHaveCount(3);
  await expect(
    region.getByText(/Presence · unverified|Reported live/),
  ).toHaveCount(0);
});

test("OA1 degraded notice precedes and retains all observed rows", async ({
  page,
}) => {
  const root = await openStory(page, "oa-1-observed-retained-degraded");
  const region = root.locator('[data-truth-region="observed"]');
  const notice = region.locator("[data-observed-degraded]");
  const firstRows = region.locator("[data-observed-moments]");
  await expect(notice).toContainText(
    "Relay unreachable, showing last known activity",
  );
  await expect(region.locator("[data-observed-row]")).toHaveCount(3);
  expect(
    await notice.evaluate(
      (node, candidate) =>
        Boolean(
          node.compareDocumentPosition(candidate as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      await firstRows.elementHandle(),
    ),
  ).toBe(true);
  await expect(
    region.getByText(/Presence · unverified|Reported live/),
  ).toHaveCount(0);
});

test("OA1 quiet and loading preserve their distinct semantic states", async ({
  page,
}) => {
  const quiet = await openStory(page, "oa-1-observed-quiet");
  await expect(
    quiet.getByRole("heading", { level: 3, name: "No observed activity yet" }),
  ).toBeVisible();
  await expect(
    quiet.getByText(
      "Activity observed by the periodic poller lands here within 60 s.",
    ),
  ).toBeVisible();
  await expect(
    quiet.locator('[data-observed-row], [aria-busy="true"]'),
  ).toHaveCount(0);

  const loading = await openStory(page, "oa-1-observed-loading");
  const region = loading.locator('[data-truth-region="observed"]');
  await expect(region).toHaveAttribute("aria-busy", "true");
  await expect(
    region.getByRole("heading", { level: 2, name: "Last 72 hours" }),
  ).toBeVisible();
  await expect(region.getByRole("status")).toHaveText("Loading activity");
  await expect(
    region.locator('h1[role="status"], h2[role="status"], h3[role="status"]'),
  ).toHaveCount(0);
  await expect(region.locator("[data-observed-loading] ul")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  const skeletonLines = region.locator(
    ".sk-team-activity-pattern__skeleton-line",
  );
  await expect(skeletonLines).toHaveCount(3);
  const skeletonMetrics = await skeletonLines.evaluateAll((lines) =>
    lines.map((line) => {
      const bounds = line.getBoundingClientRect();
      return {
        width: bounds.width,
        height: bounds.height,
        background: getComputedStyle(line).backgroundColor,
      };
    }),
  );
  expect(skeletonMetrics).toHaveLength(3);
  expect(
    skeletonMetrics.every(
      ({ width, height, background }) =>
        width > 0 && height > 0 && background !== "rgba(0, 0, 0, 0)",
    ),
  ).toBe(true);
  await expect(region.locator("[data-observed-row]")).toHaveCount(0);
});

test("DM1 exposes exactly Decision plus the wire-safe identifier inside observed", async ({
  page,
}) => {
  const root = await openStory(page, "dm-1-decision");
  const region = root.locator('[data-truth-region="observed"]');
  const row = region.locator("[data-decision-row]");
  await expect(row.locator(":scope > *")).toHaveCount(2);
  await expect(row.locator(":scope > *")).toHaveText(["Decision", "dp-42"]);
  expect((await row.innerText()).trim().split(/\s+/)).toEqual([
    "Decision",
    "dp-42",
  ]);
  await expect(row.locator("code")).toHaveText(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
  await expect(
    row.getByText(/Presence|question|answer|owner|source|action/i),
  ).toHaveCount(0);

  const exactShapeProof = await (await openStory(page, "default")).evaluate(
    (node) => {
      type MutableFixture = { decision: Record<string, unknown> };
      const seam = (
        node as HTMLElement & {
          __teamActivityTestSeam: {
            fixture: MutableFixture;
            projectFixture: (
              candidate: MutableFixture,
              state: "dm1",
            ) => { kind: string; label: string; id: string };
          };
        }
      ).__teamActivityTestSeam;
      const positive = structuredClone(seam.fixture);
      const projected = seam.projectFixture(positive, "dm1");
      const captureRejection = (candidate: MutableFixture) => {
        try {
          seam.projectFixture(candidate, "dm1");
          return { rejected: false, name: null, message: null };
        } catch (error) {
          return {
            rejected: true,
            name: error instanceof Error ? error.name : null,
            message: error instanceof Error ? error.message : null,
          };
        }
      };
      const extras = ["question", "title", "owner", "action", "source"];
      const negative = extras.map((extra) => {
        const candidate = structuredClone(seam.fixture);
        candidate.decision[extra] = `supplied-${extra}`;
        return { extra, ...captureRejection(candidate) };
      });
      const nonEnumerableCandidate = structuredClone(seam.fixture);
      Object.defineProperty(nonEnumerableCandidate.decision, "question", {
        configurable: true,
        enumerable: false,
        value: "supplied-question",
      });
      const symbolCandidate = structuredClone(seam.fixture);
      Object.defineProperty(symbolCandidate.decision, Symbol("question"), {
        configurable: true,
        enumerable: false,
        value: "supplied-question",
      });
      return {
        positiveKeys: Object.getOwnPropertyNames(positive.decision).sort(),
        positiveSymbolCount: Object.getOwnPropertySymbols(positive.decision)
          .length,
        projected: {
          kind: projected.kind,
          label: projected.label,
          id: projected.id,
        },
        negative,
        nonEnumerableExtra: {
          ownNames: Object.getOwnPropertyNames(
            nonEnumerableCandidate.decision,
          ).sort(),
          ...captureRejection(nonEnumerableCandidate),
        },
        symbolExtra: {
          ownSymbolDescriptions: Object.getOwnPropertySymbols(
            symbolCandidate.decision,
          ).map((key) => key.description),
          ...captureRejection(symbolCandidate),
        },
      };
    },
  );
  expect(exactShapeProof.positiveKeys).toEqual(["id", "label"]);
  expect(exactShapeProof.positiveSymbolCount).toBe(0);
  expect(exactShapeProof.projected).toEqual({
    kind: "decision",
    label: "Decision",
    id: "dp-42",
  });
  expect(exactShapeProof.negative).toEqual(
    ["question", "title", "owner", "action", "source"].map((extra) => ({
      extra,
      rejected: true,
      name: "TypeError",
      message: "Decision data must contain exactly id and label.",
    })),
  );
  expect(exactShapeProof.nonEnumerableExtra).toEqual({
    ownNames: ["id", "label", "question"],
    rejected: true,
    name: "TypeError",
    message: "Decision data must contain exactly id and label.",
  });
  expect(exactShapeProof.symbolExtra).toEqual({
    ownSymbolDescriptions: ["question"],
    rejected: true,
    name: "TypeError",
    message: "Decision data must contain exactly id and label.",
  });
});

test("dark and light reuse the semantic fixture while computed surfaces differ", async ({
  page,
}) => {
  const dark = await openStory(page, "default");
  const darkSignature = (await dark.innerText()).replace(/\s+/g, " ").trim();
  const darkSurface = await dark.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );
  const light = await openStory(page, "light-mode");
  const lightSignature = (await light.innerText()).replace(/\s+/g, " ").trim();
  const lightSurface = await light.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );
  expect(lightSignature).toBe(darkSignature);
  expect(lightSurface).not.toBe(darkSurface);
});

test("narrow, intermediate, desktop, short, long, 200%-zoom-equivalent reflow, and RTL contain supplied facts", async ({
  page,
}) => {
  const cases = [
    { id: "narrow" as const, viewport: { width: 390, height: 844 } },
    { id: "intermediate" as const, viewport: { width: 860, height: 900 } },
    { id: "default" as const, viewport: { width: 1440, height: 1024 } },
    { id: "default" as const, viewport: { width: 760, height: 500 } },
    { id: "long-content" as const, viewport: { width: 390, height: 1100 } },
    { id: "rtl" as const, viewport: { width: 860, height: 900 } },
  ];
  for (const specimen of cases) {
    const root = await openStory(page, specimen.id, specimen.viewport);
    expect(await documentGeometry(page), specimen.id).toMatchObject({
      clientWidth: specimen.viewport.width,
      scrollWidth: specimen.viewport.width,
    });
    const rootBox = await root.boundingBox();
    expect(rootBox?.x ?? -1, specimen.id).toBeGreaterThanOrEqual(0);
    expect(
      (rootBox?.x ?? 0) + (rootBox?.width ?? 0),
      specimen.id,
    ).toBeLessThanOrEqual(specimen.viewport.width + 1);
  }
  const rtl = await openStory(page, "rtl", { width: 860, height: 900 });
  await expect(rtl).toHaveAttribute("dir", "rtl");
  expect(
    await rtl
      .locator("[data-live-state]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-live-state")),
      ),
  ).toEqual(["populated", "quiet", "degraded", "gap"]);

  // This fixed-window case proves the layout/reflow pressure of a 1280 CSS-pixel desktop at
  // 200% browser zoom: 640 CSS pixels remain available. It deliberately does not claim that
  // Playwright drove the browser chrome's native zoom UI.
  const zoomEquivalent = await openStory(page, "long-content", {
    width: 640,
    height: 1000,
  });
  expect(await documentGeometry(page)).toEqual({
    clientWidth: 640,
    scrollWidth: 640,
  });
  await expect(
    zoomEquivalent.getByText(/deliberately-long-consumer-supplied-name/).first(),
  ).toBeVisible();

  // CSS zoom remains supplemental rendering stress only; the 640 CSS-pixel case above is the
  // repo-native automated reflow evidence.
  const zoom = await openStory(page, "long-content", {
    width: 780,
    height: 1000,
  });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  const zoomGeometry = await documentGeometry(page);
  expect(zoomGeometry.scrollWidth).toBe(zoomGeometry.clientWidth);
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).zoom),
  ).toBe("2");
  await expect(
    zoom.getByText(/deliberately-long-consumer-supplied-name/).first(),
  ).toBeVisible();
});

test("forced colors and reduced motion remain perceivable and deterministic", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Media emulation evidence is Chromium-owned",
  );
  await page.emulateMedia({ forcedColors: "active" });
  const forced = await openStory(page, "forced-colors");
  expect(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
  ).toBe(true);
  const border = await forced
    .locator('[data-truth-region="observed"]')
    .evaluate((node) => getComputedStyle(node).borderTopStyle);
  expect(border).not.toBe("none");

  await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
  const reduced = await openStory(page, "reduced-motion");
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  const durations = await reduced.locator("*").evaluateAll((nodes) =>
    nodes.map((node) => ({
      animation: getComputedStyle(node).animationDuration,
      transition: getComputedStyle(node).transitionDuration,
    })),
  );
  expect(
    durations.every(
      ({ animation, transition }) => animation === "0s" && transition === "0s",
    ),
  ).toBe(true);
});

test("native accessibility tree is meaningful and passive rows add no tab stops", async ({
  page,
}) => {
  const root = await openStory(page, "intermediate");
  const snapshot = await root.ariaSnapshot();
  expect(snapshot).toContain('heading "Observed activity" [level=1]');
  expect(snapshot).toContain('heading "Last 72 hours" [level=2]');
  expect(snapshot).toContain("list");
  await expect(
    root.locator(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).toHaveCount(0);
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("Tab");
  expect(
    await root.evaluate((node) => node.contains(document.activeElement)),
  ).toBe(false);
});

test("all required built stories have zero WCAG 2.1 AA axe violations", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "One Chromium axe pass covers the browser-independent DOM contracts",
  );
  for (const storyId of STORY_IDS) {
    await openStory(page, storyId);
    await axeIsClean(page, storyId);
  }
});
