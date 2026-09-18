---
work_package_id: WP06
title: "Make the lane stop readable, without disarming the harness"
dependencies: []
requirement_refs:
- FR-010
- FR-011
- FR-012
- FR-013
- NFR-006
- C-004
- C-008
- C-010
- C-012
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: 371de6a8dcd18d4ad8aef9f7915444778837844b
created_at: '2026-09-18T11:13:32Z'
subtasks:
- T050
- T051
- T052
- T053
- T054
- T055
- T056
phase: Phase 1 - Measurement
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: fixtures/**
create_intent: []
execution_mode: code_change
owned_files:
- fixtures/**
- mutations.json
- behaviours.json
- suite-budget.json
tags: []
tracker_refs: []
---

# Work Package Prompt: WP06 – Make the lane stop readable, without disarming the harness


- **Goal**: The behaviour suite's job log stops truncating before the error. **This package does not promise to fix the stop.**
- **Priority**: P2 — independent of every other package.
- **Owns**: `fixtures/**`, `mutations.json`, `behaviours.json`, `suite-budget.json`.
- **Included subtasks**:
  - T050 Measure the current log size and final line (the before-figure).
  - T051 **Enumerate the warn-emitting sites from the source**, not from any list in these artifacts — the earlier list was short. The prototype-key loop appears in **seven** fixtures at nine sites, including `sk-ribbon-card.test.ts:212` and `sk-grid.test.ts:343`.
  - T052 Reduce the `console.warn` replay volume **without reducing what those tests assert** (FR-011).
  - T053 **C-008: keep the mutation harness armed.** These fixtures are subjects of the enforced harness (`mutations.json`, `behaviours.json`, `scripts/suite-selftest.mjs`, and the CI step that re-derives red-first). Verify every subject still derives red-first after the change, and prefer the harness's existing derivation over hand-rolling a parallel proof.
  - T054 Re-measure log size and final line; confirm the reporter's verdict is present.
  - T055 Check `suite-budget.json` still holds after the output change.
  - T056 State plainly whether a lane stop occurred during the mission and whether its error text was captured. If none occurred, the deliverable is readability — say that and nothing more (C-004).
- **Independent test**: before/after log sizes recorded; final line is the reporter verdict; harness still armed; degradation coverage intact.
- **Dependencies**: none.
- **Risks**: the cap may be driven by something other than the warn replay — if T050 shows that, report the real driver instead of assuming this one.

---

## Canonical sources — read these, do not rely on this file alone

- `kitty-specs/webkit-timing-deflake-01M2T31J/spec.md` — **Canonical scope** (the twelve items and their observed states), all FR/NFR/C/SC requirements.
- `kitty-specs/webkit-timing-deflake-01M2T31J/plan.md` — **Corrections 1–5**, the ownership map, the authorised fallback.
- `kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md` — **Verification reality** (six standing rules), mission-wide acceptance.

The six rules in tasks.md's *Verification reality* bind every package. The three that most often get
missed: measurements run with **`retries: 0`** (a CI `flaky` line is a failure retried into a pass);
symlink your lane's `tmp/finding/` to the repository root's before anything else (charter C-010); and
never `git add -A` from the repository root checkout, which holds live lane worktrees.
