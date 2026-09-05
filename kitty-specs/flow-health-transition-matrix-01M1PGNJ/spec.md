# Mission Specification: Flow-health transition matrix

**Mission:** `flow-health-transition-matrix-01M1PGNJ` · **Issue:** #149 · part of epic #144 · tracks #125  
**Branch:** `mission/flow-health-transition-matrix` from `train/elements-first` at `5b7566f11b31281bc4c129efcf42427232e16965`  
**Created:** 2026-09-04  
**Status:** Ready for implementation — post-tasks findings reconciled 2026-09-04
**Squad tier:** B — three lenses post-tasks; the current programme requires the full four-lens gate pre-merge  
**Governing decisions:** [ADR-9](../../docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md), [ADR-10](../../docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md), [ADR-11](../../docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md), and the [component-authoring recipe](../../docs/contributing/adding-a-component.md)

## Source and visual authority

- Product and ownership authority: [epic #144](https://github.com/spec-kitty/spec-kitty-design/issues/144) and [mission issue #149](https://github.com/spec-kitty/spec-kitty-design/issues/149).
- Approved design source named by #144: Stitch project
  [`codex-teamkitty-redesign`](https://stitch.withgoogle.com/projects/10134542414402054345), screen
  **“Team overview — final review v4 approved”** for the full page and screen
  **“Team overview — final review · clean v4”** for the corrected Flow health treatment.
- Authorised visual evidence: the operator supplied an export of
  **“Team overview — final review · clean v4”** on 2026-09-04 and confirmed it as the binding
  Flow-health reference for this mission. The exact fixture extracted from that export is recorded
  under **Approved clean-v4 fixture** below. Its time-window, explanatory and selection-hint copy
  are values Team Kitty supplies to the reusable element; they are not component defaults. The
  adjacent “Current / 50 open WPs” summary remains composition evidence only and is explicitly
  outside this component.
- Repository-local evidence at the base SHA: the palette and theme pairs in
  [`packages/tokens/src/tokens.css`](../../packages/tokens/src/tokens.css), the public-part and
  host-layout precedent in [`sk-grid`](../../packages/elements/src/grid/sk-grid.ts), the typed
  composed-event precedent in [`sk-nav-pill`](../../packages/elements/src/nav-pill/sk-nav-pill.ts),
  and the [component-authoring](../../skills/spec-kitty-design/rules/component-authoring.md) and
  [visual-identity](../../skills/spec-kitty-design/rules/visual-identity.md) rules. There is no
  existing `transition-matrix` component in either `packages/elements/src` or
  `packages/styles/src`.
- Issue-specific colour ruling: the operator confirmed that the approved blocked-route danger-red
  treatment is intentional. For `transition-matrix` route semantics it is an explicit exception to
  the general visual-identity rule that reserves red for validation errors. It does not relax that
  rule for any other component or use.

## Why this mission exists

The approved Team overview needs a Flow health view that remains legible when fifty work packages
are active. A line or crossing edge per work package makes ownership ambiguous and scales the
picture with inventory. This mission adds one reusable `<sk-transition-matrix>` whose rows are
consumer-defined transition routes and whose columns are consumer-defined time buckets. Work
package volume changes cell counts, not the number of route labels or edges.

The element is a design-library surface, not a Team Kitty dashboard aggregate. It renders the
supplied matrix, derives chart scales and totals from those same values, exposes accessibility,
and emits selection intent. Team Kitty continues to own fetching, domain calculations, time,
routing and selected state.

```text
Team Kitty container
  owns data fetching, domain aggregation, labels/copy, time, routing and selectedRouteId
        │ immutable columns/routes + windowLabel/description/selectionHint
        │ controlled selectedRouteId + selectable intent opt-in
        ▼
<sk-transition-matrix>
  renders route × time-bucket moves; derives bar scale, route totals and overall total
        │ sk-transition-matrix-select { routeId }
        ▼
Team Kitty decides whether and how selectedRouteId changes
```

## Confirmed terminology and bounded context

- **Route:** an aggregate transition category represented by one matrix row. It is not a URL or
  navigation destination.
- **Time bucket / column:** a consumer-labelled reporting interval. The label is opaque to the
  element and is rendered verbatim.
- **Move:** one counted transition in one route/time-bucket cell. It is not a work package and is
  not a currently open item.
- **Open WPs / inventory:** a separate, point-in-time measure composed beside the matrix by Team
  Kitty from `sk-metric` and `sk-grid`; it is not accepted or calculated by this element.
- **Controlled selection:** Team Kitty is the sole owner of `selectedRouteId`. Activating a route
  emits intent and never silently changes that value inside the element.
- **Selectable:** an affirmative reflected boolean property/attribute, independent of
  `selectedRouteId`. It defaults to false. Only its presence opts rows into pointer, Enter and Space
  intent; its absence means no row tab stops, activation, selection event or interaction
  affordance. That absent/non-selectable presentation is this component's disabled-interaction
  analogue; the public API does not add a separate `disabled` property.
- **Window label:** optional opaque consumer copy appended after the derived `<total> moves`
  measure. The element neither chooses nor validates a reporting duration.
- **Description / selection hint:** optional opaque consumer copy for the matrix explanation and
  selectable-mode prompt. The element does not mention days or work packages unless the consumer
  supplies those words.
- **50-WP scale:** a source dataset with fifty active work packages is aggregated before it
  reaches the element. The element receives routes and counts, never one visual edge or label per
  work package.

| Measure | Supplied to this element | Derived here | Claim the UI may make |
|---|---|---|---|
| Moves per route and time bucket | Yes | No | Exact cell count |
| Route move total | No | Yes, from that route's cells | “moves” |
| Overall move total | No | Yes, from all cells | “moves” |
| Current/open WP inventory | No | No | None |

## Approved clean-v4 fixture

The authorised reference corrects #149's prose from “five routes” to **six route rows using five
tones**. The fixture contains four columns and twenty-four cells. Dashes shown in the reference are
zero values; route totals and the 62-move overall total are derived, never supplied.

| Route label | Tone | Tue 1 | Wed 2 | Thu 3 | Today · Fri 4 | Derived total |
|---|---|---:|---:|---:|---:|---:|
| Planned → In progress | `forward` | 3 | 6 | 7 | 5 | 21 |
| In progress → For review | `forward` | 2 | 5 | 6 | 4 | 17 |
| For review → Done | `completed` | 1 | 3 | 4 | 3 | 11 |
| Any lane → Blocked | `blocked` | 1 | 3 | 2 | 0 (shown as —) | 6 |
| Blocked → In progress | `recovery` | 0 (shown as —) | 1 | 1 | 2 | 4 |
| Any lane → Any lane (backward) | `backward` | 0 (shown as —) | 1 | 1 | 1 | 3 |

The visible table header begins with **“Route”**, uses the four date columns above and ends with
**“Total”**. The final three rows follow **“EXCEPTIONS & RECOVERY”**, centred within a horizontal
separator. The legend appears in this order and pairs each label with a matching coloured dot and
bar treatment: **Forward** in blue, **Completed** in green, **Blocked** in danger red,
**Recovery** in purple and **Backward** in neutral grey. The blocked row also uses its red
prohibition icon and label; the recovery and backward rows use distinct directional icons, so
colour is not the sole signal. The reference title is **“Flow health”**, labels the measure
**“62 moves · last 72 hours”**, describes the table as **“Moves grouped by route and day.”**, and
explains the scale with the exact plain-language caption **“bar length ∝ moves”**. The element owns
the title, derived `62 moves` portion and generic scale semantics. The approved story's consumer
supplies `windowLabel="last 72 hours"`, `description="Moves grouped by route and day."`, and
`selectionHint="Select any row to inspect its WPs."`; those phrases are not hard-coded element
defaults. A supplied selection hint is rendered only when `selectable` is present.

The reference's adjacent **“Current / 50 open WPs”** panel and its Planned/In progress/For
review/Blocked inventory counts are not fixture inputs or outputs for `<sk-transition-matrix>`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read aggregate flow health without route ambiguity (Priority: P1)

An operator reads route names down one axis and date-labelled time buckets across the other. Each
intersection exposes its move count and a substantial proportional bar, and each row ends with a
derived route total. The operator can recover which route and bucket own every number without
following crossing arrows.

**Why this priority:** This route-by-time aggregation is the mission's core value and the reason
the old WP-per-line flow trace is being replaced.

**Independent Test:** Render the approved six-route, four-column fixture whose cell values sum to
62.
Verify all row/column/cell/total relationships, proportional bars and the derived overall total
without providing any total as input.

**Acceptance Scenarios:**

1. **Given** the six approved routes and four approved columns, **when** the matrix renders,
   **then** it exposes six route rows, four time-bucket headers, twenty-four route/bucket
   magnitudes, six derived route totals and one derived 62-move overall total.
2. **Given** equal route totals with different per-column distributions, **when** they render,
   **then** the totals remain equal while the bars make the different distributions visible.
3. **Given** a screen-reader user at any magnitude cell, **when** the cell is inspected, **then**
   its route header, column header, count and relationship to the route total are recoverable.
4. **Given** the rendered explanation, **then** it uses plain language equivalent to
   `Bar length ∝ moves` and does not present a cryptic “scale example” badge.

---

### User Story 2 - Select a route through a controlled intent contract (Priority: P1)

An operator uses pointer, Enter or Space to request inspection of a route's work packages. The
element emits the stable route id. Team Kitty handles the request and may pass a new
`selectedRouteId` back; the element never takes ownership of application selection.

**Why this priority:** The design must be useful in the application without importing its router,
store or domain model, and the selected state must have one owner.

**Independent Test:** Mount the element with a controlled selected id, activate a different route
through pointer and keyboard, log the events, and verify that visual/programmatic selection does
not change until the property is reassigned by the consumer.

**Acceptance Scenarios:**

1. **Given** `selectable` is present, **when** a route is activated by pointer, Enter or Space,
   **then** one `sk-transition-matrix-select` event fires with `detail: { routeId }`,
   `bubbles: true`, `composed: true` and `cancelable: false`.
2. **Given** `selectedRouteId="forward"`, **when** another route is activated but the consumer
   does not update the property, **then** the selected row remains `forward` in both visual and
   programmatic state.
3. **Given** the same route and selected value, **when** pointer, Enter and Space are used in
   separate runs, **then** their event count and detail are equivalent.
4. **Given** a selection event, **when** it crosses the shadow boundary, **then** a document-level
   listener and the generated React callback receive the typed route id without `any`.
5. **Given** `selectedRouteId` is supplied while `selectable` is absent, **when** the matrix
   renders, **then** the controlled selected state may be reflected but no row gains a tab stop,
   activation handler, selection event or hover/focus/active interaction affordance; this
   non-selectable state is the component's disabled-interaction analogue.

---

### User Story 3 - Understand route tone and grouping without relying on colour (Priority: P1)

An operator distinguishes normal forward movement, completion, blocking, recovery and backward
movement. An optional group such as “Exceptions & recovery” separates exceptional routes while
each row keeps its own route name.

**Why this priority:** Colour-only or legend-only ownership would make the matrix ambiguous and
would fail the epic's accessibility and information contract.

**Independent Test:** Render all five tones and at least one named group, then inspect visible and
accessible labels, legend content and tone contrast in both themes.

**Acceptance Scenarios:**

1. **Given** routes with only `forward`, `blocked` and `recovery` tones, **when** the legend
   renders, **then** it contains exactly those three tones and omits `completed` and `backward`.
2. **Given** recovery and blocked routes, **when** they render in either theme, **then** recovery
   is visually distinct from forward/info blue and blocked/danger red, and every distinction is
   paired with text and/or an accessible icon rather than colour alone.
3. **Given** a `group` value on a run of routes, **when** the group starts, **then** the group label
   is exposed as an accessible separator without replacing or obscuring any route name.
4. **Given** a backward route, **then** its treatment is neutral rather than danger-coded.

---

### User Story 4 - Keep route ownership visible at narrow widths (Priority: P1)

An operator on a narrow viewport horizontally explores a matrix without losing which route owns
the visible counts.

**Why this priority:** A matrix that is correct only at desktop width recreates the ambiguous
floating-label failure the component is meant to remove.

**Independent Test:** Constrain the approved four-column fixture to a narrow Storybook viewport,
scroll it horizontally and verify route labels remain explicit and do not overlap magnitudes.

**Acceptance Scenarios:**

1. **Given** insufficient horizontal space, **when** the matrix overflows, **then** the route name
   remains visible through a sticky first column or an equally explicit treatment.
2. **Given** horizontal scrolling, **then** labels, bars, counts and totals do not overlap, clip
   into ambiguous ownership or turn into crossing connectors.
3. **Given** reduced-motion preference, **then** all information and interaction remain available
   with no animation required.

---

### User Story 5 - Preserve aggregation at fifty-work-package scale (Priority: P1)

An operator views a dataset derived from fifty active work packages and still sees the bounded
set of routes and time buckets rather than fifty WP traces.

**Why this priority:** Scalability is an explicit programme exit criterion, not an optional stress
case.

**Independent Test:** Render the named 50-active-WP story and count route rows, labels, interactive
targets and connector-like visuals. Their count must depend on routes/columns, never WP inventory.

**Acceptance Scenarios:**

1. **Given** aggregate data derived from fifty active WPs, **when** it renders, **then** no
   WP-per-line edge, WP label or WP-level interactive target exists.
2. **Given** a change in source WP volume with the same route set, **when** the consumer supplies
   updated counts, **then** only magnitudes and derived totals change.
3. **Given** the matrix total and a separate open-WP metric happen to be numerically equal,
   **then** the matrix still labels its value as moves and exposes no API that asserts equality.

---

### User Story 6 - Render sparse and empty datasets honestly (Priority: P2)

A consumer can show a sparse window or no transition data without ghost legend entries, invented
totals or focus traps.

**Why this priority:** Empty operational periods are routine; an empty visual must not pass as an
unrendered component or imply data that was not supplied.

**Independent Test:** Exercise explicit zero counts, no routes, and no columns with `selectable`
both present and absent, then run accessibility checks.

**Acceptance Scenarios:**

1. **Given** routes whose cells are all zero, **when** the matrix renders, **then** every derived
   total is zero, no non-zero bar is fabricated and present route tones may still be explained.
2. **Given** no routes or no columns, **when** the component renders, **then** it presents a
   meaningful empty state and no row receives a tab stop.
3. **Given** a non-selectable matrix, **when** a keyboard user traverses the page, **then** no
   route row is added to the tab order.

### Edge Cases

- Duplicate or empty stable ids for columns or routes.
- A route value map missing a supplied column id, containing an unknown column id, or containing
  a negative, fractional, `NaN` or infinite value even though moves are counts.
- A `selectedRouteId` that is absent from the current routes after the consumer replaces data.
- Reordered columns or routes with unchanged stable ids.
- Very long consumer-supplied route, group and date labels.
- A single non-zero value among many zero values; proportional scaling must keep zero visibly zero.
- All non-zero cells having the same value, and the maximum value changing after reassignment.
- Empty data in selectable mode and non-selectable data with a selected id.
- The consumer mutating an object after assignment. Inputs are specified as readonly and the
  element must never mutate them; whether mutation-after-assignment is detected or unsupported is
  a planning concern.
- Calling `preventDefault()` on the non-cancelable selection event has no component action to
  prevent; consumer code remains free to ignore the intent and leave `selectedRouteId` unchanged.

## Public data and event contract

The public types may use repository naming conventions, but they MUST preserve this shape and
ownership:

```ts
type TransitionColumn = Readonly<{
  id: string;
  label: string;
}>;

type TransitionTone = 'forward' | 'completed' | 'blocked' | 'recovery' | 'backward';

type TransitionRoute = Readonly<{
  id: string;
  label: string;
  tone: TransitionTone;
  group?: string;
  values: Readonly<Record<string, number>>;
}>;

type TransitionMatrixSelectDetail = Readonly<{
  routeId: string;
}>;

type TransitionMatrixProperties = Readonly<{
  columns: ReadonlyArray<TransitionColumn>;
  routes: ReadonlyArray<TransitionRoute>;
  selectedRouteId?: string;
  selectable: boolean;
  windowLabel?: string;
  description?: string;
  selectionHint?: string;
}>;
```

`columns` and `routes` are structured JavaScript properties and readonly inputs.
`selectedRouteId` is a consumer-controlled property; absence means no selected route. The element
also exposes `selectable`, an affirmative reflected boolean property/attribute that defaults to
false and is independent of `selectedRouteId`. `windowLabel`, `description`, and `selectionHint`
are optional consumer-controlled string properties/attributes with empty defaults. Empty values
render no dangling separator, description, or prompt; `selectionHint` is ignored visually unless
`selectable` is true. The element does not accept supplied route totals, a supplied overall total,
current/open WP inventory, date objects or a clock.

React props are optional because JSX may add and remove them. Removing `columns` or `routes` after a
prior render MUST assign a fresh immutable empty-array reset value through the property path; it
must not leave stale element data and must not serialize an array. Removing an optional string or
boolean prop follows the generated wrapper's documented attribute-removal/default behavior.

`sk-transition-matrix-select` is deliberately **non-cancelable**. The element has no
component-owned default action after dispatch: it neither changes `selectedRouteId` nor navigates.
ADR-11's `preventDefault()` evidence applies only “where the event is declared cancelable”; it is
therefore inapplicable here. Making this pure controlled-intent notification cancelable would
advertise a default action that does not exist and could not produce meaningful cancellation
evidence.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | Requirement | Source | Priority | Status |
|---|---|---|---|---|---|
| FR-001 | Reusable element | Register and export `<sk-transition-matrix>` through the established elements-first distribution path; do not create a Team Kitty-specific page component. | #144, #149 | High | Open |
| FR-002 | Structured controlled inputs | Accept readonly columns, routes, consumer-owned `selectedRouteId`, `windowLabel`, `description`, `selectionHint`, and an affirmative reflected boolean `selectable` preserving the conceptual public types above and stable ids; `selectable` defaults false and is independent of selection. | #144, #149, operator decision 2026-09-04 | High | Open |
| FR-003 | Verbatim labels and copy | Render route, group, column, window, description and selection-hint strings supplied by the consumer verbatim; never derive `Today`, a reporting window, relative age, timezone text, route names, “day”, or “WPs”. The hint renders only when selectable. | #144, #149, conductor resolution 2026-09-04 | High | Open |
| FR-004 | Cell rendering | Render one labelled magnitude for every route × supplied-column intersection and keep route ownership unambiguous. | #149 | High | Open |
| FR-005 | Derived totals only | Derive every route total and the overall move total from cell values; accept no redundant total input. | #149 | High | Open |
| FR-006 | Measure boundary | Label matrix totals as moves and expose no current/open-WP input or reconciliation claim. | #149 | High | Open |
| FR-007 | Proportional magnitude | Scale bar length proportionally to moves, keep zero at zero, give bars enough visual weight to compare, and explain the encoding in plain language. | #149 | High | Open |
| FR-008 | Tone semantics | Support exactly `forward`, `completed`, `blocked`, `recovery` and `backward`; show legend entries only for tones present in routes. | #149 | High | Open |
| FR-009 | Non-colour meaning | Pair every tone with text and/or accessible icon semantics; recovery is distinct from forward/info blue and blocked/danger red, while backward is neutral. Blocked danger red is the operator-authorised issue-specific exception to the general validation-only red rule. | #149, clean-v4 reference, operator decision 2026-09-04 | High | Open |
| FR-010 | Accessible groups | Use optional route `group` text as an accessible separator while preserving each route label. | #149 | High | Open |
| FR-011 | Controlled selection | Reflect only the supplied `selectedRouteId`; activation does not mutate application selection or the consumer's data. | #144, #149 | High | Open |
| FR-012 | Selection intent event | When `selectable` is present, activation emits exactly one typed `sk-transition-matrix-select` with `{ routeId }`, bubbling, composed and non-cancelable, and the event and flags are documented in the manifest. It has no component-owned default action. | #144, #149, operator decision 2026-09-04 | High | Open |
| FR-013 | Input equivalence | With `selectable` present, pointer, Enter and Space activation of a route produce equivalent intent; hover, focus-visible and a real pointer/keyboard active-or-pressed state communicate selectability. The pressed state is driven by actual input, never a story-only simulation class. | #149, operator decision 2026-09-04 | High | Open |
| FR-014 | Opt-in selectable mode | Expose affirmative reflected boolean `selectable`, default false and independent of `selectedRouteId`. When absent, rows have no tab stops, activation, selection events or hover/focus/active affordances; this is the component's disabled-interaction analogue and does not require a separate public `disabled` property or story. When present, pointer/Enter/Space intent is enabled. | #149, operator decision 2026-09-04 | High | Open |
| FR-015 | Table relationships | Preserve real table/grid relationships among route headers, column headers, magnitude cells and total headers, including programmatic selected state where applicable. | #149 | High | Open |
| FR-016 | Narrow layout | At narrow widths retain explicit route ownership, prefer horizontal scrolling over overlap, and keep every label/count operable. | #149 | High | Open |
| FR-017 | Empty state | Render an intentional accessible zero/empty state rather than an absent render root, ghost data or focusable empty rows. | #149, ADR-11 | Medium | Open |
| FR-018 | Published styling/API surface | Document every public property, event, method (if any), slot (if any), actual CSS token dependency and declared `::part()`; compare the published token list with the authored CSS references; rationale stays out of published JSDoc. | #149, #76 | High | Open |
| FR-019 | React contract | Regenerate the React wrapper so structured data, consumer copy, the reflected boolean `selectable` prop and the event detail reach their corresponding React props/callback with no `any`; removing a previously supplied columns/routes prop resets that element property to an immutable empty array with no stale value. | #144, #149, #76, conductor resolution 2026-09-04 | High | Open |
| FR-020 | Story coverage | Ship all stories listed in the Required stories section, including mandatory `Default`, independently inspectable positive selectable rest/hover/focus-visible/active-or-pressed coverage, controlled-selection action logging, the non-selectable disabled-interaction analogue, and required `LightMode`; do not add a tenth story for these states. | #149, repository authoring rules | High | Open |
| FR-021 | Behavior evidence | Register only actually applicable ADR-11 `(behavior id, subject file)` pairs and give the element and generated React delivery distinct subject files. Every registered pair has a durable red-first mutation. Totals, proportional scaling/max reassignment, controlled selection, headers, legend filtering, validation, aggregation, selectable affordances and narrow ownership remain mission acceptance tests and each records a real named source-break red run before restoration without inventing registry ids. Cancellation, slot, ADR-11 SC-012 focus-return semantics, and per-element registration-guard evidence are inapplicable. | #149, ADR-11, conductor resolution 2026-09-04 | High | Open |
| FR-022 | Domain isolation | Import no application router/store; perform no fetching, polling, timer, currency, outcome, inventory, navigation or Team Kitty domain calculation. | #144, #149 | High | Open |
| FR-023 | One authored source per concern | Author component CSS once in `@spec-kitty/styles`; if a static form is later justified, its markup follows ADR-10's single-authored-source rule and generation checks. | #144, ADR-10 | High | Open |
| FR-024 | Shared artifacts | Regenerate and commit the stylesheet module and named `skTransitionMatrixSheet` package export, manifest, React wrapper, size report and every applicable ratchet/index generated from this component. | #144, #149, #76 | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|---|---|---|---|---|---|
| NFR-001 | Accessibility | Every transition-matrix story, including interactive, narrow, sparse and empty states, completes axe with exactly zero WCAG 2.1 AA violations; `SelectableStates` is additionally scanned after real hover, focus-visible, pointer-active and keyboard-pressed input, and a story load/render failure is a failed gate. | Accessibility | High | Open |
| NFR-002 | Keyboard parity | With `selectable` present, pointer, Enter and Space each produce one equivalent typed non-cancelable event per route and expose a real input-driven pressed treatment; with it absent, rows produce zero tab stops, activation events and hover/focus/active affordances even if `selectedRouteId` is set. That absent state is the component's disabled-interaction analogue. | Accessibility | High | Open |
| NFR-003 | Fifty-WP aggregation | The 50-active-WP fixture renders zero WP-per-line edges, labels or targets; its route-row count equals the supplied route count, and its interactive-target count equals that route count only with `selectable` present (otherwise zero), never fifty. | Scalability | High | Open |
| NFR-004 | Type integrity | Type tests compile the structured and consumer-copy input properties, boolean `selectable` property/attribute contract and React props, and selection callback detail with zero explicit or inferred `any` at the public boundary. | Compatibility | High | Open |
| NFR-005 | Theme parity | Default dark and required `LightMode` stories expose the same content, relationships and interaction, using token-driven theme variance only. | Visual | High | Open |
| NFR-006 | Visual conformance | The final component has an approved visual diff against the operator-authorised `Team overview — final review · clean v4` export and reproduces the recorded Flow-health fixture facts while excluding the adjacent Current/open-WPs summary. After WP03 approval and the final train rebase/regeneration, the one draft PR produces all nine CI-authoritative Chromium actual PNGs; those exact bytes are compared with clean-v4, committed to that same PR as baselines, and must pass the final exact-head visual-regression rerun. Local captures are diagnostic only and are never committed or blessed. State captures also show selectable rest, hover, focus-visible and real active/pressed treatment plus the non-selectable disabled-interaction analogue. | Visual | High | Open |
| NFR-007 | Token-only CSS | Every design value in component CSS resolves through existing or deliberately approved `--sk-*` tokens; no theme selector crosses the shadow boundary. | Maintainability | High | Open |
| NFR-008 | Reduced motion | With `prefers-reduced-motion: reduce`, no information, selected state or operation depends on animation; the component remains fully usable with animation absent. | Accessibility | High | Open |
| NFR-009 | Behavior gate quality | Every new applicable ADR-11 registry pair is re-derived red by `mutations.json` and the main `suite-selftest.mjs`; every non-registry mission acceptance test records a real named source mutation and red-before-green output before restoration. Mission SC numbers are never used as ADR registry meaning, and render-only assertions or shadow-DOM snapshots do not count. | Reliability | High | Open |
| NFR-010 | Standard gates | Typecheck, lint/style, build, manifest/content, wrapper drift, entry/distribution, part/doc/story ratchets, behavior suite+selftest, Storybook build, axe, functional Playwright and visual-regression gates all pass at the final PR head. Fedora-local functional Playwright evidence is explicitly Chromium plus Firefox; WebKit remains mandatory in the final unqualified CI Playwright run because its required system libraries are unavailable locally and no system install is authorized. The reproducible local guard-4 hang in `node scripts/suite-selftest.mjs --selftest` is recorded as a pre-existing harness/environment blocker, not a waiver: that exact command MUST pass in final exact-head CI. Final evidence also includes the nine committed CI-sourced visual baselines and a passing rerun, the mutation-budget disposition from CI, and the successful CI Storybook build step's run URL, SHA, start/end timestamps and elapsed seconds below 180 seconds. Missing/skipped evidence or any failed final gate blocks merge. | Reliability / Performance | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|---|---|---|---|---|---|
| C-001 | Mission boundary | This mission owns `transition-matrix` authored component sources plus necessary shared generated/ratchet/test artifacts. It is explicitly authorized to make the smallest generic normalizer, manifest-doc gate and React generator/runtime change required for intentional property-only structured props and their empty-array removal reset. No unrelated generator refactor or sibling TKO1–TKO4 component-source edit is authorized. | Scope | High | Open |
| C-002 | Existing composition | Reuse existing `sk-card`, `sk-grid`, `sk-button`, `sk-pill-tag` and `sk-nav-pill` where relevant; create no `sk-stat-grid`, `sk-action-link`, second button/tag or public `<sk-team-overview>`. | Scope | High | Open |
| C-003 | Application ownership | Team Kitty owns fetching, stores, errors/loading, timers, active team/route/filter/row, navigation, dates/timezones and all domain calculations. | Architecture | High | Open |
| C-004 | Shadow styling | Open shadow DOM; the public styling API is documented tokens, declared `::part()` and documented component custom properties only. Internal BEM classes are not public. | Architecture | High | Open |
| C-005 | Canonical source | CSS remains a real token-only `.css` source and is adopted as a constructed stylesheet with zero injected `<style>` elements; authored markup is never duplicated. | Architecture | High | Open |
| C-006 | Generated wrapper | `packages/react/src` is generated and must not be hand-edited. | Process | High | Open |
| C-007 | Historical records | Existing `kitty-specs/**`, `docs/architecture/validation/**` and `docs/learnings/**` remain frozen historical record outside this mission's own CLI-created directory. | Process | High | Open |
| C-008 | Merge coordination | WP02 closes with a truthful implementation/evidence handoff and WP03 closes its dedicated React evidence before any upstream rebase. After WP03 is approved and integrated into the one shared lane, mission wrap-up rebases the whole mission on current `train/elements-first`, regenerates shared artifacts, and reruns all runnable local gates before opening exactly one draft `Refs #149` PR. That PR is the only baseline-harvesting and final-CI surface. It may merge to the train only after the final exact-head CI, SHA-pinned full adversarial squad, and at least one maintainer approval on the current head; any later push invalidates those records. Merging `train/elements-first` into `main` remains operator-only. | Integration | High | Open |
| C-009 | Visual evidence honesty | Treat the operator-supplied clean-v4 export as authority only for the recorded Flow-health facts. Local screenshots are diagnostic only and never become committed baselines. The nine committed baseline PNGs must be the exact CI-generated actual bytes harvested from the one draft PR after post-WP03 consolidation, compared with clean-v4, committed back to that same PR, and proven by a final exact-head visual-regression pass. | Evidence | High | Open |
| C-010 | No new ADR | If implementation exposes an uncovered architecture decision, stop and raise it rather than amending ADRs in this mission. | Governance | High | Open |

### Key Entities

- **Transition column:** stable id plus opaque consumer-authored time-bucket label.
- **Transition route:** stable id, opaque route label, one of five tones, optional group label and a
  readonly mapping from column ids to move counts.
- **Transition matrix:** the set of route/column intersections; owns only render-time scale and
  total derivation.
- **Selected route id:** controlled consumer value; the element projects but never owns it.
- **Selectable:** affirmative reflected boolean property/attribute, default false, that alone enables
  row interaction and intent emission; it does not own or imply a selected route.
- **Selection intent:** the typed `sk-transition-matrix-select` event carrying a route id.

## Required stories and scale evidence

1. **Default** — a compact valid, non-selectable route/column matrix proving the mandatory default
   export and the reusable element's domain-neutral defaults without screenshot-specific copy.
2. **ApprovedExample** — the exact six-route, four-column, 24-cell fixture recorded under
   **Approved clean-v4 fixture**, summing to 62 moves, with all five tones, the authorised
   separator, legend treatment, headings and scale copy. Its consumer supplies the approved
   `windowLabel`, `description`, and `selectionHint`; it is rendered with `selectable` present.
3. **FiftyActiveWPs** — aggregate route data derived from fifty active WPs, with no WP-level visual
   or interactive object and no claim that move total equals fifty.
4. **SparseData** — zero/sparse cells and only a subset of tones; unused legend tones are absent.
5. **EqualTotalsDifferentDistribution** — at least two routes with equal derived totals and
   different per-column distributions.
6. **Empty** — zero/no-data state that still renders an intentional accessible root.
7. **ControlledSelection** — selected value supplied by the story, pointer and keyboard activation
   action-logged with `selectable` present, no selection change until the story reassigns the
   property, plus an inspectable `selectable`-absent state proving selection is not an interaction
   signal and serving as this component's disabled-interaction analogue.
8. **SelectableStates** — independently addressable positive interaction evidence. Playwright
   compares a selectable row at rest, real hover, keyboard focus-visible, pointer-active and
   keyboard-pressed input and asserts non-vacuous computed-style changes for every state. It also
   exposes the non-selectable disabled-interaction analogue within this same story; no tenth story
   or simulated state class is added.
9. **LightMode** — wrapped in `class="sk-light"`, not `data-theme="light"`, and shown against the
   approved visual grammar. Default stories remain dark-mode.

All nine exports are recorded by exact built id in `expected-stories.json`. The approved, 50-WP,
controlled, selectable-state and `LightMode` scenarios remain separately inspectable by automated
and visual gates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001:** The approved fixture accepts the exact six routes, four columns and twenty-four cell
  values recorded above, whose cells sum to 62; without any supplied totals it displays the six
  route totals 21, 17, 11, 6, 4 and 3 and one correct overall total labelled as moves.
- **SC-002:** Reordering input rows/columns without changing ids preserves the value-to-id
  relationship and recomputes presentation without mutating the inputs.
- **SC-003:** The equal-total fixture displays equal totals and observably different bar
  distributions; every non-zero bar's inline ratio equals its cell value divided by the current
  global maximum, every zero ratio is exactly zero, and replacing data with a different maximum
  recomputes every affected ratio.
- **SC-004:** The legend's entries equal the unique set of tones present in supplied routes; no
  absent tone appears.
- **SC-005:** Every rendered magnitude exposes its route header, column header and value to the
  accessibility tree; every selected row exposes selected state; axe reports zero violations.
- **SC-006:** With `selectable` present, pointer, Enter and Space each emit exactly one bubbling,
  composed, non-cancelable `sk-transition-matrix-select` with the same typed `{ routeId }` detail
  for the same route.
- **SC-007:** Activation alone leaves the rendered/programmatic selected route unchanged; only a
  consumer reassignment changes it.
- **SC-008:** With `selectable` absent, the component adds zero route tab stops, emits zero
  selection events and shows zero hover/focus/active interaction affordances, including when
  `selectedRouteId` is supplied; this is the component's disabled-interaction analogue.
- **SC-009:** At narrow width, horizontal scrolling does not detach visible magnitudes from an
  explicit route label and produces zero overlapping/crossing route labels.
- **SC-010:** The 50-active-WP story contains zero per-WP labels, edges or targets; its route count
  equals the supplied route count.
- **SC-011:** Default dark and `LightMode` stories both pass axe and an approved visual comparison;
  the light story uses `.sk-light` and theme variance crosses shadow DOM through tokens.
- **SC-012:** Generated React declarations accept readonly columns/routes, the three optional
  consumer-copy strings and optional `selectable?: boolean`, and expose the selection callback
  detail as `{ routeId: string }` with no `any`; removing columns/routes on rerender resets each
  element property to an immutable empty array. This is a mission-local success-criterion id, not
  ADR-11 registry behavior SC-012.
- **SC-013:** Every declared part is in the manifest, externally targetable and registered in the
  part ratchet with a same-change test; public properties/events are documented and match the docs
  ratchet exactly.
- **SC-014:** The main behavior mutation harness fails each actually applicable new registry pair
  through its unique source mutation and passes after restoration; recorded red-before-green
  evidence names the source break and intended failing test for every non-registry mission
  acceptance behavior. This is a mission-local success-criterion id, not an ADR registry mapping.
- **SC-015:** After WP03 approval, mission wrap-up rebases the integrated branch on the latest train,
  regenerates shared artifacts, and passes every runnable local gate with functional Playwright
  explicitly covering Chromium and Firefox. The one draft PR then yields the nine CI-authoritative
  visual actuals, which are compared, committed as baselines to that same PR, and followed by a
  final exact-head CI run where `node scripts/suite-selftest.mjs --selftest`, unqualified Playwright
  including WebKit, the visual suite, the mutation budget and all other gates pass. That same final
  head has a recorded Storybook CI build duration below 180 seconds, SHA-pinned full adversarial
  squad evidence and at least one current-head maintainer approval; no sibling component's authored
  source is changed to resolve shared-artifact overlap.

## Out of scope

- The “Current / open WPs” inventory summary or any claim reconciling it with move totals.
- Fetching, aggregation from individual WPs, polling, time-window calculation, date/timezone
  formatting, authoring screenshot-specific window/description/hint copy, loading/error
  orchestration, Team Kitty stores, routing and navigation actions.
- A WP-per-line flow trace, crossing arrows, floating ownerless counts or consumer domain objects.
- The public `<sk-team-overview>` pattern component; #150 owns a Storybook composition only.
- `sk-metric`, other TKO1–TKO4 elements, a second grid/button/tag/action-link, or changes to their
  authored component directories.
- Plan, work packages, implementation, review, PR creation, push or merge in this specification
  phase.

## Resolved operator decisions

No product/API decision remains open for planning. On 2026-09-04 the operator resolved the four
specification decisions/evidence gaps as follows:

- **RD-001 — selectable-mode declaration:** `selectable` is an affirmative reflected boolean
  property/attribute, default false and independent of `selectedRouteId`. Absence disables row tab
  stops, activation, selection-event emission and interaction affordances; presence enables
  pointer, Enter and Space intent.
- **RD-002 — non-cancelable controlled intent:** `sk-transition-matrix-select` is bubbling,
  composed and non-cancelable. Because selection remains consumer-controlled, the component has no
  default action for `preventDefault()` to stop. ADR-11 explicitly conditions cancellation proof
  on events declared cancelable, so its cancellation clause is inapplicable rather than waived.
- **RD-003 — clean-v4 visual authority:** the operator-supplied export is the authorised
  Flow-health evidence. It fixes the approved story at six routes, four columns, twenty-four cell
  values, five tone treatments, a 62-move total and the exact copy recorded above. The adjacent
  Current/open-WPs panel stays outside the component.
- **RD-004 — blocked-route red exception:** danger red is intentional for blocked routes in this
  component and is an issue-specific exception to the general validation-only red rule. The
  exception does not apply to recovery, backward or any unrelated component.
- **RD-005 — consumer-owned copy:** #144's ownership boundary is binding. `windowLabel`,
  `description`, and `selectionHint` are optional public strings with empty defaults, supplied by
  the consumer and rendered verbatim. The element owns only the generic `Flow health`, derived
  `<total> moves`, `Route`/`Total`, tone labels and `bar length ∝ moves` semantics. The approved
  story supplies the screenshot phrases; other consumers never inherit a false 72-hour/day/WP
  claim.
- **RD-006 — narrow generic pipeline scope:** #149 explicitly authorizes the smallest reusable
  TypeScript-AST normalizer, manifest-content gate, generated React wrapper/runtime and selftest
  changes needed to expose intentional `attribute: false` public fields and reset removed array
  props to immutable empty values. This is not permission for unrelated generator cleanup or a
  component-name allowlist.
- **RD-007 — local versus CI environment evidence:** the operator approved Chromium and Firefox as
  the qualified Fedora-local functional Playwright evidence because WebKit's required system
  libraries are unavailable and no system install is authorized. WebKit is not waived: the final
  unqualified CI Playwright run must pass it. The reproducible local guard-4 hang in
  `node scripts/suite-selftest.mjs --selftest` is likewise a documented pre-existing
  harness/environment blocker only; the exact command must pass in final exact-head CI.
- **RD-008 — consolidation and baseline sequence:** the repository has one shared Spec Kitty lane
  and no partial-WP merge/reparent seam. WP02 therefore records a closeout handoff without claiming
  the upstream rebase, and WP03 is approved before mission wrap-up rebases/regenerates the integrated
  branch. The one draft PR then generates all nine CI-authoritative visual actuals. After comparison
  with clean-v4, those exact bytes are committed to the same PR as baselines and final CI, squad,
  Storybook timing, mutation-budget and current-head maintainer gates run at the resulting head.

## Evidence traceability

- #144 establishes library/application ownership, controlled state, existing-component reuse,
  mission boundaries, both-theme output and shared-artifact merge coordination.
- #149 establishes the data/event shape, aggregate route model, visual encoding, accessibility,
  stories, scale fixtures, React typing and gates.
- The operator's 2026-09-04 decisions establish `selectable`, the non-cancelable event contract,
  the clean-v4 fixture and the blocked-route danger-red exception where they intentionally refine
  #149 and the general visual-identity rule.
- #76 and the current recipe establish published JSDoc, typed `@fires`, ratchets, generated wrappers
  and the complete component gate surface.
- The conductor's 2026-09-04 post-tasks resolutions establish consumer-owned copy, the narrow
  generic property-only/reset seam, registry-id discipline, and the recorded-red evidence model
  for non-registry acceptance tests.
- ADR-9 establishes shadow/accessibility/styling boundaries; ADR-10 establishes canonical markup,
  constructed stylesheets and guarded registration; ADR-11 establishes behavior and generation
  evidence standards.
