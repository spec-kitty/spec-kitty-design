# Research: Native progress styles

**Mission:** `work-package-native-progress-styles-01M1VKQ8`

**Issue:** [#210](https://github.com/spec-kitty/spec-kitty-design/issues/210) `[TKW2] native progress
styles — accessible completion over real <progress>`, child of
[#208](https://github.com/spec-kitty/spec-kitty-design/issues/208).

**Research date:** 2026-09-06

**Repository revision inspected:** `6b12747498284266f36f0379fcc3f5a4354b9401` (`mission/work-package-native-progress-styles`, cut from `train/elements-first@32fa4950b88941f9a78759e3e911dfa510d10a13` — the same revision #210's own evidence section cites).

**Decision status:** complete enough for implementation; no product/API/architecture decision remains
open.

## Question and boundary

The research question is how to deliver a reusable `.sk-progress` family that presents determinate
completion over a real `<progress>` element, while preserving five constraints #210 states as
binding: styles-only (no custom element), the consumer supplies `value`/`max`/label/visible metadata
and owns all arithmetic and text, the label stays programmatically associated with the control, every
required determinate state and layout arrangement is covered, and the component stays legible at zoom,
under forced colors, and with motion disabled.

This is decision support for a mission whose specification phase has not yet been authored in
`spec.md` (still the unmodified template at this revision) — research runs first here so that the
plan and tasks phases start from a settled technical footing rather than re-deriving it. It does not
invent product scope beyond #210's own binding text; #210 and its parent epic #208 are the sole
source of product requirements, and neither leaves any product fork for this research to resolve.
Evidence is registered in [`research/source-register.csv`](./research/source-register.csv);
individual findings are cross-referenced by `E-*` ids in
[`research/evidence-log.csv`](./research/evidence-log.csv).

## Executive conclusion

Add `packages/styles/src/progress/` as a **styles-only** component: one authored `sk-progress.css`
plus one `.html` fixture per required state, generating `index.ts` and `sk-<name>.html` outputs the
same way `disclosure`, `facts`, `skip-link`, `data-table` and `empty-state` already do. No
`packages/elements/src/progress/` directory is created, and no element, manifest entry, `::part()`,
behaviour-registry subject, or generated React prop is added for this component. [E-001, E-002,
E-003]

This is not an exception carved out for this mission: ADR-10's "styles-only components are a class,
not a fixed exception count" section already states the rule this component falls under —
**"a component whose entire value is the semantics of a native element it styles is styles-only by
design, not by exception."** `<progress>` is exactly that case. Its accessible name, role
(`progressbar`), and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` are derived by the browser from
the element's own `value`/`max` attributes and an associated `<label>` — there is no interaction,
state, or composition for a wrapper element to add, and #210's own non-goals list confirms this by
excluding "a custom `sk-progress` element" explicitly. [E-004, E-005, E-006]

The markup contract is the three-part structure #210's issue body already specifies verbatim:

```html
<div class="sk-progress">
  <label class="sk-progress__label" for="mission-progress">5 of 8 Work Packages done</label>
  <progress class="sk-progress__bar" id="mission-progress" value="5" max="8">63%</progress>
  <span class="sk-progress__meta">63%</span>
</div>
```

`build-styles-only-markup.mjs` auto-derives its styles-only component set by scanning
`packages/styles/src` for a directory that has a `.css` file and **no** matching
`packages/elements/src/<name>/` directory — there is no allowlist to update, so creating this
directory shape is sufficient for the barrel generator to pick it up. [E-002, E-007]

## Authority and conflict resolution

Evidence is applied in this order:

1. #210's own binding text — outcome, representative structure, contract and states, required
   stories and tests, dependencies, and non-goals.
2. #208's binding ownership boundaries (styles-layer primitives over native semantics; no
   Team-Kitty vocabulary or state) and programme requirements (tokens → styles → elements → wrappers;
   default dark + `LightMode`; forced-colors/reduced-motion where relevant).
3. ADR-9 (styling API — not applicable here, since this component has no shadow root), ADR-10
   (distribution, canonical markup, and the styles-only class ruling that governs this component),
   ADR-11 (verification stack — not applicable beyond the standard Storybook/axe/visual gates, since
   this component owns no behaviour).
4. `docs/contributing/adding-a-component.md`'s current recipe, specifically its "Forced-colors and
   reduced-motion baselines" section and the three prior styles-only forced-colors implementations
   it names as the pattern to copy.

No source conflicts were found. #210 is unusually self-contained: it names its own representative
markup, its own required story list, and its own non-goals, leaving no place where this research
needed to arbitrate between two documents.

## Decisions and rationale

### R-01 — Styles-only, no element, no behaviour registration

**Decision.** `sk-progress` is authored once as `packages/styles/src/progress/sk-progress.css` plus
per-state `.html` fixtures. No `packages/elements/src/progress/` is created. No entry is added to
`expected-parts.json`, `expected-docs.json`, `behaviours.json`, or `mutations.json` — those ratchets
govern the element layer (`::part()`, documented attributes/methods, owned behaviour), and this
component has none of the three. [E-001, E-004, E-005, E-024]

**Why.** #210 states "No custom element ships" as part of its outcome and lists "a custom
`sk-progress` element" among its non-goals. ADR-10's styles-only class ruling gives the architectural
reason this is correct rather than merely permitted: a wrapper element around `<progress>` would
sever nothing and add nothing — it would not fix a cross-shadow-boundary problem the way
`sk-form-input` fixes label ownership (ADR-9 §4), because `<progress>`'s label association, value
exposure, and role are already correct in light DOM with a plain `<label for>` pointing at the
control. [E-004, E-005, E-006]

**Consequences.** No manifest entry, no React wrapper prop, no `useProperties` delivery, no
generated CSS module (`sk-progress.css.js`) — those all belong to the element pipeline. This
component's only generated artifacts are `packages/styles/src/progress/index.ts` (the HTML barrel)
and `packages/styles/src/progress/sk-progress.html` equivalents are not applicable either, since
there is no `.markup.ts` to generate a canonical single default from; every required state gets its
own authored `.html` fixture instead, exactly as `facts` and `disclosure` already do (five and three
fixture files respectively, none of them a single canonical default with variants layered on top).
[E-002, E-007]

### R-02 — Consumer owns all arithmetic, text, and state; CSS and markup do neither

**Decision.** The `.sk-progress` family accepts already-computed `value`, `max`, label text, and
visible metadata text as authored attribute values and slotted text content. No CSS generates
content from `value`/`max` (no `content: counter(...)`, no computed percentage), and no JavaScript
of any kind is introduced. Negative values, values exceeding `max`, and internal consistency between
the visible percentage span and the native `value`/`max` pair are consumer responsibilities enforced
by the consumer's own markup, not by this component. [E-004, E-008]

**Why.** #210's contract section states this exactly: "Consumer supplies `value`, `max`, label and
visible metadata. CSS performs no arithmetic and generates no text" and "Invalid negative/over-max
domain data remains consumer validation." #208's binding ownership boundaries independently confirm
the general rule this instance follows: the library owns "token-driven presentation, native
semantics, accessibility mechanics, responsive composition rules," never application data or
arithmetic. [E-004, E-008]

**Consequences.** The required fixture assertion "supplied visible percentage matches the same raw
numerator/denominator used by `<progress>`" (#210) is a **test-authored** consistency check across
the maintained fixtures, not a runtime guarantee the component enforces — there is no mechanism in a
styles-only component that could enforce it live. This is recorded so implementation does not
mistake the fixture-level check for a component contract that needs JS. [E-004, E-009]

### R-03 — Label association is a plain light-DOM `for`/`id` pair

**Decision.** `<label class="sk-progress__label" for="...">` paired with `<progress id="...">` in
one light-DOM tree, exactly as #210's representative markup shows. No `aria-label`,
`aria-labelledby`, or `role` attribute is added — none is needed, and none would improve on native
`for`/`id` association for an element that is never inside a shadow root. [E-004, E-006, E-010]

**Why.** ADR-9 §4's cross-root ID-resolution findings (arrangements C and D both failing axe) are
about **shadow-DOM** label association specifically — `getRootNode()`-scoped ID lookup. They do not
apply here: this component has no shadow root, so a same-document `for`/`id` pair resolves exactly as
plain HTML guarantees. ADR-10's styles-only class ruling independently lists "cross-root ID references
do not resolve" as one of the four reasons a wrapper element cannot exist for native-semantics
components generally — the absence of a shadow root is precisely why this pattern is safe here.
[E-006, E-010]

**Consequences.** The required "accessibility-tree assertion for the progress role, name,
value/min/max" (#210) is a confirmation of native browser behaviour (`<progress>`'s implicit
`progressbar` role and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` derived from its own attributes)
plus the `for`/`id` association producing the accessible name — not new work invented by this
component. [E-006, E-010]

### R-04 — Fallback content inside `<progress>` and the visible `__meta` span are two distinct texts, both required

**Decision.** The text between `<progress>...</progress>` tags (`63%` in #210's example) is the
element's **fallback content**, rendered only by a user agent that does not support `<progress>`
rendering at all — it is not part of the accessible name or the exposed value in a conforming
browser, which instead computes role/name/value from the element's own attributes and its
`for`/`id`-linked label. The separate `<span class="sk-progress__meta">63%</span>` is the
**visible, styled** metadata text sighted users read next to the bar. Both are authored in the
markup exactly as #210 specifies; this research does not treat the visible duplication as a defect
to remove. [E-006, E-011]

**Why.** This is standard, spec-defined `<progress>` behaviour (WHATWG HTML "the progress element"),
not a project-specific choice this research is making — the representative markup in #210 already
encodes it, and altering it would be a deviation from the issue's binding contract rather than a
research recommendation. [E-006, E-011]

**Consequences.** No fork exists here for the accessibility-tree assertion required by #210: a screen
reader announces the control's name (from the label) and native value/min/max once, from the
`<progress>` element's own semantics, and separately may encounter the plain-text `__meta` span while
navigating the surrounding markup — expected behaviour for a sighted-and-assistive dual-channel
metadata display, the same pattern data tables and facts lists already use for numeric content in
this repository. [E-011]

### R-05 — Forced-colors: `border` on the track survives automatically; the fill needs an explicit override

**Decision.** Achieving the design's rounded, tinted track and fill requires resetting the control's
native appearance (`appearance: none` on `<progress>`, styling `::-webkit-progress-bar` /
`::-webkit-progress-value` / `::-moz-progress-bar`) — the same way every cross-browser-styled
`<progress>` implementation must, since the three pseudo-elements are the only standardised styling
surface `<progress>` exposes. Once restyled this way, the track's outer boundary is expressed with a
`border` (which this repository's own forced-colors work has already established survives
`forced-colors: active` automatically, with zero author override), and the fill pseudo-element's
`background-color` gets an explicit `@media (forced-colors: active)` override to the `Highlight`
system color, matching the pattern `sk-skip-link` and `sk-data-table` already use for a
background-drawn affordance that must remain visible. [E-012, E-013, E-014]

**Why.** `background`/`background-color` do not survive forced-colors mode — they flatten to
`Canvas` regardless of authored value, which `docs/contributing/adding-a-component.md` and this
repository's `sk-data-table.css` forced-colors block both already document and both already work
around with an explicit override rather than relying on the property to survive on its own. A
progress fill drawn as a `background-color` on `::-webkit-progress-value` is the same shape of
problem `sk-data-table`'s zebra rows solved, and the fix is the same shape: an explicit
`@media (forced-colors: active)` rule naming a system color, not a bare hope that `background`
survives. [E-013, E-014]

**Consequences.** This is an implementation task, not an open research question: the pattern to copy
already exists twice in this repository (`sk-skip-link.css`, `sk-data-table.css`), and #210's own
required-stories list already demands a dedicated forced-colors story plus the general "legible …
in forced colors" acceptance criterion — verification happens through that story and the
CI-authoritative visual baseline the recipe already requires for every component, not through this
research inventing a new gate. [E-012, E-013, E-014]

### R-06 — Reduced motion: any transition on the fill is disabled, not removed from the design

**Decision.** If `sk-progress.css` gives the fill a `width`/`transform` transition for the (rare,
consumer-triggered) case where a `value` attribute changes on an existing element, that transition is
disabled inside `@media (prefers-reduced-motion: reduce)`, following exactly the shape
`sk-disclosure.css` and `sk-skip-link.css` already use for their own transitions. [E-015]

**Why.** #210 states "Any transition is disabled under reduced motion" directly. The repository's
established shape for this is `transition: none` scoped to the exact selector and property the
component owns, never a wildcard — the recipe calls out `sk-transition-matrix.css`'s
`scroll-behavior` guard as the negative example, a reduced-motion block that looks real but disables a
property nothing in the file sets. [E-015]

**Consequences.** Since this is a static, consumer-authored fixture set with no JavaScript updating
`value` at runtime, the transition (if authored at all) only matters to a consumer embedding this
markup in a live-updating context outside this repository — the required states (`zero`, `T10 5/8`,
`complete`, `large total`, `long label`, `compact`, `narrow`) are all static snapshots and do not
themselves exercise a transition. The reduced-motion guard is still required as a correctness
property of the shipped CSS, independent of whether this mission's own fixtures trigger it.

### R-07 — Two layout arrangements share the same native element and label; no new markup shape

**Decision.** "Compact/inline" and "stacked narrow" (#210) are `.sk-progress` **modifier** classes
that change layout (flex-row vs. stacked) via CSS only. Both arrangements keep exactly the same three
children — `label`, `progress`, `span.__meta` — in the same order; nothing is removed, reflowed into a
different element, or conditionally rendered between the two arrangements. [E-016]

**Why.** #210: "Compact/inline and stacked narrow arrangements preserve the same native element and
label" is explicit binding text, and BEM naming (CLAUDE.md §3 hard rule 4) makes a modifier class the
correct mechanism for a layout variant that does not change markup structure. [E-016]

**Consequences.** Two additional fixture states are required beyond the "determinate states" list —
compact and narrow — for a total fixture set of at least nine: zero, T10 5/8 (the issue's own worked
example), complete, large total, long label, compact, narrow, forced colors, and default dark plus
required `LightMode`. This matches #210's "Required stories and tests" list read literally; no
additional state was invented, and none of the five determinate-state names or two layout names were
merged or split from what the issue specifies. [E-004, E-017]

### R-08 — No token gap; no new `--sk-*` custom property is required

**Decision.** The track, fill, and text colours use existing paired surface/foreground tokens already
in `packages/tokens/src/tokens.css` (e.g. `--sk-surface-input` for the track, an existing accent token
for the fill, `--sk-fg-muted`/`--sk-fg-default` for text) — the same tokens the current
`.dash-progress-*` implementation in `apps/demo/dashboard-demo.html` already draws on for an
equivalent visual, confirming the palette exists. No new token category, pairing, or theme-block
addition is needed. [E-018, E-019]

**Why.** `tokens.css` currently has zero occurrences of "progress" — there is no pre-existing
progress-specific token to reuse or conflict with, and none is needed: this is a track/fill/text visual,
which the existing surface, foreground, spacing, and radius token families already cover, matching
every other styles-only component in this repository (none of `facts`, `disclosure`, `skip-link`,
`data-table`, `empty-state` needed a component-named token category either). [E-018, E-019]

**Consequences.** No `npx nx run tokens:catalogue` regeneration is required unless implementation
discovers a genuine gap while authoring the CSS; if one is found, it is a token-layer change requiring
maintainer sign-off per the charter's Branch Strategy, not a decision this research pre-authorizes.

### R-09 — This mission does not touch `apps/demo/dashboard-demo.html`

**Decision.** The existing `.dash-progress-*` rules and markup in `apps/demo/dashboard-demo.html`
(cited in #210's own "Evidence" section as the motivating gap) are left as they are. This mission adds
the reusable `.sk-progress` family to `packages/styles/src/`; migrating the demo page to consume it is
not in #210's outcome, required-stories list, or dependencies, and #208 assigns pattern-level
composition stories to a separate wave-3 child (TKW6, #214). [E-020, E-021]

**Why.** #210's non-goals list does not mention the demo page, and #208 explicitly reserves
"approved composition and route-state fixtures" for TKW6, sequenced in wave 3 after TKW1–TKW5 and
#178 — this mission is wave 1. Touching the demo page here would be scope the mission was not asked
to take and would collide with TKW6's later, more informed pass. [E-020, E-021]

**Consequences.** `scripts/assemble-demo-dist.sh`'s path-rewrite table and `ci-quality.yml`'s
`components` path filter (`packages/**`, already present) need no update for this mission — a new
`packages/styles/src/progress/` directory is covered by the existing `packages/**` filter entry, and
no new demo-page path is introduced. [E-022]

## Rejected or deliberately absent approaches

| Approach | Reason not selected | Evidence |
|---|---|---|
| A custom `<sk-progress>` element | #210 explicitly excludes it as a non-goal; ADR-10's styles-only class ruling gives the architectural reason (native semantics leave nothing for a wrapper to add) | E-004, E-005, E-006 |
| Component-computed percentage text (CSS `content`/JS) | #210's contract requires the consumer to supply visible metadata; CSS/markup performs no arithmetic | E-004, E-008 |
| `aria-label`/`aria-labelledby` instead of `for`/`id` | No shadow root exists here, so plain `for`/`id` already resolves correctly; ADR-9's cross-root findings do not apply to a light-DOM-only component | E-006, E-010 |
| Removing the in-tag fallback text as "duplicate" of the `__meta` span | It is spec-defined fallback content for non-supporting user agents, not a defect; #210's own representative markup includes it | E-006, E-011 |
| Relying on unstyled `<progress>`'s native forced-colors handling | The design requires a custom track/fill visual, which needs `appearance: none` and pseudo-element styling — once restyled, `background`/`background-color` no longer survive forced-colors automatically, per this repository's own prior measurements | E-013, E-014 |
| A new component-named token category for progress colours | No token gap exists; existing surface/foreground/accent tokens already cover the visual, matching every other styles-only component | E-018, E-019 |
| Migrating `apps/demo/dashboard-demo.html` to consume `sk-progress` in this mission | Out of #210's scope; reserved for #214 (TKW6) in #208's wave 3 | E-020, E-021 |

## Evidence-to-implementation handoff

- [`data-model.md`](./data-model.md) records why this mission has no domain entities, and documents
  the markup/attribute contract and fixture matrix in the entities' place.
- `plan.md` (not yet authored at this revision) owns file/write scope, generated-artifact regeneration
  order, and the exact gate commands from the recipe's "Run the gates" section.
- `tasks.md`/`tasks/` (not yet authored at this revision) own work-package sequencing; #210 states this
  mission has no dependency on any other TKW child and is independent of every other #208 child.

## Open questions and risks

No product, visual, ownership, or architecture decision remains open. The following are execution
risks carried into planning/implementation, not unresolved decisions:

1. **Forced-colors fill override is pattern-following, not yet measured for this component.** The
   `border`-survives / `background-color: Highlight`-override shape is established twice already in
   this repository (`sk-skip-link.css`, `sk-data-table.css`), but has not been measured against a real
   `<progress>` element's `::-webkit-progress-value`/`::-moz-progress-bar` pseudo-elements
   specifically. #210's own required forced-colors story and the CI-authoritative visual baseline are
   where this gets confirmed, per the recipe's standard "baselines are CI-authoritative" rule. [E-012,
   E-013, E-014]
2. **Cross-browser pseudo-element coverage.** `::-webkit-progress-bar`/`::-webkit-progress-value`
   (Blink/WebKit) and `::-moz-progress-bar` (Gecko) are two different pseudo-element sets with no
   single standard equivalent; both must be authored for the same visual, and WebKit itself remains
   unverified locally in this repository's environment (ADR-10's own "Neutral" consequence already
   records this gap generally). This is a normal cross-browser authoring risk for any styled
   `<progress>`, not specific to this mission's design. [E-023]
3. **Zoom/overflow behaviour of long labels.** #210 requires a "long label" fixture; whether the label
   wraps, truncates, or pushes the bar to a new line at high zoom is a CSS authoring detail the
   fixture and its visual baseline settle, not a product decision this research needs to make ahead of
   time.

## Explicitly out of scope for this research

- Redesigning or migrating `apps/demo/dashboard-demo.html`'s existing `.dash-progress-*` rules (R-09).
- Any custom element, JavaScript behaviour, application state, or Team Kitty domain vocabulary — #210
  and #208 both exclude these categories explicitly, and no evidence gathered here contradicts that
  exclusion.
- Indeterminate/loading-state progress, stepper components, task data, completion animation, or status
  tone — all named non-goals in #210.
