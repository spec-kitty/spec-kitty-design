/**
 * CONNECTORS PATTERN STORIES — mission #338.
 *
 * Composes C1 (setup index), C2 (operating index), C3 (provider authorization handoff), C4
 * (GitHub App setup failure), C5 (GitLab exactly-one group selection), and C9b (Slack public-
 * channel selection) from public `@spec-kitty/elements`/`@spec-kitty/styles` surfaces and native
 * HTML semantics only. **C6, C7, C8, and C9a remain deliberately absent** — held on `.sk-section-
 * nav` (#337), which is not yet on the train (PR #368, gate running). Do not stub it, do not copy
 * it from another checkout, do not fork its API. See `connectors.fixture.ts`'s header and
 * `kitty-specs/connectors-pattern-stories-01M26947/tasks.md` (T009 stays blocked; T008/T010, C5
 * and C9b, are now complete since #336 merged to train as `0a232a01` and #321 landed as PR #339).
 *
 * PUBLIC SURFACES COMPOSED: `sk-page-header`, `sk-card[status]`, `sk-status-indicator`,
 * `sk-notice`, `sk-button` (element form for the off-site "Manage on GitHub" link; native
 * `class="sk-button sk-button--*"` CSS-only form for in-form submit controls, since a `<button>`
 * inside `sk-button`'s shadow root cannot participate in an ancestor light-DOM `<form>` — ADR-9
 * §4's exact finding, reused here rather than rediscovered), `sk-action-row` (its already-public
 * `controls` slot), `.sk-radio-choice-group` (C5 — native `fieldset`/`legend`/`label`/
 * `input[type=radio]` with the family's documented classes only, no CSS or internals read from
 * its package), `.sk-form-select`/`.sk-form-field` (C9b's channel picker — a native `<select>`;
 * #321's contrast/target-size contract governs `.sk-input`, not this component, so it was never
 * actually load-bearing for C9b), plus native `<h1>`/`<form>`/`<a>`/`<dl>` semantics and the
 * documented `.sk-empty-state` CSS family. No shadow-root reach, no duplicated component CSS, no
 * undeclared `::part()` — enforced by `scripts/check-pattern-composition.mjs` (#259).
 *
 * MUTATION-FREE FORMS (FR-018): every `<form>` below is evidence only — this module never submits
 * one. `apps/storybook/src/tests/sk-connectors-pattern.spec.ts` proves that submitting one in a
 * real browser is intercepted (`preventDefault()`) and calls no application route.
 */
import type { Meta, StoryObj } from '@storybook/web-components';
import { html, nothing, type TemplateResult } from 'lit';
import '../card/sk-card.js';
import '../notice/sk-notice.js';
import '../page-header/sk-page-header.js';
import '../status-indicator/sk-status-indicator.js';
import '../button/sk-button.js';
import '../action-row/sk-action-row.js';
import '../confirm-dialog/sk-confirm-dialog.js';
import type { SkConfirmDialog } from '../confirm-dialog/sk-confirm-dialog.js';

import {
  CONNECTORS_FIXTURE,
  healthTone,
  INSTALLATION_TAB_LABEL,
  installationTabHref,
  selectGithubAppFailureProjection,
  selectGitlabGroupProjection,
  selectHandoffProjection,
  selectInstallationShellProjection,
  selectOperatingProjection,
  selectProjectRoutingProjection,
  selectSetupProjection,
  selectSlackChannelPickerProjection,
  selectTeamAccountsProjection,
  selectWorkspaceScopeProjection,
  withInstallationHealth,
  type ConnectorRole,
  type GithubAppFailureProjection,
  type GitlabGroupProjection,
  type GitlabGroupSelectionState,
  type HandoffFlow,
  type HandoffProjection,
  type InstallationHealth,
  type InstallationRole,
  type InstallationShellProjection,
  type InstallationTab,
  type OperatingProjection,
  type ProjectRoutingProjection,
  type ProjectRoutingState,
  type SetupProjection,
  type SlackChannelPickerProjection,
  type SlackChannelPickerState,
  type TeamAccountsProjection,
  type TeamAccountsState,
  type WorkspaceScopeProjection,
  type WorkspaceScopeState,
} from './connectors.fixture.js';

// No re-export of fixture internals from this module (measured 2026-09-11): Storybook's CSF
// story-index scan treats every named export of a `.stories.ts` file as a candidate story,
// including a bare re-exported value or function. `node scripts/run-axe-storybook.js`'s full run
// proved this against the real built index — 13 "did not render (render root is empty)" entries,
// one per re-exported non-story identifier, each also counted as a render timeout, failing the
// gate with zero actual WCAG violations. External consumers of these fixture helpers import them
// directly from `./connectors.fixture.js`, which already exports every one of them; nothing needs
// them re-exported here too.

// -------------------------------------------------------------------------------------------
// Pattern-owned, token-only layout CSS. Scoped entirely under `.sk-connectors-pattern` — a
// fixture-scoped selector, which `check-pattern-composition.mjs` R3 explicitly permits (it
// places the host in the page rather than reaching into any public component's private root).
// No selector here names a class a `packages/styles` sheet owns.
// -------------------------------------------------------------------------------------------
const patternStyles = html`<style>
  .sk-connectors-pattern {
    box-sizing: border-box;
    display: grid;
    gap: var(--sk-space-6);
    max-inline-size: 960px;
    margin-inline: auto;
    padding: var(--sk-space-6);
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }

  .sk-connectors-pattern__gap-list {
    display: grid;
    gap: var(--sk-space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .sk-connectors-pattern__provider-grid {
    display: grid;
    gap: var(--sk-space-4);
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .sk-connectors-pattern__provider-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sk-space-3);
  }

  .sk-connectors-pattern__section {
    display: grid;
    gap: var(--sk-space-3);
  }

  .sk-connectors-pattern__back-link {
    display: inline-block;
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
    text-decoration: underline;
  }

  .sk-connectors-pattern__evidence-form {
    display: grid;
    gap: var(--sk-space-2);
  }
</style>`;

// =============================================================================================
// C1 — setup index
// =============================================================================================

function renderSetup(projection: SetupProjection): TemplateResult {
  return html`${patternStyles}
    <section class="sk-connectors-pattern" data-connectors-pattern="c1" data-render-complete="true" aria-labelledby="c1-heading">
      <sk-page-header>
        <span slot="eyebrow">${projection.team.name}</span>
        <h1 id="c1-heading" slot="title">Connectors</h1>
        <span slot="supporting"
          >This team has no active connections yet. Finish the setup steps below before
          connecting a provider.</span
        >
      </sk-page-header>
      ${projection.noGapsToReport
        ? html`<div class="sk-empty-state">
            <h3 class="sk-empty-state__heading">No setup gaps</h3>
            <p class="sk-empty-state__body">This team is ready to connect a provider.</p>
          </div>`
        : html`<ul class="sk-connectors-pattern__gap-list" aria-label="Server configuration gaps">
            ${projection.gaps.map(
              (gap) => html`<li>
                <sk-notice tone="attention" announce="off">${gap.text}</sk-notice>
              </li>`,
            )}
          </ul>`}
    </section>`;
}

// =============================================================================================
// C2 — operating index
// =============================================================================================

function renderOperating(projection: OperatingProjection): TemplateResult {
  return html`${patternStyles}
    <section class="sk-connectors-pattern" data-connectors-pattern="c2" data-render-complete="true" aria-labelledby="c2-heading">
      <sk-page-header>
        <span slot="eyebrow">${projection.team.name}</span>
        <h1 id="c2-heading" slot="title">Connectors</h1>
        <span slot="supporting"
          >Signed in as ${projection.role === 'admin' ? 'an administrator' : 'a member'}.</span
        >
      </sk-page-header>

      ${projection.relayNotice
        ? html`<sk-notice tone=${projection.relayNotice.tone} announce="off">
            <span slot="heading">${projection.relayNotice.heading}</span>
            ${projection.relayNotice.message}
          </sk-notice>`
        : nothing}
      ${projection.slackNotice
        ? html`<sk-notice tone=${projection.slackNotice.tone} announce="off"
            >${projection.slackNotice.message}</sk-notice
          >`
        : nothing}

      <div class="sk-connectors-pattern__provider-grid">
        ${projection.providerCards.map(
          (card) => html`<sk-card status=${card.tone}>
            <div class="sk-connectors-pattern__provider-header">
              <h2>${card.label}</h2>
              <sk-status-indicator tone=${card.tone}>${card.healthText}</sk-status-indicator>
            </div>
            <dl class="sk-facts">
              ${card.facts.map(
                (fact) => html`<dt class="sk-facts__term">${fact.term}</dt>
                  <dd class="sk-facts__value">${fact.value}</dd>`,
              )}
            </dl>
            ${card.manageAction && !card.manageAction.disabledForRole
              ? html`<sk-button variant="secondary" size="sm" href=${card.manageAction.href}
                  >${card.manageAction.label}</sk-button
                >`
              : nothing}
          </sk-card>`,
        )}
      </div>

      ${projection.linkedAccountRow
        ? html`<div class="sk-connectors-pattern__section">
            <h2>Linked account</h2>
            <sk-action-row>
              <span slot="title">${projection.linkedAccountRow.label}</span>
              <span slot="reference">${projection.linkedAccountRow.reference}</span>
              ${projection.linkedAccountRow.canDisconnect
                ? html`<form
                    slot="controls"
                    class="sk-connectors-pattern__evidence-form"
                    method="post"
                    action="/a/${projection.team.slug}/connectors/install/${projection.linkedAccountRow
                      .id}/disconnect/"
                    data-mutation-free="true"
                    @submit=${(event: Event) => event.preventDefault()}
                  >
                    <button type="submit" class="sk-button sk-button--secondary sk-button--sm">Disconnect</button>
                  </form>`
                : nothing}
            </sk-action-row>
          </div>`
        : nothing}
    </section>`;
}

// =============================================================================================
// C3 — provider authorization handoff
// =============================================================================================

function renderHandoff(projection: HandoffProjection): TemplateResult {
  return html`${patternStyles}
    <section class="sk-connectors-pattern" data-connectors-pattern="c3" data-render-complete="true" aria-labelledby="c3-heading">
      <sk-page-header>
        <span slot="eyebrow">${projection.team.name}</span>
        <h1 id="c3-heading" slot="title">${projection.heading}</h1>
      </sk-page-header>

      ${projection.phase === 'failed'
        ? html`<sk-notice tone="danger" announce="assertive">${projection.failure}</sk-notice>`
        : html`<sk-notice tone="info" announce="polite"
            >${projection.phase === 'waiting'
              ? 'Waiting for authorization from the provider…'
              : 'Completing the connection…'}</sk-notice
          >`}

      <form
        class="sk-connectors-pattern__evidence-form"
        method=${projection.entry.method}
        action=${projection.entry.path}
        data-mutation-free="true"
        @submit=${(event: Event) => event.preventDefault()}
      >
        <button type="submit" class="sk-button sk-button--primary" ?disabled=${projection.phase !== 'waiting'}>
          Continue with ${projection.provider}
        </button>
      </form>
      <a class="sk-connectors-pattern__back-link" href=${projection.back}>Back to connectors</a>
    </section>`;
}

// =============================================================================================
// C4 — GitHub App setup failure
// =============================================================================================

function renderGithubAppFailure(projection: GithubAppFailureProjection): TemplateResult {
  return html`${patternStyles}
    <section class="sk-connectors-pattern" data-connectors-pattern="c4" data-render-complete="true" aria-labelledby="c4-heading">
      <sk-page-header>
        <span slot="eyebrow">${projection.team ? projection.team.name : 'GitHub App'}</span>
        <h1 id="c4-heading" slot="title">${projection.heading}</h1>
        <span slot="supporting">${projection.subtitle}</span>
      </sk-page-header>
      <sk-notice tone="danger" announce="assertive">${projection.error}</sk-notice>
      ${projection.backHref
        ? html`<a class="sk-connectors-pattern__back-link" href=${projection.backHref}
            >Back to connectors</a
          >`
        : nothing}
    </section>`;
}

// =============================================================================================
// C5 — GitLab exactly-one group selection (unblocked 2026-09-11, #336 merged as `0a232a01`)
// =============================================================================================

let gitlabGroupSelectSeq = 0;

/** Public `.sk-radio-choice-group` markup (`packages/styles/src/radio-choice-group/`), composed
 * from its documented class contract only — `fieldset.sk-radio-choice-group` >
 * `legend.sk-radio-choice-group__legend` + `div.sk-radio-choice-group__options` >
 * `label.sk-radio-choice-group__choice` > `input[type=radio].sk-radio-choice-group__control` +
 * `span.sk-radio-choice-group__label` (+ optional `span.sk-radio-choice-group__secondary-value`).
 * No selector here writes CSS for that family — every rule is pattern-scoped, and every use of an
 * owned class is in markup, which `check-pattern-composition.mjs` R3 treats as composition. */
function renderGitlabGroupChoices(projection: GitlabGroupProjection): TemplateResult {
  const groupName = `gitlab-group-${(gitlabGroupSelectSeq += 1)}`;
  return html`<fieldset class="sk-radio-choice-group">
    <legend class="sk-radio-choice-group__legend">Connect a GitLab group</legend>
    <div class="sk-radio-choice-group__options">
      ${projection.groups.map(
        (group) => html`<label class="sk-radio-choice-group__choice" for="${groupName}-${group.id}"
          ><input
            id="${groupName}-${group.id}"
            class="sk-radio-choice-group__control"
            type="radio"
            name=${groupName}
            value=${group.id}
          /><span class="sk-radio-choice-group__label">${group.display}</span
          ><span class="sk-radio-choice-group__secondary-value">${group.name}</span></label
        >`,
      )}
    </div>
  </fieldset>`;
}

function renderGitlabGroup(projection: GitlabGroupProjection): TemplateResult {
  return html`${patternStyles}
    <section class="sk-connectors-pattern" data-connectors-pattern="c5" data-render-complete="true" aria-labelledby="c5-heading">
      <sk-page-header>
        <span slot="eyebrow">${projection.team.name}</span>
        <h1 id="c5-heading" slot="title">GitLab group selection</h1>
        <span slot="supporting">Only GitLab connects another group this way — no other provider exposes this choice.</span>
      </sk-page-header>

      ${projection.state === 'connected-refresh-failed'
        ? html`<div class="sk-connectors-pattern__section">
            <sk-notice tone="success" announce="off"
              >Connected group: ${projection.connectedGroup?.display} (${projection.connectedGroup?.name})</sk-notice
            >
            <sk-notice tone="danger" announce="assertive">${projection.failureMessage}</sk-notice>
            <form
              class="sk-connectors-pattern__evidence-form"
              method=${projection.refreshMethod}
              action=${projection.refreshPath}
              data-mutation-free="true"
              @submit=${(event: Event) => event.preventDefault()}
            >
              <button type="submit" class="sk-button sk-button--secondary sk-button--sm">Refresh repositories</button>
            </form>
          </div>`
        : projection.state === 'no-groups'
          ? html`<div class="sk-empty-state">
              <h3 class="sk-empty-state__heading">No GitLab groups available</h3>
              <p class="sk-empty-state__body">No groups were returned for this GitLab account.</p>
            </div>`
          : html`<form
              class="sk-connectors-pattern__evidence-form"
              method=${projection.selectionMethod}
              action=${projection.selectionPath}
              data-mutation-free="true"
              @submit=${(event: Event) => event.preventDefault()}
            >
              ${projection.state === 'validation' && projection.failureMessage
                ? html`<sk-notice tone="danger" announce="assertive">${projection.failureMessage}</sk-notice>`
                : nothing}
              ${renderGitlabGroupChoices(projection)}
              <button type="submit" class="sk-button sk-button--primary sk-button--sm">Connect group</button>
            </form>`}
    </section>`;
}

// =============================================================================================
// C9b — Slack public-channel selection (unblocked 2026-09-11, #321 landed as PR #339)
// =============================================================================================

function renderSlackChannelPicker(projection: SlackChannelPickerProjection): TemplateResult {
  const fieldId = 'slack-channel-select';
  return html`${patternStyles}
    <section class="sk-connectors-pattern" data-connectors-pattern="c9b" data-render-complete="true" aria-labelledby="c9b-heading">
      <sk-page-header>
        <span slot="eyebrow">${projection.team.name}</span>
        <h1 id="c9b-heading" slot="title">Choose a Slack channel</h1>
        <span slot="supporting">Team Kitty will post team moments here. Outbound only — no message preview or readback.</span>
      </sk-page-header>

      ${projection.errorMessage
        ? html`<sk-notice
            tone=${projection.state === 'rate-limited' || projection.state === 'incomplete' ? 'attention' : 'danger'}
            announce="assertive"
            >${projection.errorMessage}</sk-notice
          >`
        : nothing}

      ${projection.channels.length === 0 && !projection.errorMessage
        ? html`<div class="sk-empty-state">
            <h3 class="sk-empty-state__heading">No public channels found</h3>
            <p class="sk-empty-state__body">No public channels were returned for ${projection.workspaceName}.</p>
          </div>`
        : projection.channels.length > 0
          ? html`<form
              class="sk-connectors-pattern__evidence-form"
              method="post"
              action=${projection.choosePath}
              data-mutation-free="true"
              @submit=${(event: Event) => event.preventDefault()}
            >
              <div class="sk-form-field">
                <label class="sk-form-field__label" for=${fieldId}>Public channel</label>
                <select class="sk-form-select" id=${fieldId} name="channel">
                  <option value="" ?selected=${!projection.options.some((option) => option.selected)}>
                    — choose a channel —
                  </option>
                  ${projection.options.map(
                    (option) =>
                      html`<option value=${option.value} ?selected=${option.selected}>${option.label}</option>`,
                  )}
                </select>
                <span class="sk-form-field__description"
                  >Public channels of ${projection.workspaceName}. If the chosen channel shows no posts, invite the
                  app to it once — Slack only lets the app write where it is a member.</span
                >
              </div>
              <button type="submit" class="sk-button sk-button--primary sk-button--sm">Save channel</button>
            </form>`
          : nothing}
      <a class="sk-connectors-pattern__back-link" href=${projection.laterPath}>Later</a>
    </section>`;
}

// =============================================================================================
// Installation Detail shell — shared by C6/C7/C8/C9a (unblocked 2026-09-11, #337 merged to
// train as `16948194`). Composes the now-public `.sk-section-nav` from its documented markup
// contract only — `nav.sk-section-nav[aria-label]` > `a.sk-section-nav__link[href]`, with
// consumer-supplied `aria-current="page"` on the active route. No CSS or internals read from
// that package.
// =============================================================================================

function renderInstallationSectionNav(shell: InstallationShellProjection): TemplateResult {
  return html`<nav class="sk-section-nav" aria-label="Installation navigation">
    ${shell.visibleTabs.map(
      (tab) => html`<a
        class="sk-section-nav__link"
        href=${installationTabHref(shell.installation, tab)}
        aria-current=${tab === shell.activeTab ? 'page' : nothing}
        >${
          // eslint-disable-next-line security/detect-object-injection -- key is the literal union type InstallationTab
          INSTALLATION_TAB_LABEL[tab]
        }</a
      >`,
    )}
  </nav>`;
}

/** Stacked `.sk-facts` only — orchestrator ruling 2026-09-11 (research.md's "Dependency
 * reconciliation"): #280's grouped-reflow facts-grid extension is deferred as a follow-up, not a
 * gate; `--two-col` is deliberately never used here — it declares no `min-width:0`/`overflow-wrap`
 * on its value track and carries a real, untested overflow risk that stacked `.sk-facts` does not. */
function renderInstallationFacts(installation: InstallationRecordLike): TemplateResult {
  return html`<dl class="sk-facts">
    <dt class="sk-facts__term">Provider</dt>
    <dd class="sk-facts__value">${installation.provider}</dd>
    <dt class="sk-facts__term">Connected account</dt>
    <dd class="sk-facts__value">${installation.externalAccountLabel}</dd>
    <dt class="sk-facts__term">Health</dt>
    <dd class="sk-facts__value">
      <sk-status-indicator tone=${healthTone(installation.health)}>${installation.health}</sk-status-indicator>
    </dd>
    <dt class="sk-facts__term">Project routing</dt>
    <dd class="sk-facts__value">${installation.activeMappingCount} active mappings</dd>
    <dt class="sk-facts__term">Linked accounts</dt>
    <dd class="sk-facts__value">${installation.activeLinkCount} teammates linked</dd>
    <dt class="sk-facts__term">Installed</dt>
    <dd class="sk-facts__value">${installation.installedAt} by ${installation.installedBy}</dd>
  </dl>`;
}

type InstallationRecordLike = Readonly<{
  provider: string;
  externalAccountLabel: string;
  health: InstallationHealth;
  activeMappingCount: number;
  activeLinkCount: number;
  installedAt: string;
  installedBy: string;
}>;

// =============================================================================================
// C6 — installation detail shell
// =============================================================================================

function renderInstallationShell(shell: InstallationShellProjection): TemplateResult {
  const dangerHealth = shell.installation.health === 'needs_reauth' || shell.installation.health === 'revoked';
  return html`${patternStyles}
    <section
      class="sk-connectors-pattern"
      data-connectors-pattern="c6"
      data-render-complete="true"
      aria-labelledby="c6-heading"
    >
      <sk-page-header>
        <span slot="eyebrow">${shell.installation.teamName}</span>
        <h1 id="c6-heading" slot="title">${shell.installation.provider} installation</h1>
        <span slot="supporting">Signed in as ${shell.role === 'admin' ? 'an administrator' : 'a member'}.</span>
      </sk-page-header>
      ${renderInstallationSectionNav(shell)}
      ${renderInstallationFacts(shell.installation)}
      ${dangerHealth
        ? html`<sk-notice tone="danger" announce="polite"
            >This installation's authorization needs attention. No automatic recovery route is offered
            here.</sk-notice
          >`
        : nothing}
      ${shell.canDisconnect
        ? html`<form
            class="sk-connectors-pattern__evidence-form"
            method="post"
            action=${shell.disconnectPath}
            data-mutation-free="true"
            @submit=${(event: Event) => event.preventDefault()}
          >
            <button type="submit" class="sk-button sk-button--secondary sk-button--sm">Disconnect tracker</button>
          </form>`
        : nothing}
    </section>`;
}

// =============================================================================================
// C7 — workspace scope tab
// =============================================================================================

function renderWorkspaceScope(scope: WorkspaceScopeProjection, shell: InstallationShellProjection): TemplateResult {
  return html`${patternStyles}
    <section
      class="sk-connectors-pattern"
      data-connectors-pattern="c7"
      data-render-complete="true"
      aria-labelledby="c7-heading"
    >
      <sk-page-header>
        <span slot="eyebrow">${shell.installation.teamName}</span>
        <h1 id="c7-heading" slot="title">Workspace scope</h1>
      </sk-page-header>
      ${renderInstallationSectionNav(shell)}
      ${renderInstallationFacts(shell.installation)}
      ${scope.refreshFailureMessage
        ? html`<sk-notice tone="danger" announce="assertive">${scope.refreshFailureMessage}</sk-notice>`
        : nothing}
      ${scope.state === 'unavailable'
        ? html`<div class="sk-empty-state">
            <h3 class="sk-empty-state__heading">Workspace scope unavailable</h3>
            <p class="sk-empty-state__body">Auto-discovered scope could not be read for this installation.</p>
          </div>`
        : html`
            <dl class="sk-facts">
              <dt class="sk-facts__term">Discovered</dt>
              <dd class="sk-facts__value">${scope.discovered}</dd>
              <dt class="sk-facts__term">Included</dt>
              <dd class="sk-facts__value">${scope.included}</dd>
            </dl>
            ${scope.containers.length === 0
              ? html`<div class="sk-empty-state">
                  <h3 class="sk-empty-state__heading">No scope containers discovered</h3>
                  <p class="sk-empty-state__body">Nothing has been auto-discovered for this installation yet.</p>
                </div>`
              : html`<div class="sk-data-table__scroller">
                  <table class="sk-data-table">
                    <caption>
                      Auto-discovered tracker scope containers
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Container</th>
                        <th scope="col">Workspace</th>
                        <th scope="col">Type</th>
                        <th scope="col">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${scope.containers.map(
                        (c) => html`<tr>
                          <td>${c.container}</td>
                          <td>${c.workspace}</td>
                          <td>${c.type}</td>
                          <td>${c.state}</td>
                        </tr>`,
                      )}
                    </tbody>
                  </table>
                </div>`}
          `}
    </section>`;
}

// =============================================================================================
// C8 — project routing / admitted repositories
// =============================================================================================

function renderProjectRouting(routing: ProjectRoutingProjection, shell: InstallationShellProjection): TemplateResult {
  return html`${patternStyles}
    <section
      class="sk-connectors-pattern"
      data-connectors-pattern="c8"
      data-render-complete="true"
      aria-labelledby="c8-heading"
    >
      <sk-page-header>
        <span slot="eyebrow">${shell.installation.teamName}</span>
        <h1 id="c8-heading" slot="title">Project routing</h1>
      </sk-page-header>
      ${renderInstallationSectionNav(shell)}
      ${renderInstallationFacts(shell.installation)}

      ${/* FR-014: /discovery/ is a compatibility redirect, never a browse link — rendered as
          inert text, no href ever points at it. */ nothing}
      <p class="sk-connectors-pattern__section">
        <code>${routing.discoveryRedirect.path}</code> — ${routing.discoveryRedirect.note}
      </p>

      ${routing.validationError
        ? html`<sk-notice tone="danger" announce="assertive">${routing.validationError}</sk-notice>`
        : nothing}
      ${routing.jiraManualRescuePath
        ? html`<div class="sk-empty-state">
            <h3 class="sk-empty-state__heading">No Jira mappings discovered</h3>
            <p class="sk-empty-state__body">
              Auto-discovery found nothing for this Jira installation. Rescue path:
              <code>${routing.jiraManualRescuePath}</code>
            </p>
          </div>`
        : nothing}

      ${routing.mappings.length > 0
        ? html`<div class="sk-data-table__scroller">
            <table class="sk-data-table">
              <caption>
                Resource mappings
              </caption>
              <thead>
                <tr>
                  <th scope="col">Resource</th>
                  <th scope="col">Target repo</th>
                  <th scope="col">Source</th>
                  <th scope="col">State</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                ${routing.mappings.map(
                  (m) => html`<tr>
                    <td>${m.resourceLabel}</td>
                    <td>${m.targetRepo}</td>
                    <td>${m.source}</td>
                    <td>${m.isEnabled ? 'Active' : 'Disabled'}</td>
                    <td>
                      ${shell.role === 'admin'
                        ? html`<form
                            class="sk-connectors-pattern__evidence-form"
                            method="post"
                            action="/a/${shell.installation.teamSlug}/connectors/install/${shell.installation
                              .uuid}/mappings/${m.id}/toggle/"
                            data-mutation-free="true"
                            @submit=${(event: Event) => event.preventDefault()}
                          >
                            <button type="submit" class="sk-button sk-button--ghost sk-button--sm">
                              ${m.isEnabled ? 'Disable' : 'Enable'}
                            </button>
                          </form>`
                        : nothing}
                    </td>
                  </tr>`,
                )}
              </tbody>
            </table>
          </div>`
        : nothing}

      ${routing.repositories.length > 0
        ? html`<div class="sk-data-table__scroller">
            <table class="sk-data-table">
              <caption>
                Admitted repositories
              </caption>
              <thead>
                <tr>
                  <th scope="col">Repository</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                ${routing.repositories.map(
                  (r) => html`<tr>
                    <td>${r.repoFullName}</td>
                    <td>
                      ${r.isActive
                        ? 'Active'
                        : html`Purged — removed ${r.removedDisplay}. Not re-admitted automatically.`}
                    </td>
                  </tr>`,
                )}
              </tbody>
            </table>
          </div>`
        : nothing}

      ${routing.purgeTargetRepo && routing.purgeConfirmCopy
        ? html`<sk-confirm-dialog
            class="sk-connectors-pattern__purge-dialog"
            dialog-title="Hard-purge repository?"
            message=${routing.purgeConfirmCopy}
            confirm-label="Hard-purge repository"
            cancel-label="Cancel"
            confirm-variant="danger-secondary"
          ></sk-confirm-dialog>`
        : nothing}
    </section>`;
}

// =============================================================================================
// C9a — team account links
// =============================================================================================

function renderTeamAccounts(accounts: TeamAccountsProjection, shell: InstallationShellProjection): TemplateResult {
  return html`${patternStyles}
    <section
      class="sk-connectors-pattern"
      data-connectors-pattern="c9a"
      data-render-complete="true"
      aria-labelledby="c9a-heading"
    >
      <sk-page-header>
        <span slot="eyebrow">${shell.installation.teamName}</span>
        <h1 id="c9a-heading" slot="title">Team accounts</h1>
      </sk-page-header>
      ${renderInstallationSectionNav(shell)}
      ${renderInstallationFacts(shell.installation)}

      ${accounts.links.length === 0
        ? html`<div class="sk-empty-state">
            <h3 class="sk-empty-state__heading">No linked accounts</h3>
            <p class="sk-empty-state__body">${accounts.emptyCopy}</p>
          </div>`
        : html`<ul class="sk-connectors-pattern__gap-list" aria-label="Linked accounts">
            ${accounts.links.map((link) => {
              const dangerHealth = link.authorizationHealth === 'needs_reauth' || link.authorizationHealth === 'revoked';
              const tone = dangerHealth ? 'danger' : link.authorizationHealth === 'expired' ? 'attention' : 'success';
              return html`<li>
                <sk-action-row>
                  <span slot="title">${link.displayName}${link.isViewer ? ' (you)' : ''}</span>
                  <span slot="reference">${link.providerSubject}</span>
                  <span slot="metadata"
                    ><sk-status-indicator tone=${tone}>${link.authorizationHealth}</sk-status-indicator></span
                  >
                  ${link.isViewer
                    ? html`<form
                        slot="controls"
                        class="sk-connectors-pattern__evidence-form"
                        method="post"
                        action=${accounts.disconnectOwnPath}
                        data-mutation-free="true"
                        @submit=${(event: Event) => event.preventDefault()}
                      >
                        <button type="submit" class="sk-button sk-button--danger-secondary sk-button--sm">
                          Disconnect
                        </button>
                      </form>`
                    : nothing}
                </sk-action-row>
              </li>`;
            })}
          </ul>`}
      ${accounts.ownLinkStartAvailable
        ? html`<form
            class="sk-connectors-pattern__evidence-form"
            method="post"
            action="/a/${shell.installation.teamSlug}/connectors/link/${shell.installation.uuid}/"
            data-mutation-free="true"
            @submit=${(event: Event) => event.preventDefault()}
          >
            <button type="submit" class="sk-button sk-button--primary sk-button--sm">Link your account</button>
          </form>`
        : nothing}
    </section>`;
}

// =============================================================================================
// Storybook registration
// =============================================================================================

const meta: Meta = {
  title: 'Patterns/Connectors',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'Composition proof for Team Kitty Family 3 "Connectors" (#338), C1-C4 only — C5-C9b ' +
          'are blocked on named public contracts and deliberately absent this pass (see ' +
          'kitty-specs/connectors-pattern-stories-01M26947/research.md). Pattern-owned: fixture, ' +
          'projections, layout. Not published: no new custom element, no `sk-connectors`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function withThemeWrapper(content: TemplateResult, light: boolean): TemplateResult {
  return html`<div class=${light ? 'sk-light' : nothing}>${content}</div>`;
}

// --- C1 ---------------------------------------------------------------------------------------

export const C1SetupAdminEmpty: Story = {
  render: () => withThemeWrapper(renderSetup(selectSetupProjection(CONNECTORS_FIXTURE.setup)), false),
};

// --- C2 ---------------------------------------------------------------------------------------

function operatingStory(role: ConnectorRole): Story {
  return {
    render: () => withThemeWrapper(renderOperating(selectOperatingProjection(CONNECTORS_FIXTURE.operating, role)), false),
  };
}

export const C2OperatingAdmin: Story = operatingStory('admin');
export const C2OperatingMember: Story = operatingStory('member');

// --- C3 ---------------------------------------------------------------------------------------

function handoffStory(flow: HandoffFlow): Story {
  return {
    render: () => withThemeWrapper(renderHandoff(selectHandoffProjection(CONNECTORS_FIXTURE.handoff, flow)), false),
  };
}

export const C3HandoffInstallationWaiting: Story = handoffStory('installation');
export const C3HandoffReconnectCompleting: Story = handoffStory('reconnect');
export const C3HandoffUserLinkFailed: Story = handoffStory('user-link');

// --- C4 ---------------------------------------------------------------------------------------

function githubAppFailureStory(id: 'resolved-team' | 'no-team-boundary'): Story {
  return {
    render: () =>
      withThemeWrapper(
        renderGithubAppFailure(selectGithubAppFailureProjection(CONNECTORS_FIXTURE.githubAppFailure, id)),
        false,
      ),
  };
}

export const C4GithubAppFailureResolvedTeam: Story = githubAppFailureStory('resolved-team');
export const C4GithubAppFailureNoTeamBoundary: Story = githubAppFailureStory('no-team-boundary');

// --- C5 ---------------------------------------------------------------------------------------

function gitlabGroupStory(state: GitlabGroupSelectionState): Story {
  return {
    render: () => withThemeWrapper(renderGitlabGroup(selectGitlabGroupProjection(CONNECTORS_FIXTURE.gitlabGroup, state)), false),
  };
}

export const C5GitlabGroupPopulated: Story = gitlabGroupStory('populated');
export const C5GitlabGroupNoGroups: Story = gitlabGroupStory('no-groups');
export const C5GitlabGroupValidation: Story = gitlabGroupStory('validation');
export const C5GitlabGroupConnectedRefreshFailed: Story = gitlabGroupStory('connected-refresh-failed');

// --- C9b --------------------------------------------------------------------------------------

function slackChannelPickerStory(state: SlackChannelPickerState): Story {
  return {
    render: () =>
      withThemeWrapper(
        renderSlackChannelPicker(selectSlackChannelPickerProjection(CONNECTORS_FIXTURE.slackChannelPicker, state)),
        false,
      ),
  };
}

export const C9bSlackChannelPopulated: Story = slackChannelPickerStory('populated');
export const C9bSlackChannelEmpty: Story = slackChannelPickerStory('empty');
export const C9bSlackChannelRefused: Story = slackChannelPickerStory('refused');
export const C9bSlackChannelRateLimited: Story = slackChannelPickerStory('rate-limited');
export const C9bSlackChannelIncomplete: Story = slackChannelPickerStory('incomplete');

// --- C6 ---------------------------------------------------------------------------------------

function installationShellStory(role: InstallationRole, health: InstallationHealth): Story {
  return {
    render: () =>
      withThemeWrapper(
        renderInstallationShell(
          selectInstallationShellProjection(
            withInstallationHealth(CONNECTORS_FIXTURE.workspaceScope.installation, health),
            role,
            'workspace',
          ),
        ),
        false,
      ),
  };
}

export const C6InstallationAdminActive: Story = installationShellStory('admin', 'active');
export const C6InstallationMemberActive: Story = installationShellStory('member', 'active');
export const C6InstallationHealthDegraded: Story = installationShellStory('admin', 'degraded');
export const C6InstallationHealthRevoked: Story = installationShellStory('admin', 'revoked');
export const C6InstallationHealthNeedsReauth: Story = installationShellStory('admin', 'needs_reauth');

// --- C7 ---------------------------------------------------------------------------------------

function workspaceScopeStory(state: WorkspaceScopeState, role: InstallationRole = 'admin'): Story {
  return {
    render: () => {
      const shell = selectInstallationShellProjection(CONNECTORS_FIXTURE.workspaceScope.installation, role, 'workspace');
      const scope = selectWorkspaceScopeProjection(CONNECTORS_FIXTURE.workspaceScope, role, state);
      return withThemeWrapper(renderWorkspaceScope(scope, shell), false);
    },
  };
}

export const C7WorkspaceScopePopulated: Story = workspaceScopeStory('populated');
export const C7WorkspaceScopeEmpty: Story = workspaceScopeStory('empty');
export const C7WorkspaceScopeUnavailable: Story = workspaceScopeStory('unavailable');
export const C7WorkspaceScopeStaleAfterRefreshFailure: Story = workspaceScopeStory('stale-after-refresh-failure');
export const C7WorkspaceScopeMemberBoundary: Story = {
  render: () => {
    // The Workspace Scope tab is admin-only: a member's shell never lists it among visibleTabs.
    // This story renders the SHELL as a member would see it, to prove the tab's absence rather
    // than assuming it — see the FR-007 test that asserts zero "Workspace scope" links here.
    const shell = selectInstallationShellProjection(CONNECTORS_FIXTURE.workspaceScope.installation, 'member', 'mappings');
    return withThemeWrapper(renderInstallationShell(shell), false);
  },
};

// --- C8 ---------------------------------------------------------------------------------------

function projectRoutingStory(state: ProjectRoutingState, role: InstallationRole = 'admin'): Story {
  return {
    render: () => {
      const shell = selectInstallationShellProjection(CONNECTORS_FIXTURE.workspaceScope.installation, role, 'mappings');
      const routing = selectProjectRoutingProjection(CONNECTORS_FIXTURE.projectRouting, role, state);
      return withThemeWrapper(renderProjectRouting(routing, shell), false);
    },
  };
}

export const C8ProjectRoutingPopulated: Story = projectRoutingStory('populated');
export const C8ProjectRoutingEmpty: Story = projectRoutingStory('empty');
export const C8ProjectRoutingValidation: Story = projectRoutingStory('validation');
export const C8ProjectRoutingJiraRescue: Story = projectRoutingStory('jira-rescue');
export const C8ProjectRoutingPurgeConfirm: Story = {
  ...projectRoutingStory('purge-confirm'),
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('sk-confirm-dialog') as SkConfirmDialog | null;
    await (dialog as unknown as { updateComplete: Promise<unknown> } | null)?.updateComplete;
    dialog?.showModal();
  },
};

// --- C9a --------------------------------------------------------------------------------------

function teamAccountsStory(state: TeamAccountsState, role: InstallationRole): Story {
  return {
    render: () => {
      const shell = selectInstallationShellProjection(CONNECTORS_FIXTURE.workspaceScope.installation, role, 'links');
      const accounts = selectTeamAccountsProjection(CONNECTORS_FIXTURE.teamAccounts, role, state);
      return withThemeWrapper(renderTeamAccounts(accounts, shell), false);
    },
  };
}

export const C9aTeamAccountsAdminActive: Story = teamAccountsStory('admin-active', 'admin');
export const C9aTeamAccountsAdminUnhealthy: Story = teamAccountsStory('admin-unhealthy', 'admin');
export const C9aTeamAccountsMemberUnlinked: Story = teamAccountsStory('member-unlinked', 'member');
export const C9aTeamAccountsMemberEmpty: Story = teamAccountsStory('member-empty', 'member');

// --- Required LightMode system proof (programme brief hard rule 5) ----------------------------

export const LightMode: Story = {
  render: () => withThemeWrapper(renderOperating(selectOperatingProjection(CONNECTORS_FIXTURE.operating, 'admin')), true),
};
