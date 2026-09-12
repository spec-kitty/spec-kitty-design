---
affected_files: []
cycle_number: 1
mission_slug: team-activity-truth-region-pattern-stories-01M286SJ
reproduction_command:
reviewed_at: '2026-09-11T13:24:55Z'
reviewer_agent: reviewer-renata
wp_id: WP01
---

# WP01 independent review — cycle 1

Reviewer profile: `reviewer-renata`
Reviewed implementation: `3b2ec4c33798dfc7da04ca72205ae8dea6f96fab`
Diff base: `611f5cd50f93d6951765df37bb2d84932a66e4f9`

## Required remediation

1. **High — committed visual evidence is not green on the exact reviewed head.**
   `STORYBOOK_PORT=6383 PW_INCLUDE_VISUAL=1 npx playwright test
   apps/storybook/src/tests/visual.spec.ts --project=chromium --grep 'Team Activity' --workers=4`
   fails 10 of 18 Team Activity baselines. Representative results include L4 at 33,999 pixels / 4%,
   TL1 at 154,445 / 9%, Intermediate changing from 1508 px to 1531 px high, RTL from 1297 px to
   1321 px, and LongContent from 2646 px to 2745 px. The isolated L4 case fails identically on two
   consecutive one-worker runs, so this is not the earlier shared-port collision. Regenerate the
   Team Activity snapshots from a fresh exact-head Storybook build on an isolated port through the
   repository tooling, rerun the focused visual gate, and inspect all eighteen regenerated images.

2. **High — FR-005's unchanged factual-host-context boundary is absent rather than proved.**
   `team-activity.stories.ts` has no consumer-supplied factual host-context fixture/projection, and
   the L1/L3 stories render only their reported-live section. The L3 test at
   `apps/storybook/src/tests/sk-team-activity-pattern.spec.ts:235` checks zero stale rows and zero
   observed text, but cannot prove that factual host context remains unchanged. Add the smallest
   consumer-supplied factual host slice needed by #382 outside the live truth region, reuse it
   unchanged across L1-L4, and compare its L1/L3 semantic signature. Do not turn it into a full page
   or a reusable runtime surface.

3. **Medium — the required L5 full text/attribute allowlist guard is incomplete.**
   The test at `apps/storybook/src/tests/sk-team-activity-pattern.spec.ts:274` checks `innerText`, a
   selected descendant-tag denylist, and visible text. It never inspects attributes or pins the
   complete allowed descendant/attribute shape. A protected repository, actor, branch, host,
   harness, sequence, or tier value added via `data-*`, `aria-label`, `title`, or an unlisted hidden
   element would pass. Assert the exact L5 descendant/attribute allowlist and scan serialized
   text/attribute values for every protected fixture field, so the test fails on an accessibility-
   only or attribute-only leak.

## Evidence that passed

- `STORYBOOK_PORT=6382 ...sk-team-activity-pattern.spec.ts --project=chromium --workers=4`:
  18/18 passed, including all-story axe, native semantics, keyboard, media, theme, viewport, and
  guard checks.
- `node scripts/typecheck-all.mjs`: 5/5 projects passed.
- Pattern composition self-test/gate: 47 probes, 18 planted violations, 10 fixtures, no reach-
  through or copied component CSS.
- Exact authored diff stays within WP-owned files; story ratchet is 616/616 with 18 unique Team
  Activity IDs; implementation worktree remained clean.
- Direct inspection covered eight representative committed baselines. Current implementation has
  no observed/live marker crossover, runtime API/classifier/clock/poller/router/mutation, private
  shadow access, or unrelated source change.

The Spec Kitty pre-review `no_coverage` result is not accepted as evidence: the Python gate
authority is unavailable in this JavaScript repository. The focused browser, type, composition,
and visual checks above supply the relevant review evidence instead.
