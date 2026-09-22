# Implementation Plan: Zoom Emulation And CLI Commit Scopes

**Branch**: `mission/zoom-emulation-and-cli-commit-scopes` | **Date**: 2026-09-11 | **Spec**: `kitty-specs/zoom-emulation-and-cli-commit-scopes-01M28YQ6/spec.md`
**Input**: Feature specification from `kitty-specs/zoom-emulation-and-cli-commit-scopes-01M28YQ6/spec.md`

## Summary

One bounded Work Package, #422 only.

1. Rewrite the CLI Auth pattern's two "200% CSS zoom" Playwright tests in `apps/storybook/src/tests/visual.spec.ts` so "200% zoom" is driven by a real halved CSS viewport (fresh browser context, `deviceScaleFactor: 2`) instead of `document.documentElement.style.zoom = '2'`, which never narrows the CSS viewport a `max-width` media query reads (#422). Read the pattern's real breakpoint from `packages/elements/src/patterns/cli-auth.stories.ts` at test run time (never hardcode 390 or 480 — a sibling mission is migrating that value and has not merged). Assert the resolved padding narrows under the zoomed state relative to an un-zoomed reference, so the test fails on its own merits if the breakpoint stops firing. Sweep every other `style.zoom` use in the same file and fix any that share the same mis-naming defect (unqualified "N% zoom" claim proven only by uniform magnification).

> **CORRECTION.** This plan originally carried a second item: add a new bounded `commitlint.config.cjs` pattern for `chore(spec-kitty): materialize WP\d+ approval note into status.json`, believed to be a CLI-emitted auto-commit shape uncovered by #420's existing patterns. IC-03's own audit (below, preserved) could not re-derive that literal message from the installed CLI's source. The coordinator then established the true origin: `spec-kitty safe-commit --message`/`-m` is a caller-supplied argument, and the message was hand-authored by a sibling mission's implementer, not CLI-emitted. The commitlint pattern and its regression tests were reverted to the pre-mission state; see `research.md` for the full correction and the preserved `MissionStatus.save()` (`specify_cli/status/aggregate.py:164,797`) finding (kept as documentation only, per the coordinator, since it is real and independent of the false premise; a second correction fixed the class name itself, previously misrecorded as `MissionStatusAggregate` -- a Medium reviewer finding). This mission is #422 only.

## Technical Context

**Language/Version**: TypeScript (Playwright tests, `apps/storybook/`), Node/CommonJS (`commitlint.config.cjs`, `scripts/*.mjs`). CLI under audit: Python 3.14, `spec-kitty-cli` 3.2.6rc4 installed at `~/.local/share/uv/tools/spec-kitty-cli/` (read-only).
**Primary Dependencies**: `@playwright/test` (visual regression harness), `@commitlint/lint` + `@commitlint/load` (config self-test).
**Storage**: N/A — no data layer; this mission touches test source and a lint config.
**Testing**: `npm run quality:lint` (never `nx run storybook:lint` — wrong target, never exits); `node scripts/check-visual-screenshot-softness.mjs`; `node scripts/check-commitlint-config.mjs`; `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts -g "CLI Auth"` scoped to the touched tests (full-suite visual run has ~275 pre-existing local/CI rendering-drift failures, not this mission's concern).
**Target Platform**: CI (GitHub Actions `ubuntu-latest` runner) is baseline-authoritative for visual PNGs; local runs are for mechanism verification only.
**Project Type**: Single repo, monorepo-style (`apps/storybook`, `packages/elements`, `packages/tokens`, root-level `commitlint.config.cjs` + `scripts/`).
**Performance Goals**: N/A.
**Constraints**: See spec.md Constraints C-001, C-004, C-005 (no breakpoint hardcoding across the sibling-mission dependency, never `nx run storybook:lint`, port 6006 hygiene). C-002/C-003/C-006 governed the withdrawn commitlint work and no longer apply to any live deliverable.
**Scale/Scope**: 1 test file edit (2 zoom tests rewritten for real viewport-halving; a 3rd, Connectors, was fixed the same way then reverted and renamed instead after CI found a CI-only flaky baseline — see `research.md`; 3 others read and left as-is with the classification recorded inline). The `commitlint.config.cjs`/`check-commitlint-config.mjs` edit was reverted; see the correction note above.

## Charter Check

No `charter.md` gate gap identified: this mission touches test source and lint configuration only, no new architectural surface, no new package, no scope-enum change. Both fixes match the repo's own established pattern for closing CLI-emitted-message / harness-emulation gaps (#420's `chore(tracer)`/`chore(retrospective)` precedent; #422's own suggested resolution). No charter violation to track under Complexity Tracking.

## Project Structure

### Documentation (this mission)

```
kitty-specs/zoom-emulation-and-cli-commit-scopes-01M28YQ6/
├── plan.md              # This file
├── spec.md              # Requirements (FR-001..FR-005, FR-008; FR-006/FR-007 withdrawn — see spec.md prose)
├── research.md          # CLI operation-vocabulary audit, the correction, and the preserved
│                         # MissionStatus.save() finding (specify_cli/status/aggregate.py:164)
└── tasks/                # Phase 2 output (spec-kitty tasks) — single WP
```

### Source Code (repository root)

```
apps/storybook/src/tests/visual.spec.ts   # FR-001..FR-005: CLI Auth zoom tests rewritten;
                                            # other style.zoom sites audited; Connectors fixed then
                                            # reverted+renamed (CI-only flaky baseline, research.md)

packages/elements/src/patterns/cli-auth.stories.ts   # READ ONLY — breakpoint source of truth
packages/tokens/src/tokens.css                       # READ ONLY — --sk-space-4/-6 token values

commitlint.config.cjs                      # REVERTED to pre-mission state — see correction above
scripts/check-commitlint-config.mjs        # REVERTED to pre-mission state — see correction above
```

**Structure Decision**: Single project, no new directories. Both fixes are localized edits to existing files; no `Option 2/3` layout applies.

## Complexity Tracking

Not applicable — no Charter Check violations.

## Implementation Concern Map

### IC-01 — CLI Auth zoom mechanism + breakpoint-coupling safety

- **Purpose**: Replace CSS-`zoom` magnification with a real halved-viewport + `deviceScaleFactor: 2` browser context for the two CLI Auth zoom tests, deriving the breakpoint from source so the fix survives the in-flight 390px→480px sibling migration either way.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, C-001, C-004, C-005.
- **Affected surfaces**: `apps/storybook/src/tests/visual.spec.ts` (the `for (const zoom of [...])` block around the `CliAuthStoryId`/`cliAuthStory` helpers, roughly lines 2729-2743 pre-change).
- **Sequencing/depends-on**: none.
- **Risks**: A new `browser.newContext({ deviceScaleFactor: 2 })` must still resolve `baseURL` for `page.goto('/iframe.html?...')` to work (Playwright's `browser.newContext()` does not auto-inherit `playwright.config.ts`'s `use.baseURL` unless passed explicitly — use the `baseURL` test fixture). The zoomed-context PNG baselines will differ in raw pixel dimensions from the current ones (2x device pixel ratio) — CI-authoritative harvest required, named explicitly in the report.

### IC-02 — Zoom-idiom sweep across `visual.spec.ts`

- **Purpose**: Definitively answer whether other pattern families share #422's specific defect (unqualified "N% zoom" claim proven only by CSS-zoom magnification with no breakpoint actually crossed), and fix any that do.
- **Relevant requirements**: FR-005.
- **Affected surfaces**: `apps/storybook/src/tests/visual.spec.ts` (Mission Reading long-content zoom stress ~L1920, Repository Dossier zoom-200/zoom-400 ~L2145, Work Explorer zoom stress ~L2433, Connectors zoom-200 ~L2909 — audited during research; all four already self-disclose "CSS zoom stress"/effective-zoom naming rather than claiming unqualified real-zoom breakpoint coverage, so current classification is "already honestly scoped, no fix" pending final confirmation in the WP write-up).
- **Sequencing/depends-on**: IC-01 (same fix mechanism, applied only where warranted).
- **Risks**: A test named honestly today could still be re-scoped by a future reader as "the" 200%-zoom evidence if nothing marks the distinction — the WP's report is the record of this classification, not a code change, for sites that stay as-is.
- **Outcome update (post-CI)**: Connectors was initially fixed with IC-01's mechanism, then CI surfaced a real, CI-only render instability specific to that site (a 15px height oscillation within a single `toHaveScreenshot` stability loop — the same element and page, not a baseline-vs-baseline mismatch). Root-caused as far as possible without CI access (web-font swap ruled out by source; no other cause confirmed; local reproduction impossible — full record in `research.md`) and resolved per #422's own second option: mechanism reverted, test renamed to `'Connectors 200% CSS zoom stress — ...'`. Connectors now sits in the same honestly-named state as Mission Reading and Work Explorer, which is the outcome this IC's risk note above anticipated as a live possibility.

### IC-03 — `chore(spec-kitty)` commitlint gap audit — WITHDRAWN, preserved for the record

- **Purpose (as originally planned)**: Read the installed CLI's `BookkeepingTransaction` implicit-commit mechanism exhaustively, enumerate every call site that reaches `chore(spec-kitty): {operation}` without an explicit `.commit()`, confirm the three already-covered shapes, and add one new bounded pattern for the shape observed failing this round — without widening `scope-enum` or unanchoring the regex.
- **What the audit actually found**: exactly 3 call sites reach the implicit-commit fallback, all 3 already covered by the existing 4 patterns. The specific observed message (`chore(spec-kitty): materialize WP01 approval note into status.json`) could not be matched to a literal source string anywhere in the installed CLI despite an exhaustive read (`transaction.py`, `status_transition.py`, `workflow_executor.py`, `workflow.py`, `status/aggregate.py`, `implement.py`, `review/cycle.py`, `tasks_verdict_persistence.py`, `tasks_move_task.py` all read) — stated plainly rather than shipping unverified coverage.
- **Why withdrawn**: that "could not find it" finding was the thread the coordinator pulled. `spec-kitty safe-commit --message`/`-m` is a **caller-supplied, required** argument — the CLI does not generate this text. The message was hand-authored by a sibling mission's implementer and passed to `safe-commit`; it was never CLI-emitted, so no #420-class allowlist gap exists. A commitlint pattern was added, then reverted in full once this was established (confirmed byte-identical to `git show 9c269b3c:commitlint.config.cjs` / `:scripts/check-commitlint-config.mjs`).
- **Preserved finding**: `specify_cli/status/aggregate.py:164`'s `MissionStatus.save(*, operation: str)` (`save` itself at line 797) is a confirmed, currently-uncalled, genuinely unbounded commit-message escape hatch (`txn.commit(operation)` — the caller's string becomes the entire message). Kept as documentation in `research.md`, deliberately NOT exempted by any commitlint pattern, since no pattern was added for anything in this area at all. (Corrected post-review: originally misrecorded as `MissionStatusAggregate`, an identifier that does not exist anywhere in the installed CLI — reviewer Medium finding.)
- **Relevant requirements**: FR-008 only (documentation). FR-006/FR-007 withdrawn — see spec.md.
- **Affected surfaces**: none, after revert. `commitlint.config.cjs` and `scripts/check-commitlint-config.mjs` are back at their pre-mission (`9c269b3c`) content.
