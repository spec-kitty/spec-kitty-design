# Data Model: form-input-constraints-and-datalist

`sk-form-input` is a presentational/behavioural custom element, not a domain model — there is no
persistence and no server entity. This document captures the element's PUBLIC PROPERTY SURFACE
(the closest thing this mission has to a data model), its validation-state derivation, and the
option-model shape FR-006 introduces.

## Entity: `SkFormInput` reactive properties (additions only — existing properties unchanged)

**Revised post-squad**: the `readonly` reflection direction is flipped from the original draft
(research R1's revision), and the `Reflects` column below for the six plain constraint attributes
was wrong in the original draft — corrected here to match the contract and WP01.

**`null` added to the six constraint types, post-pre-merge-squad**: Lit's default `String`
converter hands a REMOVED reflected attribute's `fromAttribute` result straight through, which is
`null` (from `getAttribute`), not `undefined` — measured directly: `el.removeAttribute('pattern')`
delivers `this.pattern === null`, a value the original `string | undefined` type did not admit.

| Property | Type | Attribute | Reflects | Default | Notes |
|---|---|---|---|---|---|
| `pattern` | `string \| null \| undefined` | `pattern` | **yes** | `undefined` | Forwarded verbatim to the inner `<input pattern=…>`. No validation of the regex string itself — the UA does that. |
| `min` | `string \| null \| undefined` | `min` | **yes** | `undefined` | Forwarded verbatim. String type (not `number`) because `min`/`max` are meaningful for date/time types too, matching the HTML attribute's own string contract. |
| `max` | `string \| null \| undefined` | `max` | **yes** | `undefined` | Same shape as `min`. |
| `step` | `string \| null \| undefined` | `step` | **yes** | `undefined` | Forwarded verbatim; `"any"` is a legal value the UA itself interprets. |
| `inputmode` | `string \| null \| undefined` | `inputmode` | **yes** | `undefined` | Forwarded verbatim; a hinting attribute only (no validation semantics), listed here for completeness against FR-001. |
| `autocomplete` | `string \| null \| undefined` | `autocomplete` | **yes** | `undefined` | Forwarded verbatim. |
| `readonly` | `boolean` | `readonly` (attribute→property only) | **no** — REVISED | `false` | **Corrected by the squad's own measurement (research R1):** reflecting `readonly` to the HOST attribute makes the UA bar the form-associated element from constraint validation on the attribute alone — measured directly, both engines — which makes this element's OWN `validate()` branch an unobservable, near-dead mutation anchor (the exact SC-005 collateral shape). Matching the `disabled` precedent (also deliberately unreflected, for the same reason: keep the element's OWN exclusion/barring logic the sole, testable authority), `readonly` stays a plain `{ type: Boolean }` property with no `reflect`. `<sk-form-input readonly>` in markup still sets the property (attribute→property needs no `reflect`); only property→attribute is withheld. |
| `options` | `ReadonlyArray<{ value: string; label?: string }>` | **none** (`attribute: false`) | n/a | `Object.freeze([])`, as a **literal field initializer**, not a `declare` field with a constructor default | Property-only (FR-005/FR-006, NFR-001/SC-006 — see research R4). Drives the shadow-root `<datalist>`'s `<option>` children. **The initializer form is load-bearing**: `scripts/normalise-manifest.mjs`'s `hasFrozenEmptyArrayInitializer()` reads the field's AST initializer to earn the `x-spec-kitty-property-reset` marker WP02 depends on; a `declare`d field has no initializer at all. |

## Validity-flag derivation (extends existing `validate()`) — **rewritten to the shipped probe design**

An earlier revision of this section (kept during the squad fold-in, now retracted — see
research.md R2/R8) prescribed "sync the RENDERED control" (`control.pattern = pattern ?? ''`,
etc.) as the fix. That form is exactly the defect a maintainer implementing from it would
reintroduce: `?? ''` compiles an unset `pattern` to `^(?:)$` (matches only the empty string), and
syncing the rendered control specifically cannot fix a field that mounts already-invalid (the
control does not exist during the very first `willUpdate` pass at all). What actually shipped is
a DETACHED validation probe — a private, permanently-disconnected `<input>`, created once, that
needs no render and no DOM connection to compute constraint validation correctly. Two further
engine-measured defects (a probe assignment-order bug, and `setValidity`'s throw on an empty
message with a true flag) are folded into the pseudocode below, both from a pre-merge debugger
lens's pass:

```
validate():
  control = shadowRoot?.querySelector('input')                     # the RENDERED control — used
                                                                     # for badInput and the
                                                                     # setValidity focus anchor
                                                                     # ONLY, never for merging
                                                                     # the six forwarded-attribute
                                                                     # flags (see probe, below)

  if disabled:
    setValidity({}); invalid=false; errorMessage=''; return        # UNCHANGED

  if readonly:                                                     # FR-003, unreflected
    setValidity({}); invalid=false; errorMessage=''; return        # barred from constraint
                                                                    # validation (element's OWN
                                                                    # doing — readonly is NOT
                                                                    # reflected), value still
                                                                    # submitted via
                                                                    # syncFormValue() (unaffected)

  probe.type = type                                                # ORDER MATTERS: type BEFORE
  probe.value = value                                               # value, matching render()'s
                                                                     # own .type-then-.value order.
                                                                     # The probe is LONG-LIVED
                                                                     # (one instance, reused every
                                                                     # call) — assigning value
                                                                     # first validates the NEW
                                                                     # value against the STALE
                                                                     # type until this pass
                                                                     # self-corrects (measured:
                                                                     # number->text + '123'->'abc'
                                                                     # + pattern="\d+" reported
                                                                     # host-valid for one update)
  setOrRemove(probe, 'pattern', pattern)                            # null AND undefined both mean
  setOrRemove(probe, 'min', min)                                    # "removed" — Lit hands a
  setOrRemove(probe, 'max', max)                                    # REMOVED reflected attribute
  setOrRemove(probe, 'step', step)                                  # through as null, not
                                                                     # undefined; setAttribute(x,
                                                                     # null) stringifies to the
                                                                     # literal text "null"

  flags = {}
  if required and value === '': flags.valueMissing = true; message = "<label> is required"  # UNCHANGED

  for each of patternMismatch, rangeUnderflow, rangeOverflow,       # MERGED FROM THE PROBE.
      stepMismatch, typeMismatch:                                  # tooLong/tooShort absent —
    if probe.validity[flag]: flags[flag] = true                    # unreachable, nothing forwards
                                                                     # maxlength/minlength

  if control && control.validity.badInput: flags.badInput = true    # MERGED FROM THE REAL
                                                                     # CONTROL, not the probe —
                                                                     # badInput is set ONLY by
                                                                     # genuine user typing; a
                                                                     # property assignment (which
                                                                     # is all the probe ever gets)
                                                                     # sanitizes silently with no
                                                                     # flag at all (measured on a
                                                                     # bare native <input>)

  if value !== '' and probe.value === '': flags.badInput = true     # PROGRAMMATIC divergence
                                                                     # (#180, operator ruling, R9)
                                                                     # — the probe is ALREADY
                                                                     # synced to the current type/
                                                                     # value above, so an empty
                                                                     # probe against a non-empty
                                                                     # property means the UA
                                                                     # sanitized it away entirely.
                                                                     # setFormValue(value) still
                                                                     # submits the RAW value —
                                                                     # only validity is affected.
                                                                     # Does not double-report
                                                                     # against the real-control
                                                                     # badInput merge above: while
                                                                     # a user types, #onInput does
                                                                     # NOT write `value` (below),
                                                                     # so `value` stays the last
                                                                     # GOOD one and `probe.value`
                                                                     # stays non-empty for that
                                                                     # whole window. Does not fire
                                                                     # for a type that merely
                                                                     # rejects rather than
                                                                     # sanitizes (type="email"
                                                                     # keeps the raw text and
                                                                     # reports typeMismatch
                                                                     # instead — probe.value stays
                                                                     # non-empty there too)

  if customError.trim() !== '':                                    # TRIMMED — a whitespace-only
    flags.customError = true; message = customError                # customError is truthy as a
                                                                     # string but renders as a
                                                                     # blank, unreadable error

  if flags has any true entry and message === '':                  # PREVENTS setValidity(flags,
    message = fallbackMessageFor(the true flag)                    # '') THROWING when any flag
                                                                     # is true (measured, both
                                                                     # engines) — a form-
                                                                     # associated custom element
                                                                     # has no free UA message

  setValidity(flags, message, control) or clear                    # control is STILL the focus
                                                                     # anchor argument — the probe
                                                                     # is never rendered, so it
                                                                     # cannot anchor anything
```

`valueMissing` is NOT pulled from either the probe's or the control's own `validity.valueMissing`
— it stays element-derived (`required && value === ''`), because neither inner control's own
`required` reflection is authoritative here; the render already does `?required=${required}`, so
in practice they agree, but the derivation keeps its existing, already-tested source.

**Why the merge reads TWO different objects (the probe for five flags plus the programmatic
`badInput` check, the real control for typed `badInput`)**, rather than one: constraint
validation for `patternMismatch`/range/step/type is a pure attribute+value computation with no
render dependency, so the detached probe (synced fresh on every call) is both correct and immune
to the mount-time-and-render-timing races a rendered control has. Typed `badInput` is the opposite
case — it exists ONLY as the UA's own record of genuine user keystrokes into a specific widget; a
property assignment (which is all a detached probe can ever receive) can never produce it, so it
must be read off the real, currently-rendered control, which is guaranteed to exist by the time
any user could have typed into it (there is no mount-time race for a control the user has not
interacted with yet). The PROGRAMMATIC `badInput` check (R9, operator-ruled) is a third merge step
sharing the SAME `badInput` flag as the typed check, but reads the PROBE, not the control — it
answers a different question ("did assigning this property produce something the UA cannot
represent at all") from a source available at mount time, closing the one gap neither the typed
-`badInput` control read nor the five-flag probe loop covered on their own.

**`#onInput` does not always write `this.value`.** While the real control's `validity.badInput` is
true, the sanitized `.value` it reports must NOT be copied into `this.value` — doing so and
letting the next render's `.value=` binding commit it back onto the SAME control the user is
still editing destroys the UA's own in-progress edit buffer (measured: a `type="date"` field mid
-edit resolved to a fabricated wrong date instead of what was actually typed). `validate()` is
called directly from the input handler in that branch instead, so the flag still merges (reading
the real control fresh, as above) without ever touching the value being edited.

**The reset path (`formResetCallback`) needs no separate code change.** It assigns
`this.value = this.initialValue`, a plain reactive-property write that goes through the same
`willUpdate()` → `validate()` path above; the probe-sync step above fixes the reset case for free
— this is also why its own mutation anchor sits under the merge arms' id, not a separate one (see
research.md R6).
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

**`label` was ALSO missing — found by the pre-merge debugger lens, added in the same pass as the
probe/null/customError fixes.** `label` feeds the required-empty MESSAGE text
(`${label || 'This field'} is required`) but was absent from the trigger set: changing `label` on
an already-invalid field left the `role="alert"` node and `internals.validationMessage` showing
the OLD label until some unrelated property change happened to re-run `validate()` next.

## Externally visible events

None added. No new custom event is introduced by this mission (constraint forwarding and datalist
rendering are attribute/property/markup changes; the existing `input`-driven `value` update and
form-participation lifecycle callbacks are unchanged).
