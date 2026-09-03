---
work_package_id: WP04
title: Two distribution artifacts, and proof each is consumable
dependencies:
- WP03
requirement_refs:
- FR-003
- FR-004
- NFR-001
planning_base_branch: mission/elements-package-foundation
merge_target_branch: mission/elements-package-foundation
branch_strategy: Planning artifacts for this mission were generated on mission/elements-package-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-package-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T011
- T012
- T013
- T014
phase: Phase 4 - Distribution
history:
- timestamp: '2026-09-03T00:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: fixtures/vite-consumer/
create_intent:
- fixtures/vite-consumer/**
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- apps/storybook/src/tests/elements-load.spec.ts
execution_mode: code_change
owned_files:
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- fixtures/vite-consumer/**
- apps/storybook/src/tests/elements-load.spec.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP04 – Distribution artifacts

Implements IC-03.

## Subtasks

- **T011** — esbuild via `nx:run-commands` (mirroring `packages/tokens`): ESM with `lit` **external** → `dist/index.js`; IIFE with the runtime bundled → `dist/elements.js`. **The paths are ADR-10 §2's and are not negotiable** — #71, #72 and #82 all import them.
- **T012** — A Vite fixture at `fixtures/vite-consumer/` importing the ESM artifact. Without it **nothing ever consumes FR-003's output** and "lit is external" is only checkable statically.
- **T013** — A Playwright spec loading the IIFE from `file://`, and over HTTP with an `integrity` attribute.
- **T014** — Record artifact sizes as **raw / minified / minified+gzip**.

## Definition of Done

- [ ] Both artifacts emit at the ADR-10 §2 paths (SC-009).
- [ ] The IIFE upgrades an element from a `file://` page with no server and no bundler (SC-001).
- [ ] Served over HTTP with a **matching** `integrity` hash it executes; with a **wrong** one the browser refuses it. A literal CDN load is **#80's** — all three package names 404 on npm — and `file://` cannot exercise SRI at all.
- [ ] The Vite fixture builds and the element upgrades in it (SC-008).
- [ ] Sizes recorded with **all three bases stated** (NFR-001).

## Notes on NFR-001 — read before recording anything

An earlier draft recorded **minified** figures labelled "raw" and concluded from them that ADR-10's measurement was wrong. That was inverted. Re-measured on a representative stub:

```
IIFE   raw 22.8 KB · minified 15.2 KB · min+gzip 5.9 KB
ESM    raw  1.0 KB
```

ADR-10 §2's "~26 KB for one component including the runtime" ≈ **unminified raw**. ADR-8's "~6 KB Lit runtime" ≈ **minified+gzip**. **The ADRs never disagreed — the basis was missing.** Record all three columns so the batch missions inherit a baseline that means something.

**Verified buildable:** ESM 1,019 B with `lit` external, IIFE 23.3 KB, zero bare specifiers beyond `lit`, zero `import.meta`, zero `require()`.
