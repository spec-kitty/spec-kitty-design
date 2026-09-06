# ADR 14 (2026-09-06): The Detached-Probe Validation Seam

**Date:** 2026-09-06
**Status:** Proposed. Descriptive record only — see "Open Questions" below for the two forks this
ADR deliberately does not settle.
**Deciders:** MOES-Media (operator session, 2026-09-06 — authorized writing this ADR outside #67,
the same precedent recorded for #176 in ADR-10 and for #189 in ADR-11); the mechanism recorded here
was itself decided during the #180 mission and corrected during the #187 mission, neither of which
wrote an ADR for it at the time — that gap is what issue #188 raised and this ADR closes.
**Technical Story:** Raised by the pre-merge gate on #187 (architect-alphonso, debugger-debbie),
filed as issue #188 rather than decided in-mission, "per the operator ruling that forks go to
issues while the ADR route is closed."

---

## Context and Problem Statement

`sk-form-input` (`packages/elements/src/form-input/sk-form-input.ts`) must merge the user agent's
own constraint-validity flags — `patternMismatch`, range/step/type mismatches, `badInput` — into
the `ElementInternals` it reports through. `ElementInternals.setValidity()` **replaces** whatever
flags it is given; nothing else consults `control.validity`. Without this merge, forwarding
`pattern`/`min`/`max`/`step`/`type` to the rendered `<input>` makes that inner control invalid
while the host element still reports valid — a field that looks fine and silently submits data the
UA itself would reject.

The element's own `validate()` runs from Lit's `willUpdate()` lifecycle hook (line 183), not
`updated()`. This is deliberate and separately justified in the element's own comments (`updated()`
set the reactive `invalid` property one render cycle late — see the code comment at
`sk-form-input.ts:168-176` for the specific test failure this caused, the `aria-invalid` mutation
survivor). But `willUpdate()` runs **before** `render()` commits the current update's
attribute/property bindings to the DOM. On every pass — including the very first, at mount — the
rendered `<input>`'s `.validity`, read at that point, still reflects the *previous* render's
committed state, not the one about to commit. On the first pass specifically, there is no rendered
control to read at all: `this.shadowRoot?.querySelector('input')` returns `undefined` until after
`firstUpdated()`.

**Measured consequence of getting this wrong** (`research.md` R2, the pre-fix behaviour): mount a
field with `pattern="[a-z]+"`, then assign `el.value = '123'`. The host reports valid, and a real
`form.requestSubmit()` succeeds with `123` in `FormData` — the pattern constraint was silently
bypassed because the merge read a `.validity` that had not yet caught up to the new value.

## Decision Drivers

* `ElementInternals.setValidity()` is a full replacement, not a layer — every UA-computed flag this
  element wants reported must be read and merged explicitly, every time.
* `willUpdate()` is the correct place to derive `invalid`/`errorMessage` in the same update cycle
  a property change causes (see the element's own rationale, cited above) — moving the merge to
  `updated()` to dodge the timing problem was considered and rejected because it would reproduce
  the exact one-cycle-late bug that moved validation into `willUpdate()` in the first place, one
  level up (`sk-form-input.ts:180-182`).
* A field that mounts already invalid (e.g. a required field with no seeded value, or a value that
  already violates a forwarded `pattern`) must report that correctly on the very first
  `updateComplete`, not two cycles later — `firstUpdated()` re-running `validate()` fixes the
  *anchor* problem (see below) but does not, by itself, fix a merge that depends on a rendered
  control that did not exist during the first `willUpdate()` pass.

## Considered Options (per `research.md` R2's own three-pass history)

`research.md`'s R2 section documents this as three real passes, two of which were wrong and each
caught by measurement — not a single clean derivation:

1. **Read the rendered control's `.validity` directly, no sync step** (original draft). Has the
   read-before-write timing bug described above: `willUpdate()` fires before the current update's
   `render()` commits, so `control.validity` reflects the previous render.
2. **Sync the rendered control's DOM state to the current property values, then read its
   `.validity`** (squad-fold revision's prescribed fix). This looked like the obvious repair for
   option 1's timing bug, and does fix it for every update *after* the first. It does not fix the
   mount-time case: the rendered control does not exist yet during the very first `willUpdate()`
   pass, so there is nothing to sync onto. It also introduced its own defect, independent of
   timing: syncing `control.pattern = this.pattern ?? ''` compiles an *unset* pattern to the HTML
   pattern algorithm's `^(?:)$` — which matches only the empty string — rather than "no
   constraint," reported as `patternMismatch: true` for a plain, unconstrained `"x"`.
3. **A detached validation probe** (pre-merge debugger lens's fix — what shipped). Replaces "sync
   the rendered control" with a private `<input>`, created once, never rendered or connected to any
   document, synced from the current reactive-property values on every `validate()` call.
   Constraint validation (`patternMismatch`, range/step/type mismatches) is a pure attribute-plus-
   value computation — it needs no layout and no DOM connection — so an unconnected input computes
   the same flags a connected one would, on every pass, mount included, with no dependency on
   render timing at all.

Also considered and rejected, independently of the above three-pass history — **re-deriving each
constraint's validity by hand** (parsing `pattern` as a regex, comparing `min`/`max` numerically).
`research.md` R2 records this as "needless reimplementation of what the UA already computes
correctly, and a second source of truth that could disagree with the UA's own judgement." This
rejection is revisited below, because the alternative that shipped is *also*, in a real sense, a
second source — see "The R2 rejection, restated against what shipped."

## Decision Outcome

**Chosen option: the detached validation probe (option 3 above), with one deliberate exception.**

`#probe: HTMLInputElement` (`sk-form-input.ts:157`) is a private field, created once in its
initializer, never appended to any document. On every `validate()` call (`sk-form-input.ts:262`):

1. `probe.type = this.type` is assigned **before** `probe.value = this.value`. Order is load-
   bearing: the probe is long-lived, reused across every call, so assigning `value` before `type`
   validates the *new* value against the *stale* type for one pass. Measured: a same-update
   `type` change from `number` to `text` together with a `value` change from `'123'` to `'abc'`,
   under `pattern="\d+"`, assigned value-then-type, silently sanitized `'abc'` against the
   still-`number` probe to `''` (a property assignment raises no flag, not even `badInput`); the
   probe's `type` then flipped to `text`, but its value stayed the already-sanitized `''`, and an
   empty value never mismatches a pattern. The merge reported no flags while the real, rendered
   control (type `text`, value `'abc'`) genuinely mismatched `\d+`.
2. `pattern`/`min`/`max`/`step` are set-or-removed on the probe from the current property values —
   never `?? ''` (that is option 2's bug, reproduced above; both `null` and `undefined` mean
   "attribute removed").
3. `patternMismatch`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `typeMismatch` are merged
   from the **probe's** `.validity`.
4. `badInput` is merged from the **real, rendered control** — never the probe. This is measured,
   not a stylistic choice: `badInput` reflects the UA's own record of a genuine, unparseable
   keystroke sequence (e.g. typing `12e` into a `type="number"` field). A bare native
   `<input type="number">`, assigned `.value` directly — even with a dispatched `input` event —
   never sets `badInput` (measured on a real `<input>`, not assumed). The probe receives only
   property assignments, so it structurally cannot ever observe `badInput`; only a control the
   user has actually typed into can. This is safe from the exact mount-time race the probe exists
   to close: a user cannot type into a control that has not rendered yet, so the real control is
   never `undefined` at a point where `badInput` could genuinely be true.
5. `firstUpdated()` (`sk-form-input.ts:447`) re-runs `validate()` once the shadow root exists. This
   is a separate fix from the probe and solves a different problem: `setValidity()`'s third
   argument is the focus anchor for `reportValidity()`, and `willUpdate()` runs before the anchor
   element exists. Without this, a field that mounts already-invalid would report validity with no
   real element to anchor the browser's own validation UI to.

### The `#onInput` regression, and its fix

A related, later-discovered bug in the *input handler* (`#onInput`, `sk-form-input.ts:505`), fixed
in the same #180 development arc: while the real control's `badInput` is true, the UA has
sanitized `.value` (often to `''`) but keeps the user's raw, unparsed text in the control's own
internal edit buffer. `#onInput` deliberately does **not** copy that sanitized value onto
`this.value` while `badInput` is true — doing so would let the next Lit render's `.value=` binding
commit the sanitized value back onto the same control, destroying the UA's own in-progress edit
buffer (measured: a `type="date"` field mid-edit resolved to a fabricated wrong date instead of
what the user actually typed).

That guard, however, created a second, independent bug: `this.value = control.value` becomes a
**no-op** exactly when a user types a bad character and then undoes it back to the *identical*
prior value (e.g. `"5"` → `"5e"` → Backspace → `"5"` again). Lit's dirty-check sees `this.value`
unchanged, schedules no update, `willUpdate()` never re-runs, and the invalid state computed while
`badInput` was momentarily true is left standing **forever** — an untouched-looking field the user
merely mistyped into and corrected stays permanently invalid, with no property change able to
recover it. The fix: `#onInput` calls `validate()` **unconditionally** at the end of the handler,
not only from inside the value-write branch — idempotent and cheap, since it reads the same
already-synced probe. Both the regression and the fix are exercised by real, passing tests:
`[SC-003] undoing a bad keystroke back to the IDENTICAL prior value still re-validates — the
unconditional validate() fix` and `[SC-003] an untouched-looking empty number field survives a
mistype-and-undo` in `fixtures/elements-behaviour/src/sk-form-input.test.ts`.

### The R2 rejection, restated against what shipped

`research.md` R2 rejected hand-reimplementing constraint validity as "a second source of truth
that could disagree with the UA's own judgement." That rejection is about a **different**
mechanism than what shipped — reimplementing the UA's own algorithms (parsing a regex, comparing
numbers) versus delegating to a second, UA-computed `ValidityState` on a detached element. But the
detached probe **is** a second source: two separate objects, the probe and the rendered control,
each independently computing its own `ValidityState` from state this element is responsible for
keeping in sync between them. R2's underlying concern — that a second source could disagree with
the UA's own judgement on the real control — did not evaporate by choosing the probe design over
hand-reimplementation. It recurred, in a different form, during #180's own development:

* The type-then-value assignment-order bug (above) is the clearest instance: the probe reported no
  flags while the real, rendered control, under the same intended type and value, genuinely
  mismatched its pattern. That is precisely a second source disagreeing with the UA's own judgement
  on the actual control — not a reimplementation bug, but a synchronization bug with the same
  observable failure mode R2 warned against.
* The two earlier-pass bugs (read-before-write timing; the `?? ''` pattern-compilation defect in
  the "sync the rendered control" fix) are a related but distinct failure mode: each is a single
  source computing an answer that did not match the developer's *intended* state, rather than two
  live sources disagreeing with each other. They are recorded here because they are part of the
  same three-pass history and the same general lesson — keeping any UA-delegate object (a synced
  rendered control, or a detached probe) in exact correspondence with intended state is
  failure-prone, and this mission needed three measured passes to get right.

**This risk is scoped, not eliminated, by the shipped design.** No flag is ever decided by both
sources at once — the five constraint flags are the probe's alone, `badInput` is the real
control's alone — so the design cannot produce a direct, simultaneous vote-conflict between the
two sources on a single flag. But it does not follow that the two sources are guaranteed to agree
on the flags each is exclusively responsible for; the assignment-order bug demonstrates a case
where the probe's answer and the real control's answer, for the same intended state, differed. The
mitigation that shipped is narrow and empirical — three specific, tested synchronization rules
(type-before-value ordering; set-or-remove, never `?? ''`; badInput sourced only from real
keystrokes) — not a structural guarantee that a fourth such bug cannot exist.

### R9 — value authority, cited as settled context (not extended here)

`research.md` R9 records a separate, already-operator-ruled question: whether `setFormValue()`
should submit `this.value` raw or sanitized when the current `type` cannot represent it. The
ruling (detect-and-flag, submitted value stays raw) uses the same probe: after it is synced to the
current type/value/pattern/min/max/step, an empty probe value against a non-blank property value
means the UA would have sanitized the property's value away entirely, and that is merged as the
programmatic analogue of `badInput`. **This settles only that one narrow slice.** It does not
answer, and this ADR does not extend it to answer, the broader question below of what invariant
ties the probe, the rendered control, and `setFormValue()` together in general.

## Corrected premise: `sk-form-textarea` does not yet clone this mechanism

Issue #188 states "`sk-form-textarea` is a near line-for-line clone of `sk-form-input`, so the
second implementation is already predictable." Checked against the shipped source on this branch
(`packages/elements/src/form-textarea/sk-form-textarea.ts`): true of the element's overall shape
(form association, label, error rendering, the reset/disabled callbacks) but **not** true of the
validation-merge mechanism specifically. `sk-form-textarea` forwards no `pattern`/`min`/`max`/
`step`/`maxlength` — it has no forwarded UA constraint for a probe or a real-control read to merge,
so its `validate()` (`sk-form-textarea.ts:136`) has no probe field at all and derives only
`valueMissing` and `customError`, both computed directly from element state with no UA delegation.
The shared `FormControlBase` (`packages/elements/src/form-control-base.ts`) that both elements
already extend declares `validate()` **abstract** deliberately (`form-control-base.ts:176`,
"the base cannot know a subclass's derived rules") — it does not centralize the probe mechanism
today. So as of this ADR, **no second implementation of the probe pattern exists yet**; #179 and
#122 would be the first real reuse decision, not a second clone repeating one that already
happened. This does not weaken issue #188's case for recording the mechanism now — if anything it
sharpens it: the record needs to exist *before* the first reuse, not after a second independent
derivation has already occurred.

## Open Questions

This ADR is explicitly a descriptive record of what shipped and why. It does **not** answer either
of the following, both raised by issue #188 and both owed to the operator:

1. **Is the detached probe the sanctioned pattern for #179 (`sk-time-series-chart`) and #122
   (shared `form-control-base`), or is post-render revalidation the preferred general shape?**
   Neither #179 nor #122 has implemented any UA-flag merge yet (see "Corrected premise" above), so
   this is a live, first-instance decision, not a retrofit. Arguments exist for either answer —
   the probe pattern is proven and tested here, but carries the synchronization-risk profile
   documented above; a post-render approach would read the real, single source of truth but
   reintroduces the exact one-cycle-late problem `willUpdate()` was chosen to avoid, one level up
   — and this ADR takes no position between them.
2. **What invariant ties the probe, the rendered control, and `setFormValue()` together?** R9
   settled the value-authority slice (submission stays raw; divergence is detected, not
   sanitized). It did not, and this ADR does not, state a general rule for how these three
   representations of "the field's current state" must relate to each other across the whole
   validation and submission surface. A future shared base (#122) that centralizes any part of
   this needs that invariant stated explicitly first, not inferred from one element's comments.

Neither question is answered here. This section exists so the operator can rule on both without
re-deriving the mechanism from `sk-form-input.ts`'s own comments first.

## Verification notes

Traced directly against `packages/elements/src/form-input/sk-form-input.ts`, `packages/elements/
src/form-textarea/sk-form-textarea.ts`, `packages/elements/src/form-control-base.ts`, and the
passing tests named above, all as they exist on this branch (commit `1405e75`, this mission's
branch point) — not assumed from issue #188's or `research.md`'s prose alone. Not independently
re-run: the browser-mode test suite itself (the two named tests were read as source, confirmed to
assert the claimed behaviour by inspection, and not re-executed under Vitest as part of authoring
this ADR — the mission's own constraint is "no code changes," and running the suite was judged
unnecessary to state facts already covered by the tests' own passing status on `main`/the train).
No claim is made here about `sk-time-series-chart` (#179) or any future `form-control-base`
consolidation beyond what is directly observable in the current, unmerged state of those issues.

### Operator override — writing this ADR outside #67

**Recorded for the record.** ADRs are ordinarily written only in #67, which is closed.
`docs/architecture/elements-first-run-prompt.md` §4 states: "ADRs 8–13 pin every decision these
missions need, and ADRs are written only in #67," and separately lists "Write an ADR outside #67"
under "What this loop must never do." Issue #188 was filed, rather than decided, by the pre-merge
gate on #187 — "Filed rather than decided, per the operator ruling that forks go to issues while
the ADR route is closed" — the same shape issue #176 was filed and authorized in (recorded in
ADR-10's "Styles-only components are a class, not a fixed exception count" section) and issue #189
was filed and authorized in (recorded in ADR-11's "The wrapper prop-name invariant this ADR
omitted" section). This ADR is written under that same, specific, operator-recorded authorization
for issue #188 — not by this loop's own extension of the "#67 only" rule to a case it happened to
find convenient.

### Consequences

#### Positive

* The mechanism, its rationale, the measured pre-fix failure, and the `#onInput` regression/fix
  now have one durable, citable record — instead of living only in one element's `//` comments and
  one mission's `research.md`.
* The R2 rejection is no longer left standing unexamined against a design that is, in fact, a
  second UA-computed source — a future reader will not mistake the probe design for having closed
  that question.
* Both of issue #188's genuinely architectural forks are now stated precisely enough for the
  operator to rule on without re-deriving them from source.

#### Negative

* This ADR settles nothing about reuse. #179 and #122 still need an explicit decision before
  either can proceed with confidence, and this record does not shorten that wait — it only makes
  the decision cheaper to make correctly when it happens.
* The synchronization-risk profile described above is real and unresolved: nothing here proves a
  fourth desynchronization bug of this shape cannot exist in the shipped mechanism.

#### Neutral

* No code changed to produce this record. `packages/elements/src/form-input/sk-form-input.ts` and
  `fixtures/elements-behaviour/src/sk-form-input.test.ts` are unchanged by this ADR.

### More Information

* Related: ADR-9 (shadow DOM / styling API — the same containment reasoning this element's label
  and description properties rely on), ADR-10 (`#176` override precedent), ADR-11 (`#189` override
  precedent).
* Evidence: `packages/elements/src/form-input/sk-form-input.ts` (`#probe` at line 157, `willUpdate`
  at 183, `validate()` at 262, `firstUpdated()` at 447, `#onInput` at 505); `packages/elements/src/
  form-textarea/sk-form-textarea.ts` (`validate()` at 136 — no probe); `packages/elements/src/
  form-control-base.ts` (`validate()` declared abstract at line 176); `fixtures/elements-behaviour/
  src/sk-form-input.test.ts` (the badInput and undo-to-identical-value tests, `[SC-003]`);
  `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/research.md` (R2, R9); issue #188.
