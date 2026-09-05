# Data Model: form-input-constraints-and-datalist

`sk-form-input` is a presentational/behavioural custom element, not a domain model — there is no
persistence and no server entity. This document captures the element's PUBLIC PROPERTY SURFACE
(the closest thing this mission has to a data model), its validation-state derivation, and the
option-model shape FR-006 introduces.

## Entity: `SkFormInput` reactive properties (additions only — existing properties unchanged)

| Property | Type | Attribute | Reflects | Default | Notes |
|---|---|---|---|---|---|
| `pattern` | `string \| undefined` | `pattern` | no | `undefined` | Forwarded verbatim to the inner `<input pattern=…>`. No validation of the regex string itself — the UA does that. |
| `min` | `string \| undefined` | `min` | no | `undefined` | Forwarded verbatim. String type (not `number`) because `min`/`max` are meaningful for date/time types too, matching the HTML attribute's own string contract. |
| `max` | `string \| undefined` | `max` | no | `undefined` | Same shape as `min`. |
| `step` | `string \| undefined` | `step` | no | `undefined` | Forwarded verbatim; `"any"` is a legal value the UA itself interprets. |
| `inputmode` | `string \| undefined` | `inputmode` | no | `undefined` | Forwarded verbatim; a hinting attribute only (no validation semantics), listed here for completeness against FR-001. |
| `autocomplete` | `string \| undefined` | `autocomplete` | no | `undefined` | Forwarded verbatim. |
| `readonly` | `boolean` | `readonly` | **yes** | `false` | Reflected (unlike `disabled`) — see FR-003/FR-004 and research R1/R5: the UA's own readonly-barring behaviour is what FR-003 wants engaged, not worked around, so there is no SC-005-shaped reason to withhold reflection here. |
| `options` | `ReadonlyArray<{ value: string; label?: string }>` | **none** (`attribute: false`) | n/a | `Object.freeze([])` | Property-only (FR-005/FR-006, NFR-001/SC-006 — see research R4). Drives the shadow-root `<datalist>`'s `<option>` children. |

## Validity-flag derivation (extends existing `validate()`)

```
validate():
  if disabled:
    setValidity({}); invalid=false; errorMessage=''; return      # UNCHANGED
  if readonly:                                                    # NEW — FR-003
    setValidity({}); invalid=false; errorMessage=''; return       # barred from constraint
                                                                   # validation, value still
                                                                   # submitted via syncFormValue()
  flags = {}
  if required and value === '': flags.valueMissing = true; message = "<label> is required"  # UNCHANGED
  merge in control.validity's own true flags (NEW — FR-002):       # patternMismatch,
    for each of patternMismatch, rangeUnderflow, rangeOverflow,     # rangeUnderflow/Overflow,
        stepMismatch, tooLong, tooShort, typeMismatch:              # stepMismatch, tooLong,
      if control.validity[flag]: flags[flag] = true                # tooShort, typeMismatch
      (message stays the UA's own reportValidity() bubble text      # (no host-authored message
       for a UA-raised flag unless required/customError also holds) #  invented for these)
  if customError: flags.customError = true; message = customError  # UNCHANGED, still wins message
  setValidity(flags, message, control) or clear                    # UNCHANGED shape
```

`valueMissing` is NOT pulled from `control.validity.valueMissing` — it stays element-derived
(`this.required && this.value === ''`), because the inner control's OWN `required` reflection is
never set (only the host's `required` reactive property is; the render already does
`?required=${this.required}`, so in practice they agree, but the derivation keeps its existing,
already-tested source rather than adding a second path to the same fact).

## Entity: option model item (FR-006)

| Field | Type | Required | Notes |
|---|---|---|---|
| `value` | `string` | yes | The datalist `<option value>`. A typed value matching no option's `value` stays valid (FR-006) unless a forwarded constraint (pattern/min/max/etc.) says otherwise. |
| `label` | `string` | no | The datalist `<option label>`, when the suggested display text differs from the value the input would receive on selection. |

No filtering, sorting, fetching, or invention (FR-006) — the element renders exactly the array it
is given, in order.

## State transitions

None beyond what already exists (`value`/`required`/`disabled` driving `willUpdate`→`validate()`).
`readonly`/`pattern`/`min`/`max`/`step`/`inputmode`/`autocomplete`/`options` are inputs to
rendering and (for the constraint attributes and `readonly`) to `willUpdate`'s existing
`validate()`-triggering condition, which must be extended to also fire on a change to any of the
new constraint properties or `readonly` (not just `value`/`required`/`disabled` as today) — an
attribute change alone (e.g. `pattern` changing while `value` stays the same) must re-run
`validate()`, or a validity regression introduced after mount would not be caught until the next
`value` edit.

## Externally visible events

None added. No new custom event is introduced by this mission (constraint forwarding and datalist
rendering are attribute/property/markup changes; the existing `input`-driven `value` update and
form-participation lifecycle callbacks are unchanged).
