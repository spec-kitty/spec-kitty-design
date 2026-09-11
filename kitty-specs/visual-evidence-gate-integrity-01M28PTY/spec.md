# Mission Specification: Visual Evidence Gate Integrity

**Mission Branch**: `mission/visual-evidence-gate-integrity`
**Created**: 2026-09-11
**Status**: Draft
**Input**: Fix #401 and #367 — two gates that can report green over evidence they never
actually collected.

## Summary

Both source issues describe the same defect class: **a Playwright gate that reports green
over something it never checked.**

- **#401**: `test.skip(browserName !== 'chromium', ...)` gates a forced-colors (or other
  Chromium-only-capability) test body. If the `chromium` project in `playwright.config.ts`
  is renamed or dropped, or a `--project=chromium` CI selector stops matching any project,
  the gated test silently skips on every configured project and the job still reports
  green over zero executions of that test. One of the two forced-colors tests added for
  `sk-button` `danger-secondary` in `elements-load.spec.ts` already carries a defensive
  "floor" assertion against this; its sibling test, added in the same PR, does not. Issue
  triage named "at least four specs" as also missing the floor.
- **#367**: `apps/storybook/src/tests/visual.spec.ts` uses `await expect(x).toHaveScreenshot(...)`
  (the HARD form) in tests that take two or more screenshots. A hard assertion throws on
  failure, aborting the test — so every screenshot written AFTER the one that failed never
  executes, never produces a baseline PNG, and never appears in the run's `unexpected` count
  or the `visual-regression-diffs` artifact a harvester reads from. This cost one missed
  baseline outright on PR #339.

## User Scenarios & Testing

### User Story 1 - A renamed or dropped chromium project cannot silently empty a Chromium-only test (Priority: P1)

A maintainer edits `playwright.config.ts` — renaming the `chromium` project, or removing it
— without intending to disable any test. Every test gated by
`test.skip(browserName !== 'chromium', ...)` (or an equivalent multi-line / double-quoted
form) must fail loudly rather than silently report zero executions as green.

**Why this priority**: This is the literal defect #401 was filed over, and the codebase
already has one working example of the fix (`elements-load.spec.ts`'s `sk-card` and
`sk-pill-tag` forced-colors cases) that this story generalizes.

**Independent Test**: Rename the `chromium` project in `playwright.config.ts` to
`chromium-renamed` (do not touch `browserName`/device settings), run any one of the fixed
test files against `--project=chromium-renamed`, and confirm the new floor assertion fails
with a message naming the project list, rather than the test skipping silently. Revert the
rename; confirm the same test passes again under `--project=chromium`.

**Acceptance Scenarios**:

1. **Given** `playwright.config.ts` still declares a project named `chromium`, **When** any
   test gated by `test.skip(browserName !== 'chromium', ...)` runs on any project, **Then**
   the test's new floor assertion (`expect(test.info().config.projects.map(p => p.name)).toContain('chromium')`)
   passes before the skip is evaluated.
2. **Given** the `chromium` project is renamed or removed, **When** the same test runs on
   any surviving project, **Then** the floor assertion fails with a message naming what it
   guards, instead of the test skipping without an assertion failure.
3. **Given** the full sweep of `test.skip(browserName !== 'chromium', ...)` call sites in
   `apps/storybook/src/tests/` — in single-line, multi-line, single- and double-quoted forms
   — every one gates a test that also carries the floor assertion immediately before it.

### User Story 2 - A failing screenshot in a multi-screenshot test does not silently swallow the screenshots after it (Priority: P1)

A visual-regression run in `visual.spec.ts` hits a real rendering regression on the FIRST of
several `toHaveScreenshot` calls inside one test. Every other screenshot in that same test
must still execute and still report its own pass/fail — none may be silently dropped because
an earlier one in the same test threw.

**Why this priority**: This is the literal defect #367 was filed over, already responsible
for one missed baseline on PR #339 (`work-explorer-w4-drawer-dismissed.png`).

**Independent Test**: Within one test that has two or more `toHaveScreenshot` calls, revert
one converted call back to the hard form and confirm `check-visual-screenshot-softness.mjs`
reports it as an offender; restore it. Separately, revert a single-call-site
`toHaveScreenshot` inside a real `for` loop in `visual.spec.ts` and confirm the gate reports
that too, naming the loop's line; restore it. Confirm the gate is green again after each.

**Acceptance Scenarios**:

1. **Given** any test (or loop iteration) in `visual.spec.ts` calls `toHaveScreenshot`,
   **When** the test file is scanned, **Then** that call uses
   `expect.soft(...).toHaveScreenshot(...)`, never the hard `expect(...).toHaveScreenshot(...)`
   form — including a test with only one call site, and including a `for` loop with a single
   call site executed once per iteration. Per operator ruling 2026-09-11, the "2+ calls per
   test" scoping in an earlier draft of this story is superseded: the rule is flat.
2. **Given** a regression reintroduces a hard `toHaveScreenshot` call anywhere — a second
   call in an already-multi-call test, a lone call in a previously-single-call test, or a
   call inside a `for` loop — **When** `node scripts/check-visual-screenshot-softness.mjs`
   runs, **Then** it exits non-zero and names the offending file and line.
3. **Given** the fix is applied, **When** any of the previously-hard screenshot assertions
   run against their existing CI baselines, **Then** no PNG file changes — the fix is
   assertion-mode only and moves zero pixels. Verified mechanically, not just asserted: a
   line-level diff comparison shows zero pure deletions and every replaced line differing
   from its original by exactly the substring `expect(` → `expect.soft(`.

### Edge Cases

- A `test.skip(...)` call spans multiple lines (the condition and reason on separate
  lines from the `test.skip(` token) — the floor line must still land immediately before
  the `test.skip(` line, not before an unrelated later line.
- A `test.skip(...)` call uses double-quoted strings (`"chromium"`) rather than single —
  the floor assertion's own string literals follow the same convention so the diff reads as
  authored, not mechanically pasted.
- A `toHaveScreenshot` call's locator argument itself contains nested parentheses (for
  example `root.locator('[data-blocked-exception]')`) — the softness gate's scan must not
  stop at the first `)` it sees, or it will misidentify the call boundary and either miss a
  hard call or mis-attribute one.
- A `for` loop contains a single, textually-one-time `toHaveScreenshot` call site that
  executes once per iteration — this has the same abort-early hazard at runtime as two
  literal call sites in sequence (a failure on iteration 1 drops every later iteration's
  screenshot), and the gate's rule was widened from "2+ call sites per test" to "every call
  site, flat" specifically so it does not need to understand loop control flow to catch this
  shape. See operator ruling below.
- A `test.describe`-level `test.skip(({ browserName }) => browserName !== 'chromium', ...)`
  predicate (four sites: `sk-context-nav.spec.ts`, `sk-collection.spec.ts`,
  `sk-section-nav.spec.ts`, `sk-form-select.spec.ts`) shares the surface pattern but gates
  browser-independent contract tests, not a rendering capability. A standalone, unskipped
  `test('the chromium project the describe below depends on still exists', ...)` is added
  immediately before each of the four `test.describe(...)` blocks, so the guard does not
  depend on reasoning about what else happens to cover it elsewhere in the file — see
  operator ruling below.
- A screenshot assertion converted to `expect.soft` could, in principle, change test
  behaviour if a LATER statement in the same test depended on an earlier hard assertion's
  abort to avoid running against a known-bad visual state. Checked directly (see Plan): every
  `toHaveScreenshot` call site in `visual.spec.ts` with anything following it in the same
  test/loop body was inspected, and in every case what follows is only setup for the NEXT
  screenshot (navigate, resize, hover/focus/press) — never a mutation whose safety depends on
  the prior screenshot having passed. No exemption was needed; `EXEMPTIONS` in the gate stays
  empty as a named escape hatch, not populated speculatively.

### Operator ruling (2026-09-11, mid-mission)

The first pass of this WP left two exclusions: the four `test.describe`-level predicate
skips, and `for`-loop-executed `toHaveScreenshot` call sites (documented as a known gate
limitation rather than fixed). The operator's directive for this round is explicit —
*"all work needs to be finished no more deferrals, we are here to create features not
issues"* — and both a documented limitation and a follow-up issue are deferrals. Both
exclusions are now fixed in this same WP:

1. The four describe-level skips each get their own unconditional floor test, rather than
   relying on another test elsewhere in the file happening to cover the same risk.
2. `check-visual-screenshot-softness.mjs`'s rule widened from "2+ `toHaveScreenshot` call
   sites per test" to "every `toHaveScreenshot` call site, anywhere, must be soft" — a flat
   invariant that needs no control-flow reasoning and so cannot miss a loop, a `while`, a
   `.forEach`, or a helper-function shape the way a call-site-count rule can. All 127
   remaining hard call sites in `visual.spec.ts` (166 total minus the 39 already soft after
   the first pass) were converted.

## Requirements

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Chromium-project floor on every per-test `browserName !== 'chromium'` skip | As a maintainer, I want every Chromium-only-capability test to assert the `chromium` project still exists before it can be skipped, so that a rename or drop cannot silently empty the test everywhere. | High | Implemented |
| FR-002 | Floor assertion matches file quote/line-wrap convention | As a reviewer, I want the inserted floor line to read as authored in each file, so that the diff does not read as a mechanical, unreviewed sed pass. | Medium | Implemented |
| FR-003 | Every `toHaveScreenshot` call site in `visual.spec.ts` uses `expect.soft` | As a maintainer harvesting baselines from a red CI run, I want every screenshot — whatever test or loop it sits in — to execute regardless of an earlier one's failure, so that the `unexpected` count and the diff artifact are complete. | High | Implemented |
| FR-004 | A standalone, self-testing gate detects a hard call reintroduced anywhere, including inside a loop | As a maintainer, I want CI to fail immediately if a future edit adds back any hard `toHaveScreenshot` call, in a multi-call test or inside a loop, so that #367 cannot silently recur in either shape. | High | Implemented |
| FR-005 | The new gate is wired into `ci-quality.yml`'s `lint-code` job with a `--selftest` step ahead of the real scan | As a maintainer, I want the gate's own probe table proven before its real scan is trusted, matching this repo's established convention for every other `check-*.mjs` gate. | High | Implemented |
| FR-006 | Each `test.describe`-level `browserName !== 'chromium'` predicate skip gets its own unconditional floor | As a maintainer, I want the four describe-level skips guarded locally, not by reasoning that something else in the file happens to cover them, so the invariant survives someone later deleting that other coverage. | High | Implemented |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Zero pixel drift | No baseline PNG under `apps/storybook/src/tests/visual.spec.ts-snapshots/` may change as a result of this mission; the fix is assertion-mode only. Evidenced mechanically (see Plan / WP record), not merely stated: every replaced line in `visual.spec.ts`'s diff is provably identical to its original except for the literal substring `expect(` → `expect.soft(`, with zero pure deletions. | Reliability | High | Implemented |
| NFR-002 | Gate self-test proves the shape it guards, including the loop shape | `check-visual-screenshot-softness.mjs --selftest` must include probes for: a multi-call-site test, a single hard call inside a `for` loop, an all-hard degenerate case, a nested-locator-parens case, an `EXEMPTIONS` suppression case, and an on-disk reader probe that specifically plants the LOOP shape (not just a multi-call test) — so the self-test cannot pass by exercising only the shape the gate's first version already covered. | Reliability | High | Implemented |
| NFR-003 | Red-first proof for the #401 floor, on both a per-test and a describe-level site | At least one per-test floor assertion AND at least one describe-level floor test must be shown to fail when the `chromium` project is renamed in a scratch copy of `playwright.config.ts`, with the real config restored immediately after and confirmed unchanged by `git diff`. | Reliability | High | Implemented |
| NFR-004 | Red-first proof for the loop-shape gate coverage | A hard `toHaveScreenshot` call must be planted inside a real `for` loop in `visual.spec.ts` (not a synthetic selftest string), the non-`--selftest` gate run and shown to fail naming that exact line, then reverted with the gate confirmed green again. | Reliability | High | Implemented |
| NFR-005 | No test relies on a hard-abort as a safety mechanism | Before converting every remaining hard call to soft, every `toHaveScreenshot` call site with a statement following it in the same test/loop body must be inspected for a later action whose safety depends on the prior screenshot's hard abort; any such case must be listed in the gate's `EXEMPTIONS` with a named reason instead of silently converted. | Reliability | High | Implemented — none found, `EXEMPTIONS` empty |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Scope: every `browserName !== 'chromium'` skip, per-test AND describe-level | The #401 fix covers every per-test `test.skip(browserName !== 'chromium'/"chromium", ...)` call site regardless of line-wrapping or quote style (31 sites across 18 files, a superset of the "14 across 9 files" initial triage count), AND the four `test.describe`-level predicate skips (each gets its own standalone floor test). Per operator ruling 2026-09-11, no exclusion remains. | Technical | High | Satisfied |
| C-002 | Scope: every `toHaveScreenshot` call site, flat, no loop exclusion | The #367 fix and its gate cover every `toHaveScreenshot` call site in `visual.spec.ts` — the original 16 multi-call tests (20 baselines) AND every single-hard-call-per-loop-iteration site (~27 loops). Per operator ruling 2026-09-11, the gate's rule is flat ("every call site must be soft") specifically so no loop-shape exclusion remains or can recur. | Technical | High | Satisfied |
| C-003 | No baseline regeneration | This mission must not run `--update-snapshots` locally under any circumstance; CI is the sole source of truth for `visual.spec.ts` baselines. A full local `PW_INCLUDE_VISUAL=1` run was executed and showed 275 failures; this is pre-existing, documented local/CI rendering drift (see `visual.spec.ts:29-31`'s own comment: "312x38 local vs 336x34 CI for the stub"), not a regression from this mission, and was correctly NOT treated as an acceptance signal and NOT used to justify regenerating anything. | Process | High | Satisfied |

### Key Entities

- **Chromium-project floor assertion**: `expect(test.info().config.projects.map((project) => project.name), '<message>').toContain('<quote>chromium<quote>')`, inserted immediately before a `test.skip(browserName !== 'chromium', ...)` call (in the same quote style as that call), or as a standalone unconditional `test(...)` immediately before a `test.describe(...)` block carrying a describe-level predicate skip.
- **Screenshot softness gate**: `scripts/check-visual-screenshot-softness.mjs`, a `--selftest`-capable Node script following this repo's established `check-*.mjs` convention, scanning `apps/storybook/src/tests/*.spec.ts` for ANY hard `toHaveScreenshot` call site (flat rule, not scoped to tests with 2+ calls), with a named `EXEMPTIONS` map (currently empty) as the sanctioned escape hatch for a future test that deliberately needs a hard abort.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 31 per-test `browserName !== 'chromium'` skip sites across 18 spec files
  carry an immediately-preceding chromium-project floor assertion, AND all 4
  `test.describe`-level predicate-skip sites carry their own standalone floor test.
- **SC-002**: A red-first proof (chromium project renamed, floor assertion observed to fail,
  config reverted, `git diff playwright.config.ts` empty) is recorded for at least one
  per-test site AND at least one describe-level site.
- **SC-003**: Every `toHaveScreenshot` call site in `visual.spec.ts` (166 of 166 — the
  original 16 multi-call tests / 20 baselines, plus every loop-executed single-call site) uses
  `expect.soft(...).toHaveScreenshot(...)`; zero baseline PNGs change; the diff is mechanically
  proven to be exactly `expect(` → `expect.soft(` token substitutions plus the floor-line
  insertions (zero pure deletions, zero other token changes across every replaced line).
- **SC-004**: `node scripts/check-visual-screenshot-softness.mjs --selftest` passes with at
  least 4 must-catch probe rows (including a loop-hosted single-call-site case), an
  `EXEMPTIONS`-suppression probe, and an on-disk reader probe that plants the loop shape;
  `node scripts/check-visual-screenshot-softness.mjs` (no flag) passes against the fixed repo
  and is proven to fail when a hard call is planted BOTH as a duplicate-call-site pair AND
  inside a real `for` loop in `visual.spec.ts`, restored afterward in both cases.
- **SC-005**: `node scripts/check-gate-wiring.mjs` and `node scripts/check-gate-wiring-defeats.mjs`
  both still pass after the two new `[ENFORCED]` steps are added to `ci-quality.yml`.
- **SC-006**: No `toHaveScreenshot` call site relies on a preceding hard abort as a safety
  mechanism — checked by inspecting every call site with a following statement in the same
  test/loop body; none found; `EXEMPTIONS` in the gate remains empty.
