---
work_package_id: WP03
title: Await observable effects rather than intervals
dependencies:
- WP01
requirement_refs:
- FR-005
- FR-006
- NFR-001
- NFR-003
- C-003
- C-010
- C-012
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-webkit-timing-deflake-01M2T31J
base_commit: d3d6ae76c69e650798c1bf18cf3474b5413196eb
created_at: '2026-09-18T13:37:07.014092+00:00'
subtasks:
- T020
- T021
- T022
- T023
phase: Phase 2 - Fix
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: apps/storybook/src/tests/sk-action-row.spec.ts
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/sk-action-row.spec.ts
- apps/storybook/src/tests/sk-workflow-board.spec.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP03 – Await observable effects rather than intervals


- **Goal**: Items 10 and 12 await the effect they assert.
- **Priority**: P1 — item 12 lands in unrelated missions' output, costing other people a wrong first hypothesis; item 10 flaked on the train (failed, then passed on retry).
- **Owns**: `apps/storybook/src/tests/sk-action-row.spec.ts`, `apps/storybook/src/tests/sk-workflow-board.spec.ts`.
- **Included subtasks**:
  - T020 Action-row: await the location change (or the event the handler fires) instead of asserting after the keypress. This is the adopted issue's own suggested direction. It is a parameterized family with no single line number — enumerate the sub-tests and report per sub-test.
  - T021 Board scroller: await scroll settling, preserving **both** halves of the claim — the scroll happens **and** focus is retained.
  - T022 Red-first: remove the handler each depends on; show the test **fails** rather than hanging or passing.
  - T023 Repeat-run both specs under the rig; report counts.
- **Independent test**: 10/10 repeats green; two red-first proofs.
- **Dependencies**: WP01.
- **Risks**: an unbounded await turns a flake into a hang. Every await needs a bounded failure mode naming what it waited for.

---

## Canonical sources — read these, do not rely on this file alone

- `kitty-specs/webkit-timing-deflake-01M2T31J/spec.md` — **Canonical scope** (the twelve items and their observed states), all FR/NFR/C/SC requirements.
- `kitty-specs/webkit-timing-deflake-01M2T31J/plan.md` — **Corrections 1–5**, the ownership map, the authorised fallback.
- `kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md` — **Verification reality** (six standing rules), mission-wide acceptance.

The six rules in tasks.md's *Verification reality* bind every package. The three that most often get
missed: measurements run with **`retries: 0`** (a CI `flaky` line is a failure retried into a pass);
symlink your lane's `tmp/finding/` to the repository root's before anything else (charter C-010); and
never `git add -A` from the repository root checkout, which holds live lane worktrees.
