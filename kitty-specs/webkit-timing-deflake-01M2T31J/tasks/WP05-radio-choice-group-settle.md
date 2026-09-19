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
- **Independent test**: **item 11 is already 10/10 at baseline — this package's entire scope passes before any work, so "10/10 repeats green" is satisfiable by doing nothing and is NOT an acceptable close.** Either demonstrate item 11 failing under another condition (higher repeat count, or full-suite contention) and then hold it green, or report it **not reproduced** under FR-013/SC-008 with the evidence. The red-first proof is still required for any assertion actually rewritten. This package may not close on an empty diff.
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

## Activity Log

- 2026-09-18T14:16:59Z – claude – shell_pid=874452 – ADDENDUM to the not-reproduced finding above: the full-suite contention run I'd flagged as incomplete at handback time (35352049054, workflow_dispatch of ci-quality.yml's ordinary playwright job on this lane branch) has now finished. It ran the exact original conditions item 11 was flagged flaky under: ~2770 tests, webkit, 2 workers, retries=2. Result breakdown: 2 failed (sk-progress:369, sk-progress:465 -- items 1/4, WP02's pre-existing hard failures), 3 flaky (sk-progress:510 / item 5, shell-layout:160 / item 7, plus one unrelated sk-connectors-pattern test not in the 12-item scope), 2773 passed, 26.7m. sk-radio-choice-group.spec.ts:1113 (item 11) appears in NEITHER the failed NOR the flaky list -- it passed clean under retries=2, so even a single retry-masked failure would have surfaced as 'flaky' and did not. This is a 4th independent clean sample for item 11 and the strongest one: the exact full-contention condition of its original discovery. Caveat for accuracy: this run executed on lane-e, which carries WP01's rig and the mission branch but NOT WP03's or WP04's fixes -- so it is a PRE-FIX contention sample for every item other than item 11. That does not weaken the item-11 conclusion (item 11 has no fix; pre-fix and post-fix are the same tree for it), but the same run's other rows (items 1/4 failing, items 5/7 flaky) are pre-fix data and must not be read as post-fix results for WP02/WP03/WP04. Outcome for WP05 remains NOT REPRODUCED, unchanged; T040/T041/T042 remain unchecked; no code change.
