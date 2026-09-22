# Tracer: tooling-friction

One entry per finding: `YYYY-MM-DD · actor · <text>`.

---

2026-09-11 · claude · CI failed once on the mutation-suite (scripts/suite-selftest.mjs) time ceiling. All 272 mutation arms produced their named red (the check itself was correct) but the harness overran a wall-clock budget calibrated for 210 arms; the train's own growth during this mission's 8 rebases added 26 net-new mutation arms ahead of this branch, pushing the real arm count to 272 without the budget being recalibrated. Filed as #408 (budget needs to scale with arm count, not stay a fixed constant); the same run passed on re-run within documented timing variance -- this was a budget-vs-growth mismatch, not a flaky or real mutation-coverage defect.

2026-09-11 · claude · During one of the 8 rebases, a merge conflict on a GENERATED file (packages/elements/src/button/sk-button.css.js, built from sk-button.css) was resolved with 'git checkout --ours' as a shortcut. That silently dropped real CSS rules the train side had legitimately changed underneath this mission's own additions -- the conflict looked like pure churn from the rebase cadence but was not. It was caught only because the mission's own regeneration discipline (node scripts/build-elements-css.mjs then --check, per plan.md's Design section 4) was run unconditionally after every rebase rather than only when a conflict was flagged: the --check step failed against the --ours placeholder, exposing the loss. A raw diff review of the resolved file, without regenerate-then-check, would have missed it.
