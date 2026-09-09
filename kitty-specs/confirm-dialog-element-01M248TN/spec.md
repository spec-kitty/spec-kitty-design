# Mission Specification: sk-confirm-dialog — native-dialog destructive confirmation element

**Mission Branch**: `mission/confirm-dialog-element`
**Created**: 2026-09-10
**Status**: Draft
**Input**: GitHub issue spec-kitty/spec-kitty-design#308 ("[TKT8] sk-confirm-dialog — consumer-copy destructive confirmation over the native `<dialog>`"), part of epic #300 (gap G7 of the Family 4 component-gap audit).

## Provenance and authority

- Origin: approved Family 4 "Teams and membership" pack (planning repo, `ux_redesign/families/04-teams-membership`). Opus rereview 04 verdict `approve`, 2026-09-10.
- Design authority: `train/elements-first@ce5823ceb44377089b2ebf28cdfc55fc0faabb9d`; Team Kitty `main@af9db1f58b9655a59f20b22ded21b75e18e904fd`.
- Family 4 status is **ready for Lynn**; Lynn's product verdict is still pending. Filing and specifying this mission is authorized at ready-for-Lynn. **Implementation adoption is gated on Lynn's Family 4 product verdict** — this spec does not authorize dispatching an implementation mission ahead of that verdict.
- Lynn's verdict is not recorded anywhere in this repository and must never be cited as evidence in any artifact this mission produces.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirm a destructive membership action (Priority: P1)

A Team Kitty screen author wires `sk-confirm-dialog` in front of a destructive, consumer-owned action — for example, removing a member, leaving a team, or revoking a bearer link. The screen supplies every string (title, body, confirm label, cancel label); the element opens as a native modal `<dialog>` via `showModal()`, and reports the user's choice without performing any action itself.

**Why this priority**: This is the entire reason the element exists — evidence T5 in the source issue shows a bearer-link revoke falling back to `window.confirm()` today, an unstyled, unlabelled, untranslatable browser prompt in front of a destructive action.

**Independent Test**: Mount `sk-confirm-dialog` with consumer-supplied title/body/confirm-label/cancel-label and an invoking button, call `showModal()`, activate the confirm control, and assert the dialog reports "confirm" and closes with no mutation, request, or navigation attempted by the element itself.

**Acceptance Scenarios**:

1. **Given** a closed `sk-confirm-dialog` with consumer-supplied strings, **When** the invoker opens it via `showModal()`, **Then** it renders as a native modal dialog whose accessible name is the supplied title and whose accessible description is the supplied body, and the rest of the page is inert.
2. **Given** an open dialog, **When** the user activates the confirm control (pointer or keyboard), **Then** the dialog closes and reports the outcome as confirmation; the element performs no mutation, request, or navigation.
3. **Given** an open dialog, **When** the user activates the cancel control, **Then** the dialog closes and reports the outcome as cancellation.

---

### User Story 2 - Every dismissal path is safe by default (Priority: P1)

A screen author relies on the guarantee that any way of leaving the dialog *other than* an explicit confirm activation is treated as cancellation — Escape, a backdrop click (if enabled), or a programmatic `close()` call with no explicit outcome.

**Why this priority**: The safety property the whole element exists to guarantee: accidental dismissal of a destructive confirmation must be harmless, while accidental confirmation must not be possible by accident.

**Independent Test**: For each dismissal path (Escape key, backdrop dismissal, programmatic `close()` with no argument), open the dialog and trigger that path; assert the reported outcome is cancellation in every case, and that focus returns to the invoking element.

**Acceptance Scenarios**:

1. **Given** an open dialog, **When** the user presses Escape, **Then** the dialog closes and reports cancellation.
2. **Given** an open dialog with backdrop dismissal enabled, **When** the user clicks outside the dialog's content, **Then** the dialog closes and reports cancellation.
3. **Given** an open dialog, **When** something in the consuming page calls the dialog's close method with no explicit outcome supplied, **Then** the dialog reports cancellation (never confirmation) and never invents a defaulted-to-confirm outcome.
4. **Given** any of the above, **When** the dialog finishes closing, **Then** focus returns to the element that invoked it.

---

### User Story 3 - No English literal ships while #286 is open (Priority: P1)

A screen author working in a non-English locale relies on the element carrying zero English (or any other language's) literal text — every user-visible string is consumer-supplied, with no fallback text substituted when a string is omitted.

**Why this priority**: #286 is open specifically because other elements in this library hardcode English strings in `render()`. Issue #308 states directly that "a dialog that ships English fallbacks is precisely the defect #286 exists to prevent, and this component is being added while that issue is open." This is the single most heavily reviewed contract point in the source issue.

**Independent Test**: Render the element with each of title/body/confirm-label/cancel-label omitted in turn; assert no literal text is substituted in the rendered shadow tree for the omitted string, and that a development-mode warning is emitted rather than a silent fallback.

**Acceptance Scenarios**:

1. **Given** the element is rendered with all four strings supplied, **When** the shadow tree is inspected, **Then** the only user-visible text present is exactly the four supplied strings (plus the platform/consumer-supplied confirm/cancel control content) — no other literal text node exists.
2. **Given** the element is rendered with the confirm label omitted, **When** it renders, **Then** no English (or other-language) placeholder text is substituted for it, and a warning is emitted identifying the missing required string.

---

### User Story 4 - The library never proposes Team deletion (Priority: P1)

A reviewer audits every story, exemplar, doc string, and test fixture this mission adds and confirms none of them present whole-Team deletion as an available confirmation flow.

**Why this priority**: Hard prohibition from the source issue and epic #300's shared constraints: whole-Team deletion is blocked on Team Kitty SaaS issue 1432 (not a design-repo issue). Shipping a demonstration that looks like a working Team-deletion confirmation would make this library look like the reason a blocked destructive path is launch-ready.

**Independent Test**: `grep` this mission's added/changed files for "team" combined with "delete"/"deletion" in any story, doc, or fixture context; the only acceptable matches are membership removal, leave-team, and bearer-link-revoke framing, never whole-Team deletion.

**Acceptance Scenarios**:

1. **Given** the full set of stories, docs, and fixtures this mission adds, **When** a reviewer greps for Team-deletion framing, **Then** zero matches present it as an available flow; membership removal, leave, and bearer-link revoke are the only destructive exemplars used.

---

### User Story 5 - The stylesheet stays honest about its static form (Priority: P2)

A reviewer or a future mission consulting this component's stylesheet needs to know, without guessing, whether a server-rendered (non-JavaScript) twin of `sk-confirm-dialog`'s presentation exists, and if not, why and where that question is tracked.

**Why this priority**: #308 explicitly instructs: "if that needs a static twin, follow #301's ruling rather than inventing one here." #301 (epic #300's TKT1/G0, the static-form-of-element-backed-CSS decision) is open and unresolved. Inventing a static form here would preempt a decision that is explicitly not this mission's to make; silently ignoring the question would leave it undiscoverable.

**Independent Test**: Confirm the component's documentation names the static-twin question as an open, explicitly deferred decision point tied to #301, rather than shipping generated static HTML for the dialog or being silent about the gap.

**Acceptance Scenarios**:

1. **Given** the component ships (JS-bearing, opened via `showModal()`, with no server-rendered equivalent for the *interactive* dialog), **When** a reader inspects its documentation, **Then** the stylesheet's authorability for a consumer-rendered `<dialog>` is stated, and the question "does this need a generated static twin" is recorded as deferred to #301's ruling, not answered here.

---

### Edge Cases

- What happens when the confirm and cancel labels are of very different lengths, or the title wraps to multiple lines? The action group must remain fully visible and reachable, and layout must not clip either control.
- What happens when the body content is long enough to exceed the dialog's available height? The body scrolls inside the dialog; the action group (confirm/cancel) stays reachable and is never pushed off-screen or behind a scroll boundary.
- What happens under `prefers-reduced-motion: reduce`? No entrance or exit motion runs for the dialog or its backdrop.
- What happens under `forced-colors: active`? The dialog surface, its boundary, and its backdrop remain distinguishable from each other and from the page.
- What happens at 200% zoom or at narrow viewport widths? The dialog does not clip its action controls; interactive targets remain at least 44px.
- What happens when a consumer overrides the initial-focus target? Focus lands on the consumer-documented element instead of the default (cancel), and still returns to the invoker on close.
- What happens if a consumer nests a second `sk-confirm-dialog` open request while one is already open? Out of scope — nested dialogs are an explicit non-goal (see Constraints); the spec does not define behavior for this because it must not be attempted.
- What happens when the confirm action's visual tone (e.g., destructive red vs. neutral) is chosen? The element never infers or applies a tone; the consumer composes `.sk-button`'s existing tone contract onto the confirm control.
- What happens in a right-to-left (RTL) locale? Layout is logical-property-driven; tab order still matches visual order.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | No default strings anywhere | As a screen author, I want title, body, confirm label, and cancel label to be entirely consumer-supplied with zero library-authored fallback text, so that no English (or any) literal ever ships while #286 is open. | High | Open |
| FR-002 | Accessible name and description from consumer content | As an assistive-technology user, I want the dialog's accessible name to come from the supplied title and its accessible description to come from the supplied body, so that the dialog is comprehensible without sight. | High | Open |
| FR-003 | Exactly two actions | As a screen author, I want the dialog to expose exactly a confirm action and a cancel action and no more, so that the component stays a bounded confirmation primitive rather than a general action sheet. | High | Open |
| FR-004 | Confirm composes `.sk-button`, consumer picks tone | As a screen author, I want the confirm control to compose the library's existing `.sk-button` presentation and let me choose its tone, so that the element never infers or asserts that an action is destructive. | High | Open |
| FR-005 | Outcome is reported, never performed | As a screen author, I want the element to run no mutation, request, or navigation itself under any circumstance, so that my application code remains the sole owner of what happens after a decision. | High | Open |
| FR-006 | One documented reporting mechanism | As a screen author, I want confirm/cancel outcomes reported through exactly one documented mechanism (not two half-supported ones), so that I have a single, reliable integration point. | High | Open |
| FR-007 | Dismissal always resolves as cancellation | As a screen author, I want Escape, backdrop dismissal (when enabled), and a programmatic close with no explicit outcome to all resolve as cancellation, so that every accidental-dismissal path is safe by default. | High | Open |
| FR-008 | Documented, overridable initial focus | As a screen author, I want the dialog's initial focus target to be documented (defaulting to the cancel action for a destructive confirmation) and overridable, so that I can make the safe choice the default while still supporting non-destructive confirmations that warrant a different default. | High | Open |
| FR-009 | Focus returns to the invoker | As a screen author, I want focus to return to the control that opened the dialog once it closes, for any close path, so that keyboard and screen-reader users are never stranded. | High | Open |
| FR-010 | Long body scrolls without clipping actions | As a screen author, I want a long body to scroll inside the dialog while the action group stays reachable, at narrow widths and at 200% zoom, so that the dialog never becomes unusable for a longer confirmation message. | Medium | Open |
| FR-011 | Reduced motion suppresses entrance/exit animation | As a user with `prefers-reduced-motion: reduce` set, I want no entrance or exit motion on the dialog or its backdrop, so that the interface respects my system preference. | Medium | Open |
| FR-012 | Forced-colors keeps surfaces distinguishable | As a user in `forced-colors: active` mode, I want the dialog surface, its boundary, and its backdrop to remain visually distinguishable from each other and the page, so that the dialog remains usable. | Medium | Open |
| FR-013 | Native modal semantics via `showModal()` | As a screen author, I want the dialog to open via the native `<dialog>` element's `showModal()`, so that the platform supplies focus trapping, page inertness, and top-layer stacking without the library reimplementing them. | High | Open |
| FR-014 | Team-deletion is never a demonstrated flow | As a reviewer, I want no story, exemplar, doc string, or test fixture in this mission to present whole-Team deletion as an available confirmation flow, so that the library is never the reason a SaaS-blocked destructive path (Team Kitty SaaS #1432) looks launch-ready. Membership removal, leave, and bearer-link revoke are the legitimate examples. | High | Open |
| FR-015 | No Team/membership/invitation/bearer-link/session model | As the library owner, I want the element to acquire no Team, membership, invitation, bearer-link, or session domain model, so that the application-vs-library boundary (epic #300, constraint 4) is preserved. | High | Open |
| FR-016 | Stylesheet authorable, static-twin question deferred | As a future consumer or mission, I want `sk-confirm-dialog`'s stylesheet to be authorable for styling a consumer-rendered `<dialog>`, and the question of whether a *generated static HTML twin* is needed to be recorded as explicitly deferred to #301's ruling — not invented here and not silently dropped. [NEEDS CLARIFICATION: whether a generated static twin is required, and in what form, is #301's ruling to make; this mission does not resolve it.] <!-- decision_id: 01M2491J55FKRXGT8E1KP5X2V1 --> | Medium | Open |
| FR-017 | Missing required string warns, never fabricates fallback text | As a library maintainer, I want an omitted required string (title, body, confirm label, or cancel label) to render with no substituted literal text and to emit a development-time warning identifying which string is missing, so that a consumer integration defect is visible rather than silently masked by invented copy. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Interactive target size | Every interactive control (confirm, cancel, and any backdrop-triggered affordance) presents a target of at least 44×44px. | Accessibility | High | Open |
| NFR-002 | Tab order matches visual order | Sequential keyboard navigation through the dialog's controls matches their visual left-to-right/top-to-bottom (or RTL-mirrored) order, with zero exceptions. | Accessibility | High | Open |
| NFR-003 | Zero axe-core WCAG 2.1 AA violations | Every required story state (see Success Criteria) scores zero WCAG 2.1 AA violations under axe-core. | Accessibility | High | Open |
| NFR-004 | RTL and logical-property layout | The dialog's layout is expressed with logical CSS properties so it mirrors correctly under an RTL document direction, with no visual or interaction regression. | Accessibility | Medium | Open |
| NFR-005 | Visual regression coverage | Dark (default) and the required `LightMode` presentation both have committed visual baselines, plus baselines for reduced motion, forced colors, narrow width, and 200% zoom where feasible. | Reliability | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | One Work Package, one PR | This mission delivers exactly one bounded Work Package and one PR. If the work cannot fit one WP, the mission stops and reports rather than splitting on its own authority. | Process | High | Open |
| C-002 | Not a modal framework | No modal/overlay/popover framework, service, stack, or manager is introduced. `sk-confirm-dialog` is a single bounded element. | Technical | High | Open |
| C-003 | No adjacent surface types | No drawers, sheets, non-modal dialogs, nested dialogs, toasts, or snackbars are introduced by this mission. | Technical | High | Open |
| C-004 | No copy defaults, no destructive-action vocabulary | The element defines no default copy and no vocabulary for what counts as "destructive" — that judgment and its wording stay entirely with the consumer. | Technical | High | Open |
| C-005 | No undo, no form validation inside the dialog | The element owns no undo mechanism and performs no form validation inside the dialog body. | Technical | Medium | Open |
| C-006 | Tokens-first CSS | Every CSS value in the component's stylesheet references a `--sk-*` token; no raw `rgba()`, hex, or `Npx` literal appears in component CSS. | Technical | High | Open |
| C-007 | Generated packages are never hand-edited | `packages/react/src` (and any other generated artifact — manifest, styles-layer HTML/index if applicable, SIZES.md) is regenerated by its script, never hand-written. | Technical | High | Open |
| C-008 | Ratchet registration | The new element is registered in `expected-parts.json` and `expected-docs.json` (both exact/shrink-only per their own rules) and, because it owns focus/keyboard/event behavior, in `behaviours.json` with a matching `mutations.json` entry. | Technical | High | Open |
| C-009 | Lynn's verdict gates implementation, not this spec | This spec may be written and this mission may proceed through plan/tasks at "ready for Lynn" status, but an actual implementation mission must not be dispatched before Lynn's Family 4 product verdict lands, per epic #300. | Process | High | Open |

### Key Entities

- **Confirmation outcome**: The single fact this element produces — `confirm` or `cancel` — carried by the native `close` event's `returnValue` (see FR-006). It is a report, not a domain object; the element neither stores it nor acts on it beyond emitting it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can compose a fully labelled confirmation dialog supplying 100% of user-visible text, with zero literal text contributed by the library.
- **SC-002**: All dismissal paths (Escape, backdrop dismissal, programmatic close with no explicit outcome) resolve identically as cancellation in automated behavior tests — 0 of these paths ever report confirmation.
- **SC-003**: Focus returns to the invoking control on 100% of close paths (confirm, cancel, Escape, backdrop, programmatic).
- **SC-004**: Every required story state scores zero WCAG 2.1 AA violations under axe-core.
- **SC-005**: A repo-wide review of this mission's added stories, docs, and fixtures finds zero instances presenting whole-Team deletion as an available flow.
- **SC-006**: The stylesheet's static-twin status is answered by a single, explicit, discoverable statement (deferred to #301) rather than by silence or by an invented static form — verified by presence of that statement in the component's published documentation.
- **SC-007**: The element ships as one Work Package and one PR against `mission/confirm-dialog-element`.
