---
affected_files: []
cycle_number: 2
mission_slug: mission-kanban-pattern-stories-01M22F6C
reproduction_command:
reviewed_at: '2026-09-09T13:06:13Z'
reviewer_agent: codex
wp_id: WP01
---

# WP01 independent review cycle 2 — changes requested

Exact successor tree reviewed: `58a525341a51a3b6ce06312f1a9bd2cb646fe433`.

## Finding 1 — conditional overflow semantics become stale after a live viewport change

- Severity: HIGH
- Files: `packages/elements/src/patterns/mission-kanban.stories.ts:617-629,750-774`; `apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts:425-458`
- Requirements: FR-009, NFR-002, NFR-003, NFR-004, NI-006; plan risk/control at line 553
- Explanation: cycle 1's initial-render defect is corrected, but `syncWorkflowScrollerSemantics()` runs only once from Storybook `basePlay()`. The binding condition is a rendered-layout invariant: the triad may exist only while the board genuinely overflows. An already-rendered responsive story can cross that threshold without Storybook rerunning `play`, leaving semantics stale in either direction.
- Independent reproduction:
  - A freshly loaded K6 at 1600x1000 fits (`scrollWidth=1256`, `clientWidth=1256`) and correctly has no triad.
  - Resizing that same isolated story to 1280x800 makes it overflow (`1172 > 936`) but the role/name/tabindex remain absent. This reproduced in Chromium, Firefox, and WebKit.
  - Conversely, a freshly loaded 1280x800 K6 correctly has the triad, but resizing the same page to 1600x1000 makes it fit (`1256 == 1256`) while `role="region"`, `aria-label="Work package Kanban"`, and `tabindex="0"` remain, recreating the dead tab stop.
  - The real Storybook manager lifecycle does not rescue this. With a wide manager preview, K6 began fitting (`1556 == 1556`) with no triad. After setting a sentinel on the rendered root and choosing Toolbar -> Viewport size -> Small mobile, the sentinel remained (proving no rerender/replay); the board then overflowed (`1172 > 272`) while the triad remained absent.
- Why the new test is incomplete: it loads two separate pages with their final viewport set before navigation. Those assertions prove initial geometry is no longer faked, but cannot detect stale semantics after the normal responsive viewport changes that FR-009 governs.
- Required remediation: keep the behavior story-only and consumer-owned, but synchronize the attributes when the rendered scroller's geometry changes. A bounded `ResizeObserver` (or equivalent non-timer/non-polling layout observer) is appropriate; arrange lifecycle cleanup so rerenders do not accumulate observers. Add one browser test that resizes the same already-loaded K6 across the fit/overflow threshold in both directions and asserts geometry, exact triad addition/removal, document containment, and overflow-state focus containment. Preserve K2's existing genuine overflow/focus behavior.
- Disposition: must_fix_before_approval

## Prior finding dispositions

- Cycle 1 Finding 1, initial geometry: partially resolved. Fresh 1600-fit and fresh 1280-overflow K6 states now have correct semantics in all three engines, and K2 remains correct at 390px. Live geometry changes remain blocking as described above.
- Cycle 1 Finding 2, shared story-total ownership: resolved. Primary commit `1b7a211307e954e71bc31004ffd14e74192f05c9` adds the predecessor test to WP01 ownership solely for its integration-sensitive global total, updates T009/T012, and records the amendment. The implementation still changes only `391` to `401` in that file; every #277 selector, ID, semantics, documentation, focus, axe, and visual assertion is unchanged. The focused predecessor source/public contract passes 4/4.

## Independent evidence

- `node scripts/check-pattern-composition.mjs`: PASS.
- `node scripts/typecheck-all.mjs`: PASS across five projects.
- `npm run quality:all`: PASS.
- `npx nx run storybook:storybook:build`: PASS; exactly ten user-facing Mission Kanban entries plus docs.
- Pinned `mcr.microsoft.com/playwright:v1.62.1-noble` focused #278 replay: 51/51 PASS across Chromium, Firefox, and WebKit. The suite is green because it does not resize an already-loaded story.
- Pinned Noble #277 source/public contract replay: 4/4 PASS in Chromium, including the exact global story total.
- Pinned Noble owned visual replay: 10/10 PASS in Chromium. No cycle-2 PNG or visible-layout delta exists; the ten previously inspected baselines remain visually acceptable, and the defect is semantic/responsive-lifecycle behavior not represented by a static image.
- Generated/public/token/wrapper/barrel/manifest surfaces and legacy PNGs have zero WP delta. No #279-#284 implementation was found.

## WP anti-pattern checklist

1. Dead code: PASS — the story-only helper is called by every story's play path; no public production API exists.
2. Synthetic-fixture test: PASS — focused tests exercise built Storybook output; source guards remain supplemental.
3. Silent empty return: PASS — the defensive non-HTMLElement return is reached only behind a fail-fast scroller existence assertion, and observable semantics are directly tested.
4. FR coverage: FAIL — no test exercises FR-009 across a live geometry threshold, and the rendered story violates it after resize (Finding 1).
5. Frozen surface: PASS — all 16 implementation paths fit the seven amended owned groups; frozen generated/public and legacy visual surfaces are unchanged.
6. Locked decision: FAIL — stale add/remove semantics contradict the locked conditional-overflow rule (Finding 1); no other MUST NOT violation was found.
7. Shared-file ownership: PASS — the sole shared predecessor assertion now has a precise Spec Kitty amendment/activity note and no unrelated edit.
8. Production fragility: PASS — no production runtime path or new raise was added; fixture failures remain intentional story-only fail-closed guards.

Verdict: **REJECT**. A responsive-lifecycle correction and fresh independent review are required.
