---
work_package_id: WP02
title: Complete controlled transition matrix and release evidence
dependencies:
- WP01
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
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
- FR-017
- FR-018
- FR-019
- FR-020
- FR-021
- FR-022
- FR-023
- FR-024
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
planning_base_branch: mission/flow-health-transition-matrix
merge_target_branch: mission/flow-health-transition-matrix
branch_strategy: Planning artifacts for this mission were generated on mission/flow-health-transition-matrix. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/flow-health-transition-matrix unless the human explicitly redirects the landing branch.
subtasks:
- T005
- T006
- T007
- T008
- T009
- T010
- T011
phase: Phase 2 - Complete component and release evidence
history:
- timestamp: '2026-09-04T16:25:01Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/transition-matrix/
create_intent:
- packages/styles/src/transition-matrix/sk-transition-matrix.css
- packages/elements/src/transition-matrix/sk-transition-matrix.ts
- packages/elements/src/transition-matrix/sk-transition-matrix.stories.ts
- packages/elements/src/transition-matrix/sk-transition-matrix.css.js
- packages/elements/src/transition-matrix/sk-transition-matrix.css.d.ts
- fixtures/elements-behaviour/src/sk-transition-matrix.test.ts
- apps/storybook/src/tests/sk-transition-matrix.spec.ts
- packages/react/src/SkTransitionMatrix.js
- packages/react/src/SkTransitionMatrix.d.ts
execution_mode: code_change
owned_files:
- packages/styles/src/transition-matrix/**
- packages/elements/src/transition-matrix/**
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- fixtures/elements-behaviour/src/sk-transition-matrix.test.ts
- fixtures/react-consumer/src/wrappers.test.tsx
- tests/node/react-wrappers.test.ts
- apps/storybook/src/tests/sk-transition-matrix.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/*transition-matrix*.png
- docs/design-system/using-components.md
- docs/design-system/using-react.md
- docs/design-system/changelog.md
- scripts/normalise-manifest.mjs
- scripts/build-react-wrappers.mjs
- scripts/check-manifest-content.mjs
- behaviours.json
- mutations.json
- expected-docs.json
- expected-parts.json
- expected-stories.json
- packages/elements/custom-elements.json
- packages/react/src/SkTransitionMatrix.js
- packages/react/src/SkTransitionMatrix.d.ts
- packages/react/src/index.js
- packages/react/src/index.d.ts
- packages/react/src/react-utils.js
- packages/react/.wrapper-floor
- packages/elements/SIZES.md
priority: P1
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#149'
- '#144'
- '#125'
---

# WP02 — Complete controlled transition matrix and release evidence

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `codex`

If the profile cannot be loaded, run `spec-kitty agent profile show frontend-freddy` and apply the
resolved identity, boundaries, and initialization before continuing.

---

## Objective

Deliver the complete reusable `<sk-transition-matrix>` and its component evidence: public
types and controlled intent, token-only responsive rendering, semantic/a11y behavior, nine stories,
consumer-owned copy, red-first element behavior and acceptance tests, synchronized docs and ratchets,
and all non-visual generated artifacts in WP02 scope. Finish with a truthful component-evidence
handoff to WP03. Do not claim the upstream rebase, unavailable local WebKit, the reproducibly hanging
local guard selftest, or the nine CI-authoritative PNG baselines complete. WP03 owns dedicated React
runtime/type evidence; after its approval, mission wrap-up owns the whole-branch rebase/regeneration,
and the single draft mission PR owns baseline harvesting, CI and the final exact-SHA gate.

Run this WP only after WP01 is approved:

```sh
spec-kitty agent action implement WP02 --agent codex
```

## Context

Issue #149 replaces a WP-per-line flow trace with a route-by-time-bucket matrix. The approved fixture
has six routes, four columns, 24 values, five tones, route totals `21, 17, 11, 6, 4, 3`, and an overall
total of `62 moves`. It is consumer data; the element never receives supplied totals or open-WP
inventory. Fifty active WPs alter aggregate counts, not the number of rows, labels, or targets.

The application owns fetching, stores, loading/error orchestration, polling, timers, date labels,
time-window/description/selection-hint copy, timezones, route aggregation, selected state, navigation,
and current/open inventory. The element owns only generic move semantics, presentation, local
accessibility mechanics, input validation, pure render-time derivations, and one intent event.
`selectedRouteId` is controlled. `selectable` alone opts rows into interaction.

The selection event is deliberately non-cancelable, per the operator’s confirmation:

```ts
new CustomEvent<TransitionMatrixSelectDetail>('sk-transition-matrix-select', {
  detail: { routeId },
  bubbles: true,
  composed: true,
  cancelable: false,
});
```

There is no component default action after dispatch. Activating a row never assigns
`selectedRouteId`, navigates, or mutates consumer data. Do not register SC-009; cancellation evidence
is inapplicable, not waived.

### Branch strategy

- WP02 depends on WP01 and runs in the same Spec Kitty lane because their shared generator/ratchet
  paths overlap. Use only the workspace and branch emitted by the runtime action.
- Merge the reviewed WP02 result back into `mission/flow-health-transition-matrix`; WP03 follows in
  the same serial lane. Do not push or open a WP-specific PR.
- Do not rebase between WP02 and WP03. Spec Kitty has one shared lane and no safe partial-WP
  merge/reparent seam; WP02 records the remaining consolidation work in T011 and proceeds to review.
- After WP03 approval and integration, mission wrap-up fetches current `train/elements-first`,
  rebases the whole mission branch and resolves shared generated files by regenerating from source.
  Stop if a conflict touches sibling authored component source. An artifact conflict is never
  permission to edit another mission’s source.
- Only after WP03 is reviewed and integrated, present exactly one draft PR from the mission branch
  into `train/elements-first`, with `Refs #149`. That one PR supplies CI-authoritative mutation
  timing, budget disposition, Storybook build duration, all nine CI-sourced baseline bytes, visual
  evidence, and the final gate. It
  remains draft until the full pre-merge squad and all evidence are pinned to its post-CI head, the
  Storybook step is recorded below 180 seconds, and at least one maintainer has approved that exact
  head SHA. A later push invalidates the timing and approval records. Merging the integration train
  to `main` remains an operator act.

## Scope and requirement trace

WP02 covers FR-001 through FR-024, NFR-001 through NFR-010, and C-001 through C-010 as the component
implementation boundary. WP03 independently closes the dedicated React and final-gate subset. The
frontmatter paths are the maximum allowed write scope. Some existing
shared files should change only if deterministic generation or the feature’s explicit registry/docs
entries require it.

Hard exclusions:

- no `packages/tokens/**`, package manifest, lockfile, ADR, validation/learnings history, Team Kitty
  code, or sibling TKO1–TKO4 authored source;
- no `<sk-team-overview>`, `sk-stat-grid`, `sk-action-link`, second grid/button/tag, or Current/open-WP
  summary;
- no transition-matrix `.markup.ts`, generated static `.html`, or styles-layer `index.ts` because the
  structured-data component has no honest data-independent static form;
- no application router/store/fetch/timer/clock/domain import;
- no hand edit under `packages/react/src` or of generated CSS modules.
- no edit to `fixtures/react-consumer/src/wrappers.test.tsx`. That legacy excess path remains in
  initialized WP02 ownership because the CLI cannot remove it; actual generic ownership and use stay
  solely in WP01. Metadata cleanup is deferred to Spec Kitty ledger item SK-176, and the stale path
  grants WP02 no write permission in practice.

Explicit narrow shared-surface authorization: #149 permits only the generic property-only AST/CEM
marker, manifest-doc gate, generated wrapper property delivery, and immutable empty-array prop-removal
reset established by WP01. No unrelated generator refactor is permitted.

### T005: Write acceptance, behavior, mutation, and type evidence red-first

**Purpose:** Establish externally observable contracts before production code, with one surgical
failure per behavior/acceptance claim instead of snapshots or “it renders” checks.

**Steps:**

1. Create a compile-safe `packages/elements/src/transition-matrix/sk-transition-matrix.ts` contract
   scaffold first: exported public types/properties, registered tag, and a labelled non-empty
   unavailable render root. It may omit behavior, but it must compile and load so the first red is a
   named missing contract—not a missing import, parser error, unregistered element, or blank render.
2. Create `fixtures/elements-behaviour/src/sk-transition-matrix.test.ts` and begin with readonly
   canonical fixture builders. Include the exact clean-v4 four columns and six routes; never encode
   route or overall totals as inputs.
3. Add acceptance tests for:
   - exact 24 intersections, derived route totals and `62 moves` overall;
   - exact non-zero `value / currentGlobalMax` ratios, zero-length zero bars, and recomputation after
     replacing routes with data whose maximum is different;
   - row/column reorder preserving id-to-value relationships without mutating inputs;
   - legend filtering and fixed five-tone order;
   - contiguous optional groups preserving every route name;
   - empty routes, empty columns, all-zero rectangular data, and invalid data;
   - duplicate/empty ids; missing/unknown value keys; negative, fractional, `NaN`, and infinite values;
   - unknown selected id and controlled selected-state reassignment;
   - complete non-selectable absence, including when a selected id is supplied.
4. Do **not** add production `mutations.json` entries or behavior-registry pairs in this task: their
   source anchors do not exist yet. T006/T007 add them only after complete source exists. This order
   keeps the mutation run compile-safe and prevents a missing-source failure from masquerading as red
   evidence.
5. Add unbracketed mission acceptance tests for totals, proportional ratios/max reassignment,
   controlled selection, headers, legend filtering, invalid input, aggregation, positive/negative
   selectable affordances, and narrow ownership. Each test name contains its FR/NFR/mission-SC refs
   as plain text, never `[SC-nnn]`, because brackets are reserved for actual ADR registry pairs.
6. Extend the element type tests. Valid readonly columns/routes, five tones, optional selected id,
   the three consumer-copy strings, boolean selectable, and typed event must compile. Invalid
   tone/count/detail examples must fail with `@ts-expect-error`. WP03 owns the React type surface.
7. Run the new tests against the compile-safe scaffold, capture only the intended named failures as
   WP evidence, then proceed to T006. Never commit a deliberate source break or claim a missing import,
   parser failure, unregistered tag, blank render, or suite-wide compile failure as red-first proof.

**Files:**

- `fixtures/elements-behaviour/src/sk-transition-matrix.test.ts` (new)
- `packages/elements/src/transition-matrix/sk-transition-matrix.ts` (compile-safe scaffold)
- `tests/node/react-wrappers.test.ts`
- `expected-docs.json`
- `expected-parts.json`
- `expected-stories.json`

**Validation:**

The scoped single-file Vitest commands deliberately use the default reporter; the custom suite
floor applies only to the complete `npm run test` run.

```sh
npx vitest run --project browser fixtures/elements-behaviour/src/sk-transition-matrix.test.ts --reporter=default
npx vitest run --project node tests/node/react-wrappers.test.ts --reporter=default
node scripts/typecheck-all.mjs
```

The initial red must name the intended missing behavior while the scaffold compiles and renders its
labelled unavailable root. Production mutation entries wait until their source anchors exist.

### T006: Implement immutable data, derived totals, validation, and controlled intent

**Purpose:** Create the complete public model and pure behavior without importing application state or
inventing redundant measures.

**Steps:**

1. Complete the compile-safe `packages/elements/src/transition-matrix/sk-transition-matrix.ts`
   scaffold and export exactly:
   `SkTransitionMatrix`, `TransitionColumn`, `TransitionTone`, `TransitionRoute`,
   `TransitionMatrixSelectDetail`, and `TransitionMatrixProperties` as specified in `plan.md`.
2. Define the seven public properties only:
   - `columns`: readonly array, `{ attribute: false }`, immutable empty-array default;
   - `routes`: readonly array, `{ attribute: false }`, immutable empty-array default;
   - `selectedRouteId`: string attribute `selected-route-id`, default `undefined`;
   - `selectable`: reflected boolean, default `false`;
   - `windowLabel`: string attribute `window-label`, empty default;
   - `description`: string attribute `description`, empty default;
   - `selectionHint`: string attribute `selection-hint`, empty default.
3. Document each property for consumers. Add `@element`, typed `@fires`, and all exact `@csspart`
   declarations. Put rationale in `//`, not published `/** */` prose. Declare no methods or slots.
4. Validate on current references without mutating, freezing, sorting, or annotating consumer input.
   Require non-empty unique ids; exact value-key/column-id equality; and finite non-negative integer
   values. Invalid data renders a meaningful non-interactive unavailable state and fabricates no
   cells, totals, legend entries, or targets.
5. Preserve consumer order, materialize cells by stable id, derive route totals and overall total from
   cells, and derive the global max. Every non-zero bar ratio is exactly `value / currentGlobalMax`;
   zero values stay numeric zero and render the approved dash; if max is zero every ratio is zero.
   Replacing routes recomputes the maximum and every ratio from the new references.
6. Derive present tones in fixed order: forward, completed, blocked, recovery, backward. Derive only
   contiguous group runs from opaque group strings. Render route/group/column and consumer-copy
   strings verbatim. Keep `Flow health`, derived `<total> moves`, `Route`, `Total`, tone labels, and
   `bar length ∝ moves` generic. Never hard-code `last 72 hours`, “day”, or “WPs” in element source.
7. Project selection only by comparing route ids with `selectedRouteId`. Unknown ids select nothing
   and are not repaired.
8. Use one activation method for pointer, Enter, and Space when `selectable` is true. Space prevents
   scroll; repeated keydown emits no duplicate. Dispatch one bubbling/composed/non-cancelable event.
   Do not update selection or data.
9. Export from `packages/elements/src/index.ts` and side-effect import in
   `packages/elements/src/elements.ts` through the guarded `define()` convention.
10. Once these anchors exist, add only the actually applicable element event/property ADR registry
    pairs: SC-006, SC-007, SC-008, and SC-010. The subject file is
    `fixtures/elements-behaviour/src/sk-transition-matrix.test.ts`; WP03 later adds the distinct React
    SC-006/SC-010 pairs. Do not register ADR SC-009, SC-011, SC-012, or SC-015.
11. Add a unique `mutations.json` production-source mutation for each new element pair and run the main
    mutation harness. Then make and restore named source breaks for non-registry model/interaction
    acceptance tests—totals, proportional formula/max reassignment, validation, legend filtering,
    controlled selection, and selectable absence—and record command, source before→after, exact
    intended failing test, red output, restoration SHA/diff and green rerun in WP evidence. The same
    evidence set must include 50-WP aggregation and positive selectable hover/focus-visible/active-
    or-pressed states; defer those explicit post-implementation source/style mutation arms to T010,
    when their story, styles, and named Playwright tests exist.

**Files:**

- `packages/elements/src/transition-matrix/sk-transition-matrix.ts` (new)
- `packages/elements/src/index.ts`
- `packages/elements/src/elements.ts`

**Validation:**

The scoped single-file Vitest command deliberately uses the default reporter; the custom suite
floor applies only to the complete `npm run test` run.

```sh
npx vitest run --project browser fixtures/elements-behaviour/src/sk-transition-matrix.test.ts --reporter=default
npx nx run elements:build
node scripts/typecheck-all.mjs
node scripts/check-elements-entries.mjs
node scripts/check-elements-entries.mjs --selftest
node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest
```

Also inspect the test DOM to confirm activation alone leaves `aria-selected` and the public property
unchanged until the consumer assigns a new value.

### T007: Build the semantic table, parts, token-only styling, and narrow layout

**Purpose:** Match the approved information grammar in both themes while preserving table
relationships and route ownership at narrow widths.

**Steps:**

1. Create `packages/styles/src/transition-matrix/sk-transition-matrix.css` as the sole authored CSS
   source. Declare a block-level host and use BEM classes internally.
2. Use only existing `--sk-*` tokens. No raw color, length, font, radius, motion, or stacking value;
   no theme selector; no `:host-context()`. Danger red is authorized only for the blocked tone in
   this component. Recovery is purple, backward neutral, and semantic surfaces/foregrounds remain
   paired.
3. Render a labelled section with component-owned generic copy: `Flow health`, derived `<total>
   moves`, `Route`, `Total`, tone labels and `bar length ∝ moves`. Append `windowLabel` only when
   non-empty, render `description` only when non-empty, and render `selectionHint` only when both
   non-empty and selectable. All three strings are verbatim consumer values; the clean-v4 phrases
   belong in story data, not element source.
4. Render a native `<table>` inside the scroller. The header begins `Route`, includes every supplied
   column label, and ends `Total`. Use `scope="col"`, `th[scope="row"]`, stable component-owned header
   ids, cell `headers`, and route-total descriptions so each intersection is recoverable.
5. Render named group runs as visible full-width heading rows and labelled `<tbody>` groups without
   replacing route headers or erasing table semantics.
6. Expose exactly these ten public parts: `header`, `legend`, `scroller`, `table`, `group`, `row`,
   `route`, `bar`, `total`, `empty-state`. Do not expose a generic cell, dynamic tone part, icon part,
   slot, public CSS class, or component custom property.
7. Pair legend/row colors with visible tone text. Add distinct decorative Lucide-compatible
   prohibition/directional SVGs where planned, marked `aria-hidden`; text remains the accessible
   meaning.
8. Give magnitude bars substantial block weight and proportional inline size via an internal ratio
   property that is exactly `value / currentGlobalMax`. Do not animate by default. Reduced motion
   must remove any incidental transition.
9. Use horizontal overflow and a sticky opaque first column at narrow widths. Keep route labels
   bounded/wrapping and prevent labels, counts, bars, totals, and group separators from overlapping.
10. Without `selectable`, render no tabindex, event listener, cursor, hover treatment, focus ring,
    active/pressed treatment, or prompt; this is the component's disabled-interaction analogue.
    With it, each route is one target and hover, focus-visible, pointer-active and keyboard-pressed
    input clearly communicate action. Pressed treatment is transient input state, not a public
    property or story-simulation class.
11. Export the generated stylesheet as the named `skTransitionMatrixSheet` symbol and re-export it
    through `packages/elements/src/index.ts`. Test adopted-sheet identity against that package-boundary
    export—not against `Ctor.styles[0]`—and require exactly one adopted sheet plus zero shadow
    `<style>` nodes.
12. Add ADR registry pairs SC-013 and SC-014 only after parts and stylesheet anchors exist. Give each
    `(id, subject file)` a unique mutation; keep SC-014's empty-sheet-array and identity-swap arms.
    Run both the main harness and its selftest. Separately record real source-break reds for table
    headers and narrow sticky ownership without assigning them invented ADR ids.
13. Publish the component's complete distinct `--sk-*` dependency list in class JSDoc and Storybook
    docs, and add an objective test/gate comparison against tokens actually referenced by the authored
    CSS. Missing and extra published tokens both fail.

**Files:**

- `packages/styles/src/transition-matrix/sk-transition-matrix.css` (new)
- `packages/elements/src/transition-matrix/sk-transition-matrix.ts`
- `expected-parts.json`
- `fixtures/elements-behaviour/src/sk-transition-matrix.test.ts`

**Validation:**

The scoped single-file Vitest command deliberately uses the default reporter; the custom suite
floor applies only to the complete `npm run test` run.

```sh
node scripts/build-elements-css.mjs
node scripts/build-elements-css.mjs --check
node scripts/check-part-ratchet.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-adopted-css-boundaries.mjs --selftest
node scripts/check-element-css-hygiene.mjs
npm run quality:stylelint
npx vitest run --project browser fixtures/elements-behaviour/src/sk-transition-matrix.test.ts --reporter=default
node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest
```

Test every literal `::part(name)` externally. Verify the adopted sheet has length one, is identical to
the named generated `skTransitionMatrixSheet` package export, and injects zero shadow `<style>`
elements. Compare the published token list exactly with the CSS source's token-reference set.

### T008: Publish nine stories, interaction states, and synchronized consumer documentation

**Purpose:** Make every required state independently inspectable and keep the public usage guidance in
sync with the generated API.

**Steps:**

1. Create `packages/elements/src/transition-matrix/sk-transition-matrix.stories.ts` with title
   `Elements/SkTransitionMatrix`, autodocs, and enabled a11y. Assign structured properties through the
   element/property render path; never serialize the arrays into markup attributes.
2. Export exactly the nine expected story names:
   - `Default`: a compact valid non-selectable matrix with no Team Kitty window/day/WP copy;
   - `ApprovedExample`: exact six routes, four date labels, 24 cells, five tones, group separator,
     selectable mode, derived `62 moves`, totals `21/17/11/6/4/3`, and consumer-supplied
     `windowLabel="last 72 hours"`, `description="Moves grouped by route and day."`, and
     `selectionHint="Select any row to inspect its WPs."`;
   - `FiftyActiveWPs`: aggregate routes only, zero WP ids/edges/targets, and no claim total equals 50;
   - `SparseData`: explicit zeros and only a subset of tones, with unused legend tones absent;
   - `EqualTotalsDifferentDistribution`: equal totals with observably different daily bars;
   - `Empty`: intentional labelled empty root with no focus target;
   - `ControlledSelection`: action logs typed intent and changes selection only when story-owned state
     assigns the new id; include an inspectable non-selectable selected state;
   - `SelectableStates`: a stable selectable-row target for Playwright to assert resting versus
     real hovered, keyboard-focused, pointer-active and keyboard-pressed computed styles
     independently, plus the non-selectable disabled-interaction analogue in the same story;
   - `LightMode`: `.sk-light` wrapper and light background, with equivalent data/semantics.
3. Add all nine exact built ids to `expected-stories.json` and update its total. Do not rely on review
   to catch a missing LightMode.
4. Verify dark/light computed token values actually differ while content and relationships remain the
   same. Do not use `data-theme="light"` on a wrapper. In `SelectableStates`, use real Playwright
   hover, keyboard focus, pointer-down and keyboard-down input and require specific computed cursor/
   background/border/outline/pressed changes relative to rest. Pressed treatment must clear on
   release, cancellation, or blur and may not be faked by a story-only class. Treat the
   non-selectable variant as the component's disabled-interaction analogue: it has no hover, focus,
   active or pressed delta and does not require a public `disabled` prop or a tenth story.
5. Update `docs/design-system/using-components.md` with the public element API, property assignment,
   event/controlled-selection example, and the moves-versus-inventory boundary.
6. Update `docs/design-system/using-react.md` with typed readonly `columns`/`routes`, the three
   consumer-copy props, `selectable`, `selectedRouteId`, callback usage, and the documented empty-array
   reset when a previously supplied structured prop is removed. Do not imply attribute serialization
   or local selection.
7. Add a concise additive entry to `docs/design-system/changelog.md`. Keep exact component copy in
   sentence case and use no Team Kitty-specific stateful component language.
8. Publish the exact token dependency list in the story's component docs and class JSDoc, and run the
   CSS-source versus published-list equality proof required by T007.

**Files:**

- `packages/elements/src/transition-matrix/sk-transition-matrix.stories.ts` (new)
- `expected-stories.json`
- `docs/design-system/using-components.md`
- `docs/design-system/using-react.md`
- `docs/design-system/changelog.md`

**Validation:**

```sh
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
npx nx run storybook:storybook:build
node scripts/run-axe-storybook.js
```

Inspect the built Storybook index and require all nine transition-matrix ids. A story load failure or
empty render root is a failure, not zero axe violations.

### T009: Regenerate and prove distribution, manifest, React, entries, and size artifacts

**Purpose:** Ship the component through all established consumers without hand-authored duplication or
generated drift.

**Steps:**

1. Run generation in the prescribed order: constructed CSS module, markup generator (which must
   produce no transition-matrix static form), CEM analyze/normalize, React wrappers, builds, then size
   measurement.
2. Confirm the manifest describes:
   - seven public properties, split as five attributes and two property-only members;
   - `x-spec-kitty-property-only: true` only on `columns` and `routes`;
   - proven empty-array reset metadata only on `columns` and `routes`;
   - their readonly structured types and non-empty descriptions;
   - one typed event with documented bubbling/composed/non-cancelable flags;
   - ten parts, zero methods, and zero slots.
3. Add the component’s exact docs-ratchet row: `attributes: 5`, `properties: 2`, `methods: 0`, and
   update the total under the WP01 schema.
4. Inspect generated React declarations for readonly columns/routes, `selectedRouteId`, optional
   `selectable?: boolean`, optional `windowLabel`/`description`/`selectionHint`, and a callback whose
   detail has `routeId: string`. WP03 adds the owned compile-time consumer proof.
5. Confirm generated runtime calls `useProperties` for arrays, sets neither `columns` nor `routes`
   attributes, preserves array identity before definition, replaces identities on rerender, and
   resets each omitted prop to a frozen empty array rather than retaining stale data. WP03 proves
   those runtime outcomes in the dedicated React subject.
6. Update element entry points and generated React indexes. Raise `.wrapper-floor` and regenerate
   `SIZES.md` only through their scripts. Require and re-export the generated
   `skTransitionMatrixSheet` symbol through the package boundary.
7. Never hand-edit `SkTransitionMatrix.js`, `.d.ts`, generated `.css.js/.d.ts`, manifest, indexes, or
   size bytes. If generated output is wrong, repair the authored element/JSDoc/generator source and
   regenerate.

**Generated files expected:**

- `packages/elements/src/transition-matrix/sk-transition-matrix.css.js`
- `packages/elements/src/transition-matrix/sk-transition-matrix.css.d.ts`
- `packages/elements/custom-elements.json`
- `packages/react/src/SkTransitionMatrix.js`
- `packages/react/src/SkTransitionMatrix.d.ts`
- `packages/react/src/index.js`
- `packages/react/src/index.d.ts`
- `packages/react/src/react-utils.js` only if deterministic generator output requires it
- `packages/react/.wrapper-floor`
- `packages/elements/SIZES.md`

**Generation and focused validation:**

```sh
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze
node scripts/build-react-wrappers.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs

node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
npx nx run elements:analyze
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/build-react-wrappers.mjs --check
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs
node scripts/check-manifest-content.mjs --selftest
node scripts/check-elements-entries.mjs
node scripts/measure-elements-sizes.mjs --check
node scripts/typecheck-all.mjs
```

The second analyze must leave the manifest byte-identical. Generated drift is fixed at its authored
source; it is never accepted as a manual patch.

### T010: Add Storybook behavior, axe, scale, narrow-scroll, and visual evidence

**Purpose:** Prove the matrix remains legible, operable, and visually faithful in the environments
where unit-level semantic assertions are insufficient.

**Steps:**

1. Create `apps/storybook/src/tests/sk-transition-matrix.spec.ts` and load each relevant story by its
   exact id. Wait for the `sk-transition-matrix` host and a non-empty expected internal target; never
   replace this with a bare page-load wait.
2. Assert the approved story’s six rows, four columns, 24 values, totals, legend order, group label,
   consumer-supplied window/description/hint copy, generic derived move label, and absence of the
   Current/open-WPs summary. Assert a non-approved story omitting those props contains none of the
   clean-v4 `last 72 hours`/day/WP phrases.
3. At a narrow initial viewport, horizontally scroll the matrix and prove the sticky route header
   remains visible/associated while cells, bars, labels, and totals do not overlap. Include long labels.
4. Assert the fifty-WP story’s row/target count is based on supplied routes and never fifty. Assert no
   WP-level label, edge, connector, or data object reaches the rendered story.
5. Apply a temporary authored-story source mutation that replaces the `FiftyActiveWPs` aggregate
   route fixture with fifty per-WP rows/targets. Run the named test `FiftyActiveWPs uses aggregate
   routes and exposes no per-WP target`; require its red output to show the aggregate route-count
   mismatch (expected the supplied aggregate route count, received `50`) and/or the forbidden
   WP-target assertion. Restore the story byte-for-byte, prove the restoration diff is empty, and
   rerun that exact test green. This mission acceptance mutation is unbracketed and is not an ADR
   registry pair.
6. Assert pointer, Enter, and Space each produce one event with equal detail/flags in selectable mode;
   key repeat produces none extra. Assert the non-selectable state has no route tab stops, prompt,
   activation, cursor/focus/hover/active affordance, pressed state, or event even with selected state;
   explicitly label this as the component's disabled-interaction analogue.
7. Load `SelectableStates`, record a row's resting computed styles, then use real Playwright hover
   and keyboard focus, pointer-down, and keyboard Space/Enter down before release. Require positive,
   non-vacuous cursor/background/border, focus-visible outline, and active/pressed changes for the
   selectable row; verify the pressed treatment clears after release/cancel/blur. Run axe against
   the non-empty story after each state transition and require zero WCAG 2.1 AA violations, not
   merely CSS selector presence.
8. Assert exact non-zero ratios against the current global maximum, zero ratio for zero values, and
   recomputed ratios after replacing the route array with a different maximum.
9. Run reduced-motion emulation and verify no information or interaction depends on animation.
10. Extend `apps/storybook/src/tests/visual.spec.ts` with clipped, non-vacuous dark, light, selectable
   rest/hover/focus-visible/pointer-active/keyboard-pressed, non-selectable disabled-analogue, and
   narrow-scrolled transition-matrix captures. Each waits for the actual component content and uses
   real input for interactive states.
11. After the authored CSS is complete, use temporary style mutations pinned to its positive
    selectable anchors: neutralize the row hover delta, neutralize the keyboard
    `:focus-visible` outline/delta, then neutralize the real active/pressed delta. For each arm run
    the named test `selectable rows expose positive hover, keyboard focus-visible, and active or
    pressed deltas`; require the red output to identify the missing cursor/background/border delta
    for hover, the missing outline/focus delta for keyboard focus, or the missing input-driven
    active/pressed delta. Restore the CSS byte-for-byte after each arm, prove the restoration diff
    is empty, and rerun the exact test green. Record the mutation, command, full failing output,
    restore proof, and green output in WP evidence; do not invent an ADR id.
12. Use local screenshots only for diagnosis and remove every locally written transition-matrix PNG
   before handoff. After WP03 approval and final rebase/regeneration, the one draft PR's first CI run
   generates all nine authoritative actual PNGs in the `visual-regression-diffs` artifact. Mission
   wrap-up—not WP02—has the operator compare those exact bytes with clean-v4, commits the approved
   bytes as baselines to the same PR, and reruns final CI. Never bless local font metrics with
   `--update-snapshots`.
13. Run axe across every required story. Zero violations is accepted only if the story loaded and the
   render root is non-empty.

**Files:**

- `apps/storybook/src/tests/sk-transition-matrix.spec.ts` (new)
- `apps/storybook/src/tests/visual.spec.ts`
- `apps/storybook/src/tests/visual.spec.ts-snapshots/*transition-matrix*.png` (CI-sourced)
- `packages/elements/src/transition-matrix/sk-transition-matrix.stories.ts`

**Validation:**

```sh
npx nx run storybook:storybook:build
node scripts/run-axe-storybook.js
npx playwright test apps/storybook/src/tests/sk-transition-matrix.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-transition-matrix.spec.ts --project=firefox
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

Reject visual evidence if the matrix is blank, if only the surrounding page is compared, or if the
adjacent inventory panel is treated as part of the component reference. The local visual command is
diagnostic and may report the nine expected missing-baseline comparisons; it is not a WP02 pass/fail
authority and must not leave committed snapshot bytes.

### T011: Record truthful WP02 closeout evidence and hand off consolidation gates

**Purpose:** Close WP02 on evidence the current shared lane can truthfully produce, then hand WP03
and mission wrap-up an explicit list of the environment-dependent and post-integration gates still
open. This subtask does not rebase the mission or manufacture CI evidence.

**Steps:**

1. Finish WP02 implementation in the Spec Kitty lane and run the runnable component gate below.
   Preserve actual outputs and exact commit SHA; do not create a WP PR.
2. Run functional Playwright locally with explicit `--project=chromium` and
   `--project=firefox`. Record both results. Do not install system packages for WebKit; record its
   missing Fedora runtime libraries and require the final unqualified CI Playwright job to pass it.
3. Require the main `node scripts/suite-selftest.mjs` mutation run to pass and record its mutation
   count and elapsed time. Attempt `node scripts/suite-selftest.mjs --selftest`; when the already
   reproduced guard-4 syntax-error Vitest hang recurs, record the last completed guard and bounded
   timeout as a pre-existing harness/environment blocker. Do not label it green or remove it from
   the final CI contract.
4. Run the Chromium visual spec only as a diagnostic. Confirm all nine transition-matrix captures
   are nonblank, then remove local actual/snapshot writes. Missing authoritative baseline failures
   are expected at this point and are not a WP02 failure or a visual approval.
5. Inspect the current aggregate implementation diff without claiming it is rebased. Confirm
   authored scope, generated scope, documentation, and focused WP01/WP02 changes; stop on sibling
   authored source, package, lockfile, token or ADR changes.
6. Record this exact mission-wrap-up handoff: after WP03 approval, rebase the whole shared branch on
   current `train/elements-first`, regenerate, rerun runnable local gates, and open one draft
   `Refs #149` PR. Its first CI run must pass the exact
   `node scripts/suite-selftest.mjs --selftest` command and unqualified `npx playwright test`
   including WebKit, and must produce all nine authoritative visual actual PNG bytes. After
   clean-v4 comparison, commit those exact bytes as baselines to the same PR and rerun final
   exact-head CI, Storybook timing, mutation-budget, squad and maintainer-approval gates.
7. Use Spec Kitty safe-commit/spec-commit only for runtime-authorized paths. Do not use blanket
   staging, rebase, push or open a PR in WP02.

**Runnable WP02 component gate:**

```sh
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze
node scripts/build-react-wrappers.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs

node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
npx nx run elements:analyze
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/build-react-wrappers.mjs --check
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs
node scripts/check-manifest-content.mjs --selftest
node scripts/check-elements-entries.mjs
node scripts/check-elements-entries.mjs --selftest
node scripts/check-part-ratchet.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-adopted-css-boundaries.mjs --selftest
node scripts/check-element-css-hygiene.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/check-gate-wiring.mjs
node scripts/typecheck-all.mjs
node scripts/measure-elements-sizes.mjs --check
npm run quality:all
npm run test
node scripts/suite-selftest.mjs
npx nx run storybook:storybook:build
node scripts/run-axe-storybook.js
npx playwright test apps/storybook/src/tests/sk-transition-matrix.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-transition-matrix.spec.ts --project=firefox
git diff --check
```

**Documented local diagnostic probes (not local pass claims):**

```sh
node scripts/suite-selftest.mjs --selftest
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

**Post-commit clean-state gate outside Spec Kitty's active `.worktrees/`:**

```sh
git diff --exit-code
git diff --cached --exit-code
test -z "$(git ls-files --others --exclude-standard -- . ':(exclude).worktrees/**')"
```

## Definition of Done

- [ ] The approved six-route/four-column fixture derives `21/17/11/6/4/3` and `62 moves` from cells.
- [ ] The element accepts only the seven specified public properties and no redundant total/inventory.
- [ ] Route/column/group/window/description/hint strings remain consumer-controlled; approved
  screenshot phrases occur in story data, never reusable element source, and no clock, domain store,
  router, fetch, timer, or navigation enters the component.
- [ ] `selectable` alone enables pointer/Enter/Space intent; absent mode has no interactive residue.
- [ ] The event is typed, fires once, bubbles, composes, and is explicitly non-cancelable; selection
  stays controlled.
- [ ] Native table/header/group relationships, empty/invalid states, tone semantics, and ten parts are
  externally verified.
- [ ] Token-only dark/light styling, reduced motion, and narrow sticky ownership pass behavior,
  Chromium/Firefox Playwright and axe. Nine nonblank local visual captures are diagnostic only;
  mission wrap-up owns CI baselines and the final visual pass.
- [ ] Exactly nine named stories exist, including mandatory `Default` and independently inspected
  positive selectable rest/hover/focus-visible/pointer-active/keyboard-pressed states plus the
  non-selectable disabled-interaction analogue; the 50-WP scenario stays aggregate. These claims
  have the explicit post-implementation mutation/red-output/restore/green and state-specific axe/
  visual evidence required above, with no tenth story or simulated state class.
- [ ] Exact `value / currentGlobalMax` ratios, zero ratios, and recomputation after maximum-changing
  reassignment are asserted and have a named source-break red record.
- [ ] Only actual element ADR SC-006/007/008/010/013/014 pairs are registered here; ADR SC-012 is
  absent and every element pair has a unique non-inert mutation. WP03 owns the distinct React pairs.
- [ ] Every non-registry acceptance behavior records the exact source mutation, intended named red
  test/output, restoration, and green rerun without inventing an ADR id.
- [ ] Manifest and docs ratchet show five attributes, two property-only fields, zero methods, zero
  slots, ten parts, and the typed event.
- [ ] Generated React artifacts expose the planned structured values and callback detail without
  array attributes; WP03 owns the compile/runtime consumer proof and fresh-reset assertions.
- [ ] `skTransitionMatrixSheet` is exported through the elements package and adopted-sheet identity
  is asserted against that named export with zero shadow `<style>` nodes.
- [ ] Published JSDoc/Storybook token dependencies equal the distinct `--sk-*` references in the
  authored CSS source—no missing or extra token names.
- [ ] All non-visual generated artifacts in WP02 scope are script-produced, current, measured, and
  committed. No local PNG baseline is committed.
- [ ] T011 records the passing runnable component gate, main mutation count/timing, qualified
  Chromium/Firefox evidence, guard-4 selftest hang, unavailable local WebKit libraries, removed
  local visual writes, and the exact post-WP03 consolidation handoff without claiming those deferred
  gates complete.
- [ ] The final diff contains no excluded scope, WP02 never edits the legacy excess
  `fixtures/react-consumer/src/wrappers.test.tsx` path, and all three post-commit clean-state commands
  exit zero outside the active Spec Kitty `.worktrees/` directory.
- [ ] No rebase, push or PR is required to approve WP02. Its closeout explicitly preserves one
  mission branch and hands the post-WP03 one-draft-PR, nine-baseline, exact-head CI, squad,
  Storybook-timing and maintainer-approval obligations to mission wrap-up without marking them done.

## Risks

- **Selection becomes local:** event handlers must dispatch only; tests hold selected state unchanged.
- **Missing cells become zeros:** exact value-key validation fails closed; only explicit zeros render.
- **Bar scale lies:** derive from the current global max and test max changes after reassignment.
- **Color carries meaning alone:** visible tone text and distinct icons accompany every color treatment.
- **Sticky labels paint under data:** use opaque token surfaces/minimal stacking and a narrow-scrolled
  browser assertion with long labels.
- **Behavior mutations are collateral:** each registry pair gets a surgical source mutation and the
  suite selftest must report only its named subject failure.
- **React types pass while runtime drops or retains arrays:** assert pre-upgrade and rerender identity,
  omission reset to a frozen empty array, and absence of attributes in the dedicated React subject.
- **Generated conflict overwrites train work:** after WP03 approval, rebase the whole mission,
  preserve authored inputs, regenerate every shared output, then rerun all gates.
- **Visual baseline is locally blessed:** use only the one draft PR's nine CI-authoritative actual
  bytes, compare them with clean-v4, commit those bytes to the same PR and rerun visual CI.
- **Scope widens to inventory or tokens:** stop for an explicit decision; neither is authorized.

## Reviewer Guidance

Review the component as a data/ownership boundary first and a visual second. Try to supply totals,
inventory, dates, mutable application objects, or a router; no API should accept them. Activate an
unselected row without updating `selectedRouteId`; visual and programmatic selection must not move.
Reorder rows/columns by stable id and inspect the values. Omit arrays on a React rerender and
require empty resets. Break one ratio formula/max recomputation, header association, part, event flag,
property-only/reset marker, named sheet identity, selectable hover/focus/active-or-pressed treatment, and sticky
treatment; require the intended registry mutation or recorded mission test to fail without borrowing
an inapplicable ADR id. Finally compare the current aggregate diff without asserting a rebase,
confirm all generated artifacts follow authored sources, and confirm T011 explicitly hands the
post-WP03 rebase, nine-baseline PR cycle and exact-head gates to mission wrap-up. The single PR must
exclude the Current/open-WP panel and sibling component source.

## Activity Log

- 2026-09-04T22:12:34Z – codex – shell_pid=2459900 – Gate evidence/blockers: deterministic CEM SHA-256 5463920bef6f9cdc2980e03a6d18fc64e37e544655faed7a30cca9eb1d3bc389; generation/wrapper 25-probe selftest/manifest 14-probe selftest/entries/parts 33/CSS boundaries 10 elements 11 sheets 144 rules/typecheck/quality/npm test 179/Storybook 8.3s/axe 127 stories zero violations green. WebKit cannot launch: missing libgtk-4-1 libicu74 libjpeg-turbo8 gstreamer1.0-libav. Visual images are nonblank/reference-aligned locally but 9 CI-authoritative baselines are absent; local writes removed, pre-existing baselines also drift locally. suite-selftest --selftest reproduced a guard4 syntax-error Vitest hang twice; retry externally timed out exit 124 at 12m after baseline and guards 1-3, exceeding 360s. T011 whole-mission post-approval rebase/CI evidence deferred until WP02+WP03 integration. WP02 intentionally remains in_progress, not for_review.
- 2026-09-04T22:12:34Z – codex – shell_pid=2459900 – Named mutation evidence: main harness baseline 150 and all 62 registered mutations red/restored/green in 197.2s (<360). Manual reds/restores proved total 62->86, maximum ratios, negative fail-closed, legend order, controlled selection, nonselectable tabindex absence, table headers, aggregate 50-WP story, hover/focus/pressed deltas, and sticky owner (380px displacement); restored focused behavior 28/28 and Chromium/Firefox acceptance 20/20.
- 2026-09-04T22:12:34Z – codex – shell_pid=2459900 – Implemented T005-T010 owned surface test-first: sk-transition-matrix has the approved 6-route x 4-column 62-move aggregate fixture, 7 public props (5 attributes plus property-only columns/routes), 5 tones, semantic native table, 10 parts, controlled bubbling/composed/non-cancelable selection intent, 9 exact stories, token-only responsive CSS, generated CEM/CSS/React/index/size outputs, docs and registries. Prohibited fixtures/react-consumer/src/wrappers.test.tsx remains byte-identical.
- 2026-09-04T23:54:18Z – codex – shell_pid=1853958 – Review-cycle-1 functional fixes committed as 24d8c9c26928b97de29d98fcc86162f6c08b4000. Baseline RED: exact NI-09 command npx playwright test apps/storybook/src/tests/sk-transition-matrix.spec.ts --grep non-selectable.*zero interaction residue exited 1 with Error: No tests found; browser behavior semantic test route totals describe magnitudes and grouped bodies across component instances failed because route-total id was empty; theme test Default dark and LightMode preserve equivalent content and table relationships with token-driven theme variance failed because Default was 2x2/14 while LightMode was 6x4/62. GREEN after fixes: behavior 28/28 and Chromium+Firefox component suite 22/22; exact qualified NI-09 2/2. Source adds per-instance route-total ids, magnitude aria-describedby, visible group ids and tbody aria-labelledby; stories preserve exactly 9 exports and make LightMode content/selection/interaction equivalent to Default; Playwright compares cross-shadow content/table relationships and computed token-driven surface and foreground colors.
- 2026-09-04T23:55:01Z – codex – shell_pid=1857198 – Mutation RED/GREEN: totals arm changed overallTotal += value; to overallTotal += value + 1; in packages/elements/src/transition-matrix/sk-transition-matrix.ts. Command npx vitest run --project browser fixtures/elements-behaviour/src/sk-transition-matrix.test.ts --reporter=default -t approved fixture derives 24 intersections failed expected 62 moves, received 86 moves. Restored with apply_patch; sha256 dc359c6d5dbe7c446471241e012bdff937d2bfaa20697d79617163bc78ea2fe4; git diff --exit-code HEAD -- source exited 0; same filter GREEN 1 passed. Ratio/max arm changed value / matrix.maximum to value / (matrix.maximum + 1). Filter bar ratios use the current global maximum failed with values over 8 instead of 7, including expected 0.428571, received 0.375. Restored same hash and empty scoped diff; same filter GREEN 1 passed.
- 2026-09-04T23:55:02Z – codex – shell_pid=1857198 – Mutation RED/GREEN: validation arm changed value < 0 to value < Number.NEGATIVE_INFINITY; browser filter invalid or empty data fails closed: negative value failed because No transition data empty state was absent. Legend arm changed TONES.filter(tone => present.has(tone)) to also exclude blocked; filter legend filters supplied tones failed expected forward,blocked,recovery but received forward,recovery. Controlled-selection arm inserted this.selectedRouteId = routeId after the selectable guard; filter selection stays consumer-controlled failed expected planned-progress, received blocked. Every arm was restored with apply_patch to source sha256 dc359c6d5dbe7c446471241e012bdff937d2bfaa20697d79617163bc78ea2fe4; git diff --exit-code HEAD -- source exited 0 after each; each named filter reran GREEN 1 passed.
- 2026-09-04T23:55:03Z – codex – shell_pid=1857198 – Mutation RED/GREEN for table semantics using real multi-instance DOM test route totals describe magnitudes and grouped bodies across component instances. Header arm changed magnitude aria-describedby from routeTotalId to nothing; failed expected sk-transition-matrix-1-route-total-0, received null. Group arm changed tbody aria-labelledby from groupHeadingId to nothing; failed expected sk-transition-matrix-1-group-3, received null. Both were independently restored with apply_patch to source sha256 dc359c6d5dbe7c446471241e012bdff937d2bfaa20697d79617163bc78ea2fe4; git diff --exit-code HEAD -- source exited 0 after each; same focused test reran GREEN 1 passed, proving unique IDs and reference resolution without weakening column headers.
- 2026-09-04T23:55:04Z – codex – shell_pid=1857198 – NI-09 direct absence-guard mutation RED/GREEN: changed selectable = false to selectable = true in the non-selectable story, rebuilt Storybook, then ran npx playwright test apps/storybook/src/tests/sk-transition-matrix.spec.ts --project=chromium --project=firefox --grep non-selectable.*zero interaction residue. Both engines failed because the row unexpectedly gained tabindex=0 and data-pressed=true; named assertion not.toHaveAttribute data-pressed failed. Restored false with apply_patch, rebuilt, source sha256 dc359c6d5dbe7c446471241e012bdff937d2bfaa20697d79617163bc78ea2fe4 and empty scoped diff; exact qualified filter GREEN 2 passed. Test performs actual hover, mouse down/up, focus, Enter and Space plus event capture, and asserts zero tab, hint, event, focus, pressed, marker, cursor, hover, focus and active residue.
- 2026-09-04T23:55:05Z – codex – shell_pid=1857198 – Mutation RED/GREEN for data-story boundaries. FiftyActiveWPs arm replaced six aggregate routes with Array.from length 50 per-WP rows; after Storybook build, Chromium filter FiftyActiveWPs uses aggregate routes and exposes no per-WP target failed expected 6 data-route-id nodes, received 50. Restored with apply_patch, rebuilt, story sha256 1e6b0a4cc33408e38dc8e84b3498442db50373fca5326153bb509e4933667f26 and empty scoped diff; GREEN 1 passed. Theme-equivalence arm changed LightMode compactColumns/compactRoutes to approvedColumns/approvedRoutes; Chromium filter Default dark and LightMode preserve equivalent content and table relationships with token-driven theme variance failed deep equality: expected compact Previous/Current 2 rows and 14 moves but received Tue-Fri 6 rows and 62 moves. Restored, rebuilt, same story hash and empty diff; Chromium+Firefox GREEN 2 passed.
- 2026-09-04T23:55:06Z – codex – shell_pid=1857198 – Mutation RED/GREEN for interaction deltas, rebuilding Storybook for every arm and running Chromium filter selectable rows expose positive hover, keyboard focus-visible, and active or pressed deltas. Hover changed surface-pill to surface-card and failed because hover background equalled rest rgb(24,26,31). Focus changed token outline to none and failed because focused outline did not differ from rest. Pressed changed surface-muted to surface-pill and failed because pointer-active background equalled hover rgb(33,40,48). Each was independently restored with apply_patch; CSS sha256 f2624cede4570b9da80e232b32ed0f8f94fc99b60e3056d5b660db47b9c07f08 and generated CSS JS sha256 e2432064f554c16f1b72620fde6ec678fd7165649fa8a3b18537ab07cda8ab1b; scoped git diff exited 0; same filter GREEN 1 passed after every restoration.
- 2026-09-04T23:55:07Z – codex – shell_pid=1857198 – Mutation RED/GREEN for sticky ownership: changed .sk-transition-matrix__route position sticky to static, rebuilt Storybook, and ran Chromium filter narrow scrolling keeps the sticky route owner visible without overlap. Failed named displacement assertion expected less than 2 pixels, received 380 pixels. Restored with apply_patch, rebuilt, CSS sha256 f2624cede4570b9da80e232b32ed0f8f94fc99b60e3056d5b660db47b9c07f08 and generated CSS JS sha256 e2432064f554c16f1b72620fde6ec678fd7165649fa8a3b18537ab07cda8ab1b; git diff --exit-code HEAD -- both files exited 0; same filter GREEN 1 passed.
- 2026-09-05T00:02:08Z – codex – shell_pid=1923849 – Review-cycle-1 final local gate evidence at lane HEAD 3659c3f: ordered generators completed; generated size evidence committed in 3659c3f. CSS/markup drift, second analyze byte identity, React wrapper check plus 25 probes, manifest 14 probes, entries plus 14 probes, 33-part ratchet, adopted CSS plus 31 probes, CSS hygiene, no-CSS-source, theme wrapper plus 12 probes, gate wiring, four-project typecheck, size check, quality, and git diff checks GREEN. Full Vitest 16 files/179 tests with node=29 and browser=150. Main suite-selftest baseline 150 and all 62 registered mutations named-red/no-collateral GREEN in 190.5 seconds under 360-second ceiling. Storybook build GREEN; exactly 9 transition-matrix story exports; axe 127/127 rendered stories and zero WCAG 2.1 AA violations. Chromium+Firefox component suite 22/22 including theme and NI-09. Exact unqualified NI-09 now selects 3: Chromium+Firefox pass, WebKit only fails to launch for approved missing host libraries libgtk-4-1, libicu74, libjpeg-turbo8, gstreamer1.0-libav and is a final-CI obligation, not claimed passed. Visual diagnostic generated nine nonblank transition-matrix actuals, inspected dark/light/narrow, copied under /tmp/wp02-cycle1-visuals; untracked local baseline stubs were removed and never committed. CI-authoritative nine baseline bytes remain after WP03. Guard suite-selftest --selftest guard-4 hang remains the approved final-CI deferral and is not claimed passed. No rebase, PR, push, or WP03 action performed.
- 2026-09-05T00:31:05Z – codex – Review-cycle-2 FR-016 fix at lane commits 967bd71 and 91368dd, with size refresh 9128db6. Baseline current-code Chromium RED: the named narrow scrolling test found 52 paint/hit failures across rest, selected, hovered, and pressed states, including earlier bars and cells owning hits over route labels. Permanent authored CSS gives all seven sticky route owners the smallest effective positive paint layer; the test separately preserves displacement and enumerates every real heading/row overlap at 390x844 maximum scroll. GREEN: Chromium and Firefox 2/2.
- 2026-09-05T00:31:06Z – codex – Review-cycle-2 paint mutation RED/GREEN: changed packages/styles/src/transition-matrix/sk-transition-matrix.css z-index 1 to auto, regenerated CSS and rebuilt Storybook, then exact Chromium narrow scrolling filter exited 1 with bars/tracks owning overlap hits across all four states. Restored using apply_patch; authored CSS sha256 69a7e418d6f45b1616009e6782e30deb3ebac345a225581184db3212b19a1a99, generated CSS sha256 5d49ad6422c209e20b3312536cffcc262be916979dcabbf4b8bde396f9ea3d2e, final test sha256 39b1ec85a25be2a907549551c8fba565ec99c2745e8c51d229d9f049ad1a7205, scoped diff against HEAD empty, exact Chromium+Firefox filter GREEN 2/2.
- 2026-09-05T00:31:07Z – codex – Review-cycle-2 final evidence at lane HEAD 9128db6: ordered generation and size refresh; CSS/markup/CEM byte identity, React wrapper plus 25 probes, manifest plus 14 probes, entries plus 14 probes, 33 parts, adopted CSS plus 31 probes, CSS hygiene/no-CSS-source/theme-wrapper/gate wiring/four-project typecheck/size/quality all GREEN. Full Vitest 179/179; Storybook build 3.87s; axe 127/127 nonempty stories with zero WCAG 2.1 AA violations; complete component Chromium+Firefox 22/22. Fresh 390x844 diagnostic visibly showed opaque route labels/icons and no crossing bars/counts; generated local snapshot and actual were moved to recoverable trash and no transition-matrix PNG remains. The registered 62-arm mutation harness was not rerun because no registered mutation source/subject changed; its reviewed 190.5s result remains current, while this defect has the separate exact mutation above. Local WebKit libraries, guard-4 suite-selftest --selftest, and all nine CI-authoritative baselines remain explicitly deferred, not green. After WP03 approval, rebase the whole branch on current train/elements-first, regenerate and rerun local gates, open one draft Refs #149 PR, require exact suite-selftest --selftest and unqualified Playwright including WebKit plus nine CI actual PNGs, compare to clean-v4, commit those exact bytes, then rerun exact-head CI, Storybook timing, mutation-budget, squad, and maintainer-approval gates. No rebase, push, PR, WP03, merge, publish, or deploy was performed.
- 2026-09-05T00:53:33Z – codex – Review-cycle-3 structural paint fix at lane commit 60a44a359ca88daedf38ffd6f9965cfc6606a52f. TDD RED: the exact Chromium narrow-scroll test rejected the authored raw z-index declaration before production CSS changed. Permanent fix removes z-index: 1 and the unnecessary positioned track, leaving the sticky route owner in the positioned paint phase without any stacking value or token change; Chromium and Firefox GREEN 2/2 at 390x844 maximum scroll across seven owners and rest/selected/hovered/pressed states. Non-inert mutation reintroduced only .sk-transition-matrix__track position: relative, rebuilt CSS/Storybook, and the same named Chromium test RED with 52 bar/track-owned overlap hits across all four states; apply_patch restoration returned exact permanent hashes CSS 95e0d30ac9ac46a5d03d17f2d38ceb5a7885c18d69debcb668dff22f57bd4d88, generated CSS 1033271756bcab6924807fb848c570034ebdeba46c7750a6d9d81b7990790c1f, and test 1c96744355b85256499cd934cc177d174884aa66f24f61d890c7a87b06def0c1f before both browsers reran green.
- 2026-09-05T00:53:34Z – codex – Review-cycle-3 final local evidence at lane commit 60a44a3: deterministic CSS/markup/CEM/React generation and regenerated size evidence; CSS/manifest/wrapper/entry/parts/adopted-sheet/hygiene/no-CSS/theme/gate-wiring/type/size/quality/stylelint/htmlhint/diff gates GREEN. Full Vitest 179/179; Storybook 3.96s; axe 127/127 nonempty stories zero WCAG 2.1 AA violations; complete component Playwright Chromium 11/11 and Firefox 11/11; registered mutation harness baseline 150 with all 62 named mutations red/no collateral in 189.6s. No z-index declaration remains in authored or generated transition-matrix CSS. Earlier approved deferrals remain explicitly not green: local WebKit libraries, suite-selftest --selftest guard-4 hang, and nine CI-authoritative baselines. No rebase, push, PR, WP03, merge, publish, or deploy; post-WP03 whole-branch rebase/regeneration and exact-head CI handoff remains unchanged.
