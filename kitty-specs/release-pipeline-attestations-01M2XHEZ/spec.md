# REL3 — attest every published @spec-kitty tarball

**Issue**: #364, scope item 3 · **Epic**: #361 · **Base**: `train/elements-first` @ `173774af` · **Date**: 2026-09-19
**Operator scope, 2026-09-19**: *"apply … REL3's attestations"*. Items 4 and 5 of #364 (the republish error code and the
routing docs) and making the packages public are **not** in this mission. Merge grant: *"Grant: train only, same terms"*
(recorded on #361).

## Why

npm provenance (`--provenance`) is an npmjs.org mechanism, and it hard-fails on GitHub Packages, so REL2 removed it. The
2026-09-11 operator amendment on #361 replaces it with **GitHub artifact attestations** over the packed tarballs. Today
nothing is attested: `1.1.0-rc.0`, `rc.1` and `rc.2` were published with no provenance at all. A consumer cannot tell a tarball
this repository's release workflow built from one built anywhere else.

## Measured starting point

| Fact | Evidence |
|---|---|
| Two publish paths, both `npm publish` **inside the package directory** | rc: `publish-packages.yml` → `scripts/publish-derived-set.mjs` (`spawnSync('npm', ['publish', '--tag', tag], { cwd })`, :213). Prod: `release.yml`'s own loop (`cd packages/$pkg && npm publish`, :185) |
| So no tarball file exists to attest | Neither path runs `npm pack` to a file; the only `npm pack` is the `--dry-run` contents audit |
| The repo is **public**, the org plan is **Team** | `gh api repos/spec-kitty/spec-kitty-design` → `visibility: public`; artifact attestations are available for public repos on every plan |
| `actions/attest-build-provenance` latest is **v4.2.2** = `4d101475d8b20a2381f78447822ac1eab6504dd8` | GitHub releases API, 2026-09-19 |
| It needs `id-token: write` and `attestations: write` | action README; the payload's REL3 NOTE (`publish-packages.yml:207-217`) |
| The caller's `permissions:` is a **ceiling** on a reusable workflow | REL2 pass 2: a payload asking for more than its caller grants fails validation; recorded in `publish-packages.yml:42-53` |
| The rc stream runs the payload after the bump | `publish-packages.yml:138` bump, `:158` publish |

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Each publish path **packs** every package it will publish into a tarball file with `npm pack --json --pack-destination`, after any version bump and before any publish, and records each file's name, version and `sha512` integrity. | High |
| FR-002 | `actions/attest-build-provenance`, SHA-pinned to v4.2.2, attests **exactly those tarball files** (`subject-path`) **before anything is published**. If attestation fails, nothing is published. | High |
| FR-003 | Each path publishes **the attested tarball files** (`npm publish <file.tgz> --tag <tag>`), never a package directory, so the published bytes are the attested bytes. | High |
| FR-004 | After publishing, each package's registry `dist.integrity` must equal the `sha512` of the tarball that was attested and published; any mismatch or unreadable integrity fails the job. | High |
| FR-005 | Permissions: the payload job and the rc caller gain `id-token: write` and `attestations: write`; `release.yml` gains both. The payload still never holds `contents: write`, and the ceiling (payload ⊆ caller) still holds. | High |
| FR-006 | `publish-derived-set.mjs` keeps its unconditional `latest` refusal and its branded decision, and publishes tarballs. Its effect probes prove it invokes `npm publish <tarball>` and never `npm publish` in a directory. | High |
| FR-007 | `check-release-graph.mjs` asserts, for BOTH publish paths, with probes that each go red on their defect: an attest step exists, is SHA-pinned, runs unconditionally, precedes every publish, and has the packed tarballs as its subject; publish uses tarballs; the integrity check runs after publish; the permissions are present. | High |
| FR-008 | The CycloneDX SBOM is unchanged and still produced on both paths. | Medium |
| FR-009 | `docs/release-runbook.md` documents how a consumer verifies a published tarball (`gh attestation verify <tgz> --repo spec-kitty/spec-kitty-design`) and records that FR-044 (provenance) is now met by attestations. | Medium |

## Acceptance essentials

- **Static, pre-merge**: every FR-007 assertion is green on the real workflows and red on each probe's defect; the action-pin
  gate is green with the new pin; all existing gates stay green.
- **Live, post-merge**: the train merge triggers the promotion to `develop`, whose push publishes the next rc through the
  payload. For **every** package in that publish, `gh attestation verify <the published tarball> --repo
  spec-kitty/spec-kitty-design` succeeds. The tarball is fetched from the registry with `npm pack @spec-kitty/<pkg>@<ver>`,
  not taken from the runner. The run's integrity check reports a match for each package. Recorded in the mission's
  `research/`.
- **Prod path**: `release.yml` runs only on a `v*.*.*` tag on `main`, which is the operator's landing. It is proven by
  the static gates and by sharing the rc path's pack/verify scripts; its first live run is the operator's next prod tag.
  This is stated, not glossed over.

## Constraints

- Change only packing, attestation, publish input and verification. The derived set, topological halt-on-failure,
  already-published skip, dist-tag report, SBOM and SHA pins all stay as they are.
  *(As delivered, gate pass 5: the dist-tag report's BEHAVIOUR is unchanged, but it moved from ~30 lines of
  shell in both workflows into `scripts/report-dist-tags.mjs`. Review showed the step could not be held to
  what it did while it was shell, because it was the one step allowed to hold `NODE_AUTH_TOKEN`. The SBOM
  tool is now a pinned devDependency run with `npx --no-install`, so the SBOM itself also lists that dev
  tree — see FR-008.)*
- `release.yml` stays its own workflow. Converting it into a payload caller is not in this mission.
- Every new gate refuses an empty set and prints its count.
