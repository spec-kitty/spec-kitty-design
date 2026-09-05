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

Verify the workspace base contains the exact approved WP01/WP02 commits. Coordinate before any full browser/mutation run so no other mission runs a competing heavy fleet. Do not invoke Claude or Claude-backed tooling.

## Objective

Turn the approved local component sources into one complete public design-system contract: runtime entries, styles export reachability, exact documentation/part/story ratchets, generated manifest/React/Vue/size artifacts, React runtime/type proof, Storybook functional/accessibility/visual coverage, synchronized docs/changelogs, and every local production gate. This WP creates no new component behavior and does not open/merge a PR.

## Scope and requirements

Allowed writes are exactly the frontmatter `owned_files`. WP01/WP02 component sources are read-only inputs. Generators may read/rewrite their local generated stylesheet bytes only if output is byte-identical; an actual diff outside owned files is a blocker, not permission to absorb it.

This WP covers FR-014–FR-016, NFR-001–NFR-006, C-001–C-008, and the end-to-end success criteria. It does not independently claim the post-approval train refresh, CI/WebKit, CI-authoritative baselines, Tier C exact-head review, maintainer approval, merge, or issue closure.

### T009 — Entries, exports, ratchets, and docs

1. Add runtime value exports for `SkMetric`, `SkEvidenceChain`, and `EvidenceStage` where appropriate. Ensure both ESM and IIFE entries actually resolve the two component modules; an erased type export is not runtime registration.
2. Add `./metric/*` and `./evidence-chain/*` to `packages/styles/package.json`. Do not create styles-layer `index.ts`/HTML because no static forms exist.
3. Update `expected-docs.json` from the current implementation-time train baseline:
   - metric: 5 attributes, 0 property-only fields, 0 methods;
   - evidence-chain: 0 attributes, 1 property-only field, 0 methods;
   - exact total delta: +6.
4. Update `expected-parts.json` with five metric and four chain parts; exact total delta +9. Its comments/data/count must agree, and every literal part has a test in the approved fixture files.
5. Add the exact six metric and nine chain Storybook IDs to `expected-stories.json`; exact total delta +15. Derive actual IDs from the built index rather than guessing punctuation.
6. Update root `CHANGELOG.md` to mention exactly the two new manifest tags and correct any directly affected count/list so `check-release-graph.mjs` compares equal. Do not opportunistically repair unrelated historical prose.
7. Synchronize `docs/design-system/using-components.md`, `docs/design-system/using-react.md`, and `docs/design-system/changelog.md` with the public contract, readonly assignment example, no-static-form rationale, and generic ownership boundary.
8. Search authored/generated package code for Team Kitty imports and forbidden public tags/names. Story fixture strings are the only permitted domain example.

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
3. Do not add behavior/mutation registry pairs. This fixture verifies the generic property-only seam already shipped by #149; it does not create an event or interactive behavior.
4. Add focused Playwright specs that load the real Storybook IDs and fail on blank/non-upgraded output. Assert metric definition semantics, chain ordered-list/direct-item semantics, exact two/four/six counts/order, composed metric count, connector count, invalid state, and narrow CSS direction without DOM order change.
5. Extend `visual.spec.ts` with approved dark, light, compact/long, two/six, and narrow targets. Never commit local actuals or call `--update-snapshots`; CI-produced bytes are the baseline authority.
6. Build Storybook, inspect its `index.json` for all fifteen IDs, and run axe with zero violations. Missing story/load/render is failure, not zero-violation success.

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
npx nx run storybook:storybook:build
node scripts/run-axe-storybook.js
npx playwright test apps/storybook/src/tests/sk-metric.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-metric.spec.ts --project=firefox
npx playwright test apps/storybook/src/tests/sk-evidence-chain.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-evidence-chain.spec.ts --project=firefox
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

The visual command may fail only because approved baselines are absent; record the actual output paths and treat them as diagnostic, not as committed evidence. WebKit is required by final unqualified CI but local system-library installation is not authorized. The full mutation fleet must pass unchanged; no new arm/count is expected.

### T013 — Exact-scope closeout

1. Inspect status/diff against the assigned dependency base. Ensure no sibling authored component, Team Kitty source, token, dependency/lockfile, ADR, behavior/mutation registry, static markup, or other mission dossier changed.
2. Re-run generators/checks after the targeted commit so exact-head evidence is not taken only on unstaged bytes.
3. Record command, exit status, relevant counts, Storybook duration, axe story/violation count, tests, mutation count/time, and any qualified local visual/WebKit limitation without claiming unavailable gates passed.
4. Use Spec Kitty's targeted safe-commit/review flow and require a clean tracked/staged/untracked worktree. Do not push or open/merge a PR.
5. Hand off the three frozen approved WP heads to mission closeout. Closeout refreshes the canonical mission target onto the then-current train **before** consolidation, consolidates WP01 → WP02 → WP03, regenerates once, reruns the full gate, then opens the one issue-level PR.

## Definition of Done

- [ ] Both tags reach real ESM/IIFE runtime entries and both styles directories have package subpaths.
- [ ] Docs/parts/story ratchets match exact manifest/index data with deltas +6/+9/+15 from the implementation-time baseline.
- [ ] Manifest, React/Vue, CSS modules, and sizes are generator-owned and byte-stable across repeat generation.
- [ ] React types/runtime preserve the readonly stage contract, identity/replacement/reset, no attribute, and no `any`.
- [ ] All planned Storybook scenarios are nonblank, axe-zero, functionally verified, and locally captured only as diagnostics.
- [ ] Release graph/changelogs mention exactly the new public tags without unrelated scope.
- [ ] Full repository tests and existing mutation fleet pass serially; no behavior/mutation subject was added.
- [ ] All deterministic/type/quality/build/content gates pass at the WP03 commit.
- [ ] Diff contains only `owned_files`, one focused commit, no push/PR/merge/close/publish/deploy.
- [ ] Closeout handoff explicitly leaves latest-train consolidation, CI/WebKit, authoritative baselines, Tier C, maintainer, and merge authority unclaimed.

## Risks

- **Generated wrapper names an absent alias:** inspect output and keep source manifest types structural; never patch `.d.ts` by hand.
- **React holds stale structured data:** prove initial, replacement, and omitted-prop reset identities under StrictMode.
- **Ratchet arithmetic races train changes:** compute deltas from the implementation-time refreshed baseline, not this planning snapshot.
- **Release graph fails after correct generation:** add exactly the new manifest tags to root changelog; do not weaken the gate.
- **Heavy fleet contention causes false timeouts:** coordinate and serialize `npm test`/mutation/Storybook/browser runs.
- **WP approval is mistaken for merge authority:** final CI/squad/maintainer evidence belongs only to the post-consolidation PR head.

## Reviewer guidance

Reject for any out-of-frontmatter diff, hand-edited generated file, missing/runtime-erased entry, unexported CSS subpath, incorrect ratchet counts, untyped/attributed stage prop, stale React reset, Team-specific public API/default, behavior/mutation registration, local baseline substitution, sibling authored change, new token/dependency, incomplete gate evidence, dirty worktree, push/PR, or a claim that WP03 approval authorizes merge. Approval covers WP03 only.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-06T00:00:00Z – system – Planning prompt finalized; implementation has not started.
