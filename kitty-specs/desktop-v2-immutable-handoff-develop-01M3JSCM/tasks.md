# Tasks: Desktop V2 primitive contract and offline handoff tooling

**Mission**: `desktop-v2-immutable-handoff-develop-01M3JSCM`  
**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md)  
**Planning base and merge target**: `develop`  
**Delivery**: two independently reviewable Spec Kitty work packages, consolidated into one mission-wide PR to `develop` under its rebase-only ruleset.

## Subtask index

| ID | Work | WP | Requirements |
|---|---|---|---|
| T001 | Inventory exactly 22 families against current `develop`, recording styles/element form, public entry, source path and relevant token/asset closure. | WP01 | FR-001, FR-003, C-001, C-002 |
| T002 | Declare required states independently for every family; author a SHA-independent source contract mapping each required state to story, visual test and committed snapshot, plus source/asset rights and coverage gaps. | WP01 | FR-002, FR-003, FR-007, FR-008, NFR-003, NFR-004 |
| T003 | Close Storybook, component-test, axe and visual gaps; persist per-story axe outcomes, visual mappings, positive test count and tested SHA in post-source PR evidence, never in the source contract. Keep neutral navigation as token composition and the file/presence tree Desktop-owned. | WP01 | FR-002, FR-007, FR-009, C-002, C-003 |
| T004 | Check family set, independent required states, story→visual-test→snapshot mappings, source closure and rights; prove family/state/story deletion failures. Run affected gates and submit WP01 for independent review. | WP01 | FR-001–FR-003, FR-007, NFR-003–NFR-005 |
| T005 | Export committed Git blobs at a selected full SHA, rejecting dirty included files and unnoticed mid-export mutation; enumerate rights-cleared closure, normalized paths, hashes and a post-source manifest/digest. Block unchanged full `tokens.css` while Swansea rights are unresolved; permit only a verified source-mapped scoped derivative. | WP02 | FR-003–FR-005, FR-008, NFR-001, NFR-004 |
| T006 | Implement copied-artifact offline verification in honest internal-integrity and independently pinned approved-source modes. Reject ordinary mutations and coordinated manifest/contract/payload rehash against caller-supplied SHA/digest. | WP02 | FR-004–FR-006, FR-008, NFR-002–NFR-004 |
| T007 | Test repeatability, dirty-file and mid-export races, path/rights failures and coordinated rehash; include `contracts/desktop-v2/**` in the existing components CI filter, wire contract/export checks into existing relevant quality jobs, and document exact local seven-gate commands. | WP02 | FR-005–FR-007, NFR-001–NFR-005, C-004 |
| T008 | Run seven native gates at the actual PR head, with a positive visual-test count and persistent per-story axe/visual evidence; submit WP02 for independent review and then prepare one aggregate PR to `develop`. | WP02 | FR-007, C-001 |

## Work packages

### WP01 — Source contract and evidence

**Goal**: a SHA-independent, checked 22-family contract with actual source forms, rights and independently required states. **Independent review**: the contract check fails on a removed family or required state, deleted story, missing source/mapping, or unlicensed referenced asset; per-story axe and visual results with tested SHA are retained outside the source contract. **Owned files**: `contracts/desktop-v2/**`, `scripts/check-desktop-v2-contract.mjs`, `tests/node/desktop-v2-contract.test.ts`, matching family source/story/test files touched for proven gaps, and their visual baselines. **Depends on**: none. This is a Spec Kitty lane review, not a separate PR.

### WP02 — Deterministic offline exporter and verifier

**Goal**: repeatable committed-byte payload and post-source manifest with a copied-artifact verifier that checks internal integrity offline and approved-source identity only against independent pins. **Independent review**: two exports of the same SHA are byte-identical; dirty and mid-export mutations cannot silently change bytes; a clean detached copy verifies; ordinary mutations fail internal mode and coordinated rehash fails pinned mode. **Owned files**: exporter/verifier scripts, focused Node tests, and existing CI quality wiring only. **Depends on: WP01** approval. This is a Spec Kitty lane review, not a separate PR.

## Mission PR and downstream handoff

After WP01 and WP02 are approved, consolidate their lanes through the Spec Kitty mission workflow and submit one reviewed PR to `develop`. Run and record lint, test, build, Storybook, axe, visual and export gates on the actual PR head; the visual command is `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` and must execute at least one test. Preserve per-story axe outcomes and story→visual-test→snapshot coverage with tested SHA in PR evidence outside the source contract. Obey the branch's rebase-only merge rule and matching-head review evidence. Do not select final source SHA S before this mission's PR lands.

A second focused Spec Kitty mission depends on this merge. It will select stable post-merge `develop` SHA S, repeat all required gates at S, export and verify the final in-repository artifact, and submit its own reviewed PR. That downstream mission is deliberately not a WP in this task set; issue #470 remains open until its handoff is complete. The old train branch and approved prototype are reference material only, never merge input.
