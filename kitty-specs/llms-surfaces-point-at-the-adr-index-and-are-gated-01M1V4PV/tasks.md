# Tasks: llms-surfaces-point-at-the-adr-index-and-are-gated

**Input**: `plan.md`, `spec.md`
**Branch**: `mission/llms-adr-index-pointer-and-gate` (planning base **and** merge target — this
mission lives on its own mission branch under the `single_branch` topology it was created with;
the PR onto `train/elements-first` is opened by the loop and merged by the operator).

One work package. The edited surfaces and the gate that holds them are one change: landing the
gate first gives a commit whose CI is red by construction, and landing the edits first leaves the
class open for exactly as long as it takes someone to add ADR-15.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | `llms.txt`: replace the ADR-directory entry with a pointer to `docs/architecture/README.md`'s table, deleting the "All Accepted architectural decision records" claim (FR-002, FR-006) | WP01 | |
| T002 | `llms.txt`: delete the three `ADR-00N` record links, taking the referenced set to empty (FR-001) | WP01 | |
| T003 | `llms-full.txt`: remove the directory-map ADR range and the two reading-order ranges, keeping every substantive claim they carry (FR-004) | WP01 | |
| T004 | `llms-full.txt`: replace `Status of every ADR below is **Accepted**` with the pointer (FR-005, FR-006) | WP01 | |
| T005 | `llms-full.txt`: add the ADR-14 summary so the referenced record set equals the directory, transcribed from the record and taking no position on its three open questions (FR-003) | WP01 | |
| T006 | Write `scripts/check-llms-adr-surface.mjs` — exported pure checks for the ref set, ranges, cardinality claims and the pointer (FR-007, FR-008, FR-009, FR-010, FR-012, NFR-001) | WP01 | |
| T007 | Give every check an explicit empty-set floor — zero records, missing surface, empty surface list, empty pattern set — and a `--selftest` whose every probe declares the message it expects, with asserted probe-count floors (FR-011, FR-013, NFR-003) | WP01 | |
| T008 | Wire the self-test and the gate as `[ENFORCED]` steps of `ci-quality.yml`'s `lint-code`, and register both in `check-gate-wiring.mjs`'s `REQUIRED_LINT` (FR-014, FR-015) | WP01 | |
| T009 | Reintroduce each defect in turn — range, partial set, missing pointer, cardinality claim — plus the CI-step deletion, record every output verbatim, restore the tree (NFR-002, SC-006, SC-007) | WP01 | |
| T010 | Confirm the boundary by tree hash: `git rev-parse HEAD:docs/architecture/decisions` unchanged, and neither `docs/architecture/README.md` nor `scripts/check-adr-index.mjs` in the diff (FR-016, SC-009, SC-010) | WP01 | |

No `[P]` markers: T001–T005 and T006–T008 touch interlocking surfaces (the gate asserts the edits),
and T009 must run after both.

## Work Packages

### WP01 — Point the LLM surfaces at the ADR index and gate them

- **Goal**: `llms.txt` and `llms-full.txt` carry no hand-maintained ADR index — no range, no
  count, no set-wide status claim, and a record link set that is empty or complete — each carries
  a pointer to `docs/architecture/README.md`'s authoritative table, and
  `scripts/check-llms-adr-surface.mjs`, wired into `lint-code`, fails when any of that stops being
  true or when it would run over an empty set.
- **Priority**: P0 — this mission's only deliverable.
- **Independent test**: `node scripts/check-llms-adr-surface.mjs` exits 0 and prints 0 refs for
  `llms.txt` and 15 for `llms-full.txt`; `--selftest` trips every probe against its own expected
  message; each of the five deliberate defects reds with its own message;
  `git rev-parse HEAD:docs/architecture/decisions` is `038374d6335eefc88d849b53069bdd40d09aa406`.
- **Included subtasks**: T001–T010.
- **Dependencies**: none.
- **Estimated prompt size**: small — one new script, two docs edits, two workflow steps, two
  registry entries.
- **Risks**: see `plan.md`. The one that bites is the range-pattern set's tolerance for the title
  dash in `### ADR-7 — Storybook 10.x Adoption`; probed in both directions.

## Parallelization

None.

## MVP scope

The whole work package. Editing the surfaces without the gate is what #197 says is not enough —
the class reopens the next time a record is added; the gate without the edits is red on arrival.

## Notes on requirements not separately tasked

- **NFR-001** (checks are pure functions so the self-test can feed them synthetic defects) is a
  constraint on how T006 is written, and is checked by T007 existing at all — a check that cannot
  be probed cannot have a probe.
- The constraints in `spec.md` (commit enum, PR base, the `plan`-emitted generator-config header)
  are commit- and PR-time process rules, not subtasks.
