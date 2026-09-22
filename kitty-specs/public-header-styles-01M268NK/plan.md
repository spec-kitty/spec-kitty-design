# Implementation Plan: Public Header Styles

**Branch**: `mission/public-header-styles` | **Date**: 2026-09-10 | **Spec**: [`spec.md`](./spec.md)
**Input**: [`kitty-specs/public-header-styles-01M268NK/spec.md`](./spec.md) @ `d24aadb`
**Issue**: [spec-kitty/spec-kitty-design#353](https://github.com/spec-kitty/spec-kitty-design/issues/353) · epic [#352](https://github.com/spec-kitty/spec-kitty-design/issues/352)
**Target branch**: `train/elements-first` (never `main` — `docs/architecture/elements-first-run-prompt.md:148`)
**Author**: architect-alphonso (Architect Alphonso), programme orchestrator session `ea037606`

> **Read order for the implementer.** This plan, then `docs/contributing/adding-a-component.md`
> in full, then `packages/styles/src/context-nav/` as the worked example of *everything* below.
> `sk-context-nav` (#256) is the closest existing family in kind — styles-only, no element, native
> `<nav>`, consumer-owned links/labels/`aria-current`, logical properties, forced-colours block,
> its own Playwright spec, its own usage-doc section, its own ratchet entry. Where this plan says
> "the context-nav shape", that is the file to open.

---

## Summary

Add a styles-only `.sk-public-header` family at `packages/styles/src/public-header/` that styles a
consumer-authored `<header>` / `<a>` / `<nav>` tree: a bounded inner row with a brand/home anchor at
the inline start and an optional labelled action region at the inline end, wrapping at narrow widths
with no CSS reordering, correct under RTL by logical properties alone, and legible under
`forced-colors: active`. No custom element, no shadow root, no React wrapper, no `::part()`, no
router, no sticky positioning, no theme state.

The technical approach in one line: **flex-wrap on the family's own inner row, tokens for every
value, a family-owned `.sk-public-header__action` composition slot carrying the 44px floor, and
zero declared motion** — each of those four choices is settled below against a named file in this
repository rather than chosen by the implementer.

---

## Technical Context

**Language/Version**: CSS (authored, hand-written) + TypeScript 5.x for the Storybook CSF file and
the Playwright spec. No new runtime dependency.
**Primary Dependencies**: `@spec-kitty/tokens` (`--sk-*` custom properties) only. `packages/styles`
imports from `packages/tokens` and nothing else (CLAUDE.md §3 rule 2; ADR-8).
**Storage**: N/A — see [`data-model.md`](./data-model.md).
**Testing**: Playwright (`apps/storybook/src/tests/**`, run by `npx playwright test`, three
projects: chromium/firefox/webkit) + `node scripts/run-axe-storybook.js` + the chromium-only
`visual.spec.ts` lane. **Not** Vitest: `npm run test` is `vitest run` (`package.json`) and does not
execute anything under `apps/storybook/src/tests/`. See "Correction to the spec" below.
**Target Platform**: Evergreen browsers via Storybook 10.x; static light-DOM HTML for
server-rendered consumers (ADR-10 §3's no-JavaScript consumer).
**Project Type**: Nx monorepo library (`packages/styles`, `scope:styles`, `type:publishable`).
**Performance Goals**: None declared. The family adds one stylesheet and N static HTML strings; the
only measured budget it touches is `scripts/build-storybook-with-budget.mjs`, which bounds the
Storybook build, not this component.
**Constraints**: no root overflow and no clipped focus at 390px / 1440px / 200%-zoom / short
viewport; ≥44 CSS px targets; zero axe WCAG 2.1 AA violations; zero raw literals in the CSS.
**Scale/Scope**: one component directory, one CSS file, nine authored HTML fixtures, one story
file, one Playwright spec, three shared files touched (`index.ts`, `package.json`, generator),
three ratchet/registry files touched (`expected-stories.json`, `visual.spec.ts`,
`using-components.md`). One Work Package, one PR.

---

## Charter Check

*GATE: passed before Phase 0. Re-checked after the file inventory below was fixed.*

| Charter policy | This mission | Verdict |
|---|---|---|
| CSS custom properties (`--sk-*`) are the single authoritative token distribution format | Every value in `sk-public-header.css` resolves through `var(--sk-*)`; enforced twice (stylelint `declaration-strict-value`, `scripts/check-component-token-literals.mjs`) | PASS |
| Vanilla HTML for primitive component markup; behaviour verified with Vitest browser mode | No behaviour: zero JavaScript, so no Vitest browser project, no `behaviours.json` subject, no `mutations.json` entry. Justified under ADR-11's applicability framing (`…:54` — "every item below **that applies to it**"); none of the eleven required-behaviour items applies to a component with no element, no shadow root and no JS | PASS |
| Storybook as component documentation and visual-regression baseline | One CSF file, nine ratcheted story ids, two visual baselines | PASS |
| No line-coverage threshold; the bar is required behaviours + visual conformance + accessibility | Verification plan §7 below is exactly that shape | PASS |
| Angular is not a target (`packages/angular` deleted in #102) | Nothing Angular | PASS |
| Charter intent: reusable multi-framework design system, SK dashboard + docsite the v1 consumers | This family's named consumer is Team Kitty's Family 6 front door via #355. It ships as CSS + static HTML, the two consumption paths a server-rendered Django consumer can use | PASS |

No Complexity Tracking rows: no charter violation is being justified.

---

## Project Structure

### Documentation (this mission)

```
kitty-specs/public-header-styles-01M268NK/
├── spec.md              # authored, committed a593a1b + d24aadb
├── plan.md              # THIS FILE
├── research.md          # measured findings this plan rests on
├── data-model.md        # explicit "no data model" record
├── decisions/           # three deferred plan-interview DMs (see "Deferred interview questions")
└── tasks/               # NOT created by this phase — `spec-kitty tasks` is out of scope here
```

No `contracts/` directory and no `quickstart.md`: this family has no API surface to contract
(no element, no attributes, no events, no methods, no `::part()`), and its quickstart *is* the
`## Public header` section of `docs/design-system/using-components.md` that FR-018 requires — a
second copy in `kitty-specs/` would be the two-copies-of-one-procedure drift CLAUDE.md §5 warns
about.

### Source code (repository root)

```
packages/styles/src/public-header/          # NEW directory
├── sk-public-header.css                    # AUTHORED — the source of record
├── sk-public-header-brand-only.html        # AUTHORED fixture
├── sk-public-header-one-action.html        # AUTHORED fixture
├── sk-public-header-two-actions.html       # AUTHORED fixture (the Family 6 shape)
├── sk-public-header-many-actions.html      # AUTHORED fixture
├── sk-public-header-long-labels.html       # AUTHORED fixture
├── sk-public-header-current-action.html    # AUTHORED fixture (consumer-supplied aria-current)
├── sk-public-header-mixed-controls.html    # AUTHORED fixture (anchor + button)
├── sk-public-header-theme-slot.html        # AUTHORED fixture (#323 placeholder, see §6)
├── sk-public-header-html.stories.ts        # AUTHORED
└── index.ts                                # GENERATED by scripts/build-styles-only-markup.mjs

packages/styles/src/index.ts                # MODIFIED (one line, authored, hand-maintained)
packages/styles/package.json                # MODIFIED (one exports entry, authored)
scripts/build-styles-only-markup.mjs        # MODIFIED (one adrNote branch, authored — see §2)
apps/storybook/src/tests/sk-public-header.spec.ts   # NEW, AUTHORED
apps/storybook/src/tests/visual.spec.ts     # MODIFIED (two baselines, authored)
apps/storybook/src/tests/visual.spec.ts-snapshots/  # NEW PNGs — CI-HARVESTED, never local
expected-stories.json                       # MODIFIED (new byElement entry + total, authored)
docs/design-system/using-components.md      # MODIFIED (new `## Public header` section, authored)
```

**Structure Decision**: the family lives entirely inside `packages/styles/src/public-header/`, the
directory shape `scripts/build-styles-only-markup.mjs` derives its work set from
(`stylesOnly()`, lines 36–52: a directory under `packages/styles/src` with a `.css` and **no**
matching directory under `packages/elements/src`). Creating `packages/elements/src/public-header/`
would silently remove this family from that generator's set and from the styles-only barrel
contract; it is forbidden by C-003 and asserted by SC-008.

---

## 1. Exact file inventory

Every path this Work Package creates or modifies, with its authorship class and the generator or
gate that owns it. **A file is either AUTHORED (a human/agent writes it, review reads it) or
GENERATED (a script writes it, `--check` compares it, hand-editing it is a defect).** There is no
third class.

### 1.1 Created — authored

| Path | Class | Owning gate |
|---|---|---|
| `packages/styles/src/public-header/sk-public-header.css` | AUTHORED — the CSS source of record | `npm run quality:stylelint` (`declaration-strict-value` + `selector-class-pattern`); `node scripts/check-component-token-literals.mjs <path>`; `npx nx run styles:lint` |
| `packages/styles/src/public-header/sk-public-header-brand-only.html` | AUTHORED fixture | `npm run quality:htmlhint` (glob `packages/styles/src/**/*.html`, `package.json`); `nx run styles:lint` lints `packages/styles/**/*.html`; it is the *input* to `build-styles-only-markup.mjs` |
| `…-one-action.html` | AUTHORED fixture | same |
| `…-two-actions.html` | AUTHORED fixture | same |
| `…-many-actions.html` | AUTHORED fixture | same |
| `…-long-labels.html` | AUTHORED fixture | same |
| `…-current-action.html` | AUTHORED fixture | same |
| `…-mixed-controls.html` | AUTHORED fixture | same |
| `…-theme-slot.html` | AUTHORED fixture | same |
| `packages/styles/src/public-header/sk-public-header-html.stories.ts` | AUTHORED | `nx run styles:lint` (ESLint), `typecheck-all.mjs`, `storybook:build`, `run-axe-storybook.js`, the `expected-stories.json` ratchet |
| `apps/storybook/src/tests/sk-public-header.spec.ts` | AUTHORED | `npx playwright test` — **no registration needed**: `playwright.config.ts`'s `testDir: 'apps/storybook/src/tests'` runs the whole directory precisely so a new spec cannot silently never execute (its own comment says so) |

**One fixture per required evidence axis.** The issue's "Required stories and tests" list names nine
composition/state axes. Two of them — *narrow wrapping* and *RTL* — are **presentation** axes over
existing markup, not new markup, so they are stories that re-render an existing fixture inside a
narrow/`dir="rtl"` frame, exactly as `sk-context-nav-html.stories.ts` does (`Narrow` and `Rtl` both
render `SkContextNavCurrentNestedHTML`). Likewise `LightMode`, `DefaultDark` and `ForcedColors`.
Authoring a distinct `.html` for those would be markup duplicated for a wrapper class, and #176's
gate deleted three such byte-identical decoy fixtures already (`expected-stories.json`'s `$comment`
records it). The fixture set is therefore **eight structural shapes**, and the story set is
**thirteen stories** (§5).

### 1.2 Created — generated

| Path | Class | Generator | Freshness gate |
|---|---|---|---|
| `packages/styles/src/public-header/index.ts` | **GENERATED** | `node scripts/build-styles-only-markup.mjs` | `node scripts/build-styles-only-markup.mjs --check`, wired in `ci-quality.yml`'s `lint-code` job (line 215). Never hand-edit (C-008, FR-019, NFR-010) |

### 1.3 Created — CI-harvested binaries

| Path | Class | Rule |
|---|---|---|
| `apps/storybook/src/tests/visual.spec.ts-snapshots/sk-public-header-two-actions-dark.png` | CI-AUTHORITATIVE baseline | Harvested from the `visual-regression-diffs` artifact of a CI run on this PR. **Never** `--update-snapshots` locally (`docs/contributing/adding-a-component.md:466-469`; `visual.spec.ts:29-32`). Local font rasterization differs and the screenshots are clipped, so box dimensions are part of the assertion |
| `…-snapshots/sk-public-header-light.png` | CI-AUTHORITATIVE baseline | same |

### 1.4 Modified — authored

| Path | What changes | Why it is not optional |
|---|---|---|
| `packages/styles/src/index.ts` | one line: `export * from './public-header/index';` | The per-DIRECTORY half of this barrel is **hand-maintained** — its own header comment says so verbatim ("the list below is still hand-maintained, so a component that gains its first `index.ts` is silently omitted until someone adds a line", filed as #156). No gate catches the omission. `sk-context-nav.spec.ts:421` asserts the equivalent line for its own family; ours must do the same |
| `packages/styles/package.json` | one `exports` entry: `"./public-header/*": "./dist/public-header/*"` | Without it a consumer cannot `@import '@spec-kitty/styles/public-header/sk-public-header.css'`, which is the exact import the usage doc will publish. `sk-context-nav.spec.ts:422-423` asserts the equivalent entry. The `build` target already copies `**/*.{html,css}` from `src` to `dist` (`packages/styles/project.json`), so no build change is needed |
| `scripts/build-styles-only-markup.mjs` | one branch in the `adrNote` ternary (lines 112–119) | **See §2. This is a required change, not a nicety** |
| `apps/storybook/src/tests/visual.spec.ts` | two `toHaveScreenshot` tests, in the `contextNavVisuals` shape (lines 1078–1113) | NFR-009/SC-005 |
| `expected-stories.json` | a new `byElement["sk-public-header"]` array of 13 ids, `total` 505 → 518, and a `$comment` line recording what was opted in and why | NFR-011/SC-006. `run-axe-storybook.js:636-645` asserts `total` equals the flattened list length, so the count and the list must move together |
| `docs/design-system/using-components.md` | a new `## Public header` section | FR-018/SC-007 |

### 1.5 Explicitly NOT touched — and the mechanical proof for each

| Path | Why not | Proof |
|---|---|---|
| `packages/elements/src/public-header/` | no custom element (C-003) | SC-008: `git ls-files packages/elements/src/public-header` empty |
| `packages/elements/custom-elements.json` | nothing to analyze | SC-009 `git diff --exit-code`; `npx nx run elements:analyze` derives from `packages/elements/src` |
| `packages/react/src/**` | generated from the manifest; no manifest entry ⇒ no wrapper | SC-009; `build-react-wrappers.mjs --check` |
| `packages/elements/vue.d.ts` | same generator family | `build-vue-types.mjs --check` |
| `expected-docs.json` | **exact-equality** ratchet over documented element attributes/methods. A family with no element contributes no row. Adding one would break the exact equality | SC-009; `check-manifest-content.mjs` |
| `expected-parts.json` | shrink-only `::part()` ratchet. This family declares no `::part()` (it has no shadow root to expose one from), so no row and no `total` bump | `check-part-ratchet.mjs`. **If a `::part()` is ever introduced this row becomes required — it is not, so it is not** |
| `behaviours.json` / `mutations.json` | no behaviour to declare; declaring one creates an obligation nothing else discharges (recipe §4: "declaring one creates the obligation") | `sk-context-nav.spec.ts:409-417` is the precedent assertion: it greps the tracked registries and requires zero matches |
| `expected-inert-theme-wrappers.json` | shrink-only; only moves when an inert `data-theme="light"` wrapper is **fixed**. We author `class="sk-light"` from the start, so we neither add nor retire one | `check-story-theme-wrapper.mjs` |
| `packages/styles/src/**/*.css.js` | the generated element CSS modules come from `scripts/build-elements-css.mjs`, whose work set is **derived from the ELEMENTS** (`build-elements-css.mjs:34`). No element ⇒ no `sk-public-header.css.js` is generated, and none should be looked for | `build-elements-css.mjs --check` |
| `packages/elements/SIZES.md` | measures `packages/elements/dist/`. This family ships nothing into `packages/elements` | `measure-elements-sizes.mjs --check`. See hazard §8(b) |
| `apps/demo/*.html`, `scripts/assemble-demo-dist.sh` | **Finding: no change required.** The demo pages are not a required consumer of a new component. `assemble-demo-dist.sh` derives its page set by glob (`for src in apps/demo/*-demo.html`) and its path rewrite is a *prefix* rule (`s\|../../packages/styles/src/\|./\|g`), so it needs no per-component allowlist entry — CLAUDE.md's own pitfall list states this ("it derives the copied component set from the demo pages, so a new component needs no allowlist edit"). We add no demo page and link no new stylesheet from one, so nothing in `apps/demo/` changes. If a later mission *does* compose `sk-public-header` into a demo page, it adds the `<link>` and the script keeps working unchanged | read `scripts/assemble-demo-dist.sh:26-56` |
| `stylelint.config.mjs` | **Finding: no change required.** The recipe instructs adding "the specific system-color keywords you use" to `ignoreValues`. All seven keywords a header plausibly needs — `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `LinkText`, `GrayText` — are **already present** (`stylelint.config.mjs:52-58`). The family must confine itself to that set; introducing an eighth (e.g. `AccentColor`) would require a config edit **and** is discouraged, because a keyword not on that list is a keyword the gate has never certified | read `stylelint.config.mjs:40-59` |
| `.github/workflows/ci-quality.yml` | **Finding: no change required. See §3** | read `.github/workflows/ci-quality.yml:62-114` |
| `docs/architecture/decisions/**` | ADRs are written only in #67 (`elements-first-run-prompt.md:344`). This mission writes none | — |
| `kitty-specs/**` outside this mission's own directory | frozen historical record (`elements-first-run-prompt.md:346`) | — |

---

## 2. The generator change — required, and settled by precedent

**The finding.** `scripts/build-styles-only-markup.mjs` writes a rationale line into every
generated barrel. Lines 112–119:

```js
const adrNote =
  name === 'form-field'
    ? "See ADR-10's \"`form-field` is deliberately styles-only (#141)\" section and #141."
    : name === 'segmented-choice'
      ? 'See #270.'
      : 'See ADR-10\'s "Styles-only components are a class, not a fixed exception count" section.';
```

and the comment above it (lines 110–115) states the rule the ternary encodes: *"ADR-10's … section
is the citation for every styles-only component EXCEPT form-field and segmented-choice. … **Do not
attribute either component-specific rationale to ADR-10's general class ruling.**"*

Left unmodified, `packages/styles/src/public-header/index.ts` would be generated carrying
*"public-header is deliberately styles-only — it has no custom element. See ADR-10's 'Styles-only
components are a class, not a fixed exception count' section."*

**That citation is wrong for this family, and the spec already says so.** `spec.md`'s "Styles-only
rationale (why no custom element)" section establishes that `sk-public-header` follows the
`form-field`-shaped reasoning — an explicitly recorded scope decision — and **not** ADR-10's
class ruling, because none of the class ruling's four structural reasons (unbroken `<dl>`/`<table>`/
`<li>` chains, cross-root ID references, a document-scoped `href="#…"`, UA-owned `<details>` state)
is what makes this family styles-only. ADR-10 itself reinforces the separation:
*"`#141` stays attached to `form-field` alone; it is not the citation for the class ruling above"*
(`docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md:110-111`).

**The decision — from precedent, not from the architect.** `segmented-choice` is the existing
instance of exactly this situation: a styles-only family whose rationale is its own recorded
decision (#270), given its own branch in the ternary and its own citation string. This mission
follows it identically:

```js
      : name === 'public-header'
        ? 'See #353.'
```

This is a one-line, precedented change to an authored generator script. It falls inside the
`components` path filter (`scripts/**`, `ci-quality.yml:98-102`) so it does not shrink CI coverage,
and `build-styles-only-markup.mjs --check` will compare the newly generated barrel byte-for-byte,
so the change and its output land in the same commit.

**Ordering constraint for the implementer:** edit the generator *before* running the generator.
Running it first produces a barrel with the wrong citation, and `--check` will then report the
corrected barrel as "stale" against a file the implementer wrote by hand — the exact confusion the
DO-NOT-EDIT header exists to prevent.

---

## 3. `ci-quality.yml`'s `components` path filter — finding: **no entry needed**

**The claim being checked.** `docs/architecture/elements-first-run-prompt.md:182` says: *"A PR that
touches a new package directory must also extend `ci-quality.yml`'s `components` path filter, or
its component gates silently skip."*

**The repository.** The filter does **not** enumerate package directories. `.github/workflows/ci-quality.yml:80`
is a single glob:

```yaml
              - 'packages/**'
```

and the comment immediately above it (lines 73–79) is that exact defect being fixed, in this
repository, deliberately:

> ``` `packages/**`, not a hand-written list of two. storybook:build's own inputs already glob
> `packages/*/src/**/*` … a new packages/<anything>/ matches no filter, storybook-build skips, and
> a11y/visual/playwright skip on `needs` with the gate accepting all four as legitimate. The nx
> input set is the honest spec. ```

**Verdict: the run prompt is stale relative to the workflow; the repository wins.** Every path this
Work Package touches already matches a `components` filter entry:

| Path this WP touches | Matching filter entry (line) |
|---|---|
| `packages/styles/src/public-header/**` | `packages/**` (80) |
| `apps/storybook/src/tests/**` | `apps/storybook/**` (81) |
| `scripts/build-styles-only-markup.mjs` | `scripts/**` (102) |
| `expected-stories.json` | `expected-stories.json` (66) |
| `packages/styles/package.json` | `packages/**` (80) |

**No edit to `ci-quality.yml` is required, and none should be made.** Adding a redundant
`packages/styles/src/public-header/**` entry would reintroduce, one row at a time, the allow-list
shape the comment at 73–79 removed.

**Secondary note, recorded because it is a real hazard and not a reason to change anything here.**
`dorny/paths-filter` evaluates the filter definition **from the PR head ref**, so a filter entry a
PR *adds* is live for that same PR's run — but a filter entry a PR *relies on* must already exist on
the head, which it does here since the head branches from the train. No probe branch is needed to
evidence this: the entry is present on `train/elements-first` today and this branch inherits it.
The implementer should still confirm, on the opened PR, that `storybook-build`, `a11y`,
`playwright` and `visual-regression` all report **run**, not **skipped** — `ci-quality.yml:625-661`
is the gate that converts an illegitimate skip into a failure, and reading the jobs list is a
five-second check that closes this question empirically.

---

## 4. The anatomy

### 4.1 Grounding in the corpus — and what is deliberately not copied

Measured across `ux_redesign/families/06-account-front-door/screens/` (23 of 24 screens; the
exception is `P24-password-maintenance-dark.html`, which correctly uses authenticated `sk-app-shell`
chrome — the issue says so and the corpus confirms it):

```html
<header class="topnav">
  <div class="container topnav-inner">
    <a class="logo" href="/">Spec Kitty<span class="brand-context">TeamSpace</span></a>
    <nav class="nav-actions" aria-label="Account and appearance">
      <a class="sk-button sk-button--ghost sk-button--sm" href="/accounts/login/">Sign in</a>
      <a class="sk-button sk-button--secondary … sk-button--sm" href="/accounts/signup/">Start free</a>
      <details class="theme-picker">…</details>
    </nav>
  </div>
</header>
```

Local CSS (byte-identical in every screen that carries it; e.g.
`P4-login-default-dark.html:572-576`):

```css
.topnav{background:var(--sk-surface-page);border-bottom:var(--sk-border-width-1) solid var(--sk-border-default)}
.topnav-inner{display:flex;align-items:center;justify-content:space-between;gap:var(--sk-space-4);min-height:calc(var(--sk-space-10) + var(--sk-space-4));padding-block:var(--sk-space-3)}
.logo{display:inline-flex;align-items:center;min-height:var(--sk-space-9);font-size:var(--sk-text-xl);gap:var(--sk-space-3)}
.brand-context{…;color:var(--sk-fg-muted);padding-left:var(--sk-space-4);border-left:var(--sk-border-width-1) solid var(--sk-border-strong)}
.nav-actions{display:flex;align-items:center;gap:var(--sk-space-4)}
@media(max-width:600px){ .topnav-inner{flex-wrap:wrap} .nav-actions{gap:var(--sk-space-2)} … }
```

**Four things carry over and three do not.**

Carried over (they are the evidenced anatomy): the four-role decomposition
(region / inner row / brand / action region); flex with `align-items: center`, a start/end split,
and a `gap`; a bottom boundary rule on the region; the brand's own `min-block-size` floor.

**Not carried over:**

1. **The class names.** `topnav`, `topnav-inner`, `logo`, `nav-actions`, `brand-context`,
   `theme-picker`, `theme-toggle`, `theme-options` are all forbidden verbatim (C-002; #139's
   per-component prefix rule; SC-011 for the theme trio specifically).
2. **`.container`.** The corpus co-applies a page-width container (`max-width: calc(var(--sk-space-12)*10)`,
   `margin-inline: auto`) on the same element as `topnav-inner`. Page-width containment and
   centering are **the consumer's**, per FR-002 and the issue's "full public-page layout" non-goal.
   The family owns the row, not the page.
3. **`padding-left` / `border-left`.** Physical properties. Every equivalent is authored as the
   logical form (`padding-inline-start`, `border-inline-start-*`), which is what makes FR-010/User
   Story 5 true with **no** `[dir="rtl"]` rule anywhere.

### 4.2 The class list — exactly six, plus modifiers

| Class | Element the consumer authors it on | Required? |
|---|---|---|
| `sk-public-header` | `<header>` | **required** — the family's root; a real `<header>` so the implicit `banner` landmark is native (FR-001) |
| `sk-public-header__inner` | a `<div>` inside the header | **required** — the flex row; owns gap, wrap, padding-block and the minimum inline gutter |
| `sk-public-header__brand` | `<a href="…">` | **required** — always a real anchor, never a `<div>`/`<span>` stand-in (FR-003) |
| `sk-public-header__brand-context` | `<span>` inside the brand anchor | optional — the evidenced secondary identity label |
| `sk-public-header__actions` | `<nav aria-label="…">` | **optional as a whole; absent, never empty** — zero actions means no `<nav>` element at all (FR-004, NFR-006) |
| `sk-public-header__action` | each `<a>` / `<button>` / composed element inside the action region | **required whenever an action exists** — the documented composition slot carrying the 44px floor (FR-015, resolved decision) |

Modifiers: **none in this mission.** No `--compact`, no `--bordered`, no `--sticky` (C-009). A
modifier with one consumer is a guess; #354 is separately extending `sk-site-footer` with a real
compact mode because it has evidence for one, and this family has none.

`stylelint`'s `selector-class-pattern` accepts all six
(`^(sk-[a-z][a-z0-9-]*((__[a-z][a-z0-9-]*)?(--[a-z][a-z0-9-]*)*)?)|(is-[a-z][a-z0-9-]*)$`).

### 4.3 The DOM shape a consumer authors

```html
<header class="sk-public-header">
  <div class="sk-public-header__inner">
    <a class="sk-public-header__brand" href="/">
      Spec Kitty<span class="sk-public-header__brand-context">TeamSpace</span>
    </a>
    <nav class="sk-public-header__actions" aria-label="Account">
      <a class="sk-public-header__action sk-button sk-button--ghost sk-button--sm" href="/accounts/login/">Sign in</a>
      <a class="sk-public-header__action sk-button sk-button--secondary sk-button--sm" href="/accounts/signup/">Start free</a>
    </nav>
  </div>
</header>
```

Brand-only is the same tree with the `<nav>` element **deleted**, not emptied.

**Three consumer obligations the CSS cannot enforce and the usage doc must therefore state
explicitly** (FR-008, FR-018, NFR-006, and the spec's "A consumer omits the `<nav>`'s `aria-label`"
edge case):

1. When an action region exists, its `<nav>` **must** carry a non-empty accessible name. CSS cannot
   supply one. The Playwright spec asserts it on every shipped fixture; nothing asserts it in a
   consumer's own page.
2. Exactly one `sk-public-header` per document, so `banner` stays singular. Not defended in CSS.
3. Every action carries `.sk-public-header__action` in addition to whatever classes the control
   already has. This is what makes the 44px floor real, and it is the same kind of obligation as
   applying `.sk-context-nav__link` to each of that family's anchors.

### 4.4 What each rule does — the sheet's intended shape

Stated as intent, not as authored CSS (this phase does not write product CSS):

- `.sk-public-header` — `box-sizing`, `inline-size: 100%`, colour/`background` from the page
  surface pair, and a **bottom boundary authored as longhands** (`border-block-end-style`,
  `-width`, `-color`), never the `border` shorthand. The longhand form is what
  `declaration-strict-value` can actually police (`adding-a-component.md:192-203`) and what the
  forced-colours block can override with a system-colour keyword.
- `.sk-public-header__inner` — `display: flex; flex-wrap: wrap; align-items: center;
  justify-content: space-between; gap; padding-block; padding-inline; min-block-size;
  min-inline-size: 0`. `min-inline-size: 0` is the flex-item overflow escape the context-nav sheet
  uses on every one of its own boxes (`sk-context-nav.css:7, 34, 41, 49`) and is what stops a long
  unbroken string from widening the scroll root.
- `.sk-public-header__brand` — `display: inline-flex; align-items: center; gap; min-block-size:
  var(--sk-space-9); min-inline-size: 0; overflow-wrap: anywhere; text-decoration: none`, with
  `:link`/`:visited` **paired** so visited history is presentation-neutral (context-nav pairs them
  and its spec asserts the pairing at `sk-context-nav.spec.ts:108-117`).
- `.sk-public-header__brand-context` — muted foreground plus a logical
  `border-inline-start-*` separator, mirroring the corpus's `border-left` in logical form.
- `.sk-public-header__actions` — `display: flex; flex-wrap: wrap; align-items: center; gap;
  min-inline-size: 0`. It reserves nothing when absent because it *is* absent.
- `.sk-public-header__action` — `display: inline-flex; align-items: center; justify-content:
  center; min-block-size: var(--sk-space-9); min-inline-size: var(--sk-space-9); box-sizing:
  border-box`. **This is the resolved target-size decision**; see §4.5.
- `:focus-visible` on brand and action — `outline-style/-width/-color` longhands with an
  `outline-offset`. **Never `box-shadow`** — it computes away entirely under forced colours
  (`adding-a-component.md:165-170`).
- `[aria-current]:not([aria-current="false"])` on `.sk-public-header__action` — a non-colour cue
  (weight **and** a logical border or underline), matching context-nav's shape at
  `sk-context-nav.css:94-101`. The `:not([aria-current="false"])` guard is not decoration: a
  consumer legitimately writes `aria-current="false"` on non-current items, and styling it as
  current is a real defect context-nav's spec pins (`sk-context-nav.spec.ts:781-809`).

**Forbidden in this sheet, and each is machine-checkable:** any `.sk-button*` selector, any
`sk-theme-toggle` selector, any `::part(`, any `:host`, any `.sk-light`/`data-theme`/`:root`
selector (C-004), any `[dir="rtl"]` rule (FR-010), any physical `left`/`right`/`margin-left`-family
property (FR-010), any `order`/`flex-direction: *-reverse` (FR-007 — reordering is what breaks
focus order), any `display:none`/`visibility:hidden`/clip on action text (FR-016), any
`position: sticky|fixed` (C-009), any literal `44px` (C-001 — the floor is a token), and any
`transition`/`animation` (§4.6).

### 4.5 Target size — the resolved mechanism, restated for the implementer

`spec.md`'s "Resolved decision — target-size mechanism vs. no-internals-reach-through" settles this
from two precedents verified in this checkout:

- `packages/styles/src/confirm-dialog/sk-confirm-dialog.css:165-174` — the identical problem stated
  in the sheet's own comment (`.sk-button` does not guarantee 44×44; its `sm` size is deliberately
  smaller) and answered by pinning `min-inline-size`/`min-block-size: var(--sk-space-9)` on the
  component's **own** BEM classes, never on `.sk-button`'s.
- `packages/styles/src/context-nav/sk-context-nav.css:44-56` — the same idiom on
  `.sk-context-nav__link`, with `display: flex; align-items: center` so the floor is not inert on
  what would otherwise be an inline box.

**Why the floor is genuinely needed here, measured against this repository rather than the corpus.**
`packages/styles/src/button/sk-button.css:73-76` is the repository's `--sm`:

```css
.sk-button--sm { padding: var(--sk-space-2) var(--sk-space-5); font-size: var(--sk-text-sm); }
```

With `.sk-button`'s `line-height: 1` and `border: 1px solid transparent` (lines 17, 22), the
computed block-size is 8 + 8 + 14 + 1 + 1 = **32 CSS px** — under the floor. Note the divergence
worth recording: the Family 6 screens *appear* to clear 44px because each screen re-declares
`.sk-button--sm{min-height:calc(var(--sk-space-8) + var(--sk-space-1))}` **locally, in its own
inline `<style>` block**. That override does not exist in `packages/styles/src/button/sk-button.css`.
Where the corpus and the repository disagree, the repository wins: the library's `--sm` is 32px, so
the header family must supply the floor itself.

`--sk-space-9` is `3rem`/48px (`packages/tokens/src/tokens.css:242`) — the smallest token at or
above 44px, and the token both precedents already chose for exactly this.

### 4.6 Motion — the family declares none

**Decision: `sk-public-header.css` declares no `transition` and no `animation`, and therefore
authors no `@media (prefers-reduced-motion: reduce)` block.**

Grounded, not preferred: `adding-a-component.md:152-158` names
`sk-transition-matrix.css:237` as a reduced-motion block that *"looks like [a working precedent] but
isn't: it guards `scroll-behavior`, and no component in this repo sets `scroll-behavior: smooth`, so
it disables nothing."* A guard over a property the sheet never declares is that same inert block.
`sk-context-nav` — the nearest sibling — declares no motion at all, and its spec asserts both the
source-level absence (`sk-context-nav.spec.ts:270`) and the computed `transitionDuration === '0s'`
under `reducedMotion: 'reduce'` (lines 1077-1095).

The header's states (hover underline, focus outline, current-item weight/border) are all instant
by nature; nothing here wants a transition. **If a later reviewer requires one**, the guard is
written at that point, scoped to the exact selector and the exact property, following
`sk-skip-link.css:61-65`.

**Consequence for NFR-008, stated so the assertion is not fakeable.** The spec's Playwright
assertion must be phrased over the family's **own** boxes — the header, the inner row, the brand.
It must **not** assert `transitionDuration === '0s'` on `.sk-public-header__action`: a composed
`.sk-button` carries its own transition (`sk-button.css:23-26`), and an assertion that fails there
would tempt the implementer into writing `.sk-button { transition: none }` inside our sheet, which
is precisely the reach-through C-007 forbids. NFR-008's own wording already scopes it correctly
("any transition/animation duration **declared in `sk-public-header.css`**"); the spec file must
implement that wording, plus a source-level assertion that the sheet declares none.

---

## 5. Responsive and wrap strategy

**Mechanism: `flex-wrap: wrap` on `.sk-public-header__inner` (and on `.sk-public-header__actions`).
No media query. No container query. No breakpoint declared anywhere in the sheet.**

**Why not a container query — and does ADR-15 apply at all?** **It does not apply, and the reason
is not "this family is small".** ADR-15 is entirely about translating **shadow-DOM-authored**
constructs — `:host { container-type }`, `:host([attr])` gating an `@container`, `::slotted()` —
into a static equivalent for a consumer who cannot use a shadow root. Its "Which sheets this ruling
reaches" table (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md:366-376`)
enumerates exactly four sheets, all element-backed: `sk-app-shell.css`, `sk-action-row.css`,
`sk-copy-field.css`, `sk-page-header.css`. `adding-a-component.md:91-95` states the same bound.
`sk-public-header` has no element, no `:host` rule, and no shadow root, so there is no host-authored
construct for ADR-15 to translate and it contributes no host-wrapper obligation here. Verified by
inspection: `grep -rl container-type packages/styles/src` returns exactly those four sheets plus
`sk-confirm-dialog.css`, and none of the six styles-only families uses one.

That said, ADR-15's *underlying* rule is still instructive and is the reason a container query is
declined on its own merits: **an element is never its own query container**
(`adding-a-component.md:73-78`). `.sk-public-header` establishing `container-type: inline-size` and
then querying it to restyle `.sk-public-header__inner` would technically work — but it makes the
header's reflow depend on a *containment context* that a consumer's own layout can change without
touching this family, and it makes the sheet the fifth `container-type` sheet in the repository for
a layout that does not need one.

**Why not a media query.** Four reasons, in descending weight:

1. **A media query answers the viewport; the header answers its own row.** The header is composed
   inside a consumer-owned page wrapper of unknown width (FR-002). A `600px` viewport breakpoint —
   which is what the corpus uses — would wrap correctly on a phone and incorrectly inside a 480px
   column on a 1440px desktop.
2. **It would create a documented responsive threshold, and thereby an ADR-11 SC-017 obligation.**
   `adding-a-component.md:397-401`: *"If your component's behaviour changes below a documented
   viewport width or height, you own this id [SC-017] … and the mutation goes against the
   **generated** `sk-<name>.css.js`."* There is no generated `sk-public-header.css.js` — that
   artifact comes from `build-elements-css.mjs`, whose work set is derived from the **elements**
   (`build-elements-css.mjs:34`), and this family has no element. So an SC-017 obligation would be
   undischargeable by construction. Declaring no threshold is not dodging the gate; it is the
   honest state of a component whose reflow is continuous.
3. **`flex-wrap` needs no threshold at all.** With `flex-wrap: wrap`, `min-inline-size: 0` and
   `overflow-wrap: anywhere`, the row wraps at whatever width its own content stops fitting —
   which is correct at 390px, at 1440px inside a narrow column, at 200% zoom, and at a
   "threshold edge" that no longer exists to be tested wrongly.
4. **FR-007 forbids CSS reordering, and `flex-wrap: wrap` cannot reorder.** Items flow onto the
   next line in DOM order. There is no `order`, no `row-reverse`, and therefore no way for source
   order, reading order and focus order to diverge — which is what makes User Story 3's assertion
   pass by construction rather than by care.

**Consequences to author deliberately:**

- `justify-content: space-between` on a single-line row puts the brand at the inline start and the
  actions at the inline end (correct). On a **wrapped** row, `space-between` distributes each line
  independently, so a wrapped brand-only line stretches oddly. The remedy is `flex-wrap: wrap` plus
  the brand having `margin-inline-end: auto` **or** the action region having `flex: 0 0 auto` and
  the brand `flex: 1 1 auto` — the implementer picks whichever the fixtures prove, and the
  Playwright assertions (brand at start edge, actions at end edge at 1440px; no overflow at 390px)
  are what decide it. Both spellings are ordinary flex layout; neither is an architectural fork.
- The **minimum inline gutter** is owned by `.sk-public-header__inner`'s `padding-inline`, not by a
  page container. This is inside FR-002's boundary: FR-002 excludes *page-width containment and
  centering* (`max-inline-size` + `margin-inline: auto`), not padding. The epic's shared acceptance
  constraint 3 ("equal narrow gutters") requires *something* to own the gutter, and the family's own
  row is the only part of this composition the family owns. State this in the usage doc so a
  consumer does not double it.

---

## 6. Forced colours and reduced motion

**Reduced motion**: covered in §4.6 — no declared motion, no guard, assertion scoped to the sheet's
own boxes.

**Forced colours**, following the measured rules at `adding-a-component.md:160-203`:

| Rule (measured, #176) | What this family does |
|---|---|
| A plain `border` survives `forced-colors: active` with zero author CSS — the UA remaps it | The header's `border-block-end` is the boundary that survives (NFR-007). This is why the boundary is a **border**, not a `background` or a `box-shadow` |
| `background`/`background-color` do **not** survive — they flatten to `Canvas` | The family must not express its boundary, its current-item cue, or any focus cue through `background` alone. `background` may still be used for a hover surface, as long as it is never the *only* carrier of a meaning |
| `box-shadow` does **not** survive — it computes away entirely | **No focus ring built from `box-shadow`.** Focus is `outline` + `outline-offset`, which is preserved/remapped like `border` |
| `declaration-strict-value` polices `/color/` as a substring plus `background`/`background-color`, and does **not** police the `border`/`outline` **shorthands** at all | Author **longhands** everywhere a colour is set: `border-block-end-color`, `outline-color`, `border-inline-start-color`. The shorthand form would pass the gate while being unpoliced — "a gate being blind, not a gate being satisfied" |
| Add the system-colour keywords you use to `stylelint.config.mjs`'s `ignoreValues` | **No config edit needed** — `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `LinkText`, `GrayText` are already listed (`stylelint.config.mjs:52-58`). Confine the sheet to that set |
| `ignoreValues` has no media-query scoping — a system colour passes *everywhere*, and reviewers must confirm by reading that it appears only inside a `forced-colors` block (the config says so at lines 44-51) | Add a Playwright/source assertion that every system-colour keyword in `sk-public-header.css` occurs inside `@media (forced-colors: active)`. This converts a documented reviewer obligation into a machine check for this one sheet — cheap, and it is the gap the config itself names |
| An `<a>` recolors to `LinkText` intrinsically; this is link-specific and does **not** generalize | Do not assume the brand anchor's own colour survives by magic in a non-anchor context. Assert the boundary and the outline, which are the two things NFR-007 actually names |
| Never `forced-color-adjust: none` on an affordance that must stay visible | Not used anywhere in this family |

The `@media (forced-colors: active)` block is expected to be small — in the shape of
`sk-context-nav.css:195-213`: re-colour the header boundary, the current-action cue, and the
focus outline to system keywords, and nothing else.

---

## 7. The #323 dependency block

`sk-theme-toggle` (#323) is **OPEN** as of 2026-09-10 (verified in the spec's authoring pass). The
issue's own instruction is explicit: *"if #323 is still in flight, record that single story as
dependency-blocked rather than copying the control."*

**What this mission ships:**

- One fixture, `sk-public-header-theme-slot.html`, whose action region holds two real anchors and a
  **neutral, non-theme placeholder** for the third action — an ordinary
  `<button type="button" class="sk-public-header__action">` with a plain text label
  (e.g. `Appearance`). It is a *slot occupancy* proof: it demonstrates that a `<button>` composes
  beside anchors, aligns on the same baseline, and meets the same 44px floor. It demonstrates
  nothing about theme state.
- One story, `ThemeToggleComposition`, rendering that fixture, whose
  `parameters.docs.description.story` states plainly: **blocked on #323**; what the story will do
  once #323 merges into `train/elements-first` and ships a stable `sk-theme-toggle` public contract
  (replace the placeholder button with a real `<sk-theme-toggle class="sk-public-header__action">`);
  and that this family owns no theme state either way.
- **No theme presentation of any kind.** No `.theme-picker`, `.theme-toggle`, `.theme-options`, no
  `<details>`/`<summary>` disclosure imitation, no moon/sun glyph, no `aria-pressed` triad — nothing
  copied from the Family 6 screens' local control, which is exactly the copy SC-011 forbids.

**What the reviewer checks (SC-011):** `git grep -in "theme" -- packages/styles/src/public-header`
returns only the docs-string reference and the placeholder's own neutral label; it returns no
`.theme-picker`, `.theme-toggle` or `.theme-options` class name, and no `data-theme-choice`
attribute.

**This does not block the merge.** Every other required story, and every FR/NFR/C in the spec, is
independent of #323 (spec, "Cross-mission / dependency"). If #323 lands *before* this mission's PR
is merged, upgrading the placeholder to the real element is a fast-follow commit on this branch, not
a re-plan — but it must not be *assumed*: the plan of record is the blocked story.

### Story set — thirteen ids

| Export | Fixture rendered | Frame | Evidence axis (issue's list) |
|---|---|---|---|
| `Default` | two-actions | default | Family 6 two-action form |
| `BrandOnly` | brand-only | default | brand only; zero actions, no `<nav>` |
| `OneAction` | one-action | default | brand + one action; route-aware variant |
| `ManyActions` | many-actions | default | many actions |
| `LongLabels` | long-labels | narrow | long brand, long localized actions |
| `CurrentAction` | current-action | default | consumer-supplied `aria-current`, non-colour cue |
| `MixedControls` | mixed-controls | default | mixed anchor/button |
| `ThemeToggleComposition` | theme-slot | default | mixed anchor/button/theme-toggle — **#323-blocked** |
| `Narrow` | two-actions | 390px viewport | narrow wrapping |
| `ShortViewport` | two-actions | short viewport | short viewport |
| `Rtl` | two-actions | `dir="rtl"` | RTL |
| `ForcedColors` | current-action | default (browser test emulates) | forced colours |
| `LightMode` | two-actions | `class="sk-light"` | required light-theme story |

`DefaultDark` is **not** a separate export — `Default` *is* the dark default, since dark is the
repository's default theme and `expected-stories.json`'s own `$comment` records that byte-identical
decoy stories were deleted from #176 rather than ratcheted. `expected-stories.json`'s `total` moves
505 → 518.

Story ids follow the CSF id derived from the meta title. Proposed title:
`Navigation/SkPublicHeader (HTML)` — matching `sk-context-nav`'s `Navigation/SkContextNav (HTML)`
and CLAUDE.md §6's "pick the closest existing root". That yields ids
`navigation-skpublicheader-html--default`, `--brand-only`, … The implementer must read the ids off
the **built** `apps/storybook/storybook-static/index.json` and paste them into
`expected-stories.json`, not derive them by hand — a mismatched id fails the axe gate by name
(`run-axe-storybook.js:652`), which is the gate working, and hand-derivation is how it gets tripped.

---

## 8. Work-package shape — one WP, one PR

The issue mandates *"one bounded Work Package and one PR"* and the epic repeats it per child. This
plan proposes **exactly one Work Package** and does not propose a split.

**The argument that it does not split.** A split needs a seam where one half can be authored,
reviewed, and merged while the other does not exist. There is no such seam here:

1. **The generated barrel forbids a fixture/CSS split.** `index.ts` is generated from *all* the
   `.html` files in the directory, and `--check` runs on every PR. A WP shipping the CSS with two
   fixtures and a second WP adding six more regenerates the same file twice, and the first WP's
   barrel is stale the moment the second lands.
2. **The story ratchet forbids a story/test split.** `expected-stories.json` has an exact-`total`
   invariant (`run-axe-storybook.js:642-645`). Two WPs each editing `total` collide by construction
   — the second must rebase and recompute, which is a merge conflict dressed as a work package.
3. **The Playwright spec's source-level assertions read the CSS.** The spec's first `describe`
   block (in the context-nav shape) asserts the **exact public selector inventory** of
   `sk-public-header.css`. That assertion is meaningless before the CSS is final and wrong the
   moment a later WP adds a class. Test and CSS are one unit here, not two.
4. **The visual baselines are the last thing that can exist.** They are harvested from a CI run of
   the finished stories. A "WP-02: visual baselines" would be a WP that can only start after
   WP-01's PR is green, i.e. after the thing it belongs to has already merged.
5. **The whole diff is ~11 new files and 6 small edits in one package.** Splitting it produces
   coordination cost with no review benefit; the reviewable unit is the family.

**The one seam that does exist, recorded honestly**: the `docs/design-system/using-components.md`
section (FR-018) has no code dependency on the rest and could technically be a separate commit or
PR. It is **not** split out, for two reasons: `sk-context-nav.spec.ts:420-449` establishes that the
usage-doc section is *asserted by the component's own Playwright spec* — including a token-list
equality check between the doc and the stylesheet — so the doc is a tested artifact of this WP, not
an appendix; and the issue's delivery shape binds regardless of whether a seam exists.

**PR shape.** One PR, `mission/public-header-styles` → `train/elements-first`. Body uses
`Refs #353` and `Refs #352` — **never `Closes`**, because GitHub honours closing keywords only on
merges into the default branch and this PR targets the train (`elements-first-run-prompt.md:180`).
Commit type/scope: `feat(styles): …` for the family; the generator edit is a legitimate part of
the same scope or `chore(ci): …` if split — both `styles` and `ci` are in `commitlint.config.cjs`'s
enum (CLAUDE.md §3 rule 5). **Do not invent a `docs(specs)` / `docs(adr)` / `chore(spec-kitty)`
scope**; only exact anchored CLI messages are exempt.

---

## 9. Verification plan — the styles-only path

Run in this order. Each step names why it is here or why the element-path step it replaces does not
apply. **Every claim about a step not applying was checked against the script, not asserted.**

### 9.0 Preconditions

```bash
npm ci --ignore-scripts
npx nx run tokens:build && npx nx run tokens:catalogue   # stylelint reads packages/tokens/dist/token-catalogue.json
```

`stylelint`'s strict-value rule fails on a missing catalogue (CLAUDE.md §4). Nothing in this
mission changes `tokens.css`, so this is a one-time setup, not a per-run step.

### 9.1 Regenerate, then drift-check — the one generator that applies

```bash
node scripts/build-styles-only-markup.mjs            # writes packages/styles/src/public-header/index.ts
node scripts/build-styles-only-markup.mjs --check    # must exit 0                         [SC-001, NFR-010]
```

**Steps from the recipe's §7 block 1 that do NOT apply, each verified against the script:**

| Recipe step | Why it does not apply here | How verified |
|---|---|---|
| `node scripts/build-element-markup.mjs` | derives its work set from `packages/elements/src/*/*.markup.ts`; this family has no element and no markup module | recipe lines 205-211; `git ls-files 'packages/elements/src/*/*.markup.ts'` |
| `node scripts/build-elements-css.mjs` | *"Components whose CSS the elements package adopts — DERIVED from the ELEMENTS"* | `scripts/build-elements-css.mjs:34` |
| `npx nx run elements:analyze` | analyzes `packages/elements/src`; nothing added there | CLAUDE.md §4; `ci-quality.yml:293` |
| `node scripts/build-react-wrappers.mjs` | generated from `custom-elements.json`, which gains no entry | recipe lines 24-27 |
| `node scripts/build-vue-types.mjs` | same manifest source | recipe lines 29-33 |
| `node scripts/measure-elements-sizes.mjs` | reads `packages/elements/dist/`; this family ships nothing there | recipe lines 461-464 |

Their `--check` counterparts still run in CI and must stay green **by being unaffected** — if any
of them reports drift, this Work Package has touched something it should not have.

### 9.2 Lint and hygiene

```bash
npm run quality:all                                  # eslint + stylelint + htmlhint   [SC-012]
node scripts/check-component-token-literals.mjs \
  packages/styles/src/public-header/sk-public-header.css                                [SC-002, NFR-001]
node scripts/typecheck-all.mjs
```

`quality:all` is `quality:lint && quality:stylelint && quality:htmlhint` (`package.json`).
`quality:htmlhint` globs `packages/styles/src/**/*.html`, so the new fixtures are linted with no
config change; `.htmlhintrc` requires double-quoted attribute values, unique ids and lowercase
tags — note **`id-unique`**: fixture ids must not collide across files rendered into one Storybook
page, and the corpus's `data-od-id` attributes must not be copied (they are review scaffolding, per
the epic's shared constraint 6).

**Nx caching hazard:** if any step is run through `nx` (`npx nx run styles:lint`), pass
`--skip-nx-cache` when the purpose is a `--check`-style comparison. A cached artifact makes a
`--check` compare a stale output against itself and report green.

### 9.3 Build Storybook, then the story-based gates

```bash
npx nx run storybook:storybook:build --skip-nx-cache
node scripts/run-axe-storybook.js                    # zero WCAG 2.1 AA violations      [SC-003, NFR-002]
```

`run-axe-storybook.js` also enforces the `expected-stories.json` ratchet (lines 614-660): it flattens
`byElement`, requires `total` to equal the flattened length, and fails by name on any declared id
absent from the built index. That single command therefore discharges **SC-003 and SC-006 together**.

### 9.4 Playwright — the mission's own spec

```bash
npx playwright install --with-deps
npx playwright test apps/storybook/src/tests/sk-public-header.spec.ts     # while iterating
npx playwright test                                                        # the whole dir, as CI does
```

`playwright.config.ts` runs three projects (chromium, firefox, webkit) and **excludes**
`visual.spec.ts` unless `PW_INCLUDE_VISUAL=1`. Browser-independent contract assertions should carry
`test.skip(({ browserName }) => browserName !== 'chromium', …)`, and forced-colours emulation is
**Chromium-only** — both idioms are in `sk-context-nav.spec.ts:262` and `:1035`.

**Correction to the spec, recorded because the repository wins.** `spec.md`'s SC-004 says the
Playwright spec "passes under `npm run test`". It does not: `npm run test` is `vitest run`
(`package.json`), whose config does not include `apps/storybook/src/tests`. The correct command is
`npx playwright test`, which is what `ci-quality.yml`'s `playwright` job runs (line 506). SC-004 is
otherwise correct in every particular; only its command name is wrong.

What the spec file must assert (NFR-003 – NFR-008, SC-004), in the two-`describe` shape
`sk-context-nav.spec.ts` establishes:

*Source/distribution contract (chromium-only, no page needed):*
- the exact public class inventory of `sk-public-header.css` equals the six classes in §4.2 (via
  `postcss` + `postcss-selector-parser`, as at `sk-context-nav.spec.ts:89-98`);
- the sheet contains no `.sk-button`, no `sk-theme-toggle`, no `::part(`, no `:host`, no
  `.sk-light`/`data-theme`/`:root`/`:host-context`, no `[dir="rtl"]`, no physical
  left/right property, no `order`/`*-reverse`, no `position: sticky|fixed`, no `transition`/
  `animation`, no literal `44px`;
- every system-colour keyword appears only inside `@media (forced-colors: active)`;
- `min-block-size`/`min-inline-size` on `.sk-public-header__action` resolve through a `--sk-space-*`
  token;
- `check-component-token-literals.mjs` exits clean for the sheet (`execFileSync`, as at line 320);
- the eight fixtures generate exactly the eight expected barrel exports, each carrying a real
  `<header class="sk-public-header">`, no `role=`, no `tabindex=`, no `<sk-public-header>` tag, no
  `data-od-id`;
- `packages/styles/src/index.ts` exports `./public-header/index`; `packages/styles/package.json`
  exposes `./public-header/*`;
- absence from `packages/elements/src`, `packages/react/src`, `custom-elements.json`, `vue.d.ts`,
  `expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json` (SC-008, SC-009);
- `expected-stories.json`'s `byElement["sk-public-header"]` equals the story-id list exactly;
- the `## Public header` section of `using-components.md` exists and names the anatomy classes, the
  three consumer obligations, `aria-current`, the #323 deferral, ADR-10, and the four
  near-neighbours it is not (`sk-app-shell`, `sk-page-header`, `sk-nav-pill`, `sk-skip-link` —
  FR-020); and its documented token list equals the sheet's actual `var(--sk-*)` set (the equality
  check at `sk-context-nav.spec.ts:444-448`).

*Live semantics and geometry:*
- **accessibility tree (NFR-006)**: exactly one `banner`; `navigation` present **iff** an action
  region exists, always with a non-empty accessible name; brand-only exposes **zero** `navigation`
  roles; DOM order equals Tab order (the sentinel-button technique at
  `sk-context-nav.spec.ts:524-549`); asserted via a Chromium CDP `Accessibility.getPartialAXTree`
  snapshot for the landmark shape;
- **target size (NFR-005)**: every `.sk-public-header__action` has `boundingBox().width >= 44` and
  `.height >= 44` at 390px **and** 1440px; **plus** a floor assertion that the count of
  `.sk-public-header__actions > *` equals the count of `.sk-public-header__action` in every fixture
  that has actions, and that the count is non-zero — otherwise the size assertion passes vacuously
  over an empty selector;
- **no root overflow (NFR-003)**: `scrollWidth <= clientWidth` at 390×720, 1440×900, and a
  200%-zoom emulation (720×450 viewport with `deviceScaleFactor` doubling — or the halved-viewport
  approximation the spec names), plus a short-viewport pass;
- **no clipped focus (NFR-004)**: the `focusVisibility()` helper shape at
  `sk-context-nav.spec.ts:181-220` — outline non-`none`, positive width, box+outline within the
  viewport, and not clipped by an `overflow: hidden` ancestor;
- **forced colours (NFR-007)**: under `emulateMedia({ forcedColors: 'active' })`, the header's
  `borderBlockEndStyle` is non-`none`, its `borderBlockEndColor` differs from its background, and a
  focused action's `outlineStyle`/`outlineWidth` survive;
- **no colour alone**: rest / hover / active / focus-visible / `aria-current` produce **five
  distinct non-colour cue signatures** (the `nonColourCue` set-size assertion at
  `sk-context-nav.spec.ts:839`), and `aria-current="false"` is styled identically to no attribute;
- **reduced motion (NFR-008)**: under `emulateMedia({ reducedMotion: 'reduce' })`,
  `transitionDuration === '0s'` and `animationName === 'none'` on the header, the inner row and the
  brand — deliberately **not** on `.sk-public-header__action` (§4.6);
- **RTL (FR-010)**: with `dir="rtl"`, computed `direction` is `rtl`, the brand's box is at the
  inline start (visually right), no `[dir="rtl"]` rule exists in the sheet, and no layout property
  changed;
- **LightMode**: a real `.sk-light` ancestor exists and at least one computed value differs from the
  dark story (CLAUDE.md §9 — *"assert the computed value differs between themes"*, do not assume);
- **zero actions**: brand-only renders no `<nav>` element at all and no empty landmark.

### 9.5 Visual regression — CI-authoritative

```bash
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

**Posture (NFR-009, SC-005):** the two new PNGs are **harvested from the `visual-regression-diffs`
artifact of a CI run on this PR** and committed. **Never run `--update-snapshots` locally.** Local
font rasterization differs and the screenshots are clipped to the component, so box dimensions are
part of the assertion and a locally-shot baseline fails CI on dimensions alone
(`adding-a-component.md:466-469`; `visual.spec.ts:29-32`). The practical sequence: add the two
tests with no PNG, push, let CI fail, download the artifact, commit the PNGs, push again.

### 9.6 The gates' own probe tables, and the final hygiene sweep

```bash
node scripts/check-gate-wiring.mjs --selftest && node scripts/check-gate-wiring.mjs
node scripts/check-story-theme-wrapper.mjs --selftest && node scripts/check-story-theme-wrapper.mjs
git add -A && git status --porcelain      # must be EMPTY before opening the PR
```

The last line is the real signal: blocks 9.1's regenerate and its `--check` are self-confirming
locally (the check compares against what the generator just wrote), so an unstaged generated file
is the only thing that distinguishes "green locally" from "green in CI"
(`adding-a-component.md:447-453`).

### 9.7 Commands from the recipe deliberately **not** run

`npm run test` (Vitest) — this family adds no Vitest test and no `fixtures/elements-behaviour/`
file; it still runs in CI and must stay green by being unaffected. `node scripts/suite-selftest.mjs`
— the mutation harness, driven by `behaviours.json`/`mutations.json`, to which this family adds
nothing. Neither is a gate this Work Package can move; both are gates it must not break.

---

## 10. Environment hazards — implementation constraints, not advice

These three are stated as **constraints on the implementer**, because each has produced a false
green or a false red in this ecosystem already.

**(a) Port 6006 is shared, and Playwright will silently reuse a sibling mission's Storybook.**
`playwright.config.ts` hardcodes `baseURL: 'http://localhost:6006'` and
`webServer.reuseExistingServer: !process.env['CI']`. Sibling mission checkouts live under the same
parent directory (`…/spec-kitty-design-missions/354`, `…/355`) and each serves its own
`storybook-static` on the same port. If one of them is already serving, **this mission's Playwright
run will test that build** — a green run against another mission's stories, or a red run reporting
failures in code this branch does not contain.

*Constraint.* Before any Playwright run: `ss -ltnp | grep :6006` (or `lsof -i :6006`) must show
nothing, or must show a process whose CWD is **this** checkout. Verify the build under test is this
one — e.g. confirm `apps/storybook/storybook-static/index.json` in this checkout contains the
`sk-public-header` ids and that the served page does too. Do not "fix" a mysterious failure by
rebuilding; check the port first. Setting `CI=1` for a local run forces a fresh server and is the
blunt remedy.

**(b) `scripts/measure-elements-sizes.mjs` reads `dist/` and does not build it.**
`adding-a-component.md:461-464` states this outright: running it without building first records the
bytes of whatever `dist/` happens to be on disk, and the symptom is CI reporting different numbers
for the same commit — *"which looks like non-reproducibility and is not."* This family ships nothing
into `packages/elements/dist`, so `measure-elements-sizes.mjs --check` should be **unaffected**.

*Constraint.* If `--check` reports drift, that is **not** a signal to regenerate `SIZES.md` — it
means either the local `dist/` is stale (build first:
`npx nx run-many --target=build --projects=tokens,styles,elements`) or this Work Package has
touched the elements package, which it must not. Never commit a `SIZES.md` change from this
mission without first establishing which of those two it is.

**(c) Nx serves cached artifacts to `--check` comparisons.**
Anything driven through `nx` (`nx run styles:lint`, `nx run storybook:storybook:build`,
`nx run-many --target=build`) may be replayed from cache. A cached build compared by a `--check`
step is a stale artifact compared against itself, and it reports green.

*Constraint.* Pass `--skip-nx-cache` on every `nx` invocation whose output feeds a drift check or a
gate, and on the Storybook build before the axe and Playwright runs.

---

## 11. Risks and mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | The 44px floor assertion passes **vacuously** because a fixture's actions do not carry `.sk-public-header__action`, so the selector matches nothing | Medium | High — the mission's headline accessibility claim becomes untestable while reporting green | Assert a non-zero floor and set-equality between `.sk-public-header__actions > *` and `.sk-public-header__action` in every action-bearing fixture (§9.4). A gate over an empty set is a gate that certifies nothing |
| R-02 | The implementer "fixes" the 44px floor by writing a rule against `.sk-button--sm`, or neutralizes a transition by writing `.sk-button { transition: none }` | Medium | High — silent C-007 violation that every geometric assertion would still pass | The source-contract assertion in §9.4 fails on any `.sk-button` selector in the sheet, by name. This is the single most important assertion in the spec file |
| R-03 | A sibling mission's Storybook on port 6006 produces a false green or a false red | Medium | High — wasted debugging, or a merged PR whose tests never ran against its own build | Hazard §10(a): check the port before every run; `CI=1` forces a fresh server |
| R-04 | Baselines shot locally look correct and fail CI on dimensions alone | Medium | Medium — a red PR that reads as a real regression | §9.5: harvest from `visual-regression-diffs`; never `--update-snapshots` |
| R-05 | Story ids are hand-derived and do not match the built index; the axe gate fails by name | Medium | Low — loud and immediate | Read them off `storybook-static/index.json` after the build (§7) |
| R-06 | `expected-stories.json`'s `total` and the new list are edited out of step | Medium | Low — `run-axe-storybook.js:642-645` fails loudly | Edit both in one change; the gate is the check |
| R-07 | `packages/styles/src/index.ts` line or the `package.json` `exports` entry is forgotten. **No repository gate catches either** — the barrel's own comment says the per-directory half is hand-maintained (#156) | Medium | Medium — the family ships unimportable, and only a consumer discovers it | The mission's own Playwright spec asserts both, in the `sk-context-nav.spec.ts:420-423` shape. This is the only thing standing between the omission and a silent ship |
| R-08 | The train moves under the branch (a sibling Wave-1 mission merges first), invalidating both the green CI and the adversarial-gate evidence | High — #354 and five other Wave-1 issues are live | Medium | `elements-first-run-prompt.md:300-310`: rebase, force-with-lease, **re-run the gate and post fresh evidence**. Do not merge on evidence whose SHA is not the head. `expected-stories.json` and `visual.spec.ts` are the two files most likely to conflict |
| R-09 | `flex-wrap` + `space-between` produces an odd stretched line when the row wraps | Medium | Low — visible in the narrow story | §5: the fixtures and the 390px assertions decide the spelling; both candidate spellings are ordinary flex |
| R-10 | The generator edit (§2) is made *after* running the generator, producing a "stale" report against a hand-written file | Low | Low — confusing but loud | §2's ordering constraint: edit the script, then run it |
| R-11 | #323 lands mid-mission and the implementer upgrades the blocked story without re-verifying the composition | Low | Medium — an unproven claim in a shipped story | The plan of record is the blocked story. An upgrade requires the real element's contract to be read and the composition assertions to be added, or it stays blocked |
| R-12 | A reviewer asks for a `--compact` or `--sticky` modifier because the corpus "nearly" needs one | Low | Medium — scope creep into a stated non-goal | C-009 and the issue's non-goals list. Sticky behaviour is explicitly out; the corpus's own headers are `position: static` (verified — no `position: sticky` on any of the 23 `.topnav` elements) |

---

## 12. What this mission will NOT do

The issue's non-goals, restated as plan boundaries. Each is a thing a reviewer may check for and
find absent.

1. **No custom element.** No `packages/elements/src/public-header/`, no `.markup.ts`, no
   `custom-elements.json` entry, no React wrapper, no `vue.d.ts` entry, no `expected-docs.json` row,
   no `::part()`, no `expected-parts.json` row.
2. **No authenticated app chrome.** `sk-app-shell` remains the single source of truth for it. This
   family restates none of it (FR-020).
3. **No content/page header.** `sk-page-header` remains the content-heading surface.
4. **No primary-navigation mode.** `sk-nav-pill` remains that.
5. **No skip-link presentation.** `sk-skip-link` remains that.
6. **No router and no route inference.** `aria-current` is consumer-supplied per render; the family
   styles its presence and infers nothing (C-010).
7. **No auth or session state.** The family cannot tell a signed-in page from a signed-out one and
   must not try.
8. **No drawer, menu, overflow affordance, or "more" collapse.** Many actions wrap onto more lines.
   There is no JavaScript in this family at all.
9. **No theme-state mechanism, no theme control, no theme persistence.** #323 owns the control;
   Team Kitty owns the state. See §7.
10. **No brand/logo component and no account menu.** The brand is a consumer-authored anchor with
    consumer-authored content.
11. **No sticky or scroll-linked behaviour.** No `position: sticky|fixed`, no scroll listeners
    (C-009).
12. **No copy defaults.** The family selects no string — not `Sign in`, not `Start free`, not an
    `aria-label`, not a year. Every literal stays consumer-supplied and translatable under #286
    (C-006, FR-008).
13. **No full public-page layout.** No page-width container, no centering, no main-content region,
    no footer. The consumer's own wrapper owns page width (FR-002, §5).
14. **No icon-only collapse by CSS.** No `display:none`/`visibility:hidden`/clip on action text at
    any width (FR-016).
15. **No theme selector in the component CSS.** Light-mode variance is tokens only (C-004), for the
    reason the spec's "Theme-selector reasoning for a component with no shadow root" section
    records — reason **B** (tokens are the single channel), not reason A (shadow-root inertness),
    which does not apply here.
16. **No ADR.** ADRs are written only in #67.
17. **No `spec-kitty tasks` run in this phase.** Work-package decomposition is the next phase's.

---

## Implementation Concern Map

> These are architectural concerns, **not** work packages and **not** executable units. The issue
> mandates exactly one Work Package; `spec-kitty tasks` will fold all five concerns into it.

### IC-01 — Family stylesheet and anatomy

- **Purpose**: author `sk-public-header.css` — the six-class anatomy, the flex-wrap row, the
  logical properties, the focus and current-item cues, the forced-colours block, and the 44px floor
  on `.sk-public-header__action`.
- **Relevant requirements**: FR-001 – FR-003, FR-005, FR-007, FR-010 – FR-016, C-001, C-002,
  C-004, C-007, C-009, NFR-001.
- **Affected surfaces**: `packages/styles/src/public-header/sk-public-header.css`.
- **Sequencing/depends-on**: none.
- **Risks**: R-02 (reach-through), R-09 (wrap spelling).

### IC-02 — Static fixtures and the generated barrel

- **Purpose**: author the eight `.html` fixtures — one per structural shape — and produce
  `index.ts` through the generator, including the generator's `adrNote` branch (§2).
- **Relevant requirements**: FR-004 – FR-006, FR-009, FR-019, C-003, C-008, NFR-010, SC-001.
- **Affected surfaces**: `packages/styles/src/public-header/*.html`,
  `packages/styles/src/public-header/index.ts` (generated), `scripts/build-styles-only-markup.mjs`.
- **Sequencing/depends-on**: IC-01 (the fixtures carry the classes the sheet defines).
- **Risks**: R-10 (generator edit ordering).

### IC-03 — Distribution surface

- **Purpose**: make the family importable — the `packages/styles/src/index.ts` line and the
  `packages/styles/package.json` `exports` entry.
- **Relevant requirements**: FR-009, FR-019.
- **Affected surfaces**: `packages/styles/src/index.ts`, `packages/styles/package.json`.
- **Sequencing/depends-on**: IC-02 (the barrel must exist to be re-exported).
- **Risks**: **R-07 — no repository gate catches an omission here.** The mission's own spec is the
  only check.

### IC-04 — Storybook evidence and ratchets

- **Purpose**: the CSF file with thirteen stories, the `expected-stories.json` entry and `total`,
  and the two `visual.spec.ts` baselines.
- **Relevant requirements**: FR-017, NFR-002, NFR-009, NFR-011, SC-003, SC-005, SC-006, SC-010,
  SC-011.
- **Affected surfaces**: `packages/styles/src/public-header/sk-public-header-html.stories.ts`,
  `expected-stories.json`, `apps/storybook/src/tests/visual.spec.ts` and its `-snapshots/`.
- **Sequencing/depends-on**: IC-02.
- **Risks**: R-04 (local baselines), R-05 (hand-derived ids), R-06 (`total` drift), R-11 (#323).

### IC-05 — Machine-checkable contract and usage documentation

- **Purpose**: the Playwright spec (source-contract + live-semantics describes) and the
  `## Public header` usage-doc section, which that spec asserts.
- **Relevant requirements**: FR-018, FR-020, NFR-003 – NFR-008, SC-004, SC-007 – SC-009, SC-012,
  SC-013.
- **Affected surfaces**: `apps/storybook/src/tests/sk-public-header.spec.ts`,
  `docs/design-system/using-components.md`.
- **Sequencing/depends-on**: IC-01, IC-02, IC-04.
- **Risks**: R-01 (vacuous target-size assertion), R-03 (port 6006), R-07.

---

## Deferred plan-interview questions

`spec-kitty plan` ran non-interactively and recorded three Decision Moments as **deferred**
(`decisions/index.json`): `plan.approach`, `plan.risks`, `plan.dependencies`. They are answered in
substance by this document — approach in §§4–7, risks in §11, dependencies in §7 and the spec's
"Cross-mission / dependency" section — and are left recorded as deferred rather than
back-filled, because a Decision Moment records what a human was asked and answered, and no human
was asked.

## Open decisions

**None.** The one `[NEEDS DECISION]` this spec carried (target-size mechanism) was resolved from
repository precedent and committed in `d24aadb`. Every other fork this plan encountered — the
generator's `adrNote` branch (§2), the wrap mechanism (§5), the absence of a reduced-motion guard
(§4.6), the path-filter question (§3), the demo-page question (§1.5), the stylelint-config question
(§1.5) — was settled by a named file in this repository, and each is cited at the point of use. If
the implementer or a reviewer finds a fork this plan did not name, the rule is
`elements-first-run-prompt.md:163-169`: stop that thread, state the fork and the options, and do not
decide it silently.
