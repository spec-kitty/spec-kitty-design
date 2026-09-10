# Quickstart: Section navigation

With a package-aware CSS bundler, import the exported token root and styles subpath:

```css
@import '@spec-kitty/tokens';
@import '@spec-kitty/styles/section-nav/sk-section-nav.css';
```

For a plain no-build HTML page, use explicit package artifact URLs:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spec-kitty/tokens@1/dist/tokens.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spec-kitty/styles@1/dist/section-nav/sk-section-nav.css" />

<nav class="sk-section-nav" aria-label="Installation sections">
  <a class="sk-section-nav__link" href="?tab=workspace">Workspace</a>
  <a class="sk-section-nav__link" href="?tab=routing" aria-current="page">Project routing</a>
  <a class="sk-section-nav__link" href="?tab=accounts">Team accounts</a>
</nav>
```

A permission-filtered subset renders as fewer links, in the consumer's own order — the family
reserves no space for a route the consumer chose not to render:

```html
<nav class="sk-section-nav" aria-label="Installation sections">
  <a class="sk-section-nav__link" href="?tab=routing" aria-current="page">Project routing</a>
  <a class="sk-section-nav__link" href="?tab=accounts">Team accounts</a>
</nav>
```

The consumer owns the nav's accessible label, every link's `href` and text, link order, which links
are present at all, and the single `aria-current="page"` value (or none, for "no current route").
The family infers no route and no current state, injects no default copy, and attaches no click
listener — every native anchor behaviour (modified-click, copy-link, open-in-new-tab, visited,
browser back/forward) works exactly as the unmodified browser provides.

This primitive intentionally has no `<sk-section-nav>` custom element, no ARIA tab role anywhere in
its markup, and no JavaScript behaviour. It is not `.sk-context-nav` (grouped/nested sidebar
navigation), `sk-nav-pill` (a pill-shaped primary destination switcher with drawer behaviour),
`.sk-breadcrumbs` (an ancestor path), or `.sk-segmented-choice` (a controlled exclusive button
group with no navigation semantics at all) — it is a flat strip of sibling, same-level route links
inside one detail page.
