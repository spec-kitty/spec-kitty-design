---
work_package_id: WP01
title: Reconcile the ADR indexes and gate their correspondence
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
planning_base_branch: mission/adr-index-reconciliation-and-gate
merge_target_branch: mission/adr-index-reconciliation-and-gate
branch_strategy: Planning artifacts for this mission were generated on mission/adr-index-reconciliation-and-gate. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/adr-index-reconciliation-and-gate unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
phase: Phase 1 - reconciliation and gate
history:
- at: '2026-09-06T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: docs/architecture/
create_intent:
- scripts/check-adr-index.mjs
execution_mode: planning_artifact
model: ''
owned_files:
- docs/architecture/README.md
- docs/architecture/elements-first-programme.md
- scripts/check-adr-index.mjs
- .github/workflows/ci-quality.yml
role: implementer
tags: []
task_type: docs
tracker_refs:
- spec-kitty/spec-kitty-design#193
---

# Work Package Prompt: WP01 – Reconcile the ADR indexes and gate their correspondence

## Goal

Make `docs/architecture/README.md`'s ADR table and `docs/architecture/elements-first-programme.md`'s
governing-decisions line agree with `docs/architecture/decisions/` as the source of truth, and ship
`scripts/check-adr-index.mjs` — wired into `ci-quality.yml`'s `lint-code` job — that fails when
either direction of that correspondence breaks, or when it would otherwise run over an empty set.

## Measurement already taken (do not re-derive from the issue text)

On `train/elements-first` @ `15c4abf`: **15** files in `docs/architecture/decisions/`, **8** rows in
the README table, **7** records unindexed (ADR-8, 9, 10, 11, 12, 13, and
`ADR-003-addendum-token-values.md`), **0** stale rows. #193's premise that
`grep -c 'ADR-14'` returns 0 in both indexes is stale — #194 added both. `plan.md` Phase 0 carries
the full per-record H1/Status table; use it, and re-read the records rather than trusting it blind.

## Subtasks

- **T001** — Rebuild the table: one row per file, ordered ADR-1, 2, 3, ADR-003 addendum, 4…14.
  Identifier from the record's own H1 (`# ADR 10` → `ADR-10`; the addendum's H1 says
  `ADR-003 addendum`, so its row does too). Title = the H1 text after that prefix, verbatim —
  including ADR-4's `Priivacy-ai` typo, because transcribing a record's title is indexing and
  correcting it is editing. Status = the leading token of the record's `**Status:**` field.
- **T002** — The section preamble says "All Accepted decisions are in `decisions/`". Five records
  are Proposed and one is Complete, so as written it either misdescribes the directory or implies
  a promotion. Correct the description; leave the charter rule sentence ("Any mission spec that
  would contradict an Accepted ADR…") intact.
- **T003** — `elements-first-programme.md` line 5 only. Remove the ADR-8…ADR-14 enumeration; point
  at the directory and the table, and carry #194's ruling forward in general form (only *Accepted*
  ADRs bind; a *Proposed* record describes and does not constrain) so it covers every record
  without naming one. **Line 98 ("ADRs 8–13 are committed") is not touched** — it is a historical
  statement about O1 and is still true. `elements-first-run-prompt.md:163` is not touched — #194
  fixed it.
- **T004** — `scripts/check-adr-index.mjs`, following `scripts/check-release-graph.mjs`: exported
  pure functions returning `string[]`, a `main()` over the real tree, a run-as-CLI guard. Checks:
  coverage in both directions, no duplicate rows for one file, Status agreement, and that the gate
  is still wired into `ci-quality.yml` from a job the `gate` job strictly requires.
- **T005** — Explicit floors, in the shape `checkSubpathCoverage` uses ("refusing to certify
  coverage over nothing"): zero record files is a failure; zero parsed rows is a failure; a missing
  `## Decisions (ADRs)` section is a failure rather than a vacuous pass. `--selftest` feeds one
  synthetic defect per check and fails if any probe does not trip, plus a probe-count floor so a
  silently emptied probe list is itself a failure.
- **T006** — Two `[ENFORCED]` steps in `lint-code`, beside the other self-checking gates.
  `lint-code` has no `if:` and hangs off no `changes` output, so it runs on a docs-only PR; it is
  strictly required by `gate`.
- **T007** — Break it both ways, capture the verbatim output, restore. A gate nobody has watched
  fail is not evidence.
- **T008** — `git diff origin/train/elements-first -- docs/architecture/decisions/` must be empty.

## Boundaries

- No ADR's content, Status, title or filename changes. This mission indexes records; it does not
  edit or ratify them.
- Nothing architectural is decided. A genuine fork found while reconciling — an ambiguous status,
  two contradicting records, a number used twice — is filed as an issue with the measurement
  attached, and the mission carries on.
- No unrelated docs cleanup. `llms.txt` and `llms-full.txt` are a third and fourth stale ADR
  surface; they are filed, not fixed.

## Independent test

`node scripts/check-adr-index.mjs` exits 0 reporting 15 records and 15 rows; `--selftest` trips
every probe and asserts its floor; a decision file with no row reds it naming the file; a row with
no file reds it naming the row; the diff over `docs/architecture/decisions/` is empty;
`npx commitlint --from origin/train/elements-first --to HEAD` passes.
