# Changelog

All notable changes to the Spec Kitty Design System are documented here.
This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

---

## [Unreleased]

### Changed

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
  future missions, so **it needs to be written into an ADR**: filed as #152. ADR-9 is also
  still `Status: Proposed` while this BREAKING rename rests on it.
  **Consumers copying markup must update these class names.** Nothing was installed from a
  registry at the time of the change (ADR-8, and the programme's semver position), so the
  break is to copied snippets rather than to installs.
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
