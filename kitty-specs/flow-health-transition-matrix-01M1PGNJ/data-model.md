# Data model: Flow-health transition matrix

**Mission:** `flow-health-transition-matrix-01M1PGNJ`

**Model kind:** ephemeral readonly presentation input plus pure render-time derivations

**Persistence/migrations:** none

## Boundary

```text
Team Kitty
  fetches WPs; aggregates domain events; formats dates/window copy; owns selected route
       │
       │ readonly columns + aggregate routes + optional copy
       │ controlled selectedRouteId + selectable
       ▼
<sk-transition-matrix>
  validates shape → derives cells/totals/max/legend/groups/selection → renders table
       │
       │ sk-transition-matrix-select { routeId }
       ▼
Team Kitty may replace selectedRouteId
```

The model begins after Team Kitty has aggregated individual work packages. A `move` is a count in
one route/time-bucket intersection. It is not a work package, a navigation route, or current/open
inventory. No storage, network, clock, date object, timezone, router, or application store belongs
to this component.

## Public types

```ts
export type TransitionColumn = Readonly<{
  id: string;
  label: string;
}>;

export type TransitionTone =
  | 'forward'
  | 'completed'
  | 'blocked'
  | 'recovery'
  | 'backward';

export type TransitionRoute = Readonly<{
  id: string;
  label: string;
  tone: TransitionTone;
  group?: string;
  values: Readonly<Record<string, number>>;
}>;

export type TransitionMatrixSelectDetail = Readonly<{
  routeId: string;
}>;

export type TransitionMatrixProperties = Readonly<{
  columns: ReadonlyArray<TransitionColumn>;
  routes: ReadonlyArray<TransitionRoute>;
  selectedRouteId?: string;
  selectable: boolean;
  windowLabel?: string;
  description?: string;
  selectionHint?: string;
}>;
```

## Entities and value objects

### TransitionColumn

| Field | Type | Required | Meaning | Invariant |
|---|---|---:|---|---|
| `id` | `string` | yes | Stable join key for a time bucket | Non-empty and unique within `columns` |
| `label` | `string` | yes | Opaque consumer-authored visible label | Render verbatim; the element does not parse dates |

Column order is presentation order. Reordering columns with unchanged ids reorders the view but
does not change value ownership.

### TransitionRoute

| Field | Type | Required | Meaning | Invariant |
|---|---|---:|---|---|
| `id` | `string` | yes | Stable route/selection key | Non-empty and unique within `routes` |
| `label` | `string` | yes | Opaque consumer-authored route label | Render verbatim; not a URL |
| `tone` | `TransitionTone` | yes | Semantic presentation category | Exactly one of the five declared values |
| `group` | `string` | no | Opaque separator label for a contiguous run | Never replaces the route label |
| `values` | readonly record | yes | Move count keyed by column id | Key set equals the supplied column-id set; each value is a finite non-negative integer |

Route order is presentation order. The component never sorts or mutates the array.

### TransitionMatrixProperties

| Property | Delivery | Default | Ownership/effect |
|---|---|---|---|
| `columns` | JavaScript property only (`attribute: false`) | immutable empty array | Consumer input; new reference triggers update |
| `routes` | JavaScript property only (`attribute: false`) | immutable empty array | Consumer input; new reference triggers update |
| `selectedRouteId` | property + `selected-route-id` attribute | `undefined` | Controlled selected-state projection; activation never changes it |
| `selectable` | reflected boolean property/attribute | `false` | Sole opt-in for row tab stops, affordances, and activation |
| `windowLabel` | property + `window-label` attribute | `''` | Opaque copy appended after derived move total when non-empty |
| `description` | property + attribute | `''` | Opaque explanatory copy, omitted visually when empty |
| `selectionHint` | property + `selection-hint` attribute | `''` | Opaque prompt, rendered only when non-empty and `selectable` |

The public surface therefore contains seven properties, five attributes, and two explicit
property-only fields. It has zero public methods and zero slots.

### TransitionMatrixSelectDetail

One immutable value object containing the activated route's stable `routeId`. It contains no
selected value, WP list, navigation target, original DOM event, or application object.

## Relationships and cardinality

```text
TransitionMatrixProperties
  1 ── ordered ── 0..* TransitionColumn
  1 ── ordered ── 0..* TransitionRoute

TransitionRoute
  1 ── keyed by every TransitionColumn.id ── 0..* move counts
  0..1 ── belongs to contiguous presentation run ── group label
  1 ── has ── TransitionTone

selectedRouteId
  0..1 ── matches by id ── TransitionRoute

selectable
  1 ── gates ── 0..routes.length interactive row targets
```

For a valid rectangular matrix with `R` routes and `C` columns:

- magnitude cell count = `R × C`;
- route total count = `R`;
- overall move total count = one;
- interactive target count = `R` only when `selectable`, otherwise zero;
- all counts are independent of source WP inventory.

## Validation model

Validation runs on the current property references before any totals, legend, groups, selection
targets, or cells are exposed.

| Rule | Valid examples | Invalid examples | Invalid outcome |
|---|---|---|---|
| Column ids are non-empty/unique | `tue-1`, `wed-2` | `''`, duplicate `tue-1` | Labelled non-interactive unavailable state |
| Route ids are non-empty/unique | `planned-progress` | `''`, duplicate route id | Same |
| Tone is closed union | `forward`, `blocked` | `warning`, `danger` | Same |
| Value keys exactly equal column ids | one key for each supplied column | missing column key; unknown key | Same; never invent zero or discard unknown data |
| Counts are finite non-negative integers | `0`, `7` | `-1`, `1.5`, `NaN`, `Infinity` | Same |
| Empty dimension is honest | no routes or no columns | n/a | Intentional accessible empty state, no row target |

An all-zero rectangular matrix is **valid data**, not an empty/error state. It renders all cells,
zero route/overall totals, zero-length bars, and the tones present in its routes. Invalid data must
not masquerade as all-zero data.

## Derived projection

The component derives a transient projection on each render; none of these fields is public input
or persisted state.

| Derived value | Formula/source | Invariant |
|---|---|---|
| `cells[r,c]` | `routes[r].values[columns[c].id]` | Join by stable id, preserve current input order |
| `routeTotal[r]` | sum of current cells in route `r` | Never supplied separately |
| `overallTotal` | sum of every current cell | Labelled as moves, never open WPs |
| `globalMaximum` | maximum current cell value; zero for all-zero data | Recomputed after reference replacement |
| `barRatio[r,c]` | `value / globalMaximum`; zero when maximum is zero | Every non-zero cell shares one global scale |
| `presentTones` | unique route tones | Rendered in fixed semantic order; no ghost entries |
| `groupRuns` | consecutive routes with the same non-empty `group` | Group heading labels its run without replacing rows |
| `isSelected[r]` | `routes[r].id === selectedRouteId` | Unknown/absent id selects no route |
| `isInteractive[r]` | `selectable && valid non-empty matrix` | Selection projection alone never enables interaction |

No derived value is written back into `columns`, `routes`, or `selectedRouteId`.

## State transitions

### Data lifecycle

```text
immutable empty arrays
      │ assign columns/routes by identity
      ▼
validate current graph ── invalid ──► unavailable state (no fabricated projection)
      │ valid
      ▼
derive current projection ── new reference ──► validate and recompute all affected derivations
      │ React prop removed
      ▼
fresh frozen [] assigned through property path ──► intentional empty state
```

Deep mutation without reference replacement is unsupported. The element does not freeze or clone
consumer-owned objects; React removal uses a fresh frozen empty array as the generated wrapper's
documented reset value.

### Selection lifecycle

```text
selectedRouteId absent/known/unknown
      │ render compares ids only
      ▼
unselected / selected projection
      │
      ├─ selectable=false: disabled-interaction analogue; no focus target, handler, hint, event,
      │                    hover/focus/active affordance, or pressed state
      │
      └─ selectable=true + pointer|Enter|Space on route
             │ one shared activation path; real down input exposes transient pressed treatment
             ▼
        dispatch non-cancelable intent { routeId }
             │ component state unchanged
             ▼
        consumer may replace selectedRouteId ──► next render projects new selection
```

Event flags are exact: `bubbles: true`, `composed: true`, `cancelable: false`. `preventDefault()`
has no component action to prevent. Space prevents browser scrolling; repeated keydown does not
emit duplicate intent.

## Accessible rendering projection

| Model fact | DOM/accessibility projection |
|---|---|
| Component identity | Labelled section with `Flow health` title |
| Overall total | Derived `<total> moves`, optionally followed by `windowLabel` |
| Scale | Visible plain-language `bar length ∝ moves` caption |
| Present tones | Native legend list with text and matching dot/bar treatment |
| Columns | `<th scope="col">`; generated internal id for explicit references |
| Route | `<th scope="row">`; sticky first column at narrow widths |
| Cell | Table cell referencing its route and column headers; exposes numeric value |
| Route total | Total cell referencing route and Total headers; describes route cells where planned |
| Group run | Visible full-width group heading that labels its `<tbody>` |
| Selected route | `aria-selected="true|false"` from controlled id comparison |
| Selectable route | One row target with pointer/Enter/Space parity and focus-visible affordance |
| Empty/invalid data | Labelled `empty-state`, no row targets |

Generated internal DOM ids are component-owned indexes, not raw consumer ids. Tone text supplies
meaning; blocked/recovery/backward icons are decorative and `aria-hidden` because they duplicate
that text.

## Styling model

The public style relationship is:

```text
document/theme
  └─ inherited --sk-* tokens
       └─ open shadow root
            ├─ adopted skTransitionMatrixSheet (same exported object identity)
            ├─ internal sk-transition-matrix BEM classes (not public)
            └─ structural ::part() names (public)
```

Exact public parts: `header`, `legend`, `scroller`, `table`, `group`, `row`, `route`, `bar`,
`total`, `empty-state`. There are no tone-specific parts, generic cell part, slots, or component
custom properties. Theme variance arrives only through tokens; component CSS contains no ancestor
theme selector. The blocked tone's red use is a mission-specific semantic exception.

## Approved example instance

```ts
const columns = Object.freeze([
  { id: 'tue-1', label: 'Tue 1' },
  { id: 'wed-2', label: 'Wed 2' },
  { id: 'thu-3', label: 'Thu 3' },
  { id: 'fri-4', label: 'Today · Fri 4' },
]);

const routes = Object.freeze([
  { id: 'planned-progress', label: 'Planned → In progress', tone: 'forward',
    values: { 'tue-1': 3, 'wed-2': 6, 'thu-3': 7, 'fri-4': 5 } },
  { id: 'progress-review', label: 'In progress → For review', tone: 'forward',
    values: { 'tue-1': 2, 'wed-2': 5, 'thu-3': 6, 'fri-4': 4 } },
  { id: 'review-done', label: 'For review → Done', tone: 'completed',
    values: { 'tue-1': 1, 'wed-2': 3, 'thu-3': 4, 'fri-4': 3 } },
  { id: 'any-blocked', label: 'Any lane → Blocked', tone: 'blocked',
    group: 'Exceptions & recovery',
    values: { 'tue-1': 1, 'wed-2': 3, 'thu-3': 2, 'fri-4': 0 } },
  { id: 'blocked-progress', label: 'Blocked → In progress', tone: 'recovery',
    group: 'Exceptions & recovery',
    values: { 'tue-1': 0, 'wed-2': 1, 'thu-3': 1, 'fri-4': 2 } },
  { id: 'backward', label: 'Any lane → Any lane (backward)', tone: 'backward',
    group: 'Exceptions & recovery',
    values: { 'tue-1': 0, 'wed-2': 1, 'thu-3': 1, 'fri-4': 1 } },
]);
```

Derived route totals are `21`, `17`, `11`, `6`, `4`, and `3`; the overall total is `62`; the
global maximum is `7`. These values are verification facts, not additional input fields.

## Manifest and React mapping

| CEM/member fact | Generated React result | Runtime obligation |
|---|---|---|
| Attributed public field | Optional wrapper prop through existing convention | Attribute/property behavior stays as documented |
| Explicit public `attribute: false` field | Optional typed `columns`/`routes` prop via property-only marker | Assign same array identity before/after upgrade and on replacement; create no attribute |
| Proven immutable empty-array initializer/type | `empty-array` reset metadata | On prop omission assign a fresh frozen empty array, not stale prior data |
| `state: true`/private/readonly internal field | No public marker or React prop | Fail closed; preserve `EXPECTED_NON_PROP_FIELDS` protection |
| Typed `@fires` event | `onSkTransitionMatrixSelect` callback | Receive one `CustomEvent<TransitionMatrixSelectDetail>` across shadow boundary |

The generator mechanism is generic and AST-derived. It must not test for the names `columns`,
`routes`, or `sk-transition-matrix`, and arrays must never be serialized into attributes.

## Story instances as model tests

| Story | Model property under test |
|---|---|
| `Default` | Small valid non-selectable model with empty domain-specific copy defaults |
| `ApprovedExample` | Exact 6 × 4 fixture, all five tones, group run, 62 moves, selectable intent |
| `FiftyActiveWPs` | Aggregate counts remain route-bounded; zero WP-level objects |
| `SparseData` | Zeros, sparse counts, and legend derived only from present tones |
| `EqualTotalsDifferentDistribution` | Totals can match while global-scale cell ratios differ |
| `Empty` | Empty dimensions produce accessible no-target state |
| `ControlledSelection` | Intent leaves selected projection unchanged until consumer update |
| `SelectableStates` | Real rest/hover/focus-visible/pointer-active/keyboard-pressed evidence exists only in selectable mode; the same story exposes the non-selectable disabled-interaction analogue |
| `LightMode` | Same data/semantics with token-driven `.sk-light` variance |

## Explicitly absent data

The following are not entities, properties, events, derivations, or hidden state in this model:

- work packages or their identifiers;
- current/open-WP totals or lane inventory counts;
- supplied route/overall totals;
- dates, `Date` objects, reporting durations, clocks, or timezone logic;
- loading/error orchestration, fetching, polling, caches, stores, routing, or navigation targets;
- currency, spend, outcomes, evidence, or other Team Kitty domain concepts;
- component-owned selected route state;
- per-WP connectors, labels, or interactive targets.
