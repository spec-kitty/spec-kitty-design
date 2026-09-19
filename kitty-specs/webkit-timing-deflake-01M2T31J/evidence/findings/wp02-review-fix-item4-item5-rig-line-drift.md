# WP02 review-fix — item 4/5 rig line selectors drifted again, corrected with disclosed override

**Mission**: webkit-timing-deflake-01M2T31J, WP02, review-remediation pass (blocking finding on
`pinAnimationPhase`'s doc comment overclaiming a CI annotation that did not exist).
**Date**: 2026-09-18.

## What happened

Fixing the blocking review finding required making the doc comment's "attached as a test
annotation" claim true. The fix added one line to each of item 3's and item 5's test bodies in
`apps/storybook/src/tests/sk-progress.spec.ts` (a `test.info().annotations.push(...)` call at
each `pinAnimationPhase` call site). Item 3's own test declaration line (503) did not move — the
inserted line landed inside its body, above its closing `});` — but every test declared *after*
that insertion point shifted down by one line: item 4's `test(...)` moved from line 522 to 523,
and item 5's moved from 567 to 568.

`scripts/webkit-repeat-run.mjs`'s `LINE_ITEMS` table (WP01-owned) still pointed at 522/567 after
the fix. Verified directly (not inferred):

```
$ npx playwright test --list "apps/storybook/src/tests/sk-progress.spec.ts:522" --project=webkit
Error: No tests found.
$ npx playwright test --list "apps/storybook/src/tests/sk-progress.spec.ts:567" --project=webkit
Error: No tests found.
```

and, mixed with valid selectors (reproducing the exact shape the rig's own invocation uses — many
`file:line` tokens in one `playwright test` call):

```
$ npx playwright test --list "...ts:416" "...ts:522" "...ts:503" --project=webkit
  [webkit] › sk-progress.spec.ts:416:7 › ...
  [webkit] › sk-progress.spec.ts:503:7 › ...
Total: 2 tests in 1 file
```

**A stale `file:line` selector that matches nothing is silently dropped when mixed with valid
selectors in the same invocation — no error, no warning, exit code unaffected.** The run simply
omits that item. This is worth stating plainly for whoever maintains this rig next: it is why this
class of drift is dangerous rather than merely annoying — a passing/normal-looking run can quietly
carry one fewer item than intended, and only a downstream count-based guard (like this rig's own
"NO MATCHING RESULTS" check, keyed on the item having zero grouped results at all) catches it.
Confirmed via the mission-shared finding this echoes
(`tmp/finding/wp02-t010-rig-line-number-drift.md`) that the *other* observed failure mode for the
identical root cause is total silent omission of every selector in the same file (not just one),
depending on how the invocation batches its selectors — so a future reader should not assume only
one of these two symptoms is possible.

## Consequence for the in-flight run

The commit that introduced the drift (`4a5a5773`, pushed to trigger a webkit CI check on the
annotation fix) ran under the STALE selectors (522/567), so that run's `line-items.json` could at
best confirm item 3's annotation on real webkit — item 5 did not run in that invocation at all.

## Resolution taken (disclosed `ACTIVE_WP_SCOPE_VIOLATION` override)

Per the coordinator's explicit authorization (this file is WP01's, not WP02's — `scripts/**` is
outside WP02's `owned_files`), and following the identical precedent set by WP03 for the same
class of drift (`tmp/finding/wp03-lane-c-rig-line-number-drift.md`, commit `6179d0c6`), WP02
corrected `scripts/webkit-repeat-run.mjs`'s `LINE_ITEMS` entries for item 4 (522→523) and item 5
(567→568) directly, disclosed here and in the commit message. This is a one-line-per-item,
mechanical, non-behavioral correction — it changes no logic, only the two integer literals (plus
an inline comment recording why) — and leaves every other item's selector untouched. A fresh push
after this correction re-triggers the rig with correct selectors for both items, which is the run
that can confirm both annotations on real webkit rather than only item 3's.

## Note on interpreting the eventual result

A `null` `pseudoElement` value in either item's annotation is not a defect — the point of the
original fix was making the doc comment's claim *true* (a real CI artifact exists), not resolving
disclosed unknown (b) (whether `getAnimations({subtree:true})` reaches the vendor pseudo-element
under webkit) in any particular direction. `null` for both is real, converging evidence either
way and should be recorded as such.
