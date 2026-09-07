# Data and semantic model: Native context navigation

This styles-only mission introduces no stored data, application state, or runtime model. The model below documents consumer-authored semantic relationships that the CSS contract must preserve.

| Entity | Required semantics | Consumer-owned attributes/content | Style-owned responsibility |
|---|---|---|---|
| Context navigation | Native `nav` with an accessible name | Landmark label and contained groups | Root layout and spacing |
| Navigation group | Native section or equivalent grouping associated with a heading | Group existence, order, heading text/id | Inter-group spacing |
| Group heading | Native heading | Level, id, label | Secondary typography |
| Destination list | Native `ul` | Destination order/count | List reset and vertical rhythm |
| Destination item | Native `li` | Membership and child-list presence | Item containment |
| Destination link | Native `a` with `href`; optional `aria-current` | URL, current annotation, label, accessible name | Target size, alignment, interactive/current states |
| Destination icon | Inline consumer content; decorative icon uses `aria-hidden="true"` | Glyph and accessible semantics | Size/alignment only |
| Destination label | Text within the link | Full visible/accessible string | Wrapping and shrink containment |
| Child destination list | Native `ul` nested within its parent `li` | Visibility, order, count | Indentation and visible hierarchy/connector |
| Empty copy | Native prose | Whether shown and exact wording | Muted readable treatment |
| Overflow link | Ordinary native `a` | Whether shown, URL, wording | Link affordance without CTA promotion |

## Relationships and invariants

- A group heading labels its group through native heading structure and/or `aria-labelledby` selected by the consumer.
- A child list is a direct semantic descendant of its parent list item; styles must not require wrapper hosts that break the list relationship.
- `aria-current` belongs to at most the consumer-designated current destination; CSS neither creates nor changes it.
- Link document/tab order equals consumer DOM order; CSS does not reorder items.
- Icons do not replace link text or inject names.
- Empty copy and overflow links do not imply computed empty/overflow state.
