# Tracer: tooling-friction

One entry per finding: `YYYY-MM-DD · actor · <text>`.

---

2026-09-11 · claude · TEST-DRY-RUN — checking tracer surface path before committing real entries

2026-09-11 · claude · SUPERSEDES the prior TEST-DRY-RUN line above, which was an inadvertent tool-path check with no finding content, not a real entry -- left in place per event-sourcing discipline rather than rewritten.

2026-09-11 · claude · A run's Playwright 'unexpected' count is a lower bound, not the true count, when a test contains more than one toHaveScreenshot call: a hard failure on the first prevents the second from ever executing, so it produces no -actual.png and is silently invisible to the harvest. On this PR that hid an 18th invalidated baseline (work-explorer-w4-drawer-dismissed, behind work-explorer-w4-drawer-open in the same test) that the first CI run's 17-failing-tests/17-PNGs accounting made look complete. Found by reviewer-renata and debugger-debbie across two pre-merge gate passes; recovered from CI run 34507030448 (222 total/221 expected/1 unexpected/0 flaky after the fix). Filed as issue #367 (open) rather than fixed inline -- it is a repo-level Playwright-suite defect, not specific to this mission.

2026-09-11 · claude · WP01's history carries a review-cycle-2 (rejected) record that is NOT a real rejection: it was committed mechanically while backfilling an 'agent' metadata field that spec-kitty accept requires and that only a live planned->claimed transition can set; the replay cascaded into an internal rebase and a status-machine backward move that the tooling records as a rejection cycle regardless of cause. The reviewer restated the original APPROVE verdict verbatim in review-cycle-3, naming the artifact explicitly as a tooling side effect. Because these records are event-sourced, it was left in place rather than rewritten -- hiding a tooling artifact would be the worse lie -- and the PR body carries the same disclosure under 'One process note, so it is not misread.'

2026-09-11 · claude · spec-kitty review --mode post-merge and spec-kitty retrospect create/backfill are structurally unreachable for a mission accepted via a programme-orchestrated GitHub PR merge into train/elements-first rather than via spec-kitty merge: baseline_merge_commit is only ever written by spec-kitty merge, and retrospect backfill's own completed-mission scan found 0 candidates for this mission even in dry-run. This mission's lightweight review verdict read FAIL for this reason alone -- WP01 lane stuck at approved, no baseline commit to anchor the dead-code scan -- not because of any spec-to-code fidelity gap; the diff itself, audited independently against the real PR #339 base/head, was clean. This is programme-wide: every sibling mission merged through this same train-via-PR pattern will hit an identical FAIL verdict and an identical retrospect create failure until the lane/baseline-commit gap is closed at the tooling level.
