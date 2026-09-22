# Implementation Plan: sk-pill-tag status-tone axis

**Branch**: `mission/pill-tag-status-tone-axis` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/pill-tag-status-tone-axis-01M25AVP/spec.md`

## Summary

Add one reflected `status` axis to the existing `sk-pill-tag`, orthogonal to the existing `variant`
(brand) and `shape` (size) axes, carrying `status-tones.ts`'s six-tone vocabulary — the same
vocabulary `sk-card` already consumes (#146, #177, #216) — by deriving a `PILL_TAG_STATUSES`
sibling map in `sk-pill-tag.markup.ts` exactly the way `sk-card.markup.ts` derives `CARD_STATUSES`.
No new token: `--sk-status-<tone>` / `--sk-on-status-<tone>` already exist in both theme blocks of
`packages/tokens/src/tokens.css`, added by #177's mission. Freeze the static form now, per ADR-15's
explicit ruling on this issue (`sk-pill-tag.css`'s only `:host` rule is `display: inline-flex`, none
of ADR-15's three deferred construct kinds apply), while making no claim about the unrelated
`::part(tag)` gap `sk-metric.css` has into this component (owned by open #314). Add a
forced-colors-only border so a status-bearing pill stays visually distinguishable from a
status-less one, since this component currently declares no border of any kind and background does
not survive `forced-colors: active`.

## Technical Context

**Language/Version**: TypeScript 5.x, ESM, Lit 3.3.3, Node 22 toolchain
**Primary Dependencies**: `lit`, `@custom-elements-manifest/analyzer` 0.11.0,
`@wc-toolkit/react-wrappers` 1.2.7, Storybook 10.6 (web-components-vite), Vitest 4.1.11 browser
mode (Playwright), stylelint 16, eslint 9, nx 22
**Storage**: N/A — CSS custom properties and static artifacts on disk
**Testing**: Vitest browser mode in `fixtures/elements-behaviour`, `scripts/suite-selftest.mjs`
mutation harness, axe over the built Storybook, Playwright visual regression
**Target Platform**: browsers (Baseline widely available); plus the no-JavaScript static path
(`packages/styles/src/pill-tag/sk-pill-tag.html`, `index.ts`)
**Project Type**: Nx monorepo, four packages, `tokens → styles → elements → react`
**Performance Goals**: no measurable bundle growth beyond six CSS blocks, one small forced-colors
block, and one reflected property; `SIZES.md` regenerated after a real build
**Constraints**: ADR-9 (no selector crosses the shadow boundary; parts and tokens are the styling
API), ADR-10 §3 (markup authored once; generated artifacts regenerable), ADR-11 (behaviour ids and
red-first mutations), ADR-15 (the static-form ruling this mission operates under, quoted in
spec.md's Assumptions), SK-D01 (every value a `--sk-*` token)
**Scale/Scope**: one element, one authored stylesheet, one markup module, two story files (element
+ static), one behaviour fixture, no new package, no new token

## Charter Check

*GATE: passes.*

| charter/repo rule | how this mission satisfies it |
|---|---|
| Tokens first (hard rule 1) | every new declaration is `var(--sk-*)`; zero new tokens (the status pair already exists from #177) |
| One-directional boundary (hard rule 2) | changes stay inside `styles` and `elements`; `react` is generated |
| Semantic pairing (hard rule 3) | `--sk-status-<tone>` (surface) ↔ `--sk-on-status-<tone>` (foreground); for this component the two also happen to be the *only* pair painted, since the base rule already sets `background` and `color` together per variant |
| BEM (hard rule 4) | `sk-pill-tag--status-<tone>` |
| Conventional commits (hard rule 5) | scopes used: `styles`, `elements`, and unscoped `docs:` |
| `LightMode` per story (hard rule 6) | `class="sk-light"`, never `data-theme` |
| Demo pages (hard rule 7) | untouched; no new component directory |
| ADR-9 §3 | no theme selector added; status variance lives entirely in tokens |
| ADR-10 §3 | `sk-pill-tag.markup.ts` stays the one authored markup source; `sk-pill-tag.html` and `packages/styles/src/pill-tag/index.ts` are generated |
| ADR-15 | this mission's static freeze is exactly the one ADR-15 authorizes for #302 (root-class modifier, no wrapper needed); the `::part(tag)`/`sk-metric` gap is explicitly not claimed as solved (C-006) |
| No new ADR | this mission writes none; it operates under ADR-15's existing ruling |

## Design

### 1. The vocabulary seam (mirrors #216's `sk-card.markup.ts` exactly)

`sk-pill-tag.markup.ts` already imports nothing (it is a strict-leaf-adjacent module today: no
imports at all). Add:

```ts
import { STATUS_TONES, type StatusIndicatorTone } from '../status-indicator/status-tones.js';

export const PILL_TAG_STATUSES: Readonly<Record<StatusIndicatorTone, string>> = Object.freeze(
  Object.fromEntries(STATUS_TONES.map((tone) => [tone, `sk-pill-tag--status-${tone}`])),
) as Readonly<Record<StatusIndicatorTone, string>>;

export type PillTagStatus = StatusIndicatorTone;
```

`status-tones.ts` is already the enforced leaf `build-element-markup.mjs` checks by import list
(per the recipe and the file's own header comment) — no new leaf-eligibility work is needed, only a
new consumer of it.

The behaviour-fixture equality assertion is **kept and re-aimed**, per the recipe's explicit
instruction ("Keep the equality assertion anyway, and re-aim it"): assert
`Object.keys(PILL_TAG_STATUSES)` deep-equals `STATUS_TONES`, in order, in
`fixtures/elements-behaviour/src/sk-pill-tag.test.ts` (new file — see Verification below).

### 2. The markup functions

`isPillTagStatus`, `unknownStatusMessage`, and the `status` branch inside `pillTagClasses` /
`pillTagStaticHtml` mirror `sk-card.markup.ts`'s `isCardStatus` / `unknownStatusMessage` /
`cardClasses` / `cardStaticHtml` line for line, including:

- `Object.hasOwn`, never `in` — the same prototype-pollution reason (`isCardStatus`'s comment).
- `status && !isPillTagStatus(status)` in the warn/degrade path (falsy-string-is-absent, so
  `status=""` is silently treated as no status, matching `cardClasses`'s own `status && …` guard —
  **not** `status !== undefined`, which would warn on empty string).
- `status !== undefined && !isPillTagStatus(status)` in the throwing static-authoring path,
  matching `cardStaticHtml`.

`PillTagStaticOptions` gains `status?: string`. `PILL_TAG_AXES` — today derived only from
`PILL_TAG_SHAPES` — gains one `Status<Tone>` entry per tone, derived from `PILL_TAG_STATUSES`
exactly the way `CARD_AXES`'s `STATUS_AXES` sub-object is derived from `CARD_STATUSES` (never typed
out by hand), so the generator emits `SkPillTagStatusNeutralHTML` … automatically.

`pillTagClasses`'s class-list array gains one more filtered entry:
`status ? PILL_TAG_STATUSES[status as PillTagStatus] : ''`.

### 3. The element

```ts
static properties = {
  variant: { type: String, reflect: true },
  shape:   { type: String, reflect: true },
  status:  { type: String, reflect: true },   // new, reflected, orthogonal to both existing axes
};

declare status: 'neutral' | 'info' | 'success' | 'attention' | 'danger' | 'recovery' | undefined;
```

The union is spelled out inline on the `declare` line rather than imported, for the **same** reason
`sk-card.ts`'s own comment records at length: `build-vue-types.mjs` copies the manifest's type text
verbatim into `packages/elements/vue.d.ts`, which imports nothing, so a `StatusIndicatorTone` alias
here would emit an unresolved identifier into a file with no imports. `render()` passes
`this.status` as a third argument to `pillTagClasses`; `variant` and `shape` are untouched.

JSDoc for the property mirrors `sk-card.ts`'s `status` doc exactly in shape: *"Operational status
tone, orthogonal to `variant` and `shape`. The vocabulary is `sk-status-indicator`'s; the pill holds
no domain mapping and never infers a tone. An unknown value renders the base tag and warns rather
than throwing."*

### 4. The CSS — six blocks plus precedence plus forced-colors

```css
/* ---- Operational status tones (mirrors #177's sk-card ruling) ----
   `variant` is the brand/decorative axis; `status` is the operational one, and a pill may carry
   both. While a status is present it supersedes variant's `background`/`color` entirely — variant
   contributes nothing to those two properties, matching sk-card's #177 precedence. Equal
   specificity (0,1,0) to `.sk-pill-tag--<variant>`, authored after it, so source order decides.
   MEASURED, not assumed: see the contrast table below. */
.sk-pill-tag--status-neutral   { background: var(--sk-status-neutral);   color: var(--sk-on-status-neutral); }
.sk-pill-tag--status-info      { background: var(--sk-status-info);      color: var(--sk-on-status-info); }
.sk-pill-tag--status-success   { background: var(--sk-status-success);   color: var(--sk-on-status-success); }
.sk-pill-tag--status-attention { background: var(--sk-status-attention); color: var(--sk-on-status-attention); }
.sk-pill-tag--status-danger    { background: var(--sk-status-danger);    color: var(--sk-on-status-danger); }
.sk-pill-tag--status-recovery  { background: var(--sk-status-recovery);  color: var(--sk-on-status-recovery); }

/* FORCED COLORS: sk-pill-tag declares no border today, and `background` does not survive
   forced-colors (it flattens to Canvas) — per docs/contributing/adding-a-component.md's own
   guidance table, a border-drawn technique is the correct substitute, not a color-based one.
   A plain `border` survives with zero further author CSS (the browser remaps its color
   automatically), so the presence of a border — nothing about its color — is what says "this pill
   carries an operational status" once the tint disappears. All six tones therefore become
   MUTUALLY indistinguishable in this mode (the same accepted consequence #177 documents for
   sk-card): what survives is status-vs-no-status, not tone-vs-tone, and that is acceptable only
   because tone is never the sole carrier of meaning here (the slotted text is). */
@media (forced-colors: active) {
  .sk-pill-tag--status-neutral,
  .sk-pill-tag--status-info,
  .sk-pill-tag--status-success,
  .sk-pill-tag--status-attention,
  .sk-pill-tag--status-danger,
  .sk-pill-tag--status-recovery {
    border: var(--sk-border-width-2) solid;
  }
}
```

No `border-color` is authored in that block — the omission is deliberate, mirroring the "no-op
block" lesson `sk-card.css` records at length (an explicit `CanvasText` would be redundant with the
automatic remap; here there is nothing to be redundant with, since no border existed before, so the
block is load-bearing rather than decorative). The asserted claim belongs in
`apps/storybook/src/tests/elements-load.spec.ts`, following `sk-card`'s existing forced-colors
assertion shape: a status pill's computed `border-width` is non-zero where a status-less pill's is
`0px`, in both color schemes.

No reduced-motion block: `sk-pill-tag.css` sets no transition today and this mission adds none.

### 5. Measured contrast (reuses #177's token measurement; re-verify, do not merely cite)

Because this component paints `background` and `color` from the **same** token pair
(`--sk-status-<tone>` / `--sk-on-status-<tone>`), FR-017's two contrast asks — "the pill's text on
its status surface" and "the pair itself" — collapse into one measurement per tone, unlike
`sk-card`, where body text and the tone pair are visually distinct concerns. Since the token
*values* are unchanged from #177's mission, the "pair" column of that mission's own measurement
table (`kitty-specs/card-status-tone-axis-01M1VJNY/plan.md`, "Measured contrast") applies unchanged
to this component's own text-on-surface pairing:

| tone | dark pair | light pair |
|---|---|---|
| neutral | 6.01 | 5.22 |
| info | 9.42 | 7.70 |
| success | 8.55 | 7.10 |
| attention | 11.18 | 6.28 |
| danger | 5.87 | 9.11 |
| recovery | 7.88 | 8.00 |

All six clear the 4.5:1 threshold (NFR-001) in both themes. **The implementing WP must re-run the
measurement against the real rendered pill** (not merely cite this table) — the recipe's own
"measured, not assumed" standard applies per component, and `sk-pill-tag`'s font-size
(`--sk-text-xs`) differs from card's body copy, which is a legitimate reason contrast could differ
even with identical tokens (it does not, for a WCAG contrast ratio, which is size-independent — but
large-vs-normal text *does* change which threshold applies; at `--sk-text-xs` this is normal-size
text, and 4.5:1 is the correct bar, not the 3:1 large-text bar card's border-only claims used
for WCAG 1.4.11 edge-vs-ground). Record the re-measurement in `sk-pill-tag.css`'s own header
comment block, in the same shape as its existing tint-contrast note.

### 6. Ratchets and generated artifacts

| file | change |
|---|---|
| `expected-docs.json` | `sk-pill-tag.attributes`: 2 → 3; bump `total` by 1 |
| `behaviours.json` | add `sk-pill-tag` as a subject of `SC-010` (new — first reflected-string-property addition since SC-010 became live for this element, mirroring #177's exact rationale for why `sk-card` picked it up on `status` rather than retroactively on `variant`); `sk-pill-tag` keeps its existing `SC-013`/`SC-014` subject status unchanged |
| `mutations.json` | one `SC-010` arm against `packages/elements/src/pill-tag/sk-pill-tag.ts` (flip `status`'s `reflect: true` → `false`, mirroring `sk-card`'s SC-010 arm) |
| `packages/styles/src/pill-tag/sk-pill-tag.html` | regenerates — **unchanged**, since the generator emits only the base form here too (same note `sk-card`'s plan makes) |
| `packages/styles/src/pill-tag/index.ts` | regenerates with six new `SkPillTagStatus<Tone>HTML` exports |
| `packages/elements/custom-elements.json`, `packages/elements/vue.d.ts`, `packages/react/src/**` | regenerate via the documented scripts; never hand-edited |
| `packages/elements/SIZES.md` | regenerate after `npx nx run-many --target=build --projects=tokens,styles,elements` (build first, per the recipe's own warning) |
| `expected-parts.json` | **no change** — no new `::part()` is added; the existing single `tag` part is untouched |

### 7. Verification

| claim | mechanism |
|---|---|
| six modifiers, no others | `[SC-013]`-adjacent assertion in the new `fixtures/elements-behaviour/src/sk-pill-tag.test.ts`: mount with each tone, assert the exact class list; mount with an invented tone, assert base-class-only output and a captured `console.warn` |
| one vocabulary, order-pinned | `Object.keys(PILL_TAG_STATUSES)` deep-equals `STATUS_TONES` |
| reflected property survives pre-upgrade | new `[SC-010]` subject; mutation arm flips `reflect: true` → `false` |
| unknown value warns and degrades (render path) | direct probe, mirroring the recorded `sk-card`/`sk-check-bullet` style probes already in this repo's `mutations.json` notes |
| unknown value throws (static-authoring path) | `pillTagStaticHtml({ status: 'rogue' })` throws; asserted directly, no mutation needed (it is a build-time guard, not a runtime behaviour id) |
| `status=""` is silently "no status" | direct assertion, mirroring `sk-card`'s equivalent case |
| brand-vs-status precedence | render `variant` + each `status`, and `status` alone; assert identical computed `background`/`color` |
| tone is decoration only | assert no `role`/`aria-*` is added by the status branch; accessible-name computation unaffected |
| forced-colors distinguishability | `apps/storybook/src/tests/elements-load.spec.ts`, mirroring `sk-card`'s existing forced-colors case: status pill's `border-width` non-zero, status-less pill's `0px`, both color schemes |
| contrast | measured and recorded per tone, both themes (Design §5) |
| no literal introduced | manual diff review of `render()` — this mission's own change is a class-list computation only; no `render()` gate exists yet (#286 owns building one; C-011) |
| static/element parity, tone axis only | exemplar comparison of `pillTagStaticHtml({ status })` output against the element's rendered class list, for all six tones — **explicitly not** extended to the `sk-metric` composition case (C-006) |

## Project Structure

### Documentation (this mission)

```
kitty-specs/pill-tag-status-tone-axis-01M25AVP/
├── spec.md
├── plan.md              # this file
└── tasks/               # work packages
```

### Source Code (repository root)

```
packages/styles/src/pill-tag/sk-pill-tag.css              # + six status blocks, + forced-colors block
packages/styles/src/pill-tag/sk-pill-tag.html              # GENERATED (base form; regenerates identically)
packages/styles/src/pill-tag/index.ts                       # GENERATED (+ six status exports)
packages/styles/src/pill-tag/sk-pill-tag.stories.ts          # static-path stories: + status stories
packages/elements/src/pill-tag/sk-pill-tag.markup.ts        # + PILL_TAG_STATUSES, status branch in
                                                              #   pillTagClasses/pillTagStaticHtml/PILL_TAG_AXES
packages/elements/src/pill-tag/sk-pill-tag.ts                # + reflected status property
packages/elements/src/pill-tag/sk-pill-tag.css.js            # GENERATED
packages/elements/src/pill-tag/sk-pill-tag.stories.ts        # + tone/brand-combo/eyebrow-combo/base/
                                                              #   long-label/RTL/200%-zoom/forced-colors/
                                                              #   unknown/LightMode stories
packages/elements/custom-elements.json                       # GENERATED
packages/elements/vue.d.ts                                    # GENERATED
packages/elements/SIZES.md                                    # GENERATED (after a real build)
packages/react/src/**                                          # GENERATED
fixtures/elements-behaviour/src/sk-pill-tag.test.ts           # NEW — behaviour tests
behaviours.json, mutations.json                                # + SC-010 subject, + red-first arm
expected-docs.json                                              # ratchet
apps/storybook/src/tests/elements-load.spec.ts                 # + forced-colors case for sk-pill-tag
docs/design-system/using-components.md                         # + status axis documented
```

No changes anywhere in `packages/tokens/`, `packages/styles/src/metric/`, `packages/elements/src/card/`,
`packages/elements/src/status-indicator/status-tones.ts`, or any file outside the list above.

## Risks

| risk | mitigation |
|---|---|
| The vocabulary is spelled in two places (`PILL_TAG_STATUSES`, the `declare status:` union) | both pinned — the map by the order-equality assertion, the union by the same class of manifest-driven proof `sk-card` uses (the type is reflected into `custom-elements.json` from the field declaration, not hand-duplicated elsewhere) |
| `--check` green over an nx-cached artifact | every regeneration runs with `--skip-nx-cache` before any `--check` |
| `SIZES.md` measured against a stale `dist/` | build `tokens,styles,elements` first, then measure |
| The forced-colors border reads as a visual change even outside forced-colors mode | scoped entirely inside `@media (forced-colors: active)` — zero effect on the default or light rendering path; verified by NFR-005's pixel-identical baseline check (for the pre-existing exports) plus a direct assertion that the new status stories' non-forced-colors `border` computes to none/`0px` |
| A reviewer conflates this mission's static freeze with a claim about `sk-metric` composition | C-006 and this plan's §7 "static/element parity" row state the boundary explicitly; the PR description must repeat it |
| Another session merges to the train mid-mission | re-fetch and rebase before the PR is final, per this program's standing lesson |
| `expected-stories.json` gains a hard gate on new story ids | verify new story ids against the built Storybook index before committing, same as #177's own recorded risk |

## Complexity Tracking

No charter deviation. No new ADR. The one judgement call this plan records — adding a
forced-colors-only `border` to a component that has none today, rather than reusing an existing
declaration the way `sk-card` widened its existing border — is stated here with its rationale
(background does not survive forced-colors; a border-drawn technique is the recipe's own prescribed
substitute) so the operator and reviewers see it rather than inheriting it silently.
