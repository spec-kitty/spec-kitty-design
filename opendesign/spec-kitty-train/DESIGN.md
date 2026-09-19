# Spec Kitty — train/elements-first
> Surface: web

> Category: Developer tools
> The canonical visual language for Spec Kitty and Team Kitty product surfaces. This OpenDesign
> package is **generated** from `spec-kitty/spec-kitty-design` by
> `scripts/build-opendesign-package.mjs` and committed beside the library it describes; the
> library version it was generated from is recorded in `manifest.json`.

## Authority and source order

The sibling `tokens.css` is the stylesheet `@spec-kitty/tokens` publishes, regenerated and
drift-checked on every pull request. It is authoritative for every literal
colour, type family, size, spacing, radius, shadow, motion, and shell-geometry value. Preserve the
`--sk-*` names and values exactly. Do not translate them into OpenDesign generic token names, add
parallel aliases, or replace them with values inferred from screenshots.

For component anatomy, use the component pages in this package: `components/<name>.html` holds a
component's CSS and every static form it has, and the generated section at the end of this file
lists them with their exact classes. Application screenshots and older Team Kitty CSS are
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

Dark is the base palette. Its core ladder is page `#0D0E11`, hero `#121317`, card `#181A1F`,
input `#1C1F25`, pill `#212830`, and muted surface `#262C36`. Text progresses from white headings
through `#D6D6DA`, `#A9A9B0`, and `#81818B`. Borders are `#2B313B` and `#353C48`.

Light theme is selected with `:root[data-theme="light"]` or `.sk-light`, and `data-theme="dark"`
pins dark. With no `data-theme` at all, `tokens.css` follows the operating system's
`prefers-color-scheme`, so set `data-theme` when an artifact must render in one theme. Light uses a warm cream
page (`#F8F5EC`), white cards, near-black ink, and sage (`#3D7A3D`) for interactive accents. Yellow
remains the brand mark and focus colour. Never implement light mode by inverting the dark palette.

Surface and foreground tokens are pairs. Use `--sk-surface-card` with `--sk-fg-on-card`, primary
yellow with `--sk-fg-on-primary`, tint surfaces with their matching `--sk-on-tint-*`, and status
surfaces with their matching `--sk-on-status-*`. A tone supplements visible text; colour alone
must never communicate state.

## Typography

Use Falling Sky (`--sk-font-display`) for product headings and strong labels, Inter
(`--sk-font-sans`) for body copy and UI, and `--sk-font-mono` for branches, commits, Work Package identifiers, commands, and
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
content simply to make a desktop composition fit.

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

Three composition contracts matter most for current Team Kitty screens, and all three have
component pages here: `checkbox-choice-group` for multi-select filters such as the detailed Kanban
lane filter, the compact `event-timeline` for dense operational chronology, and `action-row` in its
native-route and flush presentations for real link destinations without card-within-card chrome.
Copy their anatomy from their pages rather than recreating approximations.

**Shell, status and dialog elements are shadow-DOM only and cannot be emitted from this package.**
The generated section names every one of them. The application shell with its personal rail and
context sidebar, the page and section headers, metrics, notices, the copy field, charts and the
confirm dialog render only with the library's JavaScript. Leave them out of a static artifact, or
mark where one belongs, rather than inventing markup for them. The layout tokens above still
apply: a static page can reserve the 56px rail and 240px sidebar with plain layout.

`form-field`'s `.sk-input` has a minimum block size of `--sk-space-9` and uses
`--sk-border-control`, which is deliberately stronger than passive boundaries. Keep both in any
text input or select you compose; do not fall back to `--sk-border-default` or a shorter control.

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

For self-contained HTML prototypes, paste `tokens.css` unchanged into the first style block, then
each component page's `<style>` block, and write any further rules only with `var(--sk-*)`
references. Do not introduce remote CSS, font,
script, or icon dependencies. If local font assets cannot be emitted with the artifact, retain the
authoritative font stacks and allow their documented system fallbacks to resolve.

Ground product data and actions in the target application's current backend before drawing them.
An attractive control for a route, field, filter, freshness claim, or action that does not exist
is a product defect. When the backend has no value, design the honest absence rather than a
fictional placeholder.

<!-- BEGIN GENERATED: components — scripts/build-opendesign-package.mjs; do not edit between these markers -->

## Components in this package

Derived from the source tree by `scripts/build-opendesign-package.mjs`. **34** components
have a static form. Each has its own page, `components/<name>.html`, holding its CSS and every static
form. Read the page for the component you need, then copy its `<style>` block and its markup
verbatim — after `tokens.css`, which the page links but does not repeat. Read it from the linked
design-system folder when the project has one, or with
`"$OD_NODE_BIN" "$OD_BIN" tools design-systems read --path components/<name>.html`.

**The class vocabulary is closed.** The classes listed for a component are every class its CSS
styles and its forms use. A class that is not listed does not exist in the library: never
invent a BEM element or modifier — `sk-radio-choice__input` is not a class; the library's is
`sk-radio-choice-group__control`. When no page can be read, build from these names only.

| Component | Page | Static forms | Classes |
|---|---|---|---|
| `action-row` | `components/action-row.html` | `default` | `sk-action-row` `sk-action-row--card` `sk-action-row--flush` `sk-action-row-host` `sk-action-row__controls` `sk-action-row__marker` `sk-action-row__metadata` `sk-action-row__reference` `sk-action-row__supporting` `sk-action-row__tags` `sk-action-row__title` `sk-action-row__trigger` `sk-action-row__trigger--static` `sk-pill-tag` |
| `blog-card` | `components/blog-card.html` | `default` | `sk-blog-card` `sk-blog-card__content` `sk-blog-card__excerpt` `sk-blog-card__eyebrow` `sk-blog-card__meta` `sk-blog-card__read-more` `sk-blog-card__thumbnail` `sk-blog-card__title` `sk-card` |
| `boundary-page` | `components/boundary-page.html` | `long-email`, `long-identifier`, `no-action`, `several-actions`, `terminal-card`, `with-footnote`, `without-footnote`, `without-mark` | `sk-boundary-page` `sk-boundary-page__action-group` `sk-boundary-page__body` `sk-boundary-page__card` `sk-boundary-page__footnote` `sk-boundary-page__mark` `sk-boundary-page__stage` `sk-boundary-page__title` `sk-pill-tag` `sk-pill-tag--status-success` |
| `breadcrumbs` | `components/breadcrumbs.html` | `forced-colors`, `long-labels`, `narrow`, `one-level`, `six-level`, `three-level` | `sk-breadcrumbs` `sk-breadcrumbs--narrow` `sk-breadcrumbs__item` `sk-breadcrumbs__link` `sk-breadcrumbs__list` |
| `button` | `components/button.html` | `default` | `sk-button` `sk-button--busy` `sk-button--danger-secondary` `sk-button--ghost` `sk-button--icon` `sk-button--primary` `sk-button--secondary` `sk-button--sm` `sk-button__busy-cue` |
| `card` | `components/card.html` | `default` | `sk-card` `sk-card--blue` `sk-card--inset` `sk-card--purple` `sk-card--status-attention` `sk-card--status-danger` `sk-card--status-info` `sk-card--status-neutral` `sk-card--status-recovery` `sk-card--status-success` |
| `check-bullet` | `components/check-bullet.html` | `default` | `sk-check-bullet` `sk-check-bullet--pending` `sk-check-bullet__icon` `sk-check-bullet__state` |
| `checkbox-choice-group` | `components/checkbox-choice-group.html` | `default`, `disabled`, `long`, `none`, `zero-counts` | `sk-checkbox-choice-group` `sk-checkbox-choice-group__choice` `sk-checkbox-choice-group__control` `sk-checkbox-choice-group__label` `sk-checkbox-choice-group__legend` `sk-checkbox-choice-group__metadata` `sk-checkbox-choice-group__options` |
| `collection` | `components/collection.html` | `closed`, `empty`, `fifty-items`, `long-text`, `no-count`, `no-footer`, `one-item`, `open` | `sk-collection` `sk-collection__action` `sk-collection__body` `sk-collection__count` `sk-collection__footer` `sk-collection__header` `sk-collection__heading` `sk-collection__item` `sk-collection__list` `sk-collection__marker` `sk-collection__state-label` `sk-collection__toggle` |
| `context-nav` | `components/context-nav.html` | `current-nested`, `default`, `empty-overflow`, `empty`, `long-labels`, `scale`, `unavailable-all`, `unavailable-long`, `unavailable-mixed`, `unavailable-parent` | `sk-context-nav` `sk-context-nav__annotation` `sk-context-nav__children` `sk-context-nav__empty-copy` `sk-context-nav__group` `sk-context-nav__heading` `sk-context-nav__icon` `sk-context-nav__item` `sk-context-nav__label` `sk-context-nav__link` `sk-context-nav__list` `sk-context-nav__overflow-link` `sk-context-nav__unavailable` |
| `data-table` | `components/data-table.html` | `default`, `narrow-scrollable`, `sticky-header` | `sk-data-table` `sk-data-table--sticky-header` `sk-data-table__cell--numeric` `sk-data-table__scroller` |
| `disclosure` | `components/disclosure.html` | `closed`, `long-body`, `nested`, `open` | `sk-disclosure` `sk-disclosure__body` `sk-disclosure__summary` |
| `empty-state` | `components/empty-state.html` | `inline`, `with-action`, `without-action` | `sk-empty-state` `sk-empty-state--inline` `sk-empty-state__action` `sk-empty-state__body` `sk-empty-state__heading` |
| `event-timeline` | `components/event-timeline.html` | `compact-default`, `compact-degraded`, `compact-forced-colors`, `compact-leading-marker`, `compact-linked`, `compact-long-content`, `compact-narrow`, `compact-one-event`, `compact-twenty-events`, `forced-colors`, `long-transition`, `narrow`, `one-event`, `twenty-events`, `two-events`, `unavailable-retention`, `verified-marker` | `sk-empty-state` `sk-empty-state__body` `sk-empty-state__heading` `sk-event-timeline` `sk-event-timeline--compact` `sk-event-timeline--narrow` `sk-event-timeline__content` `sk-event-timeline__item` `sk-event-timeline__leading-marker` `sk-event-timeline__marker` `sk-event-timeline__metadata` `sk-event-timeline__summary` |
| `facts` | `components/facts.html` | `compact`, `empty-value`, `long-value`, `two-col`, `default` | `sk-facts` `sk-facts--compact` `sk-facts--two-col` `sk-facts__term` `sk-facts__value` |
| `feature-card` | `components/feature-card.html` | `default` | `sk-feature-card` `sk-feature-card--border-green` `sk-feature-card--border-purple` `sk-feature-card--border-yellow` `sk-feature-card__body` `sk-feature-card__icon-chip` `sk-feature-card__icon-chip--green` `sk-feature-card__icon-chip--purple` `sk-feature-card__icon-chip--yellow` `sk-feature-card__title` |
| `form-field` | `components/form-field.html` | `default`, `form-input-default`, `form-input-disabled`, `form-input-error`, `form-input-filled`, `form-input-focus`, `form-textarea-default`, `form-textarea-error` | `is-focused` `sk-form-field` `sk-form-field--error` `sk-form-field__description` `sk-form-field__label` `sk-input` `sk-textarea` |
| `form-select` | `components/form-select.html` | `compact`, `disabled`, `long-options`, `optgroups`, `required-invalid`, `t10-lane`, `t12-filters` | `sk-form-field` `sk-form-field--error` `sk-form-field__description` `sk-form-field__label` `sk-form-select` `sk-form-select--compact` |
| `grid` | `components/grid.html` | `default` | `sk-grid` `sk-grid--cols-2` `sk-grid--cols-3` `sk-grid--cols-4` `sk-grid--gap-3` `sk-grid--gap-4` `sk-grid--gap-6` |
| `nav-pill` | `components/nav-pill.html` | `default` | `sk-nav-pill` `sk-nav-pill__cta` `sk-nav-pill__cta-btn` `sk-nav-pill__item` `sk-nav-pill__item--active` `sk-nav-pill__items` |
| `pill-tag` | `components/pill-tag.html` | `default` | `sk-pill-tag` `sk-pill-tag--breaking` `sk-pill-tag--eyebrow` `sk-pill-tag--green` `sk-pill-tag--purple` `sk-pill-tag--status-attention` `sk-pill-tag--status-danger` `sk-pill-tag--status-info` `sk-pill-tag--status-neutral` `sk-pill-tag--status-recovery` `sk-pill-tag--status-success` `sk-pill-tag--yellow` |
| `progress` | `components/progress.html` | `compact`, `complete`, `forced-colors`, `indeterminate-compact`, `indeterminate-forced-colors`, `indeterminate-long-label`, `indeterminate-narrow`, `indeterminate-with-meta`, `indeterminate`, `large-total`, `long-label`, `narrow`, `t10`, `zero` | `sk-progress` `sk-progress--compact` `sk-progress--indeterminate` `sk-progress--narrow` `sk-progress__bar` `sk-progress__label` `sk-progress__meta` |
| `prose` | `components/prose.html` | `absent-prompt`, `long-code`, `narrow`, `prompt`, `wide-table` | `sk-data-table` `sk-data-table__scroller` `sk-empty-state` `sk-empty-state__body` `sk-empty-state__heading` `sk-prose` |
| `public-header` | `components/public-header.html` | `brand-only`, `current-action`, `long-labels`, `many-actions`, `mixed-controls`, `one-action`, `theme-slot`, `two-actions` | `sk-button` `sk-button--ghost` `sk-button--secondary` `sk-button--sm` `sk-public-header` `sk-public-header__action` `sk-public-header__actions` `sk-public-header__brand` `sk-public-header__brand-context` `sk-public-header__inner` |
| `radio-choice-group` | `components/radio-choice-group.html` | `default`, `disabled-group`, `disabled`, `long`, `none`, `one`, `required-invalid`, `two` | `sk-radio-choice-group` `sk-radio-choice-group__choice` `sk-radio-choice-group__control` `sk-radio-choice-group__label` `sk-radio-choice-group__legend` `sk-radio-choice-group__options` `sk-radio-choice-group__secondary-value` |
| `ribbon-card` | `components/ribbon-card.html` | `default` | `sk-ribbon-card` `sk-ribbon-card--border-blue` `sk-ribbon-card--border-green` `sk-ribbon-card--border-purple` `sk-ribbon-card--border-red` `sk-ribbon-card--border-yellow` `sk-ribbon-card--has-ribbon` `sk-ribbon-card__content` `sk-ribbon-card__ribbon` `sk-ribbon-card__ribbon--blue` `sk-ribbon-card__ribbon--green` `sk-ribbon-card__ribbon--purple` `sk-ribbon-card__ribbon--red` `sk-ribbon-card__ribbon--yellow` |
| `section-banner` | `components/section-banner.html` | `default` | `sk-section-banner` `sk-section-banner--green` `sk-section-banner--neutral` `sk-section-banner--purple` `sk-section-banner__dot` `sk-section-banner__label` |
| `section-nav` | `components/section-nav.html` | `default`, `long-labels`, `many-routes`, `no-current`, `one-route`, `two-route` | `sk-section-nav` `sk-section-nav__link` |
| `segmented-choice` | `components/segmented-choice.html` | `all-disabled`, `default`, `five-items`, `long-labels`, `no-selection`, `one-disabled`, `second-selected`, `third-selected`, `two-items` | `sk-segmented-choice` `sk-segmented-choice__item` |
| `site-footer` | `components/site-footer.html` | `default` | `sk-site-footer` `sk-site-footer__brand` `sk-site-footer__column` `sk-site-footer__divider` `sk-site-footer__grid` `sk-site-footer__heading` `sk-site-footer__legal` `sk-site-footer__link` `sk-site-footer__link--compact` `sk-site-footer__links` `sk-site-footer__meta` `sk-site-footer__row` `sk-site-footer__tagline` `sk-site-footer__wordmark` |
| `skip-link` | `components/skip-link.html` | `unfocused` | `sk-skip-link` |
| `stub` | `components/stub.html` | `default` | `sk-stub` `sk-stub__label` |
| `workflow-board` | `components/workflow-board.html` | `all-empty`, `fifty-items`, `fitting`, `long-labels-and-items`, `one-empty-lane`, `populated`, `single-lane-narrow` | `sk-empty-state` `sk-empty-state__body` `sk-empty-state__heading` `sk-workflow-board` `sk-workflow-board__scroller` `sk-workflow-lane` `sk-workflow-lane__count` `sk-workflow-lane__header` `sk-workflow-lane__list` `sk-workflow-lane__title` |
| `workflow-lane` | `components/workflow-lane.html` | `default`, `empty` | `sk-empty-state` `sk-empty-state__body` `sk-empty-state__heading` `sk-workflow-lane` `sk-workflow-lane__count` `sk-workflow-lane__header` `sk-workflow-lane__list` `sk-workflow-lane__title` |

## Elements whose static form lives in another component

- `sk-form-input` — use the `form-field` forms whose variant starts with `form-input`.
- `sk-form-textarea` — use the `form-field` forms whose variant starts with `form-textarea`.

## Components OpenDesign cannot emit

**16** custom elements have **no static form** today, so they are not in the fixture and
must not be approximated with invented markup. They exist in the library as shadow-DOM elements only:

`sk-app-shell`, `sk-bar-chart`, `sk-confirm-dialog`, `sk-context-sidebar`, `sk-copy-field`, `sk-entity-marker`, `sk-evidence-chain`, `sk-metric`, `sk-notice`, `sk-page-header`, `sk-personal-rail`, `sk-section-header`, `sk-status-indicator`, `sk-theme-toggle`, `sk-time-series-chart`, `sk-transition-matrix`.

## Forms left out of the fixture

**2** of the library's static forms compose a custom element, so they cannot render
without JavaScript. They are left out of `components.html` and the component pages; every other
form of the same component is in. Left out:

- `boundary-page` / `forced-colors` — it composes custom-element tags: sk-entity-marker
- `boundary-page` / `form-card` — it composes custom-element tags: sk-entity-marker

## Static-form fidelity caveat

These 10 components ship `:host` or `::slotted` rules in their CSS. The rules are inert in
static markup, so a behaviour the element gets from its host — for example a container-query
reflow — may not apply to the static form. Whether such constructs get a static equivalent is ADR-15,
which is still Proposed:

`blog-card`, `button`, `check-bullet`, `feature-card`, `grid`, `nav-pill`, `pill-tag`, `ribbon-card`, `section-banner`, `site-footer`.

Where the library already ships the static equivalent — `static/sk-<name>.static.css`, the same rules
with `:host` moved onto a wrapper class — the component page carries that sheet instead, and its
static form uses the wrapper: `action-row`.

<!-- END GENERATED: components -->
