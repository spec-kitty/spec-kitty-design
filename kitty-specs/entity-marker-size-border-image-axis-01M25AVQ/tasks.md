# Tasks: sk-entity-marker size, border and image axis

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`
**Mission**: `entity-marker-size-border-image-axis-01M25AVQ` on `mission/entity-marker-size-border-image-axis` (single_branch — plan, base, and merge target are all this one branch)

## Scope note

Per spec C-001, this mission is bounded to **exactly one Work Package and one PR**. All subtasks
below land in WP01. There is no phase 2/3 — everything in this mission's diff ships together.

## Subtask Index

| ID | Description | WP | Parallel |
|----|---|----|----|
| T001 | Resolve the new named size: pick the `--sk-space-*` token, name the modifier, cite the justifying Family 4 screen; add `.sk-entity-marker--<name>` to the CSS | WP01 | |
| T002 | Widen the element's `size` property (`EntityMarkerSize` union + `entityMarkerSize()` fallback) to accept the new value; update `render()`'s class list | WP01 | |
| T003 | Add the optional border modifier: CSS rule consuming existing border tokens with the outer-box-unchanged geometry, plus the element's new `border` reflected property and fallback function | WP01 | |
| T004 | Extend `sk-entity-marker.test.ts`: geometry/independence/fail-open assertions for the new size and the border axis, mirroring the existing `size`/`shape` test shapes | WP01 | [P] |
| T005 | Extend stories: new size and border in the axis matrix, a combined size+border+image story, `LightMode`/forced-colors coverage | WP01 | [P] |
| T006 | Re-verify and, if needed, update `sk-entity-marker.css`'s ADR-15 header-comment instruction (structurally faithful rewrite + generic tie-boundary statement) for the combined size/border selector this mission ships | WP01 | |
| T007 | Add the visual-regression proof that the border modifier does not change the outer box, at every size/shape | WP01 | |
| T008 | Update ratchets: `expected-docs.json`, `behaviours.json`/`mutations.json`, `expected-stories.json`; review `expected-parts.json` for no change | WP01 | |
| T009 | Rebuild `dist/`, regenerate `SIZES.md`, regenerate `packages/react/src` and `packages/elements/vue.d.ts`; run the repo's existing gates | WP01 | |
| T010 | Write the PR description | WP01 | |

T004 and T005 are marked `[P]` — they touch disjoint files (the test file and the stories file)
and can be written in either order once T001-T003 land the CSS/element surface, but both must
complete before T008 (ratchets record the final, tested/storied surface) and T009 (the
regeneration/gate pass needs the finished diff).

## Work Package WP01 — Widen sk-entity-marker on the size, border and image axes

- **Summary**: Implement ADR-15's split ruling on #304 in one PR: size and border land as
  ordinary, equality-gated root-class modifiers (T001-T003, T007); the image axis gets no new
  CSS or behavior (FR-007 requires the existing `::slotted(img)` rule stay exactly as effective)
  and only its documentation instruction is re-verified/updated (T006); tests, stories and
  ratchets are extended to match (T004, T005, T008); generated artifacts and existing gates are
  refreshed and confirmed green (T009); the PR is written to let the tier-C pre-merge squad
  verify every FR without re-deriving the mission's reasoning (T010).
- **Priority**: P1 (this mission's only WP; #303 depends on this surface per #300's dependency
  map).
- **Independent test**: A reviewer can apply every named size × both shapes × bordered/unbordered
  to a live `sk-entity-marker`, confirm the default and `sm` boxes are pixel-identical to before
  this mission, confirm the border never changes the outer box (visual snapshot), confirm the
  accessible-naming contract is unaffected by any axis, and confirm the CSS header comment states
  the image-axis tie boundary generically without a mismatched or stale transcribed figure.
- **Included subtasks**: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010.
- **Requirement refs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009,
  FR-010, FR-011, FR-012, FR-013, NFR-001, NFR-002, NFR-003, C-001, C-002, C-003, C-004, C-005,
  C-006, C-007, C-008.
- **Estimated prompt size**: ~450-550 lines (10 subtasks).
- **Dependencies**: none (first and only WP).
- **Prompt file**: `tasks/WP01-entity-marker-size-border-image-axis.md`
