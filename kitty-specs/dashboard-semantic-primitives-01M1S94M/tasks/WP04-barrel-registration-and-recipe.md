---
work_package_id: WP04
title: Barrel registration, package exports, docs, and mission-wide verification
dependencies:
- WP01
- WP02
- WP03
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
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
- T025
- T026
phase: Phase 2 - Closure
history:
- at: '2026-09-05T18:34:59Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
- at: '2026-09-05T20:50:00Z'
  actor: system
  action: Post-tasks adversarial squad findings folded (BLOCK verdict) — added package.json subpath-export scope, check-release-graph.mjs gate, mission-wide SC-002 grep, honest acceptance-matrix instantiation, and corrected doc-baseline pointers (row distinction not borders; establishes not generalises)
agent_profile: implementer-ivan
authoritative_surface: packages/styles/src/index.ts
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/index.ts
- packages/styles/package.json
- docs/contributing/adding-a-component.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP04 – Barrel registration, package exports, docs, and mission-wide verification

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`implement` work touching `packages/styles/src/index.ts`, `packages/styles/package.json`, and
`docs/`.

---

## ⚠️ IMPORTANT: Review Feedback

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_ref` field in the event log (via
  `spec-kitty agent tasks status` or the Activity Log below).
- **You must address all feedback** before your work is complete.
- **Report progress**: As you address each feedback item, update the Activity Log.

---

## Review Feedback

*A post-tasks adversarial squad reviewed this mission's plan/tasks before any WP was implemented
and returned a BLOCK verdict, since folded into this prompt. Nothing in this WP had been
implemented at that point. The most significant addition: `packages/styles/package.json` was
missing from this WP's scope entirely — an SC-004 gap that would have left the CSS unreachable as
a package import even with the barrel correctly registered.*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<dl>`, `<table>`
Use language identifiers in code blocks: ```python, ```bash

---

## Objectives & Success Criteria

Close out the mission: register all five new directories' generated barrels in the shared package
entry point, add their subpath exports to `package.json`, document the two cross-cutting
baselines in the authoring recipe (accurately this time), run the full local gate suite as final
mission evidence, verify SC-002 mission-wide, and record real evidence against the
already-instantiated acceptance matrix (`acceptance-matrix.json`'s content was authored during
the post-tasks squad fold, not by this WP).

**Do not start this WP until WP01, WP02, and WP03 have all landed on the branch** — you need all
five directories' `.html` files present so the generator's derived styles-only set includes all
five before you add their exports.

Done means:

- `packages/styles/src/index.ts` has one new `export *` line per new directory (five lines).
- `packages/styles/package.json` has one new `"./<name>/*": "./dist/<name>/*"` entry per new
  directory (five entries) — this was missing from the original plan.
- SC-004 is independently verified: importing the package entry point resolves every one of the
  five new generated export names, **and** that check is committed as a real test or its verbatim
  output is recorded in the PR body (not a throwaway script that gets deleted).
- `docs/contributing/adding-a-component.md` documents the forced-colors and reduced-motion
  baselines (FR-011) **accurately**: this mission establishes both (the prior reduced-motion
  precedent guarded nothing), and the three forced-colors locations are skip-link focus,
  disclosure marker, and data-table **row distinction** — not borders.
- `node scripts/build-styles-only-markup.mjs --check` is clean with all five new directories
  included in its reported set (run `--check` only from this WP — never the mutating form, see
  T023).
- `node scripts/check-release-graph.mjs` passes — `[ENFORCED]` at `ci-quality.yml:533`, checks
  the package.json subpath coverage above.
- SC-002 is verified mission-wide (all five primitives), not just for `.sk-data-table`.
- `acceptance-matrix.json`'s already-instantiated SC-001..SC-007 criteria and C-001..C-005
  negative invariants have real `pass_fail`/`result` and `evidence` filled in from this WP's own
  gate runs (T024/T025) and the other WPs' recorded checks (T026).
- The full local gate suite has been run and its real output recorded.
- SC-006 is verified: no `--sk-status-*`/`--sk-chart-*` token exists in
  `packages/tokens/src/tokens.css`.

## Context & Constraints

- Mission spec: `kitty-specs/dashboard-semantic-primitives-01M1S94M/spec.md` — read FR-007,
  FR-008, FR-011, NFR-001, SC-001, SC-002, SC-004 (corrected), SC-006, SC-007 (corrected).
- Mission plan: `kitty-specs/dashboard-semantic-primitives-01M1S94M/plan.md` — read "Corrected
  premises", IC-07, IC-08, IC-09, and the "Local gate commands" section.
- `packages/styles/src/index.ts` — read its existing header comment in full before editing. It
  explains #156/#174's per-directory drift and why `export *` only closes the per-*name* half of
  the problem. **Its stated directory/export count is already stale** (measured: 16 directories,
  13 with `index.ts`, three CSS-only — `form-input`, `form-textarea`, **and
  `transition-matrix`** — not the two the comment names). This comment has already been corrected
  twice by prior lenses. **Delete the count from the header rather than recomputing it a third
  time** — state that CSS-only directories are derived by
  `scripts/build-styles-only-markup.mjs`'s own logic, with no number to go stale. **You are the
  single writer of this file in the whole mission** — no other WP touches it.
- `packages/styles/package.json` — read its `exports` map. It currently has 16 `./<dir>/*` entries
  matching the 16 existing directories under `packages/styles/src`. Add five more, alphabetically
  placed, matching the new directories exactly. **You are the single writer of this file too.**
- `docs/contributing/adding-a-component.md` — read it in full; it's the authoring recipe FR-011
  requires you to extend. Add a concise new section (its own `##` heading, near the CSS-authoring
  step) rather than scattering notes across existing sections.
- This mission adds **no** new package directory — all five new directories live inside the
  existing `packages/styles` project, so `.github/workflows/ci-quality.yml`'s `components` path
  filter already covers them. Confirm this is true (grep the filter) rather than assuming it, but
  do not edit that workflow file unless the grep proves it's actually missing coverage. The
  `check-release-graph.mjs` gate is a **separate** job (`release`), not gated by the `components`
  filter at all — it runs on its own path filter/trigger; no workflow edit is needed there either,
  only the `package.json` content change.
- A caution: `lanes.json`'s `mission_branch` field names
  `kitty/mission-dashboard-semantic-primitives-01M1S94M`, a branch that does not exist. This
  mission's real, only branch is `mission/dashboard-semantic-primitives`.

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/dashboard-semantic-primitives`.
- **Planning base branch**: `mission/dashboard-semantic-primitives`
- **Merge target branch**: `mission/dashboard-semantic-primitives`

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T021 – Add five `export *` lines to `packages/styles/src/index.ts` + five subpath exports to `package.json`; verify SC-004

- **Purpose**: Reach the five new primitives from the package's public entry point, and make the
  CSS reachable as a package import — the drift #156 leaves ungated, and the package.json gap the
  original plan missed entirely.
- **Steps**:
  1. Add, in the same alphabetical-ish style as the existing list, to
     `packages/styles/src/index.ts`:
     ```ts
     export * from './data-table/index';
     export * from './disclosure/index';
     export * from './empty-state/index';
     export * from './facts/index';
     export * from './skip-link/index';
     ```
     (Insert each in its correct alphabetical position among the existing lines — don't just
     append all five at the bottom.)
  2. Edit the file's header comment: **delete the stale directory/export count** rather than
     recomputing it (see Context above for why). Replace a sentence like "13 of the 15
     directories... (`form-input` and `form-textarea` are CSS-only)" with something that names the
     mechanism, not a number — e.g. "one line per component directory that has an `index.ts`;
     CSS-only directories (no `index.ts`) are derived by
     `scripts/build-styles-only-markup.mjs` — see that script for the current list."
  3. Add one `"./<name>/*": "./dist/<name>/*"` entry per new directory to
     `packages/styles/package.json`'s `exports` map, in the same alphabetical position as the
     existing 16 entries:
     ```json
     "./data-table/*": "./dist/data-table/*",
     "./disclosure/*": "./dist/disclosure/*",
     "./empty-state/*": "./dist/empty-state/*",
     "./facts/*": "./dist/facts/*",
     "./skip-link/*": "./dist/skip-link/*",
     ```
  4. **Verify SC-004, don't assume it.** Write a check that imports the package entry point and
     asserts `SkFactsHTML` (or whatever WP01 actually named its default export — check each
     directory's generated `index.ts` for the real names), a disclosure export, a skip-link
     export, a data-table export, and an empty-state export all resolve to non-empty strings.
     **Commit this check as a real test, or record its verbatim output in the PR body** —
     `packages/styles/project.json` has no `test` target today, so recording verbatim output in
     the PR body is the pragmatic choice here rather than inventing new test infrastructure
     mid-WP; a throwaway script deleted after one manual run reproduces the exact conditions that
     let `SkGridGap4HTML` go missing in the first place (nothing left to catch the next
     regression).
- **Files**: `packages/styles/src/index.ts` (edit), `packages/styles/package.json` (edit).
- **Parallel?**: No — must run after WP01–WP03 have landed.

### Subtask T022 – Document forced-colors + reduced-motion baselines in `adding-a-component.md`

- **Purpose**: FR-011 — later components inherit these two baselines rather than re-deciding them.
  Epic #183 owns this here; it is not spun out into a new ticket.
- **Steps**:
  1. Add a new section to `docs/contributing/adding-a-component.md`, near the CSS-authoring step
     (`### 1. Author the CSS in packages/styles`), titled something like
     `### Forced-colors and reduced-motion baselines`.
  2. **Reduced-motion**: state that this mission establishes the first real guard of this kind —
     `sk-transition-matrix.css:237` looks like a precedent but measurably isn't one (it guards
     `scroll-behavior`, which nothing in `packages/styles` sets to `smooth`). The pattern to
     follow is: a `@media (prefers-reduced-motion: reduce)` block scoped to the exact selector and
     property that transitions, never a wildcard. Point at `sk-disclosure.css` and
     `sk-skip-link.css` as the real, working examples.
  3. **Forced-colors**: state plainly that no `forced-colors` block existed anywhere in the repo
     before this mission, and this mission establishes the pattern at exactly three locations: the
     skip-link's focused state, the disclosure marker, and the data-table's **zebra/hover row
     distinction** — not borders (a plain border already survives forced-colors mode with no
     author rule; the background-based row distinction does not). Point at the actual files
     (`packages/styles/src/skip-link/sk-skip-link.css`,
     `packages/styles/src/disclosure/sk-disclosure.css`,
     `packages/styles/src/data-table/sk-data-table.css`) rather than re-deriving the CSS in prose.
  4. Also document the **sanctioned forced-colors stylelint pattern**: use the unpoliced
     `border:`/`outline:` shorthand with a system-color keyword (`CanvasText`, `Highlight`),
     never the `-color` longhand (`border-color`, `outline-color`), which `declaration-strict-value`
     polices and system colors aren't in its `ignoreValues`.
  5. Keep it short — a few sentences plus the file pointers. Do not duplicate the CSS itself.
- **Files**: `docs/contributing/adding-a-component.md` (edit).
- **Parallel?**: Yes, with T021 (different file), but logically sequenced after WP01–WP03 land so
  the file pointers are accurate.

### Subtask T023 – Run the generator's `--check` only across all five directories

- **Purpose**: Confirm the generated barrels are current and no one hand-edited one — without
  overstepping this WP's write scope.
- **Steps**:
  1. `node scripts/build-styles-only-markup.mjs --check` — must report success and list all five
     new directories (plus `form-field`) in its "styles-only barrels are current" message.
  2. **Do not run the mutating form (`node scripts/build-styles-only-markup.mjs` without
     `--check`) from this WP.** It rewrites every styles-only directory's `index.ts`, including
     WP01–03's — that is outside `lane-d`'s declared write scope (`owned_files` above lists only
     `packages/styles/src/index.ts`, `packages/styles/package.json`,
     `docs/contributing/adding-a-component.md`, and `acceptance-matrix.json` — not any individual
     primitive directory).
  3. If `--check` reports staleness in a directory this WP doesn't own (e.g. `facts/index.ts` is
     out of date), that is a defect in the WP that owns that directory — bounce it back rather
     than regenerating it from here.
- **Files**: N/A (verification only — no write from this subtask).
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
     zero axe violations across every story, including all new ones and the skip-link's
     `Focused` story (whose `play()`-driven real focus is what makes its contrast check possible
     at all). Background this if it risks exceeding a 2-minute foreground timeout; poll the log
     rather than sitting on the call.
  6. `node scripts/check-release-graph.mjs --selftest` then
     `npx nx run-many --target=build --projects=tokens,styles` then
     `node scripts/check-release-graph.mjs` — `[ENFORCED]` at `ci-quality.yml:533`, this is the
     gate that actually checks the `package.json` subpath-export requirement from T021. This gate
     was absent from this mission's original local-gate list; it is not optional.
  7. `grep -n "sk-status-\|sk-chart-" packages/tokens/src/tokens.css` — confirm no output (SC-006).
  8. Confirm the branch has been rebased on the current `train/elements-first` if it moved during
     the mission, and that all generated artifacts were regenerated after that rebase (SC-007).
  9. Record every command's real output (not a paraphrase) as this mission's final gate evidence.
- **Files**: N/A (verification only).
- **Parallel?**: No — run after T021–T023, before T025/T026 or interleaved with them.

### Subtask T025 – Mission-wide SC-002 grep across all five primitives, with per-tag match counts

- **Purpose**: The original plan verified SC-002 (authored `.html` contains the real native tag)
  for `.sk-data-table` only. Extend that to all five primitives in one place.
- **Steps**:
  1. Run one grep per primitive against its own directory and record the match count:
     ```sh
     grep -rc '<dl' packages/styles/src/facts/*.html
     grep -rc '<details' packages/styles/src/disclosure/*.html
     grep -rc '<table' packages/styles/src/data-table/*.html
     grep -rc '<a ' packages/styles/src/skip-link/*.html
     ```
  2. `.sk-empty-state` has no single required native tag (it's a plain block container per FR-005)
     — note this explicitly as "not applicable, by design" rather than silently omitting it from
     the check, so a reviewer doesn't read the omission as an oversight.
  3. Record the exact commands and counts as this WP's evidence — this is SC-002 verified
     mission-wide, closing the gap the original plan left.
- **Files**: N/A (verification only; evidence recorded in Activity Log / PR body).
- **Parallel?**: No — depends on WP01–WP03 (needs all directories' `.html` files).

### Subtask T026 – Run the acceptance-matrix's SC/C checks and record real evidence

- **Purpose**: `acceptance-matrix.json` was already instantiated during the post-tasks squad fold
  — it holds seven real `SC-001`..`SC-007` criteria (honest `proof_type`s, no `automated_test`
  claims this package can't back) and five `C-001`..`C-005` negative invariants, replacing the
  CLI's original 11 TODO placeholders. **This subtask does not author that content — it runs the
  checks the matrix already specifies and records the result.** `acceptance-matrix.json` lives
  under `kitty-specs/` and is not in this WP's `owned_files` (WPs may not own paths under
  `kitty-specs/`); update it through the mission's normal spec-artifact write path, not a plain
  `git commit` from this WP's lane, if that path differs.
- **Steps**:
  1. Read `kitty-specs/dashboard-semantic-primitives-01M1S94M/acceptance-matrix.json` and run each
     `negative_invariants[].verification_command` (five commands, C-001..C-005) exactly as
     written. Record each `result` (`pending` was the seed value; update to whatever the schema's
     real result vocabulary is for a passing/failing negative invariant — check
     `NEGATIVE_INVARIANT_RESULTS` in `specify_cli.acceptance.matrix` if unsure) and `evidence`
     (the actual command output).
  2. For each `criteria[]` row (SC-001..SC-007), run the check its `notes` field describes (most
     point at a WP's own subtask — e.g. SC-003 points at WP03 T018's accessibility-tree check,
     SC-002 points at T025's mission-wide grep). Fill in `pass_fail`, `evidence`, `verified_by`,
     and `verified_at` from the real gate run in T024 and the mission-wide checks in T025.
  3. Do not add an eighth criterion or a sixth negative invariant without also updating
     `spec.md`'s SC-*/C-* list — the matrix's rows are meant to track the spec's, not diverge
     from it.
- **Files**: `kitty-specs/dashboard-semantic-primitives-01M1S94M/acceptance-matrix.json` (updated
  with real results — content already authored, not a WP04-owned file).
- **Parallel?**: No — depends on T021–T025 (needs their real output to fill in evidence).

## Test Strategy

This WP's entire purpose is verification. Production-facing changes are limited to the entry
point, the package.json exports map, and the doc section; everything else is a check or a matrix
entry. Every subtask above **is** the test strategy.

## Risks & Mitigations

- **Risk**: starting this WP before WP01–WP03 land, so the generator's derived set is incomplete
  and the entry-point/exports edits reference directories that don't exist yet. **Mitigation**:
  this WP's `dependencies` are WP01, WP02, WP03 — do not begin before all three are done.
- **Risk**: SC-004 gets "verified" by reading the diff instead of actually importing and
  resolving the exports, or the check is a throwaway script deleted after one run. **Mitigation**:
  T021 requires a real check with a recorded result, committed or PR-body-recorded, not an
  eyeball pass.
- **Risk**: forgetting `packages/styles/package.json`'s subpath exports even after fixing
  `index.ts`. **Mitigation**: `check-release-graph.mjs` is `[ENFORCED]` in CI and will fail
  loudly — but confirm it locally in T024 rather than discovering it in CI.
- **Risk**: the axe/Storybook-build step is skipped because it's slow. **Mitigation**: background
  it and poll rather than skipping it — it is the only gate in this mission that catches a
  violation stylelint/htmlhint cannot see (e.g. an accessible-name problem on the data-table
  scroller, or the skip-link's focus-state contrast, which specifically depends on the `Focused`
  story's `play()` function actually running — see WP02).
- **Risk**: this WP's mutating a directory it doesn't own (running the generator without
  `--check`). **Mitigation**: T023 explicitly forbids the mutating form from this WP.
- **Risk**: the doc section in `adding-a-component.md` repeats the "generalises"/"table borders"
  errors this fold exists to correct. **Mitigation**: T022 states both corrections explicitly.

## Review Guidance

- Confirm exactly five new `export *` lines were added to `index.ts` and five new subpath entries
  to `package.json`, and that the header-comment count was deleted, not recomputed.
- Confirm the new doc section states the corrected facts: reduced-motion is *established*, not
  generalised; the third forced-colors location is row distinction, not borders.
- Re-run `build-styles-only-markup.mjs --check` yourself; it should already be clean, and it
  should be the only form of the generator this WP ran.
- Confirm `check-release-graph.mjs` passes and was actually run (not assumed from the package.json
  diff alone).
- Confirm `acceptance-matrix.json` has seven real `SC-00N` criteria and five `C-00N` negative
  invariants, none of them still reading "TODO: replace with a real acceptance criterion".
- Ask for the actual axe/stylelint/htmlhint/release-graph output rather than accepting "all gates
  pass" as a claim.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:34:59Z – system – Prompt created.
- 2026-09-05T20:50:00Z – system – Folded post-tasks adversarial squad findings (BLOCK verdict): added packages/styles/package.json to scope (SC-004 gap), added check-release-graph.mjs gate, restricted the generator to --check-only from this WP, added mission-wide SC-002 verification (T025), added honest acceptance-matrix instantiation (T026), and corrected the doc-baseline pointers.
