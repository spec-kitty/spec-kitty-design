# WP03 (lane-c): WP01 rig's item-10 line selector went stale after T021's fix

**What was attempted**: T023 — repeat-run `sk-workflow-board.spec.ts` item 10 under WP01's
rig (`scripts/webkit-repeat-run.mjs`) after landing the T021 fix, via CI run
https://github.com/spec-kitty/spec-kitty-design/actions/runs/35353409734 (push-triggered,
all 12 items, repeat-each=10, webkit, retries=0).

**Verbatim error** (from the rig's own report, which correctly treats this as a hard
failure rather than a silent zero — `anyEmptyReported` in `webkit-repeat-run.mjs`):

```
Item 10 (focused overflow keyboard scroll):
    ⚠️  NO MATCHING RESULTS — the item did not run at all (not a zero count).
```

**Root cause**: `scripts/webkit-repeat-run.mjs` selects item 10 by an exact, hardcoded
`file:line` (`sk-workflow-board.spec.ts:557`, the line the test's `test(...)` call started
at when the rig was written). T021's fix added a ~63-line documented helper function
(`waitForScrollSettled`) ahead of that test in the same file, which is the correct place for
it (adjacent to the file's other test helpers, e.g. `assertScrollerSkippedBySequentialFocus`
immediately above it). That shifted the test's own `test(...)` line from 557 to **620**.
Playwright's `file:line` selector then resolved to a different location entirely (inside an
unrelated `OneEmptyLane` test), producing zero matching results rather than a wrong match —
which is why the rig's own JSON-driven summarizer (matching on `file` + `line` + `title`)
correctly reported "no matching results" instead of silently attributing a false count.

**Workaround for this WP's own measurement**: ran Playwright directly against the corrected
location (`sk-workflow-board.spec.ts:620 --project=webkit --retries=0 --repeat-each=10
--reporter=list`) to get item 10's real post-fix count without depending on the rig's stale
table, then separately corrected the table (see below) so the shared rig keeps working for
whoever runs it next.

**Root-cause hypothesis, mission-wide**: any WP whose fix inserts code *above* its target
test's line, in a file the rig also selects by exact line, will silently invalidate that
line for every later measurement — not just this one. `sk-progress.spec.ts` (5 rig entries,
WP02) and `sk-team-overview-shell-layout.spec.ts` (4 rig entries, WP04) are the two files
where this risk compounds across multiple items in the same file; `sk-workflow-board.spec.ts`
only has the one entry (item 10) so this instance was self-contained. Item 12 is unaffected
because it is grep-selected by title, not by line.

**Proposed remediation**: WP01 (or the mission's final integration pass) should re-derive
every `LINE_ITEMS` line number from the merged, fixed tree right before the mission's closing
measurement, rather than trusting the pre-fix baseline's line numbers to still be correct.
This WP (WP03) made the one-line correction for its own entry (item 10: 557 → 620) directly in
`scripts/webkit-repeat-run.mjs`, since leaving the rig broken for that item was worse than a
disclosed, mechanical, one-line, non-behavioral correction outside WP03's nominal
`owned_files` — flagged here and in the commit message rather than done silently.
