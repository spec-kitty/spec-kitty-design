# Tasks: Static Form of Element-Backed CSS Families (Decision, Gap G0)

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/measurement-contract.md`, `quickstart.md`
**Mission**: `static-form-of-element-backed-css-01M248TF` on `mission/static-form-of-element-backed-css` (single_branch — plan, base, and merge target are all this one branch)

## Scope note

Per spec C-001, this mission is bounded to **exactly one Work Package and one PR**. All subtasks
below land in WP01. There is no phase 2/3 — everything in this mission's diff ships together.

## Subtask Index

| ID | Description | WP | Parallel |
|----|---|----|----|
| T001 | Rebuild real package + Storybook artifacts for measurement; re-confirm the #161 subpath/root findings with a fresh build | WP01 | |
| T002 | Host-attribute-axis probe (`sk-app-shell`): throwaway static exemplar + Playwright comparison, incl. composed/nested case; commit result | WP01 | [P] |
| T003 | Host-container-type probe (`sk-action-row`): same shape; commit result | WP01 | [P] |
| T004 | `::slotted()` child-rule probe (`sk-entity-marker`): same shape; commit result | WP01 | [P] |
| T005 | Author the ADR or ADR amendment recording the per-construct-kind ruling | WP01 | |
| T006 | Conditional follow-through per construct kind: file issues (candidate a) and/or correct docs (candidate b) | WP01 | |
| T007 | Run the repo's existing unmodified gates relevant to this mission's diff | WP01 | |
| T008 | Write the PR description tying ruling + evidence + follow-through together | WP01 | |

T002/T003/T004 are marked `[P]` because they touch disjoint components and disjoint
`measurement/<construct>/` subdirectories — an implementer may run them in any order or
interleave them, but all three must complete before T005 (the ruling is written from their
combined output).

## Work Package WP01 — Decide and record the static-form ruling

- **Summary**: Perform the FR-008 discriminating measurement for all three construct kinds
  (host-attribute axis, host-owned container-type, `::slotted()` child rule), author the resulting
  ADR/amendment, and carry out whichever conditional follow-through (candidate a issue-filing, or
  candidate b doc correction) the evidence selects — per construct kind independently.
- **Priority**: P1 (this is the mission's only WP; #300's dependency map blocks four other
  missions on it).
- **Independent test**: A reviewer can open the ADR, find a per-construct-kind answer backed by a
  committed, re-runnable `measurement/<construct>/result.json`, confirm every FR-001..FR-009
  acceptance point is addressed, and confirm any filed issue or corrected doc matches what the
  ruling says it would do.
- **Included subtasks**: T001, T002, T003, T004, T005, T006, T007, T008.
- **Requirement refs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009,
  NFR-001, NFR-002, C-001, C-002, C-003, C-004, C-005.
- **Estimated prompt size**: ~500-600 lines (8 subtasks).
- **Dependencies**: none (first and only WP).
- **Prompt file**: `tasks/WP01-decide-static-form-ruling.md`
