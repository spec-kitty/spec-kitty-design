# Data model: Native workflow board and lanes

**Mission:** `work-package-workflow-board-styles-01M1W0VZ`

This mission introduces no persisted data model and no runtime state owner. The “model” is the
consumer-authored semantic DOM and the presentation states the two CSS families accept. Issue #209
is authoritative; decision IDs refer to [`research.md`](./research.md).

## Ownership boundary

| Concern                                                | Owner                       | How it reaches this surface                                                                                                |
| ------------------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Board heading / accessible name                        | Consumer                    | Visible native heading plus conditional `aria-labelledby` (or another supplied accessible name) on an overflowing scroller |
| Lane definitions and order                             | Consumer                    | Ordered sequence of native lane `<section>` elements                                                                       |
| Lane title and heading level                           | Consumer                    | Native `h2`–`h6`, selected to fit the surrounding document hierarchy                                                       |
| Lane count and accessible wording                      | Consumer                    | Text/attributes on `.sk-workflow-lane__count`                                                                              |
| Work-item order and markup                             | Consumer                    | Direct `<li>` children; each child composes existing public elements or native HTML                                        |
| Tone/status meaning                                    | Consumer                    | Explicit supplied content/composition; never inferred from lane title or position                                          |
| Active mobile lane                                     | Consumer / #211 composition | Consumer renders the selected lane; CSS owns only the one-lane arrangement                                                 |
| Empty copy                                             | Consumer                    | Existing `.sk-empty-state` content; #212 later owns `--inline` presentation                                                |
| Horizontal layout, spacing, boundaries, overflow paint | Design system               | Token-driven `.sk-workflow-board*` and `.sk-workflow-lane*` CSS                                                            |
| Overflow semantics                                     | Consumer                    | Adds/removes the complete region/name/tabindex triad after determining genuine overflow                                    |

## Presentation entities

### WorkflowBoard

The grouping root for a board heading and its scroller. It has no application state and no ARIA
role of its own.

| Field           | Carrier                                    | Required                                                | Constraints                                                                                                 |
| --------------- | ------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| class           | root grouping element                      | yes                                                     | Exactly `.sk-workflow-board`, plus an approved BEM layout modifier if the single-lane composition needs one |
| visible heading | native heading within/adjacent to the root | yes for a labelled board                                | Consumer-authored text and heading level; unique `id` when used by `aria-labelledby`                        |
| lanes           | `.sk-workflow-board__scroller` children    | one or more for the populated stories; may all be empty | Order is consumer-owned and preserved; CSS never sorts or filters                                           |
| layout mode     | block/element modifier                     | default multi-lane or single-lane                       | Presentation only; never selects or hides a lane                                                            |

### WorkflowBoardScroller

The sole horizontal-overflow owner. Its semantic attributes form a conditional, indivisible state.

| Field               | Non-overflow value                       | Genuine-overflow value                              | Invariant                                                                          |
| ------------------- | ---------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| class               | `.sk-workflow-board__scroller`           | `.sk-workflow-board__scroller`                      | Always present                                                                     |
| `role`              | absent                                   | `region`                                            | Never added merely because the CSS class is present                                |
| accessible name     | absent                                   | consumer-supplied `aria-labelledby` or `aria-label` | Exactly one method; name is meaningful and visible where possible                  |
| `tabindex`          | absent                                   | `0`                                                 | Never a dead tab stop                                                              |
| horizontal geometry | `scrollWidth <= clientWidth`             | `scrollWidth > clientWidth`                         | State is determined from rendered geometry, not lane count or viewport assumptions |
| page geometry       | `document.scrollWidth == viewport width` | `document.scrollWidth == viewport width`            | Overflow remains bounded to the scroller in both states                            |

The styles package documents this state but does not compute it. No observer, resize handler,
custom element, or mutation logic is introduced.

### WorkflowLane

A native named section. It contains exactly one lane heading/header and one ordered work-item list;
an empty-state sibling may follow the empty list.

| Field              | Carrier                        | Required                      | Constraints                                                                                               |
| ------------------ | ------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| class              | `<section>`                    | yes                           | `.sk-workflow-lane`; no domain-named status modifier                                                      |
| accessible name    | `aria-labelledby="<title-id>"` | yes                           | Resolves in the same light-DOM root to this lane's title                                                  |
| header             | native `<header>`              | yes                           | `.sk-workflow-lane__header`; layout container only                                                        |
| title              | native heading                 | yes                           | `.sk-workflow-lane__title`; unique `id`; text/level consumer-owned                                        |
| count              | ordinary phrasing element      | yes                           | `.sk-workflow-lane__count`; supplied value and optional supplied accessible wording; not generated by CSS |
| list               | native `<ol>`                  | yes, including empty lanes    | `.sk-workflow-lane__list`; source order is display/reading order                                          |
| empty presentation | sibling after the empty `<ol>` | only when list length is zero | Existing `.sk-empty-state`; never a fake `<li>`                                                           |

### WorkflowItem

A consumer-authored direct `<li>` of a lane list. It deliberately has no `sk-workflow-*` class in
this mission: #209's public selector set ends at `.sk-workflow-lane__list`.

| Field                | Carrier                                                 | Constraint                                                                  |
| -------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| list membership      | `<li>` whose direct parent is `.sk-workflow-lane__list` | Preserves native list/listitem relationship and list order                  |
| content              | light-DOM/native content or existing public component   | Opaque to lane CSS; may later use `sk-action-row[layout="card"]` after #212 |
| activation/selection | composed element/consumer handler                       | Not owned or re-emitted by board/lane styles                                |
| tone/status          | supplied visible tags/indicator/text                    | Never inferred from lane name/index                                         |

### EmptyLanePresentation

An empty lane is a lane with `count = 0`, an empty ordered list, and supplied explanatory content.

```html
<section class="sk-workflow-lane" aria-labelledby="done-title">
  <header class="sk-workflow-lane__header">
    <h3 class="sk-workflow-lane__title" id="done-title">Done</h3>
    <span class="sk-workflow-lane__count" aria-label="0 Work Packages">0</span>
  </header>
  <ol class="sk-workflow-lane__list"></ol>
  <div class="sk-empty-state">
    <p class="sk-empty-state__body">Nothing here</p>
  </div>
</section>
```

The empty presentation is not a list item, does not fabricate an announcement, and is not an
application notice. #212 may add `.sk-empty-state--inline`; #178 remains the announced-notice
surface; #214 composes the final T10 pattern.

## Relationships and cardinality

```text
WorkflowBoard 1
  ├─ visible heading 1
  └─ WorkflowBoardScroller 1
       └─ WorkflowLane 1..n (ordered)
            ├─ header 1
            │    ├─ native heading 1
            │    └─ supplied count 1
            ├─ ordered list 1
            │    └─ WorkflowItem 0..n (direct <li>, ordered)
            └─ EmptyLanePresentation 0..1 (only when item count is zero)
```

## State axes

These axes are orthogonal unless an invariant below says otherwise.

| Axis            | Values required by #209                          | Model effect                                                    |
| --------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| board layout    | five-lane/default; single-lane narrow            | Changes CSS layout only; consumer supplies the visible lane set |
| overflow        | absent; genuine horizontal overflow              | Controls the conditional region/name/tabindex triad             |
| lane population | populated; one empty; all empty                  | Changes `<li>` cardinality and empty-state sibling presence     |
| scale           | representative; 50 items                         | Changes item cardinality only; no virtualization/filtering      |
| content length  | ordinary; long lane names; long work-item titles | Text wraps/remains readable without changing semantics          |
| theme           | default dark; `.sk-light`                        | Same DOM/data; token values change                              |
| user colors     | normal; forced colors                            | Same DOM/data; structural boundaries/focus remain perceivable   |
| tone            | neutral base; consumer-composed tone/content     | No lane-name-to-tone mapping exists in these CSS families       |

No transition/motion axis exists. Lane transitions are a non-goal, so reduced-motion is satisfied
by the absence of motion rather than a dead media query.

## Cross-entity invariants

1. `WorkflowLane.count` equals the number of work-item `<li>` children in maintained fixtures.
   This is a test/fixture invariant, not runtime calculation.
2. A zero-count lane has zero `<li>` children; empty-state copy is a sibling, never a list item.
3. Every lane's `aria-labelledby` resolves to its own native heading in the same DOM root.
4. Every work item is a direct `<li>` child of its lane's native `<ol>`; no custom-element host
   intervenes between them.
5. Lane order and item order in the DOM are the visual and accessibility order; CSS does not
   reorder with `order`, named grid placement, or transforms.
6. An overflowing scroller has all of `role="region"`, an accessible name, and `tabindex="0"`;
   a non-overflowing scroller has none of them.
7. Only `.sk-workflow-board__scroller` owns horizontal overflow; the page remains viewport-wide.
8. Single-lane mode receives one consumer-selected lane and adds no application state or hidden
   lanes.
9. Board/lane CSS never selects lane text, domain labels, item internals, or shadow-root content.
10. All authored design values resolve through authoritative `--sk-*` tokens. The lane minimum
    inline size uses a new theme-invariant workflow-lane layout token; unrelated shell tokens are
    not aliased for convenience.

## Worked overflowing composition

```html
<div class="sk-workflow-board">
  <h2 id="workflow-title">Work Packages</h2>
  <div
    class="sk-workflow-board__scroller"
    role="region"
    aria-labelledby="workflow-title"
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
        <li>
          <sk-action-row><!-- consumer-owned content --></sk-action-row>
        </li>
        <li>
          <sk-action-row><!-- consumer-owned content --></sk-action-row>
        </li>
      </ol>
    </section>
    <!-- further consumer-ordered lane sections -->
  </div>
</div>
```

For a non-overflowing or single-lane composition, the markup is identical except that `role`, the
accessible-name attribute, and `tabindex` are all omitted from the scroller. The board/lane library
does not decide which branch applies.

## Validation mapping

| Model rule                  | Required evidence                                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Native named lanes          | DOM and accessibility-tree assertions for `<section>` + native heading association                                    |
| Native ordered items        | Direct-parent DOM assertion plus accessibility-tree list/listitem count and order                                     |
| Truthful empty lanes        | Zero listitem count plus visible supplied empty-state content                                                         |
| Conditional scroller state  | One true-overflow and one non-overflow fixture asserting geometry and the full attribute triad                        |
| Keyboard-reachable overflow | Focus and horizontal-key scroll assertion on the overflowing region                                                   |
| Page containment            | `document.scrollingElement.scrollWidth <= clientWidth` at default/narrow/long/50-item sizes                           |
| Consumer ownership          | Negative source assertions for domain modifiers, generated text, state/drag/filter/timer logic, and private selectors |
| Token-only styling          | Stylelint plus source assertion/calibrated token catalogue entry for lane minimum inline size                         |
| Theme/user colors           | Computed dark-vs-light difference and forced-colors boundary/focus measurements                                       |
