# Tasks: Team overview feed elements

**Mission:** `team-overview-feed-elements-01M1S8T0`
**Issue:** #146, part of #144 and tracking #125
**Planning branch:** `mission/team-overview-feed-elements`
**Final delivery:** one PR from `mission/team-overview-feed-elements` into
`train/elements-first`, with `Refs #146`

## Delivery rule

This mission has three serial internal Work Packages on one Spec Kitty lane. They are implementation
and independent-review boundaries, not PR boundaries. Do not push or open a WP-specific PR. Run
WP01 → WP02 → WP03 without rebasing the active lane after execution starts. After WP03 approval,
mission wrap-up freezes the lane, records the fetched train SHA, rebases the clean planning target
onto that held SHA, then asks Spec Kitty to merge the lane. It regenerates and commits every shared
artifact on that result, runs all
exact-head gates with no later rebase, and opens/updates exactly one draft PR.

The PR receives CI-authoritative visual baselines, a final green CI run, the Tier-C three-lens Codex
pre-merge squad, external acceptance attestation (or explicit SK-178 waiver) and one maintainer
approval on the same exact head SHA. Any push invalidates affected evidence. If the recorded train
hold advances after consolidation, SK-179 leaves no truthful rebase path: mark the mission BLOCKED.
Merge is allowed only into `train/elements-first` after explicit operator authorization. Never touch
`main`, publish or deploy. Once that train merge is verified, the orchestrator immediately closes
#146; WP workers never close it, and #144, #125, #112 and unfinished siblings remain open.

## Subtask index

| ID | Work Package | Description | Parallel |
|---|---|---|---|
| T001 | WP01 | Establish compile-safe red-first contracts for the three presentational primitives | No |
| T002 | WP01 | Implement section-header, status-indicator and entity-marker sources and accessibility | No |
| T003 | WP01 | Add stories, ratchets, mutations, docs, exports and generated artifacts | No |
| T004 | WP01 | Run the focused presentational-component gate and record review evidence | No |
| T005 | WP02 | Establish compile-safe red-first action-row/event/isolation contracts | No |
| T006 | WP02 | Implement the controlled native-trigger action row and public event | No |
| T007 | WP02 | Add responsive states, native-list/control stories and browser evidence | No |
| T008 | WP02 | Register exact behavior/mutation pairs and regenerate component artifacts | No |
| T009 | WP02 | Run the focused action-row gate and record review evidence | No |
| T010 | WP03 | Close generated React runtime/type evidence and its mutation pair | No |
| T011 | WP03 | Regenerate every shared output and run the complete local pre-PR gate | No |
| T012 | WP03 | Reconcile acceptance/issue matrices and hand off exact-head analysis/acceptance closure | No |

## WP01 — Presentational feed primitives

**Prompt:** [`tasks/WP01-presentational-feed-primitives.md`](./tasks/WP01-presentational-feed-primitives.md)
**Priority:** P1 prerequisite
**Dependencies:** None
**Requirement refs:** FR-001–FR-004, FR-012–FR-020; NFR-001–NFR-003, NFR-006–NFR-010;
C-001–C-009
**Independent review:** Verify native heading ownership, six consumer-controlled status tones,
visible/non-color meaning, meaningful/decorative marker behavior, every declared part, constructed
sheet identity, both themes, generated consumer surfaces and absence of static/domain/application
logic.

### Included subtasks

- [ ] T001 Establish compile-safe red-first contracts for the three presentational primitives
- [ ] T002 Implement section-header, status-indicator and entity-marker sources and accessibility
- [ ] T003 Add stories, ratchets, mutations, docs, exports and generated artifacts
- [ ] T004 Run the focused presentational-component gate and record review evidence

### Review boundaries

- Exactly `section-header`, `status-indicator` and `entity-marker`; no action-row implementation.
- No `section-list`, list/listitem role, static form, token, dependency, router/store/fetch/time code,
  generated initials or domain-to-tone mapping.
- `sk-pill-tag` and `sk-button` may appear only in consumer/story compositions and remain unchanged.
- WP01 may write shared registries/generated outputs only for its three new components. WP02 follows
  on the same lane and regenerates them again from the combined tree.

## WP02 — Controlled action row

**Prompt:** [`tasks/WP02-controlled-action-row.md`](./tasks/WP02-controlled-action-row.md)
**Priority:** P1 behavior surface
**Dependencies:** WP01
**Requirement refs:** FR-005–FR-011, FR-016–FR-020; NFR-001–NFR-010; C-001–C-011
**Independent review:** Verify valid-ID fail-closed interaction, native pointer/Enter/Space parity,
exact non-cancelable event detail/flags, controlled selection, nested native and `sk-button` control
isolation, native consumer list semantics, long-content/narrow layout, public parts and generated
sheets.

### Included subtasks

- [ ] T005 Establish compile-safe red-first action-row/event/isolation contracts
- [ ] T006 Implement the controlled native-trigger action row and public event
- [ ] T007 Add responsive states, native-list/control stories and browser evidence
- [ ] T008 Register exact behavior/mutation pairs and regenerate component artifacts
- [ ] T009 Run the focused action-row gate and record review evidence

### Review boundaries

- The primary trigger is a real internal button; trailing controls are its sibling. Never place
  interactive control content inside the trigger or use a whole-row ARIA button with descendants.
- `rowId`, `selectable` and `selected` are consumer inputs. No activation mutates selected, routes,
  navigation, feed data or time.
- Consumers own `ul > li`; action-row renders neither list markup nor list roles.
- The binding event is `cancelable: false` because the controlled row owns no preventable default.
  Do not claim ADR-11 SC-009 or invent an element-owned action to make it applicable.
- No direct generated React edit. WP03 owns the dedicated React runtime/type evidence.

## WP03 — Generated consumers and complete local gate

**Prompt:** [`tasks/WP03-generated-consumers-and-final-gate.md`](./tasks/WP03-generated-consumers-and-final-gate.md)
**Priority:** P1 delivery closure
**Dependencies:** WP02
**Requirement refs:** FR-019–FR-020; NFR-001–NFR-010; C-006–C-013
**Independent review:** Verify the generated React callback receives exactly one typed `{ id }`
event, positive/negative type assertions are meaningful, all committed generated outputs are fresh,
every locally satisfiable behavior/mutation/type/axe/security/history gate passes, visual cases are
diagnostic/expected-red until authoritative PR baselines exist, and post-WP consolidation obligations
are handed off without claiming external evidence early.

### Included subtasks

- [ ] T010 Close generated React runtime/type evidence and its mutation pair
- [ ] T011 Regenerate every shared output and run the complete local pre-PR gate
- [ ] T012 Reconcile acceptance/issue matrices and hand off exact-head analysis/acceptance closure

### Review boundaries

- React sources remain generator-owned; any red probe targets a temporary mutation-harness copy.
- Vue receives generated tag/prop declarations only. Do not claim generated typed Vue event handlers.
- WP03 owns truthful pending updates to the acceptance matrix, issue matrix and analysis report; it
  must not claim external evidence that does not yet exist. It does not rebase, push, open a PR,
  bless local visual baselines, run the squad, approve itself, merge, publish or deploy. Those
  actions occur only at mission wrap-up/final gate with held-train and exact-head evidence.

## Dependency graph

```text
WP01 presentational primitives
  -> WP02 controlled action row
       -> WP03 generated consumers + complete local gate
            -> all WPs approved; freeze lane
                 -> record train hold + rebase clean target onto it
                      -> Spec Kitty merges frozen lane
                           -> generation + matrix/analysis reconciliation
                                -> exact-head conformance/CI/visual/squad/acceptance/maintainer gate
                                -> one authorized train merge
```

All three WPs intentionally share global registry, manifest, wrapper, Vue and size outputs, so task
finalization must collapse them into one writer lane. No parallel group is valid inside this mission.
