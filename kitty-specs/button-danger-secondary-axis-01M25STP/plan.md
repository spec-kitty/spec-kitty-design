# Implementation Plan: sk-button danger-secondary axis

**Branch**: `mission/button-danger-secondary-axis` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/button-danger-secondary-axis-01M25STP/spec.md`

## Summary

Add a fourth tone, `danger-secondary`, to the existing `sk-button`'s `BUTTON_VARIANTS` map, composing
the secondary tone's shape (transparent background at rest, bordered) with the danger surface/
foreground pair — `--sk-status-danger` / `--sk-on-status-danger` — that `sk-status-indicator` and
`sk-pill-tag`'s status axis already publish. No new token: binding under BORDER-ROLE-319, this
mission does not touch `packages/tokens/src/tokens.css` at all; the control boundary is the danger
role's own foreground token (`--sk-on-status-danger`, independently re-measured at 6.58:1 dark /
10.12:1 light against `--sk-surface-page`), never `--sk-border-default`/`--sk-border-strong`. The
existing warn/degrade (render path) and throw (static-authoring path) machinery, and the generator's
one-export-per-variant behaviour, cover the new tone with almost no new code — the two genuinely new
surfaces are (1) an explicit `:active { transform: scale(0.97) }` rule on the new tone only, resolving
the issue's "parity with the existing tones" clause against a fact the three current tones do not
agree on among themselves, and (2) a forced-colors-only, content-drawn, alt-texted-empty marker, since
`.sk-button--secondary` already carries an unconditional non-transparent border and would otherwise
remap to the identical system colour as `danger-secondary` under `forced-colors: active`.

## Technical Context

**Language/Version**: TypeScript 5.x, ESM, Lit 3.3.3, Node 22 toolchain
**Primary Dependencies**: `lit`, `@custom-elements-manifest/analyzer` 0.11.0,
`@wc-toolkit/react-wrappers` 1.2.7, Storybook 10.x (web-components-vite), Vitest browser mode
(Playwright provider), stylelint 16, eslint 9, nx 22
**Storage**: N/A — CSS custom properties and static artifacts on disk
**Testing**: Vitest browser mode in `fixtures/elements-behaviour`, `scripts/suite-selftest.mjs`
mutation harness, axe over the built Storybook, Playwright visual regression and forced-colors
emulation
**Target Platform**: browsers (Baseline widely available); plus the no-JavaScript static path
(`packages/styles/src/button/sk-button.html`, `index.ts`)
**Project Type**: Nx monorepo, four packages, `tokens → styles → elements → react`
**Performance Goals**: no measurable bundle growth beyond four CSS rules (default, hover, active,
forced-colors) and one widened inline type union; `SIZES.md` regenerated after a real build
**Constraints**: ADR-9 (no selector crosses the shadow boundary; tokens and `::part()` are the
styling API), ADR-10 §3 (markup authored once; generated artifacts regenerable), ADR-11 (behaviour
ids and red-first mutations — this mission adds no new applicable id, see Verification), BORDER-
ROLE-319 (binding token-altitude ruling quoted in spec.md), SK-D01 (every value a `--sk-*` token)
**Scale/Scope**: one existing element, one authored stylesheet edit, one markup-module edit, one
element-source edit, two story files (element + static), one behaviour-test edit, no new package,
no new token, no new component

## Charter Check

*GATE: passes.*

| charter/repo rule | how this mission satisfies it |
|---|---|
| Tokens first (hard rule 1) | every new declaration is `var(--sk-*)`; zero new tokens (the danger pair already exists) |
| One-directional boundary (hard rule 2) | changes stay inside `styles` and `elements`; `react`/`vue.d.ts` are generated, never hand-edited |
| Semantic pairing (hard rule 3) | `--sk-status-danger` (surface, hover fill) ↔ `--sk-on-status-danger` (foreground, border/text) — never mixed with an unrelated pair |
| BEM (hard rule 4) | `sk-button--danger-secondary` |
| Conventional commits (hard rule 5) | scopes used: `styles`, `elements`; unscoped `docs:` for doc-only commits |
| `LightMode` per story (hard rule 6) | `class="sk-light"`, never `data-theme` |
| Demo pages (hard rule 7) | untouched; no new component directory, no path changes |
| ADR-9 §3 | no theme selector added; danger-tone variance is entirely token-driven, already resolved through the shadow boundary today |
| ADR-10 §3 | `sk-button.markup.ts` stays the one authored markup source; `sk-button.html` and `packages/styles/src/button/index.ts` regenerate with one new export, `SkButtonDangerSecondaryHTML` |
| ADR-11 | no new required-behaviour id is triggered — see Verification for why SC-016/SC-017 do not apply |
| BORDER-ROLE-319 | zero edits to `packages/tokens/src/tokens.css`; boundary is `--sk-on-status-danger` directly, re-measured independently (below) |
| No new ADR | this mission writes none; it operates under BORDER-ROLE-319's existing ruling |

## Project Structure

### Documentation (this mission)

```
kitty-specs/button-danger-secondary-axis-01M25STP/
├── plan.md              # this file
├── spec.md              # Phase -1 output (already authored and committed)
└── tasks.md             # Phase 2 output (spec-kitty tasks-outline / tasks-packages / tasks)
```

No `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` are produced: the mission has no
external data model, no API contract, and its "research" — the token re-measurement, the ADR/
programme-decision reading, and the source-of-truth reads of the four button files — is complete and
recorded directly in spec.md's Source/Assumptions sections and in this plan's Design and Verification
sections, the same brief-intake pattern the sibling `pill-tag-status-tone-axis-01M25AVP` mission used
for an equivalent single-axis component addition.

### Source Code (repository root)

```
packages/tokens/src/tokens.css                          # NOT TOUCHED (BORDER-ROLE-319, C-002)

packages/styles/src/button/
├── sk-button.css                                        # AUTHORED — add .sk-button--danger-secondary
├── sk-button.html                                       # GENERATED — regenerates with one new export
├── index.ts                                             # GENERATED — regenerates with SkButtonDangerSecondaryHTML
└── sk-button-html.stories.ts                             # AUTHORED — new story + AllVariants/LightMode entries

packages/elements/src/button/
├── sk-button.markup.ts                                   # AUTHORED — BUTTON_VARIANTS gains one entry
├── sk-button.ts                                          # AUTHORED — variant type union widened (JSDoc + declare)
├── sk-button.css.js / .css.d.ts                           # GENERATED — regenerate from sk-button.css
└── sk-button.stories.ts                                   # AUTHORED — new stories per the required matrix

packages/react/src/**                                     # GENERATED — SkButton prop type widens; never hand-edited
packages/elements/vue.d.ts                                 # GENERATED — same widening; never hand-edited
packages/elements/custom-elements.json                     # GENERATED — regenerated by elements:analyze
packages/elements/SIZES.md                                  # GENERATED — regenerated after a real build

fixtures/elements-behaviour/src/sk-button.test.ts           # AUTHORED — update tone-count literal + new assertions

apps/storybook/src/tests/elements-load.spec.ts               # AUTHORED — forced-colors distinguishability assertion

docs/design-system/using-components.md                      # AUTHORED — document the fourth tone (or sk-button's own doc surface, whichever already carries the tone table)

expected-parts.json                                          # CONFIRMED UNCHANGED (FR-018) — no edit
expected-docs.json                                            # CONFIRMED UNCHANGED (FR-018) — no edit
behaviours.json                                                # CONFIRMED UNCHANGED — no new subject/id (see Verification)
mutations.json                                                  # CONFIRMED UNCHANGED — no new arm required
```

**Structure Decision**: single Nx monorepo, existing `tokens → styles → elements → react` structure.
No new package, no new project, no new Nx target. All edits land inside the two packages ADR-9/ADR-10
already assign component work to (`styles`, `elements`); `react` and `vue.d.ts` are regenerated only.

## Design

### 1. The tone entry (`sk-button.markup.ts`)

```ts
export const BUTTON_VARIANTS = {
  primary: 'sk-button--primary',
  secondary: 'sk-button--secondary',
  ghost: 'sk-button--ghost',
  'danger-secondary': 'sk-button--danger-secondary',
} as const;
```

That is the entire markup-module diff for the variant vocabulary. Everything downstream is already
generic over `Object.keys(BUTTON_VARIANTS)`:

- `isButtonVariant`, `unknownVariantMessage`, `buttonClasses` (warn/degrade) and `buttonStaticHtml`
  (throw) all iterate/index the map — no new branch.
- `BUTTON_AXES` is **not** touched. Neither `secondary` nor `ghost` has a dedicated `BUTTON_AXES`
  entry today (only `primary` does, via `Sm` and `Link`), so `danger-secondary` needs none either —
  it gets exactly the base per-variant static export the generator already produces for every
  `BUTTON_VARIANTS` key: `Sk${pascal(comp)}${pascal('danger-secondary')}HTML` →
  `SkButtonDangerSecondaryHTML` (verified against `scripts/build-element-markup.mjs`'s `pascal =
  x.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())`, which handles the internal hyphen
  correctly and cannot collide with any existing `_AXES` suffix).

No leaf import is added — `sk-button.markup.ts` needs no shared vocabulary here (unlike
`sk-pill-tag`'s `STATUS_TONES` derivation): `danger-secondary` is local to this component, not a
value drawn from `status-tones.ts`'s registry (the danger *tokens* are reused; the *tone name* is
not one of `status-tones.ts`'s six values and does not need to be — `sk-button`'s tone axis and
`sk-pill-tag`/`sk-card`'s status axis are two independent vocabularies that happen to both reach for
the same `--sk-status-danger`/`--sk-on-status-danger` pair).

### 2. The element (`sk-button.ts`)

```ts
/** Tone: `primary`, `secondary`, `ghost` or `danger-secondary`. Omit for the unstyled base. An
 *  unknown value renders the base button and warns rather than throwing. */
declare variant: 'primary' | 'secondary' | 'ghost' | 'danger-secondary' | undefined;
```

Both the `declare` line and its preceding JSDoc line change — the union is a hand-spelled literal
(the same reason `sk-card.ts`'s `status` union is inline rather than an imported type alias:
`build-vue-types.mjs` copies the manifest's type text verbatim into `packages/elements/vue.d.ts`,
which imports nothing). `render()` needs no change: it already calls `buttonClasses(this.variant,
this.size)` generically.

### 3. The CSS (`sk-button.css`)

```css
/* ---- Danger-secondary: reuses the secondary SHAPE with the danger role's own boundary ----
   Binding under BORDER-ROLE-319 (kitty-specs/../.../_program-319/DECISION-border-role.md): this
   tone never reaches for --sk-border-default/--sk-border-strong (#155's failing hairline). The
   control boundary IS the danger role itself, `--sk-on-status-danger`, already published and used
   by sk-status-indicator and sk-pill-tag's status axis. No new token.
   MEASURED (WCAG 1.4.11), independently re-derived on this branch, not quoted from BORDER-ROLE-319:
     --sk-on-status-danger vs --sk-surface-page:   6.58:1 dark  / 10.12:1 light
     --sk-on-status-danger vs --sk-surface-card:   5.94:1 dark  / 11.04:1 light
     --sk-on-status-danger vs --sk-surface-input:  5.63:1 dark  /  9.78:1 light
   All six clear the 3:1 control-boundary floor with wide margin in both themes. */
.sk-button--danger-secondary {
  background: transparent;
  color: var(--sk-on-status-danger);
  border-color: var(--sk-on-status-danger);
}

.sk-button--danger-secondary:hover {
  /* The danger pair's SURFACE member — a subtle danger-tinted fill — rather than inventing a
     "strong" danger border token the way .sk-button--secondary:hover reaches for
     --sk-border-strong. Border colour and text colour are unchanged on hover. */
  background: var(--sk-status-danger);
}

/* Explicit :active on this tone only — see spec.md's Assumptions for why "parity with the
   existing tones" is resolved as "adopt the value the issue names" rather than "inherit whichever
   tone's current, and mutually inconsistent, :active behaviour this one happens to be shaped
   like." .sk-button--secondary and .sk-button--ghost are NOT retrofitted (C-003) — that is a
   pre-existing inconsistency across the other three tones and out of this mission's scope. */
.sk-button--danger-secondary:active {
  transform: scale(0.97);
}

/* Forced-colors: `.sk-button--secondary` already declares an unconditional, non-transparent
   border-color, so it already gets the platform's automatic border-colour remap with zero author
   CSS — which means danger-secondary's own (equally unconditional, non-transparent) border would
   remap to the IDENTICAL system colour as plain secondary and the two would become visually
   indistinguishable. Colour and border-presence therefore cannot carry the distinction the issue
   asks for here (contrast with sk-pill-tag's forced-colors case, where the base pill has NO border
   at all, so presence-vs-absence alone was sufficient there). A background-drawn glyph is also
   ruled out: adding-a-component.md's own measured finding is that a background-drawn icon frozen
   with forced-color-adjust: none is frequently invisible against the forced-colors ground. This
   block uses a CONTENT-drawn, alt-texted-empty marker instead — the same mechanism
   sk-disclosure__summary::before uses to keep a decorative glyph out of the accessible name — and
   it exists ONLY inside this media query; normal light/dark rendering is unaffected. */
@media (forced-colors: active) {
  .sk-button--danger-secondary .sk-button__forced-colors-marker {
    /* placeholder selector — see the WP note below on where this pseudo-element/marker actually
       attaches, since sk-button's render() has no spare internal element to hang a class on
       inside the shadow root's single `<button>`/`<a>` node. */
  }
}
```

**Open construction detail, flagged rather than guessed past.** `sk-button`'s shadow template
renders exactly one interactive node (`<button part="button">` or `<a part="button">`) with a
`<slot>` inside it — there is no secondary internal element to attach a `::before`/`::after` to
that would not also need to survive being the LAST thing before/after slotted content in both the
button and anchor branches. Two shapes were considered and are recorded for the WP to choose
between rather than silently picking one:

1. **`.sk-button--danger-secondary::before` / `::after` directly on the `<button>`/`<a>` part.**
   Simplest, no markup change, but the pseudo-element becomes a flex item alongside the slotted
   content inside `.sk-button`'s `display: inline-flex` — needs `content: '▲' / '';` (a triangle
   or similar glyph, TBD at WP time against what reads clearly at both icon and non-icon sizes) and
   verification that it does not visually collide with `size="icon"`'s fixed 40×40 box or shift
   text baseline alignment in the non-icon sizes.
2. **A dedicated `::part()` or wrapper span in the markup module.** Rejected as the default: it
   would add a new `::part()` (a public API addition, `expected-parts.json`'s `total` would need
   to bump) for a purely forced-colors-scoped concern, which is a disproportionate surface increase
   for what should be a zero-effect-outside-forced-colors marker.

The WP should default to option 1 and verify empirically (Playwright, `forced-colors: active`
emulation, both colour schemes) that the glyph does not distort layout in either the default or
`--sm`/`--icon` sizes before committing to it; if it does, escalate rather than silently widening
`expected-parts.json`.

### 4. Regeneration (ADR-10 §3 / adding-a-component.md §7)

Exact commands, in order, matching the recipe:

```bash
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs

npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs        # WRITES packages/elements/SIZES.md — commit it

node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check
```

Expected regeneration surface: `packages/styles/src/button/sk-button.html` and `index.ts` gain
`SkButtonDangerSecondaryHTML`; `packages/elements/src/button/sk-button.css.js`/`.css.d.ts` pick up
the four new rules; `custom-elements.json`'s `sk-button` entry's `variant` type widens;
`packages/react/src/SkButton.d.ts` (or equivalent) and `packages/elements/vue.d.ts` both widen the
same union. No other component's generated output should change — a diff touching any other
component's generated file is a signal to stop and investigate, not to commit through.

## Verification

### Behaviour fixture (`fixtures/elements-behaviour/src/sk-button.test.ts`)

One hardcoded literal must change: `the primary tone PAINTS, and the three tones are distinct`
currently asserts `expect(variants.length, 'the tone map went empty or grew uncovered').toBe(3);` —
this becomes `.toBe(4)`. The rest of that test is already generic (`Object.keys(BUTTON_VARIANTS)`,
per-tone computed-style capture, `Set` uniqueness check across all tones) and needs no further edit
to cover `danger-secondary` — it will automatically fail if the new tone is not visually distinct
from the other three, which doubles as this mission's own red-first proof for FR-002/FR-003.

New assertions to add (not a new file — extending the existing suite, consistent with `sk-button`
having exactly one behaviour-test file today):

- **Hover fill.** `getComputedStyle` before/after a synthetic `:hover` (or asserting the CSS rule
  directly via a matched stylesheet rule lookup, matching how this file already asserts computed
  colours elsewhere) shows `background-color` changes from `transparent` to the resolved
  `--sk-status-danger` value.
- **Active transform.** `getComputedStyle(...).transform` (or the raw CSS rule) for
  `.sk-button--danger-secondary:active` equals `scale(0.97)` — mirroring how a future maintainer
  would assert `.sk-button--primary:active` if that assertion existed (it does not today; this
  mission adds the first such assertion on this file, scoped to the new tone only).
- **Border/text colour token boundary.** `.sk-button--danger-secondary`'s computed `border-color`
  and `color` both resolve to the same value as a token probe for `--sk-on-status-danger`, in both
  the default and `.sk-light`-wrapped frames — the same two-theme probe pattern the existing `icon
  controls are exactly 40px square and token-focus-visible in both themes` test already uses for
  `--sk-border-focus`.
- **`size="sm"`/`size="icon"` composition.** `danger-secondary` combined with each size produces
  the same padding/dimension behaviour as any other tone at that size, and leaves the tone's own
  colours unaffected — extending the existing `size is an axis independent of tone` test's loop
  rather than writing a parallel test.
- **FR-017, no new copy default.** Assert `buttonStaticHtml({ variant: 'danger-secondary' })`'s
  default rendered content is still exactly the shared `'Label'` placeholder (`content` defaults
  unchanged), and that neither `sk-button.ts` nor `sk-button.markup.ts` contains any new string
  literal resembling a deny/decline label — a targeted grep-style assertion, consistent with #286's
  DoD pattern cited in the issue, not a repo-wide gate (C-011-equivalent boundary: this mission does
  not build #286's general enforcement, only its own local proof).

### ADR-11 required-behaviours: no new applicable id

`sk-button` is already an SC-013/SC-014 subject (declared part targetable on both branches; adopts
the generated sheet). This mission adds neither a new `::part()`, a new reflected property (the
`variant` *attribute* is unchanged — only one more of its already-accepted values), nor a
responsive threshold — so **no** `behaviours.json` or `mutations.json` edit is required, and none
should be made. This is stated explicitly (not left to be inferred) because `expected-docs.json`'s
attribute/property/method counts for `sk-button` are unchanged for the same reason: a new *value*
of an existing attribute is not a new attribute.

### Ratchets confirmed unchanged (FR-018)

- `expected-parts.json`: `sk-button` stays `["button"]`, `total` unchanged — **unless** the WP
  selects Design §3's option 2 (a new `::part()` for the forced-colors marker), in which case this
  file and its total DO need a bump and the WP must say so explicitly rather than silently drift.
  The default (option 1, a bare pseudo-element on the existing part) needs no change here.
- `expected-docs.json`: `sk-button` stays `{ "attributes": 5, "properties": 0, "methods": 0 }`.
- `expected-inert-theme-wrappers.json`: unaffected — this mission writes only `class="sk-light"`
  wrappers in its new stories, fixing none of the remaining inert ones.

### Stories (issue's required matrix)

`packages/elements/src/button/sk-button.stories.ts` (element):

- `DangerSecondary`, `DangerSecondaryHover`/state-labelled variants or a single story with
  Storybook's interaction addon driving hover/active/focus programmatically (WP's choice, matching
  how `Icon`/`IconFocus` already demonstrate state via story naming rather than a controls panel) —
  covering default, hover, active, focus-visible, disabled.
- `DangerSecondarySmall`, `DangerSecondaryIcon` (with a `label`, e.g. mirroring the existing `Icon`
  story's pattern) for the two size axes.
- `AllVariants` gains the fourth tone.
- `LightMode` gains the fourth tone (both plain and, if space allows, an icon example) — asserting
  computed colour actually differs between the default and `.sk-light` frames, per the recipe's own
  instruction to verify rather than assume.
- A forced-colors story or an `apps/storybook/src/tests/elements-load.spec.ts` case (WP's choice of
  location, matching whichever precedent — `sk-pill-tag`'s spec test vs. a dedicated
  `*-forced-colors.html` demo page — best fits a single new tone rather than a whole new component).

`packages/styles/src/button/sk-button-html.stories.ts` (static path): one new story,
`DangerSecondary`, rendering `label(SkButtonDangerSecondaryHTML, 'Deny')` (an example label only —
not a component default; the generated export's own default content parameter stays `'Label'`),
added to `AllVariants` and `LightMode` alongside the three existing tones, following the file's own
guarded `swap()`/`label()` pattern exactly (never a second unguarded `.replace`).

### Axe, visual regression, quality gates

Full list from `docs/contributing/adding-a-component.md` §7, run in order, after the regeneration
block above and before commit:

```bash
node scripts/check-manifest-content.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/typecheck-all.mjs
npm run quality:all                    # ESLint, Stylelint, HTMLHint

node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
node scripts/check-gate-wiring.mjs

git add -A && git status --porcelain   # must be empty before opening the PR

npm run test
node scripts/suite-selftest.mjs
npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js
npx playwright test                    # cross-browser + visual regression + CDN smoke test
```

Visual baselines are taken from CI's `visual-regression-diffs` artifact, never a local
`--update-snapshots` run (this repo's own recorded lesson on CI-authoritative baselines).

### Docs

`docs/design-system/using-components.md` (or `sk-button`'s dedicated doc section, whichever already
carries the three-tone table) gains a row for `danger-secondary`: the reused-token boundary, the
measured contrast figures, and a one-line pointer to the #155 coordination record (FR-022).

## Complexity Tracking

*No Charter Check violations.* The forced-colors marker (Design §3) is the only genuinely new
surface beyond "reuse the existing pair," and it is presentational, forced-colors-scoped only, and
justified in spec.md's Assumptions against the alternative mechanisms the repo's own precedents
already ruled out (colour-only distinction, background-drawn icon). No entry is required in this
table because nothing here is a Charter-rule violation — it is a spec-level design decision, already
argued in full in spec.md.

## Risks

| Risk | Mitigation |
|---|---|
| The forced-colors marker distorts layout at `size="icon"`'s fixed 40×40 box or shifts baseline alignment at default/`--sm` | Verify empirically before committing to option 1 (Design §3); fall back to option 2 (a dedicated `::part()`) only if option 1 measurably breaks layout, and bump `expected-parts.json` explicitly if so |
| `nx` build cache serves a stale `dist/` to `measure-elements-sizes.mjs`, producing a SIZES.md delta that looks like drift | Run the real build (`npx nx run-many --target=build ...`) immediately before measuring, per the recipe's own warning; use `--skip-nx-cache` if a stale-cache symptom appears |
| The WP mistakes "parity with the existing tones" as licence to also add `:active` to `.sk-button--secondary`/`.sk-button--ghost` | C-003 is explicit; the plan's Design §3 CSS block scopes the new `:active` rule to `.sk-button--danger-secondary` only, with the rationale inline |
| A future session reads BORDER-ROLE-319's own dark/light figures as this mission's proof and skips independent re-measurement | Spec.md's Assumptions and this plan's Design §3 both carry the independently re-derived numbers (matching BORDER-ROLE-319's exactly, plus two additional surfaces), satisfying the mission's own obligation to measure rather than quote |
| Another mission (#321, the sibling neutral-border-role mission) merges to the train mid-mission and changes `packages/tokens/src/tokens.css` in ways that shift `--sk-surface-page`/`--sk-surface-card`/`--sk-surface-input` | Re-fetch the train and re-run the contrast measurement before merge if the token file has moved (this repo's own recorded lesson on stale design-phase measurements); #320 touches no token so a rebase should be low-conflict regardless |
| The mission accidentally widens `.sk-button--secondary`'s or `.sk-button--ghost`'s CSS while implementing the new tone (e.g. a shared selector edited by mistake) | `git diff --stat` reviewed against Design §3 before commit; the CSS block only adds new selectors, never edits `.sk-button--secondary`/`.sk-button--ghost`'s existing rules |
