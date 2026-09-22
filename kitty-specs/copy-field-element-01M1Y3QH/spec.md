# Mission Specification: `sk-copy-field`

**Mission Branch**: `mission/copy-field-element`
**Created**: 2026-09-07
**Status**: Ready for planning
**Input**: GitHub issue [#257](https://github.com/spec-kitty/spec-kitty-design/issues/257), part of tracking epic #253 and consumed by #255.

## Intent and authority

Publish one JavaScript-dependent design-system element for a visible, non-editable,
non-sensitive string and its copy action. The live issue body and comments are binding. The latest
`origin/train/elements-first` component contracts and tokens are authoritative for implementation;
the approved Repository Dossier dark screens D1, D2, and D4-D8 define composition and UX intent,
and live issue #257 additionally names D1, D3, D4, D6, and D8 as reference evidence. The reviewed
union is authoritative only for the compact field/action composition, theme parity, and wrapping;
it does not authorize Team Kitty data, routing, command execution, or other application behavior.

## User Scenarios & Testing

### User Story 1 - Copy the exact visible value (Priority: P1)

As a keyboard, pointer, or assistive-technology user, I can activate a clearly named native Copy
control and copy exactly the string displayed in the field.

**Why this priority**: Exact, truthful copy behavior is the component's defining value.

**Independent Test**: Supply strings containing leading/trailing whitespace, quotes, shell
punctuation, line breaks, and Unicode; fulfill the stubbed Clipboard API; assert that the one write
argument equals `value`, feedback is successful, and one privacy-safe result event is emitted.

**Acceptance Scenarios**:

1. **Given** a non-empty value and an available secure-context Clipboard API, **when** the native
   button is activated by pointer, Enter, or Space, **then** the exact value is written once and the
   field reports `copied` once.
2. **Given** a successful copy, **when** the result event reaches an ancestor, **then** it bubbles,
   is composed and non-cancelable, contains only readonly `{ outcome: 'copied' }`, and never
   contains the copied value.
3. **Given** a label with meaningful text, **when** the field renders, **then** that label is the
   native button's accessible name and the visible value remains readable as code.

---

### User Story 2 - Recover honestly when clipboard writing is unavailable (Priority: P1)

As a user whose browser cannot write to the clipboard, I receive a deterministic manual-copy path
instead of a false success message or an escaped error.

**Why this priority**: Clipboard permission and secure-context failures are normal runtime states.

**Independent Test**: Stub absent, insecure, rejecting, synchronously throwing, and asynchronously
throwing clipboard surfaces; verify each path focuses and selects the complete visible value,
announces the manual instruction, and emits exactly one `manual` result without unhandled errors.

**Acceptance Scenarios**:

1. **Given** a non-empty value and unavailable or rejected clipboard access, **when** Copy is
   activated, **then** the entire visible value is focused and selected and manual-copy guidance is
   announced.
2. **Given** that clipboard writing and visible-value selection both fail, **when** the attempt
   finishes, **then** the field announces failure and emits exactly one `failed` result.
3. **Given** multiple fields, **when** one field completes an attempt, **then** only that instance's
   status changes.

---

### User Story 3 - Understand unavailable and changed values (Priority: P1)

As a user, I cannot trigger a false result for an empty value, and old success or failure feedback
does not describe a newly supplied value.

**Why this priority**: Stale or optimistic feedback would make the component dishonest.

**Independent Test**: Render an empty field, attempt activation, then copy a non-empty value and
change it; assert disabled presentation, no event for empty, and cleared status after the change.

**Acceptance Scenarios**:

1. **Given** an empty string, **when** the field renders, **then** the control is visibly and
   semantically unavailable, no copy mechanism runs, and no result event or success is produced.
2. **Given** any completed outcome, **when** `value` changes, **then** stale result text and outcome
   presentation are cleared before the new value can be copied.
3. **Given** a whitespace-only non-empty string, **when** Copy succeeds, **then** the supplied
   whitespace is copied exactly rather than treated as empty or normalized.

---

### User Story 4 - Use the field at narrow and enlarged layouts (Priority: P2)

As a low-vision or small-screen user, I can read and select long values without page-level
horizontal scrolling or clipped controls.

**Why this priority**: The approved Dossier includes long CLI commands at a 390px viewport.

**Independent Test**: Exercise long unbroken and naturally wrapping values at 390px and 200%/400%
zoom in Chromium and Firefox; inspect dark and `LightMode` stories and assert no page overflow.

**Acceptance Scenarios**:

1. **Given** a long command containing quotes, punctuation, or Unicode, **when** the available width
   contracts, **then** the value wraps inside the field and remains selectable.
2. **Given** 390px or 400% zoom, **when** the component renders, **then** neither the page nor the
   component acquires unintended horizontal overflow and the native button remains operable.

---

### User Story 5 - Perceive state in supported display modes (Priority: P2)

As a user in dark, light, forced-colors, or reduced-motion modes, I can distinguish focus,
disabled, copied, manual, and failed states without relying on colour alone.

**Why this priority**: The design library supports these modes as public contracts.

**Independent Test**: Render the required story states under default dark, `LightMode`, forced
colors, and reduced motion; run axe and accessibility-tree checks and compare the Dossier geometry.

**Acceptance Scenarios**:

1. **Given** any supported theme or forced colors, **when** a state is visible, **then** text,
   native semantics, focus indication, and status content communicate it without colour alone.
2. **Given** reduced-motion preference, **when** the field changes state, **then** it introduces no
   unguarded component-owned transition or animation.
3. **Given** first render, **when** a later result changes, **then** one already-mounted polite,
   atomic status region announces it.

---

### User Story 6 - Consume the complete public contract (Priority: P2)

As a design-library consumer, I can use the element, React wrapper, and Vue declarations with
documented properties, event types, and public parts.

**Why this priority**: The package's generated integration surfaces are part of the feature.

**Independent Test**: Generate and inspect the manifest, React/Vue outputs, CSS module, indexes,
ratchets, and size report; type-check a React event handler that narrows the literal outcome union.

**Acceptance Scenarios**:

1. **Given** the generated manifest, **when** consumers inspect `sk-copy-field`, **then** every
   property, event, and the `field`, `value`, `copy-control`, and `status` parts are documented.
2. **Given** a React consumer, **when** `onSkCopyFieldResult` is used, **then** its detail outcome is
   typed as `'copied' | 'manual' | 'failed'`, not widened to `string` or `any`.
3. **Given** a non-JavaScript/static-markup consumer, **when** package exports are inspected,
   **then** there is no misleading inert Copy-button static form.

### Edge Cases

- Clipboard support exists but the context is insecure.
- `writeText` is present but non-callable, throws synchronously, or rejects asynchronously.
- Focus, range creation, selection retrieval, or selection replacement fails.
- The supplied string is empty, whitespace-only, multiline, very long, Unicode, or contains shell
  metacharacters and paired quotes.
- The accessible label is omitted, blank, or changed after render.
- `value` changes while an asynchronous copy attempt is pending or immediately after a result.
- Users activate repeatedly or multiple instances complete in either order.
- A consumer sets public properties before custom-element upgrade.
- Status-message overrides are empty, whitespace-only, or contain consumer-defined
  punctuation/Unicode; empty/whitespace-only overrides fail open to their documented defaults.
- Same-value attempts overlap and settle in either order; each attempt completes independently and
  the most recently completed attempt owns the visible status.

## Requirements

### Functional Requirements

| ID | Title | Requirement | Priority | Status |
|----|-------|-------------|----------|--------|
| FR-001 | Single value source | The reactive `value` property MUST be the sole source of both visible text and attempted clipboard text, rendered by Lit text interpolation and copied without parsing, formatting, trimming, or normalization. | High | Open |
| FR-002 | Native control | The element MUST render exactly one native `type="button"` copy control, reuse the existing button visual/accessibility contract, and MUST NOT add a sequential host tab stop. | High | Open |
| FR-003 | Accessible label | `label` MUST name the native control; omitted or blank labels MUST warn and fail open to a documented generic name without hiding the value or control. | High | Open |
| FR-004 | Exact async copy | In a secure context with callable Clipboard API support, activation MUST attempt `writeText` exactly once with a snapshot of the exact current non-empty value. | High | Open |
| FR-005 | Truthful success | The component MUST report `copied` only after the attempted copy mechanism fulfills successfully. | High | Open |
| FR-006 | Deterministic manual fallback | Clipboard absence, insecure context, synchronous throw, or rejection MUST be contained and MUST attempt to focus and fully select the visible value for manual copying. | High | Open |
| FR-007 | Honest failure | If visible-value focus/selection cannot complete, the component MUST report `failed`; it MUST NOT claim success. | High | Open |
| FR-008 | Empty-value guard | An exactly empty value MUST visibly and semantically disable the control, invoke no copy/fallback path, and emit no result. | High | Open |
| FR-009 | Value reset | Every actual `value` assignment change MUST synchronously advance a private revision and clear stale outcome/status presentation, including A→B→A changes batched before render; an earlier asynchronous attempt MUST NOT restore status for a different revision. | High | Open |
| FR-010 | Stable status | One per-instance `role="status"`, `aria-live="polite"`, `aria-atomic="true"` node MUST exist from first render; result changes update its text rather than replacing the node. | High | Open |
| FR-011 | Message overrides | Success, manual-fallback, and failure messages MUST have documented defaults and consumer-overridable string properties/attributes; empty or whitespace-only overrides MUST fail open to the applicable default. | Medium | Open |
| FR-012 | Result event | Every completed non-empty attempt MUST emit exactly one typed `sk-copy-field-result` event that bubbles, is composed, is non-cancelable, and has readonly detail `{ outcome: 'copied' | 'manual' | 'failed' }`. | High | Open |
| FR-013 | Privacy boundary | Result event detail MUST NOT include `value`, copied text, or an alternate text-bearing field. | High | Open |
| FR-014 | Activation equivalence | Pointer click and native Enter/Space activation MUST follow the same copy path without duplicate results. | High | Open |
| FR-015 | Focus behavior | Copy success MUST retain focus on the button; manual fallback MUST move focus to the visible value without adding it to sequential navigation. | High | Open |
| FR-016 | Public parts | The element MUST expose documented `field`, `value`, `copy-control`, and `status` parts. | Medium | Open |
| FR-017 | Host layout | The authored element stylesheet MUST declare `:host { display: block }` and long values MUST wrap within the field without clipping the action. | High | Open |
| FR-018 | Registration and exports | The class MUST be registered through the repository `define()` helper and exported on all applicable public element entry points. | High | Open |
| FR-019 | Framework contract | Generated React and Vue surfaces MUST preserve the element tag and all public input properties; React MUST additionally expose `onSkCopyFieldResult` with detail narrowed to the literal result-outcome union. | High | Open |
| FR-020 | Story coverage | Storybook MUST publish default, hover, focused, active, disabled/empty, long, quotes/Unicode, copied, manual, failure, repeated/multiple, narrow, forced-colors, default-dark, and `LightMode` states. | Medium | Open |
| FR-021 | Behavior coverage | Deterministic authored tests MUST cover exact copy, property-before-upgrade, label fail-open, empty guard, success, all clipboard-negative branches, focus/selection fallback, failure, value reset, event flags/detail/privacy, keyboard activation, multiple instances, styles, parts, registration, and generated integrations. | High | Open |
| FR-022 | No inert static form | The package MUST NOT generate or export static markup for `sk-copy-field`; its JavaScript-required boundary MUST be documented. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Browser support | All behavior-bearing paths and required layout checks MUST pass in the repository-supported Chromium and Firefox projects on the exact reviewed SHA. | Compatibility | High | Open |
| NFR-002 | Accessibility | Axe MUST report no violations in required states; accessibility-tree evidence MUST show one sequential tab stop for a non-empty field and zero for an empty field, a named button, readable visible code, and one stable polite atomic status per field. | Accessibility | High | Open |
| NFR-003 | Responsive safety | Long content MUST create no page-level horizontal overflow at 390px and at actual 200% and 400% browser zoom in both required browsers. Zoom evidence MUST use real browser UI zoom (reset, then zoom to the named level), keep the physical window fixed, record CSS viewport/device-pixel-ratio/scroll-versus-client widths, and MUST NOT substitute CSS zoom, viewport resizing, CDP emulation, or pinch/page-scale emulation. | Usability | High | Open |
| NFR-004 | Theme parity | Dark, `LightMode`, forced-colors, focus, disabled, copied, manual, and failure treatments MUST remain perceivable without colour alone. | Accessibility | High | Open |
| NFR-005 | Motion safety | The component MUST add no unguarded transition or animation; any component-owned motion MUST be disabled under `prefers-reduced-motion: reduce`. | Accessibility | High | Open |
| NFR-006 | Token compliance | Authored styles MUST use existing `--sk-*` tokens only, add no component-named colour palette, and pass CSS source/boundary/hygiene gates. | Maintainability | High | Open |
| NFR-007 | Mutation adequacy | Every applicable ADR-11/conformance responsibility MUST have a meaningful registered mutation arm that the intended test kills. Mission-specific clipboard, fallback, message, concurrency, and reset branches MUST have deterministic ordinary test coverage unless a supported mutation registry responsibility binds to them without inventing or borrowing an inapplicable ID. | Quality | High | Open |
| NFR-008 | Derived-artifact integrity | Manifest, React wrapper/types, Vue declarations, CSS module, story/conformance indexes, ratchets, and `SIZES.md` MUST be regenerated from source and all freshness checks MUST pass. | Maintainability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Elements-first base | Work is based on latest `origin/train/elements-first`; the PR targets that train and uses `Refs #257`, never `Closes #257`. | Delivery | High | Open |
| C-002 | One coherent package | The element, authored CSS, stories, tests, registrations, docs, and generated artifacts form one atomic architectural boundary and therefore one work package and one PR. | Delivery | High | Open |
| C-003 | No application behavior | The library MUST NOT add Team Kitty routing, stores, discovery, polling, truth inference, timestamps, progress arithmetic, validation, or command execution. | Scope | High | Open |
| C-004 | No adjacent component | The mission MUST NOT add a dossier, mission-row, truth/provenance band, native-list wrapper, toast system, editor, parser, credential store, clipboard history, queue, or second button implementation. | Scope | High | Open |
| C-005 | No timer or retry | The field owns only immediate attempt/result state and MUST start no reset timer, retry, permission prompt, analytics, or telemetry behavior. | Scope | High | Open |
| C-006 | Native semantics | Native button, code, and selection semantics MUST be retained wherever the issue requires them. | Architecture | High | Open |
| C-007 | Authored/generated boundary | Authored source MUST live in its owning packages; generated files MUST be produced by repository scripts and never hand-edited. | Architecture | High | Open |
| C-008 | Approved evidence is read-only | `/home/jeroennouws/dev/team-kitty-missions/ux_redesign/repository-dossier/` is read-only evidence and receives no changes. | Workspace | High | Open |
| C-009 | Codex-only seats | Every implementation and review seat MUST use Codex; Claude, Claude Code, Hermes workers, and `/tk` transports are prohibited. | Process | High | Open |
| C-010 | Closure boundary | This mission may deliver an accepted PR but MUST NOT merge it or close #257; the programme orchestrator owns serial train merge and final closeout. | Delivery | High | Open |

### Key Entities

- **Copy value**: The exact JavaScript string exposed as `value`, rendered as visible code and
  supplied unchanged to the copy attempt.
- **Copy attempt**: One user activation against a non-empty value snapshot, producing exactly one
  terminal outcome.
- **Copy result**: `copied`, `manual`, or `failed`, reflected in per-instance status text and a
  privacy-safe event.
- **Status region**: A stable, polite, atomic node mounted from first render and owned by one field.

## Success Criteria

### Measurable Outcomes

- **SC-001 — Exactness**: Every deterministic success test observes one clipboard write whose
  argument is strictly equal to the supplied string, including whitespace and Unicode.
- **SC-002 — Honest recovery**: Every clipboard-negative test produces no unhandled rejection and
  terminates in `manual` only after full visible selection, otherwise `failed`; zero negative paths
  report `copied`.
- **SC-003 — Accessibility**: Required Storybook states have zero axe violations, exactly one
  sequential tab stop per non-empty field and zero per empty field, a meaningful button name,
  readable code, and one stable polite atomic status region.
- **SC-004 — Layout**: Required long/narrow checks in Chromium and Firefox show no page-level
  horizontal overflow at 390px, 200% zoom, or 400% zoom.
- **SC-005 — Public integration**: All generated-artifact freshness, manifest, part/doc, wrapper,
  Vue, CSS, story, conformance, ratchet, size, lint, type, build, and repository test gates pass on
  the exact reviewed SHA.
- **SC-006 — Visual intent**: Dark and `LightMode` stories plus focus, empty, manual, failure, and
  forced-colors states preserve the approved Dossier field/action hierarchy without inventing
  application data or behavior.
- **SC-007 — Scope**: The diff publishes exactly one new element and no prohibited adjacent
  component, static inert form, command execution, timer, retry, toast, or Team Kitty behavior.
- **SC-008 — Delivery**: One independent Codex implementation seat and one or more independent
  Codex review seats complete the Spec Kitty implement/review and accept gates; one PR references
  #257 and remains unmerged for the programme's serial train integration.
