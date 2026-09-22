# Data Model: action-row-static-form

This mission has no runtime/domain entities — it is a markup-and-CSS contract. "Entities" below
are the anatomical parts and structural relationships the static form must reproduce from the
shadow form (`packages/elements/src/action-row/sk-action-row.ts`,
`packages/styles/src/action-row/sk-action-row.css`).

## Structural entities

### `.sk-action-row-host` (wrapper, new)
The generated container element. Establishes `container-type: inline-size`, carrying
`sk-action-row.css`'s complete `:host` set (`display: block; min-width: 0; container-type:
inline-size`, read from the sheet at authoring time — not copied as a fixed list). Has exactly one
child: `.sk-action-row`. Never carries `display: contents` (deletes the containment box and
silently drops every `@container` rule beneath it — ADR-15 Consequences/Negative).

**Not shipped as package CSS.** Declared only as: (a) the generated markup's structural wrapper
element, (b) a documented consumer instruction (already present in `sk-action-row.css`'s header
comment), and (c) the literal block this mission's own stories/tests author locally, standing in
for a real consumer, until #309 generates it and #310 gates it equal.

### `.sk-action-row` (row root)
Unchanged shape from the shadow form's `part="row"` div. Carries the row's own modifier classes:
- `.sk-action-row--card` (from `layout="card"` in the element; an axis, not the variant table)
- `.sk-action-row--flush` (from `presentation="flush"`)
- `[aria-current="true"]` when the row is non-route and current (attribute OMITTED, never
  `"false"`, when not current)

Two children, in this order:
1. **the trigger** — one of two shapes in the static form (see below; the shadow form's third
   shape, the `<button>`, has no static equivalent because there is no script to drive
   `sk-action-row-activate`)
2. **`.sk-action-row__controls`** — sibling of the trigger, never its descendant (#272 rule).
   Present only when the row has trailing controls; the static form OMITS the element rather than
   rendering it `hidden` (there is no slotchange script to un-hide it).

### Trigger — two static shapes
| Shape | When | Root element | Attributes |
|---|---|---|---|
| Route trigger | consumer supplies a route/href | `<a class="sk-action-row__trigger">` | `href`, `aria-labelledby="sk-action-row-title"`, `aria-current="page"` only when current |
| Static trigger | no route | `<div class="sk-action-row__trigger sk-action-row__trigger--static">` | none beyond class |

The shadow form's third shape — `<button class="sk-action-row__trigger">` emitting
`sk-action-row-activate` — has **no** static equivalent; a server-rendered page has no listener to
receive that event. This is a documented non-goal of the static form, not an oversight (see
spec.md Non-goals).

### Trigger's own children (the "scan content"), each optional except title
| Part | Class | Grid area | Present iff |
|---|---|---|---|
| Mark | `.sk-action-row__marker` | `marker` | consumer supplies mark content |
| Title | `.sk-action-row__title` | `title` | always (only mandatory slot) |
| Reference | `.sk-action-row__reference` | `reference` | consumer supplies reference content |
| Tags | `.sk-action-row__tags` | `tags` | consumer supplies ≥1 tag |
| Metadata | `.sk-action-row__metadata` | `metadata` | consumer supplies metadata content |
| Supporting | `.sk-action-row__supporting` | `supporting` | consumer supplies supporting content |

**Absence rule**: an optional part's wrapper element is omitted from the static markup entirely
when the consumer supplies no content for it — never rendered empty. (The shadow form instead
renders every wrapper always and toggles a `hidden` attribute via `#syncSlot()`'s slotchange
listener; the static form has no script, so "wrapper not in the DOM at all" is its only faithful
absent-state, and is the shape the absent-state tests assert against.)

### `.sk-action-row__controls` (trailing controls region)
Sibling of the trigger inside `.sk-action-row`, never nested inside it (#272, load-bearing).
Contains consumer-authored interactive controls (buttons/links). Present only when the row has at
least one trailing control; otherwise the element is entirely omitted (see Trigger section above
for the parallel rule).

## Relationships / invariants

- `.sk-action-row-host` ⊇ exactly one `.sk-action-row`.
- `.sk-action-row` ⊇ exactly one trigger (route-anchor XOR static-div) + at most one
  `.sk-action-row__controls`, trigger first.
- Trigger's scan-content parts are all descendants of the trigger; `.sk-action-row__controls` is
  NEVER a descendant of the trigger — this is the one cross-cutting invariant every generated
  fixture and every test asserts structurally (`querySelector('.sk-action-row__trigger
  .sk-action-row__controls')` must return `null`).
- Every part's presence in the DOM is 1:1 with the consumer having supplied content for it — no
  part renders as an empty shell in the static form.
- `layout="card"` and `presentation="flush"` are independent boolean axes (both, either, or
  neither may apply) — they are not a mutually exclusive variant enum, unlike e.g. `sk-card`'s
  `blue`/`purple`. This shapes the `sk-action-row.markup.ts` generator plumbing (resolved in
  plan.md): both are `_AXES` entries, not `_VARIANTS` entries, since `_VARIANTS` models a
  mutually-exclusive choice and action-row has none.
- Route mode (`<a>` trigger) and current-page semantics (`aria-current="page"`) compose; static
  (`<div>`) mode and current-row semantics (`aria-current="true"` on `.sk-action-row`) compose. The
  two `aria-current` values are never both present at once (mirrors the shadow element's
  `route ? 'page' on the anchor : 'true' on the row` branch).
