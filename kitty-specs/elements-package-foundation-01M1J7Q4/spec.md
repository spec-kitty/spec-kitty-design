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
2. **Given** the IIFE artifact, **When** it is loaded from a `file://` page, **Then** the
   element upgrades with no server and no bundler.
3. **Given** the IIFE artifact served over HTTP with an `integrity` attribute, **When**
   the hash matches, **Then** it executes; **When** the hash is wrong, **Then** the
   browser refuses it. (A real CDN load belongs to #80 — nothing is published yet.)
4. **Given** a component's `.css` file, **When** the build runs, **Then** the CSS
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
the gate fails it. Measured: a shadow-only element fails at the ROOT existential check
(`run-axe-storybook.js:207`) with *"story wrappers mounted but the component did not"*,
not at the per-host check — which is why the two obvious one-line fixes (piercing
`el.shadowRoot` on the host) do not even satisfy scenario 1.

The citable prior art is in the gate's own source (`run-axe-storybook.js:156-162`): a
registration-based detector removed in #90, marked *"worth reinstating … when ADR-8
makes these real custom elements."* An earlier draft credited the #102 pre-merge squad;
that prediction was made in a private lens report and appears nowhere in the PR's
public record, so the citation is withdrawn.

**Independent Test**: Story a trivial Lit element with an open shadow root whose only
content is in the shadow tree; the gate must pass it, and must still fail when the
shadow tree is empty.

**Acceptance Scenarios**:

1. **Given** an element rendering only into its open shadow root, **When** the axe gate
   runs, **Then** it reports the story as rendered.
2. **Given** each of the six NFR-002 shapes placed as the ENTIRE content of an open
   shadow root, **When** the gate runs, **Then** each still fails. An empty shadow tree
   alone is not sufficient: a squad built the plausible minimal fix ("content = text,
   media, or a shadow root with any child element") and it satisfied both an
   empty-shadow criterion and all six light-DOM shapes while letting five of the six
   through inside a shadow root.
3. **Given** a component block inside a shadow root that rendered nothing, alongside a
   sibling in that shadow root that has text, **When** the gate runs, **Then** it fails
   — host enumeration must pierce too, not just the content test.
4. **Given** the existing 74 light-DOM stories, **When** the gate runs, **Then** the
   per-story result lines are unchanged.

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
  added `tsconfig.base.json`) and merged first. Already rebased; the filter now lists
  ten patterns and neither `packages/angular/**` nor `packages/html-js/**`.
- **#104 collides with FR-007 in the same function.** #104 proposes failing when an
  `sk-<block>` class matches no selector in `document.styleSheets`. A shadow root's
  adopted stylesheet reports `adoptedStyleSheets.length === 1` while
  `document.styleSheets` yields zero selectors — so #104's fix, applied after this
  mission, would fail every element story. Whichever lands second must account for the
  other.
- **`sk-stub` markup is orphaned.** `packages/styles/src/stub/` ships a hand-authored
  `sk-stub.html` and a `SkStubHTML` template literal. ADR-10 §3 says static `.html`
  becomes generated output — but #72/#73/#74/#77/#78/#79 own 12 components between
  them and **`stub` is in none of them**, while #79 closes with a repository-wide
  assertion that no component markup is authored twice. See C-006.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Scaffold the package | As a contributor, I want `packages/elements` on Lit 3.3.x with nx tags and eslint `depConstraints` using this repo's actual vocabulary — `scope:elements` → `['scope:styles', 'scope:tokens']`, matching `eslint.config.mjs`'s existing `scope:`-prefixed tags — so the layer exists with enforced boundaries. | High | Open |
| FR-002 | CSS build to constructed stylesheet | As a contributor, I want the build to read **`packages/styles/src/<name>/<name>.css` — the single source of record per ADR-8 constraint 1 — and emit a module constructing a `CSSStyleSheet`, so CSS is authored once, never inlined into TypeScript, and stylelint keeps binding (ADR-10 §1). Copying the `.css` into `packages/elements` is a violation, not an implementation. | High | Open |
| FR-003 | ESM artifact | As a consumer, I want an ESM build with `lit` left external so bundlers dedupe the runtime. | High | Open |
| FR-004 | IIFE artifact | As a no-build consumer, I want a self-contained classic script carrying the Lit runtime, loadable from `file://`, and servable over HTTP with a matching `integrity` attribute (and REJECTED with a wrong one). A literal CDN load is #80's — all three package names still 404 on npm, so nothing is publishable from here. | High | Open |
| FR-005 | Guarded registration | As a consumer, I want `customElements.define` to warn and no-op on a duplicate tag rather than throw (ADR-10 §5). | High | Open |
| FR-006 | CEM analyzer | As a tooling consumer, I want `custom-elements.json` emitted by the analyzer. | Medium | Open |
| FR-007 | Shadow-aware render check — assertion, wait AND host enumeration | As a contributor, I want `scripts/run-axe-storybook.js` to treat content inside an **open** shadow root as rendered content, so ADR-9 elements are assessable, without weakening it for light-DOM components. This covers **four** shadow-blind sites, not one: the root existential check (`:207`), the per-host content check (`:258`), **the `waitForFunction` predicate (`:312-316`)**, and **host enumeration** (`hostsByTag`/`hostsByClass`, `:240-248`). The file's own comment says *"If you change one, change both"* — #69 broke exactly that pairing and a squad caught it. | High | Open |
| FR-008 | Elements in the CI components filter | As a maintainer, I want `packages/elements/**` in `ci-quality.yml`'s `components` path filter so element PRs cannot merge with the component gates skipped. | High | Open |
| FR-009 | Enforced no-CSS-in-TypeScript check | As a maintainer, I want a CI-enforced check that `packages/elements` source contains no ``css` `` tagged template and no inlined stylesheet text, with a red-first test — because ADR-10 §1 forbids it, `static styles = css\`…\`` is Lit's default idiom, and today nothing would catch the regression: stylelint globs only `*.css` and no eslint rule touches template literals. | High | Open |
| FR-010 | Elements CSS lint rule (ADR-9 confirmation #1) — **scope undecided, operator call** | ADR-9 requires a rule rejecting `:root`, `html`, `body`, `:host-context()` in elements CSS, and no issue #70–#82 claims it. **The justification in this row's earlier draft — "this mission creates the CSS surface it applies to" — is false**: the Structure Decision puts component CSS in `packages/styles`, so `packages/elements/**/*.css` matches zero files. The only meaningful scope (`packages/styles/**/*.css`) immediately fails four selectors this mission may not touch (`sk-card.css:57,61,66,70` — the "1 of 14" ADR-9 §3 measured), and `quality:stylelint` globs `packages/**/*.css`, so it is a hard merge block. Disposition — defer to #72, or allowlist per component — is escalated, not decided here. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Artifact sizes recorded, not budgeted | Record **raw / minified / minified+gzip** for both artifacts, as the baseline the batch missions are held to. A budget is premature: C-003 forbids migrating a component, so the only artifact is a stub. **The ADRs do not disagree — the basis was missing.** Source of record for the numbers is `packages/elements/SIZES.md`, generated by `scripts/measure-elements-sizes.mjs` and kept current by CI. Figures are NOT repeated here: this line previously carried 22.8 / 15.2 / 5.9 KB and ESM 1.0 KB, which were superseded, and the mission then carried four mutually inconsistent size tables at once — on different bases, units and components. One generated source, cited. ADR-10 §2's ~26 KB for one component ≈ **unminified raw**; ADR-8's ~6 KB runtime ≈ **minified+gzip**. An earlier draft recorded the minified figures as "raw" and concluded they contradicted ADR-10; that was inverted and is withdrawn. | Performance | Medium | Open |
| NFR-002 | Gate strength preserved, in BOTH DOMs | After FR-007 the six red-first shapes — empty story, wrapper-only, empty `<svg>`, `<img alt="">`, empty `[aria-label]`, BEM-element-only host — still fail **twice over**: once in light DOM (verified all six fail at the train tip today) and once as the entire content of an open shadow root. The light-DOM list alone cannot detect the only failure mode FR-007 can introduce, because none of its six shapes contains a shadow root. | Reliability | High | Open |
| NFR-003 | No regression for existing stories | The 74 light-DOM stories produce identical **per-story result lines** before and after FR-007, after normalising the ephemeral `127.0.0.1:\d+` port in line 1. Note what this cannot do: all 74 pass today, so comparing green against green detects only a change that makes something FAIL — it is structurally incapable of detecting weakening. NFR-002 is the weakening guard, not this. | Reliability | Medium | Open |
| NFR-004 | CSS stays lintable | `.css` files remain real files under stylelint; zero CSS is inlined into `.ts` source. | Maintainability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | ADR-8/9/10 govern — with ADR-9's status flagged | This mission implements them and does not re-open them. **ADR-8 and ADR-10 are `Accepted (ratified by the operator)`; ADR-9 is still `Proposed`** — and C-002 plus all of FR-007 rest on ADR-9 §1. The programme already implements Proposed ADRs (#69 implemented ADR-13), so this is bookkeeping, not a blocker — but the spec must not assert a status the record does not carry. Reported on #70 for the operator; this mission does not edit ADRs (run prompt §4). | Technical | High | Open |
| C-002 | Open shadow roots | Every component uses an **open** root (ADR-9 §1). FR-007 depends on this: a closed root is unreachable from the gate, and choosing one would make elements permanently unassessable. | Technical | High | Open |
| C-003 | No component migration | No existing component is ported and no element story beyond the minimum needed to prove FR-007. Migration is #72 and the batches. | Technical | High | Open |
| C-004 | Declarative Shadow DOM deferred | ADR-10 §4 defers DSD. Do not implement it here. | Technical | High | Open |
| C-005 | Rebase before touching `ci-quality.yml` | #69 merged first and changed the same block. Rebase onto the train tip and re-run the gate rather than resolving a stale conflict. **Already satisfied** — the branch is 0 behind `origin/train/elements-first`. Note #70's own body is stale here: it describes the pre-#69 filter. | Technical | Medium | Open |
| C-006 | `sk-stub` is the element, and its old markup is orphaned | #70 says "exactly one element: `sk-stub`". `packages/styles/src/stub/` already ships hand-authored `sk-stub.html` and `SkStubHTML`, which ADR-10 §3 requires to become generated output — but no migration mission owns `stub` (#72/#73/#74/#77/#78/#79 cover 12 components; `stub` is in none), and #79 ends with a repo-wide "no markup authored twice" assertion that will trip on it. This mission does NOT migrate it (C-003), but must not leave the landmine undeclared: filed as **#105**; disposition is that #70 does not migrate it. | Technical | High | Open |

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
- **SC-002**: `sk-stub`'s CSS reaches the element as a constructed stylesheet read from
  `packages/styles/src/stub/sk-stub.css`, and the repository contains **exactly one**
  `sk-stub.css`. The no-inlining check is FR-009's enforced CI step, not a one-off
  grep, and it excludes the build's *generated* module — which contains CSS text in JS
  by construction, so an unscoped grep is either vacuous or a guaranteed false
  positive.
- **SC-003**: Loading both artifacts on one page logs a warning and does not throw.
- **SC-004**: `custom-elements.json` is emitted and describes the scaffolded element.
- **SC-005**: An element story whose content lives only in an open shadow root passes
  the axe gate, AND each of NFR-002's six shapes fails when it is the entire content of
  an open shadow root, AND an empty `sk-*` block inside a shadow root fails even when a
  sibling in that shadow root has text. All eight cases demonstrated with exit codes.
  The single "empty shadow tree" case is explicitly NOT sufficient: a squad built the
  minimal fix that satisfies it and five of the six shapes still passed.
- **SC-006**: The per-story result lines over the 74 existing stories are identical
  before and after FR-007, after normalising the ephemeral port.
- **SC-008**: `sk-stub` renders in **Storybook** and in a **bundler fixture** (Vite)
  consuming the ESM artifact — #70 requires both, and without the fixture nothing ever
  consumes FR-003's output.
- **SC-009**: The build emits the ADR-10 §2 paths (`dist/index.js`, `dist/elements.js`)
  — #71, #72 and #82 all import them.
- **SC-010**: `nx graph` shows `scope:elements` tagged and the `depConstraints`
  enforced: an import from `elements` to a package outside `styles`/`tokens` fails
  lint. (FR-001 otherwise has no criterion at all.)
- **SC-007**: A **throwaway branch touching only `packages/elements/**`** reports
  `components=true`, evidenced by the `changes` job log. It cannot be demonstrated on
  this mission's own PR: that PR necessarily touches `ci-quality.yml` and `scripts/**`,
  both already in the filter, so `components=true` regardless of FR-008.
