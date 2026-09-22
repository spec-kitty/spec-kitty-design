# Spec Kitty Design System

A token-first, framework-progressive design system for the [Spec Kitty](https://github.com/Priivacy-ai) ecosystem.

**Live Storybook -** https://stijn-dejongh.github.io/spec-kitty-design/

---

## What this is

Spec Kitty Design provides:
- **Design tokens** (`@spec-kitty/tokens`) - CSS custom properties for colour, typography, spacing, motion, and radius. The single authoritative source for all visual values across the ecosystem.
- **HTML components** (`@spec-kitty/styles`) - framework-agnostic CSS and markup for core UI patterns (navigation, cards, tags, forms, banners, footer). No JavaScript: the last helper it shipped moved into a custom element in #73.
- **Custom elements** (`@spec-kitty/elements`) - the behaviour layer, on the ADR-8 base layer. **Not published yet** — the package is `private` and #80 owns the release.
- **Brand assets** - fonts (Falling Sky, Swansea), logo, and visual identity artefacts.

The design language targets the AI-tooling and spec-driven development context: dark-first, yellow-accented, technical-professional tone.

---

## Quick Start

### Use tokens (zero build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spec-kitty/tokens/dist/tokens.css">
```

Then use `--sk-*` CSS custom properties anywhere in your styles:

```css
.my-element {
  background: var(--sk-surface-card);
  color: var(--sk-fg-default);
  border-radius: var(--sk-radius-lg);
  padding: var(--sk-space-6);
}
```

### Use HTML components

```html
<!-- After loading tokens.css, add the component stylesheet: -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spec-kitty/styles/dist/nav-pill/sk-nav-pill.css">

<nav class="sk-nav-pill" aria-label="Primary navigation">
  <div class="sk-nav-pill__items">
    <a href="/" class="sk-nav-pill__item sk-nav-pill__item--active" aria-current="page">Home</a>
    <a href="/about" class="sk-nav-pill__item">About</a>
  </div>
</nav>
```

### Use Angular components

```bash
npm install @spec-kitty/angular @spec-kitty/tokens
```

```ts
import { SkButtonPrimaryModule } from '@spec-kitty/angular';
```

### Light / dark theme

Add `data-theme="light"` or `data-theme="dark"` to your `<html>` element. The token system defaults to dark.

---

## Explore

- **[Component Storybook](https://stijn-dejongh.github.io/spec-kitty-design/)** - interactive component browser with light/dark variants
- **[Blog Demo](https://stijn-dejongh.github.io/spec-kitty-design/blog-demo.html)** - full-page marketing/blog layout
- **[Dashboard Demo](https://stijn-dejongh.github.io/spec-kitty-design/dashboard-demo.html)** - Kanban board layout

---

## Development

```bash
# Install dependencies
npm ci

# Run Storybook locally
npx nx run storybook:storybook

# Build all packages
npx nx run-many --target=build --all

# View demo pages (served via Storybook dev server)
# http://localhost:6006  (or configured port)
```

---

## Repository structure

```
packages/
  tokens/       - CSS custom properties + brand fonts
  styles/       - Framework-agnostic CSS + JS components
  angular/      - Angular component wrappers
apps/
  storybook/    - Storybook application
  demo/         - Static demo pages (blog, dashboard)
doctrine/       - Brand voice and visual identity guidelines
kitty-specs/    - Mission specifications (spec-kitty workflow)
```

---

## Governance

This repository is governed by the [Spec Kitty](https://github.com/Priivacy-ai/spec-kitty) charter and ADR framework. All visual values must use `--sk-*` tokens (ADR-001). Package topology follows a one-directional dependency graph (ADR-002). See `doctrine/` for brand and identity guidelines.
