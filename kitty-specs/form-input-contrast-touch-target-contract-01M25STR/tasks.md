# Tasks: `.sk-input` / `sk-form-input` contrast and touch-target contract

**Input**: `plan.md`, `spec.md`, `research.md`
**Feature dir**: `/home/jeroennouws/dev/spec-kitty-design-missions/321/kitty-specs/form-input-contrast-touch-target-contract-01M25STR`

## Work Package count: ONE, deliberately

Issue #321 states: "**Delivery:** one bounded Work Package and one PR." This is a constraint from
the source issue, not a sizing choice made here. The scope is genuinely small (one new token, two
edited CSS rules, two regenerated generated artifacts, three new test files, one changelog entry)
and fits comfortably inside the generic sizing guideline as well as the issue's own mandate — there
is no tension to record here, unlike a larger mission that must justify overriding the guideline.

**Amended after a coordinator review** (before any implementation began — no code existed yet):
`--sk-border-control` changed from a `var(--sk-fg-subtle)` alias to an independently declared
literal per theme (light value additionally darkened from `#8A8A7E` to `#7A7A6E` for contrast
margin), a new subtask (T012, FR-012) adds an executable contrast assertion so the PR's ratio table
is verifiable rather than testimonial, and `.sk-form-select` is now named alongside `.sk-textarea`/
`.sk-form-textarea__control` as a third known remaining weak-hairline instance. Twelve subtasks
became thirteen; the WP is still one bounded unit.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Add `--sk-border-control` to the Borders block of `packages/tokens/src/tokens.css`, in **both** `:root` (`#81818B`) and `:root[data-theme="light"], .sk-light` (`#7A7A6E`), as **independently declared literals** — not `var(--sk-fg-subtle)` or any other alias — with a derivation comment recording why (decoupling a 3:1 non-text obligation from a token that moves for text-contrast reasons) and the six measured ratios (research.md's table) | WP01 | |
| T002 | Regenerate `packages/tokens/dist/token-catalogue.json` via `npx nx run tokens:catalogue` | WP01 | after T001 |
| T003 | Edit `.sk-input` in `packages/styles/src/form-field/sk-form-field.css`: `border: 1px solid var(--sk-border-default)` → `border: var(--sk-border-width-1) solid var(--sk-border-control)`; add `min-block-size: var(--sk-space-9)` with a comment naming the 44px NFR-001 floor (matching `sk-confirm-dialog.css`/`sk-context-nav.css`'s existing comment shape). Leave `.sk-textarea` in the same file untouched. | WP01 | [P] with T004 |
| T004 | Edit `.sk-form-input__control` in `packages/styles/src/form-input/sk-form-input.css`: `border-color` `var(--sk-border-default)` → `var(--sk-border-control)`; add `min-block-size: var(--sk-space-9)`; add one line to the file's header comment block noting this resolution | WP01 | [P] with T003 |
| T005 | Regenerate `packages/elements/src/form-input/sk-form-input.css.js` and `.css.d.ts` via `node scripts/build-elements-css.mjs` (no `--check` — this run WRITES the regenerated files) | WP01 | after T004 |
| T006 | Author `tests/node/form-input-border-target-size-parity.test.ts`: parse both `sk-form-field.css` and `sk-form-input.css` with `postcss`, extract the `.sk-input`/`.sk-form-input__control` `border` and `min-block-size` declaration values, assert cross-file equality AND each-equals-canonical-expression. Demonstrate red first (temporarily diverge one file, run, confirm failure, revert), then green — record both transcripts. | WP01 | after T003, T004 |
| T007 | Author `apps/storybook/src/tests/sk-form-input-contrast-touch-target.spec.ts` — rendered target-size sub-suite: open `form-formfield-html--form-input-default` and `elements-skforminput--default`; measure the control's rendered block-size at 390px width and under a calibrated `style.zoom = '2'` simulation (reuse `sk-collection.spec.ts`'s width-probe calibration); assert ≥44px and no clipping on all four (path × condition) combinations | WP01 | after T005 |
| T008 | Same spec file — forced-colors sub-suite: `page.emulateMedia({ forcedColors: 'active' })` against both consumption paths; assert computed `border-style` is not `none`; record the actual resolved forced-colors border color for both the control and a plain non-interactive bordered reference element (measured, not assumed) | WP01 | [P] with T007 (same new file, independent test blocks) |
| T009 | Build Storybook (`npx nx run storybook:storybook:build`) and run `node scripts/run-axe-storybook.js` over the full story set; confirm zero WCAG 2.1 AA violations, including on the `Elements/SkFormInput` and `Form/FormField (HTML)` titles | WP01 | after T005 |
| T010 | Add a `docs/design-system/changelog.md` `[Unreleased]` → `Changed` entry: new `--sk-border-control` token, the `.sk-input`/`.sk-form-input__control` border-color change, and the added `min-block-size` | WP01 | [P] with T006-T009 |
| T011 | Run the full local quality pass until green: `npm run quality:all`, `npm test` (Vitest node lane — picks up T006 AND T012 automatically), `bash scripts/check-token-breaking-changes.sh`, `node scripts/build-elements-css.mjs --check`, `node scripts/check-adopted-css-boundaries.mjs`, `npx nx run storybook:storybook:build` + axe, `npx playwright test` (whole testDir, picks up T007/T008 automatically), `git status --porcelain` empty after all regeneration | WP01 | after T001-T010, T012 |
| T012 | Author `tests/node/form-input-border-control-contrast.test.ts`: parse both theme blocks of `tokens.css` with `postcss`, resolve `--sk-border-control` and the three surface tokens per theme (all four are literals, no `var()` resolution needed), compute WCAG contrast, assert ≥3:1 on all six (theme × surface) combinations. Demonstrate red first (nudge `--sk-border-control`'s hex one step, confirm failure names the (theme, surface) pair, revert), then green. Narrowly scoped — NOT #155's general 1.4.11 gate. | WP01 | [P] with T003-T011 (needs only T001); complete before T011 and T013 |
| T013 | Draft the PR-body coordination record: name `--sk-border-control` and its six measured ratios in `ratio : 1` format, state plainly that #155 is not closed/absorbed/widened by this mission, name all three known remaining weak-hairline instances (`.sk-textarea`, `.sk-form-textarea__control`, `.sk-form-select`), state that T012's test is not #155's general gate, and confirm (by `git diff --stat` against the base) that zero files under any `*button*` directory appear in the diff | WP01 | last |

## Work Package WP01 — token role (independent literal), both CSS rules, and the anti-drift/contrast/rendered proof

**Priority**: P1 (this mission's entire scope)
**Independent test**: Read the resting-state `border-color` of `.sk-input` and of
`<sk-form-input>`'s shadow-DOM `.sk-form-input__control` in both themes; confirm both equal the new
`--sk-border-control` token (declared as an independent literal, not an alias), and both clear 3:1
against `--sk-surface-page`, `--sk-surface-card`, and `--sk-surface-input`. Confirm both rules'
rendered block-size is ≥44px at 390px and at simulated 200% zoom. Run the parity test red
(deliberate divergence) then green, and the contrast test red (deliberate hex nudge) then green.
Run `node scripts/run-axe-storybook.js` and confirm zero violations. Confirm `git status
--porcelain` is empty after all generated-artifact regeneration, and that the diff touches no
`*button*` file and no `sk-textarea`/`sk-form-textarea`/`sk-form-select` file.
**Estimated size**: 13 subtasks, comfortably inside the generic sizing guideline — a small,
tightly-bounded token+CSS change plus its own proof (both halves — parity AND contrast — mechanically
enforced), not a new component.

### Included subtasks

T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012, T013

### Implementation sketch

1. T001-T002: land the token first, as an independent literal — everything else references it.
2. T003-T004 can be authored in parallel (different files), both consuming the T001 token.
3. T005 regenerates the one generated artifact T004 invalidates.
4. T006 (parity anti-drift) needs T003 and T004 both finished, since it asserts their final values.
5. T012 (contrast) needs only T001 — it can start as soon as the token exists, in parallel with
   T003-T011, but its own red/green demonstration must complete before T011's full gate run and
   before T013's PR-body draft.
6. T007-T008 (rendered/forced-colors) need T005 — the Storybook build must reflect the real,
   regenerated `sk-form-input.css.js`, not a stale one.
7. T009 (axe) needs the same rebuilt Storybook as T007-T008; can run in either order relative to
   them since it exercises a different tool over the same built output.
8. T010 (changelog) has no code dependency and can be written any time after T001-T004 settle the
   exact values it describes.
9. T011 (full gate run, including `npm test` for BOTH Node-lane tests) is the WP's close-out —
   everything else except T013 must be finished first.
10. T013 (PR-body coordination record) is written last, once the final diff exists to describe and
    T012's evidence exists to cite.

### Dependencies

None — this is the only Work Package.

### Risks

- **Forgetting to regenerate `sk-form-input.css.js`/`.css.d.ts` after T004** is silently NOT
  green locally if the WP author only runs stylelint/typecheck — `build-elements-css.mjs --check`
  is what catches it, and it must be run explicitly in T011, not assumed from an editor's file
  watcher.
- **Reaching for `var(--sk-fg-subtle)` on T001** — an earlier draft of this WP's own spec did
  exactly this and a review rejected it before any code existed (see `research.md`'s rewritten
  decision section); the token must be a plain hex literal in both theme blocks.
- **T006's parser being too loose or too broad** — comparing whole-rule text instead of the
  specific `border`/`min-block-size` declarations would either miss the exact drift #173 already
  documented (width spelling) or false-positive on unrelated, legitimately-different declarations
  (`padding`, `background`, etc., which are not part of this contract). Scope the postcss walk to
  exactly the two declarations named in FR-006.
- **T012 becoming a general 1.4.11 gate** instead of staying scoped to this mission's own token and
  three surfaces — that is #155's own open question, not this WP's to answer (C-010).
- **T012 silently not run** — `npm run quality:all` does not execute Vitest; T011's explicit
  `npm test` step exists specifically so this and T006 are actually verified green, not merely
  present in the tree.
- **T007's zoom calibration** must reuse `sk-collection.spec.ts`'s existing width-probe technique,
  not a new, unverified zoom mechanism — an uncalibrated `style.zoom` assignment could silently
  measure the wrong thing.
- **T008's forced-colors color must be measured, not asserted from memory** — `adding-a-component.md`'s
  own corrected-guidance history is the cautionary precedent (a `<summary>`-specific mapping was
  once wrongly generalized); record the actual resolved value.
- **Scope creep into `.sk-textarea`/`sk-form-textarea`/`sk-form-select` or any `*button*` file** —
  all explicit non-goals (C-003, C-004, C-005); T013's `git diff --stat` check exists specifically
  to catch an accidental touch before the PR is opened.

**Requirement coverage**: FR-001 through FR-012, NFR-001 through NFR-005, C-001 through C-010 —
the full spec, since this is the mission's only Work Package.
