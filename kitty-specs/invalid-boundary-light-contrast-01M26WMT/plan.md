# Implementation Plan: Invalid-state control boundary contrast, light theme

**Branch**: `mission/invalid-boundary-light-contrast` | **Date**: 2026-09-11 | **Spec**: [`spec.md`](./spec.md)
**Input**: `kitty-specs/invalid-boundary-light-contrast-01M26WMT/spec.md` (`cacefc3d`) — 13 FR, 6 NFR, 8 C, 10 SC
**Repository**: `spec-kitty/spec-kitty-design` | **Base**: `train/elements-first` @ `93c82f14` (verified: `git branch --contains 93c82f14` lists `train/elements-first`, and `93c82f14` is the tip of `origin/train/elements-first`)
**Issue**: #350 (`Refs #350`, never `Closes` — C-001/FR-013)

Every number in this document was recomputed in this checkout with the WCAG relative-luminance
formula from the literal hexes in `packages/tokens/src/tokens.css` at `93c82f14`. Every repository
claim was re-derived by reading the file named beside it. Where this plan and the mission brief
disagree, the plan states the repository's answer and names the file.

---

## Summary

`--sk-color-red: #E97373` (`packages/tokens/src/tokens.css:24`) carries **three mutually
incompatible contrast contracts at once** and has no light-theme override. This plan **rejects
Option A** (re-theming `--sk-color-red`) on an arithmetic impossibility proof, and adopts
**Option B**: split the two contracts that the invalid state actually needs into two new,
independently-declared tokens — `--sk-border-control-invalid` (non-text boundary, WCAG 1.4.11
≥3:1) and `--sk-fg-error` (error copy, WCAG 1.4.3 ≥4.5:1) — leaving `--sk-color-red` untouched for
its remaining decorative uses. Both new tokens are declared as hex literals in **both** theme
blocks, using **only colour values that already exist and are already ratified in `tokens.css`
today**: `#E97373` (dark, identical to the current rendering) and `#6B2424` (light, the value
`--sk-on-tint-rose` already carries, derived and ratified under #177/#217).

The guard in `tests/node/form-input-border-control-contrast.test.ts` grows to **discover** the
token the invalid rule actually references (rather than hard-coding one), resolve it per theme
**through the CSS cascade including the `:root` fallback**, and assert an absolute floor, a
relational floor against `--sk-border-control`, and a dark non-regression floor across **five**
surfaces. The cascade fallback is what makes the guard go red against the unmodified tree at
`93c82f14`.

One Work Package. One PR into `train/elements-first`.

---

## Technical Context

**Language/Version**: CSS custom properties (`--sk-*` namespace, ADR-003); TypeScript 5.x for the
Node-lane guard and Storybook stories; Node ≥20 for the generator scripts.
**Primary Dependencies**: `postcss` (already the guard's parser and the parser used by
`check-element-css-hygiene.mjs`); Vitest 4 (node project); Playwright (visual + axe layers);
Storybook (web-components).
**Storage**: N/A — presentation tokens only. No data entity (spec "Key Entities: None").
**Testing**: Node-lane Vitest for the contrast guard; Playwright `visual.spec.ts` for baselines;
`scripts/run-axe-storybook.js` for WCAG 2.1 AA; the repository's ENFORCED drift gates for every
generated artifact.
**Target Platform**: Browsers consuming `@spec-kitty/tokens`, `@spec-kitty/styles`,
`@spec-kitty/elements`.
**Project Type**: nx monorepo, `packages/*` + `apps/storybook` + root `tests/` + root `scripts/`.
**Performance Goals**: None in scope. (The charter's "token file under 20 KB uncompressed" line is
**stale and repository-contradicted** — `docs/contributing/adding-a-token.md` step 5 records that
the file measured 23,857 bytes at `train/elements-first@32fa495` and that no gate has ever enforced
the number. This plan adds ~14 lines of declaration plus derivation comments; no gate reacts.)
**Constraints**: C-001…C-008 from the spec, plus the environment constraints in §10 below.
**Scale/Scope**: 4 new token declarations, 8 repointed `var()` references across 4 component
sheets, 1 grown test file, 4 new Storybook stories, 4 new visual tests, 1 changelog entry, and
5 regenerated artifacts.

### Deferred plan-interview decision moments, answered here

`spec-kitty plan` ran non-interactively and recorded three deferred decision moments
(`decisions/index.json`). They are answered by this document and should be read as resolved:

| Decision moment | Question | Answer |
|---|---|---|
| `01M2709QK1QPJXSWXPW52AQGH6` (`plan.approach`) | High-level implementation approach? | **Option B, two-token split** — §2. |
| `01M2709QKHV5ST5WN7M5T93MKG` (`plan.risks`) | Main risks or unknowns? | §9 (Risks), plus the one open `[NEEDS DECISION]` in §11. |
| `01M2709QM1SB95NMY2TD0ZJS3F` (`plan.dependencies`) | Upstream dependencies? | None. The mission is self-contained on `train/elements-first@93c82f14`; it depends on no unmerged PR, and it must be **rebased onto the train tip immediately before implementation** (see §9 R-5). |

---

## 1. Verified state — re-measured in this checkout, not quoted

### 1.1 The defect

`--sk-color-red: #E97373` is declared exactly once, at `tokens.css:24`, inside the root `:root`
block. `grep -n -- '--sk-color-red' packages/tokens/src/tokens.css` returns four hits: line 24
(the declaration), line 25 (`--sk-color-red-soft`), line 52 (inside the `--sk-surface-tint-rose`
derivation comment) and line 83 (`--sk-on-tint-rose: var(--sk-color-red);`). Reading
`tokens.css:384-536` in full confirms the light block contains **no** `--sk-color-red`
declaration. The only light-block occurrence of the *value* is `--sk-on-tint-rose: #6B2424`
(`tokens.css:467`), a different token.

| surface (light) | invalid `#E97373` | resting `#7A7A6E` | inverted? |
|---|---|---|---|
| `--sk-surface-page` `#F8F5EC` | **2.69** | 3.98 | yes |
| `--sk-surface-card` `#FFFFFF` | **2.93** | 4.34 | yes |
| `--sk-surface-input` `#F5F1E6` | **2.60** | 3.85 | yes |
| `--sk-surface-pill` `#ECE7D8` | **2.37** | 3.51 | yes |
| `--sk-surface-muted` `#E8E2D0` | **2.26** | 3.35 | yes |

| surface (dark) | invalid `#E97373` | resting `#81818B` | ordered? |
|---|---|---|---|
| `--sk-surface-page` `#0D0E11` | 6.58 | 5.01 | yes |
| `--sk-surface-card` `#181A1F` | 5.94 | 4.51 | yes |
| `--sk-surface-input` `#1C1F25` | 5.63 | 4.28 | yes |
| `--sk-surface-pill` `#212830` | 5.08 | 3.86 | yes |
| `--sk-surface-muted` `#262C36` | 4.79 | 3.64 | yes |

All ten of the brief's figures reproduce exactly. Light fails the absolute 3:1 floor on all five
surfaces *and* is below the resting boundary on all five. Dark is correctly ordered and must not
regress.

### 1.2 Consumers — re-verified, with two corrections to the spec

`git grep -c -- '--sk-color-red' -- 'packages/**'` at `93c82f14`:

| file | hits | what they are |
|---|---|---|
| `packages/styles/src/form-field/sk-form-field.css` | 3 | `.sk-form-field--error .sk-form-field__description` (**text**, L27); `.sk-input[aria-invalid="true"]` (**border**, L82); `.sk-textarea[aria-invalid="true"]` (**border**, L123) |
| `packages/styles/src/form-input/sk-form-input.css` | 2 | `.sk-form-input__control[aria-invalid="true"]` (**border**, L113); `.sk-form-input__error` (**text**, L140) |
| `packages/styles/src/form-select/sk-form-select.css` | 1 | `.sk-form-select:invalid` (**border**, L32) |
| `packages/styles/src/form-textarea/sk-form-textarea.css` | 2 | `.sk-form-textarea__control[aria-invalid="true"]` (**border**, L107); `.sk-form-textarea__error` (**text**, L134) |
| `packages/styles/src/ribbon-card/sk-ribbon-card.css` | 2 | `.sk-ribbon-card__ribbon--red` (**background fill**, paired with `--sk-fg-on-primary`, L122); `.sk-ribbon-card--border-red` (**decorative border**, L146) |
| `packages/styles/src/status-indicator/sk-status-indicator.css` | 3 | **all three inside one comment** (L56-65). Zero live declarations. |
| `packages/styles/src/transition-matrix/sk-transition-matrix.css` | 1 | `.sk-transition-matrix__row--blocked` / legend icon (L90) |

The brief's "6 live consumers, not 7" and "5 touch the boundary-shape defect" are both confirmed.
Two refinements the plan needs and the spec did not have:

**Correction 1 — `transition-matrix` is not a text consumer.** The spec's blast-radius table calls
`.sk-transition-matrix__row--blocked` a "TEXT + icon color". Read against the sheet, every text
cell inside that row re-declares its own colour: `__route` and `__route--heading`, `__value`,
`__total` and `thead th` all set `--sk-fg-body` or `--sk-fg-muted`. What `--sk-color-red` actually
paints is the legend `<svg>` icon and `.sk-transition-matrix__bar { background: currentColor }` —
**graphics, not text**. This is why the existing `sk-transition-matrix-light.png` baseline and the
axe gate are both green today at 2.93:1 against the white card: axe's `color-contrast` rule is
text-only, and non-text 1.4.11 is not in its default `wcag2aa` set. Consequence: transition-matrix
carries **no 4.5:1 obligation** and stays untouched by this mission. Only **three** declarations
carry the text contract, not four.

**Correction 2 — the generated and documentation surfaces the spec's `packages/**` scope did not
count.** `git grep -c -- '--sk-color-red'` also hits `packages/elements/src/form-input/sk-form-input.css.js`,
`.../form-textarea/sk-form-textarea.css.js`, `.../ribbon-card/sk-ribbon-card.css.js`,
`.../transition-matrix/sk-transition-matrix.css.js` (generated mirrors of the sheets above, owned
by `node scripts/build-elements-css.mjs`), plus `packages/elements/custom-elements.json`,
`packages/elements/vue.d.ts`, `packages/react/src/SkTransitionMatrix.d.ts` and
`packages/elements/src/transition-matrix/sk-transition-matrix.{ts,stories.ts}` — all of which carry
the **transition-matrix JSDoc "Token dependencies:" list only**. `sk-form-input.ts` and
`sk-form-textarea.ts` carry no such list (verified: `grep -n 'Token dependencies'` returns nothing
for either). Since transition-matrix is untouched, none of those four declaration surfaces move.
Outside `packages/**`, `apps/storybook/src/stories/tokens/brand.mdx` (8) and `colours.mdx` (2)
render `--sk-color-red` as a documentation swatch — a real Option-A blast-radius surface that the
spec's `packages/**` grep could not see, and another reason Option A is worse than it looked.

### 1.3 Visual coverage today — and one story that does not exist

Read from `apps/storybook/src/tests/visual.spec.ts` and
`apps/storybook/src/tests/visual.spec.ts-snapshots/`:

| consumer | light baseline | exercises red? |
|---|---|---|
| `form-field` static path | `sk-input-light.png` (default state) | no. `sk-input-invalid.png` is **dark**. `.sk-textarea` has no baseline at all. |
| `form-input` element path | `sk-form-input-light.png` (default) | no. `sk-form-input-invalid.png` is **dark**. |
| `form-select` | `sk-form-select-light.png` (default) | no. `sk-form-select-invalid.png` is **dark**. |
| `form-textarea` element path | **none of any kind** | n/a |
| `ribbon-card` | `LightMode` story exists, is not wired into `visual.spec.ts` | **no — and the story renders yellow/green/purple only.** `SkRibbonCardBorderRedHTML` and `SkRibbonCardRibbonRedHTML` are published exports that **no Storybook story renders anywhere**. `WithRibbon` renders the *yellow* ribbon. |
| `transition-matrix` | `sk-transition-matrix-light.png` | **yes** — the one existing light baseline that paints `--sk-color-red`. |

The spec's proposed mitigation for Option A ("wire ribbon-card's `LightMode` story into the visual
suite") **would not work**: that story contains no red variant. Wiring it would evidence nothing.

---

## 2. THE DECISION — Option B, with a two-token split

### 2.1 Option A is arithmetically impossible, not merely expensive

`--sk-color-red` is consumed by three different contracts. The one that kills Option A is
`ribbon-card`'s fill/foreground pair:

```css
.sk-ribbon-card__ribbon--red { background: var(--sk-color-red); color: var(--sk-fg-on-primary); }
```

`--sk-fg-on-primary: #1A1408` is declared **once**, at `tokens.css:192`, in the root `:root` block,
and is **not redefined in the light block** (verified by reading `tokens.css:384-536` in full). Its
relative luminance is `L = 0.00737`. The ribbon label is `font-size: var(--sk-text-xs)` (`0.75rem`
= 12px) at `--sk-weight-bold` (700) — 12px bold is **small text** under WCAG, so it needs 4.5:1.
Today the pair measures **6.24:1**.

Now fix Option A's own requirement. FR-003 demands the light invalid boundary reach at least
`--sk-border-control`'s ratio on the same surface — 3.98:1 against the cream page
(`L = 0.91317`). Any candidate hex `X` satisfying that must have

```
(0.91317 + 0.05) / (L_X + 0.05) ≥ 3.98   →   L_X ≤ 0.19200
```

and therefore the very best the ribbon pair can ever reach is

```
(0.19200 + 0.05) / (0.00737 + 0.05) = 4.22:1
```

**4.22 < 4.5.** There is no hex, anywhere in sRGB, that satisfies FR-003 in light theme and leaves
the ribbon pair at AA. Even relaxing FR-003 to FR-002's bare 3:1 floor only raises the ceiling to
`L_X ≤ 0.27106` → **5.60:1**, still a regression from 6.24:1. Worked examples confirm the ceiling
is real and not an artifact of one candidate:

| candidate | light page | light card | light input | light pill | light muted | ribbon pair vs `#1A1408` |
|---|---|---|---|---|---|---|
| `#6B2424` (the brief's mirror of rose) | 10.12 | 11.04 | 9.78 | 8.93 | 8.52 | **1.66** |
| `#8C1D18` | 8.36 | 9.11 | 8.08 | 7.37 | 7.04 | **2.01** |
| `#A02020` | 7.08 | 7.71 | 6.84 | 6.24 | 5.96 | **2.37** |
| `#B3261E` | 6.00 | 6.54 | 5.79 | 5.29 | 5.05 | **2.80** |
| `#C62828` (a deliberately light red) | 5.16 | 5.62 | 4.98 | 4.55 | 4.34 | **3.26** |

Every row clears FR-002 and FR-003 on all five light surfaces. **Every row fails the ribbon pair**,
and the last row shows why pushing lighter does not rescue it: `#C62828` clears every relational
floor with room to spare and its ribbon pair is still only 3.26:1, because the algebra above caps it
at 4.22:1 no matter how the remaining headroom is spent. **Option A cannot be made to work.**

And it would fail *invisibly*: since no Storybook story renders either red ribbon-card variant, no
visual baseline, no axe run and no gate in this repository would catch the regression. A published
`@spec-kitty/styles` export would silently drop to 1.66:1 in light theme.

Option A's secondary costs are real but secondary: it also moves the two `brand.mdx`/`colours.mdx`
documentation swatches, and it would change `sk-transition-matrix-light.png` (a re-baseline for a
component with no defect).

### 2.2 The repository already argues for Option B, twice, in its own words

`tokens.css:199-208`, the `--sk-border-control` declaration comment written by #321:

> An INDEPENDENTLY DECLARED LITERAL, deliberately NOT `var(--sk-fg-subtle)`: aliasing would couple
> this border's 3:1 non-text obligation to a token that moves for an unrelated text-contrast
> (4.5:1) reason, and `check-token-breaking-changes.sh` computes no contrast, so nothing would
> catch a future silent regression of that coupling.

That is precisely the defect `--sk-color-red` has today, one level worse: it couples a 3:1 non-text
boundary contract (5 declarations), a 4.5:1 text contract (3 declarations) **and** a fill/paired-
foreground contract (1 declaration) onto one hex.

`sk-status-indicator.css:56-65`, written by #177:

> `--sk-on-tint-rose`, not `--sk-color-red` (#177). … `--sk-color-red` is defined only in `:root`
> and never redefined for `.sk-light`, so danger was the one tone whose marker did not follow the
> theme.

`status-indicator` already solved this exact problem, for itself, by giving the role its own
themed token rather than re-theming `--sk-color-red`. Option B is the repository's established
answer, applied consistently instead of per-component.

### 2.3 Why TWO tokens and not one

The invalid state has two contracts, and the `--sk-border-control` comment above is a standing
instruction not to fuse them:

- `--sk-border-control-invalid` — the `[aria-invalid="true"]` / `:invalid` **boundary**. Contract:
  WCAG 1.4.11 ≥3:1 non-text, **and** ≥ `--sk-border-control` on the same surface/theme (FR-003).
- `--sk-fg-error` — the **error copy** rendered beside that control. Contract: WCAG 1.4.3 ≥4.5:1
  for small text.

A single token would recreate today's coupling on day one. Both categories (`border`, `fg`) already
exist in `packages/tokens/dist/token-catalogue.json` (9 and 7 tokens respectively), so **no new
category is created** and C-006's documentation obligation is **not** triggered.

### 2.4 Why the error-copy repoint is *forced*, not scope creep

This is the fork the spec anticipated ("a further split … the plan phase must record that as a
finding"), and it resolves in the opposite direction from the one the spec imagined. It is forced
by two of the mission's own requirements colliding:

1. **NFR-004/FR-007** require, for every consumer whose light rendering changes, a light-mode
   visual-regression assertion exercising the changed state. Four consumers change. So four new
   light+invalid stories must exist.
2. **NFR-006/SC-008** require zero axe WCAG 2.1 AA violations on every story added.
   `scripts/run-axe-storybook.js` enumerates **every** story in `storybook-static/index.json` and
   has **no skip mechanism** (the script says so explicitly at line 718: "#69 deleted
   `UNRENDERABLE_IMPORT_PATTERN`, so there is no filtered subset; if a skip mechanism is ever
   reintroduced, it must be reported here explicitly").

A light+invalid story for `form-field`, `form-input` or `form-textarea` necessarily renders the
error copy: the static markup export `SkFormInputErrorHTML` embeds the `<span role="alert">`, and
`<sk-form-input>`'s own shadow DOM shows `.sk-form-input__error` whenever `:host([invalid])`. At
`#E97373` on a light surface that copy measures **2.60–2.93:1** at 12px — a hard `color-contrast`
violation that would red the ENFORCED axe gate.

There is no way to author the required evidence without fixing the copy. Suppressing the copy would
mean inventing a new generated markup variant (`build-element-markup.mjs`) that ships a fake
composition as a published export, and is impossible for the element path at all. So: **repoint the
three error-copy declarations too**. They live in three files this mission already edits, add zero
files to the diff, and change **nothing** in dark theme.

This is also the closure of an open note the repository already carries. `expected-inert-theme-wrappers.json:31`:

> `sk-form-field.css` has the same shape the log names — `.sk-form-field--error .sk-form-field__description`
> uses a raw `var(--sk-color-red)` against a tint surface — and it should be measured by someone who
> can run axe.

Measured: 2.69/2.93/2.60 on page/card/input, 2.42:1 on `--sk-surface-tint-rose`. It is a live AA
failure and this mission closes it as the entry cost of its own evidence.

### 2.5 The values — no new colour is introduced

| token | dark (`:root`) | light (`:root[data-theme="light"], .sk-light`) |
|---|---|---|
| `--sk-border-control-invalid` | `#E97373` | `#6B2424` |
| `--sk-fg-error` | `#E97373` | `#6B2424` |

Both literals **already exist in `tokens.css` today**: `#E97373` is `--sk-color-red` (`:root`, L24)
and `#6B2424` is `--sk-on-tint-rose` (light block, L467), derived in HLS at hue 0°, L 0.28, inside
the tint family's 0.237–0.355 ink band, and ratified by the operator under #217 (the derivation is
recorded beside the declaration and in `docs/contributing/adding-a-token.md`). **This mission adds
token *names*, not token *values*.** Every question in `adding-a-token.md`'s "Completing a family
is not the same as introducing a hue" test is therefore moot — no hue, no band, no new literal.
That materially narrows what the C-002 human sign-off is being asked to approve.

They are declared as **independent literals, not `var()` aliases**, for exactly the reason
`tokens.css:199-208` gives for `--sk-border-control`: aliasing `--sk-color-red` (dark) or
`--sk-on-tint-rose` (light) would re-couple a 3:1 non-text obligation and a 4.5:1 text obligation to
tokens that move for unrelated reasons (`--sk-color-red` still serves the ribbon fill and the matrix
bar; `--sk-on-tint-rose`'s own contract is "readable on `--sk-surface-tint-rose`", not "readable on
five neutral surfaces"). It also keeps the guard's resolver on plain hexes in both blocks, which is
the limitation the sibling test's own docstring records.

`--sk-border-control-invalid` and `--sk-fg-error` both parse cleanly under
`scripts/generate-token-catalogue.js`'s regex `/\s(--sk-([a-z][a-z0-9]*)(?:-[a-z0-9]+)+)\s*:/g`,
binning as `border` and `fg`.

### 2.6 The arithmetic, both contracts, both themes, every surface

**Light — `#6B2424`.** Floors: absolute non-text 3.00; relational = `--sk-border-control`'s light
ratio; text 4.50.

| surface | ratio | ≥3.00 (FR-002) | ≥ resting (FR-003) | ≥4.50 (text) |
|---|---|---|---|---|
| `--sk-surface-page` `#F8F5EC` | **10.12** | ✓ | ✓ (vs 3.98) | ✓ |
| `--sk-surface-card` `#FFFFFF` | **11.04** | ✓ | ✓ (vs 4.34) | ✓ |
| `--sk-surface-input` `#F5F1E6` | **9.78** | ✓ | ✓ (vs 3.85) | ✓ |
| `--sk-surface-pill` `#ECE7D8` | **8.93** | ✓ | ✓ (vs 3.51) | ✓ |
| `--sk-surface-muted` `#E8E2D0` | **8.52** | ✓ | ✓ (vs 3.35) | ✓ |
| *(bonus)* `--sk-surface-hero` `#FCFAF4` | 10.57 | ✓ | — | ✓ |
| *(bonus)* `--sk-surface-tint-rose` `#F8E5E5` | 9.11 | ✓ | — | ✓ |

**Dark — `#E97373`, byte-identical to today.** Floors: absolute 3.00; relational; text 4.50; and
FR-004/NFR-003's non-regression floor, which is *the same number* because the value does not move.

| surface | ratio | ≥3.00 | ≥ resting | ≥4.50 (text) | ≥ pre-fix (FR-004) |
|---|---|---|---|---|---|
| `--sk-surface-page` `#0D0E11` | **6.58** | ✓ | ✓ (vs 5.01) | ✓ | ✓ (= 6.58) |
| `--sk-surface-card` `#181A1F` | **5.94** | ✓ | ✓ (vs 4.51) | ✓ | ✓ (= 5.94) |
| `--sk-surface-input` `#1C1F25` | **5.63** | ✓ | ✓ (vs 4.28) | ✓ | ✓ (= 5.63) |
| `--sk-surface-pill` `#212830` | **5.08** | ✓ | ✓ (vs 3.86) | ✓ | ✓ (= 5.08) |
| `--sk-surface-muted` `#262C36` | **4.79** | ✓ | ✓ (vs 3.64) | ✓ | ✓ (= 4.79) |
| *(bonus)* `--sk-surface-hero` `#121317` | 6.33 | ✓ | — | ✓ | — |
| *(bonus)* `--sk-surface-tint-rose` `#2B1515` | 5.87 | ✓ | — | ✓ | — |

Because the dark literal is unchanged, FR-004/NFR-003 are satisfied by construction with zero
headroom spent, and **every existing dark visual baseline stays byte-identical** — which is itself
the proof-of-absence mechanism in §7.

### 2.7 `--sk-color-red` after this mission

It keeps exactly the uses that have no accessibility contract this mission can serve:
`ribbon-card`'s `--red` background fill and decorative `--border-red`, `transition-matrix`'s
blocked-row graphic, the two Storybook token-documentation swatches, and `--sk-on-tint-rose`'s dark
alias. It remains without a light override — which is now **correct rather than defective**, because
it is a brand-hue token in the `--sk-color-*` family, and every other member of that family
(`yellow`, `blue`, `purple`, `green`, `haygold`) is likewise declared once in `:root`.
`--sk-color-red-soft` remains unconsumed anywhere in `packages/**` or `docs/**` and is out of scope.

---

## 3. FORK 2 — the guard covers FIVE surfaces

**Decision: five** (`page`, `card`, `input`, `muted`, `pill`). Three reasons:

1. **A single file must not carry two surface sets.** The new assertions grow inside
   `tests/node/form-input-border-control-contrast.test.ts`, whose `SURFACE_TOKENS` constant already
   lists five. A four-surface invalid set beside a five-surface resting set would read, to any
   future contributor, as a deliberate statement that pill is exempt for the invalid state — which
   is not true and which nothing would ever correct.
2. **FR-003 is a *comparison* on the same surface.** Holding the invalid token to four surfaces
   leaves `--sk-surface-pill` in a state where the resting boundary is guarded and the invalid one
   is not — on the very same CSS rule. That is the exact shape of this bug: one half of a pair
   guarded, the other silently free to move. Reintroducing it inside the fix would be perverse.
3. **Zero marginal cost.** Pill is already measured (light `#6B2424` = 8.93 vs `--sk-border-control`
   3.51; dark `#E97373` = 5.08 vs 3.86) and the chosen value clears it with more headroom than any
   of the other four. The sibling test's own docstring already justifies pill's inclusion ("the
   remaining themed surface in the same family … that a form control could plausibly sit on in a
   future composition"), and #350's four-surface table is a description of where the defect was
   *noticed*, not a scope limit.

Net effect: **20 assertions** for the invalid token (2 themes × 5 surfaces × {absolute, relational})
plus **10** dark non-regression assertions, beside the existing 10 for `--sk-border-control`.

---

## 4. Exact file inventory

### 4.1 Authored by hand

| # | path | change | owner/gate |
|---|---|---|---|
| A1 | `packages/tokens/src/tokens.css` | **`:root` block** (Borders section, after `--sk-border-control` L210): `--sk-border-control-invalid: #E97373;` + derivation comment. **`:root` block** (Foregrounds, near L192): `--sk-fg-error: #E97373;`. **Light block** (`384-536`), mirrored in the same two positions: `--sk-border-control-invalid: #6B2424;`, `--sk-fg-error: #6B2424;`. Four declarations, both blocks (FR-009, C-002). | `stylelint`; `scripts/generate-token-catalogue.js`; `tests/node/form-input-border-control-contrast.test.ts` |
| A2 | `packages/styles/src/form-field/sk-form-field.css` | L27 `--sk-color-red` → `--sk-fg-error`; L82 → `--sk-border-control-invalid`; L123 → `--sk-border-control-invalid` | `stylelint` (catalogue allowlist); `check-component-token-literals.mjs` |
| A3 | `packages/styles/src/form-input/sk-form-input.css` | L113 → `--sk-border-control-invalid`; L140 → `--sk-fg-error` | as above + `check-element-css-hygiene.mjs`, `check-adopted-css-boundaries.mjs` |
| A4 | `packages/styles/src/form-select/sk-form-select.css` | L32 → `--sk-border-control-invalid` (`border-style: double` and `border-width` untouched) | as A2; also asserted by `apps/storybook/src/tests/sk-form-select.spec.ts` |
| A5 | `packages/styles/src/form-textarea/sk-form-textarea.css` | L107 → `--sk-border-control-invalid`; L134 → `--sk-fg-error` | as A3 |
| A6 | `tests/node/form-input-border-control-contrast.test.ts` | grown per §5 | the vitest `node` project |
| A7 | `packages/styles/src/form-field/sk-form-field-html.stories.ts` | new `LightModeError` story wrapping `SkFormInputErrorHTML` + `SkFormTextareaErrorHTML` in `class="sk-light"` | `check-story-theme-wrapper.mjs`; `run-axe-storybook.js` |
| A8 | `packages/styles/src/form-select/sk-form-select-html.stories.ts` | new `LightModeInvalid` story: `storyFrame(SkFormSelectRequiredInvalidHTML, true)` | as A7 |
| A9 | `packages/elements/src/form-input/sk-form-input.stories.ts` | new `LightModeError` story: `.sk-light` wrapper + `<sk-form-input required>` | as A7 |
| A10 | `packages/elements/src/form-textarea/sk-form-textarea.stories.ts` | new `LightModeError` story, same shape | as A7 |
| A11 | `apps/storybook/src/tests/visual.spec.ts` | four new visual tests (§6), each clipped to the component and at `maxDiffPixelRatio: 0.005` | the Playwright visual job |
| A12 | `docs/design-system/changelog.md` | one `## [Unreleased] → ### Changed` entry, modelled on #321's (L11-28), naming both new tokens, both theme values, all twenty measured ratios, and the guard | none mechanical — but the file **is** maintained per token change (#321's entry proves it), so omitting it is a real gap |

### 4.2 Generated — regenerate, never hand-edit (C-007, FR-012)

| # | path | regenerated by | drift gate |
|---|---|---|---|
| G1 | `packages/tokens/dist/token-catalogue.json` | `npx nx run tokens:catalogue` | `scripts/check-token-breaking-changes.sh`; **and it feeds `stylelint.config.mjs`'s allowlist — see §8 ordering** |
| G2 | `packages/elements/src/form-input/sk-form-input.css.js` (+ `.css.d.ts` if the shape changes) | `node scripts/build-elements-css.mjs` | `node scripts/build-elements-css.mjs --check` — **ENFORCED** in `ci-quality.yml` |
| G3 | `packages/elements/src/form-textarea/sk-form-textarea.css.js` (+ `.d.ts`) | as G2 | as G2 |
| G4 | `packages/elements/SIZES.md` | `node scripts/measure-elements-sizes.mjs` **after** `npx nx run elements:build` | `node scripts/measure-elements-sizes.mjs --check` — **ENFORCED**, twice (storybook job and release job) |
| G5 | four new PNGs under `apps/storybook/src/tests/visual.spec.ts-snapshots/` | **harvested from the CI run's artifact** — never `--update-snapshots` locally | the Playwright visual job |

G4 is not optional: `--sk-color-red` (14 chars) → `--sk-border-control-invalid` (27 chars) grows each
of the two element sheets by 13 bytes, so `packages/elements/dist/index.js` and `elements.js` both
move and the committed byte counts go stale.

### 4.3 Explicitly NOT changed — and why

| path | why not |
|---|---|
| `docs/contributing/adding-a-token.md` | **C-006 not triggered.** `border` and `fg` are existing catalogue categories (9 and 7 tokens). *Observation for a follow-up issue, deliberately out of scope:* that file's category table has no `--sk-border-` row at all, although nine such tokens ship. Pre-existing, unrelated to this mission. |
| `docs/design-system/using-tokens.md` | No new category; the file names categories, not individual tokens. *Observation:* line 165 says "all 13 categories"; the catalogue has 16. Pre-existing. |
| `docs/architecture/decisions/ADR-003-addendum-token-values.md` | A **one-time** reconciliation record against the Claude Design reference set, not a living register. Verified: `--sk-border-control` (#321), `--sk-surface-tint-rose` (#177) and every `--sk-chart-*` (#179) are **absent** from it. Adding rows would be inventing a maintenance convention the file does not have. |
| `expected-inert-theme-wrappers.json` | The new stories use `class="sk-light"`, which `check-story-theme-wrapper.mjs`'s `BAD` regex (`/<\w+[^>]*\bdata-theme\s*=\s*["']?light\b/gi`) does not match. The shrink-only count is unchanged and stays valid. |
| `packages/styles/src/status-indicator/sk-status-indicator.css` | C-005. Zero live declarations. |
| `packages/styles/src/ribbon-card/*`, `packages/styles/src/transition-matrix/*` and their `.css.js` mirrors | untouched by Option B — §7. |
| `packages/elements/custom-elements.json`, `vue.d.ts`, `packages/react/src/SkTransitionMatrix.d.ts`, `sk-transition-matrix.{ts,stories.ts}` | their `--sk-color-red` hits are all the transition-matrix "Token dependencies" JSDoc list, and transition-matrix is untouched. `sk-form-input.ts` / `sk-form-textarea.ts` carry no such list. |
| `apps/storybook/src/stories/tokens/brand.mdx`, `colours.mdx` | documentation swatches of `--sk-color-red`, which is unchanged. (Under Option A these would have moved.) |

---

## 5. The guard

### 5.1 Where it lives

**Grow `tests/node/form-input-border-control-contrast.test.ts` in place.** The spec permits a
sibling file; the repository argues against one. FR-003 is a *comparison* between the invalid token
and `--sk-border-control` on the same surface and theme, so a sibling file would have to duplicate
`SURFACE_TOKENS`, the theme-selector constants, the postcss resolver and the contrast maths — four
things that must never drift apart, in a repository whose own gate docstrings repeatedly record
drift-between-two-copies as its recurring defect class. The file's docstring is extended to say it
now covers the control rule's **resting and invalid** boundaries plus the error copy.

### 5.2 How it grows — option-agnostic, per FR-001

Four additions, in order:

1. **Discovery (FR-001).** Parse the four component sheets that carry the invalid-boundary rule
   (`sk-form-field.css`, `sk-form-input.css`, `sk-form-select.css`, `sk-form-textarea.css`) with
   `postcss`; collect the `border-color` declaration of every rule whose selector contains
   `[aria-invalid="true"]` or `:invalid`. Assert the collected set is **non-empty** and that every
   member is a single `var(--sk-*)` reference resolving to **one** token name. The token under test
   is discovered from the CSS, never hard-coded — which is what makes the guard survive whichever
   option a future mission picks, and what makes it red at `93c82f14` (where discovery yields
   `--sk-color-red`).
   *The non-empty assertion is load-bearing:* a selector rename would otherwise make the guard pass
   over zero inputs, which is the same defect shape as the bug.
2. **Cascade-correct resolution.** Extend `readThemeHexes` into `resolveToken(source, selector,
   token)` that (a) looks for the declaration in the requested theme block, (b) **falls back to
   `:root` when the token is absent there** — this is real CSS cascade behaviour and it is what
   reproduces the shipping defect — (c) follows at most one `var()` hop, and (d) asserts the final
   value is a hex literal, throwing a named error otherwise. The existing `--sk-border-control` and
   surface lookups are refactored onto the same helper so there is one resolver, not two.
3. **The assertions**, for each theme × each of the five surfaces:
   - **FR-002 / NFR-001** — `ratio(invalid, surface) ≥ 3.0`, message naming theme, surface, both
     hexes and the measured ratio (matching the existing test's message shape).
   - **FR-003 / NFR-002** — `ratio(invalid, surface) ≥ ratio(borderControl, surface)`, message
     naming both ratios.
   - **FR-004 / NFR-003** — dark only: `ratio ≥` a pinned per-surface constant
     `{ page: 6.58, card: 5.94, input: 5.63, muted: 4.79, pill: 5.08 }`, declared as a named
     `DARK_PREFIX_FLOOR` object with a comment recording that these are the pre-fix measurements at
     `93c82f14`. Pinned numbers, not a computed comparison — a computed one would move with the
     token and assert nothing.
4. **The error-copy contract**, symmetrically: discover the token used by
   `.sk-form-field--error .sk-form-field__description`, `.sk-form-input__error` and
   `.sk-form-textarea__error`; assert the set is non-empty and single-valued; assert `≥4.5` against
   all five surfaces in both themes. This is what stops §2.4's forced fix from silently regressing
   later.

Test titles carry no `[SC-0xx]`/`[FR-0xx]` behaviour ids unless `behaviours.json` declares them —
the existing test uses `[FR-012]`, which is that mission's own id and is **not** in
`behaviours.json`; the floor reporter's arm 5 only reacts to ids the registry declares, so free-form
`[FR-00x]` tags are safe and consistent with the file's existing style.

### 5.3 Demonstrated red, twice (FR-005 / C-004 / SC-004)

Both runs use the exact invocation established in §8.4. **Scoped runs must pass
`--reporter=default`** — measured this session: `npx vitest run --project node <file>` exits **1**
even with all ten existing assertions passing, because `scripts/floor-reporter.mjs` arm 1 flags the
declared-but-unselected `browser` lane and arm 5 flags all seventeen `behaviours.json` entries. With
`--reporter=default` the same command exits **0**. A red-first transcript taken without the flag
would be unreadable as evidence.

**Red #1 — the unmodified tree at the mission's branch point (US2 scenario 3, SC-004).** Keep the
grown test file from the working tree and restore *every input it reads* to `93c82f14`, in this one
checkout, reversibly:

```bash
git checkout 93c82f14 -- \
  packages/tokens/src/tokens.css \
  packages/styles/src/form-field/sk-form-field.css \
  packages/styles/src/form-input/sk-form-input.css \
  packages/styles/src/form-select/sk-form-select.css \
  packages/styles/src/form-textarea/sk-form-textarea.css
npx vitest run --project node --reporter=default \
  tests/node/form-input-border-control-contrast.test.ts 2>&1 | tee evidence/guard-red-base.txt
git checkout HEAD -- packages/tokens/src/tokens.css packages/styles/src/form-field/sk-form-field.css \
  packages/styles/src/form-input/sk-form-input.css packages/styles/src/form-select/sk-form-select.css \
  packages/styles/src/form-textarea/sk-form-textarea.css
```

Expected: discovery resolves `--sk-color-red`; the light lookup misses the light block and falls
back to `:root`'s `#E97373`; **10 boundary assertions fail** (5 absolute at 2.69/2.93/2.60/2.26/2.37
and 5 relational against 3.98/4.34/3.85/3.51/3.35) plus **5 error-copy assertions** fail at
2.69/2.93/2.60/2.37/2.26 against the 4.5 floor. Dark stays green. Exactly the shipping defect,
reproduced by the test as it will ship, with no edit to the test.

*No `git worktree` and no second checkout.* Sibling mission checkouts share this machine and the
workspace memory records numbered checkouts leaking `node_modules` and ports into each other; the
`git checkout <sha> -- <paths>` form keeps the reproduction inside the lane and restores it in the
same block.

**Red #2 — a deliberate reintroduction (US2 scenario 1).** Temporarily set the light-block
`--sk-border-control-invalid` to `#E97373`, re-run the same command into
`evidence/guard-red-reintroduced.txt`, confirm the same 10 boundary assertions fail, revert. Red #1
proves the guard catches the *shipping tree*; Red #2 proves it tracks the *value* rather than the
token name. Both are needed; neither substitutes for the other.

**Green.** Same command on the finished change, into `evidence/guard-green.txt`, plus the
authoritative full-suite `npm run test`.

All three transcripts go in the PR body (SC-004).

---

## 6. Visual baselines

Four new tests in `apps/storybook/src/tests/visual.spec.ts`, each **clipped to the component
locator** and at `threshold: 0.02, maxDiffPixelRatio: 0.005` — matching the block that already
exists for these components, whose own comment (visual.spec.ts:963-969) records *why*: at the
file's usual `0.02` ratio, "a total loss of the control's border color stayed within a 2% ratio for
three of these ten shots… 0.005 leaves no shot with more than a few hundred border pixels of slack."
A new light+invalid baseline taken at the looser ratio would not reliably detect the very change it
exists to record.

| new test | story id | snapshot |
|---|---|---|
| `SK-input light error — visual baseline` | `form-formfield-html--light-mode-error` | `sk-input-light-error.png` |
| `SK-form-input light error — visual baseline` | `elements-skforminput--light-mode-error` | `sk-form-input-light-error.png` |
| `SK-form-select light invalid — visual baseline` | `form-skformselect-html--light-mode-invalid` | `sk-form-select-light-invalid.png` |
| `SK-form-textarea light error — visual baseline` | `elements-skformtextarea--light-mode-error` | `sk-form-textarea-light-error.png` |

The last one is `form-textarea`'s **first visual baseline of any kind**.

**Baselines are CI-authoritative.** All four will red locally on first run because no baseline
exists. The implementer must **never** run `--update-snapshots`; push, let the visual job produce
the diff artifact, and harvest the PNGs from that run — the same flow `visual.spec.ts:941-942`
records for the block it sits in ("Redded on first run (no baseline existed yet) and was harvested
from that run's artifact per this file's own CI-authoritative convention"). This costs one extra
CI round trip and that is expected, not a failure.

New stories use `class="sk-light"` (never `data-theme="light"`, which activates nothing — #93/#77,
and `check-story-theme-wrapper.mjs` enforces it), and reuse existing published markup exports so
`node scripts/build-element-markup.mjs --check` stays green.

---

## 7. Blast radius — per consumer, with a named mechanism (FR-007 / NFR-004 / SC-005)

| consumer | light rendering | evidence mechanism |
|---|---|---|
| `form-field` (`.sk-input`, `.sk-textarea`) | **CHANGES** — invalid border `#E97373`→`#6B2424`; error description `#E97373`→`#6B2424` | new `sk-input-light-error.png`, harvested from CI. Dark unchanged, **proved** by `sk-input-invalid.png` and `sk-input-default-dark.png` passing **without a re-baseline** in the same run. |
| `form-input` | **CHANGES** — control border + `__error` copy, light only | new `sk-form-input-light-error.png` from CI; `sk-form-input-invalid.png` (dark) and `sk-form-input-light.png` (default) pass unchanged. |
| `form-select` | **CHANGES** — `:invalid` border only (no error copy in this component) | new `sk-form-select-light-invalid.png` from CI; `sk-form-select-invalid.png` (dark) and `sk-form-select-light.png` pass unchanged. Also re-asserted by `apps/storybook/src/tests/sk-form-select.spec.ts`, which runs `check-component-token-literals.mjs` over this sheet. |
| `form-textarea` | **CHANGES** — control border + `__error` copy, light only | new `sk-form-textarea-light-error.png` from CI — the component's first baseline. |
| `ribbon-card` | **UNCHANGED** | (a) `git diff 93c82f14..HEAD -- packages/styles/src/ribbon-card/ packages/elements/src/ribbon-card/` is **empty**; (b) `git grep -c -- '--sk-color-red' -- packages/styles/src/ribbon-card/sk-ribbon-card.css` still returns **2**, and `git grep -c -- '--sk-border-control-invalid' -- packages/styles/src/ribbon-card/` returns **nothing**; (c) `sk-ribbon-card-html-with-ribbon.png` passes unchanged. |
| `transition-matrix` | **UNCHANGED** | same (a)/(b) mechanism, **plus the strongest single piece of evidence in this mission**: `sk-transition-matrix-light.png` is the one existing light baseline that actually paints `--sk-color-red`, and it must pass **byte-identical**. Under Option A it would necessarily have moved. Its passing is a live control experiment that Option B's blast radius is contained. |
| `status-indicator` | **UNCHANGED** (C-005) | `git diff 93c82f14..HEAD -- packages/styles/src/status-indicator/` is empty; its three grep hits are comment-only and its `sk-status-indicator-light.png` passes unchanged. |
| token documentation swatches (`brand.mdx`, `colours.mdx`) | **UNCHANGED** | they reference `--sk-color-red`, whose value this mission does not touch. Named here because the spec's `packages/**`-scoped grep could not see them. |

The PR body carries this table verbatim (SC-005), with the CI run URL beside each harvested
baseline and each "unchanged" claim.

---

## 8. Verification plan

### 8.1 Ordering constraint that is easy to get wrong

`stylelint.config.mjs:5-13` builds its `declaration-strict-value` allowlist by `require`-ing the
**committed** `packages/tokens/dist/token-catalogue.json`. Repointing any declaration to
`--sk-border-control-invalid` **before** regenerating the catalogue makes every repointed line red
under `npm run quality:stylelint`, with a message that looks like a naming mistake rather than an
ordering one. Similarly `scripts/check-element-css-hygiene.mjs:260` refuses any `var()` to a custom
property not defined in `packages/tokens/src/tokens.css` (it reads the **source**, not the
catalogue). So: **tokens.css first, catalogue second, sheets third.**

### 8.2 Commands, in order, derived from this checkout

```bash
cd /home/jeroennouws/dev/spec-kitty-design-missions/350

# 1 — tokens, then the catalogue that the stylelint allowlist reads
npx nx run tokens:catalogue --skip-nx-cache
git diff -- packages/tokens/dist/token-catalogue.json     # expect: +2 token names, generated_at
bash scripts/check-token-breaking-changes.sh              # expect: "New tokens added (non-breaking)" ×2, no removals

# 2 — generated element CSS (ENFORCED drift gate)
node scripts/build-elements-css.mjs
node scripts/build-elements-css.mjs --check

# 3 — lint
npm run quality:all                                       # lint + stylelint + htmlhint

# 4 — the token/CSS gates this change can trip
node scripts/check-element-css-hygiene.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-story-theme-wrapper.mjs
node scripts/check-pattern-composition.mjs

# 5 — the guard, scoped (this is the red/green transcript form; see §5.3)
npx vitest run --project node --reporter=default tests/node/form-input-border-control-contrast.test.ts

# 6 — the authoritative full suite
npm run test

# 7 — sizes. BUILD FIRST: measure-elements-sizes.mjs reads dist/ and never builds it.
npx nx run elements:build --skip-nx-cache
node scripts/measure-elements-sizes.mjs
node scripts/measure-elements-sizes.mjs --check

# 8 — Storybook, axe, Playwright
npx nx run storybook:storybook:build --skip-nx-cache
node scripts/run-axe-storybook.js                         # NFR-006 / SC-008 — every story, no skips
flock /tmp/sk-design-pw-6006.lock npx playwright test --project=chromium apps/storybook/src/tests/sk-form-select.spec.ts
PW_INCLUDE_VISUAL=1 flock /tmp/sk-design-pw-6006.lock npx playwright test --project=chromium apps/storybook/src/tests/visual.spec.ts
```

Step 8's last line reds on the four missing baselines by design; harvest from CI (§6).

### 8.3 What CI adds

`ci-quality.yml` re-runs steps 2, 3, 4, 6, 7 and 8 as `[ENFORCED]` jobs, plus `typecheck-all.mjs`,
`build-react-wrappers.mjs --check`, `build-vue-types.mjs --check`, `build-element-markup.mjs
--check`, `check-elements-entries.mjs`, the CEM currency check, and commitlint. None of those should
react to this diff; if one does, it is a finding, not noise.

### 8.4 Commit scopes — read from `commitlint.config.cjs`, not assumed

`scope-enum` (L106-119) is exactly: `tokens`, `storybook`, `doctrine`, `ci`, `docs`, `release`,
`deps`, `security`, `acceptance`, `merge`, `team-overview`, `styles`, `elements`, `react`. Types
come from `@commitlint/config-conventional`.

- token declarations + catalogue → `feat(tokens): …`
- component sheet repoints → `fix(styles): …`
- generated `.css.js` / SIZES.md → `chore(elements): …`
- stories + `visual.spec.ts` → `test(storybook): …` or `feat(storybook): …`
- the guard → `test(tokens): …`
- changelog → `docs: …` (unscoped) — note `docs` **is** in the enum, so `docs(docs):` is also legal;
  `docs(spec)` and `chore(spec-kitty):` are **not** (the latter is exempt only for exact anchored
  CLI messages). `chore(spec):` is an anchored ignore pattern (L13) and is what this plan's own
  commit uses.

---

## 9. Risks

| id | risk | mitigation |
|---|---|---|
| R-1 | The four new light+invalid stories red the axe gate on the error copy. | Resolved structurally by §2.4 — the copy is fixed in the same change, taking it to 9.78–11.04:1. Verify with step 8's `run-axe-storybook.js` **before** opening the PR. |
| R-2 | Stylelint reds on the repointed declarations because the catalogue was not regenerated first. | §8.1 ordering; the catalogue regeneration is step 1. |
| R-3 | A scoped `vitest` run exits 1 for floor-reporter reasons and is mistaken for a real failure (or worse, a *red-first* transcript is mistaken for the guard working). | `--reporter=default` on every scoped run; the authoritative green is `npm run test`. Measured this session. |
| R-4 | `measure-elements-sizes.mjs --check` reds in CI because SIZES.md was measured against a stale or absent `dist/`, or against a `node_modules` that a sibling checkout perturbed. | Always `npx nx run elements:build --skip-nx-cache` immediately before measuring; if the committed figures and CI disagree, trust CI and re-measure after a clean `npm ci`. |
| R-5 | The train moves under the mission; a gate goes green or red for reasons outside this diff. | Re-fetch and rebase onto `origin/train/elements-first` immediately before implementation, and again before the PR. Note `93c82f14` is pinned into the guard's dark-floor comment and into Red #1's recipe — if the train moves, re-verify (do not blindly update) those numbers. |
| R-6 | Port 6006 collides with a sibling mission's Storybook, producing false Playwright failures. | `flock /tmp/sk-design-pw-6006.lock` on every Playwright invocation; never kill a process this mission did not start. |
| R-7 | The two new tokens hold identical values in both themes and a reviewer proposes collapsing them into one. | The rationale must live **beside the declarations** in `tokens.css` (the repository's own convention, per `adding-a-token.md`'s "record the derivation … beside the declaration"), citing `tokens.css:199-208`: two different contrasts contracts must be free to move independently. |
| R-8 | C-002's human sign-off is treated as satisfied by the adversarial squad. | It is not, and cannot be. §10. |

---

## 10. Charter and environment constraints

**Charter — token-namespace change requires human sign-off, and this mission cannot self-approve
it.** `.kittify/charter/charter.md` Review Policy (L24/L50): *"Token additions or renames require
maintainer sign-off … One human approval required for any change to the `--sk-*` token namespace."*
This mission adds two token names. Therefore:

- The PR carries a **recorded human maintainer approval of the token change, distinct from and in
  addition to** the mission's adversarial-squad evidence (C-002, FR-011, SC-007).
- The squad's verdict, however unanimous, does not discharge it.
- What the human is being asked to approve is narrowed by §2.5: **two names, zero new colour
  values.** Both literals already ship in `tokens.css` today. That should be stated plainly in the
  approval request.
- The charter's separate clause "changes to … the core token naming convention require maintainer
  sign-off **and an ADR entry**" does **not** apply: this mission follows `--sk-<category>-<name>`
  inside two existing categories and changes no convention.
- Pre-merge cadence is not tiered — `docs/architecture/elements-first-programme.md:31` records the
  operator standing order that **every** PR into the train gets the full four-lens gate with its
  evidence posted as a PR comment naming the reviewed SHA.

**Environment constraints for the implementer:**

- `playwright.config.ts` hard-codes port 6006 with `reuseExistingServer: !CI`, and sibling mission
  checkouts share this machine. Take `flock /tmp/sk-design-pw-6006.lock` around every Playwright
  invocation. **Never kill a process you did not start** — a 6006 listener probably belongs to
  another mission.
- `visual.spec.ts` is excluded from the default Playwright run; opt in with `PW_INCLUDE_VISUAL=1`,
  never by naming the file.
- Build before `scripts/measure-elements-sizes.mjs` — it reads `dist/` and never builds it.
- Pass `--skip-nx-cache` on nx targets used as gates; a cached `analyze`/`build` makes a `--check`
  compare a stale artifact against itself.
- Scoped `vitest` runs need `--project node --reporter=default` (§5.3).
- Commit scopes: §8.4.
- The spec's SC-001 names `npx vitest run tests/node/form-input-border-control-contrast.test.ts`.
  **The repository contradicts it** — that exact command exits 1 even when all assertions pass
  (`scripts/floor-reporter.mjs` arms 1 and 5). The repository wins; use the form in §8.2 step 5 and
  say so in the PR.

---

## 11. `[NEEDS DECISION]` — resolved and remaining

**Resolved by this plan:**

- **FR-006 / Fork 1 (Option A vs B)** → **Option B**, two-token split. Deciding evidence: the
  4.22:1 arithmetic ceiling in §2.1; the unstoried, unevidenceable ribbon-card regression Option A
  would ship; and the repository's own twice-stated preference for role tokens over re-themed brand
  hues (§2.2).
- **FR-008 / Fork 2 (four vs five surfaces)** → **five**, §3.
- **The text-contract trap the spec surfaced** → resolved by decoupling rather than by finding a
  hex that serves both: `--sk-fg-error` carries the 4.5:1 contract independently, and its light
  value clears it at 9.78–11.04:1 on all five surfaces (§2.6). The repoint is *forced* by
  NFR-004 × NFR-006, not elective (§2.4).
- **`status-indicator`** → untouched, C-005.
- **`ribbon-card`'s unwired `LightMode` story** → irrelevant under Option B, and §1.3 records that
  wiring it would have evidenced nothing anyway, since it renders no red variant.

**Remaining — one genuine fork, reported to the operator:**

> **[NEEDS DECISION — for the operator, not for this mission to settle]**
> `--sk-color-red`'s remaining consumers still carry unguarded contrast obligations this mission
> deliberately does not touch: `ribbon-card`'s `--red` ribbon (fill + `--sk-fg-on-primary` pair,
> 6.24:1 today, but rendered by **no Storybook story**, so nothing would notice if it moved) and
> `transition-matrix`'s blocked-row graphic (light 2.93:1 against the white card — **below WCAG
> 1.4.11's 3:1 for a graphical object**, though axe does not check non-text contrast and the
> existing baseline is green). Both are real, both are out of #350's scope, and both are
> newly-measured findings of this plan rather than of the issue. **Recommendation:** file one
> follow-up issue covering (a) a red-variant ribbon-card story so the pair is ever exercised, and
> (b) the transition-matrix blocked-row 1.4.11 gap. This plan does **not** expand to cover them, and
> nothing in this mission depends on the answer.

---

## 12. Work-package shape — one WP, one PR, and why it does not split

**One bounded Work Package producing one PR into `train/elements-first`, described with
`Refs #350`** (C-001, FR-013).

It does not split, for three independent reasons:

1. **Every plausible seam produces an intermediate commit that reds an ENFORCED gate.** Split
   "tokens" from "sheets" and the first commit adds two tokens nothing consumes while the second
   reds `stylelint` (allowlist from the committed catalogue, §8.1) and
   `check-element-css-hygiene.mjs`. Split "sheets" from "generated" and
   `build-elements-css.mjs --check` reds. Split "guard" from "fix" and the guard's *discovery* step
   (§5.2.1) reads the component sheets — so a guard authored before the repoint discovers
   `--sk-color-red` and is red by construction, which is the *evidence*, not a deliverable state to
   commit. The change is atomic because the repository's gates make it atomic.
2. **The visual baselines can only be harvested once, from a CI run of the complete change.** Two
   WPs would need two harvest cycles for one visual delta.
3. **It is small.** Four token declarations, eight repointed `var()` references across four sheets,
   one grown test file, four stories, four visual tests, one changelog entry, five regenerated
   artifacts. Splitting it would add more coordination surface than implementation surface.

The WP's own internal order is §8.2's command sequence, with the two red-first transcripts (§5.3)
captured before the fix is applied and the green captured after.

---

## Charter Check

| gate | status |
|---|---|
| Tokens-first CSS — no raw hex outside `tokens.css` (C-008) | **PASS** — every repointed declaration is `var(--sk-*)`; the only literals are the four token declarations inside `tokens.css` itself, which `stylelint.config.mjs:75` exempts. |
| Both theme blocks, same commit (FR-009) | **PASS** — §4.1 A1. |
| Catalogue regenerated, never hand-edited (C-007, NFR-005) | **PASS** — §4.2 G1, §8.2 step 1. |
| axe zero WCAG 2.1 AA on every story touched or added (NFR-006) | **PASS by design** — §2.4 is what makes it pass; verified at §8.2 step 8. |
| Component documents its token dependencies | **N/A** — neither `sk-form-input.ts` nor `sk-form-textarea.ts` carries a "Token dependencies" JSDoc list; only `sk-transition-matrix.ts` does, and it is untouched. |
| Required behaviours demonstrated red before green | **PASS** — §5.3, twice. |
| One human approval for any `--sk-*` namespace change (C-002) | **OPEN BY CONSTRUCTION** — cannot be satisfied by this mission. §10. |
| Full four-lens adversarial gate, evidence posted, SHA matched | **OPEN** — pre-merge, per the operator standing order. |
| Breaking token-name changes need a major bump | **N/A** — two additions, zero removals or renames. `check-token-breaking-changes.sh` will report them as non-breaking. |

**Complexity Tracking**: no charter violation requiring justification. The one deviation from the
literal spec text — repointing the three error-copy declarations — is argued in §2.4 as *forced by
two of the spec's own requirements*, and it enlarges the diff by three lines in files already
being edited.

---

## Project Structure

### Documentation (this mission)

```
kitty-specs/invalid-boundary-light-contrast-01M26WMT/
├── spec.md            # authored, cacefc3d
├── plan.md            # this file
├── decisions/         # three plan-interview moments, answered in Technical Context
└── tasks/             # NOT created by this phase
```

No `research.md`, `data-model.md`, `quickstart.md` or `contracts/`: the spec records "Key Entities:
None", the mission introduces no data entity or API surface, and every measurement this plan relies
on is stated inline above with the file and line it came from. A separate research file would be a
second copy of §1 and §2 with nothing to keep them in sync.

### Source code touched (repository root)

```
packages/tokens/src/tokens.css                                   # A1  (both theme blocks)
packages/tokens/dist/token-catalogue.json                        # G1  generated
packages/styles/src/form-field/sk-form-field.css                 # A2
packages/styles/src/form-field/sk-form-field-html.stories.ts     # A7
packages/styles/src/form-input/sk-form-input.css                 # A3
packages/styles/src/form-select/sk-form-select.css               # A4
packages/styles/src/form-select/sk-form-select-html.stories.ts   # A8
packages/styles/src/form-textarea/sk-form-textarea.css           # A5
packages/elements/src/form-input/sk-form-input.css.js            # G2  generated
packages/elements/src/form-input/sk-form-input.stories.ts        # A9
packages/elements/src/form-textarea/sk-form-textarea.css.js      # G3  generated
packages/elements/src/form-textarea/sk-form-textarea.stories.ts  # A10
packages/elements/SIZES.md                                       # G4  generated
tests/node/form-input-border-control-contrast.test.ts            # A6
apps/storybook/src/tests/visual.spec.ts                          # A11
apps/storybook/src/tests/visual.spec.ts-snapshots/*.png          # G5  harvested from CI
docs/design-system/changelog.md                                  # A12
```

**Structure Decision**: the existing nx monorepo layout, unchanged. No new package, directory or
build target.

---

## Implementation Concern Map

> Concerns are not work packages. This mission's single WP spans all four.

### IC-01 — Token layer

- **Purpose**: declare `--sk-border-control-invalid` and `--sk-fg-error` in both theme blocks, with
  the derivation and the measured ratios recorded beside the declarations, and regenerate the
  catalogue.
- **Relevant requirements**: FR-006, FR-009, FR-012, NFR-005, C-002, C-007, C-008.
- **Affected surfaces**: `packages/tokens/src/tokens.css`, `packages/tokens/dist/token-catalogue.json`.
- **Sequencing/depends-on**: none — **must be first**, §8.1.
- **Risks**: R-2, R-7, R-8.

### IC-02 — Consumer repoint

- **Purpose**: move five boundary declarations and three error-copy declarations off
  `--sk-color-red` onto the two new roles, leaving the decorative uses alone.
- **Relevant requirements**: FR-007, NFR-001, NFR-002, NFR-004, C-005, C-008.
- **Affected surfaces**: `sk-form-field.css`, `sk-form-input.css`, `sk-form-select.css`,
  `sk-form-textarea.css`, and their generated `.css.js` mirrors + `SIZES.md`.
- **Sequencing/depends-on**: IC-01.
- **Risks**: R-2, R-4.

### IC-03 — The guard

- **Purpose**: grow the contrast test to discover and assert the invalid boundary and the error copy
  across five surfaces and two themes, demonstrated red twice.
- **Relevant requirements**: FR-001–FR-005, NFR-001–NFR-003, C-004.
- **Affected surfaces**: `tests/node/form-input-border-control-contrast.test.ts`.
- **Sequencing/depends-on**: authored against IC-02's selectors; Red #1 is captured with IC-01/IC-02
  reverted to `93c82f14`, so it is written last and run against the base.
- **Risks**: R-3.

### IC-04 — Evidence surfaces

- **Purpose**: four light+invalid stories, four visual tests at the tight ratio, CI-harvested
  baselines, the changelog entry, and the per-consumer disposition table in the PR body.
- **Relevant requirements**: FR-007, FR-010, FR-011, FR-013, NFR-004, NFR-006, C-001, C-006.
- **Affected surfaces**: four `*.stories.ts`, `apps/storybook/src/tests/visual.spec.ts`,
  `visual.spec.ts-snapshots/`, `docs/design-system/changelog.md`, the PR body.
- **Sequencing/depends-on**: IC-02 (a story added before the repoint would bake the defect into the
  harvested baseline).
- **Risks**: R-1, R-6; one deliberate extra CI round trip to harvest baselines.
