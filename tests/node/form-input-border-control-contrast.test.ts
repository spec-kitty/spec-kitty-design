/**
 * Executable, narrowly-scoped contrast assertion for `--sk-border-control` (FR-012).
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
 * 3.35:1, the tightest of all eight (theme x surface) pairs, below the previously-reported
 * tightest of 3.85:1 (light vs input). `--sk-surface-pill` is included alongside it as the
 * remaining themed surface in the same family (nav pill rail, chips, hover row) that a form
 * control could plausibly sit on in a future composition.
 *
 * Deliberately NOT #155's general WCAG 1.4.11 gate. #155 raises, as an open question, "whether a
 * 1.4.11 check belongs in the a11y gate" — a repo-wide mechanism iterating every border-ish
 * token/selector pair. This test does none of that: exactly one token, exactly five named
 * surfaces, all fixed by this mission's own contract. No probe table, no iteration over any
 * other component's tokens.
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
const BORDER_TOKEN = '--sk-border-control';
const CONTRAST_FLOOR = 3.0;

type ThemeHexes = { borderControl: string; surfaces: Record<(typeof SURFACE_TOKENS)[number], string> };

/**
 * `--sk-border-control` and the three obligated surface tokens are all plain hex literals in
 * both theme blocks (T001 declared `--sk-border-control` that way on purpose) — no `var()`
 * resolution is needed for this narrow, four-token scope. This would NOT generalize as-is to a
 * token whose value is itself a `var()` chain.
 */
function readThemeHexes(source: string, selector: string): ThemeHexes {
  const root = postcss.parse(source, { from: TOKENS_CSS });
  let borderControl: string | undefined;
  const surfaces = {} as Record<(typeof SURFACE_TOKENS)[number], string>;
  root.walkRules(selector, (rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop === BORDER_TOKEN) borderControl = decl.value.trim();
      if ((SURFACE_TOKENS as readonly string[]).includes(decl.prop)) {
        surfaces[decl.prop as (typeof SURFACE_TOKENS)[number]] = decl.value.trim();
      }
    });
  });
  if (!borderControl) throw new Error(`${TOKENS_CSS}: ${BORDER_TOKEN} not found in rule "${selector}"`);
  for (const token of SURFACE_TOKENS) {
    if (!surfaces[token]) throw new Error(`${TOKENS_CSS}: ${token} not found in rule "${selector}"`);
  }
  return { borderControl, surfaces };
}

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

const source = readFileSync(TOKENS_CSS, 'utf8');
const dark = readThemeHexes(source, ROOT_SELECTOR);
const light = readThemeHexes(source, LIGHT_SELECTOR);

const themes = [
  { name: 'dark', hexes: dark },
  { name: 'light', hexes: light },
] as const;

for (const { name: themeName, hexes } of themes) {
  for (const surfaceToken of SURFACE_TOKENS) {
    test(`[FR-012] ${themeName} theme: --sk-border-control vs ${surfaceToken} clears 3:1`, () => {
      const ratio = contrastRatio(hexes.borderControl, hexes.surfaces[surfaceToken]);
      expect(
        ratio,
        `${themeName} theme, ${surfaceToken}: --sk-border-control (${hexes.borderControl}) vs ${surfaceToken} (${hexes.surfaces[surfaceToken]}) = ${ratio.toFixed(2)}:1, below the ${CONTRAST_FLOOR}:1 floor`,
      ).toBeGreaterThanOrEqual(CONTRAST_FLOOR);
    });
  }
}
