---
work_package_id: WP01
title: Segmented-choice styles-only component (CSS, exemplars, stories, Playwright, ratchets, docs)
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
- FR-014
- FR-015
- FR-016
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
- C-009
- C-010
planning_base_branch: train/elements-first
merge_target_branch: train/elements-first
branch_strategy: Lane-a was cut from the then-latest origin/train/elements-first at a78445552e42cb6bbde4e1d2e497137bc30c9dee and contains the accepted planning artifacts. Deliver exactly one WP and one PR from lane-a back to train/elements-first. Never push the planning branch. Never target main.
base_branch: kitty/mission-work-explorer-segmented-choice-styles-01M20C9F
base_commit: 1209aef7c3aa3aea1ba43b49c7f1f633034b69eb
created_at: '2026-09-08T18:34:10.637741+00:00'
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
phase: Phase 1 - segmented-choice styles-only delivery
history:
- at: '2026-09-08T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/segmented-choice/
create_intent:
- packages/styles/src/segmented-choice/sk-segmented-choice.css
- packages/styles/src/segmented-choice/sk-segmented-choice-default.html
- packages/styles/src/segmented-choice/sk-segmented-choice-second-selected.html
- packages/styles/src/segmented-choice/sk-segmented-choice-third-selected.html
- packages/styles/src/segmented-choice/sk-segmented-choice-two-items.html
- packages/styles/src/segmented-choice/sk-segmented-choice-five-items.html
- packages/styles/src/segmented-choice/sk-segmented-choice-long-labels.html
- packages/styles/src/segmented-choice/sk-segmented-choice-no-selection.html
- packages/styles/src/segmented-choice/sk-segmented-choice-all-disabled.html
- packages/styles/src/segmented-choice/sk-segmented-choice-one-disabled.html
- packages/styles/src/segmented-choice/index.ts
- packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts
- apps/storybook/src/tests/sk-segmented-choice.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/SIZES.md
- packages/styles/src/segmented-choice/**
- packages/styles/package.json
- packages/styles/src/index.ts
- apps/storybook/src/tests/sk-segmented-choice.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-segmented-choice-*.png
- docs/design-system/using-components.md
- expected-stories.json
- scripts/build-styles-only-markup.mjs
- suite-budget.json
role: implementer
tags:
- styles-only
- work-explorer
- accessibility
task_type: feature
tracker_refs:
- spec-kitty/spec-kitty-design#270
- spec-kitty/spec-kitty-design#269
---

# Work Package Prompt: WP01 – Segmented-choice styles-only component

## Goal

Ship `sk-segmented-choice`, a **styles-only** CSS class family in `@spec-kitty/styles`
(`packages/styles/src/segmented-choice/`) that lets a Team Kitty consumer wrap a row of
consumer-owned `<button type="button" aria-pressed="…">` elements and render them as one visually
coherent, accessibly distinct segmented control. No custom element, no `packages/elements/`
directory, no JS, no ARIA authored by the library. One Work Package, one PR, targeting
`train/elements-first` (C-007), commit scope `styles` throughout (C-006 — an authoring rule the
implementer follows on every commit in this WP, not a subtask to execute).

Full binding requirements: `spec.md` FR-001..FR-016, NFR-001..NFR-006, C-001..C-010, SC-001..SC-011.
Full sequencing rationale: `plan.md`'s Implementation Concern Map (IC-01..IC-06) and Gate
Enumeration — this WP file translates that map into checkable subtasks; where this file and
plan.md disagree on a procedural detail, plan.md's IC map is authoritative.

**Non-goals (binding, do not implement):** tabs, tab panels, `radiogroup`, select replacement,
navigation/router binding, item arrays, keyboard roving, automatic exclusivity, counts, badges,
filter logic, persistence, animation conveying state, a registered `sk-segmented-choice` custom
element, an RTL story, or any breakpoint below 1024px.

## Execution order (binding — do not reorder)

This is the real dependency order plan.md's IC map works out (IC-01 through IC-06 are concerns,
not phases — T001-T018 below are their concrete sequencing). Read it once before starting; the
subtasks below are numbered in this order. The manual 200%-zoom validation (NFR-003/SC-005) is
NOT part of this numbered sequence — per plan.md's IC-04 Risks narrative and Gate Enumeration
table (both cited in the Goal section), it is Tier-C pre-merge squad work, not an implementer
subtask; see the Definition of done for its own squad-gate bullet.

1. **T001** (red-first, no dependency) — source-contract Playwright assertions, genuinely runnable
   before any component code exists.
2. **T002-T003** — HTML exemplars + generated barrel (IC-02).
3. **T004** — minimal/undifferentiated first-pass CSS (IC-01, part 1).
4. **T005** — first-pass Storybook stories file (IC-05) + first Storybook build.
5. **T006-T009** — write the LIVE Playwright block red against the minimal CSS pass, run it, confirm
   it fails for the right reason (no visual/behavioural cue delta yet).
6. **T010-T011** — land the remaining CSS: FR-003 distinguishing declarations + 44px
   narrow-viewport treatment (T010), forced-colors block (T011) (IC-03).
7. **T012** — rebuild Storybook again (static-serving constraint — the first rebuild does not cover
   CSS landed afterward) and re-run the live Playwright block until green, including a re-check of
   the source-contract block (IC-04's second rebuild).
8. **T013** — visual-regression `test()` blocks, authored LAST against the final CSS state.
9. **T014-T015** — ratchets (`expected-stories.json`) and docs (`using-components.md`).
10. **T016** — no-op ratchet grep-verification.
11. **T017** — full gate sweep.
12. **T018** — push, expect CI visual-regression to fail by design, pull baselines from the
    `visual-regression-diffs` artifact, commit them as a second head. (The manual 200%-zoom
    validation that follows the final push is the Tier-C pre-merge squad's own responsibility, not
    a numbered implementer subtask — see the Definition of done.)

---

## T001 — Red-first source-contract Playwright block (SC-009, FR-014, FR-010, FR-002, C-001, C-002)

Create `apps/storybook/src/tests/sk-segmented-choice.spec.ts`. Author the `browserName ===
'chromium'`-only source/distribution-contract `test.describe` block first, matching
`sk-form-select.spec.ts`'s two-block shape (`STORY_PREFIX`, `storyIds` const, selector-inventory
pattern at the top of that file). This block does not `page.goto` anything, so it is genuinely
runnable and RED (failing because the component doesn't exist yet) before T002 lands anything.
Include:

- A test named on the pattern of `sk-form-select.spec.ts`'s `'the component remains styles-only
  and absent from element, wrapper, behavior, and mutation surfaces'` that greps
  `expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`,
  `packages/elements/custom-elements.json`, and every file under `packages/react/src/` for zero
  occurrences of `sk-segmented-choice` / `SkSegmentedChoice` (SC-009).
- A test confirming no `packages/elements/src/segmented-choice/` directory exists (C-001).
- A test confirming `packages/styles/src/segmented-choice/sk-segmented-choice.css` exists and
  `index.ts` in the same directory is present (generated, once T003 lands) — selector inventory
  assertions (`.sk-segmented-choice`, `.sk-segmented-choice__item`) via `postcss` +
  `postcss-selector-parser`, matching the form-select spec's own parsing approach.
- A test asserting `docs/design-system/using-components.md` contains a `## Segmented choice`
  section (FR-011; content lands at T015, but the selector assertion can be written now).

Run this block now and confirm it fails (no CSS file, no docs section yet exist).

## T002 — Author the 9 HTML exemplars (FR-006, FR-010, FR-001, C-001, C-002, C-003)

In `packages/styles/src/segmented-choice/`, author exactly the 9 files plan.md's Project Structure
table names, each a self-contained `role="group" aria-label="…"` wrapper (or equivalent accessible
group name) around consumer-authored `<button type="button" aria-pressed="…">` items using only
`sk-segmented-choice` / `sk-segmented-choice__item` classes (C-003 BEM):

- `sk-segmented-choice-default.html` — 3 items, 1st `aria-pressed="true"` (also backs `DefaultDark`
  and `LightMode` at story level).
- `sk-segmented-choice-second-selected.html` — 3 items, 2nd pressed.
- `sk-segmented-choice-third-selected.html` — 3 items, 3rd pressed.
- `sk-segmented-choice-two-items.html` — 2 items.
- `sk-segmented-choice-five-items.html` — 5 items.
- `sk-segmented-choice-long-labels.html` — long label content that challenges normal item width.
- `sk-segmented-choice-no-selection.html` — 3 items, no `aria-pressed="true"` anywhere.
- `sk-segmented-choice-all-disabled.html` — 3 items, every button `disabled`.
- `sk-segmented-choice-one-disabled.html` — 3 items, exactly 1 `disabled` (also backs
  `ForcedColors`, reusing the pressed+unpressed+disabled cue set in one frame — the
  form-select `ForcedColors`/`RequiredInvalid` reuse pattern).

## T003 — Generate the barrel (FR-010, NFR-006, C-002)

Run `node scripts/build-styles-only-markup.mjs` to generate
`packages/styles/src/segmented-choice/index.ts` from the 9 files in T002. Do not hand-edit the
output. Confirm `node scripts/build-styles-only-markup.mjs --check` passes.

## T004 — Minimal/undifferentiated first-pass CSS (IC-01 part 1)

Author `packages/styles/src/segmented-choice/sk-segmented-choice.css` with only the structural
layout rules needed to render the 9 exemplars correctly at any item count (FR-005's overflow
containment, flex-wrap layout with no assumption of exactly 3 items — FR-006 stories 4/5 need this
to hold at 2 and 5 items): `.sk-segmented-choice` (group container) and
`.sk-segmented-choice__item` (per-button base styling). Deliberately do NOT yet add the
pressed/hover/active/focus-visible/disabled distinguishing declarations (FR-003) or the
forced-colors block (NFR-004/C-010) — those land at T010-T011, after the live Playwright block is
red against this minimal pass. All values are `var(--sk-*)` tokens already (C-004/FR-015); do not
add token-free literals even at this minimal stage.

## T005 — First-pass Storybook stories file + first build (IC-05)

Author `packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts`:
`title: 'Components/SkSegmentedChoice (HTML)'`, `tags: ['autodocs']`,
`parameters: { a11y: { disable: false } }`. Export all 13 stories from the Story-id ratchet table
in plan.md, each rendering a generated-barrel (T003) export inside a frame `<div>` matching
`sk-form-select-html.stories.ts`'s `storyFrame` pattern:

| Export | Backing exemplar | Notes |
|---|---|---|
| `Default` | `sk-segmented-choice-default.html` | |
| `SecondSelected` | `sk-segmented-choice-second-selected.html` | |
| `ThirdSelected` | `sk-segmented-choice-third-selected.html` | |
| `TwoItems` | `sk-segmented-choice-two-items.html` | |
| `FiveItems` | `sk-segmented-choice-five-items.html` | |
| `LongLabels` | `sk-segmented-choice-long-labels.html` | |
| `NoSelection` | `sk-segmented-choice-no-selection.html` | |
| `AllDisabled` | `sk-segmented-choice-all-disabled.html` | |
| `OneDisabled` | `sk-segmented-choice-one-disabled.html` | |
| `Narrow` | `sk-segmented-choice-default.html` | fixed 1024px viewport/frame width (C-005) |
| `ForcedColors` | `sk-segmented-choice-one-disabled.html` | |
| `DefaultDark` | `sk-segmented-choice-default.html` | explicit dark-theme contract story |
| `LightMode` | `sk-segmented-choice-default.html` | `class="sk-light"` wrapper — **never** `data-theme` |

`LightMode` sets `parameters.backgrounds.default: 'sk-light'`. Run
`npx nx run storybook:storybook:build` and confirm all 13 story ids load (check the built
`index.json`).

## T006 — Live Playwright block: load/role/name/order (FR-007)

In `sk-segmented-choice.spec.ts`, add the live (non-Chromium-restricted) `test.describe` block
iterating all 13 story ids via `page.goto('/iframe.html?id=<id>&viewMode=story')`. Assert: every
rendered item is a real `<button>`, each carries an accessible name, the group carries an
accessible group name, and DOM/tab order matches visual/source order.

## T007 — Live Playwright block: activation and disabled exclusion (FR-004, FR-008)

In the same live block, assert Enter and Space activate a focused button (browser-owned, verified
against this component's actual rendered markup), that `aria-pressed` on each button in a story
matches exactly what that story's fixture authored, and that a `disabled` button (in
`AllDisabled`/`OneDisabled`) is excluded from Tab traversal.

## T008 — Live Playwright block: FR-003 non-colour-only pressed-state delta (its own named test)

Add a **separately named** test (this is PLAN-VERIFY-002's fix — do not let it merge into a
generic assertion) asserting the pressed item's computed style (border/font-weight/shape) differs
from an unpressed sibling's by more than a colour channel — comparing computed styles, not reading
CSS source, mirroring `sk-nav-pill.css`'s `.sk-nav-pill__item--active` border+font-weight
precedent. This is spec.md User Story 1 Acceptance Scenario 1's central claim.

## T009 — Live Playwright block: hover/active/focus/axe/zoom-overflow, and run it RED (FR-009)

In the same live block, add:

- Hover delta: `await item.hover()`, compare computed styles against resting state — pattern from
  `sk-context-nav.spec.ts:813`, `sk-transition-matrix.spec.ts:312` (the **positive**-delta test,
  not the invariance test at `:265`/`:285` — see plan.md's Q5 correction), `sk-bar-chart.spec.ts:257`.
- Active delta: `await page.mouse.down()` on an unpressed item, compare computed styles.
- Focus-visible: Tab to an item, assert a visible, non-clipped indicator per state.
- `axe-core` run per story (all 13), zero WCAG 2.1 AA violations (NFR-001); a story that fails to
  load counts as a failure.
- `document.scrollingElement.scrollWidth <= document.documentElement.clientWidth` at default
  viewport (NFR-003, automated half — see the Definition of done's manual 200%-zoom squad-gate
  bullet for the manual half, which is Tier-C pre-merge squad work, not an implementer subtask).
- Chromium-only forced-colors emulation assertion (on `ForcedColors`): selected, focus-visible,
  AND disabled indicators each remain distinguishable under `forced-colors: active` — all three,
  per User Story 4 Acceptance Scenario 4 (SC-006) — mirroring `sk-notice-forced-colors.spec.ts`'s pattern.
- 44px minimum measurement on `Narrow` at exactly 1024px viewport width
  (`page.setViewportSize({ width: 1024, ... })`), via `page.evaluate` /
  `getBoundingClientRect()` on every button (NFR-002/SC-004), plus a check that `Default`'s density
  is unaffected (not inflated to 44px).

Run the full live block now (`npx playwright test apps/storybook/src/tests/sk-segmented-choice.spec.ts`)
against T005's Storybook build and confirm it fails for the right reason: no visible cue delta (T008),
no forced-colors distinguishability (T009's forced-colors assertion), because T004's CSS is still
minimal/undifferentiated. This is the RED checkpoint DIRECTIVE_041 requires.

## T010 — Land FR-003's distinguishing CSS declarations (IC-01 part 2)

In `sk-segmented-choice.css`, add the pressed/hover/active/focus-visible/disabled state
declarations: pressed fill via `background: var(--sk-bg-pill)` (matching
`.sk-nav-pill__item--active { background: var(--sk-bg-pill); }` in `sk-nav-pill.css` — not
`--sk-surface-pill`, per FR-015/C-004/research.md Q3), plus existing `--sk-border-*` /
`--sk-border-focus` token families for the non-colour cue (border/weight/shape) each state needs.
Add the viewport-scoped 44px minimum-target-size rule for the narrow/wrapping case (NFR-002) without
inflating `Default`'s density (User Story 2 Acceptance Scenario 3) — scope it, do not apply it
unconditionally.

## T011 — Land the forced-colors block (IC-03)

Add `@media (forced-colors: active)` to `sk-segmented-choice.css` covering the selected-state,
focus-visible, AND disabled-state indicators (all three — User Story 4 Acceptance Scenario 4),
using ONLY longhand `-color` properties (never `border`/`outline` shorthand — C-010) and
system-color keywords: follow `sk-skip-link.css`'s `outline-color: Highlight;` and
`sk-data-table.css`'s `border-left-color: Canvas/CanvasText/Highlight` pattern for
selected/focus-visible, and `sk-context-nav.css`'s `GrayText` longhand `-color` technique for the
disabled cue. No `forced-color-adjust: none` anywhere in this file. T011 must use ONLY the seven
already-approved system-color keywords (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`,
`ButtonText`, `LinkText`, `GrayText`) already present in `stylelint.config.mjs`'s `ignoreValues`
array; this WP does not own `stylelint.config.mjs` and must not edit it under any circumstance
(Codex correction — see `reviews/tasks.ruling.md`), and this explicitly supersedes plan.md's
stylelint-editing suggestion on this specific point, notwithstanding the Goal section's general
"where this file and plan.md disagree, plan.md is authoritative" deference clause — Codex's binding
correction controls here. If a keyword genuinely not on this list becomes necessary, implementation
STOPS and escalates to Codex rather than widening stylelint configuration.

## T012 — Rebuild Storybook and re-run the live Playwright block to GREEN (IC-04's second rebuild, FR-002, C-001)

Because `playwright.config.ts` serves a prebuilt static Storybook with no dev server, T010/T011's
CSS changes are invisible to Playwright against the T005 build. Run
`npx nx run storybook:storybook:build` again, then re-run
`npx playwright test apps/storybook/src/tests/sk-segmented-choice.spec.ts` (both `test.describe`
blocks) and confirm every assertion from T001 and T006-T009 is GREEN, including T008's
non-colour-only delta and T009's forced-colors distinguishability. As part of this same rebuild
and re-run, re-confirm the Chromium-only source-contract block specifically: the SC-009 no-op grep
assertions and the C-001 no-`packages/elements/src/segmented-choice/` assertion must still pass
after T002-T011.

## T013 — Visual-regression baseline `test()` blocks, authored LAST (FR-012, SC-007)

Only once T012 is fully green (final, differentiated CSS state), append `test()` blocks to
`apps/storybook/src/tests/visual.spec.ts` following the existing per-component pattern in that file
(e.g. the stub/feature-card blocks it already contains), each calling
`expect(...).toHaveScreenshot('<name>.png', ...)`. One block per FR-012 state: selected, unselected,
hover, active, disabled, focus, long content, dark, light, forced-colors. Do **not** run
`--update-snapshots` locally and do not commit a locally-rendered PNG — see T018 for the CI-pull
procedure (`visual.spec.ts`'s own header comment and `docs/contributing/adding-a-component.md` §8
are binding on this point: baselines are CI-authoritative).

## T014 — `expected-stories.json` ratchet (FR-013, SC-008)

Add a `"sk-segmented-choice"` entry under `byElement` naming exactly the 13 story ids from T005
(prefix `components-sksegmentedchoice-html`), with a `$comment` line documenting the addition and
the 9-files/13-stories asymmetry (matching every existing entry's own annotation style — see the
`sk-form-select` and `sk-workflow-board` entries for the pattern). Bump `"total"` from `323` to
`336` — exactly 13, no more, no less. Do not include the generated `--docs` autodocs page in either
place. Sequenced after T005/T012 — the ratchet names the final ids, it does not invent them ahead
of the stories file.

## T015 — `using-components.md` new section (FR-001, FR-011)

Add a `## Segmented choice` section to `docs/design-system/using-components.md`, matching the depth
of the existing `## Native form select` section (line 1254): a code sample showing the consumer's
own `role="group" aria-label="…"` wrapper and `<button type="button" aria-pressed="…">` markup, the
public class names (`sk-segmented-choice`, `sk-segmented-choice__item`), and an explicit statement
of what the CSS never does (does not set/toggle `aria-pressed`, does not manage focus, does not
validate exclusivity) — the ownership boundary from spec.md's Application-ownership section. This
turns T001's docs-section assertion green.

## T016 — No-op ratchet verification (FR-014, SC-009, FR-002, C-001 — concrete, not silent)

Run and record the output of this exact grep as the WP's own evidence (not merely re-relying on
T001's automated version):

```bash
grep -rn "sk-segmented-choice\|SkSegmentedChoice" \
  expected-parts.json expected-docs.json behaviours.json mutations.json \
  packages/elements/custom-elements.json packages/react/src/
```

Confirm it returns **zero matches** (non-zero exit code from grep is the pass condition). Record
this output in the WP's implementation notes/PR description as the "confirmed, not assumed"
evidence FR-014 requires. Also confirm no `packages/elements/src/segmented-choice/` directory was
created (`ls packages/elements/src/ | grep segmented` — zero matches) and that
`apps/demo/blog-demo.html`, `apps/demo/dashboard-demo.html`, and `scripts/assemble-demo-dist.sh`
gained no reference to `segmented` (C-008/FR-016) via
`grep -rn "segmented" apps/demo/*.html scripts/assemble-demo-dist.sh` (zero matches expected).

## T017 — Full gate sweep (every applicable gate from plan.md's Gate Enumeration table; SC-010)

Run each, in order, and confirm pass before pushing:

```bash
npm run quality:stylelint                             # NFR-005
npm run quality:all                                   # ESLint incl. @nx/enforce-module-boundaries,
                                                        # stylelint, htmlhint (9 exemplars)
node scripts/build-styles-only-markup.mjs --check      # NFR-006/C-002
npx nx run styles:lint
npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js   # NFR-001/SC-001/SC-002
npx playwright test apps/storybook/src/tests/sk-segmented-choice.spec.ts    # FR-007/FR-008/FR-009/SC-003
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
bash scripts/assemble-demo-dist.sh                     # confirm no-op, C-008/FR-016
```

Also confirm (already run at T016): `expected-parts.json`, `expected-docs.json`,
`behaviours.json`, `mutations.json`, `packages/elements/custom-elements.json`,
`packages/react/src/` each grep-clean of `sk-segmented-choice`/`SkSegmentedChoice`.

## T018 — Push, expect CI visual-regression to fail by design, commit the CI-pulled baselines (two-head PR reality)

This WP's PR is expected to need **two heads**, per plan.md's Delivery contract and IC-04's binding
5-step procedure — do not treat the first CI failure as a defect to silently work around:

1. Push the initial commit(s) (T001-T017, `styles`-scoped commits per C-006) and open the PR
   against `train/elements-first`.
2. The CI `visual-regression` job (`PW_INCLUDE_VISUAL=1 npx playwright test
   apps/storybook/src/tests/visual.spec.ts --project=chromium`) is **expected to fail** on this
   first push — no baseline PNGs exist yet for the new `sk-segmented-choice` `test()` blocks added
   in T013. This is by design, not a regression to chase.
3. Do NOT run `--update-snapshots` locally and do NOT commit a locally-rendered PNG — local font
   rasterization and clipped-box dimensions differ from the `ubuntu-latest` CI runner (the stub
   component's own 312×38-local-vs-336×34-CI precedent, `visual.spec.ts`'s own header comment).
4. Once CI runs and fails, download the `visual-regression-diffs` artifact from that run.
5. Pull exactly the required baseline PNGs for `sk-segmented-choice` from that artifact and commit
   them as a **second commit**, `styles`-scoped (C-006), on the same PR/branch.
6. Because the commit changes the PR head, the Tier-C pre-merge squad's mandatory evidence-post
   (SC-011's exact-commit-SHA binding, per the charter's Review Policy) must target this **final,
   post-baseline** head — not the initial pre-baseline push. Do not let an evidence-post against
   the first push stand in for review of the second.

---

## Commit-scope authoring note (C-006 — not a subtask to execute, a rule the implementer follows)

Every commit this WP makes — CSS, exemplars, generated barrel, stories, Playwright spec, the
`using-components.md` docs edit, and the `expected-stories.json` ratchet edit — uses the
`styles` conventional-commit scope (matching the package actually changed, `packages/styles`),
per C-006 and research.md's Discrepancy #2 note (C-006's "all commits in this mission" wording
governs this implementation WP's commits, not the mission's earlier design-phase bookkeeping
commits, which used `docs(kitty-specs)`/`fix(kitty-specs)`). Do not split the docs or ratchet edit
into a separate `docs`-scoped commit.

## Definition of done

- Every gate in T017 passes.
- T016's grep evidence is recorded (zero matches across all six no-op surfaces).
- `expected-stories.json` total is exactly 336, with all and only the 13 story ids from T005 under
  `byElement.sk-segmented-choice`.
- `docs/design-system/using-components.md` carries the new `## Segmented choice` section.
- The PR's final head (post T018 baseline commit) carries the Tier-C pre-merge adversarial squad's
  evidence comment (commit SHA, per-lens verdicts, findings and dispositions) before merge
  (SC-011, C-009) — this squad gate is the squad's own separate responsibility and runs after this
  WP's subtasks are complete.
- Manual 200%-zoom validation (NFR-003, SC-005) is a Tier-C pre-merge squad gate item, run by the
  squad after T018's final push — NOT an implementer subtask (per plan.md's IC-04 Risks narrative
  and Gate Enumeration table, both cited in the Goal section, which state this assignment twice in
  near-identical language). This is a **real** desktop browser action, not a Playwright/CDP
  mechanism — no automated zoom mechanism exists in this repo (grep-confirmed zero `zoom` hits
  across every `apps/storybook/src/tests/*.spec.ts` file). Explicitly NOT satisfiable by CSS zoom,
  viewport resize (`page.setViewportSize`), device-scale override, or CDP emulation — those measure
  a resized viewport, not a real browser-zoom state. Procedure (matching the
  `docs/architecture/validation/issue-211-form-select-zoom/README.md` and
  `issue-213-work-package-detail-zoom/README.md` precedent exactly): the squad opens the built
  Storybook in an actual Chrome window, sends real `Ctrl+Shift+=` zoom keystrokes through Chrome's
  UI via X11/XTEST to reach 200%, and for each of the 13 required stories records
  `document.scrollingElement.scrollWidth` vs `document.documentElement.clientWidth` (must not
  exceed) plus a SHA-256 digest of a screenshot of each state, writing the results to
  `docs/architecture/validation/issue-270-segmented-choice-zoom/README.md`, matching the structure
  of the two precedent READMEs cited above. This README is therefore not in this WP's
  `create_intent`/`owned_files` (it is not implementer-authored output); the squad commits it
  directly onto this WP's own PR branch — landing as a further commit alongside T018's CI-pulled
  baseline-PNG commit, consistent with plan.md's Delivery contract naming this one PR/branch as
  where all of this WP's work (including the mandatory squad gate) lands — though plan.md does not
  specify a git mechanism for this particular commit as explicitly as it does for T018's 5-step
  baseline-PNG procedure, so none is invented here beyond that.
- No file under `packages/elements/`, `apps/demo/`, or any of the six no-op ratchet surfaces was
  touched.
