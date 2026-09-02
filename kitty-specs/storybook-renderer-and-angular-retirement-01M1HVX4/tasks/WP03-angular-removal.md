---
work_package_id: WP03
title: Delete Angular from the repository
dependencies:
- WP02
requirement_refs:
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- NFR-004
planning_base_branch: mission/storybook-renderer-and-angular-retirement
merge_target_branch: mission/storybook-renderer-and-angular-retirement
branch_strategy: Planning artifacts for this mission were generated on mission/storybook-renderer-and-angular-retirement. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/storybook-renderer-and-angular-retirement unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
- T009
- T010
phase: Phase 3 - Removal
history:
- timestamp: '2026-09-02T20:20:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: src/lib/**/
create_intent: []
execution_mode: code_change
owned_files:
- src/lib/**/**
tags: []
tracker_refs: []
---

# Work Package Prompt: WP03 – Delete Angular from the repository

Implements IC-03. Sequenced after WP02 deliberately: the replacement renderer must be *proven* working before the builder it replaces is deleted, so a rendering regression cannot be confused with a deletion regression.

## Context — counts verified in this checkout

| Item | Verified |
|---|---|
| Angular story files | **10**, under `packages/angular/src/lib/**` |
| Angular-related devDependencies | **16** |
| Workflows with hardcoded project lists | **3** |
| Non-dev Angular dependencies | **0** |

**The issue's dependency enumeration is incomplete.** It names `@angular/*` / `zone.js` / `ng-packagr` / `@nx/angular` / `@storybook/angular`, which yields only **13**. The remaining 3 are **`@angular-devkit/architect`**, **`@angular-devkit/build-angular`** and **`@angular-devkit/core`**. Removing only the enumerated names leaves those behind and NFR-004 fails.

**The workflow strings are doubly stale.** They hardcode `projects=tokens,angular,html-js`. `angular` goes with this WP — but `html-js` is *already* wrong: that package was renamed to `packages/styles` by #85 (`9255b2a`). Fix both tokens, not just `angular`.

## Subtasks

- **T007** — Delete `packages/angular/` (package, its 10 story files, `ng-package.json`) and `angular.json` (FR-003, FR-004).
- **T008** — Remove all **16** devDependencies, including the three `@angular-devkit/*`. Refresh the lockfile and confirm it is clean (FR-005).
- **T009** — Update `release.yml`, `storybook-deploy.yml` and `pr-preview.yml`: drop `angular` **and** correct `html-js` → `styles` (FR-006).
- **T010** — Retire the `angular` scope from `commitlint.config.cjs` (FR-007). Check no commit on this branch uses it before removing.

## Definition of Done

- [ ] `packages/angular` and `angular.json` do not exist (FR-003).
- [ ] Zero matches for `@angular/`, `@angular-devkit/`, `zone.js`, `ng-packagr`, `@nx/angular`, `@storybook/angular` across `package.json`, the lockfile and all workflows — report the grep and its zero count (NFR-004).
- [ ] `nx.json` / the project graph no longer reference the deleted project; `npx nx graph` or an equivalent resolves without error.
- [ ] The three workflows name only packages that exist — `angular` removed **and** `html-js` corrected to `styles`.
- [ ] `angular` is not an accepted commitlint scope.
- [ ] Storybook still builds and the gate still passes after the deletion (re-run WP02's checks; deletion can break resolution).

## Notes

`main.ts`'s `stories` glob is `packages/**`, so deleting `packages/angular` removes its stories from the catalogue with no glob edit. Do not add an exclusion.
