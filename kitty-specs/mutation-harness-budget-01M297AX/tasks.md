# Tasks: mutation-harness-budget

**Input**: `spec.md`, `plan.md`
**Branch**: `mission/mutation-harness-budget` (planning base and merge target under the mission's
`single_branch` topology).

One work package. The model, the script wiring, the budget-file record, the test, and the
red-first proof cannot land separately: a model with nothing reading it proves nothing, a script
change with no test is unverified arithmetic, and a budget-file record with no working code
behind it is the exact "prose baseline nothing re-derives" defect `suite-budget.json` already
argues against itself. Five subtasks keep the package inside the charter's reviewable 3–7 range.

## Subtask Index

| ID | Description | WP | Parallel |
| --- | --- | --- | --- |
| T001 | Write `scripts/lib/selftest-budget.mjs`: a pure `computeSelftestCeilingSeconds(selftestBudget, armCount)` function computing `fixedSeconds + perArmSeconds * armCount`, failing closed (thrown error) on a missing/non-finite field (FR-001, NFR-002). | WP01 | No |
| T002 | Wire `scripts/suite-selftest.mjs` to compute the ceiling from `budget.selftestBudget` and `mutations.length` instead of reading a flat `selftestCeilingSeconds`, for both the main run and the `--selftest` guard-check run; update the pass/fail messages (FR-001, NFR-001). | WP01 | No |
| T003 | Replace `suite-budget.json`'s `selftestCeilingSeconds` with a `selftestBudget` model fit from real CI data at the harness's two real invocations (10-arm guard self-check, 272-arm main run), each bucket's own worst observation scaled by the file's established 1.5213 multiplier; append one `$comment` history entry recording the derivation, what the gate catches and does not, and the two-point-extrapolation caveat (FR-002, FR-004). | WP01 | No |
| T004 | Add `tests/node/selftest-budget.test.ts`: prove, against the real committed model, that all 8 real 272-arm and 6 real 10-arm CI observations pass, that the ceiling scales with arm count (closing #408's structural defect), and that a synthetic 2x-worst-case total fails; add fail-closed tests for a malformed budget (FR-003, NFR-003, NFR-004). | WP01 | No |
| T005 | Execute the real red-first proof: `node scripts/suite-selftest.mjs --selftest` with a genuine, temporary artificial per-arm delay fails under the new ceiling; the same command without the delay passes. Record both real outputs, then revert the temporary delay hook so the committed diff carries no debug scaffolding (FR-003, NFR-004, SC-003). | WP01 | No |

T001 precedes T002 (nothing to wire without the module). T002 precedes T003 in practice only in
that the model's shape (`fixedSeconds`/`perArmSeconds`) has to be decided before it is written
into `suite-budget.json`, but both are part of the same commit. T004 depends on T001–T003 (it
tests the committed model). T005 depends on T002 (it exercises the wired script) and is last
because it is a real, executed proof against the finished code, not the module in isolation.

## Work Packages

### WP01 — Arm-count-scaled selftest ceiling, with a proven failure mode

- **Goal**: Replace the flat, non-recalibrating `selftestCeilingSeconds` with a ceiling computed
  from the current mutation-arm count, fit from real CI data, proven (both by unit test and by a
  real executed run) to accept the runner variance this repository has measured and to reject a
  genuine slowdown.
- **Priority**: P1 — `test` is intermittently red on the train itself (#419).
- **Independent test**: `tests/node/selftest-budget.test.ts` passes; a real `--selftest` run
  passes under the committed model; the same command with a genuine artificial delay fails under
  the same model; `node scripts/check-gate-wiring.mjs` stays green.
- **Included subtasks**: T001–T005.
- **Dependencies**: none.
- **Owned surfaces**: `scripts/lib/selftest-budget.mjs` (new), `scripts/suite-selftest.mjs`,
  `suite-budget.json`, `tests/node/selftest-budget.test.ts` (new), and this mission's
  `kitty-specs` directory. No guard, selection logic, `mutations.json`, `mutations.selftest.json`,
  or `behaviours.json` surface is owned.
- **Risks**: recorded in `plan.md`. The controlling one is a malformed budget silently disabling
  the gate; closed by NFR-002's fail-closed requirement and T004's dedicated tests for it.
