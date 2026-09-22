# Public contract: `.sk-context-nav` unavailable entry

## Canonical anatomy

```html
<li class="sk-context-nav__item">
  <span class="sk-context-nav__unavailable" aria-disabled="true">
    <span class="sk-context-nav__label">Destination label</span>
    <span class="sk-context-nav__annotation">Unavailable</span>
  </span>
</li>
```

The annotation node is optional. Its text is supplied verbatim by the consumer. The unavailable node is never an `a`, `button`, or custom element and carries no `href`, handler, role, or `tabindex`.

## State rules

- Available anchors continue to use `.sk-context-nav__link`; only they may carry `aria-current`.
- An unavailable row participates in native list count/order but not sequential focus or activation.
- Unavailable presentation does not change on hover, active, or focus attempts and does not use a pointer cursor.
- An all-unavailable list has no current destination.
- An unavailable parent has no `.sk-context-nav__children` descendant. The styles infer no hidden or pending children.
- Labels and annotations preserve full accessible text and remain contained in 240px and 390px compositions, RTL, and zoom.

## Ownership

The library owns only the two class treatments. Consumers own markup choice, catalogue order and presence, labels, annotation wording, current available link, URLs, and child-list existence.

## Compatibility

This additive styles-only contract changes no existing selector behavior, token, element manifest, wrapper, Vue declaration, router, or application data model.
