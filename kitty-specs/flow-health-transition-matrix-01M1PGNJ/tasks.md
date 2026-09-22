# Tasks: Flow-health transition matrix

**Mission:** `flow-health-transition-matrix-01M1PGNJ`  
**Issue:** #149, part of #144 and tracking #125  
**Planning branch:** `mission/flow-health-transition-matrix`  
**Final delivery:** one PR from `mission/flow-health-transition-matrix` into
`train/elements-first`, with `Refs #149`

## Delivery rule

This mission has three serial internal Work Packages. They are implementation and review boundaries,
not PR boundaries. Spec Kitty may allocate a lane worktree and create one focused commit per WP, but
all commits return to the single mission branch. Do not push or open a WP-specific PR. WP03 closes
the dedicated React evidence and local gate after WP02. Only after all three reviewed WPs are
integrated does the mission open exactly one draft PR for issue #149; that same PR supplies the
CI-authoritative mutation timing, budget disposition, visual evidence, and final exact-SHA gate.
The whole mission is rebased and regenerated only after WP03 approval, during mission wrap-up;
neither WP02 nor WP03 falsely claims that consolidation step. The draft PR's first CI run generates
all nine authoritative visual actuals. After clean-v4 comparison, those exact bytes are committed as
baselines to the same PR and final CI reruns. That final head must pass the exact guard selftest,
unqualified Playwright including WebKit, visual regression, the mutation budget and every hard gate;
it also records Storybook CI duration strictly below 180 seconds, SHA-pinned full squad evidence and
one maintainer approval on the current PR head SHA. Missing/skipped evidence, a duration of 180
seconds or more, or evidence attached only to an earlier head blocks merge to the train. Merging
`train/elements-first` into `main` remains operator-only.

The mission does not create a static form, a Team Kitty dashboard aggregate, a Current/open-WP panel,
or any WP-per-line visualization. It adds no dependency, token, lockfile change, or ADR. If any of
those becomes necessary, stop for a decision rather than widening the mission.

## Subtask index

| ID | Work Package | Description | Parallel |
|---|---|---|---|
| T001 | WP01 | Add red-first probes for explicit public `attribute: false` classification | No |
| T002 | WP01 | Normalize and document the generic property-only manifest marker | No |
| T003 | WP01 | Generate property-only React props through `useProperties`, including empty-array removal reset, without attributes | No |
| T004 | WP01 | Prove the generic seam with focused selftests, type checks, and drift checks | No |
| T005 | WP02 | Write compile-safe acceptance, actual ADR behavior-pair, mutation, and type evidence red-first | No |
| T006 | WP02 | Implement the immutable data model, derived totals, validation, and controlled intent | No |
| T007 | WP02 | Build the semantic table, public parts, token-only styling, and narrow layout | No |
| T008 | WP02 | Publish all nine required stories, consumer-owned copy, interaction states, and synchronized documentation | No |
| T009 | WP02 | Regenerate and prove the element, manifest, React wrapper, entries, and size artifacts | No |
| T010 | WP02 | Add Storybook behavior, axe, scale, narrow-scroll, and visual evidence | No |
| T011 | WP02 | Record truthful WP02 closeout evidence and hand off post-WP03 consolidation gates | No |
| T012 | WP03 | Close dedicated React behavior/type evidence, sandboxed mutation coverage, local timing, and the pre-PR gate | No |

## WP01 — Generic property-only manifest and React pipeline

**Prompt:** [`tasks/WP01-generic-property-only-manifest-react-pipeline.md`](./tasks/WP01-generic-property-only-manifest-react-pipeline.md)  
**Priority:** P1 architectural prerequisite  
**Dependencies**: None  
**Requirement refs**: FR-002, FR-018, FR-019, FR-021, FR-024, NFR-004, NFR-009,
NFR-010, C-001, C-006, C-010
**Independent review:** Feed synthetic CEM declarations through the normalizer/generator probes and
show that only an explicitly public, settable `attribute: false` field receives the marker and a
generated property assignment. Internal `state: true`, readonly/private fields, spread/computed
declarations, and attribute serialization must fail or remain excluded as specified.

### Included subtasks

- [ ] T001 Add red-first probes for explicit public `attribute: false` classification (WP01)
- [ ] T002 Normalize and document the generic property-only manifest marker (WP01)
- [ ] T003 Generate property-only React props through `useProperties` without attributes (WP01)
- [ ] T004 Prove the generic seam with focused selftests, type checks, and drift checks (WP01)

### Implementation sketch

1. Extend the existing TypeScript-AST normalizer instead of adding a regex or component allowlist.
2. Mark only intentional public property-only inputs with `x-spec-kitty-property-only: true`.
3. Teach the documentation ratchet to count described property-only members separately from
   observed attributes and public methods.
4. Narrow the wrapper input to observed attributes plus explicitly marked property-only members,
   preserving the `EXPECTED_NON_PROP_FIELDS` protection for internal state.
5. Make the generated runtime assign property-only values through the existing `useProperties`
   route, before/after upgrade, on reference replacement, and on removal via a proven immutable
   empty-array reset, never through `React.createElement` attributes.
6. Prove the seam through synthetic selftests. Existing wrappers and the production manifest must
   not change merely because the generic capability was added.

### Review boundaries

- No `transition-matrix` authored source or generated wrapper belongs in WP01.
- #149 explicitly authorizes only the smallest generic AST marker, manifest-doc gate and generated
  React property-delivery/removal-reset change required for structured props; no unrelated
  generator refactor belongs in either WP.
- No existing element gains a new public property merely to exercise the seam.
- No array/object JSON serialization into attributes is permitted.
- WP01 may update `expected-docs.json` to add the generic `properties` count while preserving the
  exact current attribute/method counts for every existing element.
- WP01 and WP02 deliberately overlap shared generator/ratchet surfaces. `WP02 -> WP01` forces them
  into one serial lane; they are never parallel writers.

## WP02 — Complete controlled transition matrix and release evidence

**Prompt:** [`tasks/WP02-complete-controlled-transition-matrix-and-release-evidence.md`](./tasks/WP02-complete-controlled-transition-matrix-and-release-evidence.md)  
**Priority:** P1 feature implementation and component gate
**Dependencies**: WP01
**Requirement refs**: FR-001 through FR-024; NFR-001 through NFR-010; C-001 through C-010
**Independent review:** Render the approved six-route/four-column fixture and verify all 24 cells,
derived totals `21/17/11/6/4/3` and `62 moves`, controlled non-cancelable route intent, real table
relationships, five-tone semantics, aggregation at fifty-WP scale, empty/invalid behavior, both
themes, narrow scrolling, and generated React artifacts. WP03 independently closes the dedicated
React runtime/type subjects and complete pre-PR local gate; the draft mission PR then owns CI and
the final exact-SHA gate.

### Included subtasks

- [ ] T005 Write the transition-matrix acceptance, behavior, mutation, and type evidence red-first (WP02)
- [ ] T006 Implement the immutable data model, derived totals, validation, and controlled intent (WP02)
- [ ] T007 Build the semantic table, public parts, token-only styling, and narrow layout (WP02)
- [ ] T008 Publish all nine required stories, consumer-owned copy, interaction states, and synchronized documentation (WP02)
- [ ] T009 Regenerate and prove the element, manifest, React wrapper, entries, and size artifacts (WP02)
- [ ] T010 Add Storybook behavior, axe, scale, narrow-scroll, and visual evidence (WP02)
- [ ] T011 Record truthful WP02 closeout evidence and hand off post-WP03 consolidation gates (WP02)

### Implementation sketch

1. Establish a compile-safe component source/fixture baseline first, then apply one surgical source
   break per behavior or acceptance assertion and record the intended named red before restoring.
   Registry IDs are used only for ADR-11 behaviors the element actually owns; mission SC numbering
   never becomes registry meaning.
2. Implement one `<sk-transition-matrix>` with readonly structured properties, fail-closed input
   validation, cell-derived totals and scale, controlled selection projection, and one dispatch
   path for pointer, Enter, and Space.
3. Render a native table with explicit header relationships and an accessible group separator.
   Keep route ownership visible at narrow widths through horizontal scrolling and a sticky route
   column. Use only existing tokens unless an explicit decision authorizes a token change.
4. Add exactly the nine named stories: `Default`, `ApprovedExample`, `FiftyActiveWPs`, `SparseData`,
   `EqualTotalsDifferentDistribution`, `Empty`, `ControlledSelection`, `SelectableStates`, and
   `LightMode`. `SelectableStates` proves real rest/hover/focus-visible/pointer-active/keyboard-
   pressed treatment, while its non-selectable state is the component's disabled-interaction
   analogue; do not create a tenth story or a simulated state class. The approved story supplies
   its window/description/hint copy; the element does not.
5. Register the element subject only on applicable behavior ids; add exact documentation/parts/story
   ratchets, generated manifest/React artifacts, the named stylesheet export, and published
   token-dependency verification. WP03 owns the distinct React subject and its registry pairs.
   Never hand-edit `packages/react/src` or generated stylesheet modules.
6. Add browser assertions that cannot certify an absent or blank component. Fedora-local functional
   evidence explicitly covers Chromium and Firefox. Local visual captures are diagnostic only and
   are never committed or blessed.
7. Record T011 as a truthful WP02 closeout handoff: the passing main mutation harness and runnable
   component gates, the reproducible local guard-4 selftest hang, the unavailable local WebKit
   libraries, and the absence of CI-authoritative baselines. Do not claim the upstream rebase,
   WebKit, guard-selftest or baseline gates complete. WP03 follows on the shared lane; post-WP03
   mission wrap-up owns rebase/regeneration and the one draft PR owns all nine baseline bytes.

### Review boundaries

- The adjacent “Current / 50 open WPs” inventory is outside the element and all fixtures.
- Route labels, column labels, group labels, selected route, dates, and time are consumer-owned.
- `windowLabel`, `description`, and `selectionHint` are consumer-owned strings. Empty defaults keep
  the reusable element domain-neutral; only a selectable matrix renders a supplied hint.
- The event is bubbling, composed, and explicitly `cancelable: false`; there is no component-owned
  default action and no SC-009 registration.
- No static `.html`, styles-layer `index.ts`, or `.markup.ts` is created for this structured-data
  component.
- No sibling TKO1–TKO4 authored component source, application router/store, fetch, timer, or Team
  Kitty domain calculation may enter the diff.
- After WP03 approval and integration there is one draft mission PR into `train/elements-first`,
  never one PR per WP. CI/final-gate evidence is pinned to that PR's post-CI head.
- Local functional Playwright runs Chromium and Firefox explicitly. WebKit is mandatory in the
  final unqualified CI run; no local system-package install is authorized. The local guard-4
  `suite-selftest --selftest` hang is recorded but the exact command must pass in final CI.
- That exact final head requires a successful Storybook CI build step measured at less than 180
  seconds and at least one maintainer approval whose review names the current head commit. A later
  push invalidates both records. The integration train may be merged into `main` only by the
  operator.

## WP03 — React and final verification closure

**Prompt:** [`tasks/WP03-react-and-final-verification-closure.md`](./tasks/WP03-react-and-final-verification-closure.md)
**Priority:** P1 final verification closure
**Dependencies**: WP02
**Requirement refs**: FR-012, FR-019, FR-021, FR-024, NFR-002, NFR-004, NFR-009,
NFR-010, C-006, C-010
**Independent review:** Prove the generated React wrapper's structured-property and typed-event
contract in its dedicated browser/type subjects, register only the applicable React ADR pairs with
non-inert sandboxed mutations, record the local suite timing, and rerun every locally runnable gate
at the WP03 head. The known guard-4 hang is recorded without a pass claim. Post-WP03 mission wrap-up
owns the rebase/regeneration; CI-authoritative environment, visual, timing and budget disposition
happen later on the one draft mission PR.

### Included subtasks

- [ ] T012 Close dedicated React behavior/type evidence, sandboxed mutation coverage, local timing, and the pre-PR gate (WP03)

### Implementation sketch

1. Add the distinct React browser subject and extend the existing React type-test surface; do not
   modify generated React sources.
2. Register only the React SC-006 listener-delivery and SC-010 structured-property delivery pairs,
   each with a unique production-source mutation. WP02 retains every element-owned pair.
3. Drive both registered red probes only through `suite-selftest.mjs`'s temporary-copy/sandbox
   mutation path, pinned to generated-wrapper delivery/listener anchors. Never edit an out-of-scope
   generated wrapper or generator in the checkout.
4. Run focused browser/type/mutation checks, record the local suite count and elapsed time, then run
   every runnable local gate at the resulting WP03 head. A missing or blank wrapper subject is a
   failure; local timing is evidence of execution only and cannot authorize a budget change. Attempt
   the guard selftest and, if guard 4 hangs as already reproduced, record the bounded diagnostic
   without claiming it passed.

### Review boundaries

- WP03 writes only its dedicated React fixture, the existing React type-test surface, the two
  registry/mutation support files, and conditionally `suite-budget.json`.
- It does not directly edit `packages/react/src/**`, the wrapper generator, component
  source/CSS/stories, manifest, docs, or ratchets. Harness-owned temporary mutation copies are the
  only allowed way to break an out-of-scope generated-wrapper/generator anchor.
- The registry must contain no React transition-matrix pair except SC-006 and SC-010; SC-009,
  SC-011, SC-012, and SC-015 remain inapplicable.
- WP03 approval requires recorded local suite counts/timing but leaves the budget unchanged. The
  draft-PR final gate owns CI URL/SHA/count/elapsed evidence and any conditional budget disposition.

## Mission wrap-up after WP03 approval *(not a work package)*

1. Integrate the approved WP03 result, fetch current `train/elements-first`, rebase the whole shared
   mission branch, regenerate shared artifacts and rerun every runnable local gate. Functional
   Playwright is explicitly Chromium plus Firefox on Fedora; do not install WebKit system packages.
2. Open exactly one draft mission PR with `Refs #149`. Use its CI URL, exact SHA, mutation/test
   counts and elapsed time for the mutation-budget disposition. If a budget change is required,
   keep the same PR, return the smallest justified edit to a fresh WP03 implementer, repeat affected
   review, and rerun CI at the new head.
3. Use that draft PR's first CI run to generate all nine authoritative visual actual PNGs. Compare
   those exact bytes with clean-v4, commit the approved bytes as baselines to the same PR, and rerun
   final CI. Never commit a local capture or use local `--update-snapshots` as authority.
4. At the resulting exact PR head, require `node scripts/suite-selftest.mjs --selftest`, unqualified
   `npx playwright test` including WebKit, and
   `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium`
   against the nine committed baselines to pass with the mutation budget and all hard gates. Record
   Storybook CI duration below 180 seconds, run the full SHA-pinned squad, and require a maintainer
   approval whose `commit_id` matches the current head. Any push invalidates earlier CI, squad,
   timing and approval evidence. No agent merges the train into `main`.

## Dependency and lane expectation

`WP02` depends on `WP01`; `WP03` depends on `WP02`. WP01/WP02 share generator and documentation-
ratchet paths, while WP02/WP03 share only `behaviours.json` and `mutations.json` so the dedicated
React pairs are added after their generated wrapper exists. These overlaps intentionally collapse
all three packages into one serial execution lane ordered `WP01`, `WP02`, `WP03`: one writer, three
reviewable internal commits, one mission branch, and one external PR.

## Mission-level completion evidence

- Every FR is mapped to at least one WP and every WP has explicit NFR/constraint coverage.
- All WP prompts stay below ten subtasks and contain exact live commands plus objective reviewer checks.
- WP01 is reviewable without transition-matrix source; WP02 proves the component; WP03 proves the
  dedicated React consumer/type seam and every runnable local gate before mission wrap-up. The
  local guard-4 selftest hang and unavailable WebKit runtime are recorded, not called green or
  treated as waivers.
- After WP03 approval, the final branch is rebased onto current `train/elements-first` and has linear
  history.
- Generated output is regenerated after the final rebase and no generated drift remains.
- The final diff contains no package/lock/token/ADR change and no sibling authored component change.
- Exactly one draft PR uses head `mission/flow-health-transition-matrix`, base
  `train/elements-first`, and body `Refs #149`; no WP-specific PR exists. It carries the CI budget
  disposition and all nine CI-sourced baseline bytes, then passes exact-head guard selftest,
  unqualified Playwright including WebKit, visual regression and every hard gate. It carries a
  Storybook CI build duration below 180 seconds, one maintainer approval on the current head, and
  required full pre-merge squad evidence at its post-CI head SHA; any corrective push repeats
  affected review, CI, timing, squad, approval, and final evidence. Merging the train into `main`
  remains an operator act.
