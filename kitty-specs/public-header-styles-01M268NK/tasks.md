# Tasks: public-header-styles

**Input**: `plan.md`, `spec.md`, `research.md`, `data-model.md`
**Branch**: `mission/public-header-styles` (planning base **and** merge target — this mission lives
on its own mission branch under the `single_branch` topology it was created with; the eventual PR
onto `train/elements-first` is opened and merged per
`docs/architecture/elements-first-run-prompt.md`, not by this WP).

One work package. Issue #353's own "Delivery" line states "one bounded Work Package and one PR,"
and `plan.md` §8 ("Work-package shape — one WP, one PR") gives five independent reasons no internal
seam survives a split: the generated barrel (`index.ts`) is regenerated from *every* `.html`
fixture in the directory and `--check`-compared whole; `expected-stories.json`'s `total` is a single
exact-equality invariant that two WPs editing it would collide on; the Playwright spec's
source-contract block asserts the CSS file's *exact* selector inventory, which is only true once the
CSS is final; the visual baselines can only be harvested from a CI run of the finished stories, so a
"WP-02: visual baselines" could only start after WP-01 already merged; and the whole diff is ~11 new
files plus 6 small edits — splitting it buys coordination cost with no review benefit. This plan
does not propose a split.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Author `sk-public-header.css` — the six-class anatomy (`sk-public-header`, `__inner`, `__brand`, `__brand-context`, `__actions`, `__action`), the flex-wrap row with logical properties only, the focus-visible and `aria-current` cues, the resolved 44px floor on `.sk-public-header__action`, the `border-block-end` boundary, and the forced-colours block (FR-001, FR-002, FR-003, FR-005, FR-007, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, C-001, C-002, C-004, C-007, C-009, NFR-001) | WP01 | |
| T002 | Add the `public-header` branch to `scripts/build-styles-only-markup.mjs`'s `adrNote` ternary (`: name === 'public-header' ? 'See #353.' : …`), mirroring the existing `segmented-choice` branch — **must land before T004 regenerates the barrel** (FR-019) | WP01 | |
| T003 | Author the eight authored `.html` fixtures — brand-only, one-action, two-actions (Family 6 shape), many-actions, long-labels, current-action, mixed-controls, theme-slot — each a real, consumer-authored `<header>`/`<a>`/`<nav>` tree with no `data-od-id` scaffolding copied from the corpus (FR-004, FR-005, FR-006, FR-009, C-003) | WP01 | |
| T004 | Regenerate `packages/styles/src/public-header/index.ts` via `node scripts/build-styles-only-markup.mjs`, confirm `--check` exits 0, confirm no `packages/elements/src/public-header/` directory exists (FR-019, NFR-010, C-008, SC-001) | WP01 | |
| T005 | Wire the distribution surface: one line in `packages/styles/src/index.ts` (`export * from './public-header/index';`) and one `exports` entry in `packages/styles/package.json` (`"./public-header/*": "./dist/public-header/*"`) — **no repository gate catches an omission here** (FR-009, FR-019) | WP01 | |
| T006 | Author `sk-public-header-html.stories.ts` with the thirteen required story exports (`Default`, `BrandOnly`, `OneAction`, `ManyActions`, `LongLabels`, `CurrentAction`, `MixedControls`, `ThemeToggleComposition`, `Narrow`, `ShortViewport`, `Rtl`, `ForcedColors`, `LightMode`), rendering only from the generated barrel, with `ThemeToggleComposition`'s docs string stating plainly it is blocked on #323 (FR-017, NFR-002, SC-010, SC-011) | WP01 | |
| T007 | Add `expected-stories.json`'s new `byElement["sk-public-header"]` array and move `total` 505 → 518, reading the thirteen story ids off the **built** `apps/storybook/storybook-static/index.json` rather than hand-deriving them (NFR-011, SC-006) | WP01 | |
| T008 | `sk-public-header.spec.ts` part 1 — the chromium-only source/distribution-contract `describe` block: exact six-class selector inventory; absence of `.sk-button*`, `sk-theme-toggle`, `::part(`, `:host`, `.sk-light`/`data-theme`/`:root`, `[dir="rtl"]`, physical left/right properties, `order`/`*-reverse`, `display:none`/`visibility:hidden`/clip on action text, `position: sticky|fixed`, literal `44px`, and `transition`/`animation`; every system-colour keyword scoped inside `@media (forced-colors: active)`; `check-component-token-literals.mjs` exits clean; the eight fixtures generate exactly eight barrel exports with no `role=`/`tabindex=`/custom tag/`data-od-id`; the `index.ts`/`package.json` wiring from T005; absence from `packages/elements/src`, `packages/react/src`, `custom-elements.json`, `vue.d.ts`, `expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`; `expected-stories.json` equality; the `## Public header` doc section's token list equalling the sheet's actual `var(--sk-*)` set (FR-007, FR-009, FR-010, FR-016, FR-018, FR-019, FR-020, C-001, C-002, C-003, C-004, C-007, C-009, NFR-001, NFR-011, SC-008, SC-009, SC-013) | WP01 | |
| T009 | `sk-public-header.spec.ts` part 2 — accessibility-tree `describe` block: exactly one `banner` role per story; `navigation` present **iff** an action region exists, always with a non-empty accessible name; brand-only exposes zero `navigation` roles; DOM order equals Tab focus order, via a Chromium CDP `Accessibility.getPartialAXTree` snapshot in the `sk-context-nav.spec.ts` idiom (FR-001, FR-004, NFR-006) | WP01 | |
| T010 | `sk-public-header.spec.ts` part 3 — target-size, root-overflow, and clipped-focus `describe` block: `.sk-public-header__action`'s `getBoundingClientRect()` ≥ 44×44 at 390px and 1440px **plus** a non-vacuous set-equality assertion between `.sk-public-header__actions > *` and `.sk-public-header__action` in every action-bearing fixture (the R-01 guard against a passing-on-nothing floor); `scrollWidth <= clientWidth` at 390×720, 1440×900, a 200%-zoom emulation, and a short viewport; the `focusVisibility()` helper shape confirming no focused control is clipped at 390px/1440px (FR-014, FR-015, NFR-003, NFR-004, NFR-005) | WP01 | |
| T011 | `sk-public-header.spec.ts` part 4 — forced-colours, no-colour-alone, and reduced-motion `describe` block: under `forced-colors: active` the header's `border-block-end` and every focus-visible outline stay non-`none`; rest/hover/active/focus-visible/`aria-current` produce five distinct non-colour cue signatures and `aria-current="false"` styles identically to no attribute; under `reduced-motion: reduce`, `transitionDuration === '0s'` and `animationName === 'none'` on the header/inner-row/brand boxes only — **never** on `.sk-public-header__action`, which may carry a composed `.sk-button`'s own transition (FR-012, FR-013, NFR-007, NFR-008) | WP01 | |
| T012 | `sk-public-header.spec.ts` part 5 — RTL, LightMode, and zero-actions `describe` block: with `dir="rtl"` the brand sits at the inline start with no `[dir="rtl"]` rule in the sheet and no layout property changed; a real `.sk-light` ancestor produces at least one differing computed value from the dark story; brand-only renders no `<nav>` element at all and no empty landmark (FR-004, FR-010, FR-011) | WP01 | |
| T013 | Author the `## Public header` section of `docs/design-system/using-components.md`: the six anatomy classes, the three consumer obligations (non-empty `aria-label`, exactly one header per document, applying `.sk-public-header__action` to every action), `aria-current` usage, the #323 deferral, which ADR-10 rationale governs (not the class ruling), and the four near-neighbours this family restates none of (`sk-app-shell`, `sk-page-header`, `sk-nav-pill`, `sk-skip-link`) (FR-018, FR-020, SC-007) | WP01 | |
| T014 | Add the two `toHaveScreenshot` tests (dark-default, `LightMode`) to `apps/storybook/src/tests/visual.spec.ts` in the `contextNavVisuals` shape; push with no local PNG; once CI runs, harvest both PNGs from the run's `visual-regression-diffs` artifact and commit them — **never** a local `--update-snapshots` (NFR-009, SC-005) | WP01 | |
| T015 | Run the full local gate matrix: `npm ci --ignore-scripts`; `npx nx run tokens:build && npx nx run tokens:catalogue`; `node scripts/build-styles-only-markup.mjs --check`; `npm run quality:all`; `node scripts/check-component-token-literals.mjs packages/styles/src/public-header/sk-public-header.css`; `node scripts/typecheck-all.mjs`; `npx nx run storybook:storybook:build --skip-nx-cache`; `node scripts/run-axe-storybook.js`; `npx playwright test` (all three engines this host can run); `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium`; `node scripts/check-gate-wiring.mjs --selftest && node scripts/check-gate-wiring.mjs`; `node scripts/check-story-theme-wrapper.mjs --selftest && node scripts/check-story-theme-wrapper.mjs`; confirm `git status --porcelain` is empty after `git add -A` (SC-001, SC-002, SC-003, SC-004, SC-006, SC-008, SC-009, SC-012, SC-013) | WP01 | |
| T016 | Confirm the checkout under test is this mission's own Storybook build (not a sibling's on port 6006), rebase onto the current `mission/public-header-styles` tip (and `train/elements-first`'s head if it has moved since dispatch), rerun the full gate matrix against the new head, push, confirm CI's `storybook-build`/`a11y`/`playwright`/`visual-regression` jobs all report **run**, not **skipped**, confirm the visual baselines CI accepted are the ones harvested in T014, and re-run the pre-merge adversarial squad (issue #353's squad tier C, pre-merge, never skipped) against the final head SHA before presenting the mission as review-ready (SC-005) | WP01 | |

No `[P]` markers: every subtask after T001 depends on something before it, and nothing here is a
safe pair of independent diffs. The plan fixes three orderings explicitly and this index honours all
three: **(1)** T002 (the generator's `adrNote` branch) must land before T004 runs the generator —
running the generator first bakes the wrong ADR-10 citation into the barrel and then `--check`
reports the corrected barrel as "stale" against a file that was never wrong, which is the exact
confusion `plan.md` §2's ordering constraint exists to prevent. **(2)** the `.html` fixtures (T003)
must exist before the barrel is generated (T004) — the generator's whole input is the directory's
fixture set. **(3)** the generated barrel (T004) must exist, and the family must be importable
(T005), before the story file (T006) imports its named exports, and the story file must exist before
`expected-stories.json` (T007) can be populated with real, built story ids rather than hand-derived
guesses (R-05's named failure mode). T008–T012 all edit the same file
(`apps/storybook/src/tests/sk-public-header.spec.ts`) and are sequenced by the plan's own two-block
shape (source/distribution contract first, since it needs no rendered page; then the four live-
semantics blocks) — they could not usefully run as parallel diffs against one file. T013 (usage docs)
can start once T001–T003 are stable in substance, but is sequenced here after the Storybook/test
subtasks because T008's own source-contract assertion checks the doc's token list against the
sheet's actual token set, so the doc's content is easiest to get right last. T014 (visual baselines)
can only exist after the stories it screenshots are final. T015/T016 depend on everything before
them.

## Work Packages

### WP01 — `.sk-public-header`: styles-only native public-header family over consumer-owned identity and route actions

- **Goal**: `packages/styles/src/public-header/` gains a new styles-only family — one authored
  stylesheet (`sk-public-header.css`), eight authored HTML fixtures, a generated barrel, thirteen
  Storybook stories, a dedicated Playwright spec, two visual-regression baselines, a usage-doc
  section, and the two shared-file edits (`index.ts` export line, `package.json` exports entry) and
  one generator-script branch that make the family real, importable, and correctly cited. No custom
  element, no shadow root, no theme selector, no reach-through into `.sk-button`/`sk-theme-toggle`
  internals. The `.sk-public-header__action` composition slot carries the resolved 44px target-size
  mechanism from `spec.md`'s "Resolved decision" section — the implementer applies it, does not
  choose it.
- **Priority**: P1 — this mission's entire outcome (`spec.md` User Stories 1–6); every other story
  is a property the same anatomy must keep under a different condition (narrow width, RTL, forced
  colours, zero/one/many actions, the #323-blocked composition).
- **Independent test**: `node scripts/build-styles-only-markup.mjs --check` exits 0 on a clean tree;
  `git ls-files packages/elements/src/public-header` returns empty (SC-008); `git diff --exit-code
  -- packages/elements/custom-elements.json packages/react/src expected-docs.json` is empty (SC-009);
  `npm run quality:all` and `node scripts/check-component-token-literals.mjs
  packages/styles/src/public-header/sk-public-header.css` both exit 0 (SC-002); `node
  scripts/run-axe-storybook.js` reports zero WCAG 2.1 AA violations across every `sk-public-header`
  story id and confirms the `expected-stories.json` ratchet (SC-003, SC-006); `npx playwright test
  apps/storybook/src/tests/sk-public-header.spec.ts` passes locally against **this checkout's own**
  Storybook build (verified by port-6006 ownership, not assumed) and passes on all engines CI runs
  (SC-004); the chromium `visual-regression` job accepts the two harvested baselines (SC-005);
  `git grep -in "theme" -- packages/styles/src/public-header` returns only the
  `ThemeToggleComposition` docs string and its neutral placeholder label (SC-011); `grep -n
  '^#\+ \[NEEDS DECISION\]' kitty-specs/public-header-styles-01M268NK/spec.md` returns nothing and
  `grep -nE '\.sk-button|sk-theme-toggle|::part\(' packages/styles/src/public-header/sk-public-header.css`
  returns nothing (SC-013).
- **Included subtasks**: T001–T016.
- **Dependencies**: none — `spec.md`'s "Cross-mission / dependency" section confirms the styles
  family has no predecessor and can run fully in parallel with #354 (TKF2); the theme-toggle
  composition story is dependency-blocked on #323 but that dependency does not block this WP's own
  merge (User Story 6, T006).
- **Estimated prompt size**: large — sixteen subtasks, several (T001, T008–T012) carrying substantial
  CSS/test detail per `plan.md` §§4–9.
- **Risks**: `plan.md` §11's R-01 (the 44px floor assertion passing vacuously over an empty
  selector — guarded explicitly in T010), R-02 (a reach-through fix against `.sk-button` or a
  `.sk-button { transition: none }` rule — guarded by T008's forbidden-selector sweep), R-03 (a
  sibling mission's Storybook silently reused on port 6006 — guarded in T016 and the WP prompt's
  environment-constraints section), R-04 (locally-shot visual baselines failing CI on dimensions —
  guarded by T014's harvest-only rule), R-05 (hand-derived story ids failing the axe gate by name —
  guarded by T007 reading the built index), R-06 (`expected-stories.json`'s `total` and list edited
  out of step — T007 edits both together), R-07 (the `index.ts`/`package.json` wiring having no
  repository gate — T005 plus T008's own assertion are the only things standing between the omission
  and a silent ship), R-08 (the train moving under the branch mid-mission — T016's rebase step), R-10
  (the generator edited after it runs — T002 is explicitly sequenced before T004).

## Parallelization

None within this WP, and none across WPs — there is only one, and issue #353 mandates exactly that
shape.

## MVP scope

The whole work package. `plan.md` §8 states this is one cohesive, PR-sized unit: the CSS, the eight
fixtures, the generated barrel, the distribution wiring, the story exports, the ratchet entry, the
Playwright spec, the usage doc, and the visual baselines are one change, not a sequence of
independently mergeable slices — see the "Subtask Index" preamble above for the five reasons no
internal seam survives a split.

## Notes on requirements not separately tasked

- **FR-008** (consumer owns every string and route decision) and **C-006** (consumer-owned content
  boundary) are the same boundary restated at the FR and constraint level. Neither is authored
  positively — they are observed by never selecting a brand string, action label, `href`,
  `aria-current`/route-current state, authentication state, theme state, or translated string
  anywhere in `sk-public-header.css` or the generator/story/doc files this WP touches. T003's
  fixtures instantiate consumer content without inventing defaults for it, and T008's forbidden-
  selector sweep is the closest thing to a positive check this boundary gets.
- **C-005** (one-directional package dependency — `packages/styles` imports only `packages/tokens`)
  is verified negatively: this WP introduces no new `@import`/`import` statement of any kind beyond
  the existing token custom properties every sheet already uses. No subtask adds one; T015's lint/
  typecheck pass is what would catch a violation if one were introduced.
- **C-010** (no router, no route inference) is verified by what T003's `current-action` fixture and
  T012's RTL/zero-actions block actually do: `aria-current` is supplied by the fixture, never
  inferred by the CSS, and no subtask in this WP writes routing logic of any kind — there is no
  JavaScript in this family at all.
- **NFR-002** (zero axe violations) has no dedicated subtask because it is not a thing to author —
  it is the outcome T006's stories and T015's `run-axe-storybook.js` run either confirm or refute
  over everything else this WP builds.
