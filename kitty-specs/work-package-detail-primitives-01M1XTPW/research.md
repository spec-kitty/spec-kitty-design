# Research: Work Package Detail Primitives

## Decision: keep three surfaces in light DOM

**Rationale**: ADR-10's recorded styles-only class applies when a component's value is the semantics of the native element it styles. Breadcrumb navigation depends on native `<nav>/<ol>/<li>/<a>` relationships; prompt prose owns native headings, lists, links, code, and tables; transition history is an ordered list. A shadow-host wrapper would add no behavior and could sever the relationships #92 and ADR-9 show are fragile across roots.

**Alternatives considered**:

- Custom elements for each surface: rejected because they would re-host native relationships and freeze consumer content shape.
- One Work Package detail element: rejected by #208/#213 because it imports routing, application state, and domain vocabulary into the library.
- A JavaScript timeline that sorts entries: rejected because order is consumer data and must render verbatim.

## Decision: CSS owns decoration, not semantic content

**Rationale**: Breadcrumb separators and timeline connectors/dots are purely visual. Breadcrumb separator generated content uses the CSS alternate-text syntax with an empty alternative. Timeline geometry can use borders/backgrounds and needs no generated text. The accessibility tree therefore derives from authored link/list text alone.

**Alternatives considered**:

- Authored separator text: valid only if marked hidden per occurrence and easy for consumers to get wrong.
- Glyph text inside each timeline event: rejected because it risks entering names and duplicates information conveyed by ordered-list position.

## Decision: complete/pending is passive state, not checkbox state

**Rationale**: #92 already establishes the custom-element listitem seam. The issue explicitly requires read-only state and forbids invalid `aria-checked` on a list item. Hidden state text gives assistive technology the same distinction sighted users receive from the state-derived decorative icon, while retaining native/list-compatible reading order and no interaction contract.

**Alternatives considered**:

- `role="checkbox"`/`aria-checked`: rejected because the element neither accepts input nor owns toggling and would replace its listitem semantics.
- Icon-only state: rejected because color/glyph alone is not an accessible state carrier.
- Interactive checkbox control: rejected as application state and an explicit non-goal.

## Decision: omission and unsupported runtime values degrade to complete

**Rationale**: Omission must preserve the shipped component's complete/check appearance. Normalizing every value other than `pending` to complete keeps an invalid runtime attribute from throwing or swallowing slotted text. The static generator remains strict, consistent with ADR-10's different build-time/runtime failure policies.

**Alternatives considered**:

- Defaulting the reflected property to `complete` and always emitting the attribute: rejected because it changes legacy serialized DOM unnecessarily.
- Throwing in `render()`: rejected because it can make Lit reject `updateComplete` and consume the user's content, the exact failure ADR-10 records.

## Decision: use existing tokens and generation seams

**Rationale**: The current token catalogue already contains spacing, type, border width, radius, surface, foreground, and motion values needed by all four surfaces. Styles-only barrels derive from authored HTML via `build-styles-only-markup.mjs`; check-bullet outputs derive from its markup and manifest. No token or generator architecture change is required.

**Alternatives considered**:

- Component-specific tokens: rejected because no consumer-facing tuning need exists and the tint/type/layout vocabulary already covers the design.
- Hand-authored barrel/wrapper changes: rejected by ADR-10/11 drift gates.

## Visual-reference finding

The live Stitch project URL for project `13081441628826430456` was requested on 2026-09-07. The unauthenticated response exposes only the Stitch application/account shell and does not expose screen `cd2b2a22c0cc43d6b53c69a76dd6df7d`; no pixel-level claim can be drawn from it. Issue #213's required states and public contract therefore remain the implementation authority, with current train tokens and established T10/T11 catalogue grammar guiding visual choices.
