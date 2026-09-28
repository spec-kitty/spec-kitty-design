# Tasks: Desktop V2 primitive contract and offline handoff tooling

**Mission**: `desktop-v2-immutable-handoff-develop-01M3JSCM`  
**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md)  
**Planning base and merge target**: `develop`  
**Delivery**: two independently reviewable Spec Kitty work packages, consolidated into one mission-wide PR to `develop` under its rebase-only ruleset.

## Subtask index

| ID | Work | WP | Requirements |
|---|---|---|---|
| T001 | Inventory exactly 22 families against current `develop`, recording styles/element form, public entry, source path and relevant token/asset closure. | WP01 | FR-001, FR-003, C-001, C-002 |
| T002 | Author versioned consumer contract with state/theme/responsive story IDs, a11y and visual evidence references, license basis per source/asset, and explicit rights/coverage gaps. | WP01 | FR-002, FR-003, FR-007, NFR-003, NFR-004 |
| T003 | Close required evidence gaps through existing Storybook, component test and visual paths; keep neutral navigation as token composition and the file/presence tree Desktop-owned. | WP01 | FR-002, FR-007, FR-009, C-002, C-003 |
| T004 | Add a machine check that rejects family-set, source, story, evidence and license drift; run native quality gates and submit WP01 for independent Spec Kitty review. | WP01 | FR-001–FR-003, FR-007, NFR-003–NFR-005 |
| T005 | Implement deterministic export from checked contract and actual transitive, rights-cleared source closure, with normalized paths, SHA-256 per file, full committed source SHA and canonical artifact digest. | WP02 | FR-003–FR-005, FR-008, NFR-001, NFR-004 |
| T006 | Implement copied-artifact offline verifier that rejects altered contract/file bytes, missing/extra files, path substitutions, stale evidence and unlicensed assets. | WP02 | FR-004–FR-006, FR-008, NFR-002–NFR-004 |
| T007 | Add focused repeatability and tamper tests; wire export check into existing quality workflow and document exact local invocation. | WP02 | FR-005–FR-007, NFR-001–NFR-005, C-004 |
| T008 | Run native gates and submit WP02 for independent Spec Kitty review; after both WPs are approved, prepare one aggregate mission PR to `develop`. | WP02 | FR-007, C-001 |

## Work packages

### WP01 — Source contract and evidence

**Goal**: a checked 22-family contract with actual source forms, rights and state/accessibility/visual evidence. **Independent review**: the contract check fails on a removed family, missing source/evidence, changed story ID, or unlicensed referenced asset; native gates pass for source/story changes. **Owned files**: `contracts/desktop-v2/**`, `scripts/check-desktop-v2-contract.mjs`, matching family source/story/test files touched for proven gaps, and their visual baselines. **Depends on**: none. This is a Spec Kitty lane review, not a separate PR.

### WP02 — Deterministic offline exporter and verifier

**Goal**: repeatable payload and manifest with a copied-artifact verifier that detects consumer-contract drift without network or registry access. **Independent review**: two exports of the same source SHA are byte-identical; a clean detached copy verifies; mutated, missing, extra and substituted files and changed contract fields fail with named diagnostics. **Owned files**: exporter/verifier scripts, focused Node tests, and existing CI quality wiring only. **Depends on: WP01** approval. This is a Spec Kitty lane review, not a separate PR.

## Mission PR and downstream handoff

After WP01 and WP02 are approved, consolidate their lanes through the Spec Kitty mission workflow and submit one reviewed PR to `develop`. Run and record lint, test, build, Storybook, axe, visual and export gates on the actual PR head; obey the branch's rebase-only merge rule and matching-head review evidence. Do not select final source SHA S before this mission's PR lands.

A second focused Spec Kitty mission depends on this merge. It will select stable post-merge `develop` SHA S, repeat all required gates at S, export and verify the final in-repository artifact, and submit its own reviewed PR. That downstream mission is deliberately not a WP in this task set; issue #470 remains open until its handoff is complete. The old train branch and approved prototype are reference material only, never merge input.
