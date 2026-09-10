# Implementation Plan: Connector section navigation

**Branch**: `mission/connector-section-navigation` (topology `single_branch`: this mission's design
artifacts and its single Work Package both land on this branch; no separate lane branch is cut)
**Date**: 2026-09-10
**Spec**: [spec.md](./spec.md)
**Input**: live issue [#337](https://github.com/spec-kitty/spec-kitty-design/issues/337), Family 3
`C6`–`C9a` product evidence, and the current train's own source
**Base**: `origin/train/elements-first@7032cf7792a83ee20d9fd70ddcfb28a057c72884` — fetch/rebase
immediately before implementation and before the exact-SHA review pass
**Squad tier**: C — pre-merge (per programme #335's BRIEF)

## Summary

Add `.sk-section-nav` as a styles-only native light-DOM primitive in
`packages/styles/src/section-nav/`. One authored token-only stylesheet styles a consumer-authored
`<nav>` (with an accessible label) and its native `<a>` children — a horizontal strip of sibling
same-level routes, generalized from Family 3's repeated local `.detail-tabs` CSS in
`C6`-`C9a`. Canonical `.html` fixtures are the authored source; `scripts/build-styles-only-markup.mjs`
generates their TypeScript barrel, following the `.sk-context-nav` (#256/#264) precedent exactly.
A Storybook module and a focused Playwright suite prove: one named navigation landmark with real
links and no tab roles; consumer-owned `aria-current`; rest/hover/active/focus-visible/current
distinction without colour alone; local horizontal overflow containment with an unclipped
scrolled-into-view focus indicator; one/two/three/many-route and permission-subset shapes; the
44px target floor; RTL; forced colors; reduced motion; and native link behaviour (no intercepted
click).

There is no custom element, no JavaScript behaviour, no token addition anticipated, no
`sk-app-shell`/`sk-context-nav`/`sk-nav-pill`/`sk-breadcrumbs` modification, no manifest entry, no
React wrapper, no Vue declaration, no `behaviours.json`/`mutations.json` entry. One Work Package is
the smallest shippable boundary: the stylesheet cannot responsibly ship without its generated
exemplars, its story/accessibility/behaviour evidence, its story ratchet entries, and its
documentation — none of the five is independently releasable without an incomplete or unverified
public surface, matching the issue's own "one bounded Work Package and one PR" instruction.

## Technical context

**Language/version**: authored CSS and HTML; TypeScript Storybook/Playwright tests under the
repository's existing toolchain (no new dependency)
**Primary dependencies**: `@spec-kitty/tokens` (existing tokens only); `@spec-kitty/styles`;
Storybook 10.x (web-components renderer, ADR-13); Playwright; `axe-playwright` via
`scripts/run-axe-storybook.js`
**Storage/runtime**: none — no script, listener, async work, component instance, or application
state anywhere in the family
**Testing**: `scripts/build-styles-only-markup.mjs --check` (generated-barrel drift), a focused
Playwright module under `apps/storybook/src/tests/`, `node scripts/run-axe-storybook.js`
(story-crawl axe), the full local gate ladder in `docs/contributing/adding-a-component.md` §7 scoped
to the styles-only subset (no `packages/elements/**` step applies), and `npm run quality:all`
**Target platform**: evergreen browsers rendering native `nav`/`a` markup in light DOM; no
framework runtime
**Performance goals**: zero runtime JavaScript; static CSS/HTML only; no new `suite-budget.json`
ceiling or mutation arm (the family owns no behaviour, so `behaviours.json`/`mutations.json` are not
extended — same disposition as `.sk-context-nav`)
**Constraints**: existing semantic `--sk-*` tokens only (stylelint's `declaration-strict-value`
against `packages/tokens/dist/token-catalogue.json`); no un-tokened `44px` literal (use
`--sk-space-9`, the token this repo already documents as "the closest token at or above the 44px
NFR-001 floor" — `packages/styles/src/confirm-dialog/sk-confirm-dialog.css:171`); no theme selector
in component CSS (ADR-9 §3 — theme variance lives in tokens, never a `:root[data-theme]`/`.sk-light`
selector inside `sk-section-nav.css` itself, since this is light-DOM CSS with no shadow boundary to
cross but the repo convention is still token-only theming); generated artifacts must be reproducible
**Scale/scope**: one CSS family (root + ~6 named parts), a compact fixture/story matrix sized to
Family 3's own two- and three-route shapes plus one/many/no-current/subset variants, one focused
Playwright test file, package export + docs + story ratchet updates

## Charter and architecture check

| Rule | Plan disposition |
|---|---|
| Token-only styling (SK-D01 / CLAUDE.md §3.1) | Existing surface/foreground/border/space/radius/typography tokens express the whole contract (mirroring `.sk-context-nav.css`'s and `.detail-tabs`'s own token usage in the product evidence); no token-source change anticipated. |
| One-directional package graph (CLAUDE.md §3.2) | Change stops in `packages/styles`; Storybook consumes it. No `packages/elements` directory is created — `@nx/enforce-module-boundaries` is not implicated. |
| ADR-9 (shadow DOM / styling API / label ownership) | Not applicable to this family's own CSS: there is no shadow root here (styles-only, no custom element), so ADR-9's cross-boundary-selector rule has no boundary to cross. It stays relevant only as the reason a **future** `sk-section-nav` element (none is proposed) would need to re-derive label ownership — noted, not acted on. |
| ADR-10 §"Styles-only components are a class, not a fixed exception count" | This mission's "no custom element" instruction is issue #337's own explicit text, not a claim of ADR-10 class membership (see spec.md's Terminology section). The direct **procedural** precedent is `.sk-context-nav` (#256/#264): authored `.html` canonical, generated barrel via `scripts/build-styles-only-markup.mjs`, no `packages/elements/src/section-nav/` directory. |
| ADR-10 §3 (canonical markup) | Authored `.html` files in `packages/styles/src/section-nav/` are the sole authored source; `index.ts` is generated and drift-checked, exactly as `.sk-context-nav`'s and `.sk-breadcrumbs`'s. |
| ADR-11 (verification stack) | No behaviour-bearing branch exists in this family (no form association, no events, no focus scripting, no keyboard handling beyond the browser's own Tab order). `behaviours.json`/`mutations.json` are therefore **not** extended, matching `.sk-context-nav`'s own plan disposition. `suite-selftest.mjs` still runs as a drift/self-test check. |
| Accessibility | `aria-current` is the sole current-state hook; no `tablist`/`tab`/`tabpanel` role, no `aria-controls`, no roving `tabindex`, no arrow-key script — asserted as an explicit absence check per FR-014, not merely omitted. |
| Light theme (CLAUDE.md §3.6) | `LightMode` story uses a real `.sk-light` wrapper class; assert the computed current-location/hover/focus colours differ from the dark default rather than assuming the wrapper works. |
| Motion (FR-012) | If the strip owns any transition (e.g. an underline/border transition on hover or current-state change), `prefers-reduced-motion: reduce` disables exactly that declaration — the `sk-disclosure`/`sk-skip-link` shape from #176, not a wildcard over the subtree. If no transition is authored, this requirement is satisfied vacuously and the story/test says so explicitly rather than asserting against a transition that was never added. |
| 44px target floor | `--sk-space-9` (`3rem` / `48px`) on `min-block-size`, following `.sk-context-nav__link`'s own `min-block-size: var(--sk-space-9)` and `sk-confirm-dialog.css`'s documented floor-token rationale — not an un-tokened `44px` literal. |
| Forced colors / reduced motion baselines (#176 recipe) | `border`/`outline` recolor automatically under `forced-colors: active`; `background`-only current-state cues do not survive it, so the current-location and focus-visible cues must each also carry a `border`/`outline` component, matching `.sk-context-nav.css`'s own `forced-colors` block shape (`border-inline-start-color: Highlight` for current; `outline-color: Highlight` for focus). |
| Verification/ratchets (CLAUDE.md §5, `adding-a-component.md` §4) | New stories are registered in `expected-stories.json` (shrink-only ratchet) in the same commit that adds them. `expected-parts.json`, `expected-docs.json`, and `expected-inert-theme-wrappers.json` are **not** touched — those ratchet element `::part()`/manifest-attribute counts and inert-wrapper counts, none of which this styles-only family has. |
| Generated-source integrity | `scripts/build-styles-only-markup.mjs` (generate) and `--check` (drift) after every fixture edit; `packages/react/src/**`, `custom-elements.json`, `packages/elements/vue.d.ts` are asserted **unchanged** by `git diff --exit-code`, since no element is added. |
| Review independence | A separate reviewer seat reviews the WP diff before acceptance; the programme's Tier-C pre-merge squad runs on the exact implementation SHA before the PR is presented — never self-approved. |

**Gate verdict**: PASS. No ADR amendment, ADR-write, or architectural exception is required. The one
place this plan deliberately does *not* extend an ADR-10 claim (see the ADR-10 row above) is a
scoping choice, not a fork requiring an ADR — issue #337's own text is the binding source for "no
custom element," matching the precedent set by `work-explorer-segmented-choice-styles-01M20C9F`'s
own Terminology section for the identical situation.

## Project structure

### Mission artifacts

```text
kitty-specs/connector-section-navigation-01M26945/
├── spec.md
├── plan.md
├── research.md               # Phase 0 — populated from this plan's own grounding, not invented
├── data-model.md              # Phase 1 — the three public entities from spec.md's ownership section
├── quickstart.md              # Phase 1 — consumer usage snippet
├── contracts/section-nav.md   # Phase 1 — the class/markup contract
└── tasks.md                   # Phase 2 output (/spec-kitty.tasks — not produced by /spec-kitty.plan)
```

### Authored implementation and evidence (created by the WP, not by this design phase)

```text
packages/styles/src/section-nav/
├── sk-section-nav.css
├── sk-section-nav-default.html            # 3-route admin shape, current=middle
├── sk-section-nav-two-route.html          # 2-route member (permission-subset) shape
├── sk-section-nav-one-route.html
├── sk-section-nav-many-routes.html        # 6+ routes, forces local overflow
├── sk-section-nav-no-current.html
├── sk-section-nav-long-labels.html
├── sk-section-nav-html.stories.ts

apps/storybook/src/tests/sk-section-nav.spec.ts
packages/styles/src/index.ts                # export addition
packages/styles/package.json                # subpath export addition, mirroring context-nav's entry
expected-stories.json                        # new sk-section-nav story ids + updated $comment/total
docs/design-system/using-components.md       # new "## Section navigation" doc section
```

### Generated/shared artifacts (regenerated, not hand-authored)

```text
packages/styles/src/section-nav/index.ts      # generated from the authored .html files
packages/elements/SIZES.md                    # regenerated after a real build — unaffected in value
                                               # (no packages/elements change) but the check still runs
apps/storybook/storybook-static/index.json    # build output, never committed
```

No file is added or edited under `packages/elements/src/section-nav/`, `packages/react/src/`,
`packages/elements/custom-elements.json`, `packages/elements/vue.d.ts`, `behaviours.json`, or
`mutations.json`. `packages/elements/SIZES.md`'s **values** are not expected to change (nothing in
`packages/elements` changes), but the regenerate-then-`--check` step still runs as a drift
confirmation per the shared recipe.

**Structure decision**: mirror the `.sk-context-nav` pattern exactly — one CSS/HTML/story directory
under `packages/styles/src/<name>/`, a generated local barrel, a central Playwright test file, a
public package export, a story ratchet entry, and a consumer-documentation section. This is the
closest prior art for "consumer-authored native `nav`/`a` markup, styles-only, generated exemplar
barrel" in this repository.

## Public CSS and markup design

- `.sk-section-nav`: native `<nav>`. Flex row, `overflow-x: auto` (local scroll container),
  `min-inline-size: 0`, `max-inline-size: 100%`, a bottom border dividing the strip from whatever
  content follows (matching the product evidence's `border-bottom` on `.detail-tabs`, expressed as
  `border-block-end` for logical-property compliance).
- `__link`: native `<a>`. `display: inline-flex; align-items: center`, `flex: none` (no shrinking —
  labels keep their natural width and the strip scrolls instead), `min-block-size: var(--sk-space-9)`
  (44px-floor token), a transparent `border-block-end` sized for the current-state cue so the box
  model does not shift when current toggles, distinct `:hover`, `:active`, `:focus-visible`, and
  `[aria-current]:not([aria-current="false"])` treatments. `:link`/`:visited` both resolve to
  `color: inherit` — no forced visited distinction (FR-004).
- Current-location cue: `border-block-end-color` + `font-weight` change (not colour alone),
  mirroring `.detail-tabs a[aria-current="page"]`'s own `border-bottom-color` + `font-weight:
  var(--sk-weight-semibold)` shape from the product evidence, generalized to logical properties.
- `:focus-visible`: `outline` (never `box-shadow` — ADR-176's own recipe notes `box-shadow` does not
  survive `forced-colors: active`), with `scroll-margin-inline` on the link so a focused,
  off-screen-at-rest link scrolls fully into view inside the strip's own `overflow-x` container
  without the browser's native "scroll focused element into view" behaviour clipping the outline
  against the container edge.
- `@media (forced-colors: active)`: recolor the current-location border to `Highlight` and the
  focus outline to `Highlight`, matching `.sk-context-nav.css`'s own block shape; do not rely on
  `background` for either cue in this mode.
- `@media (prefers-reduced-motion: reduce)`: disable exactly the family's own transition (if any is
  authored on the current/hover border or colour change) — no wildcard, following the
  `sk-disclosure`/`sk-skip-link` shape from #176's recipe.

No `.sk-section-nav__group`, `__heading`, `__children`, `__empty-copy`, or `__overflow-link` parts
are proposed — those are `.sk-context-nav`'s grouped/nested/empty-state vocabulary (C-006 excludes
duplicating it) and this family's shape (a flat sibling strip) has no analogous need for them.

## Implementation concern map

### IC-01 — Native stylesheet and canonical fixtures

- **Purpose**: define the complete presentation contract over valid native `nav`/`a` markup.
- **Relevant requirements**: FR-001–FR-012; NFR-002; NFR-005; C-001–C-013.
- **Affected surfaces**: `packages/styles/src/section-nav/sk-section-nav.css`, the authored `.html`
  fixture set.
- **Sequencing/depends-on**: none — first concern.
- **Risks**: a `flex` link without `flex: none` could let a label shrink instead of the strip
  scrolling, defeating FR-005/FR-008; a current-state cue expressed only in `background`/`color`
  fails FR-004/FR-011 under forced colors; a `box-shadow`-based focus ring disappears under forced
  colors (documented repo hazard).

### IC-02 — Public distribution and generated exemplar barrel

- **Purpose**: expose the CSS and canonical markup through supported `@spec-kitty/styles` paths
  with one authored source of truth.
- **Relevant requirements**: FR-017; NFR-003; NFR-004; SC-005.
- **Affected surfaces**: generated `section-nav/index.ts`, `packages/styles/src/index.ts`,
  `packages/styles/package.json`, `packages/elements/SIZES.md` (regenerate-then-check only).
- **Sequencing/depends-on**: IC-01 (fixtures must exist first).
- **Risks**: hand-editing the generated barrel instead of regenerating it; missing the subpath
  export; a stale shared artifact from a concurrent Wave A merge on the train (rebase before final
  evidence).

### IC-03 — Story and browser evidence

- **Purpose**: prove every required semantic, state, theme, viewport, and resilience case in real
  browsers, per FR-014–FR-017.
- **Relevant requirements**: FR-007–FR-017; NFR-001; NFR-003; NFR-005; SC-001–SC-004.
- **Affected surfaces**: `sk-section-nav-html.stories.ts`, `expected-stories.json`,
  `apps/storybook/src/tests/sk-section-nav.spec.ts`.
- **Sequencing/depends-on**: IC-01, IC-02.
- **Risks**: a pseudo-state screenshot that asserts nothing; a forced-colors story without active
  media emulation; simulated CSS zoom substituted for genuine browser zoom; an off-screen-focus
  test that never actually scrolls the container (must assert `scrollLeft`/bounding-rect geometry,
  not just that the element received focus).

### IC-04 — Consumer documentation and boundary assertions

- **Purpose**: publish the exact native structure and ownership rules so a consuming application
  does not reinvent tab semantics or infer route state.
- **Relevant requirements**: FR-002, FR-013, FR-018; C-001–C-013; SC-006.
- **Affected surfaces**: `docs/design-system/using-components.md` (new section).
- **Sequencing/depends-on**: IC-01–IC-03 (final class/fixture names must be stable).
- **Risks**: example markup accidentally reads as Connectors-specific vocabulary (the doc must use
  generic route names, not "Workspace"/"Project routing"/"Team accounts"); docs implying a maximum
  route count or an inferred current state.

## Test-first sequence

1. Fetch/rebase onto the latest `origin/train/elements-first` immediately before implementation;
   reconcile any new generated files or token additions from concurrent Wave A work.
2. Add the focused failing Playwright module and any source-level absence assertions first — the
   missing stylesheet/fixtures/stories fail for the intended reasons (no `.sk-section-nav` class,
   no landmark, no current-state cue) before any implementation CSS exists.
3. Author the smallest token-only stylesheet and the seven canonical fixtures (default 3-route,
   2-route subset, 1-route, many-route/overflow, no-current, long-labels, and any RTL/forced-colors
   variant needed as a distinct fixture rather than a story-level `dir`/media override) that make
   the focused tests pass, following IC-01's design above.
4. Generate `section-nav/index.ts`; wire the root/subpath export in `packages/styles/src/index.ts`
   and `packages/styles/package.json`.
5. Author every required story (administrator/member shapes, first/middle/last/absent current, one
   route, many routes, long labels, narrow/local-overflow, dark default, real `LightMode`, forced
   colors, reduced motion, 200% zoom, short viewport, RTL) and ratchet every story id in
   `expected-stories.json` in the same commit.
6. Turn the full focused contract green in Chromium and Firefox (WebKit where locally available):
   landmark/link semantics, absence of tab roles and arrow-key script, `aria-current` fidelity,
   native-behaviour preservation (no intercepted click), 44px target, non-colour-alone state
   distinction, local-only overflow containment, unclipped scrolled-into-view focus, RTL mirroring,
   forced-colors, reduced-motion.
7. Add the `docs/design-system/using-components.md` section documenting the native structure,
   ownership boundary, and the non-goal boundary against `.sk-context-nav`/`sk-nav-pill`/
   `.sk-breadcrumbs`/`.sk-segmented-choice`.
8. Run every shared generator/drift/hygiene/lint/type/build check named in the Verification ladder
   below, then `npm run test`, `node scripts/suite-selftest.mjs`, the Storybook build, and
   `node scripts/run-axe-storybook.js`.
9. Immediately before independent review, fetch/rebase again on current
   `origin/train/elements-first`, regenerate from source, rerun every claimed command on the final
   SHA, and confirm the element manifest/React wrapper/Vue declaration outputs are byte-for-byte
   unchanged (`git diff --exit-code` over those paths).
10. Dispatch a separate reviewer seat on the exact SHA (never self-approved); fix findings and
    repeat review; run the programme's Tier-C pre-merge squad; open one PR into
    `train/elements-first` with `Closes #337` and `Refs #335` (never a closing keyword on #335
    itself), and hand off without merging (operator merges — never-merge-prs).

## Browser and accessibility matrix

| Contract | Fixture/action | Assertion |
|---|---|---|
| Landmark/link semantics | default 3-route story | one named navigation landmark; every destination a native `<a>`; zero `tablist`/`tab`/`tabpanel` roles anywhere in the subtree |
| No arrow-key/roving-tabindex script | source scan + live Tab | no keydown handler for arrow keys anywhere in the family's code; every link has its natural (unset) `tabindex` |
| Current ownership | first/middle/last/absent, explicit `aria-current="false"` | only `aria-current` values other than `"false"` receive current presentation; no parallel state class |
| Native link behaviour | default story, no listeners attached beyond the family's own (none) | every link is a real, unwrapped `<a href>` in `document.links`; no `preventDefault`-capable listener from the family's own code |
| Non-colour-alone states | rest/hover/active/focus-visible/current, computed-style diff | each state differs from its neighbours by a non-colour property (border/weight/underline) in addition to any colour change |
| Target geometry | every link | computed target at least 44×44 CSS px, derived from `--sk-space-9` |
| Local overflow containment | many-route (6+) fixture in a fixed-width host | `document.scrollWidth === document.clientWidth`; the strip's own `scrollWidth > clientWidth` |
| Scrolled-into-view focus | Tab to the last, off-screen-at-rest link | the link's bounding rect is fully inside the strip's visible scroll region after focus; its focus outline is not clipped |
| Permission subset / no reserved space | 2-route member fixture | exactly two links render, in given order, with no gap/placeholder for the omitted third |
| Long labels | long-label fixture at ≈320px host | full accessible name retained; no clipped label; no document-level overflow |
| Themes | default vs `LightMode` | computed token-derived colour/border differences; zero axe violations in both |
| Forced colors | active media emulation | current-location border and focus outline both remain visible via `border`/`outline` recolor, not `background` |
| Reduced motion | reduce media emulation/source check | no transition exists, or exactly the owned transition is disabled |
| RTL | `dir="rtl"` fixture | logical-property mirroring; no added overflow |
| Zoom / short viewport | 200%/400% browser zoom; short-viewport composition | no two-dimensional document scrolling; no content loss; before/after geometry recorded |
| Distribution boundary | source/generated diff | styles export present; `custom-elements.json`/React/Vue outputs unchanged |

## Verification ladder

Dependency setup, if needed, uses `npm ci --ignore-scripts`; no dependency version change is
authorized by this plan.

1. `node scripts/build-styles-only-markup.mjs` then `node scripts/build-styles-only-markup.mjs --check`.
2. `npx nx run storybook:storybook:build`; focused
   `npx playwright test apps/storybook/src/tests/sk-section-nav.spec.ts --project=chromium` and
   `--project=firefox` (WebKit under the repository's default full suite where available). Per the
   programme BRIEF's environment hazard, acquire the Playwright port lock first:
   `flock /home/jeroennouws/dev/spec-kitty-design-missions/_program-335/.playwright.lock -c '<cmd>'`,
   and check `pgrep -af "playwright|storybook"` for a foreign run before starting.
3. `node scripts/run-axe-storybook.js`; the visual-regression command named in
   `docs/contributing/running-quality-checks.md` (`npx playwright test
   apps/storybook/src/tests/visual.spec.ts`), taking baselines from CI rather than a local
   `--update-snapshots` run (visual baselines are CI-authoritative); manual/recorded evidence for
   dark, `LightMode`, ≈320px narrow, 200%/400% zoom, RTL, forced-colors, and reduced-motion.
4. Regenerate shared outputs per the current component recipe even though none is expected to
   change: `node scripts/build-elements-css.mjs`, `node scripts/build-element-markup.mjs`,
   `npx nx run elements:analyze`, `node scripts/build-react-wrappers.mjs`,
   `node scripts/build-vue-types.mjs`; then `npx nx run-many --target=build
   --projects=tokens,styles,elements` and `node scripts/measure-elements-sizes.mjs` (build before
   measuring — SIZES.md reads `dist/` and does not build it).
5. Drift checks: `node scripts/build-elements-css.mjs --check`,
   `node scripts/build-element-markup.mjs --check`, `node scripts/build-react-wrappers.mjs --check`,
   `node scripts/build-vue-types.mjs --check`,
   `git diff --exit-code -- packages/elements/custom-elements.json`,
   `node scripts/measure-elements-sizes.mjs --check`.
6. Content/hygiene gates: `node scripts/check-manifest-content.mjs`,
   `node scripts/check-no-css-in-source.mjs`, `node scripts/check-elements-entries.mjs`,
   `node scripts/check-adopted-css-boundaries.mjs`, `node scripts/check-element-css-hygiene.mjs`,
   `node scripts/check-part-ratchet.mjs`, `node scripts/check-story-theme-wrapper.mjs`,
   `node scripts/check-story-theme-wrapper.mjs --selftest`, `node scripts/typecheck-all.mjs`,
   `npm run quality:all` (ESLint + Stylelint + HTMLHint).
7. `node scripts/build-react-wrappers.mjs --selftest`, `node scripts/check-manifest-content.mjs
   --selftest`, `node scripts/check-gate-wiring.mjs`.
8. `git add -A && git status --porcelain` — must be empty before opening the PR.
9. `npm run test` (Vitest, both browser and node lanes), `node scripts/suite-selftest.mjs`
   (mutation-registry self-test — no new subject is added, so this proves the global registry
   stays sound rather than exercising a new arm), `npx nx run storybook:storybook:build && node
   scripts/run-axe-storybook.js`.
10. `bash scripts/npm-audit-gate.sh`, `npm run security:lockfile-check`,
    `bash scripts/check-action-pins.sh` (only if `.github/workflows/` is touched — not anticipated),
    `node scripts/check-adr-index.mjs` (only if an ADR file is touched — not anticipated by this
    plan).

No behaviour-bearing branch or JavaScript is introduced, so `behaviours.json`/`mutations.json` are
not extended and mutation coverage is not applicable to this family, matching `.sk-context-nav`'s
own disposition. `scripts/suite-selftest.mjs` still runs to prove the existing registry remains
sound.

## Requirement traceability

| Concern | Requirements | Primary evidence |
|---|---|---|
| Class/native contract, no tab roles | FR-001–FR-004, FR-009–FR-012; C-001–C-013 | CSS inventory, generated fixtures, accessibility-tree absence assertions |
| Native behaviour preservation | FR-003 | listener-audit + modified-click behavioural assertion |
| Containment/overflow/target/focus | FR-005–FR-008, FR-010; NFR-005 | local-overflow + scrolled-into-view + target-geometry assertions |
| Stories/resilience | FR-017; NFR-001, NFR-003, NFR-005 | story ratchet, browser/axe/theme/forced-colour/RTL/zoom evidence |
| Copy ownership | FR-013 | source scan for hardcoded strings; consumer-supplied-only stories |
| Documentation | FR-018; C-001–C-013 | consumer guide section, boundary prose |
| Distribution | NFR-004; SC-005 | generator/export checks; unchanged manifest/wrapper/Vue diffs |
| Family 3 composition | SC-006 | fixture reproducing the administrator/member shapes with no provider vocabulary |

## Complexity tracking

No charter violation and no new architectural mechanism is proposed. One cohesive Work Package is
intentional and required by the issue's own instruction: the stylesheet cannot be responsibly
published without its generated exemplar surface, its accessible stories/tests, its export wiring,
its story ratchet entries, and its ownership documentation, and none of these forms a separable
architectural delivery.
