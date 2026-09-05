# Tasks: Return-over-time bar chart

**Mission:** `return-over-time-bar-chart-01M1QYBY`
**Branch:** `mission/return-over-time-bar-chart`
**Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
**Tracker:** [`#148`](https://github.com/spec-kitty/spec-kitty-design/issues/148)
**Satisfied integration seam:** [`PR #171`](https://github.com/spec-kitty/spec-kitty-design/pull/171)
merged as `8e654e8`; this mission is rebased onto `train/elements-first` at `dcf7af2`.

## Overview

Three work packages and nineteen subtasks form one strictly serial lane. WP01 owns authored core,
CSS/token generation, entries, element behavior mutations, and the shrink-only parts ratchet. WP02
owns interaction, stories, browser evidence, and regeneration of its changed element CSS modules.
WP03 alone reconciles CEM/React/Vue,
`expected-docs`, and SIZES at the final integration point. The operator-confirmed event is
non-cancelable, bubbling, composed, and controlled by the consumer.

```text
Recorded train seam: #171 @ 8e654e8 / train @ dcf7af2
               │
               ▼
WP01 token/core contract ──▶ WP02 interaction/browser definitions ──▶ WP03 generated/final gates
```

## Subtask Index

| ID | Work | WP |
|---|---|---|
| T001 | Write failing validation, approved/close/equal/zero/extreme geometry and replacement tests | WP01 |
| T002 | Add three dark/light semantic data tokens and computed binding/source-break proof | WP01 |
| T003 | Author the token-only bar-chart stylesheet | WP01 |
| T004 | Implement the immutable validation and proportional render model | WP01 |
| T005 | Register/export the element and styles subpath through the landed seam | WP01 |
| T006 | Register SC-010/013/014, four mutation arms, and the exact parts ratchet | WP01 |
| T007 | Run focused source/CSS/token/parts/behavior gates without shared-output drift obligations | WP01 |
| T008 | Add failing controlled-selection and non-mutation tests | WP02 |
| T009 | Implement click-only dispatch plus non-dispatch held-key guard | WP02 |
| T010 | Register SC-006/007/008 and load-bearing mutations | WP02 |
| T011 | Add eight axe-enabled stories and asserted Storybook action spy | WP02 |
| T012 | Add three-engine accessibility/state/theme/reduced-motion/narrow Playwright proofs | WP02 |
| T013 | Define visual scenarios and regenerate/check WP02's changed element CSS modules | WP02 |
| T014 | Verify the unchanged reused lane and frozen planning provenance before WP03 work | WP03 |
| T015 | Generate final CEM/React/Vue/SIZES outputs and reconcile expected docs | WP03 |
| T016 | Prove CEM, dedicated React, and Vue source/SFC/packed contracts | WP03 |
| T017 | Run the complete non-visual local production gate | WP03 |
| T018 | Complete documentation, conditional #112 handling, and runtime-owned acceptance evidence | WP03 |
| T019 | Harvest/review/commit exact CI baselines, rerun CI, review exact head, and reach PR readiness | WP03 |

## Work Packages

### WP01 — Semantic tokens and core bar-chart contract

- **Prompt:** [`tasks/WP01-token-and-core-element-contract.md`](./tasks/WP01-token-and-core-element-contract.md)
- **Dependencies:** none; the branch already contains #171 merge `8e654e8` through train `dcf7af2`.
- **Requirements:** FR-001–FR-010, FR-017–FR-020, FR-024 and mapped NFR/C constraints.
- **Independent result:** the property-only generic chart validates a readonly series, renders
  exact zero-origin geometry and persistent ordered meaning in both themes, and passes focused
  source/CSS/token/parts plus SC-010/013/014 gates without selectable behavior or shared
  CEM/React/Vue/docs/SIZES ownership.

### WP02 — Controlled selection, stories, and browser evidence

- **Prompt:** [`tasks/WP02-controlled-selection-stories-and-browser-evidence.md`](./tasks/WP02-controlled-selection-stories-and-browser-evidence.md)
- **Dependencies:** WP01.
- **Requirements:** FR-011–FR-017, FR-019, FR-021, FR-024 and mapped NFR/C constraints.
- **Independent result:** optional native selection emits one typed non-cancelable intent without
  taking state ownership; all stories and three-engine accessibility/interaction/responsive tests
  pass, and its CSS JS/declaration match the final interaction CSS. This package defines visual
  scenarios but owns no baseline bytes or final visual verdict.

### WP03 — Generated integration and final target gates

- **Prompt:** [`tasks/WP03-post-171-generated-integration-and-final-gates.md`](./tasks/WP03-post-171-generated-integration-and-final-gates.md)
- **Dependencies:** WP02.
- **Requirements:** FR-003, FR-014, FR-020, FR-022–FR-024 and mapped NFR/C constraints.
- **Independent result:** CEM/React/Vue/expected-docs/SIZES artifacts are reconciled from the final
  integrated source; dedicated React behavior/type evidence and Vue generation/source-SFC/packed gates
  pass; exact CI snapshot bytes are reviewed and committed; fresh CI, Tier B Codex review, and
  current-head maintainer approval make the one #148 PR eligible to merge into
  `train/elements-first` only.

## Delivery Rules

- One #148 design mission branch and one `Refs #148` PR, per the operator-specific programme
  instruction recorded in C-009.
- Reuse #171's landed generic mechanism; do not fork or specialize its property-only projection.
- Before WP01 is first claimed, the orchestrator fetches `origin`, requires the clean planning
  target `mission/return-over-time-bar-chart`, rebases it onto latest
  `origin/train/elements-first`, normalizes the human-authored planning range to repository-valid
  conventional history, and reruns `spec-kitty agent mission finalize-tasks --mission
  return-over-time-bar-chart-01M1QYBY --json`. The normal `spec-kitty agent action implement WP01
  --mission return-over-time-bar-chart-01M1QYBY --agent <dispatched-agent>` action then creates the
  fresh lane; do not use compatibility `spec-kitty implement --base`.
- WP01–WP03 reuse `.worktrees/return-over-time-bar-chart-01M1QYBY-lane-a` on
  `kitty/mission-return-over-time-bar-chart-01M1QYBY-lane-a`. They are not consolidated into
  internal mission branch `kitty/mission-return-over-time-bar-chart-01M1QYBY` between packages;
  supported lane→mission→target consolidation occurs only at merge.
- Before WP03, the orchestrator uses `spec-kitty orchestrator-api resolve-workspace` to locate that
  reused lane and verifies its cleanliness, recorded planning-commit ancestry, #171 ancestry, and
  approved WP01/WP02 content. No lane rebase occurs after execution starts because 3.2.6rc4 freezes
  planning provenance and re-finalization cannot replace it.
- After supported consolidation produces the actual PR head on
  `mission/return-over-time-bar-chart`, the orchestrator rebases that clean target onto latest
  `origin/train/elements-first`, regenerates and commits all shared outputs, and reruns the entire
  mandatory gate list on that exact clean target head before CI/visual/squad/maintainer evidence;
  tree equivalence is not a substitute. Repeat if train moves again.
- `MO-*` means mission outcomes; `SC-*` is reserved for ADR-11 behavior subjects.
- WP02 completion does not depend on WP03. WP03 exclusively owns snapshot bytes and final visual
  acceptance, preventing a dependency cycle.
- No train-to-main merge, publish, release, Team Kitty deployment, or downstream #150 composition.
