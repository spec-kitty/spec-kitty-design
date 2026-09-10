# Mission Specification: `.sk-button` busy axis

**Mission Branch**: `mission/button-busy-axis`
**Created**: 2026-09-10
**Status**: Draft
**Issue**: [#305](https://github.com/spec-kitty/spec-kitty-design/issues/305) `[TKT5] .sk-button busy axis — supplied activity state without owning the request` · part of [#300](https://github.com/spec-kitty/spec-kitty-design/issues/300) (epic), Gap G4 · tracks #125
**Base**: `train/elements-first@4d4031f`
**Input**: GitHub issue #305, squad tier C (pre-merge only)

## Context

Two Family 4 "Teams and membership" screens reimplement the same busy button from scratch: T2
(create collaborative team, saving state) with a local `.saving-spinner`, and T4 (invitation
management, Send Invitation) with a local `.sending-spinner`. Each re-derives the disabled
treatment, the spinner geometry, the label swap, the reduced-motion fallback and the status
messaging — and both, per the epic's evidence, shipped without the layout-stability guarantee this
mission now makes a tested requirement.

`packages/styles/src/button/sk-button.css` today has `--primary`, `--secondary`, `--ghost`, `--sm`,
`--icon`, a `:focus-visible` ring and a `:disabled, [disabled]` block — and no busy contract at all.
This mission adds one: a purely presentational activity axis. The button shows that something is in
flight; it never decides that anything is.

## Static-form freeze — ADR-15 read directly, not from a stale issue assumption

The original issue text says "do not freeze the static shape before #301 rules." That has been
superseded. #301 merged into `train/elements-first` as PR #312 (`5061e68`) and its ruling
(ADR-15, `docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`) splits
by construct kind rather than gating everything on itself. Measured directly against
`packages/styles/src/button/sk-button.css` at this mission's base: its only `:host` rule is
`display: inline-flex` — no `container-type`, no `::slotted()`, no `@container`. ADR-15's wrapper
rulings apply only to a `:host`-owned `container-type` or a host-attribute axis gated inside one;
neither exists in this sheet. **The busy axis is an ordinary root-class modifier
(`.sk-button--busy`) and was never actually gated by ADR-15.** This mission freezes its static form
now, unconditionally, per the operator comment on #305 confirming this reading. FR-002 below is
therefore not blocked on #309/#310/#311/#314.

## Cross-Mission Decision: TKT5/TKT6 Activity Cue — consumed, not relitigated

#306 started first (no `button-busy-axis` mission existed yet on this train head at the time) and
recorded the joint ruling both issues require. The canonical record is the "Cross-Mission Decision: TKT5/TKT6 Activity Cue" section of
`kitty-specs/progress-indeterminate-01M25C78/spec.md`, committed on `mission/progress-indeterminate`
in the `306` mission's own checkout (`/home/jeroennouws/dev/spec-kitty-design-missions/306`) — not a
resolvable relative path from this checkout, since each mission's `spec-kitty` scaffold lives in its
own per-issue checkout. This spec cites it rather than restating it, per that record's own
instruction.

**Ruling: two independently-authored activity cues. No shared primitive.** The forcing constraints
— opposite accessibility postures (#306's cue must *be* an exposed, unlabelled-by-ARIA progress
widget; this mission's button must expose exactly one accessible name with no competing widget
inside it), incompatible composition (the progress family has no shadow root at all; `sk-button` is
a shadow-DOM element), incompatible shape (a full-width track vs. a compact in-button glyph that
must work at `--sm` and `--icon` with zero layout shift), and #306's dominant risk being
native-`<progress>`-specific and irrelevant to a non-natively-rendered cue — are recorded in full in
that section and are not re-argued here.

**What this binds in this mission:**

- This mission's busy cue is authored independently, scoped to `sk-button` alone.
- It must not reuse `sk-progress__bar`, any `<progress>`-based element, or any DOM primitive shared
  with the progress family.
- It must not become a general-purpose spinner component (C-005), per this issue's own non-goals
  list and per the ruling's own reinforcement of that default.
- It is presentational only — not independently exposed to assistive technology as a second
  accessible-tree object (FR-011).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — a consumer marks a button busy while a request is in flight, and the platform accessible name never changes (Priority: P1)

A consumer's own request-handling code sets the `busy` attribute on an `sk-button` (or its static
`.sk-button--busy` class on a server-rendered form) when a submit action starts, and clears it when
the action settles. The button visibly shows activity for every tone and size the library ships,
including the icon-only size, while the accessible name the consumer supplied continues to be
reported unchanged.

**Why this priority**: this is the issue's own outcome statement — a busy axis "for every tone and
size, including `--sm` and `--icon`" that never swaps, appends, or defaults any text.

**Independent Test**: render each tone (`primary`/`secondary`/`ghost`/unstyled base) at each size
(default/`--sm`/`--icon`) with `busy` set, and assert (a) a visible activity cue is present and (b)
the accessible name equals the consumer-supplied `label`/slot text, unchanged from the same
fixture's idle rendering.

**Acceptance Scenarios**:

1. **Given** an `sk-button` with `variant="primary"` and text content "Save changes", **When**
   `busy` is set, **Then** the button renders a visible activity cue and its accessible name remains
   "Save changes".
2. **Given** an `sk-button` with `size="icon"` and `label="Send invitation"`, **When** `busy` is
   set, **Then** the accessible name remains exactly "Send invitation" and the visible cue does not
   obscure or replace it in the accessibility tree.
3. **Given** the static markup module's `buttonStaticHtml({ busy: true, variant: 'secondary' })`,
   **When** the generated HTML is inspected, **Then** it carries `.sk-button--busy` and renders
   correctly against the same generated stylesheet the shadow form adopts.

---

### User Story 2 — a consumer's own double-submit prevention keeps working, whichever disabling mechanism it uses (Priority: P1)

A consumer combines `busy` with either the native `disabled` attribute or a focusable
`aria-disabled="true"` — its own choice, made for its own reasons (Team Kitty SaaS issue #1520,
double-submit prevention, is the concrete, out-of-repo consumer this protects). The button styles
correctly under either, and the component itself never sets, clears, or reads either attribute as
part of the busy axis.

**Why this priority**: the issue calls this "load-bearing" — SaaS #1520 must keep working unchanged
through this mission, in a different repository this mission cannot see or modify.

**Independent Test**: assert the busy cue's presence and appearance depend only on the
`busy`/`.sk-button--busy` selector, never on `:disabled`, `[disabled]`, or `[aria-disabled]`; then
assert each disabling mechanism's own platform behaviour (tab order, focusability) is unaffected by
`busy` being present.

**Acceptance Scenarios**:

1. **Given** an `sk-button` with `busy` and native `disabled` both set, **When** rendered, **Then**
   the existing `:disabled, [disabled]` opacity/cursor treatment applies exactly as it does today
   without `busy`, the activity cue is still visible, and the control is excluded from the tab
   order (platform default, unmodified by this mission).
2. **Given** an `sk-button` with `busy` and `aria-disabled="true"` both set (no native `disabled`),
   **When** rendered, **Then** the button is not dimmed by any CSS this mission adds on account of
   `aria-disabled` alone, the activity cue is still visible, and the control remains focusable and
   in the tab order.
3. **Given** the component's CSS source, **When** it is inspected, **Then** no selector in the busy
   rule set references `:disabled`, `[disabled]`, or `[aria-disabled]`, and no script this mission
   adds reads, sets, or clears either attribute.

---

### User Story 3 — a button entering or leaving the busy state never shifts its own box or its neighbours (Priority: P1)

A consumer toggles `busy` on and back off around a request. The button's own rendered width and
height do not change at any point in that cycle, and neighbouring elements in the same layout do
not move.

**Why this priority**: the issue states this is "measured in a test, not asserted in a comment" and
names it as "the concrete defect in both hand-authored versions" (T2's `.saving-spinner`, T4's
`.sending-spinner`). The squad's own recent finding on #308 — a two-state feature whose CLOSED state
was never asserted, because every test exercised the OPEN state — is the direct precedent this
mission must not repeat for its own idle/not-busy state.

**Why this priority (test shape)**: the test asserts geometry at three points, not two — idle,
busy, and idle again after the cycle — so a change that only breaks the return-to-idle transition
cannot pass by coincidence of only ever measuring entry.

**Independent Test**: for every tone × size combination, plus long-label and short-label fixtures,
measure `getBoundingClientRect()` width and height with `busy` absent, then present, then removed
again, and assert all three measurements are pixel-identical. Separately, measure a sibling
element's position before and after the cycle to assert no reflow escaped the button's own box.

**Acceptance Scenarios**:

1. **Given** an `sk-button` at each shipped tone and size, **When** `busy` is toggled on, **Then**
   the button's own `getBoundingClientRect()` width and height are unchanged from the immediately
   prior idle measurement.
2. **Given** the same button with `busy` now toggled back off, **When** measured again, **Then**
   width and height equal both the pre-busy and the busy measurements — the NOT-busy state is
   asserted explicitly, not inferred from the busy assertion holding.
3. **Given** a button placed in a flex row with a sibling element, **When** `busy` is toggled on and
   off, **Then** the sibling's own `getBoundingClientRect()` position is unchanged at every point in
   the cycle.
4. **Given** a `size="icon"` button (fixed box today via `--sk-button--icon`'s own `width`/`height`),
   **When** `busy` is toggled, **Then** the same zero-shift guarantee holds — the fixed-size variant
   is not assumed safe by construction and is measured like every other size.

---

### User Story 4 — the cue stays perceivable when motion is reduced or colors are forced, and owns no announcement (Priority: P1)

A motion-sensitive user has `prefers-reduced-motion: reduce` set; a Windows High Contrast user views
the page with `forced-colors: active`. In both cases the busy cue remains visible and detectable.
Separately, no screen-reader user hears an automated status announcement from the button itself —
that remains the consumer's responsibility, through its own live region (`sk-notice`, #178).

**Why this priority**: the issue states the cue "stops animating and stays visible and detectable;
it does not disappear" under reduced motion, stays visible under forced colors, and that "the
button owns no announcement" — these are binding accessibility contracts, not cosmetic preferences.

**Independent Test**: emulate `prefers-reduced-motion: reduce` over a busy fixture and assert the
authored animation is stopped while the cue's frozen frame remains visible and distinguishable from
the idle (no-cue) state; emulate `forced-colors: active` and assert the cue remains distinguishable
from the button and the page; inspect the shadow tree for the absence of any live region, `role`,
or `aria-live` attribute this mission's busy markup would introduce.

**Acceptance Scenarios**:

1. **Given** a busy fixture, **When** `prefers-reduced-motion: reduce` is emulated, **Then** the
   authored `@keyframes`/transition driving the cue is measurably stopped, and the cue itself is
   still present and visually distinguishable from the same fixture's idle rendering.
2. **Given** the same fixture, **When** `forced-colors: active` is emulated, **Then** the cue
   remains visually distinguishable from the button surface and the page background.
3. **Given** any busy fixture's shadow tree, **When** inspected, **Then** it contains no
   `role="status"`, no `aria-live`, and no live-region element introduced by this mission's busy
   markup.
4. **Given** axe-core run against every busy story this mission adds, **Then** it reports zero WCAG
   2.1 AA violations, in both the default (dark) and required `LightMode` presentations.

---

### Edge Cases

- **Busy combined with the anchor (`href`) render branch.** `sk-button` renders an `<a>` when
  `href` is set. The busy axis applies identically to both branches (same class list, same cue),
  since a consumer may show activity ahead of a client-side action that precedes navigation; no
  acceptance criterion excludes the anchor branch and this mission does not invent one.
- **Icon-only busy button with no visible text at all.** The accessible name comes solely from
  `label`; a busy icon button with an invalid/empty `label` keeps the element's own existing
  warn-and-degrade behaviour for that case (unchanged by this mission) rather than gaining a new
  failure mode from the busy axis.
- **`busy` toggled with no disabling attribute present at all.** A consumer may show activity
  without disabling the control by either mechanism (e.g. a non-blocking background sync). The cue
  renders identically to the busy+disabled and busy+aria-disabled cases; the component does not
  infer or impose a disabling mechanism from `busy` alone (this is the same constraint as User
  Story 2, stated for the zero-disabling-attribute case specifically).
- **The reduced-motion frozen frame must be shown distinguishable from idle, not merely "not
  animating."** A cue whose reduced-motion frame happens to render identically to the idle
  (no-cue) state would technically stop animating while functionally disappearing — the acceptance
  scenario in User Story 4 requires the two to be visually distinguishable, not merely that motion
  stopped.
- **Long and short labels at each size.** The layout-stability guarantee (User Story 3) is tested
  against both a long label (near the component's existing wrapping/overflow behaviour, unchanged
  by this mission) and a short or empty (icon) label, so the reserved-space technique is proven
  content-independent.

## Decision: no component-scoped #286 no-literal test for this mission

**Decision: not needed.** `sk-button`'s `render()` today emits zero user-visible literal text nodes
— it is fully slot/attribute-driven (`<slot></slot>` plus an `aria-label` forwarded unchanged from
the consumer's `label` property). This mission's diff to `render()` (i) widens the class-list
computation to include a busy modifier and (ii) adds a decorative activity cue that carries no
text content of any kind (no default label, no fallback status word, no `content:` string on any
pseudo-element). Neither change opens a code path capable of emitting a literal.

This mirrors #302's reasoning for the identical question on `sk-pill-tag` (`render()` widened to
read a third property, no text node added or made conditional — "there is no code path in this
mission's diff that could introduce a literal, so a dedicated regression test would assert an
invariant the diff cannot violate") rather than #308's (`sk-confirm-dialog` is a brand-new element
whose entire contract is four new consumer-supplied copy fields — title, body, confirm label,
cancel label — where copy risk is inherent to the work itself). This mission adds no new
copy-bearing property or slot; the cue is exactly as text-free as the base button already is. FR-017
and C-009 record this decision and its scope boundary against #286.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | `busy` reflected attribute and root-class modifier, every tone and size | As a consumer, I want a `busy` boolean attribute on `sk-button` that applies a `.sk-button--busy` root-class modifier working correctly for every tone (`primary`/`secondary`/`ghost`/unstyled base) and size (default/`--sm`/`--icon`), so that I can show activity on any button the library ships. | High | Open |
| FR-002 | Static form frozen now, via the markup module | As a maintainer, I want `sk-button.markup.ts`'s `buttonClasses`/`buttonStaticHtml`/`ButtonStaticOptions` to accept a `busy` option producing the identical `.sk-button--busy` class as the shadow form, so that the two consumption paths share one CSS source with nothing written twice, per ADR-15's ruling that this component's static form was never gated. | High | Open |
| FR-003 | Busy styling derives only from the busy selector, never from a disabling attribute | As a maintainer, I want every busy-cue rule keyed on `.sk-button--busy`/`[busy]` alone — never on `:disabled`, `[disabled]`, or `[aria-disabled]` — so that the cue renders identically regardless of which disabling mechanism, if any, the consumer applies. | High | Open |
| FR-004 | Busy composes correctly with native `disabled` | As a consumer using native `disabled` for double-submit prevention, I want a busy+disabled button to keep today's exact `:disabled, [disabled]` opacity/cursor treatment, show the activity cue, and leave the tab order per platform default, so that my existing mechanism keeps working unchanged. | High | Open |
| FR-005 | Busy composes correctly with focusable `aria-disabled` | As a consumer using `aria-disabled="true"` for double-submit prevention, I want a busy+aria-disabled button to show the activity cue without being dimmed by any rule this mission adds, and to remain focusable and in the tab order, so that my existing mechanism keeps working unchanged. | High | Open |
| FR-006 | Zero layout shift, tested at three points per cycle | As a consumer, I want a button's rendered width and height to be identical measured idle, then busy, then idle again, for every tone/size combination and for long and short labels, so that entering or leaving the busy state never moves the button or its neighbours. | High | Open |
| FR-007 | No user-visible literal introduced | As a maintainer tracking open issue #286, I want the busy cue to carry no text content, default label, or fallback status word, so that the consumer's supplied accessible name is the only text associated with the control in either state. | High | Open |
| FR-008 | No announcement ownership | As a maintainer, I want the component to create no live region, set no `role="status"`/`aria-live`, and own no status messaging, so that announcement responsibility stays with the consumer's own `sk-notice` (#178) or equivalent. | High | Open |
| FR-009 | Reduced motion: stopped but visible | As a motion-sensitive user, I want the cue's animation to stop under `prefers-reduced-motion: reduce` while the cue itself remains visible and distinguishable from the idle state, so that stopping motion never reads as the activity disappearing. | High | Open |
| FR-010 | Forced colors: cue stays visible | As a Windows High Contrast user, I want the cue to remain visually distinguishable from the button and the page under `forced-colors: active`, so that activity is perceivable in that mode. | High | Open |
| FR-011 | Single accessible name, no competing widget | As a screen-reader user, I want the busy button to expose exactly one accessible-tree object with the consumer-supplied name, in both idle and busy states, so that no second, unlabelled widget (e.g. a nested `<progress>`) is ever exposed by the cue. | High | Open |
| FR-012 | No shared activity-cue primitive with `sk-progress`/#306 | Per the ratified TKT5/TKT6 cross-mission decision, I want this mission's cue authored independently of the progress family, reusing no `<progress>`-based element or shared DOM primitive, so that the two missions' independently-frozen contracts are not silently coupled. | High | Open |
| FR-013 | Required story matrix | As a maintainer, I want stories for busy at each tone, busy `--sm`, busy `--icon`, busy+native-disabled, busy+aria-disabled, idle for comparison, long label, and short label, plus default dark and the required `LightMode`, so that every state named in the issue has a maintained reference. | High | Open |
| FR-014 | Reduced motion, forced colors, RTL, zoom, and narrow-width coverage | As a maintainer, I want dedicated stories/tests for reduced motion, forced colors, RTL/logical layout, 200% zoom, and narrow width, so that the busy axis is verified under every condition the issue names. | High | Open |
| FR-015 | Axe and visual regression | As a maintainer, I want axe-core to report zero WCAG 2.1 AA violations across every busy story, and CI-authoritative visual-regression baselines to cover the new states, so that accessibility and appearance are both gated. | High | Open |
| FR-016 | Ratchets updated for the real surface added | As a maintainer, I want `expected-docs.json`'s `sk-button` attribute count bumped for the new `busy` attribute (with `total` bumped to match), `expected-stories.json` extended with the new story ids, and `behaviours.json`/`mutations.json` reviewed for any newly-applicable ADR-11 id, so that the ratchets describe the real shipped surface. | High | Open |
| FR-017 | No component-scoped #286 test added, reasoned explicitly | As a maintainer, I want the decision not to add a component-scoped no-literal test for `sk-button` recorded with its reasoning (see Decision section above), following #302's precedent rather than #308's, so that the choice is auditable rather than silent. | Medium | Open |
| FR-018 | SaaS #1520 stays out of scope and keeps working | As a maintainer, I want this mission to take no ownership of request lifecycle, timers, mutation, or double-submit prevention, so that Team Kitty's existing SaaS issue #1520 mechanism (a different repository's concern) continues to function unchanged through this change. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Token-only CSS, including motion | Every colour, spacing, radius, border, duration and easing value the busy axis introduces is an `--sk-*` token (`--sk-motion-*` for duration/easing), or one of the repository's already-recorded forced-colors system-color keywords on a longhand `-color` property. `stylelint`'s `declaration-strict-value` passes with no new exception category. | Maintainability | High | Open |
| NFR-002 | Accessibility gate | axe-core reports zero WCAG 2.1 AA violations across every busy story this mission adds, in both default and `LightMode`. | Accessibility | High | Open |
| NFR-003 | Layout-stability measurement precision | The idle/busy/idle geometry comparison (FR-006) asserts exact pixel equality (no tolerance band) on `getBoundingClientRect()` width and height, run in chromium and firefox locally; the `playwright` CI job is authoritative for webkit, per this repository's already-recorded local WebKit gap (ADR-15). | Testability | High | Open |
| NFR-004 | Reduced-motion guard is real, not vacuous | The `@media (prefers-reduced-motion: reduce)` block this mission adds actually disables a real, authored transitioning/animating declaration this mission introduces — it does not exist as an inert guard over a property nothing sets (the `sk-transition-matrix.css:237` anti-pattern `adding-a-component.md` warns against). | Correctness | High | Open |
| NFR-005 | No new token category without a demonstrated gap | Motion values reuse existing `--sk-motion-*` tokens; colour and spacing values reuse existing surface/foreground/accent/space tokens. Introducing a new token category requires a demonstrated gap and the maintainer sign-off the charter's Branch Strategy requires. | Maintainability | Medium | Open |
| NFR-006 | Bundle-size record stays accurate | `packages/elements/SIZES.md` is regenerated from a real build (never `rm -rf packages/tokens/dist`, which would delete the git-tracked `token-catalogue.json`) and committed reflecting this mission's actual delta. | Maintainability | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| C-001 | One Work Package, one PR | This mission delivers as a single bounded Work Package and a single PR back into `train/elements-first`, per #305's own "Delivery" line. If it genuinely cannot fit, the mission stops and reports rather than splitting. | Process | High | Open |
| C-002 | Component owns neither disabling mechanism | The component never sets, clears, or reads `disabled` or `aria-disabled` as part of the busy axis; both remain entirely consumer-owned. | Technical | High | Open |
| C-003 | No live region, no announcement | No live region, `role="status"`, or `aria-live` attribute is introduced by this mission. | Technical | High | Open |
| C-004 | No shared activity-cue primitive with #306 | Per the ratified TKT5/TKT6 cross-mission decision, no DOM element, CSS class, or component is authored to be shared between `sk-button`'s busy axis and the progress family. | Technical | High | Open |
| C-005 | No general-purpose spinner component | The busy cue is scoped to `sk-button` alone and is not published, structured, or documented as a general-purpose spinner usable by other components. | Technical | High | Open |
| C-006 | No request, timer, mutation, or announcement ownership | No request lifecycle, timer, debounce/throttle, auto-reset, form submission/validation, optimistic UI, toast, or progress computation is added; SaaS #1520 (double-submit prevention) is a different repository's concern and is not touched. | Technical | High | Open |
| C-007 | LightMode wrapper convention | The required `LightMode` story wraps its fixture in `class="sk-light"`, never `data-theme="light"`, per CLAUDE.md §6 and the recorded #93 defect. | Technical | High | Open |
| C-008 | Static form freezes now, per ADR-15 | The static form is an ordinary root-class modifier through the markup module; this mission does not wait on #309/#310/#311/#314, and does not introduce a wrapper element ADR-15 reserves for host-owned `container-type`/host-attribute-axis cases that do not apply to `sk-button`. | Process | High | Open |
| C-009 | No repo-wide #286 gate | This mission does not build a repository-wide "no user-visible literal in `render()`" gate — that is open issue #286's own deliverable. This mission's own `render()` diff is reasoned individually (see Decision section, FR-017) rather than gated by a new script. | Scope | High | Open |
| C-010 | Cross-mission decision is consumed, not relitigated | This mission does not reopen the TKT5/TKT6 pairing question; it implements against the ruling #306 recorded and links to it rather than restating it. | Process | High | Open |

### Key Entities

This mission introduces no domain entity, no request, and no application state. The extended
attribute/class contract every busy fixture instantiates:

| Part | Element | Consumer-supplied | Notes |
|---|---|---|---|
| Root | `button.sk-button.sk-button--<tone>.sk-button--<size>.sk-button--busy` (or `a...` on the `href` branch) | tone, size, `href`, slot/`label` text | `busy` reflects to `.sk-button--busy`; carries neither `disabled` nor `aria-disabled` state ownership |
| Cue | a presentational, non-text pseudo-element or shadow node scoped to `.sk-button--busy` | none | Not independently exposed to assistive technology; reserves its own space; animates via `--sk-motion-*` tokens, stopped-but-visible under reduced motion |
| Slot content | `<slot>` (unchanged) | visible label or glyph | Never hidden, replaced, or defaulted by this mission |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `packages/styles/src/button/sk-button.css` gains a `.sk-button--busy` rule set,
  correct for every tone and size, with a token-driven animation; `sk-button.ts` gains a reflected
  `busy` boolean property; `sk-button.markup.ts` gains a matching `busy` option.
- **SC-002**: For every tone × size combination plus long/short-label fixtures, `getBoundingClientRect()`
  width and height measured idle, busy, and idle-again are pixel-identical across all three
  measurements.
- **SC-003**: A busy+native-`disabled` fixture keeps the existing `:disabled, [disabled]` visual
  treatment, shows the cue, and is excluded from the tab order; a busy+`aria-disabled="true"`
  fixture shows the cue with no forced dimming and remains focusable and tabbable.
- **SC-004**: Every busy fixture's accessible name equals its idle fixture's accessible name,
  including the icon-only size; no second accessible-tree object is exposed.
- **SC-005**: Under `prefers-reduced-motion: reduce`, the cue's animation is measurably stopped and
  the frozen cue remains visually distinguishable from the idle (no-cue) rendering.
- **SC-006**: Under `forced-colors: active`, the cue remains visually distinguishable from the
  button surface and the page background.
- **SC-007**: axe-core reports zero WCAG 2.1 AA violations on every busy story, in default and
  `LightMode`.
- **SC-008**: No live region, `role="status"`, or `aria-live` attribute exists in any busy fixture's
  rendered tree.
- **SC-009**: `git grep` over this mission's diff to `packages/elements/src/button/` and
  `packages/styles/src/button/` shows no reference to `sk-progress`, `<progress>`, or any DOM node
  shared with the `progress-indeterminate` mission's output.
- **SC-010**: `expected-docs.json`'s `sk-button` entry and `total` reflect the new `busy` attribute;
  `expected-stories.json` includes every new story id; `git diff --exit-code` on all generated
  artifacts (`.css.js`/`.css.d.ts`, static HTML, `custom-elements.json`, `packages/react/src/**`,
  `packages/elements/vue.d.ts`, `SIZES.md`) is clean after regeneration.
- **SC-011**: `stylelint`, `htmlhint`, `check-manifest-content.mjs`, `check-no-css-in-source.mjs`,
  `check-adopted-css-boundaries.mjs`, `check-element-css-hygiene.mjs`, `check-part-ratchet.mjs`, and
  `check-story-theme-wrapper.mjs` all pass with no new exception category.
- **SC-012**: The full existing `sk-button` test/story/behaviour suite passes unchanged after this
  mission — verified by running it before and after, confirming no existing assertion's outcome
  changed.

## Out of scope

Request lifecycles; timers, debounce, throttling, or auto-reset; double-submit prevention (SaaS
#1520, a different repository); form submission or validation; optimistic UI; toasts or
announcements; progress computation or percentage display; a general-purpose spinner component (the
ratified cross-mission decision does not call for one); a shared activity-cue primitive with
`sk-progress`/#306; any change to #306's own contract; a repository-wide #286 no-literal gate (see
the Decision section above for why this mission also adds no component-scoped version of one);
route, permission, domain-state, copy, or i18n integration, which stay Team Kitty's per the epic's
application-vs-library boundary.

## Open questions

None block this specification. The two cross-cutting product decisions this mission depends on are
both already resolved: ADR-15 (static form may freeze now, unconditionally) and the ratified
TKT5/TKT6 cross-mission decision (two independent cues, no shared primitive). One item is recorded
as execution risk rather than an unresolved product decision, for `plan.md`/`research.md` to carry
forward: the exact CSS technique that reserves the cue's space with zero layout shift across the
default, `--sm`, and `--icon` sizes is not yet measured against the real built stylesheet — the
direction (a non-flow-participating, token-driven overlay confined to the button's existing padding)
is settled by this spec's acceptance criteria; the specific implementation is a plan-phase decision,
verified against FR-006/SC-002 rather than assumed.
