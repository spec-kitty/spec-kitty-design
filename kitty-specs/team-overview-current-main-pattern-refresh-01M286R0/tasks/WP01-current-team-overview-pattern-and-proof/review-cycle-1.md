---
affected_files: []
cycle_number: 1
mission_slug: team-overview-current-main-pattern-refresh-01M286R0
reproduction_command:
reviewed_at: '2026-09-11T13:30:54Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback — cycle 1

## Blocking finding

### High — TO1 repeats the retention summary instead of deriving it

Issue #383 requires repeated totals and window labels to be derived from the one immutable
TeamMoment/repository fixture. The implemented `RetentionWindow` nevertheless accepts a complete
`summary` string (`team-overview.fixture.ts:30-35`), and both windows manually repeat their cell
total and hour count (`team-overview.fixture.ts:301-328`). `projectPopulatedOverview` correctly
derives `eventTotal`, but merely clones that independent summary (`team-overview.fixture.ts:182-215`),
while the story renders the cloned string as both visible and accessible output
(`team-overview.stories.ts:775-784`). A caller can change `cells[].count` or `hours` and leave the
displayed summary stale, violating issue #383, FR-003, FR-004, and WP01 binding-shape item 4.

The current fixture and browser tests do not catch that regression: they assert the manually
authored strings verbatim (`pattern-team-overview.test.ts:32-50` and
`sk-team-overview-pattern.spec.ts:102-108,160-168`). Preserve the consumer-supplied copy/i18n
boundary, but derive the displayed count/window label from the selected retention inputs (for
example through fixture-supplied formatting parts or a formatter contract local to this story).
Add an adversarial projection/render test that changes the hours and cell counts without also
editing a precomposed summary, then proves the visible and accessible summary follows the derived
values.

## Validation notes

- `quality:all`, typecheck, pattern composition, elements build, Storybook build, and the full
  801-test Vitest suite pass.
- The focused Team Overview Playwright suite passes 12/12 in both Chromium and Firefox when served
  on isolated ports; axe, keyboard, drawer, focus-return, narrow-target, RTL, forced-colors,
  reduced-motion, zoom, and overflow assertions execute against the built stories.
- All 19 owned Team Overview visual cases pass in the mission's pinned Playwright 1.62.1
  DejaVu/Noble image. Fedora's Noto fallback changes text metrics; that inherited host drift is not
  an owned failure. Representative default, narrow, first-run, and long-content baselines were
  inspected and contain the claimed current surfaces without clipping.
- Exactly six replacement story IDs and 19 current baselines are present; the obsolete #150
  Delivery/Flow cases and eleven snapshots are removed, and the migration note clearly marks them
  historical/deprecated.

## Anti-pattern checklist

1. Dead code — PASS (story-only projection is called by the discovered stories; no runtime export).
2. Synthetic-fixture test — FAIL for FR-003/FR-004 summary derivation as described above.
3. Silent empty return — PASS.
4. FR coverage — FAIL for the derived repeated total/window-label clause of FR-003/FR-004.
5. Frozen surface — PASS (no frozen runtime element or package-export surface changed).
6. Locked decision — PASS (the story-only surface respects the programme ownership boundary).
7. Shared-file ownership — PASS (one WP; the cross-mission visual-inventory landing order is explicit).
8. Production fragility — N/A (new fail-loud validation is confined to story fixture projection).
