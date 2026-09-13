# REL2 — rc stream: lockstep prerelease publish to GitHub Packages

**Mission**: `release-pipeline-rc-stream-01M2DYQ2` · part of epic #361 · issue #363 · after REL1 (#362)
**Branch**: `mission/release-pipeline-rc-stream`, PR into `train/elements-first`
**Delivery**: one bounded Work Package, one PR

## Purpose

Publish the **rc half** of the dual-stream release pipeline: on a push to `develop`, bump
`@spec-kitty/{tokens,styles,elements}` in lockstep to the next semver prerelease and publish all
four publishable packages to `https://npm.pkg.github.com` under dist-tag **`rc`**, never `latest`.

## State of the world, verified 2026-09-13 (not assumed)

These were measured against the repository tonight and are the premises the plan rests on.

| Fact | Evidence |
|---|---|
| Nothing has ever been published | `GET /orgs/spec-kitty/packages?package_type=npm` → `[]` |
| `NPM_TOKEN` has never existed | repo has **zero** Actions secrets; `release.yml` references it, so that workflow could never have authenticated |
| No repo variables are set | zero Actions variables — the REL1 promotion switch is unset, so nothing auto-fires |
| `develop` exists, at the train tip | cut this session at `25120c70`, tree identical to `train/elements-first` |
| **No version-bump machinery exists anywhere** | no `npm version`, no `--package-lock-only`, no semver code in `scripts/`, and `nx.json` has no `release` config |
| Root is an npm **workspace** | `workspaces: ["packages/*","apps/*","fixtures/*"]`, root `private: true` — one lockfile to keep in sync |
| All four packages pack real contents | `check-release-graph.mjs`: tokens 37 files, styles 289, elements 57, react 66 — "all packing, all exports resolving" |
| Three of four build; `react` does not | `release-graph.mjs --projects` → `tokens,styles,elements`; `@spec-kitty/react` ships `files: ["src/"]` as committed source |
| `release.yml` still targets npmjs | `registry-url: registry.npmjs.org`, `NODE_AUTH_TOKEN: secrets.NPM_TOKEN`, `--provenance`, and **no** `packages:` permission |
| `.npmrc` still points the scope at npmjs | `@spec-kitty:registry=https://registry.npmjs.org/` |

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | A workflow triggered by **push to `develop`** builds the buildable set and publishes all publishable packages to `https://npm.pkg.github.com` with `--tag rc`. | High |
| FR-002 | The workflow declares `permissions: packages: write`. Without it `GITHUB_TOKEN` cannot publish — this is the single most load-bearing line in the mission. | High |
| FR-003 | Versions are bumped in **lockstep**: all three buildable packages move to the same next prerelease (e.g. `1.1.0-rc.1`), derived — never hand-listed — from `release-graph.mjs`. | High |
| FR-004 | `package-lock.json` is regenerated (`npm install --package-lock-only`) and committed in the same change, so the workspace lockfile never drifts from the bumped manifests. | High |
| FR-005 | The root `.npmrc` scope mapping moves off `registry.npmjs.org` to `npm.pkg.github.com`. | High |
| ~~FR-006~~ | **Withdrawn — moved to REL3 (#364).** An earlier revision of this spec required removing `--provenance` and `id-token: write` from `release.yml`. Implementation showed why that is not this mission's to make: `check-release-graph.mjs` **enforces** provenance in `REQUIRED_STEPS`, and FR-044 is a *ratified* control — ADR-5 (npm supply-chain posture) names it as a mitigation, `system-context-canvas.md` lists it as a quality attribute, `release-runbook.md` documents it, and a mission-review record marks it ADEQUATE. Retiring it is an ADR amendment, not a workflow edit. | — |
| ~~FR-007~~ | **Withdrawn — moved to REL3 (#364).** Same reason: `release.yml` is the tag-triggered *prod* path. #363's scope names `.npmrc`, not `release.yml`; editing it was scope creep introduced by this spec, and it broke a green gate. | — |
| FR-008 | Publishing refuses over an empty package set, reusing `release-graph.mjs`'s existing fail-closed accessors rather than a second list. | High |
| FR-009 | The rc publish never writes dist-tag `latest`. | High |

## Acceptance essentials

- A push to `develop` yields rc prereleases in the spec-kitty GitHub Packages npm registry.
- All three buildable packages carry the **same** prerelease version; `@spec-kitty/react` publishes from committed source.
- Every published version is reachable under `rc`, and `latest` is absent.
- `git status --porcelain` is clean after the bump and lockfile regeneration.
- The action-pin gate stays green.

## Constraints and consequences the operator must know

- **Consumers need a token even for public packages.** GitHub's own documentation: *"You need an access token to publish, install, and delete private, internal, and public packages."* Downstream projects require a PAT with `read:packages` and `@spec-kitty:registry=https://npm.pkg.github.com` in their `.npmrc`. This is not a drop-in replacement for npmjs, and it is true regardless of visibility.
- **Packages are created private on first publish.** Flipping to public is **irreversible** and needs the org to permit public packages. This mission deliberately leaves them private: rc consumers are org members, and private is the reversible direction. Making them public is an operator act, out of scope.
- **Non-`latest` dist-tags do not appear in the GitHub web UI version list.** An rc publish will look absent in the browser; verify with `npm view @spec-kitty/tokens dist-tags`.
- **`develop` does not yet track the train automatically.** REL1's promotion job needs a GitHub App that does not exist. Until it does, `develop` is advanced by an explicit push, which is what triggers this workflow. That is a limitation of the trigger's *frequency*, not of its correctness.
- `@spec-kitty/tokens` packs 3.8 MiB. Not a blocker, but worth watching if it grows.

## Out of scope

- The prod/`latest` stream and artifact attestations — REL3 (#364).
- Automatic `train → develop` promotion — REL1's App, pending.
- Flipping package visibility to public — operator act, needs org permission.
- **Any change to `release.yml` at all** — it is the tag-triggered prod path and REL3 owns it. This
  includes the registry cutover, the dead `NPM_TOKEN` reference, and `--provenance`.
- **Retiring FR-044 (npm provenance).** It is unsupported on GitHub Packages, so REL3's prod cutover
  must deal with it — but it is a control ratified by ADR-5 and asserted by
  `check-release-graph.mjs`. Retiring it requires an ADR amendment and an operator decision, and
  the replacement (GitHub artifact attestations) is already REL3's scope. **Named exclusion with a
  concrete owner, not a deferral.**

## Recorded decisions this mission inherits

- **2026-09-11, operator**: GitHub Packages only, no npmjs. One package per name; rc and prod separated **only by dist-tag**, not by separate package names.
- **#361 amendment**: rc and prod publish the same packages; the streams differ by tag.
