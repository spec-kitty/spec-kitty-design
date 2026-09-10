# ADR 16 (2026-09-10): The Static Form of Cross-Sheet `::part()` Styling

**Date:** 2026-09-10
**Status:** Proposed.
**Deciders:** None recorded. No product verdict on this surface exists anywhere and none is cited
here as evidence. This record's authority is its measurement and ADR-15's standing deferral, not a
review sign-off.
**Technical Story:** Issue #314, the fourth construct kind ADR-15 named in its Summary and
explicitly did not decide. Under epic #300. Seven children of that epic avoided `::part()` in a
static contract because this was open; `packages/styles/src/boundary-page/sk-boundary-page.css`
says so in the sheet itself — "that cross-sheet question belongs to #314 and stays undecided here".

---

## Context and Problem Statement

ADR-15 rules on the static (no-JavaScript) form of three shipped shadow-DOM CSS constructs, and
its ruling is a **split**: a host-attribute variant axis inside a host-owned `@container` and a
host-owned `container-type` get a generated static form, but only as a two-element wrapper
carrying the component's complete `:host` declaration set; `::slotted()` is **shadow-only**,
because no equality gate between the static and shadow forms can exist for it. While measuring
those three it found a fourth surface and deferred it to this record:

> `::part()` reached from **another sheet** — a fourth surface, found during this mission and
> outside #301's question | **shadow-only** for now; the decision is #314's, not this record's

**The question.** When a stylesheet reaches into a component's shadow tree through `::part()`,
what is the static form of that styling, and can the two forms be held equal by a gate?

The question is not academic and it is not large. Measured exhaustively at this head — `grep -rn
"::part(" packages/styles/src --include=*.css` returns four lines, of which **one** is a rule and
three are prose (`sk-notice.css:159`, `sk-boundary-page.css:23` and `:28`):

```css
/* packages/styles/src/metric/sk-metric.css:67 */
.sk-metric__annotation sk-pill-tag::part(tag) {
  box-sizing: border-box;
  max-width: 100%;
  padding-block: 0;
  padding-inline: var(--sk-space-2);
  overflow-wrap: anywhere;
  white-space: normal;
}
```

Beyond the one shipped rule the surface is larger in two directions, both counted rather than
estimated:

* **18** `::part()` rules across five Storybook story files (`sk-app-shell.stories.ts`,
  `patterns/mission-kanban`, `patterns/repository-dossier`, `patterns/work-explorer`,
  `patterns/team-overview`), reaching eight distinct elements. Those are *consumer-side* usage —
  a page restyling a component's internals, which is exactly what `::part()` is for.
* **141 declared parts across 29 elements**, verified three ways at this head and all three
  agreeing: `expected-parts.json`'s own `total` field and the sum over its `byElement` map;
  `packages/elements/custom-elements.json`'s `cssParts` entries; and a precise grep for the JSDoc
  tag line (`grep -rn "^\s*\*\s*@csspart " packages/elements/src --include=*.ts | wc -l`).
  `node scripts/check-part-ratchet.mjs` prints `141 declared part(s)`.

  **This corrects a figure that has travelled.** Issue #314's body and ADR-15's Confirmation both
  say "134 parts across 28 elements … the ratchet's manifest-derived 134 is the governed figure",
  and ADR-15 additionally frames 141 as an over-counting raw grep. Neither half holds at this
  head: 141/29 **is** the governed figure, `expected-parts.json`'s own `$comment` log records the
  two deltas that moved it (#308 added `sk-confirm-dialog`'s six parts, 134 → 140 and 28 → 29;
  #305 added `sk-button`'s busy cue, 140 → 141), and the number that is genuinely a naive grep is
  **148 across 30 files**, which over-counts prose mentions of the string `@csspart`. The stale
  134/28 is not repeated anywhere below.

ADR-9 §2 makes `::part()` this library's one declared public styling channel: "Adding a part is an
API addition; removing or renaming one is a breaking change." So "what does the static path get
for `::part()`?" is a question about the whole public styling surface, and it has never been
asked.

## Decision Drivers

* ADR-15's own standard, applied honestly rather than reached for a matching answer: a ruling is
  a **measurement or a named blocking mechanism**, never an assertion.
* A ruling that closes a door must say what a static consumer does instead. ADR-15's answer for
  `::slotted()` was an instruction in the sheet; if `::part()` needs the same, it must be named
  and owned rather than left to be noticed.
* Whatever is decided must be checkable by a gate rather than by review — the standard ADR-9 and
  ADR-11 set — or the record must say plainly that it is not, and why.
* The ruling must account for what already ships. A ruling contradicted by the first mission to
  apply it is worse than no ruling.

## The measurement

Committed under `kitty-specs/cross-sheet-part-static-form-adr16/measurement/`, re-runnable with
`node kitty-specs/cross-sheet-part-static-form-adr16/measurement/run.mjs`. The directory holds
`harness.mjs` (a near-copy of ADR-15's, so the two evidence sets read side by side), `run.mjs`,
`result.json`, the generated probe pages under `pages/` — each one openable in a browser, so any
outcome below can be reproduced by hand — and **two** declaration files:

* `outcomes.declared.json`, the cycle-1 bar, 27 outcomes, committed at `05947cb8` **before**
  `run.mjs` existed;
* `outcomes.declared.cycle-2.json`, 4 outcomes, committed at `bf3b6a89` **before** the run that
  measured them, which **adds** outcomes and rewrites none.

**The bar is the union: 31 outcomes.** `run.mjs` reads both files and refuses to write a result
whose outcome ids differ from that union, and refuses an empty declared set. This is ADR-15's
convention and it is followed here for ADR-15's reason: a declaration that can be edited after the
run is not a declaration.

**One cycle-1 expectation was wrong, and it is recorded as an erratum rather than repaired.**
Outcome S8 declared a divergence and measured equality. The declaration had treated a (0,2,0) tie
as a win; at equal specificity the reaching rule also has to be later, and on that page it was.
S8's measured value stands unamended and is *not* relabelled a pass — it is evidence in its own
right, because what it shows is a shipped-shaped comparison surviving on an ordering accident.
S9 and S10 in the cycle-2 file probe the two cases S8's declaration conflated.

**Engines.** Chromium 1234 and Firefox 1538 via Playwright 1.62.1. **All 31 outcomes produced
byte-identical values in both engines** — every measured value here is a keyword or an integer
pixel length, so ADR-15's "comparing within one engine" warning, which exists because
`sk-action-row`'s font-derived tracks differ sub-pixel between engines, does not bite on this
record's table. That is a property of what these outcomes measure, not a general one, and a gate
built on this surface still compares within one engine.

**WebKit could not be measured.** `webkit.launch()` fails on this host with "Host system is
missing dependencies to run browsers"; `result.json` records the message rather than omitting the
engine. That is ADR-10's already-recorded WebKit gap, unchanged and not newly introduced here.

**Real package consumption.** The probe rebuilt `tokens`, `styles` and `elements` from clean
(`rm -rf packages/{tokens,styles,elements}/dist` then `npx nx run <p>:build --skip-nx-cache`) and
serves component CSS through Node's own export-map resolution, so the bytes a probe page links are
literally the file `@spec-kitty/styles/<name>/sk-<name>.css` resolves to for an installed
consumer. `result.json`'s `resolved_specifiers` records each resolution. The element side is the
real built `packages/elements/dist/elements.js`, the self-contained classic script of ADR-10 §2 —
the same artifact Storybook serves at `/elements-dist/elements.js`. **The shared Storybook on port
6006 was never started or contacted**; the probe's own server binds a kernel-assigned port.

### Group M — what the cross-sheet `::part()` cascade actually is

Measured on a synthetic pair rather than on a shipped component, deliberately: the question "what
*is* this cascade" has to be answerable without a component's accidental specificities standing in
for the rule. `probe-tag` renders `<span part="tag" class="tag a b" id="inner">` in its shadow
root; `.wrap probe-tag::part(tag)` plays the role `sk-metric.css:67` plays for `sk-pill-tag`. The
static twin collapses the custom element away and keeps the part node as the root — which is
exactly what `sk-pill-tag`'s generated static form does.

| # | Form | The contest | Measured |
|---|---|---|---|
| M1 | shadow | reaching (0,1,2) vs inner (0,1,0), reaching sheet last | `white-space: normal` — **the outer rule wins** |
| M4 | shadow | the same rules, reaching sheet moved **first** in the document | `normal` — **order is not consulted** |
| M2 | shadow | reaching at the weakest a `::part()` rule can be, **(0,0,2)**, vs inner **(1,3,0)** | `padding-block-start: 4px` — **the outer rule still wins; specificity is not consulted** |
| M11 | shadow | **two outer-tree** reaching rules, (0,1,2) first vs (0,0,2) last | `4px` — **specificity IS consulted between rules of the same tree** |
| M6 | shadow | inner `!important` vs reaching normal | `40px` — inner wins (ordinary importance) |
| M7 | shadow | **both** `!important` | `40px` — **the INNER rule wins: importance REVERSES tree order** |
| M9 | shadow | a page rule `.tag { background-color: red }` | `rgb(0, 0, 255)` — **no effect; a document class selector cannot match inside a shadow tree** |

And the same contests against the flattened static twin, where both sheets are document sheets:

| # | Form | The contest | Measured | vs shadow |
|---|---|---|---|---|
| M3 | static | rewrite (0,2,0) vs inner (1,3,0) | `40px` | **diverges from M2** |
| M5 | static | tie at (0,1,0) each, rewrite authored first | `nowrap` | **diverges from M4** |
| M8 | static | both `!important`, rewrite at strictly higher specificity | `4px` | **diverges from M7** |
| M10 | static | the same page rule, page sheet last | `rgb(255, 0, 0)` | **diverges from M9** |

**The mechanism, named.** This is not a rule about `::part()`. It is CSS Cascade's **tree-order**
sort: when two declarations originate in different trees, normal declarations from the **outer**
tree win and important declarations from the **inner** tree win — before specificity is consulted,
and before source order is consulted. `::part()` and `::slotted()` are the *same* rule seen from
opposite sides:

| | Where the LIBRARY's declaration sits | Consequence |
|---|---|---|
| `::slotted()` | **inner** tree | the library always loses to the page |
| cross-sheet `::part()` | **outer** tree (the reaching sheet) | the reaching sheet always wins over the target component |

**This corrects something ADR-15 implies, and the correction is the reason the two rulings can
share a basis.** ADR-15 states the property as belonging to the construct — "an outer-tree
declaration beats a `::slotted()` declaration from the inner tree regardless of specificity". It
belongs to the cascade, not to `::slotted()`. M2 and M7 show the identical immunity operating with
the roles exchanged, and M11 bounds it: the immunity is strictly **cross-tree**, and two `::part()`
rules in the *same* sheet resolve on ordinary specificity like anything else. So ADR-15's kind-3
reasoning is not a special case; it is the general fact, and the general fact reaches this record's
surface unchanged.

### Group P — the shipped surface is reached across ONE boundary, and is not public

`<sk-pill-tag>` is written directly into `sk-metric`'s own `render()` template — it is **not**
slotted, and `sk-metric` has no `<slot>` anywhere. So `.sk-metric__annotation sk-pill-tag::part(tag)`
resolves its leading compound entirely inside `sk-metric`'s shadow tree and then crosses exactly
**one** boundary into the pill's. It is a library-internal composition, not a consumer one.

Measured on the real elements:

| # | Form | The consumer's rule | Measured |
|---|---|---|---|
| P1 | shadow | `sk-pill-tag::part(tag) { margin-block-start: 9px }` from the document | `0px` — **no effect**; `::part()` reaches one tree level, and the pill is two down |
| P2 | shadow | `sk-metric::part(tag) { margin-block-start: 9px }` | `0px` — **no effect**; `sk-metric` forwards no `exportparts` |
| P6 | shadow | P2's rule, with `exportparts="tag"` set on the nested pill at run time | **`9px`** — so P1/P2 are the absence of forwarding, not an incapacity of `::part()` |
| P4 | shadow | `.sk-pill-tag { background-color: red }` | `rgb(33, 40, 48)` — the token background survives; **the page cannot reach the node at all** |
| P3 | static | the same intent as `.sk-pill-tag { margin-block-start: 9px }` | **`9px`** — **diverges from P1/P2** |
| P5 | static | the same intent as P4, page sheet last | **`rgb(255, 0, 0)`** — **diverges from P4** |

The three-line summary a reader needs: in the element path the pill inside a metric annotation is
**unreachable from the page**, by any selector, at any weight. In a static path it is a plain
`<span class="sk-pill-tag">` that **any page rule can reach**. P6 shows the element path could
open that door with one attribute and does not.

### Group S — the shipped surface's values, and what the equality would rest on

Real `sk-metric` with an annotation, against a static twin reproducing its flattened shape and
carrying the naive rewrite of the six declarations as an ordinary document rule at (0,2,0):
`.sk-metric__annotation .sk-pill-tag { … }`. `sk-metric` has **no** generated static markup at
this head — no `sk-metric.markup.ts`, no `sk-metric.html` — so the twin's markup is written by
hand for the probe and is hypothetical. That is the point: the outcomes are about what its cascade
*would* be.

| # | Property | Shadow | Static (naive rewrite) | |
|---|---|---|---|---|
| S1 | `white-space` | `normal` | `normal` | equal |
| S2 | `padding-block-start` | `0px` | `0px` | equal |
| S3 | `padding-inline-start` | `8px` | `8px` | equal |
| S4 | `overflow-wrap` | `anywhere` | `anywhere` | equal |
| S5 | `box-sizing` | `border-box` | `border-box` | equal |
| S6 | `max-width` | `100%` | `100%` | equal |
| S7 | `white-space`, with `sk-pill-tag.css` ordered **after** the rewrite | `normal` | `normal` | equal |

**So the naive rewrite reproduces every shipped declaration, in both engines. That is the honest
starting point, and it is where a weaker record would stop.** The rewrite wins because (0,2,0)
strictly outbids `.sk-pill-tag`'s (0,1,0), which is the whole of what `sk-pill-tag.css` declares
today. Nothing about the tree-order guarantee is being reproduced; the two forms agree because
the specificities happen to line up.

Three outcomes show what that agreement rests on. Each adds **one rule to `sk-pill-tag.css`** —
the *target* component's own sheet. `sk-metric.css` is untouched, and the shadow form does not
move in any of them.

| # | The added rule, and where it sits | Shadow | Static | |
|---|---|---|---|---|
| S8 | `.sk-pill-tag.sk-pill-tag--future` at **(0,2,0)** — a tie — authored **before** the rewrite | `normal` | `normal` | equal |
| S10 | the **same rule**, authored **after** the rewrite | `normal` | **`nowrap`** | **diverge** |
| S9 | `.sk-pill-tag.sk-pill-tag--future.sk-pill-tag--future2` at **(0,3,0)** — strictly above the rewrite | `normal` | **`nowrap`** | **diverge** |

S8 and S10 are the same two rules at the same two specificities, and they differ only in document
order — which is a bundler's decision more often than a consumer's. S9 is a rule the component
owner may add on any ordinary day: a variant × shape × state compound in a component's own sheet is
the most unremarkable thing in this library.

### Group H — an ADR-15 follow-on, recorded because it changes what #310 must test

ADR-15's kind-1 and kind-2 verdict — the two-element wrapper carrying the component's complete
`:host` set — rests on 22 + 20 pre-declared outcomes. **Every one of them is library-only.** None
introduces a rule the *consumer* wrote. `:host` declarations sit in the inner tree; moved onto a
document wrapper class they become ordinary (0,1,0) document declarations. Measured on the real
`sk-action-row` and its real built sheet at 360px:

| # | Form | The consumer's rule | `display` | `container-type` | `.sk-action-row` `flex-wrap` |
|---|---|---|---|---|---|
| H1 | shadow element | `sk-action-row { display: flex }` — **(0,0,1)** | **`flex`** — consumer wins | `inline-size` | `wrap` |
| H2 | ADR-15's wrapper | `div { display: flex }` — **(0,0,1)** | **`block`** — consumer **loses** | `inline-size` | `wrap` |
| H3 | shadow element | `sk-action-row { container-type: normal }` | `block` | **`normal`** | **`nowrap`** — the `@container` stops firing |
| H4 | ADR-15's wrapper | `.sk-action-row-host { container-type: normal }`, equal specificity, authored **first** | `block` | **`inline-size`** | **`wrap`** |

The same consumer intent, at the same weight, wins against the element and loses against the
wrapper. H3/H4 is the sharper pair, because it is about the container itself: a consumer can
switch the element's container off from the document and cannot switch the wrapper's off without
outbidding a class.

**This does not overturn ADR-15's kind-1/kind-2 verdict and this record does not amend it.** The
two-element wrapper is still right and the collapsed form is still wrong; every reason ADR-15 gives
for that stands, and none of it is about the cascade. What is being named is a **gap in its
evidence**: the wrapper reproduces `:host`'s layout and **hardens** its cascade position, and the
outcome tables #309 and #310 inherit cannot see that. #310 is "gate the generated static form
**equal** to the shadow form"; on those 42 outcomes the wrapper is equal and this divergence is
invisible. Filed as **#375**, against #309/#310, not against ADR-15.

### Where the ruling is enforced today — nowhere, measured red-first

`scripts/check-adopted-css-boundaries.mjs` is the gate that owns "no selector in an adopted
stylesheet may reach outside the element's own root". It cannot see `::part()`. Three probes, each
appended to `packages/styles/src/pill-tag/sk-pill-tag.css` and reverted, with the gate run between
each:

| Rule appended to `sk-pill-tag.css` | Gate |
|---|---|
| `.sk-pill-tag sk-metric::part(metric) { color: red }` — reaches into **another element's** shadow tree | ✅ **passes** |
| `.sk-pill-tag sk-metric::part(metric) .x { color: red }` — **inert**: nothing may follow a pseudo-element | ✅ **passes** |
| `sk-metric::part(metric) { color: red }` — bare type selector leftmost | ❌ **caught** (control: the gate is alive) |

`violationsFor()` runs three checks: `forbiddenNode()` has no `::part` arm; `slottedIsNotLast()`
inspects `::slotted` only; and the general rule reads **only the leftmost compound**, so an owned
leading class launders everything to its right. The second probe is the identical never-matches
defect class the gate already guards for `::slotted()`. Filed as **#373**; not fixed here.

## Decision Outcome

**Cross-sheet `::part()` styling is SHADOW-ONLY. There is no generated static form, no equality
gate is possible, and a static consumer authors an ordinary selector against the class the part
node already carries — knowing that what they lose is not reach but the unconditional win.**

### 1. No equality gate can exist — the same test ADR-15 applied to `::slotted()`, with the same answer

ADR-15 ruled `::slotted()` shadow-only *because* no gate could hold the two forms equal. Applied
here honestly, in three steps, because the first step alone would give the wrong answer:

**A two-party gate would be green today, and that is not enough.** S1–S7: the naive rewrite
reproduces all six shipped declarations in both engines and survives an order swap. A gate
comparing the shadow composition against the static composition of `sk-metric` + `sk-pill-tag`
would pass. **But it would be certifying a coincidence.** S9 and S10 flip the static form while the
shadow form does not move, and neither is caused by a change to the reaching sheet: one is a rule
added to the *target* component's own stylesheet, the other is nothing but document order. A gate
can re-measure those inputs; it cannot make them irrelevant, and the shadow form does not consult
them at all. What such a gate actually enforces is "no component may grow a selector more specific
than some other component's rewrite of it, and no consumer may reorder their sheets" — a
constraint on two parties who never agreed to it, going red for changes that are correct in the
element path. That is a tripwire on an unrelated component's internals wearing an equality gate's
clothes.

**A three-party gate is not merely hard, it is measuring the wrong thing.** The shadow form's
distinguishing property is not a value; it is **who may participate**. P1, P2 and P4: a page rule
has *no influence whatsoever* over the shipped surface — not at higher specificity, not later in
the document, not with `!important`, because the selector does not match. P3 and P5: in the static
form the same three intents all land. No comparison of computed values on a library-only page can
detect a difference in *reachability*, and there is no document-context selector that means
"unreachable from the page". `:where()` lowers weight; `!important` raises it and inverts M7's
relationship; neither confers tree membership.

**So the blocking mechanism, named in ADR-15's terms:** a cross-sheet `::part()` declaration wins
by **tree order**, which is consulted before specificity and before source order and cannot be
overridden by either (M2, M4, M7). A static rewrite has no tree, so it has no tree-order position,
so it competes on specificity and order like any other document rule (M3, M5, M8, M10). **No
document-context selector reproduces "beat this component's own rules at any weight in any order,
and remain invisible to the page."** That is the identical sentence ADR-15 wrote for `::slotted()`,
and it is identical because it is the same cascade rule with the roles exchanged.

### 2. The static path gets no generated form — and, unlike `::slotted()`, does not need one

`::part()` exists to make one node inside a shadow tree reachable from outside it. **In a static
form there is no shadow tree, so that node is already reachable** — by the class it already
carries. `sk-pill-tag` renders `part="tag"` on the same span that carries `class="sk-pill-tag …"`,
and its generated static markup is `<span class="sk-pill-tag">Label</span>` with **no `part`
attribute**, because a `part` attribute is inert outside a shadow root.

This is a real asymmetry with kind 3 and it is why "no generated form" costs less here.
`::slotted(img)` names a *relationship* a static consumer has to reconstruct — ADR-15 records that
the naive `.sk-entity-marker > img` is structurally wrong because the `<slot>` sits one level
deeper. `X::part(p)` names a *node* that in the static form is already a plain element with a
plain class. The mechanical rewrite is not merely available, it is trivial; what it does not carry
over is the cascade position.

**Generating one would also widen the public surface, which is an argument against and not merely
a consequence.** P1/P2/P6: `sk-metric`'s reach into `sk-pill-tag` is invisible to the document
because nothing forwards the part, and one `exportparts` attribute would make it visible. A
generated static form turns that library-internal composition into a class any page rule can
restyle (P5). ADR-9 §2 makes parts a versioned public API precisely so that widening is a
deliberate act. Emitting a static equivalent would widen it silently, per rule, as a build step.

### 3. What a static consumer authors instead, and what the instruction must say

The replacement for `X::part(p)` is an ordinary selector naming the class the part node carries in
the generated static markup. For the one shipped rule that is
`.sk-metric__annotation .sk-pill-tag { … }`, at (0,2,0).

**"Just use the class" is silently wrong about the cascade, so the instruction owes four things,
and this is ADR-15's #304 shape applied to a `::part()` rewrite:**

1. **The class**, read from the component's generated static markup rather than guessed — the
   part node and the static root are the same node for `sk-pill-tag`, and that is a property of
   this component, not a rule.
2. **That the rewrite's win is conditional where the shadow form's is unconditional.** S9/S10:
   the shadow form computes `white-space: normal` whatever `sk-pill-tag.css` does; the rewrite
   flips if that sheet grows a rule at (0,3,0), and equally if the (0,2,0) rule it ties with is
   merely ordered later.
3. **The specificity boundary, computed from the rule actually shipped and stated generically
   rather than transcribed.** A consumer overriding the rewrite needs specificity **strictly
   higher** than it; at a tie the winner is whichever sheet is last, and a tie is the ordinary
   case, not an exotic one. ADR-15 states this for `::slotted()` and it applies here unchanged —
   with the roles swapped, so it now also binds the *third* party: a page author overriding a
   `::part()` rewrite needs the same number.
4. **That the static path's surface is WIDER, not narrower.** P4 vs P5. A consumer used to the
   element path's encapsulation should be told the node is now reachable by any page rule.

**Every cross-sheet `::part()` rule owes that instruction.** Today that is one rule and one sheet.
Filed as **#374**, which also owns deciding whether `sk-metric.css:67` adopts the #78 paired
spelling (`.sk-metric__annotation .sk-pill-tag, .sk-metric__annotation sk-pill-tag::part(tag)`) —
ADR-15 measured that a paired list is not invalidated by a `::slotted()` branch, and #374 must
re-measure it for a `::part()` branch rather than assume the result transfers. This record changes
no sheet.

### 4. Storybook's 18 `::part()` rules are not affected, and the reason is worth stating

They are page-side rules in stories that render the **element** path, where `::part()` is correct
and is the sanctioned channel. This ruling constrains what a **static** consumer is promised; it
does not deprecate `::part()` in the element path, and ADR-9 §2's public-parts contract stands
untouched. What it does mean is that a pattern relying on `::part()` for its layout does not have
a static equivalent to promise, and a mission freezing a static contract for such a pattern must
say so rather than assume parity.

### Summary

| Construct kind | Verdict | Evidence |
|---|---|---|
| Host-attribute variant axis inside a host-owned `@container` (ADR-15 kind 1) | generated static form, two-element wrapper only — **unchanged by this record**; its evidence gap is #375 | ADR-15 |
| Host-owned `container-type` (ADR-15 kind 2) | generated static form, two-element wrapper only — **unchanged by this record**; its evidence gap is #375 | ADR-15 |
| `::slotted()` child rule (ADR-15 kind 3) | **shadow-only** — unchanged | ADR-15 |
| **Cross-sheet `::part()` (kind 4)** | **shadow-only. No generated static form; no equality gate is possible; a written per-rule instruction instead** | `measurement/result.json`, 31 outcomes, chromium and firefox identical |

A `::part()` rule and its target in the **same** sheet is outside this row: that is an ordinary
same-tree comparison (M11) and no cross-tree question arises.

## Relationship to ADR-15's three construct kinds

ADR-15 asks what static equivalent an element's **own** private CSS should have. This record asks
what static equivalent a rule reaching into **another component's** shadow tree should have. Three
relationships, stated so none is inferred:

* **Kind 3 and kind 4 share one mechanism.** Not an analogy — the same cascade rule, with the
  library's declaration on opposite sides. That is why the two verdicts match, and it is the one
  place this record's measurement corrects something ADR-15 implies: the "outer always beats"
  property belongs to tree order, not to `::slotted()`. Nothing in ADR-15's kind-3 verdict changes;
  its generalisation does.
* **Kinds 1 and 2 involve no cross-tree cascade at all** — `:host` declarations moved within the
  same document, `@container` unchanged — which is why a generated form is possible for them and
  not here. Group H shows that this is not the same as being cascade-neutral, and #375 owns it.
* **This record amends neither ADR-9 nor ADR-10.** ADR-9 §3's "no selector may cross the shadow
  boundary" is about a sheet reaching *outward* to an ancestor and is untouched; ADR-9 §2's public
  parts contract is untouched and reinforced; ADR-10 §3's generated-artifact model is the model
  this record declines to extend to a fourth kind, for a stated reason.

## Consequences

### Positive

* The seven children of #300 that avoided `::part()` in a static contract now have a rule, and it
  is the rule they behaved as if were true.
* The static rewrite for `::part()` is trivial where `::slotted()`'s was structurally error-prone,
  so "shadow-only" costs a consumer a documented caveat rather than a reconstruction.
* The public parts surface does not silently widen. 141 parts across 29 elements stay a
  versioned, forwarded-by-choice API rather than becoming 141 class names any page can restyle.
* The one shipped rule is explained rather than merely flagged: it is equal today, and the record
  says exactly which two facts that equality depends on.

### Negative

* **A static composition of `sk-metric` and `sk-pill-tag` is not equivalent to the element path,
  and this record does not make it so.** Six declarations governing wrapping and overflow have no
  shipped static spelling. #374 owns the instruction. Until it lands, a static consumer who copies
  the flattened markup gets a pill that does not wrap inside a metric annotation.
* **A written instruction is weaker enforcement than a gate, and there is no gate at all today.**
  Measured red-first above: `check-adopted-css-boundaries.mjs` accepts a new cross-sheet `::part()`
  rule silently, and accepts an inert one. #373 owns it. Until it lands this ruling is a
  specification, not an enforced artifact.
* **The instruction debt grows with the surface.** One rule today, but 18 `::part()` rules already
  live in stories and 141 parts are declared. A ruling that discharges itself through per-rule
  prose scales linearly with something that is designed to grow.
* **`sk-metric` has no static form at all**, so the composition this record reasons about is
  partly hypothetical. That is stated in the S table rather than papered over, and #374 carries
  the question of whether `sk-metric` owes a static form.
* **The `exportparts` door stays open and ungoverned.** P6: one attribute on one nested element
  turns a library-internal composition into a document-reachable part. Nothing in this repo
  currently uses `exportparts`, nothing gates it, and this record does not rule on it.

### Neutral

* WebKit is unverified, as ADR-10 already records for this class of claim.
* The measurement is mission-scoped evidence, not a permanent suite. Making any of it permanent is
  #373's work.
* Group H's finding is filed, not acted on. ADR-15's kind-1/kind-2 verdict stands as written.

## Confirmation

* `node kitty-specs/cross-sheet-part-static-form-adr16/measurement/run.mjs` reproduces every value
  in this record against the same train ref. The pre-declared bar is the **union** of
  `outcomes.declared.json` (27) and `outcomes.declared.cycle-2.json` (4), each committed before the
  run it governs and neither rewritten afterwards; `result.json`'s `declared_outcome_sources` and
  `declared_outcome_count` are authoritative. The runner refuses a result whose outcome set differs
  from that union, and refuses an empty set.
* The gate probe is three appends to `packages/styles/src/pill-tag/sk-pill-tag.css` with
  `node scripts/check-adopted-css-boundaries.mjs` between each, reverted after; the table is above
  and the third row is its control.
* Permanent enforcement is deliberately **not** in this record, which changes no sheet, no test and
  no story. It is filed as its own work:

  * **#373 — [ci] gate cross-sheet `::part()`.** Teach the boundary gate to see a `::part()`
    compound that is not the sheet's own component, and to refuse an inert selector after a
    pseudo-element; hold every declared cross-sheet rule to §3's instruction obligation or a
    recorded exemption; an **empty-set floor** with its own message; a red-first `--selftest`
    table whose probes each name the problem they expect; wired into `check-gate-wiring.mjs`.
  * **#374 — [styles] backfill the cross-sheet `::part()` static-consumer instruction** into
    `sk-metric.css`, covering all four points of §3, in the shape `sk-entity-marker.css` and
    `sk-action-row.css` already use. It also owns the paired-spelling decision and the question
    of whether `sk-metric` owes a static form.
  * **#375 — [build] ADR-15's static wrapper does not reproduce `:host`'s cascade position.**
    Group H, filed against #309/#310, whose inherited probe tables never introduce a consumer's
    own rule. It asks for a cycle-3 declaration file that adds consumer-override outcomes and
    rewrites none, and for the `:where(.sk-<name>-host)` candidate to be measured rather than
    argued.

  None of #373, #374 or #375 is built here.

**What this record does and does not discharge of issue #314's acceptance list.** It discharges
item 1 (a recorded ruling backed by a probe table, not by assertion) and item 5 (`node
scripts/check-part-ratchet.mjs` prints 141 declared parts, unchanged — this record adds and removes
no part). Items 2 and 3 — applying the ruling to `sk-metric.css`, and the check it implies — are
code changes this record is scoped out of and are **#374** and **#373**. Item 4 — qualifying #302's
freeze — is **already discharged at this head**, not deferred:
`packages/styles/src/pill-tag/sk-pill-tag.stories.ts:107-108` records "No claim is made here about
composing into `sk-metric`'s `::part(tag)` annotation — that `::part()` gap is #314's, not this
mission's."

## More Information

* Issue #314 (this ruling's brief), ADR-15's Summary row deferring it, and epic #300.
* ADR-15 — the record this one extends; its kind-3 reasoning is generalised here, its kind-1 and
  kind-2 verdicts are untouched and its evidence gap is #375.
* ADR-9 §2 (parts are versioned public API) and §3 (no selector crosses the shadow boundary
  outward) — both untouched.
* ADR-10 §2 (the self-contained elements bundle the shadow side loads) and §3 (generated static
  markup) — the model this record declines to extend to kind 4.
* `packages/styles/src/boundary-page/sk-boundary-page.css` — the sheet that names this question as
  #314's and leaves it open.
* `kitty-specs/cross-sheet-part-static-form-adr16/measurement/` — the full outcome table, the
  generated probe pages, and the two declaration files.
