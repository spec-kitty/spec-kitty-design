---
work_package_id: WP03
title: Public surfaces and verification closure
dependencies:
- WP01
- WP02
requirement_refs:
- FR-014
- FR-015
- FR-016
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
planning_base_branch: mission/delivery-return-metric-elements
merge_target_branch: mission/delivery-return-metric-elements
branch_strategy: Planning artifacts for this mission were generated on mission/delivery-return-metric-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/delivery-return-metric-elements unless the human explicitly redirects the landing branch.
subtasks:
- T009
- T010
- T011
- T012
- T013
phase: Phase 3 - Public integration and verification
history: []
agent_profile: frontend-freddy
authoritative_surface: packages/elements/custom-elements.json
create_intent:
- packages/react/src/SkMetric.js
- packages/react/src/SkMetric.d.ts
- packages/react/src/SkEvidenceChain.js
- packages/react/src/SkEvidenceChain.d.ts
- fixtures/react-consumer/src/sk-evidence-chain.test.tsx
- apps/storybook/src/tests/sk-metric.spec.ts
- apps/storybook/src/tests/sk-evidence-chain.spec.ts
- scripts/check-component-public-contract.mjs
- scripts/check-component-token-literals.mjs
- scripts/build-storybook-with-budget.mjs
execution_mode: code_change
owned_files:
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- packages/styles/package.json
- expected-docs.json
- expected-parts.json
- expected-stories.json
- packages/elements/custom-elements.json
- packages/react/src/SkMetric.js
- packages/react/src/SkMetric.d.ts
- packages/react/src/SkEvidenceChain.js
- packages/react/src/SkEvidenceChain.d.ts
- packages/react/src/index.js
- packages/react/src/index.d.ts
- packages/react/src/react-utils.js
- packages/react/.wrapper-floor
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- scripts/check-component-public-contract.mjs
- scripts/check-component-token-literals.mjs
- scripts/build-storybook-with-budget.mjs
- packages/react/type-tests/wrappers.type-test.tsx
- fixtures/react-consumer/src/sk-evidence-chain.test.tsx
- apps/storybook/src/tests/sk-metric.spec.ts
- apps/storybook/src/tests/sk-evidence-chain.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/*metric*.png
- apps/storybook/src/tests/visual.spec.ts-snapshots/*evidence-chain*.png
- docs/design-system/using-components.md
- docs/design-system/using-react.md
- docs/design-system/changelog.md
- CHANGELOG.md
priority: P1
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#147'
- '#144'
---

# WP03 — Public surfaces and verification closure

## Do this first

Load the `frontend-freddy` profile and use Codex as the implementation agent. Enter only the dependency-aware workspace returned by:

```sh
spec-kitty agent action implement WP03 --agent codex --mission delivery-return-metric-elements-01M1STPA
```

Do not claim WP03 until #145/#146 are verified on `origin/train/elements-first`, the clean mission target has been refreshed through the supported stale-state/git workflow, and approved WP01→WP02 have been supported-consolidated onto it. Verify the returned workspace contains the recorded train, WP01, WP02, and integrated-target SHAs. If it does not, stop as blocked rather than assembling a manual substitute. Coordinate before any full browser/mutation run so no other mission runs a competing heavy fleet. Do not invoke Claude or Claude-backed tooling.

## Objective

Turn the approved, integrated component sources into one complete public design-system contract: runtime entries, styles export reachability, exact documentation/part/story contracts, parsed token-literal enforcement, generated manifest/React/Vue/size artifacts, React runtime/type proof, literal approved composition, computed theme variance, active forced-colors coverage, synchronized docs/changelogs, an enforced 180-second Storybook build budget, and every local production gate. This WP creates no new component behavior and does not open/merge a PR.

## Scope and requirements

Allowed writes are exactly the frontmatter `owned_files`. WP01/WP02 component sources are read-only inputs. Generators may read/rewrite their local generated stylesheet bytes only if output is byte-identical; an actual diff outside owned files is a blocker, not permission to absorb it. The three new scripts are generic, dependency-free gates scoped by explicit CLI inputs; they must not mutate repository files.

This WP covers FR-014–FR-016, NFR-001–NFR-006, C-001–C-008, and the end-to-end success criteria. The required train refresh and WP01→WP02 consolidation happen before this WP. It does not independently claim post-approval train stability, CI/WebKit, CI-authoritative baselines, Tier C exact-head review, maintainer approval, merge, or issue closure.

### T009 — Entries, exports, ratchets, and docs

1. Add runtime value exports for `SkMetric`, `SkEvidenceChain`, and `EvidenceStage` where appropriate. Ensure both ESM and IIFE entries actually resolve the two component modules; an erased type export is not runtime registration.
2. Add `./metric/*` and `./evidence-chain/*` to `packages/styles/package.json`. Do not create styles-layer `index.ts`/HTML because no static forms exist.
3. Update `expected-docs.json` from the recorded latest-train + approved-WP01/WP02 integrated baseline:
   - metric: 5 attributes, 0 property-only fields, 0 methods;
   - evidence-chain: 0 attributes, 1 property-only field, 0 methods;
   - exact total delta: +6.
4. Update `expected-parts.json` with five metric and four chain parts; exact total delta +9. Its comments/data/count must agree, and every literal part has a test in the approved fixture files.
5. Add the exact six metric and nine chain Storybook IDs to `expected-stories.json`; exact total delta +15. Derive actual IDs from the built index rather than guessing punctuation.
6. Update root `CHANGELOG.md` to mention exactly the two new manifest tags and correct any directly affected count/list so `check-release-graph.mjs` compares equal. Do not opportunistically repair unrelated historical prose.
7. Synchronize `docs/design-system/using-components.md`, `docs/design-system/using-react.md`, and `docs/design-system/changelog.md` with the public contract, readonly assignment example, no-static-form rationale, and generic ownership boundary.
8. Search authored/generated package code for Team Kitty imports and forbidden public tags/names. Story fixture strings are the only permitted domain example.
9. Add `scripts/check-component-public-contract.mjs`: parse the committed manifest, accept explicit repeated `--tag name=part,...` expectations, and fail on missing, extra, duplicate, or zero parts for either tag. Its `--selftest` must prove both missing and extra declarations are detected; do not treat the shrink-only aggregate ratchet as exact evidence.
10. Add `scripts/check-component-token-literals.mjs`: parse only explicitly passed CSS files with the repository's existing parser and reject raw design-bearing values across color, spacing/gap, typography/line, radius, border/outline, shadow, motion, and z-index declarations. Document only CSS-wide/structural exceptions and prove every governed class red in `--selftest`; add no dependency.
11. Add `scripts/build-storybook-with-budget.mjs`: run the real `npx nx run storybook:storybook:build`, fail nonzero on child failure, timeout at 180 seconds, also fail a completed build over 180 seconds, and report elapsed time. Its internal `--selftest` uses short fixture children to prove success, nonzero, and timeout without waiting 180 seconds.

### T010 — Deterministic generation

Run generation exactly in recipe order:

```sh
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs
```

Inspect every generated diff. Requirements:

- manifest has exactly five metric attributes, one chain property-only field, zero events/methods/slots, and all nine parts;
- `stages` has no attribute and retains a readonly structural type/reset metadata through the existing normalizer seam;
- generated React declarations contain no unimported `EvidenceStage` or tone alias and no `any`;
- React runtime uses the existing property hook for `stages` and never serializes it;
- Vue declarations point safely at the element field type;
- package entries and named `skMetricSheet`/`skEvidenceChainSheet` exports resolve;
- a second generation is byte-identical.

Never hand-edit generated files to meet these assertions. Correct approved authored declarations, regenerate, and return through the affected WP review if source changes are needed.

### T011 — React and Storybook evidence

1. Extend `packages/react/type-tests/wrappers.type-test.tsx` with accepted metric scalar/literal props and readonly stage arrays plus `@ts-expect-error` cases for unsupported tones/malformed stages. Require no explicit/inferred `any`.
2. Add `fixtures/react-consumer/src/sk-evidence-chain.test.tsx`. In React StrictMode, assign a frozen sentinel array, verify the exact property identity after upgrade, replace with a second reference, then omit it and require a fresh frozen empty array. At every step require no `stages` attribute and no caller mutation.
3. This fixture verifies the generic property-only seam already shipped by #149; it does not create an event or interactive behavior. The operator-authorized remediation records only `sk-metric` and `sk-evidence-chain` as SC-013 styling-surface subjects, with one exact non-root part-removal mutation each, because the repository config contract requires every public element and every declared pair to be covered. Do not add a new behavior id, SC-014 pair, or any broader registry entry.
4. Add focused Playwright specs that load the real Storybook IDs and fail on blank/non-upgraded output. Assert metric definition semantics, chain ordered-list/direct-item semantics, exact two/four/six counts/order, composed metric count, connector count, invalid state, and narrow CSS direction without DOM order change.
5. In `ApprovedExample`, assert actual existing `SK-CARD` and `SK-GRID` wrapper tags around the chain and actual nested `SK-PILL-TAG` descendants for annotated stages. Presence of lookalike classes or markup does not pass.
6. Compare equivalent default-dark/`LightMode` stories for each new tag: content and semantic counts must agree, while at least one explicitly named approved token-driven computed property differs. A wrapper class alone is not evidence.
7. Add a Chromium case using Playwright `forcedColors: 'active'`. Assert stage boundaries/connectors remain distinguishable by computed style, connectors stay decorative, and ordered semantics/count remain unchanged. Pair it with WP02's recorded authored-CSS forced-colors source reversal.
8. Extend `visual.spec.ts` with approved dark, light, compact/long, two/six, and narrow targets. Never commit local actuals or call `--update-snapshots`; CI-produced bytes are the baseline authority.
9. Build Storybook only through the budget wrapper, inspect its `index.json` for all fifteen IDs, and run axe with zero violations. Missing story/load/render is failure, not zero-violation success.

### T012 — Complete local gate

Run light/deterministic gates before tests and the full mutation fleet:

```sh
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-styles-only-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check
node scripts/check-manifest-content.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs
node scripts/check-elements-entries.mjs --selftest
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-adopted-css-boundaries.mjs --selftest
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-component-public-contract.mjs --manifest packages/elements/custom-elements.json --tag sk-metric=metric,label,value,annotation,empty-state --tag sk-evidence-chain=list,stage,connector,empty-state
node scripts/check-component-public-contract.mjs --selftest
node scripts/check-component-token-literals.mjs packages/styles/src/metric/sk-metric.css packages/styles/src/evidence-chain/sk-evidence-chain.css
node scripts/check-component-token-literals.mjs --selftest
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/typecheck-all.mjs
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
node scripts/check-gate-wiring.mjs
node scripts/check-release-graph.mjs
node scripts/check-release-graph.mjs --selftest
npm run quality:all
git diff --check
```

Then, serially and without a competing browser fleet:

```sh
npm run test
node scripts/suite-selftest.mjs
node scripts/build-storybook-with-budget.mjs --selftest
node scripts/build-storybook-with-budget.mjs
node scripts/run-axe-storybook.js
npx playwright test apps/storybook/src/tests/sk-metric.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-metric.spec.ts --project=firefox
npx playwright test apps/storybook/src/tests/sk-evidence-chain.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-evidence-chain.spec.ts --project=firefox
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

The Storybook wrapper's success is the only accepted build-duration evidence; separately timing a plain build is insufficient. The visual command may fail only because approved baselines are absent; record the actual output paths and treat them as diagnostic, not as committed evidence. WebKit is required by final unqualified CI but local system-library installation is not authorized. The full mutation fleet must pass with the governed two-arm SC-013 addition and no other mission-created registry delta.

### T013 — Exact-scope closeout

1. Inspect status/diff against the assigned dependency base. Ensure no sibling authored component, Team Kitty source, token, dependency/lockfile, ADR, static markup, or other mission dossier changed. The behavior/mutation registry delta must be exactly the governed two-subject/two-arm SC-013 remediation and nothing else from this mission.
2. Re-run generators/checks after the targeted commit so exact-head evidence is not taken only on unstaged bytes.
3. Record command, exit status, relevant counts, exact manifest part sets, parsed token-class selftests, budget-wrapper duration/ceiling, axe story/violation count, tests, mutation count/time, active forced-colors result, per-tag dark/light computed-property deltas, and any qualified local visual/WebKit limitation without claiming unavailable gates passed.
4. Use Spec Kitty's targeted safe-commit/review flow and require a clean tracked/staged/untracked worktree. Do not push or open/merge a PR.
5. Record the WP03 base's train/WP01/WP02/integrated SHAs and hand off the approved WP03 head. Closeout first verifies `origin/train/elements-first` still equals the recorded train SHA. If unchanged, it supported-consolidates WP03 and continues exact-head PR gates. If changed, it invalidates this WP's evidence and returns WP03 through supported refresh/consolidation/implementation/review rather than rebasing an approved lane.

## Definition of Done

- [ ] Both tags reach real ESM/IIFE runtime entries and both styles directories have package subpaths.
- [ ] Docs/parts/story ratchets match exact manifest/index data with deltas +6/+9/+15 from the recorded integrated baseline.
- [ ] A parsed manifest gate proves the exact five/four part sets and every part is targeted in rendered fixtures; shrink-only counts cannot mask missing/extra declarations.
- [ ] Parsed CSS gate/selftests cover all governed token-literal property classes with no new dependency.
- [ ] Manifest, React/Vue, CSS modules, and sizes are generator-owned and byte-stable across repeat generation.
- [ ] React types/runtime preserve the readonly stage contract, identity/replacement/reset, no attribute, and no `any`.
- [ ] All planned Storybook scenarios are nonblank, axe-zero, functionally verified, and locally captured only as diagnostics.
- [ ] Approved composition contains real card/grid/pill tags, each tag has measured token-driven dark/light variance, and active forced colors preserves stage/connector distinction.
- [ ] Storybook's real build passes the fail-closed 180-second wrapper and its cheap success/nonzero/timeout selftests.
- [ ] Release graph/changelogs mention exactly the new public tags without unrelated scope.
- [ ] Full repository tests and the 134-arm combined mutation fleet pass serially; the only mission registry additions are the governed `sk-metric`/`sk-evidence-chain` SC-013 subjects and their exact part-removal arms.
- [ ] All deterministic/type/quality/build/content gates pass at the WP03 commit.
- [ ] Diff contains only `owned_files`, one focused commit, no push/PR/merge/close/publish/deploy.
- [ ] Closeout handoff explicitly leaves post-WP03 train-stability recovery, CI/WebKit, authoritative baselines, Tier C, maintainer, and merge authority unclaimed.

## Risks

- **Generated wrapper names an absent alias:** inspect output and keep source manifest types structural; never patch `.d.ts` by hand.
- **React holds stale structured data:** prove initial, replacement, and omitted-prop reset identities under StrictMode.
- **Ratchet arithmetic races train changes:** compute deltas only after the required refresh and WP01→WP02 consolidation; later movement invalidates WP03 evidence.
- **Release graph fails after correct generation:** add exactly the new manifest tags to root changelog; do not weaken the gate.
- **Heavy fleet contention causes false timeouts:** coordinate and serialize `npm test`/mutation/Storybook/browser runs.
- **A measured-but-unenforced Storybook duration is reported as pass:** only the fail-closed wrapper and its timeout selftest satisfy the budget.
- **WP approval is mistaken for merge authority:** final CI/squad/maintainer evidence belongs only to the post-consolidation PR head.

## Reviewer guidance

Reject for an unrecorded/non-current integration base; any out-of-frontmatter diff; hand-edited generated file; missing/runtime-erased entry; unexported CSS subpath; aggregate-only rather than exact per-tag part evidence; incomplete parsed token-class selftests; untyped/attributed stage prop; stale React reset; lookalike rather than literal card/grid/pill composition; wrapper-only rather than computed theme evidence; missing active forced-colors proof; measured but unenforced Storybook budget; Team-specific public API/default; behavior/mutation registration beyond the governed two-subject/two-arm SC-013 remediation; local baseline substitution; sibling authored change; new token/dependency; incomplete gate evidence; dirty worktree; push/PR; or a claim that WP03 approval authorizes merge. Approval covers WP03 only.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-06T00:00:00Z – system – Planning prompt finalized; implementation has not started.
