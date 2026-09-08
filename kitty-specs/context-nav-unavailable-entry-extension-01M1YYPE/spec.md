# Mission Specification: Context navigation unavailable-entry extension

**Mission Branch**: `train/elements-first` (planning checkout; implementation uses a Spec Kitty lane)  
**Created**: 2026-09-08  
**Status**: Ready for planning  
**Input**: GitHub issue [#264](https://github.com/spec-kitty/spec-kitty-design/issues/264), child of tracking epic [#263](https://github.com/spec-kitty/spec-kitty-design/issues/263), extending the `.sk-context-nav` family merged by [#262](https://github.com/spec-kitty/spec-kitty-design/pull/262).

## Intent and scope

Extend the existing token-only `.sk-context-nav` styles with one native unavailable-entry anatomy for fixed catalogues. An unavailable destination remains visible in the consumer-authored native list, but is a non-anchor with `aria-disabled="true"`, no interaction contract, and an optional visible annotation supplied verbatim by the consumer.

This is a backward-compatible styles-layer extension. Consumers continue to own catalogue contents, ordering, presence, current selection, URLs, labels, annotation wording, and child-list existence. The library owns only presentation and canonical examples. No Team Kitty data, route, catalogue model, custom element, framework wrapper, or JavaScript behavior enters the public contract.

Representative native anatomy:

```html
<li class="sk-context-nav__item">
  <span class="sk-context-nav__unavailable" aria-disabled="true">
    <span class="sk-context-nav__label">Plan</span>
    <span class="sk-context-nav__annotation">Unavailable</span>
  </span>
</li>
```

## User scenarios and testing

### User Story 1 — Understand a mixed catalogue (Priority: P1)

As a keyboard, pointer, or assistive-technology user, I can distinguish available, current, nested, and unavailable destinations in one native list without mistaking an unavailable destination for an action.

**Why this priority**: The fixed Mission catalogue cannot adopt the shared navigation family honestly unless absent destinations remain visible without becoming dead links or controls.

**Independent Test**: Render mixed native `ul > li` markup containing ordinary anchors, one real current anchor, an available parent with nested links, and unavailable spans. Verify native list order, roles, accessible names, `aria-current`, `aria-disabled`, pointer and keyboard behavior, and non-colour visual distinction.

**Acceptance Scenarios**:

1. **Given** an unavailable catalogue destination with a visible annotation, **when** the navigation is inspected and traversed, **then** it remains in native list order as non-anchor content with `aria-disabled="true"`, has no `href`, click handler, button role, or `tabindex`, and adds no tab stop.
2. **Given** available and unavailable entries in one list, **when** a consumer marks an available anchor current, **then** `aria-current` applies only to that real link and both states remain distinguishable without colour alone.
3. **Given** pointer hover, mouse-down, and keyboard focus over the navigation, **when** an unavailable row is targeted, **then** it exposes no hover, active, pointer-cursor, or focus-ring affordance while available links preserve the existing #256 behavior.

### User Story 2 — Read truthful edge states (Priority: P1)

As a user, I can understand catalogues with no current item or with unavailable parents without the presentation implying hidden destinations or pending behavior.

**Why this priority**: Direct or stale routes and all-unavailable catalogues are legitimate states; inventing a current link or concealed children would misrepresent consumer data.

**Independent Test**: Render an all-unavailable list with no current item, an unavailable entry without annotation, and an unavailable parent beside an available parent with a real nested list. Inspect the native accessibility tree and rendered DOM.

**Acceptance Scenarios**:

1. **Given** every catalogue entry is unavailable, **when** the list renders, **then** no item is exposed or styled as current and every unavailable item remains understandable in list order.
2. **Given** an unavailable entry has no annotation, **when** it renders, **then** its consumer-supplied label remains visible and `aria-disabled="true"` exposes the state without generated fallback copy.
3. **Given** an unavailable parent, **when** it renders beside an available parent with children, **then** the unavailable parent has no rendered child list and the styles imply neither hidden nor pending descendants.

### User Story 3 — Preserve containment and themes (Priority: P2)

As a user at a narrow width, high zoom, in RTL, forced colours, or light mode, I can read the complete unavailable label and annotation without page overflow or lost state cues.

**Why this priority**: The extension is reusable only if it preserves the resilience and theme contract already established by #256.

**Independent Test**: Render long natural-language and unbroken labels and annotations in a 240 CSS-pixel frame and a 390 CSS-pixel viewport, at 200% and 400% zoom, in LTR/RTL, dark, `LightMode`, forced colours, and reduced motion. Verify containment, complete accessible text, zero document-level horizontal overflow, and correct semantic token pairings.

**Acceptance Scenarios**:

1. **Given** long label and annotation text at 240px and 390px, **when** it wraps, **then** no text is clipped and the navigation does not widen its container or document.
2. **Given** RTL content, **when** the mixed catalogue renders, **then** logical alignment and nested hierarchy mirror correctly while annotations remain contained.
3. **Given** dark, `LightMode`, or forced-colours presentation, **when** unavailable and available rows coexist, **then** both remain legible and unavailability is conveyed by visible text and non-interactive shape rather than colour alone.

### Edge cases

- Optional annotation omitted without generating fallback text.
- Annotation longer than the destination label and long unbroken text in either field.
- Mixed current top-level link, current nested link, available parent with children, and unavailable entries.
- All-unavailable catalogue with no `aria-current` anywhere.
- Unavailable parent with no child list beside an available parent with a native nested list.
- Pointer hover/mouse-down over unavailable content and sequential keyboard traversal across adjacent real links.
- 240px sidebar, 390px viewport, 200%/400% zoom, RTL, forced colours, dark, required `LightMode`, and reduced motion.

## Requirements

### Functional requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Native unavailable anatomy | Publish `.sk-context-nav__unavailable` for consumer-authored non-anchor content inside an existing native `.sk-context-nav__item`. | High | Open |
| FR-002 | Optional visible annotation | Publish `.sk-context-nav__annotation` for optional verbatim consumer text; the styles generate no annotation or reason. | High | Open |
| FR-003 | No interaction affordance | Unavailable content has no link/control role, URL, handler, tab stop, pointer cursor, hover, active, or focus treatment. | High | Open |
| FR-004 | Honest state coexistence | Available, current, nested, and unavailable entries coexist without changing the existing link or `aria-current` contract. | High | Open |
| FR-005 | No-current catalogue | An all-unavailable catalogue renders truthfully with no current item. | High | Open |
| FR-006 | Honest parent boundary | An unavailable parent renders no child list; only available parents may be demonstrated with consumer-authored native children. | High | Open |
| FR-007 | Content containment | Labels and annotations remain complete and contained at 240px, 390px, required zoom levels, and in RTL. | High | Open |
| FR-008 | Required examples | Provide canonical exemplars and Storybook stories for mixed, annotation-free, all-unavailable, unavailable-parent, long-content, dark, `LightMode`, forced-colours, RTL, and zoom states. | High | Open |
| FR-009 | Documentation | Document the exact native anatomy, optional annotation, consumer ownership, disabled-anchor prohibition, state interactions, and styles-only rationale. | High | Open |
| FR-010 | Generated distribution | Regenerate the styles-only barrel and applicable story/visual/package ratchets through repository tooling; generated output is never hand-edited. | High | Open |

### Non-functional requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Accessibility | Axe reports zero WCAG 2.1 AA violations; accessibility-tree assertions preserve the named navigation landmark, native list count/order, unavailable state and visible annotation, and find no link/button role or tab stop on unavailable rows. | Accessibility | High | Open |
| NFR-002 | Keyboard and pointer integrity | Sequential focus visits every real link exactly once in DOM order and never visits unavailable entries; unavailable computed pointer/hover/active/focus cues remain unchanged while adjacent links retain #256 behavior. | Accessibility | High | Open |
| NFR-003 | Responsive containment | At 240 CSS pixels, a 390 CSS-pixel viewport, and 200%/400% zoom, navigation and document scroll widths do not exceed their client widths and full accessible text remains available. | Responsive | High | Open |
| NFR-004 | Theme resilience | Default dark, required `LightMode`, forced colours, RTL, and reduced-motion checks pass; `LightMode` uses a real `.sk-light` ancestor and resolves different token-derived colours. | Accessibility | High | Open |
| NFR-005 | Token integrity | Every authored CSS design value uses approved `--sk-*` tokens and correct semantic surface/foreground pairings; no token addition or raw design literal is introduced. | Design system | High | Open |
| NFR-006 | Compatibility | `custom-elements.json`, React wrappers, Vue declarations, and element conformance rows remain byte-for-byte unchanged except for unrelated train changes. | Compatibility | High | Open |
| NFR-007 | Verification | Focused Chromium and Firefox tests, repository lint/type/build/Storybook/axe/browser/visual/mutation/composition/generated/package gates, and exact-head CI pass before merge. | Quality | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Styles only | Do not add a custom element, React wrapper, Vue declaration, JavaScript behavior, router, catalogue model, or application state. | Architecture | High | Binding |
| C-002 | Native non-anchor | Do not use disabled anchors, `href` suppression, click interception, button roles, or `tabindex` for unavailable destinations. | Semantics | High | Binding |
| C-003 | Consumer ownership | Catalogue contents, order, presence, current selection, annotation wording, URLs, child-list existence, and absence reason remain consumer-owned. | Boundary | High | Binding |
| C-004 | No implied behavior | Do not add loading, pending, retry, disclosure, drawer, focus-trap, routing, current inference, count, or badge behavior. | Scope | High | Binding |
| C-005 | No product vocabulary | Public contracts and canonical examples contain no Team Kitty-specific route, catalogue, Mission, repository, or product-data vocabulary. | Boundary | High | Binding |
| C-006 | Preserve neighbors | Do not change `sk-context-sidebar`, `sk-app-shell`, `sk-nav-pill`, or existing `.sk-context-nav` defaults solely for this extension. | Compatibility | High | Binding |

### Key entities

- **Unavailable entry**: consumer-authored non-anchor light-DOM content inside a native list item, marked `aria-disabled="true"` and styled by `.sk-context-nav__unavailable`.
- **Annotation**: optional visible consumer-authored text styled by `.sk-context-nav__annotation`; it names the unavailable state but does not explain or derive its cause.
- **Available destination**: an unchanged native anchor styled by `.sk-context-nav__link`; only available destinations may carry `aria-current`.
- **Child destination list**: an unchanged consumer-authored native nested list; it is present only beneath an available parent.

## Success criteria

- **SC-001**: Every required state has a documented runnable Storybook route and canonical markup generated byte-identically from authored `.html` exemplars.
- **SC-002**: Browser and accessibility-tree checks find zero unavailable anchors/buttons/tab stops/activation handlers and preserve native navigation/list order and real-link focus order.
- **SC-003**: Available, current, nested, and unavailable states have distinct non-colour cues; unavailable presentation does not change on hover, trusted mouse-down, or focus attempts.
- **SC-004**: Long labels and annotations remain unclipped with zero page-level horizontal overflow at 240px, 390px, 200% zoom, and 400% zoom in LTR and RTL.
- **SC-005**: Dark, `LightMode`, forced-colours, reduced-motion, focused browser, axe, visual-regression, generation, mutation, composition-boundary, package, build, type, and lint gates pass on the exact rebased head.
- **SC-006**: The mission changes no element manifest, React wrapper, Vue declaration, custom-element conformance row, token definition, or neighboring component contract.

## Dependencies

- Satisfied: #256 and PR #262 merged into `train/elements-first` as `57e1f466afd3ead40523aa3d25d86b85eda87bce`; the train contains `.sk-context-nav`.
- Independent: #254 (`sk-app-shell` compact-navigation seam).
- Downstream: #265 consumes this extension only after it lands.
