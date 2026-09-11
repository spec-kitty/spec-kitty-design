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

import {
  CONNECTORS_FIXTURE,
  selectGithubAppFailureProjection,
  selectGitlabGroupProjection,
  selectHandoffProjection,
  selectOperatingProjection,
  selectSetupProjection,
  selectSlackChannelPickerProjection,
  type ConnectorRole,
  type GithubAppFailureProjection,
  type GitlabGroupProjection,
  type GitlabGroupSelectionState,
  type HandoffFlow,
  type HandoffProjection,
  type OperatingProjection,
  type SetupProjection,
  type SlackChannelPickerProjection,
  type SlackChannelPickerState,
} from './connectors.fixture.js';

export {
  CONNECTORS_FIXTURE,
  deepFreeze,
  healthTone,
  selectGithubAppFailureProjection,
  selectGitlabGroupProjection,
  selectHandoffProjection,
  selectOperatingProjection,
  selectSetupProjection,
  selectSlackChannelPickerProjection,
} from './connectors.fixture.js';

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

  .sk-connectors-pattern__facts {
    margin: var(--sk-space-3) 0 0;
    padding: 0;
  }

  .sk-connectors-pattern__facts dt {
    margin: 0;
    margin-block-start: var(--sk-space-2);
    font-size: var(--sk-text-sm);
    color: var(--sk-fg-muted);
  }

  .sk-connectors-pattern__facts dt:first-of-type {
    margin-block-start: 0;
  }

  .sk-connectors-pattern__facts dd {
    margin: 0;
    color: var(--sk-fg-default);
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
            <dl class="sk-connectors-pattern__facts">
              ${card.facts.map(
                (fact) => html`<dt>${fact.term}</dt>
                  <dd>${fact.value}</dd>`,
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

// --- Required LightMode system proof (programme brief hard rule 5) ----------------------------

export const LightMode: Story = {
  render: () => withThemeWrapper(renderOperating(selectOperatingProjection(CONNECTORS_FIXTURE.operating, 'admin')), true),
};
