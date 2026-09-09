import type { Meta, StoryObj } from "@storybook/web-components";
import { html, nothing, type TemplateResult } from "lit";
import { createRef, ref, type Ref } from "lit/directives/ref.js";
import "../app-shell/sk-app-shell.js";
import type { SkAppShell } from "../app-shell/sk-app-shell.js";
import "../card/sk-card.js";
import "../context-sidebar/sk-context-sidebar.js";
import "../grid/sk-grid.js";
import "../notice/sk-notice.js";
import "../page-header/sk-page-header.js";
import "../personal-rail/sk-personal-rail.js";
import "../pill-tag/sk-pill-tag.js";
import "../section-header/sk-section-header.js";
import "../status-indicator/sk-status-indicator.js";

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

type CatalogueKey =
  | "overview"
  | "specify"
  | "plan"
  | "tasks"
  | "implement"
  | "research"
  | "contracts"
  | "checklists"
  | "quickstart"
  | "data-model"
  | "other"
  | "ops";

type ReadingState =
  "m1" | "m3" | "m4" | "m5" | "m6a" | "m6b" | "m7a" | "m7b" | "m8" | "long";

interface SourceChild {
  readonly label: string;
  readonly href: string;
}

interface SourceCatalogueEntry {
  readonly key: CatalogueKey;
  readonly label: string;
  readonly href: string;
}

interface CatalogueEntry extends SourceCatalogueEntry {
  readonly available: boolean;
  readonly current: boolean;
  readonly children: readonly SourceChild[];
}

interface MissionReadingFixture {
  readonly team: {
    readonly name: string;
  };
  readonly repository: {
    readonly name: string;
    readonly href: string;
  };
  readonly mission: {
    readonly name: string;
    readonly number: string;
    readonly href: string;
    readonly summary: string;
  };
  readonly git: {
    readonly sha: string;
    readonly branch: string;
  };
  readonly pushedMarker: {
    readonly sha: string;
    readonly branch: string;
    readonly pushedAt: string;
  };
  readonly catalogue: readonly SourceCatalogueEntry[];
  readonly boundedChildren: Readonly<
    Partial<Record<CatalogueKey, readonly SourceChild[]>>
  >;
  readonly otherArtifacts: readonly SourceChild[];
  readonly ops: readonly {
    readonly invocation: string;
    readonly action: string;
    readonly status: string;
  }[];
  readonly observed: {
    readonly freshness: string;
    readonly workPackage: string;
    readonly actor: string;
    readonly transition: string;
  };
  readonly reportedLive: {
    readonly freshness: string;
    readonly actor: string;
    readonly repository: string;
    readonly branch: string;
    readonly age: string;
  };
  readonly snapshot: {
    readonly sha: string;
    readonly message: string;
  };
  readonly document: {
    readonly intent: string;
    readonly success: readonly string[];
    readonly commands: readonly {
      readonly command: string;
      readonly purpose: string;
    }[];
  };
  readonly longValues: {
    readonly mission: string;
    readonly repository: string;
    readonly branch: string;
    readonly path: string;
    readonly unavailableLabel: string;
    readonly checklistChild: SourceChild;
  };
}

interface MissionReadingProjection {
  readonly page: SourceCatalogueEntry;
  readonly current: CatalogueKey | undefined;
  readonly catalogue: readonly CatalogueEntry[];
  readonly missionName: string;
  readonly repositoryName: string;
  readonly branch: string;
  readonly pushedAt: string | undefined;
  readonly content:
    | "specification"
    | "loading"
    | "other-present"
    | "other-absent"
    | "ops-present"
    | "ops-absent"
    | "truth";
  readonly snapshotBehind: boolean;
  readonly longPath: string | undefined;
}

/** Recursively freezes the sole story fixture so every projection starts from immutable truth. */
export const deepFreezeMissionReadingFixture = <T>(
  value: T,
): DeepReadonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value))
      deepFreezeMissionReadingFixture(child);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

/** The only authored source of repeated Mission Reading values in this pattern family. */
export const MISSION_READING_FIXTURE =
  deepFreezeMissionReadingFixture<MissionReadingFixture>({
    team: {
      name: "Collaborative Demo Team",
    },
    repository: {
      name: "spec-kitty/EXPERIMENTAL-spec-kitty-saas",
      href: "#repository",
    },
    mission: {
      name: "Launch resilience tranche A",
      number: "#1042",
      href: "#mission",
      summary:
        "Harden launch orchestration while preserving exact-commit evidence.",
    },
    git: {
      sha: "72c4e9a",
      branch: "feature/launch-resilience",
    },
    pushedMarker: {
      sha: "72c4e9a",
      branch: "feature/launch-resilience",
      pushedAt: "2026-08-31 14:12 UTC",
    },
    catalogue: [
      { key: "overview", label: "Overview", href: "#overview" },
      { key: "specify", label: "Specify", href: "#specify" },
      { key: "plan", label: "Plan", href: "#plan" },
      { key: "tasks", label: "Tasks", href: "#tasks" },
      { key: "implement", label: "Implement", href: "#implement" },
      { key: "research", label: "Research", href: "#research" },
      { key: "contracts", label: "Contracts", href: "#contracts" },
      { key: "checklists", label: "Checklists", href: "#checklists" },
      { key: "quickstart", label: "Quickstart", href: "#quickstart" },
      { key: "data-model", label: "Data model", href: "#data-model" },
      { key: "other", label: "Other artifacts", href: "#other-artifacts" },
      { key: "ops", label: "Ops", href: "#ops" },
    ],
    boundedChildren: {
      research: [
        { label: "Failure modes", href: "#research-failure-modes" },
        { label: "Recovery notes", href: "#research-recovery-notes" },
      ],
      contracts: [
        { label: "Launch request", href: "#contract-launch-request" },
        { label: "Rollback result", href: "#contract-rollback-result" },
      ],
    },
    otherArtifacts: [
      { label: "issue-matrix.md", href: "#artifact-issue-matrix" },
      { label: "lanes.json", href: "#artifact-lanes" },
      { label: "notes/x.yaml", href: "#artifact-notes-x" },
      { label: "tracers/approach.md", href: "#artifact-tracers-approach" },
    ],
    ops: [{ invocation: "inv-bound", action: "review", status: "done" }],
    observed: {
      freshness: "Observed · up to 60 s behind",
      workPackage: "WP02",
      actor: "lynn",
      transition: "moved to for_review",
    },
    reportedLive: {
      freshness: "Reported live · ≤90s",
      actor: "lynn",
      repository: "spec-kitty/EXPERIMENTAL-spec-kitty-saas",
      branch: "feature/launch-resilience",
      age: "47 s",
    },
    snapshot: {
      sha: "72c4e9a",
      message:
        "This rendered snapshot is behind the activity log but remains pinned to commit",
    },
    document: {
      intent:
        "Make launch recovery predictable without inventing status beyond the selected commit.",
      success: [
        "The launch path records the exact commit that produced the document.",
        "A failed launch leaves a bounded recovery trail.",
        "Operators can distinguish repository fact from activity observations.",
      ],
      commands: [
        {
          command: "spec-kitty next",
          purpose: "Advance the mission state machine.",
        },
        {
          command: "spec-kitty accept",
          purpose: "Run the mission acceptance gate.",
        },
        {
          command: "spec-kitty merge",
          purpose: "Apply the authorized merge workflow.",
        },
      ],
    },
    longValues: {
      mission:
        "Launch resilience tranche A with a deliberately long mission label that must wrap without clipping",
      repository:
        "spec-kitty/EXPERIMENTAL-spec-kitty-saas-with-an-intentionally-long-repository-segment",
      branch:
        "feature/launch-resilience-with-an-intentionally-long-unbroken-branch-suffix",
      path: "research/launch-orchestration/recovery/threshold-edge/very-long-source-document-name-without-a-short-alias.md",
      unavailableLabel:
        "Quickstart with a deliberately long unavailable destination label that must remain contained",
      checklistChild: {
        label:
          "pre-release-verification-with-a-deliberately-long-contained-label.md",
        href: "#checklist-pre-release-verification",
      },
    },
  });

/** Returns a pushed time only when its explicit marker describes the same branch and commit. */
export const selectPushedTime = (
  git: DeepReadonly<MissionReadingFixture["git"]>,
  marker?: DeepReadonly<MissionReadingFixture["pushedMarker"]>,
): string | undefined =>
  marker?.sha === git.sha && marker.branch === git.branch
    ? marker.pushedAt
    : undefined;

const AVAILABLE_BY_DEFAULT: readonly CatalogueKey[] = [
  "overview",
  "specify",
  "plan",
  "tasks",
  "implement",
  "research",
  "contracts",
  "ops",
];

const routeTruth = (
  state: ReadingState,
): Readonly<{
  page: CatalogueKey;
  current: CatalogueKey | undefined;
  available: readonly CatalogueKey[];
  content: MissionReadingProjection["content"];
}> => {
  switch (state) {
    case "m3":
      return {
        page: "specify",
        current: "specify",
        available: AVAILABLE_BY_DEFAULT,
        content: "loading",
      };
    case "m4":
      return {
        page: "specify",
        current: "specify",
        available: AVAILABLE_BY_DEFAULT.filter((key) => key !== "plan"),
        content: "specification",
      };
    case "m5":
      return {
        page: "specify",
        current: "specify",
        available: AVAILABLE_BY_DEFAULT,
        content: "specification",
      };
    case "m6a":
      return {
        page: "other",
        current: "other",
        available: [...AVAILABLE_BY_DEFAULT, "other"],
        content: "other-present",
      };
    case "m6b":
      return {
        page: "other",
        current: undefined,
        available: AVAILABLE_BY_DEFAULT,
        content: "other-absent",
      };
    case "m7a":
      return {
        page: "ops",
        current: "ops",
        available: AVAILABLE_BY_DEFAULT,
        content: "ops-present",
      };
    case "m7b":
      return {
        page: "ops",
        current: undefined,
        available: AVAILABLE_BY_DEFAULT.filter((key) => key !== "ops"),
        content: "ops-absent",
      };
    case "m8":
      return {
        page: "overview",
        current: "overview",
        available: AVAILABLE_BY_DEFAULT,
        content: "truth",
      };
    case "long":
      return {
        page: "specify",
        current: "specify",
        available: [...AVAILABLE_BY_DEFAULT, "checklists"],
        content: "specification",
      };
    case "m1":
      return {
        page: "specify",
        current: "specify",
        available: AVAILABLE_BY_DEFAULT,
        content: "specification",
      };
  }
};

/** Purely selects one reviewed route state from the immutable fixture. */
export const projectMissionReading = (
  fixture: DeepReadonly<MissionReadingFixture>,
  state: ReadingState,
  includeMatchingPushedMarker = false,
): DeepReadonly<MissionReadingProjection> => {
  const route = routeTruth(state);
  const long = state === "long";
  const page = fixture.catalogue.find((entry) => entry.key === route.page);
  if (!page) throw new TypeError(`Missing catalogue page: ${route.page}`);
  const catalogue = fixture.catalogue.map((source): CatalogueEntry => {
    const available = route.available.includes(source.key);
    let children: readonly SourceChild[] = [];
    if (available) {
      if (source.key === "other" && state === "m6a")
        children = fixture.otherArtifacts;
      else if (source.key === "checklists" && state === "long")
        children = [fixture.longValues.checklistChild];
      else children = fixture.boundedChildren[source.key] ?? [];
    }
    return {
      ...source,
      label:
        long && source.key === "quickstart"
          ? fixture.longValues.unavailableLabel
          : source.label,
      available,
      current: available && route.current === source.key,
      children,
    };
  });

  return deepFreezeMissionReadingFixture({
    page,
    current: route.current,
    catalogue,
    missionName: long ? fixture.longValues.mission : fixture.mission.name,
    repositoryName: long
      ? fixture.longValues.repository
      : fixture.repository.name,
    branch: long ? fixture.longValues.branch : fixture.git.branch,
    pushedAt: includeMatchingPushedMarker
      ? selectPushedTime(fixture.git, fixture.pushedMarker)
      : selectPushedTime(fixture.git),
    content: route.content,
    snapshotBehind: state === "m5",
    longPath: long ? fixture.longValues.path : undefined,
  });
};

const patternStyles = html`<style>
  .sk-mission-reading-pattern {
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 100%;
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }

  .sk-mission-reading-pattern *,
  .sk-mission-reading-pattern *::before,
  .sk-mission-reading-pattern *::after {
    box-sizing: border-box;
  }

  .sk-mission-reading-pattern__rail-link,
  .sk-mission-reading-pattern__back-link,
  .sk-mission-reading-pattern__artifact-link {
    color: var(--sk-fg-default);
    font: inherit;
    overflow-wrap: anywhere;
  }

  .sk-mission-reading-pattern__rail-link {
    display: grid;
    place-items: center;
    min-block-size: var(--sk-space-9);
    padding: var(--sk-space-2);
    border-radius: var(--sk-radius-sm);
    text-decoration: none;
  }

  .sk-mission-reading-pattern__rail-link:hover {
    background: var(--sk-surface-muted);
    text-decoration: underline;
  }

  .sk-mission-reading-pattern__rail-link:focus-visible,
  .sk-mission-reading-pattern__back-link:focus-visible,
  .sk-mission-reading-pattern__artifact-link:focus-visible,
  .sk-mission-reading-pattern__drawer-trigger:focus-visible {
    outline: var(--sk-border-width-2) solid var(--sk-border-focus);
    outline-offset: var(--sk-border-width-1);
  }

  .sk-mission-reading-pattern__sidebar-heading,
  .sk-mission-reading-pattern__compact-header,
  .sk-mission-reading-pattern__header-status,
  .sk-mission-reading-pattern__facts-value,
  .sk-mission-reading-pattern__truth-meta,
  .sk-mission-reading-pattern__placeholder,
  .sk-mission-reading-pattern__artifact-list,
  .sk-mission-reading-pattern__truth-list {
    min-inline-size: 0;
  }

  .sk-mission-reading-pattern__sidebar-heading {
    display: grid;
    gap: var(--sk-space-2);
  }

  .sk-mission-reading-pattern__sidebar-heading strong,
  .sk-mission-reading-pattern__compact-identity,
  .sk-mission-reading-pattern__facts-value,
  .sk-mission-reading-pattern__truth-list,
  .sk-mission-reading-pattern__document-path {
    overflow-wrap: anywhere;
  }

  .sk-mission-reading-pattern__compact-header {
    display: flex;
    align-items: center;
    gap: var(--sk-space-3);
  }

  .sk-mission-reading-pattern__drawer-trigger {
    min-block-size: var(--sk-space-9);
    padding-block: var(--sk-space-2);
    padding-inline: var(--sk-space-3);
    color: var(--sk-fg-default);
    background: var(--sk-surface-card);
    border: var(--sk-border-width-1) solid var(--sk-border-default);
    border-radius: var(--sk-radius-sm);
    font: inherit;
    font-weight: var(--sk-weight-semibold);
    cursor: pointer;
  }

  .sk-mission-reading-pattern__drawer-trigger:hover {
    background: var(--sk-surface-muted);
  }

  .sk-mission-reading-pattern__compact-identity {
    font-weight: var(--sk-weight-semibold);
  }

  .sk-mission-reading-pattern__compact-navigation {
    inline-size: var(--sk-layout-context-sidebar-width);
    max-inline-size: 100%;
  }

  .sk-mission-reading-pattern__header-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sk-space-2);
  }

  .sk-mission-reading-pattern__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-inline-size: 0;
    gap: var(--sk-space-6);
    padding: var(--sk-space-6);
  }

  .sk-mission-reading-pattern__compact-header:not([inert])
    ~ .sk-mission-reading-pattern__content {
    padding-inline: var(--sk-space-4);
  }

  .sk-mission-reading-pattern__facts-value {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-2);
  }

  .sk-mission-reading-pattern__document-frame,
  .sk-mission-reading-pattern__truth-region {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-inline-size: 0;
    gap: var(--sk-space-4);
  }

  .sk-mission-reading-pattern__document-path,
  .sk-mission-reading-pattern__truth-meta {
    margin: 0;
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
  }

  .sk-mission-reading-pattern__loading-region {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sk-space-4);
    min-inline-size: 0;
  }

  .sk-mission-reading-pattern__placeholder {
    display: grid;
    gap: var(--sk-space-3);
    padding: var(--sk-space-4);
    background: var(--sk-surface-card);
    border: var(--sk-border-width-1) solid var(--sk-border-default);
    border-radius: var(--sk-radius-md);
  }

  .sk-mission-reading-pattern__placeholder-line {
    display: block;
    inline-size: calc(var(--sk-space-12) * 4);
    max-inline-size: 100%;
    block-size: var(--sk-space-3);
    background: var(--sk-surface-muted);
    border-radius: var(--sk-radius-sm);
  }

  .sk-mission-reading-pattern__placeholder-line--short {
    inline-size: calc(var(--sk-space-12) * 2);
  }

  .sk-mission-reading-pattern__placeholder-line--medium {
    inline-size: calc(var(--sk-space-12) * 3);
  }

  .sk-mission-reading-pattern__artifact-list,
  .sk-mission-reading-pattern__truth-list {
    margin: 0;
    padding-inline-start: var(--sk-space-6);
  }

  .sk-mission-reading-pattern__artifact-list {
    display: grid;
    gap: var(--sk-space-3);
  }

  .sk-mission-reading-pattern__empty-heading {
    margin-block-start: 0;
  }

  .sk-mission-reading-pattern__truth-grid {
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  .sk-mission-reading-pattern__document-frame > sk-card,
  .sk-mission-reading-pattern__document-frame > sk-section-header,
  .sk-mission-reading-pattern__loading-region > sk-section-header,
  .sk-mission-reading-pattern__truth-region > sk-card,
  .sk-mission-reading-pattern__truth-region > sk-section-header {
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  .sk-mission-reading-pattern__status-marker {
    font-weight: var(--sk-weight-semibold);
  }

  .sk-mission-reading-pattern__breadcrumb-current {
    color: var(--sk-fg-default);
    font-weight: var(--sk-weight-semibold);
  }

  @media (forced-colors: active) {
    .sk-mission-reading-pattern__drawer-trigger,
    .sk-mission-reading-pattern__placeholder {
      border-color: CanvasText;
    }

    .sk-mission-reading-pattern__placeholder-line {
      background: CanvasText;
    }
  }
</style>`;

const navChildren = (
  children: readonly SourceChild[],
): TemplateResult | typeof nothing =>
  children.length
    ? html`<ul class="sk-context-nav__children">
        ${children.map(
          (child) =>
            html`<li class="sk-context-nav__item">
              <a class="sk-context-nav__link" href=${child.href}>
                <span class="sk-context-nav__label">${child.label}</span>
              </a>
            </li>`,
        )}
      </ul>`
    : nothing;

const contextNavigation = (
  projection: DeepReadonly<MissionReadingProjection>,
  placement: "desktop" | "compact",
): TemplateResult =>
  html`<nav
    class="sk-context-nav"
    data-context-nav=${placement}
    aria-label=${placement === "desktop" ? "Mission pages" : "Compact Mission pages"}
  >
    <div class="sk-context-nav__group">
      <p class="sk-context-nav__heading">Mission catalogue</p>
      <ul class="sk-context-nav__list">
        ${projection.catalogue.map(
          (entry) =>
            html`<li
              class="sk-context-nav__item"
              data-catalogue-key=${entry.key}
            >
              ${
                entry.available
                  ? html`<a
                      class="sk-context-nav__link"
                      href=${entry.href}
                      aria-current=${entry.current ? "page" : nothing}
                      ><span class="sk-context-nav__label"
                        >${entry.label}</span
                      ></a
                    >`
                  : html`<span
                      class="sk-context-nav__unavailable"
                      aria-disabled="true"
                    >
                      <span class="sk-context-nav__label">${entry.label}</span>
                      <span class="sk-context-nav__annotation"
                        >Unavailable</span
                      >
                    </span>`
              }
              ${navChildren(entry.children)}
            </li>`,
        )}
      </ul>
    </div>
  </nav>`;

const personalRail = (): TemplateResult =>
  html`<sk-personal-rail slot="personal-rail" label="Team Kitty">
    <a
      class="sk-mission-reading-pattern__rail-link"
      slot="primary"
      href="#home"
      aria-label="Spec Kitty home"
      >SK</a
    >
    <a
      class="sk-mission-reading-pattern__rail-link"
      slot="primary"
      href="#work"
      aria-label="Work"
      >W</a
    >
    <a
      class="sk-mission-reading-pattern__rail-link"
      slot="account"
      href="#account"
      aria-label="Account for lynn"
      >LY</a
    >
    <a
      class="sk-mission-reading-pattern__rail-link"
      slot="logout"
      href="#sign-out"
      aria-label="Sign out"
      >O</a
    >
  </sk-personal-rail>`;

const contextSidebar = (
  projection: DeepReadonly<MissionReadingProjection>,
  placement: "desktop" | "compact",
): TemplateResult =>
  html`<sk-context-sidebar
    class=${
      placement === "compact"
        ? "sk-mission-reading-pattern__compact-navigation"
        : nothing
    }
    slot=${placement === "desktop" ? "context-sidebar" : "compact-navigation"}
    id=${placement === "compact" ? "mission-reading-navigation" : nothing}
    label=${placement === "desktop" ? "Mission context" : "Compact Mission context"}
  >
    <div class="sk-mission-reading-pattern__sidebar-heading" slot="header">
      <a
        class="sk-mission-reading-pattern__back-link"
        href=${MISSION_READING_FIXTURE.repository.href}
        >Back to repository</a
      >
      <span>${projection.repositoryName}</span>
      <strong
        >${projection.missionName}
        ${MISSION_READING_FIXTURE.mission.number}</strong
      >
    </div>
    ${contextNavigation(projection, placement)}
  </sk-context-sidebar>`;

const pageHeader = (
  projection: DeepReadonly<MissionReadingProjection>,
): TemplateResult =>
  html`<sk-page-header slot="page-header">
    <span slot="eyebrow">Mission dossier</span>
    <h1 slot="title">
      ${projection.missionName} ${MISSION_READING_FIXTURE.mission.number}
    </h1>
    <p slot="supporting">${MISSION_READING_FIXTURE.mission.summary}</p>
    <div class="sk-mission-reading-pattern__header-status" slot="sync">
      <sk-status-indicator tone="info">
        <span class="sk-mission-reading-pattern__status-marker" slot="marker"
          >i</span
        >
        Git activity · factual · rendered
      </sk-status-indicator>
    </div>
  </sk-page-header>`;

const breadcrumbs = (
  projection: DeepReadonly<MissionReadingProjection>,
): TemplateResult =>
  html`<nav class="sk-breadcrumbs" aria-label="Breadcrumb">
    <ol class="sk-breadcrumbs__list">
      <li class="sk-breadcrumbs__item">
        <a class="sk-breadcrumbs__link" href="#teams">Teams</a>
      </li>
      <li class="sk-breadcrumbs__item">
        <a
          class="sk-breadcrumbs__link"
          href=${MISSION_READING_FIXTURE.repository.href}
          >${projection.repositoryName}</a
        >
      </li>
      <li class="sk-breadcrumbs__item">
        <a
          class="sk-breadcrumbs__link"
          href=${MISSION_READING_FIXTURE.mission.href}
          >${projection.missionName}</a
        >
      </li>
      <li class="sk-breadcrumbs__item">
        ${
          projection.current === projection.page.key
            ? html`<a
                class="sk-breadcrumbs__link"
                href=${projection.page.href}
                aria-current="page"
                >${projection.page.label}</a
              >`
            : html`<span class="sk-mission-reading-pattern__breadcrumb-current"
                >${projection.page.label}</span
              >`
        }
      </li>
    </ol>
  </nav>`;

const gitFacts = (
  projection: DeepReadonly<MissionReadingProjection>,
): TemplateResult =>
  html`<dl class="sk-facts" aria-label="Selected repository revision">
    <div class="sk-facts__item">
      <dt class="sk-facts__term">Planning commit</dt>
      <dd class="sk-facts__value sk-mission-reading-pattern__facts-value">
        <sk-pill-tag variant="purple"
          ><code>${MISSION_READING_FIXTURE.git.sha}</code></sk-pill-tag
        >
      </dd>
    </div>
    <div class="sk-facts__item">
      <dt class="sk-facts__term">Branch</dt>
      <dd class="sk-facts__value sk-mission-reading-pattern__facts-value">
        <code>${projection.branch}</code>
      </dd>
    </div>
    ${
      projection.pushedAt
        ? html`<div class="sk-facts__item">
            <dt class="sk-facts__term">Pushed</dt>
            <dd class="sk-facts__value sk-mission-reading-pattern__facts-value">
              ${projection.pushedAt}
            </dd>
          </div>`
        : nothing
    }
  </dl>`;

const observeOverflowOnlyRegion = (): ((
  element: Element | undefined,
) => void) => {
  let observer: ResizeObserver | undefined;
  return (element): void => {
    observer?.disconnect();
    observer = undefined;
    if (!(element instanceof HTMLElement)) return;
    const sync = (): void => {
      const overflowing = element.scrollWidth > element.clientWidth;
      element.toggleAttribute("tabindex", overflowing);
      if (overflowing) {
        element.setAttribute("tabindex", "0");
        element.setAttribute("role", "region");
        element.setAttribute(
          "aria-label",
          "Mission command reference, narrow view",
        );
      } else {
        element.removeAttribute("role");
        element.removeAttribute("aria-label");
      }
    };
    sync();
    observer = new ResizeObserver(sync);
    observer.observe(element);
  };
};

const commandsTable = (): TemplateResult => {
  const overflowRef = observeOverflowOnlyRegion();
  return html`<div
    ${ref(overflowRef)}
    class="sk-data-table__scroller"
    data-command-table-scroller
  >
    <table
      class="sk-data-table"
      style="min-inline-size: calc(var(--sk-space-12) * 5)"
    >
      <caption>
        Commands cited by this specification
      </caption>
      <thead>
        <tr>
          <th scope="col">Command</th>
          <th scope="col">Purpose</th>
        </tr>
      </thead>
      <tbody>
        ${MISSION_READING_FIXTURE.document.commands.map(
          (row) =>
            html`<tr>
              <th scope="row"><code>${row.command}</code></th>
              <td>${row.purpose}</td>
            </tr>`,
        )}
      </tbody>
    </table>
  </div>`;
};

const specificationDocument = (
  projection: DeepReadonly<MissionReadingProjection>,
): TemplateResult =>
  html`<section
    class="sk-mission-reading-pattern__document-frame"
    data-document-frame
    data-truth-region=${projection.content === "truth" ? "factual" : nothing}
    aria-labelledby="mission-document-heading"
  >
    <sk-section-header>
      <span slot="eyebrow">Factual · exact commit</span>
      <h2 slot="title" id="mission-document-heading">
        ${projection.page.label}
      </h2>
      <span slot="metadata">Selected document</span>
    </sk-section-header>
    ${
      projection.longPath
        ? html`<p class="sk-mission-reading-pattern__document-path">
            <code>${projection.longPath}</code>
          </p>`
        : nothing
    }
    <sk-card>
      <article class="sk-prose" aria-labelledby="mission-article-heading">
        <h3 id="mission-article-heading">
          ${projection.page.key === "overview" ? "Mission overview" : "Specification"}
        </h3>
        <p>${MISSION_READING_FIXTURE.document.intent}</p>
        <h4>Success conditions</h4>
        <ul>
          ${MISSION_READING_FIXTURE.document.success.map((item) => html`<li>${item}</li>`)}
        </ul>
        <h4>Command reference</h4>
        ${commandsTable()}
      </article>
    </sk-card>
  </section>`;

const loadingDocument = (): TemplateResult =>
  html`<div
    class="sk-mission-reading-pattern__loading-region"
    data-document-frame
    aria-busy="true"
    aria-labelledby="loading-heading"
  >
    <sk-section-header>
      <span slot="eyebrow">Selected document fragment</span>
      <h2 slot="title" id="loading-heading">Specify</h2>
    </sk-section-header>
    <p role="status">Loading rendered content…</p>
    <div class="sk-mission-reading-pattern__placeholder" aria-hidden="true">
      <span class="sk-mission-reading-pattern__placeholder-line"></span>
      <span
        class="sk-mission-reading-pattern__placeholder-line sk-mission-reading-pattern__placeholder-line--medium"
      ></span>
      <span
        class="sk-mission-reading-pattern__placeholder-line sk-mission-reading-pattern__placeholder-line--short"
      ></span>
    </div>
  </div>`;

const otherArtifacts = (present: boolean): TemplateResult =>
  html`<section
    class="sk-mission-reading-pattern__document-frame"
    data-document-frame
    aria-labelledby="other-artifacts-heading"
  >
    <sk-section-header>
      <span slot="eyebrow">Factual · exact commit</span>
      <h2 slot="title" id="other-artifacts-heading">Other artifacts</h2>
    </sk-section-header>
    ${
      present
        ? html`<sk-card>
            <ul
              class="sk-mission-reading-pattern__artifact-list"
              data-other-artifact-list
            >
              ${MISSION_READING_FIXTURE.otherArtifacts.map(
                (artifact) =>
                  html`<li>
                    <a
                      class="sk-mission-reading-pattern__artifact-link"
                      href=${artifact.href}
                      ><code>${artifact.label}</code></a
                    >
                  </li>`,
              )}
            </ul>
          </sk-card>`
        : html`<div class="sk-empty-state sk-empty-state--inline">
            <h3 class="sk-mission-reading-pattern__empty-heading">
              Artifacts absent in this commit
            </h3>
            <p>The selected commit supplies no additional artifacts.</p>
          </div>`
    }
  </section>`;

const opsDocument = (present: boolean): TemplateResult =>
  html`<section
    class="sk-mission-reading-pattern__document-frame"
    data-document-frame
    aria-labelledby="ops-heading"
  >
    <sk-section-header>
      <span slot="eyebrow">Factual · exact commit</span>
      <h2 slot="title" id="ops-heading">Ops</h2>
    </sk-section-header>
    ${
      present
        ? html`<div class="sk-data-table__scroller">
            <table class="sk-data-table">
              <caption>
                Recorded mission operations
              </caption>
              <thead>
                <tr>
                  <th scope="col">Invocation</th>
                  <th scope="col">Action</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                ${MISSION_READING_FIXTURE.ops.map(
                  (operation) =>
                    html`<tr data-ops-row>
                      <td data-field="invocation">
                        <code>${operation.invocation}</code>
                      </td>
                      <td data-field="action">${operation.action}</td>
                      <td data-field="status">${operation.status}</td>
                    </tr>`,
                )}
              </tbody>
            </table>
          </div>`
        : html`<div class="sk-empty-state sk-empty-state--inline">
            <h3 class="sk-mission-reading-pattern__empty-heading">
              Ops absent in this commit
            </h3>
            <p>The selected commit supplies no recorded operations.</p>
          </div>`
    }
  </section>`;

const truthRegions = (
  projection: DeepReadonly<MissionReadingProjection>,
): TemplateResult =>
  html` ${specificationDocument(projection)}
    <sk-grid
      class="sk-mission-reading-pattern__truth-grid"
      variant="cols-2"
      gap="4"
    >
      <section
        class="sk-mission-reading-pattern__truth-region"
        data-truth-region="observed"
        aria-labelledby="observed-heading"
      >
        <sk-section-header>
          <span slot="eyebrow">Activity stream</span>
          <h2 slot="title" id="observed-heading">Observed activity</h2>
          <span slot="metadata"
            >${MISSION_READING_FIXTURE.observed.freshness}</span
          >
        </sk-section-header>
        <sk-card status="info">
          <p class="sk-mission-reading-pattern__truth-meta">
            <sk-status-indicator tone="info"
              ><span slot="marker">i</span>Observed event</sk-status-indicator
            >
          </p>
          <ul class="sk-mission-reading-pattern__truth-list">
            <li>
              <strong>${MISSION_READING_FIXTURE.observed.workPackage}</strong>
            </li>
            <li>${MISSION_READING_FIXTURE.observed.actor}</li>
            <li>${MISSION_READING_FIXTURE.observed.transition}</li>
          </ul>
        </sk-card>
      </section>
      <section
        class="sk-mission-reading-pattern__truth-region"
        data-truth-region="reported-live"
        aria-labelledby="live-heading"
      >
        <sk-section-header>
          <span slot="eyebrow">Runtime presence</span>
          <h2 slot="title" id="live-heading">Reported presence</h2>
          <span slot="metadata"
            >${MISSION_READING_FIXTURE.reportedLive.freshness}</span
          >
        </sk-section-header>
        <sk-card status="attention">
          <p class="sk-mission-reading-pattern__truth-meta">
            <sk-status-indicator tone="attention"
              ><span slot="marker">!</span>Presence ·
              unverified</sk-status-indicator
            >
          </p>
          <ul class="sk-mission-reading-pattern__truth-list">
            <li>Actor: ${MISSION_READING_FIXTURE.reportedLive.actor}</li>
            <li>
              Repository: ${MISSION_READING_FIXTURE.reportedLive.repository}
            </li>
            <li>Branch: ${MISSION_READING_FIXTURE.reportedLive.branch}</li>
            <li>Age: ${MISSION_READING_FIXTURE.reportedLive.age}</li>
          </ul>
        </sk-card>
      </section>
    </sk-grid>`;

const selectedContent = (
  projection: DeepReadonly<MissionReadingProjection>,
): TemplateResult => {
  switch (projection.content) {
    case "loading":
      return loadingDocument();
    case "other-present":
      return otherArtifacts(true);
    case "other-absent":
      return otherArtifacts(false);
    case "ops-present":
      return opsDocument(true);
    case "ops-absent":
      return opsDocument(false);
    case "truth":
      return truthRegions(projection);
    case "specification":
      return specificationDocument(projection);
  }
};

const snapshotNotice = (): TemplateResult =>
  html`<sk-notice
    tone="attention"
    announce="off"
    message="${MISSION_READING_FIXTURE.snapshot.message} ${MISSION_READING_FIXTURE.snapshot.sha}."
  >
    <h2 slot="heading">Snapshot behind log</h2>
  </sk-notice>`;

const connectCompactControls = (
  shellRef: Ref<SkAppShell>,
  triggerRef: Ref<HTMLButtonElement>,
): void => {
  const shell = shellRef.value;
  const trigger = triggerRef.value;
  if (shell && trigger) shell.compactTrigger = trigger;
};

/** Renders a reviewed Mission Reading route entirely from public design-system surfaces. */
export const renderMissionReading = (
  state: ReadingState,
  options: Readonly<{
    light?: boolean;
    direction?: "ltr" | "rtl";
    open?: boolean;
  }> = {},
): TemplateResult => {
  const projection = projectMissionReading(MISSION_READING_FIXTURE, state);
  const shellRef = createRef<SkAppShell>();
  const triggerRef = createRef<HTMLButtonElement>();

  const setOpen = (next: boolean): void => {
    const shell = shellRef.value;
    const trigger = triggerRef.value;
    if (!shell || !trigger) return;
    shell.open = next;
    trigger.setAttribute("aria-expanded", String(next));
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

  return html`<div
    class="sk-mission-reading-pattern${options.light ? " sk-light" : ""}"
    dir=${options.direction ?? "ltr"}
    data-mission-reading-pattern
    data-render-complete="true"
  >
    ${patternStyles}
    <sk-app-shell
      ${ref((element) => {
        shellRef.value = element as SkAppShell;
        connectCompactControls(shellRef, triggerRef);
      })}
      presentation="compact"
      .open=${options.open ?? false}
      @sk-app-shell-dismiss=${() => setOpen(false)}
    >
      ${personalRail()} ${contextSidebar(projection, "desktop")}
      <div
        class="sk-mission-reading-pattern__compact-header"
        slot="compact-header"
      >
        <button
          ${ref((element) => {
            triggerRef.value = element as HTMLButtonElement;
            connectCompactControls(shellRef, triggerRef);
          })}
          class="sk-mission-reading-pattern__drawer-trigger"
          type="button"
          aria-label="Open Mission navigation"
          aria-controls="mission-reading-navigation"
          aria-expanded=${String(options.open ?? false)}
          @click=${() => setOpen(!(shellRef.value?.open ?? false))}
        >
          Menu
        </button>
        <span class="sk-mission-reading-pattern__compact-identity"
          >${MISSION_READING_FIXTURE.team.name}</span
        >
      </div>
      ${contextSidebar(projection, "compact")} ${pageHeader(projection)}
      <div class="sk-mission-reading-pattern__content">
        ${breadcrumbs(projection)} ${gitFacts(projection)}
        ${projection.snapshotBehind ? snapshotNotice() : nothing}
        ${selectedContent(projection)}
      </div>
    </sk-app-shell>
  </div>`;
};

const meta: Meta = {
  title: "Patterns/Mission Reading",
  tags: ["autodocs"],
  parameters: {
    a11y: { disable: false },
    layout: "fullscreen",
  },
  excludeStories: [
    "deepFreezeMissionReadingFixture",
    "MISSION_READING_FIXTURE",
    "selectPushedTime",
    "projectMissionReading",
    "renderMissionReading",
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: "M1 populated Specify — desktop",
  render: () => renderMissionReading("m1"),
};
export const M2Responsive390: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => renderMissionReading("m1"),
};
export const M2ControlledDrawerOpen: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => renderMissionReading("m1", { open: true }),
};
export const M3FragmentLoading: Story = {
  render: () => renderMissionReading("m3"),
};
export const M4CanonicalPageUnavailable: Story = {
  render: () => renderMissionReading("m4"),
};
export const M5SnapshotBehindLog: Story = {
  render: () => renderMissionReading("m5"),
};
export const M6aOtherArtifactsPresent: Story = {
  render: () => renderMissionReading("m6a"),
};
export const M6bOtherArtifactsAbsent: Story = {
  render: () => renderMissionReading("m6b"),
};
export const M7aOpsPresent: Story = {
  render: () => renderMissionReading("m7a"),
};
export const M7bOpsAbsent: Story = {
  render: () => renderMissionReading("m7b"),
};
export const M8TruthRegions: Story = {
  render: () => renderMissionReading("m8"),
};
export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => renderMissionReading("m1", { light: true }),
};
export const LongContent: Story = {
  render: () => renderMissionReading("long", { open: true }),
};
export const RTL: Story = {
  render: () => renderMissionReading("m1", { direction: "rtl" }),
};
