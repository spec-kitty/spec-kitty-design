# Implementation Plan: Theme Preference Toggle

**Branch**: `mission/theme-toggle` | **Date**: 2026-09-10 | **Spec**: `kitty-specs/theme-toggle-01M25KMP/spec.md`

## Summary

Add `sk-theme-toggle` as an elements-first Lit custom element backed by one DOM-safe theme contract and one generated pre-paint classic-script artifact. The control uses a native radio-group/segmented presentation for the exact `system | light | dark` preference. The element applies the shared resolver through a lifecycle adapter; the pre-paint file is bundled from that same authored contract, so the storage key and resolution algorithm are not copied. Extend the public-surface Factory operational-status pattern and assert root state, luminance, contrast, accessibility, forced colors, responsive/zoom behavior, and cleanup.

## Technical context

- **Language/runtime**: TypeScript/ES2022, Lit 3, CSS; Node 22 in CI.
- **Packages**: Nx monorepo dependency flow `tokens → styles → elements → react`; no new dependency.
- **Storage**: one browser-local key, `spec-kitty-theme`, accepting only `system`, `light`, or `dark`.
- **Targets**: modern custom-elements browsers, self-contained classic bundle/file consumers, generated React/Vue types, SSR-safe module import.
- **Testing**: Vitest; Playwright Storybook/browser suite; ADR-11 behavior fixtures in Chromium and WebKit; generator/self-test/ratchet gates.
- **Performance**: root resolution is synchronous and constant-time; parser-blocking pre-paint artifact stays small and is included in the existing size ratchet.
- **Scope**: one element, one shared resolver contract, one pre-paint asset, one generic composed proof, one WP, one PR.

## Charter check

The plan conforms to project doctrine:

- Architectural integrity and context boundaries: generic theme mechanics stay inside the design system; Factory data/auth/routing remains consumer-owned.
- Canonical source/unification: one authored contract feeds the element and generated bootstrap.
- Test first and discriminating tests: focused behavior tests are authored and observed red before production implementation; ADR-11 mutation re-derives the claim.
- Living documentation: public API, installation, degradation, and composed evidence update together.
- Generated-artifact integrity: manifest, wrappers, Vue types, static markup/barrels, CSS modules, Storybook ratchet, and size record are generator-owned.
- Exact-head independent review: the project-required two-pass pre-merge squad is pinned to the final SHA.
- Supply chain: no dependency addition; locked install uses `--ignore-scripts`.

No charter exception or complexity violation is required.

## Architecture decisions

### AD-01 — Native three-choice semantics

Render a labelled `fieldset`/legend containing three same-name native radio inputs, styled as a segmented control. This exactly models a mutually exclusive three-value preference and provides browser keyboard semantics. Do not use `role="switch"`; a switch is binary. Visible group and option labels are consumer-supplied through documented public attributes/properties (or the recipe-compatible equivalent selected during implementation), with no hard-coded consumer-visible fallback. When required labels are absent, fail safely without presenting an unlabeled interactive control.

### AD-02 — One authored theme contract

Create a DOM-free leaf module under `packages/elements/src/theme-toggle/` that owns:

- `ThemePreference = 'system' | 'light' | 'dark'` and `ResolvedTheme = 'light' | 'dark'`;
- the exact `spec-kitty-theme` key;
- accepted-value validation and invalid fallback;
- system resolution;
- safe storage read/write;
- root `data-theme` and `color-scheme` application through passed capabilities rather than top-level globals.

No module touches `window`, `document`, `localStorage`, or `matchMedia` at import time. Tests consume the contract as a black box through supplied capabilities.

### AD-03 — Element lifecycle adapter

The element imports AD-02 and owns only browser lifecycle:

- initialize from safe storage plus system preference on connection;
- synchronize the selected radio and root state;
- install exactly one media-query change listener while preference is System;
- remove it on manual selection/disconnect and never accumulate listeners on reattachment;
- persist all three selections, including `system`, under the same key;
- emit one documented typed preference-change event only if current repository precedent requires a public event.

The element must tolerate absent/legacy media-query listener APIs and throwing storage. In forced colors the semantic radios remain operable; CSS does not freeze authored colors with `forced-color-adjust: none`.

### AD-04 — Pre-paint artifact is generated from AD-02

Author a tiny bootstrap entry that imports AD-02 and invokes the same safe initial-resolution/application functions. A repository generator bundles that entry into a committed classic-script asset (proposed `packages/elements/theme-bootstrap.js`) and supports normal, `--check`, and `--selftest` modes. The package exports/includes the generated file, the release graph checks the packed artifact, and documentation tells consumers to inline its generated contents in `<head>` before stylesheet links.

This gives a parser-time classic script without maintaining a second resolver. The self-test plants a deliberate contract drift/missing output and must fail. Bootstrap behavior tests compare the generated artifact with direct contract behavior for every accepted, invalid, missing, and throwing-storage case and assert its source precedes stylesheets.

### AD-05 — Static/no-JS surface

Follow the current markup recipe only from an authored `sk-theme-toggle.markup.ts`. The interactive element and generated static form derive from the same markup helper. The generated no-JS form must communicate that System is selected without offering controls that pretend to change theme; use the current recipe's supported disabled/noninteractive representation. With JavaScript absent, token CSS remains system-default through `prefers-color-scheme`. Document that manual persistence requires enhancement.

If the current generator cannot express a safe noninteractive form without duplicating markup, the implementation records that generator limitation as a follow-up and omits a misleading static control; it must not hand-author generated files. This is a technical constraint, not permission to drop generated artifacts silently.

### AD-06 — Root-owned, isolated Storybook proof

Extend `packages/elements/src/patterns/operational-status.ts` and its story lineage using public surfaces only. The #323 proof mounts the toggle with operationally toned `sk-card` content and `.sk-facts`; it removes no existing #259 proof and does not use its nested `.sk-light` option as root evidence.

Each theme story/decorator snapshots and restores the document root attribute/style, `spec-kitty-theme` storage entry, and listener/element state. Tests cover System-light, System-dark, manual-light, manual-dark, Default/dark, LightMode, grayscale, forced-colors, narrow width, and 200% zoom. Both resolved modes assert:

1. exact `document.documentElement.dataset.theme`;
2. background luminance on a named composed surface, with a threshold that makes light and dark mutually exclusive;
3. WCAG AA foreground/background contrast.

## Data and control flow

```text
localStorage value ----validate----┐
                                   v
control selection ------------> preference ----resolve(system media)----> light|dark
                                      |                                      |
                                      +----persist valid value                +----apply root data-theme
                                      |                                      +----apply root color-scheme
                                      +----system only: one live listener

authored DOM-free contract ----import----> Lit lifecycle adapter
             |
             +----bundle generator----> parser-time classic bootstrap asset
```

## Project structure and expected changes

```text
packages/styles/src/theme-toggle/
├── sk-theme-toggle.css                    # authored token-only styles
├── sk-theme-toggle.html                   # generated if safe static form is supported
├── index.ts                               # generated
└── sk-theme-toggle-html.stories.ts        # generated/static evidence if recipe emits it

packages/elements/src/theme-toggle/
├── theme-preference.ts                    # authoritative DOM-free contract
├── theme-bootstrap-entry.ts               # authored generator entry
├── sk-theme-toggle.markup.ts              # sole authored markup
├── sk-theme-toggle.ts                     # Lit lifecycle/control
├── sk-theme-toggle.stories.ts             # component stories
├── sk-theme-toggle.test.ts                 # source/SSR/contract tests where current pattern places them
└── generated CSS module files             # generator-owned

packages/elements/src/
├── index.ts                               # public export
├── elements.ts                            # guarded registration import
└── patterns/
    ├── operational-status.ts              # generic composition
    └── operational-status.stories.ts

fixtures/elements-behaviour/src/
├── sk-theme-toggle.test.ts                # ADR-11 browser behaviors
└── pattern-operational-status.test.ts     # root/luminance/contrast/composition proof

apps/storybook/src/tests/
└── sk-theme-toggle.spec.ts                # rendered interaction, a11y, viewport/zoom/isolation/bootstrap

scripts/
└── build-theme-bootstrap.mjs              # generated bootstrap normal/check/selftest

packages/elements/
├── package.json                           # export/files entry
└── theme-bootstrap.js                     # generated committed asset

behaviours.json
mutations.json
expected-docs.json
expected-parts.json
expected-stories.json
packages/elements/custom-elements.json     # generated
packages/elements/vue.d.ts                 # generated
packages/react/src/*                       # generated wrapper/barrel
SIZES.md                                   # generated
docs/design-system/using-components.md
docs/architecture/validation/issue-323-theme-toggle/
```

Exact file creation is generator-driven. The implementer must inspect current outputs and must not hand-edit any file marked generated.

## Implementation concern map

### IC-01 — Resolver contract and pre-paint derivation

- **Requirements**: FR-001, FR-004–FR-008, FR-014; C-002.
- **Surfaces**: theme-preference module, bootstrap entry/generator/artifact, package export, contract/bootstrap tests.
- **Risks**: duplicated constants or algorithm; import-time globals; storage exceptions; bootstrap after CSS.

### IC-02 — Accessible control and lifecycle

- **Requirements**: FR-001–FR-006, FR-008–FR-010.
- **Surfaces**: element, canonical markup, styles, public docs/types.
- **Depends on**: IC-01 contract.
- **Risks**: binary semantics, untranslated fallback text, duplicate listeners, misleading no-JS form.

### IC-03 — Factory composition and visual truth

- **Requirements**: FR-010–FR-012; C-003–C-004.
- **Surfaces**: operational-status pattern/stories, behavior and Playwright proofs.
- **Depends on**: IC-01 and IC-02 public APIs.
- **Risks**: nested wrapper mistaken for root state, light twice/dark twice, private-root reach-through, story contamination.

### IC-04 — Distribution and ratchets

- **Requirements**: FR-013–FR-014; NFR-005; C-005.
- **Surfaces**: CSS/static generators, manifest, React/Vue generation, elements entries, behavior/mutation/doc/part/story/size ratchets, release graph.
- **Depends on**: IC-01–IC-03.
- **Risks**: hand-edited generated output; shared-file rebase conflicts; wrapper property widening.

All four concerns remain one bounded WP because they form one inseparable public component contract and one PR; splitting them would leave intermediate WPs undistributable or unreviewable as standalone behavior.

## Test-first and evidence plan

1. Before production code, add focused resolver/lifecycle/bootstrap and public composition tests plus ADR-11 behavior/mutation entries.
2. Run the narrowest new tests and save the failing command, exact failure, and pre-implementation SHA in `kitty-specs/theme-toggle-01M25KMP/implementation-evidence.md`.
3. Implement AD-01–AD-06 and run focused tests until green.
4. Generate from authored sources only: element CSS modules, static markup/barrels, manifest, React wrappers, Vue types, Storybook ratchet, bootstrap asset, and size records.
5. Run focused TypeScript/Vitest/behavior/Playwright tests, then the complete current repository gate set.

Required discriminating cases are the complete lists in spec User Stories 1–4; no test may assert only the presence of `data-theme`, a nested theme wrapper, or equal empty values.

## Gate inventory

Focused first:

- new Vitest tests via `npx vitest run <new test paths>`;
- `npx playwright test apps/storybook/src/tests/sk-theme-toggle.spec.ts --project=chromium`;
- ADR-11 fixture selection in Chromium and WebKit using the repository fixture command discovered from `scripts/measure-suite-time.mjs`;
- `node scripts/build-theme-bootstrap.mjs --check --selftest` as supported by the new gate.

Full exact-HEAD gates:

- `npm test`;
- `npm run quality:all`;
- `node scripts/typecheck-all.mjs`;
- `npx nx run tokens:build && npx nx run tokens:catalogue`;
- `node scripts/build-elements-css.mjs --check`;
- `node scripts/build-element-markup.mjs --check`;
- `node scripts/build-styles-only-markup.mjs --check`;
- `npx nx run elements:analyze` followed by a clean manifest diff and `node scripts/check-manifest-content.mjs` plus `--selftest`;
- `node scripts/build-react-wrappers.mjs --check` plus `--selftest`;
- `node scripts/build-vue-types.mjs --check`, `node scripts/check-vue-template-types.mjs`, and `node scripts/check-vue-packed-types.mjs`;
- public-contract, token-literal, adopted-CSS, CSS-hygiene, entry, part, theme-wrapper, pattern-composition, behavior-import, gate-wiring, and release-graph checks with each available self-test;
- `node scripts/build-storybook-with-budget.mjs`;
- `node scripts/gate-selftest.mjs` and `node scripts/run-axe-storybook.js`;
- `npx playwright test` across configured projects;
- `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium`;
- `node scripts/measure-suite-time.mjs`, `node scripts/suite-selftest.mjs`, and `node scripts/suite-selftest.mjs --selftest`;
- publishable graph build, `node scripts/check-release-graph.mjs` plus `--selftest`, `node scripts/measure-elements-sizes.mjs --check`, offline-load check plus self-test, and demo assembly;
- `bash scripts/npm-audit-gate.sh`, `npm run security:lockfile-check`, and `bash scripts/check-action-pins.sh`;
- `npm run quality:commitlint`.

Skipped, unavailable, flaky, CI-only, or pre-existing failures are reproduced against the base when feasible and recorded, never hidden. Visual changes are inspected; `--update-snapshots` is not acceptance evidence.

## Rebase, review, and delivery

Immediately before acceptance, fetch and rebase onto current `origin/train/elements-first`, regenerate shared outputs, rerun every applicable gate, require a clean tree, and rerun independent review if the rebase changes content. WP01 implementation and remediation seats may mutate; all reviewer and adversarial seats are read-only and name their reviewed SHA. The project-required pre-merge adversarial squad uses architecture, runtime-failure, acceptance/accessibility, and semantic-compression lenses for two passes.

After Spec Kitty acceptance, push `mission/theme-toggle`, open exactly one conventional PR into `train/elements-first`, monitor and remediate with fresh seats, and merge only when current, green, accepted, WP-approved, and free of unresolved High/Medium exact-head findings. Never merge the train into `main`.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Bootstrap and element drift | Bundle the bootstrap from the same authored contract and enforce generated-byte drift plus behavior parity. |
| Browser/API failure | Capability injection, no import-time globals, safe storage catches, legacy/absent matchMedia handling, lifecycle leak tests. |
| Misrepresented semantics/i18n | Native radios, required consumer labels, accessibility-tree/keyboard/no-fallback-copy tests. |
| Same palette twice | Root assertion plus mutually exclusive luminance and AA contrast measurements. |
| #93 scope expansion | Leave its two ratcheted wrappers unchanged; root proof is local to #323. |
| Generated conflicts as train moves | Final rebase, regenerate from authored sources, rerun exact-head gates/review. |
| Story total base defect | Consume PR #325 if landed; otherwise reproduce/classify base failure without modifying #323 scope. |
