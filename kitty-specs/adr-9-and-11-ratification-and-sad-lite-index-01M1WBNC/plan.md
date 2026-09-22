# Implementation Plan: ADR-9 and ADR-11 Ratification, and sad-lite's Sixth ADR Index

**Mission**: `adr-9-and-11-ratification-and-sad-lite-index-01M1WBNC`
**Branch**: `mission/adr-9-11-ratification`
**Base**: `train/elements-first` @ `1f95a35`
**Spec**: [spec.md](spec.md)
**Input issues**: spec-kitty/spec-kitty-design#200 (operator ruling), #226

## Summary

Two ADR records move from `Proposed` to `Accepted` under an operator ruling, and every surface in
the repository that states either status moves with them in the same commit. Separately, a second
ADR index — `sad-lite.md` §7, ungated and wrong — is removed and replaced by a pointer to the one
index CI holds to the directory.

The two halves are ordered, not parallel: **#200 changes #226's arithmetic.** Before ratification
§7 has four wrong Status cells; after it, two. §7 is re-measured after the first half lands, and
then deleted, so no step in this mission works from the issue's stale table.

## Technical Context

**Documentation Framework**: None. Plain Markdown under `docs/`, rendered on GitHub.
**Output Format**: Markdown.
**Hosting Platform**: The repository itself; the Storybook build does not carry these documents.
**Generators**: none applicable. `spec-kitty plan` detected `jsdoc` from the repository's
JavaScript; no generated documentation is produced or consumed by this mission.
**Theme**: n/a.

**The one machine check that matters.** `scripts/check-adr-index.mjs` holds
`docs/architecture/README.md`'s ADR table to `docs/architecture/decisions/` in both directions,
*including Status*: "a row's **Status** disagrees with the record's own" is one of its three
failure modes. It is green at `1f95a35` (15 records, 15 rows). That makes it the proof this
mission needs and the trap it must not spring: a record edited without its row, or a row edited
without its record, reds CI. Both move in one commit.

**The gate is read, not modified.** `scripts/` is owned by a concurrent mission. This plan runs
`check-adr-index.mjs`; it does not touch it. #226's option 2 would require editing it, and the
spec's exit condition applies: conclude option 2, stop and report.

**Commit discipline.** Type/scope enum: `[tokens storybook doctrine ci docs release deps security
acceptance merge team-overview styles elements react]`, verified by reading
`commitlint.config.cjs`. **`docs(adr)` and `docs(specs)` are rejected** — `adr` and `specs` are
not in the enum. Unscoped `docs:` is used throughout. `subject-case` forbids upper-case,
pascal-case and start-case subjects. Headers ≤100 chars.

## Project Structure

### Documentation (this mission)

```
kitty-specs/adr-9-and-11-ratification-and-sad-lite-index-01M1WBNC/
├── spec.md                  # the two rulings, the measurements, FR-001..FR-017
├── plan.md                  # this file
├── tasks.md                 # work-package manifest
└── tasks/
    ├── WP01-ratify-adr-9-and-adr-11.md
    └── WP02-remove-sad-lite-second-adr-index.md
```

### Documentation Files (repository)

Files this mission writes:

| Path | Why |
|---|---|
| `docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md` | FR-001 — Status |
| `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md` | FR-002, FR-003 — Status, layered claim |
| `docs/architecture/README.md` | FR-004 rows; FR-006 the status-obligation statement |
| `docs/architecture/elements-first-programme.md` | FR-008 M1 ratification note; FR-009 status guidance |
| `docs/architecture/sad-lite.md` | FR-010, FR-011, FR-012 — §7 |
| `docs/design-system/changelog.md` | FR-015 — one false present-tense clause |

Files deliberately **not** written, each with the reason:

| Path | Why not |
|---|---|
| `scripts/**` | concurrent mission owns it; the gate is run, not edited |
| `packages/**`, `expected-stories.json` | concurrent mission owns them |
| `llms.txt`, `llms-full.txt` | #197 already removed status reporting; the ADR-6/7 supersession note there is content, not a status claim |
| `.kittify/charter/charter.md` | binds ADR-11's behaviour list, states no status; charter changes go through the CLI |
| `.github/workflows/ci-quality.yml` | the three `[ENFORCED]` steps name ADR-9/ADR-11 for content; they state no status |
| `docs/architecture/decisions/*-12-*`, `*-13-*`, `*-14-*` | FR-014 — #200 ratifies two records, not five |
| `docs/architecture/decisions/2026-05-01-6-*`, `2026-05-01-7-*` | FR-013 — no invented `Superseded` status |
| `CLAUDE.md`, `CHANGELOG.md`, `docs/contributing/**`, `docs/design-system/using-components.md` | cite ADR-9/ADR-11 for content; state no status |

## Phase 0: Research

### Objective

Establish, by reading primary sources rather than indexes, (a) the exact current Status text of
both records, (b) the complete set of surfaces stating either status, and (c) whether §7's
`Superseded` cells carry content that exists nowhere else.

### Research Tasks

**R1 — the records' own headers.** `grep -m1 '^\*\*Status'` over all 15 records. Result: nine
`Accepted`, five `Proposed` (ADR-9, 11, 12, 13, 14), one `Complete` (the addendum). ADR-11's is
not a bare token — it is a two-clause sentence separating the record from a subsection.

**R2 — the surface sweep.** `grep -rn` for `Proposed|Accepted|ratif` across tracked `.md`, `.txt`,
`.yml`, `.mjs`, each hit read rather than counted. Recorded as spec §M2. Two findings the issue
did not name: `elements-first-programme.md:125` ("**Ratified:** ADR-10's Status is …") is a
ratification roll-call that will be incomplete after this mission, and
`docs/design-system/changelog.md:24-25` asserts ADR-9's `Proposed` status **in the present tense**
and becomes false on this change.

**R3 — the ratified-record form.** ADR-8 and ADR-10 both read
`**Status:** Accepted (ratified by the operator, 2026-09-02)`. ADR-10's `**Deciders:**` line
additionally records which sub-rulings were ratified when. This mission follows that form rather
than inventing one, so the gate's "status qualified with prose after the token" case (a probe it
already carries as a *healthy* shape) applies.

**R4 — is §7's `Superseded` content recoverable?** Yes, and verified before deleting anything:

| Claim | Where else it lives |
|---|---|
| ADR-6 superseded by ADR-13 | `decisions/2026-09-02-13-…md:6` (Technical Story) and `:98` (More Information); `system-context-canvas.md:130` |
| ADR-7 superseded *on the framework question* | `llms-full.txt:200-205`, which states both halves in prose |

ADR-13 does **not** name ADR-7. So the ADR-7 half exists only in `llms-full.txt` — which is a
gated surface (`scripts/check-llms-adr-surface.mjs`) and is where the §7 replacement note points.
Writing `Superseded` into ADR-7's own header would manufacture a ruling ADR-13 never made; FR-013
forbids it.

**R5 — is §7 gated or linked?** No. `grep -rn 'sad-lite'` over `scripts/`, `.github/` and the JSON
manifests returns one hit, inside `check-llms-adr-surface.mjs`'s selftest fixture text. No
document anchors `#7-architectural-decision-index`. Deletion breaks nothing; keeping the heading
(FR-011) keeps §8 and §9 at their numbers anyway.

### Research Output

Recorded in spec.md §§M1-M4 and in the disposition sections. No separate research document is
authored — every finding is a measurement that belongs in the spec's own tables.

## Phase 1: Design

### Objective

Fix the exact wording of the four judgement calls before any file is edited, so the work packages
transcribe decisions rather than make them.

### Design decision 1 — ADR-9's Status line

```
**Status:** Accepted (ratified by the operator, 2026-09-06 — the #200 ruling)
```

Follows ADR-8/ADR-10's form (R3). Names the authority, so a later reader can find the ruling
without a git blame.

### Design decision 2 — ADR-11's layered ratification claim

The spec sets out why this is not a swap: the current field carries an authorship authorization
and a subsection ratification layered together, and #200 subsumes only the second. The Status
field becomes one status plus one sentence of resolution:

```
**Status:** Accepted (ratified by the operator, 2026-09-06 — the #200 ruling). This replaces a
split status that held the ADR as a whole Proposed while the wrapper prop-name invariant
subsection stood ratified under its own #189 override; with the whole record Accepted that
subsection's separate ratification is subsumed. #189 remains recorded below as the authorization
for *writing* that amendment, which is a different act from ratifying it.
```

The three places recording #189's authorship authorization are left byte-identical (FR-003).
Verified after editing by `grep -n '#189'` returning the same three lines plus the Status line.

### Design decision 3 — the "what a Status obliges" statement (FR-006, FR-007)

Written fresh into `docs/architecture/README.md`'s `## Decisions (ADRs)` section, immediately
after the sentence that already says the index reports statuses rather than conferring them. It
must carry four things: `Accepted` binds; `Proposed` is *not yet enforced* and so does not by
itself constrain a spec; a Proposed record is still read (the charter's
`architectural_review_requirement` is not conditional on status); and #200 ratified **by
observation** — the gates already treated both as binding — rather than by fresh review.

The withdrawn #199 draft is not consulted, quoted or cited. #200's ruling is the only authority
named. This is what "reintroduce, do not restore" means operationally.

`elements-first-programme.md:5` already states the `Accepted` half in its own voice; it gains the
`Proposed` half in one clause and points at the README statement rather than duplicating it, which
is the same one-index discipline this mission is applying to §7.

### Design decision 4 — §7's replacement (FR-010, FR-011, FR-012)

The heading `## 7. Architectural Decision Index` stays; its 13-row table goes. In its place, a
pointer to the gated table and a blockquote note in the shape `sad-lite.md:10` already uses for
the same defect in the same file, recording: that this was a second index, what it was wrong
about (measured *after* #200, so two cells and two missing rows, not four and two), and where the
`Superseded by ADR-013` editorial content is preserved.

### Content Outline

| Surface | Before | After |
|---|---|---|
| ADR-9 `**Status:**` | `Proposed` | `Accepted (ratified by the operator, 2026-09-06 — the #200 ruling)` |
| ADR-11 `**Status:**` | `Proposed.` + split-status sentence | `Accepted (…#200…)` + one resolution sentence |
| `README.md:34` | `Proposed` | `Accepted` |
| `README.md:36` | `Proposed` | `Accepted` |
| `README.md` §Decisions preamble | says the index reports statuses | + what each status obliges (#200) |
| `elements-first-programme.md:5` | `Accepted` half only | + `Proposed` half, pointing at the README |
| `elements-first-programme.md:125` | "ADR-10's Status is Accepted…" | + ADR-9 and ADR-11 under #200 |
| `sad-lite.md` §7 | 13-row table | pointer + note; no table |
| `docs/design-system/changelog.md:24-25` | "ADR-9 is also still `Status: Proposed`" | records it was Proposed then, ratified since (#200) |

### Work Breakdown Preview

Two work packages, strictly sequential — WP02 re-measures §7 against the tree WP01 produced.

- **WP01 — ratify ADR-9 and ADR-11** (FR-001..FR-009, FR-014, FR-016, FR-017). Both records, both
  README rows, the status-obligation statement, both programme-doc surfaces, the changelog clause.
  One commit; `check-adr-index.mjs` green at its tip.
- **WP02 — remove sad-lite's second ADR index** (FR-010..FR-013, FR-016, FR-017). Re-measure §7,
  delete the table, write the replacement note, verify the Superseded content is preserved.

## Phase 2: Implementation

1. WP01, committed as one `docs:` commit; run `check-adr-index.mjs` and `--selftest` at its tip.
2. WP02, committed as one `docs:` commit; re-run both.
3. `npx commitlint --from origin/train/elements-first --to HEAD`.
4. Re-fetch `train/elements-first`. If it moved, rebase; regenerate any generated artefact
   cache-free (`--skip-nx-cache`) rather than hand-merging. This mission produces no generated
   artefact, so a rebase is the whole of it.
5. `gh pr create --base train/elements-first`. Confirm the base ref and the job list from the API.

## Success Criteria Validation

SC-001 and SC-006 are `grep` over the records. SC-002 is `git diff` over `README.md`. SC-003 is
the gate plus its selftest. SC-004 is `grep -c '^| \[ADR' docs/architecture/sad-lite.md` → 0
(before: 13). SC-005 is `grep -rn 'Superseded' docs/architecture/decisions/` showing no
`**Status:**` line. SC-007 is `git diff --name-only origin/train/elements-first...HEAD`. SC-008 is
commitlint. SC-009 is read from the PR and run APIs — the base ref from the PR, the job list from
the run, per the standing instruction to read the job API rather than grep a log.

## Charter Check

- `architectural_review_requirement` — satisfied by construction: this mission's subject *is* the
  ADR record, and both governing issues carry operator rulings. It decides nothing architectural
  of its own; the spec's Out of Scope makes the exit condition explicit.
- Conventional commits via commitlint — planned above, verified in Phase 2 step 3.
- Adversarial squad closes every PR, evidence posted on it before merge — the mission trail under
  `.kittify/evidence/` and `kitty-ops/` is committed with the work.
- Component quality gates (stories, axe, visual diff, ADR-11 behaviour list) — no component,
  token, story or package file is touched, so none applies. This is asserted by SC-007, not
  assumed.

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| The train moves under the mission (it moved four times on 2026-09-06) | Re-fetch before finishing; rebase rather than merge; re-run the gate at the rebased tip |
| A record edited without its row (or the reverse) | Both move in one commit; `check-adr-index.mjs` is run at each WP tip and reds on exactly this |
| Widening into §7's ADR-12/ADR-13 cells as an "easy fix" | They are removed with the table, not corrected in it — correcting them is #226 option 3, which produced the issue |
| Reintroducing #199's withdrawn text by paraphrase-drift | The withdrawn text is never opened; the statement is written from #200's ruling and cites only it |
| Losing §7's `Superseded` editorial content | R4 verifies three surviving surfaces before deletion; the replacement note names one |
| Colliding with the concurrent mission | No path under `scripts/`, `packages/`, or `expected-stories.json` is written; asserted by SC-007 |
