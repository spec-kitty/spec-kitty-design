/**
 * CONNECTORS PATTERN STORIES — unblocked scope (C1-C4 only), mission #338.
 *
 * Composes C1 (setup index), C2 (operating index), C3 (provider authorization handoff), and C4
 * (GitHub App setup failure) from public `@spec-kitty/elements` custom elements and native HTML
 * semantics only. C5-C9b are deliberately absent — see `connectors.fixture.ts`'s header and
 * `kitty-specs/connectors-pattern-stories-01M26947/tasks.md` (T008-T011).
 *
 * PUBLIC SURFACES COMPOSED: `sk-page-header`, `sk-card[status]`, `sk-status-indicator`,
 * `sk-notice`, `sk-button` (element form for the off-site "Manage on GitHub" link; native
 * `class="sk-button sk-button--*"` CSS-only form for the two in-form submit controls, since a
 * `<button>` inside `sk-button`'s shadow root cannot participate in an ancestor light-DOM
 * `<form>` — ADR-9 §4's exact finding, reused here rather than rediscovered), `sk-action-row`
 * (its already-public `controls` slot — see the #307 finding in research.md), plus native
 * `<h1>`/`<form>`/`<a>`/`<dl>` semantics and the documented `.sk-empty-state` CSS family. No
 * shadow-root reach, no duplicated component CSS, no undeclared `::part()` — enforced by
 * `scripts/check-pattern-composition.mjs` (#259).
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
  selectHandoffProjection,
  selectOperatingProjection,
  selectSetupProjection,
  type ConnectorRole,
  type GithubAppFailureProjection,
  type HandoffFlow,
  type HandoffProjection,
  type OperatingProjection,
  type SetupProjection,
} from './connectors.fixture.js';

export {
  CONNECTORS_FIXTURE,
  deepFreeze,
  healthTone,
  selectGithubAppFailureProjection,
  selectHandoffProjection,
  selectOperatingProjection,
  selectSetupProjection,
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

// --- Required LightMode system proof (programme brief hard rule 5) ----------------------------

export const LightMode: Story = {
  render: () => withThemeWrapper(renderOperating(selectOperatingProjection(CONNECTORS_FIXTURE.operating, 'admin')), true),
};
