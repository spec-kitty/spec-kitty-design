---
affected_files: []
cycle_number: 3
mission_slug: mission-kanban-pattern-stories-01M22F6C
reproduction_command:
reviewed_at: '2026-09-09T13:35:33Z'
reviewer_agent: user
wp_id: WP01
---

---
affected_files:
  - packages/elements/src/patterns/mission-kanban.stories.ts
  - apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts
cycle_number: 3
mission_slug: mission-kanban-pattern-stories-01M22F6C
reviewed_commit: 657394185b9dd5d7603fafc2f7c71f3efe7a5bba
reviewer_agent: codex
wp_id: WP01
---

# WP01 independent review cycle 3 — changes requested

Exact successor tree reviewed: `657394185b9dd5d7603fafc2f7c71f3efe7a5bba`.

## Finding 1 — Storybook force-remount leaks one active scroller observer per replay

- Severity: HIGH
- Files: `packages/elements/src/patterns/mission-kanban.stories.ts:632-642`; missing lifecycle regression near `apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts:460-496`
- Requirements: NFR-009 and cycle-2's required lifecycle cleanup; maintainability/resource-lifecycle proof for FR-009's responsive semantics
- Explanation: `createWorkflowScrollerRef()` disconnects the observer captured by one render only when Lit calls that same callback ref again. Normal Lit rerender does that correctly. Storybook's real force-remount/replay path first replaces the canvas markup with a new `#root-inner`, bypassing Lit's callback-ref removal for the old tree. The next render creates a different closure and observer, so it cannot disconnect the observer retained by the prior closure. The source comment claiming one observer per story render is therefore true only within a Lit render lineage, not across the Storybook lifecycle that owns these stories.
- Independent reproduction: before page load, wrap native `ResizeObserver` to count constructed, observed, disconnected, and still-active observers whose target matches `[data-board-scroller]`; load K6 through the real Storybook manager; then press the manager's `Reload story` control three times. Counts progressed from `constructed=2, observed=2, disconnected=1, active=1` initially to `4/4/2/2`, `6/6/3/3`, and `8/8/4/4`. One detached scroller observer remains active after every remount. By contrast, three normal `forceReRender` channel events ended `8/8/7/1`, confirming the defect is specifically the remount cleanup seam rather than the instrumentation.
- Required remediation: keep measurement story-only and consumer-owned, with no timer or poller, but give the observer a teardown/ownership mechanism that survives Storybook replacing the mounted Lit tree. It must not collapse legitimately concurrent Docs/canvas story instances into an unsafe global singleton. Add an instrumented browser regression using the real force-remount/replay lifecycle and assert that the old target is disconnected and exactly one observer remains active after repeated remounts. Preserve the existing same-mounted bidirectional resize test, K2 behavior, and embed-without-play semantics.
- Disposition: must_fix_before_approval

## Corrected and preserved behavior

- Cycle-2's semantic defect is resolved on the same mounted K6 in Chromium, Firefox, and WebKit: at 1600px the board fits and has no role/name/tabindex; at 1280px real overflow adds the exact triad and retains focus/document containment; returning to 1600px removes it. The root sentinel remains, proving no test-created rerender state.
- K2 remains genuinely locally overflowing at 390px with the exact triad, visible focus, and no document overflow in all three engines.
- Loading the isolated built story with Storybook autoplay disabled still gives K6 the geometry-correct triad, proving `play` does not create the semantics.
- Cycle-1's ownership defect remains resolved by Spec Kitty amendment commit `1b7a211307e954e71bc31004ffd14e74192f05c9`. The predecessor test changes only the authorized global total from 391 to 401; all other #277 content is unchanged and its focused source/public contract passes 4/4.

## Independent evidence

- `node scripts/check-pattern-composition.mjs`: PASS — five immutable fixtures, 122 inline CSS rules, 20 composed public element tags, no reach-through or copied component CSS.
- `node scripts/typecheck-all.mjs`: PASS across five projects.
- `npm run quality:all`: PASS.
- `npx nx run storybook:storybook:build`: PASS.
- Pinned `mcr.microsoft.com/playwright:v1.62.1-noble` focused #278 replay: 54/54 PASS across Chromium, Firefox, and WebKit, including live bidirectional K6 resize and accessibility-tree coverage.
- Pinned Noble #277 source/public contract replay: 4/4 PASS in Chromium.
- Pinned Noble owned visual replay: 10/10 PASS in Chromium. All ten baselines were directly inspected against the durable UX evidence in cycle 1 and are byte-unchanged in cycle 3; they remain visually acceptable. The blocker is a lifecycle resource leak not visible in a static screenshot.
- `git diff --check`: PASS. Generated/public/token/wrapper/barrel/manifest surfaces and legacy PNGs have zero WP delta. No #279–#284 implementation was found.

## WP anti-pattern checklist

1. Dead code: PASS — the story-only observer path is invoked by each rendered story; no public product API was added.
2. Synthetic-fixture test: PASS — focused tests exercise the built Storybook stories and real browser geometry.
3. Silent empty return: PASS — the callback's non-HTMLElement path follows an explicit disconnect and represents Lit teardown; no swallowed application failure was added.
4. FR coverage: PASS — current tests and direct replay cover every FR behavior, including live geometry transitions. The rejection is the unproved and failing NFR-009 lifecycle cleanup seam.
5. Frozen surface: PASS — all implementation changes fit the seven amended ownership groups; frozen generated/public and legacy visual surfaces are unchanged.
6. Locked decision: PASS — no filtering/router/state/backend/timer/poller/public-element prohibition is violated; `ResizeObserver` is geometry notification, not polling.
7. Shared-file ownership: PASS — the sole shared predecessor total has the precise Spec Kitty ownership amendment and no unrelated edit.
8. Production fragility: N/A — no new production `raise` exists; the finding is confined to Storybook pattern lifecycle resource ownership.

Verdict: **REJECT**. Observer teardown across real Storybook force-remount/replay and executable non-accumulation evidence are required before approval.
