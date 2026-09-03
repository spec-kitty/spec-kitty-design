---
work_package_id: WP05
title: The states the gate must see, the parts the ratchet must know, and the record
dependencies:
- WP04
requirement_refs:
- FR-006
- FR-007
- FR-008
- FR-010
- FR-011
planning_base_branch: mission/sk-form-field-form-association
merge_target_branch: mission/sk-form-field-form-association
branch_strategy: Planning artifacts for this mission were generated on mission/sk-form-field-form-association. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-form-field-form-association unless the human explicitly redirects the landing branch.
subtasks:
- T014
- T015
- T016
- T017
phase: Phase 5 - Surface
history:
- timestamp: '2026-09-03T11:00:00Z'
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
- expected-parts.json
- scripts/run-axe-storybook.js
- docs/design-system/using-components.md
tags: []
tracker_refs: []
---

# WP05 — The states, the parts, and what gets written down

## Subtasks

- **T014** — Stories per element: `Default`, `Filled`, `Error`, `Disabled`, `LightMode`, plus a
  **named story set** committed to `expected-stories.json`, shrink-only, in the shape of
  `expected-parts.json`.

  Without it SC-206 is vacuous: `run-axe-storybook.js` refuses only a **globally** empty set, so
  one `Default` story reports green over one state — and NFR-003's own sentence names that defect
  and then supplies no mechanism that closes it. The `Error` and `Disabled` stories are the point:
  a component whose only story is its default state has had one of its states tested.

- **T015** — **`@csspart` JSDoc for every part**, or SC-013 and the ratchet stay vacuous for these
  elements. Measured: a prototype shipping eight `part=` attributes left the manifest's
  `cssParts` **empty** for both elements and the ratchet green at the old count of 4 — the
  analyzer populates `cssParts` only from the JSDoc tag, not from the rendered attribute.

  `expected-parts.json` goes 4 → **12** (four parts × two elements), each recorded in the same PR
  as the test that targets it, per the file's own precedent. Note the ratchet's recorded
  looseness: its `::part(name)` source scan is not scoped per element, so one reference anywhere
  in the browser lane satisfies it for both — write the assertions per element regardless.

- **T016** — **The record.** `docs/design-system/using-components.md` documents a
  `<sk-input-field>` and `.sk-field*` classes that exist **nowhere in the repo**, pointing at a
  retired Angular import. It is not frozen (C-004 covers `docs/architecture/validation/**` and
  `docs/learnings/**`, not this), and it is the natural home for what a consumer actually
  composes:

  ```html
  <div class="sk-form-field">
    <sk-form-input name="email" label="Email address" description="We'll never share it.">
    </sk-form-input>
  </div>
  ```

  **Why there is no `sk-form-field` element** goes here too (FR-008): its three accessible
  responsibilities — label, description, error region — all cross a root boundary, and ADR-9 §4
  measured that failing as arrangements C and D. What remains is `display:flex; gap`, which the
  published `.sk-form-field` class already provides.

- **T017** — **WebKit, settled by capability** (FR-010). The evidence is the CI run URL **plus**
  the floor reporter's `browser (webkit)=N` line covering the new files. "Verified in CI" alone is
  free and uninformative: any new file under `fixtures/**/src/` runs on webkit automatically, so
  the claim must name the four callbacks.

  **Firefox is out of scope with the reason recorded** (FR-011): no lane runs form association on
  Firefox at all. `vitest.config.mts` builds `instances` as chromium plus webkit-under-CI;
  Firefox appears only in `playwright.config.ts`, driving the Storybook smoke, which never touches
  `ElementInternals`. Adding an instance is a browser-matrix change with its own floor-reporter
  consequences — filed, not claimed.

## Definition of Done

- axe **zero** across the named story set, error and disabled states included.
- `check-part-ratchet.mjs` green at 12; every part targeted by a literal `::part(name)` in a test.
- SC-211 asserted as the conjunction ADR-9 §4 states it: one element, one state, **submits its
  value AND reports zero axe violations** — SP-5 showed either half can hold without the other.
- `docs/design-system/using-components.md` describes components that exist.
