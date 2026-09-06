---
work_package_id: WP01
title: The notice stylesheet — tone surface, forced colors, reduced motion
dependencies: []
requirement_refs:
- FR-012
- FR-013
- FR-014
- FR-015
- FR-017
- NFR-002
- NFR-003
- NFR-005
- C-004
authoritative_surface: packages/styles/src/notice
create_intent:
- packages/styles/src/notice/sk-notice.css
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/notice/sk-notice.css
- stylelint.config.mjs
planning_base_branch: mission/notice-element
merge_target_branch: mission/notice-element
branch_strategy: Planning artifacts for this mission were generated on mission/notice-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/notice-element unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - the surface
history:
- at: '2026-09-06T18:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
tags: []
tracker_refs: []
---

# WP01 — the notice stylesheet

Author `packages/styles/src/notice/sk-notice.css`, the CSS source of record. There is no static
HTML form and therefore no `sk-notice.html`, no `index.ts` and no `*-html.stories.ts` here.

## T001 — the tone surface, consuming the existing token family

`:host { display: block }` (#135). Six tone modifiers reading `--sk-status-<tone>` for the surface
and `--sk-on-status-<tone>` for the foreground and the marker. **No `--sk-notice-*` token is
created** — #178 names forking the family as the risk this WP exists to avoid.

No theme selector anywhere: `:root[data-theme="light"] .sk-notice` and `.sk-light .sk-notice` both
cross the shadow boundary and are inert once adopted, silently (ADR-9 §3). Light-mode variance is
already in the tokens.

## T002 — forced colors, verified load-bearing rather than assumed

`background` flattens to `Canvas` under `forced-colors: active`, so the tone must survive on the
EDGE and the marker. Use the **longhand** `border-inline-start-color` — stylelint's
`declaration-strict-value` does not inspect the `border` shorthand at all, so a shorthand would pass
by being invisible to the gate rather than by satisfying it.

**The block must change something the automatic remap cannot supply.** `border` colours are remapped
to a system colour with zero author CSS, and `transparent` on a `border-*-color` is **not**
preserved — it maps to `CanvasText` too. A block whose only effect is to set a colour that would
have been set anyway is inert. This block therefore also widens `border-inline-start-width`, which is
a real, measurable change, and pins the colour to `CanvasText` to make it deliberate rather than
whatever the remap picks.

The dismiss control's focus ring is drawn with `outline`, never `box-shadow` — `box-shadow` computes
away entirely under forced colors. Add `outline-color: Highlight` in the forced-colors block.
`forced-color-adjust: none` is not used anywhere: it freezes a value at its authored colour, which
is frequently invisible against the forced-colors background.

Any system-colour keyword used must be in `stylelint.config.mjs`'s `ignoreValues`.

## T003 — reduced motion

One entrance transition, cancelled under `@media (prefers-reduced-motion: reduce)`, scoped to the
exact selector and the exact property this component owns — never a wildcard over its subtree. The
announcement must not be gated on the transition in either state.
