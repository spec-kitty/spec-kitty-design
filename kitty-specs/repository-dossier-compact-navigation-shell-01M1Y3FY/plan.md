# Implementation Plan: Compact navigation seam for `sk-app-shell`

**Branch**: `train/elements-first` (mission work lands back on this train) | **Date**: 2026-09-07
**Spec**: `kitty-specs/repository-dossier-compact-navigation-shell-01M1Y3FY/spec.md` | **Issue**: #254

## Summary

Extend the existing stateless `sk-app-shell` with one opt-in compact presentation axis. In compact presentation it places two optional consumer-authored slots, presents the navigation slot as a bounded drawer, reflects consumer-controlled open state, and emits dismissal intent. It does not own routes, current-link state, a breakpoint service, a focus trap, or dismissal acceptance.

One cohesive WP owns element API/rendering, CSS, tests, docs, stories, and generated/ratcheted artifacts. Splitting these surfaces would permit a public API and its generated contract to drift, so this is an atomic backward-compatibility seam.

## Technical Context

**Language/Version**: TypeScript/ES modules, Lit, CSS custom properties; Node toolchain
**Primary Dependencies**: `lit`, Vitest browser mode, Playwright Chromium/Firefox, Storybook, axe-core, existing generators and ratchets
**Storage**: N/A; no application or component state store
**Testing**: Vitest browser behavior fixtures; Playwright layout/focus/overflow/axe; Node generation, manifest, mutation, size and CSS gates
**Target Platform**: Evergreen Chromium and Firefox; Web Components with open shadow roots; Safari release smoke
**Project Type**: reusable web-component/design-system monorepo
**Performance Goals**: preserve shell baseline; no global listeners/services; keep component/suite budgets green
**Constraints**: `--sk-*` tokens, declared `::part()`, generated outputs never hand-edited, legacy behavior unchanged unless opted in
**Scale/Scope**: one existing element, two slots, two reflected properties, one property-only reference, one event, one WP

## Architecture and exact API decisions

* `presentation: 'compact' | undefined` is the public reflected axis (the `presentation` attribute). It is absent by default; only `compact` is recognized; unknown values warn and fail open. This follows the repository’s implicit-default reflected-axis convention while avoiding a redundant public `legacy` value. CSS selects the host attribute, never an ancestor.
* `open: boolean` is the public reflected controlled property (the `open` attribute). It projects consumer state into rendering; the shell never changes it on Escape, click, resize, or route activation. Declare it with Lit so assignment before upgrade is retained and reflection is observable.
* `compactTrigger: HTMLElement | null` is property-only (`attribute: false`, manifest `x-spec-kitty-property-only: true`) and exists solely for accepted-dismissal focus restoration. The referenced control must be consumer-authored inside `compact-header`, remain in the same light-DOM root as the navigation target, and is not serialized or used for route discovery.
* Add `compact-header` and `compact-navigation` slots. The latter receives a consumer’s native navigation node (consumer-authored id, accessible name, and links). The shell may wrap it visually for a bounded drawer but must not add `<nav>` or `role="navigation"`.
* The consumer trigger and controlled navigation target remain same-root light-DOM nodes. The consumer writes `aria-controls` to the navigation node’s id and `aria-expanded` from `open`. The shell must not point `aria-controls` at an internal shadow wrapper: IDREF resolution does not cross the trigger/target root boundary (ADR-9). Requiring the trigger inside `compact-header` means the trigger and drawer leave presentation together above the compact threshold, so the shell need not mutate consumer-owned ARIA.
* Define effective open as recognized compact presentation, observed app-shell inline container size `<=860px`, and controlled `open === true`. Emit `sk-app-shell-dismiss` as `CustomEvent<SkAppShellDismissDetail>`, readonly `detail: { reason: 'escape' }`, `bubbles: true`, `composed: true`, `cancelable: false`, exactly once per Escape interaction only while effectively open. Non-cancelable is intentional: there is no shell close action to cancel; every other Escape emits nothing.
* Route activation remains a consumer intent seam: a consumer-authored link/button handles native activation, updates route/current-link state in the application, and sets `open = false`. No router, destination inference, route event, or shell navigation API is added.
* Escape records a pending dismissal intent immediately before synchronous dispatch. Exactly one bounded post-dispatch microtask samples the consumer-controlled value and accepts effective falsiness (`open !== true`), including React 19's omitted/undefined false property; this permits a framework commit scheduled by the current dispatch without transferring state ownership to the shell. The pending intent expires at that sample whether accepted or rejected. After an accepted sample, the component awaits its Lit update so closed/inert state is rendered before it focuses `compactTrigger`, and only if the trigger remains connected. Any close after the sample, including a later route/state close, cannot inherit focus-return intent.
* The 860px rule is an `sk-app-shell` inline container-query presentation, matching the component's existing responsive architecture. A component-local `ResizeObserver` observes that same host inline size for effective-open keyboard/focus reconciliation: it never changes `open`, never becomes a shared breakpoint service, disconnects on teardown, and never focuses the compact trigger on the desktop side. Full-width viewport fixtures plus a constrained-shell/wider-viewport fixture prove CSS and behavior use the same coordinate system.

## Source ownership and generated outputs

Authored/edited files (estimated 12–18, exact count confirmed during implementation):

* `packages/elements/src/app-shell/sk-app-shell.ts`: properties, typed JSDoc, slots, rendering, Escape/dismissal and focus reconciliation; preserve old slots/parts.
* `packages/styles/src/app-shell/sk-app-shell.css`: compact host/layout/drawer, internal scrolling, overflow guards, forced-colors outline/system colors, scoped reduced-motion.
* `fixtures/elements-behaviour/src/sk-app-shell.test.ts`: red-first behavior and mutation subjects.
* Current Storybook app-shell story and Playwright shell spec locations under `apps/storybook/src/`: desktop/compact states and Chromium/Firefox layout/focus/axe fixtures using light-DOM consumer nodes.
* `docs/design-system/using-components.md`: slots/properties/event/parts, trigger ARIA obligations, controlled dismissal/focus sequence, route seam, threshold and warning.
* `packages/elements/custom-elements-manifest.config.mjs` only if analyzer configuration needs the property-only field; never hand-edit `custom-elements.json`.
* `behaviours.json`, `mutations.json`, `mutations.selftest.json`, `suite-budget.json` only through established registry/mutation conventions; add no new ADR-11 id.

Generated, then committed (never hand-edit): `packages/elements/src/app-shell/sk-app-shell.css.js`, `sk-app-shell.css.d.ts`, `packages/elements/custom-elements.json`, `packages/react/src/SkAppShell.{js,d.ts}`, React indexes, `packages/elements/vue.d.ts`, applicable styles-only output, and applicable part/behavior/mutation/size reports including `packages/elements/SIZES.md`. Run the repository-wide static-markup generator and prove it stays clean; do not invent an app-shell markup module because this existing element has none.

## Implementation sequence within the single WP

1. Capture current desktop and legacy 720px baseline. Add public JSDoc, token dependencies, slots and event detail first; retain all four existing slots and six existing parts. Add only documented new parts.
2. Implement compact rendering as a consequence of `presentation` and `open`. Keep consumer nodes in light DOM; closed content is `aria-hidden`/inert and absent from sequential focus and the accessibility tree; open content is native order in a viewport-bounded, internally scrolling drawer. Keep the existing single `main`; create no navigation landmark.
3. Implement Escape with composed-path-safe handling and one non-cancelable event only while effectively open. Store only the trigger reference plus an ephemeral pending-dismissal marker bounded to exactly one post-dispatch microtask sample. At that sample, accept effective falsiness (`open !== true`), including React 19's omitted/undefined false property, and expire the intent whether accepted or rejected so no later close can inherit it. After acceptance, await the component's Lit update before restoring focus to a connected trigger. Reconcile threshold focus cleanup with a component-local observer using the same inline-size threshold as CSS; disconnect it on teardown. No global breakpoint service or application state.
4. Add the app-shell inline container rule at inclusive `860px` (compact at `<=860`, test `861` non-compact and test a constrained shell inside a wider viewport). Leave the absent-axis `@container (max-width: 720px)` rule unchanged. Use tokens and parts, no cross-shadow selectors, hardcoded design values, or animation dependency.
5. Add behavior tests, then mutate the element to demonstrate red-first coverage. Use exact ADR-11 train registry IDs: ADR-11 SC-006 event count; ADR-11 SC-007 detail shape; ADR-11 SC-008 bubbling/composed flags; ADR-11 SC-010 pre-upgrade/reflection; ADR-11 SC-012 Escape/focus-return behavior; ADR-11 SC-013 declared parts; ADR-11 SC-014 style adoption; and ADR-11 SC-017 the documented responsive threshold and behavior it gates. Do not mint an ID for route ownership, and do not relabel a controlled-state assertion under an unrelated ID.
6. Regenerate manifest, React/Vue, CSS/static barrels, ratchets and size output. Add React/Vue type checks for `open`, `presentation`, `compactTrigger` and typed event detail; prove generated files were not manually patched. Update story, CSS, manifest and bundle budgets.

## Verification matrix and evidence

Storybook must render without console errors and axe must pass: legacy desktop, compact closed/open, long navigation labels, short/tall viewports, 390/768/860/861 shell inline sizes, a constrained-shell/wider-viewport case, default dark, `LightMode`, forced colors, and reduced motion. Include visual diffs against the exact read-only D1, D2 and D4–D8 sources registered by absolute path/checksum in research; `LightMode` is the required story name.

Playwright runs the fixtures in Chromium and Firefox at 390, 768, 860 and 861 CSS px, plus a constrained shell inside a wider viewport, both drawer states, short/tall heights, long labels, pointer/keyboard activation, effective versus merely controlled-open Escape, accepted/rejected/disconnected-trigger dismissal, resize across threshold, internal drawer scroll, and `document.scrollWidth <= clientWidth`. Repeat compact 390 at real 200% and programme-required 400% browser UI zoom; assert no horizontal page overflow and no hidden/off-screen focus. If automation cannot honestly emulate browser UI zoom, record real Chromium/Firefox UI-zoom evidence and the exact limitation rather than equating CSS scaling, device scale factor, or ordinary viewport resizing with zoom. Check closed accessibility-tree absence, open native order, truthful consumer ARIA, and no shell-created nav landmark. Include forced-colors/reduced-motion assertions.

Run focused Vitest plus `typecheck-all`, Storybook/a11y, Playwright, stylelint, manifest/public-contract, behavior/mutation selftests, generation `--check`, CSS-boundary/no-CSS-in-source, element-entry, ratchet and size gates. Verify unknown warning/fail-open, legacy stability, pre-upgrade retention, open immutability on Escape/resize, event flags/count/detail, accepted focus sequencing, and route-close by consumer assignment.

## Requirement/evidence map

| Requirements | Evidence | Constraints/SC | Evidence |
|---|---|---|---|
| FR-001–004 | element + pre-upgrade/unknown tests; legacy visual | C-001–005 | source diff and controlled-state tests |
| FR-005–010 | slot/part/ARIA-tree/focus tests and stories | C-007–008 | manifest docs and no-nav-landmark axe check |
| FR-011–013 | event flags/count, acceptance and route-link tests | ADR-11 SC-006–008, SC-010, SC-012 | marked tests + red-first mutations |
| FR-014–017; NFR-001–007 | Chromium/Firefox 390/768/860/861, themes, zoom, resize, overflow, axe | C-004–006 | unchanged nav/notice/rail/sidebar diff and audit |
| FR-018–021; NFR-008 | Storybook, generated artifacts, wrappers/types, ratchets, gates | C-002–003 | rebase/regenerate/retest report |

## Risks, rollback and acceptance handoff

Risks: IDREFs accidentally point into shadow DOM; consumer nodes are duplicated; focus restores before hiddenness; resize leaks or mutates state; 720px drift; forced-colors focus loss; manifest/wrapper drift. Mitigate with same-root fixtures, disconnected-trigger tests, post-update assertions, teardown tests, threshold regression fixtures, system-color/outline checks and clean generator diffs.

Rollback is one revert of the WP/PR. Since the axis is absent by default, removing element/CSS/docs/generated changes restores the prior contract without migration. Do not alter `sk-nav-pill`, `sk-notice`, `sk-personal-rail`, or `sk-context-sidebar`.

Before PR acceptance, rebase the mission branch on the latest `train/elements-first` after closed #145 dependencies are present; regenerate every output, rerun the complete focused/gate matrix, and review the exact resulting SHA. PR description must contain `Refs #254`, target `train/elements-first`, evidence/visual diff. Do not close or merge the issue/PR; merge is an operator action after the programme gate.

## API summary and WP justification

API: reflected `presentation="compact"`; reflected controlled `open`; property-only `compactTrigger`; `compact-header` and `compact-navigation` slots; existing parts plus only documented new parts; non-cancelable composed bubbling `sk-app-shell-dismiss` with `{ reason: 'escape' }`. The consumer-authored trigger sits in `compact-header`, shares the navigation target's light-DOM root, and owns IDs, `aria-controls`, labels, routes and acceptance.

Estimated authored/generated change surface: 12–18 files, plus registry/ratchet deltas emitted by existing generators. One WP is justified because API, render/CSS behavior, accessibility, tests, docs and generated consumers form one compatibility contract and must be reviewed/regenerated at one SHA.
