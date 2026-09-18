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

## 2. The rig selects tests by hardcoded `file:line`

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
