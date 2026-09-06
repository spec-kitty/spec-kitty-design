# Mission Specification: ADR-9 and ADR-11 Ratification, and sad-lite's Sixth ADR Index

**Mission Branch**: `mission/adr-9-11-ratification`
**Created**: 2026-09-06
**Status**: Draft
**Mission**: documentation
**Input**: GitHub issues spec-kitty/spec-kitty-design#200 (operator ruling — ratify ADR-9 and
ADR-11) and #226 (`sad-lite.md` §7 is a sixth hand-written ADR index).

## Adaptation note (docs mission, no code deliverable)

The `documentation` mission template's Divio framing does not describe this work. The deliverables
are (a) two ADR records' `**Status:**` fields moved to `Accepted` under an operator ruling, with
every surface that states those statuses moved with them, and (b) the removal of a second,
ungated ADR index. Divio type: **reference** only. No tutorial, how-to or explanation is authored.
No file under `scripts/`, `packages/` or `expected-stories.json` is touched — a concurrent mission
owns those.

## The measurements this mission starts from

Taken in `/home/jeroennouws/work/ef-adr-1788731737` on `train/elements-first` at `1f95a35`.

### M1 — the two records' own Status fields

```
$ grep -m1 '^\*\*Status' docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md
**Status:** Proposed

$ grep -m1 '^\*\*Status' docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md
**Status:** Proposed. The ADR as a whole remains Proposed; the wrapper prop-name invariant
subsection added 2026-09-06 is ratified under its own operator override (below) independent of
that overall status.
```

### M2 — every surface in the repository that states either record's status

Measured by grepping `Proposed`, `Accepted` and `ratif` across all tracked `.md`, `.txt`, `.yml`
and `.mjs` files and reading each hit:

| Surface | What it says at `1f95a35` |
|---|---|
| `docs/architecture/README.md:34` | ADR-9 row Status cell = `Proposed` |
| `docs/architecture/README.md:36` | ADR-11 row Status cell = `Proposed` |
| `docs/architecture/sad-lite.md:210` | ADR-9 §7 row Status cell = `Accepted` — **already wrong** (#226) |
| `docs/architecture/sad-lite.md:212` | ADR-11 §7 row Status cell = `Accepted` — **already wrong** (#226) |
| `docs/architecture/elements-first-programme.md:125` | M1's "**Ratified:**" note names ADR-10 only |
| `docs/design-system/changelog.md:24-25` | present tense: "ADR-9 is also still `Status: Proposed` while this BREAKING rename rests on it" |
| `llms-full.txt:91-97` | states no statuses by design (#197); points at the README table. **No change needed** |
| `.kittify/charter/charter.md:9,14,46,48` | binds ADR-11's required-behaviours list as a done-condition; states no ADR status |
| `.github/workflows/ci-quality.yml:237,239,477` | three `[ENFORCED]` steps named for ADR-9/ADR-11; state no status |

`CLAUDE.md`, `CHANGELOG.md`, `docs/contributing/adding-a-component.md` and
`docs/design-system/using-components.md` cite ADR-9 or ADR-11 for their *content*; none states a
status. They are out of scope.

### M3 — `sad-lite.md` §7, re-measured *after* the #200 ruling lands

§7 "Architectural Decision Index" (lines 198-216) is a 13-row `ADR | Decision | Status` table
against 15 records on disk.

Wrong Status cells **before** #200: four — ADR-9, 11, 12, 13, each asserting `Accepted` over a
record whose own header reads `Proposed`.

Wrong Status cells **after** #200 (the arithmetic this mission's own first half changes): **two** —
ADR-12 and ADR-13. ADR-9 and ADR-11 become correct by ratification rather than by edit.

Missing rows, unchanged by #200: **two** — ADR-14 (`2026-09-06-14-detached-probe-validation-seam.md`,
Proposed) and the ADR-003 addendum (Complete).

`scripts/check-adr-index.mjs` reads `docs/architecture/README.md` only. §7 is ungated, which is
why the two remaining wrong cells and the two missing rows have never reddened CI.

### M4 — the baseline gate is green before this mission edits anything

```
$ node scripts/check-adr-index.mjs
records:  15 in docs/architecture/decisions
rows:     15 under "## Decisions (ADRs)" in docs/architecture/README.md
✅ ADR index is coherent: 15 record(s), 15 row(s), every row's status transcribed from its record.
$ node scripts/check-adr-index.mjs --selftest
✅ all 22 defect probes tripped their own check and all 10 healthy shapes passed.
```

That the gate is green *now* is what makes it proof later: the record and its row must move in the
same commit or it reds.

## The two rulings this mission implements, and what it may not decide

**#200 is an operator ruling, quoted verbatim on the issue.** Ratify ADR-9 and ADR-11; move both
to `Accepted`. The reasoning recorded with the chosen option is that three `[ENFORCED]` CI jobs
(`ci-quality.yml:237`, `:239`, `:477`) and two charter done-conditions (`charter.md:9`, `:14`)
already treat both as binding, so this aligns the record with what CI enforces and leaves
`Proposed` meaning *not yet enforced*. **The stated downside is that it ratifies by observation
rather than by review, and that must be visible in what this mission writes.** Options declined:
redefining `Proposed` as binding-unless-superseded; removing the ENFORCED jobs; binding only the
specific behaviours a gate names.

**#226 offers three options.** Option 1 — delete §7's index and point at the gated table — is the
shape this repository has converged on three times (`elements-first-programme.md:5`,
`llms.txt`/`llms-full.txt` under #197, `sad-lite.md:10` under #201). One index, one gate. Option 2
(generalise `check-adr-index.mjs` over a list of `(file, heading)` pairs) is defensible but touches
`scripts/`, which a concurrent mission owns; **if this mission concludes option 2 is right it stops
and reports rather than doing it.** Option 3 (correct the cells, leave it ungated) is what produced
the issue.

**Nothing else architectural is decided here.** A genuine fork found while doing this is filed as
an issue with the measurement attached.

## ADR-11's layered ratification claim — the thing that is not a simple swap

ADR-11's Status field currently carries two claims at once: the ADR *as a whole* is `Proposed`,
and the wrapper prop-name invariant subsection added 2026-09-06 is *separately ratified* under its
own operator override, "independent of that overall status" (issue #189).

The #189 override is two distinct things layered in one sentence:

1. **Authorization to write the amendment.** ADRs are ordinarily written only in #67, which is
   closed; the operator authorized amending ADR-11 for #189 the way #176 authorized amending
   ADR-10. This is an *authorship* authorization, and it stays true whatever the record's status.
2. **Ratification of that subsection ahead of the whole record.** This is what made the split
   status necessary — a ratified part inside an unratified whole.

Once #200 ratifies the whole, claim (2) is subsumed: there is nothing left for the subsection's
ratification to be independent *of*. Leaving both in place layers two ratification claims on one
another and invites a reader to conclude that some *other* part of the record is still Proposed.

**Resolution.** The Status field states one status — `Accepted` under #200 — and says in one
sentence that it replaces the split status and that the subsection's separate ratification is
subsumed by it. Claim (1) is preserved untouched in the three places that already carry it: the
`**Deciders:**` line, the "Operator override, recorded for the record" paragraph in the subsection
body, and the `Amended by #189` bullet under **More Information**. Nothing about #189 is deleted.

## What happens to §7's `Superseded by ADR-013` cells

§7 carries two cells the gated README table does not use, because that table transcribes each
record's own Status and neither ADR-6 nor ADR-7 says `Superseded`:

| §7 row | §7's Status cell | the record's own `**Status:**` |
|---|---|---|
| ADR-006 | `Superseded by ADR-013` | `Accepted` |
| ADR-007 | `Superseded on the framework question by ADR-013` | `Accepted` |

**Disposition: preserved, verified before deletion, and signposted — not dropped, not invented.**
Both claims already exist, in prose, on surfaces that outlive §7:

- `llms-full.txt:200-205` states both halves, including the ADR-7 half: *"ADR-6 and ADR-7 are
  superseded on the framework question … summarised above as the record of why the catalogue looks
  as it does, not as current guidance."* That surface is held by `scripts/check-llms-adr-surface.mjs`.
- `docs/architecture/decisions/2026-09-02-13-storybook-web-components-builder.md:6` and `:98` state
  the ADR-6 half from ADR-13's own record.
- `docs/architecture/system-context-canvas.md:130` records the ADR-6 half as a discharged assumption.

The §7 replacement note names `llms-full.txt` explicitly, so the editorial content is reachable
from where it used to live. **No record's Status field is edited to say `Superseded`** — ADR-13
supersedes ADR-6 by its own text and does not name ADR-7 at all, so writing `Superseded` into
either record would be inventing a status, which #226 forbids and which the gate would then
faithfully transcribe.

## The withdrawn "what Proposed obliges" sentence, reintroduced deliberately

A draft of #199 asserted, across three surfaces, that *"only **Accepted** records bind … a
**Proposed** record … does not constrain"*. It was **withdrawn** as a governance decision that
mission could not make; the withdrawal is recorded in #200 and in #199's evidence.

With the #200 ruling the claim becomes true, so this mission reintroduces it — **written fresh,
citing #200, and never restored from the withdrawn text or its provenance.** Two constraints on
the wording:

- The ruling leaves `Proposed` meaning *"not yet enforced"*. The wording must not imply a Proposed
  record is a draft nobody consults — the charter's `architectural_review_requirement` still
  obliges a mission to read the records governing its work, whatever their status.
- The by-observation downside is stated where the claim is, not hidden in a commit message.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A reader checks whether ADR-9 binds the work in front of them (Priority: P1)

Today `docs/architecture/README.md` says `Proposed` for ADR-9 while `ci-quality.yml` runs two
`[ENFORCED]` steps named for it and `sad-lite.md` §7 says `Accepted`. Three surfaces, three
answers.

**Why this priority**: this is the whole of #200. A reader cannot act on a record whose recorded
status contradicts the CI that enforces it.

**Independent Test**: read the record, the README row and §7's replacement; all three agree, and
`node scripts/check-adr-index.mjs` exits 0.

**Acceptance Scenarios**:

1. **Given** the ratified tree, **When** a reader greps `**Status:**` in ADR-9 and ADR-11,
   **Then** both read `Accepted`, each naming the operator, the date `2026-09-06`, and #200.
2. **Given** the ratified tree, **When** `check-adr-index.mjs` runs, **Then** it exits 0 — the
   rows moved in the same commit as the records.
3. **Given** a reader who wants to know what a status *obliges*, **When** they read the README's
   ADR section preamble, **Then** they find one statement covering both `Accepted` and `Proposed`,
   citing #200, and recording that the ratification was by observation.

---

### User Story 2 — An agent looks up an ADR's status and lands in `sad-lite.md` (Priority: P1)

`sad-lite.md` is the document the architecture README calls *"Start here."* §7 is a second ADR
index, ungated, missing two records, and — after #200 — still wrong about ADR-12 and ADR-13.

**Why this priority**: an index the repo does not hold to the directory drifts, and this one has.
Correcting the cells and leaving it ungated (#226 option 3) is what produced the issue.

**Independent Test**: `grep -c '^| \[ADR' docs/architecture/sad-lite.md` returns 0. The only
`ADR | … | Status` table left in the repository is the gated one.

**Acceptance Scenarios**:

1. **Given** the edited `sad-lite.md`, **When** §7 is read, **Then** it carries no ADR table and
   points at the README's gated table.
2. **Given** the edited `sad-lite.md`, **When** a reader looks for the ADR-6/ADR-7 supersession,
   **Then** §7's replacement note tells them where it is recorded.
3. **Given** the edited `sad-lite.md`, **When** section numbering is checked, **Then** §8 and §9
   still carry the numbers they carried before — the heading is kept, its index is not.

---

### User Story 3 — A reader of the design-system changelog checks a claim it makes about ADR-9 (Priority: P2)

`docs/design-system/changelog.md:24-25` says, in the present tense, "ADR-9 is also still
`Status: Proposed` while this BREAKING rename rests on it." That sentence becomes false the moment
#200 lands.

**Why this priority**: it is a direct consequence of this mission's own edit, not unrelated docs
cleanup. Leaving it is shipping a known-false statement.

**Independent Test**: `grep -n 'still .Status: Proposed' docs/design-system/changelog.md` returns
nothing, and the entry still records why the rename was a concern when it was made.

**Acceptance Scenarios**:

1. **Given** the edited changelog, **When** the entry is read, **Then** it records that ADR-9 was
   `Proposed` when the rename landed **and** that #200 has since ratified it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `2026-09-02-9-shadow-dom-and-styling-api.md`'s `**Status:**` MUST read `Accepted`,
  in the form the already-ratified records use — `Accepted (ratified by the operator, <date>)` —
  naming 2026-09-06 and the #200 ruling.
- **FR-002**: `2026-09-02-11-verification-stack-and-wrapper-generation.md`'s `**Status:**` MUST
  read `Accepted` and MUST state exactly one status. The split "whole is Proposed / subsection is
  separately ratified" construction MUST be resolved rather than left standing beside the new one.
- **FR-003**: #189's *authorship* authorization MUST survive FR-002 intact — the `**Deciders:**`
  line, the subsection's "Operator override, recorded for the record" paragraph, and the
  `Amended by #189` bullet under **More Information** are not deleted or weakened.
- **FR-004**: `docs/architecture/README.md`'s ADR-9 and ADR-11 rows MUST read `Accepted`, changed
  in the same commit as FR-001/FR-002.
- **FR-005**: `node scripts/check-adr-index.mjs` MUST exit 0 on the finished tree, and
  `--selftest` MUST still trip all 22 probes.
- **FR-006**: The README's ADR section MUST carry a statement of what each status obliges, written
  fresh for this mission and citing #200. It MUST say that `Accepted` binds, that `Proposed` is
  not yet enforced and therefore does not by itself constrain a spec, that a Proposed record is
  still consulted under the charter's `architectural_review_requirement`, and that #200 ratified
  by observation rather than by review.
- **FR-007**: The withdrawn #199 text MUST NOT be restored verbatim, and its provenance MUST NOT
  be cited as authority. #200's ruling is the only authority named.
- **FR-008**: `elements-first-programme.md`'s M1 "**Ratified:**" note MUST name ADR-9 and ADR-11
  alongside ADR-10.
- **FR-009**: `elements-first-programme.md:5`'s status guidance MUST state the `Proposed` half of
  FR-006 as well as the `Accepted` half it already states, or point at the README statement.
- **FR-010**: `sad-lite.md` §7's 13-row ADR table MUST be removed and replaced with a pointer to
  the gated README table, following `sad-lite.md:10`'s own precedent in the same file.
- **FR-011**: §7's heading and number MUST be kept, so §8 and §9 are not renumbered and no
  in-repository reference is broken.
- **FR-012**: The §7 replacement MUST record what became of the `Superseded by ADR-013` cells and
  name at least one surface where that content is preserved.
- **FR-013**: No ADR record's Status MAY be written as `Superseded`. ADR-6's and ADR-7's Status
  fields are not edited by this mission.
- **FR-014**: ADR-12, ADR-13 and ADR-14 MUST remain `Proposed`. #200 ratifies two records, not
  five.
- **FR-015**: `docs/design-system/changelog.md`'s present-tense claim that ADR-9 "is also still
  `Status: Proposed`" MUST be corrected, minimally, without rewriting the entry around it.
- **FR-016**: No file under `scripts/`, `packages/`, or `expected-stories.json` MAY be modified.
- **FR-017**: No new ADR index MAY be created anywhere.

### Non-Functional Requirements

- **NFR-001**: Every status claim written by this mission is verified against the record's own
  header at the time of writing, not against another index.
- **NFR-002**: The #200 downside — ratification by observation — is legible to a reader of the
  finished documents, not only to a reader of this spec.

### Constraints

- Commit type/scope enum is exactly `[tokens storybook doctrine ci docs release deps security
  styles elements react]`. `docs(adr)` and `docs(specs)` are REJECTED — use unscoped `docs:`.
  Headers ≤100 chars. Verified with
  `npx commitlint --from origin/train/elements-first --to HEAD`.
- The PR bases on `train/elements-first`. Any other base runs zero gates and still looks green.
- Another session merges to this train constantly. Re-fetch before finishing; rebase if it moved,
  and regenerate any generated artefact cache-free (`--skip-nx-cache`) rather than hand-merging.
- A concurrent mission owns `scripts/`, `packages/` and `expected-stories.json`.

### Key Entities

- **ADR record** — a `.md` file directly under `docs/architecture/decisions/`, carrying a
  `**Status:**` field. The source of truth for every index.
- **The gated index** — the table under `## Decisions (ADRs)` in `docs/architecture/README.md`,
  held to the directory in both directions, including Status, by `scripts/check-adr-index.mjs`.
- **§7** — `sad-lite.md`'s second, ungated ADR index. Deleted by this mission.
- **The #189 override** — an authorship authorization plus a subsection ratification, layered in
  ADR-11's Status field. Unlayered by this mission.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `grep -m1 '^\*\*Status' ` on ADR-9 and ADR-11 both return a line whose first
  comparable word is `Accepted`. Before: `Proposed` for both.
- **SC-002**: `docs/architecture/README.md` rows for ADR-9 and ADR-11 read `Accepted`; the other
  13 rows are byte-identical to `1f95a35`.
- **SC-003**: `node scripts/check-adr-index.mjs` exits 0, reporting 15 records and 15 rows;
  `--selftest` reports 22 probes tripped and 10 healthy shapes passed.
- **SC-004**: `grep -c '^| \[ADR' docs/architecture/sad-lite.md` returns **0**. Before: **13**.
- **SC-005**: `grep -rn 'Superseded' docs/architecture/decisions/` returns no `**Status:**` line.
- **SC-006**: ADR-12, ADR-13, ADR-14 Status fields are byte-identical to `1f95a35`.
- **SC-007**: `git diff --name-only origin/train/elements-first...HEAD` lists no path under
  `scripts/`, `packages/`, and does not list `expected-stories.json`.
- **SC-008**: `npx commitlint --from origin/train/elements-first --to HEAD` exits 0.
- **SC-009**: The PR's base ref is `train/elements-first`, confirmed from the PR API, and its CI
  run includes the job carrying `check-adr-index.mjs` — confirmed from the run's job list, not
  from reading path filters.

### Quality Gates

- No broken relative link is introduced in any edited document.
- Heading hierarchy and section numbering in `sad-lite.md` are unchanged.
- The mission trail (`kitty-specs/`, `.kittify/evidence/`, `kitty-ops/`) is committed.

## Assumptions

- **ASM-001**: `docs/design-system/changelog.md` is not owned by the concurrent mission, whose
  surface is `scripts/`, `packages/` and `expected-stories.json`.
- **ASM-002**: `llms-full.txt` needs no edit: #197 already removed status reporting from it, and
  its ADR-6/ADR-7 supersession note is prose about content, not a status claim.
- **ASM-003**: `.kittify/charter/charter.md` needs no edit: it binds ADR-11's behaviour list as a
  done-condition and states no ADR status. Charter changes go through the CLI, never by hand.

## Out of Scope

- Ratifying, editing or re-statusing any record other than ADR-9 and ADR-11.
- #226 option 2 — generalising `check-adr-index.mjs` over `(file, heading)` pairs. If that turns
  out to be the right answer, the mission stops and reports.
- Writing a `Superseded` status into ADR-6 or ADR-7.
- ADR-12's and ADR-13's `Proposed` status, and the four ADR-12/13 cells §7 asserted — removed with
  §7 rather than corrected in it.
- Any documentation cleanup not named in an FR above.
