# Research: action-row-static-form

**Mission**: `action-row-static-form-01M25JSV` · Issue #307 [TKT7] · Epic #300 · Squad tier C (pre-merge)

## Decision 1 — Freeze the two-element wrapper markup, never the single-element form

**Decision**: The static contract is
`<div class="sk-action-row-host"><div class="sk-action-row">…</div></div>`. No spec, story,
doc example or test may ship a single `.sk-action-row` element with `container-type` moved onto
its own class.

**Rationale**: ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`)
measured `sk-action-row` as its construct-kind-2 exemplar (host-owned `container-type`) across 20
pre-declared outcomes, both Chromium and Firefox. The collapsed single-element form ("Static A")
diverged on 6 of 20, including the boundary cases: at row width exactly 400px the real element and
the wrapper compute `flex-wrap: wrap` while the collapsed form computes `nowrap`; at 401px the
element/wrapper keep the three-column trigger areas while the collapsed form has already dropped
to two columns (ADR-15, outcomes O17-O20). The wrapper form ("Static B") was equal on 20/20 in
both engines. The mechanism, stated generically: *an element is never its own query container* — a
`@container` query styles a container's DESCENDANTS, so collapsing `:host` onto `.sk-action-row`
makes it answer an outer ancestor of the consumer's page (or nothing), while its own descendants
(e.g. `.sk-action-row__trigger`'s `grid-template-areas`) keep querying correctly. That is why the
defect is silent: most of the sheet still behaves.

**Evidence**: ADR-15 "2. Host-owned `container-type`" section; `sk-action-row.css` lines 1-38
(header comment, already committed by the #301/#312 mission) restates the same wrapper contract
and gives the literal CSS block.

**Alternatives considered and rejected**:
- Single-element root-class modifier (`container-type` on `.sk-action-row`) — measured wrong,
  ADR-15 §2, O1/O3/O10/O12/O17-O20.
- An abbreviated wrapper carrying only `container-type: inline-size` — happens to pass all 20 of
  `sk-action-row`'s own outcomes (its `:host` declares no `width`, so there is nothing to lose in
  a flex-item context), **but ADR-15 forbids prescribing it generically**: the same shape on
  `sk-app-shell`'s wrapper measures `width: 0px` in a 300px flex row (O15/O16) because that
  component's `:host` does declare `width: 100%`. The rule is "the wrapper carries the sheet's
  whole `:host` declaration set", not a copied property list — so this mission's markup module and
  docs state the rule generically and point at `sk-action-row.css`'s own `:host` block rather than
  hardcoding "just `container-type`".

## Decision 2 — The wrapper's CSS is a documented consumer instruction, not shipped package CSS

**Decision**: This mission does NOT add a `.sk-action-row-host { … }` rule to any file under
`packages/styles/src/`. The generated static HTML/markup module documents (and the mission's own
stories/tests locally author, as a consumer would) the literal block:

```css
.sk-action-row-host {
  display: block;
  min-width: 0;
  container-type: inline-size;
}
```

**Rationale**: `grep -rn "sk-action-row-host" packages/` (checked 2026-09-10 on this ref) returns
only the header comment in `sk-action-row.css` — no shipped stylesheet defines the class. ADR-15
is explicit that generating and gating this rule is **#309**'s (generator) and **#310**'s
(equality gate) work, not #307's: "#307 must freeze the markup and the CSS **together**… Until
#309 lands, the frozen contract is the markup **plus** this block, authored by the consumer in
their own stylesheet." Shipping the rule ourselves here would pre-empt #309's generator contract
(which must derive the wrapper from each component's own `:host`, generically) and would leave two
authored copies of the same rule to drift once #309 lands.

**Consequence for the parity test** (acceptance: "reflow works statically… parity-tested against
the shadow form"): the mission's own fixture (Storybook story / behaviour test) is itself a
"static consumer" and must author the block above locally — exactly the instruction given to every
other consumer — rather than relying on a shipped sheet. The fixture's copy of the block is
asserted byte-identical (same four declarations, order-insensitive) to the literal already present
in `sk-action-row.css`'s header comment, so the two cannot silently diverge before #309 replaces
the hand-authored copy with a generated one gated by #310.

**Evidence**: `sk-action-row.css:1-38` header comment; ADR-15 "Which gated children may freeze a
static API" → `#307` bullet; `docs/contributing/adding-a-component.md` lines 84-90.

## Decision 3 — Trailing controls are a sibling of the trigger, never a descendant, in both forms

**Decision**: The static markup places `.sk-action-row__controls` as a sibling `<div>` of the
trigger element (`<a>`, or a plain `<div>` in the static form, since there is no JS-driven
`<button>` activation without the element), both children of `.sk-action-row`. No trailing control
markup is nested inside the row's anchor/link in either form.

**Rationale**: This is already how the shadow element renders today —
`packages/elements/src/action-row/sk-action-row.ts` `render()` emits
`<div part="row">…trigger…<div part="controls" class="sk-action-row__controls">…</div></div>`,
i.e. `.sk-action-row__controls` is a sibling of `part="trigger"`, not nested inside it. Issue #272
(closed, "sk-action-row native route mode") made this load-bearing: "Independent `controls` stay
outside the primary anchor, so no button is nested in a link." #307's acceptance criterion restates
it as the mission's own load-bearing requirement, tying it explicitly to #272. The static form
must reproduce the identical DOM shape (anchor/div + sibling controls div) so the parity test and
the a11y tree agree with the shadow form.

**Evidence**: `packages/elements/src/action-row/sk-action-row.ts` lines ~180-210 (`render()`);
issue #272 (closed) body, "Public contract and behavior" list, third bullet; issue #307 body,
"Outcome and public contract" list, third (load-bearing) bullet.

## Decision 4 — The #283 boundary: identity-plus-trailing-action rows vs. aligned factual ledgers

**Decision**: `.sk-record-list` (#283, open, unmoved since 2026-09-08 at the time this research was
performed) and `.sk-action-row`'s static form do not fork into duplicate anatomies. The spec states
the seam explicitly in prose (see spec.md "Boundary with #283") rather than letting either
component's contract grow to cover the other's cases.

**Rationale, read directly from #283's live issue body** (`gh issue view 283`, checked
2026-09-10, state OPEN, updatedAt 2026-09-08T12:17:54Z, 0 comments): #283 is "a styles-only native
`.sk-record-list` family over consumer-authored `<ol>/<li>` records. Each record contains its own
labelled `<dl>/<dt>/<dd>` fields." Its own Non-goals list states explicitly: "row link/action" is
excluded. #283 owns **passive, heterogeneous, aligned repeated-field ledgers** — Team Kitty's
Op-record tables (O1/O3/O4/O5: seven aligned desktop fields, optional actor/duration metadata,
request/reason, status tags) that reflow into labelled narrow cards. There is no anchor, no
trigger, no activation semantics anywhere in #283's contract.

#307 owns **identity-plus-trailing-action rows**: a mark, a title/identity line, secondary
metadata/tags/supporting content, AND one or more trailing controls that are independently
interactive (and, per #272, may make the row body itself a real link). The distinguishing
features are (a) the row has a primary scannable identity slot rather than N parallel-weighted
`<dl>` fields, and (b) the row can carry trailing interactive controls as a first-class part of its
contract, which #283 explicitly disclaims.

**The narrow fork risk, named**: a row carrying repeated aligned fields AND a status tag AND a
trailing action could plausibly be built on either component's anatomy. #307's spec calls this out
by name and states the dividing line is *interactivity of the row*: the moment a row needs a
trailing action or a native route, it is `.sk-action-row`'s anatomy, never `.sk-record-list`'s —
and `.sk-record-list`'s own non-goals commit it to staying that way.

**Recheck performed**: `gh issue view 283 --repo spec-kitty/spec-kitty-design` was re-run at
research time (2026-09-10) rather than trusted from the epic's snapshot. State: OPEN. No comments.
No changes since the epic (#300) was filed. This mission's own read of #283, independent of the
epic's summary, confirms the same boundary the epic describes.

**Evidence**: issue #283 body (fetched live); issue #300 epic body, "Sequenced row lane" note:
"#307 … coordinates with open #283 so record-list and action-row anatomy do not fork."; issue #307
body, "Boundary with #283" section.

## Decision 5 — No component-scoped no-literal (#286) test is required for this mission

**Decision**: The spec does not add a new automated "no user-visible literal" test scoped to
`sk-action-row`'s static form. It records the reasoning inline instead (spec.md, Requirements),
following the #302/#305/#306 precedent (reasoned out) rather than #308's (new test added).

**Rationale**: #286 is open, cross-cutting, and explicitly "not to be built as a repo-wide gate" by
any one child (epic #300, Shared constraint 1; #307 mission brief). The evidence for *this*
component: every string an action row displays — title, reference, metadata, tags, supporting
content, trailing-control labels — is **only** reachable through consumer-supplied slot content
(shadow form) or consumer-supplied markup children (static form). `sk-action-row.ts`'s `render()`
contains no string literal that is not a CSS class name, an ARIA token (`"true"`, `"page"`), a part
name, or the fixed ID `sk-action-row-title` used purely as an `aria-labelledby` target — none of
which is user-visible text. The generated static markup module (`sk-action-row.markup.ts`, to be
authored by this mission) is structurally the same shape as `sk-grid.markup.ts` and
`sk-card.markup.ts`: it takes `content` as a caller-supplied parameter with a **non-empty
placeholder default** for demonstration purposes only (documented as a placeholder, never shipped
to a real consumer's page), and injects no other prose. This mirrors #302/#305/#306's reasoning:
the render path structurally cannot carry a literal, so a new automated test would be asserting a
tautology about code shape that the recipe's own generic manifest/markup gates already constrain.
Contrast with #308 (`sk-confirm-dialog`): a wholly new element with copy-bearing default slots was
a real, first-time literal-injection risk, which is why it earned a component-scoped test. This
mission extends an existing, already-slot-only element's static path; it does not introduce a new
copy surface.

**Evidence**: `packages/elements/src/action-row/sk-action-row.ts` full `render()` (read in full,
no bare user-facing string present); epic #300 "Shared constraints" item 1; mission brief's
precedent note (#308 vs #302/#305/#306).

## Decision 6 — Absent-state assertions, named explicitly (the #308 defect pattern)

**Decision**: Every present/absent axis in this component gets an explicit assertion for the
ABSENT case, not only the present one, and each such assertion is required to be one that would
actually fail if a class or attribute leaked (i.e. it inspects the rendered class list / attribute
list / accessibility tree, not merely "the story renders without throwing").

**Axes identified**:
1. **Trailing controls present vs. absent.** Present: `.sk-action-row__controls` renders with
   content and is reachable as a distinct tab-stop group. Absent: the static markup omits the
   controls element entirely (there is no JS-driven `hidden` toggle in the static form — the
   element simply is not written), and a rendered-DOM assertion confirms no `.sk-action-row__controls`
   node and no extra tab stop exists when a row has no trailing action.
2. **`aria-current` set vs. unset.** Set: `.sk-action-row[aria-current="true"]` (non-route) or the
   anchor's `aria-current="page"` (route mode) is present and the accessibility tree reports the
   current state. Unset: the attribute is absent from the DOM entirely (not `aria-current="false"`
   — the shadow element uses Lit's `nothing` sentinel to omit the attribute, and the static markup
   module must do the same, never emit an empty/false value), and the assertion checks the
   attribute is missing, not merely that a class differs.
3. **Flush vs. bordered presentation.** Flush: `.sk-action-row--flush` is present and the row's own
   surface/border/radius are visually absent (background: none, border-color: transparent,
   border-width: 0). Bordered (default/absent): the modifier class is absent and the card surface
   tokens (`--sk-surface-card`, `--sk-border-default`) are the ones actually applied — asserted by
   reading computed style, not by trusting the class list alone, since a leaked modifier class with
   a typo would leave the row visually bordered while a naive class-name-substring check might
   still pass.
4. **Mark present vs. absent**, and **metadata/tags/supporting present vs. absent** (per the
   issue's required-stories list: "with and without a mark; with and without metadata, tags and
   supporting content"). Each slot area only renders a wrapper element when content is supplied;
   absent-state assertions confirm no empty wrapper element remains in the DOM (an empty
   `<span class="sk-action-row__marker">` with no content would still occupy a grid area and shift
   layout — this is exactly the class of defect #308's `display: flex` HIC represents: something
   that LOOKS closed/absent but the CSS/DOM never actually removed).

**Rationale**: #308 shipped a HIGH — `.sk-confirm-dialog { display: flex }` with no `[open]`
qualifier meant a closed dialog never hid, missed by 602 tests, axe over 592 stories, and three
mutation runs, because every test exercised the PRESENT state and none asserted the ABSENT one.
#302 then added an explicit no-status assertion for the identical reason. `sk-action-row` has at
least four such axes (enumerated above); all four get an explicit, structurally-verifiable
"nothing leaked" assertion, in both the shadow form (already testable via the existing element)
and the static form (new, this mission).

**Evidence**: mission brief's "defect pattern" section; `sk-action-row.ts` `#syncSlot()` (shows the
shadow form's own absent-state mechanism, `hidden` toggling, which the static form must reproduce
structurally via omission rather than a `hidden` attribute, since there is no script to toggle it).

## Open questions carried into plan.md

1. Exact generator plumbing (`ACTION_ROW_VARIANTS` vs `ACTION_ROW_AXES` shape) for
   `sk-action-row.markup.ts`, given the component has two independent boolean axes (`layout=card`,
   `presentation=flush`) plus a route/button/static trigger-kind axis, none of which is a classic
   mutually-exclusive "variant" enum like `sk-card`'s `blue`/`purple`. Resolved in plan.md.
2. Whether `sk-action-row.markup.ts`'s `actionRowStaticHtml()` needs an explicit `mode:
   'link' | 'static'` option (mirroring `sk-button`'s `href`-driven anchor/button branch) to
   produce the route-mode `<a>` trigger vs. the plain `<div>` trigger the static form gets when
   there is no JS to drive button activation. Resolved in plan.md: the static form never emits a
   `<button>` trigger (no `sk-action-row-activate` listener exists without the custom element), so
   its only two trigger shapes are the route anchor and the static div.
