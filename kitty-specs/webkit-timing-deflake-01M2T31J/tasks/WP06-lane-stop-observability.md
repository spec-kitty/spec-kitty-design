---
work_package_id: WP06
title: Make the lane stop readable (observability only)
dependencies: []
requirement_refs:
- FR-008
- FR-009
- NFR-005
- FR-010
- C-004
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: 5282172751063b05385756837bb93af5c5149647
created_at: '2026-09-18T11:13:32Z'
subtasks:
- T050
- T051
- T052
- T053
- T054
phase: Phase 1 - Measurement
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: fixtures/**
create_intent: []
execution_mode: code_change
owned_files:
- fixtures/**
tags: []
tracker_refs: []
---

# Work Package Prompt: WP06 – Make the lane stop readable (observability only)

The behaviour suite's webkit lane stops mid-queue with ZERO test failures; whole test files go
unreported. Its cause is unknown **because the job log truncates at ~219KB mid-line**, before
vitest's "Unhandled Errors" section.

**This package does not promise to fix the stop.** It makes the stop diagnosable.

- T050 Measure current log size and final line (the before-figure).
- T051 Reduce the `console.warn` replay volume from the warn-and-degrade tests (`sk-card`, `sk-button`, `sk-pill-tag`, `sk-feature-card`, `sk-section-banner` — four lines per key, replayed under both engines) **without reducing what they assert**.
- T052 Prove coverage held: red-first, break the degradation and show those tests still fail.
- T053 Re-measure; confirm the log ends with the reporter's verdict line.
- T054 State plainly whether a lane stop occurred during the mission and whether its error text was captured. If none occurred, the deliverable is readability — say that and nothing more.

**Claim no root cause for the stop before its error text has been read.** If T050 shows the cap is
driven by something other than the warn replay, report the real driver instead of assuming this one.
