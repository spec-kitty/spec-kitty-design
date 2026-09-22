# Data Model: entity-marker-size-border-image-axis

This mission has no domain/persistence data model — `sk-entity-marker` is a presentational custom
element with no server state, no fetch, and no identity model (explicitly a non-goal). What
follows is the element's **presentation-attribute model**: the reflected attributes/properties
this mission adds or preserves, their legal values, and their effect on rendered geometry. This is
the "entity" a later mission (#303) composes against.

## Entity: `sk-entity-marker` presentation state

| Attribute/Property | Type | Legal values (post-mission) | Default | Reflects? | Invalid-value behavior |
|---|---|---|---|---|---|
| `label` | `string \| undefined` | any string | `undefined` | yes | n/a (not an enum) — trimmed; empty/whitespace-only makes the mark decorative |
| `size` | `string \| undefined` | `undefined` (default) plus the named scale this mission adds (see below) | `undefined` | yes | unknown value warns via `console.warn` and falls back to default size (existing pattern in `entityMarkerSize()`) |
| `shape` | `string \| undefined` | `undefined` (square, default), `circle` | `undefined` | yes | unknown value warns and falls back to square (existing pattern in `entityMarkerShape()`) |
| `border` (new) | `string \| undefined` (or boolean-reflected attribute — plan.md decides the exact shape) | `undefined` (unbordered, default), the bordered modifier value | `undefined` | yes | unknown value warns and falls back to unbordered |

**Unchanged invariants carried over from the current implementation** (must not regress):

- `size` and `shape` are independent axes — every size × every shape combination is valid and
  geometrically consistent (compact stays compact under either shape; circle only changes
  `border-radius`, never box dimensions).
- Omitted axes preserve today's computed default and `sm` boxes exactly (`--sk-space-7`/`--sk-space-1`
  padding default; `--sk-space-5` for `sm`) unless the spec explicitly states and justifies a
  change — this mission does not touch the existing two sizes' computed geometry.
- Content (initials text, inline SVG, `<img>`) projects verbatim through the single default
  `<slot>`; the element never derives, generates, or infers mark content.
- The accessible-naming contract is a pure function of `label` alone: non-empty trimmed `label` →
  `role="img"` + `aria-label`; empty/whitespace-only or absent `label` → `aria-hidden="true"`, no
  `role`, no `aria-label`. Size, shape, border and image presence never participate in this
  computation.

## Entity: named size scale (new)

A size is a **named token pair** — an `inline-size`/`block-size` value plus the padding that
combines with it to produce the marker's computed box — expressed entirely in `--sk-space-*`
tokens (no raw px). Each named size is justified by one Family 4 screen. `/spec-kitty.plan` binds
the final name → token → screen table; this data model records the shape of that table:

| Field | Description |
|---|---|
| `name` | the modifier suffix, e.g. `sm`, `lg` — becomes `.sk-entity-marker--<name>` |
| `space token` | the `--sk-space-*` custom property driving `inline-size`/`block-size` |
| `justifying screen` | the Family 4 screen/mark that requires this size (e.g. "T1 account-avatar in the top bar") |
| `is default?` | whether this is the box produced when `size` is omitted (must remain the current default box) |

## Entity: border modifier (new)

| Field | Description |
|---|---|
| `modifier class` | `.sk-entity-marker--bordered` (or plan.md's chosen name) |
| `border token(s)` | existing `--sk-border-*`/`--sk-border-tint-*` family — no new token, no raw color |
| `outer box guarantee` | the modifier must not change `inline-size`/`block-size` as measured from outside the element — plan.md states the padding/border-box arithmetic that holds this true against the existing `content-box` sizing, and tasks.md requires a visual-regression proof, not an assertion |

## Entity: image axis instruction (documentation surface, not a schema)

Not a data entity in the runtime sense — a **documentation contract** living in
`packages/styles/src/entity-marker/sk-entity-marker.css`'s header comment (already present from
ADR-15/#301) plus, if the size/shape modifiers change the demonstrated rewrite's specificity,
an update to that comment's worked example and boundary statement. Fields the instruction must
carry (from ADR-15's ruling on #304, see research.md Decision 2):

| Field | Description |
|---|---|
| construct classification | "shadow-only", citing ADR-15 |
| structurally faithful static rewrite | the descendant selector a static consumer authors, matching where `<slot>` actually renders (`.sk-entity-marker__content > img`, or the paired-spelling form) |
| tie boundary (generic statement) | "strictly higher specificity than the shipped rewrite is required to override reliably; at a tie, last stylesheet wins; the shadow form yields unconditionally" — no specific tuple asserted outside the CSS comment itself |
| tie boundary (computed figure) | computed from whatever selector specificity the shipped rewrite actually has, including any combined size/shape case this mission adds — lives only in the CSS comment, never duplicated as a hardcoded number in spec.md/plan.md prose |

## Relationships

```
sk-entity-marker (element)
 ├─ size axis ───────── independent ──┐
 ├─ shape axis ───────── independent ──┼─ compose freely, geometry-consistent
 ├─ border axis (new) ── independent ──┘
 └─ image axis (new, shadow-only) ── documented instruction, NOT gated equal to shadow form
      └─ consumed by: static-path consumers authoring their own descendant rule
      └─ downstream consumer: #303 sk-boundary-page (composes size/shape/border/naming; the epic's
         dependency graph names T4 --> T3)
```

No entity in this model has a lifecycle, a stored ID, or a relationship to Team/membership/user
identity — consistent with the mission's binding non-goals.
