# Research: compact navigation shell

## Scope and finding

This dossier records the completed audit for mission `repository-dossier-compact-navigation-shell-01M1Y3FY` / live issue #254. The change is an opt-in, backward-compatible compact-navigation presentation axis on the existing `sk-app-shell`. It is not a new shell, navigation component, router, or Team Kitty model.

The current element renders `personal-rail`, `context-sidebar`, `page-header`, and default content in a three-column grid. Its only responsive rule stacks columns below 720px. The recommended seam adds consumer-authored compact-header and compact-navigation regions while preserving that output when the axis is absent.

## Architectural decision

Keep one cohesive ownership boundary:

> `sk-app-shell` owns responsive placement, drawer visibility as a rendering consequence of the controlled value, internal drawer scrolling, and a dismissal *request*. The consumer owns the open value, trigger, accessible labelling, navigation markup, routes, current destination, and acceptance of dismissal by changing the value.

The axis is absent by default and therefore byte/behavior stable for existing consumers. Recognized compact mode activates at the approved 860px threshold; unknown values warn and fail open to the existing layout. Properties assigned before custom-element upgrade must be retained by normal custom-element upgrade behavior.

## Surface and behavior

- Add optional `compact-header` and `compact-navigation` slots. The latter is a bounded drawer surface for native consumer navigation; it is not a navigation tree.
- Expose documented parts for shell, compact header, drawer, and existing regions according to established element conventions. Do not rename or remove existing parts.
- Render the compact header at narrow widths and hide desktop personal/context columns from the content canvas. At 860px, 768px, and 390px verify closed and open presentation, long labels, short/tall viewports, and internal drawer scrolling.
- The consumer toggle is authored inside `compact-header`, remains in the same light-DOM root as the navigation target, reflects the controlled open value, and supplies truthful `aria-expanded`, `aria-controls`, and accessible labels. The shell must not infer routes, current links, or application state.
- Effective open is the conjunction of recognized compact presentation, app-shell inline size `<=860px`, and controlled open true. Escape only then emits exactly one typed, bubbling, composed, non-cancelable dismissal request. It does not mutate open. Exactly one bounded post-dispatch microtask samples acceptance as effective falsiness (`open !== true`), including React 19's omitted/undefined false property; this permits a framework commit scheduled by the current dispatch while preserving consumer ownership. The intent expires at that sample whether accepted or rejected. After acceptance, the shell awaits its Lit update before focusing, and any close after the sample, including a later route/state close, cannot inherit the intent.
- Resize observes the same shell inline coordinate system as CSS, never mutates controlled state, hides the compact-header trigger together with its drawer above 860px, and must not leave hidden focused content or an off-screen focus target.

## Evidence synthesis

Issue #254 is the binding product and acceptance record. It cites the approved Repository Dossier screens: D1, D2, and D4–D8 show the desktop rail/context composition, the 860px compact transition, drawer states, and narrow content requirements. The approved sources are read-only under `/home/jeroennouws/dev/team-kitty-missions/ux_redesign/repository-dossier/`; exact screen paths and SHA-256 values are pinned in `research/source-register.csv`. The approved README, DESIGN, BACKEND-CAPABILITY-MAP, SCREEN-MATRIX, and UX-DECISION-REPORT establish that this is a presentation seam, not Team Kitty capability or data.

The current `sk-app-shell` source confirms the compatibility constraint: four existing slots, six existing parts, stateless rendering, and a 720px stacking rule. ADR-9 makes tokens and declared `::part()` the styling API across open shadow roots; no ancestor selector is a valid contract. ADR-10 makes the element template the sole authored markup source and requires generated static output to remain synchronized. ADR-11 and the authoring recipe require typed event JSDoc, documented public members, manifest/part/doc ratchets, behavior IDs, mutation coverage, and generated wrapper/type artifacts.

Related issue history is supporting evidence: #125 is the tracked compact-navigation need; #135, #145/PR195, and #204/PR235 establish the surrounding shell and verification constraints; #253 is the parent coordination issue. WAI disclosure guidance is useful only as an accessibility behavior reference for disclosure-like controls; it does not authorize transferring state ownership to the shell.

## Risks and mitigations

| Risk | Mitigation / verification |
|---|---|
| Existing consumers change visually or behaviorally | Axis absent fixture, byte/visual baseline, and regression tests for all existing slots at desktop and legacy widths. |
| Controlled state and dismissal drift | Assert no direct mutation, one event per effectively-open Escape, zero otherwise, one bounded microtask sample of effective falsiness (including omitted/undefined), Lit-update-then-focus sequencing, and intent expiry at the sample before any later route/state close. |
| Hidden drawer remains reachable | Assert closed drawer is absent from sequential focus and the accessibility tree; assert native order when open. |
| Long labels or zoom create page overflow | Playwright at 860/768/390, real 200% and programme-required 400% browser UI zoom, long labels, and `scrollWidth <= clientWidth`; drawer scrolls internally. |
| Shadow styling or generated artifacts drift | Token-only values, declared parts, CSS boundary checks, manifest and generated HTML/React/Vue checks. |
| Accessibility mode regressions | Axe in every state plus dark/light, forced-colors, reduced-motion, and keyboard fixtures. |

## Exact verification envelope

Verify the public contract and behavior with element tests: pre-upgrade property survival; recognized/unknown axis behavior; slots and parts; controlled open/closed rendering; pointer and keyboard trigger integration; `aria-expanded`/`aria-controls`/labels; closed inertness; Escape event type, bubbles, composed, cancelable=false, count; accepted-dismissal focus return; disconnected-trigger fallback; resize cleanup. Add behavior IDs and one mutation per controlled-state branch under ADR-11.

Verify layout with Playwright at app-shell inline sizes 860px, 768px, 390px and the 861px edge, plus a constrained shell in a wider viewport, both drawer states, long labels, short/tall viewports, real 200% and programme-required 400% browser UI zoom, no document horizontal overflow, and internal drawer scrolling. Run axe over all states. Preserve the existing desktop visual baseline. Verify default dark, required `LightMode`, forced-colors, and reduced-motion.

Run the authoring/conformance envelope: CSS lint and adopted-boundary checks; custom-elements manifest; `expected-parts.json`, `expected-docs.json`, `behaviours.json`, and `mutations.json`; applicable generated output, React wrappers, Vue types, and size report. The existing app-shell has no markup module, so the repository-wide static-markup generator must stay green without creating one. The final task prompt pins the exact generation and verification commands rather than leaving the recipe as an implicit indirection.

## Non-goals

No Team Kitty state, routes, data, branding, or copy. No changes to `sk-personal-rail`, `sk-context-sidebar`, `sk-nav-pill`, existing default responsive behavior, or a new wrapper/dossier component. No router, route registry, current-link inference, persistence, breakpoint service, global store, application-wide focus trap, or third navigation rail.

## Recommendation

Implement the narrow seam as a small, stateless extension of `sk-app-shell`: one opt-in axis, two optional slots, controlled presentation, and one dismissal event. Keep navigation and state in light-DOM consumer markup. This boundary satisfies the approved screens while preserving the elements-first, token/part, canonical-markup, and verification architecture.
