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
> this file, re-read T002 and T003 in full (T004–T008 no longer exist as separate subtasks — merged into
> T001–T003, see the note above the Subtasks section) — they changed substantively, not
> cosmetically.

`sk-form-input` gains seven forwarded/native-constraint surfaces and a corrected `readonly`
contract, without regressing anything `fixtures/elements-behaviour/src/sk-form-input.test.ts`'s
existing `[SC-002]`..`[SC-005]`/`[SC-013]` tests already assert. Concretely, done means:

- `pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete` are reactive properties, reflected
  as attributes, forwarded to the inner `<input>`, each with its own published `/** */` doc
  comment (FR-001).
- `readonly` is a reactive property that does **NOT reflect** to the host attribute (reversed from
  an earlier design — see T002, which also carries the merged-validity fix). A readonly control's value still reaches `setFormValue()`; the
  control is barred from constraint validation (`internals.setValidity({})`, the ELEMENT's own
  doing) regardless of `required`/pattern/UA flags (FR-003). `disabled`'s existing behaviour —
  unreflected, `setFormValue(null)`, excluded — is UNCHANGED (FR-004): this is a guard to verify,
  not new code to write.
- `validate()` merges the inner control's own `ValidityState`'s `true` flags
  (`patternMismatch`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `typeMismatch`,
  `badInput`) into the flags object it already builds from `required`/`customError`, rather than
  replacing them (FR-002) — reading the control's validity ONLY after syncing its own DOM state to
  the CURRENT update (see T002), and with a non-empty fallback message whenever a UA flag is the
  only one true (see T002) — `setValidity` throws otherwise.
- An `options: ReadonlyArray<{ value: string; label?: string }>` property (no attribute, literal
  field initializer — see Subtask T003) drives a `<datalist>` rendered into the element's OWN
  shadow root, with the inner `<input>`'s `list` attribute resolving to it (FR-005). No
  filtering/sorting/fetching/inventing — the element renders exactly the given array (FR-006).
- Every new behaviour has a Vitest browser-mode test with a registered mutation anchor
  (`mutations.json`/`behaviours.json`), demonstrated red before green — not a render-only
  assertion (charter Testing policy, ADR-11 required-behaviour #1). **New anchors are registered
  as ARMS under EXISTING `(id, subject)` pairs** (`SC-002`/`SC-003`/`SC-004`/`SC-013` for
  `sk-form-input`) — `tests/node/config-contract.test.ts` hard-codes the applicable behaviour-id
  set as EXACTLY `SC-002`–`SC-015` and asserts exact equality, so **no new id may be added at
  all** (T004; this reverses the original guidance, which incorrectly said `SC-016`+ were free).
- `form-control-base.ts` gains **no change** for this mission — see Subtask T002's FR-007 check
  (the "nothing shared applies" premise was itself wrong, but the conclusion holds for different
  reasons).

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
   this file. The ONLY thing that may move here is a brand-new, UNANCHORED helper (see T002's FR-007 check).
8. `packages/elements/src/form-textarea/sk-form-textarea.ts` — read it once. **An earlier version
   of this WP told you to confirm that none of the seven new attributes apply to `<textarea>` —
   that claim is FALSE.** `readonly`/`autocomplete`/`inputmode` DO apply to `<textarea>` per the
   HTML Standard; only `pattern`/`min`/`max`/`step`/`list` are `<input>`-specific. Read T002's
   FR-007 check for why nothing still moves to the shared base despite this correction. Do not
   edit this file in this WP regardless.
9. `fixtures/elements-behaviour/src/sk-form-input.test.ts` — read the existing `[SC-002]` test in
   full before writing any test in T001-T003; it is the pattern every new test in this WP must follow (mount
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
    field has none. `options` (T003) must match this literal-initializer shape exactly — every
    OTHER property in `sk-form-input.ts` uses `declare` + constructor default, which is precisely
    why `options` is easy to get wrong by following this file's own established pattern.
12. `tests/node/config-contract.test.ts`, the two `'[registry] …'` tests — confirms the applicable
    behaviour-id set is hard-coded as EXACTLY `SC-002`–`SC-015` and the sole inapplicable id is
    `SC-023`. Read this before writing T004; it is the reason no new id may be added.

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

> **Merged post-squad, second pass (coordinator instruction).** The original 8-subtask split put
> every test in its own later subtask (T005–T008), which the coordinator identified as hardening
> exactly the defect this fold-in exists to prevent: "every subtask IS a test-writing subtask"
> stated as objective while three actual subtasks were pure test-writing, sequenced strictly AFTER
> the code they cover — red-before-green not structurally reachable (DIRECTIVE_034). Merged
> pairwise instead: **T001** (forwarding + its tests), **T002** (readonly + merged validity + their
> tests), **T003** (datalist + its tests), **T004** (registry arms + stories, unchanged — it is
> cross-cutting bookkeeping, not a test-writing phase for one concern). Each subtask below writes
> its test in the SAME subtask as its code, in the order: code, then the test that reds against the
> un-fixed code, then confirm green. Old subtask numbers T005–T008 no longer exist in this file;
> WP02 and the mission's other planning docs that referenced them have been updated to point at
> the new numbers (T001/T002/T003 respectively for what were T005/T006/T007; T004 for what was
> T008).

### Subtask T001 – Forward `pattern`/`min`/`max`/`step`/`inputmode`/`autocomplete`, with round-trip tests (FR-001/SC-001) — **merged with former T005**

- **Purpose**: Six of the seven new surfaces. Plain string properties, reflected attributes,
  forwarded verbatim to the inner `<input>` — the platform validates them; this element does not
  reinterpret them. SC-001 requires a round-trip test per member plus a mutation red for a dropped
  forwarding, written here alongside the code, not in a later subtask.
- **Steps — code**:
  1. In `static properties`, add: `pattern: { type: String, reflect: true }`, `min`, `max`,
     `step`, `inputmode`, `autocomplete` — same shape, all `{ type: String, reflect: true }`.
  2. Add a `declare` field with its own published `/** */` doc comment for each — one sentence
     naming what the attribute does and, where relevant, which input `type`s it is meaningful for
     (e.g. `min`/`max`/`step` on numeric/date-like types). `check-manifest-content.mjs` enforces
     every one of these has a doc comment; missing one fails CI, not just review.
  3. In `render()`, add the bindings to the `<input>`: `pattern=${this.pattern ?? nothing}`,
     `min=${this.min ?? nothing}`, `max=${this.max ?? nothing}`, `step=${this.step ?? nothing}`,
     `inputmode=${this.inputmode ?? nothing}`, `autocomplete=${this.autocomplete ?? nothing}`.
     Use Lit's `nothing` (import alongside `html`) rather than an empty string, so an unset
     property emits NO attribute at all — an empty `pattern=""` is itself a (trivially matching)
     pattern, not "no pattern".
  4. Do NOT gate these bindings on `this.type` — the platform itself ignores `min`/`max`/`step` on
     a `type` they do not apply to; element-side type-gating would be a second, possibly-wrong
     source of truth.
  5. This subtask does NOT touch `willUpdate()`'s `validate()`-triggering condition — T002 extends
     that, once there is a UA flag worth re-checking on a change to one of these.
- **Steps — test, `fixtures/elements-behaviour/src/sk-form-input.test.ts`**:
  6. Add one test per property (six tests, or one parameterized test producing six distinguishable
     mutation targets — `mutations.json` anchors are per-line, not per-test-name) asserting: the
     attribute set in markup reaches the property; the property set programmatically reaches the
     inner control as a real attribute on the `<input>` (`control(el).getAttribute('pattern') ===
     'x'`) — THIS is the actual forwarding assertion; a bare Lit-reflection round-trip alone would
     be testing the framework, not this element's code.
  7. Confirm each test REDS if you comment out its `render()` binding, then GREENS with it
     restored — do this before moving on, per red-before-green.
- **Files**: `packages/elements/src/form-input/sk-form-input.ts`,
  `fixtures/elements-behaviour/src/sk-form-input.test.ts`.
- **Parallel?**: No — same file as every other subtask in this WP.

### Subtask T002 – `readonly` (unreflected) + merged validity, with their tests (FR-002/SC-002, FR-003/SC-003, FR-004) — **merged with former T003 and T006, two CRITICAL defects fixed**

- **Purpose**: The mission's namesake defect and its corrected `readonly` contract, plus every test
  that proves both — written together so a broken fix reds immediately, not three subtasks later.
- **`readonly` reflection is REVERSED from an early design, post-squad measurement**: reflecting
  `readonly` to the HOST attribute on a form-associated custom element makes the UA itself bar
  constraint validation on the attribute alone (measured, both engines: `willValidate === false`,
  `internals.checkValidity() === true`, still submits, no `setValidity` call needed) — which would
  make this element's own barring branch an unobservable, near-dead mutation anchor (the SC-005
  collateral shape `disabled`'s own non-reflection already exists to avoid). Keep `readonly`
  unreflected, mirroring `disabled` exactly.
- **Two CRITICAL, engine-measured defects govern the merge logic, both reproduced by a post-tasks
  squad**:
  1. **Read-before-write ordering.** `validate()` runs from `willUpdate()`, which fires BEFORE
     `render()` commits this update's `.value=`/`pattern=`/etc. bindings to the live DOM. Reading
     `control.validity` without first syncing the control sees the PREVIOUS render — invisible at
     mount time and on user-typed input (the browser updates the live control synchronously on a
     keystroke), and only breaks PROGRAMMATIC assignment (`el.value = 'x'`) — precisely what the
     React wrapper and this WP's own tests do.
  2. **`setValidity(flags, '')` throws** when any flag is `true` and `message` is empty (measured,
     both engines): `updateComplete` rejects, `updated()`/`syncFormValue()` never run, the field
     silently vanishes from `FormData`. A form-associated custom element has no free UA-authored
     message the way a plain `<input>`'s `reportValidity()` bubble supplies.
- **Steps — code, `validate()` and `willUpdate()`**:
  1. Add `readonly: { type: Boolean }` to `static properties` — **no `reflect`**. `declare` field
     + doc comment stating the corrected contract (submitted, barred from constraint validation).
     Constructor: `this.readonly = false`. `render()`: add `?readonly=${this.readonly}` to the
     `<input>` — unaffected by the reflection decision; it drives the INNER control from the
     host's PROPERTY.
  2. `syncFormValue()` is UNCHANGED — `readonly` never touches it, only `disabled` does.
  3. In `validate()`, add a `readonly` early return AFTER the existing `disabled` branch:
     `this.internals.setValidity({}); this.invalid = false; this.errorMessage = ''; return;` —
     barred from constraint validation, value still submitted (unchanged `syncFormValue`).
  4. Extend `willUpdate()`'s trigger condition (currently `value`/`required`/`disabled`) to also
     fire on `readonly`, `pattern`, `min`, `max`, `step`, **and `type`** (added post-squad —
     `typeMismatch` is in the merge list below but nothing re-triggered `validate()` on a bare
     `type` change otherwise). `inputmode`/`autocomplete` carry no validity semantics and are
     excluded.
  5. AFTER the `disabled`/`readonly` early returns and after resolving
     `const control = this.shadowRoot?.querySelector('input') ?? undefined;` (reused, not
     re-queried), **sync the control's own DOM state to the current update BEFORE reading its
     validity** — fixes defect 1:
     ```ts
     if (control) {
       control.value = this.value;
       control.type = this.type;
       control.pattern = this.pattern ?? '';
       control.min = this.min ?? '';
       control.max = this.max ?? '';
       control.step = this.step ?? '';
     }
     ```
     Amend the `willUpdate` rationale comment block at the top of this method to explain this sync
     step — do not contradict its existing "no second render pass" claim; this sync is what
     PRESERVES it once the merge reads live DOM state. (Rejected alternative, recorded: moving
     `validate()` to `updated()` instead — risks reproducing this file's own documented historical
     bug, where a reactive-property write from `updated()` schedules a second update cycle.)
  6. Merge UA flags into the local `flags` object, corrected list: `patternMismatch`,
     `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `typeMismatch`, `badInput` (ADDED —
     reachable today via `type="number"` with no new attribute, e.g. `12e` → `badInput: true`;
     exactly the "looks fine, silently submits rejected data" case). `tooLong`/`tooShort` DROPPED
     (unreachable — nothing forwards `maxlength`/`minlength`). Do NOT merge `valueMissing` — stays
     element-derived.
  7. Before calling `setValidity`, fix defect 2: if `flags` has any true entry and `message` is
     still `''` after the existing `required`/`customError` checks, assign a fallback message keyed
     by the first true flag (`patternMismatch` → "Value does not match the required pattern.",
     `rangeUnderflow`/`rangeOverflow` phrased against `this.min`/`this.max`, `stepMismatch`,
     `typeMismatch`, `badInput` → each a plain sentence). `customError` still wins the announced
     message when both hold, unchanged.
- **Steps — tests, same file, added alongside the code above**:
  8. **Mount-time real-submit test**: mount with `pattern="[a-z]+"` and a failing value; assert
     `validity.patternMismatch === true`, `checkValidity() === false`, a `submit` listener on the
     `<form>` NEVER fires on `form.requestSubmit()`, and the error node's text is non-empty (not
     merely that the flag is set). Repeat with a valid value; the listener DOES fire.
  9. **Post-mount MUTATION arm — the one that catches defect 1**: mount with `pattern="[a-z]+"`
     and a VALID value; await `updateComplete`. THEN, separately, `el.value = '123'` (fails);
     await `updateComplete` again. Assert the same things as step 8. This arm reds without step 5's
     sync — do not skip it.
  10. **Message-fallback test — the one that catches defect 2**: trigger a UA flag with neither
      `required` nor `customError` true; assert `updateComplete` resolves without throwing/rejecting
      and the error node's text is non-empty.
  11. **`readonly` test**: mount `required readonly`, empty value — `validity.valid === true`,
      `checkValidity() === true`, `FormData` HAS the (empty-string) entry (unlike `disabled`,
      where the key is absent — get this assertion direction right). Second arm: `required
      readonly` with a value that ALSO fails a `pattern` — still valid, proving the early return
      precedes the merge. Assert `el.hasAttribute('readonly') === false` even after
      `el.readonly = true` — confirms the reflection decision is actually in effect.
  12. **Post-reset arm — same root cause as defect 1, different call site**: mount inside a
      `<form>` with `required`, produce an invalid state, confirm `validity.valid === false`. Call
      `form.reset()`. Assert `validity.valid === true` immediately (reset restores a satisfying
      value via `formResetCallback`, which goes through the same `willUpdate → validate()` path —
      step 5's fix resolves this for free, but it needs its own test).
  13. For every test above: confirm it REDS with the corresponding code removed (the sync step,
      the merge loop, the fallback message, the readonly branch), then GREENS restored — do this
      per DIRECTIVE_034 before considering the subtask done.
- **FR-007 check (do this before moving on)**: an earlier draft claimed "none of the seven new
  attributes apply to `<textarea>`" — FALSE. `readonly`/`autocomplete`/`inputmode` apply to
  `<textarea>` too; only `pattern`/`min`/`max`/`step`/`list` are `<input>`-specific. The CONCLUSION
  is still: move nothing to `form-control-base.ts` this mission. Sharing would surface as
  INHERITED manifest members on `sk-form-textarea` regardless of its `render()`, silently
  violating NFR-003, and `build-react-wrappers.mjs`'s `EXPECTED_NON_PROP_FIELDS` map has no
  mechanism to suppress a shared property from one subclass's wrapper while keeping it on the
  other's. `sk-form-textarea.ts` is outside this mission's `owned_files`; record this as a future
  #122 candidate, do not act on it here. If the flag-merge loop itself looks like a candidate for
  a genuinely shared, UNANCHORED helper (taking an explicit per-element key list, since
  `<textarea>`'s own mergeable set differs), that is a narrower, defensible base-file addition —
  decide and record which way you went.
- **Files**: `packages/elements/src/form-input/sk-form-input.ts`,
  `fixtures/elements-behaviour/src/sk-form-input.test.ts`, and OPTIONALLY
  `packages/elements/src/form-control-base.ts` per the FR-007 check ONLY for a narrow unanchored
  helper — never for `readonly`/`autocomplete`/`inputmode` themselves.
- **Parallel?**: No. Sequence within this subtask: readonly branch first (pure early return),
  then the sync step, then the merge loop, then the fallback message — each is a precondition for
  the next, and writing them out of order risks dead code or an unreachable test.

### Subtask T003 – Shadow-root `<datalist>`, `options` property, rationale comments, with its tests (FR-005/SC-005, FR-006) — **merged with former T007, field shape corrected**

- **Purpose**: The datalist half of the mission, and the piece that also has to survive React's
  `ssrSafe` boundary (WP02's job; the property SHAPE is decided here).
- **The field declaration is NOT the same shape as every other property in this file, and that
  difference is load-bearing**: every OTHER property here is `declare name: Type;` with a
  constructor default. `options` must be a PLAIN CLASS FIELD WITH A LITERAL INITIALIZER, matching
  `sk-transition-matrix.ts`'s `columns`/`routes` EXACTLY
  (`columns: ReadonlyArray<TransitionColumn> = Object.freeze([]);`) — because
  `scripts/normalise-manifest.mjs`'s `hasFrozenEmptyArrayInitializer()` reads the field's AST
  initializer directly to mark `x-spec-kitty-property-reset`; a `declare` field has none. Getting
  this wrong is silent at the TypeScript level and only surfaces as a missing manifest marker in
  WP02, several steps later.
- **Steps — code**:
  1. Add to `static properties`: `options: { attribute: false },` — property-only, per
     `propertyOnlyFields()`'s AST walk.
  2. Add the field WITH its initializer, no `declare`, no constructor assignment:
     ```ts
     /** Suggested values shown in a native datalist alongside the input. A typed value matching
      *  no option stays valid unless a forwarded constraint says otherwise — this is a
      *  suggestion list, not a closed set. */
     options: ReadonlyArray<{ value: string; label?: string }> = Object.freeze([]);
     ```
  3. In `render()`, above the `<input>` binding, add `//` rationale comments (house style: see the
     ARRANGEMENT B block at the top of the file) explaining: `<input list="x">` resolves `x` in
     the input's own tree (MDN "Reflected attributes § Reflected element references" — the same
     rule ADR-9 already cites for `aria-labelledby`); the input lives in this shadow root under
     Arrangement B, so neither a consumer's light-DOM nor a slotted `<datalist>` can ever be
     referenced; a fixed id (`"options"`) is safe because each instance has its own shadow root.
  4. Add `list=${this.options?.length ? 'options' : nothing}` to the `<input>` — **use `?.`, not a
     bare `.length`** (a consumer assigning `undefined` must not throw). Omit `list` entirely when
     empty, so an empty `<datalist>` is never referenced.
  5. Render the datalist conditionally, immediately after the `<input>`:
     ```ts
     ${this.options?.length
       ? html`<datalist id="options">
           ${this.options.map(
             (o) => html`<option value=${o.value} label=${o.label ?? nothing}></option>`,
           )}
         </datalist>`
       : ''}
     ```
  6. No filtering, sorting, or "closest match" logic (FR-006) — render exactly the given array, in
     order. Nothing in `validate()` should read `this.options` at all.
- **Steps — tests, `fixtures/elements-behaviour/src/sk-form-input.test.ts`**:
  7. Mount with two options; assert `control(el).list === el.shadowRoot!.querySelector
     ('datalist')` — NODE IDENTITY, not attribute-string equality (a string match would pass even
     if `list` pointed at a same-id node in the WRONG root, or at nothing). Assert children count
     and the second option's `label`.
  8. Assert the ABSENT case: default (no options set) — `control(el).list` is `null`, no
     `<datalist>` element exists.
  9. FR-006 test: set `el.value` to a string matching no option's `value`, no other constraint set
     — `validity.valid === true`.
  10. Confirm the node-identity test reds if you swap the `list=` binding's id or omit the
      `<datalist>` conditionally-rendered block, then greens restored.
- **Files**: `packages/elements/src/form-input/sk-form-input.ts`,
  `fixtures/elements-behaviour/src/sk-form-input.test.ts`.
- **Parallel?**: No.

### Subtask T004 – Registry ARMS under EXISTING ids + Storybook story arms — **unchanged position, corrected: the id space is CLOSED, post-squad**

- **Purpose**: Every new mutation anchor from T001–T003 needs a real `(id, subject)` entry so
  `suite-selftest.mjs`/`floor-reporter.mjs` can enforce it; every new interactive state needs a
  story per the charter's Testing policy. Kept as its own subtask (not merged into T001–T003)
  because it is cross-cutting bookkeeping across all three, not a test-writing phase for one
  concern — run it once, after all three code+test subtasks land, so ids/arms are assigned
  against final line numbers.
- **An earlier version of this subtask said `SC-016`–`SC-022` were free — WRONG.**
  `tests/node/config-contract.test.ts`'s two `'[registry] …'` tests hard-code the applicable set as
  EXACTLY `SC-002`–`SC-015` (exact equality) and the sole inapplicable id as `SC-023`. **No new id
  may be added to `behaviours.json` at all.** Confirm: `grep -n "SC-002.*form association" -A 20
  tests/node/config-contract.test.ts`.
- **Steps**:
  1. Read `behaviours.json`'s `$comment` block (SUBJECTS mechanism, applicable/inapplicable split).
  2. Add each new mutation anchor as a NEW ARM under an EXISTING `(id, subject)` pair for
     `sk-form-input` — never a new id. Recommended mapping (research.md R6 — three confident, one
     judgement call flagged explicitly for the pre-merge squad, left as-is per the coordinator):
     - **`SC-003`** — new arm: merged UA validity flag reaches the host and blocks a real submit,
       with a non-empty message (T002 steps 6-7/8-10).
     - **`SC-002`** — new arm: readonly's value still reaches FormData (T002 step 3/11, submission
       half).
     - **`SC-003`** — second new arm: readonly is barred from validation with no message, even
       with a failing pattern present (T002 step 3/11, barring half).
     - **`SC-004`** — new arm: a reset that restores a satisfying value reports valid immediately
       (T002 step 5/12).
     - **`SC-013`** — new arm, JUDGEMENT CALL, flagged for the pre-merge squad rather than
       presented as settled: datalist node-identity reachability and/or constraint-forwarding
       reaching the inner control (T001/T003) do not map cleanly onto any of the 14 ADR-11
       categories; `SC-013` ("styling API/targetable node") is the least-wrong fit available
       under the closed-set gate. No ADR resolves this and none should be invented to.
  3. Add each arm to BOTH `behaviours.json` and `mutations.json` (the `from`/`to` mutation
     targeting the exact line your code added).
  4. Run the mutation-harness self-test locally; confirm `suite-selftest.mjs` guard 5 flags
     nothing added as collateral, and re-run `tests/node/config-contract.test.ts` — the applicable
     id list must be UNCHANGED (you added arms, not ids).
  5. Add Storybook story arms to `sk-form-input.stories.ts`: constraints with an invalid initial
     value (visible error state), `readonly` (visibly NOT erroring even empty+required),
     `options`/datalist. `LightMode` variant per arm using `class="sk-light"` (C-005 — never
     `data-theme`).
- **Files**: `mutations.json`, `behaviours.json`,
  `packages/elements/src/form-input/sk-form-input.stories.ts`.
- **Parallel?**: No.

## Test Strategy

- Every subtask T001–T003 above writes its test in the SAME subtask as its code — merged
  post-squad specifically so red-before-green is structurally reachable (DIRECTIVE_034), not
  merely stated as intent. T004 is the one subtask with no new test of its own (registry
  bookkeeping + stories over code already tested in T001–T003).
- Run `npx vitest run fixtures/elements-behaviour/src/sk-form-input.test.ts` (browser-mode
  project) after EVERY subtask, not only at the end.
- Before finalizing T004's registry entries, temporarily revert each corresponding code change
  (comment it out) and confirm the paired test reds — this is the literal mechanism
  `mutations.json` automates going forward, but doing it once by hand here is the fastest way to
  catch a test that was accidentally asserting something already true before your change.

## Risks & Mitigations

- **The read-before-write ordering trap (FR-002) — CRITICAL, this is what got the mission
  BLOCKED once already**: a merge that reads `control.validity` WITHOUT first syncing the
  control's own DOM state (T002 step 5) computes against the PREVIOUS render, not the current
  one — invisible at mount time and on user-typed input, only breaking programmatic assignment.
  Mitigation is procedural: T002's POST-MOUNT MUTATION test arm (step 9) must exist and must red
  without step 5's sync code present.
- **The `setValidity` throw trap (FR-002) — CRITICAL, also newly found**: calling `setValidity`
  with a true flag and an empty message throws, silently dropping the field from `FormData` with
  no visible error. Mitigation: T002's message-fallback test (step 10) must exist and must
  demonstrably red (a rejected/thrown `updateComplete`) without step 7's fallback-message code
  present.
- **The merge-vs-replace trap (FR-002), original finding, still real**: a plausible-looking fix
  that reads `control.validity` but never calls `setValidity` with the merged flags (e.g. only
  checks the flag for a `console.warn` or an internal-only property) would leave T002's tests red
  — good, that is the test working. Do not consider T002 done until its own tests are GREEN with
  the fix ABSENT-then-PRESENT both observed.
- **The readonly-flags-still-compute trap (FR-003)**: reading `control.validity.patternMismatch`
  on a readonly control and acting on it (even just to log it) reproduces the wrong contract even
  with the right prose understanding in the comment. T002's readonly early return (step 3) must
  occur BEFORE the sync/merge code (steps 5-7) runs — verify by trace, confirmed by step 11's
  `pattern`+`readonly` arm.
- **The readonly-reflection trap (FR-003) — reversed post-squad, do not re-reverse it**: reflecting
  `readonly` to the host attribute (an earlier design of this WP) lets the UA bar constraint
  validation on the attribute alone, making the element's own branch an unobservable, near-dead
  mutation anchor. If you find yourself reaching for `reflect: true` on `readonly` because it
  "seems more consistent" with the other new properties, stop — that consistency is exactly the
  trap; `readonly` is deliberately the ONE property here that does not follow T001's pattern,
  mirroring `disabled`'s own precedent.
- **Sequencing within T002**: readonly branch first (pure early-return, nothing after it can
  execute for a readonly control), then the sync step, then the merge loop, then the fallback
  message — each is a precondition for the next. Writing them out of order risks dead code or an
  unreachable test.
- **The `options` field-shape trap (FR-005/NFR-001)**: declaring `options` with `declare` and a
  constructor default (matching every OTHER property in this file) type-checks identically to the
  required literal-initializer form and fails SILENTLY — the defect only surfaces in WP02, several
  steps later, as a missing manifest marker. Verify the field declaration has NO `declare` keyword
  and an inline `= Object.freeze([])` before considering T003 done.
- **Minting a new behaviour-id instead of an arm (T004)**: the closed-set gate
  (`config-contract.test.ts`) will red immediately if this happens, which is a fast, clear signal
  — but the FIX is "add the arm under an existing id," not "widen the hard-coded array," which
  would defeat the whole point of the gate the squad verified is there on purpose.
- **FR-007 scope creep**: it is tempting to "clean up" `sk-form-textarea.ts` while in the
  neighbourhood, especially now that its `readonly`/`autocomplete`/`inputmode` applicability is
  correctly understood. Do not. `sk-form-textarea.ts` is not in this WP's `owned_files`; touching
  it here would collide with any parallel work and is explicitly deferred to a future mission on
  #122 (research.md R5, corrected).

## Review Guidance

- Confirm each new doc comment (T001, T003) reads as CONSUMER-FACING prose (what the property
  does), with any maintainer rationale in `//` comments instead — `check-manifest-content.mjs`
  enforces presence, not tone, so this is a human review item.
- **Confirm `readonly` is NOT reflected** (`static properties` has no `reflect: true` on it) and
  that T002's tests explicitly assert `hasAttribute('readonly') === false` after a property
  assignment — a reviewer should be able to point at the one line that would silently reintroduce
  the original, squad-caught defect if it regressed.
- Confirm T002's readonly test's FormData assertion checks PRESENCE (readonly) vs. the existing
  disabled test's ABSENCE — a reviewer should be able to point at the one line that would flip
  silently if the `syncFormValue()` reasoning were wrong.
- **Confirm T002's sync-before-read step exists and precedes the flag merge**, and that its
  post-mount-mutation and post-reset test arms are both present, not just the mount-time arm —
  these are the tests a squad found missing once already.
- **Confirm every `setValidity` call site that could receive a true flag also has a guaranteed
  non-empty message** — trace the fallback-message branch by hand against each of
  `patternMismatch`/`rangeUnderflow`/`rangeOverflow`/`stepMismatch`/`typeMismatch`/`badInput`.
- Confirm T003's rationale comment is genuinely `//`, not folded into the class-level `/** */` —
  FR-005 explicitly requires this distinction and it is easy to get backwards when writing near
  the existing `/** */` block above `render()`.
- **Confirm the `options` field has a literal initializer, no `declare` keyword** — this is easy
  to miss in review because it looks identical in behaviour to the (wrong) alternative until
  WP02's generator output is inspected.
- Confirm `willUpdate()`'s extended condition (T002 step 4) does not accidentally drop
  `changed.has('value')` or `changed.has('disabled')` from the existing condition, and DOES
  include `changed.has('type')` — this is an ADD, not a REPLACE, of the trigger set.
- **Confirm T004 added ARMS to existing ids, not new ids** — run
  `tests/node/config-contract.test.ts`'s registry tests yourself if in doubt; do not take the diff
  at face value.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:37:18Z – system – Prompt created.
