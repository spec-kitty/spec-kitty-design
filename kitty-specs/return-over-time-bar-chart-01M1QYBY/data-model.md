# Data model: Return-over-time bar chart

**Mission:** `return-over-time-bar-chart-01M1QYBY`

The design element owns no persisted or application-domain data. This model describes immutable
consumer input, pure render-time derivations, and one outbound intent event.

## Public input entities

### `BarDatum`

```ts
export type BarDatum = Readonly<{
  id: string;
  label: string;
  value: number;
  displayValue: string;
}>;
```

| Field | Meaning | Validation | Ownership |
|---|---|---|---|
| `id` | Stable datum identity used for keyed rendering and controlled selection | non-empty after trim; unique within the current series | Consumer |
| `label` | Category/date/category-like text rendered verbatim | non-empty string; no parsing or date interpretation | Consumer |
| `value` | Unformatted magnitude used only for scale derivation | finite number, `>= 0` | Consumer |
| `displayValue` | Already-formatted visible/audible value | non-empty string; never parsed or recomputed | Consumer |

### `series`

```ts
export type BarSeries = ReadonlyArray<BarDatum>;
```

- Ordered: visual order, DOM order, list order, and assistive-technology order are identical.
- Immutable by contract: the element never sorts, mutates, annotates, or stores consumer objects.
- Reactive by replacement: a new array/object graph is required to update the view.
- Property-only: structured data is assigned as a JavaScript/React property, never serialized into
  an HTML attribute.
- Default/removal value: a newly frozen empty array, as supplied by the shared property-reset seam.

### Chart metadata

| Property | Transport | Default | Meaning |
|---|---|---|---|
| `label` | string attribute/property | generic accessible name to be finalized in spec | Consumer-owned chart name |
| `description` | string attribute/property | empty | Optional consumer-owned chart description |
| `selectable` | reflected boolean attribute/property | `false` | Whether datum activation is offered |
| `selectedId` | string attribute/property | empty | Controlled selected projection; unknown ID selects nothing |

No title, date, currency, total, time-window, formatter, annotation, deployment, or action-function
entity exists in this model.

## Derived render entities

### `ValidatedSeries`

Discriminated render input produced on every replacement:

```ts
type ValidatedSeries =
  | Readonly<{ kind: 'empty' }>
  | Readonly<{ kind: 'invalid'; reason: 'shape' | 'id' | 'label' | 'value' | 'display-value' }>
  | Readonly<{ kind: 'valid'; data: ReadonlyArray<ValidatedDatum>; maximum: number }>;
```

The reason is internal and must not become user-visible diagnostic leakage. Invalid input renders a
generic unavailable state. Validation is all-or-nothing.

### `ValidatedDatum`

```ts
type ValidatedDatum = Readonly<{
  datum: BarDatum;
  ratio: number;
  selected: boolean;
}>;
```

Derived fields:

- `ratio = maximum === 0 ? 0 : datum.value / maximum`
- `selected = selectable && datum.id === selectedId`

`ratio` is always in `[0, 1]`. A zero value has ratio `0`; all equal non-zero values have ratio
`1`; every recalculation uses the current full valid series.

### `BarChartSelectDetail`

```ts
export type BarChartSelectDetail = Readonly<{ id: string }>;
```

One activation produces one `CustomEvent<BarChartSelectDetail>` named
`sk-bar-chart-select`, with `bubbles: true`, `composed: true`, and `cancelable: false`. The event is
emitted only for a currently valid datum while `selectable === true`. The operator resolved it as
non-cancelable on 2026-09-05 because the controlled element performs no default action.

## Relationships

```text
Consumer-owned immutable series
       │ replace by identity
       ▼
whole-series validation ── invalid ──▶ unavailable state (0 targets)
       │ valid/empty
       ▼
max(value) + ordered ratio projection
       │
       ├──▶ native list item 1 ── label + displayValue + geometric bar
       ├──▶ native list item 2 ── label + displayValue + geometric bar
       └──▶ ... in source order

consumer selectedId ──▶ selected projection only
native activation ──▶ sk-bar-chart-select { id } ──▶ consumer action/store
                                            (element never mutates selectedId)
```

## Validation and failure policy

| Input state | Render state | Bars | Tab stops | Events |
|---|---|---:|---:|---:|
| property absent/default frozen `[]` | labelled empty | 0 | 0 | 0 |
| explicit empty readonly array | labelled empty | 0 | 0 | 0 |
| valid zero-only series | normal chart with baseline and zero-height geometry | N | N only if selectable | on activation only |
| valid equal series | equal heights | N | N only if selectable | on activation only |
| valid widely varying series | zero-anchored proportional heights; persistent text preserves small values | N | N only if selectable | on activation only |
| duplicate/blank ID | unavailable | 0 | 0 | 0 |
| blank label or display value | unavailable | 0 | 0 | 0 |
| negative, `NaN`, or infinite value | unavailable | 0 | 0 | 0 |
| non-array/malformed datum at runtime | unavailable | 0 | 0 | 0 |
| unknown `selectedId` | valid chart, no selected projection | N | N only if selectable | normal activation |

## State transitions

1. **Construct:** `series=[]`, `selectable=false`, `selectedId=''`; empty state has no targets.
2. **Assign valid series:** validate once for the update, derive maximum/ratios, render in input
   order.
3. **Replace valid series:** discard prior derivations; recompute maximum, ratios, key identity,
   and selected projection from the new array.
4. **Remove React property:** generated property-reset hook assigns a fresh frozen empty array;
   render returns to empty state with no stale bars.
5. **Enable selection:** replace passive item surfaces with native buttons; selectedId remains
   unchanged.
6. **Activate datum:** emit intent with current stable ID; do not change selectedId.
7. **Consumer updates selectedId:** project selected state on the matching current datum.
8. **Disable selection or invalidate/remove a datum during interaction:** remove interactive and
   pressed affordances; a later reintroduction must not resurrect stale transient state.

## Accessibility mapping

| Information/action | Semantic representation |
|---|---|
| Chart name | same-root labelled figure/group from `label` |
| Chart description | optional same-root description from `description` |
| Series order | native list order equal to input order |
| Datum identity | persistent visible `label` text |
| Datum magnitude | persistent visible `displayValue`; SVG geometry is supplementary and aria-hidden |
| Presentational mode | no interactive role and no tab stop |
| Selectable mode | native `button` per datum with label + display value in accessible name |
| Controlled selected state | valid programmatic non-color state such as `aria-pressed` plus visible shape/border treatment |
| Focus | existing gold focus token; visible and not color-only |
| Narrow ownership | label/value/bar remain descendants of one item inside horizontal scroller |
| Reduced motion | no required initial animation; any incidental transition removed under reduced motion |

## Public styling model

- Open shadow root.
- One generated constructed stylesheet adopted by identity; no injected `<style>`.
- Token dependencies are documented in the element and Storybook docs.
- Internal BEM classes are not API.
- Exact public parts are finalized in specification review; the candidate minimal set is `chart`,
  `plot`, `item`, `bar`, `value`, `label`, and `empty-state`.
- No slots or component-specific custom properties are currently justified.
- Data-derived height/y values are numeric SVG attributes; no runtime inline style is required.

## Explicitly absent domain entities

- Spend/currency attribution and totals.
- Dates, clocks, time windows, “Today”, or weekday manufacture.
- Mission/deployment annotations or a second series.
- Fetching, loading/error orchestration, stores, routing, timers, or polling.
- Selected application object, navigation target, or action callback.
- A public `sk-team-overview` element.
