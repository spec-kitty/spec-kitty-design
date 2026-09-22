Pre-merge reviewer lens on the #193 mission diff (head 3379f05, base train/elements-first 15c4abf).

MEASURED INDEPENDENTLY, NOT TAKEN FROM THE BRIEF. docs/architecture/decisions/ holds 15 .md
files. The README ADR table held 8 rows. Unindexed: ADR-8, 9, 10, 11, 12, 13 and
ADR-003-addendum-token-values.md — 7 of 15. Stale rows: 0. Confirms the brief's count and
contradicts #193's own text, which claims grep -c 'ADR-14' returns 0 in both indexes; #194 had
already added both, so that half of the issue is stale and was not redone.

BOUNDARY VERIFIED. `git diff origin/train/elements-first -- docs/architecture/decisions/` is
empty. No ADR content, status, title or filename changed. Every row's Title comes from the
record's H1 and every Status from the record's own **Status:** field, read file by file — nine
Accepted, five Proposed, one Complete. ADR-4's `Priivacy-ai` was transcribed verbatim rather
than corrected, and filed as #198 instead.

FINDINGS RAISED AND RESOLVED IN THE SAME PASS.
1. (MAJOR, fixed) `statusToken` rejected an emphasised cell — a table reading `**Accepted**`
   would have red the gate for a formatting choice, the exact "gate someone turns off" failure
   the script's own header names for titles. Emphasis is now stripped before tokenising, with a
   healthy-shape probe; the negative floor moved 4 → 5.
2. (MINOR, fixed) main() crashed with a stack trace when docs/architecture/README.md was absent,
   instead of failing with a message. Guarded.
3. (MAJOR, rejected) Adding `lint-code` to check-gate-wiring.mjs's JOBS list was tried and
   reverted: that file's whole-job payload audit reds on ESLint's and Stylelint's deliberate
   continue-on-error. The gate is instead registered in REQUIRED_LINT, and the reason is
   recorded in the file next to the JOBS list so the next person does not retry it.
4. (INFO, filed) llms.txt (3 of 15 records) and llms-full.txt (14 of 15, plus a directory-map
   line reading "ADR-1 through ADR-13") are a third and fourth ungated ADR index. Out of this
   mission's two named surfaces — filed as #197 rather than widened into.

GATE WATCHED FAIL, three ways, verbatim output recorded in the PR body: a record with no row
(names the file, exit 1); a row pointing at a deleted record (names the row, exit 1); a row
promoting ADR-9 to Accepted while the record says Proposed (prints both, exit 1). The
REQUIRED_LINT registration was also proved by deleting the CI line and watching
check-gate-wiring.mjs red.

EMPTY-SET FLOORS. Zero record files, zero parsed rows, a missing `## Decisions (ADRs)` section,
a missing README, and zero records to compare statuses against are each a failure. --selftest
carries 14 defect probes and 5 healthy-shape probes with an asserted floor on both counts.

LOCAL VERIFICATION. check-adr-index.mjs exit 0 (15 records / 15 rows); --selftest all probes
correct; check-gate-wiring.mjs green; eslint clean on both scripts; check-release-graph's
checkNoHandWrittenListsAnywhere and checkWorkflowUsesDerivedSet run in isolation over the edited
workflow, 0 problems; commitlint over origin/train/elements-first..HEAD, 0 problems.

No approval given — CI on the PR is authoritative.
