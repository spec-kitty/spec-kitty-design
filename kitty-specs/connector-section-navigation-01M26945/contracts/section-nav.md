# Public contract: `.sk-section-nav`

## Class surface

| Class | Intended native/content node | Contract |
|---|---|---|
| `.sk-section-nav` | `nav` | Root strip layout; local horizontal-scroll containment when constrained |
| `.sk-section-nav__link` | `a[href]` | Target geometry, alignment, interactive/current-location presentation |

No further BEM parts are published. Unlike `.sk-context-nav` (grouped/nested/heading/list/icon/
empty-copy/overflow-link vocabulary), this family's shape is a flat sibling strip with exactly two
public classes — a root and a link.

## State and semantics

- Current presentation is selected only by
  `.sk-section-nav__link[aria-current]:not([aria-current="false"])`; the explicit value `"false"`
  remains non-current, and a link with no `aria-current` attribute at all is also non-current.
- Rest, hover, active, focus-visible, and current-location presentations are each distinguishable
  by more than colour (a border/weight/underline component accompanies any colour change).
  `:link`/`:visited` are not required to differ — the family does not force a distinct visited
  style.
- Anchors retain full browser navigation, visited, keyboard, and activation semantics; the family
  attaches no listener capable of intercepting default anchor activation.
- The native `nav`/`a` relationship remains in the accessibility tree with no added role. No
  `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-controls`, or `aria-selected` appears
  anywhere in the family's markup or generated output.
- No roving `tabindex` and no arrow-key keyboard handling exist anywhere in the family; Tab order
  equals consumer DOM order.
- The strip fits its content inline when the content fits; when constrained, the strip itself
  becomes the horizontal-scroll container, and the document never scrolls horizontally because of
  this family.
- A link that receives keyboard focus scrolls fully into view within the strip's own scroll
  container, and its focus indicator is never clipped by the strip's edge.
- Every link's interactive target is at least 44×44 CSS pixels, expressed via `--sk-space-9`
  (never an un-tokened `44px` literal).
- Under `forced-colors: active`, the current-location and focus-visible cues both remain visible via
  `border`/`outline` recoloring, never a `background`-only mechanism.
- Under `prefers-reduced-motion: reduce`, either no transition exists, or exactly the family's own
  transition is disabled.
- All logical spacing/alignment properties are written with CSS logical properties so the strip
  mirrors correctly under `dir="rtl"`.

## Explicitly absent public surfaces

- No `sk-section-nav` tag or custom-elements manifest declaration; no `packages/elements/src/
  section-nav/` directory.
- No element stylesheet module, React wrapper, or Vue type.
- No custom event, property, attribute API, route mapping, or permission-filtering logic.
- No grouping, heading, nested-list, icon, empty-copy, or overflow-link part — that is
  `.sk-context-nav`'s vocabulary, not this family's.
- No `role="tablist"`/`role="tab"`/`role="tabpanel"`, no `aria-controls`/`aria-selected` wiring, no
  roving `tabindex`, no arrow-key script, no disclosure/panel-swap behaviour of any kind.
- No hardcoded label, nav-name default, counter, or badge decoration.
- No responsive drawer/shell presentation mode — that remains `sk-app-shell`'s own contract
  (#254/#274), reused as-is and not extended here.
