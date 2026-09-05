---
work_package_id: WP02
title: Controlled action row
dependencies:
- WP01
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
- C-011
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-016
- FR-017
- FR-018
- FR-019
- FR-020
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
planning_base_branch: mission/team-overview-feed-elements
merge_target_branch: mission/team-overview-feed-elements
branch_strategy: Planning artifacts for this mission were generated on mission/team-overview-feed-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/team-overview-feed-elements unless the human explicitly redirects the landing branch.
subtasks:
- T005
- T006
- T007
- T008
- T009
phase: Phase 2 - Controlled action row
history:
- timestamp: '2026-09-05T17:25:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/action-row/
create_intent:
- packages/styles/src/action-row/sk-action-row.css
- packages/elements/src/action-row/sk-action-row.ts
- packages/elements/src/action-row/sk-action-row.stories.ts
- fixtures/elements-behaviour/src/sk-action-row.test.ts
execution_mode: code_change
owned_files:
- packages/styles/src/action-row/**
- packages/styles/package.json
- packages/elements/src/action-row/**
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- fixtures/elements-behaviour/src/sk-action-row.test.ts
- apps/storybook/src/tests/elements-load.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/*action-row*.png
- docs/design-system/using-components.md
- docs/design-system/using-react.md
- docs/design-system/changelog.md
- behaviours.json
- mutations.json
- expected-docs.json
- expected-parts.json
- expected-stories.json
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/react/src/**
- packages/react/.wrapper-floor
priority: P1
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#146'
- '#144'
- '#125'
- '#92'
---

# WP02 — Controlled action row

## Do this first: load the profile

After WP01 approval, load `frontend-freddy` through `spk-doctrine-profile-load`, apply the resolved
implementation context, and use only the workspace emitted by:

```sh
spec-kitty agent action implement WP02 --agent codex --mission team-overview-feed-elements-01M1S8T0
```

Use Codex only. Do not rebase the reused lane.

## Objective

Deliver `<sk-action-row>` with the approved marker/title/reference/tags/right-metadata grammar, one
real native primary trigger, sibling trailing controls, valid-ID fail-closed interaction, controlled
selected state, exact pointer/Enter/Space activation, the binding non-cancelable event contract,
nested-control isolation, responsive token-only states, stories, docs, conformance/mutation evidence
and regenerated component surfaces.

## Context and hard boundaries

- Inputs are `rowId`/`row-id`, `selectable` and `selected`; all remain consumer-controlled.
- Slots are `marker`, `title`, `reference`, `tags`, `metadata`, `controls`.
- Parts are `row`, `trigger`, `marker`, `title`, `reference`, `tags`, `metadata`, `controls`.
- The primary scan content belongs inside one real `button type="button"` only when the row is
  valid/selectable. Trailing controls are a sibling, never nested inside that trigger.
- Only the primary trigger dispatches. Do not attach a row-wide listener that catches composed
  nested control clicks; if delegation becomes unavoidable, isolation must use `composedPath()`.
- Consumers author `ul > li > sk-action-row`. The component renders no list markup/roles.
- `[part=row]` is the stable root in selectable and non-selectable branches. It exposes only
  `aria-current="true"` for the controlled selected state; never `aria-selected`, `aria-pressed`, a
  selected-container role, checkbox or switch semantics.
- No feed array, sorting/deduplication, status inference, selected mutation, destination, router,
  store, fetch, timer/clock, dependency, token, static form or sibling component source is allowed.
- The event is explicitly `cancelable: false` because this controlled element owns no preventable
  default action. Do not claim ADR-11 SC-009 or invent a default action.

### T005 — Establish compile-safe red-first action contracts

1. Add a registered compile-safe element/CSS scaffold, export
   `ActionRowActivateDetail = Readonly<{ id: string }>`, generate its CSS module and render a labelled
   non-empty unavailable state before writing behavior assertions.
2. Create `fixtures/elements-behaviour/src/sk-action-row.test.ts` with external behavior assertions:
   - exact named-slot assignment and approved scan order;
   - nonselectable and blank/whitespace-ID fail-closed behavior;
   - valid selectable pointer, Enter and Space activation exactly once, including two real repeated
     keydowns that still yield one activation because only repeat Enter/Space is prevented;
   - exact detail object and the binding `bubbles`/`composed`/`cancelable` flags; one external listener
     calls `preventDefault()` and the same composite probe asserts actual dispatch returned `true`,
     `defaultPrevented` stayed `false`, and no default application action occurred;
   - consumer-controlled selected true→false reassignment with no activation mutation;
   - `aria-current="true"` appears only for selected on the stable row root in both selectable and
     non-selectable branches, with no `aria-selected`/toggle semantics;
   - document-level cross-shadow receipt;
   - native link, native button and landed `sk-button` trailing controls remain operable and emit
     zero row events;
   - consumer native `ul > li` roles remain valid, with no list/listitem role in the element;
   - every declared part is present/targetable, and the generated sheet is the sole adopted sheet by
     identity with zero injected styles;
   - `rowId`, `selectable` and `selected` assigned before definition survive upgrade.
3. Use browser interaction APIs for real Enter/Space behavior; dispatching a synthetic `keydown`
   that never causes a native click is not evidence. Explicitly drive the initial and repeated
   keydown sequence in Chromium; the known native behavior without the guard produces two clicks.
   Missing imports/registration/parser/blank-root failures are not evidence either.
4. Run the compile-safe scaffold red and record only intended named failures. Production mutation
   entries wait until T006 provides stable unique source anchors.

### T006 — Implement controlled trigger and event

1. Implement the input and slot/part contracts exactly. Trim `rowId` only for validity; preserve the
   consumer string as the emitted `id` once valid.
2. Keep the controls region outside the native primary trigger. Ensure a non-selectable/invalid row
   has no false focus target, pointer cursor or event path.
3. Project `selected` onto the stable `[part=row]` surface as visual state plus
   `aria-current="true"`, for both selectable and non-selectable branches, without mutating it.
   Re-rendering a consumer replacement is the only state transition. Do not use `aria-selected`,
   `aria-pressed`, checkbox or switch semantics.
4. Dispatch from the host exactly once per native primary activation. Export/document the typed
   detail and all final flags so CEM and React can preserve them.
5. Dispatch with `bubbles: true`, `composed: true` and `cancelable: false`. The controlled row owns
   no preventable default action; do not register SC-009. Prove noncancelability as the composite
   dispatch/defaultPrevented/no-default-action contract, not as a flag-only assertion.
6. Add a `keydown` guard on the native trigger that calls `preventDefault()` only when
   `event.repeat` is true and `event.key` is Enter or Space. Initial keydown and all other keys retain
   native behavior; no custom non-repeat activation path is added.
7. Document token dependencies, inputs, slots, event and parts for consumers; rationale remains in
   non-published comments.

### T007 — Responsive states, stories and browser evidence

1. Add `Default`, `NativeList`, `Selected`, `NonSelectable`, `WithControls`, `LongContent`,
   `SelectableStates`, `LightMode`. Use actual controls and real interaction states, not simulated
   state classes.
2. Compose landed `sk-pill-tag` instances in the story's `tags` slot and native/landed buttons in
   `controls`; do not import/nest them from action-row runtime code or choose domain variants there.
3. At 320 CSS pixels assert no viewport overflow, bounding-box collision or clipped focus ring for a
   long unbroken reference, several pills, metadata and controls. Supplied age text remains readable.
4. Add Playwright behavior for native list semantics and real pointer/Enter/Space/control isolation.
   Include real-browser initial/repeat keydown and both selected render branches. Add visual cases for
   dark/light, narrow, rest/hover/focus-visible/pointer-active/selected/nonselectable states, but run
   them only as diagnostic/expected-red until PR Linux Chromium baselines become authoritative.
5. Use only existing tokens. If measurement proves one missing, stop for a scope decision.

### T008 — Register behavior and regenerate surfaces

1. Add exact docs/parts/stories ratchet entries and recompute totals from the current lane tree;
   mission wrap-up recomputes them again after the clean target is rebased and the lane is merged.
2. Register `sk-action-row` for SC-006, SC-007, SC-008, SC-010, SC-013 and SC-014. Do not register
   SC-009; the event is non-cancelable and there is no preventable default.
3. Add unique surgical mutations: duplicate event dispatch; wrong detail; false bubbling/composed;
   pre-upgrade property omission; a non-root part removal; empty sheet array; fresh sheet identity;
   This is seven action-row arms total; no cancellation mutation is present.
4. Run every arm through the sandboxed mutation harness and require the intended action-row subject
   alone to red within the collateral bound. Direct regression tests without an ADR pair stay
   unbracketed and are not mislabeled to enter the harness.
5. Export/register the element, add its styles-package subpath, regenerate CSS/CEM/React/Vue/SIZES
   from source and update usage/React/changelog docs. Never hand-edit generated files.

### T009 — Focused gate and review handoff

Run the action-row fixture, type/manifest/entry/part/style/theme/story checks, `npm run test`, full
mutation harness, Storybook/axe and targeted functional Playwright. Execute visual cases only as an
expected-red diagnostic before baselines. Inspect the aggregate WP01+WP02 diff for list semantics,
nested control validity, state/application leakage and excluded scope. Commit only declared paths,
record exact SHA/counts and submit WP02 for independent review. Do not rebase, push, open a PR, bless
local PNGs or self-approve.

## Definition of Done

- [ ] Action-row uses one native trigger with sibling controls and exact approved scan order.
- [ ] Invalid IDs fail closed; pointer/Enter/Space are equivalent, repeat-only keydown prevention
  suppresses duplicate activation in a real browser, and nested controls never fire it.
- [ ] Selected remains consumer-controlled across activation/reassignment and maps only to
  `aria-current="true"` on the stable row root in both render branches.
- [ ] Event type/detail/flags are exact and every declared ADR pair has a non-inert mutation;
  the composite prevention probe observes dispatch true/defaultPrevented false/no default action,
  `cancelable` is false and SC-009 is absent.
- [ ] Native list, narrow layout, both themes, states, parts and generated surfaces are proven.
- [ ] Independent review approves exact WP02 SHA; no rebase/push/PR/main/publish/deploy occurred.

## Reviewer guidance

Reject a whole-row ARIA button containing controls, `target.closest()` isolation across shadow
retargeting, custom keyboard behavior that duplicates native clicks, selected mutation, invalid-ID
activation, any SC-009 claim, list roles, application logic, domain tags/tones, raw values,
generated hand edits or local visual-baseline blessing.
