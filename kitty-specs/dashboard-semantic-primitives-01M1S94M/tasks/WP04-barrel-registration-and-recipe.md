---
work_package_id: WP04
title: Barrel registration, entry point, and authoring recipe
dependencies: []
requirement_refs:
- FR-007
- FR-008
- FR-011
- NFR-001
planning_base_branch: mission/dashboard-semantic-primitives
merge_target_branch: mission/dashboard-semantic-primitives
branch_strategy: Planning artifacts for this mission were generated on mission/dashboard-semantic-primitives. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/dashboard-semantic-primitives unless the human explicitly redirects the landing branch.
subtasks:
- T021
- T022
- T023
- T024
phase: Phase 2 - Closure
history:
- at: '2026-09-05T18:34:59Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/styles/src/index.ts
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/index.ts
- docs/contributing/adding-a-component.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP04 – Barrel registration, entry point, and authoring recipe

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`implement` work touching `packages/styles/src/index.ts` and `docs/`.

---

## ⚠️ IMPORTANT: Review Feedback

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_ref` field in the event log (via
  `spec-kitty agent tasks status` or the Activity Log below).
- **You must address all feedback** before your work is complete.
- **Report progress**: As you address each feedback item, update the Activity Log.

---

## Review Feedback

*None yet — this is the initial prompt.*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<dl>`, `<table>`
Use language identifiers in code blocks: ```python, ```bash

---

## Objectives & Success Criteria

Close out the mission: register all five new directories' generated barrels in the shared package
entry point, document the two cross-cutting baselines in the authoring recipe, and run the full
local gate suite as final mission evidence.

**Do not start this WP until WP01, WP02, and WP03 have all landed on the branch** — you need all
five directories' `.html` files present so the generator's derived styles-only set includes all
five before you add their exports.

Done means:

- `packages/styles/src/index.ts` has one new `export *` line per new directory (five lines).
- SC-004 is independently verified: importing the package entry point resolves every one of the
  five new generated export names.
- `docs/contributing/adding-a-component.md` documents the forced-colors and reduced-motion
  baselines (FR-011), pointing at the real shipped CSS rather than re-describing it.
- `node scripts/build-styles-only-markup.mjs --check` is clean with all five new directories
  included in its reported set.
- The full local gate suite has been run and its real output recorded.
- SC-006 is verified: no `--sk-status-*`/`--sk-chart-*` token exists in
  `packages/tokens/src/tokens.css`.

## Context & Constraints

- Mission spec: `kitty-specs/dashboard-semantic-primitives-01M1S94M/spec.md` — read FR-007,
  FR-008, FR-011, NFR-001, SC-001, SC-004, SC-006, SC-007.
- Mission plan: `kitty-specs/dashboard-semantic-primitives-01M1S94M/plan.md` — read IC-07, IC-08,
  and the "Local gate commands" section.
- `packages/styles/src/index.ts` — read its existing header comment in full before editing. It
  explains #156/#174's per-directory drift and why `export *` only closes the per-*name* half of
  the problem. **You are the single writer of this file in the whole mission** — no other WP
  touches it.
- `docs/contributing/adding-a-component.md` — read it in full; it's the authoring recipe FR-011
  requires you to extend. Add a concise new section (its own `##` heading, near the CSS-authoring
  step) rather than scattering notes across existing sections.
- This mission adds **no** new package directory — all five new directories live inside the
  existing `packages/styles` project, so `.github/workflows/ci-quality.yml`'s `components` path
  filter already covers them. Confirm this is true (grep the filter) rather than assuming it, but
  do not edit that workflow file unless the grep proves it's actually missing coverage.

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/dashboard-semantic-primitives`.
- **Planning base branch**: `mission/dashboard-semantic-primitives`
- **Merge target branch**: `mission/dashboard-semantic-primitives`

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T021 – Add five `export *` lines to `packages/styles/src/index.ts`; verify SC-004

- **Purpose**: Reach the five new primitives from the package's public entry point — the drift
  #156 leaves ungated, so this mission's own success criterion (SC-004) is the only thing that
  proves it didn't happen here.
- **Steps**:
  1. Add, in the same alphabetical-ish style as the existing list:
     ```ts
     export * from './data-table/index';
     export * from './disclosure/index';
     export * from './empty-state/index';
     export * from './facts/index';
     export * from './skip-link/index';
     ```
     (Insert each in its correct alphabetical position among the existing lines — don't just
     append all five at the bottom.)
  2. Update the file's header comment's directory count (it currently says "13 of the 15
     directories" — recompute the new totals: 18 directories with an `index.ts` should now be
     correct if none of the five is skipped; check `form-input`/`form-textarea` are still
     CSS-only exceptions before asserting a total).
  3. **Verify, don't assume**: write and run a small check (a throwaway Node/tsx script, or
     `node -e "..."` against the built `dist/` if that's simpler, or a temporary Vitest test you
     then remove) that imports the package entry point and asserts
     `SkFactsHTML`, `SkEmptyStateWithActionHTML` (or whatever your WP01 actually named the
     default-ish export), `SkDisclosureClosedHTML`, `SkSkipLinkUnfocusedHTML`, and
     `SkDataTableDefaultHTML` (adjust exact names to what the generator actually emitted — check
     each directory's generated `index.ts` for the real names) all resolve to non-empty strings.
     Record the exact check you ran and its result in this WP's Activity Log.
- **Files**: `packages/styles/src/index.ts` (edit).
- **Parallel?**: No — must run after WP01–WP03 have landed.

### Subtask T022 – Document forced-colors + reduced-motion baselines in `adding-a-component.md`

- **Purpose**: FR-011 — later components inherit these two baselines rather than re-deciding them.
  Epic #183 owns this here; it is not spun out into a new ticket.
- **Steps**:
  1. Add a new section to `docs/contributing/adding-a-component.md`, near the CSS-authoring step
     (`### 1. Author the CSS in packages/styles`), titled something like
     `### Forced-colors and reduced-motion baselines`.
  2. Reduced-motion: point at `packages/styles/src/transition-matrix/sk-transition-matrix.css`
     around line 237 as the canonical shape (a scoped `@media (prefers-reduced-motion: reduce)`
     block disabling a **named** transitioning property, not a blanket
     `* { transition: none }`), and name the two primitives from this mission
     (`sk-disclosure`, `sk-skip-link`) as further examples.
  3. Forced-colors: state plainly that no `forced-colors` block existed anywhere in the repo
     before this mission, and this mission establishes the pattern at exactly three locations:
     the skip-link's focused state, the disclosure marker, and the data-table's borders. Point at
     the actual files (`packages/styles/src/skip-link/sk-skip-link.css`,
     `packages/styles/src/disclosure/sk-disclosure.css`,
     `packages/styles/src/data-table/sk-data-table.css`) rather than re-deriving the CSS in prose.
  4. Keep it short — a few sentences plus the file pointers. Do not duplicate the CSS itself.
- **Files**: `docs/contributing/adding-a-component.md` (edit).
- **Parallel?**: Yes, with T021 (different file), but logically sequenced after WP01–WP03 land so
  the file pointers are accurate.

### Subtask T023 – Run the generator and its `--check` across all five directories

- **Purpose**: Confirm the generated barrels are current and no one hand-edited one.
- **Steps**:
  1. `node scripts/build-styles-only-markup.mjs`
  2. `node scripts/build-styles-only-markup.mjs --check` — must report success and list all five
     new directories (plus `form-field`) in its "styles-only barrels are current" message.
  3. If either command reports fewer than 6 styles-only directories (form-field + 5 new), one of
     WP01–WP03 is missing a `.css` or `.html` file — investigate rather than proceeding.
- **Files**: N/A (regenerates the five `index.ts` files; verification only beyond that).
- **Parallel?**: No — depends on WP01–WP03.

### Subtask T024 – Run the full mission gate suite and record evidence

- **Purpose**: Final mission-wide verification before reporting done, and the actual evidence to
  hand to the pre-merge adversarial gate.
- **Steps**:
  1. `npx stylelint "packages/styles/src/**/*.css"` — confirm zero violations, zero new
     `declaration-strict-value` exceptions across all five new directories combined.
  2. `npm run -s quality:htmlhint` — confirm clean across all authored `.html`.
  3. `npm run -s quality:lint` — confirm clean.
  4. `node scripts/check-story-theme-wrapper.mjs` then `--selftest` — confirm the repo-wide
     inert-`data-theme`-wrapper count did not rise; none of this mission's five new story files
     should be an offender.
  5. `npx nx run storybook:storybook:build` then `node scripts/run-axe-storybook.js` — confirm
     zero axe violations across every story, including all new ones. Background this if it risks
     exceeding a 2-minute foreground timeout; poll the log rather than sitting on the call.
  6. `grep -n "sk-status-\|sk-chart-" packages/tokens/src/tokens.css` — confirm no output (SC-006).
  7. Confirm the branch has been rebased on the current `train/elements-first` if it moved during
     the mission, and that all generated artifacts were regenerated after that rebase (SC-007).
  8. Record every command's real output (not a paraphrase) as this mission's final gate evidence.
- **Files**: N/A (verification only).
- **Parallel?**: No — run last, after T021–T023.

## Test Strategy

This WP's entire purpose is verification. No new production code beyond the six edited lines in
`index.ts` and the doc section. Every subtask above **is** the test strategy.

## Risks & Mitigations

- **Risk**: starting this WP before WP01–WP03 land, so the generator's derived set is incomplete
  and the entry-point edit references directories that don't exist yet. **Mitigation**: this WP's
  `dependencies` are WP01, WP02, WP03 in `tasks.md` — do not begin before all three are done.
- **Risk**: SC-004 gets "verified" by reading the diff instead of actually importing and
  resolving the exports. **Mitigation**: T021 requires a real check with a recorded result, not
  an eyeball pass.
- **Risk**: the axe/Storybook-build step is skipped because it's slow. **Mitigation**: background
  it and poll rather than skipping it — it is the only gate in this mission that catches a
  violation stylelint/htmlhint cannot see (e.g. an accessible-name problem on the data-table
  scroller, or a contrast failure on the skip-link's focused state).

## Review Guidance

- Confirm exactly five new `export *` lines were added and nothing else in `packages/styles/src/index.ts` changed except the header comment's directory count.
- Confirm the new doc section is genuinely new content, not a restatement that leaves the actual
  baselines undocumented.
- Re-run `build-styles-only-markup.mjs --check` yourself; it should already be clean.
- Ask for the actual axe/stylelint/htmlhint output rather than accepting "all gates pass" as a
  claim.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:34:59Z – system – Prompt created.
