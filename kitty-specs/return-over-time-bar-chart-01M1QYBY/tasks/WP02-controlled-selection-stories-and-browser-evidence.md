---
work_package_id: WP02
title: Controlled selection, stories, and browser evidence
dependencies:
- WP01
requirement_refs:
- FR-011
- FR-012
- FR-013
- FR-014
- FR-015
- FR-016
- FR-017
- FR-019
- FR-021
- FR-024
- NFR-001
- NFR-002
- NFR-004
- NFR-005
- NFR-006
- NFR-010
- C-001
- C-002
- C-004
- C-005
- C-006
- C-011
planning_base_branch: mission/return-over-time-bar-chart
merge_target_branch: mission/return-over-time-bar-chart
branch_strategy: Planning artifacts for this mission were generated on mission/return-over-time-bar-chart. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/return-over-time-bar-chart unless the human explicitly redirects the landing branch.
subtasks:
- T008
- T009
- T010
- T011
- T012
- T013
phase: Phase 2 - Interaction and browser conformance
history:
- timestamp: '2026-09-05T07:30:00Z'
  agent: codex
  action: Prompt authored from the approved specification and plan
authoritative_surface: packages/elements/src/bar-chart/sk-bar-chart.stories.ts
create_intent:
- packages/elements/src/bar-chart/sk-bar-chart.ts
- packages/styles/src/bar-chart/sk-bar-chart.css
- packages/elements/src/bar-chart/sk-bar-chart.css.js
- packages/elements/src/bar-chart/sk-bar-chart.css.d.ts
- fixtures/elements-behaviour/src/sk-bar-chart.test.ts
- packages/elements/src/bar-chart/sk-bar-chart.stories.ts
- apps/storybook/src/tests/sk-bar-chart.spec.ts
execution_mode: code_change
owned_files:
- packages/elements/src/bar-chart/sk-bar-chart.ts
- packages/elements/src/bar-chart/sk-bar-chart.stories.ts
- packages/styles/src/bar-chart/sk-bar-chart.css
- packages/elements/src/bar-chart/sk-bar-chart.css.js
- packages/elements/src/bar-chart/sk-bar-chart.css.d.ts
- fixtures/elements-behaviour/src/sk-bar-chart.test.ts
- apps/storybook/src/tests/sk-bar-chart.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- behaviours.json
- mutations.json
- expected-stories.json
tags:
- interaction
- storybook
- accessibility
- cross-browser
tracker_refs:
- '#148'
---

# WP02 — Controlled selection, stories, and browser evidence

Layer the optional controlled-selection behavior and the complete story/browser evidence onto
WP01. The element remains presentational when `selectable=false`, and even when selectable it emits
intent only: the consumer owns `selectedId`, state transitions, navigation, and actions.

## Binding event decision

`sk-bar-chart-select` is non-cancelable. Dispatch exact readonly `{ id: string }` detail with
`bubbles: true`, `composed: true`, and `cancelable: false`. Do not add a fake internal default
action, preventDefault branch, hidden selection, scroll, focus shift, or animation to recreate the
superseded issue wording. SC-009 is inapplicable.

## Subtasks

### T008 — Extend failing interaction tests first

Add fixture tests for controlled projection, unknown/removed IDs, `selectable=false` despite a
matching ID, stale input replacement, exact event count/detail/flags, and unchanged `selectedId`
after activation. Demonstrate a direct source break that mutates `selectedId` internally and prove
the test fails before restoring it.

### T009 — Implement the single native activation path

When selectable, render one `button type="button"` as each datum's ownership surface and dispatch
from its click handler only. Pointer, Enter, and Space rely on native click synthesis for the first
activation. Add a non-dispatching `keydown` guard that prevents the default action for repeated
Enter/Space keydowns, since held Enter can synthesize repeated clicks in Chromium; do not add a
keydown dispatch path. Reflect the consumer's current selection through `aria-pressed` and a
shape/border state. When not selectable, render no interactive element or interaction styling.

### T010 — Complete the ADR-11 subject and mutations

Add the bar-chart fixture as subject for SC-006, SC-007, and SC-008, with one semantically active
named mutation for exact once/detail/boundary behavior. Keep the WP01 SC-010/013/014 pairs. Do not
claim SC-009 or SC-012. Run each mutation and confirm the intended named assertion—not an earlier
unrelated assertion—turns red. These three arms bring the element total to seven mutations across
six behavior pairs; WP03 later adds the two React arms for a final projected total of nine.

### T011 — Add all eight required stories and story ratchet

Create `Default`, `CloseValues`, `ZeroValues`, `Empty`, `LongLabels`, `ControlledSelection`,
`SelectableStates`, and `LightMode`. Use the approved four-value fixture and `.sk-light` exactly;
enable axe on every story. The controlled story may keep minimal local story state only to
demonstrate the consumer loop, and must call a `storybook/test` action spy with every emitted
typed detail so the intent appears in the Actions panel without a new dependency. Add a Storybook
`play` assertion (or an equivalent standing story test) that activates a datum and proves the named
spy received the exact `{ id }`; rendering a spy without asserting it is not evidence. Register all
eight generated story IDs in `expected-stories.json`.

### T012 — Prove accessibility, input parity, themes, and narrow ownership

Create `apps/storybook/src/tests/sk-bar-chart.spec.ts` for Chromium, Firefox, and WebKit. Prove:
pointer/Enter/Space emit byte-equivalent single events; held-key repeat adds none; presentational
mode adds no tab stop; the chart's accessible name/description and ordered list/button text are
available while SVG geometry is suppressed from announcement; and real rest/hover/keyboard-focus/
pointer-active/selected/nonselectable states have the required programmatic state and non-color
computed-style deltas. Assert reduced motion disables every incidental transition. At 390×844,
prove every label/value/bar remains inside its own item before and after horizontal scrolling with
no page-level overflow or cross-item hit target. Temporarily break theme resolution, reduced
motion, and item ownership in turn; record the exact failing command/assertion/output, restore,
and rerun green.

### T013 — Add visual crops and run the Storybook gates

Extend `visual.spec.ts` with stable component crop definitions for approved dark, LightMode,
narrow, zero/empty, and selectable states. WP02 acceptance covers executable scenario definitions
only; it neither owns snapshot bytes nor claims final visual acceptance. WP03 exclusively owns the
missing-baseline CI run, exact-byte snapshot commit, visual disposition, and fresh-green-CI loop.
After the final WP02 change to `packages/styles/src/bar-chart/sk-bar-chart.css`, run
`node scripts/build-elements-css.mjs` and `node scripts/build-elements-css.mjs --check`; commit the
resulting `.css.js` and `.css.d.ts` with this slice. Then run axe with non-empty load enforcement and
the full non-visual Playwright test directory rather than a hand-maintained subset.

## Acceptance checklist

- Pointer, Enter, and Space each produce one identical event and no key-repeat duplicate.
- Event is typed, bubbling, composed, non-cancelable, and never changes `selectedId`.
- Presentational mode has no tab stops, events, hover/pressed/focus affordance, or selected state.
- Focus and selected states have shape/border plus valid programmatic state and are not color-only.
- Real browser assertions cover accessible description/SVG suppression, hover, keyboard focus,
  pointer active, selected, nonselectable, and reduced-motion behavior in all three engines.
- All eight stories exist in the ratchet, load non-empty, and have zero axe violations.
- 390×844 ownership/overflow assertions pass before and after scrolling in all three browsers.
- Generated bar-chart CSS JS/declaration are refreshed after interaction styling and pass the CSS
  generator check.
- Executable visual scenarios cover the plan-defined states and exclude the out-of-scope card,
  deployment markers, and legend; snapshot-byte acceptance remains wholly in WP03.
