# @spec-kitty/styles

Framework-agnostic HTML primitives and ES utilities for the Spec Kitty design system.
No Angular, no React, no Vue required.

## Installation

**npm**:
```bash
npm install @spec-kitty/styles @spec-kitty/tokens
```

**CDN (zero build step)**:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spec-kitty/tokens/dist/tokens.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@spec-kitty/styles/dist/src/index.js"></script>
```

## Usage

```typescript
import { SkStubHTML } from '@spec-kitty/styles';

document.querySelector('#app').innerHTML = SkStubHTML;
```

Or with CSS loaded separately:
```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="node_modules/@spec-kitty/tokens/dist/tokens.css">
  </head>
  <body id="app"></body>
  <script type="module">
    import { SkStubHTML } from '@spec-kitty/styles';
    document.getElementById('app').innerHTML = SkStubHTML;
  </script>
</html>
```

## Nav-pill drawer

The nav-pill component ships with an optional collapsible drawer for narrow
viewports. The drawer is opt-in: load only `sk-nav-pill.css` for the basic
desktop pill, or load **both** stylesheets for the responsive/drawer pattern.

### Required CSS imports

```html
<link rel="stylesheet" href="node_modules/@spec-kitty/styles/dist/nav-pill/sk-nav-pill.css">
<!-- For the drawer / hamburger pattern, ALSO load: -->
<link rel="stylesheet" href="node_modules/@spec-kitty/styles/dist/nav-pill/sk-nav-pill-drawer.css">
```

### The drawer is a custom element now

`skToggleDrawer` and the `id="sk-nav-drawer"` contract are **gone** (#73). They required the
consuming page to contain an element with that exact id, to wire an inline `onclick`, to
assign the import to `window` first because an inline handler cannot see a module scope, and
to author every nav item twice — once for the row and once for the drawer. The helper returned
`false` and did nothing if any of that was missing.

The behaviour lives in `<sk-nav-pill>` in **`@spec-kitty/elements`**:

```html
<script src="node_modules/@spec-kitty/elements/dist/elements.js"></script>

<sk-nav-pill label="Primary navigation">
  <a href="#" class="sk-nav-pill__item">Platform</a>
  <a href="#" class="sk-nav-pill__item">About</a>
</sk-nav-pill>
```

The items are authored **once**; below 720px the same container becomes the panel. There is no
id to get wrong and nothing on `window`.

| | |
|---|---|
| Methods | `open(invoker?)`, `close()`, `toggle(invoker?)` |
| State | `isOpen` property, reflected to the `open` attribute |
| Event | `sk-nav-pill-toggle` — fires **before** the change, `detail: { open: boolean }`, `bubbles`, `composed`, `cancelable`. `preventDefault()` abandons the change. |
| Keyboard | Escape closes and returns focus to whatever control opened it |
| Styling | `::part(nav)`, `::part(items)`, `::part(hamburger)` — ADR-9's rule is that a consumer restyles through the part, never by reaching into the shadow tree |

The two stylesheets in this package are unchanged and still shipped: a static consumer who
wants the plain desktop pill, or the two-container drawer arrangement without JavaScript, links
them exactly as before.

## Peer dependencies

| Package | Required version |
|---|---|
| `@spec-kitty/tokens` | `^1.0.0` (or load via CDN) |

## See also

- [Token package](../tokens/README.md)
- [Component catalog](https://stijn-dejongh.github.io/spec-kitty-design/) (Storybook)
- [Contributing guide](../../docs/contributing/adding-a-component.md)
