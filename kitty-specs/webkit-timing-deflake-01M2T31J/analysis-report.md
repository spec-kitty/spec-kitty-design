---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: webkit-timing-deflake-01M2T31J
mission_id: 01M2T31JBYZYD2AMQ16JD08Z4Y
generated_at: '2026-09-18T12:01:19.234258+00:00'
analyzer_agent: unknown
input_artifacts:
  spec.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/spec.md
    sha256: 4c0c64dfc551df40058b61b66f61149ba4f53caa433f027339630073946abff5
  plan.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/plan.md
    sha256: f656b28ffddda85738fe279389b87a5806321d1dfa8b6cf2b7b5fe2ca27a047a
  tasks.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md
    sha256: 9121a7007dbd54b9cdc19af377afb37926069a66b4d9f2f3962e31922b42ec1c
  charter:
    path: .kittify/charter/charter.yaml
    sha256: 027fa1ef1a203b970e2688e837774cfeadacbdcec1e42897633d0a243ace0071
verdict: blocked
issue_counts:
  medium: 5
  low: 1
  critical: 0
  high: 2
  info: 0
findings:
- id: C1
  severity: high
  category: consistency
  summary: Three claimed round-3 remediations (T015a, T006a, T007's count extension) do not exist - the subtask set is byte-identical to round 2 - yet spec.md now certifies two of them via SC-002 and SC-008.
- id: C2
  severity: high
  category: verification
  summary: The new commitlint exemption is genuinely bounded (proved with 20 probes), but the probe table that bounds it is registered nowhere - commitlint appears zero times in check-gate-wiring.mjs, and lint-code is outside that file's job audit.
- id: C3
  severity: medium
  category: consistency
  summary: "plan.md was not touched this round: it still says '27-minute jobs' (the figure tasks.md now names as 5.5% wrong), its Charter Check predates C-010/011/012, and its IC map has no concern for SC-006, SC-007 or SC-008."
- id: C4
  severity: medium
  category: coverage
  summary: SC-008, C-011 and C-012 exist only in spec.md - no subtask, no plan concern, and no WP requirement_refs entry carries any of C-010, C-011, C-012 or SC-008.
- id: C5
  severity: medium
  category: contradiction
  summary: "The B9 and B7 corrections did not reach tasks.md: Mission-wide acceptance still sums to 12 against SC-006's thirteen, and WP03's priority line still says item 10 failed on the train where the corrected table says flaky."
- id: C6
  severity: medium
  category: contradiction
  summary: spec.md User Story 1's rationale still asserts the train-gate framing that the rewritten SC-007 explicitly refutes.
- id: C7
  severity: medium
  category: consistency
  summary: 'base_commit d6af2595 is one commit short: the WP files at that commit are the round-2 versions, and lanes.json still records planning_commit_sha a9bb34e3 despite being recomputed.'
- id: C8
  severity: low
  category: hygiene
  summary: SC-008 is listed between SC-002 and SC-003 in the Measurable Outcomes list rather than after SC-007.
---

# Cross-Artifact Analysis (round 3) — `webkit-timing-deflake-01M2T31J`

Checkout at `47eba5b8`. Round-3 edits landed across four commits: `02605048` (spec.md, tasks.md, acceptance-matrix.json), `d6af2595` (.gitignore), `5320703e` (WP files + lanes.json), `47eba5b8` (commitlint).

## Headline

**The spec layer advanced; the task layer did not follow.** I verified the full subtask set: `T001–T007, T010–T016, T020–T023, T030–T035, T040–T042, T050–T056` — 32 ids, **byte-identical to round 2**. `T015a` and `T006a` do not exist anywhere in the repository, and `T007` is unchanged. Meanwhile spec.md now states SC-002 is machine-checked ("**WP01's scan reports both counts**") and introduces SC-008 as the place "FR-013 and NFR-004's after-reading are delivered". Neither mechanism exists. That is a worse position than round 2's, which had an honest gap where this now has a certification. This is C1, and it is the finding I would most want acted on.

## Disposition of round 2 (B1–B10, A13, A14)

**Genuinely closed — 4.**

- **B1** — All six `base_commit` values are now `d6af2595`, and I verified that commit carries `FR-013` (2 hits) and `SC-008` (1 hit), i.e. the round-3 spec. The stale lane worktree is gone; `.gitignore` really does cover `.worktrees/` and the recorder no longer needs a workaround. *(One commit short of complete — C7.)*
- **B7** — Corrected properly and verified against the run's own split: items 1, 3, 4 `failed` = 3; items 7, 10 `flaky` = 2; matches "3 failed, 2 flaky". The header double-count is gone. The added standing note — that a CI `flaky` under `retries: 2` means a test that failed and was retried into a pass — is a real improvement, not bookkeeping, and it is now used consistently in US2 and US3.
- **B8** — Restated well. SC-007 is now scoped to what the mission controls, and it names the `vars.PROMOTE_DEVELOP_ENABLED` dependency, the seven-job aggregate and the post-merge timing explicitly. *(Its old framing survives one paragraph away — C6.)*
- **A13** — `acceptance-matrix.json` is now `"criteria": []`, `"negative_invariants": []`. Exactly the agreed disposition.

**Partially closed — 3.**

- **B6** — Gone from spec.md and tasks.md, and tasks.md rule 2 now explains *why* the rounder figure is not harmless. But `plan.md:76` still reads "Ten sequential **27-minute** jobs was never viable" (C3). tasks.md now names that exact string as wrong.
- **B9** — spec.md SC-006 sums to thirteen with the reason stated. tasks.md's Mission-wide acceptance still says `= 12` (C5).
- **A14** — C-010, C-011 and C-012 are well written; C-011 even carries the chromium-vs-webkit engine-mismatch note. But only C-010 propagated anywhere; C-011 and C-012 appear exactly once each, in spec.md (C4).

**Not closed — 3.**

- **B2** — `T015a` does not exist. `T015` and WP02's Independent test are unchanged from round 2. I grepped the whole mission directory for `revert`, `restore`, `git diff`: the only hits are inside my own round-2 `analysis-report.md`. Nothing requires the three red-first CSS mutations to be undone.
- **B3** — `T007` still lists only the five suppression patterns. It does not report rewritten-assertion or red-first-proof counts, so SC-002's equality claim has no producer.
- **B10** — `T006a` does not exist; `T006` still says "provide the means to compare". SC-008 was created to hold FR-013 and the duration after-reading, and nothing delivers SC-008.

**Structural de-duplication: closed and worth keeping.** tasks.md now carries goal/priority/owns/dependencies per WP and points at the WP file; the WP files carry a short "Canonical sources" block instead of the pasted preamble. That is the right shape. Note the irony in C5: the two places where a round-2 correction failed to propagate are the two copies the de-duplication left behind.

## Your question: is the commitlint exemption bounded?

**On the subject and slug: yes, genuinely.** I loaded the real config and ran twenty adversarial probes against `config.ignores`, beyond the three near-misses in `check-commitlint-config.mjs`. Only the exact subject plus whitespace/CRLF/body variants are ignored. Every one of these is correctly **rejected**: appending text after a tab, a non-breaking space, a vertical tab, a form feed or U+2028; a leading newline; prefixed junk; `docs(Record-Analysis)` case change; a five-character mission id; an uppercase friendly slug; `../../etc/passwd` as the slug; an empty slug; extra words after the slug; `feat(` instead of `docs(`. The `\s*(\n|$)` tail behaves as the file's comment claims — end-of-LINE, not end-of-string — so nothing can ride on line 1. `node scripts/check-commitlint-config.mjs` passes; `node scripts/check-gate-wiring.mjs` passes.

**The one property worth stating plainly, though it is not new:** because commitlint's `ignores` sees the whole message, an exact-subject commit escapes the **body** rules too (`body-max-line-length`, `body-leading-blank`). I confirmed a 300-character body and a body containing `banana(nope): anything` are both ignored. That is a deliberate, documented trade-off shared by all ~20 sibling patterns — the file says so — so I am not raising it as a finding. If you ever want it closed, it has to be closed for the whole list, not for this one entry.

**What I am raising is C2: nothing holds the probe table in place.** Detail below.

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | consistency | high | `tasks/WP01-webkit-repeat-run-rig.md` T006/T007; `tasks/WP02-sk-progress-hard-failures.md` T015 + Independent test; `spec.md` SC-002, SC-008 | Three remediations described in the change-list did not land. The complete subtask set is `T001–T007, T010–T016, T020–T023, T030–T035, T040–T042, T050–T056` — 32 ids, unchanged since round 2. **`T015a` does not exist**: T015 still ends at "hence this WP's ownership of `packages/styles/src/progress/**`", WP02's Independent test still reads "10/10 repeats green … red-first proofs recorded", and the mission directory contains no instance of `revert`, `restore` or `git diff` outside my own round-2 report. **`T006a` does not exist**: T006 still says "provide the means to compare the final run against it". **`T007` is unextended**: it still enumerates only `test.skip`, `test.fixme`, `.only`, added `retries` and timeout literals. The compounding problem is that spec.md was edited to assert the opposite — SC-002 now says "**WP01's scan reports both counts**; equality is not left to per-WP self-report", and SC-008 says "FR-013 and NFR-004's after-reading are delivered here". An accept-time reader of spec.md will conclude these are mechanised. An honest gap became a false certification. | Add the three subtasks for real — `T015a` (revert every red-first mutation; WP02's Independent test asserts `git diff` on `packages/styles/src/progress/**` is empty or every hunk is a declared C-007 finding), `T006a` (take the final duration reading), and T007's two extra counts — or roll SC-002 and SC-008 back to language that matches what the tasks actually do. Do not leave the spec ahead of the tasks. |
| C2 | verification | high | `scripts/check-gate-wiring.mjs` (`JOBS`, `REQUIRED_LINT`); `.github/workflows/ci-quality.yml:487-491`; `commitlint.config.cjs`; `scripts/check-commitlint-config.mjs` | The exemption is bounded (proof above). What bounds it is the probe table — and the probe table is held in place by nothing. `commitlint` appears **zero times** in `scripts/check-gate-wiring.mjs` (control: `check-manifest-content.mjs` appears three times, as a registered gate plus its own probe table). The step body is two commands under one name: `node scripts/check-commitlint-config.mjs` then `npx commitlint --from=… --to=…`. Delete the first line and the `[ENFORCED] commitlint (FR-020)` step still exists, still runs, still passes — and the table bounding ~20 exemption regexes is gone with nothing reporting it. The whole-job payload audit cannot catch it either: `check-gate-wiring.mjs` sets `const JOBS = ['test', 'release-gate', 'changes']`, so `lint-code` is outside it, and the file's own comment at line 34 says "REQUIRED_LINT is how a step in that job is held to running". For `lint-code` the registry is the *only* mechanism, and this gate is not in it. This repository has shipped exactly this defect twice by its own record — `#74` ("shipped a gate with no registration") and `#129` ("check-manifest-content.mjs was an ENFORCED step with NO entry here at all"). Secondary, same step: it carries `if: github.event_name == 'pull_request'`, and the principle recorded in `ci-quality.yml` is that gate-wiring "refuses any `if:` on an [ENFORCED] step on principle, having been defeated twice before (#202, #205)" — it does not refuse this one, for the same reason. | Add two `REQUIRED_LINT` entries in the sibling style: one for `node scripts/check-commitlint-config.mjs` ("the commitlint exemption probe table") and one for `npx commitlint` ("the conventional-commit gate"). Register them **with** this change, which is the lesson `#74`'s own comment in that file records. |
| C3 | consistency | medium | `plan.md:76`, `plan.md` "Charter Check", `plan.md` IC map; `git show --stat 02605048` | `02605048` touched `acceptance-matrix.json`, `spec.md` and `tasks.md` — **not `plan.md`**. So plan.md is still at its round-2 content while three artifacts moved around it. Concretely: (a) line 76 still reads "Ten sequential **27-minute** jobs was never viable", the exact figure tasks.md rule 2 now singles out as 5.5% off and disagreeing with NFR-004's own 5% tolerance; (b) its "Charter Check" predates C-010, C-011 and C-012 and still discusses the `packages/styles` grant without the visual-diff or maintainer-approval obligations those constraints now impose; (c) its Implementation Concern Map runs IC-01..IC-08 with no concern owning SC-006's thirteenth item, the restated SC-007, or SC-008. This matters more than a stale document normally would, because every WP file's new "Canonical sources" block sends the implementer to plan.md as the authority for "Corrections 1–5, the ownership map, the authorised fallback". | Bring plan.md through the same pass: fix line 76 to 25.6 min, extend the Charter Check to C-010/011/012, and add the missing concerns (or state that SC-006/SC-007/SC-008 are mission-level and owned outside the IC map). |
| C4 | coverage | medium | `spec.md` SC-008, C-011, C-012; all six `tasks/WP0*.md` `requirement_refs` | `SC-008` occurs exactly once in the entire mission — in spec.md. So do `C-011` and `C-012`. No subtask delivers SC-008, no plan concern covers it, and **no WP's `requirement_refs` carries SC-008, C-010, C-011 or C-012**. C-010 at least reached tasks.md rule 5 and the six pointer blocks, so a lane agent will meet it; C-011 and C-012 will reach nobody. C-011 is the one that binds hardest — it says a C-007 change under `packages/styles/**` cannot self-merge and needs a visual diff plus a maintainer approval — and WP02 is the package that can make such a change, with `C-007` in its refs and `C-011` nowhere. | Add `C-011` and `C-012` to WP02's `requirement_refs` (and `C-012` to WP06's, which is where the harness-vs-hand-rolled-proof choice is actually made), give SC-008 an owning subtask, and add `C-010` to every WP's refs since it binds every lane. |
| C5 | contradiction | medium | `tasks.md` "Mission-wide acceptance" (`= 12`) vs `spec.md` SC-006 (thirteen); `tasks.md` WP03 Priority vs `spec.md` Canonical scope item 10 | Two round-2 corrections landed in spec.md and did not propagate to tasks.md. (1) SC-006 now sums to **thirteen** and explains why; tasks.md's acceptance block still reads "items fixed with a demonstrated cause + items reported unfixed = **12**". Since tasks.md's block is the checklist an implementer actually works from, the lane-stop item drops back out of the denominator exactly as B9 described. (2) The Canonical scope table now records item 10 as `flaky (PR), flaky (train)`, and spec.md US2 was updated to "flaked on the train (i.e. failed, then passed on retry)" — but tasks.md's WP03 Priority line still says "item 10 **failed** on the train". | Change the acceptance line to thirteen with the same parenthetical spec.md uses, and correct WP03's priority line to "flaked on the train". Better still, have the acceptance block cite SC-006 rather than restate its number — restating is what produced this. |
| C6 | contradiction | medium | `spec.md` US1 "Why this priority" vs `spec.md` SC-007 | SC-007 was rewritten precisely to stop the mission claiming ownership of promotion: it now says the gate aggregates seven jobs the mission does not own, that a train push run only exists after landing, and that `vars.PROMOTE_DEVELOP_ENABLED` is additionally required, "so a green gate alone would not establish that promotion runs". Seventy lines earlier, US1's rationale still reads "a red gate on the train **skips the `promote-develop` job**, which blocks the release promotion entirely" — the framing SC-007 exists to refute, stated without either caveat. tasks.md's own "Why this is on a critical path" section got the nuance right ("necessary but not sufficient"); US1 did not. | Align US1's rationale with tasks.md's wording: the mission is a necessary but not sufficient condition for promotion resuming. |
| C7 | consistency | medium | all six `tasks/WP0*.md` `base_commit`; `lanes.json` `planning_commit_sha` vs `computed_at`; `git log 02605048..HEAD` | The B1 fix is one commit short of self-consistent. `d6af2595` carries the round-3 `spec.md` and `tasks.md` — I verified `FR-013` and `SC-008` are present there — but the **WP files themselves** were regenerated afterwards, in `5320703e`. I checked `git show d6af2595:…/WP01-webkit-repeat-run-rig.md`: it still records `base_commit: 636045d4` and has **no** "Canonical sources" block. So a lane that checks out its recorded base gets the round-2 WP prompt, not the one the orchestrator dispatched — the same class of defect as B1, one link further down. The commitlint exemption (`47eba5b8`) is also absent at that base. Separately, `lanes.json` was recomputed (`computed_at: 11:49:10`) but `planning_commit_sha` is still `a9bb34e3`, unchanged since round 2 and older than every artifact it anchors. | Move `base_commit` to `5320703e` or later (`47eba5b8` is the natural choice — it is the only commit at which the artifacts, the WP files and the commit-message gate are all consistent), and refresh `planning_commit_sha` in the same pass. |
| C8 | hygiene | low | `spec.md` "Measurable Outcomes" | `SC-008` is inserted between `SC-002` and `SC-003` rather than after `SC-007`. Cosmetic in prose, but this list is the mission's canonical criteria enumeration and an out-of-order id is the kind of thing a reader skims past when checking that every SC is present. | Move it to the end of the list. |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|---|---|---|---|
| FR-001 … FR-012 | yes | T010–T016, T020–T023, T030–T035, T040–T042, T050–T056 | Unchanged from round 2 and adequate. |
| FR-013 report what is not fixed | **no performer** | — | SC-008 was created to hold it; SC-008 has no subtask (C1, C4). |
| NFR-001 repeat-run stability | yes | T001–T005 + per-WP repeat subtasks | |
| NFR-002 retries: 0 | yes | T002 | |
| NFR-003 red-first count equality | **no counter** | T015, T022, T035, T041 | Proofs produced; T007 still does not count them (C1). |
| NFR-004 no added wall-clock | **partial** | T006 | Before-figure only; the after-reading was assigned to a subtask that does not exist (C1). |
| NFR-005 assertion strength | sentence only | — | Disclosed in plan.md IC-08 as a reviewer judgement. Acceptable as scoped. |
| NFR-006 log completeness | yes | T050, T054 | |
| NFR-007 engine disclosure | **no performer** | — | Routed to SC-008 (C1, C4). |
| C-001 … C-009 | yes | T001, T002, T007, T053, T055, WP02 Risks | Unchanged and adequate. |
| C-010 findings log | yes | tasks.md rule 5 + six pointer blocks | Reaches every lane, though in no `requirement_refs` (C4). |
| C-011 visual diff + approval | **no binding** | — | spec.md only; not in WP02's refs, which is the package it governs (C4). |
| C-012 red-first is the charter's bar | **no binding** | — | spec.md only (C4). |
| SC-001 | yes | via WP01 rig | |
| SC-002 proofs = rewrites | **falsely certified** | — | spec says WP01's scan reports both counts; it does not (C1). |
| SC-003 zero suppressions | yes | T007 | The one genuinely mechanised criterion. |
| SC-004 log verdict line | yes | T054 | |
| SC-005 duration within 5% | **partial** | T006 | After-reading unowned (C1). |
| SC-006 all items accounted (13) | **contradicted** | — | tasks.md still says 12 (C5). |
| SC-007 zero fail/flake pre-merge | **no performer** | — | Well restated, but still no subtask and no `requirement_refs` entry. |
| SC-008 single mission report | **no performer** | — | One occurrence in the whole mission (C1, C4). |

## Charter Alignment Issues

No violation, so no CRITICAL — third round running. The charter obligations I raised as A14 are now *written* as C-010, C-011 and C-012 and they are written well; C-011 carrying the chromium-only engine-mismatch note is a better statement of the risk than my own. The residual issue is binding, not content (C4): a constraint that appears once in spec.md and in no work package's `requirement_refs` will not reach the agent it governs. C-010 escaped that fate because it was also written into tasks.md's standing rules; C-011 and C-012 were not.

The `.worktrees/` entry in `.gitignore` (`d6af2595`) is the right fix and removes the need for the `.git/info/exclude` workaround — the recorder ran clean this round with no intervention.

## Unmapped Tasks

Unchanged from round 2: **T004** (one-way shared-fixture check), **T016** (`samplePixels` edge-offset fragility), **T034** (judge items 8 and 9 against the settled-composition finding), **T055** (`suite-budget.json` still holds) map to no requirement key. T016's natural home is FR-013, which still has no performer.

No subtask is now duplicated between `tasks.md` and the WP files — the de-duplication worked, and it is the one structural change this round that fully delivered.

## Metrics

| Metric | Value |
|---|---|
| Total requirements | 40 (FR 13, NFR 7, C 12, SC 8) — up from 36 |
| Total tasks (subtasks) | 32 — **unchanged from round 2** |
| Requirements with a performing subtask | 28 / 40 — **70%** (was 75% over a smaller set) |
| Requirements with zero coverage | 5 (FR-013, NFR-007, C-011, C-012, SC-008) |
| Requirements falsely certified as covered | 2 (SC-002, SC-005's after-half) |
| Round-2 findings genuinely closed | 4 of 12 (B1, B7, B8, A13) |
| Round-2 findings partially closed | 3 (B6, B9, A14) |
| Round-2 findings not closed | 3 (B2, B3, B10) |
| New findings introduced this round | 4 (C1's certification half, C3, C6, C8) |
| Pre-existing defect surfaced this round | 1 (C2 — predates the mission; in scope because the new exemption depends on it) |
| Ambiguity count | 2 (12 vs thirteen; item 10 failed vs flaky) |
| Duplication count | 0 — the de-duplication held |
| Critical issues | 0 |
| High issues | 2 |
