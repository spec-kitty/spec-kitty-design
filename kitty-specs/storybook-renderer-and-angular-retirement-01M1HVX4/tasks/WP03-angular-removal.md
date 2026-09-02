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
authoritative_surface: packages/angular/
create_intent: []
execution_mode: code_change
owned_files:
- packages/angular/**
- angular.json
- commitlint.config.cjs
- package.json
- package-lock.json
- eslint.config.mjs
- .github/dependabot.yml
- .github/workflows/ci-quality.yml
- .gitignore
- apps/storybook/src/tests/smoke.spec.ts
- .github/workflows/release.yml
- .github/workflows/storybook-deploy.yml
- .github/workflows/pr-preview.yml
- nx.json
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

**Correction — an earlier draft of this WP claimed the workflow strings were "doubly stale" and still said `html-js`. That was false and the squad caught it.** Verified at HEAD:

```
pr-preview.yml:19        --projects=tokens,angular,styles
release.yml:30           --projects=tokens,angular,styles
storybook-deploy.yml:39  --projects=tokens,angular,styles
```

`#85` already corrected `html-js` → `styles`; the string appears in no workflow. Only `angular` is to be removed. The DoD checkbox demanding an `html-js` fix has been deleted — it could never have been ticked truthfully.

**`angular` appears in more shapes than the `--projects=` lists.** `release.yml` alone has three, and the third breaks a release *after* `@spec-kitty/tokens` has already published:

| Site | What |
|---|---|
| `release.yml:30` | `--projects=` build list |
| `release.yml:37` | `for pkg in tokens angular styles` dist audit loop |
| `release.yml:54-56` | the whole `Publish @spec-kitty/angular` step, `working-directory: packages/angular/dist` |
| `storybook-deploy.yml:11` | `paths:` trigger on `packages/angular/**` |
| `ci-quality.yml:45` | `packages/angular/**` in the `components` paths-filter |
| `eslint.config.mjs:17,19` | `scope:angular` Nx module-boundary depConstraints (run by `quality:lint`) |
| `.github/dependabot.yml:10-11` | an `angular:` group whose patterns will match nothing |
| `.gitignore:10-15,67-68` | `!packages/angular/dist/` negation and the `.angular/` CLI cache rule |

## Subtasks

- **T007** — Delete `packages/angular/` (package, its 10 story files, `ng-package.json`) and `angular.json` (FR-003, FR-004).
- **T008** — Remove all **16** devDependencies, including the three `@angular-devkit/*`. Also remove **`@storybook/html`**, which FR-008 leaves with no remaining importer and which NFR-004's Angular-scoped grep would not catch. Refresh the lockfile and confirm it is clean (FR-005).
- **T009** — Remove `angular` from **every** site in the table above: the three `--projects=` lists, `release.yml`'s `for pkg in` loop, `release.yml`'s `Publish @spec-kitty/angular` step, the `storybook-deploy.yml` path trigger, the `ci-quality.yml` components filter, the `eslint.config.mjs` depConstraints, the `dependabot.yml` group and the `.gitignore` entries (FR-006). Do **not** look for `html-js` — it is not there.
- **T009b** — Delete the Angular smoke test at `apps/storybook/src/tests/smoke.spec.ts:54-59`. It navigates to `primitives-skstub-angular--default` and is run as a required gate by `ci-quality.yml:240`; after this WP it hangs 20s and fails.
- **T010** — Retire the `angular` scope from `commitlint.config.cjs` (FR-007). Check no commit on this branch uses it before removing.

## Definition of Done

- [ ] `packages/angular` and `angular.json` do not exist (FR-003).
- [ ] Zero matches for `@angular/`, `@angular-devkit/`, `zone.js`, `ng-packagr`, `@nx/angular`, `@storybook/angular`, `@storybook/html` across `package.json`, the lockfile and all workflows — report the grep and its zero count (NFR-004).
- [ ] `nx.json` / the project graph no longer reference the deleted project; `npx nx graph` or an equivalent resolves without error.
- [ ] Every site in the table above no longer names `angular`; `npx nx graph` (or equivalent) resolves; `release.yml` has no publish step pointing at a deleted directory.
- [ ] `angular` is not an accepted commitlint scope.
- [ ] Storybook still builds and the gate still passes after the deletion (re-run WP02's checks; deletion can break resolution). **This is only achievable because WP02 deleted `UNRENDERABLE_IMPORT_PATTERN` — with the skip in place the gate hard-exits 1 here by design.**
- [ ] The Playwright suite passes: no test navigates to a deleted Angular story (`smoke.spec.ts`, and the four Angular blocks in `visual.spec.ts` which WP04 removes).

## Notes

`main.ts`'s `stories` glob is `packages/**`, so deleting `packages/angular` removes its stories from the catalogue with no glob edit. Do not add an exclusion.

## Documentation deferral (DIRECTIVE_037) — deliberate, recorded not silent

`README.md`, `CLAUDE.md`, `llms.txt`, `llms-full.txt` and `apps/storybook/src/stories/getting-started.mdx:20-22,43-45` all describe `@spec-kitty/angular` as a published package, and the last of those **renders inside the catalogue this mission migrates** (`main.ts:12` globs `../src/**/*.mdx`), telling readers to `npm install @spec-kitty/angular`.

This WP does **not** update them: the docs surface is broader than this mission's scope and touching it would widen an already-large deletion. It is recorded here rather than omitted silently, per DIRECTIVE_037, and is filed as **#100**, which is blocked on this mission merging.
