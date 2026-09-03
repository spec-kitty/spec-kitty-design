---
work_package_id: WP05
title: Guarded define AND the manifest — designed together, because one breaks the other
dependencies:
- WP03
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
authoritative_surface: packages/elements/custom-elements.json
create_intent:
- packages/elements/custom-elements-manifest.config.mjs
- packages/elements/custom-elements.json
execution_mode: code_change
owned_files:
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

- [x] **T015** — *(moved)* `src/define.ts` is authored in **WP02**, because WP03's element and WP04's IIFE both need it before this WP runs; its runtime behaviour is asserted in **WP04**, where the artifacts exist. This WP keeps the half that cannot move: the manifest, and the collision below.
- [x] **T016** — CEM analyzer config and an `analyze` target; commit `custom-elements.json`; add a CI regeneration check (it is a generated artifact under ADR-10's contract).
- [x] **T017** — Resolve the collision. Either mandatory `@element <tag>` JSDoc **plus** an assertion that the manifest contains no `custom-element-definition` named `tag`, or a CEM plugin that follows the guarded helper. State which and why.

## Definition of Done

- [x] *(FR-005 / SC-003 assertion moved to WP04, which owns the spec, the `staticDirs` entry and the artifacts. This WP no longer claims evidence it cannot produce.)*
- [x] `custom-elements.json` describes `sk-stub` **by its real tag name** (FR-006, SC-004).
- [x] The manifest contains **no** definition named `tag` — asserted, not eyeballed.
- [x] The regeneration check fails when the manifest drifts from source.

## Notes

FR-006 and SC-004 had **no owner at all** in the first plan draft — zero occurrences. Since `tasks` slices work packages from the concern map, that would have produced no CEM work package and two acceptance-matrix rows nothing satisfies. Two squads found it independently.
