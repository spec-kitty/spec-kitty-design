# Implementation Plan: elements-first-release

**Mission Branch**: `mission/elements-first-release`
**Spec**: `kitty-specs/elements-first-release-01M1Q451/spec.md`
**Created**: 2026-09-04

## Summary

Make the release pipeline produce the epic's output, and make a pull request able to tell you
whether it still does.

The central technical decision is to **remove the disagreement rather than detect it**. `release.yml`
today carries three hand-written package lists — a build `--projects=`, two publish steps, an audit
loop — and they already differ. A gate that compares three lists is a gate that has to be kept in
step with three lists. Instead one module derives the publishable set from `packages/*/package.json`,
the workflow consumes it, and the gate asserts properties of the derived set. There is then no
second list to drift from.

Everything else follows from that: if the set is derived, `"private": true` on `elements` and
`react` is the thing that removes them from it, and the gate that refuses an empty set is the thing
that notices.

## Technical Context

**Language/Version**: Node 22 (CI), ES2022 modules; workflow YAML
**Primary Dependencies**: npm 10.9.x CLI (what `node-version: 22` provides) (`npm pack --dry-run --json`), `yaml` (already used by `check-gate-wiring.mjs`), Playwright chromium (already in CI), `@cyclonedx/cyclonedx-npm`
**Storage**: N/A — committed generated artifacts only (`SIZES.md`, `CHANGELOG.md`)
**Testing**: static gates as `scripts/*.mjs` with `--check`/`--selftest`, matching the repo's existing generated-artifact contract; one Playwright-driven offline probe. **No additions to the vitest behaviour suite** — see IC-05.
**Target Platform**: GitHub Actions `ubuntu-latest`; consumers on npm, a CDN, and `file://`
**Project Type**: single (monorepo tooling)
**Performance Goals**: the new PR-time gate adds under 60s to `lint-code`; `npm pack --dry-run` is local and hits no registry
**Constraints**: no npm write access (C-001); no tag, no train landing (C-002); version stays 1.0.0 (C-003); brand assets preserved (C-004)
**Scale/Scope**: 4 packages, 1 workflow, ~5 new scripts, 1 new CI job

## Charter Check

| Charter requirement | Bearing | Status |
|---|---|---|
| ADR-2: independently publishable packages per target | This mission is what makes `elements` and `react` publishable at all | Advanced |
| ADR-2 pre-flight: `@spec-kitty` scope owned before publishing | Gates the **tag**, not this mission (#80's 2026-09-02 correction) | Out of scope, C-001 |
| ADR-5 FR-041: `npm audit` gate before publish | Must apply to the derived set, not a subset — NFR-003 | Extended |
| ADR-5 FR-044: `npm publish --provenance` | Already correct; guards are the GHA OIDC token and `--access public`, both set. **Not** the `repository` field — verified in `libnpmpublish@10.0.2`, the version npm 10.9.x bundles and therefore what `node-version: 22` gives CI, and an earlier claim of mine to the contrary is retracted | Unchanged |
| ADR-5 FR-045: CycloneDX SBOM as a Release artifact | Already correct; unchanged | Unchanged |
| ADR-5 contents audit: `npm pack --dry-run`, no secrets/sourcemaps/dev files | Currently loops two packages; becomes the derived set and gains assertions — FR-004, SC-010 | Extended |
| ADR-5 2FA on the scope | Operational policy, operator's | Out of scope |
| ADR-10 §2: both distribution entries (ESM + classic script) | The IIFE is built and then dropped from the publish set; SC-002 asserts it resolves inside the tarball | Advanced |
| Charter: Storybook CI build under 3 minutes | Untouched — the new gate is a separate job | Unaffected |

## Project Structure

### Documentation (this mission)

```
kitty-specs/elements-first-release-01M1Q451/
├── spec.md
├── plan.md
├── research/
├── decisions/
└── tasks/
```

### Source Code (repository root)

```
scripts/
├── release-graph.mjs              NEW — derives the publishable set; the single source
├── check-release-graph.mjs        NEW — the PR-time gate + --selftest probes
├── check-offline-load.mjs         NEW — file:// no-network probe (Playwright)
└── check-gate-wiring.mjs          CHANGED — generalised from one job name to a list

packages/
├── elements/package.json          CHANGED — private removed
├── react/package.json             CHANGED — private removed
├── styles/package.json            CHANGED — subpath exports for all 15 component dirs
└── tokens/src/…                   CHANGED — the dead @import removed

.github/workflows/
├── release.yml                    CHANGED — consumes the derived set; no hand-written lists
└── ci-quality.yml                 CHANGED — new release-gate job, wired into `gate`

docs/
└── release-runbook.md             NEW
CHANGELOG.md                       NEW
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| A new CI job rather than a step in `lint-code` | The offline probe needs a browser, and `lint-code` runs `npm ci --ignore-scripts`, so no browser is installed there | Adding a browser install to `lint-code` slows the repo's most-run job for one probe. Putting the probe in the existing `playwright` job was rejected because that job is `needs: [storybook-build]` and skips when no component changed — a packaging-only PR is exactly the PR this gate exists for, and it would skip on it |
| The SRI hash committed to a generated record | SC-007 requires the hash be re-derived by a check rather than transcribed | A hash written into prose is the "companion number nothing re-derives" that `suite-budget.json` argues against at length. This follows `SIZES.md`'s existing contract instead |

## Implementation Concern Map

### IC-01 — One derived package set

- **Purpose**: replace three hand-written package lists in `release.yml` with one derived source, so a package cannot be in the build list and absent from the publish list.
- **Relevant requirements**: FR-001, FR-002, NFR-003
- **Affected surfaces**: `scripts/release-graph.mjs`, `.github/workflows/release.yml`, `packages/elements/package.json`, `packages/react/package.json`
- **Sequencing/depends-on**: none — everything else reads this
- **Risks**: `private: true` has been on `elements` since the package was introduced at #70 with **no recorded rationale**, and on `react` since #126. Neither ADR nor charter records a reason. The plan reads it as "not ready to publish yet" and this mission as the thing that changes that — but if there is an unrecorded reason it belongs to the operator, so removal is raised on #80 before it is relied on.

### IC-02 — Assert the tarball, never the exit code

- **Purpose**: `npm publish` on a private package exits 0. Any gate reading exit codes is green over an empty set, so every assertion must be made against packed contents.
- **Relevant requirements**: FR-004, NFR-001, SC-001, SC-002, SC-010
- **Affected surfaces**: `scripts/check-release-graph.mjs`
- **Sequencing/depends-on**: IC-01
- **Risks**: `exports` targets contain wildcards (`./dist/*`), which cannot be resolved literally against a file list. Patterns must be expanded and a pattern matching **zero** files must fail — the same empty-set rule one level down. This is where the gate is most likely to certify absence.

### IC-03 — The gate runs on pull requests, and reds when reverted

- **Purpose**: end the condition that `release.yml` has never been executed by any check.
- **Relevant requirements**: FR-003, SC-003, SC-005
- **Affected surfaces**: `.github/workflows/ci-quality.yml`, `scripts/check-gate-wiring.mjs`
- **Sequencing/depends-on**: IC-01, IC-02
- **Risks**: two. A new job that is not in `gate`'s `needs` cannot block a merge — `check-gate-wiring.mjs` exists because that already happened once, and it is currently hard-coded to the single job name `test`, so it must be generalised or it will not see the new job. And a job placed behind the `changes` filter would skip on the PR shape it exists to catch; this one must be unconditional.

### IC-04 — The offline consumer, proven by interception

- **Purpose**: prove a `file://` page loads the classic-script bundle with zero network requests, and record an SRI hash for the CDN path.
- **Relevant requirements**: FR-005, NFR-002, SC-006, SC-007
- **Affected surfaces**: `scripts/check-offline-load.mjs`, `scripts/measure-elements-sizes.mjs`, `packages/elements/SIZES.md`
- **Sequencing/depends-on**: IC-01
- **Risks**: **this criterion currently passes by accident.** The graph's only network dependency is `tokens.css`'s Google Fonts `@import`, which is invalid and dropped (verified in Chromium: 32 rules, 0 imports, the route never fired). A probe written today would go green without proving anything, and would stay green until someone repositioned the `@import`. The probe must therefore be red-first against a deliberately network-dependent fixture, not merely observed green against the current tree.

### IC-05 — Where new tests are allowed to live

- **Purpose**: keep this mission's verification out of the vitest behaviour suite.
- **Relevant requirements**: all — this is a constraint on how the others are verified
- **Affected surfaces**: `scripts/*.mjs`, `.github/workflows/ci-quality.yml`
- **Sequencing/depends-on**: none
- **Risks**: `suite-selftest.mjs` runs the whole suite once per mutation, so every test added to that suite is re-run inside all 70 mutations — the `O(mutations × tests)` growth filed as #168, which has already pushed the harness ceiling 180 → 240 → 360 → 560. None of this mission's verification is behavioural; it is packaging and workflow assertions. It belongs in `scripts/` with `--selftest` probes, the pattern `build-react-wrappers.mjs` and `check-adopted-css-boundaries.mjs` already use.

### IC-06 — Consumer-facing surfaces

- **Purpose**: the runbook, CHANGELOG, single-version policy, and the honest limits of a dry run.
- **Relevant requirements**: FR-006, FR-007, FR-008, NFR-004, SC-009
- **Affected surfaces**: `docs/release-runbook.md`, `CHANGELOG.md`
- **Sequencing/depends-on**: IC-01 through IC-04 — it documents what they make true
- **Risks**: writing the runbook as though a dry run proved publishability. It does not: `--dry-run` short-circuits before `ensureProvenanceGeneration`, verified by running it with a full GitHub Actions environment faked. The runbook must state that it proves packing, not publishing, or it will be read as a green light it cannot give.

### IC-07 — Two fixes that are not this mission's to decide

- **Purpose**: separate the mechanical from the editorial.
- **Relevant requirements**: FR-009, FR-010, C-004
- **Affected surfaces**: `packages/tokens/src/…`, `packages/styles/package.json`
- **Sequencing/depends-on**: none
- **Risks**: **The mono font is a brand decision, not an engineering one.** Deleting the dead `@import` is mechanical and changes no observable behaviour — it loads nothing today, proven. Whether JetBrains Mono should be self-hosted, or dropped from `--sk-font-mono` so the token declares what actually resolves, is the operator's; raised as a fork on #80 and not decided here. Likewise `assets/logo.png`: 1.48 MB, referenced nowhere, but FR-105 records the three brand assets as a deliverable, so C-004 makes any reduction a fork rather than a cleanup.
