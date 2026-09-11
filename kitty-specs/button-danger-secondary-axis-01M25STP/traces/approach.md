# Tracer: approach

One entry per finding: `YYYY-MM-DD · actor · <text>`.

---

2026-09-11 · claude · PR #341 rebased 8 times against train/elements-first, which landed a new PR roughly every 25-45 minutes; the branch reached full green repeatedly only to be overtaken by the next train landing before merge. The fix that stopped the churn was ORDERING: run the spec-kitty accept gate BEFORE the final rebase, not after, because accept itself creates commits (acceptance-matrix records, FR-019 pass record, Finalize/Record acceptance commits) and therefore moves HEAD -- accepting first and rebasing once more afterward collapsed what had been an open-ended rebase race into one deterministic final rebase.
