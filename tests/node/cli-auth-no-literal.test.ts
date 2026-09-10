import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import {
  CLI_AUTH_FIXTURES,
  terminalActionCount,
} from "../../packages/elements/src/patterns/cli-auth.fixture.js";

/**
 * FR-018 — component-scoped no-literal grep assertion for the CLI Auth pattern
 * (spec-kitty/spec-kitty-design#329), the DoD shape #320's own issue names ("grep-style
 * assertion consistent with #286's DoD pattern"), scoped here to the elements this mission
 * actually composes — not the full #286 catalogue, which this mission does not touch
 * (research.md).
 *
 * WHY STRINGS ARE READ FROM THE FIXTURE OBJECT, NOT RE-TYPED HERE. A second, hand-copied list
 * of the same strings could drift from `cli-auth.fixture.ts` silently — the exact "stale copy"
 * risk the WP's own Reviewer Guidance names. Importing `CLI_AUTH_FIXTURES` and reading the
 * fields directly means this test always runs against whatever the fixture module currently
 * says, not a snapshot of it.
 *
 * `sk-boundary-page` (#303) is not yet in the tree — confirmed by
 * `find packages/{elements,styles}/src -iname '*boundary-page*'`, zero results — so its source
 * is not in COMPOSED_SOURCE_FILES below. T010 adds its files here once that surface lands
 * (// TODO(#303)); reporting it as covered before then would be false.
 */

const COMPOSED_SOURCE_FILES = [
  "packages/styles/src/button/sk-button.css",
  "packages/elements/src/button/sk-button.ts",
  "packages/elements/src/button/sk-button.markup.ts",
  "packages/styles/src/form-field/sk-form-field.css",
  "packages/elements/src/form-input/sk-form-input.ts",
  "packages/elements/src/card/sk-card.ts",
  "packages/elements/src/card/sk-card.markup.ts",
  "packages/styles/src/pill-tag/sk-pill-tag.css",
  "packages/elements/src/pill-tag/sk-pill-tag.ts",
  "packages/elements/src/pill-tag/sk-pill-tag.markup.ts",
  "packages/styles/src/facts/sk-facts.css",
  // TODO(#303): add sk-boundary-page's own source files here once that surface lands, and
  // extend the coverage note in this file's docstring to say so.
] as const;

/** Every genuinely user-visible copy string this mission's four stories render, read live from
 *  the fixture module rather than re-typed. Deliberately excludes structural/enum values
 *  (`outcome: 'success' | 'denied'`) and href values, which are not rendered prose a reader
 *  sees the way a label/heading/body/fact/scope is. */
function collectCopyStrings(): readonly string[] {
  const f = CLI_AUTH_FIXTURES;
  const strings: string[] = [
    f.codeEntryDefault.label,
    f.codeEntryDefault.description,
    f.codeEntryDefault.submitLabel,
    f.authorizationDecision.approveLabel,
    f.authorizationDecision.denyLabel,
    f.terminalSuccess.heading,
    f.terminalSuccess.body,
    f.terminalDenied.heading,
    f.terminalDenied.body,
    f.terminalErrorNoAction.heading,
    f.terminalErrorNoAction.body,
    f.terminalErrorWithAction.heading,
    f.terminalErrorWithAction.body,
  ];
  if (f.codeEntryInvalid.errorMessage) strings.push(f.codeEntryInvalid.errorMessage);
  if (f.terminalErrorWithAction.action) strings.push(f.terminalErrorWithAction.action.label);
  for (const fact of f.authorizationDecision.facts) {
    strings.push(fact.term, fact.value);
  }
  for (const scope of f.authorizationDecision.scopes) {
    strings.push(scope);
  }
  return strings;
}

test("every fixture is exported and every collected copy string is non-empty", () => {
  const strings = collectCopyStrings();
  expect(strings.length).toBeGreaterThan(0);
  for (const value of strings) {
    expect(typeof value).toBe("string");
    expect(value.length).toBeGreaterThan(0);
  }
});

test("no CLI Auth fixture copy string appears as a literal inside the composed elements' own source", () => {
  const copyStrings = collectCopyStrings();
  const sources = COMPOSED_SOURCE_FILES.map((file) => ({
    file,
    text: readFileSync(file, "utf8"),
  }));

  const violations: string[] = [];
  for (const copy of copyStrings) {
    for (const { file, text } of sources) {
      if (text.includes(copy)) {
        violations.push(`"${copy}" appears as a literal inside ${file}`);
      }
    }
  }
  expect(violations).toEqual([]);
});

test("the action-count invariant holds for every terminal fixture — 0 or exactly 1, never fabricated", () => {
  expect(terminalActionCount(CLI_AUTH_FIXTURES.terminalSuccess)).toBe(0);
  expect(terminalActionCount(CLI_AUTH_FIXTURES.terminalDenied)).toBe(0);
  expect(terminalActionCount(CLI_AUTH_FIXTURES.terminalErrorNoAction)).toBe(0);
  expect(terminalActionCount(CLI_AUTH_FIXTURES.terminalErrorWithAction)).toBe(1);
});

test("every fixture is deeply frozen — mutation is rejected, not silently accepted", () => {
  expect(Object.isFrozen(CLI_AUTH_FIXTURES)).toBe(true);
  expect(Object.isFrozen(CLI_AUTH_FIXTURES.codeEntryDefault)).toBe(true);
  expect(Object.isFrozen(CLI_AUTH_FIXTURES.authorizationDecision)).toBe(true);
  expect(Object.isFrozen(CLI_AUTH_FIXTURES.authorizationDecision.facts)).toBe(true);
  expect(Object.isFrozen(CLI_AUTH_FIXTURES.authorizationDecision.facts[0])).toBe(true);
  expect(Object.isFrozen(CLI_AUTH_FIXTURES.authorizationDecision.scopes)).toBe(true);

  expect(() => {
    (CLI_AUTH_FIXTURES.codeEntryDefault as { label: string }).label = "mutated";
  }).toThrow();
  expect(CLI_AUTH_FIXTURES.codeEntryDefault.label).not.toBe("mutated");
});
