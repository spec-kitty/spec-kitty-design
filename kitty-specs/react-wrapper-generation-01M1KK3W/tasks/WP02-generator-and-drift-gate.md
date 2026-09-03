---
work_package_id: WP02
title: The generator, the tagName filter, and a drift gate that refuses an empty set
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- NFR-001
- NFR-002
planning_base_branch: mission/react-wrapper-generation
merge_target_branch: mission/react-wrapper-generation
branch_strategy: Planning artifacts for this mission were generated on mission/react-wrapper-generation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/react-wrapper-generation unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
phase: Phase 2 - Generator
history:
- timestamp: '2026-09-03T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: scripts/build-react-wrappers.mjs
create_intent:
- scripts/build-react-wrappers.mjs
- packages/react/package.json
execution_mode: code_change
owned_files:
- scripts/build-react-wrappers.mjs
- packages/react/package.json
- package.json
- package-lock.json
- .github/workflows/ci-quality.yml
- scripts/check-gate-wiring.mjs
tags: []
tracker_refs: []
---

# WP02 — Generate, commit, gate on drift

Same contract as `build-elements-css.mjs` and `build-element-markup.mjs`: generated output is
committed, and `--check` fails CI on drift.

## Subtasks

- **T004** — `scripts/build-react-wrappers.mjs`, wrapping
  `generateReactWrappers(manifest, { outdir, modulePath })`. Pin `@wc-toolkit/react-wrappers`
  at **1.2.7** directly rather than relying on a transitive resolution — the
  `require('playwright')` finding from #70 is the precedent.

- **T005** — **FILTER ON `tagName`, AND ASSERT THE FILTER.** The spike emitted
  `out/FormControlBase.d.ts`: a full `ForwardRefExoticComponent` for an abstract class with no
  tag name, importing a symbol that cannot be registered. Junk that would ship.

  A config option that silently stops filtering is this programme's recurring shape, so the
  assertion is: the emitted file set equals the manifest's `tagName`-bearing declarations,
  compared as sets. Not "FormControlBase is absent" — that is a denylist and the next
  non-element declaration escapes it.

- **T006** — `--check` and the CI step, with **an empty-set floor**. The generator writes a
  DIRECTORY, so `--check` compares a tree rather than two files, and a generator that emits
  nothing must fail rather than report no drift. Add the step to `check-gate-wiring.mjs`'s
  `REQUIRED_LINT` **in the same commit** — #74 shipped a gate without an entry there and a lens
  deleted both its CI lines with the wiring checker still green.

  Determinism is already established: the spike ran the generator twice and `diff -rq` reported
  byte-identical output. FR-003 asserts it rather than hoping for it.

## Definition of Done

- `node scripts/build-react-wrappers.mjs --check` green; drift fails, demonstrated.
- Hand-editing a generated file fails CI, demonstrated.
- The emitted set equals the manifest's tagged declarations, asserted as sets.
- An empty manifest, or a generator emitting nothing, fails.
- `check-gate-wiring.mjs` names the new step.
- React is a devDependency of `packages/react` only — never of `@spec-kitty/elements` (NFR-003).
