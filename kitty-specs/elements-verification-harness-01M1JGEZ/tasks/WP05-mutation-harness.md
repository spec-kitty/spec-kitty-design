---
work_package_id: WP05
title: The mutation harness — red-first, re-derived every run
dependencies:
- WP03
requirement_refs:
- FR-008
- NFR-002
planning_base_branch: mission/elements-verification-harness
merge_target_branch: mission/elements-verification-harness
branch_strategy: Planning artifacts for this mission were generated on mission/elements-verification-harness. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-verification-harness unless the human explicitly redirects the landing branch.
subtasks:
- T012
- T013
- T014
phase: Phase 3 - Red-first
history:
- timestamp: '2026-09-03T02:30:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: scripts/suite-selftest.mjs
create_intent:
- scripts/suite-selftest.mjs
- mutations.json
execution_mode: code_change
owned_files:
- scripts/suite-selftest.mjs
- mutations.json
tags: []
tracker_refs: []
---

# WP05 — The mutation harness

ADR-11 Confirmation #1 demands red-first *demonstrated, not asserted*. "Committed
evidence" is satisfied by a commit message containing a paste — which is exactly how #70's
NFR-003 degraded. This harness re-derives the red on every CI run.

It is **not** the structural sibling of `gate-selftest.mjs`, and an earlier draft said it
was. That file imports the gate's own exported assertion and drives it against a table of
shapes in one browser session. This one mutates source and re-runs a suite: different cost
curve, different failure modes.

## Ten guards, each demonstrated live by the post-plan spike

Guard 4 is the one that will actually fire.

1. **Pattern not found → fail.** The sixth-instance defect: a mutation that applies nothing
   leaves the test green and the harness must not read that as "nothing to do".
2. **Pattern occurs more than once → fail.** `String.replace(string, …)` replaces only the
   first occurrence.
3. **Replacement is a no-op** (`from === to`, whitespace-only) → fail.
4. **The named test must be PRESENT and `failed`** — not merely `exit !== 0`. Demonstrated:
   a syntax-breaking mutation exits 1 with `success: false`, `numFailedTests: 0`, and the
   named test **absent from the report entirely**. An exit-code assertion reads that as a
   passing selftest.
5. **Collateral bound** — every *other* behaviour test must still pass, or the mutation was
   too broad.
6. **Baseline must have executed > 0**, not merely exited 0. A zero-test lane reports
   `passed`.
7. **`mutations.json` ids ⊇ `behaviours.json` ids**, and every mutation id is a known
   behaviour. A **superset**, not set-equality: several behaviours have more than one arm
   (SC-014 is identity *and* zero-`<style>`; SC-015 is three arms) and one mutation cannot
   red them all while staying guard-5-clean. SC-016 still requires deleting an entry to
   fail, and a behaviour with **no** mutation at all must fail.
8. **`mutations.length > 0`** — an empty list makes the loop body never execute and prints
   "all mutations produced their named red".
9. **No `-t` scoping.** It makes guard 4 undetectable, because a test that never loaded and
   a test filtered out are indistinguishable. The full lane costs ~2 s.
10. **Elements-owned mutations redirect the alias.** SC-013/014/015's subject is
    `packages/elements/src`, reached through WP01's alias — mutating "a copy" does not
    touch it.

## Subtasks

- **T012** — The harness. `node_modules` **symlinked, not copied** — it is 1.2 GB and this
  runs 16 times. Measured: 5.47 s symlinked vs 6.19 s copied for baseline + 2 mutations,
  ~1.8 s per suite run. Chromium-only.
- **T013** — `mutations.json`: `{id, file, from, to, expectFailingTest, arm}` — `arm`
  names which assertion of a multi-arm behaviour this mutation is expected to red, because
  guard 4 matches the named test and guard 5 requires every *other* behaviour test to
  survive. Two entries the spec now pins because their obvious form is wrong:
  **SC-015** must be `if (existing !== ctor) {` → `if (false) {`, never "replace `define`
  with an empty function" — that unregisters `sk-stub` and reds every other elements-owned
  test, failing guard 5 on the mission's own canonical mutation. **SC-014** must substitute
  a Lit `css` CSSResult, never a `new CSSStyleSheet()` — the generated module already
  exports exactly that and Lit adopts it by reference, so that substitution preserves
  identity and leaves the test green.

- **T014** — `mutations.selftest.json`: ten deliberately-bad entries, one per guard, run in
  a self-check mode that asserts each is rejected **by its named guard**. Without it the
  harness re-derives the mutations on every run while nothing re-derives the *guards* —
  they would be demonstrated once, by hand, which is the degradation this WP diagnoses in
  #70's NFR-003. Same shape as `packages/elements/src/__fixtures__/shapes.mjs` driving
  `gate-selftest.mjs`, which this repo already ships.

## Definition of Done

- [ ] All fourteen mutations produce their named failing test; the unmutated baseline is
      green with `executed > 0`.
- [ ] `mutations.selftest.json` runs in CI and every one of its ten bad entries is
      rejected by the guard it names. Not a one-time hand demonstration.
- [ ] Deleting a `mutations.json` entry fails the harness (SC-016).
- [ ] Adding a behaviour to `behaviours.json` without a mutation fails the harness.
- [ ] The harness exits non-zero when any mutation fails to produce its named red, when
      run directly. **Wiring it into CI and pricing it into the ceiling are WP06's DoD
      lines** — see WP04's note on boxes only another WP can satisfy.
