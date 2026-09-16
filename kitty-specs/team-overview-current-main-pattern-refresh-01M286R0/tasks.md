# Tasks: Team Overview current-main pattern refresh

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`
**Branch**: `team-overview-current-main-pattern-refresh`
**External merge target**: `train/elements-first`

One bounded work package owns the complete evidence cutover. Splitting the story source from its
discovery, browser, and visual inventories could temporarily certify retired #150 claims as current.

## Subtask Index

| ID   | Description                                                                                                                                                                   | WP   | Parallel |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------- |
| T001 | Define deeply frozen TO1/TO2 fixtures and pure projections for retention, caps, safe supplied routes, and authorization guards.                                               | WP01 |          |
| T002 | Replace the #150 composition with native/public-surface TO1 and TO2 renderers, controlled compact drawer, passive activity, and labelled review-only selector.                | WP01 |          |
| T003 | Export exactly six current entries, including same-fixture light mode, alternate retention, long content, and copy outcomes.                                                  | WP01 |          |
| T004 | Add direct fixture tests for immutability, determinism, caps, totals, retention, role/privacy/current/completed state, and route authorization.                               | WP01 |          |
| T005 | Rewrite built-Storybook Playwright proof for semantics, keyboard/a11y tree, copy outcomes/focus, controlled drawer, all widths/zoom/media/RTL, containment, and 44px targets. | WP01 |          |
| T006 | Replace the six story-ratchet IDs and only Team Overview visual cases/PNGs with inspected TO1/TO2 evidence.                                                                   | WP01 |          |
| T007 | Publish the #150 historical/deprecated migration note and focused evidence record.                                                                                            | WP01 |          |
| T008 | Run the complete required gate surface, rerun the focused subset, transition through supported runtime state, and push without opening or merging a PR.                       | WP01 |          |

## Work Packages

### WP01 — Current Team Overview pattern and proof

- **Goal**: replace obsolete #150 Team Overview evidence with the reviewed TO1/TO2 fixture-driven
  composition and complete local proof.
- **Priority**: P1.
- **Independent test**: six emitted IDs, direct projection tests, built-Storybook Playwright in all
  browsers, axe zero, inspected replacement visuals, and all repository gates green.
- **Included subtasks**: T001–T008.
- **Dependencies**: current `train/elements-first`; no mission-internal dependency.
- **Risks**: accidental product policy, stale append-only inventories after #382, private styling,
  unselected authorization responses remaining in document DOM, or local visual bytes not matching
  the Linux/Chromium baseline.

## Parallelization

Single writer. Independent reviewer work begins only after the exact pushed SHA is handed off.
