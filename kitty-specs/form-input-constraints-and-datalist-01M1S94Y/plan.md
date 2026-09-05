# Implementation Plan: form-input-constraints-and-datalist

**Branch**: `mission/form-input-constraints-and-datalist` | **Date**: 2026-09-05 | **Spec**: `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/spec.md`
**Input**: Feature specification from `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/spec.md`

**Note**: This template is filled in by the `/spec-kitty.plan` command. See `packs/built-in/missions/mission-steps/software-dev/plan/prompt.md` for the execution workflow.

## Summary

`sk-form-input` forwards seven native constraint/hinting attributes it currently drops
(`pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete`, `readonly`), merges the inner
`<input>`'s own `ValidityState` flags into `validate()` instead of replacing them, implements the
platform's actual `readonly` semantics (submitted, barred from constraint validation — not the
issue's stated contract), and renders a `<datalist>` into its own shadow root for a supplied
option model, wiring the inner input's `list` at that shadow-root id. No `sk-combobox` is built
(epic #183 binding). Shared, unanchored forwarding plumbing moves into `form-control-base.ts`
(#122); the four existing per-element mutation anchors (`syncFormValue`, `formResetCallback`,
`formDisabledCallback`, `validate()`) stay duplicated in `sk-form-input.ts` and
`sk-form-textarea.ts` — `form-control-base.ts`'s own header comment and #122 both record that a
shared mutation anchor reds 8/37 mutations as collateral, which `suite-selftest.mjs` guard 5
rejects. The React `ssrSafe` question for the option model is answered by replicating the
`attribute:false` + `x-spec-kitty-property-only` + `x-spec-kitty-property-reset:empty-array`
pattern `sk-transition-matrix` (#149) already shipped and proved in
`fixtures/react-consumer/src/sk-transition-matrix.test.tsx` — not re-derived from first
principles — with a parallel `fixtures/react-consumer` test for `sk-form-input`'s option model.

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
├── form-control-base.ts                 # + shared, UNANCHORED constraint-forwarding plumbing
├── form-input/
│   ├── sk-form-input.ts                 # + pattern/min/max/step/inputmode/autocomplete/readonly
│   │                                     #   properties; merged validate(); datalist render;
│   │                                     #   readonly submission/validation split (FR-003)
│   ├── sk-form-input.css.js             # unchanged unless a defect surfaces (none expected)
│   └── sk-form-input.stories.ts         # + constraint / datalist / readonly story arms
├── form-textarea/
│   └── sk-form-textarea.ts              # UNCHANGED behaviour; only benefits from any shared
│                                         #   plumbing #122 lands in form-control-base.ts
packages/elements/custom-elements.json    # regenerated (new attributes/members on sk-form-input)
packages/react/src/SkFormInput.{tsx,d.ts} # regenerated (new props; option model via useProperties)
packages/styles/src/form-input/*.html     # regenerated static markup (new attrs where present)
fixtures/elements-behaviour/src/sk-form-input.test.ts   # + new behaviour ids
fixtures/react-consumer/src/sk-form-input-options.test.tsx  # new — NFR-001/SC-006 measurement
apps/storybook/src/tests/                 # axe + visual arms for new stories, if new stories are added
mutations.json / behaviours.json          # + new (id, subject) entries for the new anchors, using
                                           #   FRESH ids (SC-016+ — SC-002/003/004/005/013 are
                                           #   already taken for sk-form-input by existing
                                           #   ADR-11 form-association/parts arms; the spec's own
                                           #   FR/SC numbering is mission-local prose, not this
                                           #   registry, and must not be copied into it verbatim)
```

**Structure Decision**: Extend `sk-form-input.ts` in place (no new element, per epic #183's binding
"no `sk-combobox`"). Move only genuinely shared, unanchored forwarding helpers into
`form-control-base.ts` (FR-007) — the four already-duplicated MUTATION ANCHOR methods stay
duplicated per #122's own finding, which this plan does not attempt to re-litigate. All build
artifacts (manifest, wrappers, styles-only barrel) are regenerated, never hand-edited, per ADR-10.

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

### IC-02 — Merged validity (FR-002)

- **Purpose**: `validate()` must read the inner control's own `ValidityState` (via
  `control.validity`, the same `shadowRoot.querySelector('input')` reference the existing method
  already resolves for the focus anchor) and merge its `true` flags into the flags object already
  built from `required`/`customError`, rather than replacing them. The merged message must surface
  a UA-raised failure (e.g. `patternMismatch`) with a message, not just a flag.
- **Relevant requirements**: FR-002, SC-002.
- **Affected surfaces**: `packages/elements/src/form-input/sk-form-input.ts` `validate()` only.
  This is a NEW mutation anchor on an EXISTING anchored method — the merge line itself becomes its
  own `(id, subject)` pair in `mutations.json`/`behaviours.json`, additive to the existing
  SC-002..SC-005/SC-013 entries already on that file, not a replacement of them.
- **Sequencing/depends-on**: IC-01 (there is nothing to merge validity from before `pattern` etc.
  exist) and, for the message text, a decision on precedence when the UA flag and a
  required/customError flag are both true (existing code already establishes customError wins the
  announced *message* while flags stack — the merge follows that established precedent rather than
  inventing a new one).
- **Risks**: the exact one FR-002/SC-002 name — a merge that reads `control.validity` but is
  asserted only by reading `el.validity.patternMismatch` back would pass while the host still
  submits, because `ElementInternals.setValidity` is a separate call from the flags object being
  correct. SC-002 requires the test to submit a real `<form>` and assert the FormData/`submit`
  event outcome, not just read validity.

### IC-03 — `readonly`: submission yes, constraint validation no (FR-003)

- **Purpose**: Implement the corrected contract from the spec/issue-comment: `readonly` reflects
  to the inner control (so the UA suppresses editing), the value **is** still passed to
  `setFormValue()` (unlike `disabled`), and the control is **barred from constraint validation** —
  `internals.setValidity({})` regardless of what `required`/pattern/UA flags would otherwise say,
  mirroring the `disabled` early-return shape already in `validate()` but with the opposite
  `syncFormValue()` outcome.
- **Relevant requirements**: FR-003, SC-003, FR-004 (must not regress — `disabled` stays
  unreflected and excluded).
- **Affected surfaces**: `packages/elements/src/form-input/sk-form-input.ts`: a new `readonly`
  reactive property (reflected — there is no SC-005-style reason to withhold reflection here,
  since the UA's OWN `readonly`-barring behaviour is exactly what this concern wants engaged, not
  worked around), `validate()`'s early-return branch, `syncFormValue()`'s null/value predicate.
- **Sequencing/depends-on**: independent of IC-01/IC-02 in code, but ordered after IC-02 in the
  task list because both touch `validate()`'s early-return shape and should not be written as
  concurrent edits to the same lines.
- **Risks**: the exact trap named in spec.md and the issue comment — reading
  `validity.patternMismatch` on a readonly control and acting on it (e.g. still setting the flag)
  reproduces the wrong contract even with the right prose understanding, because the flag
  genuinely computes true even though the platform lets the form through. The implementation must
  short-circuit BEFORE the merge in IC-02 touches a readonly control, the same way the existing
  `disabled` branch short-circuits before the rest of `validate()` runs.

### IC-04 — Shadow-root `<datalist>` (FR-005, FR-006)

- **Purpose**: Render a `<datalist>` into `sk-form-input`'s own shadow root from a supplied option
  model, and set the inner `<input>`'s `list` attribute to that datalist's shadow-root-local id —
  reachable because `list` resolves in the input's own tree (its shadow root), matching ADR-9
  Arrangement B's containment argument for `label`/`aria-describedby`.
- **Relevant requirements**: FR-005, FR-006, SC-005.
- **Affected surfaces**: `packages/elements/src/form-input/sk-form-input.ts`: a new `options`
  reactive property (array of `{ value: string; label?: string }`, `attribute: false` — see IC-06
  for why), `render()` gains a conditional `<datalist id="…">` block and the input's `list=` binding.
- **Sequencing/depends-on**: independent of IC-01/02/03.
- **Risks**: the id must be **shadow-root-local** and does not need per-instance uniqueness beyond
  that root (each instance has its own shadow root, so a fixed literal id such as `"options"` is
  safe — unlike a light-DOM id, which would collide across instances on one page). SC-005 requires
  asserting **node identity** (`input.list === datalist`), not attribute-string equality, because a
  string match would pass even if `list` pointed at a same-named node in the WRONG root (or at
  nothing, silently, since `list` referencing a missing id is not an error).

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
  non-readonly, non-static, non-`#private` field; a `ReadonlyArray<…>`-shaped normalized type if an
  empty-array reset is wanted, matching `sk-transition-matrix`'s `columns`/`routes`).
  `packages/react/src/SkFormInput.{tsx,d.ts}` — regenerated, not hand-edited: the generator should
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

### IC-07 — Shared plumbing in `form-control-base.ts` (FR-007)

- **Purpose**: Move whatever forwarding logic is genuinely identical and UNANCHORED between
  `sk-form-input` and `sk-form-textarea` into the base class, per #122's finding and FR-007,
  without moving any of the four existing MUTATION ANCHORS (`syncFormValue`, `formResetCallback`,
  `formDisabledCallback`, `validate()`'s disabled branch and flag-merge), which #122 and
  `form-control-base.ts`'s own header comment establish must stay per-element.
- **Relevant requirements**: FR-007.
- **Affected surfaces**: `packages/elements/src/form-control-base.ts` — candidate additions are
  narrow: none of `pattern`/`min`/`max`/`step`/`inputmode`/`autocomplete`/`readonly` apply to
  `sk-form-textarea` (a `<textarea>` has no `pattern`/`min`/`max`/`step`/`inputmode` in the HTML
  sense, and `list`/datalist is `<input>`-only), so THIS mission's new surface has **no** shared
  target beyond what already lives in the base (`disabled`/`required`/`value`/`name`/etc.).
  FR-007 is therefore satisfied here by NOT copying anything mission-specific into
  `sk-form-textarea`, rather than by adding new shared code — the concern exists to make that a
  deliberate check, not an assumption.
- **Sequencing/depends-on**: none; can be verified any time after IC-01-04 land, as a review pass
  rather than a code change, unless the merged-validity plumbing (IC-02) turns out to have an
  unanchored helper shape (e.g. "read a control's ValidityState flags into an object") worth
  sharing — `sk-form-textarea`'s own textarea DOES have a `ValidityState` with `tooLong`/
  `valueMissing`/`customError`/`patternMismatch` N/A, so a `readControlValidityFlags(control):
  ValidityStateFlags` helper reading only the UA flags BOTH elements can raise (`tooLong`,
  `tooShort`, `valueMissing` is already element-derived) is a plausible shared, unanchored helper —
  sized and decided at task-writing time, not fixed here.
- **Risks**: mis-classifying an anchored line as shared plumbing reproduces exactly the 8/37
  collateral failure #122 already measured. Any candidate for `form-control-base.ts` must be
  checked against `mutations.json` before it moves.

### IC-08 — Generated artifacts and conformance (FR-008, SC-007)

- **Purpose**: Regenerate `custom-elements.json`, `packages/react/src/SkFormInput.*`, the
  styles-only static markup/barrel, and the size report; add the conformance-matrix entry; rebase
  on the current train before the final gate.
- **Relevant requirements**: FR-008, SC-007.
- **Affected surfaces**: build outputs listed in Project Structure above; no hand-edits.
- **Sequencing/depends-on**: after IC-01–IC-06 (nothing new to generate before the source changes
  exist); done last per task, but re-run after EVERY source change during implementation to keep
  drift gates green incrementally rather than in one late pass.
- **Risks**: FR-008 also requires any genuine gap in the generated static/no-build form (e.g. the
  static `.html` `<input>` form has no JavaScript to run `validate()` merges, and static markup
  cannot express `list`+`<datalist>` behaviour differently than plain HTML already does — which is
  actually FINE, since plain HTML natively supports `pattern`/`min`/`max`/`step`/`list`/`readonly`
  with zero JavaScript; the only true gap is that the static form gets NO custom validity-merge
  message text, which is a documented limitation, not a defect, because native validation already
  produces its own UA message in that consumer) to be a documented limitation with a stated
  workaround, never silent divergence.

## Complexity Tracking

*No Charter Check violations require justification.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| — | — | — |
