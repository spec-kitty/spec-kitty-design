# Mission Specification: Desktop V2 primitive contract and offline handoff tooling

**Mission Branch**: `develop` (standalone mission checkout; WP branches target `develop`)  
**Created**: 2026-09-28  
**Status**: Draft  
**Input**: [spec-kitty-design issue #470](https://github.com/spec-kitty/spec-kitty-design/issues/470), with the operator's `develop` target correction. Baseline: `origin/develop` at `c5ab89ea873b55575af8055f3cfba02089c43b13` before mission scaffolding.

## Purpose and scope

Give the offline Kitty Desktop consumer a machine-checked contract for the 22 existing primitive families and deterministic tooling to export and verify an immutable source snapshot from `develop`. This mission delivers a source-intrinsic contract and tooling in one reviewed PR to `develop`. The contract describes the source; it does not contain its own commit SHA, content hash, or gate-result fields. A second, focused Spec Kitty mission will select stable post-merge source SHA S, run the final required gates, and commit the immutable handoff artifact and S-labelled evidence after S. Issue #470 is complete only after that second mission. The approved prototype supplies composition evidence only; its code and data are not source material.

The exact family set is: `action-row`, `app-shell`, `button`, `card`, `context-sidebar`, `data-table`, `disclosure`, `empty-state`, `event-timeline`, `facts`, `form-select`, `metric`, `nav-pill`, `notice`, `page-header`, `personal-rail`, `pill-tag`, `progress`, `segmented-choice`, `status-indicator`, `workflow-board`, and `workflow-lane`.

## User scenarios and testing

### User Story 1 — Know the reusable primitive contract (P1)

As a Desktop implementer, I can inspect all 22 families and their source form, states, assets, rights, accessibility and visual evidence before choosing what to vendor.

**Independent test**: Validate the contract against the repository at a chosen source SHA; each named family and required state resolves independently of the current story inventory, and any missing or extra family or required state fails.

**Acceptance scenarios**:

1. Given the selected `develop` source revision, when the inventory is checked, then every named family has repository-relative source paths, a public consumer entry, an independently declared required-state list, license evidence, and story-to-visual-test-to-snapshot mappings. Actual axe and visual results are recorded after the tested commit in an evidence sidecar.
2. Given a styles-only family, when its entry is checked, then the contract describes its actual styles/static markup form rather than claiming an element export.
3. Given `packages/tokens/src/tokens.css` with live Swansea URLs and no cleared Swansea redistribution terms, when an unmodified full-token export is attempted, then it fails with a precise rights finding. A verified scoped derivative may exclude those URLs with source mapping. Falling Sky OTF's embedded SIL OFL evidence is recognized.

### User Story 2 — Vendor and verify without network access (P1)

As a Desktop build maintainer, I can export the exact approved files and verify their identity and contract offline, including after a local copy.

**Independent test**: Generate two exports from the same committed SHA and compare their manifest and payload bytes; then verify a copied export with network disabled both internally and against independently pinned expected SHA/digest. Probe dirty source, a mid-export mutation, and a coordinated manifest/contract/payload rehash.

**Acceptance scenarios**:

1. Given a committed source SHA, when an export is generated twice, then it uses the committed Git blob bytes, normalized paths, file set, per-file hashes, artifact digest, and manifest bytes match; dirty included files fail or cannot change exported bytes, and mutation during export cannot change the result unnoticed.
2. Given a clean copied export, when offline verification runs, then internal integrity succeeds without a Git checkout, npm registry, or network connection. Approved-source verification additionally requires an independently supplied expected source SHA and artifact digest.
3. Given a modified, missing, extra, or path-substituted file, when verification runs, then it fails with a named mismatch. Given an attacker who rewrites manifest, contract, and payload together, internal integrity may pass, but verification against the pinned expected digest/SHA fails.

### User Story 3 — Prepare a future frozen handoff (P2)

As a reviewer, I can see that the contract and tooling are ready to bind a future handoff to a stable full source SHA on `develop`, with the final gate run deferred to the focused handoff mission.

**Independent test**: Run export against a committed source revision, verify a detached copy against independently pinned expectations, and confirm the manifest names that full revision. Gate, axe, and visual result reports are generated after that revision, not embedded in the source contract.

**Acceptance scenarios**:

1. Given a committed source revision, when export runs, then its full source SHA and per-file hashes identify the exact checked bytes.
2. Given the contract and tooling PR merged into `develop`, when the next mission begins, then it can select a stable source SHA there without copying or promoting the old train branch.
3. Given this mission's PR review, when its checks are examined, then lint, test, build, Storybook, axe, visual, and export checks have run on the current PR head; the visual command has executed at least one test, and per-story axe results and visual mappings are persisted in PR evidence. The final handoff mission repeats required gates at S and records S-labelled reports separately.

### Edge cases

- Reject symlinks, path traversal, absolute paths, duplicate normalized paths, case-colliding names, and files whose content changes between inventory and export.
- A source contract inside S cannot refer to S or hash itself; S-labelled reports are created after S and point back to it.
- Reject evidence captured at a different source SHA or a story/visual reference that no longer resolves. A required state cannot disappear merely because its story was deleted.
- Internal offline integrity cannot establish approved-source authenticity without a separately pinned expected digest/SHA; report the weaker mode honestly.
- Distinguish a missing license statement from a file covered by repository MIT terms; do not infer a font's license from the repository license.
- If a required gate is unavailable or fails, do not label the source snapshot releasable or produce a green handoff.
- If `develop` advances before the later handoff freezes S, that mission selects the new stable SHA and regenerates its evidence.

## Requirements

### Functional requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Exact family inventory | As a Desktop implementer, I need exactly the 22 issue-listed families represented with actual source forms and public entry points so I can choose compatible primitives. | High | Open |
| FR-002 | Independent state contract | As a reviewer, I need each family's required states, themes, and relevant responsive modes declared independently of observed stories, with required-state→story→visual-test→snapshot mapping and deletion detection. | High | Open |
| FR-003 | Asset and rights closure | As a Desktop maintainer, I need transitive source/token/font assets with specific redistribution evidence; the full CSS export is blocked by Swansea URLs until rights are proven, while a verified scoped derivative may exclude them with source mapping. | High | Open |
| FR-004 | Immutable provenance | As a Desktop maintainer, I need export bytes taken from committed Git blobs at the selected full SHA, with source paths, byte lengths, SHA-256 hashes, schema version, and artifact digest outside that source tree. | High | Open |
| FR-005 | Offline export and verify | As a Desktop maintainer, I need deterministic export and copied-artifact verification without network or npm runtime dependency, with distinct internal-integrity and independently pinned approved-source modes. | High | Open |
| FR-006 | Contract drift failure | As a reviewer, I need named failures for changed/missing/extra files, path substitution, dirty or mid-export source drift, and a coordinated rehash attack when approved-source expectations are supplied. | High | Open |
| FR-007 | Quality evidence | As a reviewer, I need repository-native lint, test, build, Storybook, axe, visual, and export checks on the reviewed PR head; per-story axe results and visual mappings must persist outside the source contract. The future handoff repeats them at S. | High | Open |
| FR-008 | Source binding | As a reviewer, I need a SHA-independent source contract and an export manifest bound to a full committed source SHA, with S-labelled reports emitted after S so a later mission can freeze stable post-merge S. | High | Open |
| FR-009 | Consumer boundary | As a Desktop implementer, I need neutral selected navigation expressed as composition of existing tokens and the artifact file/presence tree left to Desktop as a domain adapter. | Medium | Open |

### Non-functional requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Determinism | Two exports at the same source SHA on a clean tree produce byte-identical payload and manifest; ordering, timestamps, and paths cannot vary by host. | Reliability | High | Open |
| NFR-002 | Offline integrity and pinning | A copied artifact verifies internally with network disabled; approved-source mode requires independently supplied expected SHA and digest and rejects coordinated rehash. No registry or remote Git access is required. | Reliability | High | Open |
| NFR-003 | Evidence completeness | All 22 families have independently declared required states and checked story-to-visual-test-to-snapshot mappings; per-story axe results and tested SHA live in a post-source evidence report. Zero missing/stale references or zero-test visual runs are accepted. | Quality | High | Open |
| NFR-004 | Rights completeness | 100% of exported files and transitive assets have a resolved redistribution basis; unknown licenses block export. | Compliance | High | Open |
| NFR-005 | Reproducible gates | The recorded gate commands can be run from the repository against the reviewed PR head and later against S; no gate is marked passed solely by prose. | Quality | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Canonical branch | `develop` is the source and merge target for this replacement; the issue's old train target and accepted input ref are historical context. | Delivery | High | Open |
| C-002 | Existing primitives | Use the current repository implementation and source forms. The approved prototype is composition evidence; do not copy its code or data. | Product | High | Open |
| C-003 | No Desktop application scope | No Tauri behavior, screens, routes, typed application data, or generic file-tree primitive. | Product | High | Open |
| C-004 | Local handoff | No npm runtime dependency, whole-train promotion, external handoff service, or new quality harness. | Delivery | High | Open |

### Key entities

- **Source revision**: full Git SHA whose source files and contract are exported and verified; the later mission selects stable post-merge `develop` SHA S.
- **Primitive family contract**: source-intrinsic family name, current source form, public entry, independently required states, and resolvable story/visual mappings; no own SHA or run results.
- **Exported file**: committed Git blob bytes or verified source-mapped derivative, normalized relative path, byte length, content digest, role, and license evidence.
- **Export manifest**: post-source versioned record binding a committed source SHA, artifact digest, contract digest, and rights references; the later mission uses it for the final handoff artifact.
- **Evidence report**: post-source per-story axe results, visual test/snapshot mapping, positive test count, commands and tested SHA.

## Success criteria

- **SC-001**: A machine check finds exactly 22 family entries and zero unresolved required source/state/rights/story/visual mappings; deleting one required state or its story fails.
- **SC-002**: Two exports of the same committed SHA are byte-identical; a clean copied export verifies offline. Dirty and mid-export mutation probes cannot change committed bytes unnoticed. Changed/missing/extra/path-substituted files fail, and coordinated rehash fails in independently pinned mode.
- **SC-003**: All seven repository-native gate categories (lint, test, build, Storybook, axe, visual, export) pass on the reviewed mission PR head with recorded commands and evidence paths; visual test count is positive and per-story axe results persist.
- **SC-004**: The finalized task set has exactly two WPs and explicitly hands off final S selection, gate repetition, and the immutable artifact to a later mission whose prerequisite is this mission's PR landing on `develop`.
