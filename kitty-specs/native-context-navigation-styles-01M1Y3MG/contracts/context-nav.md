# Public contract: `.sk-context-nav`

## Class surface

| Class | Intended native/content node | Contract |
|---|---|---|
| `.sk-context-nav` | `nav` | Root grouped-navigation layout and containment |
| `.sk-context-nav__group` | `section` or equivalent group | Spacing between consumer-authored groups |
| `.sk-context-nav__heading` | native heading | Group label typography |
| `.sk-context-nav__list` | `ul` | Top-level native list reset/rhythm |
| `.sk-context-nav__item` | `li` | Destination containment |
| `.sk-context-nav__link` | `a[href]` | Target, layout, interactive/current presentation |
| `.sk-context-nav__icon` | consumer icon node | Alignment/size only; semantics remain consumer-owned |
| `.sk-context-nav__label` | text span | Flexible wrapping/containment while retaining full text |
| `.sk-context-nav__children` | nested `ul` | Logical indentation and visible hierarchy |
| `.sk-context-nav__empty-copy` | native prose | Optional muted empty explanation |
| `.sk-context-nav__overflow-link` | `a[href]` | Optional ordinary management/overflow link affordance |

## State and semantics

- Current presentation is selected only by `.sk-context-nav__link[aria-current]:not([aria-current="false"])`; the valid explicit value `false` remains non-current.
- Anchors retain browser navigation, visited, keyboard, and activation semantics.
- Native `nav`, heading, `ul`, `li`, and `a` relationships remain in the accessibility tree.
- The family adds no roles, tabindex values, events, generated content, state classes, or DOM changes.
- Consumers may omit icons, children, empty copy, or overflow links without changing the base contract.

## Explicitly absent public surfaces

- No `sk-context-nav` tag or custom-elements manifest declaration.
- No element stylesheet module, React wrapper, or Vue type.
- No custom event, property, attribute API, route mapping, count/limit, or selection behavior.
- No child collection wrapper, disclosure mechanism, tree/menu keyboard model, or shadow-root styling hook.
