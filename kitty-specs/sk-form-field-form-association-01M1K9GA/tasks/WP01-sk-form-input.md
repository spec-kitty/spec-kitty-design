---
work_package_id: WP01
title: sk-form-input — its stylesheet and its element, together
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-005
- FR-006
- FR-012
- FR-013
- FR-014
- FR-015
- NFR-001
- NFR-002
planning_base_branch: mission/sk-form-field-form-association
merge_target_branch: mission/sk-form-field-form-association
branch_strategy: Planning artifacts for this mission were generated on mission/sk-form-field-form-association. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-form-field-form-association unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - First element
history:
- timestamp: '2026-09-03T12:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/form-input/sk-form-input.ts
create_intent:
- packages/styles/src/form-input/sk-form-input.css
- packages/elements/src/form-input/sk-form-input.ts
- packages/elements/src/form-input/sk-form-input.css.js
- packages/elements/src/form-input/sk-form-input.css.d.ts
- packages/elements/src/form-control-base.ts
execution_mode: code_change
owned_files:
- packages/styles/src/form-input/sk-form-input.css
- packages/elements/src/form-input/sk-form-input.ts
- packages/elements/src/form-input/sk-form-input.css.js
- packages/elements/src/form-input/sk-form-input.css.d.ts
- packages/elements/src/form-control-base.ts
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- packages/elements/custom-elements.json
tags: []
tracker_refs: []
---

# WP01 — `sk-form-input`: the stylesheet and the element, in one package

**The sheet and the element ship TOGETHER, and that is a correction.** The first cut of these
work packages put the stylesheet in its own WP ahead of the element, on the reasoning that the
boundary gate iterates elements — and the post-tasks squad showed that reasoning produces a WP
whose entire Definition of Done passes over a file **no gate ever opens**:

```
check-adopted-css-boundaries.mjs   → 3 of 3 element(s) checked   (the new sheet is never read)
--selftest                          → runs the probe table and exits before the repository pass
git diff -- form-field/             → clean
npm pack --dry-run                  → an addition, no removal
quality:stylelint                   → min-height and outline are not in the strict-value list
```

A sheet containing `:root{}`, `html{}` and `.is-focused` would have passed all five. The gate
only opens `packages/styles/src/<name>/sk-*.css` once `packages/elements/src/<name>/sk-<name>.ts`
exists, so the two must land in the same commit.

## Subtasks

- **T001** — `packages/styles/src/form-input/sk-form-input.css`, authored from
  `form-field/sk-form-field.css`'s `.sk-input*` rules with class names that own their leftmost
  compound under `sk-form-input`.

  **`packages/styles/src/form-field/` is not touched** — `@spec-kitty/styles` is published
  publicly at 1.0.0 (C-007). Two things deliberately do **not** come across, asserted positively
  because the additive path means there is no deletion to point at:
  - `.is-focused`, a class that fakes a state the browser owns and lies to the a11y tree;
  - `var(--sk-space-30, 120px)` — a token defined nowhere, so the fallback is the only live
    value: a hardcoded 120px wearing a token's clothes. `min-height` is not in stylelint's
    strict-value property list, so nothing would object.

- **T002** — `packages/elements/src/form-control-base.ts`: **unanchored plumbing only** —
  `attachInternals()`, the `validity`/`validationMessage`/`checkValidity` proxies, the
  pre-upgrade property dance, the error-node render helper, the `#initialValue` capture (which
  becomes `protected`; `#`-private is not inheritable).

  Not `sk-`-prefixed and carrying no `@element` JSDoc: four scripts glob `**/sk-*.ts` with
  `/^sk-[a-z0-9-]+\.ts$/`, and `config-contract` requires the manifest's registered set to equal
  the source glob exactly. **The four mutation anchors do not live here** — a shared anchor reds
  both elements and guard 5 rejects it as collateral (measured, 8 of 37 failing).

- **T003** — `sk-form-input.ts`. `label` and `description` are properties; **`error` is
  read-only, derived from validity** — a settable `error` alongside `setValidity` paints the
  error state on a `:valid` element that submits happily. `setFormValue` tracks the property, not
  just the initial state. `setValidity`'s third argument is the **focus anchor for
  `reportValidity()`**; the message reaches the a11y tree via `aria-describedby` to an error node
  in the same shadow root. `@csspart` JSDoc for every part, or the ratchet is vacuous (WP04).

  Both distribution entries, and the generated `.css.js` / `.css.d.ts` and `custom-elements.json`
  are committed with it — CI asserts all three are current, and the element cannot typecheck
  without the first.

- **T004** — Confirm the restated NFR-002 holds for this sheet. The criterion itself was
  corrected at mission level before implementation began (a WP may not own a `kitty-specs/` path,
  and the post-tasks squad was right that it had no owner): it said every rule owns its leftmost
  compound "under its own element's name", while the gate accepts four leading forms — `:host`,
  `::slotted(`, bare `slot`, and `^sk-<name>` — and the `:host`-anchored shape WP03 needs
  satisfies the gate while violating that wording.

## Definition of Done

- `check-adopted-css-boundaries.mjs` green **with the element present**, so the new sheet is
  actually read — verify the reported element count went 3 → 4.
- `grep -c 'is-focused' packages/styles/src/form-input/sk-form-input.css` → 0, and every
  `var(--sk-*, …)` fallback in it names a token that exists in the catalogue.
- `git diff --exit-code <merge-base> -- packages/styles/src/form-field/ packages/styles/src/index.ts`
  clean, against the **merge base**, not the working tree.
- `npm pack --dry-run` on `packages/styles`: **89 → 90**, one addition, nothing removed, renamed
  or changed.
- `elements:typecheck`, `elements:analyze`, `check-elements-entries.mjs` (+`--selftest`),
  `check-no-css-in-source.mjs`, `build-elements-css.mjs --check`, `quality:stylelint` all green.
- FR-005 and FR-006 are **witnessed in WP02**, not here — this WP's gates are structural and
  would pass for an element that renders neither a label nor an error node.
