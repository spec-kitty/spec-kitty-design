# Tasks: Return-over-time bar chart

**Mission:** `return-over-time-bar-chart-01M1QYBY`
**Branch:** `mission/return-over-time-bar-chart`
**Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
**Tracker:** [`#148`](https://github.com/spec-kitty/spec-kitty-design/issues/148)
**Satisfied integration seam:** [`PR #171`](https://github.com/spec-kitty/spec-kitty-design/pull/171)
merged as `8e654e8`; this mission is rebased onto `train/elements-first` at `0fde2ab`.

## Overview

Two active work packages and nineteen subtasks form one strictly serial dependency chain across
two ownership-disjoint physical lanes. WP01 owns the complete
authored component: tokens, element/CSS, controlled interaction, stories, browser evidence, and
parts/story ratchets. WP03 alone owns behavior/mutation registries, CEM/React/Vue,
`expected-docs`, SIZES, and the fail-closed Storybook budget wrapper/CI wiring. The earlier planned
interaction-only WP02 is canceled before implementation because its whole scope is absorbed into
WP01. The operator-confirmed event is non-cancelable, bubbling, composed, and consumer-controlled.

```text
Recorded train seam: #171 @ 8e654e8 / train @ 0fde2ab
               │
               ▼
WP01 complete authored/browser contract ──▶ WP03 registries/generated/closure gates
```

## Subtask Index

| ID | Work | WP |
|---|---|---|
| T001 | Write failing validation, geometry/replacement, and literal-untrusted-text tests | WP01 |
| T002 | Add three dark/light semantic data tokens and computed binding/source-break proof | WP01 |
| T003 | Author the token-only bar-chart stylesheet | WP01 |
| T004 | Implement the immutable validation and proportional render model | WP01 |
| T005 | Register/export the element and styles subpath through the landed seam | WP01 |
| T006 | Author SC-010/013/014 standing assertions/source breaks and the exact parts ratchet | WP01 |
| T007 | Run the focused core checkpoint before interaction work | WP01 |
| T008 | Add failing controlled-selection and non-mutation tests | WP01 |
| T009 | Implement click-only dispatch plus non-dispatch held-key guard | WP01 |
| T010 | Author SC-006/007/008 standing assertions and load-bearing source breaks | WP01 |
| T011 | Add eight axe-enabled stories and asserted Storybook action spy | WP01 |
| T012 | Author three-project Playwright proofs; run Chromium/Firefox locally and reserve WebKit for exact-head CI | WP01 |
| T013 | Define visual scenarios, regenerate/check final authored CSS modules, and hand off WP01 | WP01 |
| T014 | Verify dependent lane-b contains the approved lane-a tip and frozen planning provenance | WP03 |
| T015 | Generate final CEM/React/Vue/SIZES outputs, reconcile expected docs, and non-destructively verify the WP01 token catalogue | WP03 |
| T016 | Prove CEM, dedicated React, and Vue source/SFC/packed contracts | WP03 |
| T017 | Add/self-test the fail-closed Storybook budget wrapper, wire CI to it, and run the complete non-visual local production gate | WP03 |
| T018 | Complete documentation and runtime-owned lane acceptance evidence | WP03 |
| T019 | Record the clean lane handoff for post-approval mission wrap-up | WP03 |

## Work Packages

### WP01 — Complete authored bar-chart and browser contract

- **Prompt:** [`tasks/WP01-authored-bar-chart-and-browser-contract.md`](./tasks/WP01-authored-bar-chart-and-browser-contract.md)
- **Dependencies:** none; the branch already contains #171 merge `8e654e8` through train `0fde2ab`.
- **Requirements:** FR-001–FR-021, FR-024; NFR-001–NFR-006; C-001–C-007. Mutation-registry quality
  NFR-008 remains with WP03; final visual disposition (NFR-010) remains mission wrap-up evidence.
- **Independent result:** the complete property-only chart validates and renders a readonly series,
  emits controlled non-cancelable intent, supplies all stories and locally available
  Chromium/Firefox browser evidence while authoring the WebKit contract for exact-head CI,
  and leaves final authored CSS modules/parts/stories clean. It owns no behavior/mutation registry,
  CEM/React/Vue/docs/SIZES, CI workflow, or baseline bytes.

### WP03 — Generated integration and lane gates

- **Prompt:** [`tasks/WP03-post-171-generated-integration-and-final-gates.md`](./tasks/WP03-post-171-generated-integration-and-final-gates.md)
- **Dependencies:** WP01.
- **Requirements:** FR-003, FR-014, FR-020, FR-022–FR-024; NFR-001, NFR-006–NFR-009; C-007,
  C-008, C-010. Final-head NFR-009 evidence and PR ownership remain mission-wrap-up work.
- **Independent result:** CEM/React/Vue/expected-docs/SIZES artifacts are reconciled in dependent
  `lane-b` after supported propagation of approved `lane-a`; dedicated React behavior/type evidence
  and Vue generation/source-SFC/packed gates pass; `lane-b` is clean and approved for mission
  wrap-up. Target refresh, consolidation, the
  latest-train #112 decision, CI baselines, pre-merge review, and maintainer approval occur only
  after WP03 approval.

## Evidence ownership at the lane/wrap-up boundary

| Evidence | Lane/package owner | Terminal owner |
|---|---|---|
| FR-001–FR-024 and lane-verifiable NFR/C evidence | Active WP01 and WP03 according to their exact frontmatter refs | WP03 records only evidence that exists on approved dependent `lane-b` |
| NFR-009 build-budget enforcement | WP03 creates/self-tests the 180-second wrapper and changes CI to call it | Mission wrap-up records the green wrapper-backed CI result at the final PR head |
| NFR-006 WebKit behavior | WP01 authors the shared three-project assertions and proves Chromium/Firefox locally; WP03 preserves the CI lane | Mission wrap-up requires exact-head PR CI WebKit; no named local container seam exists at planning head |
| NFR-008 mutation fleet and `suite-budget.json` | WP03 runs the nine-arm fleet locally but cannot change the 560-second ceiling from local evidence | Mission wrap-up records final-head CI counts/time, disposes the measurement row, reruns CI after any row commit, and stops for filtered-suite remediation on breach |
| NFR-010 visual fidelity | WP01 owns executable crop scenarios only | Mission wrap-up reviews CI-authoritative bytes, records disposition, commits approved bytes, and obtains fresh green CI |
| C-008 final latest-train integration and #112 decision | WP03 proves frozen lane provenance only | Mission wrap-up refreshes before consolidation, records the final target/baseline, and decides #112 from latest train |
| C-009 one `Refs #148` PR into `train/elements-first` | none of the WPs | Mission wrap-up opens the draft PR before CI and finalizes it only after all terminal gates |
| C-011 pre-merge review tier | post-tasks review is planning evidence, not a WP deliverable | Mission wrap-up runs three exact-final-head Codex lenses and records their event IDs/dispositions |

The installed Spec Kitty 3.2.6rc4 matrix commands cannot author this ownership model:
`acceptance-verdict` updates only an already-existing criterion's result/proof/actor/evidence (or registers a negative
invariant), while `issue-verdict` updates only an already-existing issue row's verdict/WP/evidence.
Neither command adds NFR/constraint criteria, replaces scaffold descriptions/notes, completes issue
row metadata, or represents a terminal wrap-up owner. Therefore no agent may hand-edit
`acceptance-matrix.json` or `issue-matrix.json` to simulate completeness. Preserve this ledger as
the authoritative owner map, record supported verdicts only when their evidence exists, and stop
the acceptance transition with the exact CLI capability blocker until a supported authoring seam
can materialize the complete matrices. This is a **pre-claim blocker**: no agent may claim WP01
until an external tooling decision either (a) upgrades/installs a Spec Kitty command that can add
NFR/C rows and terminal-owner metadata, or (b) explicitly authorizes a governed out-of-band schema
migration/write.

**Resolved 2026-09-06:** the operator explicitly authorized the governed out-of-band schema
migration/write. The acceptance matrix now contains all 24 FR, 10 NFR, and 11 C rows with
`lane_owners` and `terminal_owner` metadata under its recorded extension contract; the issue matrix
contains complete issue metadata for directly referenced, range-implied, parent, tracking, and
authoring-precedent records. All results remain pending until their named evidence exists. Task
re-finalization after this write is the executable close of the former pre-claim blocker; this
prose ledger is not a substitute for the materialized matrices.

## Delivery Rules

- One #148 design mission branch and one `Refs #148` PR, per the operator-specific programme
  instruction recorded in C-009.
- Preserve the retired interaction-only WP02 as a canonical `canceled` status event with reason
  "scope absorbed into WP01 before implementation"; it has no prompt, lane, implementation,
  review, or acceptance claim in the finalized two-package topology.
- Reuse #171's landed generic mechanism; do not fork or specialize its property-only projection.
- Enforce the acceptance-capability pre-claim blocker above before any WP01 implementation action.
- Before WP01 is first claimed, the orchestrator fetches `origin`, requires the clean planning
  target `mission/return-over-time-bar-chart`, rebases it onto latest
  `origin/train/elements-first`, normalizes the human-authored planning range to repository-valid
  conventional history, and reruns `spec-kitty agent mission finalize-tasks --mission
  return-over-time-bar-chart-01M1QYBY --json`. The normal `spec-kitty agent action implement WP01
  --mission return-over-time-bar-chart-01M1QYBY --agent <dispatched-agent>` action then creates the
  fresh lane; do not use compatibility `spec-kitty implement --base`.
- WP01 executes and is independently approved on `lane-a`. Only then may WP03 be claimed on
  dependent `lane-b`; the supported allocator propagates the approved `lane-a` tip into the new
  lane. No worker manually consolidates, rebases, cherry-picks, or merges between packages;
  supported lanes→mission→target consolidation occurs only at mission merge.
- Immediately after WP03 is claimed, use `spec-kitty orchestrator-api resolve-workspace` to locate
  dependent `lane-b` and verify its cleanliness, recorded planning-commit ancestry, #171 ancestry,
  and approved `lane-a` tip. Spec Kitty 3.2.6rc4 freezes planning provenance, and the allocator—not
  a worker—owns dependency-tip propagation.
- WP01 runs the timestamp-writing token-catalogue generator exactly once after its source change.
  WP03 has no token-catalogue write ownership and uses the plan's non-writing full-object comparison,
  ignoring only `generated_at`, to prove the committed catalogue still matches the final dependent-lane source.
- After WP03 approval and before supported consolidation, the orchestrator fetches `origin`, rebases
  the clean planning target onto latest `origin/train/elements-first`, and rechecks #112 from that
  target. If train moves before consolidation, repeat this pre-consolidation refresh. Supported
  consolidation then captures the baseline and creates the actual PR head.
- Never rebase the target after supported consolidation captures `baseline_merge_commit`. On the
  exact consolidated target, run the one-time generated-output update, commit any changed bytes,
  apply the latest-train #112 decision, and run the repeatable mandatory gates before
  CI/visual/squad/maintainer evidence. If train advances after baseline capture, stop and use the
  supported stale-state recovery path instead of rewriting the baseline.
- `MO-*` means mission outcomes; `SC-*` is reserved for ADR-11 behavior subjects.
- WP01 completion does not depend on WP03. CI-authoritative snapshot bytes and final visual
  acceptance belong to mission wrap-up after WP03 approval, preventing a lifecycle cycle.
- No train-to-main merge, publish, release, Team Kitty deployment, or downstream #150 composition.

## Mission Wrap-up (after WP03 approval)

1. Fetch `origin`, require the planning target to be clean, and rebase it onto the latest
   `origin/train/elements-first` **before** supported consolidation. Recheck #112 from this refreshed
   target and record whether its formal conformance artifact exists. Repeat the refresh if train
   moves before consolidation.
2. Run the supported lanes→internal-mission→planning-target consolidation once. Do not rewrite the
   target after the workflow records `baseline_merge_commit`.
3. On the exact consolidated target, run the one-time generated-output update from authoritative
   sources, including exactly one `npx nx run tokens:catalogue --skip-nx-cache`, and commit any changed bytes. This
   is the only post-WP token-catalogue write. If #112's artifact exists, add and test #148's row now;
   otherwise record the verified latest-train deferral. Then run the repeatable full gate sequence
   from `plan.md` on the clean head, including the non-writing complete catalogue comparison.
4. Push the clean consolidated head and open the one **draft** `Refs #148` PR to
   `train/elements-first`. Confirm the PR head/base before requesting CI; a mission-branch push is
   not evidence because the visual workflow is PR-triggered.
5. Let the first CI visual run supply authoritative actual bytes when baselines are absent. Review
   the crops against the named Stitch authority, commit only approved CI bytes, push the changed
   head, and require fresh green CI. Keep the Storybook job's deliberate relevant-change predicate;
   once that job is selected, its build step is unconditional, invokes the checked-in fail-closed
   wrapper, and therefore fails automatically at 180 seconds. Timestamps are diagnostic only.
   The exact-head PR CI Playwright/behavior jobs also own the WebKit result; Chromium/Firefox lane
   evidence cannot substitute for it.
6. From the exact-head CI mutation job, record the SHA/run URL, mutation count, browser-test count,
   and elapsed seconds. Never raise the 560-second `selftestCeilingSeconds` from local evidence. If
   CI is within budget, append the candidate-head measurement row to `suite-budget.json`, push that
   changed head, and require a fresh complete CI run whose final-head measurement is recorded in PR
   evidence. If CI exceeds 560 seconds, stop readiness for separately authorized filtered,
   subject-scoped harness remediation; do not raise the ceiling.
7. Run the three-lens pre-merge Codex squad and obtain current-head maintainer approval. Any head
   change stales both. Finalize the already-open draft PR only after both match the final head.
