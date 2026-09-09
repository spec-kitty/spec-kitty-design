# Tasks: Mission Reading pattern stories

**Mission**: `mission-reading-pattern-stories-01M21HSX`  
**Input**: `spec.md`, `research.md`, `data-model.md`, `plan.md`  
**Planning base / merge target**: `train/elements-first`

One work package and one PR. The immutable fixture, its truthful projections, the complete M1-M8
story family, authored registries, focused browser assertions, documentation, and exact-head
visual baselines are one coupled proof. Splitting them would create an unverified or undiscoverable
intermediate story surface and overlapping edits to shared Storybook registries.

## Subtask Index

| ID | Description | Requirements | Parallel |
|---|---|---|---|
| T001 | Establish a failing focused browser contract and an exact public-surface/forbidden-surface inventory before implementation | FR-001, FR-012, NFR-004, C-001, C-002 | |
| T002 | Author the one deeply frozen fixture, types, pure projections, and invariant checks for SHA, pushed markers, catalogues, artifacts, Ops, observed activity, and live presence | FR-002, FR-005-FR-011, C-004, C-005 | |
| T003 | Compose M1 populated Specify desktop from public elements, CSS families, and native document semantics | FR-001, FR-003, FR-010-FR-012, C-001-C-003 | |
| T004 | Compose M2 at 390px with a 240px controlled drawer, shell dismiss handling, focus return, and no fabricated routing behavior | FR-003, NFR-001, NFR-002, C-002 | |
| T005 | Compose M3 loading, M4 canonical unavailable, and M5 snapshot-behind-log without false facts, actions, links, or mismatched SHAs | FR-004-FR-006, FR-011, C-004 | |
| T006 | Compose M6a/M6b Other artifacts and M7a/M7b Ops present/absent with truthful current navigation and bounded/terminal structures | FR-007, FR-008, FR-010, FR-012 | |
| T007 | Compose M8 with separately labelled factual, observed, and reported-live regions and no person-to-WP join | FR-009, C-005 | |
| T008 | Add valid LightMode and resilience proof for forced colors, reduced motion, RTL, zoom, 240px/390px containment, long paths/branches, and threshold edges | FR-013, NFR-001-NFR-003 | |
| T009 | Register every story and document the Mission Reading public composition/application ownership boundary | FR-013, NFR-004, C-001, C-006 | |
| T010 | Run focused, axe, cross-browser, visual, composition, generated, mutation, quality, type, build, Storybook, package, and security gates; review visual output | NFR-001-NFR-007, C-006 | |
| T011 | Rebase onto the latest train, regenerate, rerun every required gate, capture visual baselines from the exact final head, and prepare Tier C review evidence | NFR-005, NFR-006, C-007 | |

No subtasks are parallel within the package. T001 precedes implementation; T002 is the source for
T003-T008; T009 and T010 require the full story set; T011 is the final integration cut.

## Work Packages

### WP01 — Prove the complete Mission Reading family from public surfaces

- **Goal**: ship the reviewed M1-M8 Mission Reading family as discoverable, accessible Storybook
  pattern stories composed solely from the train's public surfaces, with one immutable truthful
  fixture and exact-head browser/visual evidence.
- **Priority**: P0 — this is issue #265's complete deliverable and the final child of epic #263.
- **Independent test**: the focused three-engine Storybook suite proves every registered state,
  native navigation/unavailable semantics, controlled drawer behavior, truth separation, shared
  fixture values, responsive containment, and theme/media resilience; the full repository gate
  set and exact-head visual suite pass after the latest-train rebase.
- **Included subtasks**: T001-T011.
- **Dependencies**: none inside the mission. External dependencies #254, #256, and #264 are
  already merged into `train/elements-first`; #255 is coordinated only by final rebase and
  regeneration if it lands.
- **Estimated prompt size**: large — one integrated pattern module plus broad executable proof.
- **Risks**: duplicated story literals can drift; page-like markup can accidentally become a
  runtime abstraction; a stale baseline can falsely certify a pre-rebase head. T002 centralizes
  truth, the composition gate and public-surface inventory police the boundary, and T011 makes
  exact-head verification explicit.

## Parallelization

None during implementation. Independent Codex doctrine lenses run in parallel only for the Tier C
read-only pre-merge review after the final head is frozen.

## MVP Scope

The entire work package. Dropping any reviewed M1-M8 state, LightMode, truth boundary, or final
resilience/gate obligation would fail issue #265's explicit contract.

