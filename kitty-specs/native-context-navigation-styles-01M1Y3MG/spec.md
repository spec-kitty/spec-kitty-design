# Mission Specification: Native context-navigation styles

**Mission Branch**: `train/elements-first` (planning checkout; implementation uses a Spec Kitty lane)  
**Created**: 2026-09-07  
**Status**: Ready for planning  
**Input**: GitHub issue [#256](https://github.com/spec-kitty/spec-kitty-design/issues/256), part of tracking epic #253.

## Intent and scope

Publish one token-only `.sk-context-nav` class family for consumer-authored native grouped and nested navigation inside `sk-context-sidebar`. The family owns presentation only. Consumers continue to own landmarks, headings, native lists and links, current-page annotation, URLs, order, labels, icons, empty copy, and overflow links.

The approved Repository Dossier D1, D2, and D4–D8 screens provide composition and visual intent. They are evidence rather than an application contract: no Team Kitty data, vocabulary, routing, inference, or behavior enters the library.

## User scenarios and testing

### User Story 1 — Navigate grouped destinations (P1)

As a keyboard, pointer, or assistive-technology user, I can traverse grouped native links with a visually clear current destination so I can orient within a Team context without learning an application-specific widget.

**Independent test**: Render native `nav > section > heading + ul > li > a` markup with text-only and icon-plus-text links. Verify the named landmark, heading/list relationships, link order and names, one tab stop per link, `aria-current`, 44×44 CSS-pixel primary targets, and distinct default/current/hover/active/focus-visible presentation.

**Acceptance scenarios**:

1. Given a consumer marks a top-level link with `aria-current="page"`, when the navigation renders, then that link is visibly current without a parallel state class and remains identifiable without colour alone.
2. Given no link is current, when the navigation renders, then no destination is styled as current and every native link remains available in document and tab order.
3. Given decorative and meaningful icon cases, when inspected with assistive technology, then decorative icons are hidden and each link's accessible name comes from text or consumer naming.

### User Story 2 — Follow nested Mission shortcuts (P1)

As a user, I can distinguish nested destinations from their parent and identify either a current parent or current child at narrow sidebar widths.

**Independent test**: Render one, three, and twenty native nested list items, including current-child and current-parent cases, at a 240px sidebar and 390px viewport; verify native nesting/count/order, visible hierarchy/connector, wrapping and no page-level horizontal overflow.

**Acceptance scenarios**:

1. Given a current parent with visible native-list children, when rendered, then the parent remains current and the children retain visible nested hierarchy.
2. Given a nested link has `aria-current="page"`, when rendered, then the child is visibly current and focus/current indications remain distinguishable.
3. Given long natural-language or unbroken labels at narrow widths and 200%/400% zoom, when rendered, then content wraps or truncates intentionally without clipping its accessible name or widening the page.

### User Story 3 — Explain empty and overflow cases honestly (P2)

As a user, I can read consumer-provided empty copy and, when supplied, follow an ordinary management/overflow link without the styles pretending to infer application state.

**Independent test**: Render empty copy alone and empty copy followed by an overflow link. Verify ordinary prose/link semantics, link affordance, contrast, tab order, and absence of CTA treatment or generated content.

**Acceptance scenarios**:

1. Given only empty copy, when rendered, then it is readable secondary text with no fake destination or extra tab stop.
2. Given an overflow link follows empty copy, when rendered, then it remains an ordinary native link with a visible focus indication and accessible name.

## Edge cases

- Long unbroken repository names and long natural-language child labels in a 240px container.
- One, three, and twenty nested children, preserving native order and list counts.
- Top-level current, nested current, current parent with visible children, and no-current variants.
- Text-only links and consumer-owned decorative icon-plus-text links.
- Right-to-left content and browser zoom at 200% and 400%.
- Default dark, required `LightMode`, forced colours, and reduced motion.
- Visited links remain neutral where ordinary application navigation should not reveal history.

## Requirements

### Functional requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-001 | Publish one coherent `.sk-context-nav` BEM family with group, heading, list, item, link, icon, label, children, empty-copy, and overflow-link treatments. | High | Open |
| FR-002 | Apply the classes directly to consumer-authored native `nav`, heading, `ul`, `li`, `a`, and optional prose markup in light DOM. | High | Open |
| FR-003 | Style current destinations exclusively from native `aria-current` values other than `false`, supporting current top-level, current child, current parent with children, explicit `aria-current="false"`, and no-current compositions. | High | Open |
| FR-004 | Present text-only and consumer-owned icon-plus-text links while preserving accessible names and allowing decorative icons to use `aria-hidden="true"`. | High | Open |
| FR-005 | Give primary rows a minimum 44×44 CSS-pixel target using existing `--sk-*` tokens and no un-tokened `44px` literal. | High | Open |
| FR-006 | Preserve visible nested hierarchy for one, three, and twenty children at narrow widths without changing consumer order or count. | High | Open |
| FR-007 | Contain long natural-language and unbroken labels without clipping their accessible name or causing page-level horizontal overflow. | High | Open |
| FR-008 | Style optional consumer-authored empty copy and an optional ordinary overflow/management link without inferring either state. | Medium | Open |
| FR-009 | Provide repository stories for all required states, including default dark, `LightMode`, narrow, long-label, scale, empty/overflow, and forced-colour demonstrations. | High | Open |
| FR-010 | Document the native structure, `aria-current` ownership, icon naming rule, empty/overflow boundary, and styles-only rationale. | High | Open |
| FR-011 | Author canonical styles-only HTML exemplars, generate and drift-check their TypeScript barrel through the repository generator, and update the package barrel/story/doc ratchets required by the current recipe. | High | Open |

### Non-functional requirements

| ID | Requirement | Category | Priority | Status |
|---|---|---|---|---|
| NFR-001 | Axe and accessibility-tree checks report no violations and prove the named navigation landmark, heading association, native list nesting/count/order, `aria-current`, decorative icon handling, link names, and tab order. | Accessibility | High | Open |
| NFR-002 | At 240px context width, a 390px viewport composition, 200% zoom, and 400% zoom, the document has no horizontal overflow and focus/labels are not clipped. | Responsive | High | Open |
| NFR-003 | Current, hover, active, and focus-visible states remain distinguishable without colour alone in dark, `LightMode`, and forced colours. | Accessibility | High | Open |
| NFR-004 | The family uses existing semantic `--sk-*` tokens only for colours, spacing, typography, radii, borders, and motion; repository literal/style gates pass. | Design system | High | Open |
| NFR-005 | Chromium and Firefox behavior checks pass on the exact reviewed SHA; authored tests, Storybook, lint, types, build, generated checks, and applicable mutation gates pass. | Quality | High | Open |
| NFR-006 | If any transition is owned by this family, precisely that transition is disabled under `prefers-reduced-motion: reduce`; no motion is introduced only to satisfy the matrix. | Accessibility | Medium | Open |
| NFR-007 | Generated custom-elements manifest rows, React wrappers, and Vue declarations are byte-for-byte unchanged by the mission except unrelated changes inherited from the target branch. | Compatibility | High | Open |

### Constraints and non-goals

| ID | Constraint | Priority | Status |
|---|---|---|---|
| C-001 | This is styles-only: no `sk-context-nav` custom element, JavaScript behavior, wrapper, shadow-root contract, router integration, or URL/current-state inference. | High | Binding |
| C-002 | Do not widen or change `sk-context-sidebar` defaults and do not extend `sk-nav-pill`. | High | Binding |
| C-003 | Do not add `role="tree"`, `role="menu"`, roving tabindex, disclosure behavior, keyboard tree navigation, or extra tab stops for ordinary page links. | High | Binding |
| C-004 | Consumers own group/child order, maximum child count, current annotation, URLs, labels, icons, empty copy, and overflow-link existence. | High | Binding |
| C-005 | Do not ship Team Kitty route names, fixture data, repository admission logic, Mission ordering/limits, badges/count derivation, fetched icons, drag/drop, or application vocabulary. | High | Binding |
| C-006 | Do not duplicate breadcrumbs or any progress, prose, notice, card, empty-state, branch-chip, tracker, or status component. | High | Binding |

## Public entities and ownership

- **Context navigation**: consumer-authored native `nav` carrying the root class and accessible label.
- **Group**: optional native section associated with a consumer-authored heading.
- **Destination**: native anchor inside a native list item; the consumer owns URL, text, and optional `aria-current`.
- **Child destination list**: nested native `ul`; the consumer owns visibility, order, and count.
- **Icon**: consumer-owned decorative or meaningfully named inline content; this family only aligns it.
- **Empty copy / overflow link**: optional consumer-authored prose and ordinary link; the family does not infer availability.

## Success criteria

- **SC-001**: Every public class and required state has a documented, runnable Storybook example using native semantics; `aria-current="false"` is demonstrably not styled current and browser history does not change link presentation.
- **SC-002**: Automated accessibility assertions pass with zero axe violations and confirm no added roles or tab stops.
- **SC-003**: Automated/manual browser evidence confirms minimum primary target size, visible focus/hierarchy, long-label containment, and zero page-level horizontal overflow at required widths and zoom levels in Chromium and Firefox.
- **SC-004**: Dark, `LightMode`, forced-colour, RTL, and reduced-motion checks pass on the exact reviewed SHA.
- **SC-005**: Styles-only generation and all repository-required tests/gates pass while element-manifest, React-wrapper, and Vue-declaration outputs remain unchanged.
- **SC-006**: The approved Dossier sidebar can be composed inside public `sk-context-sidebar` slots without product CSS entering its shadow root or restating this class family.

## Dependencies

- Closed #145 defines the complementary `sk-context-sidebar` container boundary.
- Closed #92 and #176 establish native-semantics and styles-only precedents.
- #255 consumes this public contract later; #256 does not depend on the other Repository Dossier component missions.
- #213 breadcrumbs are page-orientation primitives and must not be duplicated here.

## Assumptions

- Existing token values can express the required 44px-equivalent target and visual hierarchy; no new token is in scope unless a repository gate proves otherwise.
- One work package is expected because the public stylesheet, generated styles-only exemplars/barrel, stories, tests, and documentation form one atomic contract and cannot independently ship without an incomplete public surface.
