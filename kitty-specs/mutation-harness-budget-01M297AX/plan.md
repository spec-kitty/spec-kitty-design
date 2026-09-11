# Implementation Plan: mutation harness budget

**Mission**: `mutation-harness-budget-01M297AX` · **Branch**: `mission/mutation-harness-budget`
**Base**: `train/elements-first@e696278c` · **Issues**: #419 (primary), #408 (duplicate evidence), #168 (stale)

## Technical Context

**Language/Version**: JavaScript (ESM, Node 22) for the harness and budget model; TypeScript for
the unit test (Vitest node project).

**Primary Dependencies**: none new. `scripts/suite-selftest.mjs` already reads
`suite-budget.json` and `mutations.json`; this mission adds one pure module with no external
dependency.

**Storage**: none. `suite-budget.json` remains the sole committed input for the timing model.

**Testing**: a new `tests/node/*.test.ts` file (Vitest node project, runs under `npm run test`,
66.9s ceiling, unaffected by this mission) plus a real, manually-executed run of
`node scripts/suite-selftest.mjs --selftest` (10-arm path, ~2 minutes) for the red-first proof.
The full 272-arm harness (~27 minutes) is **not** re-run locally for this mission: guards 1–9 and
the mutation loop are untouched, the numeric ceiling is validated against eight already-real CI
observations (cited by run id), and the `--selftest` path exercises the exact same tail
arithmetic this mission changes. This is recorded explicitly so the choice not to spend 27
minutes reads as a decision, not an omission.

**Target Platform**: GitHub Actions `ubuntu-latest`, job `test` in `.github/workflows/ci-quality.yml`
(unchanged — no workflow edit needed, the two mutation-harness steps already invoke the script
this mission edits).

**Project Type**: monorepo script/config change — `scripts/`, `tests/node/`, `suite-budget.json`.
No package source touched.

**Performance Goals**: N/A (this mission changes a CI gate's own arithmetic, not product code).

**Constraints**: no guard/selection logic edited (C-001); every cited timing figure is a real CI
run, no workstation figure used as a basis (C-002); one bounded WP (C-003); no PR/merge/issue-close
(C-004).

**Scale/Scope**: 1 new module (~30 lines), ~15-line edit to `scripts/suite-selftest.mjs`, 1 new
test file, 1 `suite-budget.json` edit (schema change + one appended `$comment` entry).

## Charter Check

No charter gate in this repo restricts CI-gate/tooling changes beyond the hard rules already in
`CLAUDE.md` (commit scopes, no hand-edits to generated files — neither applies here). This
mission touches no `packages/*` source, no token, no component, so rules 1–7 in `CLAUDE.md` §3 are
not implicated. The `docs/contributing/` recipe for ratchet files applies to `mutations.json`/
`behaviours.json`, not `suite-budget.json`, which this file's own header already governs.

## Project Structure

### Documentation (this mission)

```
kitty-specs/mutation-harness-budget-01M297AX/
├── spec.md
├── plan.md              # this file
└── tasks/                # WP01 task file, from /spec-kitty.tasks
```

### Source Code (repository root)

```
scripts/
├── suite-selftest.mjs          # edited: replace flat ceiling read with computed-model call
└── lib/
    └── selftest-budget.mjs     # new: pure ceiling arithmetic, no I/O

tests/node/
└── selftest-budget.test.ts     # new: real-data + synthetic-failure unit tests

suite-budget.json                # edited: selftestCeilingSeconds -> selftestBudget model + history entry
```

**Structure Decision**: single project (this is a CI-tooling change inside the existing
monorepo root, not a new package). The pure arithmetic goes in `scripts/lib/` — a new directory,
but `scripts/` already has 20+ single-purpose `.mjs` gate scripts and no precedent against a
`lib/` subdirectory for shared, testable logic; keeping the model importable from a Vitest node
test (rather than only inlined in `suite-selftest.mjs`) is what makes NFR-004's "demonstrated
failure mode" requirement checkable in under a second instead of over an hour.

## Architecture of the change

```
BEFORE                                          AFTER
suite-budget.json                               suite-budget.json
  "selftestCeilingSeconds": 1649.8                "selftestBudget": {
                                                     "fixedSeconds": 70.5,
                                                     "perArmSeconds": 10.65,
                                                     "multiplier": 1.5213,
                                                     ...basis fields...
                                                   }

suite-selftest.mjs                              suite-selftest.mjs
  if (elapsed > budget.selftestCeilingSeconds)     const ceilingSeconds =
                                                      computeSelftestCeilingSeconds(
                                                        budget.selftestBudget, mutations.length);
                                                    if (elapsed > ceilingSeconds)
```

`mutations.length` is already computed at the top of the script (`const mutations = list.mutations
?? []`, line 61) for both the main 272-arm run and the 10-arm `--selftest` run, so the ceiling
becomes a function of the corpus that is actually running, in both invocations, with no new input.

### Why two parameters, not one flat per-arm rate

The harness's two real invocations sit at very different arm counts (10 for the guard
self-check, 272 for the main run) and share one **fixed** cost — the baseline suite run before
the mutation loop starts — that does not scale with arm count. A single flat `seconds_per_arm`
solved from the 272-arm data (≈7.17s/arm at the worst observation) would set the 10-arm ceiling
to ~72s before headroom, under the 10-arm path's own real worst observation (116.3s) — i.e. it
would immediately red the guard self-check on ordinary variance, the exact defect this mission
exists to remove. `fixedSeconds + perArmSeconds × armCount`, fit through both buckets' own worst
observations, gives each invocation the same proportional (52.1%, ×1.5213) headroom over its own
worst observation instead of importing the other invocation's shape.

### What this does and does not catch (recorded here and in `suite-budget.json`)

- **Catches**: a systemic slowdown — every arm (or the fixed baseline step) getting genuinely
  slower, e.g. a real perf regression in shared setup/teardown, a change that makes the browser
  suite intrinsically slower, or a much larger impact-graph selection average. This is what the
  synthetic 2× test and the real artificial-delay `--selftest` proof both exercise.
- **Does not catch, by design, because another mechanism already does**: a single arm hanging —
  that is the existing per-mutation `SUITE_TIMEOUT_MS`/`timeout` verdict
  (`suite-selftest.mjs:118`, `:825-833`), unchanged by this mission. A single arm that is merely
  somewhat slower (not hung) has to move the *average* enough to matter; that is deliberate, since
  the runner-variance evidence (#419) shows individual-arm timing already varies without any
  arm being defective.

## Work Packages

### WP01 — Arm-count-scaled selftest ceiling

- **Purpose**: Replace the flat, non-recalibrating `selftestCeilingSeconds` with a computed,
  arm-count-scaled ceiling; prove it accepts real historical variance and rejects a genuine
  slowdown; record the reasoning in `suite-budget.json`.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, NFR-003,
  NFR-004.
- **Affected surfaces**: `scripts/lib/selftest-budget.mjs` (new), `scripts/suite-selftest.mjs`
  (edited: budget read + final comparison + messages), `tests/node/selftest-budget.test.ts`
  (new), `suite-budget.json` (edited).
- **Sequencing**: none — this is the whole mission, one WP, no dependencies.
- **Risks**: a malformed or missing `selftestBudget` object must fail closed (NFR-002) rather
  than silently falling back to "no ceiling" — mitigated with an explicit shape check that exits
  1 with a named error, mirroring the existing guards' style.
