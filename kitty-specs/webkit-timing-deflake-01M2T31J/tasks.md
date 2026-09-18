# Tasks: WebKit Timing De-flake

**Mission**: `webkit-timing-deflake-01M2T31J`
**Branch**: `mission/webkit-deflake`
**PR base**: `train/elements-first`

## Verification reality (read before planning any task)

Every test in scope is `[webkit]`-only, and **webkit cannot launch on the development
workstation**. Measured here, with a positive control:

```
webkit:   FAILED — Host system is missing dependencies to run browsers
chromium: LAUNCHED — Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 …
```

The named packages (`libgtk-4-1`, `libicu74`, `libjpeg-turbo8`, `gstreamer1.0-libav`) are
Debian/Ubuntu soname-pinned; this host is Fedora, so they are not installable as named. The
repository's existing claim in `vitest.config.mts` is therefore **confirmed**, not inherited.

Consequences that shape every work package below:

1. **CI is the only webkit authority** (C-005). A local chromium pass is evidence about chromium and nothing else (NFR-006).
2. **A full `playwright` job is ~27 minutes.** Ten sequential CI runs per item is not a viable way to satisfy NFR-001.
3. Therefore the repeat-run evidence must come from `--repeat-each` over **only the affected specs**, inside a single job. That rig is WP01 and everything else depends on it.

Note when designing repeats: a repeat loop over a test that performs a one-way mutation to a shared
fixture is unmeetable unless the fixture is restored per repeat. Check each spec for that shape
before reporting a repeat count.

# Work Packages

## Work Package WP01: A webkit repeat-run rig that can measure flakiness at all

- **Goal**: A single, reproducible CI invocation runs the six affected specs under webkit with `--repeat-each=10` and reports a pass/fail count per test. Without this, no other work package can satisfy NFR-001 or SC-001, and no fix can be distinguished from luck.
- **Priority**: P0 — blocks every other package.
- **Included subtasks**:
  - T001 Establish how to invoke a spec subset under the webkit project in this repo's Playwright setup, without altering what the ordinary `playwright` job runs.
  - T002 Capture a **baseline** measurement on the unmodified mission branch: the current failure/flake rate per affected test, as counts. This is the before-figure every later claim is measured against, and it must be taken before any fix lands.
  - T003 Confirm the repeat loop is meaningful for each spec — specifically that no spec in scope mutates a shared fixture one-way, which would make repeats measure the mutation rather than the flake.
  - T004 Record the rig's invocation in the mission evidence directory so a reviewer can re-run it.
- **Independent test**: the rig runs, emits per-test counts, and its baseline reproduces at least one of the two known hard failures.
- **Dependencies**: none.
- **Risks**: the affected specs may not be selectable independently of the projects that multiply them; if a subset run cannot reproduce the failures that a full run produces, say so — a rig that cannot see the bug is not a rig.

## Work Package WP02: sk-progress: find why the two hard failures fail, then fix that

- **Goal**: `sk-progress.spec.ts:369` and `:465` pass repeatedly, for a demonstrated reason, with their assertions no weaker than before. `:456` and `:510` sample chosen animation phases.
- **Priority**: P0 — these two carry both hard failures and are why the aggregate gate is red.
- **Included subtasks**:
  - T010 **Decisive experiment before any fix.** Instrument both tests to record the full sample set of the *comparison* fixtures (`complete`, `zero`) at the moment they are sampled, and run under the WP01 rig until a failure is captured with that data attached.
  - T011 Judge the plan's hypothesis against T010's data: was the comparison fixture unpainted when sampled? Record confirmed or refuted. **If refuted, stop and re-diagnose — do not proceed to a fix built on a dead hypothesis.**
  - T012 Fix the demonstrated cause. If it is the unsettled comparison fixture, await the painted state of *every* fixture a test compares against, not only the one under test.
  - T013 For `:456` and `:510`, select animation phases explicitly. Try `getAnimations({ subtree: true })` first and **prove on CI under webkit** that it returns the pseudo-element animation; if it does not, use an injected `animation-play-state: paused` with an explicit `animation-delay`. Record which mechanism was used and why.
  - T014 Red-first proofs, one per rewritten assertion: full-width fill under forced colors must fail `:369`; removing the reduced-motion rule must fail `:465`; removing the sweep must fail `:456`; `:510`'s existing modifier-injection proof must be preserved and shown still failing.
  - T015 Report the `samplePixels` edge-offset fragility (`x=2`, `x=w-3` on an antialiased pill radius) as a finding, whether or not it turns out to be the active cause.
- **Independent test**: 10/10 repeats green for all four tests under the WP01 rig, with four red-first proofs recorded.
- **Dependencies**: WP01.
- **Risks**: the plan's hypothesis may be wrong (T011 exists to catch that); the Web Animations API may not reach vendor pseudo-elements under webkit (T013 carries the fallback); C-003 forbids buying stability with longer waits.

## Work Package WP03: Await observable effects rather than intervals

- **Goal**: The action-row Enter-key family and `sk-workflow-board.spec.ts:557` await the effect they assert — a location change, a scroll settling, a focus state — instead of asserting after a delay.
- **Priority**: P1 — the action-row flake lands in unrelated missions' output, where it repeatedly costs other people a wrong first hypothesis.
- **Included subtasks**:
  - T020 Replace press-then-assert with await-the-effect in the action-row family; the adopted issue's own suggested direction.
  - T021 Same for the board scroller, preserving both halves of its claim: the scroll happens **and** focus is retained.
  - T022 Red-first: remove the handler each test depends on and show the test fails rather than hanging or passing.
  - T023 Repeat-run both specs on the WP01 rig; report counts.
- **Independent test**: 10/10 repeats green; two red-first proofs recorded.
- **Dependencies**: WP01.
- **Risks**: an await with no timeout converts a flake into a hang; each await must have a bounded failure mode that reports what it was waiting for.

## Work Package WP04: Settle the shell-layout premise

- **Goal**: Either `:104` and `:445` are stable for a demonstrated reason, or the mission reports precisely why not, with measurements.
- **Priority**: P1 — this file is the repository's most persistent webkit offender: it also held the single flaky test on the pre-mission train.
- **Included subtasks**:
  - T030 Measure whether `:104`'s exact 56px/240px column assertion moves with the body font, under two body faces on the same machine and engine. Report the numbers.
  - T031 If it moves, treat it as a finding about the assertion's premise and correct the assertion to what the layout contract actually guarantees — without widening it into a range that would accept a broken layout (C-001).
  - T032 Diagnose `:445` (axe in dark mode) against the measure-before-settled thesis; fix if demonstrated, report if not.
  - T033 Examine the shared helper this file uses, since a third test in it (`:303`) flaked on the untouched train — a shared helper is the obvious common suspect.
  - T034 Red-first proof for anything rewritten.
- **Independent test**: 10/10 repeats green for whatever is fixed; explicit written findings for whatever is not.
- **Dependencies**: WP01.
- **Risks**: the font-metric answer may be "no", leaving this package without a diagnosis; FR-010 and SC-006 require reporting that honestly rather than forcing a fix.

## Work Package WP05: Settle both states before comparing them

- **Goal**: `sk-radio-choice-group.spec.ts:1113` compares two settled states.
- **Priority**: P2 — one flaky test, no evidence of wider impact.
- **Included subtasks**:
  - T040 Await each story to a settled state before reading its legend cue.
  - T041 Red-first: make the required and ordinary legends identical and show the test fails.
  - T042 Repeat-run; report counts.
- **Independent test**: 10/10 repeats green; one red-first proof.
- **Dependencies**: WP01.

## Work Package WP06: Make the lane stop readable (observability only)

- **Goal**: The behaviour suite's job log stops truncating before the error, so that the adopted lane-stop issue becomes diagnosable. **This package does not promise to fix the stop.**
- **Priority**: P2 — independent of every other package and may run in parallel.
- **Included subtasks**:
  - T050 Measure the current log size and final line, to have a before-figure (NFR-005).
  - T051 Reduce the `console.warn` replay volume from the warn-and-degrade tests (`sk-card`, `sk-button`, `sk-pill-tag`, `sk-feature-card`, `sk-section-banner` — four lines per key, replayed under both engines) without reducing what they assert.
  - T052 Prove FR-009 held: those tests still assert the same degradation behaviour. Red-first — break the degradation and show they still fail.
  - T053 Re-measure log size and final line; confirm the reporter's verdict is present.
  - T054 State plainly whether a lane stop occurred during the mission and whether its error text was captured. If none occurred, the deliverable is readability, and it is reported as that and nothing more (C-004).
- **Independent test**: before/after log sizes recorded; final line is the reporter verdict; degradation coverage proven intact.
- **Dependencies**: none.
- **Risks**: the cap may be driven by something other than the warn replay, in which case T050's measurement says so and the package reports the real driver instead of assuming this one.

## Mission-wide acceptance

Reported as counts, not prose (SC-003):

- rewritten assertions = N; red-first proofs = N (equal, non-zero)
- assertions deleted = 0; skipped = 0; `fixme` = 0; quarantined = 0; retry-wrapped = 0
- tolerances widened = 0; wait durations increased = 0
- items fixed with a demonstrated cause + items reported unfixed = total items in scope
- every verification claim names its engine
