# Research: form-input-constraints-and-datalist

All items below were resolved by reading this repository's own code and prior mission history
(#74, #122, #149, #153, #176) rather than by external research — the questions are internal-design
questions, not technology-choice questions, and every one had a measured or coded answer already
sitting in the tree.

**Post-tasks squad revision (BLOCK verdict folded in, this pass).** R1, R2, R5 and R6 are revised
below — three of the four following a genuine engine measurement the squad ran and reproduced, one
(R6) because the original finding was itself wrong (it read a data file's contents but not the test
that gates what may be added to it). R4 gained a correction to the exact field shape required. R7
and R8 are new. Nothing here was accepted uncritically — the mechanical claims (file contents, test
assertions, generator behaviour) are re-verified directly against this checkout below, not merely
copied from the squad's report.

## R1 — `readonly` platform semantics (corrects the issue) — **REVISED post-squad, host reflection reversed**

- **Decision (revised)**: `readonly` is a plain reactive property (`{ type: Boolean }`) that does
  **NOT reflect** to the host attribute. It drives the inner control (`?readonly=${this.readonly}`
  in `render()`, unchanged from the original design) and the element's OWN `validate()` early
  return (`internals.setValidity({})` unconditionally, value still reaching `setFormValue()`).
  `<sk-form-input readonly>` in markup still works — Lit's attribute→property conversion needs no
  `reflect` — only the reverse (property→attribute) direction is withheld.
- **Rationale — corrected twice, both times by measurement**:
  1. *The issue's contract was wrong* (unchanged finding, first pass): a readonly `<input>` is
     submitted but barred from constraint validation (`willValidate === false`); validity flags
     still compute underneath, so acting on them directly would block a form the platform lets
     through. This is HTML Standard behaviour, not a Chromium quirk.
  2. *The planning-time reflection choice was ALSO wrong* (second pass, squad-caught): reflecting
     `readonly` as a HOST attribute on a form-associated custom element makes the UA bar it from
     constraint validation **on the attribute alone** — measured directly (both engines):
     `willValidate === false`, `internals.checkValidity() === true`, still submits, with **no
     `setValidity` call from this element's own code required at all**. That makes the element's
     own `readonly` branch in `validate()` an UNOBSERVABLE, near-dead mutation anchor once
     reflected — three of the branch's assertions would still pass with the branch deleted. This
     is the exact SC-005 shape this repo already has a named precedent for: `disabled` is
     deliberately **not reflected**, specifically so the UA cannot pre-empt the element's own
     exclusion logic and the element's OWN correctness stays the thing under test (see
     `sk-form-input.ts`'s existing `disabled` property comment). The same argument transfers
     directly: keep `readonly` unreflected so the element's own barring branch remains the sole
     authority and remains observable to a mutation test.
- **What this means for the `willUpdate`/`render()`-timing decision (R2)**: because `readonly`
  is not reflected, the inner control's own native readonly-barring (were it ever to also carry
  the attribute) is not in play — the merge logic in `validate()` must still explicitly short
  -circuit BEFORE the UA-flag-merge code runs, exactly as originally designed; only the
  REFLECTION direction changed, not the branch's existence or its position in `validate()`.
- **Alternatives considered**: (a) reflect and delete the element's own branch, letting the UA do
  all the work — rejected: it would leave `readonly` semantics undocumented in this element's own
  code (a maintainer reading `validate()` would not know why an all-attributes-forwarded, all
  -flags-computed control never blocks), and it forfeits an observable, testable mutation anchor
  for a behaviour this mission exists to guarantee. (b, chosen) keep unreflected, own the barring —
  matches the `disabled` precedent exactly and keeps FR-003 a property of THIS element's code, not
  an emergent side-effect of what the UA happens to do with a reflected attribute it was never
  asked to interpret.

## R2 — Merging validity flags without replacing them (FR-002) — **REVISED post-squad, timing + throw defects found**

- **Decision (revised)**: `validate()` still reads the inner `<input>`'s own `ValidityState`, but
  two additional, measured defects change HOW:
  1. **Read-before-write ordering bug.** `validate()` runs from `willUpdate()`, which fires
     **before** Lit's `render()` commits the current update's attribute/property bindings
     (`.value=`, `pattern=`, `min=`, …) to the live DOM. Reproduced end-to-end: mount with
     `pattern="[a-z]+"`, then assign `el.value = '123'` — the host reports valid and a real
     `form.requestSubmit()` succeeds with `123` in the `FormData`, because `control.validity` at
     the point `validate()` reads it still reflects what the PREVIOUS render committed, not what
     this update is about to commit. User typing is unaffected (the browser updates the live
     `<input>`'s own DOM state and validity synchronously as part of the native keystroke, before
     Lit's cycle even starts), which is why this defect is invisible in Storybook/manual testing
     and only bites programmatic assignment — exactly the shape the React wrapper (`useProperties`)
     and this WP's own test-writing recipe (`el.value = 'x'; await el.updateComplete`) both use.
     **Fix**: inside `validate()`, before reading `control.validity`, imperatively sync the
     control's own DOM state to the CURRENT reactive-property values — `control.value = this.value`,
     `control.type = this.type`, `control.pattern`, `control.min`, `control.max`, `control.step` —
     so validity is always computed against what THIS update is rendering, not the last one. This
     keeps `validate()` in `willUpdate()` (preserving the existing, tested "no second render pass"
     invariant the file's own comment block already documents) rather than moving it to
     `updated()`, which would risk reintroducing the ORIGINAL historical bug that comment block
     describes (a reactive-property assignment — `this.invalid`/`this.errorMessage` — made from
     inside `updated()` schedules a second update cycle, and the ALREADY-EXISTING mount-time
     `aria-invalid` test was written specifically to catch that). The `willUpdate`
     rationale block at `sk-form-input.ts:91-101` must be AMENDED to document this new subtlety
     (why a pre-sync step exists), not contradicted by moving validation elsewhere.
  2. **`setValidity(flags, '')` throws when any flag is `true`.** Measured, both engines: an empty
     message string is not accepted when the flags object has a true entry (`updateComplete`
     rejects; `updated()` — and therefore `syncFormValue()` — never runs; the field silently
     disappears from `FormData` with no error surfaced to the caller). The ORIGINAL merge design
     (T003 step 3, superseded) said to pass "whatever `message` happens to be," which is empty for
     a UA-raised flag with no `required`/`customError` also true — a form-associated custom
     element has no UA-authored message to inherit, unlike a plain `<input>`, whose own
     `reportValidity()` bubble supplies one for free. **Fix**: a per-flag fallback message table
     (e.g. `patternMismatch` → "Value does not match the required pattern", `rangeUnderflow`/
     `rangeOverflow` → phrased against `this.min`/`this.max`, `stepMismatch`, `typeMismatch`,
     `badInput` → each a plain-language sentence), assigned when `message` is still empty after
     the existing `required`/`customError` checks and at least one UA flag merged true. The
     behaviour test must assert the text reaches the `role="alert"` node (`errorMessage`/
     `aria-describedby`), not merely that the flag is set — a message-shaped assertion, because a
     flag with no reachable text is exactly the WCAG 3.3.1 failure this file's other comments
     already warn about for a different code path.
  3. **The merged-flag SET was wrong in both directions.** `badInput` is reachable TODAY with no
     new attribute at all (`type="number"`, a value the UA cannot parse — e.g. `12e` — produces
     `value === ''` and `badInput: true`) and is exactly the "looks fine, silently submits
     rejected data" failure FR-002 names; it belongs in the merge list. `tooLong`/`tooShort`
     require `maxlength`/`minlength`, which this mission does not forward — their mutation arms
     would be permanently inert (never reachable, so a broken merge for them would never red).
     **Fix**: merge `patternMismatch`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`,
     `typeMismatch`, `badInput`; drop `tooLong`/`tooShort` from the list (they can be added back
     the day `maxlength`/`minlength` are forwarded, which is out of this mission's scope).
  4. **`type` was missing from `willUpdate()`'s trigger set** while `typeMismatch` is in the merge
     list. Measured: set `value`, then change `type` alone (e.g. `'text'` → `'email'`) — the host
     stays valid while the inner control's own `typeMismatch` is now true, until some unrelated
     property change next fires `validate()`. **Fix**: add `changed.has('type')` to the trigger
     condition alongside the constraint properties already added there.
  5. **The reset path shares this exact root cause.** `formResetCallback()` sets
     `this.value = this.initialValue` (a plain reactive-property assignment), which schedules
     `willUpdate()` → `validate()` the normal way — but WITHOUT fix (1) above, that call reads
     `control.validity` off the stale, pre-reset DOM, so a field left invalid before reset stays
     reported invalid AFTER a reset that restores a satisfying value: `aria-invalid="true"`
     persists, the error node keeps stale text, and the form stays blocked. Fix (1)'s sync-before
     -read step resolves this the same way it resolves the general case — no separate code path
     is needed — but a DEDICATED test is, because it is a different call site (`formResetCallback`,
     not a direct property assignment) even though the underlying defect is identical.
- **Rationale**: `ElementInternals.setValidity` still REPLACES the host's reported validity
  wholesale, as originally recorded — that half of R2 is unchanged. What changed is WHEN the
  inner control's own validity can be trusted to reflect the update actually being processed, and
  what argument `setValidity` can legally be called with.
- **Alternatives considered (unchanged)**: re-deriving each constraint's validity in the element
  itself — still rejected, for the same reason (a second, possibly-disagreeing source of truth).
  **New alternative considered and rejected**: moving `validate()`'s UA-merge half into `updated()`
  (post-render, so `control.validity` is naturally current with no pre-sync step needed) — this
  would work for THIS defect in isolation, but risks reproducing the file's own documented
  historical bug for any reactive-property write `validate()` makes (`this.invalid`,
  `this.errorMessage`), and would leave the `willUpdate` rationale block actively contradicted
  rather than merely incomplete. The pre-sync-then-read-in-willUpdate fix keeps the single-pass
  invariant intact and is amendment, not architecture change.

## R2 — Merging validity flags without replacing them (FR-002)

- **Decision**: `validate()` reads `this.shadowRoot?.querySelector('input')?.validity` (the same
  node reference already resolved for the `setValidity` focus anchor) and copies every `true` flag
  from it into the flags object already being built from `required`/`customError`, before calling
  `internals.setValidity(flags, message, control)`.
- **Rationale**: `ElementInternals.setValidity` REPLACES the host's reported validity wholesale —
  it does not merge with whatever the inner control's own attributes would imply, because the
  inner control's validity is never consulted by anything today. Confirmed by reading
  `sk-form-input.ts:136-178`: the `flags` object is built from scratch from `this.required` and
  `this.customError` only. Forwarding `pattern`/`min`/`max`/`step` (IC-01) without this merge would
  make the input itself invalid (`input.validity.patternMismatch === true`) while the host reports
  valid — a field that "looks fine and silently submits rejected data," in spec.md's own words.
- **Alternatives considered**: Re-deriving each constraint's validity in the element itself
  (parsing `pattern` as a regex, comparing `min`/`max` numerically) — rejected as needless
  reimplementation of what the UA already computes correctly on the real `<input>`, and a second
  source of truth that could disagree with the UA's own judgement.

## R3 — Shadow-root datalist reachability (FR-005)

- **Decision**: Render `<datalist id="options">…</datalist>` inside `sk-form-input`'s own shadow
  root (sibling to the `<input>`), and bind the input's `list="options"` attribute to it.
- **Rationale**: `<input list="x">` resolves the reference `x` in the **input's own tree**
  (MDN, "Reflected attributes § Reflected element references" — already cited in ADR-9 as the
  authority for why `aria-labelledby` cannot cross a shadow boundary; the same resolution rule
  governs `list`). The input lives in the shadow root under Arrangement B (ADR-9 §4), so a
  consumer's light-DOM `<datalist>` — slotted or not — is in a DIFFERENT tree and cannot be
  referenced. This is not a new argument invented for this mission; it is ADR-9's containment
  argument for `label`/`aria-describedby`, applied to a third attribute-reference pair.
- **Alternatives considered**: A slotted `<datalist>` (rejected by the ADR-9 argument itself — a
  `<slot>` does not change which tree an element's `getRootNode()` returns, so `list` still could
  not resolve it); duplicating the consumer's light-DOM datalist into the shadow root via a
  `MutationObserver`/slot-change sync (rejected as unrequested complexity C-001/C-002 already rule
  out — the element owns the option MODEL as data, not a markup mirror).

## R4 — React `ssrSafe` delivery for the option model (NFR-001, SC-006) — **field shape corrected post-squad**

- **Decision**: Declare `options` with `{ attribute: false }` in `static properties`, AND declare
  the class field itself with a **literal initializer**:
  `options: ReadonlyArray<{ value: string; label?: string }> = Object.freeze([]);` — **not** a
  `declare` field with the default assigned in the constructor. This is not stylistic: verified
  directly in `scripts/normalise-manifest.mjs`, `hasFrozenEmptyArrayInitializer(field)` reads
  `field.initializer` off the AST node — a `declare` field has **no initializer at all** (it is a
  type-only declaration), so a `declare options` + constructor-assigned default would silently
  fail to earn `x-spec-kitty-property-reset`, even though `propertyOnlyFields()`'s OTHER check
  (`{ attribute: false }` in `static properties`) would still pass. `sk-transition-matrix.ts`
  itself confirms the required shape by direct example —
  `columns: ReadonlyArray<TransitionColumn> = Object.freeze([]);` at line 130, a plain initialized
  field, not `declare`. The originally-planned shape (this document's earlier draft, and WP01's
  first-cut T004) used `declare options: …;` plus `this.options = Object.freeze([]);` in the
  constructor — which matches every OTHER property in this file's existing style, and is exactly
  why it is easy to get wrong: `options` needs to be the ONE exception to that convention.
  This earns the `x-spec-kitty-property-only: true` manifest marker, which routes the React
  generator's output through a `useProperties(ref, 'options', options, () => Object.freeze([]))`
  call — a direct JS property assignment in a `useEffect`, not a JSX prop that would become an
  attribute — plus (now that the initializer proves the reset intent) `x-spec-kitty-property-reset:
  'empty-array'`, which resets a removed prop to a FRESH frozen `[]` rather than retaining stale
  array identity.
- **Rationale — measured, not assumed, per NFR-001's own wording**: `sk-transition-matrix` (#149,
  closed) already shipped this exact mechanism for its `columns`/`routes` array properties, and
  `fixtures/react-consumer/src/sk-transition-matrix.test.tsx`'s `[SC-010]` test already proves it
  end-to-end — including delivery BEFORE the custom element is even defined (the harder case than
  a normal upgrade), survival across a re-render with a new array (identity-checked, not
  deep-equal), and a frozen-empty-array reset on removal. `packages/react/src/SkTransitionMatrix.js`
  was read directly and confirms the generated code shape:
  `useProperties(ref, "columns", columns, () => Object.freeze([]))`, with `columns`/`routes`
  excluded from the plain `createElement` attribute props. This mission adapts that same shape for
  `options` rather than re-deriving a new mechanism, and epic #183 explicitly asks whichever of
  #180/#179 resolves this boundary first to record the answer for #147–#149 — #149 already
  recorded a working answer for one of the two required future readers; this mission's job is to
  confirm the SAME answer applies to `sk-form-input` (a form-associated element, unlike
  `sk-transition-matrix`) and to write the parallel proof test, not to invent an alternative.
- **Alternatives considered**: Documenting `options` as attribute-only, JSON-serialized (e.g.
  `options='[{"value":"a"}]'`) — rejected: it would work under `ssrSafe` (attributes are strings)
  but forces every consumer, including plain HTML/no-build ones, to hand-author JSON in a markup
  attribute, and contradicts the array-property precedent this repo already chose for structured
  data (`sk-transition-matrix`, ADR-11's own citation of it). Documenting "assign `.options`
  imperatively after mount, SSR unsupported" as the enforced channel — considered as the fallback
  NFR-001 explicitly allows ("or the supported channel is documented and enforced"), but rejected
  as the PRIMARY answer because the property-only + `useProperties` mechanism already works and
  needs no documented workaround; it remains the fallback if the new fixture test finds a defect
  the transition-matrix precedent did not hit (e.g. a difference from `sk-transition-matrix` not
  being form-associated).

## R5 — Shared vs. per-element forwarding code (FR-007, #122) — **premise corrected post-squad**

- **Decision (unchanged conclusion, corrected reasoning)**: Every new constraint-attribute
  property/field is declared per-element (`sk-form-input` only). No new shared mutation-anchored
  code moves into `form-control-base.ts` FOR THIS MISSION.
- **The premise this document originally gave was FALSE and is corrected here**: it is not true
  that "none apply to `<textarea>`." Per the HTML Standard, `readonly`, `autocomplete` and
  `inputmode` are all valid on `<textarea>` as well as `<input>` — only `pattern`, `min`, `max`,
  `step` and `list`/`datalist` are `<input>`-specific (a `<textarea>` has no numeric/pattern
  constraint model and no suggestion-list attribute). The ORIGINAL "no shared target" claim was
  wrong for three of the seven new surfaces.
- **Why the conclusion (don't share, this mission) still holds despite the corrected premise**:
  sharing `readonly`/`autocomplete`/`inputmode` in `form-control-base.ts` would make them surface
  as INHERITED manifest members on `sk-form-textarea` too (the analyzer includes inherited public
  members, the same mechanism `normalise-manifest.mjs` already accounts for with `state: true`
  fields declared on the base) — regardless of whether `sk-form-textarea.ts`'s own `render()`
  actually binds them to the `<textarea>`. Two consequences, both real: (a) `sk-form-textarea`
  would gain attributes that do nothing (NFR-003's "no behaviour change to `sk-form-textarea`'s
  existing contract" would be violated the moment a consumer sets `readonly` on it and nothing
  happens); (b) `build-react-wrappers.mjs`'s `EXPECTED_NON_PROP_FIELDS` map is keyed per-tag with
  an EXACT, closed list (currently `{'sk-form-input': ['errorMessage'], 'sk-form-textarea':
  ['errorMessage']}`) — there is no mechanism to selectively suppress a shared, inherited property
  from ONE subclass's wrapper while keeping it on the other's, so `SkFormTextarea`'s generated
  React wrapper would gain a `readonly`/`autocomplete`/`inputmode` prop with no corresponding
  behaviour, silently. Actually wiring `sk-form-textarea.ts`'s `render()` to also bind these three
  is real, in-scope work for `<textarea>` that this mission's spec, tasks, and squad tier were
  never sized for — it is a SEPARATE, deliberate change to a component this mission's `owned_files`
  do not include.
- **Recorded for #122's future reader**: `readonly`, `autocomplete`, and `inputmode` are
  candidates for a FUTURE mission that extends both `sk-form-input` and `sk-form-textarea`
  together and can therefore land the shared base-class properties, both elements' `render()`
  bindings, and both elements' updated manifests/wrappers/`expected-docs.json` counts in one
  reviewed change — not as a byproduct of this mission reaching into `sk-form-textarea.ts`,
  which stays entirely outside this mission's `owned_files`.
- **Alternatives considered**: Moving `validate()`'s whole merge-and-flags body into the base with
  a subclass hook for "extra derived flags" — still rejected on #122's own measurement (a shared
  MUTATION ANCHOR reds 8/37 mutations as collateral, `suite-selftest.mjs` guard 5 refuses it).
  Sharing ONLY `readonly`/`autocomplete`/`inputmode` (the ones that genuinely apply to both
  elements) while leaving `pattern`/`min`/`max`/`step` per-element — considered and rejected for
  THIS mission specifically, for the `EXPECTED_NON_PROP_FIELDS`/manifest-drift reasons above; it
  is the right shape for the FUTURE mission that also touches `sk-form-textarea.ts`.

## R6 — Behaviour-id registry numbering — **REPLACED: the original finding was itself wrong**

- **What this document previously claimed (retracted)**: that `SC-016`–`SC-022` were unallocated
  and available for this mission's new mutation anchors. That claim was based on reading only
  `behaviours.json`'s own current id list and did not check the test that actually GATES it.
- **What is actually true, verified directly**: `tests/node/config-contract.test.ts`'s
  `'[registry] behaviours.json declares exactly ADR-11's applicable behaviours'` test hard-codes
  the FULL, CLOSED applicable set as a literal array — exactly `SC-002` through `SC-015` (14
  entries, one per ADR-11 required-behaviour category) — and asserts
  `[...declared].sort()).toEqual([...expected].sort())`, i.e. EXACT equality, not "contains" or
  "at least." A second test in the same file asserts the sole `applicable: false` entry is
  `SC-023`. **No new applicable id can be added to `behaviours.json` at all** — not `SC-016`, not
  any other unused number — without also editing this hard-coded array, and that file is not, and
  should not become, part of either WP's `owned_files` (it is the harness's own self-check, not a
  per-mission surface). `suite-selftest.mjs`'s own comment mentioning "SC-016 (generation
  determinism)" is a STALE leftover from before a prior renumbering (the CURRENT
  generation-determinism entry is `SC-023`, confirmed by reading `behaviours.json` directly) —
  itself a small example of exactly the id-drift this correction is about, and a reason not to
  trust a comment's stated id over the registry file's actual content.
- **Implication for tasks (corrected)**: every new mutation anchor this mission adds (the merged
  -validity/real-submit-block behaviour, the readonly submission/barring split, the post-reset
  arm, the datalist reachability check, the constraint-forwarding-to-inner-control check) must be
  registered as a NEW `arm` under an EXISTING `(id, subject)` pair already declared for
  `sk-form-input` — `mutations.json` already carries five: `SC-002` (FormData entry tracks the
  property), `SC-003` (validity message reaches the a11y tree), `SC-004` (reset restores the
  seeded value), `SC-005` (disabled excluded — two arms already), `SC-013` (parts present). The
  best-fitting reuse, subject to the implementer's own judgement and a check against
  `config-contract.test.ts`'s closed set before committing:
  - Merged UA flag blocking a real submit → **`SC-003`** (the category is literally "validity
    message reaches the a11y tree"; a UA-raised flag with a fallback message is the same category
    of fact, applied to a new source of the flag).
  - Readonly's split behaviour → **`SC-002`** for the "still submits" half (FormData category) and
    **`SC-003`** for the "barred, no message, host reports valid" half — one behaviour, two facets,
    two existing categories.
  - Post-reset validity correctness → **`SC-004`** (reset restores the seeded value is already
    this category; "and the restored value is not left invalid" is the same fact, one arm deeper).
  - Constraint-attribute forwarding reaching the inner control, and the datalist's node-identity
    reachability, do **not** map cleanly onto any of the 14 existing categories (they are not
    slot/parts/style-adoption/event/focus-keyboard/property-before-upgrade behaviours in ADR-11's
    sense). This mission does **not** invent a new id to cover them anyway (the closed-set gate
    would reject it) — the implementer must pick the least-wrong existing `(id, subject)` fit
    (candidates: `SC-013`, since it is the "styling API/targetable node" category and a
    `<datalist>` referenced by `list` is the closest analog to a targetable `::part()`), record
    the chosen mapping explicitly in that arm's description, and flag it to the pre-merge squad
    as a judgement call rather than a settled fact — unlike the other three mappings above, which
    are confident fits.

## R7 — The no-build static markup lives elsewhere, and this mission does not edit it (FR-008) — **new, post-squad**

- **Finding, verified directly**: `packages/elements/src/form-input/` has no `.markup.ts`
  companion module, and `packages/styles/src/form-input/` contains exactly one file —
  `sk-form-input.css` — no `.html`. `scripts/build-element-markup.mjs` (the generator T012
  originally targeted) globs element-backed components' `.markup.ts` files; `sk-form-input` has
  none, so running it `--check` is **vacuously green** for this element — it verifies nothing
  about `sk-form-input` specifically, regardless of what this mission does.
- **Where the real static markup actually lives**: `packages/styles/src/form-field/`, as five
  hand-authored files — `sk-form-input-default.html`, `-disabled.html`, `-error.html`,
  `-filled.html`, `-focus.html` — feeding a GENERATED barrel (`index.ts`, via
  `scripts/build-styles-only-markup.mjs`) per ADR-10 §3's "form-field" section (C-004: `form-field`
  is deliberately styles-only). These `.html` files are hand-authored SOURCE, not generated from
  the element template — ADR-10 records that history directly ("The barrel was hand-written
  beside the `.html` files... `scripts/build-styles-only-markup.mjs` now generates the barrel from
  the `.html` files").
- **Decision**: this mission does **not** edit `packages/styles/src/form-field/sk-form-input-*.html`.
  They are hand-authored, they live in a directory this mission's `owned_files` do not (and, per
  C-004's fencing of `form-field` as another mission's/#141's/#172's/#173's settled territory,
  should not casually) include, and adding parity for `readonly`/`pattern`/`list`+`<datalist>`
  there is a deliberate, reviewable content change to a frozen static form — not a mechanical
  regeneration this mission's generators can produce. FR-008 is discharged as a DOCUMENTED
  LIMITATION: the no-build static-markup consumer does not gain the new constraint attributes or
  the datalist in this mission. The stated workaround is real, not hand-waved: every one of these
  attributes (`pattern`, `min`, `max`, `step`, `readonly`, `list`+`<datalist>`) is plain HTML with
  zero framework involvement, so a consumer copying the static form by hand can add them directly,
  the same way they would add any other native HTML attribute to a form they already maintain by
  hand.
- **Open item for whoever runs this WP**: if the operator wants parity in the static form instead
  of a documented gap, that is a scope decision for a human, filed the same way #173 was filed for
  the deferred `.sk-input`/`.sk-textarea` rename — named, owned, and separate — not absorbed here
  silently. This document does not decide that; it records that the question exists and that the
  DEFAULT (absent an explicit operator instruction) is: do not touch `form-field`'s directory.

## R8 — Two more drift-gated artifacts this mission's manifest change touches (SC-007) — **new, post-squad**

- **`packages/elements/vue.d.ts`**: generated by `scripts/build-vue-types.mjs` (checked in CI via
  `--check`, `ci-quality.yml:218`) directly from `custom-elements.json` — the SAME manifest this
  mission's new attributes/property land in. It already has an `sk-form-input` entry (verified:
  `packages/elements/vue.d.ts:114`). No Vue-specific decision is needed — Vue appears nowhere in
  this mission's design — but the file WILL go stale the moment the manifest changes, and CI gates
  it, so it must be regenerated and diffed as a mechanical step.
- **`expected-docs.json`**: the anti-vacuity ratchet `check-manifest-content.mjs` compares by EXACT
  count, per element AND as a global total (verified directly, current committed values):
  `sk-form-input` is `{"attributes": 9, "properties": 0, "methods": 5}`, and the file's `total` is
  `65`. This mission's additions — seven new attributes (`pattern`, `min`, `max`, `step`,
  `inputmode`, `autocomplete`, `readonly`) and one new property-only field (`options`) — must move
  `sk-form-input`'s entry to `{"attributes": 16, "properties": 1, "methods": 5}` and the file's
  `total` to `73` (65 + 7 + 1). This is a hand-edit of a committed ratchet file (unlike
  `vue.d.ts`/the manifest/the React wrapper, which regenerate from a script) — get the arithmetic
  right in the same commit that changes the counts, and say why in the commit message, per the
  file's own stated contract ("If a count changes, change it here and say why").
- **Neither artifact was in either WP's `owned_files`** as originally planned; both are added to
  WP02 below.
- **Checked and found NOT to need an edit**: `expected-stories.json`, a SHRINK-ONLY ratchet
  (`scripts/run-axe-storybook.js` fails only when a LISTED story id is absent from the build).
  `sk-form-input`'s current entry lists five story ids; WP01's new constraint/readonly/datalist
  story arms are ADDITIONS, and adding an unlisted story is free under this gate — only REMOVING
  a listed one requires editing this file. No new WP02 subtask is needed for it.

## Adversarial evidence disposition

No dependency was added, upgraded, or removed by this plan (Technical Context: no new npm
dependency). The mandatory adversarial-evidence pass for security-impacting dependency decisions
(directive 051 / `supply-chain-install-safety`) is therefore not triggered; recorded here as an
explicit "not applicable" rather than silence.
