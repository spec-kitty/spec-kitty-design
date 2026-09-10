# Research: `.sk-button` busy axis

Companion to [`plan.md`](./plan.md). Each item is a decision with its evidence, not a restatement of
the plan's own prose.

## R-00 — Cross-mission cue decision: consumed by reference, not restated

**Decision**: This mission does not re-derive or restate the TKT5/TKT6 activity-cue ruling. The
canonical record is `kitty-specs/progress-indeterminate-01M25C78/spec.md`'s "Cross-Mission Decision:
TKT5/TKT6 Activity Cue" section, committed on the `mission/progress-indeterminate` branch in the
`306` mission's own checkout (`/home/jeroennouws/dev/spec-kitty-design-missions/306`) — not linkable
as a relative path from this checkout, since `spec-kitty` mission directories are per-checkout and
this repository clone does not contain #306's branch. `spec.md`'s own "Cross-Mission Decision"
section quotes the ruling and its binding consequences in full; this entry exists so `research.md`
names where the authority lives without a reader having to search two documents to find the same
citation twice.

**Verification that this mission's design does not violate the ruling**: `git grep -rn "sk-progress\|<progress" packages/elements/src/button/ packages/styles/src/button/` at this mission's base
returns zero matches, and this mission's plan introduces none (the cue is a `<span>` with `part`,
`aria-hidden`, and CSS-only geometry — no `<progress>`, no shared class name, no shared file).

## R-01 — ADR-15 applicability, measured directly rather than trusted from the issue text

**Decision**: `sk-button`'s static form may freeze now, unconditionally, per the operator's comment
on #305 and ADR-15's own text.

**Evidence**: `git grep -nE ':host|::slotted|container-type|::part' packages/styles/src/button/sk-button.css`
at `train/elements-first@4d4031f` (this mission's base) returns exactly one line:

```
:host {
  display: inline-flex;
}
```

ADR-15's decision table rules three construct kinds: a host-attribute axis inside a host-owned
`@container` (generated wrapper required), a host-owned `container-type` (generated wrapper
required), and `::slotted()` (shadow-only, no static equivalent). `sk-button.css` exhibits none of
these — its only `:host` rule is a bare `display` declaration, which `adding-a-component.md`'s own
table (itself citing ADR-15) states explicitly: "`display: …` → The collapse holds. `.sk-<name>`
restates it; nothing else is needed." The busy axis this mission adds is a new root-class modifier
(`.sk-button--busy`) on the existing `.sk-button` class, not a new `:host` rule of any kind — so this
conclusion holds unchanged after this mission's own diff, not only before it (re-verified as a final
gate-matrix step in `plan.md`).

**Alternative considered and rejected**: waiting for #309 (the generator ADR-15 calls for host-owned
`container-type`/host-attribute axes) before freezing. Rejected because #309's scope is the three
construct kinds ADR-15 actually gates, none of which `sk-button` exhibits — waiting would be blocking
on a dependency this component does not have, not an abundance of caution.

## R-02 — No component-scoped #286 no-literal test, distinguished from both existing precedents

**Decision**: not needed for this mission. See `spec.md`'s "Decision" section for the reasoning
presented to the mission's own readers; this entry adds the comparative evidence table that produced
it.

**Evidence, `sk-button.ts`'s current `render()` (read in full at this mission's base)**: it emits
exactly one text-bearing surface — `<slot></slot>` — plus one attribute forwarded unchanged from a
consumer-supplied property (`aria-label=${ifDefined(validLabel)}`). No literal string is written
into the accessible tree or visible content by `render()` itself.

**This mission's diff to `render()`**: (a) widen the class-list computation
(`buttonClasses(this.variant, this.size)` → `buttonClasses(this.variant, this.size, this.busy)`) and
(b) add one unconditional, `aria-hidden="true"`, text-free `<span part="busy-cue">`. Neither change
adds a code path that could emit a literal — (a) is a boolean flag consulted by an existing pure
function, (b) is a decorative node with no `content:`, no default text, and no slot.

| | #308 (`sk-confirm-dialog`, added a component-scoped test) | #302 (`sk-pill-tag`, decided not needed) | #305 (`sk-button`, this mission) |
|---|---|---|---|
| Element age | Brand new | Existing | Existing |
| `render()` before the mission | N/A (new) | Zero literals, fully slot-driven | Zero literals, slot + forwarded attribute |
| New copy-bearing property/slot added by the mission | Yes — title, body, confirm label, cancel label (four new fields, the component's entire reason to exist) | No — widens an existing class-list read to a third property | No — adds a boolean flag and a text-free decorative node |
| Code path capable of emitting a literal after the mission | Yes, inherently (the whole point of the new element) | No (no text node added or made conditional) | No (no text node added or made conditional) |
| Decision | Add a component-scoped, unmarked, red-first test | Not needed | **Not needed — this mission's evidence matches #302's shape, not #308's** |

**Why this is not merely "the issue says decide, so decide either way is fine"**: the operator brief
for this mission explicitly warns that `sk-button` "has a real `render()`" unlike #302/#306, implying
the answer might differ from theirs. It does not, but not by default — it is because the specific
*kind* of change this mission makes to that real `render()` (a boolean flag and a text-free
decorative node) carries none of #308's copy risk, which was inherent to that mission's four new
copy fields specifically, not to "having a real `render()`" in the abstract. A future mission that
adds an actual copy-bearing property to `sk-button` (there is no such plan today) would need to
re-ask this question on its own evidence, not inherit this mission's answer.

## R-03 — Disabling-mechanism independence is verifiable by selector inspection, not only by rendering

**Decision**: assert independence two ways — (a) statically, by reading `sk-button.css`'s busy rule
selectors and confirming none references `:disabled`/`[disabled]`/`[aria-disabled]`, and (b)
dynamically, by rendering both combinations and asserting the expected computed styles and platform
tab-order behaviour.

**Evidence this is necessary, not redundant**: a selector-only check (a) would pass even if
`sk-button.ts`'s `render()` conditionally suppressed the cue node when `aria-disabled` is present (a
JavaScript-level coupling the CSS selectors would never reveal), and a rendering-only check (b) would
pass by coincidence if the busy rule happened to be scoped narrowly enough to never actually collide
with the disabled rule in the fixtures tested, without proving the general independence a future
edit could quietly break. Both are required; `plan.md`'s Test-file strategy item 2 covers (b), and
item 4's CSS-parsing technique (already applied to reduced-motion/forced-colors) is reused for (a) —
the same `sk-button.css?raw` import can assert the busy selector text contains no disabling-attribute
token, by parsing the sheet's rule list rather than by string search on the source (avoiding a false
match on an unrelated comment).

## R-04 — Cue geometry technique: absolute positioning, carried-forward measurement risk

**Decision (technique, fixed by `plan.md`)**: the cue is a real DOM node, `position: absolute`,
confined to the button's own padding box, present in the DOM whenever the element exists (not
conditionally rendered), with `busy`-keyed CSS controlling only `visibility`/`opacity`/`animation`.

**Why this is the right *direction*, argued from the existing failure the epic evidence names**:
Family 4's T2/T4 hand-authored spinners (`.saving-spinner`, `.sending-spinner`) are exactly the case
this must not repeat — a spinner inserted into normal flow (an added flex/inline child) necessarily
widens its container unless something else shrinks to compensate, which is the mechanism of the
layout shift the issue calls out as "the concrete defect in both hand-authored versions." Taking the
cue out of flow entirely (`position: absolute`) removes the mechanism, rather than trying to
compensate for it (e.g., by reserving equal-and-opposite padding, which would need to differ per
label length and would not be zero-shift for a change in label length coinciding with a busy
toggle — an edge case absolute positioning avoids by construction).

**What is NOT yet measured, named as risk rather than assumed solved**: the specific inset/size
values that keep the cue from visually colliding with slotted content at every size, especially
`--icon` (already a fixed, small, content-filled box) and `--sm` (reduced padding). This mission's
plan fixes the mechanism (absolute positioning, existing tokens only) and defers the specific pixel
values to implementation, where they are measured against `getBoundingClientRect()` on the real
built stylesheet — exactly mirroring #306's own plan's treatment of its keyframe sweep values as a
"carried-forward execution risk," not a product ambiguity requiring a spec-level decision.

## R-05 — Token inventory sourced from the real catalogue, not invented

**Evidence**: `packages/tokens/src/tokens.css` was read directly (not assumed from naming
convention). Confirmed present at this mission's base: `--sk-motion-duration-fast/base/slow`,
`--sk-motion-ease-out/in-out` (lines 299-303); `--sk-space-1` through `--sk-space-12` (lines
234-245); `--sk-border-width-1` through `-4` (lines 199-205); `--sk-border-default`/`-strong`/`-focus`
(lines 196-198); `--sk-fg-default`/`-body`/`-muted`/`-on-primary` (lines 184-192, both the dark
`:root` block and the light override further down the same file). `plan.md`'s "Token inventory"
table cites the exact tokens this mission's CSS will reuse; none is new. This discharges NFR-005
("no new token category without a demonstrated gap") by showing no gap exists, rather than by
asserting the conclusion.

## R-06 — ADR-11 applicability confirmed against the pinned id set, not assumed absent

**Evidence**: `tests/node/config-contract.test.ts` pins `behaviours.json`'s applicable id set to
SC-002 through SC-017 (SC-023 separately declared inapplicable, discharged by a CI gate rather than a
test subject). `sk-button` is already declared a subject of SC-010 (property-before-upgrade),
SC-013 (styling API / parts), and SC-014 (style adoption) — confirmed by `grep -n '"sk-button"'
behaviours.json`, which shows it under all three id blocks.

**Checked against each remaining id for whether the busy axis newly triggers it**:

| id | Category | Newly triggered by `busy`? | Why not |
|---|---|---|---|
| SC-002–005 | Form association | No | `sk-button` is not form-associated; unchanged by this mission |
| SC-006–009 | Event contract | No | This mission adds no event |
| SC-011 | Slot contract | No | The existing `<slot>` is unchanged; the busy cue is not slotted content |
| SC-012 | Focus and keyboard | No | This mission adds no keyboard handling; the existing delegated-focus behaviour is unchanged (verified: `sk-button.ts`'s `shadowRootOptions.delegatesFocus` and the render template's control structure are untouched) |
| SC-015 | Registry guard | No | Unrelated to this mission's diff |
| SC-016 | Delegate/rendered-control correspondence | No | `sk-button` has no detached validity probe; not applicable per `adding-a-component.md`'s own description of which elements this reaches (`sk-form-input` only) |
| SC-017 | Responsive threshold | No | The busy axis's behaviour does not change at a documented viewport width or height — it is a boolean state, not a breakpoint-driven one |

**Conclusion**: no new id becomes applicable; `behaviours.json` needs no new `sk-button` subject
entry. `mutations.json` may still gain new arms under the three already-declared ids (an SC-013 arm
for the new `busy-cue` part is anticipated, per `plan.md`'s "Cue design" section), which is
permitted without touching `behaviours.json` at all — declaring a subject and adding a mutation arm
under an already-declared subject are different actions, and only the former is what
`adding-a-component.md` step 4 calls "creating the obligation."

## R-07 — Layout-shift measurement precision: three points, not two, per the #308 lesson

**Decision**: `plan.md`'s Test-file strategy item 1 measures idle → busy → idle, not idle → busy
alone.

**Why, named explicitly rather than left implicit**: the squad's recent #308 finding —
`.sk-confirm-dialog { display: flex }` declared with no `[open]` qualifier, so the CLOSED dialog
never actually hid, undetected across 602 tests, a 243-mutation harness, and axe over 592 stories,
because every test exercised the OPEN state and none asserted CLOSED — is the direct precedent this
mission's own two-state feature must not reproduce. A test that only measures idle→busy could pass
even if a defect made busy→idle fail to fully restore the original geometry (e.g., a `visibility:
hidden` cue that leaves a lingering `min-width` behind after the animation's `animation-fill-mode`
resolves unexpectedly) — exactly the shape of bug the closed-dialog defect took in a different
component. Measuring the return-to-idle explicitly, and asserting it against BOTH the pre-busy and
the busy measurements (not merely "idle again, whatever that measures as"), closes this specific gap
by construction rather than by hoping the busy-state assertion generalizes.
