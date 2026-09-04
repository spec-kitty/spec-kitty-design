---
work_package_id: WP02
title: The stylesheet — rename, slotted spellings, and a real light theme
dependencies:
- WP01
requirement_refs:
- FR-003
- FR-006
planning_base_branch: mission/component-migration-batch-layout
merge_target_branch: mission/component-migration-batch-layout
branch_strategy: Planning artifacts for this mission were generated on mission/component-migration-batch-layout. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/component-migration-batch-layout unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 2 - Styles
history:
- timestamp: '2026-09-04T18:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/styles/src/site-footer/sk-site-footer.css
create_intent: []
execution_mode: code_change
owned_files:
- packages/styles/src/site-footer/sk-site-footer.css
- packages/styles/src/site-footer/sk-site-footer.stories.ts
tags: []
tracker_refs:
- '#77'
---

# WP02 — The stylesheet

## The rename is a precondition (FR-003)

`.sk-footer-link` — 20 occurrences — is not prefixed with the component's tag name, and
`check-adopted-css-boundaries.mjs` rejects a class the component does not own the moment its
sheet is adopted. **The migration cannot land without this rename.** It is BREAKING for copied
snippets, the same shape as #139's ruling; record it in the changelog.

Do not touch `tmp/reference_system/**` (vendored design reference) or `kitty-specs/**` (frozen).

## Both spellings, one rule

Text regions will be SLOTTED, and a shadow-tree class selector cannot match a slotted node while
`::slotted()` is inert in a document. One selector list serves both paths:

```css
.sk-site-footer__link,
::slotted(.sk-site-footer__link) { … }
```

**A state pseudo-class must sit INSIDE `::slotted()`.** `::slotted(x):hover` does not parse, and
one invalid selector invalidates its whole comma list — #143 shipped exactly that and silently
deleted a working hover on both paths. The gate now rejects it, with probes.

## The light theme is not currently real (FR-006)

`sk-site-footer.stories.ts` wraps `LightMode` in `data-theme="light"`, which activates nothing —
tokens anchor light on `:root[data-theme="light"], .sk-light`, and `:root` matches only `<html>`
(#93). So its light stories have been rendering the DARK palette.

Switch to `class="sk-light"`, then **measure every ink this component sets on both surfaces before
assuming any of them passes.** Retiring this wrapper exposed four failing pill-tag variants
(1.51–2.48:1) and a 1.73:1 check-bullet tick in the two preceding batches. Budget for fixes.

Fix at the component layer where possible. A shared token change needs its own argument — #143
changed one and had to justify it against the alternative of adding a new per-theme token.
