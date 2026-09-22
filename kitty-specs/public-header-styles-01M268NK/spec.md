# Mission Specification: Public Header Styles

**Mission Branch**: `mission/public-header-styles`
**Created**: 2026-09-10
**Status**: Draft
**Input**: GitHub issue [spec-kitty/spec-kitty-design#353](https://github.com/spec-kitty/spec-kitty-design/issues/353) — "[TKF1] native public-header styles — consumer-owned identity and route actions", child of epic [#352](https://github.com/spec-kitty/spec-kitty-design/issues/352)

## Summary

Add a **styles-only** native `.sk-public-header` family to `packages/styles/src/public-header/`,
covering the `topnav` / `topnav-inner` / `logo` / `nav-actions` anatomy that 23 of Family 6's 24
canonical account/public-front-door screens (`ux_redesign/families/06-account-front-door/screens/`)
currently author locally, one screen at a time. The family provides layout, responsive
wrapping/reflow, logical spacing, focus-safe presentation, and forced-colours behaviour over a
real, consumer-authored `<header>`/`<nav>`/`<a>` tree. **No custom element is registered.** Team
Kitty keeps every route, label, action, brand string, authentication/route state, and theme-state
mechanism.

**Audience for this document**: the Spec Kitty engineer who implements the single Work Package
this mission authorizes, and the reviewers/squad who gate it before merge into
`train/elements-first`. Both are assumed to have read `docs/contributing/adding-a-component.md`
and ADR-8 through ADR-11 and ADR-15 already; this spec does not re-derive that material, it applies
it to this one family.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compose the canonical two-action public header (Priority: P1)

A Team Kitty engineer builds an anonymous marketing/account page (landing, signup, login) and needs
the exact chrome 23 of 24 Family 6 screens already show: a brand/home link on the start side and,
on the end side, a `Sign in` link, a `Start free` link, and (once available) the theme control — in
that source order, wrapped in a real `<header>`/`<nav>`.

**Why this priority**: this is the literal, evidenced shape named in the issue ("the Family 6
two-action form") and in `evidence/ROBBIE-COMPONENT-GAP-AUDIT.md`'s F6-G1 gap. Every other story is
a variation on this anatomy; get this one right and the rest is composition, not new structure.

**Independent Test**: render `packages/styles/src/public-header/sk-public-header-two-actions.html`
(or the equivalent Storybook story) standalone with two real anchors in the action region and
assert: one `<header>`, one labelled `<nav>`, both anchors keyboard-reachable in source order, no
root overflow at 390px/1440px.

**Acceptance Scenarios**:

1. **Given** a `<header class="sk-public-header">` containing a brand anchor and a `<nav
   class="sk-public-header__actions" aria-label="…">` with two anchors, **When** the page renders
   at 1440px, **Then** the brand sits at the row's start edge and both actions sit at the row's end
   edge, in source order, with no horizontal overflow.
2. **Given** the same markup, **When** a user tabs through the page, **Then** focus visits the
   brand anchor, then each action in DOM order, with a non-obscured focus-visible indicator on
   each.

---

### User Story 2 - Compose a header with no actions, one action, or many/long actions (Priority: P1)

A Team Kitty engineer renders a brand-only header (nowhere else to route to), a single-action header
(e.g. only `Start free` on P4/P5, only `Sign in` on P2/P3/P23), or a header carrying more actions
than the two-action baseline plus long/localized labels.

**Why this priority**: the issue is explicit that "one/many/no actions, long localized brand/actions,
and mixed link/control content remain valid" and that "omitted actions reserve no blank space or
focus stop" — this is not an edge case, it is the actual route-aware chrome `DESIGN.md` describes
(P1/P16–P22 show both actions; P2/P3/P23 show `Sign in` only; P4/P5 show `Start free` only;
P6–P15 show `Sign in` as escape).

**Why this priority**: same tier as Story 1 — a header that only supports the two-action shape does
not meet the issue's scope.

**Independent Test**: render the brand-only, one-action, and many/long-action fixtures independently
and assert no `<nav>` element exists in the DOM when there are zero actions (not an empty one), the
action region contains exactly the supplied count when non-empty, and long labels wrap rather than
overflow or truncate.

**Acceptance Scenarios**:

1. **Given** a header with no action content supplied, **When** it renders, **Then** the DOM
   contains no `<nav class="sk-public-header__actions">` element at all, and the accessibility tree
   reports no `navigation` landmark for this header.
2. **Given** a header with five actions and one label over 40 characters, **When** it renders at
   390px, **Then** the row wraps to additional lines without clipping, truncating, or producing
   root-level horizontal scroll.

---

### User Story 3 - Header reflows correctly at narrow widths and 200% zoom (Priority: P2)

A Team Kitty engineer verifies the header on a 390px phone viewport, at the wrap-threshold edge, at
a short viewport height, and at 200% browser zoom.

**Why this priority**: required evidence per the issue ("Narrow layout wraps/reflows without
changing source/focus order") and per the epic's shared acceptance constraint #3 (equal narrow
gutters, no root overflow, no clipped focus, 44px targets at 390px/1440px/threshold edges/200% zoom).
It is P2 rather than P1 because it depends on Stories 1–2's markup existing first, not because it is
less required.

**Independent Test**: load each required story under Playwright at 390px and at a simulated 200%
zoom (halved viewport), assert `document.scrollingElement.scrollWidth <= clientWidth` and that every
focused control's bounding box stays within the viewport.

**Acceptance Scenarios**:

1. **Given** the two-action header, **When** the viewport narrows to 390px, **Then** the inner row
   wraps (brand and actions may occupy separate lines) without reordering DOM/focus order and
   without introducing horizontal scroll.
2. **Given** the same header, **When** the page is zoomed to 200%, **Then** no interactive target is
   clipped by the viewport edge and no element overflows the scrolling root.

---

### User Story 4 - Header composition is fully perceivable and operable without color, mouse, or standard color vision (Priority: P2)

A Team Kitty engineer verifies the header under `forced-colors: active`, `prefers-reduced-motion:
reduce`, keyboard-only navigation, and an automated axe pass — matching the issue's "Rest, hover,
active, focus-visible, and current-location indications remain perceivable without color alone" and
"forced colors preserves header boundary and focus."

**Why this priority**: required, named evidence in both the issue and the epic's shared acceptance
constraint #4. P2 because, like Story 3, it composes on top of Stories 1–2's structure rather than
defining new structure.

**Independent Test**: run the mission's Playwright spec with `page.emulateMedia({ forcedColors:
'active' })` and separately `{ reducedMotion: 'reduce' }` against each required story, and run
`node scripts/run-axe-storybook.js` against the built Storybook.

**Acceptance Scenarios**:

1. **Given** any header story, **When** `forced-colors: active` is emulated, **Then** the header's
   own boundary (border) and every focus-visible outline remain visually non-`none`.
2. **Given** any header story with `aria-current` set on one action, **When** rendered, **Then** the
   current-location indication is expressed through more than color alone (e.g. weight, an
   underline, or a border), matching the "no color alone" rule.
3. **Given** any header story, **When** axe runs against the built Storybook, **Then** zero WCAG
   2.1 AA violations are reported for that story.

---

### User Story 5 - Header mirrors correctly under RTL (Priority: P2)

A Team Kitty engineer renders the header with `dir="rtl"` and confirms the brand/action edges swap
and spacing/focus order remain correct without a manual override.

**Why this priority**: named required evidence in the issue ("RTL"); P2, composition-level like
Stories 3–4.

**Independent Test**: render the RTL story with `dir="rtl"` set on an ancestor and assert the
brand anchor now sits at the inline-end (visual right in an LTR-default reading of the page, i.e.
the visual left under RTL) — expressed as: the row uses only logical properties, so no component
rule needs to change for the mirror to be correct.

**Acceptance Scenarios**:

1. **Given** the two-action header, **When** an ancestor sets `dir="rtl"`, **Then** the brand and
   action edges swap sides using the browser's own logical-property mirroring, with no
   `[dir="rtl"]` override rule present in `sk-public-header.css`.

---

### User Story 6 - Header composes a real `sk-theme-toggle`, once #323 ships (Priority: P3 — dependency-blocked)

A Team Kitty engineer composes a real `sk-theme-toggle` element (#323) inside the action region
alongside anchors/buttons, and the family neither restyles its shadow-root internals nor owns its
state.

**Why this priority**: named required evidence ("mixed link/button/theme-control") but **blocked**
on an upstream, still-open dependency. Verified directly: `gh issue view 323 --repo
spec-kitty/spec-kitty-design --json state,title` returns `"state": "OPEN"` as of 2026-09-10, the
date this spec was authored. Per the issue's own instruction ("if #323 is still in flight, record
that single story as dependency-blocked rather than copying the control"), this story is authored as
a documented placeholder, not a fabricated or duplicated theme control.

**Independent Test**: the `ThemeToggleComposition` (or equivalently named) story exists, its
docs string states plainly that it is blocked on #323 and what unblocks it, and
`packages/styles/src/public-header/` contains no theme-control markup, class, or CSS of its own
(verified by `git grep -i theme` returning nothing under that directory beyond the docs-string
reference and the story's own placeholder markup, which must not reuse `.theme-picker`,
`.theme-toggle`, `.theme-options`, or any other class from the Family 6 screens' local theme
control).

**Acceptance Scenarios**:

1. **Given** the mission's Storybook file, **When** a reviewer opens the theme-toggle composition
   story, **Then** its description states it is dependency-blocked on #323 and names the unblocking
   condition, and no theme-toggle presentation is hand-authored anywhere in the family.

---

### Edge Cases

- **Zero actions.** The `<nav>` element is entirely absent from the DOM, not present-but-empty —
  an empty `navigation` landmark is explicitly disallowed by both the issue and NFR-006.
- **Exactly one `<header>` per page.** The family's `banner`-landmark guarantee assumes a
  consumer renders exactly one `sk-public-header` instance per document; a page with two headers
  (a consumer defect) is out of this family's control and is documented, not defended against in
  CSS.
- **Long, unbroken brand or action strings** (e.g. an unbroken identifier with no natural break
  opportunity) must wrap or be constrained without producing root-level horizontal scroll, matching
  the pattern `sk-context-nav` already established for its own long-label stories.
- **Many actions** (more than the two-action baseline) must wrap onto additional lines; there is no
  overflow menu, "more" affordance, or icon-only collapse — those are explicitly out of scope
  (issue non-goals: drawer/menu behavior; "no action becomes icon-only by CSS").
- **Mixed anchor + button + theme-toggle** in one action region must not visually or behaviorally
  conflict (e.g. inconsistent vertical alignment, inconsistent target size) even though the three
  element types have different intrinsic box models.
- **`aria-current` supplied by the consumer** on a route-current action must be visually
  distinguishable by more than color (per the "no color alone" rule) without the family inferring
  which route is current — the consumer sets the attribute; the family only styles its presence.
- **200% zoom combined with narrow width** (the two constraints stack) must not clip a focused
  control or introduce root overflow.
- **A consumer omits the `<nav>`'s `aria-label`** when actions are present. This is a documented
  consumer obligation (FR-008, NFR-006), not a defect the family's CSS can detect or repair — CSS
  cannot supply an accessible name. The mission's usage doc must state this obligation explicitly
  so it is not silently assumed.
- **#323 remains open past this mission's merge.** The theme-toggle composition story stays
  dependency-blocked indefinitely; it does not gate the rest of the family's merge (see
  "Cross-mission / dependency" below).

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Native `<header>` root, single banner landmark | As a Team Kitty engineer, I want `.sk-public-header` to style a real `<header>` element so that assistive technology reports exactly one implicit `banner` landmark per page with no ARIA authored by hand. | High | Open |
| FR-002 | Bounded inner row | As a Team Kitty engineer, I want a `.sk-public-header__inner` flex row (brand at the start, actions at the end) so that the header's internal composition matches the evidenced `topnav-inner` anatomy without the family owning outer page-width containment. | High | Open |
| FR-003 | Brand/home anchor | As a Team Kitty engineer, I want `.sk-public-header__brand` to style a real `<a href="…">` (with an optional nested `.sk-public-header__brand-context` secondary label, matching the evidenced `<span class="brand-context">`) so that the brand/home destination remains a native, consumer-owned link. | High | Open |
| FR-004 | Optional, labelled action region | As a Team Kitty engineer, I want `.sk-public-header__actions` to style a consumer-authored, labelled `<nav>` that is entirely absent from the DOM when there are zero actions, so that the header never exposes an empty navigation landmark. | High | Open |
| FR-005 | Zero/one/many/long action variability | As a Team Kitty engineer, I want the family to support brand-only, one-action, the Family 6 two-action shape, and many/long-label actions without layout breakage, so that every route-aware chrome variant in `SCREEN-MATRIX.md` is expressible. | High | Open |
| FR-006 | Mixed control composition without internals reach-through | As a Team Kitty engineer, I want the action region to accept real anchors, buttons, and (once #323 ships) `sk-theme-toggle` without the family styling their internals or owning their state, so that composition stays one-directional per ADR-8/ADR-9. | High | Open |
| FR-007 | Focus-safe, source-order-preserving reflow | As a Team Kitty engineer, I want the inner row to wrap at narrow widths without any CSS reordering, so that DOM order, reading order, and keyboard focus order stay identical at every width. | High | Open |
| FR-008 | Consumer owns every string and route decision | As a Team Kitty engineer, I want the family to select zero of: brand text, action labels, hrefs, `aria-current`/route-current state, authentication state, theme state, and translated strings (#286), so that Team Kitty retains full control of copy and routing. | High | Open |
| FR-009 | Styles-only distribution, no custom element | As a Spec Kitty maintainer, I want the family to ship only as generated static HTML from `packages/styles/src/public-header/*.html`, with no `packages/elements/src/public-header/` directory, `.markup.ts`, `custom-elements.json` entry, React wrapper, or `expected-docs.json` row, so that the family matches the issue's explicit "do not register a custom element" instruction. | High | Open |
| FR-010 | Logical-properties-only, RTL-correct | As a Team Kitty engineer, I want the family authored exclusively in logical CSS properties, so that `dir="rtl"` mirrors the header correctly with no `[dir="rtl"]` override rule. | High | Open |
| FR-011 | Token-only theme compatibility | As a Team Kitty engineer, I want the header to render correctly under both the default dark palette and `.sk-light` using only `--sk-*` tokens, so that no theme selector is authored in the component CSS (see "Styles-only rationale and theme-selector reasoning" below). | High | Open |
| FR-012 | Forced-colours presentation | As a Team Kitty engineer, I want the header's boundary and focus indication to remain visible under `forced-colors: active` using the `outline`-not-`box-shadow` and `border`-survives-automatically techniques already established by #176, so that the header remains usable in that mode. | High | Open |
| FR-013 | Reduced-motion presentation | As a Team Kitty engineer, I want any transition the family declares (e.g. hover/focus) to be disabled under `prefers-reduced-motion: reduce`, scoped to the exact declared property, so that motion-sensitive users are not exposed to it. | Medium | Open |
| FR-014 | Full keyboard operability | As a Team Kitty engineer, I want every native control in the header to be keyboard-reachable and operable in DOM order with a non-obscured focus-visible indicator, so that no pointer is required. | High | Open |
| FR-015 | 44px interactive-target floor for composed controls | As a Team Kitty engineer, I want every action carrying the family's own `.sk-public-header__action` class to compute an interactive hit area of at least 44 CSS px in both dimensions, so that the header meets the issue's stated target-size floor even when composing a smaller consumer control (e.g. `sk-button--sm`). **Mechanism settled** — see "Resolved decision — target-size mechanism vs. no-internals-reach-through" below: the floor is pinned on this family's own BEM class, never on `.sk-button`, a `::part()`, or a shadow-root internal. | High | Resolved |
| FR-016 | No CSS-forced icon-only collapse | As a Team Kitty engineer, I want the family to never hide action text via `display:none`/`visibility:hidden`/clip techniques at any width, so that icon-only presentation stays a consumer content decision, never a family default. | Medium | Open |
| FR-017 | Required Storybook evidence set | As a mission reviewer, I want a `packages/styles/src/public-header/sk-public-header-html.stories.ts` file exporting named stories for brand-only, one-action, the two-action Family-6 shape, many/long actions, mixed anchor/button/theme-toggle (dependency-blocked), narrow, RTL, default dark, and `LightMode`, so that every required evidence axis from the issue is independently inspectable. | High | Open |
| FR-018 | Usage documentation | As a Team Kitty engineer adopting the family, I want a `## Public header` section in `docs/design-system/using-components.md` naming the anatomy classes, the consumer obligations from FR-008/NFR-006, and the #323 composition deferral, so that I do not have to read the mission spec to use the family correctly. | Medium | Open |
| FR-019 | Generated-output discipline | As a Spec Kitty maintainer, I want `packages/styles/src/public-header/index.ts` produced and drift-checked solely by `node scripts/build-styles-only-markup.mjs [--check]` from the directory's `.html` fixtures, so that no second authored source of the family's markup exists (ADR-10 §3, restated for styles-only families in the script's own docstring). | High | Open |
| FR-020 | No duplication of neighbouring chrome families | As a Spec Kitty maintainer, I want the family scoped strictly to unauthenticated/public chrome, restating none of `sk-app-shell`'s authenticated app chrome, `sk-page-header`'s content heading, `sk-nav-pill`'s primary-navigation mode, or `sk-skip-link`'s skip-link presentation, so that the four near-neighbours remain the single source of truth for their own concerns. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Tokens-only CSS values | Zero raw hex/`rgba()`/`px`/unitless-radius/shadow/motion-duration/z-index literals in `sk-public-header.css`. Enforced by `node scripts/check-component-token-literals.mjs packages/styles/src/public-header/sk-public-header.css` and stylelint's `declaration-strict-value` (`npm run quality:stylelint`), both exiting 0. | Maintainability | High | Open |
| NFR-002 | Zero axe violations | `node scripts/run-axe-storybook.js` reports zero WCAG 2.1 AA violations across every `sk-public-header` story id. | Accessibility | High | Open |
| NFR-003 | No root overflow | `document.scrollingElement.scrollWidth <= document.scrollingElement.clientWidth` holds at 390px, 1440px, and a 200%-zoom emulation (halved viewport) for every required story, asserted in the mission's Playwright spec. | Reliability | High | Open |
| NFR-004 | No clipped focus | Every focusable control's `getBoundingClientRect()` stays within `[0, viewport width/height]` when reached by `Tab`, at both 390px and 1440px. | Accessibility | High | Open |
| NFR-005 | 44px target-size floor, machine-verified | Every element carrying `.sk-public-header__action` computes `getBoundingClientRect().width >= 44` and `.height >= 44` at 390px and 1440px, asserted in the mission's Playwright spec; and every direct child of `.sk-public-header__actions` in every shipped fixture carries that class, so the assertion cannot be satisfied by an empty selector. Mechanism per FR-015, settled in "Resolved decision" below. | Accessibility | High | Resolved |
| NFR-006 | Accessibility-tree correctness | Exactly one `banner` role per rendered story; a `navigation` role is present if and only if an action region exists, and always carries a non-empty accessible name; source DOM order equals Tab focus order. Asserted via a Chromium CDP accessibility-tree snapshot, in the idiom of `apps/storybook/src/tests/sk-context-nav.spec.ts`. | Accessibility | High | Open |
| NFR-007 | Forced-colours integrity | Under `page.emulateMedia({ forcedColors: 'active' })`, the header's own `border-block-end` computed style is non-`none` and every focus-visible outline is non-`none`, following the `outline`-not-`box-shadow` rule in `docs/contributing/adding-a-component.md`. | Accessibility | High | Open |
| NFR-008 | Reduced-motion integrity | Under `page.emulateMedia({ reducedMotion: 'reduce' })`, any transition/animation duration declared in `sk-public-header.css` computes to `0s` for its affected property, scoped to the exact selector/property (never a wildcard), matching the shape at `sk-disclosure.css`/`sk-skip-link.css`. | Accessibility | Medium | Open |
| NFR-009 | Visual-regression stability | The dark-default and `LightMode` `sk-public-header` stories are added to `apps/storybook/src/tests/visual.spec.ts`'s snapshot set and match the CI-authoritative baseline harvested from the `visual-regression-diffs` artifact — never a local `--update-snapshots` (`docs/contributing/adding-a-component.md` §8). | Reliability | Medium | Open |
| NFR-010 | Generated-artifact freshness | `node scripts/build-styles-only-markup.mjs --check` exits 0 for `packages/styles/src/public-header/index.ts` against its `.html` sources, in CI's `lint-code` job. | Maintainability | High | Open |
| NFR-011 | Story ratchet coverage | Every required `sk-public-header` story id is registered as a new entry in `expected-stories.json` (the shrink-only ratchet #74 established), so any future removal is a deliberate, reviewed edit rather than a silent regression. | Maintainability | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Tokens-only values | No raw hex/`rgba()`/`px`/radius/shadow/motion/z-index literal in component CSS; every value resolves through a `var(--sk-*)` token defined in `packages/tokens/src/tokens.css` (CLAUDE.md §3 rule 1). | Technical | High | Open |
| C-002 | BEM naming, `sk-` prefix | Every class is one of `sk-public-header`, `sk-public-header__inner`, `sk-public-header__brand`, `sk-public-header__brand-context`, `sk-public-header__actions`, `sk-public-header__action`, or a `--modifier` on one of those; no class is borrowed verbatim from the Family 6 evidence's local names (`topnav`, `topnav-inner`, `logo`, `nav-actions`, `brand-context`) (CLAUDE.md §3 rule 4; ADR-10's `form-field` section, the #139 per-component prefix rule). | Technical | High | Open |
| C-003 | No custom element is registered | No `packages/elements/src/public-header/` directory, `.markup.ts`, `custom-elements.json` entry, React wrapper, or `expected-docs.json` row is created for this mission. See "Styles-only rationale" below for which ADR-10 reasoning this decision actually rests on. | Technical | High | Open |
| C-004 | No theme selector in component CSS | Light-mode variance is expressed only through `--sk-*` tokens (reusing the `--sk-surface-tint-*`/`--sk-on-tint-*`/`--sk-border-tint-*` family if a tinted state is needed), never a `.sk-light .sk-public-header {…}` or `:root[data-theme="light"] .sk-public-header {…}` rule. See "Styles-only rationale and theme-selector reasoning" below for which of the recipe's two reasons actually governs a component with no shadow root. | Technical | High | Open |
| C-005 | One-directional package dependency | `packages/styles` imports only from `packages/tokens`; the family introduces no import from `packages/elements` or `packages/react` (CLAUDE.md §3 rule 2; ADR-8). | Technical | High | Open |
| C-006 | Consumer-owned content boundary | The family owns none of: brand string, action labels/order/presence, hrefs/routes, `aria-current`/route-current state, authentication state, theme state/persistence mechanism, or translated strings under #286. | Business | High | Open |
| C-007 | No reach-through into composed controls | The action region accepts real, consumer-instantiated anchors/buttons and (once available) `sk-theme-toggle` without the family importing, defining, or styling any of their own BEM classes, `::part()`s, or shadow-root internals; composition is by CSS layout on the family's own selectors only. | Technical | High | Open |
| C-008 | Generated-output immutability | `packages/styles/src/public-header/index.ts` is produced only by `node scripts/build-styles-only-markup.mjs`; it is never hand-edited, and CI's `--check` invocation is the sole freshness authority. | Technical | High | Open |
| C-009 | No sticky/positioning or scroll-linked behaviour | The family declares no `position: sticky`/`fixed` and no scroll-linked behaviour; that remains explicitly out of scope per the issue's non-goals list ("sticky behavior"). | Technical | Medium | Open |
| C-010 | No router, no route inference | The family infers no current route and ships no client-side routing logic of any kind; `aria-current` (or its absence) is entirely consumer-supplied per render. | Business | High | Open |

### Key Entities

Composition-contract elements (this family has no data model; these are the anatomy pieces a
consumer instantiates):

- **Public Header Region** (`<header class="sk-public-header">`) — the root landmark element. A
  rendered page is expected to contain exactly one, so the implicit `banner` role stays singular;
  the family does not defend against a consumer rendering two.
- **Header Inner Row** (`.sk-public-header__inner`) — the direct-child flex row bounding the brand
  and action content; owns wrap behaviour at narrow widths. Does not own outer page-width
  containment/centering — that remains the consumer's own layout wrapper, consistent with "full
  public-page layout" being an explicit non-goal.
- **Brand Anchor** (`.sk-public-header__brand`, optional nested `.sk-public-header__brand-context`)
  — the consumer's home/identity link; always a real `<a href>`, never a `<div>` or `<span>` stand-in.
- **Action Region** (`.sk-public-header__actions`) — an optional, consumer-labelled `<nav>` holding
  zero or more action items (anchors, buttons, or a composed `sk-theme-toggle`). Entirely absent
  from the DOM, not empty, when the consumer supplies no actions.
- **Action Item** (`.sk-public-header__action`) — the family's documented composition slot for one
  action. The consumer authors this class on each anchor/button/element it renders inside the
  action region, alongside whatever classes that control already carries (`sk-button`,
  `sk-button--sm`, none). It is the only place the family expresses the 44px target floor, and it
  is the family's own class, so no rule reaches into a composed control's internals.

## Styles-only rationale (why no custom element)

The issue is unambiguous on outcome ("Do not register a custom element") and this spec does not
reopen that instruction. What this section records, per DIRECTIVE_003 and the mission brief's
instruction not to silently misattribute rationale, is **which** ADR-10 reasoning actually supports
it, because ADR-10 currently documents two different rationales for a styles-only family and they
are not interchangeable:

1. **The "class" ruling from #176** (ADR-10, "Styles-only components are a class, not a fixed
   exception count") — a component is styles-only *by design* when its entire value is styling the
   semantics of a native element a shadow-rooted wrapper would break: an unbroken `<dl>`/`<table>`/
   `<li>` parent/child chain, a same-root `id` reference (`<label for>`, `<caption>`, `headers`), a
   document-scoped fragment `href="#…"`, or UA-owned open/closed state (`<details>`). **None of
   these four reasons is what makes `sk-public-header` styles-only.** `<header>`, `<nav>`, and `<a>`
   do not depend on same-root ID resolution or an unbroken ancestor chain the way `<table>`/`<dl>`/
   `<li>` do, and nothing about this family's semantics would break inside a shadow root.
2. **The `form-field` reasoning** (ADR-10, "`form-field` is deliberately styles-only (#141)") — a
   component is styles-only as a **distinct, explicitly recorded decision**, not because of the
   four structural reasons above, but because the operator/issue authority has scoped it that way
   for other reasons specific to that component.

**`sk-public-header` follows reasoning (2), not reasoning (1).** The issue and the epic's own
research audit (`evidence/ROBBIE-COMPONENT-GAP-AUDIT.md`, gap F6-G1) instruct "styles-only… do not
register a custom element" as an explicit, recorded scope decision for this family — comparable in
kind to how `form-field`'s styles-only status was recorded, not comparable to the `<table>`/`<dl>`/
`<li>` native-semantics class #176 established. Citing reason (1) for this family would misattribute
the rationale the way ADR-10 itself warns against (`form-field`'s own section describes exactly this
kind of drift, where two records of one decision cite different grounds). Any future ADR update or
component-authoring-recipe passage that folds `sk-public-header` into the "class" list should be
corrected, not treated as this spec being wrong.

### Theme-selector reasoning for a component with no shadow root

C-004 forbids a theme selector in this family's CSS. `docs/contributing/adding-a-component.md`
gives two reasons theme selectors are forbidden, and only one of them applies here:

- **Reason A (does not apply):** `:root[data-theme="light"] .sk-x` and `.sk-light .sk-x` are
  **silently inert** once CSS is adopted into a shadow root, because both selectors must match an
  ancestor outside the shadow tree that the shadow-scoped rule can never see. `sk-public-header` has
  no shadow root — it is plain light-DOM CSS — so a `.sk-light .sk-public-header {…}` rule would
  **not** be inert here; it would work in an ordinary document cascade exactly as authored.
- **Reason B (applies):** tokens, not selectors, are the single channel this repository uses to
  express light/dark variance, full stop — CLAUDE.md §3 rule 1 ("Tokens first") and the recipe's
  "Light-mode variance goes in tokens" both state this independently of shadow-root status. Every
  existing styles-only family with no shadow root at all (`sk-context-nav`, `sk-prose`,
  `sk-segmented-choice`, `sk-skip-link`) already follows token-only theming for this reason, not
  reason A. Authoring a working `.sk-light .sk-public-header` override here would functionally
  succeed while forking the theming contract for one component alone — the family's light-mode
  variance must resolve through the same `--sk-*` tokens every sibling styles-only family already
  uses (reusing `--sk-surface-page`/`--sk-fg-default`/`--sk-border-default`, or the `-tint-*` family
  for any tinted state), never a selector, because that is what keeps `check-component-token-literals.mjs`
  and the token catalogue the single enforcement point rather than a second, selector-based one.

## Resolved decision — target-size mechanism vs. no-internals-reach-through

**Status: RESOLVED.** This section was authored as `[NEEDS DECISION]`. It is resolved by existing
repository precedent, **not** by an operator decision — there is no operator ruling on this fork
and none is claimed.

**Who ruled and on what basis.** Programme orchestrator, session `ea037606`, 2026-09-10, from
repository precedent. The fork the spec raised is not open: this repository has already answered
"how does a family meet a 44px target floor over a control it does not own" twice, in two
independently authored stylesheets, and both answers are the same idiom.

### The question as posed

The issue states two requirements that read as being in tension:

> "The action region accepts real anchors/buttons and the public `sk-theme-toggle` from #323
> without styling its internals or owning theme state." … "targets meet the 44px floor."

Family 6's own two-action header composes `sk-button--sm`, whose computed block-size is under the
44px floor on its own; the family must not hand-restyle `sk-button--sm`'s selectors to fix that.

### The precedent, verified in this checkout

1. **`packages/styles/src/confirm-dialog/sk-confirm-dialog.css:165-174`** — the case is stated
   verbatim in the sheet's own comment and answered on the component's own BEM classes:

   ```css
   /* NFR-001: every interactive control here is at least 44x44px. `.sk-button` does not
      guarantee that on its own (its `sm` size is deliberately smaller), so this component pins
      its own minimums on the two controls it renders, regardless of which `.sk-button` size
      modifier (if any) the consumer's classes end up carrying. */
   .sk-confirm-dialog__confirm,
   .sk-confirm-dialog__cancel {
     /* --sk-space-9 is 3rem/48px — the closest token at or above the 44px NFR-001 floor. */
     min-inline-size: var(--sk-space-9);
     min-block-size: var(--sk-space-9);
   }
   ```

   The floor is pinned on `.sk-confirm-dialog__confirm` / `.sk-confirm-dialog__cancel` — the
   dialog family's **own** classes — and no rule anywhere in that sheet targets `.sk-button`,
   `.sk-button--sm`, a `::part()`, or a shadow-root internal.

2. **`packages/styles/src/context-nav/sk-context-nav.css:44-56`** — the same idiom on
   `.sk-context-nav__link`: `display: flex; align-items: center;` alongside
   `min-block-size: var(--sk-space-9)`, so the floor is not inert on what would otherwise be an
   inline box. `apps/storybook/src/tests/sk-context-nav.spec.ts` asserts the resulting boxes are
   `>= 44` in both dimensions at 390px and 1280px.

### The ruling

`.sk-public-header` **owns a family BEM class for an action item** — spelled
`.sk-public-header__action` — and pins the 44px floor on **that class**, together with whatever
`display` value makes a block-size floor non-inert on an anchor/button (`inline-flex` with
`align-items: center; justify-content: center`, following the `sk-context-nav__link` shape).

The family **never** writes a rule against `.sk-button`, `.sk-button--sm`, `sk-theme-toggle`, any
`::part()`, or any shadow-root internal. `.sk-public-header__action` is a **documented composition
slot** — a category the issue itself lists as library-owned ("documented composition slots/regions")
— and applying it to each action the consumer renders is a **documented consumer obligation**,
exactly as applying `.sk-context-nav__link` to each of its own anchors is. This reconciles both of
the issue's sentences with zero reach-through: the class the rule targets belongs to this family,
and the consumer opts each control into it by authoring it, the same way they author every other
class in this family.

The earlier draft's "Option A" (a `.sk-public-header__actions > :is(a, button)` child combinator)
is **not** adopted: a descendant/child combinator reaching the composed control by *element type*
rather than by this family's own class is a weaker version of the same idea with none of the
precedent behind it, and it silently misses a composed `sk-theme-toggle` custom element. The
earlier draft's "Option B" (document-only, enforce nothing) is rejected for the reason it already
gave — it leaves NFR-005 with nothing to assert.

**FR-015 and NFR-005 are settled by this section** and carry no open decision. The implementer
does not choose a mechanism; the mechanism above is the plan's input.

## Cross-mission / dependency section

- **#352 (epic, parent).** Tracks #125; remains open until all three children (#353, #354, #355)
  close. This mission's Work-Package PR uses `Refs #353` and `Refs #352` — it does not close either
  issue; mission acceptance/merge controls issue completion (per both the issue body and
  `docs/architecture/elements-first-run-prompt.md` §5).
- **#353 (this issue/mission, TKF1).** Delivers exactly the `.sk-public-header` family this spec
  describes. One bounded Work Package, one PR into `train/elements-first`.
- **#323 (`sk-theme-toggle`).** **Confirmed OPEN** via `gh issue view 323 --repo
  spec-kitty/spec-kitty-design --json state,title` on 2026-09-10 (title: "[elements]
  sk-theme-toggle — system/light/dark preference control, composed in the Factory dashboard
  pattern"). This mission must not copy or recreate its presentation. Exactly one required story
  (the mixed anchor/button/theme-toggle composition, User Story 6) is recorded as
  **dependency-blocked** rather than skipped or faked. It unblocks when #323 merges into
  `train/elements-first` and ships a stable `sk-theme-toggle` public contract; a follow-up mission
  or a fast-follow commit on this family then composes the real element into that story. This
  dependency does **not** block the rest of this mission's merge — every other required story and
  every FR/NFR/C in this spec is independent of #323.
- **#354 (TKF2, compact `sk-site-footer` mode).** Sibling Wave-1 child of #352. No code dependency
  either direction; the two missions touch disjoint directories (`packages/styles/src/public-header/`
  vs. an extension of the existing `packages/styles/src/site-footer/` family) and can run, merge,
  and close in either order.
- **#355 (TKF3, Account/front-door pattern stories).** Wave 2 convergence child of #352; explicitly
  depends on this mission (and #354) per the epic's dependency plan ("TKF3 consumes this surface
  after merge" — issue #353's own "Dependencies and parallelization" section). #355 must not start
  its final composition or visual baselines against `sk-public-header` until this mission has
  merged into `train/elements-first`; it may begin fixture selection and red-first scaffolding in
  parallel per the epic's Wave 1/Wave 2 split.

## Success Criteria *(mandatory)*

Each criterion names the command or assertion that checks it, per the mission brief's requirement
that success criteria be independently checkable and name the mechanism.

- **SC-001**: `node scripts/build-styles-only-markup.mjs --check` exits 0, including
  `public-header` in its scanned styles-only set (FR-019, NFR-010, C-008).
- **SC-002**: `npm run quality:stylelint` and `node scripts/check-component-token-literals.mjs
  packages/styles/src/public-header/sk-public-header.css` both exit 0 with zero raw literals
  reported (NFR-001, C-001).
- **SC-003**: `node scripts/run-axe-storybook.js` reports zero WCAG 2.1 AA violations across every
  `sk-public-header` story id (NFR-002).
- **SC-004**: A new Playwright spec, `apps/storybook/src/tests/sk-public-header.spec.ts`, passes
  under `npm run test` and asserts: single-`banner`-landmark accessibility tree, `navigation`
  present-iff-actions-supplied with a non-empty accessible name, source-DOM-order equals
  Tab-focus-order, ≥44 CSS px target floor on every direct action child at 390px, no root overflow
  at 390px/1440px/200%-zoom, no clipped focus at 390px/1440px, forced-colours border/outline
  survival, and reduced-motion neutralization of any declared transition (NFR-003 through NFR-008).
- **SC-005**: `apps/storybook/src/tests/visual.spec.ts` gains passing snapshot coverage for the
  dark-default and `LightMode` `sk-public-header` stories, matched against the CI-harvested
  `visual-regression-diffs` baseline, never a local `--update-snapshots` run (NFR-009).
- **SC-006**: `expected-stories.json` lists every required `sk-public-header` story id under a new
  `"sk-public-header"` entry, and the Storybook-index-based ratchet check confirms none are missing
  (NFR-011, FR-017).
- **SC-007**: `docs/design-system/using-components.md` contains a `## Public header` section naming
  the anatomy classes, the FR-008/NFR-006 consumer obligations, and the #323 deferral, reviewable by
  a reader with no other context (FR-018).
- **SC-008**: `git ls-files packages/elements/src/public-header` returns empty after the mission's
  Work Package lands — mechanical confirmation that no element directory was created (FR-009, C-003).
- **SC-009**: `git diff --exit-code -- packages/elements/custom-elements.json packages/react/src
  expected-docs.json` is empty after the Work Package — confirms no manifest entry, wrapper, or
  docs-ratchet row was added for this family (FR-009, C-003).
- **SC-010**: A reviewer can independently verify, from the Storybook story list alone, that all
  nine composition/state axes named in the issue's "Required stories and tests" section (brand-only,
  one-action, two-action Family-6 shape, mixed anchor/button/theme-toggle, many/long actions,
  narrow, RTL, default dark, `LightMode`) each exist as a distinct named story (FR-017, SC-006).
- **SC-011**: The dependency-blocked theme-toggle composition story exists, its docs string names
  #323 and the unblocking condition, and `git grep -in "theme" -- packages/styles/src/public-header`
  returns only that docs-string reference and a placeholder — never `.theme-picker`, `.theme-toggle`,
  or `.theme-options` class names copied from the Family 6 evidence screens (User Story 6, "Cross-mission
  / dependency" #323 entry).
- **SC-012**: `npm run quality:all` (ESLint, stylelint, htmlhint) exits 0 over every new file this
  mission adds.
- **SC-013**: No heading in this spec begins with `[NEEDS DECISION]` — checked with
  `grep -n '^#\+ \[NEEDS DECISION\]' kitty-specs/public-header-styles-01M268NK/spec.md`, which
  returns nothing. The target-size mechanism is settled in "Resolved decision" above from the two
  cited precedents, before any of the Work Package's CSS is authored, and `sk-public-header.css`
  contains no rule whose selector names `.sk-button`, `sk-theme-toggle`, or `::part(` — checked with
  `grep -nE '\.sk-button|sk-theme-toggle|::part\(' packages/styles/src/public-header/sk-public-header.css`,
  which returns nothing. The implementer applies the settled mechanism; it does not choose one.
