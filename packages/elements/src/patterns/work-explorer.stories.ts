import type { Meta, StoryObj } from "@storybook/web-components";
import { html, nothing, render, type TemplateResult } from "lit";
import { createRef, ref, type Ref } from "lit/directives/ref.js";
import "../action-row/sk-action-row.js";
import "../app-shell/sk-app-shell.js";
import type { SkAppShell } from "../app-shell/sk-app-shell.js";
import "../button/sk-button.js";
import "../card/sk-card.js";
import "../context-sidebar/sk-context-sidebar.js";
import "../entity-marker/sk-entity-marker.js";
import "../grid/sk-grid.js";
import "../notice/sk-notice.js";
import "../page-header/sk-page-header.js";
import "../personal-rail/sk-personal-rail.js";
import "../pill-tag/sk-pill-tag.js";
import "../section-header/sk-section-header.js";
import "../status-indicator/sk-status-indicator.js";

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type DeepReadonly<T> = T extends Primitive | ((...args: never[]) => unknown)
  ? T
  : T extends ReadonlyArray<infer Item>
    ? ReadonlyArray<DeepReadonly<Item>>
    : { readonly [Key in keyof T]: DeepReadonly<T[Key]> };

type GroupingAxis = "lane" | "person" | "type";
type Lane = "planned" | "in-progress" | "for-review" | "in-review" | "blocked";
type Person =
  "mia" | "ravi" | "lynn" | "docker-dev" | "noor" | "jeroen" | "stijn";
type WorkType = "implementer" | "reviewer" | "researcher" | "planner";
type PageState = "populated" | "no-work" | "loading" | "no-repositories";
type ActivityIcon = "observe" | "assignment" | "blocker";

interface RepositoryRecord {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

interface WorkPackageRecord {
  readonly id: string;
  readonly missionName: string;
  readonly workPackageId: string;
  readonly repositoryId: string;
  readonly lane: Lane;
  readonly person: Person | null;
  readonly type: WorkType;
  readonly transitionDateTime: string;
  readonly transitionLabel: string;
  readonly href: string;
}

interface PresenceRecord {
  readonly id: string;
  readonly person: string;
  readonly label: string;
  readonly freshness: string;
  readonly href: string;
}

interface ActivityRecord {
  readonly id: string;
  readonly text: string;
  readonly datetime: string;
  readonly timestamp: string;
  readonly freshness: string;
  readonly trust: string;
  readonly tone: "info" | "success" | "danger";
  readonly icon: ActivityIcon;
}

interface WorkExplorerFixture {
  readonly team: { readonly label: string };
  readonly repositories: readonly RepositoryRecord[];
  readonly workPackages: readonly WorkPackageRecord[];
  readonly context: {
    readonly mission: { readonly label: string; readonly verified: boolean };
    readonly presence: {
      readonly state: "reported-live";
      readonly label: string;
      readonly freshness: string;
      readonly entries: readonly PresenceRecord[];
    };
    readonly activity: {
      readonly state: "observed";
      readonly label: string;
      readonly freshness: string;
      readonly observedAt: string;
      readonly events: readonly ActivityRecord[];
    };
  };
}

interface FilterState {
  readonly repositoryId: string;
  readonly personId: string;
  readonly query: string;
}

interface StoryModel {
  readonly id: string;
  readonly grouping: GroupingAxis;
  readonly pageState: PageState;
  readonly filters: FilterState;
  readonly expandedGroupIds: readonly string[];
  readonly visibleRowLimits: readonly VisibleRowLimit[];
  readonly light?: boolean;
  readonly degradedContext?: boolean;
}

interface VisibleRowLimit {
  readonly groupId: string;
  readonly limit: number;
}

interface GroupDefinition {
  readonly id: string;
  readonly label: string;
  readonly tone?: "danger";
}

interface GroupProjection extends GroupDefinition {
  readonly records: readonly WorkPackageRecord[];
  readonly count: number;
}

export const deepFreezeWorkExplorerFixture = <T>(value: T): DeepReadonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreezeWorkExplorerFixture(nested);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

export const isDeeplyFrozenWorkExplorerFixture = (value: unknown): boolean => {
  if (value === null || typeof value !== "object") return true;
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every(
      isDeeplyFrozenWorkExplorerFixture,
    )
  );
};

const LANE_GROUPS = [
  { id: "planned", label: "Planned" },
  { id: "in-progress", label: "In progress" },
  { id: "for-review", label: "For review" },
  { id: "in-review", label: "In review" },
  { id: "blocked", label: "Blocked", tone: "danger" },
] as const satisfies readonly GroupDefinition[];

const PERSON_GROUPS = [
  { id: "mia", label: "Mia" },
  { id: "ravi", label: "Ravi" },
  { id: "lynn", label: "Lynn" },
  { id: "docker-dev", label: "docker-dev" },
  { id: "noor", label: "Noor" },
  { id: "jeroen", label: "Jeroen" },
  { id: "stijn", label: "Stijn" },
  { id: "unassigned", label: "Unassigned" },
] as const satisfies readonly GroupDefinition[];

const TYPE_GROUPS = [
  { id: "implementer", label: "Implementer" },
  { id: "reviewer", label: "Reviewer" },
  { id: "researcher", label: "Researcher" },
  { id: "planner", label: "Planner" },
] as const satisfies readonly GroupDefinition[];

const LANE_EXPANDED_GROUPS = ["in-progress", "for-review", "blocked"] as const;
const PERSON_EXPANDED_GROUPS = [
  "mia",
  "lynn",
  "docker-dev",
  "unassigned",
] as const;
const TYPE_EXPANDED_GROUPS = ["implementer", "reviewer", "researcher"] as const;

const LANE_VISIBLE_ROW_LIMITS = [
  { groupId: "in-progress", limit: 2 },
  { groupId: "for-review", limit: 2 },
  { groupId: "blocked", limit: 2 },
] as const satisfies readonly VisibleRowLimit[];
const PERSON_VISIBLE_ROW_LIMITS = PERSON_GROUPS.map(({ id }) => ({
  groupId: id,
  limit: 1,
}));
const TYPE_VISIBLE_ROW_LIMITS = TYPE_GROUPS.map(({ id }) => ({
  groupId: id,
  limit: 1,
}));

const expandedGroupsFor = (axis: GroupingAxis): readonly string[] => {
  if (axis === "lane") return LANE_EXPANDED_GROUPS;
  if (axis === "person") return PERSON_EXPANDED_GROUPS;
  return TYPE_EXPANDED_GROUPS;
};

const visibleRowLimitsFor = (
  axis: GroupingAxis,
): readonly VisibleRowLimit[] => {
  if (axis === "lane") return LANE_VISIBLE_ROW_LIMITS;
  if (axis === "person") return PERSON_VISIBLE_ROW_LIMITS;
  return TYPE_VISIBLE_ROW_LIMITS;
};

const LANE_VALUES: readonly Lane[] = [
  ...Array<Lane>(12).fill("planned"),
  ...Array<Lane>(21).fill("in-progress"),
  ...Array<Lane>(8).fill("for-review"),
  ...Array<Lane>(5).fill("in-review"),
  ...Array<Lane>(4).fill("blocked"),
];

const PERSON_VALUES: readonly (Person | null)[] = [
  ...Array<Person>(4).fill("mia"),
  "noor",
  ...Array<Person>(5).fill("mia"),
  ...Array<Person>(8).fill("ravi"),
  ...Array<Person>(7).fill("lynn"),
  ...Array<Person>(6).fill("docker-dev"),
  ...Array<Person>(4).fill("noor"),
  ...Array<Person>(5).fill("jeroen"),
  ...Array<Person>(4).fill("stijn"),
  ...Array<null>(6).fill(null),
];

const TYPE_VALUES: readonly WorkType[] = Array.from(
  { length: 50 },
  (_, index): WorkType => {
    if (index === 4) return "researcher";
    if (index < 28) return "implementer";
    if (index < 38) return "reviewer";
    if (index === 38) return "implementer";
    if (index < 44) return "researcher";
    return "planner";
  },
);

const MISSION_NAMES = [
  "Connector readiness",
  "Mission control",
  "Evidence handoff",
  "Review continuity",
  "Team landing pivots",
  "Runtime recovery",
  "Charter alignment",
  "Repository onboarding",
  "Workflow telemetry",
  "Design system adoption",
] as const;

const TRANSITIONS = [
  ["2026-09-09T08:12:00Z", "18 min ago"],
  ["2026-09-09T08:06:00Z", "24 min ago"],
  ["2026-09-09T07:58:00Z", "32 min ago"],
  ["2026-09-09T07:51:00Z", "39 min ago"],
  ["2026-09-09T07:43:00Z", "47 min ago"],
  ["2026-09-09T07:35:00Z", "55 min ago"],
  ["2026-09-09T07:22:00Z", "1 hr ago"],
  ["2026-09-09T07:08:00Z", "1 hr ago"],
  ["2026-09-09T06:55:00Z", "2 hr ago"],
  ["2026-09-09T06:40:00Z", "2 hr ago"],
  ["2026-09-09T06:22:00Z", "2 hr ago"],
  ["2026-09-09T06:05:00Z", "2 hr ago"],
  ["2026-09-09T05:50:00Z", "3 hr ago"],
  ["2026-09-09T05:32:00Z", "3 hr ago"],
  ["2026-09-09T05:15:00Z", "3 hr ago"],
  ["2026-09-09T04:58:00Z", "4 hr ago"],
  ["2026-09-09T04:40:00Z", "4 hr ago"],
  ["2026-09-09T04:22:00Z", "4 hr ago"],
  ["2026-09-09T04:05:00Z", "4 hr ago"],
  ["2026-09-09T03:48:00Z", "5 hr ago"],
  ["2026-09-09T03:30:00Z", "5 hr ago"],
  ["2026-09-09T03:12:00Z", "5 hr ago"],
  ["2026-09-09T02:55:00Z", "6 hr ago"],
  ["2026-09-09T02:38:00Z", "6 hr ago"],
  ["2026-09-09T02:20:00Z", "6 hr ago"],
  ["2026-09-09T02:02:00Z", "6 hr ago"],
  ["2026-09-09T01:45:00Z", "7 hr ago"],
  ["2026-09-09T01:28:00Z", "7 hr ago"],
  ["2026-09-09T01:10:00Z", "7 hr ago"],
  ["2026-09-09T00:52:00Z", "8 hr ago"],
  ["2026-09-09T00:35:00Z", "8 hr ago"],
  ["2026-09-09T00:18:00Z", "8 hr ago"],
  ["2026-09-08T23:58:00Z", "9 hr ago"],
  ["2026-09-08T23:40:00Z", "9 hr ago"],
  ["2026-09-08T23:22:00Z", "9 hr ago"],
  ["2026-09-08T23:05:00Z", "9 hr ago"],
  ["2026-09-08T22:48:00Z", "10 hr ago"],
  ["2026-09-08T22:30:00Z", "10 hr ago"],
  ["2026-09-08T22:12:00Z", "10 hr ago"],
  ["2026-09-08T21:55:00Z", "11 hr ago"],
  ["2026-09-08T21:38:00Z", "11 hr ago"],
  ["2026-09-08T21:20:00Z", "11 hr ago"],
  ["2026-09-08T21:02:00Z", "11 hr ago"],
  ["2026-09-08T20:45:00Z", "12 hr ago"],
  ["2026-09-08T20:28:00Z", "12 hr ago"],
  ["2026-09-08T20:10:00Z", "12 hr ago"],
  ["2026-09-08T19:52:00Z", "13 hr ago"],
  ["2026-09-08T19:35:00Z", "13 hr ago"],
  ["2026-09-08T19:18:00Z", "13 hr ago"],
  ["2026-09-08T19:00:00Z", "13 hr ago"],
] as const;

const laneForOrdinal = (ordinal: number, fallback: Lane): Lane => {
  if (ordinal === 1 || ordinal === 4) return "for-review";
  if (ordinal === 2 || ordinal === 3 || ordinal === 5) return "in-progress";
  if (ordinal === 6 || ordinal === 8) return "blocked";
  if (
    ordinal === 13 ||
    ordinal === 14 ||
    ordinal === 15 ||
    ordinal === 34 ||
    ordinal === 35 ||
    ordinal === 47 ||
    ordinal === 48
  )
    return "planned";
  return fallback;
};

const personForOrdinal = (
  ordinal: number,
  fallback: Person | null,
): Person | null => {
  if (ordinal === 1) return "docker-dev";
  if (ordinal === 2) return "ravi";
  if (ordinal === 3) return "mia";
  if (ordinal === 4) return "lynn";
  if (ordinal === 5) return "noor";
  if (ordinal === 6) return "stijn";
  if (ordinal === 8) return "jeroen";
  if (
    ordinal === 11 ||
    ordinal === 19 ||
    ordinal === 26 ||
    ordinal === 36 ||
    ordinal === 41
  )
    return "mia";
  return fallback;
};

const missionForOrdinal = (ordinal: number, fallback: string): string => {
  if (ordinal === 1 || ordinal === 4) return "E2E landing pivots";
  if (ordinal === 2 || ordinal === 3 || ordinal === 5 || ordinal === 6)
    return "Team landing pivots";
  if (ordinal === 8) return "Repository dossier render";
  return fallback;
};

const repositoryForOrdinal = (ordinal: number): string => {
  if (ordinal === 1 || ordinal === 4) return "e2e";
  if (
    ordinal === 2 ||
    ordinal === 3 ||
    ordinal === 5 ||
    ordinal === 6 ||
    ordinal === 8
  )
    return "saas";
  return ordinal % 2 === 0 ? "e2e" : "saas";
};

const transitionForOrdinal = (
  ordinal: number,
  fallback: readonly [string, string],
): readonly [string, string] => {
  if (ordinal === 3) return ["2026-09-09T08:12:00Z", "18 min ago"];
  if (ordinal === 2) return ["2026-09-09T07:49:00Z", "41 min ago"];
  if (ordinal === 4) return ["2026-09-09T08:18:00Z", "12 min ago"];
  if (ordinal === 1) return ["2026-09-09T06:30:00Z", "2 hr ago"];
  if (ordinal === 5) return ["2026-09-09T07:30:00Z", "1 hr ago"];
  if (ordinal === 6) return ["2026-09-09T05:30:00Z", "3 hr ago"];
  if (ordinal === 8) return ["2026-09-09T03:30:00Z", "5 hr ago"];
  return fallback;
};

const SOURCE_ORDINALS = [
  3, 2, 5, 4, 1, 6, 8, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
  42, 43, 44, 45, 46, 47, 48, 49, 50,
] as const;

const workPackages: readonly WorkPackageRecord[] = SOURCE_ORDINALS.map(
  (ordinal) => {
    const sourceIndex = ordinal - 1;
    const workPackageId = `WP${String(ordinal).padStart(2, "0")}`;
    const missionName = missionForOrdinal(
      ordinal,
      MISSION_NAMES.at(sourceIndex % MISSION_NAMES.length)!,
    );
    const repositoryId = repositoryForOrdinal(ordinal);
    const [transitionDateTime, transitionLabel] = transitionForOrdinal(
      ordinal,
      TRANSITIONS.at(sourceIndex)!,
    );
    return {
      id: `${repositoryId}:${missionName.toLowerCase().replaceAll(" ", "-")}:${workPackageId}`,
      missionName,
      workPackageId,
      repositoryId,
      lane: laneForOrdinal(ordinal, LANE_VALUES.at(sourceIndex)!),
      person: personForOrdinal(ordinal, PERSON_VALUES.at(sourceIndex)!),
      type:
        ordinal === 4
          ? "reviewer"
          : ordinal === 29
            ? "implementer"
            : TYPE_VALUES.at(sourceIndex)!,
      transitionDateTime,
      transitionLabel,
      href: `/repositories/${repositoryId}/missions/${ordinal}/work-packages/${workPackageId}`,
    };
  },
);

export const WORK_EXPLORER_FIXTURE = deepFreezeWorkExplorerFixture({
  team: { label: "Collaborative Demo Team" },
  repositories: [
    {
      id: "saas",
      label: "spec-kitty/EXPERIMENTAL-spec-kitty-saas",
      href: "/repositories/saas",
    },
    {
      id: "e2e",
      label: "spec-kitty/e2e-team-landing",
      href: "/repositories/e2e",
    },
  ],
  workPackages,
  context: {
    mission: { label: "Mission state · verified", verified: true },
    presence: {
      state: "reported-live",
      label: "Live now",
      freshness: "Reported live · ≤90s",
      entries: [
        {
          id: "presence-mia",
          person: "Mia",
          label: "WP03",
          freshness: "Reported live",
          href: "/work/spec-kitty/EXPERIMENTAL-spec-kitty-saas/WP03",
        },
        {
          id: "presence-ravi",
          person: "Ravi",
          label: "WP02",
          freshness: "Reported live",
          href: "/work/spec-kitty/EXPERIMENTAL-spec-kitty-saas/WP02",
        },
        {
          id: "presence-noor",
          person: "Noor",
          label: "WP05",
          freshness: "Reported live",
          href: "/work/spec-kitty/EXPERIMENTAL-spec-kitty-saas/WP05",
        },
      ],
    },
    activity: {
      state: "observed",
      label: "Observed activity",
      freshness: "Observed · up to 60 s behind",
      observedAt: "Last observed 14:32",
      events: [
        {
          id: "activity-1",
          text: "E2E landing pivots · WP04 · Moved to review",
          datetime: "2026-09-09T08:18:00Z",
          timestamp: "12 min ago",
          freshness: "Observed in the last 72 hours",
          trust: "Repository event",
          tone: "info",
          icon: "observe",
        },
        {
          id: "activity-2",
          text: "Team landing pivots · WP05 · Assignee changed to Noor",
          datetime: "2026-09-09T07:30:00Z",
          timestamp: "1 hr ago",
          freshness: "Observed in the last 72 hours",
          trust: "Mission history",
          tone: "success",
          icon: "assignment",
        },
        {
          id: "activity-3",
          text: "Team landing pivots · WP06 · Blocker added",
          datetime: "2026-09-09T05:30:00Z",
          timestamp: "3 hr ago",
          freshness: "Observed in the last 72 hours",
          trust: "Mission history",
          tone: "danger",
          icon: "blocker",
        },
      ],
    },
  },
} satisfies WorkExplorerFixture);

const expectedTotals = {
  lane: {
    planned: 12,
    "in-progress": 21,
    "for-review": 8,
    "in-review": 5,
    blocked: 4,
  },
  person: {
    mia: 9,
    ravi: 8,
    lynn: 7,
    "docker-dev": 6,
    noor: 5,
    jeroen: 5,
    stijn: 4,
    unassigned: 6,
  },
  type: { implementer: 28, reviewer: 10, researcher: 6, planner: 6 },
} as const;

const definitionsFor = (axis: GroupingAxis): readonly GroupDefinition[] => {
  if (axis === "lane") return LANE_GROUPS;
  if (axis === "person") return PERSON_GROUPS;
  if (axis === "type") return TYPE_GROUPS;
  throw new Error(`Unknown grouping axis: ${String(axis)}`);
};

const groupKey = (record: WorkPackageRecord, axis: GroupingAxis): string => {
  if (axis === "person") return record.person ?? "unassigned";
  if (axis === "lane") return record.lane;
  if (axis === "type") return record.type;
  throw new Error(`Unknown grouping axis: ${String(axis)}`);
};

export const groupWorkPackages = (
  records: readonly WorkPackageRecord[],
  axis: GroupingAxis,
): readonly GroupProjection[] => {
  const definitions = definitionsFor(axis);
  const knownIds = new Set(definitions.map(({ id }) => id));
  for (const record of records) {
    const key = groupKey(record, axis);
    if (!knownIds.has(key)) throw new Error(`Unknown ${axis} value: ${key}`);
  }
  const groups = definitions.map((definition) => {
    const groupRecords = Object.freeze(
      records.filter((record) => groupKey(record, axis) === definition.id),
    );
    return Object.freeze({
      ...definition,
      records: groupRecords,
      count: groupRecords.length,
    });
  });
  if (
    groups.reduce((total, group) => total + group.count, 0) !== records.length
  ) {
    throw new Error(`Grouping by ${axis} did not conserve every work package`);
  }
  return Object.freeze(groups);
};

const labelForRepository = (repositoryId: string): string =>
  WORK_EXPLORER_FIXTURE.repositories.find(({ id }) => id === repositoryId)
    ?.label ?? repositoryId;

const labelForPerson = (person: Person | null): string => {
  if (person === null) return "Unassigned";
  return PERSON_GROUPS.find(({ id }) => id === person)?.label ?? person;
};

const labelForLane = (lane: Lane): string =>
  LANE_GROUPS.find(({ id }) => id === lane)?.label ?? lane;

export const filterWorkPackages = (
  records: readonly WorkPackageRecord[],
  filters: FilterState,
): DeepReadonly<{
  sourceTotal: number;
  filteredTotal: number;
  records: readonly WorkPackageRecord[];
}> => {
  const query = filters.query.trim().toLocaleLowerCase();
  const filtered = Object.freeze(
    records.filter((record) => {
      const repositoryMatches =
        filters.repositoryId === "all" ||
        record.repositoryId === filters.repositoryId;
      const personId = record.person ?? "unassigned";
      const personMatches =
        filters.personId === "all" || personId === filters.personId;
      const visibleText = [
        record.missionName,
        record.workPackageId,
        labelForRepository(record.repositoryId),
        labelForLane(record.lane),
        labelForPerson(record.person),
        record.type,
        record.transitionLabel,
      ]
        .join(" ")
        .toLocaleLowerCase();
      return (
        repositoryMatches &&
        personMatches &&
        (query === "" || visibleText.includes(query))
      );
    }),
  );
  return Object.freeze({
    sourceTotal: records.length,
    filteredTotal: filtered.length,
    records: filtered,
  });
};

export const validateWorkExplorerFixture = (value: unknown): true => {
  if (value === null || typeof value !== "object")
    throw new Error("Fixture must be an object");
  const fixture = value as WorkExplorerFixture;
  if (
    !Array.isArray(fixture.repositories) ||
    !Array.isArray(fixture.workPackages)
  )
    throw new Error("Fixture collections are required");
  if (fixture.workPackages.length !== 50)
    throw new Error("Populated fixture must contain exactly 50 work packages");
  const repositoryIds = new Set(fixture.repositories.map(({ id }) => id));
  if (repositoryIds.size !== 2)
    throw new Error("Populated fixture must contain two unique repositories");
  const identities = new Set<string>();
  for (const record of fixture.workPackages) {
    const composite = `${record.repositoryId}:${record.missionName}:${record.workPackageId}`;
    if (identities.has(record.id) || identities.has(composite))
      throw new Error(`Duplicate Work Package identity: ${record.id}`);
    identities.add(record.id);
    identities.add(composite);
    if (!repositoryIds.has(record.repositoryId))
      throw new Error(`Unknown repository: ${record.repositoryId}`);
    if (!record.href.trim()) throw new Error(`Blank route for ${record.id}`);
  }
  for (const axis of ["lane", "person", "type"] as const) {
    const actual = Object.fromEntries(
      groupWorkPackages(fixture.workPackages, axis).map((group) => [
        group.id,
        group.count,
      ]),
    );
    const expected =
      axis === "lane"
        ? expectedTotals.lane
        : axis === "person"
          ? expectedTotals.person
          : expectedTotals.type;
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(`Unexpected ${axis} totals`);
  }
  return true;
};

validateWorkExplorerFixture(WORK_EXPLORER_FIXTURE);

const ALL_FILTERS: FilterState = {
  repositoryId: "all",
  personId: "all",
  query: "",
};

export const WORK_EXPLORER_STORY_MODELS = deepFreezeWorkExplorerFixture({
  w1: {
    id: "w1",
    grouping: "lane",
    pageState: "populated",
    filters: ALL_FILTERS,
    expandedGroupIds: LANE_EXPANDED_GROUPS,
    visibleRowLimits: LANE_VISIBLE_ROW_LIMITS,
  },
  w2: {
    id: "w2",
    grouping: "person",
    pageState: "populated",
    filters: ALL_FILTERS,
    expandedGroupIds: PERSON_EXPANDED_GROUPS,
    visibleRowLimits: PERSON_VISIBLE_ROW_LIMITS,
  },
  w3: {
    id: "w3",
    grouping: "type",
    pageState: "populated",
    filters: ALL_FILTERS,
    expandedGroupIds: TYPE_EXPANDED_GROUPS,
    visibleRowLimits: TYPE_VISIBLE_ROW_LIMITS,
  },
  w4: {
    id: "w4",
    grouping: "lane",
    pageState: "populated",
    filters: ALL_FILTERS,
    expandedGroupIds: LANE_EXPANDED_GROUPS,
    visibleRowLimits: LANE_VISIBLE_ROW_LIMITS,
  },
  w5: {
    id: "w5",
    grouping: "lane",
    pageState: "populated",
    filters: ALL_FILTERS,
    expandedGroupIds: LANE_EXPANDED_GROUPS,
    visibleRowLimits: LANE_VISIBLE_ROW_LIMITS,
    light: true,
  },
  w6: {
    id: "w6",
    grouping: "lane",
    pageState: "populated",
    filters: {
      repositoryId: "e2e",
      personId: "unassigned",
      query: "release notes",
    },
    expandedGroupIds: LANE_EXPANDED_GROUPS,
    visibleRowLimits: LANE_VISIBLE_ROW_LIMITS,
  },
  w7: {
    id: "w7",
    grouping: "lane",
    pageState: "no-work",
    filters: ALL_FILTERS,
    expandedGroupIds: [],
    visibleRowLimits: [],
  },
  w8: {
    id: "w8",
    grouping: "lane",
    pageState: "populated",
    filters: ALL_FILTERS,
    expandedGroupIds: LANE_EXPANDED_GROUPS,
    visibleRowLimits: LANE_VISIBLE_ROW_LIMITS,
    degradedContext: true,
  },
  w9: {
    id: "w9",
    grouping: "lane",
    pageState: "loading",
    filters: ALL_FILTERS,
    expandedGroupIds: [],
    visibleRowLimits: [],
  },
  w10: {
    id: "w10",
    grouping: "lane",
    pageState: "no-repositories",
    filters: ALL_FILTERS,
    expandedGroupIds: [],
    visibleRowLimits: [],
  },
} satisfies Readonly<Record<string, StoryModel>>);

type PresenceProjection =
  | WorkExplorerFixture["context"]["presence"]
  | {
      readonly state: "unavailable" | "empty";
      readonly label: string;
      readonly freshness: string;
      readonly entries: readonly PresenceRecord[];
    };

interface ActivityProjection {
  readonly state: "observed" | "delayed" | "empty";
  readonly label: string;
  readonly freshness: string;
  readonly observedAt: string | null;
  readonly delayNotice?: string;
  readonly events: readonly ActivityRecord[];
}

interface WorkExplorerProjection {
  readonly id: string;
  readonly pageState: PageState;
  readonly grouping: GroupingAxis;
  readonly filters: FilterState;
  readonly expandedGroupIds: readonly string[];
  readonly visibleRowLimits: readonly VisibleRowLimit[];
  readonly repositories: readonly RepositoryRecord[];
  readonly workPackages: readonly WorkPackageRecord[];
  readonly groups: readonly GroupProjection[];
  readonly sourceTotal: number | null;
  readonly filteredTotal: number | null;
  readonly mission: WorkExplorerFixture["context"]["mission"] | null;
  readonly presence: PresenceProjection | null;
  readonly activity: ActivityProjection | null;
}

const copyProjectionState = (
  state: DeepReadonly<StoryModel>,
): Readonly<
  Pick<
    WorkExplorerProjection,
    "filters" | "expandedGroupIds" | "visibleRowLimits"
  >
> =>
  Object.freeze({
    filters: Object.freeze({ ...state.filters }),
    expandedGroupIds: Object.freeze([...state.expandedGroupIds]),
    visibleRowLimits: Object.freeze(
      state.visibleRowLimits.map((descriptor) =>
        Object.freeze({ ...descriptor }),
      ),
    ),
  });

const freezeProjection = (
  projection: WorkExplorerProjection,
): DeepReadonly<WorkExplorerProjection> =>
  Object.freeze(projection) as DeepReadonly<WorkExplorerProjection>;

export const projectWorkExplorer = (
  fixture: DeepReadonly<WorkExplorerFixture>,
  state: DeepReadonly<StoryModel>,
): DeepReadonly<WorkExplorerProjection> => {
  validateWorkExplorerFixture(fixture);
  const projectionState = copyProjectionState(state);
  if (state.pageState === "loading" || state.pageState === "no-repositories") {
    return freezeProjection({
      id: state.id,
      pageState: state.pageState,
      grouping: state.grouping,
      ...projectionState,
      repositories: Object.freeze([]),
      workPackages: Object.freeze([]),
      groups: Object.freeze([]),
      sourceTotal: null,
      filteredTotal: null,
      mission: null,
      presence: null,
      activity: null,
    });
  }
  if (state.pageState === "no-work") {
    return freezeProjection({
      id: state.id,
      pageState: state.pageState,
      grouping: state.grouping,
      ...projectionState,
      repositories: Object.freeze([...fixture.repositories]),
      workPackages: Object.freeze([]),
      groups: Object.freeze([]),
      sourceTotal: null,
      filteredTotal: null,
      mission: fixture.context.mission,
      presence: Object.freeze({
        state: "empty",
        label: "Live now",
        freshness: fixture.context.presence.freshness,
        entries: Object.freeze([]),
      }),
      activity: Object.freeze({
        state: "empty",
        label: "Observed activity",
        freshness: fixture.context.activity.freshness,
        observedAt: null,
        events: Object.freeze([]),
      }),
    });
  }
  const filtered = filterWorkPackages(fixture.workPackages, state.filters);
  return freezeProjection({
    id: state.id,
    pageState: state.pageState,
    grouping: state.grouping,
    ...projectionState,
    repositories: Object.freeze([...fixture.repositories]),
    workPackages: filtered.records,
    groups: groupWorkPackages(filtered.records, state.grouping),
    sourceTotal: filtered.sourceTotal,
    filteredTotal: filtered.filteredTotal,
    mission: fixture.context.mission,
    presence: state.degradedContext
      ? Object.freeze({
          state: "unavailable",
          label: "Live unavailable",
          freshness: "Mission state is unaffected",
          entries: Object.freeze([]),
        })
      : fixture.context.presence,
    activity: state.degradedContext
      ? Object.freeze({
          state: "delayed",
          label: fixture.context.activity.label,
          freshness: "Observed · delayed",
          observedAt: fixture.context.activity.observedAt,
          delayNotice: "Last observed 18 min ago",
          events: fixture.context.activity.events,
        })
      : fixture.context.activity,
  });
};

const workExplorerPatternStyles = html`<style>
  .sk-work-explorer-pattern {
    min-inline-size: 0;
    min-block-size: 100%;
    background: var(--sk-surface-page);
    color: var(--sk-fg-body);
    font-family: var(--sk-font-sans);
  }

  .sk-work-explorer-pattern__content,
  .sk-work-explorer-pattern__work,
  .sk-work-explorer-pattern__context,
  .sk-work-explorer-pattern__collections,
  .sk-work-explorer-pattern__context-region,
  .sk-work-explorer-pattern__loading-region {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-inline-size: 0;
    gap: var(--sk-space-4);
  }

  .sk-work-explorer-pattern__content {
    gap: var(--sk-space-5);
    padding: var(--sk-space-5);
  }

  .sk-work-explorer-pattern__page-header::part(header) {
    padding: var(--sk-space-5);
  }

  .sk-work-explorer-pattern__page-title,
  .sk-work-explorer-pattern__page-supporting {
    margin: 0;
  }

  .sk-work-explorer-pattern__page-title {
    font-size: var(--sk-text-3xl);
  }

  .sk-work-explorer-pattern__summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sk-space-4);
    margin: 0;
    padding-block: var(--sk-space-3);
    border-block-end-color: var(--sk-border-default);
    border-block-end-style: solid;
    border-block-end-width: var(--sk-border-width-1);
  }

  .sk-work-explorer-pattern__summary-total,
  .sk-work-explorer-pattern__summary-facts {
    margin: 0;
  }

  .sk-work-explorer-pattern__summary-facts,
  .sk-work-explorer-pattern__summary-item {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sk-space-2);
  }

  .sk-work-explorer-pattern__summary-facts {
    gap: var(--sk-space-4);
  }

  .sk-work-explorer-pattern__summary-item dt {
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
  }

  .sk-work-explorer-pattern__summary-item dd {
    order: -1;
    margin: 0;
    color: var(--sk-fg-default);
    font-weight: var(--sk-weight-semibold);
  }

  .sk-work-explorer-pattern__summary-item[data-summary-lane="blocked"] dt,
  .sk-work-explorer-pattern__summary-item[data-summary-lane="blocked"] dd {
    color: var(--sk-on-tint-rose);
  }

  .sk-work-explorer-pattern__filters {
    display: grid;
    grid-template-columns:
      minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)
      minmax(0, 2fr);
    gap: var(--sk-space-3);
    align-items: end;
    min-inline-size: 0;
    padding: var(--sk-space-3);
    border-color: var(--sk-border-default);
    border-style: solid;
    border-width: var(--sk-border-width-1);
    border-radius: var(--sk-radius-md);
    background: var(--sk-surface-muted);
  }

  .sk-work-explorer-pattern__grouping,
  .sk-work-explorer-pattern__filter-field,
  .sk-work-explorer-pattern__search,
  .sk-work-explorer-pattern__filter-actions {
    min-inline-size: 0;
  }

  .sk-work-explorer-pattern__filter-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-2);
    grid-column: 1 / -1;
  }

  .sk-work-explorer-pattern__visually-hidden {
    position: absolute;
    overflow: hidden;
    inline-size: var(--sk-border-width-1);
    block-size: var(--sk-border-width-1);
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .sk-work-explorer-pattern__layout::part(grid) {
    grid-template-columns: minmax(0, 7fr) minmax(
        var(--sk-layout-context-sidebar-width),
        3fr
      );
    align-items: start;
    min-inline-size: 0;
  }

  .sk-work-explorer-pattern__collection-header {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  .sk-work-explorer-pattern__collection-toggle {
    grid-column: auto;
    padding: var(--sk-space-1) var(--sk-space-2);
  }

  .sk-work-explorer-pattern__collection-body {
    padding: 0;
  }

  .sk-work-explorer-pattern__row-item {
    padding-block: 0;
  }

  .sk-work-explorer-pattern__row::part(trigger) {
    padding-block: var(--sk-space-2);
  }

  .sk-work-explorer-pattern__collection-footer {
    margin-block-start: 0;
    padding-block-start: 0;
  }

  .sk-work-explorer-pattern__blocked-collection {
    border-inline-start-color: var(--sk-on-status-danger);
    border-inline-start-width: var(--sk-border-width-4);
  }

  .sk-work-explorer-pattern__blocked-heading,
  .sk-work-explorer-pattern__blocked-count,
  .sk-work-explorer-pattern__blocked-toggle {
    color: var(--sk-on-status-danger);
  }

  .sk-work-explorer-pattern__row-list {
    margin: 0;
    padding-inline-start: 0;
    list-style: none;
  }

  .sk-work-explorer-pattern__presence-list {
    display: grid;
    gap: var(--sk-space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .sk-work-explorer-pattern__presence-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sk-space-3);
    min-inline-size: 0;
    padding: var(--sk-space-2);
    border-radius: var(--sk-radius-md);
    color: var(--sk-fg-body);
    text-decoration: none;
  }

  .sk-work-explorer-pattern__presence-link:hover {
    background: var(--sk-surface-pill);
  }

  .sk-work-explorer-pattern__presence-link:focus-visible {
    outline-color: var(--sk-border-focus);
    outline-style: solid;
    outline-width: var(--sk-border-width-2);
  }

  .sk-work-explorer-pattern__presence-person {
    display: flex;
    align-items: center;
    gap: var(--sk-space-2);
    min-inline-size: 0;
  }

  .sk-work-explorer-pattern__presence-copy,
  .sk-work-explorer-pattern__presence-note,
  .sk-work-explorer-pattern__observed-at {
    margin: 0;
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
  }

  .sk-work-explorer-pattern__activity-list
    .sk-work-explorer-pattern__activity-marker[data-activity-tone="info"] {
    border-color: var(--sk-on-status-info);
    background: var(--sk-status-info);
    color: var(--sk-on-status-info);
  }

  .sk-work-explorer-pattern__activity-list
    .sk-work-explorer-pattern__activity-marker[data-activity-tone="success"] {
    border-color: var(--sk-on-status-success);
    background: var(--sk-status-success);
    color: var(--sk-on-status-success);
  }

  .sk-work-explorer-pattern__activity-list
    .sk-work-explorer-pattern__activity-marker[data-activity-tone="danger"] {
    border-color: var(--sk-on-status-danger);
    background: var(--sk-status-danger);
    color: var(--sk-on-status-danger);
  }

  .sk-work-explorer-pattern__collection-more {
    inline-size: 100%;
    padding: var(--sk-space-3);
    border: 0;
    background: transparent;
    color: var(--sk-fg-muted);
    font: inherit;
    text-align: center;
  }

  .sk-work-explorer-pattern__collection-more:focus-visible {
    outline-color: var(--sk-border-focus);
    outline-style: solid;
    outline-width: var(--sk-border-width-2);
  }

  .sk-work-explorer-pattern__context-meta,
  .sk-work-explorer-pattern__row-time {
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
  }

  .sk-work-explorer-pattern__empty-actions,
  .sk-work-explorer-pattern__compact-header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-3);
    align-items: center;
  }

  .sk-work-explorer-pattern__rail-link,
  .sk-work-explorer-pattern__drawer-trigger,
  .sk-work-explorer-pattern__context-link {
    color: var(--sk-fg-default);
  }

  .sk-work-explorer-pattern__current-work {
    --sk-color-accent: var(--sk-surface-pill);
  }

  .sk-work-explorer-pattern__current-work:focus-visible {
    outline-color: var(--sk-border-focus);
  }

  .sk-work-explorer-pattern__presence-card::part(card) {
    padding: var(--sk-space-4);
  }

  .sk-work-explorer-pattern__drawer-trigger {
    padding: var(--sk-space-2) var(--sk-space-3);
    border-color: var(--sk-border-default);
    border-style: solid;
    border-width: var(--sk-border-width-1);
    border-radius: var(--sk-radius-md);
    background: var(--sk-surface-card);
    font: inherit;
  }

  .sk-work-explorer-pattern__drawer-trigger:focus-visible {
    outline-color: var(--sk-border-focus);
    outline-style: solid;
    outline-width: var(--sk-border-width-2);
  }

  .sk-work-explorer-pattern__skeleton {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sk-space-3);
  }

  .sk-work-explorer-pattern__skeleton-shape {
    min-block-size: var(--sk-space-12);
    border-radius: var(--sk-radius-md);
    background: var(--sk-surface-muted);
  }

  .sk-work-explorer-pattern__compact-header:not([inert])
    ~ .sk-work-explorer-pattern__content
    .sk-work-explorer-pattern__layout::part(grid) {
    grid-template-columns: minmax(0, 1fr);
  }

  .sk-work-explorer-pattern__compact-header:not([inert])
    ~ .sk-work-explorer-pattern__content {
    gap: var(--sk-space-4);
    padding: var(--sk-space-4);
  }

  .sk-work-explorer-pattern__compact-header:not([inert])
    ~ .sk-work-explorer-pattern__content
    .sk-work-explorer-pattern__context {
    grid-template-columns: repeat(
      auto-fit,
      minmax(min(100%, var(--sk-layout-context-sidebar-width)), 1fr)
    );
    align-items: start;
    gap: var(--sk-space-2);
  }

  .sk-work-explorer-pattern__compact-header:not([inert])
    ~ .sk-work-explorer-pattern__content
    .sk-work-explorer-pattern__context-region {
    gap: var(--sk-space-2);
  }

  .sk-work-explorer-pattern__compact-header:not([inert])
    ~ .sk-work-explorer-pattern__content
    .sk-work-explorer-pattern__presence-card::part(card) {
    padding: 0;
    border-width: 0;
    background: transparent;
  }

  .sk-work-explorer-pattern__compact-header:not([inert])
    ~ .sk-work-explorer-pattern__content
    .sk-work-explorer-pattern__filters {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .sk-work-explorer-pattern__compact-header:not([inert])
    ~ .sk-work-explorer-pattern__content
    .sk-work-explorer-pattern__search,
  .sk-work-explorer-pattern__compact-header:not([inert])
    ~ .sk-work-explorer-pattern__content
    .sk-work-explorer-pattern__filter-actions {
    grid-column: 1 / -1;
  }

  @media (forced-colors: active) {
    .sk-work-explorer-pattern__filters,
    .sk-work-explorer-pattern__blocked-collection {
      outline-color: CanvasText;
      outline-style: solid;
      outline-width: var(--sk-border-width-1);
    }

    .sk-work-explorer-pattern__activity-list
      .sk-work-explorer-pattern__activity-marker[data-activity-tone] {
      border-color: CanvasText;
      background: Canvas;
      color: CanvasText;
    }
  }
</style>`;

const renderPersonalRail = (): TemplateResult => html`
  <sk-personal-rail
    slot="personal-rail"
    label=${WORK_EXPLORER_FIXTURE.team.label}
  >
    <a
      class="sk-work-explorer-pattern__rail-link"
      slot="primary"
      href="/"
      aria-label="Spec Kitty home"
      >SK</a
    >
    <a
      class="sk-work-explorer-pattern__rail-link"
      slot="primary"
      href="/work"
      aria-current="page"
      aria-label="Work Explorer"
      >W</a
    >
    <a
      class="sk-work-explorer-pattern__rail-link"
      slot="account"
      href="/account"
      aria-label="Account"
      >A</a
    >
    <a
      class="sk-work-explorer-pattern__rail-link"
      slot="logout"
      href="/sign-out"
      aria-label="Sign out"
      >O</a
    >
  </sk-personal-rail>
`;

const renderContextNavigation = (
  placement: "desktop" | "compact",
): TemplateResult => html`
  <sk-context-sidebar
    slot=${placement === "desktop" ? "context-sidebar" : "compact-navigation"}
    id=${placement === "compact" ? "work-explorer-navigation" : nothing}
    label=${placement === "desktop" ? "Work context" : "Compact Work context"}
  >
    <div slot="header">
      <strong>${WORK_EXPLORER_FIXTURE.team.label}</strong>
    </div>
    <nav
      class="sk-context-nav sk-work-explorer-pattern__context-nav"
      aria-label=${placement === "desktop" ? "Work sections" : "Compact Work sections"}
    >
      <div class="sk-context-nav__group">
        <p class="sk-context-nav__heading">Explore</p>
        <ul class="sk-context-nav__list">
          <li class="sk-context-nav__item">
            <a
              class="sk-context-nav__link sk-work-explorer-pattern__current-work"
              href="/work"
              aria-current="page"
              ><span class="sk-context-nav__label">Work Explorer</span></a
            >
          </li>
          <li class="sk-context-nav__item">
            <a class="sk-context-nav__link" href="/missions"
              ><span class="sk-context-nav__label">Missions</span></a
            >
          </li>
          <li class="sk-context-nav__item">
            <a class="sk-context-nav__link" href="/repositories"
              ><span class="sk-context-nav__label">Repositories</span></a
            >
          </li>
        </ul>
      </div>
    </nav>
  </sk-context-sidebar>
`;

const renderPageHeader = (
  projection: DeepReadonly<WorkExplorerProjection>,
): TemplateResult => html`
  <sk-page-header
    class="sk-work-explorer-pattern__page-header"
    slot="page-header"
  >
    <span slot="eyebrow">Work Explorer</span>
    <h1 class="sk-work-explorer-pattern__page-title" slot="title">
      Who is doing what, now
    </h1>
    <p class="sk-work-explorer-pattern__page-supporting" slot="supporting">
      Illustrative workload
    </p>
    ${
      projection.mission
        ? html`<sk-status-indicator slot="sync" tone="success"
            ><svg slot="marker" aria-hidden="true" viewBox="0 0 12 12">
              <path d="m2 6 3 3 5-6"></path></svg
            >${projection.mission.label}</sk-status-indicator
          >`
        : nothing
    }
  </sk-page-header>
`;

const renderSummary = (): TemplateResult => {
  const laneGroups = groupWorkPackages(
    WORK_EXPLORER_FIXTURE.workPackages,
    "lane",
  );
  return html`<section
    class="sk-work-explorer-pattern__summary"
    aria-label="Verified work summary"
  >
    <p class="sk-work-explorer-pattern__summary-total" data-active-work-summary>
      <strong
        >${WORK_EXPLORER_FIXTURE.workPackages.length} active Work
        Packages</strong
      >
      across
      <strong
        >${WORK_EXPLORER_FIXTURE.repositories.length} admitted
        repositories</strong
      >
    </p>
    <dl class="sk-work-explorer-pattern__summary-facts">
      ${laneGroups.map(
        (group) => html`
          <div
            class="sk-work-explorer-pattern__summary-item"
            data-summary-lane=${group.id}
          >
            <dt>${group.label}</dt>
            <dd>${group.count}</dd>
          </div>
        `,
      )}
    </dl>
  </section>`;
};

const renderWorkRow = (
  record: DeepReadonly<WorkPackageRecord>,
  grouping: GroupingAxis,
): TemplateResult => html`
  <li
    class="sk-collection__item sk-work-explorer-pattern__row-item"
    data-work-package-id=${record.id}
  >
    <sk-action-row
      class="sk-work-explorer-pattern__row"
      row-id=${record.id}
      href=${record.href}
      presentation="flush"
    >
      <sk-entity-marker
        slot="marker"
        size="sm"
        shape="circle"
        label=${record.missionName}
        >${record.missionName.slice(0, 1)}</sk-entity-marker
      >
      <span slot="title">${record.missionName} · ${record.workPackageId}</span>
      <code slot="reference">${labelForRepository(record.repositoryId)}</code>
      ${
        grouping === "lane"
          ? nothing
          : html`<sk-pill-tag slot="tags" data-row-tag-axis="lane"
              >${labelForLane(record.lane)}</sk-pill-tag
            >`
      }
      ${
        grouping === "person"
          ? nothing
          : html`<sk-pill-tag slot="tags" data-row-tag-axis="person"
              >${labelForPerson(record.person)}</sk-pill-tag
            >`
      }
      ${
        grouping === "type"
          ? nothing
          : html`<sk-pill-tag slot="tags" data-row-tag-axis="type"
              >${record.type}</sk-pill-tag
            >`
      }
      <time
        class="sk-work-explorer-pattern__row-time"
        slot="metadata"
        datetime=${record.transitionDateTime}
        >${record.transitionLabel}</time
      >
    </sk-action-row>
  </li>
`;

const renderCollection = (
  group: DeepReadonly<GroupProjection>,
  grouping: GroupingAxis,
  expandedGroupIds: readonly string[],
  visibleRowLimits: readonly DeepReadonly<VisibleRowLimit>[],
  fullyVisibleGroupIds: ReadonlySet<string>,
  onToggle: (groupId: string) => void,
  onViewAll: (groupId: string) => void,
): TemplateResult => {
  const headingId = `work-explorer-${group.id}-heading`;
  const bodyId = `work-explorer-${group.id}-body`;
  const expanded = expandedGroupIds.includes(group.id);
  const suppliedLimit =
    visibleRowLimits.find(({ groupId }) => groupId === group.id)?.limit ??
    group.count;
  const fullyVisible = fullyVisibleGroupIds.has(group.id);
  const visibleRecords = expanded
    ? group.records.slice(0, fullyVisible ? group.count : suppliedLimit)
    : [];
  const remaining = group.count - visibleRecords.length;
  return html` <section
    class=${`sk-collection${group.tone === "danger" ? " sk-work-explorer-pattern__blocked-collection" : ""}`}
    data-work-group=${group.id}
    data-blocked-exception=${group.tone === "danger" ? "" : nothing}
    aria-labelledby=${headingId}
  >
    <header
      class="sk-collection__header sk-work-explorer-pattern__collection-header"
    >
      <h3
        class=${`sk-collection__heading${group.tone === "danger" ? " sk-work-explorer-pattern__blocked-heading" : ""}`}
        id=${headingId}
      >
        ${group.label}${group.tone === "danger" ? " · exception" : nothing}
      </h3>
      <span
        class=${`sk-collection__count${group.tone === "danger" ? " sk-work-explorer-pattern__blocked-count" : ""}`}
        >${group.count} Work Packages</span
      >
      <button
        class=${`sk-collection__toggle sk-work-explorer-pattern__collection-toggle${group.tone === "danger" ? " sk-work-explorer-pattern__blocked-toggle" : ""}`}
        type="button"
        aria-expanded=${String(expanded)}
        aria-controls=${bodyId}
        @click=${() => onToggle(group.id)}
      >
        <span class="sk-collection__marker" aria-hidden="true">›</span>
        <span class="sk-collection__state-label"
          >${expanded ? "Hide" : "Show"}</span
        >
        <span>${group.label}</span>
      </button>
    </header>
    <div
      class="sk-collection__body sk-work-explorer-pattern__collection-body"
      id=${bodyId}
      role="region"
      aria-labelledby=${headingId}
      ?hidden=${!expanded}
    >
      <ul class="sk-collection__list sk-work-explorer-pattern__row-list">
        ${visibleRecords.map((record) => renderWorkRow(record, grouping))}
      </ul>
      ${
        suppliedLimit < group.count
          ? html`<footer
              class="sk-collection__footer sk-work-explorer-pattern__collection-footer"
            >
              <button
                class="sk-work-explorer-pattern__collection-more"
                type="button"
                data-view-toggle=${group.id}
                @click=${() => onViewAll(group.id)}
              >
                ${
                  fullyVisible
                    ? `Show fewer ${group.label.toLocaleLowerCase()}`
                    : `View ${remaining} more ${group.label.toLocaleLowerCase()}`
                }
              </button>
            </footer>`
          : nothing
      }
    </div>
  </section>`;
};

const renderFilteredWork = (
  projection: DeepReadonly<WorkExplorerProjection>,
  onClear: () => void,
  fullyVisibleGroupIds: ReadonlySet<string>,
  onToggle: (groupId: string) => void,
  onViewAll: (groupId: string) => void,
): TemplateResult =>
  projection.filteredTotal === 0
    ? html`<div class="sk-empty-state" data-filtered-empty>
        <h3>No Work Packages match these filters</h3>
        <p>0 of ${projection.sourceTotal} supplied Work Packages shown.</p>
        <div class="sk-work-explorer-pattern__empty-actions">
          <sk-button variant="secondary" @click=${onClear}
            >Clear filters</sk-button
          >
        </div>
      </div>`
    : html`<div
        class="sk-work-explorer-pattern__collections"
        data-group-axis=${projection.grouping}
      >
        ${projection.groups.map((group) =>
          renderCollection(
            group,
            projection.grouping,
            projection.expandedGroupIds,
            projection.visibleRowLimits,
            fullyVisibleGroupIds,
            onToggle,
            onViewAll,
          ),
        )}
      </div>`;

const renderFilters = (
  projection: DeepReadonly<WorkExplorerProjection>,
  disabled: boolean,
  onGrouping: (axis: GroupingAxis) => void,
  onFilter: (key: keyof FilterState, value: string) => void,
  onClear: () => void,
): TemplateResult => {
  const filtersActive =
    projection.filters.repositoryId !== "all" ||
    projection.filters.personId !== "all" ||
    projection.filters.query.trim() !== "";
  const selectedRepositoryLabel =
    projection.filters.repositoryId === "all"
      ? "All repositories"
      : (projection.repositories.find(
          ({ id }) => id === projection.filters.repositoryId,
        )?.label ?? projection.filters.repositoryId);
  const filterTotalsAvailable =
    projection.filteredTotal !== null && projection.sourceTotal !== null;
  return html`<form
    class="sk-work-explorer-pattern__filters"
    aria-label="Work filters"
    @submit=${(event: Event) => event.preventDefault()}
  >
    <div class="sk-work-explorer-pattern__grouping sk-form-field">
      <span
        class="sk-form-field__label sk-work-explorer-pattern__visually-hidden"
        id=${`grouping-label-${projection.id}`}
        >Group work by</span
      >
      <div
        class="sk-segmented-choice"
        role="group"
        aria-labelledby=${`grouping-label-${projection.id}`}
      >
        ${(["lane", "person", "type"] as const).map(
          (axis) => html`
            <button
              class="sk-segmented-choice__item"
              type="button"
              data-grouping=${axis}
              aria-pressed=${String(projection.grouping === axis)}
              ?disabled=${disabled}
              @click=${() => onGrouping(axis)}
            >
              ${axis === "lane" ? "Lane" : axis === "person" ? "Person" : "Type"}
            </button>
          `,
        )}
      </div>
    </div>
    <label class="sk-work-explorer-pattern__filter-field sk-form-field">
      <span
        class="sk-form-field__label sk-work-explorer-pattern__visually-hidden"
        >Repository</span
      >
      <select
        class="sk-form-select"
        data-filter="repositoryId"
        title=${selectedRepositoryLabel}
        ?disabled=${disabled}
        .value=${projection.filters.repositoryId}
        @change=${(event: Event) => onFilter("repositoryId", (event.currentTarget as HTMLSelectElement).value)}
      >
        <option
          value="all"
          ?selected=${projection.filters.repositoryId === "all"}
        >
          All repositories
        </option>
        ${
          disabled
            ? nothing
            : projection.repositories.map(
                (repository) =>
                  html`<option
                    value=${repository.id}
                    ?selected=${projection.filters.repositoryId === repository.id}
                  >
                    ${repository.label}
                  </option>`,
              )
        }
      </select>
    </label>
    <label class="sk-work-explorer-pattern__filter-field sk-form-field">
      <span
        class="sk-form-field__label sk-work-explorer-pattern__visually-hidden"
        >Person</span
      >
      <select
        class="sk-form-select"
        data-filter="personId"
        ?disabled=${disabled}
        .value=${projection.filters.personId}
        @change=${(event: Event) => onFilter("personId", (event.currentTarget as HTMLSelectElement).value)}
      >
        <option value="all" ?selected=${projection.filters.personId === "all"}>
          All people
        </option>
        ${
          disabled
            ? nothing
            : PERSON_GROUPS.map(
                (person) =>
                  html`<option
                    value=${person.id}
                    ?selected=${projection.filters.personId === person.id}
                  >
                    ${person.label}
                  </option>`,
              )
        }
      </select>
    </label>
    <label class="sk-work-explorer-pattern__search sk-form-field">
      <span
        class="sk-form-field__label sk-work-explorer-pattern__visually-hidden"
        >Search supplied work fields</span
      >
      <input
        class="sk-input"
        type="search"
        data-filter="query"
        placeholder="Search work packages"
        ?disabled=${disabled}
        .value=${projection.filters.query}
        @input=${(event: Event) => onFilter("query", (event.currentTarget as HTMLInputElement).value)}
      />
    </label>
    ${
      filtersActive && !disabled
        ? html`<div class="sk-work-explorer-pattern__filter-actions">
            <sk-button variant="secondary" data-clear-filters @click=${onClear}
              >Clear filters</sk-button
            >
            ${
              filterTotalsAvailable
                ? html`<span data-filter-count
                    >${projection.filteredTotal} of
                    ${projection.sourceTotal}</span
                  >`
                : nothing
            }
          </div>`
        : nothing
    }
  </form>`;
};

const renderPresence = (
  presence: DeepReadonly<PresenceProjection>,
): TemplateResult =>
  html` <section
    class="sk-work-explorer-pattern__context-region"
    aria-labelledby="work-explorer-live-heading"
    data-truth-tier="presence"
  >
    <sk-section-header>
      <span slot="eyebrow">Reported presence</span>
      <h2 slot="title" id="work-explorer-live-heading">${presence.label}</h2>
      <span slot="metadata">${presence.freshness}</span>
    </sk-section-header>
    ${
      presence.state === "unavailable"
        ? html`<sk-notice
            tone="info"
            announce="off"
            message="Presence is unavailable. Mission state is unaffected."
            ><h3 slot="heading">Presence unavailable</h3></sk-notice
          >`
        : presence.state === "empty"
          ? html`<div class="sk-empty-state sk-empty-state--inline">
              <h3>No reported-live presence</h3>
              <p>There are no supplied presence records.</p>
            </div>`
          : html`<sk-card class="sk-work-explorer-pattern__presence-card">
                <p class="sk-work-explorer-pattern__presence-copy">
                  Current relay sessions only. Activity does not imply presence.
                </p>
                <ul class="sk-work-explorer-pattern__presence-list">
                  ${presence.entries.map(
                    (entry) =>
                      html`<li>
                        <a
                          class="sk-work-explorer-pattern__presence-link"
                          data-live-focus
                          href=${entry.href}
                          aria-label=${`${entry.person} working on ${entry.label}`}
                        >
                          <span
                            class="sk-work-explorer-pattern__presence-person"
                          >
                            <sk-entity-marker
                              size="sm"
                              shape="circle"
                              label=${entry.person}
                              >${entry.person.slice(0, 1)}</sk-entity-marker
                            >
                            <sk-status-indicator tone="success">
                              <svg
                                slot="marker"
                                aria-hidden="true"
                                viewBox="0 0 12 12"
                              >
                                <circle cx="6" cy="6" r="4"></circle>
                              </svg>
                              <span
                                class="sk-work-explorer-pattern__visually-hidden"
                                >${entry.freshness}</span
                              >
                            </sk-status-indicator>
                            <span>${entry.person} · ${entry.label}</span>
                          </span>
                        </a>
                      </li>`,
                  )}
                </ul>
              </sk-card>
              <p class="sk-work-explorer-pattern__presence-note">
                Relay status affects presence only.
              </p>`
    }
  </section>`;

const renderActivityIcon = (icon: ActivityIcon): TemplateResult => {
  if (icon === "observe") {
    return html`<svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>`;
  }
  if (icon === "assignment") {
    return html`<svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M4 21a8 8 0 0 1 16 0"></path>
    </svg>`;
  }
  return html`<svg aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="m6 6 12 12"></path>
  </svg>`;
};

const renderActivity = (
  activity: DeepReadonly<ActivityProjection>,
): TemplateResult =>
  html` <section
    class="sk-work-explorer-pattern__context-region"
    aria-labelledby="work-explorer-activity-heading"
    data-truth-tier="activity"
  >
    <sk-section-header>
      <span slot="eyebrow">Observed history</span>
      <h2 slot="title" id="work-explorer-activity-heading">
        ${activity.label}
      </h2>
      <span slot="metadata">${activity.freshness}</span>
    </sk-section-header>
    ${
      activity.state === "empty"
        ? html`<p class="sk-empty-state sk-empty-state--inline">
            No activity in the last 72 hours.
          </p>`
        : html`${
              activity.state === "delayed"
                ? html`<sk-notice
                    tone="attention"
                    announce="off"
                    message="Activity may be delayed. Work Package state remains current."
                  >
                    <h3 slot="heading">${activity.delayNotice}</h3>
                  </sk-notice>`
                : nothing
            }
            <ol
              class="sk-event-timeline sk-event-timeline--compact sk-work-explorer-pattern__activity-list"
              data-activity-state=${activity.state}
              aria-label="Observed Work Package events"
            >
              ${activity.events.map(
                (event) =>
                  html`<li class="sk-event-timeline__item">
                  <span
                    class="sk-event-timeline__leading-marker sk-work-explorer-pattern__activity-marker"
                    data-activity-tone=${event.tone}
                    aria-hidden="true"
                    >${renderActivityIcon(event.icon)}</span
                  >
                  <p class="sk-event-timeline__summary">${event.text}</p>
                  <p class="sk-event-timeline__metadata">
                    <time datetime=${event.datetime}>${event.timestamp}</time
                    ><span>${event.trust}</span><span>${event.freshness}</span
                  </p>
                </li>`,
              )}
            </ol>
            ${
              activity.observedAt
                ? html`<p class="sk-work-explorer-pattern__observed-at">
                    ${activity.observedAt}
                  </p>`
                : nothing
            }`
    }
  </section>`;

const renderContext = (
  projection: DeepReadonly<WorkExplorerProjection>,
): TemplateResult =>
  projection.presence && projection.activity
    ? html`<aside
        class="sk-work-explorer-pattern__context"
        aria-label="Supplied work context"
      >
        ${renderPresence(projection.presence)}
        ${renderActivity(projection.activity)}
      </aside>`
    : nothing;

const renderLoadingRegion = (
  label: string,
  kind: "work" | "context",
): TemplateResult =>
  html` <section
    class="sk-work-explorer-pattern__loading-region"
    aria-label=${label}
    aria-busy="true"
  >
    <div class="sk-work-explorer-pattern__skeleton" aria-hidden="true">
      <span class="sk-work-explorer-pattern__skeleton-shape"></span>
      <span class="sk-work-explorer-pattern__skeleton-shape"></span>
      ${
        kind === "work"
          ? html`<span class="sk-work-explorer-pattern__skeleton-shape"></span>
              <span class="sk-work-explorer-pattern__skeleton-shape"></span>`
          : nothing
      }
    </div>
  </section>`;

const formatAdmittedRepositories = (count: number): string =>
  `${count} admitted ${count === 1 ? "repository" : "repositories"}`;

const renderWorkBody = (
  projection: DeepReadonly<WorkExplorerProjection>,
  onClear: () => void,
  fullyVisibleGroupIds: ReadonlySet<string>,
  onToggle: (groupId: string) => void,
  onViewAll: (groupId: string) => void,
): TemplateResult => {
  if (projection.pageState === "no-work") {
    return html`<div class="sk-empty-state" data-no-active-work>
      <h3>No active Work Packages</h3>
      <p>
        The ${formatAdmittedRepositories(projection.repositories.length)}
        currently supply no active Mission work.
      </p>
    </div>`;
  }
  return renderFilteredWork(
    projection,
    onClear,
    fullyVisibleGroupIds,
    onToggle,
    onViewAll,
  );
};

const connectCompactControls = (
  shellRef: Ref<SkAppShell>,
  triggerRef: Ref<HTMLButtonElement>,
): void => {
  const shell = shellRef.value;
  const trigger = triggerRef.value;
  if (shell && trigger) shell.compactTrigger = trigger;
};

/** Renders Work Explorer adoption evidence without publishing an application surface. */
export const renderWorkExplorer = (
  initialState: DeepReadonly<StoryModel>,
): TemplateResult => {
  let currentState: StoryModel = {
    id: initialState.id,
    grouping: initialState.grouping,
    pageState: initialState.pageState,
    filters: { ...initialState.filters },
    expandedGroupIds: [...initialState.expandedGroupIds],
    visibleRowLimits: [...initialState.visibleRowLimits],
    light: initialState.light,
    degradedContext: initialState.degradedContext,
  };
  const fullyVisibleGroupIds = new Set<string>();
  let currentProjection = projectWorkExplorer(
    WORK_EXPLORER_FIXTURE,
    currentState,
  );
  const shellRef = createRef<SkAppShell>();
  const triggerRef = createRef<HTMLButtonElement>();
  const filtersRef = createRef<HTMLElement>();
  const workRef = createRef<HTMLElement>();
  const rootRef = createRef<HTMLElement>();

  const refresh = (): void => {
    currentProjection = projectWorkExplorer(
      WORK_EXPLORER_FIXTURE,
      currentState,
    );
    if (filtersRef.value) {
      render(
        renderFilters(
          currentProjection,
          false,
          setGrouping,
          setFilter,
          clearFilters,
        ),
        filtersRef.value,
      );
    }
    if (workRef.value) {
      render(
        renderWorkBody(
          currentProjection,
          clearFilters,
          fullyVisibleGroupIds,
          toggleGroup,
          viewAllRows,
        ),
        workRef.value,
      );
    }
    if (rootRef.value) {
      rootRef.value.dataset["grouping"] = currentProjection.grouping;
      rootRef.value.dataset["filteredTotal"] = String(
        currentProjection.filteredTotal,
      );
    }
  };

  function setGrouping(axis: GroupingAxis): void {
    currentState = {
      ...currentState,
      grouping: axis,
      expandedGroupIds: expandedGroupsFor(axis),
      visibleRowLimits: visibleRowLimitsFor(axis),
    };
    fullyVisibleGroupIds.clear();
    refresh();
  }

  function setFilter(key: keyof FilterState, value: string): void {
    currentState = {
      ...currentState,
      filters: { ...currentState.filters, [key]: value },
    };
    fullyVisibleGroupIds.clear();
    refresh();
  }

  function clearFilters(): void {
    currentState = { ...currentState, filters: { ...ALL_FILTERS } };
    fullyVisibleGroupIds.clear();
    refresh();
    filtersRef.value
      ?.querySelector<HTMLInputElement>('[data-filter="query"]')
      ?.focus();
  }

  function toggleGroup(groupId: string): void {
    const expanded = currentState.expandedGroupIds.includes(groupId);
    currentState = {
      ...currentState,
      expandedGroupIds: expanded
        ? currentState.expandedGroupIds.filter((id) => id !== groupId)
        : [...currentState.expandedGroupIds, groupId],
    };
    if (expanded) fullyVisibleGroupIds.delete(groupId);
    refresh();
  }

  function viewAllRows(groupId: string): void {
    if (fullyVisibleGroupIds.has(groupId)) {
      fullyVisibleGroupIds.delete(groupId);
    } else {
      fullyVisibleGroupIds.add(groupId);
    }
    refresh();
    workRef.value
      ?.querySelector<HTMLButtonElement>(`[data-view-toggle="${groupId}"]`)
      ?.focus();
  }

  const setOpen = (next: boolean): void => {
    const shell = shellRef.value;
    const trigger = triggerRef.value;
    if (!shell || !trigger) return;
    shell.open = next;
    trigger.setAttribute("aria-expanded", String(next));
    trigger.setAttribute(
      "aria-label",
      next ? "Close team navigation" : "Open team navigation",
    );
    trigger.textContent = next
      ? "Close team navigation"
      : "Open team navigation";
    if (next) {
      void shell.updateComplete.then(() => {
        shell
          .querySelector<HTMLAnchorElement>(
            '[slot="compact-navigation"] a[href]',
          )
          ?.focus();
      });
    }
  };

  const disabled =
    currentProjection.pageState === "loading" ||
    currentProjection.pageState === "no-repositories";

  const mountFilters = (element: Element | undefined): void => {
    if (!(element instanceof HTMLElement)) return;
    filtersRef.value = element;
    render(
      renderFilters(
        currentProjection,
        disabled,
        setGrouping,
        setFilter,
        clearFilters,
      ),
      filtersRef.value,
    );
  };

  const mountWork = (element: Element | undefined): void => {
    if (!(element instanceof HTMLElement)) return;
    workRef.value = element;
    render(
      renderWorkBody(
        currentProjection,
        clearFilters,
        fullyVisibleGroupIds,
        toggleGroup,
        viewAllRows,
      ),
      workRef.value,
    );
  };

  return html`<div
    ${ref(rootRef)}
    class="sk-work-explorer-pattern${initialState.light ? " sk-light" : ""}"
    data-work-explorer-pattern
    data-story-state=${initialState.id}
    data-grouping=${currentProjection.grouping}
    data-source-total=${currentProjection.sourceTotal ?? nothing}
    data-filtered-total=${currentProjection.filteredTotal ?? nothing}
    data-repository-total=${currentProjection.repositories.length}
    data-render-complete="true"
  >
    ${workExplorerPatternStyles}
    <sk-app-shell
      ${ref((element) => {
        shellRef.value = element as SkAppShell;
        connectCompactControls(shellRef, triggerRef);
      })}
      presentation="rail-preserving"
      .open=${false}
      @sk-app-shell-dismiss=${() => setOpen(false)}
    >
      ${renderPersonalRail()} ${renderContextNavigation("desktop")}
      <div
        class="sk-work-explorer-pattern__compact-header"
        slot="compact-header"
      >
        <button
          ${ref((element) => {
            triggerRef.value = element as HTMLButtonElement;
            connectCompactControls(shellRef, triggerRef);
          })}
          class="sk-work-explorer-pattern__drawer-trigger"
          type="button"
          aria-label="Open team navigation"
          aria-controls="work-explorer-navigation"
          aria-expanded="false"
          @click=${() => setOpen(!(shellRef.value?.open ?? false))}
        >
          Open team navigation
        </button>
        <strong>${WORK_EXPLORER_FIXTURE.team.label}</strong>
      </div>
      ${renderContextNavigation("compact")}
      ${renderPageHeader(currentProjection)}
      <div class="sk-work-explorer-pattern__content">
        ${
          currentProjection.pageState === "loading"
            ? html` <div ${ref(mountFilters)}></div>
                <sk-grid
                  class="sk-work-explorer-pattern__layout"
                  variant="cols-2"
                  gap="4"
                >
                  <p
                    class="sk-work-explorer-pattern__visually-hidden"
                    role="status"
                    aria-live="polite"
                  >
                    Loading Work Packages
                  </p>
                  ${renderLoadingRegion("Loading verified Mission work", "work")}
                  ${renderLoadingRegion("Loading reported and observed context", "context")}
                </sk-grid>`
            : currentProjection.pageState === "no-repositories"
              ? html` <div ${ref(mountFilters)}></div>
                  <sk-grid
                    class="sk-work-explorer-pattern__layout"
                    variant="cols-2"
                    gap="4"
                  >
                    <section
                      class="sk-work-explorer-pattern__work"
                      aria-labelledby="work-explorer-setup-heading"
                    >
                      <sk-card>
                        <h2 id="work-explorer-setup-heading">
                          No admitted repositories
                        </h2>
                        <p>
                          Connect a repository before this team can show
                          governed work.
                        </p>
                        <a
                          class="sk-work-explorer-pattern__context-link"
                          href="/connectors"
                          >Open Connectors</a
                        >
                      </sk-card>
                    </section>
                    <aside
                      class="sk-work-explorer-pattern__context"
                      aria-labelledby="work-explorer-appears-heading"
                    >
                      <sk-card>
                        <h2 id="work-explorer-appears-heading">
                          What appears here
                        </h2>
                        <p>
                          Presence and activity appear after a repository is
                          admitted.
                        </p>
                      </sk-card>
                    </aside>
                  </sk-grid>`
              : html` ${
                    currentProjection.pageState === "no-work"
                      ? html`<p data-no-work-summary>
                          No active Work Packages across
                          ${formatAdmittedRepositories(
                            currentProjection.repositories.length,
                          )}
                        </p>`
                      : renderSummary()
                  }
                  <div ${ref(mountFilters)}></div>
                  <sk-grid
                    class="sk-work-explorer-pattern__layout"
                    variant="cols-2"
                    gap="4"
                  >
                    <section
                      class="sk-work-explorer-pattern__work"
                      aria-labelledby="work-explorer-verified-heading"
                      data-truth-tier="mission"
                    >
                      <h2
                        class="sk-work-explorer-pattern__visually-hidden"
                        id="work-explorer-verified-heading"
                      >
                        Active Work Packages
                      </h2>
                      <div ${ref(mountWork)}></div>
                    </section>
                    ${renderContext(currentProjection)}
                  </sk-grid>`
        }
      </div>
    </sk-app-shell>
  </div>`;
};

const meta: Meta = {
  title: "Patterns/Work Explorer",
  tags: ["autodocs"],
  parameters: {
    a11y: { disable: false },
    layout: "fullscreen",
  },
  excludeStories: [
    "deepFreezeWorkExplorerFixture",
    "isDeeplyFrozenWorkExplorerFixture",
    "WORK_EXPLORER_FIXTURE",
    "WORK_EXPLORER_STORY_MODELS",
    "validateWorkExplorerFixture",
    "groupWorkPackages",
    "filterWorkPackages",
    "projectWorkExplorer",
    "renderWorkExplorer",
  ],
};

export default meta;
type Story = StoryObj;

export const W1ByLaneDesktopDark: Story = {
  name: "W1 · By lane · desktop dark",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w1),
};

export const W2ByPersonDesktopDark: Story = {
  name: "W2 · By person · desktop dark",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w2),
};

export const W3ByTypeDesktopDark: Story = {
  name: "W3 · By type · desktop dark",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w3),
};

export const W4ByLane1024Dark: Story = {
  name: "W4 · By lane · 1024 dark",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w4),
};

export const W5ByLaneLightMode: Story = {
  name: "W5 · By lane · LightMode",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w5),
};

export const W6FilteredEmptyDark: Story = {
  name: "W6 · Filtered empty · dark",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w6),
};

export const W7NoActiveWorkDark: Story = {
  name: "W7 · No active work · dark",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w7),
};

export const W8DegradedContextDark: Story = {
  name: "W8 · Degraded context · dark",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w8),
};

export const W9LoadingDark: Story = {
  name: "W9 · Loading · dark",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w9),
};

export const W10NoAdmittedRepositoriesDark: Story = {
  name: "W10 · No admitted repositories · dark",
  render: () => renderWorkExplorer(WORK_EXPLORER_STORY_MODELS.w10),
};
