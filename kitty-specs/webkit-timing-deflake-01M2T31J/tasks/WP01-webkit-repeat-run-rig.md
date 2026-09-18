---
work_package_id: WP01
title: "Measurement rig, cost accounting, and the suppression scan"
dependencies: []
requirement_refs:
- NFR-001
- NFR-002
- NFR-004
- NFR-007
- C-005
- C-009
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-webkit-timing-deflake-01M2T31J
base_commit: d6af259572eb3e0ac64ee1808d65d9d24bc2518d
created_at: '2026-09-18T11:30:36.846463+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - Measurement
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: scripts/**
create_intent: []
execution_mode: code_change
owned_files:
- scripts/**
- .github/workflows/**
- playwright.config.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – Measurement rig, cost accounting, and the suppression scan


- **Goal**: A reproducible CI invocation runs the five affected specs under **webkit** with `--repeat-each=10` and **`retries: 0`**, reporting a per-test pass/fail count. Plus the two accounting deliverables no other package owns.
- **Priority**: P0 — blocks WP02–WP05.
- **Owns**: `scripts/**`, `.github/workflows/**`, `playwright.config.ts`.
- **Included subtasks**:
  - T001 Establish how to invoke a spec subset under the webkit project with repeats. **Do not alter what the ordinary `playwright` job runs** (C-009) — the enforced `check-gate-wiring.mjs` and `check-ci-quality-trigger-parity.mjs` gates reject ad-hoc step shapes, so read them before choosing a shape. A separate `workflow_dispatch` workflow is the expected form.
  - T002 **Retries must be 0 in the rig** and the rig must print the retry setting it ran under. A run that cannot show `retries: 0` is not a measurement (NFR-002).
  - T003 Capture the **baseline** on the unmodified branch: per-test failure/flake counts for all twelve items, **before any fix lands**. This is the before-figure every later claim is measured against.
  - T004 Check each spec for a one-way mutation of a shared fixture; report which specs are safe to repeat.
  - T005 Record the rig's exact invocation in the mission evidence directory so a reviewer can re-run it.
  - T006 Record the pre-mission `playwright` duration (**25.6 min**) and provide the means to compare the final run against it (NFR-004, SC-005).
  - T007 Deliver a **suppression scan** script: counts of `test.skip`, `test.fixme`, `.only`, added `retries`, and increased numeric timeout literals across the mission diff. The orchestrator runs it before the PR is marked ready (SC-003). It must report counts, and must be able to detect a planted violation — prove that.
- **Independent test**: the rig runs, emits per-test counts under `retries: 0`, and its baseline reproduces at least one of the known hard failures. The scan script detects a planted `test.skip`.
- **Dependencies**: none.
- **Risks**: **this WP is a single point of failure** — four WPs state acceptance in terms of its rig. If no rig is achievable, say so explicitly and invoke the fallback recorded in plan.md's Complexity Tracking; do **not** let downstream WPs declare items fixed without measurement. A rig that cannot reproduce a known hard failure is not a rig.

---

## Canonical sources — read these, do not rely on this file alone

- `kitty-specs/webkit-timing-deflake-01M2T31J/spec.md` — **Canonical scope** (the twelve items and their observed states), all FR/NFR/C/SC requirements.
- `kitty-specs/webkit-timing-deflake-01M2T31J/plan.md` — **Corrections 1–5**, the ownership map, the authorised fallback.
- `kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md` — **Verification reality** (six standing rules), mission-wide acceptance.

The six rules in tasks.md's *Verification reality* bind every package. The three that most often get
missed: measurements run with **`retries: 0`** (a CI `flaky` line is a failure retried into a pass);
symlink your lane's `tmp/finding/` to the repository root's before anything else (charter C-010); and
never `git add -A` from the repository root checkout, which holds live lane worktrees.
