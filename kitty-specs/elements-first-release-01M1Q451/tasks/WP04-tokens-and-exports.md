---
work_package_id: WP04
title: The dead font import, and the twelve unreachable stylesheets
dependencies: []
requirement_refs:
- FR-009
- FR-010
planning_base_branch: mission/elements-first-release
merge_target_branch: mission/elements-first-release
branch_strategy: Planning artifacts for this mission were generated on mission/elements-first-release. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-first-release unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 3 - Surfaces
history:
- timestamp: '2026-09-04T21:23:41Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/styles/package.json
create_intent: []
execution_mode: code_change
owned_files:
- packages/styles/package.json
tags: []
tracker_refs:
- '#80'
---

# WP04 — Two consumer-facing surfaces that are quietly wrong

## The mono font has never loaded

`--sk-font-mono: 'JetBrains Mono', ui-monospace, "SF Mono", Menlo, Consolas, monospace` declares a
family that no consumer has ever seen. The `@import` that would load it is at line 162 of
`tokens.css`; `:root {` opens at line 3; CSS requires `@import` to precede every style rule, so it is
dropped. Verified in Chromium — 32 rules, 0 import rules, and the network route never fired.

**In scope, mechanical:** delete the dead `@import` and its comment. It loads nothing today, so
removing it changes no observable behaviour, and leaving it invites the wrong fix.

**Out of scope, raised as a fork on #80:** whether JetBrains Mono should be self-hosted (OFL permits
it) or dropped from the token so the declaration matches what resolves. That is a brand decision.

**Do not move the `@import` to the top of the file.** It is the obvious repair and it is wrong: it
would make the font load *and* break SC-006 in the same edit, and add an unpinned third-party runtime
request to every consumer page — which ADR-5's control table does not cover.

## Twelve of fifteen stylesheets are unreachable

`@spec-kitty/styles` exports subpaths for `button`, `site-footer` and `stub`. The source has fifteen
component directories: blog-card, button, card, check-bullet, feature-card, form-field, form-input,
form-textarea, grid, nav-pill, pill-tag, ribbon-card, section-banner, site-footer, stub.

Add the missing twelve. Prefer deriving the map over hand-listing it — a hand-written export map is
what produced a partial one, and `packages/styles/src/index.ts` had already drifted the same way
(#77 found `SkGridGap4HTML` missing from a hand-written barrel). WP02's gate asserts every `exports`
target resolves inside the tarball, so a derived map is checked rather than trusted.
