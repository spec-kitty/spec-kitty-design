---
work_package_id: WP07
title: Conformance matrix across surfaces (P2 — blocked on an operator ruling)
dependencies:
- WP03
requirement_refs:
- FR-012
planning_base_branch: mission/elements-verification-harness
merge_target_branch: mission/elements-verification-harness
branch_strategy: Planning artifacts for this mission were generated on mission/elements-verification-harness. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-verification-harness unless the human explicitly redirects the landing branch.
subtasks:
- T018
- T019
phase: Phase 5 - Matrix
history:
- timestamp: '2026-09-03T02:30:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: conformance-matrix.json
create_intent:
- scripts/build-conformance-matrix.mjs
- conformance-matrix.json
execution_mode: code_change
owned_files:
- scripts/build-conformance-matrix.mjs
- conformance-matrix.json
tags: []
tracker_refs: []
---

# WP07 — Conformance matrix *(P2 — do not start without an operator ruling)*

**This package is blocked on operator question 2**, posted on #71 and unanswered. It is
listed so the mission's shape is honest, not so it is picked up by default.

## Why it is separable, and what it costs

Its only consumer is **#75**, two missions out. It carries the mission's only new-dependency
supply-chain review and its only lockfile edit that collides with WP01's.

The Svelte cost was unpriced in the first spec and is real: `fixtures/vite-consumer/` is
plain Vite + vanilla JS, and **Svelte appears nowhere in this repository outside ADR
prose**. FR-012 needs `svelte` and `@sveltejs/vite-plugin-svelte` as new dependencies, a
new nx project, and a CI build step — landing in the same PR as the repository's first test
runner.

## Provenance, recorded so it stops propagating

The matrix is attributed to ADR-11 by issue #71 and by
`docs/architecture/elements-first-programme.md:193`. **ADR-11 contains no conformance
matrix and does not mention Svelte.** The four surfaces trace to ADR-8 Confirmation #1.

## It is only droppable because FR-010 was rewritten

FR-010's not-applicable escape hatch *was* this matrix's cell — so dropping this package
would have left FR-010 referencing an artifact that does not exist. FR-010 now stands
alone: **zero skips, full stop**, and a behaviour with no applicable subject is simply not
in `behaviours.json`. Do not re-introduce the dependency.

## Subtasks

- **T018** — `scripts/build-conformance-matrix.mjs` emitting a committed
  `conformance-matrix.json`: rows from `behaviours.json`, columns per surface, each cell an
  explicit enum `{pass, fail, reserved, not-applicable, untested}`. "Reserved" and "passed"
  are indistinguishable in every stock reporter summary — that is why the artifact exists.
- **T019** — The three guards: refuse an all-reserved or all-not-applicable matrix; assert
  `cells == surfaces × behaviours` so a dropped row is silence no longer; assert the
  reserved **set** equals a committed expected set, so a surface silently becoming reserved
  is a failure rather than a rename.

## Definition of Done

- [ ] The matrix runs against the bundler-free page and Storybook; the React column is
      `reserved` and cannot read as a pass.
- [ ] All three guards demonstrated red-first.
- [ ] The Svelte dependencies carry a DIRECTIVE_051 supply-chain review, or the Svelte
      column is `reserved` too and the dependency is not added.
- [ ] It is stated whether this matrix **subsumes or duplicates**
      `apps/storybook/src/tests/elements-load.spec.ts`, which already exercises the
      bundler-free, HTTP+SRI, duplicate-registration and Vite-consumer surfaces under
      Playwright across three engines.
