---
work_package_id: WP04
title: The composition must exist before anything measures it
dependencies:
- WP01
requirement_refs:
- FR-007
- FR-008
- FR-013
- NFR-001
- NFR-003
- C-001
- C-010
- C-012
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-webkit-timing-deflake-01M2T31J
base_commit: d3d6ae76c69e650798c1bf18cf3474b5413196eb
created_at: '2026-09-18T13:37:13.305378+00:00'
subtasks:
- T030
- T031
- T032
- T033
- T034
- T035
phase: Phase 2 - Fix
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP04 – The composition must exist before anything measures it


- **Goal**: Items 6–9 are stable for a demonstrated reason, or reported unfixed with measurements.
- **Priority**: P1 — four of twelve items, spanning the pre-mission train, the PR run and the train run.
- **Owns**: `apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts`.
- **Included subtasks**:
  - T030 **Start at `loadComposition`, not at the font theory.** All four items obtain their subject through it, and the helper has been observed failing directly: on this branch's own baseline run, item 8 (`:303`) failed **inside `loadComposition` at `sk-team-overview-shell-layout.spec.ts:78`** — `expect(locator).toBeVisible()`, the composition never appeared. **Do not hunt item 7's signature: item 7 is 20/20 at baseline, the one item in this file the rig cannot reproduce.** Your reproducible signal is items 6 (9/10 @1280px), 8 (8/10) and 9 (7/10 dark). Establish whether the helper can return before the shell is present or settled.
  - T031 Give the helper an explicit postcondition: it returns only once the shell is present and settled, or fails naming what was missing (FR-007).
  - T032 Measure whether item 6's exact 56px/240px assertion moves with the body font, under two faces on the same machine and engine. **Report the numbers.** A recent tokens change swapped the body face, so this is a live suspect — but it is now the secondary hypothesis, behind T030.
  - T033 If it moves: correct the assertion to what the layout contract guarantees, without widening it into a range that would accept a broken layout (C-001).
  - T034 Item 9 is an axe run and item 8 asserts landmarks and label bytes; judge both against the settled-composition finding before looking further.
  - T035 Red-first proof for anything rewritten.
- **Independent test**: 10/10 repeats green for items 6, 8 and 9, measured as a delta against their baselines (9/10, 8/10, 7/10). **Item 7 is 20/20 at baseline** and may not be counted as fixed — report it not reproduced under FR-013/SC-008, or demonstrate it failing under another condition first. Explicit written findings for anything not fixed.
- **Dependencies**: WP01.
- **Risks**: "no diagnosis found" is acceptable **if reported with evidence** (FR-013). A forced fix is not.

---

## Canonical sources — read these, do not rely on this file alone

- `kitty-specs/webkit-timing-deflake-01M2T31J/spec.md` — **Canonical scope** (the twelve items and their observed states), all FR/NFR/C/SC requirements.
- `kitty-specs/webkit-timing-deflake-01M2T31J/plan.md` — **Corrections 1–5**, the ownership map, the authorised fallback.
- `kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md` — **Verification reality** (six standing rules), mission-wide acceptance.

The six rules in tasks.md's *Verification reality* bind every package. The three that most often get
missed: measurements run with **`retries: 0`** (a CI `flaky` line is a failure retried into a pass);
symlink your lane's `tmp/finding/` to the repository root's before anything else (charter C-010); and
never `git add -A` from the repository root checkout, which holds live lane worktrees.
