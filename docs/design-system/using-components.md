# Using components

The Spec Kitty components ship as CSS in `@spec-kitty/styles`, and — for the components migrated
so far — as **custom elements** in `@spec-kitty/elements`. Both require `@spec-kitty/tokens`.

**Migration is in progress.** Nineteen elements exist today: `sk-app-shell`, `sk-blog-card`,
`sk-button`, `sk-card`, `sk-check-bullet`, `sk-context-sidebar`, `sk-feature-card`, `sk-form-input`,
`sk-form-textarea`, `sk-grid`, `sk-nav-pill`, `sk-page-header`, `sk-personal-rail`, `sk-pill-tag`,
`sk-ribbon-card`, `sk-section-banner`, `sk-site-footer`, `sk-stub`, and `sk-transition-matrix`.
Several of the catalogue's component packages are CSS only by a recorded decision — `form-field`,
and (#176) `facts`, `disclosure`, `data-table`, `empty-state`, `skip-link`. See ADR-10,
*form-field is deliberately styles-only*. These five ship classes applied to real semantic HTML
the consumer authors — `<dl>`, `<details>`, `<table>`, a plain block, `<a>` — and no `sk-*` custom
element wraps any of them: light-DOM native semantics (list/table/label association across a
shadow boundary) are exactly what a wrapper element would break. Composite sections below such as
Hero and Callout are CSS-only *patterns* rather than packages, and are not part of that count.
Each section below says which it is, because the difference decides how you use it.

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
  <sk-check-bullet icon="★">Decisions live with the feature</sk-check-bullet>
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

**HTML:**

```html
<li class="sk-check-bullet">
  <span class="sk-check-bullet__icon" aria-hidden="true">✓</span>
  Requirements captured up front
</li>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/primitives-skcheckbullet-html--default)

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
