---
work_package_id: WP06
title: "Make the lane stop readable, without disarming the harness"
dependencies: []
requirement_refs:
- FR-010
- FR-011
- FR-012
- FR-013
- NFR-006
- C-004
- C-008
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
- T055
- T056
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
- mutations.json
- behaviours.json
- suite-budget.json
tags: []
tracker_refs: []
---

# Work Package Prompt: WP06 – Make the lane stop readable, without disarming the harness


- **Goal**: The behaviour suite's job log stops truncating before the error. **This package does not promise to fix the stop.**
- **Priority**: P2 — independent of every other package.
- **Owns**: `fixtures/**`, `mutations.json`, `behaviours.json`, `suite-budget.json`.
- **Included subtasks**:
  - T050 Measure the current log size and final line (the before-figure).
  - T051 **Enumerate the warn-emitting sites from the source**, not from any list in these artifacts — the earlier list was short. The prototype-key loop appears in **seven** fixtures at nine sites, including `sk-ribbon-card.test.ts:212` and `sk-grid.test.ts:343`.
  - T052 Reduce the `console.warn` replay volume **without reducing what those tests assert** (FR-011).
  - T053 **C-008: keep the mutation harness armed.** These fixtures are subjects of the enforced harness (`mutations.json`, `behaviours.json`, `scripts/suite-selftest.mjs`, and the CI step that re-derives red-first). Verify every subject still derives red-first after the change, and prefer the harness's existing derivation over hand-rolling a parallel proof.
  - T054 Re-measure log size and final line; confirm the reporter's verdict is present.
  - T055 Check `suite-budget.json` still holds after the output change.
  - T056 State plainly whether a lane stop occurred during the mission and whether its error text was captured. If none occurred, the deliverable is readability — say that and nothing more (C-004).
- **Independent test**: before/after log sizes recorded; final line is the reporter verdict; harness still armed; degradation coverage intact.
- **Dependencies**: none.
- **Risks**: the cap may be driven by something other than the warn replay — if T050 shows that, report the real driver instead of assuming this one.

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
