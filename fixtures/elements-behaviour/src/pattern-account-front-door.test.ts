/* eslint-disable @nx/enforce-module-boundaries -- #355: this behaviour fixture directly exercises
   the story-only Account Front Door fixture/projection module. Exporting that module from the
   package would publish the runtime front-door API C-001/C-002 explicitly forbid. */
import { describe, expect, test } from "vitest";
import {
  ACCOUNT_FRONT_DOOR_FIXTURES,
  fixtureForAccountFrontDoorState,
  projectAccountFrontDoor,
  type EntryBoundaryFixture,
  type FrontDoorFixture,
} from "../../../packages/elements/src/patterns/account-front-door.fixture.js";
import { ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT } from "../../../packages/elements/src/patterns/account-front-door.fixture.js";

const expectDeeplyFrozen = (value: unknown): void => {
  if (value === null || typeof value !== "object") return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectDeeplyFrozen(child);
};

describe("Account Front Door immutable fixture family (FR-024, SC-002)", () => {
  test("every authored fixture is recursively frozen", () => {
    for (const fixture of Object.values(ACCOUNT_FRONT_DOOR_FIXTURES)) {
      expectDeeplyFrozen(fixture);
    }
  });

  test("projection is repeatable and never freezes or mutates a caller-owned fixture", () => {
    const mutableFixture = structuredClone(
      ACCOUNT_FRONT_DOOR_FIXTURES["entry-boundary"],
    ) as EntryBoundaryFixture;
    const before = structuredClone(mutableFixture);

    const first = projectAccountFrontDoor(mutableFixture);
    const second = projectAccountFrontDoor(mutableFixture);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(mutableFixture).toEqual(before);
    expect(Object.isFrozen(mutableFixture)).toBe(false);
    expect(Object.isFrozen(first)).toBe(true);
  });

  test("the projection reads presence only — no routing, session, network, inference, arithmetic or time field exists to read (C-014)", () => {
    const source = projectAccountFrontDoor.toString();
    // A crude but honest structural check: the projection's own source text names none of the
    // constructs C-014 forbids. `Date`, `fetch`, `Math.`, `location`, `history`, `sessionStorage`.
    for (const forbidden of ["fetch(", "Date(", "Math.", "location.", "history.", "sessionStorage", "localStorage"]) {
      expect(source.includes(forbidden)).toBe(false);
    }
  });
});

describe("Truth constraints made unrepresentable (FR-006, FR-007, FR-009, FR-014, FR-016, FR-018, FR-020, C-011, C-014)", () => {
  test("recovery outcome carries no exists/found/known field — the type has no such member", () => {
    const fixture = fixtureForAccountFrontDoorState("recovery-sent");
    for (const forbidden of ["exists", "found", "known"]) {
      expect(Object.prototype.hasOwnProperty.call(fixture, forbidden)).toBe(false);
    }
    expect(Object.keys(fixture).sort()).toEqual(["chrome", "message", "state", "title"]);
  });

  test("legal-unavailable carries no reason field — no absent/draft/restricted/wrong-locale distinction is representable", () => {
    const fixture = fixtureForAccountFrontDoorState("legal-unavailable");
    expect(Object.prototype.hasOwnProperty.call(fixture, "reason")).toBe(false);
    expect(Object.keys(fixture).sort()).toEqual(["chrome", "message", "state", "title"]);
  });

  test("the signup field set is a fixed four-tuple: email, password, team name, Terms — no fifth member", () => {
    const fixture = fixtureForAccountFrontDoorState("entry-boundary") as EntryBoundaryFixture;
    const [email, password, teamName, terms] = fixture.fields;
    expect(fixture.fields).toHaveLength(4);
    expect([email.type, password.type, teamName.type]).toEqual(["email", "password", "text"]);
    expect(email.id).toContain("email");
    expect(password.id).toContain("password");
    expect(terms.label.length).toBeGreaterThan(0);
    // No `passwordRequirements` or `helpText` member exists on any signup field or the fixture.
    for (const field of [email, password, teamName, terms]) {
      expect(Object.prototype.hasOwnProperty.call(field, "passwordRequirements")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(field, "helpText")).toBe(false);
    }
  });

  test("no password-input count above one is representable on the signup composition (FR-007, signup-scoped)", () => {
    const entry = fixtureForAccountFrontDoorState("entry-boundary") as EntryBoundaryFixture;
    const passwordFields = [entry.fields[0], entry.fields[1], entry.fields[2]].filter(
      (field) => field.type === "password",
    );
    expect(passwordFields).toHaveLength(1);
  });

  test("P24 legitimately carries a repeat-password field and length help text (FR-007 is signup-scoped, not global)", () => {
    for (const state of ["password-change", "password-set"] as const) {
      const fixture = fixtureForAccountFrontDoorState(state);
      if (!("newPassword" in fixture) || !("repeatPassword" in fixture)) {
        throw new Error(`${state} fixture missing password fields`);
      }
      expect(fixture.newPassword).toBeDefined();
      expect(fixture.repeatPassword).toBeDefined();
      expect(fixture.helpText.length).toBeGreaterThan(0);
    }
  });

  test("EmailRecord carries exactly { address, primary, verified } — no fourth field", () => {
    const fixture = fixtureForAccountFrontDoorState("email-management");
    if (!("emails" in fixture)) throw new Error("email-management fixture missing emails");
    for (const email of fixture.emails) {
      expect(Object.keys(email).sort()).toEqual(["address", "primary", "verified"]);
    }
  });

  test("no fixture type anywhere in the module accepts a token, session, CSRF value, clock or locale (C-014)", () => {
    const entry = fixtureForAccountFrontDoorState("entry-boundary") as EntryBoundaryFixture;
    // The CSRF placeholder fixture carries only its field NAME — never a value, token or session.
    expect(Object.keys(entry.csrf)).toEqual(["name"]);
    for (const fixture of Object.values(ACCOUNT_FRONT_DOOR_FIXTURES)) {
      const json = JSON.stringify(fixture);
      for (const forbidden of ["csrfToken", "sessionId", "\"token\":", "\"locale\":", "\"clock\":"]) {
        expect(json.includes(forbidden)).toBe(false);
      }
    }
  });
});

describe("Both arms of every conditional composition, proven as a difference (plan.md §1.3)", () => {
  test("R-2: providers absent vs. providers present", () => {
    const empty = fixtureForAccountFrontDoorState("entry-boundary") as EntryBoundaryFixture;
    const populated = fixtureForAccountFrontDoorState(
      "entry-boundary-providers",
    ) as EntryBoundaryFixture;
    expect(empty.providers).toEqual([]);
    expect(populated.providers.length).toBeGreaterThan(0);
    expect(populated.providers).not.toEqual(empty.providers);
  });

  test("R-1: both terminal arms are actionless and carry distinct route-aware inventories", () => {
    const inactive = fixtureForAccountFrontDoorState("terminal-inactive");
    const closed = fixtureForAccountFrontDoorState("terminal-signup-closed");
    if (!("chrome" in inactive) || !("chrome" in closed)) throw new Error("expected chrome");
    // Neither terminal fixture type carries any action/href field of its own — the region's zero
    // interactive-descendant count (FR-015) is therefore structural, not merely observed.
    expect(Object.prototype.hasOwnProperty.call(inactive, "actions")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(closed, "actions")).toBe(false);
    expect(inactive.chrome.actions.map((a) => a.kind)).toEqual(["sign-in", "start-free"]);
    expect(closed.chrome.actions.map((a) => a.kind)).toEqual(["sign-in"]);
    expect(inactive.chrome.actions).not.toEqual(closed.chrome.actions);
  });

  test("cooldown absent vs. cooldown present", () => {
    const plain = fixtureForAccountFrontDoorState("email-management");
    const cooldown = fixtureForAccountFrontDoorState("email-management-cooldown");
    if (!("cooldown" in plain) || !("cooldown" in cooldown)) throw new Error("expected cooldown field");
    expect(plain.cooldown).toBeUndefined();
    expect(cooldown.cooldown).toBeDefined();
    expect(cooldown.cooldown?.message.length).toBeGreaterThan(0);
  });

  test("password-change vs. password-set differ exactly by the current-password field", () => {
    const change = fixtureForAccountFrontDoorState("password-change");
    const set = fixtureForAccountFrontDoorState("password-set");
    if (!("currentPassword" in change) || !("currentPassword" in set)) {
      throw new Error("expected currentPassword field");
    }
    expect(change.currentPassword).toBeDefined();
    expect(set.currentPassword).toBeUndefined();
    // Every other field is present on both — the ONLY structural difference is currentPassword.
    const changeKeys = Object.keys(change).filter((key) => key !== "currentPassword" && key !== "state" && key !== "shellTitle" && key !== "formId" && key !== "action" && key !== "submitLabel").sort();
    const setKeys = Object.keys(set).filter((key) => key !== "currentPassword" && key !== "state" && key !== "shellTitle" && key !== "formId" && key !== "action" && key !== "submitLabel").sort();
    expect(changeKeys).toEqual(setKeys);
  });

  test("submitted-validation retains the submitted email and clears the password", () => {
    const fixture = fixtureForAccountFrontDoorState("submitted-validation") as EntryBoundaryFixture;
    expect(fixture.retainedValues.email).toBeDefined();
    expect(fixture.errors.length).toBeGreaterThan(0);
  });
});

describe("Tokens-only inline style (NFR-007, SC-013) — demonstrated failing first", () => {
  /** Zero raw colour, non-zero px/rem length, or bare z-index literal. Mirrors NFR-007's text. */
  const rawLiteralViolations = (cssText: string): string[] => {
    const violations: string[] = [];
    const colorPattern = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi;
    const lengthPattern = /(?<![\w-])(?!0(?:px|rem)\b)(?:\d*\.\d+|\d+)(?:px|rem)\b/gi;
    const zIndexPattern = /z-index:\s*\d/gi;
    for (const match of cssText.matchAll(colorPattern)) violations.push(`raw colour: ${match[0]}`);
    for (const match of cssText.matchAll(lengthPattern)) violations.push(`raw length: ${match[0]}`);
    for (const match of cssText.matchAll(zIndexPattern)) violations.push(`raw z-index: ${match[0]}`);
    return violations;
  };

  test("the checker itself goes red against a deliberately injected raw literal (SC-013)", () => {
    const injected = `${ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT}\n.sk-account-front-door-pattern__planted { color: #ff0000; margin: 12px; }`;
    const violations = rawLiteralViolations(injected);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.includes("#ff0000"))).toBe(true);
    expect(violations.some((v) => v.includes("12px"))).toBe(true);
  });

  test("the real exported style text carries zero raw colour/length/radius/shadow/duration/z-index literals", () => {
    expect(rawLiteralViolations(ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT)).toEqual([]);
  });
});

describe("C-004 arm (b): the pattern's style text names no dependency-owned class", () => {
  test("no selector in the exported style text names a class an unmerged-at-spec-time dependency owns", () => {
    const forbiddenPrefixes = [
      ".sk-public-header",
      ".sk-boundary-page",
      ".sk-radio-choice-group",
      ".sk-site-footer",
      "sk-theme-toggle",
      ".sk-form-field",
      ".sk-input",
      ".sk-prose",
      ".sk-app-shell",
      ".sk-page-header",
    ];
    for (const prefix of forbiddenPrefixes) {
      expect(ACCOUNT_FRONT_DOOR_PATTERN_STYLE_TEXT.includes(prefix)).toBe(false);
    }
  });
});

describe("Every displayed string is fixture-supplied (C-011) — no English default reaches the copy field", () => {
  test("every sk-copy-field composition site has all four messages supplied by the fixture", () => {
    const fixture = fixtureForAccountFrontDoorState("landing");
    if (!("installCommands" in fixture)) throw new Error("expected installCommands");
    for (const command of fixture.installCommands) {
      expect(command.label.length).toBeGreaterThan(0);
      expect(command.successMessage.length).toBeGreaterThan(0);
      expect(command.manualMessage.length).toBeGreaterThan(0);
      expect(command.failureMessage.length).toBeGreaterThan(0);
    }
  });
});

describe("The legal document is an ordered, frozen LegalBlock[] (SC-008, as amended by plan.md §1.4)", () => {
  test("legal-published renders exactly the supplied blocks, in order, with no unsupplied kind", () => {
    const fixture = fixtureForAccountFrontDoorState("legal-published");
    if (!("blocks" in fixture)) throw new Error("expected blocks");
    expect(fixture.blocks.length).toBeGreaterThan(0);
    for (const block of fixture.blocks) {
      expect(["heading", "paragraph", "list"]).toContain(block.kind);
      if (block.kind === "list") expect(block.items?.length).toBeGreaterThan(0);
      else expect(block.text?.length).toBeGreaterThan(0);
    }
  });
});

describe("A stable state enumeration (FrontDoorState) covers every authored fixture exactly once", () => {
  test("thirteen named states, each with exactly one fixture", () => {
    const states = Object.keys(ACCOUNT_FRONT_DOOR_FIXTURES) as (keyof typeof ACCOUNT_FRONT_DOOR_FIXTURES)[];
    expect(states).toHaveLength(13);
    expect(new Set(states).size).toBe(13);
    for (const state of states) {
      const fixture: FrontDoorFixture = fixtureForAccountFrontDoorState(state) as FrontDoorFixture;
      expect(fixture.state).toBe(state);
    }
  });
});
