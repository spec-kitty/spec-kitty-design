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
* **A property set before upgrade** (`el.value = 'x'`), ADR-11 required behaviour 3.
* **The element outside any form** — `setFormValue` must not throw.
* **`disabled` toggled while the form is live** — `formDisabledCallback`, and the FormData
  consequence re-checked after the toggle rather than only at construction.
* **A textarea's newline handling** in FormData.
* **Validation cleared** — `setValidity({})` must remove both the block and the announcement.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `sk-form-input` and `sk-form-textarea` are custom elements registered through the
  guarded `define()` (ADR-10 §5) and exported from `@spec-kitty/elements`, reaching **both**
  distribution entries.
- **FR-002**: Both declare `static formAssociated = true` and use `ElementInternals`.
- **FR-003**: `setFormValue` has exactly **one** call site, per the fixture's proven structure.
- **FR-004**: `formResetCallback` restores the initial value; `formDisabledCallback` owns the
  disabled transition.
- **FR-005**: `setValidity` is called with an **anchor element**, so the message reaches the
  accessibility tree and not merely `internals.validationMessage`.
- **FR-006**: `label` is a property that names the **control**; no `for`/`id` pair crosses a root.
- **FR-007**: The eight exported HTML strings collapse into element state. What remains of
  `packages/styles/src/form-field/index.ts` is decided in the plan, not assumed here.
- **FR-008**: `sk-form-field` provides the field wrapper — label, control slot, description and
  error region — or is shown to be unnecessary and dropped with a reason.
- **FR-009**: The elements are subjects of **SC-002, SC-003, SC-004, SC-005** in
  `behaviours.json`, each with a test in a file about them and a mutation in `mutations.json`.
- **FR-010**: **WebKit is settled.** Either verified in CI, or deferred with the failing
  evidence. "Could not launch locally" is not a reason — CI already runs a WebKit lane and
  passed it at #73's merge.
- **FR-011**: Firefox parity is recorded from an actual run, not asserted.

### Non-Functional Requirements

- **NFR-001**: No CSS authored in `packages/elements`; the source of record stays in
  `@spec-kitty/styles` and is adopted through the generated module (ADR-10 §1).
- **NFR-002**: No selector in the adopted sheet may reach outside the element's own root — the
  general rule #73 landed, not ADR-9's four-token enumeration. `.sk-form-field--error
  .sk-form-field__description` is an *intra-component* descendant and is fine; a themed ancestor
  is not.
- **NFR-003**: axe reports zero for every state, **including the error and disabled states**. A
  component whose only story is its default state has had one of its states tested.
- **NFR-004**: Every new behaviour test is proven red-first by mutation before it is counted.

### Constraints

- **C-001**: ADR-9 §4 governs the arrangement. Settled; not re-opened.
- **C-002**: ADR-10 §5 registration; the `@element` JSDoc annotation is required or the manifest
  carries no definition.
- **C-003**: No ADR written or amended. ADRs are written only in #67.
- **C-004**: `kitty-specs/**` outside this mission's directory,
  `docs/architecture/validation/**` and `docs/learnings/**` are frozen.
- **C-005**: Published prose is short — everything in a `/** */` above an export and every
  `@csspart` description is copied verbatim into `custom-elements.json`.
- **C-006**: `packages/styles/src/form-field/` already ships `sk-form-field.html`, four
  per-state `.html` files and an `index.ts`. `scripts/build-element-markup.mjs` would overwrite
  `index.ts` and `sk-form-field.html` the moment a `*.markup.ts` appears, and its `inset` axis is
  still hardcoded (**#115**). Whether this mission adds one is a plan decision with that on the
  table.

### Key Entities

- **`SkFormInput` / `SkFormTextarea`** — form-associated controls, arrangement B.
- **`SkFormField`** — the wrapper, if FR-008 keeps it.
- **`ElementInternals`** — the submission and validity channel.

## Success Criteria *(mandatory)*

- **SC-201**: A native form submit produces the expected `FormData` entry (ADR-11 SC-002).
- **SC-202**: `setValidity` blocks submission **and** the message reaches the a11y tree (SC-003).
- **SC-203**: Form reset restores the initial value (SC-004).
- **SC-204**: A disabled control is **excluded** from submission (SC-005).
- **SC-205**: Each of SC-201…SC-204 has a mutation that reds its named test with no collateral,
  and `node scripts/suite-selftest.mjs` is green at the larger count.
- **SC-206**: axe zero across every story, error and disabled states included.
- **SC-207**: `label` produces an accessible name on the control — asserted as a **named form
  control in the accessibility tree**, not as an `aria-label` attribute string. (#73 shipped
  exactly that mistake: a raw attribute assertion passed while the landmark was gone.)
- **SC-208**: Two instances on one page do not collide, asserted.
- **SC-209**: `grep` shows no surviving `SkFormInput*HTML` / `SkFormTextarea*HTML` export whose
  markup is also authored in the element.
- **SC-210**: WebKit is recorded in the PR as verified-in-CI or deferred-with-evidence.

## Out of scope

- Migrating any other component (#77–#79).
- The React wrapper (#75) and the conformance matrix (#112).
- Publishing (#80) — `@spec-kitty/elements` is `"private": true`.
- Fixing the markup generator's hardcoded axes (#115), the four-way element derivation (#117),
  or adoption-by-glob (#118).
- Making lint blocking (#114).

## Decisions this mission does NOT make

1. **The shadow arrangement** — ADR-9 §4, from measurement.
2. **Registration** — ADR-10 §5.
3. **Where CSS is authored** — ADR-8 constraint 1 / ADR-10 §1.
4. **Whether the label is a property** — ADR-9 §4 again; it is the consequence of C and D failing.

If a fork appears that none of these covers, work on that thread stops and it is raised on #74.
