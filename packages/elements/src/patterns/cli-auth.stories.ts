import type { Meta, StoryObj } from "@storybook/web-components";
import { html, type TemplateResult } from "lit";
import { ref } from "lit/directives/ref.js";
import "../form-input/sk-form-input.js";
import type { SkFormInput } from "../form-input/sk-form-input.js";
import "../button/sk-button.js";
import "../card/sk-card.js";
import "../pill-tag/sk-pill-tag.js";
import {
  CLI_AUTH_FIXTURES,
  type DeepReadonly,
  type TerminalErrorFixture,
  type TerminalOutcomeFixture,
} from "./cli-auth.fixture.js";

export {
  CLI_AUTH_FIXTURES,
  deepFreezeCliAuthFixture,
  terminalActionCount,
} from "./cli-auth.fixture.js";

/**
 * Family 5's twelve CLI/device-authorization screens reduce to one small reusable anatomy,
 * proven here as four representative Storybook-only stories composed entirely from public
 * `@spec-kitty/tokens`/`@spec-kitty/styles`/`@spec-kitty/elements` surfaces plus native semantic
 * HTML (spec.md). This is composition and accessibility evidence, not a new component, not a
 * Team Kitty route, and not a replica of A1-A12 (C-007).
 *
 * DEPENDENCY POSTURE (spec.md's dependency-posture table, re-verified in research.md at
 * authoring time against `origin/train/elements-first@4d6c5f2`):
 *   - Story 2's Deny action composes a PLAIN `sk-button` secondary tone, marked `// pending
 *     #320` below. #320's danger-secondary tone is not yet public; this is not a substitute —
 *     see the comment at the Deny button for why no local danger style is used instead (C-010).
 *   - Stories 3 and 4 compose no frame at all: `sk-boundary-page` (#303) does not exist
 *     anywhere in this tree (verified: `find packages/{elements,styles}/src -iname
 *     '*boundary-page*'` returns nothing). Importing a nonexistent module would fail the whole
 *     Storybook build, not just these two stories, so each renders a clearly marked
 *     `// TODO(#303)` pending shell instead of a forked frame (C-003).
 *   - Story 1 composes the CURRENT, unchanged `.sk-form-input`/`sk-form-field` contract; #321's
 *     contrast/target-size fix has not landed, so those specific acceptance clauses stay
 *     red-first (`// pending #321` in the test file) until IC-06 rebases onto it.
 */
const patternStyles = html`<style>
  .sk-cli-auth-pattern {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--sk-space-6);
    max-inline-size: 32rem;
    margin-inline: auto;
    padding: var(--sk-space-6);
    color: var(--sk-fg-default);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }

  .sk-cli-auth-pattern__code-entry {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sk-space-4);
  }

  .sk-cli-auth-pattern__decision-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-3);
  }

  .sk-cli-auth-pattern__scopes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-2);
  }

  .sk-cli-auth-pattern__pending {
    margin: 0;
    padding: var(--sk-space-4);
    border: var(--sk-border-width-1) dashed var(--sk-border-default);
    border-radius: var(--sk-radius-sm);
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
  }

  @media (max-width: 390px) {
    .sk-cli-auth-pattern {
      padding: var(--sk-space-4);
    }
  }
</style>`;

/** Story 1 — code entry. One native `<form>`, one labelled `sk-form-input`, one `sk-button`
 *  primary. No submission/validation LOGIC is added (C-005) — `setCustomError` on the invalid
 *  variant supplies the fixture's own error text through the element's real public API rather
 *  than the native `required` message, which the element derives itself and no fixture owns. */
const renderCodeEntry = (
  variant: "default" | "invalid",
  light = false,
): TemplateResult => {
  const fixture =
    variant === "default"
      ? CLI_AUTH_FIXTURES.codeEntryDefault
      : CLI_AUTH_FIXTURES.codeEntryInvalid;
  return html`<div
    class="sk-cli-auth-pattern${light ? " sk-light" : ""}"
    data-cli-auth-pattern
    data-cli-auth-story="code-entry"
    data-cli-auth-variant=${variant}
    data-render-complete="true"
  >
    ${patternStyles}
    <form class="sk-cli-auth-pattern__code-entry" novalidate>
      <sk-form-input
        ${ref((element) => {
          if (!fixture.errorMessage) return;
          // Sets validity through the element's own public setCustomError() API — never
          // `invalid` directly (which would paint red with no announced message; see
          // sk-form-input.ts's own comment on why that is "the worst possible state").
          (element as SkFormInput | undefined)?.setCustomError(
            fixture.errorMessage,
          );
        })}
        name="device-code"
        label=${fixture.label}
        description=${fixture.description}
      ></sk-form-input>
      <sk-button variant="primary">${fixture.submitLabel}</sk-button>
    </form>
  </div>`;
};

/** Story 2 — review and decide. `sk-card` + `.sk-facts` (native `<dl>`) + `sk-pill-tag` per
 *  scope + one native `<form>` holding Approve and Deny, DOM order Approve-then-Deny.
 *
 *  DENY IS A PLAIN secondary `sk-button` below — the pending state, not the finished one.
 *  #320's danger-secondary tone is the honest public surface for this action and has not
 *  landed on train/elements-first at authoring time (research.md, verified via `grep -n danger
 *  packages/styles/src/button/sk-button.css`, no match). Do not fork it: no local
 *  `--sk-status-danger` restyle of `.sk-button--secondary`, no story-local danger class or
 *  component (C-010, the alternatives-rejected table in research.md). T010 swaps this variant
 *  for #320's actual landed tone once it lands and this lane rebases.
 *  // pending #320 */
const renderAuthorizationDecision = (light = false): TemplateResult => {
  const fixture = CLI_AUTH_FIXTURES.authorizationDecision;
  return html`<div
    class="sk-cli-auth-pattern${light ? " sk-light" : ""}"
    data-cli-auth-pattern
    data-cli-auth-story="authorization-decision"
    data-render-complete="true"
  >
    ${patternStyles}
    <sk-card>
      <dl class="sk-facts sk-facts--two-col">
        ${fixture.facts.map(
          (fact) =>
            html`<dt class="sk-facts__term">${fact.term}</dt>
              <dd class="sk-facts__value">${fact.value}</dd>`,
        )}
      </dl>
      <div class="sk-cli-auth-pattern__scopes">
        ${fixture.scopes.map(
          (scope) => html`<sk-pill-tag>${scope}</sk-pill-tag>`,
        )}
      </div>
      <form class="sk-cli-auth-pattern__decision-actions" novalidate>
        <sk-button variant="primary">${fixture.approveLabel}</sk-button>
        <!-- Deny stays a plain secondary tone: pending #320's danger-secondary sk-button
             tone landing on train/elements-first. See the doc comment above this function. -->
        <sk-button variant="secondary">${fixture.denyLabel}</sk-button>
      </form>
    </sk-card>
  </div>`;
};

/**
 * Stories 3 and 4 — terminal success/denial and terminal error.
 *
 * TODO(#303): compose `sk-boundary-page` once its public frame lands on `train/elements-first`.
 * This is a RED-FIRST SHELL, not a substitute frame (C-003, spec.md's dependency-posture table).
 * No `sk-boundary-page` element exists anywhere in this tree today — confirmed by
 * `find packages/{elements,styles}/src -iname '*boundary-page*'`, zero results — so this
 * renders only a clearly labelled pending marker carrying the fixture's own heading/body for
 * transparency. It builds no card, stage, or frame of its own to stand in for it: no
 * `auth-card`, no `sk-terminal-frame`, no second boundary/stage component (C-002, C-003).
 */
const renderTerminalPending = (
  fixture: DeepReadonly<TerminalOutcomeFixture | TerminalErrorFixture>,
  storyKey: string,
  light = false,
): TemplateResult => html`<div
  class="sk-cli-auth-pattern${light ? " sk-light" : ""}"
  data-cli-auth-pattern
  data-cli-auth-story=${storyKey}
  data-cli-auth-pending="303"
  data-render-complete="true"
>
  ${patternStyles}
  <p class="sk-cli-auth-pattern__pending">
    Blocked on #303 (<code>sk-boundary-page</code> is not yet public). Fixture
    heading: "${fixture.heading}". Body: "${fixture.body}".
    ${fixture.action
      ? html`Supplied action: "${fixture.action.label}" -&gt;
          ${fixture.action.href}.`
      : "No action supplied."}
  </p>
</div>`;

const meta: Meta = {
  title: "Patterns/CLI Auth",
  tags: ["autodocs"],
  parameters: {
    a11y: { disable: false },
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A Storybook-only proof of the CLI Auth (Family 5) composition: code entry, authorization decision, and terminal success/denial/error. The application supplies routing, permission, session, validation, submission, confirmation, copy, localization, and terminal-state selection; the library supplies presentation and accessible component behavior. See docs/design-system/using-components.md's 'CLI auth pattern' section.",
      },
    },
  },
  excludeStories: [
    "CLI_AUTH_FIXTURES",
    "deepFreezeCliAuthFixture",
    "terminalActionCount",
  ],
};

export default meta;
type Story = StoryObj;

export const CodeEntryDefault: Story = {
  name: "Story 1 — code entry (default)",
  render: () => renderCodeEntry("default"),
};

export const CodeEntryInvalid: Story = {
  name: "Story 1 — code entry (invalid)",
  render: () => renderCodeEntry("invalid"),
};

export const CodeEntryLightMode: Story = {
  name: "Story 1 — code entry (LightMode)",
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => renderCodeEntry("default", true),
};

export const AuthorizationDecision: Story = {
  name: "Story 2 — review and decide",
  render: () => renderAuthorizationDecision(),
};

export const AuthorizationDecisionLightMode: Story = {
  name: "Story 2 — review and decide (LightMode)",
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => renderAuthorizationDecision(true),
};

export const TerminalSuccess: Story = {
  name: "Story 3 — terminal success (pending #303)",
  render: () =>
    renderTerminalPending(
      CLI_AUTH_FIXTURES.terminalSuccess,
      "terminal-success",
    ),
};

export const TerminalDenied: Story = {
  name: "Story 3 — terminal denial (pending #303)",
  render: () =>
    renderTerminalPending(
      CLI_AUTH_FIXTURES.terminalDenied,
      "terminal-denied",
    ),
};

export const TerminalErrorNoAction: Story = {
  name: "Story 4 — terminal error, no action (pending #303)",
  render: () =>
    renderTerminalPending(
      CLI_AUTH_FIXTURES.terminalErrorNoAction,
      "terminal-error-no-action",
    ),
};

export const TerminalErrorWithAction: Story = {
  name: "Story 4 — terminal error, with supplied action (pending #303)",
  render: () =>
    renderTerminalPending(
      CLI_AUTH_FIXTURES.terminalErrorWithAction,
      "terminal-error-with-action",
    ),
};
