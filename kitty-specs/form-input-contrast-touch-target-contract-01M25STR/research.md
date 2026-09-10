# Phase 0 Research: `.sk-input` / `sk-form-input` contrast and touch-target contract

All repo-file evidence below is verified at `train/elements-first@4d6c5f2` — this mission's own
branch point (confirmed: `git merge-base mission/form-input-contrast-touch-target-contract
train/elements-first` = `4d6c5f2db5a774f4676d74129c8205e01e231f8a`). The Family 5 design-provenance
pin `4c9e3ff` cited by issue #321 predates this and is provenance only, not a code reference.

## Decision: `--sk-border-control` is an alias to `--sk-fg-subtle`, not a new hex literal

- **Decision**: `--sk-border-control: var(--sk-fg-subtle);` in both theme blocks, contributing
  zero new hex values to the palette.
- **Rationale**: `adding-a-token.md` states aliasing is "the cheap way to add a category" when an
  existing token already carries the needed meaning one `var()` deep, and this repo already
  aliases across category boundaries for borders specifically (`--sk-color-data-grid: var(--sk-border-default)`,
  `--sk-chart-grid: var(--sk-border-default)`). `--sk-fg-subtle` was itself derived (#101) as "the
  minimum same-hue lightening that clears 4.5:1" for tertiary/label text against these same three
  surfaces' close relatives — reusing it for a 3:1 non-text obligation on the same surfaces is a
  strictly weaker bar than the one it already clears for text, which is why the margins below are
  comfortable rather than marginal.
- **Alternatives considered and rejected**:
  - *A new literal, same-hue-preserving lighten/darken of `--sk-border-strong`.* Computed in HLS
    (script: relative-luminance formula, standard WCAG 2.x method) to find the minimal same-hue,
    same-saturation shift that clears 3:1 against the tightest surface (`--sk-surface-input`) in
    each theme: dark resolves to `#5D6A7F` at L≈0.431 (barely clearing 3.01:1 against input);
    light resolves to `#9A8A5A` at L≈0.478 — a visibly more saturated, brownish-gold color than
    the cool/warm neutral family `--sk-border-default`/`-strong` establish, because HSL saturation
    is not perceptually uniform at different lightness. Rejected: introduces two new literals, one
    with essentially zero margin above the 3:1 floor (rounding-sensitive) and the other visually
    inconsistent with the neutral-gray character of the existing Borders block.
  - *Reuse `--sk-fg-muted`* (dark `#A9A9B0`, light `#5C5C52`). Clears 3:1 with very large margin
    (7.07:1 / 5.99:1 minimums) but is a much stronger, more saturated-looking gray than a subtle
    control hairline warrants — this is the color already used for secondary body text, and
    reusing it for every text input's resting border would read as a heavier, bolder box than the
    contract calls for. Rejected in favor of `--sk-fg-subtle`'s smaller, still-comfortable margin.
- **Full measured table** (relative-luminance-based WCAG contrast ratio, both candidate tokens vs.
  the three obligated surfaces, both themes; six pairs total for the chosen alias):

  | theme | resolves to | vs `--sk-surface-page` | vs `--sk-surface-card` | vs `--sk-surface-input` |
  |---|---|---|---|---|
  | dark  | `#81818B` (= `--sk-fg-subtle` dark) | 5.01:1 | 4.51:1 | 4.28:1 |
  | light | `#8A8A7E` (= `--sk-fg-subtle` light) | 3.20:1 | 3.49:1 | 3.09:1 |

  Every one of the six clears 3:1. The tightest is light-theme vs. `--sk-surface-input` at
  **3.09:1** — a 3% margin above the floor with no rounding ambiguity (WCAG tooling generally
  rounds to two decimals; 3.09 does not round down to 3.00).
- **Existing tokens re-measured for completeness** (confirms #155's and the programme decision's
  published figures, and additionally measures `--sk-surface-card`, which neither prior record
  did):

  | token | dark hex | vs page | vs card | vs input | light hex | vs page | vs card | vs input |
  |---|---|---|---|---|---|---|---|---|
  | `--sk-border-default` | `#2B313B` | 1.48 | 1.33 | 1.26 | `#EAE4D2` | 1.17 | 1.27 | 1.13 |
  | `--sk-border-strong`  | `#353C48` | 1.74 | 1.57 | 1.49 | `#D6CFB9` | 1.43 | 1.56 | 1.38 |

  Both fail on all six pairs. Neither is adoptable as-is, confirming the programme decision's
  framing without re-deriving it.

## Decision: no border-width change

- **Decision**: `var(--sk-border-width-1)` (1px) unchanged on both rules.
- **Rationale**: WCAG 1.4.11 is a contrast requirement, not a minimum-width requirement, and the
  chosen color clears 3:1 with margin on every surface in both themes (tightest 3.09:1) without
  any width change. A width bump is additional visual/diff risk with no contract obligation behind
  it. The programme decision explicitly leaves this open ("whether a width change accompanies the
  color are #321's to determine") — this research closes it in the negative.
- **Alternative considered**: bump to `var(--sk-border-width-2)` (2px) for a stronger visual
  affordance regardless of contrast math. Rejected: not requested by any acceptance clause, and
  `sk-textarea`/`sk-form-textarea__control` (explicitly out of scope, C-003) would then diverge
  from `.sk-input`/`.sk-form-input__control` on BOTH color and width instead of color alone —
  widening the disclosed-but-deliberate inconsistency named in the spec's Edge Cases for no
  contract-required benefit.

## Decision: 44px floor via `--sk-space-9`, not an independently justified 48px

- **Decision**: Document the floor as 44px (WCAG 2.5.8, matching #303's own stated precedent —
  "Interactive target sizes hold at 44px... at both widths"), implemented as
  `min-block-size: var(--sk-space-9)`.
- **Rationale**: `packages/tokens/src/tokens.css`'s spacing scale has no 44px step — it runs
  `--sk-space-8` (2.5rem/40px) directly to `--sk-space-9` (3rem/48px). This exact gap has already
  been resolved, twice, in this repository, both times the same way:
  - `packages/styles/src/confirm-dialog/sk-confirm-dialog.css:165-173` —
    `.sk-confirm-dialog__confirm, .sk-confirm-dialog__cancel { min-inline-size: var(--sk-space-9);
    min-block-size: var(--sk-space-9); }`, under a comment naming it "NFR-001: every interactive
    control here is at least 44x44px... `--sk-space-9` is 3rem/48px — the closest token at or
    above the 44px NFR-001 floor."
  - `packages/styles/src/context-nav/sk-context-nav.css` (three call sites, lines ~51/127/176) —
    `min-block-size: var(--sk-space-9);` on `.sk-context-nav__link` and its siblings.

  Family 5's "48px candidate" (per issue #321's own wording) and #303's 44px precedent are
  therefore **not in tension** — 48px is simply this repo's existing, already-shipped
  implementation of a 44px floor, forced by a gap in the spacing scale rather than a competing
  design opinion. This mission applies the identical, already-established shape rather than
  inventing a third resolution or debating a distinction that does not exist in the token scale.
- **Alternative considered**: introduce a new `--sk-space-8-5` (44px) token. Rejected: no other
  component in the repo would consume it, it would be the first non-round-number entry in an
  otherwise clean 4px-multiple-of-4-steps-then-16px-steps scale, and it would leave
  `sk-confirm-dialog`/`sk-context-nav` still on `--sk-space-9` — creating a THIRD spelling of the
  same 44px obligation instead of reusing the two that already exist. `adding-a-token.md`: "Do not
  add tokens for one-off values that are local to a single component" — a 44px token used by only
  this component while two existing components already use 48px for the same purpose is exactly
  that anti-pattern.
- **Only `min-block-size` is floored, not `min-inline-size`.** Both existing precedents
  (`confirm-dialog`, `context-nav`) float BOTH dimensions because their controls are
  intrinsically-sized buttons/links whose inline-size can shrink to content. `.sk-input` and
  `.sk-form-input__control` both already declare `width: 100%`, so their inline-size tracks their
  container in every realistic form-field layout; flooring `min-inline-size` as well would impose
  a minimum width even inside a consumer's deliberately narrow non-field usage, which is not what
  either precedent's own comment justifies for a self-sizing-by-content control. Recorded as a
  scoping decision in the spec's Edge Cases, not silently different from precedent without
  explanation.

## Decision: the anti-drift test is a static CSS-value-equality assertion, not a generation check

- **Decision**: A Node-lane Vitest test parses both `sk-form-field.css` and `sk-form-input.css`
  with `postcss`, extracts the `border` and `min-block-size` declaration values from the `.sk-input`
  and `.sk-form-input__control` rules respectively, and asserts (a) the two are equal to each other
  and (b) each equals the documented canonical expression.
- **Rationale**: Every other generated-artifact drift gate in this repo (`build-elements-css.mjs
  --check`, `build-element-markup.mjs --check`, `build-react-wrappers.mjs --check`) works because
  one file is mechanically DERIVED from another by a generator, so "drift" means "the generator's
  output no longer matches its input." **No such generator exists between `sk-form-field.css` and
  `sk-form-input.css`** — confirmed by reading `packages/elements/src/form-input/`: there is no
  `sk-form-input.markup.ts`, so `build-element-markup.mjs`'s glob (which derives its work set from
  `packages/elements/src/*/*.markup.ts`) never touches this component pair at all. The two files
  are independently authored today, which is precisely what #173 already documents ("the same
  declaration block modulo `1px` vs. `var(--sk-border-width-1)`") and precisely why the issue
  calls this "the hard part" — a VALUE-EQUALITY test is therefore this contract's only mechanical
  anti-drift option; a "generated-equal" check is not available without inventing a
  `sk-form-field.markup.ts` module, which is out of scope (#173 owns that surface, and doing so
  would also require registering a new markup source the issue does not ask for).
- **Precedent for the parsing technique**: `apps/storybook/src/tests/sk-form-select.spec.ts`
  already imports `postcss` and `postcss-selector-parser` (both existing devDependencies) to parse
  a component's own CSS source and assert structural properties of it, in this exact test
  directory shape. This mission's Node-lane test reuses the same libraries, parsing two files
  instead of one and comparing across them instead of within one.
- **Scope of the comparison, deliberately narrow**: only `border` and `min-block-size` — the two
  declarations this specific contract is for — not the whole rule. The two rules share several
  other declarations (`padding`, `background`, `font-family`, `font-size`, `color`, `outline`,
  `transition`, `box-sizing`) that are NOT part of this mission's contract and are already
  independently identical today; asserting the whole rule would silently expand this mission's
  scope to a general "these two files must never differ" rule the issue does not ask for and this
  spec does not own.

## Decision: rendered target-size and forced-colors tests use existing Playwright techniques, not new infrastructure

- **Decision**: A Playwright spec in `apps/storybook/src/tests/` drives the two ALREADY-EXISTING
  story sets (`form-formfield-html--form-input-default` etc., `elements-skforminput--default`
  etc. — confirmed via a real `storybook-static/index.json` build at this branch point, not
  guessed from title-to-id conventions), using two established patterns already proven in this
  repo:
  - **200% zoom simulation**: `root.style.zoom = '2'`, calibrated with a width-probe assertion
    (`element.style.width = '100px'; expect(rect.width).toBe(200)`), exactly as
    `apps/storybook/src/tests/sk-collection.spec.ts` already does (`zoomMetrics`, the "200% zoom
    plumbing is active" test, and the `narrow`/`zoom-200` condition loop over stories). This
    mission's test reuses the identical calibration probe rather than re-deriving one.
  - **Forced-colors emulation**: `page.emulateMedia({ forcedColors: 'active' })`, exactly as
    `apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts` already does, reading
    `getComputedStyle(...).borderTopStyle`/`.borderColor` from inside the element's shadow root
    for the element path and from the light-DOM control for the static path.
- **Rationale for "measured, not assumed" on forced-colors**: `adding-a-component.md`'s own
  history records a corrected claim about which elements get which automatic forced-colors remap
  (the `<summary>`-specific `LinkText` mapping was originally over-generalized, then corrected
  after in-engine measurement). `<input>` is a native form control and Chromium's forced-colors
  stylesheet gives form controls their own UA-level system-color mapping, distinct from a generic
  bordered `<div>`'s `CanvasText` remap — but this mission measures the ACTUAL resolved color
  rather than asserting a specific system-color keyword from memory, following that corrected
  precedent rather than repeating the mistake it fixed.
- **No new CI wiring required**: both `tests/node/**/*.test.ts` (Vitest) and the whole
  `apps/storybook/src/tests/` directory (Playwright, per that job's own comment: "Runs the whole
  testDir, NOT a list of named files... an unlisted spec... silently never executed") are already
  globbed. Adding the two new files is sufficient; no `vitest.config.mts`, `playwright.config.ts`,
  or `.github/workflows/*.yml` edit is needed or in scope.

## Decision: no new `visual.spec.ts` baseline wiring

- **Decision**: `apps/storybook/src/tests/visual.spec.ts` is not edited by this mission.
- **Rationale**: Verified by grep at this branch point — zero existing entries reference
  `form-input`, `formfield`, or `skforminput` in that file. Only three components have ever been
  wired into it (`sk-stub`, `sk-feature-card`, `sk-progress`, per the file's own header comment).
  Extending that opt-in, CI-authoritative (per this repo's own "harvest from the CI artifact, never
  local `--update-snapshots`" rule) baseline system to a component it has never covered is a wider
  decision than this bounded, single-WP contract should make unilaterally. The charter's own
  "visual review... approved" gate is satisfied by human review of the PR's before/after
  screenshots, backed by this mission's new automated rendered-measurement tests (FR-007/FR-008).

## Open questions this research does NOT resolve (deliberately, and named rather than silently skipped)

- **The exact resolved forced-colors system color for `<input>` under Chromium/Firefox.** Recorded
  as "measure, don't assume" in FR-008/NFR- coverage above; the actual value is a Phase 3/WP-time
  measurement, not a planning-time decision, because it depends on the real rendering engine and
  this repo's own convention (`adding-a-component.md`) explicitly warns against assuming it from
  general rules.
- **`.sk-button--secondary`'s own adoption of `--sk-border-control`.** Explicitly #155's decision,
  not this mission's — recorded as a coordination note only (FR-010), never performed here.
