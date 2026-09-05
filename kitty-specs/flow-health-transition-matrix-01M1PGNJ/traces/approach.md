# Tracer: approach

One entry per finding: `YYYY-MM-DD · actor · <text>`.

---

2026-09-05 · codex · Post-rebase dependency exception: train/elements-first commit 64ec1c7 introduced scripts/check-release-graph.mjs after WP02's authored-file boundary was approved. CI run 33938053543 requires every packages/styles/src component directory to have a matching packages/styles/package.json subpath export and requires the root changelog's element count/list to include sk-transition-matrix. This mission therefore permits only packages/styles/package.json plus root CHANGELOG.md as release-integration changes; all other manifests, lockfiles, tokens, ADRs, and sibling authored component source remain forbidden.

2026-09-05 · codex · Post-rebase CI visual audit found the narrow 390x844 maximum-scroll group heading clipped to “& RECOVERY” even though the DOM retained “Exceptions & recovery”; a rendered-text-range Playwright assertion measured text left -70.609375 outside viewport left 1. Commit 493d2dcf wraps the private group text and clamps it within the scroller using token-backed sticky insets while preserving desktop centering and the prior seven-owner rest/selected/hovered/pressed hit ownership. Chromium and Firefox passed; mutating only group-label position sticky to static reproduced the exact clipping red, then apply_patch restoration returned byte-identical source/generated/test hashes. The local diagnostic measured text 25..176.203125 inside viewport 1..389 at scrollLeft 380 and was removed without creating or blessing a baseline.
