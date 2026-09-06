---
work_package_id: WP03
title: Stories — tones, themes, announcement, dismissal, greyscale and forced colors
dependencies:
- WP02
requirement_refs:
- FR-018
- NFR-001
authoritative_surface: packages/elements/src/notice/sk-notice.stories.ts
create_intent:
- packages/elements/src/notice/sk-notice.stories.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/notice/sk-notice.stories.ts
planning_base_branch: mission/notice-element
merge_target_branch: mission/notice-element
branch_strategy: Planning artifacts for this mission were generated on mission/notice-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/notice-element unless the human explicitly redirects the landing branch.
subtasks:
- T008
- T009
phase: Phase 3 - the stories
history:
- at: '2026-09-06T18:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
tags: []
tracker_refs: []
---

# WP03 — stories

`packages/elements/src/notice/sk-notice.stories.ts`, title `Elements/SkNotice`, `tags: ['autodocs']`,
`parameters: { a11y: { disable: false } }`.

## T008 — the required set

One story per tone; `LightMode` wrapped in `class="sk-light"` — **never** `data-theme="light"`, which
activates nothing on a wrapper because the token block anchors on `:root[data-theme="light"], .sk-light`
and `:root` only matches `<html>` (#93). Announcement off / polite / assertive. Long message.
Multi-paragraph body. Trailing actions. A slotted `sk-status-indicator`, composing without either
element altering the other.

**The message-change story**: same tone, new message, driven by a `play` function so the swap is real
rather than described. Its behaviour arm is in WP04 and its red is a stale message.

**The dismissible story**: Storybook action logging on `sk-notice-dismiss`, showing the notice is
still present after the event and that the control has an accessible name.

## T009 — greyscale and forced colors

`Greyscale` desaturates in the browser and must stay fully readable — the marker and the message text
carry the tone, so the hue is redundant. This is the audited defect shown as its own absence.

`ForcedColors` is a documented baseline. It must **not** be a byte-identical render of a sibling that
asserts nothing — #176's gate deleted three such decoys. Its docblock states the mechanism: the
background flattens to `Canvas`, the edge survives on the longhand border, and the widened
inline-start step is what remains distinguishing.

Every story id goes into `expected-stories.json` in WP05.
