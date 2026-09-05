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

## R2 — Merging validity flags without replacing them (FR-002) — **REVISED post-squad, then CORRECTED again by the pre-merge debugger lens (its prescribed fix mechanism was itself wrong)**

- **Decision (final, as shipped)**: `validate()` merges UA-computed validity flags from a
  **detached validation probe** (`#probe: HTMLInputElement`, created once, never rendered or
  connected to the DOM) for the five constraint flags, and from the REAL rendered control for
  `badInput` only — NOT, as both earlier drafts of this section said, by reading or syncing the
  rendered control for everything. `ElementInternals.setValidity` still REPLACES the host's
  reported validity wholesale (unchanged since the original draft).
- **History — three passes, two of them wrong, each caught by measurement**:
  1. *Original draft*: read `this.shadowRoot?.querySelector('input')?.validity` directly, no sync
     step, and merge every true flag into `setValidity`. Superseded by pass 2 below — it has the
     read-before-write timing bug pass 2 found.
  2. *Squad-fold revision*: found the timing bug for real (`willUpdate()` fires BEFORE `render()`
     commits the current update's bindings, so `control.validity` at read time still reflects the
     PREVIOUS render, not the one about to commit — reproduced end-to-end: mount with
     `pattern="[a-z]+"`, assign `el.value = '123'`, host reports valid and a real
     `form.requestSubmit()` succeeds with `123` in `FormData`), plus the `setValidity(flags, '')`
     throw-on-empty-message bug, plus the wrong merge set (`badInput` missing, `tooLong`/
     `tooShort` wrongly included), plus `type` missing from `willUpdate`'s trigger set. All four
     of those findings were CORRECT and are unchanged below. But this revision's prescribed FIX
     for the timing bug — "imperatively sync the control's own DOM state to the current
     reactive-property values before reading its validity" (`control.value = this.value`,
     `control.pattern = this.pattern ?? ''`, etc.) — was itself wrong, caught by the pre-merge
     debugger lens (pass 3): `?? ''` compiles an unset `pattern` to `^(?:)$` (which matches only
     the empty string, not "no pattern constraint"), and syncing the RENDERED control specifically
     cannot fix a field that mounts already-invalid, because the control does not exist during the
     very first `willUpdate` pass at all — there is nothing to sync onto yet.
  3. *Pre-merge debugger lens (what shipped)*: replaces "sync the rendered control" with a
     **detached validation probe** — a private `<input>` that is created once, never rendered, and
     needs no DOM connection — so constraint validity can be computed correctly regardless of
     render timing or mount-time state. Two further engine-measured defects were found and folded
     in during this same pass: a probe assignment-order bug (see below), and confirmation that
     `setValidity`'s throw-on-empty-message-with-a-true-flag (pass 2's finding) still applies and
     still needs the fallback-message fix.
- **The shipped mechanism** (see `data-model.md`'s "Validity-flag derivation" for the full
  pseudocode):
  1. `probe.type = this.type` THEN `probe.value = this.value` — order matters. The probe is
     long-lived (one instance, reused every call); assigning `value` before `type` validates the
     NEW value against the STALE type until the next call self-corrects (measured: `number`→`text`
     + `'123'`→`'abc'` + `pattern="\d+"` reported host-valid for one entire update pass).
  2. `pattern`/`min`/`max`/`step` are set-or-removed on the probe from the CURRENT reactive
     property values (`null` and `undefined` both mean "removed" — see `data-model.md`'s property
     table note on Lit's `null`-on-attribute-removal behaviour — never `?? ''`).
  3. `patternMismatch`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `typeMismatch` merge
     from the PROBE. `badInput` merges separately, from the REAL rendered control — it is set ONLY
     by genuine user keystrokes, never by a property assignment (measured on a bare native
     `<input>`: assigning `.value` directly, even with a dispatched `input` event, never sets
     `badInput`), so the probe (which only ever receives property assignments) can never observe
     it; the real control, which is guaranteed to exist by the time a user could have typed into
     it, is the only correct source. `tooLong`/`tooShort` are dropped from the merge list — they
     require `maxlength`/`minlength`, which this mission does not forward, so their mutation arms
     would be permanently inert.
  4. `customError.trim() !== ''` gates the `customError` flag — a whitespace-only value is truthy
     as a string but renders as a blank, unreadable error (a debugger-pass finding, not present in
     either earlier draft).
  5. If any flag is true and `message` is still empty, a per-flag fallback message is assigned
     before `setValidity` is called, preventing the throw pass 2 found (`setValidity(flags, '')`
     rejects when any flag is true — `updated()`, and therefore `syncFormValue()`, never runs, and
     the field silently disappears from `FormData` with no error surfaced). The behaviour test
     asserts the text reaches the `role="alert"` node, not merely that the flag is set.
  6. `willUpdate()`'s trigger condition includes `type` (pass 2's finding: `typeMismatch` is in
     the merge list, but nothing re-ran `validate()` when `type` alone changed) and, found by the
     debugger lens in the same pass as the probe fix, `label` (it feeds the required-empty
     MESSAGE text but was absent from the trigger set — changing `label` on an already-invalid
     field left the error node showing the OLD label).
  7. The reset path (`formResetCallback`) needs no separate code change — `this.value =
     this.initialValue` is a plain reactive-property write that goes through the same
     `willUpdate()` → `validate()` path, and the probe-sync step fixes the reset case for free.
     It still needs its own DEDICATED test (a different call site, same underlying defect) — its
     mutation anchor sits under the merge arms' id, not a separate one (see R6).
  8. `#onInput` does not always write `this.value`: while the real control's `validity.badInput`
     is true, its sanitized `.value` must NOT be copied into `this.value` — doing so would let the
     next render's `.value=` binding commit the sanitized value back onto the SAME control the
     user is still editing, destroying the UA's own in-progress edit buffer (measured: a
     `type="date"` field mid-edit resolved to a fabricated wrong date instead of what was actually
     typed). `validate()` is called directly from the input handler in that branch instead.
- **Rationale for reading TWO sources (probe for five flags, the real control for `badInput`)**:
  constraint validation for pattern/range/step/type is a pure attribute+value computation with no
  render dependency, so a detached probe (synced fresh every call) is both correct and immune to
  mount-time/render-timing races. `badInput` is the opposite case — it exists only as the UA's own
  record of genuine keystrokes into a specific widget, which a probe (property-assignment-only)
  can never produce.
- **`valueMissing` is not pulled from either source** — it stays element-derived (`required &&
  value === ''`), unchanged since the original draft.
- **Alternatives considered and rejected**: (a) re-deriving each constraint's validity in the
  element itself (parsing `pattern` as a regex, comparing `min`/`max` numerically) — needless
  reimplementation of what the UA already computes correctly, and a second source of truth that
  could disagree with the UA's own judgement (original draft's finding, still holds). (b) moving
  `validate()`'s UA-merge half into `updated()` so the rendered control is naturally current with
  no sync step needed — this was considered during the squad-fold revision and would have worked
  for the timing bug in isolation, but risks reproducing this file's own documented historical bug
  for any reactive-property write `validate()` makes (`this.invalid`, `this.errorMessage`), and
  would leave the `willUpdate` rationale block actively contradicted. The detached-probe fix keeps
  the single-pass invariant intact without this risk, and additionally solves the mount-time-
  invalid case that neither (a) nor (b) could.

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
  first-cut of the datalist subtask) used `declare options: …;` plus `this.options = Object.freeze([]);` in the
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
  - Post-reset validity correctness → **`SC-003`, corrected post-CI (originally sited at `SC-004`
    here, which was wrong)**. The mapping this document originally proposed — SC-004, on the
    reasoning "reset restores the seeded value is already this category" — read as a plausible
    fit but was never checked against the ANCHOR LINE the arm would actually mutate. That line
    (`this.#probe.value = this.value;`) is the same shared value-sync every SC-003 merge arm
    already depends on, not machinery specific to reset. CI caught the consequence directly:
    mutating it reddened three SC-003-tagged tests as uncounted collateral, and mutating the
    SC-003 merge for-loop reddened this arm's own precondition as collateral in the other
    direction — a mutation-harness id boundary drawn where the CODE draws none. Re-sited under
    SC-003 alongside its actual sibling arms; SC-004's own charter ("reset restores the seeded
    value") is fully discharged by the pre-existing `el.value` assertion already there, which
    this arm's `el.validity` assertion never touched.
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

## R9 — Value authority: raw vs. sanitized `this.value` on submission (FR-002, #180's comment thread) — **operator-ruled, not implementer-decided**

- **The fork, found by the pre-merge debugger lens and correctly NOT decided by the
  implementer**: `setFormValue(this.value)` submits whatever the consumer set on the property,
  even when the current `type` cannot represent it — e.g. `<sk-form-input type="date" name="when"
  value="2026-13-45" required>` submits the literal string `when=2026-13-45` in `FormData`, while
  the native platform table this mission's R1 already measured shows a bare `<input type="date">`
  either sanitizing the value away or reporting `badInput` and blocking. Before this ruling,
  neither this element's `validate()` nor its `FormData` entry treated that divergence as
  anything at all — a value the UA itself could never produce from user typing would still
  submit as if it were ordinary text.
- **Three options were put to the operator, via #180's comment thread**:
  1. **Detect and flag only** (chosen): keep submitting the raw `this.value` untouched — no
     change to `setFormValue`'s contract — but treat a non-empty value the current type cannot
     represent as the PROGRAMMATIC analogue of `badInput`, merging it into `validate()`'s flags
     and blocking submission with a message, exactly as genuine user-typed `badInput` already
     does.
  2. **Submit the sanitized value instead** (declined, not implemented): would change
     `setFormValue`'s contract from "whatever the consumer set" to "whatever the UA can parse
     from it" — a real behaviour change to a submission contract that predates this mission and
     that `sk-form-textarea` and #122's future shared-base work both depend on continuing to mean
     the same thing. Declined specifically because it changes something OUTSIDE this mission's
     already-drawn boundary (R5), not because it is wrong in the abstract.
  3. **Rebase `valueMissing` on the sanitized string** (declined, not implemented): would make an
     empty-but-unparseable value ALSO trigger `valueMissing` (today `valueMissing` is purely
     `required && this.value === ''`, unaffected by parseability) — declined for the same
     "changes a contract outside this mission's scope" reason as option 2, and left, like option
     2, as a deliberate LATER decision for whichever mission next has `sk-form-textarea` in scope
     to make alongside it, not something this mission's narrower fix should quietly fold in.
- **Decision (final, as shipped)**: option 1. In `validate()`, after the probe has been synced to
  the current `type`/`value`/pattern/min/max/step (the same probe R2 already established), the
  divergence test is `this.value !== '' && this.#probe.value === ''` — the probe already carries
  what the UA would make of the CURRENT property value under the CURRENT type, so an empty probe
  against a non-empty property means the UA sanitized the value away entirely. Merged as
  `flags.badInput = true`, sharing the SAME fallback message table entry (`badInput`: "Value
  could not be interpreted.") the real-control `badInput` merge (R2) already uses — no new
  fallback text needed, since it is the same flag.
- **Why this does not double-report against the real-control `badInput` branch (R2)**: while a
  user is actively typing an unparseable value, `#onInput` (R2's fix 8) deliberately does NOT
  write `this.value` — so during a live edit, `this.value` stays the last GOOD value, the probe
  (synced from that same stale-but-valid value) is non-empty, and this branch stays silent for
  exactly the window the real-control branch already covers. This branch only ever fires for the
  property-assignment path (mount-time or a direct `el.value = …`), which the real-control branch
  structurally cannot reach (nothing was ever typed).
- **Why this does not over-fire on types that merely reject rather than sanitize**: `type="email"`
  with an invalid address (e.g. `notanemail`) is NOT sanitized away by the UA — the raw text
  stays on the control and `typeMismatch` is reported instead, so the probe's `.value` stays
  non-empty and this branch's condition is false. `type="text"` never sanitizes at all. Proven by
  a dedicated negative test (`fixtures/elements-behaviour/src/sk-form-input.test.ts`), not merely
  asserted in prose.
- **Test arms added**: `type="date"` with `value="2026-13-45" required` and `type="number"` with
  `value="1,5"`, both asserting `validity.valid === false`, a real `form.requestSubmit()` blocked,
  and a non-empty message reaching the `role="alert"` node; plus the negative `type="email"` case
  above. All three reuse the existing `SC-003` id (R6's registry-numbering finding governs why no
  new id is minted) rather than being a separate mutation-anchored id.
- **What is NOT recorded as decided**: options 2 and 3 remain open, named, and explicitly deferred
  to whichever future mission puts `sk-form-textarea` back in scope alongside `sk-form-input` — 
  see R5's own "candidates for a FUTURE mission" language, which this ruling extends to cover the
  value-authority question too.

## Adversarial evidence disposition

No dependency was added, upgraded, or removed by this plan (Technical Context: no new npm
dependency). The mandatory adversarial-evidence pass for security-impacting dependency decisions
(directive 051 / `supply-chain-install-safety`) is therefore not triggered; recorded here as an
explicit "not applicable" rather than silence.
