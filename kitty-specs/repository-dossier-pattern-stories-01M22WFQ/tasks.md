# Tasks: Repository Dossier Pattern Stories

**Mission**: `repository-dossier-pattern-stories-01M22WFQ`  
**Input**: `spec.md`, `research.md`, `data-model.md`, `plan.md`  
**Planning base / merge target**: `train/elements-first`

One work package and one PR. The immutable fixtures, truthful projections, complete approved story family, focused behavior/accessibility assertions, registries, documentation, and exact-head visual baselines form one coupled proof. Splitting them would create an incomplete or unverified intermediate public example and repeated edits to shared Storybook registries.

## Subtask Index

| ID | Description | Requirements | Parallel |
|---|---|---|---|
| T001 | Write a focused failing contract for the missing story family, exact required state inventory, public-surface inventory, and forbidden abstractions | FR-001-FR-015, C-001-C-006 | |
| T002 | Author deeply frozen fixture types, one source per state, pure projections, and invariant checks for repeated truth and omissions | FR-003-FR-007, FR-011, FR-012, FR-014, C-006-C-010 | |
| T003 | Compose D1 populated desktop and D2 narrow closed/open using public shell/navigation/components and native semantics | FR-001, FR-002, FR-009, FR-010, C-001-C-005 | |
| T004 | Compose D4 cross-branch and D6 affected-mission snapshot without truth inference or a new status wrapper | FR-003, FR-005, FR-011, FR-012 | |
| T005 | Compose truthful D5 terminal not-Spec-Kitty, D7 indexing, and D8 completed-empty states with required omissions | FR-004, FR-006, FR-007, C-006-C-009 | |
| T006 | Add LightMode, long-data, threshold-edge, 390 px, 200%/400% zoom, forced-colors, and reduced-motion proofs | FR-008, FR-013, FR-014, NFR-003-NFR-005, NFR-009 | |
| T007 | Register every story, document pattern/application ownership, and keep all public distributions unchanged | FR-015, NFR-008, C-001-C-004 | |
| T008 | Complete focused Chromium/Firefox, copy/drawer, native semantics, axe, and fixture-consistency evidence | FR-002-FR-014, NFR-001-NFR-005 | |
| T009 | Register and generate visual baselines, compare D1/D2/D4-D8 individually and across the family, and record fidelity findings | NFR-006, NFR-009, SC-011 | |
| T010 | Run composition, generated-artifact, mutation, lint, type, build, Storybook, axe, visual, package, size, and security gates | NFR-001-NFR-009, SC-008-SC-010 | |
| T011 | Fetch/rebase onto latest train, regenerate from source, rerun every applicable gate on the exact head, and prepare independent Codex review evidence | NFR-006-NFR-009, C-010-C-012 | |

No implementation subtasks are parallel: T001 precedes authored implementation; T002 is the source for T003-T006; T007-T010 require the complete family; T011 is the final integration cut. Independent Codex review may run only after that exact head is frozen.

## Work Packages

### WP01 — Prove the complete Repository Dossier family from public surfaces

- **Goal**: publish the approved Repository Dossier states as accessible, discoverable Storybook pattern stories composed solely from current public surfaces, native semantics, immutable fixtures, and pure projections.
- **Priority**: P0 — this is issue #255's complete deliverable and the last child of epic #253.
- **Independent test**: the focused Storybook suite proves every registered state, fixture invariant, conditional omission, controlled drawer behavior, exact copying, native semantics, responsive/zoom containment, and preference/theme condition; axe, visual, mutation, composition, generated, build, and package gates pass after latest-train rebase.
- **Included subtasks**: T001-T011.
- **Dependencies**: external public contracts #150, #176-#178, #210, #212-#214, #254, #256, and #257 are merged into `train/elements-first`; no internal dependency.
- **Estimated prompt size**: large — one integrated pattern family plus broad executable and visual proof.
- **Risks**: duplicate fixture literals can drift; page-like markup can become a private abstraction; mutable mocks can smuggle application behavior; stale baselines can certify an older head. Frozen fixtures, pure projections, composition gates, exact-head review, and final rebase/regeneration mitigate those risks.

## Parallelization

None during implementation. An independent Codex review seat evaluates the frozen final head and returns structured findings before acceptance.

## MVP Scope

The entire work package. Omitting any approved D1, D2, or D4-D8 state, the required LightMode proof, exact copy/drawer behavior, truth/omission invariant, resilience condition, or final visual/gate evidence fails the live issue contract.
