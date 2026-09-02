---
work_package_id: WP01
title: Swap Storybook to the web-components renderer on Vite
dependencies: []
requirement_refs:
- FR-001
- FR-002
- NFR-001
- NFR-003
- C-002
planning_base_branch: mission/storybook-renderer-and-angular-retirement
merge_target_branch: mission/storybook-renderer-and-angular-retirement
branch_strategy: Planning artifacts for this mission were generated on mission/storybook-renderer-and-angular-retirement. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/storybook-renderer-and-angular-retirement unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - Renderer
history:
- timestamp: '2026-09-02T20:20:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: src/
create_intent: []
execution_mode: code_change
owned_files:
- src/**
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – Swap Storybook to the web-components renderer on Vite

Implements IC-01. This is the enabling change; every other WP depends on it.

## Context

`apps/storybook/.storybook/main.ts:15` currently binds `framework: { name: '@storybook/angular' }`, and lines 23-40 install a hand-written `style-loader`/`css-loader` webpack rule scoped by `include:` to `packages/styles` and `packages/tokens`. ADR-13 decides the move to `@storybook/web-components-vite` (Option B) and measured that string-returning stories render unmodified.

**Version, verified in this checkout:** the installed Storybook line is **`^10.3.6`** — `storybook`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/angular` and `@storybook/html` are all `^10.3.6`. Issue #69 says "10.5.x matches the installed Storybook line"; that is wrong. **Pin `@storybook/web-components-vite@^10.3.6`.** Installing 10.5.x would straddle two Storybook lines.

## Subtasks

- **T001** — Add `@storybook/web-components-vite@^10.3.6` and set `framework: { name: '@storybook/web-components-vite', options: {} }`. Change the `StorybookConfig` type import at `main.ts:1` from `@storybook/angular` to the new framework package.
- **T002** — Delete the `webpackFinal` hook and the `import type { Configuration } from 'webpack'` it needs, letting Vite handle CSS natively. Leave `staticDirs` and the `stories` glob alone: the glob is `../../../packages/**/*.stories.@(ts|tsx)`, so it needs no edit when `packages/angular` is deleted in WP03.
- **T003** — Build Storybook and record the wall-clock time.

## Definition of Done

- [ ] `main.ts` binds `@storybook/web-components-vite`; no `webpackFinal`, no `webpack` type import, no `@storybook/angular` import.
- [ ] The framework package is pinned on the `^10.3.6` line, matching the installed Storybook (FR-001, C-002).
- [ ] The build completes in **under 3 minutes**, with the measured time recorded in the PR (NFR-001).
- [ ] **No `packages/styles` story file was edited** (NFR-003). Prove with `git diff --stat -- packages/styles` showing no `.stories.ts` content changes.
- [ ] CSS reaches the stories without the hand-written rule (FR-002) — verified visually in the built catalogue, not assumed from a green build.

## Notes

A green build is **not** evidence that stories render — the web-components renderer will happily mount nothing. Rendering is proven in WP02. Do not claim this WP verifies rendering.
