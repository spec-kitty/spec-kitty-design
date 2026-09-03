---
work_package_id: WP04
title: ADR-11 behaviour 9 gets a subject at last, and the ceiling gets raised on purpose
dependencies:
- WP03
requirement_refs:
- FR-008
- NFR-004
planning_base_branch: mission/react-wrapper-generation
merge_target_branch: mission/react-wrapper-generation
branch_strategy: Planning artifacts for this mission were generated on mission/react-wrapper-generation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/react-wrapper-generation unless the human explicitly redirects the landing branch.
subtasks:
- T010
- T011
phase: Phase 4 - Verification
history:
- timestamp: '2026-09-03T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: behaviours.json
create_intent: []
execution_mode: code_change
owned_files:
- behaviours.json
- mutations.json
- suite-budget.json
- scripts/suite-selftest.mjs
- vitest.config.mts
tags: []
tracker_refs: []
---

# WP04 — The fifteenth behaviour has a subject at last, and no harness that can run it

`behaviours.json` carries **fourteen** ids (SC-002…SC-015) and says why in its own `$comment`:

> *"The fifteenth is generation determinism, and it is deferred to #75 … A test here would be a
> green criterion with zero new coverage."*

This is #75. The subject now exists. **But a lens found the harness does not reach it, and that
is a fork, not a subtask.**

## The blocker, stated plainly

- `suite-selftest.mjs:133,173` call `runSuite(dir, 'browser')` — **hardcoded, browser only**.
- All 14 behaviours and all 41 mutations subject browser-lane files. There is **no node-lane
  behaviour subject in the registry**, and `tests/node/config-contract.test.ts` carries no
  `[SC-xxx]` id.
- Guard 7 requires every `(behaviour, subject)` pair to have a mutation; guard 4 requires the
  named test to be **present and failed** in that browser report, else verdict `absent`.
- NFR-002 and ADR-11 §"a second, browserless subject" put wrapper generation and its drift check
  in the **node** lane.

So a node-lane test for behaviour 15 is invisible to the harness and fires `absent` every run.

**The evasion this creates is clean and a WP agent under time pressure will take it:** declare
the subject as a *browser* fixture test named `[SC-016] regenerating from an unchanged manifest
is a no-op` that actually only asserts `SkCard` renders; mutate `packages/react/SkCard.js`;
guard 4 sees the named test red, guard 7 sees the pair covered, `suite-selftest` prints
`✅ All 42 mutations produced their named red` — **and determinism is asserted nowhere.** The
mission would close the deferral by committing precisely the thing the deferral existed to
prevent. Eighth or ninth instance of this programme's named defect class, and the first one
that would be *caused* by the register meant to stop it.

## Subtasks

- **T011 — FORKED to the operator on #75. Do not choose this silently.** Either:

  **(i)** extend `suite-selftest.mjs` to run the node project too — honest, and roughly doubles
  its per-mutation cost, which breaches `selftestCeilingSeconds` immediately; or
  **(ii)** record behaviour 15 as a **`--check`-gate obligation** rather than a mutation-harness
  one, and amend `behaviours.json`'s `$comment` to say so in the same commit.

  (ii) is cheaper and defensible — the drift gate genuinely does enforce it — but it changes
  what ADR-11's behaviour 9 *means*, and that is not a WP agent's call. `suite-selftest.mjs` and
  `vitest.config.mts` are in this WP's owned files so that (i) is *possible*, not so that it is
  assumed.

  Note the id is **SC-016**. Ids run SC-002…SC-015, so "the fifteenth" is not SC-015 — the first
  draft's phrasing invited that off-by-one.

- **T012 — the mutation needs an alias before it can bite.** `suite-selftest.mjs:113-122`
  symlinks the real `node_modules` into its tmpdir, and npm-workspace symlinks are relative, so
  `<tmp>/node_modules/@spec-kitty/react` realpaths back to the **unmutated original**. That is
  why `vitest.config.mts` carries explicit `resolve.alias` entries for
  `@spec-kitty/{elements,styles,tokens}`. Without a fourth entry every mutation on
  `packages/react/**` reads verdict `green` — "semantically inert". Fails closed, but silently
  costs a cycle.

- **T013 — the ceiling. The first draft's arithmetic was right and its conclusion was wrong.**

  From `suite-budget.json`: 39 mut/62 tests → 121.7s; 41/80 → 141.6s. Δ = 19.9s over 2
  mutations = 9.95s, and 38.4s of headroom ÷ 9.95 = 3.86, so "roughly four more" checks out
  arithmetically. **But the model is wrong.** The harness runs 42 suites, so the two points fit
  `per-run ≈ 1.90s + 0.0183s × tests`. A mutation with **no new tests costs ≈3.4s**; the 10s
  bundled a mutation *plus nine tests*.

  So **this WP adding one mutation does not threaten the ceiling and does not justify raising
  it.** Raising it anyway on the 10s slope would be raising a ceiling from an arithmetic the run
  does not support — the defect `suite-budget.json` records a lens catching twice. The real
  consumer of the headroom is WP03's React renders, and the measurement has moved there.

  If a ceiling does move, cite the CI run, not a workstation. The spec's "102.7s local" figure
  is withdrawn — it exists nowhere in the repo.

- **T014 (NEW) — protect WP03's renders from deletion.** Separate from the fork above and
  **not blocked by it**: this is about the two ids that already exist, not the fifteenth.
  `floor-reporter.mjs:70` asserts each *lane* is non-empty and the React tests join a `browser`
  lane that already has tests, so `git rm fixtures/react-consumer/src/wrappers.test.tsx` leaves
  everything green. Add subject entries for the React fixture under the existing event-contract
  and form-association ids. `behaviours.json` is owned here rather than in WP03 so that one WP
  owns the registry; WP03's DoD line "deleting the fixture test turns something red" is
  discharged by this subtask, and is tracked as a cross-WP obligation rather than left implicit.

## Definition of Done

- The fork on #75 is answered and the answer is implemented as answered, including the
  `$comment` amendment if (ii).
- `behaviours.json` carries fifteen ids, the fifteenth with a subject a mutation can actually
  reach.
- A `@spec-kitty/react` `resolve.alias` exists, or mutations on that package are demonstrated to
  bite without one.
- `suite-selftest.mjs` green; `--selftest` 8/8.
- Any ceiling change cites the CI run that justifies it; no ceiling change if none is needed.
