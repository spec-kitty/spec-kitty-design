# Tasks: filtered-mutation-suite

**Input**: `spec.md`, `plan.md`
**Branch**: `mission/filtered-mutation-suite` (planning base and merge target under the mission's
`single_branch` topology). The mission PR targets `train/elements-first`, never `main`.

One work package and one PR. The three parts — honest fixture imports, guard 9, and the re-derived
ceiling — cannot land separately: the imports without the guard leave the new narrow selection
unpoliced, the guard without the imports guards nothing that has changed, and the ceiling cannot be
re-derived until both are measured against the same head. Seven subtasks keep the package inside
the charter's reviewable 3–7 range while preserving measure-first sequencing.

## Subtask Index

| ID | Description | WP | Parallel |
| --- | --- | --- | --- |
| T001 | Record the BEFORE evidence at `train/elements-first@99a5144`: resolve the impact graph for all 36 mutated sources, run the complete 157-arm harness, and capture every arm's verdict and the browser suite's assertion multiset. Nothing may be edited until this exists, because it is the only thing the AFTER run can be compared against (NFR-001, NFR-002). | WP01 | No |
| T002 | Rewrite the 21 elements-behaviour test files that import the `@spec-kitty/elements` barrel so each imports the element modules it instantiates and the leaf modules its named symbols are authored in; carry the `@nx/enforce-module-boundaries` disable comment naming #225 (FR-001, C-003). | WP01 | No |
| T003 | Prove the rewrite changed no evidence: the browser behaviour suite reports the identical assertion multiset per file and per name, and `measure-suite-time.mjs` stays under its 40s ceiling (NFR-001, SC-002). | WP01 | No |
| T004 | Add guard 9 — a mutation whose declared subject is absent from its source's graph selection is rejected by name before any arm runs — and correct the three prose claims that say there are eight numbered guards (FR-002, C-002). | WP01 | No |
| T005 | Re-resolve the impact graph for all 36 sources and re-run the complete 157-arm harness; diff every arm's verdict against T001. Any disagreement is the finding and stops the mission (NFR-002, NFR-003, SC-001, SC-003). | WP01 | No |
| T006 | Prove the filter cannot hide a real defect: for a sample spanning all three selection classes, run each arm under its graph selection and again under the full browser suite, and require the same verdict, the same named red and the same collateral finding. Separately demonstrate guard 9 rejecting a mis-declared subject (SC-004, SC-005). | WP01 | No |
| T007 | Re-derive `selftestCeilingSeconds` from CI figures only, stating basis, arm count, test count and the fraction of the measured runner spread it absorbs; append the before/after rows and the cost model to `suite-budget.json`; rebase onto the current `train/elements-first` and confirm PR #241's 165-arm set fits, measured (FR-003, FR-004, C-004, SC-006, SC-007). | WP01 | No |

No `[P]` markers are valid. T001 must precede every edit or the AFTER comparison has no baseline.
T003 gates T004 because a guard added over a changed-evidence fixture would be measuring the wrong
thing. T005 depends on both edits landing. T006 needs the final selection. T007 is last because a
rebase invalidates every measurement taken before it.

## Work Packages

### WP01 — Make the dependency-derived filter bite, and guard what it selects

- **Goal**: Turn the already-landed but inert impact-graph filter into an effective one by removing
  the false barrel edges from the elements-behaviour fixture, add the one fail-closed guard the
  filter was missing, and re-derive the wall-clock ceiling from the resulting cost model.
- **Priority**: P1 — #225 is an operator ruling and PR #241 is held open on it.
- **Independent test**: the complete 157-arm harness passes with every arm's verdict identical to
  the pre-change run; the browser behaviour suite reports the identical assertion multiset; the
  sampled arms agree between filtered and full runs; guard 9 rejects a mis-declared subject; and
  CI completes PR #241's 165-arm set inside the new ceiling.
- **Included subtasks**: T001–T007.
- **Dependencies**: none.
- **Owned surfaces**: `fixtures/elements-behaviour/src/*.test.ts`, `scripts/suite-selftest.mjs`,
  `suite-budget.json`, and this mission's `kitty-specs` directory. No element, style, token,
  wrapper, story, or `behaviours.json` surface is owned.
- **Risks**: recorded in `plan.md`. The controlling one is that a test could silently prove less
  after losing a registration; it is closed by an inclusive tag rule plus the before/after
  assertion-multiset and verdict comparisons.
