---
work_package_id: WP02
title: The element — announcement contract, dismissal and slots
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-016
- NFR-004
- C-001
- C-002
- C-003
- C-005
authoritative_surface: packages/elements/src/notice
create_intent:
- packages/elements/src/notice/sk-notice.ts
- packages/elements/src/notice/sk-notice.css.js
- packages/elements/src/notice/sk-notice.css.d.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/notice/sk-notice.ts
- packages/elements/src/notice/sk-notice.css.js
- packages/elements/src/notice/sk-notice.css.d.ts
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
planning_base_branch: mission/notice-element
merge_target_branch: mission/notice-element
branch_strategy: Planning artifacts for this mission were generated on mission/notice-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/notice-element unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
- T007
phase: Phase 2 - the element
history:
- at: '2026-09-06T18:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
tags: []
tracker_refs: []
---

# WP02 — the element

`packages/elements/src/notice/sk-notice.ts`, plus both barrels.

## T004 — the announcement contract

This is the mission. `announce` is `off` (default) | `polite` | `assertive`, explicit and
independent of `tone`.

The live region **is** the visible message container — one node, one copy of the text. A separate
visually-hidden mirror would put the message in the accessibility tree twice, and `aria-hidden`ing
it would suppress the announcements it exists for.

The container is rendered with its `role` from that node's first render whenever `announce !== 'off'`,
and is `keyed()` on the announce level so a politeness change births a new node rather than toggling
a role onto a node that already holds text.

`message` is a **reactive property**. A message change re-renders only the text child; Lit keeps the
container node. That single fact is both the re-announcement mechanism and the node-stability
guarantee, and it is the direct repair of the defect `sk-form-input.ts` records at `:67-73` and
`:193-198`.

Document on the element that a consumer who must announce a message that exists at insertion time
should insert the notice and then assign `message` — the element cannot defer its own first paint
without a timer this mission is barred from adding.

## T005 — dismissal

A real `<button>` with a required accessible name (`dismissLabel`, with a documented default).
Emits exactly one `sk-notice-dismiss`: bubbling, composed, cancelable, typed detail.

**The element never removes itself**, in either branch. The one post-dismiss effect the element owns
is the focus move, and `preventDefault()` abandons it — that is what makes `cancelable` load-bearing
rather than an inert affordance.

Focus moves to the **host**, made programmatically focusable with `tabindex="-1"` set in
`connectedCallback` only when the consumer has supplied none. Rationale, documented on the element:
the button is the node most likely to stop existing the instant the consumer acts on the event, so
leaving focus there drops it to `<body>`; the host is still in the document when the consumer's
handler runs, giving them a defined place to redirect from.

## T006 — tone, slots and parts

`tone` consumes the **imported** `STATUS_TONES`; unknown values degrade to `neutral` with a warning,
matching `sk-status-indicator` and `sk-card`. The type annotation still spells the union inline
because `build-vue-types.mjs` copies the manifest's type text into a `vue.d.ts` that imports nothing.

Slots: `heading` (a consumer-supplied native heading — the element generates none), `marker` (with
fallback content), default (message body), `actions`. Every `::part()` declared with `@csspart` and
the tag terminated before any prose; every slot with `@slot`; the event with `@fires {CustomEvent<…>}`;
every public reactive property with a `/** */`, since `check-manifest-content.mjs` refuses an
undescribed one.

## T007 — barrels

Export the class, the tone-related types, the dismiss detail type and the sheet from
`packages/elements/src/index.ts`; append the side-effect import to `src/elements.ts`. The sheet
export is what lets the SC-014 test assert provenance rather than a tautology.
