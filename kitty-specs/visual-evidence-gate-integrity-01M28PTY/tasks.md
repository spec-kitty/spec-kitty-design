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
| T011 | Record the two explicit scope boundaries (`test.describe`-level predicate skips; `for`-loop single-call-site screenshot loops) that this WP deliberately does not fix, for the operator's decision on whether either becomes a follow-up issue | C-001, C-002 | Done |

All eleven subtasks are sequential in intent but independent in execution — T001-T003 (#401)
and T004-T010 (#367) touch non-overlapping line ranges even in the one file they share
(`visual.spec.ts`) and were implemented and verified separately.

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
- **Included subtasks**: T001-T011.
- **Dependencies**: none.
- **Estimated prompt size**: large — 18 files touched for #401, 1 file + 1 new script + 1
  workflow file for #367.
- **Risks**: see plan.md's IC-01/IC-02/IC-03 risk notes (paren-balanced matching, quote-style
  consistency, gate self-test blind spots) — all mitigated as recorded there.
