# WP01 independent review — cycle 7

- Reviewed HEAD: `eb77cd52e4445f4f7634ab9171ebc0bf3ac1f29e`
- Reviewer: fresh Codex seat, resolved `reviewer-renata`
- Governed Op: `01M26FDAW4MB8YV7VTYRZSATCQ`
- Verdict: **changes requested**
- High: 0
- Medium: 2

## Medium 1 — generated size/package record is stale

`node scripts/measure-elements-sizes.mjs --check` failed. A fresh build measured ESM
`247291` bytes (241.5 KiB), IIFE `266279` bytes (260.0 KiB), IIFE SRI
`sha384-LxNIa59oFAZHhaAik41sUkpsz62WC+5EybutmXM945orIz6bCp49pr8ZMU7nBD9A`, and
56 packed element files. The committed `packages/elements/SIZES.md` still records the prior
241.1/259.6 KiB values, prior SRI, and 57 files.

Required disposition: run a fresh authoritative elements build, regenerate `SIZES.md` through
`scripts/measure-elements-sizes.mjs`, commit the generated result, then rerun size and release
checks. Do not hand-edit the record.

## Medium 2 — durable mission evidence is not current

`docs/architecture/validation/issue-323-theme-toggle/operator-log.md` and
`kitty-specs/theme-toggle-01M25KMP/implementation-evidence.md` still name `4172c6fa...` as the
latest executable validation snapshot, retain the old size-gate result, and do not record the
cycle-seven remediation or its exact reviewed HEAD.

Required disposition: after regenerating the size record and rerunning the applicable gates,
update both durable records with the cycle-seven changes, exact product/evidence HEADs, review
outcome, real-zoom record, and current truthful gate results.

## Verified closures

- Listenerless and incomplete modern/legacy `matchMedia` results are safe, tested, and covered by
  an ADR-11 mutation arm.
- Story-only theme isolation is absent from the manifest, public package root, fresh declarations,
  and built runtime; negative/self-test probes pass.
- Genuine headed Chrome UI 100%/200% evidence is credible, independently inspected, and records a
  fixed physical window with the CSS viewport halving, native keyboard operation, root state,
  focus, and containment.
- Independent focused results: Vitest 36/36, Chromium composition 9/9, five-project typecheck,
  manifest 31 elements/138 documented surfaces plus 15/15 self-tests, React/Vue/generator,
  release-graph 4 packages plus 28/28 self-tests, `quality:all`, commitlint, and lockfile dry-run
  all passed. The size check failed as described above.

## Low follow-ups

- Document or regenerate the `sourceDiffSha256` canonical procedure; the exact git product-tree
  object and capture hashes remain independently verifiable.
- A future manifest-gate hardening can recognize `export *`; current explicit exports and built
  runtime are clean.
- A separate gate-hardening change can make `check-behaviour-fixture-imports.mjs` ignore
  screenshot directories whose names end in `.ts`; its self-test and a clean-archive run pass.
