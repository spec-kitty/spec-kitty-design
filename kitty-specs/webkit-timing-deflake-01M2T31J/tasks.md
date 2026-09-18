# Tasks: WebKit Timing De-flake

**Mission**: `webkit-timing-deflake-01M2T31J`
**Branch**: `mission/webkit-deflake`
**PR base**: `train/elements-first`
**Revised**: 2026-09-18 after the cross-artifact analysis returned `blocked` (7 high, 7 medium).

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

## Canonical scope

The twelve items and their owners are defined in `spec.md` under **Canonical scope**. That table is
the single source of truth; do not restate counts here.

# Work Packages

## Work Package WP01: Measurement rig, cost accounting, and the suppression scan

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

## Work Package WP02: sk-progress — find why the two hard failures fail, then fix that

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

## Work Package WP03: Await observable effects rather than intervals

- **Goal**: Items 10 and 12 await the effect they assert.
- **Priority**: P1 — item 12 lands in unrelated missions' output, costing other people a wrong first hypothesis; item 10 failed on the train.
- **Owns**: `apps/storybook/src/tests/sk-action-row.spec.ts`, `apps/storybook/src/tests/sk-workflow-board.spec.ts`.
- **Included subtasks**:
  - T020 Action-row: await the location change (or the event the handler fires) instead of asserting after the keypress. This is the adopted issue's own suggested direction. It is a parameterized family with no single line number — enumerate the sub-tests and report per sub-test.
  - T021 Board scroller: await scroll settling, preserving **both** halves of the claim — the scroll happens **and** focus is retained.
  - T022 Red-first: remove the handler each depends on; show the test **fails** rather than hanging or passing.
  - T023 Repeat-run both specs under the rig; report counts.
- **Independent test**: 10/10 repeats green; two red-first proofs.
- **Dependencies**: WP01.
- **Risks**: an unbounded await turns a flake into a hang. Every await needs a bounded failure mode naming what it waited for.

## Work Package WP04: The composition must exist before anything measures it

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

## Work Package WP05: Settle both states before comparing them

- **Goal**: Item 11 compares two settled states.
- **Priority**: P2 — one flaky test, no evidence of wider impact.
- **Owns**: `apps/storybook/src/tests/sk-radio-choice-group.spec.ts`.
- **Included subtasks**:
  - T040 Await each story to a settled state before reading its legend cue.
  - T041 Red-first: make the required and ordinary legends identical; show the test fails.
  - T042 Repeat-run; report counts.
- **Independent test**: 10/10 repeats green; one red-first proof.
- **Dependencies**: WP01.

## Work Package WP06: Make the lane stop readable, without disarming the harness

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

## Mission-wide acceptance

Reported as counts, and for suppressions from WP01's scan rather than self-report:

- rewritten assertions = N; red-first proofs = N (equal, non-zero)
- assertions deleted / skipped / `fixme` / quarantined / retry-wrapped = 0 *(from the scan)*
- tolerances widened = 0; wait durations increased = 0 *(from the scan)*
- every measurement ran with `retries: 0`, and said so
- items fixed with a demonstrated cause + items reported unfixed = 12
- final `playwright` duration within 5% of 25.6 min
- every verification claim names its engine
