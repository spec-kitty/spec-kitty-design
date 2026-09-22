# Research: boundary-page-styles

**Mission**: `boundary-page-styles-01M25TBY`
**Issue**: spec-kitty/spec-kitty-design#303 ([TKT3], Gap G2 of the Family 4 component-gap audit, epic #300)
**Date**: 2026-09-10

## Decision 1: No custom element, no shadow root — ADR-15's four construct kinds do not reach this frame

**Decision**: `sk-boundary-page` ships as a styles-only class family in `packages/styles/src/`
only, with no corresponding entry under `packages/elements/src/`. It has no `:host`, no
`container-type`, no `::slotted()`, and issues no `::part()` reach into `sk-entity-marker` or
`sk-pill-tag`'s shadow internals. All four of ADR-15's ruled-on construct kinds — host-attribute
axis inside a host-owned `@container`, host-owned `container-type`, `::slotted()` child rules, and
cross-sheet `::part()` (the fourth surface, #314's territory) — are properties of an element's
**own shadow-DOM CSS being translated to a static form**. This frame has no shadow form to
translate: it is authored directly as document CSS, exactly like `sk-progress`, `sk-empty-state`
and the other entries in `packages/styles/src/` that carry no sibling under `packages/elements/src/`
(`git ls-files packages/elements/src/*/ | ...` vs `packages/styles/src/*/` shows `breadcrumbs`,
`checkbox-choice-group`, `collection`, `context-nav`, `data-table`, `disclosure`, `empty-state`,
`event-timeline`, `facts`, `form-field`, `form-select`, `progress`, `prose`, `segmented-choice`,
`skip-link`, `workflow-board`, `workflow-lane` are all styles-only with no element — the shape
this mission's family joins).

**Rationale**: ADR-15's own scope statement is explicit that its ruling is per construct kind
found in a shipped shadow-DOM sheet, and its "Which sheets this ruling reaches" section
enumerates exactly four sheets (`sk-app-shell`, `sk-action-row`, `sk-copy-field`,
`sk-page-header`) as carrying `container-type` at all — `sk-boundary-page` is not and will not
become a fifth, because it is never adopted by a custom element's `static styles`. The mission
brief's own framing ("Check rather than assume — if your frame introduces `:host`,
`container-type`, `::slotted()` or a cross-sheet `::part()`, the ruling reaches you") is answered
here by design choice, not by measurement: the frame is built to introduce none of the four.

Two composed sub-decisions follow from this:

- **Responsive behaviour uses `@media` (viewport-relative), not a component-owned
  `@container`.** Nothing about this frame prohibits an *ordinary* document-owned `@container` —
  ADR-15's "an element is never its own query container" mechanism is specific to a shadow host
  querying its own descendants, which cannot arise here since there is no host at all — but
  introducing one is an unforced complexity this mission does not need: the frame's only
  responsive concerns (stage padding, card max-inline-size, action-group wrap) are properties of
  the *viewport*, the same signal Family 4's four screens already keyed off. `plan.md` may revisit
  this only if a genuine per-card-width (not per-viewport) need surfaces; it has not in the
  issue's evidence.
- **Composition with `sk-entity-marker` and `sk-pill-tag` stays at the box level.** The frame
  places `<sk-entity-marker>`/`<sk-pill-tag>` (or their static-path class forms) as opaque
  children — sized, spaced and positioned from the outside — and never writes a `::part()` rule
  reaching into either component's shadow internals. `sk-metric.css:67`
  (`.sk-metric__annotation sk-pill-tag::part(tag)`) is the one precedent for that kind of reach in
  this repo, and ADR-15 names it explicitly as **#314's undecided territory, not this record's**.
  This mission does not decide it either — it simply does not need it, because nothing in #303's
  acceptance requires overriding either composed component's internal padding/overflow/wrapping.

**Alternatives considered**:
- *Treat the frame as "styles-only, therefore automatically exempt" without checking* — rejected
  per the mission brief's explicit instruction to check rather than assume; this decision records
  the check (the four-kind enumeration above) rather than skipping it.
- *Add a component-owned `@container` on `.sk-boundary-page__card` for internal reflow* —
  rejected for now as unforced scope: the issue's required stories test narrow viewport width and
  200% zoom, not a card embedded at varying widths inside another layout; `@media` already covers
  every named scenario.

## Decision 1b: Which ADR-10 styles-only-class reason applies, so the omission is a recorded decision rather than an unexplained gap

**Decision**: `sk-boundary-page` is styles-only under ADR-10's class-level ruling
("Styles-only components are a class, not a fixed exception count",
`docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md`), for a reason
adjacent to but distinct from that section's four named reasons (`sk-facts`/`sk-disclosure`/
`sk-data-table`/`sk-empty-state`/`sk-skip-link`'s "styles a native element with no room for a
wrapper") and from `sk-form-field`'s reason ("its element path renders the whole thing itself").
The applicable reason here: **wrapping the frame's own `<main>`/`<h1>` in a shadow root would
manufacture a landmark or sever a heading the consuming document already owns**, which is the
same "document-scoped structure a shadow boundary would break" family as `sk-skip-link`'s
document-scoped `href="#main"` and `sk-facts`'s cross-root ID resolution — generalised from one
native element's semantics to the consumer's own document outline. The issue states this
directly: "the stage does not manufacture a landmark the page already has, and the family works
inside a consumer-authored `<main>` with a single `<h1>`." A custom element wrapping that
structure cannot keep this promise: the `<h1>` and any landmark role would either move inside a
shadow root (breaking the "consumer keeps it" guarantee) or the element would have to slot it
through — at which point the element adds no behaviour a plain class family does not already
provide, which is the converse test ADR-10's ruling names ("none of the four reasons above is
satisfied by a component that owns interaction the native element does not already give it for
free" — read generally, no reason here is satisfied by a component that owns *document structure*
the consumer does not already give it for free either).

**Recorded where**: this research decision, plus a one-line note in
`packages/styles/src/boundary-page/sk-boundary-page.css`'s header comment citing ADR-10's
styles-only-class section by name — the same convention `scripts/build-styles-only-markup.mjs`'s
generated barrel comment already points at for every other styles-only component ("`progress` is
deliberately styles-only... See ADR-10's 'Styles-only components are a class, not a fixed
exception count' section").

**Alternatives considered**:
- *Treat `sk-boundary-page` as simply "not needing" an element without recording why* — rejected:
  ADR-10's rule is that every styles-only component in `packages/styles/src/` carries a recorded,
  deliberate reason; leaving this implicit would be the exact gap #176 closed for the other five
  components.
- *File a fresh ADR-10 amendment specifically for this component* — rejected as unnecessary:
  ADR-10 already generalised to a class-level ruling for exactly this situation; a new component
  citing the existing class and stating its own reason is the pattern #176 established, not a
  reason to reopen the ADR itself.

## Decision 2: What is composed from #302 and #304 — quoted from the shipped CSS, not the issue text

**Decision**: The mark slot composes `<sk-entity-marker>` unmodified — consumer picks
`size`/`shape`/`border` from #304's shipped axis, the frame supplies no default and infers no
size. The status slot (when the consumer supplies one) composes the STYLES-LAYER form of #302 —
`<span class="sk-pill-tag sk-pill-tag--status-<tone>">`, exactly what
`packages/styles/src/pill-tag/sk-pill-tag.html` ships — unmodified; consumer picks the tone, the
frame infers none and contributes no role/name/meaning from it.

**Correction (WP01 review finding, not the original research pass)**: an earlier revision of this
decision named `<sk-pill-tag class="sk-pill-tag--status-<tone>">` — the CUSTOM ELEMENT with a
class on its host. That form is inert: `sk-pill-tag`'s tone is a `status` PROPERTY, and
`pillTagClasses()` (`packages/elements/src/pill-tag/sk-pill-tag.markup.ts`) applies the resulting
modifier class to the SHADOW `<span part="tag">`, not the host — so a class authored on the
light-DOM `<sk-pill-tag>` element never reaches the node that actually carries the tone rule.
Probed directly against the built Storybook: the element upgrades, `statusAttr` is `null`, and
zero loaded document rules match `sk-pill-tag--status*` on the host. The styles-layer span form
above is the one that actually renders a tone, and it is also the right choice independent of the
bug: this is a styles-only frame, so its native idiom is styles-layer markup, and it needs no
`sk-pill-tag` custom-element registration in `.storybook/preview.ts` at all (see that file's own
comment).

**Rationale — quoted from the shipped source, per the mission brief's instruction to read what
actually shipped rather than the issue text**:

From `packages/styles/src/entity-marker/sk-entity-marker.css`, the axes now available to compose:
```
.sk-entity-marker--sm { inline-size: var(--sk-space-5); block-size: var(--sk-space-5); }
.sk-entity-marker--lg { inline-size: var(--sk-space-9); block-size: var(--sk-space-9); }
.sk-entity-marker--circle { border-radius: var(--sk-radius-pill); }
.sk-entity-marker--bordered {
  border-style: solid;
  border-width: var(--sk-border-width-1);
  border-color: var(--sk-border-default);
  padding: calc(var(--sk-space-1) - var(--sk-border-width-1));
}
```
and the header comment's own binding note: *"`border` is a validated string enum
(`border="true"`), not a native boolean, because FR-011 requires an invalid value to warn and
fall back... a bare `<sk-entity-marker border>` silently no-ops for plain-HTML authors."* Any
exemplar HTML this mission commits that demonstrates a bordered mark **must** write
`border="true"` explicitly — never the bare attribute — per the mission brief's own instruction.

From `packages/styles/src/pill-tag/sk-pill-tag.css`, the six-tone axis and its precedence rule:
```
.sk-pill-tag--status-neutral { background: var(--sk-status-neutral); color: var(--sk-on-status-neutral); }
.sk-pill-tag--status-info { background: var(--sk-status-info); color: var(--sk-on-status-info); }
.sk-pill-tag--status-success { background: var(--sk-status-success); color: var(--sk-on-status-success); }
.sk-pill-tag--status-attention { background: var(--sk-status-attention); color: var(--sk-on-status-attention); }
.sk-pill-tag--status-danger { background: var(--sk-status-danger); color: var(--sk-on-status-danger); }
.sk-pill-tag--status-recovery { background: var(--sk-status-recovery); color: var(--sk-on-status-recovery); }
```
and its own binding comment: *"TONE IS NEVER THE ONLY CARRIER OF MEANING (FR-010) — these two
declarations are decoration only. No role, no accessible-name contribution, and no inference of
meaning from the slotted label."*

**This mission's frame does not enumerate, restate, or derive from `STATUS_TONES`.** It composes
whichever `sk-pill-tag--status-<tone>` class the consumer already chose, exactly as it composes
whichever `sk-entity-marker` axis values the consumer already chose. The frame contributes no
default tone, no default size, no default shape, and no naming/role logic of its own for either
composed component — confirmed against the shipped header comments above, not assumed from
#302/#304's issue text (both of which predate ADR-15's ruling on their own static-form
questions, per the mission brief).

**Alternatives considered**:
- *Have the frame supply a default tone when the consumer omits `status`* — rejected: the issue
  states "the frame infers no tone" as a binding constraint, and the shipped `sk-pill-tag.css`
  comment confirms tone carries no semantic weight the frame could safely infer from context.
- *Have the frame pick a default `sk-entity-marker` size for the mark slot* — rejected: nothing in
  #303's evidence names a required default, and inferring one would freeze a choice #304's own
  spec deliberately left to the consumer per-screen.

## Decision 3: One anatomy, no card-shape modifier — form-card and terminal-card differ by content, not by class

**Decision**: `sk-boundary-page` ships exactly one BEM anatomy —
`.sk-boundary-page__stage` / `__card` / `__mark` / `__title` / `__body` / `__action-group` /
`__footnote` — with **no** `.sk-boundary-page__card--form` / `--terminal` (or similarly named)
modifier. The card holding a real `<form>` and the card holding only a terminal message are the
identical class structure; what differs between them is entirely the consumer-authored content
placed in `__body`/`__action-group` (a `<form>` element vs. plain text; submit/cancel controls vs.
a single "back to sign-in" link), never a CSS modifier the frame defines.

**Rationale**: The issue states this as the outcome directly — *"The card holding a real `<form>`
and the card holding only a terminal message use the **same** anatomy... no speculative
modifiers."* Family 4's own four screens' local vocabularies (`join-card` with `--capture` /
`--terminal` suffixes being the one existing precedent for a form/terminal split) are exactly the
"unrelated local vocabulary" fragmentation this mission exists to retire, not a pattern to import
unchanged — importing `join-card`'s two-state split as this frame's own modifier would reproduce
the fragmentation this mission is chartered to remove, without first establishing that a real CSS
difference (not just a content difference) exists between the two states. No CSS difference is
named in the issue's evidence section; the required stories ("card with a form; card with only a
message") ask only that both compose against the one anatomy, not that a modifier distinguish
them.

**This is treated as a decision with a verification obligation, not a closed question.** `tasks/`
must include a task that renders both required stories against the single anatomy and confirms —
by inspecting real layout (padding, gap, max-inline-size), not by assumption — that no property
needs to differ between the two. If implementation surfaces a genuine, non-speculative layout
need (for example: a terminal-only card needing tighter vertical rhythm because it never carries
a multi-field form), the PR names the modifier and the two screens requiring it, per the issue's
own conditional clause, rather than this research record pre-deciding it either way.

**Alternatives considered**:
- *Add `--terminal`/`--form` modifiers preemptively, mirroring `join-card`* — rejected as
  speculative per the issue's explicit constraint; also reproduces exactly the per-screen fork
  the epic's Opus rereview flagged as a defect (T9b's footnote/skip-target divergence from its
  siblings, caused by the four local vocabularies never converging).
- *Infer the split from whether `__action-group` contains a `<form>` via `:has()`* — rejected: an
  implicit structural fork is harder to review and test than an explicit modifier would be, and
  nothing in the acceptance criteria asks for content-conditional styling.

## Decision 4: The footnote's absent state is a supported, explicitly asserted state — omission, not a collapsed empty box

**Decision**: A consumer who has no footnote content **omits the `.sk-boundary-page__footnote`
element from their markup entirely.** The frame does not render a placeholder, does not reserve
vertical space for it, and does not gate its own layout on an attribute or `:empty` check. The
card's own `gap`-based rhythm (flex/grid `gap` between direct children) is what makes an absent
footnote consume zero space, and this mission requires that fact to be **measured**, not assumed
— per the #308 defect pattern (`display: flex` with no `[open]` qualifier: everything tested
against the *present* state and nothing asserted the absent one).

**Rationale**: The issue is explicit — *"The footnote is optional and its absence is a supported,
tested state — not a collapsed empty box."* "Not a collapsed empty box" rules out the pattern
where a consumer always renders `<div class="sk-boundary-page__footnote"></div>` and relies on it
visually collapsing to zero height — that pattern is fragile exactly the way #308's was: a future
edit that gives the footnote class any padding, min-block-size, or border reintroduces a phantom
gap silently, because nothing before this mission asserted the absent case at all. Omission from
the DOM entirely is the form that cannot silently regress that way, provided the *test* also
targets the DOM-absent case rather than an empty-but-present one.

**The absence assertion, concretely** (owed to `tasks/`, not fully specified here): a Playwright
test comparing two stories — "with footnote" and "without footnote", the latter rendering **no**
`.sk-boundary-page__footnote` node at all — and asserting (a) `querySelector('.sk-boundary-page__footnote')`
is `null` in the without-footnote story; (b) the vertical distance from the action-group's own
bottom edge to the card's bottom edge equals the card's own `padding-block-end` token value,
computed in-run from `getComputedStyle`, never transcribed as a literal pixel figure (defect
pattern #4); and (c) that same measurement in the with-footnote story is strictly larger by at
least the footnote's own content height plus the inter-element gap token — so the test fails if a
future edit reserves footnote space unconditionally, the exact shape of defect #308 shipped.

**Alternatives considered**:
- *Always render the footnote wrapper, toggle visibility with `[hidden]`* — rejected: reintroduces
  the "everything tests the present state" risk if `[hidden]` is ever dropped or overridden, and
  the issue's "not a collapsed empty box" language reads as ruling this pattern out specifically.
- *Use `:has()` on the card to conditionally apply spacing* — rejected as unneeded complexity;
  ordinary flex/grid `gap` between children already produces zero extra space for an absent
  child with no additional selector, and adding one would be machinery with nothing to guard.

## Decision 5: No component-scoped `render()` no-literal test — the frame has no `render()` at all

**Decision**: This mission does not add a red-first "no user-visible literal" test of the kind
#308 registered in `behaviours.json`, and records the reasoning rather than the absence going
unexplained.

**Rationale**: The precedent split named in the mission brief is real and this frame falls on the
"structurally cannot carry a literal" side of it, for a reason even more direct than #302's,
#305's, #306's or #307's own reasoning: those are custom elements whose `render()` method was
checked and found to contain no literal; **`sk-boundary-page` has no `render()` method, no
template, and no custom element at all.** Every text node the frame ever paints — title, body,
action labels, footnote — is consumer-authored HTML the frame applies classes to, never markup
the frame generates. There is no code path in this mission's deliverable that could emit an
English string, because there is no code path that emits markup of any kind. #286 remains open
and cross-cutting; this mission does not build a repo-wide gate for it (that is #286's
deliverable, per the mission brief), and does not need a component-scoped one either, because the
component-scoped risk the #308 precedent guards against does not exist here.

**Alternatives considered**:
- *Add the test anyway, "to be safe"* — rejected: a red-first test needs a real failure mode to
  guard against; asserting "no literal appears in the generated HTML" for markup that is 100%
  consumer-authored is a test with no way to ever meaningfully fail, which is closer to the "gate
  green over an empty set" defect pattern (#305/FR-015) than to a real guard.

## Decision 6: Team Kitty SaaS #1281's non-enumerating copy stays expressible because the frame validates nothing about copy content

**Decision**: `__title`, `__body`, and `__footnote` accept **any** consumer-supplied string or
markup, with no enum, no schema, no required-field validation, and no minimum/maximum content
shape enforced by the frame. A Team Kitty screen author writing SaaS #1281's non-enumerating
boundary copy (a deliberately vague "you may not have access, or this may no longer exist" style
message that does not enumerate the specific reason) is functionally identical, from this
frame's perspective, to a screen author writing a precise, fully-enumerated reason — the frame
draws no distinction, imposes no copy contract, and offers no closed vocabulary of allowed
messages.

**Rationale**: The epic's shared constraint #1 already binds every Family 4 child: "every
component-visible string stays consumer supplied and translatable; no user-visible literal in an
element's `render()`." This mission's contribution is narrower and mechanical — confirm that
nothing added by this mission (CSS selectors, required story markup, ratchet entries) implicitly
requires copy to take a particular shape (e.g., no CSS selector keyed to specific text content,
no story that hardcodes a "the real reason" example that could be mistaken for a required
pattern). SaaS issue 1281 is explicitly out of this repository (Team Kitty's own repo); this
mission's obligation, per the epic's shared constraint #5, is only that #303 does not make
1281's non-enumerating phrasing *inexpressible* — which an enum or schema would, and this frame
never introduces one.

**Alternatives considered**:
- *Provide a `reason`/`variant` attribute-like class enumerating known boundary-message types
  (e.g. `--not-found`, `--no-access`, `--disabled`)* — rejected: this would be exactly the kind of
  closed vocabulary that makes a deliberately non-enumerating message awkward to express (forcing
  a "best fit" category), and nothing in #303's acceptance criteria asks for one; body/footnote
  content is copy, and copy ownership is explicitly Team Kitty's per the epic's boundary section.

## Decision 7: Visual baselines — named now, harvested from CI, never generated locally

**Decision**: This mission commits `apps/storybook/src/tests/visual.spec.ts` assertions (the
hand-curated file this repo uses — nothing iterates stories automatically, per the #305/FR-015
defect pattern named in the mission brief) targeting these snapshot names, following the
`sk-<name>-html-<variant>.png` convention already used for `sk-progress`/`sk-stub`/`sk-feature-card`:

- `sk-boundary-page-html-form-card-default-dark.png`
- `sk-boundary-page-html-form-card-light.png`
- `sk-boundary-page-html-terminal-card-default-dark.png`
- `sk-boundary-page-html-without-mark.png`
- `sk-boundary-page-html-without-footnote.png`
- `sk-boundary-page-html-with-footnote.png`
- `sk-boundary-page-html-forced-colors.png`
- `sk-boundary-page-html-narrow-320.png`

Exact final names are `plan.md`/`tasks/`'s to confirm against the stories actually authored: this
list is this mission's declared intent, not yet a committed baseline.

**Rationale**: Per the mission brief's defect pattern #2 (#305's FR-015 shipped an empty visual
gate) and the standing memory that this repo's visual baselines are CI-authoritative: the PNGs
must be harvested from the mission's own PR CI run's `visual-regression-diffs` artifact, never
produced with a local `--update-snapshots`, because font rasterization and dimensions differ
between a workstation and the `ubuntu-latest` runner (the exact defect `visual.spec.ts`'s own
header comment records for `sk-stub`/`sk-feature-card`/`sk-progress`). Naming the snapshots now,
before implementation, is what makes "the gate asserts zero new coverage" (the #305 shape)
detectable in review: a reviewer can check the named list against what actually landed.

**Alternatives considered**:
- *Defer naming snapshots until `tasks/`* — rejected: naming them in research, ahead of planning,
  creates an artifact plan.md/tasks.md must either honor or explicitly revise, rather than a gate
  that can be silently never built (the #305 failure mode).

## Open questions carried into planning

1. **Exact stage-centering mechanism** (`min-block-size: 100dvh` flex-center vs. grid `place-items:
   center`) — either satisfies the acceptance criteria; `plan.md` picks one and states why, since
   `dvh` unit support and forced-colors/zoom interaction differ slightly between the two.
2. **Whether the action-group's 44px interactive-target requirement is met by token-driven padding
   alone or needs an explicit `min-block-size`** on the frame's own action-group class — `plan.md`
   must verify against the actual `--sk-space-*`/`--sk-text-*` values rather than assume.
3. **Whether any Work Package split is even possible or desired** — the mission brief's hard
   constraint is one WP; this research finds no natural seam (stage/card layout, mark/status
   composition, and the footnote-absence contract are all interdependent on the same anatomy), so
   `tasks/` is expected to confirm a single WP rather than search for a split.
