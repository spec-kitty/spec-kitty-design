/**
 * Frozen fixtures and a pure projection for the Account Front Door pattern (#355, epic #352).
 *
 * No `lit`, no DOM import — this module is pure data plus pure functions. Every truth constraint
 * FR-006/FR-007/FR-009/FR-014/FR-016/FR-018/FR-020/FR-022/C-011/C-014 name is made
 * UNREPRESENTABLE here, not merely untested: `RecoveryOutcomeFixture` has no `exists`/`found`/
 * `known` field, `LegalUnavailableFixture` has no `reason` field, `SignupFormFixture['fields']`
 * is a fixed four-tuple with no `passwordRequirements`/`helpText` member, `EmailRecord` carries
 * only `{ address, primary, verified }`, and no fixture type anywhere in this module accepts a
 * token, session, CSRF value, clock or locale.
 *
 * Two-file split follows `repository-dossier.*`, the closest landed analog (plan.md "Structure
 * Decision"): this module carries the types, the recursive freeze helper, the frozen fixture map,
 * the pure projection and a `switch` accessor; `account-front-door.stories.ts` carries the inline
 * `<style>`, the `lit-html` render helpers and the story objects.
 */

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : // Fixed-length TUPLES (SignupFields' four-tuple) must stay tuples through this mapping —
    // matched BEFORE the general array arm, or `infer Item` widens every element to their union
    // and destructuring `fixture.fields` loses its per-position typing entirely (measured: a
    // `tsc` failure at every `formField(...)` call site once this arm was missing).
    //
    // THE EMPTY-TUPLE BASE CASE IS ITS OWN ARM, matched BEFORE the recursive one. Without it the
    // recursion's final step is `DeepReadonly<[]>`, which the general array arm below resolves to
    // `readonly never[]` (an empty array has no element to infer `Item` from) — and `readonly
    // [T4, ...never[]]` is a REST-TAILED type `tsc` treats as "four or more elements", not
    // "exactly four", so the whole map literal fails its `satisfies Record<FrontDoorState,
    // FrontDoorFixture>` check with "Target allows only 4 element(s) but source may have more"
    // (measured directly — this was the actual failure before this arm was added).
    T extends readonly []
    ? readonly []
    : T extends readonly [infer Head, ...infer Tail]
      ? readonly [DeepReadonly<Head>, ...DeepReadonly<Tail>]
      : T extends readonly (infer Item)[]
        ? readonly DeepReadonly<Item>[]
        : T extends object
          ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
          : T;

/**
 * Thirteen named states: ten published directly as one or more stories, plus three fixture-only
 * arms proven only in the behaviour suite (`entry-boundary-providers`, `terminal-signup-closed`,
 * per decisions R-2/R-1) — `email-management-cooldown` is also fixture-only in the sense that it
 * carries no story of its own, but is published through the `LongStrings` story (plan.md §1.5
 * row 20, "folding the cooldown proof into the long-strings proof").
 */
export type FrontDoorState =
  | "landing"
  | "entry-boundary"
  | "entry-boundary-providers"
  | "submitted-validation"
  | "recovery-sent"
  | "terminal-inactive"
  | "terminal-signup-closed"
  | "legal-published"
  | "legal-unavailable"
  | "email-management"
  | "email-management-cooldown"
  | "password-change"
  | "password-set";

// ── Shared records ──────────────────────────────────────────────────────────────────────────

export interface RouteAction {
  readonly kind: "sign-in" | "start-free";
  readonly label: string;
  readonly href: string;
}

/** Every public (signed-out) composition declares its own route-aware chrome facts. */
export interface PublicChrome {
  readonly brand: Readonly<{ label: string; href: string; context: string | undefined }>;
  readonly actions: readonly RouteAction[];
  readonly theme: Readonly<{
    label: string;
    systemLabel: string;
    lightLabel: string;
    darkLabel: string;
  }>;
  readonly footer: Readonly<{
    tagline: string;
    legal: string;
    links: readonly Readonly<{ label: string; href: string }>[];
  }>;
}

export interface FormFieldFixture {
  readonly id: string;
  readonly label: string;
  readonly type: "email" | "password" | "text";
  readonly autocomplete: string;
  readonly required: boolean;
  readonly description: string;
}

export interface TermsFieldFixture {
  readonly id: string;
  readonly label: string;
}

/** Fixed four-tuple: email, password, team name, Terms. No fifth member is representable. */
export type SignupFields = readonly [
  FormFieldFixture,
  FormFieldFixture,
  FormFieldFixture,
  TermsFieldFixture,
];

export interface ProviderFixture {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export interface CsrfFixture {
  readonly name: string;
}

export interface LinkedError {
  readonly fieldId: string;
  readonly message: string;
}

export interface EntryBoundaryFixture {
  readonly state: "entry-boundary" | "entry-boundary-providers" | "submitted-validation";
  readonly chrome: PublicChrome;
  readonly title: string;
  readonly formId: string;
  readonly method: "post";
  readonly action: string;
  readonly csrf: CsrfFixture;
  readonly fields: SignupFields;
  readonly providers: readonly ProviderFixture[];
  readonly submitLabel: string;
  /** No `exists`/`found`/`known` field anywhere in this module — see `RecoveryOutcomeFixture`. */
  readonly errors: readonly LinkedError[];
  readonly retainedValues: Readonly<{ email: string | undefined }>;
}

/**
 * The account-existence truth constraint (FR-014) is enforced by ABSENCE: this type has no
 * `exists`, `found`, or `known` field, and `projectAccountFrontDoor` below has no branch that
 * could read one even if a caller invented one at the call site.
 */
export interface RecoveryOutcomeFixture {
  readonly state: "recovery-sent";
  readonly chrome: PublicChrome;
  readonly title: string;
  readonly message: string;
}

export interface TerminalFixture {
  readonly state: "terminal-inactive" | "terminal-signup-closed";
  readonly chrome: PublicChrome;
  readonly heading: string;
  readonly message: string;
}

export interface LegalBlock {
  readonly kind: "heading" | "paragraph" | "list";
  readonly text: string | undefined;
  readonly items: readonly string[] | undefined;
}

export interface LegalPublishedFixture {
  readonly state: "legal-published";
  readonly chrome: PublicChrome;
  readonly title: string;
  readonly blocks: readonly LegalBlock[];
}

/** No `reason` field — see FR-018/SC-008: no absent/draft/restricted/wrong-locale distinction. */
export interface LegalUnavailableFixture {
  readonly state: "legal-unavailable";
  readonly chrome: PublicChrome;
  readonly title: string;
  readonly message: string;
}

/** Exactly `{ address, primary, verified }` — no other field, per FR-020/plan.md §1.3. */
export interface EmailRecord {
  readonly address: string;
  readonly primary: boolean;
  readonly verified: boolean;
}

export interface EmailActionFact {
  readonly label: string;
  readonly href: string;
}

/** The three actions act on whichever address is selected (plan.md D-2 rationale). */
export interface EmailActionsFixture {
  readonly makePrimary: EmailActionFact | undefined;
  readonly resendVerification: EmailActionFact | undefined;
  readonly remove: EmailActionFact | undefined;
}

export interface EmailManagementFixture {
  readonly state: "email-management" | "email-management-cooldown";
  readonly shellTitle: string;
  readonly formId: string;
  readonly method: "post";
  readonly action: string;
  readonly emails: readonly EmailRecord[];
  readonly actions: EmailActionsFixture;
  readonly cooldown: Readonly<{ message: string }> | undefined;
}

export interface PasswordMaintenanceFixture {
  readonly state: "password-change" | "password-set";
  readonly shellTitle: string;
  readonly formId: string;
  readonly method: "post";
  readonly action: string;
  readonly currentPassword: FormFieldFixture | undefined;
  readonly newPassword: FormFieldFixture;
  readonly repeatPassword: FormFieldFixture;
  readonly helpText: string;
  readonly submitLabel: string;
}

export interface InstallCommandFixture {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly successMessage: string;
  readonly manualMessage: string;
  readonly failureMessage: string;
}

export interface JourneyStepFixture {
  readonly text: string;
}

export interface LandingFixture {
  readonly state: "landing";
  readonly chrome: PublicChrome;
  readonly heading: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
  readonly installCommands: readonly InstallCommandFixture[];
  readonly journeySteps: readonly JourneyStepFixture[];
}

export type FrontDoorFixture =
  | LandingFixture
  | EntryBoundaryFixture
  | RecoveryOutcomeFixture
  | TerminalFixture
  | LegalPublishedFixture
  | LegalUnavailableFixture
  | EmailManagementFixture
  | PasswordMaintenanceFixture;

export interface FrontDoorProjection {
  readonly fixture: DeepReadonly<FrontDoorFixture>;
  readonly hasProviders: boolean;
  readonly hasErrors: boolean;
  readonly hasCooldown: boolean;
  readonly hasCurrentPassword: boolean;
}

/** Recursively freezes every object and array reachable from an authored fixture. */
export const deepFreezeAccountFrontDoorFixture = <T>(value: T): DeepReadonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreezeAccountFrontDoorFixture(child);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

// ── Small shared constants — every repeated display fact written once ──────────────────────────

const BRAND = { label: "Spec Kitty", href: "/", context: "Cloud" } as const;

const THEME_LABELS = {
  label: "Appearance",
  systemLabel: "System",
  lightLabel: "Light",
  darkLabel: "Dark",
} as const;

const SIGN_IN: RouteAction = { kind: "sign-in", label: "Sign in", href: "/accounts/login/" };
const START_FREE: RouteAction = { kind: "start-free", label: "Start free", href: "/accounts/signup/" };

const FOOTER_TAGLINE = "Ship product decisions your whole team can see.";
const FOOTER_LEGAL = "© 2026 Spec Kitty. All rights reserved.";
const FOOTER_LINKS = [{ label: "Terms", href: "/legal/terms/" }] as const;

const chromeWith = (actions: readonly RouteAction[]): PublicChrome => ({
  brand: BRAND,
  actions,
  theme: THEME_LABELS,
  footer: { tagline: FOOTER_TAGLINE, legal: FOOTER_LEGAL, links: FOOTER_LINKS },
});

/** Two route-aware chrome classes: open signup (both actions) and closed signup (sign-in only). */
const OPEN_CHROME = chromeWith([SIGN_IN, START_FREE]);
const CLOSED_CHROME = chromeWith([SIGN_IN]);

const EMAIL_FIELD: FormFieldFixture = {
  id: "front-door-email",
  label: "Email",
  type: "email",
  autocomplete: "email",
  required: true,
  description: "Use the address your team already knows you by.",
};

const PASSWORD_FIELD: FormFieldFixture = {
  id: "front-door-password",
  label: "Password",
  type: "password",
  autocomplete: "new-password",
  required: true,
  description: "At least 12 characters.",
};

const TEAM_NAME_FIELD: FormFieldFixture = {
  id: "front-door-team-name",
  label: "Team name (optional)",
  type: "text",
  autocomplete: "organization",
  required: false,
  description: "You can rename this later.",
};

const TERMS_FIELD: TermsFieldFixture = {
  id: "front-door-terms",
  label: "I agree to the Terms",
};

const ENTRY_FIELDS: SignupFields = [EMAIL_FIELD, PASSWORD_FIELD, TEAM_NAME_FIELD, TERMS_FIELD];

const CSRF: CsrfFixture = { name: "csrfmiddlewaretoken" };

const PROVIDERS: readonly ProviderFixture[] = [
  { id: "github", label: "Continue with GitHub", href: "/accounts/github/login/" },
  { id: "google", label: "Continue with Google", href: "/accounts/google/login/" },
];

const INSTALL_COMMANDS: readonly InstallCommandFixture[] = [
  {
    id: "install-cli",
    label: "Copy install command",
    value: "curl -fsSL https://get.spec-kitty.dev | sh",
    successMessage: "Command copied.",
    manualMessage: "Command selected. Use your system copy shortcut to copy it.",
    failureMessage: "Unable to copy or select the command.",
  },
  {
    id: "install-init",
    label: "Copy init command",
    value: "spec-kitty init",
    successMessage: "Command copied.",
    manualMessage: "Command selected. Use your system copy shortcut to copy it.",
    failureMessage: "Unable to copy or select the command.",
  },
];

const JOURNEY_STEPS: readonly JourneyStepFixture[] = [
  { text: "Install the CLI on your own machine." },
  { text: "Run spec-kitty init inside a repository you already have." },
  { text: "Open the dashboard link the CLI prints to see your first Mission." },
];

const RESEND_VERIFICATION: EmailActionFact = {
  label: "Re-send Verification",
  href: "/accounts/email/resend/",
};
const REMOVE_EMAIL: EmailActionFact = { label: "Remove", href: "/accounts/email/remove/" };
const MAKE_PRIMARY: EmailActionFact = { label: "Make primary", href: "/accounts/email/primary/" };

const NEW_PASSWORD_FIELD: FormFieldFixture = {
  id: "front-door-new-password",
  label: "New password",
  type: "password",
  autocomplete: "new-password",
  required: true,
  description: "At least 12 characters, and not one you've used before.",
};

const REPEAT_PASSWORD_FIELD: FormFieldFixture = {
  id: "front-door-repeat-password",
  label: "Confirm new password",
  type: "password",
  autocomplete: "new-password",
  required: true,
  description: "Re-enter the password above exactly.",
};

const CURRENT_PASSWORD_FIELD: FormFieldFixture = {
  id: "front-door-current-password",
  label: "Current password",
  type: "password",
  autocomplete: "current-password",
  required: true,
  description: "Confirm it's you before setting a new one.",
};

// ── The sole authored source for every repeated Account Front Door display fact ────────────────

// `satisfies` PER ENTRY, against each state's own CONCRETE interface — not one `satisfies`
// covering the whole map against the `FrontDoorFixture` UNION. Checking a tuple-carrying literal
// (`fields: SignupFields`) against a UNION target made `tsc` synthesize a widened
// `[...4 members, ...never[]]` shape and reject it as "may have more" than four elements — a
// known union-context tuple-inference pitfall, measured directly, not assumed. Checking each
// entry against its own named interface removes the union from the equation entirely.
const ACCOUNT_FRONT_DOOR_FIXTURES_AUTHORED = {
  landing: {
    state: "landing",
    chrome: OPEN_CHROME,
    heading: "Ship decisions your whole team can see",
    ctaLabel: "Start free",
    ctaHref: START_FREE.href,
    installCommands: INSTALL_COMMANDS,
    journeySteps: JOURNEY_STEPS,
  } satisfies LandingFixture,

  "entry-boundary": {
    state: "entry-boundary",
    chrome: CLOSED_CHROME,
    title: "Create your account",
    formId: "account-front-door-entry-form",
    method: "post",
    action: "/accounts/signup/",
    csrf: CSRF,
    fields: ENTRY_FIELDS,
    providers: [],
    submitLabel: "Create account",
    errors: [],
    retainedValues: { email: undefined },
  } satisfies EntryBoundaryFixture,

  "entry-boundary-providers": {
    state: "entry-boundary-providers",
    chrome: CLOSED_CHROME,
    title: "Create your account",
    formId: "account-front-door-entry-providers-form",
    method: "post",
    action: "/accounts/signup/",
    csrf: CSRF,
    fields: ENTRY_FIELDS,
    providers: PROVIDERS,
    submitLabel: "Create account",
    errors: [],
    retainedValues: { email: undefined },
  } satisfies EntryBoundaryFixture,

  "submitted-validation": {
    state: "submitted-validation",
    chrome: CLOSED_CHROME,
    title: "Create your account",
    formId: "account-front-door-validation-form",
    method: "post",
    action: "/accounts/signup/",
    csrf: CSRF,
    fields: ENTRY_FIELDS,
    providers: [],
    submitLabel: "Create account",
    errors: [
      { fieldId: EMAIL_FIELD.id, message: "That didn't work. Check your details and try again." },
      { fieldId: PASSWORD_FIELD.id, message: "That didn't work. Check your details and try again." },
    ],
    retainedValues: { email: "ada@example.com" },
  } satisfies EntryBoundaryFixture,

  "recovery-sent": {
    state: "recovery-sent",
    chrome: CLOSED_CHROME,
    title: "Check your email",
    message:
      "If an account matches what you entered, we've sent a link to continue. It expires in one hour.",
  } satisfies RecoveryOutcomeFixture,

  "terminal-inactive": {
    state: "terminal-inactive",
    chrome: OPEN_CHROME,
    heading: "This link has expired",
    message: "Ask whoever shared it with you to send a new one.",
  } satisfies TerminalFixture,

  "terminal-signup-closed": {
    state: "terminal-signup-closed",
    chrome: CLOSED_CHROME,
    heading: "Signups are currently closed",
    message: "Check back later, or sign in if you already have an account.",
  } satisfies TerminalFixture,

  "legal-published": {
    state: "legal-published",
    chrome: CLOSED_CHROME,
    title: "Terms of Service",
    blocks: [
      { kind: "heading", text: "1. Using Spec Kitty", items: undefined },
      {
        kind: "paragraph",
        text: "These terms cover your use of Spec Kitty. By creating an account you agree to them.",
        items: undefined,
      },
      { kind: "heading", text: "2. Your responsibilities", items: undefined },
      {
        kind: "list",
        text: undefined,
        items: [
          "Keep your credentials confidential.",
          "Use the service only for lawful purposes.",
          "Tell us promptly about any suspected unauthorized use.",
        ],
      },
    ],
  } satisfies LegalPublishedFixture,

  "legal-unavailable": {
    state: "legal-unavailable",
    chrome: CLOSED_CHROME,
    title: "This document isn't available",
    message: "We couldn't show this page. Try again later.",
  } satisfies LegalUnavailableFixture,

  "email-management": {
    state: "email-management",
    shellTitle: "Email addresses",
    formId: "account-front-door-email-form",
    method: "post",
    action: "/account/email/",
    emails: [
      { address: "ada@example.com", primary: true, verified: true },
      { address: "ada+team@example.com", primary: false, verified: false },
    ],
    actions: {
      makePrimary: MAKE_PRIMARY,
      resendVerification: RESEND_VERIFICATION,
      remove: REMOVE_EMAIL,
    },
    cooldown: undefined,
  } satisfies EmailManagementFixture,

  "email-management-cooldown": {
    state: "email-management-cooldown",
    shellTitle: "Email addresses",
    formId: "account-front-door-email-cooldown-form",
    method: "post",
    action: "/account/email/",
    emails: [
      { address: "ada@example.com", primary: true, verified: true },
      { address: "ada+team@example.com", primary: false, verified: false },
    ],
    actions: {
      makePrimary: MAKE_PRIMARY,
      resendVerification: RESEND_VERIFICATION,
      remove: REMOVE_EMAIL,
    },
    cooldown: { message: "A verification email was just sent. You can send another in 58 seconds." },
  } satisfies EmailManagementFixture,

  "password-change": {
    state: "password-change",
    shellTitle: "Change password",
    formId: "account-front-door-password-change-form",
    method: "post",
    action: "/account/password/change/",
    currentPassword: CURRENT_PASSWORD_FIELD,
    newPassword: NEW_PASSWORD_FIELD,
    repeatPassword: REPEAT_PASSWORD_FIELD,
    helpText: "Your password must be at least 12 characters and can't be entirely numeric.",
    submitLabel: "Change password",
  } satisfies PasswordMaintenanceFixture,

  "password-set": {
    state: "password-set",
    shellTitle: "Set a password",
    formId: "account-front-door-password-set-form",
    method: "post",
    action: "/account/password/set/",
    currentPassword: undefined,
    newPassword: NEW_PASSWORD_FIELD,
    repeatPassword: REPEAT_PASSWORD_FIELD,
    helpText: "Your password must be at least 12 characters and can't be entirely numeric.",
    submitLabel: "Set password",
  } satisfies PasswordMaintenanceFixture,
} satisfies Record<FrontDoorState, unknown>;

export const ACCOUNT_FRONT_DOOR_FIXTURES: Record<FrontDoorState, FrontDoorFixture> =
  deepFreezeAccountFrontDoorFixture(ACCOUNT_FRONT_DOOR_FIXTURES_AUTHORED);

/**
 * Presence/ordering decisions only — no routing, session, network, inference, arithmetic or time
 * (C-014, FR-024). Every flag reads a fixture field that is either present or absent; nothing is
 * computed from it.
 */
export const projectAccountFrontDoor = (
  fixture: DeepReadonly<FrontDoorFixture>,
): DeepReadonly<FrontDoorProjection> =>
  Object.freeze({
    fixture,
    hasProviders: "providers" in fixture && fixture.providers.length > 0,
    hasErrors: "errors" in fixture && fixture.errors.length > 0,
    hasCooldown: "cooldown" in fixture && fixture.cooldown !== undefined,
    hasCurrentPassword: "currentPassword" in fixture && fixture.currentPassword !== undefined,
  });

export const fixtureForAccountFrontDoorState = (
  state: FrontDoorState,
): DeepReadonly<FrontDoorFixture> => {
  switch (state) {
    case "landing":
      return ACCOUNT_FRONT_DOOR_FIXTURES.landing as DeepReadonly<FrontDoorFixture>;
    case "entry-boundary":
      return ACCOUNT_FRONT_DOOR_FIXTURES["entry-boundary"] as DeepReadonly<FrontDoorFixture>;
    case "entry-boundary-providers":
      return ACCOUNT_FRONT_DOOR_FIXTURES[
        "entry-boundary-providers"
      ] as DeepReadonly<FrontDoorFixture>;
    case "submitted-validation":
      return ACCOUNT_FRONT_DOOR_FIXTURES["submitted-validation"] as DeepReadonly<FrontDoorFixture>;
    case "recovery-sent":
      return ACCOUNT_FRONT_DOOR_FIXTURES["recovery-sent"] as DeepReadonly<FrontDoorFixture>;
    case "terminal-inactive":
      return ACCOUNT_FRONT_DOOR_FIXTURES["terminal-inactive"] as DeepReadonly<FrontDoorFixture>;
    case "terminal-signup-closed":
      return ACCOUNT_FRONT_DOOR_FIXTURES[
        "terminal-signup-closed"
      ] as DeepReadonly<FrontDoorFixture>;
    case "legal-published":
      return ACCOUNT_FRONT_DOOR_FIXTURES["legal-published"] as DeepReadonly<FrontDoorFixture>;
    case "legal-unavailable":
      return ACCOUNT_FRONT_DOOR_FIXTURES["legal-unavailable"] as DeepReadonly<FrontDoorFixture>;
    case "email-management":
      return ACCOUNT_FRONT_DOOR_FIXTURES["email-management"] as DeepReadonly<FrontDoorFixture>;
    case "email-management-cooldown":
      return ACCOUNT_FRONT_DOOR_FIXTURES[
        "email-management-cooldown"
      ] as DeepReadonly<FrontDoorFixture>;
    case "password-change":
      return ACCOUNT_FRONT_DOOR_FIXTURES["password-change"] as DeepReadonly<FrontDoorFixture>;
    case "password-set":
      return ACCOUNT_FRONT_DOOR_FIXTURES["password-set"] as DeepReadonly<FrontDoorFixture>;
  }
};

// ── Pattern-local inline style text — tokens only (C-008, NFR-007) ─────────────────────────────
//
// Lives HERE (pure data, no `lit` import) rather than in the stories module, so the behaviour
// suite can import it without pulling that file's full custom-element/`@storybook/web-components`
// import graph into the same `tsc` program as every other behaviour test file (measured
// consequence when it lived there: an unrelated `sk-form-input.test.ts` type error). The stories
// module re-exports this constant and ALSO carries a literal, independently-written copy of the
// same rules inside its own `<style>` tag — see that file's comment for why the tag cannot simply
// interpolate this constant.
//
// Exported as a plain string so the behaviour lane can assert over it directly (NFR-007's
// resolution: `check-pattern-composition.mjs` states in its own header that SK-D01 inside an
// inline <style> in a .ts is out of its scope, and this module closes that gap without touching
// scripts/). Every floor pinned here exists ONLY where a composed slot supplies none — see the
// "Where the floor already exists" table in plan.md §1.6. `.sk-button` itself is never restyled
// (C-005); every rule below names a pattern-owned class.
export const ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT = `
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
`;

