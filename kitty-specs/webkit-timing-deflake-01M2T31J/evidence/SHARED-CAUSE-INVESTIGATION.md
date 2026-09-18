# Shared-cause investigation — items 6–10

**Mission**: `webkit-timing-deflake-01M2T31J`
**Directed by**: the operator, after being shown that items 6–10 rotate rather than persist.
**Engine**: webkit, `retries: 0`, every figure below (NFR-007, NFR-002).

## Why this investigation exists

Five rig samples were taken. Across them, **every** shell-layout sub-test and the
workflow-board scroll test was both green and red; **none** was consistently broken, while
items 1–5, 11 and 12 were 10/10 in every sample.

| sub-test | baseline | 2nd | `a4facaa2` | `026e225b` | 20-repeat @ `026e225b` |
|---|---|---|---|---|---|
| 6 @1280 | 9/10 | 10/10 | 10/10 | **7/10** | 20/20 |
| 6 @1440 | 10/10 | **9/10** | 10/10 | 10/10 | 20/20 |
| 7 @390 | 10/10 | 10/10 | 10/10 | 10/10 | **18/20** |
| 7 @414 | 10/10 | **8/10** | 10/10 | **7/10** | **19/20** |
| 8 | **8/10** | 10/10 | **8/10** | 10/10 | **19/20** |
| 9 dark | **7/10** | **9/10** | **9/10** | 10/10 | **18/20** |
| 9 light | 10/10 | **9/10** | **9/10** | **9/10** | **18/20** |
| 10 | **8/10** | **9/10** | 10/10 | **9/10** | not in set |

Chasing whichever item was red in the latest sample was therefore unbounded: each pass would
green some and red others, and the reported progress would really be resampling. The operator
directed an investigation into what the rotating set shares instead.

**The 20-repeat sample is the one that settled it**: 8 failures in 140 executions (≈5.7%),
spread across every sub-test rather than concentrated in any. A single shared failure rate
being sampled is exactly what produces a rotating identity for "the broken test".

## Finding 1 — one 5000ms budget was being spent twice

All 8 failures in that sample carried the **same error, byte for byte**:

```
loadComposition: shell did not settle within 5000ms — missing or unstable: host is not visible
```

The sub-tests share no assertion. They share `settleComposition`. In it:

```js
const deadline = Date.now() + 5000;
await Promise.race([
  page.evaluate(() => document.fonts.ready),
  page.waitForTimeout(Math.max(0, deadline - Date.now())),  // the WHOLE budget
]);
while (Date.now() < deadline) { /* poll */ }                 // may never execute
```

A slow font wait left the poll loop milliseconds. A font wait reaching the deadline left it
**zero iterations** — and with zero iterations `lastMissing` still held its initializer,
`["host is not visible"]`, which was then thrown as though it were a measurement.

**The error asserted a fact the code had never tested.** The failure and its misdiagnosis had
one cause, which is why four samples of reading these messages produced no progress.

The font wait is real work, not a no-op: `--sk-font-sans` resolves to Inter, ten `.woff2`
files exist under `packages/tokens/src/fonts/`, and `loadComposition` sets
`root.style.fontFamily` immediately before calling this. Under `playwright.config.ts`'s
`fullyParallel: true` + `workers: 2`, those fetches are served by **one** `npx http-server`
process to **two** concurrent webkit contexts — which is when it gets slow enough to consume
the budget, and why the failures cluster without ever settling on one test.

*Corrected premise, recorded because it was stated before it was checked*: these fonts were
initially assumed to 404 (a known condition in this repo's history). They do not — mission
#1673's font-path fix landed and the files are present. The mechanism is genuine concurrent
fetching, not failed fetching.

**Fixed** in `5a3d2ddc`: each wait gets its own budget; the poll loop is `do/while` so a
zero-reading throw is structurally impossible; the message carries `polls`, `stableReads` and
whether fonts timed out, which separates budget starvation from a composition that genuinely
never rendered. No assertion is weakened — the four required parts, the zero-size checks, the
title-node check and the four-stable-reads requirement are unchanged.

**Disclosed for the suppression scan** (SC-002/NFR-003, "wait durations increased = 0"): the
settle poll's own budget is unchanged at 5000ms; it is simply no longer reduced by the font
wait. The separate 1500ms font budget takes the helper's worst case from 5000ms to 6500ms.
That is a double-spent budget being corrected, not a tolerance being widened.

## Finding 2 — item 10's message said the opposite of what happened

Item 10 fails differently, and its diagnostic actively misled:

```
scrollLeft did not settle within 5000ms (last observed 97, 307/3 consecutive stable reads)
```

**307 stable reads against a requirement of 3.** That is only reachable when the value is
perfectly at rest — so it *had* settled. What withheld resolution was the `hasMoved` guard,
and the test's own assertion (`movedRight > 0`) would have passed on 97.

`waitForScrollSettled` read `initial = node.scrollLeft` inside its own `evaluate`, which runs
*after* `page.keyboard.press()` resolves. A scroll completing in that gap was invisible to it:
the baseline was already the settled value, so `current !== initial` never became true.

**The test failed precisely when the scroll was fast** — and `workers: 2` contention widens
the gap that makes the miss likelier, which is the same trigger as Finding 1 reaching a
different helper.

**Fixed** in `90aa3a50`: the caller captures `scrollLeft` before pressing and passes it as
`from`, removing the race rather than waiting longer for it. Timeout and stable-frame
requirement unchanged; the diagnostic now separates "never left the baseline" from "still
moving" and names which baseline it used.

## Finding 3 — two ways the rig could report what it never measured

Both fixed in `4c311809`.

1. **Stale `file:line` selectors are silently dropped** by Playwright when mixed with
   selectors that do match — no warning, exit 0 — so the per-item table omits rows while every
   number left in it still looks correct. These line numbers were corrected six times during
   this mission as owning work packages edited their own spec files; the latest drift (item 10,
   620 → 654) came from the commit that fixed item 10. The rig now verifies every selected line
   begins a `test(` declaration and refuses otherwise. Proved red-first by pointing item 10 at
   line 999, then green after restoring 654.

2. **Run `35369475589` reported as a completed experiment while both arms were skipped.**
   `continue-on-error` stops a step's *own* failure from failing the job; it does not stop a
   *preceding* failure from skipping it, and the rig step ahead of the arms exits non-zero
   whenever any item fails — the normal case here. Both arms now carry `if: always()`.

## What is measured, and what is inferred

- **Measured**: the rotation across five samples; the ≈5.7% uniform rate; the byte-identical
  error on 8/8 failures; the 307-stable-reads figure; that the guard fires and clears.
- **Established by reading the code**: that a zero-iteration poll loop throws its initializer;
  that the scroll baseline is captured after the press.
- **Inferred, and the reason for the paired experiment**: that `workers: 2` contention is the
  *trigger* that makes these latent defects fire. The defects are real and fixed regardless of
  whether the experiment confirms contention — but the experiment is what distinguishes
  "fixed" from "made rarer".

## The paired experiment

Both arms run the same items on the same runner against the same build, so runner-to-runner
variance cannot explain a difference. Arm A (inherited `workers: 2`) runs first and warms the
machine, making arm B (`--workers=1`) the easier condition: **read a clean B as suggestive,
not conclusive, and a still-rotating B as strong evidence against the contention hypothesis.**

`--workers` is a measurement control and is stated in the rig banner alongside retries and
engine, so no count can be read without its scheduling condition. It is never a fix: pinning
it would not change what the ordinary `playwright` job does.
