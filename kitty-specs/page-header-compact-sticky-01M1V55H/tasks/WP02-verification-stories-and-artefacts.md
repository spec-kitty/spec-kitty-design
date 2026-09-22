---
work_package_id: WP02
title: Verification, stories, docs and generated artefacts
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-009
- FR-010
- FR-011
- FR-012
- NFR-001
- NFR-002
- NFR-003
- C-001
- C-002
- C-003
- C-004
planning_base_branch: mission/page-header-compact-sticky
merge_target_branch: mission/page-header-compact-sticky
branch_strategy: Planning artifacts for this mission were generated on mission/page-header-compact-sticky. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/page-header-compact-sticky unless the human explicitly redirects the landing branch.
subtasks:
- T008
- T009
- T010
- T011
- T012
- T013
- T014
- T015
phase: Phase 2 - verification and artefacts
history:
- at: '2026-09-06T11:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: fixtures/elements-behaviour/src/sk-page-header.test.ts
create_intent: []
execution_mode: planning_artifact
model: ''
owned_files:
- fixtures/elements-behaviour/src/sk-page-header.test.ts
- behaviours.json
- mutations.json
- expected-docs.json
- expected-stories.json
- packages/elements/src/page-header/sk-page-header.stories.ts
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/react/src/SkPageHeader.js
- packages/react/src/SkPageHeader.d.ts
- docs/design-system/using-components.md
role: implementer
tags: []
task_type: feature
tracker_refs:
- spec-kitty/spec-kitty-design#182
---

# Work Package Prompt: WP02 – Verification, stories, docs and generated artefacts

## Goal

Make every requirement in `spec.md` checkable by something that can go red, and leave no generated
artefact stale.

## What to build

1. **Behaviour tests (T008).** Four-combination orthogonality, each axis observed by something the
   other does not touch. Attribute→property and property→attribute for both axes. A `[SC-010]` test
   for pre-upgrade assignment surviving and reflecting. The narrow reflow: metadata follows text,
   the slotted action keeps a non-zero box and takes focus, the sync text truncates rather than
   disappearing. The sticky drop measured **live** at the lane's 414px viewport, plus
   `declarationIn` reads of both drop blocks, the reduced-motion block and the forced-colors block —
   the sheet-read half exists because a viewport resize does not re-evaluate a media block inside an
   adopted constructed stylesheet in WebKit, which `sk-grid.test.ts` records CI proving twice.
2. **The no-timer guard (T009).** Two halves. Static: import the element source with `?raw`, strip
   block and line comments, assert none of `setInterval`, `setTimeout`, `requestAnimationFrame`,
   `Date`, `performance.now`, `IntersectionObserver`, `ResizeObserver`, `MutationObserver` or a
   scroll listener remains — and separately assert the stripped source still contains
   `class SkPageHeader`, so an over-eager strip cannot pass vacuously. Dynamic: extend the existing
   spy test to the compact sticky configuration.
3. **Registry and mutations (T010).** Add `sk-page-header` as an SC-010 subject and two
   `mutations.json` arms — one per axis, each flipping `reflect: true` to `reflect: false` — whose
   named `[SC-010]` red is in this file and whose collateral is empty. Do **not** mint a new `SC-`
   id: `tests/node/config-contract.test.ts` asserts the applicable set equals ADR-11's list.
4. **Stories (T011).** Compact beside default from the same slot content; a sticky compact header
   over a long scrolling fixture; the narrow reflow; the short-viewport drop; verbatim sync text
   with a slotted status element; long title and long metadata truncating; and `LightMode` wrapped
   in `class="sk-light"` — never `data-theme`.
5. **The contract, documented once (T012).** In `docs/design-system/using-components.md`: the
   scroll-margin token consumers apply to their own focusable content, its derivation, its stated
   residual, and the scroll-container agreement between the shell and the header — on the header,
   in one place.
6. **Ratchets (T013).** `expected-docs.json` is exact-equality in both directions; add the two
   attributes and bump `total`. `expected-stories.json` gains the new ids and its `total`.
   `expected-parts.json` must be unchanged.
7. **Generated artefacts (T014).** Build first, then measure: `measure-elements-sizes.mjs` reads
   `dist/` and never builds it. Pass `--skip-nx-cache` to every nx target before a `--check`, or nx
   serves the cached output and the check compares a stale artefact with itself. Then run the
   recipe's step-7 list in full.
8. **The registry gap (T015).** File an issue recording that the behaviour registry has no id for a
   responsive/threshold behaviour — with the two constraints measured (`config-contract.test.ts:48`
   and `suite-selftest.mjs` guard 7) — and record the number in the PR body.

## Independent test

`npm run test` green; `node scripts/suite-selftest.mjs` reports every mutation's named red with a
green baseline and stays under `selftestCeilingSeconds`; the recipe's step-7 gates pass;
`git status --porcelain` empty after regeneration.
