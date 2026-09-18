---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: webkit-timing-deflake-01M2T31J
mission_id: 01M2T31JBYZYD2AMQ16JD08Z4Y
generated_at: '2026-09-18T13:08:04.361080+00:00'
analyzer_agent: unknown
input_artifacts:
  spec.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/spec.md
    sha256: cd103566990ae0c0127ef247f62064210e00c3229af4525009e5727e11769a50
  plan.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/plan.md
    sha256: 866241cd53ba75651d0246a822df67451c76fe3d3b3b0cc2bd98939c2fd58586
  tasks.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md
    sha256: 6a4bd2ec9c88d17edbf3b7129bc579f21bcc67da296bf8b4f7e346b52d1c024f
  charter:
    path: .kittify/charter/charter.yaml
    sha256: 027fa1ef1a203b970e2688e837774cfeadacbdcec1e42897633d0a243ace0071
verdict: blocked
issue_counts:
  critical: 0
  medium: 3
  low: 1
  high: 2
  info: 0
findings:
- id: E1
  severity: high
  category: correctness
  summary: spec.md's Problem section still asserts the defect is in when a test looks and not in what it claims - falsified for items 1 and 4 by 0/10 - and it steers WP02 away from the component-regression candidate that a deterministic post-font-change failure makes live.
- id: E2
  severity: high
  category: acceptance
  summary: Items 7, 11 and 12 already pass 20/20, 10/10 and 60/60 at baseline, so SC-001 and WP03's and WP05's Independent tests are satisfied before any work - both packages can close on an empty diff and still show green.
- id: E3
  severity: medium
  category: correctness
  summary: Correction 5 and WP04's T030 rest on item 7's loadComposition timeout, and item 7 is the one shell-layout item the rig cannot reproduce while items 6, 8 and 9 all show real distributions.
- id: E4
  severity: medium
  category: contradiction
  summary: 'The NFR-004 rewrite did not propagate: tasks.md still asserts a 5% tolerance that no longer exists and argues a figure now inside the measured band, and plan.md IC-07 still reads as a single-figure delta.'
- id: E6
  severity: medium
  category: verification
  summary: T007's suppression scan and the duration reporter exist only on WP01's lane and are wired into no gate, so SC-002, SC-003 and SC-005 depend on an orchestrator remembering to run two scripts that nothing compels.
- id: E5
  severity: low
  category: ambiguity
  summary: The Canonical scope Observed column is now superseded by the T003 baseline for every row, and nothing states which of the two governs NFR-001 and SC-001 grading.
---

# Cross-Artifact Analysis (round 5) — `webkit-timing-deflake-01M2T31J`

Scoped to the deltas since round 4, as asked. Checkout at `519af49c`.

## Cheap checks first

- **`#N` sweep: clean.** `grep -oEn '#[0-9]+'` over `spec.md`, `plan.md`, `tasks.md` returns nothing (rc=1), and so does the same sweep over all six `tasks/WP0*.md` and `evidence/T003-baseline.md`. The issue-matrix trap is not reintroduced.
- **D4 closed.** `WP04`'s `requirement_refs` is now `FR-007, FR-008, FR-013, NFR-001, NFR-003, C-001, C-010, C-012` — `C-007` gone. WP02 retains both `C-007` and `C-011`.
- **Evidence file.** `evidence/T003-baseline.md` is the strongest artifact this mission has produced. It states its engine, its run id, its head SHA, that `--retries=0` was an explicit CLI override of `playwright.config.ts:19` rather than an inherited default, and — unprompted — it records cross-run instability on unmodified code five minutes apart (item 3: 6/10 → 3/10) as independent confirmation from a source that is not this workstation. It also self-reports the two results that damage the mission's own thesis. That is the standard the rest of the mission's evidence should be held to.
- **One process note:** `status.json` and `status.events.jsonl` are modified and uncommitted in the working tree. If the recorder refuses on `DIRTY_WORKTREE` these are mission-state files, so I will report rather than touch them.

## Your framing question

**Yes, spec.md and plan.md now misdescribe their subject, and yes it needs correcting before WP02 implements — but narrowly, two sentences, not a re-plan.**

`spec.md`'s Problem section still reads: *"The recurring shape is that a test waits for a **duration** and then asserts on whatever the runner happened to render by then. Every affected test asserts something real; **the defect is in *when* it looks, not in *what* it claims.**"*

That last clause is a conclusion, not an observation, and the measurement has falsified it for the two items that carry the mission. It is also the single most consequential sentence in the artifacts right now, because it tells the P0 package — the one holding the `packages/styles/src/progress/**` grant and `C-007` — that the component is not a candidate. A test that passed at `ee324f84`, fails 0/10 after a font change, and shows no distribution at all is at least as consistent with a **real rendering regression** as with a test-side settling bug. Right now the spec pre-empts that branch.

**Where I agree with you, and why:** Correction 2 is **not** refuted, and I would resist any pressure to rewrite it. A fixture that never paints inside the fixed wait fails every repeat, so 0/10 is fully compatible with the unsettled-fixture hypothesis — it just means the condition is now permanent rather than occasional, which is exactly what an extra webfont fetch on every load would produce. More importantly, T010 still discriminates cleanly, and this is worth stating in the artifacts because it is the reason not to panic:

- fixtures read **unpainted** at sample time on all ten → hypothesis confirmed; the cause is timing-shaped but deterministic under current conditions, and awaiting paint is the right fix;
- fixtures read **painted** and the samples still match → hypothesis refuted, and what remains is a rendering change, i.e. a C-007 component finding.

So the experiment got *more* valuable, exactly as your evidence file says. What has to change is the framing that forecloses the second branch, not the hypothesis.

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| E1 | correctness | high | `spec.md` Problem §3 ("the defect is in *when* it looks, not in *what* it claims"); `spec.md` US1 title and AS5–AS7; `plan.md` Summary; `evidence/T003-baseline.md` | The Problem section's closing clause is falsified for items 1 and 4 and is the framing WP02 will read first. `US1` is still titled "The sk-progress assertions **measure a settled, chosen state**", and its acceptance scenarios are all shaped as *"Given the fixes, when X is broken, then item N fails"* — every one presupposes a test-layer fix exists. Nothing in spec.md or plan.md tells WP02 that a deterministic 0/10 after a font change admits a component regression, or that C-007 plus C-011 is the path if T011 lands there. The ownership grant for that path exists (round 1's A1); the framing that would let a seat use it does not. | Two edits. (1) Qualify the Problem clause: it is the tracking issue's thesis, it holds for the items that show distributions, and T003 falsified it for items 1 and 4. (2) Add one acceptance scenario to US1: *given items 1 and 4 fail 0/10 and passed at `ee324f84`, when T011 judges the hypothesis, then a refuted result is reported as a C-007 component finding under C-011, not worked around in the test.* Do not touch Correction 2. |
| E2 | acceptance | high | `evidence/T003-baseline.md` Results; `spec.md` SC-001, NFR-001; `tasks/WP03-await-observable-effects.md` and `tasks/WP05-radio-choice-group-settle.md` Independent tests | Items 7 (20/20), 11 (10/10) and 12 (60/60) **already pass at baseline, before any work**. SC-001 reads "All twelve scope items report zero failures and zero flakes across 10 repeats under the rig", and WP03's and WP05's Independent tests read "10/10 repeats green". Item 11 is the whole of WP05; items 10 and 12 are the whole of WP03, and 12 is 60/60 with 10 at 8/10. So **WP05 can be closed today with an empty diff and satisfy its Independent test**, and WP03 can satisfy half of its. This is the green-over-an-empty-set shape: a criterion that passes without the work having been done proves nothing about the work. Nothing in the artifacts records the non-reproduction, and no criterion requires a before/after comparison — only an after-reading. | Make the acceptance a **delta**, not an absolute: for any item whose baseline is already 10/10, the WP must either (a) demonstrate the failure under some other condition and then hold 10/10, or (b) report it as not-reproduced with its evidence and hand it to FR-013/SC-008 rather than count it as fixed. Also record the three baselines in the Canonical scope table so a reviewer sees that a green result there was green before anyone touched it. |
| E3 | correctness | medium | `plan.md` Correction 5 and IC-04:188; `spec.md` US3:120; `tasks/WP04-shell-layout-premise.md` T030 | Correction 5's inference is *"one shared suspect, not four coincidences"*, and its sole cited evidence is item 7's train failure — `getByTestId('overview-shell')` not found after 5000ms, the composition never appeared. T003 measures item 7 at **20/20 across both viewport variants**, while its three file-mates show real distributions (6: 9/10 @1280, 8: 8/10, 9: 7/10 dark). So the one item that produced the smoking gun is the one item in that file the rig cannot reproduce. **The inference survives** — three of four still flake and all four go through `loadComposition` — but the evidence offered for it does not, and T030 instructs WP04 to start from a failure signature the rig has never shown it. A seat that goes looking for a 5000ms not-found will not find one and may conclude the helper is sound. | Keep T030's ordering — it is still the right place to start, on the strength of items 6, 8 and 9. Replace the justification: cite the three items that *do* reproduce, and record item 7's 20/20 alongside its train failure so the seat knows the signature is not currently reproducible. |
| E4 | contradiction | medium | `tasks.md:22` vs `spec.md` NFR-004 and `tasks.md:106`; `plan.md` IC-07:216-219 | The NFR-004/SC-005 rewrite landed in `spec.md`, in `tasks.md`'s acceptance block and in WP01's T006/T006a, but not in two places. (1) **`tasks.md:22`** still reads *"NFR-004's tolerance is **5%**, and '~27 min' is 5.5% off, so the two numbers disagree about whether an unchanged job already passes."* NFR-004 no longer has a 5% tolerance — it was rewritten because 5% sat inside the noise — and the argument is now backwards: the measured band is 22.5–26.7, so 26.7 is **inside** it and ~27 min is not meaningfully different from 25.6 after all. That sentence was my own B6 fix and it is now stale in the opposite direction; `tasks.md` contradicts itself between line 22 and line 106. (2) **`plan.md` IC-07** still reads "The pre-mission duration is **25.6 min** … record the final run's duration and **the delta**" — one figure, no band, no 18.7% spread, no "do not gate on a percentage". plan.md was the file skipped in round 3 for B6 and it is the file skipped again for this change. | Rewrite `tasks.md:22` to state the band and why no percentage tolerance is used, and bring IC-07 in line with NFR-004. Worth noting the pattern: this is the third time a numeric correction has landed in spec.md and tasks.md and missed plan.md. A grep for the old figure across all three before committing would have caught all three. |
| E6 | verification | medium | `scripts/scan-mission-suppressions.mjs`, `scripts/report-playwright-duration.mjs` (on `kitty/mission-webkit-timing-deflake-01M2T31J-lane-a@feeeb034`); `spec.md` SC-002, SC-003, SC-005; `tasks/WP01-webkit-repeat-run-rig.md` T007 | WP01's own reviewer raised this and it is correct. The two scripts are wired into **nothing**: `grep` over `.github/workflows/`, `scripts/check-gate-wiring.mjs` and `package.json` returns no reference to either. SC-003 says it is "**verified mechanically**" and SC-002 says "**WP01's scan reports both counts**" — but the scan runs only if a human remembers to run it, and no subtask in WP02–WP06, no Independent test and no mission-wide acceptance line obliges anyone to. That is the round-2 A12 finding one level along: a self-certified claim was replaced by a script, and the script is itself self-invoked. A passing check is not an enforced rule; the question is what invokes it, and the answer here is "nobody". (Related, from the same review: **T004 was marked done with no artifact** recording which specs were checked for one-way fixture mutation. The reviewer re-did the audit independently and confirmed the conclusion, so the substance holds — but the written trail T004 was supposed to leave does not exist, and `evidence/` contains only `T003-baseline.md`.) | Give the invocation an owner that cannot be skipped: add it to WP01's T007 as a required pre-PR step recorded in `evidence/`, or better, name it in SC-008's report so the mission report cannot be assembled without the numbers. If it is meant to be a CI gate, register it — `check-gate-wiring.mjs` is the mechanism and round 4's C2 is the precedent. |
| E5 | ambiguity | low | `spec.md` Canonical scope "Observed" column; `evidence/T003-baseline.md` Results | The table's Observed column records what three CI runs reported before the mission started; the baseline records what the rig measures now, and the two disagree in kind for several rows — item 5 is "flaky (PR)" against 1/10, item 3 is "flaky (PR), failed (train)" against 3/10, item 7 is "flaky (train)" against 20/20. Both are legitimate and neither is wrong, but nothing says which governs NFR-001/SC-001 grading, and the table is labelled "the single source of truth for what is in scope". | Add a column or a line: the Observed column is historical provenance; `evidence/T003-baseline.md` is the measured baseline that NFR-001 and SC-001 grade against. |

## Coverage Summary

Not re-derived, per your scoping. The round-4 position stands — every FR/NFR/C/SC has a performing subtask or a named owner — with two changes: NFR-004/SC-005 remain covered by T006/T006a but their text is now inconsistent across artifacts (E4), and SC-001's grading basis is newly ambiguous (E2, E5).

| Requirement Key | Has Task? | Task IDs | Notes |
|---|---|---|---|
| NFR-004 / SC-005 | yes | T006, T006a | Band-based now. Text not propagated to `tasks.md:22` or plan IC-07 (E4). |
| NFR-001 / SC-001 | yes | T003 + per-WP repeats | Satisfied at baseline for items 7, 11, 12 without work (E2). |
| FR-007 / FR-008 | yes | T030–T033 | T030's cited evidence not reproducible (E3). |
| FR-001 / FR-002 / FR-003 | yes | T010–T012, T015, T015a | Framing that precedes them is falsified (E1). |
| all others | unchanged | — | See round 4. |

## Charter Alignment Issues

None new. C-007 correctly left WP04 and correctly stayed on WP02, which is the package E1's second edit would send down the component path.

## Metrics

| Metric | Value |
|---|---|
| Deltas verified | 4 of 4 (NFR-004/SC-005 rewrite, `#N` removal, WP04 C-007 drop, evidence file) |
| Deltas fully landed | 3 of 4 (the NFR-004 rewrite is partial — E4) |
| Requirements newly contradicted by measurement | 1 (SC-001, for three of twelve items) |
| Artifact claims the baseline does not support | 3 (items 7, 11, 12) |
| `#[0-9]+` occurrences in spec/plan/tasks/WP/evidence | 0 |
| Critical issues | 0 |
| High issues | 2 |
| Deliverables reachable only on WP01's lane | 4 (rig workflow, rig script, suppression scan, duration reporter) — supplied to lanes b–e by the approved-dependency merge; verified, not a defect |

## Read on the loop

Rounds 1–4 were editorial and reached diminishing returns; this round is not the same activity and it was worth running. Every finding here comes from a measurement that did not exist before, and E1 and E2 are both cases where reality contradicted the plan rather than the plan contradicting itself. That is the healthy failure mode, and it is what dispatching WP01 first bought.

E1 and E2 are cheap — three sentences and one acceptance rewrite — and both should land before WP02 and WP05 are dispatched, because both change what a seat would conclude. E3 and E4 can ride along. I would not run a round 6 on the documents after that; the next thing worth analysing is T010's result.
