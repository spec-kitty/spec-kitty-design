---
work_package_id: WP03
title: The amendment, its authorization, and the records that pointed at the gap
dependencies:
- WP01
- WP02
requirement_refs:
- FR-005
- C-002
- C-003
authoritative_surface: docs/architecture/decisions
execution_mode: code_change
model: ''
owned_files:
- docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md
- docs/architecture/decisions/2026-09-06-14-detached-probe-validation-seam.md
planning_base_branch: mission/adr-11-correspondence-and-threshold-entries
merge_target_branch: mission/adr-11-correspondence-and-threshold-entries
branch_strategy: Planning artifacts were generated on mission/adr-11-correspondence-and-threshold-entries; completed changes must merge back into mission/adr-11-correspondence-and-threshold-entries.
subtasks:
- T001
- T002
- T003
phase: Phase 2 - the record
history:
- at: '2026-09-07T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
tags: []
tracker_refs: []
---

# WP03 — the amendment

## T001 — items 10 and 11

Add both entries to ADR-11's required-behaviours list, each written from its measurements, each
naming the mutation that makes it falsifiable.

## T002 — the authorization section

A subsection recording the #196/#204 ruling by name, following the #176 (ADR-10) and #189 (ADR-11)
precedent: ADR-11 is `Accepted` as of #200, so an amendment needs its authorization recorded where
a reader will look for it. State what the ruling required and what the amendment delivered,
including the one place the machinery resisted and what was done about it.

## T003 — ADR-14's stale sentence

ADR-14's Negative consequence says the class "has no entry for delegate/rendered-control
correspondence" and that #196 leaves the wording to the mission that takes it. Correct that one
sentence and name the correction; do not otherwise touch a `Proposed` record #188 owns.

**C-002**: `packages/elements/src/notice/**`, `packages/styles/src/notice/**`,
`docs/contributing/adding-a-token.md` and `docs/design-system/using-tokens.md` are a concurrent
mission's. Not touched.
