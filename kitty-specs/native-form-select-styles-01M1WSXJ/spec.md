# Mission Specification: Native form-select styles

**Mission Branch**: `mission/native-form-select-styles`  
**Created**: 2026-09-07  
**Status**: Draft  
**Mission**: software-dev  
**Input**: GitHub issue `spec-kitty/spec-kitty-design#211`, part of epic #208  
**Authoritative Base**: `train/elements-first` at `9e6d9731c0a6ea64c70ef7779fbd266d71801bdd`  
**Squad Tier**: B — post-tasks and pre-merge point-cuts

## Context and intended outcome

The Work Package surfaces need native select controls for the T10 work-package lane and the T12
filter row. The design system currently supplies the surrounding `.sk-form-field`, label,
description and validation primitives, but no styles-only select primitive. Consumers therefore
cannot reproduce the approved references without owning one-off select styling.

This mission adds a styles-only `.sk-form-select` class and one compact modifier. The class is
applied directly to a native light-DOM `<select>` whose descendants remain real `<option>` and
`<optgroup>` elements. The browser continues to own selection, form participation, reset,
validation, keyboard interaction and typeahead. The component library adds neither application
state nor a custom-element wrapper.

Canonical markup:

```html
<div class="sk-form-field">
  <label class="sk-form-field__label" for="status">Status</label>
  <select class="sk-form-select" id="status" name="status" aria-describedby="status-help">
    <option value="ready">Ready</option>
  </select>
  <p class="sk-form-field__description" id="status-help">Choose a status.</p>
</div>
```

Compact use changes only the select class to `sk-form-select sk-form-select--compact`. Existing
form-field classes retain ownership of labels, descriptions and field layout.

## User Scenarios & Testing

### User Story 1 — Choose a Work Package value with a native select (Priority: P1)

A user encounters a labelled select in a Work Package lane or filter bar and chooses an option
using the browser controls they already know.

**Why this priority**: native selection is the core capability; visual treatment without native
semantics would fail the issue contract.

**Independent Test**: render the story with a real `<select>`, click its label, choose an option,
and verify the control's value changes without a library event handler.

**Acceptance Scenarios**:

1. **Given** a select with `.sk-form-select`, **When** its markup is inspected, **Then** the styled
   root is a native light-DOM `<select>` with only native `<option>` or `<optgroup>` descendants.
2. **Given** a correctly associated label, **When** the label is activated, **Then** the native
   select receives focus.
3. **Given** the focused select, **When** a user presses Arrow Down or types the unique prefix of
   an option, **Then** browser-owned keyboard navigation or typeahead changes the selection.
4. **Given** the closed control, **When** it receives keyboard focus, **Then** a visible focus
   indicator is present without motion.

---

### User Story 2 — Submit, validate, disable and reset through native form behaviour (Priority: P1)

A consumer places the select in a real form and relies on native browser behaviour rather than
shipping design-system state code.

**Why this priority**: form participation is the reason this primitive remains a native select.

**Independent Test**: use a real form to inspect `FormData`, required validity, disabled omission
and form reset.

**Acceptance Scenarios**:

1. **Given** a named enabled select with a chosen value, **When** the form is submitted, **Then**
   `FormData` contains the native name/value pair.
2. **Given** a required select whose placeholder has an empty value, **When** validity is checked,
   **Then** `valueMissing` is true and the invalid visual state is exposed by native `:invalid`.
3. **Given** a disabled select, **When** the form data is collected, **Then** its name is omitted
   and its disabled presentation remains legible.
4. **Given** a selection changed by the user, **When** the form is reset, **Then** the initial
   selected option is restored by the browser.
5. **Given** an invalid select with supporting text in the same form-field root, **When** the
   accessibility relationship is inspected, **Then** `aria-describedby` resolves to that text.

---

### User Story 3 — Use a compact select in a filter row or narrow lane (Priority: P1)

A Work Package screen needs two independently named filters in T12 and a dense variant in narrow
or lane-constrained layouts.

**Why this priority**: compact and narrow states are explicit issue deliverables, not optional
presentation polish.

**Independent Test**: render two compact filters and the narrow fixture; verify each retains its
own label/name/value semantics and the controls stay within their container.

**Acceptance Scenarios**:

1. **Given** `.sk-form-select--compact`, **When** it is rendered, **Then** it retains the same
   native semantics and form behaviour as the default class while using the compact spacing.
2. **Given** the T12 fixture with two filters, **When** values are selected and submitted,
   **Then** both independent name/value pairs are present.
3. **Given** a narrow container, **When** the default or compact select renders, **Then** it fits
   its available inline size without page-level horizontal overflow.
4. **Given** a long option label, **When** the select is closed, **Then** the control remains usable
   and the layout does not overflow its containing form field.

---

### User Story 4 — Recognize states across themes and resilient display modes (Priority: P1)

Users must be able to distinguish default, invalid, disabled and focused controls in the default
dark theme, explicit LightMode, forced-colors mode and at browser zoom.

**Why this priority**: the component belongs in the public design system only if state meaning is
not dependent on one colour scheme or viewport.

**Independent Test**: compare the required story states in default dark and LightMode, run axe,
and exercise forced-colors and narrow-viewport browser checks.

**Acceptance Scenarios**:

1. **Given** default dark and explicit LightMode surfaces, **When** the same select renders in
   each and LightMode wraps its fixture in the repository-required `.sk-light` class, **Then** its
   text, surface, border and focus treatment adapt using authoritative tokens and expose a
   token-derived computed-style delta.
2. **Given** a required invalid select, **When** it renders in either theme, **Then** invalid state
   is visible without replacing native validity semantics.
3. **Given** forced-colors mode, **When** the select is focused, invalid or disabled, **Then** the
   native control and its state indicator remain discernible.
4. **Given** browser zoom at 200%, **When** the fixture is viewed and the select is focused,
   invalid or disabled, **Then** its native indicator and each required state affordance remain
   visible and essential content is not clipped.
5. **Given** a 320 CSS-pixel viewport, **When** the fixture is viewed, **Then** its label, select
   and description remain available without page-level horizontal overflow.
6. **Given** a reduced-motion preference, **When** state changes, **Then** no component animation
   or transition is introduced.

---

### User Story 5 — Import and discover the styles-only primitive (Priority: P2)

A consumer can import the form-select stylesheet from its documented subpath or the aggregate
styles entry and can find complete authoring guidance and Storybook examples.

**Independent Test**: regenerate the styles package, verify its release graph and generated
artifacts, build Storybook and inspect the expected story inventory.

**Acceptance Scenarios**:

1. **Given** a package consumer, **When** it imports the documented form-select style subpath,
   **Then** the package exports resolve without importing a custom element or behaviour module.
2. **Given** the generated styles barrel and documentation, **When** the repository generators
   run, **Then** they reproduce committed generated output with no drift.
3. **Given** Storybook, **When** the form-select story module is enumerated, **Then** it includes
   T10 lane, T12 two-filter, compact, long-option, optgroup, invalid, disabled, narrow,
   forced-colors, default-dark and LightMode coverage.
4. **Given** the component documentation, **When** a consumer chooses between the form-input
   datalist and form-select, **Then** it states that form-select stays native light DOM, that #180's
   datalist accepts unmatched free text and is therefore not a closed-choice substitute, and that
   the consumer owns options, value/change handling and application filter or lane state.

## Edge Cases

- An option label is much longer than the available lane width.
- Options are grouped with native `<optgroup label="…">` nodes.
- A required select initially exposes an empty placeholder option.
- The control is disabled while its surrounding label and description remain readable.
- Two filter selects in one form use distinct ids, labels and names.
- The same-root description is present for the invalid state and is referenced by id.
- Browser-native option popup rendering varies by engine; tests assert the closed control and
  semantic option model, not inaccessible popup internals or exact operating-system pixels.
- Forced-colors mode overrides authored colours; the implementation must not disable that
  override with `forced-color-adjust: none`.
- Default dark and LightMode use the same markup and public classes.

## Functional Requirements

| ID | Requirement |
|---|---|
| **FR-001** | The styles package MUST expose `.sk-form-select` for direct use on a native light-DOM `<select>`. |
| **FR-002** | The public API MUST contain exactly one select modifier, `.sk-form-select--compact`, for the issue's dense/filter-bar use. |
| **FR-003** | The component MUST accept real `<option>` and `<optgroup>` descendants without custom option rendering. |
| **FR-004** | Labels, descriptions and form-field layout MUST compose the existing `.sk-form-field`, `.sk-form-field__label` and `.sk-form-field__description` classes rather than duplicate their ownership. |
| **FR-005** | Native `name`, `value`, `required`, `disabled`, submission, reset, keyboard navigation and typeahead behaviour MUST remain browser-owned. |
| **FR-006** | Required-invalid presentation MUST derive from native validity (`:invalid`) and the invalid fixture MUST connect same-root supporting text through `aria-describedby`. |
| **FR-007** | Default, compact, required-invalid, disabled, optgroup, long-option, narrow and full-width states MUST be covered. |
| **FR-008** | The control MUST provide a visible native-compatible focus indicator and distinguish disabled and invalid state. |
| **FR-009** | All design values in authored CSS MUST come from authoritative `--sk-*` tokens. |
| **FR-010** | The implementation MUST preserve browser affordances; it MUST NOT use `appearance: none`, draw a replacement arrow or disable forced-colors adjustment. |
| **FR-011** | Storybook MUST expose T10 lane, T12 two-filter, compact, long-option, optgroup, invalid, disabled, narrow, forced-colors, default-dark and LightMode examples; LightMode MUST use a `.sk-light` wrapper and exhibit a token-derived computed-style delta. |
| **FR-012** | The published styles barrel, package subpath, generated reference and story inventory MUST include the new styles-only primitive through repository-supported generation. |
| **FR-013** | Browser tests MUST cover native semantics, form behaviour, keyboard/typeahead, state accessibility, axe, themes, forced colours, narrow layout and visual regression. |
| **FR-014** | Public documentation MUST explain why form-select remains native light DOM, why #180's datalist is not a closed-choice substitute, and that consumers own options, selected value, change handling and application state. |

## Non-Functional Requirements

| ID | Requirement | Threshold |
|---|---|---|
| **NFR-001** | Accessibility | Zero axe violations in the required tested stories. |
| **NFR-002** | Native semantics | Zero ARIA roles that replace native select/option semantics. |
| **NFR-003** | Token compliance | Zero raw design values in the new shipped CSS; values resolve through `var(--sk-*)`. |
| **NFR-004** | Theme support | Required states are legible in default dark and explicit LightMode. |
| **NFR-005** | Forced-colors resilience | Focus, invalid and disabled controls remain discernible with forced colors active. |
| **NFR-006** | Reflow and zoom | No page-level horizontal overflow at a 320 CSS-pixel viewport; separate 200% browser-zoom evidence preserves the native indicator and focused, invalid and disabled affordances without clipping essential content. |
| **NFR-007** | Motion | Zero new animations or transitions. |
| **NFR-008** | Distribution integrity | Generated-artifact and release-graph drift checks pass. |
| **NFR-009** | Cross-browser behaviour | Relevant Playwright assertions pass in Chromium, Firefox and WebKit CI projects. |
| **NFR-010** | Regression safety | Repository quality gates and Storybook build remain green. |

## Constraints

| ID | Constraint |
|---|---|
| **C-001** | Follow the dependency order `tokens → styles → elements → generated React wrappers`; this mission adds styles only and requires no new token unless planning proves an existing token insufficient. |
| **C-002** | The latest `train/elements-first` and its token vocabulary are authoritative. |
| **C-003** | Preserve native light-DOM semantics and browser-owned form behaviour. |
| **C-004** | Do not add a form-select custom element, generated wrapper, behaviour module or mutation registry entry. |
| **C-005** | Do not implement application filtering, fetching, routing, state, timers, progress arithmetic, claim logic or Markdown parsing. |
| **C-006** | Do not invent `sk-work-package-card`, a stateful Kanban component or a full-page Work Package element. |
| **C-007** | Do not duplicate #177 card-tone ownership or #178 notice ownership. |
| **C-008** | Generated files are regenerated by repository tooling and never edited as authored source. |
| **C-009** | ADR-9 governs styling ownership, ADR-10 canonical markup/distribution, and ADR-11 verification and generation. |
| **C-010** | The issue contract outranks visual reference inference; T10/T11 references inform visual intent only. |

## Key Entities

- **Native form select**: the light-DOM `<select class="sk-form-select">`; owns browser form and
  interaction semantics.
- **Compact modifier**: `.sk-form-select--compact`; changes only visual density.
- **Native option model**: ordered `<option>` and `<optgroup>` descendants owned by the browser.
- **Form-field composition**: existing label, description and layout classes surrounding the
  select without becoming part of the form-select API.
- **Story fixture**: static canonical markup for a required contract state; it demonstrates but
  does not implement application state.

## Explicit Non-Goals

| ID | Non-goal |
|---|---|
| **NI-001** | No custom element or React wrapper for form-select. |
| **NI-002** | No combobox, listbox, autocomplete or searchable-select reimplementation. |
| **NI-003** | No asynchronous option loading or fetching. |
| **NI-004** | No multiple selection API. |
| **NI-005** | No custom option markup, icons, checkmarks or rich option rendering. |
| **NI-006** | No application filter state or URL/query synchronization. |
| **NI-007** | No custom validation state machine or duplicate error-message component. |
| **NI-008** | No replacement dropdown indicator or cross-platform popup pixel normalization. |
| **NI-009** | No ownership changes to form-field, card tones, notice tones or Work Package layout. |
| **NI-010** | No token redesign beyond a narrowly evidenced missing token handled under repository governance. |

## Success Criteria

| ID | Outcome | Verification |
|---|---|---|
| **SC-001** | Consumers can style a real native select with one public base class. | DOM and package export tests. |
| **SC-002** | Compact use needs only the one documented modifier. | Compact story and public API inspection. |
| **SC-003** | Browser-owned interaction remains intact. | Keyboard, typeahead, selection and label-focus Playwright tests. |
| **SC-004** | Browser-owned form behaviour remains intact. | `FormData`, required validity, disabled omission and reset tests. |
| **SC-005** | Native options and groups remain exposed in their authored order. | DOM/type/order assertions across engines. |
| **SC-006** | Required-invalid support is perceivable and described. | Native validity, same-root description relationship and axe checks. |
| **SC-007** | Focus, invalid and disabled states survive resilient display modes. | Forced-colors and theme browser assertions plus separate 200% browser-zoom evidence and visual baselines. |
| **SC-008** | Long content and narrow layouts do not escape their container. | Long-option and 320-pixel reflow tests. |
| **SC-009** | All required issue states are discoverable. | Expected-story inventory and Storybook build. |
| **SC-010** | The stylesheet uses only authoritative design tokens. | Stylelint and targeted authored-CSS inspection. |
| **SC-011** | Published style exports and docs are reproducible. | Generator and generated-drift gates. |
| **SC-012** | The repository remains releasable on the train. | `npm run quality:all`, relevant browser/visual gates and CI. |
| **SC-013** | Consumers can choose the correct native control and ownership boundary. | Documentation explicitly contrasts the closed select with #180's free-text datalist and states the light-DOM and application-state boundaries. |

## Dependencies and governance

| Dependency | State |
|---|---|
| Issue #141 / PR #172 — existing form-field foundation | Closed / merged |
| Issue #180 — predecessor contract | Closed |
| ADR-9 — shadow DOM and styling API | Required and reviewed |
| ADR-10 — distribution and canonical markup | Required and reviewed |
| ADR-11 — verification stack and wrapper generation | Required and reviewed |
| Epic #208 | Open; this mission is child #211 |

No new architectural decision is required at specification time. Existing ADRs and the issue
contract fully determine the public primitive, native-semantic boundary and distribution layer.
