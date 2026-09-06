# Implementation Plan: form-input-constraints-and-datalist

**Branch**: `mission/form-input-constraints-and-datalist` | **Date**: 2026-09-05 | **Spec**: `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/spec.md`
**Input**: Feature specification from `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/spec.md`

**Note**: This template is filled in by the `/spec-kitty.plan` command. See `packs/built-in/missions/mission-steps/software-dev/plan/prompt.md` for the execution workflow.

**Post-tasks squad BLOCK, folded in (this revision).** A four-lens squad ran after `tasks` and
returned BLOCK with two CRITICAL, several HIGH/MAJOR, and a few MEDIUM/LOW findings — mostly
genuine engine measurements the coordinator reproduced (a `willUpdate`/render-timing bug in the
merge, `setValidity(flags, '')` throwing, a reversed `readonly` reflection decision), plus several
mechanical facts this plan got wrong by not checking the actual gating test/generator code closely
enough (a closed, hard-coded behaviour-id set; a field-initializer requirement for the
`x-spec-kitty-property-reset` marker; nonexistent files named in the original T012/contract; two
drift-gated artifacts — `vue.d.ts`, `expected-docs.json` — this plan never touched). Every section
below marked **post-squad** or **revised** reflects a fold-in verified directly against this
checkout, not merely copied from the squad's report. See `research.md`'s own header for the same
note in more mechanical detail.

## Summary

`sk-form-input` forwards seven native constraint/hinting attributes it currently drops
(`pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete`, `readonly`), merges the inner
`<input>`'s own `ValidityState` flags into `validate()` instead of replacing them, implements the
platform's actual `readonly` semantics (submitted, barred from constraint validation — not the
issue's stated contract), and renders a `<datalist>` into its own shadow root for a supplied
option model, wiring the inner input's `list` at that shadow-root id. No `sk-combobox` is built
(epic #183 binding).

**Revised post-squad, three points**: (1) the merge reads the inner control's validity ONLY after
syncing the control's own DOM state to the current update's values — `willUpdate` runs before
`render()` commits bindings, so an unsynced read sees the previous render (IC-02); the merged flag
set also drops `tooLong`/`tooShort` (unreachable — nothing forwards `maxlength`/`minlength`) and
adds `badInput` (reachable today via `type="number"`), and a fallback message is authored per flag
because `setValidity(flags, '')` throws when a flag is true and message is empty. (2) `readonly` is
**not** reflected to the host attribute — reflecting it lets the UA bar constraint validation on
the attribute alone, which would make this element's own barring branch an unobservable, near-dead
mutation anchor; this mirrors the `disabled` precedent exactly (IC-03). (3) `options`' field
declaration needs a literal initializer (`= Object.freeze([])`), not a `declare` field with a
constructor default, or the manifest's `x-spec-kitty-property-reset` marker never lands (IC-04/06).

No shared code moves into `form-control-base.ts` for this mission's new surface (IC-07) — corrected
premise, post-squad: `readonly`/`autocomplete`/`inputmode` DO apply to `<textarea>` (only
`pattern`/`min`/`max`/`step`/`list` are `<input>`-only), but sharing them now would surface as
unused inherited manifest members on `sk-form-textarea` and break `EXPECTED_NON_PROP_FIELDS`'
per-tag exact-list assertion in `build-react-wrappers.mjs`; filed as a future-mission candidate on
#122 instead. The four existing per-element mutation anchors (`syncFormValue`, `formResetCallback`,
`formDisabledCallback`, `validate()`) stay duplicated in `sk-form-input.ts` and
`sk-form-textarea.ts` — `form-control-base.ts`'s own header comment and #122 both record that a
shared mutation anchor reds 8/37 mutations as collateral, which `suite-selftest.mjs` guard 5
rejects. The React `ssrSafe` question for the option model is answered by replicating the
`attribute:false` + `x-spec-kitty-property-only` + `x-spec-kitty-property-reset:empty-array`
pattern `sk-transition-matrix` (#149) already shipped and proved in
`fixtures/react-consumer/src/sk-transition-matrix.test.tsx` — not re-derived from first
principles — with a parallel `fixtures/react-consumer` test for `sk-form-input`'s option model.
New mutation anchors are registered as new `arm`s under EXISTING `(id, subject)` pairs already
declared for `sk-form-input` — `config-contract.test.ts` hard-codes the applicable behaviour-id set
as exactly `SC-002`–`SC-015`, closed, so no new id may be minted (research.md R6, corrected
post-squad). The no-build static markup for this element lives in
`packages/styles/src/form-field/sk-form-input-*.html`, not in a `packages/styles/src/form-input/`
`.html`/`.markup.ts` that does not exist; this mission documents the parity gap there rather than
editing another component's owned files (research.md R7). Two more manifest-derived, drift-gated
artifacts this mission's change touches — `packages/elements/vue.d.ts` and `expected-docs.json` —
are regenerated/updated in WP02 (research.md R8).

## Technical Context

**Language/Version**: TypeScript (strict), targeting the existing `packages/elements` toolchain (Lit 3.x custom elements, ES2022 output). No new language or runtime.
**Primary Dependencies**: `lit` (existing), `@spec-kitty/tokens` (existing, no new tokens needed — no visual change beyond what NFR-002/#176 already governs). No new npm dependency. `scripts/build-react-wrappers.mjs`, `scripts/normalise-manifest.mjs`, `scripts/build-elements-css.mjs`, `scripts/build-element-markup.mjs` (existing generators, re-run, not modified in mechanism — `sk-form-input`'s manifest entry changes shape, which is exactly what they exist to regenerate).
**Storage**: N/A — presentational/behavioural custom element, no persistence.
**Testing**: Vitest browser mode (Playwright/Chromium provider) in `fixtures/elements-behaviour/src/sk-form-input.test.ts` for every new behaviour id (ADR-11 required-behaviours #1, form association, extended); Vitest browser mode in `fixtures/react-consumer/src/` for the NFR-001 ssrSafe measurement; Playwright axe + visual baselines in `apps/storybook` for the new/changed stories; `tests/node/config-contract.test.ts` and `check-manifest-content.mjs` for manifest/wrapper drift (Node lane).
**Target Platform**: Chromium (primary CI engine per ADR-11); the `readonly`/constraint-validation table in spec.md was measured in Chromium and is being implemented to platform spec (HTML Standard §4.10.5.1 "barred from constraint validation"), which Firefox and Safari also implement — no engine-specific branching needed.
**Project Type**: Single package feature inside an existing monorepo (`packages/elements`, `packages/react` generated, `packages/styles` generated markup) — not a new project.
**Performance Goals**: None beyond the charter's existing per-component size and Storybook-CI-time budgets; this mission adds attributes and one `<datalist>` render branch, not a new runtime cost class.
**Constraints**: C-001..C-005 in spec.md (no combobox/listbox/popup/masking/pickers; `sk-button` untouched; `sk-form-field` stays styles-only; `LightMode` via `class="sk-light"`). Arrangement B (ADR-9 §4) and the `disabled` non-reflection decision (ADR-9/FR-004) are both frozen — nothing here reopens either.
**Scale/Scope**: One element (`sk-form-input`), one shared base file (`form-control-base.ts`), their generated artifacts (manifest, React wrapper, styles-only markup+barrel), and their test/story files. No other element's public contract changes.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Languages/Frameworks** — satisfied: TypeScript/Lit, no new framework.
- **Testing** — satisfied by design: every new behaviour gets a Vitest browser-mode test with a
  mutation anchor (ADR-11 required-behaviour #1), not a render-only assertion. SC-002's own text
  requires asserting against a real form submit rather than a `validity` read — this plan follows
  that literally (see `fixtures/elements-behaviour/src/sk-form-input.test.ts`'s existing
  `[SC-002]` test at mount-and-submit for the pattern to extend).
- **Quality Gates / axe** — a `<datalist>` in the shadow root is itself inert to accessibility
  (browsers expose it through the referencing `<input>`'s own semantics); no new violation class
  expected, but the existing form-input axe story must still pass with the new attributes present
  and absent.
- **Review Policy / squad tiering** — this mission is tier B per spec.md and the issue: squad
  after `tasks`, none after `plan`. This plan is therefore a solo-authored document that the squad
  reviews once, not iteratively — Charter Check re-evaluation after Phase 1 below records the
  design as it stands for that single pass.
- **CSS/tokens** — no `--sk-*` token addition or change. The datalist itself is UA-rendered chrome
  with no styling surface in Chromium; the element's own CSS file is unchanged in scope beyond
  what forwarding a `readonly`/invalid state already implies (existing `[aria-invalid]`/`:invalid`
  selectors already cover a `readonly` `barred-from-validation` control, since it never sets
  `aria-invalid="true"` in the first place — see FR-003/SC-003).
- **No violations requiring Complexity Tracking.**

Charter Check re-evaluated post-design (Phase 1): unchanged. Data model and contracts below
introduce no new charter-relevant surface (no new token, no new framework, no new external
dependency).

## Project Structure

### Documentation (this mission)

```
kitty-specs/form-input-constraints-and-datalist-01M1S94Y/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── sk-form-input.contract.md
└── tasks/                # Phase 2 (/spec-kitty.tasks) — not created by this command
```

### Source Code (repository root)

```
packages/elements/src/
├── form-control-base.ts                 # unchanged for this mission — see IC-07's corrected
│                                         #   premise: readonly/autocomplete/inputmode DO apply
│                                         #   to <textarea> too, but nothing moves here yet
├── form-input/
│   ├── sk-form-input.ts                 # + pattern/min/max/step/inputmode/autocomplete/readonly
│   │                                     #   properties; merged+sync'd validate(); datalist
│   │                                     #   render; readonly submission/validation split
│   │                                     #   (FR-003, NOT reflected — see IC-03)
│   ├── sk-form-input.css.js             # unchanged unless a defect surfaces (none expected)
│   └── sk-form-input.stories.ts         # + constraint / datalist / readonly story arms
├── form-textarea/
│   └── sk-form-textarea.ts              # NOT TOUCHED by this mission (owned_files excludes it)
packages/elements/custom-elements.json    # regenerated (new attributes/members on sk-form-input)
packages/react/src/SkFormInput.{js,d.ts} # regenerated (new props; option model via useProperties)
packages/elements/vue.d.ts                 # regenerated (sk-form-input entry grows; no Vue-specific
                                           #   decision needed — research.md R8)
expected-docs.json                        # HAND-UPDATED counts: sk-form-input 9→16 attrs, 0→1
                                           #   properties; file total 65→73 (research.md R8)
packages/styles/src/form-field/sk-form-input-*.html  # NOT edited — real static-markup home for
                                           #   this element (research.md R7); FR-008 discharged as
                                           #   a documented gap, not a regeneration
fixtures/elements-behaviour/src/sk-form-input.test.ts   # + new behaviour ids
fixtures/react-consumer/src/sk-form-input-options.test.tsx  # new — NFR-001/SC-006 measurement
apps/storybook/src/tests/                 # axe + visual arms for new stories, if new stories are added
mutations.json / behaviours.json          # + new ARMS under EXISTING (id, subject) pairs already
                                           #   declared for sk-form-input (SC-002/003/004/005/013)
                                           #   — config-contract.test.ts hard-codes the applicable
                                           #   set as exactly SC-002..SC-015, closed; NO new id may
                                           #   be minted (research.md R6, corrected post-squad)
```

**Structure Decision**: Extend `sk-form-input.ts` in place (no new element, per epic #183's binding
"no `sk-combobox`"). No shared code moves into `form-control-base.ts` for this mission (FR-007's
premise corrected — see IC-07); the four already-duplicated MUTATION ANCHOR methods stay
duplicated per #122's own finding, which this plan does not attempt to re-litigate. All build
artifacts (manifest, wrappers, `vue.d.ts`) are regenerated, never hand-edited, per ADR-10;
`expected-docs.json` is a hand-updated ratchet by design (it is not itself generated). The static
`form-field` directory is out of scope entirely — not edited, not regenerated.

## Implementation Concern Map

### IC-01 — Constraint-attribute forwarding

- **Purpose**: Add `pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete` as reactive,
  reflected-by-default-Lit-behaviour properties forwarded onto the inner `<input>`, each with its
  own published `/** */` doc comment (enforced by `check-manifest-content.mjs`).
- **Relevant requirements**: FR-001, SC-001, FR-007.
- **Affected surfaces**: `packages/elements/src/form-input/sk-form-input.ts` (`static properties`,
  field declarations, `render()`); `packages/elements/src/form-control-base.ts` only if a generic
  attribute-forwarding helper is written once and used by `sk-form-input`'s `render()` — the
  helper itself is unanchored, so it is a base-file candidate; the `render()` call site is not.
- **Sequencing/depends-on**: none — this can start immediately and is a precondition for IC-02
  (nothing to merge validity from until the attributes exist).
- **Risks**: `min`/`max`/`step` are meaningful only for numeric/date-like `type`s; forwarding them
  unconditionally is what the platform itself does (an `<input type="text" min="3">` simply
  ignores `min`), so no type-gating is needed — verified against the HTML Standard rather than
  assumed. `readonly` is intentionally **not** in this IC: FR-003's submission/validation split
  needs its own concern below, not a bare attribute passthrough.

### IC-02 — Merged validity (FR-002) — **substantially revised post-squad**

- **Purpose**: `validate()` must read the inner control's own `ValidityState` (via
  `control.validity`, the same `shadowRoot.querySelector('input')` reference the existing method
  already resolves for the focus anchor) and merge its `true` flags into the flags object already
  built from `required`/`customError`, rather than replacing them. The merged message must surface
  a UA-raised failure (e.g. `patternMismatch`) with a message, not just a flag.
- **Two CRITICAL defects the original IC-02 missed, both engine-measured**:
  1. **Read-before-write ordering.** `validate()` runs from `willUpdate()`, which fires BEFORE
     `render()` commits the current update's `.value=`/`pattern=`/etc. bindings to the live DOM.
     Reproduced end-to-end: mount `pattern="[a-z]+"`, then `el.value = '123'` — host reports
     valid, `form.requestSubmit()` succeeds, `FormData` carries `123`. Mount-time and user-typing
     paths are unaffected (the browser updates the live control's own DOM/validity synchronously
     on a real keystroke, before Lit's cycle runs at all), which is exactly why this looked green
     in Storybook and manual checks and only breaks programmatic assignment — precisely what the
     React wrapper (`useProperties`) and this mission's own recommended test-writing recipe
     (`el.value = 'x'; await el.updateComplete`) both do. **Fix, decided**: before reading
     `control.validity`, `validate()` imperatively syncs the control's own DOM properties
     (`value`, `type`, `pattern`, `min`, `max`, `step`) to the CURRENT reactive-property values.
     This keeps `validate()` inside `willUpdate()` — moving it to `updated()` instead was
     considered and rejected: it risks reproducing the file's OWN documented historical bug
     (a reactive-property write — `this.invalid`/`this.errorMessage` — made from `updated()`
     schedules a second update cycle, which is why validation was moved out of `updated()` in the
     first place). The `willUpdate` rationale block at `sk-form-input.ts:91-101` must be AMENDED
     to explain this new subtlety, not contradicted.
  2. **`setValidity(flags, '')` throws** when any flag is `true` and `message` is empty (measured,
     both engines). Consequence: `updateComplete` rejects, `updated()`/`syncFormValue()` never run,
     the field silently vanishes from `FormData`. A form-associated custom element has no
     UA-authored message to fall back on the way a plain `<input>`'s own `reportValidity()` bubble
     supplies for free. **Fix, decided**: a per-flag fallback message, assigned when `message` is
     still empty after the `required`/`customError` checks and at least one UA flag merged true.
  3. **Flag list corrected**: `badInput` ADDED (reachable today via `type="number"` with no new
     attribute — e.g. `12e` — and exactly the "looks fine, silently submits rejected data" case
     this concern exists to close); `tooLong`/`tooShort` DROPPED (unreachable — nothing forwards
     `maxlength`/`minlength`, so their mutation arms would be permanently inert).
  4. **`willUpdate`'s trigger set is missing `type`** while `typeMismatch` is in the merge list —
     add `changed.has('type')` alongside the constraint properties already added there.
  5. **The reset path (`formResetCallback`) shares this exact root cause** — `this.value =
     this.initialValue` goes through the same `willUpdate → validate()` path, so fix (1) resolves
     it for free, but it needs its OWN test (a different call site, same underlying defect).
- **Relevant requirements**: FR-002, SC-002, FR-004 (reset correctness — see item 5).
- **Affected surfaces**: `packages/elements/src/form-input/sk-form-input.ts` `validate()` and
  `willUpdate()` only. This is a NEW mutation anchor on an EXISTING anchored method — registered as
  a new ARM under the EXISTING `SC-003` `(id, subject)` pair for `sk-form-input` (research.md R6,
  corrected) — `config-contract.test.ts` closes the applicable id set, so no new id is minted.
- **Sequencing/depends-on**: IC-01 (nothing to merge validity from before `pattern` etc. exist).
- **Risks**: the exact one FR-002/SC-002 name — a merge that reads `control.validity` but is
  asserted only by reading `el.validity.patternMismatch` back would pass while the host still
  submits. SC-002 requires the test to submit a real `<form>` and assert the FormData/`submit`
  event outcome, not just read validity — and now ALSO requires asserting the message text reaches
  the `role="alert"` node, not merely that a flag is set (item 2 above), and requires an arm that
  changes a constraint attribute AFTER mount with `value` unchanged (item 1 above), since that is
  precisely the case a mount-time-only test would miss.

### IC-03 — `readonly`: submission yes, constraint validation no (FR-003) — **reflection decision reversed post-squad**

- **Purpose**: Implement the corrected contract from the spec/issue-comment: `readonly` value
  **is** still passed to `setFormValue()` (unlike `disabled`), and the control is **barred from
  constraint validation** — `internals.setValidity({})` regardless of what `required`/pattern/UA
  flags would otherwise say, mirroring the `disabled` early-return shape already in `validate()`
  but with the opposite `syncFormValue()` outcome.
- **The original IC-03 said `readonly` reflects to the host attribute; that was measurably wrong**
  (the squad's own correction to its own spec, not a plan defect the operator introduced): reflecting
  `readonly` on a form-associated custom element's HOST attribute makes the UA bar it from
  constraint validation on the attribute alone — measured directly, both engines:
  `willValidate === false`, `internals.checkValidity() === true`, still submits, with **no
  `setValidity` call needed from this element's own code at all**. That makes the element's own
  `readonly` branch an unobservable, near-dead mutation anchor once reflected — three of four
  assertions in the branch's test would still pass with the branch DELETED. This is the exact
  SC-005 collateral shape this repo already has a precedent for: `disabled` is deliberately **not**
  reflected, so the UA cannot pre-empt the element's own exclusion logic and that logic stays the
  sole, testable authority. **Decision, reversed: `readonly` does NOT reflect.** It stays a plain
  `{ type: Boolean }` property; the inner control is still driven via `?readonly=${this.readonly}`
  in `render()` (unchanged); the element's own `validate()` branch remains the sole authority for
  barring, and stays an observable mutation anchor.
- **Relevant requirements**: FR-003, SC-003, FR-004 (must not regress — `disabled` stays
  unreflected and excluded).
- **Affected surfaces**: `packages/elements/src/form-input/sk-form-input.ts`: a new `readonly`
  reactive property (`{ type: Boolean }`, **no** `reflect`), `validate()`'s early-return branch,
  `render()`'s `?readonly=` binding (unchanged from the original design). `syncFormValue()` is
  UNCHANGED — `readonly` never touches it; only `disabled` does.
- **Sequencing/depends-on**: independent of IC-01/IC-02 in code, but ordered after IC-02 in the
  task list because both touch `validate()`'s early-return shape and should not be written as
  concurrent edits to the same lines.
- **Risks**: the exact trap named in spec.md and the issue comment — reading
  `validity.patternMismatch` on a readonly control and acting on it (e.g. still setting the flag)
  reproduces the wrong contract even with the right prose understanding, because the flag
  genuinely computes true even though the platform lets the form through. The implementation must
  short-circuit BEFORE the merge in IC-02 touches a readonly control, the same way the existing
  `disabled` branch short-circuits before the rest of `validate()` runs. **New risk, post-squad**:
  because `readonly` is unreflected, the test asserting this behaviour must verify the ELEMENT's
  own branch actually runs (e.g. by temporarily removing it and confirming the test reds) — a
  reflected-attribute version of this test would have passed for the wrong reason (the UA doing
  the work instead of this element's code), which is exactly what was caught here.

### IC-04 — Shadow-root `<datalist>` (FR-005, FR-006) — **field-declaration shape corrected post-squad**

- **Purpose**: Render a `<datalist>` into `sk-form-input`'s own shadow root from a supplied option
  model, and set the inner `<input>`'s `list` attribute to that datalist's shadow-root-local id —
  reachable because `list` resolves in the input's own tree (its shadow root), matching ADR-9
  Arrangement B's containment argument for `label`/`aria-describedby`.
- **Relevant requirements**: FR-005, FR-006, SC-005.
- **Affected surfaces**: `packages/elements/src/form-input/sk-form-input.ts`: a new `options`
  field (array of `{ value: string; label?: string }`, `attribute: false` in `static properties` —
  see IC-06 for why), declared with a **literal field initializer**
  (`options: ReadonlyArray<{...}> = Object.freeze([]);`) — **not** a `declare` field with a
  constructor-assigned default, which is what every OTHER property in this file uses and is
  therefore the easy, wrong default to reach for here (research.md R4: `normalise-manifest.mjs`'s
  `hasFrozenEmptyArrayInitializer()` reads the field's AST initializer directly; a `declare` field
  has none). `render()` gains a conditional `<datalist id="…">` block and the input's `list=`
  binding, guarded with `this.options?.length` (not `.length` unguarded — a consumer assigning
  `undefined` must not throw).
- **Sequencing/depends-on**: independent of IC-01/02/03.
- **Risks**: the id must be **shadow-root-local** and does not need per-instance uniqueness beyond
  that root (each instance has its own shadow root, so a fixed literal id such as `"options"` is
  safe — unlike a light-DOM id, which would collide across instances on one page). SC-005 requires
  asserting **node identity** (`input.list === datalist`), not attribute-string equality, because a
  string match would pass even if `list` pointed at a same-named node in the WRONG root (or at
  nothing, silently, since `list` referencing a missing id is not an error). **New risk,
  post-squad**: getting the field-initializer form wrong is silent at the TypeScript level (both
  forms type-check identically) and only surfaces as a WP02 generator-output defect several steps
  later — verify the manifest's `x-spec-kitty-property-reset` marker directly (T009/T010) rather
  than assuming the declaration was right because it compiled.

### IC-05 — Rationale comments (FR-005's second half)

- **Purpose**: The containment reasoning for the datalist placement must be recorded as `//`
  maintainer comments beside the render code, not only in spec.md/plan.md, matching this file's
  existing convention (the ARRANGEMENT B block at the top of `sk-form-input.ts`) and FR-005's own
  explicit requirement that it be "recorded... not merely done."
- **Relevant requirements**: FR-005.
- **Affected surfaces**: `packages/elements/src/form-input/sk-form-input.ts` (comment only, no
  behaviour).
- **Sequencing/depends-on**: IC-04 (nothing to comment on rationale for until the code exists).
- **Risks**: none — this is a documentation discipline item, but it is listed as its own concern
  because #122's own history (ADR-10 §3's "form-field" section) shows this repo has previously
  shipped a decision without cross-referencing it and had a lens catch the drift later.

### IC-06 — React `ssrSafe` measurement for the option model (NFR-001, SC-006)

- **Purpose**: Prove, rather than assume, that `sk-form-input`'s new `options` property survives
  the React wrapper's `ssrSafe` first-render boundary — where a normal reactive property with an
  observed attribute would arrive as a STRING attribute (useless for an array), and a property
  with no observed attribute is simply dropped by `manifestForGeneration`'s rule 3 UNLESS it also
  carries `x-spec-kitty-property-only: true` (which routes it through the generator's
  `useProperties` hook instead of a JSX/attribute prop).
- **Relevant requirements**: NFR-001, SC-006. Also records the answer epic #183 asks #180/#179 to
  produce for #147–#149 — though #149 (`sk-transition-matrix`, closed) already shipped and PROVED
  this exact mechanism for its `columns`/`routes` array properties, with a
  `[SC-010]`-labelled test in `fixtures/react-consumer/src/sk-transition-matrix.test.tsx` that
  asserts delivery works even BEFORE the custom element is defined, and that a removed prop resets
  to a fresh, frozen empty array rather than retaining the old array's identity. This concern is
  "replicate and adapt an existing, working answer," not "solve an open question."
- **Affected surfaces**: `packages/elements/src/form-input/sk-form-input.ts` — `options` declared
  `{ attribute: false }` in `static properties`, in the exact literal shape
  `scripts/normalise-manifest.mjs`'s `propertyOnlyFields()` AST walk requires (a public, settable,
  non-readonly, non-static, non-`#private` field; a `ReadonlyArray<…>`-shaped normalized type, WITH
  A LITERAL FIELD INITIALIZER `= Object.freeze([])` — not a `declare` field with a
  constructor-assigned default — for the empty-array reset marker, matching `sk-transition-matrix`'s
  `columns`/`routes` EXACTLY, initializer included; see IC-04's field-declaration correction).
  `packages/react/src/SkFormInput.{js,d.ts}` — regenerated, not hand-edited: the generator should
  emit a `useProperties(ref, 'options', options, () => Object.freeze([]))` call, exactly as it does
  for `columns`/`routes`. `fixtures/react-consumer/src/sk-form-input-options.test.tsx` — new,
  structured like `sk-transition-matrix.test.tsx`'s `[SC-010]` test: assert the option array
  reaches the element BEFORE `customElements.define` runs, survives a re-render with a new array
  (identity-checked), and resets to a fresh frozen `[]` when the prop is removed.
- **Sequencing/depends-on**: IC-04 (the `options` property must exist before its React delivery can
  be measured). Independent of IC-01/02/03.
- **Risks**: if the mission instead documented-and-enforced a different channel (e.g. "consumers
  must set `.options` imperatively after mount, enforced by a runtime warning") that would also
  satisfy NFR-001's letter, but would contradict the already-shipped #149 precedent and force
  #147/#149's future readers to reconcile two different answers to the same question. This plan
  chooses replication over a fresh design for that reason, and file this explicitly as the
  decision the squad should scrutinize (no ADR states it outright; it is inferred from #149's
  shipped code and ADR-11's own citation of `sk-transition-matrix` taking arrays through `.prop`).

### IC-07 — Shared plumbing in `form-control-base.ts` (FR-007) — **premise corrected post-squad**

- **Purpose**: Move whatever forwarding logic is genuinely identical and UNANCHORED between
  `sk-form-input` and `sk-form-textarea` into the base class, per #122's finding and FR-007,
  without moving any of the four existing MUTATION ANCHORS (`syncFormValue`, `formResetCallback`,
  `formDisabledCallback`, `validate()`'s disabled branch and flag-merge), which #122 and
  `form-control-base.ts`'s own header comment establish must stay per-element.
- **The original IC-07 claimed "none of the seven apply to `<textarea>`" — that is FALSE.** Per the
  HTML Standard, `readonly`, `autocomplete`, and `inputmode` are valid on `<textarea>` as well as
  `<input>`; only `pattern`, `min`, `max`, `step`, and `list`/datalist are `<input>`-specific. The
  original WP01 guidance told the implementer to "confirm" this false claim rather than check it.
- **Why the conclusion (nothing moves, this mission) still holds despite the corrected premise**:
  sharing `readonly`/`autocomplete`/`inputmode` in `form-control-base.ts` would make them INHERITED
  manifest members on `sk-form-textarea` too, whether or not its `render()` actually binds them —
  the analyzer includes inherited public members (the same mechanism `normalise-manifest.mjs`
  already accounts for with base-declared `state: true` fields). Two real consequences: (a)
  `sk-form-textarea` would gain attributes that silently do nothing, violating NFR-003's "no
  behaviour change to `sk-form-textarea`'s existing contract" the moment a consumer sets one
  expecting an effect; (b) `build-react-wrappers.mjs`'s `EXPECTED_NON_PROP_FIELDS` map is an EXACT,
  closed, per-tag list (`{'sk-form-input': ['errorMessage'], 'sk-form-textarea': ['errorMessage']}`)
  with no mechanism to suppress a shared property from one subclass's wrapper while keeping it on
  the other's — `SkFormTextarea`'s generated React wrapper would silently gain a prop with no
  matching behaviour. Actually wiring `sk-form-textarea.ts`'s `render()` to bind these three is
  real, legitimate, in-scope work for `<textarea>` — but it is a DELIBERATE, reviewable change to a
  file entirely outside this mission's `owned_files`, sized for its own mission, not a byproduct.
- **Relevant requirements**: FR-007.
- **Affected surfaces**: `packages/elements/src/form-control-base.ts` — no change for THIS
  mission. `pattern`/`min`/`max`/`step`/`list` stay per-element because they are genuinely
  `<input>`-only; `readonly`/`autocomplete`/`inputmode` stay per-element too, DESPITE applying to
  `<textarea>` conceptually, for the manifest/wrapper reasons above.
- **Recorded for the future**: `readonly`/`autocomplete`/`inputmode` are candidates for a
  FUTURE mission (filed on #122) that deliberately extends BOTH `sk-form-input` and
  `sk-form-textarea` together, landing the shared base properties, both `render()` bindings, and
  both elements' manifest/wrapper/`expected-docs.json` updates in one reviewed change.
- **Sequencing/depends-on**: none; verified as a review pass, not a code change, for this mission.
  If the merged-validity plumbing (IC-02) turns out to have a genuinely shared, UNANCHORED helper
  shape worth extracting (e.g. "read a control's ValidityState flags into an object" — note
  `<textarea>`'s OWN mergeable flags would be `tooLong`/`typeMismatch`-N/A/`badInput`-N/A, a
  DIFFERENT set than `<input>`'s, since a textarea has no `type`/pattern/range concept — any shared
  helper must take the key list as a parameter, not assume `<input>`'s set), that is still a
  legitimate, narrow base-file addition, decided at WP01 implementation time against
  `mutations.json`, not assumed here.
- **Risks**: mis-classifying an anchored line as shared plumbing reproduces exactly the 8/37
  collateral failure #122 already measured. Any candidate for `form-control-base.ts` must be
  checked against `mutations.json` before it moves, and against `EXPECTED_NON_PROP_FIELDS`/the
  manifest's inherited-member behaviour before it is assumed harmless to `sk-form-textarea`.

### IC-08 — Generated artifacts and conformance (FR-008, SC-007) — **revised post-squad, targets corrected**

- **Purpose**: Regenerate `custom-elements.json`, `packages/react/src/SkFormInput.*`,
  `packages/elements/vue.d.ts`, and the size report; hand-update `expected-docs.json`'s counts;
  document (not regenerate — see below) the static/no-build gap; rebase on the current train
  before the final gate.
- **The original IC-08 named the wrong static-markup target.** `packages/elements/src/form-input/`
  has no `.markup.ts`, and `packages/styles/src/form-input/` holds only `sk-form-input.css` — no
  `.html` at all. `build-element-markup.mjs --check` verifies NOTHING about `sk-form-input`
  specifically (vacuously green over an empty set for this element). The real static markup is
  `packages/styles/src/form-field/sk-form-input-*.html` (research.md R7) — hand-authored, in
  `form-field`'s owned territory (C-004), and **not edited by this mission**. FR-008 is therefore
  discharged as a genuinely documented limitation (the static consumer does not gain the new
  attributes/datalist in this mission; every new attribute is plain HTML a hand-maintainer can add
  themselves), not as a regeneration step this mission's tooling can perform.
- **Two more drift-gated, manifest-derived artifacts this mission's change touches, previously
  missing from this plan entirely** (research.md R8): `packages/elements/vue.d.ts` (generated by
  `scripts/build-vue-types.mjs --check`, `ci-quality.yml:218` — already has an `sk-form-input`
  entry that will grow; no Vue-specific decision needed) and `expected-docs.json` (compared by
  EXACT count in `check-manifest-content.mjs` — `sk-form-input`'s current committed counts are
  `{"attributes": 9, "properties": 0, "methods": 5}`, file `total: 65`; this mission's seven new
  attributes and one new property-only field move these to `{"attributes": 16, "properties": 1,
  "methods": 5}` and `total: 73` — a HAND edit, since this file is a ratchet, not itself
  generated).
- **Relevant requirements**: FR-008, SC-007.
- **Affected surfaces**: `custom-elements.json`, `packages/react/src/SkFormInput.{js,d.ts}`,
  `packages/elements/vue.d.ts` (all regenerated, no hand-edits); `expected-docs.json` (hand-updated
  counts); `packages/elements/SIZES.md` (regenerated via `npx nx run elements:build && node
  scripts/measure-elements-sizes.mjs` — the build step is required first, or the report reads a
  stale `dist/`). `packages/styles/src/form-field/**` is explicitly OUT of scope.
- **SC-007's "conformance-matrix entry"**: `scripts/build-conformance-matrix.mjs` and
  `conformance-matrix.json` do not exist in this train snapshot (`dcf7af2`) — verified by direct
  filesystem check. The mechanism that DOES exist and gates today is `mutations.json`/
  `behaviours.json`'s closed, 14-category applicable set (research.md R6) — new arms under
  existing `(id, subject)` pairs, not a new file this concern would otherwise need to produce.
  Re-verify at implementation time in case the generator has landed on the train by then.
- **Sequencing/depends-on**: after IC-01–IC-06 (nothing new to generate before the source changes
  exist); done last per task, but re-run after EVERY source change during implementation to keep
  drift gates green incrementally rather than in one late pass.
- **Risks**: hand-editing `expected-docs.json` with the wrong arithmetic is a real, easy-to-miss
  mistake — recompute both the per-element and the file-total numbers from the ACTUAL diff (not
  from this plan's numbers, which could themselves go stale if IC-01's attribute count changes
  before implementation) before committing.

## Complexity Tracking

*No Charter Check violations require justification.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| — | — | — |
