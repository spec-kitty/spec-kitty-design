---
affected_files: []
cycle_number: 1
mission_slug: mission-reading-pattern-stories-01M21HSX
reproduction_command:
reviewed_at: '2026-09-09T01:36:28Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback — cycle 1

Verdict: **REJECT** at exact lane head `5ba4149b0cc3e90d6db756e3b8b9f394f8857565`.

## 1. High — M2 does not render the required 240px compact drawer

- Affected surface: `packages/elements/src/patterns/mission-reading.stories.ts:753` and the compact composition at `:1205`.
- Evidence: at the required 390×844 presentation, a real Chromium measurement of `[slot="compact-navigation"]` is 358px wide (16px shell inset on each side), not 240px. The committed open-drawer baseline likewise shows navigation spanning the available 390px layout width.
- Test gap: `apps/storybook/src/tests/sk-mission-reading-pattern.spec.ts:410` calls the entire viewport a “240px drawer” by setting the viewport itself to 240px; it never measures drawer width at 390px. This does not test T003 or the M2 acceptance contract.
- Required fix: constrain the consumer-owned compact navigation/sidebar surface to the authoritative 240px token width at 390px, retain containment and complete catalogue access, and assert its computed bounding width in the real 390px story. Regenerate and inspect the M2 open visual from the fixed final head.

## 2. High — narrow content gutters are 24px, not the required 16px

- Affected surface: `packages/elements/src/patterns/mission-reading.stories.ts:556-562`.
- Evidence: `.sk-mission-reading-pattern__content` uses `padding: var(--sk-space-6)` at every width. The current token resolves `--sk-space-6` to 24px; an exact-head Chromium probe at 390px reports `padding-inline-start: 24px` and `padding-inline-end: 24px`.
- Test gap: the threshold/containment loop at `apps/storybook/src/tests/sk-mission-reading-pattern.spec.ts:373-384` checks only page-level overflow. It never measures the required 16px (`--sk-space-4`) inline gutters, so the contract regression passes.
- Required fix: retain the 24px desktop inset but switch narrow content to the authoritative 16px token at/below the public compact threshold. Add computed left/right gutter assertions at 390px and re-capture affected visuals.

## 3. Medium — desktop Mission context omits the approved Back to repository destination

- Affected surface: `packages/elements/src/patterns/mission-reading.stories.ts:753-779`.
- Evidence: `contextSidebar()` renders `Back to repository` only when `placement === "compact"` (`:763-771`). The approved M1 design and `DESIGN.md` require the Mission context sidebar to start with that quiet real link; the committed M1 baseline starts directly with repository/Mission identity instead.
- Required fix: compose the same fixture-owned native back link at the start of the desktop Mission context sidebar, preserve it as the first compact focus target, and add an M1 assertion for its destination/placement.

## 4. Medium — the committed visual matrix does not include full-composition M3/M5/M6/M7 baselines

- Affected surface: `apps/storybook/src/tests/visual.spec.ts:1168-1222` and the corresponding PNGs.
- Evidence: issue #265 requires reviewed full-composition baselines for M1–M8. M3, M5, M6a/M6b, and M7a/M7b are placed in `missionReadingStateCases` and screenshot only `[aria-busy="true"]`, `sk-notice`, or `[data-document-frame]`. Their committed dimensions (for example M3 936×213, M5 936×96, M7a 936×153) prove they omit the shell, contextual navigation, header, git facts, and route-level geometry.
- Required fix: make every reviewed M1–M8 route state a full-composition baseline. Focused crops may remain as additional risk evidence, but they cannot replace the issue-bound full-route baselines. Regenerate with repository visual tooling and inspect the exact new head.

## 5. Low — the #265 story-ratchet history note is stale after the final rebase

- Affected surface: `expected-stories.json:44`.
- Evidence: the note says #265 moves total `347 -> 361`, while the actual rebased change moves the ratchet from 361 to 375 and the file now declares `total: 375`.
- Required fix: update the authored history note to the real rebased before/after totals and rerun the story/axe ratchet gate.

## Re-review expectations

Keep the implementation on the existing public surfaces and tokens; do not add a component or application state. Add assertions that fail on the two measured M2 defects, regenerate all affected exact-head baselines through the repository tooling, rerun the focused three-engine/axe/composition checks plus required full gates, and return a clean lane for review.
