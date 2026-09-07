# Tasks: Compact Work-Item Extensions

**Input**: `spec.md`, `plan.md`  
**Branch**: `mission/compact-work-item-extensions` under the mission's `single_branch` topology;
the eventual PR targets `train/elements-first`, never `main`.

Three serial work packages implement the plan's Delivery Slicing. WP01 owns the action-row and
status-indicator authored contracts. WP02 owns the entity-marker, native inline empty-state and
bounded axe-verdict seam. WP03 alone owns collision-prone shared registries, ratchets, generated
distribution artifacts and integrated acceptance evidence. This single-writer split keeps product
ownership non-overlapping while allowing every WP to be reviewed independently and receive an
intermediate `approved` verdict. WP01 and WP02 remain not `done`; no WP transitions to `done` until
WP03 has run the coherent mission's full Storybook, axe, visual and final gate surface. None is an
independently mergeable train release, and #214 consumes only the coherent WP03 result.

The shared `mutations.json` file is deliberately single-owned by WP03. WP01 demonstrates three
handoff arms once; WP02 demonstrates two once. Together they are exactly four SC-010 property-before-
upgrade arms (`layout`, `pulsing`, `size`, `shape`) and one SC-013 arm removing only
`part="supporting"`. Each handoff records exact `from`/`to`, subject and named-test evidence. WP03
persists those five already-proven arms once without manual replay, then runs
`node scripts/suite-selftest.mjs` as the sole final re-derivation. Reflection, unsupported-layout
fail-open, projection, source order and preference claims remain direct tests.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Establish a clean current-train baseline; add action-row and status-indicator fixture characterization plus red-first tests for the new reflected properties, supporting projection, unchanged activation/focus behavior and marker-only pulse contract (FR-001–FR-012, FR-020–FR-023; NFR-003–NFR-005; C-013–C-015; NI-001, NI-003–NI-004, NI-007–NI-008). | WP01 | No |
| T002 | Implement the validated reflected `layout` axis and always-present/slot-aware `supporting` part without changing trigger, event, controlled-selection or controls-sibling semantics; add token-only card reflow and sparse/long-content containment (FR-001–FR-012; NFR-002–NFR-004, NFR-007; C-001–C-004, C-008, C-013, C-015, C-017). | WP01 | No |
| T003 | Implement reflected boolean `pulsing`, slot-presence handling and token-only marker-scoped animation; prove differential pulse-on versus pulse-off static emphasis under reduced motion and an author-owned non-color distinction under forced colors, with no lifecycle or tone changes (FR-020–FR-023; NFR-004, NFR-007–NFR-008; C-006–C-008, C-014–C-015; NI-007–NI-008). | WP01 | No |
| T004 | Author action-row/status-indicator state stories, including T10 compact composition structure and real `.sk-light` variants, while preserving default stories and using consumer-supplied visible meaning (FR-003–FR-004, FR-008–FR-012, FR-021–FR-023, FR-028; NFR-001–NFR-004, NFR-007–NFR-008; SC-002–SC-003, SC-005, SC-007, SC-009). | WP01 | No |
| T005 | Demonstrate exactly three handoff arms: SC-010 property-before-upgrade breaks for `layout` and `pulsing`, plus an SC-013 break that removes only `part="supporting"`; record restored-green evidence for WP03 while keeping reflection, fail-open, projection/order/preferences as direct tests and adding no subjects, SC-011 claims or slot-misroute mutations (FR-001, FR-005, FR-020, FR-029; NFR-005; C-015; SC-002, SC-005, SC-010). | WP01 | No |
| T006 | Regenerate only the WP-owned action-row/status CSS modules; reconcile both elements' documented `--sk-*` dependency lists against authored CSS; run focused checks plus a Storybook build smoke; audit forbidden scope, then seek only intermediate `approved` while remaining not `done` (FR-001–FR-012, FR-020–FR-023; NFR-003–NFR-008; C-001–C-008, C-013–C-017; NI-001–NI-004, NI-007–NI-008, NI-011–NI-012). | WP01 | No |
| T007 | Add red-first entity-marker fixture evidence for independent `size`/`shape`, unknown/toggle/pre-upgrade values, initials/icon/image neutrality, direct-slot crop geometry and the existing trimmed host-label naming algorithm (FR-013–FR-019; NFR-004–NFR-005, NFR-007; C-011–C-012, C-015, C-017; NI-001, NI-005–NI-006). | WP02 | No |
| T008 | Implement the independent compact and circle axes plus directly slotted image cover/crop presentation with existing tokens; reconcile entity-marker's documented `--sk-*` dependency list against authored CSS; retain marker/content parts and add no image/identity work (FR-013–FR-019; NFR-002, NFR-004, NFR-007; C-001–C-003, C-007–C-008, C-011–C-012, C-015, C-017). | WP02 | No |
| T009 | Add `.sk-empty-state--inline`, its authored passive light-DOM exemplar, generated local barrel and focused stories; add the WP02-owned three-browser `sk-empty-state-inline.spec.ts` proving short/long copy, 220/intermediate/360px wrapping, dark/light/forced colors, passive semantics and no page overflow (FR-024–FR-028; NFR-001–NFR-002, NFR-004, NFR-007–NFR-008; C-005, C-008–C-010; NI-009–NI-010). | WP02 | No |
| T010 | Correct the shared exported axe render verdict with a strict meaningful marker-image conjunction that proves the registered constructor and real upgraded instance; use it in readiness and final assertion, and add a loaded positive plus independent negatives for every conjunct including a counterfeit unregistered open-shadow host (FR-030–FR-031; NFR-001; C-016; NI-013; mission SC-011). | WP02 | No |
| T011 | Author focused component documentation for independent axes, image naming, passive inline semantics and consumer ownership; reconcile and document the inline modifier's exact `--sk-*` token contract from authored CSS using existing docs only; add no status, identity, notice, application contract or token file (FR-017–FR-019, FR-024–FR-027; C-005–C-006, C-011–C-012; NI-005–NI-006, NI-009, NI-012). | WP02 | No |
| T012 | Demonstrate exactly two SC-010 property-before-upgrade source breaks for entity `size` and `shape`, record their exact handoff for WP03, regenerate WP-owned CSS/barrel outputs, require Storybook plus the focused three-browser inline suite, and leave marker/empty/axe/gate-selftest checks green; create no SC-011 subject or slot-misroute mutation (FR-013–FR-019, FR-024–FR-027, FR-030–FR-031; NFR-001–NFR-002, NFR-005, NFR-007–NFR-008; C-010, C-016; SC-004, SC-006, SC-011). | WP02 | No |
| T013 | Persist exactly the five independently proven handoff arms—four SC-010 property-before-upgrade arms and one SC-013 arm removing only `part="supporting"`—in the sole-owned mutation registry, then use the complete suite self-test as the sole final re-derivation without manual replay duplication (FR-005, FR-013–FR-015, FR-020, FR-029; NFR-005; C-015; SC-002, SC-004–SC-005, SC-010). | WP03 | No |
| T014 | Create red-first React compile-time assertions for exact `layout`, `size`, `shape`, and `pulsing` types, regenerate manifest/React/Vue distributions in dependency order, turn the cases green, and update per-element docs/parts/story ratchets from rebased deltas (FR-001, FR-005, FR-013–FR-015, FR-020, FR-027–FR-029; NFR-004, NFR-006, NFR-009; C-008, C-010, C-013, C-015; SC-001, SC-008). | WP03 | No |
| T015 | Add the three-browser focused UI acceptance suite for T10 composition, exact action-row interactions/order/narrow containment, full marker matrix and naming, differential pulse preference oracles, and passive inline wrapping/semantics; axe-verdict requirements remain exclusively with T016 (FR-001–FR-029; NFR-002–NFR-008; C-001–C-015, C-017; SC-001–SC-009; NI-001–NI-012). | WP03 | No |
| T016 | Add only new-state visual assertions; run full Storybook and axe after ratchets are current; compare dark/light/narrow candidates qualitatively to #208 T10 Stitch project `13081441628826430456`, screen `ac34a994f4eb4c058d0744bf757713ab`, recording dated access/fallback evidence and no pixel claim; obtain CI-authoritative Ubuntu diffs and refuse every changed legacy baseline (FR-028–FR-031; NFR-001, NFR-004, NFR-007–NFR-009; SC-006–SC-009, SC-011). | WP03 | No |
| T017 | Fetch and rebase onto the latest train, regenerate every shared artifact and size report, recompute ratchet totals, revalidate all changed CSS against documented `--sk-*` dependency lists, run focused-first then the complete current local CI/recipe gate surface, and execute the full negative-invariant audit (all requirements; NI-001–NI-013; SC-001–SC-011). | WP03 | No |
| T018 | Prepare exact-head CI, T10 qualitative comparison, PR screenshot/diff, and read-only Codex adversarial-gate evidence for the outer orchestrator; record Stitch access outcome/fallback and no pixel-fidelity claim, then permit `done` transitions only after T016's full Storybook/axe/visual proof and T017's final gates are green (FR-028–FR-031; NFR-001–NFR-009; C-001–C-017; SC-001–SC-011). | WP03 | No |

No `[P]` marker is valid. The product surfaces are serial because WP02's axe correction depends on
the final entity-marker DOM/name contract, and WP03's distribution/mutation/acceptance evidence
depends on all authored contracts. T017 is intentionally late: any train rebase changes the source
of truth and invalidates earlier generation totals. T018 is last because any rebase or push
invalidates both CI and all four adversarial verdicts.

## Work Packages

### WP01 — Action-row and status presentation contracts

- **Goal**: ship the additive action-row `layout="card"`/`supporting` and status-indicator
  `pulsing` authored contracts without changing interaction, selection, tone or state ownership.
- **Independent review**: fixture tests, source CSS/token-list assertions, focused stories,
  Storybook build smoke and red-first SC-010/SC-013 breaks make WP01 eligible for an intermediate
  `approved` verdict before WP02 begins; it remains not `done`.
- **Included subtasks**: T001–T006.
- **Dependencies**: none beyond closed programme prerequisites and the current train.
- **Owned product surfaces**: only action-row/status-indicator sources, stories, fixture tests and
  their generated CSS modules.

### WP02 — Entity marker, inline empty state and bounded axe seam

- **Goal**: ship marker axes/image presentation, the passive inline empty-state exemplar, and the
  strict render-evidence correction that recognizes only the supported meaningful image case.
- **Independent review**: marker and empty-state focused tests, token-list reconciliation,
  Storybook build and `gate-selftest` make WP02 eligible for an intermediate `approved` verdict
  before distribution integration; it remains not `done`.
- **Included subtasks**: T007–T012.
- **Dependencies**: WP01.
- **Owned product surfaces**: only entity-marker/empty-state sources, their focused tests/stories
  and generated local outputs, the axe seam/shape fixtures, and focused component usage docs.

### WP03 — Integrated acceptance and distribution

- **Goal**: persist central mutations/ratchets, generate all public consumers, prove the coherent
  T10 composition across engines/preferences, establish CI-authoritative visuals, and close every
  local/final exact-head gate.
- **Independent review**: the complete final mission contract is reviewable from integrated
  Playwright, exact drift/token-list checks, the full Storybook/axe/visual gate run, T10 qualitative
  evidence and the exact-head bundle. Only after this proof is green may any WP become `done`.
- **Included subtasks**: T013–T018.
- **Dependencies**: WP02.
- **Owned product surfaces**: collision-prone central registries/ratchets, generated manifest and
  framework outputs, integrated browser/visual tests, distribution docs and size report.

## Requirement and invariant coverage

| Coverage group | Tasks |
|---|---|
| FR-001–FR-012 action row | T001–T006, T014–T018 |
| FR-013–FR-019 entity marker | T007–T008, T011–T018 |
| FR-020–FR-023 pulsing indicator | T001, T003–T006, T013–T018 |
| FR-024–FR-027 inline empty state | T009, T011–T012, T014–T018 |
| FR-028–FR-029 stories/distribution | T004, T009, T013–T018 |
| FR-030–FR-031 axe evidence | T010, T012, T016–T018 |
| NFR-001–NFR-009 | T001–T018, with complete final proof in T017–T018 |
| C-001–C-017 | surface-specific tasks above, with complete scope audit in T017–T018 |
| NI-001–NI-013 | T001–T012 by owned surface; all re-executed in T017 |
| SC-001–SC-011 | focused proofs in T004–T016; coherent final evidence in T017–T018 |

All FR-001–FR-031, NFR-001–NFR-009 and C-001–C-017 are mapped at least once. `SC-011` in the
mission spec means the axe self-test success criterion; it is not an authorization to add any
element as an ADR-11 fallback-behavior subject.

## Delivery note

WP01 and WP02 stop after implementation and independent Spec Kitty review with intermediate
`approved` verdicts; they remain not `done`. WP03 owns the coherent full Storybook/axe/visual proof,
after which all three may transition to `done`. The programme orchestrator owns the PR into
`train/elements-first`, T10 candidate screenshot/visual-diff attachment, CI artifact transport, the
exact-head four-lens Codex comment, squash merge, issue closeout and #208 checkbox. It must not merge
the train into `main`.
