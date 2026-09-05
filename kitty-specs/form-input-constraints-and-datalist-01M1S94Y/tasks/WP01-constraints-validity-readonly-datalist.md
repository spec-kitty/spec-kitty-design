---
work_package_id: WP01
title: 'Element source: constraints, merged validity, readonly, datalist'
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
planning_base_branch: mission/form-input-constraints-and-datalist
merge_target_branch: mission/form-input-constraints-and-datalist
branch_strategy: Planning artifacts for this mission were generated on mission/form-input-constraints-and-datalist. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/form-input-constraints-and-datalist unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
phase: Phase 1 - Core element behaviour
history:
- at: '2026-09-05T18:37:18Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: packages/elements/src/form-input/
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/form-input/sk-form-input.ts
- packages/elements/src/form-input/sk-form-input.stories.ts
- packages/elements/src/form-control-base.ts
- fixtures/elements-behaviour/src/sk-form-input.test.ts
- mutations.json
- behaviours.json
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Element source: constraints, merged validity, readonly, datalist

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or
any user-defined profile), and behave according to its guidance before parsing the rest of this
prompt.

- **Profile**: `{{agent_profile}}` — if empty, run `spec-kitty agent profile list` and pick the
  best match for `task_type: implement` over `packages/elements/src/form-input/`.
- **Role**: `implementer`
- **Agent/tool**: `{{agent}}`

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<div>`, `<script>`. Use language identifiers in code blocks.

---

## Objectives & Success Criteria

`sk-form-input` gains seven forwarded/native-constraint surfaces and a corrected `readonly`
contract, without regressing anything `fixtures/elements-behaviour/src/sk-form-input.test.ts`'s
existing `[SC-002]`..`[SC-005]`/`[SC-013]` tests already assert. Concretely, done means:

- `pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete` are reactive properties, reflected
  as attributes, forwarded to the inner `<input>`, each with its own published `/** */` doc
  comment (FR-001).
- `readonly` is a reactive, **reflected** property. A readonly control's value still reaches
  `setFormValue()`; the control is barred from constraint validation
  (`internals.setValidity({})`) regardless of `required`/pattern/UA flags (FR-003). `disabled`'s
  existing behaviour — unreflected, `setFormValue(null)`, excluded — is UNCHANGED (FR-004): this
  is a guard to verify, not new code to write.
- `validate()` merges the inner control's own `ValidityState`'s `true` flags
  (`patternMismatch`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `tooLong`, `tooShort`,
  `typeMismatch`) into the flags object it already builds from `required`/`customError`, rather
  than replacing them (FR-002).
- An `options: ReadonlyArray<{ value: string; label?: string }>` property (no attribute — see
  Subtask T004) drives a `<datalist>` rendered into the element's OWN shadow root, with the inner
  `<input>`'s `list` attribute resolving to it (FR-005). No filtering/sorting/fetching/inventing —
  the element renders exactly the given array (FR-006).
- Every new behaviour has a Vitest browser-mode test with a registered mutation anchor
  (`mutations.json`/`behaviours.json`), demonstrated red before green — not a render-only
  assertion (charter Testing policy, ADR-11 required-behaviour #1).
- `form-control-base.ts` gains ONLY genuinely shared, unanchored plumbing, if any is found while
  writing T003 — see FR-007's note in Subtask T003.

## Context & Constraints

Read, in this order, before writing any code:

1. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/spec.md` — the contract, especially
   the corrected `readonly` table and the FR-002 "trap" paragraph. **Do not rewrite this file.**
2. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/plan.md` — IC-01 through IC-05,
   IC-07. Read the Risks field of each; they name the exact ways a superficially-correct
   implementation still fails.
3. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/research.md` — R1 (readonly), R2
   (merge, not replace), R3 (datalist reachability), R5 (why no shared code moves for THIS
   mission's surface).
4. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/data-model.md` — the exact property
   table and the `validate()` pseudocode, including the `willUpdate()` trigger-condition extension
   this mission requires (do not miss this — it is easy to add the new properties and forget that
   changing `pattern` alone, with `value` unchanged, must still re-run `validate()`).
5. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md`
   — the rendered-DOM delta and the form-participation/validity delta tables.
6. `packages/elements/src/form-input/sk-form-input.ts` (current file, ~215 lines) — every edit in
   this WP is inside this file. Read `validate()` (~136-178), `render()` (~188-215),
   `willUpdate()`/`updated()`/`syncFormValue()`/`formResetCallback()` in full before touching any
   of them — they are existing MUTATION ANCHORS (see the `// MUTATION ANCHOR SC-0xx` comments)
   and must not be disturbed except exactly where this WP's own new anchors require.
2. `packages/elements/src/form-control-base.ts` — read the file header comment in full. It is
   maintainer doctrine, not filler: it explains, with a measured number (8 of 37 mutations), why a
   shared MUTATION ANCHOR is refused by `suite-selftest.mjs` guard 5. Do not move
   `syncFormValue`/`formResetCallback`/`formDisabledCallback`/`validate()`'s existing body into
   this file. The ONLY thing that may move here is a brand-new, UNANCHORED helper (see T003).
3. `packages/elements/src/form-textarea/sk-form-textarea.ts` — read it once, to confirm by direct
   comparison that none of `pattern`/`min`/`max`/`step`/`inputmode`/`autocomplete`/`readonly`/
   `list`/`options` apply to a `<textarea>` (FR-007's "no shared target" finding in
   `research.md` R5). Do not edit this file in this WP.
4. `fixtures/elements-behaviour/src/sk-form-input.test.ts` — read the existing `[SC-002]` test in
   full before writing T005-T007; it is the pattern every new test in this WP must follow (mount
   helper, `control()` accessor, real `<form>` + `FormData`/`ElementInternals.setFormValue` spy
   witnesses — never a bare `validity` read standing in for a submit).
5. `docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md` (ADR-9) §4 — the
   containment argument this mission's datalist placement extends. Do not re-litigate Arrangement
   B; it is settled.
6. `packages/elements/src/transition-matrix/sk-transition-matrix.ts` (`static properties`, lines
   ~119-131) — the EXACT shape a property must have to earn the manifest's
   `x-spec-kitty-property-only`/`x-spec-kitty-property-reset` markers (`attribute: false`, a
   `ReadonlyArray<…>`-normalized type, a constructor default of `Object.freeze([])`). `options`
   (T004) must match this shape literally — WP02 depends on it.

**Constraints this WP must not violate** (spec.md C-001..C-005, plan.md Technical Context):
no combobox/listbox/popup/masking/date-time-picker; `sk-button` untouched (not in scope here at
all); `sk-form-field` stays styles-only (not touched); `LightMode` stories use `class="sk-light"`,
never `data-theme`; the `disabled` non-reflection decision and ADR-9 Arrangement B are frozen.

## Branch Strategy

- **Strategy**: Planning artifacts were generated on
  `mission/form-input-constraints-and-datalist`; completed changes must merge back into
  `mission/form-input-constraints-and-datalist`, which itself PRs into `train/elements-first` at
  mission close.
- **Planning base branch**: `mission/form-input-constraints-and-datalist`
- **Merge target branch**: `mission/form-input-constraints-and-datalist`

> These fields are populated automatically by `spec-kitty agent mission finalize-tasks`. Do not
> change them manually.

## Subtasks & Detailed Guidance

### Subtask T001 – Forward `pattern`/`min`/`max`/`step`/`inputmode`/`autocomplete`

- **Purpose**: Six of the seven new surfaces (FR-001). Plain string properties, reflected
  attributes, forwarded verbatim — the platform validates them; this element does not
  reinterpret them.
- **Steps**:
  1. In `static properties`, add: `pattern: { type: String, reflect: true }`, `min`, `max`,
     `step`, `inputmode`, `autocomplete` — same shape, all `{ type: String, reflect: true }`.
  2. Add a `declare` field with its own published `/** */` doc comment for each — one sentence
     naming what the attribute does and, where relevant, which input `type`s it is meaningful
     for (e.g. `min`/`max`/`step` on numeric/date-like types). `check-manifest-content.mjs`
     enforces every one of these has a doc comment; missing one fails CI, not just review.
  3. In `render()`, add the bindings to the `<input>`: `pattern=${this.pattern ?? nothing}`,
     `min=${this.min ?? nothing}`, `max=${this.max ?? nothing}`, `step=${this.step ?? nothing}`,
     `inputmode=${this.inputmode ?? nothing}`, `autocomplete=${this.autocomplete ?? nothing}`.
     Use Lit's `nothing` (import it from `lit` alongside `html`) rather than an empty string, so
     an unset property emits NO attribute at all rather than `pattern=""` — an empty `pattern=""`
     is itself a (trivial, always-matching) pattern and is not the same as "no pattern".
  4. Do NOT gate these bindings on `this.type` — the platform itself ignores `min`/`max`/`step`
     on a `type` they do not apply to (verified in research.md R1's sibling reasoning); adding
     element-side type-gating would be a second, possibly-wrong source of truth.
- **Files**: `packages/elements/src/form-input/sk-form-input.ts`.
- **Parallel?**: No — same file as every other subtask in this WP.
- **Notes**: This subtask does NOT touch `willUpdate()`'s `validate()`-triggering condition; T003
  extends that, once there is a UA flag worth re-checking on a change to one of these.

### Subtask T002 – `readonly`: reflected property, submission split, `validate()` early return

- **Purpose**: FR-003's corrected contract — the ONE place this mission actively contradicts the
  original issue text, and the place a reviewer will check first.
- **Steps**:
  1. Add `readonly: { type: Boolean, reflect: true }` to `static properties`, with a `declare`
     field and doc comment stating the corrected contract in one or two sentences (submitted,
     barred from constraint validation — link the behaviour, not the issue number, since doc
     comments are published API and #180 means nothing to a consumer).
  2. In the constructor, initialize `this.readonly = false`.
  3. In `render()`, add `?readonly=${this.readonly}` to the `<input>` binding list.
  4. In `syncFormValue()`, the existing line is
     `this.internals.setFormValue(this.disabled ? null : this.value);` — this is UNCHANGED.
     `readonly` does NOT affect this method at all; a readonly control submits exactly like an
     enabled, non-readonly one. Resist the urge to add a `readonly` branch here — there is none.
  5. In `validate()`, add a NEW early-return branch for `readonly`, modeled on the EXISTING
     `disabled` branch immediately above it:
     ```ts
     if (this.readonly) {
       // MUTATION ANCHOR SC-0xx (assign the real id at T008) — readonly is barred from
       // constraint validation but its value IS still submitted (syncFormValue, unchanged
       // above) — the one place this element's readonly and disabled paths diverge. See
       // spec.md FR-003 and the operator's #180 correction to the issue's stated contract:
       // the UA's own `willValidate === false` for a readonly control is what this mirrors.
       this.internals.setValidity({});
       this.invalid = false;
       this.errorMessage = '';
       return;
     }
     ```
     Place this branch AFTER the existing `disabled` branch (both are early returns, so order
     between them does not matter functionally, but keeping `disabled` first preserves the
     existing branch's line numbers for anyone diffing against history).
  6. Extend `willUpdate()`'s existing condition
     `if (changed.has('value') || changed.has('required') || changed.has('disabled')) this.validate();`
     to also fire on `readonly` and on every T001 property:
     `changed.has('readonly') || changed.has('pattern') || changed.has('min') || changed.has('max')
     || changed.has('step')`. (`inputmode`/`autocomplete` carry no validity semantics and do not
     need to trigger `validate()` — only add the ones that can change what `control.validity`
     reports.) Without this, toggling `readonly` after mount, or changing `pattern` without also
     changing `value`, would not re-run `validate()` until the next unrelated change — a real,
     user-visible staleness bug of exactly the shape the file's own `willUpdate` comment already
     warns about for `aria-invalid`.
- **Files**: `packages/elements/src/form-input/sk-form-input.ts`.
- **Parallel?**: No.
- **Notes**: This subtask and T003 both touch `validate()`'s body. Write T002's `readonly` branch
  FIRST (an early return, so it never reaches the merge code), then write T003's merge on top of
  what remains. Sequencing them the other way around risks writing the merge logic somewhere the
  `readonly` early return would make dead code.

### Subtask T003 – Merge the inner control's UA `ValidityState` flags

- **Purpose**: FR-002 — the actual defect this mission exists to fix. Without this, T001's
  forwarded `pattern`/`min`/`max`/`step` are cosmetic: the inner `<input>` becomes invalid but the
  host keeps reporting valid, because `ElementInternals.setValidity` REPLACES whatever this
  element passes it; nothing today reads the inner control's own validity at all.
- **Steps**:
  1. In `validate()`, after the existing `disabled` and (new, from T002) `readonly` early
     returns, and after `const control = this.shadowRoot?.querySelector('input') ?? undefined;`
     is resolved (it already is, for the focus-anchor argument — reuse the same reference, do not
     re-query), read `control?.validity`.
  2. Before building `message`, merge each of the following flags from `control.validity` into
     the local `flags` object IF true: `patternMismatch`, `rangeUnderflow`, `rangeOverflow`,
     `stepMismatch`, `tooLong`, `tooShort`, `typeMismatch`. Do NOT merge `valueMissing` from
     `control.validity` — that stays element-derived from `this.required && this.value === ''`
     exactly as today (see data-model.md's note on why: the inner control's own `required`
     attribute is never independently authoritative here).
     ```ts
     // MUTATION ANCHOR SC-0xx (assign the real id at T008) — the UA's OWN validity flags are
     // MERGED, not read-and-discarded. Without this, forwarding pattern/min/max/step (see the
     // constructor/render bindings above) makes the INNER <input> invalid while the HOST still
     // reports valid — ElementInternals.setValidity REPLACES whatever this element passes it,
     // and nothing else consults control.validity. A field that looks fine and silently submits
     // rejected data is exactly the failure this line exists to prevent (spec.md FR-002).
     if (control) {
       for (const key of [
         'patternMismatch', 'rangeUnderflow', 'rangeOverflow',
         'stepMismatch', 'tooLong', 'tooShort', 'typeMismatch',
       ] as const) {
         if (control.validity[key]) flags[key] = true;
       }
     }
     ```
  3. Message precedence is UNCHANGED from the existing pattern: `customError` still wins the
     *announced* message when both a UA flag and a custom error are true; a UA-raised flag with
     no `required`/`customError` present gets NO message assigned by this element's own code —
     `internals.setValidity(flags, message, control)` is still called with whatever `message`
     already is (possibly `''`). Confirm this against `reportValidity()`'s behaviour: the UA
     bubble (`reportValidity()`) shows its OWN message for a UA-raised flag when `message` is
     empty; do not invent element-authored text for a flag the platform already explains.
  4. **FR-007 check (do this before moving on)**: is the `for (const key of [...])` merge loop
     above the kind of "genuinely shared, unanchored plumbing" plan.md IC-07 asks about? Compare
     against `sk-form-textarea.ts`'s own control (`<textarea>`), whose `ValidityState` carries
     `tooLong`/`tooShort`/`valueMissing`/`customError` but never `patternMismatch`/
     `rangeUnderflow`/`rangeOverflow`/`stepMismatch`/`typeMismatch` (a `<textarea>` has no
     `pattern`/`min`/`max`/`step`/`type` in the constrainable sense). If you judge a SHARED helper
     worth extracting (e.g. a `mergeUaValidityFlags(control, keys, flags)` function taking an
     explicit key list per element), add it to `form-control-base.ts` as a plain exported
     function or protected method — NOT as a new mutation anchor itself (the anchor is the CALL
     SITE inside each element's `validate()`, which stays per-element). If you judge it not worth
     it (a 6-line inline loop with no meaningful sharing), leave it inline and say so in one
     sentence in the Activity Log — either answer is acceptable, but the decision must be
     RECORDED, not silently defaulted.
- **Files**: `packages/elements/src/form-input/sk-form-input.ts`, and OPTIONALLY
  `packages/elements/src/form-control-base.ts` per the FR-007 check above.
- **Parallel?**: No.
- **Notes**: This is the subtask most likely to be checked by the pre-merge squad line-by-line —
  it is the mission's namesake defect. Do not let `readonly`/`disabled` short-circuit past this
  code by ACCIDENT (verify with a manual trace, not just the tests) — they must short-circuit
  past it by DESIGN, which T002's early-return placement already guarantees if followed in order.

### Subtask T004 – Shadow-root `<datalist>`, `options` property, rationale comments

- **Purpose**: FR-005/FR-006 — the datalist half of the mission, and the piece that also has to
  survive React's `ssrSafe` boundary (WP02's job, but the property SHAPE is decided here).
- **Steps**:
  1. Add to `static properties`:
     ```ts
     // PROPERTY-ONLY, deliberately. See scripts/normalise-manifest.mjs's propertyOnlyFields()
     // walk and sk-transition-matrix's columns/routes (packages/elements/src/transition-matrix/
     // sk-transition-matrix.ts:119-131) for the exact shape this must match: `attribute: false`,
     // a ReadonlyArray-normalized type, a frozen-empty-array default — so the manifest marks it
     // x-spec-kitty-property-only and the React generator routes it through useProperties()
     // instead of dropping it under ssrSafe (research.md R4; WP02 depends on this exact shape).
     options: { attribute: false },
     ```
  2. Add the field declaration and constructor default:
     ```ts
     /** Suggested values shown in a native datalist alongside the input. A typed value matching
      *  no option stays valid unless a forwarded constraint says otherwise — this is a
      *  suggestion list, not a closed set. */
     declare options: ReadonlyArray<{ value: string; label?: string }>;
     ```
     ```ts
     this.options = Object.freeze([]);
     ```
  3. In `render()`, ABOVE the `<input>` binding, add rationale comments (see the file's existing
     ARRANGEMENT B block at the top for the house style — `//`, not `/** */`):
     ```ts
     // THE DATALIST LIVES IN THIS SHADOW ROOT, and this is not a style choice.
     // <input list="x"> resolves "x" in the INPUT'S OWN TREE (MDN, "Reflected attributes §
     // Reflected element references" — the same resolution rule ADR-9 §4 already cites for why
     // aria-labelledby cannot cross a shadow boundary). The input lives in this shadow root
     // under Arrangement B, so neither a consumer's light-DOM <datalist> nor a slotted one can
     // ever be referenced by `list` — there is no tree in which both nodes are visible to each
     // other. A fixed id is safe here (unlike a light-DOM id) because each INSTANCE has its own
     // shadow root: "options" cannot collide with another <sk-form-input>'s own "options".
     ```
  4. Add the `list` binding to the `<input>`: `list=${this.options.length ? 'options' : nothing}`
     — omit `list` entirely when there are no options, so an empty, pointless `<datalist>` is
     never referenced (and SC-005's node-identity assertion has a clean "absent" case to check
     against, not just a "present" one).
  5. Render the datalist conditionally, immediately after the `<input>` (still inside the
     `part="field"` wrapper, before the description/error spans — order does not matter
     semantically, but keep it visually adjacent to the control it serves):
     ```ts
     ${this.options.length
       ? html`<datalist id="options">
           ${this.options.map(
             (o) => html`<option value=${o.value} label=${o.label ?? nothing}></option>`,
           )}
         </datalist>`
       : ''}
     ```
- **Files**: `packages/elements/src/form-input/sk-form-input.ts`.
- **Parallel?**: No.
- **Notes**: Do NOT add any filtering, sorting, or "closest match" logic — FR-006 explicitly rules
  this out; the element renders exactly the given array, in order, and a typed value the array
  does not contain must remain valid (verify this is true simply because nothing in `validate()`
  reads `this.options` at all — if you find yourself writing code that does, stop, that is C-001's
  combobox boundary being crossed).

### Subtask T005 – Behaviour tests: constraint round-trip + mutation reds (FR-001/SC-001)

- **Purpose**: SC-001 requires EVERY forwarded attribute to round-trip both directions
  (attribute→property and property→attribute) with its own test, plus a mutation red for a
  dropped forwarding.
- **Steps**:
  1. In `fixtures/elements-behaviour/src/sk-form-input.test.ts`, add one test per T001 property
     (six tests, or one parameterized test iterating the six names/values — either is acceptable,
     but a parameterized test must still produce SIX distinguishable mutation targets, one per
     property, because `mutations.json` anchors are per-line, not per-test-name) asserting:
     - Setting the attribute in markup (`el.setAttribute('pattern', '[a-z]+')`) is reflected on
       the property (`el.pattern === '[a-z]+'`).
     - Setting the property (`el.pattern = 'x'`) reflects the attribute
       (`el.getAttribute('pattern') === 'x'`).
     - The inner control (`control(el)`) carries the SAME value as an attribute on the real
       `<input>` (`control(el).getAttribute('pattern') === 'x'`) — this is the actual forwarding
       assertion; the two round-trip assertions above only prove Lit's own reflect mechanism,
       which is not this mission's code.
  2. Add one test for `readonly` following the same pattern (boolean, so assert both
     `hasAttribute`/property truthiness).
  3. Register each new mutation in `mutations.json`/`behaviours.json` NOW is deferred to T008 —
     write the tests here assuming ids will exist, and come back to fill in the exact
     `[SC-0xx]` tag in the test name once T008 assigns them (do not leave a TODO placeholder in
     committed code — the two subtasks should be done close together, in the same sitting).
- **Files**: `fixtures/elements-behaviour/src/sk-form-input.test.ts`.
- **Parallel?**: No.
- **Notes**: Follow the file's existing `mount()`/`control()` helpers; do not write a second
  mounting helper.

### Subtask T006 – Behaviour tests: merged-validity real-submit + readonly split (FR-002/SC-002, FR-003/SC-003)

- **Purpose**: The two tests a reviewer will read first, because they assert the actual defects
  this mission fixes.
- **Steps**:
  1. **FR-002/SC-002 test** — SC-002's own text requires a REAL form submit, not a `validity`
     read. Follow the existing `[SC-002]` test's three-witness style (FormData/spy/no-light-DOM)
     as a model, adapted:
     - Mount with `pattern="[a-z]+"`, set `el.value = '123'` (fails the pattern).
     - Assert `el.validity.patternMismatch === true` (necessary but NOT sufficient).
     - Assert `el.checkValidity() === false`.
     - Attach a `submit` listener to the `<form>`, call `form.requestSubmit()`, and assert the
       listener NEVER FIRES (a blocked submit fires no `submit` event at all — this is the part a
       bare `validity` read would miss entirely: it is possible to have the right flags and still
       wire the block incorrectly if `setValidity` is called with the wrong control).
     - Repeat with a valid value and assert the listener DOES fire — a test that only ever
       submits invalid data does not prove the valid path still works.
  2. **FR-003/SC-003 test** — mount `required readonly`, leave `value` empty:
     - Assert `el.validity.valid === true` (barred, not merely passing).
     - Assert `el.checkValidity() === true`.
     - Assert `new FormData(form).has('name-attr-used')` — the value (empty string) IS present as
       a form entry, unlike the existing `disabled` test where the key is absent entirely. This
       is the exact line that distinguishes `readonly` from `disabled` — get the assertion
       backwards and the test would pass for the WRONG reason (both being "some assertion about
       FormData" without checking presence vs. absence correctly).
     - Add a second arm: `required readonly` with a NON-empty value that fails a `pattern` also
       set on the element — assert this ALSO stays valid (`el.validity.valid === true`), which is
       the spec.md table's fourth row ("pattern mismatch + readonly") and the subtlest one: it
       proves T002's early return happens BEFORE T003's merge code ever runs, not merely that the
       required-empty case is barred.
- **Files**: `fixtures/elements-behaviour/src/sk-form-input.test.ts`.
- **Parallel?**: No.
- **Notes**: If either test passes on the FIRST attempt with no corresponding code change, that
  is a signal the test is not actually exercising the new code path — deliberately break the
  implementation (comment out the merge loop / the readonly branch) and confirm each test reds
  before finalizing, per the charter's red-before-green requirement.

### Subtask T007 – Behaviour tests: datalist node-identity + unmatched-value stays valid (FR-005/SC-005, FR-006)

- **Purpose**: SC-005 requires NODE IDENTITY, not attribute-string equality — a string match would
  pass even if `list` pointed at a same-id node in the WRONG root, or at nothing.
- **Steps**:
  1. Mount with `el.options = [{ value: 'a' }, { value: 'b', label: 'Bee' }]`, await
     `el.updateComplete`.
  2. Assert `control(el).list === el.shadowRoot!.querySelector('datalist')` — the identity
     comparison SC-005 requires. Also assert `el.shadowRoot!.querySelector('datalist')!.children.length === 2`
     and that the second `<option>` carries `label="Bee"`.
  3. Assert the ABSENT case: mount with no `options` set (default `Object.freeze([])`), and assert
     `control(el).list` is `null` and `el.shadowRoot!.querySelector('datalist')` is `null` — the
     `nothing`/conditional-render path from T004 step 4/5 must produce no residual `list`
     attribute and no empty `<datalist>` element.
  4. FR-006 test: set `el.value` to a string matching NO option's `value` (with no other
     constraint attributes set) and assert `el.validity.valid === true` — an unmatched typed value
     must stay valid; the datalist is a suggestion, not a closed enum.
- **Files**: `fixtures/elements-behaviour/src/sk-form-input.test.ts`.
- **Parallel?**: No.

### Subtask T008 – Registry entries + Storybook story arms

- **Purpose**: Every new mutation anchor from T002/T003/T004/T007 needs a real `(id, subject)`
  entry so `suite-selftest.mjs`/`floor-reporter.mjs` can enforce it; every new interactive state
  needs a story per the charter's Testing policy.
- **Steps**:
  1. Read `behaviours.json`'s `$comment` block in full (it explains the SUBJECTS mechanism and the
     applicable/inapplicable split) before adding entries.
  2. Assign FRESH ids from the currently-unallocated range: `SC-016` through `SC-022` are open as
     of this mission's plan (verified: `grep -o '"id": "SC-[0-9]*"' behaviours.json | sort -u`).
     **Do NOT reuse `SC-002`/`SC-003`/`SC-004`/`SC-005`/`SC-013`** — those already exist for
     `sk-form-input` and mean different, EXISTING behaviours (research.md R6). Suggested mapping
     (adjust only the ids, keep the arm descriptions accurate to what you actually built):
     - `SC-016` — "merged UA validity flag reaches the host and blocks a real submit" (T003/T006).
     - `SC-017` — "readonly submits its value but is barred from constraint validation" (T002/T006).
     - `SC-018` — "datalist reachable by node identity from the shadow-root input" (T004/T007).
     - `SC-019` — "a value matching no option stays valid" (T004/T007, FR-006).
     - One entry per T001/T005 forwarded attribute if each got its own mutation target, OR one
       shared entry with six `arm` variants if you wrote a parameterized test — match whatever
       T005 actually produced.
  3. Add each entry to BOTH `behaviours.json` (the id registry — `subject`,
     `fixtures/elements-behaviour/src/sk-form-input.test.ts`) and `mutations.json` (the `from`/`to`
     mutation targeting the exact line in `sk-form-input.ts` your code added).
  4. Run the existing self-test/registry gates locally before moving on:
     `node scripts/build-react-wrappers.mjs --selftest` does NOT cover this registry; find and
     run whatever this repo's own mutation-harness entry point is (check `package.json`/CI for a
     `mutation` or `suite-selftest` script name) and confirm the new entries are picked up and
     that `suite-selftest.mjs` guard 5 does not flag anything you added as collateral.
  5. Add Storybook story arms to `sk-form-input.stories.ts`: one showing `pattern`/`min`/`max`/
     `step` constraints with an invalid initial value (visibly showing the error state), one
     showing `readonly` (visibly NOT showing an error even though empty+required), one showing
     `options`/datalist. Include a `LightMode` variant for each new arm using `class="sk-light"`
     (C-005 — never `data-theme`), matching the file's existing story conventions.
- **Files**: `mutations.json`, `behaviours.json`, `packages/elements/src/form-input/sk-form-input.stories.ts`.
- **Parallel?**: No.
- **Notes**: This is the subtask WP02's T009 (manifest regen) and T013 (registry reconciliation
  note) both read from — leave the ids stable once assigned; do not renumber after WP02 has
  started.

## Test Strategy

- Every subtask T002-T007 above IS a test-writing subtask; there is no separate "write tests"
  phase — this mission's charter context requires red-before-green per new behaviour, not a
  render-only assertion, so tests are written alongside the code they cover, in the order listed.
- Run `npx vitest run fixtures/elements-behaviour/src/sk-form-input.test.ts` (browser-mode
  project) after EVERY subtask, not only at the end — catching a regression in T003 while writing
  T004 is far cheaper than catching it after T008's registry entries are already written against
  the wrong line numbers.
- Before finalizing T008's registry entries, temporarily revert each corresponding code change
  (comment it out) and confirm the paired test reds — this is the literal mechanism
  `mutations.json` automates going forward, but doing it once by hand here is the fastest way to
  catch a test that was accidentally asserting something already true before your change.

## Risks & Mitigations

- **The merge-vs-replace trap (FR-002)**: a plausible-looking fix that reads `control.validity`
  but never calls `setValidity` with the merged flags (e.g. only checks the flag for a `console.warn`
  or an internal-only property) would leave T006's first test red — good, that is the test
  working. The mitigation is procedural: do not consider T003 done until T006's first test is
  GREEN with the mitigation ABSENT-then-PRESENT both observed.
- **The readonly-flags-still-compute trap (FR-003)**: reading `control.validity.patternMismatch`
  on a readonly control and acting on it (even just to log it) reproduces the wrong contract even
  with the right prose understanding in the comment. T002's early return must occur BEFORE any
  code from T003 runs — verify by trace, confirmed by T006's second test's `pattern`+`readonly`
  arm.
- **Sequencing T002/T003 in the same method**: both edit `validate()`. Write T002 first (it is a
  pure early-return, nothing after it in the function can execute for a readonly control), then
  layer T003 underneath. If reviewing a diff that does this in the OTHER order, re-check by hand
  that the early return still precedes the merge.
- **FR-007 scope creep**: it is tempting to "clean up" `sk-form-textarea.ts` while in the
  neighbourhood, since `form-control-base.ts` is now open. Do not. `sk-form-textarea.ts` is not in
  this WP's `owned_files`; touching it here would collide with any parallel work and is out of
  scope per `research.md` R5's explicit finding that nothing in this mission's surface applies to
  it.

## Review Guidance

- Confirm each new doc comment (T001, T004) reads as CONSUMER-FACING prose (what the property
  does), with any maintainer rationale in `//` comments instead — `check-manifest-content.mjs`
  enforces presence, not tone, so this is a human review item.
- Confirm T006's readonly test's FormData assertion checks PRESENCE (readonly) vs. the existing
  disabled test's ABSENCE — a reviewer should be able to point at the one line that would flip
  silently if T002's `syncFormValue()` reasoning were wrong.
- Confirm T004's rationale comment is genuinely `//`, not folded into the class-level `/** */` —
  FR-005 explicitly requires this distinction and it is easy to get backwards when writing near
  the existing `/** */` block above `render()`.
- Confirm `willUpdate()`'s extended condition (T002 step 6) does not accidentally drop
  `changed.has('value')` or `changed.has('disabled')` from the existing condition — this is an
  ADD, not a REPLACE, of the trigger set.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:37:18Z – system – Prompt created.
