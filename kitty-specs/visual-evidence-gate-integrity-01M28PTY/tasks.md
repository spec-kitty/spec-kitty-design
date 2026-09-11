# Tasks: Visual Evidence Gate Integrity

**Mission**: `visual-evidence-gate-integrity-01M28PTY`
**Input**: `spec.md`, `plan.md`
**Planning base / merge target**: `mission/visual-evidence-gate-integrity` (single_branch topology)

One bounded Work Package, implementing both #401 and #367 together: both are the same
"a gate reports green over something it never checked" defect class, both are mechanical,
low-risk, reviewable-in-one-pass edits to the same test suite, and neither depends on the
other's completion.

## Subtask Index

| ID | Description | Requirements | Status this pass |
|---|---|---|---|
| T001 | Locate every per-test `test.skip(browserName !== 'chromium', ...)` call site in `apps/storybook/src/tests/`, in every line-wrap and quote-style variant, and confirm the exact set against the initial "14 across 9 files" triage | FR-001, C-001 | Done |
| T002 | Insert the chromium-project floor assertion immediately before each of the 31 confirmed call sites, matching each file's quote convention | FR-001, FR-002 | Done |
| T003 | Red-first proof: rename the `chromium` project in a scratch-verified `playwright.config.ts`, run one affected spec under the renamed + surviving projects, observe the new floor assertion fail, revert the config, confirm `git diff playwright.config.ts` is empty | NFR-003 | Done |
| T004 | Locate every test in `visual.spec.ts` with 2+ `toHaveScreenshot` call sites, exclude the one already-fully-soft test, confirm the set against #367's own "16 tests / 20 baselines" count | FR-003, C-002 | Done |
| T005 | Convert every hard `toHaveScreenshot` call in the 16 confirmed tests to `expect.soft(...).toHaveScreenshot(...)`, preserving every locator/story/viewport/threshold argument unchanged | FR-003, NFR-001 | Done |
| T006 | Verify zero rendering-affecting text changed: diff review confirms only `expect(` → `expect.soft(` edits landed, `esbuild` confirms the file still parses, and a full local `--project=chromium` run of the touched non-visual spec files stays green | NFR-001 | Done |
| T007 | Author `scripts/check-visual-screenshot-softness.mjs` following the repo's `check-*.mjs --selftest` convention: an `offenders()` scan plus a `--selftest` probe table (must-catch and negative-control cases, plus an on-disk reader probe) | FR-004, NFR-002 | Done |
| T008 | Wire the new gate into `.github/workflows/ci-quality.yml`'s `lint-code` job as two `[ENFORCED]` steps (`--selftest` then the real scan), matching the placement/format of the existing `check-*.mjs` pairs in the same job | FR-005 | Done |
| T009 | Re-run `check-gate-wiring.mjs` and `check-gate-wiring-defeats.mjs` after the workflow edit to confirm the new steps do not desync the gate-wiring invariants those checkers enforce | FR-005 | Done |
| T010 | Red-first proof for the new gate: plant a hard-hard pair into the real (already-fixed) `visual.spec.ts`, run the gate without `--selftest`, observe it fail and name the exact file/line, revert, confirm green again | NFR-002 | Done |
| T011 | Record the two explicit scope boundaries (`test.describe`-level predicate skips; `for`-loop single-call-site screenshot loops) that this WP deliberately does not fix, for the operator's decision on whether either becomes a follow-up issue | C-001, C-002 | Superseded — see T012-T017, per operator ruling 2026-09-11 |
| T012 | Add a standalone, unconditional floor test immediately before each of the four `test.describe`-level `browserName !== 'chromium'` predicate skips, since a bare assertion cannot be placed inside the describe factory body itself (no running test to report on at collection time) | FR-006, C-001 | Done |
| T013 | Red-first proof for a describe-level floor: run all four new floor tests under `--project=chromium --project=firefox --project=webkit` (confirm unconditional execution), then rename `chromium` in a scratch config and confirm one fails, then revert | NFR-003 | Done |
| T014 | Before converting the remaining 127 hard call sites, inspect every `toHaveScreenshot` call site in `visual.spec.ts` with a statement following it in the same test/loop body, to rule out a test that relies on a hard abort to prevent a later action from running against a known-bad state | NFR-005 | Done — none found |
| T015 | Convert all 127 remaining hard `toHaveScreenshot` call sites in `visual.spec.ts` (every single-call test and every loop-executed call site) to `expect.soft`, bringing the file to 166/166 soft | FR-003, C-002 | Done |
| T016 | Rewrite `check-visual-screenshot-softness.mjs`'s rule from "2+ calls per test" to a flat "every call site must be soft", add a named `EXEMPTIONS` map (kept empty per T014), and add loop-shape and EXEMPTIONS probes to `--selftest` | FR-004, NFR-002 | Done |
| T017 | Red-first proof for the loop case specifically: plant a hard call inside a real `for` loop in `visual.spec.ts`, run the gate without `--selftest`, observe it fail naming that line, revert, confirm green again | NFR-004 | Done |

All seventeen subtasks are sequential in intent but independent in execution — T001-T003,
T012-T013 (#401) and T004-T010, T014-T017 (#367) touch non-overlapping line ranges even in
the one file they share (`visual.spec.ts`) and were implemented and verified separately.
T011's "record and defer" outcome was rejected by operator ruling 2026-09-11 (*"all work
needs to be finished no more deferrals, we are here to create features not issues"*) and
replaced by T012-T017, which close both boundaries instead of recording them.

## Work Packages

### WP01 — Fix #401's missing chromium-project floors and #367's hard multi-screenshot assertions, with a regression gate for the latter

- **Goal**: Every per-test `browserName !== 'chromium'` skip in `apps/storybook/src/tests/`
  is guarded by a chromium-project floor; every multi-screenshot test in `visual.spec.ts`
  uses `expect.soft` throughout; a new self-testing CI gate prevents the #367 shape from
  recurring.
- **Priority**: P0 — both source issues, and an explicit operator "no more deferrals"
  instruction covering the #401 sweep.
- **Independent test**: `node scripts/check-visual-screenshot-softness.mjs --selftest` and
  the real scan both pass; a scratch rename of the `chromium` project in
  `playwright.config.ts` makes a floor assertion fail and a scratch hard-pair plant in
  `visual.spec.ts` makes the new gate fail, both reverted cleanly afterward;
  `check-gate-wiring.mjs` / `check-gate-wiring-defeats.mjs` stay green.
- **Included subtasks**: T001-T017 (T011 superseded by T012-T017).
- **Dependencies**: none.
- **Estimated prompt size**: large — 18 files touched for #401, 1 file + 1 new script + 1
  workflow file for #367.
- **Risks**: see plan.md's IC-01 through IC-05 risk notes (paren-balanced matching,
  quote-style consistency, gate self-test blind spots, describe-level factory-body timing,
  the flat-rule EXEMPTIONS escape hatch) — all mitigated as recorded there.
