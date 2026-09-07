# Public Surface Contract

## `.sk-breadcrumbs`

Required native root:

```html
<nav class="sk-breadcrumbs" aria-label="Breadcrumb">
  <ol class="sk-breadcrumbs__list">
    <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="/">Repository</a></li>
    <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="/mission">Mission</a></li>
    <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="/wp" aria-current="page">WP03</a></li>
  </ol>
</nav>
```

The consumer owns labels, URLs, count, order, and `aria-current`. The class family owns layout, focus treatment, truncation/overflow presentation, and decorative separators.

## `.sk-prose`

Apply to a consumer-rendered `<article>` or `<section>`. Native descendants retain their elements and order. `<pre><code>` owns code overflow; structured data uses the existing `.sk-data-table` recipe. The library accepts already-rendered safe content and neither parses Markdown nor sanitizes HTML.

## `.sk-event-timeline`

Required native root:

```html
<ol class="sk-event-timeline">
  <li class="sk-event-timeline__item">
    <div class="sk-event-timeline__summary">planned → doing</div>
    <div class="sk-event-timeline__metadata">Actor · supplied time</div>
    <div class="sk-event-timeline__content">Optional supplied detail or marker</div>
  </li>
</ol>
```

The consumer owns order, transition text, actor/time strings, optional trust/status marker, and retention state. The primitive owns only chronology presentation and responsive grouping. Dense operations remain `.sk-data-table`.

## `<sk-check-bullet>`

```ts
type CheckBulletState = 'complete' | 'pending';

interface SkCheckBullet {
  icon?: string;
  state?: CheckBulletState;
}
```

- `state` reflects to the `state` attribute when explicitly set.
- Omitted state preserves complete/check presentation.
- Unsupported runtime values fail open to complete.
- `icon` overrides the decorative glyph only.
- The element emits no event, accepts no user input, carries no `aria-checked`, and calculates no progress.
- Consumers keep the existing `<ul role="list"><sk-check-bullet>…` composition required by #92.
