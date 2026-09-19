---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: webkit-timing-deflake-01M2T31J
mission_id: 01M2T31JBYZYD2AMQ16JD08Z4Y
generated_at: '2026-09-18T13:36:50.056399+00:00'
analyzer_agent: unknown
input_artifacts:
  spec.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/spec.md
    sha256: 0176f0ef5f6eee760f3a4ef18a86f91fba974143f120d60827436d95dc998bbc
  plan.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/plan.md
    sha256: 7ff19c84a1dc9ba7254d8af7cf93117e4f68b613aca7fb9768b8a0ef67a992ea
  tasks.md:
    path: kitty-specs/webkit-timing-deflake-01M2T31J/tasks.md
    sha256: 609e234003c42c91d33f9ae3c3df951d3c30056af3fc4c105a8f9c88d1a5a64b
  charter:
    path: .kittify/charter/charter.yaml
    sha256: 027fa1ef1a203b970e2688e837774cfeadacbdcec1e42897633d0a243ace0071
verdict: blocked
issue_counts:
  high: 1
  medium: 1
  low: 0
  critical: 0
  info: 0
findings:
- id: F1
  severity: high
  category: acceptance
  summary: "E2's delta rule landed in SC-001 but not in the WP files that gate the work: WP03 and WP05 still read 'Independent test: 10/10 repeats green', which items 12 and 11 already satisfy at baseline, so WP05 can still be closed on an empty diff."
- id: F2
  severity: medium
  category: correctness
  summary: E3's correction landed in plan.md Correction 5 but WP04's T030 still cites item 7's 5000ms getByTestId timeout verbatim - the refuted evidence, in the document the seat actually works from.
---

# Cross-Artifact Analysis (round 6) — `webkit-timing-deflake-01M2T31J`

Scoped to confirming the six round-5 fixes, as asked. Checkout at `d3d6ae76`; working tree clean. I did not go hunting, and every finding below is a direct check of one of the six.

## Four of six are fully closed

- **E1 — closed, and better than I asked for.** The Problem section no longer contains the "the defect is in *when* it looks, not in *what* it claims" clause at all; it states the falsification, cites the 0/10 baseline, contrasts it against the distributions in the same run, and keeps the unsettled-fixture hypothesis explicitly alive ("a fixture that never paints inside the wait also fails every repeat"). US1 scenario 8 routes a refuted T011 to a C-007 finding under C-011 and says "never worked around in the test". Both branches are open and named, which is exactly what WP02 needed.
- **E4 — closed.** `tasks.md:22` now reads "**There is no percentage tolerance**" and states the 22.5–26.7 band; `plan.md` IC-07 records against the band rather than a single-figure delta. The one surviving "5%" is SC-005's parenthetical explaining why the tolerance was removed — that is history, correctly kept, not a residual.
- **E5 — closed.** The Canonical scope section now says plainly that `evidence/T003-baseline.md` governs NFR-001/SC-001 grading and that the Observed column is how each item first surfaced under `retries: 2`.
- **E6 — closed as scoped.** SC-008 requires both scripts' output embedded verbatim and states the reason. See my judgement on its sufficiency below.
- **`#N` sweep: 0** across spec, plan, tasks, all six WP files and `evidence/`.

## Two landed in the wrong document

Both are the same shape, and it is the shape that has recurred through this mission: the correction reached the artifact that describes the work and not the artifact that governs it. `tasks.md` states that each package's "subtasks, risks and independent test live in its own file under `tasks/`, which is the single source for that detail" — so the WP file is what a seat executes and what its reviewer checks.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| F1 | acceptance | high | `tasks/WP05-radio-choice-group-settle.md:46`; `tasks/WP03-await-observable-effects.md:51`; `spec.md` SC-001 | SC-001 is now a proper delta and says outright that "a work package whose entire scope is already green at baseline cannot be closed on an empty diff". That sentence exists only in spec.md. **WP05's Independent test still reads, in full: "10/10 repeats green; one red-first proof."** Item 11 is WP05's entire scope and it is **10/10 at baseline**. WP03's still reads "10/10 repeats green; two red-first proofs"; item 12 is **60/60 at baseline**. I grepped WP03, WP04 and WP05 for `baseline`, `not reproduced` and `empty diff`: **zero hits in all three**. So the gate a reviewer actually applies to WP05 is still satisfiable by doing nothing — which is the precise hole E2 was raised to close, surviving in the operative document. This matters now rather than later because WP02–WP05 are the packages about to be dispatched. | Two lines. In WP05: "Item 11 is 10/10 at the T003 baseline — a green repeat count proves nothing here. Either demonstrate it failing under another condition and then hold it green, or report it **not reproduced** under FR-013/SC-008. It may not be counted as fixed, and this package may not close on an empty diff." Same for WP03 naming item 12 at 60/60 (item 10 at 8/10 is a real target and unaffected). WP04 needs it only if item 7 is left unreproduced. |
| F2 | correctness | medium | `tasks/WP04-shell-layout-premise.md:49` (T030) vs `plan.md` Correction 5 | Correction 5 is corrected thoroughly — it says the evidence originally offered was the wrong item, records item 7 at 20/20 as the one shell-layout item the rig cannot reproduce, re-grounds the inference on items 6/8/9, and supplies the right citation (the `loadComposition` failure actually observed on item 8 at `sk-team-overview-shell-layout.spec.ts:78`). **WP04's T030 still carries the old citation verbatim**: "on the train item 7's failing attempt reported `getByTestId(\"overview-shell\")` not found after 5000ms — the composition never appeared." A seat reads T030, goes looking for that signature, and the rig will never show it — the exact outcome E3 existed to prevent. T030's ordering is right and should not change; only its justification is stale. | Replace T030's second sentence with the item-8 citation and add item 7's 20/20, mirroring Correction 5. One sentence. |

## Your two judgement calls

**1. Scripts embedded in the report rather than gated — acceptable here, and I would not register them.** You are right that binding the report is weaker than binding the mission, and the specific residual is real: nothing detects a report assembled with stale output, or with plausible numbers a human typed. But registering these two in `check-gate-wiring.mjs` is the wrong instrument. C2's precedent works because `check-commitlint-config.mjs` is a permanent repo gate; `scan-mission-suppressions.mjs` and `report-playwright-duration.mjs` are mission-lifetime scripts, and registering them would leave dead registry entries the moment this mission merges — which is its own defect class in a file whose entire purpose is that registry's integrity. The proportionate close is cheaper: have SC-008 require the scripts to be run **against the final PR head SHA, with that SHA recorded beside the output**. A reviewer can then re-derive both numbers in seconds and see immediately if they were taken against a different tree. That removes the stale-or-fabricated hole without inventing a permanent gate. Not raised as a finding — SC-008 as written is a genuine improvement and the mission PR gets an adversarial squad regardless.

**2. T004 — agree, do not reopen.** The audit exists: WP01's reviewer independently checked all five affected spec files for `describe.serial`, `beforeAll` and worker-scoped fixtures, found none, and recorded that in the approval note, which is durable state. The claim T004 backs — that repeat counts are meaningful — is therefore supported by evidence that exists; only its authorship is not the implementer's. Reopening an approved package to relocate an audit already performed and recorded buys nothing and costs a cycle. One cheap carry-forward instead: fold that conclusion into the SC-008 report so it does not live solely in `status.json`, where a reader of the mission's evidence will not find it.

## Coverage Summary

Not re-derived, per your scoping. The round-4/5 position stands; the only movement is that SC-001's grading basis is now correct at mission level and not yet at package level (F1).

| Requirement Key | Has Task? | Notes |
|---|---|---|
| NFR-001 / SC-001 | yes | Delta-based in spec.md; WP03/WP05 Independent tests not updated (F1). |
| FR-007 / FR-008 | yes | Correction 5 fixed; T030's citation not (F2). |
| FR-001 / FR-002 / FR-003 | yes | Framing corrected; both causal branches now open (E1). |
| NFR-004 / SC-005 | yes | Band-based in all three artifacts (E4). |
| SC-002 / SC-003 / SC-008 | yes | Output embedded in the required report (E6); see judgement 1. |
| all others | unchanged | See round 4. |

## Metrics

| Metric | Value |
|---|---|
| Round-5 findings verified closed | 4 of 6 (E1, E4, E5, E6) |
| Round-5 findings landed in the wrong document | 2 (E2 → F1, E3 → F2) |
| Genuinely new problems found | 0 |
| `#[0-9]+` occurrences across spec/plan/tasks/WP/evidence | 0 |
| Residual live "5%" tolerances | 0 |
| Critical issues | 0 |
| High issues | 1 |

## Plainly

Nothing new is broken and I found nothing outside the six. Two of the six landed in the describing document instead of the governing one, and the total remedy is **three sentences across two WP files** — two in WP05/WP03, one in WP04's T030. F1 is worth the extra cycle only because WP05's gate currently passes on an empty diff and WP05 is in the dispatch batch; if it were not, I would have called it low and told you to ship. Make those three edits, record, and dispatch all four. There is nothing else in these documents worth another round.
