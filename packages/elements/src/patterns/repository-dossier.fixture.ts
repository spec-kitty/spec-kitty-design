export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export type DossierState =
  | "populated"
  | "cross-branch"
  | "not-spec-kitty"
  | "snapshot-behind"
  | "indexing"
  | "completed-empty"
  | "long-data"
  | "tracker-destinations"
  | "thresholds";

type Capability = "completed" | "not-spec-kitty" | "indexing";

interface CopyDatum {
  readonly label: string;
  readonly value: string;
}

interface RepositorySnapshot {
  readonly sha: string;
  readonly branch: string;
  readonly pushed: {
    readonly iso: string;
    readonly label: string;
  };
}

export interface MissionProgress {
  readonly total: number;
  readonly percent: number;
}

export interface MissionRecord {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly href: string;
  readonly planningSha: string;
  readonly planningBranch: string;
  readonly copies: readonly string[];
  readonly tracker: Readonly<{ label: string; href?: string }> | undefined;
  readonly progress: MissionProgress | undefined;
  readonly merged: Readonly<{ label: string }> | undefined;
  readonly affectedSha: string | undefined;
  readonly snapshotWarning: string | undefined;
}

interface NavigationLink {
  readonly label: string;
  readonly href: string;
}

interface PersonalNavigationLink extends NavigationLink {
  readonly mark: string;
  readonly placement: "primary" | "account";
}

interface RepositoryNavigationEntry extends NavigationLink {
  readonly current: boolean;
  readonly missions: readonly NavigationLink[];
}

interface DossierNavigation {
  readonly personal: readonly PersonalNavigationLink[];
  readonly team: readonly NavigationLink[];
  readonly manage: readonly NavigationLink[];
  readonly repository: RepositoryNavigationEntry | undefined;
  readonly emptyCopy: string | undefined;
  readonly overflow: NavigationLink | undefined;
}

export interface DossierFixture {
  readonly state: DossierState;
  readonly capability: Capability;
  readonly team: string;
  readonly repository: {
    readonly name: string;
    readonly path: string;
    readonly href: string;
    readonly inspectedBranch: string | undefined;
    readonly defaultBranch: string | undefined;
  };
  readonly breadcrumbIndex: NavigationLink;
  readonly navigation: DossierNavigation;
  readonly snapshot: RepositorySnapshot | undefined;
  readonly missions: readonly MissionRecord[];
  readonly repositoryLinks: readonly Readonly<{
    label: string;
    href: string;
  }>[];
  readonly setup: readonly Readonly<{
    heading: string;
    body: string;
    link: Readonly<{ label: string; href: string }> | undefined;
    command: CopyDatum;
  }>[];
  readonly setupIntroduction:
    Readonly<{ heading: string; body: string }> | undefined;
  readonly terminalMessage: string | undefined;
  readonly busyMessage: string | undefined;
}

export interface DossierProjection {
  readonly fixture: DeepReadonly<DossierFixture>;
  readonly title: string;
  readonly supporting: string;
  readonly missionCount: number | undefined;
  readonly showGitContext: boolean;
  readonly showSetup: boolean;
}

/** Recursively freezes every object and array reachable from an authored fixture. */
export const deepFreezeRepositoryDossierFixture = <T>(
  value: T,
): DeepReadonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreezeRepositoryDossierFixture(child);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

const TEAM = "Collaborative Demo Team";
const REPOSITORY = "spec-kitty/EXPERIMENTAL-spec-kitty-saas";
const REPOSITORY_PATH = "/srv/team-kitty/EXPERIMENTAL-spec-kitty-saas";
const SNAPSHOT_SHA = "a3f91c2";
const DEFAULT_BRANCH = "main";

const BREADCRUMB_INDEX = { label: "Repos", href: "#repos" } as const;

const PERSONAL_LINKS = [
  { label: "Spec Kitty home", href: "#home", mark: "SK", placement: "primary" },
  { label: "Work", href: "#work", mark: "W", placement: "primary" },
  {
    label: "Account for demo operator",
    href: "#account",
    mark: "DO",
    placement: "account",
  },
] as const satisfies readonly PersonalNavigationLink[];

const TEAM_LINKS = [
  { label: "Overview", href: "#overview" },
  { label: "Work", href: "#work" },
  { label: "Connectors", href: "#connectors" },
] as const;

const MANAGE_LINKS = [{ label: "Members", href: "#members" }] as const;

const SPECIAL_STATE_NAVIGATION = {
  personal: PERSONAL_LINKS,
  team: TEAM_LINKS,
  manage: MANAGE_LINKS,
  repository: undefined,
  emptyCopy: "No repos with Missions yet.",
  overflow: {
    label: "1 more admitted repo without Missions",
    href: "#connectors",
  },
} as const satisfies DossierNavigation;

const SETUP = [
  {
    heading: "Charter",
    body: "Define testing standards, quality gates, and governance once for every Mission.",
    link: { label: "Read this repo’s Charter", href: "#charter" },
    command: {
      label: "Copy Charter interview command",
      value: "spec-kitty charter interview",
    },
  },
  {
    heading: "Start a Mission",
    body: "Dispatch a request from a clone of this repo. The Mission appears here when you push.",
    link: undefined,
    command: {
      label: "Copy Mission dispatch command",
      value: 'spec-kitty dispatch "Add dark-mode tokens to the dossier"',
    },
  },
] as const;

const SETUP_INTRODUCTION = {
  heading: "Set up in this repo",
  body: "Create Missions from your laptop with the Spec Kitty CLI. They appear here at the exact commit you push.",
} as const;

const REPOSITORY_LINKS = [
  { label: "Charter", href: "#charter" },
  { label: "Glossary", href: "#glossary" },
  { label: "Timeline", href: "#timeline" },
] as const;

const populatedMissions = [
  {
    id: "#1042",
    title: "Launch resilience tranche A",
    summary: "Strengthen launch paths and recovery behavior.",
    href: "#mission-1042",
    planningSha: "72c4e9a",
    planningBranch: "feature/launch-resilience",
    copies: [],
    tracker: { label: "Tracker #1042", href: undefined },
    progress: { total: 8, percent: 62 },
    merged: undefined,
    affectedSha: undefined,
    snapshotWarning: undefined,
  },
  {
    id: "#1017",
    title: "Repository dossier render",
    summary: "Render repository Missions from committed git content.",
    href: "#mission-1017",
    planningSha: "5e8b1c0",
    planningBranch: "feature/repo-dossier",
    copies: [],
    tracker: undefined,
    progress: { total: 9, percent: 22 },
    merged: undefined,
    affectedSha: undefined,
    snapshotWarning: undefined,
  },
  {
    id: "#998",
    title: "Fold docstring drift",
    summary: "Align docstrings with the behavior they describe.",
    href: "#mission-998",
    planningSha: "94d820f",
    planningBranch: "feature/fold-docstrings",
    copies: [],
    tracker: undefined,
    progress: { total: 12, percent: 0 },
    merged: undefined,
    affectedSha: undefined,
    snapshotWarning: undefined,
  },
] as const satisfies readonly MissionRecord[];

const navigationFor = (
  repository: DossierFixture["repository"],
  missions: readonly MissionRecord[],
  missionIds: readonly string[],
): DossierNavigation => ({
  personal: PERSONAL_LINKS,
  team: TEAM_LINKS,
  manage: MANAGE_LINKS,
  repository: {
    label: repository.name,
    href: repository.href,
    current: true,
    missions: missionIds.map((id) => {
      const mission = missions.find((candidate) => candidate.id === id);
      if (!mission)
        throw new Error(`Unknown Repository Dossier navigation Mission ${id}`);
      return { label: mission.title, href: mission.href };
    }),
  },
  emptyCopy: undefined,
  overflow: undefined,
});

const completedFixture = (
  state: DossierState,
  missions: readonly MissionRecord[] = populatedMissions,
  navigationMissionIds: readonly string[] = missions.map(
    (mission) => mission.id,
  ),
): DossierFixture => {
  const repository = {
    name: REPOSITORY,
    path: REPOSITORY_PATH,
    href: "#repository",
    inspectedBranch: DEFAULT_BRANCH,
    defaultBranch: DEFAULT_BRANCH,
  };
  return {
    state,
    capability: "completed",
    team: TEAM,
    repository,
    breadcrumbIndex: BREADCRUMB_INDEX,
    navigation: navigationFor(repository, missions, navigationMissionIds),
    snapshot: {
      sha: SNAPSHOT_SHA,
      branch: DEFAULT_BRANCH,
      pushed: { iso: "2026-09-09T10:54:00Z", label: "6 minutes ago" },
    },
    missions,
    repositoryLinks: REPOSITORY_LINKS,
    setup: SETUP,
    setupIntroduction: SETUP_INTRODUCTION,
    terminalMessage: undefined,
    busyMessage: undefined,
  };
};

const crossBranchMissions = populatedMissions.map((mission) => {
  switch (mission.id) {
    case "#1042":
      return {
        ...mission,
        copies: [mission.planningBranch, "release/launch-resilience"],
      };
    case "#1017":
      return {
        ...mission,
        copies: [mission.planningBranch, DEFAULT_BRANCH],
        merged: { label: "Merged to default" },
      };
    default:
      return { ...mission, copies: [mission.planningBranch] };
  }
}) satisfies readonly MissionRecord[];

const trackerDestinationMissions = populatedMissions.map((mission) => {
  switch (mission.id) {
    case "#1042":
      return {
        ...mission,
        tracker: {
          label: "Tracker #1042",
          href: "https://tracker.example.test/issues/1042",
        },
      };
    case "#1017":
      return {
        ...mission,
        tracker: {
          label: "Unsafe tracker fixture",
          href: "javascript:alert(1)",
        },
      };
    default:
      return mission;
  }
}) satisfies readonly MissionRecord[];

const snapshotMissions = populatedMissions.map((mission) =>
  mission.id === "#998"
    ? {
        ...mission,
        affectedSha: SNAPSHOT_SHA,
        snapshotWarning:
          "The saved status summary and Mission history disagree at this same commit.",
      }
    : mission,
) satisfies readonly MissionRecord[];

const longMissions: readonly MissionRecord[] = [
  {
    ...populatedMissions[0],
    title:
      "Launch resilience tranche A with a deliberately long Mission name that remains readable",
    planningSha: "72c4e9a8da9015b274ef0423032e8e75cfd09d55",
    planningBranch:
      "feature/launch-resilience-with-an-unbroken-consumer-supplied-branch-segment",
    copies: [],
  },
];

const thresholdMissions: readonly MissionRecord[] = [
  {
    ...populatedMissions[0],
    id: "#threshold-below",
    title: "Below supplied boundary",
    href: "#threshold-below",
    progress: { total: 100, percent: 59 },
  },
  {
    ...populatedMissions[0],
    id: "#threshold-at",
    title: "At supplied boundary",
    href: "#threshold-at",
    progress: { total: 100, percent: 60 },
  },
  {
    ...populatedMissions[0],
    id: "#threshold-above",
    title: "Above supplied boundary",
    href: "#threshold-above",
    progress: { total: 100, percent: 61 },
  },
];

const longFixture = completedFixture("long-data", longMissions);
const longRepository = {
  ...longFixture.repository,
  name: "spec-kitty/EXPERIMENTAL-spec-kitty-saas-with-an-intentionally-long-repository-segment",
  path: "/srv/team-kitty/EXPERIMENTAL-spec-kitty-saas-with-an-intentionally-long-repository-segment",
  href: "#long-repository",
  inspectedBranch: longMissions[0].planningBranch,
};

/** The sole authored source for every repeated Repository Dossier display fact. */
export const REPOSITORY_DOSSIER_FIXTURES = deepFreezeRepositoryDossierFixture<
  Record<DossierState, DossierFixture>
>({
  populated: completedFixture("populated"),
  "cross-branch": completedFixture("cross-branch", crossBranchMissions, [
    "#1042",
    "#998",
  ]),
  "snapshot-behind": completedFixture("snapshot-behind", snapshotMissions),
  "completed-empty": {
    ...completedFixture("completed-empty", []),
    navigation: SPECIAL_STATE_NAVIGATION,
  },
  "long-data": {
    ...longFixture,
    repository: longRepository,
    navigation: navigationFor(longRepository, longMissions, ["#1042"]),
    snapshot: {
      sha: "72c4e9a8da9015b274ef0423032e8e75cfd09d55",
      branch: longMissions[0].planningBranch,
      pushed: { iso: "2026-09-09T10:54:00Z", label: "6 minutes ago" },
    },
    setup: SETUP.map((item, index) =>
      index === 1
        ? {
            ...item,
            command: {
              ...item.command,
              value:
                'spec-kitty dispatch "Add an intentionally long evidence-preserving Repository Dossier capability without shortening the exact consumer-supplied command value"',
            },
          }
        : item,
    ),
  },
  "tracker-destinations": completedFixture(
    "tracker-destinations",
    trackerDestinationMissions,
  ),
  thresholds: completedFixture("thresholds", thresholdMissions),
  "not-spec-kitty": {
    ...completedFixture("not-spec-kitty", []),
    capability: "not-spec-kitty",
    navigation: SPECIAL_STATE_NAVIGATION,
    snapshot: undefined,
    repositoryLinks: [],
    setup: [],
    setupIntroduction: undefined,
    terminalMessage:
      "Team Kitty checked every pushed branch and found neither kitty-specs/ nor kitty-ops/. No Dossier content will be rendered for this repository.",
  },
  indexing: {
    ...completedFixture("indexing", []),
    capability: "indexing",
    navigation: SPECIAL_STATE_NAVIGATION,
    snapshot: undefined,
    repositoryLinks: [],
    setup: [],
    setupIntroduction: undefined,
    busyMessage:
      "The first complete render has not been published yet. This page will fill in automatically when rendering finishes.",
  },
});

/** Returns a safe external tracker destination, or no destination for static fallback text. */
export const safeTrackerHref = (
  value: string | undefined,
): string | undefined => {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? value
      : undefined;
  } catch {
    return undefined;
  }
};

/** Selects display presence from supplied fixture state without mutating or inferring truth. */
export const projectRepositoryDossier = (
  fixture: DeepReadonly<DossierFixture>,
): DeepReadonly<DossierProjection> => {
  const completed = fixture.capability === "completed";
  const title =
    fixture.capability === "not-spec-kitty"
      ? "Not a Spec Kitty repository"
      : fixture.capability === "indexing"
        ? "Not yet rendered"
        : "Missions";
  const supporting =
    fixture.capability === "not-spec-kitty"
      ? `${fixture.repository.name} has neither kitty-specs/ nor kitty-ops/ on any pushed branch.`
      : fixture.capability === "indexing"
        ? `Team Kitty is rendering ${fixture.repository.name} from git. This page will fill in once that finishes.`
        : `Every Mission carried on any pushed branch of ${fixture.repository.name}, read from git at exact commits.`;

  return Object.freeze({
    fixture,
    title,
    supporting,
    missionCount:
      completed && fixture.missions.length > 0
        ? fixture.missions.length
        : undefined,
    showGitContext: completed && fixture.snapshot !== undefined,
    showSetup: completed && fixture.setup.length > 0,
  });
};

export const fixtureForRepositoryDossierState = (
  state: DossierState,
): DeepReadonly<DossierFixture> => {
  switch (state) {
    case "populated":
      return REPOSITORY_DOSSIER_FIXTURES.populated;
    case "cross-branch":
      return REPOSITORY_DOSSIER_FIXTURES["cross-branch"];
    case "not-spec-kitty":
      return REPOSITORY_DOSSIER_FIXTURES["not-spec-kitty"];
    case "snapshot-behind":
      return REPOSITORY_DOSSIER_FIXTURES["snapshot-behind"];
    case "indexing":
      return REPOSITORY_DOSSIER_FIXTURES.indexing;
    case "completed-empty":
      return REPOSITORY_DOSSIER_FIXTURES["completed-empty"];
    case "long-data":
      return REPOSITORY_DOSSIER_FIXTURES["long-data"];
    case "tracker-destinations":
      return REPOSITORY_DOSSIER_FIXTURES["tracker-destinations"];
    case "thresholds":
      return REPOSITORY_DOSSIER_FIXTURES.thresholds;
  }
};
