---
work_package_id: WP01
title: The heading is inside the live region, and the record says so
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- NFR-001
- NFR-003
planning_base_branch: mission/notice-heading-in-region-and-tint-doctrine
merge_target_branch: mission/notice-heading-in-region-and-tint-doctrine
branch_strategy: Planning artifacts for this mission were generated on mission/notice-heading-in-region-and-tint-doctrine. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/notice-heading-in-region-and-tint-doctrine unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
phase: Phase 1 - the element
history:
- at: '2026-09-07T00:05:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: packages/elements/src/notice/sk-notice.ts
create_intent: []
owned_files:
- packages/elements/src/notice/sk-notice.ts
- packages/elements/src/notice/sk-notice.stories.ts
- packages/elements/src/notice/sk-notice.css.js
- packages/elements/src/notice/sk-notice.css.d.ts
- packages/styles/src/notice/sk-notice.css
- fixtures/elements-behaviour/src/sk-notice.test.ts
- packages/elements/custom-elements.json
- packages/react/src/index.js
- packages/elements/SIZES.md
- docs/design-system/changelog.md
execution_mode: planning_artifact
model: ''
tags: []
tracker_refs:
- '228'
---

# Work Package Prompt: WP01 – The heading is inside the live region

Closes #228, under the operator ruling of 2026-09-07. See `plan.md` §A–§D.

## T001 — FR-003, SC-001: capture the red before writing the fix

Add a test to `fixtures/elements-behaviour/src/sk-notice.test.ts` that mounts an announcing notice
with a `message` and a slotted `<h3 slot="heading">`, and asserts both that `[part="heading"]` is a
descendant of the role-carrying node and that the region's **flattened** text reads heading-first.

Flatten with `HTMLSlotElement.assignedNodes({ flatten: true })`. `Element.textContent` does not
cross a slot, so an assertion written against it is red for the wrong reason today and unsatisfiable
after the fix.

Run it against the unchanged template and record the failure verbatim in the PR body. That text —
a heading present in the element and absent from the region — is the defect the ruling closes.

## T002 — FR-001: move the heading inside the `keyed()` body

`<div part="heading" class="sk-notice__heading">` becomes the first child of the body div rather
than a preceding sibling of `${body}`. All seven declared parts survive, so `expected-parts.json`
and the `[SC-013]` test are unchanged.

## T003 — NFR-001: the render does not move

`.sk-notice__content` is a grid with `gap: var(--sk-space-2)`, and the heading was one of its
items — so it contributed a gap even when empty. Replace that gap with an equal margin on the same
box in `packages/styles/src/notice/sk-notice.css`, then regenerate the element's CSS module
cache-free. Work through the zero-height cases rather than assuming them; `plan.md` §B has both.

## T004 — FR-002, FR-004, SC-002, SC-003: the guarantees that must survive

The four existing announcement-contract assertions — message reaches the region, node identity
across a message change / a tone change / both, a politeness change builds a new node,
`announce="off"` renders no region — must pass unchanged, now with a heading in scope. Extend the
`announce="off"` case from "no region node" to the ruling's question: **no `[role]` and no
`[aria-live]` anywhere in the shadow root**, for every tone.

## T005 — FR-007, SC-005: judge the `keyed()` caveat, do not assume it

Re-read the caveat in `sk-notice.ts` against the new shape and record a conclusion in the file.
Two facts to check rather than assert: whether `role="alert"`/`role="status"` carry an implicit
`aria-atomic`, and whether the caveat's own "reliable path" still reaches an empty region once a
heading is slotted. Say what you concluded in the report either way.

## T006 — FR-005, NFR-003, SC-004: the published contract matches

The `@slot heading` JSDoc currently states the heading is **not** inside the live region and points
at #228 as an open question. Rewrite it. Check the class docblock, the `@csspart body` line and the
story prose for the same claim. Then regenerate the manifest and the React wrappers cache-free —
the wrapper generator copies these descriptions into consumer-facing docs.

## T007 — FR-006, SC-004: the changelog entry and the migration line

The ruling requires this and names why: it changes what every existing consumer hears. Under
`[Unreleased]` in `docs/design-system/changelog.md`, say what changed, what a consumer will now
hear, and what to do instead if they wanted the headline silent.

## T008 — NFR-003: `SIZES.md` after a real build

`measure-elements-sizes.mjs` reads `dist/` and does not build it. Build cache-free first, then
regenerate, then confirm `--check` is green. Do not commit any packed or gzipped figure.
