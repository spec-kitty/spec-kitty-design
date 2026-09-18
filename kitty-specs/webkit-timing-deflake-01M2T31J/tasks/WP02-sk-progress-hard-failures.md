---
work_package_id: WP02
title: "sk-progress — find why the two hard failures fail, then fix that"
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- NFR-003
- NFR-005
- C-001
- C-002
- C-003
- C-007
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: 5282172751063b05385756837bb93af5c5149647
created_at: '2026-09-18T11:13:32Z'
subtasks:
- T010
- T011
- T012
- T013
- T014
- T015
- T016
phase: Phase 2 - Fix
history:
- timestamp: '2026-09-18T11:13:32Z'
  agent: orchestrator
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: apps/storybook/src/tests/sk-progress.spec.ts
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/sk-progress.spec.ts
- packages/styles/src/progress/**
tags: []
tracker_refs: []
---

# Work Package Prompt: WP02 – sk-progress — find why the two hard failures fail, then fix that


- **Goal**: Items 1–5 pass repeatedly for a demonstrated reason, assertions no weaker than before.
- **Priority**: P0 — items 1 and 4 are the hard failures reddening the train's gate.
- **Owns**: `apps/storybook/src/tests/sk-progress.spec.ts`, `packages/styles/src/progress/**`.
- **Included subtasks**:
  - T010 **Experiment before fixing.** Instrument items 1 and 4 to record, at the moment of sampling, whether **both** the fixture under test **and** each comparison fixture had painted. Run under the WP01 rig until a failure is captured with that data attached.
  - T011 Judge **per test, not once for both** (plan.md Correction 2). Item 1's suspect is the *fixture under test* — `zero`'s fill is 0%-wide by definition, so it cannot be the variable, and item 1's own comment places its `left` sample inside the clipped fill. Item 4's suspect is the *comparison fixture* `complete`. Record confirmed or refuted **for each**. If refuted for a test, stop and re-diagnose **that** test; do not transplant the other's fix.
  - T012 Fix each demonstrated cause: await the painted state of whichever subject the data implicates, for every fixture the test reads.
  - T013 Items 3 and 5 need *phases* (they compare two captures over time). Try `getAnimations({subtree:true})` and **prove on CI under webkit** that it returns the pseudo-element animation — the sweep is declared on `::-webkit-progress-value` and `::-moz-progress-bar`. Fallback: inject `animation-play-state: paused` with an explicit `animation-delay`. Record which was used. Items 1 and 2 assert their two samples are **identical** and need settling, not phases.
  - T014 Item 2 (`:440`) has the identical capture-wait-capture shape and sits between its failing siblings; apply the same treatment rather than leaving it behind.
  - T015 Red-first, one per rewritten assertion: full-width fill under forced colors fails item 1; removing the reduced-motion rule fails item 4; removing the sweep fails item 3; item 5's existing modifier-injection proof preserved and still failing. These mutations need the CSS — hence this WP's ownership of `packages/styles/src/progress/**`.
  - T016 Report the `samplePixels` edge-offset fragility (`x=2`, `x=w-3` on an antialiased pill radius) as a finding either way.
- **Independent test**: 10/10 repeats green for items 1–5 under the rig with `retries: 0`; red-first proofs recorded, one per rewritten assertion.
- **Dependencies**: WP01.
- **Risks**: any CSS edit beyond a red-first mutation is a C-007 component finding and must be reported as one, never a silent green-making change.

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
