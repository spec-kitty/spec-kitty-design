# Tasks: work-package-workflow-board-styles

**Input**: `spec.md`, `research.md`, `data-model.md`, `plan.md`
**Branch**: `mission/work-package-workflow-board-styles` (planning base and merge target under the
mission's `single_branch` topology). The eventual mission PR targets `train/elements-first`, never
`main`, under `docs/architecture/elements-first-run-prompt.md`.

One work package and one PR. The exact seven-selector board/lane surface is one native semantic
structure: the lane family is not independently useful without the scroller, and the scroller's
accessibility, overflow, theme, package-export, and visual proofs all render the lane family. A
split would duplicate fixtures and leave an untestable half-surface. Seven concrete subtasks keep
the package within the charter's reviewable 3–7 range while preserving test-first sequencing.

## Subtask Index

| ID   | Description                                                                                                                                                                                                                                                                                                                                                                                      | WP   | Parallel |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | -------- |
| T001 | Author the focused Playwright acceptance contract and calibration harness first; demonstrate the expected red because the board/lane stories and selectors do not yet exist (FR-001–FR-013; NFR-002–NFR-005, NFR-007–NFR-008; NI-001–NI-009).                                                                                                                                                    | WP01 | No       |
| T002 | Calibrate at most one theme-invariant lane-minimum layout token, then author the two token-only CSS files with exactly the seven public selectors, local overflow, neutral boundaries/wrapping, and visible focus/forced-colors behavior (FR-001, FR-002, FR-009, FR-011, FR-012; NFR-001, NFR-004, NFR-007; C-004, C-005, C-008; NI-002, NI-003, NI-005, NI-007, NI-009).                       | WP01 | No       |
| T003 | Author the workflow-board and workflow-lane HTML fixture catalogues plus their Storybook modules, preserving named native sections/headings, direct ordered lists, truthful empty siblings/counts, genuine-versus-fitting overflow, one consumer-supplied narrow lane, long/50-item states, DefaultDark, ForcedColors, and real `.sk-light` (FR-003–FR-013; C-002–C-006; NI-003–NI-008, NI-010). | WP01 | No       |
| T004 | Run the token-catalogue and styles-only markup generators; wire root exports/subpaths, the story ratchet, and consumer documentation while proving generated barrels were not hand-edited and no element/wrapper/behavior surface was added (FR-014, FR-015; NFR-006, NFR-008; C-001, C-007, C-009; NI-001, NI-010).                                                                             | WP01 | No       |
| T005 | Complete the focused DOM/accessibility-tree/keyboard/geometry/theme/forced-colors/axe tests and register CI-authoritative Chromium visual coverage for every required state (FR-007–FR-013, FR-016; NFR-002–NFR-005, NFR-007, NFR-008; SC-002–SC-010).                                                                                                                                           | WP01 | No       |
| T006 | Run focused-first and full repository verification, including generator drift, package resolution/packing, style and type gates, Storybook/axe/all-browser Playwright, visual regression, security/offline/release gates, and the complete negative-invariant delta audit (FR-001–FR-016; NFR-001–NFR-008; C-001–C-009; NI-001–NI-010; SC-001–SC-012).                                           | WP01 | No       |
| T007 | Fetch and rebase the mission branch onto the latest `train/elements-first`, regenerate shared artifacts, rerun every affected/full gate, then produce CI and four-lens adversarial evidence tied to the exact final head SHA; any later push invalidates and repeats this step (FR-016; NFR-002–NFR-008; C-007–C-009; SC-008–SC-012).                                                            | WP01 | No       |

No `[P]` markers are valid. T001 establishes the red acceptance harness; T002 and T003 are
logically distinct but converge on the same rendered surface and browser calibration, so one
implementer sequences them in the same lane. T004 needs both authored CSS and HTML before the
generator can discover non-empty styles-only directories. T005 depends on the rendered/exported
surface. T006 depends on the complete delta, and T007 is intentionally last because a rebase or
push invalidates both CI and adversarial evidence.

## Work Packages

### WP01 — Native workflow board and lane styles

- **Goal**: Ship the exact `.sk-workflow-board`, `.sk-workflow-board__scroller`,
  `.sk-workflow-lane`, `__header`, `__title`, `__count`, and `__list` styles-only surface over
  consumer-authored native HTML. Prove named lane sections and native ordered lists, truthful empty
  and 50-item states, conditional useful overflow semantics, page containment, keyboard scrolling,
  consumer-controlled one-lane composition, real theme variance, forced-colors structure, and
  deterministic styles-package distribution without creating a custom element, work-item class,
  application state, or adjacent-child implementation.
- **Priority**: P1 — this package is the complete independently deliverable outcome of #209 and a
  prerequisite of #214.
- **Independent test**: from a built Storybook, the dedicated Playwright spec passes in Chromium,
  Firefox, and WebKit; the generated styles-only barrel check is byte-clean; every new story
  renders a non-empty root with zero axe violations; the Chromium visual suite matches its
  CI-authoritative baselines; public root/subpath/package resolution succeeds; and the final delta
  contains exactly the seven allowed selectors with none of NI-001 through NI-010.
- **Included subtasks**: T001–T007.
- **Dependencies**: none. The styles/tokens foundation is already present on
  `train/elements-first`; #210, #211, #212, and #213 are not source prerequisites for #209.
- **Owned surfaces**: token source/catalogue, the two new styles directories, styles root/package
  exports, story ratchet, consumer documentation, the dedicated browser spec, visual registrations,
  and its CI-authoritative board snapshots. No demo, elements, wrapper, behavior, mutation, or
  adjacent-child surface is owned.
- **Risks**: a lane-minimum candidate must satisfy 220–360 px content, 320/360 px one-lane fit,
  five-lane true overflow, focus containment, and cross-browser page containment. If no candidate
  works, stop for the exact product/layout decision; do not add a modifier, observer, or raw demo
  dimension. Local screenshots diagnose only—Linux Chromium CI artifacts remain authoritative.

## Requirement and Invariant Coverage

- **Public/native contract**: T001–T004 cover FR-001 through FR-008, FR-010, FR-013 through
  FR-015, NFR-006/NFR-008, C-001 through C-007/C-009, and NI-001 through NI-006/NI-008/NI-010.
- **Layout, access, and scale**: T001–T003/T005 cover FR-003/FR-009/FR-011/FR-012,
  NFR-001 through NFR-005/NFR-007, SC-002 through SC-010, and NI-006/NI-007/NI-009.
- **Distribution and final evidence**: T004/T006/T007 cover FR-014 through FR-016, NFR-002
  through NFR-008, C-007 through C-009, SC-001/SC-008/SC-011/SC-012, and all ten negative
  invariants against the rebased exact final SHA.

All FR-001 through FR-016, NFR-001 through NFR-008, C-001 through C-009, NI-001 through NI-010,
and SC-001 through SC-012 are covered. Success criteria and negative invariants remain executable
acceptance evidence in the WP prompt; they are not added to `requirement_refs`, whose Spec Kitty
schema accepts only specification requirement/constraint IDs.

## MVP Scope

The whole WP. A CSS-only lane without the board scroller, or a board without its native lane and
browser evidence, is not an independently usable or approvable public surface.

## Delivery Note

The WP stops after implementation/review evidence is ready on the mission branch. The programme
orchestrator owns the PR into `train/elements-first`, exact-head CI/adversarial comment, squash
merge, issue closeout, and epic checkbox. It must not merge the train into `main`.
