# Quickstart: Unavailable context-navigation entries

Import the existing context-navigation stylesheet and author unavailable destinations as native non-anchor content:

```html
<link rel="stylesheet" href="@spec-kitty/styles/context-nav/sk-context-nav.css">

<nav class="sk-context-nav" aria-label="Document catalogue">
  <ul class="sk-context-nav__list">
    <li class="sk-context-nav__item">
      <a class="sk-context-nav__link" href="/overview" aria-current="page">
        <span class="sk-context-nav__label">Overview</span>
      </a>
    </li>
    <li class="sk-context-nav__item">
      <span class="sk-context-nav__unavailable" aria-disabled="true">
        <span class="sk-context-nav__label">Plan</span>
        <span class="sk-context-nav__annotation">Unavailable</span>
      </span>
    </li>
  </ul>
</nav>
```

Do not place `href`, `role="button"`, `tabindex`, or click behavior on the unavailable row. Omit the annotation node when no visible annotation is wanted; the CSS supplies no wording.

For local verification after implementation:

```sh
node scripts/build-styles-only-markup.mjs
npx playwright test apps/storybook/src/tests/sk-context-nav.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-context-nav.spec.ts --project=firefox
npm run quality:all
```

Use the Storybook unavailable routes for dark, `LightMode`, forced-colours, RTL, narrow, and long-content review.
