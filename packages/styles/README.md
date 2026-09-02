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

### Drawer ID contract

The drawer element MUST have `id="sk-nav-drawer"`. The `skToggleDrawer`
function looks up the drawer by this exact ID. Only one drawer per page.

```html
<div id="sk-nav-drawer" class="sk-nav-pill__drawer">
  <a href="#" class="sk-nav-pill__item">Platform</a>
  <a href="#" class="sk-nav-pill__item">About</a>
</div>
```

### Pattern 1 — `addEventListener` (preferred)

Cleaner separation between markup and behaviour. Works in modern build
pipelines and module-friendly environments.

```html
<button id="hamburger"
        class="sk-nav-pill__hamburger"
        aria-label="Open navigation"
        aria-expanded="false"
        aria-controls="sk-nav-drawer">
  <!-- hamburger icon SVG -->
</button>

<script type="module">
  import { skToggleDrawer } from '@spec-kitty/styles';
  document.getElementById('hamburger')
    .addEventListener('click', (e) => skToggleDrawer(e.currentTarget));
</script>
```

### Pattern 2 — inline `onclick`

For static-HTML environments where wiring `addEventListener` is awkward
(e.g. the demo pages in this repo). The function must be attached to
`window` so the inline handler can resolve it.

```html
<button class="sk-nav-pill__hamburger"
        aria-label="Open navigation"
        aria-expanded="false"
        aria-controls="sk-nav-drawer"
        onclick="skToggleDrawer(this)">
  <!-- hamburger icon SVG -->
</button>

<script type="module">
  import { skToggleDrawer } from '@spec-kitty/styles';
  window.skToggleDrawer = skToggleDrawer;
</script>
```

### Function contract

```ts
function skToggleDrawer(button: HTMLElement | null): boolean;
```

- Returns the new open state — `true` if the drawer is now open, `false`
  if it is now closed (or the call no-op'd).
- Side effects are limited to: toggling `is-open` on the drawer, updating
  `aria-expanded` and `aria-label` on the button.
- No-ops (returns `false`) when the button is null/undefined or when no
  `#sk-nav-drawer` element exists. Never throws.

See the full contract in
[`docs/contracts/nav-pill-drawer-module.md`](https://github.com/Stijn-Dejongh/spec-kitty-design/blob/main/kitty-specs/catalog-completeness-and-brand-consistency-01KQPDB5/contracts/nav-pill-drawer-module.md).

## Peer dependencies

| Package | Required version |
|---|---|
| `@spec-kitty/tokens` | `^1.0.0` (or load via CDN) |

## See also

- [Token package](../tokens/README.md)
- [Component catalog](https://stijn-dejongh.github.io/spec-kitty-design/) (Storybook)
- [Contributing guide](../../docs/contributing/adding-a-component.md)
