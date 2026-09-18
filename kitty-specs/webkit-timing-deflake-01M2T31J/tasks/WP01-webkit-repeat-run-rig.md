---
work_package_id: WP01
title: "Measurement rig, cost accounting, and the suppression scan"
dependencies: []
requirement_refs:
- NFR-001
- NFR-002
- NFR-004
- NFR-007
- C-005
- C-009
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-webkit-timing-deflake-01M2T31J
base_commit: 636045d4d71bec4c6bff3d51de891fd7f72c2dfe
created_at: '2026-09-18T11:30:36.846463+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
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
- .github/workflows/**
- playwright.config.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – Measurement rig, cost accounting, and the suppression scan


- **Goal**: A reproducible CI invocation runs the five affected specs under **webkit** with `--repeat-each=10` and **`retries: 0`**, reporting a per-test pass/fail count. Plus the two accounting deliverables no other package owns.
- **Priority**: P0 — blocks WP02–WP05.
- **Owns**: `scripts/**`, `.github/workflows/**`, `playwright.config.ts`.
- **Included subtasks**:
  - T001 Establish how to invoke a spec subset under the webkit project with repeats. **Do not alter what the ordinary `playwright` job runs** (C-009) — the enforced `check-gate-wiring.mjs` and `check-ci-quality-trigger-parity.mjs` gates reject ad-hoc step shapes, so read them before choosing a shape. A separate `workflow_dispatch` workflow is the expected form.
  - T002 **Retries must be 0 in the rig** and the rig must print the retry setting it ran under. A run that cannot show `retries: 0` is not a measurement (NFR-002).
  - T003 Capture the **baseline** on the unmodified branch: per-test failure/flake counts for all twelve items, **before any fix lands**. This is the before-figure every later claim is measured against.
  - T004 Check each spec for a one-way mutation of a shared fixture; report which specs are safe to repeat.
  - T005 Record the rig's exact invocation in the mission evidence directory so a reviewer can re-run it.
  - T006 Record the pre-mission `playwright` duration (**25.6 min**) and provide the means to compare the final run against it (NFR-004, SC-005).
  - T007 Deliver a **suppression scan** script: counts of `test.skip`, `test.fixme`, `.only`, added `retries`, and increased numeric timeout literals across the mission diff. The orchestrator runs it before the PR is marked ready (SC-003). It must report counts, and must be able to detect a planted violation — prove that.
- **Independent test**: the rig runs, emits per-test counts under `retries: 0`, and its baseline reproduces at least one of the known hard failures. The scan script detects a planted `test.skip`.
- **Dependencies**: none.
- **Risks**: **this WP is a single point of failure** — four WPs state acceptance in terms of its rig. If no rig is achievable, say so explicitly and invoke the fallback recorded in plan.md's Complexity Tracking; do **not** let downstream WPs declare items fixed without measurement. A rig that cannot reproduce a known hard failure is not a rig.

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
