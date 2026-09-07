# Presentation model: Unavailable context-navigation entry

This mission introduces no runtime data model. The following authored markup roles define the public presentation boundary.

| Role | Required | Consumer-owned values | Invariants |
|---|---:|---|---|
| Native list item | yes | order and parent list | Remains a direct native `li` in the consumer's list. |
| Unavailable entry | yes | label and `aria-disabled="true"` | Non-anchor; no role, URL, handler, or tabindex. |
| Label | yes | complete destination name | Visible and accessible; wraps without clipping. |
| Annotation | no | verbatim visible wording | No generated fallback; text supplements non-interactive structure so colour is not the only cue. |
| Child list | no for unavailable entries | N/A | Must not be rendered below an unavailable parent. |
| Current state | no for unavailable entries | N/A | `aria-current` remains exclusive to real available links. |

Valid transitions are consumer replacements between an available anchor and unavailable non-anchor markup. The design system stores no state and performs no transition.
