# Implementation Plan: Visual Evidence Gate Integrity

**Branch**: `mission/visual-evidence-gate-integrity` | **Date**: 2026-09-11 | **Spec**: `kitty-specs/visual-evidence-gate-integrity-01M28PTY/spec.md`
**Input**: Feature specification from `kitty-specs/visual-evidence-gate-integrity-01M28PTY/spec.md`

## Summary

Fix #401 and #367 by generalizing two idioms that already exist correctly in one place in
this repo:

1. **#401**: `elements-load.spec.ts`'s `sk-card` and `sk-pill-tag` forced-colors tests already
   carry `expect(test.info().config.projects.map(p => p.name), '<msg>').toContain('chromium')`
   before the code path that depends on the `chromium` project existing. Its `sk-button`
   sibling (added in the same PR) does not. A source sweep — broader than the issue's own
   estimate and the initial triage handed to this mission — found the same missing-floor
   pattern at every per-test `test.skip(browserName !== 'chromium', ...)` call site in
   `apps/storybook/src/tests/` (31 sites / 18 files), in three surface variants the initial
   grep-based triage did not catch: multi-line-wrapped calls, double-quoted string literals,
   and both together. Per operator ruling 2026-09-11, the four `test.describe`-level
   predicate-skip sites in four of those same 18 files also get their own floor, as a
   standalone test rather than relying on another test in the file to cover the same risk.
2. **#367**: `visual.spec.ts` already uses `expect.soft(...).toHaveScreenshot(...)` at 3 call
   sites (the `sk-action-row-html` family). Per operator ruling 2026-09-11, the fix and its
   gate cover EVERY `toHaveScreenshot` call site in the file — not just the 16 tests with 2+
   literal call sites (#367's own sweep), but also the ~27 `for` loops with a single hard call
   site executed once per iteration, which share the identical abort-early hazard at runtime
   but were invisible to a gate that counted call sites. All 163 remaining hard sites (of 166
   total) are converted; the gate (`check-visual-screenshot-softness.mjs`) now enforces a flat
   "every call site must be soft" rule with a named, currently-empty `EXEMPTIONS` escape hatch,
   rather than a "2+ calls per test" threshold.

Neither fix touches rendering: #401 adds an assertion, and #367 changes assertion MODE
(`expect` → `expect.soft`) without touching the locator, story, viewport, or threshold
arguments of any call. Zero baseline PNGs are expected to change, and this was verified
mechanically: a `difflib`-based line comparison between the mission-base file and the final
file shows 0 pure deletions and every one of the 163 replaced lines differing from its
original by exactly the substring `expect(` → `expect.soft(` (see IC-05 for the full method
and result).

A full local `PW_INCLUDE_VISUAL=1 npx playwright test visual.spec.ts --project=chromium` run
was executed against the CI baselines and showed 275 failures. This is NOT evidence against
the zero-pixel-drift claim: it is pre-existing, documented local/CI rendering drift — the
file's own comment at `visual.spec.ts:29-31` records "(312x38 local vs 336x34 CI for the
stub)... Refresh them from the visual-regression-diffs artifact of a CI run, never with a
local --update-snapshots," and the first failure inspected was exactly that dimension
mismatch. CI is the sole baseline authority for this file; this local run was correctly not
treated as an acceptance signal and did not motivate regenerating anything.

## Technical Context

**Language/Version**: TypeScript, Node 22 (`node scripts/*.mjs` is run directly, no build step)
**Primary Dependencies**: `@playwright/test` 1.62.1, `esbuild` 0.28.1 (used here only as a
fast syntax-validity check on the edited `.spec.ts` files — not part of the normal build)
**Storage**: N/A — no persisted state; the only artifacts are committed test source and one
new gate script
**Testing**: Playwright (`npx playwright test`, project-scoped), the repo's own `check-*.mjs`
gate convention (`--selftest` then real scan), `npm run quality:lint` (nx-wide ESLint)
**Target Platform**: CI (`ubuntu`-based GitHub Actions runner) is authoritative for visual
baselines; this workstation's local Playwright runs are known to render fonts/layout
differently from CI (documented in-file at `visual.spec.ts:29-31` for the `sk-stub` case) and
were used only to confirm PASS/FAIL of assertion LOGIC, never to judge pixel content
**Project Type**: Single project (design-system monorepo, `apps/storybook` + `packages/*`)
**Performance Goals**: N/A — no runtime performance surface touched
**Constraints**: No local `--update-snapshots`; no hand-edited generated artifacts; commitlint's
closed scope-enum (`tokens, storybook, doctrine, ci, docs, release, deps, security,
acceptance, merge, team-overview, styles, elements, react` — no `specs`/`test`/`button`)
**Scale/Scope**: 18 spec files touched for #401 (31 per-test call sites + 4 standalone
describe-level floor tests, in 4 of the same 18 files), 1 spec file touched for #367 (166 of
166 `toHaveScreenshot` call sites soft, up from the 39 landed in the first pass), 1 new gate
script (rule widened from "2+ calls per test" to "every call site, flat"), 1 CI workflow edit

## Charter Check

No project charter file was found at the standard location; this mission proceeds under the
`software-dev` mission type's default gates (spec → plan → tasks → implement → the repo's
own `check-*.mjs` / lint / gate-wiring suite). No charter-specific gate applies.

## Project Structure

### Documentation (this mission)

```
kitty-specs/visual-evidence-gate-integrity-01M28PTY/
├── spec.md               # Mission spec (written)
├── plan.md               # This file
└── tasks/                # WP-01 (single bounded work package)
```

### Source Code (repository root)

```
apps/storybook/src/tests/
├── elements-load.spec.ts                        # 1 floor line (#401)
├── sk-checkbox-choice-group.spec.ts              # 2 floor lines
├── sk-cli-auth-pattern.spec.ts                   # 1 floor line
├── sk-collection.spec.ts                         # 2 floor lines + 1 describe-level floor test
├── sk-context-nav.spec.ts                        # 3 floor lines + 1 describe-level floor test
├── sk-evidence-chain.spec.ts                     # 1 floor line
├── sk-form-input-contrast-touch-target.spec.ts   # 1 floor line
├── sk-form-select.spec.ts                        # 1 floor line + 1 describe-level floor test
├── sk-mission-reading-pattern.spec.ts            # 1 floor line
├── sk-public-header.spec.ts                      # 2 floor lines
├── sk-radio-choice-group.spec.ts                 # 4 floor lines
├── sk-repository-dossier-pattern.spec.ts         # 1 floor line
├── sk-section-nav.spec.ts                        # 2 floor lines + 1 describe-level floor test
├── sk-segmented-choice.spec.ts                   # 1 floor line
├── sk-theme-toggle-pattern.spec.ts               # 3 floor lines
├── sk-workflow-board.spec.ts                     # 1 floor line
├── sk-work-package-detail-primitives.spec.ts     # 1 floor line
└── visual.spec.ts                                # 3 floor lines (#401) + ALL 166
                                                    #   toHaveScreenshot call sites soft (#367,
                                                    #   flat rule — up from 36/166 in the
                                                    #   first pass)

scripts/
└── check-visual-screenshot-softness.mjs          # NEW — #367 regression gate, --selftest

.github/workflows/
└── ci-quality.yml                                # 2 new [ENFORCED] steps in lint-code,
                                                    #   following the existing --selftest
                                                    #   then real-scan convention
```

**Structure Decision**: Single project, no new directories. All changes land inside the
existing `apps/storybook/src/tests/` test suite and the existing `scripts/check-*.mjs` gate
convention; no new top-level structure is introduced.

## Complexity Tracking

No charter violations — this mission adds one script and edits existing test files using an
established, repo-native pattern (`check-*.mjs` with `--selftest`). Nothing here justifies a
complexity exception.

## Implementation Concern Map

### IC-01 — Chromium-project floor on every per-test browserName skip (#401)

- **Purpose**: Stop a renamed or dropped `chromium` project from silently emptying every
  test gated by `test.skip(browserName !== 'chromium', ...)`.
- **Relevant requirements**: FR-001, FR-002, NFR-003, C-001
- **Affected surfaces**: The 31 call sites across the 18 files listed under Project
  Structure above. Each site gets exactly one inserted line, immediately before the
  `test.skip(` line, matching that file's quote-style convention (single- or double-quoted,
  determined by the surrounding `test.skip(...)` call's own literals — 12 of the 31 sites
  use double quotes).
- **Sequencing/depends-on**: None — mechanically independent per file.
- **Risks**: A floor line inserted at the wrong line (e.g. before the wrong `test.skip` in a
  file with several) would either do nothing or misattribute to the wrong test. Mitigated by
  scripting the insertion from exact line numbers found via a paren/line-aware source scan,
  then re-scanning to confirm 31 lines landed and each immediately precedes a `test.skip(`
  line (verified — see Work Package notes).

### IC-02 — Convert every multi-screenshot test in visual.spec.ts to expect.soft (#367, first pass — superseded by IC-05, kept for history)

- **Purpose**: Stop an early-failing hard screenshot assertion from silently preventing
  later screenshots in the same test from ever being captured or reported.
- **Relevant requirements**: FR-003, NFR-001, C-002, C-003
- **Affected surfaces**: The 16 tests in `visual.spec.ts` (line numbers as of this plan: 96,
  417, 426, 502, 514, 557, 581, 745, 800, 807, 815, 824, 856, 2229, 2256, 2294) carrying 2+
  `toHaveScreenshot` call sites where at least one was hard. `sk-action-row HTML default and
  light` (line 602) already uses `expect.soft` for both of its calls and needs no change.
- **Sequencing/depends-on**: None — independent of IC-01 (different transform, same file in
  one case, non-overlapping line ranges).
- **Risks**: A locator argument with nested parentheses (e.g.
  `root.locator('[data-blocked-exception]')`) could break a naive regex-based paren match and
  either miss a hard call or corrupt the surrounding call. Mitigated by a proper
  depth-tracking paren matcher (not a regex) for both the conversion script and the gate
  itself, and by round-trip verification (soft-call count == toHaveScreenshot count) per
  target test after conversion.

### IC-03 — Self-testing regression gate for #367 (`check-visual-screenshot-softness.mjs`)

- **Purpose**: Make the #367 fix durable — CI fails if a future edit reintroduces a hard
  `toHaveScreenshot` call into a test that already takes another screenshot.
- **Relevant requirements**: FR-004, FR-005, NFR-002
- **Affected surfaces**: New file `scripts/check-visual-screenshot-softness.mjs`; two new
  `[ENFORCED]` steps in `.github/workflows/ci-quality.yml`'s `lint-code` job, placed
  following this repo's established `--selftest` then real-scan pairing (same convention as
  `check-behaviour-fixture-imports.mjs`, `check-story-theme-wrapper.mjs`,
  `check-gate-wiring.mjs`, `check-adr-index.mjs`, `check-llms-adr-surface.mjs`, all in the
  same job).
- **Sequencing/depends-on**: IC-02 (the gate must be green against the already-converted
  file before it is trusted/wired in).
- **Risks**: A probe table that only exercises the matcher in-memory could pass while the
  real file-read path is broken (wrong glob, wrong encoding, off-by-one line count). Mitigated
  by an explicit on-disk reader probe (writes a real `.spec.ts` file to a temp dir, reads it
  back via `readFileSync`, asserts the offender is reported at the correct line) in addition
  to 7 in-memory shape probes (2 negative-control, 5 must-catch including an all-hard
  4-screenshot case and a nested-locator-parens case). `check-gate-wiring.mjs` and
  `check-gate-wiring-defeats.mjs` were re-run after the workflow edit to confirm the new
  steps do not desync the gate-wiring invariants those checkers themselves enforce.

## Scope note — SUPERSEDED by operator ruling 2026-09-11

An earlier draft of this plan left two exclusions here: the four `test.describe`-level
predicate skips (reasoned as transitively covered by another test elsewhere in the same
file), and the `for`-loop-executed `toHaveScreenshot` sites (documented as a known gate
limitation). The operator's directive for this round — *"all work needs to be finished no
more deferrals, we are here to create features not issues"* — rejected both as deferrals. A
documented limitation and a follow-up issue are both deferrals; neither was available.

Both are now fixed in this WP, under two new implementation concerns:

### IC-04 — Standalone floor test for each describe-level predicate skip

- **Purpose**: Stop the four `test.describe`-level `test.skip(({ browserName }) => browserName !== 'chromium', ...)`
  predicates from depending on another test elsewhere in the file happening to cover the same
  "renamed/dropped chromium project" risk — a dependency that breaks silently if that other
  coverage is ever deleted, which is the same "a guard holds only because something else
  currently happens to cover it" shape this mission exists to close.
- **Relevant requirements**: FR-006, NFR-003
- **Affected surfaces**: `sk-context-nav.spec.ts:262`, `sk-collection.spec.ts:274`,
  `sk-section-nav.spec.ts:316`, `sk-form-select.spec.ts:101` — one standalone, unconditional
  `test('the chromium project the describe below depends on still exists', () => { ... })`
  inserted immediately before each `test.describe(...)` call. A bare `expect()` statement
  cannot be placed directly inside the `test.describe(...)` factory body itself (that code
  runs at collection time, before `test.info()` has a current test to report on) — it must be
  its own `test()`, placed outside the skipped describe block so the describe's own predicate
  skip does not also swallow it.
- **Sequencing/depends-on**: None.
- **Risks**: A floor test placed INSIDE the skipped describe block would itself be skipped by
  the same predicate on non-chromium projects when the chromium ENGINE (not just the project
  NAME) is still configured under a different project name — so it must be a sibling of the
  describe, not a child of it. Verified: ran all four floor tests under `--project=chromium
  --project=firefox --project=webkit` (12/12 passed, confirming unconditional execution), then
  red-first: renamed `chromium` to `chromium-renamed`, ran the `sk-collection.spec.ts` floor
  test, observed it fail naming the project list, reverted.

### IC-05 — Flatten the softness gate to "every call site must be soft"

- **Purpose**: Close the loop-execution gap IC-03's first version documented rather than
  fixed. A `for` loop with a single hard `toHaveScreenshot` call site executed once per
  iteration has the identical abort-on-first-failure hazard as two literal call sites in
  sequence, but a call-site-counting gate cannot see it — and would need to understand `for`,
  `while`, `.forEach`, and any future control-flow shape individually to try. A flat rule
  ("every call site, no threshold") needs none of that reasoning and cannot be defeated by a
  new loop shape.
- **Relevant requirements**: FR-003, FR-004, NFR-002, NFR-004, NFR-005
- **Affected surfaces**: `scripts/check-visual-screenshot-softness.mjs` (rule dropped from
  "2+ calls per test" to "every call site"; added a named `EXEMPTIONS` map as the sanctioned
  escape hatch); `apps/storybook/src/tests/visual.spec.ts` (all 127 remaining hard call sites
  converted, on top of the 39 already soft from the first pass — 166/166 soft).
- **Sequencing/depends-on**: Before converting the remaining 127 sites, every
  `toHaveScreenshot` call site in the file with a statement following it in the same
  test/loop body was inspected for a later action whose safety depends on the earlier
  screenshot's hard abort (the one case that would make blanket-soft actively wrong, per
  operator instruction). All 25 such "followed" call sites were in tests already converted
  in the first pass, and in every case what follows is only setup for the NEXT screenshot
  (navigate to a new story, resize, hover/focus/press a key) — never a mutation gated on the
  prior screenshot having passed. No exemption was needed; `EXEMPTIONS` stays empty.
- **Risks**: A flat rule with no exemption mechanism would be unable to accommodate a future
  test that legitimately needs a hard abort. Mitigated by keeping `EXEMPTIONS` as a real,
  tested code path (a selftest probe adds and removes an entry and confirms it suppresses),
  not merely a comment promising one exists.

**Zero-pixel-drift evidence for the full 166-site conversion** (both passes combined): a
line-level diff between the mission-base `visual.spec.ts` and the final file was computed
with Python's `difflib.SequenceMatcher` (word-for-word, not `git diff`'s hunk heuristics).
Result: 0 pure deletions, 3 pure insertions (all three are the #401 floor-assertion lines,
verbatim), and 163 replaced line pairs — every one of which is provably identical to its
original except for the literal substring `expect(` → `expect.soft(`. No locator, story id,
viewport, or threshold argument differs anywhere in the file.
