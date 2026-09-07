---
work_package_id: WP01
title: Complete authored bar-chart and browser contract
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
- FR-013
- FR-014
- FR-015
- FR-016
- FR-017
- FR-018
- FR-019
- FR-020
- FR-021
- FR-024
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
planning_base_branch: mission/return-over-time-bar-chart
merge_target_branch: mission/return-over-time-bar-chart
branch_strategy: Planning artifacts for this mission were generated on mission/return-over-time-bar-chart. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/return-over-time-bar-chart unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-return-over-time-bar-chart-01M1QYBY
base_commit: e008ce13b9bc6ca2ba72d348b3ebfabba07b4a0f
created_at: '2026-09-06T18:58:59.808921+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
- T011
- T012
- T013
phase: Phase 1 - Complete authored component and browser conformance
history:
- timestamp: '2026-09-05T07:30:00Z'
  agent: codex
  action: Prompt authored from the approved specification and plan
authoritative_surface: packages/elements/src/bar-chart/sk-bar-chart.ts
create_intent:
- packages/styles/src/bar-chart/sk-bar-chart.css
- packages/elements/src/bar-chart/sk-bar-chart.ts
- packages/elements/src/bar-chart/sk-bar-chart.css.js
- packages/elements/src/bar-chart/sk-bar-chart.css.d.ts
- fixtures/elements-behaviour/src/sk-bar-chart.test.ts
- packages/elements/src/bar-chart/sk-bar-chart.stories.ts
- apps/storybook/src/tests/sk-bar-chart.spec.ts
execution_mode: code_change
owned_files:
- packages/tokens/src/tokens.css
- packages/tokens/dist/token-catalogue.json
- packages/styles/src/bar-chart/sk-bar-chart.css
- packages/styles/package.json
- packages/elements/src/bar-chart/sk-bar-chart.ts
- packages/elements/src/bar-chart/sk-bar-chart.css.js
- packages/elements/src/bar-chart/sk-bar-chart.css.d.ts
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- fixtures/elements-behaviour/src/sk-bar-chart.test.ts
- packages/elements/src/bar-chart/sk-bar-chart.stories.ts
- apps/storybook/src/tests/sk-bar-chart.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- expected-parts.json
- expected-stories.json
tags:
- component
- tokens
- accessibility
- interaction
- storybook
tracker_refs:
- '#148'
---

# WP01 — Complete authored bar-chart and browser contract

Build the complete authored `<sk-bar-chart>` contract: exact public data, semantic tokens,
fail-closed validation, accessible ordered text, proportional SVG geometry, controlled optional
selection, all stories, cross-browser evidence, visual scenarios, distribution entries, and final
CSS modules. Shared behavior/mutation registries and CEM/React/Vue/docs/SIZES remain exclusively
with dependent WP03, so the two active packages have no overlapping owned files.

## Pre-claim topology guard (orchestrator-owned)

The acceptance-matrix capability gap was resolved on 2026-09-06 through the operator's explicit
authorization for a governed out-of-band schema migration/write. The materialized acceptance
matrix contains every FR/NFR/C criterion plus lane and terminal ownership, and the issue matrix
contains complete metadata. Every result remains pending until its evidence exists. Require the
recorded successful task re-finalization before claim; do not substitute this prompt for the
materialized matrices.

Before the first WP is claimed, the orchestrator fetches `origin`, checks out and requires a clean
planning target `mission/return-over-time-bar-chart`, rebases it onto latest
`origin/train/elements-first`, normalizes the human-authored planning range to repository-valid
conventional history, and reruns
`spec-kitty agent mission finalize-tasks --mission return-over-time-bar-chart-01M1QYBY --json` so
`lanes.json.planning_commit_sha` follows the final pre-execution lineage. It then invokes the normal
`spec-kitty agent action implement WP01 --mission return-over-time-bar-chart-01M1QYBY --agent
<dispatched-agent>` action, which creates the fresh `lane-a` worktree/branch from the updated
target/default mission lineage. Do not use compatibility `spec-kitty implement --base`. The WP01
worker verifies the resulting workspace ancestry and does not perform this planning-target rebase.

## Satisfied foundation

PR #171 is merged as `8e654e8`, and the mission is rebased onto
`origin/train/elements-first` at `0fde2ab`. Reuse its generic property-only conventions without
copying or specializing them. This slice is independently reviewable because it completes all
authored component/browser surfaces but does not own or need to reconcile behavior/mutation
registries, CEM, React, Vue, `expected-docs.json`, or SIZES; WP03 owns those final shared outputs
after authored source is frozen.

## Governing contract

Read the mission `spec.md`, `plan.md`, `data-model.md`, ADR-9/10/11, and
`docs/contributing/adding-a-component.md` before editing. The plan's public API, validation table,
three token names, and seven parts are fixed. In particular:

- `series` uses the literal handshake `series: ReadonlyArray<BarDatum> = Object.freeze([])` with
  `{ attribute: false }`; an equivalent shared constant does not satisfy #171's reset-marker parser.
- `label`, `description`, `selectable`, and `selected-id` are the only attributes; methods are zero.
- invalid data rejects the entire series; formatted text is never parsed; input order is preserved.
- ratio is exactly `maximum === 0 ? 0 : value / maximum` and is delivered as numeric SVG
  `y`/`height`, never as a dynamic inline style.
- the SVG is supplementary/`aria-hidden`; visible native list text owns each label/value meaning.
- no `.markup.ts` or static HTML is created for this structured-data element.
- selection is controlled and non-cancelable; the implementation and browser evidence belong to
  T008–T013 in this same package.

## Subtasks

### T001 — Write failing validation and geometry tests first

Create `fixtures/elements-behaviour/src/sk-bar-chart.test.ts` with load-bearing assertions for the
complete empty/invalid/valid table, exact approved ratios, close/equal/zero values, source order,
an extreme-range series with a tiny valid magnitude beside the maximum, verbatim formatted text,
and valid→invalid→valid replacement. Include untrusted label
`<img src=x onerror="globalThis.__skBarChartProbe=1"> & "label"` and display value
`<script>globalThis.__skBarChartProbe=2</script> £510`; assert their exact `textContent`, no
input-created descendant elements/attributes, an unchanged probe sentinel, and no DOM, script, or
resource-load side effect. Demonstrate direct source breaks for the ratio formula and
full-series fail-closed branch, then restore the source and preserve the exact failing command,
named assertion/output, restoration, and green rerun in implementation evidence.

### T002 — Add semantic token aliases and theme proof

Add exactly `--sk-color-data-series-primary`, `--sk-color-data-grid`, and
`--sk-color-data-baseline` to both the default and `.sk-light` token blocks using the aliases fixed
in the plan. Run `npx nx run tokens:catalogue --skip-nx-cache` exactly once after the source edit; this is the
execution lane's sole timestamp-writing catalogue generation. Add a computed-style test that
proves the resolved dark/light values differ and remain contrast-appropriate; a merely non-empty
value does not satisfy the test. In the same standing fixture, inspect the raw
`packages/tokens/src/tokens.css` source and assert that each semantic alias is declared exactly once
inside the default block and exactly once inside the `.sk-light` block, with the exact prescribed
alias target. Assert the rendered series fill, grid stroke, and baseline stroke equal their
corresponding computed semantic tokens and that series fill differs from gold/focus. Temporarily
swap each rendered binding and delete each `.sk-light` declaration in turn: binding changes must
fail the computed assertion, while light-declaration deletion must fail the named source-structural
assertion even if inherited computed styles would otherwise remain green. Restore every mutation
and rerun. Gold may appear only through the existing focus token.

### T003 — Author the token-only stylesheet

Create the single source `packages/styles/src/bar-chart/sk-bar-chart.css`. It must render the named
chart, plot, items, persistent labels/values, baseline/grid, bars, empty/unavailable surface, and
reduced-motion behavior using only `--sk-*` values. Focus must have an outline-based treatment that
survives `forced-colors: active` and remains distinguishable from selected shape/border state in
both themes; it may not rely on fill/background/color alone. There are no component CSS theme
selectors, raw design values, runtime-generated styles, or duplicated static markup.

### T004 — Implement the pure render model

Create `packages/elements/src/bar-chart/sk-bar-chart.ts` with documented exported `BarDatum` and
`BarChartSelectDetail`, the exact reactive fields/defaults, whole-series validation, ratio
derivation, ordered native list, visible text, `aria-hidden` SVG geometry, generic empty/unavailable
copy, and all seven plan-defined parts. Keep consumer objects immutable and avoid storing derived
application-like state.

### T005 — Register and distribute through the landed seam

Register via guarded `define('sk-bar-chart', SkBarChart)`, export class/types/generated sheet from
`packages/elements/src/index.ts`, and append the side-effect import to `elements.ts`. Generate the
CSS JS/declaration from the styles source. Do not modify the generic manifest normalizer,
React/Vue generators, property reset hook, or other #149-owned mechanism. Add the required
`./bar-chart/*` subpath to `packages/styles/package.json` and prove the release graph resolves it.
CEM and framework projections remain untouched until WP03.

### T006 — Author core ADR assertions and the parts ratchet

Add standing fixture assertions that will support the final SC-010, SC-013, and SC-014 registry
pairs. Demonstrate and record direct source breaks for pre-upgrade property delivery, part
targetability, adopted-sheet length, and generated-sheet identity; the last two remain independent
arms. Register all seven parts in `expected-parts.json` with element-specific external
targetability tests. Do not write `behaviours.json` or `mutations.json`: WP03 is their only owner and
will register these already-proven assertions after the authored source is frozen. Do not touch the
docs ratchet or claim SC-009/SC-012.

### T007 — Verify the core checkpoint before interaction work

Run the focused fixture, the plan's non-writing full source-to-catalogue comparison that ignores
only `generated_at`, CSS generation/check, source-level element type/lint, parts, entries, release
graph, and CSS boundaries/hygiene. Preserve the four named source-break transcripts from T006. Do
not rerun the timestamp-writing catalogue generator after T002, write shared behavior/mutation
registries, or run CEM/React/Vue generation/check, manifest-content/docs drift, or SIZES
reconciliation. This is an internal red/green checkpoint inside WP01, not a review handoff.

## Binding event decision

`sk-bar-chart-select` is non-cancelable. Dispatch exact readonly `{ id: string }` detail with
`bubbles: true`, `composed: true`, and `cancelable: false`. Do not add a fake internal default
action, preventDefault branch, hidden selection, scroll, focus shift, or animation to recreate the
superseded issue wording. SC-009 is inapplicable.

### T008 — Extend failing interaction tests first

Extend the element fixture with controlled projection, unknown/removed IDs, `selectable=false`
despite a matching ID, stale input replacement, exact event count/detail/flags, and unchanged
`selectedId` after activation. Demonstrate a direct source break that mutates `selectedId`
internally and prove the test fails before restoring it.

### T009 — Implement the single native activation path

When selectable, render one `button type="button"` as each datum's ownership surface and dispatch
from its click handler only. Pointer, Enter, and Space rely on native click synthesis for the first
activation. Add a non-dispatching `keydown` guard that prevents the default action for repeated
Enter/Space keydowns, since held Enter can synthesize repeated clicks in Chromium; do not add a
keydown dispatch path. Reflect the consumer's current selection through `aria-pressed` and a
shape/border state. When not selectable, render no interactive element or interaction styling.

### T010 — Complete element behavior assertions and source-break proof

Add standing fixture assertions for the future SC-006, SC-007, and SC-008 pairs: exact-once
delivery, exact `{ id }` detail, and bubbling/composed boundary behavior. Demonstrate one
semantically active source break for each and confirm the intended named assertion—not an earlier
unrelated assertion—turns red. Preserve the T006 SC-010/013/014 assertions and transcripts. Do not
write the shared registries; WP03 will register these seven element arms together with two React
arms as the sole registry writer after all relevant tests exist.

### T011 — Add all eight required stories and story ratchet

Create `Default`, `CloseValues`, `ZeroValues`, `Empty`, `LongLabels`, `ControlledSelection`,
`SelectableStates`, and `LightMode`. Use the approved four-value fixture and `.sk-light` exactly;
enable axe on every story. The controlled story may keep minimal local story state only to
demonstrate the consumer loop, and must call a `storybook/test` action spy with every emitted typed
detail so the intent appears in the Actions panel without a new dependency. Add a Storybook `play`
assertion, or equivalent standing story test, that activates a datum and proves the named spy
received exact `{ id }`. Default and LightMode must use identical approved data/metadata so a
browser assertion can compare the entire semantic signature before checking color variance. Keep
the markup-significant literal-text case in the dedicated element fixture from T001. Register all eight generated story IDs in
`expected-stories.json`.

### T012 — Prove accessibility, input parity, themes, and narrow ownership

Create `apps/storybook/src/tests/sk-bar-chart.spec.ts` as a shared Chromium, Firefox, and WebKit
contract. Lane approval runs it only in the locally available Chromium and Firefox projects with
`npx playwright test --project=chromium --project=firefox`; the final exact-head PR CI owns the
required WebKit run. No repository-named WebKit container seam exists at planning head, so do not
invent or install one. If such a named seam genuinely lands before execution, cite its repository
command/provenance and treat a local WebKit run as additive evidence only. Prove:
pointer/Enter/Space emit byte-equivalent single events; held-key repeat adds none; presentational
mode adds no tab stop; the chart's accessible name/description and ordered list/button text are
available while SVG geometry is suppressed from announcement; and real rest/hover/keyboard-focus/
pointer-active/selected/nonselectable states have the required programmatic state and non-color
computed-style deltas. Before any theme-color assertion, capture and compare Default/LightMode
semantic signatures containing exact ordered text, roles, parts, datum order, label/value/bar
ownership, and all relevant ARIA relationships; the signatures must be identical. In both stories,
use `page.emulateMedia({ forcedColors: 'active' })` and prove outline-based keyboard focus, distinct
controlled selection, literal label/value text, bar ownership, and chart/baseline recoverability.
Temporarily remove/neutralize the forced-colors focus outline, require the named dark/light
forced-colors assertion to fail, restore the source, and rerun green. Assert reduced motion disables
every incidental transition. At 390×844,
prove every label/value/bar remains inside its own item before and after horizontal scrolling with
no page-level overflow or cross-item hit target. Temporarily break theme resolution, reduced
motion, and item ownership in turn; record the exact failing command/assertion/output, restore,
and rerun green.

### T013 — Add visual scenarios, finalize authored CSS, and hand off WP01

Extend `visual.spec.ts` with stable component crop definitions for approved dark, LightMode,
narrow, zero/empty, and selectable states. WP01 acceptance covers executable scenario definitions
only; it neither owns snapshot bytes nor claims final visual acceptance. Mission wrap-up after WP03
approval exclusively owns the missing-baseline CI run, exact-byte snapshot commit, visual
disposition, and fresh-green-CI loop.

After the final authored change to `packages/styles/src/bar-chart/sk-bar-chart.css`, run
`node scripts/build-elements-css.mjs` and `node scripts/build-elements-css.mjs --check`; commit the
resulting `.css.js` and `.css.d.ts` with this package. Then run axe with non-empty load enforcement
and the non-visual Playwright directory in Chromium and Firefox using the exact project-filtered
command from T012. Record the exact clean WP01 `lane-a` head, move
WP01 through independent review, and expose only its approved tip to Spec Kitty's dependent-lane
allocator for WP03. There are no shared implementation files to negotiate: WP03's
behavior/mutation registry, generated integration, docs, wrapper, and CI ownership is disjoint from
WP01's authored surface.

## Acceptance checklist

- Approved 320/510/440/604 data has exact `value / 604` geometry and verbatim ordered text; close,
  equal, zero, all-zero, extreme-range, empty, malformed, replacement, display-only, and
  markup-significant literal-text/no-descendant/no-side-effect cases pass.
- Both themes resolve the three documented semantic aliases; one exact declaration per alias exists
  in each theme block, every deletion is load-bearing, and default series is not gold.
- Pointer, Enter, and Space each produce one identical typed, bubbling, composed, non-cancelable
  event with no repeat duplicate and no `selectedId` mutation.
- Presentational mode has no tab stops/events/interactive visual state; focus and selection use
  programmatic state plus non-color shape/border differences. Default and LightMode have identical
  ordered semantic signatures before themed color variance; both retain outline focus, distinct
  selection, and chart meaning under forced colors, with recorded focus-outline source-break proof.
- All eight stories are ratcheted, load non-empty, pass axe, and expose the asserted action spy.
- The shared three-project browser contract covers semantics, interaction states, themes, forced
  colors, reduced motion, and 390×844 ownership/overflow; Chromium and Firefox are green locally,
  while WebKit remains an explicit exact-head PR CI obligation rather than a lane-approval deadlock.
- Seven public parts are present/targetable; grid/baseline internals remain private; generated CSS
  JS/declaration are current after the final authored CSS change.
- All seven planned element behavior arms have named standing assertions and red/green source-break
  transcripts ready for WP03's exclusive registry integration.
- The clean handoff contains no behavior/mutation registry, CEM/React/Vue/docs/SIZES, CI workflow,
  wrapper, snapshot-byte, Team Kitty, formatter, second-series, static-form, or app-state change.

## Activity Log

- Pending implementation.
- 2026-09-06T20:01:59Z – codex – Cycle 1 bookkeeping audit: baseline-tests.json truthfully records the automatic gate-coverage adapter failure (pytest 0/1 because no JUnit XML was produced), not repository test results. The first for_review pre-review event truthfully records no_coverage because tests.architectural._gate_coverage is absent. These historical records are not rewritten or relabelled. Direct implementation verification is recorded separately with exact commands and counts.
- 2026-09-06T20:03:58Z – codex – Cycle 1 source-break evidence — ratio and whole-series validation. Failing command: npx vitest run --project=browser fixtures/elements-behaviour/src/sk-bar-chart.test.ts. Replacing datum.value / chart.maximum with a denominator incremented by one made the named numeric SVG geometry assertion report off-by-one-denominator ratios. Removing duplicate-ID rejection made the named empty and malformed fail-closed assertion expect 0 items but receive 2. Each mutation was restored. Green restoration command: npx vitest run --project=browser; 33 files and 343/343 tests passed, including all 15 bar-chart tests.
- 2026-09-06T20:03:59Z – codex – Cycle 1 source-break evidence — SC-010, SC-013 and SC-014. Failing command: npx vitest run --project=browser fixtures/elements-behaviour/src/sk-bar-chart.test.ts. A temporary firstUpdated series reset made SC-010 expect the pre-upgrade approved series but receive an empty array. Removing part=chart made SC-013 report the declared chart part absent; forcing the internal outline solid made its external targetability assertion expect dashed but receive solid. Adding a second adopted sheet made SC-014 expect length 1 but receive 2; replacing the sole sheet with a new sheet preserved length 1 but failed identity. Every source break was restored. Green restoration command: npx vitest run --project=browser; 343/343 passed.
- 2026-09-06T20:04:01Z – codex – Cycle 1 source-break evidence — controlled non-mutation and event contract. Failing command: npx vitest run --project=browser fixtures/elements-behaviour/src/sk-bar-chart.test.ts. Writing selectedId during activation made the controlled projection assertion expect aug-18 but receive aug-25. Dispatching twice made SC-006 expect one record but receive two. Adding an extra detail key failed SC-007 exact-detail equality. Setting composed false made SC-008 receive no event at the document boundary. Each mutation was restored. Green restoration command: npx vitest run --project=browser; 343/343 passed.
- 2026-09-06T20:04:02Z – codex – Cycle 1 source-break evidence — theme parity and semantic token bindings. Vitest failing command: npx vitest run --project=browser fixtures/elements-behaviour/src/sk-bar-chart.test.ts. Swapping the series fill, grid stroke and baseline stroke away from their respective semantic aliases independently failed the named computed-binding assertions. Deleting each light-theme alias independently made the structural assertion expect two split segments and receive one. Playwright failing command: npx playwright test apps/storybook/src/tests/sk-bar-chart.spec.ts --project=chromium --project=firefox; replacing the sk-light wrapper class made the named Default/LightMode assertion receive equal themed page values. Every break was restored. Green restoration: browser Vitest 343/343 and Playwright 154/154.
- 2026-09-06T20:04:03Z – codex – Cycle 1 source-break evidence — forced colors, reduced motion and narrow ownership. Failing command: npx playwright test apps/storybook/src/tests/sk-bar-chart.spec.ts --project=chromium --project=firefox. Neutralizing the forced-colors focus outline made the named dark/light assertions expect solid but receive none. Reintroducing the component transition under reduced motion failed the assertion requiring zero-duration/none. Giving a label an oversized inline width made the named 390px ownership assertion receive false. Each change was restored. Green restoration command: the same Playwright command; 154/154 passed.
- 2026-09-06T20:04:04Z – codex – Review-cycle-1 red-first evidence — containment, presentational overflow and canonical focus. Failing command: npx playwright test apps/storybook/src/tests/sk-bar-chart.spec.ts --project=chromium --grep "vertically contained|focus-border token|presentational long-label". The vertical assertion received SVG bottom 343 versus required label boundary 111.5; LightMode focus received rgb(61, 122, 61) versus canonical rgb(245, 197, 24); presentational overflow received visible versus required auto. After sizing the SVG row, containing geometry, moving the baseline inside the viewBox, making plot overflow unconditional, and using --sk-border-focus, Storybook was rebuilt. Green restoration command: the same filtered Playwright command; 4/4 passed.
- 2026-09-06T20:09:13Z – codex – Evidence precision correction: the individual historical source-break grep filters were not durably captured. The recorded Playwright test-file/project surface and named observed failures are factual, but those entries do not claim that the complete 166-test browser suite ran red for each controlled mutation. Complete-suite counts apply only to restored-source verification.
- 2026-09-06T20:14:51Z – codex – Cycle 1 restored-source verification: Vitest browser 343/343; Playwright Chromium+Firefox 166/166; focused vertical containment/focus-token/presentational-overflow Playwright 12/12; axe 260/260 rendered stories with zero WCAG 2.1 AA violations; typecheck-all 5/5; quality:all 0 errors; generated CSS, entry, release graph, adopted-CSS boundary, CSS hygiene, theme-wrapper, part-ratchet, and git diff checks all passed.
