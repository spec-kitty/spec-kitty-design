---
work_package_id: WP02
title: 'sk-progress: find why the two hard failures fail, then fix that'
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- NFR-002
- NFR-004
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
tags: []
tracker_refs: []
---

# Work Package Prompt: WP02 – sk-progress: find why the two hard failures fail, then fix that

`sk-progress.spec.ts:369` and `:465` are the two hard failures turning the aggregate gate red.
`:456` and `:510` are flaky in the same file.

**Do not start from the tracking issue's "pin the animation phase" thesis for the two failures.** The
plan corrects it: under `prefers-reduced-motion` the CSS sets `animation-name: none` **and**
`background-position: 50% 0`, so `:465`'s frame is deterministic by construction and has no phase to
pin. The plan's hypothesis is that the **comparison fixture** (`complete`, `zero`) is sampled before
it has painted, so its edge samples read as track colour — which the indeterminate frame's edges also
are, making a correct assertion fail on a mis-measured baseline.

- T010 **Experiment before fixing.** Instrument both tests to record the comparison fixtures' full sample set at the moment they are sampled. Run under the WP01 rig until a failure is captured with that data attached.
- T011 Judge the hypothesis: was the comparison fixture unpainted? Record **confirmed or refuted**. If refuted, STOP and re-diagnose — do not build a fix on a dead hypothesis.
- T012 Fix the demonstrated cause. If it is the unsettled comparison, await the painted state of EVERY fixture a test compares against, not only the one under test.
- T013 For `:456`/`:510`, select phases explicitly. Try `getAnimations({subtree:true})` and **prove on CI under webkit** that it returns the pseudo-element animation — the sweep is declared on `::-webkit-progress-value` and `::-moz-progress-bar`, which the API may not reach. Fallback: inject `animation-play-state: paused` with an explicit `animation-delay`. Record which was used.
- T014 Red-first, one per rewritten assertion: full-width fill under forced colors fails `:369`; removing the reduced-motion rule fails `:465`; removing the sweep fails `:456`; `:510`'s existing modifier-injection proof preserved and still failing.
- T015 Report the `samplePixels` edge-offset fragility (`x=2`, `x=w-3` on an antialiased pill radius) as a finding either way.

These assertions close two recorded defects (an indeterminate fill indistinguishable from Complete
under forced colors). **They must not be weakened** — no widened tolerance, no fewer samples, no
longer waits.
