# Mission Specification: Connector section navigation

**Mission Branch**: `mission/connector-section-navigation` (topology: `single_branch` — this mission's
planning and its single implementation Work Package both land on this branch; there is no separate
lane branch. PR back into `train/elements-first`.)
**Created**: 2026-09-10
**Status**: Ready for planning
**Input**: GitHub issue [#337](https://github.com/spec-kitty/spec-kitty-design/issues/337), part of
epic [#335](https://github.com/spec-kitty/spec-kitty-design/issues/335) (quoted verbatim where
load-bearing below)

## Terminology (conceptual alignment before any requirement is read as binding)

- **"Section navigation"** means a horizontal strip of sibling, same-level route links inside a
  detail surface — e.g. Workspace / Project routing / Team accounts inside one connector
  installation's detail page. It is **not** a hierarchical/grouped sidebar (`.sk-context-nav`), a
  pill-shaped primary destination switcher with drawer behaviour (`sk-nav-pill`), an ancestor-path
  trail (`.sk-breadcrumbs`), or a controlled exclusive button group with no navigation semantics at
  all (`.sk-segmented-choice`). Family 3's `C6`–`C9a` product evidence names the recurring shape
  this mission generalizes: each of those four screens repeats its own local `.detail-tabs` CSS —
  a `<nav>` of `<a>` elements, one per sibling installation route, with `aria-current="page"`
  marking the active one and a bottom-border current-location cue — to switch between sections of
  the *same* installation record. That local repetition, not any Connectors vocabulary, is the gap
  this mission closes; every provider-specific word from the evidence (installation, workspace,
  routing, Slack, GitHub, GitLab) is stripped from the public contract below.
- **"Styles-only"** means: a `.css` file plus hand-authored `.html` exemplars in
  `packages/styles/src/section-nav/`, a generated `index.ts` barrel via
  `scripts/build-styles-only-markup.mjs`, and Storybook stories — with **no** corresponding
  directory in `packages/elements/src/`, no Lit class, no `customElements.define`, and therefore no
  manifest entry, no `::part()`, no generated React or Vue wrapper, and no `behaviours.json`/
  `mutations.json` subject (the family owns no JavaScript behaviour). The primary binding source is
  issue #337's own explicit instruction — "Do not register a custom element and do not use tab
  roles" — not a claim that this component is one of ADR-10's five named native-element-semantics
  exceptions (`sk-facts`, `sk-disclosure`, `sk-data-table`, `sk-empty-state`, `sk-skip-link`, per
  #176). Those five, plus `.sk-context-nav` (#256) and `.sk-breadcrumbs`, are cited only as direct
  **procedural and architectural precedent** for a consumer-authored native `nav`/`a` light-DOM
  primitive with a generated exemplar barrel — the closest prior art is `.sk-context-nav`, which
  this mission's own plan and tasks must read before inventing markup or generator wiring.
- **"Native `<nav>` containing real `<a>` anchors"** means the root element the family styles is a
  consumer-authored `<nav>` with an accessible name (`aria-label` or `aria-labelledby`, consumer
  chosen), and every destination is a real `<a href="…">`. The family never renders its own anchors,
  never assigns `href`, and never generates an accessible name.
- **"No tab roles"** means no `role="tablist"`, `role="tab"`, `role="tabpanel"`, or
  `aria-controls`/`aria-selected` wiring a link to a panel. The links are ordinary same-page or
  cross-page navigation, not a tab widget that swaps visible content in place. A test asserting the
  *absence* of `tablist`/`tab` roles and of arrow-key script is itself an acceptance requirement
  here (issue's own instruction), not an incidental negative check.
- **"Current-location state"** is `aria-current="page"` (or an explicit `aria-current="false"`),
  supplied entirely by the consumer per link, per render. The family infers no route, no URL match,
  and no default; a render with zero `aria-current="page"` links is a valid "no current route"
  composition, not an error state.
- **"The library" / "the family"** below means this package's `.sk-section-nav` class family.
  **"The application" / "Team Kitty"** means the consumer that supplies the nav's accessible label,
  every anchor's `href` and text, link order, which (if any) subset of permission-gated routes to
  render, and which link (if any) carries `aria-current="page"`.

## User Scenarios & Testing

### User Story 1 — Move between sibling sections of one record (Priority: P1)

As a keyboard, pointer, or assistive-technology user viewing a detail page with several sibling
sections (e.g. three administrator sections or two member sections of one connector installation),
I can identify the strip as a named navigation region, see which section I am currently on without
relying on colour alone, and reach any sibling section as an ordinary link — never through a tab
widget that swaps content in place under me.

**Why this priority**: This is the issue's stated Outcome and the entire reason the mission exists:
Family 3's four detail screens each hand-roll the same local CSS for exactly this pattern today.

**Independent Test**: Render a native `<nav aria-label="…">` of three `<a>` elements, the second
carrying `aria-current="page"`, wrapped in `.sk-section-nav`. Confirm one named navigation landmark,
three native links in DOM/tab order, the current link visually distinct by more than colour
(e.g. an underline/border-weight change), and zero axe violations. Confirm the accessibility tree
reports no `tablist`/`tab` role anywhere in the subtree.

**Acceptance Scenarios**:

1. **Given** a consumer-authored `<nav>` of three links wrapped in `.sk-section-nav`, with the
   middle link carrying `aria-current="page"`, **When** it renders, **Then** the current link is
   distinguishable from its siblings by more than colour, the accessibility tree reports one named
   navigation landmark and zero `tablist`/`tab`/`tabpanel` roles, and axe reports zero WCAG 2.1 AA
   violations.
2. **Given** the same strip, **When** a sighted mouse user hovers, presses, or keyboard-tabs to an
   unpressed link, **Then** that link shows a hover, active, or focus-visible state respectively,
   each visually distinct from the current-location state and from each other.
3. **Given** the same strip, **When** a keyboard user tabs through it, **Then** focus visits every
   link exactly once in source (DOM) order, and no arrow-key handling, roving `tabindex`, or
   `aria-controls`/panel-swap behaviour is present anywhere in the family's markup or CSS.

### User Story 2 — Trust that every native link behaviour still works (Priority: P1)

As a user, I can Ctrl/Cmd-click a section link to open it in a new tab, right-click to copy its
link address, and use ordinary browser history (back/forward) after following one — because the
family styles real anchors and never intercepts their default behaviour.

**Why this priority**: The issue is explicit that this is a public-contract requirement, not an
implementation detail — a styles library that quietly breaks modified-click or copy-link is a
regression a screenshot cannot see.

**Independent Test**: Render the strip inside a real page, register no click handler beyond the
browser's own, and assert (a) each link is a real `<a href>` with no `preventDefault`-capable
listener attached anywhere in the family's own code, (b) a modified click (Ctrl/Cmd/Shift/middle)
is not observably intercepted, and (c) `:visited` styling is permitted to equal `:link` styling
(the family does not require a distinct visited treatment — see FR-004's exact distinctness list).

**Acceptance Scenarios**:

1. **Given** a rendered strip, **When** inspected for event listeners and computed `pointer-events`,
   **Then** no listener in the family's own code prevents default anchor activation, and every
   anchor remains a real, unwrapped `<a href="…">` reachable by `document.links`.
2. **Given** a link has been visited in browser history, **When** it re-renders, **Then** its
   default (`:link`/`:visited`) presentation is not required to differ from an unvisited sibling —
   the family neither forces a distinct visited style nor suppresses the browser's own.

### User Story 3 — Every valid shape stays legible and contained (Priority: P1)

As a consumer composing this family into a real page, I can render one route, two, three, or many
routes; a subset a permission check has already filtered; a route set with no current selection at
all; and long or unbroken labels — in every case without the strip forcing the document to scroll
horizontally, without silently reserving blank space for a route I chose not to render, and (in a
narrow container) without a focused link's outline being clipped by the strip's own scroll
container.

**Why this priority**: This is the shape every Family 3 screen actually needs (two-route member vs.
three-route administrator subsets from the *same* fixture), and it is the exact class of bug a
purely-desktop-width story set would miss.

**Independent Test**: Render one route, two routes (member subset), three routes (administrator
set), and a synthetic many-route (six+) composition; render first/middle/last current and no-current
variants; render a long unbroken label inside a 320px-wide host; measure `document.scrollWidth` vs
`document.clientWidth` (must be equal) at each; Tab to the last, off-screen-at-rest link in the
many-route case and assert its focus outline is fully painted within the viewport.

**Acceptance Scenarios**:

1. **Given** a permission check has supplied only two of three possible routes, **When** the strip
   renders, **Then** exactly those two links appear, in the consumer's given order, with no gap,
   placeholder, or disabled-looking affordance standing in for the omitted third route.
2. **Given** more routes than fit the strip's available inline space, **When** it renders inside a
   fixed-width host, **Then** the strip itself scrolls horizontally (its own `overflow-x`) while the
   document does not, and every link remains reachable by Tab.
3. **Given** a link near the scrollable edge receives keyboard focus, **When** it is focused,
   **Then** it is scrolled fully into view and its focus indicator is not clipped by the strip's
   edge or by any ancestor's `overflow: hidden`.
4. **Given** no link in the composition carries `aria-current="page"`, **When** it renders, **Then**
   no link is presented as current, and the strip remains otherwise fully functional.

### User Story 4 — Stay legible under RTL, forced colors, reduced motion, and zoom (Priority: P2)

As a user reading right-to-left content, using a forced-colors mode, requesting reduced motion, or
zooming to 200%, I still get correct visual order, a visible current/focus distinction that does not
depend on an author-chosen background surviving the forced palette, no unwanted transition, and no
loss of content or double-axis scrolling.

**Why this priority**: These are named, testable acceptance states in the issue's own "Required
stories and tests" section, not incidental polish.

**Independent Test**: Render the default story under `dir="rtl"`, under `forced-colors: active`
emulation, under `prefers-reduced-motion: reduce`, and at simulated 200% zoom / a short viewport;
assert logical-direction mirroring, a `forced-colors` block that preserves current/focus distinction
by a mechanism other than a flattened background, no transition where reduced motion is requested
(or exactly the family's own transition disabled, if one exists), and no two-dimensional document
scrolling or clipped content at any of these.

**Acceptance Scenarios**:

1. **Given** `dir="rtl"`, **When** the strip renders, **Then** its internal spacing and any
   directional cue (e.g. a start-aligned current-location border) mirror correctly using logical
   CSS properties, with no page-level horizontal overflow.
2. **Given** `forced-colors: active`, **When** the strip renders, **Then** the current-location link
   and the focus-visible outline both remain visually distinguishable using system colors, not a
   flattened `background`.
3. **Given** `prefers-reduced-motion: reduce`, **When** the strip renders, **Then** either no
   transition exists on any state change the family owns, or exactly that transition is disabled.

## Edge Cases

- One route (a single-link "strip" — must remain a valid, non-degenerate composition).
- Two, three, and many (six or more) routes, exercised at the exact administrator/member fixture
  cardinalities Family 3's product evidence shows.
- Current link first, middle, last, and absent entirely (`aria-current="false"` and simply omitted).
- A permission-supplied subset that omits a route the consumer could have rendered — no reserved
  space, no placeholder.
- Long, unbroken labels (e.g. a long provider-agnostic destination name) inside a narrow host.
- The strip narrower than its content, requiring local horizontal scroll, with keyboard focus
  landing on an off-screen-at-rest link.
- A short viewport height (the strip must not depend on vertical space it does not have).
- RTL content direction.
- Browser zoom at 200% and a documented short-viewport composition.
- Default dark theme, required `LightMode`, `forced-colors: active`, and
  `prefers-reduced-motion: reduce`.
- Modified-click, copy-link, and browser back/forward on a followed link — native behaviour that
  must not be observably altered.

## Requirements

### Functional Requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-001 | Publish one coherent `.sk-section-nav` BEM class family, applied directly to a consumer-authored native `<nav>` (with an accessible label) and its native `<a>` children, in light DOM. No custom element is registered and no ARIA tab role (`tablist`/`tab`/`tabpanel`) is used anywhere in the family. | High | Open |
| FR-002 | The library supplies no nav label, href, anchor label, link order, permission filtering, or current-route inference. All six are exclusively consumer-supplied per render, via ordinary attributes (`aria-label`/`aria-labelledby`, `href`, link text/content, DOM order, which links are present, `aria-current`). | High | Open |
| FR-003 | Every anchor stays a real, unwrapped `<a href="…">` with no listener in the family's own code capable of intercepting or preventing default activation, so modified-click (Ctrl/Cmd/Shift/middle), copy-link, open-in-new-tab, and ordinary browser back/forward history all keep working exactly as the browser already provides. | High | Open |
| FR-004 | Rest, hover, active, focus-visible, and current-location (`[aria-current]:not([aria-current="false"])`) presentations are each visually distinguishable from one another by more than colour alone (e.g. a border, weight, or underline change in addition to any colour change). `:visited` is not required to differ visually from `:link` — it is deliberately excluded from this distinctness list; the family neither forces a distinct visited style nor suppresses the browser's own. | High | Open |
| FR-005 | The strip lays out its links inline and fits its content when the content fits its available space; when constrained, the strip itself (not the document) becomes the horizontal-scroll container (`overflow-x`), and no composition in this family ever causes document-level (`<html>`/`<body>`) horizontal overflow. | High | Open |
| FR-006 | A link that receives keyboard focus is scrolled fully into view within the strip's own scroll container, and its focus indicator is not clipped by the strip's edge or by any ancestor `overflow` the family itself introduces. | High | Open |
| FR-007 | The family renders correctly with one route, two routes, three routes, and many (six or more) routes; with the current link first, middle, last, or absent; and with any consumer-supplied, permission-filtered subset of routes — in every case using exactly and only the links the consumer includes, reserving no space, placeholder, or affordance for a route the consumer omitted. | High | Open |
| FR-008 | Long, unbroken destination labels remain fully in the accessible name and either wrap or are contained without clipping the label or causing document-level horizontal overflow, including inside a narrow (≈320px) host. | High | Open |
| FR-009 | All spacing, alignment, and directional cues (e.g. a start-edge current-location border) use CSS logical properties so the strip mirrors correctly under `dir="rtl"` with no added page-level overflow. | High | Open |
| FR-010 | Every link's interactive target meets a minimum 44×44 CSS-pixel floor (expressed via existing `--sk-*` space tokens, not an un-tokened `44px` literal), even where the strip's visual footprint (e.g. its underline band) is thinner. | High | Open |
| FR-011 | Under `forced-colors: active`, the current-location link and the focus-visible outline both remain visually distinguishable, using a mechanism other than an author-set `background` (which forced-colors flattens) — e.g. `border`/`outline` recoloring, which the platform preserves automatically. | High | Open |
| FR-012 | Under `prefers-reduced-motion: reduce`, either no state-change transition exists anywhere the family owns, or exactly the family's own transition(s) are disabled; no transition is added to the family only to give this requirement something to disable. | Medium | Open |
| FR-013 | All user-visible strings (nav label, link text, any supplemental copy) are exclusively consumer-supplied; the family ships no default, placeholder, or hardcoded copy anywhere in its CSS, generated markup, or stories (#286). | High | Open |
| FR-014 | Tests explicitly assert the **absence** of `role="tablist"`/`role="tab"`/`role="tabpanel"` anywhere in the family's accessibility-tree output, and the absence of any arrow-key handling or roving-`tabindex` script — this is an asserted acceptance requirement, not an incidental negative check. | High | Open |
| FR-015 | Automated accessibility-tree checks confirm exactly one named navigation landmark, that every destination is a native link, and that the reported current-location state matches exactly what the consumer supplied via `aria-current` — no more, no fewer. | High | Open |
| FR-016 | Automated keyboard and pointer checks confirm sequential Tab traversal reaches every link exactly once in source (DOM) order, and that native link activation (Enter, click, modified-click) behaves as the unmodified browser default. | High | Open |
| FR-017 | Provide Storybook stories, canonical HTML exemplars, and a generated TypeScript barrel (via `scripts/build-styles-only-markup.mjs`) for every required state: the Family-3-shaped three-route administrator and two-route member compositions, first/middle/last/absent current, one route, many routes, permission-supplied subset, long labels, narrow/local-overflow, default dark, required `LightMode`, forced colors, reduced motion, 200% zoom, short viewport, and RTL. Generated output (the barrel, any regenerated shared manifest/wrapper/size artifacts) is never hand-edited. | High | Open |
| FR-018 | Document the family's native structure, its full consumer-ownership boundary (label, hrefs, labels, order, permission filtering, current state), the styles-only rationale, and the non-goal boundary against `.sk-context-nav`, `sk-nav-pill`, `.sk-breadcrumbs`, and `.sk-segmented-choice`, and register every cited story in the shrink-only story ratchet (`expected-stories.json`). | High | Open |

### Non-Functional Requirements

| ID | Requirement | Category | Priority | Status |
|---|---|---|---|---|
| NFR-001 | Axe-core reports zero WCAG 2.1 AA violations for every required story state, and confirms the family's accessibility-tree claims (one landmark, native links, no tab roles, correct current state). | Accessibility | High | Open |
| NFR-002 | Every colour, spacing, radius, border, typography, and motion value in the family's CSS is an existing `--sk-*` token; no raw hex/rgba/px literal; the repository's stylelint and 44px-floor gates pass. | Design system | High | Open |
| NFR-003 | Chromium and Firefox (and WebKit where locally available) behaviour checks, Storybook build, axe, lint, typecheck, the styles-only generator/drift checks, and every other applicable repository gate pass on the exact reviewed SHA. | Quality | High | Open |
| NFR-004 | The generated `custom-elements.json` manifest, `packages/react/src/**`, and `packages/elements/vue.d.ts` are byte-for-byte unchanged by this mission — no custom element, wrapper, or Vue declaration is added, because the family registers none. | Compatibility | High | Open |
| NFR-005 | At a ≈320px narrow host, a 390px viewport, 200% and 400% browser zoom, and a documented short viewport height, the document has no horizontal or unexpected two-dimensional overflow, and no focus indicator or label is clipped. | Responsive | High | Open |

### Constraints and Non-Goals

| ID | Constraint | Priority | Status |
|---|---|---|---|
| C-001 | No router, URL matching, or navigation/route-computation logic of any kind lives in this family; it renders exactly the markup and `aria-current` the consumer supplies. | High | Binding |
| C-002 | Not a tab widget: no `role="tablist"`/`role="tab"`/`role="tabpanel"`, and no implied panel-swap-on-click behaviour. | High | Binding |
| C-003 | No `aria-controls`/`aria-selected` wiring, and no tabs/panels relationship of any kind — the links are ordinary navigation, not controllers of adjacent content. | High | Binding |
| C-004 | No roving `tabindex`, no arrow-key (Left/Right/Home/End) keyboard model, and no keyboard scripting of any kind — this is a styles-only family with zero owned JavaScript behaviour. | High | Binding |
| C-005 | Not a responsive drawer or shell presentation mode. Responsive shell dismissal is #254/#274's `sk-app-shell` territory; this mission owns only the in-content sibling-route strip and must not become another drawer or shell mode. | High | Binding |
| C-006 | Not context/sidebar navigation — does not extend, widen, or duplicate `.sk-context-nav`'s grouped/nested/vertical contract. | High | Binding |
| C-007 | Not primary/global navigation — does not extend or duplicate `sk-nav-pill`'s pill-shaped destination-switcher-with-drawer contract. | High | Binding |
| C-008 | Not breadcrumbs — does not duplicate `.sk-breadcrumbs`'s ancestor-path (ordered-list) contract; this family's links are siblings, not a path. | High | Binding |
| C-009 | No route-discovery logic — the family does not enumerate, fetch, or infer what routes exist; it renders only the anchors it is given. | High | Binding |
| C-010 | No permission logic — filtering which routes a given user may see happens entirely in the consuming application before markup reaches this family. | High | Binding |
| C-011 | No hidden-route placeholders — the family never reserves visual space, a disabled-looking stub, or any other affordance for a route the consumer chose not to render. | High | Binding |
| C-012 | No counters or badges — the family renders no count, unread indicator, or badge decoration on any link. | High | Binding |
| C-013 | No copy defaults — the family ships no default nav label, link text, or supplemental copy anywhere (reinforces FR-013). | High | Binding |

## Public entities and ownership

- **Section navigation strip**: consumer-authored native `<nav>` carrying the root class
  (`.sk-section-nav`) and an accessible label the consumer supplies.
- **Route link**: a native `<a>` inside the nav; the consumer owns its `href`, its text/label
  content, its position in DOM order, whether it is present at all (permission-gated), and its
  `aria-current` value.
- **Current-location state**: derived exclusively from `aria-current` values other than `"false"`;
  the family never computes, infers, or defaults this state.

Family ownership boundary, stated once and referenced rather than restated: **the library** owns
only the strip's presentation (layout, containment, and the rest/hover/active/focus-visible/current
visual states); **the application** (Team Kitty) owns routing, permission filtering, page selection,
link labels/hrefs, order, and i18n/copy for every string.

## Success Criteria

- **SC-001**: Every public class and every required state (administrator/member shapes,
  first/middle/last/absent current, one/many routes, permission subset, long labels, narrow local
  overflow, dark, `LightMode`, forced colors, reduced motion, 200%/400% zoom, short viewport, RTL)
  has a documented, runnable Storybook example using native `nav`/`a` semantics.
- **SC-002**: Automated accessibility assertions report zero axe violations across all required
  states, and explicitly confirm the absence of `tablist`/`tab`/`tabpanel` roles and of any
  arrow-key or roving-`tabindex` script.
- **SC-003**: Automated/manual browser evidence confirms the 44×44 CSS-pixel target floor, a
  non-colour-alone distinction across rest/hover/active/focus-visible/current, local (not
  document-level) horizontal overflow containment, and an unclipped focus indicator for an
  off-screen-at-rest focused link, in Chromium and Firefox.
- **SC-004**: Dark, `LightMode`, forced-colors, RTL, reduced-motion, and zoom/short-viewport checks
  each pass on the exact reviewed SHA.
- **SC-005**: The styles-only generator, every shared drift/manifest/wrapper check, and the full
  applicable repository gate suite pass, while the element manifest, React wrapper, and Vue
  declaration outputs remain byte-for-byte unchanged.
- **SC-006**: The family can be composed inside a detail-page fixture reproducing Family 3's
  three-route administrator and two-route member shapes without any provider-specific vocabulary,
  routing, or permission logic entering the published package.

## Dependencies

- No predecessor beyond current train tokens and styles. This mission may run fully in parallel
  with TKC1 and the already-landed `.sk-context-nav` (#256/#264, precedent for markup/generator
  shape) and `.sk-breadcrumbs`/checkbox-choice-group (#280/#320-adjacent) work.
- TKC3 (Team Kitty's connector installation-detail screens) consumes this public contract after
  merge; it is not a source prerequisite for this mission.
- Responsive shell dismissal is reused from #254/#274 (`sk-app-shell`); this mission does not touch
  `sk-app-shell` and does not duplicate its drawer behaviour (C-005).
- **Not convertible to a testable functional requirement, recorded rather than silently dropped**:
  the issue's scheduling guidance ("may run fully in parallel with TKC1 and existing #280/#320",
  "TKC3 consumes it after merge") describes cross-mission sequencing, not an acceptance property of
  this family's own public contract. No gate or test can assert "ran in parallel with another
  mission," so it is recorded here as process context only.
- **Governance note, not a spec requirement**: the issue states Family 3 is "ready for Lynn but not
  Lynn-approved," and that the operator authorized this component mission to proceed ahead of
  Lynn's verdict for the 2026-09-15 deadline. This mission's evidence must never claim Lynn approval
  it does not have (programme BRIEF's evidence-honesty rule) — recorded here so the plan/tasks/PR do
  not silently drop or overstate it.

## Assumptions

- Existing token values (space, colour, border, radius scale) are sufficient to express the
  44px-equivalent target, the non-colour-alone state distinctions, and the forced-colors
  presentation; no new token is in scope unless a repository gate proves otherwise.
- One Work Package is expected: the public stylesheet, generated styles-only exemplars/barrel,
  stories, tests, story ratchet, and documentation form one atomic, non-independently-releasable
  public contract, matching the issue's explicit "one bounded Work Package and one PR" instruction
  and the `.sk-context-nav` precedent's WP topology.
- `packages/styles/src/section-nav/` is the target directory and `.sk-section-nav` the root class,
  chosen to avoid collision with the existing `section-banner` and `section-header` directories and
  to read as a distinct family from `.sk-context-nav`.
