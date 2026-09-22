---
affected_files: []
cycle_number: 1
mission_slug: team-overview-shell-elements-01M1S8R8
reproduction_command:
reviewed_at: '2026-09-05T23:44:49Z'
reviewer_agent: user
wp_id: WP04
---

# WP04 review feedback — cycle 1

Reviewed lane SHA `89bbf7eb6fb12ca6aab0a780673ac93f506316e0` against WP04, the mission spec and plan, ADR-9/10/11, the component-authoring recipe, and the approved WP01–WP03 records.

## Blocking issue — `SIZES.md` and its SRI are stale after the final entry-barrel edit

`packages/elements/SIZES.md` was last generated in commit `01e25d5cee7d444fb52a35ecc44fac270af94343`, but commit `b5cca73ea0141a805941ae43dddfcc1a7ab2e5a0` subsequently changed `packages/elements/src/index.ts` and `packages/elements/src/elements.ts`. A fresh uncached build at the reviewed head proves the committed size artifact no longer describes the bytes produced from the current source:

```text
$ npx nx run elements:build --skip-nx-cache
$ node scripts/measure-elements-sizes.mjs --check
❌ packages/elements/SIZES.md is stale
  dist/index.js:    committed 107909 bytes; built 107908 bytes
  dist/elements.js: committed 121956 bytes; built 121816 bytes
```

The checker also reports the committed IIFE SRI as stale, plus the dependent raw/KiB/package-size/runtime-cost lines. This violates T015, T017, NFR-006, and WP04's definition of done: build must precede measurement, and `SIZES.md` must regenerate byte-identically from the final entry sources.

Regenerate with the prescribed build-before-measure sequence, commit the resulting `packages/elements/SIZES.md`, then rerun `node scripts/measure-elements-sizes.mjs --check` and the affected release/size gates. Because the correction creates a new lane head, pin the replacement handoff and required exact-head evidence to that new SHA.

## Evidence already confirmed

- Fresh `npm run test -- --no-file-parallelism`: 29 files, 278/278 tests, node 32 and Chromium 246, zero skips.
- CSS/markup/React/Vue generation checks, 25 React-generator probes, 14 manifest probes, 14 entry probes, 36 selector probes, CSS hygiene, 69-part ratchet, story-theme probes, gate wiring, release-graph 28-probe selftest and live release graph all pass.
- The exact token source/catalogue comparator and the complete 12-path no-static-fallback invariant pass.
- The registry contains exactly 94 mutations total and exactly the intended 15 new WP04 arms; the exact-head handoff records 94/94 isolated named reds and 8/8 guard selftests. The mutation definitions and strict identity assertions match that evidence, including the behavior-preserving app-shell identity clone needed to avoid geometry collateral.
- The exact-head handoff records 177/177 non-empty axe-clean stories and Chromium+Firefox 70/70. The five visual cases are present, no local PNG is retained, and expected-red baseline handling is correctly deferred. WebKit is explicitly qualified as a host-library launch limitation rather than claimed green.
- Anti-pattern checks: dead code PASS; synthetic-fixture tests PASS; silent empty return N/A; FR behavior coverage PASS; frozen surfaces PASS; locked decisions PASS; shared-file ownership PASS; production fragility PASS.

No other blocking issue was found. Latest-train refresh, consolidation, CI-authoritative visual baselines, pre-merge squad/maintainer approval, PR/merge, and issue closure remain correctly deferred to mission wrap-up.
