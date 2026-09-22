/**
 * Immutable per-story fixtures for the CLI Auth pattern family (spec-kitty/spec-kitty-design#329).
 *
 * FOUR STORIES, ONE FIXTURE-TRUTH SOURCE (data-model.md). Every user-visible string in every
 * story traces to exactly one field here — never a component default, never synthesized by a
 * projection. Follows `repository-dossier.fixture.ts`'s precedent: authored data, deep-frozen
 * once, exported for both the story module and the test module to import with no circular
 * dependency between them.
 *
 * This mission introduces no runtime or persisted application data model (data-model.md's own
 * opening line). Nothing here performs I/O, routing, or inference — it is authored evidence.
 */

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

/** Story 1 — code entry. The invalid branch renders only when `errorMessage` is supplied
 *  (data-model.md validity rule 2); this mission does not derive an error, it is fixture data. */
export interface CodeEntryFixture {
  readonly label: string;
  readonly description: string;
  readonly submitLabel: string;
  readonly errorMessage: string | undefined;
}

/** One fact row for Story 2's `.sk-facts` composition — term/value only, in fixture order. */
export interface AuthorizationFact {
  readonly term: string;
  readonly value: string;
}

/** Story 2 — review and decide. No permission or scope-evaluation logic; scopes are opaque
 *  consumer-supplied labels rendered in order through `sk-pill-tag` (data-model.md rule 3). */
export interface AuthorizationFixture {
  readonly facts: readonly AuthorizationFact[];
  readonly scopes: readonly string[];
  readonly approveLabel: string;
  readonly denyLabel: string;
}

/** A single supplied real-route action (label + href). Terminal fixtures carry zero or exactly
 *  one — never synthesized (data-model.md rule 5; C-005). */
export interface TerminalAction {
  readonly label: string;
  readonly href: string;
}

/** Story 3 — terminal success/denial. `success` and `denied` share one `sk-boundary-page`
 *  anatomy; only the supplied heading/body differs (data-model.md rule 6). No status-inference
 *  logic: `outcome` is authored, not derived. */
export interface TerminalOutcomeFixture {
  readonly outcome: "success" | "denied";
  readonly heading: string;
  readonly body: string;
  readonly action: TerminalAction | undefined;
}

/** Story 4 — terminal error. No retry/back/recovery control is ever synthesized; `action`, when
 *  present, must be a real supplied route. */
export interface TerminalErrorFixture {
  readonly heading: string;
  readonly body: string;
  readonly action: TerminalAction | undefined;
}

/** Recursively freezes every object and array reachable from an authored fixture — the same
 *  helper shape `repository-dossier.fixture.ts` and `mission-reading.stories.ts` both use. */
export const deepFreezeCliAuthFixture = <T>(value: T): DeepReadonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreezeCliAuthFixture(child);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

const CODE_ENTRY_DEFAULT: CodeEntryFixture = {
  label: "Device code",
  description: "Enter the 8-character code shown on your other device.",
  submitLabel: "Continue",
  errorMessage: undefined,
};

const CODE_ENTRY_INVALID: CodeEntryFixture = {
  label: "Device code",
  description: "Enter the 8-character code shown on your other device.",
  submitLabel: "Continue",
  errorMessage:
    "That code has expired. Request a new one from your other device.",
};

const AUTHORIZATION_DECISION: AuthorizationFixture = {
  facts: [
    { term: "Client", value: "Kitty CLI" },
    { term: "Account", value: "ada@team-kitty.example" },
    { term: "Redirect target", value: "https://cli.team-kitty.example/callback" },
  ],
  scopes: ["Read repositories", "Read Missions", "Open pull requests"],
  approveLabel: "Approve",
  denyLabel: "Deny",
};

const TERMINAL_SUCCESS: TerminalOutcomeFixture = {
  outcome: "success",
  heading: "Device connected",
  body: "Kitty CLI is now authorized on this account. Close this window and return to your terminal.",
  action: undefined,
};

const TERMINAL_DENIED: TerminalOutcomeFixture = {
  outcome: "denied",
  heading: "Authorization denied",
  body: "You denied Kitty CLI access to this account. No permissions were granted, and your terminal session was not connected.",
  action: undefined,
};

const TERMINAL_ERROR_NO_ACTION: TerminalErrorFixture = {
  heading: "This code has expired",
  body: "The device code you approved is no longer valid. Start a new sign-in from your terminal to get a fresh code.",
  action: undefined,
};

const TERMINAL_ERROR_WITH_ACTION: TerminalErrorFixture = {
  heading: "Your account needs verification first",
  body: "Team Kitty could not finish device authorization until your account email is verified.",
  action: {
    label: "Verify your account",
    href: "https://team-kitty.example/account/verify",
  },
};

/** The sole authored source for every repeated CLI Auth display fact. */
export const CLI_AUTH_FIXTURES = deepFreezeCliAuthFixture({
  codeEntryDefault: CODE_ENTRY_DEFAULT,
  codeEntryInvalid: CODE_ENTRY_INVALID,
  authorizationDecision: AUTHORIZATION_DECISION,
  terminalSuccess: TERMINAL_SUCCESS,
  terminalDenied: TERMINAL_DENIED,
  terminalErrorNoAction: TERMINAL_ERROR_NO_ACTION,
  terminalErrorWithAction: TERMINAL_ERROR_WITH_ACTION,
});

/** 0 or 1 — the action-count invariant every terminal fixture must satisfy (data-model.md rule
 *  5). A terminal projection never renders zero-or-more-than-one action; this is the pure check
 *  the T002/T005 unit assertion runs directly against fixture data, independent of whether the
 *  `sk-boundary-page` frame (#303) exists yet to render it. */
export const terminalActionCount = (
  fixture:
    | DeepReadonly<TerminalOutcomeFixture>
    | DeepReadonly<TerminalErrorFixture>,
): 0 | 1 => (fixture.action ? 1 : 0);
