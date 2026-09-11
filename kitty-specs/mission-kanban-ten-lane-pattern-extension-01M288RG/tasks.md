# Tasks: Mission Kanban ten-lane pattern extension

**Input**: `spec.md`, `plan.md`, issue #395, epic #276  
**Planning base**: `origin/train/elements-first@0a232a01a17627de6f1553ad0948b8b2f6f4f286`  
**Delivery**: exactly one Work Package and one PR into `train/elements-first`; never `main`

## Work Package count: ONE, deliberately

Issue #395 states "one bounded Work Package and one PR". The slice is also genuinely indivisible:
the extension fixture, the projection, the eleven stories, the overflow lifecycle, the focused suite,
the ratchet entry, and the visual baselines prove one another. A fixture without its proof, or a
proof without its fixture, is not independently reviewable.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Record the train head; run #278's focused suite green as the preservation baseline; add a red-first catalogue test asserting the eleven planned ten-lane ids and the unchanged ten #278 ids (FR-001, C-002). | WP01 | |
| T002 | Author the deeply frozen extension fixture (copy, formatters, routes, tones, unverified overlay claim, long localized lane labels), the structural guards, the pure `deriveMissionKanbanTenLanes` projection, and the named guard proof, importing the base fixture and freeze helpers from #278's module (FR-002, FR-003, FR-013, FR-015; NFR-008). | WP01 | after T001 |
| T003 | Implement the module-local board-region ref: measured triad on attach, `ResizeObserver` on scroller and lanes, subtree `MutationObserver` for content change, body watcher teardown; nothing exported (FR-011; C-006). | WP01 | after T002 |
| T004 | Render the composition through public surfaces with token-only, logical-property pattern CSS: shell, context navigation, page header, breadcrumbs, truth band, overlay-presence line, notice, filters, board, lanes, cards, overlay, reported-live panel (FR-004–FR-010, FR-012, FR-013; C-001, C-004, C-005, C-007). | WP01 | after T003 |
| T005 | Add the eleven stories with `play` invariants and `excludeStories` for every helper export (FR-001, FR-014, FR-015). | WP01 | after T004 |
| T006 | Focused suite part 1: catalogue, fixture/guard/immutability/derivation, source guards (including no render-code literals), K1–K6 structure, routes, filters, notice parity, overlay placement, empty lanes (FR-001–FR-010, FR-013; NFR-008, NFR-010). | WP01 | after T005 |
| T007 | Focused suite part 2: overflow lifecycle (fit, overflow, live resize both ways, content change, ±1 px threshold, remount balance), geometry (1440, 390, 860/861, short viewports, 200% zoom, long content, RTL), keyboard reachability and unclipped focus, LightMode parity, forced colors, reduced motion, accessibility trees (FR-011, FR-014; NFR-002–NFR-006). | WP01 | after T006 |
| T008 | Ratchet the eleven built story ids in `expected-stories.json` under `mission-kanban-ten-lane-pattern` with a `$comment` entry and the recomputed total; run the axe gate to zero violations (NFR-001). | WP01 | after T005 |
| T009 | Append the twelve-case visual block to `visual.spec.ts`; after the PR's first CI run, harvest the actuals from the `visual-regression-diffs` artifact, inspect each against the Family 2 K1–K6 screens, commit them, and confirm the ten #278 baselines are unchanged (NFR-007). | WP01 | after T005 |
| T010 | Rebase onto the latest train, recompute the ratchet total, re-run every gate and generated-surface `--check`, prove zero generated/public/#278 delta, and draft the PR evidence (NFR-009; C-008, C-009, C-010; SC-006, SC-007). | WP01 | last |

## Work Package WP01 — Ten-lane pattern and proof

**Priority**: P1 (the mission's entire scope)  
**Prompt**: [tasks/WP01-ten-lane-pattern-and-proof.md](./tasks/WP01-ten-lane-pattern-and-proof.md)

**Independent test**: build Storybook; the index lists exactly eleven
`patterns-mission-kanban-ten-lane--*` stories and exactly the ten #278 stories. K1 shows ten lanes
with counts `0/2/1/3/2/1/1/4/1/0`; K3 shows In review and Blocked only with two of ten choices
checked; K4 matches K1 plus one notice; K5 keeps WP03 in In progress with one visible
`Presence · unverified` overlay; K6 shows ten empty lanes. The board region triad exists exactly
while the scroller overflows, across resize and content change, and the document never overflows
horizontally. The focused suite, axe, and visual regression are green on the PR head, and no #278,
generated, or public file differs from the train.

**Owned files**: the new story module, the new focused suite, the appended visual block and its
twelve PNGs, and `expected-stories.json`.

**Dependencies**: none inside this mission. Landed predecessors: #209, #272, #277, #278.
