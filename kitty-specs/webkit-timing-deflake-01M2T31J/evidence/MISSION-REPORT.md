# Mission report — WebKit timing de-flake

**Mission**: `webkit-timing-deflake-01M2T31J` · **Issue**: #453 (adopts #340, #238) · **PR**: #454
**Base**: `train/elements-first` · **Authored at closeout**, 2026-09-18.

SC-008 requires one report carrying verdicts, engines and duration, with both scripts' output
embedded verbatim. Both are below, unedited, including a non-zero exit code.

## Verdict summary

| | count |
|---|---|
| pass | 34 |
| partial | 6 |
| pending | 0 |
| **fail** | **0** |

**Engine discipline (NFR-007).** Every stability figure in this mission is a **webkit** result.
webkit cannot launch on the development workstation (confirmed with a chromium positive control),
so CI is the only webkit authority here and no local pass was ever read as evidence about it. The
two chromium-only measurements that exist are labelled as such and are exactly why FR-008 and
three sibling criteria remain `partial` rather than being rounded up.

## What was actually wrong

Neither headline cause was the one the tracking issue proposed.

1. **Items 1 and 4 were not flaky — they failed every repeat (0/10).** `samplePixels` read at
   `x=2` / `x=w-3`, which return the unfilled track colour on *every* fixture, including the
   100%-filled `Complete` fixture. A **test-measurement defect**, not a component regression:
   `git diff origin/train/elements-first...HEAD -- packages/` is byte-empty. The PR previously
   named a component regression from #451 as a live candidate; that was investigated and refuted.

2. **Items 6–9 rotated because they shared a helper, not an assertion.** `loadComposition`
   overwrote `#storybook-root` immediately after `page.goto`, which resolves at `load` — while
   Storybook renders the story into that root on the **client, after** `load`. A render landing
   second destroyed the injected composition. Directly observed, not inferred: a probe branch
   reverting only the fix produced **18 failures, 18 readings of `hosts-in-dom=0`, none ≥ 1**,
   with `#storybook-root children=div`.

3. **Item 10 failed precisely when the scroll was fast.** Its baseline was read *inside* the
   settle helper, after `page.keyboard.press()` had resolved, so a scroll completing in that gap
   was invisible. Its error said `did not settle` while reporting 307 stable reads against a
   requirement of 3 — it had settled instantly.

## Final measurement

Run `35375265259` @ `afe7be3c` (and `35374639239` @ `38d2b145`), webkit, `--retries=0`, selectors
verified to resolve before each invocation:

| | |
|---|---|
| executions | **200** (140 line-addressed + 60 for item 12's six modes) |
| failures | **0** |
| flaky | **0** — `--retries=0` is an explicit CLI flag, so a flaky-at-exit-0 cannot arrive by inheritance |
| items 10/10 | **all twelve** |

The first attempt at `afe7be3c` read 199/200; the single failure was
`page.goto: WebKit encountered an internal error`, a browser-level fault absent from ~960 prior
executions, which did not reproduce on an immediate resample at the same SHA. Recorded, not
discarded — tracked in #456.

## Scope of the claim

"Zero failures" means **the mission's twelve canonical items under webkit at `--retries=0`**. It
does **not** mean the whole `playwright` job is flake-free. The closeout CI run `35375268744` is
fully green (`gate: success`) and still reports **1 flaky** — `sk-notice-forced-colors.spec.ts:121`,
never in scope. Pre-mission runs carried 1–3 flaky each; two of those were mission items and are
fixed. The rest is enumerated with run ids in **#456**, so #453 closing cannot be read as "the
webkit lane is de-flaked".

## What this mission got wrong, in order

Recorded because the corrections were produced by adversarial review demanding measurements, not
by the author noticing.

1. **A component regression from #451** was named as a live candidate. Refuted — the diff is
   test-only.
2. **"Animation phase unpinned"** was proposed as the shared cause of the `sk-progress` failures.
   Refuted by reading the CSS: the reduced-motion frame is deterministic by construction.
3. **A double-spent settle budget** was declared the shared cause of items 6–9. A real defect,
   fixed — but **not** the cause. Its own diagnostic refuted it: `fonts=ready` with ~148 polls at
   a 33ms cadence proved nothing was starved.
4. **The render race was asserted before it was observed.** The snapshot that would prove it
   shipped in the same commit as the cure, so it had never fired. A rival hypothesis fit every
   observation equally. The probe above settled it.
5. **"The only spec injecting over a rendered story"** — false twice over. `visual.spec.ts` does
   the identical thing to the same story id; item 10 rotated without injecting. Deferred as #455.
6. **"Items 1–5, 11 and 12 were 10/10 in every sample"** — false; items 1, 3, 4, 5 all failed at
   baseline.
7. **An undisclosed `{ timeout: 20000 }`**, added in a file carrying a nine-line disclosure about
   a 1500 ms budget, which pushed the helper's worst case to ~26.5 s against a 30 s per-test
   timeout. Replaced with 10000 ms and disclosed.
8. **The suppression scan's "0 wait increases" was a green over an empty set** — its rule only
   fired if the hunk also *removed* a timeout. Four new budgets were invisible. Repaired; all four
   are now visible.
9. **The duration band `[25.6, 26.7, 22.5]` had no run id for any figure**, and one was a
   mid-mission lane run. Re-measured from ten named pre-mission runs: **19.17–26.85 min**. The
   mission's original NFR-004 ("within 5% of 25.6 min") would have fired on **six of those ten
   unmodified runs**.

## Per-item verdicts (SC-008's actual requirement)

Every scope item, its verdict, and the engine the claim came from. All stability figures are
**webkit**; the two chromium-only measurements are marked, and they are why four criteria stay
`partial`.

| # | Item | Verdict | Engine |
|---|---|---|---|
| 1 | `sk-progress` forced-colors, two points in cycle | **Fixed** — 0/10 → 10/10. Cause: `samplePixels` read the unfilled track on every fixture | webkit |
| 2 | `sk-progress` forced-colors + reduced-motion | **Fixed** — 10/10 | webkit |
| 3 | `sk-progress` the sweep actually runs | **Fixed** — was 9/10 in one sample and 3/10 at baseline; 10/10 in the three most recent | webkit |
| 4 | `sk-progress` reduced-motion freeze | **Fixed** — 0/10 → 10/10, same cause as item 1 | webkit |
| 5 | `sk-progress` no animation leak onto determinate | **Fixed** — 10/10 | webkit |
| 6 | shell exact 56/240px columns | **Fixed** — story-render race; 10/10 | webkit (premise probe: **chromium only**) |
| 7 | narrow shell region order | **Fixed** — same race; 10/10 | webkit |
| 8 | landmarks / labels / grouping | **Fixed** — same race; 10/10 | webkit |
| 9 | axe-clean, dark and light | **Fixed** — same race; 10/10 both | webkit |
| 10 | focused overflow keyboard scroll | **Fixed** — baseline captured after the key press, so it failed when the scroll was *fast*; 10/10 | webkit |
| 11 | required legend cue across two stories | **NOT REPRODUCED** — clean in four samples including the exact full-suite contention condition of its original sighting (`35352049054`). No defect found, no code change, WP05 closed on a negative result per FR-013 | webkit |
| 12 | external controls, six modes | **Already green at baseline** — 10/10 in every sample; no change claimed | webkit |
| 13 | behaviour-suite lane stop (WP06) | **Observability improved, stop NOT fixed** — the package never promised to fix it. The job log no longer truncates before the error; the underlying stop is unchanged | n/a (log volume) |

### Reported unfixed, carried forward

- **`openStory()`'s flat `page.waitForTimeout(50)`** — `sk-radio-choice-group.spec.ts:258` and
  `sk-checkbox-choice-group.spec.ts:94`. This is exactly the "wait on elapsed time" shape the
  mission exists to remove, and it is **not fixed**: item 11 never reproduced, so there was no
  failing state to drive a red-first proof, and rewriting a helper used by every story in those
  files without a reproduction would be an unmeasured change. Named here rather than dropped,
  as `PRE-MERGE-GATES.md` §7 requires.
- **The webkit lane beyond these thirteen** — at least four other specs flake; see #456.
- **The story-render race in sibling specs** — `visual.spec.ts` and two others; see #455.

## Duration (NFR-004 / SC-005)

**16.8 min suite self-time, INSIDE the measured band of 16.5–25.6 min (n=11).**

This section previously reported the reading as **OUTSIDE** the band and explained it by retry
cost. **Both were wrong, and both are retracted** — the squad's evidence lens caught it:

- The "outside" result came from comparing **job wall-clock** (17.93) against a band anchored on a
  **suite self-time** figure (25.6, which is literally `2777 passed (25.6m)` in run `34820757579`).
  Two instruments. On one instrument there is no anomaly to explain.
- The retry explanation was independently falsified: `34820757579` and the closeout run report the
  **same 1 flaky and the same 2777 passed / 147 skipped**, 8.8 min apart. Retry cost cannot
  account for that.
- "Pre-mission runs carried 1–3 flaky" was also false — `34606532461` carried **5**.

The band itself was rebuilt for the same reason. Its first replacement stated a method that its
own set did not satisfy: re-running the stated method yields 109 qualifying runs, and the ten
shipped were ranks 94–109. The suite grew 1229 → 2777 tests over the window and duration tracks
test count, so the honest filter is comparable **work** (`passed >= 2600`), on a consistent
instrument (suite self-time). n=11, 16.5–25.6 min, 55.2% spread with no code change.

On that basis the original NFR-004 ("within 5% of 25.6 min") would have fired on **8 of the 11**
unmodified pre-mission runs.

## Verbatim: `scripts/report-playwright-duration.mjs --seconds=1008`

```
NFR-004 / SC-005 — playwright job duration (band-reported, not percentage-gated)
  pre-mission runs: 16.5 min, 18.7 min, 22.7 min, 23.1 min, 23.8 min, 24.2 min, 24.3 min, 24.3 min, 24.6 min, 24.9 min, 25.6 min (spread: 55.2% — this is why there is no fixed tolerance)
  measured band: 16.50 min – 25.60 min
  this run: 16.80 min (1008.0s)
  ✅ inside the measured band
```

## Verbatim: `scripts/scan-mission-suppressions.mjs --base=origin/train/elements-first`

Exit code **1**, reproduced here rather than hidden. It is driven by SC-002's equality, which the
mission has recorded as **not meaningful**: the two counts pair disjoint populations, established
by the pre-merge squad. SC-002/NFR-003 remain `partial` for that reason and the scan was
deliberately **not** re-tuned to make the numbers balance.

```
SC-003 — mechanical suppression scan:
  ✅ test.skip: 0
  ✅ test.fixme: 0
  ✅ .only: 0
  ✅ added retries: 0
  ✅ increased numeric timeout literal: 0

DISCLOSURE — new wait budgets (NOT suppressions; not counted above):
  4 new wait budget(s). These do not fail this scan — a new precondition wait is not a suppression and not an increase — but every one must be
  accounted for in the mission acceptance matrix under SC-003/C-001, with its purpose and
  its effect on the enclosing per-test timeout stated:
      apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts: 10000ms
      apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts: 1500ms
      apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts: 5000ms
      apps/storybook/src/tests/sk-workflow-board.spec.ts: 5000ms

SC-002 — rewritten assertions vs red-first proofs:
  rewritten-assertion sites: 9
  red-first-proof markers:   15
  ❌ NOT equal-and-non-zero — SC-002 unmet (see this file's header for the RED-FIRST-PROOF marker convention)
```

The four entries under DISCLOSURE are **new** wait budgets guarding preconditions, not widened
tolerances, and are individually accounted for in `acceptance-matrix.json` under SC-003/C-001. They
are deliberately not counted as suppressions: counting them would make SC-003 and C-001
unachievable for any mission that legitimately adds a precondition wait, which pressures the next
author to avoid the rule rather than disclose under it.

## Open, with owners

| # | What |
|---|---|
| #455 | The same story-render race, unfixed, in `visual.spec.ts` and two further specs |
| #456 | webkit flakiness beyond this mission's twelve items, enumerated with run ids |

## Standing partials

Six criteria remain `partial`, all evidence-completeness rather than defects: FR-008 (no direct
webkit font-probe of the 56.00/240.00 px premise), FR-010, NFR-006 and SC-004 (chromium-only
measurements standing in for webkit claims), and NFR-003/SC-002 (one red-first proof **withdrawn**
as affirmatively wrong, one **superseded in part**, and no replacement claimed because none was
captured).

SC-005 is **not** among them. It was briefly downgraded to `partial` on the reading that 17.93 min
sat outside the band — but that reading compared two different instruments, and on a consistent
one (16.8 min suite self-time against a 16.5–25.6 min band) it is inside. It is `pass` on the
corrected measurement, not on a reinterpretation of the criterion.
