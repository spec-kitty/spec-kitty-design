---
affected_files:
- apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts
- fixtures/elements-behaviour/src/sk-app-shell.test.ts
- packages/elements/SIZES.md
- packages/elements/custom-elements.json
- packages/elements/src/app-shell/sk-app-shell.stories.ts
- packages/elements/src/app-shell/sk-app-shell.ts
cycle_number: 8
mission_slug: repository-dossier-compact-navigation-shell-01M1Y3FY
reviewed_at: '2026-09-08T17:19:33Z'
reviewer_agent: codex-recovery-evidence
wp_id: WP01
---

Review result: the bounded correction checkpoint implements both substantive Randy findings without
scope growth. This recovery record is not an approval and does not supersede the rejected parent's
review verdicts.

- Rejected parent: `5afbec3f16dcb424ee4cbd0c72676935df64fab4`.
- Correction checkpoint: `59ff6df3f6363561ade0649428f2899d7f138fd4`.
- The checkpoint is the direct child of the rejected parent and changes exactly six files.

## Frozen reports

- Architect Alphonso — **APPROVED** —
  `6eeb52779de8d4c3c574e75564a9d1a508d784461955ee8f3a5fb9d303397d17`.
- Debugger Debbie — **APPROVED** —
  `4e6cff05b561ce6f94faa0566bacb60c65a17623374997e6c5afda688a706df7`.
- Reviewer Renata — **APPROVED** —
  `444afafa02414358b3afb6b9be94a70e3b03f3c98c3d204c16e725b383f23130`.
- Randy Reducer, first procedural report — **HOLD** —
  `a98c7abf352a00cd92bfa589e4aa03f6e93a949e54b9bd06e695775745ea3eb7`.
  The hold resulted from an invented missing `/tmp` brief and is preserved as procedural history.
- Randy Reducer, substantive rerun — **REJECTED** —
  `78431c21354628bc2bd738c35106bb756eee4d80cef86eff90e755fe4750770d`.

## Findings and checkpoint disposition

1. **Redundant unknown-presentation history.** Randy found that
   `#lastUnknownPresentation` duplicated Lit's committed previous value. The checkpoint deletes the
   field, assignment, and reset branch and compares the current value with
   `changed.get('presentation')`. The public converter, reflection, warning text, and fail-open
   legacy rendering are unchanged. The authored test now covers same-invalid/no-real-change,
   unrelated updates, a different invalid value, and re-entry through both `compact` and omitted
   presentation states.
2. **False short/tall viewport stories.** Randy found that both stories set only an inner-frame
   height, so `100vh`/`100dvh` still followed the browser viewport. The checkpoint removes the
   helper's height argument and inline height/overflow branch. It retains both story IDs and gives
   each Storybook 10.6 metadata in the official form: a source-local
   `parameters.viewport.options` map with exact `390px` by `320px`/`900px` styles and story
   `globals.viewport` objects containing the matching `value` and `isRotated: false`. The focused
   browser matrix consumes both IDs at real 390x320 and 390x900 page viewports, checks the
   frame/shell envelope and horizontal containment, and distinguishes short scrolling from tall
   non-scrolling.

## Evidence integrity

- Warning red-first: a temporary mutant removed the reset-history branch from the rejected
  implementation. The strengthened focused test completed with **1 failed / 29 skipped** because
  re-entry through valid and omitted states no longer emitted the two required repeat warnings.
  The mutant and its failure screenshot were restored/removed before implementation.
- Viewport red-first: the isolated Chromium run against the correct pre-fix static build completed
  with **2 failed**. The two stories returned inline frame heights `320px` and `900px` where the
  new regression required no inline height. The earlier default-port run that could not find either
  story used an unrelated Storybook server and is not semantic red-first evidence.
- Prior checkpoint green: focused authored Vitest completed **33/33**; the exact two-story
  Chromium/Firefox run completed **4/4**; the complete focused app-shell Chromium/Firefox file
  completed **48/48**; Storybook 10.6 built in 8.43 seconds. These are completed session-log
  results, not a fresh exact-SHA full gate.
- Recovery validation on checkpoint HEAD: range `git diff --check` passed; focused warning Vitest
  completed **1 passed / 29 skipped**; two uncached CEM generations were byte-identical at SHA-256
  `7d9b7009ce506b83bcd7cc0ac7833a5957da37a64dc549f5ca01d673ae80c740`, with
  `#lastUnknownPresentation` absent; a fresh Node 24.20.0 no-cache elements build followed by
  `measure-elements-sizes.mjs --check` reported `SIZES.md` up to date; and the built Storybook
  index plus emitted story module contain both IDs and their exact options/globals metadata.

## Mutation and approval status

Behavior/mutation metadata does not change. The runtime edit deletes redundant warning-history
state while retaining the warning branch and its authored transition envelope; the viewport edit is
non-behavioral Storybook metadata. The strengthened warning and viewport tests retain the intended
behavior envelope, so adding or relabeling an ADR-11 mutation arm would expand scope rather than
describe a new behavior.

This is correction and recovery evidence, never self-approval. A fresh full gate pinned to the
successor exact SHA and a fresh four-lens Codex squad against that same frozen SHA remain mandatory.
