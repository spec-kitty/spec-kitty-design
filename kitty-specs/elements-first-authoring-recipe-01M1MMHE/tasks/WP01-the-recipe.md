---
work_package_id: WP01
title: The recipe itself — the only doc a new implementer opens
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
planning_base_branch: mission/elements-first-authoring-recipe
merge_target_branch: mission/elements-first-authoring-recipe
branch_strategy: Planning artifacts for this mission were generated on mission/elements-first-authoring-recipe. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-first-authoring-recipe unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 1 - Recipe
history:
- timestamp: '2026-09-04T08:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: docs/contributing/adding-a-component.md
create_intent: []
execution_mode: code_change
owned_files:
- docs/contributing/adding-a-component.md
tags: []
tracker_refs: []
---

# WP01 — The recipe

A prior squad called this *"the only doc a new implementer would open."* Nine components across
#77–#79 will be built from it, so every inaccuracy is multiplied by nine.

**It is in better shape than #76's Intent implies.** It was rewritten for elements-first in #72;
its two Angular references are a dated historical note explaining what changed, and they stay.
What is wrong is what #75 made wrong.

## Subtasks

- **T001 — four packages, not three (FR-001).** The table lists tokens/styles/elements. #126
  added `packages/react`. Say it is **generated and committed**, that `src/` is never hand-edited,
  and that CI fails on drift — a contributor who edits it will otherwise waste a cycle finding out.

- **T002 — the "no wrappers" line, with its reason (FR-002).** It reads *"There are no wrappers.
  ADR-8 confirmation #1 requires that none exist."* True when written; false now.

  **State why, or the next reader concludes an ADR was violated.** ADR-8:108-109 sets two
  confirmations in sequence: #1 is *"one component ships … into three consumption paths … with
  no wrapper package in existence"*, #2 is *"a generated React wrapper … passes the conformance
  matrix"*. #75 discharged #2. Nothing was violated; the recipe froze a moment.

- **T003 — step 7 must name the gates that exist (FR-003).** It names six commands. At least
  fourteen apply, and the missing ones reject precisely what a naïve new component looks like:
  `build-react-wrappers.mjs --check` and `--selftest`, `check-manifest-content.mjs` and its
  `--selftest`, `check-elements-entries.mjs`, `check-adopted-css-boundaries.mjs`,
  `check-element-css-hygiene.mjs`, `check-gate-wiring.mjs`, `typecheck-all.mjs`.

  **Verify each exists before writing it down.** A recipe naming a renamed script is worse than
  one naming none — SC-001.

- **T004 — the three authoring facts (FR-004).** Each cost a review cycle in #75:
  1. Reactive-property and public-method JSDoc is **published API and enforced** —
     `check-manifest-content.mjs` refuses a manifest where any lacks a description, and
     `expected-docs.json` is an exact-equality ratchet, so a new element needs a row there.
  2. `@fires` needs a `{Type}`: without it the React handler's `detail` is untyped. #75's plan
     called that gap "the single sharpest answer to SC-305" before measuring it was one line of
     our own JSDoc.
  3. `@slot` must be declared; the analyzer will not infer it from a rendered `<slot>`.

- **T005 — rationale goes in `//` (FR-005).** #75 moved four members' prose out of doc comments
  after it shipped verbatim into consumer editors, including an 809-character review narrative
  carrying a reference to a getter the wrapper no longer emits. C-005 predicted the mechanism and
  it still happened twice in one mission. The recipe should state it rather than assume it.

- **T006 — the three things no document currently mentions (SC-004).** A new component needs an
  `expected-docs.json` row, a `behaviours.json` subject, and a `typecheck` target with a `scope:`
  tag and a lint target. Without the last, the project sits outside ESLint and module boundaries
  entirely — which is exactly what #126 shipped and #129 had to fix.

## Definition of Done

- The package table matches `packages/` exactly (SC-003).
- Every command in step 7 exists — asserted by running them, not by transcription (SC-001).
- The wrapper correction states the sequencing and that no ADR was violated.
- A reader following only this file knows about the ratchet row, the behaviour subject and the
  typecheck target (SC-004).
