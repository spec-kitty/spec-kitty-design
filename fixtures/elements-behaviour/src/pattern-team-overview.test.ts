/* eslint-disable @nx/enforce-module-boundaries -- #383: this fixture suite directly exercises the
   non-published Team Overview story projection module. Exporting it would create the runtime API
   that the programme handoff prohibits. */
import { render } from "lit";
import { describe, expect, test } from "vitest";
import {
  FIRST_RUN_SHELL,
  TEAM_OVERVIEW_FIRST_RUN_RESPONSES,
  TEAM_OVERVIEW_POPULATED_RESPONSE,
  firstRunFixture,
  projectFirstRunResponse,
  projectPopulatedOverview,
  safeTeamOverviewHref,
  type FirstRunResponseFixture,
  type PopulatedOverviewResponse,
  type TeamMomentRecord,
} from "../../../packages/elements/src/patterns/team-overview.fixture.js";
import { renderTeamOverviewRoute } from "../../../packages/elements/src/patterns/team-overview.route.fixture.js";

const expectDeeplyFrozen = (value: unknown): void => {
  if (value === null || typeof value !== "object") return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectDeeplyFrozen(child);
};

describe("Team Overview populated response and projection", () => {
  test("the authored source and every returned projection are deeply frozen", () => {
    expectDeeplyFrozen(TEAM_OVERVIEW_POPULATED_RESPONSE);
    expectDeeplyFrozen(
      projectPopulatedOverview(TEAM_OVERVIEW_POPULATED_RESPONSE),
    );
  });

  test("derives each retention label, cell count, and total from canonical inputs", () => {
    const current = projectPopulatedOverview(
      TEAM_OVERVIEW_POPULATED_RESPONSE,
      "default",
    );
    const alternate = projectPopulatedOverview(
      TEAM_OVERVIEW_POPULATED_RESPONSE,
      "alternate",
    );

    for (const { input, projection } of [
      {
        input: TEAM_OVERVIEW_POPULATED_RESPONSE.retention.default,
        projection: current,
      },
      {
        input: TEAM_OVERVIEW_POPULATED_RESPONSE.retention.alternate,
        projection: alternate,
      },
    ]) {
      const includedMoments = TEAM_OVERVIEW_POPULATED_RESPONSE.moments.filter(
        (moment) =>
          input.cells.some((cell) => cell.id === moment.retentionCellId),
      );

      expect(projection.retention.retentionHours).toBe(input.retentionHours);
      expect(projection.retention.cells).toHaveLength(input.cells.length);
      expect(projection.eventTotal).toBe(includedMoments.length);
      expect(
        projection.retention.cells.reduce(
          (total, cell) => total + cell.count,
          0,
        ),
      ).toBe(includedMoments.length);
      expect(projection.retention.summary).toContain(
        String(input.retentionHours),
      );
      expect(projection.retention.summary).toContain(
        String(includedMoments.length),
      );
    }
    expect(alternate.retention).not.toEqual(current.retention);
  });

  test("cannot preserve a stale summary when retention hours and moment count or order change", () => {
    const caller = structuredClone(
      TEAM_OVERVIEW_POPULATED_RESPONSE,
    ) as unknown as PopulatedOverviewResponse;
    const [newest, middle, oldest] = caller.moments;
    const additional: TeamMomentRecord = {
      ...newest,
      id: "moment-adversarial",
      occurredAt: "2026-09-06T10:00:00Z",
    };
    const adversarial = {
      ...caller,
      retention: {
        ...caller.retention,
        default: {
          ...caller.retention.default,
          retentionHours: 96,
        },
      },
      moments: [middle, additional, oldest, newest],
    } satisfies PopulatedOverviewResponse;

    const projection = projectPopulatedOverview(adversarial);
    const expectedTotal = adversarial.moments.length;

    expect(expectedTotal).not.toBe(
      projectPopulatedOverview(TEAM_OVERVIEW_POPULATED_RESPONSE).eventTotal,
    );
    expect(projection.eventTotal).toBe(expectedTotal);
    expect(projection.retention.summary).toContain(String(expectedTotal));
    expect(projection.retention.summary).toContain(
      String(adversarial.retention.default.retentionHours),
    );
    expect(projection.retention.summary).not.toContain("72");
    expect(projection.recent.map((moment) => moment.id)).toEqual([
      "moment-002",
      "moment-adversarial",
      "moment-001",
      "moment-003",
    ]);
  });

  test("projection is deterministic and does not freeze or mutate caller-owned input", () => {
    const caller = structuredClone(
      TEAM_OVERVIEW_POPULATED_RESPONSE,
    ) as unknown as PopulatedOverviewResponse;
    const before = structuredClone(caller);

    const first = projectPopulatedOverview(caller);
    const second = projectPopulatedOverview(caller);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(caller).toEqual(before);
    expect(Object.isFrozen(caller)).toBe(false);
    expect(Object.isFrozen(caller.retention.default)).toBe(false);
  });

  test("caps recent rows at six and distinct in-flight Mission references at two", () => {
    const caller = structuredClone(
      TEAM_OVERVIEW_POPULATED_RESPONSE,
    ) as unknown as PopulatedOverviewResponse;
    const source = caller.moments[0];
    const extras = Array.from({ length: 5 }, (_, index): TeamMomentRecord => ({
      ...source,
      id: `extra-${index}`,
      missionRef: `mission-${index}`,
      missionRoute: {
        kind: "mission",
        label: `mission-${index}`,
        href: `/a/collaborative-demo-team/repos/e2e-team-landing/missions/mission-${index}/`,
      },
    }));
    const expanded = {
      ...caller,
      moments: [...caller.moments, ...extras],
    } satisfies PopulatedOverviewResponse;

    const projection = projectPopulatedOverview(expanded);

    expect(expanded.moments).toHaveLength(caller.moments.length + extras.length);
    expect(projection.recent).toHaveLength(6);
    expect(projection.inFlight).toHaveLength(2);
    expect(new Set(projection.inFlight.map((row) => row.missionRef)).size).toBe(
      2,
    );
  });

  test("preserves the reviewed repository facts and keeps activity records route-free at projection use", () => {
    const projection = projectPopulatedOverview(
      TEAM_OVERVIEW_POPULATED_RESPONSE,
    );

    expect(projection.repositories).toEqual([
      expect.objectContaining({
        name: "spec-kitty/e2e-team-landing",
        missionSummary: "1 mission not on default branch",
        sha: "17bd28375d5f",
        branch: "main",
        pushed: "0 minutes ago",
      }),
    ]);
    expect(projection.recent.map((row) => row.age)).toEqual([
      "2 hours ago",
      "1 day, 2 hours ago",
      "2 days, 2 hours ago",
    ]);
  });
});

describe("Team Overview supplied route allow-list", () => {
  test.each([
    TEAM_OVERVIEW_POPULATED_RESPONSE.routes.overview,
    TEAM_OVERVIEW_POPULATED_RESPONSE.routes.work,
    TEAM_OVERVIEW_POPULATED_RESPONSE.routes.connectors,
    TEAM_OVERVIEW_POPULATED_RESPONSE.routes.members,
    TEAM_OVERVIEW_POPULATED_RESPONSE.repositories[0].route,
    TEAM_OVERVIEW_POPULATED_RESPONSE.moments[0].missionRoute,
    FIRST_RUN_SHELL.routes.release,
  ])("preserves reviewed safe route $href", (route) => {
    expect(safeTeamOverviewHref(route)).toBe(route.href);
  });

  test.each([
    undefined,
    { kind: "overview", label: "Unsafe", href: "javascript:alert(1)" },
    { kind: "mission", label: "External", href: "https://example.test/" },
    { kind: "repository", label: "Traversal", href: "/a/demo/repos/../" },
    {
      kind: "release",
      label: "Lookalike",
      href: "https://github.example.test/spec-kitty/releases",
    },
  ] as const)("rejects an absent or unsafe route %#", (route) => {
    expect(safeTeamOverviewHref(route)).toBeUndefined();
  });

  test.each([
    {
      ...TEAM_OVERVIEW_POPULATED_RESPONSE.routes.members,
      href: TEAM_OVERVIEW_POPULATED_RESPONSE.routes.connectors.href,
    },
    {
      ...TEAM_OVERVIEW_POPULATED_RESPONSE.routes.connectors,
      href: TEAM_OVERVIEW_POPULATED_RESPONSE.routes.members.href,
    },
  ])("rejects a forged $kind kind/path pairing", (route) => {
    expect(safeTeamOverviewHref(route)).toBeUndefined();
  });

  test("unsafe populated routes survive projection as supplied passive copy and never render as actions", async () => {
    const caller = structuredClone(
      TEAM_OVERVIEW_POPULATED_RESPONSE,
    ) as unknown as PopulatedOverviewResponse;
    const membersPath = caller.routes.members.href;
    const connectorsPath = caller.routes.connectors.href;
    const forged = {
      ...caller,
      routes: {
        ...caller.routes,
        work: {
          ...caller.routes.work,
          label: "Work unavailable",
          href: "",
        },
        members: { ...caller.routes.members, href: connectorsPath },
        connectors: { ...caller.routes.connectors, href: membersPath },
      },
    } satisfies PopulatedOverviewResponse;

    expect(() => projectPopulatedOverview(forged)).not.toThrow();
    const host = document.createElement("div");
    document.body.append(host);
    render(
      [
        forged.routes.overview,
        forged.routes.work,
        forged.routes.connectors,
        forged.routes.members,
      ].map((route) => renderTeamOverviewRoute(route, "route-under-test")),
      host,
    );
    await Promise.resolve();

    expect(
      host.querySelector(
        `a[href="${TEAM_OVERVIEW_POPULATED_RESPONSE.routes.overview.href}"]`,
      )?.textContent,
    ).toBe("Overview");
    expect(host.querySelectorAll(`a[href="${membersPath}"]`)).toHaveLength(0);
    expect(host.querySelectorAll(`a[href="${connectorsPath}"]`)).toHaveLength(
      0,
    );
    expect(
      Array.from(host.querySelectorAll("[data-passive-route]")).map(
        (node) => node.textContent,
      ),
    ).toEqual(
      expect.arrayContaining(["Work unavailable", "Connectors", "Members"]),
    );
    expect(
      host.querySelector('[data-passive-route="connectors"]')?.textContent,
    ).toBe("Connectors");
    expect(
      host.querySelector('[data-passive-route="members"]')?.textContent,
    ).toBe("Members");
    host.remove();
  });
});

describe("Team Overview first-run responses", () => {
  test("contains exactly the six reviewed immutable server responses", () => {
    expect(Object.keys(TEAM_OVERVIEW_FIRST_RUN_RESPONSES)).toEqual([
      "admin-install",
      "joined",
      "admin-repo",
      "admin-mission",
      "member-repo",
      "private-install",
    ]);
    expect(Object.values(TEAM_OVERVIEW_FIRST_RUN_RESPONSES)).toHaveLength(6);
    expectDeeplyFrozen(TEAM_OVERVIEW_FIRST_RUN_RESPONSES);
  });

  test.each([
    ["admin-install", "Administrator", "collaborative", true, [], "install"],
    ["joined", "Administrator", "collaborative", true, ["install"], "sign-in"],
    [
      "admin-repo",
      "Administrator",
      "collaborative",
      true,
      ["install", "sign-in"],
      "repository",
    ],
    [
      "admin-mission",
      "Administrator",
      "collaborative",
      true,
      ["install", "sign-in", "repository"],
      "mission",
    ],
    [
      "member-repo",
      "Member",
      "collaborative",
      false,
      ["install", "sign-in"],
      "repository",
    ],
    ["private-install", "Administrator", "private", false, [], "install"],
  ] as const)(
    "%s preserves supplied role/privacy/manage/completed/current facts",
    (id, role, privacy, canManage, completed, current) => {
      const fixture = firstRunFixture(id);
      const projection = projectFirstRunResponse(fixture);

      expect(fixture).toMatchObject({
        id,
        role,
        privacy,
        canManage,
        completedStepIds: completed,
        currentStepId: current,
      });
      expect(
        projection.visibleSteps.map((step) => [step.id, step.state]),
      ).toEqual([
        ...completed.map((stepId) => [stepId, "completed"]),
        [current, "current"],
      ]);
      expectDeeplyFrozen(projection);
    },
  );

  test("authorization omits admission and Members for member, and Members for private setup", () => {
    const member = projectFirstRunResponse(firstRunFixture("member-repo"));
    const privateSetup = projectFirstRunResponse(
      firstRunFixture("private-install"),
    );
    const administrator = projectFirstRunResponse(
      firstRunFixture("admin-install"),
    );

    expect(member.welcomeRoutes).toEqual([]);
    expect(
      member.visibleSteps
        .flatMap((step) => (step.route ? [step.route.kind] : []))
        .filter((kind) => kind === "connectors" || kind === "members"),
    ).toEqual([]);
    expect(member.guidance).toBe(
      "An admin admits the first repository for the team.",
    );
    expect(privateSetup.welcomeRoutes.map((route) => route.kind)).toEqual([
      "connectors",
    ]);
    expect(
      privateSetup.visibleSteps.some((step) => step.route?.kind === "members"),
    ).toBe(false);
    expect(administrator.welcomeRoutes.map((route) => route.kind)).toEqual([
      "connectors",
      "members",
    ]);
  });

  test("rejects member admission and private Members routes instead of repairing supplied facts", () => {
    const member = structuredClone(
      firstRunFixture("member-repo"),
    ) as unknown as FirstRunResponseFixture;
    const privateSetup = structuredClone(
      firstRunFixture("private-install"),
    ) as unknown as FirstRunResponseFixture;

    expect(() =>
      projectFirstRunResponse({
        ...member,
        welcomeRoutes: [FIRST_RUN_SHELL.routes.connectors],
      }),
    ).toThrow(/admission/u);
    expect(() =>
      projectFirstRunResponse({
        ...privateSetup,
        welcomeRoutes: [FIRST_RUN_SHELL.routes.members],
      }),
    ).toThrow(/Members/u);
  });

  test("rejects forged Members and Connectors kind/path pairs before first-run projection", () => {
    const administrator = structuredClone(
      firstRunFixture("admin-install"),
    ) as unknown as FirstRunResponseFixture;
    const membersPath = FIRST_RUN_SHELL.routes.members.href;
    const connectorsPath = FIRST_RUN_SHELL.routes.connectors.href;

    expect(() =>
      projectFirstRunResponse({
        ...administrator,
        welcomeRoutes: [
          { ...FIRST_RUN_SHELL.routes.members, href: connectorsPath },
        ],
      }),
    ).toThrow(/unsafe route/u);
    expect(() =>
      projectFirstRunResponse({
        ...administrator,
        welcomeRoutes: [
          { ...FIRST_RUN_SHELL.routes.connectors, href: membersPath },
        ],
      }),
    ).toThrow(/unsafe route/u);
  });

  test("every command supplies copied, manual, and failed public copy-field messages", () => {
    const commands = Object.values(TEAM_OVERVIEW_FIRST_RUN_RESPONSES).flatMap(
      (fixture) => fixture.steps.flatMap((step) => step.commands),
    );

    expect(commands.length).toBeGreaterThan(0);
    for (const command of commands) {
      expect(command.value).not.toBe("");
      expect(command.label).toMatch(/^Copy/u);
      expect(command.successMessage).toBe("Copied to clipboard.");
      expect(command.manualMessage).toMatch(/system copy shortcut/u);
      expect(command.failureMessage).toMatch(/^Copy failed/u);
    }
  });

  test("projection does not mutate or freeze a caller-owned first-run response", () => {
    const caller = structuredClone(
      firstRunFixture("admin-mission"),
    ) as unknown as FirstRunResponseFixture;
    const before = structuredClone(caller);
    const first = projectFirstRunResponse(caller);
    const second = projectFirstRunResponse(caller);

    expect(first).toEqual(second);
    expect(caller).toEqual(before);
    expect(Object.isFrozen(caller)).toBe(false);
    expect(Object.isFrozen(caller.steps)).toBe(false);
  });
});
