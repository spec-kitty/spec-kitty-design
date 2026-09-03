---
work_package_id: WP02
title: sk-form-input — arrangement B, form-associated
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-005
- FR-006
planning_base_branch: mission/sk-form-field-form-association
merge_target_branch: mission/sk-form-field-form-association
branch_strategy: Planning artifacts for this mission were generated on mission/sk-form-field-form-association. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-form-field-form-association unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
phase: Phase 2 - Element
history:
- timestamp: '2026-09-03T11:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/form-input/sk-form-input.ts
create_intent:
- packages/elements/src/form-input/sk-form-input.ts
- packages/elements/src/form-control-base.ts
execution_mode: code_change
owned_files:
- packages/elements/src/form-input/sk-form-input.ts
- packages/elements/src/form-control-base.ts
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
tags: []
tracker_refs: []
---

# WP02 — `sk-form-input`

Arrangement B, settled in ADR-9 §4 from four real elements and an axe run: the shadow root owns
both the label and the control, and the label text is a property. Plus `static formAssociated`
and `ElementInternals`, because B passes axe and **submits nothing** without them — the ADR's
probe form produced keys `["a","d"]` and B contributed none.

## Subtasks

- **T004** — `packages/elements/src/form-control-base.ts`: the **unanchored plumbing only** —
  `attachInternals()`, the `validity`/`validationMessage`/`checkValidity` proxies, the
  pre-upgrade property dance, the error-node render helper, and the `#initialValue` capture
  (which becomes `protected`; `#`-private is not inheritable).

  Three constraints, each of which a lens measured:
  - **Not `sk-`-prefixed, and no `@element` JSDoc.** Four scripts glob `**/sk-*.ts` with
    `/^sk-[a-z0-9-]+\.ts$/`; an `sk-`-named base would be treated as an element and fail four
    gates, and `config-contract` requires the manifest's registered set to equal the source glob
    exactly.
  - **The four mutation anchors do NOT live here.** A shared anchor reds both elements' `[SC-00x]`
    tests and guard 5 rejects it as collateral — measured, 8 of 37 failing. Per-element anchors
    give 37/37 clean.
  - **`static formAssociated` may live here** *only because* the gate arm is manifest-derived and
    the analyzer propagates inherited statics. A source-text or `hasOwnProperty` arm sees nothing
    (measured `false` on the subclass). If WP03's arm is implemented any other way, the flag moves
    onto each element.

- **T005** — `sk-form-input.ts`: shadow root renders label, control, description and error node.
  `label`, `description` are properties; **`error` is read-only, derived from validity** — a
  settable `error` alongside `setValidity` is two sources of truth, and would paint the error
  state on a `:valid` element that submits happily while the story renders red and axe passes.

  `setFormValue` tracks the property, not just the initial state: the fixture records
  `el.value = 'x'` submitting stale as a real failure. `setValidity`'s third argument is the
  **focus anchor for `reportValidity()`** — it puts nothing in the accessibility tree; the message
  gets there via `aria-describedby` to an error node **in the same shadow root**.

  Published prose short (C-005), and `@csspart` JSDoc for every part or WP04's ratchet is vacuous.

- **T006** — Both distribution entries (`index.ts` **and** `elements.ts`), or
  `check-elements-entries.mjs` names it. That gate exists because #73 shipped an element missing
  from the IIFE entry and every other gate stayed green.

## Definition of Done

- `npx nx run elements:typecheck` and `elements:analyze` green; the manifest describes
  `<sk-form-input>` by real tag name.
- `check-elements-entries.mjs` and its `--selftest` green.
- `check-adopted-css-boundaries.mjs` green with the element present.
- `check-no-css-in-source.mjs` green.
