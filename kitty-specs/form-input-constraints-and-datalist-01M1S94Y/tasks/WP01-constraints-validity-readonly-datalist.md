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

> **This WP prompt was revised after a post-tasks squad returned BLOCK on the original version.**
> Two CRITICAL, engine-measured defects were found in the original T002/T003 guidance (a
> `willUpdate`/render-timing bug in the validity merge, and `setValidity(flags, '')` throwing), and
> the original `readonly` reflection decision was reversed. If you have seen an earlier version of
> this file, re-read T002, T003, T005, T006, and T008 in full — they changed substantively, not
> cosmetically.

`sk-form-input` gains seven forwarded/native-constraint surfaces and a corrected `readonly`
contract, without regressing anything `fixtures/elements-behaviour/src/sk-form-input.test.ts`'s
existing `[SC-002]`..`[SC-005]`/`[SC-013]` tests already assert. Concretely, done means:

- `pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete` are reactive properties, reflected
  as attributes, forwarded to the inner `<input>`, each with its own published `/** */` doc
  comment (FR-001).
- `readonly` is a reactive property that does **NOT reflect** to the host attribute (reversed from
  an earlier design — see T002). A readonly control's value still reaches `setFormValue()`; the
  control is barred from constraint validation (`internals.setValidity({})`, the ELEMENT's own
  doing) regardless of `required`/pattern/UA flags (FR-003). `disabled`'s existing behaviour —
  unreflected, `setFormValue(null)`, excluded — is UNCHANGED (FR-004): this is a guard to verify,
  not new code to write.
- `validate()` merges the inner control's own `ValidityState`'s `true` flags
  (`patternMismatch`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `typeMismatch`,
  `badInput`) into the flags object it already builds from `required`/`customError`, rather than
  replacing them (FR-002) — reading the control's validity ONLY after syncing its own DOM state to
  the CURRENT update (see T003), and with a non-empty fallback message whenever a UA flag is the
  only one true (see T003) — `setValidity` throws otherwise.
- An `options: ReadonlyArray<{ value: string; label?: string }>` property (no attribute, literal
  field initializer — see Subtask T004) drives a `<datalist>` rendered into the element's OWN
  shadow root, with the inner `<input>`'s `list` attribute resolving to it (FR-005). No
  filtering/sorting/fetching/inventing — the element renders exactly the given array (FR-006).
- Every new behaviour has a Vitest browser-mode test with a registered mutation anchor
  (`mutations.json`/`behaviours.json`), demonstrated red before green — not a render-only
  assertion (charter Testing policy, ADR-11 required-behaviour #1). **New anchors are registered
  as ARMS under EXISTING `(id, subject)` pairs** (`SC-002`/`SC-003`/`SC-004`/`SC-013` for
  `sk-form-input`) — `tests/node/config-contract.test.ts` hard-codes the applicable behaviour-id
  set as EXACTLY `SC-002`–`SC-015` and asserts exact equality, so **no new id may be added at
  all** (T008; this reverses the original guidance, which incorrectly said `SC-016`+ were free).
- `form-control-base.ts` gains **no change** for this mission — see FR-007's corrected note in
  Subtask T003 (the "nothing shared applies" premise was itself wrong, but the conclusion holds
  for different reasons).

## Context & Constraints

**Read the squad-fold note above in the Objectives section first if you have not already.**

Read, in this order, before writing any code:

1. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/spec.md` — the contract, especially
   the corrected `readonly` table and the FR-002 "trap" paragraph. **Do not rewrite this file.**
2. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/plan.md` — IC-01 through IC-05, IC-07,
   ALL marked **revised**/**post-squad**. Read the Risks field of each; they name the exact ways a
   superficially-correct implementation still fails, including two that were only found after this
   WP was first written.
3. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/research.md` — R1 (readonly,
   REVISED — reflection reversed), R2 (merge timing + throw defects, REVISED), R4 (options field
   shape, REVISED), R5 (why no shared code moves — corrected premise), R6 (behaviour-id registry —
   REPLACED, the id space is closed, not open).
4. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/data-model.md` — the exact property
   table (note the `Reflects` column for `readonly` is now **no**) and the revised `validate()`
   pseudocode, including the sync-before-read step and the `willUpdate()` trigger-condition
   extension (do not miss `type` — it is easy to add the constraint properties and forget that
   `typeMismatch` needs `type` itself in the trigger set too).
5. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md`
   — the rendered-DOM delta and the REVISED form-participation/validity delta tables (message
   contract, dropped/added flags).
6. `packages/elements/src/form-input/sk-form-input.ts` (current file, ~215 lines) — every edit in
   this WP is inside this file. Read `validate()` (~136-178), `render()` (~188-215),
   `willUpdate()`/`updated()`/`syncFormValue()`/`formResetCallback()` in full before touching any
   of them — they are existing MUTATION ANCHORS (see the `// MUTATION ANCHOR SC-0xx` comments)
   and must not be disturbed except exactly where this WP's own new anchors require.
7. `packages/elements/src/form-control-base.ts` — read the file header comment in full. It is
   maintainer doctrine, not filler: it explains, with a measured number (8 of 37 mutations), why a
   shared MUTATION ANCHOR is refused by `suite-selftest.mjs` guard 5. Do not move
   `syncFormValue`/`formResetCallback`/`formDisabledCallback`/`validate()`'s existing body into
   this file. The ONLY thing that may move here is a brand-new, UNANCHORED helper (see T003).
8. `packages/elements/src/form-textarea/sk-form-textarea.ts` — read it once. **An earlier version
   of this WP told you to confirm that none of the seven new attributes apply to `<textarea>` —
   that claim is FALSE.** `readonly`/`autocomplete`/`inputmode` DO apply to `<textarea>` per the
   HTML Standard; only `pattern`/`min`/`max`/`step`/`list` are `<input>`-specific. Read T003 step 4
   for why nothing still moves to the shared base despite this correction. Do not edit this file
   in this WP regardless.
9. `fixtures/elements-behaviour/src/sk-form-input.test.ts` — read the existing `[SC-002]` test in
   full before writing T005-T007; it is the pattern every new test in this WP must follow (mount
   helper, `control()` accessor, real `<form>` + `FormData`/`ElementInternals.setFormValue` spy
   witnesses — never a bare `validity` read standing in for a submit).
10. `docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md` (ADR-9) §4 — the
    containment argument this mission's datalist placement extends. Do not re-litigate Arrangement
    B; it is settled.
11. `packages/elements/src/transition-matrix/sk-transition-matrix.ts` lines ~119-132 — the EXACT
    shape a property must have to earn the manifest's `x-spec-kitty-property-only`/
    `x-spec-kitty-property-reset` markers. **Read the FIELD DECLARATION itself, not just
    `static properties`**: `columns: ReadonlyArray<TransitionColumn> = Object.freeze([]);` is a
    PLAIN CLASS FIELD WITH A LITERAL INITIALIZER — not `declare columns: …;` plus a
    constructor-assigned default. `scripts/normalise-manifest.mjs`'s
    `hasFrozenEmptyArrayInitializer()` reads the field's AST initializer directly; a `declare`
    field has none. `options` (T004) must match this literal-initializer shape exactly — every
    OTHER property in `sk-form-input.ts` uses `declare` + constructor default, which is precisely
    why `options` is easy to get wrong by following this file's own established pattern.
12. `tests/node/config-contract.test.ts`, the two `'[registry] …'` tests — confirms the applicable
    behaviour-id set is hard-coded as EXACTLY `SC-002`–`SC-015` and the sole inapplicable id is
    `SC-023`. Read this before writing T008; it is the reason no new id may be added.

**Constraints this WP must not violate** (spec.md C-001..C-005, plan.md Technical Context):
no combobox/listbox/popup/masking/date-time-picker; `sk-button` untouched (not in scope here at
all); `sk-form-field` stays styles-only (not touched, and its REAL static-markup files for THIS
element — `packages/styles/src/form-field/sk-form-input-*.html` — are WP02's concern to document,
never this WP's or WP02's to edit); `LightMode` stories use `class="sk-light"`, never
`data-theme`; the `disabled` non-reflection decision and ADR-9 Arrangement B are frozen.

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

### Subtask T002 – `readonly`: UNREFLECTED property, submission unaffected, `validate()` early return — **reflection decision REVERSED, post-squad**

- **Purpose**: FR-003's corrected contract — and the one place this WP's OWN first-cut design was
  itself measurably wrong (not the issue's fault this time; a squad caught it after `tasks`).
- **The reflection decision below is the OPPOSITE of an earlier draft of this subtask**, which said
  to reflect `readonly` to the host attribute. Read this before writing any code: reflecting
  `readonly` on a FORM-ASSOCIATED CUSTOM ELEMENT's host attribute makes the UA itself bar the
  element from constraint validation — measured directly, both engines:
  `willValidate === false`, `internals.checkValidity() === true`, still submits, with **no
  `setValidity` call needed from this element's own code at all**. Reflecting it would make the
  `readonly` branch below an unobservable, near-dead mutation anchor (three of its four test
  assertions would still pass with the branch deleted) — the exact SC-005 collateral shape this
  file's OWN `disabled` property comment already warns about, which is why `disabled` is
  deliberately unreflected. Do the same for `readonly`, for the same reason.
- **Steps**:
  1. Add `readonly: { type: Boolean }` to `static properties` — **no `reflect`**. Add a `declare`
     field and doc comment stating the corrected contract in one or two sentences (submitted,
     barred from constraint validation — link the behaviour, not the issue number, since doc
     comments are published API and #180 means nothing to a consumer).
  2. In the constructor, initialize `this.readonly = false`.
  3. In `render()`, add `?readonly=${this.readonly}` to the `<input>` binding list — this line is
     UNCHANGED from any earlier draft; it drives the INNER control from the host's PROPERTY, and
     is unaffected by the reflection decision above (only the HOST's own attribute reflection is
     withheld — `<sk-form-input readonly>` in markup still sets the property; Lit's
     attribute→property conversion needs no `reflect`, only the reverse direction is affected).
  4. In `syncFormValue()`, the existing line is
     `this.internals.setFormValue(this.disabled ? null : this.value);` — this is UNCHANGED.
     `readonly` does NOT affect this method at all; a readonly control submits exactly like an
     enabled, non-readonly one. Resist the urge to add a `readonly` branch here — there is none.
  5. In `validate()`, add a NEW early-return branch for `readonly`, modeled on the EXISTING
     `disabled` branch immediately above it:
     ```ts
     if (this.readonly) {
       // MUTATION ANCHOR SC-0xx (assign the real ARM at T008 — an EXISTING id, see T008's note;
       // no new id may be minted) — readonly is barred from constraint validation but its value
       // IS still submitted (syncFormValue, unchanged above) — the one place this element's
       // readonly and disabled paths diverge. See spec.md FR-003 and the operator's #180
       // correction to the issue's stated contract: the UA's own `willValidate === false` for a
       // readonly control is what this mirrors.
       //
       // NOT REFLECTED, deliberately — same reasoning as `disabled` above. Reflecting `readonly`
       // would let the UA bar constraint validation on the ATTRIBUTE ALONE (measured: both
       // engines bar a reflected-readonly form-associated element with no `setValidity` call at
       // all), which would make THIS BRANCH an unobservable, near-dead mutation anchor — the
       // exact SC-005 collateral shape. Keeping it unreflected keeps this branch the sole,
       // testable authority for the barring.
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
     to also fire on `readonly`, on every T001 constraint property, AND on `type` (added
     post-squad — see T003 step 5 for why `type` specifically must be here):
     `changed.has('readonly') || changed.has('pattern') || changed.has('min') ||
     changed.has('max') || changed.has('step') || changed.has('type')`. (`inputmode`/
     `autocomplete` carry no validity semantics and do not need to trigger `validate()` — only add
     the ones that can change what `control.validity` reports.) Without this, toggling `readonly`
     after mount, or changing `pattern`/`type` without also changing `value`, would not re-run
     `validate()` until the next unrelated change — a real, user-visible staleness bug of exactly
     the shape the file's own `willUpdate` comment already warns about for `aria-invalid`.
- **Files**: `packages/elements/src/form-input/sk-form-input.ts`.
- **Parallel?**: No.
- **Notes**: This subtask and T003 both touch `validate()`'s body. Write T002's `readonly` branch
  FIRST (an early return, so it never reaches the merge code), then write T003's merge on top of
  what remains. Sequencing them the other way around risks writing the merge logic somewhere the
  `readonly` early return would make dead code. **Verify the branch is actually load-bearing**:
  temporarily delete it, run T006's readonly test, and confirm it REDS — if it stays green, the
  branch never reflected changed and something upstream (the property declaration, most likely)
  is wrong.

### Subtask T003 – Merge the inner control's UA `ValidityState` flags, correctly timed and non-throwing — **substantially revised, two CRITICAL defects fixed, post-squad**

- **Purpose**: FR-002 — the actual defect this mission exists to fix. Without this, T001's
  forwarded `pattern`/`min`/`max`/`step` are cosmetic: the inner `<input>` becomes invalid but the
  host keeps reporting valid, because `ElementInternals.setValidity` REPLACES whatever this
  element passes it; nothing today reads the inner control's own validity at all.
- **Two CRITICAL defects were found in an earlier draft of this subtask, both reproduced
  end-to-end by a post-tasks squad. Read both before writing any code:**
  1. **Read-before-write ordering.** `validate()` runs from `willUpdate()`, which fires BEFORE
     `render()` commits THIS update's `.value=`/`pattern=`/etc. bindings to the live DOM. An
     earlier draft read `control.validity` directly at this point — which sees the PREVIOUS
     render's DOM state, not the one about to commit. Reproduced: mount with `pattern="[a-z]+"`,
     then `el.value = '123'` — host reports valid, a real `form.requestSubmit()` succeeds, and
     `FormData` carries `123`. Mount-time and user-typing are both unaffected (typing updates the
     live control's own DOM/validity synchronously, before Lit's cycle runs), which is exactly why
     this is invisible in Storybook/manual testing and only breaks PROGRAMMATIC assignment —
     precisely what the React wrapper and this WP's own T006 test-writing pattern both do.
  2. **`setValidity(flags, '')` throws** when any flag in `flags` is `true` and `message` is an
     empty string (measured, both engines). Consequence: `updateComplete` rejects, `updated()` —
     and therefore `syncFormValue()` — never runs, and the field silently disappears from
     `FormData` with no error surfaced anywhere. An earlier draft of this subtask said to call
     `setValidity` with "whatever `message` happens to be," which is empty for a UA-raised flag
     with no `required`/`customError` also true.
- **Steps**:
  1. In `validate()`, after the existing `disabled` and (from T002) `readonly` early returns, and
     after `const control = this.shadowRoot?.querySelector('input') ?? undefined;` is resolved (it
     already is, for the focus-anchor argument — reuse the same reference, do not re-query),
     **sync the control's own DOM state to the current update BEFORE reading its validity**:
     ```ts
     // FIX for the read-before-write ordering defect above. willUpdate() runs BEFORE render()
     // commits this update's bindings, so without this sync, control.validity below would
     // reflect the PREVIOUS render — stale for any PROGRAMMATIC property assignment (mount-time
     // and user-typing are unaffected: the browser itself keeps the live control current on a
     // real keystroke). This keeps validate() inside willUpdate() rather than moving it to
     // updated() — moving it risks reproducing this file's OWN documented historical bug (a
     // reactive-property write made from updated() — this.invalid/this.errorMessage below —
     // schedules a SECOND update cycle, which is why validation was moved out of updated() in
     // the first place; see the willUpdate rationale block above this method).
     if (control) {
       control.value = this.value;
       control.type = this.type;
       control.pattern = this.pattern ?? '';
       control.min = this.min ?? '';
       control.max = this.max ?? '';
       control.step = this.step ?? '';
     }
     ```
     **Amend the `willUpdate` rationale block at the top of this file (around the existing
     "VALIDATION RUNS BEFORE RENDER, not after" comment)** to document this new subtlety — a
     reader of that block should learn WHY a manual DOM sync exists inside `validate()`, not be
     left to discover it by tracing code. Do not contradict that block's existing claim (no second
     render pass); this sync is what PRESERVES that claim once the merge reads live DOM state.
  2. Before building `message`, merge each of the following flags from `control.validity` into
     the local `flags` object IF true: `patternMismatch`, `rangeUnderflow`, `rangeOverflow`,
     `stepMismatch`, `typeMismatch`, `badInput`. **This list changed from an earlier draft**:
     `badInput` is ADDED (reachable TODAY with no new attribute — `type="number"` plus a value the
     UA cannot parse, e.g. `12e`, produces `value === ''` and `badInput: true` — exactly the
     "looks fine, silently submits rejected data" case FR-002 exists to close); `tooLong`/
     `tooShort` are DROPPED (they need `maxlength`/`minlength`, which this mission does not
     forward, so they can never be true — an inert mutation target that would never red). Do NOT
     merge `valueMissing` from `control.validity` — that stays element-derived from
     `this.required && this.value === ''` exactly as today (see data-model.md's note on why).
     ```ts
     // MUTATION ANCHOR SC-0xx (assign the real ARM at T008 — an EXISTING id, see T008's note; no
     // new id may be minted) — the UA's OWN validity flags are MERGED, not read-and-discarded.
     // Without this, forwarding pattern/min/max/step (see the constructor/render bindings above)
     // makes the INNER <input> invalid while the HOST still reports valid — ElementInternals.
     // setValidity REPLACES whatever this element passes it, and nothing else consults
     // control.validity. A field that looks fine and silently submits rejected data is exactly
     // the failure this line exists to prevent (spec.md FR-002).
     if (control) {
       for (const key of [
         'patternMismatch', 'rangeUnderflow', 'rangeOverflow',
         'stepMismatch', 'typeMismatch', 'badInput',
       ] as const) {
         if (control.validity[key]) flags[key] = true;
       }
     }
     ```
  3. **Message construction — FIX for the throw defect above.** `customError` still wins the
     *announced* message when both a UA flag and a custom error are true, exactly as before. But
     BEFORE calling `setValidity`, if `flags` has any true entry and `message` is STILL an empty
     string at that point, assign a fallback message — a form-associated custom element has no
     free UA-authored message the way a plain `<input>`'s own `reportValidity()` bubble would
     supply:
     ```ts
     // FIX — setValidity(flags, '') THROWS when any flag is true (measured, both engines). A
     // form-associated custom element has no UA-authored fallback message; author one per merged
     // flag rather than relying on an empty string, which a plain <input> could get away with.
     if (Object.values(flags).some(Boolean) && message === '') {
       const fallback: Partial<Record<keyof ValidityStateFlags, string>> = {
         patternMismatch: 'Value does not match the required pattern.',
         rangeUnderflow: `Value must be ${this.min ?? 'a minimum value'} or more.`,
         rangeOverflow: `Value must be ${this.max ?? 'a maximum value'} or less.`,
         stepMismatch: 'Value does not match the allowed increment.',
         typeMismatch: 'Value is not in the correct format.',
         badInput: 'Value could not be interpreted.',
       };
       const firstTrueFlag = (Object.keys(flags) as (keyof ValidityStateFlags)[]).find(
         (key) => flags[key],
       );
       message = (firstTrueFlag && fallback[firstTrueFlag]) || 'Value is invalid.';
     }
     ```
     Adjust wording/formatting to match this file's existing message style (see the
     `required`-flag message a few lines above for tone). The exact strings above are a starting
     point, not a fixed contract — but SOME non-empty message for every UA-raised flag is
     mandatory, not optional.
  4. **FR-007 check (corrected premise — do this before moving on)**: an earlier draft of this
     step claimed "none of the seven new attributes apply to `<textarea>`," which is FALSE —
     `readonly`, `autocomplete`, and `inputmode` all apply to `<textarea>` per the HTML Standard;
     only `pattern`/`min`/`max`/`step`/`list` are `<input>`-specific. Despite the corrected
     premise, the CONCLUSION is unchanged for this mission: do **not** move `readonly`/
     `autocomplete`/`inputmode` (or the merge loop above) into `form-control-base.ts`. Sharing them
     would surface as INHERITED manifest members on `sk-form-textarea` regardless of whether its
     `render()` binds them — silently violating NFR-003 (no behaviour change to
     `sk-form-textarea`'s contract) the moment a consumer sets one expecting an effect, and
     `build-react-wrappers.mjs`'s `EXPECTED_NON_PROP_FIELDS` map has no mechanism to suppress a
     shared property from ONE subclass's wrapper while keeping it on the other's — `SkFormTextarea`
     would silently gain a prop with no matching behaviour. This mission's `owned_files` do not
     include `sk-form-textarea.ts`; actually wiring these three attributes into `<textarea>` too is
     legitimate future work (filed on #122), not something to reach for here. If the merge LOOP
     above (reading a control's UA-raised flags into an object) still looks like a candidate for a
     genuinely shared, UNANCHORED helper taking an explicit per-element key list — note
     `<textarea>`'s own mergeable set would be DIFFERENT (no `pattern`/`range`/`step`/`type`
     concept) — that is a narrower, defensible base-file addition; decide it here and record which
     way you went in the Activity Log. Either answer is acceptable; silently defaulting is not.
- **Files**: `packages/elements/src/form-input/sk-form-input.ts`, and OPTIONALLY
  `packages/elements/src/form-control-base.ts` ONLY for a narrow, unanchored helper per step 4 —
  never for `readonly`/`autocomplete`/`inputmode` themselves in this mission.
- **Parallel?**: No.
- **Notes**: This is the subtask most likely to be checked by the pre-merge squad line-by-line —
  it is the mission's namesake defect, and it is the one that already came back BLOCKED once. Do
  not let `readonly`/`disabled` short-circuit past this code by ACCIDENT (verify with a manual
  trace, not just the tests) — they must short-circuit past it by DESIGN, which T002's
  early-return placement already guarantees if followed in order. Before considering this subtask
  done: write a test (T006) that assigns a constraint attribute AFTER mount with `value` unchanged
  and confirm it currently REDS without the step-1 sync, then GREENS with it — a test that only
  ever covers the mount-time case would not have caught the original defect and would not catch a
  regression of it either.
### Subtask T004 – Shadow-root `<datalist>`, `options` property, rationale comments — **field-declaration shape corrected, post-squad**

- **Purpose**: FR-005/FR-006 — the datalist half of the mission, and the piece that also has to
  survive React's `ssrSafe` boundary (WP02's job, but the property SHAPE is decided here).
- **The field declaration below is NOT the same shape as every other property in this file, and
  that difference is load-bearing — an earlier draft of this subtask got it wrong by following
  this file's own established pattern.** Every OTHER property here is `declare name: Type;` with a
  default assigned in the constructor. `options` must instead be a PLAIN CLASS FIELD WITH A
  LITERAL INITIALIZER, exactly matching `sk-transition-matrix.ts`'s `columns`/`routes`
  (`columns: ReadonlyArray<TransitionColumn> = Object.freeze([]);`) — because
  `scripts/normalise-manifest.mjs`'s `hasFrozenEmptyArrayInitializer()` reads the field's AST
  INITIALIZER directly to decide whether to mark `x-spec-kitty-property-reset`, and a `declare`
  field has no initializer at all (its default lives in the constructor instead, invisible to that
  check). Get this wrong and WP02's T009/T010 will show the manifest missing the reset marker,
  several steps removed from this one — verify it here, do not wait for WP02 to catch it.
- **Steps**:
  1. Add to `static properties`:
     ```ts
     // PROPERTY-ONLY, deliberately. See scripts/normalise-manifest.mjs's propertyOnlyFields()
     // walk and sk-transition-matrix's columns/routes (packages/elements/src/transition-matrix/
     // sk-transition-matrix.ts:119-132) for the exact shape this must match: `attribute: false`
     // here, AND a literal field initializer below (not a `declare` field) — so the manifest
     // marks it x-spec-kitty-property-only AND x-spec-kitty-property-reset, and the React
     // generator routes it through useProperties() instead of dropping it under ssrSafe
     // (research.md R4; WP02 depends on this exact shape).
     options: { attribute: false },
     ```
  2. Add the field declaration WITH ITS INITIALIZER — **no `declare`, no constructor assignment**:
     ```ts
     /** Suggested values shown in a native datalist alongside the input. A typed value matching
      *  no option stays valid unless a forwarded constraint says otherwise — this is a
      *  suggestion list, not a closed set. */
     options: ReadonlyArray<{ value: string; label?: string }> = Object.freeze([]);
     ```
     Do NOT also add `this.options = Object.freeze([]);` to the constructor — the field
     initializer above already runs at construction time; a constructor assignment would be
     redundant at best and, if it ever diverged from the initializer, a confusing second source of
     the same default.
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
  4. Add the `list` binding to the `<input>`: `list=${this.options?.length ? 'options' : nothing}`
     — **use `?.`, not a bare `.length`** (post-squad correction: the field initializer covers the
     default case, but a consumer assigning `el.options = undefined` from untyped JS/markup would
     otherwise throw on `.length`). Omit `list` entirely when there are no options, so an empty,
     pointless `<datalist>` is never referenced (and SC-005's node-identity assertion has a clean
     "absent" case to check against, not just a "present" one).
  5. Render the datalist conditionally, immediately after the `<input>` (still inside the
     `part="field"` wrapper, before the description/error spans — order does not matter
     semantically, but keep it visually adjacent to the control it serves):
     ```ts
     ${this.options?.length
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
  2. Add one test for `readonly` — **NOT the same pattern as the other six, post-squad**: since
     `readonly` does not reflect (T002), only assert attribute→property (`el.setAttribute
     ('readonly', '')` → `el.readonly === true`) and the render binding
     (`control(el).hasAttribute('readonly')`). Do **not** assert property→attribute
     (`el.readonly = true` making `el.hasAttribute('readonly')` true) — that direction is
     deliberately absent; asserting it would either fail correctly (proving the point) or, if
     written carelessly against the WRONG element instance, pass for the wrong reason. Write it as
     an explicit `expect(el.hasAttribute('readonly'), 'readonly is deliberately NOT
     reflected').toBe(false)` after `el.readonly = true`, so the absence is a stated assertion, not
     a gap nobody checked.
  3. Register each new mutation in `mutations.json`/`behaviours.json` NOW is deferred to T008 —
     write the tests here assuming ids will exist, and come back to fill in the exact
     `[SC-0xx]` tag in the test name once T008 assigns them (do not leave a TODO placeholder in
     committed code — the two subtasks should be done close together, in the same sitting).
- **Files**: `fixtures/elements-behaviour/src/sk-form-input.test.ts`.
- **Parallel?**: No.
- **Notes**: Follow the file's existing `mount()`/`control()` helpers; do not write a second
  mounting helper.

### Subtask T006 – Behaviour tests: merged-validity real-submit, message text, readonly split, post-reset — **expanded, post-squad, two new arms added**

- **Purpose**: The tests a reviewer will read first, because they assert the actual defects this
  mission fixes — and, post-squad, the tests that must ALSO cover the two CRITICAL defects T003
  now fixes (read-before-write ordering; the `setValidity` throw), plus the post-reset case.
- **Steps**:
  1. **FR-002/SC-002 test, mount-time arm** — SC-002's own text requires a REAL form submit, not a
     `validity` read. Follow the existing `[SC-002]` test's three-witness style
     (FormData/spy/no-light-DOM) as a model, adapted:
     - Mount with `pattern="[a-z]+"` and `value="123"` set as part of mounting (fails the
       pattern from the start).
     - Assert `el.validity.patternMismatch === true` (necessary but NOT sufficient).
     - Assert `el.checkValidity() === false`.
     - Attach a `submit` listener to the `<form>`, call `form.requestSubmit()`, and assert the
       listener NEVER FIRES (a blocked submit fires no `submit` event at all).
     - **Assert the message reaches the `role="alert"` node**: read the error span's `textContent`
       (or `el.errorMessage`) and assert it is a NON-EMPTY, flag-appropriate string — not merely
       that `el.validity.patternMismatch` is `true`. This is new: an earlier version of this test
       only checked the flag, which would not have caught `setValidity(flags, '')` throwing (the
       throw happens regardless of what the FLAG says; only reading the message/DOM state proves
       the call actually succeeded).
     - Repeat with a valid value and assert the listener DOES fire — a test that only ever
       submits invalid data does not prove the valid path still works.
  2. **FR-002/SC-002 test, POST-MOUNT MUTATION arm — new, this is the arm that catches the
     read-before-write ordering defect**: mount `sk-form-input` with `pattern="[a-z]+"` and a
     VALID initial value (e.g. `"abc"`). Await `el.updateComplete`. THEN, in a SEPARATE step,
     assign `el.value = '123'` (fails the pattern) — a plain property assignment, not part of the
     initial mount. Await `el.updateComplete` again. Assert exactly the same things as step 1:
     `validity.patternMismatch === true`, `checkValidity() === false`, a blocked `submit`, AND a
     non-empty message. **This arm is the one that reds without T003's sync-before-read step** — a
     merge that only re-checks validity at mount time would pass step 1 and fail this one
     silently if this arm did not exist. Do not skip it.
  3. **FR-002 message-fallback test**: trigger a UA flag with NEITHER `required` nor a
     `customError` also true (e.g. the `pattern` mismatch case above, on a NON-required field) and
     assert `setValidity` did not throw (the test simply completing without an unhandled rejection
     is itself part of the assertion — `await el.updateComplete` resolving is the proof) AND that
     `el.errorMessage`/the alert node's text is non-empty. This is the direct regression test for
     the `setValidity(flags, '')` throw — write it so it FAILS (throws, or the awaited promise
     rejects) against the un-fixed code, not merely so it fails an assertion.
  4. **FR-003/SC-003 test** — mount `required readonly`, leave `value` empty:
     - Assert `el.validity.valid === true` (barred, not merely passing).
     - Assert `el.checkValidity() === true`.
     - Assert `new FormData(form).has('<the name attribute used>')` — the value (empty string) IS
       present as a form entry, unlike the existing `disabled` test where the key is absent
       entirely. This is the exact line that distinguishes `readonly` from `disabled` — get the
       assertion backwards and the test would pass for the WRONG reason.
     - Add a second arm: `required readonly` with a NON-empty value that fails a `pattern` also
       set on the element — assert this ALSO stays valid (`el.validity.valid === true`), which is
       the spec.md table's fourth row ("pattern mismatch + readonly") and the subtlest one: it
       proves T002's early return happens BEFORE T003's merge code ever runs, not merely that the
       required-empty case is barred.
     - **New, post-squad**: assert `el.hasAttribute('readonly') === false` even after
       `el.readonly = true` (or however the test sets it) — confirming the reflection decision
       from T002 is actually in effect, not merely documented in a comment.
  5. **FR-004/SC-004 post-reset arm — new, this is the arm that catches the SAME ordering defect
     at a different call site**: mount inside a `<form>` with `required`, type/assign an invalid
     value (e.g. leave it empty, or set a `pattern`-failing value), confirm `el.validity.valid
     === false` first. Call `form.reset()`. Assert `el.validity.valid === true` immediately after
     (no extra `updateComplete` beyond what reset itself triggers), and that the error node's text
     is empty/`aria-invalid` is `"false"`. **Without T003's sync-before-read fix, this arm reds**:
     the reset restores `this.value` via `formResetCallback`, which goes through the same
     `willUpdate → validate()` path, and validity would otherwise be computed against the
     PRE-reset DOM state.
- **Files**: `fixtures/elements-behaviour/src/sk-form-input.test.ts`.
- **Parallel?**: No.
- **Notes**: If any test passes on the FIRST attempt with no corresponding code change, that is a
  signal the test is not actually exercising the new code path — deliberately break the
  implementation (comment out the sync-before-read step, the merge loop, the fallback-message
  step, or the readonly branch, one at a time) and confirm the RIGHT test reds for each, before
  finalizing, per the charter's red-before-green requirement. Step 2 (post-mount mutation) and
  step 5 (post-reset) are the two arms a squad found ABSENT from an earlier version of this WP and
  are the ones most likely to be checked for their actual presence, not just their intent.

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

### Subtask T008 – Registry ARMS under EXISTING ids + Storybook story arms — **corrected: the id space is CLOSED, post-squad**

- **Purpose**: Every new mutation anchor from T002/T003/T004/T007 needs a real `(id, subject)`
  entry so `suite-selftest.mjs`/`floor-reporter.mjs` can enforce it; every new interactive state
  needs a story per the charter's Testing policy.
- **An earlier version of this subtask said `SC-016`–`SC-022` were free to use — that was WRONG,**
  and the squad that found it did so by checking the test that actually gates the registry, not
  just the registry's current contents. `tests/node/config-contract.test.ts`'s
  `'[registry] behaviours.json declares exactly ADR-11's applicable behaviours'` test hard-codes
  the applicable set as a literal array — EXACTLY `SC-002` through `SC-015`, 14 entries — and
  asserts exact equality (`[...declared].sort()).toEqual([...expected].sort())`), with a second
  test asserting the sole inapplicable id is `SC-023`. **No new id may be added to
  `behaviours.json` at all.** Confirm this yourself before proceeding:
  `grep -n "SC-002.*form association" -A 20 tests/node/config-contract.test.ts` and read the
  `expected` array.
- **Steps**:
  1. Read `behaviours.json`'s `$comment` block in full (it explains the SUBJECTS mechanism and the
     applicable/inapplicable split) before adding entries.
  2. Add every new mutation anchor as a NEW **ARM** under an EXISTING `(id, subject)` pair already
     declared for `sk-form-input` in `mutations.json` — do not create a new top-level id anywhere.
     `mutations.json` already carries five for this subject: `SC-002` (FormData entry tracks the
     property), `SC-003` (validity message reaches the a11y tree), `SC-004` (reset restores the
     seeded value), `SC-005` (disabled excluded — two arms already), `SC-013` (parts present).
     Recommended mapping (research.md R6 — three of these are confident fits, one is a judgement
     call, flagged below):
     - **`SC-003`** — new arm: "a merged UA validity flag (pattern/range/step/type/badInput)
       reaches the host and blocks a real submit, with a non-empty message" (T003/T006 step 1-3).
     - **`SC-002`** — new arm: "a readonly control's value still reaches FormData" (T002/T006
       step 4, the submission half of the readonly behaviour).
     - **`SC-003`** — a SECOND new arm on the same id: "a readonly control is barred from
       constraint validation and reports no message, even with a failing pattern present"
       (T002/T006 step 4, the barring half — same category as the merge arm above: both are about
       validity/message reaching, or correctly NOT reaching, the a11y tree).
     - **`SC-004`** — new arm: "a form reset that restores a satisfying value reports valid
       immediately, not the pre-reset invalid state" (T003/T006 step 5).
     - **Datalist node-identity reachability (T004/T007) and constraint-attribute forwarding
       reaching the inner control (T001/T005) do NOT map cleanly onto any of the 14 existing
       categories.** This is a judgement call, not a settled fact — research.md R6 suggests
       `SC-013` (the "styling API/targetable node" category — a `<datalist>` referenced by `list`
       is the closest analog to a targetable `::part()`) as the least-wrong fit, but you may
       choose differently if you have a better argument. Whatever you choose, WRITE DOWN the
       reasoning in that arm's description and flag it explicitly for the pre-merge squad as a
       judgement call — do not present it as an obvious fit it is not.
  3. Add each new ARM to BOTH `behaviours.json` (if the arm needs its own summary line — check the
     existing shape for `SC-005`'s two arms as a model) and `mutations.json` (the `from`/`to`
     mutation targeting the exact line in `sk-form-input.ts` your code added, with a NEW `arm`
     string distinguishing it from the id's existing arm(s)).
  4. Run the existing self-test/registry gates locally before moving on: find and run whatever
     this repo's own mutation-harness entry point is (check `package.json`/CI for a `mutation` or
     `suite-selftest` script name) and confirm the new arms are picked up and that
     `suite-selftest.mjs` guard 5 does not flag anything you added as collateral. Also re-run
     `tests/node/config-contract.test.ts` directly — it must still pass with the SAME applicable-id
     list as before (you added ARMS, not ids, so the id-level test should be unaffected; if it is
     NOT unaffected, you added an id by mistake).
  5. Add Storybook story arms to `sk-form-input.stories.ts`: one showing `pattern`/`min`/`max`/
     `step` constraints with an invalid initial value (visibly showing the error state), one
     showing `readonly` (visibly NOT showing an error even though empty+required), one showing
     `options`/datalist. Include a `LightMode` variant for each new arm using `class="sk-light"`
     (C-005 — never `data-theme`), matching the file's existing story conventions.
- **Files**: `mutations.json`, `behaviours.json`, `packages/elements/src/form-input/sk-form-input.stories.ts`.
- **Parallel?**: No.
- **Notes**: This is the subtask WP02's T009 (manifest regen) and T013 (registry reconciliation
  note) both read from — leave the ARMS stable once written; do not restructure after WP02 has
  started. If in doubt about whether something is an "arm" or a new "id," the answer given the
  closed-set gate above is always: it is an arm.

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

- **The read-before-write ordering trap (FR-002) — CRITICAL, this is what got the mission
  BLOCKED once already**: a merge that reads `control.validity` WITHOUT first syncing the
  control's own DOM state (T003 step 1) computes against the PREVIOUS render, not the current
  one — invisible at mount time and on user-typed input, only breaking programmatic assignment.
  Mitigation is procedural: T006's POST-MOUNT MUTATION arm (step 2) must exist and must red
  without T003 step 1's sync code present.
- **The `setValidity` throw trap (FR-002) — CRITICAL, also newly found**: calling `setValidity`
  with a true flag and an empty message throws, silently dropping the field from `FormData` with
  no visible error. Mitigation: T006's message-fallback test (step 3) must exist and must
  demonstrably red (a rejected/thrown `updateComplete`) without T003 step 3's fallback-message
  code present.
- **The merge-vs-replace trap (FR-002), original finding, still real**: a plausible-looking fix
  that reads `control.validity` but never calls `setValidity` with the merged flags (e.g. only
  checks the flag for a `console.warn` or an internal-only property) would leave T006's tests red
  — good, that is the test working. Do not consider T003 done until T006's tests are GREEN with
  the fix ABSENT-then-PRESENT both observed.
- **The readonly-flags-still-compute trap (FR-003)**: reading `control.validity.patternMismatch`
  on a readonly control and acting on it (even just to log it) reproduces the wrong contract even
  with the right prose understanding in the comment. T002's early return must occur BEFORE any
  code from T003 runs — verify by trace, confirmed by T006's readonly test's `pattern`+`readonly`
  arm.
- **The readonly-reflection trap (FR-003) — reversed post-squad, do not re-reverse it**: reflecting
  `readonly` to the host attribute (an earlier design of this WP) lets the UA bar constraint
  validation on the attribute alone, making the element's own branch an unobservable, near-dead
  mutation anchor. If you find yourself reaching for `reflect: true` on `readonly` because it
  "seems more consistent" with the other new properties, stop — that consistency is exactly the
  trap; `readonly` is deliberately the ONE property here that does not follow T001's pattern,
  mirroring `disabled`'s own precedent.
- **Sequencing T002/T003 in the same method**: both edit `validate()`. Write T002 first (it is a
  pure early-return, nothing after it in the function can execute for a readonly control), then
  layer T003 underneath. If reviewing a diff that does this in the OTHER order, re-check by hand
  that the early return still precedes the merge.
- **The `options` field-shape trap (FR-005/NFR-001)**: declaring `options` with `declare` and a
  constructor default (matching every OTHER property in this file) type-checks identically to the
  required literal-initializer form and fails SILENTLY — the defect only surfaces in WP02, several
  steps later, as a missing manifest marker. Verify the field declaration has NO `declare` keyword
  and an inline `= Object.freeze([])` before considering T004 done.
- **Minting a new behaviour-id instead of an arm (T008)**: the closed-set gate
  (`config-contract.test.ts`) will red immediately if this happens, which is a fast, clear signal
  — but the FIX is "add the arm under an existing id," not "widen the hard-coded array," which
  would defeat the whole point of the gate the squad verified is there on purpose.
- **FR-007 scope creep**: it is tempting to "clean up" `sk-form-textarea.ts` while in the
  neighbourhood, especially now that its `readonly`/`autocomplete`/`inputmode` applicability is
  correctly understood. Do not. `sk-form-textarea.ts` is not in this WP's `owned_files`; touching
  it here would collide with any parallel work and is explicitly deferred to a future mission on
  #122 (research.md R5, corrected).

## Review Guidance

- Confirm each new doc comment (T001, T004) reads as CONSUMER-FACING prose (what the property
  does), with any maintainer rationale in `//` comments instead — `check-manifest-content.mjs`
  enforces presence, not tone, so this is a human review item.
- **Confirm `readonly` is NOT reflected** (`static properties` has no `reflect: true` on it) and
  that T005/T006 explicitly assert `hasAttribute('readonly') === false` after a property
  assignment — a reviewer should be able to point at the one line that would silently reintroduce
  the original, squad-caught defect if it regressed.
- Confirm T006's readonly test's FormData assertion checks PRESENCE (readonly) vs. the existing
  disabled test's ABSENCE — a reviewer should be able to point at the one line that would flip
  silently if T002's `syncFormValue()` reasoning were wrong.
- **Confirm T003's sync-before-read step exists and precedes the flag merge**, and that T006's
  post-mount-mutation and post-reset arms are both present, not just the mount-time arm — these
  are the tests a squad found missing once already.
- **Confirm every `setValidity` call site that could receive a true flag also has a guaranteed
  non-empty message** — trace the fallback-message branch by hand against each of
  `patternMismatch`/`rangeUnderflow`/`rangeOverflow`/`stepMismatch`/`typeMismatch`/`badInput`.
- Confirm T004's rationale comment is genuinely `//`, not folded into the class-level `/** */` —
  FR-005 explicitly requires this distinction and it is easy to get backwards when writing near
  the existing `/** */` block above `render()`.
- **Confirm the `options` field has a literal initializer, no `declare` keyword** — this is easy
  to miss in review because it looks identical in behaviour to the (wrong) alternative until
  WP02's generator output is inspected.
- Confirm `willUpdate()`'s extended condition (T002 step 6) does not accidentally drop
  `changed.has('value')` or `changed.has('disabled')` from the existing condition, and DOES
  include `changed.has('type')` — this is an ADD, not a REPLACE, of the trigger set.
- **Confirm T008 added ARMS to existing ids, not new ids** — run
  `tests/node/config-contract.test.ts`'s registry tests yourself if in doubt; do not take the diff
  at face value.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:37:18Z – system – Prompt created.
