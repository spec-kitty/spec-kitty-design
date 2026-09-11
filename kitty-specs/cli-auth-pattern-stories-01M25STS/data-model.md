# Presentation model: CLI Auth fixtures and projections

This mission introduces no runtime or persisted application data model. The entities below are immutable Storybook fixture inputs and pure display projections used to prove public composition of the four canonical CLI-auth states.

## Fixture entities

| Entity | Required fields | Optional fields | Invariants |
|---|---|---|---|
| Code-entry fixture | label, description, submit label | invalid state (error message) | Renders one native `<form>` with one labelled input and one primary submit action. The invalid branch renders only when the fixture supplies an error message. |
| Authorization fixture | client name, account, redirect target, scopes (ordered list of label strings), Approve label, Deny label | none | Facts render through `.sk-facts` in fixture order; each scope renders as one `sk-pill-tag`; Approve precedes Deny in DOM order, matching visual order. |
| Terminal-outcome fixture | outcome kind (`success`\|`denied`), status heading, status body | one action (label + href) | Composes `sk-boundary-page`. No action renders unless the fixture supplies exactly one. |
| Terminal-error fixture | error heading, error body | one action (label + href) | Composes `sk-boundary-page`. No retry/back/recovery control renders unless the fixture supplies exactly one real route. |

## Story projection

| Projection | Source | Output rules |
|---|---|---|
| Story 1 default | code-entry fixture, no error | Label/description/input/submit render from the fixture; no `aria-invalid` state is present. |
| Story 1 invalid | code-entry fixture with error message | Input carries `aria-invalid="true"`; the supplied error text is associated as the control's description and announced. |
| Story 2 | authorization fixture | Facts, scopes, Approve, and Deny render exactly once each from the fixture; Deny composes `#320`'s danger-secondary tone once landed. |
| Story 3 success | terminal-outcome fixture, `outcome: 'success'`, no action | `sk-boundary-page` shows the supplied heading/body; the required `.sk-boundary-page__action-group` container is always present (`sk-boundary-page.css`'s own anatomy never omits it) and renders zero action children. |
| Story 3 denial | terminal-outcome fixture, `outcome: 'denied'`, no action | Same frame, denial copy; the action-group container renders present but empty, as above. |
| Story 4 no-action | terminal-error fixture, no action | `sk-boundary-page` shows only the exact error heading/body; zero controls anywhere in the composition. |
| Story 4 with-action | terminal-error fixture, one supplied action | Exactly the one supplied action renders, sourced only from the fixture. |

## Validity rules enforced by pure selectors

1. Every user-visible string in every projection traces to exactly one fixture field; none is synthesized, translated, or defaulted by the pattern.
2. The code-entry invalid branch renders if and only if the fixture supplies an error message; no other condition may trigger it.
3. Authorization scopes preserve fixture order in both the rendered pill-tag row and any accessible-name enumeration.
4. Approve and Deny are both present in every Story 2 render; DOM order is always Approve-then-Deny, matching the approved visual order.
5. A terminal-outcome or terminal-error projection's `.sk-boundary-page__action-group` container is always present — it is a required part of `sk-boundary-page`'s anatomy and is never omitted from the DOM, unlike the optional mark/footnote. It renders exactly one child action when the fixture supplies one (label + href), and zero child actions otherwise; it never renders more than one, and never invents one. (Corrected from an earlier "no action group renders" phrasing in the Story 3 rows above: the container itself always renders; only its child action is conditional.)
6. `outcome: 'success'` and `outcome: 'denied'` share the same `sk-boundary-page` anatomy; only the supplied heading/body copy differs — no separate success/denial component or modifier is introduced.
7. Keyboard tab order equals DOM order in every interactive story; no positive `tabindex` is used anywhere in the pattern.
8. No projection infers session, permission, route, or request-lifecycle state; every conditional in the pattern branches on a fixture field, never on an application concern.

The pattern stores no transitions and performs no fetch, routing, timer, or persistence of its own. Story controls, where any exist (e.g. toggling between the invalid/default code-entry fixture in Storybook's controls panel), only swap which immutable fixture is passed to the pure projection — they do not mutate fixture data or introduce derived state.
