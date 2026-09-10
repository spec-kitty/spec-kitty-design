# Tasks: progress-indeterminate

**Input**: `plan.md`, `spec.md`, `research.md`, `data-model.md`
**Branch**: `mission/progress-indeterminate` (planning base **and** merge target — this mission
lives on its own mission branch under the `single_branch` topology it was created with; the
eventual PR onto `train/elements-first` is opened and merged per
`docs/architecture/elements-first-run-prompt.md`, not by this WP).

One work package. #306's own "Delivery" line states "one bounded Work Package and one PR," and
`plan.md`'s "Work package shape" section found no internal seam worth splitting on: the CSS rule and
its animation, the five fixtures, the generated barrel, the story exports, and the single edited
test file are all interdependent — the test file needs the fixtures to exist, the fixtures need the
CSS rule to render meaningfully, and the barrel needs both.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Author `.sk-progress--indeterminate`'s CSS rule block, `@keyframes` sweep animation, and reduced-motion override in `sk-progress.css`, token-driven throughout (FR-001, FR-002, FR-007, FR-008, NFR-001, NFR-005) | WP01 | |
| T002 | Extend `sk-progress.css`'s forced-colors block for the animated fill, measured (not assumed) across multiple animation-cycle points (FR-009) | WP01 | |
| T003 | Author the five new `.html` fixtures — indeterminate with label, without meta, with non-percentage meta, combined with `--narrow`, combined with a long label (FR-003, FR-004, FR-005, FR-006, FR-010, FR-012) | WP01 | |
| T004 | Regenerate the styles-only barrel via `build-styles-only-markup.mjs`, confirm `--check` is clean, confirm no `packages/elements/src/progress/` and no ratchet-file entry (FR-016; SC-001, SC-002, SC-012) | WP01 | |
| T005 | Extend `sk-progress-html.stories.ts` with the new indeterminate story exports (FR-015; SC-002) | WP01 | |
| T006 | `sk-progress.spec.ts` part 1 — scope the existing value/max/percentage-consistency test to determinate fixtures only; add the indeterminate no-value / non-percentage-meta consistency check (FR-005, FR-011, FR-014; SC-009, SC-010) | WP01 | |
| T007 | `sk-progress.spec.ts` part 2 — accessibility-tree assertions: native role, accessible name from the label, `.position === -1`, zero invented ARIA (FR-004, FR-006; NFR-002; SC-003, SC-004) | WP01 | |
| T008 | `sk-progress.spec.ts` part 3 — reduced-motion frozen-frame assertion (animation stopped; frame distinct from Complete and Zero); multi-sample forced-colors assertion (FR-008, FR-009; SC-005, SC-006) | WP01 | |
| T009 | `sk-progress.spec.ts` part 4 — narrow/long-label no-overflow assertions; CSS `content:`-literal source guard (the R-07 substitute for a component-scoped #286 test) (NFR-004; SC-007) | WP01 | |
| T010 | Documentation: extend `sk-progress.css`'s header comment with the indeterminate markup shape and a link to `spec.md`'s Cross-Mission Decision section; extend `docs/design-system/using-components.md`'s `sk-progress` entry if one exists (FR-project docs) | WP01 | |
| T011 | Run the full local gate matrix (chromium+firefox), confirm zero determinate-fixture regression, confirm `git grep` shows no new `:host`/`::slotted`/`container-type`/`::part` in `sk-progress.css`, commit every generated artifact (SC-010, SC-011, SC-013) | WP01 | |
| T012 | Rebase onto the current branch tip / `train/elements-first` head, rerun the full gate matrix, push, and confirm the CI `playwright` job is green across all three engines and the chromium `visual-regression` baseline is accepted before presenting the mission as review-ready (SC-008, SC-014) | WP01 | |

No `[P]` markers: T002 depends on T001 (same file, same rule block). T003 can start once T001 exists
enough to render against meaningfully, but is sequenced after T001/T002 here since the fixtures are
what the CSS is authored against in practice for this kind of visual component — either order works,
but the sequencing below assumes CSS-first, matching `plan.md`'s own "Markup and generation flow."
T004 depends on T003 (fixtures must exist). T005 depends on T004 (imports the generated barrel).
T006–T009 all edit the same file (`sk-progress.spec.ts`) and depend on T005 (a built Storybook to
test against). T010 can start once T001/T002/T003 are stable. T011/T012 depend on everything before
them. There is no pair of subtasks here safe to run as two independent diffs.

## Work Packages

### WP01 — `.sk-progress--indeterminate`: accessible unknown-duration activity over the existing progress family

- **Goal**: `packages/styles/src/progress/sk-progress.css` gains a `.sk-progress--indeterminate`
  modifier — an authored, token-driven `@keyframes` animation on the existing vendor pseudo-element
  surface, reduced-motion-guarded to a visibly-present-but-stopped frame, forced-colors-legible
  across the animation cycle. Five new fixtures render a valueless `<progress>` in the same
  three-flat-children shape #210 established, with `__meta` optional and never asserting a
  percentage. The existing determinate contract, fixtures, stories, and tests are unchanged. The
  package's own generated barrel and export wiring are regenerated and verified clean. No custom
  element, no shadow root, no shared primitive with `sk-button`/#305, no ADR-15 dependency.
- **Priority**: P1 — this mission's entire outcome (spec.md User Stories 1-4); every other story is
  a property the same markup and CSS must keep under a different condition.
- **Independent test**: `node scripts/build-styles-only-markup.mjs --check` passes on a clean tree;
  `git ls-files packages/elements/src` still shows no `progress` directory; `git grep -nE
  ':host|::slotted|container-type|::part' packages/styles/src/progress/sk-progress.css` returns
  nothing; `npx playwright test apps/storybook/src/tests/sk-progress.spec.ts --project=chromium
  --project=firefox` passes locally, and the same file passes on all three engines in CI's
  `playwright` job; `node scripts/run-axe-storybook.js` reports zero violations across every story
  this WP adds; the chromium `visual-regression` job accepts the new baselines;
  `git diff --exit-code -- packages/styles/src/progress/sk-progress-*.html` (the pre-existing
  determinate fixtures) and the determinate portion of `sk-progress.spec.ts`'s results are both
  unchanged from before this WP.
- **Included subtasks**: T001–T012.
- **Dependencies**: none — spec.md's C-006 confirms (by measurement, not assumption) independence
  from #301/ADR-15, and this WP depends only on #210's already-shipped `packages/styles/src/progress/`
  foundation, already present on `train/elements-first`.
- **Estimated prompt size**: ~450–550 lines (twelve subtasks, several with substantial CSS/animation
  and test detail per `plan.md`'s CSS strategy and Test-file strategy sections).
- **Risks**: `research.md`'s two carried-forward execution risks — the exact cross-engine keyframe
  shape is not yet measured against real Chromium/Firefox/WebKit rendering (R-05), and forced-colors
  legibility of an *animated* fill has no exact repository precedent to copy from, only a static-fill
  one (R-06). Both are resolved by this WP's own cross-browser gate run (T011/T012) and the
  multi-sample forced-colors test (T008), not by inventing a new measurement mechanism.

## Parallelization

None within this WP, and none across WPs — there is only one.

## MVP scope

The whole work package. `plan.md`'s "Work package shape" section states this is one cohesive,
PR-sized unit: the CSS rule, its animation, the fixtures, the story exports, the documentation, and
the test-file edit are one change, not a sequence of independently mergeable slices.

## Notes on requirements not separately tasked

- **FR-011** (determinate contract unchanged) and **C-003** (no indeterminate-to-determinate
  transition) are properties every subtask observes by construction — verified negatively by T011's
  before/after diff, not by a positive authoring subtask.
- **C-001** (no custom element) and **C-004**/**C-005** (no shared cue primitive with `sk-button`,
  no general-purpose spinner) are scope boundaries every subtask in T001–T005 observes by
  construction; T011's gate-matrix run confirms no ratchet file gained an entry as the mechanical
  check, and this WP simply never authors a second consumer of any new class or element it creates.
- **C-002** (no arithmetic, no state, no timers, no JavaScript) is verified negatively by T006's
  source-level "no `value` attribute" assertion and T009's `content:`-literal guard — there is no
  positive subtask for "not writing JavaScript."
- **C-009** (no new token category absent a demonstrated gap) constrains T001/T002's token choices;
  `research.md` confirms the existing `--sk-motion-*` and surface/accent token families already
  cover this component's needs. If implementation nonetheless finds a genuine gap, that is a
  deviation requiring the maintainer sign-off the charter's Branch Strategy already requires, not
  something this task list pre-authorizes.
- **The Cross-Mission Decision (spec.md, research.md R-00)** requires no subtask of its own — it is
  a ruling already made and recorded during the design phase, not an implementation action. This
  WP's only obligation toward it is C-004/C-005 above: build nothing that could later be mistaken
  for a shared primitive.
