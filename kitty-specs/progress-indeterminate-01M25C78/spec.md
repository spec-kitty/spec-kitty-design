# Mission Specification: `.sk-progress--indeterminate`

**Mission Branch**: `mission/progress-indeterminate`
**Created**: 2026-09-10
**Status**: Draft
**Issue**: [#306](https://github.com/spec-kitty/spec-kitty-design/issues/306) `[TKT6] .sk-progress--indeterminate — accessible unknown-duration activity over the existing progress family` · part of [#300](https://github.com/spec-kitty/spec-kitty-design/issues/300) (epic), Gap G5 · tracks #125
**Base**: `train/elements-first@5061e68`
**Input**: GitHub issue #306, squad tier C (pre-merge only)

## Context

Family 4's T8 join-link-capture-and-resume screen authors a complete indeterminate activity track
locally — `.busy-cue` and `.busy-track` — with its own animation, its own reduced-motion fallback and
its own forced-colors treatment. It is a well-built control that should not exist in a screen file.

`packages/styles/src/progress/` already exists, shipped by #210 (TKW2): a styles-only `.sk-progress`
family composing a labelled native `<progress>` with consumer-supplied value/max/label/metadata.
#210 named "indeterminate loading" as an explicit non-goal, so the family is determinate-only by
construction today. This mission discharges that non-goal on the same terms #210 set: the same
three-flat-children markup, the same modifier-class mechanism `--compact`/`--narrow` already use.

Representative structure:

```html
<div class="sk-progress sk-progress--indeterminate">
  <label class="sk-progress__label" for="sync-progress">Syncing your changes</label>
  <progress class="sk-progress__bar" id="sync-progress"></progress>
</div>
```

No custom element ships. The indeterminate state is expressed the way HTML already expresses it — a
real `<progress>` with no `value` attribute — and no ARIA is invented to restate what the element
already conveys.

## Cross-Mission Decision: TKT5/TKT6 Activity Cue

**This section is the canonical, citable record of the decision #305 and #306 jointly own. #306
starts first (no `button-busy-axis` mission exists yet on this train head), so this mission records
it. #305 should link to this exact section (`kitty-specs/progress-indeterminate-01M25C78/spec.md#cross-mission-decision-tkt5tkt6-activity-cue`)
rather than restate it.**

**Question.** Both #305 and #306 carry the identical clause: decide whether one activity-cue
primitive can serve both the in-button busy cue (#305) and this standalone indeterminate track
(#306), before either freezes its own contract.

**Ruling: two independently-authored activity cues. No shared primitive.**

**The evidence and constraints that forced it:**

1. **Opposite accessibility postures.** #306's contract requires its cue to *be* a real, exposed
   progress indicator — "the bar is exposed as a progress indicator with no value; the supplied
   label names it," with no invented ARIA. #305's contract requires the button to own no
   announcement and to expose exactly one accessible name across idle and busy states — which only
   holds if the cue itself contributes no second, competing accessible-tree object. A real
   `<progress>` nested inside a `<button>`, even valueless and even with no ARIA added, is a second
   exposed widget. Satisfying both would mean #306 adding `aria-hidden` to a shipped, already-approved
   contract it has no reason of its own to change, or #305 accepting a second exposed widget its own
   issue says it should not need.
2. **Incompatible composition models.** #306's family has no shadow root at all — measured directly:
   `packages/styles/src/progress/sk-progress.css` contains zero occurrences of `:host`, `::slotted`,
   `container-type`, or `::part`, and its own header comment states "this component has no custom
   element." `sk-button` is a shadow-DOM custom element (ADR-15: "`sk-button.css`'s only `:host`
   rule is `display: inline-flex`"). A shared primitive would need to be simultaneously consumable as
   bare light-DOM markup and as shadow-DOM content one element adopts; no such mechanism exists in
   this repository, and inventing one to serve a naming coincidence is new architecture built for no
   measured need.
3. **Incompatible shape and sizing.** #306's track is sized for a labelled row of its own (a
   120px×4px default track, or a container-filling `--narrow` form). #305 must reserve fixed,
   tested, zero-layout-shift space inside a button's own box, including its `--sm` and `--icon`
   variants. Family 4's own hand-authored evidence for #305 (`.saving-spinner`, `.sending-spinner`)
   independently confirms the shape #305 needs is a compact glyph, not a horizontal track — these are
   not two contexts converging on one shape.
4. **The dominant cross-engine risk is native-`<progress>`-specific and must not be imported into
   #305.** #306 names UA-supplied indeterminate-rendering divergence across Chromium, Firefox and
   WebKit as its dominant risk, citing #119 and #136 as this repository's own precedent for
   undiscovered engine-specific defects in adjacent territory. #305's cue, as specified, is not a
   native-rendered element and carries no such risk today. Sharing #306's primitive would import that
   risk into #305 for no corresponding benefit, since the two cues need not look alike.
5. **Both issues already default to this outcome.** #306 lists "a spinner glyph for general use" as
   a non-goal; #305 lists "a general-purpose spinner component (unless the TKT6 pairing decision
   explicitly rules for one, in which case it is delivered where that decision says)" as its own. The
   evidence above does not clear the bar for overriding that default — it argues for it.

**What #306 (this mission) may freeze, as a result:** exactly what its own issue already specifies —
a real, valueless `<progress class="sk-progress__bar">` as its sole activity cue, exposed with no
invented ARIA. This ruling changes nothing about #306's own contract; it confirms #306 proceeds
unmodified and does not wait on or adapt to #305's shape.

**What #305 may and must not freeze, as a result:**

- #305 **must not** attempt to reuse `sk-progress__bar`, any `<progress>`-based element, or any other
  DOM primitive shared with this family as its busy cue.
- #305 **must** author its own cue: presentational (not independently name-exposed to assistive
  technology), sized to reserve fixed space inside its own button box with zero measured layout
  shift, working uniformly whether the consumer applies native `disabled` or a focusable
  `aria-disabled="true"`, remaining visible and non-animating (not hidden) under
  `prefers-reduced-motion: reduce`.
- Per its own non-goals list, #305's cue is **not** a general-purpose spinner component — it is
  scoped to `sk-button` alone, the same way this mission's cue is scoped to the progress family
  alone. Neither mission is authorized to build a shared, general-purpose spinner as a side effect of
  this ruling.

Full rationale, the side-by-side constraint table, and the rejected-alternatives analysis are
recorded in [`research.md`](./research.md), section R-00 — this section restates the ruling itself
verbatim; research.md carries the complete supporting argument and evidence citations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — a consumer expresses unknown-duration activity with the same markup shape as determinate progress (Priority: P1)

A page author whose operation has no known completion fraction — a sync, a pending join-link
resolution, an in-flight request with no percentage to report — writes the same three-part markup
`sk-progress` already uses for determinate completion, adds `sk-progress--indeterminate` to the root,
supplies a label, and omits `value` from the `<progress>` element entirely. They do not compute a
fake percentage, and they do not have to learn a second component or a different markup shape.

**Why this priority**: this is the mission's entire outcome — closing #210's own explicit
"indeterminate loading" non-goal on the terms #210 already established.

**Independent Test**: render each required indeterminate fixture (with a label; without meta; with
non-percentage meta) and confirm each keeps the label + `<progress>` [+ optional `<span>`] structure,
in the same order as the determinate fixtures, with the `sk-progress--indeterminate` modifier as the
only structural difference beyond `value`'s absence.

**Acceptance Scenarios**:

1. **Given** a fixture with `class="sk-progress sk-progress--indeterminate"`, **When** it renders,
   **Then** the `<progress>` element carries no `value` attribute at all — not an empty string, not
   `value="0"`.
2. **Given** the same fixture, **When** its markup is inspected, **Then** the label remains present
   and required, exactly as in every determinate fixture.
3. **Given** an indeterminate fixture with no `sk-progress__meta`, **When** it renders, **Then** this
   is a supported, tested state — no CSS rule or story treats a missing `__meta` as broken.
4. **Given** an indeterminate fixture that does supply `sk-progress__meta` text, **When** the text is
   inspected, **Then** it does not read as a percentage or fraction (no `\d+%` pattern) — there is no
   percentage to state.
5. **Given** a determinate fixture from #210's existing set, **When** it is re-rendered next to the
   new indeterminate fixtures, **Then** its markup, attributes and rendering are unchanged from
   before this mission.

---

### User Story 2 — a screen-reader user perceives an unknown-progress activity indicator, named, with no value claimed (Priority: P1)

A screen-reader user tabs to or reads past the indeterminate track. They hear its role (the
platform's native progress-indicator role) and its accessible name (the associated label text). They
do not hear a numeric value, because none is claimed, and they hear no live-region announcement or
status message the component itself invented.

**Why this priority**: this is #306's explicit accessibility-tree requirement, and the reason a real
`<progress>` with no `value` was chosen over a decorative spinner with invented ARIA in the first
place.

**Independent Test**: query the accessibility tree of an indeterminate fixture and assert its role
and accessible name match the label, that no numeric value is exposed, and that no `aria-*` attribute
of any kind exists anywhere in the fixture's markup.

**Acceptance Scenarios**:

1. **Given** an indeterminate fixture with label text "Syncing your changes", **When** the
   accessibility tree is queried, **Then** the control's role is the platform's native
   progress-indicator role, its accessible name is "Syncing your changes", and no numeric
   value/valuenow is exposed.
2. **Given** any indeterminate fixture, **When** its markup is inspected, **Then** it contains no
   `aria-label`, `aria-labelledby`, `role`, `aria-live`, or `aria-busy` attribute — the native,
   valueless `<progress>` plus the `for`/`id` label pair are the sole mechanism.
3. **Given** axe-core is run against every indeterminate story this mission adds, **Then** it reports
   zero WCAG 2.1 AA violations, in both the default (dark) and required `LightMode` presentations.

---

### User Story 3 — a motion-sensitive user still sees ongoing activity, never a false completion or emptiness claim (Priority: P1)

A user with `prefers-reduced-motion: reduce` set views an indeterminate track. The animation stops,
but the track remains visibly present as an activity indicator — it never resolves to looking either
fully complete or fully empty, either of which would read as a false claim about the operation's
state.

**Why this priority**: #306 states this as a binding, load-bearing constraint — a reduced-motion
fallback that silently claims completion or emptiness is a correctness defect, not a cosmetic one.

**Independent Test**: emulate `prefers-reduced-motion: reduce` over an indeterminate fixture and
assert (a) the authored animation is not running, and (b) the rendered fill/track state at the frozen
frame is neither the fully-empty nor the fully-full determinate visual.

**Acceptance Scenarios**:

1. **Given** an indeterminate fixture, **When** `prefers-reduced-motion: reduce` is emulated,
   **Then** the authored `@keyframes` animation targeting the fill is not running (`animation-name:
   none` or an equivalently inert computed state) on the relevant pseudo-element(s).
2. **Given** the same emulation, **When** the track's rendered state is measured, **Then** it is
   distinguishable from both the Complete determinate fixture's fully-full state and the Zero
   determinate fixture's fully-empty state.
3. **Given** no reduced-motion preference, **When** the same fixture renders, **Then** the authored
   animation runs, token-driven by `--sk-motion-*` custom properties, with no hardcoded duration or
   easing literal.

---

### User Story 4 — the indicator renders consistently on Chromium, Firefox and WebKit (Priority: P1)

A consumer's page is viewed in any of the three target engines. The indeterminate track's structural
contract (three-flat-children order, valueless `<progress>`, no invented ARIA, visible-but-stopped
reduced-motion state, forced-colors distinguishability) holds identically in all three — cross-engine
divergence in a native `<progress>`'s own indeterminate rendering does not leak into an inconsistent
accessibility, structural, or motion-guard contract.

**Why this priority**: #306 names this as "the real risk here" explicitly, and directs this mission
not to repeat #119's browser-matrix hole or assume a two-engine local run satisfies a three-engine
requirement.

**Independent Test**: run the same computed-style/DOM/accessibility-tree assertions from Stories 1-3
against all three Playwright projects declared in `playwright.config.ts` (`chromium`, `firefox`,
`webkit`), executed via the existing, unfiltered `playwright` job in `.github/workflows/ci-quality.yml`
— the only CI job in this repository that actually launches WebKit. Locally, only `chromium` and
`firefox` are run directly (WebKit cannot launch on this workstation); the mission's PR is not
presented as complete until the `playwright` job is green on CI, which is authoritative for the
WebKit leg.

**Acceptance Scenarios**:

1. **Given** the indeterminate test file(s) added under `apps/storybook/src/tests/`, **When** they
   run under the `playwright` CI job with no `--project` filter, **Then** every assertion from
   Stories 1-3 passes identically on `chromium`, `firefox`, and `webkit`.
2. **Given** the same test file(s), **When** run locally with `--project=chromium --project=firefox`
   only, **Then** they pass — this is the maximum local verification this host can perform, and it is
   explicitly not treated as satisfying the three-engine requirement on its own.
3. **Given** the repository's existing `visual-regression` job (chromium-only pixel baselines, by
   already-recorded repository policy), **When** this mission's stories are added, **Then** no
   firefox/webkit pixel baseline is introduced — cross-engine consistency for this mission is proven
   by computed-value/structural assertions in the `playwright` job, not by pixel comparison.

---

### User Story 5 — forced-colors and layout modifiers keep working with the new state (Priority: P2)

A Windows High Contrast user views an indeterminate track; a consumer combines the indeterminate
state with the existing `--compact`/`--narrow` layout modifiers or a long label.

**Why this priority**: #306 requires forced-colors distinguishability, and the existing layout
modifiers must not become mutually exclusive with the new state — #210's own layout modifiers were
designed as orthogonal axes, and indeterminate must join that axis set without breaking it.

**Independent Test**: emulate `forced-colors: active` over an indeterminate fixture and assert the
track and its indicator remain distinguishable from each other and the page, sampled at more than one
point in the animation cycle. Separately, render `--indeterminate` combined with `--narrow` and with
a long label and confirm no horizontal page overflow.

**Acceptance Scenarios**:

1. **Given** an indeterminate fixture, **When** `forced-colors: active` is emulated and sampled at
   two distinct points in the animation cycle (or with the animation paused), **Then** the track's
   boundary and its animated indicator are each still visually distinguishable from the page
   background and from each other at both samples.
2. **Given** `sk-progress--indeterminate` combined with `sk-progress--narrow`, **When** it renders,
   **Then** the same three-flat-children structure holds and the bar fills the container width, as
   the existing `--narrow` rule already does for determinate fixtures.
3. **Given** `sk-progress--indeterminate` combined with a long label, **When** the viewport is
   narrowed, **Then** the document's horizontal scroll width equals its viewport width — the label
   wraps or truncates rather than forcing overflow, matching the existing long-label determinate
   behaviour.

---

### Edge Cases

- **`value` must be structurally absent, not merely falsy or invalid.** No fixture uses `value=""`
  or an out-of-range value to trigger indeterminate rendering; relying on HTML's parse-failure
  fallback behaviour is a more fragile, less directly assertable dependency than the attribute's
  plain omission (research.md R-02).
- **A determinate fixture must never gain the `--indeterminate` class, and vice versa; the two states
  do not transition into each other.** #306 explicitly excludes "a transition from indeterminate to
  determinate" as a non-goal, and this mission adds no JavaScript that could perform one.
- **`sk-progress__meta`'s optional absence must not be conflated with a bug.** The existing
  determinate test suite's assumption that every fixture has a `__meta` with a percentage must be
  scoped so it continues correctly policing determinate fixtures while not misfiring on
  indeterminate ones (research.md R-03; the concrete test-file edit is a plan/tasks-phase item).
  See "Test-file impact" below.
- **An indeterminate fixture's reduced-motion frame must be measured, not assumed.** "The animation
  stops" is not sufficient on its own; the frozen frame must also be shown to be neither the
  determinate family's Complete nor Zero visual, per User Story 3.
- **Forced-colors sampling of an animated fill has no existing single-frame precedent to copy safely
  from.** The existing forced-colors override was proven for a static fill only; this mission's
  forced-colors test samples more than one point in the animation cycle so a coincidentally-correct
  single frame cannot produce a false pass (research.md R-06).
- **WebKit is never verified locally for this mission** — `webkit.launch()` fails on this host, a
  pre-existing, already-recorded gap (ADR-15). The mission's own local verification loop runs
  chromium+firefox only and defers WebKit entirely to the `playwright` CI job, which is authoritative
  for it.

### Test-file impact on the existing determinate suite

`apps/storybook/src/tests/sk-progress.spec.ts`'s `readFixtures`/`parseFixture` helpers and its "every
maintained fixture keeps its visible meta text consistent with its own value/max pair" test currently
iterate every export of the generated barrel generically, asserting `Number.isFinite(value)` and a
`\d+%` meta pattern for each. Adding the first indeterminate fixture to the same barrel breaks that
test's premise. This mission's plan/tasks phase scopes that specific test to the determinate fixtures
only (e.g. by excluding fixture names matching an `Indeterminate` naming convention this mission
establishes), in the same commit that adds the first indeterminate fixture — not as a follow-up fix
to a newly-red build.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | `sk-progress--indeterminate` root-class modifier | As a consumer, I want a `sk-progress--indeterminate` class on the existing `.sk-progress` root, so that I can express unknown-duration activity using the same component and markup shape as determinate completion. | High | Open |
| FR-002 | `value` attribute structurally absent | As a maintainer, I want every indeterminate fixture's `<progress class="sk-progress__bar">` to carry no `value` attribute at all (never an empty string or invalid value relied on for parse-failure behaviour), so that indeterminate rendering is triggered the unambiguous, directly assertable way. | High | Open |
| FR-003 | Three-flat-children order preserved exactly | As a maintainer, I want the indeterminate variant to add no wrapper and reorder no child — label, bar, optional meta, in that order — so that #210's markup contract is preserved exactly, per #306's own binding text. | High | Open |
| FR-004 | Label remains required | As a screen-reader user, I want the label to remain mandatory and programmatically associated via native `for`/`id`, unchanged from the determinate contract, so that the indeterminate track is always named. | High | Open |
| FR-005 | `__meta` becomes optional; no percentage ever asserted | As a consumer, I want to omit `sk-progress__meta` entirely, or supply non-percentage status text, so that I never state a percentage that does not exist. | High | Open |
| FR-006 | No invented ARIA | As a maintainer, I want zero `aria-*`, `role`, `aria-live`, or `aria-busy` attributes anywhere in the indeterminate markup, so that the native, valueless `<progress>` element's own semantics are the sole accessibility mechanism, per #306's binding contract. | High | Open |
| FR-007 | Token-driven, authored motion; not native UA rendering | As a maintainer, I want the indeterminate "activity" visual to be an authored `@keyframes` animation driven by `--sk-motion-*` tokens on the existing vendor pseudo-element surface, not a reliance on each engine's own default indeterminate paint, so that the animation can actually be stopped under reduced motion and its cross-engine appearance is under this library's control. | High | Open |
| FR-008 | Reduced motion: stopped, but visibly present as activity | As a motion-sensitive user, I want the authored animation to stop under `prefers-reduced-motion: reduce` while the track remains visibly present and distinguishable from both the fully-empty and fully-full determinate visuals, so that I am never shown a false completion or emptiness claim. | High | Open |
| FR-009 | Forced-colors distinguishability across the animation cycle | As a Windows High Contrast user, I want the track and its indicator to remain each distinguishable from the page and from each other at more than one point in the animation cycle, so that the existing static-fill forced-colors technique is verified to also hold for an animated fill. | High | Open |
| FR-010 | Layout modifiers compose orthogonally with the new state | As a consumer, I want `sk-progress--indeterminate` to combine cleanly with the existing `sk-progress--compact` and `sk-progress--narrow` modifiers, so that I can place an indeterminate track in any layout arrangement already supported for determinate progress. | High | Open |
| FR-011 | Determinate contract unchanged | As a maintainer, I want every existing determinate fixture, story, and test to render and pass exactly as before this mission, so that #210's shipped contract is not disturbed beyond what #306 authorizes. | High | Open |
| FR-012 | Required indeterminate fixtures | As a consumer, I want authored fixtures for indeterminate-with-label, indeterminate-without-meta, indeterminate-with-meta, plus indeterminate combined with narrow and with a long label, so that every state #306 names has a maintained reference. | High | Open |
| FR-013 | Cross-engine verification via the existing unfiltered `playwright` CI job | As a maintainer, I want this mission's structural/accessibility/motion assertions to run on all three Playwright projects (`chromium`, `firefox`, `webkit`) through the existing, unfiltered `playwright` job, so that #306's three-engine requirement is met without inventing a new CI mechanism and without relying on this host's inability to launch WebKit locally. | High | Open |
| FR-014 | Existing determinate test scoped correctly for the new fixture shape | As a maintainer, I want `sk-progress.spec.ts`'s value/max/percentage-consistency test scoped to determinate fixtures only, in the same commit that adds the first indeterminate fixture, so that the test continues correctly policing determinate fixtures without misfiring on indeterminate ones. | High | Open |
| FR-015 | Default dark theme and required LightMode | As a consumer, I want the indeterminate component's default (dark) presentation and a `LightMode` story wrapped in `class="sk-light"`, both driven by tokens rather than a theme selector in the component CSS, so that light-mode rendering actually differs and is not silently inert. | High | Open |
| FR-016 | No `packages/elements/` surface introduced | As a maintainer, I want this mission to add no custom element, no `packages/elements/src/progress/` directory, no `::part()`, and no manifest/React/Vue wrapper entry, so that the family remains styles-only exactly as #210 established and ADR-15's shadow-DOM rulings continue not to apply. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Token-only CSS, including motion | Every colour, spacing, radius, border, duration and easing value the indeterminate animation introduces is an `--sk-*` token (specifically `--sk-motion-*` for duration/easing), or one of the repository's already-recorded forced-colors system-color keywords on a longhand `-color` property. `stylelint`'s `declaration-strict-value` passes with no new exception category. | Maintainability | High | Open |
| NFR-002 | Accessibility gate | axe-core reports zero WCAG 2.1 AA violations across every indeterminate story this mission adds, in both default and `LightMode` presentations. | Accessibility | High | Open |
| NFR-003 | Three-engine structural/accessibility parity | Every structural, accessibility-tree, and reduced-motion assertion this mission adds passes identically on `chromium`, `firefox`, and `webkit` in the `playwright` CI job — verified on CI, since WebKit cannot run on this workstation. | Testability | High | Open |
| NFR-004 | No horizontal overflow at zoom or narrow width | For the indeterminate long-label and narrow fixtures, the document's horizontal scroll width equals its viewport width at a narrow viewport, matching the existing determinate guarantee. | Accessibility | Medium | Open |
| NFR-005 | Reduced-motion guard is real, not vacuous | The `@media (prefers-reduced-motion: reduce)` block added by this mission actually disables a real, authored transitioning/animating declaration this mission introduces — it does not merely exist as an inert guard over a property nothing sets (the `sk-transition-matrix.css:237` anti-pattern `adding-a-component.md` warns against). | Correctness | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| C-001 | No custom element | No `sk-progress` custom element, no `packages/elements/src/progress/` directory, no `::part()`, no behaviour or mutation registry entry — unchanged from #210, extended to the indeterminate variant. | Technical | High | Open |
| C-002 | No calculation, no state, no timers | No CSS `content`/`counter()`-based arithmetic, no JavaScript of any kind, no application state, and no timer. All label/meta text is consumer-authored. | Technical | High | Open |
| C-003 | No transition between indeterminate and determinate | No mechanism — CSS or otherwise — animates or transitions a fixture between the two states; each fixture is authored as one or the other. | Technical | High | Open |
| C-004 | No shared activity-cue primitive with `sk-button`/#305 | Per this mission's Cross-Mission Decision, no DOM element, CSS class, or component is authored to be shared between this family and `sk-button`'s busy axis. | Technical | High | Open |
| C-005 | No general-purpose spinner component | No spinner glyph intended for use outside the progress family is authored by this mission, per #306's own non-goals list. | Technical | High | Open |
| C-006 | Independent of #301/ADR-15 | This mission has no dependency on #301's ruling or on ADR-15's follow-through missions (#309/#310/#311/#314) — confirmed by measurement (research.md R-01), not assumed. | Process | High | Open |
| C-007 | LightMode wrapper convention | The required `LightMode` story wraps its fixture in `class="sk-light"`, never `data-theme="light"`, per CLAUDE.md §6 and the recorded #93 defect. | Technical | High | Open |
| C-008 | One Work Package, one PR | This mission delivers as a single bounded Work Package and a single PR back into `train/elements-first`, per #306's own "Delivery" line. | Process | High | Open |
| C-009 | No new token category without a demonstrated gap | Motion values reuse existing `--sk-motion-*` tokens; colour values reuse existing surface/foreground/accent tokens. Introducing a new token category requires a demonstrated gap and the maintainer sign-off the charter's Branch Strategy requires. | Technical | Medium | Open |

### Key Entities

This mission introduces no domain entity, no reactive property, no event, and no application state —
see [`data-model.md`](./data-model.md) for the full reasoning. The closest analogue to a data model is
the extended markup and attribute contract every indeterminate fixture instantiates:

| Part | Element | Consumer-supplied | Notes |
|---|---|---|---|
| Root | `div.sk-progress.sk-progress--indeterminate[ sk-progress--<layout-modifier>]` | none | Carries the determinate/indeterminate axis and, orthogonally, the existing layout modifiers; no ARIA role |
| Label | `label.sk-progress__label` | `for="<id>"`, text content | Required, unchanged from the determinate contract |
| Control | `progress.sk-progress__bar` | `id="<id>"` — **no `value`** | Native `<progress>`; valueless renders and exposes as indeterminate per the HTML spec, with no author ARIA |
| Meta | `span.sk-progress__meta` | text content, **optional** | Non-percentage text only; absence is a supported, tested state |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `packages/styles/src/progress/sk-progress.css` gains a `.sk-progress--indeterminate`
  rule set and an authored, token-driven `@keyframes` animation on the existing vendor pseudo-element
  surface; no `packages/elements/` directory or file is added or modified.
- **SC-002**: The generated barrel exports at least the fixtures FR-012 names — indeterminate with
  label, without meta, with (non-percentage) meta, combined with narrow, and combined with a long
  label — each with `<progress>` carrying no `value` attribute.
- **SC-003**: Every indeterminate fixture's accessible name and role are asserted against its own
  `label` text, with zero `aria-*`/`role`/`aria-live`/`aria-busy` attributes present in any fixture's
  markup, and no numeric value exposed.
- **SC-004**: axe-core reports zero WCAG 2.1 AA violations on every indeterminate story this mission
  adds, in both default and `LightMode`.
- **SC-005**: Under `prefers-reduced-motion: reduce` emulation, the authored animation is measurably
  stopped and the frozen frame is measurably distinct from both the Complete and Zero determinate
  visuals.
- **SC-006**: Under `forced-colors: active` emulation sampled at two or more points in the animation
  cycle, the track boundary and its indicator remain each distinguishable from the page background
  and from each other at every sampled point.
- **SC-007**: `sk-progress--indeterminate` combined with `sk-progress--narrow` and with a long label
  each produce no horizontal page overflow at a narrow viewport, matching the existing determinate
  guarantee.
- **SC-008**: All Story 1-5 assertions pass identically on `chromium`, `firefox`, and `webkit` in the
  `playwright` CI job (unfiltered `npx playwright test`); locally, `chromium`+`firefox` pass, and the
  mission's PR is not presented as complete until CI's `playwright` job is green.
- **SC-009**: `apps/storybook/src/tests/sk-progress.spec.ts`'s value/max/percentage-consistency test
  is scoped to determinate fixtures only, in the same commit as the first indeterminate fixture, and
  continues to pass for every existing determinate fixture.
- **SC-010**: Every existing determinate story, fixture, and test passes unchanged after this
  mission — verified by running the full existing `sk-progress.spec.ts` suite before and after,
  confirming no determinate assertion's outcome changed.
- **SC-011**: `stylelint`, `htmlhint`, and the generated-artifact `--check` scripts all pass with no
  new exception beyond the repository's already-recorded forced-colors system-color keywords and
  `--sk-motion-*` token usage.
- **SC-012**: No entry is added to `expected-parts.json`, `expected-docs.json`, `behaviours.json`,
  `mutations.json`, or the ADR-15 follow-through gates (#309/#310) — this component has none of the
  surfaces those ratchets govern.
- **SC-013**: `git grep` over `packages/styles/src/progress/sk-progress.css` shows no new `:host`,
  `::slotted`, `container-type`, or `::part` occurrence — independence from ADR-15 remains true after
  this mission, not only before it.
- **SC-014**: No firefox/webkit visual-regression (pixel) baseline is added by this mission; the
  `visual-regression` CI job remains chromium-only, unchanged.
- **SC-015**: No shared DOM element, CSS class, or component exists between this mission's output and
  any future `sk-button` busy-axis implementation — verified by this mission introducing no such
  shared artifact in the first place.

## Out of scope

A custom `sk-progress` element or any `packages/elements/src/progress/` source. A shared
activity-cue primitive or general-purpose spinner component with `sk-button`/#305 — ruled out by this
mission's own Cross-Mission Decision. Any change to `sk-button` or #305's contract. Timers, delays,
minimum display durations, skeleton/shimmer placeholders, progress computation, estimation, or a
transition from indeterminate to determinate. Live-region announcements or a busy state on any
component other than this progress family. `apps/demo/dashboard-demo.html` or any Team Kitty
application surface. Firefox/webkit visual-regression pixel baselines for this or any other
component. A repository-wide #286 no-literal gate (see `research.md` R-07 for why this mission adds
no component-scoped version of one either, and the narrow CSS-guard addition it adds instead).

## Open questions

None block this specification, and the one cross-mission product decision this mission shares with
#305 is resolved above. Two items are recorded as execution risk rather than unresolved product
decisions, both flagged in `research.md`:

1. The exact cross-engine keyframe technique for the animated indeterminate fill is not yet measured
   against real Chromium/Firefox/WebKit rendering — the direction (authored, token-driven, on the
   existing vendor pseudo-element surface) is settled; the specific shape is an implementation-phase
   measurement (research.md R-05).
2. Forced-colors legibility of an *animated* fill has no exact repository precedent to copy from
   (the existing precedent is for a static fill); this mission's own forced-colors story is where
   that gets measured, sampling more than one animation frame rather than assuming a single-frame
   pattern generalizes (research.md R-06).
