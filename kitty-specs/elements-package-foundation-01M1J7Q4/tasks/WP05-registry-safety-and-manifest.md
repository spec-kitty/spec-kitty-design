---
work_package_id: WP05
title: Guarded define AND the manifest — designed together, because one breaks the other
dependencies:
- WP02
requirement_refs:
- FR-005
- FR-006
planning_base_branch: mission/elements-package-foundation
merge_target_branch: mission/elements-package-foundation
branch_strategy: Planning artifacts for this mission were generated on mission/elements-package-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-package-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T015
- T016
- T017
phase: Phase 5 - Registry and manifest
history:
- timestamp: '2026-09-03T00:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/define.ts
create_intent:
- packages/elements/src/define.ts
- packages/elements/custom-elements-manifest.config.mjs
- packages/elements/custom-elements.json
execution_mode: code_change
owned_files:
- packages/elements/src/define.ts
- packages/elements/custom-elements-manifest.config.mjs
- packages/elements/custom-elements.json
tags: []
tracker_refs: []
---

# Work Package Prompt: WP05 – Guarded define and the Custom Elements Manifest

Implements IC-04 and IC-06. **They are one work package because ADR-10 §5 silently breaks ADR-11.**

## The collision, measured not predicted

The guarded `define()` ADR-10 §5 requires is exactly the indirection the CEM analyzer cannot follow. Analyzer 0.11.0, three variants:

| registration | class `tagName` | manifest |
|---|---|---|
| `customElements.define('sk-stub', SkStub)` | `sk-stub` | `name: "sk-stub"` → `SkStub` ✅ |
| `define('sk-stub', SkStub)` (ADR-10 §5) | **`undefined`** | no definition on the element; `define.ts` emits one literally named **`tag`** |
| guarded + `@element sk-stub` JSDoc | `sk-stub` | still none on the element; the bogus `tag` entry remains |

So `custom-elements.json` would ship an element called `tag`, and SC-004 would pass only by JSDoc annotation.

**This is not local.** ADR-11 generates the React wrapper **from this manifest**, and ADR-9 confirmation #2 verifies `::part()` through it. A wrong manifest propagates into generated code two missions from now.

## Subtasks

- **T015** — `src/define.ts`: warn and no-op on a duplicate tag rather than throw (ADR-10 §5).
- **T016** — CEM analyzer config and an `analyze` target; commit `custom-elements.json`; add a CI regeneration check (it is a generated artifact under ADR-10's contract).
- **T017** — Resolve the collision. Either mandatory `@element <tag>` JSDoc **plus** an assertion that the manifest contains no `custom-element-definition` named `tag`, or a CEM plugin that follows the guarded helper. State which and why.

## Definition of Done

- [ ] Loading both artifacts on one page **warns and does not throw** (FR-005, SC-003) — bound to the Playwright job, not "demonstrated" by hand. `playwright.config.ts` serves only `storybook-static`, so this needs a `staticDirs` entry or a `page.goto('file://…')` spec.
- [ ] `custom-elements.json` describes `sk-stub` **by its real tag name** (FR-006, SC-004).
- [ ] The manifest contains **no** definition named `tag` — asserted, not eyeballed.
- [ ] The regeneration check fails when the manifest drifts from source.

## Notes

FR-006 and SC-004 had **no owner at all** in the first plan draft — zero occurrences. Since `tasks` slices work packages from the concern map, that would have produced no CEM work package and two acceptance-matrix rows nothing satisfies. Two squads found it independently.
