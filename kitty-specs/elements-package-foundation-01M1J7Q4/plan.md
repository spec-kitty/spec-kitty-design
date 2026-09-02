# Implementation Plan: Elements Package Foundation

**Branch**: `mission/elements-package-foundation` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)
**Input**: `kitty-specs/elements-package-foundation-01M1J7Q4/spec.md`

## Summary

Create `packages/elements` — the ADR-8 custom-element base layer — containing exactly
one element (`sk-stub`), a CSS build that adopts `packages/styles`' existing `.css` as a
constructed stylesheet, two distribution artifacts (ESM with `lit` external, IIFE with
the runtime bundled), a guarded `customElements.define`, and the CEM analyzer. Then make
the two gates able to see it: teach the axe gate to pierce open shadow roots at all four
blind sites, and add `packages/elements/**` to CI's `components` path filter.

No component is migrated (C-003). The mission builds ground, not walls.

### Toolchain, verified in this checkout

| Need | Available | Note |
|---|---|---|
| Lit 3.3.x | **`lit@3.3.3` already resolved** | Transitive of `@storybook/web-components`. Promote to a direct devDependency; no new major, small lockfile delta. |
| Bundler for two artifacts | **`esbuild@0.28.1` resolvable** | Transitive of Vite. `@nx/js:tsc` (what `packages/styles` uses) cannot bundle or mark externals, so it cannot produce the IIFE artifact. |
| CEM analyzer | **not installed** | `@custom-elements-manifest/analyzer` must be added. |
| Package shape to mirror | `packages/styles/project.json` | `@nx/js:tsc` + assets; `elements` needs `nx:run-commands` around esbuild instead. |

## Technical Context

**Language/Version**: TypeScript 5.x, Node 22
**Primary Dependencies**: `lit@3.3.3` (promote to direct), `esbuild@0.28.1`, `@custom-elements-manifest/analyzer` (new)
**Storage**: N/A
**Testing**: The axe gate (`scripts/run-axe-storybook.js`), the Playwright suite (`playwright.config.ts` — already a required CI job), stylelint, eslint. **No unit-test runner exists in this repo**; #71 owns introducing one. This mission evidences via scripted probes and build-output inspection, and must not reach for a runner.
**Target Platform**: Modern browsers; the IIFE artifact must work from `file://` with no bundler and no server
**Project Type**: single (Nx monorepo — `packages/{styles,tokens,elements}`, `apps/{storybook,demo}`)
**Performance Goals**: none binding. NFR-001 records measured sizes with their basis rather than asserting a budget (the ADRs disagree 4×, and C-003 leaves only a stub to measure)
**Constraints**: ADR-8/9/10 govern (C-001, with ADR-9 still `Proposed`); open shadow roots (C-002); no migration (C-003); DSD deferred (C-004); `sk-stub`'s old markup stays and is tracked in #105 (C-006)
**Scale/Scope**: one new package, one element, two artifacts, four shadow-blind gate sites, one CI filter line

## Charter Check

*GATE: must pass before Phase 0 research. Re-check after Phase 1 design.*

- **`DIRECTIVE_046` (project override)** — the adversarial squad is a merge GATE. Tier A here: post-spec (done, folded in `1d53d86`), post-plan, post-tasks, pre-merge.
- **Run prompt §4** — no architectural decisions. ADR-8/9/10 decide the shadow policy, the styling API and distribution. Two gaps were found at post-spec and are **reported, not decided**: ADR-9's `Proposed` status (C-001) and the unowned ADR-9 lint obligation (now FR-010).
- **Never merge before the gate finishes** — all four lenses report before any merge decision, evidence pinned to the head SHA.
- **#105 is filed, not silent** — `sk-stub`'s hand-authored markup is owned by no migration mission.

## Project Structure

### Documentation (this mission)

```
kitty-specs/elements-package-foundation-01M1J7Q4/
├── spec.md          # authored, post-spec squad folded
├── plan.md          # this file
└── tasks/           # WP files
```

### Source Code (repository root)

```
packages/elements/                       # NEW
├── src/stub/sk-stub.ts                  # the element; adopts styles' CSS
├── src/index.ts                         # ESM entry  -> dist/index.js
├── src/elements.ts                      # IIFE entry -> dist/elements.js
├── src/define.ts                        # guarded customElements.define
├── project.json                         # nx:run-commands around esbuild
├── package.json, tsconfig*.json
└── custom-elements.json                 # CEM output

packages/styles/src/stub/sk-stub.css     # SOURCE OF RECORD — read, never copied
scripts/build-elements-css.mjs           # NEW: .css -> constructed-stylesheet module
scripts/run-axe-storybook.js             # MODIFIED: 4 shadow-blind sites
.github/workflows/ci-quality.yml         # MODIFIED: components filter + FR-009/010 steps
eslint.config.mjs                        # MODIFIED: scope:elements depConstraints
stylelint.config.mjs                     # MODIFIED: FR-010 rule scope
```

**Structure Decision**: One new package alongside `styles` and `tokens`. It does **not**
own component CSS — ADR-8 constraint 1 puts that in `@spec-kitty/styles`, and
`scope:elements → ['scope:styles','scope:tokens']` is what makes the cross-package read
legal and enforced. Storybook needs no config change: `main.ts` already globs
`../../../packages/**/*.stories.@(ts|tsx)`.

## Complexity Tracking

*No Charter Check violations.*

## Implementation Concern Map

### IC-01 — Package scaffold and boundaries

- **Purpose**: Create the package so the layer exists, with the dependency boundary enforced rather than documented.
- **Relevant requirements**: FR-001, SC-010
- **Affected surfaces**: `packages/elements/{package.json,project.json,tsconfig*.json}`, `eslint.config.mjs`, `nx.json`
- **Sequencing/depends-on**: none
- **Risks**: This repo's tags are `scope:`-prefixed (`scope:styles`, `scope:tokens`); the spec's first draft used bare names. FR-001 had no criterion until post-spec added SC-010 — without it the acceptance matrix carries a row nothing satisfies. `nx graph` may not create an edge from `storybook` to `elements`, since Storybook only globs stories rather than importing the package — **verify, do not assume**.

### IC-02 — CSS pipeline

- **Purpose**: Adopt `packages/styles`' existing `.css` as a constructed stylesheet without inlining it into TypeScript and without copying the file.
- **Relevant requirements**: FR-002, FR-009, FR-010, NFR-004, SC-002
- **Affected surfaces**: `scripts/build-elements-css.mjs`, `packages/elements/src/stub/`, `stylelint.config.mjs`, `.github/workflows/ci-quality.yml`
- **Sequencing/depends-on**: IC-01
- **Risks**: The likeliest drift in the mission. `static styles = css\`…\`` is Lit's default idiom and every tutorial shows it, while ADR-10 §1 forbids it — and **nothing today would catch the regression**: stylelint globs only `*.css`, no eslint rule inspects template literals. FR-009's check must exclude the *generated* module, which contains CSS text in JS by construction; an unscoped grep is either vacuous or a guaranteed false positive. Copying `sk-stub.css` into `packages/elements` would satisfy a naive SC-002 *and* stylelint while violating ADR-8 — hence "exactly one `sk-stub.css` in the repository".

### IC-03 — Distribution artifacts

- **Purpose**: Emit ESM (`lit` external) and IIFE (runtime bundled) per ADR-10 §2, at the paths downstream missions import.
- **Relevant requirements**: FR-003, FR-004, NFR-001, SC-001, SC-008, SC-009
- **Affected surfaces**: `packages/elements/project.json`, `src/index.ts`, `src/elements.ts`
- **Sequencing/depends-on**: IC-01, IC-02
- **Risks**: `@nx/js:tsc` cannot bundle or mark externals, so this needs `nx:run-commands` around esbuild — a different shape from `packages/styles`. Paths must be ADR-10 §2's `dist/index.js` and `dist/elements.js`; #71, #72 and #82 all import them. **A literal CDN load is #80's and is not performable here** — all three package names 404 on npm — so SC-001 tests SRI over HTTP, accepted with a matching hash and *rejected* with a wrong one, which `file://` cannot exercise at all. Without SC-008's Vite fixture nothing ever consumes the ESM artifact.

### IC-04 — Registry safety

- **Purpose**: Duplicate registration warns and no-ops instead of throwing (ADR-10 §5).
- **Relevant requirements**: FR-005, SC-003
- **Affected surfaces**: `packages/elements/src/define.ts`
- **Sequencing/depends-on**: IC-01
- **Risks**: Reachable in practice by loading both artifacts on one page. Bind the check to the existing Playwright job rather than "demonstrated" — a criterion only ever checked by hand stops being checked.

### IC-05 — Shadow-aware gates

- **Purpose**: Make the axe gate able to assess ADR-9 elements, without weakening it, and make CI actually run the component gates on element PRs.
- **Relevant requirements**: FR-007, FR-008, NFR-002, NFR-003, SC-005, SC-006, SC-007
- **Affected surfaces**: `scripts/run-axe-storybook.js`, `.github/workflows/ci-quality.yml`
- **Sequencing/depends-on**: IC-01 (needs a real element to test against)
- **Risks**: **The highest-risk concern in the mission.** Four blind sites, not one — root existential check, per-host check, `waitForFunction` predicate, and host enumeration. The wait and the assertion must change together; the file says so, #69 broke exactly that pairing, and a squad caught it. A minimal "shadow has a child" fix satisfies the obvious criterion while reopening five of six blank-render holes inside shadow trees — proven by a squad that built it. NFR-002's list must therefore run twice, light and shadow. A shadow-only element currently burns the full 8s `RENDER_TIMEOUT_MS` per story. **#104 collides here**: its proposed stylesheet-coverage arm reads `document.styleSheets`, which is empty for an adopted constructed stylesheet — whichever lands second must account for the other. SC-007 cannot be evidenced on this mission's own PR, which necessarily touches files already in the filter; it needs a throwaway branch.
