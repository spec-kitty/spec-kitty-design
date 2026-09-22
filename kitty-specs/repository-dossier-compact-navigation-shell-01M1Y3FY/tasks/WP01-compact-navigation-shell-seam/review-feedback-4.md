# WP01 final independent review correction — cycle 4 disposition

**Rejected SHA:** `fc4187e5a926b343f96f7f8a27b0f40fdedb831e`

**Base/merge-base:** `061f9c1757c5e600b03a9ea26ddb66df4ddbbe8e`

**Disposition:** addressed in a separate, narrow review-fix commit; the new commit deliberately
does not embed its own future SHA.

## Medium blocker

- Added a custom `presentation` `fromAttribute` converter that maps only native attribute removal
  from Lit's default `null` result to the public omission state `undefined`. Unknown string values
  still reach the existing warn-once, fail-open path unchanged.
- Left property-to-attribute reflection on Lit's default converter. Existing pre-upgrade property
  authoring still proves `presentation = 'compact'` reflects, while the new regression starts from
  `presentation="compact"` to prove declarative attribute authoring.
- Added an authored `[SC-010]` behavior regression and a Chromium/Firefox Storybook regression.
  Both start compact/open, remove the native attribute, prove `presentation === undefined`, prove
  no unknown-null warning, restore the personal/context legacy regions, hide compact header and
  navigation. The unmarked browser regression additionally retains the integrated focus-release
  assertion; SC-012 remains the mutation-owned focus-release contract.
- Consumer ownership, accepted/rejected Escape behavior, and ordinary-close focus behavior are
  unchanged.

## Mutation disposition

- Reused the existing SC-010 app-shell behavior/subject registration; no ADR behavior was invented.
- Added the source-owned arm `removing the presentation attribute restores the public omitted
  state`, which weakens only `return value ?? undefined` to `return value`.
- The exact substitution against the complete app-shell behavior file produced 1 failed and 21
  passed tests. Only the named `[SC-010]` removal test went red, reporting both `null` instead of
  `undefined` and the exact unknown-null warning; no other behavior test failed. Restoring the
  converter returned the focused app-shell/React run to 24/24.

## Evidence cleanup

- Review cycle 4 preserves the final independent rejection at `fc4187e5` verbatim.
- The validation ledger now names the later SVG menu-mark and ordinary-close focus fixes that
  superseded cycle 2, and distinguishes historical full-gate evidence from this focused post-fix
  handoff.
- The focused browser count is corrected from 36/36 to 38/38 after adding one case per engine.
  Acceptance metadata is refreshed only for criteria directly reverified in this cycle; overall
  acceptance remains pending final exact-SHA gates and independent review.

## Focused verification

- Red-first focused reproduction: 1 failed / 21 skipped; `presentation` was `null`.
- Exact mutation substitution over the full app-shell behavior file: 1 failed / 21 passed, with
  both the `null` value and `unknown sk-app-shell presentation "null"` reported by the named test.
- Restored focused Vitest: 24/24 across app-shell behavior and React consumer tests.
- Source-rebuilt focused Storybook: 38/38 across Chromium and Firefox.
- Mutation guard selftest: 10/10 in 42.7s from a green 462-assertion baseline with all 126 registry
  pairs present.
- CEM, React, Vue, CSS, and markup regeneration produced no tracked drift. Node 24.20.0 rebuilt
  elements with `--skip-nx-cache`; `packages/elements/SIZES.md` is the only generated output that
  changed.

The complete post-commit/full repository gate matrix has not been rerun in this correction cycle
and is not claimed here.
