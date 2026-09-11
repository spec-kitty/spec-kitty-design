# Research: Connector radio choice group

**Mission**: `connector-radio-choice-group-01M2693Y` | **Date**: 2026-09-10

## Decision 1 - The component is styles-only, no custom element

**Decision**: Ship native light-DOM CSS and HTML exemplars only, exactly as #336 requires.

**Rationale**: Issue #336 explicitly forbids a custom radio element. ADR-10's class-level styles-
only ruling (amended for #176, reaffirmed by #277's own merged implementation) covers this
component directly: its entire value is styling the semantics of native `fieldset`/`radio`
elements it does not need to wrap. Confirmed against #277's real merged diff
(`packages/styles/src/checkbox-choice-group/`): no `packages/elements` entry, manifest row,
wrapper, or `::part()` was added for the sibling checkbox family either.

**Alternatives considered**: A Lit wrapper or custom-drawn radio (rejected by contract, and would
also violate NI-004/C-006); a generic provider-selection component (would steal application
behavior Team Kitty owns per the issue's "Throughput and boundary" section).

## Decision 2 - Seven domain-neutral selectors, distinct from #277's

**Decision**: Use root, legend, options, choice, control, label, and secondary-value classes —
`.sk-radio-choice-group{,__legend,__options,__choice,__control,__label,__secondary-value}`.

**Rationale**: The set mirrors #277's proven seven-selector shape (root/legend/options/choice/
control/label + one optional content slot), coordinating anatomy per the issue's explicit
instruction. The seventh selector is renamed from `__metadata` to `__secondary-value` because a
radio's optional second value is a machine-readable identifier/path (C5's `full_path`
generalization), not a count — `__metadata` would misleadingly imply checkbox's numeric-count
semantics onto a fundamentally different data shape.

**Alternatives considered**: Reusing `.sk-checkbox-choice-group__metadata` verbatim (rejected:
C-011 requires the two families to remain distinct contracts, and aliasing invites a consumer to
believe they compose); a single combined label span with no secondary-value hook (rejected: the
issue's anatomy clause is explicit about a primary label plus an optional secondary machine value).

## Decision 3 - Exactly-one selection and validation are 100% native

**Decision**: Rely entirely on the shared `name` attribute for exactly-one selection and the native
`required` attribute plus browser constraint validation for the required/invalid state. No
JavaScript selection store, no library-authored validation message, no simulated `:invalid`.

**Rationale**: Issue #336 states this explicitly ("Browser-owned exactly-one selection, constraint
validation... No JS selection store") and it is the one clause with no #277 precedent to coordinate
against — checkbox groups have no analogous required/invalid contract (#277's spec explicitly
excludes validation-message ownership as an edge case). This is the sharpest place the two sibling
components' contracts diverge, per the issue's own "share... where behavior matches... distinct...
where checkbox/radio semantics differ" instruction.

**Alternatives considered**: A JS-driven `aria-invalid` toggle mirroring constraint-validation state
(rejected: NI-010 forbids a library-owned validity mirror; native `:invalid`/`:required` are the
only source of truth and the issue requires no JS selection store).

## Decision 4 - Current tokens are sufficient, including for the 44px floor

**Decision**: Reuse existing input/card surfaces, default/strong/focus borders, foregrounds,
spacing, radius, typography, weights, and system-color exceptions already on the train, including
`--sk-space-9` (48px) for the 44px interactive-target floor.

**Rationale**: `sk-confirm-dialog.css` already documents `--sk-space-9` as "the closest token at or
above the 44px NFR-001 floor" for an unrelated component's own touch-target requirement — the same
token family covers this mission's floor without a new token. Current `form-select` and
`checkbox-choice-group` CSS already demonstrate the needed semantic families for grid layout,
borders, and forced-colors. No unique design value has been identified.

**Alternatives considered**: New component-named tokens or raw C5 mockup values (both rejected by
the token-first rule and by C-010's evidence-authority boundary).

## Decision 5 - Native radio remains visible; `accent-color` is the only sanctioned customization

**Decision**: Do not use `appearance: none`, opacity hiding, off-screen positioning, or a
pseudo-element replacement. If the native glyph color is customized, use `accent-color` only, and
add a paired assertion proving the forced-colors-restored native control's accessible checked state
still matches what renders.

**Rationale**: The issue requires a native radio and explicitly names `accent-color` as the
sanctioned customization mechanism, with a proof obligation attached that #277 did not carry (radio
is the first family in this repository asked to demonstrate accent-color/forced-colors truthfulness
this explicitly). `sk-checkbox-choice-group.css` already sets `accent-color: var(--sk-color-yellow)`
on its control and survives forced-colors with a `border-block-end` treatment — the same base
technique, plus the new proof step.

**Alternatives considered**: A custom painted radio dot (rejected: NI-004, and can drift from
checked state under forced colors, which is the exact failure #336's proof requirement targets).

## Decision 6 - Browser tests own semantic proof; ADR-11's registry is inapplicable

**Decision**: Add a dedicated Playwright spec for roles/names/order, native exactly-one selection,
arrow-key/Space/label activation, required/invalid constraint validation, submission/reset, zoom/RTL
containment, forced colors including accent-color truthfulness, and accessibility-tree evidence; do
not add `behaviours.json`/`mutations.json` entries.

**Rationale**: The component owns no behavior — the browser owns exactly-one selection, arrow-key
roving, and constraint validation natively — so mutation subjects would misclassify native browser
behavior as library behavior. Verified against #277's real merged diff: `git grep -l
checkbox-choice-group -- '*.json'` returns only `expected-stories.json` and
`packages/styles/package.json`, confirming the sibling styles-only family touched neither registry
either. Issue #336 nevertheless requires browser-level proof, so Playwright (not the behavior
registry) carries it.

**Alternatives considered**: Vitest DOM snapshots (cannot prove real accessibility/native form
behavior, real RTL mirroring, or real forced-colors recoloring); story screenshots alone (cannot
prove semantics, exactly-one enforcement, or required/invalid submission blocking).

## Decision 7 - C5 is composition/anatomy evidence, not API authority

**Decision**: Generalize C5's fieldset > options > label > radio + primary-name + secondary-path
anatomy into a provider-neutral story, correcting its `sr-only` legend to a real visible-or-labelled
legend per consumer choice and replacing every GitLab word and raw design value with generic text
and current tokens.

**Rationale**: The issue body and current tokens are binding and stronger than the mockup, which
uses `<legend class="sr-only">` (present but visually hidden — acceptable per se, but the C5 HTML
overall lacks the `required-invalid` and RTL evidence #336 requires) and bakes in `group_id`/
`full_path` GitLab vocabulary that C-005/NI-005 forbid in the public library surface.

**Alternatives considered**: Literal copy of C5's HTML/CSS (violates C-005/C-010 vocabulary and
evidence-authority rules); dropping the secondary-value anatomy entirely (rejected: FR-004 requires
it as an explicit, if optional, part of the contract, matching C5's proven two-line choice shape).

## Verified baselines

- `train/elements-first` was `7032cf7792a83ee20d9fd70ddcfb28a057c72884` at this checkout's HEAD
  before spec.md landed.
- #277 (checkbox choice group) is landed and merged: `packages/styles/src/checkbox-choice-group/`
  exists on the train with the exact seven-selector, no-registry shape this research reuses as
  precedent.
- `expected-stories.json` total is 505 before this mission (measured directly, not assumed).
- `scripts/build-styles-only-markup.mjs` derives styles-only directories and generates each
  `index.ts` from authored `.html` files — the same generator #277 used, unchanged.
- `packages/styles/src/form-select`, `segmented-choice`, and `checkbox-choice-group` provide
  current story/test/token precedents; none authorizes radio selection/validation logic.
- ADR-9 (shadow DOM/styling API) does not apply: no custom element is registered. ADR-10's
  styles-only class ruling and ADR-11's verification-stack/behavior-registry inapplicability both
  apply, mirroring #277.
