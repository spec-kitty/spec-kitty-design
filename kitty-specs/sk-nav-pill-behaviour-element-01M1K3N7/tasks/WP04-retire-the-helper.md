---
work_package_id: WP04
title: Retire skToggleDrawer, and the id contract with it
dependencies:
- WP02
requirement_refs:
- FR-007
- FR-008
- FR-009
planning_base_branch: mission/sk-nav-pill-behaviour-element
merge_target_branch: mission/sk-nav-pill-behaviour-element
branch_strategy: Planning artifacts for this mission were generated on mission/sk-nav-pill-behaviour-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-nav-pill-behaviour-element unless the human explicitly redirects the landing branch.
subtasks:
- T011
- T012
- T013
phase: Phase 4 - Retirement
history:
- timestamp: '2026-09-03T08:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: apps/demo/dashboard-demo.html
create_intent: []
execution_mode: code_change
owned_files:
- packages/styles/src/nav-pill/sk-nav-pill.js
- packages/styles/src/nav-pill/sk-nav-pill.d.ts
- packages/styles/src/nav-pill/index.ts
- packages/styles/src/nav-pill/sk-nav-pill.stories.ts
- packages/styles/src/index.ts
- packages/styles/README.md
- apps/demo/dashboard-demo.html
tags: []
tracker_refs: []
---

# WP04 — Retire the helper

Sequenced last: deleting the helper breaks the demo and the story until the element replaces
them. No compatibility shim — the issue rules it out explicitly, and it is a free break because
nothing is published.

## Subtasks

- **T011** — Delete `sk-nav-pill.js` and `sk-nav-pill.d.ts`; drop the re-export from
  `packages/styles/src/nav-pill/index.ts` and from `packages/styles/src/index.ts`.

- **T012** — `packages/styles/README.md` documents the id contract in **three** places
  (`:58`, `:83-85`, `:100-106`). A partial edit leaves a README teaching a deleted API, which is
  worse than one that says nothing. Replace with the element's API.

  `packages/styles/src/nav-pill/sk-nav-pill.stories.ts` assigns to `window.__skToggleDrawer`
  (`:94`) and wires an inline `onclick` (`:119`). Both go; the drawer story renders the element.

- **T013** — `apps/demo/dashboard-demo.html`. CLAUDE.md **hard rule 7** binds it: relative
  `../../packages/...` paths for `file://` development, and the `sed`-rewritten paths that
  `scripts/assemble-demo-dist.sh` produces for deployment. **Verify both.** Passing from
  `file://` proves nothing about the deploy path, and that script is called by `ci-quality.yml`
  as well as `storybook-deploy.yml`.

  The demo's header CSS is the risk here, not the markup: `.dash-nav-drawer-wrap` and
  `.dash-header .sk-nav-pill` position the drawer *outside* the nav, below the header, full
  width. A shadow-owned panel is positioned relative to the host. Re-check at the breakpoint —
  this is the most likely place for a visual regression that no assertion catches.

  The demo also duplicates every nav item (`:529-533` and `:569-574`). With one slot it is
  authored once. That is FR-006 landing, not an incidental tidy-up.

## Definition of Done

- `grep -rn 'skToggleDrawer' --include='*.ts' --include='*.js' --include='*.html' --include='*.md'`
  returns nothing outside frozen `kitty-specs/**` and the historical ADR/programme prose.
- No `id="sk-nav-drawer"`, no `window.` assignment and no `onclick` attribute remain.
- The demo toggles from `file://` **and** after `scripts/assemble-demo-dist.sh`.
- `npm run quality:htmlhint` and the visual-regression suite are green.
