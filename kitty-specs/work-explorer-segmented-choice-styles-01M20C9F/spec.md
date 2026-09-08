# Mission Specification: Work Explorer segmented-choice styles

**Mission Branch**: `work-explorer-segmented-choice-styles-01M20C9F` (topology: `lanes` — this design
artifact lands directly on `train/elements-first`; the implementation Work Package cuts its own
lane branch from `train/elements-first` at `/spec-kitty.implement` time, per this repo's git
workflow. Tracks GitHub issue [#270](https://github.com/spec-kitty/spec-kitty-design/issues/270),
part of epic [#269](https://github.com/spec-kitty/spec-kitty-design/issues/269).)
**Created**: 2026-09-08
**Status**: Draft
**Input**: GitHub issue #270, "[TKX1] native segmented-choice styles — supplied exclusive views
without tab semantics" (binding, quoted verbatim where load-bearing below)

## Terminology (DIRECTIVE_032 — conceptual alignment)

Before any requirement below is read as binding, these are the interpretations this spec commits
to. A reviewer who reads a term differently should raise it before implementation starts, not
after.

- **"Segmented choice"** means a visually grouped row of mutually-exclusive-looking buttons (e.g.
  "By lane / By person / By type") — a *presentation* pattern, not the ARIA `tablist`/`tab` pattern
  and not a `radiogroup`. The issue is explicit that tab semantics, radio semantics and select
  semantics are all out of contract.
- **"Styles-only"** means: a `.css` file plus hand-authored `.html` exemplars in
  `packages/styles/src/segmented-choice/`, a generated `index.ts` barrel, and Storybook stories —
  with **no** corresponding directory in `packages/elements/src/`, no Lit class, no
  `customElements.define`, and therefore no manifest entry, no `::part()`, no generated React or
  Vue wrapper. This mission adds a CSS class family applied to markup the *consumer* writes, not a
  component that renders itself. The binding source for "no custom element" is issue #270's own
  explicit instruction ("Do not register a custom element" — see C-001), not ADR-10 precedent.
  ADR-10's class-level ruling ("Styles-only components are a class, not a fixed exception count")
  scopes styles-only *status* to a component "whose entire value is the semantics of a native
  element it styles" — `sk-facts`, `sk-disclosure`, `sk-data-table`, `sk-empty-state`,
  `sk-skip-link` (per #176) — for structural reasons (unbroken parent/child chains, cross-root ID
  references, document-scoped hrefs, UA-owned open/closed state) that a plain button group does
  not obviously share, so that rationale is not claimed here. Those five components (plus
  `sk-disclosure`/`sk-form-select` cited separately in C-002 for the generation-tooling pattern)
  are cited only as procedural precedent — barrel generation via
  `scripts/build-styles-only-markup.mjs`, `.html`-exemplar authoring — not as the reason this
  component is styles-only. `sk-form-select` is dropped from the structural-semantics list: it is
  not part of ADR-10's documented styles-only class at all — neither the five-component
  native-element-semantics ruling above nor ADR-10's separate `form-field`-specific ruling (which
  is about `sk-form-field` alone) names or covers it; `sk-form-select` is styles-only in this
  repo's tree with no ADR-10 rationale recorded for it — see FR-010 and the Constraints section.
- **Storybook title root**: `Components/SkSegmentedChoice (HTML)`. This is an interactive
  button-group control the consumer wires up with click handlers and `aria-pressed` state — not a
  passive-display primitive (`Primitives/SkFacts (HTML)`, `Primitives/SkDisclosure (HTML)`) and not
  a labelled form control (`Form/SkFormSelect (HTML)`) — so, as this spec's own judgment call, it
  follows the observed precedent for interactive, consumer-composed HTML components:
  `Components/Button (HTML)`, `Components/SkFeatureCard (HTML)`, `Components/SkRibbonCard (HTML)`.
  This is consistent with CLAUDE.md §6's instruction to "pick the closest existing root," though
  §6 itself only lists the six root names and does not state an interactive-vs-passive split — that
  split is inferred from the precedent titles above, not asserted by §6. This fixes the literal
  prefix of every FR-006 story id and the FR-013 ratchet entry name.
- **"Pressed value" / "current selection"** is state the *consumer* owns and reflects onto the DOM
  via each button's `aria-pressed` attribute before or after render. The CSS reads that attribute
  purely as a selector (`[aria-pressed="true"]`); it never sets, toggles, or infers it, and it does
  not validate that exactly one button in a group carries `aria-pressed="true"` — the issue calls
  "exactly one pressed item" a *fixture contract* the mission's own stories must honour, not a
  runtime invariant the CSS enforces or can enforce.
- **"Native buttons"** means real `<button type="button">` elements. Tab order, Shift+Tab, Enter
  activation, and Space activation are the browser's existing behaviour for a focusable button and
  are asserted, not implemented, by this mission's tests.
- **"The library"** in the Application ownership section below means this package
  (`@spec-kitty/styles`, the `sk-segmented-choice` class family). **"The application"** means Team
  Kitty, the consumer that composes the grouping logic, vocabulary and state.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Style an accessible exclusive-choice control (Priority: P1)

A Team Kitty engineer building a Work Explorer toolbar (W1–W8) needs to present three supplied
exclusive views — By lane, By person, By type — as a single visually-grouped control. They already
own the buttons, the `aria-pressed` state, and the click handler; what they need from the design
system is a class family that makes the group *look* like one coherent, accessibly-named
segmented control with a clearly distinct selected state, while every native button behaviour
(focus, activation, tab order) keeps working exactly as the browser already provides it.

**Why this priority**: This is the issue's stated Outcome and the only reason the mission exists —
without it, Work Explorer's three supplied views have no shared presentation and the toolbar looks
like three unrelated buttons.

**Independent Test**: Render the three-item default story (`sk-segmented-choice` wrapping three
`<button type="button" aria-pressed="…">` items) in Storybook, confirm each position's selected
state renders with a `::selection` cue that is not colour-only, and confirm axe reports zero WCAG
2.1 AA violations.

**Acceptance Scenarios**:

1. **Given** a consumer-authored group of three buttons wrapped in `.sk-segmented-choice`, with the
   first button carrying `aria-pressed="true"` and the group carrying an accessible name (e.g.
   `role="group" aria-label="View by"`), **When** the group renders, **Then** the pressed button is
   visually distinguishable from its two unpressed siblings by more than colour alone (e.g. a
   border/weight/shape change in addition to a colour change), and axe-core reports zero WCAG 2.1
   AA violations for that render.
2. **Given** the same group, **When** a sighted mouse user hovers an unpressed item, **Then** that
   item shows a hover state distinct from both the pressed state and the resting unpressed state.
3. **Given** the same group, **When** a keyboard user tabs to an item and it receives focus,
   **Then** a focus-visible indicator renders that is not clipped by the group's container at any
   documented story width.

---

### User Story 2 - Keep the control usable and correctly sized when the toolbar wraps (Priority: P1)

The same Team Kitty engineer needs the control to remain fully operable at W4's narrow/wrapped
toolbar layout — every button must still be individually tappable at the platform's minimum
44×44px target size — without the desktop rendering losing its intentionally dense rhythm.

**Why this priority**: The issue names this explicitly ("W4 requires the group to remain operable
when the toolbar wraps") as a required story and a required acceptance bar, not an optional
enhancement — a control that becomes untappable on a wrapped/narrow toolbar fails its only
consumer's real layout.

**Independent Test**: Render the narrow/wrapping story at a viewport width that forces the group to
wrap, measure each button's rendered box, and confirm every dimension is ≥44px while the same
component's default/desktop story keeps its unwrapped, denser sizing.

**Acceptance Scenarios**:

1. **Given** the segmented-choice group inside a toolbar narrow enough to force wrapping (the W4
   narrow layout), **When** the group renders, **Then** every button's rendered hit area is at
   least 44×44px.
2. **Given** the same narrow layout, **When** the group wraps, **Then** no button clips its content,
   no button's focus indicator is cut off by the wrap, and the group does not cause the document to
   scroll horizontally.
3. **Given** the default (non-narrow) desktop layout, **When** the group renders, **Then** its
   density is the component's normal, non-inflated desktop rhythm — the 44px minimum is a narrow-
   layout requirement, not a permanent enlargement of the default state.

---

### User Story 3 - Represent unavailable and partial-disabled states truthfully (Priority: P2)

W9 and W10 need the group to sit in a genuinely disabled state (e.g. the underlying data source is
unavailable) or a partially disabled state (e.g. one view is temporarily unavailable while the
others remain usable), and that disabled-ness must be real to assistive technology and to
keyboard/tab traversal, not merely styled to look greyed out.

**Why this priority**: The issue requires "Disabled buttons use the native `disabled` attribute,
not only `aria-disabled`" and lists both "all disabled" and "one disabled" as required stories —
this is a named acceptance bar, but it is one state family among several (P1 stories are the
baseline the whole component exists for).

**Independent Test**: Render the all-disabled and one-disabled stories, confirm every disabled
button carries the native `disabled` attribute, confirm a disabled button cannot receive focus via
Tab, and confirm the disabled visual state is distinguishable from both the pressed and unpressed
enabled states without relying on colour alone.

**Acceptance Scenarios**:

1. **Given** a segmented-choice group where every button is disabled, **When** a keyboard user tabs
   through the toolbar, **Then** focus skips every button in the group (native `disabled` semantics,
   not `aria-disabled` alone).
2. **Given** a segmented-choice group where exactly one of three buttons is disabled, **When** the
   group renders, **Then** the disabled button is visually distinct from its enabled siblings by
   more than colour (e.g. a cursor, border, or opacity treatment layered with a non-colour cue), and
   the two enabled buttons remain focusable and operable.
3. **Given** either disabled story, **When** axe-core runs against it, **Then** it reports zero WCAG
   2.1 AA violations — a truthfully disabled control must not merely look disabled while remaining
   in the tab order, which would itself be a violation surface.

---

### User Story 4 - Verify the control under constrained rendering conditions (Priority: P2)

A reviewer or CI gate needs confidence that the component holds up under conditions the three
stories above don't individually exercise: long item labels, unusual item counts (two or five
items instead of three), no item selected, forced-colors mode, dark (default) and light themes, and
200% browser zoom.

**Why this priority**: These are the issue's own required-story and required-test list items; they
are verification breadth rather than new behaviour, so they sit below the P1/P2 behavioural
stories they verify.

**Independent Test**: Each condition below has its own named Storybook story (FR-006) and, where
the issue calls for a browser assertion, its own Playwright test (FR-007/FR-008/FR-009).

**Acceptance Scenarios**:

1. **Given** a segmented-choice group with a label long enough to challenge the button's normal
   width, **When** it renders, **Then** the label wraps or is contained within its own item — it
   does not overflow into a sibling item or cause the document to scroll horizontally.
2. **Given** a segmented-choice group with two items, and separately a group with five items,
   **When** either renders, **Then** the group and its items lay out correctly with no assumption
   baked into the CSS that exactly three items exist.
3. **Given** a segmented-choice group where no item carries `aria-pressed="true"`, **When** it
   renders, **Then** the CSS remains readable (no item is forced into a false-selected appearance)
   and axe-core reports zero WCAG 2.1 AA violations.
4. **Given** any required story, **When** the page is rendered with `forced-colors: active`
   emulated, **Then** the selected, disabled and focus-visible states each remain distinguishable
   using a mechanism forced-colors preserves (border/outline), not one it flattens away
   (`background`, `box-shadow`); no state cue relies on `forced-color-adjust: none` to survive;
   and any forced-colors override is written as a longhand `-color` property, never the
   `border`/`outline` shorthand — the full set of traps this bar draws on is enumerated in
   NFR-004 and C-010, not restated here, and `docs/contributing/adding-a-component.md` is the
   canonical source for why each one matters.
5. **Given** any required story, **When** the page is zoomed to 200%, **Then** no item clips its
   focus indicator or its content, and the document does not gain horizontal scroll as a result of
   the segmented-choice group.

### Edge Cases

- **Multiple or zero pressed items.** The issue states the styles "remain readable for none and
  multiple pressed values but do not validate application state" — so a group with two buttons both
  carrying `aria-pressed="true"` must not visually break (no undefined/overlapping selected styling)
  even though it is not a state the component's own stories are required to exercise as a named
  acceptance story beyond "no selected item" (FR-006 story 7). No FR requires the CSS to *prevent*
  or *correct* multiple-pressed rendering — only that it not visibly break.
- **A group whose accessible name is missing.** Out of the CSS layer's control (the consumer
  supplies the group label per the Public/library contract) — not a defect this component's CSS can
  detect or fix; covered by documentation (FR-011) telling the consumer they must supply one, and by
  the browser-assertion suite (FR-007) asserting the *documented* stories carry one, not by the CSS
  itself.
- **A very small viewport where even wrapped items cannot fit 44px cleanly next to each other.** The
  narrow/wrapping story (FR-006 story 10) is the one instrumented acceptance point for this; no
  further breakpoint is specified by the issue, and this spec does not invent one (see Constraints,
  C-005).
- **RTL logical direction.** Not named by issue #270 for this component (unlike other recent native
  components in this repo that do carry an RTL story). Out of scope for this mission; not listed
  among the issue's required stories, and adding one would be scope invention beyond the binding
  issue text.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Consumer-owned public contract | As a Team Kitty engineer, I want the CSS to style buttons whose label text, order, pressed value, disabled state and change handling are entirely mine to supply, so that the library never contends with my application state. | High | Open |
| FR-002 | No custom element, no owned semantics beyond styling | As a design-system maintainer, I want `sk-segmented-choice` to add no `role="tablist"`/`role="radio"`, no hidden panels, and no roving-tabindex script, so that ordinary Tab/Shift+Tab/Enter/Space stay entirely browser-owned. | High | Open |
| FR-003 | Distinct, non-colour-only states | As a low-vision or colourblind user, I want selected, hover, active, focus-visible and disabled states to each be distinguishable by more than colour, so that I can operate the control without relying on hue alone. | High | Open |
| FR-004 | Native `disabled`, not `aria-disabled` alone | As an assistive-technology user, I want a disabled segmented-choice button to be excluded from the tab order and from click activation by the browser's own `disabled` attribute, so that its disabled state is truthful rather than merely styled. | High | Open |
| FR-005 | Long-label and overflow containment | As a Team Kitty engineer supplying real view names, I want long item labels to wrap or be contained within their own item, so that no label clips a sibling or causes page-level horizontal scroll. | High | Open |
| FR-006 | Required Storybook story matrix | As a reviewer, I want every one of the issue's named story states present in Storybook, so that every documented state has a reviewable, axe-scanned render. Stories required (titled under `Components/SkSegmentedChoice (HTML)` — see Terminology): (1) three-item default with the first item selected, (2) three-item default with the second item selected, (3) three-item default with the third item selected, (4) two items, (5) five items, (6) long labels, (7) no item selected, (8) all items disabled, (9) one item disabled, (10) narrow/wrapping layout at 1024px (per C-005), (11) forced colors, (12) default dark, (13) `LightMode` wrapped in `class="sk-light"` (never `data-theme`). | High | Open |
| FR-007 | Browser assertions — roles, names, and order | As a reviewer, I want a Playwright spec asserting every rendered item is a real `<button>` with an accessible name, that the group itself carries an accessible group name, and that DOM/tab order matches visual/source order, so that native semantics are verified rather than assumed. | High | Open |
| FR-008 | Browser assertions — activation and disabled exclusion | As a reviewer, I want a Playwright spec asserting Enter and Space activate a focused button (browser-owned, but verified against this component's actual markup), that `aria-pressed` on each button is exactly what the story's fixture authored (truthful, not CSS-derived), and that a `disabled` button is excluded from focus/tab traversal, so that the truthfulness claims in FR-004 are measured, not assumed. | High | Open |
| FR-009 | Browser assertions — hover, active, focus visibility, axe, and zoom/overflow | As a reviewer, I want the Playwright spec to assert distinct hover and active (mouse-down) style deltas on an unpressed item (measured via `page.hover()`/`page.mouse.down()`, comparing computed styles against the resting state — pattern: `sk-context-nav.spec.ts:813`'s `await ordinary.hover()` / `linkCue` comparison, `sk-transition-matrix.spec.ts:285`'s `await row.hover()` / style-delta comparison, `sk-bar-chart.spec.ts:257`'s `await trigger.hover()` / `hover.background` comparison), a visible, non-clipped focus indicator per state, an axe-core run per required story with zero WCAG 2.1 AA violations, and a check that 200% zoom introduces no document-level horizontal scroll, so that FR-003's hover/active claim and FR-005/FR-009's other acceptance bars are independently measured, not left to a visual-only baseline. | High | Open |
| FR-010 | Styles-only artifact shape, generated via repository tooling | As a design-system maintainer, I want `packages/styles/src/segmented-choice/` to hold `sk-segmented-choice.css` plus hand-authored `.html` exemplars, with `index.ts` regenerated by `node scripts/build-styles-only-markup.mjs` (and its `--check` mode passing in CI), and **no** corresponding `packages/elements/src/segmented-choice/` directory, so that the component follows the established styles-only class (ADR-10) rather than inventing a new generation path. | High | Open |
| FR-011 | Usage documentation | As a Team Kitty engineer adopting the component, I want `docs/design-system/using-components.md` to gain a section documenting the public contract (what I supply vs. what the CSS never does), the class names, and the ownership boundary, so that I don't have to read the CSS source to use it correctly. | Medium | Open |
| FR-012 | Visual regression baselines | As a reviewer, I want CI-authoritative visual baselines covering selected/unselected/hover/active/disabled/focus, long content, dark/light and forced-colors renders, so that a future regression in any of those states is caught by pixel comparison, not only by axe or by browser assertions. | Medium | Open |
| FR-013 | Ratchet update — `expected-stories.json` | As a CI gate, I want a new `sk-segmented-choice` (or equivalent story-prefix) entry added to `expected-stories.json` naming every FR-006 story id under `byElement`, with `total` bumped by exactly the number of stories added, so that none of the required stories can be silently removed later. The autodocs-generated `--docs` page entry is excluded from both `total` and `byElement.sk-segmented-choice` — it is a generated page, not a story, and no other element in the ratchet records one (`expected-stories.json`'s own `$comment`: "Docs entries are excluded, matching every other element here"). | High | Open |
| FR-014 | Ratchet non-applicability confirmed, not assumed | As a reviewer, I want it confirmed (not merely asserted) that `expected-parts.json`, `expected-docs.json`, `behaviours.json` and `mutations.json` gain **no** entry for this component, because it registers no custom element and owns no behaviour outside native button semantics, so that the mission does not silently under- or over-populate ratchets that don't apply to a styles-only addition. | Medium | Open |
| FR-015 | Token-only CSS values | As a design-system maintainer, I want every colour, spacing, radius, shadow, motion and border value in `sk-segmented-choice.css` to reference a `var(--sk-*)` token — specifically `--sk-bg-pill` for the pressed/selected item's fill, matching the `sk-nav-pill.css` precedent (`.sk-nav-pill__item--active { background: var(--sk-bg-pill); }`), plus the existing border/focus token families, rather than inventing component-named tokens or the differently-named, same-valued `--sk-surface-pill` — so that stylelint's `declaration-strict-value` rule passes and no new token category is introduced without cause. | High | Open |
| FR-016 | Demo-page non-goal confirmed | As a reviewer, I want it confirmed that `apps/demo/blog-demo.html` and `apps/demo/dashboard-demo.html` require no changes for this mission (composition into a full Work Explorer page is epic #269's later Wave-3 mission, #275/TKX6), so that this WP does not attempt out-of-scope composition work. | Low | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Zero accessibility violations per state | Every required Storybook story (FR-006, all 13) reports zero WCAG 2.1 AA violations under axe-core; a story that fails to load counts as a failure, not a pass (per ADR-11's axe-gate repair). | Accessibility | High | Open |
| NFR-002 | Minimum target size at narrow layout | At the narrow/wrapping story's viewport, every button's rendered box is ≥44×44px, measured via Playwright `getBoundingClientRect()`, while the default/desktop story's density is unaffected. | Accessibility | High | Open |
| NFR-003 | No horizontal document overflow | Across every required story, at both 100% and 200% browser zoom, `document.scrollingElement.scrollWidth` does not exceed `document.documentElement.clientWidth` as a result of the segmented-choice group. | Usability | High | Open |
| NFR-004 | Forced-colors correctness | Under `forced-colors: active` emulation, the selected-state indicator and the focus-visible indicator are each drawn using a mechanism (`border`/`outline`) that forced-colors preserves or remaps, not one it flattens (`background`, `box-shadow`); measured per the pattern in `apps/storybook/src/tests/sk-notice-forced-colors.spec.ts`, not merely read off the source. If any state cue is instead drawn as a background-painted icon/glyph, it must not be forced to survive via `forced-color-adjust: none` — that freezes the glyph at its authored colour, which is frequently invisible against the forced-colors background (measured dark-grey-on-black precedent in `sk-disclosure.css`); use a border-, outline-, or CSS-generated-content-drawn cue instead, per `docs/contributing/adding-a-component.md`'s forced-colors section and the worked example in `sk-disclosure.css`. Any `@media (forced-colors: active)` override in the CSS uses the longhand `-color` property, never the `border`/`outline` shorthand — see C-010. | Accessibility | High | Open |
| NFR-005 | Token-catalogue conformance | `stylelint` (via `stylelint-declaration-strict-value` against `packages/tokens/dist/token-catalogue.json`) passes with zero violations against `sk-segmented-choice.css`. | Maintainability | High | Open |
| NFR-006 | Generation determinism | `node scripts/build-styles-only-markup.mjs --check` passes in CI against the committed `index.ts` barrel — no hand-edit of the generated file. | Maintainability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No custom element | Per the issue's explicit instruction ("Do not register a custom element"), no `packages/elements/src/segmented-choice/` directory, no `customElements.define('sk-segmented-choice', …)`, no `@spec-kitty/react` or `@spec-kitty/elements/vue.d.ts` entry may exist for this component. | Technical | High | Open |
| C-002 | Styles-only generation path only | Markup is authored once as `.html` exemplars per ADR-10 §3 and §"Styles-only components are a class, not a fixed exception count"; `index.ts` is generated output, never hand-edited, matching the `sk-form-select`/`sk-disclosure` precedent. | Technical | High | Open |
| C-003 | BEM naming | Every class follows `sk-segmented-choice` (block) / `sk-segmented-choice__item` (element) / modifier form; no class outside that prefix is introduced. | Technical | High | Open |
| C-004 | Tokens only, no raw literals | No hardcoded colour, spacing, radius, shadow, or motion value; every value is a `var(--sk-*)` token. Base-state colours use `--sk-bg-pill` (the pressed/selected fill) plus the existing border/focus token families, matching the base-state precedent in `sk-nav-pill.css` and `sk-form-select.css` — base-state token reuse only, not a forced-colors precedent, since neither file carries a `forced-colors` block. Any forced-colors override instead follows the longhand-`-color`, system-color-keyword technique in `sk-skip-link.css` (`outline-color: Highlight;`) and `sk-data-table.css` (`border-left-color: Canvas` / `CanvasText` / `Highlight`) — see C-010. | Technical | High | Open |
| C-005 | Narrow/wrapping story fixed at 1024px | The issue's Evidence section states the number directly: "W4 requires the group to remain operable when the toolbar wraps at 1024px." The narrow/wrapping story (FR-006 story 10) is authored at a 1024px viewport, and NFR-002/NFR-003/SC-004 are measured against it — this is not an open implementation decision for the plan/WP. This spec does not invent any *additional* breakpoint below 1024px for the residual case where even a wrapped item cannot fit 44px cleanly (see Edge Cases); that narrower case has no issue-supplied number and remains unfixed here. | Technical | Medium | Open |
| C-006 | Conventional commit scope | All commits in this mission use the `styles` conventional-commit scope, matching the package actually changed (`packages/styles`). | Process | Medium | Open |
| C-007 | One Work Package, one PR, one base branch | Delivery is a single bounded Work Package producing a single PR that targets `train/elements-first` (not `main`) — per the mission's `lanes` topology and this repo's current base-branch state. | Process | High | Open |
| C-008 | No `apps/demo/*.html` change | Composition into the deployed demo pages is explicitly out of scope (epic #269 assigns page composition to the later #275/TKX6 mission); this mission adds no reference to `segmented-choice` in `apps/demo/blog-demo.html` or `apps/demo/dashboard-demo.html`, and `scripts/assemble-demo-dist.sh` requires no change because it derives its copied component set from what the demo pages already reference. | Process | Medium | Open |
| C-009 | Pre-merge adversarial squad gate; earlier point-cuts optional | The issue's own line — "Squad tier: C — pre-merge" — is the sole binding source for this mission's tier classification. `docs/architecture/elements-first-programme.md`'s tier table maps Tier A/B/C to missions M2 through M16 and does not enumerate this mission at all, so that document does not itself classify this mission and is not cited here as a second, corroborating source — only as the record of what "Tier C" and "pre-merge" mean operationally. Consistent with the issue's tier, and with that document's own rule that pre-merge is not tiered, the mandatory gate is the full pre-merge squad (all four lenses, evidence posted on the PR before merge, per the charter's Review Policy); no earlier point-cut (post-spec/post-plan/post-tasks) is mission-mandated. This does not forbid an earlier point-cut from running as an optional, report-only enrichment pass — such as the spec-phase review that produced this file's own findings — but that pass is not tier-required and does not gate advancement to the next phase. | Process | High | Open |
| C-010 | Forced-colors overrides use longhand `-color` properties | Any `@media (forced-colors: active)` override in `sk-segmented-choice.css` (e.g. for the selected-state or focus-visible indicator) sets a longhand `-color` property (`border-color`, `outline-color`, etc.) to a system-color keyword (`Highlight`, `CanvasText`, `ButtonText`, `LinkText`, `Canvas`, `HighlightText`) — never the `border`/`outline` shorthand. Stylelint's `declaration-strict-value` rule does not police the shorthand at all (it is not in the policed-property list), so a shorthand carrying a hardcoded value would pass the gate identically to one carrying a token, leaving the gate blind rather than satisfied. Matches the technique in `sk-skip-link.css` and `sk-data-table.css` — see C-004 and NFR-004. | Technical | High | Open |

### Key Entities

- **Segmented-choice group** (`.sk-segmented-choice`): the container the consumer wraps around a
  row of buttons. Carries (consumer-authored) an accessible group name — e.g.
  `role="group" aria-label="View by"` — and lays out its children responsively. Owns no state.
- **Segmented-choice item** (`.sk-segmented-choice__item`): the class applied to each consumer
  `<button type="button" aria-pressed="…">`. The CSS reads `[aria-pressed="true"]` and `:disabled`
  purely as selectors to style the pressed and disabled visual states; it writes neither attribute
  and emits no event on interaction.
- **Consumer-owned application state** (not a design-system entity — named here only to draw the
  boundary): the current pressed value, the item vocabulary (lane/person/type), the grouping
  algorithm, URL/store synchronization, availability, and analytics. All held and mutated entirely
  by Team Kitty; the library never reads or writes any of it beyond the per-button `aria-pressed`
  and `disabled` attributes it styles from.

## Application ownership *(binding, from issue #270)*

> "Team Kitty owns the lane/person/type vocabulary, grouping algorithm, current value, URL or store
> synchronization, availability, analytics and all results. The library owns only the group and
> button presentation."

This boundary is load-bearing for FR-001/FR-002/FR-014: any implementation choice that has the CSS
infer, validate, or react to which item is "selected" (beyond styling the attribute it's given)
crosses this boundary and is out of scope.

## Non-goals *(binding, from issue #270 — restated for traceability, not softened)*

Tabs, tab panels, radio group, select replacement, navigation, router binding, item arrays,
keyboard roving, automatic exclusivity, counts, badges, filter logic, persistence, animation
conveying state, or a registered `sk-segmented-choice` element. None of the FRs above authorize any
of these; a plan or implementation that adds one of them is out of this spec's scope and requires a
new decision, not an extension of this mission.

## Dependencies and parallelization *(from issue #270)*

Depends only on the existing styles/tokens foundation (`@spec-kitty/tokens`, already-shipped pill
and focus token families) and reuses native-button conventions established by the now-closed #79
and #176. It is independent of the epic's other Wave-1 children (TKX2–TKX4) and may run in parallel
with them. The epic's later TKX6 (#275) consumes this component's public class contract after
merge — this mission does not need to anticipate TKX6's composition beyond keeping the contract
documented (FR-011).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 13 required Storybook stories (FR-006) render without console errors, and every
  story id is present in the built Storybook `index.json`.
- **SC-002**: axe-core reports zero WCAG 2.1 AA violations across all 13 required stories; a story
  that fails to load is scored as a failure, not skipped.
- **SC-003**: The Playwright spec (new file under `apps/storybook/src/tests/`, following the
  `sk-form-select.spec.ts` / `sk-notice-forced-colors.spec.ts` pattern, plus the hover-assertion
  pattern in `sk-context-nav.spec.ts:813`, `sk-transition-matrix.spec.ts:285` and
  `sk-bar-chart.spec.ts:257`) passes, asserting: native button roles and accessible names,
  DOM/tab order matching visual order, Enter/Space activation, truthful `aria-pressed` per fixture,
  native `disabled` exclusion from tab order and form-adjacent activation, distinct hover and
  active (mouse-down) style deltas on an unpressed item, and a visible non-clipped focus indicator
  per state.
- **SC-004**: At the narrow/wrapping story's viewport, every button's rendered box is measured
  ≥44×44px; at the default/desktop story, density is unchanged from the component's normal rhythm.
- **SC-005**: At 200% zoom, across all required stories, no document-level horizontal scrollbar is
  introduced by the segmented-choice group, and no item clips its content or focus indicator.
- **SC-006**: Forced-colors emulation (`forced-colors: active`) shows a distinguishable selected
  state and a distinguishable focus-visible indicator, each drawn via `border`/`outline`, not
  `background`/`box-shadow`.
- **SC-007**: Visual regression baselines exist and pass (from the CI `visual-regression-diffs`
  artifact, not a local run) for selected/unselected/hover/active/disabled/focus, long-content,
  dark/light and forced-colors states.
- **SC-008**: `expected-stories.json`'s `total` is bumped by exactly the number of new story ids
  added (13, unless the plan phase determines a different exact split — the ratchet must match
  whatever is actually shipped, not a number fixed here independent of the real story count).
- **SC-009**: `expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`,
  `packages/elements/custom-elements.json`, and `packages/react/src/` gain zero references to
  `sk-segmented-choice` / `SkSegmentedChoice` — confirmed by grep in CI or in the PR's own evidence,
  not merely asserted in prose.
- **SC-010**: `stylelint`, `htmlhint`, and `node scripts/build-styles-only-markup.mjs --check` all
  pass with zero violations/drift against the new component.
- **SC-011**: One PR merges onto `train/elements-first`, carrying the Tier-C pre-merge adversarial
  squad's evidence comment (commit SHA, per-lens verdicts, findings and dispositions) before merge,
  per the charter's Review Policy.
