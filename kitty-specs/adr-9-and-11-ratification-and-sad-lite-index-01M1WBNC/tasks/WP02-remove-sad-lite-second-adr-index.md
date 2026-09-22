---
work_package_id: WP02
title: Remove sad-lite's second ADR index
dependencies:
- WP01
requirement_refs:
- FR-010
- FR-011
- FR-012
- FR-013
- FR-016
- FR-017
planning_base_branch: mission/adr-9-11-ratification
merge_target_branch: mission/adr-9-11-ratification
branch_strategy: Planning artifacts for this mission were generated on mission/adr-9-11-ratification. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/adr-9-11-ratification unless the human explicitly redirects the landing branch.
subtasks:
- T011
- T012
- T013
- T014
- T015
- T016
phase: Phase 2 - index removal
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
- docs/architecture/sad-lite.md
role: implementer
tags: []
task_type: docs
tracker_refs:
- spec-kitty/spec-kitty-design#226
---

# Work Package Prompt: WP02 – Remove sad-lite's second ADR index

## Goal

`docs/architecture/sad-lite.md` — the document the architecture README calls *"Start here."* —
stops carrying an ADR index of its own. §7 points at the one table `scripts/check-adr-index.mjs`
holds to `docs/architecture/decisions/`, records what §7 was wrong about at the moment it was
removed, and says where its two `Superseded by ADR-013` cells are preserved.

## The option taken, and the one that stops the mission

#226 lists three. **Option 1 — delete the index and point at the gated table.** That is the shape
this repository has converged on three times already: `elements-first-programme.md:5`,
`llms.txt`/`llms-full.txt` under #197, and `sad-lite.md:10` under #201 — the last of those in this
same file, for this same defect, one mission ago. One index, one gate.

Option 3 (correct the cells, leave it ungated) is what produced the issue and would produce it
again. **Option 2** — generalising `check-adr-index.mjs` over a list of `(file, heading)` pairs —
is defensible, but it edits `scripts/`, which a concurrent mission owns. **If this work package
concludes option 2 is right, it stops and reports rather than doing it.**

## Measurement: take it again, after WP01

#226's table is measured against a pre-ratification tree and is stale by design here. WP01 moves
ADR-9 and ADR-11 to `Accepted`, which makes two of §7's four wrong Status cells correct without
anyone editing them.

Expected after WP01 — **verify, do not assume**: 13 rows against 15 records; **two** Status cells
still contradicting their record (ADR-12 and ADR-13, both `Proposed` in their own headers and
`Accepted` in §7); **two** records with no row at all (ADR-14, and the ADR-003 addendum).

## Subtasks

- **T011** — Re-measure §7 against the post-WP01 tree. Count rows, count records, list the wrong
  Status cells by reading each record's own header, list the missing rows. Whatever is found is
  what the replacement note says.
- **T012** — **Before deleting anything**, verify §7's editorial content survives. §7 carries
  `Superseded by ADR-013` (ADR-006) and `Superseded on the framework question by ADR-013`
  (ADR-007) — a status the gated table does not use, because it transcribes each record's own
  Status and neither record says `Superseded`. Confirm all three surviving surfaces:
  `llms-full.txt:200-205` (both halves, in prose, on a gated surface),
  `decisions/2026-09-02-13-storybook-web-components-builder.md:6` and `:98` (the ADR-6 half, from
  ADR-13's own record), `system-context-canvas.md:130` (the ADR-6 half, as a discharged
  assumption). Note that ADR-13 never names ADR-7 — the ADR-7 half exists only in `llms-full.txt`,
  which is what the replacement note must point at.
- **T013** — Delete the 13-row table. **Keep the `## 7. Architectural Decision Index` heading and
  its number** so §8 and §9 are not renumbered.
- **T014** — Write the replacement: a pointer to the README's gated table, plus a note in the
  blockquote shape `sad-lite.md:10` already uses in this file — what this was (a second, ungated
  index), what it was wrong about as re-measured at T011, and where the Superseded content is
  preserved, naming `llms-full.txt`.
- **T015** — Confirm no record's `**Status:**` reads `Superseded`, and that neither ADR-6 nor
  ADR-7 was edited. Writing `Superseded` into ADR-7 would manufacture a ruling ADR-13 never made,
  and the gate would then faithfully transcribe it.
- **T016** — Re-run `node scripts/check-adr-index.mjs` and `--selftest`;
  `git diff --name-only origin/train/elements-first...HEAD` lists nothing under `scripts/`,
  `packages/`, and does not list `expected-stories.json`.

## Boundaries

- §7's ADR-12 and ADR-13 cells are **removed with the table, not corrected in it**. Correcting
  them is option 3.
- No ADR record is edited by this work package at all — not its Status, not its content.
- No new ADR index is created anywhere.
- No file under `scripts/`, `packages/`, or `expected-stories.json` is written.
- No unrelated docs cleanup: the rest of `sad-lite.md` is out of scope.

## Independent test

`grep -c '^| \[ADR' docs/architecture/sad-lite.md` returns **0** (before: 13).
`grep -n '^## ' docs/architecture/sad-lite.md` still shows §7 at "7.", §8 at "8." and §9 at "9.".
`grep -rn 'Superseded' docs/architecture/decisions/` returns no `**Status:**` line.
`grep -n 'llms-full' docs/architecture/sad-lite.md` finds the preservation pointer.
`node scripts/check-adr-index.mjs` exits 0; `--selftest` trips all 22 probes.
