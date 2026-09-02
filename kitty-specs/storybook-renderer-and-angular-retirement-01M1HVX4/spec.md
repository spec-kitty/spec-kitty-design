# Mission Specification: Storybook Renderer and Angular Retirement

**Mission Branch**: `mission/storybook-renderer-and-angular-retirement`
**Created**: 2026-09-02
**Status**: Draft
**Input**: Issue #69 ([M3], part of epic #66), governed by ADR-13.

Move Storybook to the web-components renderer on Vite and remove Angular from the
repository entirely — package, builder, CLI project and polyfills — without
rewriting any existing story and without weakening the accessibility gate.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The catalogue builds and renders on the web-components renderer (Priority: P1)

A contributor runs the Storybook build. It compiles under
`@storybook/web-components-vite` instead of `@storybook/angular`, and every
remaining story renders its component — not an empty host.

**Why this priority**: This is the migration. Nothing else in the mission is
meaningful if the catalogue does not render, and every later element mission
(#70 onward) assumes this renderer is in place.

**Independent Test**: Build Storybook and run the accessibility gate against the
build over HTTP. The gate asserts each story's host actually mounted content, so
a build that renders nothing fails rather than passes silently.

**Acceptance Scenarios**:

1. **Given** `main.ts` configured with `@storybook/web-components-vite`, **When** the
   Storybook build runs, **Then** it completes successfully within three minutes.
2. **Given** the built Storybook, **When** the axe runner serves it over HTTP and
   visits every story, **Then** every story's component host contains rendered
   content and the story count matches the catalogue's index.
3. **Given** the 13 unmodified `packages/styles` story files, **When** the build runs,
   **Then** none of them required edits to render.

---

### User Story 2 - Angular is gone from the repository (Priority: P1)

A contributor inspects the repo and finds no Angular: no `packages/angular`, no
`angular.json`, no `@angular/*` / `zone.js` / `ng-packagr` / `@nx/angular` /
`@storybook/angular` dependencies, and no workflow or commitlint scope referring to
an Angular project.

**Why this priority**: Equal to Story 1 and deliberately separable from it. The
renderer swap is what *permits* the deletion; the deletion is what the mission is
for. Splitting them means a renderer regression cannot be confused with a deletion
regression.

**Independent Test**: Grep the repository and the lockfile for the retired names,
and run the four affected workflows' project lists against the actual package set.

**Acceptance Scenarios**:

1. **Given** the merged branch, **When** `package.json` is inspected, **Then** no
   `@angular/*`, `@angular-devkit/*`, `zone.js`, `ng-packagr`, `@nx/angular` or
   `@storybook/angular` entry remains, and the lockfile agrees.
2. **Given** the four workflows naming the `angular` project or filtering on `packages/angular/**`,
   **When** they run, **Then** they reference only packages that exist.
3. **Given** `commitlint.config.cjs`, **When** a commit uses the `angular` scope,
   **Then** it is rejected, because the scope has been retired.

---

### User Story 3 - The visual-regression baseline is honest again (Priority: P2)

A contributor runs the visual-regression suite and the baselines correspond to
stories that exist, shot under the renderer actually in use.

**Why this priority**: Lower than the migration itself because the suite can be
re-baselined after the renderer lands, but it must not be skipped — a baseline set
carried across a builder change is an assertion nobody checked.

**Independent Test**: Run the visual suite against the new build and confirm each
remaining baseline has a live story and was re-shot under Vite.

**Acceptance Scenarios**:

1. **Given** the 7 existing baselines, **When** the Angular stories are deleted,
   **Then** the 4 Angular-keyed baselines are removed with them.
2. **Given** the remaining 3 baselines, **When** the suite runs under the new
   builder, **Then** each has been re-shot rather than assumed stable, and any
   diff is explained rather than accepted.

---

### Edge Cases

- **The axe gate passes because nothing rendered.** A Vite build emits
  `<script type="module">`, which is CORS-blocked over `file://`. The runner must
  serve over HTTP and must assert mounting, not merely absence of violations.
  Verified precondition: the HTTP repair already landed in #91 — this mission
  confirms it still holds against a Vite build rather than re-implementing it.
- **CSS injection order differs between webpack and Vite.** The hand-written
  `style-loader`/`css-loader` rule scoped by `include:` is replaced by Vite's
  native CSS handling; component styles may load in a different order.
- **A story renders as an empty host.** The web-components renderer accepts a lit
  `TemplateResult`, a `string` assigned to `innerHTML`, and a `Node`. A story
  returning anything else mounts nothing.
- **`LightMode` stories.** ADR-13's confirmation #3 expects these to render
  correctly. Issue #93 reports that every `LightMode` story currently renders dark
  because `:root[data-theme="light"]` cannot match a `<div>`. Parity with a broken
  baseline is not a pass — see C-004.
- **Type imports point at the wrong package.** The story files import
  `Meta`/`StoryObj` from `@storybook/html`. Type-only imports are erased, so the
  build succeeds while the declared source is wrong.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Web-components renderer | As a contributor, I want Storybook configured with `@storybook/web-components-vite` so the catalogue renders custom elements without an Angular builder. | High | Open |
| FR-002 | Native CSS handling | As a contributor, I want the hand-written `webpackFinal` CSS rule replaced by Vite's native CSS handling so component styles load without a framework-scoped shim. | High | Open |
| FR-003 | Delete the Angular package and project | As a maintainer, I want `packages/angular`, `angular.json` and `packages/angular/ng-package.json` removed so Angular is not the catalogue's build system. | High | Open |
| FR-004 | Delete the Angular stories | As a maintainer, I want the 10 Angular story files removed so one story exists per component. | High | Open |
| FR-005 | Remove Angular dependencies | As a maintainer, I want the 16 `@angular/*`, **`@angular-devkit/*`**, `zone.js`, `ng-packagr`, `@nx/angular` and `@storybook/angular` devDependencies removed from `package.json` and the lockfile. | High | Open |
| FR-006 | Update the workflows | As a maintainer, I want `release.yml`, `storybook-deploy.yml` and `pr-preview.yml` to stop naming the deleted `angular` project — in the `--projects=` lists, in `release.yml`'s `for pkg in` dist audit, and in its `Publish @spec-kitty/angular` step — and `ci-quality.yml` / `storybook-deploy.yml` to stop filtering on `packages/angular/**`. | High | Open |
| FR-007 | Retire the `angular` commitlint scope | As a maintainer, I want the `angular` scope removed from `commitlint.config.cjs` so it cannot be used. | Medium | Open |
| FR-008 | Correct the story type imports | As a contributor, I want `Meta`/`StoryObj` imported from `@storybook/web-components` rather than `@storybook/html` so the declared type source matches the renderer. | Medium | Open |
| FR-009 | Re-establish the baseline set | As a contributor, I want the 4 Angular-keyed baselines retired and the remaining 3 re-shot under the new builder so the visual suite reflects reality. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Storybook build time | The full catalogue builds under `@storybook/web-components-vite` in under 3 minutes (NFR-003 of the programme). | Performance | High | Open |
| NFR-002 | Rendering proven, not asserted | Every remaining story is proven to render by the accessibility gate served over HTTP, which fails when a component host mounts no content. | Reliability | High | Open |
| NFR-003 | Zero story rewrites | The 13 `packages/styles` story files reach a rendering state with no content edits; only the type-import source (FR-008) may change. | Maintainability | High | Open |
| NFR-004 | No dependency residue | Zero matches for `@angular/`, `@angular-devkit/`, `zone.js`, `ng-packagr`, `@nx/angular`, `@storybook/angular` in `package.json`, the lockfile and the workflows. | Maintainability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | ADR-13 governs | The renderer choice is decided (Option B). This mission implements it and does not re-open it. | Technical | High | Open |
| C-002 | Storybook line | `@storybook/web-components-vite` must match the **resolved** Storybook version in the lockfile — currently **10.5.10**. `package.json` carries the range `^10.3.6`; the range is not the version. Pin against the resolved value, not the range. | Technical | High | Open |
| C-003 | Out of scope | The generated Angular wrapper (deferred to M15/#81), any element code, new component coverage beyond restoring baseline parity, and the consumer-facing documentation still describing `@spec-kitty/angular` (README, CLAUDE.md, llms.txt, llms-full.txt, `getting-started.mdx` — deferred to **#100** per DIRECTIVE_037) are excluded. | Technical | High | Open |
| C-004 | Do not baseline a known defect | `LightMode` stories are reported broken in #93 (`:root[data-theme="light"]` cannot match a `<div>`). Re-shooting a baseline over that defect would freeze it. If the defect is still live, report it and do not certify "LightMode intact" — ADR-13's confirmation #3 conflicts with #93 and the conflict is escalated, not silently resolved. | Technical | High | Open |
| C-005 | The a11y gate may not weaken | The gate's HTTP transport and mount assertion (landed in #91) must remain in force. A migration that makes the gate pass by rendering nothing is a failure of this mission, not a deferred issue. | Technical | High | Open |

### Key Entities

- **Storybook configuration** (`apps/storybook/.storybook/main.ts`): the framework
  binding and, currently, the hand-written CSS rule.
- **Story files**: 13 in `packages/styles` (retained, string-returning), 10 Angular
  (deleted).
- **Visual baselines** (`apps/storybook/src/tests/visual.spec.ts-snapshots/`): 7
  files, 4 Angular-keyed.
- **Accessibility gate** (`scripts/run-axe-storybook.js`): serves the build over
  HTTP and asserts component hosts mounted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Storybook build completes under `@storybook/web-components-vite`
  in under 3 minutes.
- **SC-002**: The accessibility gate, served over HTTP, visits every story in the
  catalogue index and reports zero unmounted component hosts.
- **SC-003**: Zero of the 13 `packages/styles` story files required a content
  rewrite to render.
- **SC-004**: Zero matches for `@angular/`, `@angular-devkit/`, `zone.js`, `ng-packagr`, `@nx/angular`
  and `@storybook/angular` across `package.json`, the lockfile and the three
  workflows; `packages/angular` and `angular.json` no longer exist.
- **SC-005**: The visual baseline set contains no baseline without a live story,
  and every retained baseline was re-shot under the new builder.
- **SC-006**: The accessibility gate demonstrably still fails when a story does not
  render — proven against the Vite build, not assumed from #91.
