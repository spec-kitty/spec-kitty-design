# Mission Specification: Desktop V2 primitive contract and immutable develop handoff

**Mission Branch**: `develop` (owned checkout; WP branches target `develop`)  
**Created**: 2026-09-28  
**Status**: Draft  
**Input**: [spec-kitty-design issue #470](https://github.com/spec-kitty/spec-kitty-design/issues/470), with the operator's `develop` target correction. Baseline: `origin/develop` at `c5ab89ea873b55575af8055f3cfba02089c43b13` before mission scaffolding.

## Purpose and scope

Give the offline Kitty Desktop consumer a machine-checked contract for the 22 existing primitive families and a reproducible, immutable handoff from `develop`. The contract must identify what can be vendored, which bytes and rights support that transfer, and which states and quality evidence were checked at the frozen source revision. The approved prototype supplies composition evidence only; its code and data are not source material.

The exact family set is: `action-row`, `app-shell`, `button`, `card`, `context-sidebar`, `data-table`, `disclosure`, `empty-state`, `event-timeline`, `facts`, `form-select`, `metric`, `nav-pill`, `notice`, `page-header`, `personal-rail`, `pill-tag`, `progress`, `segmented-choice`, `status-indicator`, `workflow-board`, and `workflow-lane`.

## User scenarios and testing

### User Story 1 — Know the reusable primitive contract (P1)

As a Desktop implementer, I can inspect all 22 families and their source form, states, assets, rights, accessibility and visual evidence before choosing what to vendor.

**Independent test**: Validate the contract against the repository at a chosen source SHA; each named family and referenced file/evidence resolves, and any missing or extra family fails.

**Acceptance scenarios**:

1. Given the selected `develop` source revision, when the inventory is checked, then every named family has repository-relative source paths, a public consumer entry, state/variant coverage, license evidence, and linked accessibility and visual evidence.
2. Given a styles-only family, when its entry is checked, then the contract describes its actual styles/static markup form rather than claiming an element export.
3. Given an asset with unresolved redistribution terms, when the handoff is prepared, then export fails with a precise asset/license finding.

### User Story 2 — Vendor and verify without network access (P1)

As a Desktop build maintainer, I can export the exact approved files and verify their identity and contract offline, including after a local copy.

**Independent test**: Generate two exports from the same SHA and compare their manifest and payload bytes; then verify a copied export with network disabled and mutate one file and one contract field to observe deterministic failures.

**Acceptance scenarios**:

1. Given source SHA S, when an export is generated twice, then normalized paths, file set, per-file hashes, artifact digest, and manifest bytes match.
2. Given a clean copied export, when offline verification runs, then it succeeds without a Git checkout, npm registry, or network connection.
3. Given a modified, missing, extra, or path-substituted file or a drifted consumer contract, when offline verification runs, then it exits nonzero and names the mismatch.

### User Story 3 — Receive a traceable freeze and handoff (P2)

As a reviewer, I can trace the handoff from frozen source SHA S through the child handoff commit R to the reviewed PR merge commit on `develop`, with gates tied to S.

**Independent test**: Inspect the Git ancestry and handoff record, re-run verification at S and against the exported artifact, and reconcile the merged PR receipt with `develop` history.

**Acceptance scenarios**:

1. Given source and exporter changes merged into `develop`, when S is frozen, then all required gate evidence names S and the source tree is unchanged through the handoff.
2. Given child commit R, when ancestry is checked, then R's direct parent is S and R contains only the handoff record/export metadata permitted by the contract.
3. Given the handoff PR merged, when its receipt is checked, then the actual merge commit on `develop` is recorded and its ancestry contains R. No unrelated train branch is promoted.

### Edge cases

- Reject symlinks, path traversal, absolute paths, duplicate normalized paths, case-colliding names, and files whose content changes between inventory and export.
- Reject evidence captured at a different source SHA or a story/visual reference that no longer resolves.
- Distinguish a missing license statement from a file covered by repository MIT terms; do not infer a font's license from the repository license.
- If a required gate is unavailable or fails, do not label the source snapshot releasable or produce a green handoff.
- If `develop` advances between candidate S and handoff review, regenerate the snapshot and gate evidence or explicitly prove ancestry and unchanged payload bytes before using it.

## Requirements

### Functional requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Exact family inventory | As a Desktop implementer, I need exactly the 22 issue-listed families represented with actual source forms and public entry points so I can choose compatible primitives. | High | Open |
| FR-002 | State contract | As a reviewer, I need each family's documented states, variants, themes, and relevant responsive modes mapped to resolvable Storybook evidence, including explicit gaps. | High | Open |
| FR-003 | Asset and rights closure | As a Desktop maintainer, I need all transitive source/token/font assets listed with repository-relative paths and specific redistribution evidence so I can vendor only cleared bytes. | High | Open |
| FR-004 | Immutable provenance | As a Desktop maintainer, I need a full source Git SHA, source paths, byte lengths, SHA-256 hashes, schema version, and artifact digest for every exported file. | High | Open |
| FR-005 | Offline export and verify | As a Desktop maintainer, I need deterministic export and verification commands that work on a copied artifact without network or npm runtime dependency. | High | Open |
| FR-006 | Contract drift failure | As a reviewer, I need verification to fail on changed/missing/extra files, altered contract fields, unresolved evidence, or stale source hashes with clear diagnostics. | High | Open |
| FR-007 | Quality evidence | As a reviewer, I need repository-native lint, test, build, Storybook, axe, visual, and export outcomes tied to the same frozen source SHA S. | High | Open |
| FR-008 | Freeze lineage | As a reviewer, I need the child handoff commit R directly descended from S and the final PR merge commit on `develop` recorded with a checkable relationship to R. | High | Open |
| FR-009 | Consumer boundary | As a Desktop implementer, I need neutral selected navigation expressed as composition of existing tokens and the artifact file/presence tree left to Desktop as a domain adapter. | Medium | Open |

### Non-functional requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Determinism | Two exports at the same source SHA on a clean tree produce byte-identical payload and manifest; ordering, timestamps, and paths cannot vary by host. | Reliability | High | Open |
| NFR-002 | Offline integrity | A copied artifact verifies with network disabled and fails nonzero for each tested corruption class; no registry or remote Git access is required. | Reliability | High | Open |
| NFR-003 | Evidence completeness | All 22 families have state, accessibility, and visual evidence references at S; zero unresolved missing or stale evidence references are accepted. | Quality | High | Open |
| NFR-004 | Rights completeness | 100% of exported files and transitive assets have a resolved redistribution basis; unknown licenses block export. | Compliance | High | Open |
| NFR-005 | Reproducible gates | The recorded gate commands can be run from the repository and report pass/fail against S; no gate is marked passed solely by prose. | Quality | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Canonical branch | `develop` is the source and merge target for this replacement; the issue's old train target and accepted input ref are historical context. | Delivery | High | Open |
| C-002 | Existing primitives | Use the current repository implementation and source forms. The approved prototype is composition evidence; do not copy its code or data. | Product | High | Open |
| C-003 | No Desktop application scope | No Tauri behavior, screens, routes, typed application data, or generic file-tree primitive. | Product | High | Open |
| C-004 | Local handoff | No npm runtime dependency, whole-train promotion, external bundle/anchor/program record, OCI sandbox, Ed25519 approval policy, revocation snapshot, or new quality harness. | Delivery | High | Open |

### Key entities

- **Source snapshot S**: full `develop` SHA whose source files, contract, and gate evidence are frozen.
- **Primitive family contract**: family name, current source form, public entry, states, and evidence references.
- **Exported file**: normalized relative path, byte length, content digest, role, and license evidence.
- **Handoff record**: versioned manifest binding S, artifact digest, contract digest, evidence, R, and the later merge receipt.

## Success criteria

- **SC-001**: A machine check finds exactly 22 family entries and zero unresolved required source, state, rights, accessibility, or visual references.
- **SC-002**: Two same-S exports are byte-identical; a clean copied export verifies offline, while changed/missing/extra/path-substituted files and contract drift each fail with a named mismatch.
- **SC-003**: All seven repository-native gate categories (lint, test, build, Storybook, axe, visual, export) pass at S with recorded commands and evidence paths.
- **SC-004**: Git proves `parent(R) = S` and the reviewed handoff PR merge commit is on `develop` and contains R.
