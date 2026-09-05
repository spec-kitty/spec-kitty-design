# Implementation Plan: Dashboard semantic primitives

**Mission**: `dashboard-semantic-primitives-01M1S94M` · Issue #176 · Epic #183 · tracks #125
**Branch**: `mission/dashboard-semantic-primitives` from `train/elements-first` at `dcf7af2`
(this is the mission's own target/planning/merge branch — `topology: single_branch`, no lane
worktree is minted for planning)
**Date**: 2026-09-05
**Governing spec**: [`spec.md`](./spec.md)

## Summary

Ship five **styles-layer** primitives — `.sk-facts`, `.sk-disclosure`, `.sk-data-table`,
`.sk-empty-state`, `.sk-skip-link` — as class families applied to real semantic HTML the
consumer authors (`<dl>`, `<details>`, `<table>`, a plain block, `<a href="#main">`). **No
custom element ships from this mission.** Each primitive lives at
`packages/styles/src/<name>/sk-<name>.css` with authored `.html` exemplars beside it; its
`index.ts` barrel is **generated** by the existing `scripts/build-styles-only-markup.mjs`,
which already picks up any directory with a `.css` and no matching `packages/elements/src`
directory — no generator change is needed. `packages/styles/src/index.ts` gains one
hand-written `export *` line per new directory (#156 leaves that ungated; SC-004 is this
mission's own proof, not a fix for the next one).

Two cross-cutting baselines ride along on all five: a `@media (forced-colors: active)`
treatment (FR-009 — genuinely new, `forced-colors` appears nowhere in the repo today) and a
`@media (prefers-reduced-motion: reduce)` guard on any transition this mission introduces
(FR-010 — **generalising** the one precedent that already exists at
`packages/styles/src/transition-matrix/sk-transition-matrix.css:237`, not inventing a second
convention). Both are documented in `docs/contributing/adding-a-component.md` (FR-011) so later
components inherit them.

The mission is tone-free by epic ruling (#183): no `--sk-status-*` or `--sk-chart-*` token is
invented, and none is consumed because none exists yet at `train/elements-first@dcf7af2`.

## Technical Context

**Language/Version**: CSS3 (custom properties only, token-strict) and HTML5 as authored sources;
generated TypeScript string-literal barrels (no hand-written TS in this mission)
**Primary Dependencies**: `@spec-kitty/tokens` (consumed, not modified); Storybook
`@storybook/web-components`; existing `stylelint`/`htmlhint`/axe toolchain. No dependency or
lockfile change.
**Storage**: N/A — static presentational primitives, no fetch/state/persistence/JS behaviour of
any kind
**Testing**: `stylelint` (`declaration-strict-value`, token-only), `htmlhint` on authored `.html`,
axe-core via Storybook a11y addon / `scripts/run-axe-storybook.js` (zero violations per story),
`scripts/build-styles-only-markup.mjs --check` (generated-barrel drift), `scripts/check-story-theme-wrapper.mjs`
(LightMode-wrapper ratchet). No behaviour tests — these primitives own no behaviour (ADR-11's
list is inapplicable end-to-end).
**Target Platform**: Any browser consuming `@spec-kitty/styles`; light-DOM only by design (C-001),
so no shadow-root/CEM/React-wrapper concern applies
**Project Type**: Single package addition inside the existing `packages/styles` project — five new
component directories, no new package, no `packages/elements` or `packages/react` change
**Performance Goals**: N/A — CSS only, no runtime cost. The existing charter "Storybook build < 3
min" budget applies as an umbrella gate; no new per-component performance target is introduced.
**Constraints**: Token-only CSS (stylelint `declaration-strict-value`, zero new exceptions);
light-DOM only — no `sk-*` custom element ships (C-001); tone-free — no `--sk-status-*`/
`--sk-chart-*` token exists or is invented (C-002); no JS, no sort/filter/paginate/virtualize/
select/resize (C-003); no Team Kitty/Factory Dashboard domain copy (C-004); `LightMode` stories
use `class="sk-light"`, never `data-theme` (C-005)
**Scale/Scope**: 5 new directories under `packages/styles/src/`; 5 CSS files; ~14 authored `.html`
exemplars (2-4 per primitive); 5 generated `index.ts` barrels; 5 `.stories.ts` files; 1 line added
per new directory in `packages/styles/src/index.ts` (5 lines total); 1 new doc section in
`docs/contributing/adding-a-component.md`

**Precedent copied**: `packages/styles/src/form-field/` — the only existing styles-only,
no-custom-element directory (#141/#172): authored `.css` + `.html` exemplars beside it, a
**generated** `index.ts` barrel, and an `sk-<name>-html.stories.ts` importing from that barrel.

## Charter Check

*The charter at `.kittify/charter/charter.md` predates the elements-first programme (generated
2026-05-01) and names Angular/SCSS as the primary component target. ADR-8 through ADR-13 and
`docs/architecture/elements-first-run-prompt.md` supersede that framework/testing-stack framing
for this repo's actual toolchain (Lit/TypeScript/CSS custom properties, Storybook
web-components, Vitest). The charter's quality-gate, review-policy and token obligations below
still bind and are unaffected by that supersession.*

| Obligation | Plan response |
|---|---|
| Component-done definition (Storybook story, axe zero-violation, visual review, token-dependency doc, ADR-11 behaviour list) | Each primitive gets a story with `Default`, its documented variants, and `LightMode`. axe must be zero across all of them. No ADR-11 behaviour item applies — these primitives own no behaviour (no form association, no events, no focus/keyboard handling beyond what the native elements already provide for free); this is stated explicitly as an inapplicability, not a silent skip. |
| CSS/SCSS token-only rule | `stylelint`'s `declaration-strict-value` must pass with zero new `ignoreValues`/inline exceptions. |
| Conventional commits | scope `styles`, per `commitlint.config.cjs`. |
| Adversarial squad cadence | The operator has added an explicit post-tasks point-cut for #176 (this issue declares no tier) — same treatment as #180. The pre-merge gate in the run-prompt's step 6 is separate and always runs regardless of tier. |
| One maintainer approval for component-file PRs | Applies at PR review; out of scope for planning. |
| No hardcoded token-namespace change | No `--sk-*` token is added, renamed or removed (C-002, SC-006). |

No charter exception is requested.

## Public Contract

None of the five primitives has a JS API, a property, an event, or a slot in the custom-element
sense — they are pure class families over native HTML. The "contract" is the BEM class surface
and the semantics it depends on.

### `.sk-facts` — `<dl>` / `<dt>` / `<dd>`

- `.sk-facts` (root, on the `<dl>`) — `.sk-facts--two-col` and `.sk-facts--compact` modifiers.
  Default is stacked.
- `.sk-facts__term` (on `<dt>`), `.sk-facts__value` (on `<dd>`).
- Values render verbatim: no truncation, no formatting, no count/summary derivation (FR-001).

### `.sk-disclosure` — `<details>` / `<summary>`

- `.sk-disclosure` (on `<details>`).
- `.sk-disclosure__summary` (on `<summary>`) — marker treatment is decorative and never the sole
  affordance; visible `:focus-visible` ring.
- `.sk-disclosure__body` (wraps the revealed content inside `<details>`).
- The `open` attribute is never touched by CSS logic and stays entirely the consumer's (FR-002).

### `.sk-data-table` — `<table>` / `<caption>` / `<th scope>`

- `.sk-data-table` (on `<table>`) — zebra rows, hover row highlight, column alignment via
  `.sk-data-table__cell--numeric` (tabular-nums, right-aligned), `.sk-data-table--sticky-header`
  modifier for a sticky header row.
- `.sk-data-table__scroller` — the narrow-width treatment: a wrapper around an **intact**
  `<table>` with `role="region"`, an accessible name (`aria-label` or `aria-labelledby`), and
  `tabindex="0"`, so it is keyboard-reachable and independently scrollable. Cells are never
  reflowed to blocks (FR-004, non-negotiable).

### `.sk-empty-state`

- `.sk-empty-state` (root, a plain block container) with `.sk-empty-state__heading`,
  `.sk-empty-state__body`, and one optional `.sk-empty-state__action` slot position. The
  primitive supplies no copy and no icon (FR-005).

### `.sk-skip-link`

- `.sk-skip-link` on a real `<a href="#main">`. Off-screen (not `display: none`) until
  `:focus-visible`, then visible above all content at AA contrast; `outline` is never suppressed
  (FR-006).

## Cross-cutting: forced-colors and reduced-motion

- **`@media (forced-colors: active)`** (FR-009): covers exactly three places per the issue and
  spec — the skip-link's focused state, the disclosure marker, and `.sk-data-table`'s borders.
  This is new territory (no `forced-colors` block exists anywhere in the repo), so the pattern
  established here is the one `docs/contributing/adding-a-component.md` will document for reuse.
- **`@media (prefers-reduced-motion: reduce)`** (FR-010): only `.sk-disclosure` (marker
  rotation/reveal) and `.sk-skip-link` (its off-screen → visible transition) introduce any
  transition at all; `.sk-facts`, `.sk-data-table` and `.sk-empty-state` introduce none, so they
  need no guard. The guard shape copies `sk-transition-matrix.css:237` — a media query disabling
  the specific transitioning properties, not a blanket `* { transition: none }`.

## File and Write Scope

### Authored

```text
packages/styles/src/facts/sk-facts.css
packages/styles/src/facts/*.html                    # exemplars: stacked, two-col, compact, long value/empty value
packages/styles/src/facts/sk-facts-html.stories.ts

packages/styles/src/disclosure/sk-disclosure.css
packages/styles/src/disclosure/*.html               # exemplars: closed, open, long body, nested
packages/styles/src/disclosure/sk-disclosure-html.stories.ts

packages/styles/src/data-table/sk-data-table.css
packages/styles/src/data-table/*.html               # exemplars: default+caption, sticky header, narrow-scrollable
packages/styles/src/data-table/sk-data-table-html.stories.ts

packages/styles/src/empty-state/sk-empty-state.css
packages/styles/src/empty-state/*.html              # exemplars: with action, without action
packages/styles/src/empty-state/sk-empty-state-html.stories.ts

packages/styles/src/skip-link/sk-skip-link.css
packages/styles/src/skip-link/*.html                # exemplars: unfocused, focused-state demo
packages/styles/src/skip-link/sk-skip-link-html.stories.ts

docs/contributing/adding-a-component.md             # FR-011: document both baselines
```

### Generated (never hand-edited)

```text
packages/styles/src/facts/index.ts
packages/styles/src/disclosure/index.ts
packages/styles/src/data-table/index.ts
packages/styles/src/empty-state/index.ts
packages/styles/src/skip-link/index.ts
```

Regenerated by `node scripts/build-styles-only-markup.mjs` with **zero script changes** — the
five new directories join the derived styles-only set automatically (each has a `.css`, none
has a matching `packages/elements/src/<name>` directory).

### Hand-edited (one line each, per FR-008)

```text
packages/styles/src/index.ts   # + export * from './facts/index'; etc., five lines
```

Nothing else under `packages/elements`, `packages/react`, `packages/tokens`, `scripts/`, or
`.github/workflows/ci-quality.yml` needs to change: no new package directory is created (all
five live under the existing `packages/styles` project), so the `components` path filter
already covers `packages/styles/**`.

## Fixtures and Stories

Each primitive gets its own `sk-<name>-html.stories.ts` importing the generated barrel, mirroring
`packages/styles/src/form-field/sk-form-field-html.stories.ts`:

- `.sk-facts`: stacked (default), two-column, compact density, long term, long value, empty value.
- `.sk-disclosure`: closed, open, long body, nested disclosure, a keyboard-toggle note in docs
  (native behaviour — nothing to simulate).
- `.sk-data-table`: a real multi-row/multi-column table with a `<caption>`, numeric-column
  alignment, sticky header modifier, and a narrow-viewport story proving the `role="region"` +
  accessible name + `tabindex="0"` scroller wraps an intact table (`<th scope>` present, cells
  never reflowed).
- `.sk-empty-state`: with an action, without an action.
- `.sk-skip-link`: an unfocused story and a focused-state story proving it becomes visible,
  reaches AA contrast, and its `href="#main"` targets a real `id="main"` in the story fixture.
- Every primitive's story set includes the required `LightMode` story wrapped in
  `class="sk-light"` (never `data-theme`, per #93) — verified, not assumed, per
  `docs/contributing/adding-a-component.md` §5.
- A forced-colors story or documented visual baseline note for the skip-link focus state, the
  disclosure marker, and the table borders (SC-005).

SC-002 requires the authored `.html` to contain the real native tag (`<dl>`, `<details>`,
`<table>`, `<a>`) — verified by grepping the `.html` files, not by reading story titles.

## Local gate commands

```sh
node scripts/build-styles-only-markup.mjs           # regenerate the five new barrels
node scripts/build-styles-only-markup.mjs --check   # must be clean afterwards
npx stylelint "packages/styles/src/**/*.css"        # declaration-strict-value, zero new exceptions
npm run -s quality:htmlhint                          # packages/styles/src/**/*.html
npm run -s quality:lint                              # nx run-many --target=lint --all
node scripts/check-story-theme-wrapper.mjs           # repo-wide LightMode-wrapper ratchet; new stories must not add an offender
node scripts/check-story-theme-wrapper.mjs --selftest
npm test                                             # vitest run — background it, it can exceed 10 min
npx nx run storybook:storybook:build                 # required before axe can run against real stories
node scripts/run-axe-storybook.js                    # FR-021-equivalent: zero violations across every story, including the five new ones
```

`check-story-theme-wrapper.mjs` and `check-gate-wiring.mjs` are wired as separate CI steps (not
inside `npm run quality:all`); running them locally catches an inert `data-theme` wrapper before
CI does. No elements-side gate (`build-elements-css.mjs`, `build-element-markup.mjs`,
`check-manifest-content.mjs`, `build-react-wrappers.mjs`, `measure-elements-sizes.mjs`, etc.)
applies — this mission never touches `packages/elements` or `packages/react`.

Before the final gate: rebase the branch on the current `train/elements-first` and regenerate
`packages/styles/src/*/index.ts` (epic #183's and #176's own exit criteria, SC-007).

## Implementation Concern Map

### IC-01 — `.sk-facts`

- **Purpose**: Style `<dl>`/`<dt>`/`<dd>` with stacked/two-column/compact arrangements, verbatim
  values.
- **Relevant requirements**: FR-001, FR-007, NFR-001, NFR-003; C-004.
- **Affected surfaces**: `packages/styles/src/facts/*`.
- **Sequencing/depends-on**: none.
- **Risks**: reaching for a count/summary derivation the spec explicitly forbids; low.

### IC-02 — `.sk-disclosure`

- **Purpose**: Style `<details>`/`<summary>` with a non-sole-affordance marker, visible
  `:focus-visible`, and the reduced-motion guard on its own transition.
- **Relevant requirements**: FR-002, FR-007, FR-010, NFR-001, NFR-003; C-004.
- **Affected surfaces**: `packages/styles/src/disclosure/*`.
- **Sequencing/depends-on**: none.
- **Risks**: re-implementing `aria-expanded`/open-state bookkeeping in CSS or JS — explicitly
  rejected by C-001 and the mission's own light-DOM rule; marker-only affordance failing a
  color-independent-meaning check.

### IC-03 — `.sk-data-table` and the narrow-width region

- **Purpose**: Zebra/hover/alignment/sticky-header styling, plus the one documented narrow-width
  approach — a labelled, keyboard-scrollable, intact-table wrapper.
- **Relevant requirements**: FR-003, FR-004, FR-007, NFR-001, NFR-003; C-003, C-004.
- **Affected surfaces**: `packages/styles/src/data-table/*`.
- **Sequencing/depends-on**: none.
- **Risks**: the single highest-risk concern in this mission — any block-reflow treatment of
  cells at narrow widths is a rejected design (FR-004) because it is the exact defect being
  fixed. SC-003's `role="region"` + accessible name + `tabindex="0"` + intact `<th scope>` must
  be demonstrated, not asserted.

### IC-04 — `.sk-empty-state`

- **Purpose**: Heading, supporting copy, one optional action slot position, no invented copy.
- **Relevant requirements**: FR-005, FR-007, NFR-001; C-002, C-004.
- **Affected surfaces**: `packages/styles/src/empty-state/*`.
- **Sequencing/depends-on**: none.
- **Risks**: tone/status colouring creeping in (explicitly out of scope, C-002); low otherwise.

### IC-05 — `.sk-skip-link`

- **Purpose**: A real `<a href="#main">`, off-screen until `:focus-visible`, AA contrast when
  visible, plus its own reduced-motion guard and forced-colors focus treatment.
- **Relevant requirements**: FR-006, FR-007, FR-009, FR-010, NFR-001, NFR-002; C-004.
- **Affected surfaces**: `packages/styles/src/skip-link/*`.
- **Sequencing/depends-on**: none.
- **Risks**: `display: none` or `outline: none` creeping in via a copied pattern from elsewhere —
  both are explicitly forbidden (FR-006); an off-screen technique that also hides it from
  assistive tech (e.g. `visibility: hidden` instead of an off-canvas transform) would fail NFR-003.

### IC-06 — Forced-colors and reduced-motion baseline (cross-cutting)

- **Purpose**: The `@media (forced-colors: active)` treatment for skip-link focus/disclosure
  marker/table borders, and the `@media (prefers-reduced-motion: reduce)` guard on the two
  primitives that introduce a transition — generalising, not duplicating, the existing
  `sk-transition-matrix.css:237` precedent.
- **Relevant requirements**: FR-009, FR-010; SC-005.
- **Affected surfaces**: `packages/styles/src/skip-link/*.css`, `packages/styles/src/disclosure/*.css`, `packages/styles/src/data-table/*.css`.
- **Sequencing/depends-on**: IC-02, IC-03, IC-05 (the media blocks are added inline to those
  same CSS files, not a separate shared file — there is no shared-baseline CSS module in this
  architecture).
- **Risks**: inventing a second reduced-motion convention instead of copying the shape at
  `sk-transition-matrix.css:237` (explicitly forbidden by the spec's own stale-issue correction).

### IC-07 — Barrel registration and package entry point

- **Purpose**: Generate the five barrels with zero generator changes; add the five hand-written
  `export *` lines to `packages/styles/src/index.ts` (FR-008).
- **Relevant requirements**: FR-007, FR-008, SC-001, SC-004.
- **Affected surfaces**: `packages/styles/src/*/index.ts` (generated), `packages/styles/src/index.ts` (hand-edited).
- **Sequencing/depends-on**: IC-01–IC-05 (each directory must have at least one `.html` before
  the generator can run for it).
- **Risks**: forgetting the entry-point line for one of the five (exactly the drift #156/#174
  describe) — SC-004 requires an explicit import-and-resolve check, not just eyeballing the diff.

### IC-08 — Authoring-recipe documentation

- **Purpose**: Document the forced-colors and reduced-motion baselines in
  `docs/contributing/adding-a-component.md` so later components inherit them rather than
  re-deciding (FR-011, owned here per epic #183 — not spun out).
- **Relevant requirements**: FR-011.
- **Affected surfaces**: `docs/contributing/adding-a-component.md`.
- **Sequencing/depends-on**: IC-06 (document the pattern actually shipped, not a planned one).
- **Risks**: writing prose that duplicates rather than points at the shipped CSS; keep it short
  and point at the two files that carry the real pattern.

## Work-package Strategy Recommendation

This is a routine, low-blast-radius mission (five independent, structurally identical
styles-only primitives; no shared runtime, no generator change, one shared entry-point file).
Per the run-prompt's tiering, it relies on the merge gate alone for the pre-merge point-cut, but
the operator has added an explicit **post-tasks** point-cut for this issue (same treatment as
#180) — the squad reviews this plan and the tasks split before any WP is implemented.

Recommended split, to be finalised in `/spec-kitty.tasks`: one WP per primitive is unnecessary
overhead (each is 2-3 subtasks) but five primitives interleaved into one WP would exceed the
7-subtask ideal. Group by natural risk/complexity boundary instead:

1. **WP01 — `.sk-facts` + `.sk-empty-state`** (the two lowest-risk, no-transition primitives).
2. **WP02 — `.sk-disclosure` + `.sk-skip-link`** (the two primitives that introduce a transition
   and therefore own IC-06's reduced-motion/forced-colors work for their own surfaces).
3. **WP03 — `.sk-data-table`** alone (the highest-risk concern, FR-004/SC-003, plus its own
   forced-colors border treatment and IC-06 rest).
4. **WP04 — Barrel registration, entry point, and docs** (IC-07, IC-08) — depends on WP01–WP03
   because it needs all five directories' `.html` files to exist before the generator runs and
   the entry point can be completed.

This keeps `packages/styles/src/index.ts` a single-writer surface (WP04 only) and avoids any two
WPs touching the same file. `spec-kitty tasks` will confirm exact subtask counts and finalize
ownership/dependency metadata.

## Pre-mortem and Risks

| Failure | Earliest signal | Mitigation |
|---|---|---|
| Narrow-width table reflows cells instead of scrolling | SC-003 check finds no `role="region"`/`tabindex="0"` wrapper, or finds one but `<th scope>` no longer associates | FR-004 is a hard, non-negotiable constraint; the exemplar HTML and story are graded against it directly |
| Forced-colors block invents a fourth location beyond skip-link/marker/borders, or misses one of the three | Grep for `forced-colors` across the three CSS files after implementation | SC-005 names exactly three; check each is present before claiming FR-009 done |
| A second reduced-motion convention (different property names/shape) is invented instead of copying `sk-transition-matrix.css:237` | Diff the new media blocks against the precedent's shape | FR-010 explicitly requires generalising, not reinventing; copy the shape |
| A `--sk-status-*` or `--sk-chart-*` token gets invented under implementation pressure (e.g. "just this one row needs a hint of color") | `grep` against `packages/tokens/src/tokens.css` per SC-006 | C-002 and epic #183 forbid it outright; stop and report if the design genuinely needs one |
| `packages/styles/src/index.ts` misses one of the five new lines | SC-004's import-and-resolve check fails for one export name | WP04 is the single writer for this file; do it last, after all five directories exist |
| A hand-edited `index.ts` barrel reappears (someone "fixes" the generated file directly) | `build-styles-only-markup.mjs --check` fails | Never hand-edit; regenerate after any `.html` change |
| A `LightMode` story wraps in `data-theme="light"` instead of `class="sk-light"` | `check-story-theme-wrapper.mjs`'s ratchet count would need to rise, which is disallowed | Copy the form-field precedent's `LightMode` story exactly; verify computed styles differ between themes, don't assume |
| axe finds a violation only visible once real stories are built (not caught by stylelint/htmlhint alone) | `run-axe-storybook.js` after a real Storybook build | Build Storybook and run axe locally before claiming NFR-002 |

There is no planning blocker requiring a stop-and-report. If implementation surfaces a fork no
ADR covers (e.g. a genuine need for a status/tone token, or a narrow-width technique that cannot
satisfy FR-004 as specified), that is a legitimate mid-mission decision-required outcome, not one
to resolve here.
