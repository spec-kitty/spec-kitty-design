---
work_package_id: WP04
title: ceilingSeconds, raised on measured growth
dependencies: []
requirement_refs:
- FR-006
- NFR-003
- C-001
authoritative_surface: suite-budget.json
execution_mode: code_change
model: ''
owned_files:
- suite-budget.json
planning_base_branch: mission/adr-11-correspondence-and-threshold-entries
merge_target_branch: mission/adr-11-correspondence-and-threshold-entries
branch_strategy: Planning artifacts were generated on mission/adr-11-correspondence-and-threshold-entries; completed changes must merge back into mission/adr-11-correspondence-and-threshold-entries.
subtasks:
- T001
- T002
phase: Phase 3 - the budget
history:
- at: '2026-09-07T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
tags: []
tracker_refs: []
---

# WP04 — the wall-clock ceiling

## T001 — the raise, with its arithmetic

`ceilingSeconds` 25 → the worst of the three recorded observations (25.2s) times the repository's
own worst-observed multiplier, 1.5213 — the same multiplier the 360→560 raise established and the
560→881.9 and 923.9→1405.5 raises reused. Update `measuredOn`, `runUrl` and `sha` to the run that
justifies it.

## T002 — the record a reader can check

A `$comment` paragraph carrying: the three measurements on unchanged code (18s / 22.9s / 25.2s),
that the distribution **straddled** the old ceiling rather than sitting under it, the test count
they were measured at (762) against the count when the ceiling was set (647), this mission's own
effect on that count, the arithmetic, and the resulting headroom.

**C-001**: `selftestCeilingSeconds` is #225's. It stays at 1405.5, byte-for-byte.
