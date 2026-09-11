---
work_package_id: WP01
title: "Fix #401's missing chromium-project floors and #367's hard multi-screenshot assertions, with a regression gate for the latter"
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- C-001
- C-002
- C-003
planning_base_branch: mission/visual-evidence-gate-integrity
merge_target_branch: mission/visual-evidence-gate-integrity
branch_strategy: Planning artifacts for this mission were generated on mission/visual-evidence-gate-integrity. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/visual-evidence-gate-integrity unless the human explicitly redirects the landing branch.
base_branch: mission/visual-evidence-gate-integrity
base_commit: e7a721739d3bb4ef71d0f4ffb0cebfe4616849f8
created_at: '2026-09-11T19:30:00Z'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
- T011
- T012
- T013
- T014
- T015
- T016
- T017
- T018
- T019
- T020
- T021
phase: Phase 1 - Fix and gate
history:
- timestamp: '2026-09-11T19:30:00Z'
  agent: system
  action: WP authored by hand following the connectors-pattern-stories precedent, per instruction that spec-kitty tasks --json overwrites hand-authored tasks.md prose
- timestamp: '2026-09-11T21:00:00Z'
  agent: system
  action: 'Operator ruling: both explicit scope exclusions (describe-level skips, loop-executed screenshots) rejected as deferrals ("all work needs to be finished no more deferrals, we are here to create features not issues"); T012-T017 added to close both in this same WP; T011 superseded'
- timestamp: '2026-09-11T22:30:00Z'
  agent: system
  action: 'WP01 REJECTED on re-review, two High findings: H1 the describe-level sweep was 4/8 (single-line-only scan), H2 the flat softness gate had 3 live parser bypasses (comment before the dot, short lookahead, optional chaining). T018-T019 added to close both.'
- timestamp: '2026-09-11T23:45:00Z'
  agent: system
  action: 'WP01 REJECTED on re-review again, one new High finding (H3, an incident, not a miss): negative_invariants NI-001/NI-002 -- real, previously-verified content -- were replaced with [] in commit 3df87993 while unblocking an unrelated malformed-schema crash, undocumented anywhere but an informal self-report; the claimed lack of a re-registration CLI path was false. T020 re-registers both via acceptance-verdict --negative-invariant, backed by new executable scripts, and records the incident in tasks.md/plan.md. T021 additionally broadens the softness gate known-limit disclosure to two more reviewer-found bypasses (computed member access, U+200B zero-width space), same treatment as the aliasing gap.'
authoritative_surface: apps/storybook/src/tests/
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/**
- scripts/check-visual-screenshot-softness.mjs
- scripts/verify-visual-spec-zero-drift.mjs
- scripts/verify-no-screenshot-hard-abort-dependency.mjs
- .github/workflows/ci-quality.yml
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 - Fix #401 and #367, with a regression gate for #367

## Scope for this pass

### Part A — #401: chromium-project floor on every per-test browserName skip

Locate every per-test `test.skip(browserName !== 'chromium', ...)` call site in
`apps/storybook/src/tests/` — in single-line, multi-line-wrapped, single-quoted and
double-quoted forms — and insert, immediately before each `test.skip(` line, the same floor
assertion `elements-load.spec.ts`'s `sk-card`/`sk-pill-tag`/`sk-button` (first test) cases
already use:

```js
expect(test.info().config.projects.map((project) => project.name),
  'the chromium skip below is keyed on this project name').toContain('chromium');
```

using the file's own quote convention (double quotes where the surrounding `test.skip(...)`
call uses double quotes).

A grep-based triage handed to this WP counted "14 occurrences across 9 files" using a
single-line, single-quote-only pattern. Re-scanning with a proper multi-line-aware,
quote-agnostic matcher (necessary because several `test.skip(` calls wrap their condition
and reason onto their own lines, and several files author the whole suite in double quotes)
found **31 occurrences across 18 files**. Fix the full 31, not the initial 14 — this mission
carries an explicit operator "no more deferrals" instruction, and the extra 17 sites are the
same defect, just missed by a grep that was sensitive to formatting it shouldn't have been.

### Part A.1 — ADDENDUM per operator ruling 2026-09-11: the describe-level skips too

An earlier version of this WP left the `test.describe`-level
`test.skip(({ browserName }) => browserName !== 'chromium', ...)` predicates unfixed,
reasoning that each of those files already gets an unconditional per-test floor elsewhere in
the file which transitively covers the same risk. The operator rejected this: *"a guard that
holds only because something else currently happens to cover it"* is the same shape as the
defect being fixed — if the per-test floors in those files are ever deleted, the
describe-level skips silently go unguarded again with nothing saying so.

**Correction (WP01 rejected on re-review, H1)**: the first attempt at this fix found only 4
sites (`sk-context-nav.spec.ts:267`, `sk-collection.spec.ts:279`, `sk-section-nav.spec.ts:321`,
`sk-form-select.spec.ts:106`), using a single-line-only grep. The reviewer's independent
enumeration found the true population of **8**: the same 4 plus
`sk-checkbox-choice-group.spec.ts:181`, `sk-public-header.spec.ts:209`,
`sk-segmented-choice.spec.ts:173`, `sk-radio-choice-group.spec.ts:392` — all four of which
wrap the predicate and reason onto their own lines. This is the identical multi-line
blind-spot shape that undercounted the per-test skips earlier in this same mission (14
claimed vs. 31 actual). All 8 are now fixed; spec.md (via `spec-kitty spec-commit`) and
acceptance-matrix.json's FR-006 evidence (via `spec-kitty agent mission acceptance-verdict`)
were both corrected to state 8, not left recording the undercount.

Fixed by adding, immediately before each `test.describe(...)` call, a standalone,
unconditional test:

```js
test('the chromium project the describe below depends on still exists', () => {
  expect(test.info().config.projects.map((project) => project.name),
    'the browser-independent-once skip below is keyed on this project name').toContain('chromium');
});
```

This cannot be a bare `expect()` statement placed directly inside the `test.describe(...)`
factory callback itself — that code runs at COLLECTION time (when Playwright builds the test
list), before any test is executing, and `test.info()` has no current test to report on
there. It must be its own `test()`, and it must sit OUTSIDE the `test.describe(...)` block
the skip predicate applies to, or the same predicate would swallow it too on non-chromium
projects.

### Part B — #367: convert every multi-screenshot test in visual.spec.ts to expect.soft

`apps/storybook/src/tests/visual.spec.ts` has 166 `toHaveScreenshot` calls. #367's own sweep
found "16 tests carrying two or more hard `toHaveScreenshot` calls, placing 20 baselines
behind a preceding hard assertion" (one further test, `SK-action-row HTML default and light`
at the time of the issue, already used `expect.soft` for both of its calls and needs no
change — a parenthesis-aware re-scan at implementation time reproduced these exact numbers).

Convert every hard `expect(x).toHaveScreenshot(...)` call inside those 16 tests to
`expect.soft(x).toHaveScreenshot(...)`, changing nothing else — same locator, same story
setup, same viewport, same threshold arguments. This is an assertion-MODE change only; it
must move zero pixels.

### Part B.1 — ADDENDUM per operator ruling 2026-09-11: fix the loop case, don't document it

An earlier version of this WP left `visual.spec.ts`'s roughly two dozen `for` loops with a
single hard `toHaveScreenshot` call site executed once per iteration (for example the
icon-button focus loop around line 377, the mission-reading threshold loop around line 1893)
as a documented gate limitation rather than a fix — the gate counted literal call sites, not
runtime executions, so it could not see a loop where the same call site runs multiple times
with the identical abort-on-first-failure hazard as two literal calls in sequence.

The operator rejected the documented-limitation answer and directed the rule be widened
instead: **every `toHaveScreenshot` call site must be soft, flat, no threshold.** This closes
both the multi-call-site shape and the loop shape without the gate needing to understand
control flow — it never has to distinguish "two calls in one test" from "one call inside a
loop" because it no longer counts calls per test at all.

Before applying this blanket conversion, every `toHaveScreenshot` call site in
`visual.spec.ts` with a statement following it in the same test/loop body was inspected for
the one thing that would make blanket-soft actively wrong: a test that deliberately relies on
a hard abort to stop a LATER action from running against a known-bad visual state. 25 such
"followed" call sites exist in the file; every one is inside a test already converted in the
first pass, and in every case what follows is only setup for the NEXT screenshot (navigate to
a new story, resize the viewport, hover/focus/press a key) — never a mutation whose safety
depends on the prior screenshot having passed. No exemption was needed.

Converted all 127 remaining hard call sites (166 total minus the 39 soft after the first
pass) to `expect.soft`, bringing the file to 166/166.

### Part C — a regression gate for Part B (flat rule, per the addendum above)

Author `scripts/check-visual-screenshot-softness.mjs`, following this repo's established
`check-*.mjs` convention (see `check-story-theme-wrapper.mjs` and
`check-behaviour-fixture-imports.mjs` for the shape): an `offenders(file, source)` function
using a paren-depth-aware scan (a naive `[^)]*` regex breaks on a locator argument with its
own nested parens, e.g. `root.locator('[data-blocked-exception]')`), reporting **every** hard
`toHaveScreenshot` call site found anywhere in the file — no "2+ per test" threshold, per the
addendum above. Include a named `EXEMPTIONS` map (`Map<"file:line", reason>`) as the
sanctioned escape hatch for a future test that legitimately needs a hard abort — checked and
found empty (see Part B.1); do not populate it speculatively. Provide a `--selftest` mode
with:

- at least 4 must-catch probe rows: a two-hard-calls-in-one-test case, a single hard call
  inside a `for` loop (the shape the flat rule exists to add), an all-hard 4-call degenerate
  case, and a nested-locator-parens case — plus negative-control rows (everything already
  soft including inside a loop, an unrelated hard non-screenshot `expect()` in the same test);
- an `EXEMPTIONS`-suppression probe — add an entry, confirm it suppresses the offender,
  remove it — so the escape hatch the file comment promises is a tested code path, not just a
  comment;
- an on-disk reader probe that specifically plants the LOOP shape (not just a multi-call
  test) — write a real `.spec.ts` file to a temp directory with a `for` loop and a single hard
  call site, read it back via `readFileSync`, and assert the offender is reported at the
  correct line — so the self-test cannot pass by exercising only the shape the gate's first
  version already covered.

Refuse an empty glob match (no spec files found) as a failure, not a silent pass, matching
this repo's established anti-vacuity convention.

Wire two new `[ENFORCED]` steps into `.github/workflows/ci-quality.yml`'s `lint-code` job —
`--selftest` first, then the real scan — placed following the existing `check-*.mjs` pairs in
that same job (e.g. immediately after the `check-llms-adr-surface.mjs` pair). Re-run
`node scripts/check-gate-wiring.mjs` and `node scripts/check-gate-wiring-defeats.mjs`
afterward to confirm the new steps don't desync those checkers' own invariants.

## Required red-first proofs (do not report done without running these)

1. **#401 per-test floor**: In a scratch copy, rename the `chromium` project in
   `playwright.config.ts` to something else (e.g. `chromium-renamed`) without touching its
   `use:` block. Run at least one of the newly-floored tests against the renamed project (and,
   ideally, a surviving project too — the floor is unconditional). Confirm the floor assertion
   fails with a message naming the guard, NOT a silent skip. Revert the rename and confirm
   `git diff playwright.config.ts` is empty before moving on.
2. **#401 describe-level floor** (addendum, corrected to all 8 after re-review — see Part
   A.1): Run all eight new floor tests under `--project=chromium --project=firefox
   --project=webkit` and confirm all 24 pass (unconditional execution, not gated by the
   describe's own skip). Then, in the same scratch-renamed config as proof 1, run one of the
   floor tests from each half (one from the original 4, one from the 4 found on re-review) and
   confirm both fail naming the project list. Revert.
3. **#367 gate, multi-call shape**: Against the real, already-converted `visual.spec.ts`,
   temporarily revert one test's `expect.soft` calls back to hard (the W4 drawer test named
   in the source issue, or any other converted test). Run
   `node scripts/check-visual-screenshot-softness.mjs` (no `--selftest`) and confirm it fails,
   naming the exact file and line. Revert the plant and confirm the gate is green again.
4. **#367 gate, loop shape** (addendum — do not skip this one): Temporarily revert a single
   `expect.soft` call inside a real `for` loop in `visual.spec.ts` (not a synthetic selftest
   string) back to hard. Run the gate without `--selftest` and confirm it fails, naming that
   exact loop-hosted line. Revert and confirm green again. This is the proof that closes the
   gap the first version of this gate left undemonstrated.

## Non-goals for this pass

- No baseline PNG regeneration, under any circumstance. CI is the sole authority for
  `visual.spec.ts`'s snapshots. (A full local `PW_INCLUDE_VISUAL=1` run was executed and
  showed 275 failures — this is pre-existing, documented local/CI rendering drift, not a
  regression from this WP; see `visual.spec.ts:29-31`'s own comment. Correctly not treated as
  an acceptance signal, and did not motivate regenerating anything.)
- No hand-editing of generated artifacts or ratchet files.
- Both scope exclusions from the first version of this WP (`test.describe`-level predicate
  skips; the `for`-loop screenshot pattern) are CLOSED as of the operator ruling
  2026-09-11 — see Part A.1 and Part B.1 above. Nothing remains open in this WP.
