---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: webkit-timing-deflake-01M2T31J
mission_id: 01M2T31JBYZYD2AMQ16JD08Z4Y
generated_at: '2026-09-18T11:44:32.723798+00:00'
analyzer_agent: unknown
input_artifacts:
  spec.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/spec.md
    sha256: 370998c6055374be98d8bcc208fc3dfca9c2e3427e22ff91178117a92ad1ef34
  plan.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/plan.md
    sha256: f656b28ffddda85738fe279389b87a5806321d1dfa8b6cf2b7b5fe2ca27a047a
  tasks.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md
    sha256: 78cd698cbcd28d0aec4d34dd2459433a3a841cc17529229dc1ba9e2171d15e9e
  charter:
    path: .kittify/charter/charter.yaml
    sha256: 027fa1ef1a203b970e2688e837774cfeadacbdcec1e42897633d0a243ace0071
verdict: blocked
issue_counts:
  high: 2
  critical: 0
  low: 0
  medium: 8
  info: 0
findings:
- id: B1
  severity: high
  category: consistency
  summary: Every WP's base_commit predates the revision, so the renumbered requirement_refs in the frontmatter resolve to DIFFERENT requirements in the tree each WP is implemented against; FR-004..FR-010 all shifted meaning.
- id: B2
  severity: high
  category: correctness
  summary: Closing A1 gave WP02 commit rights to sk-progress.css, but no artifact requires the T015 red-first mutations to be reverted or the final CSS diff to be empty or a declared C-007 finding.
- id: B3
  severity: medium
  category: testability
  summary: SC-003 is now mechanical, but SC-002/NFR-003's red-first count equality is still assigned to no subtask and is explicitly outside T007's scan, and the plan discloses only NFR-005's gap.
- id: B4
  severity: medium
  category: acceptance
  summary: acceptance-matrix.json was left stale across an FR renumbering, so its ten rows now name requirements that changed meaning - actively wrong rather than merely incomplete.
- id: B5
  severity: medium
  category: charter
  summary: 'A14 is entirely unaddressed: zero mentions of tmp/finding, the lane-worktree symlink, the visual-diff requirement, or maintainer approval for the component change WP02 can now make.'
- id: B6
  severity: medium
  category: contradiction
  summary: tasks.md still says a full playwright job is ~27 minutes while NFR-004/T006/mission-wide acceptance pin the before-figure at 25.6 min - a 5.5% spread against NFR-004's own 5% tolerance.
- id: B7
  severity: medium
  category: contradiction
  summary: The Canonical scope table contradicts the run it cites - five rows claim a train failure where the run reported 3 failed / 2 flaky - and its header double-counts item 12 as 'plus one adopted test family'.
- id: B8
  severity: medium
  category: coverage
  summary: SC-007 has zero subtask coverage, appears in no WP's requirement_refs, cannot be evaluated before the mission merges, and depends on jobs outside mission scope plus a repo variable the mission cannot see.
- id: B9
  severity: medium
  category: regression
  summary: Fixing A10 changed SC-006's denominator from 'every item in scope' to 'sum to twelve', which excludes the adopted lane-stop that the spec itself places 'separately in scope, not a test'.
- id: B10
  severity: medium
  category: coverage
  summary: NFR-007, FR-013 and NFR-004's after-measurement still have no subtask that performs them; NFR-007 binds all six WPs but is referenced only in WP01's frontmatter.
---

# Cross-Artifact Analysis (round 2) — `webkit-timing-deflake-01M2T31J`

Checkout at `af4f98ee` (`mission/webkit-deflake`). Revision landed in `0878bdbb` (tasks.md + six WP files) and `e8533ca7` (spec.md + plan.md). Previous round: `blocked`, 7 high / 7 medium.

## Disposition of round 1 (A1–A14)

**Genuinely closed — 9.** These are not cosmetic; I re-checked each against the codebase, not against the claim.

- **A1** — WP02 `owned_files` now carries `packages/styles/src/progress/**`, and `lanes.json` lane-b's `write_scope` matches. The ownership map in plan.md and the frontmatter agree. *(But see B2 — closing it opened something.)*
- **A2** — WP01 owns `scripts/**`, `.github/workflows/**`, `playwright.config.ts`; lane-a's `write_scope` matches; C-009 exists and T001 names `check-gate-wiring.mjs` / `check-ci-quality-trigger-parity.mjs` by file and tells the implementer to read them first. `promote-develop: needs: [gate]` with no `always()` — verified at `.github/workflows/ci-quality.yml:963-964`, exactly as plan.md claims.
- **A3** — plan.md Complexity Tracking authorises a named two-part fallback and explicitly refuses the failure mode that mattered ("It does **not** fall back to declaring items fixed without measurement"). WP01's Risks repeat it.
- **A4** — Closed thoroughly. New NFR-002, C-001 extended to inheritance, T002 requires the rig to *print* the setting, Correction 4 quotes the real config lines, and the "10 runs vs 10 repeats" drift is reconciled in the open rather than papered over.
- **A5** — Closed and now correctly reasoned. Correction 2 splits the two failures by subject and grounds item 1 on `value="0" max="8"` — which I verified in `packages/styles/src/progress/sk-progress-zero.html`. T010 instruments both subjects; T011 judges per test and forbids transplanting a fix. This is the finding I would most have expected to be closed cosmetically, and it was not.
- **A7** — WP06 owns `mutations.json`, `behaviours.json`, `suite-budget.json`; lane-f matches; C-008 and FR-012 exist; T053 prefers the harness's own derivation over a hand-rolled proof; T055 re-checks the budget.
- **A8** — T051 says enumerate from source, names both files I found, and states the count (seven fixtures, nine sites).
- **A9** — US1 AS1 rewritten correctly: item 1 needs settling, *not* phase selection, with the reason stated (it asserts its two samples are identical). AS2 scopes phase selection to items 3 and 5. IC-02 and T013 restate it consistently.
- **A11** — `:440` is item 2 with its own subtask (T014).

**Closed structurally but the replacement has defects — 1.** **A10**: the Canonical scope table is the right mechanism and tasks.md correctly refuses to restate counts. But the table contradicts its own cited evidence (B7) and its change of denominator dropped an item (B9).

**Partially closed — 2.**

- **A6** — IC-07 and T006 exist and own NFR-004/SC-005, which is the substance. Two residues: T006 only "provide[s] the means to compare the final run", so no subtask performs the *after* measurement (B10); and the before-figure now contradicts tasks.md (B6).
- **A12** — SC-003 is genuinely mechanical now, and T007's "must be able to detect a planted violation — prove that" is the right instinct. But SC-002/NFR-003's count equality is still nobody's subtask and is outside the scan's stated scope (B3).

**Not addressed — 2.** A13 (B4) and A14 (B5).

### On A13, since you asked whether deferring is wrong

Deferring the *filling* of the matrix to accept time is defensible. Leaving the ten existing rows untouched across an FR renumbering is not. `FR-004` through `FR-010` all changed meaning in `e8533ca7`, so a row that reads "Verify FR-007 is satisfied" now points at "Guarantee the composition is present" where it was written against "Settle both states before cross-story comparison". Stale-and-empty was harmless; stale-and-renumbered is a wrong answer wearing the right label. Either clear the rows now or regenerate them; do not leave them.

### On A14, since you asked what specifically is missing

I grepped all nine artifacts for `tmp/finding`, `visual diff`, `screenshot`, `maintainer approval`: **zero hits**. Three concrete items: (1) the charter's Findings Log Practice requires every reasoning-loop failure and skill-invocation error to be logged to `tmp/finding/`, and requires each lane worktree's `tmp/finding/` to be **symlinked** to the root's — this mission runs in lane worktrees (`.worktrees/webkit-timing-deflake-01M2T31J-lane-a` already exists) and nothing tells a lane agent to wire it; (2) the charter requires "a screenshot or visual diff for any component change" plus one maintainer approval for PRs touching component files — the plan's Charter Check now discusses the `packages/styles` grant at length and still names neither; (3) Quality Gate (5) ties red-first to the ADR-11 list, which WP06 now edits with ownership but without the gate being named as a charter obligation (C-008 covers the mechanism, not the charter clause).

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| B1 | consistency | high | all six `tasks/WP0*.md` frontmatter (`base_commit`); `lanes.json` `planning_commit_sha`; `spec.md` FR/NFR tables at `52821727` vs `HEAD` | **This is the one I would most want caught before CI.** The revision renumbered requirements — FR-004 through FR-010 *all* shifted meaning, and NFR-002 through NFR-007 shifted by one. The WP frontmatter was correctly updated to the new numbers. The `base_commit` values were not: WP02–WP06 still point at `52821727` and WP01 at `636045d4`, **both of which predate `e8533ca7`**. I verified the tree at `52821727` has ten FRs, no `Canonical scope`, and no FR-011/FR-012/FR-013, NFR-007, C-008 or C-009; and the existing lane worktree at `636045d4` likewise has no `Canonical scope`. The collisions are silent and plausible rather than loud: WP04 refs **FR-007** → at its base that reads *"Settle both states before cross-story comparison"* (WP05's job); WP05 refs **FR-009** → *"Preserve warn-and-degrade coverage"* (WP06's job); WP06 refs **FR-010** → *"Report what is not fixed"*; WP01 refs **NFR-002** → *"Red-first proof per fix"* and **NFR-004** → *"Assertion strength preserved"*. Nothing errors. An implementer reads a real requirement with the right ID and the wrong content. `lanes.json` compounds it: `planning_commit_sha: a9bb34e3` is older than both. | Re-materialise the WPs so every `base_commit` is at or after `0878bdbb`, and recompute `lanes.json`. Until then, no WP should be dispatched — this is not a cosmetic bookkeeping field, it is the tree the implementer reads the spec from. |
| B2 | correctness | high | `tasks.md` T015 / `tasks/WP02-sk-progress-hard-failures.md` T015; WP02 `owned_files`; `apps/storybook/src/tests/visual.spec.ts-snapshots/` | Closing A1 was right, and it made a previously-impossible failure live. T015 mutates `packages/styles/src/progress/sk-progress.css` three times — full-width fill under forced colors, remove the reduced-motion rule, remove the sweep — and WP02 now has commit rights to that file. I grepped every artifact for `revert`, `restore`, `temporar`, "must not land": **zero hits**. Nothing instructs the implementer to revert a red-first mutation, and no Independent test asserts the final CSS diff is either empty or a declared C-007 finding. The exposure is real and specific: committed baselines exist for exactly the mutated states (`sk-progress-html-forced-colors-*.png`, `sk-progress-html-indeterminate-reduced-motion-*.png`), but `visual-regression` runs **chromium-only** (`--project=chromium`, `ci-quality.yml:626`) while every test in scope is webkit-only — so the safety net is on a different engine from the work. WP02's Risks say a CSS edit "beyond a red-first mutation" is a C-007 finding, which implicitly assumes the red-first mutations do not persist and never says so. | Add to T015: every red-first mutation is reverted in the same subtask, and WP02's Independent test must include "`git diff` against the base for `packages/styles/src/progress/**` is empty, or every remaining hunk is a reported C-007 finding". |
| B3 | testability | medium | `spec.md` SC-002, NFR-003; `plan.md` IC-08; `tasks.md` T007 and "Mission-wide acceptance" | T007's scan is defined as `test.skip`, `test.fixme`, `.only`, added `retries`, increased numeric timeout literals — that is SC-003 and it is a real improvement. SC-002/NFR-003 are a *different* claim ("recorded red-first proofs equal rewritten assertions; neither is zero") and the scan does not cover them; no subtask counts either side. The plan's IC-08 discloses one residual honour-system item (NFR-005's semantic claim) and does not disclose this one, which reads as though SC-002 were now mechanical too. | Either extend T007 to emit both numbers (rewritten assertions are countable from the diff; proofs are countable from the evidence directory), or state in IC-08 that SC-002/NFR-003 remain a reviewer count, the same way NFR-005 is disclosed. |
| B4 | acceptance | medium | `kitty-specs/webkit-timing-deflake-01M2T31J/acceptance-matrix.json` | Unchanged since scaffold: ten rows `FR-001`..`FR-010`, all `"TODO: replace with a real acceptance criterion"`, `negative_invariants: []`. The spec now has thirteen FRs, seven NFRs, nine constraints and seven success criteria. Deferring is defensible; leaving rows whose IDs changed meaning under them is not (reasoning above). | Clear the ten rows now, or regenerate the matrix against the revised spec. Do not carry rows that name one requirement and were written against another. |
| B5 | charter | medium | `.kittify/charter/charter.md` §"Findings Log Practice", §"Quality Gates"; `plan.md` "Charter Check" | Three specific omissions, listed above. The `tmp/finding/` symlink one is the most actionable because a lane worktree already exists and the practice is written as a hard requirement on lane wiring, not on the orchestrator. | Add a "charter obligations" block to tasks.md: the `tmp/finding/` symlink for every lane; and extend plan.md's Charter Check to say what a landed `packages/styles` change triggers (visual diff, maintainer approval, ADR-11 red-first gate). |
| B6 | contradiction | medium | `tasks.md:22` vs `spec.md:203`, `spec.md:236`, `plan.md:209`, `tasks.md:51`, `tasks.md:142` | `tasks.md` §"Verification reality" item 2 still reads "**A full `playwright` job is ~27 minutes**". Five other places now pin the before-figure at **25.6 min**. The gap is 5.5% — wider than NFR-004's own 5% tolerance, so the two figures disagree about whether an unchanged job already passes. The "~27" sentence survives because it is load-bearing for a *different* argument (why ten sequential runs are not viable), which is why it was missed. | Change the `~27 minutes` sentence to cite 25.6 min, or say explicitly that it is a rounded upper bound and that 25.6 min is the measured baseline NFR-004 grades against. |
| B7 | contradiction | medium | `spec.md` "Canonical scope" header and rows 1, 3, 4, 7, 10; `spec.md` Problem table; `plan.md` "Why this mission is on a critical path" | The table is designated "the single source of truth" and contradicts the run it cites. **Five rows** claim a train-run failure (items 1, 3, 4, 7, 10 — two say "failed (PR run and train run)", three say "failed (train)"), but the cited push run reported **3 failed, 2 flaky**. No row is marked flaky-on-train, so two of the five are mis-stated and the run's two flakes are unattributed. Separately the header sentence reads "**Twelve items across five specs, plus one adopted test family**" — but item 12 *is* that family and is row 12 of the twelve, so the sentence double-counts. (plan.md's parallel sentence, "plus one adopted observability defect", is correct: that one is genuinely outside the twelve.) | Mark the two train flakes as flaky rather than failed so the column sums to 3 + 2, and change the header to "Twelve items across five specs" — the adopted family is already row 12. |
| B8 | coverage | medium | `spec.md` SC-007; `plan.md` "Why this mission is on a critical path"; `.github/workflows/ci-quality.yml:963-966`, `:976-984` | SC-007 is a new success criterion with **zero** task coverage: it appears in no WP's `requirement_refs` and in no subtask — only inside a boilerplate paragraph pasted verbatim into all six WP files. Three problems with it as an acceptance criterion. (1) It cannot be evaluated before merge: a train `push` run only exists after the mission lands on the train, so it is a post-merge outcome sitting in a pre-merge acceptance set. (2) Its subject is the whole `gate` job, which aggregates `security`, `lint-code`, `storybook-build`, `a11y`, `visual-regression`, `playwright`, `test` and `release-gate` — the mission controls one of those, so a red from any other job fails SC-007 for reasons no WP can fix. (3) Even with a green gate, `promote-develop` also requires `vars.PROMOTE_DEVELOP_ENABLED == 'true'` (its first `[ENFORCED]` step no-ops otherwise), which the mission cannot observe — so "no longer skipped" is not something a green gate alone establishes. | Rewrite SC-007 as what the mission can actually deliver — "the `playwright` job is green on the mission PR, and the twelve items contribute zero failures and zero flakes" — and record the train-gate/promotion outcome as a post-merge follow-up rather than an acceptance criterion. |
| B9 | regression | medium | `spec.md` SC-006 and "Canonical scope" closing line; prior SC-006 | Fixing A10 tightened SC-006 from "Every item in scope … no item is silently dropped" to "The two counts sum to **twelve**". The spec then says the lane stop is "Separately in scope, **not a test**". So WP06's entire deliverable now sits outside SC-006's denominator, and the one criterion whose job is to stop items being quietly dropped can be satisfied while the adopted lane-stop item is quietly dropped. FR-013 still requires reporting it, but FR-013 is itself unperformed by any subtask (B10). | Restore the catch-all: "the two counts sum to twelve, **plus the lane-stop item, reported either way**" — or make it thirteen and say what the thirteenth is. |
| B10 | coverage | medium | `spec.md` NFR-007, FR-013, NFR-004; `tasks.md` T006; all WP frontmatter | Three requirements still have no subtask that performs them. **NFR-007** (engine disclosure) binds every claim in the mission and is referenced in exactly one place — WP01's `requirement_refs` — which is the one WP whose output is a rig rather than a claim; WP02–WP06, which produce the claims, do not reference it and no subtask emits or checks an engine label. **FR-013** (report what is not fixed) appears in WP04's and WP06's `requirement_refs` and in WP04's Risks line, but no subtask produces the mission-level unfixed report that SC-006 grades. **NFR-004's after-measurement**: T006 records the before-figure and "provide[s] the means to compare", which is not the same as anyone taking the after-reading. | Add NFR-007 to every WP's `requirement_refs` and one line to each WP's Independent test ("every reported count names its engine"); give FR-013 a mission-closing subtask; and make T006 (or a closing subtask) own reading the final duration, not just enabling it. |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|---|---|---|---|
| FR-001 settle before sampling | yes | T010–T012, T014 | IC-01. Well constructed. |
| FR-002 forced-colors distinction | yes | T010–T012, T015 | Red-first mutation now ownable (A1), but unreverted (B2). |
| FR-003 reduced-motion assertion | yes | T010–T012, T015 | As FR-002. |
| FR-004 select phases explicitly | yes | T013 | Correctly scoped to items 3 and 5 only. |
| FR-005 await navigation | yes | T020, T022 | |
| FR-006 await scroll/focus | yes | T021, T022 | |
| FR-007 composition present | yes | T030, T031 | New, from Correction 5. The strongest addition in this revision. |
| FR-008 geometry premise | yes | T032, T033 | Correctly demoted to secondary hypothesis. |
| FR-009 cross-story settle | yes | T040, T041 | |
| FR-010 log under cap | yes | T050–T052, T054 | |
| FR-011 warn coverage preserved | yes | T052, T053 | |
| FR-012 harness stays armed | yes | T053, T055 | New. Closes A7. |
| FR-013 report what is not fixed | **partial** | — | Referenced in two WPs; no subtask produces the report (B10). |
| NFR-001 repeat-run stability | yes | T001–T005, T023, T042 | Fallback now authorised (A3). |
| NFR-002 retries: 0 | yes | T002 | New. Closes A4. |
| NFR-003 red-first count equality | **partial** | T015, T022, T035, T041 | Proofs produced; nobody counts (B3). |
| NFR-004 no added wall-clock | **partial** | T006 | Before-figure owned; after-reading unowned (B10); figure contradicted (B6). |
| NFR-005 assertion strength | sentence only | — | Honestly disclosed in IC-08 as a reviewer judgement. Acceptable as scoped. |
| NFR-006 log completeness | yes | T050, T054 | |
| NFR-007 engine disclosure | **no performer** | — | One frontmatter reference, wrong WP (B10). |
| C-001 no suppression | yes | T007 | Now mechanical for its scan-able part. |
| C-002 no assertion deletion | sentence only | — | |
| C-003 no timeout inflation | yes | T007 | Covered by the scan's timeout-literal arm. |
| C-004 no unproven cause | yes | T056 | |
| C-005 CI is the authority | yes | (structural) | |
| C-006 train-only merge | sentence only | — | |
| C-007 component findings | yes | WP02 Risks, T015 | Now executable (A1 closed); revert gap is B2. |
| C-008 harness armed | yes | T053, T055 | New. |
| C-009 don't change the ordinary suite | yes | T001 | New. Names the two enforced gates. |
| SC-001 zero failures over 10 repeats | yes | via WP01 rig | |
| SC-002 proofs = rewrites | **no counter** | — | B3. |
| SC-003 zero suppressions | yes | T007 | Closes A12's main half. |
| SC-004 log verdict line | yes | T054 | |
| SC-005 duration within 5% | **partial** | T006 | B6, B10. |
| SC-006 all items accounted | **partial** | — | Denominator now excludes the lane stop (B9). |
| SC-007 train gate passes | **no** | — | Zero coverage; not evaluable pre-merge (B8). |

## Charter Alignment Issues

No charter *violation*, so again no CRITICAL. Branch strategy still holds: `mission/webkit-deflake` is a descendant of `train/elements-first`, C-006 is unchanged, and the new `.github/workflows/**` grant to WP01 is bounded by C-009 rather than by silence. The three omissions from round 1 are unchanged and are B5.

One new charter-adjacent exposure worth naming, though it is covered by B2's recommendation: WP02 can now land a change to `packages/styles/src/progress/**`, which under the charter is a component change requiring a visual diff and a maintainer approval. The plan's Charter Check discusses this grant at length and mentions neither obligation.

## Unmapped Tasks

- **T004** (one-way shared-fixture mutation check) — still maps to no requirement key; still a sound precondition on NFR-001's validity.
- **T016** (`samplePixels` edge-offset fragility) — a finding with no requirement to land in; FR-013 is the nearest home, and FR-013 has no performer (B10).
- **T034** (judge items 8 and 9 against the settled-composition finding) — maps to no key; it is the bridge between FR-007 and items 8/9, which otherwise appear in the scope table with no requirement of their own.
- **T055** (`suite-budget.json` still holds) — maps to C-008 by intent but to no stated requirement text.

Duplication note, relevant to B1 and B6: the "Why this is on a critical path" paragraph is now pasted verbatim into `tasks.md` and all six WP files, and the WP bodies duplicate `tasks.md` line for line. That is nine copies of every sentence. The `~27 minutes` survivor (B6) is exactly the failure mode this creates; a correction folded in one place will not reach the others.

## Metrics

| Metric | Value |
|---|---|
| Total requirements | 36 (FR 13, NFR 7, C 9, SC 7) — up from 29 |
| Total tasks (subtasks) | 32 (T001–T007, T010–T016, T020–T023, T030–T035, T040–T042, T050–T056) — up from 27 |
| Requirements with a performing subtask | 27 / 36 — **75%** (was 55%) |
| Requirements with zero coverage | 1 (SC-007) |
| Requirements partially covered | 5 (FR-013, NFR-003, NFR-004, SC-005, SC-006) |
| Requirements with no performer | 2 (NFR-007, SC-002) |
| Round-1 findings genuinely closed | 9 of 14 |
| Round-1 findings partially closed | 3 (A6, A10, A12) |
| Round-1 findings not addressed | 2 (A13, A14) |
| New findings introduced by the revision | 6 (B1, B2, B6, B7, B8, B9) |
| Ambiguity count | 3 (27 vs 25.6; five train failures vs three; twelve-plus-one vs twelve) |
| Duplication count | 3 (WP bodies vs tasks.md; critical-path paragraph ×9; IC map vs both) |
| Critical issues | 0 |
| High issues | 2 |
