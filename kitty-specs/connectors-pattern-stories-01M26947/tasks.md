# Tasks: Connectors Pattern Stories

**Mission**: `connectors-pattern-stories-01M26947`
**Input**: `spec.md`, `research.md`, `plan.md`
**Planning base / merge target**: `mission/connectors-pattern-stories` (single_branch topology)

One bounded Work Package and one PR, per #338's own delivery rule. The mission is deliberately
dependency-blocked: #336, #337 (wave-1 lanes of this same programme, both implementing now), #320,
and #321 (owned PRs in flight, #341/#339) are real blocks on six of the ten canvases and on two
truth-boundary assertions. WP01 therefore includes the blocked canvases as explicit, unstarted
subtasks rather than omitting them — the WP legitimately sits in `implement` until those contracts
land; that is the correct state, not a stall. Orchestrator ruling 2026-09-10 (see research.md's
Dependency reconciliation): `#280` and `#307` are dropped as blocks after measurement; `#320`/`#321`
stay blocked deliberately even though the same evidence standard reads them as narrowable, because a
committed baseline would assert a contrast/tone value the in-flight PRs are about to change.

## Subtask Index

| ID | Description | Requirements | Status this pass |
|---|---|---|---|
| T001 | Author the single internally-consistent immutable fixture family (health, counts, IDs, timestamps, branches, errors, permissions) spanning every canvas's data needs, deep-frozen, with fixture-consistency invariant checks | FR-017, FR-020, FR-021, FR-022, C-010, C-011 | Doable now |
| T002 | Author pure projection/selector functions for C1 (setup index) and C3 (provider handoff) | FR-001, FR-003, FR-011, FR-014 | Doable now |
| T003 | Author pure projection/selector functions for C2 (operating index) and C4 (GitHub App setup failure), including the permission-projection (admin/member) helper | FR-002, FR-004, FR-011, FR-012, FR-014, FR-020 | Doable now |
| T004 | Compose C1 and C3 Storybook stories from public surfaces (`sk-app-shell`, `sk-page-header`, `sk-card`, `sk-notice`, `sk-status-indicator`, `.sk-empty-state`, `.sk-breadcrumbs`) | FR-001, FR-003, FR-024, C-001-C-004 | Doable now |
| T005 | Compose C2 and C4 Storybook stories, including C2's `sk-action-row` trailing-control rows (public `controls` slot) | FR-002, FR-004, FR-024, C-001-C-004 | Doable now |
| T006 | Assert the truth boundaries reachable today: no GitHub repository picker / no `Admit selected` (FR-011); `/discovery/` represented only as a compatibility-redirect fact (FR-014); Slack outbound-only, no inbound affordance (FR-012); mutation-free forms via a `submit` listener + `preventDefault()` (FR-018) | FR-011, FR-012, FR-014, FR-018 | Doable now |
| T007 | Run `node scripts/check-pattern-composition.mjs --selftest` and `node scripts/check-pattern-composition.mjs`; keep both green; update `expected-stories.json` and any other required ratchet for the C1-C4 story set only | FR-026, FR-028, NFR-011 | Doable now |
| T008 | Compose C5 (GitLab exactly-one group selection) | FR-005, FR-013 | **Done** — #336 merged as `0a232a01`, #321 landed as PR #339; composed 2026-09-11, folded against pre-merge review 2026-09-11 |
| T009 | Compose the C6/C7/C8/C9a Installation Detail family (shell + Workspace Scope / Project Routing / Team Accounts sub-navigation) | FR-006, FR-007, FR-008, FR-009, FR-015, FR-016, FR-022, FR-023 | **Done** — #337 merged as `16948194`, #320 landed as PR #341; composed 2026-09-11, folded against pre-merge review 2026-09-11 (real fixture-consistency, single-source-of-truth, and Firefox 390px overflow defects found and fixed during the fold — see PR history) |
| T010 | Compose C9b (Slack channel selection) | FR-010, FR-012 | **Done** — the picker is a native `<select>`, no filter input exists (confirmed against the corpus) |
| T011 | Full-family visual-baseline harvest from CI, final ratchet completion (`expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`), and `docs/design-system/using-components.md` ownership section | FR-027, FR-028, FR-029, NFR-008 | **Partially done**: `docs/design-system/using-components.md`'s Connectors section added; `visual.spec.ts` carries the baseline entries (harvest mechanism now exists) but no PNG is generated or committed — CI-authoritative, orchestrator harvests after the PR exists. `expected-parts.json`/`expected-docs.json`/`behaviours.json`/`mutations.json` not yet touched — no new custom element, no new `::part()`, no new registered behaviour was introduced by this mission, so these ratchets may not need an entry at all; flagged for the orchestrator to confirm before merge. |

T001 is the source for T002-T003; T002/T003 precede T004/T005; T006/T007 require T004/T005's
rendered output. T008-T010 are all now complete. T011's remaining open item is the CI baseline
harvest itself, which only the orchestrator can perform (never a local `--update-snapshots`).

## Work Packages

### WP01 — Connectors pattern stories: prove the unblocked C1-C4 scope, record the rest as blocked

- **Goal**: publish C1 (setup index), C2 (operating index), C3 (provider handoff), and C4 (GitHub
  App setup failure) as accessible, discoverable Storybook pattern stories composed solely from
  current public surfaces, one immutable fixture family, and pure projections; assert the truth
  boundaries reachable from that scope; carry C5-C9b as recorded, unstarted, explicitly blocked
  subtasks rather than silently completing the mission's PR scope.
- **Priority**: P0 — this is the portion of #338 doable without forking a missing public contract.
- **Independent test**: `node scripts/check-pattern-composition.mjs --selftest` and the non-selftest
  form both pass; C1-C4 stories render with fixture-consistent, non-fabricated content; the
  no-picker, `/discovery/`-redirect, Slack-outbound-only, and mutation-free-form assertions all hold
  against the rendered DOM.
- **Included subtasks**: T001-T011 (T008-T011 recorded as blocked, not executed this pass).
- **Dependencies**: none for T001-T007. T008 needs #336 and #321. T009 needs #337 (plus #320/#321
  kept blocked by ruling). T010 conditionally needs #321. T011 needs T008-T010 complete.
- **Estimated prompt size**: large — one fixture family plus four composed canvases plus truth-
  boundary tests, with six canvases' worth of work explicitly deferred.
- **Risks**: a fixture shaped only for C1-C4 would need reshaping when C5-C9b unblock, duplicating
  work. Mitigated by shaping T001's fixture around the full family's data needs now (FR-017 already
  requires one fixture family for the whole mission), even though only C1-C4 get projections/renders
  this pass.

## Parallelization

None. T001 gates everything; T002-T007 are sequential within the unblocked scope; T008-T011 do not
start until their named dependency lands, and are not being worked on by this WP right now.

## MVP Scope

T001-T007 (the C1-C4 proof, its fixture, and its reachable truth-boundary assertions) is the entire
scope this pass can legitimately close. T008-T011 remain open subtasks of the same WP — per #338's
one-WP-one-PR rule, WP01 does not get marked complete, and no PR is opened, until they land too.
