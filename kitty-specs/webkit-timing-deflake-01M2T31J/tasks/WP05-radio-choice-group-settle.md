---
work_package_id: WP05
title: "Settle both states before comparing them"
dependencies:
- WP01
requirement_refs:
- FR-009
- NFR-001
- NFR-003
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: 5282172751063b05385756837bb93af5c5149647
created_at: '2026-09-18T11:13:32Z'
subtasks:
- T040
- T041
- T042
phase: Phase 2 - Fix
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: apps/storybook/src/tests/sk-radio-choice-group.spec.ts
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/sk-radio-choice-group.spec.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP05 – Settle both states before comparing them


- **Goal**: Item 11 compares two settled states.
- **Priority**: P2 — one flaky test, no evidence of wider impact.
- **Owns**: `apps/storybook/src/tests/sk-radio-choice-group.spec.ts`.
- **Included subtasks**:
  - T040 Await each story to a settled state before reading its legend cue.
  - T041 Red-first: make the required and ordinary legends identical; show the test fails.
  - T042 Repeat-run; report counts.
- **Independent test**: 10/10 repeats green; one red-first proof.
- **Dependencies**: WP01.

---

## Verification reality (read before planning any task)

Every test in scope is `[webkit]`-only, and **webkit cannot launch on the development workstation**.
Measured here, with a positive control:

```
webkit:   FAILED — Host system is missing dependencies to run browsers
chromium: LAUNCHED — Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 …
```

The named packages (`libgtk-4-1`, `libicu74`, …) are Debian/Ubuntu soname-pinned; this host is
Fedora. The repository's existing claim in `vitest.config.mts` is **confirmed**, not inherited.

1. **CI is the only webkit authority.** A local chromium pass is evidence about chromium and nothing else.
2. **A full `playwright` job is ~27 minutes**, so ten sequential CI runs per item is not viable. NFR-001 means ten **repeats inside one job**.
3. **`playwright.config.ts:19` sets `retries: 2` under CI.** A rig inheriting that reports a failing test as `flaky` at exit 0 — a retry-wrapped green by inheritance. Every measurement in this mission runs with `retries: 0`, and a `flaky` line counts as a **failure** (NFR-002, C-001).
4. A repeat loop over a test that performs a one-way mutation to a shared fixture measures the mutation, not the flake. Check for that shape before reporting a count.

## Why this is on a critical path

The train's own push run is red (`playwright` 3 failed / 2 flaky → `gate` failed), which **skips the
`promote-develop` job** (`needs: [gate]`, no `always()`). `develop` is synced only by that job opening
and merging a `promote/<40-hex>` PR. Until the train's gate is green, release promotion cannot run
(SC-007).
