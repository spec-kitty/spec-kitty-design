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
 * `sk-boundary-page` (#303) IS NOW IN THE TREE (IC-06, landed on `train/elements-first`) — its
 * own styles source, `packages/styles/src/boundary-page/sk-boundary-page.css`, is included in
 * COMPOSED_SOURCE_FILES below. It is styles-only (no custom element, no `.ts` module — that
 * file's own header comment: "NO SHADOW ROOT, NO CUSTOM ELEMENT"), so only its `.css` is
 * checked, matching the treatment every other styles-only surface here already gets
 * (`sk-form-field.css`, `sk-facts.css`). Its own HTML exemplars
 * (`packages/styles/src/boundary-page/sk-boundary-page-*.html`) are NOT scanned: they are
 * #303's own authored fixture content, not the frame's default-copy surface this assertion
 * guards against — the same reason this file never scanned `sk-button.stories.ts` either.
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
  "packages/styles/src/boundary-page/sk-boundary-page.css",
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

/** Escapes regex metacharacters so a copy string can be searched for literally. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("no CLI Auth fixture copy string appears as a literal inside the composed elements' own source", () => {
  const copyStrings = collectCopyStrings();
  const sources = COMPOSED_SOURCE_FILES.map((file) => ({
    file,
    text: readFileSync(file, "utf8"),
  }));

  const violations: string[] = [];
  for (const copy of copyStrings) {
    // Word-boundary matching, not a bare substring search: a short fixture value like "Client"
    // is a real English word that can legitimately appear as a SUBSTRING of an unrelated
    // identifier in a maintainer comment — measured directly, `sk-button.css` contains
    // `getBoundingClientRect()`, which a bare `.includes("Client")` flags as a false positive.
    //
    // NOT `\b<escaped copy>\b` — a real `\b` boundary needs a WORD character on one side and a
    // non-word character (or string edge) on the other. A copy string that ends in punctuation
    // (every terminal `body` string, `codeEntryDefault.description`,
    // `codeEntryInvalid.errorMessage` — all end in `.`) is realistically embedded as a source
    // literal `"...ends in a period."` — the character immediately after the closing `.` is the
    // string's own closing `"`, which is ALSO non-word, so no `\b` exists there and a planted
    // copy of that literal goes silently undetected (measured: a lens planted
    // `const DEFAULT = "Enter the 8-character code shown on your other device.";` into a scanned
    // file and this assertion did not go red). `(?:^|\W)`/`(?:\W|$)` keeps the same
    // false-positive rejection (the char immediately before "Client" in
    // `getBoundingClientRect` is the word character "g", so neither alternative matches) while
    // accepting non-word characters — including another non-word character, as `".` is — on
    // either side, not only a word-vs-non-word transition.
    const pattern = new RegExp(`(?:^|\\W)${escapeRegExp(copy)}(?:\\W|$)`);
    for (const { file, text } of sources) {
      if (pattern.test(text)) {
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
