# Implementation Plan: `.sk-button` busy axis

**Branch**: `mission/button-busy-axis` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/button-busy-axis-01M25DE5/spec.md`,
`research.md` (authored alongside this plan).

## Summary

Extend the existing shadow-DOM `sk-button` element and its `packages/styles/src/button/sk-button.css`
sheet with one additive axis: a reflected `busy` boolean property, a `.sk-button--busy` root-class
modifier (an ordinary root-class modifier — confirmed against ADR-15, `sk-button.css`'s only `:host`
rule is `display: inline-flex`, no `container-type`, so no wrapper element is needed), and a
decorative, non-flow-participating activity cue drawn on a `::after` pseudo-element positioned
`absolute` inside the button's existing padding box. Because the cue never participates in flex-row
sizing, its presence or absence under `.sk-button--busy` cannot change the button's own
`getBoundingClientRect()` box — this is the mechanism, not an assertion, behind FR-006's zero-shift
requirement. The static markup module (`sk-button.markup.ts`) gains a matching `busy` option so the
identical class list reaches both consumption paths from one CSS source (ADR-10 §3). One existing
test file (`fixtures/elements-behaviour/src/sk-button.test.ts`) is extended in place; one new
Playwright spec (`apps/storybook/src/tests/sk-button.spec.ts`) is added for narrow-width/zoom/RTL,
since no such file exists for `sk-button` today. This is one cohesive, PR-sized work package, per
#305's own "one bounded Work Package and one PR" delivery line (C-001).

## Technical Context

**Language/Version**: CSS (authored, `--sk-*` tokens including `--sk-motion-*`) / TypeScript (Lit
element, markup module — both hand-authored; `.css.js`/`.css.d.ts`, `custom-elements.json`,
`packages/react/src/**`, `packages/elements/vue.d.ts`, `SIZES.md` are generated). No new JavaScript
behaviour (no timer, no request, no event) is introduced.
**Primary Dependencies**: `@spec-kitty/tokens` (existing `--sk-motion-*`, `--sk-space-*`,
`--sk-border-*`, `--sk-fg-*` tokens only — no new token category, NFR-005). Lit 3.x (`SkButton`
already extends `LitElement`). Storybook 10.x (`@storybook/web-components`) for stories. Vitest in
browser mode (Playwright provider) for `fixtures/elements-behaviour/src/sk-button.test.ts`. Playwright
+ axe for the new `apps/storybook/src/tests/sk-button.spec.ts` and `run-axe-storybook.js`.
**Storage**: N/A.
**Testing**: Extends `fixtures/elements-behaviour/src/sk-button.test.ts` in place (same file, new
`test()` blocks) — this file already establishes every technique this mission needs: `mount()` +
`updateComplete` for the shadow-DOM lifecycle, `getBoundingClientRect()` for pixel-precision geometry
(already used for the 40px icon-square assertion), `toHaveAccessibleName()` for the accessible-name
assertions, and `partOf()` for querying the rendered control. Reduced-motion and forced-colors are
verified by parsing the raw authored `sk-button.css` (`?raw` import) into a `CSSStyleSheet` and
inspecting its `CSSMediaRule`s directly — the exact technique
`fixtures/elements-behaviour/src/sk-status-indicator.test.ts`'s "authored pulse CSS has ... fallbacks"
test already uses, not runtime `page.emulateMedia` — because it asserts the authored CSS itself
carries the guard, independent of any single browser's runtime interpretation. Narrow-width/200%-zoom
and RTL/logical-layout are added as a **new** Playwright spec,
`apps/storybook/src/tests/sk-button.spec.ts`, using the `story()`-plus-`page.setViewportSize()`
technique `sk-copy-field.spec.ts` already establishes — no such file exists for `sk-button` today
(confirmed: `find apps/storybook/src/tests -iname '*button*'` returns only pre-existing
`visual.spec.ts` snapshot PNGs, no spec file).
**Target Platform**: Evergreen browsers via the Storybook static build; Chromium/Firefox locally,
WebKit CI-authoritative only (this host cannot launch WebKit — the already-recorded ADR-15 gap).
**Project Type**: In-place extension of an existing `packages/elements/src/button/` +
`packages/styles/src/button/` component pair; no new package, no new Nx project, no new
`packages/styles/package.json` export-map entry (`./button/*` already exists from #79).
**Performance Goals**: N/A beyond the charter's static-presentational-component baseline; the cue
animation reuses existing `--sk-motion-duration-*`/`--sk-motion-ease-*` tokens, introducing no new
token category.
**Constraints**: Component owns neither `disabled` nor `aria-disabled` (C-002); no live region /
announcement (C-003); no shared cue primitive with `sk-progress`/#306 (C-004); not a general-purpose
spinner (C-005); no request/timer/mutation ownership, SaaS #1520 untouched (C-006); `LightMode` uses
`class="sk-light"` (C-007); static form freezes now per ADR-15 (C-008); no repo-wide #286 gate
(C-009); cross-mission decision consumed, not relitigated (C-010).
**Scale/Scope**: Three source files edited (`sk-button.css`, `sk-button.ts`, `sk-button.markup.ts`),
one stories file extended, one behaviour test file extended, one new Playwright spec file, four
ratchet/generated-artifact families re-run (`expected-docs.json`, `expected-stories.json`,
`custom-elements.json`, `packages/react/src/**`/`vue.d.ts`, `SIZES.md`). No new package, no new
directory, no migration.

## Charter Check

*GATE: re-checked here for Phase 1 design; `research.md` already satisfies Phase 0.*

| Charter clause | How this plan satisfies it |
|---|---|
| Every component requires a Storybook story covering default, interactive states, responsive breakpoints | New exports on `sk-button.stories.ts`: `Busy` per tone, `BusySmall`, `BusyIcon`, `BusyDisabled`, `BusyAriaDisabled`, `Idle` (already exists as the tone stories — reused for comparison), plus `LightMode` extended to include a busy fixture (FR-013) |
| axe-core zero WCAG 2.1 AA violations, both default and LightMode | `run-axe-storybook.js` runs unconditionally against every emitted story, including the new busy ones — no opt-in step needed |
| Visual diff against reference screenshots | `visual.spec.ts` gains new chromium-only baseline entries for the busy stories, matching this repository's existing chromium-only VR policy |
| Component documents its token dependencies | `sk-button.css`'s header comment gains the busy cue's token dependencies (`--sk-motion-*`, the cue's color/border tokens) |
| ADR-11 required-behaviours list, only where the component owns behaviour | `sk-button` is already a declared subject of SC-010 (property-before-upgrade), SC-013 (styling API), and SC-014 (style adoption) in `behaviours.json`. The busy axis adds no form association, no new event, and no focus/keyboard change, so **no new applicable id** is triggered and `behaviours.json`'s subject list needs no new entry — confirmed against `tests/node/config-contract.test.ts`'s pinned ADR-11 id set (SC-002 through SC-017, SC-023 inapplicable), not assumed. `mutations.json` MAY gain additional arms under the three already-declared ids (e.g. an SC-013 arm covering the busy cue's own targetability, if a `::part` is added — see "Parts" below) as a tasks-phase decision, never a new id |
| CSS uses only `--sk-*` tokens, no hardcoded value outside the token file | NFR-001; the cue's animation duration/easing come from `--sk-motion-*`, its color/border from existing `--sk-fg-*`/`--sk-border-*` tokens (see "Token inventory" below) |
| ADR-15 (static form of element-backed CSS) | **Confirmed not to apply beyond the "ordinary root-class modifier" case, not assumed.** `git grep -nE ':host|::slotted|container-type|::part' packages/styles/src/button/sk-button.css` at this mission's base returns exactly one match — `:host { display: inline-flex; }` — which ADR-15's own table rules is the one `:host` form whose static-path collapse "just works" (`adding-a-component.md`'s own table: `display: …` → "the collapse holds"). The busy axis adds no new `:host` rule, so this remains true after the mission (SC-013 equivalent, verified below) |
| Cross-mission pairing decision (#305/#306) resolved before either freezes its own contract | Resolved in `spec.md`'s linked reference to `progress-indeterminate-01M25C78/spec.md`'s Cross-Mission Decision section. This plan's cue design (a `::after` pseudo-element, not a `<progress>`, not independently exposed to the accessibility tree) is the concrete implementation of that ruling's binding constraints |

No charter violation requires justification. Complexity Tracking is not filled.

## Project Structure

### Documentation (this mission)

```
kitty-specs/button-busy-axis-01M25DE5/
├── spec.md               # this mission's outcome, requirements, and links to the TKT5/TKT6 ruling
├── plan.md               # this file
├── research.md            # token inventory, cue-technique measurement risk, #286 decision detail
└── tasks/                 # authored in the tasks phase
```

### Source Code (repository root)

```
packages/styles/src/button/
└── sk-button.css                      # EDITED — .sk-button--busy rule block, @keyframes, extended
                                        # reduced-motion and forced-colors blocks, header comment
packages/elements/src/button/
├── sk-button.ts                       # EDITED — `busy` reflected Boolean property, cue markup in
│                                       # render() (a `<span part="busy-cue" aria-hidden="true">` OR
│                                       # a pure CSS ::after — see "Cue: DOM node vs. pure CSS" below)
├── sk-button.markup.ts                # EDITED — `busy` option threaded through
│                                       # ButtonStaticOptions / buttonClasses / buttonStaticHtml /
│                                       # BUTTON_AXES (a `Busy` export)
├── sk-button.css.js / .css.d.ts       # GENERATED — re-run via build-elements-css.mjs, no hand-edit
└── sk-button.stories.ts               # EDITED — new busy story exports
fixtures/elements-behaviour/src/
└── sk-button.test.ts                  # EDITED — busy/idle geometry (idle→busy→idle), busy+disabled,
                                        # busy+aria-disabled, accessible-name parity, reduced-motion
                                        # and forced-colors CSS-rule assertions, static markup module
                                        # busy option coverage
apps/storybook/src/tests/
└── sk-button.spec.ts                  # NEW — narrow-width/200%-zoom containment, RTL/logical-layout
                                        # rendering, using the story()+setViewportSize() technique
                                        # sk-copy-field.spec.ts already establishes
custom-elements.json, packages/react/src/**, packages/elements/vue.d.ts, packages/elements/SIZES.md
                                        # GENERATED — regenerated and committed, never hand-edited
expected-docs.json, expected-stories.json
                                        # EDITED — sk-button attribute/story counts, `total` bumped
```

No file outside the above is touched. `packages/styles/package.json`'s `./button/*` export and
`packages/styles/src/index.ts`'s button re-export already exist from #79 and need no change.

## Cue design — DOM node vs. pure CSS, and why a DOM node wins

Two candidate techniques were weighed:

1. **Pure CSS `::after`** on `.sk-button--busy`, `position: absolute`, sized and positioned entirely
   in CSS, carrying `content: ''`. Zero markup-module or `render()` change; the busy class alone
   would suffice, and the static path would get the cue for free from the shared stylesheet with no
   markup change at all.
2. **A real shadow-DOM node** — `<span part="busy-cue" aria-hidden="true"></span>` rendered inside
   `render()` only when `busy` is true, styled by `.sk-button--busy .sk-button__busy-cue`, absolutely
   positioned the same way.

**Decision: a real DOM node (option 2), declared with `@csspart busy-cue`.** Reasons:

- **The static path needs the cue too**, and the static form has no `render()` to conditionally emit
  a pseudo-element's *presence* — CSS `::after` would work identically for both paths only if the
  cue's visibility is driven purely by the `.sk-button--busy` class, which is true for either
  technique. The deciding factor is elsewhere.
- **FR-011 (single accessible name, no competing widget) is verified by inspecting the shadow tree
  for the absence of a second accessible object.** A `content: ''` pseudo-element is never part of
  the accessible tree in any engine (empty generated content contributes nothing), so this holds for
  either technique — not a deciding factor either.
- **The deciding factor is testability against this repository's own established pattern.** Every
  existing `::csspart` on `sk-button` (`part="button"`) is a real node, targeted with
  `partOf(el)` / `el.shadowRoot!.querySelector('[part="..."]')` in the existing test file. A
  pseudo-element cannot be targeted this way — `check-part-ratchet.mjs` and the existing test
  infrastructure both assume a queryable node behind every declared part. A real node keeps the cue
  inspectable (`getComputedStyle`, geometry, `aria-hidden` presence) with the same tooling the rest
  of this file already uses, rather than requiring a second, bespoke pseudo-element-inspection
  technique alongside the one this mission already needs for reduced-motion/forced-colors.
- **A real node also makes "reserves its own space without shifting the box" independently
  verifiable**: the test can assert the node exists in the DOM at all times `busy` is set, is
  `position: absolute` (so it is out of flow), and that its mere presence changes nothing about the
  button's own `getBoundingClientRect()` — three independent assertions a pseudo-element would only
  let this mission make by proxy (computed style of a `::after` selector, never the rendered box
  itself, since pseudo-elements have no `getBoundingClientRect()` access from outside newer
  `::highlight()`/`CSS.highlights` machinery this repo does not use).

**Consequence for the ratchets (FR-016, revising the spec's provisional "no new part" note):** this
decision adds `busy-cue` to `expected-parts.json`'s `sk-button` entry (`["button", "busy-cue"]`,
`total` bumped) and a `[SC-013]` mutation-fixture pair, in the same PR as the test targeting it, per
`adding-a-component.md` step 4's rule that a new part requires "a test targeting it" in the same PR.
`expected-parts.json` is shrink-only in the other direction (parts may be removed, never added
silently) — this mission adds one, in the same commit as its test, satisfying that gate rather than
tripping it.

**The cue node itself:** `aria-hidden="true"` unconditionally (not conditional on `busy`), so its
mere existence in the DOM before/after `busy` toggles is never itself an accessibility-tree change —
only its CSS-driven visibility/animation state changes. It carries no text content (`FR-007`), and is
rendered whenever the element exists (not conditionally added/removed by `render()`), so that its
DOM presence is not itself an extra variable in the layout-shift measurement (FR-006) — only CSS
`visibility`/`opacity` and `animation-play-state`, keyed off `[busy]`, change between idle and busy.

## CSS strategy — the busy rule, motion, and forced-colors

```css
/*
 * Busy: a decorative, non-flow-participating activity cue. `position: absolute` keeps it OUT OF
 * FLEX-ROW SIZING at all times — its own presence in the DOM (see sk-button.ts) never changes
 * .sk-button's own box, whether [busy] is set or not. This is the mechanism FR-006's idle/busy/
 * idle geometry test measures, not an assumption the test merely restates.
 */
.sk-button__busy-cue {
  position: absolute;
  inset-inline-start: var(--sk-space-2); /* sits inside the existing padding box; DOES NOT reduce
                                             available label width because it is out of flow */
  inline-size: 1em;   /* or a fixed token-driven size — measured against real rendering, see
                          research.md's carried-forward risk */
  block-size: 1em;
  border-radius: 50%;
  border: var(--sk-border-width-2) solid var(--sk-border-default);
  border-top-color: var(--sk-fg-default); /* or a tone-appropriate foreground token per variant —
                                              see "Token inventory" below for the per-tone mapping */
  visibility: hidden;
  opacity: 0;
}

:host([busy]) .sk-button__busy-cue {
  visibility: visible;
  opacity: 1;
  animation: sk-button-busy-spin var(--sk-motion-duration-slow) linear infinite;
}

@keyframes sk-button-busy-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  :host([busy]) .sk-button__busy-cue {
    animation: none;
    /* the frozen frame must be VISIBLE and DISTINGUISHABLE from idle — border-top-color already
       differs from border-color at rest, so the frozen ring reads as "partial", not "absent" or
       "complete"; measured against real rendering, not assumed (research.md risk item) */
  }
}

@media (forced-colors: active) {
  :host([busy]) .sk-button__busy-cue {
    /* border/outline survive forced-colors automatically (adding-a-component.md's own guidance);
       background/box-shadow do not. This cue is border-drawn already, so no forced-colors override
       should be needed beyond confirming the automatic remap is visually sufficient — measured
       during implementation, not assumed */
  }
}
```

The exact size, inset, and per-tone color mapping are implementation-phase measurements against the
real built stylesheet and real rendering at `--sm`/`--icon` — `research.md`'s one carried-forward
risk item, mirroring #306's own plan pattern of fixing the *technique* here and deferring the
*specific values* to implementation, verified against FR-006/FR-009/FR-010/SC-002/SC-005/SC-006
rather than assumed.

**`--icon` sizing note.** `.sk-button--icon` is already a fixed `width`/`height` box
(`var(--sk-space-8)` square) with `padding: 0`. The cue's `inset-inline-start: var(--sk-space-2)`
placement must be re-measured for this variant specifically — an icon button's slotted glyph already
occupies the full box, so the cue's absolute positioning may need a size-specific override
(`.sk-button--icon .sk-button__busy-cue { inset-inline-start: ...; inline-size: ...; }`) rather than
one fixed inset serving all three sizes. This is named explicitly so implementation does not assume
the default-size inset transfers unchanged to `--icon`.

## Token inventory (confirmed against `packages/tokens/src/tokens.css`, not invented)

| Use | Token | Source line |
|---|---|---|
| Cue rotation duration | `--sk-motion-duration-slow` (320ms) or `--sk-motion-duration-base` (200ms) — decide by measured perceived speed, not by default to the largest value | `packages/tokens/src/tokens.css:301` |
| Cue easing (if not linear) | `--sk-motion-ease-out` / `--sk-motion-ease-in-out` | `packages/tokens/src/tokens.css:302-303` |
| Cue inset from the padding edge | `--sk-space-2` (8px) or `--sk-space-1` (4px) for `--sm` | `packages/tokens/src/tokens.css:234-235` |
| Cue border width | `--sk-border-width-1` / `--sk-border-width-2` (existing pattern: forced-colors uses `-1` for rest state, `-2` for the active/pulsing state, per `sk-status-indicator.css`'s own precedent) | `packages/tokens/src/tokens.css:199-200` |
| Cue resting border color | `--sk-border-default` | `packages/tokens/src/tokens.css:196` |
| Cue active arc color, per tone | `--sk-fg-on-primary` on `--primary` (matches the dark ink already used for primary's text), `--sk-fg-default` on `--secondary`/`--ghost`/base (matches their existing text color) — reusing each tone's own existing foreground token rather than inventing a cue-specific one | `packages/tokens/src/tokens.css:184,192` |

No new token category is introduced (NFR-005); every value above already exists in
`packages/tokens/src/tokens.css` at this mission's base.

## Disabling-mechanism independence (FR-003, FR-004, FR-005, C-002)

`sk-button.css`'s existing disabled rule is `.sk-button:disabled, .sk-button[disabled] { opacity:
0.4; cursor: not-allowed; }` — keyed on the platform's own `:disabled` pseudo-class and the reflected
`[disabled]` attribute. The busy rule set above is keyed **exclusively** on `:host([busy])` /
`.sk-button--busy`. Neither selector set references the other, so:

- `busy` + `disabled` together: both rule sets apply independently — the button dims (existing
  behaviour, unchanged) AND the cue is visible (new behaviour) AND the platform excludes it from the
  tab order (native `disabled`, unmodified by this mission).
- `busy` + `aria-disabled="true"` (no native `disabled`): the busy rule set applies; the disabled
  rule set does **not** (it has no `[aria-disabled]` branch and this mission adds none) — so the
  button is not dimmed, remains focusable, and shows the cue. This is the concrete mechanism behind
  FR-005, not merely a claim: `sk-button.ts`'s `render()` has never read `aria-disabled` and this
  mission adds no such read.
- `sk-button.ts`'s `disabled` reactive property continues to bind only `?disabled=${this.disabled}`
  on the `<button>` branch (never the `<a>` branch — unchanged, existing, tested behaviour); this
  mission adds no new read or write of `disabled` or `aria-disabled` anywhere in `render()`.

## Static form (FR-002)

`ButtonStaticOptions` gains `busy?: boolean`. `buttonClasses(variant, size, busy)` appends
`sk-button--busy` when true (mirroring the existing variant/size append pattern —
`isButtonVariant`/`isButtonSize`-style validation is not needed for a boolean). `buttonStaticHtml`
threads the same option through to its class-list call on both the `<button>` and `<a>` branches. A
`Busy` entry is added to `BUTTON_AXES` (`{ busy: true, variant: 'primary' }`), giving the static path
its own published busy exemplar, matching the existing rationale in the module's own comment for why
`BUTTON_AXES` entries are declared rather than derived. **The static form emits no cue markup at
all** — the static consumer imports the same generated `sk-button.css`, and the `.sk-button__busy-cue`
node does not exist in the flattened static markup (no shadow root, no `render()`), so a static
consumer wanting the visual cue authors it themselves, the same way ADR-15's "what a static consumer
must author instead" pattern already establishes for other constructs. **This is stated explicitly
in `sk-button.css`'s header comment and the markup module's own doc comment**, so a future reader
does not assume the static path renders an equivalent cue automatically. `spec.md`'s FR-002 is
satisfied by the shared class name and shared stylesheet, not by parity of the decorative node.

## Accessibility (FR-007, FR-008, FR-011)

- Accessible name: unchanged mechanism — `aria-label` forwarded from `label`, or slot content.
  The busy cue node carries `aria-hidden="true"` unconditionally, so it is never a candidate
  accessible-tree object in either state (FR-011).
- No live region, no `role="status"`, no `aria-live` — verified by asserting their absence in the
  shadow tree in the extended test file (FR-008).
- `toHaveAccessibleName()` assertions run for every tone/size × idle/busy combination, including the
  icon-only size, per User Story 1.

## Test-file strategy

`fixtures/elements-behaviour/src/sk-button.test.ts` (edited in place) gains:

1. **Geometry (FR-006, User Story 3)**: for each tone × size × {long label, short/icon label},
   `mount()` idle, record `getBoundingClientRect()`, set `busy = true`, await `updateComplete`,
   re-measure, set `busy = false`, await, measure a third time. Assert all three width/height pairs
   are pixel-identical. A sibling-element position check (a second button appended after the first,
   in a flex row) confirms no reflow escapes the button's own box.
2. **Disabling-mechanism independence (FR-003/004/005, User Story 2)**: busy+`disabled` keeps the
   existing opacity/cursor treatment and the cue visible; busy+`aria-disabled="true"` shows the cue
   with no forced dimming, stays focusable (`tabIndex !== -1` is already asserted elsewhere in this
   file for the delegated-focus case; this mission asserts the aria-disabled case explicitly keeps
   the native control focusable).
3. **Accessible name parity (FR-007/FR-011, User Story 1)**: `toHaveAccessibleName()` before and
   after `busy` is set, for text and icon-only fixtures; assert no live region / `role="status"` /
   `aria-live` exists in the shadow tree.
4. **Reduced motion / forced colors (FR-009/FR-010, User Story 4)**: parse the raw `sk-button.css`
   into a `CSSStyleSheet` (mirroring `sk-status-indicator.test.ts`'s `authoredStatusSheet` /
   `mediaRuleFor` pattern) and assert the `(prefers-reduced-motion: reduce)` rule sets
   `animation-name: none` on `.sk-button__busy-cue` while leaving its `visibility`/`opacity` at the
   busy-visible values (not reset to the idle-hidden values) — proving the frozen frame stays
   present, not merely that the animation stopped. Assert the `(forced-colors: active)` rule (or the
   base rule, if no override proves necessary) keeps the cue's `border-style`/`outline-style` solid.
5. **Static markup module (FR-002)**: `buttonClasses(variant, size, true)` includes
   `sk-button--busy`; `buttonStaticHtml({ busy: true, ... })` on both the `<button>` and `<a>`
   branches includes the class; the anchor-branch injection test already in this file is extended to
   confirm `busy` participates in class-list composition without introducing a new injection vector
   (it is a boolean, never interpolated as a string, so no `attr()` escaping question arises — stated
   explicitly rather than left silent).
6. **`[SC-013]` part targetability, extended**: the existing `[SC-013]` test's `for` loop gains the
   `busy-cue` part, asserted targetable via `sk-button::part(busy-cue)` from outside, on both the
   `<button>` and `<a>` render branches (mirroring this file's own existing lesson about testing both
   branches for a part rendered by both).

`apps/storybook/src/tests/sk-button.spec.ts` (new) covers:

7. **Narrow width / 200% zoom (FR-014)**: `page.setViewportSize()` to a narrow CSS viewport against
   a `Busy` story with a long label, asserting `document.documentElement.scrollWidth` equals
   `clientWidth` (no horizontal overflow) — the `sk-copy-field.spec.ts` technique.
8. **RTL / logical layout (FR-014)**: render a busy fixture under `dir="rtl"` and assert the cue's
   `inset-inline-start` placement (a logical property, not `left`) renders on the visually-correct
   side, proving the CSS strategy's use of logical properties (not physical `left`/`right`) is real
   and not merely intended.

## Ratchets and generated artifacts (FR-016, SC-010)

| File | Change |
|---|---|
| `expected-parts.json` | `sk-button` gains `"busy-cue"`; `total` bumped by 1 |
| `expected-docs.json` | `sk-button.attributes` 5 → 6 (the new `busy` attribute); `total` bumped by 1 |
| `expected-stories.json` | `sk-button` gains the new busy story ids; `total` bumped accordingly |
| `behaviours.json` | **No change** — `sk-button` is already a subject of SC-010/SC-013/SC-014; no new applicable id is triggered (confirmed against ADR-11's pinned id set, not assumed) |
| `mutations.json` | Optionally gains arms under the three already-declared ids (e.g. an SC-013 arm dropping the `busy-cue` part) — a tasks-phase decision, not a new ratchet dimension |
| `custom-elements.json`, `packages/react/src/**`, `packages/elements/vue.d.ts` | Regenerated via the standard pipeline (`elements:analyze`, `build-react-wrappers.mjs`, `build-vue-types.mjs`); the new `busy` Boolean property/attribute must carry a doc comment or `check-manifest-content.mjs` fails |
| `packages/elements/SIZES.md` | Regenerated from a real build (`npx nx run-many --target=build --projects=tokens,styles,elements` before `measure-elements-sizes.mjs`) — never from a stale `dist/` |

## Gate Matrix

| # | Gate | Command | Applies? | Why / why not |
|---|---|---|---|---|
| 1 | Focused Vitest browser suite | `npx vitest run fixtures/elements-behaviour/src/sk-button.test.ts` | Yes — run first, locally | Fastest, most specific feedback on the extended file |
| 2 | Focused new Playwright spec | `npx playwright test apps/storybook/src/tests/sk-button.spec.ts --project=chromium --project=firefox` (after `npx nx run storybook:storybook:build`) | Yes | WebKit leg deferred to CI (row 15) |
| 3 | Regenerate CSS/markup/manifest/wrappers | `node scripts/build-elements-css.mjs && node scripts/build-element-markup.mjs && npx nx run elements:analyze && node scripts/build-react-wrappers.mjs && node scripts/build-vue-types.mjs` | Yes | Every one of these outputs changes because `sk-button.css`, `sk-button.ts`, and `sk-button.markup.ts` are all edited |
| 4 | Build then measure sizes | `npx nx run-many --target=build --projects=tokens,styles,elements` then `node scripts/measure-elements-sizes.mjs` | Yes | Must build first — `measure-elements-sizes.mjs` reads `dist/` and does not build it |
| 5 | Drift checks (`--check` on every generator above) | as named | Yes | Confirms the committed regeneration matches a fresh run |
| 6 | `check-manifest-content.mjs` | as named | Yes | The new `busy` attribute must carry a doc comment or this fails |
| 7 | `check-no-css-in-source.mjs`, `check-elements-entries.mjs`, `check-adopted-css-boundaries.mjs`, `check-element-css-hygiene.mjs` | as named | Yes | Standard hygiene gates; the busy cue's selectors are ordinary root-class/pseudo-class forms, not shadow-crossing constructs |
| 8 | `check-part-ratchet.mjs` | as named | Yes | The new `busy-cue` part must land with its test in the same PR, or this gate refuses it |
| 9 | `check-story-theme-wrapper.mjs` | as named | Yes | Confirms the busy `LightMode` fixture uses `class="sk-light"` |
| 10 | `typecheck-all.mjs`, `npm run quality:all` | as named | Yes | Standard aggregate gates |
| 11 | `git status --porcelain` empty after regeneration | `git add -A && git status --porcelain` | Yes | Confirms every generated artifact above is committed |
| 12 | `npm run test` (full suite) | as named | Yes | Confirms no existing `sk-button` (or sibling) test regressed |
| 13 | `node scripts/suite-selftest.mjs` | as named | Yes | Full baseline + dependency-affected suite/mutation run, including any new `mutations.json` arms |
| 14 | Storybook build + `run-axe-storybook.js` | as named | Yes | NFR-002/SC-007; runs unconditionally over the new busy stories |
| 15 | Full Playwright suite (three engines) | `npx playwright test`, unfiltered — CI-authoritative for WebKit | Yes, CI-authoritative for WebKit | This host cannot launch WebKit locally (ADR-15's recorded gap) |
| 16 | Visual regression | `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` | Yes, chromium-only, CI-authoritative | New baseline entries for the busy stories; no firefox/webkit pixel baseline is added |
| 17 | `node scripts/check-gate-wiring.mjs` | as named | Yes | Cheap; catches wiring drift from concurrent sibling missions (#301/#302/#304/#306/#308 all run in parallel worktrees) |

## Rebase / regenerate / rerun requirements before final review

1. Rebase onto `train/elements-first`'s current head before the final gate pass — a long design
   phase can go stale while sibling missions land (recorded lesson: re-fetch main before
   implementing).
2. Regenerate in dependency order after any rebase or source edit: gate 3's plain runs before their
   own `--check`, before gates 6-10.
3. Rerun the full Gate Matrix after any regeneration.
4. Re-run the pre-merge adversarial squad against the final head SHA before requesting review —
   squad tier C, pre-merge only, per #305's own front matter.
5. Re-verify the WebKit leg on CI specifically, not merely trust a green local chromium+firefox run.
6. Confirm no existing `sk-button` story, fixture, or test outcome changed — an explicit before/after
   diff of `sk-button.test.ts`'s existing tests, not merely "the suite is green" (the #308
   closed-dialog lesson: a diff that only ever strengthens the busy-state assertions could still
   silently break something in the untouched idle-state tests without a dedicated before/after
   check).
7. Confirm `git grep -nE ':host|::slotted|container-type' packages/styles/src/button/sk-button.css`
   still shows only the one pre-existing `display: inline-flex` `:host` rule — the ADR-15-independence
   re-check, final not only plan-time.

## Work package shape

**One work package.** #305 states "one bounded Work Package and one PR" as its own delivery
constraint. The CSS rule, the reflected property, the cue markup, the static markup module change,
the ratchet updates, the extended behaviour test file, and the new Playwright spec are all
interdependent (the test needs the cue to exist; the ratchets need the final part/attribute count;
the static module change needs the same class name the CSS defines) — no internal seam benefits from
splitting. One PR into `train/elements-first`, gated by the matrix above.

## Complexity Tracking

Not applicable — no Charter Check violation exists for this mission.

## Implementation Concern Map

### IC-01 — CSS: the busy rule, cue geometry, motion, and forced-colors

Author `.sk-button--busy`'s rule set and the cue's `@keyframes` in `sk-button.css`, token-driven
throughout, confirming the absolute-positioning technique holds (zero shift) at all three sizes
including `--icon`'s size-specific inset override, and the reduced-motion frozen frame is measurably
distinguishable from idle. Covers FR-001, FR-003, FR-009, FR-010, NFR-001, NFR-004.

### IC-02 — Element and markup module: reflected property, cue node, static form

Add `busy` to `SkButton`'s reactive properties and render a `part="busy-cue" aria-hidden="true"`
node unconditionally (visibility driven by CSS). Thread `busy` through `ButtonStaticOptions`,
`buttonClasses`, `buttonStaticHtml`, and add a `Busy` `BUTTON_AXES` entry. Document the static path's
"no cue markup" boundary in both the CSS header comment and the markup module's doc comment. Covers
FR-002, FR-007, FR-011, FR-012, FR-018.

### IC-03 — Ratchets and generated artifacts

Update `expected-parts.json` (busy-cue, total+1), `expected-docs.json` (attributes 5→6, total+1),
`expected-stories.json` (new story ids); confirm `behaviours.json` needs no change against ADR-11's
pinned id set; regenerate every generated artifact and commit. Covers FR-013, FR-016, SC-010.

### IC-04 — Test-file work: extend `sk-button.test.ts`, add `sk-button.spec.ts`

Implement the six extensions to the existing behaviour test file and the two new Playwright spec
tests described in "Test-file strategy" above. Covers FR-004, FR-005, FR-006, FR-008, FR-014, FR-017
(the reasoned non-addition of a component-scoped #286 test is a documentation-only item, not a test
to write), NFR-002, NFR-003.

### IC-05 — Verification: local chromium+firefox, CI-authoritative webkit and visual baselines

Run the full Gate Matrix locally wherever this host can execute it, then push and confirm the
`playwright` CI job is green across all three engines and the `visual-regression` job's new chromium
baselines are accepted, before presenting the mission as review-ready. Covers SC-011, SC-012, and the
plan's own "Rebase / regenerate / rerun" checklist.
