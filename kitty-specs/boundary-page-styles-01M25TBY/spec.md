# Mission Specification: sk-boundary-page styles-only frame

**Mission Branch**: `mission/boundary-page-styles`
**Created**: 2026-09-10
**Status**: Draft
**Input**: spec-kitty/spec-kitty-design#303 ([TKT3], Gap G2 of the Family 4 component-gap audit, epic #300), composing #302 and #304, checked against ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`)

## Summary

Add a styles-only `.sk-boundary-page` class family — no custom element, no shadow root — over
consumer-authored markup, giving Family 4's four public-boundary screens (invitation acceptance,
join-link capture/resume, access denied, disabled Team) one shared anatomy instead of four
unrelated local vocabularies. The frame owns a centred stage, a card, an optional mark (composing
`sk-entity-marker`, #304), a title (styled, landmark and `<h1>` stay with the consumer), body
content, a required action-group container, and an optional footnote. It infers no status tone
when a consumer composes `sk-pill-tag` (#302) for status text, contains long unbroken content
without document-level scrolling, and authors responsive/forced-colors/reduced-motion behaviour
once. Per research.md Decision 1, none of ADR-15's four ruled-on construct kinds reach this frame,
because it introduces no `:host`, `container-type`, `::slotted()`, or cross-sheet `::part()`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One shared anatomy for the form-card and the terminal-card (Priority: P1)

A Team Kitty screen author building either a card that holds a real `<form>` (invitation
acceptance, join-link capture) or a card that holds only a terminal message (join-link resume,
access denied, disabled Team) needs one class anatomy to reach for, instead of the four unrelated
local vocabularies Family 4 shipped with, so that a future fifth boundary screen does not fork a
fifth vocabulary.

**Why this priority**: Every other user story composes against this anatomy; it is the mission's
core deliverable and the one every acceptance criterion in the issue assumes exists.

**Independent Test**: Render a card containing a real `<form>` and a card containing only a
message against the identical class structure (`__stage`/`__card`/`__title`/`__body`/
`__action-group`), with no card-shape modifier applied to either, and verify both compose without
requiring the frame to distinguish them.

**Acceptance Scenarios**:

1. **Given** a card holding a real `<form>` with fields and a submit action, **When** it is
   rendered inside `.sk-boundary-page__card`, **Then** it lays out identically (padding, max
   width, spacing) to a card holding only a terminal message rendered inside the same class.
2. **Given** the issue's explicit "no speculative modifiers" constraint, **When** the two card
   contents are compared, **Then** no `.sk-boundary-page__card--form`/`--terminal` (or similarly
   named) modifier exists in the shipped CSS.
3. **Given** the consumer's own `<main>` and single `<h1>`, **When** `.sk-boundary-page__stage` is
   applied around the card, **Then** no additional landmark element is introduced and the `<h1>`
   remains the consumer's own element, only styled via `.sk-boundary-page__title`.

---

### User Story 2 - The mark and the footnote are true optionals; their absence is a tested state (Priority: P1)

A Team Kitty screen author on a screen with no entity mark (a pure error message) or no guidance
text needs to omit those parts entirely, and needs confidence that omitting them does not leave a
collapsed empty box, a phantom gap, or an orphaned accessibility artifact — the exact shape of
defect #308 shipped (`display: flex` with no `[open]` qualifier, missed because every test
exercised only the present state).

**Why this priority**: This is the mission's highest-risk defect pattern per the dispatching
brief's own enumeration (defect pattern #1), and it is testable independently of the rest of the
anatomy.

**Independent Test**: Render "with mark" / "without mark" and "with footnote" / "without
footnote" story pairs, where the absent variant omits the element from the DOM entirely (never an
empty or `[hidden]` element), and assert computed geometry differs between the pair in exactly the
way an absent flex/grid child implies — never merely that the element is invisible.

**Acceptance Scenarios**:

1. **Given** a card authored with no `.sk-boundary-page__mark` element at all, **When** it
   renders, **Then** `document.querySelector('.sk-boundary-page__mark')` is `null` and the card's
   layout consumes exactly the space its other children need — measured, not assumed.
2. **Given** a card authored with no `.sk-boundary-page__footnote` element at all, **When** it
   renders, **Then** `document.querySelector('.sk-boundary-page__footnote')` is `null`, and the
   vertical distance from the action-group's bottom edge to the card's bottom edge equals the
   card's own `padding-block-end` token value, computed in-run.
3. **Given** the same card with a footnote present, **When** compared to the without-footnote
   story, **Then** that same measured distance is strictly larger, by at least the footnote's own
   content height plus the inter-element gap token — a test that fails if footnote space is ever
   reserved unconditionally.
4. **Given** an action-group with zero actions (a container present but empty), **When** it
   renders, **Then** it is treated as a distinct, supported state from the mark/footnote's
   DOM-absence contract — the container itself is never omitted, only its content count varies.

---

### User Story 3 - Composing #302 and #304 without inferring tone, size, shape, border, or naming (Priority: P1)

A Team Kitty screen author placing an `<sk-entity-marker>` in `.sk-boundary-page__mark` or the
styles-layer `<span class="sk-pill-tag sk-pill-tag--status-<tone>">` for status text needs the
frame to place and space those components without silently choosing a size, shape, border, or
tone on the author's behalf, and without the frame acquiring any accessible-naming responsibility
the composed components do not already carry. (Not `<sk-pill-tag class="sk-pill-tag--status-
<tone>">` — the custom element's tone is a `status` property, and the shipped `pillTagClasses()`
places the resulting modifier class on the shadow `<span part="tag">`, not the light-DOM host, so
a class authored on the host renders nothing; corrected here per WP01's review finding, which
probed this directly against the built Storybook.)

**Why this priority**: This is the seam the epic's dependency map names explicitly (`T2 --> T3`,
`T4 --> T3`) and the issue's own binding sentence ("The frame infers no tone") turns into a test
requirement.

**Independent Test**: Render the mark slot with every #304 axis combination the consumer chooses
(including `border="true"` explicitly, never the bare attribute) and the status composition with
every #302 tone, and verify the frame's own CSS contains no default value, no `::part()` rule, and
no ARIA attribute targeting either composed component.

**Acceptance Scenarios**:

1. **Given** `.sk-boundary-page__mark` containing `<sk-entity-marker size="lg" shape="circle"
   border="true">`, **When** it renders, **Then** the marker's own #304 axes render exactly as
   they would outside this frame — the frame contributes only outer placement/spacing.
2. **Given** `.sk-boundary-page__mark` containing a plain `<sk-entity-marker>` with no size/shape/
   border attributes, **When** it renders, **Then** it uses #304's own default box — the frame
   sets no default itself.
3. **Given** a composed `<span class="sk-pill-tag sk-pill-tag--status-danger">` (the styles-layer
   form — see this story's own header note on why the `<sk-pill-tag class="...">` host-class form
   is inert) inside the frame, **When** it renders, **Then** the frame's own CSS contains no rule
   setting `background`/`color` on `.sk-pill-tag` or any of its status modifiers, and no rule
   setting `role` or an accessible-name attribute on it, and the pill's OWN rendered tone
   (computed style, not a light-DOM attribute) matches the authored status class.
4. **Given** the shipped `sk-boundary-page` CSS, **When** it is inspected, **Then** it contains no
   `::part()` selector targeting either composed component's shadow parts.

---

### User Story 4 - Long unbroken content stays contained; no document-level horizontal scroll (Priority: P2)

A Team Kitty screen author rendering a long opaque identifier, a long URL, or a long email address
inside `.sk-boundary-page__body` needs it to wrap or break within the card, at every required
width, without ever forcing the page itself to scroll horizontally.

**Why this priority**: Named explicitly in the issue's evidence and required-stories sections;
independently testable from the anatomy/composition stories above.

**Independent Test**: Render a body containing a long unbroken token (80+ characters, no spaces)
at each required viewport width and assert zero document-level horizontal overflow and that the
token's own bounding box stays inside the card.

**Acceptance Scenarios**:

1. **Given** a long opaque identifier (e.g. a bearer-link token) in `.sk-boundary-page__body`,
   **When** rendered at 320px, 200% zoom, and the default desktop width, **Then**
   `document.documentElement.scrollWidth` never exceeds the viewport width.
2. **Given** the same content, **When** measured, **Then** the token's rendered box stays within
   `.sk-boundary-page__card`'s own bounding box at every required width.

---

### User Story 5 - Responsive, forced-colors, and reduced-motion behaviour authored once (Priority: P2)

A Team Kitty screen author needs the frame's narrow-width, 200%-zoom, RTL/logical-layout,
forced-colors, and reduced-motion behaviour to be correct without re-authoring any of it per
screen — the four Family 4 screens today each restate their own responsive rules and their own
forced-colors treatment.

**Why this priority**: This is the issue's own stated motivation for the mission (the Opus
rereview's retained finding on the footnote/skip-target fork); independently testable per axis.

**Independent Test**: Render the card at narrow width and 200% zoom, in RTL, under
`forced-colors: active`, and under `prefers-reduced-motion: reduce`, and assert each behaves
correctly using logical properties, auto-remapped borders, and an explicit absence-of-transition
assertion rather than an assumption.

**Acceptance Scenarios**:

1. **Given** the frame at 320px width and at 200% zoom, **When** rendered, **Then** no part of the
   anatomy overflows the viewport and interactive targets in `.sk-boundary-page__action-group`
   remain at least 44px in the relevant dimension at both widths.
2. **Given** an RTL document, **When** the frame renders, **Then** every part of the anatomy uses
   logical properties (no `left`/`right`/physical `width` reliant on LTR assumptions) and mirrors
   correctly.
3. **Given** `forced-colors: active`, **When** the frame renders, **Then** the card's edge remains
   visible via a border-based mechanism (auto-remapped, no `background`-only distinguishing mark)
   per this repo's established forced-colors convention.
4. **Given** `prefers-reduced-motion: reduce`, **When** the frame renders, **Then** a test asserts
   the frame introduces no transition or animation property at all — the frame's binding claim is
   that it introduces no motion, verified rather than assumed.

---

### Edge Cases

- A card with both the mark and the footnote omitted (the minimal possible anatomy: stage, card,
  title, body, action-group only) — must render with no leftover space from either optional part.
- An action-group with several actions at narrow width — must wrap without breaking the 44px
  target-size requirement or forcing horizontal scroll.
- A footnote present alongside a long opaque identifier in the body simultaneously — containment
  and the footnote-presence spacing measurement must both hold at once.
- A status pill composed inside the title row alongside a long `<h1>` heading text — wrapping must
  not force the pill or heading into horizontal overflow.
- Combining `sk-entity-marker`'s largest size (`lg`) with the bordered modifier inside
  `.sk-boundary-page__mark` at the narrowest required width (320px) — the frame's own spacing must
  not clip the marker's unchanged outer box.
- A consumer who writes a bare `<sk-entity-marker border>` (the known ergonomic gap) inside this
  frame — this mission's own exemplar HTML must never do this; it is documented as the consumer's
  responsibility, not something the frame can detect or correct.
- SaaS #1281's non-enumerating copy (deliberately vague reason text) placed in `__body` or
  `__footnote` — must render identically to precisely-enumerated copy; the frame draws no
  distinction and imposes no schema.
- An action composed as `<span role="button" tabindex="0">` instead of `<a>`/`<button>` (#356
  decision) — this is OUT of the frame's action contract and does not receive the FR-013
  target-size floor; measured directly (`min-block-size: auto`, `padding-inline: 0px`), not
  assumed. A screen author needing a `role="button"` action composes a real `<button>` instead.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | One anatomy: stage / card / mark / title / body / action-group / footnote | As a screen author, I want one class structure covering every Family 4 boundary screen so that I stop restating responsive and forced-colors rules per screen. | High | Open |
| FR-002 | No card-shape modifier | As a screen author, I want the form-card and terminal-card to share the identical anatomy with no `--form`/`--terminal` (or similar) modifier, per the issue's no-speculative-modifiers constraint, unless implementation surfaces a genuine, named need. | High | Open |
| FR-003 | Consumer keeps landmarks and the `<h1>` | As a document author, I want the frame to manufacture no landmark and use my own existing `<h1>`, styled only, so that my document's heading structure is unaffected. | High | Open |
| FR-004 | Mark is optional, composes `sk-entity-marker` unmodified, no inferred axis | As a screen author, I want to omit the mark entirely on screens that need none, and when present, I want the frame to set no default size/shape/border on it. | High | Open |
| FR-005 | Status composes `sk-pill-tag` unmodified, frame infers no tone | As a screen author, I want to compose a status pill with the frame setting no default tone and adding no role/naming logic derived from it. | High | Open |
| FR-006 | Footnote is optional; its DOM-absence is a supported, explicitly tested state | As a screen author, I want to omit the footnote entirely with a guarantee that no phantom space or accessibility artifact leaks — not a collapsed empty box. | High | Open |
| FR-007 | Action-group is a required container that may hold zero actions | As a screen author, I want the action-group to remain present even with no actions, distinct from the mark/footnote's full-omission contract. | Medium | Open |
| FR-008 | Long unbroken content contains locally, no document-level horizontal scroll | As a screen author rendering a long identifier/URL/email, I want it to wrap or break inside the card at every required width. | High | Open |
| FR-009 | Responsive behaviour authored once, via `@media` | As a screen author, I want narrow-width and 200%-zoom behaviour correct without per-screen CSS. | High | Open |
| FR-010 | RTL / logical layout | As a screen author on an RTL page, I want every part of the anatomy to mirror correctly via logical properties. | Medium | Open |
| FR-011 | Forced-colors treatment authored once, border-based | As a screen author, I want the card's edge to remain visible under forced-colors via the established auto-remapped-border convention. | Medium | Open |
| FR-012 | No motion introduced, and the absence is asserted | As a screen author relying on `prefers-reduced-motion`, I want a test proving the frame introduces no transition/animation, not an assumption. | Medium | Open |
| FR-013 | Interactive target sizes hold at 44px in the action-group's `<a>`/`<button>` children at both required widths | As a screen author, I want every `<a>`/`<button>` action to remain a usable tap target at narrow and default widths. The frame's action contract is `<a>` or `<button>` ONLY (#356 decision) — an action composed as other interactive markup (e.g. `<span role="button" tabindex="0">`) does not receive this floor; a screen author needing a `role="button"` action composes a real `<button>` instead. | High | Open |
| FR-014 | No user-visible literal, no copy defaults | As a maintainer honoring #286's open cross-cutting constraint, I want the frame to own zero markup generation, so no code path can emit an English string. | High | Open |
| FR-015 | Team Kitty SaaS #1281's non-enumerating copy stays expressible | As a Team Kitty screen author, I want to write a deliberately vague boundary message with no schema/enum forcing it into a closed vocabulary. | Medium | Open |
| FR-016 | No `::part()` reach into composed components' shadow internals | As a maintainer, I want this mission to leave #314's cross-sheet `::part()` question undecided rather than pre-empting it. | Medium | Open |
| FR-017 | Required stories, tests, ratchets, and CSS modules/barrels regenerated | As a maintainer, I want every required story (form/terminal card, with/without mark, with/without footnote, one/several/no action, long identifier, long email, `LightMode`, forced-colors, reduced-motion, narrow/200%-zoom/RTL) covered, and `expected-docs.json`/`expected-stories.json`/the styles barrel updated to match. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Tokens-first, no raw values | Every value in the new CSS references a `--sk-*` token; stylelint's `declaration-strict-value` passes against a regenerated token catalogue. | Technical | High | Open |
| NFR-002 | Axe passes at every required story | Every required story (including forced-colors and narrow-width variants) passes the a11y gate with no new violations. | Accessibility | High | Open |
| NFR-003 | No added runtime cost | The frame introduces no JavaScript, no fetch, no timer, and no DOM node beyond the anatomy's own static structure. | Performance | Medium | Open |
| NFR-004 | Visual baselines are CI-authoritative | Every new visual-regression snapshot is harvested from the mission PR's own CI run artifact, never a local `--update-snapshots`. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| C-001 | One Work Package, one PR | The entire mission ships as a single bounded Work Package and a single PR back into `train/elements-first`; if it genuinely cannot fit, the mission stops and reports rather than splitting. | Technical | High | Open |
| C-002 | Styles-only — no custom element | This mission registers no custom element and adds no entry under `packages/elements/src/`. The deliverable lives entirely in `packages/styles/src/boundary-page/`. | Technical | High | Open |
| C-003 | No behaviour acquisition | The frame does not acquire authentication, routing, HTTP-status, or marketing-shell responsibilities. The epic's non-goals (auth; invitation/join-link/disabled-Team state machines; permission/capacity evaluation; redirect logic; an error taxonomy; a marketing shell; copy ownership/defaults; a component that decides its own message or icon; an icon set) are binding. | Business | High | Open |
| C-004 | No repo-wide #286 gate; no component-scoped one either | Per research.md Decision 5, this mission adds neither a repo-wide nor a component-scoped no-literal test — the frame has no `render()` and no code path that emits markup, so the #308 precedent's risk does not apply here. | Technical | Medium | Open |
| C-005 | No cross-sheet `::part()` decision | This mission does not style `sk-entity-marker` or `sk-pill-tag` through `::part()`; that question belongs to #314 and is left undecided. | Technical | Medium | Open |
| C-006 | ADR-15 does not gate this mission's static form | Per research.md Decision 1, no construct kind ADR-15 ruled on applies to this frame; no equality-gated static/shadow comparison is required because there is no shadow form to compare against. | Technical | High | Open |
| C-007 | Adoption gated on Lynn's product verdict; filing is not | This mission may be specified, planned, tasked, and implemented at ready-for-Lynn status per #300/#303; the mission report must not claim a product verdict exists — none is cited anywhere in this spec. | Business | Medium | Open |
| C-008 | Coordinate with Family 6, do not fork the vocabulary | Per the epic's dependency map, the account and public front-door screens in Family 6 draw the same frame; this mission's anatomy is the one both families are expected to converge on, and this mission does not invent a second, Family-4-specific vocabulary. | Business | Medium | Open |

### Key Entities

See `data-model.md` for the full anatomy model. Summary:

- **`sk-boundary-page` anatomy**: seven parts (`__stage`, `__card`, `__mark`, consumer's `<h1>`,
  `__body`, `__action-group`, `__footnote`), with mark/footnote as true DOM-absence optionals and
  action-group as a required-but-possibly-empty container.
- **Composed component references**: `sk-entity-marker` (#304) and `sk-pill-tag` (#302), both
  unmodified, both with placement-only CSS from this frame.
- **The footnote absence contract**: present/absent states, the gap-based spacing mechanism, and
  the in-run geometry assertion owed by `tasks/`.
- **Responsive/forced-colors/reduced-motion baseline**: authored once, `@media`-based, logical
  properties throughout, border-based forced-colors treatment, asserted absence of motion.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A card with a real `<form>` and a card with only a terminal message both render
  correctly against the identical `.sk-boundary-page__card` class, with zero card-shape modifier
  in the shipped CSS (or, if one is added, the PR names it and the two screens requiring it, per
  FR-002).
- **SC-002**: The mark-absent and footnote-absent stories both assert `querySelector(...) === null`
  and a computed-geometry comparison against their present counterparts — not merely a visibility
  check.
- **SC-003**: 100% of the required story matrix (form-card, terminal-card, with/without mark,
  with/without footnote, one/several/no action, long opaque identifier, long email address,
  default dark, `LightMode`) is present and passing.
- **SC-004**: Accessibility-tree checks confirm exactly one `<h1>`, correct heading order, focus
  order matching visual order, a working skip target, and zero extra tab stops introduced by the
  frame, across the required story matrix.
- **SC-005**: Interactive targets in `.sk-boundary-page__action-group` measure ≥ 44px at both
  narrow and default widths, measured in-run.
- **SC-006**: Narrow width, 200% zoom, RTL/logical layout, forced colors, and reduced motion each
  have a passing, story-backed test; the reduced-motion test asserts the absence of any
  transition/animation property rather than assuming it.
- **SC-007**: Axe and the named visual-regression baselines (research.md Decision 7's list, as
  confirmed by `plan.md`/`tasks/`) both pass, with the visual baselines harvested from CI.
- **SC-008**: `expected-docs.json`/`expected-stories.json` (and `expected-parts.json`/
  `behaviours.json` only if this mission's implementation turns out to need them — this frame is
  not expected to, per C-002/C-004) show a shrink-safe or exact update matching the new family,
  and the applicable CSS barrel (`packages/styles/src/index.ts`) is regenerated.
- **SC-009**: `SIZES.md` reflects the new CSS after a real `dist/` build (not a stale local
  measure), and both workflows that enforce it stay green.
- **SC-010**: Zero new `::part()` selectors targeting `sk-entity-marker` or `sk-pill-tag` exist in
  the shipped CSS.

## Non-Goals

Authentication; invitation, join-link or disabled-Team state machines; permission or capacity
evaluation; redirect logic; an error taxonomy; a marketing shell; copy ownership or defaults; a
component that decides its own message or icon; an icon set; a custom element. Family 4's
review-only state selectors, fixture facts and canvas controls are not product UI and are not
acceptance criteria. Route, permission, domain-state, copy and i18n integration — including every
boundary message and its non-enumerating phrasing — remain Team Kitty's; this mission delivers
library surface only.
