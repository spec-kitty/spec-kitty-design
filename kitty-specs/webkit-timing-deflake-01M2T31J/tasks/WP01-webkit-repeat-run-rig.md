---
work_package_id: WP01
title: A webkit repeat-run rig that can measure flakiness at all
dependencies: []
requirement_refs:
- NFR-001
- NFR-006
- C-005
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: 5282172751063b05385756837bb93af5c5149647
created_at: '2026-09-18T11:13:32Z'
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - Measurement
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: scripts/**
create_intent: []
execution_mode: code_change
owned_files:
- scripts/**
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – A webkit repeat-run rig that can measure flakiness at all

A single reproducible CI invocation must run the six affected specs under the **webkit** project with
`--repeat-each=10` and report a pass/fail count per test.

Nothing else in this mission can be proved without this. Every affected test is webkit-only, webkit
**cannot launch on this workstation** (measured, with a chromium positive control), and a full
`playwright` job is ~27 minutes — so ten sequential CI runs per item is not viable.

- T001 Establish how to invoke a spec subset under the webkit project **without changing what the ordinary `playwright` job runs**.
- T002 Capture the BASELINE on the unmodified branch: current failure/flake rate per affected test, as counts. Take this **before any fix lands** — it is the before-figure every later claim is measured against.
- T003 Check each spec for a one-way mutation of a shared fixture. A repeat loop over one of those measures the mutation, not the flake. Report which specs are safe to repeat.
- T004 Record the exact invocation in the mission evidence directory so a reviewer can re-run it.

**A rig that cannot reproduce at least one of the two known hard failures is not a rig** — if a
subset run cannot see what a full run sees, report that rather than proceeding.
