/**
 * Stories for the Account Front Door pattern (#355, epic #352).
 *
 * Proves six representative Family 6 account/public-front-door compositions from surfaces
 * `train/elements-first` already ships — `.sk-public-header`, `sk-site-footer` (compact),
 * `.sk-boundary-page`, `sk-theme-toggle`, `.sk-radio-choice-group`, `.sk-form-field`/`.sk-input`,
 * `.sk-button`, `sk-notice`, `.sk-prose`, `sk-copy-field`, `sk-app-shell`, `sk-page-header`,
 * `.sk-skip-link`, `.sk-pill-tag` — native semantic HTML, immutable frozen fixtures and pure
 * display projections. No auth, account, front-door, legal-page, recovery, MFA/code-input,
 * email-row, social-provider, error-summary or password-maintenance element is published (C-001,
 * C-002). The proof is split three ways, the `operational-status` shape:
 *
 *   * these stories                          — visual, autodocs, axe, LightMode, system-condition
 *   * pattern-account-front-door.test.ts       — freeze, purity, truth preservation, tokens-only
 *     (behaviour suite)
 *   * check-pattern-composition.mjs            — no reach-through, no undeclared part, no
 *     (lint-code, ENFORCED)                      duplicated component CSS
 *
 * `sk-theme-toggle` writes `localStorage` and mutates `documentElement`'s theme (reconciliation
 * item 9) — every story in this family carries `meta.beforeEach = isolateThemeStory`, not just
 * the ones that visibly compose the control, so no story can leak theme state into a sibling.
 *
 * TWO SETTLED RULINGS, both followed exactly and neither relitigated here:
 *   1. `Re-send Verification` composes `.sk-button .sk-button--secondary` bare. The open #155
 *      border-contrast defect is real and is documented in `docs/design-system/using-components.md`
 *      rather than compensated here — Epic #352 forbids reproducing Family 6's
 *      `.front-door-secondary-action` border override as a library contract.
 *   2. Composition 6 composes NO `sk-action-row`. P20 is a native radio choice group plus a flat
 *      row of plain submit buttons that act on whichever address is selected — there is no
 *      identity row and no trigger for `sk-action-row`'s anatomy to model.
 */
import type { Meta, StoryObj } from "@storybook/web-components";
import { html, nothing, type TemplateResult } from "lit";
import { ref } from "lit/directives/ref.js";
import "../app-shell/sk-app-shell.js";
import "../copy-field/sk-copy-field.js";
import "../notice/sk-notice.js";
import "../page-header/sk-page-header.js";
import "../pill-tag/sk-pill-tag.js";
import "../site-footer/sk-site-footer.js";
import "../theme-toggle/sk-theme-toggle.js";
// WHERE THE STYLES-LAYER CSS FOR THIS PATTERN COMES FROM, since none of it is imported here.
//
// `.sk-public-header` (#353), `.sk-boundary-page` (#303), `.sk-radio-choice-group` and
// `.sk-skip-link` are STYLES-ONLY families with no custom element (ADR-10 §3), so there is no
// element module to import that would carry their CSS. This file cannot import the CSS either:
// `scripts/check-no-css-in-source.mjs` rejects a bare stylesheet import anywhere under
// packages/elements/src (FR-009, ADR-10 §1 Confirmation #4) — an earlier revision of this file
// imported all four via `@spec-kitty/styles/<name>/*` and `lint-code` failed on it. The four are
// registered in `apps/storybook/.storybook/preview.ts` instead, which is the documented route:
// packages/styles may not import an element and packages/elements may not import a stylesheet, so
// `scope:storybook` is the one project allowed to reach both. That comment block names the case.
//
// sk-site-footer is the different one — it HAS an element, so it has a generated constructed
// sheet, and `sk-site-footer.stories.ts` already adopts that same module the same way. A document
// copy is needed because the element's own adopted shadow sheet never colours a light-DOM compact
// link: the base `.sk-site-footer__link` colour rule (sk-site-footer.css:137) ships no
// `::slotted()` counterpart, and the `--compact` modifier that does (sk-site-footer.css:233-234)
// is sizing only. Measured: without this, compact footer links render the browser's default link
// colour and fail axe's colour-contrast check in `sk-light` — the same root cause as the four
// above. That gap in the dependency's sheet is pre-existing and is NOT touched here; C-004 forbids
// editing anything under packages/styles/src/.
import siteFooterDocumentSheet from "../site-footer/sk-site-footer.css.js";
import { isolateThemeStory } from "../theme-toggle/theme-story-environment.fixture.js";
import {
  ACCOUNT_FRONT_DOOR_FIXTURES,
  deepFreezeAccountFrontDoorFixture,
  fixtureForAccountFrontDoorState,
  projectAccountFrontDoor,
  type DeepReadonly,
  type EmailActionsFixture,
  type EmailManagementFixture,
  type EntryBoundaryFixture,
  type FormFieldFixture,
  type SignupFieldFixture,
  type FrontDoorFixture,
  type FrontDoorState,
  type LandingFixture,
  type LegalPublishedFixture,
  type LegalUnavailableFixture,
  type LinkedError,
  type PasswordMaintenanceFixture,
  type ProviderFixture,
  type PublicChrome,
  type RecoveryOutcomeFixture,
  type TermsFieldFixture,
  type TerminalFixture,
} from "./account-front-door.fixture.js";

export {
  ACCOUNT_FRONT_DOOR_FIXTURES,
  ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT,
  deepFreezeAccountFrontDoorFixture,
  fixtureForAccountFrontDoorState,
  projectAccountFrontDoor,
} from "./account-front-door.fixture.js";

if (!document.adoptedStyleSheets.includes(siteFooterDocumentSheet)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, siteFooterDocumentSheet];
}

// `ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT` is DEFINED in the fixture module and re-exported here
// (not defined in this file) — it is pure string data with no `lit`/`@storybook/web-components`
// dependency, and the fixture module is the one place the behaviour suite can import it from
// without also pulling this file's full custom-element import graph into the SAME `tsc` program
// as every other behaviour test. Measured: importing this constant from THIS file (its original
// location) destabilised `sk-form-input.test.ts`'s unrelated `keyof Input` resolution into a
// `TS2538: Type 'unique symbol' cannot be used as an index type` failure, present only when this
// file's imports joined that compilation unit and absent with them removed.

// The <style> tag below carries the SAME rules as `ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT` above,
// written a second time rather than interpolated in. `check-pattern-composition.mjs` extracts
// `<style>…</style>` bodies from the RAW SOURCE TEXT and masks every `${…}` interpolation with a
// class-shaped placeholder before handing the result to postcss — masking the ENTIRE body (one
// interpolation spanning the whole tag) leaves postcss nothing parseable and the gate refuses to
// run rather than certify an unreadable block. Literal CSS text is what every other pattern file
// in this directory carries in its own `<style>` tag for the same reason. Keep both copies in
// sync; the tokens-only assertion in the behaviour suite reads the exported string, and R1–R3
// here read this literal block.
const patternStyles = html`<style>
  .sk-account-front-door-pattern {
    display: block;
    box-sizing: border-box;
    min-block-size: 100vh;
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }

  .sk-account-front-door-pattern__main {
    display: grid;
    gap: var(--sk-space-6);
    max-inline-size: calc(var(--sk-space-9) * 14);
    margin-inline: auto;
    padding: var(--sk-space-6);
  }

  .sk-account-front-door-pattern__cta,
  .sk-account-front-door-pattern__account-submit,
  .sk-account-front-door-pattern__email-action,
  .sk-account-front-door-pattern__provider-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--sk-space-9);
    min-inline-size: var(--sk-space-9);
  }

  .sk-account-front-door-pattern__copy-host {
    display: block;
    min-block-size: var(--sk-space-9);
  }

  .sk-account-front-door-pattern__journey {
    display: grid;
    gap: var(--sk-space-3);
    padding-inline-start: var(--sk-space-6);
  }

  .sk-account-front-door-pattern__terms-row {
    display: flex;
    align-items: center;
    min-block-size: var(--sk-space-9);
    gap: var(--sk-space-2);
  }

  .sk-account-front-door-pattern__terms-label {
    display: flex;
    align-items: center;
    gap: var(--sk-space-2);
    font-size: var(--sk-text-sm);
    color: var(--sk-fg-body);
  }

  .sk-account-front-door-pattern__providers {
    display: grid;
    gap: var(--sk-space-3);
  }

  .sk-account-front-door-pattern__provider-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-3);
  }

  .sk-account-front-door-pattern__error-summary {
    display: grid;
    gap: var(--sk-space-2);
    padding: var(--sk-space-4);
    border: var(--sk-border-width-1) solid var(--sk-border-control-invalid);
    border-radius: var(--sk-radius-md);
  }

  .sk-account-front-door-pattern__error-list {
    display: grid;
    gap: var(--sk-space-1);
    margin: 0;
    padding-inline-start: var(--sk-space-5);
  }

  .sk-account-front-door-pattern__error-link {
    color: var(--sk-fg-error);
    font-weight: var(--sk-weight-medium);
  }

  .sk-account-front-door-pattern__email-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-3);
  }

  .sk-account-front-door-pattern__radio-pill {
    margin-inline-start: var(--sk-space-2);
  }
</style>`;

// ── Shared render helpers ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  readonly light?: boolean;
  readonly rtl?: boolean;
  readonly longStrings?: boolean;
}

/** Presentation-only long-string substitutions for the `LongStrings` proof (NFR-013). No fixture
 *  fact changes — the same real English labels, tripled, so no field's *meaning* is invented. */
const longStringsMap: Readonly<Record<string, string>> = {
  "ada@example.com": "ada.constantina.lovelace.of.the.analytical.engine.workspace@example.com",
  "ada+team@example.com":
    "ada.constantina.lovelace.plus.team.notifications.workspace@example.com",
  "Re-send Verification": "Re-send Verification Re-send Verification Re-send Verification",
  "Make Primary": "Make Primary Make Primary Make Primary",
  Remove: "Remove Remove Remove",
  "A verification email was just sent. You can send another in 58 seconds.":
    "A verification email was just sent to your address. You can send another verification email in fifty-eight seconds, once the cooldown period has fully elapsed.",
};

const withLongStrings = (value: string, options: RenderOptions): string =>
  options.longStrings ? (longStringsMap[value] ?? value) : value;

const skipLink = () => html`<a href="#main" class="sk-skip-link">Skip to main content</a>`;

/** Composed once for every public composition. Every action carries `sk-public-header__action`,
 *  which is what carries the 48px floor — a composed control without it has no floor at all
 *  (reconciliation item 2). At zero actions `__actions` is omitted entirely, never rendered
 *  empty (item 3); every fixture in this family declares at least one action, so that arm is
 *  structurally honoured but never exercised by a published story. */
const publicHeader = (chrome: DeepReadonly<PublicChrome>): TemplateResult => {
  const actions = chrome.actions;
  return html`<header class="sk-public-header">
    <div class="sk-public-header__inner">
      <a class="sk-public-header__brand" href=${chrome.brand.href}>
        ${chrome.brand.label}${chrome.brand.context
          ? html`<span class="sk-public-header__brand-context">${chrome.brand.context}</span>`
          : nothing}
      </a>
      ${actions.length === 0 && !chrome.theme
        ? nothing
        : html`<nav class="sk-public-header__actions" aria-label="Account and appearance">
            ${actions.map(
              (action) =>
                html`<a
                  class="sk-public-header__action sk-button ${action.kind === "sign-in"
                    ? "sk-button--ghost"
                    : "sk-button--secondary"} sk-button--sm"
                  href=${action.href}
                  >${action.label}</a
                >`,
            )}
            <sk-theme-toggle
              class="sk-public-header__action"
              data-theme-control
              label=${chrome.theme.label}
              system-label=${chrome.theme.systemLabel}
              light-label=${chrome.theme.lightLabel}
              dark-label=${chrome.theme.darkLabel}
            ></sk-theme-toggle>
          </nav>`}
    </div>
  </header>`;
};

const compactFooter = (chrome: DeepReadonly<PublicChrome>): TemplateResult =>
  html`<sk-site-footer
    presentation="compact"
    tagline=${chrome.footer.tagline}
    legal=${chrome.footer.legal}
  >
    ${chrome.footer.links.map(
      (link) =>
        html`<a
          slot="compact-links"
          class="sk-site-footer__link sk-site-footer__link--compact"
          href=${link.href}
          >${link.label}</a
        >`,
    )}
  </sk-site-footer>`;

// Takes EITHER field shape. `SignupFieldFixture` has no help text at all (`description?: never`)
// and `FormFieldFixture`'s is optional, so the description span below is conditional: rendering an
// always-present span produced an empty, unreferenced element under every signup field, since
// `aria-describedby` only points at it while an error is showing.
const formField = (
  field: DeepReadonly<SignupFieldFixture | FormFieldFixture>,
  error: DeepReadonly<LinkedError> | undefined,
  retainedValue: string | undefined,
): TemplateResult => {
  const descriptionId = `${field.id}-description`;
  const descriptionText = error ? error.message : field.description;
  return html`<div class="sk-form-field${error ? " sk-form-field--error" : ""}">
    <label class="sk-form-field__label" for=${field.id}>${field.label}</label>
    <input
      class="sk-input"
      id=${field.id}
      name=${field.id}
      type=${field.type}
      autocomplete=${field.autocomplete}
      ?required=${field.required}
      .value=${retainedValue ?? ""}
      aria-invalid=${error ? "true" : nothing}
      aria-describedby=${error ? descriptionId : nothing}
    />
    ${descriptionText
      ? html`<span id=${descriptionId} class="sk-form-field__description"
          >${descriptionText}</span
        >`
      : nothing}
  </div>`;
};

const termsRow = (terms: DeepReadonly<TermsFieldFixture>): TemplateResult =>
  html`<div class="sk-account-front-door-pattern__terms-row">
    <label class="sk-account-front-door-pattern__terms-label" for=${terms.id}>
      <input
        class="sk-account-front-door-pattern__terms-control"
        type="checkbox"
        id=${terms.id}
        name=${terms.id}
        required
      />
      ${terms.label}
    </label>
  </div>`;

const providerRegion = (
  providers: readonly DeepReadonly<ProviderFixture>[],
): TemplateResult | typeof nothing =>
  providers.length === 0
    ? nothing
    : html`<div class="sk-account-front-door-pattern__providers" data-provider-region>
        <p class="sk-account-front-door-pattern__providers-label">Or continue with</p>
        <div class="sk-account-front-door-pattern__provider-list">
          ${providers.map(
            (provider) =>
              html`<a
                class="sk-button sk-button--ghost sk-account-front-door-pattern__provider-action"
                href=${provider.href}
                >${provider.label}</a
              >`,
          )}
        </div>
      </div>`;

/** Focus moves once to the summary, modelling a server re-render that already carries errors
 *  (the pattern performs no live submit — see the truth-constraint note on zero network). Each
 *  summary link's activation moves focus to its field via native anchor-fragment focus; no
 *  script is required for that half. */
const errorSummary = (
  errors: readonly DeepReadonly<LinkedError>[],
  titleId: string,
  summaryId: string,
): TemplateResult | typeof nothing =>
  errors.length === 0
    ? nothing
    : html`<div
        role="alert"
        tabindex="-1"
        id=${summaryId}
        aria-labelledby=${titleId}
        data-error-summary
        class="sk-account-front-door-pattern__error-summary"
        ${ref((element) => {
          if (element instanceof HTMLElement) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => element.focus());
            });
          }
        })}
      >
        <ul class="sk-account-front-door-pattern__error-list">
          ${errors.map(
            (error) =>
              html`<li>
                <a class="sk-account-front-door-pattern__error-link" href="#${error.fieldId}"
                  >${error.message}</a
                >
              </li>`,
          )}
        </ul>
      </div>`;

// ── Composition renderers ───────────────────────────────────────────────────────────────────

const renderLanding = (
  fixture: DeepReadonly<LandingFixture>,
  options: RenderOptions,
): TemplateResult => html`
  ${skipLink()} ${publicHeader(fixture.chrome)}
  <main id="main" class="sk-account-front-door-pattern__main">
    <h1>${fixture.heading}</h1>
    <a
      class="sk-button sk-button--primary sk-account-front-door-pattern__cta"
      href=${fixture.ctaHref}
      >${fixture.ctaLabel}</a
    >
    ${fixture.installCommands.map(
      (command) =>
        html`<div class="sk-account-front-door-pattern__copy-host">
          <sk-copy-field
            value=${command.value}
            label=${command.label}
            success-message=${command.successMessage}
            manual-message=${command.manualMessage}
            failure-message=${command.failureMessage}
          ></sk-copy-field>
        </div>`,
    )}
    <ol class="sk-account-front-door-pattern__journey">
      ${fixture.journeySteps.map((step) => html`<li>${step.text}</li>`)}
    </ol>
  </main>
  ${compactFooter(fixture.chrome)}
`;

const renderEntryBoundaryLike = (
  fixture: DeepReadonly<EntryBoundaryFixture>,
  options: RenderOptions,
): TemplateResult => {
  const titleId = `${fixture.formId}-title`;
  const summaryId = `${fixture.formId}-error-summary`;
  const [emailField, passwordField, teamNameField, terms] = fixture.fields;
  const errorFor = (fieldId: string) => fixture.errors.find((error) => error.fieldId === fieldId);
  return html`
    ${skipLink()} ${publicHeader(fixture.chrome)}
    <main id="main">
      <div class="sk-boundary-page sk-boundary-page__stage">
        <div class="sk-boundary-page__card">
          <h1 id=${titleId} class="sk-boundary-page__title">${fixture.title}</h1>
          ${errorSummary(fixture.errors, titleId, summaryId)}
          <form
            id=${fixture.formId}
            class="sk-boundary-page__body"
            method=${fixture.method}
            action=${fixture.action}
          >
            <input
              type="hidden"
              name=${fixture.csrf.name}
              value=""
              data-server-owned="true"
            />
            ${formField(emailField, errorFor(emailField.id), fixture.retainedValues.email)}
            ${formField(passwordField, errorFor(passwordField.id), undefined)}
            ${formField(teamNameField, errorFor(teamNameField.id), undefined)}
            ${termsRow(terms)}
            ${providerRegion(fixture.providers)}
          </form>
          <div class="sk-boundary-page__action-group">
            <button type="submit" form=${fixture.formId}>${fixture.submitLabel}</button>
          </div>
        </div>
      </div>
    </main>
  `;
};

const renderRecoverySent = (fixture: DeepReadonly<RecoveryOutcomeFixture>): TemplateResult => html`
  ${skipLink()} ${publicHeader(fixture.chrome)}
  <main id="main">
    <div class="sk-boundary-page sk-boundary-page__stage">
      <div class="sk-boundary-page__card">
        <h1 class="sk-boundary-page__title">${fixture.title}</h1>
        <p class="sk-boundary-page__body">${fixture.message}</p>
        <div class="sk-boundary-page__action-group"></div>
      </div>
    </div>
  </main>
`;

const renderTerminal = (fixture: DeepReadonly<TerminalFixture>): TemplateResult => html`
  ${skipLink()} ${publicHeader(fixture.chrome)}
  <main id="main">
    <div class="sk-boundary-page sk-boundary-page__stage">
      <div class="sk-boundary-page__card" data-terminal-state>
        <h1 class="sk-boundary-page__title">${fixture.heading}</h1>
        <p class="sk-boundary-page__body">${fixture.message}</p>
        <div class="sk-boundary-page__action-group"></div>
      </div>
    </div>
  </main>
`;

const renderLegalPublished = (
  fixture: DeepReadonly<LegalPublishedFixture>,
): TemplateResult => html`
  ${skipLink()} ${publicHeader(fixture.chrome)}
  <main id="main" class="sk-account-front-door-pattern__main">
    <article class="sk-prose">
      <h1>${fixture.title}</h1>
      ${fixture.blocks.map((block) => {
        if (block.kind === "heading") return html`<h2>${block.text}</h2>`;
        if (block.kind === "paragraph") return html`<p>${block.text}</p>`;
        return html`<ul>
          ${(block.items ?? []).map((item) => html`<li>${item}</li>`)}
        </ul>`;
      })}
    </article>
  </main>
  ${compactFooter(fixture.chrome)}
`;

const renderLegalUnavailable = (
  fixture: DeepReadonly<LegalUnavailableFixture>,
): TemplateResult => html`
  ${skipLink()} ${publicHeader(fixture.chrome)}
  <main id="main">
    <div class="sk-boundary-page sk-boundary-page__stage">
      <div class="sk-boundary-page__card">
        <h1 class="sk-boundary-page__title">${fixture.title}</h1>
        <p class="sk-boundary-page__body">${fixture.message}</p>
        <div class="sk-boundary-page__action-group"></div>
      </div>
    </div>
  </main>
`;

const emailActionButton = (
  action: { readonly label: string; readonly href: string } | undefined,
  formId: string,
  className: string,
  options: RenderOptions,
): TemplateResult | typeof nothing =>
  action === undefined
    ? nothing
    : html`<button
        type="submit"
        form=${formId}
        formaction=${action.href}
        class="sk-button ${className} sk-account-front-door-pattern__email-action"
      >
        ${withLongStrings(action.label, options)}
      </button>`;

const renderEmailManagement = (
  fixture: DeepReadonly<EmailManagementFixture>,
  options: RenderOptions,
): TemplateResult => {
  const actions: DeepReadonly<EmailActionsFixture> = fixture.actions;
  return html`
    <sk-app-shell>
      <sk-page-header slot="page-header"><h1 slot="title">${fixture.shellTitle}</h1></sk-page-header>
      <main id="main" class="sk-account-front-door-pattern__main">
        <form id=${fixture.formId} method=${fixture.method} action=${fixture.action}>
          <fieldset class="sk-radio-choice-group">
            <legend class="sk-radio-choice-group__legend">Email addresses</legend>
            <div class="sk-radio-choice-group__options">
              ${fixture.emails.map((email, index) => {
                const choiceId = `${fixture.formId}-choice-${index}`;
                return html`<label class="sk-radio-choice-group__choice" for=${choiceId}>
                  <input
                    id=${choiceId}
                    class="sk-radio-choice-group__control"
                    type="radio"
                    name="primary-email"
                    value=${email.address}
                    ?checked=${email.primary}
                  />
                  <span class="sk-radio-choice-group__label">
                    ${withLongStrings(email.address, options)}
                    ${email.primary
                      ? html`<span
                          class="sk-pill-tag sk-pill-tag--status-info sk-account-front-door-pattern__radio-pill"
                          >Primary</span
                        >`
                      : nothing}
                    ${email.verified
                      ? nothing
                      : html`<span
                          class="sk-pill-tag sk-pill-tag--status-attention sk-account-front-door-pattern__radio-pill"
                          >Unverified</span
                        >`}
                  </span>
                  <span class="sk-radio-choice-group__secondary-value"
                    >${email.verified ? "Verified" : "Not verified"}</span
                  >
                </label>`;
              })}
            </div>
          </fieldset>
          <div class="sk-account-front-door-pattern__email-actions">
            ${emailActionButton(
              actions.makePrimary,
              fixture.formId,
              "sk-button--secondary",
              options,
            )}
            ${emailActionButton(
              actions.resendVerification,
              fixture.formId,
              "sk-button--secondary",
              options,
            )}
            ${emailActionButton(actions.remove, fixture.formId, "sk-button--danger-secondary", options)}
          </div>
        </form>
        ${fixture.cooldown === undefined
          ? nothing
          : html`<sk-notice
              announce="polite"
              tone="info"
              message=${withLongStrings(fixture.cooldown.message, options)}
              data-cooldown-region
            ></sk-notice>`}
      </main>
    </sk-app-shell>
  `;
};

const renderPasswordMaintenance = (
  fixture: DeepReadonly<PasswordMaintenanceFixture>,
): TemplateResult => html`
  <sk-app-shell>
    <sk-page-header slot="page-header"><h1 slot="title">${fixture.shellTitle}</h1></sk-page-header>
    <main id="main" class="sk-account-front-door-pattern__main">
      <form id=${fixture.formId} method=${fixture.method} action=${fixture.action}>
        ${fixture.currentPassword ? formField(fixture.currentPassword, undefined, undefined) : nothing}
        ${formField(fixture.newPassword, undefined, undefined)}
        ${formField(fixture.repeatPassword, undefined, undefined)}
      </form>
      <button
        type="submit"
        form=${fixture.formId}
        class="sk-button sk-button--primary sk-account-front-door-pattern__account-submit"
      >
        ${fixture.submitLabel}
      </button>
    </main>
  </sk-app-shell>
`;

/** The single composition root every story's `render:` calls. */
export const renderAccountFrontDoor = (
  state: FrontDoorState,
  options: RenderOptions = {},
): TemplateResult => {
  const fixture = fixtureForAccountFrontDoorState(state);
  let body: TemplateResult;
  switch (fixture.state) {
    case "landing":
      body = renderLanding(fixture, options);
      break;
    case "entry-boundary":
    case "entry-boundary-providers":
    case "submitted-validation":
      body = renderEntryBoundaryLike(fixture, options);
      break;
    case "recovery-sent":
      body = renderRecoverySent(fixture);
      break;
    case "terminal-inactive":
    case "terminal-signup-closed":
      body = renderTerminal(fixture);
      break;
    case "legal-published":
      body = renderLegalPublished(fixture);
      break;
    case "legal-unavailable":
      body = renderLegalUnavailable(fixture);
      break;
    case "email-management":
    case "email-management-cooldown":
      body = renderEmailManagement(fixture, options);
      break;
    case "password-change":
    case "password-set":
      body = renderPasswordMaintenance(fixture);
      break;
  }
  const classes = [
    "sk-account-front-door-pattern",
    options.light ? "sk-light" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return html`<div
    class=${classes}
    dir=${options.rtl ? "rtl" : nothing}
    data-account-front-door-pattern
    data-front-door-state=${state}
    data-render-complete="true"
  >
    ${patternStyles} ${body}
  </div>`;
};

// ── Storybook registration ──────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Patterns/Account Front Door",
  tags: ["autodocs"],
  parameters: {
    a11y: { disable: false },
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A Storybook-only proof of six approved Family 6 account/public-front-door compositions, " +
          "assembled from published surfaces, native semantics, immutable frozen fixtures and pure " +
          "display projections. No auth, account, front-door, legal-page, recovery, MFA/code-input, " +
          "email-row, social-provider, error-summary or password-maintenance element is published.",
      },
    },
  },
  beforeEach: isolateThemeStory,
  excludeStories: [
    "ACCOUNT_FRONT_DOOR_FIXTURES",
    "ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT",
    "deepFreezeAccountFrontDoorFixture",
    "fixtureForAccountFrontDoorState",
    "projectAccountFrontDoor",
    "renderAccountFrontDoor",
  ],
};

export default meta;
type Story = StoryObj;

export const Landing: Story = {
  render: () => renderAccountFrontDoor("landing"),
};

export const EntryBoundary: Story = {
  render: () => renderAccountFrontDoor("entry-boundary"),
};

export const SubmittedValidation: Story = {
  render: () => renderAccountFrontDoor("submitted-validation"),
};

export const RecoverySent: Story = {
  render: () => renderAccountFrontDoor("recovery-sent"),
};

export const TerminalInactive: Story = {
  render: () => renderAccountFrontDoor("terminal-inactive"),
};

export const LegalPublished: Story = {
  render: () => renderAccountFrontDoor("legal-published"),
};

export const LegalUnavailable: Story = {
  render: () => renderAccountFrontDoor("legal-unavailable"),
};

export const EmailManagement: Story = {
  render: () => renderAccountFrontDoor("email-management"),
};

export const PasswordChange: Story = {
  render: () => renderAccountFrontDoor("password-change"),
};

export const PasswordSet: Story = {
  render: () => renderAccountFrontDoor("password-set"),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => renderAccountFrontDoor("submitted-validation", { light: true }),
};

export const LegalLightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => renderAccountFrontDoor("legal-published", { light: true }),
};

export const AccountLightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => renderAccountFrontDoor("email-management", { light: true }),
};

export const ForcedColors: Story = {
  render: () => renderAccountFrontDoor("submitted-validation"),
};

export const ReducedMotion: Story = {
  render: () => renderAccountFrontDoor("entry-boundary"),
};

export const Rtl: Story = {
  render: () => renderAccountFrontDoor("email-management", { rtl: true }),
};

export const Narrow390: Story = {
  render: () => renderAccountFrontDoor("landing"),
};

export const ShortViewport: Story = {
  render: () => renderAccountFrontDoor("entry-boundary"),
};

export const Zoom200: Story = {
  render: () => renderAccountFrontDoor("landing"),
};

export const LongStrings: Story = {
  render: () => renderAccountFrontDoor("email-management-cooldown", { longStrings: true }),
};
