# WP01 review feedback — cycle 2

Reviewer profile: `reviewer-renata`
Reviewed implementation: `1d37a276e40d879964ba0dc99b2dfe3bba1f9075`
Diff base: `0a232a01a17627de6f1553ad0948b8b2f6f4f286`

## Required remediation

1. **High — the L4 fixture guard does not fail closed when a required sequence bound is missing.**
   `validateRepositoryLive` in
   `packages/elements/src/patterns/team-activity.stories.ts:548-557` checks that the gap object,
   rows, and exact supplied sentence exist, but it never checks `fromSequence` or `toSequence`.
   The only planted guard at lines 883-899 mutates the sentence. Importing the exact built-story
   module and setting either bound to `""` shows that `projectTeamActivity(fixture, "l4")` accepts
   both malformed fixtures and returns them with the unchanged `#5`/`#9` sentence. This contradicts
   the specification edge case, “An L4 gap missing from/to sequence or supplied sentence fails
   closed,” plus FR-002 and T002's complete-gap guard requirement.

   Add the smallest validation that rejects blank/missing supplied `fromSequence` and `toSequence`,
   and add adversarial proof for each bound so removing either check makes the focused built-story
   evidence fail. Keep the visible sentence consumer-supplied; do not derive or reconstruct it.

### Reproduction

Against a fresh Storybook build at the reviewed SHA, dynamically import the emitted
`team-activity.stories-*.js`, `structuredClone(TEAM_ACTIVITY_FIXTURE)`, set first
`fixture.repositoryLive.l4.gap.fromSequence = ""` and then `toSequence = ""`, and call
`projectTeamActivity(fixture, "l4")`. Both calls currently return successfully.

Observed result:

```json
[
  { "field": "fromSequence", "accepted": true },
  { "field": "toSequence", "accepted": true }
]
```

## Cycle-two remediation verified

- The 18 owned Team Activity baselines pass 18/18 in the Playwright 1.62.1 Noble image and were
  inspected directly; the former L4/TL1/intermediate/RTL/long/media drift is closed.
- L1 and L3 render the same frozen, separately named factual-host region; their normalized DOM,
  accessibility snapshot, and projection JSON are identical while the reported-live states remain
  distinct.
- L5 pins the exact `MAIN`/`STYLE`/`P` descendant-and-attribute shape and scans visible, hidden,
  accessibility, title, and data-attribute values for protected fixture strings.

## Independent gate evidence

- `npm run quality:all`: passed (warnings only, no errors).
- `node scripts/typecheck-all.mjs`: 5/5 projects passed.
- Pattern composition self-test/gate: 47 probes; 10 fixtures; no copied CSS or private reach-through.
- `npm run test`: 55 files, 773/773 tests passed.
- Storybook production build: passed in 8.8 seconds.
- Focused Chromium: 19/19 passed.
- Noble Chromium/Firefox/WebKit: 53 passed, 4 expected Chromium-only media/axe skips.
- Global axe: 616 declared routes present; 735/735 rendered; zero WCAG 2.1 AA violations.
- Noble owned visuals: 18/18 passed.
- Gate self-test: 50/50 classified correctly.
- React-wrapper, styles-only markup, Vue types, element CSS, and element-size drift checks: passed.

## WP anti-pattern checklist

1. Dead code: **PASS** — the story module is auto-discovered and its helpers have live story callers.
2. Synthetic-fixture tests: **PASS** — browser assertions exercise the built Storybook output.
3. Silent empty return: **PASS** — no new silent production return was found.
4. FR coverage: **FAIL** — FR-002's complete L4 fail-closed guard lacks required bound assertions.
5. Frozen surface: **PASS** — no public/generated element, style, token, wrapper, or manifest delta.
6. Locked decision: **PASS** — no application state/API or forbidden domain surface was added.
7. Shared-file ownership: **PASS** — shared ratchet/visual ownership and serialized landing are explicit.
8. Production fragility: **N/A** — this WP adds no production request/worker/CLI raise path.

No `contracts/` artifact exists for this mission.
