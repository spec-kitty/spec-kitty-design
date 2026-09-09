import type { Meta, StoryObj } from "@storybook/web-components";
import { html, nothing, type TemplateResult } from "lit";
import { createRef, ref, type Ref } from "lit/directives/ref.js";
import "../action-row/sk-action-row.js";
import "../app-shell/sk-app-shell.js";
import type { SkAppShell } from "../app-shell/sk-app-shell.js";
import "../card/sk-card.js";
import "../context-sidebar/sk-context-sidebar.js";
import "../copy-field/sk-copy-field.js";
import "../notice/sk-notice.js";
import type { SkNotice } from "../notice/sk-notice.js";
import "../page-header/sk-page-header.js";
import "../personal-rail/sk-personal-rail.js";
import "../pill-tag/sk-pill-tag.js";
import "../status-indicator/sk-status-indicator.js";
import {
  fixtureForRepositoryDossierState,
  projectRepositoryDossier,
  safeTrackerHref,
  type DeepReadonly,
  type DossierProjection,
  type DossierState,
  type MissionRecord,
} from "./repository-dossier.fixture.js";

export {
  deepFreezeRepositoryDossierFixture,
  projectRepositoryDossier,
  REPOSITORY_DOSSIER_FIXTURES,
} from "./repository-dossier.fixture.js";

const patternStyles = html`<style>
  .sk-repository-dossier-pattern {
    box-sizing: border-box;
    min-block-size: 100vh;
    min-inline-size: 0;
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }

  .sk-repository-dossier-pattern sk-app-shell::part(shell) {
    min-block-size: 100vh;
  }

  .sk-repository-dossier-pattern__rail-link,
  .sk-repository-dossier-pattern__compact-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--sk-space-9);
    min-inline-size: var(--sk-space-9);
    color: var(--sk-fg-default);
    background: var(--sk-surface-pill);
    border: var(--sk-border-width-1) solid var(--sk-border-default);
    border-radius: var(--sk-radius-sm);
    font-family: var(--sk-font-mono);
    font-size: var(--sk-text-xs);
    font-weight: var(--sk-weight-semibold);
    text-decoration: none;
  }

  .sk-repository-dossier-pattern__sidebar-heading {
    display: grid;
    min-inline-size: 0;
    gap: var(--sk-space-1);
  }

  .sk-repository-dossier-pattern__sidebar-copy {
    overflow-wrap: anywhere;
  }

  .sk-repository-dossier-pattern__compact-header {
    display: flex;
    align-items: center;
    min-inline-size: 0;
    gap: var(--sk-space-3);
  }

  .sk-repository-dossier-pattern__drawer-trigger {
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

  .sk-repository-dossier-pattern__drawer-trigger:hover {
    background: var(--sk-surface-muted);
  }

  .sk-repository-dossier-pattern__compact-identity {
    min-inline-size: 0;
    color: var(--sk-fg-default);
    font-weight: var(--sk-weight-semibold);
    overflow-wrap: anywhere;
  }

  .sk-repository-dossier-pattern__compact-navigation {
    inline-size: var(--sk-layout-context-sidebar-width);
    max-inline-size: 100%;
  }

  .sk-repository-dossier-pattern__header-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sk-space-2);
  }

  .sk-repository-dossier-pattern__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    min-inline-size: 0;
    gap: var(--sk-space-6);
    padding: var(--sk-space-6);
  }

  .sk-repository-dossier-pattern__compact-header:not([inert])
    ~ .sk-repository-dossier-pattern__content {
    padding-inline: var(--sk-space-4);
  }

  .sk-repository-dossier-pattern__mission-card::part(card),
  .sk-repository-dossier-pattern__setup-card::part(card) {
    padding: 0;
    overflow: hidden;
  }

  .sk-repository-dossier-pattern__git-context {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    min-inline-size: 0;
    gap: var(--sk-space-4);
    padding: var(--sk-space-4);
    border-block: var(--sk-border-width-1) solid var(--sk-border-default);
  }

  .sk-repository-dossier-pattern__git-facts {
    min-inline-size: 0;
  }

  .sk-repository-dossier-pattern__git-value {
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  .sk-repository-dossier-pattern__repository-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .sk-repository-dossier-pattern__repository-link,
  .sk-repository-dossier-pattern__setup-link,
  .sk-repository-dossier-pattern__tracker-link,
  .sk-repository-dossier-pattern__mission-link {
    color: var(--sk-fg-default);
    text-underline-offset: var(--sk-space-1);
  }

  .sk-repository-dossier-pattern__mission-summary,
  .sk-repository-dossier-pattern__warning,
  .sk-repository-dossier-pattern__setup-body {
    margin: 0;
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
  }

  .sk-repository-dossier-pattern__section-heading,
  .sk-repository-dossier-pattern__setup-heading {
    margin: 0;
    color: var(--sk-fg-default);
    font-family: var(--sk-font-display);
    font-size: var(--sk-text-lg);
  }

  .sk-repository-dossier-pattern__mission-heading,
  .sk-repository-dossier-pattern__setup-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sk-space-3);
    padding: var(--sk-space-4);
    border-block-end: var(--sk-border-width-1) solid var(--sk-border-default);
  }

  .sk-repository-dossier-pattern__mission-list,
  .sk-repository-dossier-pattern__setup-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .sk-repository-dossier-pattern__mission-item
    + .sk-repository-dossier-pattern__mission-item,
  .sk-repository-dossier-pattern__setup-item
    + .sk-repository-dossier-pattern__setup-item {
    border-block-start: var(--sk-border-width-1) solid var(--sk-border-default);
  }

  .sk-repository-dossier-pattern__mission-supporting {
    display: grid;
    min-inline-size: 0;
    gap: var(--sk-space-2);
  }

  .sk-repository-dossier-pattern__copy-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sk-space-2);
  }

  .sk-repository-dossier-pattern__progress {
    min-inline-size: calc(var(--sk-space-12) * 3);
  }

  .sk-repository-dossier-pattern__setup-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    align-items: center;
    min-inline-size: 0;
    gap: var(--sk-space-5);
    padding: var(--sk-space-4);
  }

  .sk-repository-dossier-pattern__setup-copy {
    display: grid;
    min-inline-size: 0;
    gap: var(--sk-space-2);
  }

  .sk-repository-dossier-pattern__state-content {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: var(--sk-space-4);
  }

  .sk-repository-dossier-pattern__state-copy {
    display: grid;
    min-inline-size: 0;
    gap: var(--sk-space-3);
  }

  .sk-repository-dossier-pattern__state-copy > * {
    margin: 0;
  }

  @container (max-width: 720px) {
    .sk-repository-dossier-pattern__git-context,
    .sk-repository-dossier-pattern__setup-item {
      grid-template-columns: minmax(0, 1fr);
    }

    .sk-repository-dossier-pattern__repository-links {
      gap: var(--sk-space-3);
    }

    .sk-repository-dossier-pattern__progress {
      min-inline-size: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sk-repository-dossier-pattern__drawer-trigger {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .sk-repository-dossier-pattern__rail-link,
    .sk-repository-dossier-pattern__compact-mark,
    .sk-repository-dossier-pattern__drawer-trigger {
      border-color: CanvasText;
    }
  }
</style>`;

const personalRail = (
  projection: DeepReadonly<DossierProjection>,
): TemplateResult => html`
  <sk-personal-rail slot="personal-rail" label="Team Kitty">
    ${projection.fixture.navigation.personal.map(
      (link) =>
        html`<a
          class="sk-repository-dossier-pattern__rail-link"
          slot=${link.placement}
          href=${link.href}
          aria-label=${link.label}
          >${link.mark}</a
        >`,
    )}
  </sk-personal-rail>
`;

const repositoryNavigation = (
  projection: DeepReadonly<DossierProjection>,
  placement: "desktop" | "compact",
): TemplateResult => {
  const navigation = projection.fixture.navigation;
  return html`<nav
    class="sk-context-nav"
    aria-label=${placement === "desktop" ? "Team context" : "Compact Team context"}
    data-context-nav=${placement}
  >
    <section
      class="sk-context-nav__group"
      aria-labelledby=${`${placement}-team-pages`}
    >
      <h2 class="sk-context-nav__heading" id=${`${placement}-team-pages`}>
        Team
      </h2>
      <ul class="sk-context-nav__list">
        ${navigation.team.map(
          (link) =>
            html`<li class="sk-context-nav__item">
              <a class="sk-context-nav__link" href=${link.href}>
                <span class="sk-context-nav__label">${link.label}</span>
              </a>
            </li>`,
        )}
      </ul>
    </section>
    <section
      class="sk-context-nav__group"
      aria-labelledby=${`${placement}-repositories`}
    >
      <h2 class="sk-context-nav__heading" id=${`${placement}-repositories`}>
        Repos
      </h2>
      ${
        navigation.repository
          ? html`<ul class="sk-context-nav__list">
              <li class="sk-context-nav__item">
                <a
                  class="sk-context-nav__link"
                  href=${navigation.repository.href}
                  aria-current=${
                    navigation.repository.current ? "page" : nothing
                  }
                >
                  <span class="sk-context-nav__label"
                    >${navigation.repository.label}</span
                  >
                </a>
                <ul class="sk-context-nav__children">
                  ${navigation.repository.missions.map(
                    (missionLink) =>
                      html`<li class="sk-context-nav__item">
                        <a
                          class="sk-context-nav__link"
                          href=${missionLink.href}
                        >
                          <span class="sk-context-nav__label"
                            >${missionLink.label}</span
                          >
                        </a>
                      </li>`,
                  )}
                </ul>
              </li>
            </ul>`
          : html`${
              navigation.emptyCopy
                ? html`<p class="sk-context-nav__empty-copy">
                    ${navigation.emptyCopy}
                  </p>`
                : nothing
            }
            ${
                  navigation.overflow
                    ? html`<a
                        class="sk-context-nav__overflow-link"
                        href=${navigation.overflow.href}
                      >
                        ${navigation.overflow.label}
                      </a>`
                    : nothing
                }`
      }
    </section>
    <section
      class="sk-context-nav__group"
      aria-labelledby=${`${placement}-manage`}
    >
      <h2 class="sk-context-nav__heading" id=${`${placement}-manage`}>
        Manage
      </h2>
      <ul class="sk-context-nav__list">
        ${navigation.manage.map(
          (link) =>
            html`<li class="sk-context-nav__item">
              <a class="sk-context-nav__link" href=${link.href}>
                <span class="sk-context-nav__label">${link.label}</span>
              </a>
            </li>`,
        )}
      </ul>
    </section>
  </nav>`;
};

const contextSidebar = (
  projection: DeepReadonly<DossierProjection>,
  placement: "desktop" | "compact",
): TemplateResult => html`
  <sk-context-sidebar
    class=${
      placement === "compact"
        ? "sk-repository-dossier-pattern__compact-navigation"
        : nothing
    }
    slot=${placement === "desktop" ? "context-sidebar" : "compact-navigation"}
    id=${placement === "compact" ? "repository-dossier-navigation" : nothing}
    label=${placement === "desktop" ? "Repository context" : "Compact repository context"}
  >
    <div class="sk-repository-dossier-pattern__sidebar-heading" slot="header">
      <span
        class="sk-repository-dossier-pattern__compact-mark"
        aria-label="Current Team"
      >
        CD
      </span>
      <strong class="sk-repository-dossier-pattern__sidebar-copy">
        ${projection.fixture.team}
      </strong>
    </div>
    ${repositoryNavigation(projection, placement)}
  </sk-context-sidebar>
`;

const pageHeader = (
  projection: DeepReadonly<DossierProjection>,
): TemplateResult => html`
  <sk-page-header slot="page-header">
    <span slot="eyebrow">Repository Dossier</span>
    <h1 slot="title">${projection.title}</h1>
    <p slot="supporting">${projection.supporting}</p>
    ${
      projection.showGitContext
        ? html`<div
            class="sk-repository-dossier-pattern__header-status"
            slot="sync"
          >
            <sk-status-indicator tone="info">
              <span slot="marker">●</span>
              Git activity, factual
            </sk-status-indicator>
          </div>`
        : nothing
    }
  </sk-page-header>
`;

const breadcrumbs = (
  projection: DeepReadonly<DossierProjection>,
): TemplateResult => html`
  <nav class="sk-breadcrumbs" aria-label="Breadcrumb">
    <ol class="sk-breadcrumbs__list">
      <li class="sk-breadcrumbs__item">
        <a class="sk-breadcrumbs__link" href="#repos">Repos</a>
      </li>
      <li class="sk-breadcrumbs__item">
        <a
          class="sk-breadcrumbs__link"
          href=${projection.fixture.repository.href}
          aria-current="page"
          >${projection.fixture.repository.name}</a
        >
      </li>
    </ol>
  </nav>
`;

const gitContext = (
  projection: DeepReadonly<DossierProjection>,
): TemplateResult | typeof nothing => {
  const snapshot = projection.fixture.snapshot;
  if (!projection.showGitContext || !snapshot) return nothing;
  return html`<section
    class="sk-repository-dossier-pattern__git-context"
    aria-label="Exact git context"
    data-git-context
  >
    <dl
      class="sk-facts sk-facts--two-col sk-facts--compact sk-repository-dossier-pattern__git-facts"
    >
      <dt class="sk-facts__term">Commit</dt>
      <dd class="sk-facts__value sk-repository-dossier-pattern__git-value">
        <code data-repository-sha>${snapshot.sha}</code>
      </dd>
      <dt class="sk-facts__term">Branch</dt>
      <dd class="sk-facts__value sk-repository-dossier-pattern__git-value">
        <code data-repository-branch>${snapshot.branch}</code>
      </dd>
      <dt class="sk-facts__term">Pushed</dt>
      <dd class="sk-facts__value sk-repository-dossier-pattern__git-value">
        <time datetime=${snapshot.pushed.iso}>${snapshot.pushed.label}</time>
      </dd>
    </dl>
    <ul
      class="sk-repository-dossier-pattern__repository-links"
      aria-label="Repository documents"
    >
      ${projection.fixture.repositoryLinks.map(
        (link) =>
          html`<li>
            <a
              class="sk-repository-dossier-pattern__repository-link"
              href=${link.href}
              >${link.label}</a
            >
          </li>`,
      )}
    </ul>
  </section>`;
};

const missionProgress = (
  mission: DeepReadonly<MissionRecord>,
): TemplateResult | typeof nothing => {
  if (!mission.progress) return nothing;
  const progressId = `dossier-progress-${mission.id.replace(/[^a-z0-9]+/gi, "-")}`;
  return html`<div
    class="sk-progress sk-progress--narrow sk-repository-dossier-pattern__progress"
    slot="metadata"
    data-progress-record=${mission.id}
  >
    <label class="sk-progress__label" for=${progressId}
      >${mission.progress.total} Work Packages</label
    >
    <progress
      class="sk-progress__bar"
      id=${progressId}
      value=${mission.progress.percent}
      max="100"
    >
      ${mission.progress.percent}% done
    </progress>
    <span class="sk-progress__meta">${mission.progress.percent}% done</span>
  </div>`;
};

const missionTags = (mission: DeepReadonly<MissionRecord>): TemplateResult => {
  const trackerHref = safeTrackerHref(mission.tracker?.href);
  return html`
    ${
      mission.tracker
        ? trackerHref
          ? html`<a
              class="sk-repository-dossier-pattern__tracker-link"
              slot="tags"
              href=${trackerHref}
              >${mission.tracker.label}</a
            >`
          : html`<sk-pill-tag slot="tags" variant="purple"
              >${mission.tracker.label}</sk-pill-tag
            >`
        : nothing
    }
    ${
      mission.merged
        ? html`<sk-status-indicator slot="tags" tone="success">
            <span slot="marker">●</span>${mission.merged.label}
          </sk-status-indicator>`
        : nothing
    }
  `;
};

const missionSupporting = (
  mission: DeepReadonly<MissionRecord>,
): TemplateResult => html`
  <div
    class="sk-repository-dossier-pattern__mission-supporting"
    slot="supporting"
  >
    <p class="sk-repository-dossier-pattern__mission-summary">
      ${mission.summary}
    </p>
    ${
      mission.copies.length > 0
        ? html`<div
            class="sk-repository-dossier-pattern__copy-list"
            data-branch-copies=${mission.id}
            role="group"
            aria-label=${`Repository branch copies for ${mission.title}`}
          >
            <span>Copies</span>
            ${mission.copies.map(
            (branch) => html`<sk-pill-tag><code>${branch}</code></sk-pill-tag>`,
          )}
          </div>`
        : nothing
    }
    ${
      mission.snapshotWarning
        ? html`<div
            class="sk-repository-dossier-pattern__warning"
            data-snapshot-warning
          >
            <sk-status-indicator tone="attention">
              <span slot="marker">●</span>Snapshot behind log
            </sk-status-indicator>
            <span>${mission.snapshotWarning}</span>
            <code data-affected-sha>${mission.affectedSha}</code>
          </div>`
        : nothing
    }
  </div>
`;

const missionCollection = (
  projection: DeepReadonly<DossierProjection>,
): TemplateResult | typeof nothing => {
  if (projection.fixture.capability !== "completed") return nothing;
  return html`<sk-card class="sk-repository-dossier-pattern__mission-card">
    <section aria-labelledby="dossier-missions-heading">
      <header class="sk-repository-dossier-pattern__mission-heading">
        ${
          projection.missionCount === undefined
            ? nothing
            : html`<sk-pill-tag data-mission-count
                >${projection.missionCount}</sk-pill-tag
              >`
        }
        <h2
          class="sk-repository-dossier-pattern__section-heading"
          id="dossier-missions-heading"
        >
          Missions
        </h2>
      </header>
      ${
        projection.fixture.missions.length > 0
          ? html`<ul class="sk-repository-dossier-pattern__mission-list">
              ${projection.fixture.missions.map(
                (mission) =>
                  html`<li
                    class="sk-repository-dossier-pattern__mission-item"
                    data-mission-id=${mission.id}
                  >
                    <sk-action-row row-id=${mission.id} presentation="flush">
                      <a
                        class="sk-repository-dossier-pattern__mission-link"
                        slot="title"
                        href=${mission.href}
                        >${mission.title} ${mission.id}</a
                      >
                      <code slot="reference" data-planning-reference
                        >${mission.planningSha} ·
                        ${mission.planningBranch}</code
                      >
                      ${missionTags(mission)} ${missionProgress(mission)}
                      ${missionSupporting(mission)}
                    </sk-action-row>
                  </li>`,
              )}
            </ul>`
          : html`<div class="sk-empty-state" data-completed-empty>
              <h3 class="sk-empty-state__heading">
                Missions absent in this commit
              </h3>
              <p class="sk-empty-state__body">
                No committed Missions were found in the completed repository
                view at
                <code data-empty-sha>${projection.fixture.snapshot?.sha}</code>.
              </p>
            </div>`
      }
    </section>
  </sk-card>`;
};

const setupPanel = (
  projection: DeepReadonly<DossierProjection>,
): TemplateResult | typeof nothing => {
  if (!projection.showSetup) return nothing;
  return html`<sk-card class="sk-repository-dossier-pattern__setup-card">
    <section aria-labelledby="dossier-setup-heading">
      <header class="sk-repository-dossier-pattern__setup-header">
        <div>
          <h2
            class="sk-repository-dossier-pattern__setup-heading"
            id="dossier-setup-heading"
          >
            Set up in this repo
          </h2>
          <p class="sk-repository-dossier-pattern__setup-body">
            Create Missions from your laptop with the Spec Kitty CLI. They
            appear here at the exact commit you push.
          </p>
        </div>
      </header>
      <ul class="sk-repository-dossier-pattern__setup-list">
        ${projection.fixture.setup.map(
          (item) =>
            html`<li class="sk-repository-dossier-pattern__setup-item">
              <div class="sk-repository-dossier-pattern__setup-copy">
                <h3>${item.heading}</h3>
                <p class="sk-repository-dossier-pattern__setup-body">
                  ${item.body}
                </p>
                ${
                  item.link
                    ? html`<a
                        class="sk-repository-dossier-pattern__setup-link"
                        href=${item.link.href}
                        >${item.link.label}</a
                      >`
                    : nothing
                }
              </div>
              <sk-copy-field
                .value=${item.command.value}
                .label=${item.command.label}
              ></sk-copy-field>
            </li>`,
        )}
      </ul>
    </section>
  </sk-card>`;
};

const terminalState = (
  projection: DeepReadonly<DossierProjection>,
): TemplateResult | typeof nothing => {
  if (projection.fixture.capability !== "not-spec-kitty") return nothing;
  return html`<sk-card
    class="sk-repository-dossier-pattern__state-card"
    status="neutral"
  >
    <section
      class="sk-repository-dossier-pattern__state-content"
      aria-labelledby="terminal-state-heading"
      data-terminal-state
    >
      <sk-status-indicator tone="neutral">
        <span slot="marker">●</span>Repository check complete
      </sk-status-indicator>
      <div class="sk-repository-dossier-pattern__state-copy">
        <h2 id="terminal-state-heading">
          Not a Spec Kitty repository on any pushed branch
        </h2>
        <p>${projection.fixture.terminalMessage}</p>
      </div>
    </section>
  </sk-card>`;
};

const announcedNotices = new WeakSet<SkNotice>();

const announceBusyMessageOnce = (notice: SkNotice, message: string): void => {
  if (announcedNotices.has(notice)) return;
  announcedNotices.add(notice);
  void notice.updateComplete.then(() => {
    queueMicrotask(() => {
      if (!notice.isConnected) return;
      notice.message = message;
      notice.setAttribute("data-announcement-state", "assigned");
    });
  });
};

const indexingState = (
  projection: DeepReadonly<DossierProjection>,
): TemplateResult | typeof nothing => {
  if (projection.fixture.capability !== "indexing") return nothing;
  return html`<section
    aria-busy="true"
    aria-labelledby="indexing-state-heading"
    data-indexing-state
  >
    <sk-notice
      ${ref((element) => {
        if (element) {
          announceBusyMessageOnce(
            element as SkNotice,
            projection.fixture.busyMessage ?? "",
          );
        }
      })}
      tone="info"
      announce="polite"
      data-announcement-state="empty"
    >
      <h2 slot="heading" id="indexing-state-heading">
        Building the first repository view
      </h2>
      <sk-status-indicator slot="actions" tone="info" pulsing>
        <span slot="marker">●</span>Rendering from git
      </sk-status-indicator>
    </sk-notice>
  </section>`;
};

const selectedContent = (
  projection: DeepReadonly<DossierProjection>,
): TemplateResult => html`
  ${breadcrumbs(projection)} ${gitContext(projection)}
  ${missionCollection(projection)} ${terminalState(projection)}
  ${indexingState(projection)} ${setupPanel(projection)}
`;

const connectCompactControls = (
  shellRef: Ref<SkAppShell>,
  triggerRef: Ref<HTMLButtonElement>,
): void => {
  const shell = shellRef.value;
  const trigger = triggerRef.value;
  if (shell && trigger) shell.compactTrigger = trigger;
};

/** Renders a Repository Dossier proof entirely through current public surfaces. */
export const renderRepositoryDossier = (
  state: DossierState,
  options: Readonly<{ light?: boolean; open?: boolean }> = {},
): TemplateResult => {
  const projection = projectRepositoryDossier(
    fixtureForRepositoryDossierState(state),
  );
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
    class="sk-repository-dossier-pattern${options.light ? " sk-light" : ""}"
    data-repository-dossier-pattern
    data-dossier-state=${state}
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
      ${personalRail(projection)} ${contextSidebar(projection, "desktop")}
      <div
        class="sk-repository-dossier-pattern__compact-header"
        slot="compact-header"
      >
        <button
          ${ref((element) => {
            triggerRef.value = element as HTMLButtonElement;
            connectCompactControls(shellRef, triggerRef);
          })}
          class="sk-repository-dossier-pattern__drawer-trigger"
          type="button"
          aria-label="Repository navigation"
          aria-controls="repository-dossier-navigation"
          aria-expanded=${String(options.open ?? false)}
          @click=${() => setOpen(!(shellRef.value?.open ?? false))}
        >
          Menu
        </button>
        <span
          class="sk-repository-dossier-pattern__compact-mark"
          aria-hidden="true"
          >SK</span
        >
        <span class="sk-repository-dossier-pattern__compact-identity">
          ${projection.fixture.team}
        </span>
      </div>
      ${contextSidebar(projection, "compact")} ${pageHeader(projection)}
      <div class="sk-repository-dossier-pattern__content">
        ${selectedContent(projection)}
      </div>
    </sk-app-shell>
  </div>`;
};

const dossierViewportOptions = {
  dossier390: {
    name: "Repository Dossier 390px",
    styles: { width: "390px", height: "844px" },
  },
};

const meta: Meta = {
  title: "Patterns/Repository Dossier",
  tags: ["autodocs"],
  parameters: {
    a11y: { disable: false },
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A Storybook-only proof of the Repository Dossier composition. The application supplies immutable repository facts, destinations, status meanings, progress values, and commands; the library supplies presentation and accessible component behavior.",
      },
    },
  },
  excludeStories: [
    "deepFreezeRepositoryDossierFixture",
    "REPOSITORY_DOSSIER_FIXTURES",
    "projectRepositoryDossier",
    "renderRepositoryDossier",
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: "D1 populated desktop dark",
  render: () => renderRepositoryDossier("populated"),
};

export const D2NarrowClosed: Story = {
  globals: { viewport: { value: "dossier390", isRotated: false } },
  parameters: { viewport: { options: dossierViewportOptions } },
  render: () => renderRepositoryDossier("populated"),
};

export const D2NarrowOpen: Story = {
  globals: { viewport: { value: "dossier390", isRotated: false } },
  parameters: { viewport: { options: dossierViewportOptions } },
  render: () => renderRepositoryDossier("populated", { open: true }),
};

export const D4CrossBranch: Story = {
  render: () => renderRepositoryDossier("cross-branch"),
};

export const D5NotSpecKitty: Story = {
  render: () => renderRepositoryDossier("not-spec-kitty"),
};

export const D6SnapshotBehindLog: Story = {
  render: () => renderRepositoryDossier("snapshot-behind"),
};

export const D7Indexing: Story = {
  render: () => renderRepositoryDossier("indexing"),
};

export const D8NoMissions: Story = {
  render: () => renderRepositoryDossier("completed-empty"),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => renderRepositoryDossier("populated", { light: true }),
};

export const LongData: Story = {
  globals: { viewport: { value: "dossier390", isRotated: false } },
  parameters: { viewport: { options: dossierViewportOptions } },
  render: () => renderRepositoryDossier("long-data"),
};

export const ProgressThresholds: Story = {
  render: () => renderRepositoryDossier("thresholds"),
};

export const ForcedColors: Story = {
  render: () => renderRepositoryDossier("cross-branch"),
};

export const ReducedMotion: Story = {
  render: () => renderRepositoryDossier("indexing"),
};

export const Zoom200: Story = {
  render: () => renderRepositoryDossier("long-data"),
};

export const Zoom400: Story = {
  render: () => renderRepositoryDossier("long-data"),
};
