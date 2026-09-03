---
work_package_id: WP06
title: CI wiring, engine coverage, the gate, and the budget
dependencies:
- WP01
- WP03
- WP04
- WP05
requirement_refs:
- FR-005
- FR-013
- FR-014
- NFR-001
- NFR-003
- NFR-004
planning_base_branch: mission/elements-verification-harness
merge_target_branch: mission/elements-verification-harness
branch_strategy: Planning artifacts for this mission were generated on mission/elements-verification-harness. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-verification-harness unless the human explicitly redirects the landing branch.
subtasks:
- T014
- T015
- T016
- T017
phase: Phase 4 - Gate
history:
- timestamp: '2026-09-03T02:30:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: .github/workflows/ci-quality.yml
create_intent:
- scripts/measure-suite-time.mjs
- suite-budget.json
execution_mode: code_change
owned_files:
- .github/workflows/ci-quality.yml
- scripts/measure-suite-time.mjs
- suite-budget.json
- docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md
tags: []
tracker_refs: []
---

# WP06 — CI wiring, engine coverage, the gate, and the budget

Merges two concerns an earlier draft separated, because both edited this workflow.

## FIRST TASK: run the suite on WebKit

**No behaviour has ever run on WebKit.** The spike could not launch it — Fedora 44 lacks
Playwright's Ubuntu-targeted libraries. It works on `ubuntu-latest`. Given engine-specific
CSSOM, `ElementInternals` and `adoptedStyleSheets` differences, **expect at least one
divergence**, and find it before the rest of the wiring assumes it passes. That divergence
is the whole reason ADR-11 chose a real browser over a simulated DOM.

## The gate: four edits, and the `if:` is not one of them

`gate`'s workflow-level `if:` is **`always()`** and must stay that way — editing it breaks
the job's failure reporting. The real gate is the shell disjunction inside its `[ENFORCED]`
step. FR-014's earlier wording named the wrong mechanism and would have sent an implementer
either to break `always()` or to conclude the work was already done.

1. add `test` to `needs:`
2. add its `echo` line to the status block
3. add `[ "${{ needs.test.result }}" != "success" ]` to the final disjunction
4. give it **no entry in the skipped-tolerance block**. FR-003 makes the job
   unconditional, so `skipped` is never legitimate for it — it must be tested strictly like
   `needs.changes`, or a PR setting `if: false` on the test job passes `gate`. That bypass
   is documented in the workflow's own comments as having been closed once already.

## Subtasks

- **T014** — Add the test job. Explicit `npx playwright install --with-deps chromium
  webkit` — `npm ci --ignore-scripts` everywhere means nothing downloads browsers
  implicitly. There is no cross-job browser cache in this workflow, so NFR-003's "already
  installed" claim was false and is withdrawn; the install is priced, not avoided.
- **T015** — Wire `check-part-ratchet.mjs` (WP04) into `lint-code`.
- **T016** — The four gate edits above.
- **T017** — `scripts/measure-suite-time.mjs` + `suite-budget.json` recording
  `{budget, measured, run URL, sha}`, failing above the ceiling. A **ceiling**, not
  exact-equality — wall-clock is noisy, unlike `measure-elements-sizes.mjs --check`'s byte
  counts. It reads wall-clock, which is in **no** reporter output, so it is not the same
  reader as WP01's floor and must not be merged with it.

## Definition of Done

- [ ] The suite runs on WebKit in CI, and any divergence from chromium is recorded — fixed
      if it is the element's fault, documented if it is the engine's.
- [ ] A failing test turns **`gate`** red, not merely the test job. Demonstrated.
- [ ] A test job set to `if: false` **fails** `gate` rather than being tolerated.
      Demonstrated — this is the bypass the strict treatment exists to close.
- [ ] `suite-budget.json` records the measured figure with the run it came from, and
      states whether the ceiling covers the suite alone or suite + selftest. The selftest
      is 5–10× the suite, so this is not a detail.
- [ ] NFR-004: the a11y, visual-regression and Playwright jobs report the same counts as
      before this mission — 76 stories, 27 tests, 3 baselines.
- [ ] ADR-11's Consequences amended: **"One browser stack, one config, two lanes; no second
      install in CI"** is now false. There is no cross-job browser cache and this job
      installs its own.
