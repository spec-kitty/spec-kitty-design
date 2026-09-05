# Contract: `<sk-form-input>` (additions)

Not a network/API contract — `sk-form-input` is a custom element, so its "contract" is the public
property/attribute surface, the DOM it renders, and the form-participation behaviour it promises.
This document is the addition to the existing contract already implied by
`packages/elements/custom-elements.json` and `packages/react/src/SkFormInput.d.ts`.

## Attributes / properties added

```html
<sk-form-input
  label="Signal"
  name="signal"
  pattern="[A-Za-z0-9_-]+"
  min="0"
  max="100"
  step="1"
  inputmode="numeric"
  autocomplete="off"
  readonly
></sk-form-input>
```

```ts
el.options = [
  { value: 'main' },
  { value: 'release/2026.09', label: 'Release 2026.09' },
];
```

- `pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete` — plain string reactive properties,
  reflected as attributes, forwarded verbatim to the inner `<input>`. No element-side validation of
  their content; the UA is the sole authority (FR-001).
- `readonly` — boolean, reflected. Value is submitted; control is barred from constraint
  validation (FR-003).
- `options` — `ReadonlyArray<{ value: string; label?: string }>`, property-only (no attribute).
  Renders a `<datalist>` in the shadow root; the inner input's `list` resolves to it (FR-005/006).

## Rendered shadow DOM (delta)

```html
<div part="field" class="sk-form-input">
  <label part="label" ...>…</label>
  <input
    part="control"
    ...
    pattern="…"
    min="…" max="…" step="…"
    inputmode="…" autocomplete="…"
    ?readonly
    list="options"
  />
  <datalist id="options">
    <option value="main"></option>
    <option value="release/2026.09" label="Release 2026.09"></option>
  </datalist>
  ...
</div>
```

`<datalist>` renders only when `options` is non-empty (an empty `<datalist>` with no `list`
reference is harmless but pointless; omitting both when there is nothing to list keeps the shadow
tree's node count matching what SC-005's node-identity assertion expects to find or not find).

## Form-participation contract (delta)

| State | `willValidate` | `setFormValue` argument | Notes |
|---|---|---|---|
| enabled, not readonly | per computed flags | `this.value` | unchanged |
| `disabled` | `false` | `null` | unchanged (FR-004) |
| `readonly` | `false` | `this.value` | **new** — differs from `disabled` exactly here (FR-003) |

## Validity contract (delta)

A UA-raised flag on the inner `<input>` (`patternMismatch`, `rangeUnderflow`, `rangeOverflow`,
`stepMismatch`, `tooLong`, `tooShort`, `typeMismatch`) now reaches `internals.validity` on the host
and blocks `form.requestSubmit()`/`checkValidity()`, with a message reaching the accessibility tree
via the existing `aria-describedby`-linked error node — UNLESS the control is `readonly` (barred)
or `disabled` (barred), in which case none of these flags reach the host regardless of what the
inner control itself would report if queried directly.

## React wrapper contract (delta)

```tsx
<SkFormInput
  pattern="[A-Za-z0-9_-]+"
  min="0" max="100" step="1"
  inputmode="numeric"
  autocomplete="off"
  readOnly
  options={[{ value: 'main' }, { value: 'release/2026.09', label: 'Release 2026.09' }]}
/>
```

`options` is delivered as a JS property via the generated `useProperties` hook (not an attribute),
surviving delivery before the custom element is defined and resetting to a fresh frozen `[]` when
removed — mirroring `SkTransitionMatrix`'s `columns`/`routes` contract exactly (see research.md R4).

## Static/no-build styles-only markup contract (delta)

The generated `.html` forms in `packages/styles/src/form-input/` gain the plain-HTML attributes
(`pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete`, `readonly`, `list` + `<datalist>`)
where a story exercises them. No JavaScript merge behaviour is available in that consumer — native
browser validation (and its own UA message) is the only validation this path gets, which is a
documented limitation (FR-008), not a defect: plain HTML already supports every one of these
attributes without any element JavaScript at all.
