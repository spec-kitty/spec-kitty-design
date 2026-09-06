Implementer pass on the #197 mission (base train/elements-first 65a92f6).

MEASURED INDEPENDENTLY, NOT TAKEN FROM THE BRIEF. docs/architecture/decisions/ holds 15 .md
records. llms.txt referenced 3 of them and called the directory "All Accepted architectural
decision records"; nine of the fifteen are Accepted, five Proposed, one Complete. llms-full.txt
referenced 14 of 15 (missing 2026-09-06-14-detached-probe-validation-seam.md, added by #194) and
carried three ADR range expressions (:48, :81, :83). Every figure in the brief and in #197 was
confirmed against the tree. ONE CLAIM THE BRIEF DID NOT MAKE was found: llms-full.txt:89-90 also
asserted "Status of every ADR below is **Accepted**" — a set-wide status claim, false for six
records. It is in scope for the same reason llms.txt's "All Accepted" is, and is removed.

THE RULING, AS APPLIED. llms.txt is a link index, so its ADR entries were the index-shaped claim
and nothing else: it now references zero records and carries a pointer. llms-full.txt is prose;
its per-record summaries are content (they are the file's purpose for a reader who cannot open
the record), so they stay, the SET is completed with an ADR-14 summary, and the gate holds it
complete. The gate's link rule is exactly the brief's: EMPTY or COMPLETE, never a subset. No
position is taken on ADR-14's three open questions; the summary says so out loud.

BOUNDARY VERIFIED BY TREE HASH, not by git diff over a path. base and head both
038374d6335eefc88d849b53069bdd40d09aa406 for docs/architecture/decisions. Nothing under
docs/architecture/ appears in the branch diff, and scripts/check-adr-index.mjs is unmodified
(it is imported for classifyEntries, so record classification keeps one owner).

GATE WATCHED FAIL, seven ways, each with its own message and exit 1: a reintroduced range
expression; a reference set of 14 of 15; a deleted pointer; a restored "All Accepted" claim; a
reference to a record that does not exist; an empty decisions directory; a missing decisions
directory. Deleting both CI steps reds check-gate-wiring.mjs naming both; deleting only the bare
step reds it naming only that one, which is the whole-command matching working. All output is
recorded verbatim in the PR body.

EMPTY-SET FLOORS. Zero records, a missing decisions directory, a missing surface file, an empty
surface file, an emptied SURFACE_FILES list, and an emptied RANGE_PATTERNS or CARDINALITY_PATTERNS
set are each a failure. --selftest carries 23 defect probes and 12 healthy-shape probes, with
asserted floors on both counts AND a floor tying probe count to pattern count, so a deleted
pattern cannot be free. Every probe declares the message it expects — #193's collateral-trip
defect is not reintroduced. Two of the healthy probes assert the EXTRACTOR's behaviour in both
directions, because a narrowed extractor makes every partial list look like the legitimate empty
set and nothing else in the table would notice.

LOCAL VERIFICATION. check-llms-adr-surface.mjs exit 0 (llms.txt 0 refs, llms-full.txt 15 refs);
--selftest all 35 probes; check-adr-index.mjs and its --selftest still green and untouched;
check-gate-wiring.mjs green; eslint clean on both changed scripts.

NOT DECIDED HERE. No architectural question was answered. No issue was filed: no fork was found
that the brief had not already settled.
