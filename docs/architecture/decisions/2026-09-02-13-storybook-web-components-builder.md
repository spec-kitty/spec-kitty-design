# ADR 13 (2026-09-02): Storybook Moves to the Web-Components Renderer on Vite

**Date:** 2026-09-02
**Status:** Proposed
**Deciders:** MOES-Media (operator session, 2026-09-02)
**Technical Story:** SP-2, proven end-to-end before this record was written; supersedes ADR-6's multi-framework rendering arrangement

---

## Context and Problem Statement

ADR-8 makes custom elements the shared base. Storybook is the catalogue, the accessibility gate and the visual-regression baseline for that base — so which renderer it uses is a prerequisite for authoring the first element, not a downstream consequence. ADR-8's first draft got this backwards and has been corrected.

What is actually configured today:

* `apps/storybook/.storybook/main.ts:15` — `framework: { name: '@storybook/angular', options: {} }`. **One renderer, not two.** `@storybook/html` is a devDependency but is not the configured framework.
* The whole Storybook is an Angular CLI application: `angular.json` defines a single project built by `@storybook/angular:build-storybook`, launched through `ng run storybook:storybook`, with `zone.js` polyfills.
* `main.ts:24-40` hand-installs a `style-loader`/`css-loader` webpack rule scoped by `include:` to `packages/html-js` and `packages/tokens`, with a comment that Angular component CSS must not pass through it.

So retiring the `@spec-kitty/angular` *package* does not retire Angular: it remains the build system for the documentation and QA surface. The open question was whether Lit elements could be storied under that existing webpack builder, or whether the builder itself had to move — and, if it moved, whether the 13 string-returning `html-js` story files would survive.

## Decision Drivers

* The operator's direction: a plain web-components Storybook first; React and Angular Storybook integrations arrive later, once wrapper packages exist to demonstrate.
* Story authoring cost dominates. Thirteen story files rewritten by hand is a different mission size than a configuration change.
* The visual-regression baselines are keyed to story ids; 4 of the 7 carry `-angular-` in their names and die with the Angular stories regardless of renderer choice.
* NFR-003 caps the Storybook build at three minutes.

## Considered Options

* **Option A**: Keep `@storybook/angular` and story Lit elements through it as side-effect imports.
* **Option B**: Move to `@storybook/web-components-vite`, delete the Angular story files, keep the html-js stories.
* **Option C**: Move to `@storybook/web-components` on the *webpack* builder, preserving the existing pipeline.

## Decision Outcome

**Chosen option: Option B.**

### This was measured, not predicted

A throwaway spike config (`@storybook/web-components-vite` 10.x, installed with `--no-save`) was pointed at the **real, unmodified** `packages/html-js/src/card/sk-card-html.stories.ts` — including its `import './sk-card.css'` and its `import type { Meta, StoryObj } from '@storybook/html'`:

* **Build succeeded**, 1m17s for the single story file.
* **All six string-returning story exports rendered unmodified**, verified by dumping the render root's `innerHTML` for each over HTTP.
* The mechanism is explicit in the renderer: `renderToCanvas` handles three shapes — a lit `TemplateResult` rendered into `#root-inner`, **`typeof element === "string"` assigned to `canvasElement.innerHTML`**, and a `Node` appended. Strings are first-class, exactly as under `@storybook/html`.

**Therefore the 13 html-js story files need no rewrite.** That is the finding that sizes the migration mission.

The spike also surfaced two genuine `color-contrast` violations, on `BlogCardExample` and `LightMode`. They are pre-existing component defects, not migration artifacts; whether the current pipeline reports them is worth checking separately.

### The migration carries one mandatory repair

A Vite build emits `<script type="module">`, and module scripts are CORS-blocked over `file://`. `scripts/run-axe-storybook.js` navigates to `file://${STORYBOOK_DIR}/iframe.html`. Run against the spike build, **all six stories failed to render** — and before the SP-1 repair landed, that same state reported `✅ Zero WCAG 2.1 AA violations across all 6 story/stories` and exited 0.

The accessibility gate must therefore serve the built Storybook over HTTP. This is not optional and it is not a follow-up: without it, the builder migration silently converts the a11y gate into a no-op that always passes.

### Blast radius (verified counts)

| Item | Count |
|---|---|
| html-js story files needing changes | **0** |
| Angular story files deleted | 10 |
| Angular-only infra deleted | `angular.json`, `packages/angular/ng-package.json` |
| devDependencies removed (`@angular/*`, `ng-packagr`, `zone.js`, `@nx/angular`, `@storybook/angular`) | 16 |
| Workflows hardcoding `projects=tokens,angular,html-js` | 3 (`release`, `storybook-deploy`, `pr-preview`) |
| Visual baselines retired with the Angular stories | 4 of 7 |
| The `webpackFinal` CSS rule | replaced by Vite's native CSS handling |

### Consequences

#### Positive

* Angular leaves the repository entirely — package, builder, CLI project and polyfills — rather than surviving as the catalogue's build system.
* Story authoring cost is zero for the existing catalogue.
* Vite's native CSS handling removes the hand-written `style-loader` rule and its `include:` scoping, which existed to keep two frameworks' CSS apart.
* One renderer means one story per component, which is what ADR-6 wanted and never achieved.

#### Negative

* Four visual baselines are retired and the remaining three should be re-shot rather than assumed stable: the string path adds no wrapper element, but Vite and webpack may differ on CSS injection order.
* The accessibility runner must gain an HTTP server, adding a moving part to a gate that currently needs none.
* `import type { Meta, StoryObj } from '@storybook/html'` in the story files is now the wrong type source. It builds — type-only imports are erased — but it should be corrected to `@storybook/web-components` for honesty.

#### Neutral

* Wrapper Storybook integrations (React, and Angular if a consumer appears) are deferred until the wrapper packages exist, per the operator's direction.
* The spike installed nothing permanently; `package.json` and the lockfile are unchanged.

### Confirmation

1. The full catalogue builds under `@storybook/web-components-vite` inside NFR-003's three minutes.
2. Every remaining story renders, proven by the repaired accessibility gate rather than asserted — and that gate serves over HTTP.
3. `LightMode` variants still render correctly with `data-theme="light"` reaching the component through inherited custom properties.
4. No `@angular/*`, `zone.js`, `ng-packagr` or `@storybook/angular` entry remains in `package.json`.

## More Information

* Supersedes ADR-6 (Storybook multi-framework rendering). ADR-6's confirmation clause — "the WP04 reviewer must note in the PR which option was implemented" — was never written back, and what shipped was neither of its options cleanly: one framework with a webpack shim.
* Related: ADR-8 (base layer; its Storybook consequence is corrected in-place), ADR-11 (verification stack; the HTTP-serving repair belongs to the same gate).
* Evidence: `apps/storybook/.storybook/main.ts:15` and `:24-40`; `angular.json`; `@storybook/web-components` `renderToCanvas`; spike build log; `apps/storybook/src/tests/visual.spec.ts-snapshots/` (7 files, 4 Angular-keyed).
