---
work_package_id: WP04
title: "The composition must exist before anything measures it"
dependencies:
- WP01
requirement_refs:
- FR-007
- FR-008
- FR-013
- NFR-001
- NFR-003
- C-001
- C-007
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: 5282172751063b05385756837bb93af5c5149647
created_at: '2026-09-18T11:13:32Z'
subtasks:
- T030
- T031
- T032
- T033
- T034
- T035
phase: Phase 2 - Fix
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP04 – The composition must exist before anything measures it


- **Goal**: Items 6–9 are stable for a demonstrated reason, or reported unfixed with measurements.
- **Priority**: P1 — four of twelve items, spanning the pre-mission train, the PR run and the train run.
- **Owns**: `apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts`.
- **Included subtasks**:
  - T030 **Start at `loadComposition`, not at the font theory.** All four items obtain their subject through it, and on the train item 7 failed with `getByTestId('overview-shell')` not found after 5000ms — the composition never appeared. Establish whether the helper can return before the shell is present or settled.
  - T031 Give the helper an explicit postcondition: it returns only once the shell is present and settled, or fails naming what was missing (FR-007).
  - T032 Measure whether item 6's exact 56px/240px assertion moves with the body font, under two faces on the same machine and engine. **Report the numbers.** A recent tokens change swapped the body face, so this is a live suspect — but it is now the secondary hypothesis, behind T030.
  - T033 If it moves: correct the assertion to what the layout contract guarantees, without widening it into a range that would accept a broken layout (C-001).
  - T034 Item 9 is an axe run and item 8 asserts landmarks and label bytes; judge both against the settled-composition finding before looking further.
  - T035 Red-first proof for anything rewritten.
- **Independent test**: 10/10 repeats green for whatever is fixed; explicit written findings for whatever is not.
- **Dependencies**: WP01.
- **Risks**: "no diagnosis found" is acceptable **if reported with evidence** (FR-013). A forced fix is not.

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
