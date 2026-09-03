# Using components

The Spec Kitty components ship as CSS in `@spec-kitty/styles`, and — for the components migrated
so far — as **custom elements** in `@spec-kitty/elements`. Both require `@spec-kitty/tokens`.

**Migration is in progress.** Five elements exist today: `sk-card`, `sk-nav-pill`,
`sk-form-input`, `sk-form-textarea` and `sk-stub`. Everything else on this page is CSS only, and
#77–#79 are the missions that move the rest. Each section below says which it is, because the
difference decides how you use it.

Because a custom element needs no wrapper, every framework can use the migrated ones directly. A
generated React wrapper exists for JSX typing and typed refs — see
[Using the elements from React](./using-react.md) for what it does and does not buy, measured.

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

**HTML:**

```html
<button class="sk-btn sk-btn--primary">Get started</button>
<button class="sk-btn sk-btn--secondary">Learn more</button>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-buttons--default)

---

## Navigation

Top-level navigation bar with logo, pill nav links, theme toggle, and external link pills.

**As a custom element** — migrated:

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

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-navigation--default)

---

## Tags

Pill-shaped tags used to label and categorise content inline.

**HTML:**

```html
<span class="sk-pill-tag">Design system</span>
<span class="sk-eyebrow-pill">New</span>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-tags--default)

---

## Content markers

Eyebrow labels and section banners used to introduce sections and add visual hierarchy.

**HTML:**

```html
<span class="sk-eyebrow">Getting started</span>
<div class="sk-section-banner">What's new</div>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-content-markers--default)

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

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-cards--default)

---

## Form fields

Labelled text inputs, selects, and validation states for data-entry surfaces.

> **This section was wrong.** It documented an Angular `SkInputFieldComponent` and
> `.sk-field` / `.sk-field__label` / `.sk-field__input` classes — none of which have ever
> existed in this repository, and the Angular package was deleted in #69. Corrected in #74.

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

**As a custom element** — migrated, and form-associated:

```html
<form>
  <sk-form-input name="email" label="Email" required></sk-form-input>
  <sk-form-textarea name="notes" label="Notes" rows="4"></sk-form-textarea>
  <button type="submit">Send</button>
</form>
```

They participate in the form natively via `ElementInternals`: the value submits under `name`, an
empty `required` field blocks submission, and a containing `<fieldset>` disables them. Set a
server-side or cross-field error with `el.setCustomError('…')` rather than assigning `invalid`,
which would paint the error state without setting validity.

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
    <button class="sk-btn sk-btn--primary">Get started</button>
    <button class="sk-btn sk-btn--secondary">View on GitHub</button>
  </div>
</section>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-hero--default)

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

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-callout--default)

---

> Storybook story URLs above reference the expected path pattern. URLs are approximate until the first GitHub Pages deployment runs. Verify against the live catalog at [https://stijn-dejongh.github.io/spec-kitty-design/](https://stijn-dejongh.github.io/spec-kitty-design/).
