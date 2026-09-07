# Implementation Plan: Native context-navigation styles

**Branch**: `train/elements-first` planning checkout; implementation lane created by Spec Kitty
**Date**: 2026-09-07
**Spec**: [spec.md](./spec.md)
**Input**: live issue #256, approved Repository Dossier UX evidence, and governed discovery artifacts
**Base**: latest observed `origin/train/elements-first` at `753bbf2436960fc6906aa7961b459aa81c7c5d70`; fetch/rebase immediately before implementation and exact-SHA review
**Squad tier**: C — independent Codex review plus all charter-required exact-head lenses before delivery

## Summary

Add `.sk-context-nav` as a styles-only native light-DOM primitive in `packages/styles/src/context-nav/`. One authored token-only stylesheet styles consumer-authored `nav`, grouped headings, native lists/items/anchors, icon and label spans, nested lists, empty copy, and an ordinary overflow link. Authored HTML fixtures are canonical exemplars; `scripts/build-styles-only-markup.mjs` generates their TypeScript barrel. A Storybook module and focused Playwright suite prove native semantics, `aria-current` ownership, link order/tab order, target size, state visibility, nesting, themes, forced colours, RTL, narrow/zoom containment, and no document overflow.

There is no custom element, JavaScript behavior, route/data model, token addition, context-sidebar modification, manifest entry, React wrapper, Vue declaration, behavior registry entry, or mutation subject. One work package is the smallest shippable boundary because publication, exemplars, evidence, and documentation form one static public contract.

## Technical context

**Language/version**: authored CSS and HTML; TypeScript Storybook/Playwright tests under the repository toolchain
**Primary dependencies**: existing `@spec-kitty/tokens`; `@spec-kitty/styles`; Storybook 10.6; Playwright 1.62; axe
**Storage/runtime**: none; no script, listener, asynchronous work, application state, or component instance
**Testing**: generated-source assertions, Playwright across Chromium/Firefox/WebKit where available, Storybook build, axe story crawl, visual baseline gate, repository lint/type/build/release checks
**Target platform**: evergreen browsers rendering native navigation/list/link markup in light DOM
**Performance goals**: zero runtime JavaScript; static CSS/HTML only; no new suite budget or mutation arm
**Constraints**: existing semantic `--sk-*` tokens only; no un-tokened 44px; no theme selector; no invented Team Kitty behavior/data; generated artifacts reproducible
**Scale/scope**: one CSS family with ten named treatments, a compact fixture/story matrix, one focused test file, package export/docs/story ratchets

## Charter and architecture check

| Rule | Plan disposition |
|---|---|
| Token-only styling | Existing surface, foreground, border, radius, typography, weight, size, and spacing tokens express the contract; no token source change is planned. |
| One-directional package graph | Changes stop in `packages/styles`; Storybook consumes the styles package. No element/wrapper layer is added. |
| Native semantic composition | Root class sits on native `nav`; group/list/item/link/heading classes sit on the matching native elements; nested lists remain native. |
| Styles-only ADR-10 ruling | Authored `.html` files are canonical; the per-component `index.ts` is generated. Absence of `packages/elements/src/context-nav/` is deliberate. |
| Accessibility | `aria-current` is the sole current hook; no menu/tree roles, roving tabindex, disclosure, or generated labels; decorative icons remain consumer-hidden. |
| Light theme | `LightMode` uses a real `.sk-light` wrapper and a computed-style delta is asserted. |
| Interaction/motion | CSS owns only ordinary anchor pseudo-states. Prefer no transition; if one is added, reduced-motion disables exactly that transition. |
| Verification/ratchets | Every cited story enters `expected-stories.json`; focused tests and the full local gate suite execute on the exact reviewed SHA. |
| Generated-source integrity | Run the styles-only generator and all shared generators/checks after rebase; verify manifest/React/Vue remain unchanged. |
| Review independence | A separate Codex CLI reviewer inspects the exact implementation SHA; exact-head charter lenses are recorded before acceptance. |

**Gate verdict**: PASS. The plan applies current ADRs and component-authoring instructions without a new architectural exception.

## Project structure

### Mission artifacts

```text
kitty-specs/native-context-navigation-styles-01M1Y3MG/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/context-nav.md
├── research/{evidence-log.csv,source-register.csv}
├── tasks.md
└── tasks/WP01-native-context-navigation-contract.md
```

### Authored implementation and evidence

```text
packages/styles/src/context-nav/
├── sk-context-nav.css
├── sk-context-nav-default.html
├── sk-context-nav-current-nested.html
├── sk-context-nav-empty.html
├── sk-context-nav-empty-overflow.html
├── sk-context-nav-long-labels.html
├── sk-context-nav-scale.html
└── sk-context-nav-html.stories.ts

apps/storybook/src/tests/sk-context-nav.spec.ts
packages/styles/src/index.ts
packages/styles/package.json
expected-stories.json
docs/design-system/using-components.md
```

### Generated/shared artifacts

```text
packages/styles/src/context-nav/index.ts             # generated from authored HTML
packages/elements/SIZES.md                           # regenerate after real builds
apps/storybook/storybook-static/index.json           # build output, not committed
```

No files are added or edited under `packages/elements/src/context-nav/`, `packages/react/src/`, `packages/elements/custom-elements.json`, `packages/elements/vue.d.ts`, `behaviours.json`, or `mutations.json` for this mission. Shared generators are still run as drift checks after each rebase.

**Structure decision**: mirror the current `form-select`, `progress`, and workflow styles-only pattern: one CSS/HTML/story directory, generated local barrel, central browser tests, public package export, story ratchet, and consumer guidance.

## Public CSS and markup design

- `.sk-context-nav`: native `nav`, full-width/min-width containment, font and vertical group rhythm.
- `__group`: optional native section, with a consumer-provided `aria-labelledby` relationship where used.
- `__heading`: native heading reset and muted label typography.
- `__list`, `__item`: native unordered list and list-item reset; no display mode that removes accessibility-tree semantics.
- `__link`: native anchor, minimum block target composed from existing size/space tokens, full inline containment, separate `:hover`, `:active`, `:focus-visible`, and `[aria-current]:not([aria-current="false"])` cues; unconditional neutral `:visited` treatment equal to the unvisited state.
- `__icon`: consumer-owned inline icon alignment/size only; CSS does not insert a glyph or accessible text.
- `__label`: flexible shrink point with `min-inline-size: 0` and `overflow-wrap: anywhere`; full text stays in DOM.
- `__children`: native nested `ul` with tokenized indentation and border/connector hierarchy; child links remain ordinary anchors.
- `__empty-copy`: optional consumer prose with readable muted treatment.
- `__overflow-link`: optional ordinary native link with link/focus affordance, not button/CTA styling.

Current links use `.sk-context-nav__link[aria-current]:not([aria-current="false"])`. The stylesheet does not select `.is-current`, route fragments, DOM position, application nouns, child count, empty state, or overflow state.

## Implementation concern map

### IC-01 — Native stylesheet and canonical fixtures

- **Purpose**: define the complete presentation contract over valid native markup.
- **Requirements**: FR-001–FR-008; NFR-002–NFR-004; C-001–C-005.
- **Surfaces**: `packages/styles/src/context-nav/*.css`, authored `.html` files.
- **Depends on**: latest train token vocabulary.
- **Risks**: a flex child without `min-inline-size: 0` widens the page; `display: contents`/role overrides can compromise list evidence; current and hover can collapse to colour-only.

### IC-02 — Public distribution and generated exemplar barrel

- **Purpose**: expose CSS and canonical markup through supported styles-package paths with one source of truth.
- **Requirements**: FR-011; NFR-007; SC-005.
- **Surfaces**: generated `context-nav/index.ts`, root styles barrel, styles package exports, `SIZES.md`.
- **Depends on**: IC-01 fixture files.
- **Risks**: hand-edited generated barrel, missed export path, stale shared output after another Wave A merge.

### IC-03 — Story and browser evidence

- **Purpose**: prove every required semantic, state, theme, viewport, and resilience case in real browsers.
- **Requirements**: FR-003–FR-009; NFR-001–NFR-006; SC-001–SC-004.
- **Surfaces**: story module, `expected-stories.json`, `sk-context-nav.spec.ts`, visual suite/baselines where repository policy allows local updates.
- **Depends on**: IC-01 and IC-02.
- **Risks**: pseudo-state screenshots asserting nothing; forced-colour story without active emulation; simulated CSS zoom substituted for actual/manual browser zoom.

### IC-04 — Consumer documentation and boundary assertions

- **Purpose**: publish exact native structure and ownership rules so applications do not reintroduce a widget or infer state.
- **Requirements**: FR-010; C-001–C-006; SC-006.
- **Surfaces**: `docs/design-system/using-components.md` and source-level tests that reject adjacent JS/custom-element artifacts.
- **Depends on**: final class and fixture names.
- **Risks**: example vocabulary accidentally becoming a Team Kitty data contract; docs implying a maximum child count or automatic current selection.

## Test-first sequence

1. Fetch latest train before lane implementation and reconcile any new generated files/token contracts.
2. Add focused failing source/Storybook tests for exact class inventory, native tag/relationship invariants, absence of roles/JS/custom-element artifacts, `aria-current`, tab order, target size, state cues, themes, forced colours, RTL, nesting counts, narrow/zoom overflow, and reduced-motion applicability.
3. Author the smallest token-only stylesheet and canonical fixtures that make those tests pass. Keep examples generic and free of routes, inference, counts, or behavior.
4. Generate `context-nav/index.ts`; expose its generated constants from `packages/styles/src/index.ts` and CSS through `packages/styles/package.json`.
5. Add all named stories and ratchet their exact IDs in `expected-stories.json`; add public usage documentation.
6. Run focused Chromium and Firefox checks, then WebKit if locally available, axe, theme/narrow/zoom/forced-colours/reduced-motion checks, all shared generation, type/lint/build/tests, and applicable full gates.
7. Fetch/rebase latest train again, regenerate from source, rerun every claimed command on the final SHA, and confirm no element manifest/wrapper/Vue output changed.
8. Dispatch an independent Codex reviewer on that exact SHA. Fix findings and repeat review. Run the charter’s Tier-C exact-head lens set; any pushed fix invalidates prior evidence and requires a fresh exact-head pass.
9. Open one WP PR targeting `train/elements-first` with `Refs #256`, leave exact-SHA evidence on #256, run Spec Kitty acceptance, and hand off without merging.

## Browser and accessibility matrix

| Contract | Fixture/action | Assertion |
|---|---|---|
| Landmark/group semantics | grouped default | named native navigation; group heading association; native list/listitem hierarchy and DOM order |
| Link naming/icons | text and icon links | names come from text/consumer naming; decorative SVG is `aria-hidden`; no extra accessible node or tab stop |
| Current ownership | top-level, child, parent, explicit `false`, none | only `aria-current` values other than `false` receive current presentation; no parallel state class |
| Visited neutrality | link marked visited through browser history | computed navigation presentation remains equal to the same unvisited state; source explicitly groups `:link` and `:visited` |
| Keyboard order | grouped/nested/overflow | sequential Tab reaches native links once each in DOM order; visible focus is not clipped |
| Pointer states | interactive story/test | hover, active, focus-visible, current cues remain distinguishable, including non-colour border/weight/shape cues |
| Target geometry | primary links | computed target at least 44×44 CSS px, derived from tokens; nested/overflow links remain usable native links |
| Nested scale | one, three, twenty | list counts/order preserved; connector/indentation visible; no page overflow |
| Long content | unbroken repo and prose child | full accessible names; intentional wrapping; no clipped focus/label; no horizontal document overflow |
| Narrow composition | 240px container and 390px viewport | root fits container; `scrollWidth === clientWidth` at document level |
| Zoom | actual browser 200% and 400% on built stories | record browser/version and before/after viewport geometry; no two-dimensional scrolling or content loss |
| Themes | Default vs LightMode | computed token-derived surface/foreground/border differences and zero axe violations |
| Forced colours | active media emulation | focus/current/nested hierarchy remain visible; no reliance on flattened backgrounds |
| Reduced motion | reduce media emulation/source check | no transition exists, or exactly the owned transition is disabled |
| RTL | `dir=rtl` fixture or runtime mutation | logical indentation/connector direction mirrors without overflow |
| Distribution boundary | source/generated diff | styles exports present; no custom element/manifest/React/Vue addition |

## Verification ladder

Dependency setup, if needed, uses `npm ci --ignore-scripts`; no dependency version changes are authorized.

1. `node scripts/build-styles-only-markup.mjs` and `node scripts/build-styles-only-markup.mjs --check`.
2. `npx nx run storybook:storybook:build`; focused `npx playwright test apps/storybook/src/tests/sk-context-nav.spec.ts --project=chromium` and `--project=firefox` (plus WebKit under the repository default suite).
3. `node scripts/run-axe-storybook.js`; relevant visual command from the current CI workflow; manual dark/LightMode, 390px, 240px sidebar, 200%/400% zoom, RTL, forced-colours, and reduced-motion evidence.
4. Regenerate shared outputs exactly as the current component recipe specifies: element CSS/markup, manifest, React wrappers, Vue types; build tokens/styles/elements; then regenerate `SIZES.md` after a real build.
5. Run every drift, manifest, CSS hygiene, part, story-theme, type, lint, generator self-test, and gate-wiring command in `docs/contributing/adding-a-component.md` even where the expected result is “unchanged.”
6. `npm run test`, `node scripts/suite-selftest.mjs`, full `npx playwright test`, Storybook axe, release/security/offline gates wired by CI, and `git status --porcelain` clean after the final commit.

No behavior-bearing branch or JavaScript is introduced, so `behaviours.json`/`mutations.json` are not extended and mutation coverage is not applicable. `suite-selftest.mjs` still runs to prove the global mutation registry remains sound.

## Requirement traceability

| Concern | Requirements | Primary evidence |
|---|---|---|
| Class/native contract | FR-001–FR-008; C-001–C-005 | CSS inventory, generated fixtures, DOM/accessibility assertions |
| Stories/resilience | FR-009; NFR-001–NFR-006 | Story ratchet, browser/axe/theme/forced-colour/narrow/zoom evidence |
| Documentation | FR-010; C-004–C-006 | consumer guide and source-level boundary assertions |
| Distribution | FR-011; NFR-007 | generator/export checks and unchanged manifest/wrapper/Vue diffs |
| Dossier composition | SC-006 | story composed inside public `sk-context-sidebar` slot without shadow-root CSS reach-through |

## Complexity tracking

No charter violation or new mechanism is proposed. One cohesive work package is intentional: the stylesheet cannot be responsibly published without its generated exemplar surface, accessible stories/tests, export wiring, and ownership documentation, and none forms a separable architectural delivery.
