# Implementation Plan: Storybook Renderer and Angular Retirement

**Branch**: `mission/storybook-renderer-and-angular-retirement` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/storybook-renderer-and-angular-retirement-01M1HVX4/spec.md`

## Summary

Swap Storybook's framework binding from `@storybook/angular` to
`@storybook/web-components-vite`, replace the hand-written `webpackFinal` CSS rule
with Vite's native CSS handling, then delete Angular from the repository: the
package, the CLI project, the 10 Angular story files, 16 devDependencies, the
workflow project lists and the `angular` commitlint scope. Re-establish the visual
baseline set. Prove every remaining story renders using the accessibility gate
served over HTTP, rather than asserting it.

ADR-13 decides the renderer (Option B) and measured the load-bearing assumption:
the web-components renderer's `renderToCanvas` accepts a `string` assigned to
`innerHTML`, so the existing string-returning stories need no rewrite.

### Corrections to the brief, verified in this checkout

The issue body and ADR-13 were written before two changes that landed during this
same programme run. Both are recorded here so the plan works against the repository
as it is, not as those documents describe it.

| Brief says | Actually | Impact |
|---|---|---|
| Story files live in `packages/html-js` | **`packages/html-js` does not exist.** Renamed to `packages/styles` by #85 (`9255b2a`). The 13 story files are at `packages/styles/src/**`. | Path-only. Count confirmed: 13. |
| `main.ts`'s CSS rule is `include:`-scoped to `packages/html-js` | Already updated to `packages/styles` by #85. | No latent bug; ADR-13's description is stale, the code is correct. |
| 16 devDependencies to remove, enumerated as `@angular/*` / `zone.js` / `ng-packagr` / `@nx/angular` / `@storybook/angular` | The count 16 is right, but that enumeration yields only 13. The missing 3 are **`@angular-devkit/architect`, `@angular-devkit/build-angular`, `@angular-devkit/core`**. | Removing only the enumerated names leaves 3 behind and NFR-004 fails. |
| The axe HTTP repair "travels with this migration" | Already landed in #91 (`ce30b3e`); `scripts/run-axe-storybook.js` serves `http://127.0.0.1:<port>` with no `file://` navigation left. | Verify it still fails correctly against a Vite build (SC-006); do not re-implement. |

## Technical Context

**Language/Version**: TypeScript 5.x, Node 20+ (repo is an Nx monorepo)
**Primary Dependencies**: Storybook — range `^10.3.6` in `package.json`, **resolved 10.5.10** in the lockfile; target framework `@storybook/web-components-vite` pinned to the **resolved** version (10.5.10), not the range; Lit (arrives with #70, not this mission); Vite (via the Storybook framework package); Playwright (visual regression); `@axe-core/puppeteer` (accessibility gate)
**Storage**: N/A
**Testing**: Playwright visual regression (`apps/storybook/src/tests/visual.spec.ts`, 7 baselines), the axe accessibility gate (`scripts/run-axe-storybook.js`, HTTP-served, asserts component hosts mounted), and CI Quality (`.github/workflows/ci-quality.yml`)
**Target Platform**: Static Storybook build deployed to GitHub Pages
**Project Type**: single (Nx monorepo — `packages/{styles,tokens,angular}`, `apps/{storybook,demo}`)
**Performance Goals**: Storybook build under 3 minutes (NFR-001)
**Constraints**: No story content rewrites (NFR-003); no dependency residue (NFR-004); the accessibility gate may not weaken (C-005); `LightMode` must not be baselined over the open defect in #93 (C-004)
**Scale/Scope**: 13 retained story files (74 story exports), 10 deleted (57 exports), 16 devDependencies removed, 4 workflows, 7 baselines (4 retired; the 3 survivors are byte-identical blank frames, md5 `f642335856be21c8fb251d2dce35c383`)

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **`DIRECTIVE_046` (project override)** — the adversarial squad is a merge GATE here. Every dispatched lens must report before the merge decision, and evidence names the head SHA. Satisfied by the tier-B point-cuts below plus the non-negotiable pre-merge gate.
- **Squad tier B** (from #69): post-tasks and pre-merge only. No post-spec squad — the run prompt says "not more, not fewer".
- **ADR-13 governs the renderer choice** (C-001). This mission implements it and does not re-open it.
- **Conflict RESOLVED by the operator (2026-09-02)**: ADR-13 confirmation #3 ("LightMode variants still render correctly") contradicts open defect #93 (every `LightMode` story renders dark; `:root[data-theme="light"]` cannot match the wrapper `<div>` the stories use). Escalated on #69; the operator chose **scope `LightMode` out of this mission's exit criteria — #93 owns the fix**. Recorded as C-004 (Resolved) and in the decision ledger as `DM-01M1HXC6WQC90NK940WN2BXR9K`. Consequence for this mission: it must **not** claim "LightMode intact" at merge, and ADR-13's confirmation #3 cannot be ticked until #93 lands. ADR-13 should be amended by whoever fixes #93, not by this mission.

## Project Structure

### Documentation (this mission)

```
kitty-specs/storybook-renderer-and-angular-retirement-01M1HVX4/
├── spec.md          # authored
├── plan.md          # this file
└── tasks.md         # generated by `spec-kitty tasks`
```

### Source Code (repository root)

```
apps/storybook/.storybook/main.ts        # framework binding + webpackFinal CSS rule
apps/storybook/src/tests/visual.spec.ts  # + .ts-snapshots/ (7 baselines, 4 Angular-keyed)
packages/styles/src/**/*.stories.ts      # 13 retained story files (string-returning)
packages/angular/                        # DELETED (10 stories, ng-package.json)
packages/tokens/                         # unchanged
angular.json                             # DELETED
package.json                             # 16 devDependencies removed
commitlint.config.cjs                    # `angular` scope retired
scripts/run-axe-storybook.js             # MODIFIED by WP02 — delete UNRENDERABLE_IMPORT_PATTERN
apps/storybook/project.json              # MODIFIED by WP01 — `ng run` -> `storybook build`
apps/storybook/.storybook/preview.ts     # MODIFIED by WP01 — drops @storybook/angular import
apps/storybook/src/tests/smoke.spec.ts   # MODIFIED — deletes the Angular smoke test
eslint.config.mjs                        # scope:angular depConstraints
.github/workflows/ci-quality.yml         # packages/angular/** filter + build step
.github/dependabot.yml, .gitignore       # dead angular groups / negations
.github/workflows/{release,storybook-deploy,pr-preview}.yml   # project lists, dist audit, publish step, path triggers
```

**Structure Decision**: Single Nx monorepo, unchanged by this mission. The mission
removes one package (`packages/angular`) and re-points the Storybook app's builder;
it adds no new directory. The `stories` glob in `main.ts` is
`../../../packages/**/*.stories.@(ts|tsx)`, so deleting `packages/angular` removes
its stories from the catalogue without a glob edit.

### Known artifact caveat: `lanes.json` does not carry the dependency graph

`spec-kitty tasks` emits every lane with `"depends_on_lanes": []` and
`"parallel_group": 0`, while the WP frontmatter and `status.events.jsonl` both record a
strict `WP01 -> WP02 -> WP03 -> WP04` chain (`computed_from` nonetheless claims
`dependency_graph+ownership`). Any consumer honouring `depends_on_lanes` would dispatch
all four concurrently, which is impossible — WP02 needs WP01's build, and WP03 cannot
pass until WP02 deletes the gate's skip pattern.

**The WP frontmatter `dependencies` field is authoritative for this mission.** The file is
regenerated on every `tasks` run, so it is not hand-corrected here; the sequencing is
enforced by dispatching one WP at a time. Worth filing upstream.

## Complexity Tracking

*No Charter Check violations. Section intentionally empty.*

## Implementation Concern Map

### IC-01 — Renderer swap and CSS handling

- **Purpose**: Move the Storybook framework binding to `@storybook/web-components-vite` and let Vite handle CSS natively, so the catalogue renders custom elements without an Angular builder.
- **Relevant requirements**: FR-001, FR-002, NFR-001, NFR-003
- **Affected surfaces**: `apps/storybook/.storybook/main.ts`, `package.json` (add the framework package at the resolved Storybook version), `package-lock.json`, `apps/storybook/project.json`, `apps/storybook/.storybook/preview.ts`
- **Sequencing/depends-on**: none — this is the enabling change
- **Risks**: **Pin against the RESOLVED version (10.5.10), not the `^10.3.6` range.** An earlier draft of this plan asserted the installed line was 10.3.6 — it read the semver range as the version. The post-tasks squad falsified it: `node -p "require('./node_modules/storybook/package.json').version"` returns **10.5.10**, so issue #69's "10.5.x" was right. Installing a 10.3.6 framework against a 10.5.10 core is the straddle to avoid. Vite and webpack differ on CSS injection order, which is the stated reason baselines are re-shot rather than carried (IC-04). The `webpackFinal` hook and its `webpack` type import must go, or the config keeps a dependency on a builder that is no longer used.

### IC-02 — Prove the catalogue renders

- **Purpose**: Establish that every remaining story actually mounts under the new renderer, and that the accessibility gate still fails when one does not.
- **Relevant requirements**: NFR-002, NFR-003, SC-002, SC-003, SC-006
- **Affected surfaces**: `scripts/run-axe-storybook.js` (**modified** — see risks), `packages/styles/src/**/*.stories.ts`, the built Storybook
- **Sequencing/depends-on**: IC-01
- **Risks**: This is the concern that stops the migration silently no-opping the gate. The gate must be shown to fail on a deliberately broken story before its pass is treated as evidence — a passing gate that cannot fail proves nothing. **CORRECTED after the post-tasks squad — an earlier draft of this line had the polarity backwards.** `UNRENDERABLE_IMPORT_PATTERN = /\/packages\/(html-js|styles)\//` at `run-axe-storybook.js:41` **skips** every matching story (`:278-279`), so all 74 `packages/styles` story exports are currently OUTSIDE the gate; the `(html-js|styles)` alternation exists to keep skipping them across #85's rename, not to spare them. The gate today assesses 57 of 131 stories, all of them Angular ones WP03 deletes. The script names this mission as the one that must delete the skip (`:36-37`), and hard-exits 1 once `packages/angular` is gone (`:282-288`). **WP02 owns this file and must delete the pattern.** Separately, the mount assertion at `:186-195` filters on `^sk-` *tagNames*, which only Angular selectors have — post-deletion it matches zero elements and silently degrades to "the page is not entirely blank"; WP02 adds a class-based sibling check.

### IC-03 — Angular removal

- **Purpose**: Remove Angular from the repository entirely — package, CLI project, stories, dependencies, workflow project lists and commit scope.
- **Relevant requirements**: FR-003, FR-004, FR-005, FR-006, FR-007, NFR-004, SC-004
- **Affected surfaces**: `packages/angular/`, `angular.json`, `package.json`, lockfile, `commitlint.config.cjs`, `.github/workflows/{release,storybook-deploy,pr-preview}.yml`
- **Sequencing/depends-on**: IC-01 (the renderer must work before the builder it replaces is deleted)
- **Risks**: The 3 `@angular-devkit/*` packages are not named in the issue's enumeration and are the likely residue. `nx.json` / project graph may reference the deleted project. The workflows hardcode `projects=tokens,angular,html-js` — a string that names a package which was already renamed, so both `angular` and `html-js` are wrong there.

### IC-04 — Baseline re-establishment

- **Purpose**: Retire the baselines that die with the Angular stories and re-shoot the survivors under the renderer actually in use.
- **Relevant requirements**: FR-009, SC-005
- **Affected surfaces**: `apps/storybook/src/tests/visual.spec.ts-snapshots/` (7 files, 4 Angular-keyed)
- **Sequencing/depends-on**: IC-01, IC-03
- **Risks**: C-004 — re-shooting `LightMode` while #93 is live would freeze a known defect into the reference set. Any diff on the 3 survivors must be explained rather than accepted; a re-shot baseline that silently absorbs a rendering regression is worse than no baseline.

### IC-05 — Type-source correction

- **Purpose**: Point the story files' `Meta`/`StoryObj` type imports at `@storybook/web-components` instead of `@storybook/html`.
- **Relevant requirements**: FR-008
- **Affected surfaces**: `packages/styles/src/**/*.stories.ts`
- **Sequencing/depends-on**: IC-01
- **Risks**: Type-only imports are erased at build time, so this cannot be verified by "it builds" — it needs a typecheck. It is the one edit permitted to the retained story files under NFR-003, and must not drift into content changes.
