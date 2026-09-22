---
work_package_id: WP02
title: SC-017 — the responsive threshold
dependencies: []
requirement_refs:
- FR-002
- FR-003
- FR-004
- NFR-002
authoritative_surface: fixtures/elements-behaviour/src/sk-page-header.test.ts
execution_mode: code_change
model: ''
owned_files:
- behaviours.json
- mutations.json
- tests/node/config-contract.test.ts
- fixtures/elements-behaviour/src/sk-page-header.test.ts
planning_base_branch: mission/adr-11-correspondence-and-threshold-entries
merge_target_branch: mission/adr-11-correspondence-and-threshold-entries
branch_strategy: Planning artifacts were generated on mission/adr-11-correspondence-and-threshold-entries; completed changes must merge back into mission/adr-11-correspondence-and-threshold-entries.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - the two entries
history:
- at: '2026-09-07T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
tags: []
tracker_refs: []
---

# WP02 — SC-017, the responsive threshold

## T001 — mark the test that already exists, and give it a live arm

`sticky is declared on the host and dropped at both documented thresholds` already reads both drop
blocks out of the adopted sheet at their documented figures. Mark it `[SC-017]` and add the live
half: at the lane's own 414px viewport, a header whose `sticky` **attribute** is set directly must
compute `position: static`. The attribute, not the property — the existing SC-010 arm flips
`reflect` on `sticky`, and a property-driven assertion would red under it as collateral.

Leave `the width drop is real, measured at the lane viewport` unmarked and unchanged.

## T002 — the registry and the pin

`behaviours.json`: SC-017, `applicable: true`, `owner: elements`, one subject (`sk-page-header`).
`tests/node/config-contract.test.ts`: add `SC-017` to the expected applicable set.

## T003 — two mutations, one per threshold

Both mutate the **generated** `packages/elements/src/page-header/sk-page-header.css.js` — the
`test` job never builds, so an arm against the authored `.css` would be semantically inert, and
`SC-010`'s arm against generated `packages/react/src/SkTransitionMatrix.js` is the precedent. One
arm changes the width block's documented figure, one the height block's, because #182 wrote them
as two blocks precisely so either can fail alone. Record the verbatim red of each.
