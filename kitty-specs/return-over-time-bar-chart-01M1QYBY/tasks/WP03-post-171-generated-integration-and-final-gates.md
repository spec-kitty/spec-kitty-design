---
work_package_id: WP03
title: Generated integration and lane gates
dependencies:
- WP01
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
- C-007
- C-008
- C-010
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
phase: Phase 2 - Dependent generated integration and lane verification
history:
- timestamp: '2026-09-05T07:30:00Z'
  agent: codex
  action: Prompt authored from the approved specification and plan
authoritative_surface: packages/elements/custom-elements.json
create_intent:
- fixtures/react-consumer/src/sk-bar-chart.test.tsx
- scripts/build-storybook-with-budget.mjs
execution_mode: code_change
owned_files:
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/react/src/**
- packages/react/.wrapper-floor
- packages/react/type-tests/wrappers.type-test.tsx
- fixtures/react-consumer/src/sk-bar-chart.test.tsx
- fixtures/vue-consumer/src/Good.vue
- fixtures/vue-consumer/src/types.test-d.ts
- fixtures/vue-consumer/src/vue-interop.test.ts
- scripts/check-vue-packed-types.mjs
- scripts/build-storybook-with-budget.mjs
- scripts/check-gate-wiring.mjs
- .github/workflows/ci-quality.yml
- packages/elements/SIZES.md
- expected-docs.json
- behaviours.json
- mutations.json
- CHANGELOG.md
- docs/design-system/using-components.md
- docs/design-system/changelog.md
tags:
- generated
- react
- vue
- gates
tracker_refs:
- '#148'
- 'PR #171'
---

# WP03 — Generated integration and lane gates

This package owns the sole serial integration point for CEM, React, Vue, `expected-docs.json`, and
SIZES. PR #171 is already merged as `8e654e8`, and planning target
`mission/return-over-time-bar-chart` records train `0fde2ab`. WP01 is approved first on `lane-a`;
only then does the supported allocator create dependent `lane-b` and propagate the approved WP01
tip without inter-WP mission consolidation. From `lane-b`, regenerate shared
artifacts through the landed generic property-only mechanism, prove the React and Vue contracts,
run every locally applicable repeatable gate, and hand the clean approved lane to mission wrap-up.
WP03 owns the fail-closed Storybook budget wrapper and the workflow change that invokes it, but it
does not own final-head CI evidence, snapshot bytes, CI visual disposition, fresh CI, the pre-merge
squad, maintainer approval, final-head WebKit/mutation-fleet measurement, `suite-budget.json`
terminal disposition, or PR readiness.

## Entry guard

Before WP03 is claimed, require WP01 to be approved on clean `lane-a`; do not manually consolidate
that tip into the internal mission branch. Claim WP03 normally so Spec Kitty creates dependent
`lane-b` from the recorded planning lineage and merges the approved dependency-lane tip through
its supported allocator. Immediately after the claim, resolve the actual workspace and branch with
the read-only `spec-kitty orchestrator-api resolve-workspace --mission
return-over-time-bar-chart-01M1QYBY --wp WP03` command.

Require resolved `lane-b` to be clean and verify ancestry from the recorded
`lanes.json.planning_commit_sha`, #171 merge `8e654e8`, and the exact approved WP01 `lane-a` tip.
Spec Kitty 3.2.6rc4 freezes the recorded planning commit after execution begins, and
re-finalization cannot replace that provenance. The allocator alone owns dependency-tip
propagation; the worker never rebases, cherry-picks, manually merges, or updates the planning
target/internal mission branch.

## Subtasks

### T014 — Verify dependent-lane propagation and planning provenance

Once claimed, verify the resolved WP03 workspace is `lane-b`, descends from the recorded planning
commit and #171 merge `8e654e8`, and contains the exact approved WP01 `lane-a` tip. Record the
planning SHA, both lane tips, propagation ancestry checks, and approved WP01 SHA; require a clean
starting tree. `lane-b` need not contain a train commit published after execution began. If its
recorded ancestry or approved content is missing, stop and return control to the orchestrator. Do
not rebase, cherry-pick, or manually merge inside the worker task, update either integration branch,
or merge train to main.

### T015 — Reconcile the final shared generated surface

First verify the WP01-refreshed CSS modules and token catalogue satisfy their final checks,
using the plan's non-writing full source-to-catalogue comparison that ignores only `generated_at` and
does not write the tracked catalogue. WP03 must not run the timestamp-writing catalogue generator.
Then run styles-only markup generation, uncached element analyze with `--skip-nx-cache`, React
wrapper generation, Vue declaration generation, the non-empty release-graph-derived publishable
build with `--skip-nx-cache`, and size measurement in the exact order specified by `plan.md`. Commit CEM, React
sources/floor, `packages/elements/vue.d.ts`,
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
`wrappers.test.tsx` cannot certify absence. As the sole writer of `behaviours.json` and
`mutations.json`, also register WP01's standing element fixture for SC-006/007/008/010/013/014 with
exactly seven element arms: one per pair except separate SC-014 sheet-length and sheet-identity
arms. Run every mutation against its named standing assertion and require the final total of nine
element-plus-React arms. Extend type tests with positive readonly usage and negative malformed
datum/nonexistent detail cases; `any` is forbidden.

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

### T017 — Run the complete repeatable local production gate

Create `scripts/build-storybook-with-budget.mjs` as the one fail-closed Storybook build entry point.
It must spawn `npx nx run storybook:storybook:build --skip-nx-cache`, forward output and exit status, use a default
deadline of exactly 180,000 ms, terminate the child process tree on deadline, and exit nonzero for
timeout, spawn error, signal, or child failure. Its `--selftest` must exercise both a successful
short-lived injected child and a deliberately short timeout child, assert cleanup/nonzero timeout
behavior, and never invoke a real Storybook build. Change `.github/workflows/ci-quality.yml` so the
enforced Storybook step calls this wrapper rather than raw Nx; keep the broader job timeout only as
an infrastructure ceiling, not as the NFR-009 implementation. Preserve the Storybook job's
deliberate relevant-change predicate—it must not run for unrelated changes—but make the wrapper
build step unconditional once that job is selected. Extend `scripts/check-gate-wiring.mjs` so it
fails if the Storybook job is absent or loses/misstates that deliberate predicate, if the enforced
build step has its own `if`, if either the job or step uses `continue-on-error`, if wrapper failure
is swallowed, if the exact wrapper is missing or replaced, or if raw `nx ... storybook:build`
remains. Add a load-bearing `--selftest` that runs the checker against isolated temporary fixtures
through a fixture-only workflow-input seam; the normal command must remain pinned to the canonical
workflow and expose no production bypass. The probe table must contain one valid green fixture and
independent nonzero/diagnostic arms for: missing job; lost relevant-change predicate; wrong job
condition; forbidden build-step condition; job `continue-on-error`; step `continue-on-error`;
`|| true`/`set +e`/forced-success failure swallowing; missing wrapper; wrong wrapper; and raw Nx.
Change CI's repeatable wiring block to run `node scripts/check-gate-wiring.mjs --selftest`
immediately before `node scripts/check-gate-wiring.mjs`. Do not add `storybook-build` to the
checker's set of jobs that must run for every change; the wiring assertion is source-structural and
independent of a live CI run.

After T015's one-time generated-output update is committed, run every command in the repeatable
verification sequence listed in `plan.md`, in order: security/lockfile/action pins; generator drift
checks including uncached `elements:analyze --skip-nx-cache`; styles-only markup; CSS drift plus
adopted-boundary/entry selftests and checks; wrapper/manifest/wiring; non-empty derived publishable
build; release graph; Vue source and packed checks; sizes/SRI; offline selftest/check; type/quality;
timed behavior; mutation harness plus its selftest; the Storybook budget-wrapper selftest and the
real wrapper invocation; a11y selftest/axe; and nonvisual Playwright in locally available Chromium
and Firefox with `npx playwright test --project=chromium --project=firefox`. The shared tests still
author the WebKit contract, but exact-head PR CI owns its required result. This repository has no
named WebKit container seam at planning head; do not invent one. No command, selftest,
empty-set guard, or check may be omitted, substituted with a narrative claim, or treated as
optional. Do not require a local visual comparison to pass before CI-authoritative baselines exist;
mission wrap-up after WP03 approval is the sole owner of visual baseline acceptance.
`suite-selftest.mjs` must kill all nine registered bar-chart mutations—seven element arms across
six pairs plus two React arms—inside its 560-second ceiling; do not raise the ceiling from a local
estimate or change `suite-budget.json` in WP03. The terminal mission-wrap-up owner records the
exact-head CI fleet counts/time and disposes the measurement row; an over-budget CI result stops
readiness for filtered subject-scoped harness remediation rather than raising 560. The final
generated commit must leave `git status --porcelain` empty.

### T018 — Update durable lane evidence

Update the changelog/component documentation with exact API, tokens, parts, event flags, and the
controlled ownership boundary. Do not decide #112 from this intentionally frozen execution lane;
the orchestrator rechecks it from the latest-train planning target during mission wrap-up after
WP03 approval. Through Spec Kitty's runtime-owned acceptance workflow, record supported existing-FR
verdicts and negative invariants only when concrete lane evidence exists, and update supported
existing issue-verdict fields only when truthful. Do not hand-edit either generated matrix. The
installed CLI cannot add NFR/constraint criteria, replace scaffold criterion descriptions/notes,
complete all issue-row metadata, or represent a terminal wrap-up owner; report that exact capability
blocker and leave acceptance incomplete rather than fabricating a complete matrix. The explicit
owner ledger in `tasks.md` assigns CI visual disposition, final-head budget/fresh CI, final
integration/#112, PR, pre-merge squad, and maintainer evidence to mission wrap-up. Use `Refs #148`,
not `Closes`.

### T019 — Record the clean lane handoff

Record the clean `lane-b` head, the approved WP01 `lane-a` head, finalized planning SHA, #171 ancestry,
one-time generation commit, and repeatable gate transcript. Return control to the orchestrator and
confirm that WP03 is the only registry/generated/closure writer and that its owned-file set is
disjoint from WP01's authored surface, naming the before/after lane SHAs. Move WP03 through normal
independent review. The worker does not rebase or directly update either
integration branch, inspect latest-train #112 state, consolidate the mission, harvest CI baseline
bytes or disposition, require fresh CI, run the pre-merge squad, seek maintainer approval, or claim
PR readiness; those are mission-wrap-up actions that begin only after WP03 is approved.

## Acceptance checklist

- #171 merge `8e654e8` is present on the final train base and its generic property-only
  mechanism—not a #148 duplicate—drives every framework output.
- CEM/React/Vue expose exact property types, four attributes, one property-only series field, zero
  methods, and seven parts; CEM/React retain non-cancelable typed `{ id }` event detail.
- React replacement/removal uses the production hook and leaves no stale bars or mutable default.
- Vue generation/check, real SFC/type/runtime coverage, and the post-build packed-consumer gate all
  exercise the bar-chart property-only field without source-alias masking; the packed script keeps
  #149 coverage and its positive readonly plus malformed negative cases are load-bearing.
- The WP03 workspace is resolver-confirmed dependent `lane-b`, descends from the finalized planning
  commit and #171, and contains the exact approved WP01 `lane-a` tip through supported allocator
  propagation; no worker or orchestrator manually rebased, cherry-picked, or merged either lane.
- Approved `lane-b` is clean, contains the one-time generated-output update, and passes the
  repeatable generation-drift/type/quality/test/mutation/Storybook/axe/cross-browser gates; all nine
  mutations are killed. Local lane cross-browser evidence is Chromium+Firefox; exact-head CI owns
  WebKit. Storybook runs only through the self-tested wrapper and fails closed at 180 seconds
  locally and in CI. Gate-wiring selftests kill every required invalid fixture class before the
  canonical workflow check runs.
- Every matrix row the supported CLI can truthfully update has durable lane evidence. Unsupported
  NFR/C/owner/metadata initialization remains an explicit tool blocker—never a hand-edited claim;
  CI visual, final-head CI/build-budget, squad, approval, and PR criteria remain assigned to the
  terminal mission-wrap-up owners in `tasks.md`.
- The handoff explicitly leaves latest-train refresh/#112 evaluation, consolidation, CI visual
  disposition, exact-head WebKit and mutation-fleet/`suite-budget.json` disposition, pre-merge
  Codex squad, maintainer approval, and PR readiness to mission wrap-up.
- No publish, release, deployment, issue-closing keyword, train-to-main merge, or downstream #150
  composition is performed.
- Review receives exact before/after lane SHAs and proves WP03 exclusively owns the registry,
  generated, documentation, wrapper, and CI surfaces with no dependent ownership overlap.

## Activity Log

- Pending implementation.
