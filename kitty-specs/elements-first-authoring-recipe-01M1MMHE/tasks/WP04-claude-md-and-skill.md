---
work_package_id: WP04
title: CLAUDE.md and the design skill — what an agent reads first
dependencies:
- WP01
requirement_refs:
- FR-006
- FR-007
planning_base_branch: mission/elements-first-authoring-recipe
merge_target_branch: mission/elements-first-authoring-recipe
branch_strategy: Planning artifacts for this mission were generated on mission/elements-first-authoring-recipe. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-first-authoring-recipe unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 2 - Context
history:
- timestamp: '2026-09-04T08:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: CLAUDE.md
create_intent: []
execution_mode: code_change
owned_files:
- CLAUDE.md
- skills/spec-kitty-design/SKILL.md
tags: []
tracker_refs: []
---

# WP04 — `CLAUDE.md` and `skills/spec-kitty-design/SKILL.md`

## Subtasks

- **T013 — CLAUDE.md §1 (FR-007).** #76's exit criterion says *"CLAUDE.md §1's description of
  three packages matches reality."* It is wrong in two ways, not one: there are **four**
  packages, and the fourth is **generated**. Six Angular references besides.
- **T014 — §5 (adding a component) must point at the recipe** rather than restate it. Two copies
  of a procedure drift; #117's seven glob copies are the same lesson one layer down.
- **T015 — `SKILL.md`.** Zero Angular references, but check it against the four-package reality —
  absence of the wrong word is not presence of the right description.

## Definition of Done

- `CLAUDE.md` §1 matches `packages/` exactly, and says which package is generated.
- §5 points at `docs/contributing/adding-a-component.md` rather than duplicating it.
- No Angular-as-live-target reference in either file.
