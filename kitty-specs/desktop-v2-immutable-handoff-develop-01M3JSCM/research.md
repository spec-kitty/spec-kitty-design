# Discovery: Desktop V2 immutable handoff on develop

Audience: design-system implementers and Desktop consumers preparing an offline vendor import.

## Authorities and findings

1. [Issue #470](https://github.com/spec-kitty/spec-kitty-design/issues/470) names 22 existing primitive families and requires immutable source SHA, source path, content hash, license, state, accessibility, and visual evidence. The operator has superseded its stale `train/elements-first` target with `develop`. The accepted prototype is composition evidence only.
2. `origin/develop` was `c5ab89ea873b55575af8055f3cfba02089c43b13` at mission creation. All 22 named families have a `packages/styles/src/<family>/` directory in that tree; some also have `packages/elements/src/<family>/`. A contract must describe the source form actually present for each family rather than assume every family is a custom element.
3. The existing repository has native lint, Vitest, Nx builds, Storybook, `scripts/run-axe-storybook.js`, and `apps/storybook/src/tests/visual.spec.ts`. `docs/contributing/running-quality-checks.md` documents their use. The mission should connect evidence to these gates and add an export/drift gate, not invent a second test system.
4. `packages/tokens/src/tokens.css` contains Swansea font URLs. `docs/design-system/brand-guidelines.md` records unresolved Swansea redistribution terms; full CSS export therefore fails until rights are proven. Inter has a checked OFL file and Falling Sky OTF contains embedded SIL OFL terms. A verified scoped CSS derivative that excludes Swansea URLs needs source mapping and its own digest. Repository MIT cannot be assumed to cover fonts.
5. Source SHA and per-file digest serve different purposes. The contract committed at S cannot contain S or its own hash. A later manifest binds S and committed blob hashes; still later gate/axe/visual reports name S without changing it. A copied verifier can prove internal consistency, but approved-source authenticity needs an independently pinned expected source SHA and artifact digest.
6. `docs/architecture/branch-model.md` and the active develop ruleset (`.github/rulesets/develop-ruleset.json`, live ruleset 23706031 on 2026-09-28) permit PRs with rebase merges only and require linear history. Spec Kitty's lane merger integrates a mission's approved WPs at mission end, not as independent WP PRs. A final handoff cannot freeze a stable `develop` source SHA before this mission's contract/tooling PR lands.
7. `playwright.config.ts` excludes `visual.spec.ts` unless `PW_INCLUDE_VISUAL=1`; the repository's CI visual job sets it. The `components` path filter in `.github/workflows/ci-quality.yml` currently omits `contracts/desktop-v2/**`, so a contract-only PR could skip Storybook/axe/visual gates. The contract path must be wired into that existing filter, and the visual run must report a positive test count.

## Decisions for planning

- Source of truth: current `develop` code. This mission delivers the checked contract and exporter/verifier in one mission-wide PR. A second, focused Spec Kitty mission selects stable post-merge source SHA S and produces the final immutable artifact. No old train branch or prototype code is a merge source.
- Contract scope: the named 22 families, their current source forms, required token and font assets, licenses, and independently declared required states mapped to stories and visual tests/snapshots. Actual axe/visual results live in a post-source evidence sidecar. Neutral selected navigation is a Desktop composition of existing tokens. The artifact file/presence tree stays a Desktop adapter.
- Export: read committed Git blobs at the selected SHA, reject dirty included paths, and detect mid-export mutation. A local deterministic artifact has relative paths and hashes, verifiable with network disabled. Internal integrity and caller-pinned approved-source verification are distinct. No npm runtime dependency, external registry, or new verification harness is needed.
- Handoff boundary: this mission proves deterministic export and offline verification at a committed source revision. The follow-up mission repeats repository gates at stable post-merge S and commits the in-repository artifact through its own reviewed PR to `develop`, using the branch's permitted rebase-merge method.

## Risks and open work

- The exact export closure and state gaps need WP01 inventory. Unmodified full `tokens.css` export is already blocked by Swansea URLs and unresolved terms; a scoped derivative needs a verified source map. Falling Sky OTF has embedded OFL evidence.
- Storybook/axe/visual results can go stale if source bytes change after capture. The verifier must reject mismatched evidence source; the future handoff mission refreshes all required evidence at S.
- This mission's tested revision is not necessarily the future S. The later handoff must wait for this mission's PR merge and select a stable `develop` commit.
