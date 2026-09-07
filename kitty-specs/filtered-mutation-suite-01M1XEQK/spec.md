# Mission Specification: filtered mutation suite

**Mission Branch**: `mission/filtered-mutation-suite`

**Created**: 2026-09-07

**Status**: Draft

**Issue**: [#225](https://github.com/spec-kitty/spec-kitty-design/issues/225) `[ci] fund the filtered-suite redesign so the mutation budget stops needing raises` — operator ruling, 2026-09-06

**Base**: `train/elements-first@99a5144`

**Blocks**: [#241](https://github.com/spec-kitty/spec-kitty-design/pull/241) (#179), held open on the mutation ceiling alone

## Context

`scripts/suite-selftest.mjs` re-derives ADR-11 Confirmation #1 on every CI run: for each entry in
`mutations.json` it restores a frozen sandbox, applies one string replacement, runs the browser
suite, and asserts the NAMED test failed with no collateral. Its committed wall-clock ceiling has
been raised five times — 180 → 240 → 360 → 560 → 881.9 → 1405.5s — and PR #241 breaches 1405.5s
with all 165 of its arms producing their named red.

### What the issue assumed, and what is actually true

Issue #225 and this mission's brief both describe the harness as re-running "the whole behaviour
suite per mutation arm", making cost `O(arms × tests)`. **That premise is stale.** A filtered
suite already landed on 2026-09-06 in `e83ec64` (`fix(ci): stabilize mutation verification`) —
the same day as the ruling. `suite-selftest.mjs:669-712` resolves every mutated source through
Vitest's `getRelevantTestSpecifications()` against the unmutated sandbox and passes the resulting
file list to the per-arm run. Every recent measurement in `suite-budget.json`, including the five
runs the ruling and the brief quote, was taken **with that filter already active**, and every one
reports `0 full-suite fallback(s)`.

So the mission is not "build a filtered suite". It is: **the filter exists, is sound, and is
inert — find out why and make it bite.**

### Why the filter is inert (measured)

Resolving the graph for every one of the 36 mutated sources on `train/elements-first@99a5144`:

| mutated source class | test files selected (of 36 browser files) |
|---|---|
| `packages/elements/src/**` (30 sources) | **30 – 36** |
| `packages/react/src/Sk*.js` (5 sources) | 6 |
| `fixtures/elements-behaviour/src/sk-behaviour-fixture.ts` | 1 |

The graph is telling the truth. 20 of the 23 `fixtures/elements-behaviour/src/*.test.ts` files
open with `import '@spec-kitty/elements';` — a **side-effect import of the package barrel**, which
re-exports every element. `sk-button.test.ts` therefore genuinely depends on `sk-notice.ts`,
`sk-grid.ts` and every other element module, so a `sk-notice` mutation genuinely could break it.
The dependency-derived filter cannot narrow what the imports have made wide.

The six behaviour tests that already deep-import their element instead of the barrel —
`sk-app-shell`, `sk-context-sidebar`, `sk-evidence-chain`, `sk-metric`, `sk-page-header`,
`sk-personal-rail` — are exactly the six files a `sk-button` mutation does **not** select. The
pattern that fixes this is already in the repository; it was simply never applied to the rest.

### The cost model, measured on CI rather than assumed

Per-arm wall clock was extracted from the GitHub job-log timestamps of four CI runs of PR #241's
identical 165-arm / 412-assertion set, by differencing consecutive `✅ SC-nnn` lines:

| job | total arm time | mean | median | min | max | arms > 7s |
|---|---|---|---|---|---|---|
| `101607380580` (`9731e9e6a`) | 954.3s | 5.78 | 6.27 | 1.34 | 7.23 | 1 |
| `101610675249` (`9638e6888`) | 1468.5s | 8.90 | 9.67 | 2.16 | 10.69 | 145 |
| `101615158415` (`b08205b31`) | 1487.5s | 9.01 | 9.80 | 2.23 | 10.81 | 145 |
| `101619918808` (`909829a13`) | 1422.1s | 8.62 | 9.37 | 2.11 | 10.24 | 145 |

Cost is linear in the number of selected test files. Fitting the three observed selection sizes
(1, 6, 30 files) on job `101619918808`:

**`seconds_per_arm ≈ 1.85 + 0.25 × files_selected`** (CI, ubuntu-latest, chromium)

**`seconds_per_arm ≈ 1.00 + 0.176 × files_selected`** (this workstation, chromium)

145 of 165 arms select ~30 files and cost ~9.4s each; the 20 arms that select 1 or 6 files cost
2.1–3.7s. The per-file marginal cost is the test execution itself — a behaviour file runs
~15 assertions in ~190ms standalone — so there is no fixed overhead left to trim. **The only
lever is running fewer files, and the only way to run fewer files honestly is to stop importing
what the test does not use.**

### Why the ceiling keeps needing raises

`files_selected` for an element source is approximately *the number of element behaviour test
files in the repository*. Every mission that adds an element adds a test file to the selection of
every existing element arm. Cost is therefore `O(arms × elements)` — quadratic in mission count —
which is precisely the shape that has forced five raises. Making the imports honest moves the
element-behaviour term out of the per-arm cost and leaves a fixed block, i.e. `O(arms)`.

### The variance is the runner, not lane instability (#238)

[#238](https://github.com/spec-kitty/spec-kitty-design/issues/238) reports the webkit lane
stopping mid-queue and was a plausible contributor to the 56% wall-clock spread. It is not:

- The mutation harness spawns Vitest with `CI: ''` (`suite-selftest.mjs:376`), so
  `vitest.config.mts` gives it **chromium only**. #238 is webkit-only, in the separate
  `measure-suite-time.mjs` step, which passed in 26–28s in all four runs above.
- The spread is a **uniform multiplier, not a tail**. Between the 954.3s run and the 1487.5s run
  every cohort scales by the same factor: heaviest-120 mean 6.38 → 9.94 (1.56×), lightest-20 mean
  1.70 → 2.81 (1.65×), median 6.27 → 9.80 (1.56×). No run contains a hang, a completion retry, or
  a single outlier arm; the slowest arm in the slow run is 10.81s against a median of 9.80s.

A dropped file or a hang would show as an isolated multi-second or 180s gap. There are none. The
spread is runner speed. Filtering does not fix it, and no ceiling can be set as though it were
absent — the ceiling must absorb a ~1.6× runner factor over the fast case, or it will fail on
variance, which `suite-budget.json` argues at length is worse than failing honestly.

Instability of the *class* #238 describes does exist inside the mutation harness, and was
reproduced on this workstation on **chromium**, twice in three runs: once a behaviour file silently
absent from a 36-file serialized run (rejected by the baseline guard), once a 180s hang on a
`sk-nav-pill` arm (rejected by the `timeout` verdict). Both fail closed today. Neither appears in
the four CI runs measured. This is recorded as a finding, not fixed here.

## What must not change

Every property below is the point of the harness, not its cost, and each survives this mission
unchanged because **no selection logic is edited at all**:

- **Each arm produces its own named red** against a green baseline, with no collateral. Guards 4
  and 5 are untouched.
- **Guard 7's fail-closed property.** Guard 7 compares `mutations.json` ids against
  `behaviours.json` applicable pairs *before any suite runs* and does not read the selection. Over-
  filtering cannot reach it. Its `unknown`/`uncovered` arms stay exactly as recorded at
  `suite-selftest.mjs:29-32`.
- **Applicable-behaviours filtering** shared with `floor-reporter.mjs:121` — untouched.
- **No id minted or dropped.** `tests/node/config-contract.test.ts` pins the id set; guard 7 is set
  equality. This mission adds no behaviour and removes none.
- **Fallbacks stay pessimistic.** A graph error or a zero-file resolution still falls back to the
  complete suite (`suite-selftest.mjs:698-704`), never to zero tests.

## Approach

**Make the dependency graph tell the truth, and add the one fail-closed guard the filter is
missing.** No new mapping, no new derivation, no coverage instrumentation, no declared-subject
selection.

1. **Deep imports in the elements-behaviour fixture.** The 20 behaviour test files that import the
   `@spec-kitty/elements` barrel import instead, directly, the element modules they exercise — the
   element under test plus every other element whose tag the file actually instantiates. This is
   the pattern six sibling files already use.

2. **Guard 9 — the selection must contain the subject.** Every entry in `mutations.json` declares
   a `subject` (157 of 157 do). Before the mutation loop, assert that each entry's subject file is
   present in the graph selection resolved for its source, unless that source fell back to the full
   suite. A selection that cannot contain the named test can only produce `absent` — indistinguish-
   able from a syntax-breaking mutation — so today a stale or over-narrow selection is rejected for
   the wrong reason and reported with the wrong cause. Guard 9 names it, once, before any arm runs.

### What was rejected, and why

- **Cutting the barrel edge inside the harness** (treating `index.ts` as a non-propagating node).
  Unsound and it *would* have hidden a real defect: 12 behaviour test files instantiate elements
  other than their own subject, so barrel-transitive collateral is real. Rejected.
- **Coverage- or runtime-derived observer sets** (instrumenting `customElements.define` to record
  which tags each test file constructs). Sound in principle and narrower than deep imports, but it
  is a fifth derivation in a repository that has had four derivations hide a defect (#193, #197,
  #232, #234). Rejected on that record.
- **Declared per-mutation test lists in `mutations.json`.** A hand-maintained mapping that goes
  stale silently and whose staleness produces a green. Rejected — it is the exact defect class the
  brief names.
- **Sharding the arms across parallel CI jobs.** Reduces wall clock without reducing cost, and the
  operator ruling explicitly chose the option that "ends the sequence rather than extending it".
  Rejected as a deferral.
- **Re-enabling `browser.fileParallelism` inside an arm.** ~3× on paper, but the flag was disabled
  after measured module loss (`vitest.config.mts:156-160`) and #238 plus this mission's own local
  reproduction show the browser lane is not reliable enough. It would trade a gate that fails on
  timing variance for a gate that fails on collection variance. Rejected.
- **Narrowing the React wrappers' `import("@spec-kitty/elements")` to per-element subpaths.** This
  is the next real lever — it is what keeps six `fixtures/react-consumer` files in every element
  arm — but it changes the published package's export surface and the wrapper generator. Measured
  and filed rather than taken here.

## Requirements

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Honest fixture imports | As a harness maintainer, I want each elements-behaviour test to import only the element modules it exercises, so that the dependency-derived filter can narrow the per-arm selection without any new mapping. | High | Open |
| FR-002 | Guard 9 — subject in selection | As a harness maintainer, I want a mutation whose subject file is absent from its source's selection to be rejected by name before any arm runs, so that an over-narrow selection can never be reported as an ordinary `absent`. | High | Open |
| FR-003 | Re-derived ceiling | As the operator, I want `selftestCeilingSeconds` re-derived from the new cost model with its arm count, test count, basis and absorbed variance recorded, so that the next raise is not a loop's authority. | High | Open |
| FR-004 | Recorded cost model | As a future mission, I want the per-arm cost model and the measured before/after figures committed in `suite-budget.json`, so that growth pressure is visible before it becomes a breach. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Assertion set unchanged | The browser behaviour suite reports the identical assertion multiset before and after, per file and per name — no assertion added, removed, renamed or moved. | Correctness | High | Open |
| NFR-002 | Verdict agreement | Every arm's harness verdict is identical before and after, across the complete 157-arm set. | Correctness | High | Open |
| NFR-003 | Per-arm cost | Mean selected files per element arm falls below 15, measured by resolving the graph for every mutated source. | Performance | High | Open |
| NFR-004 | Growth decoupling | Adding one element adds test files to that element's own arms' selections only, not to every existing element arm's. | Performance | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No selection logic edited | `getRelevantTestSpecifications()` remains the sole selection authority; its fallbacks stay pessimistic. | Technical | High | Open |
| C-002 | Guards 1–8 unedited | No existing guard's condition changes. Guard 9 is additive and pre-loop. | Technical | High | Open |
| C-003 | Registry untouched | `behaviours.json` and the id set in `tests/node/config-contract.test.ts` are not modified. | Technical | High | Open |
| C-004 | CI is the budget authority | Local timings are recorded as ratios only. `selftestCeilingSeconds` is set from CI figures, per #225's own constraint. | Process | High | Open |

## Success Criteria

- **SC-001**: Every one of the 157 arms produces its named red with no collateral, and every arm's
  verdict matches the pre-change run entry for entry.
- **SC-002**: The browser behaviour suite passes with the same assertion multiset as before, and
  `measure-suite-time.mjs` stays under its 40s ceiling.
- **SC-003**: Resolving the graph for all 36 mutated sources shows mean selected files per element
  source below 15, with zero full-suite fallbacks.
- **SC-004**: A sample of at least six arms spanning all three selection classes agrees — same
  verdict, same named red, same collateral finding — between the filtered run and a full-suite run
  under the same mutation.
- **SC-005**: Guard 9 rejects a deliberately mis-declared subject, and the rejection names guard 9
  rather than falling through to `absent`.
- **SC-006**: PR #241's 165-arm set completes under the new ceiling, measured on CI.
- **SC-007**: `suite-budget.json` records the new ceiling with its basis, arm count, test count, and
  the fraction of the measured 1.6× runner spread it absorbs.
