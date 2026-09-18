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
