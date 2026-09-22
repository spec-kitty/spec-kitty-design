# Mission Specification: Compact navigation seam for `sk-app-shell`

**Mission**: `repository-dossier-compact-navigation-shell-01M1Y3FY`
**Issue**: GitHub #254
**Created**: 2026-09-07
**Status**: Draft for planning
**Delivery boundary**: one cohesive extension of the existing `sk-app-shell`; no implementation tasks or split architectural boundaries are defined here.

## Product intent and boundary

Extend the existing `sk-app-shell` with one opt-in compact-navigation presentation axis for the approved Repository Dossier narrow layouts. In recognized compact mode, the shell places consumer-authored compact-header and compact-navigation content, presents the latter as a bounded drawer, and emits dismissal intent. The consumer remains the source of truth for the open value, trigger, accessible labels, navigation markup, routes, current destination, and acceptance of dismissal.

When the axis is absent, the existing three-column layout, four existing slots, six existing parts, and current responsive behavior remain unchanged. This is a presentation seam, not a new shell, navigation component, router, Team Kitty model, or application state store.

## User scenarios and testing

### User Story 1 — Preserve the existing shell by default (Priority: P1)

As an existing `sk-app-shell` consumer, I want the compact axis to be opt-in so existing pages retain their current layout and behavior without migration.

**Why this priority**: Backward compatibility is the primary safety boundary for a shared shell.

**Independent Test**: Render an existing fixture without the axis at desktop and legacy narrow widths and compare layout, slots, parts, and interactions with the existing visual and behavior baseline.

**Acceptance Scenarios**

1. **Given** the axis is absent, **when** the shell renders, **then** the existing personal rail, context sidebar, page header, and default content use the unchanged three-column layout and legacy 720px stacking rule.
2. **Given** an unknown axis value, **when** the shell renders, **then** it warns and fails open to the existing layout without activating compact presentation.
3. **Given** a property value is assigned before custom-element upgrade, **when** `sk-app-shell` is defined, **then** that value is retained and the resulting presentation follows the same controlled contract as a post-upgrade assignment.

### User Story 2 — Present compact navigation at approved widths (Priority: P1)

As a consumer building a narrow Repository Dossier page, I want an optional compact header and consumer-authored navigation drawer so desktop columns leave the content canvas and navigation remains usable at narrow widths.

**Why this priority**: This is the user-facing outcome represented by the approved D1, D2, and D4–D8 screens.

**Independent Test**: Render a full-width shell at 860px, 768px, and 390px inline sizes, plus a shell constrained independently of a wider viewport, with closed and open values, short and long labels, and short and tall viewports; verify placement, readability, overflow, and drawer scrolling.

**Acceptance Scenarios**

1. **Given** recognized compact mode at exactly 860px, **when** the shell is closed, **then** the compact header is available, the desktop personal/context columns are removed from the content canvas, and the page remains usable.
2. **Given** recognized compact mode at 768px or 390px, **when** the drawer is open, **then** the consumer navigation is visible in a bounded viewport-constrained drawer and the content canvas does not include the desktop columns.
3. **Given** short or long navigation/team/repository labels, **when** compact mode is rendered at the required widths, **then** labels are not clipped and the document has no horizontal page overflow; overflow, when needed, is handled by the drawer internally.
4. **Given** a short or tall viewport, **when** drawer content exceeds available height, **then** the drawer scrolls internally without requiring document-level horizontal scrolling.

### User Story 3 — Operate a controlled, accessible drawer (Priority: P1)

As a consumer, I want to control the drawer value while the shell exposes truthful relationships and predictable keyboard behavior so users can open, dismiss, and return to navigation safely.

**Why this priority**: State ownership, focus, and exposure of hidden content are accessibility and integration contracts, not optional presentation details.

**Independent Test**: Drive closed/open values through pointer and keyboard fixtures, inspect accessibility tree and sequential focus, dispatch Escape, and verify event flags, count, consumer acceptance, and focus destination.

**Acceptance Scenarios**

1. **Given** the consumer-controlled value is closed, **when** the trigger is rendered inside the consumer-authored compact-header region, **then** its `aria-expanded` and control relationship truthfully describe the closed drawer and the drawer has an accessible name supplied through the documented consumer contract.
2. **Given** the consumer-controlled value is open, **when** the trigger is activated by pointer or keyboard, **then** the consumer updates the value and the shell presents the open drawer; the shell does not infer or own application state.
3. **Given** the drawer is closed, **when** focus traversal or accessibility inspection occurs, **then** drawer content is absent from sequential focus and the accessibility tree.
4. **Given** the drawer is open, **when** keyboard traversal occurs, **then** consumer navigation is reachable in native order and the compact header/drawer do not duplicate the page `main` landmark or invent a navigation landmark around consumer content.
5. **Given** the shell is in recognized compact presentation, its inline size is at or below 860px, and the drawer is open, **when** Escape is pressed once, **then** exactly one typed dismissal request is emitted with bubbling and composed behavior and `cancelable` equal to `false`; the shell does not mutate the open value.
6. **Given** the drawer is closed, **when** Escape is pressed, **then** no dismissal request is emitted.
7. **Given** the consumer receives a dismissal request, **when** exactly one bounded post-dispatch microtask samples the controlled value as effectively false (`open !== true`), including React 19's omitted/undefined false property, **then** the request is accepted and the shell awaits its Lit update before returning focus to the consumer-supplied trigger if it remains connected; otherwise focus is not stranded on hidden or removed content. The pending intent expires at that first sample whether accepted or rejected, so any close after the sample, including a later route/state close, cannot inherit focus-return intent.
8. **Given** a consumer route activation requests close, **when** the consumer sets the open value to closed, **then** the shell presents the closed state without implementing routing, route selection, current-link inference, or destination state.

### User Story 4 — Maintain resilient responsive and accessibility modes (Priority: P2)

As a user or integrator using zoom, themes, forced colors, or reduced motion, I want the same compact contract to remain readable, exposed, and operable across presentation modes and threshold transitions.

**Why this priority**: These modes expose layout and accessibility regressions that ordinary viewport checks miss.

**Independent Test**: Exercise both controlled states during resize across the compact threshold at 200% and 400% browser UI zoom, default dark, `LightMode`, forced-colors, and reduced-motion settings; assert exposure, focus, overflow, and cleanup. The 400% check is an additional programme-level operator requirement beyond live issue #254.

**Acceptance Scenarios**

1. **Given** the shell's inline container crosses the approved compact threshold in either direction, **when** presentation recomputes, **then** the consumer-controlled open value is unchanged, the compact-header trigger is removed from presentation together with its drawer on the non-compact side, and no hidden focused content or off-screen focus target remains.
2. **Given** 200% or 400% real browser UI zoom and a 390px CSS viewport, **when** compact content is rendered, **then** content remains readable and `document.scrollWidth` does not exceed the viewport width.
3. **Given** default dark mode, required `LightMode`, forced-colors, or reduced-motion, **when** any required shell state is rendered, **then** contrast, system color adaptation, and operation remain available without relying on color, hover, animation, or a glyph alone.

### User Story 5 — Ship and maintain the public component contract (Priority: P2)

As a design-system maintainer, I want the compact seam represented in stories, tests, documentation, and generated/conformance artifacts so consumers can discover and safely use it.

**Why this priority**: The repository’s elements-first and generated-artifact rules make these deliverables part of the component contract.

**Independent Test**: Run the focused element, accessibility, Playwright, lint, manifest, registry, generation, and size checks and inspect the published component documentation and stories.

**Acceptance Scenarios**

1. **Given** the component stories are built, **when** the story set is inspected, **then** it covers default desktop, compact closed/open, long navigation, short viewport, default dark, `LightMode`, reduced motion, and forced colors.
2. **Given** the verification suite runs, **when** every required state is exercised, **then** controlled state, pre-upgrade properties, single dismissal emission, Escape, focus destination, closed-drawer inertness, resize cleanup, unknown-value fail-open, threshold edges, internal scrolling, page overflow, and axe results are asserted.
3. **Given** the public contract changes, **when** documentation and conformance checks are generated, **then** slot/property/event/part semantics, trigger obligations, threshold, focus behavior, presentation-versus-navigation ownership, manifest, behavior/mutation registries, applicable generated outputs, React wrappers, Vue types, ratchets, and size report are synchronized without hand-editing generated artifacts. The existing app-shell has no authored markup module, so the repository-wide static-markup generator must pass without inventing one for this extension.

## Edge cases and resolved semantics

- The approved transition is an inline container threshold on `sk-app-shell`, inclusive at 860px: compact presentation applies at an app-shell inline size of 860px and below; the threshold-edge fixture also verifies the first width above 860px remains non-compact. Full-width fixtures use matching viewport and shell widths, and a constrained-shell fixture proves this is not an accidental global viewport contract. The pre-existing 720px container rule remains unchanged when the axis is absent.
- Unknown axis values warn and fail open to legacy presentation. They do not silently select compact mode.
- The shell never directly changes the controlled open value. Dismissal is a request for consumer acceptance, represented by setting the value to closed.
- The shell's effective-open state is `presentation === 'compact'`, inline container size at or below 860px, and consumer `open === true`. The dismissal request is one typed bubbling composed event per Escape interaction only while effectively open, non-cancelable because the shell has no self-close operation to cancel. Escape in an absent/unknown/non-compact presentation or while closed emits none.
- A dismissal request is sampled after exactly one bounded post-dispatch microtask. It is accepted when the consumer-controlled value is effectively false (`open !== true`) at that sample, including React 19's omitted/undefined false property; this permits a framework commit scheduled by the current dispatch without making the shell own state. After acceptance, the shell awaits its Lit update before focusing. The pending intent expires at the sample whether accepted or rejected, so any close after the sample, including a later route/state close, cannot inherit focus-return intent.
- The public event/property/slot/part names follow repository conventions; this specification fixes their semantics and does not prescribe a name the issue leaves open.
- Resize may recompute presentation but never mutates controlled state. Cleanup must reconcile visibility, accessibility exposure, and focus.
- The consumer-supplied trigger must be slotted inside `compact-header`, must remain a same-root light-DOM sibling of the controlled navigation target, and is the focus return target only while connected. Hiding the whole compact-header and drawer together above 860px prevents a visible stale expanded claim without transferring `aria-expanded` ownership to the shell. A disconnected trigger must not receive focus and must not leave focus on hidden content.

## Requirements

### Functional Requirements

| ID | Title | Requirement | User Story | Priority | Status |
|---|---|---|---|---|---|
| FR-001 | Opt-in axis | The shell shall support one recognized compact-navigation presentation axis and shall keep the axis absent by default. | US1 | P1 | Required |
| FR-002 | Legacy preservation | With the axis absent, the shell shall preserve the existing four slots, six parts, three-column layout, and legacy responsive behavior, including the 720px stacking rule. | US1 | P1 | Required |
| FR-003 | Unknown-value fail-open | For every unrecognized axis value, the shell shall warn and present the legacy layout. | US1 | P1 | Required |
| FR-004 | Pre-upgrade retention | A property assigned before custom-element upgrade shall survive registration and produce the corresponding presentation after upgrade. | US1 | P1 | Required |
| FR-005 | Compact header region | Recognized compact mode shall expose an optional consumer-authored compact-header region without creating a duplicate page `main` landmark. | US2 | P1 | Required |
| FR-006 | Compact navigation region | Recognized compact mode shall expose a consumer-authored compact-navigation/drawer region for native navigation markup. | US2 | P1 | Required |
| FR-007 | Threshold placement | At an `sk-app-shell` inline container size of 860px and below, compact mode shall make the compact header available and remove desktop personal/context columns from the content canvas; the first inline size above 860px shall remain the non-compact side of the threshold. | US2 | P1 | Required |
| FR-008 | Controlled presentation | The shell shall present open or closed drawer visibility from the consumer-controlled open value and shall never mutate that value directly. | US3 | P1 | Required |
| FR-009 | Accessible relationship | The documented consumer contract shall require the trigger to be consumer-authored in the `compact-header` slot, remain in the same light-DOM root as the navigation target, expose `aria-expanded` and `aria-controls` from the controlled value/target id, and provide an accessible drawer name. | US3 | P1 | Required |
| FR-010 | Closed inertness | A closed drawer shall be absent from sequential focus and the accessibility tree; an open drawer shall be keyboard reachable in native order. | US3 | P1 | Required |
| FR-011 | Dismissal request | One Escape interaction while effectively open (recognized compact axis, shell inline size `<=860px`, and controlled open true) shall produce exactly one typed, bubbling, composed, non-cancelable dismissal request; Escape in every other state shall produce none. | US3 | P1 | Required |
| FR-012 | Accepted dismissal focus | Exactly one bounded post-dispatch microtask shall sample the consumer-controlled open value, accepting effective falsiness (`open !== true`), including React 19's omitted/undefined false property. After acceptance, the shell shall await its Lit update before focus returns to the connected consumer trigger. The pending intent shall expire at that first sample whether accepted or rejected, so any close after the sample, including a later route/state close, cannot restore focus; if the trigger is disconnected, no focus shall remain on hidden or removed content. | US3 | P1 | Required |
| FR-013 | Route-activation close | Consumer route activation shall be able to request close by changing the controlled value without requiring the shell to implement routing or destination state. | US3 | P1 | Required |
| FR-014 | Bounded drawer | Open compact navigation shall be constrained to the viewport and shall scroll internally when content exceeds available height. | US2 | P1 | Required |
| FR-015 | Overflow resilience | At 860px, 768px, and 390px with long labels, including real 200% and programme-required 400% browser UI zoom at a 390px CSS viewport, the shell shall avoid clipping and page-level horizontal overflow. | US2/US4 | P1 | Required |
| FR-016 | Resize reconciliation | Resize across the compact threshold shall preserve the controlled open value and reconcile visibility, focus, accessibility exposure, and expanded claims without stale or off-screen states. | US4 | P1 | Required |
| FR-017 | Accessibility modes | Required shell states shall support default dark, `LightMode`, forced-colors, and reduced-motion modes without relying on hover, color, animation, or a glyph alone. | US4 | P2 | Required |
| FR-018 | Stories | Focused stories shall cover default desktop, compact closed/open, long navigation, short viewport, dark, `LightMode`, reduced motion, and forced colors. | US5 | P2 | Required |
| FR-019 | Behavioral verification | Tests shall cover controlled state, pre-upgrade values, unknown fail-open, pointer/keyboard operation, Escape count and flags, focus destination, closed inertness, resize cleanup, threshold edges, scrolling, overflow, and axe checks. | US5 | P1 | Required |
| FR-020 | Documentation | Documentation shall describe the public slot/property/event/part contract, consumer trigger and label obligations, responsive threshold, focus behavior, and separation of presentation state from application navigation state. | US5 | P2 | Required |
| FR-021 | Generated contract synchronization | The delivery shall update applicable behavior and mutation registries and regenerate applicable CSS/static outputs, custom-elements manifest, React wrappers, Vue types, conformance ratchets, and size report; generated artifacts shall not be hand-edited. Because `sk-app-shell` has no authored markup module, the static-markup generator shall pass without creating a new app-shell markup surface. | US5 | P1 | Required |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|---|---|---|---|---|---|
| NFR-001 | Responsive envelope | Automated layout checks shall pass at app-shell inline sizes 860px, 768px, and 390px, at the 861px threshold edge, in both drawer states, in short and tall viewports, and with a constrained shell inside a wider viewport. | Compatibility | P1 | Required |
| NFR-002 | No horizontal page overflow | For the required widths, long labels, and real 200%/400% browser UI-zoom evidence, `document.scrollWidth` shall be less than or equal to the viewport width. | Usability | P1 | Required |
| NFR-003 | Accessibility coverage | Axe checks shall pass for every required compact state, including closed/open, dark/`LightMode`, forced-colors, reduced-motion, and threshold-transition fixtures, with no new critical or serious violations. | Accessibility | P1 | Required |
| NFR-004 | Focus safety | No tested resize, dismissal, or closed-state transition shall leave focus on a hidden/removed node or an off-screen drawer target. | Accessibility | P1 | Required |
| NFR-005 | Baseline stability | The existing desktop `sk-app-shell` visual baseline and legacy behavior shall remain unchanged when the axis is absent. | Compatibility | P1 | Required |
| NFR-006 | Styling boundary | New styling shall use repository tokens, documented parts, and documented custom properties; no ancestor selector shall be required to cross the open shadow boundary. | Maintainability | P1 | Required |
| NFR-007 | Deterministic event behavior | For each effectively-open Escape key interaction, event count shall be one; for each absent/unknown/non-compact/closed Escape interaction, event count shall be zero; event flags shall be `bubbles=true`, `composed=true`, and `cancelable=false`. | Reliability | P1 | Required |
| NFR-008 | Generated-artifact integrity | Applicable generation, manifest, wrapper/type, ratchet, behavior/mutation, size, CSS-boundary, and authoring checks shall complete successfully with no generated-output drift. | Maintainability | P1 | Required |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|---|---|---|---|---|---|
| C-001 | Single ownership boundary | Keep one cohesive `sk-app-shell` delivery boundary: the shell owns placement, drawer visibility as a rendering consequence, internal drawer scrolling, and dismissal intent; the consumer owns open value, trigger, labels, navigation markup, routes, destination, and dismissal acceptance. | Architecture | P1 | Required |
| C-002 | Dependency gate | The mission depends on closed #145. It may run in parallel with TKD1 and TKD3 from #253; TKD4 consumes all three. Before the final gate, the delivery must be rebased on the latest `train/elements-first` and shared artifacts regenerated. | Delivery | P1 | Required |
| C-003 | Elements-first authoring | Authored markup belongs in the element source; applicable generated static output and wrappers/types follow repository generation rules and are never hand-authored. This extension shall not introduce an app-shell markup module solely to manufacture an otherwise inapplicable static artifact. | Technical | P1 | Required |
| C-004 | Existing component stability | Do not change `sk-personal-rail`, `sk-context-sidebar`, `sk-nav-pill`, existing shell parts/slots, or default responsive behavior outside the explicit compact axis. | Compatibility | P1 | Required |
| C-005 | No application state | Do not add Team Kitty state, routes, route registry, current-link inference, navigation history, persistence, breakpoint service, global store, or application-wide focus trap. | Scope | P1 | Required |
| C-006 | No new navigation product | Do not add a new application shell, personal-sidebar component, navigation tree, third navigation rail, desktop top navigation, or Team Kitty-specific branding/copy. | Scope | P1 | Required |
| C-007 | Naming by convention | Exact public property, event, slot, and part names shall follow existing element conventions; this specification mandates semantics and does not invent names left open by issue #254. | API | P1 | Required |
| C-008 | Accessibility structure | Compact header and drawer shall not duplicate the page `main` landmark or invent navigation landmarks around consumer content. | Accessibility | P1 | Required |

## Key entities

- **Presentation axis**: absent, recognized compact, or unknown; selected by the consumer and interpreted by the shell.
- **Controlled open value**: the consumer-owned boolean that determines drawer presentation.
- **Compact header**: optional consumer-authored markup placed by the shell in compact presentation.
- **Compact navigation/drawer**: consumer-authored native navigation placed, exposed, hidden, and internally scrolled by the shell.
- **Consumer trigger**: the consumer-owned control placed inside the `compact-header` slot, in the same light-DOM root as the navigation target, whose truthful relationship to the drawer includes expanded state and whose connected instance is the focus-return target.
- **Dismissal request**: the shell’s typed intent event; it carries no application state and is accepted only when the one bounded post-dispatch microtask sample observes the consumer-controlled value as effectively false (`open !== true`), including omission/undefined.

## Success criteria

### Measurable outcomes

- **SC-001**: 100% of required fixtures preserve the legacy desktop visual/behavior baseline when the axis is absent.
- **SC-002**: 100% of compact layout fixtures at 860px, 768px, and 390px, including threshold edges, a constrained-shell case, long labels, short/tall viewports, and real 200%/400% browser UI zoom, have no document horizontal overflow and keep excess drawer content internally scrollable.
- **SC-003**: 100% of controlled-state fixtures show truthful expanded/control relationships, closed inertness, native open focus order, and no hidden/off-screen focus after resize or accepted dismissal.
- **SC-004**: 100% of effectively-open Escape interactions emit exactly one event with `bubbles=true`, `composed=true`, `cancelable=false`; 100% of absent/unknown/non-compact/closed Escape interactions emit none; the shell directly mutates the controlled open value zero times.
- **SC-005**: Axe reports zero new critical or serious violations across every required state and mode, including default dark, `LightMode`, forced-colors, and reduced-motion.
- **SC-006**: All required stories, focused behavior tests, Playwright checks, documentation, conformance registries, generated artifacts, ratchets, and size checks pass without generated-output drift.
