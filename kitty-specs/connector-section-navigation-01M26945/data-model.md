# Data and semantic model: Connector section navigation

This styles-only mission introduces no stored data, application state, or runtime model. The table
below documents the consumer-authored semantic relationships the CSS contract must preserve.

| Entity | Required semantics | Consumer-owned attributes/content | Style-owned responsibility |
|---|---|---|---|
| Section navigation strip | Native `nav` with an accessible name (`aria-label` or `aria-labelledby`) | Landmark label | Root layout, local horizontal-scroll containment |
| Route link | Native `a` with `href`; optional `aria-current` | URL, link text/accessible name, presence (permission-gated), DOM order, current annotation | Target geometry, alignment, interactive/current states |

## Relationships and invariants

- Every route link is a direct child of the nav (no intermediate list/grouping structure — this is
  a flat sibling strip, unlike `.sk-context-nav`'s grouped/nested model).
- Link document/tab order equals consumer DOM order; CSS never reorders items.
- `aria-current` belongs to at most the consumer-designated current link; CSS neither sets,
  infers, nor changes it. A render with zero current links is valid.
- A route the consumer omits (e.g. permission-filtered out) leaves no trace in the DOM — no
  placeholder node, no reserved space, no disabled-looking affordance.
- Link text is the sole source of the link's accessible name; the family injects no generated
  content that would appear in the accessible name (any decorative glyph, if a consumer adds one,
  is the consumer's own responsibility to mark `aria-hidden`, the same boundary `.sk-context-nav`
  already documents for its own icons — though this family defines no icon part of its own).
- No wrapper element, shadow root, or intermediate host sits between the `nav` and its anchor
  children; the family is a plain BEM class family applied directly to consumer-authored native
  elements, so the ADR-9 cross-shadow-boundary hazard does not apply (there is no shadow boundary).
