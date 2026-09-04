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
| 3 | Enable 2FA on the org | operator, once | ADR-5 operational policy |
| 4 | Add a granular publish token as `NPM_TOKEN` in repository secrets | operator, once | `release.yml` can authenticate — that secret name is what the workflow already reads |
| 5 | `git tag v1.0.0 && git push origin v1.0.0` | operator | starts the release |
| 6 | The workflow builds, audits, SBOMs, publishes, and creates a GitHub Release | CI | see below |

Steps 2–4 are one-time. Tag `v1.0.0` was pushed on 2026-09-01 and failed 50 seconds later with
`npm error 404 Not Found - PUT https://registry.npmjs.org/@spec-kitty%2ftokens` — a 404 on `PUT`
means the scope was not there to publish into. ADR-2 recorded scope ownership as a pre-flight and it
had not been done.

## What the release workflow does

1. **`npm audit` gate** (ADR-5 FR-041) — fails on high or critical
2. **Resolves the publishable set** — `node scripts/release-graph.mjs`, derived from
   `packages/*/package.json`, refusing an empty result
3. **Builds** the buildable subset
4. **Contents audit** — `npm pack --dry-run` per package
5. **CycloneDX SBOM** (ADR-5 FR-045)
6. **Publishes** each package with `--provenance --access public` (ADR-5 FR-044)
7. **GitHub Release** with the SBOM attached

There is one package list, and it is computed. Until #80 there were three hand-written ones and they
disagreed: `elements` was built on every release and never published, and `react` appeared in none of
them.

## What a dry run proves, and what it does not

`npm publish --dry-run` proves **packing, not publishing.**

It short-circuits before `ensureProvenanceGeneration`, verified by running it with a full GitHub
Actions environment faked — provenance was never exercised. So a green dry run says nothing about:

- **provenance** — needs a real GHA OIDC token
- **authentication** — needs `NPM_TOKEN`
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
`packages/elements/INTEGRITY.json` and re-derived by CI:

```html
<script src="https://cdn.example/@spec-kitty/elements@1.0.0/dist/elements.js"
        integrity="sha384-…"
        crossorigin="anonymous"></script>
```

Take the `integrity` value from `INTEGRITY.json` at the tag you are loading. It changes with every
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
- **`Can't generate provenance for new or private package`** — `--access public` is missing, or the
  package is private. The gate should have caught the second on the PR.
- **`Provenance generation … requires "write" access to the "id-token" permission`** — the workflow's
  `permissions:` block lost `id-token: write`.
- **A package published and another did not** — should be impossible: both loops run under
  `set -euo pipefail`, so a failure inside the `for` fails the step. If it happens anyway, npm does
  not support atomic multi-package publishes; re-run the tag after fixing, and expect
  `EPUBLISHCONFLICT` from the ones that already went out.

## What this repo does not do

- Publish on merge. Only a tag publishes.
- Publish from a mission branch. No mission has or needs registry credentials.
- Automate the tag. Tagging is a deliberate operator act.
