# Data model: compact navigation shell

This is a presentation contract, not an application data model. The shell stores no routes, destinations, Team Kitty data, persistence, or navigation history.

## Public concepts

| Concept | Shape / states | Owner | Invariant |
|---|---|---|---|
| Presentation axis | absent (legacy) or recognized compact value | Consumer selects; shell presents | Absent preserves existing output; unknown values warn and fail open. |
| Open value | controlled boolean, open or closed | Consumer | Shell never changes it directly. |
| Compact header | optional slotted consumer markup containing the consumer trigger | Consumer content; shell placement | Available only in effective compact presentation; does not create a duplicate main landmark. |
| Compact navigation | optional slotted native navigation markup | Consumer content; shell placement/visibility/scrolling | Closed content is not focusable or exposed; open content follows native order. |
| Trigger reference | property-only reference to the consumer control slotted in `compact-header` | Consumer | Same light-DOM root as navigation target; used for focus return only if still connected after an accepted close. |
| Accessible relationship | trigger `aria-expanded`, `aria-controls`, labels; drawer accessible name | Consumer | Claims reflect the consumer-controlled open value; the trigger and drawer leave presentation together above 860px. |
| Effective open | recognized compact axis + observed shell inline size `<=860px` + `open === true` | Shell derives; never persisted | Gates Escape, drawer exposure, and dismissal focus; absent, unknown, and wider presentations are not effectively open. |
| Dismissal request | `CustomEvent<...>` | Shell emits intent; consumer accepts | Exactly one on Escape while effectively open; bubbling, composed, non-cancelable; none otherwise. |
| Pending dismissal | ephemeral request marker with an acceptance window bounded to exactly one post-dispatch microtask sample | Shell | The sample accepts effective falsiness (`open !== true`), including React 19's omitted/undefined false property, then expires the intent whether accepted or rejected. After acceptance, the shell awaits its Lit update before focusing a connected trigger; no close after the sample can inherit the intent. |

## State transitions

```text
consumer open=false --toggle/consumer action--> consumer open=true
effective open --Escape--> shell emits one dismissal request
shell request --exactly one post-dispatch microtask observes open !== true--> intent accepted and expired; Lit update closes, then trigger focused if connected
shell request --that one sample observes open === true--> intent rejected and expired, no focus move
consumer close after the sample, including route/state close --> no inherited focus-return intent
resize / app-shell inline threshold crossing --> presentation recomputed; consumer open unchanged
unknown axis --> warn + legacy presentation
```

Resize may change what is displayed but never changes the controlled value. The consumer trigger is inside `compact-header`, so trigger and drawer leave presentation together above 860px while the shell reconciles any focus left in the hidden regions.

## Event contract

The dismissal event is typed in public JSDoc and has a stable name chosen by existing `sk-*` event conventions. Its detail is an intent payload, not application state; consumers must not treat the shell as a router. Required DOM flags are `bubbles: true`, `composed: true`, and `cancelable: false`. Escape handling must be idempotent within one key interaction and must not dispatch unless the shell is effectively open. Exactly one bounded post-dispatch microtask samples consumer acceptance as effective falsiness (`open !== true`), including React 19's omitted/undefined false property. The acceptance window expires at that sample whether accepted or rejected; after acceptance the shell awaits its Lit update before focusing, and any close after the sample, including a later route/state close, cannot inherit the intent.

## Compatibility and styling

Existing slots, parts, default grid, and consumer properties remain valid. New slots are optional. Styling crosses the open shadow boundary only through inherited `--sk-*` tokens, documented parts, and documented per-component properties, consistent with ADR-9. Markup remains authored once in the element; the repository-wide ADR-10 generator remains green without adding an inapplicable app-shell markup module.

## Verification entities

Fixtures are organized around: legacy desktop; compact closed/open at app-shell inline sizes 860/768/390; 861 and constrained-shell coordinate-system edges; long labels; short/tall viewports; keyboard/pointer; accepted and rejected dismissal; disconnected trigger; resize crossing; dark/light/forced-colors/reduced-motion; and real 200%/400% browser UI zoom. Assertions cover state ownership, event flags/count, focus, accessibility-tree/focus inertness, overflow, internal scrolling, and generated-contract ratchets.
