# Implementation Plan: `.sk-input` / `sk-form-input` contrast and touch-target contract

**Branch**: `mission/form-input-contrast-touch-target-contract` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/form-input-contrast-touch-target-contract-01M25STR/spec.md`

## Branch contract (repeated per `/spec-kitty.plan` protocol)

- Current branch at plan start: `mission/form-input-contrast-touch-target-contract`
- Planning/base branch: `mission/form-input-contrast-touch-target-contract`
- Merge target for completed changes: `mission/form-input-contrast-touch-target-contract` (single_branch topology — no separate coordination branch; the PR back to `train/elements-first` happens from this branch directly, per issue #321)
- `branch_matches_target`: true

## Summary

Introduce one new token-layer border role, `--sk-border-control`, in both theme blocks of `packages/tokens/src/tokens.css`, aliased to the existing `--sk-fg-subtle` token (zero new hex literals). Point both consumption paths of the input control — the hand-authored static `.sk-input` (`packages/styles/src/form-field/sk-form-field.css`) and the live `<sk-form-input>` element's shadow-DOM `.sk-form-input__control` (`packages/styles/src/form-input/sk-form-input.css`) — at the new role for their resting-state border color, and give both a `min-block-size: var(--sk-space-9)` (48px, the repo's own existing nearest-above-44px-floor token, already precedented in `sk-confirm-dialog.css`/`sk-context-nav.css`). Because no generator links these two files (unlike a component with a `*.markup.ts`), add a Node-lane static-parity test and Playwright rendered/forced-colors tests as the anti-drift proof the issue requires. Regenerate the two generated artifacts this change touches (`token-catalogue.json`, `sk-form-input.css.js`/`.d.ts`). Touch no button-related file (#155/#320 boundary) and no `sk-textarea`/`sk-form-textarea` file (explicit non-goal).

## Technical Context

**Language/Version**: CSS (token/component source of record) plus TypeScript test files (Vitest Node lane, Playwright), matching every other change in this repo — no new language or version introduced.
**Primary Dependencies**: `postcss`, `postcss-selector-parser` (already devDependencies, already used this way in `apps/storybook/src/tests/sk-form-select.spec.ts`) for the anti-drift CSS-parsing assertion. No new npm package.
**Storage**: N/A — presentation tokens/CSS only, no persisted state.
**Testing**: A new Vitest Node-lane test (`tests/node/**/*.test.ts`, auto-included by `vitest.config.mts`'s existing `include: ['tests/node/**/*.test.ts']`) for the static anti-drift assertion; a new Playwright spec under `apps/storybook/src/tests/` (auto-collected by the existing whole-`testDir` `npx playwright test` job) for the rendered target-size and forced-colors assertions. `node scripts/run-axe-storybook.js` for accessibility over the existing (unchanged-in-count) story set. No new test runner.
**Target Platform**: Same as every other component — modern evergreen browsers (Chrome/Firefox/Safari), the existing Storybook/Playwright/axe toolchain. No new platform.
**Project Type**: Single library, existing `packages/<pkg>/src/<name>/` layout. No new package, no web/mobile split.
**Performance Goals**: None beyond existing charter baseline (no runtime performance targets for static/presentational components).
**Constraints**: Tokens-only CSS (C-007). No new hex literal in `tokens.css` — the new role is a `var()` alias (see spec's "Decisions this spec makes"). `packages/elements/src/form-input/sk-form-input.css.js`/`.css.d.ts` and `packages/tokens/dist/token-catalogue.json` are generated and regenerated, never hand-edited (C-008). One Work Package, one PR (C-001). No file under any `*button*` directory (C-004/C-005). No edit to `sk-textarea`/`sk-form-textarea` files (C-003). No `ElementInternals`/validation change (C-006).
**Scale/Scope**: Two existing CSS rules edited (`.sk-input`, `.sk-form-input__control`); one new token declared twice (once per theme block); two new test files; two generated artifacts regenerated. No new component, no new element, no new attribute/property/method/part — `expected-parts.json`, `expected-docs.json`, `behaviours.json`, and `mutations.json` are **not** touched (verified: this mission adds no `@csspart`, no documented attribute/method, and no new owned behavior — confirmed by reading `behaviours.json`'s existing `sk-form-input` entries, all of which are pre-existing validation/form-association ids this mission does not touch).

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Charter file present at `.kittify/charter/charter.md` (generated 2026-05-01, not resynced since the elements-first migration — its Angular-era performance benchmarks are stale per CLAUDE.md §1; not treated as a gate here).

| Charter gate | Applies? | Assessment |
|---|---|---|
| Storybook story: default + all interactive states + responsive breakpoints | Partially — no NEW story needed | Every required state (default, focus, `[aria-invalid="true"]`, `:disabled`, dark, `LightMode`) already exists on both paths (`Form/FormField (HTML)`: `FormInput Default/Focus/Error/Disabled/Filled`, `Light Mode`; `Elements/SkFormInput`: `Default/Error/Disabled`, `Light Mode`) — verified by reading both `.stories.ts`/HTML-story files. This mission changes the CSS those stories render, not the story set itself. No new story is required by the spec. |
| axe-core zero WCAG 2.1 AA violations, load failure = failure | Yes | `node scripts/run-axe-storybook.js` re-run over the existing (unchanged-count) story set — a border-color/min-block-size change does not add new violation surface, but must still measure zero, not assume it. |
| Visual diff / reference screenshots | Yes, but not via `visual.spec.ts` | `apps/storybook/src/tests/visual.spec.ts` has zero entries for this component today (verified) — this mission does not newly wire that opt-in baseline system (spec C-009). The charter's "visual review... approved" gate is satisfied by human review of the PR's screenshots plus the new FR-007/FR-008 automated rendered checks. |
| Token dependency documentation | Yes | `--sk-border-control`'s derivation and measured ratios are recorded as a comment beside its declaration in `tokens.css` (FR-001), following the `--sk-fg-subtle`/rose-tint precedent. |
| ADR-11 required-behaviours list, red-first | No — not applicable | This mission adds no new attribute, event, focus/keyboard behavior, or form-association change to `<sk-form-input>`. `behaviours.json`'s existing `sk-form-input` subjects (form association, SC-016 delegate/rendered-control correspondence, etc.) are untouched and remain valid — this mission's CSS-only change does not alter any UA-delegate or validation logic. No new subject is declared; declaring one where none is owned would assert nothing (per the recipe's own warning). |
| CSS/SCSS `--sk-*` tokens only | Yes | `stylelint`'s `scale-unlimited/declaration-strict-value` (already covers `/color/`, `background*`, `padding`, `margin`, `border-radius` — not `min-block-size`/`border` shorthand, but CLAUDE.md's hard rule 1 is repo policy regardless of gate coverage) — every new/changed value here is `var(--sk-space-9)` or `var(--sk-border-control)`; zero literals. |
| Conventional commits via commitlint | Yes | Scopes `tokens` (tokens.css commit) and `styles`/`elements` (CSS + generated `.css.js` commit) per the closed enum — no `specs`/`adr` scope exists; the spec-phase commit already used `docs:` unscoped (corrected from an initial `docs(specs)` miss during this mission — see spec-commit history). |
| Maintainer approval on component/token-layer PRs | Yes | Applies at PR review time — outside this design-phase mission's own scope, but flagged here since this PR touches the token namespace (one maintainer approval required per charter Review Policy). |
| Adversarial squad — tier and cadence | Yes | Issue #321 states **Squad tier: C — pre-merge**. Per charter Review Policy, tier-C is pre-merge only; this design-phase mission does not need a squad pass before implementation is dispatched. |
| Deployment/versioning constraints | Yes | Adding a token is additive (no rename/removal of `--sk-border-default`/`-strong`, both remain in use by `.sk-textarea`/`.sk-form-textarea__control` and elsewhere) — no major version bump implied. `bash scripts/check-token-breaking-changes.sh` should report no breaking changes. |
| One human approval for `--sk-*` token namespace changes | Yes | This PR changes the token namespace (adds `--sk-border-control`) — explicitly flagged for the human reviewer, per charter Branch Strategy. |

No Charter Check violations requiring justification. Complexity Tracking table below is empty.

## Project Structure

### Documentation (this mission)

```
kitty-specs/form-input-contrast-touch-target-contract-01M25STR/
├── plan.md              # This file
├── spec.md              # Mission specification (committed)
├── research.md           # Phase 0 output — measurement record (this plan phase)
├── data-model.md         # N/A — no data entity (spec's Key Entities: "None")
├── quickstart.md         # N/A — no new consumer-facing API/quickstart; existing Storybook
│                         #       stories already demonstrate both consumption paths
├── contracts/            # N/A — no REST/GraphQL/public-method contract; the full public
│                         #       contract (token name, value, both CSS declarations) is
│                         #       already stated exactly in spec.md's FR-001..FR-004
└── tasks/                # /spec-kitty.tasks output (not created by this command)
```

`data-model.md`, `quickstart.md`, and `contracts/` are declared N/A rather than silently omitted: this mission's entire public surface is two CSS declarations and one token, already stated to the exact string in spec.md — a separate contract document would restate spec.md rather than add information, which this repo's own documentation-drift concern (DIRECTIVE_037) counsels against.

### Source Code (repository root)

```
packages/tokens/src/tokens.css
# Borders block, BOTH theme blocks: add
#   --sk-border-control: var(--sk-fg-subtle);
# with a derivation comment (FR-001).

packages/tokens/dist/token-catalogue.json
# REGENERATED by `npx nx run tokens:catalogue` — never hand-edited.

packages/styles/src/form-field/sk-form-field.css
# .sk-input: border 1px solid var(--sk-border-default)
#         -> var(--sk-border-width-1) solid var(--sk-border-control)
# .sk-input: + min-block-size: var(--sk-space-9);
# (FR-002, FR-004). .sk-textarea in the SAME FILE is NOT touched (C-003).

packages/styles/src/form-input/sk-form-input.css
# .sk-form-input__control: border-color var(--sk-border-default) -> var(--sk-border-control)
# .sk-form-input__control: + min-block-size: var(--sk-space-9);
# (FR-003, FR-004). Header comment block (lines 1-38) gets one line noting this
# resolution, matching the file's own convention of recording what changed and why.

packages/elements/src/form-input/sk-form-input.css.js
packages/elements/src/form-input/sk-form-input.css.d.ts
# REGENERATED by `node scripts/build-elements-css.mjs` from the .css source above —
# never hand-edited (FR-009, C-008).

tests/node/form-input-border-target-size-parity.test.ts   # NEW
# Vitest Node-lane test, auto-included by vitest.config.mts's
# `include: ['tests/node/**/*.test.ts']`. Parses both CSS source files with
# postcss, asserts cross-file AND canonical-value equality (FR-006).

apps/storybook/src/tests/sk-form-input-contrast-touch-target.spec.ts   # NEW
# Playwright spec, auto-collected by the existing whole-testDir `npx playwright test`
# job (no config change). Covers:
#  - rendered target-size measurement, both paths, 390px + calibrated 200% zoom (FR-007)
#  - forced-colors distinguishability, both paths, measured not assumed (FR-008)

docs/design-system/changelog.md
# [Unreleased] "Changed" entry (FR-011).

# NOT touched by this mission (explicit — see Constraints):
#   packages/styles/src/form-textarea/, packages/elements/src/form-textarea/  (C-003)
#   any packages/styles/src/*button*/, packages/elements/src/*button*/       (C-004, C-005)
#   expected-parts.json, expected-docs.json, behaviours.json, mutations.json  (no new
#     part/attribute/method/behavior owned — see Technical Context, Scale/Scope)
#   apps/storybook/src/tests/visual.spec.ts and its snapshots directory        (C-009)
#   packages/react/src/**, packages/elements/vue.d.ts, custom-elements.json,
#     SIZES.md — regeneration is a no-op for a pure CSS-value/token change (no
#     attribute/method/part/size delta), but each generator's `--check` mode is
#     still run as a drift sanity check in the WP's quality pass (see below).
```

**Structure Decision**: No new package, no new component, no new element. This is a two-file CSS edit plus a one-token addition against the existing `packages/tokens` / `packages/styles` / `packages/elements` layout, plus two new test files in their existing, already-globbed test directories. The smallest structural shape this repo has for a change of this shape — matching, for example, how #177 (the rose tint family) touched only `tokens.css` plus its catalogue regeneration.

## Complexity Tracking

*Fill ONLY if Charter Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |

## Implementation Concern Map

> One Work Package is mandatory (C-001, issue #321: "one bounded Work Package and one PR"). This
> map exists only to help `/spec-kitty.tasks` sequence the single WP's internal task order — it
> does **not** imply multiple WPs, and `/spec-kitty.tasks` must not split it into more than one.

### IC-01 — Token role and the two CSS declarations

- **Purpose**: Add `--sk-border-control` to both theme blocks of `tokens.css` with its derivation recorded, regenerate the token catalogue, and point `.sk-input`'s and `.sk-form-input__control`'s resting-state `border` at it while adding the `min-block-size: var(--sk-space-9)` target-size floor to both. This is the actual fix; everything else in this mission proves it.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-009 (token-catalogue half), NFR-001, NFR-002, NFR-004.
- **Affected surfaces**: `packages/tokens/src/tokens.css`, `packages/tokens/dist/token-catalogue.json` (generated), `packages/styles/src/form-field/sk-form-field.css`, `packages/styles/src/form-input/sk-form-input.css`, `packages/elements/src/form-input/sk-form-input.css.js`/`.css.d.ts` (generated).
- **Sequencing/depends-on**: none — this is the foundation the anti-drift and rendered tests verify.
- **Risks**: Editing `.sk-input`'s border-width spelling (`1px` → `var(--sk-border-width-1)`) is a deliberate, in-scope normalization (FR-002) — a reviewer could mistake it for an unrelated drive-by if the PR doesn't explain it; the PR description should name it explicitly as part of closing #173's documented spelling gap, not a separate concern. Forgetting to regenerate `sk-form-input.css.js` after editing the source `.css` is silently NOT green — `build-elements-css.mjs --check` fails CI on the drift.

### IC-02 — Anti-drift, rendered-measurement, and forced-colors proof

- **Purpose**: Build the automated proof the issue's "hard part" demands: a static parity/canonical-value test that can be shown red on a deliberate divergence (FR-006), a rendered target-size measurement at narrow width and simulated 200% zoom on both consumption paths (FR-007), and a forced-colors distinguishability check measured (not assumed) on both paths (FR-008). Also covers the axe re-run, the changelog entry, and the PR-body coordination record.
- **Relevant requirements**: FR-006, FR-007, FR-008, FR-010, FR-011, NFR-003, NFR-005.
- **Affected surfaces**: `tests/node/form-input-border-target-size-parity.test.ts` (new), `apps/storybook/src/tests/sk-form-input-contrast-touch-target.spec.ts` (new), `docs/design-system/changelog.md`, the PR description (not a repo file).
- **Sequencing/depends-on**: IC-01 (the canonical values these tests assert against must exist first; the rendered tests need the built Storybook to reflect the IC-01 CSS change).
- **Risks**: A postcss-based parser that is too loose (e.g., comparing whole rule text instead of the specific `border`/`min-block-size` declarations) would false-positive on unrelated formatting differences; too narrow (only checking `border-color` when the width spelling also matters per FR-002) would miss the very drift #173 already documented. The `style.zoom` 200% simulation technique (from `sk-collection.spec.ts`) must be calibrated with its own width-probe assertion, not assumed correct by inspection. The forced-colors test must record the ACTUAL resolved system color rather than asserting a specific one by assumption — `adding-a-component.md`'s own corrected-guidance history is the cautionary precedent here.
