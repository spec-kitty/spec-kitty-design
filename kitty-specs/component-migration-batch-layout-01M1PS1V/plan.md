# Implementation Plan: component-migration-batch-layout

**Mission**: `component-migration-batch-layout-01M1PS1V` · issue #77 (M11), part of epic #66
**Branch**: `mission/component-migration-batch-layout` (single_branch)
**Squad tier**: C — pre-merge only, four lenses

## Summary

Migrate `site-footer` to a custom element. It is the last component in the catalogue apart from
`form-field` (#141). `grid` and `section-banner`, the other two the issue names, merged in #134.

## Technical Context

**Language/Version**: TypeScript 5.9, target ES2022
**Primary Dependencies**: Lit 3, esbuild 0.28.1, nx 22, postcss
**Testing**: vitest 4.1 browser mode — chromium locally, chromium + webkit in CI; plus Playwright
for the distribution artifacts and axe-core for WCAG
**Target Platform**: browsers with constructed stylesheets and open shadow roots; also a
no-JavaScript consumer copying the generated static HTML
**Project Type**: monorepo — four packages (tokens, styles, elements, react), the last generated
**Performance Goals**: no per-component budget; the IIFE's min+gzip is tracked in SIZES.md and is
12.6 KiB today, against ADR-8's ~6 KB aspiration for the runtime
**Constraints**: 18 static gates, an axe pass over every story, a mutation harness that requires
each declared behaviour to go red, and shrink-only ratchets
**Scale/Scope**: one component; the last in the catalogue apart from form-field (#141)

The pattern is settled by five preceding migrations, so this is a known shape rather than a design
exercise. What is *not* settled is content ownership: this component's markup is more
site-specific than any migrated so far, which is what the #77 content-as-property ruling exists
for.

**Prior art to copy, and the exact traps each one paid for:**

- `sk-blog-card` (#78) — the element must render its class list **from the markup module**, not
  from re-typed literals. It is the only component that names every per-node class in one place,
  and it got there by shipping the defect first.
- `sk-pill-tag` / `sk-check-bullet` (#79) — retiring an inert `data-theme` wrapper exposes real
  contrast failures. Budget for fixes.
- `sk-nav-pill` (#73) — `::slotted()` reaches only directly assigned children, and a state
  pseudo-class must sit **inside** it.

## Charter Check

- ADR-8 criterion 3 — no component markup authored twice. Enforced here by rendering from the
  markup module; the measure itself is a proxy that has been wrong twice (#142).
- ADR-9 — open shadow root, `::part()` as the escape hatch, no rule reaching outside the root.
- ADR-10 §2/§3/§5 — both distribution entries, generated static form, guarded `define()`.
- ADR-11 item 9 — generation determinism. **This mission's sharpest constraint**: see IC-01.

## Project Structure

### Documentation (this mission)

```
kitty-specs/component-migration-batch-layout-01M1PS1V/
├── spec.md          ← authored
├── plan.md          ← this file
├── decisions/       ← the brand-mark question, once decided
└── tasks/
```

### Source Code (repository root)

```
packages/elements/src/site-footer/
├── sk-site-footer.ts          ← new: the element
├── sk-site-footer.markup.ts   ← new: the ONE authored markup source (leaf module)
└── sk-site-footer.css.js      ← generated
packages/styles/src/site-footer/
├── sk-site-footer.css         ← edited: rename, tokens, slotted spellings
├── sk-site-footer.html        ← becomes GENERATED
├── index.ts                   ← becomes GENERATED (currently hand-written)
└── sk-site-footer.stories.ts  ← edited: LightMode wrapper, generated exports
fixtures/elements-behaviour/src/sk-site-footer.test.ts   ← new
```

## Complexity Tracking

The only genuine complexity is IC-01. Everything else is the established migration shape.

## Implementation Concern Map

### IC-01 — The copyright year makes the generated artefact non-deterministic

`packages/styles/src/site-footer/index.ts` computes `new Date().getFullYear()` at module load.
Today that is invisible because the file is hand-written and nothing regenerates it. The moment
it becomes generated output with a drift gate, **the committed artefact stops matching a fresh
generation on 1 January** — CI goes red for everyone, with no code change, and the fix would be to
re-run the generator. That is precisely ADR-11 item 9, and this mission is the one that converts a
latent oddity into a live gate failure.

**Approach**: the year becomes a `year` property with an explicit default, and the generated forms
pin a fixed value. A consumer who wants the live year passes it; the artefact never reads a clock.
**Verified by**: SC-005 — generate twice and diff, and a test that pins the default.

### IC-02 — The class rename is a precondition, not a cleanup

`.sk-footer-link` (20 occurrences) is not prefixed with the component's tag name, so
`check-adopted-css-boundaries` rejects it the moment the sheet is adopted. The migration cannot
land without the rename, and the rename is BREAKING for copied snippets — the same shape as #139's
ruling, which is already recorded in the changelog.

**Approach**: rename to `.sk-site-footer__link` in one pass across authored surfaces, leaving
`tmp/reference_system/**` and `kitty-specs/**` untouched. **Verified by**: SC-002 plus the gate.

### IC-03 — Retiring the inert wrapper will expose contrast failures

The `LightMode` story wraps in `data-theme="light"`, which activates nothing, so its light stories
have been rendering the dark palette. Two preceding batches found real AA failures the moment that
wrapper came off.

**Approach**: switch to `class="sk-light"`, then measure every ink the component sets on both
surfaces before assuming anything passes. Fix at the component layer where possible; a shared
token change needs its own argument, as #143's did. **Verified by**: SC-003, SC-004 — including a
both-themes fixture arm that proves the two themes resolved *different* surfaces, since a light arm
silently rendering the dark palette is the failure mode that hid all of this.

### IC-04 — Content ownership

Tagline, link labels, legal text and the brand mark are all Spec Kitty's. Under the #77
content-as-property ruling the component should own layout, theming and the divider — not the
words. The brand mark additionally carries a repo-relative `src` that no consumer can resolve.

**Approach**: slot the content; decide the brand mark deliberately and record it in `decisions/`.
**Verified by**: FR-005, and a test that slotted content reaches its region.
