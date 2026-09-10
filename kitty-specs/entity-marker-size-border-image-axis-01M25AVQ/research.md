# Research: entity-marker-size-border-image-axis

**Mission**: `entity-marker-size-border-image-axis-01M25AVQ`
**Issue**: spec-kitty/spec-kitty-design#304 ([TKT4], Gap G3 of the Family 4 component-gap audit, epic #300)
**Date**: 2026-09-10

## Decision 1: Split the mission's three axes along ADR-15's construct-kind boundary, not along the issue's own size/shape/border/image grouping

**Decision**: Size and border are ordinary root-class modifiers, frozen now as an equality-gated
static API. The image axis is frozen only as a documented authoring instruction (the paired
spelling), never as an equality-gated static API.

**Rationale**: ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`),
ratified against measurement in `kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/slotted-child-rule/`,
rules on #304 directly:

> "**Split.** The size and border axes are ordinary root-class modifiers
> (`.sk-entity-marker--sm`, `.sk-entity-marker--circle`) and may be frozen as a static API now.
> The **image axis may not be frozen as an equality-gated static API** — it is construct kind 3,
> ruled shadow-only above. It may be frozen as a documented *authoring instruction* (the
> paired-spelling rule), and that instruction **must state the tie boundary explicitly**, and
> must state it **generically rather than by transcribing a number**: a consumer overriding the
> static rule needs specificity **strictly higher than that of the rewrite they are
> overriding**, computed from the rewrite actually shipped."

The underlying measurement (ADR-15 §"3. `::slotted()` child rule — shadow-only"): appearance
(`display`, `inline-size`, `block-size`, `object-fit`) reproduces exactly between
`::slotted(img)` and a document descendant rewrite, in both Chromium and Firefox. Cascade
**position** does not: a declaration from the outer (document) tree beats a `::slotted()`
declaration from the inner (shadow) tree regardless of specificity and regardless of stylesheet
order, so a page's bare `img { object-fit: contain }` always overrides the shadow form but loses
to an ordinary document-specificity rewrite. There is no document-context selector that
reproduces "always lose to the outer tree, at any weight, in any order" — so a gate that holds
the two forms equal cannot exist for this construct kind. This is why the image axis is
disqualified from the same equality-gated treatment as size/border, even though all three ship
in the same PR.

**Alternatives considered**:
- *Freeze all three axes uniformly as an equality-gated static API* (the issue's original framing,
  written before #301/ADR-15 existed) — rejected: ADR-15's measurement makes this impossible for
  the image axis specifically; adopting it would ship a gate whose green light is not a true
  equivalence.
- *Defer the whole mission until #311 lands the six-sheet instruction backfill* — rejected: #311
  owns the six *other* `::slotted()` sheets, not `sk-entity-marker`. ADR-15's own landing PR (#301
  merging as `mission/static-form-of-element-backed-css`) already discharged `sk-entity-marker`'s
  instruction — it is the ADR's own kind-3 exemplar and its instruction is already in
  `packages/styles/src/entity-marker/sk-entity-marker.css`'s header comment. #304 extends the
  size/border/image *surface*; it does not owe a fresh instruction for a sheet that already has
  one, though it must keep that instruction accurate as the size/shape modifiers it adds shift the
  rewrite's own specificity (see Decision 2).

## Decision 2: The tie-boundary restatement must be computed from the shipped rewrite, generically, never by transcribing `(0,1,1)`

**Decision**: The spec states the boundary rule in words — "a consumer override needs strictly
higher specificity than the shipped static rewrite; at a tie, the last stylesheet wins; the
shadow form would have yielded unconditionally" — and requires the instruction comment to compute
the actual number(s) for whatever rewrite the shipped CSS contains, rather than asserting a
literal figure in the spec itself.

**Rationale**: ADR-15 flags this exact trap for #304 by name:

> "For the bare `.sk-entity-marker__content > img` that is (0,1,1); combine it with a size or
> shape modifier — `.sk-entity-marker--sm .sk-entity-marker__content > img` — and the boundary
> moves to (0,2,1), which matters here precisely because #304 freezes those modifiers alongside
> the image axis. ... An instruction saying only 'outbid it on specificity' is safe when followed
> literally and silently wrong at the tie, which is the ordinary case."

ADR-15's own pre-merge gate caught and corrected a draft that had transcribed the specific figure
into the #304 paragraph — the corrected text is what research.md quotes above. This mission must
not re-make that mistake by putting a specific tuple into `spec.md` or `plan.md` as if it were the
final, binding number; the number is a property of whatever selector the implementation actually
ships (which may combine `.sk-entity-marker__content > img` with a size and/or shape class,
depending on how the docs choose to demonstrate the combined case), and only the shipped CSS
comment is the source of truth for it.

**Alternatives considered**:
- *State the boundary as "outbid it on specificity"* — rejected per ADR-15's explicit warning
  above: true at the loses/outbids rows of the three-way matrix, silently wrong at the tie row,
  which is what one wrapper class ordinarily produces.
- *Copy entity-marker's existing `(0,1,1)` figure into the new instruction unchanged* — rejected:
  the new size/shape modifiers this mission adds change the rewrite's own specificity for the
  combined-axis case, so the existing header comment's number needs re-verification, not
  reuse, once this mission's markup lands.

## Decision 3: No markup module, no generated static HTML — this component does not have one and this mission does not add one

**Decision**: `packages/elements/src/entity-marker/` carries no `sk-entity-marker.markup.ts`
today (`git ls-files` confirms it is not among the components with a static form), and this
mission does not add one. The size/border "static API" ADR-15 clears for freezing is the CSS
class contract (`sk-entity-marker`, `--sm`, `--circle`, plus the new border and additional size
modifiers) that any consumer — shadow-hosted element or hand-authored static markup — can apply
directly to their own markup; it is not a generated `<name>StaticHtml()` HTML snapshot.

**Rationale**: `docs/contributing/adding-a-component.md` step 2 states the markup module is
"optional — the generator derives its work set by glob from the elements that have one"; several
shipped components (e.g. `sk-section-header`, `sk-status-indicator` per the #146 evidence in
`expected-parts.json`) have none. `sk-entity-marker` is presentational CSS-classes-only; freezing
its size/border axis means freezing the class names, the token values behind them, and their
visual contract — documented in the CSS header and `docs/contributing/adding-a-component.md`'s
worked example — not generating new build output.

**Alternatives considered**: Author a markup module for entity-marker so the static path has
generated HTML — rejected as out of scope; no acceptance criterion in #304 or #300 requires one,
and introducing generated static HTML for a component that has shipped without it for several
prior missions (#146, #212) is a scope expansion this mission does not need to freeze the
class-level contract.

## Decision 4: Non-goals hold; #212's `sk-avatar` rejection stands; #303 is the only forward consumer named

**Decision**: No `sk-avatar`; no Team/membership/identity model; no new component; no image
fetch/crop/upload; no initials generation; no presence dot; no stacked/grouped marks. #303
(`sk-boundary-page`) is named in the epic's dependency map as the mission that composes
`sk-entity-marker`'s widened surface next (`T4 --> T3` in #300's mermaid graph) — this mission's
spec states, as its stable contract, exactly the surface #303 will need: named size scale,
circle/square shape, optional border with unchanged outer box, the image axis instruction, and
the unchanged accessible-naming contract.

**Rationale**: #212 explicitly rejected a separate `sk-avatar` ("#212 explicitly rejected a
separate `sk-avatar`, so the answer is an axis on this component, not a second one" — #304's own
issue body); #300 lists `sk-avatar` under "Excluded and already-owned work" with disposition
"Explicit non-goal of #212. #304 extends `sk-entity-marker` instead." Both are binding non-goals
carried into this spec unchanged.

## Decision 5: #286 (no user-visible literal in `render()`) is open, cross-cutting, and not this mission's gate to build

**Decision**: This mission keeps `render()` free of new user-visible literals for anything it
adds (mirroring the existing element, which already carries no literal English strings — labels
are entirely consumer-supplied), but it does **not** build a repo-wide "no literal in render()"
gate. #308 already set the precedent of a component-scoped red-first no-literal test registered
in `behaviours.json`; this mission may add an equivalent component-scoped test for
`sk-entity-marker` if the new size/border/image work introduces any render-time string, but the
general gate remains #286's deliverable.

**Rationale**: Per the mission brief: "#286 is OPEN with NO enforcing gate — I verified no script
in `scripts/` checks user-visible text. #308 set the precedent of a component-scoped red-first
no-literal test registered in `behaviours.json`. Consider it; do NOT build a repo-wide gate (that
is #286's deliverable)." `sk-entity-marker.ts`'s current `render()` contains no literal English
string (warnings go to `console.warn`, not to the DOM), and the new axes (size scale values,
border modifier, image instruction) do not introduce one either — they are class-name and CSS
concerns, not accessible-name or copy concerns.

## Open questions carried into planning

1. **Exact named size scale.** The issue requires "the sizes Family 4 actually uses," each named
   with "the screen that requires it." Family 4's evidence lists two mark sizes today
   (`.account-avatar`/`.personal-mark` at one size, `.entity-glyph` in workspace list/members
   table at another, `.profile-avatar` on the membership-detail page at a third) against the
   shipped default (`--sk-space-7`) and `--sm` (`--sk-space-5`). `/spec-kitty.plan` must map each
   named size to a concrete `--sk-space-*` token and a named screen, using the epic's evidence
   section and, if underspecified, treating this as an ambiguity to flag rather than invent.
2. **Border token choice.** `docs/contributing/adding-a-component.md`'s tokens-first rule and the
   existing `--sk-border-tint-*` family are the candidates; plan.md picks the specific token(s)
   and states the outer-box-preservation mechanism (border-box arithmetic against the existing
   `content-box` + padding geometry) explicitly, per the issue's demand to "prove it with a visual
   test rather than asserting it."
3. **Where the combined-axis specificity figure is finally computed and recorded.** This research
   decides it must not appear in `spec.md`; `plan.md`/`tasks/` decide which file (the CSS header
   comment, ADR-15 itself is out of scope to edit) is the single source of truth once the actual
   modifier-plus-image selector is chosen.
