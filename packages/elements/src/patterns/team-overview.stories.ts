import type { Meta, StoryObj } from "@storybook/web-components";
import { createRef, ref, type Ref } from "lit/directives/ref.js";
import { html, nothing, render as renderLit, type TemplateResult } from "lit";
import "../app-shell/sk-app-shell.js";
import "../context-sidebar/sk-context-sidebar.js";
import "../copy-field/sk-copy-field.js";
import "../page-header/sk-page-header.js";
import "../personal-rail/sk-personal-rail.js";
import type { SkAppShell } from "../app-shell/sk-app-shell.js";
import {
  FIRST_RUN_SHELL,
  TEAM_OVERVIEW_FIRST_RUN_RESPONSES,
  TEAM_OVERVIEW_LONG_CONTENT_RESPONSE,
  TEAM_OVERVIEW_POPULATED_RESPONSE,
  firstRunFixture,
  projectFirstRunResponse,
  projectPopulatedOverview,
  safeTeamOverviewHref,
  type DeepReadonly,
  type FirstRunFixtureId,
  type FirstRunProjection,
  type PopulatedOverviewProjection,
  type PopulatedOverviewResponse,
  type SetupStepState,
  type SuppliedRoute,
} from "./team-overview.fixture.js";
import { renderTeamOverviewRoute } from "./team-overview.route.fixture.js";

const patternStyles = html`<style>
  .sk-team-overview-pattern {
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 100%;
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }

  .sk-team-overview-pattern *,
  .sk-team-overview-pattern *::before,
  .sk-team-overview-pattern *::after {
    box-sizing: border-box;
  }

  .sk-team-overview-pattern [hidden] {
    display: none;
  }

  .sk-team-overview-pattern__rail-link,
  .sk-team-overview-pattern__navigation-link,
  .sk-team-overview-pattern__repository-link,
  .sk-team-overview-pattern__setup-link {
    color: var(--sk-fg-default);
    overflow-wrap: anywhere;
  }

  .sk-team-overview-pattern__rail-link {
    display: grid;
    place-items: center;
    min-block-size: var(--sk-space-9);
    min-inline-size: var(--sk-space-9);
    padding: var(--sk-space-2);
    border-radius: var(--sk-radius-sm);
    text-decoration: none;
  }

  .sk-team-overview-pattern__rail-identity {
    display: grid;
    place-items: center;
    min-block-size: var(--sk-space-9);
    color: var(--sk-fg-default);
    font-weight: var(--sk-weight-semibold);
  }

  .sk-team-overview-pattern__rail-link:hover,
  .sk-team-overview-pattern__navigation-link:hover,
  .sk-team-overview-pattern__repository-link:hover,
  .sk-team-overview-pattern__setup-link:hover {
    text-decoration: underline;
  }

  .sk-team-overview-pattern__rail-link:focus-visible,
  .sk-team-overview-pattern__navigation-link:focus-visible,
  .sk-team-overview-pattern__repository-link:focus-visible,
  .sk-team-overview-pattern__setup-link:focus-visible,
  .sk-team-overview-pattern__drawer-trigger:focus-visible,
  .sk-team-overview-pattern__fixture-select:focus-visible {
    outline: var(--sk-border-width-2) solid var(--sk-border-focus);
    outline-offset: var(--sk-border-width-1);
  }

  .sk-team-overview-pattern__sidebar-heading,
  .sk-team-overview-pattern__compact-header,
  .sk-team-overview-pattern__content,
  .sk-team-overview-pattern__section,
  .sk-team-overview-pattern__overview-pair,
  .sk-team-overview-pattern__row-copy,
  .sk-team-overview-pattern__welcome,
  .sk-team-overview-pattern__welcome-copy,
  .sk-team-overview-pattern__step-content,
  .sk-team-overview-pattern__copy-stack {
    min-inline-size: 0;
  }

  .sk-team-overview-pattern__sidebar-heading {
    display: grid;
    gap: var(--sk-space-2);
  }

  .sk-team-overview-pattern__sidebar-heading strong,
  .sk-team-overview-pattern__compact-identity,
  .sk-team-overview-pattern__row-copy,
  .sk-team-overview-pattern__welcome-copy,
  .sk-team-overview-pattern__step-content,
  .sk-team-overview-pattern code {
    overflow-wrap: anywhere;
  }

  .sk-team-overview-pattern__compact-header {
    display: flex;
    align-items: center;
    gap: var(--sk-space-3);
  }

  .sk-team-overview-pattern__drawer-trigger,
  .sk-team-overview-pattern__fixture-select {
    min-block-size: var(--sk-space-9);
    padding-block: var(--sk-space-2);
    padding-inline: var(--sk-space-3);
    color: var(--sk-fg-default);
    background: var(--sk-surface-card);
    border: var(--sk-border-width-1) solid var(--sk-border-default);
    border-radius: var(--sk-radius-sm);
    font: inherit;
  }

  .sk-team-overview-pattern__drawer-trigger {
    font-weight: var(--sk-weight-semibold);
    cursor: pointer;
  }

  .sk-team-overview-pattern__compact-identity {
    font-weight: var(--sk-weight-semibold);
  }

  .sk-team-overview-pattern__compact-navigation {
    inline-size: var(--sk-layout-context-sidebar-width);
    max-inline-size: 100%;
  }

  .sk-team-overview-pattern__navigation-list,
  .sk-team-overview-pattern__activity-list,
  .sk-team-overview-pattern__mission-list,
  .sk-team-overview-pattern__repository-list,
  .sk-team-overview-pattern__setup-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .sk-team-overview-pattern__navigation-list,
  .sk-team-overview-pattern__activity-list,
  .sk-team-overview-pattern__mission-list,
  .sk-team-overview-pattern__repository-list,
  .sk-team-overview-pattern__setup-list,
  .sk-team-overview-pattern__copy-stack {
    display: grid;
  }

  .sk-team-overview-pattern__navigation-list {
    gap: var(--sk-space-1);
  }

  .sk-team-overview-pattern__navigation-link {
    display: block;
    min-block-size: var(--sk-space-9);
    padding: var(--sk-space-3);
    border-radius: var(--sk-radius-sm);
    text-decoration: none;
  }

  .sk-team-overview-pattern__navigation-link[aria-current="page"] {
    color: var(--sk-fg-default);
    background: var(--sk-surface-muted);
    font-weight: var(--sk-weight-semibold);
  }

  .sk-team-overview-pattern__navigation-note,
  .sk-team-overview-pattern__description,
  .sk-team-overview-pattern__observed,
  .sk-team-overview-pattern__row-meta,
  .sk-team-overview-pattern__review-note,
  .sk-team-overview-pattern__step-introduction,
  .sk-team-overview-pattern__step-note,
  .sk-team-overview-pattern__guidance {
    margin: 0;
    color: var(--sk-fg-muted);
  }

  .sk-team-overview-pattern__navigation-note,
  .sk-team-overview-pattern__observed,
  .sk-team-overview-pattern__row-meta,
  .sk-team-overview-pattern__review-note {
    font-size: var(--sk-text-sm);
  }

  .sk-team-overview-pattern__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sk-space-7);
    padding: var(--sk-space-7);
  }

  .sk-team-overview-pattern__compact-header:not([inert])
    ~ .sk-team-overview-pattern__content {
    padding-inline: var(--sk-space-4);
  }

  .sk-team-overview-pattern__section {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sk-space-4);
  }

  .sk-team-overview-pattern__section-heading {
    display: grid;
    gap: var(--sk-space-2);
  }

  .sk-team-overview-pattern__section-heading h2,
  .sk-team-overview-pattern__welcome h2,
  .sk-team-overview-pattern__step-title {
    margin: 0;
    color: var(--sk-fg-default);
  }

  .sk-team-overview-pattern__section-heading h2,
  .sk-team-overview-pattern__welcome h2 {
    font-size: var(--sk-text-xl);
  }

  .sk-team-overview-pattern__eyebrow,
  .sk-team-overview-pattern__welcome-meta,
  .sk-team-overview-pattern__review-label {
    margin: 0;
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-xs);
    font-weight: var(--sk-weight-semibold);
    text-transform: uppercase;
  }

  .sk-team-overview-pattern__velocity-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sk-space-2);
  }

  .sk-team-overview-pattern__velocity-summary strong {
    color: var(--sk-fg-default);
    font-size: var(--sk-text-lg);
  }

  .sk-team-overview-pattern__velocity-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--sk-space-12), 1fr));
    gap: var(--sk-space-2);
  }

  .sk-team-overview-pattern__velocity-cell {
    display: grid;
    align-content: end;
    min-block-size: var(--sk-space-10);
    padding: var(--sk-space-3);
    color: var(--sk-fg-muted);
    background: var(--sk-surface-muted);
    border: var(--sk-border-width-1) solid var(--sk-border-default);
    border-radius: var(--sk-radius-sm);
    font-size: var(--sk-text-sm);
  }

  .sk-team-overview-pattern__velocity-cell[data-populated="true"] {
    color: var(--sk-fg-default);
    background: var(--sk-surface-tint-lilac);
    border-color: var(--sk-border-tint-lilac);
    font-weight: var(--sk-weight-semibold);
  }

  .sk-team-overview-pattern__overview-pair {
    display: grid;
    grid-template-columns: repeat(
      auto-fit,
      minmax(min(100%, calc(var(--sk-space-12) * 3)), 1fr)
    );
    gap: var(--sk-space-6);
  }

  .sk-team-overview-pattern__mission-list,
  .sk-team-overview-pattern__repository-list,
  .sk-team-overview-pattern__activity-list {
    border-block-start: var(--sk-border-width-1) solid var(--sk-border-default);
  }

  .sk-team-overview-pattern__row,
  .sk-team-overview-pattern__repository-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sk-space-3);
    padding-block: var(--sk-space-4);
    border-block-end: var(--sk-border-width-1) solid var(--sk-border-default);
  }

  .sk-team-overview-pattern__row-title,
  .sk-team-overview-pattern__repository-link {
    color: var(--sk-fg-default);
    font-weight: var(--sk-weight-semibold);
  }

  .sk-team-overview-pattern__repository-link {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--sk-space-9);
  }

  .sk-team-overview-pattern__row-facts,
  .sk-team-overview-pattern__repository-facts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-2) var(--sk-space-4);
    margin: 0;
  }

  .sk-team-overview-pattern__row-facts div,
  .sk-team-overview-pattern__repository-facts div {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-1);
    min-inline-size: 0;
  }

  .sk-team-overview-pattern__row-facts dt,
  .sk-team-overview-pattern__repository-facts dt {
    color: var(--sk-fg-muted);
  }

  .sk-team-overview-pattern__row-facts dd,
  .sk-team-overview-pattern__repository-facts dd {
    margin: 0;
    color: var(--sk-fg-default);
    overflow-wrap: anywhere;
  }

  .sk-team-overview-pattern__review-scaffold {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--sk-space-4);
    padding: var(--sk-space-4);
    background: var(--sk-surface-muted);
    border: var(--sk-border-width-1) dashed var(--sk-border-strong);
    border-radius: var(--sk-radius-md);
  }

  .sk-team-overview-pattern__review-copy,
  .sk-team-overview-pattern__fixture-control {
    display: grid;
    gap: var(--sk-space-2);
  }

  .sk-team-overview-pattern__fixture-control {
    flex: 1 1 calc(var(--sk-space-12) * 2);
    max-inline-size: calc(var(--sk-space-12) * 4);
    color: var(--sk-fg-default);
    font-size: var(--sk-text-sm);
    font-weight: var(--sk-weight-semibold);
  }

  .sk-team-overview-pattern__welcome {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--sk-space-4);
    padding-block: var(--sk-space-4);
  }

  .sk-team-overview-pattern__welcome-marker,
  .sk-team-overview-pattern__step-marker {
    display: grid;
    place-items: center;
    inline-size: var(--sk-space-9);
    block-size: var(--sk-space-9);
    color: var(--sk-fg-default);
    background: var(--sk-surface-tint-butter);
    border: var(--sk-border-width-1) solid var(--sk-color-yellow);
    border-radius: var(--sk-radius-pill);
    font-weight: var(--sk-weight-semibold);
  }

  .sk-team-overview-pattern__welcome-marker svg,
  .sk-team-overview-pattern__step-marker svg {
    inline-size: var(--sk-space-4);
    block-size: var(--sk-space-4);
  }

  .sk-team-overview-pattern__welcome-copy {
    display: grid;
    gap: var(--sk-space-3);
  }

  .sk-team-overview-pattern__welcome-body {
    margin: 0;
    max-inline-size: calc(var(--sk-space-12) * 6);
  }

  .sk-team-overview-pattern__welcome-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-3);
  }

  .sk-team-overview-pattern__welcome-actions a,
  .sk-team-overview-pattern__setup-link {
    min-block-size: var(--sk-space-9);
    padding-block: var(--sk-space-3);
    padding-inline: var(--sk-space-4);
    border: var(--sk-border-width-1) solid var(--sk-border-strong);
    border-radius: var(--sk-radius-sm);
  }

  .sk-team-overview-pattern__setup-list {
    counter-reset: none;
  }

  .sk-team-overview-pattern__step {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--sk-space-4);
    padding-block: var(--sk-space-5);
    border-block-start: var(--sk-border-width-1) solid var(--sk-border-default);
  }

  .sk-team-overview-pattern__step[data-state="completed"]
    .sk-team-overview-pattern__step-marker {
    color: var(--sk-color-green);
    background: var(--sk-color-green-bg);
    border-color: var(--sk-color-green);
  }

  .sk-team-overview-pattern__step-content,
  .sk-team-overview-pattern__copy-stack {
    gap: var(--sk-space-3);
  }

  .sk-team-overview-pattern__step-content {
    display: grid;
    align-content: start;
  }

  .sk-team-overview-pattern__copy-stack sk-copy-field {
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  .sk-team-overview-pattern__copy-stack sk-copy-field::part(copy-control) {
    min-inline-size: var(--sk-space-9);
    min-block-size: var(--sk-space-9);
  }

  .sk-team-overview-pattern__setup-link {
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
  }

  @media (forced-colors: active) {
    .sk-team-overview-pattern__drawer-trigger,
    .sk-team-overview-pattern__fixture-select,
    .sk-team-overview-pattern__velocity-cell,
    .sk-team-overview-pattern__review-scaffold,
    .sk-team-overview-pattern__welcome-marker,
    .sk-team-overview-pattern__step-marker {
      border-color: CanvasText;
    }

    .sk-team-overview-pattern__velocity-cell[data-populated="true"] {
      forced-color-adjust: none;
      color: HighlightText;
      background: Highlight;
      border-color: CanvasText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sk-team-overview-pattern *,
    .sk-team-overview-pattern *::before,
    .sk-team-overview-pattern *::after {
      scroll-behavior: auto !important;
      transition: none !important;
    }
  }
</style>`;

type ShellCopy = DeepReadonly<
  PopulatedOverviewResponse["copy"] | typeof FIRST_RUN_SHELL.copy
>;

interface ShellModel {
  readonly panelId: string;
  readonly copy: ShellCopy;
  readonly routes: DeepReadonly<{
    overview: SuppliedRoute;
    work: SuppliedRoute;
    connectors: SuppliedRoute;
    members: SuppliedRoute;
  }>;
  readonly repositoryRoute?: DeepReadonly<SuppliedRoute>;
  readonly missionRoute?: DeepReadonly<SuppliedRoute>;
  readonly showMembers: boolean;
  readonly emptyRepositoryNavigation?: string;
}

const personalRailRoute = (
  route: DeepReadonly<SuppliedRoute> | undefined,
  mark: string,
  current = false,
): TemplateResult | typeof nothing => {
  if (!route) return nothing;
  const href = safeTeamOverviewHref(route);
  return href
    ? html`<a
        class="sk-team-overview-pattern__rail-link"
        slot="primary"
        href=${href}
        aria-current=${current ? "page" : nothing}
        aria-label=${route.label}
        >${mark}</a
      >`
    : html`<span
        class="sk-team-overview-pattern__rail-identity"
        slot="primary"
        data-passive-route=${route.kind}
        >${route.label}</span
      >`;
};

const personalRail = (model: ShellModel): TemplateResult =>
  html`<sk-personal-rail
    slot="personal-rail"
    label=${model.copy.personalNavigationLabel}
  >
    ${personalRailRoute(model.routes.overview, model.copy.overviewMark, true)}
    ${personalRailRoute(model.routes.work, model.copy.workMark)}
    <span
      class="sk-team-overview-pattern__rail-identity"
      slot="account"
      aria-label=${model.copy.accountLabel}
      >${model.copy.teamInitials}</span
    >
  </sk-personal-rail>`;

const contextNavigation = (model: ShellModel): TemplateResult =>
  html`<nav aria-label=${model.copy.contextNavigationLabel}>
    <ul class="sk-team-overview-pattern__navigation-list">
      <li>
        ${renderTeamOverviewRoute(
          model.routes.overview,
          "sk-team-overview-pattern__navigation-link",
          true,
        )}
      </li>
      <li>
        ${renderTeamOverviewRoute(
          model.routes.work,
          "sk-team-overview-pattern__navigation-link",
        )}
      </li>
      <li>
        ${renderTeamOverviewRoute(
          model.routes.connectors,
          "sk-team-overview-pattern__navigation-link",
        )}
      </li>
      ${
        model.repositoryRoute
          ? html`<li>
              ${renderTeamOverviewRoute(
                model.repositoryRoute,
                "sk-team-overview-pattern__navigation-link",
              )}
            </li>`
          : nothing
      }
      ${
        model.missionRoute
          ? html`<li>
              ${renderTeamOverviewRoute(
                model.missionRoute,
                "sk-team-overview-pattern__navigation-link",
              )}
            </li>`
          : nothing
      }
      ${
        model.showMembers
          ? html`<li>
              ${renderTeamOverviewRoute(
                model.routes.members,
                "sk-team-overview-pattern__navigation-link",
              )}
            </li>`
          : nothing
      }
    </ul>
    ${
      model.emptyRepositoryNavigation
        ? html`<p class="sk-team-overview-pattern__navigation-note">
            ${model.emptyRepositoryNavigation}
          </p>`
        : nothing
    }
  </nav>`;

const contextSidebar = (
  model: ShellModel,
  placement: "desktop" | "compact",
): TemplateResult =>
  html`<sk-context-sidebar
    class=${
      placement === "compact"
        ? "sk-team-overview-pattern__compact-navigation"
        : nothing
    }
    slot=${placement === "desktop" ? "context-sidebar" : "compact-navigation"}
    id=${placement === "compact" ? `team-overview-navigation-${model.panelId}` : nothing}
    label=${
      placement === "desktop"
        ? model.copy.contextNavigationLabel
        : model.copy.compactNavigationLabel
    }
  >
    <div class="sk-team-overview-pattern__sidebar-heading" slot="header">
      <strong>${model.copy.teamName}</strong>
    </div>
    ${contextNavigation(model)}
  </sk-context-sidebar>`;

const connectCompactControls = (
  shellRef: Ref<SkAppShell>,
  triggerRef: Ref<HTMLButtonElement>,
): void => {
  const shell = shellRef.value;
  const trigger = triggerRef.value;
  if (shell && trigger) shell.compactTrigger = trigger;
};

const pageHeader = (model: ShellModel): TemplateResult =>
  html`<sk-page-header slot="page-header">
    <span slot="eyebrow">${model.copy.overviewEyebrow}</span>
    <h1 slot="title">${model.copy.teamName}</h1>
    <p slot="supporting">${model.copy.pageSupporting}</p>
  </sk-page-header>`;

const shell = (
  model: ShellModel,
  content: TemplateResult,
  options: Readonly<{
    light?: boolean;
    direction?: "ltr" | "rtl";
    open?: boolean;
  }> = {},
): TemplateResult => {
  const compactNavigationId = `team-overview-navigation-${model.panelId}`;
  const shellRef = createRef<SkAppShell>();
  const triggerRef = createRef<HTMLButtonElement>();
  const setOpen = (next: boolean): void => {
    const shellElement = shellRef.value;
    const trigger = triggerRef.value;
    if (!shellElement || !trigger) return;
    shellElement.open = next;
    trigger.setAttribute("aria-expanded", String(next));
    if (next) {
      void shellElement.updateComplete.then(() => {
        shellElement
          .querySelector<HTMLAnchorElement>(
            '[slot="compact-navigation"] a[href]',
          )
          ?.focus();
      });
    }
  };

  return html`<div
    class="sk-team-overview-pattern${options.light ? " sk-light" : ""}"
    dir=${options.direction ?? "ltr"}
    data-team-overview-pattern
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
      ${personalRail(model)} ${contextSidebar(model, "desktop")}
      <div
        class="sk-team-overview-pattern__compact-header"
        slot="compact-header"
      >
        <button
          ${ref((element) => {
            triggerRef.value = element as HTMLButtonElement;
            connectCompactControls(shellRef, triggerRef);
          })}
          class="sk-team-overview-pattern__drawer-trigger"
          type="button"
          aria-label=${model.copy.openNavigationLabel}
          aria-controls=${compactNavigationId}
          aria-expanded=${String(options.open ?? false)}
          @click=${() => setOpen(!(shellRef.value?.open ?? false))}
        >
          ${model.copy.menuLabel}
        </button>
        <span class="sk-team-overview-pattern__compact-identity"
          >${model.copy.teamName}</span
        >
      </div>
      ${contextSidebar(model, "compact")} ${pageHeader(model)}
      <div class="sk-team-overview-pattern__content">${content}</div>
    </sk-app-shell>
  </div>`;
};

const sectionHeading = (
  id: string,
  eyebrow: string,
  title: string,
  description: string,
  observed?: string,
): TemplateResult =>
  html`<div class="sk-team-overview-pattern__section-heading">
    <p class="sk-team-overview-pattern__eyebrow">${eyebrow}</p>
    <h2 id=${id}>${title}</h2>
    <p class="sk-team-overview-pattern__description">${description}</p>
    ${
      observed
        ? html`<p class="sk-team-overview-pattern__observed">${observed}</p>`
        : nothing
    }
  </div>`;

const populatedContent = (
  projection: DeepReadonly<PopulatedOverviewProjection>,
  fixture: DeepReadonly<PopulatedOverviewResponse>,
): TemplateResult => {
  const copy = fixture.copy;
  return html`<section
      class="sk-team-overview-pattern__section"
      aria-labelledby="team-velocity-heading"
      data-truth-region="observed"
      data-visual-region="velocity"
    >
      ${sectionHeading(
        "team-velocity-heading",
        copy.velocityEyebrow,
        copy.velocityTitle,
        projection.retention.description,
        copy.observedBoundary,
      )}
      <div
        class="sk-team-overview-pattern__velocity-summary"
        data-event-total=${String(projection.eventTotal)}
      >
        <strong>${projection.retention.summary}</strong>
      </div>
      <div
        class="sk-team-overview-pattern__velocity-strip"
        role="img"
        aria-label=${projection.retention.summary}
        data-retention-hours=${String(projection.retention.retentionHours)}
      >
        ${projection.retention.cells.map(
          (cell) =>
            html`<span
              class="sk-team-overview-pattern__velocity-cell"
              data-populated=${String(cell.count > 0)}
              data-cell-count=${String(cell.count)}
              aria-label=${cell.label}
              >${cell.label}</span
            >`,
        )}
      </div>
    </section>

    <div class="sk-team-overview-pattern__overview-pair">
      <section
        class="sk-team-overview-pattern__section"
        aria-labelledby="team-in-flight-heading"
        data-truth-region="observed"
      >
        ${sectionHeading(
          "team-in-flight-heading",
          copy.inFlightEyebrow,
          copy.inFlightTitle,
          copy.inFlightDescription,
          copy.observedBoundary,
        )}
        <ul class="sk-team-overview-pattern__mission-list">
          ${projection.inFlight.map(
            (moment) =>
              html`<li class="sk-team-overview-pattern__row" data-in-flight-row>
                <strong class="sk-team-overview-pattern__row-title"
                  >${moment.missionRef}</strong
                >
                <dl class="sk-team-overview-pattern__row-facts">
                  <div>
                    <dt>${copy.repositoryLabel}</dt>
                    <dd>${moment.repository}</dd>
                  </div>
                  <div>
                    <dt>${copy.kindLabel}</dt>
                    <dd><code>${moment.kind}</code></dd>
                  </div>
                  <div>
                    <dt>${copy.stageLabel}</dt>
                    <dd>${moment.stage}</dd>
                  </div>
                  <div>
                    <dt>${copy.observedAtLabel}</dt>
                    <dd>${moment.age}</dd>
                  </div>
                </dl>
              </li>`,
          )}
        </ul>
      </section>

      <section
        class="sk-team-overview-pattern__section"
        aria-labelledby="team-repositories-heading"
        data-truth-region="factual"
        data-visual-region="repositories"
      >
        ${sectionHeading(
          "team-repositories-heading",
          copy.admittedEyebrow,
          copy.admittedTitle,
          copy.admittedDescription,
        )}
        <ul class="sk-team-overview-pattern__repository-list">
          ${projection.repositories.map(
            (repository) =>
              html`<li class="sk-team-overview-pattern__repository-row">
                ${renderTeamOverviewRoute(
                  repository.route,
                  "sk-team-overview-pattern__repository-link",
                )}
                <p class="sk-team-overview-pattern__row-meta">
                  ${repository.missionSummary}
                </p>
                <dl
                  class="sk-team-overview-pattern__repository-facts"
                  aria-label=${copy.repositoryFactsLabel}
                >
                  <div>
                    <dt>${copy.shaLabel}</dt>
                    <dd><code>${repository.sha}</code></dd>
                  </div>
                  <div>
                    <dt>${copy.branchLabel}</dt>
                    <dd><code>${repository.branch}</code></dd>
                  </div>
                  <div>
                    <dt>${copy.pushedLabel}</dt>
                    <dd>${repository.pushed}</dd>
                  </div>
                </dl>
              </li>`,
          )}
        </ul>
      </section>
    </div>

    <section
      class="sk-team-overview-pattern__section"
      aria-labelledby="team-recent-heading"
      data-truth-region="observed"
      data-visual-region="recent-activity"
    >
      ${sectionHeading(
        "team-recent-heading",
        copy.recentEyebrow,
        copy.recentTitle,
        copy.recentDescription,
        copy.observedBoundary,
      )}
      <ul
        class="sk-team-overview-pattern__activity-list"
        aria-label=${copy.recentListLabel}
        data-passive-activity
      >
        ${projection.recent.map(
          (moment) =>
            html`<li class="sk-team-overview-pattern__row" data-activity-row>
              <strong class="sk-team-overview-pattern__row-title"
                >${moment.missionRef}</strong
              >
              <dl class="sk-team-overview-pattern__row-facts">
                <div>
                  <dt>${copy.repositoryLabel}</dt>
                  <dd>${moment.repository}</dd>
                </div>
                <div>
                  <dt>${copy.kindLabel}</dt>
                  <dd><code>${moment.kind}</code></dd>
                </div>
                <div>
                  <dt>${copy.stageLabel}</dt>
                  <dd>${moment.stage}</dd>
                </div>
                <div>
                  <dt>${copy.freshnessLabel}</dt>
                  <dd>${moment.freshness}</dd>
                </div>
                <div>
                  <dt>${copy.observedAtLabel}</dt>
                  <dd>
                    <time datetime=${moment.occurredAt}>${moment.age}</time>
                  </dd>
                </div>
              </dl>
            </li>`,
        )}
      </ul>
    </section>`;
};

const populatedShellModel = (
  fixture: DeepReadonly<PopulatedOverviewResponse>,
  panelId: string,
): ShellModel => ({
  panelId,
  copy: fixture.copy,
  routes: fixture.routes,
  repositoryRoute: fixture.repositories[0]?.route,
  missionRoute: fixture.moments[0]?.missionRoute,
  showMembers: true,
});

/** Renders current TO1 populated evidence from one immutable response fixture. */
export const renderPopulatedOverview = (
  retention: "default" | "alternate" = "default",
  options: Readonly<{
    light?: boolean;
    direction?: "ltr" | "rtl";
    long?: boolean;
    open?: boolean;
  }> = {},
): TemplateResult => {
  const fixture = options.long
    ? TEAM_OVERVIEW_LONG_CONTENT_RESPONSE
    : TEAM_OVERVIEW_POPULATED_RESPONSE;
  return shell(
    populatedShellModel(
      fixture,
      `to1-${options.long ? "long" : "current"}-${retention}`,
    ),
    populatedContent(projectPopulatedOverview(fixture, retention), fixture),
    options,
  );
};

const completedMark = (): TemplateResult =>
  html`<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m5 12 4 4L19 6"></path>
  </svg>`;

const welcomeMark = (): TemplateResult =>
  html`<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d="M12 3v18M3 12h18"></path>
  </svg>`;

const setupStep = (
  step: DeepReadonly<FirstRunProjection["visibleSteps"][number]>,
): TemplateResult =>
  html`<li
    class="sk-team-overview-pattern__step"
    data-state=${step.state}
    data-setup-step=${step.id}
  >
    <span class="sk-team-overview-pattern__step-marker" aria-hidden="true">
      ${step.state === "completed" ? completedMark() : step.numberLabel}
    </span>
    <div class="sk-team-overview-pattern__step-content">
      <h3 class="sk-team-overview-pattern__step-title">
        ${step.title}<span class="sk-visually-hidden"
          >${step.state === "completed" ? step.completedLabel : step.currentLabel}</span
        >
      </h3>
      ${
        step.state === ("current" satisfies SetupStepState)
          ? html`${
              step.introduction
                ? html`<p class="sk-team-overview-pattern__step-introduction">
                    ${step.introduction}
                  </p>`
                : nothing
            }
            ${
              step.commands.length
                ? html`<div class="sk-team-overview-pattern__copy-stack">
                    ${step.commands.map(
                      (command) =>
                        html`<sk-copy-field
                          data-copy-command=${command.id}
                          .value=${command.value}
                          .label=${command.label}
                          .successMessage=${command.successMessage}
                          .manualMessage=${command.manualMessage}
                          .failureMessage=${command.failureMessage}
                        ></sk-copy-field>`,
                    )}
                  </div>`
                : nothing
            }
            ${
              step.note
                ? html`<p class="sk-team-overview-pattern__step-note">
                    ${step.note}
                  </p>`
                : nothing
            }
            ${
              step.memberGuidance
                ? html`<p class="sk-team-overview-pattern__guidance">
                    ${step.memberGuidance}
                  </p>`
                : nothing
            }
            ${
              step.route
                ? renderTeamOverviewRoute(
                    step.route,
                    "sk-team-overview-pattern__setup-link",
                  )
                : nothing
            }`
          : nothing
      }
    </div>
  </li>`;

type FirstRunRenderOptions = Readonly<{
  light?: boolean;
  direction?: "ltr" | "rtl";
  open?: boolean;
}>;

const litOwnedFirstRunOutlets = new WeakSet<HTMLElement>();

const onFirstRunFixtureChange = (
  event: Event,
  options: FirstRunRenderOptions,
): void => {
  const select = event.currentTarget;
  if (!(select instanceof HTMLSelectElement)) return;
  const root = select.closest<HTMLElement>("[data-first-run-review-root]");
  const outlet = root?.querySelector<HTMLElement>("[data-first-run-outlet]");
  const selectedId = select.value as FirstRunFixtureId;
  if (
    !root ||
    !outlet ||
    !(selectedId in TEAM_OVERVIEW_FIRST_RUN_RESPONSES)
  ) {
    return;
  }
  if (!litOwnedFirstRunOutlets.has(outlet)) {
    outlet.replaceChildren();
    litOwnedFirstRunOutlets.add(outlet);
  }
  renderLit(firstRunFixtureTree(selectedId, options), outlet);
  queueMicrotask(() => {
    const nextSelect = root.querySelector<HTMLSelectElement>(
      "[data-first-run-selector]",
    );
    nextSelect?.focus({ preventScroll: true });
  });
};

const reviewScaffold = (
  selected: FirstRunFixtureId,
  options: FirstRunRenderOptions,
): TemplateResult => {
  const copy = FIRST_RUN_SHELL.copy;
  return html`<aside
    class="sk-team-overview-pattern__review-scaffold"
    data-review-scaffolding
    data-visual-region="review-scaffolding"
  >
    <div class="sk-team-overview-pattern__review-copy">
      <p class="sk-team-overview-pattern__review-label">
        ${copy.reviewHeading}
      </p>
      <p class="sk-team-overview-pattern__review-note">${copy.reviewNote}</p>
    </div>
    <label class="sk-team-overview-pattern__fixture-control">
      <span>${copy.selectorLabel}</span>
      <select
        class="sk-team-overview-pattern__fixture-select"
        data-first-run-selector
        @change=${(event: Event) => onFirstRunFixtureChange(event, options)}
      >
        ${Object.values(TEAM_OVERVIEW_FIRST_RUN_RESPONSES).map(
          (fixture) =>
            html`<option
              value=${fixture.id}
              ?selected=${fixture.id === selected}
            >
              ${fixture.selectorLabel}
            </option>`,
        )}
      </select>
    </label>
  </aside>`;
};

const firstRunContent = (
  selected: FirstRunFixtureId,
  projection: DeepReadonly<FirstRunProjection>,
  options: FirstRunRenderOptions,
): TemplateResult =>
  html`${reviewScaffold(selected, options)}
    <section
      class="sk-team-overview-pattern__section"
      aria-labelledby=${`first-run-heading-${projection.id}`}
      data-server-response=${projection.id}
      data-visual-region="first-run-setup"
    >
      <header class="sk-team-overview-pattern__welcome">
        <span class="sk-team-overview-pattern__welcome-marker"
          >${welcomeMark()}</span
        >
        <div class="sk-team-overview-pattern__welcome-copy">
          <p class="sk-team-overview-pattern__welcome-meta">
            ${projection.meta}
          </p>
          <h2 id=${`first-run-heading-${projection.id}`}>
            ${projection.heading}
          </h2>
          <p class="sk-team-overview-pattern__welcome-body">
            ${projection.body}
          </p>
          ${
            projection.guidance
              ? html`<p class="sk-team-overview-pattern__guidance">
                  ${projection.guidance}
                </p>`
              : nothing
          }
          ${
            projection.welcomeRoutes.length
              ? html`<nav class="sk-team-overview-pattern__welcome-actions">
                  ${projection.welcomeRoutes.map((route) =>
                    renderTeamOverviewRoute(
                      route,
                      "sk-team-overview-pattern__setup-link",
                    ),
                  )}
                </nav>`
              : nothing
          }
        </div>
      </header>
      <ol
        class="sk-team-overview-pattern__setup-list"
        aria-label=${FIRST_RUN_SHELL.copy.stepsLabel}
      >
        ${projection.visibleSteps.map(setupStep)}
      </ol>
    </section>`;

const firstRunShellModel = (
  projection: DeepReadonly<FirstRunProjection>,
): ShellModel => ({
  panelId: `to2-${projection.id}`,
  copy: FIRST_RUN_SHELL.copy,
  routes: FIRST_RUN_SHELL.routes,
  showMembers: projection.canManage && projection.privacy === "collaborative",
  emptyRepositoryNavigation: FIRST_RUN_SHELL.copy.emptyRepositoryNavigation,
});

const firstRunFixtureTree = (
  selected: FirstRunFixtureId,
  options: FirstRunRenderOptions,
): TemplateResult => {
  const projection = projectFirstRunResponse(firstRunFixture(selected));
  return html`<div data-first-run-fixture=${selected}>
    ${shell(
      firstRunShellModel(projection),
      firstRunContent(selected, projection, options),
      options,
    )}
  </div>`;
};

/** Renders one selected immutable TO2 response behind review-only fixture selection. */
export const renderFirstRunOverview = (
  selected: FirstRunFixtureId = "admin-install",
  options: FirstRunRenderOptions = {},
): TemplateResult =>
  html`<div data-first-run-review-root>
    <div data-first-run-outlet>${firstRunFixtureTree(selected, options)}</div>
  </div>`;

const meta: Meta = {
  title: "Patterns/Team Overview",
  tags: ["autodocs"],
  parameters: {
    a11y: { disable: false },
    layout: "fullscreen",
  },
  excludeStories: [
    "renderPopulatedOverview",
    "renderFirstRunOverview",
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: "TO1 · current populated",
  render: () => renderPopulatedOverview(),
};

export const AlternateRetention: Story = {
  name: "TO1 · alternate retention",
  render: () => renderPopulatedOverview("alternate"),
};

export const FirstRun: Story = {
  name: "TO2 · six first-run responses",
  render: () => renderFirstRunOverview(),
};

export const LightMode: Story = {
  name: "TO1 · current populated · light",
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => renderPopulatedOverview("default", { light: true }),
};

export const LongContent: Story = {
  name: "TO1 · long localized content",
  render: () => renderPopulatedOverview("default", { long: true }),
};

export const CopyOutcomes: Story = {
  name: "TO2 · public copy-field outcomes",
  render: () => renderFirstRunOverview("admin-install"),
};
