# Mission Specification: sk-form-field Form Association

**Mission:** `sk-form-field-form-association-01M1K9GA` · **Issue:** #74 · part of epic #66
**Branch:** `mission/sk-form-field-form-association` off `train/elements-first`
**Squad tier:** A — post-spec, post-plan, post-tasks **and** pre-merge · 4 lenses
**Governing decisions:** ADR-9 §4 (label ownership, settled from evidence), ADR-8, ADR-10 §1/§2/§5, ADR-11

## Why this mission exists

Form participation is the one capability a custom element does not get for free. An `<input>`
inside a shadow root **does not participate in an outer form**: ADR-9's SP-5 probe submitted a
form containing four arrangements and got back keys `["a", "d"]` — arrangement B contributed
nothing at all. It is also the one place where the accessible-name machinery and the submission
machinery pull in opposite directions, which is why the ADR settled it with four real elements
and an axe run rather than with a preference.

The catalogue's form surface today is **eight exported HTML strings** in
`packages/styles/src/form-field/index.ts` — `SkFormInputDefaultHTML`, `…Focus`, `…Error`,
`…Disabled`, `…Filled`, `SkFormTextareaDefaultHTML`, `…Error`, plus `SkFormFieldHTML` — each a
complete `<div class="sk-form-field">` with a hand-written `for`/`id` pair, and one of them
carrying `class="sk-input is-focused"` to fake a state the browser owns. Every state is a
separate copy of the markup. That is the duplication this programme exists to remove, and it is
worse here than elsewhere because each copy contains an id a consumer must not collide with.

## SETTLED — not re-litigated

ADR-9 §4 chose **arrangement B plus `static formAssociated = true` and `ElementInternals`**:
the shadow root owns both the label and the control, and the label text is a component property.

| Arrangement | axe | Submits |
|---|---|---|
| A — light DOM, element renders label + control into itself | pass | yes |
| **B — shadow root owns both; label is a property** | **pass** | **no, unless form-associated** |
| C — consumer supplies `<label>`, control in shadow | **fail** | — |
| D — form-associated host labelled by a light-DOM `<label for>` | **fail** | yes |

C and D fail because axe resolves `aria-labelledby` from the *attribute* and scopes ID lookups
to `getRootNode()`; labelling the host does not label the inner control. Reference Target, the
standards fix that would make C viable, is Baseline *limited* and Chromium-only — not planned
against. **This mission implements that decision. It does not re-open it, and it writes no ADR
(C-003).**

### What #71 already proved, and what this mission owes it

`fixtures/elements-behaviour/src/sk-behaviour-fixture.ts` is a *synthetic* form-associated
element built to exercise SC-002…SC-005. It works, it is mutation-proven, and its structure is
the reference: one `#syncFormValue()` call site for `setFormValue`, `formResetCallback`,
`formDisabledCallback`, and `setValidity` with an anchor element so the message reaches the
accessibility tree.

Those four behaviour ids were written **for this mission's subject**. Since #73 the registry
carries a `subjects` dimension and `tests/node/config-contract.test.ts` derives the obligation
from the element glob, so this mission does not merely *may* claim them — a new element that
does not appear as a subject fails the node lane.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A field submits its value in a real form (Priority: P1)

A consumer puts `<sk-form-input name="email" label="Email address">` inside a `<form>`, the user
types, the form submits, and the server receives `email=…`.

**Why this priority:** it is the capability. Everything else is a property of it.

**Acceptance**

1. **Given** a native `<form>` containing the element with a `name`, **when** it is submitted,
   **then** `new FormData(form)` carries that name with the typed value.
2. **Given** the field is disabled, **when** the form is submitted, **then** the name is
   **absent** from the FormData — not present-and-empty.
3. **Given** the form is reset, **when** `reset()` runs, **then** the field returns to its
   initial value, not to empty.

### User Story 2 - An invalid field blocks submission and says why, audibly (Priority: P1)

**Acceptance**

1. `setValidity` with a message makes the element match `:invalid` and blocks native submission.
2. The message is reachable from the **accessibility tree**, not only from
   `internals.validationMessage` — ADR-11's SC-003 exists because those are different claims.
3. The invalid state is visible without relying on colour alone.

### User Story 3 - The label is a property, and it names the control (Priority: P1)

**Acceptance**

1. `label="Email address"` produces an accessible name on the **control**, not on the host.
2. axe reports zero violations for every state.
3. No `for`/`id` pair crosses a root boundary — there is none to get wrong.

### User Story 4 - Eight markup strings become one element with state (Priority: P2)

**Acceptance**

1. Every state the eight strings expressed — default, focus, error, disabled, filled, textarea
   default, textarea error — is reachable as element state.
2. `is-focused` is **not** among them: it faked a state the browser owns, and an element that
   ships a class to simulate focus is lying to the a11y tree. Recorded, not silently dropped.
3. No consumer-visible id is generated that could collide across two instances on one page.

### Edge Cases

* **Two instances on one page** — no id collision, no shared state.
* **A property set before upgrade** (`el.value = 'x'`) — this is **SC-010** in the registry,
  not loose prose, and FR-009's subject list must carry it if it applies. Likewise **SC-011**
  (slot contract) the moment any slot survives. The lenses noted six edge cases with zero
  criteria between them; these two are behaviours and are promoted.
* **The element outside any form** — `setFormValue` must not throw.
* **`disabled` toggled while the form is live** — `formDisabledCallback`, and the FormData
  consequence re-checked after the toggle rather than only at construction.
* **A textarea's newline handling** in FormData.
* **Validation cleared** — `setValidity({})` must remove both the block and the announcement.

## The three blockers the post-spec squad measured, and how this spec answers them

Recorded here rather than buried in an FR, because two of them are properties of gates that
exist today and one is a contradiction this spec contained.

### B1 — one styles directory cannot serve two elements

`scripts/build-elements-css.mjs` enforces `dir === name` and globs
`packages/styles/src/<name>/sk-*.css`; `scripts/check-adopted-css-boundaries.mjs` fails an
element whose styles directory holds no sheet. Both hard-exit, measured:

```
packages/elements/src/form-input/sk-form-input.ts   → no sk-*.css under packages/styles/src/form-input/   exit 1
packages/elements/src/form-field/sk-form-input.ts   → sits in "form-field/" but names "form-input"        exit 1
```

nav-pill established *many sheets → one element*. This is the inverse and the pipeline refuses
it by design. **Answer: FR-012 splits the directory.** This is not #118, which is about opt-out
and declared order; that issue does not cover this shape.

### B2 — the boundary gate owns nothing named `.sk-input`

`check-adopted-css-boundaries.mjs` computes ownership as `^sk-<element-name>($|__|--)`. Against
`sk-form-field.css`, measured for every candidate name:

| element name | rules rejected |
|---|---|
| `form-field` | 12 of 16 — every `.sk-input*` and `.sk-textarea*` |
| `form-input` / `form-textarea` | 16 of 16 |

There is no element name under which the current stylesheet passes. The gate is the one #73
landed, and this exposes a real flaw in it: it conflates *belongs to this component* with *is
named after this component*. `.sk-input` inside the form-input sheet is not an outside ancestor,
which is the only thing the rule exists to catch.

**Answer: FR-013 renames the classes, and does NOT relax the gate.** Relaxing it — letting a
component declare arbitrary owned prefixes — would take the one mechanical check on ADR-9's
cross-boundary rule and make it configurable by the file it checks. The rename is a real
breaking change to a published package and is escalated on the issue (see *Operator questions*).

### B3 — FR-008's wrapper was arrangement C

A `sk-form-field` owning a label in its shadow root while the control arrives through a slot is
a cross-root label reference: ADR-9 §4's `fail — label @ sk-input-slotted,#c-ctl`. Its
description and error region reach the control through `aria-describedby`, which axe resolves
from the attribute and scopes to `getRootNode()` — the same failure. The spec asserted C-001
and then contradicted it two pages later, with an unfalsifiable "or dropped with a reason"
escape and no success criterion.

**Answer: `sk-form-field` is dropped. FR-008 below says so and says why.** What remains of the
wrapper is `display:flex; flex-direction:column; gap` — a `<div>`, and a leftover of the
CSS-only era where the wrapper carried the `for`/`id` pair the arrangement no longer has.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `sk-form-input` and `sk-form-textarea` are custom elements registered through the
  guarded `define()` (ADR-10 §5), exported from `@spec-kitty/elements`, and reaching **both**
  distribution entries.
- **FR-002**: Both declare `static formAssociated = true` and use `ElementInternals`.
- **FR-003**: Every anchor string named in `mutations.json` for these elements occurs **exactly
  once in its own file**, and reds only the `[id]` test in its declared subject file.

  *Restated after the post-spec squad.* This said "`setFormValue` has exactly one call site",
  which was a proxy for the real constraint and missed it three ways: the mutation anchors are
  not the `setFormValue` line (they are the `changed.has(...)` guard and the
  `disabled ? null : value` expression); "exactly one" is undefined per-file and unmeetable
  repo-wide once the fixture and two elements each have one; and it is trivially satisfiable by
  a one-line wrapper called from ten places. The property that matters is guard 2's — an
  ambiguous anchor is rejected — and it is now stated directly.
- **FR-004**: `formResetCallback` restores the initial value; `formDisabledCallback` owns the
  disabled transition, routing through the element's own `setFormValue`.
- **FR-005**: The validation message reaches the accessibility tree via an `aria-describedby`
  from the control to an error node **in the same shadow root**. `setValidity`'s third argument
  is passed as the focus anchor for `reportValidity()`.

  *Corrected.* This said the anchor is passed "so the message reaches the accessibility tree".
  That is not what the third argument does — it is what `reportValidity()` focuses and where the
  UA points its bubble. It puts nothing in the accessibility tree. The mechanism is named here
  because SC-202 previously named a property with no witness, and the inherited SC-003 test
  asserts `validationMessage` plus focus, neither of which is an accessibility tree.
- **FR-006**: `label` is a property that names the **control**; no `for`/`id` pair crosses a root.
- **FR-007**: **ADDITIVE BY DEFAULT — the published surface is left intact.**
  `packages/styles/src/form-field/` keeps its eight exports, its stylesheet and its stories
  exactly as they are. The new element stylesheets are *new files in new directories*
  (FR-012), with new class names (FR-013), and nothing a consumer of `@spec-kitty/styles@1.0.0`
  links against changes. `docs/design-system/using-components.md` — which documents a
  `<sk-input-field>` and `.sk-field*` classes that exist nowhere in the repo — is corrected on
  the same pass, because that is a fix, not a break.

  *Why this replaced "delete the eight exports".* The squad established that
  `@spec-kitty/styles` is published publicly at 1.0.0, which the programme had been assuming
  otherwise. Deleting public exports and renaming public classes is a semver-major on a live
  package — an outward-facing, hard-to-reverse act, and not one to take on my own judgement
  while a cheaper path exists. The additive path satisfies both gates, ships both elements, and
  leaves the retirement as a deliberate, separately-approved change.

  **The collapse is therefore DEFERRED, not abandoned.** The duplication is real and #79's
  repository-wide "no component markup is authored twice" assertion is what forces it. Filed
  with the reasoning, and the operator's ruling on question 2 can pull it back in.

  *No longer deferred to the plan.* The generator has already decided: a `*.markup.ts` here
  would replace `index.ts` wholesale with three exports derived from `<COMPONENT>_VARIANTS`,
  hardcode the `.html` body to `Card content`, and emit `SkFormFieldInsetHTML` carrying a class
  in no stylesheet (#115). So **no `*.markup.ts` is added**, and the static exports stay
  hand-authored and untouched rather than being regenerated wrong.
- **FR-008**: **`sk-form-field` is not built.** Its three accessible responsibilities — label,
  description, error region — all reach the control across a root boundary and were measured
  failing in ADR-9 §4. What remains is flex layout, which is a `<div>` the consumer already
  owns. The composed unit is `<sk-form-input label="…" description="…">` alone, which is what
  US1 always wrote.
- **FR-009**: Each element is a subject of **SC-002, SC-003, SC-004 and SC-005**, and
  `tests/node/config-contract.test.ts` gains an arm enforcing it: *any element declaring
  `static formAssociated = true` must be a subject of all four.*

  *Made binding.* The derived obligation #73 landed is "at least one behaviour, in a file about
  the element". A lens showed the spec's claim was therefore false: declaring the two elements
  as subjects of SC-013 and SC-014 only satisfies config-contract, the floor arm and guard 7,
  with not one assertion about FormData, validity, reset or disabled exclusion — the synthetic
  fixture keeps carrying SC-002…SC-005, which is exactly the shape `behaviours.json`'s own
  comment says the subject dimension was built to close.
- **FR-010**: WebKit is settled by evidence naming the capability: `setFormValue`, `setValidity`,
  `formResetCallback` and `formDisabledCallback` executing green **under the WebKit instance of
  the browser lane**, cited by CI run URL and by the floor reporter's per-lane line showing the
  new files' count. The deferral branch is removed — the lane that would settle it already runs
  unconditionally, so there is nothing left to defer.
- **FR-011**: Firefox parity is **out of scope, and the reason is recorded**: no lane runs form
  association on Firefox. `vitest.config.mts` builds `instances` as chromium plus webkit-under-CI;
  Firefox appears only in `playwright.config.ts`, driving the Storybook smoke, which never
  touches `ElementInternals`. Adding a Firefox instance is a browser-matrix change with its own
  cost and its own floor-reporter consequences. Filed rather than claimed.
- **FR-012**: `packages/styles/src/form-field/` is split into `packages/styles/src/form-input/`
  and `packages/styles/src/form-textarea/`, one stylesheet per element directory, so the CSS
  pipeline and the boundary gate can both resolve them (B1).
- **FR-013**: The **new** sheets use `.sk-form-input*` and `.sk-form-textarea*`, so every rule
  owns its leftmost compound under its element's name (B2). The existing `.sk-input` /
  `.sk-textarea` classes in `form-field/` are **not renamed** — see FR-007. `audit/index.html`
  hardcodes `packages/styles/dist/form-field/` paths; under the additive path they keep
  resolving and need no edit, which is checked rather than assumed.
- **FR-014**: `.sk-input.is-focused` / `.sk-textarea.is-focused` are deleted from the
  stylesheet, not merely from the markup. A class that fakes a state the browser owns has no
  place in an element that can have the real one.
- **FR-015**: `var(--sk-space-30, 120px)` in the textarea rule references a token that exists
  nowhere in the repo — a hardcoded `120px` wearing a token's clothes, the SK-D01 deviation
  class ADR-9 §3 records for `sk-card.css`. It is fixed or recorded, not migrated silently.
- **FR-016**: `suite-budget.json` is re-measured. Eight new mutations against a 180s ceiling at
  29 is likely over; the ceiling is raised deliberately with the run that justifies it, or the
  mutation set is shown to fit.

### Non-Functional Requirements

- **NFR-001**: No CSS authored in `packages/elements`; the source of record stays in
  `@spec-kitty/styles` and is adopted through the generated module (ADR-10 §1).
- **NFR-002**: Every rule in each adopted sheet owns its leftmost compound under its own
  element's name — the general rule #73 landed. After FR-012 and FR-013 this is achievable;
  before them it is not, under any naming (B2).
- **NFR-003**: axe reports zero for every **state**, and the states are enumerated in SC-206 so
  the criterion cannot be satisfied by shipping one story.
- **NFR-004**: Every new behaviour test is proven red-first by mutation before it is counted.

### Constraints

- **C-001**: ADR-9 §4 governs the arrangement. Settled; not re-opened. FR-008 applies it rather
  than re-deciding it.
- **C-002**: ADR-10 §5 registration; the `@element` JSDoc annotation is required or the manifest
  carries no definition.
- **C-003**: No ADR written or amended. ADRs are written only in #67.
- **C-004**: `kitty-specs/**` outside this mission's directory,
  `docs/architecture/validation/**` and `docs/learnings/**` are frozen. `docs/design-system/**`
  is **not** frozen and is in scope (FR-007).
- **C-005**: Published prose is short — everything in a `/** */` above an export and every
  `@csspart` description is copied verbatim into `custom-elements.json`.
- **C-006**: `packages/styles/src/form-field/` holds **seven** files: `sk-form-field.css`,
  `sk-form-field.html`, four per-state `.html` files, `index.ts`, and
  `sk-form-field-html.stories.ts`. The four per-state `.html` files are referenced by nothing
  executable and are byte-duplicates of four of the exports; `llms-full.txt` claims they are
  "consumed by stories", which is false — the stories import the template literals. FR-007
  settles their fate rather than leaving them orphaned.
- **C-007**: **`@spec-kitty/styles` is published publicly at 1.0.0.** Nothing this mission does
  may change its published surface. That constraint is what turned FR-007 and FR-013 additive.

### Key Entities

- **`SkFormInput` / `SkFormTextarea`** — form-associated controls, arrangement B.
- **`ElementInternals`** — the submission and validity channel.
- **`::part()` surface** — `label`, `control`, `description`, `error`. Named here because a
  component shipping zero parts gives consumers tokens and nothing else, and that would be an
  architectural decision made by silence. `expected-parts.json` and SC-013 move in the same PR.

## Success Criteria *(mandatory)*

Each of these was rewritten after a lens constructed an implementation satisfying it while the
property it names was false. The construction is recorded with the criterion.

- **SC-201**: A native form submit produces the expected `FormData` entry, **with the value
  arriving through `internals.setFormValue`**, and the entry re-read after a property change.
  *(Was satisfiable by a light-DOM `<input name>` — arrangement A, which also passes — and by a
  single `setFormValue` in `connectedCallback` that submits stale values.)*
- **SC-202**: `setValidity` blocks submission **and** the message is the control's computed
  accessible description, resolved within its own root. *(Named no witness; the inherited test
  asserts `validationMessage` plus focus, neither of which is an accessibility tree.)*
- **SC-203**: Form reset restores the initial value **from a non-empty seed**. *(The repo has
  already paid for this: `formResetCallback() { this.value = ''; }` passed the old assertion,
  because the initial value was always `''`.)*
- **SC-204**: A disabled control is excluded from submission **because `formDisabledCallback`
  routes through the element's own `setFormValue`**, re-checked after a live toggle. *(A
  reflected `disabled` attribute makes the UA exclude it unaided, so the element's own exclusion
  is unobservable — the fixture's docstring records this happening once already.)*
- **SC-205**: Every `(behaviour, subject file)` pair has a mutation reddening its named test
  with no collateral. **Two elements × four ids = eight new pairs**, taking `mutations.json`
  from 29 to 37 and the registry from 23 pairs to 31. *(Said "each of SC-201…SC-204 has a
  mutation" — four, half the real obligation.)*
- **SC-206**: axe zero across a **named** story set per element: `Default`, `Filled`, `Error`,
  `Disabled`, `LightMode`, and `Textarea*` equivalents — enforced by a committed expected-stories
  list in the shrink-only shape of `expected-parts.json`. *(The axe gate refuses only a
  globally empty set; one `Default` story reported green over one state, and US4 deletes seven
  existing state stories that nothing would have noticed the loss of.)*
- **SC-207**: `label` produces a named form control **in the accessibility tree**, asserted via
  the browser lane's role/name query — not `querySelector('[aria-label=…]')`. *(Kept, and the
  mechanism is now named: #73's corrected assertion was still a tag check plus an attribute
  selector, so the precedent this cited did not implement it.)*
- **SC-208**: Two instances in one form both appear in `FormData` under distinct names with
  distinct values, and neither adds an id to the light DOM on upgrade. *(A collision was
  impossible by construction across two shadow roots, so the old criterion asserted nothing.)*
- **SC-209**: The published surface is **unchanged**: `packages/styles/src/index.ts` exports the
  same eight names it did at `train/elements-first`, `packages/styles/src/form-field/` is
  byte-identical, and `npm pack --dry-run` on `packages/styles` lists the same files. Asserted
  as a diff against the merge base, not as a grep. *(The original criterion was a grep with a
  self-cancelling qualifier — no surviving export could ever have "markup also authored in the
  element", so it went green with all eight intact, and its globs missed `SkFormFieldHTML`
  anyway. The criterion now runs the other way: nothing published may move.)*
- **SC-210**: The PR cites the CI run URL and the floor reporter's `browser (webkit)=N` line
  covering the new test files. *(Was satisfiable by typing a sentence, and its "deferred"
  branch could not fail.)*
- **SC-211**: **One element, one state, both halves**: it submits its value in a native form
  **and** reports zero axe violations. This is ADR-9 §4's Confirmation #3 verbatim, and SP-5
  showed either half can hold without the other — so it is asserted as a conjunction, not as
  two unrelated criteria.

## Operator questions

Both are raised on #74. Work proceeds on everything they do not block; nothing that depends on
them is decided here.

### 1. Is this one mission or two?

Two lenses said two, independently. #72 and #73 each shipped one element. This proposes two,
plus a `@spec-kitty/styles` directory restructure forced by two gates, a public class rename,
deletion of eight exports and a story file, eight mutations, eight registry pairs, and a
`suite-budget.json` re-measurement.

**Recommendation: split at the seam both elements block on.** M8a — make "one stylesheet
directory per element" true (FR-012, FR-013, FR-014, FR-015) and land `sk-form-input` alone as
its proof. M8b — `sk-form-textarea`, FR-007's collapse, and the styles-layer story disposition.
Proceeding as one mission until told otherwise, sequenced so the split is still possible.

### 2. `@spec-kitty/styles` is published at 1.0.0 — is a semver-major acceptable here?

*As first drafted* FR-007 removed eight public exports and FR-013 renamed `.sk-input` /
`.sk-textarea`, which static consumers link against. The programme's standing assumption has
been "nothing is published, so a break is free" — true of `@spec-kitty/elements`, which is
`"private": true`, and **false of `@spec-kitty/styles`**, which `release.yml` publishes with
`--access public`.

Both FRs are now additive, so **this mission does not wait on the answer**. The question stands
because the retirement still has to happen: the duplication is real, #79's repository-wide "no
component markup is authored twice" assertion forces it, and #77–#79 will each want the same
rename.

**Recommendation: take the break, in one deliberate 2.0.0** — #77–#79 migrate nine more
components and will each want the same rename, so doing it once is cheaper than nine times.

**But this mission does not wait for the answer and does not take the break.** FR-007 and
FR-013 now describe the *additive* path: new directories, new class names, the published
surface untouched. Both gates are satisfied, both elements ship, and the retirement stays
available as a separately-approved change. An irreversible outward-facing act does not get made
by a loop because it was the tidier option.

## Out of scope

- Migrating any other component (#77–#79).
- The React wrapper (#75) and the conformance matrix (#112).
- Publishing (#80) — `@spec-kitty/elements` is `"private": true`.
- Fixing the markup generator's hardcoded axes (#115), the four-way element derivation (#117),
  or adoption-by-glob (#118). **#115 is a hard prerequisite of any `*.markup.ts` here**, which
  is why FR-007 deletes the static exports rather than regenerating them.
- Firefox parity (FR-011) — no lane runs form association on Firefox, and adding one is a
  browser-matrix change with its own floor-reporter consequences.
- `sk-form-field` as an element (FR-008), on ADR-9 §4's own evidence.
- Making lint blocking (#114).

## Decisions this mission does NOT make

1. **The shadow arrangement** — ADR-9 §4, from measurement.
2. **Registration** — ADR-10 §5.
3. **Where CSS is authored** — ADR-8 constraint 1 / ADR-10 §1.
4. **Whether the label is a property** — ADR-9 §4 again; it is the consequence of C and D failing.

If a fork appears that none of these covers, work on that thread stops and it is raised on #74.
