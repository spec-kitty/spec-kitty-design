---
affected_files:
- packages/elements/src/app-shell/sk-app-shell.ts
- fixtures/elements-behaviour/src/sk-app-shell.test.ts
- apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts
- mutations.json
- suite-budget.json
- packages/elements/SIZES.md
- docs/architecture/validation/issue-254-compact-navigation/evidence.md
- kitty-specs/repository-dossier-compact-navigation-shell-01M1Y3FY/acceptance-matrix.json
cycle_number: 3
mission_slug: repository-dossier-compact-navigation-shell-01M1Y3FY
reproduction_command: TMPDIR=/home/jeroennouws/dev/spec-kitty-design-missions/254/.tmp npx vitest run fixtures/elements-behaviour/src/sk-app-shell.test.ts -t 'ordinary controlled close releases focus' --reporter=default
reviewed_at: '2026-09-08T00:53:50Z'
reviewer_agent: codex
wp_id: WP01
---

# WP01 independent Codex review — cycle 3

**Verdict:** REJECT

**Reviewed SHA:** `2646d4ffa581a77f70d09effbea17b7748951295`

**Base:** `origin/train/elements-first` at `57e1f466afd3ead40523aa3d25d86b85eda87bce`

## Findings

1. **HIGH — ordinary consumer-controlled close can strand focus inside the hidden drawer.**
   Changing `open` from `true` to `false` hides and inerts compact navigation, but focus cleanup
   runs only when compact presentation ends or the responsive threshold is crossed. Chromium 151
   reproduced `open=false`, `hidden=true`, and `aria-hidden=true` while the Missions route remained
   `document.activeElement`; direct assignment reproduced in Chromium and Firefox. Existing tests
   asserted only that `compactTrigger` was not focused. Required disposition: release focus from
   compact navigation on the consumer-controlled true-to-false transition without turning route
   close into Escape-style trigger restoration, retain accepted-Escape focus return, cover rejected
   Escape followed by route close, and add a source-owned mutation arm.
2. **LOW — focused-suite evidence count is stale.**
   `docs/architecture/validation/issue-254-compact-navigation/evidence.md` and
   `acceptance-matrix.json` retained a 32-case focused-suite count. The exact pre-fix suite was
   34/34. Required disposition: update both artifacts to the settled post-fix count.

The correction and validation disposition is recorded in `review-feedback-3.md`. Earlier cycles
remain unchanged.
