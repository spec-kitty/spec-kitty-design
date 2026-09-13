---
affected_files: []
cycle_number: 3
mission_slug: team-activity-truth-region-pattern-stories-01M286SJ
reproduction_command:
reviewed_at: '2026-09-11T14:17:43Z'
reviewer_agent: codex
wp_id: WP01
---

# WP01 review feedback — cycle 3

Reviewer profile: `reviewer-renata`
Reviewed implementation: `d8663e97955095de5e9135cb01f892a0645ff4e7`
Diff base: `0a232a01a17627de6f1553ad0948b8b2f6f4f286`

## Required remediation

1. **High — the new L4 browser proof can pass when its projection seam always throws.**
   `apps/storybook/src/tests/sk-team-activity-pattern.spec.ts:347-398` calls
   `projectFixture` only with invalid candidates and treats every caught exception as proof of the
   sequence-bound guard. The function-presence check at lines 371-373 does not establish that the
   seam reaches the real projector. Replacing only the seam implementation at
   `packages/elements/src/patterns/team-activity.stories.ts:1645-1649` with an always-throwing
   function would leave all four assertions green. That is the synthetic/vacuous test defect
   prohibited by DIRECTIVE_041 and the WP anti-pattern checklist.

   Add a positive control through the same built-story seam: a structured clone with valid,
   non-blank changed bounds must project successfully as L4 and preserve those supplied bounds.
   Keep the empty and whitespace cases, add the literal missing-field cases promised by the spec,
   and assert the expected guard error rather than accepting any unrelated exception. The current
   seam itself is appropriately Storybook-only and non-enumerable; preserve that property.

2. **High — FR-002 still does not reject the full invalid truth-state combinations required by
   the spec.** `validateRepositoryLive` at
   `packages/elements/src/patterns/team-activity.stories.ts:507-562` checks each state's required
   content but not the absence of content belonging to other states. Because
   `repositoryProjection` copies every truthy optional field, the real built projector currently
   accepts and exposes contradictory regions. At the exact reviewed build:

   - adding the supplied degraded `notice` to L2 is accepted, and the projection contains both
     `quiet` and `notice`;
   - adding L4's supplied `gap` to L1 is accepted, and the populated projection contains `gap`;
   - blanking `copy.gap` plus the L4 and TL1 gap sentences is accepted, despite the explicit edge
     case that a missing supplied sentence fails closed.

   Enforce state-exclusive live shapes by construction: populated has rows and no quiet/notice/gap;
   quiet has exact non-blank quiet copy and no rows/notice/gap; degraded has exact non-blank notice
   and no rows/quiet/gap; gap has rows, complete non-blank bounds and sentence, and no quiet/notice.
   Apply the same state-exclusivity check to observed states where optional notice data could leak
   across populated/quiet/loading. Prove representative contradictions through the real built
   projection seam, with a passing valid control so the proof cannot be satisfied by an unrelated
   exception.

## Cycle-three remediation verified

- The real built projection rejects missing, empty, and whitespace-only `fromSequence` and
  `toSequence`; a valid clone with changed non-blank bounds projects successfully.
- The story-only test seam is a non-enumerable DOM property, the story module remains excluded from
  `packages/elements/tsconfig.lib.json`, and no package barrel, manifest, wrapper, token, style, or
  runtime element surface changed.
- Cycle-one visual drift remains closed: the pinned Playwright 1.62.1 Noble owned visual replay is
  18/18 green at the reviewed SHA.
- Cycle-one factual-host proof remains closed: L1/L3 reuse the frozen host slice and the focused
  browser test compares DOM, accessibility snapshot, and projection data.
- Cycle-one L5 proof remains closed: the exact descendant/attribute allowlist and recursive
  protected-value scan remain intact.

## Independent gate evidence

- `npm run test`: 55 files, 773/773 tests passed.
- `node scripts/typecheck-all.mjs`: 5/5 projects passed.
- Storybook production build: passed.
- Focused Chromium built-story suite: 20/20 passed, including axe, semantics, responsive, theme,
  keyboard, forced-colors, reduced-motion, and the new bound cases.
- Pinned Playwright 1.62.1 Noble owned visuals: 18/18 passed.
- `npm run quality:all`: passed (warnings only, zero errors).
- Pattern composition self-test/gate: 47 probes; 10 fixtures; no copied CSS/private reach-through.

## WP anti-pattern checklist

1. Dead code: **PASS** — the story module is auto-discovered; no new runtime module/API ships.
2. Synthetic-fixture test: **FAIL** — the negative-only `projectFixture` test can pass on an
   always-throwing seam.
3. Silent empty return: **PASS** — no new silent return or swallowed production failure exists.
4. FR coverage: **FAIL** — FR-002's state-exclusive fail-closed contract remains incomplete.
5. Frozen surface: **PASS** — public/generated runtime surfaces have zero delta.
6. Locked decision: **PASS** — no application logic, runtime component, or private reach-through
   was added.
7. Shared-file ownership: **PASS** — this is the mission's sole WP and shared inventory ownership
   is explicit.
8. Production fragility: **N/A** — the validation throws are confined to Storybook fixture
   authoring/projection evidence.

No `contracts/` artifact exists for this mission.
