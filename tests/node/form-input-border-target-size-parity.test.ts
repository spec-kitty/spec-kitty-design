/**
 * Anti-drift proof for the #321 control-boundary contract (FR-006, User Story 3).
 *
 * No generator links `packages/styles/src/form-field/sk-form-field.css`'s `.sk-input` to
 * `packages/styles/src/form-input/sk-form-input.css`'s `.sk-form-input__control` — there is no
 * `sk-form-input.markup.ts`, so `build-element-markup.mjs`'s glob never touches this component
 * pair (see research.md's "anti-drift test is a static CSS-value-equality assertion" decision).
 * #173 already documents these two rules as "the same declaration block modulo `1px` vs.
 * `var(--sk-border-width-1)`" with nothing but discipline enforcing that. This test replaces
 * discipline with a mechanical check over exactly the two declarations this contract owns:
 * `border` and `min-block-size`. It does NOT compare the whole rule — `padding`, `background`,
 * `font-family`, etc. are legitimately independent and out of this mission's scope.
 */
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { expect, test } from 'vitest';

const SK_INPUT_CSS = 'packages/styles/src/form-field/sk-form-field.css';
const SK_FORM_INPUT_CONTROL_CSS = 'packages/styles/src/form-input/sk-form-input.css';

const CANONICAL_BORDER = 'var(--sk-border-width-1) solid var(--sk-border-control)';
const CANONICAL_MIN_BLOCK_SIZE = 'var(--sk-space-9)';

type DeclarationValues = { border: string | undefined; minBlockSize: string | undefined };

/**
 * Both `.sk-input` and `.sk-form-input__control` are simple, unqualified class selectors in
 * their respective files (no compound/combinator ambiguity), so a direct selector-string match
 * on the parsed rule is sufficient — per research.md's own scoping note, this deliberately does
 * not reach for `postcss-selector-parser` for a case this simple.
 */
function readDeclarations(cssPath: string, selector: string): DeclarationValues {
  const source = readFileSync(cssPath, 'utf8');
  const root = postcss.parse(source, { from: cssPath });
  let border: string | undefined;
  let minBlockSize: string | undefined;
  root.walkRules(selector, (rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop === 'border') border = decl.value;
      if (decl.prop === 'min-block-size') minBlockSize = decl.value;
    });
  });
  return { border, minBlockSize };
}

test('[FR-006] .sk-input and .sk-form-input__control declare byte-identical border/min-block-size values', () => {
  const input = readDeclarations(SK_INPUT_CSS, '.sk-input');
  const control = readDeclarations(SK_FORM_INPUT_CONTROL_CSS, '.sk-form-input__control');

  // Both rules must actually declare the properties this test is about — a selector that
  // silently matched nothing (e.g. after a future rename) must fail loudly, not pass vacuously.
  expect(input.border, `${SK_INPUT_CSS}: .sk-input has no border declaration`).toBeDefined();
  expect(input.minBlockSize, `${SK_INPUT_CSS}: .sk-input has no min-block-size declaration`).toBeDefined();
  expect(
    control.border,
    `${SK_FORM_INPUT_CONTROL_CSS}: .sk-form-input__control has no border declaration`,
  ).toBeDefined();
  expect(
    control.minBlockSize,
    `${SK_FORM_INPUT_CONTROL_CSS}: .sk-form-input__control has no min-block-size declaration`,
  ).toBeDefined();

  // (a) cross-file equality
  expect(
    control.border,
    `border diverged: ${SK_INPUT_CSS} .sk-input = "${input.border}" vs ${SK_FORM_INPUT_CONTROL_CSS} .sk-form-input__control = "${control.border}"`,
  ).toBe(input.border);
  expect(
    control.minBlockSize,
    `min-block-size diverged: ${SK_INPUT_CSS} .sk-input = "${input.minBlockSize}" vs ${SK_FORM_INPUT_CONTROL_CSS} .sk-form-input__control = "${control.minBlockSize}"`,
  ).toBe(input.minBlockSize);

  // (b) each file's value equals the documented canonical expression — catches a
  // both-files-changed-together-but-wrong regression that cross-file equality alone would miss.
  expect(
    input.border,
    `${SK_INPUT_CSS} .sk-input: border "${input.border}" does not match the canonical "${CANONICAL_BORDER}"`,
  ).toBe(CANONICAL_BORDER);
  expect(
    control.border,
    `${SK_FORM_INPUT_CONTROL_CSS} .sk-form-input__control: border "${control.border}" does not match the canonical "${CANONICAL_BORDER}"`,
  ).toBe(CANONICAL_BORDER);
  expect(
    input.minBlockSize,
    `${SK_INPUT_CSS} .sk-input: min-block-size "${input.minBlockSize}" does not match the canonical "${CANONICAL_MIN_BLOCK_SIZE}"`,
  ).toBe(CANONICAL_MIN_BLOCK_SIZE);
  expect(
    control.minBlockSize,
    `${SK_FORM_INPUT_CONTROL_CSS} .sk-form-input__control: min-block-size "${control.minBlockSize}" does not match the canonical "${CANONICAL_MIN_BLOCK_SIZE}"`,
  ).toBe(CANONICAL_MIN_BLOCK_SIZE);
});
