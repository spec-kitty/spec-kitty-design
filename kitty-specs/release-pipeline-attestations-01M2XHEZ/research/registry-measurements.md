# Registry measurements (REL3)

Recorded because FR-004's evidence cited live measurements that existed only in a review transcript
(gate pass 5 records fact-check). Each line is reproducible against GitHub Packages with a throwaway
npm cache; each has a control.

## `npm view` on this registry — 2026-09-20, npm 10.9.7

| Query | Result |
|---|---|
| `npm view @spec-kitty/tokens@1.1.0-rc.2 dist.integrity` | exit 0, 96 bytes, `sha512-zARshpsS4rBii…` |
| `npm view @spec-kitty/tokens dist-tags` | **exit 0, zero bytes** |
| `npm view @spec-kitty/nope@9.9.9 dist.integrity` (control) | exit 1 |

So the zero-byte behaviour REL2 measured is real but specific to the UNVERSIONED queries; the
versioned one works. The pipeline still does not use it: `dist.integrity` is the hash the registry
advertises, so comparing against it asks the registry to confirm itself. `verify-published-integrity.mjs`
re-downloads the tarball and hashes the bytes instead.

## Attestation state of the published rc versions — 2026-09-19/20

`gh attestation verify` finds no attestation for `1.1.0-rc.0`, `rc.1` or `rc.2`: all three were
published before this mission, and the first attested version will be the rc the train merge
promotes. That is T009, the live proof, which stays open until that run exists.

## What the verify path was measured to do

Measured during this mission's review, not in one sitting: the cache behaviour at gate pass 1 (which is
why the throwaway `--cache` exists), the rc.2 comparison and the 404 at gate pass 5, when the records
fact-check reproduced both halves independently.

- `npm pack @spec-kitty/tokens@1.1.0-rc.2` through a throwaway `--cache` downloads the blob (cache
  miss, a GET to the blob store); with the shared cache it answers `(cache hit)` and re-reads nothing.
- The downloaded bytes' SHA-512 equals the packed tarball's, and a deliberately corrupted control is
  refused as a mismatch.
- `gh attestation verify` on rc.2 fails with HTTP 404 — correct, since nothing attested it.
