# Implementation Plan: Context navigation unavailable-entry extension

**Branch**: `train/elements-first` (planning checkout; implementation uses a lane) | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)  
**Input**: GitHub #264 and the merged `.sk-context-nav` contract at `train/elements-first@57e1f466afd3ead40523aa3d25d86b85eda87bce`.

## Summary

Add two token-only BEM selectors to the existing native light-DOM context-navigation family: an unavailable non-anchor row and its optional consumer-supplied annotation. Prove the contract with authored semantic HTML exemplars, generated TypeScript exports, Storybook states, focused real-browser accessibility/interaction/resilience tests, visual baselines, documentation, and story ratchets. No token, element, wrapper, JavaScript, or neighboring component changes are planned.

## Technical context

**Language/Version**: CSS, HTML, TypeScript on Node.js 22.22.2  
**Primary Dependencies**: Nx, Storybook 10 web-components renderer, Playwright, axe-core  
**Storage**: N/A; immutable repository fixtures only  
**Testing**: existing `sk-context-nav` Playwright suite, visual suite, Storybook axe sweep, Vitest/mutation and repository gate scripts  
**Target Platform**: native light-DOM navigation in modern Chromium, Firefox, and configured CI WebKit; forced-colours and browser zoom resilience  
**Project Type**: token-driven Nx design-system monorepo  
**Performance Goals**: no runtime JavaScript or new package; Storybook build remains below the charter's three-minute ceiling  
**Constraints**: existing tokens only, BEM, native list semantics, no interaction surface, required `.sk-light`, generated artifacts never hand-edited  
**Scale/Scope**: one existing CSS family, four small canonical fixtures, focused story/test/docs additions, one independently reviewable WP

## Charter check

- **Tokens first / semantic pairing**: PASS. Reuse existing foreground, surface, border, typography, spacing, and radius tokens; add no raw design values or tokens.
- **Native semantics / accessibility**: PASS. The unavailable surface is a consumer-authored `span[aria-disabled="true"]` inside the existing native list item, with no role or focusability. Tests assert the actual accessibility tree and tab order.
- **Styles-only boundary**: PASS under ADR-10's recorded native-semantics class. A wrapper would add a host between native list relationships and would invent behavior.
- **Canonical markup / generation**: PASS. Author `.html` exemplars; regenerate `context-nav/index.ts` with `build-styles-only-markup.mjs`; never hand-edit the generated barrel.
- **Behavior verification**: PASS. The family owns no JavaScript behavior and therefore adds no ADR-11 behavior/mutation subject. Real-browser tests prove absence of interaction and preservation of adjacent link behavior.
- **LightMode, forced colours, reduced motion, RTL, zoom**: PASS by explicit stories and browser assertions. The family adds no motion.
- **Review policy**: one WP, one PR, rebased on current train before final gates, exact-head visual evidence, independent Codex review passes, CI green before merge.
- **Product and dependency boundary**: PASS. #256/#262 is merged; #254 is independent; #265 remains downstream. Public examples use generic catalogue language.

Re-check after design: no charter exception or complexity violation is anticipated.

## Project structure

### Documentation (this mission)

```text
kitty-specs/context-nav-unavailable-entry-extension-01M1YYPE/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/context-nav-unavailable.md
└── tasks.md
```

### Source and verification

```text
packages/styles/src/context-nav/
├── sk-context-nav.css                         # authored extension
├── sk-context-nav-unavailable-mixed.html      # authored fixtures
├── sk-context-nav-unavailable-all.html
├── sk-context-nav-unavailable-parent.html
├── sk-context-nav-unavailable-long.html
├── sk-context-nav-html.stories.ts             # authored stories
└── index.ts                                    # generated

apps/storybook/src/tests/
├── sk-context-nav.spec.ts                     # semantic/interaction/resilience checks
├── visual.spec.ts                             # exact visual routes
└── visual.spec.ts-snapshots/*context-nav*     # reviewed baselines

docs/design-system/using-components.md         # public native anatomy and ownership
expected-stories.json                          # exact story-route ratchet
```

**Structure decision**: Extend the existing styles-only family and its existing test/documentation surfaces. No new package, element directory, behavior registry subject, or token category is needed.

## Implementation concern map

### IC-01 — Native unavailable presentation

- **Purpose**: Add a visually explicit but structurally non-interactive row and optional annotation without altering available/current/nested link styles.
- **Relevant requirements**: FR-001–FR-007, NFR-002–NFR-005, C-001–C-006.
- **Affected surfaces**: `packages/styles/src/context-nav/sk-context-nav.css` and authored context-nav HTML exemplars.
- **Sequencing/depends-on**: merged #256 contract.
- **Risks**: accidental shared selector with links; colour-only distinction; annotation squeezing long labels; a parent fixture implying hidden children; forced-colours treatment that resembles an action.

### IC-02 — Public proof and distribution

- **Purpose**: Make every required state independently reviewable and pin its semantics, non-interaction, containment, themes, and generated distribution.
- **Relevant requirements**: FR-008–FR-010, NFR-001–NFR-007.
- **Affected surfaces**: context-nav stories, focused Playwright tests, visual suite/baselines, `expected-stories.json`, generated context-nav barrel, public documentation.
- **Sequencing/depends-on**: IC-01 anatomy and selectors.
- **Risks**: tests that assert only DOM shape rather than trusted interaction; LightMode route using an inert wrapper; visual evidence captured before rebase; hand-edited generated output; unrelated wrapper/manifest drift.

## Implementation strategy

1. Establish red-first focused assertions for unavailable roles/tab order, mixed/current semantics, interaction invariance, all-unavailable/no-current truth, absent children, long-content containment, RTL, zoom, forced colours, and real light-token resolution.
2. Add generic authored fixtures covering mixed, annotation-free, all-unavailable, parent boundary, and long-content variants.
3. Implement `.sk-context-nav__unavailable` and `.sk-context-nav__annotation` with existing tokens and logical properties. Keep selectors disjoint from `.sk-context-nav__link` pseudo-classes; use no pointer/focus declarations and no generated content.
4. Add Storybook routes and exact story ratchet entries. Add focused dark/light/forced-colour/long-content visual routes and capture baselines from the final rebased head.
5. Document the native anatomy, consumer ownership, no-disabled-anchor rule, all-unavailable/no-current and unavailable-parent boundaries, token dependencies, and why the extension stays styles-only.
6. Regenerate the styles-only barrel through `node scripts/build-styles-only-markup.mjs`. Assert manifest, React, Vue, element ratchets, and token files remain unchanged.
7. Rebase on the latest remote train, regenerate all applicable artifacts, rerun focused checks followed by the complete repository/CI-equivalent gate matrix, review the exact head, then create a `Refs #264` PR to `train/elements-first`.

## Verification strategy

- **Focused red/green**: context-nav Playwright tests in Chromium and Firefox; exact story routes; unavailable hover/mousedown/focus attempts; tab sequence and accessibility snapshot; long/RTL/forced-colours/zoom geometry.
- **Generated artifacts**: styles-only barrel generation/check; all element CSS/markup, manifest, React, Vue, and size regeneration/checks; clean-tree assertion after committing generated outputs.
- **Repository quality**: `npm run test`, full mutation selftest, `npm run quality:all`, typecheck, gate selftests/wiring, package build/release/offline checks, Storybook build and complete axe sweep.
- **Browser and visual**: full configured Playwright suite, Chromium exact-head visual update/review, Firefox focused parity, CI WebKit, threshold widths, 240px/390px, 200%/400% zoom, forced colours, reduced motion, RTL.
- **Composition boundary**: run the #259 composition gate and confirm no private shadow-root reach-through or copied neighbor CSS.
- **Exact-head rule**: final evidence and review must name the rebased candidate SHA; any subsequent product or generated change invalidates visual/review evidence.

## Merge and coordination

- One work package produces one PR targeting `train/elements-first` with `Refs #264`, never `Closes #263`.
- Do not edit or reopen #262. If the train moves, rebase and regenerate instead of copying from sibling branches.
- Merge only after Spec Kitty accept passes, exact-head CI and independent review are green, and repository doctrine authorizes the train merge.
- After merge, run Spec Kitty mission review against the actual merge commit before beginning #265.

## Complexity tracking

No charter violations or additional architectural mechanisms are required.
