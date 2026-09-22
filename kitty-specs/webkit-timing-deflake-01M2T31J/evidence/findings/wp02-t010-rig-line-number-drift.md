# WP02 T010 — instrumentation edits silently broke WP01's rig's line-based test selection

**Mission**: webkit-timing-deflake-01M2T31J, WP02, sub-task T010.
**Date**: 2026-09-18.

## What was attempted

Added a paint/font-load diagnostic helper (`installPaintDiagnostic`/`attachPaintDiagnostic`) plus a
raw-pixel-value attach helper (`attachSample`) to `apps/storybook/src/tests/sk-progress.spec.ts`,
instrumenting items 1 (`:369`) and 4 (`:465`) per T010. Pushed twice to the lane branch to trigger
`scripts/webkit-repeat-run.mjs` via `.github/workflows/webkit-repeat-run.yml` (`on.push`).

## Verbatim symptom

First push (commit `9239ceaa`, run `35352038231`): the rig correctly selected and ran items 1 and 4
(10/10 failures each, diagnostic annotations present). Second push (commit `7a73ee2f`, run
`35353032768`): the JSON report contained **zero** `sk-progress.spec.ts` results at all — only
`sk-team-overview-shell-layout.spec.ts`, `sk-workflow-board.spec.ts` and `sk-radio-choice-group.spec.ts`
(90 results total). No error was raised; the invocation just silently ran fewer tests.

## Root cause

`scripts/webkit-repeat-run.mjs`'s `LINE_ITEMS` array selects tests by **hardcoded absolute
`file:line`** (`369`, `440`, `456`, `465`, `510` for items 1–5). The first diagnostic commit inserted
a ~60-line helper block **above** line 369 (after `samplesEqual`), shifting every test below it
downward. Playwright's CLI `file:line` filter requires an **exact** match against a test's own
declaration line — landing mid-body (as the shifted `369`/`440`/etc. now did) matches nothing, and a
non-matching filter token is dropped silently rather than erroring, so the other, unaffected
`file:line` tokens (shell-layout/workflow-board/radio-choice-group, none of which WP02 touches) still
ran normally while all five `sk-progress` items vanished from the run with no error signal.

## Workaround

`scripts/webkit-repeat-run.mjs` is WP01-owned (`scripts/**`), outside WP02's `owned_files`
(`apps/storybook/src/tests/sk-progress.spec.ts`, `packages/styles/src/progress/**`), so it was not
edited. Instead, `sk-progress.spec.ts`'s own edits were restructured to be **line-count-neutral**
around the five original test declarations: new top-level helpers moved to the end of the file
(after the last `test.describe` block — safe because Playwright collects all `test()` registrations
before invoking any callback, so a forward reference to a `const` declared later in the same module
resolves fine by the time the callback actually runs), and in-body instrumentation calls appended to
existing lines via `;` rather than inserted as new lines, so lines 369/440/456/465/510 keep pointing
at the same five `test(...)` declarations after every edit.

## Root-cause hypothesis (why the rig is fragile this way)

The rig's design assumes `sk-progress.spec.ts` is static for the duration of the mission, but WP02's
own owned surface **is** that file, and T012–T015 require substantive edits to the same five tests
(paint-settling awaits, phase-selection, red-first mutations). Hardcoded absolute line numbers and an
owned-surface WP that must edit that exact file are in tension by construction — this is not a one-off
mistake, it will recur on every edit unless every future edit is also made line-count-neutral, or the
rig is changed to select by test title (`-g`) instead of line.

## Proposed remediation

Two options, neither taken here (out of WP02's scope to force):
1. WP01 (or a follow-up) changes `LINE_ITEMS`' addressing from `file:line` to a `-g` title-grep
   invocation per item, matching how item 12 already has to be selected (title has no single line).
   This removes the fragility permanently for every future edit to any of the five files the rig
   addresses by line.
2. Any WP editing a file the rig addresses by line must audit `scripts/webkit-repeat-run.mjs`'s
   `LINE_ITEMS` entries for that file before every push and keep edits line-count-neutral around the
   declaration lines it lists — which is what WP02 is doing here as a stopgap, and which does not
   survive T012–T015's larger, non-neutral edits (the fix itself must add real lines). WP02 will need
   to re-verify the five line numbers after landing the real fix and note the final values in its
   report so the next WP (or WP01) can update the script, or run a manual `-g`-selected verification
   pass instead of relying on the push-triggered rig for the final confirmation.

## Resolution taken (this instance)

Restored all five original declaration lines (369/440/456/465/510) exactly, verified byte-for-byte
against the pre-instrumentation blob (`git show f816516d:apps/storybook/src/tests/sk-progress.spec.ts`)
for every line outside the instrumented statements themselves, and confirmed under chromium
(`--project=chromium`, mechanism only, not evidence about webkit) that all five `file:line` selectors
resolve to the correct test again. `scripts/webkit-repeat-run.mjs` was **not** edited — no
`ACTIVE_WP_SCOPE_VIOLATION` override was needed for this instance, since the line-neutral rewrite of
`sk-progress.spec.ts` alone restored the rig's existing hardcoded numbers without touching WP01's file.
This will need to be redone (or the alternative — editing the script with a disclosed override, as the
coordinator authorized and as the sibling WP03 lane did per `tmp/finding/wp03-lane-c-rig-line-number-drift.md`)
once T012–T015's real fix adds non-neutral lines; see "Root-cause hypothesis" above.

**Correcting a prior claim in this log**: the second push's run (`35353032768`) was re-examined after
the coordinator's cross-lane check — its JSON report genuinely contained zero `sk-progress.spec.ts`
entries (verified directly from the downloaded artifact, not from a "NO MATCHING RESULTS" log line),
so for this run the mis-selection manifested as silent omission rather than the loud
`NO MATCHING RESULTS` message the coordinator's message describes seeing elsewhere. Both symptoms
share the same root cause (an exact-line filter with no match); which one a given invocation produces
may depend on how `webkit-repeat-run.mjs` batches its selectors, not on this file's content — noted so
a future reader doesn't assume the loud form is the only failure mode.
