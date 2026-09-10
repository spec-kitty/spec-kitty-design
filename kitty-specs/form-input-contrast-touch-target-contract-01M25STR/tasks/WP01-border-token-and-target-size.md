---
work_package_id: WP01
title: New --sk-border-control token (independent literal, not an alias), both consumption paths, and the anti-drift/contrast/rendered proof
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
planning_base_branch: mission/form-input-contrast-touch-target-contract
merge_target_branch: mission/form-input-contrast-touch-target-contract
branch_strategy: Planning artifacts for this mission were generated on mission/form-input-contrast-touch-target-contract. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/form-input-contrast-touch-target-contract unless the human explicitly redirects the landing branch.
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
phase: Phase 1 - The mission's only Work Package
history:
- at: '2026-09-10T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
- at: '2026-09-10T00:00:00Z'
  actor: claude
  action: Amended per coordinator review — --sk-border-control changed from a var(--sk-fg-subtle) alias to an independently declared literal per theme (light value darkened from #8A8A7E to #7A7A6E for margin), FR-012/T012 (executable contrast assertion) added, and .sk-form-select named as a third known remaining weak-hairline instance.
agent_profile: implementer-ivan
authoritative_surface: packages/styles/src/
create_intent:
- tests/node/form-input-border-target-size-parity.test.ts
- tests/node/form-input-border-control-contrast.test.ts
- apps/storybook/src/tests/sk-form-input-contrast-touch-target.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/tokens/src/tokens.css
- packages/tokens/dist/token-catalogue.json
- packages/styles/src/form-field/sk-form-field.css
- packages/styles/src/form-input/sk-form-input.css
- packages/elements/src/form-input/sk-form-input.css.js
- packages/elements/src/form-input/sk-form-input.css.d.ts
- tests/node/form-input-border-target-size-parity.test.ts
- tests/node/form-input-border-control-contrast.test.ts
- apps/storybook/src/tests/sk-form-input-contrast-touch-target.spec.ts
- docs/design-system/changelog.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – New `--sk-border-control` token (independent literal), both consumption paths, and the anti-drift/contrast/rendered proof

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or
any user-defined profile), and behave according to its guidance before parsing the rest of this
prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
this work package's `task_type` and `authoritative_surface`.

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

Ship the one coherent, token-layer fix for `.sk-input` / `<sk-form-input>`'s failing control
boundary and missing target-size floor (GAP-F5-02, issue #321), as ONE Work Package and ONE PR
back onto `train/elements-first`. This is the mission's only Work Package — every functional
requirement in `spec.md` (FR-001 through FR-012) belongs to it.

Success is:

1. `--sk-border-control` exists in **both** theme blocks of `packages/tokens/src/tokens.css`, as
   its own **independently declared literal per theme** (`#81818B` dark, `#7A7A6E` light) — **NOT**
   an alias of `--sk-fg-subtle` or any other token — with its derivation and six measured ratios
   recorded in a comment beside the declaration (FR-001). This is a corrected decision: an earlier
   draft of this spec aliased `--sk-fg-subtle`, and a review rejected that before any code was
   written — read `research.md`'s rewritten decision section before starting T001.
2. `.sk-input` (`sk-form-field.css`) and `.sk-form-input__control` (`sk-form-input.css`) both
   adopt the new role for their resting-state border, and both spell the width the same way
   (`var(--sk-border-width-1)`), closing the #173-documented spelling gap in the same change
   (FR-002, FR-003).
3. Both rules gain `min-block-size: var(--sk-space-9)`, matching the exact comment shape already
   shipped in `sk-confirm-dialog.css`/`sk-context-nav.css` (FR-004).
4. Focus, `[aria-invalid="true"]`, and `:disabled` rules are untouched on both paths (FR-005).
5. A Node-lane test proves the two files' `border`/`min-block-size` values cannot drift apart
   without being caught — demonstrated red (a deliberate divergence) before green (FR-006).
6. A Playwright test proves the rendered control clears 44px at 390px width and under a
   calibrated 200% zoom simulation, on **both** consumption paths (FR-007).
7. A Playwright test proves the border survives `forced-colors: active` and records its actual
   resolved color rather than assuming one (FR-008).
8. `packages/tokens/dist/token-catalogue.json` and `packages/elements/src/form-input/sk-form-input.css.js`/`.css.d.ts`
   are regenerated by their own scripts, never hand-edited (FR-009).
9. The PR body records the coordination outcome for #155 (FR-010) — names all three known
   remaining weak-hairline instances (`.sk-textarea`, `.sk-form-textarea__control`,
   `.sk-form-select`) — and touches zero files under any `*button*` directory.
10. `docs/design-system/changelog.md` gains a `[Unreleased]` → `Changed` entry (FR-011).
11. A SECOND Node-lane test executably asserts all six (theme × surface) contrast ratios for
    `--sk-border-control` ≥3:1, demonstrated red (a deliberate one-step hex nudge) before green —
    so the PR's contrast table is verifiable rather than testimonial (FR-012). Scoped to exactly
    this token and these three surfaces; it is **not** #155's open general 1.4.11 gate, and the PR
    body must say so explicitly.
12. `npm run quality:all`, `node scripts/build-elements-css.mjs --check`, and the full Playwright
    suite pass; `git status --porcelain` is empty after regeneration.

## Context & Constraints

- **Read first, in this order**: `.kittify/charter/charter.md`; `docs/contributing/adding-a-component.md`
  (the recipe, especially its forced-colors section); ADR-9 (`docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md`);
  ADR-10 (`docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md`);
  ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`) — this
  mission does NOT need a new static-form decision, ADR-15 already covers `sk-form-input` (no
  `container-type`); this mission's `spec.md`, `plan.md`, `research.md`.
- **Source issue**: `gh issue view 321 --repo spec-kitty/spec-kitty-design` — read the COMPLETE
  live issue; do not rely solely on this prompt's paraphrase. Also read #155 (the button's own
  hairline defect — DO NOT touch `.sk-button--secondary`), #173 (`.sk-input`/`.sk-textarea` rename
  deferral — DO NOT rename anything), #286 (copy/i18n — this WP adds no copy), #303 (the 44px
  precedent this mission reconciles against), and
  `/home/jeroennouws/dev/spec-kitty-design-missions/_program-319/DECISION-border-role.md` (the
  binding programme decision that fixes the altitude/owner/obligation this WP implements).
- **Pattern precedent for the 44px floor**: `packages/styles/src/confirm-dialog/sk-confirm-dialog.css:165-173`
  and `packages/styles/src/context-nav/sk-context-nav.css` (three call sites) — both already use
  `min-block-size: var(--sk-space-9)` for exactly this floor. Copy the comment shape, do not
  re-derive it.
- **Pattern precedent for the anti-drift test's parsing technique**: `apps/storybook/src/tests/sk-form-select.spec.ts`
  already imports `postcss`/`postcss-selector-parser` (existing devDependencies) the same way.
- **The token MUST be a literal, not `var(--sk-fg-subtle)`.** An earlier draft of this WP's own
  spec aliased `--sk-fg-subtle`; a review rejected that before any code was written, because
  aliasing couples this role's 3:1 obligation to a token that moves for an unrelated (text
  contrast) reason, and `bash scripts/check-token-breaking-changes.sh` computes no contrast so
  nothing would catch a future silent drop. Read `research.md`'s rewritten decision section for
  the full reasoning before starting T001 — do not reach for the alias as a shortcut.
- **Pattern precedent for the 200% zoom simulation**: `apps/storybook/src/tests/sk-collection.spec.ts`'s
  `style.zoom = '2'` technique with its own width-probe calibration — reuse it, do not invent a
  new zoom mechanism.
- **Pattern precedent for the forced-colors test**: `apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts`'s
  `page.emulateMedia({ forcedColors: 'active' })` + shadow-root `getComputedStyle` pattern.
- **Do NOT touch**: any file under `packages/styles/src/button*/` or `packages/elements/src/button*/`
  (#155/#320 boundary, C-004/C-005); `packages/styles/src/form-textarea/sk-form-textarea.css` or
  `packages/elements/src/form-textarea/` (C-003 — the resulting visual divergence from
  `.sk-input`/`.sk-form-input__control` is disclosed and deliberate, not a defect to fix here);
  `packages/styles/src/form-select/sk-form-select.css` (a THIRD sibling weak-hairline instance —
  its `.sk-form-select` rule also uses `border-color: var(--sk-border-default)` — found while
  checking this WP's blast radius; name it in the PR body, do not fix it, per C-003); `.sk-textarea`'s
  rule inside `sk-form-field.css` (same file as `.sk-input`, different rule — edit only `.sk-input`).
- **Do NOT rename** `.sk-input`, `.sk-textarea`, `.sk-form-input__control`, or any other class —
  #173's call, not this WP's.
- **Do NOT wire `apps/storybook/src/tests/visual.spec.ts`** for this component (C-009) — it has
  zero existing entries for this component pair and extending that system is out of this WP's
  bounded scope.
- **Do NOT touch `expected-parts.json`, `expected-docs.json`, `behaviours.json`, or `mutations.json`** —
  this WP adds no new `::part()`, documented attribute/method, or owned behavior. If, while
  implementing, you find yourself wanting to add an entry to any of these four files, STOP — that
  means the work has drifted outside this WP's contract; re-read `spec.md`'s Constraints before
  proceeding.
- **Tokens-first.** No raw hex/`Npx` literal in either changed `.css` file — everything through
  `var(--sk-*)`.
- **Never hand-edit generated files**: `packages/tokens/dist/token-catalogue.json`,
  `packages/elements/src/form-input/sk-form-input.css.js`, `.css.d.ts`. Regenerate them with their
  own scripts (T002, T005).
- **This is a single WP by mandate** (issue #321: "one bounded Work Package and one PR") and the
  scope is genuinely small enough to fit comfortably — see `tasks.md`'s "Work Package count" note.
  If this genuinely cannot be delivered as one PR, STOP and report rather than splitting
  unilaterally.

## Branch Strategy

- **Strategy**: single_branch — this mission has no separate coordination branch. Work and commit
  directly on the mission branch.
- **Planning base branch**: `mission/form-input-contrast-touch-target-contract`
- **Merge target branch**: `mission/form-input-contrast-touch-target-contract` (the PR back to
  `train/elements-first` happens from this branch per issue #321's "Branch: cut ... from the
  latest `train/elements-first`; PR back into the train.")

> These fields are populated automatically by `spec-kitty agent mission tasks`. Do NOT change
> them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T001 – New `--sk-border-control` token, both theme blocks, as an INDEPENDENT LITERAL

- **Purpose**: Land the token-layer fix everything else in this WP references. **This token is a
  literal, not an alias** — see the "MUST be a literal" note in Context & Constraints above before
  starting.
- **Steps**:
  1. In `packages/tokens/src/tokens.css`'s Borders block (`/* ── Borders ─────── */`, alongside
     `--sk-border-default`/`--sk-border-strong`/`--sk-border-focus`), add
     `--sk-border-control: #81818B;` to `:root` — a plain hex literal, no `var()`.
  2. In the light-mode override block (`:root[data-theme="light"], .sk-light`), find where
     `--sk-border-default`/`--sk-border-strong` are redefined and add
     `--sk-border-control: #7A7A6E;` there too — also a plain hex literal.
  3. Add a comment beside the `:root` declaration recording: (a) that this is deliberately a
     literal, not an alias of `--sk-fg-subtle` — one sentence stating the decoupling rationale
     (aliasing would couple a 3:1 non-text obligation to a token that moves for an unrelated text
     reason, and `check-token-breaking-changes.sh` computes no contrast, so nothing would catch a
     future silent regression); and (b) the six measured ratios from `research.md`'s table (dark:
     page 5.01, card 4.51, input 4.28; light: page 3.98, card 4.34, input 3.85), in `ratio : 1`
     per-theme format — this is the exact figure the PR body (T012) must also carry.
- **Files**: `packages/tokens/src/tokens.css`.
- **Parallel?**: No — foundation for T002-T004 and T013.
- **Notes**: Do not add a `var()` reference. Do not touch any other token in the Borders block.

### Subtask T002 – Regenerate the token catalogue

- **Purpose**: Keep `packages/tokens/dist/token-catalogue.json` (the stylelint/docs-site source of
  truth) current with T001's new token.
- **Steps**: Run `npx nx run tokens:catalogue` (or `npm run tokens:catalogue`); confirm the new
  `border` category entry for `border-control` appears in the output.
- **Files**: `packages/tokens/dist/token-catalogue.json` (generated).
- **Parallel?**: No — after T001.
- **Notes**: This file is generated; never hand-edit it.

### Subtask T003 – `.sk-input`'s border and target size

- **Purpose**: Apply the fix to the hand-authored static path.
- **Steps**:
  1. In `packages/styles/src/form-field/sk-form-field.css`, change `.sk-input`'s
     `border: 1px solid var(--sk-border-default);` to
     `border: var(--sk-border-width-1) solid var(--sk-border-control);`.
  2. Add `min-block-size: var(--sk-space-9);` to the same rule, with a one-line comment naming it
     the 44px floor (copy the exact comment shape from `sk-confirm-dialog.css:171`).
  3. Do **not** touch `.sk-textarea` in the same file (different rule, out of scope, C-003).
  4. Verify (by reading, not assuming) that none of the five static exemplar HTML files
     (`sk-form-input-default.html`, `-focus.html`, `-error.html`, `-disabled.html`, `-filled.html`)
     duplicate the old border/height value inline — they should not, per `research.md`'s check,
     but confirm again against the current tree before considering this subtask done.
- **Files**: `packages/styles/src/form-field/sk-form-field.css`.
- **Parallel?**: [P] with T004 (different file).
- **Notes**: The width spelling change (`1px` → `var(--sk-border-width-1)`) is deliberate and
  in-scope (FR-002) — name it explicitly in the PR description as closing #173's documented
  spelling gap, not an unrelated drive-by.

### Subtask T004 – `.sk-form-input__control`'s border and target size

- **Purpose**: Apply the fix to the live element path.
- **Steps**:
  1. In `packages/styles/src/form-input/sk-form-input.css`, change `.sk-form-input__control`'s
     `border: var(--sk-border-width-1) solid var(--sk-border-default);` to
     `border: var(--sk-border-width-1) solid var(--sk-border-control);` (width spelling already
     tokenized — only the color changes here).
  2. Add `min-block-size: var(--sk-space-9);` to the same rule, same comment shape as T003.
  3. Add one line to the file's existing header comment block (lines 1-38) noting that this
     resolution closes the `--sk-border-default` weakness the header already discusses, matching
     the file's own convention of recording what changed and why in that block.
- **Files**: `packages/styles/src/form-input/sk-form-input.css`.
- **Parallel?**: [P] with T003 (different file).
- **Notes**: Do not touch any other rule in this file (focus, `[aria-invalid]`, `:disabled`,
  `::placeholder`, the `:host(:not([invalid]))` error-visibility rule are all out of scope).

### Subtask T005 – Regenerate the element's generated CSS module

- **Purpose**: Propagate T004's source change into the artifact `<sk-form-input>` actually adopts.
- **Steps**: Run `node scripts/build-elements-css.mjs` (no `--check` flag — this invocation WRITES
  the regenerated output). Confirm `packages/elements/src/form-input/sk-form-input.css.js` and
  `.css.d.ts` now reflect T004's new declarations.
- **Files**: `packages/elements/src/form-input/sk-form-input.css.js`, `.css.d.ts` (generated).
- **Parallel?**: No — after T004.
- **Notes**: Forgetting this step is silently NOT caught by stylelint/typecheck — only
  `build-elements-css.mjs --check` (run again in T011) catches the drift.

### Subtask T006 – Anti-drift test (FR-006)

- **Purpose**: Build the mechanical proof that `.sk-input` and `.sk-form-input__control` cannot
  silently drift apart, since no generator links these two files.
- **Steps**:
  1. Create `tests/node/form-input-border-target-size-parity.test.ts` (picked up automatically by
     `vitest.config.mts`'s existing `include: ['tests/node/**/*.test.ts']` — no config change).
  2. Use `postcss` to parse `packages/styles/src/form-field/sk-form-field.css` and
     `packages/styles/src/form-input/sk-form-input.css`; find the `.sk-input` rule and the
     `.sk-form-input__control` rule respectively (via `postcss-selector-parser` if selector
     matching needs to be robust to compound selectors — these two are simple class selectors, so
     a direct rule-selector string match is sufficient; do not over-engineer).
  3. Extract the `border` and `min-block-size` declaration VALUES from each rule.
  4. Assert: (a) the two files' `border` values are equal to each other; (b) the two files'
     `min-block-size` values are equal to each other; (c) each `border` value equals
     `var(--sk-border-width-1) solid var(--sk-border-control)`; (d) each `min-block-size` value
     equals `var(--sk-space-9)`.
  5. **Demonstrate red first**: temporarily edit ONE file's `border` or `min-block-size` value to
     a different (but still valid) token, run the test, confirm it fails and that the failure
     message names which file/selector/property diverged, then revert the temporary edit and
     confirm the test passes again. Record both outputs (red and green) as evidence.
- **Files**: `tests/node/form-input-border-target-size-parity.test.ts` (new).
- **Parallel?**: No — after T003 and T004 (needs their final values).
- **Notes**: Scope the comparison to exactly `border` and `min-block-size` — not the whole rule.
  The two rules share several other declarations (`padding`, `background`, `font-family`, etc.)
  that are legitimately outside this contract; asserting the whole rule would silently expand this
  mission's scope beyond what the issue asks for.

### Subtask T007 – Rendered target-size measurement, both paths (FR-007)

- **Purpose**: Prove the 44px floor holds on the actual rendered box, not just in the CSS source.
- **Steps**:
  1. Create `apps/storybook/src/tests/sk-form-input-contrast-touch-target.spec.ts` (auto-collected
     by the existing whole-`testDir` `npx playwright test` job — no config change).
  2. Open story `form-formfield-html--form-input-default` (static path) and story
     `elements-skforminput--default` (element path) — these exact ids were confirmed via a real
     `storybook-static/index.json` build; re-verify if the story titles/export names changed since
     `research.md` was written.
  3. At a 390px viewport, measure the control's `getBoundingClientRect()` and assert block-size
     (height) ≥44px.
  4. Under a calibrated `style.zoom = '2'` simulation (copy `sk-collection.spec.ts`'s width-probe
     calibration exactly — create a 100px-wide probe element, assert its measured width is 200px,
     THEN take the real measurement), assert the control's block-size remains ≥44px and it is not
     clipped by any ancestor or pushed outside the viewport.
  5. Four (path × condition) combinations total: static/390px, static/zoom-200, element/390px,
     element/zoom-200.
- **Files**: `apps/storybook/src/tests/sk-form-input-contrast-touch-target.spec.ts` (new — same
  file as T008).
- **Parallel?**: No — after T005 (needs the rebuilt `sk-form-input.css.js` reflected in Storybook).
- **Notes**: For the element path, remember the control lives in the shadow root —
  `page.locator('sk-form-input').first()` then `.evaluate(el => el.shadowRoot.querySelector('.sk-form-input__control'))`-style
  access, or a `part`-based locator if one is easier; there is currently no `::part()` on this
  control specifically — check the element source before assuming one exists.

### Subtask T008 – Forced-colors distinguishability, both paths (FR-008)

- **Purpose**: Prove (not assume) the border survives `forced-colors: active` and record its
  actual resolved color.
- **Steps**:
  1. In the same spec file as T007, add a forced-colors sub-suite:
     `page.emulateMedia({ forcedColors: 'active' })`.
  2. For both consumption paths, read the control's computed `border-top-style` (or equivalent)
     and assert it is not `'none'`.
  3. Also render a plain, non-interactive bordered reference element (e.g. a `<div>` with a
     `border: 1px solid CanvasText`-style rule, or reuse an existing non-interactive bordered
     element already present in the story) in the same document and read ITS resolved
     forced-colors border color.
  4. Record both resolved colors (control vs. reference) as console output or an assertion
     message — the point is to MEASURE the actual values Chromium's forced-colors stylesheet
     produces for a native `<input>` vs. a generic bordered element, not to assert a specific
     system-color keyword from memory (see `adding-a-component.md`'s own corrected-guidance
     history on exactly this kind of mistake).
- **Files**: `apps/storybook/src/tests/sk-form-input-contrast-touch-target.spec.ts` (same file as
  T007).
- **Parallel?**: [P] with T007 (same new file, independent `test()` blocks — write both, they do
  not depend on each other's assertions).
- **Notes**: Model the emulation/shadow-root-read pattern on `apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts`.

### Subtask T009 – Axe re-run over the existing story set

- **Purpose**: Confirm the border-color/min-block-size change introduces zero new accessibility
  violations.
- **Steps**: Build Storybook (`npx nx run storybook:storybook:build`), then run
  `node scripts/run-axe-storybook.js`. Confirm zero WCAG 2.1 AA violations across all stories,
  including every story under `Elements/SkFormInput` and `Form/FormField (HTML)`.
- **Files**: none changed by this subtask — verification only.
- **Parallel?**: No — after T005 (needs the rebuilt Storybook).
- **Notes**: A story that fails to load is itself a failure under this repo's convention — do not
  treat a load error as an absence of violations.

### Subtask T010 – Changelog entry (FR-011)

- **Purpose**: Record the visible change for consumers, per DIRECTIVE_037.
- **Steps**: Add a `[Unreleased]` → `### Changed` entry to `docs/design-system/changelog.md`
  describing: the new `--sk-border-control` token; the `.sk-input`/`.sk-form-input__control`
  resting-state border-color change (and, for `.sk-input`, the width-spelling normalization); the
  added `min-block-size: var(--sk-space-9)` target-size floor. Follow the file's existing entry
  format (see the `sk-notice` entry already in the file for the level of detail expected).
- **Files**: `docs/design-system/changelog.md`.
- **Parallel?**: [P] with T006-T009 (no code dependency, but wait until T001-T004's exact values
  are settled before describing them).

### Subtask T011 – Full local quality gate run

- **Purpose**: Close out the WP with every relevant gate green.
- **Steps**: Run, in order, until all are green:
  1. `npm run quality:all` (ESLint + Stylelint + HTMLHint).
  2. `npm test` (`vitest run`) — runs the Vitest **node lane**, which picks up both T006's parity
     test and T012's contrast test automatically via `vitest.config.mts`'s existing
     `tests/node/**/*.test.ts` include; confirms both pass green (their red demonstrations already
     happened, separately, during T006/T012 themselves).
  3. `bash scripts/check-token-breaking-changes.sh` (confirms no breaking token removal/rename —
     and recall this script does NOT check contrast, which is exactly why step 2 above matters).
  4. `node scripts/build-elements-css.mjs --check` (confirms T005's regeneration is current).
  5. `node scripts/check-adopted-css-boundaries.mjs` (confirms no cross-boundary selector was
     introduced — should be a no-op here since no new selector was added).
  6. `npx nx run storybook:storybook:build` then `node scripts/run-axe-storybook.js` (re-confirm
     T009 after any later edits).
  7. `npx playwright test` (whole `testDir` — picks up T007/T008 automatically; also re-confirms
     nothing else regressed).
  8. `git status --porcelain` — must be empty after all regeneration steps above (no forgotten
     generated-artifact diff).
- **Files**: none changed by this subtask — verification only.
- **Parallel?**: No — after T001-T010, T012.

### Subtask T012 – Executable contrast assertion (FR-012)

- **Purpose**: Make the PR's contrast table verifiable rather than testimonial — the reason this
  subtask exists at all, and the mechanism that makes T001's "literal, not alias" decision
  permanent instead of just a comment someone could later work around.
- **Steps**:
  1. Create `tests/node/form-input-border-control-contrast.test.ts` (same auto-inclusion as T006's
     file — `vitest.config.mts`'s `include: ['tests/node/**/*.test.ts']`).
  2. Use `postcss` to parse `packages/tokens/src/tokens.css`; find the `:root` rule and the
     `:root[data-theme="light"], .sk-light` rule (verify the exact selector text against the
     current file rather than assuming it — it may not be byte-identical to what's quoted in
     `research.md`).
  3. From each rule, read the literal hex values of `--sk-border-control`, `--sk-surface-page`,
     `--sk-surface-card`, and `--sk-surface-input`. All four are plain hex literals in both blocks
     (T001 declared `--sk-border-control` that way on purpose) — no `var()` resolution is needed
     for this narrow, four-token scope.
  4. Implement (or import, if a suitable small utility already exists in this repo's own test
     helpers — check before writing a new one) the standard WCAG relative-luminance contrast-ratio
     formula.
  5. Assert ≥3.0 for all six (theme × surface) combinations, with a failure message naming which
     theme and which surface fell short.
  6. **Demonstrate red first**: temporarily nudge `--sk-border-control`'s light-theme hex one step
     toward `--sk-surface-input` (e.g., lighten it enough to cross below 3:1), run the test,
     confirm it fails and names the correct (theme, surface) pair, revert, confirm green. Record
     both outputs as evidence, the same standard T006 already applies to its own red/green
     demonstration.
- **Files**: `tests/node/form-input-border-control-contrast.test.ts` (new).
- **Parallel?**: [P] with T003-T011 (independent of the component CSS edits — only needs T001's
  token values) — but sequence its own red/green demonstration to complete before T011's final
  quality-gate run, and before T013's PR-body draft (T013 cites this test's outcome).
- **Notes**: Keep this test scoped to exactly `--sk-border-control` and the three named surfaces.
  Do **not** generalize it into a repo-wide WCAG 1.4.11 gate, add a probe table, or iterate any
  other component's tokens — that is #155's own open question ("Consider whether a 1.4.11 check
  belongs in the a11y gate"), not this WP's to answer. If you find yourself reaching for a
  component/selector list here, stop — that is scope creep into #155's territory.

### Subtask T013 – PR-body coordination record (FR-010)

- **Purpose**: Give #155 a linkable, accurate record of this mission's outcome, and leave a clean
  record of the two other things a reviewer would otherwise have to rediscover.
- **Steps**:
  1. Draft the PR description naming `--sk-border-control`, its six measured ratios in
     `ratio : 1` per-theme format (matching #155's own published format), and a plain statement
     that this mission does not close, absorb, or widen #155 — `.sk-button--secondary`'s own
     adoption remains #155's to do.
  2. Run `git diff --stat <base>..HEAD` (or equivalent) and confirm zero files under any
     `*button*` directory appear — paste that confirmation into the PR body or note it was
     checked.
  3. Name all three known remaining weak-hairline instances in the PR body: `.sk-textarea`/
     `.sk-form-textarea__control` (C-003, from the source issue) and `.sk-form-select` (C-003,
     found during this mission's own blast-radius check) — so a reviewer does not mistake any of
     the three for a missed file.
  4. State explicitly that T012's contrast test is scoped to this mission's own token/surfaces and
     is **not** #155's open general WCAG 1.4.11 gate question — so FR-012 is not misread as
     resolving it.
- **Files**: none — PR description only (not a repository file).
- **Parallel?**: No — last, once the final diff exists to describe and T012's red/green evidence
  exists to cite.

## Test Strategy

- Static parity: `tests/node/form-input-border-target-size-parity.test.ts` (T006), Vitest Node
  lane, auto-included, demonstrated red before green.
- Executable contrast: `tests/node/form-input-border-control-contrast.test.ts` (T012), Vitest Node
  lane, auto-included, six (theme × surface) assertions, demonstrated red before green — narrowly
  scoped, not #155's general gate.
- Rendered/forced-colors: `apps/storybook/src/tests/sk-form-input-contrast-touch-target.spec.ts`
  (T007, T008), Playwright, auto-collected by the whole-testDir job.
- Accessibility: `scripts/run-axe-storybook.js` (T009) — zero WCAG 2.1 AA violations.
- Full command list: `docs/contributing/adding-a-component.md` and `docs/contributing/running-quality-checks.md`
  (T011, including `npm test` for the two Node-lane tests — do not skip this step; `npm run
  quality:all` alone does NOT run Vitest).

## Risks & Mitigations

- **Forgetting to regenerate `sk-form-input.css.js`/`.css.d.ts` after T004** — silently NOT green
  under stylelint/typecheck alone; mitigate by running T011's `build-elements-css.mjs --check`
  explicitly, not assuming an editor watcher caught it.
- **Reaching for `var(--sk-fg-subtle)` on T001 out of habit** — an earlier draft of this WP's own
  spec did exactly this, and a review rejected it before any code existed; mitigate by reading
  `research.md`'s rewritten decision section before starting T001, and by T012's own test, which
  would still pass on a wrongly-aliased token today but is the mechanism that makes a FUTURE
  regression of this exact mistake visible.
- **T006's parser scope too broad or too narrow** — comparing whole-rule text would either miss
  the width-spelling drift #173 documents or false-positive on legitimately-different declarations
  (`padding`, `background`, etc.); mitigate by scoping strictly to `border`/`min-block-size`.
- **T012 becoming a general 1.4.11 gate** — scope creep into #155's own open question; mitigate by
  keeping the test to exactly one token and three named surfaces, no probe table, no iteration.
- **T012 assumed passing without actually being run** — `npm run quality:all` does not execute
  Vitest; mitigate with T011's explicit `npm test` step.
- **T007's zoom calibration uncalibrated** — mitigate by copying `sk-collection.spec.ts`'s
  width-probe technique exactly rather than assuming `style.zoom = '2'` alone is sufficient.
- **T008 asserting a specific forced-colors color from memory** — mitigate by measuring the actual
  resolved value; see `adding-a-component.md`'s own corrected-guidance history.
- **Scope creep into `.sk-textarea`/`sk-form-textarea`/`sk-form-select` or any `*button*` file** —
  mitigate with T013's explicit `git diff --stat` check before the PR is opened.
- **Accidentally wiring `visual.spec.ts`** — out of scope per C-009; if implementation finds
  itself editing that file, stop and reconsider against the spec's Constraints.

## Review Guidance

- Verify `--sk-border-control` is declared as a plain hex literal in BOTH theme blocks — reject
  the diff if either declaration is `var(--sk-fg-subtle)` or any other `var()` reference.
- Verify `--sk-border-control`'s six measured ratios independently (re-run the contrast
  computation against the actual committed hex values, don't just trust the comment).
- Verify T012's contrast test actually computes the ratio from the committed hex values (not
  hardcoded expected numbers that happen to match) and is genuinely demonstrated red (ask for the
  red transcript, not just the green one) — the same standard as T006.
- Verify `.sk-input` and `.sk-form-input__control`'s `border`/`min-block-size` declarations are
  textually identical (modulo selector name) in the final diff.
- Verify T006's test is genuinely demonstrated red (ask for the red transcript, not just the green
  one).
- Verify the diff touches zero `*button*` files and zero `sk-textarea`/`sk-form-textarea`/
  `sk-form-select` files.
- Verify `expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json` are
  UNCHANGED in the diff (this WP should not touch any of them).
- Verify the PR body states the #155 coordination outcome, names all three known remaining
  weak-hairline instances, and disclaims #155's general 1.4.11 gate.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-10T00:00:00Z – system – Prompt created.
- 2026-09-10T15:25:57Z – unknown – FR-007 real-verification finding, for the reviewer and the eventual PR body: min-block-size: var(--sk-space-9) is currently NOT the load-bearing mechanism satisfying the 44px floor on either .sk-input or .sk-form-input__control's default story. padding: var(--sk-space-3) twice (24px) + two 1px borders + Chromium's ~22px resolution of line-height: normal at 16px already sum to exactly 48px without it -- verified by removing ONLY min-block-size on each path (regenerated, rebuilt, measured via getComputedStyle/boundingBox): both rendered at 48px, both FR-007 tests stayed GREEN. Re-verified with npm test that FR-006's parity test DOES red on that same single-file deletion (packages/styles/src/form-field/sk-form-field.css: .sk-input has no min-block-size declaration: expected undefined to be defined) -- so the presence of the declaration is already mechanically enforced by FR-006 on both files; FR-007 does not need to also catch a deletion. FR-007's rendered proof was then re-verified against the actual CONTRACT (zeroing padding-block AND removing min-block-size, so no contributor covers the floor): static path measured 24px (Error: static path at 390px: measured block-size 24px, below the 44px floor), element path measured 24px (Error: element path at 390px: measured block-size 24px, below the 44px floor); both restored, regenerated, rebuilt, re-ran green (6/6). REVIEW GUIDANCE: FR-007's rendered proof does not have the same red-capability as FR-006/FR-012 against a single-declaration deletion of min-block-size alone -- FR-006 is what covers that case; FR-007 only reds when the whole contract (padding+floor) is broken together, which is the correct and sufficient proof that it enforces the 44px floor rather than merely observing an already-large number. PR BODY LINE (for T013): 'min-block-size: var(--sk-space-9) is not currently the sole guarantor of the 44px floor on either consumption path -- padding + border + the input's natural line-height already sum to 48px without it, verified by removing it alone (FR-006 catches that deletion). The declaration is the guarantee under a future change to padding, font-size, or line-height, verified red by breaking the whole contract (zeroed padding-block + no min-block-size -> 24px, caught by FR-007) and green after restoring.'
- 2026-09-10T17:44:48Z – claude – CORRECTION of the WP01 real-verification finding recorded earlier in this log. The earlier claim -- 'min-block-size is not currently the load-bearing mechanism ... padding+border+line-height already sum to 48px without it ... removing it alone leaves both paths at 48px' -- was FALSE for real compositions. It generalised a measurement taken in the ISOLATED Storybook story (form-formfield-html--form-input-default), whose inherited line-height differs from a real composition's. Decoding the border rows of the committed CI-rendered work-explorer-w1-lane-dark and work-explorer-w4-rail-1024 baseline PNGs pixel-by-pixel (independently verified, not just inherited from the reviewing lens) shows the control's REAL natural height is 45px, not 48px: border rows at y=263/y=307 (old, --sk-border-default) = 45px; y=261/y=308 (new, --sk-border-control + min-block-size) = 48px. The 44px contract IS already satisfied at 45px -- that part of the original claim's spirit survives -- but the declaration is not a no-op: pinning to exactly 48px costs +1px where the control shares a grid row with an .sk-form-select sibling already at 47px (>=1101px viewports), +3px where it has its own row, and +6px under 200% CSS zoom (2x the +3px case). This is a real, disclosed cost of expressing a 44px floor with this repo's only token at or above it (--sk-space-9/48px, no 44px token exists), not a sub-pixel/device-pixel rounding artifact as an earlier (also wrong) explanation claimed. Corrected in: both CSS files' comments (packages/styles/src/form-field/sk-form-field.css, packages/styles/src/form-input/sk-form-input.css), the PR body, docs/design-system/changelog.md, and kitty-specs/.../spec.md's C-009 row. Also in this round: fixed FR-008's forced-colors test (previously asserted nothing meaningful -- neither reverting the border color nor a real forced-color-adjust:none leak could fail it; now asserts the control's forced-colors border colour equals a reference element's, demonstrated red on a forced-color-adjust:none regression and green after restore). Added --sk-surface-muted (3.35:1 light, the new tightest of ten pairs) and --sk-surface-pill to the FR-012 contrast test's SURFACE_TOKENS -- the real work-explorer composition renders .sk-input on --sk-surface-muted, previously unguarded. Harvested the 18th invalidated baseline (work-explorer-w4-drawer-dismissed, hidden behind a first-screenshot failure in the same test) from CI run 34507030448 after confirming 222/222 total and sweeping visual.spec.ts for every other multi-screenshot work-explorer test to confirm (via source, not assumption) none hides a second stale baseline. Added a dedicated sk-form-select-shaped visual-baseline set (default-dark, light, invalid, narrow@320px, forced-colors) for both .sk-input and .sk-form-input__control -- zero dedicated visual coverage existed before this round, only the incidental work-explorer captures. Disclosed, not fixed: light-theme [aria-invalid=true] now measures 2.60:1 against --sk-surface-input, LESS visible than the same input at rest (3.85:1) -- --sk-color-red is not redefined for light theme and is a cross-cutting token out of this WP's scope; and the control's new 48px height no longer matches the sibling .sk-form-select's unchanged 47px, so their edges no longer align under align-items:end.
