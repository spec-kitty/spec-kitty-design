# Spec Kitty — train/elements-first
> Surface: web

> Category: Developer tools
> The canonical visual language for Spec Kitty and Team Kitty product surfaces. This OpenDesign
> package is **generated** from `spec-kitty/spec-kitty-design` by
> `scripts/build-opendesign-package.mjs` and committed beside the library it describes; the
> library version it was generated from is recorded in `manifest.json`.

## Authority and source order

The sibling `tokens.css` is a byte-identical copy of
`packages/tokens/src/tokens.css`, digest-checked on every pull request. It is authoritative for every literal
colour, type family, size, spacing, radius, shadow, motion, and shell-geometry value. Preserve the
`--sk-*` names and values exactly. Do not translate them into OpenDesign generic token names, add
parallel aliases, or replace them with values inferred from screenshots.

For component anatomy and behavior, use the `@spec-kitty/elements` and `@spec-kitty/styles`
contracts from the same library version. The sibling `components.html` shows every
component's static form, and the generated section at the end of this file lists them. Application screenshots and older Team Kitty CSS are
references only; they never override this package.

## Visual character

Spec Kitty is a warm, high-contrast developer-tool interface: blackish operational surfaces,
crisp one-pixel borders, dense information, and restrained yellow focus. The product should feel
precise and quietly playful, not corporate, glossy, or futuristic. Hierarchy comes from type,
spacing, and surface steps rather than decorative effects.

Avoid gradients, glassmorphism, oversized hero treatments, floating-card mosaics, ornamental
charts, neon glows, and excessive pill clusters. Use the signature yellow for primary actions,
focus, and a small number of brand moments—not as a general-purpose decoration.

## Colour and theme rules

Dark is the default theme. Its core ladder is page `#0D0E11`, hero `#121317`, card `#181A1F`,
input `#1C1F25`, pill `#212830`, and muted surface `#262C36`. Text progresses from white headings
through `#D6D6DA`, `#A9A9B0`, and `#81818B`. Borders are `#2B313B` and `#353C48`.

Light theme is selected with `:root[data-theme="light"]` or `.sk-light`. It uses a warm cream
page (`#F8F5EC`), white cards, near-black ink, and sage (`#3D7A3D`) for interactive accents. Yellow
remains the brand mark and focus colour. Never implement light mode by inverting the dark palette.

Surface and foreground tokens are pairs. Use `--sk-surface-card` with `--sk-fg-on-card`, primary
yellow with `--sk-fg-on-primary`, tint surfaces with their matching `--sk-on-tint-*`, and status
surfaces with their matching `--sk-on-status-*`. A tone supplements visible text; colour alone
must never communicate state.

## Typography

Use Falling Sky for product headings and strong labels, Swansea or the declared system sans stack
for body copy, and `--sk-font-mono` for branches, commits, Work Package identifiers, commands, and
machine facts. Keep body text readable and compact. Use the published `--sk-text-*` and
`--sk-weight-*` scales rather than inventing intermediate sizes.

Falling Sky display variants are accents, not defaults: condensed is for narrow headings,
extended for wide hero numerals, outline only at large display sizes, and Boldplus only for rare
high-emphasis moments. Sentence case is the default. Do not use all caps for ordinary headings or
tracking-heavy microcopy as decoration.

## Layout and spacing

Build on the four-pixel spacing rhythm in `--sk-space-1` through `--sk-space-12`. Desktop Team
Kitty shells use a 56px personal rail and a 240px context sidebar via
`--sk-layout-personal-rail-width` and `--sk-layout-context-sidebar-width`. Main content must use
`minmax(0, 1fr)` and permit long repository names, branches, and identifiers to wrap safely.

At narrow widths, preserve document order and collapse the shell to one column. Do not hide
content simply to make a desktop composition fit. Sticky compact headers lose stickiness below
720px viewport width or 480px viewport height, and focused content must use the published sticky
scroll-margin token.

## Components and composition

Prefer existing primitives from the library. The complete list of custom elements, of components
with a static form, and of those OpenDesign cannot emit is **derived from the source tree** and
kept in the generated section at the end of this file — a hand-written list here had already
drifted, missing `sk-theme-toggle`.

Use native semantic HTML with the styles-only packages for `breadcrumbs`, `collection`,
`boundary-page`, `context-nav`, `data-table`, `disclosure`, `empty-state`, `event-timeline` (including its compact
modifier), `facts`, `form-field`, `form-select`, `progress`, `prose`, `segmented-choice`,
`checkbox-choice-group`, `skip-link`, `workflow-board`, and `workflow-lane`. Those are
intentionally not custom elements because light-DOM semantics are part of their contract. Do not
invent wrapper elements.

The current train adds three especially relevant composition contracts: native checkbox-choice
groups for multi-select filters such as the detailed Kanban lane filter; compact event timelines
for dense operational chronology; and `sk-action-row` native-route plus flush presentations for
real link destinations without card-within-card chrome. Use their source anatomy from the library
branch rather than recreating approximations.

The current train also includes the complete Mission Reading pattern family from issue #292:
M1–M8, the compact drawer, unavailable entries, snapshot notice, Other artifacts/Ops states,
separate truth regions, narrow and threshold fixtures, long-content stress, forced colors, and
light mode. Reuse this pattern source directly for Mission Reading corrections. M9/M10 terminal
fragment failure and degraded escaped-source states remain application-owned extensions until the
library explicitly adopts them.

Static consumers of the context sidebar, metric, notice, page header, personal rail,
section header, and site footer must preserve the current cross-sheet `::part()` styling
contract. The `93c82f1` authority update hardens and documents those adopted-style seams;
it does not add new product data or navigation capability.

The current train also contains the corrected determinate and compact-indeterminate Progress
forced-colors contract. Preserve its non-motion cue and visible indicator boundary when a
screen actually composes the published Progress pattern; this authority update does not alter
Mission Kanban or workflow-board anatomy.

The current train defines `--sk-border-control` separately from passive boundaries and gives
native `.sk-input` and `sk-form-input` controls a minimum block size of `--sk-space-9`. Preserve
that stronger control boundary and minimum target size in application-owned selects and text
inputs; do not fall back to `--sk-border-default` or a shorter bespoke control.

Issue #274 adds the `sk-app-shell` `presentation="rail-preserving"` mode for applications that
must retain the 56px personal rail while the context sidebar collapses. It activates against the
shell's own content-box width through 1100px, reuses the existing consumer-controlled compact
header/navigation seam, and leaves the personal rail active. The shell suppresses inactive
light-DOM roots with `inert` and `aria-hidden`; the consumer still owns the trigger,
`aria-expanded`, routes, `open` value, dismissal acceptance, and navigation-close behavior. Use
this mode only where product information architecture requires persistent personal navigation;
do not approximate it with another drawer or a viewport-only media query.

Issue #257 adds `sk-copy-field` for a supplied non-editable value, one native copy action,
and one stable polite result region. Its outcomes are exactly `copied`, `manual`, or `failed`;
it never emits the copied value, runs a command, retries, times out, or owns application state.
Prefer it when a later screen needs this complete interaction contract rather than assembling an
ad-hoc clipboard control.

Components own presentation and accessible structure; consumers own routes, labels, timestamps,
data, polling, calculations, and state transitions. A page header does not calculate freshness,
a metric does not calculate its value, and an action row does not navigate unless the consumer
provides the real action.

## Interaction and motion

Use `--sk-motion-duration-fast`, `--sk-motion-duration-base`, and
`--sk-motion-duration-slow` with the published ease curves. Motion should explain a state or
density change, not decorate idle surfaces. Respect `prefers-reduced-motion` by disabling exactly
the transitions a component owns.

Every visible action must be a real native link or button. Use yellow focus treatment through the
published focus tokens. Icon-only controls require accessible names. Use inline, stroke-based SVG
icons with rounded line caps; do not use icon fonts, ligature text, emoji, or remote icon scripts.

## Accessibility and resilience

Preserve native landmarks, heading order, table/list relationships, and label associations.
Normal text must meet 4.5:1 contrast and large text or non-text boundaries must meet 3:1 against
their actual paired surface. Do not claim that a status is accessible merely because its token
pair was measured; verify the complete rendered composition.

Support keyboard navigation, `:focus-visible`, forced-colours mode, long content, zoom, and
reduced motion. Keep content available when the layout reflows. Loading, empty, unavailable, and
stale states must use honest copy and must not manufacture facts or actions.

## Prototype and handoff rules

For self-contained HTML prototypes, paste `tokens.css` unchanged into the first style block and
write component rules only with `var(--sk-*)` references. Do not introduce remote CSS, font,
script, or icon dependencies. If local font assets cannot be emitted with the artifact, retain the
authoritative font stacks and allow their documented system fallbacks to resolve.

Ground product data and actions in the target application's current backend before drawing them.
An attractive control for a route, field, filter, freshness claim, or action that does not exist
is a product defect. When the backend has no value, design the honest absence rather than a
fictional placeholder.

<!-- BEGIN GENERATED: components — scripts/build-opendesign-package.mjs; do not edit between these markers -->

## Components in this package

Derived from the source tree by `scripts/build-opendesign-package.mjs`. **34** components
have a static form and appear in `components.html`; use their markup and class names exactly.

| Component | Static forms |
|---|---|
| `action-row` | `default` |
| `blog-card` | `default` |
| `boundary-page` | `long-email`, `long-identifier`, `no-action`, `several-actions`, `terminal-card`, `with-footnote`, `without-footnote`, `without-mark` |
| `breadcrumbs` | `forced-colors`, `long-labels`, `narrow`, `one-level`, `six-level`, `three-level` |
| `button` | `default` |
| `card` | `default` |
| `check-bullet` | `default` |
| `checkbox-choice-group` | `default`, `disabled`, `long`, `none`, `zero-counts` |
| `collection` | `closed`, `empty`, `fifty-items`, `long-text`, `no-count`, `no-footer`, `one-item`, `open` |
| `context-nav` | `current-nested`, `default`, `empty-overflow`, `empty`, `long-labels`, `scale`, `unavailable-all`, `unavailable-long`, `unavailable-mixed`, `unavailable-parent` |
| `data-table` | `default`, `narrow-scrollable`, `sticky-header` |
| `disclosure` | `closed`, `long-body`, `nested`, `open` |
| `empty-state` | `inline`, `with-action`, `without-action` |
| `event-timeline` | `compact-default`, `compact-degraded`, `compact-forced-colors`, `compact-leading-marker`, `compact-linked`, `compact-long-content`, `compact-narrow`, `compact-one-event`, `compact-twenty-events`, `forced-colors`, `long-transition`, `narrow`, `one-event`, `twenty-events`, `two-events`, `unavailable-retention`, `verified-marker` |
| `facts` | `compact`, `empty-value`, `long-value`, `two-col`, `default` |
| `feature-card` | `default` |
| `form-field` | `default`, `form-input-default`, `form-input-disabled`, `form-input-error`, `form-input-filled`, `form-input-focus`, `form-textarea-default`, `form-textarea-error` |
| `form-select` | `compact`, `disabled`, `long-options`, `optgroups`, `required-invalid`, `t10-lane`, `t12-filters` |
| `grid` | `default` |
| `nav-pill` | `default` |
| `pill-tag` | `default` |
| `progress` | `compact`, `complete`, `forced-colors`, `indeterminate-compact`, `indeterminate-forced-colors`, `indeterminate-long-label`, `indeterminate-narrow`, `indeterminate-with-meta`, `indeterminate`, `large-total`, `long-label`, `narrow`, `t10`, `zero` |
| `prose` | `absent-prompt`, `long-code`, `narrow`, `prompt`, `wide-table` |
| `public-header` | `brand-only`, `current-action`, `long-labels`, `many-actions`, `mixed-controls`, `one-action`, `theme-slot`, `two-actions` |
| `radio-choice-group` | `default`, `disabled-group`, `disabled`, `long`, `none`, `one`, `required-invalid`, `two` |
| `ribbon-card` | `default` |
| `section-banner` | `default` |
| `section-nav` | `default`, `long-labels`, `many-routes`, `no-current`, `one-route`, `two-route` |
| `segmented-choice` | `all-disabled`, `default`, `five-items`, `long-labels`, `no-selection`, `one-disabled`, `second-selected`, `third-selected`, `two-items` |
| `site-footer` | `default` |
| `skip-link` | `unfocused` |
| `stub` | `default` |
| `workflow-board` | `all-empty`, `fifty-items`, `fitting`, `long-labels-and-items`, `one-empty-lane`, `populated`, `single-lane-narrow` |
| `workflow-lane` | `default`, `empty` |

## Elements whose static form lives in another component

- `sk-form-input` — use the `form-field` forms whose variant starts with `form-input`.
- `sk-form-textarea` — use the `form-field` forms whose variant starts with `form-textarea`.

## Components OpenDesign cannot emit

**16** custom elements have **no static form** today, so they are not in the fixture and
must not be approximated with invented markup. They exist in the library as shadow-DOM elements only:

`sk-app-shell`, `sk-bar-chart`, `sk-confirm-dialog`, `sk-context-sidebar`, `sk-copy-field`, `sk-entity-marker`, `sk-evidence-chain`, `sk-metric`, `sk-notice`, `sk-page-header`, `sk-personal-rail`, `sk-section-header`, `sk-status-indicator`, `sk-theme-toggle`, `sk-time-series-chart`, `sk-transition-matrix`.

## Forms left out of the fixture

**2** of the library's static forms compose a custom element, so they cannot render
without JavaScript and are not in `components.html`. The rest of each component is:

- `boundary-page` / `forced-colors` — custom-element tags in the fixture: sk-entity-marker
- `boundary-page` / `form-card` — custom-element tags in the fixture: sk-entity-marker

## Static-form fidelity caveat

These 11 components ship `:host` or `::slotted` rules in their CSS. The rules are inert in
static markup, so a behaviour the element gets from its host — for example a container-query
reflow — may not apply to the static form. Whether such constructs get a static equivalent is ADR-15,
which is still Proposed:

`action-row`, `blog-card`, `button`, `check-bullet`, `feature-card`, `grid`, `nav-pill`, `pill-tag`, `ribbon-card`, `section-banner`, `site-footer`.

<!-- END GENERATED: components -->
