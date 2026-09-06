# Research: Native workflow board and lane styles

**Mission:** `work-package-workflow-board-styles-01M1W0VZ`

**Issue:** [#209](https://github.com/spec-kitty/spec-kitty-design/issues/209) `[TKW1] native
workflow-board and lane styles — semantic Work Package overview layout`, child of
[#208](https://github.com/spec-kitty/spec-kitty-design/issues/208).

**Research date:** 2026-09-06

**Repository revision inspected:** `2d0110ca54b02485e4e53492e6d90623c1d7dbaa`
(`mission/work-package-workflow-board-styles`, based on
`train/elements-first@1f587b78f95601d140210802a46ef6b00286cccf`).

**Audience:** the architect and planner who will turn #209 into an implementation plan and work
packages.

**Decision status:** complete enough for planning; no uncovered product/API/architecture fork was
found. The exact lane minimum-inline-size remains a visual calibration task, not an architecture
decision, and must be expressed through a new authoritative layout token rather than a raw value.

## Question and boundary

The research question is how to replace the dashboard demo's page-local `.dash-board` and
`.dash-lane` presentation with the reusable, token-only families named by #209 while preserving
native structure, containing horizontal overflow, and keeping every application concern with the
consumer.

The in-scope public selectors are exactly these two BEM families:

- `.sk-workflow-board` and `.sk-workflow-board__scroller`;
- `.sk-workflow-lane`, `.sk-workflow-lane__header`, `.sk-workflow-lane__title`,
  `.sk-workflow-lane__count`, and `.sk-workflow-lane__list`.

A layout modifier on one of those blocks/elements may express the issue's single-lane composition,
but no third block, domain-named lane modifier, generated marker, or item/empty-state component is
created here. The consumer owns lane labels, visible count copy, lane order, item markup,
presentation tone, and which lane is active on mobile. This research excludes every non-goal in
#209: custom elements, Kanban/domain state, drag/drop or reordering, transitions, filtering,
virtualization, timers, routing, and implementation belonging to #211, #212, or #214. [E-001,
E-002, E-003]

Evidence is registered in [`research/source-register.csv`](./research/source-register.csv);
individual findings are cross-referenced by `E-*` ids in
[`research/evidence-log.csv`](./research/evidence-log.csv).

## Executive conclusion

Create two deliberately styles-only components, `workflow-board` and `workflow-lane`, under
`packages/styles/src/`. They style consumer-authored light-DOM HTML and add no
`packages/elements/src/` directories, custom-element registrations, manifest entries, React
wrappers, parts/doc ratchets, behaviour subjects, or mutations. ADR-10 already makes this a defined
architectural class: when a component's value is styling native semantics, the design system styles
those semantics instead of re-hosting them behind a custom-element/shadow boundary. #92 and #146
show why the `<ol>`/`<li>` relationship must remain consumer-authored and uninterrupted. [E-004,
E-005, E-006]

The overflowing reference structure is:

```html
<div class="sk-workflow-board">
  <h2 id="work-package-board-title">Work Packages</h2>
  <div
    class="sk-workflow-board__scroller"
    role="region"
    aria-labelledby="work-package-board-title"
    tabindex="0"
  >
    <section class="sk-workflow-lane" aria-labelledby="planned-title">
      <header class="sk-workflow-lane__header">
        <h3 class="sk-workflow-lane__title" id="planned-title">Planned</h3>
        <span class="sk-workflow-lane__count" aria-label="2 Work Packages"
          >2</span
        >
      </header>
      <ol class="sk-workflow-lane__list">
        <li><!-- consumer-owned item composition --></li>
        <li><!-- consumer-owned item composition --></li>
      </ol>
    </section>
  </div>
</div>
```

The `role="region"` / accessible-name / `tabindex="0"` triad is **conditional**. A consumer or
story that measures `scrollWidth > clientWidth` adds all three; a composition that does not
overflow omits all three. CSS cannot add or remove attributes based on layout, and this mission may
not introduce JavaScript to do so. This is the same measured contract already shipped by
`.sk-data-table__scroller`, now required explicitly by #209 for the board. [E-007, E-008]

An empty lane keeps its empty `<ol>` so its native list count remains zero, then renders supplied
empty-state copy as a sibling outside the list. The current `.sk-empty-state` can demonstrate that
state without duplicating it; #212 owns the later `--inline` presentation and #214 owns the final
integrated T10 composition. [E-009, E-010]

## Source authority and conflict resolution

Evidence is applied in this order:

1. Live issue #209 is the binding mission contract: exact selectors, semantic structure,
   conditional overflow semantics, required states/tests, dependencies, and non-goals.
2. Live epic #208 defines the application/library ownership seam and sequences #211/#212 before
   #214 without making them source dependencies of #209.
3. ADR-9/10/11 and the current authoring recipe govern light-DOM versus element architecture,
   token usage, generated artifacts, and verification.
4. #92, #141/merged PR #172, #146, and #176 provide the historical failure and the current
   styles-only/native-semantics pipeline. Current ADR-10 supersedes PR #172 where that PR's original
   prose claimed the duplicated form styles necessarily lived in different trees.
5. Merged #210/PR #222 is the nearest styles-only mission precedent for artifacts and browser
   evidence. Its raw `120px`/`4px` declarations are **not** a token-value precedent because #209 and
   the current recipe both require token-only component CSS.
6. `apps/demo/dashboard-demo.html` is motivating evidence, not a reusable contract. It proves the
   gap but currently uses `<div>` lanes/items, page-local lane vocabulary/tone, and raw design
   values that #209 explicitly rejects.

The linked Stitch T10 project was probed directly but returned only the unauthenticated Stitch
application shell, with no accessible screen payload. Therefore this report uses the T10 intent
transcribed into live #209 and #208, plus the checked-in dashboard demo, and does not claim visual
details absent from those sources. [E-011, E-012]

## Decisions and rationale

### R-01 — Two styles-only source directories; no custom element or behaviour surface

**Decision.** Add `packages/styles/src/workflow-board/` and
`packages/styles/src/workflow-lane/`, each with one authored CSS source and authored HTML fixtures.
Generate each `index.ts` through `scripts/build-styles-only-markup.mjs`; explicitly wire both root
exports and package subpaths. Do not create matching `packages/elements/src/` directories or edit
element/React/behaviour ratchets. [E-004, E-013, E-014]

**Why.** #209 calls these “two token-only styles families over consumer-authored native HTML” and
explicitly excludes a custom element. ADR-10's current class-level ruling says the design system
styles native semantics and does not re-host them. The styles-only generator discovers any
directory with CSS and no matching element directory, but `packages/styles/src/index.ts` and
`packages/styles/package.json` still require one explicit entry per directory. [E-001, E-004,
E-013]

**Consequences.** There are no `::part()` declarations, manifest rows, generated React props,
element CSS modules, `expected-parts.json`/`expected-docs.json` additions, or behaviour/mutation
subjects. Verification lives in generated-barrel checks, styles build/lint, Storybook, axe,
Playwright DOM/accessibility/overflow assertions, and visual baselines. [E-014, E-015]

### R-02 — The lane is a named native `<section>` containing a native heading and `<ol>`

**Decision.** Apply `.sk-workflow-lane` directly to `<section>`. Its
`.sk-workflow-lane__title` is a consumer-chosen native heading (`h2`–`h6` as appropriate to the
page hierarchy) with a unique `id`; the section references it with `aria-labelledby`. Apply
`.sk-workflow-lane__list` directly to `<ol>`, whose work items are direct `<li>` children. The
header and count remain ordinary light-DOM content. [E-002, E-005, E-006]

**Why.** #209 binds “native `<section>` lanes, headings and `<ol>/<li>` item lists” and requires
named lane sections plus native list counts/order. #92 measured the exact failure caused by
interposing a custom-element host between a list and its item. #146 consequently requires
`sk-action-row` consumers to compose rows inside native `<ul>/<li>`; the same uninterrupted-parent
rule applies here. [E-002, E-005, E-006]

**Consequences.** CSS must not change `display` on `<ol>`/`<li>` in a way that removes their
semantics, and no ARIA grid/listbox/forged list roles are added. A browser assertion should inspect
both DOM parentage and the accessibility tree because an attractive visual grid can still have a
broken list. [E-016]

### R-03 — The scroller alone owns horizontal overflow and becomes a region only when useful

**Decision.** `.sk-workflow-board__scroller`, not the page/root document, owns horizontal
overflow. In genuinely overflowing compositions it carries `role="region"`, one consumer-supplied
accessible name (preferably `aria-labelledby` to the visible board heading), and `tabindex="0"` as
an indivisible triad. Non-overflowing and single-lane compositions omit all three attributes. The
root `.sk-workflow-board` remains a presentation/grouping container. [E-007, E-008, E-017]

**Why.** #209 states the condition directly. `.sk-data-table__scroller` supplies measured local
precedent: the triad is necessary when content genuinely scrolls, but becomes a dead tab stop and a
duplicate landmark when it does not. CSS has no mechanism to conditionally mutate semantics based
on `scrollWidth`; the consumer already owns the rendered composition and therefore owns the
measurement/attribute decision. [E-007, E-008]

**Consequences.** The default five-lane story must be constrained so real overflow exists before
the triad is asserted. A non-overflowing control fixture must prove the triad is absent. Browser
tests must focus the overflowing scroller, move it with horizontal keyboard input, and prove
`document.scrollingElement.scrollWidth` does not exceed the viewport. A visible
`:focus-visible` outline is required; ordinary outline/border geometry survives forced colors
without opting out of the user's palette. [E-008, E-018]

### R-04 — Labels, counts, lane order, and item order are supplied and internally consistent

**Decision.** The consumer supplies every visible lane title and count, section/title IDs, the
sequence of lane sections, and each ordered list's `<li>` sequence. CSS neither derives nor
generates text. Maintained fixtures must keep `.sk-workflow-lane__count` consistent with the number
of actual work-item `<li>` children, but that is a fixture assertion rather than runtime logic.
[E-003, E-019]

**Why.** #209 explicitly assigns labels, counts, ordering, and items to the consumer. This mirrors
#210's successful separation: the progress primitive styles supplied native markup while its test
fixtures assert that repeated supplied values agree; it does not add runtime arithmetic. [E-003,
E-014]

**Consequences.** The count may carry consumer-authored accessible wording such as
`aria-label="2 Work Packages"`; CSS must not inject “items”, a lane name, or punctuation through
generated content. The count is not `aria-hidden`, because #209 requires counts to remain part of
the readable overview. Tests should confirm the lane heading names the section independently of
the count and that list order is unchanged. [E-019]

### R-05 — Empty lanes preserve an empty list; empty-state content is not a fake item

**Decision.** An empty lane retains `<ol class="sk-workflow-lane__list"></ol>` with zero `<li>`
children. Supplied empty-state content follows as a sibling in the same named lane section, not as
an `<li>`, so the browser does not announce one work item while the visible count says zero.
Compose the existing `.sk-empty-state` surface; do not create a board-specific empty component.
[E-009, E-010]

**Why.** #209 requires intact per-lane lists, native list counts/order, and explicit empty lanes.
#176 already owns the presentational empty-state primitive. #212, not this mission, owns its compact
`--inline` modifier and explicitly says it invents no copy or announcement. [E-009, E-010]

**Consequences.** All-empty and one-empty-lane stories need both visible supplied empty copy and an
AX/DOM list count of zero. #209 may use the current base `.sk-empty-state` in its independent story;
the compact inline visual and integrated T10 fixture remain #212/#214 work. [E-010]

### R-06 — Work-item contents are opaque composition; lane CSS never reaches inside them

**Decision.** Each `<li>` contains consumer-owned content. The intended integrated item is the
existing `sk-action-row`, later extended by #212 with `layout="card"`, but workflow-lane CSS does
not select into its shadow root, restyle its parts, infer status, or reproduce its card/tone
surface. [E-003, E-020]

**Why.** #146 gives `sk-action-row` its activation and controlled-selection contract while keeping
the surrounding native list consumer-owned. ADR-9 forbids selectors that cross a shadow boundary.
#212 owns the card layout/supporting slot and explicitly forbids status-toned action rows; #177
remains the status-card tone owner. [E-006, E-020]

**Consequences.** Board/lane fixtures may use a minimal opaque placeholder or the currently shipped
action-row form, but must not implement #212. Long title and 50-item checks should treat item
contents as varying consumer boxes and assert containment/focus visibility without depending on
private classes. [E-020]

### R-07 — Single-lane is presentation only; #211 owns selection and #214 owns route composition

**Decision.** Provide one BEM modifier/composition on the existing board/scroller family for a
single visible lane at narrow width. It changes layout only. The story supplies exactly one lane;
there is no active-lane property, hidden-lane algorithm, selector, event, or responsive state in
CSS. [E-021, E-022]

**Why.** #209 requires a single-lane mobile composition only after a consumer-controlled selector
chooses what to render. #211 owns the native `<select>` and its consumer-controlled value/change
state. #214 later combines the selector and one-lane board as route-state fixtures. [E-021,
E-022]

**Consequences.** The single-lane fixture should not overflow and therefore omits the scroller
region/focus triad. CSS may not hide lanes by name, index, viewport query, `:has()` state, or
consumer vocabulary. [E-003, E-021]

### R-08 — Neutral token-driven presentation; no lane vocabulary or tone mapping

**Decision.** Base board/lane styling uses existing neutral surface, foreground, border, spacing,
radius, font, and weight tokens. It defines no `--planned`/`--doing`/`--review`/`--approved`/`--done`
modifiers, colored dots, status-to-tone map, or opacity treatment. Consumer-owned composition may
place an existing status indicator or other explicit content in the header without the lane
primitive interpreting it. [E-003, E-012, E-023]

**Why.** #209 says the styles do not parse lane names or assign domain colors; the current dashboard
demo does both and is therefore evidence of what must remain app-local. #208 leaves lane
definitions and typed intent with Team Kitty. [E-003, E-012]

**Consequences.** Forced-colors evidence must rely on structural borders/outlines rather than
background tone. A plain border survives forced-colors through UA remapping; no
`forced-color-adjust: none` is appropriate. The external empty-state component remains responsible
for its own visual treatment. [E-018, E-023]

### R-09 — A workflow-lane layout token is required; do not copy raw demo/progress dimensions

**Decision.** Introduce one theme-invariant layout token for the minimum inline size of a lane,
with its value calibrated against the approved five-lane and 220–360px item evidence. Use existing
tokens for every other design value. Do not reuse the unrelated context-sidebar-width token or copy
the dashboard's raw `200px`, `1px`, `2px`, `10px`, or `0.06em` values. [E-012, E-024, E-025]

**Why.** Horizontal board overflow requires a meaningful lower bound for each lane. The token
inventory has spacing steps up to 128px and component-specific shell widths, but no semantically
valid workflow-lane minimum. The authoring recipe requires every design value to resolve through
an authoritative `--sk-*` token and requires any new token in both theme blocks plus a regenerated
catalogue. Merged #210 is useful pipeline precedent but its raw bar dimensions do not override that
current rule. [E-024, E-025]

**Consequences.** The plan must include the token source and generated catalogue in scope. The
precise value is accepted only after a browser measurement demonstrates the five-lane overflow and
the narrow single-lane/long-item constraints; it must not be chosen by copying the old demo
literally. No other new token category is indicated by the evidence. [E-024]

### R-10 — No motion; forced colors and themes are verified through stable structural cues

**Decision.** Author no transitions or animations; #209 explicitly excludes lane transitions.
Therefore no reduced-motion media block is needed. Verify default dark and a real `.sk-light`
composition. In forced colors, retain visible lane boundaries, empty treatment, and focus outline
without relying on background color. [E-018, E-023, E-026]

**Why.** The recipe says a reduced-motion block must disable the exact transition a component owns;
a block with nothing to guard is a known false precedent. It also records that borders/outlines
survive forced colors while background and box-shadow do not. #209 names forced-colors perception
and makes transitions a non-goal. [E-018, E-026]

**Consequences.** Tests should inspect computed border/outline geometry under forced-colors in both
color schemes and compare an actual light-token-dependent computed value between Default and
`LightMode`. A story name or background parameter alone is not evidence that `.sk-light` applied.
[E-026]

## Required implementation evidence for the plan

The plan should preserve these checks as acceptance evidence rather than merely listing generic
quality commands:

1. **Generated/static surface:** both styles-only barrels regenerate cleanly; root exports and
   package subpaths resolve; no matching element directories or element/React/behaviour ratchet
   changes appear.
2. **Semantic DOM:** every lane is a section named by its own native heading; every work item is a
   direct `<li>` of its lane's `<ol>`; empty lists contain zero items; lane and item order match the
   authored fixture.
3. **Accessibility tree:** the overflowing board exposes one named region; every lane exposes a
   named region/section and native list/listitem structure; decorative separators contribute no
   accessible text; axe reports zero violations.
4. **Conditional overflow:** overflowing fixture has all three region/name/tabindex attributes,
   receives keyboard focus, and changes `scrollLeft` with horizontal keyboard input; non-overflow
   and single-lane fixtures have none of the triad and add no dead tab stop.
5. **Containment:** in five-lane, 50-item, long-title, and long-lane-label stories, horizontal
   overflow stays on `__scroller` and page `scrollWidth` never exceeds its viewport; focused
   descendant controls are not clipped.
6. **State coverage:** approved five-lane T10 shape, all empty, one empty lane, 50 items, long lane
   labels/items, single-lane narrow, forced colors, default dark, and real `LightMode`.
7. **Visual/token contract:** relevant computed values contain only approved token-derived styles;
   forced-colors boundaries/focus remain perceivable; no domain tone selectors, transition,
   animation, generated text, or raw design value appears.

## Open risks and follow-up decisions

### Planning risk 1 — T10 pixels are unavailable in this environment

The Stitch project URL is reachable, but without an authenticated project payload it exposes only
the generic Stitch shell. #209 is explicit enough to settle architecture and behavior, but exact
spacing/lane-width visual fidelity must be checked against an authorized T10 view or an approved
baseline during implementation. This does **not** block research because #209 is binding and already
states the required semantics, states, and ownership seam. [E-011]

### Planning risk 2 — Conditional attributes are consumer work, not CSS automation

A styles-only package cannot detect overflow and mutate `role`, accessible name, or `tabindex`.
Documentation and fixtures must say who measures and when, and tests must cover both branches. Any
proposal to add a custom element/observer solely to automate this would contradict #209 rather than
close a gap. [E-007, E-008]

### Planning decision — calibrate the one missing layout token

The token name and purpose belong in the plan; its numeric value must be browser-measured against
the five-lane T10/long-content and 220–360px item constraints. This is a reversible design-token
calibration within the already-approved tokens-first architecture, not a new architecture fork.
[E-024, E-025]

## Research handoff

The planner can proceed with two styles-only implementation components and one shared browser-test
slice. No architecture decision or product clarification is required before planning. The plan must
keep the conditional overflow triad, empty-list truthfulness, consumer ownership boundary, and
single new lane-width token explicit; those are the places a visually plausible implementation can
silently violate #209.
