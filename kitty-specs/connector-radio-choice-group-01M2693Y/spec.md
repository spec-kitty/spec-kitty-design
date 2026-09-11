# Mission Specification: Connector radio choice group

**Mission Branch**: `connector-radio-choice-group-01M2693Y` (topology: `single_branch`; the mission
lives on `mission/connector-radio-choice-group` and lands through one Work Package and one PR into
`train/elements-first`)
**Created**: 2026-09-10
**Status**: Draft
**Input**: GitHub issue [#336](https://github.com/spec-kitty/spec-kitty-design/issues/336), part of
epic [#335](https://github.com/spec-kitty/spec-kitty-design/issues/335), tracking
[#125](https://github.com/spec-kitty/spec-kitty-design/issues/125), plus the Opus-reviewed Family 3
C5 GitLab group-selection evidence under
`ux_redesign/families/03-connectors/evidence/OPUS-REVIEW-05.md` (screen:
`screens/C5-gitlab-group-selection-dark.html`).

## Intent Summary

A Team Kitty consumer needs a reusable, token-driven visual treatment for a bounded group of
mutually exclusive native radio choices — the exactly-one-of-many counterpart to the checkbox
choice group (#277). The library styles a real `fieldset`, `legend`, nested `label` elements, and
native `input type="radio"` controls. The browser continues to own exactly-one selection,
constraint validation (including the `required` case), arrow-key roving selection, tab order,
label activation, form submission, and reset. Team Kitty continues to own provider data, routing,
validation messages, selection effects, request handling, copy, and i18n (#286). The mission
succeeds when this native structure remains usable and visually distinct — including a truthful
invalid/required state — across themes, forced colors, RTL, narrow layouts, long content, disabled
and focus states, and 200% zoom without page overflow or clipped focus, while meeting a 44px
interactive-target floor.

Family 3 C5 (GitLab group selection) is the reviewed evidence this primitive generalizes: a
required radio group that submits exactly one group identifier, with a visible primary name and a
machine-readable secondary path. Every GitLab/provider-specific word is stripped from the public
contract below; C5's raw values and markup gaps are not copied as authority (evidence honesty,
programme BRIEF).

## Terminology and Boundaries

- **Radio choice group** means the styles-only `.sk-radio-choice-group` BEM family applied to
  consumer-authored native form markup. It is not a custom element, selection store, routing
  surface, or validation-message engine.
- **Choice** means one real native radio input and its visible text inside one real `label`, sharing
  a common `name` with every other choice in the group so the browser enforces exactly-one
  selection natively.
- **Primary label** is the required, consumer-authored visible text identifying a choice.
  **Secondary machine value** is an OPTIONAL consumer-authored second piece of visible text (e.g. an
  opaque path or identifier) associated with the same choice. Neither carries provider terminology
  in the library's own selectors, exemplars, or documentation prose.
- **Selected** means the input's native `checked` state. CSS may present it through native selectors
  (`:checked`) but must not maintain or infer it with script.
- **Required/invalid** means the native constraint-validation state a `required` radio group enters
  when no choice is checked (each radio in the group reports `:invalid`/`validationMessage` until
  one is checked). The library styles this state; it does not generate, own, or override validation
  messages.
- **GitLab group vocabulary** (`group_id`, `full_path`, "GitLab", "Connect another GitLab group",
  etc.) is evidence-only. It must not appear in authored component CSS selectors, package exports,
  or documentation rules — only, if at all, inside a clearly labelled composition/demo fixture, the
  way #277 confined "detailed lane" vocabulary to its K3 fixture.
- **Styles-only** means authored CSS and authored native HTML exemplars in `packages/styles`, plus
  repository-generated styles-only barrels. It means no `packages/elements` component, manifest
  entry, wrapper, `::part()`, behavior-registry subject, or mutation subject.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose exactly one native option (Priority: P1)

A Team Kitty engineer composes a required single-choice group — such as the group a connector
installation must pick before routing continues — from native radio inputs. Users can read the
legend, move among choices with arrow keys or Tab, select with a click, Space, or label activation,
and the browser guarantees exactly one is ever checked, while the design system supplies a coherent
visual grouping including a primary label and an optional secondary machine value per choice.

**Why this priority**: This is the missing public primitive that generalizes Family 3 C5. If native
exactly-one semantics are replaced by script, or arrow-key/tab behavior is altered, the mission
fails its core purpose.

**Independent Test**: Render a two-choice and a many-choice story and verify the accessibility tree,
source/tab order, arrow-key selection, Space and label activation, native form submission with
exactly one value, and reset restoring the authored default-checked choice.

**Acceptance Scenarios**:

1. **Given** a named fieldset with two or more labelled native radios sharing one `name`, **when**
   it renders, **then** the accessibility tree exposes the real group/legend and each radio's own
   name, in DOM order.
2. **Given** one checked input, **when** the consumer serializes the form, **then** native FormData
   contains exactly that one supplied value and CSS has neither added nor removed state.
3. **Given** a focused choice, **when** the user presses an arrow key, Space, or activates a label,
   **then** the browser moves and/or changes the checked radio according to native radio-group
   semantics, and focus remains truthful.
4. **Given** a native form reset, **when** the form resets, **then** the radio group returns to its
   authored default-checked choice (or none, if none was authored) without component JavaScript.

---

### User Story 2 - Distinguish interaction, availability, and validity states (Priority: P1)

A keyboard, pointer, low-vision, or forced-colors user needs rest, hover, active, selected,
focus-visible, required-invalid, and disabled choices to remain distinct without relying on color
alone — including when the group as a whole is required and nothing is yet checked.

**Why this priority**: The issue makes every one of these states, including required-invalid, part
of the public visual contract. A treatment that hides native focus, makes disabled state merely
decorative, or cannot show an honest invalid state is not acceptable.

**Independent Test**: Exercise dedicated state stories and browser assertions for hover, active,
focus-visible, selected/unselected, required-invalid, disabled-option, and disabled-group conditions
in default dark, `LightMode`, and forced-colors rendering; assert accessible state matches rendered
state when `accent-color` is customized under forced colors.

**Acceptance Scenarios**:

1. **Given** an unselected and a selected enabled choice, **when** they render side by side, **then**
   at least one non-color cue distinguishes the selected choice while the native radio glyph remains
   visible.
2. **Given** an enabled unselected choice, **when** it is hovered, pressed, or keyboard-focused,
   **then** each transient state produces a measurable visible delta and the focus outline is not
   clipped by the choice or group.
3. **Given** a disabled native radio (one option disabled, or every option in the group disabled),
   **when** the user tabs or activates its label, **then** the control remains excluded/unmodified
   per native disabled behavior and is visibly distinct without `aria-disabled` simulation.
4. **Given** a `required` group with nothing checked, **when** the group renders or is submitted,
   **then** the group presents a distinct required-invalid cue and native constraint validation
   blocks submission with the browser's own validation message.
5. **Given** forced-colors mode, **when** the same states render — including a choice whose
   `accent-color` is customized — **then** borders, native glyphs, and outlines remain perceivable
   without `forced-color-adjust: none`, and the accessible checked/unchecked state still matches
   what is rendered.

---

### User Story 3 - Contain long and narrow content, and RTL layouts (Priority: P1)

A consumer supplies several choices, a long primary label, and an opaque, unbreakable-looking
secondary machine value inside a narrow surface, and separately renders the same group in a
right-to-left document. The grid must collapse/stack when space is constrained, text and secondary
values must wrap locally without document-level horizontal scrolling, and every interactive target
must meet the 44px floor.

**Why this priority**: The issue requires narrow, long label/path, and RTL coverage, plus a 44px
narrow interactive-target floor, as first-class parts of the reusable contract, not application
layout polish.

**Independent Test**: Render narrow, long-content, and RTL stories at their declared viewports and
at 200% browser zoom; assert page containment, local wrapping, non-clipped focus, a stable source
order, and a computed touch-target size of at least 44px on every choice.

**Acceptance Scenarios**:

1. **Given** a wide container, **when** several choices render, **then** they lay out without
   assuming a fixed count or provider vocabulary.
2. **Given** a narrow container, **when** the layout reaches its documented threshold or intrinsic
   minimum, **then** choices stack/reflow to one column while labels/secondary values remain within
   their own choice.
3. **Given** an unusually long primary label or a long, opaque secondary machine value, **when**
   text wraps, **then** no neighboring choice is overlapped and the document does not gain
   horizontal overflow.
4. **Given** an RTL document (`dir="rtl"`), **when** the group renders, **then** the choice layout,
   text alignment, and focus outline mirror correctly with no horizontal overflow.
5. **Given** 200% zoom, **when** a user tabs through every enabled choice, **then** each focused
   control and outline remain visible, every choice's pointer/touch target measures at least 44px,
   and the page remains horizontally contained.

---

### User Story 4 - Compose without stealing consumer behavior (Priority: P2)

A consumer places the group inside their own form, with their own submission handling, provider
data, routing, and validation-message copy. The radio-choice surface must neither duplicate an
adjacent component nor attach selection-effect handlers, request handling, auto-submit, i18n
defaults, or route/mutation ownership.

**Why this priority**: Family 3 needs this composition, but application ownership is a hard
boundary. A convenient component that took over submission or provider concerns would be the wrong
reusable API, and would collide with #277's already-published checkbox contract if it copied
selection semantics wholesale instead of sharing only the anatomy that genuinely matches.

**Independent Test**: Inspect the public surface and maintained exemplars to verify the group has no
JavaScript/custom element, no auto-submit, no provider or copy defaults, and no vocabulary/selector
overlap with #277 (checkbox), #270 (segmented choice), or #211 (native select); confirm the shared
anatomy (fieldset/legend/label/BEM shape) is coordinated with #277 where behavior matches, and
diverges where radio semantics (exactly-one, arrow-key roving, required/invalid) require it.

**Acceptance Scenarios**:

1. **Given** the public surface, **when** it is inspected, **then** it contains no filtering,
   auto-submit, provider-fetch, routing, validation-message, or i18n-default logic; this mission
   ships none.
2. **Given** a zero-length or omitted secondary machine value, **when** a choice renders, **then**
   its absence causes no implicit selection, disabling, or validation-state change.
3. **Given** the `.sk-radio-choice-group` and `.sk-checkbox-choice-group` selector families, **when**
   compared, **then** they share predictable BEM shape/anatomy naming but remain two distinct,
   non-overlapping public contracts — no shared class name implies shared multi-select or
   exactly-one semantics across the two.

### Edge Cases

- Exactly one, or zero (before first interaction, or if the group is not `required`), checked choice
  are both valid presentation states; the library enforces no maximum and no exclusivity logic
  beyond the native `name`-sharing the consumer authors.
- A `required` group with nothing checked is a valid, distinctly-styled state, not an error the
  library must prevent from rendering.
- The legend may be longer than any individual label and must wrap without escaping the fieldset.
- A choice may omit the secondary machine value entirely; the label/input association remains
  complete and the omission is ordinary, not an error state.
- Disabled and selected may coexist on one input (a pre-selected but now-locked choice); both cues
  remain visible.
- Disabling every choice in the group is valid; the group remains readable and its (potentially
  required) invalid state, if any, remains honest.
- The component does not own validation-message copy or i18n; it styles the native
  `:invalid`/`:required` state only, and never renders its own message text.
- RTL and LTR must both avoid document-level horizontal overflow at every required story's declared
  viewport and at 200% zoom.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Native semantic structure | As an assistive-technology user, I want the maintained contract to use a real `fieldset`, `legend`, nested `label`, and `input type="radio"` sharing one `name`, so that grouping, exactly-one selection, focus, submission, and reset remain browser-owned. | High | Open |
| FR-002 | Styles-only public family, no custom element | As a no-JavaScript consumer, I want a `.sk-radio-choice-group` BEM family distributed from `@spec-kitty/styles` with no registered custom element, manifest entry, wrapper, or `::part()`, so that I can style my native controls without adopting a component runtime. | High | Open |
| FR-003 | Consumer-owned state and vocabulary | As a Team Kitty engineer, I want to supply the group name, labels, values, order, selected/required/disabled state, optional secondary machine value, submission behavior, validation messages, and all translatable copy (#286), so that the library never owns provider data, routing, or i18n defaults. | High | Open |
| FR-004 | Anatomy: primary label plus optional secondary machine value | As a consumer, I want each choice's markup to support a required primary label and an OPTIONAL secondary machine value, with no provider terminology in the library's own selectors or exemplars, so that the primitive generalizes beyond any one connector. | High | Open |
| FR-005 | Browser-owned exactly-one selection and constraint validation | As a user, I want the browser — not library script — to enforce that at most one radio in the group is checked, to run constraint validation (including `required`), and to expose no JS-maintained selection store. | High | Open |
| FR-006 | Keyboard and native form behavior | As a keyboard user, I want Tab to move focus into and out of the group via native radio tab-stop rules, arrow keys to roam and select within the group, Space and label activation to select the focused/target radio, native constraint validation to block submission when required and nothing is checked, submission to carry exactly the checked value, and reset to restore the authored default-checked choice — all without library JavaScript. | High | Open |
| FR-007 | Label activation as the full pointer/touch target | As a pointer or touch user, I want the entire visible label (primary and secondary text) to activate its radio, meeting a 44px interactive-target floor even in narrow layouts. | High | Open |
| FR-008 | Distinct state presentation without color alone | As a user, I want rest, hover, active, selected, focus-visible, required-invalid, and disabled states to remain distinguishable from each other without relying on color alone. | High | Open |
| FR-009 | Truthful forced-colors native control | As a forced-colors user, I want the native radio glyph, borders, and focus outline to remain perceivable under `forced-colors: active`, including when `accent-color` is customized, with the rendered state proven to match the input's real accessible checked/unchecked state and with no `forced-color-adjust: none` on any required cue. | High | Open |
| FR-010 | Local wrapping and page containment | As a consumer, I want long legends, primary labels, and secondary machine values to wrap within their own choice without overlapping siblings, and the group to stack/reflow at narrow widths, with no document-level horizontal overflow at any required viewport or at 200% zoom. | High | Open |
| FR-011 | RTL layout resilience | As a consumer authoring in a right-to-left document, I want the group's layout, text alignment, and focus outline to mirror correctly with no horizontal overflow. | High | Open |
| FR-012 | Required story catalogue | As a reviewer, I want separately addressable stories covering the two-choice Family 3 shape, one option, many options, selected/unselected, required-invalid, a disabled option, a fully disabled group, long label/secondary-value content, narrow, RTL, default dark, and `LightMode`, so that every required state is independently reviewable. | High | Open |
| FR-013 | Forced-colors, zoom, and reduced-motion evidence | As a reviewer, I want forced-colors and 200%-zoom stories/evidence asserting no document overflow and no clipped focus, plus a reduced-motion assertion confirming the primitive introduces no required motion, so that these claims are measured rather than assumed. | High | Open |
| FR-014 | Maintained native exemplars | As a static consumer, I want HTML exemplars demonstrating the exact native structure and required state combinations, with their public barrel generated by repository tooling and never hand-edited. | High | Open |
| FR-015 | Accessibility-tree evidence | As a reviewer, I want a real-browser accessibility-tree capture exposing the fieldset/legend group, each radio's accessible name, and correct checked/disabled/required states. | High | Open |
| FR-016 | Keyboard and native-behavior browser suite | As a reviewer, I want browser tests for Tab order, arrow-key selection, Space, label activation, native validation (required/invalid), submission, and reset. | High | Open |
| FR-017 | Accessibility (axe) evidence | As a reviewer, I want axe to report zero WCAG 2.1 AA violations across every new story, with a failed or empty story load counted as failure. | High | Open |
| FR-018 | Visual-regression evidence | As a reviewer, I want CI-compatible visual baselines for dark, `LightMode`, narrow, RTL, long-content, disabled, required-invalid, focus, forced-colors (including customized `accent-color`), and 200%-zoom states. | High | Open |
| FR-019 | Consumer documentation | As a consumer, I want usage documentation naming the required native markup, token dependencies, the optional secondary machine value, the 44px target floor, RTL support, and every consumer-owned responsibility (provider data, routing, validation messages, copy/i18n). | Medium | Open |
| FR-020 | Coordinated, distinct anatomy with #277 | As a design-system maintainer, I want `.sk-radio-choice-group` to share predictable BEM anatomy with `.sk-checkbox-choice-group` (#277) where their behavior genuinely matches (fieldset/legend/label structure), while remaining a distinct public contract wherever radio semantics (exactly-one selection, arrow-key roving, required/invalid) differ from checkbox semantics. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Token-only design values | Every authored color, spacing, size, radius, border, typography, motion, and focus value resolves through an authoritative existing `--sk-*` token; no raw value or token fallback disguises a missing token. | Maintainability | High | Open |
| NFR-002 | Axe conformance | Axe-core reports zero WCAG 2.1 AA violations for every story added by this mission; a failed or empty story load counts as failure. | Accessibility | High | Open |
| NFR-003 | Accessibility-tree fidelity | At least one real-browser accessibility-tree capture exposes one named group and the exact authored radio names, checked/disabled/required states, and DOM order for a multi-choice fixture. | Accessibility | High | Open |
| NFR-004 | Page containment | In every required story at its declared viewport and at 200% zoom, `document.scrollingElement.scrollWidth <= document.scrollingElement.clientWidth`; every focused choice is fully inside its local clipping region. | Accessibility | High | Open |
| NFR-005 | Forced-colors resilience with truthful state | Under `forced-colors: active`, rest, selected, unselected, disabled, focus-visible, and required-invalid cues remain perceivable through UA-preserved native controls, borders, and/or outlines; zero required cue depends only on background, box-shadow, or hue; and where `accent-color` is customized, the rendered checked/unchecked appearance is proven to match the input's real accessible state. | Accessibility | High | Open |
| NFR-006 | Theme evidence | The `LightMode` story uses a `.sk-light` wrapper and at least one token-dependent computed value differs from default dark while both meet the same semantic and axe checks. | Compatibility | High | Open |
| NFR-007 | Deterministic generated surfaces | A fresh styles-only generation pass reproduces generated barrels byte-for-byte, and package/component export ratchets resolve without hand-edited output. | Reliability | High | Open |
| NFR-008 | Non-regression | Existing style, element, wrapper, manifest, story, behavior, and visual surfaces remain unchanged except for deterministic additions required to distribute and prove this styles-only family. | Reliability | High | Open |
| NFR-009 | Minimum interactive-target size | Every choice's pointer/touch target (the full visible label) measures at least 44px in the narrow-floor dimension in every required story, including narrow and 200%-zoom variants. | Accessibility | High | Open |
| NFR-010 | Reduced-motion honesty | `prefers-reduced-motion: reduce` is asserted to change nothing observable, because the primitive introduces no required motion/transition of its own; no false reduced-motion guard is added that appears to disable an effect the component does not have. | Accessibility | Medium | Open |
| NFR-011 | RTL resilience | Every required story renders with no document-level horizontal overflow and mirrored, non-overlapping layout when the document sets `dir="rtl"`. | Accessibility | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No custom radio element | No `packages/elements/src/radio-choice-group`, custom-element definition, shadow root, manifest entry, React/Vue wrapper, `::part()`, or component-owned JavaScript is created. | Architecture | High | Open |
| C-002 | No application behavior | No provider-data model, routing, validation-message copy, selection-effect handler, request handling, auto-submit, i18n default, or route/mutation ownership is introduced. | Scope | High | Open |
| C-003 | No checkbox/multi-select behavior | The group never permits more than one checked choice and never reimplements #277's any-number-selected semantics. | Scope | High | Open |
| C-004 | Avoid adjacent contracts | The component does not duplicate #277 checkbox/multi-select, #270 segmented choice/button/tab semantics, #211 native `<select>`/combobox/search, or item-array rendering/filtering. | Scope | High | Open |
| C-005 | No GitLab or provider vocabulary in public API | GitLab/provider names, IDs, routes, or copy may appear only inside a clearly labelled composition/demo fixture, never in CSS selectors, package exports, documentation rules, or reusable data structures. | Bounded Context | High | Open |
| C-006 | Native control appearance remains | Styling must not erase the native radio glyph or replace it with a custom pseudo-control whose state can diverge from the input; `accent-color` is the only sanctioned native-appearance customization. | Accessibility | High | Open |
| C-007 | Generated outputs are regenerated | Generated barrels or other derived surfaces are changed only through repository generators, never hand-edited. | Maintainability | High | Open |
| C-008 | Existing tokens are authoritative | Existing `--sk-*` tokens and train components are reused; no token changes are authorized unless implementation proves an unavoidable missing semantic value and records that as a separate decision before editing tokens. | Architecture | High | Open |
| C-009 | One bounded delivery unit | Exactly one Work Package and one PR deliver this mission. | Delivery | High | Open |
| C-010 | Evidence authority | C5's raw values, its GitLab vocabulary, and any of its markup gaps are not copied as component authority; issue #336, current repository tokens, ADR-9/10/11, and the authoring guide control implementation. | Governance | High | Open |
| C-011 | Coordinate, don't duplicate, anatomy with #277 | Class naming and BEM shape are coordinated with `.sk-checkbox-choice-group` where behavior genuinely matches; the two remain separate, non-aliased public contracts. | Architecture | Medium | Open |

## Negative Invariants

| ID | Forbidden outcome | Evidence that must go red if introduced |
|----|-------------------|-----------------------------------------|
| NI-001 | A radio-choice custom element, wrapper, manifest/ratchet entry, behavior subject, or mutation subject | Source/public-surface inventory asserting styles-only distribution and absence of a matching element surface |
| NI-002 | Any library-owned provider-data/routing/validation-message/auto-submit/i18n-default logic | Comment-stripped delta inspection plus absence of component JavaScript and application imports |
| NI-003 | Any semantic substitute for real fieldset/legend/label/radio markup | DOM and accessibility-tree assertions over every maintained exemplar/story |
| NI-004 | A custom-drawn radio that hides or replaces the native control/state | Computed-style/DOM inspection plus forced-colors and activation tests |
| NI-005 | Any public selector that encodes GitLab/provider vocabulary or an adjacent component's contract (#277, #270, #211) | Exact public-selector inventory and bounded-context review |
| NI-006 | Page-level horizontal overflow or clipped focus in required narrow/long/RTL/zoom states | Browser geometry assertions per required story |
| NI-007 | Raw design values, inert theme wrappers, theme selectors, or `forced-color-adjust: none` | Stylelint, token-resolution, theme, and forced-colors checks |
| NI-008 | A generated file changed without a byte-identical fresh generator pass | Generator `--check` and clean-tree verification |
| NI-009 | A customized `accent-color` under forced colors whose rendered appearance diverges from the input's real accessible checked/unchecked state | Paired forced-colors screenshot/accessibility-tree assertion per required story |
| NI-010 | More than one checked radio in a group, or a JS-maintained selection mirror | Native-behavior browser assertions over the maintained exemplars |
| NI-011 | An interactive target under 44px in any required story | Computed bounding-box assertion per choice, including narrow and 200%-zoom variants |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every maintained example contains one real fieldset, one real legend, and only real
  labelled radio inputs sharing one `name`; a real-browser accessibility tree reports the same group
  and choice names, states, and order.
- **SC-002**: Native arrow-key selection, Space, label activation, form submission (exactly one
  value), reset, required/invalid constraint validation, and disabled exclusion all pass without any
  component JavaScript.
- **SC-003**: Rest, hover, active, selected, focus-visible, required-invalid, and disabled states are
  visually distinct without color alone in default dark and `LightMode`, and remain perceivable
  under forced colors, including when `accent-color` is customized.
- **SC-004**: Narrow, long-content, RTL, and 200%-zoom stories have no document-level horizontal
  overflow, no clipped focused control, and every choice's interactive target measures at least
  44px.
- **SC-005**: Axe reports zero WCAG 2.1 AA violations across every new story and no story fails or
  renders empty.
- **SC-006**: Styles-only generation, package build, lint/stylelint, Storybook build, affected test
  suites, visual regression, and public-surface ratchets all pass from a clean tree.
- **SC-007**: The public delta contains no custom element, wrapper, GitLab/provider vocabulary, or
  application behavior, and existing generated/public component surfaces (including #277's) remain
  stable and non-aliased.
- **SC-008**: One independently reviewed WP reaches approved/done, accept passes, and one PR with
  `Closes #336` and `Refs #335` merges into `train/elements-first`.

## Deferred / Untestable Clauses

- The issue's process metadata — "Squad tier: C — pre-merge", the "Read first" list, and "Throughput
  and boundary" framing ("Family 3 is ready for Lynn but not Lynn-approved... the operator
  authorized this component mission to proceed") — are governance/process instructions, not
  functional requirements of the shipped artifact. They are carried into the plan's Charter Check
  and Delivery Contract sections instead of a spec FR, matching how the #277 precedent handled its
  own "Tier-C" line. No clause of substance was dropped: every testable behavior named in these
  sections (consumer ownership of provider data/routing/copy/i18n) is already covered by FR-003,
  C-002, and NI-002 above.
