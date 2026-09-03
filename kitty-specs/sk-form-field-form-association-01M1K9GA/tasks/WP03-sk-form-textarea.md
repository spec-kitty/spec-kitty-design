---
work_package_id: WP03
title: sk-form-textarea, and the duplication that turned out to be unavoidable
dependencies:
- WP02
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-009
- FR-012
- FR-013
- NFR-001
- NFR-002
- NFR-004
planning_base_branch: mission/sk-form-field-form-association
merge_target_branch: mission/sk-form-field-form-association
branch_strategy: Planning artifacts for this mission were generated on mission/sk-form-field-form-association. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-form-field-form-association unless the human explicitly redirects the landing branch.
subtasks:
- T010
- T011
- T012
phase: Phase 3 - Second element
history:
- timestamp: '2026-09-03T12:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/form-textarea/sk-form-textarea.ts
create_intent:
- packages/elements/src/form-textarea/sk-form-textarea.ts
- packages/elements/src/form-textarea/sk-form-textarea.css.js
- packages/elements/src/form-textarea/sk-form-textarea.css.d.ts
- packages/styles/src/form-textarea/sk-form-textarea.css
- fixtures/elements-behaviour/src/sk-form-textarea.test.ts
- packages/styles/src/form-input/sk-form-input.css
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- packages/elements/custom-elements.json
execution_mode: code_change
owned_files:
- packages/elements/src/form-textarea/sk-form-textarea.ts
- packages/elements/src/form-textarea/sk-form-textarea.css.js
- packages/elements/src/form-textarea/sk-form-textarea.css.d.ts
- packages/styles/src/form-textarea/sk-form-textarea.css
- packages/styles/src/form-input/sk-form-input.css
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- packages/elements/custom-elements.json
- fixtures/elements-behaviour/src/sk-form-textarea.test.ts
- behaviours.json
- mutations.json
- expected-parts.json
- suite-budget.json
- scripts/check-adopted-css-boundaries.mjs
tags: []
tracker_refs: []
---

# WP03 — `sk-form-textarea`

## The shared stylesheet does not exist, and cannot

An earlier draft of this WP was titled for a shared sheet. The post-tasks squad established there
is no file it could be:

- `build-elements-css.mjs:85` globs **only** `packages/styles/src/${name}/sk-*.css` per element,
  with `dir === name` hard-enforced;
- the module is built with `replaceSync`, which ignores `@import`.

So a "shared" sheet must exist as `form-input/sk-form-control.css` **and**
`form-textarea/sk-form-control.css` — two byte-identical copies, which is the duplication the
sharing was meant to remove. `.sk-input` and `.sk-textarea` differ in exactly two declarations
(`min-height`, `resize`), so the honest outcome is: **the rules are duplicated per element sheet,
and the only saving available is that the two deltas are custom properties.**

The `:host`-anchored form is still what makes any sharing gate-legal, and the probe stays worth
having: `:host .sk-form-control` is accepted under both element names while a bare
`.sk-form-control` is rejected under both. **Assign the probe change here, unconditionally** — the
earlier drafts had WP01 and WP04 each deferring it to the other, and the table is shrink-only, so
a floor raised for a shape the mission then declines pins the repo to a probe it does not use.

## Subtasks

- **T010** — `packages/styles/src/form-textarea/sk-form-textarea.css`, and the two deltas
  expressed as `var(--sk-form-control-min-height, …)` / `var(--sk-form-control-resize, …)` set on
  `:host` in each element's own sheet. Same additive constraints as WP01: `form-field/` untouched,
  no `is-focused`, no undefined-token fallback.
- **T011** — `sk-form-textarea.ts`, extending the same base, with **its own four anchors in its
  own file** (shared anchors: 8 of 37 mutations rejected as collateral; per-element: 37/37 clean).
  Both distribution entries — this WP owns them because FR-001 cannot be delivered without them.
- **T012** — Four more `(id, subject)` pairs, four more mutations, and the probe table:
  `[':host .sk-form-control', 'accept']`, `['.sk-form-control', 'reject']` — floor 19/12 → 20/13.

## Definition of Done

- `npx vitest run` green; `suite-selftest.mjs` green with all eight new mutations named-red and
  **no collateral**; `--selftest` 8/8.
- `check-adopted-css-boundaries.mjs` reports **5 of 5** elements, and `--selftest` passes at the
  raised floor.
- `check-elements-entries.mjs` green — both elements, both entries.
- `npm pack --dry-run` on `packages/styles`: **90 → 91**, one addition, nothing removed.
