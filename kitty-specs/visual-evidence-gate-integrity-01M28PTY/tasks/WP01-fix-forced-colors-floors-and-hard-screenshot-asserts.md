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
- NFR-001
- NFR-002
- NFR-003
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
phase: Phase 1 - Fix and gate
history:
- timestamp: '2026-09-11T19:30:00Z'
  agent: system
  action: WP authored by hand following the connectors-pattern-stories precedent, per instruction that spec-kitty tasks --json overwrites hand-authored tasks.md prose
authoritative_surface: apps/storybook/src/tests/
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/**
- scripts/check-visual-screenshot-softness.mjs
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

**Explicitly out of scope, and why** (record this, do not silently expand into it):

- The four `test.describe`-level `test.skip(({ browserName }) => browserName !== 'chromium', ...)`
  predicates (`sk-context-nav.spec.ts:262`, `sk-collection.spec.ts:274`,
  `sk-section-nav.spec.ts:316`, `sk-form-select.spec.ts:101`). Each of those four files
  already gets an unconditional per-test floor from this same WP elsewhere in the file (their
  own per-test forced-colors/CDP skips), which runs on every project regardless of
  `browserName` and so independently catches a renamed/dropped `chromium` project for the
  whole file. A separate fix here would be redundant.
- `for` loops with a single hard call site executed once per iteration are a #367 concern,
  not a #401 concern — see Part B.

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

**Explicitly out of scope, and why**: `visual.spec.ts` also has roughly two dozen `for` loops
with a single hard `toHaveScreenshot` call site that executes once per loop iteration (for
example the icon-button focus loop around line 377, the mission-reading threshold loop around
line 1893). These share the identical abort-early hazard at runtime — a failure on iteration 1
skips every later iteration's screenshot — but are a distinct code shape neither #367's own
sweep nor the gate this WP writes can see (both count literal call sites, not runtime
executions). Fixing them would roughly double this WP's footprint and was not named by either
source issue. Flag this to the operator as a candidate follow-up issue; do not fix it here and
do not silently drop it from the record either.

### Part C — a regression gate for Part B

Author `scripts/check-visual-screenshot-softness.mjs`, following this repo's established
`check-*.mjs` convention (see `check-story-theme-wrapper.mjs` and
`check-behaviour-fixture-imports.mjs` for the shape): an `offenders(file, source)` function
using a paren-depth-aware scan (a naive `[^)]*` regex breaks on a locator argument with its
own nested parens, e.g. `root.locator('[data-blocked-exception]')`), reporting any test with
2+ `toHaveScreenshot` calls where at least one is not `expect.soft(...)`. Provide a
`--selftest` mode with:

- at least 4 must-catch probe rows (a two-hard-calls case, a hard-call-in-the-middle case, an
  all-hard 4-call case, and a nested-locator-parens case) plus negative-control rows (already-
  soft, a lone hard call with nothing after it, an unrelated hard non-screenshot `expect()`
  in the same test);
- an on-disk reader probe — write a real `.spec.ts` file to a temp directory, read it back via
  `readFileSync`, and assert the offender is reported at the correct line — so the self-test
  cannot pass by exercising only the in-memory matcher while the real file-read path is
  broken.

Refuse an empty glob match (no spec files found) as a failure, not a silent pass, matching
this repo's established anti-vacuity convention.

Wire two new `[ENFORCED]` steps into `.github/workflows/ci-quality.yml`'s `lint-code` job —
`--selftest` first, then the real scan — placed following the existing `check-*.mjs` pairs in
that same job (e.g. immediately after the `check-llms-adr-surface.mjs` pair). Re-run
`node scripts/check-gate-wiring.mjs` and `node scripts/check-gate-wiring-defeats.mjs`
afterward to confirm the new steps don't desync those checkers' own invariants.

## Required red-first proofs (do not report done without running these)

1. **#401 floor**: In a scratch copy, rename the `chromium` project in `playwright.config.ts`
   to something else (e.g. `chromium-renamed`) without touching its `use:` block. Run at
   least one of the newly-floored tests against the renamed project (and, ideally, a
   surviving project too — the floor is unconditional). Confirm the floor assertion fails
   with a message naming the guard, NOT a silent skip. Revert the rename and confirm
   `git diff playwright.config.ts` is empty before moving on.
2. **#367 gate**: Against the real, already-converted `visual.spec.ts`, temporarily revert
   one test's `expect.soft` calls back to hard (pick the W4 drawer test named in the source
   issue, or any other converted test). Run `node scripts/check-visual-screenshot-softness.mjs`
   (no `--selftest`) and confirm it fails, naming the exact file and line. Revert the plant
   and confirm the gate is green again.

## Non-goals for this pass

- No baseline PNG regeneration, under any circumstance. CI is the sole authority for
  `visual.spec.ts`'s snapshots.
- No hand-editing of generated artifacts or ratchet files.
- No fix for the `test.describe`-level predicate skips or the `for`-loop screenshot pattern —
  both are recorded above as deliberate exclusions with an operator decision still open.
