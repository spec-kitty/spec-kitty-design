# Mission Specification: Team overview shell elements

**Mission:** `team-overview-shell-elements-01M1S8R8` · **Issue:** #145 · part of epic #144 · tracks #125
**Branch:** `mission/team-overview-shell-elements` from `train/elements-first` at `37662678938c0e76455760e435c5ea626aac8056`
**Created:** 2026-09-05
**Status:** Draft
**Squad tier:** B — three independent lenses post-tasks and again at the pre-merge gate
**Governing decisions:** [ADR-9](../../docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md), [ADR-10](../../docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md), [ADR-11](../../docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md), and the [component-authoring recipe](../../docs/contributing/adding-a-component.md)

## Source and visual authority

- Product and ownership authority: [epic #144](https://github.com/spec-kitty/spec-kitty-design/issues/144) and [mission issue #145](https://github.com/spec-kitty/spec-kitty-design/issues/145).
- Approved design authority: Stitch project
  [`codex-teamkitty-redesign`](https://stitch.withgoogle.com/projects/10134542414402054345), screen
  **“Team overview — final review v4 approved”**. The operator supplied the approved full-page
  export in the mission session on 2026-09-05. It shows the shell at the 1440px product target.
- Existing contract authority: the `sk-button` implementation landed from #79 in train commit
  `70742b8436ca89e09cb6e0416c0830f4bded3289`. This mission extends that element; it does not
  fork or replace it. Issue #153 records the existing element's missing route to an accessible
  icon-only name and focus delegation; the narrow extension here implements the defect resolution
  required by #145. After the authorized train PR is verified merged, mission/orchestrator wrap-up
  closes both #145 and #153 with the merged PR and train-commit evidence.
- Repository authority: tokens remain the sole design-value source; CSS, element, manifest,
  generated React wrapper and Vue declarations retain the established one-way dependency and
  generation contracts.

## Why this mission exists

The approved Team overview uses a persistent personal rail, a selected-context sidebar, a page
header and a content canvas. Those regions are reusable layout and accessibility concerns. The
active team, current route, open/closed navigation, identity, destinations, sync time and icons are
Team Kitty concerns and must not leak into the design library.

This mission adds four small slot-driven elements plus one additive size on the existing button.
They establish geometry, responsive reflow, accessible region structure and theme-aware styling;
they do not become a stateful dashboard shell.

```text
Team Kitty container
  owns user/team data, route, navigation visibility, timers and actions
        │ slotted semantic controls + verbatim labels and sync copy
        ▼
sk-app-shell
  ├── sk-personal-rail
  └── sk-context-sidebar
        └── content region
              ├── sk-page-header
              └── Team Kitty page content

sk-button size="icon"
  supplies a square, named, focus-visible control; Team Kitty supplies the glyph and action
```

## Confirmed terminology and ownership

- **Personal rail:** the narrow, application-wide navigation region. It is not team identity or
  team navigation. Its top group contains application navigation only.
- **Context sidebar:** the wider navigation/content region for the currently selected context,
  such as a team. The element neither knows nor selects that context.
- **Page header:** the heading and metadata row for the current page. Sync copy is opaque consumer
  text, not a freshness calculation.
- **Controlled navigation:** Team Kitty owns whether any navigation surface is visible or open.
  These elements expose no `open` state, toggle method or navigation event.
- **Native action semantics:** links remain links and buttons remain buttons. Shell elements do not
  intercept, translate, cancel or redispatch their descendants' actions.
- **Icon-only button:** the existing `sk-button` with `size="icon"`. `label` supplies the accessible
  name of the real inner button or anchor. The consumer supplies the slotted glyph.
- **Issue resolution:** WP workers implement and verify only; they never close GitHub issues.
  Immediately after verifying the explicitly authorized PR merged into `train/elements-first`,
  mission/orchestrator wrap-up closes #145 and #153 as completed with the merged PR and commit
  evidence. It does not change #112, #125, #144, #146, #147, #148, #150, #154, or any other
  parent/sibling/follow-up issue; if one was completed separately, it preserves and records that
  externally changed state.

## Public contracts

### `<sk-app-shell>`

- Named slots: `personal-rail`, `context-sidebar`, `page-header`; the default slot is main content.
- Desktop geometry is exactly a 56px personal column plus a 240px context column and a remaining
  content column that may shrink without clipping its descendants.
- At narrow widths all supplied regions remain reachable and the main region does not overflow the
  viewport. The element does not hide a navigation region or synthesize a drawer; the consumer may
  apply its own controlled visibility to slotted hosts.
- Public parts: `shell`, `personal`, `context`, `content`, `header`, `main`.
- No public attributes, methods or custom events.

### `<sk-personal-rail>`

- Named slots: `primary`, `utilities`, `account`, `logout`.
- `primary` is the top application-navigation group. Account/identity content has exactly one
  approved location: `account`, in the bottom utility area above `logout` and below a divider.
- A reflected `label` string names the navigation landmark; its generic default does not mention
  Team Kitty or a team.
- Slotted controls retain their own link/button semantics and events. The rail has no click or
  keyboard handlers and does not inspect slotted content for route, identity or icon meaning.
- Public parts: `rail`, `primary`, `bottom`, `utilities`, `divider`, `account`, `logout`.
- No methods or custom events.

### `<sk-context-sidebar>`

- Named slots: `header`, default content/navigation, and `footer`.
- A reflected `label` string names the complementary region. The element lays out the supplied
  content but does not infer active navigation, select a team or impose a navigation destination.
- Direct slotted items are width-constrained so long labels truncate visually without removing,
  rewriting or hiding their full accessible text.
- Public parts: `sidebar`, `header`, `content`, `footer`.
- No methods or custom events.

### `<sk-page-header>`

- Named slots: `eyebrow`, `title`, `supporting`, `sync`, `actions`.
- The consumer supplies semantic title markup and all copy. The element does not invent heading
  levels, dates, relative ages, sync status or actions.
- The metadata/action group reflows without clipping the title or making actions unreachable.
- Public parts: `header`, `text`, `eyebrow`, `title`, `supporting`, `meta`, `sync`, `actions`.
- No public attributes, methods or custom events.

### `<sk-button size="icon">`

- `icon` is one additional documented value of the existing `size` attribute. It composes with the
  existing tone and `href` axes; it is not a new element or a new variant/tone.
- The real inner button or anchor has a stable 40px by 40px hit target and a visible focus-visible
  treatment in both themes.
- A non-empty `label` is mandatory when `size="icon"` and is forwarded verbatim to the real inner
  control as its accessible name. Missing label is diagnosed on the forgiving render path and is
  rejected by the build-time static authoring path; valid icons remain renderable.
- Programmatic focus on the host reaches the real interactive node. Existing text buttons, real
  `<button>`/`<a href>` branching, disabled semantics and generated wrapper behavior remain intact.
- The slotted glyph is consumer-owned. The element contains no icon catalogue, SVG path, route or
  action meaning and emits no new custom event.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compose the approved desktop frame (Priority: P1)

A product team composes personal navigation, context navigation, page header and page content into
the approved three-column frame without application CSS reaching through a shadow root.

**Why this priority:** The shell geometry is the dependency that lets parallel Team Kitty feature
work compose the rest of the overview.

**Independent Test:** Render all four elements at 1280px and 1440px with generic fixture content;
measure the 56px and 240px columns, landmark names and content bounds.

**Acceptance Scenarios:**

1. **Given** all shell slots are supplied at 1440px, **when** the page renders, **then** the first
   two columns measure 56px and 240px and the remaining column contains the page header and main
   content without horizontal clipping.
2. **Given** the same composition at 1280px, **then** geometry and reading order remain stable and
   the content column can shrink below its descendants' intrinsic width.
3. **Given** external styles targeting each declared part, **then** every part is present and
   targetable without relying on an internal BEM class.

---

### User Story 2 - Keep personal and context navigation semantically separate (Priority: P1)

A keyboard or assistive-technology user encounters one application navigation region and one named
context region. The account identity appears once, at the bottom of the personal rail above logout.

**Why this priority:** Duplicate identity and mixed navigation ownership were explicit design-review
defects; semantic separation is more important than decorative fidelity.

**Independent Test:** Compose the approved rail fixture with native links/buttons in all four rail
slots and a labelled context sidebar; inspect landmark names, tab order, DOM content and event flow.

**Acceptance Scenarios:**

1. **Given** primary app controls, utilities, one account anchor and logout, **when** the rail
   renders, **then** the account anchor appears only in the `account` group, above `logout`, below
   the divider, and no identity content is duplicated into `primary` by the component.
2. **Given** native links and buttons in either navigation surface, **when** they are activated,
   **then** their native semantics and event count are unchanged and the shell elements emit no
   application action event.
3. **Given** a long team or repository label, **when** available width is exhausted, **then** it
   truncates visually while its full text remains available to the accessibility tree.

---

### User Story 3 - Read page context and supplied freshness copy (Priority: P1)

An operator reads the current page title, supporting copy and sync metadata while actions remain
reachable. Team Kitty can update the supplied copy on its own schedule.

**Why this priority:** The header is the page-level orientation surface, while freshness ownership
must remain in the application.

**Independent Test:** Render all five slots with a long title, a verbatim sync label and actions;
repeat at desktop and narrow widths and prove the component performs no time work.

**Acceptance Scenarios:**

1. **Given** `Last synced 1 min ago` in the `sync` slot, **when** time passes without a consumer
   update, **then** the text remains byte-for-byte unchanged.
2. **Given** a long title and multiple actions, **when** the header narrows, **then** content reflows
   in document order without overlap, clipping or an inaccessible action.
3. **Given** a consumer-supplied heading element in `title`, **then** the component preserves that
   heading's level and does not add a competing heading.

---

### User Story 4 - Use a named icon-only rail control (Priority: P1)

A consumer uses the existing button element for an icon-only application action or destination and
supplies both the glyph and its accessible name.

**Why this priority:** Rail controls must fit the 56px column without creating a second button
implementation, and the currently landed element cannot forward an icon-only accessible name.

**Independent Test:** Render button and link branches with `size="icon"`, distinct labels and
consumer glyphs; inspect 40px geometry, accessible names, focus delegation, keyboard focus styling
and unchanged native activation.

**Acceptance Scenarios:**

1. **Given** `size="icon" label="Notifications"`, **when** the button is inspected, **then** its real
   inner control measures 40px square and has the accessible name `Notifications`.
2. **Given** the same contract with `href`, **then** the real inner element remains a link, not a
   button, and retains the forwarded accessible name.
3. **Given** the host receives programmatic focus or the user tabs to the control, **then** focus
   reaches the real control and a visible focus indicator is present in dark and light themes.
4. **Given** `size="icon"` without a non-empty label, **then** the invalid authoring contract is
   diagnosable and no conformance story presents it as accessible.
5. **Given** a non-empty label containing deliberate leading or trailing whitespace, **then** the
   real control's `aria-label` attribute is byte-for-byte the supplied string while its computed
   accessible name follows the platform whitespace-normalization algorithm.

---

### User Story 5 - Reflow without taking application state (Priority: P1)

A narrow-screen user can reach navigation, the page header and main content without the design
library choosing what is open or selected.

**Why this priority:** A responsive component that hides a region without a controlled application
contract would make navigation inaccessible and violate epic ownership.

**Independent Test:** Render the full composition at 390px and 414px, with every region present and
with one consumer-hidden region; verify bounds, order, focus access and absence of internal open or
selected state.

**Acceptance Scenarios:**

1. **Given** all regions are present at 390px, **then** they reflow into a usable reading order and
   the viewport has no page-level horizontal overflow.
2. **Given** Team Kitty applies controlled visibility to one slotted navigation host, **then** the
   shell respects that state without storing, toggling or contradicting it.
3. **Given** any active or selected styling on a slotted control, **then** that value belongs to the
   control/consumer and is neither inferred nor mutated by a shell element.

### Edge Cases

- Any slot may be empty; no Team Kitty copy, avatar, icon, route or placeholder is invented.
- Long unbroken labels are clipped/truncated visually rather than expanding the fixed desktop
  columns, but the underlying accessible text is unchanged.
- Multiple slotted controls preserve DOM order and their own tab order.
- The page header accepts no title without inventing one and accepts sync text without starting a
  timer.
- An icon-size button may be a button or link; `disabled` remains meaningful only on the button
  branch, exactly as in #79.
- Unknown existing button tone/size values retain the established forgiving-render / strict-static
  authoring policy.
- Reduced-motion users lose no information or interaction; responsive changes require no animation.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Shell composition | `sk-app-shell` MUST expose `personal-rail`, `context-sidebar`, `page-header` and default main-content slots in that reading order. | High | Open |
| FR-002 | Desktop geometry | The shell MUST render 56px and 240px navigation columns at 1280px and 1440px, with a `minmax(0, 1fr)`-equivalent content outcome. | High | Open |
| FR-003 | Responsive reachability | At narrow widths the shell MUST keep supplied regions reachable and MUST NOT hide or open navigation on its own. | High | Open |
| FR-004 | Rail groups | `sk-personal-rail` MUST expose `primary`, `utilities`, `account` and `logout` slots, with the account group above logout and separated from app/team controls by a divider. | High | Open |
| FR-005 | Single identity location | The component MUST NOT synthesize or duplicate identity content; approved compositions place it only in `account`, never `primary`. | High | Open |
| FR-006 | Rail landmark | `sk-personal-rail` MUST expose a consumer-overridable reflected `label` that names its navigation landmark. | High | Open |
| FR-007 | Context region | `sk-context-sidebar` MUST expose `header`, default content and `footer` slots inside a complementary region named by a reflected `label`. | High | Open |
| FR-008 | Label preservation | Width constraints MAY visually truncate direct slotted labels but MUST preserve the complete supplied text and accessible name. | High | Open |
| FR-009 | Header slots | `sk-page-header` MUST expose `eyebrow`, `title`, `supporting`, `sync` and `actions` slots and preserve consumer-supplied semantic markup. | High | Open |
| FR-010 | Verbatim sync copy | `sk-page-header` MUST render sync content verbatim and MUST perform no clock, polling or freshness calculation. | High | Open |
| FR-011 | Public styling API | Each new element MUST expose exactly its documented public parts; every part MUST be present and targetable from outside its open shadow root. | High | Open |
| FR-012 | Button icon size | Existing `sk-button` MUST accept additive `size="icon"` on both button and link branches, producing a 40px square real control. | High | Open |
| FR-013 | Icon accessible name | `label` MUST reach the real inner control as its accessible name and MUST be non-empty whenever `size="icon"` is authored. | High | Open |
| FR-014 | Focus contract | Programmatic host focus MUST reach the real `sk-button` control and keyboard focus MUST remain visibly indicated in both themes. | High | Open |
| FR-015 | Native action preservation | New shell elements MUST add no action handlers or custom events and MUST leave slotted native/child event semantics intact. | High | Open |
| FR-016 | Consumer-owned glyph | `sk-button` MUST accept consumer slotted glyph content and MUST NOT bundle or select an icon. | High | Open |
| FR-017 | Existing button compatibility | Text content, tone, small size, link/button branching and disabled behavior from #79 MUST remain unchanged. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Accessibility | Every added/changed story MUST report zero axe WCAG 2.1 AA violations; empty/broken story renders are failures. | Accessibility | High | Open |
| NFR-002 | Keyboard access | Every supplied interactive control in the approved desktop and 390px fixtures MUST remain reachable in DOM order with a visible focus indicator. | Accessibility | High | Open |
| NFR-003 | Responsive bounds | At 390px, 414px, 1280px and 1440px fixtures MUST have no page-level horizontal overflow or clipped main content. | Responsive | High | Open |
| NFR-004 | Theme coverage | Every new element and the icon-size button MUST have dark-default and `LightMode` stories whose resolved page surfaces differ. | Visual | High | Open |
| NFR-005 | Visual fidelity | Desktop fixtures MUST preserve the approved 56px/240px geometry, bottom rail grouping and page-header alignment; CI-authoritative visual diffs require maintainer approval. | Visual | High | Open |
| NFR-006 | Generated determinism | Stable generated outputs—CSS modules, static markup where applicable, manifest, React wrappers, Vue declarations and `SIZES.md`—MUST regenerate byte-identically after commit. The timestamped token catalogue MUST be generated and committed once for each changed token-source state; an exact read-only comparator MUST reconstruct its token/category set from `tokens.css` and compare every catalogue field except `generated_at`. | Reliability | High | Open |
| NFR-007 | Mutation quality | Every new registered ADR-11 subject/arm MUST fail only its named test under its declared mutation and all mutation/harness guards MUST pass. | Test quality | High | Open |
| NFR-008 | Full gate | After the planning target is refreshed onto the latest train and lanes are consolidated in SK-179 order, the exact final PR head MUST pass all repository static, type, build, behavior, mutation, Storybook, axe, visual and CI-equivalent gates without a later rebase. | Release readiness | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Mission boundary | Authored component scope is only `app-shell`, `personal-rail`, `context-sidebar`, `page-header` and the narrow existing `button` icon-size/accessibility extension, plus required tests, docs, ratchets and generated artifacts. | Scope | High | Open |
| C-002 | Presentational ownership | No element may fetch, route, import Team Kitty code, inspect the current user/team, calculate domain values, call a clock, or own active/selected/open application state. | Architecture | High | Open |
| C-003 | No duplicate primitive | No `sk-icon-button`, dashboard/page element, second navigation control, icon catalogue or Team Kitty-specific event vocabulary may be introduced. | Scope | High | Open |
| C-004 | Token authority | All component CSS design values MUST use existing or deliberately added `--sk-*` tokens; token additions require both theme values, catalogue regeneration and maintainer sign-off. | Design system | High | Open |
| C-005 | Shadow boundary | Component CSS MUST not depend on `:root`, `html`, `body`, `:host-context()` or a consumer ancestor selector; internal classes follow the tag-name family and public styling uses tokens/parts. | Architecture | High | Open |
| C-006 | Canonical artifacts | CSS is authored only in `packages/styles`; React/Vue/CEM/CSS modules/size output are generated, never hand-edited. Markup is authored once, and no static form is required for a purely slot-composed shell element unless implementation demonstrates a meaningful static contract. | Architecture | High | Open |
| C-007 | Serial shared artifacts | All work packages form one dependency-ordered serial chain even when Spec Kitty materializes a lane per WP. Shared manifest, wrapper, ratchet, size and barrel artifacts have one final integration owner. | Delivery | High | Open |
| C-008 | Train target and issue resolution | The only PR target is `train/elements-first`, with `Refs #145`. WP workers MUST NOT close issues. Immediately after verifying the explicitly authorized PR merged into the train, mission/orchestrator wrap-up MUST close #145 and #153 as completed with merged PR/commit evidence and MUST NOT change #112, #125, #144, #146, #147, #148, #150, #154, or another parent/sibling/follow-up issue; any separately completed state is preserved and recorded as external. Never merge or push to `main`; never publish or deploy. | Delivery | High | Open |
| C-009 | Final rebase | Do not rewrite an execution lane after work starts. After all WPs are approved but before consolidation, refresh/rebase the clean planning target onto the latest train while lanes remain frozen, then run canonical `spec-kitty merge`. Commit any required shared regeneration and run every final gate with no further rebase. If train moves again, stop and explicitly rebaseline instead of blindly rebasing an exact-SHA candidate. | Delivery | High | Open |
| C-010 | Review gate | Tier B requires an independent three-lens post-tasks PASS before implementation and an exact-SHA independent squad plus maintainer approval before merge. The author cannot approve their own artifacts. | Governance | High | Open |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001:** At 1280px and 1440px, the approved composition measures 56px for the personal rail,
  240px for the context sidebar and a non-clipping remaining content column.
- **SC-002:** At 390px and 414px, the full fixture has no page-level horizontal overflow; every
  supplied region and interactive control remains reachable in document order.
- **SC-003:** The approved personal-rail fixture contains exactly one account/identity anchor, in
  the bottom `account` group above `logout`, and zero identity anchors in `primary`.
- **SC-004:** All documented slots receive their intended assigned content; empty slots invent no
  product content, and shell elements attach zero application-action listeners.
- **SC-005:** Long context labels truncate visually while accessibility inspection returns the full
  supplied text/name.
- **SC-006:** `sk-page-header` leaves supplied sync text unchanged across a controlled elapsed-time
  probe and performs zero clock/timer calls.
- **SC-007:** Button and link branches using `size="icon"` both measure 40px square, preserve the
  exact supplied non-empty string in the real control's `aria-label`, and expose its platform-
  normalized accessible name; a whitespace-bearing value proves no application trim occurred.
- **SC-008:** Calling `focus()` on `sk-button` places focus on its real inner control, and both dark
  and light fixtures show a non-zero focus-visible outline or equivalent token-driven indicator.
- **SC-009:** Every declared part for the four new elements is present and targetable; every element
  adopts its generated stylesheet by identity and injects zero `<style>` elements.
- **SC-010:** Existing #79 button branch, tone, `sm`, disabled and static-authoring tests remain
  green; generated React and Vue surfaces expose the additive `icon` size and `label` without hand edits.
- **SC-011:** All 15 new registered mutation arms are killed by their named tests with no collateral
  failures, and the complete mutation suite and self-tests pass.
- **SC-012:** The exact post-consolidation PR head passes repository generators/checks, build,
  typecheck, behavior tests, Storybook build, axe with zero violations, CI-authoritative visual
  review, commitlint, the Tier-B squad and maintainer review. No rebase occurs after that candidate
  is created; later train movement triggers an explicit stop/rebaseline decision. After the
  authorized merge is verified on `train/elements-first`, mission/orchestrator wrap-up closes #145
  and #153 with merged PR/commit evidence while leaving all unrelated issue states unchanged.

## Explicit non-goals

- Team selection, route selection, navigation destinations, drawer/open state, responsive toggles,
  current-user lookup, logout behavior, store/fetch/polling/timer logic.
- Team Kitty icons, avatars, initials generation, repository trees, lists, cards, metrics, charts,
  action rows or the public `sk-team-overview` page component prohibited by epic #144.
- Any wrapper-generator redesign, React `tabIndex` policy from #154, button form participation, or
  unrelated #79 follow-up beyond what the icon-size accessible-name/focus contract requires.
- Any WP-owned issue closure, any closure before the authorized train merge is verified, or any
  mission-owned closure other than #145 and #153.
- Merge to `main`, package publication, release tagging, deployment or Storybook publishing.
