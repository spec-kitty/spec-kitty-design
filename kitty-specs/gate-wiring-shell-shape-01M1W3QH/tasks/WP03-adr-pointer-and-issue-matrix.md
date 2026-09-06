---
work_package_id: WP03
title: sad-lite points at the gated ADR index, and the card mission's issue matrix tells the truth
dependencies: []
requirement_refs:
- FR-006
- FR-007
- C-003
planning_base_branch: mission/gate-wiring-shell-shape
merge_target_branch: mission/gate-wiring-shell-shape
branch_strategy: Planning artifacts for this mission were generated on mission/gate-wiring-shell-shape. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/gate-wiring-shell-shape unless the human explicitly redirects the landing branch.
subtasks:
- T008
- T009
phase: Phase 3 - the records
history:
- at: '2026-09-06T19:45:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: docs/architecture/sad-lite.md
create_intent: []
owned_files:
- docs/architecture/sad-lite.md
- kitty-specs/card-status-tone-axis-01M1VJNY/issue-matrix.json
execution_mode: planning_artifact
model: ''
tags: []
tracker_refs: []
---

# Work Package Prompt: WP03 – the two records

Closes #201 and #221. See `plan.md` §4 and §5.

## T008 — FR-006: `docs/architecture/sad-lite.md:10`

Replace `ADR-001 through ADR-005` with a pointer at the gated table. The document's own body
already cites ADR-6 … ADR-13, so the range is stale rather than scoped — record that reasoning in
the row itself so the next reader does not re-derive it.

## T009 — FR-007: `kitty-specs/card-status-tone-axis-01M1VJNY/issue-matrix.json`

Fill `#177` through `spec-kitty agent issue-verdict`. Remove the `#146` row: it is a referenced
dependency, and no value in the verdict enum is true of it. Report the generic scraping behaviour
with a proposed shape rather than sweeping every past mission's file (C-003 — scope discipline).

## Definition of done

- No `<fill at WP-implementation time>` placeholder remains in that file.
- No row asserts a verdict for an issue that mission did not deliver.
- `sad-lite.md` carries no ADR range expression.
