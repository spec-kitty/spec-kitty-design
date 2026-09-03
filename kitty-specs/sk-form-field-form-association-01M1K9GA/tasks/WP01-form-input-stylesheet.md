---
work_package_id: WP01
title: One stylesheet directory for sk-form-input, and the probes that keep its shape
dependencies: []
requirement_refs:
- FR-012
- FR-013
- FR-014
- FR-015
planning_base_branch: mission/sk-form-field-form-association
merge_target_branch: mission/sk-form-field-form-association
branch_strategy: Planning artifacts for this mission were generated on mission/sk-form-field-form-association. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-form-field-form-association unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - Styles
history:
- timestamp: '2026-09-03T11:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/styles/src/form-input/sk-form-input.css
create_intent:
- packages/styles/src/form-input/sk-form-input.css
execution_mode: code_change
owned_files:
- packages/styles/src/form-input/sk-form-input.css
- scripts/check-adopted-css-boundaries.mjs
tags: []
tracker_refs: []
---

# WP01 — One stylesheet directory for `sk-form-input`

Sequenced first: two gates hard-exit without it, and both were measured by the post-spec squad.

```
packages/elements/src/form-input/sk-form-input.ts   → no sk-*.css under packages/styles/src/form-input/   exit 1
packages/elements/src/form-field/sk-form-input.ts   → sits in "form-field/" but names "form-input"        exit 1
```

**`form-input/` ONLY.** Not `form-textarea/` — the boundary gate iterates *elements*, so a styles
directory with no element is never opened, and a sheet created here before its element would land
completely unchecked by the gate this WP exists to satisfy.

## Subtasks

- **T001** — `packages/styles/src/form-input/sk-form-input.css`, authored from
  `form-field/sk-form-field.css`'s `.sk-input*` rules with class names that own their leftmost
  compound under `sk-form-input`.

  **`packages/styles/src/form-field/` is not touched.** `@spec-kitty/styles` is published publicly
  at 1.0.0 (C-007). Verify with `git diff --exit-code -- packages/styles/src/form-field/` and with
  `npm pack --dry-run`: no existing packed file may be removed, renamed or changed in content.
  Additions are expected — the list goes 89 → 91 by construction, which is why SC-209 asserts
  *nothing moves* rather than *nothing changes*.

- **T002** — Two things do **not** come across, and this is where that is recorded, because the
  FRs that named them assumed a deletion the additive path forbids:
  - `.is-focused` — a class that fakes a state the browser owns. An element that can have real
    focus has no business shipping a simulation of it, and it lies to the a11y tree.
  - `var(--sk-space-30, 120px)` — a token that exists nowhere in the repo, so the fallback is the
    only live value: a hardcoded 120px wearing a token's clothes. `min-height` is not in
    stylelint's strict-value property list, so nothing would have objected. Resolve it against a
    real token or state the deviation in the sheet's header.

  Assert both positively: the new sheet contains neither `is-focused` nor an undefined-token
  fallback.

- **T003** — `node scripts/check-adopted-css-boundaries.mjs` green for the new element, and the
  `--selftest` probe table grown in the same commit. If WP04's `:host`-anchored sharing is
  adopted, `[':host .sk-form-control', 'accept']` and `['.sk-form-control', 'reject']` join the
  table and the floor rises 19/12 → 20/13. The table is shrink-only and its own instruction is
  that every form the gate was ever defeated by stays in it.

## Definition of Done

- `check-adopted-css-boundaries.mjs` and its `--selftest` both green.
- `git diff --exit-code -- packages/styles/src/form-field/` clean.
- `npm pack --dry-run` on `packages/styles`: no removal, no rename, no content change.
- `npm run quality:stylelint` green.
