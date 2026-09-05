# Changelog

All notable changes to the `@spec-kitty/*` packages.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning is
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). All four packages version together —
ADR-2 makes them independently publishable, and they have so far had no reason to diverge.

## [1.0.0] — unreleased

First release. Nothing has ever been published to the `@spec-kitty` scope, so there is no
compatibility window to honour and no deprecation cycle to run.

### `@spec-kitty/elements`

The custom-element base layer (ADR-8): fifteen components as standard custom elements, built on
Lit, with styling delivered through constructed stylesheets and a closed styling API (ADR-9).

- `sk-blog-card`, `sk-button`, `sk-card`, `sk-check-bullet`, `sk-feature-card`, `sk-form-input`,
  `sk-form-textarea`, `sk-grid`, `sk-nav-pill`, `sk-pill-tag`, `sk-ribbon-card`, `sk-section-banner`,
  `sk-site-footer`, `sk-stub`, `sk-transition-matrix`
- Two distribution entries (ADR-10 §2): an ESM build with `lit` external, and a self-contained
  classic-script IIFE that loads from `file://` with no network
- `custom-elements.json` manifest, generated and drift-checked
- Registration goes through a guarded `define()`, so loading the same version twice is safe

### `@spec-kitty/react`

React wrappers generated from the manifest. No build step — the generator emits `.js` and `.d.ts`
directly, so `src/` is the artifact, and CI fails on drift.

### `@spec-kitty/styles`

The stylesheets, as both authored CSS and generated static HTML forms (ADR-10 §3), for consumers
rendering without JavaScript. Subpath exports for all sixteen component directories.

### `@spec-kitty/tokens`

Design tokens as a single CSS file of custom properties, plus the brand fonts and assets.

### Notes for the first release

- **One major per page.** `customElements.define` is global and throws on a duplicate tag, so two
  majors of `@spec-kitty/elements` on one page is a hard runtime failure. Depend on it as a peer,
  not a direct dependency, if you are shipping a library.
- **Provenance and SBOM.** Every package publishes with `--provenance`, and a CycloneDX SBOM is
  attached to the GitHub Release (ADR-5 FR-044, FR-045).
- **`@spec-kitty/elements`' peer on `@spec-kitty/styles` is provisional.** The stylesheets are
  compiled into the bundle at build time, so there is no runtime reference to that package — the
  peer is expected to be **removed** in a later minor. Dropping a peer relaxes an install
  constraint rather than breaking one, so it will not be a major. Stated here so the removal is an
  announced relaxation rather than a surprise: npm ≥7 auto-installs peers, so a 1.0.0 consumer of
  `@spec-kitty/elements` currently pulls `@spec-kitty/styles` (64 files, 119.8 KiB) without using
  it. The peer on `@spec-kitty/tokens` is real — the components read `var(--sk-*)` and need the
  properties on the page.
- **SRI.** The classic-script bundle's `sha384` integrity hash is recorded in
  the **Subresource Integrity** section of `packages/elements/SIZES.md`, regenerated and `--check`ed by CI.

### Fixed before first publish

Found by the release gate added in #80, all of which would otherwise have shipped:

- `@spec-kitty/elements` and `@spec-kitty/react` were marked `"private": true` and would have been
  **silently skipped** — `npm publish` exits 0 on a private package
- `@spec-kitty/styles` shipped 28 sourcemaps, with `inlineSources` embedding the original TypeScript
  into them, against ADR-5's contents audit
- `@spec-kitty/styles` exposed subpath exports for 3 of its 15 component directories

### Known limitations

- **`--sk-font-mono` does not resolve to JetBrains Mono.** The token declares
  `'JetBrains Mono', ui-monospace, "SF Mono", Menlo, Consolas, monospace`, but that face is neither
  bundled nor fetched, so it resolves to `ui-monospace` and its fallbacks. `tokens.css` previously
  carried a Google Fonts `@import` positioned after a style rule, which CSS requires to precede
  every rule — it was invalid and dropped by every browser, so the face has never loaded for
  anyone. The dead line is removed; the declaration is not yet corrected. Whether the family is
  self-hosted or dropped from the token is open (fork 2 on #80). **No consumer action is needed and
  nothing changes at 1.0.0** — this documents a declaration that overstates what ships.

[1.0.0]: https://github.com/spec-kitty/spec-kitty-design/releases/tag/v1.0.0
