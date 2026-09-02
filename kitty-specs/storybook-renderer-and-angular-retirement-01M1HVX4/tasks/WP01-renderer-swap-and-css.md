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
authoritative_surface: apps/storybook/.storybook/
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/.storybook/**
- apps/storybook/project.json
- package.json
- package-lock.json
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – Swap Storybook to the web-components renderer on Vite

Implements IC-01. This is the enabling change; every other WP depends on it.

## Context

`apps/storybook/.storybook/main.ts:15` currently binds `framework: { name: '@storybook/angular' }`, and lines 23-40 install a hand-written `style-loader`/`css-loader` webpack rule scoped by `include:` to `packages/styles` and `packages/tokens`. ADR-13 decides the move to `@storybook/web-components-vite` (Option B) and measured that string-returning stories render unmodified.

**Version — this WP previously stated the opposite; the post-tasks squad falsified it.** `package.json` carries the *range* `^10.3.6`, but the *resolved* version is **10.5.10**:

```
$ node -p "require('./package.json').devDependencies.storybook"          -> ^10.3.6   (range)
$ node -p "require('./node_modules/storybook/package.json').version"     -> 10.5.10   (installed)
```

Issue #69's "10.5.x matches the installed Storybook line" was **correct**. Pin `@storybook/web-components-vite` to the resolved Storybook version. Installing a 10.3.6 framework against a 10.5.10 core is the straddle to avoid.

**`apps/storybook/project.json` is the real build entry point and must move in this WP.** Its targets run `node_modules/.bin/ng run storybook:storybook` / `storybook:build-storybook` (`:9`, `:18`) — `ng` is `@angular/cli`, and the target is defined in `angular.json`, both of which WP03 deletes. All four workflows invoke `npx nx run storybook:storybook:build`. If this is not re-pointed here, WP01/WP02 measure the *Angular* builder while `main.ts` declares a web-components framework, and the mission's sequencing benefit is notional.

## Subtasks

- **T001** — Add `@storybook/web-components-vite` at the resolved Storybook version (10.5.10) **and `@storybook/web-components` as a direct devDependency** (FR-008 imports from it; it currently resolves only by hoisting, an undeclared direct dependency). Set `framework: { name: '@storybook/web-components-vite', options: {} }` and change the `StorybookConfig` type import at `main.ts:1`.
- **T001b** — Remove the `@storybook/angular` type import at `apps/storybook/.storybook/preview.ts:2`. It is inside this WP's ownership and would fail to typecheck once WP03 removes the package.
- **T001c** — Re-point both targets in `apps/storybook/project.json` from `ng run …` to `storybook dev` / `storybook build --config-dir apps/storybook/.storybook --output-dir apps/storybook/storybook-static`. **Keep the target names** (`storybook`, `storybook:build`) so all four workflow call sites keep working.
- **T002** — Delete the `webpackFinal` hook and the `import type { Configuration } from 'webpack'` it needs, letting Vite handle CSS natively. Leave `staticDirs` and the `stories` glob alone: the glob is `../../../packages/**/*.stories.@(ts|tsx)`, so it needs no edit when `packages/angular` is deleted in WP03.
- **T003** — Build Storybook via `npx nx run storybook:storybook:build` (the path CI uses, not a direct `storybook build`) and record the wall-clock time **and the environment** (local vs CI, warm vs cold). ADR-13's 1m17s spike figure records neither.

## Definition of Done

- [ ] `main.ts` binds `@storybook/web-components-vite`; no `webpackFinal`, no `webpack` type import, no `@storybook/angular` import.
- [ ] The framework package version equals the resolved `storybook` version in the lockfile — currently **10.5.10** (FR-001, C-002). Check the resolved value, not the range.
- [ ] `npx nx run storybook:storybook:build` succeeds **with no `ng` on PATH** — proving the build no longer routes through Angular CLI.
- [ ] No `@storybook/angular` import remains anywhere under `apps/storybook/.storybook/` (not just `main.ts`).
- [ ] The build completes in **under 3 minutes**, with the measured time recorded in the PR (NFR-001).
- [ ] **No `packages/styles` story file was edited** (NFR-003). Prove with `git diff --stat -- packages/styles` showing no `.stories.ts` content changes.
- [ ] CSS reaches the stories without the hand-written rule (FR-002), proven **mechanically, not by eye**: in a served story page assert (a) `getComputedStyle(document.documentElement).getPropertyValue('--sk-surface-page')` is non-empty, and (b) a component's own rule applies — e.g. an `sk-card` element's computed `border-radius` is not `0px`. Record the story id and both values in the PR.

  *Why mechanical:* `preview-head.html:30` sets `background: var(--sk-surface-page, #0D0E11)` — the fallback is the same dark hex, so a total token-CSS injection failure looks identical to success, passes axe, and passes the mount assertion. The only other detector is the visual baseline set, which is WP04 (last) and currently blank.

## Notes

A green build is **not** evidence that stories render — the web-components renderer will happily mount nothing. Rendering is proven in WP02. Do not claim this WP verifies rendering.
