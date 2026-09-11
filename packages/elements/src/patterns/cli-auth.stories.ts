import type { Meta, StoryObj } from "@storybook/web-components";
import { html, type TemplateResult } from "lit";
import { ref } from "lit/directives/ref.js";
import "../form-input/sk-form-input.js";
import type { SkFormInput } from "../form-input/sk-form-input.js";
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
 * IC-06 — DEPENDENCY RESOLUTION (all three landed on `train/elements-first`, consumed here from
 * their real shipped shape, not the class/attribute names research.md guessed at ahead of time):
 *   - Story 2's Deny action composes `#320`'s real `.sk-button--danger-secondary` class
 *     (`packages/styles/src/button/sk-button.css`, confirmed on the train — `grep -n
 *     danger-secondary` matches 7 times).
 *   - Stories 3 and 4 compose `#303`'s real `sk-boundary-page` — a STYLES-ONLY frame (no custom
 *     element; `packages/styles/src/boundary-page/sk-boundary-page.css`, confirmed on the train
 *     via its own HTML exemplars under that same directory) — read from its actual published
 *     anatomy (that file's own "ANATOMY" doc comment) rather than inferred from #303's issue
 *     text. `.sk-boundary-page__stage` > `.sk-boundary-page__card` >
 *     [`.sk-boundary-page__mark` optional] > `<h1 class="sk-boundary-page__title">` >
 *     `.sk-boundary-page__body` > `.sk-boundary-page__action-group` (0..N `<a>`/`<button>`) >
 *     [`.sk-boundary-page__footnote` optional]. This mission's fixtures carry no mark/footnote
 *     field, so both are omitted from the DOM entirely — never `[hidden]` — matching that file's
 *     own documented absence contract. No local frame was forked or restated (C-003): every
 *     class below is `sk-boundary-page`'s own, composed exactly as its own exemplars do.
 *   - Story 1's contrast clause now passes against `#321`'s real `--sk-border-control` token,
 *     applied to `.sk-input`/`.sk-form-input__control` on the train
 *     (`packages/tokens/src/tokens.css`, `packages/styles/src/form-field/sk-form-field.css`) —
 *     verified by the (now green) contrast assertion in the test file, not merely assumed.
 *
 * WHY THE THREE FORM ACTIONS ARE NATIVE `<button>`, NOT `<sk-button>`. `sk-button.ts` hard-codes
 * `type="button"` on its shadow-root control and says so in its own comment: "A `<button>`
 * inside a shadow root does not submit an enclosing form ... so this element can never be a
 * submit button." A story whose acceptance text calls for "a primary submit action" (Story 1)
 * and native forms whose DOM order IS the focus order (Story 2) cannot satisfy that with an
 * element that structurally cannot submit — so every form action here is
 * `<button type="submit" class="sk-button sk-button--*">`, composing the PUBLIC styles-layer
 * class directly rather than the element. This is still "public surfaces plus native semantic
 * HTML" (C-004): `.sk-button` and its tone modifiers in `packages/styles/src/button/sk-button.css`
 * are a public surface in their own right, not merely the element's internal implementation.
 * `apps/storybook/.storybook/preview.ts` imports that stylesheet globally for exactly this case
 * (see its own header comment on why only `scope:storybook` may reach both layers). The
 * `<sk-form-input>` element stays as-is: it is the one composed surface here that is not a form
 * action, and the pairing is deliberate — Story 1 exercises both consumption paths at once,
 * which is the anti-drift property #321 exists to establish. See `docs/design-system/
 * using-components.md`'s "CLI auth pattern" section for the consumer-facing statement of this
 * limitation and its escape hatch (ADR-9 §4 / #74's `ElementInternals` work).
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
    /* Reset the <ul>'s UA defaults (margin, padding, disc marker) so wrapping the scope
       pill-tags in real list semantics (item 4, squad pass 1) leaves the rendered flex row
       pixel-unchanged. */
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* #417: deliberately mirrors sk-boundary-page.css's own narrow-width step
     (packages/styles/src/boundary-page/sk-boundary-page.css's @media (max-width: 480px)),
     which stories 3/4 compose directly — so both halves of this pattern family share one
     gutter regime instead of narrowing at two different widths. A future respacing of that
     file's breakpoint should update this one too. */
  @media (max-width: 480px) {
    .sk-cli-auth-pattern {
      padding: var(--sk-space-4);
    }
  }
</style>`;

/** Story 1 — code entry. One native `<form>`, one labelled `sk-form-input`, one native
 *  `<button type="submit" class="sk-button sk-button--primary">` (see the file-level doc
 *  comment for why the submit action is native rather than `<sk-button>`). No submission/
 *  validation LOGIC is added (C-005) — `setCustomError` on the invalid variant supplies the
 *  fixture's own error text through the element's real public API rather than the native
 *  `required` message, which the element derives itself and no fixture owns. */
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
      <button type="submit" class="sk-button sk-button--primary">${fixture.submitLabel}</button>
    </form>
  </div>`;
};

/** Story 2 — review and decide. `sk-card` + `.sk-facts` (native `<dl>`) + `sk-pill-tag` per
 *  scope + one native `<form>` holding Approve and Deny as native
 *  `<button type="submit" class="sk-button sk-button--*">` (see the file-level doc comment for
 *  why native, not `<sk-button>`), DOM order Approve-then-Deny.
 *
 *  DENY COMPOSES `#320`'S REAL `.sk-button--danger-secondary` CLASS — landed on
 *  `train/elements-first` (`packages/styles/src/button/sk-button.css`, verified: `grep -n
 *  danger-secondary` matches 7 times). Not forked: this is exactly `#320`'s own published
 *  modifier class, reusing the secondary shape with the danger role's own boundary
 *  (`--sk-on-status-danger`), the same class every other consumer of that tone uses.
 *
 *  APPROVE AND DENY CARRY `name="decision"` / distinct `value`s — structural form attributes,
 *  not user-visible copy (#286 untouched), added because a consumer copying this composition
 *  into a real server-rendered submit would otherwise get two buttons with no `name` and no
 *  `value`: an identical, undifferentiated request whichever one is pressed, on the one screen
 *  in this family where failing open is a security outcome.
 *
 *  SCOPES RENDER INSIDE A `<ul>`/`<li>`, not bare `<sk-pill-tag>` siblings — `sk-pill-tag` is
 *  documented presentational (no role, no accessible-name contribution), so without list
 *  semantics the three scope labels — the security payload the user is consenting to — would be
 *  orphan text fragments while the less-critical client/account facts correctly get a `<dl>`.
 *  `.sk-cli-auth-pattern__scopes` resets the `<ul>`'s UA margin/padding/list-style below so the
 *  rendered result is unchanged; the flex row layout is unaffected because it already targeted
 *  this class, not the element name. */
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
      <ul class="sk-cli-auth-pattern__scopes">
        ${fixture.scopes.map(
          (scope) => html`<li><sk-pill-tag>${scope}</sk-pill-tag></li>`,
        )}
      </ul>
      <form class="sk-cli-auth-pattern__decision-actions" novalidate>
        <button type="submit" name="decision" value="approve" class="sk-button sk-button--primary">${fixture.approveLabel}</button>
        <button type="submit" name="decision" value="deny" class="sk-button sk-button--danger-secondary">${fixture.denyLabel}</button>
      </form>
    </sk-card>
  </div>`;
};

/**
 * Stories 3 and 4 — terminal success/denial and terminal error.
 *
 * Composes `#303`'s real, landed `sk-boundary-page` frame — a styles-only pattern, not a custom
 * element (`packages/styles/src/boundary-page/sk-boundary-page.css`'s own header comment: "NO
 * SHADOW ROOT, NO CUSTOM ELEMENT — deliberately"). The markup below is exactly that file's own
 * documented anatomy — verified against its ANATOMY comment and its own HTML exemplars
 * (`sk-boundary-page-terminal-card.html`, `sk-boundary-page-without-mark.html`), not inferred
 * from #303's issue text:
 *   `<main>` (consumer-owned landmark, matching every one of #303's own exemplars)
 *     > `.sk-boundary-page__stage` `.sk-boundary-page` (bare block class, the frame's own
 *       component-host identification hook — see that file's header comment on why it sits
 *       alongside `__stage` rather than alone)
 *       > `.sk-boundary-page__card`
 *         > `<h1 class="sk-boundary-page__title">` — consumer's own heading element
 *         > `.sk-boundary-page__body` — required
 *         > `.sk-boundary-page__action-group` — required container, 0 or 1 `<a>` here (this
 *           mission's terminal fixtures never carry more than one supplied action)
 * `.sk-boundary-page__mark` and `.sk-boundary-page__footnote` are OMITTED ENTIRELY, never
 * `[hidden]` — this mission's fixtures carry no mark/footnote field, and that sheet's own gap
 * semantics contract exists precisely so an absent optional child leaves no phantom space
 * (that file's own header comment). No local frame, stage, or "boundary" component was forked
 * or restated (C-003): every class below is `sk-boundary-page`'s own.
 */
const renderTerminal = (
  fixture: DeepReadonly<TerminalOutcomeFixture | TerminalErrorFixture>,
  storyKey: string,
  light = false,
): TemplateResult => html`<main
  class=${light ? "sk-light" : ""}
  data-cli-auth-pattern
  data-cli-auth-story=${storyKey}
  data-render-complete="true"
>
  <div class="sk-boundary-page sk-boundary-page__stage">
    <div class="sk-boundary-page__card">
      <h1 class="sk-boundary-page__title">${fixture.heading}</h1>
      <p class="sk-boundary-page__body">${fixture.body}</p>
      <div class="sk-boundary-page__action-group">
        ${fixture.action
          ? html`<a href=${fixture.action.href}>${fixture.action.label}</a>`
          : ""}
      </div>
    </div>
  </div>
</main>`;

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
  name: "Story 3 — terminal success",
  render: () =>
    renderTerminal(CLI_AUTH_FIXTURES.terminalSuccess, "terminal-success"),
};

export const TerminalSuccessLightMode: Story = {
  name: "Story 3 — terminal success (LightMode)",
  parameters: { backgrounds: { default: "sk-light" } },
  render: () =>
    renderTerminal(
      CLI_AUTH_FIXTURES.terminalSuccess,
      "terminal-success",
      true,
    ),
};

export const TerminalDenied: Story = {
  name: "Story 3 — terminal denial",
  render: () =>
    renderTerminal(CLI_AUTH_FIXTURES.terminalDenied, "terminal-denied"),
};

export const TerminalDeniedLightMode: Story = {
  name: "Story 3 — terminal denial (LightMode)",
  parameters: { backgrounds: { default: "sk-light" } },
  render: () =>
    renderTerminal(CLI_AUTH_FIXTURES.terminalDenied, "terminal-denied", true),
};

export const TerminalErrorNoAction: Story = {
  name: "Story 4 — terminal error, no action",
  render: () =>
    renderTerminal(
      CLI_AUTH_FIXTURES.terminalErrorNoAction,
      "terminal-error-no-action",
    ),
};

export const TerminalErrorNoActionLightMode: Story = {
  name: "Story 4 — terminal error, no action (LightMode)",
  parameters: { backgrounds: { default: "sk-light" } },
  render: () =>
    renderTerminal(
      CLI_AUTH_FIXTURES.terminalErrorNoAction,
      "terminal-error-no-action",
      true,
    ),
};

export const TerminalErrorWithAction: Story = {
  name: "Story 4 — terminal error, with supplied action",
  render: () =>
    renderTerminal(
      CLI_AUTH_FIXTURES.terminalErrorWithAction,
      "terminal-error-with-action",
    ),
};

export const TerminalErrorWithActionLightMode: Story = {
  name: "Story 4 — terminal error, with supplied action (LightMode)",
  parameters: { backgrounds: { default: "sk-light" } },
  render: () =>
    renderTerminal(
      CLI_AUTH_FIXTURES.terminalErrorWithAction,
      "terminal-error-with-action",
      true,
    ),
};
