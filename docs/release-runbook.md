# Release runbook

How `@spec-kitty/*` gets from a merged mission to a published package. Written for the operator;
every step says who runs it and what it actually proves.

## What triggers a release

**A tag, not a merge.** `.github/workflows/release.yml` fires on `push: tags: ['v*.*.*']` and on
nothing else. Merging to `main` publishes nothing.

That is deliberate. Publishing on merge would mean an integration branch could release itself before
it had been reviewed as a whole, and it would put registry credentials inside every mission. No
mission needs npm write access, and none has it.

## The sequence

| # | Step | Who | What it proves |
|---|---|---|---|
| 1 | Land `train/elements-first` on `main` | operator | the epic is integrated |
| 2 | Create the `spec-kitty` npm organisation | operator, **once** | the scope exists to publish into |
| 3 | Enable 2FA on the org | operator, once | ADR-5 operational policy. Note: since the 2026-09-13 move to GitHub Packages this is GitHub org 2FA, not npm-account 2FA — there is no `@spec-kitty` npm account in the publish path any more. |
| 4 | ~~Add a granular publish token as `NPM_TOKEN`~~ **No longer required (2026-09-13).** `release.yml` publishes to GitHub Packages with the built-in `GITHUB_TOKEN`; no `NPM_TOKEN` secret has ever existed in this repository. Consumers still need a token carrying `read:packages` — GitHub Packages requires auth even for public packages. | — | — |
| 5 | Re-run the release for the **existing** `v1.0.0` tag (see below) | operator | starts the release |
| 6 | The workflow builds, audits, SBOMs, publishes, and creates a GitHub Release | CI | see below |

**Step 1 carries a hidden precondition (F-B)**: `train/elements-first` cannot land on `main` by a
merge commit — `main-is-safe`'s `required_linear_history` rule forbids it — so the landing is a
squash or rebase (`allowed_merge_methods: ["squash", "rebase"]`). Either way, the commit that
reaches `main` does NOT carry `train/elements-first`'s ancestry the way every commit on the train
currently does, and `scripts/check-ci-quality-trigger-parity.mjs`'s anchor tag
(`parity-anchor/rel1`) is only a real ancestor of commits ON the train. The landing PR ITSELF
still shows green — it runs against the train's own history, where the anchor still applies. The
break shows up on the FIRST PUSH TO `main` after the landing, when that check's
is-ancestor-of-`HEAD` test runs against `main`'s new tip for the first time and fails with "not
an ancestor of HEAD" — mysterious-looking unless this step has already been planned for:

1. Once the landing commit exists on `main`, create a NEW tag under `refs/tags/parity-anchor/*`
   (e.g. `parity-anchor/rel2`) at that commit — `git tag parity-anchor/rel2 <main's new sha>`.
   Creating the LOCAL tag is not itself blocked; PUSHING it is what the
   `parity-anchor-tags-are-immutable` ruleset (`docs/architecture/branch-model.md`) forbids —
   it covers the whole prefix with a `creation` rule too. An admin must, in order: disable or
   edit that ruleset (a deliberate, logged act) — `git push origin parity-anchor/rel2` — restore
   the ruleset. A tag that is only ever created locally and never pushed satisfies nothing in
   CI: `resolveAnchorTagSha()` resolves `refs/tags/...` in the CHECKOUT it runs in, which for
   every real workflow run is a fresh clone from the remote.
2. In one commit: update `PRE_MISSION_TAG`/`PRE_MISSION_SHA` in
   `scripts/check-ci-quality-trigger-parity.mjs` to the new tag/commit, and fully re-capture
   `BASELINE`/`ON_BASELINE` from that commit's real `.github/workflows/ci-quality.yml` (see that
   file's own REBASELINING note).
3. Run `node scripts/check-ci-quality-trigger-parity.mjs --selftest` before pushing that commit.
4. **Operator, standing check — `bypass_actors` (F-E, incident 3)**: PR-time CI
   (`--check-parity-anchor-tags` in `lint-code`) cannot see this field at all — GitHub only
   returns it to a write-access-authenticated request, and a PR-time workflow token is
   deliberately not that (see `docs/architecture/branch-model.md`). Run
   `gh api repos/spec-kitty/spec-kitty-design/rulesets/<id> --jq .bypass_actors` yourself
   (an admin-authenticated read) and confirm it prints `[]` — for BOTH the tag ruleset above and
   `develop`'s ruleset once it exists — at every landing, and periodically otherwise, since
   nothing else in this repo ever checks it. `bypass_actors: []` is the entire "nobody can move
   this tag, admins included" security claim; a CI warning naming this gap is not the same thing
   as it having been checked.

Doing this as part of step 1 — rather than after CI on `main` reds and someone has to
reverse-engineer why — is the point of naming it here.

Steps 2–4 are one-time. Tag `v1.0.0` was pushed on 2026-09-01 and failed 50 seconds later with
`npm error 404 Not Found - PUT https://registry.npmjs.org/@spec-kitty%2ftokens` — a 404 on `PUT`
means the scope was not there to publish into. ADR-2 recorded scope ownership as a pre-flight and it
had not been done.

**So step 5 is not `git tag v1.0.0`** — that tag already exists on the remote and creating it again
fails with *"tag 'v1.0.0' already exists"*.

**And it is emphatically not "re-run the existing tag's workflow".** An earlier revision of this
runbook recommended exactly that, and it is destructive. `v1.0.0` points at `ccb055c`
(*"fix: make all three packages publishable and fully styled (#64)"*, 2026-09-01), which predates
this entire epic:

| | at `v1.0.0` (`ccb055c`) | at `main` today |
|---|---|---|
| packages | `angular`, `html-js`, `tokens` | `elements`, `react`, `styles`, `tokens` |
| `release.yml` publishes | `tokens`, `angular`, `html-js` | the derived set |

GitHub re-runs a workflow **at the run's original commit**, so re-running that run executes the old
workflow against the old tree. With the scope now created it would **succeed**, and it would:

- publish `@spec-kitty/angular@1.0.0` and `@spec-kitty/html-js@1.0.0` — packages that no longer
  exist — plus a stale `@spec-kitty/tokens@1.0.0`
- publish **none** of `@spec-kitty/elements`, `@spec-kitty/react` or `@spec-kitty/styles`, which did
  not exist at that commit
- **permanently occupy `1.0.0`.** npm does not allow republishing a version, and does not allow
  reusing an unpublished one. There is no undo.
- run none of the assertions described below — no derived set, no `check-release-graph.mjs`, no SRI
  check. They did not exist at that commit either.

**Step 5 is therefore: move the tag.**

```bash
git push --delete origin v1.0.0
git tag -d v1.0.0
git tag v1.0.0 <the merged main sha>
git push origin v1.0.0
```

Deleting a published tag is normally something to avoid. It is safe here, and only here, because
**nothing was ever published from it** — the run 404'd before any `npm publish` completed. Confirm
that first with `npm view @spec-kitty/tokens` returning `404` before deleting anything.

For every release after this one, step 5 is the ordinary `git tag vX.Y.Z && git push origin vX.Y.Z`.

## What the release workflow does

1. **`npm audit` gate** (ADR-5 FR-041) — fails on high or critical
2. **Resolves the publishable set** — `node scripts/release-graph.mjs`, derived from
   `packages/*/package.json`, refusing an empty result
3. **Builds** the buildable subset
4. **Contents audit** — `check-release-graph.mjs` asserts each tarball's contents (entry points
   resolve, no sourcemaps, tests or dev files), then `npm pack --dry-run` lists them for the log.
   The assertion is the gate; the listing is for a human reading the release afterwards
5. **CycloneDX SBOM** (ADR-5 FR-045)
6. **Packs** each package into a tarball file in `dist-tarballs/` (`scripts/pack-derived-set.mjs`),
   recording each file's SHA-512
7. **Attests** those tarballs with `actions/attest-build-provenance` (SHA-pinned), before anything is
   published. An attestation failure publishes nothing
8. **Publishes those exact files** to GitHub Packages under dist-tag `latest` through
   `scripts/publish-latest.mjs`. It publishes only the re-validated attested tarballs (never a package
   directory, which would repack in memory), in topological order, and halts on the first real failure
9. **Verifies** the registry holds the attested bytes: `scripts/verify-published-integrity.mjs`
   re-downloads each `name@version` and compares its SHA-512
10. **GitHub Release** with the SBOM attached

The rc stream (`release-rc.yml` → `publish-packages.yml`) runs the same pack, attest, publish and
verify steps, after its prerelease bump.

**FR-044 (provenance) is met by these attestations** (#364, 2026-09-19). `--provenance` was removed on
2026-09-13: it is the npmjs mechanism, and it is unsupported on GitHub Packages. The operator amendment
of 2026-09-11 on #361 replaced it with GitHub artifact attestations.

## Verifying a published package

Every tarball either stream publishes carries a GitHub artifact attestation, stored on
`spec-kitty/spec-kitty-design`. To check one, fetch the tarball from the registry (your `.npmrc`
must map `@spec-kitty` to `https://npm.pkg.github.com`) and verify it:

```sh
npm pack @spec-kitty/elements@1.1.0-rc.3          # writes spec-kitty-elements-1.1.0-rc.3.tgz
gh attestation verify spec-kitty-elements-1.1.0-rc.3.tgz --repo spec-kitty/spec-kitty-design \
  --signer-workflow spec-kitty/spec-kitty-design/.github/workflows/publish-packages.yml
```

`--repo` alone accepts an attestation from any workflow in the repository, on any ref, so pin the
signer. rc versions are signed by the reusable `publish-packages.yml`, and `latest` versions by
`release.yml`. Add `--source-ref refs/heads/develop` for rc, or `--source-ref refs/tags/vX.Y.Z` for
prod, to pin the ref as well. The release workflows' own verify step pins the signer workflow and the
exact commit (`--source-digest`).

A pass means the tarball's digest was attested by a workflow run in this repository. The output names
the workflow, ref and commit that built it. For any version published after attestations were added
(REL3, #364), a failure means the bytes you hold are not the bytes this repository's release workflows
published. **Versions published before that, `1.1.0-rc.0` to `1.1.0-rc.2`, carry no attestation**, so
`gh attestation verify` finds nothing for them.

**What an attestation does and does not prove.** It is SLSA Build Level 2 provenance: a signed
statement, from this repository's release workflow on a GitHub-hosted runner, that it produced these
exact bytes from the named commit. For rc versions, the named commit is the `develop` commit: the
prerelease version bump is applied on the runner and is never committed, so that commit's
`package.json` still shows the previous version. The attest step runs in the same job as the build, and
`id-token: write` reaches every step of that job. **The job, not the step, is the trust boundary**: the
attestation cannot vouch that no step in it misbehaved. The workflows keep that job small, and
`check-release-graph.mjs` enforces it on every PR:

- only two `(workflow, job)` pairs may publish — `release.yml:release` and
  `publish-packages.yml:publish`. Any other job in any workflow is refused when it declares
  `packages: write` or `attestations: write`, holds the registry credential (in an `env:` block, or
  written into the run text as `NODE_AUTH_TOKEN`, `_authToken` or a `${{ secrets.… }}` expansion), runs
  `npm publish`/`npm dist-tag`, runs one of the registry scripts, or signs an attestation. The same
  applies to every local action a workflow `uses:`, resolved by reference, and an unresolvable
  reference is itself a refusal. And no `scripts/…` token that could resolve to one of the registry
  scripts may be non-literal — a glob, a quoted split or an interpolation is unreadable to every rule
  that names a script — in a workflow, a local action or any package manifest's npm scripts.
  (`scripts/*.mjs` is refused because it could expand to a publisher; `scripts/*.md` and a bare
  directory are not.)

  **What this does not cover, stated rather than implied.** These are text and YAML rules over this
  repository's own files. The signals hold because a publish needs a credential, and a credential reaches
  a job either as `GITHUB_TOKEN` with `packages: write` — which must be declared, since this repository's
  default workflow permission is read — or as a secret the workflow file expands. **One case escapes
  both**: a *new* secret (a PAT) handed to a third-party action as an input, `with: token: ${{ secrets.… }}`,
  declares no privilege and puts nothing in a `run`. Its sibling is the same shape one step earlier: a
  secret under any name in an **unaudited** job's `env:`, consumed by a wrapper file — the env-value rule
  above is scoped to the two audited jobs precisely because the honest uses of that shape live outside
  them. The gate does not read `with:` values for secrets,
  and it should not: `ci-quality.yml`'s `promote-develop` job legitimately passes two secrets that way to
  `actions/create-github-app-token`, so the rule would refuse honest work. That case needs a new secret in
  repository settings, which is where the durable fence belongs: a GitHub `environment:` on the two
  audited jobs, or a publish-scoped secret rather than `GITHUB_TOKEN`. That is a repository-settings
  change rather than a code change, it is not in this mission's scope, and it is filed as #471.

  **The capability signal rests on a repository setting too.** `packages: write` is worth keying on
  because this repository's default workflow permission is `read`
  (`gh api repos/spec-kitty/spec-kitty-design/actions/permissions/workflow` → `"read"`, measured
  2026-09-20). An admin can change that in settings without touching a file here; every job would then
  hold the write scopes implicitly, and no gate in this repository would notice. Same remedy, same issue.

  The rules below apply **within** the two audited jobs;
- **the registry credential reaches exactly the steps that publish, and nothing else.** Two halves of one
  rule, kept together because they drifted apart once already: `NODE_AUTH_TOKEN` in an `env:` block is
  allowed only on a step whose `run` is exactly one of the registry scripts
  (`bump-prerelease.mjs --from-registry`, `publish-derived-set.mjs`, `publish-latest.mjs`,
  `verify-published-integrity.mjs`, `report-dist-tags.mjs`) — no shell step may hold it; and **no step
  may put a credential in its `run` at all**: not `NODE_AUTH_TOKEN` (which `$GITHUB_ENV` would re-export
  to every later step), not an `_authToken`/`_auth` line, and not a `${{ secrets.… }}`,
  `${{ github.token }}` or `toJSON(secrets)` expansion, since an `.npmrc` auth line authenticates npm
  without naming the variable. **Also refused** in
  these two jobs: **any** `env:` value that expands a secret or `${{ github.token }}`, under any name
  (`GH_TOKEN: ${{ github.token }}` is exempt by exact key, exact value **and exact step** — only on
  `run: node scripts/verify-published-integrity.mjs`, which is the one step in either workflow that needs
  it for `gh attestation verify`. `GH_TOKEN: ${{ secrets.ANYTHING }}` is refused, and so is the exempt
  key borrowed by any other step) — inside a publishing job a
  secret is the registry credential wearing a different hat, and `NODE_AUTH_TOKEN` on a registry-script
  step is the only one allowed. (That rule is deliberately scoped to the two audited
  jobs: `pr-preview.yml`'s `SURGE_TOKEN` and `ci-quality.yml`'s release App key are honest uses of the
  same shape.) What is *not* refused is a step that assembles such a value at runtime from pieces the
  gate cannot recognise — a step whose only purpose would be hiding from this rule;
- neither job may run `npm dist-tag add`, the other documented way to write a dist-tag, and neither may
  run `npm publish` inline in any spelling — flags before the subcommand, a flag whose value is a
  separate word, or anything between `npm` and `publish`. Both rules used to apply to the rc payload
  alone, which left prod — the job that owns `latest` — as the one place in the repository where a
  "Promote the release tag" step would have passed;
- no step may run a local (`./…`) action, whose steps the gate cannot read;
- checkout keeps no credentials;
- every `npx` and `npm exec` runs the lockfile's copy (`--no-install` / `--no`), never a package fetched at
  release time;
- (outside these two jobs, a secret reaches a step through `env:` on that step — inside them, only
  `NODE_AUTH_TOKEN` on a registry-script step may);
- neither job may set `GITHUB_REF`, `GITHUB_REF_TYPE`, `GITHUB_REF_NAME`, `GITHUB_WORKFLOW_REF`,
  `GITHUB_EVENT_PATH` or `GITHUB_RUN_ATTEMPT` in an `env:` block: those are the signals the publish
  scripts' own guards read, and a job that can author them can authorise itself.

It is still provenance, not a guarantee of a clean build. Attestations on this plan also need the repository to stay **public**;
making it private would stop new releases from being attestable.

There is one package list, and it is computed. Until #80 there were three hand-written ones and they
disagreed: `elements` was built on every release and never published, and `react` appeared in none of
them.

## What a dry run proves, and what it does not

`npm publish --dry-run` proves **packing, not publishing.**

It short-circuits before `ensureProvenanceGeneration` (`npm/lib/commands/publish.js` guards the
call with `if (!dryRun)`), verified by running it with a full GitHub Actions environment faked —
provenance was never exercised. So a green dry run says nothing about:

- **attestation** — needs a real GHA OIDC token (`id-token: write`)
- **authentication** — the built-in `GITHUB_TOKEN` with `packages: write` (was `NPM_TOKEN`, which never existed; changed with the 2026-09-13 registry move)
- **registry acceptance** — name availability, scope ownership, version collision

And on its own it does not even prove a package will be published. `npm publish` on a package marked
`"private": true` prints a warning and **exits 0**:

```
$ cd packages/elements && npm publish --dry-run; echo $?
npm warn publish Skipping workspace @spec-kitty/elements, marked as private
0
```

That is why `scripts/check-release-graph.mjs` asserts tarball **contents** and never an exit code,
and why it fails when a package is private without a recorded reason.

## Consumers: one major per page

`customElements.define` is global to the document and **throws** on a duplicate tag name. Two majors
of `@spec-kitty/elements` on one page is a hard runtime failure, not a degraded experience — the
second copy throws on registration and its elements never upgrade.

Practically: this package cannot be a transitive dependency at two versions. If you ship a library
that depends on it, take it as a **peer** dependency, not a direct one.

The bundle guards its own registrations (`define()` is guarded, ADR-10 §5), so a duplicate **load**
of the same version is safe. It is two different versions that cannot coexist.

## Distribution entries

| Entry | Path | For |
|---|---|---|
| ESM | `@spec-kitty/elements` | bundlers; `lit` stays external |
| Classic script | `@spec-kitty/elements/elements.js` | `<script>` tags, no bundler; Lit is bundled in |

The classic-script bundle works from `file://` with no network at all — asserted on every PR by
`scripts/check-offline-load.mjs`, which intercepts every request and requires the off-machine count
to be zero.

For a CDN load, pin it. The SRI hash is generated from the built artifact into
the **Subresource Integrity** section of `packages/elements/SIZES.md`, regenerated and `--check`ed by CI:

```html
<script src="https://cdn.example/@spec-kitty/elements@1.0.0/dist/elements.js"
        integrity="sha384-…"
        crossorigin="anonymous"></script>
```

Take the `integrity` value from `SIZES.md` at the tag you are loading. It changes with every
build of the bundle, so a hash copied from another version will be rejected by the browser — which
is the point.

## Install sizes

Not transcribed here on purpose. `scripts/check-release-graph.mjs` prints the packed size and file
count for every package on **every** pull request, so the figures are derived at the moment you need
them rather than carried in prose that goes stale silently.

One number is worth knowing before you look: `@spec-kitty/tokens` is by far the largest, and most of
it is the brand assets and 30 OTF font files that `FR-105` records as intended package contents.

## If the release fails

- **`404 Not Found - PUT`** — the scope does not exist, or the token cannot write to it. Steps 2–4.
- **The attest step fails with `missing "id-token" permission`, or a 403 on the attestations API** —
  the workflow lost `id-token: write` or `attestations: write`. For the rc stream, a CALLER
  (`release-rc.yml`) missing either fails workflow validation before any step runs, because a reusable
  workflow cannot exceed its caller. `check-release-graph.mjs` refuses either loss on the PR. Nothing
  was published: the attest step runs first.
- **The attest step fails for no reason in this repository** (Sigstore, Rekor or the attestations API
  unavailable) — nothing was published, because attesting comes first. Re-run once the service is
  back.
- **`… changed after packing` or `… does not list`** — something touched `dist-tarballs/` between the
  pack and the publish. The publish refuses rather than ship unattested bytes.
- **The verify step cannot confirm an attestation** (`could not confirm the published tarball and its
  attestation`), for example during an attestations-API outage. This happens AFTER the publish, so the
  bytes are already out. For prod, re-run the tag once the service is back: the retry skips the published
  packages and verifies them. For rc, a re-run bumps to the next rc, so a transient outage costs a
  version number. Check the published one by hand with `gh attestation verify` instead.
- **`the registry serves … but the attested tarball is …`** — the verify step found different bytes on
  the registry. Treat that published version as suspect and investigate before anything else.
  Re-running cannot fix a published version.
- **A package published and another did not** — this is **expected** on any mid-loop failure, not
  impossible. npm has no atomic multi-package publish, so whatever went out stays out. The publish
  step halts at the first real failure, and on a re-run an already-published version is skipped
  rather than treated as an error. Fix the cause and re-run the same tag. The retry re-packs,
  re-attests and verifies the whole set, and completes it.
  **The retry is sound only if the rebuild reproduces the same bytes.** The same commit on a
  GitHub-hosted runner does, because the checkout path is fixed and `npm pack` is deterministic.
  A changed toolchain between attempts could change a bundle. The Node version floats within `22`.
  If the bytes differ, the verify step fails for the packages already published, and that version
  cannot be completed: cut the next version instead.

## What this repo does not do

- Publish on merge. Only a tag publishes.
- Publish from a mission branch. No mission has or needs registry credentials.
- Automate the tag. Tagging is a deliberate operator act.
