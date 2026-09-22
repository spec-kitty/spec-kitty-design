# Implementation Plan: Work Package Detail Primitives

**Branch**: `mission/work-package-detail-primitives` | **Date**: 2026-09-07 | **Spec**: `kitty-specs/work-package-detail-primitives-01M1XTPW/spec.md`  
**Input**: Confirmed specification derived from issue #213 and epic #208.

## Engineering Alignment

Implement three deliberately styles-only, light-DOM primitives and extend the existing `sk-check-bullet` element without changing the repository topology. Native navigation, article content, ordered-list chronology, code, and table relationships remain in consumer-authored light DOM. `sk-check-bullet` stays a passive list-compatible custom element whose reflected `state` has two accepted values; omission and unsupported runtime input degrade to the current complete presentation. No event, timer, parser, sorter, trust rule, progress calculation, routing, or data fetch is introduced.

The work remains on `mission/work-package-detail-primitives`; Spec Kitty's planning/base and internal merge target are that same branch. The external delivery PR targets `train/elements-first`. The current checkout matches the planned mission branch.

## Summary

Add `.sk-breadcrumbs`, `.sk-prose`, and `.sk-event-timeline` CSS families with authored static HTML exemplars and generated styles-only barrels. Extend the canonical check-bullet markup helper and Lit element with a reflected `state?: 'complete' | 'pending'`, state-derived decorative icon, visually hidden state text, and fail-open handling. Regenerate the CSS module, static markup, custom-elements manifest, React wrappers, Vue declarations, ratchets, styles barrel, expected-story catalogue, and size report. Verify native semantics, overflow, accessibility, themes, forced colors, reduced motion where applicable, cross-browser rendering, mutation resistance, and Linux CI visual baselines.

## Technical Context

**Language/Version**: TypeScript 5.9.3, JavaScript ESM, CSS, HTML; Node.js 22.22.2  
**Primary Dependencies**: Lit 3.3.3, Nx, Storybook 10.6.0 web-components renderer  
**Storage**: N/A; supplied content is rendered verbatim and no state is persisted  
**Testing**: Vitest 4.1.11 browser/node lanes, Playwright 1.62.1 Chromium/Firefox/WebKit, Storybook build, axe-core, mutation self-test, manifest/generator drift gates  
**Target Platform**: Standards-based modern browsers and generated React/Vue consumer typing  
**Project Type**: Nx elements-first design-system monorepo  
**Performance Goals**: Twenty-event and fifty-check-item fixtures render without console error or page-level overflow; Storybook build remains under the charter's three-minute ceiling  
**Constraints**: Token-only CSS; styles-only native semantic relationships; one authored markup/CSS source; no application behavior; exact-head CI and four-lens pre-merge review  
**Scale/Scope**: Three new class families, one additive element attribute, their stories/tests/docs, and required generated artifacts

## Charter Check

*GATE: passed before design and re-checked after design.*

- **Tokens first**: PASS. Existing `--sk-*` spacing, type, surface, foreground, border, radius, and motion tokens are sufficient; no token namespace change is planned.
- **Dependency direction**: PASS. Authored CSS remains in styles, element logic imports only its generated sheet and markup leaf, and React/Vue output remains generated.
- **Native accessibility**: PASS. The three class families style consumer-authored semantic nodes; `sk-check-bullet` retains host `role="listitem"` only as the existing #92-compatible seam and does not forge checkbox state.
- **Canonical markup**: PASS. Styles-only HTML exemplars are authored inputs to `build-styles-only-markup.mjs`; check-bullet element/static markup continues to derive from its one markup module.
- **Test quality**: PASS. Behavior changes receive red-first assertions and a named mutation arm; visual behavior is measured in rendered Storybook rather than shadow-DOM snapshots.
- **Themes/a11y/visuals**: PASS by plan. Dark, `LightMode`, forced-colors, keyboard, narrow/zoom, axe, and CI-authoritative visual evidence are explicit tasks.
- **Scope**: PASS. No aggregate Work Package component, stateful board/checklist, notice/card tone duplication, domain vocabulary, parser, clock, trust inference, or route behavior is introduced.
- **Review**: PASS by plan. Tier B post-tasks and exact-head four-lens pre-merge squads are mandatory, with all findings disposed.

## Design Decisions

### Styles-only native primitives

- `.sk-breadcrumbs` is applied to a labelled `<nav>` containing `<ol>/<li>/<a>`. Its list is a contained horizontal region at narrow widths. Separators are CSS decoration using generated content with an empty accessible alternative. The terminal link's `aria-current="page"` is authored by the consumer and only styled by the primitive.
- `.sk-prose` styles headings, paragraphs, lists, links, inline `<code>`, and scroll-contained `<pre><code>` through descendants of a content container. It never assigns heading levels or transforms source text. A structured table remains `.sk-data-table` inside the prose surface.
- `.sk-event-timeline` is an `<ol>` with BEM `<li>` entries and child classes for summary, metadata, support content, and optional marker composition. Its dot/connector geometry uses CSS borders/backgrounds and carries no textual content. CSS grid/flex reflows metadata with its entry rather than independently positioning it.
- All three are instances of ADR-10's styles-only class: wrapping them in a custom element would sever native relationships or add no behavior beyond native semantics.

### Check-bullet state

- The public element field is documented as `state?: 'complete' | 'pending'` and reflected to `state`. Omission means complete and keeps the historical visual contract.
- One normalization helper accepts only `pending`; `complete`, omission, or unsupported runtime values render the complete class/icon/text. The static build helper remains fail-fast on unsupported authored options, preserving ADR-10's build-time policy.
- The default icon is derived from normalized state. A supplied `icon` continues to override the glyph, and the icon span remains `aria-hidden="true"`.
- A non-hidden-from-AT state label precedes the slotted text and is visually clipped with tokenized dimensions. No `aria-checked`, checkbox role, click/key handler, or toggle event is added.
- Static HTML mirrors the same state class/icon/accessible label from the canonical markup module.

### Verification and generated output

- Styles-only exemplars are authored `.html` files and their `index.ts` files are regenerated by `build-styles-only-markup.mjs`.
- Check-bullet's `.css.js/.d.ts`, styles static HTML/barrel, CEM, React wrapper, Vue declaration, expected-docs total, expected story set, and `SIZES.md` are regenerated by repository scripts, never edited directly.
- SC-010 applies because `state` is a public property that can be assigned before definition; the behavior test and a unique mutation arm prove reflection/upgrade. State normalization/default icon/accessible text receive a second surgical mutation only if the existing registry permits attribution without collateral; otherwise one arm must kill the full state contract and the task records why.
- Linux visual baselines are taken only from CI's `visual-regression-diffs` artifact after inspecting the rendered candidates.

## Project Structure

### Documentation (this mission)

```text
kitty-specs/work-package-detail-primitives-01M1XTPW/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── public-surfaces.md
├── tasks.md
└── tasks/
```

### Source Code (repository root)

```text
packages/styles/src/
├── breadcrumbs/                 # authored CSS, HTML exemplars/stories; generated index
├── prose/                       # authored CSS, HTML exemplars/stories; generated index
├── event-timeline/              # authored CSS, HTML exemplars/stories; generated index
└── check-bullet/                # existing authored CSS and generated static outputs

packages/elements/src/check-bullet/
├── sk-check-bullet.markup.ts    # canonical authored markup/state helpers
├── sk-check-bullet.ts           # reflected state and accessible rendering
├── sk-check-bullet.stories.ts   # complete/pending/mixed/scale/light states
└── sk-check-bullet.css.js       # generated from styles source

fixtures/elements-behaviour/src/sk-check-bullet.test.ts
apps/storybook/src/tests/sk-work-package-detail-primitives.spec.ts
apps/storybook/src/tests/visual.spec.ts
docs/design-system/using-components.md
docs/design-system/changelog.md
behaviours.json
mutations.json
expected-docs.json
expected-stories.json
packages/elements/custom-elements.json
packages/react/src/             # generated only
packages/elements/vue.d.ts      # generated only
packages/elements/SIZES.md      # generated after build
```

**Structure Decision**: Extend the existing four-package elements-first graph. Native semantic surfaces remain class families under `packages/styles/src`; only the existing behavioral element is changed under `packages/elements/src`.

## Implementation Concern Map

### IC-01 — Native detail presentation

- **Purpose**: Deliver breadcrumbs, readable prose/code, and chronological event styles without re-hosting native semantics.
- **Relevant requirements**: FR-001–FR-007, FR-011–FR-012; NFR-001–NFR-005, NFR-007–NFR-008; C-001–C-006.
- **Affected surfaces**: `packages/styles/src/{breadcrumbs,prose,event-timeline}/**`, styles exports, Storybook semantic browser coverage.
- **Sequencing/depends-on**: none.
- **Risks**: pseudo-content entering accessible names, page-level overflow, timeline metadata detaching at narrow widths, and selectors that imply app-owned structure.

### IC-02 — Backward-compatible read-only check state

- **Purpose**: Add complete/pending semantics to `sk-check-bullet` while preserving omission, list compatibility, and custom-icon behavior.
- **Relevant requirements**: FR-008–FR-012; NFR-001, NFR-003–NFR-008; C-001, C-003–C-008.
- **Affected surfaces**: check-bullet authored CSS/markup/element/stories, behavior fixture, behavior/mutation registries, docs/parts/story/type ratchets.
- **Sequencing/depends-on**: none at source level; integrated generation follows both concerns.
- **Risks**: reflected invalid strings, inaccessible color/icon-only state, invalid checkbox ARIA, changed default accessible name, mutation collateral, and divergence between static and element paths.

### IC-03 — Integrated catalogue and evidence

- **Purpose**: Regenerate shared artifacts, document public recipes/boundaries, and provide exact rendered and CI evidence across all scenarios.
- **Relevant requirements**: FR-011–FR-012; NFR-001–NFR-008; C-001–C-008; SC-001–SC-007.
- **Affected surfaces**: generation outputs, expected ratchets, docs, Playwright integration/visual specs, CI artifacts and PR evidence.
- **Sequencing/depends-on**: IC-01 and IC-02.
- **Risks**: concurrent #212 movement on shared generated files, stale train integration, locally authored Linux baselines, and evidence tied to an obsolete head SHA.

## Work-Package Strategy

1. **WP01 — styles-only detail primitives**: implement red-first rendered semantic/overflow checks, authored HTML/CSS/stories for breadcrumbs, prose, and event timeline, plus focused verification. Own no check-bullet files.
2. **WP02 — check-bullet state extension**: add red-first behavior/mutation/type expectations, canonical markup and element state, CSS/stories, relevant ratchet deltas, and focused generation. Depends on WP01 only to keep branch sequencing linear; authored files are otherwise disjoint.
3. **WP03 — integrated evidence and catalogue closeout**: regenerate every shared artifact, add final cross-surface Playwright/visual evidence and public docs, run the complete gate matrix, and prepare exact-head acceptance/PR evidence. Depends on WP01 and WP02.

WP ownership is disjoint for authored code and serial for shared artifacts. All work remains in this fresh primary clone; no Spec Kitty-generated worktree is used.

## Test Strategy

- Start with failing focused browser/unit/type tests for each new semantic/state contract.
- Check native roles, order/count, current-page state, accessible names, decorative glyph exclusion, focusability, and no forbidden `aria-checked`/event behavior.
- Measure layout/overflow and computed styles in Storybook on Chromium and Firefox; execute WebKit through the repository's supported Playwright environment if host libraries are unavailable.
- Add explicit forced-colors observations and reduced-motion assertions only for transitions actually present.
- Register and execute surgical mutation arms for new check-bullet behavior; require named red with no unrelated collateral.
- Regenerate first, build before measuring sizes, run all drift/content/boundary/type/lint gates, then full Vitest, mutation suite, Storybook, axe, Playwright, and visual regression.
- After the final train rebase, regenerate and rerun all affected gates. Any subsequent push invalidates CI and adversarial review evidence.

## Integration and Delivery

- Fetch and rebase on the latest `origin/train/elements-first` after implementation and again before the final gate if the train advances.
- Resolve shared generated-artifact conflicts by regenerating from the combined authored sources; do not select one branch's generated bytes manually.
- Open one PR from `mission/work-package-detail-primitives` into `train/elements-first` with `Refs #213` and `part of #208`.
- Run the resolver-loaded Tier B post-tasks squad and the exact-head pre-merge squad with `architect-alphonso`, `reviewer-renata`, `debugger-debbie`, and `randy-reducer`, using Codex subagents only.
- Merge squash only after Spec Kitty acceptance, exact-head local gates, exact-head green CI, inspected visual candidates/baselines, and a PR comment disposing every squad finding.

## Complexity Tracking

No charter violation or new architectural mechanism is required.
