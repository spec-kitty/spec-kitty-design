# Cycle 7 independent final review — changes requested

Reviewed code SHA: `c08be570c645aad2a095bcefa77aafe4314547b9`

## HIGH — DM1 does not enforce the promised exact own-key boundary

`packages/elements/src/patterns/team-activity.stories.ts:749-753` validates the Decision payload
with `Object.keys()`. That API sees only enumerable string keys, so the real built projection seam
accepts both of these forbidden shapes instead of throwing the cycle-6 error:

- an own, non-enumerable string property named `question`;
- an own symbol property such as `Symbol("question")`.

I reproduced both against the freshly built `patterns-team-activity--default` story at
`c08be570`: `projectFixture(candidate, "dm1")` returned the normal Decision projection while
`Object.getOwnPropertyNames(candidate.decision)` was `label,id,question` in the first case and
`Object.getOwnPropertySymbols(candidate.decision)` contained `Symbol(question)` in the second.

This leaves the prior squad finding open. Cycle 6 requires the accepted Decision record's exact
own-key set to be only `id`,`label`; FR-011/FR-017 and NI-003 claim that stronger contract is
proved. The current test at `apps/storybook/src/tests/sk-team-activity-pattern.spec.ts:1278-1319`
adds only ordinary enumerable string properties and therefore cannot catch this gap.

Close the boundary by validating all own string-property names and refusing every own symbol.
Extend the built-seam DM1 mutation proof with at least one non-enumerable string extra and one
symbol extra, retaining the exact `TypeError` contract. Then reconcile FR-011/FR-017, NI-003, and
cycle evidence to the newly demonstrated result and rerun the final exact-head gates.

## Review evidence and disposition

- Existing focused Chromium suite: 22/22 pass.
- Pinned Playwright 1.62.1 Noble matrix: 62 pass, 4 expected engine-specific skips.
- Owned Noble visual replay: 18/18 pass; representative L1/L5/TL1/OA1/narrow/forced-colors images
  inspected with no clipping or hierarchy defect.
- `npm run quality:all`, five-project typecheck, 57-file/787-test Vitest suite, Storybook build,
  47-probe composition selftest/live scan, and 51-file visual-softness gate: pass.
- L5 direct black-box check: class-only root, no own string properties or symbols, no payload seam.
- Projection ownership direct check: caller data remains mutable and detached projections remain
  unchanged.
- 640-CSS-pixel 200%-zoom-equivalent reflow case is honestly named; CSS zoom remains supplemental.
- Compact four-commit history and target-era inventory/baselines are otherwise coherent.

WP anti-pattern checklist: dead code PASS; synthetic-fixture test PASS; silent empty return N/A;
FR coverage FAIL (FR-011/FR-017 exact-own-key edge); frozen surface PASS; locked decision FAIL
(same DM1 boundary); shared-file ownership PASS; production fragility N/A (story-local fail-loud
validators).
