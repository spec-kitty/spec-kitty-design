---
work_package_id: WP01
title: 'rc stream: registry cutover, lockstep prerelease bump, and the develop-triggered publish workflow'
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-008
- FR-009
planning_base_branch: mission/release-pipeline-rc-stream
merge_target_branch: mission/release-pipeline-rc-stream
branch_strategy: Planning artifacts for this mission were generated on mission/release-pipeline-rc-stream. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/release-pipeline-rc-stream unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
history: []
agent_profile: node-norris
authoritative_surface: .
create_intent:
- scripts/bump-prerelease.mjs
- .github/workflows/release-rc.yml
execution_mode: code_change
model: ''
owned_files:
- .npmrc
- .github/workflows/release-rc.yml
- .github/workflows/ci-quality.yml
- scripts/bump-prerelease.mjs
- scripts/check-gate-wiring.mjs
- scripts/check-gate-wiring-defeats.mjs
role: implementer
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 — rc stream publish (REL2, issue #363, epic #361)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `node-norris`
- **Role**: `implementer`
- **Agent/tool**: `claude`

`node-norris` is the closest built-in match — plain Node `.mjs` shelling out to `npm`/`git`, plus
Bash and workflow YAML. Nothing here uses an API framework; treat that part of the profile as
not applicable.

---

## Objective

Publish the rc half of the dual-stream pipeline. On a push to `develop`, bump
`@spec-kitty/{tokens,styles,elements}` in lockstep to the next semver prerelease and publish all
four publishable packages to `https://npm.pkg.github.com` under dist-tag **`rc`**, authenticating
as `GITHUB_TOKEN` with `packages: write`. One PR into `train/elements-first`, four commits (one per
subtask), one WP.

## Context

Read `spec.md` and `plan.md` in this mission directory before writing code. The premises there were
**measured against the repository on 2026-09-13**, not assumed, and several contradict what the
repo's older documents imply:

- **Nothing has ever been published**; `GET /orgs/spec-kitty/packages?package_type=npm` returns `[]`.
- **`NPM_TOKEN` has never existed.** The repo has zero Actions secrets. `release.yml` references it,
  so that workflow could never have authenticated — you are deleting a reference, not a credential.
- **No version-bump machinery exists anywhere**: no `npm version`, no `--package-lock-only`, no
  semver code in `scripts/`, and `nx.json` has no `release` config. T002 writes it.
- Root is an **npm workspace** (`packages/*`, `apps/*`, `fixtures/*`) with **one** lockfile.
- All four packages already pack real contents (`check-release-graph.mjs`: tokens 37 files, styles
  289, elements 57, react 66). Three build; `@spec-kitty/react` ships `files: ["src/"]` and has no
  build target.
- `develop` exists, cut 2026-09-13 at `25120c70`.

**This WP does not create packages as public, does not flip package visibility, and does not touch
REL1's promotion App.** First publish creates each package **private**; making them public is
irreversible, needs the org to permit it, and is an operator act outside this mission.

**Commit-scope rule** (`commitlint.config.cjs` / CLAUDE.md §3): scopes are limited to `tokens`,
`storybook`, `doctrine`, `ci`, `docs`, `release`, `deps`, `security`, `styles`, `elements`, `react`,
`acceptance`, `merge`, `team-overview`. Use **`release`** for `.npmrc` and the publish workflows,
**`ci`** for `ci-quality.yml` and `scripts/**`. `spec`, `specs`, `chore` and `test` are not scopes.
Run `npx commitlint --from=origin/train/elements-first --to=HEAD` after every commit; fix failures
with a new commit, never `--amend` one a hook already rejected.

**Fold-in rule** (operator standing order): fix small, domain-matched debt in the same commit rather
than deferring. If something is mission-sized or outside this WP's domain, name it and stop — do not
invent a "follow-up" without a concrete owning issue. REL3 (#364) owns the prod/`latest` stream and
artifact attestations; do not absorb them.

**Guard-design rule** (learned the hard way on #438, six gate rounds): *a guard must key on
something the shipped code emits, never on something the test author types.* Probe names, declared
expectations and invocation counters are all defeatable metadata. Assert emitted output and
observed file state.

---

### Subtask T001 — Registry cutover (IC-01)

**Purpose**: point the `@spec-kitty` scope at GitHub Packages and remove the npmjs-era wiring that
provably cannot work.

**Steps**:
1. `.npmrc`: change `@spec-kitty:registry=https://registry.npmjs.org/` to
   `@spec-kitty:registry=https://npm.pkg.github.com`. **That is the whole subtask.**
2. **Do not touch `.github/workflows/release.yml`.** An earlier revision of this WP told you to cut
   it over as well. Doing so turns `check-release-graph.mjs` red with `release.yml has no step
   running publish with provenance`: the gate **enforces** FR-044, which ADR-5 ratifies as a
   supply-chain control. Retiring it is an ADR amendment and belongs to REL3 (#364).

**Files**: `.npmrc`.

**Red-first test expectation**: declarative config; no unit test. Non-fakeable evidence is that
`grep -n 'registry.npmjs.org' .npmrc` returns nothing and the scope line names `npm.pkg.github.com`.

**Definition of Done**: `.npmrc` names `npm.pkg.github.com`; `bash scripts/check-action-pins.sh`
green; `node scripts/check-release-graph.mjs` green; `node scripts/check-release-graph.mjs
--selftest` green (28 probes trip). Note the DoD deliberately does **not** grep the whole
`.github/workflows/` tree for `--provenance` — that string legitimately remains in `release.yml`.

---

### Subtask T002 — Lockstep prerelease bump (IC-02)

**Purpose**: move every buildable package to the **same** next prerelease and keep the single
workspace lockfile consistent.

**Steps**:
1. Create `scripts/bump-prerelease.mjs`. Derive the package set from `release-graph.mjs` — import
   it, do not re-scan and do not hand-list.
2. Compute the next prerelease from the current versions. All buildable packages must already agree;
   **refuse** if they do not, naming the divergent set.
3. Write each `package.json`, then run `npm install --package-lock-only` **once**, after all
   manifests are written.
4. Refuse an empty package set (reuse the fail-closed accessors that already exist).
5. Print the resulting version and the packages it was applied to.

**Files**: `scripts/bump-prerelease.mjs` (new), `packages/*/package.json` and `package-lock.json`
(written at run time, not committed by this subtask).

**Red-first test expectation**: before this subtask `node scripts/bump-prerelease.mjs --selftest`
exits non-zero with "not found". T003 supplies the probes.

**Definition of Done**: running it in a clean tree moves all three buildable packages to one
identical prerelease, regenerates the lockfile, and leaves `git status --porcelain` showing exactly
those files and no others.

---

### Subtask T003 — Probe table for the bump (IC-04, depends on T002)

**Purpose**: make the bump verifiable on a pull request, so the release path is not first exercised
in production.

**Steps**:
1. Add `--selftest` to `scripts/bump-prerelease.mjs`: a probe table over scratch fixture trees,
   asserting **observed file state and emitted output**, never a declared expectation.
2. Cover at minimum: a clean lockstep bump; a divergent-version set (must refuse); an empty package
   set (must refuse); the lockfile being regenerated after — not before — the manifests.
3. Put the probe floor **outside** the table, and refuse a degenerate split.
4. Wire `node scripts/bump-prerelease.mjs --selftest` into `ci-quality.yml` as an `[ENFORCED]` step
   in a job that runs on pull requests.
5. Register that step in `scripts/check-gate-wiring.mjs` and add its deletion to
   `check-gate-wiring-defeats.mjs`, so the step cannot be silently removed.

**Files**: `scripts/bump-prerelease.mjs`, `.github/workflows/ci-quality.yml`,
`scripts/check-gate-wiring.mjs`, `scripts/check-gate-wiring-defeats.mjs`.

**Red-first test expectation**: reverting each individual guard in the bump script must red exactly
one probe, demonstrated by running the mutation, not by reasoning about it.

**Definition of Done**: `--selftest` green; each guard's reversion reds its probe; gate-wiring
selftest and defeat table both green with the new entries counted.

---

### Subtask T004 — The rc publish workflow (IC-03, depends on T001–T003)

**Purpose**: trigger on push to `develop` and publish every publishable package under `rc`.

**Steps**:
1. Create `.github/workflows/release-rc.yml`, `on: push: branches: [develop]`.
2. Declare `permissions: { contents: read, packages: write }`. **`packages: write` is the single
   load-bearing line — without it `GITHUB_TOKEN` cannot publish at all.**
3. Pin every action by full commit SHA with a trailing `# owner/repo vX.Y.Z` comment; the pin gate
   rejects `@v[0-9]`.
4. `setup-node` with `registry-url: https://npm.pkg.github.com`; `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`.
5. `npm ci --ignore-scripts`; build the buildable set from `release-graph.mjs --projects`; run the
   T002 bump.
6. Publish each package from `release-graph.mjs --dirs` with `npm publish --tag rc`. **Never omit
   `--tag`** — the first publish would otherwise claim `latest`.
7. Do not add `--provenance`; it is unsupported on this registry.

**Files**: `.github/workflows/release-rc.yml` (new).

**Red-first test expectation**: declarative. Non-fakeable evidence is `check-action-pins.sh` green
and the absence of `latest` in any dist-tag the workflow can set.

**Definition of Done**: the workflow exists, is SHA-pinned, declares `packages: write`, publishes
with `--tag rc`, and `node scripts/check-release-graph.mjs` still passes.

---

## NOT the implementer's job

- Flipping any package to public — irreversible, needs org permission, operator act.
- Creating or configuring REL1's GitHub App, or enabling automatic `train → develop` promotion.
- REL3's prod/`latest` stream and artifact attestations (#364).
- Applying a ruleset to `develop`.
- **Any edit to `.github/workflows/release.yml`**, including its registry, its dead `NPM_TOKEN`
  reference, and `--provenance`. REL3 (#364) owns the prod path.
- **Retiring FR-044 / amending ADR-5.** Provenance is unsupported on GitHub Packages, so REL3 must
  resolve it — with an ADR amendment and an operator decision, not a deleted flag.
