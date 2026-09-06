# Tasks: adr-index-reconciliation-and-gate

**Input**: `plan.md`, `spec.md`
**Branch**: `mission/adr-index-reconciliation-and-gate` (planning base **and** merge target — this
mission lives on its own mission branch under the `single_branch` topology it was created with;
the PR onto `train/elements-first` is opened by the loop and merged by the operator).

One work package. The reconciled table and the gate that asserts it are one change: committing the
gate before the table lands gives a commit whose CI is red by construction, and committing the
table before the gate leaves the class open for exactly as long as it takes someone to forget.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Rebuild the README ADR table from `decisions/*.md` — 15 rows, identifiers unpadded per each record's own H1, titles and Statuses transcribed from the records (FR-001, FR-002, FR-003) | WP01 | |
| T002 | Correct the section preamble, which claims the directory holds "All Accepted decisions" while five records are Proposed and one Complete (FR-002) | WP01 | |
| T003 | Replace the programme doc's `ADR-8`…`ADR-14` enumeration with a pointer to the directory and the table, preserving #194's Proposed-does-not-bind ruling in general form; leave line 98 alone (FR-004, FR-005) | WP01 | |
| T004 | Write `scripts/check-adr-index.mjs` — pure check functions with both-direction coverage, Status agreement, and wiring assertion (FR-006, FR-007, FR-010) | WP01 | |
| T005 | Give every check an explicit empty-set floor, and the script a `--selftest` with a probe per defect class and an asserted probe-count floor (FR-008, FR-009) | WP01 | |
| T006 | Wire the self-test and the gate into `ci-quality.yml`'s `lint-code` job (FR-010) | WP01 | |
| T007 | Break the gate deliberately in both directions, record the verbatim output, restore the tree (NFR-002, SC-005) | WP01 | |
| T008 | Confirm no ADR content or Status changed — `git diff` over `docs/architecture/decisions/` empty (FR-011, SC-002) | WP01 | |

No `[P]` markers: T001–T003 and T004–T006 touch interlocking surfaces (the gate asserts the table),
and T007 must run after both.

## Work Packages

### WP01 — Reconcile the ADR indexes and gate their correspondence

- **Goal**: `docs/architecture/README.md`'s ADR table and
  `docs/architecture/elements-first-programme.md`'s governing-decisions line agree with
  `docs/architecture/decisions/` as the source of truth, and `scripts/check-adr-index.mjs` — wired
  into `lint-code` — fails when either direction of that correspondence breaks or when the check
  would run over an empty set.
- **Priority**: P0 — this mission's only deliverable.
- **Independent test**: `node scripts/check-adr-index.mjs` exits 0 and reports 15 records / 15
  rows; `--selftest` trips every probe; adding an unindexed decision file reds it naming the file;
  adding a row targeting a non-existent file reds it naming the row;
  `git diff origin/train/elements-first -- docs/architecture/decisions/` is empty.
- **Included subtasks**: T001–T008.
- **Dependencies**: none.
- **Estimated prompt size**: small — one new script, two docs edits, two workflow steps.
- **Risks**: see `plan.md` R1–R4. The one that bites is R1: a table parser strict enough to be
  useful and loose enough not to red on a legitimate README edit. Scoped to the
  `## Decisions (ADRs)` section, asserting link target and Status only, never prose.

## Parallelization

None.

## MVP scope

The whole work package. A smaller slice — reconciling the table without the gate — is what #193
explicitly says is not enough ("that would close the class rather than the instance"), and a gate
without the reconciliation is red on arrival.

## Notes on requirements not separately tasked

- **NFR-001** (checks are pure functions so the self-test can feed them synthetic defects) is a
  constraint on how T004 is written, checked by T005 existing at all — a check that cannot be
  probed cannot have a probe.
- The constraints in `spec.md` (commit enum, PR base, `--skip-nx-cache`) are commit- and
  PR-time process rules, not subtasks. No generated artifact is touched by this mission, so the
  `--skip-nx-cache` rule has no subject here; confirmed rather than assumed.
