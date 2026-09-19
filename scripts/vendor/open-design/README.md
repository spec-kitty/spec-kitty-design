# Vendored OpenDesign reference

Two files copied **byte-for-byte** from [`nexu-io/open-design`](https://github.com/nexu-io/open-design)
at the commit recorded in `DIGESTS.json` (package version 0.21.1, the version the local OpenDesign
instance runs). They are OpenDesign's own code — the function that derives `components.manifest.json`
and the validator for a design-system project manifest — so the gates that use them check this
repository's package against the reference implementation, not a re-implementation of it.

**Do not edit these files.** `scripts/opendesign-reference.mjs` verifies each one against its
recorded sha256 before importing it and refuses on any difference. To move to a newer OpenDesign,
copy both files from the new upstream commit with `git show <commit>:<upstreamPath>`, update
`DIGESTS.json`, and regenerate the package.

`package.json` and this README are this repository's, not upstream's, and are not digest-checked.
