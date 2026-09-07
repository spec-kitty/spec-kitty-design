# Tasks: Work Package Detail Primitives

**Mission**: `work-package-detail-primitives-01M1XTPW`  
**Branch**: `mission/work-package-detail-primitives`  
**External merge target**: `train/elements-first`  
**Execution constraint**: use this fresh primary clone only; do not allocate a git worktree.

## Subtask Index

| ID | Work Package | Summary | Parallel |
|---|---|---|---|
| T001 | WP01 | Add red-first native semantics, accessibility, and overflow browser contract | No |
| T002 | WP01 | Author `.sk-breadcrumbs` CSS and state exemplars | Yes |
| T003 | WP01 | Author `.sk-prose` CSS and prompt/table/absence exemplars | Yes |
| T004 | WP01 | Author `.sk-event-timeline` CSS and chronology exemplars | Yes |
| T005 | WP01 | Publish styles-only stories, generated barrels, root exports, and package subpaths | No |
| T006 | WP01 | Run focused styles, Storybook, browser, theme, and axe verification | No |
| T007 | WP02 | Add failing check-bullet state, accessibility, fallback, and upgrade tests | No |
| T008 | WP02 | Extend canonical check-bullet markup and runtime state contract | No |
| T009 | WP02 | Add state presentation and visually hidden accessible text | No |
| T010 | WP02 | Expand static and element stories for all checklist scenarios | Yes |
| T011 | WP02 | Register docs/parts/behavior/mutation contract changes | No |
| T012 | WP02 | Regenerate component outputs and run focused mutation/type/a11y checks | No |
| T013 | WP03 | Regenerate global manifest, React/Vue outputs, size report, and prove React state typing | No |
| T014 | WP03 | Document native recipes, ownership boundaries, token dependencies, and changelog | Yes |
| T015 | WP03 | Complete integrated cross-browser, accessibility-tree, forced-colors, zoom, and scale evidence | No |
| T016 | WP03 | Add and inspect targeted Linux visual-regression evidence | No |
| T017 | WP03 | Rebase latest train and run every local/CI quality gate on the resulting head | No |
| T018 | WP03 | Record acceptance evidence and prepare exact-head review/PR handoff | No |

## WP01 — Styles-only Work Package detail primitives

**Priority**: P1  
**Independent test**: The three class families render native T11 structures with exact list/navigation semantics, contained overflow, visible focus, theme variance, and no app behavior.  
**Prompt**: `tasks/WP01-styles-only-detail-primitives.md`  
**Dependencies**: None.

- [ ] T001 Add red-first native semantics, accessibility, and overflow browser contract (WP01)
- [ ] T002 [P] Author `.sk-breadcrumbs` CSS and state exemplars (WP01)
- [ ] T003 [P] Author `.sk-prose` CSS and prompt/table/absence exemplars (WP01)
- [ ] T004 [P] Author `.sk-event-timeline` CSS and chronology exemplars (WP01)
- [ ] T005 Publish styles-only stories, generated barrels, root exports, and package subpaths (WP01)
- [ ] T006 Run focused styles, Storybook, browser, theme, and axe verification (WP01)

Implementation sketch:

1. Write one Storybook-backed browser contract that fails because the three story families do not exist.
2. Implement each CSS/HTML story family independently using existing tokens and native markup.
3. Generate per-directory barrels, add root exports/subpaths, and ratchet only the stories used as acceptance evidence in WP03.
4. Build Storybook and run the focused browser/axe paths before review.

Risks: decorative pseudo-content entering names, broad descendant selectors, page-level overflow, and hand-authored generated barrels. Mitigate with accessibility-tree/name assertions, scroller measurements, exact CSS ownership, and generator drift checks.

Estimated prompt size: ~300 lines.

## WP02 — Read-only check-bullet state

**Priority**: P1  
**Independent test**: Omitted/complete/pending/invalid/pre-upgrade state and custom icons preserve list semantics, expose accessible state text, reflect correctly, generate matching static markup, and emit no interaction.  
**Prompt**: `tasks/WP02-check-bullet-state.md`  
**Dependencies**: WP01 (linear branch sequencing; authored surfaces are disjoint).

- [ ] T007 Add failing check-bullet state, accessibility, fallback, and upgrade tests (WP02)
- [ ] T008 Extend canonical check-bullet markup and runtime state contract (WP02)
- [ ] T009 Add state presentation and visually hidden accessible text (WP02)
- [ ] T010 [P] Expand static and element stories for all checklist scenarios (WP02)
- [ ] T011 Register docs/parts/behavior/mutation contract changes (WP02)
- [ ] T012 Regenerate component outputs and run focused mutation/type/a11y checks (WP02)

Implementation sketch:

1. Capture red-first behavior for the public state union, runtime fallback, accessible state text, icon derivation/override, and property-before-upgrade.
2. Update only the canonical markup module, element, authored CSS, and stories; generate static/CSS outputs.
3. Register the exact manifest/behavior/mutation ratchet deltas and demonstrate the new arm's named red.
4. Run focused element, generation, and Storybook checks before independent review.

Risks: replacing listitem with checkbox semantics, changing omission behavior, invalid state throwing in render, hiding state from AT, mutation collateral, or hand-editing wrappers. Mitigate with negative assertions and generator-only outputs.

Estimated prompt size: ~320 lines.

## WP03 — Integrated catalogue, visual, and acceptance evidence

**Priority**: P1  
**Independent test**: A freshly regenerated, latest-train branch passes the complete repository gate matrix and provides inspected T11 catalogue evidence on the exact PR head.  
**Prompt**: `tasks/WP03-integrated-evidence.md`  
**Dependencies**: WP01 and WP02.

- [ ] T013 Regenerate global manifest, React/Vue outputs, size report, and prove React state typing (WP03)
- [ ] T014 [P] Document native recipes, ownership boundaries, token dependencies, and changelog (WP03)
- [ ] T015 Complete integrated cross-browser, accessibility-tree, forced-colors, zoom, and scale evidence (WP03)
- [ ] T016 Add and inspect targeted Linux visual-regression evidence (WP03)
- [ ] T017 Rebase latest train and run every local/CI quality gate on the resulting head (WP03)
- [ ] T018 Record acceptance evidence and prepare exact-head review/PR handoff (WP03)

Implementation sketch:

1. Generate all global outputs and assert the generated React state union with a compile-time negative.
2. Complete public documentation and cross-surface browser evidence, then add only intentional visual cases.
3. Obtain Linux candidates from CI, inspect them, and commit only the new #213 baselines.
4. Rebase current train, regenerate from combined authored sources, run all gates, and record exact-head evidence for Spec Kitty acceptance and the mandatory four-lens PR gate.

Risks: concurrent #212 generated-artifact conflicts, stale head evidence, local/CI font differences, incomplete WebKit runs, or a green mutation run missing the new subject. Mitigate by final rebase/regeneration, exact-head SHA pinning, artifact-derived Linux baselines, explicit engine counts, and full mutation guard output.

Estimated prompt size: ~340 lines.

## Dependency Graph

```text
WP01 → WP02 → WP03 → Spec Kitty accept → PR exact-head gate/CI → squash merge
```

The serial graph is deliberate. Authored component files are disjoint, but generated artifacts and the final evidence set are shared. No work package may select work outside issue #213.
