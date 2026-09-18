# Implementation Plan: WebKit Timing De-flake

**Mission**: `webkit-timing-deflake-01M2T31J`
**Branch**: `mission/webkit-deflake`
**PR base**: `train/elements-first`
**Revised**: 2026-09-18, after three rounds of cross-artifact analysis (round 1: 7 high; round 2: 2 high; round 3: 2 high).

## Summary

Twelve items across five specs, plus one adopted observability defect. The tracking issue's thesis was
"assertions wait on elapsed time". Investigation sharpens it and **corrects it in three places**. This
section records the corrections, because a mission that starts from the tidier story reaches for the
wrong tool — and one earlier draft of this plan did exactly that.

## Why this mission is on a critical path

The merged font change left the **train's own push run red**: `playwright` 3 failed / 2 flaky, so
`gate` failed, so the `promote-develop` job was **skipped** (it declares `needs: [gate]` with no
`always()`). `develop` is synced from the train by that job opening and merging a `promote/<40-hex>`
PR — never by a direct push, and it additionally requires `vars.PROMOTE_DEVELOP_ENABLED == 'true'`.
So this mission is **necessary but not sufficient** for promotion resuming. SC-007 is therefore
scoped to what the mission controls — zero failures or flakes in its own final pre-merge run — and
the promotion itself is tracked as post-merge follow-up.

## Technical Context

### What the component actually does

`packages/styles/src/progress/sk-progress.css` animates `background-position` from `-100% 0` to
`200% 0`, `infinite`, over `--sk-motion-duration-slow`, declared on **three** layers: the
`.sk-progress__bar` element, `::-webkit-progress-value`, and `::-moz-progress-bar`. Under
`prefers-reduced-motion: reduce` all three set `animation-name: none` **and**
`background-position: 50% 0`.

### Correction 1 — the reduced-motion frame is deterministic by construction

Item 4 (`:465`) asserts on a frame whose rendering is fixed by CSS: no animation, a literal
`background-position`. There is no phase to pin. Any explanation appealing to animation timing is
wrong for this test, and "pin the animation phase" cannot fix it. *(Verified against the CSS.)*

### Correction 2 — the two hard failures have DIFFERENT unsettled subjects

An earlier draft of this plan proposed a single unifying cause — an unsettled *comparison* fixture —
for both. The analysis refuted that for item 1, and it was right:

- **Item 4 (`:465`)** compares the frozen frame against `complete`. `completePixels.left`/`.right` come from a fixture whose fill is 100% wide, so if `complete` is sampled **before it has painted**, its edges read as track colour — and the frozen frame's edges are also track-coloured, so they match and a correct assertion fails. Here the unsettled subject **is** the comparison fixture.
- **Item 1 (`:369`)** compares against `zero`, whose fill is **0% wide by definition** (`value="0" max="8"`). Its `left` sample at `x=2` reads the empty track whether or not it has painted, so the comparison fixture cannot be the variable. The test's own comment places its `left` sample *inside the clipped region* of the fill. Therefore the only way `sample1.left ≈ zeroSample.left` can be true is if the **fixture under test** had not painted its clipped fill.

**Consequence for the experiment**: instrumenting only the comparison fixtures would show them
correctly painted, be read as "hypothesis refuted", and stop — while the real suspect was never
sampled. IC-01 instruments **both** subjects for both tests.

### Correction 3 — the Web Animations API may not reach the animation

Two of the three animated layers are **vendor pseudo-elements**. `element.getAnimations()` does not
reliably return pseudo-element animations across engines, and webkit cannot be launched locally to
check. The issue's suggested `getAnimations()` / `currentTime` approach is a hypothesis, not a plan.
CSS-level fallback: inject `animation-play-state: paused` with an explicit negative `animation-delay`
to select a phase, which works regardless of pseudo-element reachability.

### Correction 4 — the CI config would make any repeat rig lie

`playwright.config.ts:19-20`:

```ts
fullyParallel: true,
retries: process.env['CI'] ? 2 : 0,
workers: process.env['CI'] ? 2 : undefined,
```

Under CI defaults a failing test is retried twice and reported **flaky at exit 0**. A
`--repeat-each=10` rig that inherits this can report "10/10 green" over genuine failures — a
retry-wrapped green obtained by inheritance rather than by choice, which is exactly what C-001
forbids. NFR-002 now requires `retries: 0` for every measurement, and a `flaky` line in a measurement
run counts as a failure.

This also resolves a wording drift: NFR-001 says ten **repeats within one job**, not ten separate CI
runs. Ten sequential 25.6-minute jobs was never viable and the artifacts should not have implied it.

### Correction 5 — the shell-layout tests share a helper, and it is the suspect

Items 6–9 all obtain their subject through `loadComposition`. On the train, item 7's failing attempt
reported `expect(getByTestId('overview-shell')).toBeVisible()` timing out at 5000ms — *element(s) not
found*. The composition never appeared. (It was reported `flaky`, i.e. it passed on retry — the
failure is real, the retry merely hid it.) One shared helper, four affected tests, and a failure mode that is
precisely "the helper's product is absent". This is a far stronger lead than the font-metric theory,
which remains worth measuring (IC-04) but is no longer the primary hypothesis.

### Sampling sensitivity

`samplePixels` reads `left` at absolute `x=2` and `right` at absolute `x=w-3`, on a pill-radius bar
with a 1px border — inside the antialiased corner region. A latent fragility, recorded whether or not
it proves to be an active cause.

## Charter Check

Test-layer work plus possible component findings. No new dependency, no public API change, no token
change. `packages/styles/src/progress/**` is owned by WP02 **solely** so it can perform C-007 fixes
and the red-first mutations of FR-002/FR-003; any change there is a reported finding, never a silent
green-making edit, and T015a requires every red-first mutation to be reverted.

Three charter clauses bind directly and are carried as constraints rather than left implicit:

- **C-010** (Findings Log Practice) — a lane worktree's `tmp/finding/` must be **symlinked** to the repository root's, never an isolated directory.
- **C-011** (Review Policy / Quality Gates) — a PR touching component files needs a screenshot or visual diff **and one maintainer approval**. So a landed `packages/styles/**` change cannot self-merge. Note the safety net is engine-mismatched: `visual-regression` runs chromium-only while every test in scope is webkit.
- **C-012** (Quality Gate 5) — red-first is the charter's own bar, tied to the ADR-11 required-behaviours list; the mission's red-first requirement restates it rather than inventing it.

## Project Structure

### Documentation (this mission)

```
kitty-specs/webkit-timing-deflake-01M2T31J/
├── spec.md  plan.md  tasks.md
└── evidence/     # repeat-run counts, red-first proofs, log sizes, durations
```

### Ownership map (corrected after the analysis)

| WP | Owns | Why |
|---|---|---|
| WP01 | `scripts/**`, `.github/workflows/**`, `playwright.config.ts` | the rig is a CI invocation; it cannot live in `scripts/` alone |
| WP02 | `apps/storybook/src/tests/sk-progress.spec.ts`, `packages/styles/src/progress/**` | red-first mutations and the C-007 branch both need the CSS |
| WP03 | `sk-action-row.spec.ts`, `sk-workflow-board.spec.ts` | — |
| WP04 | `sk-team-overview-shell-layout.spec.ts` | `loadComposition` is defined inside this file |
| WP05 | `sk-radio-choice-group.spec.ts` | — |
| WP06 | `fixtures/**`, `mutations.json`, `behaviours.json`, `suite-budget.json` | its edits are mutation-harness subjects (C-008) |

The first, second and sixth rows are analysis corrections: previously no WP could edit
`packages/styles/**` at all, WP01 owned only `scripts/**` while its deliverable lived in a workflow
file, and WP06 would have edited enforced-harness subjects without owning the harness manifests.

## Complexity Tracking

**Highest risk: WP01 is a single point of failure.** Four WPs state their acceptance as "10/10 under
the WP01 rig". If WP01 cannot build one, those four have no acceptance path. **Fallback, authorised
here:** if WP01 reports no rig is achievable, the mission falls back to (a) per-item evidence from the
ordinary `playwright` job across the mission's own CI runs, counted and reported as a lower-confidence
figure, and (b) an explicit statement in the PR that NFR-001 was not met and why. It does **not** fall
back to declaring items fixed without measurement.

Second risk: every affected test is webkit-only and webkit does not launch on this workstation
(measured, with a chromium positive control). Local runs prove nothing about these tests.

Third risk: WP06 edits files that are subjects of an enforced mutation harness. Reducing their output
could disarm a gate while every check stays green.

## Implementation Concern Map

### IC-01 — Establish why the two hard failures fail, then fix that

**Covers**: FR-001, FR-002, FR-003; items 1 and 4.

Decisive experiment first, instrumenting **both** candidate subjects for **both** tests — the fixture
under test *and* each comparison fixture — recording whether each had painted at the moment it was
sampled. Run under the WP01 rig until a failure is captured with that data attached.

Judge per test, not once for both (Correction 2). Item 1's suspect is the fixture under test; item 4's
is the comparison fixture. **If the data refutes the hypothesis for a given test, stop and re-diagnose
that test** rather than applying the other's fix to it.

**Must not**: widen tolerances, sample fewer points, or lengthen waits. These assertions close two
recorded defects and their strength is fixed by FR-002/FR-003 and NFR-005.

### IC-02 — Give the cycle-sampling tests chosen phases

**Covers**: FR-004; items 3 and 5.

Only these two genuinely need phase selection — they compare two captures *over time* to prove an
animation does or does not run. Items 1 and 2 assert their two samples are **identical** under forced
colors, where the fill is static; they need settling, not phases.

Try `getAnimations({ subtree: true })` and **prove on CI under webkit** that it returns the
pseudo-element animation. If not, use the CSS fallback from Correction 3. Record which was used.

### IC-03 — Await observable effects, not intervals

**Covers**: FR-005, FR-006; items 10 and 12.

Await the location change (or the handler's event) for action-row; scroll settling plus retained focus
for the board. Every await needs a bounded failure mode that reports what it was waiting for —
an unbounded await turns a flake into a hang.

### IC-04 — Make the composition's presence a precondition, then settle the premise

**Covers**: FR-007, FR-008; items 6–9.

Start at `loadComposition` (Correction 5), not at the font theory: establish whether it can return
before the shell is present or settled, and make its postcondition explicit. Then measure whether
item 6's exact 56px/240px assertion moves with the body font, under two faces on the same machine and
engine, and report the numbers. If it moves, correct the assertion to what the layout contract
guarantees — without widening it into a range that would accept a broken layout.

### IC-05 — Settle both states before comparing

**Covers**: FR-009; item 11.

### IC-06 — Make the lane stop readable, without disarming the harness

**Covers**: FR-010, FR-011, FR-012, NFR-006; the adopted lane-stop issue.

Reduce the `console.warn` replay volume from the warn-and-degrade tests so the job log lands under the
cap and terminates with the reporter's verdict. The analysis found the previously-listed set was
short: the warn-emitting prototype-key loop exists in **seven** fixtures at nine sites, including
`sk-ribbon-card.test.ts:212` and `sk-grid.test.ts:343`, which earlier drafts omitted. Enumerate them
from the source rather than from any list in these artifacts.

These files are **subjects of the enforced mutation harness** (`mutations.json`, `behaviours.json`,
`scripts/suite-selftest.mjs`, and the CI step that re-derives red-first). C-008 applies: the harness
must stay armed. Prefer its existing red-first derivation over hand-rolling a parallel proof.

Claim no root cause for the stop before its error text has been read (C-004).

### IC-07 — Measure the mission's own cost

**Covers**: NFR-004, SC-005.

The pre-mission `playwright` duration is **25.6 min** (the run at the train tip). Record the final
run's duration and the delta. Added as an explicit concern because the analysis found NFR-004/SC-005
had zero subtasks owning them.

### IC-08 — Make the suppression count mechanical, and report the mission once

**Covers**: SC-003, SC-006, SC-008, FR-013, NFR-004's after-reading, NFR-007.

**Covers**: SC-003.

Scan the mission diff for `test.skip`, `test.fixme`, `.only`, added `retries`, and increased numeric
timeout literals, and report the counts from that scan. The analysis correctly observed that SC-002,
SC-003 and NFR-005 were otherwise purely self-certifying — a wrong count would pass unchallenged.
A scan does not cover NFR-005's semantic claim, which stays a reviewer judgement, but it removes the
mechanical part from the honour system. The scan also reports the rewritten-assertion and
red-first-proof counts, because SC-002 asserts they are equal (WP01/T007).

SC-006 and SC-008 close here too: one mission report enumerates all **thirteen** scope items — the
twelve tests plus the lane stop — each with a verdict, the engine behind every claim (NFR-007), and
the `playwright` duration delta against 25.6 min taken by WP01/T006a. SC-007 is scoped to the
mission's own final pre-merge run; whether promotion resumes is post-merge follow-up, since it also
needs `vars.PROMOTE_DEVELOP_ENABLED`.

## Sequencing

IC-01 and IC-02 depend on WP01's rig. IC-06 and IC-07 are independent. IC-08 runs last, over the
finished diff.

## Verification

Every claim states its engine (NFR-007). Webkit claims come from CI (C-005). Repeat counts come from
runs with `retries: 0` (NFR-002) and are reported as counts. Red-first proofs are counted against
rewritten assertions; the counts must be equal and non-zero (NFR-003, SC-002). Suppression counts come
from IC-08's scan, not from self-report (SC-003).
