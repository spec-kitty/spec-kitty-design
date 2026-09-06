# Mission Specification: The LLM Surfaces Point at the ADR Index, and Are Gated

**Mission Branch**: `mission/llms-adr-index-pointer-and-gate`
**Created**: 2026-09-06
**Status**: Draft
**Mission**: documentation
**Input**: GitHub issue spec-kitty/spec-kitty-design#197 — "[docs] llms.txt and llms-full.txt are a
third and fourth ADR index, both stale and ungated."

## Adaptation note (docs mission with one code deliverable)

The `documentation` mission template's Divio framing (tutorial / how-to / reference / explanation)
does not describe this work, exactly as #193's mission recorded. The deliverable is two edited
**agent-facing context files** plus one **gate script**. So:

- "Documentation consumers" below are read as the agents these two files exist for: an LLM that
  cannot browse the repo and reads `llms.txt` / `llms-full.txt` to learn what the design system
  decided and why.
- The gate is application-adjacent code (`scripts/`), reviewed as code, wired into `ci-quality.yml`.
- Divio type: **reference** only. No tutorial, how-to or explanation is authored or changed.

## The operator's ruling this mission implements

The operator ruled on issue #197's question 1: **these two files point at the README table instead
of restating it.** The rationale is that three hand-maintained copies of one fact is exactly the
drift #193 measured, and the fix is one owner. A gate is added so that no hand list can exist to
drift.

What that removes is the **index-shaped** claim — any assertion about *which* ADRs exist, *how
many* there are, or *what their statuses are*. What it does not remove is substantive prose that
happens to name a record while explaining a rule: these files exist to give agents that cannot
browse some inline context, and stripping them to bare links would defeat their purpose, which is
not what the ruling asked for.

Applied to the two files that lands differently, because they are different shapes:

- `llms.txt` is a one-line-per-link index. Its ADR entries **are** the index-shaped claim and
  nothing else, so its record links go to **zero** and its ADR entry becomes the pointer.
- `llms-full.txt` is prose. Its per-record summaries are content — each states a decision and its
  rationale — but the set of them is *also* an index, and an index missing one of fifteen records
  is the drift. So the summaries stay and the set is made **complete**, which the gate then holds.
  Its range lines, its directory-map ADR range and its set-wide status claim are index-shaped and
  are replaced by the pointer.

The gate's link rule is written to permit exactly these two landings and nothing between them: the
set of records a surface links **must be empty or complete, never a subset that silently rots**.

## The measurement this mission starts from

Taken independently on `train/elements-first` at `65a92f6`, by extracting every
`docs/architecture/decisions/<file>.md` path from each surface and comparing it to a directory
listing (the same shape the gate uses):

```
records on disk:                                   15
record paths referenced by llms.txt:                3   (ADR-1, ADR-2, ADR-3)
record paths referenced by llms-full.txt:          14   (missing 2026-09-06-14-detached-probe-validation-seam.md)

statuses on disk:  Accepted 9   Proposed 5   Complete 1
```

`llms.txt` describes the directory as **"All Accepted architectural decision records"**, which is
wrong twice: it links three of fifteen, and nine of the fifteen are `Accepted` — five are
`Proposed` and one is `Complete`.

`llms-full.txt` carries three index-shaped range or status claims, none of which #194's ADR-14
updated:

```
llms-full.txt:48   decisions/    # ADRs (ADR-1 through ADR-13 + ADR-3 addendum)
llms-full.txt:81   > **Reading order.** ADR-1 through ADR-7 are the original design and are
llms-full.txt:83   > ADR-8 through ADR-13 are the elements-first architecture and are what the repo
llms-full.txt:89-90  ADRs live under `docs/architecture/decisions/`. Status of every ADR below is
                     **Accepted**.
```

That last one is a set-wide status claim and it is false for six of the fifteen records. It is the
same defect as `llms.txt`'s "All Accepted", in a different shape, and the gate refuses both.

Nothing gates either file: `grep -rn "llms" --include='*.yml' --include='*.mjs' .github/ scripts/`
returns nothing. Confirmed on this tree.

### What #197 said that this mission found to be different

#197 is accurate on every count it states. One thing it does **not** state, found while measuring:
`llms-full.txt:89-90` asserts that the status of *every* ADR it summarises is `Accepted`. That is a
fifth index-shaped claim, in addition to the four #197 enumerates, and it is the one most likely to
mislead an agent — it does not merely omit records, it reports a ratification that did not happen
for six of them. It is in scope here for the same reason `llms.txt`'s "All Accepted" is.

## Scope boundary

**IN SCOPE.** The two agent-facing LLM context surfaces, and a gate over them.

**OUT OF SCOPE — and this boundary is the sharp one.** No ADR record's content or Status is edited.
`git rev-parse <ref>:docs/architecture/decisions` must return the same tree hash
(`038374d6335eefc88d849b53069bdd40d09aa406`) on both sides of this mission. `docs/architecture/
README.md`'s ADR table and `scripts/check-adr-index.mjs` are owned by #193 and gated; neither is
touched. No architectural decision is made: a genuine fork is filed as an issue with the
measurement attached.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - An agent that cannot browse reads `llms.txt` to find the decisions (Priority: P1)

These two files exist for exactly one consumer: a model with no repository access, given the file
as context. Today `llms.txt` tells that model that the decision directory holds "All Accepted
architectural decision records" and then names three of them. A model that trusts it concludes the
system has three decisions, all ratified. It has fifteen, six of them unratified.

**Why this priority**: the failure is not a missing link, it is a **confidently wrong** statement
delivered to a reader who cannot check it. That is worse than silence.

**Independent Test**: `llms.txt` references zero individual records and one pointer to the
authoritative index; a reader following the pointer reaches a table gated against the directory.

**Acceptance Scenarios**:

1. **Given** the edited `llms.txt`, **When** an agent looks for the decision record set, **Then**
   it finds one pointer to `docs/architecture/README.md`'s table and no partial list.
2. **Given** the edited `llms.txt`, **When** an agent looks for a claim about ratification state,
   **Then** there is none to find — status is reported only by the record and its index row.

---

### User Story 2 - An agent reads `llms-full.txt` for the architecture without leaving the file (Priority: P1)

`llms-full.txt` is the deep-context bundle. Its §2 summarises each decision inline so a model can
reason about the system in one read. That content is the file's whole point, and it is kept.

**Why this priority**: the fix for an index that omits a record is not to delete the content, it is
to stop the file claiming to be an index while omitting one. The summaries become content held to
completeness by a gate rather than an index held to nothing.

**Independent Test**: every record in `docs/architecture/decisions/` is referenced by path from
`llms-full.txt`, and no range, count or set-wide status expression remains in it.

**Acceptance Scenarios**:

1. **Given** the edited `llms-full.txt`, **When** the set of referenced record paths is compared
   to the directory, **Then** the two sets are equal — fifteen and fifteen.
2. **Given** the edited `llms-full.txt`, **When** an agent reads §2's preamble, **Then** it is told
   that `docs/architecture/README.md`'s table is authoritative for the set and for each status,
   and §2 makes no claim of its own about either.
3. **Given** the reading-order guidance that today is expressed as two ADR ranges, **When** it is
   rewritten, **Then** the substance survives (the earlier records name Angular; nothing in the
   repo targets Angular; where two records disagree the later wins) without a range expression.

---

### User Story 3 - A later mission adds ADR-15 and forgets these two files (Priority: P1)

This is the recurrence, and it has already happened once: #194 added ADR-14 and updated the README
row, and neither LLM surface moved. Four days later #197 was filed.

**Why this priority**: fixing the instance without closing the class means filing #197 again in a
month. #193 shipped the pattern; this applies it one surface over.

**Independent Test**: add a record to `decisions/` and run the gate; it reds naming the file and
the surface that no longer covers it. Reintroduce a range expression; it reds naming the line.
Delete the pointer; it reds naming the file.

**Acceptance Scenarios**:

1. **Given** a new record with no reference in `llms-full.txt`, **When** the gate runs, **Then** it
   exits non-zero, names the record, and says the set must be empty or complete.
2. **Given** a range expression reintroduced into either surface, **When** the gate runs, **Then**
   it exits non-zero and quotes the offending line.
3. **Given** the pointer removed from either surface, **When** the gate runs, **Then** it exits
   non-zero and states what the pointer must contain.
4. **Given** a set-wide cardinality or status claim ("all ADRs", "every ADR", "15 ADRs"), **When**
   the gate runs, **Then** it exits non-zero and quotes the line.

---

### User Story 4 - The gate itself is emptied, disarmed, or unwired (Priority: P1)

A check that scans zero files and prints green is the defect it exists to prevent. This repo has
hit that class repeatedly and says so in-tree, and #193's gate was itself found to have a probe
table that could not tell which check had fired.

**Why this priority**: a gate nobody has watched fail is not evidence.

**Independent Test**: `--selftest` feeds every check a synthetic defect, asserts each probe trips
**its own** check by expected-message, and asserts a floor on the probe count. Deleting the gate's
CI step reds `scripts/check-gate-wiring.mjs`.

**Acceptance Scenarios**:

1. **Given** a zero-length record list, **When** the gate runs, **Then** it fails rather than
   certifying a link set against nothing.
2. **Given** a surface file that does not exist, **When** the gate runs, **Then** it fails rather
   than skipping it.
3. **Given** an emptied pattern set or an emptied surface list, **When** the gate runs, **Then** it
   fails rather than finding no defects in nothing.
4. **Given** the gate's CI step deleted from `ci-quality.yml`, **When** `check-gate-wiring.mjs`
   runs, **Then** it exits non-zero naming the missing step.
5. **Given** the mission's own PR, **When** CI runs, **Then** the step is confirmed to have
   executed from the **job API**, not from a path-filter reading.

### Edge Cases

- A record path written with an anchor, a query suffix, or wrapped in backticks rather than a
  markdown link. All three are references and all three count toward the set.
- A record path split across a line break by prose wrapping. `llms-full.txt` already wraps at 80
  columns; the extractor must see a path only when it is contiguous, and the mission must therefore
  keep every record path on one line.
- A range expression written with an en dash and no spaces (`ADR-8–13`) versus a title dash with
  spaces (`ADR-7 — Storybook 10.x Adoption`). The first is a range; the second is a heading, and a
  gate that reds on the second is a gate someone deletes.
- Substantive prose naming specific records without claiming to enumerate them —
  `llms-full.txt:73`'s "points at the ADRs (ADR-001 token-only CSS, ADR-002 dependency direction,
  ADR-003 token schema)" explains a rule. It stays, and the gate must not trip on it.
- `llms-full.txt:52`'s `behaviour id registry (ADR-11) — 15 ids, 14 applicable` is a count of
  behaviour ids, not of ADRs. The gate must not trip on it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `llms.txt` MUST NOT link or reference any individual file under
  `docs/architecture/decisions/`. Its ADR entry MUST be a pointer to `docs/architecture/README.md`.
- **FR-002**: `llms.txt` MUST NOT describe the decision directory with a status or cardinality
  claim. "All Accepted architectural decision records" is removed.
- **FR-003**: `llms-full.txt` MUST reference every record in `docs/architecture/decisions/` by
  path, or none. On this tree that means all fifteen: a summary for ADR-14 is added in the shape
  the other summaries use.
- **FR-004**: `llms-full.txt` MUST NOT contain an ADR range expression. The directory-map line and
  the two reading-order range clauses are rewritten to keep their substance without one.
- **FR-005**: `llms-full.txt` MUST NOT assert a status over the ADR set. `Status of every ADR below
  is **Accepted**` is replaced by a pointer to the index that transcribes each record's own.
- **FR-006**: Both surfaces MUST carry a pointer line that names `docs/architecture/README.md`,
  names ADRs, and marks that table as **authoritative**.
- **FR-007**: A gate script MUST assert FR-001 and FR-003 as one rule: for each surface, the set of
  referenced records is either empty or exactly equal to the directory listing.
- **FR-008**: The gate MUST assert FR-004 — no ADR range expression in either surface — with a
  named pattern set, and MUST NOT trip on a title dash or on substantive prose naming records.
- **FR-009**: The gate MUST assert FR-002 and FR-005 — no set-wide cardinality or status claim
  about ADRs in either surface.
- **FR-010**: The gate MUST assert FR-006 — the pointer is present in both surfaces.
- **FR-011**: The gate MUST fail closed on every empty set: zero records discovered, a surface file
  missing, an empty surface list, or an empty pattern set.
- **FR-012**: The gate MUST refuse a reference to a `decisions/` file that does not exist.
- **FR-013**: The gate's checks MUST be exported pure functions over parsed inputs, and it MUST
  carry a `--selftest` probe table in which **each probe declares the message it expects**, so a
  probe satisfied by a neighbouring check is a failure.
- **FR-014**: The gate MUST be an `[ENFORCED]` step of `ci-quality.yml`'s `lint-code` job — the one
  job with no `if:` and no path filter, so a docs-only PR is certain to run it.
- **FR-015**: The gate and its `--selftest` MUST both be registered in `check-gate-wiring.mjs`'s
  `REQUIRED_LINT`, matching the two-entry shape #193 and #129 used.
- **FR-016**: No ADR record's content or Status MAY be modified. No line of
  `docs/architecture/README.md` or `scripts/check-adr-index.mjs` MAY be modified.

### Non-Functional Requirements

- **NFR-001**: The gate's checks are pure functions over parsed inputs, so `--selftest` feeds them
  synthetic defects without touching the filesystem — the shape `check-release-graph.mjs`,
  `build-react-wrappers.mjs` and `check-adr-index.mjs` already use.
- **NFR-002**: Every deliberate failure — one per check, plus the unwiring — is observed and its
  output recorded verbatim before the mission closes. A gate observed green on a healthy tree has
  demonstrated nothing.
- **NFR-003**: The gate must not be defeatable by the collateral-trip defect #193 found and fixed:
  each probe isolates its own check via an expected-message assertion, and the probe-count floor is
  asserted so a silently emptied table is itself a failure.

### Constraints

- Commit type/scope enum is `[tokens storybook doctrine ci docs release deps security styles
  elements react]`; `docs(adr)` and `docs(specs)` are rejected. Headers ≤100 chars.
- The PR bases on `train/elements-first`. A PR based on anything else runs zero gates.
- `spec-kitty plan` emits `Update generator config for feature <slug>`, already exempted in
  `commitlint.config.cjs`. It is not reworded and no new exemption is added.

### Key Entities

- **ADR record**: a `.md` file in `docs/architecture/decisions/`. The source of truth for every
  index over it. Not edited by this mission.
- **Surface**: `llms.txt` or `llms-full.txt` — a hand-maintained agent-facing context file.
- **Reference**: an occurrence of `docs/architecture/decisions/<file>.md` in a surface, whether as
  a markdown link, a bare path, or a backticked path.
- **Pointer**: a line in a surface naming `docs/architecture/README.md`, naming ADRs, and marking
  that table authoritative.
- **The gate**: `scripts/check-llms-adr-surface.mjs`, run from `lint-code` in `ci-quality.yml`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `llms.txt` references **0** records (from 3); `llms-full.txt` references **15**
  (from 14). Measured by the gate, printed by the gate.
- **SC-002**: Zero ADR range expressions in either surface (from 3 in `llms-full.txt`).
- **SC-003**: Zero set-wide ADR status or cardinality claims in either surface (from 1 in each).
- **SC-004**: `node scripts/check-llms-adr-surface.mjs` exits 0 on the edited tree and prints the
  per-surface reference counts it examined.
- **SC-005**: `node scripts/check-llms-adr-surface.mjs --selftest` trips every probe against **its
  own** expected message and asserts the probe-count floor.
- **SC-006**: Each of the deliberate defects — a range expression, a partial link list, a missing
  pointer, a cardinality claim, an empty record set — is reintroduced in turn and the gate's
  verbatim output is recorded.
- **SC-007**: With the gate's CI step deleted, `node scripts/check-gate-wiring.mjs` exits non-zero
  naming it; output recorded verbatim.
- **SC-008**: The `[ENFORCED]` step is confirmed to have run on this PR **from the job API**.
- **SC-009**: `git rev-parse HEAD:docs/architecture/decisions` equals
  `038374d6335eefc88d849b53069bdd40d09aa406`, the value on `train/elements-first@65a92f6`.
- **SC-010**: `git diff origin/train/elements-first...HEAD --name-only` lists no entry under
  `docs/architecture/` and does not list `scripts/check-adr-index.mjs`.
- **SC-011**: `npx commitlint --from origin/train/elements-first --to HEAD` passes, and every
  header on the branch is re-read against the enum.

### Quality Gates

- `node scripts/check-adr-index.mjs` and its `--selftest` still pass unchanged.
- No relative or absolute link introduced into either surface 404s against the tree.
- The squad trail (`.kittify/evidence/`, `kitty-ops/`) is committed.

## Assumptions

- **ASM-001**: `docs/architecture/decisions/` contains only ADR records, so the directory listing
  is the complete record set. Inherited from #193's ASM-001 and unchanged.
- **ASM-002**: `lint-code` has no `if:` guard and no path filter, so it runs on a docs-only PR —
  to be confirmed against the actual run per SC-008, not by reading the workflow.
- **ASM-003**: Keeping `llms-full.txt`'s per-record summaries and completing the set is what the
  ruling's "point at the README table instead of restating it" permits, because the gate it asks
  for is specified as *empty or complete*. If the operator meant §2 deleted outright, that is a
  smaller diff on top of this one and the gate already accepts it (the empty branch).

## Out of Scope

- Editing any ADR's content, Status, title or filename.
- `docs/architecture/README.md` and `scripts/check-adr-index.mjs` — #193 owns both and they are
  gated.
- Any other `llms.txt` / `llms-full.txt` content: the token catalogue, the component manifest, the
  gates section, the recipes. Only the ADR-index-shaped claims move.
- Generating either surface from the directory. The ruling is *point at the index*, not *build a
  fourth generated copy of it*; a generator would be a fourth index with a build step.
- Deciding anything architectural.
