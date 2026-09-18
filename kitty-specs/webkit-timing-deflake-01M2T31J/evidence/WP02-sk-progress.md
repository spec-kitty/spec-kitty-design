# WP02 — sk-progress items 1–5: the decisive diagnosis

Recorded by the orchestrator. WP02 correctly removed its own copy from the lane branch (planning
artifacts belong on `mission/webkit-deflake`, not in a WP's diff), so it is preserved here.

**Engine**: webkit throughout, real CI. **Retries**: 0, explicit `--retries=0`. **Repeats**: 10.

## Results

| item | test | baseline | post-fix | red-first |
|---|---|---|---|---|
| 1 | `:369` forced-colors, two points in cycle | **0/10** | 10/10 | 0/10 ✓ |
| 2 | `:440` forced-colors + reduced-motion | 10/10 | 10/10 | 0/10 ✓ |
| 3 | `:456` the sweep actually runs | 3/10 | **10/10, then 9/10** | 0/10 ✓ |
| 4 | `:465` reduced-motion freeze | **0/10** | 10/10, then 9/10 | 0/10 ✓ |
| 5 | `:510` no leak onto determinate | 1/10 | 10/10 | 0/10 ✓ |

Post-fix runs: `35356189046` (at fix commit `39154a7e`) and `35357249473` (at the reverted-clean
state `f53c7f3d`). Red-first: `35358002926` at mutation `3fbb49a2` — a **completed** run, not a
cancelled one (see PRE-MERGE-GATES §11 for why that distinction cost a cycle).

**Item 3 is reported as two samples, 10/10 and 9/10, not as its better number.** Against a 3/10
baseline that is a large real improvement, but it is not the clean 10/10 SC-001 asks for, and this
mission has already been burned once by treating one run as settled.

## T011 — both hypotheses refuted, and the real cause

**The unsettled-fixture hypothesis is refuted for both items 1 and 4.** The T010 diagnostic recorded,
on every one of the 10 failing repeats and for every fixture sampled — subject *and* comparison —
`fontsLoaded: true` (resolved within ~80–180ms) and 9–42 rendered animation frames elapsed **before**
the failing screenshot. Nothing was unsettled. plan.md's Correction 2 does not survive this data, for
item 4 either.

**Nor is it a component defect.** The raw sampled RGBA showed `left` and `right` reading
`[43,49,59,255]` — `var(--sk-surface-input)`, the plain unfilled **track** — on *every* fixture,
**including the 100%-filled `Complete` fixture, which has no clip-path at all**. Its own fill colour
(`Highlight` under forced-colors, `--sk-color-yellow` otherwise, both plainly visible at `center`)
never reaches 2–3px from either edge in this webkit build's rendering of `::-webkit-progress-value`.

So both failing assertions were comparing two track-background pixels and asserting they differ. They
could only ever have passed by accident. **No CSS change could move this** — Complete has no clip
geometry to adjust — so it is not a C-007 finding. It is a test-measurement defect in `samplePixels`,
exactly the latent fragility T016 was asked to report regardless of outcome.

The third candidate, unlisted in User Story 1 scenario 8, turned out to be the right one: the test's
own sampling coordinates.

## Fixes

- **Items 1, 2, 4** — `samplePixels` offsets moved from `x=2`/`x=w-3` to `x=10`/`x=w-11`: outside the demonstrated edge-inset band, still well inside item 1's 45%-wide forced-colors clip (54px of 120px). Applied uniformly, so item 2 — which has the identical shape — is corrected too rather than left passing coincidentally for the wrong reason.
- **Items 3, 5** — `pinAnimationPhase`: pause and seek `currentTime` via `getAnimations({subtree: true})`, then wait for a real repaint, replacing a wall-clock race against the 320ms sweep.

**The fix is test-only.** `git diff packages/styles/src/progress/**` against the mission base is
empty.

## What is NOT established — stated because it bounds what may be claimed

1. **Why items 1 and 4 passed at `ee324f84`, before the font change.** If the sampling coordinates were always wrong, those tests should always have failed. Two candidate mechanisms were considered — webkit/Playwright version drift unrelated to fonts, or a font-metric-driven sub-pixel geometry shift — and **neither was tested**. The mechanism of the prior pass is unknown. Consequently the font change's role is bounded to "may have changed which pixel a wrong coordinate landed on", and cannot be called either cause or bystander on this evidence.
2. **T013's narrower claim** — that `getAnimations({subtree: true})` reaches the vendor pseudo-element under webkit — is not independently confirmed. The mechanism works functionally, but no positive pseudo-element evidence was captured from a clean, non-mutated run.
3. **Item 3's residual 1-in-10 failure** has no diagnosis.

## Process incidents (both logged to the shared findings log)

1. WP02's own diagnostic edits broke WP01's rig line-selection **twice**. Recovered first by line-count-neutral edits, then — once the real fix necessarily added lines — by disclosed `ACTIVE_WP_SCOPE_VIOLATION` corrections to `scripts/webkit-repeat-run.mjs`. Final selectors 416/487/503/522/567, all verified to resolve. *(WP02's own report transcribes two of these as 525/570; the rig itself is correct.)*
2. A red-first push cancelled its own in-flight capture run via the shared concurrency group, destroying the proof while leaving everything downstream looking clean. Redone by waiting for the capture to complete before touching the branch. See PRE-MERGE-GATES §11.
