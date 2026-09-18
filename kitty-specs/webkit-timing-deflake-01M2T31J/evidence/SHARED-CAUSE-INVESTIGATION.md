# Shared-cause investigation — items 6–10

**Mission**: `webkit-timing-deflake-01M2T31J`
**Directed by**: the operator, after being shown that items 6–10 rotate rather than persist.
**Engine**: webkit, `retries: 0`, every figure below (NFR-007, NFR-002).

## Why this investigation exists

Five rig samples were taken. Across them, **every** shell-layout sub-test and the
workflow-board scroll test was both green and red; **none** was consistently broken.

**Correction (pre-merge squad, evidence lens).** An earlier revision of this paragraph added
"while items 1–5, 11 and 12 were 10/10 in every sample". **That was false** and is struck
rather than edited away. Items 1, 3, 4 and 5 all failed in the baseline sample (0/10, 3/10,
0/10, 1/10 — see `evidence/T003-baseline.md`), items 1, 4 and 5 failed in the 2nd, and the
20-repeat sample ran `--items=6,7,8,9` so never measured them at all: only 2 of the 5 samples
support the claim. What is true, and is all that the argument below needs, is that **items 1–5
became stable once WP02's fixes landed and stayed 10/10 across the three most recent samples**,
while items 6–10 kept rotating. Rounding the weaker statement up to "every sample" is the same
error the squad corrected once already as F6.

Each column names the CI run it came from, so no figure here rests on an unlabelled sample —
a provenance defect commit `026e225b` in this very PR exists to fix for the duration band.

| sub-test | baseline<br>`35346013373` | 2nd<br>`35351684955` | `a4facaa2`<br>`35364818013` | `026e225b`<br>`35368301281` | 20-repeat @ `026e225b`<br>`35368849015` |
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

**The 20-repeat sample is the one that settled it**: 8 failures in 140 executions (≈5.7%
overall), spread across **five of the seven** sub-tests rather than concentrated in one. Item 6
was 20/20 at both viewports in that sample, so "every sub-test" — the earlier wording — was an
overstatement, and the per-sub-test rates range from 0% to 10% rather than being uniform. The
argument the table supports is the weaker and sufficient one: **no single sub-test carries the
failures**, so no single sub-test is "the broken one", and the identity of whichever is red
rotates between samples.

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

**Disclosed for the suppression scan** (**SC-003 / C-001**, "wait durations increased = 0" — an
earlier revision filed this against SC-002/NFR-003, which are the *red-first-proof* rows and do
not own it; the squad found that misfiling is why the 20000ms budget below went unnoticed): the
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

---

# Result

## The paired experiment refuted the budget hypothesis

Run `35370228073` @ `4c311809`, with the settle-budget fix already in place, still failed — and
the diagnostic added by that fix is what identified the real cause:

```
host is not visible [polls=148, stableReads=0, fonts=ready]
```

- `fonts=ready` — the font wait **never timed out**. Finding 1 was a real defect but was **not
  the cause of these failures**.
- `polls≈148` over a 5000ms budget is ~33ms per poll: two rAF at 60fps. **Nothing was
  CPU-starved.** Starvation would have shown far fewer polls.
- The host was absent for ~150 consecutive checks. It was not slow. It was **gone**.

Recorded plainly because the investigation was directed at finding a shared cause, and the first
one proposed was wrong: the fix stands on its own merits (a budget spent twice, and a message
that threw its own initializer), but it did not fix these failures. What it contributed was the
diagnostic that made the next step possible.

**The experiment's own measurement, at `4c311809`, same runner, same build:**

| arm | workers | failures / 80 |
|---|---|---|
| A (inherited) | 2 | **6** (7.5%) |
| B (control) | 1 | **1** (1.25%) |

Real, ~6×, and arm B ran second on the warmed machine — the harder condition. But contention was
the *trigger*, not the mechanism.

## Finding 4 — the root cause: injecting over a story that had not rendered yet

`page.goto` resolves at `load`. Storybook renders the story into `#storybook-root` **on the
client, after that**. `loadComposition` overwrote the root immediately, so whenever Storybook's
render landed second it replaced the root's children and destroyed the injected composition —
which is then never re-added, for the whole budget.

This explains every observation at once: the healthy poll cadence, the satisfied font wait, the
host absent rather than late, and the contention sensitivity — contention delays Storybook's
render *past* the injection.

**The repo already had the right pattern.** `openStory` in `sk-workflow-board.spec.ts` waits for
the story's own root to be visible and never injects over it, and 8+ pattern specs wait on a
`[data-render-complete="true"]` attribute that only the story's own render produces.

**Correction (pre-merge squad, root-cause and architecture lenses).** An earlier revision of this
section claimed `sk-team-overview-shell-layout` "was the only spec injecting over a rendered
story, and the only one that rotated". **Both halves are false**, and the correlation was
carrying more of the argument's weight than any evidence did:

- **Not the only injector.** `apps/storybook/src/tests/visual.spec.ts:250-268` performs the
  identical `goto` → `addScriptTag` → `root.innerHTML =` against the *same* story id with no
  render wait. Two further specs touch the page after `goto` without waiting:
  `elements-load.spec.ts:190-194` (sets `document.body.innerHTML`, destroying `#storybook-root`
  itself) and `sk-mission-reading-pattern.spec.ts:810-823` (an `expect.poll` containment check an
  empty root satisfies trivially).
- **Not the only rotator.** Item 10 lives in `sk-workflow-board.spec.ts`, does not inject at all,
  and rotated too — for the unrelated reason recorded as Finding 2.

`visual.spec.ts` is chromium-only and `testIgnore`d by default, so the webkit rig cannot see it,
and a wiped root there surfaces as a screenshot diff rather than an error. **The class is not
closed by this PR.** It is deferred with an owner rather than folded in, because the file is
outside this mission's owned surfaces and outside the rig's measurement — both sibling specs are
recorded in **issue #455**, filed before being cited here.

**Fixed** in `e150b8f9`: wait for `#storybook-root` to be non-empty and unchanged across three
consecutive animation frames before injecting — a precondition on observable state, not a
duration, covering a render that arrives in more than one paint. The failure path also snapshots
the DOM (host count, `#storybook-root`'s children) so "the root was replaced" and "the host is
present but not rendering" stop sharing one message.

## Final measurement — run `35371247321` @ `e150b8f9`

webkit, `retries: 0`, selectors verified to resolve before each invocation (11, 5, 5).

| section | workers | executions | result |
|---|---|---|---|
| Main rig, all 12 items | 2 (inherited) | 200 | **200 passed, 0 failed** |
| Arm A | 2 (inherited) | 80 | **80 passed, 0 failed** |
| Arm B | 1 (control) | 80 | **80 passed, 0 failed** |

**360 webkit executions, zero failures, zero flakes.** Every one of the twelve items 10/10,
including 6–9 and 10.

Arm A went **74/80 → 80/80** across the fix. That is the confirmation: the contention sensitivity
was a *consequence* of the render race, and removing the race removed it too. Had the mission
acted on the contention measurement alone, the result would have been a serialized rig and a
suite that still flaked.

## Disposition of the four findings

| # | Finding | Status |
|---|---|---|
| 1 | `settleComposition` spent one budget twice; threw its initializer as a measurement | Fixed (`5a3d2ddc`). Real defect; **not** the cause of the observed failures. Its diagnostic found the cause. |
| 2 | Item 10's scroll baseline captured after the key press | Fixed (`90aa3a50`). Item 10: 8/10, 9/10, **10/10**, 9/10 across the four samples in the table above — not "8–9/10", which the table itself contradicts — → **10/10 across 30 executions** post-fix. |
| 3 | Rig dropped stale selectors silently; both arms skipped while the job reported success | Fixed (`4c311809`). The guard refused four stale selectors one commit later. |
| 4 | Injection raced Storybook's client render — **root cause** | Fixed (`e150b8f9`). 360/360. |

## Withdrawn

WP04's `RED-FIRST-PROOF (c)` stubbed `document.fonts.ready` to never resolve, observed a throw at
~5000ms naming "host is not visible", and recorded it as proof the guard worked. That throw was
Finding 1's bug — the zero-iteration path throwing its initializer. The marker is retained and
labelled WITHDRAWN rather than deleted, and **no replacement proof is claimed**, because none has
been captured. A red-first proof confirms whatever the code currently does; it is evidence that a
mutation changes behaviour, never that the behaviour it lands on is correct.


---

# Finding 4 is now DIRECTLY OBSERVED, not inferred

The pre-merge squad's root-cause lens blocked on exactly the right thing: the DOM snapshot that
would prove Finding 4 shipped in the **same commit as the cure**, so it had never fired. The
mechanism was supported only by code reading plus a fix-and-green coincidence — the identical
evidentiary shape as the budget hypothesis this mission had already been wrong about once.

It also named a rival that fits every observation equally well (**H2**): `iframe.html` ships
`.sb-show-preparing-story:not(.sb-show-main) > :not(.sb-preparing-story) { display: none }`, and
`#storybook-root` is a direct child of `<body>` — so if the render simply never arrives, the
injected composition is **fully present but `display: none`** for the whole budget. Same symptom,
same contention sensitivity, same cure. The two are separated by exactly one number.

## The probe

Branch `kitty/mission-webkit-timing-deflake-01M2T31J-lane-probe` reverts **only** T036's render
wait and keeps everything else, so a real failure prints the discriminating reading. It is not
merged and must not be.

- **Recorded cause** (Storybook's render replaced the root) predicts `hosts-in-dom=0`.
- **H2** (present but hidden) predicts `hosts-in-dom=1`.

**Run `35373693252`** @ `a866420e`, webkit, `retries: 0`, selectors verified (`all 4 line-items
resolve`), items 6–9 at `--repeat-each=20` plus both experiment arms:

```
loadComposition: shell did not settle within 5000ms — missing or unstable: host is not visible
[polls=147, stableReads=0, fonts=ready, hosts-in-dom=0, #storybook-root children=div]
```

| reading | count |
|---|---|
| `hosts-in-dom=0` | **18** |
| `hosts-in-dom=1` or more | **0** |

18 failures across the three sections, 18 readings, **every one `0`**. The recorded cause is
confirmed and **H2 is refuted** — the composition was not hidden, it was absent. `#storybook-root
children=div` names what displaced it: Storybook's own rendered story, a `div`, standing where the
injected `sk-app-shell` had been.

The probe reproduced the contention sensitivity too, which is a second independent check that it
is measuring the same phenomenon: arm A (`workers: 2`) failed several times, arm B (`--workers=1`)
once.

**Classification, applying this document's own measured-versus-inferred discipline to its own
headline claim:**

| claim | status |
|---|---|
| The host is absent during the failure, not hidden or late | **Measured** — 18/18 `hosts-in-dom=0` |
| What occupies `#storybook-root` instead is Storybook's own render | **Measured** — `children=div` |
| Storybook's string-returning story branch assigns `canvasElement.innerHTML` | **Established by reading** Storybook 10.6 source; `sk-app-shell.stories.ts` returns a string |
| `page.goto` resolves at `load`, before that client render | **Established by reading** |
| Contention is a trigger, not the mechanism | **Measured** — 6/80 at `workers: 2` vs 1/80 at `workers: 1`, then 80/80 both after the fix |

The earlier revision of this document asserted Finding 4 as established before any of the first
two rows existed. That was the same error as the budget hypothesis, and it is recorded here
rather than quietly repaired — the correction was produced by an adversarial lens demanding the
measurement, not by the author noticing.

## Finding 3's guard: now evidenced in CI, not only locally

The evidence lens correctly noted that the selector guard's "red-first proof" named no CI run —
it had only been demonstrated locally. It has since refused twice in CI, both times against
genuine drift created by this mission's own fixes:

- **Run `35373383981`** — the first probe push. The revert shifted items 6–9 by −31 lines; the
  guard refused and the rig measured nothing, rather than letting Playwright silently drop four
  stale `file:line` arguments and print a clean table over them.
- Locally, a third time, when the squad fixes shifted the same four items by −4.

Its **identity** check (a label word must appear in the declaration) was added by the squad's
correctness lens and is proved both ways: it fires when item 8 is pointed at item 6's test, and
clears when restored.
