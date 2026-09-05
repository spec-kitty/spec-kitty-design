# Data Model: Delivery-return metric elements

## Boundary

This is a render-input model, not persisted application data. Team Kitty or another consumer computes and formats all values before assignment. The elements read the model without mutating it and own no lifecycle beyond rendering.

## Entity: MetricPresentation

Represents the public scalar inputs for one `sk-metric`.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `label` | `string` | yes | Consumer-supplied visible label; not parsed or translated by the element. |
| `displayValue` | `string` | yes | Opaque preformatted content; rendered verbatim. |
| `annotation` | `string` | no | Supporting content; absent means no supporting chrome. |
| `tone` | `'neutral' \| 'info' \| 'success' \| 'attention'` | no | Generic visual emphasis only; defaults to neutral and carries no domain meaning. |
| `compact` or equivalent bounded presentation | boolean/closed variant | no | Changes density only; never changes content or semantics. |

### Invariants

- `label` and `displayValue` retain exact consumer text.
- Tone never changes or derives the display value.
- Annotation remains subordinate to the primary value.
- The metric is understandable without an application-specific heading level.

## Entity: EvidenceStage

Representative exported shape:

```ts
export type EvidenceStage = Readonly<{
  id: string;
  label: string;
  displayValue: string;
  annotation?: string;
  tone?: 'neutral' | 'info' | 'success' | 'attention';
}>;
```

| Field | Type | Required | Rules |
|---|---|---:|---|
| `id` | `string` | yes | Nonblank and unique within one chain; supplies stable render identity only. |
| `label` | `string` | yes | Passed unchanged to the composed metric. |
| `displayValue` | `string` | yes | Passed unchanged to the composed metric. |
| `annotation` | `string` | no | Passed unchanged; omission remains omission. |
| `tone` | generic tone union | no | Passed as presentation only; omission resolves to neutral. |

### Invariants

- A stage record is readonly and never enriched with derived totals/status.
- IDs do not imply sorting, navigation, selection, or domain identity outside the current chain.
- Duplicate/blank IDs make the chain input invalid rather than being repaired.

## Entity: EvidenceChainInput

```ts
export type EvidenceChainInput = ReadonlyArray<EvidenceStage>;
```

Public element property:

```ts
stages: ReadonlyArray<EvidenceStage> = Object.freeze([]);
```

### Invariants

- The order is authoritative and preserved in visual and accessible layouts.
- Rendering does not call mutating array operations or modify stage records.
- Two, four, and six items are ordinary valid inputs; four is not a hardcoded special case.
- Invalid input is fail-closed as a whole, not partially trusted.
- `stages` is property-only (`attribute: false`); there is no JSON attribute representation.

## Entity: RenderedEvidenceSequence

An internal accessible projection of a valid `EvidenceChainInput`.

| Relationship | Cardinality | Rule |
|---|---:|---|
| chain → ordered list | 1:1 | One native ordered sequence lives inside one shadow root. |
| stage → list item | 1:1 | Each valid input stage creates exactly one direct sequence item. |
| list item → `sk-metric` | 1:1 | Metric content is composed, never duplicated. |
| adjacent stage pair → connector | 1:1 | Connector count is `max(stageCount - 1, 0)` and connectors are decorative. |

### Wide/narrow state

Responsive layout changes presentation only:

```text
wide:    stage A -> stage B -> stage C -> stage D
narrow:  stage A
            |
         stage B
            |
         stage C
            |
         stage D
```

The underlying ordered list and DOM order remain unchanged. No state transition occurs.

## Validation states

| State | Condition | Output contract |
|---|---|---|
| valid | Nonempty readonly array; every record has valid fields; IDs unique | Ordered composed metrics and decorative connectors. |
| empty | Empty array/default | Generic empty presentation; no fabricated metric/list item. |
| invalid | Non-array, malformed record, blank/duplicate ID, unsupported tone | Same safe generic presentation; no partial chain. |

## Ownership map

| Concern | Owner |
|---|---|
| Raw numbers, attribution, percentages, outcome verification | Consumer/application |
| Currency/date/relative-age/window formatting | Consumer/application |
| Stage order and stable IDs | Consumer/application |
| Label/value/annotation rendering and generic tone | `sk-metric` |
| Ordered-list semantics, connectors, responsive direction | `sk-evidence-chain` |
| Section/card/grid composition | Consumer using existing `sk-card`/`sk-grid` |
| Optional status-chip visual | Existing `sk-pill-tag` composed by the metric |
| Selection, navigation, actions, timers, animation | Not part of this mission |

## Generated consumer projection

The custom-elements manifest is the canonical machine-readable public surface. It must classify `stages` as property-only and preserve the exported readonly type. The generated React wrapper assigns the value through the property hook; the generated Vue declaration exposes the same property type. Neither target serializes the array as an attribute or redefines `EvidenceStage` as `any`.
