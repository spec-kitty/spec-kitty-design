---
work_package_id: WP01
title: The two axes, in tokens, stylesheet and element
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
- C-001
- C-002
- C-003
planning_base_branch: mission/page-header-compact-sticky
merge_target_branch: mission/page-header-compact-sticky
branch_strategy: Planning artifacts for this mission were generated on mission/page-header-compact-sticky. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/page-header-compact-sticky unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - the axes
history:
- at: '2026-09-06T11:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: packages/styles/src/page-header/sk-page-header.css
create_intent: []
execution_mode: planning_artifact
model: ''
owned_files:
- packages/tokens/src/tokens.css
- packages/tokens/dist/token-catalogue.json
- packages/styles/src/page-header/sk-page-header.css
- packages/elements/src/page-header/sk-page-header.ts
- packages/elements/src/page-header/sk-page-header.css.js
- packages/elements/src/page-header/sk-page-header.css.d.ts
role: implementer
tags: []
task_type: feature
tracker_refs:
- spec-kitty/spec-kitty-design#182
---

# Work Package Prompt: WP01 – The two axes, in tokens, stylesheet and element

## Goal

Give the existing `sk-page-header` a reflected `density` axis and a reflected `sticky` axis, on its
existing template and its one authored stylesheet, with every value referencing a `--sk-*` token.

## What to build

1. **Tokens (T001).** `--sk-layout-page-header-sticky-offset`,
   `--sk-layout-page-header-compact-height`, `--sk-layout-page-header-sticky-layer`, and
   `--sk-layout-page-header-sticky-scroll-margin` defined as a `calc()` over the first two plus a
   space step. In **both** the `:root` block and the `:root[data-theme="light"], .sk-light` block,
   as theme-invariant, exactly as the two existing `--sk-layout-*` tokens are. Regenerate
   `packages/tokens/dist/token-catalogue.json`.
2. **Compact density (T002).** `.sk-page-header--compact`: `padding: var(--sk-space-2) var(--sk-space-4)`,
   `gap: var(--sk-space-3)`, `align-items: center`, `min-block-size` from the compact-height token;
   the text group on one non-wrapping row; eyebrow, title, supporting and sync truncating with
   `text-overflow: ellipsis` while their DOM text stays complete; the actions region
   `flex: 0 0 auto` so it never shrinks. **No font-size change** — the title is the consumer's.
3. **Sticky (T003).** `:host([sticky])` carries `position: sticky`,
   `inset-block-start: var(--sk-layout-page-header-sticky-offset)` and
   `z-index: var(--sk-layout-page-header-sticky-layer)`. The declaration is on the host because an
   inner box's containing block is the host and it cannot move inside it — measured, see `plan.md`
   measurement 2. `:host([sticky]) .sk-page-header` carries the elevation and a
   `border-block-end` band reserved at `transparent`.
4. **Dropping stickiness (T004).** Two **separate** media blocks — `(max-width: 720px)` and
   `(max-height: 480px)` — each returning `:host([sticky])` to `position: static` and removing the
   elevation. Separate, not one comma list, so each threshold can be read out of the adopted sheet
   on its own.
5. **Reduced motion and forced colors (T005).** One `transition` on one property on one selector,
   suppressed by `@media (prefers-reduced-motion: reduce)` scoped to that same selector — never a
   wildcard. `@media (forced-colors: active)` overrides only the **longhand**
   `border-block-end-color: CanvasText`; the shorthand is invisible to stylelint's
   `declaration-strict-value`, so the longhand is what the gate certifies.
6. **The element (T006).** `static properties = { density: { type: String, reflect: true }, sticky: { type: Boolean, reflect: true } }`,
   a module-level classes helper that **warns and degrades** on an unknown density (never throws),
   and a doc comment per property — the analyzer copies it into `custom-elements.json` and the React
   generator into the prop docs, and `check-manifest-content.mjs` refuses an undocumented attribute.
   Keep rationale in `//`, not in the `/** */`.
7. **Regenerate (T007).** `node scripts/build-elements-css.mjs`, then confirm the existing SC-013
   mutation anchor — the exactly-indented `<div part="supporting" class="sk-page-header__supporting">`
   line — still occurs exactly once in the element.

## Boundaries

- The part tree and the slot tree do not change. `expected-parts.json` must not move.
- No `.markup.ts` is added: `sk-page-header` has no static form and #145 declined one.
- No new element, no `sk-app-shell` change, no `--sk-status-*` token.
- No ADR record, no `docs/architecture/README.md`, no `scripts/check-adr-index.mjs`.

## Independent test

`npx nx run tokens:catalogue` lists the four new tokens; `npm run quality:stylelint` and
`node scripts/check-element-css-hygiene.mjs` and `node scripts/check-adopted-css-boundaries.mjs`
pass; `node scripts/build-elements-css.mjs --check` is clean; `node scripts/typecheck-all.mjs`
passes.
