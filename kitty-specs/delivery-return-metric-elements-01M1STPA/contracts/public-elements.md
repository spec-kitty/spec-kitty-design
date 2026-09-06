# Public element contracts

## `sk-metric`

### Properties and attributes

| JavaScript property | HTML attribute | Type | Default |
|---|---|---|---|
| `label` | `label` | `string` | `''` |
| `displayValue` | `display-value` | `string` | `''` |
| `annotation` | `annotation` | `string` | `''` |
| `tone` | `tone` | `'neutral' \| 'info' \| 'success' \| 'attention'` | `'neutral'` |
| `compact` | `compact` | `boolean` | `false` |

Required `label`/`displayValue` are rendered verbatim. Invalid required data or an unsupported tone produces the generic unavailable state. There are no public methods, events, or slots.

### Parts

`metric`, `label`, `value`, `annotation`, `empty-state`.

### Accessibility

The internal native definition relationship makes the label/value pair understandable outside visual layout. The metric is not a heading. Optional annotation is subordinate content composed through `sk-pill-tag`.

## `sk-evidence-chain`

### Type

```ts
export type EvidenceStage = Readonly<{
  id: string;
  label: string;
  displayValue: string;
  annotation?: string;
  tone?: 'neutral' | 'info' | 'success' | 'attention';
}>;
```

### Property

`EvidenceStage` is the exported convenience alias. The actual element source must declare the field
with this inline structural type so the manifest and generated wrappers never need to resolve an
imported alias:

```ts
stages: ReadonlyArray<Readonly<{
  id: string;
  label: string;
  displayValue: string;
  annotation?: string;
  tone?: 'neutral' | 'info' | 'success' | 'attention';
}>> = Object.freeze([]);
```

| JavaScript property | HTML attribute | Type | Default |
|---|---|---|---|
| `stages` | none | the inline structural readonly array above | `Object.freeze([])` |

There are no public attributes, methods, events, or slots. Input records require unique nonblank IDs and nonblank labels/display values; annotation and tone are optional. Omitting both remains valid, produces neutral/no-annotation presentation, and never mutates the record to add defaults. Empty/invalid input renders one generic unavailable state, not a partial chain.

### Parts

`list`, `stage`, `connector`, `empty-state`.

### Accessibility and ordering

One same-root native ordered list contains one direct list item and one actual `sk-metric` per valid stage. Input order is visual and accessible order at all widths. Connectors are `aria-hidden` and occur only between adjacent stages.

## Shared invariants

- Inputs are presentation values; neither element parses, computes, formats, selects, navigates, fetches, polls, times, or mutates.
- Public code and defaults contain no Team Kitty domain vocabulary.
- Styling API is inherited `--sk-*` tokens and the documented parts only.
- Both hosts are block boxes and both themes are token-driven.
- The required approved story surrounds the chain with real existing `sk-card`/`sk-grid` and reaches real `sk-pill-tag` only through annotated `sk-metric` composition.
- There is no `sk-team-overview`, duplicate card/grid/tag/stat-grid, or hand-authored wrapper.
