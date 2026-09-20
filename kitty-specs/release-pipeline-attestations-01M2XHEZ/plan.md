# Plan — REL3: attest every published @spec-kitty tarball

**Spec**: `spec.md` · **Base**: `train/elements-first` @ `173774af` · **Date**: 2026-09-19

## What research settled (measured, not assumed)

| Question | Answer | Evidence |
|---|---|---|
| Are artifact attestations available here? | **Yes.** The repo is public, and attestations are free for public repos on every plan. The org is on Team. | `gh api repos/spec-kitty/spec-kitty-design` → `visibility: public`; `orgs/spec-kitty` → `plan: team`; the attestations endpoint answers (404 for an unknown digest, not 403) |
| Which action and pin? | `actions/attest-build-provenance` **v4.2.2** = `4d101475d8b20a2381f78447822ac1eab6504dd8`, input `subject-path` (glob) | releases API; `action.yml` inputs |
| Does `npm pack --json` give the tarball's true digest? | **Yes.** Its `integrity` equals `sha512-` + base64 of the file's own SHA-512, and a repack gives the same bytes | `npm pack --json` on `packages/tokens`, compared against `openssl dgst -sha512` and a second pack |
| Can a published version be re-fetched to check it? | **Yes.** `npm pack @spec-kitty/tokens@1.1.0-rc.2 --json` downloads it from GitHub Packages and reports its integrity. `npm view <name>@<version> dist.integrity` is not used for two reasons: it reports the integrity the registry ADVERTISES rather than the bytes, and the UNVERSIONED `npm view` queries return exit 0 with zero bytes here (REL2). *(Corrected at gate pass 5: the versioned query itself does work — re-measured 2026-09-20 with controls — so the original "npm view is not usable" was wrong as written. The design stands on the first reason.)* | live download, 2026-09-19 |
| Where must packing sit in the rc payload? | **After** the bump (`publish-packages.yml:138`) and before the publish (`:158`): the tarball carries the bumped `package.json` | payload order |
| Can prod be folded into `publish-derived-set.mjs`? | **No.** That script makes `latest` unreachable by construction (REL2 pass 5). `release.yml` keeps its own loop and publishes the same kind of file | script header |

## Design

```
bump (rc only) ─▶ pack-derived-set.mjs ─▶ attest-build-provenance ─▶ publish tarballs ─▶ verify-published-integrity.mjs
                  writes dist-tarballs/     subject-path:              rc:  publish-derived-set.mjs       re-downloads each
                  *.tgz + packed.json       dist-tarballs/*.tgz             (npm publish <tgz> --tag rc) name@version, compares
                  {name,version,file,                                  prod: release.yml loop             sha512 to packed.json
                   integrity}                                               (npm publish <tgz>)
```

- **`scripts/pack-derived-set.mjs`** (new, shared). Derives the set with `publishable()` from `release-graph.mjs` and
  refuses an empty one. It runs `npm pack --json --pack-destination dist-tarballs` in each package directory, in
  topological order, and **recomputes each file's SHA-512 itself** rather than trusting the JSON. It writes
  `dist-tarballs/packed.json` and prints the count. It has a `--selftest` with a probe table and a floor.
- **Attest step** (both workflows). `actions/attest-build-provenance@4d101475… # v4.2.2` with
  `subject-path: dist-tarballs/*.tgz`. It is unconditional and runs immediately before the publish step.
- **`publish-derived-set.mjs`** (rc). It reads `packed.json`, cross-checks it against its own derived set (same names,
  same order, refuse any mismatch or missing file), and spawns `npm publish <abs tgz> --tag <tag>`. The branded
  decision, the unconditional `latest` refusal, the `manifest.tag` guard and the EPUBLISHCONFLICT handling stay. The
  effect probes now also prove every spawned publish names a `.tgz` and none runs with a package-dir `cwd`.
- **`release.yml`** (prod). It gains the pack step and the attest step, and the loop becomes
  `npm publish "$file"` over `packed.json` with the existing resumable, halting handling. No `cd packages/$pkg`
  publish remains.
  *(As delivered, after gate pass 2: the inline loop was replaced by `scripts/publish-latest.mjs`, one exact,
  unconditional step. Review defeated five rules written over the loop's shell text: a second `--tag`,
  `FILES+=`, `read … FILES`, `printf -v`, and a repack inside the step. The script keeps the loop's
  semantics (only `latest`, topological order, skip only on a re-run, halt otherwise) and has its own
  effect probes.)*
- **`scripts/report-dist-tags.mjs`** *(added at gate pass 5, not planned)*. The published dist-tag report,
  moved out of ~30 lines of shell in each workflow. While it was shell it was the one step allowed to hold
  `NODE_AUTH_TOKEN`, and the gate could bound how many such steps existed but not what they did. Same
  behaviour — derived set, empty set refused, status read on its own, an empty listing counted as a failed
  read — as one exact step with a 17-probe selftest, wired through all three gate-wiring layers.
- **`scripts/verify-published-integrity.mjs`** (new, shared). For each `packed.json` entry it runs
  `npm pack <name>@<version> --json` into a temp dir, recomputes that file's SHA-512, and compares it with the attested
  one. It refuses empty input, unreadable downloads and mismatches, and has its own `--selftest`.
- **Permissions**. The payload job, the rc caller and `release.yml` each gain `id-token: write` and
  `attestations: write`. The payload still has no `contents: write`.

## Gates (IC-03)

`check-release-graph.mjs`, for both publish paths, with a probe for each rule:

- the pack, attest and verify steps are present, unconditional, and have an exact `run` where they are scripts;
- the attest step's `uses` names the pinned action and its `subject-path` is `dist-tarballs/*.tgz`;
- the order is bump < pack < attest < publish < verify;
- `release.yml` has no `npm publish` run inside `packages/`;
- the permissions (`id-token`, `attestations`) hold in the payload, the rc caller and `release.yml`, with the ceiling
  still enforced.

The new scripts' selftests are wired through all three gate-wiring layers (a CI step, `REQUIRED_LINT`, and a defeat
case), with `MIN_CASES` taken from the table's own count. `check-action-pins.sh` covers the new pin.

## Work packages

| WP | Delivers | Depends on |
|---|---|---|
| WP01 | `pack-derived-set.mjs`, `verify-published-integrity.mjs`, `publish-derived-set.mjs` tarball mode, all selftests | — |
| WP02 | Both workflows: steps and permissions; release-graph rules and probes; gate wiring | WP01 |
| WP03 | Runbook; post-merge live proof on the next rc publish (`gh attestation verify` per package) | WP02 |

## Risks

- **First live run is post-merge.** A PR cannot publish, so the attestation path is proven on the next rc publish, which
  the train merge triggers through promotion. If that run fails, `develop`'s rc stream is red until a fix lands. The
  fix path is an ordinary train PR, and nothing is published without an attestation, because the attest step precedes
  the publish.
- **Prod's first live run is the operator's next tag.** It is covered statically, and it shares the rc path's scripts.
- **The runner's `dist-tarballs/`** must not collide with anything published. It sits at the repo root, outside every
  `packages/*` `files` list.
