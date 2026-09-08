# Tasks: Work Explorer segmented-choice styles

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`
**Planning base / merge target**: `train/elements-first`; topology `lanes` (`meta.json`) — the WP
cuts its own lane branch from `train/elements-first` at `/spec-kitty.implement` time, and its
single PR targets `train/elements-first`, never `main` (C-007).

## Work-package topology

Exactly one work package and one PR (C-007). `sk-segmented-choice` is one styles-only public
surface: the authored CSS, the 9 HTML exemplars, the generated barrel, the Storybook stories, the
Playwright spec, the visual-regression baselines, the `expected-stories.json` ratchet entry and
the `using-components.md` section must land together — none is independently releasable without
exposing either an incomplete or unverified contract (plan.md's Summary and Delivery contract).
The generation pipeline itself enforces this: `scripts/build-styles-only-markup.mjs` does not let
"author the CSS" and "author the fixtures" land as two separately meaningful commits — it needs
both to exist before it produces a non-empty barrel, and the stories file and Playwright spec both
need that generated barrel's exports to render or import from (plan.md's IC-02 Sequencing/depends-on).

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Author the red-first, Chromium-only source-contract Playwright block asserting styles-only absence from element/wrapper/behavior/mutation surfaces and confirming it fails before any component code exists (SC-009, FR-014, FR-010, FR-002, C-001, C-002). | WP01 | No |
| T002 | Author the 9 hand-authored `.html` exemplars covering selection state, item count, long labels, no-selection and disabled combinations (FR-006, FR-010, FR-001, C-001, C-002, C-003). | WP01 | No |
| T003 | Generate `index.ts` via `build-styles-only-markup.mjs` from the 9 exemplars and confirm `--check` passes (FR-010, NFR-006, C-002). | WP01 | No |
| T004 | Author the minimal/undifferentiated first-pass CSS — structural layout only, no state-distinguishing declarations yet (IC-01 part 1). | WP01 | No |
| T005 | Author the first-pass Storybook stories file (all 13 exports) and run the first Storybook build so story ids exist for Playwright (IC-05). | WP01 | No |
| T006 | Add the live Playwright block asserting native button role/accessible name/group name and DOM-tab order across all 13 stories (FR-007). | WP01 | No |
| T007 | Extend the live block with Enter/Space activation, truthful `aria-pressed` per fixture, and disabled-button tab-exclusion assertions (FR-004, FR-008). | WP01 | No |
| T008 | Add the separately named FR-003 assertion comparing a pressed item's computed style (border/font-weight/shape) against an unpressed sibling's, not colour alone. | WP01 | No |
| T009 | Extend the live block with hover/active/focus-visible deltas, per-story axe-core, zoom-overflow, forced-colors-emulation, and 44px narrow-viewport assertions, then run the full block and confirm it fails for the right reason against T004's undifferentiated CSS (FR-009). | WP01 | No |
| T010 | Land the pressed/hover/active/focus-visible/disabled distinguishing CSS declarations and the scoped 44px narrow-viewport rule (IC-01 part 2). | WP01 | No |
| T011 | Land the `forced-colors: active` block covering selected, focus-visible and disabled indicators via longhand `-color` system-color keywords (IC-03). | WP01 | No |
| T012 | Rebuild Storybook (static-serving requires a second rebuild) and re-run the full Playwright spec, including the source-contract block, until every assertion is green (IC-04's second rebuild, FR-002, C-001). | WP01 | No |
| T013 | Author the visual-regression `test()` blocks in `visual.spec.ts` last, against the final differentiated CSS state, without locally updating snapshots (FR-012, SC-007). | WP01 | No |
| T014 | Add the `sk-segmented-choice` `expected-stories.json` entry naming all 13 story ids and bump `total` from 323 to 336 (FR-013, SC-008). | WP01 | No |
| T015 | Add the `## Segmented choice` section to `using-components.md` documenting the public contract and ownership boundary (FR-001, FR-011). | WP01 | No |
| T016 | Run and record the concrete grep evidence that no ratchet/manifest/demo surface gained a `sk-segmented-choice`/`SkSegmentedChoice` or `segmented` reference (FR-014, SC-009, FR-002, C-001). | WP01 | No |
| T017 | Run the full gate sweep from plan.md's Gate Enumeration table (stylelint, htmlhint, generator `--check`, ESLint boundaries, Storybook+axe, Playwright spec, theme-wrapper check, demo-dist assembly) and confirm all pass before pushing (SC-010). | WP01 | No |
| T018 | Push, let the CI visual-regression job fail by design on the first head (no baselines yet), pull the required baseline PNGs from the `visual-regression-diffs` artifact, and commit them as a second, `styles`-scoped head. | WP01 | No |

No `[P]` task exists. WP01's own "Execution order — binding, do not reorder" section states this
is the real dependency order plan.md's Implementation Concern Map works out: T004 needs T002's
fixtures to render against; T005 needs T003's generated barrel; T006-T009 need a built Storybook
from T005; T010-T011 need T006-T009's red checkpoint to target; T012 needs a second Storybook
rebuild before it can observe T010-T011's CSS; T013 needs T012's final, differentiated CSS state;
T014-T016 need T005/T012's final story ids and green state; T017 needs everything before it; T018
needs T017's clean gate sweep. There is no pair of subtasks here safe to run as two independent
diffs.

## Work Package

### WP01 — Segmented-choice styles-only component (CSS, exemplars, stories, Playwright, ratchets, docs)

- **Goal**: ship `sk-segmented-choice`, a styles-only CSS class family in `@spec-kitty/styles`
  (`packages/styles/src/segmented-choice/`) that lets a Team Kitty consumer wrap
  consumer-owned `<button type="button" aria-pressed="…">` elements and render them as one
  visually coherent, accessibly distinct segmented control — no custom element, no
  `packages/elements/` directory, no JS, no ARIA authored by the library (plan.md's Summary;
  spec.md FR-001/FR-002/FR-010; C-001/C-002).
- **Priority**: P1 — the complete outcome of issue #270 and the only reason this mission exists.
- **Independent test**: the full Playwright spec (`sk-segmented-choice.spec.ts`, both the
  source-contract and live blocks) passes; all 13 required stories build, load without console
  errors and score zero axe violations; the CI-authoritative visual-regression baselines pass;
  `build-styles-only-markup.mjs --check` and every other gate in T017 pass; `expected-stories.json`
  is at exactly 336; and the six no-op ratchet/manifest surfaces plus the demo pages remain
  grep-clean of any `sk-segmented-choice`/`SkSegmentedChoice`/`segmented` reference.
- **Included subtasks**: T001–T018.
- **Dependencies**: none — spec.md's "Dependencies and parallelization" section states this
  mission depends only on the existing styles/tokens foundation already on `train/elements-first`
  and is independent of the epic's other Wave-1 children (TKX2–TKX4), free to run in parallel with
  them.
- **Risks**: base-state token reuse is precedent-only, not forced-colors precedent — the
  forced-colors block (T011) is verified live, not assumed from source (plan.md IC-01 Risks).
  Getting the 44px narrow-viewport minimum without inflating default density needs a
  viewport-scoped rule, verified live at exactly 1024px rather than assumed (plan.md IC-01 Risks).
  A background-painted forced-colors cue frozen with `forced-color-adjust: none` is the exact trap
  NFR-004 and IC-03 name; this WP commits to border/outline-drawn cues only (plan.md IC-03 Risks).
  The 200%-zoom overflow check has no automated Playwright mechanism in this repo (zero `zoom`
  hits, grep-confirmed) and is discharged as the manual Tier-C squad deliverable described below,
  not as an implementer subtask (plan.md IC-04 Risks).

## Requirement and invariant coverage

WP01's own frontmatter `requirement_refs` maps all of FR-001–FR-016, NFR-001–NFR-006 and
C-001–C-010 onto this single work package; the per-task headings above cite the specific ids each
task discharges (T001–T018, cited in the Subtask Index and reproduced from WP01's own tasks-review
fix-round tagging).

Several requirements are structural or negative properties rather than a dedicated task:

- **FR-002** (no custom element, no owned semantics beyond styling) and **C-001** (no custom
  element) are properties of what T004/T010/T011 do *not* author — verified negatively by T001's
  and T016's grep assertions that no `packages/elements/src/segmented-choice/` directory and no
  manifest/behaviour/mutation entry exist, not by a positive subtask for "not registering a custom
  element."
- **spec.md's Non-goals section** — tabs, tab panels, `radiogroup`, select replacement,
  navigation/router binding, item arrays, keyboard roving, automatic exclusivity, counts, badges,
  filter logic, persistence, animation conveying state, or a registered `sk-segmented-choice`
  element — names things NO subtask in T001–T018 implements. This is verified the same way as
  FR-002/C-001 above: by T001's and T017's grep/gate evidence that no such surface was added, not
  by a positive "confirm we didn't build tabs" subtask.
- **C-008/FR-016** (no `apps/demo/*.html` change) is confirmed by T016's grep pass
  (`grep -rn "segmented" apps/demo/*.html scripts/assemble-demo-dist.sh`), not by a subtask that
  edits those files.
- **C-006** (conventional-commit scope) and **C-009** (Tier-C pre-merge squad gate) are authoring
  and process rules the implementer follows across every commit and at PR delivery, not tasks with
  their own numbered step — see WP01's own "Commit-scope authoring note" and Definition of done.

## Manual 200%-zoom validation (NFR-003, SC-005) is Tier-C squad work, not a WP01 subtask

WP01's own Execution order note and Definition of done are explicit that the manual 200%-zoom
validation is **not** part of the T001–T018 numbered sequence. No automated zoom mechanism exists
in this repo (grep-confirmed zero `zoom` hits across every `apps/storybook/src/tests/*.spec.ts`
file); per plan.md's IC-04 Risks narrative and Gate Enumeration table, this is Tier-C pre-merge
squad work, run after T018's final push: the squad opens the built Storybook in a real Chrome
window, sends genuine `Ctrl+Shift+=` zoom keystrokes via X11/XTEST to reach 200%, and records
`scrollWidth`-vs-`clientWidth` measurements plus SHA-256 screenshot digests for each of the 13
required stories in `docs/architecture/validation/issue-270-segmented-choice-zoom/README.md`,
matching the `issue-211-form-select-zoom` / `issue-213-work-package-detail-zoom` precedent. This
tasks.md file states the same assignment WP01 already states, so the two documents do not
contradict each other by omission.

## MVP scope

The whole work package. plan.md's Delivery contract and Summary are explicit that this is one
cohesive, PR-sized unit — the CSS, the exemplars, the generated barrel, the stories, the
Playwright spec, the visual-regression baselines, the ratchet entry and the docs section are one
change, not a sequence of independently mergeable slices. There is no styles-only single surface
to split further without cutting across the barrel generator's own single-artifact dependency
(plan.md's IC-02 Sequencing/depends-on).
