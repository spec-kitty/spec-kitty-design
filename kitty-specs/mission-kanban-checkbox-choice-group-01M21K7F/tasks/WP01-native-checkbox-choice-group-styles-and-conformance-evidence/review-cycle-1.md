---
affected_files: []
cycle_number: 1
mission_slug: mission-kanban-checkbox-choice-group-01M21K7F
reproduction_command:
reviewed_at: '2026-09-09T02:00:08Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback — cycle 1

Reviewer: Codex, profile `reviewer-renata`

Verdict: changes requested

## BLOCKER — committed checkbox visual baselines do not match the final implementation

The final, targeted visual-regression command is red for every checkbox-choice-group case:

```sh
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts \
  --project=chromium --grep 'SK-checkbox-choice-group'
```

Result: 8 failed, 0 passed at implementation head `a97e6023303bceff5242650e1bc3b3c1a73d47f3`.

The failures are not merely sub-threshold raster noise. Examples include:

- default dark, light, narrow, and focus: expected `186 x 578`, received
  `196 x 578`;
- disabled and forced colors: expected `280 x 266`, received `320 x 266`;
- long content: expected `358 x 376`, received `358 x 412`;
- K3: expected `1024 x 376`, received `1024 x 378`.

Commit `218a1783fe463d3a37898cb551c5e9edf40dc32b` changed the intrinsic grid minimum in
`packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group.css`, but its commit changed
only the K3 Playwright snapshot. The other seven checkbox snapshots remained at their earlier
dimensions. This contradicts FR-014, NFR-008, T006/T008, and the Definition of Done requirement
that visual regression be green at the final CSS state.

### Required remediation

1. Run the repository's CI-authoritative Linux Chromium visual workflow against the final CSS.
   Do not blindly accept this review host's output: the complete local visual suite also shows
   broad pre-existing font/dimension drift (128 of 132 unrelated-plus-new cases failed), so the
   authoritative CI artifact must decide the baseline.
2. Regenerate every affected `sk-checkbox-choice-group-*.png` baseline from that one authoritative
   final state, not only K3. Inspect all eight resulting images for dark, LightMode, K3, narrow,
   long content, disabled, focus, and forced-colors fidelity.
3. Re-run the exact targeted command above and provide a green 8/8 result tied to the new head.
4. If CSS changes during remediation, refresh and re-check the genuine 100%/200% zoom evidence as
   well; its current record is tied to tree
   `7ff82e10ab52a5f01b1396405bdc21cdcf23289e`.

## Verification evidence and environment follow-up

The following passed independently and do not need implementation changes unless the visual fix
disturbs them:

- generated styles-only barrel check;
- styles build and governed token-literal check;
- quality/lint/stylelint/htmlhint;
- Storybook production build;
- full Vitest suite: 505/505;
- typecheck, story-theme, and suite self-tests;
- checkbox native/browser/accessibility suite on Chromium and Firefox: 48 passed, 6 intentional
  engine skips;
- all 12 checkbox stories axe-clean in that dedicated suite;
- zoom metrics: 24 story/zoom states, 166 focus observations, zero document/choice overflow, and
  zero focus-boundary failures.

Before the next review, also run the unqualified dedicated Playwright command in an environment
with the configured WebKit runtime libraries. On this host, all WebKit cases failed before test
execution because GTK/ICU/GStreamer launch dependencies are absent; Chromium and Firefox were
green. The repository-wide axe script likewise lost its Chromium context partway through an
unrelated pre-existing story, while the dedicated checkbox axe coverage remained green. Record a
complete WebKit and full axe run from the gate environment so the claimed cross-engine/full-gate
evidence is durable.

## WP anti-pattern checklist

1. Dead code: PASS — styles are imported by the story; generated fixtures are consumed by live
   stories; no runtime function/class/module API was added.
2. Synthetic-fixture tests: PASS — browser tests load the production Storybook build and exercise
   native DOM/form/AX behavior.
3. Silent empty return: PASS — no production JavaScript path was added.
4. FR coverage: FAIL only for FR-014 at the final visual-regression gate; other FRs have direct
   source or browser assertions.
5. Frozen surface: PASS — element, wrapper, manifest, token, behavior, mutation, and suite-budget
   surfaces are unchanged.
6. Locked decision: PASS — no custom element, custom glyph, state store, filtering, persistence,
   validation, or Team Kitty public API was introduced.
7. Shared-file ownership: N/A — this mission contains exactly one WP.
8. Production fragility: PASS — no production raise path was added.
