---
work_package_id: WP03
title: Await observable effects rather than intervals
dependencies:
- WP01
requirement_refs:
- FR-004
- FR-005
- NFR-001
- NFR-002
- C-003
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: 5282172751063b05385756837bb93af5c5149647
created_at: '2026-09-18T11:13:32Z'
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

The action-row Enter-key family and `sk-workflow-board.spec.ts:557` press a key then assert a
consequence after a delay. Await the consequence itself.

- T020 Action-row: await the location change (or the event the handler fires) instead of asserting after the keypress. This is the adopted issue's own suggested direction.
- T021 Board scroller: await scroll settling, preserving BOTH halves of the claim — the scroll happens AND focus is retained.
- T022 Red-first: remove the handler each depends on; show the test FAILS rather than hanging or passing.
- T023 Repeat-run both specs on the WP01 rig; report counts.

An await with no bound turns a flake into a hang. Every await needs a bounded failure mode that
reports what it was waiting for.
