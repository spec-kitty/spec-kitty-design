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
- C-010
- C-011
- C-012
planning_base_branch: mission/webkit-deflake
merge_target_branch: mission/webkit-deflake
branch_strategy: Planning artifacts for this mission were generated on mission/webkit-deflake. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/webkit-deflake unless the human explicitly redirects the landing branch.
base_branch: mission/webkit-deflake
base_commit: d6af259572eb3e0ac64ee1808d65d9d24bc2518d
created_at: '2026-09-18T11:13:32Z'
subtasks:
- T010
- T011
- T012
- T013
- T014
- T015
- T015a
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
  - T015a **Revert every red-first mutation.** T015 edits `sk-progress.css` three times to prove the assertions still bite; those edits must not land. Finish with `git diff packages/styles/src/progress/**` either **empty**, or containing only hunks declared as C-007 component findings in the WP report. Do not rely on CI to catch a stray mutation: committed visual baselines exist for exactly these states, but `visual-regression` runs **chromium-only** (`ci-quality.yml:626`) while every test in scope is webkit — so a leftover mutation to a webkit-only behaviour passes every gate. C-011 also applies: a landed component change needs a visual diff and one maintainer approval, so it cannot be folded in silently.
  - T016 Report the `samplePixels` edge-offset fragility (`x=2`, `x=w-3` on an antialiased pill radius) as a finding either way.
- **Independent test**: 10/10 repeats green for items 1–5 under the rig with `retries: 0`; red-first proofs recorded, one per rewritten assertion; **and `git diff packages/styles/src/progress/**` is empty or every hunk is a declared C-007 finding**.
- **Dependencies**: WP01.
- **Risks**: any CSS edit beyond a red-first mutation is a C-007 component finding and must be reported as one, never a silent green-making change.

---

## Canonical sources — read these, do not rely on this file alone

- `kitty-specs/webkit-timing-deflake-01M2T31J/spec.md` — **Canonical scope** (the twelve items and their observed states), all FR/NFR/C/SC requirements.
- `kitty-specs/webkit-timing-deflake-01M2T31J/plan.md` — **Corrections 1–5**, the ownership map, the authorised fallback.
- `kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md` — **Verification reality** (six standing rules), mission-wide acceptance.

The six rules in tasks.md's *Verification reality* bind every package. The three that most often get
missed: measurements run with **`retries: 0`** (a CI `flaky` line is a failure retried into a pass);
symlink your lane's `tmp/finding/` to the repository root's before anything else (charter C-010); and
never `git add -A` from the repository root checkout, which holds live lane worktrees.
