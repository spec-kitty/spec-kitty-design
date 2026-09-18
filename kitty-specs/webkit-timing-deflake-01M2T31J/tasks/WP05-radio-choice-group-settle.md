---
work_package_id: WP05
title: Settle both states before comparing them
dependencies:
- WP01
requirement_refs:
- FR-007
- NFR-001
- NFR-002
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: 5282172751063b05385756837bb93af5c5149647
created_at: '2026-09-18T11:13:32Z'
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

`sk-radio-choice-group.spec.ts:1113` loads two stories in sequence and compares a legend cue between
them.

- T040 Await each story to a settled state before reading its cue.
- T041 Red-first: make the required and ordinary legends identical; show the test fails.
- T042 Repeat-run; report counts.
