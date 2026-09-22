# Tasks: probe-validation-seam-adr

**Input**: `plan.md`, `spec.md`
**Branch**: `mission/probe-validation-seam-adr` (planning base **and** merge target — this mission
lives entirely on its own mission branch, per the `single_branch` topology it was created with;
there is no separate PR/merge step run by this loop — the operator handles the PR).

This mission is docs-only: one new file created, one work package, no code change. There is
nothing to decompose into parallel or sequential subtasks beyond the sections the new ADR itself
needs.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | State the timing constraint and the detached-probe mechanism, plus the `badInput` exception (FR-001, FR-003) | WP01 | |
| T002 | Record the measured pre-fix failure and the `#onInput` no-op regression with its unconditional-`validate()` fix (FR-002, FR-004) | WP01 | |
| T003 | Restate R2's rejected alternative against the shipped design, and cite R9 as settled context without extending it (FR-005, FR-006) | WP01 | |
| T004 | State the two open questions #188 raises, unresolved, for the operator (FR-007) | WP01 | |
| T005 | Record the operator-override notice for writing this new ADR under #188, matching ADR-10's #176 / ADR-11's #189 shape (FR-008) | WP01 | |

No `[P]` markers: all five subtasks author the same new file
(`docs/architecture/decisions/2026-09-06-14-detached-probe-validation-seam.md`) in the same pass —
splitting them into separate commits would fragment one coherent ADR.

## Work Packages

### WP01 — Author ADR-14: the detached-probe validation seam

- **Goal**: Create the new ADR described in `spec.md` FR-001..FR-008, verified against the shipped
  `packages/elements/src/form-input/sk-form-input.ts` and its real tests rather than assumed from
  the issue text, with no change to any code file, and with the two architectural forks #188 raises
  stated but not decided.
- **Priority**: P0 — this mission's only deliverable.
- **Independent test**: the new ADR file exists and states the timing constraint, mechanism,
  `badInput` exception, pre-fix failure, and `#onInput` regression/fix, each traceable to source
  (SC-001); it restates R2's rejected alternative against the shipped design, naming the three
  measured synchronization bugs (SC-002); it contains an "Open questions" section naming both
  #188 forks with no recommended answer (SC-003); it carries an override notice referencing #188
  (SC-004); `git diff 1405e75 -- packages/elements/src/form-input/sk-form-input.ts
  fixtures/elements-behaviour/src/sk-form-input.test.ts` is empty (SC-005).
- **Included subtasks**: T001, T002, T003, T004, T005.
- **Dependencies**: none.
- **Estimated prompt size**: small — one new file, prose only.
- **Risks**: see `plan.md` IC-01's risks (the R2 restatement must not reopen or re-decide R2; the
  open-questions section must not drift into a recommendation by tone; the measured failure and
  regression mechanics must be re-verified against source and tests, not recalled from memory).

## Parallelization

None — one new file, one work package, sequential subtasks within it.

## MVP scope

The whole mission is the MVP; there is no smaller mergeable slice than the complete ADR, since a
partial ADR (e.g. stating the mechanism without the open-questions section, or without the
override notice) would leave it either unauthorized to publish or silently missing one of the
issue's explicit asks.

## Notes on requirements not separately tasked

- **NFR-001** (no prescriptive claim smuggled into descriptive prose), **NFR-002** (verify claims
  against shipped source and tests) and **NFR-003** (unverified claims named as such) are
  constraints on how WP01 is written, not separate subtasks — checked against the drafted ADR
  before commit, using `spec.md`'s scope-boundary section and cited tests as the checklist.
- **C-001/C-002/C-003** are process constraints (scope, commit hygiene, no hand-edited runtime
  state) checked at commit time, not requirements the ADR text itself states.
