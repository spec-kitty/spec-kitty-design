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
- `readonly` — boolean, **NOT reflected** (revised — see research.md R1). Attribute→property still
  works (`<sk-form-input readonly>` sets the property), but setting the property programmatically
  does not add the host attribute back. Value is submitted; control is barred from constraint
  validation by the ELEMENT's own `validate()` branch (FR-003) — deliberately not delegated to UA
  reflection, matching the `disabled` precedent, so the barring stays this element's own,
  observable behaviour rather than an emergent side-effect of a reflected attribute the UA would
  bar on its own.
- `options` — `ReadonlyArray<{ value: string; label?: string }>`, property-only (no attribute),
  declared with a **literal field initializer** (`= Object.freeze([])`), not a `declare` field with
  a constructor default — see research.md R4 for why the initializer form is load-bearing for the
  manifest marker WP02 depends on. Renders a `<datalist>` in the shadow root; the inner input's
  `list` resolves to it (FR-005/006).

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
`?readonly` above binds the INNER control from the host's `readonly` PROPERTY, not from a host
attribute — this binding is unaffected by the reflection change recorded above; only the HOST's
own attribute reflection was withheld.

## Form-participation contract (delta)

| State | `willValidate` | `setFormValue` argument | Notes |
|---|---|---|---|
| enabled, not readonly | per computed flags | `this.value` | unchanged |
| `disabled` | `false` | `null` | unchanged (FR-004) |
| `readonly` | `false` | `this.value` | **new** — differs from `disabled` exactly here (FR-003) |

## Validity contract (delta) — **revised post-squad**

A UA-raised flag on the inner `<input>` (`patternMismatch`, `rangeUnderflow`, `rangeOverflow`,
`stepMismatch`, `typeMismatch`, `badInput`) now reaches `internals.validity` on the host and blocks
`form.requestSubmit()`/`checkValidity()`, with a message reaching the accessibility tree via the
existing `aria-describedby`-linked error node — UNLESS the control is `readonly` (barred) or
`disabled` (barred), in which case none of these flags reach the host regardless of what the inner
control itself would report if queried directly.

**Dropped from the original merge list**: `tooLong`/`tooShort` — this mission forwards no
`maxlength`/`minlength`, so neither flag is ever reachable; carrying them in the merge would be an
inert mutation target. **Added**: `badInput` — reachable TODAY with no new attribute at all
(`type="number"` plus a value the UA cannot parse, e.g. `12e`, produces `badInput: true`), and is
exactly the "looks fine, silently submits rejected data" case FR-002 exists to close.

**Message contract, new**: `ElementInternals.setValidity(flags, message, anchor)` throws (measured,
both engines) when any `flags` entry is `true` and `message` is an empty string — a form-associated
custom element has no UA-authored message to fall back on the way a plain `<input>`'s own
`reportValidity()` bubble supplies one for free. Every UA-raised flag this element merges therefore
gets a fallback, element-authored message when `required`/`customError` did not already supply one,
and that text is what reaches the `role="alert"` error node — asserted by content, not merely by
the flag being set.

**Read-timing contract, new**: a UA flag reflects the CURRENT update's constraint values (value,
type, pattern, min, max, step), not a previous render's — see research.md R2 for the mechanism
(`validate()` syncs the control's own DOM state before reading its `.validity`, since `willUpdate`
runs before `render()` commits this update's bindings). This applies equally to `form.reset()`
restoring a satisfying value: the field must report valid immediately, not remain stuck reporting
the pre-reset invalid state.

## React wrapper contract (delta) — **prop naming corrected post-squad**

```tsx
<SkFormInput
  pattern="[A-Za-z0-9_-]+"
  min="0" max="100" step="1"
  inputmode="numeric"
  autocomplete="off"
  readonly
  options={[{ value: 'main' }, { value: 'release/2026.09', label: 'Release 2026.09' }]}
/>
```

**Prop names are `readonly`/`inputmode`, lowercase — NOT React's conventional `readOnly`/
`inputMode`.** The original draft of this contract used React's own DOM-prop casing, which is
wrong for this generator: `build-react-wrappers.mjs` names a prop after the Lit class field
verbatim when the field name has no hyphen to convert (only hyphenated attributes like
`selected-route-id` get camelCased, e.g. `sk-transition-matrix`'s `selectedRouteId`). `readonly`
and `inputmode` are the element's OWN field names (chosen to match the native HTML attribute
spelling, like `disabled`/`required`/`pattern`), so the emitted wrapper prop is `readonly`/
`inputmode`, not a React-idiomatic rename. Confirm this against the regenerated
`packages/react/src/SkFormInput.d.ts` rather than assuming either convention.

`options` is delivered as a JS property via the generated `useProperties` hook (not an attribute),
surviving delivery before the custom element is defined and resetting to a fresh frozen `[]` when
removed — mirroring `SkTransitionMatrix`'s `columns`/`routes` contract exactly (see research.md R4),
**provided** `options` is declared with a literal field initializer, not a `declare` field (same
research.md R4 correction).

## Static/no-build styles-only markup contract (delta) — **repointed post-squad, real files identified**

**The original draft of this section named files that do not exist** (`sk-form-input.markup.ts`,
`packages/styles/src/form-input/*.html`) — `packages/styles/src/form-input/` holds only
`sk-form-input.css`; there is no element-backed markup module for this component, so
`build-element-markup.mjs --check` verifies nothing about it either way.

The REAL static/no-build markup lives in `packages/styles/src/form-field/sk-form-input-*.html`
(five hand-authored files: `-default`, `-disabled`, `-error`, `-filled`, `-focus`), owned by the
`form-field` styles-only component (C-004) and fed into a generated barrel via
`scripts/build-styles-only-markup.mjs`. **This mission does not edit those files** (see research.md
R7) — they are hand-authored content in another component's owned territory, not a mechanical
regeneration target. FR-008's discharge is a documented limitation: the no-build static-markup
consumer does not gain the new constraint attributes, `readonly`, or the datalist in this mission.
The stated workaround is real: every new attribute is plain HTML with zero framework involvement,
so a consumer maintaining that static form by hand can add `pattern`/`min`/`max`/`step`/`readonly`/
`list`+`<datalist>` themselves with no element code required. Parity in the static form, if wanted,
is a separate, explicitly-scoped follow-up (filed the way #173 was filed for its own
`form-field`-territory obligation), not an unreviewed addition here.
