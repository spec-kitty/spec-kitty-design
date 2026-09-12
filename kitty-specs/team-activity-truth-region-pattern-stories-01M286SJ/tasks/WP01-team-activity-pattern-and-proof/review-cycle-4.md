---
affected_files: []
cycle_number: 4
mission_slug: team-activity-truth-region-pattern-stories-01M286SJ
reproduction_command:
reviewed_at: '2026-09-11T14:43:01Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback — cycle 4

Reviewer profile: `reviewer-renata`
Reviewed implementation: `6e4f5c89424c69db4ec517742d6e7690bee47b29`
Diff base: `0a232a01a17627de6f1553ad0948b8b2f6f4f286`

## Required remediation

1. **High — FR-002 does not pin the named L1–L4 and OA1 fixture slots to their required states.**
   `validateFixture` in
   `packages/elements/src/patterns/team-activity.stories.ts:667-715` validates each repository and
   observed object only according to that object's own `state`. It pins the TL1 state tuple, but it
   never requires `repositoryLive.l1/l2/l3/l4` to be
   `populated/quiet/degraded/gap`, nor `observed.populated/retainedDegraded/quiet/loading` to be the
   corresponding observed state. A complete, internally valid fixture from another state is
   therefore accepted in every named slot, and the requested projection returns the wrong truth
   state. This violates FR-002's fail-closed invalid-combination contract and the state-specific
   L1–L4/OA1 requirements.

   Against the exact built story and its real `projectFixture` seam, these eight direct mutations
   all returned successfully:

   ```json
   [
     { "case": "l1-as-quiet", "projectedState": "quiet" },
     { "case": "l2-as-populated", "projectedState": "populated" },
     { "case": "l3-as-gap", "projectedState": "gap" },
     { "case": "l4-as-degraded", "projectedState": "degraded" },
     { "case": "observed-populated-as-quiet", "projectedState": "quiet" },
     { "case": "observed-degraded-as-loading", "projectedState": "loading" },
     { "case": "observed-quiet-as-populated", "projectedState": "populated" },
     { "case": "observed-loading-as-degraded", "projectedState": "retained-degraded" }
   ]
   ```

   Pin both named state tuples in `validateFixture` before projection, with exact fail-closed errors.
   Add built-story seam mutations for each named slot plus valid controls, so deleting either tuple
   check makes the focused test fail. Preserve the existing switch-level shape validation and TL1
   tuple guard; do not add a runtime/public API.

## Cycle-four remediation verified

- The built projection proof is no longer vacuous: nine valid state controls and a valid changed-
  bounds L4 candidate succeed through the same seam used by the invalid cases. Missing, empty, and
  whitespace `fromSequence`/`toSequence` cases assert the exact `TypeError` message.
- Forty-two independent clone mutations covering unexpected quiet/notice/gap/rows content, blank
  supplied gap copy, L4/TL1 gap completeness, and all four observed state shapes fail with their
  exact guard errors.
- The test seam remains Storybook-only, frozen, non-enumerable and non-writable. Stories remain
  excluded from the elements build; package barrels, manifests, wrappers, tokens, styles, runtime
  elements and behavior registries have zero delta.
- Cycle-one visuals remain closed: all 18 owned baselines pass in the official Playwright 1.62.1
  Noble image and representative L1/L5/TL1/OA1-degraded images were inspected directly.
- Factual-host L1/L3 equivalence and the exact L5 descendant/attribute/protected-value allowlist
  remain intact.

## Independent gate evidence

- `npm run quality:all`: passed (warnings only, zero errors).
- `node scripts/typecheck-all.mjs`: 5/5 projects passed.
- Pattern composition self-test/gate: 47 probes, 18 planted violations, 10 fixtures; no copied CSS
  or private reach-through.
- `npm run test`: 55 files, 773/773 tests passed.
- Storybook production build: passed.
- Focused Chromium built-story suite: 21/21 passed.
- Official Playwright 1.62.1 Noble focused matrix: 59 passed, 4 expected non-Chromium media/axe
  skips; Chromium, Firefox, and WebKit functional coverage passed.
- Official Noble Team Activity visuals: 18/18 passed.
- Gate self-test: 50/50 shapes classified correctly.
- Global axe: 735/735 stories rendered; zero WCAG 2.1 AA violations.

## WP anti-pattern checklist

1. Dead code: **PASS** — the Storybook-discovered module has live story callers and adds no runtime
   module/API.
2. Synthetic-fixture test: **PASS** — current positive and negative proofs invoke the real built
   projection seam; positive controls prevent an always-throwing substitute from passing.
3. Silent empty return: **PASS** — no new silent return or swallowed production failure exists.
4. FR coverage: **FAIL** — FR-002 does not reject coherent wrong-state objects in the named
   L1–L4/OA1 slots.
5. Frozen surface: **PASS** — no public/generated/runtime frozen surface changed.
6. Locked decision: **PASS** — no forbidden application logic, runtime component, or private
   reach-through was added.
7. Shared-file ownership: **PASS** — this is the mission's sole WP; shared story/visual inventory
   serialization is explicit.
8. Production fragility: **N/A** — validation throws are confined to Storybook fixture evidence.

No `contracts/` artifact exists for this mission.
