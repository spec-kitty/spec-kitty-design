# Tasks: adr-9-and-11-ratification-and-sad-lite-index

**Input**: `plan.md`, `spec.md`
**Branch**: `mission/adr-9-11-ratification` (planning base **and** merge target — `single_branch`
topology; the PR onto `train/elements-first` is opened by the loop and merged by the operator).

Two work packages, **sequential and not parallel**. WP01 ratifies ADR-9 and ADR-11; that changes
the arithmetic WP02 works from — §7 has four wrong Status cells before ratification and two after.
WP02 re-measures against the tree WP01 produced rather than against #226's table.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Move ADR-9's `**Status:**` to `Accepted`, in ADR-8/ADR-10's form, naming the operator, 2026-09-06 and the #200 ruling (FR-001) | WP01 | |
| T002 | Move ADR-11's `**Status:**` to `Accepted` and resolve the layered claim: one status, one sentence saying the split is replaced and the subsection's separate ratification subsumed (FR-002) | WP01 | |
| T003 | Verify #189's authorship authorization survives T002 byte-identical in all three places that carry it — Deciders line, subsection "Operator override" paragraph, More Information bullet (FR-003) | WP01 | |
| T004 | Move `README.md:34` and `:36` to `Accepted` in the same commit as T001/T002; leave the other 13 rows byte-identical (FR-004) | WP01 | |
| T005 | Write the "what a Status obliges" statement fresh into the README's Decisions section: Accepted binds; Proposed is not yet enforced and does not by itself constrain; Proposed is still read under `architectural_review_requirement`; #200 ratified by observation, not by review (FR-006, FR-007, NFR-002) | WP01 | |
| T006 | Add the Proposed half to `elements-first-programme.md:5`, pointing at the README statement rather than duplicating it (FR-009) | WP01 | |
| T007 | Extend `elements-first-programme.md:125`'s "**Ratified:**" roll-call to name ADR-9 and ADR-11 under #200 (FR-008) | WP01 | |
| T008 | Correct `docs/design-system/changelog.md:24-25`'s present-tense "ADR-9 is also still `Status: Proposed`" — minimally, keeping the entry's original point (FR-015) | WP01 | |
| T009 | Run `node scripts/check-adr-index.mjs` and `--selftest` at WP01's tip; record the output (FR-005, SC-003) | WP01 | |
| T010 | Confirm ADR-12, ADR-13 and ADR-14 Status fields are untouched (FR-014, SC-006) | WP01 | |
| T011 | Re-measure §7 against the post-WP01 tree: count rows, count records, list wrong Status cells and missing rows. Two wrong cells (ADR-12, ADR-13) and two missing rows are expected — record what is actually found (FR-010) | WP02 | |
| T012 | Verify §7's two `Superseded by ADR-013` cells are preserved elsewhere **before** deleting them — `llms-full.txt:200-205` for both halves, ADR-13's own record and `system-context-canvas.md:130` for the ADR-6 half (FR-012) | WP02 | |
| T013 | Delete §7's 13-row table; keep the heading and its number so §8 and §9 do not move (FR-010, FR-011) | WP02 | |
| T014 | Write §7's replacement: a pointer to the gated README table plus a note in `sad-lite.md:10`'s own shape, recording the re-measured defect and naming where the Superseded content lives (FR-010, FR-012) | WP02 | |
| T015 | Confirm no record's `**Status:**` says `Superseded` and neither ADR-6 nor ADR-7 was edited (FR-013, SC-005) | WP02 | |
| T016 | Re-run the gate and its selftest at WP02's tip; confirm `git diff --name-only` lists nothing under `scripts/`, `packages/` or `expected-stories.json` (FR-016, FR-017, SC-007) | WP02 | |

No `[P]` markers. Within WP01, T001–T004 must land in one commit or the gate reds by construction;
T009 must follow all of them. WP02 depends on WP01 for its own measurement.

## Work Packages

### WP01 — Ratify ADR-9 and ADR-11, and move every surface that states their status

- **Goal**: ADR-9 and ADR-11 read `Accepted` in their own headers, the gated index agrees, every
  other surface in the repository that states either status agrees, and a reader can find out from
  the index itself what `Accepted` and `Proposed` oblige — including that this ratification was by
  observation of the gates rather than by fresh review.
- **Priority**: P0 — #200's operator ruling, and the precondition for WP02's measurement.
- **Independent test**: `grep -m1 '^\*\*Status'` on both records returns `Accepted`;
  `node scripts/check-adr-index.mjs` exits 0 at 15/15; `grep -rn 'Proposed'` over
  `docs/` and the repository root returns no line asserting ADR-9's or ADR-11's status;
  `git diff` over ADR-12, ADR-13 and ADR-14 is empty.
- **Included subtasks**: T001–T010.
- **Dependencies**: none.
- **Estimated prompt size**: small — two record headers, two table cells, four prose edits.
- **Risks**: `plan.md` R2 (record and row must move together) and R4 (paraphrase-drift back into
  #199's withdrawn text). T005 is written from #200's ruling; the withdrawn text is never opened.

### WP02 — Remove sad-lite's second ADR index

- **Goal**: `docs/architecture/sad-lite.md` carries no ADR index. §7 points at the one table CI
  holds to the directory, records what it was wrong about at the moment it was removed, and says
  where its two `Superseded by ADR-013` cells are preserved.
- **Priority**: P1 — #226. Independent of #200's ruling in substance, dependent on it for its
  measurement.
- **Independent test**: `grep -c '^| \[ADR' docs/architecture/sad-lite.md` returns 0 (before: 13);
  `grep -n '^## ' docs/architecture/sad-lite.md` shows §7, §8 and §9 at their original numbers;
  `grep -rn 'Superseded' docs/architecture/decisions/` returns no `**Status:**` line.
- **Included subtasks**: T011–T016.
- **Dependencies**: WP01.
- **Estimated prompt size**: small — one section replaced in one file.
- **Risks**: `plan.md` R3 (correcting §7's cells instead of removing the table is #226 option 3,
  which produced the issue) and R5 (losing the Superseded content), retired by T012 running before
  T013.

## Parallelization

None. WP02 depends on WP01.

## MVP scope

Both work packages. WP01 alone leaves a document the README calls "Start here" carrying an ungated
index that is still wrong about two records; WP02 alone would delete a table whose ADR-9 and
ADR-11 cells were about to become correct, without recording why.

## Notes on requirements not separately tasked

- **FR-016** and **FR-017** are boundaries, not steps. They are asserted once, at T016, by
  `git diff --name-only` rather than by inspection.
- **NFR-001** (every status claim verified against the record's own header, never against another
  index) is a constraint on how T001, T004, T005, T007 and T011 are written; T010 and T015 are its
  after-the-fact checks.
- **NFR-002** (the by-observation downside legible to a reader of the finished documents) is
  discharged inside T005's wording, not by a subtask of its own.
- The `spec.md` constraints — commit enum, PR base, `--skip-nx-cache` — are commit- and PR-time
  process rules. This mission produces no generated artefact, so the cache rule has no subject
  here; confirmed at T016 rather than assumed.
