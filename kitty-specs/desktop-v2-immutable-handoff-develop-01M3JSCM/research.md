# Discovery: Desktop V2 immutable handoff on develop

Audience: design-system implementers and Desktop consumers preparing an offline vendor import.

## Authorities and findings

1. [Issue #470](https://github.com/spec-kitty/spec-kitty-design/issues/470) names 22 existing primitive families and requires immutable source SHA, source path, content hash, license, state, accessibility, and visual evidence. The operator has superseded its stale `train/elements-first` target with `develop`. The accepted prototype is composition evidence only.
2. `origin/develop` was `c5ab89ea873b55575af8055f3cfba02089c43b13` at mission creation. All 22 named families have a `packages/styles/src/<family>/` directory in that tree; some also have `packages/elements/src/<family>/`. A contract must describe the source form actually present for each family rather than assume every family is a custom element.
3. The existing repository has native lint, Vitest, Nx builds, Storybook, `scripts/run-axe-storybook.js`, and `apps/storybook/src/tests/visual.spec.ts`. `docs/contributing/running-quality-checks.md` documents their use. The mission should connect evidence to these gates and add an export/drift gate, not invent a second test system.
4. `packages/tokens/src/tokens.css` and `packages/tokens/src/fonts/` contain self-hosted Inter and Falling Sky assets. `docs/design-system/brand-guidelines.md` records Inter's OFL status and an unresolved Swansea redistribution issue. A machine-checkable handoff must enumerate the actual transitive asset closure and fail if a referenced asset lacks redistribution evidence; it cannot silently treat the repository MIT license as covering every font.
5. Source SHA and per-file digest serve different purposes. The commit fixes provenance; the digest detects local byte drift after offline vendoring. The license reference, Storybook state IDs, axe result, and visual evidence must be bound to the same source snapshot and named files. A consumer drift command needs a deterministic nonzero result for changed, missing, added, or substituted source/contract bytes.
6. `docs/architecture/branch-model.md` and the active develop ruleset (`.github/rulesets/develop-ruleset.json`, live ruleset 23706031 on 2026-09-28) permit PRs with rebase merges only and require linear history. Spec Kitty's lane merger integrates a mission's approved WPs at mission end, not as independent WP PRs. A final handoff cannot freeze a stable `develop` source SHA before this mission's contract/tooling PR lands.

## Decisions for planning

- Source of truth: current `develop` code. This mission delivers the checked contract and exporter/verifier in one mission-wide PR. A second, focused Spec Kitty mission selects stable post-merge source SHA S and produces the final immutable artifact. No old train branch or prototype code is a merge source.
- Contract scope: the named 22 families, their current source forms, required token and font assets, licenses, state matrix, and evidence references. Neutral selected navigation is a Desktop composition of existing tokens. The artifact file/presence tree stays a Desktop adapter.
- Export: a local deterministic artifact with relative paths and hashes, verifiable with network access disabled. No npm runtime dependency, external registry, or new verification harness is needed.
- Handoff boundary: this mission proves deterministic export and offline verification at a committed source revision. The follow-up mission repeats repository gates at stable post-merge S and commits the in-repository artifact through its own reviewed PR to `develop`, using the branch's permitted rebase-merge method.

## Risks and open work

- The exact export closure, state gaps, and license status of each asset need WP01 inventory. Any unresolved redistribution license blocks that asset's inclusion until resolved or a source-preserving scoped export excludes it with a verified closure.
- Storybook/axe/visual results can go stale if source bytes change after capture. The verifier must reject mismatched evidence source; the future handoff mission refreshes all required evidence at S.
- This mission's tested revision is not necessarily the future S. The later handoff must wait for this mission's PR merge and select a stable `develop` commit.
