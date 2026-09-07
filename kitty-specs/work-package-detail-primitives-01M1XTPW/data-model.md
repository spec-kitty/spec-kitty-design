# Data Model: Work Package Detail Primitives

This mission stores no data. The following are public presentation value objects and consumer-authored structures, not application entities.

## CheckBulletState

| Value | Meaning | Default icon | Accessible state text |
|---|---|---|---|
| `complete` | The supplied item is complete | check mark | `Complete` |
| `pending` | The supplied item is pending | open-circle mark | `Pending` |
| omitted or unsupported at runtime | Backward-compatible complete fallback | check mark | `Complete` |

Invariants:

- State is reflected when explicitly supplied.
- State never creates interaction, progress arithmetic, or a toggle event.
- The icon is always decorative; state text remains available to assistive technology.
- A consumer icon overrides only the glyph, never state semantics.
- Static authored options reject unsupported values at build time; runtime rendering fails open.

## BreadcrumbStructure

Consumer-authored shape: a labelled `<nav class="sk-breadcrumbs">` containing one `<ol class="sk-breadcrumbs__list">`, ordered `<li class="sk-breadcrumbs__item">` descendants, and links. The terminal link carries `aria-current="page"`.

Invariants:

- Consumer order is preserved.
- Separator decoration contributes no accessible text.
- Visual truncation never mutates the authored link text or accessible name.

## ProseStructure

Consumer-authored article/section content inside `.sk-prose`: native headings, paragraphs, lists, links, inline code, and `<pre><code>`. A table is a nested `.sk-data-table` composition; absence is a sibling `.sk-empty-state` composition.

Invariants:

- Heading levels and source order remain consumer-owned.
- No parsing, sanitization, syntax highlighting, or copy action is performed.
- Code/table overflow is local to its documented region.

## EventTimelineStructure

Consumer-authored `<ol class="sk-event-timeline">` containing `<li class="sk-event-timeline__item">`. An item may contain summary, metadata, supporting content, and a supplied marker using documented BEM child classes or composed elements.

Invariants:

- DOM order is display and accessibility order.
- Actor/time/trust/transition strings render verbatim.
- Metadata remains grouped with its event at narrow widths.
- The library performs no verification, sorting, formatting, fetching, or retention decision.
