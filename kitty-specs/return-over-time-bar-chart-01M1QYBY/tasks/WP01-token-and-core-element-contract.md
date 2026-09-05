---
work_package_id: WP01
title: Semantic tokens and core bar-chart contract
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
- FR-017
- FR-018
- FR-019
- FR-020
- FR-024
- NFR-001
- NFR-003
- NFR-005
- NFR-008
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
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - Token and element foundation
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
- expected-parts.json
- behaviours.json
- mutations.json
tags:
- component
- tokens
- accessibility
tracker_refs:
- '#148'
---

# WP01 — Semantic tokens and core bar-chart contract

Build the non-interactive foundation for `<sk-bar-chart>`: exact public data contract, semantic
tokens, fail-closed validation, accessible ordered text, proportional SVG geometry, empty/error
states, distribution entries, and generated-sheet identity. Do not implement selectable buttons
or Storybook/browser interaction coverage in this package.

## Pre-claim topology guard (orchestrator-owned)

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
`origin/train/elements-first` at `dcf7af2`. Reuse its generic property-only conventions without
copying or specializing them. This slice is independently reviewable because it does not own or
need to reconcile CEM, React, Vue, `expected-docs.json`, or SIZES; WP03 owns those final shared
outputs after all authored source is complete.

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
- event cancelability is resolved but selection behavior belongs to WP02.

## Subtasks

### T001 — Write failing validation and geometry tests first

Create `fixtures/elements-behaviour/src/sk-bar-chart.test.ts` with load-bearing assertions for the
complete empty/invalid/valid table, exact approved ratios, close/equal/zero values, source order,
an extreme-range series with a tiny valid magnitude beside the maximum, verbatim formatted text,
and valid→invalid→valid replacement. Demonstrate direct source breaks for the ratio formula and
full-series fail-closed branch, then restore the source and preserve the exact failing command,
named assertion/output, restoration, and green rerun in implementation evidence.

### T002 — Add semantic token aliases and theme proof

Add exactly `--sk-color-data-series-primary`, `--sk-color-data-grid`, and
`--sk-color-data-baseline` to both the default and `.sk-light` token blocks using the aliases fixed
in the plan. Regenerate `packages/tokens/dist/token-catalogue.json`. Add a computed-style test that
proves the resolved dark/light values differ and remain contrast-appropriate; a merely non-empty
value does not satisfy the test. Assert the rendered series fill, grid stroke, and baseline stroke
equal their corresponding computed semantic tokens and that series fill differs from gold/focus.
Temporarily swap each binding and remove the `.sk-light` alias to record load-bearing source-break
failures, then restore and rerun. Gold may appear only through the existing focus token.

### T003 — Author the token-only stylesheet

Create the single source `packages/styles/src/bar-chart/sk-bar-chart.css`. It must render the named
chart, plot, items, persistent labels/values, baseline/grid, bars, empty/unavailable surface, and
reduced-motion behavior using only `--sk-*` values. There are no component CSS theme selectors,
raw design values, runtime-generated styles, or duplicated static markup.

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

### T006 — Register truthful ADR/API ratchets

Add `sk-bar-chart` as an SC-010, SC-013, and SC-014 subject for the WP01 fixture. Register exactly
four named, semantically active mutation arms: one for SC-010, one for SC-013, and two for SC-014
that independently break adopted-sheet length and generated-sheet identity. Register all seven
parts in `expected-parts.json` with element-specific external targetability tests. Do not touch the
docs ratchet in this slice, claim event IDs before WP02, or claim SC-009/SC-012.

### T007 — Verify this slice

Run the focused fixture, token catalogue generation/check, CSS generation/check, source-level
element type/lint, parts, entries, release graph, CSS boundaries/hygiene, and all four WP01 mutation
arms. Do not run or require CEM/React/Vue generation/check, manifest-content/docs drift, or SIZES
reconciliation for WP01 acceptance; those intentionally wait for WP03. End with a clean
WP01-owned diff and no generated output edited by hand.

## Acceptance checklist

- Approved 320/510/440/604 data has exact `value / 604` geometry and verbatim ordered text.
- Close, equal, zero, all-zero, extreme-range, empty, malformed, replacement, and display-only
  cases are proven.
- Both themes resolve the three documented semantic aliases; rendered series/grid/baseline nodes
  consume the exact roles and default series is not gold.
- Presentational rendering contains zero buttons/tab stops/events even if `selectedId` is set.
- Seven public parts are present/targetable; grid/baseline internals remain private.
- Four WP01 mutations—one SC-010, one SC-013, SC-014 sheet length, and SC-014 sheet identity—each
  turn their named assertion red and return green when restored.
- No #149 generator change, Team Kitty logic, formatter, second series, static form, or app state is
  introduced.
