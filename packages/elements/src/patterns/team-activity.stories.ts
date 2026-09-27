import type { Meta, StoryObj } from "@storybook/web-components";
import { expect } from "storybook/test";
import { html, nothing, render as litRender, type TemplateResult } from "lit";
import { ref } from "lit/directives/ref.js";
import "../entity-marker/sk-entity-marker.js";
import "../notice/sk-notice.js";
import "../status-indicator/sk-status-indicator.js";

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type DeepReadonly<T> = T extends Primitive | ((...args: never[]) => unknown)
  ? T
  : T extends ReadonlyArray<infer Item>
    ? ReadonlyArray<DeepReadonly<Item>>
    : { readonly [Key in keyof T]: DeepReadonly<T[Key]> };

type LiveEntryKind = "presence" | "focus" | "event";
type RepositoryLiveState = "populated" | "quiet" | "degraded" | "gap";
type ObservedState = "populated" | "retained-degraded" | "quiet" | "loading";
type TeamActivityState =
  | "l1"
  | "l2"
  | "l3"
  | "l4"
  | "l5"
  | "tl1"
  | "oa1-populated"
  | "oa1-retained-degraded"
  | "oa1-quiet"
  | "oa1-loading"
  | "oa1-matrix"
  | "dm1";

type SuppliedTime = Readonly<{ iso: string; label: string }>;
type LiveEntryFixture = Readonly<{
  id: string;
  kind: LiveEntryKind;
  marker: string;
  markerLabel: string;
  actor: string;
  trustLabel: string;
  trustTooltip: string;
  summary: string;
  metadata: ReadonlyArray<string>;
  time: SuppliedTime;
}>;
type RepositoryLiveFixture = Readonly<{
  id: string;
  label: string;
  state: RepositoryLiveState;
  rows: ReadonlyArray<LiveEntryFixture>;
  quiet?: string;
  notice?: string;
  gap?: Readonly<{
    fromSequence: string;
    toSequence: string;
    sentence: string;
  }>;
}>;
type FactualHostContextFixture = Readonly<{
  id: string;
  heading: string;
  facts: ReadonlyArray<
    Readonly<{
      id: string;
      label: string;
      value: string;
    }>
  >;
}>;
type ObservedMomentFixture = Readonly<{
  id: string;
  kind: string;
  reference: string;
  repository: string;
  time: SuppliedTime;
}>;
type ObservedGroupFixture = Readonly<{
  id: string;
  repository: string;
  rows: ReadonlyArray<
    Readonly<{ id: string; subject: string; time: SuppliedTime }>
  >;
}>;
type ObservedFixture = Readonly<{
  state: ObservedState;
  notice?: string;
  moments: ReadonlyArray<ObservedMomentFixture>;
  groups: ReadonlyArray<ObservedGroupFixture>;
}>;
type TeamActivityFixture = Readonly<{
  copy: Readonly<{
    liveHeading: string;
    liveFreshness: string;
    liveFreshnessAccessible: string;
    liveFreshnessTooltip: string;
    presenceTier: string;
    presenceTierTooltip: string;
    quiet: string;
    degraded: string;
    gap: string;
    unauthorized: string;
    observedOverline: string;
    observedWindow: string;
    observedBoundaryAccessible: string;
    observedFreshness: string;
    observedFreshnessTooltip: string;
    observedRetention: string;
    observedRetentionTooltip: string;
    observedDegraded: string;
    observedSummary: string;
    observedMomentsHeading: string;
    observedRecordedHeading: string;
    observedEmptyHeading: string;
    observedEmptyBody: string;
    observedLoading: string;
    decision: string;
  }>;
  repositoryLive: Readonly<{
    l1: RepositoryLiveFixture;
    l2: RepositoryLiveFixture;
    l3: RepositoryLiveFixture;
    l4: RepositoryLiveFixture;
  }>;
  hostContext: FactualHostContextFixture;
  teamLive: ReadonlyArray<RepositoryLiveFixture>;
  observed: Readonly<{
    populated: ObservedFixture;
    retainedDegraded: ObservedFixture;
    quiet: ObservedFixture;
    loading: ObservedFixture;
  }>;
  decision: Readonly<{ label: string; id: string }>;
  longContent: Readonly<{
    teamHeading: string;
    repositoryLabels: ReadonlyArray<string>;
    liveSummary: string;
  }>;
  accessibility: Readonly<{
    teamLiveHeading: string;
    teamLiveRegion: string;
    loadingRegion: string;
  }>;
  documentation: Readonly<{
    componentDescription: string;
    decisionPrerequisite: string;
  }>;
  storyNames: Readonly<Record<string, string>>;
}>;

type RepositoryLiveProjection = DeepReadonly<{
  kind: "repository-live";
  id: string;
  label: string;
  state: RepositoryLiveState;
  heading: string;
  freshness: string;
  freshnessAccessible: string;
  freshnessTooltip: string;
  hostContext?: FactualHostContextFixture;
  rows: ReadonlyArray<LiveEntryFixture>;
  quiet?: string;
  notice?: string;
  gap?: Readonly<{
    fromSequence: string;
    toSequence: string;
    sentence: string;
  }>;
}>;
type ObservedProjection = DeepReadonly<{
  kind: "observed";
  state: ObservedState;
  overline: string;
  window: string;
  boundaryAccessible: string;
  freshness: string;
  freshnessTooltip: string;
  retention: string;
  retentionTooltip: string;
  momentsHeading: string;
  recordedHeading: string;
  notice?: string;
  summary?: string;
  moments: ReadonlyArray<ObservedMomentFixture>;
  groups: ReadonlyArray<ObservedGroupFixture>;
  emptyHeading?: string;
  emptyBody?: string;
  loading?: string;
}>;
type TeamActivityProjection = DeepReadonly<
  | RepositoryLiveProjection
  | { kind: "unauthorized"; denial: string }
  | {
      kind: "team-live";
      heading: string;
      regionLabel: string;
      repositories: ReadonlyArray<RepositoryLiveProjection>;
    }
  | ObservedProjection
  | {
      kind: "observed-matrix";
      heading: string;
      panels: ReadonlyArray<ObservedProjection>;
    }
  | {
      kind: "decision";
      overline: string;
      window: string;
      boundaryAccessible: string;
      freshness: string;
      freshnessTooltip: string;
      retention: string;
      retentionTooltip: string;
      label: string;
      id: string;
    }
>;

type ProjectionOptions = Readonly<{ long?: boolean }>;
type PresentationOptions = Readonly<{
  storyState: string;
  light?: boolean;
  direction?: "ltr" | "rtl";
  compact?: boolean;
}>;

export const deepFreezeTeamActivity = <T>(value: T): DeepReadonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreezeTeamActivity(nested);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

export const isTeamActivityDeeplyFrozen = (value: unknown): boolean => {
  if (value === null || typeof value !== "object") return true;
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every(
      isTeamActivityDeeplyFrozen,
    )
  );
};

const liveRows: ReadonlyArray<LiveEntryFixture> = [
  {
    id: "presence-lynn",
    kind: "presence",
    marker: "LY",
    markerLabel: "Lynn presence marker",
    actor: "lynn",
    trustLabel: "Presence · unverified",
    trustTooltip:
      "Presence gossip from the relay — self-reported, not verified.",
    summary: "spec-kitty/spec-kitty-saas feature/launch-resilience",
    metadata: ["laptop-1", "codex"],
    time: { iso: "2026-09-10T09:59:48Z", label: "12s ago" },
  },
  {
    id: "focus-bob",
    kind: "focus",
    marker: "BO",
    markerLabel: "Bob focus marker",
    actor: "bob",
    trustLabel: "Presence · unverified",
    trustTooltip:
      "Presence gossip from the relay — self-reported, not verified.",
    summary: "f1",
    metadata: ["spec-kitty/spec-kitty-saas", "main", "active"],
    time: { iso: "2026-09-10T09:59:56Z", label: "4s ago" },
  },
  {
    id: "event-wp04",
    kind: "event",
    marker: "EV",
    markerLabel: "Opaque event marker",
    actor: "lynn",
    trustLabel: "Presence · unverified",
    trustTooltip:
      "Presence gossip from the relay — self-reported, not verified.",
    summary: "wp.status_changed WP04 from_lane=doing to_lane=review",
    metadata: [],
    time: { iso: "2026-09-10T09:59:48Z", label: "12s ago" },
  },
];

const observedMoments: ReadonlyArray<ObservedMomentFixture> = [
  {
    id: "moment-wp03",
    kind: "WPStatusChanged",
    reference: "team-landing-pivots/WP03",
    repository: "spec-kitty/e2e-team-landing",
    time: { iso: "2026-09-10T08:00:00Z", label: "2 hours ago" },
  },
];

const observedGroups: ReadonlyArray<ObservedGroupFixture> = [
  {
    id: "group-e2e",
    repository: "spec-kitty/e2e-team-landing",
    rows: [
      {
        id: "subject-alice",
        subject: "user:alice",
        time: { iso: "2026-09-10T08:00:00Z", label: "2 hours ago" },
      },
      {
        id: "subject-bob",
        subject: "user:bob",
        time: { iso: "2026-09-10T09:56:00Z", label: "4 minutes ago" },
      },
    ],
  },
];

/** The sole consumer-shaped source for every visible and accessibility string in this family. */
export const TEAM_ACTIVITY_FIXTURE =
  deepFreezeTeamActivity<TeamActivityFixture>({
    copy: {
      liveHeading: "Live now",
      liveFreshness: "Reported live · ≤90s",
      liveFreshnessAccessible:
        "Reported live, refreshed within the last 90 seconds",
      liveFreshnessTooltip:
        "Reported live, refreshed within the last 90 seconds",
      presenceTier: "Presence · unverified",
      presenceTierTooltip:
        "Presence gossip from the relay — self-reported, not verified.",
      quiet: "No reported-live activity.",
      degraded: "Relay unreachable — live activity is unavailable.",
      gap: "Possible gap in activity: updates between #5 and #9 may be missing (3s ago).",
      unauthorized: "Not authorized to watch this repository's live activity.",
      observedOverline: "Observed activity",
      observedWindow: "Last 72 hours",
      observedBoundaryAccessible: "Observed activity provenance and retention",
      observedFreshness: "Observed · up to 60 s behind",
      observedFreshnessTooltip:
        "What Pulse observed on the team relay, polled every 60 seconds. Never a live view.",
      observedRetention: "Kept 72h",
      observedRetentionTooltip:
        "Everything Pulse observed here is deleted after this window. Nothing is kept forever.",
      observedDegraded: "Relay unreachable, showing last known activity",
      observedSummary:
        "2 teammates recorded active across 1 admitted repo in the last 72h.",
      observedMomentsHeading: "Moments",
      observedRecordedHeading: "Recorded activity",
      observedEmptyHeading: "No observed activity yet",
      observedEmptyBody:
        "Activity observed by the periodic poller lands here within 60 s.",
      observedLoading: "Loading activity",
      decision: "Decision",
    },
    repositoryLive: {
      l1: {
        id: "repo-populated",
        label: "spec-kitty/spec-kitty-saas",
        state: "populated",
        rows: liveRows,
      },
      l2: {
        id: "repo-quiet",
        label: "spec-kitty/e2e-team-landing",
        state: "quiet",
        rows: [],
        quiet: "No reported-live activity.",
      },
      l3: {
        id: "repo-degraded",
        label: "spec-kitty/spec-kitty-design",
        state: "degraded",
        rows: [],
        notice: "Relay unreachable — live activity is unavailable.",
      },
      l4: {
        id: "repo-gap",
        label: "spec-kitty/spec-kitty-cli",
        state: "gap",
        rows: liveRows,
        gap: {
          fromSequence: "5",
          toSequence: "9",
          sentence:
            "Possible gap in activity: updates between #5 and #9 may be missing (3s ago).",
        },
      },
    },
    hostContext: {
      id: "mission-git",
      heading: "Git activity · factual",
      facts: [
        {
          id: "planning-commit",
          label: "Planning commit",
          value: "72c4e9a",
        },
        {
          id: "planning-branch",
          label: "Planning branch",
          value: "feature/launch-resilience",
        },
      ],
    },
    teamLive: [
      {
        id: "team-repo-populated",
        label: "collaborative-demo-team / spec-kitty/spec-kitty-saas",
        state: "populated",
        rows: liveRows,
      },
      {
        id: "team-repo-quiet",
        label: "collaborative-demo-team / spec-kitty/e2e-team-landing",
        state: "quiet",
        rows: [],
        quiet: "No reported-live activity.",
      },
      {
        id: "team-repo-degraded",
        label: "collaborative-demo-team / spec-kitty/spec-kitty-design",
        state: "degraded",
        rows: [],
        notice: "Relay unreachable — live activity is unavailable.",
      },
      {
        id: "team-repo-gap",
        label: "collaborative-demo-team / spec-kitty/spec-kitty-cli",
        state: "gap",
        rows: liveRows,
        gap: {
          fromSequence: "5",
          toSequence: "9",
          sentence:
            "Possible gap in activity: updates between #5 and #9 may be missing (3s ago).",
        },
      },
    ],
    observed: {
      populated: {
        state: "populated",
        moments: observedMoments,
        groups: observedGroups,
      },
      retainedDegraded: {
        state: "retained-degraded",
        notice: "Relay unreachable, showing last known activity",
        moments: observedMoments,
        groups: observedGroups,
      },
      quiet: { state: "quiet", moments: [], groups: [] },
      loading: { state: "loading", moments: [], groups: [] },
    },
    decision: { label: "Decision", id: "dp-42" },
    longContent: {
      teamHeading:
        "Live activity across admitted repositories with deliberately extended localized labels",
      repositoryLabels: [
        "collaborative-demo-team / spec-kitty/spec-kitty-saas-with-a-deliberately-long-consumer-supplied-name",
        "collaborative-demo-team / spec-kitty/e2e-team-landing-with-a-deliberately-long-consumer-supplied-name",
        "collaborative-demo-team / spec-kitty/spec-kitty-design-with-a-deliberately-long-consumer-supplied-name",
        "collaborative-demo-team / spec-kitty/spec-kitty-cli-with-a-deliberately-long-consumer-supplied-name",
      ],
      liveSummary:
        "wp.status_changed WP04 from_lane=implementation-with-a-deliberately-long-localized-label to_lane=review-with-a-deliberately-long-localized-label",
    },
    accessibility: {
      teamLiveHeading: "Live now by admitted repository",
      teamLiveRegion:
        "Independent reported-live regions by admitted repository",
      loadingRegion: "Observed activity is loading",
    },
    documentation: {
      componentDescription:
        "Story-only L1–L5, TL1, OA1, and DM1 compositions from one immutable consumer fixture and public or native surfaces.",
      decisionPrerequisite:
        "Team Kitty prerequisite: the Dossier Mission strip must branch on supplied is_decision before that separate context can render this identifier-only shape.",
    },
    storyNames: {
      default: "L1 repository live populated",
      l2: "L2 repository live quiet",
      l3: "L3 repository live degraded",
      l4: "L4 repository live sequence gap",
      l5: "L5 repository live unauthorized",
      tl1: "TL1 Team live mixed",
      oa1Populated: "OA1 observed populated",
      oa1Degraded: "OA1 observed retained degraded",
      oa1Quiet: "OA1 observed quiet",
      oa1Loading: "OA1 observed loading",
      dm1: "DM1 Decision identifier only",
      light: "Same fixture light mode",
      narrow: "Narrow mixed repositories",
      intermediate: "Intermediate observed matrix",
      long: "Long consumer supplied content",
      rtl: "RTL logical layout",
      forced: "Forced colors",
      reduced: "Reduced motion",
    },
  });

const assertUnique = (values: ReadonlyArray<string>, label: string): void => {
  if (
    values.some((value) => value.trim().length === 0) ||
    new Set(values).size !== values.length
  ) {
    throw new TypeError(`${label} must be non-empty and unique.`);
  }
};

const validateRepositoryLive = (
  repository: DeepReadonly<RepositoryLiveFixture>,
  fixture: DeepReadonly<TeamActivityFixture>,
): void => {
  assertUnique(
    repository.rows.map(({ id }) => id),
    `${repository.id} live row identifiers`,
  );
  if (
    repository.rows.some(
      ({ trustLabel, trustTooltip }) =>
        trustLabel !== fixture.copy.presenceTier ||
        trustTooltip !== fixture.copy.presenceTierTooltip,
    )
  ) {
    throw new TypeError(
      "Every reported-live row must carry Presence · unverified.",
    );
  }
  switch (repository.state) {
    case "populated":
      if (
        repository.rows.length === 0 ||
        repository.quiet !== undefined ||
        repository.notice !== undefined ||
        repository.gap !== undefined
      ) {
        throw new TypeError(
          "A populated reported-live region requires supplied rows and no quiet, notice, or gap content.",
        );
      }
      break;
    case "quiet":
      if (
        repository.rows.length !== 0 ||
        typeof repository.quiet !== "string" ||
        repository.quiet.trim().length === 0 ||
        fixture.copy.quiet.trim().length === 0 ||
        repository.quiet !== fixture.copy.quiet ||
        repository.notice !== undefined ||
        repository.gap !== undefined
      ) {
        throw new TypeError(
          "A quiet reported-live region must contain only the exact supplied quiet copy.",
        );
      }
      break;
    case "degraded":
      if (
        repository.rows.length !== 0 ||
        typeof repository.notice !== "string" ||
        repository.notice.trim().length === 0 ||
        fixture.copy.degraded.trim().length === 0 ||
        repository.notice !== fixture.copy.degraded ||
        repository.quiet !== undefined ||
        repository.gap !== undefined
      ) {
        throw new TypeError(
          "A degraded reported-live region must contain only its notice and no stale rows.",
        );
      }
      break;
    case "gap":
      if (
        !repository.gap ||
        typeof repository.gap.fromSequence !== "string" ||
        repository.gap.fromSequence.trim().length === 0 ||
        typeof repository.gap.toSequence !== "string" ||
        repository.gap.toSequence.trim().length === 0 ||
        typeof repository.gap.sentence !== "string" ||
        repository.gap.sentence.trim().length === 0 ||
        fixture.copy.gap.trim().length === 0 ||
        repository.rows.length === 0 ||
        repository.gap.sentence !== fixture.copy.gap ||
        repository.quiet !== undefined ||
        repository.notice !== undefined
      ) {
        throw new TypeError(
          "A sequence-gap region requires only complete supplied bounds and sentence before current rows.",
        );
      }
      break;
    default:
      throw new TypeError("Reported-live state must be explicitly supplied.");
  }
};

const validateObserved = (
  observed: DeepReadonly<ObservedFixture>,
  fixture: DeepReadonly<TeamActivityFixture>,
): void => {
  assertUnique(
    observed.moments.map(({ id }) => id),
    `${observed.state} observed moment identifiers`,
  );
  assertUnique(
    observed.groups.map(({ id }) => id),
    `${observed.state} observed group identifiers`,
  );
  switch (observed.state) {
    case "populated":
      if (
        observed.moments.length === 0 ||
        observed.groups.length === 0 ||
        observed.notice !== undefined
      ) {
        throw new TypeError(
          "A populated observed region requires supplied moments and groups and no degraded notice.",
        );
      }
      break;
    case "retained-degraded":
      if (
        typeof observed.notice !== "string" ||
        observed.notice.trim().length === 0 ||
        fixture.copy.observedDegraded.trim().length === 0 ||
        observed.notice !== fixture.copy.observedDegraded ||
        observed.moments.length === 0 ||
        observed.groups.length === 0
      ) {
        throw new TypeError(
          "Observed degradation must retain supplied moments and recorded rows under its exact non-blank notice.",
        );
      }
      break;
    case "quiet":
      if (
        observed.moments.length !== 0 ||
        observed.groups.length !== 0 ||
        observed.notice !== undefined
      ) {
        throw new TypeError(
          "A quiet observed region cannot expose retained rows or a degraded notice.",
        );
      }
      break;
    case "loading":
      if (
        observed.moments.length !== 0 ||
        observed.groups.length !== 0 ||
        observed.notice !== undefined
      ) {
        throw new TypeError(
          "A loading observed region cannot expose retained rows or a degraded notice.",
        );
      }
      break;
    default:
      throw new TypeError("Observed state must be explicitly supplied.");
  }
  const rows = observed.groups.flatMap(({ rows }) => rows);
  if (
    [...observed.moments, ...rows].some(
      (row) => "trustLabel" in row || "presenceMarker" in row,
    )
  ) {
    throw new TypeError("Observed rows cannot carry a live presence marker.");
  }
};

const validateFixture = (
  fixture: DeepReadonly<TeamActivityFixture>,
): Readonly<{ id: string; label: string }> => {
  assertUnique(
    fixture.hostContext.facts.map(({ id }) => id),
    "Factual host-context identifiers",
  );
  if (
    fixture.hostContext.id.trim().length === 0 ||
    fixture.hostContext.heading.trim().length === 0 ||
    fixture.hostContext.facts.some(
      ({ label, value }) =>
        label.trim().length === 0 || value.trim().length === 0,
    )
  ) {
    throw new TypeError(
      "Factual host context requires supplied non-empty labels and values.",
    );
  }
  const expectedRepositoryStates: ReadonlyArray<RepositoryLiveState> = [
    "populated",
    "quiet",
    "degraded",
    "gap",
  ];
  const repositoryStates = [
    fixture.repositoryLive.l1.state,
    fixture.repositoryLive.l2.state,
    fixture.repositoryLive.l3.state,
    fixture.repositoryLive.l4.state,
  ];
  if (
    JSON.stringify(repositoryStates) !==
    JSON.stringify(expectedRepositoryStates)
  ) {
    throw new TypeError(
      "L1 through L4 must preserve their populated, quiet, degraded, and gap states.",
    );
  }
  const expectedObservedStates: ReadonlyArray<ObservedState> = [
    "populated",
    "retained-degraded",
    "quiet",
    "loading",
  ];
  const observedStates = [
    fixture.observed.populated.state,
    fixture.observed.retainedDegraded.state,
    fixture.observed.quiet.state,
    fixture.observed.loading.state,
  ];
  if (
    JSON.stringify(observedStates) !== JSON.stringify(expectedObservedStates)
  ) {
    throw new TypeError(
      "Observed slots must preserve their populated, retained-degraded, quiet, and loading states.",
    );
  }
  const repositories = [
    ...Object.values(fixture.repositoryLive),
    ...fixture.teamLive,
  ];
  assertUnique(
    repositories.map(({ id }) => id),
    "Repository truth-region identifiers",
  );
  repositories.forEach((repository) =>
    validateRepositoryLive(repository, fixture),
  );
  assertUnique(
    fixture.teamLive.map(({ label }) => label),
    "Team live repository labels",
  );
  if (
    JSON.stringify(fixture.teamLive.map(({ state }) => state)) !==
    JSON.stringify(expectedRepositoryStates)
  ) {
    throw new TypeError(
      "TL1 must preserve one independent populated, quiet, degraded, and gap region.",
    );
  }
  Object.values(fixture.observed).forEach((observed) =>
    validateObserved(observed, fixture),
  );
  const decisionPropertyNames = Object.getOwnPropertyNames(
    fixture.decision,
  ).sort();
  const decisionSymbols = Object.getOwnPropertySymbols(fixture.decision);
  if (
    JSON.stringify(decisionPropertyNames) !== JSON.stringify(["id", "label"]) ||
    decisionSymbols.length !== 0
  ) {
    throw new TypeError("Decision data must contain exactly id and label.");
  }
  const decisionDescriptors = Object.getOwnPropertyDescriptors(
    fixture.decision,
  );
  const id = decisionDescriptors.id?.value;
  const label = decisionDescriptors.label?.value;
  if (
    typeof id !== "string" ||
    typeof label !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(id) ||
    label !== fixture.copy.decision
  ) {
    throw new TypeError(
      "Decision data must remain a supplied label plus wire-safe identifier.",
    );
  }
  return { id, label };
};

const repositoryProjection = (
  fixture: DeepReadonly<TeamActivityFixture>,
  repository: DeepReadonly<RepositoryLiveFixture>,
  options: ProjectionOptions,
  index = 0,
  includeHostContext = false,
): RepositoryLiveProjection => {
  validateRepositoryLive(repository, fixture);
  const rows = options.long
    ? repository.rows.map((row) => ({
        ...row,
        summary: fixture.longContent.liveSummary,
      }))
    : repository.rows;
  return deepFreezeTeamActivity(
    structuredClone({
      kind: "repository-live" as const,
      id: repository.id,
      label: options.long
        ? fixture.longContent.repositoryLabels.at(index)!
        : repository.label,
      state: repository.state,
      heading: fixture.copy.liveHeading,
      freshness: fixture.copy.liveFreshness,
      freshnessAccessible: fixture.copy.liveFreshnessAccessible,
      freshnessTooltip: fixture.copy.liveFreshnessTooltip,
      ...(includeHostContext ? { hostContext: fixture.hostContext } : {}),
      rows,
      ...(repository.quiet ? { quiet: repository.quiet } : {}),
      ...(repository.notice ? { notice: repository.notice } : {}),
      ...(repository.gap ? { gap: repository.gap } : {}),
    }),
  );
};

const observedProjection = (
  fixture: DeepReadonly<TeamActivityFixture>,
  observed: DeepReadonly<ObservedFixture>,
): ObservedProjection => {
  validateObserved(observed, fixture);
  return deepFreezeTeamActivity(
    structuredClone({
      kind: "observed" as const,
      state: observed.state,
      overline: fixture.copy.observedOverline,
      window: fixture.copy.observedWindow,
      boundaryAccessible: fixture.copy.observedBoundaryAccessible,
      freshness: fixture.copy.observedFreshness,
      freshnessTooltip: fixture.copy.observedFreshnessTooltip,
      retention: fixture.copy.observedRetention,
      retentionTooltip: fixture.copy.observedRetentionTooltip,
      momentsHeading: fixture.copy.observedMomentsHeading,
      recordedHeading: fixture.copy.observedRecordedHeading,
      ...(observed.notice ? { notice: observed.notice } : {}),
      ...(observed.state === "populated" ||
      observed.state === "retained-degraded"
        ? { summary: fixture.copy.observedSummary }
        : {}),
      moments: observed.moments,
      groups: observed.groups,
      ...(observed.state === "quiet"
        ? {
            emptyHeading: fixture.copy.observedEmptyHeading,
            emptyBody: fixture.copy.observedEmptyBody,
          }
        : {}),
      ...(observed.state === "loading"
        ? { loading: fixture.copy.observedLoading }
        : {}),
    }),
  );
};

/** Purely selects already-classified consumer data; it performs no clock, permission, relay, or truth inference. */
export const projectTeamActivity = (
  fixture: DeepReadonly<TeamActivityFixture>,
  state: TeamActivityState,
  options: ProjectionOptions = {},
): TeamActivityProjection => {
  const decision = validateFixture(fixture);
  switch (state) {
    case "l1":
      return repositoryProjection(
        fixture,
        fixture.repositoryLive.l1,
        options,
        0,
        true,
      );
    case "l2":
      return repositoryProjection(
        fixture,
        fixture.repositoryLive.l2,
        options,
        0,
        true,
      );
    case "l3":
      return repositoryProjection(
        fixture,
        fixture.repositoryLive.l3,
        options,
        0,
        true,
      );
    case "l4":
      return repositoryProjection(
        fixture,
        fixture.repositoryLive.l4,
        options,
        0,
        true,
      );
    case "l5":
      return deepFreezeTeamActivity(
        structuredClone({
          kind: "unauthorized" as const,
          denial: fixture.copy.unauthorized,
        }),
      );
    case "tl1":
      return deepFreezeTeamActivity(
        structuredClone({
          kind: "team-live" as const,
          heading: options.long
            ? fixture.longContent.teamHeading
            : fixture.accessibility.teamLiveHeading,
          regionLabel: fixture.accessibility.teamLiveRegion,
          repositories: fixture.teamLive.map((repository, index) =>
            repositoryProjection(fixture, repository, options, index),
          ),
        }),
      );
    case "oa1-populated":
      return observedProjection(fixture, fixture.observed.populated);
    case "oa1-retained-degraded":
      return observedProjection(fixture, fixture.observed.retainedDegraded);
    case "oa1-quiet":
      return observedProjection(fixture, fixture.observed.quiet);
    case "oa1-loading":
      return observedProjection(fixture, fixture.observed.loading);
    case "oa1-matrix":
      return deepFreezeTeamActivity(
        structuredClone({
          kind: "observed-matrix" as const,
          heading: fixture.copy.observedOverline,
          panels: [
            observedProjection(fixture, fixture.observed.populated),
            observedProjection(fixture, fixture.observed.retainedDegraded),
            observedProjection(fixture, fixture.observed.quiet),
            observedProjection(fixture, fixture.observed.loading),
          ],
        }),
      );
    case "dm1":
      return deepFreezeTeamActivity(
        structuredClone({
          kind: "decision" as const,
          overline: fixture.copy.observedOverline,
          window: fixture.copy.observedWindow,
          boundaryAccessible: fixture.copy.observedBoundaryAccessible,
          freshness: fixture.copy.observedFreshness,
          freshnessTooltip: fixture.copy.observedFreshnessTooltip,
          retention: fixture.copy.observedRetention,
          retentionTooltip: fixture.copy.observedRetentionTooltip,
          label: decision.label,
          id: decision.id,
        }),
      );
  }
};

/** Executable proof that unsafe cross-tier and protected-boundary shapes fail closed. */
export const teamActivityGuardProof = () => {
  const fixture = TEAM_ACTIVITY_FIXTURE;
  const checks = [
    [
      "l5DenialOnly",
      () => {
        const projection = projectTeamActivity(fixture, "l5");
        if (
          projection.kind !== "unauthorized" ||
          JSON.stringify(Object.keys(projection).sort()) !==
            JSON.stringify(["denial", "kind"])
        )
          throw new TypeError();
      },
      false,
    ],
    [
      "factualHostContextStable",
      () => {
        const l1 = projectTeamActivity(fixture, "l1");
        const l3 = projectTeamActivity(fixture, "l3");
        if (
          l1.kind !== "repository-live" ||
          l3.kind !== "repository-live" ||
          l1.hostContext === fixture.hostContext ||
          l3.hostContext === fixture.hostContext ||
          JSON.stringify(l1.hostContext) !== JSON.stringify(l3.hostContext)
        )
          throw new TypeError();
      },
      false,
    ],
    [
      "duplicateTruthRegion",
      () =>
        validateFixture({
          ...fixture,
          teamLive: [
            fixture.teamLive[0]!,
            { ...fixture.teamLive[1]!, id: fixture.teamLive[0]!.id },
            ...fixture.teamLive.slice(2),
          ],
        }),
      true,
    ],
    [
      "tl1StateBoundary",
      () =>
        validateFixture({
          ...fixture,
          teamLive: fixture.teamLive.map((repo, index) =>
            index === 1
              ? { ...repo, state: "populated", rows: liveRows }
              : repo,
          ),
        }),
      true,
    ],
    [
      "degradedHasNoLiveRows",
      () =>
        validateFixture({
          ...fixture,
          repositoryLive: {
            ...fixture.repositoryLive,
            l3: { ...fixture.repositoryLive.l3, rows: liveRows },
          },
        }),
      true,
    ],
    [
      "gapSentenceComplete",
      () =>
        validateFixture({
          ...fixture,
          repositoryLive: {
            ...fixture.repositoryLive,
            l4: {
              ...fixture.repositoryLive.l4,
              gap: {
                ...fixture.repositoryLive.l4.gap!,
                sentence: "incomplete",
              },
            },
          },
        }),
      true,
    ],
    [
      "gapFromSequenceComplete",
      () =>
        validateFixture({
          ...fixture,
          repositoryLive: {
            ...fixture.repositoryLive,
            l4: {
              ...fixture.repositoryLive.l4,
              gap: {
                ...fixture.repositoryLive.l4.gap!,
                fromSequence: "",
              },
            },
          },
        }),
      true,
    ],
    [
      "gapToSequenceComplete",
      () =>
        validateFixture({
          ...fixture,
          repositoryLive: {
            ...fixture.repositoryLive,
            l4: {
              ...fixture.repositoryLive.l4,
              gap: {
                ...fixture.repositoryLive.l4.gap!,
                toSequence: " \t",
              },
            },
          },
        }),
      true,
    ],
    [
      "observedRetainsRows",
      () =>
        validateFixture({
          ...fixture,
          observed: {
            ...fixture.observed,
            retainedDegraded: {
              ...fixture.observed.retainedDegraded,
              moments: [],
            },
          },
        }),
      true,
    ],
    [
      "observedExcludesPresence",
      () =>
        validateFixture({
          ...fixture,
          observed: {
            ...fixture.observed,
            populated: {
              ...fixture.observed.populated,
              moments: [
                {
                  ...fixture.observed.populated.moments[0]!,
                  presenceMarker: fixture.copy.liveFreshness,
                },
              ],
            },
          },
        } as DeepReadonly<TeamActivityFixture>),
      true,
    ],
    [
      "decisionIdentifierOnly",
      () =>
        validateFixture({
          ...fixture,
          decision: { ...fixture.decision, id: "unsafe identifier" },
        }),
      true,
    ],
  ] as const;
  return deepFreezeTeamActivity(
    Object.fromEntries(
      checks.map(([name, check, shouldThrow]) => {
        try {
          check();
          return [name, !shouldThrow];
        } catch {
          return [name, shouldThrow];
        }
      }),
    ),
  );
};

const PATTERN_STYLES = html`<style>
  .sk-team-activity-pattern {
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: 100vh;
    padding: var(--sk-space-6);
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }
  .sk-team-activity-pattern *,
  .sk-team-activity-pattern *::before,
  .sk-team-activity-pattern *::after {
    box-sizing: border-box;
  }
  .sk-team-activity-pattern--compact {
    padding: var(--sk-space-4);
  }
  .sk-team-activity-pattern__canvas {
    display: grid;
    gap: var(--sk-space-5);
    min-inline-size: 0;
    max-inline-size: 100%;
    margin: 0 auto;
  }
  .sk-team-activity-pattern__canvas--single {
    max-inline-size: calc(var(--sk-space-12) * 6);
  }
  .sk-team-activity-pattern__canvas--matrix {
    grid-template-columns: repeat(
      auto-fit,
      minmax(min(100%, calc(var(--sk-space-12) * 4)), 1fr)
    );
  }
  .sk-team-activity-pattern__matrix-heading {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--sk-fg-default);
    font-size: var(--sk-text-2xl);
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern__factual {
    display: grid;
    gap: var(--sk-space-3);
    min-inline-size: 0;
    padding: var(--sk-space-4) var(--sk-space-5);
    color: var(--sk-on-tint-sky);
    border: var(--sk-border-width-1) solid var(--sk-border-tint-sky);
    border-radius: var(--sk-radius-md);
    background: var(--sk-surface-tint-sky);
  }
  .sk-team-activity-pattern__factual-heading {
    margin: 0;
    color: var(--sk-on-tint-sky);
    font-size: var(--sk-text-sm);
    font-weight: var(--sk-weight-semibold);
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern__facts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-2) var(--sk-space-4);
    margin: 0;
  }
  .sk-team-activity-pattern__fact {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-2);
    min-inline-size: 0;
  }
  .sk-team-activity-pattern__fact dt {
    font-size: var(--sk-text-sm);
  }
  .sk-team-activity-pattern__fact dd {
    min-inline-size: 0;
    margin: 0;
  }
  .sk-team-activity-pattern__fact code {
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern__region {
    display: grid;
    min-inline-size: 0;
    gap: var(--sk-space-4);
    padding: var(--sk-space-5);
    border: var(--sk-border-width-1) solid var(--sk-border-default);
    border-radius: var(--sk-radius-lg);
    background: var(--sk-surface-card);
  }
  .sk-team-activity-pattern__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sk-space-4);
    min-inline-size: 0;
  }
  .sk-team-activity-pattern__heading-group {
    min-inline-size: 0;
  }
  .sk-team-activity-pattern__eyebrow {
    margin: 0 0 var(--sk-space-1);
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
    font-weight: var(--sk-weight-semibold);
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern__heading {
    margin: 0;
    color: var(--sk-fg-default);
    font-size: var(--sk-text-xl);
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern__truth {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sk-space-2);
    min-inline-size: 0;
  }
  .sk-team-activity-pattern__truth sk-status-indicator {
    max-inline-size: 100%;
  }
  .sk-team-activity-pattern__sr-only {
    position: absolute;
    inline-size: var(--sk-border-width-1);
    block-size: var(--sk-border-width-1);
    margin: calc(var(--sk-border-width-1) * -1);
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .sk-team-activity-pattern__list,
  .sk-team-activity-pattern__recorded-list {
    display: grid;
    gap: var(--sk-space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sk-team-activity-pattern__live-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--sk-space-3);
    align-items: start;
    min-inline-size: 0;
    padding-block-start: var(--sk-space-3);
    border-block-start: var(--sk-border-width-1) solid var(--sk-border-default);
  }
  .sk-team-activity-pattern__row-copy {
    display: grid;
    gap: var(--sk-space-2);
    min-inline-size: 0;
  }
  .sk-team-activity-pattern__row-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sk-space-2);
    min-inline-size: 0;
  }
  .sk-team-activity-pattern__row-summary,
  .sk-team-activity-pattern__quiet,
  .sk-team-activity-pattern__summary {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern__metadata {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-2);
    margin: 0;
    padding: 0;
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
    list-style: none;
  }
  .sk-team-activity-pattern__time {
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
    white-space: nowrap;
  }
  .sk-team-activity-pattern__subsection {
    display: grid;
    gap: var(--sk-space-3);
    min-inline-size: 0;
  }
  .sk-team-activity-pattern__subheading {
    margin: 0;
    color: var(--sk-fg-default);
    font-size: var(--sk-text-lg);
  }
  .sk-team-activity-pattern__group {
    display: grid;
    gap: var(--sk-space-2);
    min-inline-size: 0;
  }
  .sk-team-activity-pattern__group-title {
    margin: 0;
    color: var(--sk-fg-default);
    font-weight: var(--sk-weight-semibold);
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern__recorded-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--sk-space-2);
    min-inline-size: 0;
    padding-block: var(--sk-space-2);
    border-block-start: var(--sk-border-width-1) solid var(--sk-border-default);
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern__decision-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sk-space-4);
    align-items: baseline;
    margin: 0;
    padding: var(--sk-space-4);
    border-inline-start: var(--sk-border-width-4) solid var(--sk-on-tint-sky);
    border-radius: var(--sk-radius-sm);
    background: var(--sk-surface-tint-sky);
  }
  .sk-team-activity-pattern__decision-row code {
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern__loading {
    display: grid;
    gap: var(--sk-space-3);
  }
  .sk-team-activity-pattern__skeleton {
    display: grid;
    gap: var(--sk-space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sk-team-activity-pattern__skeleton-line {
    display: block;
    inline-size: 100%;
    block-size: var(--sk-space-4);
    border: var(--sk-border-width-1) solid var(--sk-border-strong);
    border-radius: var(--sk-radius-sm);
    background: var(--sk-surface-muted);
  }
  .sk-team-activity-pattern__skeleton-line--short {
    inline-size: 62%;
  }
  .sk-team-activity-denial {
    display: grid;
    min-block-size: 100vh;
    place-items: center;
    box-sizing: border-box;
    inline-size: 100%;
    margin: 0;
    padding: var(--sk-space-6);
    color: var(--sk-fg-default);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
    text-align: center;
  }
  .sk-team-activity-denial__copy {
    max-inline-size: calc(var(--sk-space-12) * 5);
    margin: 0;
    overflow-wrap: anywhere;
  }
  .sk-team-activity-pattern--compact .sk-team-activity-pattern__header,
  .sk-team-activity-pattern--compact .sk-team-activity-pattern__live-row {
    grid-template-columns: minmax(0, 1fr);
    flex-direction: column;
  }
  .sk-team-activity-pattern--compact .sk-team-activity-pattern__truth {
    justify-content: flex-start;
  }
  .sk-team-activity-pattern--compact .sk-team-activity-pattern__time {
    white-space: normal;
  }
  [dir="rtl"].sk-team-activity-pattern {
    text-align: start;
  }
  @media (forced-colors: active) {
    .sk-team-activity-pattern__factual,
    .sk-team-activity-pattern__region,
    .sk-team-activity-pattern__live-row,
    .sk-team-activity-pattern__recorded-row {
      border-color: CanvasText;
    }
    .sk-team-activity-pattern__decision-row {
      border-inline-start-color: Highlight;
      background: Canvas;
    }
    .sk-team-activity-pattern__skeleton-line {
      border: var(--sk-border-width-1) solid CanvasText;
      background: Canvas;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sk-team-activity-pattern *,
    .sk-team-activity-pattern *::before,
    .sk-team-activity-pattern *::after {
      animation-duration: 0s;
      transition-duration: 0s;
    }
  }
</style>`;

const renderTruthBoundary = (
  visible: string,
  accessible: string,
  tooltip: string,
  tone: "success" | "info" | "neutral",
) =>
  html`<span class="sk-team-activity-pattern__truth" title=${tooltip}>
    <span class="sk-team-activity-pattern__sr-only">${accessible}</span>
    <sk-status-indicator tone=${tone} aria-hidden="true"
      ><span slot="marker">●</span>${visible}</sk-status-indicator
    >
  </span>`;

const renderFactualHostContext = (
  context: DeepReadonly<FactualHostContextFixture>,
) => {
  const headingId = `team-activity-${context.id}-heading`;
  return html`<section
    class="sk-team-activity-pattern__factual"
    aria-labelledby=${headingId}
    data-host-context=${context.id}
    data-truth-region="factual"
  >
    <h2 class="sk-team-activity-pattern__factual-heading" id=${headingId}>
      ${context.heading}
    </h2>
    <dl class="sk-team-activity-pattern__facts">
      ${context.facts.map(
        (fact) =>
          html`<div
            class="sk-team-activity-pattern__fact"
            data-host-fact=${fact.id}
          >
            <dt>${fact.label}</dt>
            <dd><code>${fact.value}</code></dd>
          </div>`,
      )}
    </dl>
  </section>`;
};

const renderLiveRows = (rows: DeepReadonly<ReadonlyArray<LiveEntryFixture>>) =>
  html`<ol class="sk-team-activity-pattern__list" data-live-list>
    ${rows.map(
      (row) =>
        html`<li
          class="sk-team-activity-pattern__live-row"
          data-live-row
          data-entry-kind=${row.kind}
          data-entry-id=${row.id}
        >
          <sk-entity-marker
            label=${row.markerLabel}
            size="sm"
            shape="circle"
            border="true"
            >${row.marker}</sk-entity-marker
          >
          <div class="sk-team-activity-pattern__row-copy">
            <div class="sk-team-activity-pattern__row-heading">
              <strong>${row.actor}</strong>
              <sk-status-indicator tone="neutral" title=${row.trustTooltip}
                ><span slot="marker">●</span
                >${row.trustLabel}</sk-status-indicator
              >
            </div>
            <p class="sk-team-activity-pattern__row-summary">
              <code>${row.summary}</code>
            </p>
            ${
              row.metadata.length > 0
                ? html`<ul class="sk-team-activity-pattern__metadata">
                    ${row.metadata.map((item) => html`<li><code>${item}</code></li>`)}
                  </ul>`
                : nothing
            }
          </div>
          <time class="sk-team-activity-pattern__time" datetime=${row.time.iso}
            >${row.time.label}</time
          >
        </li>`,
    )}
  </ol>`;

const renderRepositoryLive = (
  projection: RepositoryLiveProjection,
): TemplateResult => {
  const headingId = `team-activity-${projection.id}-heading`;
  const eyebrowId = `team-activity-${projection.id}-eyebrow`;
  return html`<section
    class="sk-team-activity-pattern__region"
    aria-labelledby=${`${eyebrowId} ${headingId}`}
    data-truth-region="reported-live"
    data-live-state=${projection.state}
    data-repository-id=${projection.id}
  >
    <header class="sk-team-activity-pattern__header">
      <div class="sk-team-activity-pattern__heading-group">
        <p class="sk-team-activity-pattern__eyebrow" id=${eyebrowId}>
          ${projection.label}
        </p>
        <h2 class="sk-team-activity-pattern__heading" id=${headingId}>
          ${projection.heading}
        </h2>
      </div>
      ${renderTruthBoundary(projection.freshness, projection.freshnessAccessible, projection.freshnessTooltip, "success")}
    </header>
    ${projection.gap ? html`<sk-notice tone="attention" announce="off" message=${projection.gap.sentence} data-live-gap></sk-notice>` : nothing}
    ${projection.notice ? html`<sk-notice tone="attention" announce="off" message=${projection.notice} data-live-degraded></sk-notice>` : nothing}
    ${projection.rows.length > 0 ? renderLiveRows(projection.rows) : nothing}
    ${projection.quiet ? html`<p class="sk-team-activity-pattern__quiet" data-live-quiet>${projection.quiet}</p>` : nothing}
  </section>`;
};

const renderObservedHeader = (
  projection:
    ObservedProjection | Extract<TeamActivityProjection, { kind: "decision" }>,
  headingId: string,
) =>
  html`<header class="sk-team-activity-pattern__header">
    <div class="sk-team-activity-pattern__heading-group">
      <p class="sk-team-activity-pattern__eyebrow">${projection.overline}</p>
      <h2 class="sk-team-activity-pattern__heading" id=${headingId}>
        ${projection.window}
      </h2>
    </div>
    <div
      class="sk-team-activity-pattern__truth"
      aria-label=${projection.boundaryAccessible}
    >
      ${renderTruthBoundary(projection.freshness, projection.freshness, projection.freshnessTooltip, "info")}
      ${renderTruthBoundary(projection.retention, projection.retention, projection.retentionTooltip, "neutral")}
    </div>
  </header>`;

const renderObserved = (
  projection: ObservedProjection,
  suffix = projection.state,
): TemplateResult => {
  const headingId = `team-activity-observed-${suffix}-heading`;
  const momentsHeadingId = `team-activity-observed-${suffix}-moments`;
  const recordedHeadingId = `team-activity-observed-${suffix}-recorded`;
  return html`<section
    class="sk-team-activity-pattern__region"
    aria-labelledby=${headingId}
    aria-busy=${projection.state === "loading" ? "true" : nothing}
    data-truth-region="observed"
    data-observed-state=${projection.state}
  >
    ${renderObservedHeader(projection, headingId)}
    ${projection.notice ? html`<sk-notice tone="attention" announce="polite" message=${projection.notice} data-observed-degraded></sk-notice>` : nothing}
    ${projection.summary ? html`<p class="sk-team-activity-pattern__summary">${projection.summary}</p>` : nothing}
    ${
      projection.moments.length > 0
        ? html`<section
            class="sk-team-activity-pattern__subsection"
            aria-labelledby=${momentsHeadingId}
          >
            <h3
              class="sk-team-activity-pattern__subheading"
              id=${momentsHeadingId}
            >
              ${projection.momentsHeading}
            </h3>
            <ol
              class="sk-event-timeline sk-event-timeline--compact"
              data-observed-moments
            >
              ${projection.moments.map(
                (moment) =>
                  html`<li
                    class="sk-event-timeline__item"
                    data-observed-row
                    data-observed-moment-id=${moment.id}
                  >
                    <p class="sk-event-timeline__summary">${moment.kind}</p>
                    <p class="sk-event-timeline__metadata">
                      <time datetime=${moment.time.iso}
                        >${moment.time.label}</time
                      >
                    </p>
                    <p class="sk-event-timeline__content">
                      <code>${moment.reference}</code>
                      <span>${moment.repository}</span>
                    </p>
                  </li>`,
              )}
            </ol>
          </section>`
        : nothing
    }
    ${
      projection.groups.length > 0
        ? html`<section
            class="sk-team-activity-pattern__subsection"
            aria-labelledby=${recordedHeadingId}
          >
            <h3
              class="sk-team-activity-pattern__subheading"
              id=${recordedHeadingId}
            >
              ${projection.recordedHeading}
            </h3>
            ${projection.groups.map(
              (group) =>
                html`<div
                  class="sk-team-activity-pattern__group"
                  data-observed-group=${group.id}
                >
                  <p class="sk-team-activity-pattern__group-title">
                    <code>${group.repository}</code>
                  </p>
                  <ul class="sk-team-activity-pattern__recorded-list">
                    ${group.rows.map((row) => html`<li class="sk-team-activity-pattern__recorded-row" data-observed-row><code>${row.subject}</code><time datetime=${row.time.iso}>${row.time.label}</time></li>`)}
                  </ul>
                </div>`,
            )}
          </section>`
        : nothing
    }
    ${
      projection.emptyHeading
        ? html`<div
            class="sk-team-activity-pattern__subsection"
            data-observed-quiet
          >
            <h3 class="sk-team-activity-pattern__subheading">
              ${projection.emptyHeading}
            </h3>
            <p class="sk-team-activity-pattern__quiet">
              ${projection.emptyBody}
            </p>
          </div>`
        : nothing
    }
    ${
      projection.loading
        ? html`<div
            class="sk-team-activity-pattern__loading"
            data-observed-loading
          >
            <span
              class="sk-team-activity-pattern__sr-only"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              >${projection.loading}</span
            >
            <ul class="sk-team-activity-pattern__skeleton" aria-hidden="true">
              <li>
                <span class="sk-team-activity-pattern__skeleton-line"></span>
              </li>
              <li>
                <span
                  class="sk-team-activity-pattern__skeleton-line sk-team-activity-pattern__skeleton-line--short"
                ></span>
              </li>
              <li>
                <span class="sk-team-activity-pattern__skeleton-line"></span>
              </li>
            </ul>
          </div>`
        : nothing
    }
  </section>`;
};

const renderProjection = (
  projection: TeamActivityProjection,
): TemplateResult => {
  switch (projection.kind) {
    case "repository-live":
      return html`${
        projection.hostContext
          ? renderFactualHostContext(projection.hostContext)
          : nothing
      }${renderRepositoryLive(projection)}`;
    case "team-live":
      return html`<section
        class="sk-team-activity-pattern__canvas sk-team-activity-pattern__canvas--matrix"
        aria-label=${projection.regionLabel}
        data-team-live
      >
        <h1 class="sk-team-activity-pattern__matrix-heading">
          ${projection.heading}
        </h1>
        ${projection.repositories.map(renderRepositoryLive)}
      </section>`;
    case "observed":
      return renderObserved(projection);
    case "observed-matrix":
      return html`<section
        class="sk-team-activity-pattern__canvas sk-team-activity-pattern__canvas--matrix"
        data-observed-matrix
      >
        <h1 class="sk-team-activity-pattern__matrix-heading">
          ${projection.heading}
        </h1>
        ${projection.panels.map((panel, index) => renderObserved(panel, `${panel.state}-${index}`))}
      </section>`;
    case "decision": {
      const headingId = "team-activity-decision-heading";
      return html`<section
        class="sk-team-activity-pattern__region"
        aria-labelledby=${headingId}
        data-truth-region="observed"
        data-decision-region
      >
        ${renderObservedHeader(projection, headingId)}
        <ol
          class="sk-event-timeline sk-event-timeline--compact"
          data-decision-list
        >
          <li class="sk-team-activity-pattern__decision-row" data-decision-row>
            <span>${projection.label}</span><code>${projection.id}</code>
          </li>
        </ol>
      </section>`;
    }
    case "unauthorized":
      return html`<p class="sk-team-activity-denial__copy">
        ${projection.denial}
      </p>`;
  }
};

/** Storybook-only renderer for the supplied projection; it publishes no runtime component surface. */
export const renderTeamActivity = (
  projection: TeamActivityProjection,
  presentation: PresentationOptions,
): TemplateResult => {
  if (projection.kind === "unauthorized") {
    return html`<main class="sk-team-activity-denial">
      ${PATTERN_STYLES}${renderProjection(projection)}
    </main>`;
  }
  const fixture = TEAM_ACTIVITY_FIXTURE;
  const guardProof = teamActivityGuardProof();
  const testSeam = Object.freeze({
    fixture,
    projection,
    project: (state: TeamActivityState, options: ProjectionOptions = {}) =>
      projectTeamActivity(fixture, state, options),
    projectFixture: (
      candidate: DeepReadonly<TeamActivityFixture>,
      state: TeamActivityState,
      options: ProjectionOptions = {},
    ) => projectTeamActivity(candidate, state, options),
    renderFixture: (
      candidate: DeepReadonly<TeamActivityFixture>,
      state: TeamActivityState,
      options: ProjectionOptions = {},
    ) => {
      const container = document.createElement("div");
      litRender(
        renderTeamActivity(projectTeamActivity(candidate, state, options), {
          storyState: `test-seam-${state}`,
        }),
        container,
      );
      return container;
    },
  });
  const testSeamRef = (element?: Element): void => {
    if (!(element instanceof HTMLElement)) return;
    Object.defineProperty(element, "__teamActivityTestSeam", {
      configurable: true,
      value: testSeam,
    });
  };
  const matrix =
    projection.kind === "team-live" || projection.kind === "observed-matrix";
  return html`<main
    class="sk-team-activity-pattern${presentation.light ? " sk-light" : ""}${presentation.compact ? " sk-team-activity-pattern--compact" : ""}"
    dir=${presentation.direction ?? "ltr"}
    data-team-activity-pattern
    data-story-state=${presentation.storyState}
    data-render-complete="true"
    data-fixture-deeply-frozen=${String(isTeamActivityDeeplyFrozen(fixture))}
    data-projection-deeply-frozen=${String(isTeamActivityDeeplyFrozen(projection))}
    data-guard-proof=${JSON.stringify(guardProof)}
    ${ref(testSeamRef)}
  >
    ${PATTERN_STYLES}
    <div
      class="sk-team-activity-pattern__canvas ${matrix ? "sk-team-activity-pattern__canvas--matrix" : "sk-team-activity-pattern__canvas--single"}"
    >
      ${renderProjection(projection)}
    </div>
  </main>`;
};

const basePlay = async (canvasElement: HTMLElement): Promise<void> => {
  const root = canvasElement.querySelector<HTMLElement>(
    "[data-team-activity-pattern]",
  );
  await expect(root).not.toBeNull();
  await expect(root?.dataset.renderComplete).toBe("true");
  await expect(root?.dataset.fixtureDeeplyFrozen).toBe("true");
  await expect(root?.dataset.projectionDeeplyFrozen).toBe("true");
  await expect(root?.dataset.guardProof).toBe(
    JSON.stringify({
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
    }),
  );
  root?.setAttribute("data-play-proof", "passed");
};

const denialPlay = async (canvasElement: HTMLElement): Promise<void> => {
  const root = canvasElement.querySelector<HTMLElement>(
    "main.sk-team-activity-denial",
  );
  await expect(root).not.toBeNull();
  await expect(root?.getAttributeNames()).toEqual(["class"]);
  await expect(Object.getOwnPropertyNames(root ?? {}).sort()).toEqual([]);
};

const meta: Meta = {
  title: "Patterns/Team Activity",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    a11y: { disable: false },
    docs: {
      description: {
        component: TEAM_ACTIVITY_FIXTURE.documentation.componentDescription,
      },
    },
  },
  excludeStories: [
    "deepFreezeTeamActivity",
    "isTeamActivityDeeplyFrozen",
    "TEAM_ACTIVITY_FIXTURE",
    "projectTeamActivity",
    "teamActivityGuardProof",
    "renderTeamActivity",
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.default,
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "l1"), {
      storyState: "l1",
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const L2RepositoryQuiet: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.l2,
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "l2"), {
      storyState: "l2",
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const L3RepositoryDegraded: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.l3,
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "l3"), {
      storyState: "l3",
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const L4RepositorySequenceGap: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.l4,
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "l4"), {
      storyState: "l4",
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const L5RepositoryUnauthorized: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.l5,
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "l5"), {
      storyState: "l5",
    }),
  play: async ({ canvasElement }) => denialPlay(canvasElement),
};

export const TL1TeamMixed: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.tl1,
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "tl1"), {
      storyState: "tl1",
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const OA1ObservedPopulated: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.oa1Populated,
  render: () =>
    renderTeamActivity(
      projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "oa1-populated"),
      { storyState: "oa1-populated" },
    ),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const OA1ObservedRetainedDegraded: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.oa1Degraded,
  render: () =>
    renderTeamActivity(
      projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "oa1-retained-degraded"),
      { storyState: "oa1-retained-degraded" },
    ),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const OA1ObservedQuiet: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.oa1Quiet,
  render: () =>
    renderTeamActivity(
      projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "oa1-quiet"),
      { storyState: "oa1-quiet" },
    ),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const OA1ObservedLoading: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.oa1Loading,
  render: () =>
    renderTeamActivity(
      projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "oa1-loading"),
      { storyState: "oa1-loading" },
    ),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const DM1Decision: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.dm1,
  parameters: {
    docs: {
      description: {
        story: TEAM_ACTIVITY_FIXTURE.documentation.decisionPrerequisite,
      },
    },
  },
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "dm1"), {
      storyState: "dm1",
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const LightMode: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.light,
  parameters: { backgrounds: { default: "sk-light" } },
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "l1"), {
      storyState: "light",
      light: true,
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const Narrow: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.narrow,
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "tl1"), {
      storyState: "narrow",
      compact: true,
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const Intermediate: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.intermediate,
  render: () =>
    renderTeamActivity(
      projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "oa1-matrix"),
      { storyState: "intermediate" },
    ),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const LongContent: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.long,
  render: () =>
    renderTeamActivity(
      projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "tl1", { long: true }),
      { storyState: "long", compact: true },
    ),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const RTL: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.rtl,
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "tl1"), {
      storyState: "rtl",
      direction: "rtl",
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const ForcedColors: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.forced,
  render: () =>
    renderTeamActivity(
      projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "oa1-retained-degraded"),
      { storyState: "forced" },
    ),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const ReducedMotion: Story = {
  name: TEAM_ACTIVITY_FIXTURE.storyNames.reduced,
  render: () =>
    renderTeamActivity(projectTeamActivity(TEAM_ACTIVITY_FIXTURE, "l1"), {
      storyState: "reduced",
    }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};
