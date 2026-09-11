---
work_package_id: WP01
title: Two-token split (--sk-border-control-invalid, --sk-fg-error), four consumer repoints, and the anti-inversion guard
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
planning_base_branch: mission/invalid-boundary-light-contrast
merge_target_branch: mission/invalid-boundary-light-contrast
branch_strategy: Planning artifacts for this mission were generated on mission/invalid-boundary-light-contrast (single_branch topology — no separate coordination branch). Work and commit directly on the mission branch; completed changes must merge back into mission/invalid-boundary-light-contrast unless the human explicitly redirects the landing branch. The eventual PR runs from this branch into train/elements-first with Refs #350 (never Closes #350).
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
- T011
- T012
- T013
- T014
- T015
- T016
- T017
- T018
- T019
phase: Phase 1 - The mission's only Work Package
history:
- at: '2026-09-11T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/
create_intent:
- evidence/guard-red-base.txt
- evidence/guard-red-reintroduced.txt
- evidence/guard-green.txt
- packages/styles/src/form-field/sk-form-field-html.stories.ts (new LightModeError export)
- packages/styles/src/form-select/sk-form-select-html.stories.ts (new LightModeInvalid export)
- packages/elements/src/form-input/sk-form-input.stories.ts (new LightModeError export)
- packages/elements/src/form-textarea/sk-form-textarea.stories.ts (new LightModeError export)
execution_mode: code_change
model: ''
owned_files:
- packages/tokens/src/tokens.css
- packages/tokens/dist/token-catalogue.json
- packages/styles/src/form-field/sk-form-field.css
- packages/styles/src/form-field/sk-form-field-html.stories.ts
- packages/styles/src/form-input/sk-form-input.css
- packages/elements/src/form-input/sk-form-input.css.js
- packages/elements/src/form-input/sk-form-input.css.d.ts
- packages/elements/src/form-input/sk-form-input.stories.ts
- packages/styles/src/form-select/sk-form-select.css
- packages/styles/src/form-select/sk-form-select-html.stories.ts
- packages/styles/src/form-textarea/sk-form-textarea.css
- packages/elements/src/form-textarea/sk-form-textarea.css.js
- packages/elements/src/form-textarea/sk-form-textarea.css.d.ts
- packages/elements/src/form-textarea/sk-form-textarea.stories.ts
- packages/elements/SIZES.md
- tests/node/form-input-border-control-contrast.test.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-input-light-error.png
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-form-input-light-error.png
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-form-select-light-invalid.png
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-form-textarea-light-error.png
- docs/design-system/changelog.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Two-token split, four consumer repoints, and the anti-inversion guard

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any
user-defined profile), and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this
work package's `task_type` and `authoritative_surface`.

---

## ⚠️ IMPORTANT: Review Feedback

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_ref` field in the event log (via
  `spec-kitty agent tasks status` or the Activity Log below).
- **You must address all feedback** before your work is complete. Feedback items are your
  implementation TODO list.
- **Report progress**: As you address each feedback item, update the Activity Log explaining what
  you changed.

---

## Review Feedback

*(none yet — this is the first pass)*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<input>`, `<sk-form-input>`
Use language identifiers in code blocks: `css`, `ts`, `bash`

---

## Objectives & Success Criteria

Fix `packages/tokens/src/tokens.css`'s `--sk-color-red` invalid-boundary regression (issue #350):
in light theme, an errored form control's boundary is *less* visible than the same control at rest
(2.69/2.93/2.60/2.26/2.37:1 vs. 3.98/4.34/3.85/3.51/3.35:1 across five surfaces), the exact inverse
of the intended emphasis. Ship this as ONE Work Package and ONE PR back onto `train/elements-first`,
`Refs #350` (never `Closes #350` — a train-targeting merge fires no GitHub closing keyword).

**This mission implements Option B, already decided in `plan.md` §2 — it does not re-open Fork 1 or
Fork 2.** Option A (re-theming `--sk-color-red` itself) is proven arithmetically impossible in
`plan.md` §2.1: `--sk-fg-on-primary` (`#1A1408`, no light override) paired against
`ribbon-card`'s `--red` fill caps at 4.22:1 for any hex that also satisfies the light relational
floor — below AA's 4.5:1 for that 12px-bold label — and no story renders that pair, so the failure
would ship invisibly. Instead: two new tokens, `--sk-border-control-invalid` (non-text, ≥3:1) and
`--sk-fg-error` (text, ≥4.5:1), both resolving to hexes **already ratified in this file today**
(`#E97373` dark, `#6B2424` light — the value `--sk-on-tint-rose` already carries). This mission adds
token names, not colours. The guard covers **five** surfaces (`page`, `card`, `input`, `muted`,
`pill`), matching its sibling `--sk-border-control` test — not the four the issue's own table names
(plan.md §3).

Success is:

1. `--sk-border-control-invalid` and `--sk-fg-error` exist in **both** theme blocks of
   `packages/tokens/src/tokens.css`, as independent hex literals — **not** `var()` aliases of
   `--sk-color-red` or `--sk-on-tint-rose` — with the derivation and measured ratios recorded beside
   the declarations (FR-006, FR-009, C-002, C-008).
2. The five boundary declarations (`sk-form-field.css` ×2, `sk-form-input.css` ×1,
   `sk-form-select.css` ×1, `sk-form-textarea.css` ×1) and the three error-copy declarations
   (`sk-form-field.css`, `sk-form-input.css`, `sk-form-textarea.css`) are repointed to the two new
   tokens; `status-indicator`, `ribbon-card`, `transition-matrix`, and both Storybook documentation
   swatches are untouched (FR-007, NFR-001, NFR-002, NFR-004, C-005, C-008).
3. `tests/node/form-input-border-control-contrast.test.ts` discovers the invalid-boundary and
   error-copy tokens from the CSS itself (never hard-coded), resolves them through the cascade
   (including the `:root` fallback that reproduces the shipping defect), and asserts an absolute
   floor, a relational floor against `--sk-border-control`, a dark non-regression floor, and the
   text floor, across all five surfaces in both themes — demonstrated red twice (unmodified tree,
   deliberate reintroduction) before green (FR-001 through FR-005, FR-008, NFR-001 through NFR-003,
   C-004).
4. `packages/tokens/dist/token-catalogue.json`, the generated element `.css.js`/`.css.d.ts` mirrors,
   and `packages/elements/SIZES.md` are regenerated by their own scripts, never hand-edited
   (FR-012, C-007), and `npx nx run tokens:catalogue --skip-nx-cache` re-run afterward produces zero
   diff (NFR-005).
5. Four new light+invalid/error Storybook stories exist, four new clipped visual-regression tests
   exist in `visual.spec.ts`, and their baselines are harvested from a CI run's
   `visual-regression-diffs` artifact — never a local `--update-snapshots` (NFR-004, FR-007).
6. `node scripts/run-axe-storybook.js` reports zero WCAG 2.1 AA violations on every story touched or
   added, including the four new ones (NFR-006).
7. `docs/design-system/changelog.md` gains one `[Unreleased]` → `Changed` entry naming both tokens,
   both theme values, all twenty measured ratios, and the guard.
8. The PR body names all six real `--sk-color-red` consumers with an explicit "changed, re-baselined"
   or "unchanged, proven by [mechanism]" disposition (FR-007, NFR-004), carries an explicit request
   for human sign-off on the token-namespace change distinct from the mission's own adversarial-squad
   evidence (C-002, FR-011), confirms C-006/FR-010's new-category documentation obligation was not
   triggered, states `Refs #350` (FR-013), and reports the operator `[NEEDS DECISION]` follow-up
   below as an FYI this mission does not depend on.
9. `npm run quality:all`, the full `npm run test`, the full Playwright suite (including the
   scoped visual run), and `git status --porcelain` are all clean/empty after all regeneration.

## Context & Constraints

- **Read first, in this order**: `.kittify/charter/charter.md` (Review Policy — token-namespace
  human sign-off); `docs/contributing/adding-a-token.md`; this mission's `spec.md` (`cacefc3d`) and
  `plan.md` (`d731e933`) in full — the plan is settled and unusually well-evidenced; do not
  re-derive or second-guess its arithmetic.
- **Source issue**: `gh issue view 350 --repo spec-kitty/spec-kitty-design` — read the complete live
  issue; do not rely solely on this prompt's paraphrase. Also relevant: #339 (where this was found,
  at the pre-merge gate), #321 (raised `--sk-border-control`, deliberately left the invalid state
  untouched, and is this mission's closest sibling — its own WP prompt,
  `kitty-specs/form-input-contrast-touch-target-contract-01M25STR/tasks/WP01-border-token-and-target-size.md`,
  is a structural precedent for this one), #155 (the original weak-boundary finding on a different
  control — not this mission's to close or widen), #177 (`--sk-on-tint-rose`'s own token, whose
  light value this mission's tokens resolve to), #217 (ratified the rose derivation).
- **The two new tokens MUST be independent literals, not `var()` aliases.** `tokens.css:199-208`
  (the `--sk-border-control` declaration comment from #321) is the standing instruction: aliasing
  would couple a 3:1 non-text obligation to a token that moves for an unrelated reason, and
  `check-token-breaking-changes.sh` computes no contrast, so nothing would catch a future silent
  regression of that coupling. Do not alias `--sk-color-red` (dark) or `--sk-on-tint-rose` (light)
  even though the hex values match today.
- **Do NOT touch** `packages/styles/src/status-indicator/sk-status-indicator.css` (C-005 — zero live
  `--sk-color-red` declarations; its three grep hits are entirely inside one comment),
  `packages/styles/src/ribbon-card/*`, `packages/styles/src/transition-matrix/*`, or either
  Storybook documentation swatch (`brand.mdx`, `colours.mdx`) — all four are named, unchanged
  consumers per plan.md §7, and an accidental touch to any of them is a defect in this WP, not an
  improvement.
- **Do NOT touch** `--sk-color-red` or `--sk-color-red-soft` themselves, anywhere. They remain
  correct as brand-hue tokens declared once in `:root`, matching every other member of the
  `--sk-color-*` family.
- **Do NOT create a new token category.** `border` and `fg` both already exist in the catalogue (9
  and 7 tokens respectively) — C-006/FR-010's documentation obligation (`adding-a-token.md`'s
  category table, `using-tokens.md`) is not triggered. Confirm this explicitly in the PR body (T019)
  rather than silently skipping it.
- **Do NOT wire `apps/storybook/src/tests/visual.spec.ts` for `ribbon-card`'s `LightMode` story.**
  Plan.md §1.3 confirms it renders no red variant — wiring it would evidence nothing and is out of
  scope under Option B regardless.
- **Tokens-first CSS** (C-008): every repointed declaration value is a `var(--sk-*)` reference; the
  only raw hex literals in the entire diff are the four new declarations inside `tokens.css` itself.
- **Never hand-edit generated files**: `packages/tokens/dist/token-catalogue.json`, the four
  `.css.js`/`.css.d.ts` element mirrors, `packages/elements/SIZES.md`. Regenerate them with their own
  scripts (T002, T007, T008).
- **This is a single WP by mandate** (C-001, FR-013, SC-009) and the scope is genuinely small enough
  to fit comfortably — see `tasks.md`'s "Work Package count" note and `plan.md` §12. If this
  genuinely cannot be delivered as one PR, STOP and report rather than splitting unilaterally.
- **The `[NEEDS DECISION]` in `plan.md` §11 is for the operator, not for this WP.** Report it in the
  PR body (T019); do not attempt to resolve `ribbon-card`'s unguarded `--red` pair or
  `transition-matrix`'s blocked-row 1.4.11 gap in this mission.

## Branch Strategy

- **Strategy**: single_branch — this mission has no separate coordination branch. Work and commit
  directly on the mission branch.
- **Planning base branch**: `mission/invalid-boundary-light-contrast`
- **Merge target branch**: `mission/invalid-boundary-light-contrast` (the PR back to
  `train/elements-first` happens from this branch, `Refs #350`, never `Closes #350`).

> These fields are populated automatically by `spec-kitty agent mission tasks`. Do NOT change them
> manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T001 – Declare the two new tokens, both theme blocks, as independent literals

- **Purpose**: Land the token layer everything else in this WP references. **Both tokens are
  literals, not aliases** — see the "MUST be independent literals" note above before starting.
- **Steps**:
  1. In `packages/tokens/src/tokens.css`'s Borders section (alongside `--sk-border-control`, near
     line 210), add `--sk-border-control-invalid: #E97373;` to `:root`.
  2. In the same `:root` block, near the Foregrounds section (alongside `--sk-fg-on-primary`, near
     line 192), add `--sk-fg-error: #E97373;`.
  3. In the light-mode override block (`:root[data-theme="light"], .sk-light`, lines 384-536), add
     `--sk-border-control-invalid: #6B2424;` and `--sk-fg-error: #6B2424;` in the mirrored positions.
  4. Beside the `:root` declarations, add a comment recording: (a) that both are deliberately
     independent literals, not aliases of `--sk-color-red` (dark) or `--sk-on-tint-rose` (light),
     citing the same decoupling rationale `tokens.css:199-208` gives for `--sk-border-control`; (b)
     that both hexes already exist and are already ratified in this file (`#E97373` = `--sk-color-red`,
     `#6B2424` = `--sk-on-tint-rose`, derived under #177/#217) — this mission adds names, not values;
     (c) the twenty measured ratios from `plan.md` §2.6 (five surfaces × two themes × {absolute,
     relational, text}), in the same `ratio : 1` format the file's existing comments use.
- **Files**: `packages/tokens/src/tokens.css`.
- **Parallel?**: No — foundation for every other subtask.
- **Notes**: This subtask also carries forward spec.md's C-003 ("the A/B fork is a plan-phase
  decision") — the fork is already resolved by `plan.md`; this subtask implements that resolution
  and does not re-open it.

### Subtask T002 – Regenerate the token catalogue

- **Purpose**: Keep `packages/tokens/dist/token-catalogue.json` (the source `stylelint`'s
  strict-value allowlist reads) current with T001's two new tokens, **before** any sheet is
  repointed.
- **Steps**:
  1. Run `npx nx run tokens:catalogue --skip-nx-cache`.
  2. `git diff -- packages/tokens/dist/token-catalogue.json` — expect two new token entries (binned
     as `border` and `fg`) plus a `generated_at` timestamp change.
  3. Run `bash scripts/check-token-breaking-changes.sh` — expect "New tokens added (non-breaking)"
     reported twice, zero removals.
- **Files**: `packages/tokens/dist/token-catalogue.json` (generated).
- **Parallel?**: No — after T001, before T003-T006.
- **Notes**: Skipping or reordering this step makes every repointed declaration in T003-T006 red
  under `npm run quality:stylelint` with a message that reads like a naming mistake, not an ordering
  one.

### Subtask T003 – Repoint `sk-form-field.css` (three declarations)

- **Purpose**: Fix the static `.sk-input`/`.sk-textarea` path's invalid-boundary and error-copy
  declarations.
- **Steps**:
  1. `.sk-form-field--error .sk-form-field__description` (line 27, text color) →
     `var(--sk-fg-error)`.
  2. `.sk-input[aria-invalid="true"]` (line 82, border color) → `var(--sk-border-control-invalid)`.
  3. `.sk-textarea[aria-invalid="true"]` (line 123, border color) →
     `var(--sk-border-control-invalid)`.
- **Files**: `packages/styles/src/form-field/sk-form-field.css`.
- **Parallel?**: [P] with T004, T005, T006 (different files).
- **Notes**: Change only the referenced custom property on each declaration; do not touch
  `border-style`, `border-width`, or any other property on these rules.

### Subtask T004 – Repoint `sk-form-input.css` (two declarations)

- **Purpose**: Fix the live element path's invalid-boundary and error-copy declarations.
- **Steps**:
  1. `.sk-form-input__control[aria-invalid="true"]` (line 113, border color) →
     `var(--sk-border-control-invalid)`.
  2. `.sk-form-input__error` (line 140, text color) → `var(--sk-fg-error)`.
- **Files**: `packages/styles/src/form-input/sk-form-input.css`.
- **Parallel?**: [P] with T003, T005, T006.
- **Notes**: This file's generated `.css.js`/`.css.d.ts` mirror must be regenerated afterward (T007)
  — do not skip that step because the source change looks small.

### Subtask T005 – Repoint `sk-form-select.css` (one declaration)

- **Purpose**: Fix `form-select`'s `:invalid` boundary.
- **Steps**: `.sk-form-select:invalid` (line 32, border color) → `var(--sk-border-control-invalid)`.
  Leave `border-style: double` and `border-width: var(--sk-border-width-2)` untouched — this mission
  changes only the color the rule resolves to, not its style or width.
- **Files**: `packages/styles/src/form-select/sk-form-select.css`.
- **Parallel?**: [P] with T003, T004, T006.
- **Notes**: `form-select` has no error-copy declaration in this component — only the border color
  changes here.

### Subtask T006 – Repoint `sk-form-textarea.css` (two declarations)

- **Purpose**: Fix the live element path's invalid-boundary and error-copy declarations — the
  component with zero existing visual coverage of any kind.
- **Steps**:
  1. `.sk-form-textarea__control[aria-invalid="true"]` (line 107, border color) →
     `var(--sk-border-control-invalid)`.
  2. `.sk-form-textarea__error` (line 134, text color) → `var(--sk-fg-error)`.
- **Files**: `packages/styles/src/form-textarea/sk-form-textarea.css`.
- **Parallel?**: [P] with T003, T004, T005.
- **Notes**: This file's generated `.css.js`/`.css.d.ts` mirror must also be regenerated (T007).

### Subtask T007 – Regenerate the generated element CSS mirrors

- **Purpose**: Propagate T004's and T006's source changes into the artifacts `<sk-form-input>` and
  `<sk-form-textarea>` actually adopt.
- **Steps**:
  1. Run `node scripts/build-elements-css.mjs` (no `--check` — this invocation WRITES the
     regenerated output).
  2. Confirm `packages/elements/src/form-input/sk-form-input.css.js`/`.css.d.ts` and
     `packages/elements/src/form-textarea/sk-form-textarea.css.js`/`.css.d.ts` now reflect the new
     token name.
  3. Run `node scripts/build-elements-css.mjs --check` to confirm currency.
- **Files**: the four generated `.css.js`/`.css.d.ts` files.
- **Parallel?**: No — after T004 and T006.
- **Notes**: Forgetting this step is silently NOT caught by stylelint or typecheck alone — only
  `--check` (re-run in T017) catches the drift, and it is an ENFORCED gate in `ci-quality.yml`.

### Subtask T008 – Build elements and regenerate `SIZES.md`

- **Purpose**: Keep `packages/elements/SIZES.md` current — `--sk-color-red` (14 chars) →
  `--sk-border-control-invalid` (27 chars) grows each of the two element sheets by 13 bytes per
  occurrence, so the committed byte counts go stale.
- **Steps**:
  1. `npx nx run elements:build --skip-nx-cache` (build first — `measure-elements-sizes.mjs` reads
     `dist/` and does not build it).
  2. `node scripts/measure-elements-sizes.mjs`.
  3. `node scripts/measure-elements-sizes.mjs --check`.
- **Files**: `packages/elements/SIZES.md` (generated).
- **Parallel?**: No — after T007.
- **Notes**: This gate is ENFORCED twice in CI (the storybook job and the release job). If the
  committed figures and a later CI run disagree, trust CI and re-measure after a clean `npm ci`,
  per plan.md R-4 — do not assume a stale local measurement.

### Subtask T009 – Grow the guard (discovery, resolver, all assertions)

- **Purpose**: Build the mechanical proof that the invalid boundary is never weaker than the resting
  boundary, in either theme, on any of five surfaces — and that the error copy independently clears
  its own 4.5:1 floor. This is FR-001 through FR-004, FR-008, and NFR-001 through NFR-003's entire
  mechanism.
- **Steps**:
  1. In `tests/node/form-input-border-control-contrast.test.ts`, refactor the existing hex-reading
     helper into `resolveToken(source, selector, token)`: (a) look for the declaration in the
     requested theme block; (b) **fall back to `:root` when the token is absent there** — this is
     real CSS cascade behaviour, and it is what reproduces the shipping defect when this resolver is
     later run against the unmodified tree in T010; (c) follow at most one `var()` hop; (d) assert
     the final value is a hex literal, throwing a named error otherwise. Refactor the existing
     `--sk-border-control` and surface-token lookups onto this same helper — one resolver, not two.
  2. **Discovery — the invalid boundary**: parse `sk-form-field.css`, `sk-form-input.css`,
     `sk-form-select.css`, `sk-form-textarea.css` with `postcss`; collect the `border-color` (or
     shorthand `border`) declaration of every rule whose selector contains `[aria-invalid="true"]`
     or `:invalid`. Assert the collected set is **non-empty** and that every member resolves to a
     single `var(--sk-*)` reference naming one token. This non-empty assertion is load-bearing: a
     future selector rename must not silently make this guard pass over zero inputs.
  3. **Discovery — the error copy**: same technique, over
     `.sk-form-field--error .sk-form-field__description`, `.sk-form-input__error`,
     `.sk-form-textarea__error`. Assert non-empty, single-valued.
  4. **The assertions**, for each theme × each of the five surfaces (`page`, `card`, `input`,
     `muted`, `pill`):
     - **Absolute (FR-002/NFR-001)**: `ratio(invalid, surface) ≥ 3.0`, message naming theme, surface,
       both hexes, and the measured ratio.
     - **Relational (FR-003/NFR-002)**: `ratio(invalid, surface) ≥ ratio(borderControl, surface)`,
       message naming both ratios.
     - **Dark non-regression (FR-004/NFR-003)**, dark only: `ratio ≥` a pinned per-surface constant
       `{ page: 6.58, card: 5.94, input: 5.63, muted: 4.79, pill: 5.08 }` — a named object with a
       comment recording these are the pre-fix measurements at `93c82f14`. Pinned numbers, not a
       computed comparison (a computed one would move with the token and assert nothing).
     - **Error copy**: `ratio(errorCopy, surface) ≥ 4.5` in both themes, all five surfaces.
  5. Test titles carry no `[FR-0xx]` tag unless `behaviours.json` declares it — none of this
     mission's FRs are in that registry, so free-form tags (or none) are safe and consistent with
     the file's existing style (its own `[FR-012]` tag is not in `behaviours.json` either).
- **Files**: `tests/node/form-input-border-control-contrast.test.ts`.
- **Parallel?**: No — depends on T001-T008 (the guard's discovery step reads the final, repointed
  sheets and the final token declarations).
- **Notes**: Do not create a sibling test file — FR-003 is a comparison against
  `--sk-border-control` on the same surface/theme, so a sibling file would have to duplicate
  `SURFACE_TOKENS`, the theme-selector constants, and the resolver — exactly the kind of
  drift-between-two-copies this repository's gates repeatedly warn against.

### Subtask T010 – Demonstrate Red #1: the unmodified tree at the branch point

- **Purpose**: Prove the grown guard catches the defect as it ships today, with no edit to the test
  itself (US2 scenario 3, SC-004).
- **Steps**:
  1. In this checkout only — no `git worktree`, no second checkout (sibling mission checkouts share
     this machine and numbered checkouts have leaked `node_modules`/ports into each other before):
     ```bash
     git checkout 93c82f14 -- \
       packages/tokens/src/tokens.css \
       packages/styles/src/form-field/sk-form-field.css \
       packages/styles/src/form-input/sk-form-input.css \
       packages/styles/src/form-select/sk-form-select.css \
       packages/styles/src/form-textarea/sk-form-textarea.css
     ```
  2. Run `npx vitest run --project node --reporter=default tests/node/form-input-border-control-contrast.test.ts 2>&1 | tee evidence/guard-red-base.txt`.
  3. Expect: discovery resolves `--sk-color-red` (the only token these files reference at that SHA);
     the light lookup misses the light block and falls back to `:root`'s `#E97373`; ten boundary
     assertions fail (five absolute at 2.69/2.93/2.60/2.26/2.37 and five relational against
     3.98/4.34/3.85/3.51/3.35) plus five error-copy assertions fail at 2.69/2.93/2.60/2.37/2.26
     against the 4.5 floor. Dark stays green.
  4. Restore: `git checkout HEAD -- packages/tokens/src/tokens.css packages/styles/src/form-field/sk-form-field.css packages/styles/src/form-input/sk-form-input.css packages/styles/src/form-select/sk-form-select.css packages/styles/src/form-textarea/sk-form-textarea.css`.
- **Files**: `evidence/guard-red-base.txt` (new, transcript).
- **Parallel?**: No — after T009.
- **Notes**: Use `--reporter=default`, not the bare scoped command spec.md's SC-001 names — the bare
  form exits 1 even when every assertion passes (`floor-reporter.mjs` arms 1 and 5), which would make
  this red-first transcript unreadable as evidence.

### Subtask T011 – Demonstrate Red #2: deliberate reintroduction

- **Purpose**: Prove the guard tracks the *value*, not merely the token's presence or absence (US2
  scenario 1) — Red #1 proves the guard catches the shipping tree; this proves it would catch a
  regression of the fix itself.
- **Steps**:
  1. Temporarily set the light-block `--sk-border-control-invalid` declaration to `#E97373` (the
     dark value — reintroducing the inversion).
  2. Run the same command as T010 into `evidence/guard-red-reintroduced.txt`.
  3. Confirm the same ten boundary assertions fail (the error-copy assertions may or may not fail
     depending on whether `--sk-fg-error` was also reverted — only the boundary token is being
     reintroduced here, so confirm the failures are exactly the boundary ones).
  4. Revert the temporary edit.
- **Files**: `evidence/guard-red-reintroduced.txt` (new, transcript).
- **Parallel?**: No — after T010.
- **Notes**: Neither Red #1 nor Red #2 substitutes for the other — record both.

### Subtask T012 – Demonstrate Green

- **Purpose**: Confirm the finished fix passes every assertion, and that the authoritative full suite
  agrees.
- **Steps**:
  1. `npx vitest run --project node --reporter=default tests/node/form-input-border-control-contrast.test.ts 2>&1 | tee evidence/guard-green.txt`.
  2. `npm run test` (the authoritative full suite — confirms this file alongside everything else).
- **Files**: `evidence/guard-green.txt` (new, transcript).
- **Parallel?**: No — after T011.
- **Notes**: All three transcripts (`guard-red-base.txt`, `guard-red-reintroduced.txt`,
  `guard-green.txt`) go in the PR body (T019, SC-004).

### Subtask T013 – Four new light+invalid/error Storybook stories

- **Purpose**: Build the evidence surfaces the visual and axe gates need — and close the gap where
  `form-textarea` has zero visual coverage of any kind today.
- **Steps**:
  1. `packages/styles/src/form-field/sk-form-field-html.stories.ts`: add a `LightModeError` export
     wrapping `SkFormInputErrorHTML` + `SkFormTextareaErrorHTML` in `class="sk-light"`.
  2. `packages/styles/src/form-select/sk-form-select-html.stories.ts`: add a `LightModeInvalid`
     export, e.g. `storyFrame(SkFormSelectRequiredInvalidHTML, true)` matching the file's existing
     `storyFrame` helper usage.
  3. `packages/elements/src/form-input/sk-form-input.stories.ts`: add a `LightModeError` export —
     `.sk-light` wrapper + `<sk-form-input required>` in its error state.
  4. `packages/elements/src/form-textarea/sk-form-textarea.stories.ts`: add a `LightModeError`
     export, same shape — this component's first story of this kind.
- **Files**: the four `*.stories.ts` files listed in `owned_files`.
- **Parallel?**: No — after T003-T006 (a story added before the repoint would bake the old defect
  into a baseline harvested later).
- **Notes**: Use `class="sk-light"`, never `data-theme="light"` — the latter activates nothing
  (#93/#77) and `check-story-theme-wrapper.mjs` enforces the correct form. Reuse existing published
  markup exports so `node scripts/build-element-markup.mjs --check` stays green — do not invent a new
  generated markup variant.

### Subtask T014 – Four new clipped visual-regression tests

- **Purpose**: Wire the four new stories into `visual.spec.ts` at a ratio tight enough to actually
  detect a border-color regression.
- **Steps**:
  1. Add four new tests to `apps/storybook/src/tests/visual.spec.ts`, each clipped to the component
     locator, at `threshold: 0.02, maxDiffPixelRatio: 0.005` — matching the existing block's own
     justification (`visual.spec.ts:963-969`): at the file's usual looser `0.02` ratio, a total loss
     of the control's border color once stayed within a 2% diff ratio.
  2. New tests and their expected snapshot names:
     - `SK-input light error` → story `form-formfield-html--light-mode-error` →
       `sk-input-light-error.png`
     - `SK-form-input light error` → story `elements-skforminput--light-mode-error` →
       `sk-form-input-light-error.png`
     - `SK-form-select light invalid` → story `form-skformselect-html--light-mode-invalid` →
       `sk-form-select-light-invalid.png`
     - `SK-form-textarea light error` → story `elements-skformtextarea--light-mode-error` →
       `sk-form-textarea-light-error.png`
  3. Run `PW_INCLUDE_VISUAL=1 flock /tmp/sk-design-pw-6006.lock npx playwright test --project=chromium apps/storybook/src/tests/visual.spec.ts` and confirm all four new tests fail for lack of a
     baseline — this is expected, not a defect. **Do not** run `--update-snapshots` locally.
- **Files**: `apps/storybook/src/tests/visual.spec.ts`.
- **Parallel?**: No — after T013 (needs the stories to exist).
- **Notes**: `form-textarea`'s new baseline is that component's first visual coverage of any kind.

### Subtask T015 – Axe re-run over the full story set

- **Purpose**: Confirm the token repoint (specifically the error-copy fix) introduces zero new
  accessibility violations, including on the four new stories.
- **Steps**: `npx nx run storybook:storybook:build --skip-nx-cache`, then
  `node scripts/run-axe-storybook.js`. Confirm zero WCAG 2.1 AA violations across every story.
- **Files**: none changed by this subtask — verification only.
- **Parallel?**: No — after T013 (needs the new stories built into Storybook).
- **Notes**: `run-axe-storybook.js` enumerates every story in `storybook-static/index.json` with no
  skip mechanism (the script's own comment records that #69 deleted the one that used to exist) — a
  story that fails to load counts as a failure under this repository's convention, not an absence of
  violations. If this reds on the error copy, T003/T004/T006 were not applied correctly — do not
  attempt to suppress the copy or exclude the story instead.

### Subtask T016 – Changelog entry

- **Purpose**: Record the visible change for consumers, matching the convention #321's own entry
  established.
- **Steps**: Add a `[Unreleased]` → `### Changed` entry to `docs/design-system/changelog.md` naming
  both new tokens, both theme values (`#E97373` dark / `#6B2424` light for each), all twenty measured
  ratios from `plan.md` §2.6, and the guard that now enforces them.
- **Files**: `docs/design-system/changelog.md`.
- **Parallel?**: [P] with T013-T015 (no code dependency, but wait until T001/T009 settle the exact
  final numbers before describing them).

### Subtask T017 – Full local quality gate run

- **Purpose**: Close out the WP with every relevant gate green before pushing.
- **Steps**: Run, in order, until all are green:
  1. `npm run quality:all` (ESLint + Stylelint + HTMLHint).
  2. `node scripts/check-element-css-hygiene.mjs`.
  3. `node scripts/check-adopted-css-boundaries.mjs`.
  4. `node scripts/check-story-theme-wrapper.mjs`.
  5. `node scripts/check-pattern-composition.mjs`.
  6. `npm run test` (the authoritative full suite — re-confirms T009-T012's guard alongside
     everything else).
  7. `flock /tmp/sk-design-pw-6006.lock npx playwright test --project=chromium apps/storybook/src/tests/sk-form-select.spec.ts` (re-asserted per `plan.md` §7 — this spec runs
     `check-component-token-literals.mjs` over the repointed sheet).
  8. `PW_INCLUDE_VISUAL=1 flock /tmp/sk-design-pw-6006.lock npx playwright test --project=chromium apps/storybook/src/tests/visual.spec.ts` — the four new tests are expected to fail here for lack
     of a baseline; every pre-existing test (including `sk-transition-matrix-light.png`, which must
     pass byte-identical, and every other dark-theme baseline for the four touched components) must
     stay green. Do not chase the four new failures locally — harvest them in T018.
  9. `git status --porcelain` — must be empty after all regeneration steps above.
- **Files**: none changed by this subtask — verification only.
- **Parallel?**: No — after T002, T007, T008, T012, T014, T015, T016.
- **Notes**: Never kill a process this mission did not start if port 6006 is occupied — it likely
  belongs to a sibling mission checkout on this machine.

### Subtask T018 – Push, harvest CI-authoritative baselines

- **Purpose**: Obtain the four new PNGs the correct way — never via a local `--update-snapshots`.
- **Steps**:
  1. Push the branch; open or update the PR.
  2. Wait for CI's visual-regression job to complete.
  3. Harvest the four new baseline PNGs from that run's `visual-regression-diffs` artifact.
  4. Commit the four new PNGs under `apps/storybook/src/tests/visual.spec.ts-snapshots/`.
- **Files**: the four new `.png` files listed in `owned_files`.
- **Parallel?**: No — after T017.
- **Notes**: This costs one extra CI round trip by design — that is expected, not a failure of the
  local gate run.

### Subtask T019 – PR-body coordination record

- **Purpose**: Give the reviewer and the operator everything spec.md's US4/US5 and FR-007/FR-011/
  FR-013 require, in one place.
- **Steps**:
  1. Draft the PR description with the six-consumer blast-radius disposition table (`plan.md` §7):
     `form-field`, `form-input`, `form-select`, `form-textarea` each "changed + re-baselined from CI"
     (naming the harvested PNG and the CI run URL); `ribbon-card`, `transition-matrix` each
     "unchanged, proven by" an empty `git diff <base>..HEAD -- <path>` and an unchanged
     `git grep -c -- '--sk-color-red'` count/file-set for that path — also confirm
     `sk-transition-matrix-light.png` passed byte-identical, the strongest single piece of evidence
     that Option B's blast radius is contained.
  2. Include all three guard transcripts (T010-T012's `evidence/guard-*.txt` files) inline or
     attached.
  3. State plainly, per C-006/FR-010, that no new token category was introduced (`border` and `fg`
     both pre-existed) and the doc-update obligation was therefore not triggered.
  4. Request an explicit, recorded human maintainer approval of the token-namespace change, distinct
     from and in addition to the mission's own adversarial-squad evidence (C-002, FR-011) — narrow
     the ask by stating plainly that both hexes already ship in `tokens.css` today; this mission adds
     two names, zero new colours.
  5. State `Refs #350` (never `Closes #350` — FR-013) — a train-targeting merge fires no GitHub
     closing keyword, and closure stays a separate, explicit operator act.
  6. Report the operator `[NEEDS DECISION]` from `plan.md` §11 verbatim as an FYI: `ribbon-card`'s
     unguarded `--red` ribbon pair (6.24:1, rendered by no story) and `transition-matrix`'s
     blocked-row graphic (2.93:1 light, below WCAG 1.4.11's 3:1, invisible to axe) both remain
     unguarded and out of this mission's scope; recommend one follow-up issue covering both; state
     explicitly that nothing in this mission depends on the operator's answer.
  7. Run `git diff --stat <base>..HEAD` and confirm the file set matches `owned_files` exactly — no
     accidental touch to `status-indicator`, `ribbon-card`, `transition-matrix`, or either
     documentation swatch.
- **Files**: none — PR description only (not a repository file).
- **Parallel?**: No — after T018 (needs the harvested baselines and CI run URL to cite).

## Test Strategy

- Anti-inversion guard: `tests/node/form-input-border-control-contrast.test.ts` (T009), Vitest node
  lane, discovers both new tokens from the CSS, resolves through the cascade, asserts absolute +
  relational + dark-non-regression + error-copy floors across five surfaces × two themes —
  demonstrated red twice (T010, T011) before green (T012).
- Visual: four new tests in `apps/storybook/src/tests/visual.spec.ts` (T014), clipped at
  `maxDiffPixelRatio: 0.005`, baselines harvested from CI (T018) — never local `--update-snapshots`.
- Accessibility: `scripts/run-axe-storybook.js` (T015) — zero WCAG 2.1 AA violations, including on
  the four new stories.
- Full command list: `plan.md` §8.2; do not substitute the bare `npx vitest run
  tests/node/form-input-border-control-contrast.test.ts` command spec.md's SC-001 names — it exits 1
  even when every assertion passes (`floor-reporter.mjs` arms 1 and 5). Always add
  `--project node --reporter=default`.

## Risks & Mitigations

- **Repointing a sheet before regenerating the catalogue** — reds `stylelint` with a message that
  looks like a naming mistake; mitigated by T001→T002→T003-T006 ordering (plan.md §8.1).
- **`measure-elements-sizes.mjs --check` redding because `dist/` is stale or absent** — always
  `npx nx run elements:build --skip-nx-cache` immediately before measuring (T008); if committed
  figures and CI disagree, trust CI and re-measure after a clean `npm ci` (plan.md R-4).
- **A scoped `vitest` run exiting 1 for floor-reporter reasons, mistaken for a real failure (or a
  red-first transcript mistaken for the guard genuinely broken)** — every guard invocation
  (T009-T012) uses `--project node --reporter=default`; the authoritative green is `npm run test`.
- **The four new light+invalid stories redding the axe gate on the error copy** — resolved
  structurally by repointing the error-copy declarations in the same change (T003, T004, T006), not
  by suppressing the copy or excluding the story; verify with T015 before opening the PR.
- **A local `--update-snapshots` run standing in for CI-harvested baselines** — explicitly forbidden;
  T014 expects local failure on the four new tests, T018 is the only legitimate source of the PNGs.
- **Port 6006 collision with a sibling mission's Storybook** — every Playwright invocation (T015,
  T017) wrapped in `flock /tmp/sk-design-pw-6006.lock`; verify the server reflects this checkout's
  build; never kill a process this mission did not start.
- **Treating the mission's own adversarial-squad verdict as satisfying C-002's human sign-off** — it
  cannot; T019 makes the request explicit and distinct, narrowed to "two names, zero new values."
- **Scope creep into `status-indicator`, `ribbon-card`, `transition-matrix`, either documentation
  swatch, or `--sk-color-red`/`--sk-color-red-soft` themselves** — all explicitly out of scope (C-005,
  plan.md §7); T019's `git diff --stat` check exists specifically to catch an accidental touch before
  the PR is opened.
- **An OOM-killed command with no output, mistaken for a hang** — this box runs one heavy Node
  process at a time; report a silent death rather than retrying it in a loop.
- **Losing uncommitted work to an OOM kill** — commit in coherent steps as each subtask group
  finishes (e.g., after T002, after T006/T008, after T012, after T016), not only at the very end.

## Review Guidance

- Verify `--sk-border-control-invalid` and `--sk-fg-error` are declared as plain hex literals in
  **both** theme blocks — reject the diff if either is a `var()` reference to `--sk-color-red` or
  `--sk-on-tint-rose`.
- Verify both tokens' derivation comment states plainly that the hex values already existed and are
  already ratified (no new colour introduced).
- Verify the guard's discovery step is genuinely non-empty and would fail loudly (not silently pass)
  if a selector were renamed out from under it.
- Verify the guard's dark non-regression floor uses pinned constants, not a computed comparison.
- Verify all three guard transcripts (red base, red reintroduced, green) are present and genuinely
  distinct — ask for the actual transcripts, not a paraphrase.
- Verify `sk-transition-matrix-light.png` and every other pre-existing baseline for the four touched
  components pass byte-identical (no unintended re-baseline).
- Verify `status-indicator`, `ribbon-card`, `transition-matrix`, and both documentation swatches show
  zero diff.
- Verify `packages/tokens/dist/token-catalogue.json`, all four `.css.js`/`.css.d.ts` mirrors, and
  `SIZES.md` are regenerated outputs, not hand-edited (spot-check for a plausible generator
  fingerprint, e.g. a `generated_at` timestamp change).
- Verify the PR body's six-consumer disposition table is complete and each "unchanged" claim cites a
  real, checkable `git diff`/`git grep` result.
- Verify the PR body's human sign-off request is present, explicit, and distinct from any
  adversarial-squad evidence.
- Verify `Refs #350` appears and `Closes #350` does not.
- Verify the operator `[NEEDS DECISION]` follow-up recommendation is reported, not silently resolved
  or silently dropped.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-11T00:00:00Z – system – Prompt created.
