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
treatment (FR-009 — genuinely new, `forced-colors` appears nowhere in the repo today, covering
skip-link focus, the disclosure marker, and **the data-table's zebra/hover row distinction** —
**not** table borders; measured under `forcedColors: 'active'`, a plain `border` already
survives with no author rule, while `background`-based zebra/hover flattens to `Canvas`) and a
`@media (prefers-reduced-motion: reduce)` guard on any transition this mission introduces
(FR-010 — **this mission establishes the first real reduced-motion guard in the repo**; the
block at `sk-transition-matrix.css:237` guards `scroll-behavior`, which is set nowhere in
`packages/styles`, so it disables nothing and is not a working precedent to generalise — see
"Corrected premises" below). Both are documented in `docs/contributing/adding-a-component.md`
(FR-011) so later components inherit them.

The mission is tone-free by epic ruling (#183): no `--sk-status-*` or `--sk-chart-*` token is
invented, and none is consumed because none exists yet at `train/elements-first@dcf7af2`.

## Corrected premises (post-tasks squad findings, folded 2026-09-05)

The operator's own spec had two wrong premises, measured and corrected here and in `spec.md`
directly (operator-authorized correction, not a planning decision of mine):

- **FR-010's "generalise the existing precedent" was vacuous.** `sk-transition-matrix.css:237` is
  `.sk-transition-matrix, .sk-transition-matrix * { scroll-behavior: auto; }` — a wildcard over
  the component's own subtree, guarding a property (`scroll-behavior: smooth`) that is set
  **nowhere** in `packages/styles`. It disables nothing. Meanwhile ten real `transition:`
  declarations ship **unguarded** today: `nav-pill` (3), `card`, `button`, `site-footer`,
  `form-field` (2), `nav-pill-drawer` (2). This mission does not generalise a convention — it
  **establishes** the first one that actually guards something. Do not copy the wildcard shape;
  each new guard targets the exact transitioning declaration on the exact element that carries
  it (see IC-06 and the sanctioned pattern below).
- **FR-009's third forced-colors location was wrong.** The issue and the original FR-009 named
  "table borders." Measured: an ordinary `border: 1px solid #999` already computes to a visible
  system color under `forcedColors: 'active'` with **zero** author forced-colors rule — a
  border-only treatment would certify a no-op. What actually disappears is `background`-based
  zebra striping and hover-row highlighting, both of which flatten to `Canvas`. The third
  location is **row distinction (zebra + hover)**, not borders.
- **A package.json gap in SC-004.** `packages/styles/package.json` needs a `./<name>/*` subpath
  export per new directory or the CSS is unreachable as a package import, and
  `scripts/check-release-graph.mjs`'s `checkSubpathCoverage` — `[ENFORCED]` at
  `ci-quality.yml:533`, previously absent from this plan's own gate list — fails one row per
  missing entry. See "File and Write Scope" and IC-07 below.

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
(LightMode-wrapper ratchet), `scripts/check-release-graph.mjs` (subpath-export coverage,
`[ENFORCED]` at `ci-quality.yml:533`). No behaviour tests — these primitives own no behaviour
(ADR-11's list is inapplicable end-to-end), **and `packages/styles/project.json` has no `test`
target at all** — there is no automated-test surface to add one to without inventing new package
infrastructure, which is out of scope. Verification for this mission is gate scripts plus recorded
manual/visual evidence, not committed unit tests; the acceptance matrix reflects that honestly
(see "Acceptance evidence" below) rather than claiming `automated_test` proof it cannot produce.
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

**Precedent copied — file layout only**: `packages/styles/src/form-field/` for directory shape
(authored `.css` + `.html` exemplars beside it, a **generated** `index.ts` barrel, an
`sk-<name>-html.stories.ts` importing from that barrel). **Precedent copied — `LightMode` story
specifically**: `packages/styles/src/check-bullet/sk-check-bullet-html.stories.ts`'s `LightMode`
export, **not** form-field's. Measured: `form-field`'s `LightMode` story has **no**
`class="sk-light"` at all — only a Storybook `backgrounds` parameter — and
`expected-inert-theme-wrappers.json` records this as a deliberate, already-known offender.
Copying it verbatim would ship five more inert `LightMode` stories that
`check-story-theme-wrapper.mjs` cannot catch (it matches for `data-theme`, not for a missing
`class`). `check-bullet`'s `LightMode` wraps in `<div class="sk-light" style="...">` — that shape,
not form-field's, is what every one of this mission's five stories must copy.

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
  affordance; visible `:focus-visible` ring. **Never `display: flex`/`display: grid` on
  `<summary>` unless a replacement marker ships in the same rule** — measured: `display: flex`
  removes Chromium's native triangle silently (text starts at `x=0` instead of `x=15`) while
  `getComputedStyle(...).listStyleType` still reports `disclosure-closed`, so the loss is
  invisible to a computed-style inspection and must be caught visually.
- `.sk-disclosure__body` (wraps the revealed content inside `<details>`).
- The `open` attribute is never touched by CSS logic and stays entirely the consumer's (FR-002).
- Every `[open]`-scoped marker rule uses a **child combinator** (`.sk-disclosure[open] >
  .sk-disclosure__summary::before`), never a descendant combinator. Measured: with a descendant
  selector, an open outer disclosure flips the marker of a **closed nested inner** disclosure too
  — `[open] .foo` matches any `.foo` anywhere inside an open ancestor, not just its own summary.

### Forced-colors marker technique (disclosure)

`forced-color-adjust: none` on a `background`-drawn marker is **forbidden**. Measured in both
Windows High Contrast schemes: a `background`-drawn triangle with `forced-color-adjust: none`
stays its authored color (`rgb(51,51,51)` in the probe) — near-invisible against the dark-HC
background, which is the majority configuration — and without the property it computes to
`Canvas`, equally invisible. Only a **`content`-drawn marker** (e.g. `content: "▸"` as text, or a
`border`-drawn shape) survives, because forced-colors maps text and border colors to
`CanvasText`/`Highlight` rather than stripping them. Use a content- or border-drawn marker, never
a background-fill icon, for anything that must remain visible under `forced-colors: active`.

### `.sk-data-table` — `<table>` / `<caption>` / `<th scope>`

- `.sk-data-table` (on `<table>`) — zebra rows, hover row highlight, column alignment via
  `.sk-data-table__cell--numeric` (tabular-nums, right-aligned), `.sk-data-table--sticky-header`
  modifier for a sticky header row.
- `.sk-data-table__scroller` — the narrow-width treatment: a wrapper around an **intact**
  `<table>` with `role="region"`, an accessible name (`aria-label` or `aria-labelledby`), and
  `tabindex="0"`, so it is keyboard-reachable and independently scrollable. Cells are never
  reflowed to blocks (FR-004, non-negotiable).
- Forced-colors location for this primitive is **zebra/hover row distinction**, not borders (see
  "Corrected premises" above) — the `@media (forced-colors: active)` block must re-establish
  visible row differentiation (e.g. a border/outline-based row separator using a system color
  keyword) since the token-driven `background` distinction disappears entirely under
  `forced-colors: active`.

### `.sk-empty-state`

- `.sk-empty-state` (root, a plain block container) with `.sk-empty-state__heading`,
  `.sk-empty-state__body`, and one optional `.sk-empty-state__action` slot position. The
  primitive supplies no copy and no icon (FR-005).

### `.sk-skip-link`

- `.sk-skip-link` on a real `<a href="#main">`. Off-screen (not `display: none`) until
  `:focus-visible`, then visible above all content at AA contrast; `outline` is never suppressed
  (FR-006).
- **Off-screen technique is `clip-path` (or the classic clip/absolute-position "visually hidden"
  recipe), never a bare `transform`.** Measured: `transform` does not apply to non-replaced inline
  elements, and `<a>` is inline by default. A `transform: translateY(-100%)` skip link **does not
  move** — `document.elementFromPoint()` at its visual center still returns the anchor, so it sits
  as a permanently visible, click-swallowing element at the top-left of every consuming page,
  while stylelint/htmlhint/axe all stay green (none of them evaluates layout). `clip-path` was
  probed and does move the content out of paint while keeping it in the accessibility tree and
  tab order. If a transform-based technique is used instead, it must be paired with an explicit
  `display: block`/`inline-block` on the same rule — state which technique was chosen in the CSS
  file's header comment.
- **Stacking contract.** The focused state needs an explicit `z-index` (a literal integer is fine
  — `z-index` is not in stylelint's `declaration-strict-value` policed-property list) high enough
  to paint above common fixed page chrome, and `position: fixed`/`position: sticky` positioning
  for the focused state. Two silent failure modes, both measured: (1) a low `z-index` under a
  higher-`z-index` fixed header paints the link **underneath** it while every check still reports
  it "visible" by computed style; (2) `position: fixed` is trapped by any ancestor with
  `transform`/`filter`/`will-change` set — the CSS establishes a new containing block and the
  "fixed" link becomes relative to that ancestor instead of the viewport. Document both as a
  **consumer constraint**: don't place `.sk-skip-link` inside a transformed/filtered ancestor, and
  give it a token-independent high `z-index` (there is no `--sk-z-*` token scale today; a literal
  integer is the honest choice here, not a fabricated token).

## Cross-cutting: forced-colors and reduced-motion

- **`@media (forced-colors: active)`** (FR-009): covers exactly three places — the skip-link's
  focused state, the disclosure marker, and **`.sk-data-table`'s zebra/hover row distinction**
  (corrected from the issue's original "table borders" — see "Corrected premises" above; a plain
  `border` already survives with zero author rule, `background`-based row distinction does not).
  This is new territory (no `forced-colors` block exists anywhere in the repo), so the pattern
  established here is the one `docs/contributing/adding-a-component.md` will document for reuse.
- **`@media (prefers-reduced-motion: reduce)`** (FR-010): only `.sk-disclosure` (marker
  rotation/reveal) and `.sk-skip-link` (its off-screen → visible transition) introduce any
  transition at all; `.sk-facts`, `.sk-data-table` and `.sk-empty-state` introduce none, so they
  need no guard. **This mission establishes the first real guard** — the existing block at
  `sk-transition-matrix.css:237` guards an unused property and disables nothing (see "Corrected
  premises"). Each new guard is scoped to the exact transitioning declaration, not a wildcard.

### Sanctioned forced-colors CSS pattern (record once, apply everywhere)

`stylelint`'s `declaration-strict-value` polices `['/color/', 'background', 'background-color',
'font-family', 'padding', 'margin', 'border-radius']` — `/color/` is a substring regex, so it
matches `border-color` and `outline-color`, and system-color keywords (`Highlight`,
`CanvasText`, `Canvas`) are not in `ignoreValues`. Writing the longhand (`border-color:
CanvasText`, `outline-color: Highlight`) would need a new stylelint exception, which NFR-001
forbids. **Use the unpoliced shorthand instead** — `border: 1px solid CanvasText;` and `outline:
2px solid Highlight;` — neither `border` nor `outline` (unqualified) appears in the policed list,
so the shorthand form satisfies NFR-001 with zero new exceptions and zero `stylelint.config.mjs`
edits. This is the **one** sanctioned pattern for every forced-colors declaration in this
mission (skip-link focus outline, disclosure marker border/content color, data-table row
separators) — do not improvise a second one, and do not have WP02 and WP03 (both `parallel_group:
0`, so effectively concurrent) invent divergent answers to the same stylelint question.

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

### Hand-edited (per FR-008 and the corrected SC-004)

```text
packages/styles/src/index.ts   # + export * from './facts/index'; etc., five lines
packages/styles/package.json   # + "./<name>/*": "./dist/<name>/*" per new directory, five entries
```

`packages/styles/package.json` was missing from this scope in the pre-squad plan — an SC-004 gap.
`scripts/check-release-graph.mjs`'s `checkSubpathCoverage` (`[ENFORCED]` at `ci-quality.yml:533`)
iterates the component directories under `packages/styles/src` and requires a matching `./<dir>/*`
export for each; without the five new entries, `@spec-kitty/styles/facts/sk-facts.css` (etc.) does
not resolve as a package import even though the file exists on disk.

Nothing else under `packages/elements`, `packages/react`, `packages/tokens`, or
`.github/workflows/ci-quality.yml` needs to change: no new package directory is created (all
five live under the existing `packages/styles` project), so the `components` path filter
already covers `packages/styles/**`, and the release job's own gate (`check-release-graph.mjs`)
needs no workflow edit — only the package.json content change above.

### Delivery rule: a `.css` and at least one `.html` land in the same commit

`scripts/build-styles-only-markup.mjs` **throws** (uncovered exception, not a clean non-zero exit
with a useful message) when a directory it derives as styles-only has a `.css` but zero `.html`
files — measured: `--check` exits 1 with a raw stack trace and generates **nothing for any
directory**, not just the offending one. This script is `[ENFORCED]` at `ci-quality.yml:215`, this
mission is `single_branch` (all WPs land on one shared branch), and several CSS/HTML authoring
subtasks are marked `[P]` (parallel-safe) in `tasks.md`. "Parallel-safe" describes subtask
authorship, not permission to commit a `.css` file alone: **every commit that adds a new
directory's `.css` must add at least one `.html` in that same directory in the same commit**, or
any other WP's `build-styles-only-markup.mjs --check` run on the shared branch in between fails
for the whole tree, not just the incomplete directory.

## Fixtures and Stories

Each primitive gets its own `sk-<name>-html.stories.ts` importing the generated barrel. File
layout mirrors `packages/styles/src/form-field/sk-form-field-html.stories.ts`; the `LightMode`
export mirrors `packages/styles/src/check-bullet/sk-check-bullet-html.stories.ts`'s instead (see
"Precedent copied" above — form-field's own `LightMode` is a known, recorded non-example).

**Storybook section titles**: existing sections in this repo are `Components/`, `Elements/`,
`Primitives/`, `Form/`, `Navigation/` — there is no `Dashboard/` section, and inventing one is
both new, ungoverned taxonomy and in tension with C-004 (no dashboard-specific naming). All five
primitives use the existing `Primitives/` section, matching `check-bullet`/`pill-tag`/
`section-banner`/`stub`'s placement:

- `Primitives/SkFacts (HTML)`
- `Primitives/SkDisclosure (HTML)`
- `Primitives/SkDataTable (HTML)`
- `Primitives/SkEmptyState (HTML)`
- `Primitives/SkSkipLink (HTML)`

Per-primitive story content:

- `.sk-facts`: stacked (default), two-column, compact density, long term, long value, empty value.
- `.sk-disclosure`: closed, open, long body, a **nested** disclosure story that explicitly checks
  the **inner** disclosure's marker state independently of the outer one (a child-combinator
  regression this exemplar exists to catch — see the Public Contract section), a keyboard-toggle
  note in docs (native behaviour — nothing to simulate).
- `.sk-data-table`: a real multi-row/multi-column table with a `<caption>`, numeric-column
  alignment, sticky header modifier, and a narrow-viewport story proving the `role="region"` +
  accessible name + `tabindex="0"` scroller wraps an intact table (`<th scope>` present, cells
  never reflowed).
- `.sk-empty-state`: with an action, without an action.
- `.sk-skip-link`: an **unfocused** story, and a **`Focused`** story with a `play()` function that
  calls `.focus()` on the rendered link (not a simulated `is-focused` class — `sk-form-input.css`
  already records that class as a removed anti-pattern in this repo's own words, and
  `:focus-visible` has no simulatable class form). Storybook runs `play()` on render before the
  canvas is considered settled, so `run-axe-storybook.js` — which loads each story's iframe and
  waits for it to finish rendering — scans the **actually-focused** DOM, giving FR-006's AA-contrast
  requirement a real check axe can perform. (Plain axe cannot supply this on its own: it never
  calls `.focus()` itself, so a deliberately-failing ~1.2:1 contrast link reports zero
  `color-contrast` violations at rest and only fails once something focuses it.)
- Every primitive's story set includes the required `LightMode` story wrapped in
  `class="sk-light"` (never `data-theme`, per #93; copy `check-bullet`'s shape, not form-field's)
  — verified, not assumed, per `docs/contributing/adding-a-component.md` §5.
- A forced-colors story or documented visual baseline note for the skip-link focus state, the
  disclosure marker, and the data-table's row distinction (SC-005 — not table borders).

SC-002 requires the authored `.html` to contain the real native tag (`<dl>`, `<details>`,
`<table>`, `<a>`) — verified by grepping the `.html` files, not by reading story titles. This
mission's original plan verified SC-002 for `.sk-data-table` only; WP04 now adds one mission-wide
grep covering all five primitives (see IC-09 below).

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
node scripts/check-release-graph.mjs --selftest      # the gate can see its own failures, run before trusting the next line
npx nx run-many --target=build --projects=tokens,styles   # check-release-graph.mjs reads built output
node scripts/check-release-graph.mjs                 # [ENFORCED] ci-quality.yml:533 — SC-004's package.json subpath coverage
```

`check-story-theme-wrapper.mjs`, `check-gate-wiring.mjs`, and `check-release-graph.mjs` are wired
as separate CI steps (not inside `npm run quality:all`) — the first two absent from this plan's
original gate list, the third genuinely new because this mission's earlier plan omitted the
release job's package.json requirement entirely. Running them locally catches an inert
`data-theme` wrapper and a missing subpath export before CI does. No elements-side gate
(`build-elements-css.mjs`, `build-element-markup.mjs`, `check-manifest-content.mjs`,
`build-react-wrappers.mjs`, `measure-elements-sizes.mjs`, etc.) applies — this mission never
touches `packages/elements` or `packages/react`.

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
  be demonstrated, not asserted. Its forced-colors location is zebra/hover row distinction, not
  borders (measured — see "Corrected premises"); do not certify a border-only treatment as
  satisfying FR-009, it would be a no-op.

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

- **Purpose**: The `@media (forced-colors: active)` treatment for skip-link focus / disclosure
  marker / data-table zebra+hover row distinction (not borders — corrected), and the
  `@media (prefers-reduced-motion: reduce)` guard on the two primitives that introduce a
  transition — **establishing** the first working convention of each kind, not generalising a
  precedent that already works (it doesn't — see "Corrected premises").
- **Relevant requirements**: FR-009, FR-010; SC-005.
- **Affected surfaces**: `packages/styles/src/skip-link/*.css`, `packages/styles/src/disclosure/*.css`, `packages/styles/src/data-table/*.css`.
- **Sequencing/depends-on**: IC-02, IC-03, IC-05 (the media blocks are added inline to those
  same CSS files, not a separate shared file — there is no shared-baseline CSS module in this
  architecture).
- **Risks**: (1) a second reduced-motion convention diverging between WP02's two primitives —
  mitigated by both using the same scoped-per-declaration shape, never a wildcard; (2) the
  forced-colors declarations tripping `declaration-strict-value` — mitigated by the sanctioned
  unpoliced-shorthand pattern (`border:`/`outline:` shorthand, never `-color` longhand) recorded
  once in "Sanctioned forced-colors CSS pattern" above, since WP02 and WP03 are both
  `parallel_group: 0` and must not invent divergent answers to the same stylelint question; (3)
  `forced-color-adjust: none` on the disclosure marker, which reproduces the exact invisibility
  FR-009 exists to prevent — forbidden outright, see the Public Contract section.

### IC-09 — Mission-wide verification aggregation

- **Purpose**: Two checks that only make sense once all five primitives exist: a single grep
  confirming every primitive's authored `.html` contains its real native tag (SC-002, mission-wide
  — the original plan verified this for `.sk-data-table` only), and honest acceptance-matrix /
  negative-invariant content in place of the CLI's TODO-placeholder scaffold.
- **Relevant requirements**: SC-002 (mission-wide), C-001–C-005 as negative invariants.
- **Affected surfaces**: `kitty-specs/dashboard-semantic-primitives-01M1S94M/acceptance-matrix.json`
  (hand-authored content, no CLI command generates real criteria at planning time); a grep command
  recorded as WP04 evidence, not necessarily a new committed script (see IC-07's proof_type note).
- **Sequencing/depends-on**: IC-01–IC-05 (needs all five directories to exist).
- **Risks**: `acceptance-matrix.json`'s `criteria` currently claim `proof_type: automated_test`
  for a package with no test target (see Technical Context) — replaced with honest `manual_qa`
  proof types keyed to the real SC-001..SC-007, or `automated_test` only where a real script with
  its own exit code performs the check (e.g. `build-styles-only-markup.mjs --check`,
  `check-release-graph.mjs`).

### IC-07 — Barrel registration, package entry point, and subpath exports

- **Purpose**: Generate the five barrels with zero generator changes; add the five hand-written
  `export *` lines to `packages/styles/src/index.ts` (FR-008); add the five `./<name>/*` subpath
  exports to `packages/styles/package.json` (corrected SC-004 — see "Corrected premises").
- **Relevant requirements**: FR-007, FR-008, SC-001, SC-004, SC-007 (`check-release-graph.mjs`).
- **Affected surfaces**: `packages/styles/src/*/index.ts` (generated), `packages/styles/src/index.ts`
  and `packages/styles/package.json` (both hand-edited, both WP04-only).
- **Sequencing/depends-on**: IC-01–IC-05 (each directory must have at least one `.html` before
  the generator can run for it).
- **Risks**: (1) forgetting the entry-point line for one of the five (exactly the drift #156/#174
  describe) — SC-004 requires an explicit import-and-resolve check, not just eyeballing the diff;
  the check must be **committed as a real test or have its verbatim output recorded in the PR
  body** — a throwaway script that gets deleted after a manual run reproduces the exact
  conditions that lost `SkGridGap4HTML` in the first place (nothing left to catch the next
  regression); given `packages/styles/project.json` has no `test` target, recording verbatim
  output in the PR body is the pragmatic choice here, not inventing new test infrastructure mid-WP.
  (2) forgetting a `packages/styles/package.json` subpath entry — caught by
  `check-release-graph.mjs`, an [ENFORCED] CI gate, so this one fails loudly rather than silently.
  (3) `packages/styles/src/index.ts`'s header comment states a directory/export count that is
  already stale before this mission (measured: 16 directories, 13 with `index.ts`, **three**
  CSS-only — `form-input`, `form-textarea`, and `transition-matrix` — not the two the header
  names). Given this comment's own history records two prior lenses catching a stale count,
  **delete the count from the header rather than recomputing it a third time** — a comment that
  says "these directories are CSS-only; see the styles-only-derivation logic in
  `build-styles-only-markup.mjs` for the current list" needs no number to stay true.

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
   and therefore own IC-06's reduced-motion/forced-colors work for their own surfaces — using the
   one sanctioned forced-colors CSS pattern, not an independently invented one).
3. **WP03 — `.sk-data-table`** alone (the highest-risk concern, FR-004/SC-003, plus its own
   forced-colors **row-distinction** treatment, corrected from "border treatment").
4. **WP04 — Barrel registration, entry point, package.json exports, docs, and mission-wide
   verification** (IC-07, IC-08, IC-09) — depends on WP01–WP03 because it needs all five
   directories' `.html` files to exist before the generator runs, the entry point/exports can be
   completed, and the mission-wide SC-002 grep and acceptance-matrix instantiation are meaningful.
   WP04 must run the generator's `--check` only, never its mutating form — the mutating form
   rewrites every styles-only directory's `index.ts`, including WP01–03's, which is outside
   lane-d's declared write scope; if `--check` reports staleness in a directory WP04 doesn't own,
   that bounces back to the WP that owns it, not a WP04 regeneration.

This keeps `packages/styles/src/index.ts` and `packages/styles/package.json` single-writer
surfaces (WP04 only) and avoids any two WPs touching the same file. `spec-kitty tasks` will
confirm exact subtask counts and finalize ownership/dependency metadata.

**A caution on `lanes.json`, not a plan change**: this mission's `meta.json` and every WP's
frontmatter agree the topology is `single_branch` on `mission/dashboard-semantic-primitives` — the
branch this whole mission already lives on. `lanes.json`'s own `mission_branch` field nonetheless
names `kitty/mission-dashboard-semantic-primitives-01M1S94M`, a branch that does not exist and
that nothing in this mission creates or merges from. This looks like the CLI computing that field
unconditionally regardless of topology, not something this plan can fix by hand-editing a
generated file (it would just be overwritten on the next `finalize-tasks` run). Every WP's Branch
Strategy section states the real branch explicitly and repeatedly for exactly this reason — if a
dispatch step resolves a lane's base from `lanes.json` instead of from the WP frontmatter/tasks.md,
stop and use `mission/dashboard-semantic-primitives` instead of minting the named-but-nonexistent
branch.

## Pre-mortem and Risks

| Failure | Earliest signal | Mitigation |
|---|---|---|
| Narrow-width table reflows cells instead of scrolling | SC-003 check finds no `role="region"`/`tabindex="0"` wrapper, or finds one but `<th scope>` no longer associates | FR-004 is a hard, non-negotiable constraint; the exemplar HTML and story are graded against it directly |
| Forced-colors block invents a fourth location, targets table borders instead of row distinction, or misses one of the real three | Grep for `forced-colors` across the three CSS files after implementation; check the data-table block touches `background`/row-separator declarations, not `border` alone | SC-005 names exactly three (skip-link focus, disclosure marker, data-table row distinction) — table borders was the issue's wrong guess, measured and corrected |
| A second reduced-motion convention (different property names/shape) is invented by WP02's two primitives independently | Diff the new media blocks against each other and against the scoped-per-declaration shape | FR-010 now establishes the first convention rather than "generalising" a dead one; the shape (scoped, per-declaration, no wildcard) is fixed once in this plan |
| A `--sk-status-*` or `--sk-chart-*` token gets invented under implementation pressure (e.g. "just this one row needs a hint of color") | `grep` against `packages/tokens/src/tokens.css` per SC-006 | C-002 and epic #183 forbid it outright; stop and report if the design genuinely needs one |
| `packages/styles/src/index.ts` or `packages/styles/package.json` misses one of the five new entries | SC-004's import-and-resolve check fails for one export name, or `check-release-graph.mjs` fails one row | WP04 is the single writer for both files; do it last, after all five directories exist |
| A hand-edited `index.ts` barrel reappears (someone "fixes" the generated file directly) | `build-styles-only-markup.mjs --check` fails | Never hand-edit; regenerate after any `.html` change |
| A `LightMode` story copies form-field's shape (no `class="sk-light"` at all) instead of check-bullet's | `check-story-theme-wrapper.mjs` cannot catch this — it matches `data-theme`, not a missing class | Copy `check-bullet`'s `LightMode` story, not form-field's; verify computed styles differ between themes, don't assume |
| axe finds a violation only visible once real stories are built (not caught by stylelint/htmlhint alone) | `run-axe-storybook.js` after a real Storybook build | Build Storybook and run axe locally before claiming NFR-002 |
| Skip link's off-screen `transform` is a no-op because `<a>` is inline | `elementFromPoint()` at the link's visual center still returns the anchor; it visibly sits at the page's top-left at all times | Use `clip-path` (or the classic clip/absolute-position recipe); if `transform` is used anyway, pair it with an explicit `display: block`/`inline-block` |
| Disclosure marker uses `forced-color-adjust: none` on a background-drawn icon | Invisible against dark-HC background (majority scheme) — probed as `rgb(51,51,51)` on `Canvas` | Use a `content`-drawn or `border`-drawn marker instead; never `forced-color-adjust: none` on the affordance |
| Forced-colors declarations trip `declaration-strict-value` because WP02/WP03 wrote the `-color` longhand | stylelint fails on `border-color`/`outline-color` with a `Highlight`/`CanvasText` value | Use the sanctioned unpoliced shorthand (`border:`/`outline:`) recorded once in this plan; do not add a stylelint exception |
| `display: flex`/`grid` on `<summary>` silently removes the native marker | Visual only — `listStyleType` still reports `disclosure-closed` | Never `display: flex`/`grid` on `<summary>` without a replacement marker in the same rule |
| Nested disclosure exemplar ships the bug it should catch (outer `[open]` flips inner's closed marker) | A descendant-combinator `[open] .foo` selector matches the inner summary too | Use child combinators (`[open] > .foo`) on every marker rule; the nested story must check the inner marker's state independently |
| Skip-link `Focused` story uses a simulated `is-focused` class | Demonstrates a state the shipped CSS never enters (`:focus-visible` has no class form); `sk-form-input.css` already records `is-focused` as a removed anti-pattern | Use a `play()` function that calls real `.focus()`; no simulated-class alternative in the file list |
| `build-styles-only-markup.mjs` throws on a directory with a `.css` but zero `.html`, failing generation for **every** directory | `--check` exits 1 with a raw stack trace and regenerates nothing, anywhere | A `.css` and at least one `.html` land in the same commit, always (see "Delivery rule" above) |
| `lanes.json`'s `mission_branch` names a branch that doesn't exist | A lane resolves its base from `lanes.json` instead of the WP frontmatter | Use `mission/dashboard-semantic-primitives` (per meta.json's `single_branch` topology) — flagged for the operator as a likely CLI defect, not fixed here |
| SC-004's import-and-resolve proof is a throwaway script, deleted after one manual run | Nothing left to catch the next `SkGridGap4HTML`-style drift | Commit it as a real test, or record its verbatim output in the PR body — packages/styles has no `test` target, so the PR-body path is the pragmatic default |
| `acceptance-matrix.json` ships as 11 TODO placeholders claiming `automated_test` proof this mission cannot produce | Reviewer opens the file and finds no real criteria | WP04 instantiates it against SC-001..SC-007 with honest `manual_qa`/`automated_test` proof types and records C-001..C-005 as negative invariants (see IC-09) |
| SC-002 is verified for `.sk-data-table` only, the other four ship unchecked | A reviewer assumes "SC-002 passed" covers all five because one WP proved it for one primitive | WP04 adds one mission-wide grep confirming every primitive's real native tag, with per-tag match counts (IC-09) |

## One fork this plan does NOT resolve — the operator decides

ADR-10 states: *"no component in `packages/styles/src/` is styles-only except by a recorded,
deliberate decision. `form-field` is the one exception."* This mission makes it **six**, and
`build-styles-only-markup.mjs:116` writes `// <name> is deliberately styles-only … See ADR-10 and
#141.` into every generated barrel — five citations of an ADR that, read plainly, says the
opposite of what they claim. No WP in this mission owns `docs/architecture/decisions/**`, and
ADRs are written only in #67, which is closed. **This plan does not resolve that contradiction and
no WP touches any ADR file.** It is recorded here for the operator to decide (raised separately,
per the squad's instruction), not decided by this plan or silently implemented around.

There is no other planning blocker requiring a stop-and-report. If implementation surfaces a
further fork no ADR covers (e.g. a genuine need for a status/tone token, or a narrow-width
technique that cannot satisfy FR-004 as specified), that is a legitimate mid-mission
decision-required outcome, not one to resolve here.
