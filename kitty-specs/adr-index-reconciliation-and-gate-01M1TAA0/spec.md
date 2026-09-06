# Mission Specification: ADR Index Reconciliation and Coverage Gate

**Mission Branch**: `mission/adr-index-reconciliation-and-gate`
**Created**: 2026-09-06
**Status**: Draft
**Mission**: documentation
**Input**: GitHub issue spec-kitty/spec-kitty-design#193 — "[docs] The ADR indexes are stale —
README's table and the programme doc's ADR-8–13 list omit later ADRs."

## Adaptation note (docs mission with one code deliverable)

The `documentation` mission template's Divio framing (tutorial / how-to / reference /
explanation) does not describe this work. The deliverable is two reconciled **indexes** plus one
**gate script**. So:

- "Documentation consumers" below are read as readers of the ADR index — a mission agent looking
  for the ADR that governs the work it is about to spec, a reviewer checking whether an ADR was
  consulted, the operator auditing which records are Accepted.
- The gate is application-adjacent code (`scripts/`), reviewed as code, wired into `ci-quality.yml`.
- Divio type: **reference** only. No tutorial, how-to or explanation is authored or changed.

## The measurement this mission starts from

Taken on `train/elements-first` at `15c4abf`, by parsing the README table's link targets against
a directory listing (the same shape the gate will use):

```
files on disk: 15
table rows:     8

FILES WITH NO ROW:
  2026-09-02-8-custom-elements-base-layer.md
  2026-09-02-9-shadow-dom-and-styling-api.md
  2026-09-02-10-distribution-and-canonical-markup.md
  2026-09-02-11-verification-stack-and-wrapper-generation.md
  2026-09-02-12-consumer-audit-of-record.md
  2026-09-02-13-storybook-web-components-builder.md
  ADR-003-addendum-token-values.md

ROWS WITH NO FILE: (none)
```

**Seven of fifteen records are unindexed** — worse than #193 states, which names ADR-14 as the
visible instance. The three the elements-first programme cites most (ADR-9 styling API, ADR-10
canonical markup, ADR-11 verification stack) are all in the missing set. The reverse direction is
currently clean; the gate asserts it anyway, because a row surviving a renamed or deleted record
is the same defect pointing the other way.

**#193's own premise is partly stale.** It says `grep -c 'ADR-14'` returns 0 in both indexes.
On the current tree it returns 1 in `docs/architecture/README.md` (row added by #194) and 1 in
`docs/architecture/elements-first-programme.md` (governing-decisions line, also #194). What
survives from #193 is the *class* — a hand-maintained table with no gate — and the hard-coded
`ADR-8–13` range phrasing.

## The identifier mismatch

The README table calls the first seven records `ADR-001`…`ADR-007`. Nothing else in the repo
does. The filenames are `2026-05-01-1-…`, the records' own H1s are `# ADR 1 (2026-05-01): …`,
`elements-first-programme.md` writes `ADR-8`, `ADR-9`, `ADR-10`, and the row #194 added for the
newest record is `ADR-14`. So the table is the only surface using zero-padding, and it is padding
identifiers the documents do not use for themselves.

This is reconciling a label with its referent, not selecting a convention: the row's job is to
name the record the record names itself. `ADR-003-addendum-token-values.md` is the one exception —
its own H1 is `# ADR-003 addendum: …`, so its row says `ADR-003 addendum`, padding included,
because that is what that document calls itself.

## Scope boundary

**IN SCOPE.** Indexing. Two index surfaces are reconciled against `docs/architecture/decisions/`
as the source of truth, and a gate is added that fails when they drift again.

**OUT OF SCOPE — and this boundary is the sharp one.** No ADR's content or Status is edited.
Every row's Status is transcribed from the record's own `**Status:**` field. Six records are
`Proposed` (ADR-9, 11, 12, 13, 14) and one is `Complete` (the ADR-003 addendum); the table says
so. Promoting anything to `Accepted` is the operator's act, not this mission's, and the gate
this mission ships makes an unratified promotion in the table a **CI failure** rather than a
silent edit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A mission agent looks up the ADR governing the work it is about to spec (Priority: P1)

The charter's `architectural_review_requirement` obliges every mission to review the relevant ADRs
before speccing. Today an agent that starts from `docs/architecture/README.md` sees seven records,
all from 2026-05-01, plus ADR-14. ADR-8's base-layer decision, ADR-9's label-ownership ruling and
ADR-10's canonical-markup rule are invisible from the index — findable only by already knowing
they exist.

**Why this priority**: an index that omits the records the current programme runs on inverts its
own purpose, and the charter obligation is unsatisfiable from it.

**Independent Test**: `ls docs/architecture/decisions/*.md` and the README table produce the same
set. Verified mechanically by the gate, not by reading.

**Acceptance Scenarios**:

1. **Given** the reconciled README, **When** an agent lists the ADR table, **Then** all fifteen
   records appear, each linking to a file that exists.
2. **Given** an agent needs the ratification state of a record, **When** it reads the Status
   column, **Then** the value equals the record's own `**Status:**` field.

---

### User Story 2 - A later mission adds an ADR and forgets the index (Priority: P1)

This is the recurrence. #188 added ADR-14 and #194 added its row by hand; the six records before
it were added without rows and nobody noticed for four days of missions.

**Why this priority**: reconciling the instance without closing the class means filing #193 again
in a month. #193 itself asks for the gate, and the repo has the pattern already —
`checkSubpathCoverage` in `scripts/check-release-graph.mjs` derives coverage from a directory
listing "precisely because hand lists drift".

**Independent Test**: add a file to `decisions/` with no README row; CI reds with a message
naming the file. Add a row pointing at a non-existent file; CI reds naming the row.

**Acceptance Scenarios**:

1. **Given** a new record with no row, **When** the gate runs, **Then** it exits non-zero and
   names the unindexed file.
2. **Given** a row whose link target does not exist, **When** the gate runs, **Then** it exits
   non-zero and names the row.
3. **Given** a row whose Status disagrees with the record's Status field, **When** the gate runs,
   **Then** it exits non-zero and prints both values.

---

### User Story 3 - The gate itself is emptied or disarmed (Priority: P1)

A coverage check that scans zero files and prints green is the defect it exists to prevent. This
repo has hit it repeatedly and says so in-tree: `checkTarballsNonEmpty` ("refusing to report green
over an empty set"), `checkSubpathCoverage` ("refusing to certify coverage over nothing"),
`expected-docs.json`'s `$comment` ("a green line over an empty set, in the gate whose own docstring
names that defect class"), `check-gate-wiring.mjs` ("the job's ABSENCE is a failure, not a pass").

**Why this priority**: a gate nobody has watched fail is not evidence, and a gate that cannot see
its own subject is worse than none.

**Independent Test**: `--selftest` feeds every check a synthetic defect and fails if any probe
does not trip; it also asserts a floor on the probe count so a silently emptied probe list is
itself a failure.

**Acceptance Scenarios**:

1. **Given** an empty `decisions/` glob, **When** the gate runs, **Then** it fails rather than
   reporting coverage over nothing.
2. **Given** a README whose ADR table parses to zero rows, **When** the gate runs, **Then** it
   fails rather than reporting every file as unindexed-but-tolerated or the table as trivially
   consistent.
3. **Given** the mission's own PR, which touches only `docs/`, `scripts/` and CI wiring, **When**
   CI runs, **Then** the job carrying the gate actually executes (it is not behind a path filter
   that excludes docs-only changes).

### Edge Cases

- A record whose Status field carries trailing prose (ADR-10 `Accepted (ratified by the operator,
  2026-09-02)`; ADR-11 and ADR-14 carry paragraphs). The table records the leading token; the gate
  compares leading tokens.
- The addendum uses `**Status**: Complete` — bold ends before the colon, and the value is in
  neither the Proposed/Accepted vocabulary. The parser tolerates both punctuations and the gate
  does not impose a status vocabulary; it only asserts table and record agree.
- A non-ADR `.md` landing in `decisions/` (e.g. a README for the directory). Treated as a record
  requiring a row — the directory is the authority, so anything in it is indexed or moved out.
- Link targets written with an anchor or query suffix.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `docs/architecture/README.md`'s ADR table MUST contain exactly one row per file in
  `docs/architecture/decisions/`, each linking to that file by a relative `decisions/…` path.
- **FR-002**: Each row's Title MUST be the record's own H1 title, and each row's Status MUST be the
  leading token of the record's own `**Status:**` field. Neither is inferred.
- **FR-003**: Row identifiers MUST use the form the record uses for itself — unpadded `ADR-1`…
  `ADR-14`, and `ADR-003 addendum` for the addendum.
- **FR-004**: `docs/architecture/elements-first-programme.md`'s "Governing decisions" line MUST NOT
  enumerate a hard-coded ADR range. It MUST point at the index and the directory.
- **FR-005**: `elements-first-programme.md:98` ("ADRs 8–13 are committed") MUST be left unchanged —
  it is a historical statement about O1 and is still true.
- **FR-006**: A gate script MUST assert FR-001 in both directions: no file without a row, no row
  without a file.
- **FR-007**: The gate MUST assert FR-002's Status agreement, so a table row cannot promote a
  record the operator has not ratified.
- **FR-008**: The gate MUST fail when the decisions directory yields zero files, and when the ADR
  table parses to zero rows.
- **FR-009**: The gate MUST carry a `--selftest` mode that feeds each check a synthetic defect and
  fails if any probe does not trip, with an asserted floor on the probe count.
- **FR-010**: The gate MUST be wired into an existing `ci-quality.yml` job that runs on a
  docs-only pull request; no new workflow is added.
- **FR-011**: No ADR file's content or Status MAY be modified by this mission.

### Non-Functional Requirements

- **NFR-001**: The gate's checks are pure functions over parsed inputs, so `--selftest` can feed
  them synthetic defects without touching the filesystem — the shape `check-release-graph.mjs`
  and `build-react-wrappers.mjs` already use.
- **NFR-002**: Both deliberate failures are observed and their verbatim output recorded before the
  mission closes. A gate observed green on a healthy tree has demonstrated nothing.

### Constraints

- Commit type/scope enum is `[tokens storybook doctrine ci docs release deps security styles
  elements react]`; `docs(adr)` and `docs(specs)` are rejected. Headers ≤100 chars.
- The PR bases on `train/elements-first`. A PR based on anything else runs zero gates.
- Generated artifacts, if touched, are regenerated with `--skip-nx-cache`.

### Key Entities

- **ADR record**: a `.md` file in `docs/architecture/decisions/`, carrying an H1 that names itself
  and a `**Status:**` field. The source of truth for both indexes.
- **ADR table**: the pipe table under `## Decisions (ADRs)` in `docs/architecture/README.md`. Rows
  are `| [id](decisions/file.md) | Title | Status |`.
- **Governing-decisions line**: `elements-first-programme.md:5`. Currently a hand-written
  enumeration; becomes a pointer.
- **The gate**: `scripts/check-adr-index.mjs`, run from `lint-code` in `ci-quality.yml`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Files on disk = rows in the table = **15**, both directions, measured by the gate.
- **SC-002**: Every row's Status equals its record's Status token — five `Proposed`, nine
  `Accepted`, one `Complete`. No record's Status field is touched (`git diff` over
  `docs/architecture/decisions/` is empty).
- **SC-003**: `node scripts/check-adr-index.mjs` exits 0 on the reconciled tree and prints the
  count it examined.
- **SC-004**: `node scripts/check-adr-index.mjs --selftest` trips every probe and asserts the
  probe-count floor.
- **SC-005**: With a decision file added and no row, the gate exits non-zero naming that file;
  with a row added pointing at a non-existent file, the gate exits non-zero naming that row. Both
  outputs are recorded verbatim in the mission's evidence.
- **SC-006**: The gate runs on this PR, which touches `docs/` — confirmed against the job list of
  the PR's own CI run, not by reading the path filters.
- **SC-007**: `npx commitlint --from origin/train/elements-first --to HEAD` passes.

### Quality Gates

- No broken relative links in the reconciled table (each target is stat-ed by the gate).
- Heading hierarchy in the edited docs is unchanged.
- The squad trail (`.kittify/evidence/`, `kitty-ops/`) is committed.

## Assumptions

- **ASM-001**: `docs/architecture/decisions/` contains only ADR records; anything landing there is
  a record that should be indexed.
- **ASM-002**: `lint-code` has no `if:` guard and no path filter, so it runs on every PR to
  `main` and `train/**` — to be confirmed against the actual run, per SC-006.
- **ASM-003**: `llms.txt` and `llms-full.txt` are separate hand-maintained ADR surfaces outside
  this mission's two named indexes. Their drift is filed, not fixed here.

## Out of Scope

- Editing any ADR's content, Status, title or filename.
- Deciding anything architectural. A genuine fork found while reconciling is filed as an issue
  with the measurement attached, not resolved.
- `docs/architecture/elements-first-run-prompt.md:163` — already fixed by #194.
- `elements-first-programme.md:98` — deliberately preserved (FR-005).
- `llms.txt` / `llms-full.txt` reconciliation, and any gate over them.
- Any other documentation cleanup.
