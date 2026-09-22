---
work_package_id: WP01
title: Ratify ADR-9 and ADR-11, and move every surface that states their status
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-014
- FR-015
- FR-016
- FR-017
planning_base_branch: mission/adr-9-11-ratification
merge_target_branch: mission/adr-9-11-ratification
branch_strategy: Planning artifacts for this mission were generated on mission/adr-9-11-ratification. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/adr-9-11-ratification unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
phase: Phase 1 - ratification
history:
- at: '2026-09-06T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: docs/architecture/
create_intent: []
execution_mode: planning_artifact
model: ''
owned_files:
- docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md
- docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md
- docs/architecture/README.md
- docs/architecture/elements-first-programme.md
- docs/design-system/changelog.md
role: implementer
tags: []
task_type: docs
tracker_refs:
- spec-kitty/spec-kitty-design#200
---

# Work Package Prompt: WP01 – Ratify ADR-9 and ADR-11

## Goal

Move ADR-9 and ADR-11 to `Accepted` under the operator's ruling on #200, move every surface in the
repository that states either status in the same commit, and leave the index itself saying what
`Accepted` and `Proposed` oblige — including that this particular ratification was made by
observing the gates rather than by reviewing the records.

## The ruling (do not re-derive it from the discussion)

Quoted on #200: **ratify ADR-9 and ADR-11; move both to `Accepted`.** The reasoning recorded with
the chosen option is that `ci-quality.yml:237`, `:239` and `:477` are `[ENFORCED]` steps named for
these two records, and `charter.md:9` and `:14` bind ADR-11's required-behaviours list as a
done-condition — so the ratification aligns the record with what CI already enforces and leaves
`Proposed` meaning *not yet enforced*. **The stated downside is that it ratifies by observation
rather than by review**, and T005 has to make that visible to a reader of the finished document.

Three options were declined and are not open here: redefining `Proposed` as
binding-unless-superseded, removing the ENFORCED jobs, and binding only the behaviours a gate names.

## Measurement already taken (do not re-derive from the issue text)

On `train/elements-first` @ `1f95a35` — `spec.md` §§M1–M4 carry it in full; re-read the records
rather than trusting this blind:

```
ADR-9   **Status:** Proposed
ADR-11  **Status:** Proposed. The ADR as a whole remains Proposed; the wrapper prop-name
        invariant subsection added 2026-09-06 is ratified under its own operator override
        (below) independent of that overall status.
README.md:34  ADR-9 row  → Proposed
README.md:36  ADR-11 row → Proposed
check-adr-index.mjs → exit 0, 15 records / 15 rows, all statuses agreeing
```

## Subtasks

- **T001** — ADR-9's Status field, in the form ADR-8 and ADR-10 already use
  (`Accepted (ratified by the operator, <date>)`), naming 2026-09-06 and the #200 ruling so a
  later reader finds the authority without a git blame.
- **T002** — ADR-11's Status field. **This is not a swap.** The field currently carries two claims
  layered together: the ADR as a whole is Proposed, and the wrapper prop-name invariant subsection
  is separately ratified under the #189 override "independent of that overall status". #200
  subsumes the second — with the whole record Accepted there is nothing left for the subsection's
  ratification to be independent of, and leaving both standing invites a reader to conclude some
  other part is still Proposed. Write one status, plus one sentence saying what it replaces and
  that the subsection's separate ratification is subsumed, and distinguishing #189's *authorship*
  authorization (still live) from its subsection *ratification* (subsumed).
- **T003** — Verify T002 deleted none of #189's authorship record. It is carried in three places:
  the `**Deciders:**` line, the "Operator override, recorded for the record" paragraph inside the
  subsection, and the `Amended by #189` bullet under **More Information**. All three stay.
- **T004** — `README.md:34` and `:36` → `Accepted`. Same commit as T001/T002 or
  `check-adr-index.mjs` reds by construction. The other 13 rows stay byte-identical.
- **T005** — The "what a Status obliges" statement, into the README's `## Decisions (ADRs)`
  section. **Write it fresh.** A draft of #199 asserted this across three surfaces and was
  *withdrawn* as a governance decision that mission could not make; #200 makes it true, and #200's
  ruling is the only authority to cite. Do not open, quote or cite the withdrawn text or its
  provenance. Four things it must carry: `Accepted` binds (the charter's amendment rule already
  stated beside it); `Proposed` is not yet enforced and so does not by itself constrain a spec;
  a Proposed record is still consulted — `architectural_review_requirement` is not conditional on
  status, and this must not read as "Proposed means a draft nobody reads"; and #200 ratified by
  observation of the gates rather than by fresh review.
- **T006** — `elements-first-programme.md:5` already tells a reader to read the Status column and
  states the `Accepted` half. Add the `Proposed` half in one clause and point at the README
  statement rather than restating it — the same one-index discipline WP02 applies to §7.
- **T007** — `elements-first-programme.md:125` is a ratification roll-call naming ADR-10 only.
  It is incomplete the moment T001/T002 land. Add ADR-9 and ADR-11 under #200.
- **T008** — `docs/design-system/changelog.md:24-25` says, present tense, "ADR-9 is also still
  `Status: Proposed` while this BREAKING rename rests on it." That becomes false here. Correct it
  minimally — the entry's original point (the rename rested on an unratified record at the time)
  stays; the stale present tense goes.
- **T009** — `node scripts/check-adr-index.mjs` and `--selftest`, at this WP's tip. The script is
  **run, never edited** — `scripts/` belongs to a concurrent mission.
- **T010** — `git diff` over ADR-12, ADR-13 and ADR-14 must be empty. #200 ratified two records.

## Boundaries

- No record other than ADR-9 and ADR-11 changes status. ADR-12, ADR-13 and ADR-14 stay `Proposed`.
- No file under `scripts/`, `packages/`, or `expected-stories.json` is written.
- `llms.txt` / `llms-full.txt` state no ADR statuses (#197) and need no edit. `charter.md` states
  none either, and charter changes go through the CLI, never by hand.
- Nothing architectural is decided. A genuine fork found here is filed as an issue with the
  measurement attached, and the mission carries on.
- No unrelated docs cleanup.

## Independent test

`grep -m1 '^\*\*Status'` on both records returns a line whose first comparable word is `Accepted`,
each naming 2026-09-06 and #200. `node scripts/check-adr-index.mjs` exits 0 at 15 records / 15
rows; `--selftest` reports 22 probes tripped and 10 healthy shapes passed. `grep -n '#189'` on
ADR-11 still returns the Deciders line, the subsection paragraph and the More Information bullet.
`git diff origin/train/elements-first -- docs/architecture/decisions/2026-09-02-12-* 2026-09-02-13-* 2026-09-06-14-*`
is empty. `npx commitlint --from origin/train/elements-first --to HEAD` passes.
