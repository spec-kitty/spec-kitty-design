---
work_package_id: WP01
title: Action-row and status presentation contracts
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-020
- FR-021
- FR-022
- FR-023
- FR-028
- FR-029
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- C-001
- C-002
- C-003
- C-004
- C-006
- C-007
- C-008
- C-013
- C-014
- C-015
- C-017
planning_base_branch: mission/compact-work-item-extensions
merge_target_branch: mission/compact-work-item-extensions
branch_strategy: Planning artifacts for this mission were generated on mission/compact-work-item-extensions. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/compact-work-item-extensions unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-compact-work-item-extensions-01M1X6NT
base_commit: 68e12a874be5c843f66fddbec9bb82597b2e1424
created_at: '2026-09-07T07:26:11.848185+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
phase: Phase 1 - action-row and status presentation contracts
history:
- at: '2026-09-07T00:00:00Z'
  actor: codex
  action: Prompt authored for issue #212
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/action-row/
create_intent: []
execution_mode: code_change
owned_files:
- packages/styles/src/action-row/sk-action-row.css
- packages/styles/src/status-indicator/sk-status-indicator.css
- packages/elements/src/action-row/sk-action-row.ts
- packages/elements/src/action-row/sk-action-row.stories.ts
- packages/elements/src/action-row/sk-action-row.css.js
- packages/elements/src/action-row/sk-action-row.css.d.ts
- packages/elements/src/status-indicator/sk-status-indicator.ts
- packages/elements/src/status-indicator/sk-status-indicator.stories.ts
- packages/elements/src/status-indicator/sk-status-indicator.css.js
- packages/elements/src/status-indicator/sk-status-indicator.css.d.ts
- fixtures/elements-behaviour/src/sk-action-row.test.ts
- fixtures/elements-behaviour/src/sk-status-indicator.test.ts
priority: P1
role: implementer
tags:
- elements-first
- presentation
- accessibility
task_type: implement
tracker_refs:
- '#212'
- '#208'
---

# Work Package Prompt: WP01 — Action-row and status presentation contracts

## Do this first: governed Codex context

Load `frontend-freddy` through the installed Spec Kitty resolver and load implementation-scoped
charter context. Read `AGENTS.md`, `CLAUDE.md`, issue #212, `spec.md`, corrected `plan.md`, ADR-9,
ADR-10, ADR-11 and the current component-authoring recipe in full. Use the installed Spec Kitty
runtime CLI for action, status and verdict state. Never hand-edit event/status/meta files.

Run this seat on a Codex subagent only. Do not use Claude, `spec-kitty dispatch`, an Op, a review
driver or a git worktree. Stay inside the fresh primary clone and the mission branch. Start from a
clean tree and current train baseline supplied by the orchestrator; do not write to GitHub or merge.

## Outcome and independent review boundary

Deliver two additive presentation contracts:

1. `sk-action-row` accepts reflected `layout="card"` and exposes an optional `supporting` slot in
   an always-present `part="supporting"` wrapper.
2. `sk-status-indicator` accepts reflected boolean `pulsing`, applying CSS presentation only to an
   assigned marker with reduced-motion and forced-colors fallbacks.

The existing action-row trigger, controlled selection, exact activation event, sibling controls,
status text and six-tone vocabulary remain unchanged. WP01 owns no entity-marker, empty-state, axe,
shared manifest/wrapper, central ratchet or central mutation file. WP02 and WP03 must not reopen
these authored sources. The package is independently reviewable and eligible for an intermediate
`approved` verdict from its fixture tests, reconciled token-dependency comments, authored CSS/
stories, Storybook build smoke, generated local CSS modules and recorded red-first evidence. It MUST
remain not `done`; full all-story axe/visual evidence belongs to WP03 after coherent integration.

## Hard boundaries

- Do not create any component, semantic card wrapper, Work Package surface, Kanban behavior,
  status/tone axis, nested toned `sk-card`, route, fetch, timer, heartbeat, claim expiry, liveness
  inference, relative-time formatter, progress arithmetic or Markdown parser.
- Do not move controls into the trigger, add a host `tabindex`, change event detail/flags, mutate
  `selected`, or make supporting content interactive. Native and custom controls remain siblings.
- Do not add a new tone or map application status to tone. Visible consumer text remains the
  meaning carrier; pulse is never a liveness model.
- Use only authoritative `--sk-*` tokens for design values. Add no raw color/spacing/type/radius/
  shadow/motion value, cross-shadow theme selector or `forced-color-adjust: none`.
- Do not add any action-row or status-indicator SC-011 subject. Do not create a slot-misroute
  mutation. The only WP01 mutation handoffs are SC-010 property-before-upgrade arms for `layout`
  and `pulsing`, plus one SC-013 arm that removes only `part="supporting"`. Reflection, unsupported-
  layout fail-open, slot projection/source order and preferences use direct tests.
- Do not hand-edit generated artifacts. Only run the CSS generator for the two owned CSS modules;
  WP03 owns manifest, React/Vue generation, ratchets and central mutation persistence.

## T001 — Characterize, then make the new contract red

Confirm the existing fixture tests are green before editing:

```bash
npx vitest run --project browser \
  fixtures/elements-behaviour/src/sk-action-row.test.ts \
  fixtures/elements-behaviour/src/sk-status-indicator.test.ts
node scripts/build-elements-css.mjs --check
```

Extend the two fixture files first. Run the same focused command and preserve exact failing-test
names/output showing only absent new behavior. Cover:

- `layout` omitted/empty/current default, accepted `card`, unsupported nonblank warning/fail-open,
  post-upgrade toggles, reflection and property-before-upgrade assignment;
- a stable `part="supporting"` wrapper with the exact named slot; empty, assignment, removal and
  reassignment visibility; source order after metadata and before controls; no false content/gap;
- existing static/selectable/selected/blank-id states, controlled selection, one pointer/Enter/
  Space activation, repeated-key suppression, exact frozen `{ id }`, bubbles/composed true,
  cancelable false, zero nested-control activation and zero non-actionable tab stop in both layouts;
- `pulsing` absent/false, attribute/property reflection, post-upgrade toggle and property-before-
  upgrade true/false; assigned-marker versus empty-marker behavior; unchanged text/tone; multiple
  hosts with independent state.

Requirements: FR-001–FR-012, FR-020–FR-023; NFR-003–NFR-006; C-013–C-015; NI-001, NI-003–NI-004,
NI-007–NI-008.

## T002 — Implement action-row layout and supporting projection

Add the exact public property `layout: 'card' | undefined` using the element's established reflected
property/validation style. Only `card` is accepted. Omitted and empty values keep the prior row
presentation; an unsupported nonblank value warns and fails open without blanking the shadow tree
or losing any projection.

Add one stable wrapper and named slot in this fixed source order:

```text
primary trigger: marker → title → reference → tags → metadata → supporting
independent sibling: controls
```

Follow the repository's slot-presence listener pattern. The wrapper always exists and always keeps
`part="supporting"`, is hidden with no assigned content, appears when assigned, hides on removal and
appears on reassignment. It must not add a role/live region or accept actions. Do not use CSS
`order`; visible and assistive-technology order must match DOM order.

Author token-only `.sk-action-row--card` presentation in the existing stylesheet. Reflow the same
tree as a compact vertical summary. Preserve focus visibility and contain long title/unbroken
reference/sparse combinations at 220px, an intermediate width and 360px. No marker, tags,
supporting content or controls must leave false rows or collisions. Keep default selectors and
rendering unchanged. Enforce NI-002 directly: this modifier creates no element, semantic card
contract, status axis or domain model.

Turn the T001 action-row cases green with the smallest change, then run the full existing action-row
fixture to prove activation/selection regressions were not hidden.

Requirements: FR-001–FR-012; NFR-002–NFR-004, NFR-007; C-001–C-004, C-008, C-013, C-015, C-017;
SC-002–SC-003; NI-001–NI-004, NI-011–NI-012.

## T003 — Implement marker-only pulsing presentation

Add reflected boolean `pulsing = false` with ordinary Lit property semantics. Do not create a
lifecycle controller. Reuse the existing marker-slot presence seam so `pulsing` with an empty slot
cannot synthesize a dot or occupy marker space.

In the authored stylesheet, animate only `.sk-status-indicator__marker` for a pulsing host. Text
must have no animation, replacement or visibility change. Instances may share CSS keyframes but no
JS phase/state. Under `prefers-reduced-motion: reduce`, remove animation and retain a static,
token-backed marker emphasis that differs observably between pulse-on and pulse-off. Under
`forced-colors: active`, keep a system-perceivable marker distinction for every existing tone and
an author-owned non-color observable—such as border/outline style or width—that differs between
pulse-on and pulse-off without disabling forced-color adjustment. UA color remapping or unchanged
current styling alone is not evidence.

Turn all T001 status cases green. Add direct computed-style/source assertions for marker-only
scope, absence of JS timers/subscriptions, empty-slot behavior and six-tone preservation. Assert a
differential pulse-on versus pulse-off static emphasis under reduced motion and a differential
author-owned non-color observable under forced colors. Preference emulation is finalized in T015;
do not use a decoy story class, UA remap or the current unmodified style as proof.

Requirements: FR-020–FR-023; NFR-004, NFR-007–NFR-008; C-006–C-008, C-014–C-015; SC-005;
NI-001, NI-007–NI-008, NI-011–NI-012.

## T004 — Focused stories and T10 composition structure

Keep every existing default story behavior and export intact. Add focused exports equivalent to:

- action row: `CardStates`, `CardLongContent`, `T10CompactItem`,
  `T10CompactItemLightMode`;
- status indicator: `PulsingStates`, `MultiplePulsingAllTones`, `PulsingPreferences`,
  `PulsingLightMode`.

Exercise static/selectable/selected/sparse/nested-control rows, supplied live/stale supporting text,
long title/reference, pulse off/on, no marker, all six tones and several simultaneous instances.
The T10 story may already compose the forthcoming marker `size="sm" shape="circle"` attributes;
WP02 makes those axes active, and WP03 verifies the final composition. Stories supply all content
and state. Every light variant uses a real `.sk-light` wrapper and produces a computed token delta.
Preference stories are illustrative only and must not pretend a CSS class changes media state.

Do not edit `expected-stories.json` here; WP03 owns the collision-prone ratchet and registers every
new story once after all authored story files are stable.

Requirements: FR-003–FR-004, FR-008–FR-012, FR-021–FR-023, FR-028; NFR-001–NFR-004,
NFR-007–NFR-008; SC-002–SC-003, SC-005, SC-007, SC-009.

## T005 — Prove the limited ADR-11 mutations red-first

Do not edit `mutations.json`; WP03 is its sole writer. In a disposable copy or by one reversible
source edit at a time, prove exactly three future arms against the actual named registry tests:

1. SC-010: break only `layout` property-before-upgrade preservation.
2. SC-010: break only `pulsing` property-before-upgrade preservation without changing tone.
3. SC-013: remove only `part="supporting"` while leaving its wrapper and projection intact.

For each, capture source file, exact unambiguous `from`/`to`, subject fixture, named `[SC-010]` or
`[SC-013]` test, failing command/output and restored-green command. The intended test must fail and
there must be zero unexplained behavior-test collateral. Reflection, unsupported-layout fail-open,
supporting slot projection/source order, pulse preferences and marker-slot presence are direct
tests, not registry behavior. Do not add SC-011 or any slot-misroute arm. Hand exactly these three
records to WP03 for one-time central persistence.

Requirements: FR-001, FR-005, FR-020, FR-029; NFR-005; C-015; SC-002, SC-005, SC-010.

## T006 — Owned generation, focused green and scope audit

Regenerate the two owned CSS module pairs from authored styles:

```bash
node scripts/build-elements-css.mjs
node scripts/build-elements-css.mjs --check
npx vitest run --project browser \
  fixtures/elements-behaviour/src/sk-action-row.test.ts \
  fixtures/elements-behaviour/src/sk-status-indicator.test.ts
node scripts/typecheck-all.mjs
npm run quality:stylelint
npm run quality:lint
node scripts/build-storybook-with-budget.mjs
```

Run any narrower recipe/source-CSS/adopted-sheet/part checks that touch these surfaces. Confirm the
generated bytes are reproducible and only the two owned CSS module pairs changed. Central manifest,
wrappers, Vue declarations, ratchets and mutation registry intentionally remain WP03's integration
surface.

For each owned element, derive the exact unique `--sk-*` references from its authored stylesheet
and compare them as a set with the existing `Token dependencies:` JSDoc on its element class. Update
the action-row and status-indicator comments so there are no missing, stale or duplicate names. Use
the existing comments only; create no token file and add no token. Record both derived CSS sets and
the reconciled documented sets as review evidence.

The Storybook build is a focused smoke that the affected stories compile and render into the bundle
without central ratchet changes. Do not run the full all-story axe or visual-baseline workflow here:
those would assess intentionally stale shared story ratchets. T016 owns those gates after WP03 has
registered every story and generated the coherent mission.

Audit the diff and tests for every hard boundary: no new element/package/token/tone; no semantic
card or app state; no timer/subscription; no host `tabindex`; no event or selected-state drift; no
raw design value/cross-shadow selector; no generated file hand edit. Use the supported Spec Kitty
evidence surface to record red/green commands and the exact clean handoff. Leave only owned changes.

## Review handoff

Submit WP01 for independent read-only review. A rejection names severity, file/line, explanation
and recommendation; fold it before resubmission. An intermediate `approved` verdict confirms
T001–T006, token-list reconciliation, the Storybook smoke, limited mutation handoff and disjoint
owned-file set, and permits WP02 to begin. WP01 MUST remain not `done`; no WP transitions to `done`
until WP03 has run the coherent mission's full Storybook, axe and visual gates. The programme
orchestrator, not this worker, owns GitHub, PR, CI, merge, issue and epic updates.

## Activity Log

- 2026-09-07 — Authored during the Spec Kitty tasks phase; implementation unclaimed.
