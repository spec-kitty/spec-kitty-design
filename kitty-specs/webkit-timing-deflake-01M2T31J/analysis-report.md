---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: webkit-timing-deflake-01M2T31J
mission_id: 01M2T31JBYZYD2AMQ16JD08Z4Y
generated_at: '2026-09-18T12:11:45.912568+00:00'
analyzer_agent: unknown
input_artifacts:
  spec.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/spec.md
    sha256: 124e4298d7e841f3ed6c27d3476dc099d79accfeed4733a1b4a39ad0846553b0
  plan.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/plan.md
    sha256: 37590b988a7327773fbee5d89dba5a5e9e0bda3b983af642d2a60a5dd395366b
  tasks.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md
    sha256: 5f3b2c11d2eae12830af2f6599f071cc44b7d69b6fa4fde5682f6743651146ad
  charter:
    path: .kittify/charter/charter.yaml
    sha256: 027fa1ef1a203b970e2688e837774cfeadacbdcec1e42897633d0a243ace0071
verdict: blocked
issue_counts:
  high: 1
  critical: 0
  low: 2
  medium: 1
  info: 0
findings:
- id: D1
  severity: high
  category: consistency
  summary: base_commit is an output, not an input - the CLI re-derives it from base_branch at claim time - and WP01's base_branch is the coordination branch pinned at the round-1 tree, so WP01 alone would materialize on round-1 artifacts with the planning-merge corrective inert.
- id: D2
  severity: medium
  category: traceability
  summary: The claimed SC-* additions to WP01's requirement_refs are absent from all six WP files, and the tooling deliberately drops SC ids from the ref graph - so that binding could never have existed and must live on the subtask surface, where it now does.
- id: D3
  severity: low
  category: verification
  summary: "C2's residual: deleting the whole [ENFORCED] commitlint comparison step is still machine-undetectable; the registered probe script can assert the workflow still invokes it, without touching event semantics."
- id: D4
  severity: low
  category: consistency
  summary: WP04 carries C-007 but not C-011 while WP02 carries both, so the two constraints governing a component change disagree about whether WP04 can make one.
---

# Cross-Artifact Analysis (round 4) — `webkit-timing-deflake-01M2T31J`

Checkout at `e328a1ad`. Round-4 edits: `78b7575c` (commitlint registration), `242cff2f` (round-3 findings), `371de6a8` (restored subtasks), `e90cf1fe` (base_commit), `e328a1ad` (WP regeneration).

## The artifacts are ready. The wiring is not.

Verified in the final files, not in the change-list. The subtask set is now `T001–T007, T006a, T010–T016, T015a, T020–T023, T030–T035, T040–T042, T050–T056` — **34 ids**, with `T006a` and `T015a` present in both frontmatter and body. `T015a` is better than what I asked for: it absorbs the chromium-vs-webkit argument, states the failure mode in operational terms ("a leftover mutation to a webkit-only behaviour passes every gate"), and cross-references C-011. `T007` now carries the two extra counts with the reason SC-002 needs them. WP02's Independent test carries the `git diff` condition. `revert` finally appears outside my own reports.

**Everything I raised in rounds 1–3 about the documents is now closed.** What remains is one wiring defect that the documents cannot express, and it is the thing you asked me to settle.

## Your blocking question: what reads `planning_commit_sha`?

I read the installed CLI at `~/.local/share/uv/tools/spec-kitty-cli/.../specify_cli/`. The answer is more specific than "high or medium", and it inverts which field you should worry about.

**`planning_commit_sha` is not a base.** `lanes/worktree_allocator.py:653-709` (`_merge_recorded_planning_commit`) runs `git merge-base --is-ancestor <sha> HEAD` in the lane worktree and **returns early if it is already an ancestor**; otherwise it `git merge`s it in, failing closed on conflict. Its own docstring is explicit: *"this only ADDS an ancestor, it never changes the lane's primary parent."* It is also the subject of a claim-ancestry assertion (`implement_support.py:461`, `_is_git_ancestor`). I verified `a9bb34e3` is an ancestor of `371de6a8`, of `e328a1ad` **and** of the coordination branch, with `e328a1ad`-is-ancestor-of-`a9bb34e3` as a negative control returning NO. So the stale value is **inert**: it cannot inject the round-1 tree, because it is a merge and it never fires.

**So `planning_commit_sha` is not your problem. `base_branch` is — and `base_commit` is not a fix.** `lanes/implement_support.py:174-185`, on fresh creation:

```python
base_commit_sha = _rev_parse(repo_root, base_branch)
update_fields(wp_file, {"base_branch": base_branch, "base_commit": base_commit_sha, ...})
```

The recorded `base_commit` is **overwritten** from `base_branch`'s live tip at claim time; `frontmatter.py:70` calls the field "snapshot for validation". It is an output. Your `e90cf1fe` fix is therefore cosmetic for every WP — but harmlessly so for five of them, and harmfully for one. That is D1.

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| D1 | consistency | high | `tasks/WP01-webkit-repeat-run-rig.md` `base_branch`; `lanes.json` `planning_commit_sha`; `specify_cli/lanes/implement_support.py:174-185`; `specify_cli/lanes/worktree_allocator.py:653-709` | **WP02–WP06 are safe to dispatch; WP01 is not.** WP02–WP06 declare `base_branch: mission/webkit-deflake`, which resolves to `e328a1ad` — the current tip, with every round-4 artifact. WP01 declares `base_branch: kitty/mission-webkit-timing-deflake-01M2T31J`, and that branch is pinned at **`636045d4`**, my round-1 record-analysis commit. I checked its tree: `spec.md` has **10 FRs** (no `Canonical scope`, no NFR-002, no C-008..C-012), and `WP01-webkit-repeat-run-rig.md` there owns **`scripts/**` alone** with zero occurrences of `T006a` or `T007`. That is precisely the round-1 state, including the ownership defect that was A2. The corrective built for exactly this case cannot help: `_merge_recorded_planning_commit` exists because *"coordination_branch is minted at mission-create time, BEFORE planning exists"*, and it short-circuits because `a9bb34e3` is already an ancestor of `636045d4`. So the one mechanism designed to give a coordination-branch lane the current planning artifacts is inert, and nothing else will correct the tree. This is B1's failure mode resurrected through a different field. | Two independent fixes, either sufficient; do the first. (1) Fast-forward `kitty/mission-webkit-timing-deflake-01M2T31J` to `e328a1ad` — WP01's base then resolves to the current tree and the planning merge stays a harmless no-op. (2) Set `planning_commit_sha` to `e328a1ad` (or any commit **not** already an ancestor of the coordination branch) so the merge actually fires and injects the artifacts. Note (2) is exactly the hand-edit of mission state you declined, and you were right to decline it — (1) is a branch move, not a state edit, and is the cleaner of the two. Do not dispatch WP01 until one is done; WP02–WP06 need neither. |
| D2 | traceability | medium | all six `tasks/WP0*.md` frontmatter; `specify_cli/requirement_mapping.py:207-235` | The change-list says "SC-008/SC-002/SC-003/SC-005/SC-006 in WP01". I counted `SC-` tokens in each WP's frontmatter block: **0, 0, 0, 0, 0, 0**. The C-010/C-011/C-012 half landed correctly (C-010 in all six, C-012 in five, C-011 in WP02); the SC half did not. It also could not have: `requirement_mapping.py` documents that `normalize_requirement_refs_value` scans with an `FR`/`NFR`/`C`-only pattern, so *"a `SC-008` token written into a WP's `requirement_refs` matches nothing and vanishes with no diagnostic"*, and `_discarded_sc_warning` exists solely to report that they are *"DROPPED, not traced ... per operator decision (c) the graph is NOT widened to admit SC"* — through a non-blocking advisory, never a gate. **This corrects my own round-3 recommendation**, which told you to add SC-008 to `requirement_refs`; that would have been a silent no-op. The guidance the CLI itself gives is the right one: move the coverage claim to the subtask surface or restate it as an FR/NFR/C. You have already done the former — T006a and T007 cite SC-002/SC-003/SC-005 in their bodies, and plan.md IC-08 owns SC-006/SC-008/FR-013/NFR-004. So the traceability is real; only the frontmatter claim is false. | Drop the frontmatter claim from your change-list rather than retrying it. If SC-008 must be machine-traced, promote it to an FR (it is really "produce the mission report") — that is the CLI's own advice and the only route that works. |
| D3 | verification | low | `.github/workflows/ci-quality.yml:487-498`; `scripts/check-gate-wiring.mjs:886-894`; `scripts/check-commitlint-config.mjs` | The split is right and I would not undo it. The probe table now runs unconditionally as its own `[ENFORCED]` step and **is** registered (`check-gate-wiring.mjs:893`), with the non-registration of the comparison documented in place. You asked whether to instead make the comparison event-agnostic so both can be registered: **no.** Deriving a `--from` for push events means handling force-pushes, branch creation (`github.event.before` all-zeros) and merge-base selection — three new failure modes traded for one registration. The residual is that deleting the whole comparison step is still machine-undetectable, since `lint-code` is outside `check-gate-wiring`'s `JOBS`. There is a cheaper close: `check-commitlint-config.mjs` is itself registered and already loads repo files, so have it assert that `ci-quality.yml` contains an `npx commitlint` invocation. That puts the comparison's existence behind a gate that cannot be silently dropped, without touching event semantics. | Optional. If you take it, add the assertion and a near-miss probe in the same commit — the lesson `#74` records in that very file. |
| D4 | consistency | low | `tasks/WP04-shell-layout-premise.md` vs `tasks/WP02-sk-progress-hard-failures.md` `requirement_refs` | WP02 carries both `C-007` (component changes are findings) and `C-011` (a component change needs a visual diff and one maintainer approval). WP04 carries `C-007` but not `C-011`. WP04 owns only `sk-team-overview-shell-layout.spec.ts`, so it cannot make a component change at all — which means either `C-007` is surplus there, or if it is kept for the case where WP04 *discovers* a component defect, `C-011` belongs beside it. As it stands the two constraints governing the same act disagree about which packages they bind. | Drop `C-007` from WP04, or add `C-011` alongside it. Either is fine; the current pair is the only shape that is not. |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|---|---|---|---|
| FR-001 … FR-012 | yes | T010–T016, T015a, T020–T023, T030–T035, T040–T042, T050–T056 | |
| FR-013 report what is not fixed | yes | plan IC-08 → SC-008 report | Now owned. |
| NFR-001 repeat-run stability | yes | T001–T005 + per-WP repeats | |
| NFR-002 retries: 0 | yes | T002 | |
| NFR-003 red-first count equality | yes | T007 | Now produced mechanically, not self-reported. |
| NFR-004 no added wall-clock | yes | T006, **T006a** | Before and after both owned. |
| NFR-005 assertion strength | sentence only | — | Disclosed as a reviewer judgement in plan IC-08. Acceptable as scoped. |
| NFR-006 log completeness | yes | T050, T054 | |
| NFR-007 engine disclosure | yes | IC-08 → SC-008 report | |
| C-001 … C-009 | yes | T001, T002, T007, T015a, T053, T055 | |
| C-010 findings log | yes | tasks.md rule 5; all six `requirement_refs` | |
| C-011 visual diff + approval | yes | WP02 `requirement_refs`, T015a body | See D4 for WP04. |
| C-012 red-first is the charter's bar | yes | five WPs' `requirement_refs` | |
| SC-001 … SC-008 | yes | T006a, T007, T054, IC-08 | Bound at subtask/IC level, which is the only level the tooling admits (D2). |

Every requirement now has a performing subtask or a named owner except NFR-005's semantic half, which is disclosed rather than claimed. Coverage is **39/40 (98%)**, against 55% at round 1.

## Charter Alignment Issues

None. C-010, C-011 and C-012 are written, bound in `requirement_refs`, restated in plan.md's Charter Check, and C-010 is additionally a standing rule in tasks.md so a lane agent meets it before anything else. This is fully closed.

## Unmapped Tasks

**T004**, **T016**, **T034**, **T055** still map to no requirement key. All four are prudent additions rather than gaps; T016's natural home is FR-013, which now has an owner, so it will land in the SC-008 report by default.

## Metrics

| Metric | Value |
|---|---|
| Total requirements | 40 (FR 13, NFR 7, C 12, SC 8) |
| Total tasks (subtasks) | 34 (was 32) |
| Requirements with a performing subtask or named owner | 39 / 40 — **98%** |
| Requirements with zero coverage | 0 |
| Requirements falsely certified as covered | 0 (was 2) |
| Round-3 findings closed | 7 of 8 (C1, C3, C4 partly, C5, C6, C7 partly, C8) + C2 |
| Round-3 findings partially closed | 1 (C4 — C-refs landed, SC-refs cannot; see D2) |
| New findings this round | 2 (D2, D4) |
| Pre-existing defect surfaced this round | 1 (D1 — mission-state wiring, not an artifact defect) |
| Ambiguity count | 0 |
| Duplication count | 0 |
| Critical issues | 0 |
| High issues | 1 |

## Recommendation on continuing the loop

**Stop after D1.** The artifacts are good enough to implement against, and I would say so if asked to defend it: every FR/NFR/C/SC has an owner, the counts agree across all three documents, the corrections are grounded in code I verified rather than in the tracking issue's thesis, and the two mechanisms that were self-certifying at round 1 (SC-002, SC-003) are now produced by a script that must prove it can detect a planted violation. D2 is a change-list correction, not an artifact defect. D3 and D4 are one-line tidies that do not gate anyone.

D1 is different in kind: it is not something another editing round would fix, because no edit to the documents can change which commit `git rev-parse kitty/mission-webkit-timing-deflake-01M2T31J` returns. Move that branch, dispatch WP02–WP06 in parallel with WP01, and let the implementation surface the next class of problem — which will be empirical (does the rig reproduce a hard failure?) rather than editorial. Four rounds of document review have reached the point where the remaining risk lives in the run, not in the text.
