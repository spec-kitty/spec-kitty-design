# Issue #470 Stage-A WP02 gate evidence

Date: 2026-09-28
Lane: `kitty/mission-desktop-v2-immutable-handoff-develop-01M3JSCM-lane-b`
Checkout HEAD during local runs: `78b672c2bc99248d6a5f66f1273b406fe18e8f47`

This is pre-commit lane evidence: WP02's exporter, verifier, tests, and CI edits were
present in the worktree but not yet committed when these commands ran. It is not evidence
for a later aggregate PR head. The selected exporter source SHA was the committed WP01
contract source shown above. Re-run and attach exact-head evidence before claiming the
mission's seven-gate acceptance.

| Gate / check | Result |
| --- | --- |
| `npm run quality:all` | Pass. ESLint reported existing security warnings in component and fixture files; zero errors. |
| `npm test` | Pass: 824 tests in 60 files; suite floor passed for both lanes (`node=126`, `browser (chromium)=698`). |
| `npm test -- tests/node/desktop-v2-handoff.test.ts` | The WP02 file reported 9/9 passing. The focused command exits nonzero because the repository's global suite-floor reporter also requires the browser lane and all behavior-registry subjects; this is expected for a partial Vitest invocation. Full-suite `npm test` passed with the final WP02 tests. |
| `npx nx run-many --target=build --projects=tokens,styles,elements,react` | Exit 0; tokens, styles, and elements built. Nx reports that `react` has no `build` target in this checkout. |
| `npx nx run storybook:storybook:build` | Pass. |
| `node scripts/check-desktop-v2-contract.mjs` | Pass against the built Storybook index: 22 families, 110 required states, generated stories and snapshot mappings verified. Full token stylesheet remains blocked while Swansea rights are unresolved. |
| `node scripts/check-gate-wiring.mjs` | Pass; existing CI gate wiring remains valid with the added steps. |
| `node scripts/run-axe-storybook.js` | Pass: 810/810 stories rendered; zero timeouts and zero WCAG 2.1 AA violations. The runner emitted a per-story success line for every story. |
| Tracked gate detail | `axe-story-results.json` preserves the 810/810 Storybook outcome, zero timeouts, and zero-violation summary; `visual-mapping-results.json` preserves all 110 contract family/state/story mappings and their focused-pass result, plus the contract-defined test and snapshot path formats. |
| `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` | **Fail / gate remains red.** 456 tests executed; 251 passed and 205 failed on existing broad-suite screenshot baseline geometry/layout mismatches. No UI, visual spec, or snapshot files were changed by WP02. No snapshots were updated and no waiver is claimed. |
| `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium --grep 'desktop-v2/'` | Pass: 110/110 Desktop V2 contract-mapped visual states. This focused result does not replace the unfiltered required gate above. |
| Two exports + copied offline verification | Pass at source SHA `78b672c2bc99248d6a5f66f1273b406fe18e8f47`: two exports produced byte-identical trees and the same digest, `db7a4911a547b738bae65a7fb252f7eb4498d0f46d9eae7ecba0223609fae6b0`, covering 180 payload files. A copied artifact verified in detached `/tmp` with internal-integrity mode; approved-source verification passed when supplied the full source SHA and a separately computed artifact digest. |

The 110 Desktop V2 visual cases are green, but the specified unfiltered visual gate is not.
WP02 must not be called seven-gate green or moved to `for_review` on this evidence. The
full-suite visual failures remain recorded for review; they are outside the WP02 code diff,
and this report does not authorize baseline updates or a waiver.
