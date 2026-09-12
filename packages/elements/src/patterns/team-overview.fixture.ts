export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

type SafeRouteKind =
  | "overview"
  | "work"
  | "connectors"
  | "members"
  | "repository"
  | "mission"
  | "release";

export interface SuppliedRoute {
  readonly kind: SafeRouteKind;
  readonly label: string;
  readonly href: string;
}

export interface RetentionCellInput {
  readonly id: string;
  readonly label: string;
}

export interface RetentionWindowInput {
  readonly key: "default" | "alternate";
  readonly retentionHours: number;
  readonly cells: readonly RetentionCellInput[];
  readonly description: string;
}

export interface RetentionCell extends RetentionCellInput {
  readonly count: number;
}

export interface RetentionWindow {
  readonly key: "default" | "alternate";
  readonly retentionHours: number;
  readonly cells: readonly RetentionCell[];
  readonly summary: string;
  readonly description: string;
}

export interface TeamMomentRecord {
  readonly id: string;
  readonly retentionCellId: string;
  readonly missionRef: string;
  readonly missionRoute: SuppliedRoute;
  readonly repository: string;
  readonly kind: string;
  readonly stage: string;
  readonly freshness: string;
  readonly age: string;
  readonly occurredAt: string;
}

export interface RepositoryRecord {
  readonly id: string;
  readonly name: string;
  readonly route: SuppliedRoute;
  readonly missionSummary: string;
  readonly sha: string;
  readonly branch: string;
  readonly pushed: string;
}

interface OverviewCopy {
  readonly storyTitle: string;
  readonly productName: string;
  readonly teamName: string;
  readonly teamInitials: string;
  readonly overviewMark: string;
  readonly workMark: string;
  readonly overviewEyebrow: string;
  readonly pageSupporting: string;
  readonly personalNavigationLabel: string;
  readonly contextNavigationLabel: string;
  readonly compactNavigationLabel: string;
  readonly openNavigationLabel: string;
  readonly closeNavigationLabel: string;
  readonly accountLabel: string;
  readonly logoutLabel: string;
  readonly overviewCurrentLabel: string;
  readonly repositoryNavigationLabel: string;
  readonly missionNavigationLabel: string;
  readonly emptyRepositoryNavigation: string;
  readonly velocityEyebrow: string;
  readonly velocityTitle: string;
  readonly observedBoundary: string;
  readonly inFlightEyebrow: string;
  readonly inFlightTitle: string;
  readonly inFlightDescription: string;
  readonly admittedEyebrow: string;
  readonly admittedTitle: string;
  readonly admittedDescription: string;
  readonly recentEyebrow: string;
  readonly recentTitle: string;
  readonly recentDescription: string;
  readonly recentListLabel: string;
  readonly missionRefLabel: string;
  readonly repositoryLabel: string;
  readonly kindLabel: string;
  readonly stageLabel: string;
  readonly observedAtLabel: string;
  readonly freshnessLabel: string;
  readonly repositoryFactsLabel: string;
  readonly shaLabel: string;
  readonly branchLabel: string;
  readonly pushedLabel: string;
  readonly menuLabel: string;
  readonly quietLabel: string;
  readonly eventSingularLabel: string;
  readonly eventPluralLabel: string;
  readonly hourSingularLabel: string;
  readonly hourPluralLabel: string;
  readonly retentionLookbackLabel: string;
  readonly retentionSummarySeparator: string;
}

export interface PopulatedOverviewResponse {
  readonly copy: OverviewCopy;
  readonly routes: Readonly<{
    overview: SuppliedRoute;
    work: SuppliedRoute;
    connectors: SuppliedRoute;
    members: SuppliedRoute;
  }>;
  readonly retention: Readonly<{
    default: RetentionWindowInput;
    alternate: RetentionWindowInput;
  }>;
  readonly moments: readonly TeamMomentRecord[];
  readonly repositories: readonly RepositoryRecord[];
}

export interface PopulatedOverviewProjection {
  readonly retention: DeepReadonly<RetentionWindow>;
  readonly eventTotal: number;
  readonly inFlight: readonly DeepReadonly<TeamMomentRecord>[];
  readonly recent: readonly DeepReadonly<TeamMomentRecord>[];
  readonly repositories: readonly DeepReadonly<RepositoryRecord>[];
}

export const deepFreezeTeamOverviewFixture = <T>(value: T): DeepReadonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreezeTeamOverviewFixture(child);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

const isSafeTeamRoute = (href: string): boolean =>
  !href.includes("/../") &&
  !href.includes("/./") &&
  /^\/a\/[a-z0-9-]+\/(?:$|work\/$|connectors\/$|team\/$|repos\/[a-z0-9._-]+\/$|repos\/[a-z0-9._-]+\/missions\/[a-z0-9._-]+\/$)/u.test(
    href,
  );

const isSafeReleaseRoute = (href: string): boolean =>
  href === "https://github.com/spec-kitty/EXPERIMENTAL-spec-kitty/releases";

/** Returns a supplied destination only when it belongs to the reviewed route allow-list. */
export const safeTeamOverviewHref = (
  route: SuppliedRoute | undefined,
): string | undefined => {
  if (!route) return undefined;
  if (route.kind === "release") {
    return isSafeReleaseRoute(route.href) ? route.href : undefined;
  }
  return isSafeTeamRoute(route.href) ? route.href : undefined;
};

const validatePopulatedFixture = (fixture: PopulatedOverviewResponse): void => {
  const suppliedRoutes = [
    ...Object.values(fixture.routes),
    ...fixture.moments.map((moment) => moment.missionRoute),
    ...fixture.repositories.map((repository) => repository.route),
  ];
  if (
    suppliedRoutes.some((route) => safeTeamOverviewHref(route) === undefined)
  ) {
    throw new Error("Team Overview fixture contains an unsafe route");
  }
  for (const retention of Object.values(fixture.retention)) {
    if (retention.retentionHours <= 0 || retention.cells.length === 0) {
      throw new Error("Team Overview retention input must be positive");
    }
    if (
      new Set(retention.cells.map((cell) => cell.id)).size !==
      retention.cells.length
    ) {
      throw new Error("Team Overview retention cell ids must be unique");
    }
  }
  const suppliedCellIds = new Set(
    Object.values(fixture.retention).flatMap((retention) =>
      retention.cells.map((cell) => cell.id),
    ),
  );
  if (
    fixture.moments.some(
      (moment) => !suppliedCellIds.has(moment.retentionCellId),
    )
  ) {
    throw new Error("Team Overview moments must reference a retention cell");
  }
};

const countedLabel = (
  count: number,
  singular: string,
  plural: string,
): string => `${count} ${count === 1 ? singular : plural}`;

export const projectPopulatedOverview = (
  fixture: PopulatedOverviewResponse,
  retentionKey: keyof PopulatedOverviewResponse["retention"] = "default",
): DeepReadonly<PopulatedOverviewProjection> => {
  validatePopulatedFixture(fixture);
  const sourceRetention =
    retentionKey === "alternate"
      ? fixture.retention.alternate
      : fixture.retention.default;
  const retentionCellIds = new Set(
    sourceRetention.cells.map((cell) => cell.id),
  );
  const includedMoments = fixture.moments.filter((moment) =>
    retentionCellIds.has(moment.retentionCellId),
  );
  const eventTotal = includedMoments.length;
  const retention = {
    key: sourceRetention.key,
    retentionHours: sourceRetention.retentionHours,
    description: sourceRetention.description,
    summary: `${countedLabel(
      eventTotal,
      fixture.copy.eventSingularLabel,
      fixture.copy.eventPluralLabel,
    )}${fixture.copy.retentionSummarySeparator}${
      fixture.copy.retentionLookbackLabel
    } ${countedLabel(
      sourceRetention.retentionHours,
      fixture.copy.hourSingularLabel,
      fixture.copy.hourPluralLabel,
    )}`,
    cells: sourceRetention.cells.map((cell) => {
      const count = includedMoments.filter(
        (moment) => moment.retentionCellId === cell.id,
      ).length;
      return {
        ...cell,
        count,
        label: `${cell.label}${fixture.copy.retentionSummarySeparator}${
          count === 0
            ? fixture.copy.quietLabel
            : countedLabel(
                count,
                fixture.copy.eventSingularLabel,
                fixture.copy.eventPluralLabel,
              )
        }`,
      };
    }),
  };
  const missionIds = new Set<string>();
  const inFlight = includedMoments.filter((moment) => {
    if (missionIds.has(moment.missionRef) || missionIds.size >= 2) return false;
    missionIds.add(moment.missionRef);
    return true;
  });
  const cloneMoment = (moment: TeamMomentRecord): TeamMomentRecord => ({
    ...moment,
    missionRoute: { ...moment.missionRoute },
  });
  const projection: PopulatedOverviewProjection = {
    retention,
    eventTotal,
    inFlight: inFlight.map(cloneMoment),
    recent: includedMoments.slice(0, 6).map(cloneMoment),
    repositories: fixture.repositories.map((repository) => ({
      ...repository,
      route: { ...repository.route },
    })),
  };
  return deepFreezeTeamOverviewFixture(projection);
};

const OVERVIEW_COPY = {
  storyTitle: "Patterns/Team Overview",
  productName: "Spec Kitty",
  teamName: "Collaborative Demo Team",
  teamInitials: "CD",
  overviewMark: "O",
  workMark: "W",
  overviewEyebrow: "Overview",
  pageSupporting: "What needs you, and what is moving.",
  personalNavigationLabel: "Team Kitty",
  contextNavigationLabel: "Team navigation",
  compactNavigationLabel: "Compact team navigation",
  openNavigationLabel: "Open team navigation",
  closeNavigationLabel: "Close team navigation",
  accountLabel: "Collaborative Demo account",
  logoutLabel: "Log out",
  overviewCurrentLabel: "Current page",
  repositoryNavigationLabel: "Repository",
  missionNavigationLabel: "Mission",
  emptyRepositoryNavigation: "No repos with missions yet.",
  velocityEyebrow: "Observed TeamMoment history",
  velocityTitle: "Velocity",
  observedBoundary: "Observed · up to 60 s behind",
  inFlightEyebrow: "Observed TeamMoment history",
  inFlightTitle: "In flight",
  inFlightDescription:
    "Distinct Mission references seen in the retention window.",
  admittedEyebrow: "Repository facts",
  admittedTitle: "Admitted repos",
  admittedDescription: "Local Git facts from the admitted repository snapshot.",
  recentEyebrow: "Observed TeamMoment history",
  recentTitle: "Recent activity",
  recentDescription: "The latest supplied moments. Activity rows are passive.",
  recentListLabel: "Recent TeamMoment activity",
  missionRefLabel: "Mission reference",
  repositoryLabel: "Repository",
  kindLabel: "Kind",
  stageLabel: "Stage",
  observedAtLabel: "Observed",
  freshnessLabel: "Freshness",
  repositoryFactsLabel: "Repository snapshot facts",
  shaLabel: "Commit",
  branchLabel: "Branch",
  pushedLabel: "Pushed",
  menuLabel: "Menu",
  quietLabel: "quiet",
  eventSingularLabel: "event",
  eventPluralLabel: "events",
  hourSingularLabel: "hour",
  hourPluralLabel: "hours",
  retentionLookbackLabel: "last",
  retentionSummarySeparator: " · ",
} as const satisfies OverviewCopy;

export const LONG_OVERVIEW_COPY = deepFreezeTeamOverviewFixture({
  ...OVERVIEW_COPY,
  pageSupporting:
    "Was Ihre Aufmerksamkeit benötigt und welche überprüfbaren Teambewegungen sich innerhalb des bereitgestellten Aufbewahrungsfensters entwickelt haben.",
  inFlightDescription:
    "Unterschiedliche maschinensichere Missionsreferenzen, die im bereitgestellten Aufbewahrungsfenster beobachtet wurden.",
  admittedDescription:
    "Lokale Git-Fakten aus dem bereitgestellten Snapshot des zugelassenen Repositorys.",
  recentDescription:
    "Die neuesten bereitgestellten TeamMomente in unveränderter Reihenfolge. Diese Aktivitätszeilen bleiben bewusst passiv.",
});

export const TEAM_OVERVIEW_POPULATED_RESPONSE = deepFreezeTeamOverviewFixture({
  copy: OVERVIEW_COPY,
  routes: {
    overview: {
      kind: "overview",
      label: "Overview",
      href: "/a/collaborative-demo-team/",
    },
    work: {
      kind: "work",
      label: "Work",
      href: "/a/collaborative-demo-team/work/",
    },
    connectors: {
      kind: "connectors",
      label: "Connectors",
      href: "/a/collaborative-demo-team/connectors/",
    },
    members: {
      kind: "members",
      label: "Members",
      href: "/a/collaborative-demo-team/team/",
    },
  },
  retention: {
    default: {
      key: "default",
      retentionHours: 72,
      description: "Four touched calendar days, Thursday through Sunday.",
      cells: [
        { id: "thu", label: "Thursday" },
        { id: "fri", label: "Friday" },
        { id: "sat", label: "Saturday" },
        { id: "sun", label: "Sunday" },
      ],
    },
    alternate: {
      key: "alternate",
      retentionHours: 168,
      description: "Seven supplied calendar days, Monday through Sunday.",
      cells: [
        { id: "mon", label: "Monday" },
        { id: "tue", label: "Tuesday" },
        { id: "wed", label: "Wednesday" },
        { id: "thu", label: "Thursday" },
        { id: "fri", label: "Friday" },
        { id: "sat", label: "Saturday" },
        { id: "sun", label: "Sunday" },
      ],
    },
  },
  moments: [
    {
      id: "moment-003",
      retentionCellId: "sun",
      missionRef: "team-landing-pivots",
      missionRoute: {
        kind: "mission",
        label: "team-landing-pivots",
        href: "/a/collaborative-demo-team/repos/e2e-team-landing/missions/team-landing-pivots/",
      },
      repository: "spec-kitty/e2e-team-landing",
      kind: "WPStatusChanged",
      stage: "doing",
      freshness: "Fresh",
      age: "2 hours ago",
      occurredAt: "2026-09-09T10:00:00Z",
    },
    {
      id: "moment-002",
      retentionCellId: "sat",
      missionRef: "team-landing-pivots",
      missionRoute: {
        kind: "mission",
        label: "team-landing-pivots",
        href: "/a/collaborative-demo-team/repos/e2e-team-landing/missions/team-landing-pivots/",
      },
      repository: "spec-kitty/e2e-team-landing",
      kind: "WPStatusChanged",
      stage: "for_review",
      freshness: "Fresh",
      age: "1 day, 2 hours ago",
      occurredAt: "2026-09-08T10:00:00Z",
    },
    {
      id: "moment-001",
      retentionCellId: "fri",
      missionRef: "team-landing-pivots",
      missionRoute: {
        kind: "mission",
        label: "team-landing-pivots",
        href: "/a/collaborative-demo-team/repos/e2e-team-landing/missions/team-landing-pivots/",
      },
      repository: "spec-kitty/e2e-team-landing",
      kind: "WPStatusChanged",
      stage: "planned",
      freshness: "Fresh",
      age: "2 days, 2 hours ago",
      occurredAt: "2026-09-07T10:00:00Z",
    },
    {
      id: "moment-000",
      retentionCellId: "mon",
      missionRef: "team-landing-pivots",
      missionRoute: {
        kind: "mission",
        label: "team-landing-pivots",
        href: "/a/collaborative-demo-team/repos/e2e-team-landing/missions/team-landing-pivots/",
      },
      repository: "spec-kitty/e2e-team-landing",
      kind: "WPStatusChanged",
      stage: "planned",
      freshness: "Fresh",
      age: "6 days, 2 hours ago",
      occurredAt: "2026-09-03T10:00:00Z",
    },
  ],
  repositories: [
    {
      id: "e2e-team-landing",
      name: "spec-kitty/e2e-team-landing",
      route: {
        kind: "repository",
        label: "spec-kitty/e2e-team-landing",
        href: "/a/collaborative-demo-team/repos/e2e-team-landing/",
      },
      missionSummary: "1 mission not on default branch",
      sha: "17bd28375d5f",
      branch: "main",
      pushed: "0 minutes ago",
    },
  ],
} satisfies PopulatedOverviewResponse);

export const TEAM_OVERVIEW_LONG_CONTENT_RESPONSE =
  deepFreezeTeamOverviewFixture({
    ...TEAM_OVERVIEW_POPULATED_RESPONSE,
    copy: LONG_OVERVIEW_COPY,
  } satisfies PopulatedOverviewResponse);

export type FirstRunFixtureId =
  | "admin-install"
  | "joined"
  | "admin-repo"
  | "admin-mission"
  | "member-repo"
  | "private-install";

export type SetupStepId = "install" | "sign-in" | "repository" | "mission";
export type SetupStepState = "completed" | "current";

interface CopyCommand {
  readonly id: string;
  readonly value: string;
  readonly label: string;
  readonly successMessage: string;
  readonly manualMessage: string;
  readonly failureMessage: string;
}

interface SetupStep {
  readonly id: SetupStepId;
  readonly numberLabel: string;
  readonly title: string;
  readonly completedLabel: string;
  readonly currentLabel: string;
  readonly introduction: string | undefined;
  readonly commands: readonly CopyCommand[];
  readonly note: string | undefined;
  readonly route: SuppliedRoute | undefined;
  readonly memberGuidance: string | undefined;
}

interface FirstRunCopy {
  readonly storyTitle: string;
  readonly teamName: string;
  readonly teamInitials: string;
  readonly overviewMark: string;
  readonly workMark: string;
  readonly overviewEyebrow: string;
  readonly pageSupporting: string;
  readonly personalNavigationLabel: string;
  readonly contextNavigationLabel: string;
  readonly compactNavigationLabel: string;
  readonly openNavigationLabel: string;
  readonly closeNavigationLabel: string;
  readonly accountLabel: string;
  readonly logoutLabel: string;
  readonly emptyRepositoryNavigation: string;
  readonly reviewHeading: string;
  readonly reviewNote: string;
  readonly selectorLabel: string;
  readonly stepsLabel: string;
  readonly menuLabel: string;
}

export interface FirstRunResponseFixture {
  readonly id: FirstRunFixtureId;
  readonly selectorLabel: string;
  readonly role: "Administrator" | "Member";
  readonly privacy: "collaborative" | "private";
  readonly canManage: boolean;
  readonly meta: string;
  readonly heading: string;
  readonly body: string;
  readonly guidance: string | undefined;
  readonly completedStepIds: readonly SetupStepId[];
  readonly currentStepId: SetupStepId;
  readonly welcomeRoutes: readonly SuppliedRoute[];
  readonly steps: readonly SetupStep[];
}

export interface FirstRunProjection {
  readonly id: FirstRunFixtureId;
  readonly role: FirstRunResponseFixture["role"];
  readonly privacy: FirstRunResponseFixture["privacy"];
  readonly canManage: boolean;
  readonly meta: string;
  readonly heading: string;
  readonly body: string;
  readonly guidance: string | undefined;
  readonly visibleSteps: readonly DeepReadonly<
    SetupStep & { readonly state: SetupStepState }
  >[];
  readonly welcomeRoutes: readonly DeepReadonly<SuppliedRoute>[];
}

const FIRST_RUN_COPY = {
  storyTitle: OVERVIEW_COPY.storyTitle,
  teamName: "Cold Start Team",
  teamInitials: "CS",
  overviewMark: OVERVIEW_COPY.overviewMark,
  workMark: OVERVIEW_COPY.workMark,
  overviewEyebrow: OVERVIEW_COPY.overviewEyebrow,
  pageSupporting: OVERVIEW_COPY.pageSupporting,
  personalNavigationLabel: OVERVIEW_COPY.personalNavigationLabel,
  contextNavigationLabel: OVERVIEW_COPY.contextNavigationLabel,
  compactNavigationLabel: OVERVIEW_COPY.compactNavigationLabel,
  openNavigationLabel: OVERVIEW_COPY.openNavigationLabel,
  closeNavigationLabel: OVERVIEW_COPY.closeNavigationLabel,
  accountLabel: "Cold Start account",
  logoutLabel: OVERVIEW_COPY.logoutLabel,
  emptyRepositoryNavigation: "No repos with missions yet.",
  reviewHeading: "Design review scaffolding",
  reviewNote:
    "Static server-response fixtures only. Selection is outside the product contract and does not save, advance setup, or poll.",
  selectorLabel: "Server-response fixture",
  stepsLabel: "First-run setup",
  menuLabel: OVERVIEW_COPY.menuLabel,
} as const satisfies FirstRunCopy;

export const FIRST_RUN_SHELL = deepFreezeTeamOverviewFixture({
  copy: FIRST_RUN_COPY,
  routes: {
    overview: {
      kind: "overview",
      label: "Overview",
      href: "/a/cold-start-team/",
    },
    work: {
      kind: "work",
      label: "Work",
      href: "/a/cold-start-team/work/",
    },
    connectors: {
      kind: "connectors",
      label: "Connectors",
      href: "/a/cold-start-team/connectors/",
    },
    members: {
      kind: "members",
      label: "Members",
      href: "/a/cold-start-team/team/",
    },
    release: {
      kind: "release",
      label: "latest release",
      href: "https://github.com/spec-kitty/EXPERIMENTAL-spec-kitty/releases",
    },
  },
} as const);

const COPIED_MESSAGE = "Copied to clipboard.";
const MANUAL_MESSAGE =
  "Command selected. Use your system copy shortcut to copy it.";
const FAILED_MESSAGE = "Copy failed. Select the command and copy it manually.";

const INSTALL_COMMANDS = {
  id: "install-commands",
  value:
    'gh release download <tag> -R spec-kitty/EXPERIMENTAL-spec-kitty -p "*.whl" -D dist\nuv tool install --find-links dist "spec-kitty-cli==<ver>"',
  label: "Copy commands",
  successMessage: COPIED_MESSAGE,
  manualMessage: MANUAL_MESSAGE,
  failureMessage: FAILED_MESSAGE,
} as const satisfies CopyCommand;

const LOGIN_COMMAND = {
  id: "login-command",
  value:
    "export SPEC_KITTY_SAAS_URL=https://team.spec-kitty.ai && spec-kitty auth login",
  label: "Copy sign-in command",
  successMessage: COPIED_MESSAGE,
  manualMessage: MANUAL_MESSAGE,
  failureMessage: FAILED_MESSAGE,
} as const satisfies CopyCommand;

const ROUTES_COMMAND = {
  id: "routes-command",
  value: "spec-kitty routes",
  label: "Copy routes command",
  successMessage: COPIED_MESSAGE,
  manualMessage: MANUAL_MESSAGE,
  failureMessage: FAILED_MESSAGE,
} as const satisfies CopyCommand;

const MISSION_COMMANDS = {
  id: "mission-commands",
  value:
    'spec-kitty specify "your first mission"\nspec-kitty plan\nspec-kitty tasks',
  label: "Copy first Mission commands",
  successMessage: COPIED_MESSAGE,
  manualMessage: MANUAL_MESSAGE,
  failureMessage: FAILED_MESSAGE,
} as const satisfies CopyCommand;

const INSTALL_STEP = {
  id: "install",
  numberLabel: "1",
  title: "Install the Spec Kitty CLI",
  completedLabel: ", completed",
  currentLabel: ", current step",
  introduction: "On your laptop:",
  commands: [INSTALL_COMMANDS, LOGIN_COMMAND, ROUTES_COMMAND],
  note: "Replace <tag> and <ver> with the tag and version of the latest release. Then, in a clone of your repository, sign in.",
  route: FIRST_RUN_SHELL.routes.release,
  memberGuidance: undefined,
} as const satisfies SetupStep;

const SIGN_IN_STEP = {
  id: "sign-in",
  numberLabel: "2",
  title: "Sign in with the CLI",
  completedLabel: ", completed",
  currentLabel: ", current step",
  introduction: "On your laptop, in a clone of your repository:",
  commands: [LOGIN_COMMAND, ROUTES_COMMAND],
  note: undefined,
  route: undefined,
  memberGuidance: undefined,
} as const satisfies SetupStep;

const ADMIN_REPOSITORY_STEP = {
  id: "repository",
  numberLabel: "3",
  title: "Admit a repository",
  completedLabel: ", completed",
  currentLabel: ", current step",
  introduction: undefined,
  commands: [],
  note: undefined,
  route: {
    ...FIRST_RUN_SHELL.routes.connectors,
    label: "Admit a repository under Connectors",
  },
  memberGuidance: undefined,
} as const satisfies SetupStep;

const MEMBER_REPOSITORY_STEP = {
  ...ADMIN_REPOSITORY_STEP,
  route: undefined,
  memberGuidance:
    "Ask an admin to admit a repository — they can do it under Connectors.",
} as const satisfies SetupStep;

const COLLABORATIVE_MISSION_STEP = {
  id: "mission",
  numberLabel: "4",
  title: "Run a mission together",
  completedLabel: ", completed",
  currentLabel: ", current step",
  introduction: "In the same clone:",
  commands: [MISSION_COMMANDS],
  note: "Move WP01 to doing — this page updates within seconds. Invite a teammate from Members to watch it land together.",
  route: {
    ...FIRST_RUN_SHELL.routes.members,
    label: "Invite teammates",
  },
  memberGuidance: undefined,
} as const satisfies SetupStep;

const PRIVATE_MISSION_STEP = {
  ...COLLABORATIVE_MISSION_STEP,
  note: "Move WP01 to doing — this page updates within seconds.",
  route: undefined,
} as const satisfies SetupStep;

const ADMIN_STEPS = [
  INSTALL_STEP,
  SIGN_IN_STEP,
  ADMIN_REPOSITORY_STEP,
  COLLABORATIVE_MISSION_STEP,
] as const satisfies readonly SetupStep[];

const MEMBER_STEPS = [
  INSTALL_STEP,
  SIGN_IN_STEP,
  MEMBER_REPOSITORY_STEP,
  { ...COLLABORATIVE_MISSION_STEP, route: undefined },
] as const satisfies readonly SetupStep[];

const PRIVATE_STEPS = [
  INSTALL_STEP,
  SIGN_IN_STEP,
  ADMIN_REPOSITORY_STEP,
  PRIVATE_MISSION_STEP,
] as const satisfies readonly SetupStep[];

const ADMIN_BODY =
  "You are a Administrator. Admit a repository and push a mission, and this page shows your team's moments and the repository dossier, with live work on the Work screen.";

const MEMBER_BODY =
  "You are a Member. Admit a repository and push a mission, and this page shows your team's moments and the repository dossier, with live work on the Work screen.";

const PRIVATE_BODY =
  "Your work stays personal here. Admit a repository and push a mission, and this page shows your moments and the repository dossier, with live work on the Work screen.";

export const TEAM_OVERVIEW_FIRST_RUN_RESPONSES = deepFreezeTeamOverviewFixture({
  "admin-install": {
    id: "admin-install",
    selectorLabel: "Administrator · install current",
    role: "Administrator",
    privacy: "collaborative",
    canManage: true,
    meta: "Administrator",
    heading: "Start collaborating in Cold Start Team",
    body: ADMIN_BODY,
    guidance: undefined,
    completedStepIds: [],
    currentStepId: "install",
    welcomeRoutes: [
      { ...FIRST_RUN_SHELL.routes.connectors, label: "Admit a repository" },
      { ...FIRST_RUN_SHELL.routes.members, label: "Manage members" },
    ],
    steps: ADMIN_STEPS,
  },
  joined: {
    id: "joined",
    selectorLabel: "Joined Team · sign-in current",
    role: "Administrator",
    privacy: "collaborative",
    canManage: true,
    meta: "Administrator",
    heading: "You joined Cold Start Team",
    body: ADMIN_BODY,
    guidance: undefined,
    completedStepIds: ["install"],
    currentStepId: "sign-in",
    welcomeRoutes: [
      { ...FIRST_RUN_SHELL.routes.connectors, label: "Admit a repository" },
      { ...FIRST_RUN_SHELL.routes.members, label: "Manage members" },
    ],
    steps: ADMIN_STEPS,
  },
  "admin-repo": {
    id: "admin-repo",
    selectorLabel: "Administrator · repository current",
    role: "Administrator",
    privacy: "collaborative",
    canManage: true,
    meta: "Administrator",
    heading: "Start collaborating in Cold Start Team",
    body: ADMIN_BODY,
    guidance: undefined,
    completedStepIds: ["install", "sign-in"],
    currentStepId: "repository",
    welcomeRoutes: [
      { ...FIRST_RUN_SHELL.routes.connectors, label: "Admit a repository" },
      { ...FIRST_RUN_SHELL.routes.members, label: "Manage members" },
    ],
    steps: ADMIN_STEPS,
  },
  "admin-mission": {
    id: "admin-mission",
    selectorLabel: "Administrator · mission current",
    role: "Administrator",
    privacy: "collaborative",
    canManage: true,
    meta: "Administrator",
    heading: "Start collaborating in Cold Start Team",
    body: ADMIN_BODY,
    guidance: undefined,
    completedStepIds: ["install", "sign-in", "repository"],
    currentStepId: "mission",
    welcomeRoutes: [
      { ...FIRST_RUN_SHELL.routes.connectors, label: "Admit a repository" },
      { ...FIRST_RUN_SHELL.routes.members, label: "Manage members" },
    ],
    steps: ADMIN_STEPS,
  },
  "member-repo": {
    id: "member-repo",
    selectorLabel: "Member · repository current",
    role: "Member",
    privacy: "collaborative",
    canManage: false,
    meta: "Member",
    heading: "Start collaborating in Cold Start Team",
    body: MEMBER_BODY,
    guidance: "An admin admits the first repository for the team.",
    completedStepIds: ["install", "sign-in"],
    currentStepId: "repository",
    welcomeRoutes: [],
    steps: MEMBER_STEPS,
  },
  "private-install": {
    id: "private-install",
    selectorLabel: "Private Teamspace · install current",
    role: "Administrator",
    privacy: "private",
    canManage: false,
    meta: "Private setup",
    heading: "Set up your private team workspace",
    body: PRIVATE_BODY,
    guidance: undefined,
    completedStepIds: [],
    currentStepId: "install",
    welcomeRoutes: [
      { ...FIRST_RUN_SHELL.routes.connectors, label: "Admit a repository" },
    ],
    steps: PRIVATE_STEPS,
  },
} satisfies Record<FirstRunFixtureId, FirstRunResponseFixture>);

const assertFirstRunAuthorization = (
  fixture: FirstRunResponseFixture,
): void => {
  const allRoutes = [
    ...fixture.welcomeRoutes,
    ...fixture.steps.flatMap((step) => (step.route ? [step.route] : [])),
  ];
  if (allRoutes.some((route) => safeTeamOverviewHref(route) === undefined)) {
    throw new Error("First-run fixture contains an unsafe route");
  }
  const membersReachable = allRoutes.some((route) => route.kind === "members");
  const admissionReachable = allRoutes.some(
    (route) => route.kind === "connectors",
  );
  if (
    membersReachable &&
    (!fixture.canManage || fixture.privacy === "private")
  ) {
    throw new Error("First-run fixture exposes Members without authorization");
  }
  if (admissionReachable && fixture.role === "Member") {
    throw new Error("First-run fixture exposes admission to a Member");
  }
  if (
    fixture.steps.filter((step) => step.id === fixture.currentStepId).length !==
    1
  ) {
    throw new Error("First-run fixture must supply exactly one current step");
  }
  if (
    fixture.completedStepIds.includes(fixture.currentStepId) ||
    fixture.completedStepIds.some(
      (id) => !fixture.steps.some((step) => step.id === id),
    )
  ) {
    throw new Error("First-run completed/current step facts conflict");
  }
};

export const projectFirstRunResponse = (
  fixture: FirstRunResponseFixture,
): DeepReadonly<FirstRunProjection> => {
  assertFirstRunAuthorization(fixture);
  const visibleSteps: Array<SetupStep & { readonly state: SetupStepState }> =
    [];
  for (const step of fixture.steps) {
    if (fixture.completedStepIds.includes(step.id)) {
      visibleSteps.push({ ...step, state: "completed" });
      continue;
    }
    if (fixture.currentStepId === step.id) {
      visibleSteps.push({ ...step, state: "current" });
    }
  }
  return deepFreezeTeamOverviewFixture({
    id: fixture.id,
    role: fixture.role,
    privacy: fixture.privacy,
    canManage: fixture.canManage,
    meta: fixture.meta,
    heading: fixture.heading,
    body: fixture.body,
    guidance: fixture.guidance,
    visibleSteps: visibleSteps.map((step) => ({
      ...step,
      commands: step.commands.map((command) => ({ ...command })),
      route: step.route ? { ...step.route } : undefined,
    })),
    welcomeRoutes: fixture.welcomeRoutes.map((route) => ({ ...route })),
  });
};

export const firstRunFixture = (
  id: FirstRunFixtureId,
): DeepReadonly<FirstRunResponseFixture> => {
  switch (id) {
    case "admin-install":
      return TEAM_OVERVIEW_FIRST_RUN_RESPONSES["admin-install"];
    case "joined":
      return TEAM_OVERVIEW_FIRST_RUN_RESPONSES.joined;
    case "admin-repo":
      return TEAM_OVERVIEW_FIRST_RUN_RESPONSES["admin-repo"];
    case "admin-mission":
      return TEAM_OVERVIEW_FIRST_RUN_RESPONSES["admin-mission"];
    case "member-repo":
      return TEAM_OVERVIEW_FIRST_RUN_RESPONSES["member-repo"];
    case "private-install":
      return TEAM_OVERVIEW_FIRST_RUN_RESPONSES["private-install"];
  }
};
