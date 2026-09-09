# Tasks: Mission Kanban K1–K6 pattern stories

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, and issue #278  
**Planning base**: `origin/train/elements-first@fb424e83c827a586038d7a2a977b946b193192fb`  
**Delivery**: exactly one Work Package and one PR into `train/elements-first`; never `main`

One cohesive package owns the excluded Storybook module, its one immutable fixture, pure
projections/render helper, exact K1–K6 and theme/stress stories, sanctioned preview CSS seam,
focused browser/accessibility/visual evidence, story ratchet, and generated-public-surface no-delta
proof. Splitting any of these would leave an independently unreviewable fragment or duplicate the
fixture that must reconcile every truth claim.

## Subtask Index

| ID | Description | WP | Depends on | Parallel |
|---|---|---|---|---|
| T001 | Refresh and record the exact train/predecessor/ratchet baseline; add a red-first focused built-story contract without changing public code (FR-001, FR-018, FR-020; NFR-009; C-001–C-004, C-008–C-010). | WP01 | None | No |
| T002 | Author the single deeply frozen root fixture, fail-closed guards, and pure frozen projections inside the excluded story module (FR-002–FR-006, FR-012, FR-014–FR-017; NFR-008; C-001, C-003–C-005). | WP01 | T001 | No |
| T003 | Add the #277 stylesheet at the Storybook preview seam and token-only pattern-local composition layout (FR-018; NFR-009; C-002, C-007–C-008). | WP01 | T002 | No |
| T004 | Render K1 through public app-shell/navigation/heading/status/workflow/action-row-route surfaces and native sections/lists (FR-003, FR-005–FR-008, FR-018; NFR-001–NFR-002; C-002–C-007). | WP01 | T002–T003 | No |
| T005 | Render K2 at 390px with compact shell, conditional named/focusable board overflow, visible focus containment, and calibrated 200%-zoom behavior (FR-009–FR-010; NFR-002–NFR-004; C-002–C-004, C-007). | WP01 | T004 | No |
| T006 | Render K3 with the ten native #277 choices, exact two-selected projection and inert/observable separate Apply/Clear controls (FR-004, FR-011–FR-013; NFR-001–NFR-004; C-002–C-006). | WP01 | T004 | No |
| T007 | Render K4 and K5 while keeping commit, snapshot, committed lane, observed activity, and reported-live activity separately supplied and labelled (FR-014–FR-016; NFR-001, NFR-005–NFR-006, NFR-008; C-003–C-005). | WP01 | T004 | No |
| T008 | Render K6 plus real `LightMode`, long-content, forced-colors, and reduced-motion evidence without inventing data or behavior (FR-017, FR-019; NFR-001–NFR-006, NFR-010; C-002–C-007, C-010). | WP01 | T004–T007 | No |
| T009 | Complete story/play/source invariants, exclude helper exports, build the exact ten story IDs, and update only the authored story ratchet (FR-001–FR-020; NFR-008–NFR-009; C-001–C-010). | WP01 | T002–T008 | No |
| T010 | Complete the focused Chromium/Firefox/WebKit accessibility-tree, keyboard, route, checkbox, scroller, zoom, theme, forced-colors, and reduced-motion suite; run all-story axe (FR-007–FR-020; NFR-001–NFR-006, NFR-009; C-003–C-006). | WP01 | T009 | No |
| T011 | Add ten #278-only visual cases/baselines, render and inspect every story and real browser-UI 100%/200%-zoom state against the approved K1–K6 evidence, retain that zoom proof under the bounded issue-278 validation path, and preserve legacy baselines (FR-019–FR-020; NFR-003, NFR-005–NFR-007, NFR-010; C-007–C-010). | WP01 | T010 | No |
| T012 | Refresh/rebase, revalidate the durable issue-278 zoom evidence at the exact head, regenerate/check all surfaces, prove public/generated delta zero, run the full quality/release/security suite, audit #279–#284 exclusion, and return the evidence ledger for independent review (all requirements and SC-001–SC-008). | WP01 | T001–T011 | No |

No `[P]` marker is valid. The story module, preview seam, story ratchet, visual suite, and snapshots
are shared write surfaces, and each later proof depends on the same completed fixture/render graph.

## Work Packages

### WP01 — Mission Kanban pattern and proof

- **Goal**: deliver the exact K1–K6 Mission Kanban family and its complete executable evidence as a
  Storybook-only public-surface composition with no published page element or consumer behavior.
- **Independent review**: approve only when the ten planned stories are discoverable and non-empty;
  fixture/truth invariants, native semantics, route/filter/focus/overflow behavior, three-browser
  checks, axe, every visual, and full exact-head gates pass; every story has been directly inspected;
  and public/generated product surfaces have zero delta.
- **Included subtasks**: T001–T012.
- **Dependencies**: merged #176, #178, #209, #211, #212, #254, #272, and #277 on the refreshed
  `train/elements-first`.
- **Owned files**:
  `packages/elements/src/patterns/mission-kanban.stories.ts`,
  `apps/storybook/.storybook/preview.ts`,
  `apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts`,
  `expected-stories.json`,
  `apps/storybook/src/tests/visual.spec.ts`, new `mission-kanban-*.png` baselines, and
  `docs/architecture/validation/issue-278-mission-kanban-zoom/**` only. The bounded validation path
  retains T011's real browser-UI 100%/200% captures and metrics as issue #278 NFR-003/NFR-010
  evidence; T012 revalidates that durable evidence at the final exact head. No other docs path is
  authorized.
- **Forbidden scope**: any public `sk-mission-kanban`; package/barrel/manifest/wrapper/token change;
  application import or behavior; generated-file hand edit; and any #279–#284 artifact or contract.

## Requirement coverage

| Coverage | Tasks |
|---|---|
| FR-001 exact K1–K6 / Storybook-only family | T001, T008–T012 |
| FR-002 one immutable root fixture | T002, T009, T012 |
| FR-003–FR-006 stage/lane/reduction/K1 exactness | T002, T004, T009–T012 |
| FR-007–FR-010 native routes/board/overflow/K2 | T004–T005, T009–T012 |
| FR-011–FR-013 native K3 and consumer ownership | T006, T009–T012 |
| FR-014–FR-016 K4/K5 truth-tier separation | T007, T009–T012 |
| FR-017 K6 stable empty board | T008–T012 |
| FR-018 public composition | T001, T003–T004, T009–T012 |
| FR-019 theme/stress evidence | T008, T010–T012 |
| FR-020 direct verification seams | T001–T002, T009–T012 |
| NFR-001–NFR-010 | surface-specific tasks above, with complete exact-head proof in T012 |
| C-001–C-010 | surface-specific tasks above, with final forbidden-scope audit in T012 |
| SC-001–SC-008 | focused evidence in T002–T011; coherent exact-head evidence in T012 |

## Delivery note

Implementation and review seats must be distinct Codex agents. The implementer works only in the
runtime-designated WP workspace and does not push, merge, close issues, or modify long-lived
branches. The programme orchestrator owns branch publication, PR/issue operations, acceptance,
merge, mission review, and retrospective. Any rebase or changed push head invalidates browser,
visual, and independent-review evidence until rerun.
