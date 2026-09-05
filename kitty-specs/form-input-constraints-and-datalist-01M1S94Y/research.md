# Research: form-input-constraints-and-datalist

All items below were resolved by reading this repository's own code and prior mission history
(#74, #122, #149, #153, #176) rather than by external research — the questions are internal-design
questions, not technology-choice questions, and every one had a measured or coded answer already
sitting in the tree.

## R1 — `readonly` platform semantics (corrects the issue)

- **Decision**: Implement `readonly` as: reflected attribute on the inner control; value **is**
  passed to `setFormValue()`; `internals.setValidity({})` unconditionally (barred from constraint
  validation), independent of what `required`/pattern/UA flags would otherwise compute.
- **Rationale**: Measured in Chromium (recorded in spec.md's table and the operator's #180 issue
  comment): `willValidate === false` for a readonly control, and an empty `required` readonly
  field reports `validity.valid === true`. Validity *flags* still compute underneath (a
  `patternMismatch`-triggering value in a readonly field still reports `patternMismatch: true` if
  read directly), which is the trap: acting on that flag would block a form the platform lets
  through. This is HTML Standard behaviour ("barred from constraint validation" applies to
  disabled, readonly, and datalist-option controls alike), not a Chromium-specific quirk, so no
  cross-browser branching is needed.
- **Alternatives considered**: Implementing the issue's literal sentence ("readonly is
  constraint-validated") — rejected because it is measurably false and would make the element
  reject submissions the platform accepts, the exact "vetoes its own form" failure spec.md names.

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

## R4 — React `ssrSafe` delivery for the option model (NFR-001, SC-006)

- **Decision**: Declare `options` with `{ attribute: false }` in `static properties`, in the exact
  literal shape `scripts/normalise-manifest.mjs`'s `propertyOnlyFields()` walk requires (a public,
  settable, non-readonly/static/private field on the tagged class itself). This earns the
  `x-spec-kitty-property-only: true` manifest marker, which routes the React generator's output
  through a `useProperties(ref, 'options', options, () => Object.freeze([]))` call — a direct JS
  property assignment in a `useEffect`, not a JSX prop that would become an attribute — plus (if
  the normalized type is `ReadonlyArray<…>`-shaped) `x-spec-kitty-property-reset: 'empty-array'`,
  which resets a removed prop to a FRESH frozen `[]` rather than retaining stale array identity.
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

## R5 — Shared vs. per-element forwarding code (FR-007, #122)

- **Decision**: Constraint-attribute properties/fields are declared per-element (`sk-form-input`
  only — none apply to `<textarea>`). No new shared mutation-anchored code moves into
  `form-control-base.ts`. Only a genuinely unanchored helper (if one emerges while writing IC-02,
  e.g. reading a control's own UA-raised flags into a plain object) is a candidate for the base
  file, decided at task-writing time.
- **Rationale**: #122 measured that a shared MUTATION ANCHOR reds 8 of 37 mutations as collateral
  (both elements' tests failing for one injected fault), which `suite-selftest.mjs` guard 5
  rejects, against 37/37 clean with per-element anchors. `form-control-base.ts`'s own header
  comment states this as settled doctrine ("Only UNANCHORED plumbing... A shared anchor reds both
  elements' `[SC-00x]` tests at once"). FR-007 is satisfied by NOT reproducing
  mission-specific-but-textarea-irrelevant code into `sk-form-textarea.ts` — which nothing in this
  mission's design does, since none of the seven new attributes are textarea-shaped — rather than
  by inventing a new shared surface where none is needed.
- **Alternatives considered**: Moving `validate()`'s whole merge-and-flags body into the base with
  a subclass hook for "extra derived flags" — rejected on the #122 measurement above; it would
  reintroduce exactly the collateral-mutation failure that finding already closed off.

## R6 — Behaviour-id registry numbering (mechanical note, not a design decision)

- **Finding**: `mutations.json`/`behaviours.json` already carry `SC-002`, `SC-003`, `SC-004`,
  `SC-005`, and `SC-013` for `sk-form-input`, meaning ADR-11's generic "form association"/"parts"
  arms as they apply to THIS element specifically (FormData entry tracks the property; validity
  message reaches a11y tree; reset restores; disabled excludes; parts present). The registry's
  highest allocated id is `SC-023` (a CI-gate-only, `applicable:false` entry for generation
  determinism); `SC-016`–`SC-022` are unallocated.
- **Implication for tasks**: spec.md's own `SC-001`–`SC-007` labels are mission-local prose
  identifiers and are NOT the same id space as this registry — `spec.md`'s "SC-002" (a swallowed
  `patternMismatch` red) is a different behaviour than the registry's existing `sk-form-input`
  `SC-002` (FormData entry tracks the property). New mutation anchors this mission adds (the
  merged-validity line, the readonly `setValidity({})` branch, the datalist node-identity check)
  must be registered under FRESH ids from the unallocated range, never by reusing spec.md's
  SC-00x numbers verbatim. This is flagged for whoever writes `tasks.md`/finalizes work packages,
  since finalize-tasks-adjacent tooling elsewhere in this repo's history (issue-matrix-scrapes-pr-
  refs, epic-387-checklist-is-stale) shows numbering confusion of exactly this shape has bitten
  this programme before.

## Adversarial evidence disposition

No dependency was added, upgraded, or removed by this plan (Technical Context: no new npm
dependency). The mandatory adversarial-evidence pass for security-impacting dependency decisions
(directive 051 / `supply-chain-install-safety`) is therefore not triggered; recorded here as an
explicit "not applicable" rather than silence.
