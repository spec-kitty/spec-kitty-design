/* eslint-disable @nx/enforce-module-boundaries -- #255: this behavior fixture directly exercises
   the story-only Dossier projection module. Exporting that module from the package would publish
   the runtime Dossier API that #255 explicitly forbids. */
import { describe, expect, test } from "vitest";
import {
  REPOSITORY_DOSSIER_FIXTURES,
  fixtureForRepositoryDossierState,
  projectRepositoryDossier,
  safeTrackerHref,
  type DossierFixture,
} from "../../../packages/elements/src/patterns/repository-dossier.fixture.js";

const expectDeeplyFrozen = (value: unknown): void => {
  if (value === null || typeof value !== "object") return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectDeeplyFrozen(child);
};

describe("Repository Dossier immutable fixture family", () => {
  test("every authored fixture is recursively frozen", () => {
    for (const fixture of Object.values(REPOSITORY_DOSSIER_FIXTURES)) {
      expectDeeplyFrozen(fixture);
    }
  });

  test("projection is repeatable and never freezes or mutates a caller-owned fixture", () => {
    const mutableFixture = structuredClone(
      REPOSITORY_DOSSIER_FIXTURES.populated,
    ) as DossierFixture;
    const before = structuredClone(mutableFixture);

    const first = projectRepositoryDossier(mutableFixture);
    const second = projectRepositoryDossier(mutableFixture);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(mutableFixture).toEqual(before);
    expect(Object.isFrozen(mutableFixture)).toBe(false);
    expect(Object.isFrozen(mutableFixture.navigation)).toBe(false);
    expect(Object.isFrozen(first)).toBe(true);
  });

  test("D1 supplies progress as total and percent without inventing completed work", () => {
    const fixture = fixtureForRepositoryDossierState("populated");
    expect(fixture.breadcrumbIndex).toEqual({ label: "Repos", href: "#repos" });
    expect(fixture.setupIntroduction).toEqual({
      heading: "Set up in this repo",
      body: "Create Missions from your laptop with the Spec Kitty CLI. They appear here at the exact commit you push.",
    });
    expect(fixture.snapshot?.pushed.label).toBe("6 minutes ago");
    expect(fixture.missions[0].progress).toEqual({ total: 8, percent: 62 });
    expect(fixture.missions[0].progress).not.toHaveProperty("completed");
    expect(
      fixture.missions.every((mission) => mission.copies.length === 0),
    ).toBe(true);
    expect(
      fixture.missions.every(
        (mission) =>
          mission.progress === undefined ||
          (mission.progress.percent >= 0 && mission.progress.percent <= 100),
      ),
    ).toBe(true);
  });

  test("D4 preserves exact supplied branch copies and omits the merged mission from navigation", () => {
    const fixture = fixtureForRepositoryDossierState("cross-branch");
    const copies = Object.fromEntries(
      fixture.missions.map((mission) => [mission.id, mission.copies]),
    );

    expect(copies).toEqual({
      "#1042": ["feature/launch-resilience", "release/launch-resilience"],
      "#1017": ["feature/repo-dossier", "main"],
      "#998": ["feature/fold-docstrings"],
    });
    expect(
      fixture.missions.find((mission) => mission.id === "#1017")?.merged,
    ).toEqual({ label: "Merged to default" });
    expect(
      fixture.navigation.repository?.missions.map((mission) => mission.href),
    ).toEqual(["#mission-1042", "#mission-998"]);
  });

  test("a supplied merged fact is consistent with a supplied default-branch copy", () => {
    for (const fixture of Object.values(REPOSITORY_DOSSIER_FIXTURES)) {
      for (const mission of fixture.missions) {
        if (!mission.merged) continue;
        expect(fixture.repository.defaultBranch).toBeDefined();
        expect(mission.copies).toContain(fixture.repository.defaultBranch);
      }
    }
  });

  test.each(["not-spec-kitty", "indexing", "completed-empty"] as const)(
    "%s uses only its supplied special-state navigation truth",
    (state) => {
      const fixture = fixtureForRepositoryDossierState(state);
      expect(fixture.navigation.repository).toBeUndefined();
      expect(fixture.navigation.emptyCopy).toBe("No repos with Missions yet.");
      expect(fixture.navigation.overflow).toEqual({
        label: "1 more admitted repo without Missions",
        href: "#connectors",
      });
    },
  );

  test("D5, D7, and D8 retain their distinct negative facts", () => {
    const terminal = fixtureForRepositoryDossierState("not-spec-kitty");
    expect(terminal.snapshot).toBeUndefined();
    expect(terminal.missions).toEqual([]);
    expect(terminal.repositoryLinks).toEqual([]);
    expect(terminal.setup).toEqual([]);
    expect(terminal.setupIntroduction).toBeUndefined();

    const indexing = fixtureForRepositoryDossierState("indexing");
    expect(indexing.snapshot).toBeUndefined();
    expect(indexing.missions).toEqual([]);
    expect(indexing.repositoryLinks).toEqual([]);
    expect(indexing.setup).toEqual([]);
    expect(indexing.setupIntroduction).toBeUndefined();
    expect(indexing.busyMessage).toMatch(/first complete render/i);

    const empty = fixtureForRepositoryDossierState("completed-empty");
    expect(empty.snapshot).toBeDefined();
    expect(empty.missions).toEqual([]);
    expect(empty.repositoryLinks).not.toEqual([]);
    expect(empty.setup).not.toEqual([]);
  });

  test("D6 scopes the supplied affected SHA and warning to exactly one mission", () => {
    const fixture = fixtureForRepositoryDossierState("snapshot-behind");
    const affected = fixture.missions.filter(
      (mission) => mission.snapshotWarning !== undefined,
    );

    expect(affected).toHaveLength(1);
    expect(affected[0].id).toBe("#998");
    expect(affected[0].affectedSha).toBe(fixture.snapshot?.sha);
  });

  test("threshold fixtures preserve the three supplied adjacent percentages", () => {
    const fixture = fixtureForRepositoryDossierState("thresholds");
    expect(fixture.missions.map((mission) => mission.progress)).toEqual([
      { total: 100, percent: 59 },
      { total: 100, percent: 60 },
      { total: 100, percent: 61 },
    ]);
  });
});

describe("Repository Dossier tracker destinations", () => {
  test("the resilience fixture supplies one safe, one unsafe, and one absent tracker destination", () => {
    const fixture = fixtureForRepositoryDossierState("tracker-destinations");
    expect(fixture.missions.map((mission) => mission.tracker)).toEqual([
      {
        label: "Tracker #1042",
        href: "https://tracker.example.test/issues/1042",
      },
      { label: "Unsafe tracker fixture", href: "javascript:alert(1)" },
      undefined,
    ]);
    expect(safeTrackerHref(fixture.missions[0].tracker?.href)).toBe(
      "https://tracker.example.test/issues/1042",
    );
    expect(safeTrackerHref(fixture.missions[1].tracker?.href)).toBeUndefined();
  });

  test.each([
    undefined,
    "",
    "/issues/1042",
    "#1042",
    "not a URL",
    "javascript:alert(1)",
  ])(
    "rejects missing, relative, malformed, or unsafe destination %s",
    (value) => {
      expect(safeTrackerHref(value)).toBeUndefined();
    },
  );

  test.each([
    "https://github.com/spec-kitty/spec-kitty-design/issues/255",
    "http://tracker.example.test/issues/1042?view=compact#status",
  ])("preserves a supplied HTTP(S) destination byte-for-byte", (value) => {
    expect(safeTrackerHref(value)).toBe(value);
  });
});
