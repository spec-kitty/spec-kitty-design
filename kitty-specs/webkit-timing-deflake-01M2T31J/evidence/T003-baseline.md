# T003 — measured baseline, before any fix

**Run**: [35346013373](https://github.com/spec-kitty/spec-kitty-design/actions/runs/35346013373) — workflow "WebKit repeat-run rig", head `feeeb034`
**Engine**: webkit (NFR-007). **Retries**: 0, set by an explicit `--retries=0` CLI flag that overrides
`playwright.config.ts:19`'s `process.env['CI'] ? 2 : 0`, so a flaky-at-exit-0 result cannot arrive by
inheritance (NFR-002).
**Repeats**: `--repeat-each=10`. JSON reports uploaded as artifact `webkit-repeat-run-results`.

Recorded by the orchestrator rather than WP01: the evidence directory is outside WP01's owned surface
(`scripts/**`, `.github/workflows/**`, `playwright.config.ts`), and the seat correctly stopped and
reported instead of editing outside it.

## Invocation

Eleven of the twelve canonical items are selected by exact `file:line`. Item 12 (the parameterized
`sk-action-row.spec.ts` "external controls" family — six modes, no single line) is selected
separately with `-g`, because mixing the two forms in one invocation applies the grep filter globally
and silently drops the other eleven. Both invocations run
`--project=webkit --retries=0 --reporter=list,json --repeat-each=10`.

## Results

| Item | Test | Passed |
|---|---|---|
| 1 | `sk-progress:369` forced-colors, two points in cycle | **0/10** |
| 2 | `sk-progress:440` forced-colors + reduced-motion | 10/10 |
| 3 | `sk-progress:456` the sweep actually runs | 3/10 |
| 4 | `sk-progress:465` reduced-motion freeze | **0/10** |
| 5 | `sk-progress:510` no animation leak onto determinate | 1/10 |
| 6 | `shell-layout:104` exact columns | 9/10 @1280px, 10/10 @1440px |
| 7 | `shell-layout:160` narrow region order | 10/10 @390px, 10/10 @414px |
| 8 | `shell-layout:303` landmarks/labels/grouping | 8/10 |
| 9 | `shell-layout:445` axe-clean | 7/10 dark, 10/10 light |
| 10 | `workflow-board:557` focused overflow scroll | 8/10 |
| 11 | `radio-choice-group:1113` legend cue | 10/10 |
| 12 | `sk-action-row` external-controls family (6 modes) | 60/60 |

## What this changes

**Items 1 and 4 are not flaky. They fail every repeat.** A timing race produces a distribution; 0/10
is a deterministic failure. Both passed on the pre-mission run at `ee324f84`. So under webkit they
are a **deterministic regression**, and ordinary CI's `retries: 2` was the only reason they ever
looked intermittent rather than simply broken.

The mission's framing — "assertions wait on elapsed time rather than observable state" — is therefore
**wrong for items 1 and 4**, and WP02 must not assume a race. Note this does not by itself refute the
plan's unsettled-fixture hypothesis: a fixture that never paints within the wait would also fail
every time. T010's experiment still discriminates, and it is now more important, not less.

**Items 7, 11 and 12 did not reproduce at all** (10/10, 10/10, 60/60) despite being in scope. Either
the rig does not reproduce them or they are not reproducible at this repeat count. Resolve before
WP03 and WP05 are judged against this baseline — a clean result here is not evidence that those
tests are sound.

## Cross-run instability, independently observed

Between the rig's first run and this one — same unmodified code, about five minutes apart — several
counts moved (item 3: 6/10 → 3/10; item 9 dark: 10/10 → 7/10). That is CI-side confirmation that
these are genuinely non-deterministic under webkit, from a source independent of this workstation.

---

## Second sample: the baseline is one reading, not ground truth

Run [35351684955](https://github.com/spec-kitty/spec-kitty-design/actions/runs/35351684955), same rig,
same settings (webkit, `--retries=0 --repeat-each=10`), from a sibling lane on substantially the same
code. It disagrees with the table above on four items:

| item | first sample (T003) | second sample |
|---|---|---|
| 6 | 9/10 @1280, 10/10 @1440 | 10/10 @1280, **9/10 @1440** |
| 7 | 10/10 @390, 10/10 @414 | 10/10 @390, **8/10 @414** |
| 8 | 8/10 | **10/10** |
| 9 | 7/10 dark, 10/10 light | 9/10 dark, **9/10 light** |
| 10 | 8/10 | 9/10 |
| 11 | 10/10 | 10/10 |
| 12 | 60/60 | 60/60 |

**Item 7 reproduces after all** — at 414px, roughly a 20% rate. The first sample's 20/20 was
undersampling, not evidence of soundness. Item 6 has now failed at *both* viewports across the two
samples, and item 9 has now failed in *light* mode as well as dark.

**Consequences, and they bind the mission's grading:**

1. **A single 10-repeat run does not establish that an item is clean**, and does not pin a failure rate. SC-001's delta rule still holds, but "already green at baseline" must mean green across more than one sample before an item is set aside as not-reproduced.
2. **The per-item counts in the first table are one observation each.** Where a number carries a conclusion, take more than one reading and state how many.
3. Items 11 and 12 are now clean across **two** independent samples, which is meaningfully stronger evidence than one — though still not proof.
4. The shell-layout items' failures move between viewports and themes across runs. That argues against a viewport- or theme-specific cause and for something common to all four, which supports Correction 5's shared-helper thesis rather than the font-metric one.

This entry exists because the first table was about to be used as ground truth by four work packages.
It is a measurement, and measurements have variance; the mission should have sampled twice before
grading anything against one run.
