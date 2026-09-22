# Phase 0 Research: `.sk-input` / `sk-form-input` contrast and touch-target contract

All repo-file evidence below is verified at `train/elements-first@4d6c5f2` — this mission's own
branch point (confirmed: `git merge-base mission/form-input-contrast-touch-target-contract
train/elements-first` = `4d6c5f2db5a774f4676d74129c8205e01e231f8a`). The Family 5 design-provenance
pin `4c9e3ff` cited by issue #321 predates this and is provenance only, not a code reference.

## Decision: `--sk-border-control` is an INDEPENDENTLY DECLARED LITERAL per theme, not an alias

**Reversed during review.** This section originally chose `--sk-border-control: var(--sk-fg-subtle);`
as an alias. A coordinator review (2026-09-10, after this mission's spec/plan/tasks were first
authored) rejected that choice before any implementation began, and this section is rewritten to
record the corrected decision and why the alias was wrong — not silently replaced, since the
reasoning that was wrong is itself instructive.

- **Decision**: `--sk-border-control` is declared as its own hex literal in each theme block —
  `#81818B` in `:root`, `#7A7A6E` in `:root[data-theme="light"], .sk-light` — with no `var()`
  reference to `--sk-fg-subtle` or any other token.
- **Why the alias was wrong, not merely non-ideal**: Aliasing couples this role's 3:1 non-text
  obligation to a token whose entire motivation is a DIFFERENT, unrelated obligation — text
  contrast at 4.5:1. These two requirements are independent and move for different reasons.
  `--sk-fg-subtle` has already moved once for a purely text reason, and the token file records it
  in its own words: *"Was `#6E6E78`, which failed WCAG AA on BOTH surfaces: 3.45:1 on
  `--sk-surface-card` and 3.83:1 on `--sk-surface-page`. `#81818B` is the minimum same-hue
  lightening that clears 4.5:1 (4.51 / 5.01). #101"*. That comment describes a move made to
  satisfy text alone. A future such move has no reason to consider a border's 3:1 floor at all —
  and **nothing would catch it**: `bash scripts/check-token-breaking-changes.sh` was read in full
  during this correction; it diffs `token-catalogue.json` between the current tree and the most
  recent git tag and reports only tokens that were REMOVED or RENAMED. It computes no contrast
  whatsoever. A text-motivated nudge to `--sk-fg-subtle` changes no token name, so this script
  would report zero problems while `--sk-border-control` (if still aliased) silently dropped below
  3:1 on whichever surface the nudge happened to undershoot.
- **The margin made this concrete, not theoretical.** The alias's light-theme value against
  `--sk-surface-input` measured **3.09:1** — 0.09 of headroom on a 1px hairline, where
  antialiasing already erodes perceived contrast below the mathematically computed value. A small,
  plausible, text-motivated future edit to `--sk-fg-subtle` could cross that line with no signal
  anywhere in this repo's existing gates.
- **The counter-precedent does not apply.** `--sk-color-data-baseline` and `--sk-chart-baseline`
  both alias `--sk-fg-subtle` today (confirmed by reading `tokens.css`) — so aliasing itself is not
  the objection, and this decision does not claim the repo never aliases into `--sk-fg-subtle`.
  Those two are chart marks carrying no stated WCAG contract of their own; nothing in this repo
  asserts a minimum contrast for them, so there is no independent obligation for a future
  `--sk-fg-subtle` edit to violate. `--sk-border-control` is the opposite case by construction —
  its entire reason for existing IS a measured 3:1 obligation this mission establishes. Aliasing a
  token with no stated contract to `--sk-fg-subtle` risks nothing; aliasing a token whose whole
  purpose is a contract risks exactly what the margin analysis above shows.
- **The Borders block's own convention supports the fix, not just permits it.**
  `--sk-border-default`, `--sk-border-strong`, and `--sk-border-focus` are all literals — a literal
  here is house style, not an exception carved out for this token.
- **Alternatives considered and rejected** (dark theme was never in question — `#81818B` clears
  5.01:1 / 4.51:1 / 4.28:1 with ample margin and needed no change; all analysis below is about the
  light-theme value):
  - *Keep the alias's light value, `#8A8A7E`, as a literal.* Technically satisfies "not an alias"
    but ships the exact 3.09:1 knife-edge the coordinator flagged as too tight for a 1px hairline.
    Rejected — decoupling from `--sk-fg-subtle` is necessary but not sufficient; the margin itself
    needed to grow.
  - *A same-hue-preserving lighten/darken of `--sk-border-strong`* (the original alternative this
    section considered before choosing the alias). Computed in HLS to find the minimal same-hue,
    same-saturation shift clearing 3:1 against `--sk-surface-input`: light resolves to `#9A8A5A`
    at L≈0.478 — a visibly more saturated, brownish-gold color than the neutral-gray family
    `--sk-border-default`/`-strong` establish (HSL saturation is not perceptually uniform across
    lightness). Rejected: visually inconsistent with the Borders block's neutral character.
  - *Reuse `--sk-fg-muted`* (light `#5C5C52`, 5.99:1 minimum). Clears 3:1 with very large margin
    but reads as a much heavier, bolder box than a subtle control hairline warrants — the same
    objection that ruled it out originally, still valid independent of the alias question.
  - **Chosen: a new literal in the same warm-neutral family as `--sk-fg-subtle` and the existing
    Borders block, darkened enough to move well off the 3.09:1 edge without becoming a bold,
    heavy-looking border.** Four points on that family's line (all preserve the `R = G >
    B`-by-roughly-12-units warm-neutral shape `--sk-fg-subtle` and the tint-family literals
    already share) were measured against light `--sk-surface-page` (`#F8F5EC`), `--sk-surface-card`
    (`#FFFFFF`), and `--sk-surface-input` (`#F5F1E6`), independently re-verified with the same
    relative-luminance script used throughout this document (not quoted from review):

    | candidate | vs page | vs card | vs input |
    |---|---|---|---|
    | `#8A8A7E` (the rejected alias's light value) | 3.20 | 3.49 | 3.09 |
    | `#828276` | 3.56 | 3.89 | 3.44 |
    | **`#7A7A6E` — chosen** | **3.98** | **4.34** | **3.85** |
    | `#727267` | 4.46 | 4.86 | 4.31 |

    `#7A7A6E` was chosen over the more conservative `#828276` because the point of this exercise
    was to move meaningfully off the 3:1 edge, not to make the smallest defensible nudge — one
    step further (`#7A7A6E`) buys most of a full point of headroom (3.09 → 3.85 against the
    tightest surface) while staying inside the same warm-neutral family and still reading as a
    hairline rather than a bold border. `#727267` was available for still more margin but was not
    needed once `#7A7A6E` was comfortably clear on every surface.
- **Full measured table for the chosen values** (both literals, both themes, three surfaces each —
  six pairs, none aliased):

  | theme | value | vs `--sk-surface-page` | vs `--sk-surface-card` | vs `--sk-surface-input` |
  |---|---|---|---|---|
  | dark  | `#81818B` | 5.01:1 | 4.51:1 | 4.28:1 |
  | light | `#7A7A6E` | 3.98:1 | 4.34:1 | 3.85:1 |

  Every one of the six clears 3:1 with comfortable margin; the tightest is now light-theme vs.
  `--sk-surface-input` at **3.85:1**, up from the alias's 3.09:1.
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
  chosen color clears 3:1 with margin on every surface in both themes (tightest 3.85:1) without
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

## Decision: an executable contrast assertion, sibling to the parity test, narrowly scoped

- **Decision**: Add `tests/node/form-input-border-control-contrast.test.ts` (Vitest Node lane,
  auto-globbed the same way as the parity test) that parses BOTH theme blocks of
  `packages/tokens/src/tokens.css` with `postcss`, resolves the literal hex for
  `--sk-border-control`, `--sk-surface-page`, `--sk-surface-card`, and `--sk-surface-input` from
  each block, computes the WCAG relative-luminance contrast ratio (the same formula used
  throughout this document), and asserts ≥3:1 on all six (theme × surface) combinations.
  Demonstrated red first: temporarily nudge `--sk-border-control`'s hex one step toward one of its
  obligated surfaces, run the test, confirm it fails and names the failing (theme, surface) pair,
  revert, confirm green.
- **Rationale**: Issue #321 asks for measured ratios "recorded in the PR" — but a number in a PR
  description cannot go red on a future regression, and this mission's own governing thesis (the
  reason FR-006's parity test exists at all) is that an unenforced contract drifts. The same
  argument that justified building a mechanical parity check for the border/target-size VALUES
  applies identically to the CONTRAST the color choice is supposed to guarantee — especially since,
  per the corrected decision above, `bash scripts/check-token-breaking-changes.sh` provably does
  not cover this (it diffs only removed/renamed token NAMES, never a resolved color's contrast
  against anything). Without this test, the six ratios in `NFR-002`/the PR body are testimony, not
  proof, and the very drift this mission spent its "Decision: independently declared literal"
  section preventing at the DEFINITION level would still be undetectable at the VALUE level if a
  future edit changed the literal directly.
- **Deliberately NOT the general #155 gate.** #155's own text raises, as an open question,
  "whether a 1.4.11 check belongs in the a11y gate" — a repo-wide mechanism that would iterate
  every border-ish token/selector pair in the library. This test does none of that: it names
  exactly one token (`--sk-border-control`) and exactly three surfaces, both already fixed by this
  mission's own contract. It adds no probe table, no empty-set floor, and no iteration over any
  other component. The spec and the PR body both state this explicitly so a reviewer does not read
  this test as #155's open question being silently answered or absorbed — the same discipline this
  mission already applies to not absorbing #155's `.sk-button--secondary` adoption itself.
- **Parsing approach**: `postcss` (already a devDependency, already used this way by
  `apps/storybook/src/tests/sk-form-select.spec.ts` and by this mission's own parity test) walks
  `tokens.css`, finds the rule whose selector is exactly `:root` and the rule whose selector is
  exactly `:root[data-theme="light"], .sk-light` (or matches that string set — verify the precise
  selector text against the file at implementation time rather than assuming the exact string
  survives untouched), and reads each block's `--sk-border-control`/`--sk-surface-*` custom
  property declarations by name. Because this mission's own token declarations are literals (not
  `var()` chains), no recursive resolution is needed — a direct hex read per block is sufficient
  for these four tokens specifically. (This would NOT generalize as-is to a token whose value is
  itself a `var()` chain; scoping the test to exactly these four tokens, as decided above, is what
  keeps this simplification valid.)
- **Roughly thirty lines**, per the review that requested it — this is a small, single-purpose
  assertion file, not a framework.

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

## Decision: no new `visual.spec.ts` baseline wiring, and the one existing form-related baseline is confirmed unaffected

- **Decision**: `apps/storybook/src/tests/visual.spec.ts` is not edited by this mission.
- **Rationale**: Verified by grep at this branch point — zero existing entries reference
  `form-input`, `formfield`, or `skforminput` in that file. Only three components have ever been
  wired into it (`sk-stub`, `sk-feature-card`, `sk-progress`, per the file's own header comment).
  Extending that opt-in, CI-authoritative (per this repo's own "harvest from the CI artifact, never
  local `--update-snapshots`" rule) baseline system to a component it has never covered is a wider
  decision than this bounded, single-WP contract should make unilaterally. The charter's own
  "visual review... approved" gate is satisfied by human review of the PR's before/after
  screenshots, backed by this mission's new automated rendered-measurement tests (FR-007/FR-008).
- **Checked, not assumed: the file's one existing FORM-adjacent baseline is unaffected.** A
  coordinator review flagged that `visual.spec.ts` does baseline a story at
  `form-skformselect-html--*` (`formSelectStory()`, line ~783) that locates `.sk-form-field` — the
  container class defined in the SAME file (`sk-form-field.css`) this mission edits — and asked
  for confirmation rather than an inherited reading. Verified directly: every
  `packages/styles/src/form-select/*.html` exemplar renders `class="sk-form-field"` on the
  wrapping element and `class="sk-form-select"` (never `class="sk-input"`) on the actual control —
  `.sk-input` does not appear anywhere in the form-select exemplars or `sk-form-select.css`. The
  `.sk-form-field` rule itself (`display: flex; flex-direction: column; gap: var(--sk-space-2);`)
  is untouched by this mission — only `.sk-input`/`.sk-textarea`, two DIFFERENT rules in the same
  file, change. So the baselined screenshot's subject subtree contains no element this mission
  touches, and no geometry change is expected. **If a future re-check ever finds this baseline
  moved**, it must be harvested from that CI run's `visual-regression-diffs` artifact per this
  repo's CI-authoritative convention — never re-shot locally.
- **While checking this, a third sibling weak-hairline instance was found and is named, not
  fixed**: `packages/styles/src/form-select/sk-form-select.css`'s `.sk-form-select` rule also
  declares `border-color: var(--sk-border-default)` — the identical weak token this mission
  replaces on `.sk-input`/`.sk-form-input__control`, on a THIRD control the source issue never
  named. Out of scope by the same reasoning as `.sk-textarea`/`.sk-form-textarea__control`
  (adjacent instance, not silently pulled in) — recorded here, in the spec's Constraints/Edge
  Cases, and to be named in the PR body, so the next author finds a record of three known
  remaining instances rather than rediscovering the third one from scratch.

## Open questions this research does NOT resolve (deliberately, and named rather than silently skipped)

- **The exact resolved forced-colors system color for `<input>` under Chromium/Firefox.** Recorded
  as "measure, don't assume" in FR-008/NFR- coverage above; the actual value is a Phase 3/WP-time
  measurement, not a planning-time decision, because it depends on the real rendering engine and
  this repo's own convention (`adding-a-component.md`) explicitly warns against assuming it from
  general rules.
- **`.sk-button--secondary`'s own adoption of `--sk-border-control`.** Explicitly #155's decision,
  not this mission's — recorded as a coordination note only (FR-010), never performed here.
