# ADR 8 (2026-09-02): Custom Elements as the Shared Component Base Layer

**Date:** 2026-09-02
**Status:** Accepted (ratified by the operator, 2026-09-02)
**Deciders:** MOES-Media (operator session, 2026-09-02)
**Technical Story:** Multi-framework consumption of the design system; amends ADR-2 (monorepo package topology); closes the schema gap raised in `research/001-design-system-architectural-evaluation.md` §3.1 / line 163

---

## Context and Problem Statement

The design system publishes one framework target (`@spec-kitty/angular`) and one framework-free target (`@spec-kitty/html-js`). Supporting a second framework today means re-implementing every component a second time, because the two existing packages already re-implement each other: `packages/angular/src/lib/<name>/*.html` carries its own copy of the markup in `packages/html-js/src/<name>/index.ts`, and `packages/angular/src/lib/button/sk-button-primary.component.css:2` records the duplication in a comment — *"Shared sk-btn rules inlined from @spec-kitty/html-js — sk-button.css"*.

That cost is already being paid a third time outside this repository. A consumer audit on 2026-09-02 found:

| Consumer | Stack | Consumes the design system by |
|---|---|---|
| SK dashboard (`spec-kitty`, issue #650) | Python HTTP server, two HTML templates, one 1,623-line vanilla `dashboard.js`. **No build step.** | nothing yet |
| kitty-desktop | Tauri 2 + Svelte 5.57 + Vite 8. **Offline by design — runtime CDN fetches prohibited.** | vendoring `tokens.css` as a documented mirror at commit `cdde80a`, with a committed deviations patch and a `check-token-mirror.sh` |
| Team Kitty SaaS (shipped UI) | Django templates + HTMX + Alpine, Tailwind/DaisyUI | nothing yet |
| Team Kitty SaaS (design surface) | React 19.2 + Storybook | re-implementing components by hand: 33 `.tsx` in `Priivacy-ai/spec-kitty-saas`, 22 in `spec-kitty/EXPERIMENTAL-spec-kitty-saas` |
| Docsite (issue #648) | Jekyll / Hugo, not yet built | nothing yet |

Two conclusions follow. First, **no consumer is Angular** — the only framework package we ship has no user, and the C4 L1 context diagram's "Angular Developer (SK dashboard · custom apps)" persona describes an intention as a fact. Second, **the majority of consumers cannot use a framework package at all**: a page with no bundler and a static site generator can consume CSS, or they can consume a standards-based element, but they can never `npm install` an Angular library.

The question this ADR settles: what is the single implementation every target derives from, so that adding the next framework is additive rather than another full re-implementation?

## Decision Drivers

* ADR-2's third decision driver — "adding a new framework target (Vue, Svelte, React) should not require restructuring existing packages" — is not satisfied today; a new target means re-writing every component.
* The charter permits "additive framework ports (e.g. Vue, Svelte) … as sub-packages without a major bump". That is only true if a port is a thin derivation of something shared.
* The largest consumer by page count has no build step and can only load standards HTML, CSS and a browser-ready module.
* One consumer (kitty-desktop) is offline by design; nothing may depend on a runtime CDN fetch.
* Component behaviour today is one 12-line function (`skToggleDrawer`). Behaviour will grow — forms, focus management, disclosure — and growth must not multiply across targets.
* `research/001` §163: the specification "does not define what a valid framework target package looks like as a schema". Whatever is chosen must produce that schema.

## Considered Options

* **Option A**: Status quo — hand-written per-framework packages, each owning its own markup and CSS.
* **Option B**: Custom elements (Lit) as the shared base; framework packages become thin wrappers generated from a Custom Elements Manifest.
* **Option C**: Stencil as a compiler, using its built-in React/Angular/Vue/Svelte output targets.
* **Option D**: CSS-and-markup only — publish tokens plus a CSS layer, and let every consumer compose its own components.

## Decision Outcome

**Chosen option: Option B — custom elements as the shared base layer, with generated wrappers.**

The package graph gains a second foundational layer. `@spec-kitty/tokens` remains the root and is unchanged:

```
@spec-kitty/tokens          (unchanged; no dependencies)
        ↑
@spec-kitty/styles          (re-scoped from html-js: one sk-<name>.css per component + static HTML)
        ↑
@spec-kitty/elements        (Lit custom elements; adopts the same .css files into shadow roots;
                             emits custom-elements.json)
        ↑
   ├── consumed directly by vanilla, Svelte, Vue, Solid, Django, SSG   ← primary path
   └── @spec-kitty/react, @spec-kitty/angular   (generated wrappers, published on demand)
```

Four constraints are part of this decision, not implementation detail:

1. **Component CSS is authored once, as real `.css` files** in `@spec-kitty/styles`, and adopted by the element as a constructable stylesheet. It is never inlined into TypeScript template literals. This is what lets server-rendered consumers keep using plain CSS, and what keeps the existing `stylelint-declaration-strict-value` gate (hard rule 1) working unmodified.
2. **`@spec-kitty/elements` ships two builds**: bare-specifier ESM for bundler consumers, and a self-contained browser bundle that works both from a CDN with an integrity hash and from a local file, because kitty-desktop takes no runtime CDN.
3. **A framework wrapper is published only when a consumer exists.** Frameworks with native custom-element support (Svelte, Vue, Solid, vanilla) get no package at all — they get the manifest, which is enough for editor completion and type checking.
4. **React leads.** Operator decision, 2026-09-02: React has the one identified consumer waiting, so its wrapper is generated first; Angular keeps a generator but loses its hand-maintained package.

### Amendment to ADR-2

ADR-2 states the dependency graph as `tokens ← angular`, `tokens ← html-js`, and rules that "no framework package may depend on another framework package". Under this decision `@spec-kitty/angular` and `@spec-kitty/react` depend on `@spec-kitty/elements`.

The rule is **narrowed, not repealed**: no framework package may depend on *another framework package*. `@spec-kitty/elements` is not a framework target — it is a platform layer with no framework dependency, in the same structural position as `@spec-kitty/tokens`. ADR-2's three confirmation criteria all still hold, and the third ("a new framework package can be added to `packages/` with no changes to existing package files") becomes materially easier to demonstrate, because a new target is a generator template rather than a hand-written package.

### Consequences

#### Positive

* Markup and behaviour exist once. Adding a framework becomes O(1) in components rather than O(components).
* The consumers that cannot use any framework package — the dashboard, the docsite, the Django UI — gain access to real interactive components for the first time, without acquiring a build step.
* `--sk-*` custom properties inherit through shadow boundaries, so the token layer survives untouched and becomes the primary styling API rather than one of two.
* The Custom Elements Manifest gives editor completion and type checking to the zero-wrapper consumers, so "no package" does not mean "no tooling".
* Nothing has been published yet (see Confirmation), so this reorganisation breaks no installs and consumes none of the charter's one-major compatibility window.

#### Negative

* Shadow DOM ends class-based overriding of component internals. A styling API — `::part()` plus per-component custom properties — must be designed and documented deliberately (ADR-9), and the `sk-*` BEM class names become internal to the elements.
* Form controls need `formAssociated` and `ElementInternals` to participate in native forms, and cross-root labelling is a genuine platform gap that must be resolved per component with axe-core as the judge.
* A Lit runtime (~6 KB, shared across all components) enters the dependency graph, where today the framework-free package has none.
* The custom element registry is global and `customElements.define` throws on a duplicate tag, which interacts badly with ADR-2's independent per-package versioning. Two majors of `@spec-kitty/elements` on one page is a hard runtime failure; a guarded define and a documented single-version policy are required.

#### Neutral

* `@spec-kitty/html-js` is re-scoped and renamed rather than deleted; its CSS becomes the shared source for both consumption paths.
* The rename is a cross-repository change: `docs/design-qa/design-authority.json` in the SaaS repo lists `packages/html-js/src/index.ts` in `required_files`, and `scripts/design/resolve-design-repo.mjs` hard-fails when that path disappears. It is *not* a release blocker — that repo has no GitHub Actions workflows on `main`, so the guardrail is a `make` target and a PR-template checkbox, not an enforced gate. A paired PR is correctness hygiene, not a synchronised release.

#### Corrected after review (2026-09-02)

Two claims in this ADR's first draft were wrong and are recorded here rather than silently edited, because both changed the mission sequencing downstream:

* **Storybook is not simplified by retiring `packages/angular`.** The first draft claimed Storybook "renders one implementation instead of two, which simplifies rather than complicates the ADR-6 arrangement". In fact `apps/storybook/.storybook/main.ts:15` configures a single framework — `@storybook/angular` — and the whole Storybook is an Angular CLI application in `angular.json`, built through `@storybook/angular:build-storybook` with a hand-written webpack CSS rule scoped to `packages/html-js` and `packages/tokens`. Retiring the Angular *package* does not retire Angular; choosing the elements-era builder is a prerequisite spike with its own blast radius (`angular.json`, `zone.js`, 15 story files, and 4 of the 7 visual-regression baselines, which are keyed to Angular story ids). ADR-13 owns that decision.
* **The SaaS guardrail is not CI-enforced.** See the corrected bullet above.

### Confirmation

This decision is validated when:

1. One component ships from a single CSS source and a single manifest into three consumption paths — a bundler-free HTML page, a Svelte application, and Storybook — with no wrapper package in existence.
2. A generated React wrapper of that same component passes the framework-target conformance matrix (ADR-11) without hand editing, and CI fails if the generated output drifts from the manifest.
3. No component markup and no component CSS exists twice anywhere in this repository.
4. A fourth target can be added in under one day, measured and recorded rather than asserted.

**Prerequisite, not a validation criterion:** the `@spec-kitty` npm scope must exist. Tag `v1.0.0` was pushed on 2026-09-01 at 22:52 and the Publish Release workflow failed 50 seconds later with `404 Not Found - PUT https://registry.npmjs.org/@spec-kitty%2ftokens`; `npm view` confirms all three package names are unregistered. ADR-2 already recorded this as a pre-flight — *"the `@spec-kitty` npm scope must be owned and configured before any package can be published — this is a pre-flight check, not an implementation task"* — and it has not been done. Nothing in this decision can ship until it is.

## Pros and Cons of the Options

### Option A: Status quo — hand-written per-framework packages

**Pros:**
* No new runtime dependency; each package is idiomatic for its framework.
* Zero migration cost today.

**Cons:**
* Every new target re-implements the full catalogue.
* Copies drift silently — already demonstrated by the inlined button CSS and by three divergent React sets across two SaaS repositories.
* Gives nothing at all to the no-build and static consumers, which are the majority.

**Why rejected:** it is the cost this decision exists to remove, and it scales linearly with the number of frameworks.

### Option B: Custom elements (Lit) with generated wrappers

**Pros:**
* One implementation of markup and behaviour; wrappers carry no logic.
* Serves the no-build consumers directly — the only option here that does.
* Frameworks with native custom-element support need no package at all.
* Standards-shaped: the artifact is a custom element, not a framework-specific build product.

**Cons:**
* Shadow DOM styling contract, form participation and cross-root labelling all require deliberate design.
* Introduces a small shared runtime and a generator to maintain.

### Option C: Stencil

**Pros:**
* Generated React, Angular, Vue and Svelte output targets are a first-class product feature.
* Would remove the wrapper-generator maintenance burden entirely.

**Cons:**
* Adopts a compiler and its opinions; components are Stencil components before they are custom elements.
* Its headline advantage is wrapper generation, which is optional for every consumer identified in the audit — buying the capability least needed.

**Why rejected:** the cost/benefit inverts once the audit shows the shipping consumers need no wrappers. Reconsider if maintaining generators proves burdensome.

### Option D: CSS and markup only

**Pros:**
* Simplest possible distribution; no runtime, no registry, perfect server rendering.
* Exactly right for the docsite, marketing pages and slidedecks.

**Cons:**
* Cannot deliver behaviour. The dashboard would keep hand-rolling interactive markup in `dashboard.js`, and the SaaS React set would keep growing.
* Pushes composition into every consumer, which is how three divergent copies appeared in the first place.

**Why rejected:** as a *whole* answer. It is retained as a layer — `@spec-kitty/styles` — because the static consumers genuinely need it.

## More Information

* Amends: ADR-2 (monorepo package topology) — dependency graph and the framework-package dependency rule.
* Related: ADR-9 (shadow DOM and the styling API), ADR-10 (distribution and server rendering), ADR-11 (wrapper generation and the framework-target schema), ADR-12 (consumer audit of record and C4 correction).
* Research: `research/001-design-system-architectural-evaluation.md` §3.1 and line 163.
* Charter: additive framework ports; one-major compatibility window; the testing standard requires amendment before elements carrying behaviour can be verified — a screenshot and an axe scan cannot see a broken `setFormValue`.
* Prior art for the Angular wrapper shape: a component whose selector is the element's tag name and whose template is `<ng-content>`, with a `ControlValueAccessor` for form-associated elements.
