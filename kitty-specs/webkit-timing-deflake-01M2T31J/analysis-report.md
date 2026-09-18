---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: webkit-timing-deflake-01M2T31J
mission_id: 01M2T31JBYZYD2AMQ16JD08Z4Y
generated_at: '2026-09-18T11:29:04.532853+00:00'
analyzer_agent: unknown
input_artifacts:
  spec.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/spec.md
    sha256: 6cde962eca8aa2dbc28713943fd9ae50c7f8d140d8da53f24cc99500eea3a804
  plan.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/plan.md
    sha256: fe81ad7a2cd67079cd1feece1c3dbfa6e511ae3d31ab0b38399cef5f09450b3c
  tasks.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md
    sha256: e2165d481b2b897c62e812bf517dcac93de1f79b43c4ade5f34cc91207461f4e
  charter:
    path: .kittify/charter/charter.yaml
    sha256: 027fa1ef1a203b970e2688e837774cfeadacbdcec1e42897633d0a243ace0071
verdict: blocked
issue_counts:
  critical: 0
  low: 0
  medium: 7
  high: 7
  info: 0
findings:
- id: A1
  severity: high
  category: ownership
  summary: WP02 owns only sk-progress.spec.ts, but T014's red-first proofs and C-007's component branch both require editing packages/styles/src/progress/sk-progress.css, which no work package owns.
- id: A2
  severity: high
  category: ownership
  summary: WP01 owns scripts/** but its deliverable is a CI invocation that lives in .github/workflows/ci-quality.yml and playwright.config.ts, neither owned, both guarded by enforced structure gates.
- id: A3
  severity: high
  category: acceptance
  summary: WP01's rig is the sole evidence path for NFR-001/SC-001 and WP01 is explicitly permitted to report that no rig is possible; no fallback acceptance exists for WP02-WP05 in that case.
- id: A4
  severity: high
  category: correctness
  summary: playwright.config.ts sets retries:2 on CI, so --repeat-each=10 can report green over real failures; no artifact mentions retries, workers or fullyParallel, and NFR-001's 'consecutive runs' is silently redefined as repeats in one job.
- id: A5
  severity: high
  category: correctness
  summary: The plan's unsettled-comparison-fixture hypothesis cannot mechanically explain sk-progress.spec.ts:369, yet T010 instruments only the comparison fixtures, so the decisive experiment can 'refute' without ever sampling the real suspect.
- id: A6
  severity: high
  category: coverage
  summary: NFR-003 and SC-005 (playwright job duration within 5% of the pre-mission run) have zero subtask coverage, and nothing owns capturing the pre-mission before-figure.
- id: A7
  severity: high
  category: ownership
  summary: WP06 edits fixtures/elements-behaviour/src/*.test.ts, which are the subjects of the enforced mutation harness keyed by mutations.json/behaviours.json at repo root; WP06 owns neither and no artifact mentions the harness or suite-budget.json.
- id: A8
  severity: medium
  category: correctness
  summary: 'The warn-and-degrade file list is incomplete: the same warn-emitting prototype-key loop also exists in sk-ribbon-card.test.ts:212 and sk-grid.test.ts:343, which the plan and WP06 both omit.'
- id: A9
  severity: medium
  category: contradiction
  summary: Spec User Story 1 Acceptance Scenario 1 tells the implementer to phase-pin :369, a test that has no animation to pin under forced-colors; the plan's Correction 1 makes that point only for :465.
- id: A10
  severity: medium
  category: ambiguity
  summary: "Mission scope is unresolvable: spec says eight tests across six specs, plan says nine across six, every WP names only five spec files, three items are parameterized loops, and WP03's 'Enter-key family' carries no line numbers."
- id: A11
  severity: medium
  category: coverage
  summary: sk-progress.spec.ts:440 has the identical sample/waitForTimeout(300)/sample shape and the same unsettled-fixture exposure as :369, and is named by no requirement, WP or subtask.
- id: A12
  severity: medium
  category: testability
  summary: 'SC-002, SC-003 and NFR-004 are self-certifying: no subtask assigns the counting or the before/after assertion comparison to anyone, and no gate would detect a wrong count.'
- id: A13
  severity: medium
  category: acceptance
  summary: 'acceptance-matrix.json is unedited scaffold: ten TODO FR rows, no NFR/C/SC rows at all, and negative_invariants empty although C-001..C-003 and SC-003 are purely negative invariants.'
- id: A14
  severity: medium
  category: charter
  summary: "Charter alignment gaps rather than violations: no artifact mentions the mandatory tmp/finding/ findings log and its worktree symlink, the visual-diff/maintainer-approval rule for the component change C-007 permits, or Quality Gate (5)'s tie between red-first and the ADR-11 list WP06 edits."
---

# Cross-Artifact Analysis — `webkit-timing-deflake-01M2T31J`

Checkout: `/home/jeroennouws/dev/team-kitty-missions/453/spec-kitty-design` @ `37d8ee6d` (`mission/webkit-deflake`, confirmed a descendant of `train/elements-first`).

## What checks out

Before the findings, the load-bearing facts I verified and found **correct**, because they change how the rest should be read:

- The plan's CSS reading is accurate. `packages/styles/src/progress/sk-progress.css` does declare the sweep on three layers (`.sk-progress__bar`, `::-webkit-progress-value`, `::-moz-progress-bar`), and the `@media (prefers-reduced-motion: reduce)` block does set `animation-name: none` **and** `background-position: 50% 0` on all three. **Correction 1 is right**: `:465`'s frame is deterministic by construction and has no phase to pin.
- Correction 3 is well-founded: two of the three animated layers are vendor pseudo-elements, so `getAnimations()` reachability is genuinely not safe to assume.
- Every cited line number resolves: `sk-progress.spec.ts` :369/:440/:456/:465/:510, `sk-team-overview-shell-layout.spec.ts` :104/:303/:445, `sk-workflow-board.spec.ts:557`, `sk-radio-choice-group.spec.ts:1113`.
- The "webkit cannot launch here" claim is corroborated by `vitest.config.mts`'s own comment and by `ci-quality.yml`.
- WP06's `owned_files: fixtures/**` **does** cover the warn-and-degrade tests — they live in `fixtures/elements-behaviour/src/`, not in `packages/`. The ownership concern raised for WP06 is not the one that bites; A7 and A8 are.
- WP04's "shared helper" (`loadComposition`) is defined inside its own spec file at line 35, so T033 is within WP04's ownership.

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | ownership | high | `tasks/WP02-sk-progress-hard-failures.md` (frontmatter `owned_files`, T012, T014); `plan.md` IC-01; spec C-007 | WP02's `owned_files` is exactly `apps/storybook/src/tests/sk-progress.spec.ts`. T014 requires making "the indeterminate fill render full-width under forced colors", "removing the reduced-motion rule" and "removing the sweep" — all three are edits to `packages/styles/src/progress/sk-progress.css`. T012's C-007 branch ("if it is a component defect") requires the same file. **No work package in this mission owns `packages/styles/**`.** C-007 is listed in WP02's and WP04's `requirement_refs` but is unexecutable by any seat. | Either add `packages/styles/src/progress/sk-progress.css` to WP02's `owned_files` with an explicit "mutate-and-revert for red-first; a persisting change requires a C-007 finding" note, or create a WP that owns the component surface. A constraint that no WP can act on is not a constraint. |
| A2 | ownership | high | `tasks/WP01-webkit-repeat-run-rig.md` (`authoritative_surface: scripts/**`, T001, T004); `.github/workflows/ci-quality.yml`; `playwright.config.ts`; `scripts/check-gate-wiring.mjs`, `scripts/check-ci-quality-trigger-parity.mjs` | WP01's Goal is "a single, reproducible **CI** invocation". The playwright job is defined in `.github/workflows/ci-quality.yml:634`; project selection, `retries`, `workers` and `testIgnore` are in `playwright.config.ts`. WP01 owns neither. Worse, two enforced gates (`check-gate-wiring.mjs`, which pins `[ENFORCED]` step shape and refuses `if:`/`continue-on-error` overrides, and `check-ci-quality-trigger-parity.mjs`) police that workflow's exact structure, so an ad-hoc job or step is a likely CI red rather than a neutral addition. | Decide explicitly whether the rig is (a) a `workflow_dispatch`-only job, (b) a script under `scripts/` that a human runs via the existing job, or (c) a local-to-CI one-off. Whichever it is, grant WP01 the file it must edit and state which enforced gate it must satisfy. |
| A3 | acceptance | high | `tasks.md` "Verification reality" §3 and WP01 Risks; WP02/WP03/WP04/WP05 "Independent test"; spec NFR-001, SC-001 | tasks.md states plainly that WP01's rig is the only viable route to NFR-001 ("Ten sequential CI runs per item is not a viable way to satisfy NFR-001. Therefore … that rig is WP01 and everything else depends on it"). WP01's own brief then authorises failure: "A rig that cannot reproduce at least one of the two known hard failures is not a rig — if a subset run cannot see what a full run sees, report that rather than proceeding." WP02, WP03, WP04 and WP05 each state their Independent test as "10/10 repeats green **under the WP01 rig**". If WP01 legitimately reports "no rig", four work packages have no acceptance path and the mission's headline success criterion is unmeetable — and no artifact defines what happens then. | Add an explicit fallback acceptance to tasks.md (e.g. "if WP01 reports no rig, NFR-001 degrades to N full-job green runs recorded with their run IDs, and SC-001 is reported as unproven with evidence"), and make WP01's failure a mission-level decision point rather than a per-WP surprise. |
| A4 | correctness | high | `playwright.config.ts:19-20`; `tasks.md` "Verification reality" §3; WP01 T002/T004; spec NFR-001, SC-001, C-001 | `retries: process.env['CI'] ? 2 : 0`, `fullyParallel: true`, `workers: process.env['CI'] ? 2 : undefined`. **Nothing in spec.md, plan.md, tasks.md or any WP mentions retries, workers or parallelism.** Under the repo default, a repeat that fails and then passes on retry is reported as *flaky* and the run still exits 0 — so a `--repeat-each=10` rig can report "10/10 green" over genuine failures. That is precisely the retry-wrapped green C-001 forbids, arrived at by inheriting a default rather than by choosing it. The observed "6 flaky" in the problem statement is itself a product of this setting. Separately, NFR-001 says "10 consecutive webkit **runs** of its spec" and SC-001 says "10 consecutive webkit runs"; tasks.md substitutes `--repeat-each=10` inside one job — ten repeats sharing one browser install, one server process and one machine's contention is a materially weaker property, and the substitution is made silently. | WP01 T001 must pin `--retries=0` and state the worker count, and the recorded invocation (T004) must show both. Either amend NFR-001/SC-001 to say "10 repeats within one job, retries disabled", or keep "consecutive runs" and say how they are obtained. Do not leave the two readings coexisting. |
| A5 | correctness | high | `plan.md` "Correction 2"; WP02 T010/T011; `apps/storybook/src/tests/sk-progress.spec.ts:435-437` | The plan states `:369` "failed because `sample1.left ≈ zeroSample.left`", and offers one unifying cause: a comparison fixture sampled before it painted reads as track colour. That mechanism does not apply to this assertion. The `zero` fixture's fill is 0%-wide **by definition**, so its `left` sample at `x=2` reads the empty track whether or not it has painted — painting state changes nothing on that side of the comparison. The only way `sample1.left ≈ zeroSample.left` can hold is if the **fixture under test** (the `clip-path`-clipped indeterminate fill, which under forced-colors occupies the *left* portion) had not painted at `x=2`. T010 instructs instrumenting "the comparison fixtures' full sample set" only; T011 then says "if refuted, STOP and re-diagnose". A run that shows `complete`/`zero` correctly painted would therefore read as *refuted* while the actual suspect was never sampled. (The hypothesis remains coherent for `:465`, where `completePixels.left`/`.right` genuinely could read as track when unpainted.) | Widen T010 to instrument **every** fixture each test reads, including the one under test, and to record which fixture's samples moved on the captured failure. Keep T011's stop-and-re-diagnose rule, but make "refuted" mean "no fixture was unsettled", not "the comparison fixture was fine". |
| A6 | coverage | high | spec NFR-003, SC-005; `tasks.md` (all WPs); `plan.md` "Verification" | No subtask in any work package measures the `playwright` job's duration, before or after. WP01 T002's baseline is failure/flake **counts** only. The before-figure is required to be "the pre-mission run", so it must be captured before any fix lands and nothing owns capturing it. NFR-003 and SC-005 therefore have **zero** task coverage. This is not academic: WP01 adds CI work and WP06 changes the vitest behaviour suite, whose own timing is gated separately by `suite-budget.json` and `scripts/measure-suite-time.mjs` — a file no artifact mentions. | Add a subtask to WP01 (it already reads CI) that records the pre-mission `playwright` job duration with its run ID, and a mission-wide closing subtask that re-reads it. If the 5% figure is not actually going to be measured, strike NFR-003 and SC-005 rather than carry unmeasured numbers into the accept gate. |
| A7 | ownership | high | WP06 `owned_files: fixtures/**`, T051/T052; `mutations.json`, `behaviours.json` (repo root); `scripts/suite-selftest.mjs`; `.github/workflows/ci-quality.yml:705-710`; `CLAUDE.md` §2 | T051 edits `fixtures/elements-behaviour/src/sk-*.test.ts`. Those exact files are the `subject` side of the repository's enforced mutation harness: `mutations.json` declares one red-first mutation per `(behaviour-id, subject)` pair and `scripts/suite-selftest.mjs` re-derives them, wired into CI as "[ENFORCED] Mutation harness — red-first is re-derived (NFR-002)". Its guards are strict — guard 4 requires the red test to carry an `[SC-NNN]` marker, guard 5 bounds collateral reds, guard 7 rejects any undeclared pair. Changing which assertions those tests run, or which of them go red, can break the harness, and `mutations.json`/`behaviours.json` sit at repo root where WP06 cannot touch them. T052 also duplicates, by hand, exactly what that harness already automates — no artifact mentions it exists. | Add to WP06 a pre-flight subtask that runs `node scripts/suite-selftest.mjs` before and after T051 and reports the mutation count, and either grant WP06 `mutations.json`/`behaviours.json` or state that any edit requiring them is a blocker to escalate. Re-point T052 at the existing harness instead of a hand-rolled proof. |
| A8 | correctness | medium | `plan.md` IC-06; WP06 T051; `fixtures/elements-behaviour/src/sk-ribbon-card.test.ts:212`, `sk-grid.test.ts:343`; `packages/elements/src/{ribbon-card,grid}/*.markup.ts` | The warn volume driver is the `for (const key of ['constructor','__proto__','toString','hasOwnProperty'])` loop, which calls the classes helper outside any `console.warn` capture block. That loop appears in **seven** behaviour fixtures, at nine sites. The plan and WP06 name five (`sk-card`, `sk-button`, `sk-pill-tag`, `sk-feature-card`, `sk-section-banner`) and omit `sk-ribbon-card.test.ts:212` and `sk-grid.test.ts:343` — both of which call `ribbonCardClasses`/`ribbonClasses` and `gridClasses`, verified to `console.warn` at `sk-ribbon-card.markup.ts:77,134` and `sk-grid.markup.ts:70,74`. Reducing only the named five leaves roughly two-ninths of the volume in place, and FR-008 could fail for a reason the artifacts told the implementer not to expect. | Replace the hardcoded five-file list in T051 with "every site matching the prototype-key loop, enumerated by a grep whose count is reported", and let T050's measurement, not the list, decide what is enough. |
| A9 | contradiction | medium | spec US1 AS1 and its "four tests that compare two captures"; `plan.md` Correction 1; WP02 T013; `sk-progress.spec.ts:369,409-427` | US1 AS1 quotes the phrase "two distinct points in the animation cycle" — that phrase is lifted verbatim from **`:369`'s test title** — and demands those become "explicitly selected phases". But `:369` runs under `emulateMedia({forcedColors:'active'})`, where the test itself asserts `samplesEqual(sample1, sample2) === true` and its own comment says "the clip and colour are both static now — there is no gradient left to sweep". There is no phase to select. The plan's Correction 1 makes exactly this argument, but only for `:465`; WP02 T013 correctly restricts phase selection to `:456`/`:510`. An implementer who reads spec.md first — which is the reading order the artifacts imply — will try to phase-pin a static test. US1 also says "the four tests that compare two captures"; the describe block contains five (`:369`, `:440`, `:456`, `:465`, `:510`). | Extend Correction 1 in plan.md to name `:369` alongside `:465`, and amend US1 AS1 so the phase-pinning obligation is scoped to `:456`/`:510` only. |
| A10 | ambiguity | medium | spec Problem + SC-001; `plan.md` Summary + Project Structure; `tasks.md` "Verification reality" §3 + WP01 Goal; WP03 T020 | The scope count does not converge. spec.md: "all eight `[webkit]`, across six specs"; SC-001: "The eight tests named in the tracking issue". plan.md: "**Nine** tests across six specs". The plan's own Source Code block and the six WP files together name only **five** spec files — the sixth is never identified anywhere, yet WP01's Goal and tasks.md both require running "the six affected specs". Compounding it, three items are parameterized `for` loops that generate multiple tests each (`:104` at 1280 and 1440; `:445` in light and dark; action-row `:110` per mode), and WP03's "the action-row Enter-key family" carries no line numbers at all while every other item in the mission is line-cited. SC-006 requires fixed + reported-unfixed to sum to "the scope", which no artifact defines. | Put a single enumerated table in tasks.md — one row per test, with spec file, line, generated variants, observed state (failed/flaky) — and make SC-001 and SC-006 count against that table. WP01 cannot select its input set until that table exists. |
| A11 | coverage | medium | `sk-progress.spec.ts:440-454`; spec FR-001..FR-003; WP02 | The test at `:440` ("Indeterminate forced-colors AND prefers-reduced-motion together") does `samplePixels` → `waitForTimeout(300)` → `samplePixels`, then asserts `samplesEqual(sample1, sample2)` and `sample1.left ≠ sample1.right` — the second assertion has exactly the unsettled-fixture-under-test exposure that A5 identifies in `:369`, in the same file, in the same describe block. It appears in no FR, no user story, no WP and no subtask. If WP02's fix for `:369` is "await the painted state of every fixture", `:440` needs it too, and nothing will tell the implementer that. | Name `:440` in WP02's scope (or state explicitly, with the tracking-issue evidence, why it is excluded). Whichever way, it should appear in the scope table A10 asks for. |
| A12 | testability | medium | spec SC-002, SC-003, NFR-002, NFR-004; `tasks.md` "Mission-wide acceptance"; `plan.md` "Verification" | All four rely entirely on the implementer truthfully self-reporting. tasks.md's "Mission-wide acceptance" lists the numbers to report but assigns the counting to no subtask and no reviewer, and no WP has a subtask that performs it. There is no mechanical detector: the only diff-shape gate in the repo is `scripts/check-visual-screenshot-softness.mjs`, which is about `toHaveScreenshot` hardness, not skips, `fixme`s, widened tolerances or increased timeouts. A wrong count would pass silently. NFR-004's "the after-form must cover at least the before-form" defines no comparison procedure at all, so even an honest implementer has no method. Note the irony that the repo already owns the right shape of mechanism for the behaviour suite (`mutations.json` + `suite-selftest.mjs`, CI-labelled "red-first is re-derived (NFR-002)") and no artifact proposes an equivalent for the playwright specs. | Add one mission-closing subtask that produces the counts from a mechanical source (e.g. `git diff` greps for `test.skip`/`test.fixme`/`.only`/`waitForTimeout(`/tolerance literals, with the command and its output recorded), and give NFR-004 a concrete form: a before/after table, one row per rewritten assertion, quoting both expressions. |
| A13 | acceptance | medium | `kitty-specs/webkit-timing-deflake-01M2T31J/acceptance-matrix.json` | The matrix the accept gate reads is unedited scaffold. All ten rows carry `"notes": "TODO: replace with a real acceptance criterion"` and `"description": "Verify FR-NNN is satisfied"`. It contains rows for FR-001..FR-010 only — **nothing** for NFR-001..NFR-006, C-001..C-007 or SC-001..SC-006, i.e. 10 of 29 requirement keys. `negative_invariants` is `[]` although C-001, C-002, C-003 and SC-003 are wholly negative invariants and are the mission's main integrity claim. `proof_type` is `automated_test` for every row including FR-006 and FR-010, which are report-only by design. | Populate the matrix before implementation starts: real criteria for the FRs, rows for the NFR/C/SC keys the mission actually grades on, the C-001..C-003 suppression bans as `negative_invariants`, and `proof_type` corrected to a manual/report kind for FR-006 and FR-010. |
| A14 | charter | medium | `.kittify/charter/charter.md` §"Findings Log Practice", §"Quality Gates", §"Branch Strategy"; `plan.md` "Charter Check" | Three gaps, all omissions rather than contradictions (see Charter Alignment Issues below for why I did not escalate). (a) The charter requires every reasoning-loop failure and skill-invocation error to be logged to `tmp/finding/`, with a lane worktree's `tmp/finding/` **symlinked** to the root's — no artifact mentions either, and this mission will run in lane worktrees. (b) The charter requires "a screenshot or visual diff for any component change" plus one maintainer approval for component-file PRs; the plan's Charter Check contemplates a `packages/styles` change under C-007 and names neither obligation. (c) Charter Quality Gate (5) ties red-first proof to the ADR-11 required-behaviours list; WP06 edits precisely those behaviour-suite files (see A7) without acknowledging the gate. | Add a "charter obligations" line to tasks.md covering the `tmp/finding/` symlink, and extend the plan's Charter Check to state what a C-007 component change would trigger (visual diff + maintainer sign-off + the ADR-11 red-first gate). |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|---|---|---|---|
| FR-001 | yes | T013 | Phase selection, correctly scoped to `:456`/`:510`. Contradicted by spec US1 AS1 (A9). |
| FR-002 | yes | T010, T011, T012, T014 | Experiment-first sequencing is genuinely well constructed. T014's proof is unownable (A1). |
| FR-003 | yes | T010, T011, T012, T014 | Same as FR-002. |
| FR-004 | yes | T020, T022 | Target tests unnumbered (A10). |
| FR-005 | yes | T021, T022 | `sk-workflow-board.spec.ts:557` verified to exist and match. |
| FR-006 | yes | T030, T031 | Honest either-way framing; T031's "without widening it into a range" is the right guard. |
| FR-007 | yes | T040, T041 | `sk-radio-choice-group.spec.ts:1113` verified. |
| FR-008 | yes | T050, T051, T053 | File list incomplete (A8); harness collision unaddressed (A7). |
| FR-009 | yes | T051, T052 | T052 duplicates an existing enforced harness (A7). |
| FR-010 | partial | T032, T054 | Per-WP only. No mission-level subtask assembles the unfixed-item report that SC-006 grades. |
| NFR-001 | contingent | T001-T004, T023, T042 | Wholly dependent on WP01 (A3); unit silently redefined and retries unaddressed (A4). |
| NFR-002 | partial | T014, T022, T034, T041, T052 | Proofs are produced; **no subtask performs the count or the equality check** (A12). |
| NFR-003 | **no** | — | Zero coverage. No subtask measures job duration, before or after (A6). |
| NFR-004 | sentence only | — | Asserted in WP02 prose ("They must not be weakened"). No subtask records before/after forms; no defined comparison (A12). |
| NFR-005 | yes | T050, T053 | The one NFR with a clean, mechanical before/after. |
| NFR-006 | sentence only | — | Stated as a rule in `plan.md` "Verification" and `tasks.md` §1. No subtask produces or checks the engine attribution. |
| C-001 | partial | — | Prose in WP02/WP04. The counting that would detect a violation is unassigned (A12). |
| C-002 | sentence only | — | Prose only. |
| C-003 | sentence only | — | Prose in WP02/WP03 Risks only. |
| C-004 | yes | T054 | Well handled — WP06's "claim no root cause before the error text is read" is explicit and repeated. |
| C-005 | yes | (structural) | `tasks.md` §"Verification reality" establishes it with a measured positive control. Good work. |
| C-006 | sentence only | — | `plan.md` header and spec only. WP frontmatter `merge_target_branch: mission/webkit-deflake` is consistent with a mission PR onto the train; nothing verifies the PR base at the end. |
| C-007 | **unexecutable** | — | Listed in WP02/WP04 `requirement_refs`; no WP owns `packages/styles/**` (A1). |
| SC-001 | contingent | via WP01 | Depends on A3/A4 resolving, and on a scope count that does not exist (A10). |
| SC-002 | **no counter** | — | See NFR-002 / A12. |
| SC-003 | **no counter** | — | "Verified by reading the diff" — by whom, is never said (A12). |
| SC-004 | yes | T053 | Clean. |
| SC-005 | **no** | — | Zero coverage (A6). |
| SC-006 | partial | T032, T054 | No mission-level reconciliation subtask; the denominator ("the scope") is undefined (A10). |

## Charter Alignment Issues

I looked for a charter *violation* and did not find one, so I am raising no CRITICAL. Specifically, the two charter rules most likely to be broken by a mission of this shape both hold:

- **Branch Strategy.** The charter requires every mission PR to branch off and merge back into `train/elements-first`, and forbids any mission PR targeting `main`. `mission/webkit-deflake`'s recorded `base_commit` `5282172` is confirmed a descendant of `train/elements-first` (`git merge-base --is-ancestor`), and C-006 plus `plan.md`'s header both target the train explicitly and explicitly decline to delegate the train→main merge. Correct.
- **Testing Standards / suppression.** Nothing in any artifact instructs anyone to skip, quarantine or widen anything; C-001..C-003 are stronger than the charter requires. The weakness is enforcement (A12), not intent.

The three gaps that remain are omissions, recorded as A14 (medium): the mandatory `tmp/finding/` log and its lane-worktree symlink appear in no artifact; the plan's Charter Check contemplates a `packages/styles` change without naming the charter's visual-diff and maintainer-approval obligations for component changes; and WP06 edits the ADR-11 behaviour-suite files that Quality Gate (5) and the enforced mutation harness both depend on, without acknowledging either.

One further note for the operator: the charter's Review Policy makes the adversarial squad a standing order with tiered earlier point-cuts, and this analysis is one of those point-cuts. It is report-only; nothing here should be folded by editing the artifacts without the mission owner's decision.

## Unmapped Tasks

Three subtasks map to no FR/NFR/C/SC key. All three are good additions and the point is only that the acceptance surface will not grade them:

- **T003** (check each spec for a one-way mutation of a shared fixture before repeating it) — a genuinely sharp precondition on NFR-001's validity; it deserves to be a named gate on the rig, not a loose subtask.
- **T015** (report the `samplePixels` edge-offset fragility at `x=2` / `x=w-3` on an antialiased pill radius) — a latent-fragility finding with no requirement to land in. FR-010 is the nearest home.
- **T033** (examine the shared helper `sk-team-overview-shell-layout.spec.ts` uses, given `:303` also flaked) — verified: the helper is `loadComposition` at line 35 of that same file, so it is within WP04's ownership. Maps to no key.

No subtask is redundant with another. The most notable *duplication* is structural rather than wasteful: `tasks.md`'s WP bodies and the six `tasks/WP0*.md` files restate each other nearly verbatim, and `plan.md`'s IC-01..IC-06 restate them a third time; any correction folded from this analysis must be applied in all three places or they will drift.

## Metrics

| Metric | Value |
|---|---|
| Total requirements | 29 (FR 10, NFR 6, C 7, SC 6) |
| Total tasks (subtasks) | 27 (T001-T004, T010-T015, T020-T023, T030-T034, T040-T042, T050-T054) |
| Requirements with real subtask coverage | 16 / 29 — **55%** |
| Requirements with zero coverage | 2 (NFR-003, SC-005) |
| Requirements covered by a sentence no subtask performs | 6 (NFR-004, NFR-006, C-002, C-003, and the counting halves of NFR-002/SC-002/SC-003) |
| Requirements unexecutable as scoped | 1 (C-007 — no WP owns `packages/styles/**`) |
| Ambiguity count | 6 |
| Duplication count | 2 |
| Critical issues | 0 |
| High issues | 7 |
