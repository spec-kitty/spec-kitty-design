# Mission Specification: mutation harness budget

**Mission Branch**: `mission/mutation-harness-budget`

**Created**: 2026-09-11

**Status**: Draft

**Issues**: [#419](https://github.com/spec-kitty/spec-kitty-design/issues/419) (primary/tracking — the train itself breaches the ceiling, four-run variance evidence), [#408](https://github.com/spec-kitty/spec-kitty-design/issues/408) (corpus grew 210→272 unrecalibrated — same defect, narrower evidence), [#168](https://github.com/spec-kitty/spec-kitty-design/issues/168) (stale — its O(mutations×tests) premise was fixed by #225/#249 on 2026-09-07)

**Base**: `train/elements-first@e696278c`

## Context

`scripts/suite-selftest.mjs` re-derives ADR-11 Confirmation #1 on every CI run and asserts total
wall-clock against a single flat `selftestCeilingSeconds` in `suite-budget.json`
(`scripts/suite-selftest.mjs:1004-1022`). That ceiling has been raised **five times** —
180 → 240 → 360 → 560 → 881.9 → 1405.5 → 1649.8s — and every raise was re-breached.

### The corpus grew past the last calibration (#408)

The 1649.8s ceiling was set at #270, calibrated on a **210-mutation** worst observation
(1084.5s × the repo's established 1.5213 headroom multiplier). The corpus is now **272
mutations** (`mutations.json`, verified: `python3 -c "import json;print(len(json.load(open('mutations.json'))['mutations']))"` → 272). Nothing recalibrated the ceiling for that growth.

### The ceiling sits inside the runner's own variance, independent of growth (#419)

Eight real CI runs on `train/elements-first` at the **current, identical** 272-mutation /
47-source corpus (verified directly from each run's job log, `impact graph: 47 source(s), 0
full-suite fallback(s)` in every one):

| run | conclusion | harness elapsed | vs 1649.8s ceiling |
|---|---|---|---|
| 34561511046 | pass | 1637.2s | 12.6s under |
| 34592445070 | pass | 1645.1s | 4.7s under |
| 34595310707 | **fail — ceiling only** | **1949.7s** | **300s over** |
| 34606532461 | pass | 1346.6s | 303s under |
| 34618855795 | pass (ceiling step) | 1645.5s | 4.3s under |
| 34623594612 | **fail — ceiling only** | **1690.0s** | **40.2s over** |
| 34632185898 | pass | 1627.9s | 21.9s under |
| 34637284298 | pass | 1605.3s | 44.5s under |

Every one of these runs completed with all 272 mutations producing their named red against a
green baseline and zero full-suite fallbacks — the harness worked correctly in all eight. The
spread is **1346.6s to 1949.7s, a 603s / 44.8% range on byte-identical inputs**. Two of eight
identical-corpus runs (25%) breached the ceiling on wall-clock alone.

The identical-arm-count guard self-check (`suite-selftest.mjs --selftest`, 10 entries in
`mutations.selftest.json`) shows the same shape at a different scale, from the same eight runs
(only six produced this step, since a ceiling-breach on the prior step stops the job before it
runs): 103.6s, 113.6s, 113.8s, 115.0s, 116.3s, 112.5s — an 11-second, 12.3% spread on an
identical 10-arm set.

### Why a raise to any single worst observation is fragile

#408 recalibrated its target from the (then) worst known 1701.6s figure — applying the
established 1.5213 multiplier gives ~2588s. The very next few runs the corpus saw included a
1949.7s outlier: 2588s would have cleared it, but only with 32.8% headroom over that true worst,
not the 52.1% ("×1.5213") the file's own methodology intends when it is applied fresh. A ceiling
anchored to whichever single run happens to be the worst-known-so-far keeps discovering it wasn't
actually the worst; five raises already failed this way.

### Why an absolute ceiling structurally cannot survive corpus growth (#408, #168's residual point)

`selftestCeilingSeconds` is a flat number compared against total elapsed
(`suite-selftest.mjs:1017`). Total elapsed is, to first order, `armCount × (fixed baseline cost +
per-arm cost)`. Every mission that adds a mutation arm raises the numerator while the ceiling
stays fixed — the ceiling is not recalibrated by construction, only by someone remembering to
raise it. That is the defect this mission fixes: **the ceiling must be a function of the current
arm count, not a constant**, so ordinary corpus growth stops being able to breach it at all.

### #168's technical premise is stale (verified independently)

#168 (filed 2026-09-04) states the harness "runs the whole behaviour suite once per mutation,"
making cost `O(mutations × tests)`. A dependency-graph filter existed since #146 but was inert
until #225/#249 (merged 2026-09-07, `f9fd570e`, three days after #168 was filed) made it
effective by fixing the elements-behaviour fixtures' barrel imports. Every one of the eight CI
runs measured above — and every `selftestMeasurements` row in `suite-budget.json` since #225 —
reports `impact graph: 47 source(s), 0 full-suite fallback(s)`: the harness resolves each
mutation's affected files through Vitest's dependency graph and runs only those, with zero
fallbacks to the full suite. #168's central technical claim no longer describes the harness. Its
broader point — "a ceiling that is raised whenever it is hit is not a gate" — is exactly what
this mission (born from #419/#408) now addresses, so #168 carries no open technical content of
its own once #225/#249 and this mission are accounted for.

### The cost model this file already records

`suite-budget.json`'s history fits `seconds_per_arm ≈ A + B × files_selected` from CI job-log
timestamps at the 157-arm, intermediate- and final-selection stages (`A,B` around `(2.10,
0.2325)` and `(1.17, 0.170)` on a faster runner class). That per-file fit requires per-arm
file-selection counts extracted from CI job logs, which are not available for a fresh
regression at 272 arms within this mission's evidence budget. This mission instead fits a
coarser, two-parameter **arm-count** model directly from the two arm-count buckets this
mission has real CI data for (10-arm guard self-check, 272-arm main run):
`totalSeconds ≈ fixedSeconds + perArmSeconds × armCount`, using each bucket's own **worst**
observed run so the fit does not need to assume linearity has been checked at any other count.
This is coarser than the file-selection model (it cannot see per-arm heterogeneity within a
single armCount), but it is exactly the level of granularity this mission has real measurements
for, and it directly encodes the fix for #408/#419: the ceiling becomes a function of `armCount`
that both existing invocations of the harness (a 10-arm and a 272-arm run) already sit inside,
each with the file's established 52.1% (×1.5213) headroom over its own worst observation.

## What must not change

- **No guard, selection, or verdict logic is touched.** Guards 1–9, the impact-graph filter, and
  every per-mutation check are unmodified. This mission edits only the final wall-clock
  comparison and the budget file's timing model.
- **CI remains the timing authority.** Every number the new model is fit from is a real CI job
  log, never a workstation figure — consistent with every prior revision of `suite-budget.json`.
- **The per-mutation 180s timeout and its `timeout` verdict are unchanged.** A single hung arm is
  already caught there; the wall-clock ceiling's job is catching a *systemic* slowdown across the
  whole run, not an isolated arm.

## Approach

Replace the flat `selftestCeilingSeconds` constant with a small model —
`fixedSeconds + perArmSeconds × armCount` — computed at runtime from `mutations.length`, so the
ceiling scales automatically with corpus size instead of needing a human to notice and raise it.
Extract the arithmetic into a pure, unit-tested function (`scripts/lib/selftest-budget.mjs`) used
by both the real harness and a fast test, so the gate's pass/fail behaviour is independently
verifiable without a 28-minute run for every check.

### What was rejected, and why

- **Median-of-N or best-of-N reruns.** The harness is already ~27–33 minutes per run; rerunning
  it 2–3× per CI job to take a median is not viable inside a CI job budget and was rejected on
  cost alone, not on merit.
- **A wider flat ceiling (a sixth raise).** Rejected for the reason `suite-budget.json` already
  states about itself: it does not clear the growth problem, only defers it, and the file's own
  text says a breach "must trigger investigation rather than another automatic raise."
- **Re-fitting the per-file cost model (`A + B × files_selected`) at 272 arms.** Would be a
  tighter model in principle, but requires per-arm file-selection counts pulled from CI job-log
  timestamps for the current corpus, which this mission does not have budget to extract and
  independently verify (the file's own prior instances of this model came from a dedicated,
  multi-run CI log-mining pass). Filed as a possible future refinement rather than guessed at
  here.
- **A percentage-based ceiling (e.g. "no more than 1.6× the last green run").** Ties the budget to
  whichever run happened to run immediately before it rather than to a stable basis, and would
  drift indefinitely rather than being anchored to a recorded measurement.

## Requirements

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Arm-count-scaled ceiling | As a harness maintainer, I want `selftestCeilingSeconds` replaced by a ceiling computed from the current mutation-arm count, so that ordinary corpus growth cannot breach the gate by construction. | High | Open |
| FR-002 | Model fit from real CI data | As the operator, I want the model's `fixedSeconds`/`perArmSeconds` fit from real, cited CI job logs at two arm-count buckets (10-arm guard self-check, 272-arm main run), with the file's established 1.5213 headroom multiplier applied, so the ceiling is evidenced rather than guessed. | High | Open |
| FR-003 | Gate can still fail for a real reason | As a reviewer, I want proof that the new ceiling rejects a genuinely slower harness run, not only that it accepts today's variance, so that the gate is not a check that can never fire. | High | Open |
| FR-004 | Recorded reasoning | As a future mission, I want `suite-budget.json`'s `$comment` history extended (not replaced) with what was measured, what was chosen, and what the new gate does and does not catch, in the file's existing style. | High | Open |
| FR-005 | Duplicate-issue resolution recorded | As the operator, I want a plain recommendation on which of #168/#408/#419 should close as duplicate/stale and which is the tracking issue, with the evidence for each, so the operator can close them without re-deriving it. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No verdict change | Every mutation arm's guard verdict (guards 1–9) is byte-identical in behaviour before and after this change — only the final wall-clock comparison is edited. | Correctness | High | Open |
| NFR-002 | Fail-closed on a malformed budget | A `suite-budget.json` missing or malformed `fixedSeconds`/`perArmSeconds` fails the harness closed with a named error, never silently skips the check. | Reliability | High | Open |
| NFR-003 | Historical acceptance | The new computed ceiling accepts all eight real 272-arm CI observations gathered for this mission (1346.6s–1949.7s) and all six real 10-arm observations (103.6s–116.3s). | Correctness | High | Open |
| NFR-004 | Demonstrated failure mode | A synthetic run at 2× the worst observed 272-arm total, and a real, artificially slowed execution of the 10-arm guard self-check path, both fail the new gate. | Correctness | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No selection/guard logic edited | Guards 1–9 and the impact-graph filter are unmodified. | Technical | High | Open |
| C-002 | CI is the timing authority | Every cited timing figure is a real CI run (URL/run id cited); no workstation figure is used as a basis for the committed model. | Process | High | Open |
| C-003 | One bounded Work Package | The whole mission is implemented as a single WP: the model, the script change, the test, and the `suite-budget.json` record. | Process | High | Open |
| C-004 | No PR, no merge, no issue-close | This mission stops at a reviewable diff on the mission branch. Closing #168/#408/#419 and merging are the operator's. | Process | High | Open |

## Success Criteria

- **SC-001**: `scripts/suite-selftest.mjs` computes its ceiling as `fixedSeconds + perArmSeconds ×
  mutations.length` instead of reading a flat constant, and prints the computed value.
- **SC-002**: A unit test (`tests/node/*.test.ts`) proves, from the real committed
  `suite-budget.json` model: (a) all eight real 272-arm CI observations pass, (b) all six real
  10-arm CI observations pass, (c) a synthetic 2× worst-case total fails.
- **SC-003**: A real, executed run of `node scripts/suite-selftest.mjs --selftest` (10-arm path)
  with an artificial per-arm delay fails the new gate; the same command without the artificial
  delay passes it. Both are executed for real and their output is quoted in the mission report,
  not estimated.
- **SC-004**: `suite-budget.json`'s `$comment` array gains a new entry, appended (not
  overwriting any prior entry), recording: what was measured, the two-bucket fit, the multiplier
  applied, what the new gate catches (systemic slowdown) and what it does not (a single
  timed-out arm, already caught elsewhere), and an explicit note that this is a two-point
  extrapolation, not a multi-arm-count regression.
- **SC-005**: The mission report states, with evidence, which of #168/#408/#419 should close as
  duplicate/stale and which is the tracking issue, without closing any of them.
