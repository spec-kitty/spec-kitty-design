# Implementation Plan: work package native progress styles

**Branch**: `mission/work-package-native-progress-styles` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/work-package-native-progress-styles-01M1VKQ8/spec.md`, `research.md`, `data-model.md` (all already authored for this mission)

## Summary

Add `.sk-progress` as a fifth **styles-only** primitive in `packages/styles/src/progress/` —
one authored `sk-progress.css` plus ten authored `.html` fixtures, generating `index.ts` via
`scripts/build-styles-only-markup.mjs` (which auto-discovers the directory; no code change to the
generator itself). No `packages/elements/src/progress/` directory, no custom element, no
`::part()`, no manifest/React/Vue entry, no `behaviours.json`/`mutations.json` entry. The component
presents a native, labelled `<progress>` — role, name, and `aria-valuenow`/`valuemin`/`valuemax` all
derive from the browser, from the element's own `value`/`max` attributes and a plain light-DOM
`label[for]`/`progress[id]` pair. The consumer supplies all data and text; the CSS performs no
arithmetic. This mirrors `disclosure`, `skip-link`, `data-table`, `facts`, and `empty-state` — the
five live precedents for this exact authoring shape — and is one cohesive, PR-sized work package.

## Technical Context

**Language/Version**: TypeScript (generated barrels only) / CSS (authored, `--sk-*` tokens) / HTML
(authored fixtures) — no JavaScript is introduced.
**Primary Dependencies**: `@spec-kitty/tokens` (existing surface/foreground/border/space/radius/motion
tokens only — no new token). Storybook 10.x (`@storybook/web-components`) for story presentation.
Playwright + `axe-playwright` for accessibility-tree, overflow, and forced-colors assertions.
**Storage**: N/A.
**Testing**: A dedicated `apps/storybook/src/tests/sk-progress.spec.ts` Playwright spec (this
component has no shadow root and no element, so there is no `fixtures/elements-behaviour/` home for
it — see Gate Matrix, "Behaviour/mutation registry" row) plus the standing `run-axe-storybook.js` /
`visual.spec.ts` gates that already cover every Storybook story without per-component registration.
**Target Platform**: Evergreen browsers via Storybook static build; Chromium/Firefox/WebKit via
Playwright's three configured projects (`playwright.config.ts`).
**Project Type**: Single monorepo package addition (`packages/styles`), no new package, no new Nx
project.
**Performance Goals**: N/A beyond the charter's existing "no runtime performance targets — static
presentational components" baseline; the token file's 20 KB uncompressed ceiling is unaffected since
no new token is introduced.
**Constraints**: Styles-only (C-001), no arithmetic/state/JS (C-002), no indeterminate/status-tone
affordance (C-003), no new token category absent a demonstrated gap (C-004), `apps/demo/dashboard-demo.html`
untouched (C-005), `LightMode` uses `class="sk-light"` (C-006), independent of every other `#208`
child (C-007).
**Scale/Scope**: One component directory, ten fixtures, one CSS file, two generated artifacts
(`index.ts`, the package export map entry), one Playwright spec file, one documentation update. No
migration, no other package touched.

## Charter Check

*GATE: Must pass before Phase 0 research (already satisfied by `research.md`, authored ahead of this
plan) and re-checked here for Phase 1 design.*

| Charter clause | How this plan satisfies it |
|---|---|
| Every component requires a Storybook story covering default, interactive states, responsive breakpoints | Ten fixtures across zero/T10/complete/large-total/long-label/compact/narrow/forced-colors/default-dark/LightMode, presented as `Default` + N variant exports in one story file, per SC-002 |
| axe-core zero WCAG 2.1 AA violations, both default and LightMode | `run-axe-storybook.js` runs unconditionally against every emitted story — no opt-in needed (confirmed: it reads `storybook-static/index.json` and scans all stories) |
| Visual diff against reference screenshots | `visual.spec.ts` — CI-authoritative baseline; a new baseline is added for this component in the same PR (Gate Matrix) |
| Component documents its token dependencies | `sk-progress.css`'s header comment plus `docs/design-system/using-components.md` addition (Documentation, below) |
| ADR-11 required-behaviours list, only where the component owns behaviour | This component owns none — no element, no property, no event, no focus/keyboard handling it introduces beyond the browser's own `<progress>`/`<label>` semantics. Confirmed by `research.md` R-01 / E-024. `behaviours.json`/`mutations.json` gain no entry (SC-010) |
| CSS/SCSS uses only `--sk-*` tokens, no hardcoded value outside the token file | NFR-001; existing tokens only (R-08) |
| One maintainer approval for PRs touching component files | Applies at merge; not a plan-phase action |
| No custom element, no `::part()`, no behaviour registry entry (C-001) | Directory shape alone (`.css` + no matching `packages/elements/src/progress/`) is what `build-styles-only-markup.mjs`'s `stylesOnly()` scan picks up — no allowlist edit, no manifest analyzer run against this component |

No charter violation requires justification. **Complexity Tracking is not filled** — there is no
Charter Check violation for this mission.

## Project Structure

### Documentation (this mission)

```
kitty-specs/work-package-native-progress-styles-01M1VKQ8/
├── spec.md              # already authored
├── research.md          # already authored
├── data-model.md        # already authored (states: no domain entities)
├── plan.md              # this file
└── tasks/                # /spec-kitty.tasks output — not created by this plan
```

No `quickstart.md` or `contracts/` are produced: this mission introduces no API contract (no
element, no manifest, no React prop) and no consumer quickstart beyond the markup contract
`data-model.md` already documents in full. Producing empty placeholders for artifacts the mission
has no content for would be the "invent a model to fill the template" anti-pattern `data-model.md`
itself declined (see its "Why there is no data model" section) — the same reasoning applies here.

### Source Code (repository root)

```
packages/styles/src/progress/
├── sk-progress.css                        # AUTHORED — the CSS source of record
├── sk-progress-zero.html                  # AUTHORED — value="0"
├── sk-progress-t10.html                   # AUTHORED — value="5" max="8" (#210's worked example)
├── sk-progress-complete.html              # AUTHORED — value == max
├── sk-progress-large-total.html           # AUTHORED — large value/max numerals
├── sk-progress-long-label.html            # AUTHORED — long label string
├── sk-progress-compact.html               # AUTHORED — sk-progress--compact modifier
├── sk-progress-narrow.html                # AUTHORED — sk-progress--narrow modifier
├── sk-progress-forced-colors.html         # AUTHORED — determinate fixture for the forced-colors story
├── sk-progress-html.stories.ts            # AUTHORED — Default/variant/LightMode story exports
└── index.ts                               # GENERATED by build-styles-only-markup.mjs — DO NOT EDIT

packages/styles/src/index.ts               # + one `export * from './progress/index';` line (AUTHORED edit)
packages/styles/package.json               # + `"./progress/*": "./dist/progress/*"` subpath export (AUTHORED edit)

apps/storybook/src/tests/sk-progress.spec.ts  # AUTHORED — accessibility-tree, no-aria-attribute,
                                                 # meta/value consistency, narrow/zoom overflow, and
                                                 # forced-colors legibility assertions (see Gate Matrix)

apps/storybook/src/tests/visual.spec.ts       # + one baseline entry/snapshot set for sk-progress
docs/design-system/using-components.md        # + a `sk-progress` section (Documentation, below)
```

Nine fixture files, not ten: "default (dark)" and "LightMode" (states 9 and 10 in the fixture
matrix) are **story-level treatments of the T10 fixture**, not separate `.html` files — this matches
`data-table`'s and `skip-link`'s own precedent (their `LightMode` story wraps the same HTML constant
their `Default` story renders, in `class="sk-light"`, rather than authoring a duplicate fixture) and
is exactly what SC-002 requires ("matching this repository's own convention ... without a bespoke
fixture file for each"). The forced-colors story likewise reuses one of the nine authored fixtures
rather than requiring a tenth; `sk-progress-forced-colors.html` is listed above only if the forced-
colors story needs a fixture visually distinct enough to demonstrate the fill clearly (a determinate,
non-zero, non-complete value reads best) — if the T10 fixture already serves this, drop the file and
render `SkProgressT10HTML` in the `ForcedColors` story instead, exactly as `data-table`'s and
`disclosure`'s forced-colors treatments reuse an existing exemplar rather than authoring a new one.
**This is an implementation-time economy, not a scope change**: either way, nine required states
(zero, T10, complete, large-total, long-label, compact, narrow, forced-colors, LightMode) are
demonstrated, satisfying FR-006/FR-007 and the fixture matrix in `data-model.md` literally.

No new package, no new Nx project, no new `scope:` tag: `packages/styles` already has a `lint` and
`typecheck` target and an ESLint `scope:` tag that covers every directory under `src/`.

**Structure Decision**: single-package addition inside the existing `packages/styles` monorepo
project, following the `disclosure`/`skip-link`/`data-table`/`facts`/`empty-state` styles-only
precedent exactly. No "Option 1/2/3" template structure applies — this is not a new application,
service, or platform target.

## Markup and generation flow

1. **Author** each `.html` fixture as the three-part structure `data-model.md` fixes:
   `div.sk-progress[--modifier] > label.sk-progress__label[for] + progress.sk-progress__bar[id][value][max] + span.sk-progress__meta`,
   with a leading `<!-- ... -->` header comment (the generator strips exactly this shape — see
   `build-styles-only-markup.mjs`'s lazy, joined-text regex, not a per-line filter).
2. **Author** `sk-progress.css`: `.sk-progress` (root, layout container), `.sk-progress__label`,
   `.sk-progress__bar` (the `appearance: none`-reset `<progress>` plus its
   `::-webkit-progress-bar`/`::-webkit-progress-value`/`::-moz-progress-bar` pseudo-elements),
   `.sk-progress__meta`, `.sk-progress--compact`, `.sk-progress--narrow`, a
   `@media (prefers-reduced-motion: reduce)` block scoped to the fill's own transition property if
   one is authored (R-06), and a `@media (forced-colors: active)` block overriding the fill
   pseudo-element's `background-color` to `Highlight` (R-05).
3. **Generate**: `node scripts/build-styles-only-markup.mjs` scans `packages/styles/src`, finds
   `progress` (has a `.css`, no matching `packages/elements/src/progress/`), and writes
   `packages/styles/src/progress/index.ts` exporting one `Sk<PascalFixtureName>HTML` constant per
   `.html` file, sorted by filename. No generator code changes — this is the auto-discovery
   `research.md` E-002 already confirms.
4. **Wire**: add `export * from './progress/index';` to `packages/styles/src/index.ts` (alphabetical
   position, between `pill-tag` and `ribbon-card`), and add `"./progress/*": "./dist/progress/*"` to
   `packages/styles/package.json`'s `exports` map (alphabetical position, between `./pill-tag/*` and
   `./ribbon-card/*`), satisfying FR-013/SC-008.
5. **Story**: `sk-progress-html.stories.ts` imports the generated constants and `./sk-progress.css`,
   exports `Default` (T10), `Zero`, `Complete`, `LargeTotal`, `LongLabel`, `Compact`, `Narrow`,
   `ForcedColors`, and `LightMode` (wrapped in `class="sk-light"`, per C-006), with
   `parameters: { a11y: { disable: false } }` at the meta level, matching every precedent story file
   read in this plan's research.

No `packages/elements/src/progress/sk-progress.markup.ts` exists at any point — the styles-only
barrel generator is the only generation step this component has, distinct from
`build-element-markup.mjs`'s per-element pipeline (which this component never enters).

## CSS strategy — pseudo-elements, forced-colors, reduced-motion

- **Reset**: `.sk-progress__bar { appearance: none; }` is required before any of the three
  vendor pseudo-elements paint a custom fill — this is the only standardised styling surface
  `<progress>` exposes (R-05), so both Blink/WebKit's pair and Gecko's single pseudo-element are
  authored for the same visual, per `research.md`'s open-risk item 2 (E-023).
- **Track**: drawn with a plain `border` on `.sk-progress__bar` (or its
  `::-webkit-progress-bar`/`::-moz-progress-bar`), using `--sk-border-default`/`--sk-border-strong`
  and `--sk-radius-*` — `border` survives `forced-colors: active` automatically, zero override
  needed, per `adding-a-component.md`'s forced-colors section and this repo's own two prior
  measurements (`sk-skip-link.css`, `sk-data-table.css`).
  `--sk-surface-input` fills the track background (the same token the current
  `.dash-progress-bar` implementation already uses for an equivalent visual — R-08, E-019).
- **Fill**: `::-webkit-progress-value` / `::-moz-progress-bar` background-color from
  `--sk-color-accent` (or an existing tint pairing — implementation confirms against the rendered
  visual, not a new token), with an explicit
  `@media (forced-colors: active) { .sk-progress__bar::-webkit-progress-value, .sk-progress__bar::-moz-progress-bar { background-color: Highlight; } }`
  override — because `background`/`background-color` do **not** survive forced-colors (they flatten
  to `Canvas`), matching the `sk-skip-link`/`sk-data-table` pattern exactly (R-05).
  `stylelint.config.mjs`'s `ignoreValues` already lists `Highlight` — **no stylelint config change
  is needed** (E-014, confirmed against the current file's `ignoreValues` list).
- **Longhand, not shorthand**: any forced-colors override targets `background-color` (a policed
  property already) and, if a border-based hue-independent affordance is added for FR-008's "not
  conveyed by hue alone" requirement, the longhand `border-*-color`/`outline-color` forms —
  never the `border`/`outline` shorthand, which `declaration-strict-value` does not police at all
  (`adding-a-component.md`'s explicit warning, already the basis of `sk-skip-link.css` and
  `sk-data-table.css`).
- **Hue-independence (FR-008)**: the track's `border` gives a shape/boundary cue independent of the
  fill's colour already; if implementation finds this insufficient once rendered, a text-based
  percentage (the already-required `sk-progress__meta` span) is the second, non-colour channel —
  no new visual affordance needs inventing beyond what the markup contract already carries.
- **Reduced motion (R-06)**: authored **only if** a `width`/`transform` transition is placed on the
  fill for the (out-of-mission-fixtures) case of a consumer mutating `value` live. If authored, scope
  `@media (prefers-reduced-motion: reduce)` to that exact selector and property — never a wildcard —
  matching `sk-disclosure.css`/`sk-skip-link.css`. If no transition is authored, **no reduced-motion
  block is added at all**: `adding-a-component.md`'s own warning against `sk-transition-matrix.css`'s
  dead `scroll-behavior` guard is the reason FR-010/AC-2 explicitly allows "satisfied vacuously."
  Implementation records which branch it took in the PR description.
- **Fallback content vs. `::before`/`::after`**: no CSS Generated Content glyph is placed on
  `.sk-progress__bar` or its pseudo-elements — unlike `sk-disclosure`'s `::before` marker, this
  component has no decorative glyph needing the `content: '▸' / '';` alt-text-suppression technique.
  If implementation adds any `content`-drawn decoration later, that technique is mandatory per the
  measured accessible-name finding in `adding-a-component.md`.

## Accessibility and overflow observables

These are the concrete, checkable properties the spec's ACs and SCs require, and where each is
verified:

| Observable | Spec ref | Verified by |
|---|---|---|
| `<progress>`'s own `value`/`max` attributes are the only source of the numeric fill — no CSS/generated-content override | AC-1 (US1), SC-001 | `sk-progress.spec.ts`: assert the rendered `<progress>` element's `.value`/`.max` DOM properties equal the fixture's authored attributes, and that no `content` declaration in `sk-progress.css` references `value`/`max`/`counter()` (a static `readFileSync` + regex assertion on the CSS file, matching `sk-transition-matrix.spec.ts`'s own pattern of asserting a *negative* CSS property from source text) |
| Accessible role/name/value/min/max match the label text and `progress` attributes; zero `aria-*` attributes anywhere | AC-1/AC-2 (US2), SC-003 | `sk-progress.spec.ts`, via `axe-playwright`'s accessibility tree query (`getViolations`/`getRoles`-style API already in use) or a direct `page.accessibility.snapshot()` call scoped to the `.sk-progress` host, asserting `role`, `name`, `value`, `valuemin`, `valuemax`; a companion assertion greps the rendered HTML for `aria-` and expects zero matches |
| Layout modifiers preserve markup shape (same 3 children, same order, same attributes) | AC-1/AC-2 (US3) | `sk-progress.spec.ts`: for `Compact`/`Narrow` stories, assert `host.locator(':scope > *')` returns exactly `[label, progress, span]` in that order with identical attributes to the unmodified T10 fixture |
| No horizontal page overflow at narrow viewport / high zoom (long-label, large-total) | AC-1/AC-2 (US4), NFR-003, SC-005 | `sk-progress.spec.ts`: `page.setViewportSize` to a narrow width, then assert `document.documentElement.scrollWidth === viewportWidth` — the exact pattern already established in `sk-team-overview-shell-layout.spec.ts` (`geometry.scrollWidth`/`geometry.viewportWidth`, asserted equal at lines 129–155 and 195–278). Confirmed by grep: no `zoom`-emulation precedent exists anywhere in `apps/storybook/src/tests/` or `packages/styles/src/`, so "high zoom" is verified the same way this repo already verifies it — a narrow viewport, which is optically equivalent for a reflow-based layout — rather than inventing a CSS-zoom probe this codebase has never used |
| Track and fill each remain visible/distinguishable under `forced-colors: active` | AC-3/AC-4 (US4), SC-006 | `sk-progress.spec.ts`: `page.emulateMedia({ forcedColors: 'active' })`, then assert computed `border-color`/`background-color` (or the pseudo-element's resolved paint, sampled the way `sk-transition-matrix.spec.ts` samples computed colours) differ from the page background and from each other — plus the **CI-authoritative** `visual.spec.ts` baseline, since local font/rendering metrics differ from CI (`adding-a-component.md`'s "Visual baseline" section) |
| `sk-progress__meta` text and `progress[value]`/`progress[max]` express the same raw numerator/denominator across every maintained fixture | Edge case, NFR-004, SC-007 | `sk-progress.spec.ts`: iterate every exported fixture constant, parse the `progress` element's `value`/`max` and the `.sk-progress__meta` text, and assert they encode the same underlying pair (either literally, e.g. "5 of 8" against `value=5 max=8`, or as the equivalent percentage) — a **test-authored** consistency check across the fixture set, per `research.md` R-02/R-04, not a runtime component guarantee |
| Reduced motion disables exactly the fill's transition, scoped, if one exists | AC-1/AC-2 (US5), FR-010 | Static assertion in `sk-progress.spec.ts` (or inline in the CSS review) reading `sk-progress.css` for a `@media (prefers-reduced-motion: reduce)` block scoped to the exact selector/property the base rules set — same static-source-read technique `sk-transition-matrix.spec.ts` uses for its z-index absence check |

No Vitest/`fixtures/elements-behaviour/` test is added: that fixture's own mutation contract
(`mutations.json`) is scoped to `behaviours.json` subjects, and this component registers none
(Gate Matrix, "Behaviour/mutation applicability" row).

## Documentation (FR-014)

Add a `sk-progress` section to `docs/design-system/using-components.md`, matching the existing
per-component section shape used for `sk-data-table`/`sk-disclosure`/etc. Content, stated plainly
per FR-014:

- The exact three-part native structure (quoting the markup contract from `data-model.md`).
- That the consumer supplies `value`, `max`, label text, and visible metadata text, and performs all
  arithmetic — the library performs none.
- The full set of supported determinate states (zero, T10 example, complete, large total, long
  label) and the two layout modifiers (`sk-progress--compact`, `sk-progress--narrow`), with what each
  does and does not change (markup shape is invariant; only CSS layout differs).
- A pointer to `docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md`'s
  styles-only class ruling, so a reader understands why no element exists for this component,
  without restating the ADR's reasoning here.
- The invalid-data non-goal: negative/over-max values are explicitly consumer validation, not a
  library concern.

No `docs/architecture/decisions/` edit: this mission makes no new architectural decision — it applies
ADR-10's already-ratified class ruling to a concrete component, which is exactly what `research.md`
already established and this plan does not re-derive.

## Gate Matrix

Every gate below is either run, or explicitly explained as not applicable to a styles-only,
no-element, no-behaviour component. "Focused tests first" ordering follows the charter's
`tactic-test-pyramid-progression` (cheapest, most specific first).

| # | Gate | Command | Applies? | Why / why not |
|---|---|---|---|---|
| 1 | Focused Playwright spec (new) | `npx playwright test apps/storybook/src/tests/sk-progress.spec.ts` (after `npx nx run storybook:storybook:build`) | **Yes — run first** | The mission's own new behaviour surface (accessibility tree, overflow, forced-colors, meta/value consistency); fastest, most specific feedback before broader gates |
| 2 | Typecheck | `node scripts/typecheck-all.mjs` | Yes | `packages/styles` is a TypeScript project (the generated `index.ts` and the authored `.stories.ts`); must stay green |
| 3 | Lint (ESLint + Stylelint + HTMLHint) | `npm run quality:all` | Yes | NFR-001 (token-only CSS) is enforced by `stylelint`'s `declaration-strict-value`; HTMLHint covers the authored `.html` fixtures; ESLint covers the `.ts` story/barrel files |
| 4 | Stylelint only (fast subset, if isolating token failures) | `npm run quality:stylelint` | Yes, as a debugging aid | Requires `packages/tokens/dist/token-catalogue.json` to exist first — run `npx nx run tokens:catalogue` if it's stale (it will not need regenerating unless a token gap is found, per C-004) |
| 5 | Styles-only barrel generation + drift check | `node scripts/build-styles-only-markup.mjs` then `node scripts/build-styles-only-markup.mjs --check` | Yes | This is this component's *only* generated-artifact pipeline; must be committed and must not drift |
| 6 | Element markup generation/drift (`build-element-markup.mjs`) | — | **No** | This component has no `.markup.ts` and no `packages/elements/src/progress/` — the element pipeline never runs against it; confirmed by `stylesOnly()`'s own directory-shape discovery logic, which requires the *absence* of a matching elements directory |
| 7 | Manifest analyzer (`nx run elements:analyze`) | — | **No** | No element to analyze; `custom-elements.json` gains no entry, and `git diff --exit-code -- packages/elements/custom-elements.json` should show **no change** from this mission |
| 8 | React/Vue wrapper generation (`build-react-wrappers.mjs`, `build-vue-types.mjs`) | — | **No** | Generated only from the manifest; no manifest entry exists for this component (FR-012) |
| 9 | `check-manifest-content.mjs`, `check-no-css-in-source.mjs`, `check-elements-entries.mjs`, `check-adopted-css-boundaries.mjs`, `check-element-css-hygiene.mjs`, `check-part-ratchet.mjs` | — | **No** | All six are element-layer gates (manifest docs, CSS-in-`.ts` ban, elements barrel entries, adopted-stylesheet boundary, shadow-root CSS hygiene, `::part()` ratchet) — none apply to a component with no element and no shadow root |
| 10 | `check-story-theme-wrapper.mjs` | `node scripts/check-story-theme-wrapper.mjs` | Yes | Applies to every Storybook story in the repo, including this one's `LightMode` export; confirms `class="sk-light"` is used, not an inert `data-theme="light"` wrapper (C-006) |
| 11 | Behaviour/mutation registry (`behaviours.json`, `mutations.json`, `floor-reporter.mjs`, `suite-selftest.mjs` guard 7) | — | **No** | This component owns no behaviour (ADR-11's required-behaviours list is scoped to elements that own form association/events/focus/keyboard — R-01, E-024). No entry is added, so no registry gate runs against it; SC-010 is the corresponding success criterion |
| 12 | `expected-parts.json` / `check-part-ratchet.mjs` | — | **No** | No `::part()` exists — this ratchet is element-only |
| 13 | `expected-docs.json` / `check-manifest-content.mjs`'s exact-count check | — | **No** | No documented attribute/method exists to count — element-only ratchet |
| 14 | `scripts/check-release-graph.mjs` (subpath-coverage check within it) | `node scripts/check-release-graph.mjs` | Yes | SC-008 requires `packages/styles/package.json`'s `./progress/*` subpath export exist; this script's package-graph checks are the closest standing verification of export-map completeness for the `@spec-kitty/styles` package |
| 15 | Storybook build | `npx nx run storybook:storybook:build` | Yes | Required before gates 1, 16, and 17 (all three load the built static output); also the mechanism by which a wrong/missing story would surface as a build failure |
| 16 | axe-core over all stories | `node scripts/run-axe-storybook.js` | Yes | NFR-002/SC-004; runs unconditionally against every emitted story, this component's included, with no per-component registration step |
| 17 | Playwright full suite (cross-browser) | `npx playwright test` (chromium/firefox/webkit, per `playwright.config.ts`) | Yes | Confirms gate 1's spec and the rest of the repo's Playwright suite pass in all three configured engines — the cross-browser smoke the charter's Testing Standards names, and the mechanism that surfaces `research.md`'s open risk #2 (WebKit `::-webkit-progress-*` coverage) if it regresses anything else |
| 18 | Visual regression (`visual.spec.ts`) | `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts` | Yes, **CI-authoritative** | A new baseline/snapshot set for `sk-progress` (default-dark, LightMode, forced-colors) is added in this PR; local font metrics differ from CI's, so the baseline that matters is the one CI records — confirmed and possibly re-captured post-CI, not trusted from a local run |
| 19 | `npm run quality:all` (repeated as its own named gate per the recipe) | `npm run quality:all` | Yes | Named explicitly in the component recipe's step 7 as distinct from the individual lint invocations above — run once more as the final aggregate check before commit |
| 20 | `git status --porcelain` empty after regeneration | `git add -A && git status --porcelain` | Yes | Confirms gate 5's generated `index.ts`, the `packages/styles/src/index.ts` edit, and the `package.json` export-map edit are all committed — no drift left uncommitted before PR |
| 21 | `node scripts/check-gate-wiring.mjs` | `node scripts/check-gate-wiring.mjs` | Yes | Repo-wide gate that confirms CI actually invokes what this plan lists; a component-scoped mission does not change wiring, but the check is cheap and catches accidental workflow drift from an unrelated concurrent mission (per the run-prompt's "all concurrent missions collide on generated artifacts" rule) |
| 22 | `bash scripts/npm-audit-gate.sh` | `bash scripts/npm-audit-gate.sh` | Yes, but incidental | No new dependency is introduced by this mission; run as a standing gate, not because this mission is expected to change its outcome |
| 23 | `npm run security:lockfile-check` | `npm run security:lockfile-check` | Yes, but incidental | No `package.json`/lockfile dependency change; only the `exports` map field of `packages/styles/package.json` changes, which does not touch the lockfile |
| 24 | `bash scripts/check-action-pins.sh` | `bash scripts/check-action-pins.sh` | Yes, but incidental | No workflow file is touched by this mission |

### Why `ci-quality.yml`'s `components` path filter needs no update

`packages/styles/src/progress/` is covered by the filter's blanket `packages/**` entry (confirmed at
`.github/workflows/ci-quality.yml`, the `components` filter block) — no new path needs adding, per
`research.md` R-09 / E-022.

## Rebase / regenerate / rerun requirements before final review

1. **Rebase onto the current mission branch tip** (and, when this mission is opened as a PR into
   `train/elements-first`, onto that branch's current head) before the final gate pass — a stale
   base can silently reintroduce a generated-artifact conflict in `packages/styles/src/index.ts` or
   `package.json`'s `exports` map if another concurrent mission added an adjacent entry.
2. **Regenerate in dependency order** after any rebase or CSS/HTML edit: gate 5
   (`build-styles-only-markup.mjs`, no flag) before gate 5's own `--check`, before gates 2/3/9/15.
   Committing a hand-edited `index.ts` instead of the generated one is exactly the drift
   `build-styles-only-markup.mjs --check` exists to catch — regenerate, do not hand-patch.
3. **Rerun the full gate matrix** (table above) after any regeneration, not only the gates touching
   the changed file — `npm run quality:all` and gate 20's clean-tree check are the cheapest way to
   confirm nothing else drifted.
4. **Re-run the pre-merge adversarial gate against the final head SHA** before requesting review —
   per this mission's squad tier (C, pre-merge only, stated in spec.md's front matter) no earlier
   point-cut squad is required, but the pre-merge gate is never skipped regardless of tier
   (`elements-first-run-prompt.md` §6). If a push happens after the gate runs, the gate is stale and
   must be re-run against the new head — the SHA pin is load-bearing, not decorative.
5. **Re-capture the CI visual baseline** if gate 18's local run and CI's disagree — take the baseline
   from the `visual-regression-diffs` CI artifact, never from a local screenshot, per
   `adding-a-component.md`'s "Visual baseline" section.
6. **Confirm `apps/demo/dashboard-demo.html` has no diff** (SC-012 / C-005) as a final `git diff`
   check before opening the PR — this mission's entire source-of-truth addition lives under
   `packages/styles/src/progress/` plus the two wiring edits and the documentation/spec files; the
   demo page is explicitly untouched.

## Work package shape

**One work package.** The mission's own spec states independence from every other `#208` child
(C-007) and a self-contained CSS/markup surface with no composition target. Splitting further would
create an artificial seam between, for example, "author the CSS" and "author the fixtures" that the
generator itself does not allow to land separately (the barrel generator needs both to exist before
it produces a non-empty, meaningful `index.ts`, and the Playwright spec needs the generated barrel to
render from). One PR into `train/elements-first`, gated by the matrix above, is the complete,
cohesive unit of delivery this mission requires.

## Complexity Tracking

Not applicable — no Charter Check violation exists for this mission (see Charter Check, above).

## Implementation Concern Map

*Included because, although this mission is a single work package, the plan's own gate matrix and
CSS strategy span distinct architectural areas worth separating for the tasks phase to sequence
correctly within that one work package.*

### IC-01 — Directory scaffold, markup contract, and generated wiring

- **Purpose**: Establish `packages/styles/src/progress/` with all nine-or-ten authored `.html`
  fixtures and the generated `index.ts`, then wire the package barrel and export map.
- **Relevant requirements**: FR-001, FR-002, FR-005, FR-006, FR-012, FR-013.
- **Affected surfaces**: `packages/styles/src/progress/*.html`, `packages/styles/src/progress/index.ts`
  (generated), `packages/styles/src/index.ts`, `packages/styles/package.json`.
- **Sequencing/depends-on**: none — this is the foundation every other concern renders from.
- **Risks**: fixture filenames must produce valid, collision-free JS identifiers through the
  generator's `exportName` transform (Gate Matrix gate 5); get names right the first time to avoid a
  rename cascade into the story file.

### IC-02 — CSS: track/fill, layout modifiers, forced-colors, reduced-motion

- **Purpose**: Author `sk-progress.css` covering the base track/fill visual, the two layout
  modifiers, the forced-colors fill override, and (conditionally) the reduced-motion guard.
- **Relevant requirements**: FR-007, FR-008, FR-009, FR-010, NFR-001.
- **Affected surfaces**: `packages/styles/src/progress/sk-progress.css`.
- **Sequencing/depends-on**: IC-01 (needs the fixtures to render against while authoring).
- **Risks**: the two named execution risks in `research.md`'s "Open questions and risks" — the
  forced-colors override is pattern-following, not yet measured against a real `<progress>`'s
  vendor-prefixed pseudo-elements, and WebKit coverage is locally unverified. Both are resolved by
  gate 17 (cross-browser Playwright) and gate 18 (CI-authoritative visual baseline), not by this
  plan inventing a new measurement step.

### IC-03 — Story file and documentation

- **Purpose**: Author `sk-progress-html.stories.ts` (Default + 8 variants + LightMode) and the
  `docs/design-system/using-components.md` section.
- **Relevant requirements**: FR-011, FR-014.
- **Affected surfaces**: `packages/styles/src/progress/sk-progress-html.stories.ts`,
  `docs/design-system/using-components.md`.
- **Sequencing/depends-on**: IC-01, IC-02 (stories render the generated fixtures against the
  authored CSS; documentation describes the finished contract).
- **Risks**: none beyond the standing `LightMode`/`class="sk-light"` convention (C-006), already
  gated by gate 10.

### IC-04 — Verification: Playwright spec and gate matrix execution

- **Purpose**: Author `apps/storybook/src/tests/sk-progress.spec.ts` covering every observable in
  the Accessibility and overflow observables table, add the `visual.spec.ts` baseline, and run the
  full gate matrix.
- **Relevant requirements**: FR-003, FR-004, NFR-002, NFR-003, NFR-004, all Success Criteria.
- **Affected surfaces**: `apps/storybook/src/tests/sk-progress.spec.ts`,
  `apps/storybook/src/tests/visual.spec.ts` (+ its snapshots directory).
- **Sequencing/depends-on**: IC-01, IC-02, IC-03 (needs the built Storybook output to test against).
- **Risks**: none beyond ordinary authoring risk — the zoom/overflow assertion technique (NFR-003)
  is already confirmed against this repository's real convention (`sk-team-overview-shell-layout.spec.ts`'s
  `scrollWidth`/viewport-width equality check), so this concern reuses an existing pattern rather than
  inventing test infrastructure.
