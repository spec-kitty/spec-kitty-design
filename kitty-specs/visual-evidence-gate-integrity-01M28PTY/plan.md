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
   `apps/storybook/src/tests/`, in three surface variants the initial grep-based triage did
   not catch: multi-line-wrapped calls, double-quoted string literals, and both together. The
   same one-line fix generalizes to all of them.
2. **#367**: `visual.spec.ts` already uses `expect.soft(...).toHaveScreenshot(...)` at 3 call
   sites (the `sk-action-row-html` family). The remaining 16 multi-screenshot tests use the
   hard form and are converted the same way, plus a new self-testing gate
   (`check-visual-screenshot-softness.mjs`) that fails CI if a future edit reintroduces a hard
   call into a test that already takes another screenshot.

Neither fix touches rendering: #401 adds an assertion, and #367 changes assertion MODE
(`expect` → `expect.soft`) without touching the locator, story, viewport, or threshold
arguments of any call. Zero baseline PNGs are expected to change, and this was verified by
diffing the `visual.spec.ts` change against `git diff` before committing.

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
**Scale/Scope**: 18 spec files touched for #401 (31 call sites), 1 spec file touched for #367
(16 tests / 20 baselines), 1 new gate script, 1 CI workflow edit

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
├── sk-collection.spec.ts                         # 2 floor lines
├── sk-context-nav.spec.ts                        # 3 floor lines
├── sk-evidence-chain.spec.ts                     # 1 floor line
├── sk-form-input-contrast-touch-target.spec.ts   # 1 floor line
├── sk-form-select.spec.ts                        # 1 floor line
├── sk-mission-reading-pattern.spec.ts            # 1 floor line
├── sk-public-header.spec.ts                      # 2 floor lines
├── sk-radio-choice-group.spec.ts                 # 4 floor lines
├── sk-repository-dossier-pattern.spec.ts         # 1 floor line
├── sk-section-nav.spec.ts                        # 2 floor lines
├── sk-segmented-choice.spec.ts                   # 1 floor line
├── sk-theme-toggle-pattern.spec.ts               # 3 floor lines
├── sk-workflow-board.spec.ts                     # 1 floor line
├── sk-work-package-detail-primitives.spec.ts     # 1 floor line
└── visual.spec.ts                                # 3 floor lines (#401) + 36 soft
                                                    #   conversions across 16 tests (#367)

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

### IC-02 — Convert every multi-screenshot test in visual.spec.ts to expect.soft (#367)

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

## Scope note carried from spec.md (C-001 / C-002)

This plan intentionally does NOT extend either fix to:

- The four `test.describe`-level `test.skip(({ browserName }) => browserName !== 'chromium', ...)`
  predicates (`sk-context-nav.spec.ts:262`, `sk-collection.spec.ts:274`,
  `sk-section-nav.spec.ts:316`, `sk-form-select.spec.ts:101`) — each of those four files
  already receives an unconditional, non-skip-gated floor assertion elsewhere in the same
  file under IC-01, which runs on every project regardless of `browserName` and independently
  catches a renamed/dropped `chromium` project for the whole file.
- The ~27 `for` loops in `visual.spec.ts` with a single hard `toHaveScreenshot` call site
  executed once per iteration (e.g. `sk-icon-button-focus-*.png` at line ~377,
  `sk-mission-reading-threshold-*.png` at line ~1893) — same abort-early hazard at runtime,
  but a distinct code shape neither #367 nor the initial triage counted, and fixing it would
  roughly double this mission's footprint. Flagged for the operator as a candidate follow-up
  issue, not silently folded in and not silently dropped.
