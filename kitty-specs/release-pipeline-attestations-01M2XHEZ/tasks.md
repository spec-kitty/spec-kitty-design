# Tasks: REL3 — attest every published @spec-kitty tarball

**Mission**: `release-pipeline-attestations-01M2XHEZ`
**Input**: `spec.md`, `plan.md`
**Planning base / merge target**: `mission/release-pipeline-attestations` (topology `single_branch`, per `meta.json`). The mission PR targets `train/elements-first`, never `main`.

## Subtask Index

| ID | Description | Requirements | Parallel |
|---|---|---|---|
| T001 | `scripts/pack-derived-set.mjs`: pack every package in the derived set to `dist-tarballs/` in topological order; recompute each file's SHA-512 and refuse a mismatch with npm's reported integrity; write `packed.json`; refuse an empty set; `--selftest` with a floor | FR-001 | |
| T002 | `scripts/verify-published-integrity.mjs`: for each `packed.json` entry, `npm pack <name>@<version> --json` into a temp dir, recompute SHA-512, and compare; refuse an empty input, an unreadable download or a mismatch; `--selftest` with a floor | FR-004 | |
| T003 | `publish-derived-set.mjs`: publish the tarballs in `packed.json` (`npm publish <abs tgz> --tag <tag>`), cross-checked against its own derived set; keep the `latest` refusal, the branded decision and the `manifest.tag` guard; the effect probes prove a `.tgz` argument and no package-dir `cwd` | FR-003, FR-006 | |
| T004 | `publish-packages.yml` and `release-rc.yml`: pack after the bump, attest (`actions/attest-build-provenance@4d101475… # v4.2.2`, `subject-path: dist-tarballs/*.tgz`), publish, verify; add `id-token: write` and `attestations: write` to the payload job and the rc caller | FR-001–FR-005, FR-008 | |
| T005 | `release.yml`: the same pack, attest and verify steps; the loop publishes `"$file"` from `packed.json` with its resumable, halting handling intact; permissions added | FR-001–FR-005, FR-008 | |
| T006 | `check-release-graph.mjs`: the rules and probes listed in plan.md's Gates section, for both publish paths | FR-007 | |
| T007 | Three-layer gate wiring for the two new selftests; `MIN_CASES` taken from the table's own count; `check-action-pins.sh` green | FR-007 | |
| T008 | `docs/release-runbook.md`: consumer verification with `gh attestation verify`; FR-044 met by attestations | FR-009 | |
| T009 | Post-merge live proof: the promotion-triggered rc publish is attested; `gh attestation verify` passes on every published tarball fetched from the registry; recorded in `research/` | acceptance | |

## Work Packages

### WP01 — Pack, publish tarballs, verify integrity

- **Goal**: publish exactly the bytes that get attested, and prove it after publishing.
- **Depends on**: —
- **Independent test**: each script's selftest passes, with probes that go red on each defect; the effect probes show `npm publish <tgz>` and never a directory publish.

- [ ] T001 pack-derived-set.mjs
- [ ] T002 verify-published-integrity.mjs
- [ ] T003 publish-derived-set.mjs publishes tarballs

### WP02 — Attestation in both publish paths, and the gates

- **Goal**: both workflows attest before they publish, with permissions, and the release-graph checker refuses every way of removing or neutering that.
- **Depends on**: WP01
- **Independent test**: the release-graph rules are green on the real workflows and red on every probe's defect; gate wiring and action pins are green.

- [ ] T004 rc payload and caller
- [ ] T005 prod release.yml
- [ ] T006 release-graph rules and probes
- [ ] T007 Gate wiring and pins

### WP03 — Runbook and live proof

- **Goal**: consumers can verify a tarball; the first attested rc is verified end to end.
- **Depends on**: WP02
- **Independent test**: `gh attestation verify` passes for every package of the next rc, fetched from the registry.

- [ ] T008 Runbook
- [ ] T009 Post-merge live proof
