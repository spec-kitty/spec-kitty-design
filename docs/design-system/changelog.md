# Changelog

All notable changes to the Spec Kitty Design System are documented here.
This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

---

## [Unreleased]

### Changed

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

---

*Releases are tagged on the `main` branch following semantic versioning.*
*Breaking `--sk-*` token name changes increment the major version.*
