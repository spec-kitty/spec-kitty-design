---
work_package_id: WP01
title: Native workflow board and lane styles
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- FR-014
- FR-015
- FR-016
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
planning_base_branch: mission/work-package-workflow-board-styles
merge_target_branch: mission/work-package-workflow-board-styles
branch_strategy: Planning artifacts for this mission were generated on mission/work-package-workflow-board-styles. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/work-package-workflow-board-styles unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - native workflow board and lane styles
history:
- at: '2026-09-06T19:50:09Z'
  actor: codex
  action: Prompt authored during mission planning for issue
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/workflow-board/
create_intent:
- packages/styles/src/workflow-board/sk-workflow-board.css
- packages/styles/src/workflow-board/sk-workflow-board-populated.html
- packages/styles/src/workflow-board/sk-workflow-board-fitting.html
- packages/styles/src/workflow-board/sk-workflow-board-all-empty.html
- packages/styles/src/workflow-board/sk-workflow-board-one-empty-lane.html
- packages/styles/src/workflow-board/sk-workflow-board-fifty-items.html
- packages/styles/src/workflow-board/sk-workflow-board-long-labels-and-items.html
- packages/styles/src/workflow-board/sk-workflow-board-single-lane-narrow.html
- packages/styles/src/workflow-board/sk-workflow-board-html.stories.ts
- packages/styles/src/workflow-board/index.ts
- packages/styles/src/workflow-lane/sk-workflow-lane.css
- packages/styles/src/workflow-lane/sk-workflow-lane-default.html
- packages/styles/src/workflow-lane/sk-workflow-lane-empty.html
- packages/styles/src/workflow-lane/sk-workflow-lane-html.stories.ts
- packages/styles/src/workflow-lane/index.ts
- apps/storybook/src/tests/sk-workflow-board.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/tokens/src/tokens.css
- packages/tokens/dist/token-catalogue.json
- packages/styles/src/workflow-board/**
- packages/styles/src/workflow-lane/**
- packages/styles/src/index.ts
- packages/styles/package.json
- expected-stories.json
- docs/design-system/using-components.md
- apps/storybook/src/tests/sk-workflow-board.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-workflow-board-*.png
role: implementer
tags:
- styles-only
- accessibility
- workflow-board
task_type: implement
tracker_refs:
- '#209'
- '#208'
---

# Work Package Prompt: WP01 – Native workflow board and lane styles

## Do This First: Load Governed Context

Load the `frontend-freddy` profile through the Spec Kitty resolver, then load charter context for
the `implement` action and the exact review context requested by the runtime before acting. Read
`spec.md`, `research.md`, `data-model.md`, `plan.md`, `AGENTS.md`, `CLAUDE.md`, ADR-9/10/11, and
`docs/contributing/adding-a-component.md` in full. Follow the runtime-owned action prompt and use
Spec Kitty commands for lane/status/verdict mutations; never hand-edit event logs or generated
mission metadata.

This WP has no product or architecture fork. The only open value is a reversible browser
calibration for at most one lane minimum-inline-size token. If no candidate can satisfy the
documented constraints, record the measurements and stop for that exact decision. Do not solve it
with a raw value, new public modifier, JavaScript observer, custom element, or page-local rule.

## Outcome and Definition of Done

Ship two styles-only native HTML families:

1. `.sk-workflow-board` and `.sk-workflow-board__scroller`;
2. `.sk-workflow-lane`, `.sk-workflow-lane__header`, `.sk-workflow-lane__title`,
   `.sk-workflow-lane__count`, and `.sk-workflow-lane__list`.

Done means all of the following are true on one reviewed mission-branch head:

- The public selector inventory is exactly those seven selectors. Single-lane composition renders
  one consumer-selected lane through the same surface; it adds no modifier or hidden peers.
- Every lane is a native `<section>` named by its own native `h2`–`h6`, and every work item is a
  direct native `<li>` of the lane's native `<ol>` in source/display/accessibility order.
- Genuine horizontal overflow belongs only to `__scroller`, whose consumer-authored
  `role="region"` + exactly-one-name + `tabindex="0"` triad exists only in a measured overflowing
  fixture. Fitting and single-lane fixtures omit all three and add no dead tab stop.
- Empty lanes retain an empty `<ol>`; supplied empty treatment follows as a sibling. Maintained
  visible counts equal direct-listitem cardinality, including all-empty, one-empty, and 50-item
  states.
- Long labels/items wrap without overlap or focus clipping; every required viewport keeps page
  `scrollWidth <= clientWidth`; the overflowing board simultaneously has scroller
  `scrollWidth > clientWidth`.
- Dark, `.sk-light`, and forced-colors states preserve semantics. Light mode changes a real
  token-dependent computed value. Lane boundaries, empty treatment, and focus survive forced
  colors without `forced-color-adjust: none` or hue/domain-tone dependence.
- Authored HTML drives generated styles-only barrels. Root/subpath/package exports resolve, the
  token catalogue is current, and no generated file was hand-edited.
- Every required story renders a non-empty board/lane root, produces no console error, has zero
  axe WCAG 2.1 AA violations, and has the required CI-authoritative Chromium visual evidence.
- Focused and full gates pass; NI-001 through NI-010 pass; the final review/CI evidence names the
  exact current head SHA.

## Scope Boundaries

The design system owns presentation only: neutral token-driven layout, wrapping, lane boundaries,
overflow containment, and focus indication. The consumer owns board/lane data, title levels/IDs,
labels, visible and accessible count wording, lane/item order, item content, empty copy, tone,
filtering, responsive lane selection, and overflow measurement/attribute synchronization.

Do not create or modify any of these surfaces for workflow board/lane:

- `packages/elements/src/`, `packages/react/src/`, `packages/vue/`,
  `packages/elements/custom-elements.json`, `expected-parts.json`, `expected-docs.json`,
  `behaviours.json`, `mutations.json`, or `mutations.selftest.json`;
- `apps/demo/dashboard-demo.html` or another demo migration—#214 owns integration;
- a custom element, shadow root, `::part()`, wrapper, manifest/ratchet/behavior subject, or mutation;
- `sk-work-package-card`, `sk-kanban`, a workflow-item class, a full-page Work Package element, or
  any selector beyond the exact seven;
- #211's select, #212's card/marker/pulse/inline-empty work, or #214's integrated route pattern;
- drag/drop, reordering, filtering, virtualization, routing, polling, timers, observers, resize
  handlers, active-lane state, transitions, animations, or smooth scrolling;
- lane-name/status parsing, generated text/punctuation/counts, domain tone maps, or ownership that
  belongs to #177/#178.

No ARIA grid/listbox/list/listitem/row/option role may replace native semantics. No wrapper or
custom-element host may intervene between an `<ol>` and its direct `<li>` children. CSS must not
use `order`, named placement, transforms, generated `content`, or selectors into opaque item
internals to change source/reading order or meaning.

## Authored and Generated Ownership

Author only the sources named in frontmatter:

- token source only if measurement justifies
  `--sk-layout-workflow-lane-min-inline-size` in both default and `.sk-light` blocks;
- `packages/styles/src/workflow-board/sk-workflow-board.css`, all board `.html` fixtures, and
  `sk-workflow-board-html.stories.ts`;
- `packages/styles/src/workflow-lane/sk-workflow-lane.css`, lane `.html` fixtures, and
  `sk-workflow-lane-html.stories.ts`;
- styles root export/package subpaths, `expected-stories.json`, consumer docs, focused browser
  tests, and visual registrations.

Generate—never hand-edit—`packages/tokens/dist/token-catalogue.json` and both styles-only
`index.ts` files. CI-authoritative visual snapshots are generated in the repository's Linux
Chromium environment; local host screenshots are diagnostic and must not overwrite those
baselines.

## Branch and Delivery Contract

This is a `single_branch` mission. Work on
`mission/work-package-workflow-board-styles`; do not create a Spec Kitty worktree and do not push
to a long-lived branch. Immediately before final review, fetch and rebase this mission branch onto
the latest `origin/train/elements-first`—not `main`—then regenerate and rerun affected/full gates.
The outer programme orchestrator owns the PR, merge, issue comments, assignment, and epic update.

## Subtasks

### T001 — Author the failing focused acceptance and calibration contract

Create `apps/storybook/src/tests/sk-workflow-board.spec.ts` before implementation. Confirm the
focused command fails for the expected missing story/surface rather than a test-infrastructure
error; preserve that red evidence in the WP activity handoff.

The completed spec must cover:

- static source/public-surface inventory: exactly seven selectors, no generated content,
  modifier/item/domain selectors, app behavior, transition/animation, theme selector,
  `forced-color-adjust: none`, unrelated token aliases, or element/wrapper/ratchet surface;
- native DOM: every lane is `<section>`; its `aria-labelledby` resolves to its own native heading;
  every list is `<ol>`; every work item is a direct `<li>`; DOM order is unchanged;
- accessibility: one named board region only on true overflow; named lanes; native list/listitem
  count and source order in at least one real-engine accessibility snapshot/role traversal;
- triad truth: all three attributes on measured overflow, none on Fitting/SingleLaneNarrow,
  exactly one naming method, and no dead scroller in sequential tab order;
- keyboard: focus the scroller, establish a visible focus outline, press ArrowRight then ArrowLeft,
  observe corresponding `scrollLeft` movement in Chromium/Firefox/WebKit, and retain focus;
- cardinality: five populated lanes in order; five zero-item lists for all-empty; exactly one empty
  list for one-empty; count text equals direct `<li>` cardinality; empty treatment is a visible
  sibling; FiftyItems has 50 ordered direct items and supplied count `50`;
- geometry at each story's declared viewport: page containment, real board overflow where claimed,
  fitting single-lane controls, long-text availability/wrapping/no overlap, and focused descendant
  visibility;
- theme/forced colors: `.sk-light` is present and changes a paired computed token value without
  changing semantics; forced-colors keeps nonzero structural border/focus geometry and empty
  treatment without changing names/counts/containment;
- anti-vacuity: each story load waits for a visible non-empty root and fails on browser console
  errors, so a missing/broken story cannot report green.

Use behavior-oriented assertions, not shadow-DOM snapshots or CSS-property trivia. Keep engine-
specific AX detail to a supported engine while running DOM/keyboard/containment in all three
configured projects.

### T002 — Calibrate the token and author the exact CSS surface

Run a real-browser candidate sweep from 220 px through 360 px for the minimum lane inline size.
Choose the smallest candidate that simultaneously:

1. wraps representative and long opaque item content without overlap/focus clipping;
2. lets one lane fit at the declared 320 px and 360 px narrow story viewports;
3. makes the five-lane reference genuinely overflow its scroller; and
4. keeps the document width inside the viewport in Chromium, Firefox, and WebKit.

Record candidate, viewport, scroller `clientWidth`/`scrollWidth`, page widths, wrapping, and focus
observations in the focused test/rationale. If one value is justified, add only
`--sk-layout-workflow-lane-min-inline-size` in the existing layout category with the same value in
both theme blocks, regenerate the catalogue, and prove each lane's computed minimum resolves to
it. Do not reuse a shell/sidebar token or copy raw dashboard literals.

Then author both CSS files. Every color, spacing, size, radius, border, typography, weight,
line-height, and focus value resolves through authoritative `var(--sk-*)` tokens with no fallback.
Use neutral paired surfaces/foregrounds only. The scroller alone owns horizontal overflow; lane
and item text can shrink/wrap without widening the page. Use an outline, not box-shadow alone, for
focus. Plain borders should survive forced colors through UA remapping; use sanctioned system
colors only inside `@media (forced-colors: active)` and only if measurement proves a background-
drawn cue needs it. Never use `forced-color-adjust: none`.

The CSS must contain only the seven selectors. Single-lane uses identical CSS with one supplied
section. Author no motion; therefore add no inert reduced-motion block.

### T003 — Author native fixtures and Storybook states

Create canonical authored `.html` fixtures in the two styles directories. A lane is always:

```html
<section class="sk-workflow-lane" aria-labelledby="lane-id">
  <header class="sk-workflow-lane__header">
    <h3 class="sk-workflow-lane__title" id="lane-id">Consumer lane label</h3>
    <span class="sk-workflow-lane__count" aria-label="2 work packages">2</span>
  </header>
  <ol class="sk-workflow-lane__list">
    <li><!-- opaque consumer-owned content --></li>
  </ol>
</section>
```

All IDs must be unique within a rendered fixture. Consumer text/counts are literals; no script or
stylesheet calculates them. Empty content follows an empty `<ol>` as a sibling and may compose the
existing `.sk-empty-state` surface without adding #212's future `--inline` modifier.

Board fixtures and separately addressable board stories cover `Populated`, the explicit
non-overflow `Fitting` control, `AllEmpty`, `OneEmptyLane`, `FiftyItems`,
`LongLabelsAndItems`, `SingleLaneNarrow`, `ForcedColors`, `DefaultDark`, and `LightMode`.
Also export canonical `Default` rendering the populated dark fixture. `Populated`, ForcedColors,
and any other fixture that is measured to overflow carry the complete triad with
`aria-labelledby` to the visible board heading. Fitting and SingleLaneNarrow omit `role`, both
accessible-name attributes, and `tabindex`.

The lane story module exposes at least `Default`, `Empty`, and `LightMode`. Every story enables
a11y; every `LightMode` is actually wrapped in `class="sk-light"` and uses the repository's light
background parameter. Import authored CSS and generated HTML exports; do not duplicate fixture
markup inside TypeScript. Do not add JavaScript measurement, state, filters, or responsive lane
selection to a story—the fixtures document truthful already-measured branches and the consumer
contract.

### T004 — Generate distribution and document the consumer contract

Run in dependency order:

```bash
npx nx run tokens:catalogue
node scripts/build-styles-only-markup.mjs
node scripts/build-styles-only-markup.mjs --check
```

Confirm the generator discovers both CSS-backed directories with no matching element directory and
produces sorted `index.ts` exports for every authored `.html` file. Do not modify the generator or
generated barrels. Add both alphabetical root exports in `packages/styles/src/index.ts` and both
package subpaths in `packages/styles/package.json`.

Add every board/lane story ID to `expected-stories.json` and update its explanatory count/history
exactly. Document in `docs/design-system/using-components.md`:

- the exact native markup and seven-selector vocabulary;
- direct section/heading and `<ol>`/`<li>` invariants;
- the empty-list-plus-sibling pattern and consumer-supplied counts/order/content;
- the conditional all-or-none overflow triad, exactly one accessible naming method, and a concise
  consumer measurement example that rechecks after relevant layout/content changes;
- one-lane mobile composition as consumer-owned selection, with no hidden state in the library;
- token dependencies and neutral/no-domain-tone behavior.

The example may explain consumer logic, but no runtime helper, observer, event API, parsing, or
application vocabulary enters the package. Assert root and subpath imports resolve from the built
package and that `npm pack --dry-run` includes both CSS/HTML/barrel surfaces.

### T005 — Complete browser, axe, and visual evidence

Turn T001 green without narrowing its assertions. Build Storybook once, then run the focused spec
in Chromium, Firefox, and WebKit. Preserve native AX role/name/count/order evidence and prove the
triad/keyboard/page-containment branches from actual geometry.

Run the repository axe runner across all ratcheted stories; require every new board/lane story to
produce a non-empty root, no console error, and zero WCAG 2.1 AA violations. Do not accept a skipped
or failed-to-load story as zero violations.

Register Chromium screenshots in `visual.spec.ts` for at least populated dark, fitting, all-empty,
one-empty, 50-item, long labels/items, single-lane narrow, light, and forced-colors states. Keep
snapshots CI-authoritative: use the `visual-regression-diffs` artifact from the pinned Linux
Chromium job, inspect each actual image, and commit only approved baseline output. A local update
is diagnostic, not authoritative.

### T006 — Run focused-first and full verification

Run focused checks immediately after the relevant change, then the full repository sequence. At a
minimum, evidence includes:

```bash
npx nx run tokens:catalogue
node scripts/build-styles-only-markup.mjs
node scripts/build-styles-only-markup.mjs --check
npx nx run styles:build
node scripts/typecheck-all.mjs
npm run quality:all
npm run test
npx nx run storybook:storybook:build
node scripts/run-axe-storybook.js
npx playwright test apps/storybook/src/tests/sk-workflow-board.spec.ts
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

Also run the current recipe/CI gates in dependency order: all element CSS/markup/React/Vue
generators and their check/selftest modes; tokens/styles/elements builds before size measurement;
manifest/content/entry/adopted-CSS/part/story-theme/gate-wiring/ADR/LLM surface checks;
`suite-selftest.mjs` and its selftest; Storybook assembly; release graph and selftest; packed Vue
types; offline-load check and selftest; npm audit, lockfile dry-run, and Action pin checks. Commit
every legitimately regenerated artifact, then repeat check modes against a clean tree.

Perform a final diff-scoped negative audit that fails if any of NI-001 through NI-010 appears.
Specifically inspect element/wrapper/manifest/ratchet files, all public selectors, generated
content and ARIA roles, direct list parentage, state/observer/router/filter/timer/motion code,
domain/tone vocabulary, raw design values/theme selectors/forced-color opt-out, page overflow,
empty/count drift, and #211/#212/#214 surface creep. Do not weaken, skip, mute, delete, reclassify,
or threshold-relax a gate to obtain green.

### T007 — Rebase and bind final evidence to one exact SHA

Immediately before the final gate:

1. fetch `origin/train/elements-first` and rebase the mission branch onto its current tip;
2. rerun the token catalogue and styles-only generators, then every affected focused/full gate;
3. if rendering legitimately changed, regenerate/review snapshots only in the CI-authoritative
   environment;
4. push the mission branch (use `--force-with-lease` only if the rebase requires it);
5. wait for every required CI job on that exact head SHA to pass; and
6. run the full read-only pre-merge adversarial gate with `architect-alphonso`,
   `reviewer-renata`, `debugger-debbie`, and `randy-reducer`, each profile-resolved and loaded with
   review-scoped charter context.

Each finding records severity, file and line, explanation, recommendation, and disposition.
Fold valid findings or defer them only to a numbered issue. A rebase, fix, baseline commit, or any
later push invalidates both CI and adversarial evidence; rerun both against the new SHA. The WP is
ready for programme acceptance only when local evidence is green, CI is green at current head,
the adversarial comment names that exact SHA, and every finding has a disposition.

## Requirement and Negative-Invariant Traceability

| Contract                                        | Evidence                                                                                                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001, FR-002, SC-001                          | CSS and generated-package inventory equals exactly the seven selectors; one-lane adds no modifier.                                                             |
| FR-003, FR-009, NFR-003–NFR-005, SC-003, SC-004 | Measured true/fitting fixtures, complete-or-absent triad, useful tab order, visible focus, Arrow scrolling, named region, and page containment across engines. |
| FR-004, FR-005, SC-002                          | Native named sections/headings and direct native ordered lists/items in DOM and accessibility order.                                                           |
| FR-006–FR-008, FR-010, SC-005                   | Consumer-owned text/count/order/content/state; empty list plus sibling; count/cardinality truth; one supplied mobile lane.                                     |
| FR-011, SC-006, SC-007                          | Exact 50-item source/AX order, long-content wrapping/focus visibility, narrow fit, and no page overflow.                                                       |
| FR-012, NFR-007, SC-009, SC-010                 | Neutral structural cues, real `.sk-light` computed difference, forced-colors border/empty/focus evidence.                                                      |
| FR-013, NFR-002, NFR-008, SC-008                | Every named story is ratcheted, non-empty, console-clean, axe-clean, and browser reachable.                                                                    |
| FR-014, FR-015, NFR-006, SC-011                 | Authored HTML, generated barrels/catalogue, package root/subpaths/pack contents, and docs agree byte-for-byte and semantically.                                |
| FR-016                                          | Approved CI-authoritative visual baselines for all required dark/light, overflow/fitting, empty, long/scale, narrow, and forced-colors states.                 |
| NFR-001, C-008                                  | Existing token taxonomy plus at most one measured theme-invariant layout token; no raw values/fallbacks or unrelated alias.                                    |
| NI-001, C-001                                   | No element, wrapper, manifest, parts/docs ratchet, behavior, or mutation surface.                                                                              |
| NI-002                                          | Exact selector inventory rejects item/modifier/domain selectors.                                                                                               |
| NI-003                                          | Source/AX checks reject generated label/count/separator/punctuation.                                                                                           |
| NI-004, C-006                                   | Direct `<ol>`/`<li>` and native role checks reject forged semantics/intervening hosts.                                                                         |
| NI-005, C-002–C-005                             | Delta scan rejects application state/behavior/motion/tone and adjacent ownership.                                                                              |
| NI-006                                          | Paired geometry/tab-order fixtures enforce the indivisible overflow triad.                                                                                     |
| NI-007                                          | Page containment runs across every required state and viewport.                                                                                                |
| NI-008                                          | Empty/one-empty/populated/50-item DOM and AX cardinality checks reject fake items/count drift.                                                                 |
| NI-009                                          | Token/style/computed gates reject raw values, theme selectors, inert light wrappers, and forced-color opt-out.                                                 |
| NI-010, C-007                                   | Delta excludes #211/#212/#214 and remains independently deliverable from the current foundation.                                                               |

## Handoff Evidence

Report to the reviewer and orchestrator:

- final head SHA and rebase base SHA;
- the chosen lane-token value and cross-browser measurement table, or evidence that no token was
  required;
- authored versus generated file inventory and clean generator checks;
- focused command results for Chromium/Firefox/WebKit, axe, Storybook, and visual regression;
- full gate results and CI run URL for the exact SHA;
- CI-authoritative visual artifact/baseline disposition;
- NI-001 through NI-010 disposition and any numbered deferral;
- four adversarial lens verdicts tied to the exact SHA.

Do not claim the WP complete with partial work, stale CI/review evidence, local-only screenshots,
an unclean tree, or a failure that was skipped instead of diagnosed.
