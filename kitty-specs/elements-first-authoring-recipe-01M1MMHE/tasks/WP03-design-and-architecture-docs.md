---
work_package_id: WP03
title: The design-system and architecture documents
dependencies:
- WP01
requirement_refs:
- FR-006
planning_base_branch: mission/elements-first-authoring-recipe
merge_target_branch: mission/elements-first-authoring-recipe
branch_strategy: Planning artifacts for this mission were generated on mission/elements-first-authoring-recipe. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-first-authoring-recipe unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 2 - Context
history:
- timestamp: '2026-09-04T08:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: docs/design-system/using-components.md
create_intent: []
execution_mode: code_change
owned_files:
- docs/design-system/using-components.md
- docs/architecture/sad-lite.md
- docs/architecture/system-context-canvas.md
- docs/architecture/risk-register.md
tags: []
tracker_refs: []
---

# WP03 — design-system and architecture docs

37 stale references: `using-components.md` 18, `sad-lite.md` 8, `system-context-canvas.md` 6,
`risk-register.md` 5.

## Subtasks

- **T010 — `using-components.md` (18).** This is consumer-facing and now has a sibling:
  `using-react.md`, written in #75. They must agree about what the React path is, and
  `using-components.md` should point at it rather than describe Angular.
- **T011 — `sad-lite.md` and `system-context-canvas.md` (14).** Architecture descriptions of a
  topology that no longer exists.
- **T012 — `risk-register.md` (5).** Check whether each risk is *retired* rather than merely
  re-worded — a risk about Angular wrapper drift is discharged by ADR-8, not renamed.

## Definition of Done

- Zero Angular-as-live-target references across the four files.
- `using-components.md` and `using-react.md` do not contradict each other.
- Any risk removed from the register is removed because it is discharged, with the reason.
