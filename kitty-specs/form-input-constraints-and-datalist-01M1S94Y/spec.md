# Feature Specification: form-input-constraints-and-datalist

**Mission Branch**: `mission/form-input-constraints-and-datalist`
**Created**: 2026-09-05
**Status**: Draft
**Issue**: #180 · epic #183 · tracks #125
**Base**: `train/elements-first@dcf7af2`
**Squad tier**: B — post-tasks and pre-merge

## Why this mission exists

The Factory Dashboard's filter and configuration forms validate in JavaScript only: a numeric field
accepts any string and is checked on submit, a duration field has no `min`/`step`, and the
repository/branch fields offer suggestions through a hand-built dropdown of `div`s with no role, no
keyboard model and no announcement.

None of those needs a combobox. Every case is either a **native constraint** or a **suggestion list
over a freely typed value** — which is what `<datalist>` is.

`sk-form-input` cannot express either today. Verified at `dcf7af2`: `sk-form-input.ts:194-206`
renders the inner control with only `type`, `value`, `placeholder`, `disabled`, `required`,
`aria-invalid`, `aria-describedby` and an input handler. There is no `pattern`, `min`, `max`,
`step`, `inputmode`, `autocomplete`, `readonly` or `list`.

## Why not a combobox — binding

A combobox is a listbox-backed widget with a full ARIA pattern, roving focus, typeahead, popup
positioning and owned open/selected state. It is a much larger mission, it duplicates what the
platform ships, and none of the Factory cases need it: each wants free text with suggestions, where
a value matching nothing is still valid. Building a combobox for a datalist case is the mistake the
Factory surface already made, in `div`s. A genuine listbox case later is a separate element with its
own mission, not a widening of this one. Epic #183 makes this binding.

## What the issue says, and what is actually true

The issue's contract states: *"`readonly` is not `disabled`: a readonly control is submitted and is
constraint-validated; a disabled one is neither."*

**The first half is right and the second half is wrong.** Measured in chromium against real
`<input>` elements:

| case | `willValidate` | `validity.valid` | in `FormData` |
|---|---|---|---|
| `required`, empty | true | false | yes |
| `required` + `readonly`, empty | **false** | **true** | **yes** |
| `required` + `disabled`, empty | false | true | **no** |
| `pattern` mismatch + `readonly` | **false** | false | yes |

A readonly control **is barred from constraint validation** — `willValidate` is false and an empty
required readonly field reports `valid`. It differs from `disabled` on **submission**, not on
validation: readonly submits its value, disabled does not. The last row is the subtle part: the
validity *flags* still compute for a barred control, so reading `validity.patternMismatch` and
acting on it would block a form the platform would have let through.

Implementing the issue's sentence literally would produce a field that vetoes its own form where the
platform does not. This spec therefore matches the platform and records the correction on #180.

## The trap this mission must not spring

`validate()` at `sk-form-input.ts:136-178` builds its flags **from scratch** — `valueMissing` from
its own `required`/`value` check, `customError` from its own property — and calls
`internals.setValidity(flags, …)`. It never reads the inner control's `validity`.

Forwarding `pattern`, `min`, `max` or `step` makes the **inner input** invalid while the **host**
reports valid, because host validity is what `ElementInternals` publishes to the form. The result is
a field that looks fine and silently submits data the constraint was meant to reject — the precise
failure the existing "FLAGS ARE MERGED, not replaced" comment was written for, one level up.

## Requirements

### Functional

- **FR-001**: `pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete` and `readonly` are
  reactive properties forwarded to the inner control, each with its own published doc comment —
  `check-manifest-content.mjs` rejects a manifest entry missing one.
- **FR-002**: `validate()` merges the **UA's own** validity flags from the inner control with the
  flags the element derives, rather than replacing them. A `patternMismatch`, `rangeUnderflow`,
  `rangeOverflow`, `stepMismatch`, `tooLong`, `tooShort` or `typeMismatch` raised by the inner
  control reaches the host's `ElementInternals` and blocks submission with a message in the
  accessibility tree.
- **FR-003**: `readonly` matches platform semantics: the value **is** submitted
  (`setFormValue(this.value)`), and the control is **barred from constraint validation**
  (`setValidity({})`) — the same validation outcome as `disabled`, the opposite submission outcome.
- **FR-004**: The existing `disabled` behaviour is untouched: not reflected (SC-005's mutation
  depends on it), `setFormValue(null)`, `setValidity({})`.
- **FR-005**: The element renders a `<datalist>` **into its own shadow root** from a supplied option
  model and points the inner input's `list` at that shadow-root id. `<input list="x">` resolves `x`
  in the input's own tree; the input lives in the shadow root (ADR-9's Arrangement B), so neither a
  consumer's light-DOM datalist nor a slotted one can be referenced. This is the same containment
  argument that put the label in the shadow root and must be recorded in the element's rationale
  comments, not merely done.
- **FR-006**: Options are supplied values with optional supplied labels. The element filters, sorts,
  fetches and invents nothing. A typed value matching no option stays valid unless a forwarded
  constraint says otherwise.
- **FR-007**: Genuinely shared forwarding lands in `form-control-base.ts` rather than being copied
  into `sk-form-textarea` — #122 already tracks the core being authored twice.
- **FR-008**: Any gap in the generated static / no-build form is a **documented limitation with a
  stated workaround**, never silent divergence.

### Non-functional

- **NFR-001**: The React wrapper's `ssrSafe` delivery is **measured**, not assumed. The generator
  defers registration to an effect, so React delivers first-render props as attributes and members
  with no observed attribute are dropped — an array option model populated only after hydration is a
  user-visible regression. Either first-render delivery is proven in a `fixtures/react-consumer`
  test, or the supported channel is documented and enforced. Per epic #183, whichever of #180/#179
  resolves this boundary first records the reusable decision for #147–#149.
- **NFR-002**: The invalid treatment is never colour-only and survives forced colors. The baseline
  comes from #176; if #176 has not landed it when needed, that is recorded as a dependency rather
  than re-decided here.
- **NFR-003**: No behaviour change to `sk-form-textarea`'s or `form-control-base.ts`'s existing
  contracts.

### Constraints

- **C-001**: No `sk-combobox`, listbox, popup, filtering autocomplete or async suggestion fetching.
- **C-002**: No multi-select, token/chip input, masking, input formatting, or date/time pickers
  beyond forwarding the native `type`.
- **C-003**: `sk-button` is not changed. The submit-button half of #153 stays #153's; this mission
  owns the **input** half only, and #180 records that #153 needs widening from a note to a contract.
- **C-004**: `sk-form-field` stays deliberately styles-only (#141/#172).
- **C-005**: `LightMode` stories wrap in `class="sk-light"`, never `data-theme` (#93).

## Success criteria

- **SC-001**: Every forwarded attribute round-trips both ways — attribute→property and
  property→attribute — with a behaviour test per member, and a mutation red for a dropped
  forwarding.
- **SC-002**: A swallowed `patternMismatch` reds a test. Asserted against a **real form submit**,
  not just a `validity` read, so the test fails if the flag never reaches the host.
- **SC-003**: A readonly field still submits its value, and an empty required readonly field does
  **not** block its form — matching the measured platform table above.
- **SC-004**: `formResetCallback` still restores the initial value.
- **SC-005**: The datalist is reachable from the inner input: with options supplied, the input's
  `list` attribute resolves to a `<datalist>` in the same root, asserted by node identity rather
  than by attribute string equality.
- **SC-006**: The `ssrSafe` question has a committed answer — either a passing first-render
  react-consumer test, or a documented and enforced channel with a test proving the enforcement.
- **SC-007**: Conformance-matrix entry, parts/docs registration, and regenerated manifest, wrappers
  and size report. Before final gate, rebase on the current train and regenerate shared artifacts.

## Out of scope

A combobox, listbox, filtering autocomplete or async suggestion fetching. Multi-select. Token/chip
input. Masking or input formatting. Date/time pickers beyond forwarding the native `type`. Changing
`sk-button`. Changing the `disabled` non-reflection decision or ADR-9's Arrangement B.

## Deferred questions

- **#153 needs widening.** It reports that a shadow-root `<button>` does not submit an enclosing
  form and that `sk-button` hard-codes `type="button"`, then leaves it as a closing note. With this
  mission surfacing real constraint failures, a form the user cannot submit becomes reachable. The
  button half is not folded in here; #180 records that #153 must become a contract.
