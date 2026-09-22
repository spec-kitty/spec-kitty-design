# Quickstart: Work Package Detail Primitives

## Native detail composition

```html
<nav class="sk-breadcrumbs" aria-label="Breadcrumb">
  <ol class="sk-breadcrumbs__list">
    <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="/repositories">Repository</a></li>
    <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="/missions/42">Mission</a></li>
    <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="/work-packages/3" aria-current="page">WP03</a></li>
  </ol>
</nav>

<article class="sk-prose">
  <h1>Implementation prompt</h1>
  <p>Consumer-rendered and sanitized content.</p>
  <pre><code>npm run quality:all</code></pre>
</article>

<ol class="sk-event-timeline">
  <li class="sk-event-timeline__item">
    <div class="sk-event-timeline__summary">planned → doing</div>
    <div class="sk-event-timeline__metadata">Implementer · supplied time</div>
  </li>
</ol>

<ul role="list">
  <sk-check-bullet state="complete">Specification accepted</sk-check-bullet>
  <sk-check-bullet state="pending">Implementation review</sk-check-bullet>
</ul>
```

The application supplies all text, ordering, time, trust, routing, and state. Use `.sk-empty-state` for an absent prompt or unavailable passive history; use `sk-notice` only when a block message must be announced.

## Required verification order

1. Run focused tests while authoring.
2. Regenerate CSS, styles-only markup/barrels, element markup, CEM, wrappers, Vue types, and size report.
3. Run drift/content/boundary/type/lint gates.
4. Run full Vitest and mutation gates.
5. Build Storybook, run axe, then relevant Playwright and visual tests.
6. Rebase the latest train, regenerate, and repeat affected gates before exact-head review/CI.
