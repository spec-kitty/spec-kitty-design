# Mission Specification: Elements Package Foundation

**Mission Branch**: `mission/elements-package-foundation`
**Created**: 2026-09-03
**Status**: Draft
**Input**: Issue #70 ([M4], part of #66), governed by ADR-8, ADR-9 and ADR-10.

Scaffold `packages/elements` — the custom-element base layer — with the CSS build,
both distribution artifacts, guarded registration and the CEM analyzer. No component
is migrated here and no story is authored here; this mission builds the ground the
later missions stand on.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The package exists and builds both artifacts (Priority: P1)

A contributor builds `packages/elements` and gets two first-class outputs per ADR-10
§2: an ESM build with `lit` left external, and a self-contained classic/IIFE script
carrying the Lit runtime, loadable from `file://` and from a CDN.

**Why this priority**: It is the mission. Every later element mission (#71 onward)
consumes these artifacts.

**Independent Test**: Build the package; load the IIFE bundle from a `file://` page
with no bundler and confirm a registered element upgrades.

**Acceptance Scenarios**:

1. **Given** the scaffolded package, **When** the build runs, **Then** it emits an ESM
   artifact with `lit` external and an IIFE artifact with the runtime inlined.
2. **Given** the IIFE artifact, **When** it is loaded from a `file://` page and from a
   CDN URL with an integrity hash, **Then** the element upgrades and renders in both.
3. **Given** a component's `.css` file, **When** the build runs, **Then** the CSS
   reaches the element as a constructed stylesheet **without** being inlined into
   TypeScript (ADR-10 §1), and the `.css` remains a real file that stylelint lints.

---

### User Story 2 - The accessibility gate can see inside shadow roots (Priority: P1)

A contributor adds an element story and the axe gate assesses it correctly, rather
than reporting that it did not render.

**Why this priority**: Equal to Story 1, and the reason it is a *story* rather than a
footnote. ADR-9 §1 makes **open shadow roots mandatory for every component**, and
`scripts/run-axe-storybook.js` decides "did this render" with `el.textContent` and
`el.querySelector(...)` — **neither pierces a shadow root**. An attribute-driven
element (`<sk-input label="Email">`) has no light-DOM text and no light-DOM child, so
the gate reports `component host(s) rendered nothing` on a component that rendered
perfectly. This was predicted by the #102 pre-merge squad and lands here first.

**Independent Test**: Story a trivial Lit element with an open shadow root whose only
content is in the shadow tree; the gate must pass it, and must still fail when the
shadow tree is empty.

**Acceptance Scenarios**:

1. **Given** an element rendering only into its open shadow root, **When** the axe gate
   runs, **Then** it reports the story as rendered.
2. **Given** an element whose shadow tree is empty, **When** the gate runs, **Then** it
   still fails — piercing must not become a blanket pass.
3. **Given** the existing 74 light-DOM stories, **When** the gate runs, **Then** output
   is unchanged.

---

### User Story 3 - Element PRs are actually gated in CI (Priority: P1)

A PR touching only `packages/elements` runs the component gates instead of skipping
them.

**Why this priority**: #70 names this a mandatory work package. Without it every
elements PR merges green with a11y, visual regression and Playwright all skipped.

**Independent Test**: A branch changing only a file under `packages/elements/` shows
`components=true` and the component jobs executing, not `skipped`.

**Acceptance Scenarios**:

1. **Given** a PR touching only `packages/elements/**`, **When** CI runs, **Then**
   `changes.outputs.components` is `true` and `storybook-build`, `a11y`,
   `visual-regression` and `playwright` all execute.

---

### Edge Cases

- **Duplicate registration.** Two bundles on one page, or the ESM and IIFE artifacts
  together, must warn and no-op rather than throw (ADR-10 §5).
- **`file://` loading.** The IIFE artifact must not assume a module context, a bundler
  or a server.
- **CSS that stylelint cannot see.** If the build inlines CSS into TypeScript, SK-D01
  stops binding — explicitly rejected by ADR-10 §1.
- **The gate piercing too far.** Making the mount assertion shadow-aware must not turn
  it into a blanket pass; the empty-shadow case must still fail.
- **`ci-quality.yml` collision.** #69 changed this file (dropped `packages/angular/**`,
  added `tsconfig.base.json`) and merged first. This mission edits the same block.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Scaffold the package | As a contributor, I want `packages/elements` on Lit 3.3.x with nx tags and eslint `depConstraints` (`elements` → `styles` + `tokens`) so the layer exists with enforced boundaries. | High | Open |
| FR-002 | CSS build to constructed stylesheet | As a contributor, I want the build to read a linted `.css` and emit a module constructing a `CSSStyleSheet`, so CSS is never inlined into TypeScript and stylelint keeps binding (ADR-10 §1). | High | Open |
| FR-003 | ESM artifact | As a consumer, I want an ESM build with `lit` left external so bundlers dedupe the runtime. | High | Open |
| FR-004 | IIFE artifact | As a no-build consumer, I want a self-contained classic script carrying the Lit runtime, loadable from `file://` and from a CDN with an integrity hash. | High | Open |
| FR-005 | Guarded registration | As a consumer, I want `customElements.define` to warn and no-op on a duplicate tag rather than throw (ADR-10 §5). | High | Open |
| FR-006 | CEM analyzer | As a tooling consumer, I want `custom-elements.json` emitted by the analyzer. | Medium | Open |
| FR-007 | Shadow-aware mount assertion | As a contributor, I want `scripts/run-axe-storybook.js` to treat content inside an **open** shadow root as rendered content, so ADR-9 elements are assessable — without weakening it for light-DOM components. | High | Open |
| FR-008 | Elements in the CI components filter | As a maintainer, I want `packages/elements/**` in `ci-quality.yml`'s `components` path filter so element PRs cannot merge with the component gates skipped. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | IIFE bundle size | The self-contained artifact stays within a stated budget of the ~26 KB ADR-10 measured for one component with the Lit runtime; the ESM artifact within ~3.2 KB per component. | Performance | Medium | Open |
| NFR-002 | Gate strength preserved | After FR-007, the gate's existing red-first cases still fail: empty story, wrapper-only, empty `<svg>`, `<img alt="">`, empty `[aria-label]`, and a BEM-element-only host. | Reliability | High | Open |
| NFR-003 | No regression for existing stories | The 74 light-DOM stories produce byte-identical gate output before and after FR-007. | Reliability | High | Open |
| NFR-004 | CSS stays lintable | `.css` files remain real files under stylelint; zero CSS is inlined into `.ts` source. | Maintainability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | ADR-8/9/10 govern | Shadow-DOM policy, the styling API, distribution and canonical markup are decided. This mission implements them and does not re-open them. | Technical | High | Open |
| C-002 | Open shadow roots | Every component uses an **open** root (ADR-9 §1). FR-007 depends on this: a closed root is unreachable from the gate, and choosing one would make elements permanently unassessable. | Technical | High | Open |
| C-003 | No component migration | No existing component is ported and no element story beyond the minimum needed to prove FR-007. Migration is #72 and the batches. | Technical | High | Open |
| C-004 | Declarative Shadow DOM deferred | ADR-10 §4 defers DSD. Do not implement it here. | Technical | High | Open |
| C-005 | Rebase before touching `ci-quality.yml` | #69 merged first and changed the same block. Rebase onto the train tip and re-run the gate rather than resolving a stale conflict. | Technical | High | Open |

### Key Entities

- **`packages/elements`**: the new package — Lit elements, their `.css`, the build.
- **`scripts/run-axe-storybook.js`**: the accessibility gate; FR-007 changes its mount
  assertion.
- **`.github/workflows/ci-quality.yml`**: the `components` path filter (FR-008).
- **Build artifacts**: ESM (external `lit`) and IIFE (bundled runtime).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both artifacts build; the IIFE one upgrades an element from a `file://`
  page with no server and no bundler, demonstrated.
- **SC-002**: A component's CSS reaches the element as a constructed stylesheet, and
  `grep` finds no CSS text inlined in any `.ts` source.
- **SC-003**: Loading both artifacts on one page logs a warning and does not throw.
- **SC-004**: `custom-elements.json` is emitted and describes the scaffolded element.
- **SC-005**: An element story whose content lives only in an open shadow root passes
  the axe gate; the same story with an empty shadow tree fails it. Both demonstrated.
- **SC-006**: Gate output over the 74 existing stories is byte-identical before and
  after FR-007.
- **SC-007**: A branch touching only `packages/elements/**` reports `components=true`
  and runs the component jobs.
