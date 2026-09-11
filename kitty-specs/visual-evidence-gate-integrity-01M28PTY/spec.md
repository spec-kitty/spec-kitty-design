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
reports it as an offender. Restore it; confirm the gate is green again.

**Acceptance Scenarios**:

1. **Given** a test in `visual.spec.ts` contains two or more `toHaveScreenshot` calls,
   **When** the test file is scanned, **Then** every one of those calls uses
   `expect.soft(...).toHaveScreenshot(...)`, never the hard `expect(...).toHaveScreenshot(...)`
   form.
2. **Given** a test contains exactly one `toHaveScreenshot` call, **When** the test file is
   scanned, **Then** that call is left as-is (hard or soft) — there is nothing after it in
   that test to silently drop, so it is out of this defect's scope.
3. **Given** a regression reintroduces a hard `toHaveScreenshot` call into a test that
   already has another screenshot call, **When** `node scripts/check-visual-screenshot-softness.mjs`
   runs, **Then** it exits non-zero and names the offending file and line.
4. **Given** the fix is applied, **When** any of the previously-hard screenshot assertions
   run against their existing CI baselines, **Then** no PNG file changes — the fix is
   assertion-mode only and moves zero pixels.

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
  executes once per iteration — this has the same abort-early hazard at runtime but is a
  distinct code shape from a literal duplicate call site, and is explicitly OUT OF SCOPE for
  this mission (see Non-Functional Requirements / Constraints).
- A `test.describe`-level `test.skip(({ browserName }) => browserName !== 'chromium', ...)`
  predicate (four sites: `sk-context-nav.spec.ts`, `sk-collection.spec.ts`,
  `sk-section-nav.spec.ts`, `sk-form-select.spec.ts`) shares the surface pattern but gates
  browser-independent contract tests, not a rendering capability; each of those four files
  already receives an unconditional per-test floor from this mission's #401 fix elsewhere in
  the same file, which transitively covers the same "project silently renamed/dropped" risk
  for the whole file (see Plan for the reasoning). No separate fix is required for these
  four sites.

## Requirements

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Chromium-project floor on every per-test `browserName !== 'chromium'` skip | As a maintainer, I want every Chromium-only-capability test to assert the `chromium` project still exists before it can be skipped, so that a rename or drop cannot silently empty the test everywhere. | High | Implemented |
| FR-002 | Floor assertion matches file quote/line-wrap convention | As a reviewer, I want the inserted floor line to read as authored in each file, so that the diff does not read as a mechanical, unreviewed sed pass. | Medium | Implemented |
| FR-003 | All multi-screenshot tests in `visual.spec.ts` use `expect.soft` for every screenshot | As a maintainer harvesting baselines from a red CI run, I want every screenshot in a multi-screenshot test to execute regardless of an earlier one's failure, so that the `unexpected` count and the diff artifact are complete. | High | Implemented |
| FR-004 | A standalone, self-testing gate detects a hard call reintroduced into a multi-screenshot test | As a maintainer, I want CI to fail immediately if a future edit adds back a hard `toHaveScreenshot` call to a test that already takes another screenshot, so that #367 cannot silently recur. | High | Implemented |
| FR-005 | The new gate is wired into `ci-quality.yml`'s `lint-code` job with a `--selftest` step ahead of the real scan | As a maintainer, I want the gate's own probe table proven before its real scan is trusted, matching this repo's established convention for every other `check-*.mjs` gate. | High | Implemented |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Zero pixel drift | No baseline PNG under `apps/storybook/src/tests/visual.spec.ts-snapshots/` may change as a result of this mission; the fix is assertion-mode only. | Reliability | High | Implemented |
| NFR-002 | Gate self-test proves the shape it guards | `check-visual-screenshot-softness.mjs --selftest` must include at least one probe that plants a hard-hard screenshot pair and asserts the gate flags it, plus a probe against a real on-disk file (not only an in-memory string), so the self-test cannot pass by exercising only the reader or only the matcher. | Reliability | High | Implemented |
| NFR-003 | Red-first proof for the #401 floor | At least one of the 31 inserted floor assertions must be shown to fail when the `chromium` project is renamed in a scratch copy of `playwright.config.ts`, with the real config restored immediately after and confirmed unchanged by `git diff`. | Reliability | High | Implemented |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Scope: literal `browserName !== 'chromium'` per-test skips only | The #401 fix covers every per-test `test.skip(browserName !== 'chromium'/"chromium", ...)` call site regardless of line-wrapping or quote style (31 sites across 18 files, a superset of the "14 across 9 files" initial triage count — see Plan for how the wider count was found), but explicitly does NOT extend to the four `test.describe`-level predicate skips gating browser-independent contract tests, and does NOT extend to `for`-loop bodies whose single call site executes once per iteration. | Technical | High | Open — reported to operator |
| C-002 | Scope: literal duplicate `toHaveScreenshot` call sites only | The #367 fix and its gate cover tests with two or more literal `toHaveScreenshot` call sites (16 tests, 20 baselines, matching the issue's own sweep once the one already-fully-soft `sk-action-row-html` test is excluded). It does NOT cover `for` loops with a single hard `toHaveScreenshot` call site executed once per iteration, which share the identical abort-early hazard at runtime but are a distinct code shape the issue's own sweep did not count. | Technical | High | Open — reported to operator |
| C-003 | No baseline regeneration | This mission must not run `--update-snapshots` locally under any circumstance; CI is the sole source of truth for `visual.spec.ts` baselines. | Process | High | Satisfied |

### Key Entities

- **Chromium-project floor assertion**: `expect(test.info().config.projects.map((project) => project.name), '<message>').toContain('<quote>chromium<quote>')`, inserted immediately before a `test.skip(browserName !== 'chromium', ...)` call, in the same quote style as that call.
- **Screenshot softness gate**: `scripts/check-visual-screenshot-softness.mjs`, a `--selftest`-capable Node script following this repo's established `check-*.mjs` convention, scanning `apps/storybook/src/tests/*.spec.ts` for tests with 2+ `toHaveScreenshot` calls where at least one is not `expect.soft(...)`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 31 per-test `browserName !== 'chromium'` skip sites across 18 spec files
  carry an immediately-preceding chromium-project floor assertion.
- **SC-002**: A red-first proof (chromium project renamed, floor assertion observed to fail,
  config reverted, `git diff playwright.config.ts` empty) is recorded for at least one site.
- **SC-003**: All 16 multi-screenshot tests in `visual.spec.ts` (20 baselines) use
  `expect.soft(...).toHaveScreenshot(...)` for every screenshot call; zero baseline PNGs
  change.
- **SC-004**: `node scripts/check-visual-screenshot-softness.mjs --selftest` passes with at
  least 4 must-catch probe rows plus an on-disk reader probe; `node scripts/check-visual-screenshot-softness.mjs`
  (no flag) passes against the fixed repo and is proven to fail when a hard pair is planted
  into the real `visual.spec.ts` and restored afterward.
- **SC-005**: `node scripts/check-gate-wiring.mjs` and `node scripts/check-gate-wiring-defeats.mjs`
  both still pass after the two new `[ENFORCED]` steps are added to `ci-quality.yml`.
