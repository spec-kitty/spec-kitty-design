# Data Model: boundary-page-styles

This mission has no runtime data model — `sk-boundary-page` is a styles-only class family with no
custom element, no fetch, no timer, and no identity/session/membership model (explicitly a
non-goal). What follows is the **anatomy model**: the fixed set of BEM parts this mission defines,
which are required vs. optional, and what each composes from #302/#304. This is the contract a
consumer (and, later, Team Kitty's boundary pages) authors markup against.

## Entity: `sk-boundary-page` anatomy

| Part (class) | Required? | Consumer supplies | Frame supplies |
|---|---|---|---|
| `.sk-boundary-page__stage` | Yes — the outermost wrapper this mission owns | nothing (wraps the card) | centering, min-block-size, padding, responsive/forced-colors/reduced-motion baselines |
| `.sk-boundary-page__card` | Yes | the card's content (form or message) | the card's box: padding, max-inline-size, surface/foreground token pair, long-content containment |
| `.sk-boundary-page__mark` | **Optional** — omit entirely when the screen has no mark | a nested `<sk-entity-marker>` (or its static-path class form) | positioning/spacing of the mark within the card only — no default size/shape/border, no inferred content |
| consumer's own `<h1>` (styled via `.sk-boundary-page__title` applied to it) | Yes, but the **element** is entirely consumer-authored | the heading text and the `<h1>` itself | typography only — the frame manufactures no landmark and no heading level; the consumer's existing `<main>`/`<h1>` structure is unchanged |
| `.sk-boundary-page__body` | Yes | body copy (paragraphs, a real `<form>`, or a terminal message) — arbitrary consumer markup, including long opaque identifiers/URLs/email addresses | typography, and containment for unbroken long content (no document-level horizontal scroll) |
| `.sk-boundary-page__action-group` | Yes (as a container) — but may hold **zero** action children | zero, one, or several actions (buttons/links) | layout (row/wrap, 44px interactive-target sizing at both required widths); present-but-empty is a supported state, unlike the footnote (see below) |
| `.sk-boundary-page__footnote` | **Optional** — omit entirely when the screen has no guidance/reason text | short guidance or an operator-supplied reason string | typography only |

**The distinction between "optional, omit entirely" (`__mark`, `__footnote`) and "required
container, may be empty" (`__action-group`) is load-bearing and must not be collapsed.** The mark
and footnote are true anatomy-level optionals — their *absence from the DOM* is itself a tested
state (Decision 4, research.md). The action-group is always present as a container even when it
holds no actions, because "several actions" down to "no action" is a content-count spectrum on a
fixed container, not a structural on/off switch — collapsing it to "also omit when empty" would
create a second absence contract this mission's evidence does not ask for.

## Entity: composed component references (not owned by this mission)

| Composed component | Owning mission | What this frame may set | What this frame must not set |
|---|---|---|---|
| `<sk-entity-marker>` | #304 (shipped) | placement/spacing classes on the `.sk-boundary-page__mark` wrapper; the consumer's own choice of `size`/`shape`/`border="true"` attributes on the element itself | any default `size`/`shape`/`border` value inferred by the frame; any `::part()` rule reaching the marker's shadow internals |
| `<sk-pill-tag class="sk-pill-tag--status-<tone>">` | #302 (shipped) | placement/spacing classes on wherever the status pill is composed (e.g. inside `__body` or `__title`'s row) | any default tone inferred by the frame; any role/accessible-name contribution derived from the tone; any `::part()` rule reaching the pill's shadow internals |

Both rows are read directly from the shipped CSS header comments in
`packages/styles/src/entity-marker/sk-entity-marker.css` and
`packages/styles/src/pill-tag/sk-pill-tag.css` — see research.md Decision 2 for the exact quoted
text. Neither composed component is modified by this mission.

## Entity: the footnote absence contract

| Field | Description |
|---|---|
| `present state` | `.sk-boundary-page__footnote` exists as a DOM child of `.sk-boundary-page__card`, ordered after `.sk-boundary-page__action-group` |
| `absent state` | `.sk-boundary-page__footnote` does not exist in the DOM at all — never an empty or `[hidden]` element |
| `spacing mechanism` | ordinary flex/grid `gap` between `.sk-boundary-page__card`'s direct children — contributes zero space when a child is absent, by CSS gap semantics, not by an author-written absence rule |
| `assertion owed` | a computed-geometry comparison between the present and absent stories (research.md Decision 4) — the distance from the action-group's bottom edge to the card's bottom edge must equal the card's own `padding-block-end` in the absent story and be strictly larger in the present story, measured in-run |

## Entity: responsive/forced-colors/reduced-motion baseline (authored once)

| Concern | Mechanism | Applies to |
|---|---|---|
| Narrow width / 200% zoom | `@media` (viewport-relative), following research.md Decision 1 | `.sk-boundary-page__stage` padding, `.sk-boundary-page__card` max-inline-size, `.sk-boundary-page__action-group` wrap |
| RTL / logical layout | logical properties only (`inline-size`, `padding-inline`, `margin-block`, etc.) — no `left`/`right`/`width` physical properties | every part in the anatomy table |
| Forced colors | `@media (forced-colors: active)` — border-based edges (auto-remapped), no `background`-only distinguishing marks per this repo's established convention (see `docs/contributing/adding-a-component.md`) | `.sk-boundary-page__card` at minimum; extended to any part that currently relies on `background`/`box-shadow` alone |
| Reduced motion | asserted absence — the frame introduces no transition/animation, and a test requires this rather than assuming it (mission brief's explicit instruction) | whole family |

## Relationships

```
sk-boundary-page (styles-only family, no element, no shadow root)
 ├─ __stage (required, always present)
 │    └─ __card (required, always present; ONE anatomy for form-card and terminal-card — no
 │               modifier; content alone differs, per research.md Decision 3)
 │         ├─ __mark (OPTIONAL — omit entirely) ── composes <sk-entity-marker> (#304, unmodified)
 │         ├─ consumer's own <h1> (styled, not manufactured; landmark stays with consumer)
 │         │    └─ optional composed <sk-pill-tag class="sk-pill-tag--status-*"> (#302, unmodified)
 │         ├─ __body (required) ── may contain a real <form>, plain message text, or long opaque
 │         │                       content (URL/email/identifier) that must contain locally
 │         ├─ __action-group (required container; 0..N actions; 44px targets both widths)
 │         └─ __footnote (OPTIONAL — omit entirely, absence explicitly asserted)
 └─ no document-level horizontal scroll at any width; no motion introduced; no copy owned
```

No entity in this model has a lifecycle, a stored ID, a fetch, or a relationship to
Team/membership/invitation/bearer-link/session identity — consistent with the mission's binding
non-goals (authentication; state machines; permission/capacity evaluation; redirect logic; an
error taxonomy; a marketing shell; copy ownership/defaults; a component that decides its own
message or icon; an icon set; a custom element).
