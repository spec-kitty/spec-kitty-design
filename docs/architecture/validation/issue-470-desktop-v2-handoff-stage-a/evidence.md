# Issue #470 Stage-A WP02 gate evidence

Date: 2026-09-28
Lane: `kitty/mission-desktop-v2-immutable-handoff-develop-01M3JSCM-lane-b`
WP02 implementation commit: `2d9f25371be02ed6608eba8c8386e0a9ba6a5237`

The initial local gate set ran at checkout HEAD `78b672c2bc99248d6a5f66f1273b406fe18e8f47`
with the WP02 code changes present but uncommitted. After committing WP02, Storybook build,
contract validation, and axe were rerun at the implementation commit above. The exact-head
axe sidecar contains every passed story ID and the captured runner-log digest. Other gate
results below remain from the earlier worktree run; this is not seven-gate evidence for a
reviewed PR head. The selected exporter source SHA was the committed WP01 contract source
`78b672c2bc99248d6a5f66f1273b406fe18e8f47`.

| Gate / check | Result |
| --- | --- |
| `npm run quality:all` | Pass. ESLint reported existing security warnings in component and fixture files; zero errors. |
| `npm test` | Pass: 824 tests in 60 files; suite floor passed for both lanes (`node=126`, `browser (chromium)=698`). |
| `npm test -- tests/node/desktop-v2-handoff.test.ts` | The WP02 file reported 9/9 passing. The focused command exits nonzero because the repository's global suite-floor reporter also requires the browser lane and all behavior-registry subjects; this is expected for a partial Vitest invocation. Full-suite `npm test` passed with the final WP02 tests. |
| `npx nx run-many --target=build --projects=tokens,styles,elements,react` | Exit 0; tokens, styles, and elements built. Nx reports that `react` has no `build` target in this checkout. |
| `npx nx run storybook:storybook:build` | Pass at WP02 implementation commit `2d9f25371be02ed6608eba8c8386e0a9ba6a5237`. |
| `node scripts/check-desktop-v2-contract.mjs` | Pass at WP02 implementation commit `2d9f25371be02ed6608eba8c8386e0a9ba6a5237`: 22 families, 110 required states, generated stories and snapshot mappings verified. Full token stylesheet remains blocked while Swansea rights are unresolved. |
| `node scripts/check-gate-wiring.mjs` | Pass; existing CI gate wiring remains valid with the added steps. |
| `node scripts/run-axe-storybook.js` | Pass at WP02 implementation commit `2d9f25371be02ed6608eba8c8386e0a9ba6a5237`: 810 unique story IDs passed; zero failed, timed out, or WCAG 2.1 AA violations. The per-story IDs and captured-log SHA256 are in `axe-story-results.json`. |
| Tracked gate detail | `axe-story-results.json` preserves all 810 exact-head story outcomes; `visual-mapping-results.json` preserves all 110 contract family/state/story mappings and path formats. The focused visual result in that file remains from the earlier `78b672c2` worktree run; the contract checker independently revalidated the mapping at `2d9f2537`. |
| `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` | **Fail / gate remains red.** The earlier worktree run at `78b672c2` executed 456 tests; 251 passed and 205 failed on broad-suite screenshot baseline geometry/layout mismatches. This full visual gate was not rerun at `2d9f2537`; no UI, visual spec, or snapshot files were changed by WP02. No snapshots were updated and no waiver is claimed. |
| `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium --grep 'desktop-v2/'` | Pass: 110/110 Desktop V2 contract-mapped visual states in the earlier `78b672c2` worktree run. This focused result does not replace or clear the unfiltered gate above. |
| Two exports + copied offline verification | Pass at source SHA `78b672c2bc99248d6a5f66f1273b406fe18e8f47`: two exports produced byte-identical trees and the same digest, `db7a4911a547b738bae65a7fb252f7eb4498d0f46d9eae7ecba0223609fae6b0`, covering 180 payload files. A copied artifact verified in detached `/tmp` with internal-integrity mode; approved-source verification passed when supplied the full source SHA and a separately computed artifact digest. |

The 110 Desktop V2 visual cases are green, but the specified unfiltered visual gate is not.
WP02 must not be called seven-gate green or moved to `for_review` on this evidence. The
full-suite visual failures remain recorded for review; they are outside the WP02 code diff,
and this report does not authorize baseline updates or a waiver.
