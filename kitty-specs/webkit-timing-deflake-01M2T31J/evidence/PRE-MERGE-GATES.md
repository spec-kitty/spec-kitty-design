# Pre-merge gates — check every one before the train merge

Recorded by the orchestrator during implementation, because several of these are only visible from
outside a single lane and at least one is a live hazard right now.

## 1. No temporary red-first mutation may survive (T015a, and its WP03 equivalent)

Red-first proofs require deliberately breaking a component, observing the failure, and **reverting**.
A leftover mutation to a webkit-only behaviour **passes every gate in this repository**:
`visual-regression` runs chromium-only (`ci-quality.yml:626`) while every test in mission scope is
webkit.

Known temporary commits that MUST be reverted before merge:

| lane | commit | mutation | state |
|---|---|---|---|
| lane-c (WP03) | `f11a33c2` | `sk-workflow-board.css:30` `overflow-x: auto`→`hidden`; `sk-action-row.stories.ts:129` href `#details`→`#not-details` | **TEMPORARY — revert required** |
| lane-b (WP02) | — | T015 mutations to `packages/styles/src/progress/**` | revert required by T015a |

**Check before merging**, from the merged tree, not from a lane:

```sh
git diff --stat <train> <merge-result> -- packages/styles/ packages/elements/
```

Every hunk must be either absent or a declared C-007 finding carrying C-011's visual diff and
maintainer approval. `grep` the final diff for `overflow-x: hidden` and `#not-details` specifically.

## 2. The rig selected tests by hardcoded `file:line` (CLOSED — it now resolves each item from a unique `titleAnchor` at run time; see NI-003)

`scripts/webkit-repeat-run.mjs` picks each item by exact line. **Any edit that inserts lines above a
selected test silently points the selector at a different test.** WP01's rig fails loudly
(`NO MATCHING RESULTS — the item did not run at all`) rather than reporting a false zero — but that
has to be read for, because a missing item does not look like a failure.

Hit twice: WP03 (helper insertion shifted 557→620, corrected the rig) and WP02 (instrumentation
shifted four of five items; it restored its own line numbers instead, which is cleaner — no shared
file touched). Item 12 is grep-selected and immune.

**Before trusting any final measurement**, re-verify every selector resolves to the intended test:

```sh
for n in 369 440 456 465 510; do sed -n "${n}p" apps/storybook/src/tests/sk-progress.spec.ts; done
```

## 3. Already-green items may not be counted as fixed (SC-001)

Items 7, 11 and 12 passed at baseline. Each must be either demonstrated failing under another
condition and then held, or reported **not reproduced** under FR-013/SC-008. The mission report must
say which, per item. No package closes on an empty diff by claiming a baseline-green result.

## 4. The baseline is samples, not ground truth

Two rig runs on substantially the same code disagreed on four items (item 7: 20/20 then 8/10). Any
"clean" verdict needs more than one sample, and any count carrying a conclusion must state how many
samples it rests on.

## 5. Charter gates at the merge itself

- **Full adversarial squad — all four lenses — evidence posted as a PR comment before merge**, naming the commit SHA reviewed, each lens by profile id with its verdict, findings as severity/file/line/recommendation, and the disposition of each. Not tiered: every PR into the train gets it.
- CI green on the PR **head SHA**, and the squad evidence naming **that same SHA**. Both are SHA-pinned, so any later push invalidates both.
- `C-011`: a landed component change needs a visual diff and one maintainer approval — it cannot self-merge.
- Merging `train/elements-first` into `main` is **not** delegated and is out of scope.

## 6. Mission-state hygiene

- `#N` in spec/plan/tasks prose gets scraped into a required issue matrix and blocks `move-task --to approved` for **every** WP. Cite issues as bare numbers unless the mission is undertaking them.
- Re-run the committed-tree scan for absolute `/home/<user>/` paths before any push carrying `status.json`, `status.events.jsonl` or review records.

---

## 7. Carried findings — must appear in the SC-008 mission report, not be lost

**`openStory()`'s flat `page.waitForTimeout(50)`** — `apps/storybook/src/tests/sk-radio-choice-group.spec.ts:~257`, used by every story in that file. This is precisely the "wait on elapsed time" shape the mission exists to remove, and it is **not fixed**.

WP05 found it and deliberately left it alone; its reviewer independently confirmed the code and endorsed the restraint. The reasoning is worth preserving because it is the correct one: across four evidentiary samples nothing ever failed through that helper, so there was **no way to red-first-prove a fix** (C-012). An unprovoked edit to code shared by every test in the file would trade a demonstrated-zero-risk item for an unproven-risk one. The mission's canonical scope is the twelve demonstrated items, not a sweep of every latent timing pattern in a touched file.

Carry it as a **named future-action item**. Reporting a defect you correctly decline to fix is a deliverable; silently dropping it is not.

## 8. The evidence principle this mission arrived at

**Condition diversity beats sample volume.** 100 consecutive passes under one condition is *the same kind of evidence* as 20 under that condition — not a categorically stronger kind. Item 7 proved this: 20/20 in the T003 baseline, then 8/10 in a later run on unmodified code.

What actually resolved item 11 and item 12 was not repeat count but running the **contention condition** — full suite, 2 workers, `retries: 2` — which is the shape under which both were originally observed failing. Both passed clean there.

So when a "not reproduced" verdict is written, it must state **which conditions were tried**, not only how many repeats. A verdict resting on one condition at high volume is weaker than one resting on two conditions at low volume, and the report should make that visible rather than quoting the larger number.

## 9. Corrections sent by message do not reach a lane's files

WP task files are **frozen at dispatch**. When the orchestrator corrects a premise mid-mission — as
happened when a second baseline sample showed item 7 *does* reproduce, contradicting WP04's task
file's "item 7 is 20/20, do not hunt it" — the correcting commit lands on `mission/webkit-deflake`
and is **not an ancestor of the lane**. WP04's reviewer verified this directly with
`git merge-base --is-ancestor` and then checked whether the implementer had been misled by the stale
premise. It had not: it picked the correction up out-of-band and said so in its `for_review` note.

**That worked because the seat was diligent, not because the system prevented it.** When a premise
changes after dispatch, either merge the correcting commit into the affected lane, or state in the
message that the task file is now stale and which line is wrong. A reviewer should check
`git merge-base --is-ancestor <correcting-commit> <lane>` whenever a mission-level premise moved
during a package's lifetime.

## 10. Reporting gaps to close in the SC-008 report

- **Item 7 has no disaggregated post-fix count.** WP04 reports items 6 and 7 together ("no measurable improvement above the rig's own cross-run noise"). The FR-013 conclusion is unambiguous and was not silently folded in, but the mission report needs item 7's own number, not a lumped one.
- **Item 6's T032 refutation is chromium-only.** The CSS-Grid mechanism (fixed tracks + `min-width: 0`) is spec-level and engine-independent in principle, and it is corroborated by webkit behaviour — item 6 received the same font fix that measurably helped items 8/9 and still showed no improvement, which is what you would expect if its residual failure is not font-metric-driven. No webkit font-probe was run. Residual, non-blocking, but state it rather than implying a webkit measurement exists.

## 11. Pushing the revert cancels the run that was capturing the red-first proof

`ci-quality.yml` and the rig both set `concurrency: cancel-in-progress: true`. So the obvious
sequence — mutate, push, revert, push — **kills the mutation run mid-flight** and the proof is never
captured. The revert is correct and T015a is satisfied; what is lost is T015.

Observed on WP02: run `35357051318` at the mutation commit came back `completed/cancelled` with
**zero item output**, superseded by the revert push about two minutes later. No other run existed at
that SHA, so the red-first evidence for four rewritten assertions simply did not exist, while the
lane looked clean and finished.

**This is hard to notice** precisely because everything downstream looks right: the diff is clean, the
fix is green, the WP is ready to close. Only the *absence* of a proof gives it away — and an absence
is what nobody checks.

**The order that works** (WP03 did this correctly): mutate → push → **wait for the run to complete and
capture its output** → then revert → push → reconfirm green. Never push while the capture run is in
flight.

**Cheaper alternative**: a targeted `workflow_dispatch` of the rig with `items=<n> repeat_each=3`.
Three repeats is ample for a red-first — the claim is that the assertion *can* fail, not a rate.

**Check at merge**: for every rewritten assertion, a completed (not cancelled) run must exist at the
mutation SHA showing the failure. `gh run list` and confirm `conclusion` is not `cancelled`.

## 12. The merged rig's selectors — verify, do not assume

Three lanes corrected `scripts/webkit-repeat-run.mjs` for line drift, each fixing a *different*
selector in the same file:

| lane | `sk-progress` items 1–5 | `sk-workflow-board` item 10 |
|---|---|---|
| lane-b (WP02) | **416 / 487 / 503 / 523 / 568** — corrected | 557 — stale |
| lane-c (WP03) | 369 / 440 / 456 / 465 / 510 — stale | **620** — corrected |
| lane-a (WP01) | original 369 / 440 / 456 / 465 / 510 | original 557 |

Because they touched different lines, git merges both cleanly and the composed rig **should** carry
`416/487/503/523/568` *and* `620`. That is a prediction, not a result.

**This mission has been bitten by stale selectors three times**, and the third time — run
`35360910036` — items 4 and 5 came back `NO MATCHING RESULTS` because the numbers were one line off.
Playwright **silently drops a `file:line` selector that matches nothing** when it is mixed with valid
ones, so the run looks normal and simply omits the item; only WP01's rig guard turns that into a
visible failure rather than a false zero.

**Check on the merged tree, before the final push:**

```sh
for n in 416 487 503 523 568; do sed -n "${n}p" apps/storybook/src/tests/sk-progress.spec.ts; done
sed -n '620p' apps/storybook/src/tests/sk-workflow-board.spec.ts
```

Every line must be a `test(` declaration for the intended item. If any is not, the merged rig is
wrong even though every lane was individually right — and the failure mode is a silently missing
measurement, not a red run.

## 13. SC-002's mechanical count was tuned to pass, not measured to pass (pre-merge squad F1)

`scripts/scan-mission-suppressions.mjs` counts "rewritten-assertion sites" and `RED-FIRST-PROOF`
markers separately and reports SC-002 as met when the two totals are equal and non-zero. At
`eb50aa55` those totals were **9 sites / 11 markers**. Commit `c8191843`'s entire content is two
marker-header rewordings that reduced the marker count from 11 to 9 to match the site count — the
numerator was edited to fit the denominator, not the other way round, and no proof was added or
removed by that commit. **Do not read the resulting 9=9 as evidence of anything.**

Separately, and worse: the two counts were never measuring the same population. The "rewritten
assertion" count landed almost entirely on WP06's `console.warn`-wrap hunks in
`fixtures/elements-behaviour/src/*.test.ts` (re-indentation only, per FR-011 — every `expect()`
byte-identical). The 9 `RED-FIRST-PROOF` markers live in `apps/storybook/src/tests/*.spec.ts` and
contribute ~0 to the site count. The mechanical proxy is therefore not a per-assertion guarantee
and was never able to be one; see the added limitation note at the top of
`scripts/scan-mission-suppressions.mjs` for the mechanism.

The REAL, marker-by-marker correspondence, checked by hand against CI:

| file | marker(s) | run id | mutation commit | revert commit |
|---|---|---|---|---|
| `sk-progress.spec.ts` items 1–5 | 5 | `35358002926` | `3fbb49a2` | `f53c7f3d` |
| `sk-workflow-board.spec.ts` item 10 | 1 | `35354582083` | `f11a33c2` | `ee093dbe` |
| `sk-action-row.spec.ts` item 12 | 1 | `35354582083` | `f11a33c2` | `ee093dbe` |
| `sk-team-overview-shell-layout.spec.ts` (`settleComposition`) | 2 | none cited | none identified on the branch | none identified on the branch |

Seven of nine markers carry a real, independently-checkable run/mutation/revert triple. Two do
not — see §14. `acceptance-matrix.json`'s SC-002 and NFR-003 rows are corrected to `partial` to
reflect this 7-of-9 reality rather than the mechanical 9-of-9.

## 14. Two `settleComposition` markers, and two comment claims, do not survive a check (pre-merge squad F2, F4)

`sk-team-overview-shell-layout.spec.ts`'s two `RED-FIRST-PROOF` markers for `settleComposition`
name no run id, no mutation commit, no revert commit, no output and no engine — unlike all seven
other markers in §13's table. There is no mutation/revert commit pair for this helper anywhere on
the branch, and WP04's own `status.events.jsonl` entries carry zero CI run ids for it. WP04's
reviewer independently confirmed the underlying claim differently: "verified by code trace, not by
executing webkit/chromium locally... Could not independently verify the exact CI run IDs... for the
post-fix samples." That is a legitimate form of verification, but it is not a red-first CI proof,
and the marker comments should not read as though it were.

Two further claims in the same comment block do not hold up against this mission's own baseline
data: "Item 9-dark improved (7/10 → 9-10/10)" and an equivalent claim for item 8 (8/10 pre-fix).
`evidence/T003-baseline.md`'s **second sample**, taken on **unmodified code**, already reads
**9/10 dark** for item 9 and **10/10** for item 8 — both inside the claimed post-fix range, from
noise alone. Neither claim is a demonstrated delta as written.

**Disposition**: `acceptance-matrix.json`'s FR-007 row is corrected to `partial` and its notes
record what the two markers actually rest on. The comment block in
`sk-team-overview-shell-layout.spec.ts` itself was under active, concurrent edit by another seat
at the time this finding was closed out (that seat is adding real chromium-local red-first proofs
`(c)`/`(d)` to the same helper for an unrelated code finding) — the marker text was not hand-edited
here to avoid colliding with in-flight work, but it still needs the same correction once that WP
lands: state plainly that reachability was established by code trace and reviewer inspection, name
no run that does not exist, and drop or requalify the item 8/9-dark "improved" language.
