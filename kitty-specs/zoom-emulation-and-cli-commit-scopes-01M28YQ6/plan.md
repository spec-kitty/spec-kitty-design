# Implementation Plan: Zoom Emulation And CLI Commit Scopes

**Branch**: `mission/zoom-emulation-and-cli-commit-scopes` | **Date**: 2026-09-11 | **Spec**: `kitty-specs/zoom-emulation-and-cli-commit-scopes-01M28YQ6/spec.md`
**Input**: Feature specification from `kitty-specs/zoom-emulation-and-cli-commit-scopes-01M28YQ6/spec.md`

## Summary

Two independent harness/config fixes, one bounded Work Package:

1. Rewrite the CLI Auth pattern's two "200% CSS zoom" Playwright tests in `apps/storybook/src/tests/visual.spec.ts` so "200% zoom" is driven by a real halved CSS viewport (fresh browser context, `deviceScaleFactor: 2`) instead of `document.documentElement.style.zoom = '2'`, which never narrows the CSS viewport a `max-width` media query reads (#422). Read the pattern's real breakpoint from `packages/elements/src/patterns/cli-auth.stories.ts` at test run time (never hardcode 390 or 480 — a sibling mission is migrating that value and has not merged). Assert the resolved padding narrows under the zoomed state relative to an un-zoomed reference, so the test fails on its own merits if the breakpoint stops firing. Sweep every other `style.zoom` use in the same file and fix any that share the same mis-naming defect (unqualified "N% zoom" claim proven only by uniform magnification).
2. Add one new bounded, anchored pattern to `commitlint.config.cjs`'s `SPEC_KITTY_AUTO_COMMIT_PATTERNS` for the CLI's `chore(spec-kitty): materialize WP\d+ approval note into status.json` auto-commit shape (observed failing `lint-code` this round), following the exact discipline of the four patterns #420 already established (fixed verb phrase + bounded `WP\d+` token, anchored to end-of-line). Add `generatedMessages`/`nearMisses` regression cases to `scripts/check-commitlint-config.mjs`. Document, but deliberately do not exempt, the confirmed-unbounded `MissionStatusAggregate.save()` escape hatch found during the source audit.

## Technical Context

**Language/Version**: TypeScript (Playwright tests, `apps/storybook/`), Node/CommonJS (`commitlint.config.cjs`, `scripts/*.mjs`). CLI under audit: Python 3.14, `spec-kitty-cli` 3.2.6rc4 installed at `~/.local/share/uv/tools/spec-kitty-cli/` (read-only).
**Primary Dependencies**: `@playwright/test` (visual regression harness), `@commitlint/lint` + `@commitlint/load` (config self-test).
**Storage**: N/A — no data layer; this mission touches test source and a lint config.
**Testing**: `npm run quality:lint` (never `nx run storybook:lint` — wrong target, never exits); `node scripts/check-visual-screenshot-softness.mjs`; `node scripts/check-commitlint-config.mjs`; `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts -g "CLI Auth"` scoped to the touched tests (full-suite visual run has ~275 pre-existing local/CI rendering-drift failures, not this mission's concern).
**Target Platform**: CI (GitHub Actions `ubuntu-latest` runner) is baseline-authoritative for visual PNGs; local runs are for mechanism verification only.
**Project Type**: Single repo, monorepo-style (`apps/storybook`, `packages/elements`, `packages/tokens`, root-level `commitlint.config.cjs` + `scripts/`).
**Performance Goals**: N/A.
**Constraints**: See spec.md Constraints C-001..C-006 (no breakpoint hardcoding across the sibling-mission dependency, no `scope-enum` widening, no unanchored `chore(spec-kitty)` regex, never `nx run storybook:lint`, port 6006 hygiene, CLI source read-only).
**Scale/Scope**: 1 test file edit (2 tests rewritten, N other zoom sites audited/fixed per sweep), 1 config file edit (1 new pattern + 1 comment), 1 self-test script edit (generatedMessages/nearMisses cases).

## Charter Check

No `charter.md` gate gap identified: this mission touches test source and lint configuration only, no new architectural surface, no new package, no scope-enum change. Both fixes match the repo's own established pattern for closing CLI-emitted-message / harness-emulation gaps (#420's `chore(tracer)`/`chore(retrospective)` precedent; #422's own suggested resolution). No charter violation to track under Complexity Tracking.

## Project Structure

### Documentation (this mission)

```
kitty-specs/zoom-emulation-and-cli-commit-scopes-01M28YQ6/
├── plan.md              # This file
├── spec.md              # Requirements (FR-001..FR-008, NFR-001..003, C-001..006)
└── tasks/                # Phase 2 output (spec-kitty tasks) — single WP
```

### Source Code (repository root)

```
apps/storybook/src/tests/visual.spec.ts   # FR-001..FR-005: CLI Auth zoom tests rewritten;
                                            # other style.zoom sites audited, fixed where defect shared
packages/elements/src/patterns/cli-auth.stories.ts   # READ ONLY — breakpoint source of truth
packages/tokens/src/tokens.css                       # READ ONLY — --sk-space-4/-6 token values

commitlint.config.cjs                      # FR-006, FR-008: new pattern + escape-hatch comment
scripts/check-commitlint-config.mjs        # FR-007: generatedMessages/nearMisses regression cases
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

### IC-03 — `chore(spec-kitty)` commitlint gap audit + closure

- **Purpose**: Read the installed CLI's `BookkeepingTransaction` implicit-commit mechanism exhaustively, enumerate every call site that reaches `chore(spec-kitty): {operation}` without an explicit `.commit()`, confirm the three already-covered shapes, and add one new bounded pattern for the shape observed failing this round — without widening `scope-enum` or unanchoring the regex.
- **Relevant requirements**: FR-006, FR-007, FR-008, C-002, C-003, C-006.
- **Affected surfaces**: `commitlint.config.cjs` (`SPEC_KITTY_AUTO_COMMIT_PATTERNS` array + surrounding comments), `scripts/check-commitlint-config.mjs` (`generatedMessages`/`nearMisses` arrays).
- **Sequencing/depends-on**: none (independent of IC-01/IC-02).
- **Risks**: The specific observed message (`materialize WP01 approval note into status.json`) could not be matched to a literal source string in the installed CLI despite an exhaustive read (`transaction.py`, `status_transition.py`, `workflow_executor.py`, `workflow.py`, `status/aggregate.py`, `implement.py`, `review/cycle.py`, `tasks_verdict_persistence.py`, `tasks_move_task.py` all read). The new pattern is therefore bound to the exact observed text (not a generalized category) and the report states plainly that this one rests on the operator-relayed real message, distinct from the three patterns whose source template I verified directly. `MissionStatusAggregate.save(*, operation: str)` is flagged as a confirmed, currently-uncalled, genuinely unbounded escape hatch and is deliberately NOT exempted.
