---
work_package_id: WP04
title: Two distribution artifacts, and proof each is consumable
dependencies:
- WP05
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
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- packages/elements/SIZES.md
- fixtures/vite-consumer/**
- apps/storybook/src/tests/elements-load.spec.ts
execution_mode: code_change
owned_files:
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- packages/elements/SIZES.md
- fixtures/vite-consumer/**
- apps/storybook/src/tests/elements-load.spec.ts
- apps/storybook/.storybook/main.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP04 – Distribution artifacts

Implements IC-03.

## Subtasks

- **T011** — esbuild via `nx:run-commands` (mirroring `packages/tokens`): ESM with `lit` **external** → `dist/index.js`; IIFE with the runtime bundled → `dist/elements.js`. **The paths are ADR-10 §2's and are not negotiable** — #71, #72 and #82 all import them.
- **T012** — A Vite fixture at `fixtures/vite-consumer/` importing the ESM artifact. Without it **nothing ever consumes FR-003's output** and "lit is external" is only checkable statically.
- **T013** — A Playwright spec loading the IIFE from `file://`, and over HTTP with an `integrity` attribute.
- **T014** — Record artifact sizes as **raw / minified / minified+gzip** into `packages/elements/SIZES.md`, **committing the measuring command and its raw output**. A baseline that lives only in a PR body is not inheritable, and this WP prompt hands you numbers — copying them satisfies nothing.
- **T015** — Add `apps/storybook/src/tests/elements-load.spec.ts` **and wire it into CI**. `ci-quality.yml:240,246` runs two *named* spec files, not `testDir` — an unlisted spec never executes. Getting the IIFE served needs a `staticDirs` entry in `apps/storybook/.storybook/main.ts` (owned here) since `playwright.config.ts`'s webServer serves only `storybook-static`.
- **T016** — Assert **FR-005 / SC-003** here: load both artifacts on one page, confirm a warning and no throw. `define.ts` is WP02's; the artifacts that exercise it are this WP's.

## Definition of Done

- [ ] Both artifacts emit at the ADR-10 §2 paths (SC-009).
- [ ] The IIFE upgrades an element from a `file://` page with no server and no bundler (SC-001).
- [ ] Served over HTTP with a **matching** `integrity` hash it executes; with a **wrong** one the browser refuses it. A literal CDN load is **#80's** — all three package names 404 on npm — and `file://` cannot exercise SRI at all.
- [ ] The Vite fixture builds and the element upgrades in it (SC-008).
- [ ] Sizes in `packages/elements/SIZES.md` with all three bases and the measuring command's raw output (NFR-001).
- [ ] `elements-load.spec.ts` is named in `ci-quality.yml`'s playwright step and **executes in CI** — not a local transcript.
- [ ] Loading both artifacts on one page warns and does not throw (FR-005, SC-003).
- [ ] ADR-10 Confirmation #1's pair re-asserted **against both built artifacts**: `adoptedStyleSheets.length === 1`, `shadowRoot.querySelectorAll('style').length === 0`.
- [ ] `sk-stub` renders **in Storybook** as well as in the Vite fixture — SC-008 and #70 exit criterion 2 require both halves.

## Notes on NFR-001 — read before recording anything

An earlier draft recorded **minified** figures labelled "raw" and concluded from them that ADR-10's measurement was wrong. That was inverted. Re-measured on a representative stub:

Measured independently three times; use these, and record your own build's numbers alongside:

```
stub element   IIFE raw 24.0 KB · minified 15.9 KB · min+gzip 6.1 KB   ESM raw 1.2 KB
sk-card        IIFE raw 26.6 KB                                        ESM raw 3.7 KB
```

**A lens settled the ADR reconciliation by rebuilding on `sk-card` — the component ADR-10's SP-3 spike actually used.** ADR-10 §2's *two* figures, "3.2 KB" ESM and "26 KB" IIFE, both match **unminified raw on `sk-card`** (3.7 KB / 26.6 KB). ADR-8's "~6 KB runtime" ≈ **min+gzip**. That also explains the ESM 3.2-vs-1.2 KB gap an earlier draft never accounted for: different component, same basis. Raw size tracks the component's CSS byte count almost 1:1 (stub 420 B css → 24.0 KB; card 3,204 B css → 26.6 KB).

ADR-10 §2's "~26 KB for one component including the runtime" ≈ **unminified raw**. ADR-8's "~6 KB Lit runtime" ≈ **minified+gzip**. **The ADRs never disagreed — the basis was missing.** Record all three columns so the batch missions inherit a baseline that means something.

**Verified buildable:** `lit` is the sole external import in the ESM artifact; the IIFE has zero bare specifiers, zero `import.meta`, zero `require()`. (An earlier draft of this WP quoted two different raw IIFE figures, 22.8 KB and 23.3 KB, for the same artifact — both were superseded by the table above.)
