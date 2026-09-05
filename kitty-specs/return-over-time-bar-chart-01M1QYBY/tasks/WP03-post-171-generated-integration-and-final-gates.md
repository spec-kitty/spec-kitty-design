---
work_package_id: WP03
title: Generated integration and final target gates
dependencies:
- WP02
requirement_refs:
- FR-003
- FR-014
- FR-020
- FR-022
- FR-023
- FR-024
- NFR-001
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
- C-007
- C-008
- C-009
- C-010
- C-011
planning_base_branch: mission/return-over-time-bar-chart
merge_target_branch: mission/return-over-time-bar-chart
branch_strategy: Planning artifacts for this mission were generated on mission/return-over-time-bar-chart. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/return-over-time-bar-chart unless the human explicitly redirects the landing branch.
subtasks:
- T014
- T015
- T016
- T017
- T018
- T019
phase: Phase 3 - Serial generated integration and PR readiness
history:
- timestamp: '2026-09-05T07:30:00Z'
  agent: codex
  action: Prompt authored from the approved specification and plan
authoritative_surface: packages/elements/custom-elements.json
create_intent:
- fixtures/react-consumer/src/sk-bar-chart.test.tsx
execution_mode: code_change
owned_files:
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/react/src
- packages/react/.wrapper-floor
- packages/react/type-tests/wrappers.type-test.tsx
- fixtures/react-consumer/src/sk-bar-chart.test.tsx
- fixtures/vue-consumer/src/Good.vue
- fixtures/vue-consumer/src/types.test-d.ts
- fixtures/vue-consumer/src/vue-interop.test.ts
- scripts/check-vue-packed-types.mjs
- packages/elements/SIZES.md
- apps/storybook/src/tests/visual.spec.ts-snapshots
- expected-docs.json
- behaviours.json
- mutations.json
- CHANGELOG.md
- docs
tags:
- generated
- react
- vue
- gates
tracker_refs:
- '#148'
- 'PR #171'
---

# WP03 — Generated integration and final target gates

This package owns the sole serial integration point for CEM, React, Vue, `expected-docs.json`, and
SIZES. PR #171 is already merged as `8e654e8`, and planning target
`mission/return-over-time-bar-chart` records train `dcf7af2`. WP01–WP03 reuse one `lane-a`
workspace/branch; they do not consolidate into the internal mission branch between packages. The
orchestrator verifies that unchanged reused lane before this package is claimed. From the lane,
regenerate shared
artifacts through the landed generic property-only mechanism, prove the React and Vue contracts,
run every repository gate, dispose CI visual evidence, and make the mission PR exact-head ready.

## Entry guard

This guard is an orchestrator checkpoint before WP03 is claimed. Approved WP01 and WP02 remain in
reused worktree `.worktrees/return-over-time-bar-chart-01M1QYBY-lane-a` on branch
`kitty/mission-return-over-time-bar-chart-01M1QYBY-lane-a`; lane→internal-mission→planning-target
consolidation happens only at merge. Resolve the actual existing workspace and branch with the
read-only `spec-kitty orchestrator-api resolve-workspace --mission
return-over-time-bar-chart-01M1QYBY --wp WP03` command.

Require the resolved lane worktree to be clean and verify ancestry from the recorded
`lanes.json.planning_commit_sha`, #171 merge `8e654e8`, and all approved WP01/WP02 content. Do not
rebase this lane if train advanced. Spec Kitty 3.2.6rc4 freezes the recorded planning commit after
execution begins, and re-finalization cannot replace that provenance; a mid-execution rewrite would
make later same-lane allocation stale. Claim WP03 normally on the unchanged lane. The worker never
rebases, cherry-picks, or updates the planning target/internal mission branch.

## Subtasks

### T014 — Verify the unchanged reused lane and planning provenance

Once claimed, verify the resolved WP03 workspace is the reused `lane-a` path/branch, descends from
the recorded planning commit and #171 merge `8e654e8`, and retains all approved WP01/WP02 patch
content. Record the planning SHA, lane tip, ancestry checks, and approved WP SHAs; require a clean
starting tree. The lane need not contain a train commit published after execution began. If its
recorded ancestry or approved content is missing, stop and return control to the orchestrator. Do
not rebase or cherry-pick inside the worker task, update either integration branch, or merge train
to main.

### T015 — Reconcile the final shared generated surface

First verify the WP02-refreshed CSS modules and WP01 token catalogue satisfy their final checks.
Then run styles-only markup generation, element analyze, React wrapper generation, Vue declaration
generation, the non-empty release-graph-derived publishable build, and size measurement in the
exact order specified by `plan.md`. Commit CEM, React sources/floor, `packages/elements/vue.d.ts`,
SIZES, and the CEM-derived `expected-docs.json` reconciliation only from their authoritative
sources. Never hand-edit generated outputs. Confirm all subsequent `--check`/diff commands are
byte-clean.

### T016 — Prove the CEM, generated React, and generated Vue public contracts

Assert the manifest exposes four documented attributes, the property-only readonly `series`, zero
methods, all seven parts, and typed non-cancelable event detail. Create the dedicated
`fixtures/react-consumer/src/sk-bar-chart.test.tsx` to prove series assignment before definition,
identity replacement, prop removal to a fresh frozen empty array, `selectable`/`selectedId`, and
typed selection delivery on the actual element. Register `react-bar-chart` independently for
SC-006 and SC-010 and add bar-specific generated-wrapper mutations so unrelated tests in
`wrappers.test.tsx` cannot certify absence. Extend type tests with positive readonly usage and
negative malformed datum/nonexistent detail cases; `any` is forbidden.

Regenerate `packages/elements/vue.d.ts` from the same CEM and prove it includes the property-only
readonly `series` field. Extend `fixtures/vue-consumer/src/Good.vue` with real SFC usage,
`types.test-d.ts` with positive and negative property-shape checks, and the existing Vue runtime
fixture with property assignment/replacement coverage. Extend `scripts/check-vue-packed-types.mjs`
without removing #149's transition-matrix coverage: its real-tarball/no-path-alias consumer must
derive the built bar-chart props as
`InstanceType<GlobalComponents['sk-bar-chart']>['$props']['series']` (the concrete instance form of
the `GlobalComponents['sk-bar-chart']['$props']['series']` contract), accept a positive readonly
series, and use `@ts-expect-error` malformed cases (including a missing required datum field and a
non-numeric `value`) so loss or widening of the property makes the gate fail. Run
`build-vue-types.mjs --check` and `check-vue-template-types.mjs`, then run the extended
`check-vue-packed-types.mjs` only after the derived publishable graph is built.

### T017 — Run the complete local production gate

Run every command listed in `plan.md`, in order: security/lockfile/action pins; all generators and
drift checks; styles-only markup; CSS drift plus adopted-boundary/entry selftests and checks;
wrapper/manifest/wiring; non-empty derived publishable build; release graph; Vue source and packed
checks; sizes/SRI;
offline selftest/check; type/quality; timed behavior; mutation harness plus its selftest; Storybook;
a11y selftest/axe; and full nonvisual Playwright. No command, selftest, empty-set guard, or check may
be omitted, substituted with a narrative claim, or treated as optional. Do not require a local
visual comparison to pass before CI-authoritative baselines exist; T019 is the sole visual gate.
`suite-selftest.mjs` must kill all nine registered bar-chart mutations—seven element arms across
six pairs plus two React arms—inside its 560-second ceiling; do not raise the ceiling from a local
estimate. The final generated commit must leave `git status --porcelain` empty.

### T018 — Update durable delivery evidence

Update the changelog/component documentation with exact API, tokens, parts, event flags, and the
controlled ownership boundary. Recheck #112: if its formal conformance artifact exists on the
refreshed train, add and test #148's required row; only otherwise record the verified open-state
deferral. Through Spec Kitty's runtime-owned acceptance workflow, replace every placeholder in
`acceptance-matrix.json` and `issue-matrix.json` with concrete test/gate/artifact references for
every FR, NFR, constraint, and negative invariant; never claim those generated matrices as WP-owned
source files. Use `Refs #148`, not `Closes`.

### T019 — CI visual disposition and exact-head review readiness

At every integration/push boundary, return control to the orchestrator/runtime workflow; the WP
worker does not rebase or directly update an integration branch. At the supported merge transition,
that workflow consolidates the completed lane into internal mission branch
`kitty/mission-return-over-time-bar-chart-01M1QYBY`, updates planning/landing target
`mission/return-over-time-bar-chart`, and creates the actual PR head for
`train/elements-first`. The orchestrator then fetches `origin`, requires a clean target, rebases it
onto latest `origin/train/elements-first`, regenerates and commits every shared output from its
authoritative source, and reruns every mandatory `plan.md` gate, in order, on that exact clean
target head. Lane evidence and tree equivalence are not substitutes. If the rebase or rerun changes
generated bytes, commit via the authorized target workflow and rerun the complete list at the new
head. If train advances again before acceptance, repeat the final-target rebase, regeneration, and
full gate sequence.

Let the first visual run fail for missing baselines. Download its
`visual-regression-diffs` actuals, reacquire and verify the named Stitch authority, review the
crops, copy the exact approved CI bytes into `visual.spec.ts-snapshots/`, commit, and push. Require
a fresh green visual/full CI run at the new
head; never treat the pre-baseline SHA as final evidence. Query the Actions job API for the exact
`Storybook build` step's `started_at`/`completed_at`, record the calculation, and reject acceptance
at 180 seconds or more.

Then run the mandated pre-merge squad with Codex agents only, all three issue-required lenses
reporting against the exact final PR head, fold blocking findings (at most two passes), and post the
SHA/profile/verdict/file:line/disposition evidence. Any head change stales both CI and squad
evidence and requires them again. A current-head maintainer approval is mandatory before merge.

## Acceptance checklist

- #171 merge `8e654e8` is present on the final train base and its generic property-only
  mechanism—not a #148 duplicate—drives every framework output.
- CEM/React/Vue expose exact property types, four attributes, one property-only series field, zero
  methods, and seven parts; CEM/React retain non-cancelable typed `{ id }` event detail.
- React replacement/removal uses the production hook and leaves no stale bars or mutable default.
- Vue generation/check, real SFC/type/runtime coverage, and the post-build packed-consumer gate all
  exercise the bar-chart property-only field without source-alias masking; the packed script keeps
  #149 coverage and its positive readonly plus malformed negative cases are load-bearing.
- The WP03 workspace is the resolver-confirmed unchanged `lane-a`, descends from the finalized
  planning commit and #171, and contains approved WP01/WP02 patch content; no worker or orchestrator
  rebased the execution lane. The consolidated target is separately rebased onto latest train.
- All generation/drift/type/quality/test/mutation/Storybook/axe/cross-browser/visual gates pass on
  the clean consolidated target/PR head—not only the lane; all nine mutations are killed and
  Storybook is under 180 seconds in CI.
- Approved visual crops have explicit CI-authoritative disposition.
- Every FR/NFR/constraint and negative invariant has non-placeholder durable acceptance evidence.
- Pre-merge Codex squad evidence and maintainer approval match the PR head.
- The PR targets only `train/elements-first`; no publish, release, deployment, issue-closing keyword,
  train-to-main merge, or downstream #150 composition is performed.
