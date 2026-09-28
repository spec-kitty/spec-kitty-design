# Discovery: Desktop V2 immutable handoff on develop

Audience: design-system implementers and Desktop consumers preparing an offline vendor import.

## Authorities and findings

1. [Issue #470](https://github.com/spec-kitty/spec-kitty-design/issues/470) names 22 existing primitive families and requires immutable source SHA, source path, content hash, license, state, accessibility, and visual evidence. The operator has superseded its stale `train/elements-first` target with `develop`. The accepted prototype is composition evidence only.
2. `origin/develop` was `c5ab89ea873b55575af8055f3cfba02089c43b13` at mission creation. All 22 named families have a `packages/styles/src/<family>/` directory in that tree; some also have `packages/elements/src/<family>/`. A contract must describe the source form actually present for each family rather than assume every family is a custom element.
3. The existing repository has native lint, Vitest, Nx builds, Storybook, `scripts/run-axe-storybook.js`, and `apps/storybook/src/tests/visual.spec.ts`. `docs/contributing/running-quality-checks.md` documents their use. The mission should connect evidence to these gates and add an export/drift gate, not invent a second test system.
4. `packages/tokens/src/tokens.css` and `packages/tokens/src/fonts/` contain self-hosted Inter and Falling Sky assets. `docs/design-system/brand-guidelines.md` records Inter's OFL status and an unresolved Swansea redistribution issue. A machine-checkable handoff must enumerate the actual transitive asset closure and fail if a referenced asset lacks redistribution evidence; it cannot silently treat the repository MIT license as covering every font.
5. Source SHA and per-file digest serve different purposes. The commit fixes provenance; the digest detects local byte drift after offline vendoring. The license reference, Storybook state IDs, axe result, and visual evidence must be bound to the same source snapshot and named files. A consumer drift command needs a deterministic nonzero result for changed, missing, added, or substituted source/contract bytes.

## Decisions for planning

- Source of truth: the final reviewed `develop` source snapshot, selected only after source contract and exporter/verifier changes have passed their gates. No old train branch or prototype code is a merge source.
- Contract scope: the named 22 families, their current source forms, required token and font assets, licenses, state matrix, and evidence references. Neutral selected navigation is a Desktop composition of existing tokens. The artifact file/presence tree stays a Desktop adapter.
- Export: a local deterministic artifact with relative paths and hashes, verifiable with network access disabled. No npm runtime dependency, OCI sandbox, external registry, approval signature, revocation service, or out-of-repository program record is needed.
- Handoff: record freeze SHA S, create a child ref R from S containing only the immutable handoff record (and any generated export metadata), re-run verification against S, then merge the reviewed PR into `develop` and record its merge commit. R must have S as its direct parent so lineage is checkable.

## Risks and open work

- The exact export closure, state gaps, and license status of each asset need WP01 inventory. Any unresolved redistribution license blocks that asset's inclusion until resolved or a source-preserving scoped export excludes it with a verified closure.
- Storybook/axe/visual results can go stale if source bytes change after capture. WP02 verifier must reject mismatched evidence source and WP03 must refresh evidence at S.
- A child handoff commit changes the branch tip while S remains the source SHA. The record must distinguish source S, handoff R, and the eventual PR merge commit on `develop`.
