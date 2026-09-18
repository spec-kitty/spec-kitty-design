---
work_package_id: WP04
title: Settle the shell-layout premise
dependencies:
- WP01
requirement_refs:
- FR-006
- NFR-001
- NFR-002
- FR-010
- C-001
- C-007
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: 5282172751063b05385756837bb93af5c5149647
created_at: '2026-09-18T11:13:32Z'
subtasks:
- T030
- T031
- T032
- T033
- T034
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

# Work Package Prompt: WP04 – Settle the shell-layout premise

`sk-team-overview-shell-layout.spec.ts:104` asserts **exact** 56px/240px columns; `:445` runs axe in
dark mode. This file is the repository's most persistent webkit offender — a third test in it (`:303`)
was the single flaky test on the pre-mission train.

- T030 Measure whether `:104`'s assertion moves with the body font, under two body faces on the same machine and engine. **Report the numbers.** A recent tokens change swapped the body face, so this is a live suspect rather than a hypothetical.
- T031 If it moves: that is a finding about the assertion's premise. Correct the assertion to what the layout contract actually guarantees — without widening it into a range that would accept a broken layout.
- T032 Diagnose `:445` against the measure-before-settled thesis; fix if demonstrated, report if not.
- T033 Examine the shared helper this file uses — with three flaky tests in one file, a shared helper is the obvious common suspect.
- T034 Red-first proof for anything rewritten.

"No diagnosis found" is an acceptable outcome here **if reported with its evidence**. A forced fix is
not.
