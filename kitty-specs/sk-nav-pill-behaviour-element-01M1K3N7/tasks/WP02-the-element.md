---
work_package_id: WP02
title: The element — shape, public API, keyboard and focus
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
planning_base_branch: mission/sk-nav-pill-behaviour-element
merge_target_branch: mission/sk-nav-pill-behaviour-element
branch_strategy: Planning artifacts for this mission were generated on mission/sk-nav-pill-behaviour-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-nav-pill-behaviour-element unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
- T007
phase: Phase 2 - Element
history:
- timestamp: '2026-09-03T08:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/nav-pill/sk-nav-pill.ts
create_intent:
- packages/elements/src/nav-pill/sk-nav-pill.ts
- packages/elements/src/nav-pill/sk-nav-pill.stories.ts
execution_mode: code_change
owned_files:
- packages/elements/src/nav-pill/sk-nav-pill.ts
- packages/elements/src/nav-pill/sk-nav-pill.stories.ts
- packages/elements/src/index.ts
tags: []
tracker_refs: []
---

# WP02 — The element

## The shape is determined by ADR-9, not chosen here

> *"axe resolves `aria-labelledby` from the attribute and scopes ID lookups to `getRootNode()`,
> so no cross-root reference resolves."* — ADR-9, quoting MDN: *"a target element must be in the
> same DOM as the referencing element, or a parent DOM."*

The hamburger carries `aria-controls`. So the control and the panel it names **share a root**,
and the element owns both. It cannot name a panel the consumer left in their document — which is
precisely the arrangement `apps/demo/dashboard-demo.html` uses today (button at `:535-540`, drawer
at `:569`, different subtrees). Flagged on #73 as an ADR consequence rather than a new decision.

## Subtasks

- **T004** — `sk-nav-pill.ts`. Shadow root: `<nav>`, one items container wrapping a single
  `<slot>`, and the hamburger `<button>` whose `aria-controls` names the container. Registered
  through the guarded `define()` (ADR-10 §5) with the `@element` JSDoc annotation — **required,
  not decorative**: the analyzer cannot follow `define()`'s indirection and
  `scripts/check-manifest-content.mjs` fails without it.

  **Published prose stays short.** Everything in a `/** */` above an export, and every
  `@csspart` description, is copied verbatim into `custom-elements.json` and rendered in IDE
  hovers. #72 shipped a 1144-character blob that way. Rationale goes in `//` comments.

- **T005** — `open` as a reflected boolean property/attribute, plus `open()`, `close()`,
  `toggle()`. Two hazards, both of which the tests in WP03 are written to catch:
  - Reflection plus a change event is the classic re-entry shape. The property setter must not
    loop back through the attribute callback — "fires exactly once" is what exposes it.
  - `open()` when already open must fire **nothing**. Idempotence is asserted, not assumed.

- **T006** — The state-change event: documented name, `detail` shape, `bubbles`, `composed`,
  and `cancelable` on the **opening** transition so `preventDefault()` has something to prevent.
  Record all five in the element's published JSDoc — that is the manifest's only source.

- **T007** — Keyboard and focus. Escape closes an open panel and returns focus **to the invoker
  recorded at open time**, not to the internal hamburger: `open()` is public and a consumer's
  control is a legitimate invoker, which is the entire point of replacing the global helper.

  `document.activeElement` inside a shadow root reports the **host**, not the inner button —
  use the composed path. Escape on a *closed* panel must do nothing and must not steal focus.
  Focus return when the invoker has since left the DOM must not throw.

- **T007b** *(same file, listed here so it is not lost)* — stories, including one that renders
  with the panel **already open** (NFR-003/SC-108). The axe gate's render predicate is flat-tree
  and slot-aware; a story that paints nothing until interaction reads as an *unrendered* story,
  not a passing one, so the open story must render open on load rather than opening itself in a
  play function.

## Definition of Done

- `<sk-nav-pill>` with four slotted links renders four in the row and the same four in the panel,
  with the links authored once.
- Two instances on one page are independent.
- `npx nx run elements:analyze` describes `<sk-nav-pill>` by real tag name, and the published
  prose for the element is short.
- The a11y gate is zero for every nav-pill story, open state included.
