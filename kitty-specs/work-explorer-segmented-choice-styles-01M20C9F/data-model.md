# Data Model: Work Explorer segmented-choice styles

**Mission**: `work-explorer-segmented-choice-styles-01M20C9F` | **Date**: 2026-09-08

## Why this document exists despite there being no data model

This mission ships a **styles-only** CSS class family (`sk-segmented-choice`) — no custom element,
no JavaScript, no persisted state, no server data, no client-side store. There is no data model in
the traditional sense (no schema, no entity persistence, no relationships enforced by code beyond
CSS selector matching). plan.md's own Documentation section says as much and declines to author
this file for that reason ("there is no data model … Producing empty placeholder files for phases
this mission does not need would itself be the kind of ratchet-gaming DIRECTIVE_043 warns
against").

That reasoning is sound for a *placeholder*. This file is not a placeholder — the runtime already
scaffolded it as part of research-phase backfill, and spec.md's own "Key Entities" section (lines
272-285) already names three entities and their attribute/ownership boundaries in prose. This
document formalizes that existing prose into a structured data-model artifact, adding nothing
spec.md does not already say. It exists to make the entity/attribute/ownership boundary
mechanically checkable by a future reader (or a future automated check) without re-deriving it
from spec.md's Key Entities prose each time — not to invent a data model where none exists.

## Entities

### Entity 1 — Segmented-choice group

**What it is**: The container element the consumer wraps around a row of buttons. A DOM node the
consumer authors and owns; the library's CSS only selects `.sk-segmented-choice` to style it.

**Attributes it carries** (all consumer-authored, none written or inferred by the CSS):

| Attribute | Type | Required | Read by CSS? | Written by CSS? |
|---|---|---|---|---|
| `class="sk-segmented-choice"` | CSS class | Yes | Yes (as the selector root) | No |
| `role="group"` | ARIA role | No — illustrative; spec.md's Acceptance Scenario 1 and Key Entities section both offer `role="group" aria-label="…"` only as an "e.g." example. The binding requirement is that the group carries an accessible group name by some valid mechanism, not specifically this literal attribute. | No | No |
| `aria-label="…"` (or `aria-labelledby`) | Accessible name | Yes — the group's accessible name is load-bearing for axe/AT (NFR-001, FR-007) | No | No |

**Ownership**: Fully consumer-owned. The library never reads `role`, `aria-label`, or
`aria-labelledby` — it has no selector that targets them. Their presence is asserted by the
Playwright browser-assertion suite (FR-007) against the *fixtures this mission ships*, not
enforced by the CSS at runtime. A consumer who forgets the accessible name produces a CSS render
that looks identical; nothing in the shipped artifact can detect or prevent that (spec.md Edge
Cases: "A group whose accessible name is missing … Out of the CSS layer's control").

**Relationships**: Contains zero or more Segmented-choice items (Entity 2), in DOM source order.
No cardinality constraint is enforced or assumed by the CSS — FR-006 requires correct layout at 2,
3, and 5 items, with "no assumption baked into the CSS that exactly three items exist."

---

### Entity 2 — Segmented-choice item

**What it is**: The class applied to each consumer-authored `<button type="button">` inside the
group. A real, focusable, native button — not a div/span pretending to be one.

**Attributes it carries**:

| Attribute | Type | Required | Read by CSS? | Written by CSS? |
|---|---|---|---|---|
| `class="sk-segmented-choice__item"` | CSS class | Yes | Yes (selector root) | No |
| `type="button"` | Native HTML attribute | Yes (prevents implicit form submission) | No | No |
| `aria-pressed="true"` \| `"false"` | ARIA state | Yes, on every item (truthful per-item state) | **Yes** — `[aria-pressed="true"]` is a live CSS selector for the pressed/selected visual state | No — the CSS never sets, toggles, clears, or infers this attribute |
| `disabled` | Native HTML boolean attribute | Only on items that are truly unavailable (FR-004; native, not `aria-disabled`) | **Yes** — `:disabled` is a live CSS selector for the disabled visual state | No |
| Item label (text content) | Text | Yes | No (CSS handles overflow/wrap generically, not per-label content) | No |

**Ownership**: The consumer owns and writes every attribute in this table, including
`aria-pressed`, on every render and every state change. The CSS's relationship to `aria-pressed`
and `disabled` is strictly **read-only, as CSS attribute selectors** — it visually distinguishes
whichever value is currently present; it has no mechanism to write, validate, or react
programmatically to either attribute (there is no JavaScript in this component at all). This is
the load-bearing boundary FR-001/FR-002/FR-014 name: "any implementation choice that has the CSS
infer, validate, or react to which item is 'selected' (beyond styling the attribute it's given)
crosses this boundary and is out of scope" (spec.md, Application ownership section).

**Cardinality of `aria-pressed="true"`**: Not constrained by the CSS. Spec.md's Edge Cases
section is explicit that zero, one, or multiple items may carry `aria-pressed="true"`
simultaneously, and the CSS must "remain readable" (not visually break) in every case, without
being required to detect or correct multiple-pressed or no-pressed states. "Exactly one pressed
item" is a *fixture contract* this mission's own Storybook stories must honour (so the stories
demonstrate the intended real-world usage) — it is not a runtime invariant the shipped CSS
enforces or can enforce.

**Relationships**: Belongs to exactly one Segmented-choice group (Entity 1), as a DOM child. Its
position among sibling items (DOM/source order) must match visual order and tab order — this is a
browser-native guarantee for `<button>` elements, asserted (not implemented) by FR-007's Playwright
spec.

---

### Entity 3 — Consumer-owned application state

**What it is**: *Not a design-system entity* — named here, as spec.md itself frames it, only to
draw the ownership boundary explicitly. This is Team Kitty's own state, entirely outside this
package's CSS, DOM, or any artifact this mission ships.

**What it covers** (per spec.md's Application ownership section, quoting issue #270 verbatim):
"the lane/person/type vocabulary, grouping algorithm, current value, URL or store synchronization,
availability, analytics and all results."

**Attributes/fields**: None defined by this mission — this entity has no shape the library
constrains. Team Kitty is free to model "current pressed value" as a string, an enum, a store
slice, a URL query param, or anything else; the only contract point is that whatever Team Kitty
chooses must eventually be reflected onto the DOM as each button's `aria-pressed` attribute (Entity
2) for the CSS to read.

**Ownership**: 100% Team Kitty (the consuming application). The library
(`@spec-kitty/styles`'s `sk-segmented-choice` class family) never reads, writes, or is aware of
this entity's existence beyond the two DOM attributes (`aria-pressed`, `disabled`) it selects from.

**Relationships**: Team Kitty's own state-management code is the thing that produces the
`aria-pressed`/`disabled` attribute values on Entity 2 instances, and the click-handling code that
changes them on interaction (all outside this mission's scope — "The library owns only the group
and button presentation," per the Application ownership blockquote).

## Explicit non-model

To close off a reading this document should not invite: there is **no persisted data model, no
server schema, no client-side store schema, and no API contract** anywhere in this mission's
scope. The three "entities" above are:

1. A DOM container the consumer authors (Entity 1).
2. A DOM element class applied to consumer-authored native buttons, with two presentational
   attributes read (never written) by CSS selectors (Entity 2).
3. A named boundary marker for state this package explicitly never touches (Entity 3).

This is a **presentational-attribute-driven** component: the entirety of its "data model" is two
CSS attribute selectors (`[aria-pressed="true"]`, `:disabled`) against attributes a consumer
writes. There is no mutation, no lifecycle, no validation, and no persistence to document beyond
what the table above already states.

## Traceability

This document adds no requirement beyond what spec.md's Key Entities section (lines 272-285) and
Application ownership section (lines 287-295) already state as binding. Every attribute, ownership
claim, and relationship above is a direct formalization of that existing prose, cross-checked
against the Functional Requirements it maps to: FR-001 (consumer-owned public contract), FR-002
(no owned semantics beyond styling), FR-004 (native `disabled`), FR-006/FR-007 (accessible-name and
role assertions on the fixtures), and the Edge Cases section (multiple/zero pressed items,
missing accessible name).
