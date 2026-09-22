# Implementation Plan: card status tone axis

**Branch**: `mission/card-status-tone-axis` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/card-status-tone-axis-01M1VJNY/spec.md`

## Summary

Add one reflected `status` axis to the existing `sk-card`, orthogonal to `variant`, carrying
#146's six-tone vocabulary; land the `--sk-status-*` / `--sk-on-status-*` semantic token category
in both theme blocks as aliases over existing tokens; complete the `--sk-*-tint-rose` pair so
`--sk-status-danger` can be an alias rather than a literal; and prove by test — not by comment —
that an unknown status fails open, that the two axes are independent, that the tone is never the
only carrier of meaning, and that the widened union reaches the generated React wrapper.

## Technical Context

**Language/Version**: TypeScript 5.x, ESM, Lit 3.3.3, Node 22 toolchain
**Primary Dependencies**: `lit`, `@custom-elements-manifest/analyzer` 0.11.0,
`@wc-toolkit/react-wrappers` 1.2.7, Storybook 10.6 (web-components-vite), Vitest 4.1.11 browser
mode (Playwright), stylelint 16, eslint 9, nx 22
**Storage**: N/A — CSS custom properties and static artifacts on disk
**Testing**: Vitest browser mode in `fixtures/elements-behaviour`, `tsc --noEmit` type tests in
`packages/react/type-tests`, `scripts/suite-selftest.mjs` mutation harness, axe over the built
Storybook
**Target Platform**: browsers (Baseline widely available); plus the no-JavaScript static path
(`packages/styles/src/card/sk-card.html`, `index.ts`)
**Project Type**: Nx monorepo, four packages, `tokens → styles → elements → react`
**Performance Goals**: no measurable bundle growth beyond the added branch and CSS; `SIZES.md`
regenerated after a real build
**Constraints**: ADR-9 (no selector crosses the shadow boundary; parts and tokens are the styling
API), ADR-10 §3 (markup authored once; generated artifacts regenerable), ADR-11 (behaviour ids and
red-first mutations), SK-D01 (every value a `--sk-*` token)
**Scale/Scope**: one element, one authored stylesheet, one token category, one markup module, two
story files, one behaviour fixture, one type test

## Charter Check

*GATE: passes.*

| charter/repo rule | how this mission satisfies it |
|---|---|
| Tokens first (hard rule 1) | every new CSS value is `var(--sk-*)`; the only literals land in `packages/tokens/src/tokens.css`, which stylelint exempts by design |
| One-directional boundary (hard rule 2) | changes stay inside `tokens`, `styles`, `elements`; `react` is generated |
| Semantic pairing (hard rule 3) | `--sk-status-<tone>` (surface) ↔ `--sk-on-status-<tone>` (foreground), one pair per tone, both themes, same commit |
| BEM (hard rule 4) | `sk-card--status-<tone>` |
| Conventional commits (hard rule 5) | scopes used: `tokens`, `styles`, `elements`, `react`, `storybook`, and unscoped `docs:` — `docs(adr)`/`docs(specs)` are not in the enum |
| `LightMode` per story (hard rule 6) | `class="sk-light"`, never `data-theme` |
| Demo pages (hard rule 7) | untouched; no new component directory, so no `assemble-demo-dist.sh` path mapping changes |
| ADR-9 §3 | no theme selector in `sk-card.css`; the status variance is entirely in tokens |
| ADR-10 §3 | `CARD_STATUSES` is authored; `sk-card.html` and `packages/styles/src/card/index.ts` are generated |
| No new ADR | this mission writes none; the one recorded fork (the rose tint) is stated in the spec and filed as an issue |

## Design

### 1. The vocabulary seam

`sk-status-indicator.ts` already holds the ordered frozen array at `:14`. It is currently module
private. **Export it** (additively — no behavioural change to #146's element) and re-export it from
`packages/elements/src/index.ts`, so it becomes the one importable list.

Two places then spell the tones, both forced by the toolchain and both pinned:

| place | why it cannot import | what pins it |
|---|---|---|
| `CARD_STATUSES` in `sk-card.markup.ts` | the generator evaluates `*.markup.ts` from a `data:` URL; a relative import is a named generator error | a behaviour-fixture assertion that `Object.keys(CARD_STATUSES)` deep-equals the exported array, **in order** |
| the `declare status:` literal union in `sk-card.ts` | `build-vue-types.mjs` copies the manifest's type text verbatim into `vue.d.ts`, which imports nothing — an alias would emit an unresolved identifier | a compile-time mutual-assignability proof in the type test, plus the React `@ts-expect-error` |

That is "derive, don't fork" enforced mechanically at both seams, in the only shape this
toolchain admits. It is recorded rather than glossed.

### 2. The element

```ts
static properties = {
  variant: { type: String, reflect: true },
  inset:   { type: Boolean, reflect: true },
  status:  { type: String, reflect: true },   // new, reflected, orthogonal
};
```

`render()` passes `this.status` to `cardClasses`. `variant` and `inset` are untouched.

### 3. The markup module (the extension point)

`CARD_STATUSES` sits beside `CARD_VARIANTS` as a sibling map. `cardClasses` gains a third
parameter with the **same** fail-open policy — `Object.hasOwn`, warn, drop to the base card, never
throw — and `cardStaticHtml` gains a `status` option with the **same** throwing policy, for the
same recorded reason. `CARD_AXES` gains one entry per tone, derived from `CARD_STATUSES` rather
than typed out, so `build-element-markup.mjs` emits `SkCardStatusNeutralHTML` … and the barrel
regenerates.

`sk-card.html` holds only the base form (the generator emits `call({}, 'the base form')` for the
`.html` and the full matrix only into `index.ts`), so it regenerates **byte-identically**. That is
stated up front so a green `--check` on an unchanged file is not later read as a skipped step.

### 4. The CSS

One block per tone in `packages/styles/src/card/sk-card.css`:

```css
.sk-card--status-<tone> {
  background: var(--sk-status-<tone>);
  border-color: var(--sk-on-status-<tone>);
  border-left-width: var(--sk-border-width-4);   /* the edge treatment */
}
```

Ordering against the existing axes is declared once: the status blocks are authored **after**
`.sk-card--blue` / `.sk-card--purple` and after `.sk-card--inset`, so on a card carrying both, the
operational tone wins the surface and the brand variant keeps its hover accent. Both modifiers are
present on the node either way, which is what the orthogonality test asserts.

Forced-colors, following `sk-skip-link.css` / `sk-data-table.css`:

```css
@media (forced-colors: active) {
  .sk-card { border-left-color: CanvasText; }   /* LONGHAND, the policed property */
}
```

`background` flattens to `Canvas` under forced-colors and is not relied on. `border` survives and
is remapped automatically; the explicit `CanvasText` longhand makes the card's edge deliberate
rather than incidental, and `CanvasText` is already an allowlisted `ignoreValues` entry.

Reduced motion: the card already transitions `border-color`. The status axis adds no new animated
property, but the existing transition now carries status meaning, so a
`@media (prefers-reduced-motion: reduce)` block scoped to `.sk-card { transition: none; }` is
added — the exact selector and the exact property the component owns, per the recipe.

### 5. The tokens

Added to **both** blocks of `packages/tokens/src/tokens.css` in one commit:

| token | dark | light |
|---|---|---|
| `--sk-surface-tint-rose` | `#2B1515` | `#F8E5E5` |
| `--sk-on-tint-rose` | `var(--sk-color-red)` | `#6B2424` |
| `--sk-status-neutral` | `var(--sk-surface-muted)` | (inherits the light `--sk-surface-muted`) |
| `--sk-status-info` | `var(--sk-surface-tint-sky)` | ″ |
| `--sk-status-success` | `var(--sk-surface-tint-mint)` | ″ |
| `--sk-status-attention` | `var(--sk-surface-tint-butter)` | ″ |
| `--sk-status-danger` | `var(--sk-surface-tint-rose)` | ″ |
| `--sk-status-recovery` | `var(--sk-surface-tint-lilac)` | ″ |
| `--sk-on-status-<tone>` | `var(--sk-fg-muted)` / `var(--sk-on-tint-sky)` / `…mint` / `…butter` / `…rose` / `…lilac` | ″ |

Every alias resolves per theme through the tokens the light block already overrides, so the status
category is declared in **both** blocks (satisfying #93's half-populated-theme rule and making the
declaration explicit) while carrying no second set of literals.

**Measured contrast** (sRGB, WCAG 2.x), all thresholds met:

| tone | dark: `--sk-fg-body` on surface | dark: pair | light: `--sk-fg-body` on surface | light: pair |
|---|---|---|---|---|
| neutral | 9.69 | 6.01 | 11.17 | 5.22 |
| info | 11.36 | 9.42 | 12.23 | 7.70 |
| success | 11.15 | 8.55 | 12.76 | 7.10 |
| attention | 10.67 | 11.18 | 13.38 | 6.28 |
| danger | 11.87 | 5.87 | 11.93 | 9.11 |
| recovery | 11.66 | 7.88 | 12.27 | 8.00 |

Edge vs page ground (WCAG 1.4.11, needs 3:1): dark minimum 6.58 (danger), light minimum 6.20
(neutral).

### 6. Verification

| claim | mechanism |
|---|---|
| fail-open renders and slots | `[SC-013]` in `fixtures/elements-behaviour/src/sk-card.test.ts` mounts an unknown-status card and targets `::part(card)` from outside; the mutation arm makes the status path **throw** and reds it |
| one vocabulary | assertion against the exported frozen array |
| reflected property survives pre-upgrade | `[SC-010]`, new subject `sk-card`; mutation arm flips `reflect: true` → `false` |
| orthogonality | both modifiers on one node, both computed effects present |
| composition in light DOM | assigned-node assertions on the `<dl>` and `<details>` |
| meaning without colour | greyscale story + the indicator's text |
| type reach | `packages/react/type-tests/wrappers.type-test.tsx`, `@ts-expect-error` red-first by construction |

## Project Structure

### Documentation (this mission)

```
kitty-specs/card-status-tone-axis-01M1VJNY/
├── spec.md
├── plan.md              # this file
└── tasks/               # work packages
```

### Source Code (repository root)

```
packages/tokens/src/tokens.css                          # + rose tint pair, + --sk-status-*/--sk-on-status-*
packages/styles/src/card/sk-card.css                    # + six status blocks, forced-colors, reduced-motion
packages/styles/src/card/sk-card.html                   # GENERATED (base form; regenerates identically)
packages/styles/src/card/index.ts                       # GENERATED (+ six status exports)
packages/styles/src/card/sk-card-html.stories.ts        # static-path stories
packages/elements/src/card/sk-card.markup.ts            # + CARD_STATUSES, cardClasses/cardStaticHtml status
packages/elements/src/card/sk-card.ts                   # + reflected status property
packages/elements/src/card/sk-card.css.js               # GENERATED
packages/elements/src/card/sk-card.stories.ts           # + tone/base/orthogonality/composition/greyscale/
                                                        #   forced-colors/unknown/LightMode stories
packages/elements/src/status-indicator/sk-status-indicator.ts  # export the frozen tone array
packages/elements/src/index.ts                          # re-export the array + CARD_STATUSES
packages/elements/custom-elements.json                  # GENERATED
packages/elements/vue.d.ts                              # GENERATED
packages/elements/SIZES.md                              # GENERATED (after a real build)
packages/react/src/**                                   # GENERATED
packages/react/type-tests/wrappers.type-test.tsx        # + status union proof
packages/tokens/dist/token-catalogue.json               # GENERATED
fixtures/elements-behaviour/src/sk-card.test.ts         # + status behaviour tests
behaviours.json, mutations.json                         # + SC-010 subject, + red-first arms
expected-docs.json, expected-stories.json               # ratchets
```

## Risks

| risk | mitigation |
|---|---|
| The vocabulary is spelled in two places | both pinned by an assertion that fails on a fork; documented at both sites |
| `--check` green over an nx-cached artifact | every regeneration runs with `--skip-nx-cache` before any `--check` |
| `SIZES.md` measured against a stale `dist/` | build `tokens,styles,elements` first, then measure |
| Opting `sk-card` into `expected-stories.json` creates a hard gate on story ids | ids verified against the built Storybook index before committing |
| Another session merges to the train | re-fetch and rebase before the PR is final; `kitty-ops/ops-index.jsonl` conflicts are a union, then every line re-parsed and every `invocation_id` re-checked for uniqueness |

## Complexity Tracking

No charter deviation. The single recorded judgement call — completing the tint family with a rose
member so `--sk-status-danger` is an alias — is stated in the spec, measured, and filed as an issue
so the operator sees it rather than inheriting it silently.
