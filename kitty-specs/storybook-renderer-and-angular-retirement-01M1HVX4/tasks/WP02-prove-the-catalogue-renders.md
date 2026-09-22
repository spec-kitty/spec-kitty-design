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
- scripts/run-axe-storybook.js
- apps/storybook/src/tests/smoke.spec.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP02 – Prove every story renders, and that the gate can still fail

Implements IC-02 and IC-05. This is the WP that stops the migration silently turning the accessibility gate into a no-op.

## Context

A Vite build emits `<script type="module">`, which Chromium blocks over `file://`. ADR-13 records that against the spike build **all six stories failed to render** while the pre-repair gate reported `✅ Zero WCAG 2.1 AA violations` and exited 0.

**The HTTP repair already landed** in #91 (`ce30b3e`) — the runner serves `http://127.0.0.1:<port>` with no `file://` navigation left, and it *does* assert mounting (`:139-202`). Do not re-implement that.

**But the gate is currently blind to every story this mission retains.** `run-axe-storybook.js:41`:

```js
const UNRENDERABLE_IMPORT_PATTERN = /\/packages\/(html-js|styles)\//;
```

`:278-279` splits on it — matches go to `skipped`, non-matches to `testable`. So all **74** `packages/styles` story exports are skipped, and the gate assesses **57 of 131** stories, every one of them an Angular story WP03 deletes. The `(html-js|styles)` alternation exists to *keep* skipping them across #85's rename. The script says so itself (`:36-37`): *"delete this skip in that mission and the 74 stories rejoin the gate"* — naming #69.

And `:282-288` hard-exits 1 once `packages/angular` is gone: *"No stories left to assess — every story was skipped."* **So WP03 cannot pass until this WP deletes the pattern.**

An earlier draft of the plan said `packages/styles` stories were "excluded from the filter". That had the polarity backwards and is corrected.

## Subtasks

- **T004** — **Delete `UNRENDERABLE_IMPORT_PATTERN`** (`:41`), its comment block (`:26-41`), the `skipped`/`testable` split (`:278-279`), the now-dead empty-set guard (`:282-288`) and the skip-reporting branch (`:301-307`). Then run the gate against the WP01 build and confirm `testable` equals the full index count — record both numbers.
- **T004b** — **Repair the mount assertion before relying on it.** `:186-195` filters on `^sk-` *tagNames*; verified, every `sk-*` tagName in this repo is an Angular component selector, and `grep -rhoE '<sk-[a-z-]+' packages/styles` returns nothing. Post-WP03 that filter matches zero elements and the gate silently degrades to the root-level existential check the file's own comment (`:180-183`) calls insufficient. Add a class-based sibling: every `[class^="sk-"], [class*=" sk-"]` element must have text or an element child. C-005 says the gate may not weaken; without this it weakens invisibly.
- **T005** — **Prove the gate can fail — two cases, run after T004/T004b.** A single all-blank case is not enough, because the interesting failure is partial.
  - **(a) full blank:** in `packages/styles/src/card/sk-card-html.stories.ts` set `render: () => ''`. Expect exit 1 naming `components-skcard-html--default`, reason `render root is empty`.
  - **(b) partial mount:** set `render: () => '<div class="sk-card"></div>'` — wrapper present, content absent. Expect exit 1. **Without T004b this currently exits 0**, which is the point of running it.
  Revert both. Record both commands, both exit codes and both reason strings in the PR. Note the build will *not* catch either break — `render: () => ''` is valid TypeScript.
- **T006** — Correct the type source in the 13 `packages/styles` story files: `import type { Meta, StoryObj }` from `@storybook/web-components` instead of `@storybook/html` (FR-008). Type-only imports are erased, so a green build proves nothing. **This repo has no `typecheck` script** — `grep -rn "typecheck\|tsc --noEmit" package.json .github/workflows/ */*/project.json` returns zero. Either run and record an explicit `npx tsc --noEmit -p apps/storybook/.storybook/tsconfig.json` (note it sets `strict: false`), or state that FR-008 is verified by module resolution instead. Name whichever you did.
- **T006b** — Upgrade the HTML smoke test (`apps/storybook/src/tests/smoke.spec.ts:61-68`), which currently asserts only `status() < 400` and that `#storybook-root` is *attached* — a certifying-absence test that defers to a visual baseline WP04 shows is blank. Make it assert rendered content.

## Definition of Done

- [ ] `UNRENDERABLE_IMPORT_PATTERN` and its skip branches are gone from `scripts/run-axe-storybook.js`.
- [ ] Every story in the catalogue renders content into its component host, proven by the HTTP-served gate (NFR-002).
- [ ] The number of stories the gate assessed equals the number in the Storybook index — recorded as two numbers in the PR, not asserted as "all". Expect **131**, not 57.
- [ ] The mount assertion covers class-based components, not only `sk-*` tagNames (C-005).
- [ ] **Both** deliberate-breakage cases recorded — full blank and partial mount — each with command, exit code and reason string (C-005).
- [ ] Type imports point at `@storybook/web-components`; typecheck passes.
- [ ] The only change to `packages/styles` story files is the type-import line (NFR-003).

## Notes

Any pre-existing `color-contrast` violations (ADR-13 saw two, on `BlogCardExample` and `LightMode`) are **component defects, not migration artifacts**. Report them; do not fix them here and do not let them be mistaken for migration damage. `LightMode` is governed by C-004 — see WP04.
