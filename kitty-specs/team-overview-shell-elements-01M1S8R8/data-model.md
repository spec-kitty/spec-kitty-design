# Data and projection model: Team overview shell elements

**Mission:** `team-overview-shell-elements-01M1S8R8`

These components have no domain entities or persisted state. Their model is a set of consumer-owned
nodes and two opaque label strings projected into stable layout and accessibility structure.

## Public inputs

### `SkAppShell`

| Input | Type | Cardinality | Ownership |
|---|---|---:|---|
| `personal-rail` slot | assigned nodes | 0..* | Consumer |
| `context-sidebar` slot | assigned nodes | 0..* | Consumer |
| `page-header` slot | assigned nodes | 0..* | Consumer |
| default slot | assigned nodes | 0..* | Consumer |

The component stores none of these nodes and never derives navigation state from them.

### `SkPersonalRail`

| Input | Type | Cardinality | Projection |
|---|---|---:|---|
| `label` | string attribute/property | 0..1 | internal `<nav aria-label>`; blank/absent → `Personal navigation` |
| `primary` slot | assigned controls/nodes | 0..* | top group |
| `utilities` slot | assigned controls/nodes | 0..* | bottom utility group |
| `account` slot | assigned controls/nodes | 0..* | below divider, above logout |
| `logout` slot | assigned controls/nodes | 0..* | final bottom group |

The approved fixture places exactly one account anchor in `account`. The component does not parse
or enforce a cardinality on arbitrary consumer nodes and never copies identity into another slot.

### `SkContextSidebar`

| Input | Type | Cardinality | Projection |
|---|---|---:|---|
| `label` | string attribute/property | 0..1 | internal `<aside aria-label>`; blank/absent → `Context` |
| `header` slot | assigned nodes | 0..* | header region |
| default slot | assigned navigation/content | 0..* | generic content region |
| `footer` slot | assigned nodes | 0..* | footer region |

No active team, selected route or destination exists in this element's model.

### `SkPageHeader`

| Input | Type | Cardinality | Projection |
|---|---|---:|---|
| `eyebrow` slot | assigned nodes | 0..* | text-group eyebrow |
| `title` slot | assigned semantic heading | 0..* | title region without heading-level rewrite |
| `supporting` slot | assigned nodes | 0..* | supporting-copy region |
| `sync` slot | assigned nodes | 0..* | metadata region, byte-for-byte consumer content |
| `actions` slot | assigned controls/nodes | 0..* | action region |

The component has no time value, timestamp, interval or timer transition.

### `SkButton` extension

The existing public model remains and gains one size member and one string property:

```ts
type ButtonSize = 'sm' | 'icon';

interface ButtonExtension {
  size?: ButtonSize;
  label?: string;
}
```

`label` is optional for existing text buttons and mandatory by contract when `size === 'icon'`.
Validation uses `label.trim().length` only to distinguish blank from non-empty input; a valid
supplied string is projected unchanged to `aria-label` on whichever real control the existing
`href` branch renders. The slotted glyph remains a consumer node and is not copied or interpreted.

## Projection-only lifecycle

```text
consumer nodes/labels
       │ assign/slot
       ▼
Lit render projects landmarks, groups and real control attributes
       │
       ├─ CSS media/layout projection changes with viewport
       └─ consumer changes input → next render

No fetch/store/router/timer/domain transition exists.
```

Responsive reflow changes only CSS placement. It never writes `open`, `active`, `selected`,
`hidden`, route, team or identity state.

## Invariants

1. The shell's desktop columns are 56px, 240px and remaining width.
2. DOM and keyboard order remains personal → context → header → main.
3. Account precedes logout and follows the rail divider in the element-owned structure.
4. Consumer nodes remain in light DOM and keep their native semantics/events.
5. Region labels name only the internal landmark they belong to.
6. Page-header sync content has no component-generated value or transition.
7. `size="icon"` changes geometry only; tone and button/link branch remain orthogonal.
8. A valid icon control has a computed non-empty accessible name on the real inner node.
9. New shell elements expose no custom event, public method or application-state property.
10. Empty slots project empty structure, never Team Kitty placeholders.

## Invalid and edge inputs

| Input | Outcome |
|---|---|
| Blank/whitespace rail label | generic `Personal navigation` landmark name |
| Blank/whitespace context label | generic `Context` landmark name |
| Empty shell slot | empty region; no invented content/action |
| Long direct context item | visual width constraint/ellipsis; full DOM text remains |
| `size="icon"` with blank/missing `label` | render warning without swallowing content; strict static authoring throws |
| Unknown button size | existing render warning/base-size degradation; static authoring throws |
| `disabled` plus `href` | existing #79 rule: disabled is ignored on the real anchor |
