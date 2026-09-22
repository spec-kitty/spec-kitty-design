---
work_package_id: WP02
title: The LLM context files — 74 of the 119 stale references
dependencies:
- WP01
requirement_refs:
- FR-006
- FR-008
planning_base_branch: mission/elements-first-authoring-recipe
merge_target_branch: mission/elements-first-authoring-recipe
branch_strategy: Planning artifacts for this mission were generated on mission/elements-first-authoring-recipe. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-first-authoring-recipe unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 2 - Context
history:
- timestamp: '2026-09-04T08:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: llms-full.txt
create_intent: []
execution_mode: code_change
owned_files:
- llms.txt
- llms-full.txt
tags: []
tracker_refs: []
---

# WP02 — `llms.txt` and `llms-full.txt`

**74 of the mission's 119 stale Angular references live here** (73 + 1), and #76's Intent does
not mention either file. These are what an agent reads when it has no other context, so they are
the highest-leverage surface in the mission and the least likely to be noticed as wrong.

## Subtasks

- **T007 — survey before editing.** 851 lines with 73 Angular references is not a find-and-replace:
  some describe a retired package, some describe Storybook's renderer (ADR-13 moved it to
  web-components), some are historical. Classify each before touching it.
- **T008 — rewrite for the four-package topology,** consistent with WP01's table. These files and
  the recipe must not disagree; WP01 lands first for that reason.
- **T009 — historical references stay only if dated and marked** (FR-006). An undated past-tense
  sentence reads as current to a model with no other context.

## Definition of Done

- Zero Angular-as-live-target references; any survivor is demonstrably historical.
- The topology described matches `packages/` and WP01's table exactly.
