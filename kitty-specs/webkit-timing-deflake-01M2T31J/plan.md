# Implementation Plan: WebKit Timing De-flake

**Mission**: `webkit-timing-deflake-01M2T31J`
**Branch**: `mission/webkit-deflake`
**PR base**: `train/elements-first`
**Spec**: `kitty-specs/webkit-timing-deflake-01M2T31J/spec.md`

## Summary

Nine tests across six specs fail or flake intermittently, all `[webkit]`, plus one adopted
observability defect. The tracking issue's working thesis was "assertions wait on elapsed time".
Pre-plan investigation sharpens that and **corrects part of it**: for the two hard failures the
unpinned thing is not the animation but the *comparison fixture* they measure against.

This plan records that correction, because a mission that starts from the tidier thesis will reach
for the wrong tool.

## Technical Context

### What the component actually does

`packages/styles/src/progress/sk-progress.css` animates `background-position` from `-100% 0` to
`200% 0`, `infinite`, over `--sk-motion-duration-slow`, declared on **three** layers: the
`.sk-progress__bar` element, `::-webkit-progress-value`, and `::-moz-progress-bar`. Under
`prefers-reduced-motion: reduce` all three rules set `animation-name: none` **and**
`background-position: 50% 0`.

### Correction 1 — the reduced-motion frame is deterministic by construction

`:465` asserts on a frame whose rendering is fixed by CSS: no animation, a literal
`background-position`. There is no phase to pin. Any explanation of its intermittency that appeals to
animation timing is therefore wrong, and "pin the animation phase" cannot fix it.

### Correction 2 — the likely cause is an unsettled *comparison* fixture

Both hard failures compare the fixture under test against another fixture sampled moments earlier:

- `:465` loads `complete` and `zero`, samples both, then asserts the frozen indeterminate frame is not equal to them. It failed because `frame1.left ≈ completePixels.left` **and** `frame1.right ≈ completePixels.right`.
- `:369` failed because `sample1.left ≈ zeroSample.left`.

If a comparison fixture is screenshotted **before it has painted its fill**, its edge samples read as
the track colour. The indeterminate frame's edge samples are *also* track-coloured — the gradient is
transparent at both ends. They then match, and a correct assertion fails on a mis-measured baseline.
This explains both failures, explains why they are intermittent, and explains why a tokens-only font
change made them more likely: extra webfont fetches delay first paint.

**This is a hypothesis with a decisive test** (IC-01), not a conclusion. It must be confirmed or
refuted before any fix is written.

### Correction 3 — the Web Animations API may not reach the animation

Two of the three animated layers are **vendor pseudo-elements**. `element.getAnimations()` does not
reliably return pseudo-element animations across engines, and webkit cannot be launched on the
development workstation to check. So the tracking issue's suggested `getAnimations()` / `currentTime`
approach is **not a safe assumption**. A CSS-level alternative that does not depend on it —
injecting `animation-play-state: paused` with an explicit negative `animation-delay` to select a
phase — works regardless of pseudo-element reachability and is the fallback.

### Sampling sensitivity

`samplePixels` reads `left` at absolute `x=2` and `right` at absolute `x=w-3`, on a pill-radius bar
with a 1px border. Those offsets sit in the antialiased corner region. This is a latent fragility
worth recording even where it is not the active cause.

### Constraints carried from the spec

C-001 no suppression, C-002 no assertion deletion, C-003 no timeout inflation, C-004 no unproven
cause for the lane stop, C-005 CI is the authority for webkit, C-006 train-only merge, C-007
component changes only on demonstrated defects.

## Charter Check

Test-layer work plus one possible component finding. No new dependency, no public API change, no
token change. `packages/styles` is touched only if IC-01 or IC-04 demonstrates a component defect,
which would be reported rather than quietly fixed.

## Project Structure

### Documentation (this mission)

```
kitty-specs/webkit-timing-deflake-01M2T31J/
├── spec.md
├── plan.md
├── tasks.md
└── evidence/          # repeat-run counts, red-first proofs, log sizes
```

### Source Code (repository root)

```
apps/storybook/src/tests/
├── sk-progress.spec.ts                   # IC-01, IC-02
├── sk-action-row.spec.ts                 # IC-03
├── sk-workflow-board.spec.ts             # IC-03
├── sk-team-overview-shell-layout.spec.ts # IC-04
└── sk-radio-choice-group.spec.ts         # IC-05
packages/styles/src/progress/sk-progress.css  # only on a demonstrated defect (C-007)
fixtures/, tests/browser/                     # IC-06 warn volume
```

## Complexity Tracking

The highest-risk item is IC-06's adopted lane stop: its cause is unknown and unreadable, and it may
not be fixable from the test layer. It is scoped to the observability half only, and the plan does
not promise a fix for the stop itself.

The second risk is that **every affected test is webkit-only and webkit does not launch on this
workstation**. Local runs prove nothing about these tests. Every task below therefore states which
engine its evidence comes from, and CI is the authority (C-005, NFR-006).

## Implementation Concern Map

### IC-01 — Establish why the two hard failures fail, then fix that

**Covers**: FR-002, FR-003; tests `sk-progress.spec.ts:369` and `:465`.

Decisive experiment first: instrument the two tests to record, alongside the failing comparison, the
**full sample set of the comparison fixture** (`complete`, `zero`) — whether its `center` reads as a
painted fill or as track colour at the moment it is sampled. Run on CI under webkit, repeatedly,
until at least one failure is captured with that data attached.

- If the comparison fixture is unpainted when sampled → the fix is to await the fixture's painted state before sampling it, for every fixture the test compares against, not only the one under test.
- If the comparison fixture is correctly painted → the hypothesis is refuted, and IC-01 reports that and re-opens diagnosis rather than proceeding to a fix.

**Must not**: widen the tolerance, or assert on fewer samples. The assertions close two recorded
defects and their strength is fixed by FR-002/FR-003 and NFR-004.

**Red-first**: with the fix in place, make the indeterminate fill render full-width under forced
colors and confirm `:369` fails; remove the reduced-motion rule and confirm `:465` fails.

### IC-02 — Give the two cycle-sampling tests chosen phases

**Covers**: FR-001; tests `sk-progress.spec.ts:456` and `:510`.

These two legitimately need *two different* animation phases (`:456` asserts the animation runs, so
two captures must differ; `:510` asserts the determinate fixture does not animate, so two captures
must match). They are the only tests where phase genuinely matters.

Try `getAnimations({ subtree: true })` first and **verify it returns the pseudo-element animation
under webkit on CI**. If it does not, fall back to injecting `animation-play-state: paused` with an
explicit `animation-delay` to select each phase. Record which mechanism was used and the evidence
that it works on the engine that matters.

**Must not**: satisfy `:456` by waiting longer (C-003). If phases cannot be selected, report that
rather than reverting to a timeout.

**Red-first**: remove the sweep animation and confirm `:456` fails; inject the indeterminate modifier
onto the determinate fixture and confirm `:510` fails (that test already contains this proof — keep it).

### IC-03 — Await observable effects, not intervals

**Covers**: FR-004, FR-005; adopted action-row Enter-key family, `sk-workflow-board.spec.ts:557`.

Replace press-then-assert with await-the-effect: the location change (or the event the handler
fires) for action-row; scroll settling plus retained focus for the board.

**Evidence**: the adopted issue's own methodology — repeated single-worker runs on more than one
tree, reported as counts. NFR-001 requires 10 consecutive green runs.

**Red-first**: remove the handler each test depends on and confirm the test fails rather than hangs.

### IC-04 — Settle the shell-layout premise

**Covers**: FR-006; `sk-team-overview-shell-layout.spec.ts:104` and `:445`.

`:104` asserts **exact** 56px/240px columns. Determine experimentally whether that measurement moves
with the body font, by measuring it under two different body faces on the same machine and engine.

- Moves with the font → a finding about the assertion's premise. Report it; the fix is to assert what the layout contract actually guarantees, without weakening it to a range that would accept a broken layout.
- Does not move → report the measurements and diagnose separately.

`:445` is an axe run; treat as measure-before-settled until evidence says otherwise.

Note this file also held the **single flaky test on the pre-mission train** (`:303`), so it is the
most persistent offender and any shared helper it uses is a prime suspect.

### IC-05 — Settle both states before comparing

**Covers**: FR-007; `sk-radio-choice-group.spec.ts:1113`.

Two stories loaded in sequence, cues compared. Await each to a settled state before reading it.

**Red-first**: make the required and ordinary legends identical and confirm the test fails.

### IC-06 — Make the lane stop readable (observability only)

**Covers**: FR-008, FR-009, NFR-005; adopted lane-stop issue.

Reduce the `console.warn` replay volume from the warn-and-degrade tests (`sk-card`, `sk-button`,
`sk-pill-tag`, `sk-feature-card`, `sk-section-banner` — four lines per key, replayed under both
engines) so the job log lands under the cap and terminates with the reporter's verdict.

**Must not**: reduce what those tests assert (FR-009), or claim any cause for the stop before the
error text has been read (C-004). If the log fits and no stop occurs during the mission, the
deliverable is the readability, and that is stated plainly rather than dressed as a fix.

**Evidence**: log byte size and final line, before and after.

## Sequencing

IC-01 first — it is the only item blocking the red gate, and its experiment may invalidate the
thesis the others inherit. IC-02 next (same file, same reviewer context). IC-03, IC-04, IC-05 are
independent of each other. IC-06 is independent of all of them and may run in parallel.

## Verification

Every claim states its engine (NFR-006). Webkit claims come from CI (C-005). Repeat-run counts are
reported as counts (NFR-001). Red-first proofs are counted against rewritten assertions and the two
counts must be equal and non-zero (NFR-002, SC-002). Suppression counts — skips, fixmes,
quarantines, retry wrappers, widened tolerances, increased timeouts — are reported explicitly and
must all be zero (SC-003).
