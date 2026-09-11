# Mission Specification: Site Footer Compact Mode

**Mission Branch**: `mission/site-footer-compact-mode`
**Created**: 2026-09-10
**Status**: Draft
**Input**: GitHub issue [TKF2] `spec-kitty/spec-kitty-design#354`, part of epic #352 (Family 6, "Account and public front door")

## Summary

`sk-site-footer` ships today with exactly one presentation: a fixed three-column layout (`SITE_FOOTER_VARIANTS = {}`, `SITE_FOOTER_AXES = {}`) — a brand column plus two headed navigation columns, always both rendered, with a plain-text `legal` property. Family 6's 23 public/account screens (`ux_redesign/families/06-account-front-door`) repeat a different, much smaller `pagefoot` anatomy verbatim: one supplied brand/tagline block, one supplied legal/meta line, and a small native Terms-style link region — confirmed by direct inspection of `screens/P1-landing-desktop-dark.html`, `P2-signup-default-dark.html`, `P4-login-default-dark.html`, `P16-terms-published-dark.html` and `P20-email-management-dark.html` (P24 is authenticated application chrome and carries no public footer, consistent with the issue). No issue or PR currently owns this shape, and the plain-text `legal` property cannot carry the real Terms anchor those screens need.

This mission extends the existing `sk-site-footer` element with one additional, compact, server-renderable presentation. It does not create a second footer component, does not touch the existing three-column contract's behaviour, and does not choose the concrete property/modifier/slot shape — that is fixed by the PLAN phase under the repository's authoring rules (`docs/contributing/adding-a-component.md`) and ADR-15's static-form ruling. This spec fixes the **acceptance contract** the chosen shape must satisfy.

Every claim in issue #354 about the current component's state was verified directly against `packages/elements/src/site-footer/sk-site-footer.markup.ts` and `sk-site-footer.ts` at this checkout's `mission/site-footer-compact-mode` branch tip and holds exactly as stated: `SITE_FOOTER_VARIANTS = {}`, `SITE_FOOTER_AXES = {}`, two navigation columns always rendered, `legal` bound as an escaped text node inside a `<p>` (so it cannot carry a live `<a>`). No repository-vs-issue conflict was found during authoring of this spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compact footer with no JavaScript (Priority: P1)

A Team Kitty template (Django-rendered, e.g. the account/public front-door pages Family 6 designs) renders a compact footer server-side, with no client-side script, carrying the app's own brand/tagline, its own legal/meta line, and a native link to its own Terms page.

**Why this priority**: This is the shape the whole mission exists to unblock — 23 of Family 6's 24 reviewed screens repeat it, and ADR-10 §3 records that the majority of this library's named consumers (the docsite, marketing pages, slidedecks, and this exact Django UI) can only consume static markup, never a bundler-fed element.

**Independent Test**: Render the generated static HTML for the compact presentation with sample brand/tagline/legal/link content and no `<script>` on the page; confirm a real `<footer>`, real `<a>` elements, and no empty landmark appear, and that nothing requires JavaScript to be legible or navigable.

**Acceptance Scenarios**:

1. **Given** a static page with no script tags, **When** the compact static form is rendered with a brand/tagline block, a legal/meta line, and one Terms link, **Then** the footer, the brand text, the legal text, and a real, clickable `<a href="…">Terms</a>` are all present and correctly nested with no script execution.
2. **Given** the same static page, **When** the legal/meta line is omitted, **Then** any divider that exists solely to separate it from the content above is also omitted — not left drawn over nothing.

---

### User Story 2 - Compact footer as an interactive element (Priority: P1)

A consumer that does use the custom-element path (e.g. a bundler-fed app, or Storybook itself) mounts `<sk-site-footer>` in its compact presentation and gets the same structure and computed appearance the static form produces, so switching consumption path is not a visual or semantic surprise.

**Why this priority**: ADR-8's whole premise is one implementation serving every consumption path; a compact presentation that only works from one path breaks that premise for this component specifically, and would be indistinguishable from a second, forked footer.

**Independent Test**: Mount the element form of the compact presentation with the same sample content used in User Story 1's static test, at the same viewport and theme, and diff the two: semantic structure (landmark/list nesting, whether an empty `<nav>` appears) and computed layout geometry must match.

**Acceptance Scenarios**:

1. **Given** the element form of the compact presentation mounted with a brand/tagline block, a legal/meta line, and two links, **When** its shadow tree is inspected, **Then** it contains the same landmark/list nesting as the static form rendered with equivalent content, and no empty `<nav>` or empty `<ul>` exists in either.
2. **Given** both forms rendered at the same viewport and theme, **When** their computed layout geometry is compared, **Then** the values match within the same rendering engine (per ADR-15's own "compare within one engine" discipline, not against a value transcribed from any document).

---

### User Story 3 - Zero, one, or several links, with no orphaned landmark (Priority: P1)

A consumer that has no Terms page yet, or that has several small links (Terms, Privacy, Status), supplies exactly that many links — including zero — and the compact footer never renders scaffolding (an empty `<nav>`, an empty heading, an empty list) for links that do not exist.

**Why this priority**: This is the specific defect the issue names and the acceptance contract this mission is required to fix: the current `legal` property is plain, escaped text and cannot carry a live anchor at all, so today a consumer genuinely cannot add a truthful Terms link to a compact-shaped footer without either a second, hand-rolled footer or unsafe markup injection.

**Independent Test**: Render the compact presentation three times — zero links, one link, several links — with an automated accessibility-tree check each time that there is no landmark or heading with zero accessible children.

**Acceptance Scenarios**:

1. **Given** zero links supplied, **When** the compact presentation renders, **Then** no empty navigation landmark, no empty heading, and no empty list exists anywhere in its output.
2. **Given** one link supplied, **When** the compact presentation renders, **Then** exactly one real, native `<a>` with the consumer's own label and `href` is present, targetable and keyboard-reachable.
3. **Given** several links supplied, **When** the compact presentation renders, **Then** every supplied link renders as its own real `<a>`, in the consumer's supplied order, with no library-authored label or destination among them.

---

### User Story 4 - Existing full footer is untouched (Priority: P1)

A consumer already using the existing three-column `sk-site-footer` (brand column, two headed nav columns, legal line) upgrades to the version of the library this mission ships and sees zero behavioural, markup, or visual change.

**Why this priority**: The issue is explicit that this is backward-compatible extension, not a redesign, and the charter's visual-regression gate exists precisely to catch an unintended pixel drift on a component nobody meant to touch.

**Independent Test**: Diff the full-footer stories' generated HTML, `custom-elements.json` entry, and CI visual-regression baseline before and after the mission's change; all three must be byte/pixel-identical for the existing (non-compact) presentation.

**Acceptance Scenarios**:

1. **Given** the full three-column presentation with its existing `Default`/`WithoutLegal`/`LightMode` stories, **When** this mission's change is applied, **Then** each story's generated static HTML is byte-identical to its pre-mission output.
2. **Given** the same stories, **When** CI's visual-regression job runs, **Then** it reports zero diff against the existing baselines.

---

### User Story 5 - Long, localized content and RTL (Priority: P2)

A non-English consumer supplies a long localized brand name, a long tagline, a long legal line, and link labels of varying length, in a right-to-left locale, and the compact footer remains legible: no root horizontal overflow, no clipped text, no broken reading order.

**Why this priority**: The library ships no English defaults and no i18n of its own (#286); every string is consumer-supplied, so the compact presentation's layout must hold for arbitrary supplied length and direction or it fails its very first non-demo consumer.

**Independent Test**: Render the compact presentation with maximum-length sample strings in an LTR document and again with `dir="rtl"`, at a 390px viewport and at 200% zoom emulation, and assert no root scroll-width overflow in any of the four combinations.

**Acceptance Scenarios**:

1. **Given** a long brand name, a long tagline, a long legal line, and long link labels, **When** rendered at 390px, **Then** every field wraps within its own box and `document.documentElement.scrollWidth` does not exceed `document.documentElement.clientWidth`.
2. **Given** the same content, **When** rendered inside a `dir="rtl"` ancestor, **Then** the logical stacking order, text alignment, and link affordance mirror correctly with no fixed left/right geometry contradicting the reading direction.

---

### User Story 6 - Narrow viewport, forced colors, and keyboard use (Priority: P2)

A consumer's page is viewed at a narrow (390px) viewport, under a forced-colors mode, or navigated by keyboard only, and the compact footer degrades correctly in each case: content stacks logically, the footer's boundary and link affordance remain visible under forced colors, and every link is reachable and clearly focused by keyboard.

**Why this priority**: These are the shared Family 6 acceptance constraints (epic #352 §"Shared acceptance constraints" 3–4) applied to this specific component, and they are independently testable per-axis failure modes this library has hit before (`docs/contributing/adding-a-component.md`'s forced-colors section documents three real, previously-shipped mistakes).

**Independent Test**: A Playwright pass per axis — narrow-viewport overflow, forced-colors visibility (idiom: `sk-copy-field-forced-colors.spec.ts`), and keyboard focus order/visibility — against the compact presentation's required stories.

**Acceptance Scenarios**:

1. **Given** the compact presentation at 390px, **When** the desktop-aligned layout is below its responsive threshold, **Then** the brand/tagline block, the legal/meta line, and the link region stack in a single logical column in unchanged DOM/focus order.
2. **Given** `forced-colors: active`, **When** the compact presentation renders, **Then** the footer's top boundary remains visible and every link's underline/recolor affordance and focus outline remain visible and unclipped.
3. **Given** keyboard-only navigation, **When** Tab is pressed repeatedly through the compact presentation, **Then** focus visits every supplied link in DOM order with a visible, unclipped indicator.

---

### Edge Cases

- Zero links supplied: no empty `<nav>`, heading, or `<ul>` is rendered (User Story 3).
- Legal/meta line omitted entirely: any adjoining divider is also omitted, matching the existing full-footer discipline for its own `legal` property (`sk-site-footer.ts`'s `legal ? html\`<hr>\` : nothing`).
- Legal/meta line supplied as whitespace only: treated as absent, matching the existing behaviour test `the divider is drawn only when there is a legal line to divide`.
- A consumer supplies a link with no visible label text (icon-only or empty string): out of this mission's authority to prevent — the library does not author link labels (FR-010) — but the compact presentation must not itself introduce any structure that would make such a link inaccessible beyond what a bare native `<a>` already is.
- Maximum-length localized brand, tagline, legal, and link-label strings simultaneously: no root horizontal overflow at 390px or at 200% zoom (User Story 5).
- `dir="rtl"` ancestor: logical stacking and alignment mirror correctly (User Story 5).
- A consumer supplies a "current or future year" string as part of the legal/meta text (epic #352's shared constraint names this explicitly): the library renders it verbatim as consumer-supplied text; it performs no date arithmetic, validation, or transformation on it.
- A consumer mixes the compact presentation's content with the full three-column presentation's properties on the same element instance in an unsupported way: PLAN's chosen shape must make this either structurally impossible (mutually exclusive properties/slots) or must define the resulting behaviour explicitly — this spec does not choose which, but requires the chosen shape to answer it rather than leave it undefined.
- The compact presentation is embedded inside a page that already establishes its own CSS containment or its own `@container` ancestor (the "composed" case ADR-15's measurement calls out as the one that most sharply distinguishes a correct static rewrite from one that merely looks correct): if PLAN's chosen responsiveness mechanism is container-query-based, this case must be in its equivalence evidence (see Constraint C-010 and the Cross-mission section).
- A screen reader or accessibility-tree snapshot of the compact presentation with a single link: the link's accessible name matches its visible text exactly, and no other node claims a landmark role with no content.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | One extended component, not a second footer | As a design-system maintainer, I want `sk-site-footer` to remain the sole semantic owner of footer markup in this library so that no consumer has two footers to choose between or reconcile. | High | Open |
| FR-002 | Compact brand/tagline block | As a Team Kitty template author, I want to supply one brand/tagline block to the compact presentation so that the footer identifies the product the way Family 6's screens already do. | High | Open |
| FR-003 | Compact optional legal/meta line | As a Team Kitty template author, I want to supply one optional legal/meta line of plain text so that product-state and copyright information appear when I have them and are cleanly absent when I don't. | High | Open |
| FR-004 | Native link region, zero/one/several — the acceptance contract | As a Team Kitty template author, I want to supply zero, one, or several real, native `<a>` links — with my own label, destination, and count — into the compact presentation, without embedding markup inside a text-only property, so that a real Terms (or similar) link can exist truthfully. | High | Open |
| FR-005 | No empty landmark, heading, or list | As an assistive-technology user, I want the compact presentation to render no empty navigation landmark, empty heading, or empty list when zero links are supplied, so that the footer's accessibility tree contains no dead ends. | High | Open |
| FR-006 | Real `<footer>` and native anchors in both presentations | As a consumer relying on native semantics, I want both the compact and the full presentations to render a genuine `<footer>` element and genuine `<a>` anchors — never an ARIA-role substitute — so that browser and assistive-technology behaviour is native, not simulated. | High | Open |
| FR-007 | Element/static semantic and presentational equivalence | As a consumer who may choose either consumption path, I want the compact presentation's custom-element form and its generated static form to expose the same semantic structure and the same computed presentation so that neither path is a second, silently-diverging implementation. | High | Open |
| FR-008 | No-JavaScript static rendering | As a no-build consumer (the Django UI, the docsite, marketing pages), I want the compact presentation's generated static HTML to be complete and legible with no script execution required, so that I can render it without adopting a build step. | High | Open |
| FR-009 | Full three-column presentation stays backward compatible | As an existing consumer of `sk-site-footer`, I want its current three-column element behaviour, stories, generated HTML, and visual baselines to remain unchanged, so that adopting this mission's release is a pure addition, not a migration. | High | Open |
| FR-010 | Consumer owns all compact content | As a design-system maintainer, I want brand text, tagline text, legal/meta text, any copyright symbol or year, every link's label and destination, the link inventory, and localization to remain entirely consumer-supplied, so that the library never ships a wrong or untranslated default into a consumer's footer. | High | Open |
| FR-011 | Long, localized content wraps without overflow | As a non-English consumer, I want arbitrarily long brand, tagline, legal, and link-label text to wrap within its own box, so that my localized content never breaks the page's layout. | Medium | Open |
| FR-012 | Logical narrow stacking with preserved focus order | As a narrow-viewport or zoomed-in user, I want the compact presentation's fields to collapse into a single logical column below its responsive threshold, in unchanged source/focus order, so that the footer remains usable without visual reordering that would desynchronize from keyboard navigation. | Medium | Open |
| FR-013 | RTL correctness | As a right-to-left locale user, I want the compact presentation's stacking, alignment, and link affordance to mirror correctly, so that the footer reads naturally in my language's direction. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No root overflow at narrow viewport and zoom | For the longest-content required compact story, `document.documentElement.scrollWidth` ≤ `document.documentElement.clientWidth` at a 390px viewport and under 200% zoom emulation. | Reliability | High | Open |
| NFR-002 | 44px interactive target floor | Every native link rendered by the compact presentation has a computed interactive box of at least 44 CSS px in both dimensions at a 390px viewport. | Accessibility | High | Open |
| NFR-003 | Forced-colors boundary and affordance survive | Under `forced-colors: active`, the footer's existing top boundary (`border-top`) remains visible with zero authored CSS beyond what already exists, and every link's focus outline is unclipped by any ancestor's `overflow` or fixed size. | Accessibility | High | Open |
| NFR-004 | Zero axe violations | Every required compact story (Family 6 one-link shape; zero/one/several links; long content; no legal line; narrow stack; RTL; default dark; required light-theme) reports zero WCAG 2.1 AA violations from axe-core, where a story that fails to load counts as a violation, not a pass. | Accessibility | High | Open |
| NFR-005 | Contrast in both themes | Every ink the compact presentation's stylesheet sets meets at least 4.5:1 contrast against its computed background in both the default (dark) theme and the `class="sk-light"` theme. | Accessibility | High | Open |
| NFR-006 | Keyboard reachability | Every native link in the compact presentation is reachable via sequential Tab navigation and activatable via Enter, in DOM order, with a visible focus indicator at every step. | Accessibility | High | Open |
| NFR-007 | Element/static parity within one engine | For every required compact scenario, the element form's and the generated static form's computed layout geometry (widths, stack order, visible/hidden state of the link region) match when compared within the same rendering engine and viewport — never against a value transcribed from a document (ADR-15's own measurement discipline). | Reliability | High | Open |
| NFR-008 | Full-presentation visual baseline is unchanged | The existing full three-column presentation's CI visual-regression baseline (the `visual-regression-diffs` artifact) reports zero diff after this mission's change. | Reliability | High | Open |
| NFR-009 | Generation determinism | Regenerating `sk-site-footer.html`, `packages/styles/src/site-footer/index.ts`, `custom-elements.json`, `packages/react/src/site-footer/**`, and `packages/elements/vue.d.ts` from the committed authored source (`sk-site-footer.markup.ts`, `sk-site-footer.ts`) is byte-identical to what is committed — i.e. every generator's `--check` mode passes with zero diff. | Reliability | High | Open |
| NFR-010 | SIZES.md reflects a real build | `packages/elements/SIZES.md`'s `sk-site-footer` entry, after `npx nx run-many --target=build --projects=tokens,styles,elements` followed by `node scripts/measure-elements-sizes.mjs`, matches what `--check` reports with zero diff — i.e. the committed figure was measured against a fresh build of `dist/`, not a stale one. | Reliability | Medium | Open |
| NFR-011 | Responsive threshold is declared and live | If the chosen shape introduces a documented viewport or inline-size threshold governing the compact→stacked transition, the shipped stylesheet declares that threshold at its documented figure, and the transition is asserted to occur live at that figure within the test lane's reachable viewport range (ADR-11 required-behaviour item 11's shape). | Reliability | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Tokens only | Every CSS value this mission adds to `sk-site-footer.css` references a `--sk-*` token defined in `packages/tokens/src/tokens.css`; no raw hex, `rgba()`, px, radius, shadow, motion, or z-index literal. | Technical | High | Open |
| C-002 | BEM naming | Any new class introduced follows `sk-site-footer__element--modifier`; no new block prefix. | Technical | High | Open |
| C-003 | No theme selector in component CSS | Light-mode variance is expressed only through tokens; no `:root[data-theme="light"] …` or `.sk-light …` selector is written inside `sk-site-footer.css`, per ADR-9 §3 — such a selector is inert once the sheet is adopted into the element's shadow root. | Technical | High | Open |
| C-004 | `class="sk-light"` for LightMode | Every required LightMode story (both the compact presentation's and any pre-existing one this mission touches) wraps with `class="sk-light"`, never `data-theme="light"`, which activates nothing on a wrapper (#93). | Technical | High | Open |
| C-005 | Consumer-owned, translatable strings | Every user-visible string the compact presentation renders remains consumer-supplied (property, attribute, or slotted content) and translatable per #286; the library ships no English default for brand, tagline, legal, or link text, and `render()` introduces no new hardcoded user-visible literal. | Business | High | Open |
| C-006 | No clock-derived or pinned year | No property default, generated placeholder, or render-time computation in the compact presentation derives a year or date from the system clock or embeds a hand-pinned one — the #77 ruling's "no clock" discipline applies unchanged. | Technical | High | Open |
| C-007 | Generated artifacts are generator-owned | `sk-site-footer.html`, `packages/styles/src/site-footer/index.ts`, `custom-elements.json`'s `sk-site-footer` declaration, `packages/react/src/site-footer/**`, `packages/elements/vue.d.ts`, and `packages/elements/SIZES.md` are produced only by `scripts/build-element-markup.mjs`, `npx nx run elements:analyze`, `scripts/build-react-wrappers.mjs`, `scripts/build-vue-types.mjs`, and `scripts/measure-elements-sizes.mjs` respectively, and are never hand-edited; `measure-elements-sizes.mjs` is run only after `npx nx run-many --target=build --projects=tokens,styles,elements` — it reads `dist/` and does not build it. | Technical | High | Open |
| C-008 | Authored source stays a leaf-safe module | The compact presentation's authored markup lives in `sk-site-footer.markup.ts`, evaluated in a bare Node process by the generator; it may import only a leaf module (no imports of its own), never anything browser-dependent. | Technical | High | Open |
| C-009 | Published API is documented at the point of authorship | Any new public reactive property or method the compact presentation adds carries a `/** */` doc comment written for a consumer (not maintainer rationale, which stays in `//`); any new `::part()` is declared with `@csspart`, terminated before any further prose. | Technical | Medium | Open |
| C-010 | Container-query axis is a recorded dependency, not a silent choice | If PLAN's chosen responsiveness mechanism for the compact presentation is a host-attribute variant axis nested inside a host-owned `@container`/`container-type` (ADR-15 kinds 1–2), that pulls in ADR-15's generated-static-form-and-equality-gate machinery (#309, #310), which is not yet built and is not authorized to start ahead of ADR-15's adoption (itself gated on Lynn's still-pending Family 4 product verdict, #301). PLAN must record this as an explicit dependency rather than hand-authoring an unguarded static/shadow divergence. A plain `@media` breakpoint or a host-attribute axis with no host-owned container (matching the existing sheet's own idiom, and explicitly cleared by ADR-15 as "collapses onto the root class perfectly safely") avoids the dependency. | Technical | High | Open |
| C-011 | Squad tier C, pre-merge only | Per the issue's declared tier, the mandatory adversarial squad point-cut is pre-merge; no earlier point-cut is required by charter tiering (though the mission may still elect one). | Process | Medium | Open |
| C-012 | One Work Package, one PR, correct branch topology | Delivery is exactly one bounded Work Package and one PR from `mission/site-footer-compact-mode` (cut from the latest `train/elements-first`) back into `train/elements-first`; the PR body uses `Refs`, not `Closes`, for both #354 and #352. | Process | High | Open |
| C-013 | Model routing | Delegated implementation seats use the smaller model; the larger model is reserved for squad lenses/synthesis, arbiter escalation, and plan-phase architecture on risky forks, per the charter's standing order and the elements-first run prompt's "route down" rule. | Process | Low | Open |

### Key Entities

- **Compact Brand/Tagline Block** — one consumer-supplied name/wordmark plus one descriptive line, rendered as real text nodes the library never originates. Mirrors Family 6's `.footer-name` + meta-paragraph pair (`screens/P1-landing-desktop-dark.html:858`).
- **Compact Legal/Meta Line** — one optional consumer-supplied plain-text line (e.g. product state and copyright). Its presence or absence controls an adjoining divider, matching the discipline the existing `legal` property already enforces (`sk-site-footer.ts`'s `legal ? html\`<hr>\` : nothing`).
- **Compact Link Region** — zero, one, or several consumer-supplied native `<a>` elements, each with a consumer-owned label and destination; rendered with no landmark scaffolding when empty. This is the entity the acceptance-contract fix (FR-004) is about.
- **Full Three-Column Contract** (existing, frozen by this mission) — the brand-column-plus-two-headed-nav-columns layout already shipped under the #77 ruling. This mission proves non-regression against it; it does not modify it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `node scripts/check-manifest-content.mjs` passes with `expected-docs.json`'s `sk-site-footer` row updated to the exact new public attribute/method count the compact presentation adds (0 if none are added) — mechanism: `expected-docs.json` + `check-manifest-content.mjs`'s exact-equality check.
- **SC-002**: `node scripts/check-part-ratchet.mjs` passes with `expected-parts.json`'s `sk-site-footer` entry and its `total` correctly reflecting whatever `::part()`s the compact presentation declares, each backed by a same-PR `[SC-013]`-style case in `fixtures/elements-behaviour/src/sk-site-footer.test.ts` — mechanism: `expected-parts.json` + `check-part-ratchet.mjs` (shrink-only, exact `total`).
- **SC-003**: `npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js` passes with every new compact story id present in both the Storybook build output and `expected-stories.json` — mechanism: `expected-stories.json` (shrink-only) + `run-axe-storybook.js`'s named-story-set check.
- **SC-004**: After running the full regeneration sequence (`node scripts/build-elements-css.mjs && node scripts/build-element-markup.mjs && npx nx run elements:analyze && node scripts/build-react-wrappers.mjs && node scripts/build-vue-types.mjs`), `git status --porcelain` reports no diff in `packages/styles/src/site-footer/sk-site-footer.html`, `packages/styles/src/site-footer/index.ts`, `packages/elements/custom-elements.json`, `packages/react/src/site-footer/**`, or `packages/elements/vue.d.ts` — mechanism: each generator's own `--check` mode, per `docs/contributing/adding-a-component.md` §7 block 1/3.
- **SC-005**: `npx nx run-many --target=build --projects=tokens,styles,elements && node scripts/measure-elements-sizes.mjs --check` passes with zero diff — mechanism: `packages/elements/SIZES.md` + `measure-elements-sizes.mjs --check`.
- **SC-006**: `npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js` reports zero WCAG 2.1 AA violations across every required compact story (Family 6 one-link shape; zero/one/several links; long brand/tagline/legal/link-label text; supplied current/future year strings; no legal line; narrow stack; RTL; default dark; required light-theme) — mechanism: the charter's Quality Gate 2, enforced by axe-core via `run-axe-storybook.js`.
- **SC-007**: A Playwright spec (new file, e.g. `apps/storybook/src/tests/sk-site-footer-compact.spec.ts`) asserts, for the longest-content compact story, `document.documentElement.scrollWidth <= document.documentElement.clientWidth` at a 390px viewport and under 200% zoom emulation — mechanism: the idiom already used in `apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts`.
- **SC-008**: The same or a companion Playwright spec asserts every native link in the compact presentation has a computed interactive box ≥44 CSS px in both dimensions at 390px — mechanism: `getBoundingClientRect()` assertions against the target-size idiom already used elsewhere in `apps/storybook/src/tests/`.
- **SC-009**: A `forced-colors: active` Playwright spec asserts the footer's top boundary remains visible and every link's focus outline is unclipped — mechanism: the idiom of `apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts` and `sk-notice-forced-colors.spec.ts`, applied to the new compact story.
- **SC-010**: `npm run quality:all` (ESLint, Stylelint, HTMLHint) passes with zero non-token values reported in `sk-site-footer.css` — mechanism: `stylelint-declaration-strict-value` against `packages/tokens/dist/token-catalogue.json`.
- **SC-011**: `fixtures/elements-behaviour/src/sk-site-footer.test.ts`'s existing `[SC-013]` (every declared part targetable), `[SC-014]` (adopts the generated sheet by identity), and "the generated form does not read the clock" tests continue to pass (extended in place to cover any new parts, never removed) — mechanism: Vitest browser-mode run via `npm run test` / `node scripts/suite-selftest.mjs`.
- **SC-012**: The existing full-presentation stories (`Default`, `WithoutLegal`, `LightMode` in `packages/elements/src/site-footer/sk-site-footer.stories.ts` and `Default`, `LightMode` in `packages/styles/src/site-footer/sk-site-footer.stories.ts`) remain present under their existing story ids, and CI's `visual-regression-diffs` artifact reports zero diff for them — mechanism: `docs/contributing/adding-a-component.md` §8's CI-authoritative visual-baseline rule.
- **SC-013**: A new test (Vitest browser-mode or Playwright) mounts both the element form and the generated static form of the compact presentation with identical sample content at the same viewport and theme, and asserts equal semantic structure (landmark/list nesting, absence of empty `<nav>`) and equal computed layout geometry within one engine — mechanism: a named new test file, added under `fixtures/elements-behaviour/src/` or `apps/storybook/src/tests/` per which lane the assertion needs.
- **SC-014**: `node scripts/check-gate-wiring.mjs` reports no gate touched by this mission left unwired — mechanism: `check-gate-wiring.mjs`'s own registry check.

## Ratchet obligations this mission must resolve in PLAN

The exact shape PLAN chooses determines which of these fire; this table states the trigger condition and the enforcing gate for each so PLAN does not discover it late.

| Ratchet file | Obliged when… | Gate |
|---|---|---|
| `expected-docs.json` | The compact presentation adds, removes, or renames any public attribute or method (near-certain: some new host-visible knob is needed to select or shape the compact presentation). Update the row's attribute/method counts and `total` exactly. | `scripts/check-manifest-content.mjs` (exact equality) |
| `expected-parts.json` | The compact presentation declares any new or renamed `::part()`. Bump `total` and add a same-PR test. | `scripts/check-part-ratchet.mjs` (shrink-only; exact `total`) |
| `behaviours.json` | Not obliged to add a new subject — `sk-site-footer` is already declared for SC-013 and SC-014 (`behaviours.json:564,677`). No new subject entry is created by this mission. | `floor-reporter.mjs` arm 5 (subject-declaration floor) |
| `mutations.json` | Obliged only if new `::part()`s are added: each declared part needs a matching mutation arm, following the existing `sk-site-footer` pattern (`mutations.json:641-659`). | `scripts/suite-selftest.mjs` guards 7 and 9 |
| `expected-stories.json` | Obliged: every new compact story id must be added (shrink-only; adding is free, omitting is not). | `scripts/run-axe-storybook.js`'s named-story-set check |
| `expected-inert-theme-wrappers.json` | Not obliged — `sk-site-footer` already uses `class="sk-light"` correctly (`expected-inert-theme-wrappers.json:30`); this mission fixes no inert wrapper. | `scripts/check-story-theme-wrapper.mjs` (shrink-only) |

## Cross-mission / dependency section

- **#352** (parent epic, Family 6 "Account and public front door") — this mission is TKF2, one of three children (#353, #354, #355). The epic stays open until all three close; this mission's PR uses `Refs #354` and `Refs #352`, never `Closes`, per the epic's own rule and CLAUDE.md §7.
- **#353** (TKF1, native public-header) — a disjoint public surface (`.sk-public-header` vs. `sk-site-footer`); both run in epic #352's Wave 1 in parallel, and both draw evidence from the same `ux_redesign/families/06-account-front-door` corpus, but neither depends on the other's implementation.
- **#354** (this mission) — self.
- **#355** (TKF3, "Account and public front door pattern stories") — a Wave 2 consumer of this mission. TKF3 may begin immutable fixture selection and red-first composition checks in parallel with this mission, but its final implementation and visual baselines wait for this mission's merged compact contract; whatever public API shape PLAN selects here becomes a contract TKF3 builds against, so PLAN should treat that shape as effectively frozen once this mission's PR merges to the train.
- **#301** (ADR-15's originating decision issue, closed) — the ruling this mission applies for its static-form obligations. ADR-15's own status is **Proposed**, and #301 records that adopting it into implementation is gated on Lynn's still-pending Family 4 product verdict. This mission is authorized to proceed under the epic's own throughput decision (Family 6 is "ready for Lynn, not Lynn-approved"; the operator authorized component/pattern missions to proceed before Lynn's verdict for the 2026-09-15 deadline) — but that authorization covers *this mission's own scope*, not a blanket adoption of ADR-15's still-Proposed generator work. See C-010.
- **#309** (generate the light-DOM static form for host-attribute axes and host-owned `container-type`, ADR-15 kinds 1–2) — **not started, and explicitly not authorized to start ahead of ADR-15's adoption.** This is a **candidate dependency**, not a current one: it is triggered only if PLAN's chosen compact-mode responsiveness mechanism is a host-attribute axis nested inside a host-owned `@container`/`container-type`. The existing `sk-site-footer.css` uses only a plain `@media (max-width: 640px)` breakpoint with no `container-type` anywhere in the sheet, so extending that same idiom (or adding a host-attribute axis with **no** host-owned container) incurs no dependency on #309 at all — ADR-15 explicitly clears that shape as "collapses onto the root class perfectly safely." See C-010.
- **#310** (gate the generated static form equal to the shadow form, ADR-15 kinds 1–2) — same status and same conditional dependency as #309; it is #309's equality gate and cannot land ahead of or independently from it.
- **#161** (`@spec-kitty/styles`'s `package.json` `main`/`exports` point at a path the build never emits) — unrelated to this mission's scope: no consumer in this repository imports `@spec-kitty/styles` by package name (every internal consumer uses a relative path, per #161's own text), so it does not block or interact with this mission. Named here only because the issue lists it as required reading.
- **#77** (the operator's ruling that shaped the current `sk-site-footer`: element owns structure, content arrives as properties, only link *lists* are slotted as `<li>` inside the element-owned `<ul>`, no clock-derived year) — the compact presentation extends this ruling rather than overriding it; any new API surface PLAN designs should keep content-as-properties/lists-as-slots consistent with #77 unless a stated reason requires otherwise.
- **#286** (no user-visible literal in an element's `render()`) — the compact presentation must add no new hardcoded, user-visible English string to `render()`; `sk-site-footer`'s current `render()` already complies, and this mission must keep it that way (C-005).

## No unresolved architectural fork found beyond what the issue already delegates to PLAN

The concrete API shape for the compact presentation (which property/attribute/slot carries the brand/tagline block, the legal/meta line, and the link region; whether "compact" is a new `presentation` axis value or an inferred mode) is explicitly named by issue #354 itself as a PLAN-phase decision under the repository's authoring and static-form rules, not a spec decision — this spec fixes only the acceptance contract (FR-002 through FR-007, FR-010) that shape must satisfy. No other genuine architectural gap requiring an operator ruling was found during authoring; the one real risk identified (a container-query-based responsiveness mechanism pulling in #309/#310's unbuilt, unauthorized machinery) is recorded as a conditional dependency in C-010 and the Cross-mission section above, per the issue's own instruction to "record that as a dependency instead of hand-authoring an unguarded exception," rather than raised as a `[NEEDS DECISION]` item.
