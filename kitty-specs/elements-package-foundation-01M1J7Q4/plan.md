# Implementation Plan: Elements Package Foundation

**Branch**: `mission/elements-package-foundation` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)
**Input**: `kitty-specs/elements-package-foundation-01M1J7Q4/spec.md`
**Post-plan squad folded**: 4 lenses, both pairs FOLD-FIRST.

## Summary

Create `packages/elements` — the ADR-8 custom-element base layer — containing exactly one
element (`sk-stub`), a CSS build that adopts `packages/styles`' existing `.css` as a
constructed stylesheet, two distribution artifacts (ESM with `lit` external, IIFE with the
runtime bundled), a guarded `customElements.define`, and the CEM analyzer. Then make the
gates able to see it: teach the axe gate to pierce open shadow roots at all four blind
sites, and wire `packages/elements` into CI's filter, build and lint paths.

No component is migrated (C-003).

### Toolchain, verified in this checkout

| Need | Status | Note |
|---|---|---|
| Lit 3.3.x | `lit@3.3.3` resolvable | A **peerDependency** of `@storybook/web-components`, npm-auto-installed — not an ordinary transitive. Promote to a root devDependency **and** declare it in `packages/elements/package.json` (peer or dependency): ADR-10 §2 leaves `lit` a bare specifier in `dist/index.js`, so a package that never declares it ships a broken import. |
| Bundler | `esbuild@0.28.1` resolvable | A hard dependency of `vite@7.3.6` (`^0.27.0 \|\| ^0.28.0`). **Declare it explicitly and pin it** — a Vite minor can float it and silently change this build (DIRECTIVE_051). Survives `npm ci --ignore-scripts`: `generateBinPath()` resolves the platform binary via `require.resolve` before the postinstall matters. |
| CEM analyzer | **not installed** | `@custom-elements-manifest/analyzer@0.11.0`, registry-reachable, 50 packages. New dependency — must clear the `security` and lockfile gates. |
| Executor | `nx:run-commands` around esbuild | `@nx/js:tsc`'s schema has no `bundle` and no `external`; `@nx/esbuild`/`@nx/rollup` are not installed. **Not novel**: `packages/tokens/project.json` already builds this way. |

Verified by building it: ESM (`lit` external) **1,019 B**, IIFE **23.3 KB**, zero bare
specifiers beyond `lit`, zero `import.meta`, zero `require()`.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 22
**Primary Dependencies**: `lit@3.3.3`, `esbuild@0.28.1`, `@custom-elements-manifest/analyzer@0.11.0`
**Storage**: N/A
**Testing**: the axe gate, the Playwright suite, stylelint, eslint. **No unit-test runner exists**; #71 owns introducing one. This mission evidences via scripted probes and build-output inspection.
**Target Platform**: modern browsers; the IIFE artifact must work from `file://` with no bundler and no server
**Project Type**: single (Nx monorepo — `packages/{styles,tokens,elements}`, `apps/{storybook,demo}`)
**Performance Goals**: none binding — NFR-001 records sizes, stated as **raw / minified / minified+gzip**
**Constraints**: C-001..C-006 in the spec
**Scale/Scope**: one package, one element, two artifacts, four gate sites, four CI workflows

### Settled by the post-plan squad — do not re-investigate

- **axe pierces open shadow roots.** axe-core 4.13.0 reported violations with nested targets `["#v","button"]` for content existing only in an open shadow root. The feared "green-by-emptiness one level below the mount assertion" **does not exist**. Do not spend a task on it.
- **The CSS pipeline works, and the light-DOM-selector worry was unfounded.** A generated `new CSSStyleSheet()` + `replaceSync(<real sk-stub.css>)` adopted by a Lit element loaded as an IIFE from `file://`: `adoptedStyleSheets: 1`, `<style>` count `0`, every `--sk-*` token resolved. The `.sk-stub` class selectors match inside the shadow root because the element's own template re-emits that markup — nothing has to match from outside.
- **SRI is demonstrable over plain HTTP**: matching `sha384` → upgraded; wrong hash → refused. No secure context needed, and `file://` cannot exercise it at all.
- **There is no fifth shadow-blind site** in `run-axe-storybook.js`.

## Charter Check

- **`DIRECTIVE_046`** — the squad is a merge GATE. Tier A: post-spec (folded `1d53d86`), post-plan (folded here), post-tasks, pre-merge.
- **Run prompt §4 — no architectural decisions.** Three gaps are **reported, not decided**:
  1. **ADR-9 is `Proposed`** while ADR-8/ADR-10 are Accepted, and C-002 plus all of FR-007 rest on it (C-001).
  2. **ADR-9 confirmation #1 is unowned** — no issue #70–#82 claims the elements-CSS lint rule.
  3. **ADR-8 and ADR-9 disagree about where component CSS lives.** ADR-8 constraint 1 puts it in `@spec-kitty/styles`; ADR-9 confirmation #1 assumes `packages/elements`. The previous draft of this plan silently resolved that in ADR-8's favour via the Structure Decision — which is what made FR-010 vacuous. That was an adjudication between two ADRs taken without a marker, in a mission that claims to take none. Now reported with the other two.
- **#105** (orphaned `sk-stub` markup) is filed. Note this mission **adds a third authoring site** — `sk-stub.html`, `SkStubHTML`, and now the element's `render()` — which is what #79's repo-wide assertion will trip on.

## Project Structure

```
packages/elements/                          # NEW
├── src/stub/sk-stub.ts                     # the element
├── src/stub/sk-stub.css.js                 # GENERATED + COMMITTED (see IC-02)
├── src/index.ts        -> dist/index.js    # ESM entry, lit external
├── src/elements.ts     -> dist/elements.js # IIFE entry, runtime bundled
├── src/define.ts                           # guarded customElements.define
├── src/stub/sk-stub.stories.ts             # the one permitted story (C-003)
├── custom-elements-manifest.config.mjs     # CEM config
├── custom-elements.json                    # GENERATED + COMMITTED
├── package.json  (declares lit + @spec-kitty/styles)
└── project.json  (build / lint / analyze targets, explicit inputs+outputs)

packages/styles/src/stub/sk-stub.css        # SOURCE OF RECORD — read, never copied
scripts/build-elements-css.mjs              # NEW: .css -> constructed-stylesheet module
apps/storybook/src/tests/elements-*.spec.ts # NEW: file:// + SRI + double-registration
fixtures/vite-consumer/                     # NEW: bundler fixture consuming dist/index.js
scripts/run-axe-storybook.js                # MODIFIED: 4 shadow-blind sites
.github/workflows/ci-quality.yml            # MODIFIED: filter, build, lint, checks
.github/workflows/{pr-preview,release,storybook-deploy}.yml  # MODIFIED: project lists
eslint.config.mjs                           # MODIFIED: scope:elements depConstraints
```

**Structure Decision**: `packages/elements` does **not** own component CSS — ADR-8
constraint 1 puts that in `@spec-kitty/styles`. The `scope:elements → ['scope:styles',
'scope:tokens']` depConstraint enforces the **module import** boundary only; it cannot
police a filesystem read, and `eslint --print-config` resolves **zero rules** for
`scripts/build-elements-css.mjs`. SC-010 tests the import boundary; the CSS read is a
build-script convention with no lint enforcement, and this plan says so rather than
implying otherwise.

## Complexity Tracking

*No Charter Check violations.*

## Implementation Concern Map

### IC-05 — Shadow-aware gate *(sequenced FIRST; depends on nothing)*

- **Purpose**: Teach the axe gate to see inside open shadow roots before any element exists, so the element lands into an already-capable gate.
- **Relevant requirements**: FR-007, NFR-002, NFR-003, SC-005, SC-006
- **Affected surfaces**: `scripts/run-axe-storybook.js`, throwaway shadow-DOM fixture stories
- **Sequencing/depends-on**: **none.** The previous draft made this depend on IC-01 "for a real element to test against" — wrong twice over: IC-01 creates only config, and the true relation was a *cycle* (the gate can't be red-first tested without a shadow element; a shadow element can't pass CI without the gate fix). `lit@3.3.3` already resolves and Storybook already globs `packages/**/*.stories.@(ts|tsx)`, so this WP defines its own throwaway shadow-only elements inside fixture stories. That is also the only way to get all six NFR-002 shapes as *the entire content of an open shadow root* without permanent stories violating C-003.
- **Risks**: Four blind sites — root check `:207`, per-host `:258`, wait predicate `:312-316`, host enumeration `:240-248`. **The trap is inside the fix**: every traversal helper must check `n.shadowRoot` **before** walking `n.childNodes`. A squad's first attempt descended into children's shadow roots but not the node's own, and rejected a correctly-rendered element with *"component host(s) rendered nothing: sk-thing"*. Adding that base case flipped all ten shapes correct in both DOMs. The wait and assertion must change together (`:311`, "if you change one, change both"). **#104 collides**: measured, `document.styleSheets.length === 0` while `shadowRoot.adoptedStyleSheets.length === 1`, so its proposed arm would fail every element story.

### IC-01 — Package scaffold, boundaries and build wiring

- **Purpose**: Create the package with enforced boundaries, and make the monorepo actually build it.
- **Relevant requirements**: FR-001, SC-010
- **Affected surfaces**: `packages/elements/{package.json,project.json,tsconfig*.json}`, `eslint.config.mjs`, `.github/workflows/{ci-quality,pr-preview,release,storybook-deploy}.yml`
- **Sequencing/depends-on**: none
- **Risks**: **`dependsOn: ["^build"]` is a proven no-op** — `nx graph` shows `storybook` with zero edges, even to `tokens`, and CI already compensates by hardcoding `--projects=tokens` at `ci-quality.yml:176`. **Four** workflows hardcode project lists (`ci-quality:176`, `pr-preview:19`, `release:30`, `storybook-deploy:38`) and all four need `elements`. nx builds edges from workspace **package.json** declarations here (`styles → tokens` comes from a `peerDependencies` entry, not an import), so `packages/elements/package.json` must declare `@spec-kitty/styles` — that both creates the edge and is required by finding 4. Declare explicit `inputs` covering `{workspaceRoot}/packages/styles/src/**/*.css` (otherwise editing the CSS yields a cache hit and last build's output) **and** `outputs: ["{workspaceRoot}/packages/elements/dist"]` — neither `styles` nor `tokens` declares outputs, so the shape being mirrored carries that hazard. The package **must** declare a `lint` target or `nx affected --target=lint` never lints it and SC-010's depConstraints are enforced only by hand.

### IC-02 — CSS pipeline

- **Purpose**: Adopt `packages/styles`' `.css` as a constructed stylesheet, without inlining into TypeScript and without copying the file.
- **Relevant requirements**: FR-002, FR-009, NFR-004, SC-002
- **Affected surfaces**: `scripts/build-elements-css.mjs`, `packages/elements/src/stub/{sk-stub.ts,sk-stub.css.js}`, `.github/workflows/ci-quality.yml`
- **Sequencing/depends-on**: IC-01
- **Risks**: **The generated module is committed under `src/`, not emitted to `dist/`.** This is forced: Vite/rollup cannot perform the transform (proven — it fails with *"no default export from a CSS import"* on the same source esbuild handles), and `dist/` is gitignored, so a fresh CI clone would have no CSS and `storybook-build` would fail. Committing it also **dissolves FR-009's exclusion problem**: scoping the no-CSS-in-TS check to `packages/elements/**/*.ts` excludes the generated `.js` by construction rather than by an exception list. A regeneration check is then owed (ADR-10's generated-artifact contract). Bind SC-002 to ADR-10 Confirmation #1's two literal assertions — `adoptedStyleSheets.length === 1` **and** `shadowRoot.querySelectorAll('style').length === 0` — because a naive `import './x.css'` through esbuild's CSS loader injects a `<style>` tag and would satisfy a loosely-worded criterion while breaking the CSP guarantee. Copying `sk-stub.css` into `packages/elements` would pass a naive check *and* stylelint while violating ADR-8; hence "exactly one `sk-stub.css` in the repository".

### IC-03 — Distribution artifacts

- **Purpose**: Emit ESM and IIFE at the paths downstream missions import, and prove both are consumable.
- **Relevant requirements**: FR-003, FR-004, NFR-001, SC-001, SC-008, SC-009
- **Affected surfaces**: `packages/elements/{project.json,src/index.ts,src/elements.ts}`, `fixtures/vite-consumer/`, `apps/storybook/src/tests/elements-load.spec.ts`
- **Sequencing/depends-on**: IC-01, IC-02
- **Risks**: Paths must be ADR-10 §2's `dist/index.js` / `dist/elements.js` — #71, #72 and #82 import them. A literal CDN load is **#80's** and is not performable (all three package names 404 on npm); SC-001 tests SRI over HTTP instead, accepted with a matching hash and **rejected** with a wrong one. Without SC-008's Vite fixture nothing ever consumes the ESM artifact. **NFR-001's basis**: record raw / minified / minified+gzip per artifact. The previous draft recorded minified figures labelled raw and concluded the measurements "reconcile with ADR-8 and not ADR-10" — that is **inverted**. Measured: IIFE 22.8 KB raw, 15.2 KB minified, 5.9 KB min+gzip. ADR-10 §2's ~26 KB ≈ **unminified raw**; ADR-8's ~6 KB ≈ **minified+gzip**. The ADRs do not disagree; the basis was missing.

### IC-04 — Registry safety

- **Purpose**: Duplicate registration warns and no-ops instead of throwing (ADR-10 §5).
- **Relevant requirements**: FR-005, SC-003
- **Affected surfaces**: `packages/elements/src/define.ts`, `apps/storybook/src/tests/elements-load.spec.ts`
- **Sequencing/depends-on**: IC-01
- **Risks**: **This concern silently breaks FR-006 and must be designed with IC-06.** The guarded helper is exactly the indirection the CEM analyzer cannot follow — see IC-06. Bind SC-003 to the Playwright job rather than "demonstrated": `playwright.config.ts` serves only `storybook-static`, so a two-artifact page needs either a `staticDirs` entry or a `page.goto('file://…')` spec.

### IC-06 — Custom Elements Manifest *(new; FR-006/SC-004 had no owner)*

- **Purpose**: Emit `custom-elements.json` describing `sk-stub`, correctly.
- **Relevant requirements**: FR-006, SC-004
- **Affected surfaces**: `packages/elements/{custom-elements-manifest.config.mjs,custom-elements.json,project.json}`, `.github/workflows/ci-quality.yml`
- **Sequencing/depends-on**: IC-01, IC-04
- **Risks**: **Measured, not predicted** (analyzer 0.11.0, three variants): with the ADR-10 §5 guarded `define()`, the class's `tagName` is `undefined` and no `custom-element-definition` attaches to the element — instead `define.ts` emits an entry literally named **`tag`**. A plain `customElements.define('sk-stub', SkStub)` resolves correctly. This is not local: **ADR-11 generates the React wrapper from this manifest** and ADR-9 confirmation #2 verifies `::part()` through it. Mitigation: mandatory `@element <tag>` JSDoc plus an assertion that `custom-elements.json` contains no definition named `tag`, or a CEM plugin that follows the guarded helper. `custom-elements.json` is a committed generated file and needs a CI regeneration check.

### IC-07 — Elements CSS lint rule *(ADR-9 confirmation #1)*

- **Purpose**: Reject `:root`, `html`, `body`, `:host-context()` in the CSS backing elements.
- **Relevant requirements**: FR-010
- **Affected surfaces**: `stylelint.config.mjs`
- **Sequencing/depends-on**: IC-02
- **Risks**: **The stated scope matches zero files, and the only meaningful scope turns `lint-code` red.** `packages/elements` holds no `.css` (the Structure Decision puts it in `styles`), so a rule over `packages/elements/**/*.css` is vacuous. Re-scoped to `packages/styles/**/*.css` it immediately fails four selectors this mission may not touch — `packages/styles/src/card/sk-card.css:57,61,66,70`, the exact "1 of 14" ADR-9 §3 measured — and `quality:stylelint` globs `packages/**/*.css`, so that is a hard merge block. `stylelint.config.mjs` is also flat with no `overrides` block, so any scoping is new structure. **Disposition required before implementation**: either (a) defer FR-010 to #72 with the ADR-9 criterion explicitly recorded unmet, or (b) land it now over a per-component allowlist (today `packages/styles/src/stub/*.css`) naming `sk-card.css` as a known violation tied to its migration issue. Take this to the operator rather than deciding it in a WP.

### Cross-cutting

- **`ci-quality.yml` is touched by IC-01, IC-02, IC-06 and IC-05.** Sequence those edits or land them in one WP; the previous draft flagged only the cross-mission conflict (C-005, #69) and not this within-mission one.
- **Single PR.** The WP order works only if the mission lands as one PR: an intermediate commit carrying a shadow-only story with an unfixed gate is a red `a11y` job, and green CI is a merge precondition. IC-05 sequenced first makes this safe.
- **Story ownership**: the one permitted element story (C-003) is authored in **IC-05**, with the gate fix — not in IC-01 or IC-02.
