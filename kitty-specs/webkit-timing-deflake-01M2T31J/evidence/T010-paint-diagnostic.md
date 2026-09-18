# T010 — decisive experiment for items 1 and 4 (WP02)

**Engine**: webkit (NFR-007). **Retries**: 0 (explicit `--retries=0`, per WP01's rig). **Repeats**: 10.
**Runs**: `35352038231` (paint/font-load diagnostic only), `35354414711` (paint/font-load diagnostic
plus raw sampled-pixel-value attachment, correctly line-selected — an intermediate run,
`35353032768`, silently ran zero `sk-progress.spec.ts` tests because the diagnostic edits had
shifted the file's line numbers out from under WP01's rig's hardcoded `file:line` selectors; see
`tmp/finding/wp02-t010-rig-line-number-drift.md`).

## Instrumentation

`installPaintDiagnostic`/`attachPaintDiagnostic` (temporary, removed once this evidence was
captured — the real fix below does not depend on them) recorded, via a `page.addInitScript` that
re-armed on every `story()` navigation: an animation-frame counter since navigation (`rafCount`,
a proxy for "how many paint cycles has this document had a chance to run"), and whether
`document.fonts.ready` had resolved (`fontsLoaded`/`fontsReadyAtRaf`/`fontsReadyAtMs`) — the
plan's named suspect, since the font change is the only functional change between the passing run
at `ee324f84` and the first failing one. `attachSample` additionally recorded the raw RGBA arrays
already computed by each test's own `samplePixels` calls. Both attached as Playwright test
annotations, so they survive into the JSON report the rig uploads, on every one of the 10/10
failing repeats.

## Result 1 — the unsettled-fixture hypothesis is refuted for BOTH items

Every one of the 10 failing repeats of item 1 and item 4, for every fixture sampled — the fixture
under test AND each comparison fixture — showed `fontsLoaded: true` (resolved within ~80-180ms of
navigation start) and a double-digit `rafCount` (12-42 rendered frames) **before** the screenshot
that failed the assertion. Representative sample (item 1, repeat 0):

| label | rafCount at sample | fontsReadyAtRaf | fontsReadyAtMs |
|---|---|---|---|
| item1-comparison-complete | 11 | 1 | 179 |
| item1-comparison-zero | 9 | 2 | 83 |
| item1-subject-sample1 | 19 | 2 | 90 |
| item1-subject-sample2 | 42 | 2 | 90 |

Item 4's repeats show the same pattern (comparison fixtures at rafCount 9-14, subject frames at
12-42, fonts ready within ~80-140ms). **Nothing here was unsettled.** This refutes plan.md
Correction 2's hypothesis for both items — not just item 1, which the plan already flagged as the
harder case, but item 4 too, whose comparison-fixture-unsettled explanation does not survive this
data either.

## Result 2 — the raw pixel values show WHY, and it is not a component defect

With the line-selection bug fixed, run `35354414711` captured the actual sampled RGBA arrays.
Consistent across all 10 repeats of both items:

```
item1-comparison-complete (Complete fixture, value=8/max=8, 100% filled, forced-colors active,
  zero clip-path): { left: [43,49,59,255], center: [52,132,228,255], right: [43,49,59,255] }
item1-comparison-zero      (Zero, value=0/max=8, 0% filled):
                            { left: [43,49,59,255], center: [28,31,37,255], right: [43,49,59,255] }
item1-subject-sample1      (indeterminate-forced-colors, 45%-clip Highlight fill):
                            { left: [43,49,59,255], center: [13,14,17,255], right: [13,14,17,255] }

item4-comparison-complete  (Complete, plain — no forced-colors, plain yellow fill):
                            { left: [43,49,59,255], center: [245,197,24,255], right: [43,49,59,255] }
item4-subject-frame1       (reduced-motion frozen sweep band):
                            { left: [43,49,59,255], center: [245,198,24,255], right: [43,49,59,255] }
```

`[43,49,59,255]` is `var(--sk-surface-input)` — the plain, unfilled TRACK background — and it is
what `left`/`right` (`x=2`/`x=w-3`) read on **every** fixture, **including the fully-filled
Complete fixture, which has no clip-path at all and is 100% filled by definition.** A 100%-filled
progress bar's own fill colour (`Highlight` under forced-colors, plain `var(--sk-color-yellow)`
otherwise — both visible at `center`) never reaches the pixels 2-3px from either edge in this
webkit build's rendering of `::-webkit-progress-value`.

This means item 1's failing assertion (`sample1.left ≈ zeroSample.left`, both track background)
and item 4's failing assertion (`frame1.left/right ≈ completePixels.left/right`, all four track
background) are true for a reason that has nothing to do with either fixture's own fill state:
**`samplePixels`'s `x=2`/`x=w-3` offsets sample inside an edge-inset band that never shows a fill
colour in this webkit build, for any fixture, filled or not.** No CSS change could move this —
Complete's box has no clip-path to adjust — so this is **not** a C-007 component finding; it is a
test-measurement defect in `samplePixels` itself, matching the latent fragility T016 was asked to
report regardless of outcome. Both causal branches from spec.md's User Story 1 scenario 8 were kept
open through T010/T011; the data resolves the choice between them in favour of neither exactly as
framed — the fixtures were settled (ruling out (a)) and the CSS's own fill/clip geometry is not at
fault (ruling out a (b) that would require a `packages/styles/**` change) — the third, unlisted
candidate is the test's own sampling coordinates.

## Fix (T012/T014)

`samplePixels`'s `left`/`right` offsets moved from `x=2`/`x=w-3` to `x=10`/`x=w-11` — comfortably
outside the demonstrated edge-inset band, still well inside item 1's 45%-wide forced-colors clip
(54px of 120px), and applied uniformly (so item 2, which has the identical shape per T014, gets
the same correction rather than being left on the old, coincidentally-passing-for-the-wrong-reason
offsets).
