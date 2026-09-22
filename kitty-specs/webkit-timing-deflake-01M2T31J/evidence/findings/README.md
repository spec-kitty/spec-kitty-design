# Harvested findings log

The charter's Findings Log Practice writes to `tmp/finding/`, which matches a `.gitignore` rule — the
entries persist only while a checkout exists, and the charter expects them to "drive a post-merge
remediation pass". They are copied here verbatim so that pass has something to work from after the
lanes and worktrees are gone.

Four entries were logged. **Three are the same root cause**, which is itself the finding worth acting
on upstream:

| entry | cause |
|---|---|
| `wp03-lane-c-rig-line-number-drift.md` | rig selects tests by hardcoded `file:line`; a helper inserted above a target retargeted it |
| `wp02-t010-rig-line-number-drift.md` | same, twice, from diagnostic edits — one run silently omitted *every* selector in the file |
| `wp02-review-fix-item4-item5-rig-line-drift.md` | same again, from a one-line annotation edit; items 4 and 5 returned `NO MATCHING RESULTS` |
| `wp06-lane-f-node-modules-missing.md` | lane worktree had no `node_modules`; temporarily symlinked to the root install, removed before committing |

## The upstream recommendation

`scripts/webkit-repeat-run.mjs` selecting by `file:line` is fragile by construction: **every** edit
above a target silently retargets it, and Playwright **drops a `file:line` selector that matches
nothing when it is mixed with valid ones** — so the run completes, looks normal, and just omits the
item. Note the two symptoms differ: one incident produced total omission of every selector in the
file, another omitted only the two stale items. A future reader should not assume a single symptom.

What saved this mission every time was **not** the selector mechanism but WP01's guard, which reports
`NO MATCHING RESULTS — the item did not run at all` instead of a zero count. Three silent measurement
failures were caught that way.

**Recommendation**: select by test title (`-g`) rather than `file:line`, as item 12 already does —
it is the one item in the mission that never drifted. Failing that, keep the guard and treat it as
load-bearing rather than defensive.
