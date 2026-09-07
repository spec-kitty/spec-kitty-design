# Implementation Plan: Native Workflow Board and Lane Styles

- **Branch:** `mission/work-package-workflow-board-styles`
- **Date:** 2026-09-06
- **Spec:** [`spec.md`](./spec.md)
- **Research:** [`research.md`](./research.md)
- **Data model:** [`data-model.md`](./data-model.md)

## Summary

Deliver `.sk-workflow-board*` and `.sk-workflow-lane*` as two styles-only families over
consumer-authored light DOM. The implementation uses a native named `<section>` for every lane, a
native heading, and an `<ol>` whose work items are direct `<li>` children. The board scroller is
the sole horizontal-overflow owner. The consumer adds the complete region/name/tabindex triad only
after measuring genuine overflow and removes all three when it fits.

The component CSS uses the current token taxonomy. Existing tokens cover every design value except
the measured minimum inline size of a workflow lane, for which implementation may add exactly one
theme-invariant token in the existing `layout` category. Authored HTML is the canonical markup
source; both component `index.ts` barrels and the token catalogue are generated. Storybook, axe,
real-browser DOM/accessibility/geometry/keyboard assertions, and CI-authoritative Chromium images
provide review evidence.

The mission is one atomic, independently deliverable styles-package change. One cohesive work
package and one PR are strongly preferred: the two class families form one semantic structure and
share fixtures, generated exports, documentation, and browser gates. Splitting them would create a
temporarily unusable half-surface and duplicated integration ceremony.

## Planning Questions Resolved

| Question                                            | Resolution                                                                                                                                                    | Authority                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Element or styles-only?                             | Styles-only. No registration, shadow root, wrapper, element manifest, behavior, or mutation surface.                                                          | Issue #209; ADR-10; research R-01                            |
| Public selector surface?                            | Exactly seven selectors: two board selectors and five lane selectors. No single-lane modifier is added; a consumer supplies one lane to the same structure.   | FR-001, FR-002, SC-001                                       |
| Lane semantics?                                     | A named native `<section>` containing a native heading and native `<ol>` with direct `<li>` work items.                                                       | FR-004, FR-005; research R-02                                |
| Empty semantics?                                    | Keep an empty `<ol>` and render supplied `.sk-empty-state` content as its following sibling.                                                                  | FR-008; research R-05                                        |
| Who owns overflow semantics?                        | The consumer measures rendered overflow and authors/removes the complete region/name/tabindex triad. CSS only provides the scroller and focus presentation.   | FR-003, FR-009; research R-03                                |
| Who owns mobile selection?                          | The consumer renders exactly one selected lane. These styles have no selection, routing, filtering, or hidden-lane logic.                                     | FR-006, FR-010; epic #208                                    |
| Is a new layout token justified?                    | At most one: a workflow-lane minimum inline size in the existing layout category, calibrated with browser evidence. All other values reuse existing taxonomy. | NFR-001, C-008; research R-09                                |
| Does planning have an unresolved architecture fork? | No. The only open value is reversible browser calibration within the settled token architecture.                                                              | Spec “Decisions and Remaining Calibration”; research handoff |

## Technical Context

- **Language/runtime:** CSS, native HTML, TypeScript story modules; Node 22 repository tooling
- **Primary dependencies:** `@spec-kitty/tokens`, `@spec-kitty/styles`, Storybook Web Components,
  Playwright, axe-core, Nx
- **Storage/data migration:** None; no persisted or runtime application state is introduced
- **Target:** Modern Chromium, Firefox, and WebKit through the repository Playwright projects;
  forced-colors emulation and 320/360 px narrow viewports
- **Authoritative sources:** `packages/tokens/src/tokens.css`, component CSS, and component HTML
  fixtures
- **Generated sources:** `packages/tokens/dist/token-catalogue.json` and each styles-only component
  `index.ts`
- **Performance/scale:** A maintained 50-item lane renders in full, without filtering,
  virtualization, animation, or page-level horizontal overflow
- **Scope:** Two exact BEM families, shared fixtures/stories, package exports/subpaths, consumer
  docs, and focused browser/visual coverage

## Charter Check

The pre-design and post-design charter checks pass.

| Gate                              | Planned proof                                                                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token-first, no raw design values | Stylelint/source assertions; all component values resolve through `--sk-*`; at most one new layout token appears in both theme blocks and regenerated catalogue. |
| Framework-neutral canonical API   | Consumer-authored native HTML and CSS only; no element or React/Vue surface.                                                                                     |
| Accessible by construction        | Named native sections/headings/lists, truthful empty lists, conditional scroller landmark/tab stop, visible focus, axe and accessibility-tree evidence.          |
| Responsive and theme complete     | Genuine/fitting overflow, 320/360 px one-lane, long and 50-item fixtures, `.sk-light`, and forced-colors evidence.                                               |
| Generated artifacts deterministic | Generator is run, its `--check` mode is clean, and authored HTML remains the only markup source.                                                                 |
| Reviewable and traceable          | One cohesive PR; exact requirement/invariant matrix below; conventional commit; adversarial review rerun after the final SHA.                                    |
| Full repository verification      | Lint, format, typecheck/build, unit/browser/axe/visual gates, package validation, and docs gates run from a rebased final tree.                                  |

No charter exception is requested. The lack of motion is intentional: this component owns no
transition or animation, so an inert reduced-motion rule would be false evidence.

## Architecture and Ownership

```text
consumer application
├── owns board label, lane definitions/order, title levels/IDs and visible counts
├── owns work-item markup/order, empty copy, tone, filtering and mobile selection
├── measures scroller geometry
│   ├── scrollWidth > clientWidth
│   │   └── adds role=region + exactly one accessible name + tabindex=0
│   └── scrollWidth <= clientWidth
│       └── omits the complete triad
└── renders native light DOM
    └── .sk-workflow-board
        ├── native board heading
        └── .sk-workflow-board__scroller        ← only horizontal overflow owner
            └── section.sk-workflow-lane        ← one or more, consumer ordered
                ├── header.sk-workflow-lane__header
                │   ├── h2..h6.sk-workflow-lane__title
                │   └── .sk-workflow-lane__count
                ├── ol.sk-workflow-lane__list
                │   └── li                       ← zero or more, direct and ordered
                └── .sk-empty-state              ← sibling only when list is empty

design-system repository
├── tokens: values
├── styles: board/lane layout, wrapping, boundaries and focus presentation
├── generated HTML barrels and package exports
└── browser/a11y/visual evidence
```

The structure is native and uninterrupted. CSS must not add forged `grid`, `row`, `list`,
`listitem`, `listbox`, or `option` roles, nor change source/reading order. It must not select lane
text, domain labels, direct item internals, or shadow-root/private parts of composed components.

### Exact public selector boundary

1. `.sk-workflow-board`
2. `.sk-workflow-board__scroller`
3. `.sk-workflow-lane`
4. `.sk-workflow-lane__header`
5. `.sk-workflow-lane__title`
6. `.sk-workflow-lane__count`
7. `.sk-workflow-lane__list`

Single-lane presentation uses this unchanged surface with exactly one consumer-supplied lane. No
modifier, workflow-item class, domain-status selector, or generated marker expands the inventory.

### Conditional overflow contract

The examples document consumer logic without shipping it as library behavior:

```text
overflowing := scroller.scrollWidth > scroller.clientWidth

if overflowing:
    set role="region"
    set exactly one of aria-labelledby or aria-label
    set tabindex="0"
else:
    remove role
    remove aria-labelledby and aria-label
    remove tabindex
```

The genuine-overflow authored fixture includes all three because its declared constrained viewport
is measured to overflow. The fitting and single-lane fixtures omit all three because their declared
viewports are measured to fit. These are truthful worked branches, not a claim that CSS performs
the measurement. Documentation tells dynamic consumers to repeat the measurement when their
rendered content/container geometry changes; this mission adds no observer or resize handler.

## Token Strategy and Browser Calibration

Reuse the existing taxonomy and current tokens for surface, foreground, muted text, borders,
spacing, radius, typography, weight, line-height, and focus. Do not alias a shell/sidebar width and
do not copy raw values from `apps/demo/dashboard-demo.html` or the raw dimensions in #210.

Implementation may author only this new token if measurements show it is necessary:

- `--sk-layout-workflow-lane-min-inline-size` in the existing `layout` category;
- the same numeric value in the default and `.sk-light` blocks, because geometry is
  theme-invariant;
- no fallback value in component CSS, no new token category, and no component-owned theme
  selector.

The numeric value is selected during implementation through a real Chromium/Firefox/WebKit
candidate sweep, not intuition:

1. Test candidates from 220 px through 360 px against opaque consumer item boxes and long labels.
2. Choose the smallest candidate for which content wraps without overlap/focus clipping and one
   lane fits inside declared 320 px and 360 px compositions.
3. At the reference board viewport, prove five lanes genuinely overflow the scroller while the
   page does not overflow.
4. Record candidate, viewport, `clientWidth`, `scrollWidth`, wrapping, and focus-containment
   measurements in the focused Playwright test or its adjacent rationale.
5. Assert computed values of the new token are equal in default dark and `.sk-light`, and each
   lane's computed `min-inline-size` resolves to it.

If no candidate satisfies all constraints, that is a product/layout fork and implementation must
stop for a decision rather than invent a modifier or copy T10 pixels. Current research indicates a
candidate exists, so planning is not blocked.

## Project Structure and Artifact Ownership

All paths are repository-relative.

```text
AUTHORED token source
packages/tokens/src/tokens.css

GENERATED token distribution
packages/tokens/dist/token-catalogue.json

AUTHORED workflow-board sources
packages/styles/src/workflow-board/
├── sk-workflow-board.css
├── sk-workflow-board-populated.html
├── sk-workflow-board-fitting.html
├── sk-workflow-board-all-empty.html
├── sk-workflow-board-one-empty-lane.html
├── sk-workflow-board-fifty-items.html
├── sk-workflow-board-long-labels-and-items.html
├── sk-workflow-board-single-lane-narrow.html
└── sk-workflow-board-html.stories.ts

GENERATED workflow-board distribution
packages/styles/src/workflow-board/index.ts

AUTHORED workflow-lane sources
packages/styles/src/workflow-lane/
├── sk-workflow-lane.css
├── sk-workflow-lane-default.html
├── sk-workflow-lane-empty.html
└── sk-workflow-lane-html.stories.ts

GENERATED workflow-lane distribution
packages/styles/src/workflow-lane/index.ts

AUTHORED package wiring, docs and ratchet
packages/styles/src/index.ts
packages/styles/package.json
expected-stories.json
docs/design-system/using-components.md

AUTHORED focused tests
apps/storybook/src/tests/sk-workflow-board.spec.ts
apps/storybook/src/tests/visual.spec.ts

CI-AUTHORITATIVE generated visual evidence
apps/storybook/src/tests/visual.spec.ts-snapshots/
├── sk-workflow-board-populated-dark-chromium-linux.png
├── sk-workflow-board-fitting-chromium-linux.png
├── sk-workflow-board-all-empty-chromium-linux.png
├── sk-workflow-board-one-empty-lane-chromium-linux.png
├── sk-workflow-board-fifty-items-chromium-linux.png
├── sk-workflow-board-long-labels-and-items-chromium-linux.png
├── sk-workflow-board-single-lane-narrow-chromium-linux.png
├── sk-workflow-board-light-chromium-linux.png
└── sk-workflow-board-forced-colors-chromium-linux.png
```

`scripts/build-styles-only-markup.mjs` already discovers CSS-backed directories that lack a
matching element and generates each `index.ts` from sorted authored `.html` files. Run it; do not
hand-edit either barrel. Add `export *` lines for both directories to the authored root barrel and
`./workflow-board/*` plus `./workflow-lane/*` to authored package subpaths. Regenerate the token
catalogue with the repository token command after adding the measured token.

There are deliberately no changes to `packages/elements/src/`, `packages/react/`,
`packages/vue/`, `custom-elements.json`, `expected-parts.json`, `expected-docs.json`,
`behaviours.json`, `mutations.json`, or `mutations.selftest.json`. There is no edit to the demo
board: it is motivating evidence, not this reusable package contract. No #211, #212, or #214
implementation is folded into fixtures or docs.

## Fixture and Story Design

### Workflow board

Every board fixture uses identical structural rules: visible board heading, scroller, named lane
sections, native lane headings, supplied counts, and direct `<ol>`/`<li>` membership. IDs are
unique within each fixture. Counts equal direct item cardinality.

- `Populated` is the constrained five-lane reference. It is measured as genuine overflow and
  carries the complete region/name/tabindex triad.
- `Fitting` is an explicit wider-viewport/non-overflow control and omits the complete triad.
- `AllEmpty` has five empty ordered lists; each supplied empty-state block is a sibling after its
  list, never a fake item.
- `OneEmptyLane` has exactly one zero-item list and four populated lists.
- `FiftyItems` has one supplied count of `50` and exactly 50 direct listitems in source order.
- `LongLabelsAndItems` preserves long lane headings and opaque long item content without clipping.
- `SingleLaneNarrow` supplies exactly one lane at 320/360 px and omits the triad because it fits.
- `ForcedColors` uses the genuine-overflow markup and relies on forced-colors emulation, with
  visible structural boundaries, empty treatment, and focus.
- `DefaultDark` and `LightMode` use semantically identical populated markup; `LightMode` wraps it
  in `.sk-light` and proves a real computed token-dependent difference.

The board story module also exports `Default` as the canonical populated dark example to follow
the current authoring convention. It does not replace the separately addressable required
`Populated` or `DefaultDark` stories.

### Workflow lane

The lane story module independently exposes `Default`, `Empty`, and `LightMode`. `Default` proves
the native named section/heading/list unit. `Empty` proves a zero-item `<ol>` followed by existing
`.sk-empty-state` content. `LightMode` wraps the same semantic default fixture with `.sk-light`.
There is no interactive application behavior to simulate.

Add every new story ID to `expected-stories.json` and update its explanatory count/history. The
ratchet names the board's `Default`, ten board evidence stories, and all three lane stories; axe
must fail if any is missing or renders no component root.

## Focused Verification Strategy

### Source and distribution contract

- Parse final component CSS after comments and compare its public `.sk-workflow-*` selector
  inventory exactly with the seven allowed selectors.
- Assert no workflow-board/lane element directory, tag registration, wrapper, manifest/ratchet,
  behavior, mutation, public item selector, modifier, domain lane name, generated `content`,
  transition, animation, private part selector, or `forced-color-adjust: none` entered the delta.
- Run stylelint/token checks and assert component declarations contain no raw design values or
  unrelated width aliases.
- Run styles-only generation, check byte-for-byte current artifacts, build the styles package,
  resolve both root exports and both package subpaths, and inspect the packed package.

### DOM and accessibility tree

- For populated/fitting/empty/long/50-item/single-lane fixtures, assert every lane host is a native
  `<section>`, every `aria-labelledby` resolves to that lane's native `h2`–`h6`, and browser roles
  expose the expected section names.
- Assert every `.sk-workflow-lane__list` is an `<ol>`, all represented work items are direct `<li>`
  children, DOM and accessibility-tree counts/order match, and no wrapper or forged role
  intervenes.
- Assert the five-lane populated board exposes exactly five named sections and five native lists in
  authored order.
- Assert all-empty has five zero-item lists; one-empty has exactly one zero-item list; empty copy is
  visible as a sibling outside each empty list; every maintained supplied count equals direct
  listitem cardinality.
- Assert FiftyItems exposes exactly 50 direct native listitems in source and accessibility order,
  with visible count `50` and no filtering, virtualization, or reordering.

### Genuine and absent overflow

- Genuine-overflow: require `scrollWidth > clientWidth`, exactly one named region, exactly one
  accessible naming method, `tabindex="0"`, and no page-level horizontal overflow.
- Keyboard: focus the scroller, verify visible focus, press ArrowRight then ArrowLeft in every
  configured Playwright browser, observe movement in the corresponding `scrollLeft` directions,
  and prove focus stays on the scroller.
- Absent-overflow: for both Fitting and SingleLaneNarrow require `scrollWidth <= clientWidth`, no
  role, accessible-name attribute, or tabindex, and no dead scroller stop in sequential tab order.
- Page containment: in all board stories at their declared viewports, require
  `document.scrollingElement.scrollWidth <= clientWidth`; include long content, 50 items, 320/360
  px narrow, both themes, and forced colors.

### Theme, forced-colors, axe, and visuals

- Compare `DefaultDark` and `LightMode`: semantic structure/counts/names are identical, `.sk-light`
  is actually present, and at least one paired token-dependent computed color/border/surface value
  differs. Story names or background parameters are not evidence.
- Under forced-colors emulation, inspect nonzero/remapped lane-border and focus-outline geometry,
  visible empty treatment, unchanged accessibility names/counts, and unchanged containment.
- Run every ratcheted story through the existing Storybook render/no-console checks and axe WCAG
  2.1 AA; a missing or empty board/lane root fails rather than reporting a vacuous zero.
- Add Chromium baselines for every listed board state. Generate them in the repository's CI
  container/environment and treat those Linux Chromium artifacts as authoritative; local host
  screenshots may diagnose but must not overwrite CI authority.

## Generation, Gate, and Delivery Sequence

1. Rebase the mission branch on current `origin/train/elements-first` before implementation so #210 and any intervening
   generator/export changes are current.
2. Add the measured layout token, two authored CSS families, and all authored fixtures/stories.
3. Run the token catalogue and styles-only markup generators. Never edit their outputs manually.
4. Add root exports, package subpaths, story ratchet entries, consumer docs, focused browser tests,
   visual registrations, and CI-generated baselines.
5. Run focused Playwright in Chromium/Firefox/WebKit, Storybook rendering, axe, and Chromium visual
   regression; fix evidence rather than weakening thresholds or skipping states.
6. Run full repository format, lint/stylelint, typecheck, build, unit, Storybook, accessibility,
   browser, visual, package/manifest/ratchet, docs, and generated-artifact gates. CI path filters
   already classify `packages/**`, `apps/storybook/**`, `expected-stories.json`, and docs; verify
   the final PR actually schedules the component/Storybook/axe/Playwright/visual jobs.
7. Immediately before review, rebase again if `origin/train/elements-first` moved, rerun both generators and their check
   modes, rerun the full gate set, and regenerate baselines only in the CI-authoritative Linux
   Chromium environment if the rendering legitimately changed.
8. Run the required adversarial review against the final SHA and address findings without widening
   the selector, behavior, or child-issue surface.

Because both families, native fixtures, generated barrels, root distribution, token calibration,
and all gates comprise one public semantic surface, tasks should produce one cohesive WP and PR.
This is the deliberate exception to splitting by file family; it preserves an independently usable
and reviewable commit rather than creating two mutually dependent partial releases.

## Requirement and Negative-Invariant Validation

| Contract slice                                   | Plan evidence                                                                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001, FR-002, SC-001                           | Exact seven-selector inventory; same selector surface for one-lane composition.                                                                                              |
| FR-003, FR-009, NFR-003, NFR-005, SC-003, SC-004 | Paired geometry fixtures; full-or-none triad; native named region only on real overflow; focus and Arrow scrolling in all browsers.                                          |
| FR-004, FR-005, NFR-003, SC-002                  | Native named lane sections/headings and direct ordered-list membership asserted in DOM and accessibility tree.                                                               |
| FR-006, FR-010                                   | Consumer owns definitions, text/IDs/counts/order, opaque items, tone, filtering, and selected mobile lane; styles receive one lane only.                                     |
| FR-007, FR-008, SC-005                           | Maintained count/cardinality checks; empty `<ol>` plus sibling supplied empty state.                                                                                         |
| FR-011, NFR-004, SC-006, SC-007                  | Long-content, exact 50-item order/count, 320/360 px one-lane, focus containment, and no page overflow.                                                                       |
| FR-012, NFR-007, SC-009, SC-010                  | Neutral structural cues; real `.sk-light` computed difference; forced-colors borders/empty/focus without domain tone.                                                        |
| FR-013, NFR-002, NFR-008, SC-008                 | All required named stories ratcheted; non-empty render, no console error, axe zero for every story.                                                                          |
| FR-014, FR-015, NFR-006, SC-011                  | Authored examples, generated barrels/catalogue, root exports/subpaths, package resolution, and consumer docs remain synchronized.                                            |
| FR-016                                           | CI-authoritative visual baselines cover dark/light, genuine/fitting overflow, empty states, long/50-item, narrow, and forced colors.                                         |
| NFR-001                                          | Existing taxonomy plus at most one measured theme-invariant layout token; no raw design values/fallbacks.                                                                    |
| NI-001, C-001                                    | Delta proves no custom element, wrapper, manifest/parts/docs ratchet, behavior, or mutation surface.                                                                         |
| NI-002                                           | Exact selector inventory forbids public item classes, modifiers, or domain-status classes.                                                                                   |
| NI-003                                           | No generated content/labels/counts/separators; accessible names and counts derive from supplied native markup.                                                               |
| NI-004, C-006                                    | Direct `<ol>`/`<li>` checks and native accessibility roles; no forged semantic roles.                                                                                        |
| NI-005, C-004                                    | Comment-stripped source scan and delta review forbid state, drag/drop, reordering, transition/animation, filter, virtualization, timer, routing, observer, and resize logic. |
| NI-006                                           | True-overflow versus two absent-overflow controls assert the triad as an indivisible state and tab order as useful only when scrollable.                                     |
| NI-007                                           | Page-width assertion runs across every required story and declared viewport.                                                                                                 |
| NI-008                                           | Empty and all maintained fixtures assert visible count, direct listitem count, and empty-message sibling placement.                                                          |
| NI-009                                           | Token/style/source/computed checks reject raw design values, unrelated aliases, component theme selectors, inert light wrappers, and forced-color opt-out.                   |
| NI-010, C-002, C-003, C-005, C-007               | Final delta excludes #211/#212/#214 work, Kanban/work-item components, domain/state/tone ownership, and cross-child source dependencies.                                     |
| C-008, C-009                                     | Browser-calibrated token with recorded evidence; generated outputs derive only through repository generators.                                                                |
| SC-012                                           | Automated negative inventory plus final human/adversarial delta review covers NI-001 through NI-010.                                                                         |

This mapping covers FR-001 through FR-016, NFR-001 through NFR-008, C-001 through C-009,
NI-001 through NI-010, and SC-001 through SC-012 without changing their meaning.

## Research Source Reconciliation

Every registered research source is carried forward. The completed spec remains binding where a
research option was broader: research R-07 and the data model allowed a possible single-lane BEM
modifier, but FR-001/FR-002 and SC-001 subsequently require the exact seven-selector inventory, so
this plan uses the unchanged surface and one consumer-supplied lane. That is a resolved source
ordering question, not an open architecture fork.

| Registered source                                            | Plan use                                                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S-001 issue #209; S-002 epic #208                            | Binding selector, native semantics, ownership, state/evidence, wave-independence, and adjacent-child boundaries.                                       |
| S-003 issue #92; S-006 issue #146                            | Direct native list/listitem parentage and opaque action-row composition, proven in both DOM and accessibility tree.                                    |
| S-004 issue #141; S-005 PR #172; S-020 styles-only generator | Recorded styles-only class and authored-HTML/generated-barrel pipeline, while current ADR-10 supersedes old rationale.                                 |
| S-007 issue #176; S-017 data-table; S-018 empty-state        | Native semantic styling, conditional real-overflow precedent, and empty-list plus sibling empty-content composition.                                   |
| S-008 issue #210/PR #222                                     | Nearest artifact/story/browser precedent; raw progress dimensions are explicitly not reused.                                                           |
| S-009 issue #211; S-010 issue #212; S-011 issue #214         | Consumer-owned select state, future card/inline-empty additions, and downstream integrated pattern remain out of scope.                                |
| S-012 ADR-9; S-013 ADR-10; S-014 ADR-11                      | No cross-shadow/private selectors, deliberate native styles-only distribution, generated-source discipline, and outer browser/axe/visual verification. |
| S-015 authoring recipe                                       | Token-only CSS, real `.sk-light`, forced-colors structural cues, no inert reduced-motion block, and current generator/gate commands.                   |
| S-016 dashboard demo                                         | Motivating five-lane layout only; page-local raw values, div semantics, and domain tone are rejected as reusable authority.                            |
| S-019 action-row implementation                              | Item contents remain opaque and activation/selection stay outside these styles.                                                                        |
| S-021 styles package entries                                 | Both authored root exports and package subpaths are explicit delivery work and are resolution-tested.                                                  |
| S-022 token inventory                                        | Existing categories cover all but the measured lane minimum; no unrelated token alias or new category.                                                 |
| S-023 T10 Stitch project                                     | Payload unavailability is recorded; no unseen pixel value is claimed, and browser calibration is limited to the one justified layout token.            |

The resulting plan covers accepted evidence E-001 through E-026: exact scope and native semantics;
consumer ownership; styles-only generation/distribution; conditional overflow; truthful empty,
count, order, and opaque-item behavior; single-lane independence; neutral/tokenized presentation;
and theme, forced-colors, browser, axe, and visual proof.

## Risks and Controls

| Risk                                                   | Control / stop condition                                                                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inaccessible Stitch T10 payload tempts pixel invention | Issue #209 is semantic authority. Calibrate only the missing lane minimum in browsers; do not claim unobserved T10 fidelity. Stop if a product visual choice beyond that token is required. |
| CSS cannot conditionally author ARIA/tabindex          | Fixtures truthfully encode measured states and docs assign dynamic measurement to consumers. Any proposal for an observer/custom element is out of scope.                                   |
| Five lanes appear scrollable but page owns overflow    | Simultaneously assert scroller overflow and document containment for every state/browser.                                                                                                   |
| Light story is visually named but not themed           | Require `.sk-light` plus a non-vacuous paired computed-value difference.                                                                                                                    |
| Empty copy corrupts list count                         | Keep the empty list and put empty content after it; assert both DOM and accessibility cardinality.                                                                                          |
| Generated barrels/root export/package subpath drift    | Regenerate, run `--check`, resolve public imports/subpaths, and inspect pack output after premerge rebase.                                                                                  |
| Selector or behavior creep implements adjacent work    | Exact selector/source inventory and NI matrix fail on modifiers, app state, tone maps, observers, routing, #211/#212/#214 APIs, or element surfaces.                                        |
| Local screenshots differ from CI Linux rendering       | Use local output only for diagnosis; update committed snapshots through the CI-authoritative environment and review diffs.                                                                  |
| `origin/train/elements-first` changes the generator/token/story ratchets | Rebase before implementation and premerge, regenerate from authored sources, rerun full repository gates, then review the final SHA.                                                       |

## Implementation Concern Map

These concerns guide one cohesive work package; they are not separate delivery units.

### IC-01 — Token-calibrated neutral layout

- **Purpose:** Implement both exact CSS families with contained horizontal layout, wrapping,
  boundaries, and focus while adding no raw design value or domain tone.
- **Requirements:** FR-001, FR-002, FR-009, FR-011, FR-012; NFR-001, NFR-004, NFR-007;
  C-005, C-008; NI-002, NI-007, NI-009.
- **Affected surfaces:** `packages/tokens/src/tokens.css`, generated token catalogue, both component
  CSS files.
- **Depends on:** None.
- **Risk:** The one lane-minimum token needs measured cross-browser calibration; failure of all
  candidates is the only identified decision stop.

### IC-02 — Native authored fixtures and public distribution

- **Purpose:** Encode named sections/headings, direct lists, truthful empty siblings, consumer-owned
  mobile/overflow branches, and deterministic styles-only package exports.
- **Requirements:** FR-003 through FR-008, FR-010, FR-013 through FR-015; NFR-006, NFR-008;
  C-001 through C-004, C-006, C-007, C-009; NI-001, NI-003 through NI-006, NI-008, NI-010.
- **Affected surfaces:** Both styles directories, generated barrels, root barrel, package subpaths,
  story ratchet, and consumer documentation.
- **Depends on:** IC-01 for the final measured CSS value, but fixture semantics can be authored in
  parallel within the same WP.
- **Risk:** Hand-editing generated output or adding convenience behavior would create a second
  source of truth and violate the styles-only boundary.

### IC-03 — Non-vacuous browser and visual evidence

- **Purpose:** Prove native accessibility-tree fidelity, true versus absent overflow, keyboard
  reachability, containment, long/50-item/narrow resilience, theme difference, forced colors,
  story/axe health, and visual reviewability.
- **Requirements:** FR-007 through FR-013, FR-016; NFR-002 through NFR-005, NFR-007, NFR-008;
  SC-002 through SC-010, SC-012.
- **Affected surfaces:** Focused Playwright spec, visual spec/snapshots, expected story ratchet, and
  repository gates.
- **Depends on:** IC-01 and IC-02.
- **Risk:** Geometry and accessibility snapshots vary by engine; use cross-browser operability and
  at least one real-engine accessibility-tree proof, with Chromium-only CI-authoritative pixels.
