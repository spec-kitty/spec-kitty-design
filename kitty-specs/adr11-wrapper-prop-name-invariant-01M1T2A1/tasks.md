# Tasks: adr11-wrapper-prop-name-invariant

**Input**: `plan.md`, `spec.md`
**Branch**: `mission/adr11-wrapper-prop-name-invariant` (planning base **and** merge target — this
mission lives entirely on its own mission branch, per the `single_branch` topology it was created
with; there is no separate PR/merge step run by this loop — the operator handles the PR).

This mission is docs-only: one file amended, one work package, no code change. There is nothing to
decompose into parallel or sequential subtasks beyond the sections the ADR amendment itself needs.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | State the invariant (field-set preserved, casing via `MAPPED_PROPS`) and the non-exported-table / fail-closed-read rationale (FR-001, FR-003) | WP01 | |
| T002 | Record the `sk-form-input` worked example and the future-author contract-doc obligation (FR-002, FR-005) | WP01 | |
| T003 | Assess the `REACT_PROPS`/rename-table duplication and record a verdict, flagging to the operator if it would change gate behaviour (FR-004) | WP01 | |
| T004 | Record the operator-override notice for writing this ADR under #189, matching ADR-10's #176 shape (FR-006) | WP01 | |

No `[P]` markers: all four subtasks edit the same file
(`docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`) in the
same pass — splitting them into separate commits would fragment one coherent amendment.

## Work Packages

### WP01 — Amend ADR-11 with the wrapper prop-name invariant

- **Goal**: Land the full amendment described in `spec.md` FR-001..FR-006 into ADR-11, verified
  against the shipped `scripts/build-react-wrappers.mjs` rather than assumed from the issue text,
  with no change to any code file.
- **Priority**: P0 — this mission's only deliverable.
- **Independent test**: `grep -i` for `MAPPED_PROPS` against the amended ADR-11 returns a match
  (SC-001); the file names `sk-form-input`'s three renamed fields (SC-002); it states a
  consolidation verdict for `REACT_PROPS`/rename-table with reasoning (SC-003); it carries an
  override notice referencing #189 (SC-004); `git diff adf85d6 -- scripts/build-react-wrappers.mjs`
  is empty (SC-005).
- **Included subtasks**: T001, T002, T003, T004.
- **Dependencies**: none.
- **Estimated prompt size**: small — one file, prose only.
- **Risks**: see `plan.md` IC-01's risks (FR-004 must not license an unflagged code change;
  the `sk-form-input` field list must be re-verified against the script, not recalled from memory).

## Parallelization

None — one file, one work package, sequential subtasks within it.

## MVP scope

The whole mission is the MVP; there is no smaller mergeable slice than the complete amendment,
since a partial amendment (e.g. stating the invariant without the override notice) would leave
ADR-11 either unauthorized to publish or silently missing one of the issue's three explicit asks.

## Notes on requirements not separately tasked

- **NFR-001** (no code change without a flag) and **NFR-002** (verify claims against the shipped
  script) are constraints on how WP01 is written, not separate subtasks — already discharged by
  the "Background verified" section of `spec.md`, which WP01's author must re-confirm still holds
  (branch has not moved) before writing FR-001/FR-003's claims.
- **C-001/C-002/C-003** are process constraints (scope, commit hygiene, no hand-edited runtime
  state) checked at commit time, not requirements the ADR text itself states.
