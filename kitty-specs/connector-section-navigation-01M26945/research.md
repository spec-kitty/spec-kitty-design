# Research: Connector section navigation

## Decisions

### R-001 — Publish a styles-only native contract, generalized from Family 3's repeated CSS

**Decision**: Publish `.sk-section-nav` classes for a consumer-authored `<nav>` and its native `<a>`
children only. Do not add a custom element, tab roles, or JavaScript behaviour.

**Rationale**: Issue #337 explicitly instructs "Do not register a custom element and do not use tab
roles," and Family 3's own product evidence (`C6`-`C9a`) shows the exact gap: four screens each
hand-roll an identical local `.detail-tabs` CSS block for the same shape (sibling-route strip, one
current, native `<a>` with `aria-current="page"`). The `.sk-context-nav` precedent (#256/#264)
establishes the repository's own styles-only generated-exemplar pattern for exactly this kind of
consumer-authored native primitive.

### R-002 — Use `aria-current` as the only current-state hook

**Decision**: Select current-link presentation exclusively through
`[aria-current]:not([aria-current="false"])`; no `.is-current` class alias, no route inference, no
DOM-position heuristic.

**Rationale**: Matches `.sk-context-nav.css`'s own selector shape and the product evidence's
`.detail-tabs a[aria-current="page"]` rule; keeps URL matching and selection logic entirely outside
the design library, per FR-002/C-001.

### R-003 — Local horizontal overflow, never document-level

**Decision**: The strip is its own `overflow-x` scroll container (`min-inline-size: 0`); links do
not shrink (`flex: none`) so the strip scrolls rather than the labels compressing.

**Rationale**: The product evidence's `.detail-tabs` rule already does this
(`overflow-x:auto; ... scrollbar-width:thin`), and FR-005/FR-006/NFR-005 require it explicitly,
including that a focused, off-screen-at-rest link scrolls into view without its focus ring being
clipped.

### R-004 — Non-colour-alone state distinction, forced-colors safe

**Decision**: Current-location and hover/active/focus-visible states each carry a `border`/`outline`
component in addition to any colour/background change, never a `background`-only or `box-shadow`
cue.

**Rationale**: `docs/contributing/adding-a-component.md`'s forced-colors section (#176's own
recipe) measured that `background`/`box-shadow` do not survive `forced-colors: active` while
`border`/`outline` recolor automatically; `.sk-context-nav.css`'s own `forced-colors` block follows
this exact shape (`border-inline-start-color: Highlight` for current, `outline-color: Highlight`
for focus).

### R-005 — Token-only target/state styling, 44px floor from `--sk-space-9`

**Decision**: Compose the 44px-equivalent interactive target from `--sk-space-9` (`3rem`/`48px`),
the token this repository already documents as "the closest token at or above the 44px NFR-001
floor" (`packages/styles/src/confirm-dialog/sk-confirm-dialog.css:171`), not an un-tokened `44px`
literal.

**Rationale**: ADR-9/10 (styling API, canonical markup) and stylelint's `declaration-strict-value`
gate make literal-free token consumption mandatory; FR-010 forbids an un-tokened literal explicitly.

### R-006 — Native anchors only; no listener the family owns

**Decision**: The family attaches no click handler and wraps no anchor in anything that could
intercept default activation. Modified-click, copy-link, open-in-new-tab, visited state, and
browser history remain exactly the browser's native anchor behaviour.

**Rationale**: Issue #337's own text lists these as a binding part of the public contract
("Links keep native open-in-new-tab, copy-link, modified-click, visited, and browser-history
behavior"), and this is a styles-only family with zero owned JavaScript by construction.

### R-007 — No distinct `:visited` treatment is required

**Decision**: `:link`/`:visited` both resolve to the same colour (`color: inherit`, matching
`.sk-context-nav__link`'s own pairing); visited state is not in FR-004's distinctness list.

**Rationale**: The issue's distinctness list is explicit — "rest / hover / active / focus-visible /
current-location" — and omits visited. Forcing a distinct visited style would be scope creep this
spec does not claim, and repository precedent (`.sk-context-nav__link:link, :visited { color:
inherit }`) already treats visited neutrally for sibling navigation.

### R-008 — One atomic Work Package

**Decision**: Implement the stylesheet, authored canonical HTML exemplars, generated TypeScript
barrel, stories, tests, story ratchet, and documentation as one WP and one PR.

**Rationale**: Issue #337 explicitly requires "one bounded Work Package and one PR." This is one
new styles-only public contract inside one package boundary; splitting generated publication,
accessibility evidence, or documentation would expose an incomplete or unverified contract, matching
`.sk-context-nav`'s own WP-topology disposition.

## Evidence summary

- Live GitHub #337 (part of epic #335) is the binding scope and acceptance source.
- Family 3's `C6`-`C9a` product evidence (`ux_redesign/families/03-connectors/screens/`) is the
  repeated-CSS gap this mission generalizes; its `DESIGN.md` confirms "Keep tabs native links and
  current-location semantics" as an explicit visual rule for the family, and warns that
  candidate-specific anatomy must not retain inert public class hooks when the real public
  stylesheet is not embedded — i.e. this mission's public contract, once it ships, is what those
  screens should adopt, not a copy of their local CSS.
- `.sk-context-nav` (#256/#264) and `.sk-breadcrumbs` are the closest prior art for a
  consumer-authored native `nav`/`a` styles-only family with a generated exemplar barrel;
  `sk-nav-pill` and `.sk-segmented-choice` are the explicit non-goals this mission's issue names.
- ADR-9 (styling API/label ownership), ADR-10 (distribution, canonical markup, and the
  styles-only-components-are-a-class ruling), and ADR-11 (verification stack, required behaviours)
  are the binding architecture; none requires an amendment for this mission.
- Current `train/elements-first@7032cf7792a83ee20d9fd70ddcfb28a057c72884` is the authoritative base;
  `docs/contributing/adding-a-component.md` and `docs/contributing/running-quality-checks.md` are
  the binding gate recipes.

## Risks and mitigations

- **Generated-file overlap with other Wave A missions**: rebase on the latest train immediately
  before review/PR delivery, regenerate from authored source, and rerun gates on the exact head.
- **A `background`-only or `box-shadow`-only current/focus cue silently fails forced-colors**: use
  `border`/`outline` for both, per R-004; verify with actual `forced-colors: active` emulation, not
  a visual read of the default theme.
- **Off-screen-at-rest focused link**: assert the scroll/bounding-rect geometry after Tab, not
  merely that `document.activeElement` changed — a focus event without a geometry assertion would
  pass even if the outline were clipped.
- **Styles-only generator drift**: run `scripts/build-styles-only-markup.mjs` and its `--check`
  rather than hand-editing the generated barrel.
- **No transition needed**: prefer no motion; only add a precise `prefers-reduced-motion: reduce`
  override if the authored family actually owns a transition (FR-012 is satisfied vacuously
  otherwise).
- **Accidentally documenting Connectors vocabulary**: every fixture, story, and doc example must use
  generic route names, per the programme BRIEF's instruction to strip Connectors/provider-specific
  words from the public contract.

## Open questions

None requiring product input. The exact fixture route-name strings, directory name
(`packages/styles/src/section-nav/`), and generated barrel wiring are implementation decisions to
confirm against the current source during the Work Package, following the `.sk-context-nav`
precedent exactly.
