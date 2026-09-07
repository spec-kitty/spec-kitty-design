---
work_package_id: WP01
title: Authored time-series contract
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
- NFR-002
- NFR-003
- C-001
- C-002
- C-004
- C-005
- C-006
planning_base_branch: mission/time-series-chart
merge_target_branch: mission/time-series-chart
branch_strategy: Planning artifacts for this mission were generated on mission/time-series-chart. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/time-series-chart unless the human explicitly redirects the landing branch.
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
phase: Phase 1 - Authored contract
history:
- timestamp: '2026-09-07T01:40:00Z'
  agent: claude
  action: Prompt authored from the approved specification and plan
authoritative_surface: packages/elements/src/time-series-chart/sk-time-series-chart.ts
create_intent:
- packages/styles/src/time-series-chart/sk-time-series-chart.css
- packages/elements/src/time-series-chart/sk-time-series-chart.ts
- packages/elements/src/time-series-chart/sk-time-series-chart.stories.ts
- fixtures/elements-behaviour/src/sk-time-series-chart.test.ts
- fixtures/react-consumer/src/sk-time-series-chart.test.tsx
execution_mode: code_change
owned_files:
- packages/tokens/src/tokens.css
- packages/tokens/dist/token-catalogue.json
- packages/styles/src/time-series-chart/sk-time-series-chart.css
- packages/elements/src/time-series-chart/sk-time-series-chart.ts
- packages/elements/src/time-series-chart/sk-time-series-chart.stories.ts
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- fixtures/elements-behaviour/src/sk-time-series-chart.test.ts
- fixtures/react-consumer/src/sk-time-series-chart.test.tsx
- expected-parts.json
- expected-stories.json
- behaviours.json
- mutations.json
- docs/contributing/adding-a-token.md
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – Authored time-series contract

Own every authored file for `<sk-time-series-chart>`. Do not touch anything generated, and do not
touch any file under `packages/elements/src/bar-chart/` or `packages/styles/src/bar-chart/` (C-003).

## T001 — `--sk-chart-*` in both theme blocks

Add the family to `packages/tokens/src/tokens.css`, in the `:root` default block **and** in the
`:root[data-theme="light"], .sk-light` block. Three of the roles must resolve to the same values as
#148's `--sk-color-data-*` aliases so the family genuinely serves both elements (FR-013, D-2 in the
plan). Then `npx nx run tokens:catalogue`, or stylelint fails on the missing entries.

Add the prefix to `docs/contributing/adding-a-token.md`'s category list — the recipe requires it for a
new prefix.

## T002 — The authored stylesheet

`packages/styles/src/time-series-chart/sk-time-series-chart.css`. Rules:

- `:host { display: block }` — a custom element defaults to `display: inline` and a consumer's
  `max-width` is otherwise inert.
- Every selector's **leftmost compound** must be `.sk-time-series-chart…` or `:host` —
  `check-adopted-css-boundaries.mjs` rejects anything else, and it parses a real selector AST.
- No theme selector anywhere. Light variance lives in tokens.
- `@media (prefers-reduced-motion: reduce)` scoped to the exact selector and the exact transitioning
  property this component owns. Never a wildcard.
- `@media (forced-colors: active)`: `background` flattens and `box-shadow` computes away, so the focus
  ring is an `outline`. Use the **longhand** `-color` properties with the system-colour keywords
  already allow-listed in `stylelint.config.mjs`. Never `forced-color-adjust: none`.
- Gap and series treatment must remain distinguishable under that block.

## T003 — Validation and scales

`packages/elements/src/time-series-chart/sk-time-series-chart.ts`. Fail closed exactly as
`sk-bar-chart` does: any malformed input yields one labelled unavailable state, never a partial chart
(FR-012). Validate: non-empty trimmed ids unique **across all series**; finite integer-or-float epoch
timestamps; `value` finite or `null`; non-empty `displayValue` and `label`; `resolution` in
`{raw, hour}`; non-decreasing timestamps within a series.

The **time** extent spans every supplied timestamp including nulls (FR-003). The **value** extent
spans non-null values only. Guard both degenerate cases (single distinct timestamp; single distinct
value) rather than dividing by zero.

No clock, no timer, no fetch, no downsampling, no smoothing (C-001, C-002).

## T004 — Gaps and segments

Split each series into maximal runs of consecutive non-null points; each run is one `<polyline>`, so a
null run is a real break with no vertex at the null timestamp (FR-001). Each maximal null run renders
`part="gap"` — a drawn object, not the absence of one. Where a supplied positive finite `gapThreshold`
is met or exceeded by the run's duration, mark it and emit a visible gap note (FR-002, FR-004). A
threshold that is absent, zero, negative or non-finite annotates nothing.

Segment boundaries are derived from the **supplied** per-point resolution; render a transition marker
where it changes and never rescale the axis for it (FR-008).

## T005 — Published representation and paired table

Render a native `<table>` in the element's own root, one row per point in source order, carrying the
series name, the supplied label, the display string verbatim or the literal `No data`, and the row's
resolution (FR-006, FR-007, FR-008). Reproduce `sk-data-table`'s markup contract: a scroller wrapper
carrying `role="region"`/`aria-label`/`tabindex="0"` **only when it genuinely overflows** (that file's
own measurement: on a non-overflowing scroller the triad is a dead tab stop and a duplicate landmark),
a `<caption>`, `<th scope="col">`, and no reflow of `tr`/`td` at any breakpoint.

The SVG is `aria-hidden="true"` and carries no accessible content.

## T006 — Controlled selection

Activation emits `sk-time-series-chart-select` with a frozen `{ seriesId, pointId }` detail, bubbling,
composed and **cancelable** (FR-010). The element never mutates `selectedId`. Enter, Space and a click
each emit exactly once, and a held key emits once (FR-011). The element's own default action is
scrolling the activated point into view inside its own scroller; `preventDefault()` suppresses exactly
that (plan D-4). Points are focusable only when `selectable`.

## T007 — Export

Export from `packages/elements/src/index.ts` and side-effect import in
`packages/elements/src/elements.ts`. Register through `define()` and carry `@element`,
`@csspart` for every part (tag terminated before any prose), and a typed `@fires`. Document **every**
public reactive property — `check-manifest-content.mjs` refuses an undocumented one.

## T008 — Browser behaviour tests

`fixtures/elements-behaviour/src/sk-time-series-chart.test.ts`. Marked tests for SC-006, SC-007,
SC-008, SC-009, SC-010, SC-013 and SC-014. The `[SC-013]` test **must mount a series with an interior
null run**, or the interpolation arm stays green through a missing part — `sk-card`'s #177 note
records exactly that failure mode. Unmarked tests carry the rest: two disjoint polylines, no vertex at
a null timestamp, leading/trailing nulls preserving the extent, unequal spacing, the all-null series,
the 500-point density case, non-colour differentiation, contrast in both themes, and the authored
reduced-motion/forced-colors rules parsed from the raw CSS.

`[SC-009]` must activate with `element.click()`, not `userEvent.click()`: `userEvent` focuses first
and the browser's own focus-scroll would satisfy the assertion for the wrong reason.

## T009 — React first-render test

`fixtures/react-consumer/src/sk-time-series-chart.test.tsx`, modelled on `sk-bar-chart.test.tsx`:
prove the structured `series` reaches an as-yet-undefined element on first render, that no `series`
attribute is ever set, that identity survives upgrade and re-render, and that removal resets to a
**fresh frozen** empty array (FR-014).

## T010 — Stories

`packages/elements/src/time-series-chart/sk-time-series-chart.stories.ts`. Cover: evenly sampled;
interior null run; leading/trailing nulls; all-null; mixed raw+hour; unequal spacing; 500 points;
multi-series non-colour differentiation; single point; empty; selectable controlled with an action
spy; narrow width. `LightMode` wrapped in `class="sk-light"` — **never** `data-theme="light"`, which
is inert on a wrapper (#93). `a11y: { disable: false }`.

## T011 — Ratchets and registries

- `expected-parts.json`: every `@csspart`, and bump `total`.
- `expected-stories.json`: every story id, and bump `total`.
- `behaviours.json`: `sk-time-series-chart` as a subject of SC-006/007/008/009/010/013/014, with a
  `$comment` note recording why `react-time-series-chart` is **not** declared (plan D-6).
- `mutations.json`: the eight arms of plan D-6, each naming this file as `subject`.

**Re-fetch `behaviours.json` and `mutations.json` immediately before editing them** — a concurrent
mission owns them. On conflict, take the train's version and re-apply the entries programmatically.
