---
affected_files: []
cycle_number: 2
mission_slug: team-overview-current-main-pattern-refresh-01M286R0
reproduction_command:
reviewed_at: '2026-09-11T14:08:00Z'
reviewer_agent: reviewer-renata
wp_id: WP01
---

# WP01 review feedback — cycle 2

Reviewed governed lane head `6783010c91192c9ed4acdb4557d90b80b46e47db` against the issue,
programme handoff, mission contract, and cycle-1 rejection.

## Resolved cycle-1 finding

The retention truth defect is resolved. `projectPopulatedOverview` now selects canonical moments by
the supplied retention-cell membership, derives the total and every cell count/label, derives the
window summary from supplied copy parts plus the selected hours, and derives in-flight/recent rows
from that same selected set. The renderer uses the one projected summary for both visible and
accessible output. The adversarial fixture changes count, hours, and order, and the built-story test
cross-checks the rendered total/cells/summary/ARIA relationship.

## Blocking findings

### High — generated SIZES/SRI records a lane-worktree artifact that CI cannot reproduce

`packages/elements/SIZES.md:11,18,87,99` was changed to an IIFE raw size of 274957 bytes and SRI
`sha384-2QWvL0ywAJJDfTIeowg8AMk1SeQ22S2fbWNls5ZU2Np/k3fqQTdhZ3SdyyjhYBXk`. That is the output
of building inside the nested lane worktree: its esbuild comments begin with
`// ../../node_modules/...`. The primary checkout builds the unchanged runtime entry with
`// node_modules/...`, 274885 bytes, and SRI
`sha384-3WJ03rTJKQKQc9mbweExwXB9YNXn2nLQyck/CYjRXFc9SEc0x32jYZyANAqTuOjk`. No runtime element
source changed in this fix, so the lane-relative IIFE delta is not a product delta and a normal
CI checkout will fail the committed generated-size/SRI check. This violates C-008 and NFR-007.

Regenerate `packages/elements/SIZES.md` from the primary mission checkout after applying the fix
there. Preserve any legitimate package-unpacked change caused by the fixture declaration, but do
not carry the nested-worktree-only IIFE bytes, explanatory interpolation, or SRI.

### Moderate — the visual inspection ledger has a stale hash for the regenerated 168-hour baseline

`docs/architecture/validation/issue-383-team-overview/visual-inspection.md:26` records
`edfc848e...`, but the committed
`team-overview-current-to1-retention-168-chromium-linux.png` at the reviewed head hashes to
`40df00e3dca3b7101a4886af50e35c4d644deee128ad5916d8bdec15e8902675`. The other 18 ledger rows
match. The new image is visually sound and passes the official Noble baseline, but the durable
inspection evidence is false until this row is updated after reinspection. This violates the
living-documentation requirement and NFR-006.

## Validation

- PASS: quality, all five typecheck projects, pattern-composition selftest/repository pass, and
  Vitest (56 files, 802 tests).
- PASS: clean Storybook build from the reviewed lane.
- PASS: official Playwright 1.62.1 DejaVu/Noble run, 36/36 focused tests across Chromium, Firefox,
  and WebKit on an isolated port; this includes axe, semantics, authorization, copy outcomes,
  drawer focus, responsive/zoom/RTL/forced-colors/reduced-motion, and retention rendering.
- PASS: official Noble Chromium owned visuals, 19/19; the changed 168-hour image was inspected.
- PASS: exactly six current story IDs; six TO2 fixtures; #150 current-product stories/PNGs retired;
  public/native surfaces only; no runtime API, polling, router, clipboard policy, or private-root
  reach-through.

## Anti-pattern checklist

1. Dead code — PASS (story-only module is consumed by the current discovered stories; no public
   runtime export was added).
2. Synthetic-fixture test — PASS (retention tests invoke the projection and rendered Storybook;
   adversarial inputs alter hours, count, and order).
3. Silent empty return — PASS.
4. FR coverage — PASS for behavior; generated/visual evidence defects above still block NFR-006/7.
5. Frozen surface — FAIL for C-008 because the IIFE size/SRI changed only with checkout layout.
6. Locked decision — PASS.
7. Shared-file ownership — PASS (the issue records sequential regeneration with #382).
8. Production fragility — N/A (fixture validation is story-only and intentionally fail-loud).
