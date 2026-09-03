# ADR 10 (2026-09-02): Distribution, Build Artifacts, and Canonical Markup

**Date:** 2026-09-02
**Status:** Accepted (ratified by the operator, 2026-09-02)
**Deciders:** MOES-Media (operator session, 2026-09-02); the canonical-markup ruling in §3 was ratified by the operator on 2026-09-02
**Technical Story:** ADR-8 constraints 1 and 2; SP-3, run before this record was written

---

## Context and Problem Statement

ADR-8 says component CSS is authored once as real `.css` files and adopted into shadow roots, and that `@spec-kitty/elements` ships both a bundler build and a self-contained browser build. Neither had been demonstrated through this repo's toolchain, and one of ADR-8's own confirmation criteria was unachievable as written:

> **Criterion 3** — "No component markup and no component CSS exists twice anywhere in this repository."

Markup currently exists up to four times per component: the reference `.html`, the template-literal export in `index.ts` (the package exports roughly 40 HTML *string* constants — it is a string catalogue, not a component API), the Angular template, and the story `render:` string. Worse, the architecture *requires* one of those copies: `@spec-kitty/styles` ships static HTML precisely so Django, Jekyll and Hugo consumers can render without JavaScript. Criterion 3 and the styles layer contradict each other until someone rules.

## Decision Drivers

* The SK dashboard has no bundler, no module scripts, and no `mimetypes.add_type()` registration — a `.mjs` would be served as `application/octet-stream` and rejected.
* kitty-desktop prohibits runtime CDN fetches and its CSP has no `style-src`, so an injected `<style>` element is blocked outright.
* SK-D01's stylelint gate globs `.css` files. CSS inlined into TypeScript template literals leaves that gate's reach.
* CSS import attributes (`import s from './x.css' with { type: 'css' }`) are Baseline *limited* with no Safari support at all — they cannot appear in shipped code.

## Decision Outcome

### 1. CSS is authored as `.css` and converted to a constructed stylesheet at build time

A build step reads the linted `.css` and emits a module that constructs a `CSSStyleSheet` from its text. The element sets `static styles = [sheet]`, which Lit accepts directly.

**Proven in SP-3** against the real, unmodified `packages/html-js/src/card/sk-card.css`, loaded in Chromium and Firefox:

| Assertion | Result |
|---|---|
| element upgraded from a classic script over `file://` | `true` |
| `shadowRoot.adoptedStyleSheets.length` | `1` |
| `shadowRoot.querySelectorAll('style').length` | **`0`** |
| computed `background` inside the shadow root | `rgb(24, 26, 31)` = `--sk-surface-card` |
| computed `border-radius` / `padding` | `16px` / `32px` = `--sk-radius-lg` / `--sk-space-7` |
| page errors | none |

Three ADR-8 claims are confirmed by that table: the CSS reaches the shadow root, `--sk-*` tokens pierce the boundary so the token architecture survives untouched, and **no `<style>` element is injected**, which is what kitty-desktop's CSP requires.

### 2. Two build artifacts, both first-class

* **`dist/index.js`** — ESM with `lit` left as a bare specifier, for bundler consumers. Measured at 3.2 KB for one component in the spike.
* **`dist/elements.js`** — a self-contained classic script (IIFE), no bare specifiers, no module semantics, loadable from `file://` and from a CDN with an integrity hash. Measured at 26 KB for one component including the Lit runtime.

The classic-script format is not a preference. `file://` plus `type="module"` is CORS-blocked, and the dashboard cannot register a `.mjs` MIME type — so the module build would be unusable by the design system's own primary consumer.

### 3. Canonical markup: the element's template is the sole authored source

**Ratified 2026-09-02.** The static `.html` that `@spec-kitty/styles` ships becomes **build output generated from the element**, marked as generated and never hand-edited.

This satisfies criterion 3 honestly — authored markup exists exactly once — while keeping the real HTML that the server-rendered consumers need. The alternatives were considered and are worse: declaring the `.html` canonical means hand-syncing it against the element forever, which is the drift this programme exists to end; and dropping static markup entirely strands the docsite, the marketing pages, the slidedecks and the Django UI, who are the majority of named consumers.

Criterion 3 is therefore restated as: **no component markup is *authored* twice.** Generated artifacts are exempt, and are required to be regenerable — CI fails if a committed generated file differs from a fresh render, the same contract the wrapper drift check uses.

### 4. Declarative Shadow DOM is deferred

The docsite consumes `@spec-kitty/styles` only. DSD reached Baseline *widely available* on 2026-08-20 — thirteen days before this ADR — and buys exactly one thing over the CSS layer: shadow-encapsulated markup rendered before JavaScript. For a static site whose components are presentational, the CSS layer produces identical output with no runtime and no build integration. Emitting DSD from Jekyll or Hugo would mean either pulling `@lit-labs/ssr` into a Ruby or Go pipeline, or hand-authoring `<template shadowrootmode>`, which reintroduces exactly the markup duplication ruled out above.

**This is a revisitable assumption, not a permanent position.** It flips the moment the docsite needs an interactive component that must be correct before hydration.

### 5. Registry safety

`customElements.define` is global and throws on a duplicate tag, while ADR-2 deliberately allows independent per-package versioning. Two majors of `@spec-kitty/elements` on one page is a hard runtime failure. Every definition goes through a guarded helper that warns and no-ops instead of throwing, and consumers are given a documented single-version policy. Versioned tag names remain a last resort — they would ruin the public API.

### Consequences

#### Positive

* One authored source for CSS and one for markup, with every other form derived and checkable.
* SK-D01's existing stylelint gate keeps working unmodified, because CSS never enters TypeScript.
* The no-build consumer is served by design rather than by exception.

#### Negative

* A generated-artifact regeneration check is new CI surface, and generated files in the tree invite hand-editing that the check must catch.
* The self-contained bundle carries the Lit runtime, so a page using one component pays for the whole runtime; acceptable for the dashboard, worth measuring before it becomes the default recommendation.
* Static HTML generated from a Lit template must be stripped of Lit's marker comments; the generator needs a test asserting the output is clean.

#### Neutral

* WebKit remains unverified locally. Constructed stylesheets and form-associated custom elements are both Baseline *widely available* with Safari 16.4, and Chromium and Firefox agree exactly in the spike — but Playwright's WebKit could not launch on this host (missing system libraries, Debian package names on a Fedora machine). The residual risk is specifically kitty-desktop's WebKitGTK inside Tauri, which Playwright's WebKit only proxies anyway; that verification belongs in that repo, against its own `check-offline.sh` harness.

### Confirmation

1. `sk-card` renders identically from the ESM build in a bundler app and from the classic-script build in a bundler-free `file://` page, with `adoptedStyleSheets.length === 1` and zero `<style>` elements in both.
   **✅ Confirmed by #72**, asserted in `apps/storybook/src/tests/elements-load.spec.ts`
   (`[ADR-10 C#1]`) and re-derived on every CI run — both builds upgrade, both report
   `adoptedStyleSheets.length === 1` and zero `<style>`, and both render the same shadow
   tree, `<div part="card" class="sk-card sk-card--blue"><slot>`, compared as markup with
   Lit's marker comments stripped.
   Recorded here rather than in a PR body: #72 first claimed this confirmation in prose while
   `sk-card` appeared in that spec zero times, and three pre-merge lenses caught it. The
   first attempt to close that then compared shadow `textContent`, which is empty for a
   root whose only text sits behind a `<slot>` — it asserted `'' === ''`. Pass 2 measured
   it. "Renders identically" is worth recording only if the compared value can differ.
2. The generated static `.html` for a component regenerates byte-identically in CI, and contains no Lit marker comments.
   **✅ Confirmed by #72** — `scripts/build-element-markup.mjs --check`, enforced in
   `lint-code`. Note the generated file is NOT byte-identical to the hand-authored one it
   replaced: `<slot>Card content</slot>` became `Card content`. A `<slot>` is inert in light
   DOM, so this is an intentional correction rather than a loss, and it is recorded because
   #72's PR body first offered byte-identity as evidence that nothing changed.
3. A second `define` of the same tag warns and no-ops rather than throwing.
4. No `.css` content appears inside any `.ts` source file in `packages/elements`.

## More Information

* Evidence: SP-3 (build step, both artifacts, Chromium and Firefox probes), Lit `css-tag.js` (`static styles` accepts a raw `CSSStyleSheet`; falls back to injecting a `<style>` element when adoption is unavailable — the fallback kitty-desktop's CSP would block).
* Related: ADR-8 (base layer; restates criterion 3), ADR-9 (styling API), ADR-11 (verification), ADR-2 (independent versioning, which creates the registry hazard).
