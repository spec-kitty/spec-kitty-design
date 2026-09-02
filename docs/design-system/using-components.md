# Using components

The Spec Kitty component libraries ship in two flavours: `@spec-kitty/angular` for Angular applications and `@spec-kitty/styles` for framework-agnostic HTML projects. Both require `@spec-kitty/tokens`.

## Installation

```bash
npm install @spec-kitty/angular @spec-kitty/tokens    # Angular
npm install @spec-kitty/styles @spec-kitty/tokens    # plain HTML/JS
```

> Note: these packages must be published to npm before the import paths below work in consumer projects. Until then, install from the local repository using `npm link` or a path dependency.

---

## Buttons

Primary and secondary call-to-action buttons used to drive user actions.

**Angular:**

```typescript
import { SkButtonPrimaryComponent, SkButtonSecondaryComponent } from '@spec-kitty/angular';
```

```html
<sk-button-primary>Get started</sk-button-primary>
<sk-button-secondary>Learn more</sk-button-secondary>
```

**HTML:**

```html
<button class="sk-btn sk-btn--primary">Get started</button>
<button class="sk-btn sk-btn--secondary">Learn more</button>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-buttons--default)

---

## Navigation

Top-level navigation bar with logo, pill nav links, theme toggle, and external link pills.

**Angular:**

```typescript
import { SkNavComponent } from '@spec-kitty/angular';
```

```html
<sk-nav [links]="navLinks" logoSrc="/assets/logo.png"></sk-nav>
```

**HTML:**

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

**Angular:**

```typescript
import { SkPillTagComponent, SkEyebrowPillComponent } from '@spec-kitty/angular';
```

```html
<sk-pill-tag>Design system</sk-pill-tag>
<sk-eyebrow-pill>New</sk-eyebrow-pill>
```

**HTML:**

```html
<span class="sk-pill-tag">Design system</span>
<span class="sk-eyebrow-pill">New</span>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-tags--default)

---

## Content markers

Eyebrow labels and section banners used to introduce sections and add visual hierarchy.

**Angular:**

```typescript
import { SkEyebrowComponent, SkSectionBannerComponent } from '@spec-kitty/angular';
```

```html
<sk-eyebrow>Getting started</sk-eyebrow>
<sk-section-banner>What's new</sk-section-banner>
```

**HTML:**

```html
<span class="sk-eyebrow">Getting started</span>
<div class="sk-section-banner">What's new</div>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-content-markers--default)

---

## Cards

Surface containers for grouping related content, used in feature grids, blog listings, and comparison layouts.

**Angular:**

```typescript
import { SkCardComponent } from '@spec-kitty/angular';
```

```html
<sk-card>
  <sk-eyebrow>Feature</sk-eyebrow>
  <h3>Structured requirements</h3>
  <p>Developers spend time building, not being blocked on finalized requirements.</p>
</sk-card>
```

**HTML:**

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

**Angular:**

```typescript
import { SkInputFieldComponent } from '@spec-kitty/angular';
```

```html
<sk-input-field label="Your name" placeholder="Jane Smith"></sk-input-field>
```

**HTML:**

```html
<div class="sk-field">
  <label class="sk-field__label" for="name">Your name</label>
  <input class="sk-field__input" id="name" type="text" placeholder="Jane Smith">
</div>
```

[View in Storybook](https://stijn-dejongh.github.io/spec-kitty-design/?path=/story/components-form-fields--default)

---

## Hero

Full-width hero block with eyebrow, headline, lead copy, checkmark bullet list, and call-to-action buttons.

**Angular:**

```typescript
import { SkHeroComponent } from '@spec-kitty/angular';
```

```html
<sk-hero
  eyebrow="Open-source"
  headline="Bring structure to AI-assisted delivery"
  [bullets]="['Spec -> Plan -> Implement', 'No requirement drift', 'Works with any AI coding tool']">
  <sk-button-primary slot="cta-primary">Get started</sk-button-primary>
  <sk-button-secondary slot="cta-secondary">View on GitHub</sk-button-secondary>
</sk-hero>
```

**HTML:**

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

**Angular:**

```typescript
import { SkCalloutComponent } from '@spec-kitty/angular';
```

```html
<sk-callout
  leftHeading="Why teams use it"
  [leftBullets]="['Catches requirement drift before code is written', 'Works alongside existing AI tools']"
  rightHeading="Who it is for"
  [rightBullets]="['Engineering leads', 'Product managers', 'AI coding tool users']">
</sk-callout>
```

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
