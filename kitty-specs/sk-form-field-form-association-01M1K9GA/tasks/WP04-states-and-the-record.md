---
work_package_id: WP04
title: The states the gate must see, and the record
dependencies:
- WP03
requirement_refs:
- FR-007
- FR-008
- FR-010
- FR-011
- NFR-003
planning_base_branch: mission/sk-form-field-form-association
merge_target_branch: mission/sk-form-field-form-association
branch_strategy: Planning artifacts for this mission were generated on mission/sk-form-field-form-association. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-form-field-form-association unless the human explicitly redirects the landing branch.
subtasks:
- T013
- T014
- T015
phase: Phase 4 - Surface
history:
- timestamp: '2026-09-03T12:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/form-input/sk-form-input.stories.ts
create_intent:
- packages/elements/src/form-input/sk-form-input.stories.ts
- packages/elements/src/form-textarea/sk-form-textarea.stories.ts
- expected-stories.json
execution_mode: code_change
owned_files:
- packages/elements/src/form-input/sk-form-input.stories.ts
- packages/elements/src/form-textarea/sk-form-textarea.stories.ts
- expected-stories.json
- scripts/run-axe-storybook.js
- .github/workflows/ci-quality.yml
- docs/design-system/using-components.md
tags: []
tracker_refs: []
---

# WP04 — The states, and what gets written down

## Subtasks

- **T013** — Stories per element: `Default`, `Filled`, `Error`, `Disabled`, `LightMode`, plus a
  **named set** committed to `expected-stories.json`, shrink-only, in the shape of
  `expected-parts.json`, enforced by `run-axe-storybook.js` and wired into CI.

  Without it SC-206 is vacuous: the gate refuses only a **globally** empty set, so one `Default`
  story reports green over one state — and NFR-003's own sentence names that defect and then
  supplies no mechanism that closes it. The `Error` and `Disabled` stories are the point.

- **T014** — **The record.** `docs/design-system/using-components.md` documents a
  `<sk-input-field>` and `.sk-field*` classes that exist **nowhere in the repo**, pointing at a
  retired Angular import. Not frozen by C-004, and the natural home for what a consumer composes:

  ```html
  <div class="sk-form-field">
    <sk-form-input name="email" label="Email address" description="We'll never share it.">
    </sk-form-input>
  </div>
  ```

  **Why there is no `sk-form-field` element** goes here (FR-008): its three accessible
  responsibilities all cross a root boundary, and ADR-9 §4 measured that failing as arrangements
  C and D. What remains is `display:flex; gap`, which the published `.sk-form-field` class
  already provides — which is also why FR-007 leaves that class in place.

- **T015** — **WebKit, settled by capability** (FR-010): the CI run URL **plus** the floor
  reporter's `browser (webkit)=N` line covering the new files. "Verified in CI" alone is free —
  any new file under `fixtures/**/src/` runs on webkit automatically, so the claim must name the
  four callbacks.

  **Firefox out of scope, reason recorded** (FR-011): no lane runs form association on Firefox.
  `vitest.config.mts` builds chromium plus webkit-under-CI; Firefox appears only in
  `playwright.config.ts`, driving the Storybook smoke, which never touches `ElementInternals`.
  Filed, not claimed.

## Definition of Done

- axe **zero** across the named story set, error and disabled states included, and the
  expected-stories check fails when a named story is removed — demonstrated.
- `docs/design-system/using-components.md` describes components that exist.
- The PR names the WebKit evidence, and the Firefox follow-up issue exists.
