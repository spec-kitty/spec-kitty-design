---
work_package_id: WP03
title: CSS pipeline — adopt styles' .css as a constructed stylesheet
dependencies:
- WP01
requirement_refs:
- FR-002
- FR-009
- NFR-004
planning_base_branch: mission/elements-package-foundation
merge_target_branch: mission/elements-package-foundation
branch_strategy: Planning artifacts for this mission were generated on mission/elements-package-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-package-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T008
- T009
- T010
phase: Phase 3 - CSS
history:
- timestamp: '2026-09-03T00:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/stub/
create_intent:
- scripts/build-elements-css.mjs
- packages/elements/src/stub/**
execution_mode: code_change
owned_files:
- scripts/build-elements-css.mjs
- packages/elements/src/stub/**
tags: []
tracker_refs: []
---

# Work Package Prompt: WP03 – CSS pipeline

Implements IC-02.

## The output location is forced, not a preference

The generated module is **committed under `packages/elements/src/`**, not emitted to `dist/`. Two measured reasons:

1. **Vite's *default* CSS import cannot do it — but `?inline` can.** The bare `import './x.css'` fails exactly as reported (`"default" is not exported by src/sk-stub.css`), **but `import cssText from './sk-stub.css?inline'` builds cleanly** and emits the constructed sheet. An earlier draft of this WP asserted a blanket impossibility, under a "do not re-investigate" banner; a pre-merge lens falsified it and I reproduced the falsification. The real reason to pre-generate is narrower: `?inline` is **Vite-specific syntax**, and the same source must also feed the esbuild ESM/IIFE build, which does not understand it. Pre-generation avoids a bundler-specific specifier in `packages/elements/src`.
2. `dist/` is gitignored (`.gitignore:5-6`), so emitting there means a fresh CI clone has no CSS and `storybook-build` fails.

Committing it also **dissolves FR-009's exclusion problem**: scoping the no-CSS-in-TS check to `packages/elements/**/*.ts` excludes the generated `.js` by construction, rather than by an exception list that would be either vacuous or a guaranteed false positive.

## Subtasks

- **T008** — `scripts/build-elements-css.mjs`: read `packages/styles/src/stub/sk-stub.css` (the **source of record**, ADR-8 constraint 1) and emit `packages/elements/src/stub/sk-stub.css.js` constructing a `CSSStyleSheet` via `replaceSync`. Commit the output; add a regeneration check (ADR-10's generated-artifact contract).
- **T009** — `sk-stub.ts` sets `static styles = [sheet]`.
- **T010** — FR-009's check **script** (WP02 owns the `ci-quality.yml` step that runs it; hand it over rather than editing that file): no CSS text in hand-authored source under `packages/elements/**/*.{ts,js,mjs}` minus the generated-module allowlist. **Scope it wider than `*.ts`**: ADR-10 confirmation #4 says "no `.css` content appears inside **any** `.ts` source file", and a `*.ts`-only scope is itself the evasion route — hand-authored `.js`/`.mjs` escapes it. Enumerate the forbidden constructs: ``css` `` tagged template, `unsafeCSS('…')`, an inline `new CSSStyleSheet()` + `replaceSync('…')`, and `import './x.css'`. Red-first test required. Nothing catches this today — stylelint globs only `*.css` and no eslint rule inspects template literals, while `static styles = css\`…\`` is Lit's default idiom.

## Definition of Done

- [x] The element adopts CSS read from `packages/styles`; **zero `.css` files exist under `packages/elements/**`**, and the generated module's text is byte-identical to `packages/styles/src/stub/sk-stub.css`. (A name-literal "exactly one sk-stub.css" check is fakeable by copying it as `sk-stub.styles.css`.) Copying it into `packages/elements` would pass a naive grep *and* stylelint while violating ADR-8.
- [x] ADR-10 Confirmation #1's two literal assertions hold: **`adoptedStyleSheets.length === 1`** and **`shadowRoot.querySelectorAll('style').length === 0`**. Assert them on the element **in Storybook** here; the same pair is re-asserted against both built artifacts in WP04, which is where the artifacts exist.
      *Corrected mechanism:* an earlier draft claimed esbuild's CSS loader "injects a `<style>` tag". It does not — it emits a **sidecar `.css` file** and leaves the JS nearly empty. The real hazard is the opposite shape: a document-level sidecar never reaches the shadow root, so `adoptedStyleSheets.length` would be **0**, not 1. The assertion pair is still the right check; only the stated failure mode was wrong.
- [x] FR-009's check is CI-enforced and demonstrated red-first.
- [x] The generated module is committed and a regeneration check fails when it drifts.

## Notes

**Settled — do not re-investigate.** A squad ran this end to end: a generated `CSSStyleSheet` adopted by a Lit element loaded as an IIFE from `file://` gave `adoptedStyleSheets: 1`, `<style>` count `0`, and every `--sk-*` token resolved through the shadow boundary. The worry that `.sk-stub`'s light-DOM class selectors would not match inside a shadow root was unfounded — the element's own template re-emits that markup, so nothing has to match from outside.

**#105 / C-006 — you are adding a third authoring site.** `packages/styles/src/stub/` already ships `sk-stub.html` **and** a `SkStubHTML` template literal (re-exported from `packages/styles/src/index.ts`). This element's `render()` makes three. ADR-10 §3 requires the static `.html` to become generated output, and #79 closes with a repository-wide "no component markup is authored twice" assertion that will trip on it. This mission does **not** migrate it (C-003) — but author `sk-stub.ts` knowing that, and do not quietly diverge the three copies.

**The element and its story are authored here.** `sk-stub.ts` (tag, template, registration via WP02's `define.ts`) and the one permitted story `sk-stub.stories.ts` — including the `LightMode` variant `CLAUDE.md` §3 requires of every story — are this WP's, not WP01's. WP01's fixtures are throwaway; this is the real one.
