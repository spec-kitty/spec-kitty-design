---
affected_files: []
cycle_number: 6
mission_slug: mission-kanban-pattern-stories-01M22F6C
reproduction_command:
reviewed_at: '2026-09-09T17:28:01Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review cycle 6 — changes requested

Reviewed lane head `e4418b4f58a3b89ce669b29e91284d2d97943892` (tree `910322f65fcb9f9eec788736153eaebaae4b6ec8`) against `origin/train/elements-first@7a44c7037569ce149d9a1f1125a7da6f70b47508`.

## Finding

[HIGH] `apps/storybook/src/tests/visual.spec.ts-snapshots/mission-kanban-forced-colors-chromium-linux.png` / `apps/storybook/src/tests/visual.spec.ts:1518` — the committed Mission Kanban visual evidence was not regenerated after cycle-5's rendering corrections, so the exact-head visual gate is red and FR-019's claimed ten-baseline proof is stale. Commit `8e9070c8c018e019dd7a79f131dead81c30d3ace` added all ten baselines; the subsequent source correction `fd3fd46118293fd8860a1d9996fe74b5485ab9be` changed the rendered status tones and added the required K3 filter composition to `ForcedColors` (`packages/elements/src/patterns/mission-kanban.stories.ts:922-928`), but `git diff 8e9070c..e4418b4 -- apps/storybook/src/tests/visual.spec.ts-snapshots` is empty. The expected forced-colors image visibly has no filter group, whereas the exact-head actual has ten native checkboxes with only `in_review` and `blocked` checked. This semantic mismatch is independent of host font drift. In pinned `mcr.microsoft.com/playwright:v1.62.1-noble`, the forced-colors case fails with expected `1600x1483`, actual `1600x1864`, and 145,532 differing pixels (5%); the full ten-story run reports 10 failed. The primary acceptance matrix nevertheless records FR-019 as pass using "ten inspected Ubuntu baselines" (`acceptance-matrix.json:188-195`). — Regenerate the Mission Kanban baseline set from the exact corrected product head in the repository's CI-authoritative Ubuntu/Playwright environment, visually inspect all ten actuals (especially explicit status tones and the forced-colors K3 filters), and rerun the exact ten-story visual command to 10/10. Then refresh FR-019 and lifecycle evidence through supported Spec Kitty commands so it cites the new exact-source baseline commit rather than the pre-correction images.

## Reproduction

```bash
docker run --rm --ipc=host -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  bash -lc 'PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium --grep "Mission Kanban"'
```

Result: `10 failed` at exact head.

Focused behavior command used for the cycle-5 corrections:

```bash
docker run --rm --ipc=host -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  bash -lc 'CI=1 npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --project=chromium --grep "fixture guards|K1 has the exact|K2 owns genuine|K2 CSS zoom|long-content CSS zoom|K3 exposes|one mounted K6|real Storybook reloads|long content remains|forced colors retain"'
```

Result: `10 passed`.

## Review notes

- PASS: explicit consumer-supplied tone values and guard coverage match the durable K1 evidence.
- PASS: the four headed-Chrome 100%/200% captures were inspected; their hashes match the durable record, browser chrome shows 100%/200%, document overflow is absent, and focused WP15 remains contained. The recorded capture product surfaces are byte-identical to the current exact head.
- PASS: forced-colors behavior renders ten real checkboxes, with exactly `in_review` and `blocked` checked, visible focus/boundaries, and separate truth tiers.
- PASS: direct nested mutation attempts, prior-projection stability, independent reprojection, and deep freeze are exercised.
- PASS: native Tab traversal and keyboard reveal cover auto/scroll clipping ancestors without script pre-scroll; observer remount/resize cleanup is balanced.
- PASS: FR-001 through FR-018/FR-020 and NI-001 through NI-009 have concrete evidence consistent with the reviewed product surfaces; no #279-#284 product/evidence work was found.

## Test anti-pattern checklist

1. Mocked dependency interactions instead of behavior: PASS.
2. Tests coupled only to implementation internals: PASS; the explicit local test seam is paired with browser-visible contracts and publishes no package API.
3. Broad exception swallowing: PASS; catches are limited to expected frozen-mutation failure proof.
4. Missing real state-transition assertions: PASS.
5. Weak/placeholder assertions: PASS for behavior; exact ids, lanes, tones, routes, geometry, and selected states are asserted.
6. Unclear test names: PASS.
7. Shared mutable fixtures: PASS; the fixture and projections are deeply frozen and directly reproven.
8. Regression coverage for the finding: FAIL; the baseline assertions exist, but their committed expected images predate the corrected render and the exact-head visual suite cannot pass.
