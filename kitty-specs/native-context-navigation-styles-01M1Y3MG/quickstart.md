# Quickstart: Native context navigation

With a package-aware CSS bundler, import the exported token root and styles subpath:

```css
@import '@spec-kitty/tokens';
@import '@spec-kitty/styles/context-nav/sk-context-nav.css';
```

For a plain no-build HTML page, use explicit package artifact URLs:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spec-kitty/tokens@1/dist/tokens.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spec-kitty/styles@1/dist/context-nav/sk-context-nav.css" />

<nav class="sk-context-nav" aria-label="Project context">
  <section class="sk-context-nav__group" aria-labelledby="project-destinations">
    <h2 class="sk-context-nav__heading" id="project-destinations">Destinations</h2>
    <ul class="sk-context-nav__list">
      <li class="sk-context-nav__item">
        <a class="sk-context-nav__link" href="/overview">
          <span class="sk-context-nav__label">Overview</span>
        </a>
      </li>
      <li class="sk-context-nav__item">
        <a class="sk-context-nav__link" href="/repositories/example" aria-current="page">
          <span class="sk-context-nav__label">owner/example</span>
        </a>
        <ul class="sk-context-nav__children">
          <li class="sk-context-nav__item">
            <a class="sk-context-nav__link" href="/missions/example">
              <span class="sk-context-nav__label">Example Mission</span>
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </section>
</nav>
```

The consumer owns every URL, label, group and child order, visible child count, optional icon, and the `aria-current` value. Decorative icons use `aria-hidden="true"`; meaningful naming remains in link text or an accessible name supplied by the consumer. Empty copy and an optional overflow link are authored explicitly. The styles never inspect routes or infer state.

This primitive intentionally has no `<sk-context-nav>` custom element and no JavaScript behavior. It composes as consumer markup inside `sk-context-sidebar`.
