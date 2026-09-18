---
work_package_id: WP05
title: Settle both states before comparing them
dependencies:
- WP01
requirement_refs:
- FR-009
- NFR-001
- NFR-003
- C-010
- C-012
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-webkit-timing-deflake-01M2T31J
base_commit: d3d6ae76c69e650798c1bf18cf3474b5413196eb
created_at: '2026-09-18T13:37:19.656139+00:00'
subtasks:
- T040
- T041
- T042
phase: Phase 2 - Fix
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: apps/storybook/src/tests/sk-radio-choice-group.spec.ts
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/sk-radio-choice-group.spec.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP05 – Settle both states before comparing them


- **Goal**: Item 11 compares two settled states.
- **Priority**: P2 — one flaky test, no evidence of wider impact.
- **Owns**: `apps/storybook/src/tests/sk-radio-choice-group.spec.ts`.
- **Included subtasks**:
  - T040 Await each story to a settled state before reading its legend cue.
  - T041 Red-first: make the required and ordinary legends identical; show the test fails.
  - T042 Repeat-run; report counts.
- **Independent test**: 10/10 repeats green; one red-first proof.
- **Dependencies**: WP01.

---

## Canonical sources — read these, do not rely on this file alone

- `kitty-specs/webkit-timing-deflake-01M2T31J/spec.md` — **Canonical scope** (the twelve items and their observed states), all FR/NFR/C/SC requirements.
- `kitty-specs/webkit-timing-deflake-01M2T31J/plan.md` — **Corrections 1–5**, the ownership map, the authorised fallback.
- `kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md` — **Verification reality** (six standing rules), mission-wide acceptance.

The six rules in tasks.md's *Verification reality* bind every package. The three that most often get
missed: measurements run with **`retries: 0`** (a CI `flaky` line is a failure retried into a pass);
symlink your lane's `tmp/finding/` to the repository root's before anything else (charter C-010); and
never `git add -A` from the repository root checkout, which holds live lane worktrees.
