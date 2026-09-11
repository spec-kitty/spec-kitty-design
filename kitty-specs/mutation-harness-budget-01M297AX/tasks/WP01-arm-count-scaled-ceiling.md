---
work_package_id: WP01
title: Arm-count-scaled selftest ceiling, with a proven failure mode
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- C-001
- C-002
- C-003
- C-004
planning_base_branch: mission/mutation-harness-budget
merge_target_branch: mission/mutation-harness-budget
branch_strategy: Planning artifacts for this mission were generated on mission/mutation-harness-budget. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/mutation-harness-budget unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
phase: Phase 1 - mutation harness budget
history: []
agent_profile: backend-benny
authoritative_surface: scripts/suite-selftest.mjs
create_intent:
- scripts/lib/selftest-budget.mjs
- tests/node/selftest-budget.test.ts
execution_mode: code_change
model: ''
owned_files:
- scripts/suite-selftest.mjs
- suite-budget.json
role: implementer
tags:
- ci
- mutation-harness
- performance
task_type: implement
tracker_refs:
- '#419'
- '#408'
- '#168'
---

# Work Package Prompt: WP01 — Arm-count-scaled selftest ceiling

## Outcome and Definition of Done

1. `scripts/lib/selftest-budget.mjs` exports a pure function computing the selftest ceiling as
   `fixedSeconds + perArmSeconds × armCount` from `suite-budget.json`'s new `selftestBudget`
   object, failing closed (thrown error) on a missing/non-finite field.
2. `scripts/suite-selftest.mjs` uses that function instead of reading a flat
   `selftestCeilingSeconds`, for both the main run and the `--selftest` guard-check run (they
   already share the same tail block and `mutations.length`).
3. `suite-budget.json`'s `selftestCeilingSeconds` field is replaced by a `selftestBudget` object
   (`fixedSeconds`, `perArmSeconds`, `multiplier`, plus the basis fields the file's style already
   uses), fit from real CI data at two arm-count buckets (10-arm guard self-check, 272-arm main
   run), each run's own worst observation, scaled by the file's established 1.5213 multiplier.
4. `tests/node/selftest-budget.test.ts` proves, against the real committed model: all eight real
   272-arm CI observations and all six real 10-arm CI observations pass; a synthetic 2×
   worst-case total fails.
5. A real, executed run of `node scripts/suite-selftest.mjs --selftest` with a genuine artificial
   per-arm delay fails the new gate; the same command without the delay passes it. Both command
   outputs are quoted verbatim in the mission report.
6. `suite-budget.json`'s `$comment` array gains one appended entry (existing entries untouched)
   recording what was measured, the fit, what the gate catches and does not, and the two-point
   extrapolation caveat.

## Evidence Required

- The eight real CI run ids/timings this WP's ceiling is fit from, cited (already gathered:
  34561511046, 34592445070, 34595310707, 34606532461, 34618855795, 34623594612, 34632185898,
  34637284298 — all `train/elements-first`, 272 mutations / 47 sources / 0 full-suite fallbacks).
- `npm run test -- tests/node/selftest-budget.test.ts` output (or the equivalent vitest
  invocation), real and pasted.
- Real terminal output of both `--selftest` runs (artificially slowed: red; normal: green).
- `npm run quality:lint` (or `node scripts/check-gate-wiring.mjs`) output confirming no
  ci-quality.yml wiring assumption breaks.

## Reviewer findings addressed

- **Finding 1 (Medium)**: `suite-budget.json#selftestMeasurements` now carries the 14 structured
  rows (8 at 272 arms, 6 at 10 arms) the committed `selftestBudget` fit is derived from, each with
  its real run id and job id, in the file's established shape.
- **Finding 2 (Low)**: `scripts/lib/selftest-budget.mjs` now rejects `fixedSeconds <= 0` and
  `perArmSeconds <= 0` (previously only `< 0`), naming the invariant a zero would silently break;
  `tests/node/selftest-budget.test.ts` proves both zero cases throw.
- **Finding 3 (Low, no action taken on the code)**: the `config-contract.test.ts` SC-310
  `npx nx show projects` timeout observed during this WP's implementation (5000ms exceeded) was
  independently NOT reproduced by the reviewer, who saw it pass consistently under 1.1s. It is
  outside this WP's diff either way (no tsconfig/nx-project/config-contract file is touched here).
  Recorded as environment-dependent, not as a claim that either observation was wrong: reproduced
  via `git stash` against unmodified HEAD on this implementer's workstation both before and after
  this WP's changes, so it predates and is unaffected by this diff, but the reviewer's environment
  did not see it.

## Boundaries

- Do not edit guards 1–9, the impact-graph selection, or any mutation-loop logic (C-001).
- Do not set the committed model from a workstation timing — every basis figure is a cited CI run
  (C-002).
- Do not run the full 272-arm harness locally unless something in this WP's own diff touches the
  mutation loop (it does not); the `--selftest` path and the unit test are the verification
  surfaces for this WP.
- Do not raise, lower, or otherwise touch `mutations.json`, `behaviours.json`, or any other
  ratchet file.
- Do not merge, open a PR, or close #168/#408/#419 — report the duplicate-resolution
  recommendation for the operator instead.
