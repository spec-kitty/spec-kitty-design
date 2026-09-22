---
affected_files: []
cycle_number: 1
mission_slug: repository-dossier-compact-navigation-shell-01M1Y3FY
reproduction_command:
reviewed_at: '2026-09-07T17:20:35Z'
reviewer_agent: codex
wp_id: WP01
---

# WP01 independent Codex review — cycle 1

**Verdict:** REJECT
**Reviewed SHA:** `5117e73afae3324895051b0117c1dc02487377a6`
**Base:** `origin/train/elements-first` at `830fd3705b24bcf0db234a5693efec54300f94f5`

The independent Codex reviewer completed the substantive audit and reported the
following blocking findings before its bounded 1,200-second wrapper timed out while
formatting this artifact. The orchestrator transcribed the reviewer's reproduced
evidence from the review session; this is a rejection, not a self-approval.

## Blocking findings

### F1 — `compactTrigger` accepts a falsely slotted descendant

- **Severity:** high
- **Evidence:** `packages/elements/src/app-shell/sk-app-shell.ts:118-132`
  uses `trigger.closest('[slot="compact-header"]')` and only checks containment/root.
  A trigger moved beneath an arbitrary light-DOM `<section>` while retaining
  `slot="compact-header"` has `assignedSlot === null`, yet the validation accepts it.
  The reviewer reproduced accepted Escape focus restoration to that non-slotted
  trigger in Chromium.
- **Acceptance impact:** violates the same-root + actual compact-header slot
  validation contract and can move focus to a hidden or unrelated control.
- **Required fix:** validate real slot assignment to this shell's
  `slot[name="compact-header"]`, including any intended direct wrapper semantics, and
  similarly require the controlled target to be genuinely assigned within this
  shell's compact-navigation slot. Add red-first unit/browser coverage for the false
  `slot`-attribute construction and valid constructions.

### F2 — CSS and JavaScript use different inline-size coordinate systems

- **Severity:** high
- **Evidence:** `packages/elements/src/app-shell/sk-app-shell.ts:71-82` consumes
  `borderBoxSize`/`getBoundingClientRect()`, while
  `packages/styles/src/app-shell/sk-app-shell.css:40` uses a container query, whose
  query size is the content box. With a `box-sizing:border-box` shell at 861px and
  1px inline padding, Chromium and Firefox both showed the compact header because the
  content box was 859px, while JavaScript treated the shell as noncompact, kept the
  drawer ineffective, and emitted no Escape dismissal.
- **Acceptance impact:** violates the single inclusive 860px shell-local breakpoint
  and the `presentation === compact && inline-size <= 860px && open` effective-open
  contract; rendered presentation and behavior disagree.
- **Required fix:** observe and initialize from the same content-box size that the
  container query uses, with robust fallbacks and cleanup. Add Chromium + Firefox
  regression coverage at the padded 860/861 boundary.

### F3 — committed evidence is explicitly pre-rebase and incomplete

- **Severity:** high (delivery gate)
- **Evidence:**
  `docs/architecture/validation/issue-254-compact-navigation/evidence.md` is titled
  `PRE-REBASE evidence ledger`, says all mandatory gates will be rerun later, records
  an interrupted mutation retry, and does not establish the exact reviewed SHA.
- **Acceptance impact:** the final issue/repository verification and acceptance gate
  cannot be claimed from this artifact.
- **Required fix:** after F1/F2 are corrected and the train is refreshed, complete the
  required exact-head matrix (including complete mutation coverage or the exact
  command/failure), replace the placeholder ledger with exact-SHA evidence, and keep
  unavailable real-UI zoom, WebKit system dependencies, and local visual-baseline
  mismatch as explicit limitations rather than passes.

## Commands and results observed by the reviewer

- `npx playwright test apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts --project=chromium --project=firefox` — 26/26 passed, but did not cover F1/F2.
- Manual Playwright reproductions — F1 reproduced in Chromium; F2 reproduced in Chromium and Firefox.
- `npm run test` — 45 files / 483 tests passed.
- `node scripts/suite-selftest.mjs --selftest` — 10/10 guard checks passed; baseline 449 assertions.
- CSS/markup/React/Vue/SIZES generation checks, manifest/entries/part/behavior/theme/gate checks, typecheck, build, and `npm run quality:all` — passed (existing lint warnings only).

The wrapper exited 124 after 1,200 seconds while composing its final output; that
timeout is an orchestration limit, not a test failure and does not negate the explicit
blocking findings above.
