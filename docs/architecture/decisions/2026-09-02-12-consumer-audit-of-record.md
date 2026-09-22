# ADR 12 (2026-09-02): Consumer Audit of Record, and Diagram Corrections

**Date:** 2026-09-02
**Status:** Proposed
**Deciders:** MOES-Media (operator session, 2026-09-02)
**Technical Story:** ADR-8's decision rests on who consumes this design system; the C4 L1 diagram asserts a consumer that does not exist

---

## Context and Problem Statement

ADR-8's reasoning depends on a factual claim: that no consumer of this design system is Angular. That claim contradicts `docs/architecture/assets/c4-l1-system-context.mmd`, which draws an "Angular Developer (SK dashboard · custom apps)" persona and an edge from `spec-kitty dashboard #650` to npm labelled `@spec-kitty/tokens` and `@spec-kitty/angular`.

The diagram is wrong. It was written as a target state and reads as a statement of fact, and it already misled one design pass into planning around an Angular dashboard that does not exist. This ADR fixes the diagram and records the audit so the next reader inherits evidence rather than intention.

## Decision Outcome

### The audit, as of 2026-09-02

| Consumer | Actual stack | Consumes the design system by |
|---|---|---|
| SK dashboard (`spec-kitty`, #650) | Python `http.server`, two HTML templates, one 1,623-line vanilla `dashboard.js`, `dashboard.css`. **No build step, no ES modules, no bundler.** `marked` from jsDelivr with an SRI hash is its only external resource. No CSP. Zero `--sk-*` tokens today. | nothing yet |
| kitty-desktop | Tauri 2 + Svelte 5.57 (runes) + Vite 8. Offline by design, enforced four ways including a namespaced `unshare -r -n` build-and-boot proof. CSP `default-src 'self'` with no `style-src`. | vendoring `tokens.css` as a documented mirror of commit `cdde80a`, with a committed deviations patch and `check-token-mirror.sh` |
| Team Kitty SaaS — shipped UI | Django templates + HTMX + Alpine, Tailwind v4 / DaisyUI. 26 Vite entry points. Vue 3.5 is also in the bundle graph with a live entry. | a hand-copied `spec-kitty-tokens.css` bridge, last synced 2026-05-19 |
| Team Kitty SaaS — design surface | React 19.2 + `@storybook/react-vite`. Components under `assets/javascript/design-system/`, rendered only by that repo's Storybook — not a Vite entry, imported by nothing outside `stories/`. | re-implementing components by hand |
| Docsite (#648) | Jekyll or Hugo, not yet built | nothing yet |

Three conclusions follow, and each is load-bearing for ADR-8:

1. **No consumer is Angular.** `@spec-kitty/angular` is the only framework package that exists and it has no user.
2. **The majority cannot use a framework package at all** — a bundler-free page and a static site generator can consume CSS or a standards-based element, and nothing else.
3. **Nothing is installed anywhere.** All package names 404 on npm; tag `v1.0.0`'s Publish Release run failed on 2026-09-01 with `404 PUT .../@spec-kitty%2ftokens` because the scope is unowned. Every "consumer" above consumes by copying, because copying is the only mechanism available to them.

### Diagram corrections required

* `c4-l1-system-context.mmd` — remove the "Angular Developer" persona; correct the `sk_repo` edge label; add the vanilla, Svelte, Django and SSG consumers.
* `c4-l2-package-topology.mmd` and `package-dependency-graph.mmd` — add the `styles` and `elements` layers per ADR-8; ADR-2 embeds the latter directly.

### The drift check cannot currently deliver those corrections reproducibly

Recorded here because it blocks the work this ADR mandates. Running `render-diagrams.js --check` locally reports **normalized drift on all 8 of 8 committed SVGs**, with no `.mmd` modified and `@mermaid-js/mermaid-cli` pinned at 11.16.0. The variable is the browser build: `puppeteer-config.json` pins `executablePath` to `/usr/bin/chromium`, CI installs that via `apt-get`, and a different Chromium renders text metrics differently.

Two consequences: editing one diagram produces an eight-file diff, and CI may itself drift when the runner image updates. The mission that performs these corrections must either pin the rendering environment (a container image, or a pinned Chromium download) or accept and review a full re-render. `PUPPETEER_EXECUTABLE_PATH` is now honoured so the check is at least runnable locally.

### Consequences

**Positive** — the diagrams stop asserting an intention as a fact, and ADR-8's central claim becomes checkable against a dated table.

**Negative** — the diagram corrections are coupled to an unresolved reproducibility problem, so they cost more than an `.mmd` edit.

**Neutral** — the audit is a snapshot. It should be re-run before any mission that depends on a consumer's stack, and the SaaS design surface in particular is actively developed.

### Confirmation

1. No diagram in `docs/architecture/assets/` names an Angular consumer of the dashboard.
2. `render-diagrams:check` passes in CI after the corrections, from a pinned rendering environment.
3. ADR-8's "no consumer is Angular" claim cites this ADR rather than restating the evidence.

## More Information

* Related: ADR-8 (whose Storybook consequence was corrected after this audit), ADR-13 (builder), ADR-2 (embeds `package-dependency-graph.mmd`).
* Evidence gathered 2026-09-02 from working checkouts of `spec-kitty`, `kitty-desktop` and `spec-kitty/EXPERIMENTAL-spec-kitty-saas`, plus the GitHub API for `Priivacy-ai/spec-kitty-saas` and both design repositories.
