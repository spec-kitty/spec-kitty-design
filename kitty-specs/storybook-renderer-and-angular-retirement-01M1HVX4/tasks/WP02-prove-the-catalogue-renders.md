---
work_package_id: WP02
title: Prove every story renders, and that the gate can still fail
dependencies:
- WP01
requirement_refs:
- FR-008
- NFR-002
- NFR-003
- C-005
planning_base_branch: mission/storybook-renderer-and-angular-retirement
merge_target_branch: mission/storybook-renderer-and-angular-retirement
branch_strategy: Planning artifacts for this mission were generated on mission/storybook-renderer-and-angular-retirement. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/storybook-renderer-and-angular-retirement unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
phase: Phase 2 - Verification
history:
- timestamp: '2026-09-02T20:20:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/styles/src/
create_intent: []
execution_mode: code_change
owned_files:
- packages/styles/src/**/*.stories.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP02 – Prove every story renders, and that the gate can still fail

Implements IC-02 and IC-05. This is the WP that stops the migration silently turning the accessibility gate into a no-op.

## Context

A Vite build emits `<script type="module">`, which Chromium blocks over `file://`. ADR-13 records that against the spike build **all six stories failed to render** while the pre-repair gate reported `✅ Zero WCAG 2.1 AA violations` and exited 0.

**That repair already landed** — in #91 (`ce30b3e`), not in this mission. `scripts/run-axe-storybook.js` starts an in-process HTTP server on `listen(0)` and navigates `http://127.0.0.1:<port>`; no `file://` navigation remains. **Do not re-implement it.** This WP verifies it still holds against a Vite build.

## Subtasks

- **T004** — Run the axe gate against the WP01 build. Confirm it visits every story in the catalogue index and that the story count matches; a gate that silently reviews a subset is the same defect as one that reviews nothing.
- **T005** — **Prove the gate can fail.** Temporarily break one story so it mounts nothing, run the gate, and confirm it exits non-zero naming that story. Revert. A gate whose failure path is untested is not evidence (C-005).
- **T006** — Correct the type source in the 13 `packages/styles` story files: `import type { Meta, StoryObj }` from `@storybook/web-components` instead of `@storybook/html` (FR-008). Type-only imports are erased, so verify with a typecheck, not a build.

## Definition of Done

- [ ] Every story in the catalogue renders content into its component host, proven by the HTTP-served gate (NFR-002).
- [ ] The number of stories the gate assessed equals the number in the Storybook index — recorded as two numbers in the PR, not asserted as "all".
- [ ] The deliberate-breakage run is recorded: the command, the story broken, and the non-zero exit (C-005).
- [ ] Type imports point at `@storybook/web-components`; typecheck passes.
- [ ] The only change to `packages/styles` story files is the type-import line (NFR-003).

## Notes

Any pre-existing `color-contrast` violations (ADR-13 saw two, on `BlogCardExample` and `LightMode`) are **component defects, not migration artifacts**. Report them; do not fix them here and do not let them be mistaken for migration damage. `LightMode` is governed by C-004 — see WP04.
