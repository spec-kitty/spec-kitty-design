# Tasks: Invalid-state control boundary contrast, light theme

**Input**: `plan.md` (`d731e933`), `spec.md` (`cacefc3d`)
**Feature dir**: `/home/jeroennouws/dev/spec-kitty-design-missions/350/kitty-specs/invalid-boundary-light-contrast-01M26WMT`

## Work Package count: ONE, deliberately

Issue #350 and spec.md's C-001/FR-013/SC-009 all state: one bounded Work Package, one PR into
`train/elements-first`, `Refs #350` (never `Closes #350`). `plan.md` §12 independently confirms the
scope does not split: every plausible seam (tokens vs. sheets, sheets vs. generated, guard vs. fix)
produces an intermediate commit that reds an ENFORCED gate (`stylelint`'s catalogue-sourced
allowlist, `check-element-css-hygiene.mjs`, or `build-elements-css.mjs --check`), the four new
visual baselines can only be harvested once from a single CI run of the complete change, and the
total diff (4 token declarations, 8 repointed `var()` references across 4 sheets, 1 grown test
file, 4 new stories, 4 new visual tests, 1 changelog entry, 5 regenerated artifacts) is small. This
tasks.md carries that decision forward verbatim; it is not re-litigated here.

## The settled decision this Work Package implements

**Option B, two-token split** (plan.md §2, resolving spec.md's FR-006/Fork 1) — **forced**, not
preferred: `plan.md` §2.1 proves Option A is arithmetically impossible, not merely expensive.
`--sk-fg-on-primary` (`#1A1408`, no light override) paired against `--sk-ribbon-card__ribbon--red`'s
fill caps at **4.22:1** for any hex satisfying the light-theme relational floor (FR-003) — below
AA's 4.5:1 for the 12px-bold ribbon label — and no story renders that pair today, so the failure
would ship invisibly. Two new tokens, `--sk-border-control-invalid` (non-text, WCAG 1.4.11 ≥3:1,
plan.md §2.3) and `--sk-fg-error` (text, WCAG 1.4.3 ≥4.5:1), both resolve to hex values that
**already exist and are already ratified** in `tokens.css` today: `#E97373` (dark — byte-identical
to `--sk-color-red`'s current rendering) and `#6B2424` (light — the value `--sk-on-tint-rose`
already carries, ratified under #177/#217). This mission adds token **names**, not new colours.

**Five surfaces, not four** (plan.md §3, resolving spec.md's FR-008/Fork 2): `page`, `card`, `input`,
`muted`, `pill`. A four-surface invalid set beside the existing five-surface `--sk-border-control`
resting set in the same test file would leave `--sk-surface-pill` guarded for resting and unguarded
for invalid on the very same CSS rule — the exact shape of this bug, reintroduced inside its own fix.

**The error-copy repoint is forced, not scope creep** (plan.md §2.4): NFR-004/FR-007 require a
light+invalid visual baseline for every consumer whose rendering changes, and NFR-006/SC-008 require
zero axe violations on every story added, with no skip mechanism in `run-axe-storybook.js`. A
light+invalid story for `form-field`/`form-input`/`form-textarea` necessarily renders the error copy,
which measures 2.60–2.93:1 at `#E97373` — a hard `color-contrast` failure. There is no way to author
the required evidence without fixing the copy in the same change, so the three error-copy
declarations (`sk-form-field.css`, `sk-form-input.css`, `sk-form-textarea.css`) are repointed to
`--sk-fg-error` alongside the five boundary declarations. `--sk-color-red` itself is never touched;
`status-indicator` (C-005), `ribbon-card`, `transition-matrix`, and the two Storybook documentation
swatches are all unchanged (plan.md §7).

## Repository corrections carried into every subtask below

- **Ordering**: tokens (T001) → catalogue (T002) → sheets (T003-T006) → generated artifacts
  (T007-T008). `stylelint.config.mjs` builds its strict-value allowlist from the **committed**
  catalogue; repointing a sheet before regenerating it reds `stylelint` with a message that looks
  like a naming mistake. `check-element-css-hygiene.mjs` reads `tokens.css` directly (not the
  catalogue) and refuses any `var()` to an undeclared custom property, so T001 must land first
  regardless.
- **Build before measuring sizes**: `scripts/measure-elements-sizes.mjs` reads `dist/` and does not
  build it. `npx nx run elements:build --skip-nx-cache` must run immediately before it (T008). The
  new token name is 13 bytes longer than `--sk-color-red` per occurrence, so `SIZES.md` moves.
- **Scoped vitest command**: `npx vitest run tests/node/form-input-border-control-contrast.test.ts`
  (the literal command spec.md's SC-001 names) exits **1** even when every assertion passes —
  `scripts/floor-reporter.mjs` arm 1 flags the unselected `browser` lane and arm 5 flags all
  seventeen `behaviours.json` entries. Use `npx vitest run --project node --reporter=default
  tests/node/form-input-border-control-contrast.test.ts`, which exits 0. Every subtask below that
  runs this file uses that form; the repository's own behaviour wins over the spec's literal text
  (plan.md §5.3, §8.2 step 5).
- **Commit scopes** (`commitlint.config.cjs` scope-enum, verified, not assumed): `tokens`, `styles`,
  `elements`, `storybook`, `docs`, `ci`, `doctrine`, `release`, `deps`, `security`, `acceptance`,
  `merge`, `team-overview`, `react`. Token declarations + catalogue → `feat(tokens): …`; sheet
  repoints → `fix(styles): …`; generated `.css.js`/SIZES.md → `chore(elements): …`; stories +
  `visual.spec.ts` → `test(storybook): …`; the guard → `test(tokens): …`; changelog → unscoped
  `docs: …` (`docs(spec)`/`docs(specs)` remain invalid; `chore(spec):` is an exact anchored ignore
  pattern, not a scope to reuse elsewhere).
- **Environment**: `flock /tmp/sk-design-pw-6006.lock` around every Playwright invocation; verify the
  server is this checkout's build before trusting a result; never kill a process this mission did
  not start. `--skip-nx-cache` on nx gate targets. One heavy Node process at a time — a command that
  dies with no output is the OOM killer; report it, do not retry in a loop. Commit in coherent steps
  as work proceeds; never end a turn waiting on a background process.
- **Visual baselines are CI-authoritative.** The four new light+invalid tests (T014) will fail
  locally on first run because no baseline exists — that is expected, not a defect to fix with
  `--update-snapshots`. Harvest the PNGs from the CI run's `visual-regression-diffs` artifact (T018).

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Declare `--sk-border-control-invalid` and `--sk-fg-error` in `packages/tokens/src/tokens.css`, both `:root` (`#E97373` each) and the light block (`#6B2424` each), as independent hex literals with a derivation comment recording the arithmetic-impossibility rationale for Option B (plan.md §2.1) and that both hexes already ship today | WP01 | |
| T002 | Regenerate `packages/tokens/dist/token-catalogue.json` via `npx nx run tokens:catalogue --skip-nx-cache`; confirm via `bash scripts/check-token-breaking-changes.sh` that both new tokens report as non-breaking additions, zero removals | WP01 | after T001 |
| T003 | Repoint `packages/styles/src/form-field/sk-form-field.css`: `.sk-form-field--error .sk-form-field__description` (L27, text) → `--sk-fg-error`; `.sk-input[aria-invalid="true"]` (L82, border) → `--sk-border-control-invalid`; `.sk-textarea[aria-invalid="true"]` (L123, border) → `--sk-border-control-invalid` | WP01 | [P] with T004-T006 |
| T004 | Repoint `packages/styles/src/form-input/sk-form-input.css`: `.sk-form-input__control[aria-invalid="true"]` (L113, border) → `--sk-border-control-invalid`; `.sk-form-input__error` (L140, text) → `--sk-fg-error` | WP01 | [P] with T003, T005, T006 |
| T005 | Repoint `packages/styles/src/form-select/sk-form-select.css`: `.sk-form-select:invalid` (L32, border) → `--sk-border-control-invalid`; leave `border-style: double` and `border-width` untouched | WP01 | [P] with T003, T004, T006 |
| T006 | Repoint `packages/styles/src/form-textarea/sk-form-textarea.css`: `.sk-form-textarea__control[aria-invalid="true"]` (L107, border) → `--sk-border-control-invalid`; `.sk-form-textarea__error` (L134, text) → `--sk-fg-error` | WP01 | [P] with T003-T005 |
| T007 | Regenerate `packages/elements/src/form-input/sk-form-input.css.js`/`.css.d.ts` and `.../form-textarea/sk-form-textarea.css.js`/`.css.d.ts` via `node scripts/build-elements-css.mjs`, then confirm currency with `--check` | WP01 | after T004, T006 |
| T008 | `npx nx run elements:build --skip-nx-cache`, then regenerate `packages/elements/SIZES.md` via `node scripts/measure-elements-sizes.mjs` and confirm with `node scripts/measure-elements-sizes.mjs --check` | WP01 | after T007 |
| T009 | Grow `tests/node/form-input-border-control-contrast.test.ts`: refactor the existing hex reader into a cascade-correct `resolveToken(source, selector, token)` helper (theme block first, falls back to `:root`, follows at most one `var()` hop); add discovery of the invalid-boundary rule across the four sheets and the error-copy rule across three files (non-empty + single-token assertions); add the absolute (≥3.0), relational (≥ `--sk-border-control` on the same surface/theme), dark-non-regression (pinned per-surface floor), and error-copy (≥4.5) assertions across all five surfaces in both themes | WP01 | after T001-T008 |
| T010 | Demonstrate Red #1 (US2 scenario 3, SC-004): `git checkout 93c82f14 -- packages/tokens/src/tokens.css` + the four component sheets, in this checkout only (no worktree, no second checkout); run the guard with `--project node --reporter=default`; capture the failing transcript to `evidence/guard-red-base.txt`; restore all five files to HEAD | WP01 | after T009 |
| T011 | Demonstrate Red #2 (US2 scenario 1): temporarily set the light-block `--sk-border-control-invalid` to `#E97373`; re-run the guard the same way into `evidence/guard-red-reintroduced.txt`; confirm the same ten boundary assertions fail; revert | WP01 | after T010 |
| T012 | Demonstrate Green: run the guard's scoped command into `evidence/guard-green.txt`, then run the authoritative `npm run test` full suite | WP01 | after T011 |
| T013 | Author four new light+invalid/error Storybook stories, each wrapped in `class="sk-light"` (never `data-theme="light"`): `form-field`'s `LightModeError` (wraps `SkFormInputErrorHTML` + `SkFormTextareaErrorHTML`), `form-select`'s `LightModeInvalid`, `sk-form-input`'s `LightModeError`, `sk-form-textarea`'s `LightModeError` | WP01 | after T003-T006 |
| T014 | Add four new tests to `apps/storybook/src/tests/visual.spec.ts`, each clipped to the component locator at `threshold: 0.02, maxDiffPixelRatio: 0.005` (matching the existing block's own justification at `visual.spec.ts:963-969`); confirm they fail locally for lack of a baseline — expected, not a defect; never run `--update-snapshots` | WP01 | after T013 |
| T015 | `npx nx run storybook:storybook:build --skip-nx-cache`, then `node scripts/run-axe-storybook.js`; confirm zero WCAG 2.1 AA violations across every story, including the four new ones | WP01 | after T013 |
| T016 | Add one `[Unreleased]` → `### Changed` entry to `docs/design-system/changelog.md`, modelled on #321's entry, naming both new tokens, both theme values, all twenty measured ratios, and the guard | WP01 | [P] with T013-T015 (needs T001/T009's final numbers) |
| T017 | Full local quality gate: `npm run quality:all`; `node scripts/check-element-css-hygiene.mjs`; `node scripts/check-adopted-css-boundaries.mjs`; `node scripts/check-story-theme-wrapper.mjs`; `node scripts/check-pattern-composition.mjs`; `npm run test` (authoritative full suite); `flock /tmp/sk-design-pw-6006.lock npx playwright test --project=chromium apps/storybook/src/tests/sk-form-select.spec.ts`; `PW_INCLUDE_VISUAL=1 flock /tmp/sk-design-pw-6006.lock npx playwright test --project=chromium apps/storybook/src/tests/visual.spec.ts` (the four new tests are expected to fail here for lack of a baseline — push and harvest per T018, do not chase locally); `git status --porcelain` empty after all regeneration | WP01 | after T002, T007, T008, T012, T014, T015, T016 |
| T018 | Push the branch, open/update the PR, wait for CI's visual-regression job, harvest the four new baseline PNGs from that run's `visual-regression-diffs` artifact (never a local `--update-snapshots`), commit them | WP01 | after T017 |
| T019 | Draft the PR-body coordination record: the six-consumer blast-radius disposition table (plan.md §7 — "changed + re-baselined from CI" vs. "unchanged, proven by unchanged `git grep -c -- '--sk-color-red'` count/file-set", per consumer); an explicit human-sign-off request narrowed to "two token names, zero new colour values" (C-002/FR-011); `Refs #350` (never `Closes #350`, FR-013); confirmation that C-006/FR-010's new-category doc obligation was not triggered (both `border` and `fg` are pre-existing catalogue categories); and the operator `[NEEDS DECISION]` follow-up-issue recommendation below, stated as an FYI this mission does not depend on | WP01 | after T018 |

## Work Package WP01 — Two-token split, four consumer repoints, and the anti-inversion guard

**Priority**: P1 (this mission's entire scope)
**Independent test**: Resolve the color the `[aria-invalid="true"]`/`:invalid` control rule renders
in each theme via the grown guard; confirm ≥3:1 against all five light surfaces and ≥ the
corresponding `--sk-border-control` ratio on every surface/theme; confirm dark theme has not
regressed below its pre-fix measured floor; confirm the error-copy token clears ≥4.5:1 on all five
surfaces in both themes; confirm the guard is demonstrated red twice (unmodified tree, deliberate
reintroduction) before green; confirm `npx nx run tokens:catalogue --skip-nx-cache` produces zero
diff after being re-run; confirm zero new axe WCAG 2.1 AA violations on every touched/added story;
confirm the PR names all six real `--sk-color-red` consumers with an explicit changed/unchanged
disposition; confirm `git status --porcelain` is empty.
**Estimated size**: 19 subtasks — small and tightly bounded (four token declarations, eight
repointed `var()` references across four sheets, one grown test file, four new stories, four new
visual tests, one changelog entry, five regenerated artifacts), matching plan.md §12's own sizing
argument for why this does not split into more than one WP.

### Included subtasks

T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012, T013, T014, T015, T016,
T017, T018, T019

### Implementation sketch

1. T001-T002 land the token layer first — everything else references it, and the catalogue must be
   current before any sheet is repointed (stylelint's allowlist source).
2. T003-T006 repoint the four component sheets in parallel (independent files, all consuming T001's
   tokens).
3. T007-T008 regenerate the generated artifacts T004/T006 invalidate — the element CSS mirrors, then
   (after a full elements build) `SIZES.md`.
4. T009 grows the guard against the now-final sheets and tokens — its discovery step must read the
   real, repointed selectors to build its resolver correctly, even though the resolver itself is
   written to be option-agnostic (it would have discovered `--sk-color-red` just as correctly at
   `93c82f14`).
5. T010-T012 produce the guard's three transcripts, in strict order: red against the unmodified base
   (proves the guard catches the shipping defect), red against a deliberate reintroduction (proves it
   tracks the value, not just presence), then green (the shipped fix). Neither red substitutes for
   the other.
6. T013-T015 build the visual/axe evidence — stories only after the repoint (T003-T006) so they never
   bake the old defect into a harvested baseline; axe after the stories so the error-copy fix (part
   of T003/T004/T006) is what keeps the gate green.
7. T016 (changelog) can be written any time after T001/T009 settle the exact values and ratios it
   describes.
8. T017 is the full local close-out gate — everything else except T018-T019 must be finished first.
9. T018 is the one step that leaves this checkout — push, then harvest the CI-authoritative
   baselines; this costs one extra round trip by design (plan.md §6).
10. T019 is written last, once the final diff and the harvested baselines exist to describe.

### Dependencies

None — this is the only Work Package (single_branch topology; `planning_base_branch` and
`merge_target_branch` are both `mission/invalid-boundary-light-contrast`).

### Risks

- **Repointing a sheet before regenerating the catalogue (T002)** reds `stylelint` with a message
  that looks like a naming mistake rather than an ordering one — mitigated by T001→T002→T003-T006
  ordering.
- **Measuring sizes against a stale or absent `dist/`** — `measure-elements-sizes.mjs` reads `dist/`
  and never builds it; T008 always runs `npx nx run elements:build --skip-nx-cache` immediately
  before measuring.
- **A scoped `vitest` run exiting 1 for floor-reporter reasons**, mistaken for a real failure (or a
  red-first transcript mistaken for the guard genuinely failing) — every guard invocation in
  T009-T012 uses `--project node --reporter=default`; the authoritative green is `npm run test`.
- **The four new light+invalid stories redding the axe gate on the error copy** — resolved
  structurally by repointing the error-copy declarations in the same change (T003, T004, T006), not
  by suppressing the copy or excluding the story; verified in T015 before the PR is opened.
- **A local `--update-snapshots` run standing in for CI-harvested baselines** — explicitly forbidden;
  T014 expects local failure, T018 is the only source of the four new PNGs.
- **Port 6006 collision with a sibling mission's Storybook** — every Playwright invocation in T015,
  T017 is wrapped in `flock /tmp/sk-design-pw-6006.lock`; never kill a process this mission did not
  start.
- **Scope creep into `status-indicator`, `ribbon-card`, `transition-matrix`, or either Storybook
  documentation swatch** — all four are explicitly unchanged (C-005, plan.md §7); T019's blast-radius
  table exists specifically so an accidental touch is caught before the PR is opened.
- **Treating the mission's own adversarial-squad verdict as satisfying C-002's human sign-off** — it
  does not and cannot; T019 makes the sign-off request explicit and distinct.

**Requirement coverage**: FR-001 through FR-013, NFR-001 through NFR-006, C-001 through C-008 — the
full spec, since this is the mission's only Work Package. Per-subtask mapping is recorded in each
subtask's frontmatter-adjacent detail in `tasks/WP01-invalid-boundary-two-token-split.md`.

## Remaining `[NEEDS DECISION]` — for the operator, not for this Work Package to settle

`plan.md` §11 records one genuine fork this mission deliberately does not resolve, and this Work
Package does not depend on its answer:

> `--sk-color-red`'s remaining consumers still carry unguarded contrast obligations this mission
> deliberately does not touch: `ribbon-card`'s `--red` ribbon (fill + `--sk-fg-on-primary` pair,
> 6.24:1 today, but rendered by **no Storybook story**, so nothing would notice if it moved) and
> `transition-matrix`'s blocked-row graphic (light 2.93:1 against the white card — below WCAG
> 1.4.11's 3:1 for a graphical object, though axe does not check non-text contrast and the existing
> baseline is green). Both are real, both are out of #350's scope, and both are newly-measured
> findings of the plan phase rather than of the issue. **Recommendation**: file one follow-up issue
> covering (a) a red-variant ribbon-card story so the pair is ever exercised, and (b) the
> transition-matrix blocked-row 1.4.11 gap.

This mission ships regardless of when or whether that follow-up issue is filed; T019 states the
recommendation in the PR body so the operator sees it at the natural decision point, and does not
gate the PR on it.
