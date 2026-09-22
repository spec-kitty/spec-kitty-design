# Tasks: Button tone record and commit exemptions

**Input**: `spec.md`, `plan.md` (both committed)
**Branch**: `mission/button-tone-record-and-commit-exemptions` (single_branch topology — this
mission's WP executes directly on this branch; no worktree, per `spec-kitty`'s own
`single_branch` contract)

Per `plan.md`'s Implementation Concern Map, this mission is **one bounded Work Package and one
PR**. IC-01 (#420's commitlint exemptions) and IC-02 (#403's ADR) are independent of each other,
but both are small, neither changes rendered output, and splitting them into two WPs would cost
more in per-WP overhead (two branches, two reviews, two gate runs) than either concern is worth on
its own — the mission brief itself calls for exactly one bounded WP.

## Subtask Index

| ID | Description | WP | Parallel |
|----|---|----|----|
| T001 | `commitlint.config.cjs`: add three anchored, vocabulary-closed exemptions for the real `tracer-append`/`retrospect create`/`retrospect backfill` auto-commit shapes | WP01 | |
| T002 | `scripts/check-commitlint-config.mjs`: extend `generatedMessages` (three real messages, ignored+valid) and `nearMisses` (one bounded near-miss per new pattern, not ignored); run the harness and record the real result; execute a red-first proof | WP01 | |
| T003 | New ADR `docs/architecture/decisions/2026-09-11-17-sk-button-tone-intensity-flattening.md` (Status: Proposed) recording the `BUTTON_VARIANTS` tone × intensity flattening, the codegen-source fact, the ceiling/migration shape, and a reference to #348; index it in `docs/architecture/README.md` | WP01 | |

T001/T002 (the commitlint concern) and T003 (the ADR concern) touch disjoint files and have no
data dependency on each other, but they are sequenced within one WP rather than split into two
because each is individually too small to justify its own branch/PR/review cycle, and the mission
brief requires exactly one WP.

## Work Package WP01 — spec-kitty commit exemptions and sk-button tone-flattening ADR (single WP, single PR)

**Priority**: P1 for User Story 1 (#420 — the actual CI-breaking defect), P2 for User Story 2
(#403 — a documentation deliverable with no urgency but no smaller independently-useful slice
either; the record is either complete or it evaporates a third time).

**Independent test**: run `node scripts/check-commitlint-config.mjs` (exit 0, real messages pass,
near-misses fail) and `node scripts/check-adr-index.mjs` (exit 0, new record indexed with a
matching Status) — both are fully testable as one slice, and there is no smaller
independently-shippable unit that satisfies either issue's acceptance criteria in isolation.
