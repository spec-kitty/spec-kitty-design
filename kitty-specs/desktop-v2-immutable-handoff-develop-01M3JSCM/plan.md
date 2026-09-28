# Implementation Plan: Desktop V2 primitive contract and offline handoff tooling

**Branch**: `develop` in the standalone mission checkout | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)  
**Input**: [issue #470](https://github.com/spec-kitty/spec-kitty-design/issues/470), operator correction to `develop`, and [research.md](./research.md).

## Summary

Document and check the 22 current primitive families, then build a deterministic exporter and offline verifier. WP01 and WP02 are independently reviewable lanes that consolidate into one mission PR to `develop`. After that PR lands, a separate focused Spec Kitty mission selects stable source SHA S on `develop`, repeats the required gates at S, and creates the immutable handoff artifact. The approved prototype informs composition only.

## Technical context

| Area | Existing surface and chosen use |
|---|---|
| Languages | TypeScript and JavaScript tooling; CSS tokens/styles; Lit custom elements and generated React wrappers. |
| Packages | `@spec-kitty/tokens` → `@spec-kitty/styles` → `@spec-kitty/elements` → generated `@spec-kitty/react`. Do not hand-edit generated wrappers or markup. |
| Source | `packages/styles/src/<family>/` exists for each named family; `packages/elements/src/<family>/` exists only for some. Inventory actual forms and public entries. |
| Evidence | Storybook stories, `apps/storybook/src/tests/visual.spec.ts` plus committed snapshots, `scripts/run-axe-storybook.js`, repository tests and Nx builds. |
| Storage | Versioned contract and export files in the repository; local filesystem copy for the consumer. No service, registry, npm runtime dependency, or network verification. |
| Scale | 22 families plus their actual token/font/source closure; no new generic primitive or Desktop application code. |

## Charter check

- `develop` is the charter's PR target. Its active ruleset requires a linear history and permits rebase merging only. `main` is a separate operator release; this mission never promotes to it.
- Preserve authored/generated boundaries, one-way package dependencies, token-only component CSS, required Storybook states, WCAG 2.1 AA scans, and committed visual baselines. Any source changes made for coverage follow the existing component recipe and required behaviour tests.
- The mission PR requires green CI, matching-head adversarial squad evidence on the PR, and the charter's maintainer approval where component files or tokens change. Earlier review point-cuts apply if the mission's risk tier calls for them.
- Redistribution rights are assessed per exported asset. `LICENSE` is MIT for repository code, `packages/tokens/src/fonts/Inter-OFL.txt` supports Inter, and `docs/design-system/brand-guidelines.md` flags unresolved Swansea rights. Do not export an unresolved font on assumed MIT terms.
- The charter's historical token size ceiling is already documented as repository-contradicted. This mission does not change or silently waive it; no new token-size claim is made.

## Data flow and boundary

```mermaid
flowchart LR
    A[current develop source] --> B[22-family contract and asset closure]
    B --> C[repo-native stories, axe, visual and quality gates]
    B --> D[deterministic exporter]
    C --> E[mission-wide reviewed PR to develop]
    D --> E
    E --> S[follow-up mission freezes stable SHA S]
    S --> H[immutable in-repo handoff artifact]
    H --> F[offline Desktop copy]
    F --> G[offline verifier]
```

The contract records each family's actual source form and public entry; it is not a second implementation of the component. The exporter copies only an explicitly enumerated, licensed transitive closure, sorted by normalized repository-relative path. It emits a schema-versioned manifest with a full committed source SHA, file role, path, byte size, SHA-256, license reference, state/evidence IDs, and a canonical digest over the payload/contract file list. The manifest does not hash itself. The future mission runs this mechanism at S, the stable post-merge `develop` source commit.

## Proposed repository surfaces

| Surface | Responsibility |
|---|---|
| `contracts/desktop-v2/` | Versioned human-readable and machine-readable 22-family consumer contract, evidence map, and license references. Exact filenames can follow current repository conventions during WP01. |
| `packages/styles/src/`, `packages/elements/src/`, `packages/tokens/src/` | Existing sources; change only verified coverage or composition gaps. Generated files follow their generators. |
| `apps/storybook/src/tests/visual.spec.ts` and snapshots | Visual states and baselines when WP01 needs missing evidence. |
| `scripts/` and `tests/node/` | Exporter, offline verifier, contract drift checks, and focused failure-case tests using the existing Node/Vitest tooling. |
| `handoffs/desktop-v2/<S>/` | Created by the later focused handoff mission after this mission's PR lands. |
| `kitty-specs/desktop-v2-immutable-handoff-develop-01M3JSCM/` | Mission spec, plan, tasks, work-package review records. |

## Delivery sequence and dependencies

1. **WP01 — source contract and evidence.** Inventory all 22 names against current `develop`; record styles/element forms, source/public paths, token and font closure, redistribution evidence, state IDs, axe and visual references. Fill actual coverage gaps through existing story/test paths. Add a machine check that rejects missing or stale family/evidence entries. Review WP01 in its Spec Kitty lane.
2. **WP02 — deterministic offline exporter and verifier.** Consume WP01's checked contract; emit the normalized payload and manifest; validate copied payload and contract entirely offline. Test repeatability, path/rights closure, and tamper cases. Wire the check into existing repository scripts/CI without a new harness. Review WP02 in its Spec Kitty lane.
3. **Mission PR and follow-up handoff.** Once both WPs are approved, use the Spec Kitty acceptance and lane-consolidation workflow to prepare one reviewed mission PR to `develop`. The branch ruleset permits rebase merge only; verify CI and review evidence at the PR head. Only after that PR lands does a new, focused handoff mission choose S, rerun gates, and commit the artifact. This plan does not create that second mission.

WP02 depends on WP01's approved source contract, not a separate WP01 merge to `develop`. Each WP has an independent review verdict; the aggregate diff receives the repository's required PR review once.

## Verification design

| Gate | Command or evidence source | Acceptance |
|---|---|---|
| Lint | `npm run quality:all` | Exit 0 on the mission PR head. |
| Tests | `npm test` plus focused contract/export tests | Exit 0; mutations of required fields/files fail. |
| Package build | `npx nx run-many --target=build --projects=tokens,styles,elements,react` | Exit 0; generated output remains consistent with authored source. |
| Storybook | `npx nx run storybook:storybook:build` | Exit 0 and all contract story IDs resolve in `index.json`. |
| Axe | `node scripts/run-axe-storybook.js` | Zero WCAG 2.1 AA violations and zero unloaded stories. |
| Visual | `npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` | Exit 0 against committed baselines; all contract visual IDs resolve. |
| Export | Mission exporter twice, compare byte digests; offline verifier on copied output | Identical bytes and successful network-disabled verification; corruption matrix exits nonzero. |

WP01 may document uncovered evidence as a finding while building; it cannot claim complete acceptance until the required states and references are resolved. The mission PR records actual command, head SHA, result and evidence path for all seven gate categories. The later handoff mission repeats and records those gates at S; its final acceptance consumes the artifact itself.

## Failure modes and containment

- **Font rights/closure:** source CSS may reference Swansea although current component styles do not use its family. WP01 must compute the export's actual transitive CSS asset closure. If Swansea is in that closure, obtain explicit rights or narrow the export using a source-preserving, verified CSS selection; no unlicensed asset enters an export.
- **Stale evidence:** story IDs, snapshots, or axe reports can drift with a late component change. Evidence carries the tested source SHA and is re-created when that SHA changes; the future handoff refreshes it at S.
- **Manifest self-reference:** digest only the canonical payload/contract list; the manifest cannot include its own digest.
- **Nonportable files:** reject symlinks, traversals, absolute paths, duplicates, case collisions and host-dependent timestamps/order; test on an artifact copied outside the Git tree.
- **Protected target:** `develop` permits rebase merge only. Use the actual branch ruleset, not the old run prompt's stale squash example or a two-parent merge assumption.
- **Old train history:** old D1 branch and lane output may inform selective source edits but must not be merged or cherry-picked wholesale. The final source comes from current `develop`.

## Implementation concern map

### IC-01 — Contract and evidence

- **Purpose**: Identify the exact reusable source and prove state, rights, accessibility and visual coverage.
- **Requirements**: FR-001–FR-003, FR-007, FR-009; NFR-003–NFR-005.
- **Surfaces**: `contracts/desktop-v2/`, current packages, Storybook and snapshots.
- **Dependency**: none. **Risk**: source forms and font rights vary across the 22 families.

### IC-02 — Reproducible offline handoff tooling

- **Purpose**: Produce portable bytes and fail deterministically on consumer-contract drift.
- **Requirements**: FR-004–FR-006; NFR-001–NFR-002.
- **Surfaces**: `scripts/`, `tests/node/`, `contracts/desktop-v2/`, CI script wiring.
- **Dependency**: IC-01 contract schema and closure. **Risk**: path normalization and self-referential hashes.

### Downstream mission boundary

The next focused mission owns the `handoffs/desktop-v2/<S>/` artifact, final gate evidence at S, and its own PR. Its prerequisite is this mission's reviewed PR merged to `develop`; no WP in this mission claims that post-merge freeze.
