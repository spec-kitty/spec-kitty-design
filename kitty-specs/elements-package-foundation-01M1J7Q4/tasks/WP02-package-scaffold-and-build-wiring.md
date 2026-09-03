---
work_package_id: WP02
title: Scaffold packages/elements and wire it into the build
dependencies: []
requirement_refs:
- FR-001
- FR-008
planning_base_branch: mission/elements-package-foundation
merge_target_branch: mission/elements-package-foundation
branch_strategy: Planning artifacts for this mission were generated on mission/elements-package-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-package-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
- T007
phase: Phase 2 - Package
history:
- timestamp: '2026-09-03T00:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/
create_intent:
- packages/elements/package.json
- packages/elements/project.json
- packages/elements/tsconfig.json
- packages/elements/tsconfig.lib.json
execution_mode: code_change
owned_files:
- packages/elements/package.json
- packages/elements/project.json
- packages/elements/tsconfig.json
- packages/elements/tsconfig.lib.json
- eslint.config.mjs
- .github/workflows/ci-quality.yml
- .github/workflows/pr-preview.yml
- .github/workflows/release.yml
- .github/workflows/storybook-deploy.yml
tags: []
tracker_refs: []
---

# Work Package Prompt: WP02 – Scaffold packages/elements and wire it into the build

Implements IC-01.

## Nothing builds this package by default — verified

`nx graph` shows **`storybook` with zero dependency edges**, even to `tokens`. So `apps/storybook/project.json`'s `dependsOn: ["^build"]` expands to nothing, and CI already compensates by hardcoding `--projects=tokens` at `ci-quality.yml:176`.

**Four** workflows hardcode project lists, not one:

| file | line |
|---|---|
| `.github/workflows/ci-quality.yml` | 176 |
| `.github/workflows/pr-preview.yml` | 19 |
| `.github/workflows/release.yml` | 30 |
| `.github/workflows/storybook-deploy.yml` | 38 |

nx derives project edges here from **workspace `package.json` declarations**, not imports — `styles → tokens` comes from a `peerDependencies` entry, not a TS import. So `packages/elements/package.json` must declare `@spec-kitty/styles`; that creates the edge *and* is required for the CSS input.

## Subtasks

- **T004** — Create the package: `package.json` (declaring **`lit@^3.3.3`** and **`@spec-kitty/styles`** — ADR-10 §2 leaves `lit` a bare specifier in `dist/index.js`, so a package that never declares it ships a broken import), `tsconfig*.json`, `project.json` with `build`, **`lint`** and `analyze` targets.
- **T005** — `project.json` must declare explicit `inputs` covering `{workspaceRoot}/packages/styles/src/**/*.css` and `outputs: ["{workspaceRoot}/packages/elements/dist"]`. Neither `styles` nor `tokens` declares outputs, so the shape being mirrored carries that hazard: without the input, editing `sk-stub.css` yields a cache hit and last build's output.
- **T006** — `eslint.config.mjs`: `scope:elements → ['scope:styles', 'scope:tokens']`, using this repo's **`scope:`-prefixed** tag vocabulary.
- **T007** — Add `packages/elements/**` to `ci-quality.yml`'s `components` filter, and add `elements` to all four workflows' project lists.

## Definition of Done

- [ ] `nx graph` shows an `elements → styles` edge (FR-001).
- [ ] A `lint` target exists — **without it `nx affected --target=lint` never lints the package and SC-010's depConstraints are enforced only by hand**.
- [ ] An import from `elements` to a package outside `styles`/`tokens` fails lint; demonstrate it (SC-010).
- [ ] Editing `packages/styles/src/stub/sk-stub.css` busts the elements build cache; demonstrate hit-then-miss.
- [ ] All four workflows build `elements` (FR-008).
- [ ] **SC-007 evidenced on a throwaway branch touching only `packages/elements/**`** — it cannot be shown on this mission's own PR, which necessarily touches `ci-quality.yml`, `scripts/**`, `nx.json` and the manifests, all already in the filter, so `components=true` regardless.

## Notes

The depConstraint governs **module imports only**. It cannot police the build script's `fs.readFileSync` of `packages/styles` — `eslint --print-config` resolves zero rules for `scripts/build-elements-css.mjs`. Do not claim otherwise in the PR.
