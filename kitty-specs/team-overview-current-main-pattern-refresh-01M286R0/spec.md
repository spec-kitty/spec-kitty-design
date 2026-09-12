# Mission Specification: Team Overview current-main pattern refresh

**Mission**: \`team-overview-current-main-pattern-refresh-01M286R0\`
**Mission Branch**: \`team-overview-current-main-pattern-refresh\`
**Created**: 2026-09-11
**Status**: Specification complete — ready for planning
**Input**: GitHub issues #381 and #383; Family 1 Team workspace handoff and TO1/TO2 evidence; refreshed \`train/elements-first@d3263e9488f7df85a537a927d417729eacc75f12\`; predecessor #150
**Target**: One Work Package and one pull request into \`train/elements-first\`, with \`Refs #383\` and \`Refs #381\`
**Squad tier**: C — independent pre-merge review

## Outcome

Replace the historical Delivery return, Flow health, and operational-dashboard Team Overview
Storybook evidence with the current Team root contract. The refreshed pattern proves a populated
TeamMoment projection (TO1), the six role/state first-run projections (TO2), current public routes,
copy-field outcomes, responsive/accessibility resilience, and a deliberate migration from #150.

The pattern remains Storybook-only. Team Kitty retains routing, permissions, TeamMoment and
onboarding classification, retention, polling, clocks, copy/i18n, clipboard policy, and mutations.
The design library receives already-classified immutable fixture values and renders them through
public elements, static/native surfaces, and pattern-local token-only layout.

## Resolved decisions

- **RD-001 — Current means TeamMoment:** current Overview contains only Velocity, at most two
  distinct in-flight Mission references, admitted repositories, and at most six recent activity
  rows. Delivery return, Flow health, ROI, inventory, evidence routes, and page-wide sync are
  historical #150 evidence and are removed from current stories and baselines.
- **RD-002 — One TO1 source:** one deeply immutable TeamMoment/repository fixture supplies all
  navigation, copy, time, freshness, repository, Mission, and activity values. Pure projections
  derive totals, touched-day cells, caps, distinct Mission references, and row order.
- **RD-003 — Retention is input:** the default fixture may supply 72 hours, but an alternate
  retention fixture proves labels and day cells follow input rather than a product constant.
- **RD-004 — Truth stays scoped:** observed freshness labels apply only to TeamMoment Velocity,
  in-flight, and recent activity regions. Repository commit/branch/pushed facts are locally
  labelled factual and never inherit observed freshness.
- **RD-005 — Routes are supplied:** only fixture-provided Overview, Work, Connectors, Members,
  repository, and Mission destinations render as links. Activity rows remain passive.
- **RD-006 — Six server projections:** TO2 has exactly administrator-install, joined,
  administrator-repository, administrator-Mission, member-repository, and private-install
  fixtures. A visible native switcher is labelled design-review scaffolding and never presented
  as production onboarding state.
- **RD-007 — Authorization is data, not inference:** the fixture supplies role, privacy,
  \`canManage\`, completed/current steps, commands, and routes. Admission and Members actions render
  only when their supplied authorization and destination permit them.
- **RD-008 — Public copy contract:** commands use \`sk-copy-field\` with fixture-supplied value,
  accessible label, copied/manual/failure copy. Tests exercise its public result/focus contract;
  the pattern implements no clipboard policy or command execution.
- **RD-009 — Six ratcheted entries:** replace #150's six story IDs with six current entries:
  \`Default\`, \`AlternateRetention\`, \`FirstRun\`, \`LightMode\`, \`LongContent\`, and
  \`CopyOutcomes\`. Viewport, RTL, forced-colors, reduced-motion, zoom, and all six TO2 projections
  are exercised through the same stories using browser environment and fixture-selection inputs,
  not fake product states.
- **RD-010 — No public API delta:** no element, helper package export, token, wrapper, manifest
  entry, router, client, store, timer, poller, or application model is created.

## User Scenarios & Testing

### User Story 1 — Read the current populated Overview (Priority: P1)

As a Team Kitty integrator, I can inspect current TeamMoment and repository facts in a public-
surface composition and trust that every total, limit, route, and truth label follows one fixture.

**Independent Test**: render TO1 from the default and alternate-retention fixtures; assert exact
derived totals, caps, distinct Mission references, passive activity rows, route inventory, and
truth-region scope in the built Storybook.

**Acceptance Scenarios**:

1. **Given** one immutable fixture with repeated Mission moments, **when** TO1 renders, **then**
   Velocity totals/touched days, no more than two distinct in-flight Mission references, admitted
   repository rows, and no more than six recent rows derive from that source.
2. **Given** 72-hour and alternate retention fixtures, **when** each renders, **then** every window
   label and cell derives from the supplied hours/days without a hard-coded 72-hour policy.
3. **Given** TeamMoment and Git facts together, **when** truth copy is inspected, **then** observed
   freshness occurs only around TeamMoment content and repository facts are labelled factual.
4. **Given** supplied and absent destinations, **when** links are enumerated, **then** only supplied
   shell/repository/Mission routes are anchors and every activity row is passive.

### User Story 2 — Review all first-run role/state projections (Priority: P1)

As a product reviewer, I can switch among six supplied server responses and verify that current and
completed setup steps, role/privacy guidance, commands, and authorized actions remain truthful.

**Independent Test**: select all six fixtures through the labelled review switcher and compare the
visible/accessibility tree with each frozen response, including admission and Members guards.

**Acceptance Scenarios**:

1. **Given** any TO2 response, **when** selected, **then** completed steps, exactly one current step
   where applicable, later-step visibility, role, privacy, and commands match only that fixture.
2. **Given** an ordinary member response, **when** rendered, **then** admission/member-management
   actions are absent and supplied admin guidance remains visible.
3. **Given** a private-install response, **when** rendered, **then** no Members action or
   collaborative claim appears.
4. **Given** the design-review switcher, **when** operated, **then** it is explicitly outside the
   product contract and performs no request, poll, command, mutation, or persistence.

### User Story 3 — Copy supplied commands safely (Priority: P1)

As a keyboard or assistive-technology user, I can use the existing copy-field contract and receive
honest copied, manual-selection, or failed feedback without losing focus or exposing command data
in an event.

**Independent Test**: exercise \`sk-copy-field\` through its public button and result event under
copied, manual, and failed browser conditions; assert fixture-supplied messages, frozen outcome-
only details, and focus on either the invoked button or manual-selection value as specified by the
public contract.

**Acceptance Scenarios**:

1. **Given** available clipboard writing, **when** copy is invoked, **then** only \`copied\` is
   reported and focus remains safe.
2. **Given** unavailable clipboard but selectable visible code, **when** copy is invoked, **then**
   \`manual\` is reported, the exact visible command is selected, and manual guidance is announced.
3. **Given** unavailable clipboard and selection, **when** copy is invoked, **then** \`failed\` and
   fixture-supplied failure guidance are announced without a success treatment.

### User Story 4 — Preserve responsive and accessible composition (Priority: P2)

As a reviewer using keyboard, assistive technology, a narrow or zoomed viewport, RTL, light theme,
forced colors, or reduced motion, I can reach and understand the same facts without overflow,
clipped focus, reordered meaning, or color/motion-only state.

**Independent Test**: run focused Chromium and all-browser Playwright checks, axe across built
stories, and reviewed visual baselines at 1440px, intermediate, 390px, short viewport, long content,
200% zoom, RTL, forced colors, and reduced motion.

**Acceptance Scenarios**:

1. **Given** desktop and compact presentations, **when** landmarks and headings are inspected,
   **then** one H1, logical headings, native lists/links/buttons/code/status, and source/focus order
   match the visual order.
2. **Given** a closed compact drawer, **when** keyboard navigation runs, **then** drawer content is
   absent from focus/accessibility exposure; accepted dismissal returns focus to the trigger.
3. **Given** 390px, real 200% browser zoom (a fresh `deviceScaleFactor: 2` context at the
   720x512 CSS viewport derived from the normal 1440x1024 story viewport), long localized copy,
   RTL, or a short viewport, **when** the pattern is traversed, **then** the compact-shell
   breakpoint is observably crossed, targets are at least 44 CSS pixels, focus is not clipped,
   local content wraps, and the document has zero horizontal overflow. CSS `zoom` is supplemental
   magnification stress only and is not acceptance evidence for browser zoom.
4. **Given** light, forced-colors, or reduced-motion media, **when** rendered, **then** the same
   fixture content remains complete and meaning does not depend on hue or animation.

### Edge Cases

- A fixture with more than two distinct in-flight Missions or six recent rows is deterministically
  capped without mutating the source.
- Repeated moments for one Mission do not consume multiple in-flight slots.
- A retention window with a different hour count and touched-day set changes all dependent labels
  and cells while leaving unrelated repository facts unchanged.
- Missing or unsafe route values render passive text; no route is inferred from an identifier.
- Unauthorized fixtures cannot leak admission, Members, repository, Mission, or hidden future-step
  links into roles, names, keyboard order, or the accessibility tree.
- Long commands remain selectable and contained; copy controls do not fall outside the viewport.
- Hidden TO2 fixture panels are \`hidden\` and absent from keyboard/accessibility exposure.

## Requirements

### Functional Requirements

| ID     | Title                     | User Story                                                                                                             | Priority | Status |
| ------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| FR-001 | Current Storybook pattern | Replace the retired #150 current-product composition with TO1 and TO2 Storybook evidence only.                         | High     | Open   |
| FR-002 | Immutable TO1 fixture     | Supply one deeply frozen TeamMoment/repository fixture with all visible/a11y copy and routes.                          | High     | Open   |
| FR-003 | Pure TO1 projection       | Derive Velocity totals/cells, two distinct Missions, repository rows, and six recent rows without mutation.            | High     | Open   |
| FR-004 | Parameterized retention   | Prove default and alternate retention inputs drive every dependent label and cell.                                     | High     | Open   |
| FR-005 | Truth scope               | Limit observed freshness to TeamMoment regions and keep repository Git facts locally factual.                          | High     | Open   |
| FR-006 | Route safety              | Render links only for safe supplied Overview/Work/Connectors/Members/repository/Mission routes; keep activity passive. | High     | Open   |
| FR-007 | Six TO2 fixtures          | Provide exactly the six reviewed immutable role/state responses and a labelled review-only selector.                   | High     | Open   |
| FR-008 | TO2 projection guards     | Preserve supplied role/privacy/canManage/completed/current facts and authorization-gate admission/Members actions.     | High     | Open   |
| FR-009 | Setup semantics           | Render an ordered list with completed/current labels and only fixture-supplied commands/routes/copy.                   | High     | Open   |
| FR-010 | Copy-field composition    | Use public \`sk-copy-field\` and prove copied/manual/failed outcomes and safe focus.                                   | High     | Open   |
| FR-011 | Controlled compact drawer | Compose current \`sk-app-shell\` compact seam with consumer-controlled open/dismiss and focus return.                  | High     | Open   |
| FR-012 | Six current story IDs     | Replace the six obsolete #150 IDs with the six entries named in RD-009 and update discovery/visual inventories.        | High     | Open   |
| FR-013 | Migration note            | Document that #150 is historical/deprecated and map consumers to the current TeamMoment/first-run evidence.            | High     | Open   |
| FR-014 | Focused fixture tests     | Add direct immutable/projection/cap/authorization tests in the fixture suite.                                          | High     | Open   |
| FR-015 | Browser and visual proof  | Replace the focused Playwright and visual cases/baselines with current TO1/TO2 evidence.                               | High     | Open   |

### Non-Functional Requirements

| ID      | Title                  | Requirement                                                                                                                                    | Category        | Priority | Status |
| ------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ------ |
| NFR-001 | Accessibility          | Every ratcheted story is non-empty and has zero axe WCAG 2.1 AA violations; TO1/TO2 expose one H1 and native semantic structure.               | Accessibility   | High     | Open   |
| NFR-002 | Responsive containment | At 1440px, 1123px, 860/859px, 390px, short viewport, and real 200% zoom (fresh DPR-2 context at derived 720x512 CSS viewport), document overflow is zero and narrow targets are at least 44px. | Usability       | High     | Open   |
| NFR-003 | Theme/media resilience | Dark/default, same-fixture LightMode, RTL, forced colors, and reduced motion preserve complete content, visible boundaries, and focus.         | Accessibility   | High     | Open   |
| NFR-004 | Cross-browser          | Focused semantic/interaction/layout checks pass in configured Chromium, Firefox, and WebKit.                                                   | Compatibility   | High     | Open   |
| NFR-005 | Determinism            | Repeated projection of the same fixtures produces byte-equivalent values/order and never mutates caller-owned inputs.                          | Reliability     | High     | Open   |
| NFR-006 | Visual regression      | All registered current TO1/TO2 cases have inspected Linux/Chromium baselines and no obsolete #150 PNG remains.                                 | Visual          | High     | Open   |
| NFR-007 | Repository gates       | Quality, type, pattern-composition, unit, Storybook, axe, Playwright, visual, generated, and size gates pass before push.                      | Maintainability | High     | Open   |
| NFR-008 | Storybook budget       | Storybook builds within the repository's enforced three-minute budget.                                                                         | Performance     | Medium   | Open   |

### Constraints

| ID    | Title                    | Constraint                                                                                                                                         | Category             | Priority | Status  |
| ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------- | ------- |
| C-001 | No public component      | Do not add \`sk-team-overview\`, setup/activity/velocity components, a generic helper, package export, wrapper, or manifest entry.                 | Architecture         | High     | Binding |
| C-002 | Consumer ownership       | No routing, permissions, relay reads, polling, clocks, retention, TeamMoment/onboarding classification, copy/i18n, clipboard policy, or mutations. | Ownership            | High     | Binding |
| C-003 | Public surfaces only     | Use public element/static/native contracts and documented parts; no private root access or component CSS copying.                                  | Architecture         | High     | Binding |
| C-004 | Token-only pattern CSS   | Every pattern layout/style value uses existing \`--sk-*\` tokens and logical properties.                                                           | Design system        | High     | Binding |
| C-005 | Copy supplied            | Every visible and accessible string is fixture/consumer supplied under #286; no new element default is introduced.                                 | Internationalization | High     | Binding |
| C-006 | Retired product excluded | No Delivery return, Flow health, ROI, inventory, evidence route, or page-wide freshness claim remains in current stories/tests/snapshots.          | Scope                | High     | Binding |
| C-007 | One bounded delivery     | Exactly one Work Package and one PR target \`train/elements-first\`; no merge is authorized.                                                       | Process              | High     | Binding |
| C-008 | Generated integrity      | Do not hand-edit generated element/package artifacts; they must remain unchanged unless repository tooling deterministically requires a delta.     | Tooling              | High     | Binding |

### Key Entities

- **TO1 fixture**: immutable Team, shell, retention, TeamMoment, repository, route, and copy source.
- **TO1 projection**: frozen derived Velocity, distinct in-flight Mission, repository, and recent-row view.
- **TO2 response fixture**: one of six immutable supplied role/privacy/capability/setup projections.
- **Setup projection**: ordered completed/current/future-step view with authorization-filtered supplied links.
- **Review selector**: Storybook-only native control choosing one TO2 fixture; explicitly not product state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: exactly six current Team Overview stories replace the six #150 story IDs, and none
  contains Delivery/Flow/ROI/inventory/page-sync evidence.
- **SC-002**: TO1 tests prove derived retention, total, cap, distinct-Mission, route, and passive-row
  rules from deeply frozen input, including a non-72-hour fixture.
- **SC-003**: all six TO2 fixtures pass role/privacy/current/completed/action/route guards, copy-field
  public outcome/focus tests, and accessibility-tree review.
- **SC-004**: all responsive/theme/media/browser checks and axe pass with zero document overflow,
  clipped focus, or unauthorized reachable content.
- **SC-005**: all current visual cases have directly inspected baselines; every obsolete #150
  visual file and visual test case is removed.
- **SC-006**: the final branch passes the required repository gate surface, contains one bounded
  Work Package, and is pushed for independent review without opening or merging a PR.
