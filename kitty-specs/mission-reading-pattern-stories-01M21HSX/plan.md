# Implementation Plan: Mission Reading pattern stories

**Mission**: `mission-reading-pattern-stories-01M21HSX`  
**Branch / merge target**: `train/elements-first`  
**Spec**: `kitty-specs/mission-reading-pattern-stories-01M21HSX/spec.md`  
**Issue**: spec-kitty/spec-kitty-design#265

## Summary

Add one Storybook pattern family that proves every reviewed Team Kitty Mission Reading state can
be composed from the train's public elements, CSS families, and native HTML. A single deeply
frozen fixture supplies repeated mission, git, catalogue, artifact, Ops, observed, and live data;
pure projections select each state without fetching, routing, timers, or inferred truth. Focused
browser, axe, composition-boundary, and visual tests plus the design-system usage guide make that
proof durable. No new component, token, dependency, or application behavior is introduced.

## Technical Context

**Language/Version**: TypeScript 5, Lit 3, Storybook 10 web components, Node as pinned by the
repository.  
**Primary Dependencies**: existing public `@spec-kitty/elements` exports and
`@spec-kitty/styles`; no new package dependency.  
**Storage / services**: none. The fixture is static authored test data.  
**Testing**: Vitest browser and node projects, Playwright Storybook and visual suites, axe,
composition-boundary and generated-artifact gates, mutation and package gates.  
**Target**: the repository's supported modern browsers and static Storybook build.  
**Performance**: keep the Storybook build inside the repository's three-minute ceiling; stories
perform no I/O, polling, parsing, or timers.  
**Scope**: one pattern story module with reviewed M1-M8 variants, a required `LightMode` variant,
and resilience variants or test viewports for long/threshold-edge content.

## Charter Check

- **Tokens first — PASS**: all pattern-owned presentation uses approved `--sk-*` tokens. No raw
  design value or new token is introduced.
- **Semantic pairing — PASS**: foreground and surface tokens remain paired, including dark,
  light, and forced-colors rendering.
- **Public composition — PASS**: the pattern consumes only public custom elements, documented CSS
  families, and native semantic HTML. It does not reach into shadow roots or copy component CSS.
- **Naming — PASS**: pattern-owned classes use the `sk-mission-reading-pattern` BEM block.
- **Accessibility — PASS by design, verified by gates**: navigation uses native lists and real
  anchors; unavailable entries remain static non-links; drawer focus, Escape, zoom, RTL,
  forced-colors, reduced-motion, and axe coverage are explicit verification targets.
- **Theme — PASS**: the story family includes a valid `LightMode` proof in addition to the
  currently preferred dark presentation.
- **Review — REQUIRED**: Tier C pre-merge review will run three independent Codex doctrine lenses
  on the exact final head and publish findings and dispositions on the PR.
- **Generated artifacts — PASS by process**: generators and visual update tooling own derived
  files; generated outputs are never hand-edited.
- **Delivery — PASS**: one work package, one PR, targeting only `train/elements-first` with
  `Refs #265`.

## Project Structure

### Mission artifacts

```text
kitty-specs/mission-reading-pattern-stories-01M21HSX/
├── spec.md
├── research.md
├── data-model.md
├── evidence-log.csv
├── source-register.csv
├── plan.md
├── quickstart.md
├── contracts/
├── tasks.md
└── tasks/
```

### Repository surfaces

```text
packages/elements/src/patterns/
└── mission-reading.stories.ts

apps/storybook/src/tests/
├── sk-mission-reading-pattern.spec.ts
├── visual.spec.ts
└── visual.spec.ts-snapshots/        # updated only by Playwright tooling

docs/design-system/using-components.md
expected-stories.json
```

The story module owns its fixture, types, pure projections, pattern renderer, and token-only BEM
styles. This keeps the pattern demonstrative and prevents an unpublished fixture API from
becoming a second component contract. Focused browser assertions live beside the existing
Storybook tests; the existing visual registry and expectation registry are extended in their
established formats.

## Architecture and Data Flow

```text
deep-frozen Mission Reading fixture
        │
        ├── pure state projection (M1-M8, theme, resilience)
        │
        └── invariant checks for shared SHA and truth boundaries
                         │
                         ▼
        sk-mission-reading-pattern renderer
                         │
       ┌─────────────────┼───────────────────────┐
       ▼                 ▼                       ▼
 public elements   public CSS families      native semantics
                         │
                         ▼
        Storybook stories + focused/axe/visual evidence
```

The only mutable state is the M2 story's local controlled drawer boolean. The consumer opens the
drawer, consumes `sk-app-shell-dismiss`, updates `open`, and lets the shell restore focus to the
valid trigger. It is demonstration state, not a router or application model.

Truth regions remain structurally separate:

- factual document metadata and content come from the immutable fixture;
- observed activity is labelled as observed and contains Work Package state only;
- reported-live presence is labelled independently and contains actor/repository/branch/age only;
- no projection creates a person-to-Work-Package join.

## Implementation Concern Map

### IC-01 — Immutable fixture and truthful projections

- **Purpose**: establish one source for every repeated Mission, SHA, branch, catalogue, artifact,
  Ops, observed, and live value.
- **Requirements**: FR-002, FR-005-FR-011, C-004, C-005.
- **Surfaces**: `mission-reading.stories.ts` fixture, types, deep-freeze helper, projections, and
  invariant-focused tests.
- **Key rules**: pushed time exists only with a matching marker; snapshot-behind-log reuses the
  same SHA; loading projects no facts/actions; Ops exposes only Invocation, Action, Status.
- **Risk**: duplicating literals across stories can hide drift. Mitigation: stories accept only
  projections from the frozen fixture and tests assert shared identity values.

### IC-02 — Public M1-M8 pattern composition

- **Purpose**: render every reviewed desktop, narrow, loading, unavailable, behind-log,
  optional-catalogue, Ops, and truth-tier state.
- **Requirements**: FR-001, FR-003-FR-010, FR-012, C-001-C-003.
- **Surfaces**: `mission-reading.stories.ts` markup and token-only BEM styles.
- **Sequencing**: depends on IC-01.
- **Key rules**: available destinations are anchors; unavailable entries are static native
  content; Ops is terminal; absent optional direct routes have no false current navigation item;
  the 390px drawer is controlled and restores focus.
- **Risk**: a convenient wrapper can become a page component. Mitigation: keep the renderer in
  the `.stories.ts` pattern surface, expose no package export, and enforce the composition gate.

### IC-03 — Resilience, focused behavior, and visual evidence

- **Purpose**: prove LightMode, forced-colors, reduced-motion, RTL, zoom, long paths/branches,
  240px containment, 390px narrow behavior, and threshold edges.
- **Requirements**: FR-013, NFR-001-NFR-007.
- **Surfaces**: focused Storybook browser spec, axe coverage, visual cases and generated snapshots,
  `expected-stories.json`.
- **Sequencing**: depends on IC-02.
- **Risk**: snapshots captured before the final rebase cease to describe the merged code.
  Mitigation: rebase first, regenerate all derived artifacts, then capture and review baselines
  from the exact final PR head.

### IC-04 — Consumer documentation and release-boundary verification

- **Purpose**: document that Mission Reading is a composition recipe rather than a component and
  identify the public surfaces it uses.
- **Requirements**: FR-013, NFR-004-NFR-006, C-006, C-007.
- **Surfaces**: `docs/design-system/using-components.md`, generated/package checks, PR evidence.
- **Sequencing**: after IC-02; final verification after latest-train rebase.
- **Risk**: concurrent #255 changes shared generated registries. Mitigation: never copy its branch;
  rebase from the current train and regenerate locally.

The concerns are deliberately one work package. The fixture, projections, stories, registries,
focused tests, documentation, and exact-head baselines form one coupled proof; splitting them
would create PRs that either expose unverified stories or edit the same files concurrently.

## Verification Strategy

1. Run focused TypeScript/Vitest/Playwright tests for the Mission Reading story family, including
   native link/static-entry semantics, controlled drawer focus, and truth-boundary assertions.
2. Run axe across every registered story and targeted 240px, 390px, threshold-edge, zoom, RTL,
   forced-colors, reduced-motion, dark, and light cases.
3. Run the composition-boundary and raw-value/style gates, expected-story and generated-artifact
   checks, then regenerate only through repository commands.
4. Run all required quality, type, build, Storybook, browser, visual-regression, mutation,
   package, and security gates defined by current repository doctrine.
5. Rebase onto the latest `origin/train/elements-first`, regenerate, rerun the full suite, and
   capture reviewed baselines from that exact head.
6. Publish Tier C review evidence and all finding dispositions on the PR before acceptance.

## Delivery Strategy

- Finalize one work package covering IC-01 through IC-04 and open exactly one PR with `Refs #265`.
- Coordinate with #255 only through the shared train: rebase and regenerate after any landed work.
- Never target or merge `main`.
- After acceptance, merge into `train/elements-first`, run post-merge mission review against the
  merge commit, close #265 only after a passing verdict, and close epic #263 only after both #264
  and #265 are verified complete.

## Complexity Tracking

No charter exception is requested. The added complexity is pattern-owned authored fixture data,
pure functions, markup, tests, and documentation; it creates no public runtime abstraction.
