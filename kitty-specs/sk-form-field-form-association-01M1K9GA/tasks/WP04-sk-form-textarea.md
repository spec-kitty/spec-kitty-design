---
work_package_id: WP04
title: sk-form-textarea, and the shared sheet the second element finally justifies
dependencies:
- WP03
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-009
planning_base_branch: mission/sk-form-field-form-association
merge_target_branch: mission/sk-form-field-form-association
branch_strategy: Planning artifacts for this mission were generated on mission/sk-form-field-form-association. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-form-field-form-association unless the human explicitly redirects the landing branch.
subtasks:
- T011
- T012
- T013
phase: Phase 4 - Second element
history:
- timestamp: '2026-09-03T11:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/form-textarea/sk-form-textarea.ts
create_intent:
- packages/elements/src/form-textarea/sk-form-textarea.ts
- packages/styles/src/form-textarea/sk-form-textarea.css
- fixtures/elements-behaviour/src/sk-form-textarea.test.ts
- packages/styles/src/form-input/sk-form-input.css
execution_mode: code_change
owned_files:
- packages/elements/src/form-textarea/sk-form-textarea.ts
- packages/styles/src/form-textarea/sk-form-textarea.css
- packages/styles/src/form-input/sk-form-input.css
- fixtures/elements-behaviour/src/sk-form-textarea.test.ts
- behaviours.json
- mutations.json
tags: []
tracker_refs: []
---

# WP04 — `sk-form-textarea`, and the sharing question answered by having two

**This is where the shared sheet becomes justifiable.** Extracting a base from one consumer is
generalising from one; WP01 deliberately shipped `form-input/` alone.

`.sk-input` and `.sk-textarea` differ in exactly **two** declarations — `min-height` and
`resize` — so two independently authored sheets are 73% duplicate on day one.

## Subtasks

- **T011** — The shared rules, if adopted, are anchored on **`:host`**:
  `:host .sk-form-control { … }`. Measured — a bare `.sk-form-control` is *rejected* under both
  element names; the `:host` form is *accepted* under both, because a leading `:host` confers
  ownership unconditionally and matches only inside the element's own tree.

  **The two deltas are custom properties, not a later sheet.** `build-elements-css.mjs`'s
  forced-first slot is hardcoded to `sk-<name>.css`, so a shared sheet concatenates **last** and
  overrides the per-element delta; at `(0,2,0)` vs `(0,1,0)` the delta could never override
  anyway. `var(--sk-form-control-min-height, auto)` / `var(--sk-form-control-resize, none)` in
  the shared rule, set per element on `:host`, makes cascade order irrelevant instead of merely
  survivable.

  Probes and floor updated in this commit (WP01 T003).

- **T012** — `sk-form-textarea.ts`, extending the same base, with **its own four anchors** in its
  own file. Shared anchors red both elements and guard 5 rejects them as collateral: measured, 8
  of 37 failing. Per-element anchors: 37/37 clean.

- **T013** — Four more `(id, subject)` pairs and four more mutations, taking the registry to eight
  new pairs. `suite-budget.json` re-checked here too if T010b's headroom was thin.

## Definition of Done

- `npx vitest run` green; `suite-selftest.mjs` green with all eight new mutations named-red and
  **no collateral**; `--selftest` 8/8.
- Both elements reach both distribution entries.
- `check-adopted-css-boundaries.mjs` green for both, `--selftest` at the raised floor.
