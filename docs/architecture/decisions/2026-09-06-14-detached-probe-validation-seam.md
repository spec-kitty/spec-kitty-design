# ADR 14 (2026-09-06): The Detached-Probe Validation Seam

**Date:** 2026-09-06
**Status:** Proposed. Descriptive record only — see "Open Questions" below for the three forks this
ADR deliberately does not settle.
**Deciders:** None recorded for this ADR itself. The mechanism it describes was decided during the
#180 mission and corrected during the #187 mission, neither of which wrote an ADR for it at the
time — that gap is what issue #188 raised and this ADR closes. Writing an ADR outside #67 follows
the #176/#189 precedent and this mission's `[adr]` dispatch, not an operator ruling quoted for
#188; see "Why this is a new ADR, and how it came to be written outside #67" below.
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
control to read at all: `this.shadowRoot?.querySelector('input')` returns `null` until after
`firstUpdated()` — `validate()` coalesces that to `undefined` (`sk-form-input.ts:286`,
`?? undefined`), so the local `control` binding is `undefined` on that pass.

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
initializer, never appended to any document. On every `validate()` call that is not barred early
(`sk-form-input.ts:262`; see "The two barring arms" below):

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
4. `badInput` is the one flag with **two writers** — it is the only flag both sources reach.

   The first writer reads the **real, rendered control** (`sk-form-input.ts:372`,
   `if (control?.validity.badInput) flags.badInput = true;`). That read is measured, not a
   stylistic choice: `badInput` reflects the UA's own record of a genuine, unparseable keystroke
   sequence (e.g. typing `12e` into a `type="number"` field). A bare native
   `<input type="number">`, assigned `.value` directly — even with a dispatched `input` event —
   never sets `badInput` (measured on a real `<input>`, not assumed). The probe receives only
   property assignments, so it can never observe *that* `badInput`; only a control the user has
   actually typed into can. This read is safe from the exact mount-time race the probe exists to
   close: a user cannot type into a control that has not rendered yet, so the real control is
   never `undefined` at a point where the UA's `badInput` could genuinely be true.

   The second writer is the **probe's** (`sk-form-input.ts:401`,
   `if (this.value.trim() !== '' && this.#probe.value === '') flags.badInput = true;`) — the
   detect-and-flag half of the R9 ruling described below, merged as the programmatic analogue of
   `badInput` when the UA sanitizes a non-blank property value away entirely. So the flag is not
   "the real control's alone."

   **The two writers are disjoint by timing, not by construction.** The element's own comment
   (`sk-form-input.ts:395-400`) states the mechanism precisely: while a user is actively typing an
   unparseable value, `#onInput` deliberately does not write `this.value`, so `this.value` — and
   the probe synced from it — holds the last *good*, non-empty value, and the probe branch stays
   silent for exactly the duration the real-control branch already covers. Nothing in the shape of
   `validate()` prevents both branches from firing on one pass; what prevents it is a runtime
   invariant maintained in a different method. And if both did fire, no conflict would surface:
   both write `flags.badInput = true` and nothing ever writes it `false`, so the merge is an OR —
   a disagreement between the two sources on this flag resolves to `true` rather than being
   detected.
5. `firstUpdated()` (`sk-form-input.ts:447`) re-runs `validate()` once the shadow root exists. This
   is a separate fix from the probe and solves a different problem: `setValidity()`'s third
   argument is the focus anchor for `reportValidity()`, and `willUpdate()` runs before the anchor
   element exists. Without this, a field that mounts already-invalid would report validity with no
   real element to anchor the browser's own validation UI to.

### The two barring arms: `disabled` and `readonly` never reach the probe

`validate()` does not always reach any of the above. Its first two statements return early
(`sk-form-input.ts:271-285`): a `disabled` element and a `readonly` element each clear validity
outright (`internals.setValidity({})`, `invalid = false`, `errorMessage = ''`) and return before
the probe is synced or a single flag is derived. This is architectural, not defensive
housekeeping. A user agent normally bars a disabled form-associated element from constraint
validation itself — but this element deliberately does **not** reflect `disabled` (or `readonly`)
to an attribute, because that unreflectedness is what keeps the SC-005 and SC-003 mutations
observable, so the UA cannot see either state and the element has to bar itself. Without the
`disabled` arm a disabled, required, empty field vetoes its whole form permanently, and the user
cannot clear it because the field is disabled. The `readonly` arm is the matching case with one
deliberate asymmetry recorded in the code: barred from constraint validation, but the value is
still submitted — `syncFormValue` has no `readonly` branch, on purpose.

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

**This risk is scoped, not eliminated, by the shipped design.** The five constraint flags
(`patternMismatch`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `typeMismatch`) are the
probe's alone, so on those no second source can contradict it. `badInput` is the exception, and it
is worth stating exactly rather than rounding off: it has **two writers** — the real control at
`sk-form-input.ts:372` and the probe at `:401` (see Decision Outcome item 4) — which are disjoint
**by timing, not by construction**. `#onInput` withholds `this.value` for precisely the window in
which the real control's `badInput` is true, which is what keeps the probe branch silent there;
that is an invariant held in another method, not a property of `validate()`'s structure. The merge
is also an OR in both cases: each branch only ever writes `true`, so if the two sources ever did
disagree on `badInput`, the disagreement would resolve to `true` rather than surface as a
detectable conflict. That is a materially weaker guarantee than "the design cannot produce a
vote-conflict." Nor does it follow that the two sources are guaranteed to agree
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

This ADR is explicitly a descriptive record of what shipped and why. It does **not** answer any of
the following three questions, all of them raised by issue #188 ("What an ADR should settle") and
all of them owed to the operator:

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
3. **Where does the pattern live once #122 lands a shared base?** Issue #188 poses this as its own
   fork, and it is not subsumed by question 1: question 1 asks *whether* the probe is the
   sanctioned mechanism, question 3 asks *where the mechanism lives* — implemented once on the
   shared base, or derived per element — and it survives either answer to question 1 (a
   post-render approach would face the same placement question). Nothing centralizes it today:
   `FormControlBase.validate()` is deliberately **abstract** (`form-control-base.ts:176`, "the
   base cannot know a subclass's derived rules"), so #122 would be deciding where this belongs for
   the first time rather than relocating an existing arrangement.

None of the three is answered here. This section exists so the operator can rule on all of them
without re-deriving the mechanism from `sk-form-input.ts`'s own comments first.

## Verification notes

This section stands in for the `Confirmation` section ADR-8 through ADR-13 each carry: a
descriptive record ratifies nothing that a later test could confirm, so what would be confirmation
criteria is instead a trace of what was read to write it.

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

## Why this is a new ADR, and how it came to be written outside #67

**A new record rather than an amendment.** #176 amended ADR-10 and #189 amended ADR-11 because
each of those ADRs owns the surface being corrected. No existing ADR owns validity *computation*:
ADR-9 §4 owns the form-association arrangement this element sits inside (label ownership, the
control living in the shadow root, why an ID reference cannot cross the boundary) but says nothing
about how the UA's own flags are obtained; ADR-11 owns how element behaviour is *verified*, not
how it is derived. There is no section of either that this mechanism could be added to without
widening that ADR's subject, so it is recorded here instead.

**Written outside #67 — stated at its real strength.** ADRs are ordinarily written only in #67,
which is closed. `docs/architecture/elements-first-run-prompt.md` §4 says "ADRs are written only
in #67," and separately lists "Write an ADR outside #67" under "What this loop must never do."
**No operator ruling authorizing this particular ADR is on record, and this section does not claim
one.** What is on record is the route: issue #188 was filed rather than decided by the pre-merge
gate on #187 ("Filed rather than decided, per the operator ruling that forks go to issues while
the ADR route is closed"), titled `[adr]`, and dispatched to this loop as an `[adr]` mission. That
is the same route #176 and #189 took — but both of those ADR sections quote an affirmative ruling
of their own that this one has no counterpart to (ADR-10: "The operator ruled, 2026-09-05: amend
ADR-10, in #176, before merge"; ADR-11: "The operator authorized amending ADR-11 for #189 the same
way it authorized amending ADR-10 for #176"). This record therefore rests on that precedent and on
the dispatch, not on a ruling of its own — which is one of the reasons its Status is `Proposed`
rather than `Accepted`.

## Consequences

### Positive

* The mechanism, its rationale, the measured pre-fix failure, and the `#onInput` regression/fix
  now have one durable, citable record — instead of living only in one element's `//` comments and
  one mission's `research.md`.
* R2's rejection and R2's own rationale are reconciled for the first time. `research.md` was not
  silent about the two-source design: it carries a "Rationale for reading TWO sources (probe for
  five flags, the real control for `badInput`)" bullet
  (`kitty-specs/form-input-constraints-and-datalist-01M1S94Y/research.md:132-137`). What it never
  did was hold that bullet against its own rejection of "a second source of truth that could
  disagree with the UA's own judgement," recorded twelve lines later in the same section — the two
  sit in one file without ever meeting. This ADR is where they meet.
* All three of issue #188's genuinely architectural forks are now stated precisely enough for the
  operator to rule on without re-deriving them from source.

### Negative

* This ADR settles nothing about reuse. #179 and #122 still need an explicit decision before
  either can proceed with confidence, and this record does not shorten that wait — it only makes
  the decision cheaper to make correctly when it happens.
* The synchronization-risk profile described above is real, and it is now **observed** rather than
  merely unresolved. Nothing here proves a fourth desynchronization bug of this shape cannot exist
  in the shipped mechanism — that claim is unchanged and this ADR does not strengthen it. What has
  changed is the second half of the original sentence, which said "no gate would catch one if it
  did": ADR-11's required-behaviours list carried nine items, none of them about how the flags were
  derived, and #196 was filed so the admitted risk had an owner. **Corrected 2026-09-07:** the
  operator ruled #196 and #204 together, ADR-11 gained item 10
  (delegate/rendered-control correspondence), and the three bugs recorded in this section are now
  asserted as one test — `[SC-003][SC-016] the probe and the rendered control agree for the same
  intended state` — with a red-first mutation behind it. This paragraph is corrected rather than
  deleted because the risk it names is still real: an entry is a gate against the shape of these
  three, not a proof about a fourth.

### Neutral

* No code changed to produce this record. `packages/elements/src/form-input/sk-form-input.ts` and
  `fixtures/elements-behaviour/src/sk-form-input.test.ts` are unchanged by this ADR.

## More Information

* Related: ADR-9 (shadow DOM / styling API — the same containment reasoning this element's label
  and description properties rely on), ADR-10 (`#176` override precedent), ADR-11 (`#189` override
  precedent).
* Evidence: `packages/elements/src/form-input/sk-form-input.ts` (`#probe` at line 157, `willUpdate`
  at 183, `validate()` at 262, `firstUpdated()` at 447, `#onInput` at 505); `packages/elements/src/
  form-textarea/sk-form-textarea.ts` (`validate()` at 136 — no probe); `packages/elements/src/
  form-control-base.ts` (`validate()` declared abstract at line 176); `fixtures/elements-behaviour/
  src/sk-form-input.test.ts` (the badInput and undo-to-identical-value tests, `[SC-003]`);
  `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/research.md` (R2 — both the
  "Rationale for reading TWO sources" bullet at :132-137 and the rejection at :141-145 — and R9);
  issue #188.
* Raises: #196 — the desync class this ADR admits it cannot rule out had no entry in ADR-11's
  required-behaviours list (ADR-11:52-62), and this ADR did not add one. **Closed 2026-09-07** by
  the #196/#204 amendment; see ADR-11's "The two entries this list was missing", which derives its
  item 10 from the three bugs recorded above.
