# Implementation Plan: REL2 — rc stream

**Branch**: `mission/release-pipeline-rc-stream` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/kitty-specs/release-pipeline-rc-stream-01M2DYQ2/spec.md`

## Summary

On a push to `develop`, bump `@spec-kitty/{tokens,styles,elements}` in lockstep to the next semver
prerelease, and publish all four publishable packages to `https://npm.pkg.github.com` under
dist-tag **`rc`**. The publishing identity is `GITHUB_TOKEN` with `packages: write` — no GitHub App
is involved, which is what makes this mission independent of REL1's pending App.

Two things dominate the technical approach. First, **no version-bump machinery exists anywhere in
this repository** — no `npm version` usage, no `--package-lock-only`, no semver code, and
`nx.json` has no `release` config — so the bump is written here rather than configured. Second,
the package set must stay **derived**: `release-graph.mjs` already exists as the single source and
already fails closed on an empty set, and this mission consumes it rather than adding a fourth
hand-written list (the defect #80 was created to remove).

## Technical Context

**Language/Version**: Node.js 22 (matches `release.yml`'s `setup-node`), Bash for gate scripts
**Primary Dependencies**: npm workspaces (`packages/*`, `apps/*`, `fixtures/*`), Nx for builds, GitHub Actions
**Storage**: N/A — the artifact store is the GitHub Packages npm registry
**Testing**: the existing derived-source gates (`check-release-graph.mjs`, `check-action-pins.sh`, `assert-lockfile-clean.sh`) plus a new `--selftest` probe table for the version-bump script, wired into `ci-quality.yml` so a PR exercises it
**Target Platform**: `ubuntu-latest` GitHub Actions runner
**Project Type**: single monorepo, CI/release tooling change — no application source is touched
**Performance Goals**: N/A. The publish path is not latency-sensitive; the build already runs ~1 min for three projects
**Constraints**: `GITHUB_TOKEN` cannot publish without `permissions: packages: write`; npm provenance is unsupported on GitHub Packages; consumers require a `read:packages` token even for public packages
**Scale/Scope**: four publishable packages, three of them buildable; one workflow; one new script; one `.npmrc` line

### Answers to the three deferred planning questions

The plan interview ran non-interactively and recorded `plan.approach`, `plan.risks` and
`plan.dependencies` as **deferred** with no answer. They are answered here from measurements taken
against the repository on 2026-09-13; the machinery's deferral is left visible rather than
back-filled.

**Approach.** Cut the registry over in place, add a `develop`-triggered publish workflow, and write
the lockstep bump as a small script with its own probe table. Reuse `release-graph.mjs` for the
package set; do not introduce a second source of truth.

**Risks.** (1) The first publish *creates* the packages, and package creation is the one
irreversible step in the vicinity — visibility flips are one-way. Staying private removes that
risk entirely for rc. (2) A bump that writes manifests but not the lockfile leaves the workspace
inconsistent in a way no current gate catches. (3) `npm publish` exits 0 on a package it skipped,
so any success signal read from exit codes alone is worthless here — the same trap
`check-release-graph.mjs` was built to close, and the new script must not reintroduce it.

**Dependencies.** `develop` must exist (created 2026-09-13 at `25120c70`). REL1's promotion App is
*not* a dependency: until it exists, `develop` is advanced by an explicit push, which is precisely
the trigger. No npm-registry credential is required or wanted.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Derived, not listed** — the package set comes from `release-graph.mjs`. No new hand-maintained
  list is introduced. PASS by construction.
- **Gates fail closed** — the bump script refuses an empty package set and refuses to report
  success from an exit code alone. Covered by IC-04.
- **Tokens-first / BEM / story conventions** — not applicable; no component, CSS or story is
  touched.
- **Conventional commits** — scope `release` or `ci` as appropriate; subject lowercase.

No violations to justify.

## Project Structure

### Documentation (this mission)

```
kitty-specs/release-pipeline-rc-stream-01M2DYQ2/
├── plan.md              # This file
├── spec.md              # Authored
├── meta.json            # CLI-owned
└── tasks/               # Phase 2 output (/spec-kitty.tasks — NOT created here)
```

### Source Code (repository root)

```
.github/workflows/
├── release-rc.yml            # NEW — push to develop; packages: write; publishes --tag rc
└── release.yml               # UNTOUCHED — prod path, owned by REL3 (#364); see IC-01

scripts/
├── release-graph.mjs         # UNCHANGED — consumed for --projects / --dirs / --json
├── bump-prerelease.mjs       # NEW — lockstep prerelease bump, with --selftest
└── check-release-graph.mjs   # UNCHANGED — already asserts packed contents

.npmrc                        # EDITED — @spec-kitty scope to npm.pkg.github.com
packages/*/package.json       # EDITED by the bump at release time, not by hand
package-lock.json             # REGENERATED by the bump (npm install --package-lock-only)
```

**Structure Decision**: a new workflow rather than a branch condition inside `release.yml`. The two
streams differ in trigger (branch push vs. tag), identity (`GITHUB_TOKEN` vs. whatever REL3 needs),
dist-tag, and attestation posture. Folding both into one file would put four conditionals around
every step; `release.yml` keeps the prod path and this mission does not repurpose it.

## Complexity Tracking

*No Charter Check violations. Table intentionally empty.*

## Implementation Concern Map

> Implementation concerns are NOT work packages. `/spec-kitty.tasks` translates these into
> executable WPs.

### IC-01 — Registry cutover (`.npmrc` only)

- **Purpose**: Point the `@spec-kitty` scope at GitHub Packages.
- **Relevant requirements**: FR-005
- **Affected surfaces**: `.npmrc` — **one line, and nothing else**
- **Sequencing/depends-on**: none
- **Narrowed during implementation, and why.** This concern originally included cutting
  `release.yml` over too. That was scope creep at the time and the edits were reverted — but the
  judgement was **overturned by the operator on 2026-09-13**, after pass-3 review measured that this
  mission's own `publishConfig` addition already retargets prod's destination while leaving its
  credentials pointed at npmjs. The inconsistency below stopped being harmless the moment
  `publishConfig` landed. `release.yml` is now retargeted in this mission; FR-006 is reinstated in
  spec.md with the ruling recorded; FR-044's control moves to `actions/attest-build-provenance`
  under #364 scope item 3, and the gate no longer asserts an invocation that cannot succeed on this
  registry (it asserts prod still publishes).
- **Risks**: leaving `.npmrc` on GitHub Packages while `release.yml` still names npmjs is a real
  inconsistency — but a harmless one today, because `release.yml` is tag-triggered, has never run,
  and has no credential (`NPM_TOKEN` has never existed). Say so in the PR rather than fixing it
  here.

### IC-02 — Lockstep prerelease versioning

- **Purpose**: Move all buildable packages to the same next prerelease and keep the workspace lockfile consistent.
- **Relevant requirements**: FR-003, FR-004, FR-008
- **Affected surfaces**: `scripts/bump-prerelease.mjs` (new), `packages/*/package.json`, `package-lock.json`
- **Sequencing/depends-on**: none (can be built and tested before the workflow exists)
- **Risks**: this is the only genuinely new logic. Lockstep must be asserted, not assumed — a bump that silently skips a package yields a split version set that publishes happily. The single root lockfile means `npm install --package-lock-only` must run *after* all manifests are written, not per-package.

### IC-03 — rc publish workflow

- **Purpose**: Trigger on push to `develop`, build the buildable set, and publish every publishable package under dist-tag `rc`.
- **Relevant requirements**: FR-001, FR-002, FR-009
- **Affected surfaces**: `.github/workflows/release-rc.yml` (new)
- **Sequencing/depends-on**: IC-01, IC-02
- **Risks**: `permissions: packages: write` is the single load-bearing line — without it the job fails at authentication. `--tag rc` must never be omitted, or the first publish silently claims `latest`. Actions must be pinned by SHA to satisfy the existing pin gate.

### IC-04 — Gate coverage for the new logic

- **Purpose**: Make the bump script's behaviour verifiable on a pull request, so the release path is not first exercised in production.
- **Relevant requirements**: FR-003, FR-008
- **Affected surfaces**: `scripts/bump-prerelease.mjs --selftest`, `.github/workflows/ci-quality.yml`
- **Sequencing/depends-on**: IC-02
- **Risks**: the repository's standing lesson is that a guard keying on author-typed metadata is worthless — probes must assert the script's *emitted* output and observed file state, and the selftest must be wired into a job that actually runs on PRs, or it is a comment.
