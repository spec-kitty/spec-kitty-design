# Changelog

All notable changes to the Spec Kitty Design System are documented here.
This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

---

## [Unreleased]

### Changed

- **BEHAVIOUR — `sk-notice`'s `heading` slot is now announced** (#228, operator ruling
  2026-09-07). The heading box moved from a sibling *before* the live region to the **first child
  inside it**, so a screen reader reads the whole notice, headline first.

  **What every existing consumer now hears.** This notice —

  ```html
  <sk-notice tone="danger" announce="assertive" message="Retrying in 5s">
    <h3 slot="heading">Deploy failed</h3>
  </sk-notice>
  ```

  — announced "Retrying in 5s" before this change and announces "Deploy failed. Retrying in 5s"
  after it. Nothing about the markup, the attributes or the rendered layout changes; only what is
  inside the region does. It is listed as a behaviour change rather than a break because no
  consumer's code stops working — but a consumer who deliberately kept a headline out of the
  announcement no longer gets that, which is why it is here rather than in a template edit.

  **Migration.** If you slotted a heading you wanted seen and not heard, move it **outside** the
  notice. There is no per-notice switch: the ruling weighed a per-consumer **opt-in** property
  against making it unconditional and chose unconditional, so no opt-out exists either. If you had
  duplicated the headline into `message` to get it announced, delete the duplicate: it is now read
  twice.

  **One consequence to plan for.** `role="status"` and `role="alert"` are both implicitly
  `aria-atomic="true"`, so the *whole* region is re-read on every change. A notice whose `message`
  updates on a timer now repeats its headline on every tick. If that is too chatty, either drop the
  heading or slow the message updates; the atomicity is the platform's, not this element's.

  `::part(heading)` still exists and is still targetable — it is now nested inside `::part(body)`.
  Vertical spacing is unchanged: the grid gap the heading used to contribute is replaced by an equal
  `margin-block-end` on the same box.
- **BREAKING — CSS class families renamed** in `@spec-kitty/styles` (#79, operator ruling
  #139). `.sk-btn*` → `.sk-button*`, and `.sk-tag*` → `.sk-pill-tag*`.
  `check-adopted-css-boundaries.mjs` derives a component's ownership from its own name, so a
  component whose classes carry a different prefix cannot be verified by it. The alternative
  was a hand-maintained prefix map, which is the shape this programme has removed from four
  other places.
  **An earlier revision of this entry claimed that ownership derivation "is the mechanism that
  makes ADR-9 Confirmation #1 checkable at all". That attribution was wrong**, and a lens
  refuted it: Confirmation #1 is *"a lint rule rejects `:root`, `html`, `body` and
  `:host-context()`"*, which is checkable whatever the class prefix, and ADR-9 §2 requires only
  that internal classes keep the `sk-` prefix — not that the family match the tag name. The
  rule is the gate's own generalisation beyond ADR-9's text, and it is now prescriptive for
  future missions, so **it needs to be written into an ADR**: filed as #152. ADR-9 was still
  `Status: Proposed` when this BREAKING rename landed on it; the operator ratified it to
  `Accepted` on 2026-09-06 under the #200 ruling.
  **Consumers copying markup must update these class names.** Nothing was installed from a
  registry at the time of the change (ADR-8, and the programme's semver position), so the
  break is to copied snippets rather than to installs.
- **BREAKING — `.sk-footer-link` renamed** to `.sk-site-footer__link` in `@spec-kitty/styles`
  (#77), 20 occurrences. Same shape and same reason as the rename above: a component's classes
  must be prefixed with its own tag name or `check-adopted-css-boundaries.mjs` rejects the sheet
  as unowned, so the migration could not land without it. **Consumers copying footer markup must
  update this class name.**
- **`@spec-kitty/styles` now exports `./site-footer/*`.** Element consumers of `sk-site-footer`
  must load that sheet in their document — the component's content is slotted, and `::slotted()`
  cannot reach nested children, so without it the footer links fall back to the browser default
  and fail contrast on the dark theme. The subpath was previously unexported, which would have
  made that obligation impossible to discharge.
- **BREAKING — `.sk-eyebrow-pill` folded into `.sk-pill-tag--eyebrow`** (#79). It was a second
  component sharing pill-tag's directory whose rule restated the base almost verbatim,
  differing only in padding, corner radius and font size. It is now a shape MODIFIER and must
  be applied **alongside** the base class: `class="sk-pill-tag sk-pill-tag--eyebrow"`. Applied
  alone it carries only the three overrides and paints nothing. It now composes with the colour
  variants, so a tinted eyebrow is expressible for the first time.
- **Tinted `sk-pill-tag` variants now use the `--sk-on-tint-*` inks** rather than `--sk-color-*`
  (#79). This is a **WCAG AA fix**, not a preference: the raw colour tokens are tuned for the
  dark page surface, and against the pastel light-mode tints they measured 1.51:1 (yellow),
  1.67:1 (green), 1.82:1 (purple) and 2.48:1 (breaking) against AA's 4.5. They now measure
  6.28:1, 7.10:1, 8.00:1 and 7.70:1.
  **The DARK-theme ink changes too, for two variants** — `breaking` moves from `--sk-color-red`
  to `--sk-on-tint-sky`, so a Breaking badge is no longer red on the dark page, and `yellow`
  shifts to the softer `--sk-color-yellow-soft`. Both follow from adopting the on-tint family,
  and `breaking` already sat on a sky-blue tint; called out because a consumer reading this as a
  light-mode fix would otherwise be surprised by a dark-theme recolour. The failure had been invisible because this component's LightMode story carried the
  inert `data-theme="light"` wrapper (#93), so it rendered the dark palette and the a11y gate
  never saw the light pairing.

- `sk-check-bullet` (Angular) now carries `role="listitem"` on its host element and
  renders a `<div>` internally rather than an `<li>`. Angular renders a component's
  template inside its host, so the old bare `<li>` had the host as its parent
  rather than the consumer's `<ul>` — axe reported both `listitem` and `list`
  violations. **Consumers must wrap it in a `<ul>` or another `role="list"`
  ancestor**; a bare bullet is now correctly reported as `aria-required-parent`.
  The `styles` check-bullet is unaffected — it emits a real `<li>` with no host
  element to interpose.

### Added

- Added `sk-metric` and `sk-evidence-chain` as generic presentation primitives (#147). A metric
  preserves consumer-supplied labels and opaque display values in a native definition relationship;
  an evidence chain preserves consumer-owned stage order in a native ordered list and composes real
  metrics. Neither tag imports consumer application data, computes business values, or owns
  application state.
- Added the slot-driven `sk-app-shell`, `sk-personal-rail`, `sk-context-sidebar`, and
  `sk-page-header` elements for generic application-shell geometry, labelled navigation and
  complementary landmarks, and consumer-owned page orientation. The elements expose no route,
  open-state, identity, icon, timer, or application-data policy.
- Added `size="icon"` and the reflected `label` accessibility seam to `sk-button`. Icon buttons
  and links render as 40px square native controls, forward the supplied label to the real inner
  control, and retain a token-driven focus-visible treatment in both themes.
- Added `sk-section-header`, `sk-status-indicator`, and `sk-entity-marker` as controlled,
  presentational feed primitives (#146). Consumers retain heading level, native list markup,
  status copy, and identity lookup; the elements only project supplied content. Status tone and
  entity accessible naming both survive property assignment before custom-element upgrade.
- Added `sk-action-row` as a controlled feed projection (#146). A valid selectable row uses one
  native primary button, keeps trailing controls as siblings, and emits one bubbling, composed,
  non-cancelable `sk-action-row-activate` request with exact `{ id }`. Consumers retain native
  `ul > li`, selection, routing, data, and time ownership.
- Added the controlled `sk-transition-matrix` element for accessible aggregate route-by-time-bucket
  moves, including typed intent events, responsive table semantics, and generated React delivery.
- Added the controlled `sk-bar-chart` element (#148) for compact numeric comparisons. Consumers
  assign a readonly `series` property containing exact `id`, `label`, numeric `value`, and authored
  `displayValue` fields; the element validates and projects that data but never fetches, aggregates,
  sorts, formats, or owns selection. Optional selection emits one bubbling, composed,
  non-cancelable `sk-bar-chart-select` request with exact `{ id }`; the consumer decides whether to
  update `selectedId`. Seven named parts and the data/grid/baseline token family form its closed
  styling contract, with generated React and Vue property delivery from the CEM.
- Added two orthogonal reflected axes to `sk-page-header` (#182): `density="compact"` and `sticky`.
  One header, two densities — the compact form resolves from the same five slots, so there is no
  second header to author. When `sticky` is set the host is the sticky box, so the header pins
  inside whatever scroll region its surroundings provide; below 720px of viewport width or 480px
  of viewport height it returns to normal flow and stacks, with the title, the metadata and the
  trailing action all still present. Four `--sk-layout-page-header-*` tokens carry the geometry,
  one of them a `calc()` over the other two — `--sk-layout-page-header-sticky-scroll-margin`, the
  value consumers apply to their own focusable content so a focused element is not obscured by the
  sticky header (WCAG 2.4.11). The element still owns no timer, clock read or liveness state; a
  test enforces that rather than a comment.

- Initial token layer (`@spec-kitty/tokens`) with 93 design tokens across 13 categories
- Brand fonts bundled: Falling Sky family (30 files), Swansea family
- Brand assets: logo, favicon
- Angular component library (`@spec-kitty/angular`) with 8 component categories
- HTML/JS primitives (`@spec-kitty/styles`) with 8 component categories
- Storybook catalog with design token documentation pages (Colours, Typography, Spacing, Brand)
- User guide documentation (`docs/design-system/`)

### Removed

- **`SkTagHTML()`, `SkEyebrowPillHTML()` and the `PillTagVariant` type** from
  `@spec-kitty/styles` (#79). The styles layer no longer exports markup BUILDER FUNCTIONS: the
  markup is authored once in the element's markup module and generated, so the exports are
  constants like every other component's. `SkPillTagHTML` changes from a function *result* to a
  constant, and per-variant constants (`SkPillTagGreenHTML`, `SkPillTagEyebrowHTML`, …) replace
  the function's arguments.
- **`sk-button-primary.html` and `sk-button-secondary.html`** (#79) — hand-authored markup,
  replaced by generated exports (ADR-10 §3). These were published paths
  (`@spec-kitty/styles/button/*`), so this is a break for anyone who fetched them directly.
  An earlier revision of this entry called them *"duplicates of what `sk-button.html` is now
  generated to contain"*; **that was inaccurate** and a lens caught it — `sk-button.html` is
  the unmodified base (`<button class="sk-button">`), which carries neither modifier and, since
  `.sk-button` sets no background, paints nothing on its own. The tone-carrying equivalents are
  `SkButtonPrimaryHTML` and `SkButtonSecondaryHTML` in `@spec-kitty/styles`, generated per
  variant. The same fold also gave the small and anchor forms painted generated exports, which
  the axis table had previously failed to produce.
- **`sk-ribbon-card-plain.html` and the `skRibbonCardHTML()` builder** (#78), for the same
  reason; the ribbonless form is the generated base export.
- **`.sk-check-bullet__text`** from published check-bullet markup (#79) — a class defined in no
  stylesheet anywhere in the repo.
- **Storybook story id `tags-skpilltag-html--*`** (#79). The styles-layer pill-tag story was
  retitled `Tags/SkPillTag (HTML)` → `Primitives/SkPillTag (HTML)`, so deep links to the old
  id no longer resolve. Undocumented in an earlier revision of this changelog; two lenses
  flagged it.

---

*Releases are tagged on the `main` branch following semantic versioning.*
*Breaking `--sk-*` token name changes increment the major version.*
