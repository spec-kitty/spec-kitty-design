# Data Model: form-input-constraints-and-datalist

`sk-form-input` is a presentational/behavioural custom element, not a domain model — there is no
persistence and no server entity. This document captures the element's PUBLIC PROPERTY SURFACE
(the closest thing this mission has to a data model), its validation-state derivation, and the
option-model shape FR-006 introduces.

## Entity: `SkFormInput` reactive properties (additions only — existing properties unchanged)

**Revised post-squad**: the `readonly` reflection direction is flipped from the original draft
(research R1's revision), and the `Reflects` column below for the six plain constraint attributes
was wrong in the original draft — corrected here to match the contract and WP01.

| Property | Type | Attribute | Reflects | Default | Notes |
|---|---|---|---|---|---|
| `pattern` | `string \| undefined` | `pattern` | **yes** | `undefined` | Forwarded verbatim to the inner `<input pattern=…>`. No validation of the regex string itself — the UA does that. |
| `min` | `string \| undefined` | `min` | **yes** | `undefined` | Forwarded verbatim. String type (not `number`) because `min`/`max` are meaningful for date/time types too, matching the HTML attribute's own string contract. |
| `max` | `string \| undefined` | `max` | **yes** | `undefined` | Same shape as `min`. |
| `step` | `string \| undefined` | `step` | **yes** | `undefined` | Forwarded verbatim; `"any"` is a legal value the UA itself interprets. |
| `inputmode` | `string \| undefined` | `inputmode` | **yes** | `undefined` | Forwarded verbatim; a hinting attribute only (no validation semantics), listed here for completeness against FR-001. |
| `autocomplete` | `string \| undefined` | `autocomplete` | **yes** | `undefined` | Forwarded verbatim. |
| `readonly` | `boolean` | `readonly` (attribute→property only) | **no** — REVISED | `false` | **Corrected by the squad's own measurement (research R1):** reflecting `readonly` to the HOST attribute makes the UA bar the form-associated element from constraint validation on the attribute alone — measured directly, both engines — which makes this element's OWN `validate()` branch an unobservable, near-dead mutation anchor (the exact SC-005 collateral shape). Matching the `disabled` precedent (also deliberately unreflected, for the same reason: keep the element's OWN exclusion/barring logic the sole, testable authority), `readonly` stays a plain `{ type: Boolean }` property with no `reflect`. `<sk-form-input readonly>` in markup still sets the property (attribute→property needs no `reflect`); only property→attribute is withheld. |
| `options` | `ReadonlyArray<{ value: string; label?: string }>` | **none** (`attribute: false`) | n/a | `Object.freeze([])`, as a **literal field initializer**, not a `declare` field with a constructor default | Property-only (FR-005/FR-006, NFR-001/SC-006 — see research R4). Drives the shadow-root `<datalist>`'s `<option>` children. **The initializer form is load-bearing**: `scripts/normalise-manifest.mjs`'s `hasFrozenEmptyArrayInitializer()` reads the field's AST initializer to earn the `x-spec-kitty-property-reset` marker WP02 depends on; a `declare`d field has no initializer at all. |

## Validity-flag derivation (extends existing `validate()`) — **substantially revised post-squad**

Two engine-measured defects in the original draft (research R2) are folded in below: (1) reading
the inner control's validity in `willUpdate()` sees the PREVIOUS render's DOM state, not the one
about to commit, for any PROGRAMMATIC property assignment (mount-time and user-typing are both
unaffected, which is why this was easy to miss); (2) `setValidity(flags, '')` throws when any flag
is `true` — a form-associated custom element has no free UA-authored message to fall back on the
way a plain `<input>`'s own `reportValidity()` bubble would supply. Both are fixed below without
moving `validate()` out of `willUpdate()` — see research R2 for why moving it to `updated()` risks
reintroducing this file's OWN documented historical bug instead.

```
validate():
  control = shadowRoot?.querySelector('input')                     # unchanged reference

  if disabled:
    setValidity({}); invalid=false; errorMessage=''; return        # UNCHANGED

  if readonly:                                                     # FR-003, reflection REVISED
    setValidity({}); invalid=false; errorMessage=''; return        # barred from constraint
                                                                    # validation (element's OWN
                                                                    # doing now that readonly is
                                                                    # NOT reflected — see the
                                                                    # property table above), value
                                                                    # still submitted via
                                                                    # syncFormValue() (unaffected)

  if control:                                                       # NEW — sync BEFORE read
    control.value = value                                           # willUpdate runs BEFORE
    control.type = type                                             # render() commits this
    control.pattern = pattern ?? ''                                  # update's bindings, so
    control.min = min ?? ''                                          # without this the control's
    control.max = max ?? ''                                          # own .validity still
    control.step = step ?? ''                                        # reflects the PREVIOUS
                                                                       # render (research R2.1)

  flags = {}
  if required and value === '': flags.valueMissing = true; message = "<label> is required"  # UNCHANGED

  if control:                                                       # MERGE, revised list (R2.3)
    for each of patternMismatch, rangeUnderflow, rangeOverflow,
        stepMismatch, typeMismatch, badInput:                       # tooLong/tooShort DROPPED —
      if control.validity[flag]: flags[flag] = true                 # unreachable, nothing forwards
                                                                      # maxlength/minlength
                                                                      # badInput ADDED — reachable
                                                                      # today via type=number, no
                                                                      # new attribute needed

  if customError: flags.customError = true; message = customError   # UNCHANGED, still wins message

  if flags has any true entry and message === '':                   # NEW — R2.2, prevents the
    message = fallbackMessageFor(the true UA flag)                  # setValidity(flags, '') THROW

  setValidity(flags, message, control) or clear                     # unchanged call shape,
                                                                      # now guaranteed non-throwing
```

`valueMissing` is NOT pulled from `control.validity.valueMissing` — it stays element-derived
(`this.required && this.value === ''`), because the inner control's OWN `required` reflection is
never set (only the host's `required` reactive property is; the render already does
`?required=${this.required}`, so in practice they agree, but the derivation keeps its existing,
already-tested source rather than adding a second path to the same fact).

**The reset path (`formResetCallback`) needs no separate code change.** It assigns
`this.value = this.initialValue`, a plain reactive-property write that goes through the same
`willUpdate()` → `validate()` path above; the sync-before-read step fixes the reset case for free.
It DOES need its own test (see WP01 T002), because it is a different call site than a direct
property assignment even though the defect and the fix are identical.

## Entity: option model item (FR-006)

| Field | Type | Required | Notes |
|---|---|---|---|
| `value` | `string` | yes | The datalist `<option value>`. A typed value matching no option's `value` stays valid (FR-006) unless a forwarded constraint (pattern/min/max/etc.) says otherwise. |
| `label` | `string` | no | The datalist `<option label>`, when the suggested display text differs from the value the input would receive on selection. |

No filtering, sorting, fetching, or invention (FR-006) — the element renders exactly the array it
is given, in order.

**Guard against `undefined` post-squad**: `options` defaults to `Object.freeze([])` via its own
field initializer, so `this.options.length` is safe in the common case — but a consumer clearing
the property with `el.options = undefined` (not disallowed by the TypeScript type in every calling
context, e.g. from untyped markup/JS) would make `this.options.length` throw. `render()` must read
`this.options?.length` defensively rather than assuming the initializer is the only value ever
seen.

## State transitions

None beyond what already exists (`value`/`required`/`disabled` driving `willUpdate`→`validate()`).
`readonly`, `pattern`, `min`, `max`, `step`, and **`type`** (revised post-squad — see below) must
be added to `willUpdate`'s existing `validate()`-triggering condition (currently
`value`/`required`/`disabled` only) — an attribute change alone (e.g. `pattern` changing while
`value` stays the same) must re-run `validate()`, or a validity regression introduced after mount
would not be caught until the next `value` edit. `inputmode`/`autocomplete`/`options` carry no
validity semantics and do not need to trigger `validate()`.

**`type` was missing from this list in the original draft — added post-squad.** `typeMismatch` is
in the merged-flag list above, but nothing re-ran `validate()` when `type` alone changed. Measured:
set `value`, then change `type` from `'text'` to `'email'` with an email-shaped-invalid value
already present — the host stayed valid because nothing re-triggered the merge. `type` must be in
the trigger set for the same reason every other flag-affecting property is.

## Externally visible events

None added. No new custom event is introduced by this mission (constraint forwarding and datalist
rendering are attribute/property/markup changes; the existing `input`-driven `value` update and
form-participation lifecycle callbacks are unchanged).
