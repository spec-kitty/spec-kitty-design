/**
 * Executable, narrowly-scoped contrast assertion for `--sk-border-control` (FR-012) — now grown
 * (#350) to cover the SAME control rule's INVALID boundary and its error copy.
 *
 * Issue #321 asks for measured ratios "recorded in the PR" — but a number in a PR description
 * cannot go red on a future regression, and `bash scripts/check-token-breaking-changes.sh`
 * provably computes no contrast (it diffs only removed/renamed token NAMES between catalogue
 * snapshots — see research.md's "Decision: --sk-border-control is an INDEPENDENTLY DECLARED
 * LITERAL" section). This test closes that gap for exactly this mission's own token, in both
 * themes, against every surface the control is actually rendered on in a real composition.
 *
 * SURFACE_TOKENS was originally page/card/input only. `--sk-surface-muted` and
 * `--sk-surface-pill` were added after the pre-merge squad found the real work-explorer
 * composition renders `.sk-input` on `--sk-surface-muted` (the filters bar's own background,
 * packages/elements/src/patterns/work-explorer.stories.ts's `.sk-work-explorer-pattern__filters`
 * rule), which the original three-surface scope left unguarded — light-theme muted measures
 * 3.35:1, the tightest of all ten (theme x surface) pairs, below the previously-reported
 * tightest of 3.85:1 (light vs input). `--sk-surface-pill` is included alongside it as the
 * remaining themed surface in the same family (nav pill rail, chips, hover row) that a form
 * control could plausibly sit on in a future composition.
 *
 * Deliberately NOT #155's general WCAG 1.4.11 gate. #155 raises, as an open question, "whether a
 * 1.4.11 check belongs in the a11y gate" — a repo-wide mechanism iterating every border-ish
 * token/selector pair. This test does none of that: exactly two tokens (the resting boundary and
 * the invalid boundary), one error-copy token, exactly five named surfaces, all fixed by this
 * mission's own contract. No probe table, no iteration over any other component's tokens.
 *
 * #350 grew this file rather than adding a sibling: FR-003 (below) is a COMPARISON between the
 * invalid-boundary token and `--sk-border-control` on the same surface/theme, so a sibling file
 * would have to duplicate SURFACE_TOKENS, the theme-selector constants, the postcss resolver and
 * the contrast maths — four things that must never drift apart. What #350 adds, on top of the
 * original ten `--sk-border-control` assertions:
 *
 *   1. DISCOVERY (FR-001) — parse the four component sheets that carry the invalid-boundary rule
 *      (`sk-form-field.css`, `sk-form-input.css`, `sk-form-select.css`, `sk-form-textarea.css`)
 *      with postcss and collect the `border-color` (or a `border` shorthand's colour component) of
 *      every rule whose selector contains `[aria-invalid="true"]` or `:invalid`. The token under
 *      test is DISCOVERED from the CSS, never hard-coded — this is what makes the guard survive
 *      whichever option a future mission picks, and what makes it red at 93c82f14 (where
 *      discovery yields `--sk-color-red`). The same technique, over
 *      `.sk-form-field--error .sk-form-field__description`, `.sk-form-input__error` and
 *      `.sk-form-textarea__error`, discovers the error-copy token. Both discovered sets are
 *      asserted NON-EMPTY and SINGLE-VALUED — load-bearing: a future selector rename must not
 *      silently make this guard pass over zero inputs, which is the same defect shape as #350
 *      itself.
 *   2. CASCADE-CORRECT RESOLUTION — `resolveToken(root, selector, token)` (a) looks for the
 *      declaration in the requested theme block, (b) falls back to `:root` when the token is
 *      absent there (real CSS cascade behaviour, and what reproduces the shipping defect when
 *      this resolver is run against the unmodified tree), (c) follows at most one `var()` hop, and
 *      (d) throws a named error if the final value is not a hex literal. The original
 *      `--sk-border-control` and surface lookups are refactored onto this same resolver — one
 *      resolver, not two.
 *   3. ABSOLUTE + RELATIONAL + DARK NON-REGRESSION + TEXT assertions, for each theme x each of the
 *      FIVE surfaces (page/card/input/muted/pill — matching this file's own `--sk-border-control`
 *      surface set, not the four the issue's own table names: a four-surface invalid set beside a
 *      five-surface resting set would leave `--sk-surface-pill` guarded for resting and unguarded
 *      for invalid on the same rule — this bug's exact shape, reintroduced inside its own fix).
 */
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { expect, test } from 'vitest';

const TOKENS_CSS = 'packages/tokens/src/tokens.css';
const ROOT_SELECTOR = ':root';
const LIGHT_SELECTOR = ':root[data-theme="light"],\n.sk-light';

const SURFACE_TOKENS = [
  '--sk-surface-page',
  '--sk-surface-card',
  '--sk-surface-input',
  '--sk-surface-muted',
  '--sk-surface-pill',
] as const;
type SurfaceToken = (typeof SURFACE_TOKENS)[number];

const BORDER_TOKEN = '--sk-border-control';
const CONTRAST_FLOOR = 3.0;
const TEXT_CONTRAST_FLOOR = 4.5;

/**
 * Pinned pre-fix dark measurements at 93c82f14 (FR-004 / NFR-003). The dark literal does not
 * move under this mission's fix (`--sk-border-control-invalid`/`--sk-fg-error` both resolve to
 * `#E97373` in `:root`, byte-identical to `--sk-color-red` today), so these are also the CURRENT
 * dark ratios — but they are recorded here as PINNED CONSTANTS, not derived from a live
 * computation, because a computed comparison would move with the token and assert nothing. See
 * `tokens.css`'s own `--sk-border-control-invalid` comment for the same twenty numbers.
 */
const DARK_PREFIX_FLOOR: Record<SurfaceToken, number> = {
  '--sk-surface-page': 6.58,
  '--sk-surface-card': 5.94,
  '--sk-surface-input': 5.63,
  '--sk-surface-muted': 4.79,
  '--sk-surface-pill': 5.08,
};

/** The four sheets that carry the `[aria-invalid="true"]`/`:invalid` boundary rule (#350). */
const BOUNDARY_SHEETS = [
  'packages/styles/src/form-field/sk-form-field.css',
  'packages/styles/src/form-input/sk-form-input.css',
  'packages/styles/src/form-select/sk-form-select.css',
  'packages/styles/src/form-textarea/sk-form-textarea.css',
] as const;

/**
 * The three sheets that carry an error-copy rule. `sk-form-select.css` has no error-copy
 * declaration of its own (its `:invalid` rule changes only the border) — plan.md §4.1/T005.
 */
const ERROR_COPY_SHEETS = [
  'packages/styles/src/form-field/sk-form-field.css',
  'packages/styles/src/form-input/sk-form-input.css',
  'packages/styles/src/form-textarea/sk-form-textarea.css',
] as const;

/** WCAG relative-luminance contrast ratio, standard formula. */
function hexToSrgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function linearize(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToSrgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

type TokensRoot = ReturnType<typeof postcss.parse>;

/** Find the value of a single custom-property declaration inside the rule(s) matching `selector`. */
function findDecl(root: TokensRoot, selector: string, token: string): string | undefined {
  let value: string | undefined;
  root.walkRules(selector, (rule) => {
    rule.walkDecls(token, (decl) => {
      value = decl.value.trim();
    });
  });
  return value;
}

/**
 * Cascade-correct token resolver (#350). Looks for `token`'s declaration in the requested theme
 * `selector`; if it is absent there, falls back to `:root` — real CSS cascade behaviour, and
 * exactly what reproduces the shipping defect: at 93c82f14 the light block declares no
 * `--sk-color-red`, so a light lookup for that token falls back to `:root`'s `#E97373`, the same
 * value dark theme uses, which is the bug. Follows at most one `var()` hop past the requested
 * token (also cascade-correct: the alias lookup gets its own `:root` fallback), then asserts the
 * final value is a hex literal.
 */
function resolveToken(root: TokensRoot, selector: string, token: string): string {
  let value = findDecl(root, selector, token);
  if (value === undefined && selector !== ROOT_SELECTOR) {
    value = findDecl(root, ROOT_SELECTOR, token);
  }
  if (value === undefined) {
    throw new Error(`${TOKENS_CSS}: ${token} not found in rule "${selector}" or its :root fallback`);
  }

  const varMatch = /^var\((--[a-z0-9-]+)\)$/i.exec(value);
  if (varMatch) {
    const aliasToken = varMatch[1];
    let aliasValue = findDecl(root, selector, aliasToken);
    if (aliasValue === undefined && selector !== ROOT_SELECTOR) {
      aliasValue = findDecl(root, ROOT_SELECTOR, aliasToken);
    }
    if (aliasValue === undefined) {
      throw new Error(
        `${TOKENS_CSS}: ${token} -> var(${aliasToken}), but ${aliasToken} was not found in rule "${selector}" or its :root fallback`,
      );
    }
    value = aliasValue;
  }

  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(
      `${TOKENS_CSS}: ${token} resolved to "${value}" in rule "${selector}", which is not a hex literal (this resolver follows at most one var() hop)`,
    );
  }
  return value;
}

type DiscoveredDecl = { file: string; selector: string; token: string };

/** Extract the single `var(--sk-*)` reference from a declaration's value, or undefined. */
function singleVarToken(rawValue: string): string | undefined {
  const matches = [...rawValue.matchAll(/var\((--[a-z0-9-]+)\)/gi)];
  return matches.length === 1 ? matches[0][1] : undefined;
}

/**
 * Discovery (FR-001): the `border-color` (or the colour component of a `border` shorthand) of
 * every rule, across `BOUNDARY_SHEETS`, whose selector contains `[aria-invalid="true"]` or
 * `:invalid`. Never hard-codes a token name — this is what makes the guard red at 93c82f14
 * (`--sk-color-red`) with no edit to this file.
 */
function discoverBoundaryDecls(): DiscoveredDecl[] {
  const found: DiscoveredDecl[] = [];
  for (const file of BOUNDARY_SHEETS) {
    const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });
    root.walkRules((rule) => {
      if (!rule.selector.includes('[aria-invalid="true"]') && !rule.selector.includes(':invalid')) return;
      rule.walkDecls(/^border(-color)?$/, (decl) => {
        const token = singleVarToken(decl.value);
        if (!token) {
          throw new Error(
            `${file}: rule "${rule.selector}" declares "${decl.prop}: ${decl.value}", which is not a single var(--sk-*) reference`,
          );
        }
        found.push({ file, selector: rule.selector, token });
      });
    });
  }
  return found;
}

/**
 * Discovery (FR-001, error copy): the `color` of every rule, across `ERROR_COPY_SHEETS`, whose
 * selector names an error-copy element (`__error`, or form-field's `--error` modifier).
 */
function discoverErrorCopyDecls(): DiscoveredDecl[] {
  const found: DiscoveredDecl[] = [];
  for (const file of ERROR_COPY_SHEETS) {
    const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });
    root.walkRules((rule) => {
      const isErrorCopySelector = rule.selector.includes('__error') || rule.selector.includes('--error');
      if (!isErrorCopySelector) return;
      rule.walkDecls('color', (decl) => {
        const token = singleVarToken(decl.value);
        if (!token) {
          throw new Error(
            `${file}: rule "${rule.selector}" declares "color: ${decl.value}", which is not a single var(--sk-*) reference`,
          );
        }
        found.push({ file, selector: rule.selector, token });
      });
    });
  }
  return found;
}

const boundaryDecls = discoverBoundaryDecls();
const boundaryTokens = [...new Set(boundaryDecls.map((d) => d.token))];
// Fallback placeholder so a zero-discovery run fails LOUDLY inside resolveToken's "not found"
// error rather than crashing with an opaque `undefined` — the dedicated discovery test below is
// the primary signal either way.
const BOUNDARY_TOKEN = boundaryTokens[0] ?? '--sk-invalid-boundary-token-not-discovered';

const errorCopyDecls = discoverErrorCopyDecls();
const errorCopyTokens = [...new Set(errorCopyDecls.map((d) => d.token))];
const ERROR_TOKEN = errorCopyTokens[0] ?? '--sk-error-copy-token-not-discovered';

test('discovery: the invalid-boundary declaration set is non-empty and single-valued', () => {
  expect(
    boundaryDecls.length,
    `no [aria-invalid="true"]/:invalid border rule was found across ${BOUNDARY_SHEETS.join(', ')} — ` +
      'a selector rename would otherwise make this guard silently pass over zero inputs',
  ).toBeGreaterThan(0);
  expect(
    boundaryTokens,
    `expected exactly one token across ${boundaryDecls.length} invalid-boundary declaration(s), found: ${boundaryTokens.join(', ') || '(none)'}`,
  ).toHaveLength(1);
});

test('discovery: the error-copy declaration set is non-empty and single-valued', () => {
  expect(
    errorCopyDecls.length,
    `no error-copy color rule was found across ${ERROR_COPY_SHEETS.join(', ')} — ` +
      'a selector rename would otherwise make this guard silently pass over zero inputs',
  ).toBeGreaterThan(0);
  expect(
    errorCopyTokens,
    `expected exactly one token across ${errorCopyDecls.length} error-copy declaration(s), found: ${errorCopyTokens.join(', ') || '(none)'}`,
  ).toHaveLength(1);
});

const tokensSource = readFileSync(TOKENS_CSS, 'utf8');
const tokensRoot = postcss.parse(tokensSource, { from: TOKENS_CSS });

const THEMES = [
  { name: 'dark', selector: ROOT_SELECTOR },
  { name: 'light', selector: LIGHT_SELECTOR },
] as const;

for (const { name: themeName, selector } of THEMES) {
  for (const surfaceToken of SURFACE_TOKENS) {
    const surfaceHex = resolveToken(tokensRoot, selector, surfaceToken);
    const borderControlHex = resolveToken(tokensRoot, selector, BORDER_TOKEN);

    // --- pre-existing --sk-border-control (resting boundary) assertions, refactored onto the
    // shared resolveToken helper (#350) — one resolver, not two.
    test(`[FR-012] ${themeName} theme: --sk-border-control vs ${surfaceToken} clears 3:1`, () => {
      const ratio = contrastRatio(borderControlHex, surfaceHex);
      expect(
        ratio,
        `${themeName} theme, ${surfaceToken}: --sk-border-control (${borderControlHex}) vs ${surfaceToken} (${surfaceHex}) = ${ratio.toFixed(2)}:1, below the ${CONTRAST_FLOOR}:1 floor`,
      ).toBeGreaterThanOrEqual(CONTRAST_FLOOR);
    });

    // --- #350: the invalid boundary, discovered from the four component sheets.
    const invalidHex = resolveToken(tokensRoot, selector, BOUNDARY_TOKEN);
    const invalidRatio = contrastRatio(invalidHex, surfaceHex);
    const restingRatio = contrastRatio(borderControlHex, surfaceHex);

    test(`[FR-002] ${themeName} theme: invalid boundary (${BOUNDARY_TOKEN}) vs ${surfaceToken} clears 3:1`, () => {
      expect(
        invalidRatio,
        `${themeName} theme, ${surfaceToken}: ${BOUNDARY_TOKEN} (${invalidHex}) vs ${surfaceToken} (${surfaceHex}) = ${invalidRatio.toFixed(2)}:1, below the ${CONTRAST_FLOOR}:1 floor`,
      ).toBeGreaterThanOrEqual(CONTRAST_FLOOR);
    });

    test(`[FR-003] ${themeName} theme: invalid boundary vs resting boundary on ${surfaceToken}`, () => {
      expect(
        invalidRatio,
        `${themeName} theme, ${surfaceToken}: invalid boundary ratio ${invalidRatio.toFixed(2)}:1 is below the resting --sk-border-control ratio ${restingRatio.toFixed(2)}:1 — the invalid state would be LESS visible than the resting state, exactly #350's inversion`,
      ).toBeGreaterThanOrEqual(restingRatio);
    });

    if (themeName === 'dark') {
      test(`[FR-004] dark theme: invalid boundary vs ${surfaceToken} does not regress below the pre-fix measurement`, () => {
        const floor = DARK_PREFIX_FLOOR[surfaceToken];
        // The pinned floor is itself a 2-decimal rounding of the pre-fix measurement (plan.md
        // §2.6/§5.2), and the dark literal is byte-identical before and after this mission — so
        // the live ratio is mathematically the same number the floor was rounded from. Compare
        // at the same precision the floor is pinned at, rather than letting an unrounded
        // floating-point tail (e.g. 5.938901915811443 < 5.94) read as a regression that never
        // happened.
        const roundedRatio = Number(invalidRatio.toFixed(2));
        expect(
          roundedRatio,
          `dark theme, ${surfaceToken}: ${invalidRatio.toFixed(2)}:1 is below the pinned pre-fix floor ${floor.toFixed(2)}:1 (measured at 93c82f14, before #350)`,
        ).toBeGreaterThanOrEqual(floor);
      });
    }

    // --- #350: the error copy, discovered from the three component sheets.
    test(`[error-copy] ${themeName} theme: error copy (${ERROR_TOKEN}) vs ${surfaceToken} clears 4.5:1`, () => {
      const errorHex = resolveToken(tokensRoot, selector, ERROR_TOKEN);
      const ratio = contrastRatio(errorHex, surfaceHex);
      expect(
        ratio,
        `${themeName} theme, ${surfaceToken}: ${ERROR_TOKEN} (${errorHex}) vs ${surfaceToken} (${surfaceHex}) = ${ratio.toFixed(2)}:1, below the ${TEXT_CONTRAST_FLOOR}:1 text floor`,
      ).toBeGreaterThanOrEqual(TEXT_CONTRAST_FLOOR);
    });
  }
}
