# Research: Mission Kanban checkbox choice group

**Mission**: `mission-kanban-checkbox-choice-group-01M21K7F` | **Date**: 2026-09-09

## Decision 1 - The component is styles-only

**Decision**: Ship native light-DOM CSS and HTML exemplars only.

**Rationale**: Issue #277 explicitly forbids a custom checkbox element. ADR-10 also establishes
that styling whose value depends on native semantic relationships may remain styles-only. A shadow
boundary between `fieldset`/`legend`, `label`, and checkbox controls would weaken the direct native
contract and add no behavior the platform lacks.

**Alternatives considered**: A Lit wrapper or custom-drawn checkbox (rejected by contract); a
generic filter component (would steal application behavior).

## Decision 2 - Seven domain-neutral selectors

**Decision**: Use root, legend, options, choice, control, label, and metadata classes.

**Rationale**: The set maps one-to-one to stable native/presentational responsibilities and gives
long text/count layout a public hook without encoding lane names, counts, or selection logic.

**Alternatives considered**: Root plus descendant element selectors only (too brittle for optional
metadata layout); per-state modifier classes (would duplicate native pseudo-class truth).

## Decision 3 - Intrinsic responsive grid

**Decision**: Prefer an intrinsic `auto-fit`/bounded-minimum grid that becomes one column when its
container is narrow, instead of a new fixed application breakpoint.

**Rationale**: The issue requires one-column collapse but does not authorize a new shared
breakpoint. Intrinsic sizing handles containers as well as viewports and avoids copying the UX
workbench's raw pixel breakpoint.

**Alternatives considered**: A 520px media query copied from the mockup (rejected as workbench
detail); horizontal scrolling (contradicts the issue's local wrapping requirement).

## Decision 4 - Current tokens are sufficient

**Decision**: Reuse the existing input/card surfaces, default/strong/focus borders, foregrounds,
spacing, radius, typography, weights, and system-color exception already present on the train.

**Rationale**: Current form-select and segmented-choice CSS already demonstrate the needed
semantic families. No unique design value has been identified.

**Alternatives considered**: New component-named tokens or raw mockup values (both rejected by the
token-first and evidence-authority constraints).

## Decision 5 - Native checkbox remains visible

**Decision**: Do not use `appearance: none`, opacity hiding, off-screen positioning, or a
pseudo-element replacement.

**Rationale**: The issue requires a native checkbox, and native glyph/state behavior is the most
robust forced-colors and platform-semantics mechanism. The surrounding label tile may change
border/weight/surface based on `:has(input:checked)` while the input itself remains visible.

**Alternatives considered**: A custom painted box (can drift from checked/disabled state and is
fragile in forced colors).

## Decision 6 - Browser tests own semantic proof

**Decision**: Add a dedicated Playwright spec for roles/names/order, native activation, form
submission/reset, disabled behavior, zoom/containment, forced colors, and accessibility-tree
evidence; do not add ADR-11 behavior registry entries.

**Rationale**: The component owns no behavior, so mutation subjects would misclassify native
browser behavior as library behavior. Issue #277 nevertheless requires browser-level proof.

**Alternatives considered**: Vitest DOM snapshots (cannot prove real accessibility/native form
behavior); story screenshots alone (cannot prove semantics or submission/reset).

## Decision 7 - Approved K3 is composition evidence, not API authority

**Decision**: Reproduce its ten labels, two selections, layout hierarchy, and Apply/Clear
composition in a story, but correct its missing fieldset/legend and replace every raw design value
with current tokens.

**Rationale**: The issue body is binding and stronger than the mockup semantics. The UX evidence
also explicitly leaves disabled/focus/forced-colors/zoom/LightMode gaps for this mission to fill.

**Alternatives considered**: Literal copy of mockup HTML/CSS (violates semantics and token rules).

## Verified baselines

- `train/elements-first` was `7bcb8cacbf2ab7d662cfc924075ddf5005e6f7f2` at mission creation.
- #176, #178, #209, #211, #212, #254/#268, and #270/#285 are landed.
- #272 remains open and is irrelevant to #277.
- `expected-stories.json` total is 347 before this mission.
- `scripts/build-styles-only-markup.mjs` derives styles-only directories and generates each
  `index.ts` from authored `.html` files.
- `packages/styles/src/form-select` and `segmented-choice` provide current story/test/token
  precedents; neither authorizes checkbox state logic.
