# @spec-kitty/tokens

Design tokens for the Spec Kitty design system — distributed as CSS custom properties (`--sk-*` namespace).

## Installation

```bash
npm install @spec-kitty/tokens
```

Then import in your CSS or JS entry point:

```css
@import '@spec-kitty/tokens/dist/tokens.css';
```

Or in JavaScript:

```js
import '@spec-kitty/tokens';
```

## CDN

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@spec-kitty/tokens/dist/tokens.css"
/>
```

## Usage

All tokens are CSS custom properties available on `:root`. Reference them with `var()`:

```css
.my-component {
  background-color: var(--sk-bg-2);
  color: var(--sk-fg-1);
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius-md);
  font-family: var(--sk-font-sans);
  font-size: var(--sk-fs-body);
  padding: var(--sk-space-4);
  transition: background-color var(--sk-dur-base) var(--sk-ease-out);
}

.my-cta {
  background-color: var(--sk-color-yellow);
  color: var(--sk-accent-fg);
  border-radius: var(--sk-radius-pill);
  box-shadow: var(--sk-shadow-glow-yellow);
}
```

## Token Catalogue

The full list of `--sk-*` property names, grouped by category, is available in:

```
dist/token-catalogue.json
```

Or via the package export:

```js
import catalogue from '@spec-kitty/tokens/catalogue';
console.log(catalogue.categories.color.tokens);
// ['--sk-color-yellow', '--sk-color-yellow-soft', ...]
```

To regenerate the catalogue after adding tokens:

```bash
npx nx run tokens:catalogue
```

## Token Categories

| Category | Prefix | Purpose |
|---|---|---|
| `color` | `--sk-color-` | Raw brand palette values |
| `tint` | `--sk-tint-` | Tinted card/panel surfaces |
| `on` | `--sk-on-` | Foreground color for tinted surfaces |
| `bg` | `--sk-bg-` | Page and surface background scale |
| `fg` | `--sk-fg-` | Text/foreground scale |
| `border` | `--sk-border-` | Border colors |
| `font` | `--sk-font-` | Font family stacks |
| `fs` | `--sk-fs-` | Font size scale |
| `lh` | `--sk-lh-` | Line height scale |
| `fw` | `--sk-fw-` | Font weight scale |
| `space` | `--sk-space-` | Spacing scale |
| `radius` | `--sk-radius-` | Border radius scale |
| `shadow` | `--sk-shadow-` | Box shadow tokens |
| `dur` | `--sk-dur-` | Motion duration |
| `ease` | `--sk-ease-` | Motion easing curves |

## Semantic Pairing Rule

Always pair a `--sk-bg-*` or `--sk-tint-*` surface token with its corresponding foreground token to ensure accessible contrast:

| Surface token | Foreground token |
|---|---|
| `--sk-bg-0` through `--sk-bg-3` | `--sk-fg-0` through `--sk-fg-4` |
| `--sk-tint-mint` | `--sk-on-mint` |
| `--sk-tint-butter` | `--sk-on-butter` |
| `--sk-tint-lilac` | `--sk-on-lilac` |
| `--sk-tint-sky` | `--sk-on-sky` |
| `--sk-color-yellow` (button bg) | `--sk-accent-fg` |

Using a surface token without its paired foreground token is a contract violation under ADR-003.

## Light Mode

With neither root preference attribute nor JavaScript, the built `dist/tokens.css` follows the
operating-system `prefers-color-scheme`. Set `data-theme="light"` or `data-theme="dark"` on
`<html>` for an explicit root preference; a nested `.sk-light` class remains available for bounded
documentation examples. The System fallback is generated from the same authored light block, so
there is no second palette to maintain. The repository's
`docs/design-system/using-components.md#theme-preference` section documents the pre-paint
bootstrap and `sk-theme-toggle` integration.

## Linting

This package is excluded from the Stylelint `--sk-*` enforcement rule (it defines the tokens). All other CSS files in the monorepo must use `var(--sk-*)` references rather than hardcoded values.

## Design Reference

Token values are derived from `docs/architecture/decisions/ADR-003-addendum-token-values.md` and the design reference in `tmp/Spec Kitty Design System(1)/colors_and_type.css`.
