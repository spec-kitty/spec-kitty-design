# Mission Specification: Mission Kanban checkbox choice group

**Mission Branch**: `mission-kanban-checkbox-choice-group-01M21K7F` (topology: `lanes`; implementation
lands through one Work Package and one PR into `train/elements-first`)
**Created**: 2026-09-09
**Status**: Draft
**Input**: GitHub issue [#277](https://github.com/spec-kitty/spec-kitty-design/issues/277), part of
epic [#276](https://github.com/spec-kitty/spec-kitty-design/issues/276), plus the approved Mission
Kanban K1-K6 evidence under `ux_redesign/mission-kanban`.

## Intent Summary

A Team Kitty consumer needs a reusable, token-driven visual treatment for a bounded group of native
checkbox choices. The library styles a real `fieldset`, `legend`, nested `label` elements, and
native `input type="checkbox"` controls. The browser continues to own activation, focus order,
submission, reset, disabled behavior, and checked state. Team Kitty continues to own lane names,
labels, values, counts, filtering, persistence, query parameters, and Apply/Clear behavior. The
mission succeeds when this native structure remains usable and visually distinct across themes,
forced colors, narrow layouts, long content, disabled and focus states, and 200% zoom without page
overflow or clipped focus.

## Terminology and Boundaries

- **Checkbox choice group** means the styles-only `.sk-checkbox-choice-group` BEM family applied to
  consumer-authored native form markup. It is not a custom element, collection API, filter engine,
  or application data model.
- **Choice** means one real native checkbox and its visible text/metadata inside one real `label`.
  The entire label remains an activation target, and the input remains in the document's normal
  source and tab order.
- **Visible metadata/count** means optional consumer-authored text associated with a choice. The
  library neither derives it nor interprets zero as disabled or unavailable.
- **Selected/checked** means the input's native `checked` state. CSS may present it through native
  selectors but must not maintain or infer it.
- **Detailed lanes** are Team Kitty vocabulary used only in the K3 evidence fixture. They are not
  part of the public component contract and must not appear in authored component CSS or API names.
- **Styles-only** means authored CSS and authored native HTML exemplars in `packages/styles`, plus
  repository-generated styles-only barrels. It means no `packages/elements` component, manifest
  entry, wrapper, `::part()`, behavior registry subject, or mutation subject.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose several native options (Priority: P1)

A Team Kitty engineer composes a detailed lane filter from a native checkbox group. Users can read
the legend, toggle any number of choices with the checkbox or its label, and retain browser-native
form behavior while the design system supplies a coherent visual grouping.

**Why this priority**: This is the missing public primitive that blocks the Mission Kanban K3
pattern. If native semantics or multi-selection behavior are replaced, the mission fails its core
purpose.

**Independent Test**: Render the ten-choice K3 story and verify its accessibility tree, source/tab
order, Space activation, label activation, native form submission/reset, and preserved checked
state before and after non-submitting interactions.

**Acceptance Scenarios**:

1. **Given** a named fieldset with ten labelled native checkboxes, **when** it renders, **then** the
   accessibility tree exposes the real group/legend and ten named checkbox controls in DOM order.
2. **Given** two checked inputs, **when** the consumer serializes the form, **then** native FormData
   contains those supplied values and CSS has neither added nor removed state.
3. **Given** a focused unchecked input, **when** the user presses Space or activates its label,
   **then** the browser toggles that checkbox once and focus remains truthful.
4. **Given** a native form reset, **when** the form resets, **then** the checkboxes return to their
   authored defaultChecked state without component JavaScript.

---

### User Story 2 - Distinguish interaction and availability states (Priority: P1)

A keyboard, pointer, low-vision, or forced-colors user needs checked, unchecked, hover, active,
focus-visible, and disabled choices to remain distinct without relying on color alone.

**Why this priority**: The issue makes every one of these states part of the public visual contract;
a treatment that hides native focus or makes disabled state merely decorative is not acceptable.

**Independent Test**: Exercise the dedicated state stories and browser assertions for hover,
active, focus-visible, checked/unchecked, partial-disabled and all-disabled conditions in default
dark, `LightMode`, and forced-colors rendering.

**Acceptance Scenarios**:

1. **Given** checked and unchecked enabled choices, **when** they render side by side, **then** at
   least one non-color cue distinguishes the checked choice while the native checkbox glyph remains
   visible.
2. **Given** an enabled unchecked choice, **when** it is hovered, pressed, or keyboard-focused,
   **then** each transient state produces a measurable visible delta and the focus outline is not
   clipped by the choice or group.
3. **Given** a disabled native checkbox, **when** the user tabs or activates its label, **then** the
   control remains excluded/unmodified according to native disabled behavior and is visibly
   distinct without `aria-disabled` simulation.
4. **Given** forced-colors mode, **when** the same states render, **then** borders, native glyphs,
   and outlines remain perceivable without `forced-color-adjust: none`.

---

### User Story 3 - Contain long and narrow content (Priority: P1)

A consumer supplies ten choices, zero counts, and long labels inside progressive disclosure. The
grid must collapse to one column when space is constrained, and text/counts must wrap locally
without document-level horizontal scrolling.

**Why this priority**: K3 and the issue both require the ten-choice grid to survive a narrow surface
and long content. Containment is part of the reusable contract, not application layout polish.

**Independent Test**: Render narrow and long-content stories at their declared viewports and at
200% browser zoom; assert page containment, local wrapping, non-clipped focus, and stable source
order.

**Acceptance Scenarios**:

1. **Given** a wide container, **when** ten choices render, **then** they form a responsive grid
   without assuming a fixed count or Team Kitty lane names.
2. **Given** a narrow container, **when** the grid reaches its documented threshold or intrinsic
   minimum, **then** it becomes one column while labels/counts remain within their own choices.
3. **Given** unusually long visible labels or metadata, **when** text wraps, **then** no neighboring
   choice is overlapped and the document does not gain horizontal overflow.
4. **Given** 200% zoom, **when** a user tabs through every enabled input, **then** each focused
   control and outline remain visible and the page remains horizontally contained.

---

### User Story 4 - Compose without stealing consumer behavior (Priority: P2)

A consumer places the group inside the existing `sk-disclosure` styles and puts existing Apply and
Clear controls after it. The checkbox-choice surface must neither duplicate those components nor
attach filtering, persistence, counts, handlers, or validation behavior.

**Why this priority**: Mission Kanban needs this composition, but application ownership is a hard
boundary. A convenient component that takes state ownership would be the wrong reusable API.

**Independent Test**: Inspect the public surface and maintained exemplars to verify the group has no
JavaScript/custom element, no disclosure implementation, and no action behavior; then compose the
K3 fixture using existing public disclosure/button surfaces.

**Acceptance Scenarios**:

1. **Given** the K3 composition, **when** its disclosure opens, **then** the existing #176 surface
   owns disclosure and the checkbox group owns only choice presentation.
2. **Given** Apply and Clear controls after the group, **when** either is activated, **then** any
   behavior comes only from consumer-authored handlers; this mission ships none.
3. **Given** a zero-count or disabled choice, **when** it renders, **then** neither count nor label
   causes implicit selection, disabling, filtering, validation, or status inference.

### Edge Cases

- Zero, one, or many checked choices remain valid presentation states; the library enforces no
  minimum, maximum, or exclusivity rule.
- A zero visible count remains ordinary supplied text and does not imply disabled.
- The legend may be longer than any individual label and must wrap without escaping the fieldset.
- A choice may omit metadata entirely; the label/input association remains complete.
- Multiple checkboxes may share a group name for native submission; the library neither generates
  nor validates names or values.
- Disabled and checked may coexist on one input; both cues remain visible.
- The component does not own invalid/validation messaging; adding it would duplicate form-control
  contracts outside this mission.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Native semantic structure | As an assistive-technology user, I want the maintained contract to use a real `fieldset`, `legend`, nested `label`, and `input type="checkbox"`, so that grouping, names, activation, focus, submission, and reset remain browser-owned. | High | Open |
| FR-002 | Styles-only public family | As a no-JavaScript consumer, I want a `.sk-checkbox-choice-group` BEM family distributed from `@spec-kitty/styles`, so that I can style my native controls without registering a custom element. | High | Open |
| FR-003 | Consumer-owned state and vocabulary | As a Team Kitty engineer, I want to supply names, labels, values, order, checked/disabled state, metadata/counts, actions, and handlers, so that the library never owns filtering or lane concepts. | High | Open |
| FR-004 | Distinct state presentation | As a user, I want checked, unchecked, hover, active, focus-visible, and disabled states to remain distinguishable without color alone. | High | Open |
| FR-005 | Label activation and native keyboard behavior | As a keyboard or pointer user, I want Space and label activation to toggle exactly the native checkbox while tab/source order remains unchanged. | High | Open |
| FR-006 | Native form behavior | As a consumer, I want native submission, reset, default checked restoration, and disabled exclusion to work without library JavaScript. | High | Open |
| FR-007 | Responsive options grid | As a consumer, I want options to use a responsive grid that reaches a one-column layout when narrow, without assuming a fixed option count. | High | Open |
| FR-008 | Local long-content wrapping | As a consumer, I want long legends, labels, and optional metadata/counts to wrap within their own boxes without overlapping siblings. | High | Open |
| FR-009 | Required story catalogue | As a reviewer, I want separately addressable stories for the ten-choice K3 grid, none selected, several selected, zero counts, disabled choices, long content, narrow, focus states, forced colors, default dark, and `LightMode`, so that every required state is reviewable. | High | Open |
| FR-010 | Maintained native exemplars | As a static consumer, I want HTML exemplars demonstrating the exact native structure and state combinations, with their public barrel generated by repository tooling. | High | Open |
| FR-011 | Browser semantics and behavior suite | As a reviewer, I want browser tests for accessible group/control names and roles, source/tab order, Space and label activation, native disabled behavior, form submission/reset, and checked-state preservation. | High | Open |
| FR-012 | Browser containment suite | As a reviewer, I want browser tests for narrow layout, long content, 200% zoom, page overflow, and focus clipping so responsive claims are measured. | High | Open |
| FR-013 | Accessibility evidence | As a reviewer, I want axe and accessibility-tree evidence for every material semantic/state variant, including disabled and forced-colors cases. | High | Open |
| FR-014 | Visual-regression evidence | As a reviewer, I want CI-compatible visual baselines for dark, `LightMode`, narrow, long-content, disabled, focus, forced-colors, and 200%-zoom states. | High | Open |
| FR-015 | Consumer documentation | As a consumer, I want usage documentation that names required native markup, token dependencies, optional metadata, responsive behavior, and every consumer-owned responsibility. | Medium | Open |
| FR-016 | K3 composition proof | As a Mission Kanban maintainer, I want one story composing #176 disclosure and existing action controls around the ten-choice group without copying their CSS or implementing their behavior. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Token-only design values | Every authored color, spacing, size, radius, border, typography, motion, and focus value resolves through an authoritative existing `--sk-*` token; no raw value or token fallback disguises a missing token. | Maintainability | High | Open |
| NFR-002 | Axe conformance | Axe-core reports zero WCAG 2.1 AA violations for every story added by this mission; a failed or empty story load counts as failure. | Accessibility | High | Open |
| NFR-003 | Accessibility-tree fidelity | At least one real-browser accessibility-tree capture exposes one named group and the exact authored checkbox names, checked/disabled states, and DOM order for the ten-choice fixture. | Accessibility | High | Open |
| NFR-004 | Page containment | In every required story at its declared viewport and at 200% zoom, `document.scrollingElement.scrollWidth <= document.scrollingElement.clientWidth`; every focused choice is fully inside its local clipping region. | Accessibility | High | Open |
| NFR-005 | Forced-colors resilience | Under `forced-colors: active`, checked, unchecked, disabled, and focus-visible cues remain perceivable through UA-preserved native controls, borders, and/or outlines; zero required cue depends only on background, box-shadow, or hue. | Accessibility | High | Open |
| NFR-006 | Theme evidence | The `LightMode` story uses a `.sk-light` wrapper and at least one token-dependent computed value differs from default dark while both meet the same semantic and axe checks. | Compatibility | High | Open |
| NFR-007 | Deterministic generated surfaces | A fresh styles-only generation pass reproduces generated barrels byte-for-byte, and package/component export ratchets resolve without hand-edited output. | Reliability | High | Open |
| NFR-008 | Non-regression | Existing style, element, wrapper, manifest, story, behavior, and visual surfaces remain unchanged except for deterministic additions required to distribute and prove this styles-only family. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No custom checkbox element | No `packages/elements/src/checkbox-choice-group`, custom-element definition, shadow root, manifest entry, React/Vue wrapper, `::part()`, or component-owned JavaScript is created. | Architecture | High | Open |
| C-002 | No application behavior | No filtering engine, Apply/Clear handler, checked-state store, item array API, persistence, query parameter, validation, count derivation, or lane/status inference is introduced. | Scope | High | Open |
| C-003 | Reuse surrounding disclosure | K3 composition uses #176's public disclosure surface; this mission does not restyle, copy, or replace disclosure behavior. | Scope | High | Open |
| C-004 | Avoid adjacent contracts | The component does not duplicate #270 segmented choice, #211 select, #209 workflow board/lane, or any custom checkbox/radio/tab behavior. | Scope | High | Open |
| C-005 | No Team Kitty vocabulary in public API | Detailed lane labels may appear only in maintained fixture/story content, never in CSS selectors, package exports, documentation rules, or reusable data structures. | Bounded Context | High | Open |
| C-006 | Native control appearance remains | Styling must not erase the native checkbox glyph or replace it with a custom pseudo-control whose state can diverge from the input. | Accessibility | High | Open |
| C-007 | Generated outputs are regenerated | Generated barrels or other derived surfaces are changed only through repository generators, never hand-edited. | Maintainability | High | Open |
| C-008 | Existing tokens are authoritative | Existing `--sk-*` tokens and train components are reused; no token changes are authorized unless implementation proves an unavoidable missing semantic value and records that as a separate decision before editing tokens. | Architecture | High | Open |
| C-009 | One bounded delivery unit | Exactly one Work Package and one PR deliver this mission. | Delivery | High | Open |
| C-010 | Evidence authority | UX mockup raw values and its missing fieldset/legend are not copied as component authority; issue #277, current repository tokens, ADRs, and the authoring guide control implementation. | Governance | High | Open |

## Negative Invariants

| ID | Forbidden outcome | Evidence that must go red if introduced |
|----|-------------------|-----------------------------------------|
| NI-001 | A checkbox-choice custom element, wrapper, manifest/ratchet entry, behavior subject, or mutation subject | Source/public-surface inventory asserting styles-only distribution and absence of a matching element surface |
| NI-002 | Any library-owned checked/filter/action/persistence/query/count/validation/lane logic | Comment-stripped delta inspection plus absence of component JavaScript and application imports |
| NI-003 | Any semantic substitute for real fieldset/legend/label/checkbox markup | DOM and accessibility-tree assertions over every maintained exemplar/story |
| NI-004 | A custom-drawn checkbox that hides or replaces the native control/state | Computed-style/DOM inspection plus forced-colors and activation tests |
| NI-005 | Any public selector that encodes Team Kitty lane vocabulary or an adjacent component contract | Exact public-selector inventory and bounded-context review |
| NI-006 | Page-level horizontal overflow or clipped focus in required narrow/long/zoom states | Browser geometry assertions per required story |
| NI-007 | Raw design values, inert theme wrappers, theme selectors, or `forced-color-adjust: none` | Stylelint, token-resolution, theme, and forced-colors checks |
| NI-008 | A generated file changed without a byte-identical fresh generator pass | Generator `--check` and clean-tree verification |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every maintained example contains one real fieldset, one real legend, and only real
  labelled checkbox inputs; a real-browser accessibility tree reports the same group and option
  names, states, and order.
- **SC-002**: Native Space activation, label activation, form submission, reset, checked-state
  preservation, and disabled exclusion all pass without any component JavaScript.
- **SC-003**: Checked, unchecked, hover, active, focus-visible, and disabled states are visually
  distinct without color alone in default dark and `LightMode`, and remain perceivable under
  forced colors.
- **SC-004**: Narrow, long-content, and 200%-zoom stories have no document-level horizontal
  overflow and no clipped focused control; the narrow layout renders one column.
- **SC-005**: Axe reports zero WCAG 2.1 AA violations across every new story and no story fails or
  renders empty.
- **SC-006**: Styles-only generation, package build, lint/stylelint, Storybook build, affected test
  suites, visual regression, and public-surface ratchets all pass from a clean tree.
- **SC-007**: The public delta contains no custom element, wrapper, Team Kitty behavior or domain
  vocabulary, and existing generated/public component surfaces remain stable.
- **SC-008**: One independently reviewed WP reaches approved/done, accept passes, and one PR with
  `Closes #277` and `Refs #276` merges into `train/elements-first` before #278 begins.
