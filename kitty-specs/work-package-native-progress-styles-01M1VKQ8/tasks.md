# Tasks: work-package-native-progress-styles

**Input**: `plan.md`, `spec.md`, `research.md`, `data-model.md`
**Branch**: `mission/work-package-native-progress-styles` (planning base **and** merge target — this
mission lives on its own mission branch under the `single_branch` topology it was created with;
the eventual PR onto `train/elements-first` is opened and merged per
`docs/architecture/elements-first-run-prompt.md`, not by this WP).

One work package. `plan.md`'s own "Work package shape" section states the reason directly: the
mission's spec records independence from every other `#208` child (C-007), the CSS and the
fixtures form one self-contained surface with no composition target, and the barrel generator
itself does not allow "author the CSS" and "author the fixtures" to land as separate, individually
meaningful commits — it needs both to exist before it produces a non-empty barrel, and the
Playwright spec needs the generated barrel to render from. Ten subtasks sits at this workflow's
stated maximum for one WP; splitting further would cut across that single generator dependency
rather than along it.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Author the eight determinate-state/modifier `.html` fixtures under `packages/styles/src/progress/` — zero, T10 5-of-8, complete, large-total, long-label, compact, narrow, forced-colors — each the exact three-part `div.sk-progress > label[for] + progress[id][value][max] + span` structure (FR-001, FR-002, FR-003, FR-005, FR-006) | WP01 | |
| T002 | Generate the styles-only barrel via `build-styles-only-markup.mjs`, confirm auto-discovery (no generator code change), wire `packages/styles/src/index.ts` and `packages/styles/package.json`'s `exports` map, and confirm no `packages/elements/src/progress/` exists (FR-012, FR-013; SC-001, SC-008, SC-010) | WP01 | |
| T003 | Author `sk-progress.css` base rules: `appearance: none` reset, track border/background, the three vendor fill pseudo-elements, label/meta typography — all token-referenced (FR-004, FR-008 partial, NFR-001) | WP01 | |
| T004 | Extend `sk-progress.css`: `--compact`/`--narrow` layout modifiers, the forced-colors fill override, and (only if a fill transition is authored) the scoped reduced-motion guard (FR-007, FR-008, FR-009, FR-010, NFR-001) | WP01 | |
| T005 | Author `sk-progress-html.stories.ts`: `Default`/`Zero`/`Complete`/`LargeTotal`/`LongLabel`/`Compact`/`Narrow`/`ForcedColors`/`LightMode` (FR-011; SC-002) | WP01 | |
| T006 | Add the `sk-progress` section to `docs/design-system/using-components.md` (FR-014) | WP01 | |
| T007 | `sk-progress.spec.ts` part 1 — accessibility-tree role/name/value/min/max, zero-`aria-*` assertion, static no-`content`/`counter()` assertion, layout-modifier structural-preservation assertion, meta/value raw-numerator consistency across every fixture (FR-003, FR-004, FR-005; NFR-004; SC-003, SC-007) | WP01 | |
| T008 | `sk-progress.spec.ts` part 2 — narrow/zoom no-overflow assertions, `forced-colors: active` legibility assertions, reduced-motion static-source assertion; add the `sk-progress` baseline set to `visual.spec.ts` (FR-009, FR-010; NFR-003; SC-005, SC-006) | WP01 | |
| T009 | Run the full regeneration + gate matrix from `plan.md`, commit every generated artifact, confirm a clean tree and that `apps/demo/dashboard-demo.html` has no diff (SC-002, SC-004, SC-009, SC-012; C-001–C-007) | WP01 | |
| T010 | Immediately before the pre-merge adversarial gate: rebase onto the current branch tip, regenerate in dependency order, rerun the full gate matrix against the new head, reconcile the CI-authoritative visual baseline | WP01 | |

No `[P]` markers: T003 depends on T001 (fixtures to render against while authoring), T004 depends
on T003 (same file, additive rules), T005 depends on T002 and T004 (imports the generated barrel
and the finished CSS), T006 can start once T004's contract is stable, T007/T008 depend on T005 (a
built Storybook to test against), and T009/T010 depend on everything before them. There is no pair
of subtasks here that is safe to run as two independent diffs — every one after T001 either edits
the one CSS file its predecessor just edited, or renders/tests output the CSS and barrel steps
produce.

## Work Packages

### WP01 — `sk-progress`: accessible completion over a native `<progress>`, styles-only

- **Goal**: `packages/styles/src/progress/` exists with `sk-progress.css`, eight authored `.html`
  fixtures, and a **generated** `index.ts` barrel; `packages/styles/src/index.ts` and
  `packages/styles/package.json` export it; `packages/elements/src/progress/` does not exist and no
  ratchet file (`expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`)
  gains an entry. The rendered fixtures present a native, labelled `<progress>` whose role, name,
  and `aria-valuenow`/`valuemin`/`valuemax` derive entirely from the browser and the fixture's own
  `label[for]`/`progress[id][value][max]` — no ARIA authored anywhere. Two layout modifiers
  (`--compact`, `--narrow`) change only CSS layout. The track and fill remain distinguishable under
  `forced-colors: active`, without relying on hue alone, and any authored fill transition is
  reduced-motion-guarded. `apps/demo/dashboard-demo.html` is untouched.
- **Priority**: P1 — this mission's entire outcome (spec.md User Story 1); every other story is a
  property the same markup and CSS must keep under a different condition.
- **Independent test**: `node scripts/build-styles-only-markup.mjs --check` passes on a clean tree;
  `git ls-files packages/elements/src` shows no `progress` directory; `npx playwright test
  apps/storybook/src/tests/sk-progress.spec.ts` passes across all three configured engines;
  `node scripts/run-axe-storybook.js` reports zero violations across every story this WP adds;
  `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts` passes (subject
  to CI re-capture per `adding-a-component.md`'s "Visual baseline" rule); `git diff --exit-code --
  apps/demo/dashboard-demo.html` is empty.
- **Included subtasks**: T001–T010.
- **Dependencies**: none — spec.md's C-007 states this mission is independent of every other `#208`
  child, and this WP depends only on the existing tokens/styles foundation already on
  `train/elements-first`.
- **Estimated prompt size**: ~550–650 lines (10 subtasks, several with substantial CSS/test detail
  per `plan.md`'s CSS strategy and Accessibility/overflow observables sections).
- **Risks**: `research.md`'s two carried-forward execution risks — the forced-colors fill override
  is pattern-following from `sk-skip-link`/`sk-data-table` but not yet measured against a real
  `<progress>`'s vendor pseudo-elements specifically, and WebKit coverage of
  `::-webkit-progress-bar`/`::-webkit-progress-value` is locally unverified in this environment.
  Both are resolved by the cross-browser Playwright gate (T009) and the CI-authoritative visual
  baseline (T009/T010), not by inventing a new measurement step.

## Parallelization

None within this WP (see the Subtask Index note on why no pair is `[P]`), and none across WPs —
there is only one.

## MVP scope

The whole work package. `plan.md`'s "Work package shape" section is explicit that this is one
cohesive, PR-sized unit: the CSS, the fixtures, the story, the documentation, and the verification
spec are one change, not a sequence of independently mergeable slices.

## Notes on requirements not separately tasked

- **FR-002** and **C-002** (no arithmetic, no state, no timers, no JavaScript) are properties of
  what T001/T003/T004 do *not* author, verified negatively by T007's static-source assertion — there
  is no positive subtask for "not writing JavaScript."
- **C-001** (no custom element) and **C-003** (no indeterminate/stepper/task-data/animation/status-
  tone) are scope boundaries every subtask in T001–T006 observes by construction; T009's gate matrix
  run confirms no ratchet file gained an entry as the mechanical check.
- **C-004** (no new token category absent a demonstrated gap) constrains T003/T004's token choices;
  `research.md` R-08 already confirms the existing surface/foreground/accent families cover this
  component, so no subtask adds a token. If implementation nonetheless finds a genuine gap, that is
  a deviation requiring the maintainer sign-off the charter's Branch Strategy already requires, not
  something this task list pre-authorizes.
- **C-005** (demo page untouched) and **C-006** (`LightMode` uses `class="sk-light"`) are asserted
  in T009 (`git diff --exit-code -- apps/demo/dashboard-demo.html`) and by
  `check-story-theme-wrapper.mjs`, already in T009's gate matrix — no separate subtask authors a
  check that already exists repo-wide.
- **The spec's Edge Cases section** ("fallback content vs. visible metadata are two different
  texts", "a fixture's visible metadata must not silently drift", "large numerals in a compact or
  narrow arrangement", "a component that owns no state has no changing value to test live") are
  covered respectively by T001's authoring discipline, T007's meta/value consistency check, T001's
  large-total fixture combined with T004's modifiers (verified visually via T009's visual baseline
  rather than a bespoke geometry assertion, since no numeral-width assumption exists in the CSS to
  test), and the fact that no subtask here introduces a live value mutation.
