# Implementation Plan: Native form-select styles

**Branch**: `mission/native-form-select-styles` | **Date**: 2026-09-07 | **Spec**: `spec.md`  
**Input**: issue #211, the governed mission specification and discovery artifacts  
**Base**: `train/elements-first` at `9e6d9731`; rebase onto the latest train before implementation and again before the final gate  
**Squad Tier**: B — mandatory Codex point-cuts after tasks and before merge

## Summary

Add a styles-only `form-select` component whose `.sk-form-select` base class is applied directly
to a native light-DOM `<select>`, plus the sole `.sk-form-select--compact` modifier. Author static
HTML fixtures as the canonical semantic source, generate their TypeScript barrel with the existing
styles-only generator, expose its generated markup from the aggregate TypeScript barrel and its
CSS through a package subpath, document the
native/datalist ownership boundary, and prove the result with cross-browser Playwright semantics,
axe, Storybook, forced-colors, theme, reflow, zoom and visual checks.

No token, element, manifest, React wrapper, behaviour registry or mutation surface is added. The
latest train has all needed input, spacing, border, focus, foreground and status tokens. The
browser owns selection and form mechanics; consumers own options, values, handlers and application
filter/lane state.

## Technical Context

**Language/Version**: authored CSS and HTML; TypeScript stories/tests under repository toolchain  
**Primary Dependencies**: `@spec-kitty/tokens`, existing `@spec-kitty/styles` form-field classes,
Storybook 10.6, Playwright 1.62, axe-playwright  
**Storage**: N/A  
**Testing**: Playwright browser semantics and visual baselines; Storybook/axe; generator drift,
release-graph, lint, stylelint, HTMLHint, TypeScript/Nx and repository quality gates  
**Target Platform**: standards-compliant native select in Chromium, Firefox and WebKit; Linux CI
visual baselines in Chromium  
**Project Type**: monorepo design-system styles primitive  
**Performance Goals**: static CSS/markup only; no script, runtime listener, motion or asynchronous
work; Storybook remains inside the repository's three-minute budget  
**Constraints**: authoritative `--sk-*` token values only; real native descendants and form
semantics; no `appearance:none`, custom arrow or forced-color suppression; generated artifacts
must reproduce exactly  
**Scale/Scope**: two public classes, seven authored fixtures, one story module, one focused browser
test module, focused visual entries and distribution/documentation updates

## Fresh-base reconciliation

The mission was claimed from train `9e6d9731`. A live check during planning found the train at
`f35029a3`; its relevant changes amend ADR-11 and the component recipe with two element-only
behaviours (delegate/rendered-control correspondence and responsive thresholds). Neither applies:
this mission has no element, delegate, runtime behaviour or breakpoint-driven behaviour. The
general rule is still relevant: a purely presentational component owns no `behaviours.json` or
`mutations.json` entries. Rebase before product implementation so authored work and tests use the
latest train and token vocabulary.

## Charter and architecture check

| Rule | Plan disposition |
|---|---|
| Tokens → styles → elements → wrappers | Styles only. Reuse existing tokens; do not create later-layer artifacts. |
| ADR-9 styling ownership | Public styling is on a light-DOM class applied to the native node. No shadow root. |
| ADR-10 canonical markup/distribution | HTML fixtures are authored; per-component `index.ts` is generator-owned and re-exported from the root TypeScript barrel; CSS ships through its package subpath. |
| ADR-11 verification | Applicable semantics are covered in real browsers; generator determinism is checked; element behaviours do not apply. |
| Component recipe | Lowercase hyphenated directory, BEM `sk-` class, required LightMode/axe/visual coverage and generated documentation surfaces. |
| Charter testing | Focused red tests precede implementation; no gate is weakened or skipped. |
| Accessibility | Native semantics are preserved; label/description relationships, keyboard operation, zoom, forced colours and axe are explicit. |
| Generated-file rule | Run generators; never author `form-select/index.ts` by hand. |

**Gate verdict**: PASS. Existing accepted architecture fully covers the work. No new ADR or
decision issue is needed.

## Project Structure

### Governed mission artifacts

```text
kitty-specs/native-form-select-styles-01M1WSXJ/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── research/
│   ├── evidence-log.csv
│   └── source-register.csv
├── tasks.md
└── tasks/WP01-native-light-dom-form-select-styles.md
```

### Authored source and documentation

```text
packages/styles/src/form-select/
├── sk-form-select.css
├── sk-form-select-html.stories.ts
├── sk-form-select-t10-lane.html
├── sk-form-select-t12-filters.html
├── sk-form-select-compact.html
├── sk-form-select-long-options.html
├── sk-form-select-optgroups.html
├── sk-form-select-required-invalid.html
└── sk-form-select-disabled.html

apps/storybook/src/tests/
├── sk-form-select.spec.ts
└── visual.spec.ts

packages/styles/src/index.ts
packages/styles/package.json
expected-stories.json
docs/design-system/using-components.md
packages/elements/SIZES.md
```

### Generated source and visual evidence

```text
packages/styles/src/form-select/index.ts
apps/storybook/src/tests/visual.spec.ts-snapshots/
├── sk-form-select-default-dark-chromium-linux.png
├── sk-form-select-light-chromium-linux.png
├── sk-form-select-compact-chromium-linux.png
├── sk-form-select-invalid-chromium-linux.png
├── sk-form-select-forced-colors-chromium-linux.png
└── sk-form-select-narrow-chromium-linux.png
```

The exact snapshot set may be reduced only if another named visual covers the same issue state;
all required story states remain in `expected-stories.json`. `packages/elements/SIZES.md` is
regenerated because the component recipe requires the shared distribution measurement even though
this styles-only mission adds no element row.

**Structure Decision**: mirror the existing `progress` and `workflow-board` styles-only pattern:
one component directory contains CSS, authored fixtures, generated barrel and story module; browser
tests stay in the central Storybook test app; consumer guidance stays in the public using-components
reference.

## Implementation Concern Map

### IC-01 — Native stylesheet and semantic fixtures

- **Purpose**: introduce the two-class visual API without modifying browser-owned behaviour.
- **Relevant requirements**: FR-001–FR-010; NFR-002–NFR-007; C-001–C-004, C-008–C-010.
- **Affected surfaces**: `packages/styles/src/form-select/*.css`, authored `.html` fixtures.
- **Sequencing/depends-on**: none after fresh-train rebase.
- **Risks**: replacing the UA arrow, hiding focus with `outline:none`, width overflow from long
  selected labels, or treating disabled/invalid state as colour-only.

### IC-02 — Generated distribution and discoverability

- **Purpose**: make authored markup and CSS importable through supported public paths with no drift.
- **Relevant requirements**: FR-012; NFR-003, NFR-008; C-001, C-008.
- **Affected surfaces**: generator-produced `form-select/index.ts`, aggregate TypeScript export,
  `packages/styles/package.json`, generated release/doc surfaces.
- **Sequencing/depends-on**: IC-01 fixtures exist before generator runs.
- **Risks**: hand-authoring generated exports, forgetting the package subpath or aggregate import,
  or allowing generator check to scan an empty/stale set.

### IC-03 — Story and browser evidence

- **Purpose**: prove every required semantic and visual state against live native controls.
- **Relevant requirements**: FR-005–FR-013; NFR-001, NFR-004–NFR-010; SC-001–SC-012.
- **Affected surfaces**: story module, expected story inventory, focused Playwright tests, visual
  suite and snapshots.
- **Sequencing/depends-on**: IC-01 and IC-02 provide importable fixtures/styles.
- **Risks**: asserting operating-system popup pixels, using inert `data-theme="light"`, conflating
  320px reflow with zoom, testing only Chromium, or synthesizing state instead of using native APIs.

### IC-04 — Public native-control guidance

- **Purpose**: state why the primitive remains native and which responsibilities stay with the
  consumer, including the closed-select/datalist distinction.
- **Relevant requirements**: FR-014; SC-013; C-003–C-006.
- **Affected surfaces**: `docs/design-system/using-components.md` and generated component listing
  if required by repository tooling.
- **Sequencing/depends-on**: document the final class names and verified markup from IC-01.
- **Risks**: implying that the design system owns selected state, event handlers or filtering, or
  suggesting #180's datalist is a closed-choice control.

## Test-first implementation sequence

1. Complete the Tier-B post-tasks four-profile Codex point-cut and fold every confirmed finding
   before implementation begins.
2. Rebase onto the live train and rerun the styles-only generator check as a clean baseline.
3. Add focused failing tests and expected story ids for the absent component. Cover source-level
   prohibitions (`appearance:none`, replacement indicator, motion, raw design values) as well as
   the live semantic matrix below.
4. Author the seven canonical HTML fixtures and minimal token-only stylesheet. Reuse the T10/default
   fixture in the Narrow story because narrowness is a viewport axis, not a third class. Keep the UA
   indicator and use native `:focus-visible`, `:invalid` and `:disabled` selectors with an
   additional non-colour state cue where needed.
5. Run `node scripts/build-styles-only-markup.mjs` to create `form-select/index.ts`; re-export that
   generated markup from the root TypeScript barrel and expose CSS separately through
   `./form-select/*`. Regenerate, never edit, shared derived artifacts.
6. Add stories that render only generated fixture constants. `Default` is the T10 lane and
   default-dark evidence route; do not duplicate it as a second `T10Lane` route. LightMode wraps in `.sk-light` and
   proves a computed token-derived difference; forced-colors is exercised through browser media
   emulation, not simulated CSS.
7. Complete browser/axe/visual coverage and documentation, then run focused-to-full gates.
8. At pre-merge, fetch/rebase latest train, regenerate, rerun affected and full gates, push the
   exact head, wait for exact-head CI, and rerun all four Codex adversarial lenses.

## Browser verification matrix

| Contract | Fixture / action | Assertion |
|---|---|---|
| Native structure | all generated fixtures | every `.sk-form-select` is a light-DOM `HTMLSelectElement`; its recursive element descendants are only option/optgroup; form-field/form wrappers are permitted |
| Label association | T10 lane | clicking label focuses the select; accessible name matches label |
| Keyboard choice | T10 lane | Arrow Down changes native selected value |
| Typeahead | option set with unique `d` | typing `d` selects the matching option without library code |
| Submission | T10/T12 real forms | invalid `requestSubmit()` emits zero submit events; after valid selection exactly one canceling submit handler fires and its in-handler `FormData` contains exact pair(s) |
| Reset | changed selection | `form.reset()` restores authored default |
| Required validity | empty placeholder | native `valueMissing`; `:invalid`; described help resolves same-root id |
| Disabled | disabled story | native disabled property; excluded from `FormData`; still legible |
| Option semantics | optgroup story | native tags, labels and authored order preserved |
| Long/narrow | long + narrow at 320px | no page-level horizontal overflow or clipped essential content |
| Full width | Default/T10 | rendered select inline size equals its form-field content-box inline size |
| Themes | default vs LightMode | `.sk-light` exists and at least one token-derived computed style differs |
| Forced colors | forced-colors media | focus, invalid, disabled and native indicator remain discernible |
| Browser zoom | actual desktop Chromium at 200%, exact final SHA | record browser/OS/version, exact story URLs, UI zoom procedure, before/after viewport measurements and screenshots for focused Default, RequiredInvalid and Disabled; indicator/state affordances remain visible and content unclipped |
| Accessibility | required story set | zero axe violations |
| Visual | named closed-control states | approved stable Chromium baselines; never snapshot an open OS popup |

WebKit remains required in CI even when the local Fedora environment lacks its host libraries. A
local environment limitation is recorded as such and cannot be used to remove or weaken the CI
project.

The zoom procedure launches the exact built Storybook head in desktop Chromium, records
`chromium --version` and OS metadata, applies browser UI zoom to 200% (for example the browser's
Ctrl-Plus command confirmed by the reduced CSS viewport), captures Default while focused plus
RequiredInvalid and Disabled, and stores screenshots with the PR evidence. Device-scale-factor,
viewport resizing and CSS `zoom` are not substitutes. Evidence names the exact git SHA and records
before/after `innerWidth`, document `scrollWidth/clientWidth`, indicator visibility and clipping
observations.

## Verification ladder

Run the narrowest relevant commands first, then expand:

1. Focused Playwright module in Chromium; repeat semantic cases in configured Firefox/WebKit where
   locally supported.
2. `node scripts/build-styles-only-markup.mjs --check` and all repository generated-artifact drift
   checks named by the current component recipe.
3. Focused Storybook visual update/compare and axe route coverage.
4. Type checks, Nx lint, stylelint and HTMLHint.
5. Storybook production build plus relevant Playwright and visual-regression suites.
6. `npm run quality:all`, `npm test`, mutation/self-test gates where the repository's full CI
   invokes them, release-graph/tarball checks, and every command required by `CLAUDE.md`/CI.

All final evidence must be rerun after the last rebase or push. No check may be skipped, muted,
deleted, reclassified or given a wider threshold to obtain green.

## Requirement traceability

| Concern | Requirements | Primary evidence |
|---|---|---|
| Native public API | FR-001–FR-004, FR-007–FR-010 | authored CSS/fixtures, source assertions, DOM inspection |
| Native behaviour | FR-005–FR-006, FR-013 | cross-browser Playwright form/keyboard/validity tests |
| Stories/themes/resilience | FR-011, NFR-001, NFR-004–NFR-007, NFR-009 | story inventory, `.sk-light` delta, axe, forced colors, zoom, reflow, visuals |
| Distribution | FR-012, NFR-003, NFR-008 | generator check, exports, release-graph and drift gates |
| Documentation boundary | FR-014, SC-013 | public guide assertions/manual review |
| Repository health | NFR-010 | Storybook build, `quality:all`, full local/CI gates |

## Complexity tracking

No charter violation or new architectural mechanism is proposed. One cohesive work package is the
smallest reviewable unit because CSS, canonical fixtures, generated barrel, stories and browser
proof form one public component contract and cannot independently satisfy issue #211.
