# Using components

The Spec Kitty components ship as CSS in `@spec-kitty/styles`, and — for the components migrated
so far — as **custom elements** in `@spec-kitty/elements`. Both require `@spec-kitty/tokens`.

**Migration is in progress.** Twenty-eight elements exist today: `sk-action-row`, `sk-app-shell`,
`sk-bar-chart`, `sk-blog-card`, `sk-button`, `sk-card`, `sk-check-bullet`, `sk-context-sidebar`, `sk-entity-marker`,
`sk-evidence-chain`, `sk-feature-card`, `sk-form-input`, `sk-form-textarea`, `sk-grid`, `sk-metric`,
`sk-nav-pill`, `sk-notice`, `sk-page-header`, `sk-personal-rail`, `sk-pill-tag`, `sk-ribbon-card`,
`sk-section-banner`, `sk-section-header`, `sk-site-footer`, `sk-status-indicator`, `sk-stub`,
`sk-time-series-chart`, and `sk-transition-matrix`.
Several of the catalogue's component packages are CSS only by a recorded decision — `form-field`,
(#176) `facts`, `disclosure`, `data-table`, `empty-state`, `skip-link`, (#210) `progress`, and
(#209) `workflow-board` and `workflow-lane`, (#211) `form-select`, and (#213) `breadcrumbs`,
`prose`, and `event-timeline`. See
ADR-10, *form-field is deliberately styles-only* and *Styles-only components are a class, not a
fixed exception count*. These thirteen ship classes applied to real semantic HTML the consumer authors
— `<dl>`, `<details>`, `<table>`, a plain block, `<a>`, `<progress>`, `<section>`, `<ol>`, and `<select>` — and no `sk-*` custom element
wraps any of them: light-DOM native semantics (list/table/label association across a shadow
boundary) are exactly what a wrapper element would break. Composite sections below such as Hero
and Callout are CSS-only *patterns* rather than packages, and are not part of that count. Each
section below says which it is, because the difference decides how you use it.

Because a custom element needs no wrapper, every framework can use the migrated ones directly. A
generated React wrapper exists for JSX typing and typed refs — see
[Using the elements from React](./using-react.md) for what it does and does not buy, measured.

## Application shell composition

The shell elements supply layout and landmarks while the consumer supplies destinations, state,
identity, headings, status copy, and actions. They do not know which route is active or whether a
navigation surface is open.

```html
<sk-app-shell>
  <sk-personal-rail slot="personal-rail" label="Product areas">
    <a slot="primary" href="/work">Work</a>
    <button slot="utilities" type="button">Notifications</button>
    <a slot="account" href="/account">Account</a>
    <button slot="logout" type="button">Log out</button>
  </sk-personal-rail>

  <sk-context-sidebar slot="context-sidebar" label="Project context">
    <strong slot="header">Reference project</strong>
    <nav aria-label="Project sections"><a href="/summary">Summary</a></nav>
    <button slot="footer" type="button">Project settings</button>
  </sk-context-sidebar>

  <sk-page-header slot="page-header">
    <span slot="eyebrow">Overview</span>
    <h1 slot="title">Delivery summary</h1>
    <p slot="supporting">Current evidence and recent activity.</p>
    <span slot="sync">Last synchronized by the consumer</span>
    <sk-button slot="actions" size="icon" label="Refresh evidence">↻</sk-button>
  </sk-page-header>

  <section aria-label="Delivery content">Consumer-owned page content.</section>
</sk-app-shell>
```

`sk-app-shell` exposes the `personal-rail`, `context-sidebar`, and `page-header` named slots plus
the default content slot. At desktop widths its columns are 56px, 240px, and the remaining space;
at narrow widths it keeps all regions in document order. Consumers may control visibility on the
slotted hosts, but the shell itself has no open state or navigation events.

Use the reflected `label` attribute to name the `sk-personal-rail` navigation landmark and the
`sk-context-sidebar` complementary landmark. A nonblank label is forwarded verbatim; a blank or
missing one uses the generic fallback. The context sidebar does not create a navigation landmark,
so supply a native labelled `<nav>` when its content is navigation. Keep account content in the
personal rail's `account` slot, above `logout`; do not duplicate it in `primary`.

`sk-page-header` preserves the consumer's heading level and treats `sync` copy as opaque text. It
does not calculate relative time or schedule refreshes. Links and buttons slotted into any shell
element remain the original native controls and keep their native events.

### Page header density and stickiness

`sk-page-header` has two reflected axes, and they are independent: a compact header need not
stick, and a sticky header need not be compact.

| attribute | values | what it changes |
|---|---|---|
| `density` | `compact`, or omitted | Padding, gaps and row direction. The same five slots resolve at either density — there is no second header to author. Any other value renders the default density and warns. |
| `sticky` | present / absent | The header pins itself to the top of its scroll region. |

```html
<sk-page-header density="compact" sticky>
  <span slot="eyebrow">Runs</span>
  <h1 slot="title">Pipeline runs</h1>
  <p slot="supporting">Latest evidence for this project.</p>
  <span slot="sync">Updated 12 seconds ago</span>
  <sk-button slot="actions" size="icon" label="Refresh runs">↻</sk-button>
</sk-page-header>
```

At compact density the eyebrow, title, supporting copy and sync text share one row and truncate
visually if they do not fit. Truncation is visual only — the DOM text is untouched, so assistive
technology still reads the whole string. The actions region never shrinks: under horizontal
pressure the metadata gives way first and the trailing control keeps its full box.

**Stickiness is dropped below 720px of viewport width or 480px of viewport height.** The header
returns to normal flow and stacks, and nothing is removed to make room — the title, the metadata
and the actions are all still rendered and still reachable. A sticky header that consumes a third
of a short viewport is worse than no sticky header.

#### Keeping focused content out from behind the header

A sticky header will otherwise cover a control the browser has just scrolled into view, which is a
WCAG 2.4.11 failure. The header cannot reach your content to fix that, so it publishes the value
for you to apply — you never compute an offset yourself:

```css
.page-content :is(a, button, input, select, textarea, [tabindex]) {
  scroll-margin-block-start: var(--sk-layout-page-header-sticky-scroll-margin);
}
```

That token is **derived**, not restated:

```
--sk-layout-page-header-sticky-scroll-margin =
    --sk-layout-page-header-sticky-offset      (where the header pins, default 0)
  + --sk-layout-page-header-compact-height     (the compact header's MINIMUM block size, 3rem)
  + --sk-space-7                               (2rem, absorbing content taller than that minimum)
```

The header's own `min-block-size` at compact density reads the same
`--sk-layout-page-header-compact-height`, so retuning either input moves both the header and the
scroll margin together.

#### The default value covers one configuration — read this before you rely on it

**`80px` is the right answer for `density="compact"` on a single row, which means the header
itself wider than 720px. It is wrong everywhere else, and you override the token.** The name stays
the one place the value lives; only its default is compact-specific.

Measured in chromium against the shipped token sheet, one composition (eyebrow, title, supporting
copy, sync text, one action), as the host's own height:

| configuration | header width | short title | long title |
|---|---:|---:|---:|
| `density="compact" sticky` | 900px | **60px** | 60px |
| `density="compact" sticky` | 400px | 96px | 96px |
| `sticky` (default density) | 900px | 227px | 356px |
| `sticky` (default density) | 400px | 275px | 533px |

Against a published default of **80px**. Note that the compact figure is not the 3rem (48px)
minimum: `--sk-layout-page-header-compact-height` is a *floor*, and the real height is whatever the
slotted content needs above it — this catalogue's own sticky story measures 71px, because its sync
slot also carries a status pill. That is what the `--sk-space-7` term absorbs, and it is why the
term is 2rem rather than the 1rem it shipped with for one round.

Two things follow, and the second is easy to miss:

- **Default density needs your own number.** `sticky` without `density="compact"` is a supported
  combination — the axes are orthogonal — and its height is entirely your slotted content. There
  is no honest derived value for it, so this design system does not publish a second token that
  would be a guess wearing a token's name. Set
  `--sk-layout-page-header-sticky-scroll-margin` yourself, from your own header.
- **A compact header can be stacked and sticky at the same time.** Stacking is a `@container`
  query on the *header's own width*; dropping stickiness is a `@media` query on the *viewport's*.
  They are deliberately different mechanisms — the header must reflow inside whatever column the
  page gives it, while scrolling is a viewport concern — but it means a 400px header column inside
  a 1400px viewport is **sticky and stacked at once**, at 96px against the 64px default. Note the
  compact numbers above do not move with title length: at compact density the title is
  `white-space: nowrap` with an ellipsis and cannot wrap, so the extra 32px is the metadata row
  stacking under the text row, not a wrapped heading.

```css
/* Default density, or a header column narrower than 720px: your figure, one place. */
.page-shell {
  --sk-layout-page-header-sticky-scroll-margin: 18rem;
}
```

**At compact density, prefer raising `--sk-layout-page-header-compact-height` instead.** It is
both the header's `min-block-size` and the scroll margin's input, so setting it to your header's
real height keeps the two consistent by construction — which is the whole reason the margin is
derived rather than restated.

The mechanism, so you can reason about it rather than trust it: focus scrolls an element into view
only when it needs to. A row that is *already* inside the scroll port but sitting under the sticky
header gives the browser no reason to scroll — so it stays hidden. An unsatisfied
`scroll-margin-block-start` is what forces the scroll that lifts it clear. Measured on the
default-density story, against a 214px header: at `0px` and at `64px` the focused row stayed at
y=88, entirely behind the header; at `288px` it moved to y=288, clear.

The element does not measure its own live box to close this gap, because observing layout is the
class of behaviour it is deliberately barred from owning — the same boundary that keeps the timer
out of it.

Set `--sk-layout-page-header-sticky-offset` when something else already occupies the top of the
scroll region, and `--sk-layout-page-header-sticky-layer` if the header must stack differently
against your own positioned content.

#### The scroll-container contract, stated once

`sk-app-shell` owns page geometry; `sk-page-header` owns stickiness **within the region the shell
gives it**. `position: sticky` resolves against the nearest scrolling ancestor, so the two have to
agree on one thing and only one: **the element that scrolls must be an ancestor of the header, and
the header must not be inside a separate scroll container from the content it sits above.** In the
shell composition at the top of this page that is satisfied by the page scrolling; if you make the
shell's main region its own scroll container, put the header inside that region rather than beside
it. This paragraph is the only place that contract is written down, and it is written on the
header because the header is what breaks when it is violated.

#### What the header still does not do

Everything #145 ruled out stays ruled out, and stickiness does not soften it. The header starts no
timer, reads no clock, computes no relative age, polls nothing, observes no scrolling, and owns no
"live" state. The freshness string and any live/paused indicator are slotted content, rendered
verbatim; the consumer owns the timer that produces them.

## Time series chart

`sk-time-series-chart` draws a consumer-owned line chart over a **time** axis. It is not a widened
bar chart and shares no source with one: it exists because a bar chart's model has no way to say
"this interval has no observation", so an absent bar and a zero bar are the same picture.

**A missing interval is a value.** A point's `value` may be `null`, which means *no observation in
this interval*. The line **breaks** there, the interval is drawn as a gap, and the paired table
reports it as `No data`. It is never interpolated across and never drawn to the baseline. Leading
and trailing nulls keep their place, so the window you supplied is the window that renders.

```js
const chart = document.querySelector('sk-time-series-chart');
chart.label = 'Throughput over time';
chart.description = 'Requests per second, by hour, as collected';
chart.gapThreshold = 3 * 60 * 60 * 1000;   // supplied, never inferred
chart.series = Object.freeze([
  Object.freeze({
    id: 'throughput',
    name: 'Throughput',
    points: Object.freeze([
      Object.freeze({ id: 'h0', at: 1767225600000, value: 40, displayValue: '40 req/s', label: '00:00', resolution: 'raw' }),
      Object.freeze({ id: 'h1', at: 1767229200000, value: null, displayValue: 'unused', label: '01:00', resolution: 'raw' }),
      Object.freeze({ id: 'h2', at: 1767232800000, value: 62, displayValue: '62 req/s', label: '02:00', resolution: 'hour' }),
    ]),
  }),
]);
chart.selectable = true;
chart.selectedId = 'h0';
chart.addEventListener('sk-time-series-chart-select', (event) => {
  // A request, not an internal state change: selection stays consumer-controlled.
  chart.selectedId = event.detail.pointId;
});
```

`at` is used for **position only** — unequal spacing is therefore meaningful and visible.
`displayValue` and `label` render verbatim; the element parses no formatted text, chooses no
window, reads no clock, sets no timer, fetches nothing, and never downsamples, smooths or fits a
trend. `resolution` is supplied per point; a maximal run of one resolution is a segment, an `hour`
segment is drawn heavier with hollow markers, a rule marks the change, and the axis does not
rescale across it.

**Every value is published, always.** The paired table is in the DOM at all times, in source order,
one row per point, carrying the series name, the label, the display string (or `No data`) and the
row's resolution. Nothing is hover-only, and the table is also the narrow-viewport treatment: it
scrolls rather than reflowing, and it takes the `role="region"`/`aria-label`/`tabindex="0"` triad
only when it genuinely overflows. The SVG is `aria-hidden` and carries no accessible content.

**Differentiation uses three channels, not one.** Series are told apart by ink
(`--sk-chart-series-1..4`), by dash pattern (`--sk-chart-dash-1..4`) and by marker shape — circle,
square, triangle, diamond, cycling after four. Ink is the channel that collapses under
`forced-colors: active` and in greyscale; the other two are why the chart is still readable there,
and why the gap is drawn with a dashed **stroke** rather than only a fill.

A `gapThreshold` you supply, in the same unit as your timestamps, annotates any run at or beyond
it with a visible note. Zero, negative and non-finite thresholds annotate nothing, and the element
never infers one.

The five attributes are `label`, `description`, `selectable`, `selected-id` and `gap-threshold`;
`series` is the single property-only input, delivered as a property and never serialized.
`sk-time-series-chart-select` carries a frozen `{ seriesId: string; pointId: string }` detail with
`bubbles: true`, `composed: true`, and **`cancelable: true`**. Cancelling it suppresses the one
default action the element owns — moving focus to the activated point — and nothing else; selection
was never the element's to change. Point ids must be unique across the whole chart, because
`selectedId` is a point id. An empty collection renders "No data to display"; malformed data fails
closed as "Chart unavailable".

The public parts are `chart`, `legend`, `series-name`, `plot`, `line`, `marker`, `gap`,
`resolution-boundary`, `gap-notes`, `gap-note`, `scroller`, `table`, `row`, `value`, `point` and
`empty-state`. `point` exists only when `selectable`; `gap-notes` and `gap-note` only when a
threshold is supplied and met.


## Bar chart

`sk-bar-chart` projects a consumer-owned numeric series. Assign `series` as a JavaScript property;
it is deliberately not an attribute and is never serialized. Every datum must have a unique,
nonblank `id`, a nonblank `label`, a finite nonnegative numeric `value`, and a nonblank authored
`displayValue`. An empty array renders “No data to display”; malformed data fails closed as “Chart
unavailable”. The component does not fetch, aggregate, sort, localize, or format values.

```js
const chart = document.querySelector('sk-bar-chart');
chart.label = 'Attributed return over time';
chart.description = 'Last 30 days';
chart.series = Object.freeze([
  Object.freeze({ id: 'aug-11', label: 'Aug 11', value: 320, displayValue: '€320' }),
  Object.freeze({ id: 'aug-18', label: 'Aug 18', value: 510, displayValue: '€510' }),
]);
chart.selectable = true;
chart.selectedId = 'aug-18';
chart.addEventListener('sk-bar-chart-select', (event) => {
  // A request, not an internal state change: selection stays consumer-controlled.
  chart.selectedId = event.detail.id;
});
```

The four attributes are `label`, `description`, `selectable`, and `selected-id`; `series` is the
single property-only input. `sk-bar-chart-select` carries readonly `{ id: string }` detail with
`bubbles: true`, `composed: true`, and `cancelable: false`. It fires only from a valid selectable
datum. The public parts are `chart`, `plot`, `item`, `bar`, `value`, `label`, and `empty-state`.

The chart's closed token contract is `--sk-border-default`, `--sk-border-strong`,
`--sk-border-focus`, `--sk-border-width-1`, `--sk-border-width-2`,
`--sk-color-data-baseline`, `--sk-color-data-grid`, `--sk-color-data-series-primary`,
`--sk-fg-body`, `--sk-fg-default`, `--sk-fg-muted`, `--sk-font-mono`, `--sk-font-sans`,
`--sk-motion-duration-fast`, `--sk-motion-ease-out`, `--sk-radius-md`, `--sk-radius-sm`,
`--sk-space-2`, `--sk-space-3`, `--sk-space-4`, `--sk-space-5`, `--sk-space-6`,
`--sk-space-10`, `--sk-surface-card`, `--sk-surface-muted`, `--sk-surface-pill`,
`--sk-text-sm`, `--sk-text-xs`, and `--sk-weight-semibold`. Use the named parts for narrowly
scoped consumer adjustments; internal class names are not API.

## Transition matrix

`sk-transition-matrix` presents aggregate moves by route and consumer-labelled time bucket. Assign
the structured inputs as JavaScript properties; arrays are not serialized to attributes.

```js
const matrix = document.querySelector('sk-transition-matrix');
matrix.columns = Object.freeze([
  Object.freeze({ id: 'previous', label: 'Previous' }),
  Object.freeze({ id: 'current', label: 'Current' }),
]);
matrix.routes = Object.freeze([
  Object.freeze({
    id: 'queued-active',
    label: 'Queued to active',
    tone: 'forward',
    values: Object.freeze({ previous: 3, current: 5 }),
  }),
]);
matrix.selectable = true;
matrix.selectedRouteId = 'queued-active';
matrix.addEventListener('sk-transition-matrix-select', (event) => {
  // The event requests a change. The consumer remains the owner of selectedRouteId.
  matrix.selectedRouteId = event.detail.routeId;
});
```

The seven public properties are `columns`, `routes`, `selectedRouteId`, `selectable`,
`windowLabel`, `description`, and `selectionHint`. The selection event bubbles across shadow
boundaries and is non-cancelable because the element has no default selection action to prevent.
The element derives move totals and bar ratios from supplied cells. It does not accept or calculate
current inventory, fetch data, format dates, navigate, or update application state.

## Metric and evidence chain

`sk-metric` presents one consumer-supplied label and opaque display value as a native `<dl>`
definition relationship. Its five attributes are `label`, `display-value`, `annotation`, `tone`,
and `compact`; the element does not parse or calculate the displayed text. The optional tone is
one of `neutral`, `info`, `success`, or `attention`. Its public parts are `metric`, `label`,
`value`, `annotation`, and `empty-state`.

`sk-evidence-chain` composes real `sk-metric` descendants as direct items of a native ordered
list. Supply its only public field, `stages`, as a readonly JavaScript property:

```js
const chain = document.querySelector('sk-evidence-chain');
chain.stages = Object.freeze([
  Object.freeze({ id: 'received', label: 'Items received', displayValue: '128' }),
  Object.freeze({
    id: 'verified',
    label: 'Items verified',
    displayValue: '91%',
    annotation: 'Sampled',
    tone: 'success',
  }),
]);
```

The consumer owns identifiers, order, formatting, calculations, and domain meaning. The chain
only projects the supplied values, adds decorative connectors, and fails invalid whole inputs
closed. Its parts are `list`, `stage`, `connector`, and `empty-state`; a composed approved layout
may wrap it in the existing `sk-grid` and `sk-card` elements, while annotated stages contain the
real `sk-pill-tag` used by `sk-metric`.

Neither component has a styles-layer static form. The chain's readonly structured data must use
property assignment, which static HTML cannot preserve without inventing a serialization and
parsing policy. Consumers needing no JavaScript should author the native `<dl>`/`<ol>` structures
directly instead.

## Workflow board and lanes

`workflow-board` and `workflow-lane` are styles-only native-HTML families. Load both CSS files;
there is deliberately no `<sk-workflow-board>` or `<sk-workflow-lane>` custom element.

```html
<link rel="stylesheet" href="/node_modules/@spec-kitty/styles/dist/workflow-board/sk-workflow-board.css" />
<link rel="stylesheet" href="/node_modules/@spec-kitty/styles/dist/workflow-lane/sk-workflow-lane.css" />

<div class="sk-workflow-board">
  <h2 id="work-package-board-title">Work Packages</h2>
  <div class="sk-workflow-board__scroller">
    <section class="sk-workflow-lane" aria-labelledby="planned-title">
      <header class="sk-workflow-lane__header">
        <h3 class="sk-workflow-lane__title" id="planned-title">Planned</h3>
        <span class="sk-workflow-lane__count" aria-label="2 work packages">2</span>
      </header>
      <ol class="sk-workflow-lane__list">
        <li>Consumer-owned work package content</li>
        <li>Another consumer-owned work package</li>
      </ol>
    </section>
  </div>
</div>
```

This one-lane example fits its scroller, so the overflow-only region, accessible name, and
tab stop are all absent.

The selector vocabulary is exactly `.sk-workflow-board`, `.sk-workflow-board__scroller`,
`.sk-workflow-lane`, `.sk-workflow-lane__header`, `.sk-workflow-lane__title`,
`.sk-workflow-lane__count`, and `.sk-workflow-lane__list`. Apply each lane block directly to a
native `<section>` named by its own native `h2`–`h6`. Apply the list class to an `<ol>` and keep
each work package as a direct `<li>` in source order; do not insert a wrapper or forge list roles.

The count, wording, IDs, heading levels, lane/item order, item markup, tone, empty copy, and mobile
selection are consumer-owned. Keep maintained counts equal to direct list-item cardinality. An
empty lane still has an empty `<ol>`; place supplied empty treatment after it as a sibling, never
as a fake list item. On a narrow route, render the one consumer-selected lane through the same
seven selectors; the library stores no active lane and hides no peers.

The scroller gets `role="region"`, exactly one accessible naming method, and `tabindex="0"`
together only while it genuinely overflows. A fitting scroller omits all three. Dynamic consumers
can synchronize that all-or-none state after relevant content or layout changes:

```js
function syncWorkflowScroller(scroller, labelledBy) {
  const overflowing = scroller.scrollWidth > scroller.clientWidth;
  if (overflowing) {
    scroller.setAttribute('tabindex', '0');
    scroller.setAttribute('role', 'region');
    scroller.removeAttribute('aria-label');
    scroller.setAttribute('aria-labelledby', labelledBy);
  } else {
    scroller.removeAttribute('tabindex');
    scroller.removeAttribute('role');
    scroller.removeAttribute('aria-label');
    scroller.removeAttribute('aria-labelledby');
  }
}
```

That example is consumer code, not a package helper: choose when to re-run it from your own render
and layout lifecycle. Do not add a library observer or resize handler. Presentation uses neutral
tokens only: `--sk-layout-workflow-lane-min-inline-size`, `--sk-space-*`, `--sk-font-*`,
`--sk-text-*`, `--sk-weight-*`, `--sk-surface-card`, `--sk-surface-pill`, `--sk-fg-body`,
`--sk-fg-default`, `--sk-border-default`, `--sk-border-focus`, `--sk-border-width-*`, and
`--sk-radius-*`. Lane names never choose a status tone.

## Installation

```bash
npm install @spec-kitty/styles @spec-kitty/tokens     # the CSS, every component
npm install @spec-kitty/elements @spec-kitty/tokens   # the migrated custom elements
npm install @spec-kitty/react                         # optional: JSX typing for React
```

> Note: these packages must be published to npm before the import paths below work in consumer projects. Until then, install from the local repository using `npm link` or a path dependency.

---

## Buttons

Primary and secondary call-to-action buttons used to drive user actions.

**As a custom element** — `sk-button` is migrated, so it needs no wrapper:

```html
<script type="module" src="/node_modules/@spec-kitty/elements/dist/elements.js"></script>

<sk-button variant="primary">Get started</sk-button>
<sk-button variant="secondary">Learn more</sk-button>
<sk-button variant="primary" size="sm">Book demo</sk-button>
<sk-button variant="ghost" size="icon" label="Refresh evidence">↻</sk-button>
```

Set `href` and it renders an anchor instead of a button, with the same class list — which is
what the demo pages actually need, since every button-styled thing there is a link:

```html
<sk-button variant="primary" href="/docs">Read the docs</sk-button>
```

The visible label or glyph is slotted content. `size="icon"` creates a 40px square control and
requires a nonblank `label`, which is forwarded to the real inner button or anchor as its
accessible name. The glyph and its meaning remain consumer-owned. `disabled` reaches the real
`<button>` and is deliberately ignored on the anchor form, because a disabled link is not a thing
HTML has. Use `sk-button::part(button)` to reach the rendered `<button>` or `<a>`.

The control lives in a shadow root, so it cannot submit an enclosing form. Use this element for
actions and links rather than as an implicit form-submit button.

**HTML:**

```html
<button class="sk-button sk-button--primary">Get started</button>
<button class="sk-button sk-button--secondary">Learn more</button>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-button-html--default)

---

## Navigation

Top-level navigation bar with logo, pill nav links, theme toggle, and external link pills.

**The pill sub-component is migrated**; the nav bar itself is CSS only.

```html
<sk-nav-pill label="Main">
  <a href="#" class="sk-nav-pill__item">Docs</a>
  <a href="#" class="sk-nav-pill__item">About</a>
</sk-nav-pill>
```

It fires `sk-nav-pill-toggle` before the open state changes, with
`detail: { open: boolean }`. The event is cancelable — `preventDefault()` abandons the change.

**As CSS (every consumer):**

```html
<nav class="sk-nav">
  <a class="sk-nav__logo" href="/"><img src="/assets/logo.png" alt="Spec Kitty"></a>
  <ul class="sk-nav__links">
    <li><a class="sk-nav__pill" href="/platform">Platform</a></li>
    <li><a class="sk-nav__pill" href="/docs">Docs</a></li>
  </ul>
</nav>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/navigation-sknavpill-html--default)

---

## Tags

Pill-shaped tags used to label and categorise content inline.

**As a custom element** — `sk-pill-tag` is migrated, so it needs no wrapper:

```html
<script type="module" src="/node_modules/@spec-kitty/elements/dist/elements.js"></script>

<sk-pill-tag>Design system</sk-pill-tag>
<sk-pill-tag variant="green">Shipped</sk-pill-tag>
<sk-pill-tag shape="eyebrow">New</sk-pill-tag>
```

`variant` (colour) and `shape` (the eyebrow form) are independent axes and compose. The label
is slotted content. Use `sk-pill-tag::part(tag)` to reach the pill itself.

**HTML:**

```html
<span class="sk-pill-tag">Design system</span>
<span class="sk-pill-tag sk-pill-tag--eyebrow">New</span>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skpilltag-html--default)

---

## Check bullets

Ticked list items, for feature and requirement lists.

**As a custom element** — `sk-check-bullet` is migrated, so it needs no wrapper:

```html
<script type="module" src="/node_modules/@spec-kitty/elements/dist/elements.js"></script>

<ul role="list">
  <sk-check-bullet>Requirements captured up front</sk-check-bullet>
  <sk-check-bullet state="pending">Independent review pending</sk-check-bullet>
  <sk-check-bullet state="complete" icon="★">Decisions live with the feature</sk-check-bullet>
</ul>
```

Keep `role="list"` on the `<ul>`. The element sets `role="listitem"` on itself, because a
custom element between a `<ul>` and its content is not a list item — that half is the element's
job. The `role="list"` is needed for a different reason: `list-style: none` makes several
browsers drop the list semantics entirely, and these styles remove the bullets. An earlier
revision of this paragraph claimed the `<ul>`'s role had to be "restated for the pairing to
survive", which is not how ARIA works — a `<ul>` already maps to `role=list`. A lens caught it. The tick is `aria-hidden` — the slotted
text is the accessible content — and `icon` replaces it. Two parts: `bullet` (the row) and
`icon` (the tick).

`state` is either `complete` or `pending`; omitting it keeps the backward-compatible complete
presentation. Each row includes visually hidden “Complete” or “Pending” text, so state is not
communicated by the decorative glyph or colour alone. This remains a passive list item, not a
checkbox, switch, task editor, or progress calculation: the consumer owns state and any action
that changes it.

**HTML:**

```html
<li class="sk-check-bullet">
  <span class="sk-check-bullet__icon" aria-hidden="true">✓</span>
  <span class="sk-check-bullet__state">Complete</span>
  Requirements captured up front
</li>
<li class="sk-check-bullet sk-check-bullet--pending">
  <span class="sk-check-bullet__icon" aria-hidden="true">○</span>
  <span class="sk-check-bullet__state">Pending</span>
  Independent review pending
</li>
```

Its `--sk-*` dependencies are `--sk-space-3`, `--sk-fg-default`, `--sk-fg-muted`,
`--sk-font-sans`, `--sk-text-base`, `--sk-on-tint-mint`, `--sk-weight-bold`,
`--sk-weight-extrabold`, and `--sk-border-width-1`. The pre-existing line height and icon
alignment declarations remain unchanged rather than becoming new public tokens.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skcheckbullet-html--default)

---

## Breadcrumbs

Breadcrumbs are native navigation and ordered-list markup styled by `.sk-breadcrumbs`; there is
no `sk-breadcrumbs` custom element.

```html
<nav class="sk-breadcrumbs" aria-label="Breadcrumb">
  <ol class="sk-breadcrumbs__list">
    <li class="sk-breadcrumbs__item">
      <a class="sk-breadcrumbs__link" href="/repositories">Repositories</a>
    </li>
    <li class="sk-breadcrumbs__item">
      <a class="sk-breadcrumbs__link" href="/repositories/example">Example</a>
    </li>
    <li class="sk-breadcrumbs__item">
      <a class="sk-breadcrumbs__link" href="/repositories/example/detail" aria-current="page">Detail</a>
    </li>
  </ol>
</nav>
```

The consumer owns destinations, labels, route matching, and which one link carries
`aria-current="page"`. Keep the native `nav > ol > li > a` structure. Add
`.sk-breadcrumbs--narrow` when composing into a narrow column; the list then contains its own
horizontal overflow without shortening accessible link text.

Its exact token dependencies are `--sk-fg-muted`, `--sk-fg-subtle`, `--sk-fg-default`,
`--sk-font-sans`, `--sk-text-sm`, `--sk-weight-semibold`, `--sk-space-1`, `--sk-space-2`,
`--sk-space-4`, `--sk-space-12`, `--sk-radius-sm`, `--sk-border-width-2`, and
`--sk-border-focus`.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skbreadcrumbs-html--default)

---

## Prose

`.sk-prose` styles native consumer-authored headings, paragraphs, lists, links, code, and tables.
It does not parse Markdown, sanitize HTML, choose heading levels, or manufacture missing content.

```html
<article class="sk-prose">
  <h2>Implementation prompt</h2>
  <p>Keep the supplied structure intact.</p>
  <ul><li>Preserve native semantics.</li></ul>
  <pre role="region" aria-label="Command" tabindex="0"><code>spec-kitty next</code></pre>
</article>
```

Give a genuinely overflowing code region a distinct accessible name and keyboard focus as shown.
For multi-column values, compose the existing `.sk-data-table` and its scroller inside the prose
instead of treating the values as paragraphs. When prose is absent, render the passive
`.sk-empty-state` recipe; use `sk-notice` only when a change must be announced. The consumer owns
that distinction as well as parsing, sanitization, heading hierarchy, and copy.

Its exact token dependencies are `--sk-fg-body`, `--sk-fg-default`, `--sk-color-accent`,
`--sk-surface-muted`, `--sk-border-default`, `--sk-border-focus`, `--sk-border-width-1`,
`--sk-border-width-2`, `--sk-font-sans`, `--sk-font-display`, `--sk-font-mono`,
`--sk-text-base`, `--sk-text-sm`, `--sk-text-xl`, `--sk-text-2xl`,
`--sk-weight-semibold`, `--sk-radius-sm`, `--sk-radius-md`, `--sk-space-1`, `--sk-space-2`,
`--sk-space-3`, `--sk-space-4`, `--sk-space-5`, `--sk-space-7`, and `--sk-space-12`.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skprose-html--prompt)

---

## Event timeline

Use `.sk-event-timeline` on a native ordered list when entries form a chronology. The consumer
supplies and orders every event, actor, timestamp, display string, detail, and trust marker.

```html
<ol class="sk-event-timeline">
  <li class="sk-event-timeline__item">
    <p class="sk-event-timeline__summary">1. Evidence recorded</p>
    <p class="sk-event-timeline__metadata">
      <span>Reviewer name</span><time datetime="2026-09-07T09:00:00Z">09:00 UTC</time>
    </p>
    <p class="sk-event-timeline__content">Optional supporting content.</p>
    <span class="sk-event-timeline__marker">Verified by consumer</span>
  </li>
</ol>
```

The class family neither sorts events nor reads clocks, formats time, infers trust, or applies
retention rules. Use `.sk-data-table` instead when values are comparable rows and columns rather
than a sequence. If history is unavailable, render passive `.sk-empty-state` markup; an announced
`sk-notice` is a separate consumer decision. `.sk-event-timeline--narrow` constrains the same
native structure without detaching metadata from its owning `<li>`.

Its exact token dependencies are `--sk-fg-body`, `--sk-fg-default`, `--sk-fg-muted`,
`--sk-on-tint-sky`, `--sk-on-tint-mint`, `--sk-surface-page`, `--sk-border-strong`,
`--sk-border-width-1`, `--sk-border-width-2`, `--sk-font-sans`, `--sk-text-base`,
`--sk-text-sm`, `--sk-weight-medium`, `--sk-weight-semibold`, `--sk-radius-pill`,
`--sk-space-1`, `--sk-space-2`, `--sk-space-3`, `--sk-space-4`, `--sk-space-6`,
`--sk-space-7`, and `--sk-space-12`.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skeventtimeline-html--default)

---

## Site footer

A brand column, link columns and a legal line, in a grid that collapses to one column.

**As a custom element** — `sk-site-footer` is migrated, so it needs no wrapper:

```html
<script type="module" src="/node_modules/@spec-kitty/elements/dist/elements.js"></script>
<link rel="stylesheet" href="/node_modules/@spec-kitty/styles/dist/site-footer/sk-site-footer.css" />

<sk-site-footer
  wordmark="Your Brand"
  tagline="One sentence on what you do."
  headingone="Product"
  headingtwo="Connect"
  legal="© 2026 Your Company."
>
  <li slot="column-one"><a href="#" class="sk-site-footer__link">Platform</a></li>
  <li slot="column-two"><a href="#" class="sk-site-footer__link">Contact</a></li>
</sk-site-footer>
```

**Text is a property; only the link items are slotted.** The element owns the grid, both `<nav>`s,
the headings, the `<ul>`s, the divider and the legal line — so `<ul>`/`<li>` semantics stay intact
and your `<li>` lands directly inside the element's own list.

**The stylesheet link is needed for the link colour**, and only for that: everything else is a
shadow node the element styles itself, and your `<li>` is reachable via `::slotted(li)` because it
is directly assigned. The `<a>` inside it is one level deeper, so it takes its colour from the
same sheet loaded in your document. Without it those links fall back to the browser's default
blue, which fails contrast on the dark theme.

Omit `legal` and the divider above it is not rendered either.

Use `sk-site-footer::part(grid)` for a column layout outside the provided `1.5fr 1fr 1fr`.

**HTML:**

```html
<footer class="sk-site-footer">…</footer>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-sitefooter-html--default)

---

## Content markers

Eyebrow labels and section banners used to introduce sections and add visual hierarchy.

**As a custom element** — `sk-section-banner` is migrated, so it needs no wrapper:

```html
<script type="module" src="/node_modules/@spec-kitty/elements/dist/elements.js"></script>

<sk-section-banner variant="purple">Version 2.x — event architecture</sk-section-banner>
```

The label is slotted content, not a property: a banner's text belongs to your page. Omit
`variant` and you get the neutral banner — the base class paints no background of its own, so
there is no "plain" form to fall back to.

**HTML:**

```html
<span class="sk-eyebrow">Getting started</span>
<div class="sk-section-banner sk-section-banner--neutral">
  <span class="sk-section-banner__dot" aria-hidden="true">●</span>
  <span class="sk-section-banner__label">What's new</span>
</div>
```

The variant class is required — `.sk-section-banner` alone sets no colour. This markup is
generated; copy it from `packages/styles/src/section-banner/sk-section-banner.html` rather than
retyping it.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-sksectionbanner-html--default)

---

## Operational feed primitives

Four controlled/presentational elements provide the reusable heading, row, status, and visual-marker
pieces of an operational feed. They have no static HTML form: their contracts are defined by
consumer slot composition and a live row-intent event, so a string builder would create a second
projection vocabulary.

```html
<sk-section-header>
  <span slot="eyebrow">Recent activity</span>
  <h2 slot="title">Repository activity</h2>
  <p slot="description">What needs attention now.</p>
  <span slot="metadata">3 repositories</span>
  <sk-button slot="action" variant="ghost" size="sm">View all</sk-button>
</sk-section-header>

<ul>
  <li>
    <sk-action-row row-id="activity-17" selectable selected layout="card">
      <sk-entity-marker slot="marker" label="Mia" size="sm" shape="circle">
        <img src="/people/mia.webp" alt="">
      </sk-entity-marker>
      <strong slot="title">team-landing-pivots</strong>
      <code slot="reference">spec-kitty/e2e-team-landing</code>
      <sk-status-indicator slot="tags" tone="success" pulsing>
        <span slot="marker">●</span>
        Live claim
      </sk-status-indicator>
      <time slot="metadata">2 hours ago</time>
      <span slot="supporting">Claimed by Mia · supplied by the application</span>
      <sk-button slot="controls" size="sm">Inspect</sk-button>
    </sk-action-row>
  </li>
</ul>

<script type="module">
  document.querySelector('sk-action-row').addEventListener('sk-action-row-activate', (event) => {
    console.log(event.detail.id);
  });
</script>
```

The consumer owns the native heading and chooses its level; `sk-section-header` never generates a
heading. The consumer also owns all `ul > li` markup. None of these elements creates a list or
assigns list roles.

`sk-action-row` is activatable only when `selectable` is present and `row-id` contains non-whitespace
content. Its internal primary trigger is a real `button`; projected `controls` remain siblings, so
native links, buttons, and `sk-button` keep their own behavior. Pointer, Enter, and Space activation
emit one `sk-action-row-activate` with exact `{ id }`, `bubbles: true`, `composed: true`, and
`cancelable: false`. The element owns no navigation or other default action. `selected` remains a
consumer-controlled input and is exposed only as `aria-current="true"` on the stable row surface.
`layout="card"` reflows that same trigger, content and controls into a compact vertical
presentation; it does not create a semantic card or a status axis. The optional `supporting` slot is
a passive, full-width secondary line in either layout and is externally targetable through
`::part(supporting)`. Controls still belong in `controls`, not in `supporting`.

`sk-status-indicator` accepts `neutral`, `info`, `success`, `attention`, `danger`, or `recovery` as
presentation tones. Visible status copy is always consumer-authored, and the component does not map
domain words to colors. An unknown tone renders as neutral while preserving the supplied text.
`pulsing` is an optional supplied presentation flag on the marker only: it adds no timer, heartbeat,
claim-expiry rule, liveness inference or announcement. Keep visible consumer-authored text such as
“Live claim”; motion is never the meaning carrier.

`sk-entity-marker` never fetches identity or generates initials. Supply the exact icon, initials,
or short mark to render. A non-empty `label` makes the mark meaningful and names it; an absent or
whitespace-only label makes it decorative and hides it from assistive technology. `size="sm"` and
`shape="circle"` are independent: either may be omitted or used alone. A directly slotted image is
contained and cover-cropped inside every size/shape combination. For a meaningful image, put the
single name on the host and keep the consumer-owned image decorative:

```html
<sk-entity-marker label="Mia" size="sm" shape="circle">
  <img src="/people/mia.webp" alt="">
</sk-entity-marker>
```

The component never rewrites `alt`. A nonempty image `alt` beside a nonempty host `label` is a
consumer error because it introduces a duplicate name. Consumers own image bytes, alternate-text
choice, initials, identity lookup and any trust or liveness interpretation.

---

## Notices

`sk-notice` is a block-level status message about a page or a region of it — the surface a build
failure, a degraded queue or a "connection lost, retrying" strip belongs on. It is **not** a toast:
it has no positioning, no stacking, no queueing, no auto-dismiss timer and no portal. The consumer
decides where it appears and whether it exists at all.

```html
<sk-notice tone="danger" announce="assertive" dismissible
           dismiss-label="Dismiss the deploy failure notice">
  <h3 slot="heading">Deploy failed</h3>
  <p>Three of twelve targets rejected the release bundle.</p>
  <sk-button slot="actions">Retry the deploy</sk-button>
</sk-notice>

<script type="module">
  const notice = document.querySelector('sk-notice');

  // A message that CHANGES is announced again. Set the property; do not rebuild the element.
  notice.message = 'Retrying in 2 seconds';

  notice.addEventListener('sk-notice-dismiss', (event) => {
    // The element did NOT remove itself. This is yours to decide.
    notice.remove();
  });
</script>
```

**Announcement is an explicit property, not a side effect of tone.** `announce` takes `off` (the
default), `polite` or `assertive`. A `danger` notice with `announce="off"` is silent; a `neutral`
one with `announce="assertive"` interrupts. Nothing about the tone decides it, and a notice that is
never announced is still perfectly usable as a static message — that is what `off` is for.

**A changed message is announced again.** `message` is a reactive property, so assigning a new
value re-renders the live region's text and the change is announced. This is the one thing to get
right: the repository's own `sk-form-input` records the opposite failure twice, where the announced
text changed and nothing re-rendered, leaving `role="alert"` silent and `aria-describedby` pointing
at text that was no longer true.

**One caveat, and it is the consumer's to handle.** The live region is created with its role at the
element's first render, ahead of any message you assign afterwards. If you build a notice with
`message` already set and insert it in one step, the region and its content enter the DOM together,
which assistive technology does not reliably announce. **Insert the notice first, then assign
`message`.** The element cannot close this itself without deferring its own first paint behind a
timer, which is exactly the toast behaviour it is defined not to have.

Since #228 that ordering helps but no longer produces an *empty* region when you slot a heading:
the heading is inside the region, so the region is born holding it. The message still arrives as a
mutation to a node that already existed, which is the part that matters.

**The heading level is yours, and the heading is announced.** Slot a native heading; the element
generates none, the same rule `sk-section-header` follows. It renders **inside** the live region and
first within it, so `<h3 slot="heading">Deploy failed</h3>` with `message="Retrying in 5s"` is heard
as "Deploy failed. Retrying in 5s" rather than the detail alone. Slot the body as `message` or as
real markup — the default slot renders inside the live region too, so multi-paragraph content is
announced.

Both live-region roles the element renders — `role="status"` for `polite`, `role="alert"` for
`assertive` — are implicitly `aria-atomic="true"`, so **the whole region is re-read on every
change**, heading included. A notice that updates a countdown repeats its headline on every tick.
If you want a headline that is seen and never heard, put it outside the notice.

**If you style `::part(body)`, that box grew.** Since #228 it encloses the heading rather than
starting below it — measured at 600px with a heading, a message and actions, it moves from
`top 32px, height 22px` to `top 0, height 54px`. The notice's own layout is unchanged, but a
background, padding, border or `border-radius` on `::part(body)` now frames the headline too.
`::part()` cannot be followed by a combinator into the shadow tree, so there is no way to re-exclude
the heading from inside: move the decoration to `::part(notice)` or `::part(content)`, or compensate
on `::part(heading)`.

**Dismissal is controlled.** `dismissible` renders a real `<button>` with a required accessible name
(`dismiss-label`, defaulting to "Dismiss notice"). Activating it emits one `sk-notice-dismiss` with
`{ tone }`, `bubbles: true`, `composed: true` and `cancelable: true`. **The element never removes
itself** in either branch. What `preventDefault()` cancels is the element's own focus move — nothing
else, because nothing else is the element's to do.

**Focus lands on the notice host** after a dismissal that is not cancelled; the element gives itself
`tabindex="-1"` for that purpose unless you supplied your own `tabindex`. The reason is that the
dismiss button is inside the shadow root and is the node most likely to stop existing the moment
your handler runs — leaving focus there drops it to `<body>` as soon as you remove the notice. The
host is still in the document while your handler runs, so you have a defined place to redirect from.
If you remove the notice, move focus somewhere deliberate yourself.

**Tone is never the only carrier of meaning.** Each tone brings a marker glyph and a widened
inline-start edge as well as a surface colour, and the message text is yours and carries the meaning
for assistive technology. The six tones are the same vocabulary `sk-status-indicator` and
`sk-card[status]` use, over the same `--sk-status-*` / `--sk-on-status-*` tokens — there is one
scale, not three. An unknown tone renders as `neutral` and warns, keeping the message visible.

A notice **may slot an `sk-status-indicator`**; an indicator never becomes a notice. They differ in
every axis but the tone vocabulary: an indicator is inline, passive and lives inside a row, while a
notice is block, optionally announced, and owns a region.

---

## Layout

A responsive grid for card listings and reference pages. Bounded on purpose: two, three or four
columns, all collapsing to one below 720px.

**As a custom element** — `sk-grid` is migrated, so it needs no wrapper:

```html
<sk-grid variant="cols-3" gap="6">
  <sk-card>…</sk-card>
  <sk-card>…</sk-card>
  <sk-card>…</sk-card>
</sk-grid>
```

Need a layout outside that set? Use `sk-grid::part(grid)` rather than asking for another
variant — the part exists for exactly that.

**HTML:**

```html
<div class="sk-grid sk-grid--cols-3 sk-grid--gap-6">
  <article class="sk-card">…</article>
</div>
```

---

## Cards

Surface containers for grouping related content, used in feature grids, blog listings, and comparison layouts.

**As a custom element** — migrated, so it needs no wrapper:

```html
<script type="module" src="/node_modules/@spec-kitty/elements/dist/elements.js"></script>

<sk-card variant="blue">
  <h3>Structured requirements</h3>
  <p>Developers spend time building, not being blocked on finalized requirements.</p>
</sk-card>
```

`variant` accepts `blue` or `purple`; omit it for the default surface. `inset` swaps the surface
token for a card nested inside another.

### The operational status axis

`status` is a **second** axis: `variant` is the brand/decorative one, `status` is the operational
one, and a card may carry both. It accepts the same six tones `sk-status-indicator` does —
`neutral`, `info`, `success`, `attention`, `danger`, `recovery` — because there is one tone
vocabulary in this library, not one per component.

**The two axes are orthogonal as inputs and precedence in rendering.** Both may be set, both
reflect, neither errors — but while a `status` is present the operational tone **supersedes** the
brand variant's surface and edge entirely, so `variant="blue" status="danger"` and
`status="danger"` render identically. Set `variant` for how the card looks when it has no
operational state to report; do not expect it to tint one that does.

**You supply the tone.** The card holds no domain mapping: it will not decide that a string
containing "failed" means `danger`, and an unrecognised value renders the base card and warns
rather than throwing.

**The tone is not the message.** The card paints a surface and an edge; the meaning belongs to the
text you slot in. A status card is a composition, and there is deliberately no `sk-status-card`
element — the `<dl>` and `<details>` below must stay in light DOM, which a wrapper's shadow root
would break (see ADR-10's styles-only ruling and #92):

```html
<sk-card status="danger">
  <sk-status-indicator tone="danger"><span slot="marker">●</span>Delivery blocked</sk-status-indicator>

  <dl class="sk-facts sk-facts--two-col">
    <dt class="sk-facts__term">Owner</dt><dd class="sk-facts__value">Ada Lovelace</dd>
    <dt class="sk-facts__term">Region</dt><dd class="sk-facts__value">us-east-1</dd>
  </dl>

  <details class="sk-disclosure">
    <summary class="sk-disclosure__summary">Detail</summary>
    <div class="sk-disclosure__body"><p>Consumer-supplied.</p></div>
  </details>
</sk-card>
```

The static path carries the same axis as `.sk-card--status-<tone>`, generated into
`@spec-kitty/styles` as `SkCardStatus<Tone>HTML`.

**As CSS (every consumer):**

```html
<div class="sk-card">
  <span class="sk-eyebrow">Feature</span>
  <h3>Structured requirements</h3>
  <p>Developers spend time building, not being blocked on finalized requirements.</p>
</div>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-card--default)

---

## Form fields

Labelled text inputs, selects, and validation states for data-entry surfaces.

> **This section was wrong.** It documented an Angular `SkInputFieldComponent` and
> `.sk-field` / `.sk-field__label` / `.sk-field__input` classes — none of which have ever
> existed in this repository, and the Angular package was deleted in #102. Corrected in #74.

**Custom element** (`@spec-kitty/elements` — the supported form):

```html
<sk-form-input
  name="fullName"
  label="Your name"
  placeholder="Jane Smith"
  description="As it should appear on your invoice."
></sk-form-input>

<sk-form-textarea name="goal" label="What are you trying to ship?" rows="4"></sk-form-textarea>
```

The element owns its own label, description and validation message, and participates in a
native `<form>`: put it inside one, give it a `name`, and its value arrives in `FormData`.

**Why the label is a property and not a `<label>` you write.** ADR-9 §4 built four arrangements
as real elements and ran axe over each. A consumer-supplied `<label>` pointing at a control
inside the element's shadow root **fails** — axe resolves `aria-labelledby` from the attribute
and scopes ID lookups to `getRootNode()`, so no cross-root reference resolves, and labelling the
*host* does not label the inner control. The same applies to `description`, which reaches the
control through `aria-describedby`. Both are therefore properties. There is no `for`/`id` pair
to get wrong, because there is none.

**There is no `<sk-form-field>` wrapper element**, for the same reason: its three accessible
responsibilities — label, description, error region — all cross a root boundary. What a wrapper
would have contributed is `display: flex; flex-direction: column; gap`, which the CSS-only
`.sk-form-field` class already provides:

```html
<div class="sk-form-field">
  <sk-form-input name="email" label="Email address"></sk-form-input>
</div>
```

**CSS-only** (`@spec-kitty/styles`, no JavaScript — unchanged and still published):

```html
<div class="sk-form-field">
  <label class="sk-form-field__label" for="name">Your name</label>
  <input class="sk-input" id="name" type="text" placeholder="Jane Smith">
</div>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/elements-skforminput--default)

---

## Native form select

Use the styles-only form-select primitive directly on a native light-DOM `<select>`. Compose it
with the existing form-field label and description classes so the browser retains option,
keyboard, validation, reset and form-submission behaviour:

```html
<div class="sk-form-field">
  <label class="sk-form-field__label" for="lane">Lane</label>
  <select class="sk-form-select" id="lane" name="lane" aria-describedby="lane-help">
    <option value="planned">Planned</option>
    <option value="review">For review</option>
    <option value="done">Done</option>
  </select>
  <span class="sk-form-field__description" id="lane-help">Choose the Work Package lane.</span>
</div>
```

Add `.sk-form-select--compact` alongside `.sk-form-select` for dense filter bars. These are the
only public form-select classes; there is no `<sk-form-select>` custom element or JavaScript
wrapper. Native light DOM keeps the label association and `option`/`optgroup` semantics in the
same root, and preserves the platform indicator and interaction model.

This closed selector is intentionally different from #180's datalist input: a datalist permits
unmatched free text, while a native select can submit only its authored option set. Consumers own
the options and selected value, listen for `change`, and own application filtering or lane state.

Import the CSS independently from `@spec-kitty/styles/form-select/sk-form-select.css`; generated
fixture markup remains available from the root `@spec-kitty/styles` TypeScript export.

---

## Hero

Full-width hero block with eyebrow, headline, lead copy, checkmark bullet list, and call-to-action buttons.

**CSS only — not yet migrated.**

**As CSS (every consumer):**

```html
<section class="sk-hero">
  <span class="sk-eyebrow">Open-source</span>
  <h1 class="sk-hero__headline">Bring structure to AI-assisted delivery</h1>
  <p class="sk-hero__lead">Developers spend time building, not being blocked on finalized requirements.</p>
  <ul class="sk-hero__bullets">
    <li>Spec -> Plan -> Implement</li>
    <li>No requirement drift</li>
    <li>Works with any AI coding tool</li>
  </ul>
  <div class="sk-hero__ctas">
    <button class="sk-button sk-button--primary">Get started</button>
    <button class="sk-button sk-button--secondary">View on GitHub</button>
  </div>
</section>
```

_No Storybook entry: this is a CSS-only pattern with no story._

---

## Callout

Two-column callout block used for "why/who" benefit statements with bullet lists.

**HTML:**

```html
<div class="sk-callout">
  <div class="sk-callout__panel">
    <h3>Why teams use it</h3>
    <ul>
      <li>Catches requirement drift before code is written</li>
      <li>Works alongside existing AI tools</li>
    </ul>
  </div>
  <div class="sk-callout__panel">
    <h3>Who it is for</h3>
    <ul>
      <li>Engineering leads</li>
      <li>Product managers</li>
      <li>AI coding tool users</li>
    </ul>
  </div>
</div>
```

_No Storybook entry: this is a CSS-only pattern with no story._

---

## Facts

Key/value pairs — status fields, metadata, run details — as a real `<dl>`, never ad-hoc `div`
pairs whose label→value association is visual only.

**CSS-only** (`@spec-kitty/styles`, no JavaScript, no `sk-*` element — #176):

```html
<dl class="sk-facts">
  <dt class="sk-facts__term">Status</dt>
  <dd class="sk-facts__value">Running</dd>
  <dt class="sk-facts__term">Owner</dt>
  <dd class="sk-facts__value">Ada Lovelace</dd>
</dl>
```

`.sk-facts--two-col` lays term/value side by side instead of stacked; `.sk-facts--compact`
tightens the spacing. Values render verbatim — no truncation, no formatting, no count derivation.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skfacts-html--default)

---

## Disclosure

Collapsible content — release notes, expandable detail — as a real `<details>`/`<summary>`,
never a button plus a `hidden` div re-implementing `aria-expanded` by hand.

**CSS-only** (`@spec-kitty/styles`, no JavaScript, no `sk-*` element — #176):

```html
<details class="sk-disclosure">
  <summary class="sk-disclosure__summary">What changed in this release?</summary>
  <div class="sk-disclosure__body">
    <p>Three bug fixes and one performance improvement.</p>
  </div>
</details>
```

The `open` attribute is entirely the consumer's — the platform owns open/closed state and the
class family only styles it. The marker is a `content`-drawn glyph with its accessible-name
contribution suppressed (`content: '▸' / '';`), never the sole affordance for state.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skdisclosure-html--closed)

---

## Data table

Tabular data — run/job lists — as a real `<table>` with `<caption>` and `<th scope>`, with one
documented narrow-width treatment that never reflows cells.

**CSS-only** (`@spec-kitty/styles`, no JavaScript, no `sk-*` element — #176):

```html
<div class="sk-data-table__scroller">
  <table class="sk-data-table">
    <caption>Recent builds</caption>
    <thead>
      <tr><th scope="col">Build</th><th scope="col">Status</th><th scope="col">Cost</th></tr>
    </thead>
    <tbody>
      <tr><td>#1042</td><td>Passed</td><td class="sk-data-table__cell--numeric">$0.42</td></tr>
    </tbody>
  </table>
</div>
```

`.sk-data-table__scroller` is part of the markup contract, not an optional narrow-width extra —
all three authored exemplars carry it. Without it there is no `overflow-x`, and
`.sk-data-table--sticky-header` has no scrolling ancestor to pin against, so the modifier does
nothing.

At a narrow width, add a labelled, keyboard-scrollable region to that same wrapper instead of
reflowing cells — block-reflow drops header association and is explicitly rejected:

```html
<div class="sk-data-table__scroller" role="region" aria-label="Recent builds, narrow view" tabindex="0">
  <table class="sk-data-table">…</table>
</div>
```

Only give the scroller `role="region"`/`tabindex="0"` when it genuinely overflows — on a table
that already fits, that triad is a dead tab stop and a duplicate landmark of `<caption>`; the
accessible name must also be distinct from `<caption>`'s own text ("narrow view", not "Recent
builds" again — a duplicate name is itself a defect). If you constrain a wide table's height or
width yourself (e.g. `max-height` for a long list), and that constraint makes the scroller
genuinely scrollable where it wasn't before, add the triad at that point — a scrollable region
with no way to reach it by keyboard is a real accessibility defect, not a style choice.
`.sk-data-table--sticky-header` pins the header row while the body scrolls
(requires the scroller above as its scrolling ancestor). This mission is tone-free by epic ruling
— no status/tone row colouring; that waits on a semantic status-token axis that doesn't exist yet.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skdatatable-html--default)

---

## Progress

Determinate completion — a mission's work-package count, a build's percent complete — as a real
`<progress>` with a plain light-DOM `label[for]`/`progress[id]` pair, never a hand-rolled `div`
whose fraction is expressed only as an inline `width` style.

**CSS-only** (`@spec-kitty/styles`, no JavaScript, no `sk-*` element — #210):

```html
<div class="sk-progress">
  <label class="sk-progress__label" for="mission-progress">5 of 8 Work Packages done</label>
  <progress class="sk-progress__bar" id="mission-progress" value="5" max="8">63%</progress>
  <span class="sk-progress__meta">63%</span>
</div>
```

The consumer supplies `value`, `max`, the label text, and the visible `sk-progress__meta` text —
all four are consumer-authored and the library performs no arithmetic on any of them. The native
`for`/`id` pair is the sole label association mechanism; no fixture carries `aria-label`,
`aria-labelledby`, or `role`. The role (`progressbar`) and the exposed value/min/max are derived by
the browser from the `<progress>` element's own `value`/`max` attributes (min is implicitly `0`),
the same way any other native `<progress>` element's accessibility is computed — restyling it for
this design's visual language does not change that.

Two layout modifiers change CSS only — the same three children, in the same order, in both:

- `sk-progress--compact` — an inline arrangement for placing the indicator beside other compact
  metadata.
- `sk-progress--narrow` — a stacked arrangement whose bar fills the available width, for narrow
  columns.

The maintained fixture set covers five determinate states (zero, a worked 5-of-8 example, complete,
a large total, and a long label) plus both modifiers — see
[ADR-10](../architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md)'s
styles-only class ruling for why no `sk-progress` element exists. Negative values or a `value`
exceeding `max` are consumer validation, not a concern this component's CSS or markup enforces.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skprogress-html--default)

---

## Empty state

A shared "nothing here yet" treatment — heading, supporting copy, one optional action — replacing
inconsistent per-page empty panels.

**CSS-only** (`@spec-kitty/styles`, no JavaScript, no `sk-*` element — #176):

```html
<div class="sk-empty-state">
  <h3 class="sk-empty-state__heading">No runs yet</h3>
  <p class="sk-empty-state__body">Trigger a run to see its status and logs here.</p>
  <div class="sk-empty-state__action">
    <button type="button">Start a run</button>
  </div>
</div>
```

The primitive supplies no copy of its own and no icon — heading, body and the action are entirely
the consumer's.

For an already-labelled lane that needs one compact structural message rather than the full
heading/body/action stack, use the passive inline modifier on native light DOM:

```html
<p class="sk-empty-state sk-empty-state--inline">Nothing here</p>
```

“Inline” does not mean forced onto one physical line: complete consumer-supplied copy wraps at
narrow widths. The modifier adds no fallback, heading, action, `role`, live region or status
semantics. Use `sk-notice` for an announced block-level message; do not turn an empty lane into a
notice merely to reuse its visuals. The inline modifier's exact token dependencies are
`--sk-fg-muted`, `--sk-font-sans`, `--sk-space-3`, `--sk-space-4`, and `--sk-text-sm`.
Consumers retain ownership of the copy and application data.

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skemptystate-html--with-action)

---

## Skip link

A real, off-screen-until-focused skip link targeting the page's primary content, so a keyboard
user is not forced to tab through the full navigation rail on every page.

**CSS-only** (`@spec-kitty/styles`, no JavaScript, no `sk-*` element — #176):

```html
<a href="#main" class="sk-skip-link">Skip to main content</a>
…
<main id="main">…</main>
```

Off-screen technique is `clip-path`, never a bare `transform` — `<a>` is inline by default and
`transform` does not apply to non-replaced inline boxes, so a transform-only skip link does not
move at all. Give it a real, high `z-index` and never place it inside an ancestor with
`transform`/`filter`/`will-change` (breaks its `position: fixed` containment) or one with a higher
`z-index` in a sibling stacking context (clamps it underneath, even once focused).

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skskiplink-html--unfocused)

---

> Storybook story URLs above reference the expected path pattern. URLs are approximate until the first GitHub Pages deployment runs. Verify against the live catalog at [https://stijn-dejongh.github.io/spec-kitty-design/](https://stijn-dejongh.github.io/spec-kitty-design/).
