# Data model: Team overview feed elements

This mission has no persisted or application-domain data model. The following value objects define
the public rendering boundary only.

## SectionHeaderProjection

| Field | Type | Owner | Rules |
|---|---|---|---|
| eyebrow | slotted content | Consumer | Optional lead-in text/content. |
| title | slotted native heading | Consumer | Consumer selects the heading level. |
| description | slotted content | Consumer | Optional; never generated. |
| metadata | slotted content | Consumer | Optional count or metadata; never derived. |
| action | one slotted control | Consumer | Optional; the header does not implement it. |

`SectionHeaderProjection` has no loading/count state and no relationship to a feed collection.

## ActionRowProjection

| Field | Type | Owner | Rules |
|---|---|---|---|
| rowId | non-empty string | Consumer | Stable identifier placed in activation detail as `id`; whitespace-only is invalid. |
| selectable | boolean | Consumer | Enables the primary trigger only when `rowId` is valid. |
| selected | boolean | Consumer | Render-only controlled value; activation never changes it. The stable `[part=row]` surface carries `aria-current="true"` only when selected in both selectable and non-selectable render branches. |
| marker | slotted content | Consumer | Usually `sk-entity-marker`; no identity lookup. |
| title | slotted content | Consumer | Primary visible name. |
| reference | slotted content | Consumer | Path/reference presentation; no parsing. |
| tags | slotted content | Consumer | Usually landed `sk-pill-tag` instances; no status inference. |
| metadata | slotted content | Consumer | Supplied time or secondary text; no clock. |
| controls | slotted interactive content | Consumer | Sibling of primary trigger; activation is isolated. |

### Invariants

1. `selectable && trim(rowId) != ''` is the only activatable state.
2. Every primary activation emits one `ActionRowActivateIntent`; no activation changes `selected`.
3. Controls do not emit `ActionRowActivateIntent` through the row.
4. Two projections with identical content remain two consumer-owned list items.
5. The component never maps `selected` to `aria-selected`, `aria-pressed`, checkbox or switch state;
   it owns neither a selectable-container role nor toggle semantics.
6. Only repeated Enter/Space keydowns are canceled. Their `preventDefault()` suppresses duplicate
   native activation; initial keydowns and unrelated keys retain native behavior.

## ActionRowActivateIntent

| Field | Type | Rules |
|---|---|---|
| id | string | Exactly the valid stable `ActionRowProjection.rowId`; the detail has no other keys. |

Event envelope: name `sk-action-row-activate`, bubbling `true`, composed `true`, cancelable `false`.
The controlled element owns no preventable default action and does not expose or imply an
application action. The acceptance probe listens outside the shadow root, calls `preventDefault()`,
and proves as one composite contract that actual dispatch returns `true`, `defaultPrevented` remains
`false`, and no selected, navigation or other default application action occurs.

## StatusIndicatorProjection

| Field | Type | Owner | Rules |
|---|---|---|---|
| tone | `neutral \| info \| success \| attention \| danger \| recovery` | Consumer | Presentation only; unknown input degrades to neutral. |
| marker | slotted content | Consumer | Decorative support for the visible status text. |
| text | default slotted content | Consumer | Visible meaning; required for a meaningful status. |

Tone does not map from domain labels. Recovery must differ visually from info and danger.

## EntityMarkerProjection

| Field | Type | Owner | Rules |
|---|---|---|---|
| label | string | Consumer | Non-empty means meaningful/named; empty means decorative/hidden. |
| mark | default slotted content | Consumer | Icon, initials or short mark; no generated identity. |

## Relationships

```text
consumer ul
  └─ consumer li (one per supplied event)
       └─ sk-action-row
            ├─ primary trigger content
            │    ├─ sk-entity-marker (optional)
            │    ├─ title + reference
            │    ├─ sk-pill-tag* (optional)
            │    └─ sk-status-indicator (optional)
            └─ trailing controls (native link/button or sk-button)

primary activation ──emits──> ActionRowActivateIntent
consumer handler ──may update──> selected input on a later render
```

The design library owns only the downward projection and emitted intent. Feed arrays, ordering,
selection decisions, navigation and time formatting live outside this model.
