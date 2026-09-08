# Research: Work Explorer segmented-choice styles

**Mission**: `work-explorer-segmented-choice-styles-01M20C9F` | **Date**: 2026-09-08
**Input**: GitHub issue [#270](https://github.com/spec-kitty/spec-kitty-design/issues/270) (epic
[#269](https://github.com/spec-kitty/spec-kitty-design/issues/269)), `spec.md` (PASSED R1-R6),
`plan.md` (PASSED down to 3 open low/medium consistency findings in `reviews/plan-fresh-2.yaml`).

**Purpose of this document**: the runtime's research phase was marked complete without ever
running. This backfills it: every factual claim spec.md's and plan.md's prose rely on was
independently re-verified against the live repository tree on 2026-09-08 (not copied from
plan.md's own text). Where a claim did not hold, it is flagged explicitly in
[Discrepancies found](#discrepancies-found) below rather than silently corrected — correcting
spec.md/plan.md is a later phase's job, not this backfill's.

## Decision drivers

- The mission is **styles-only**: a CSS class family plus hand-authored `.html` exemplars, no
  custom element, no Lit class, no shadow DOM, no manifest entry, no generated framework wrapper.
  This must be grounded in real precedent (ADR-10), not asserted.
- Every CSS value must resolve to an existing `var(--sk-*)` token; the pressed-fill token
  (`--sk-bg-pill`) must already exist and already be used this way somewhere in the tree.
- Forced-colors correctness has a specific, previously-learned failure mode (a background-painted
  cue frozen by `forced-color-adjust: none`, invisible against the forced background) and a
  specific fix pattern (longhand `-color` properties, system-color keywords) that must be located
  and confirmed, not assumed to exist.
- The Playwright hover/active assertion pattern this mission's spec (FR-009) must reuse is cited
  by file and line number in three other spec files; those line numbers must be confirmed current,
  not stale.
- The `expected-stories.json` ratchet's current `total` must be measured, not guessed, since
  FR-013/SC-008 requires the bump to be exact.

## Researched questions

### Q1 — Is `sk-segmented-choice` correctly classified as styles-only under ADR-10?

**Decision**: Yes, but classified on issue #270's own explicit instruction ("Do not register a
custom element"), not on ADR-10's structural-semantics rationale — this is a deliberate,
verified distinction spec.md's Terminology section already draws, and this research confirms
it rather than restates it uncritically.

**Rationale**: ADR-10's "Styles-only components are a class, not a fixed exception count" section
(`docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md`) states the
rule precisely: *"A component whose entire value is the semantics of a native element it styles is
styles-only by design, not by exception."* It names exactly five components under that rule —
`sk-facts`, `sk-disclosure`, `sk-data-table`, `sk-empty-state`, `sk-skip-link` — and gives four
structural reasons none of them can have a wrapper element without breaking the semantics they
provide: unbroken `<dl>`/`<table>`/`<li>` parent/child chains, cross-shadow-root ID references
(`<label for>`, `<th id>`/`<td headers>`), a document-scoped `href="#main"` a shadow boundary
cannot cross, and UA-owned `<details>` open/closed state. A plain `<button>` group shares none of
these four reasons — buttons do not depend on a same-root ID reference, an unbroken list chain, a
document-scoped href, or UA-owned disclosure state. spec.md's Terminology section already draws
this line correctly and declines to claim the ADR-10 structural rationale for this component;
this research independently confirms that restraint is warranted, not merely asserted by spec.md.
The five-component list is cited only for generation-tooling precedent (barrel generation,
`.html`-exemplar authoring), which is a separate, valid citation.

**Alternatives considered**: Claiming ADR-10's structural rationale directly (rejected — the four
reasons genuinely do not apply to a button group, and misclassifying would weaken the ADR's own
scoping the next time a reviewer needs to tell "styles-only by structural necessity" apart from
"styles-only because the issue said so"). Registering a custom element with no shadow DOM
(rejected — issue #270 explicitly forbids it, and it would gain nothing: no `::part()`, no
behaviour, no manifest value).

**Evidence**: `docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md`
lines 69-105 (class-level ruling, five components, four reasons); issue #270 body ("Do not
register a custom element"); `spec.md` Terminology section (lines 23-43).

---

### Q2 — Does the generation-tooling precedent (`sk-form-select`, `sk-disclosure`,
`scripts/build-styles-only-markup.mjs`) match what plan.md/spec.md claim?

**Decision**: Confirmed as claimed — both precedent directories hold exactly the shape spec.md
and plan.md describe.

**Rationale**: `packages/styles/src/form-select/` holds one authored CSS file
(`sk-form-select.css`), seven authored `.html` exemplars (`compact`, `disabled`, `long-options`,
`optgroups`, `required-invalid`, `t10-lane`, `t12-filters`), a generated `index.ts`, and a
`.stories.ts` file — ten stories in `expected-stories.json`'s `sk-form-select` entry, confirming
the "7 files, 10 stories" asymmetry plan.md's Project Structure section cites as precedent for
this mission's own planned "9 files, 13 stories" asymmetry.
`packages/styles/src/disclosure/` holds the same shape: one CSS file, four `.html` exemplars, a
generated `index.ts`, and a `.stories.ts` file. Neither directory has a corresponding
`packages/elements/src/` sibling, matching C-001/C-002's no-custom-element constraint.

**Alternatives considered**: None — this question is purely a precedent-existence check, not a
design choice.

**Evidence**: `ls packages/styles/src/form-select/` and `ls packages/styles/src/disclosure/`
(both read directly, 2026-09-08); `expected-stories.json` lines 250-260 (`sk-form-select`'s ten
story ids).

---

### Q3 — Is `--sk-bg-pill` the correct, already-established token for the pressed/selected fill?

**Decision**: Confirmed — `--sk-bg-pill` is the right token, but not because `--sk-surface-pill`
is absent: both tokens exist and are live in `packages/tokens/src/tokens.css`. `--sk-bg-pill`
remains correct for this component on a semantic-pairing/precedent basis, not on an existence
basis. **This corrects an earlier version of this question, which incorrectly asserted
`--sk-surface-pill` "was not found" — see the correction below.**

**Rationale**: `packages/styles/src/nav-pill/sk-nav-pill.css` declares
`.sk-nav-pill__item--active { background: var(--sk-bg-pill); … }` (and repeats the same token for
the hover-while-active and slotted-active variants) — a live, shipping precedent for using
`--sk-bg-pill` as exactly the "active pill fill" role FR-015 assigns it for
`sk-segmented-choice__item[aria-pressed="true"]`.

This research's first pass stated that "No `--sk-surface-pill` token was found in
`packages/tokens/src/tokens.css` during this check." That was wrong. `--sk-surface-pill` is
declared twice in `tokens.css`: line 42 (dark theme, `#212830`) and line 391 (light-theme
override, `#ECE7D8`) — identical in both themes to `--sk-bg-pill`'s own declarations (line 181,
`#212830`; line 513, `#ECE7D8`). Both tokens are present in the generated token catalogue.
`--sk-surface-pill` is in fact used by *more* shipping components today (6:
`sk-bar-chart`, `sk-context-nav`, `sk-transition-matrix`, `sk-action-row`,
`sk-time-series-chart`, `sk-workflow-lane`) than `--sk-bg-pill` is (2: `sk-nav-pill`,
`sk-pill-tag`).

Despite `--sk-surface-pill`'s wider existing use, `--sk-bg-pill` is still the right choice for
*this* component. The actual rationale is semantic pairing and direct precedent match, not token
existence: `sk-nav-pill.css`'s `.sk-nav-pill__item--active { background: var(--sk-bg-pill); }` is
a directly analogous "active pill fill on a pressed/selected pill-shaped item" precedent — the
exact shape `sk-segmented-choice__item[aria-pressed="true"]` needs — whereas
`--sk-surface-pill`'s six consumers are general surface backgrounds (chart rows, nav rails, lane
backgrounds), not a pressed/active-state semantic. The `--sk-bg-*` family is this token set's
pressed/interactive-fill family (paired with `--sk-on-*` foregrounds); `--sk-surface-*` is the
general-surface family. Matching the pill-shaped active-item precedent to the pressed/interactive
family, rather than the general-surface family, is the correct semantic pairing (CLAUDE.md rule
3) regardless of which token has more existing callers.

Separately, grepping `packages/styles/src/nav-pill/sk-nav-pill.css` and
`packages/styles/src/form-select/sk-form-select.css` for `forced-colors` returns zero matches in
both files, confirming C-004's claim that these two files are cited only for base-state token
reuse, not for the forced-colors technique (sourced instead from `sk-skip-link.css`/
`sk-data-table.css`, Q4).

One discrepancy this question did surface, not previously flagged: spec.md's C-004 sentence reads
"matching the base-state precedent in `sk-nav-pill.css` and `sk-form-select.css`," naming both
files together as precedent for the same `--sk-bg-pill` claim the sentence opens with. Grepping
`packages/styles/src/form-select/sk-form-select.css` for `sk-bg-pill` or `sk-surface-pill` returns
zero matches (exit code 1) — the file's actual base-state tokens are `--sk-surface-input`,
`--sk-border-default`, `--sk-border-focus`, `--sk-border-width-1`/`2`, `--sk-radius-sm`, and
`--sk-color-red`, none of them the pill-fill token family at all. Only `sk-nav-pill.css`
demonstrates the `--sk-bg-pill` active-fill pattern (EV-001, above). This does not change Q3's own
`--sk-bg-pill` conclusion, which rests entirely on `sk-nav-pill.css`'s precedent — but C-004's
citation of `sk-form-select.css` as if it also backed `--sk-bg-pill` does not hold on inspection.
See [Discrepancies found](#discrepancies-found) item 3, below, and evidence-log EV-033.

**Alternatives considered**: A new component-named token (rejected — FR-015/C-004 forbid it
without cause, and none exists here). `--sk-surface-pill` (rejected — not on a nonexistence basis
as this research's first pass incorrectly stated, but because it lacks the direct "active pill
fill" precedent `--sk-bg-pill` has in `sk-nav-pill.css`, and its six existing consumers are
general-surface uses rather than a pressed/active-state semantic).

**Evidence**: `packages/styles/src/nav-pill/sk-nav-pill.css` lines 39-50, 128-143 (four
occurrences of `background: var(--sk-bg-pill)`); `packages/tokens/src/tokens.css` lines 42, 181,
391, 513 (both tokens, both themes — see evidence-log EV-029); `packages/styles/src/nav-pill/
sk-nav-pill.css` and `packages/styles/src/form-select/sk-form-select.css` (whole files, zero
`forced-colors` matches — see evidence-log EV-031).

---

### Q4 — Does the forced-colors longhand `-color` technique (C-010/NFR-004) exist as precedent,
and is the shorthand genuinely unpoliced by stylelint?

**Decision**: Confirmed on both counts — the technique exists in two shipping components, and
`stylelint.config.mjs`'s own source comment independently states the same rationale C-010 gives.
**This corrects an earlier version of this question, which incorrectly claimed stylelint's
`ignoreValues` list "exactly" matches C-010/NFR-004's keyword set — see the correction below.**

**Rationale**: `packages/styles/src/skip-link/sk-skip-link.css` has a
`@media (forced-colors: active)` block (starting line 74) that sets only `outline-color: Highlight;`
— the longhand form, never the `outline` shorthand.
`packages/styles/src/data-table/sk-data-table.css` has an equivalent block (starting line 247)
setting `border-left-color: Canvas`, `border-left-color: CanvasText`, and
`border-left-color: Highlight` across three rules — again longhand only.
`stylelint.config.mjs`'s `ignoreValues` array (lines 52-58) lists seven keywords: `Canvas`,
`CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `LinkText`, `GrayText`. This is **not**
an exact match to C-010/NFR-004's own enumerated set: spec.md's C-010 names only six keywords in
its own parenthetical (`Highlight`, `CanvasText`, `ButtonText`, `LinkText`, `Canvas`,
`HighlightText`) and does not mention `GrayText` anywhere; NFR-004 does not independently
enumerate any keywords either — it defers to C-010's list. So stylelint's allowlist is a
**superset** of C-010's six named keywords, with one extra entry (`GrayText`) that neither C-010
nor NFR-004 names. That extra entry is not idle: `GrayText` is this repository's own precedent for
exactly the disabled/unavailable forced-colors cue this mission's FR-004/NFR-004 disabled-item
treatment will need — `packages/styles/src/context-nav/sk-context-nav.css`'s own
`@media (forced-colors: active)` block (lines 195-199) sets
`.sk-context-nav__unavailable { color: GrayText; border-inline-start-color: GrayText; }`. Because
`GrayText` is already present in stylelint's `ignoreValues` (so no config change is needed to use
it) but is not named in C-010's enumeration, a WP author who needs a disabled-state forced-colors
cue and reaches for `GrayText` by this repo's own precedent would be reasonable to do so, but
should not read C-010 as having already authorized it — C-010's own list would need widening
(a later phase's job, not this backfill's) to name it explicitly. The policed property list for
`scale-unlimited/declaration-strict-value` is
`['/color/', 'background', 'background-color', 'font-family', 'padding', 'margin',
'border-radius']` — `border`/`outline` (the shorthand forms) are absent from that list, so a
hardcoded-colour shorthand would pass the gate identically to a token. The config file's own
comment (lines 35-51) states this exact concern independently of C-010, giving two independent
confirmations of the same fact rather than one.

**Alternatives considered**: None — this is a precedent-and-tooling-behaviour check, not a design
choice. The technique is the only one observed in the tree for this exact problem.

**Evidence**: `packages/styles/src/skip-link/sk-skip-link.css` lines 67-77;
`packages/styles/src/data-table/sk-data-table.css` lines 247-258;
`stylelint.config.mjs` lines 17-59 (rule config, `ignoreValues`, policed-property list, and the
file's own rationale comment); `kitty-specs/work-explorer-segmented-choice-styles-01M20C9F/spec.md`
(C-010 row, Constraints table: six named keywords, no `GrayText`); `packages/styles/src/
context-nav/sk-context-nav.css` lines 195-199 (`GrayText` used for the disabled/unavailable
forced-colors cue — see evidence-log EV-032).

---

### Q5 — Are the three cited Playwright hover/active line numbers (`sk-context-nav.spec.ts:813`,
`sk-transition-matrix.spec.ts`, `sk-bar-chart.spec.ts:257`) current and pointing at the right test?

**Decision**: Two of the three citations are current and correct as spec.md states them;
**one is stale in spec.md and plan.md's own correction is right** — see
[Discrepancies found](#discrepancies-found) for the flag.

**Rationale**:
- `sk-context-nav.spec.ts:813` is `await ordinary.hover();`, inside the test
  `'hover, active, focus-visible, and current have distinct shape/weight/border/outline cues'`
  (starts line 808). This matches spec.md's FR-009 citation exactly — correct as written.
- `sk-bar-chart.spec.ts:257` is `await trigger.hover();`, inside the test
  `'real rest, hover, focus, active, selected and nonselectable states stay distinct'`
  (starts line 241). This matches spec.md's FR-009 citation exactly — correct as written.
- `sk-transition-matrix.spec.ts` is where spec.md and plan.md disagree with each other, and this
  research independently confirms which one is right: spec.md's FR-009 cites `:285`. Line 285 is
  `await row.hover();`, but it sits inside the test `'non-selectable selected data has zero
  interaction residue'` (starts line 265) — the **negative/invariance** test, which asserts hover
  produces **no** style delta on a non-selectable row. That is the opposite of the pattern FR-009
  wants (a positive computed-style-delta assertion). The actual positive-delta test —
  `'selectable rows expose positive hover, keyboard focus-visible, and active or pressed deltas'`
  — starts at line 312, with its own `await row.hover();` at line 326. plan.md's Technical Context
  section already caught this and cites `:312` instead, explicitly noting "spec.md's FR-009 still
  cites the stale `:285` line." This research confirms that note is accurate: `:285` is real code,
  but it is the wrong test for the pattern being cited.

**Alternatives considered**: None — this is a line-number verification, not a design choice.

**Evidence**: `apps/storybook/src/tests/sk-context-nav.spec.ts` lines 808, 813;
`apps/storybook/src/tests/sk-bar-chart.spec.ts` lines 241, 257;
`apps/storybook/src/tests/sk-transition-matrix.spec.ts` lines 265, 285, 312, 326;
`plan.md` Technical Context / Testing paragraph (line 36-39, the note about the stale `:285`).

---

### Q6 — Is `expected-stories.json`'s current `total` 323, and does its `$comment` exclude docs
entries as claimed?

**Decision**: Confirmed — `total` is 323 today (before this mission's work), and the `$comment`
array does state the docs-exclusion rule in the exact words plan.md quotes.

**Rationale**: `expected-stories.json` line 449 reads `"total": 323`. Its `$comment` array (from
line 2) is a running log of every prior addition; the phrase *"Docs entries are excluded, matching
every other element here"* appears verbatim in the `#177` entry (the `sk-card` addition's note).
The `sk-workflow-board` entry's own note independently documents the same
intentional-Default/DefaultDark-duplication pattern plan.md cites as precedent for this mission's
`Default`/`DefaultDark` story pair. 323 + 13 (this mission's planned story count) = 336, matching
plan.md's stated target exactly.

**Alternatives considered**: None — this is a direct read of a JSON field and a comment string,
not a design choice.

**Evidence**: `expected-stories.json` line 449 (`"total": 323`); `expected-stories.json` `$comment`
array, the `#177` entry (docs-exclusion phrase) and the `sk-workflow-board` entry (line 34,
Default/DefaultDark precedent); `expected-stories.json` lines 250-260 (`sk-form-select`'s 10-story
entry, corroborating Q2's file/story asymmetry).

---

### Q7 — Does ADR-11's required-behaviours list genuinely not apply to a component with no shadow
root, no Lit class, and no JS?

**Decision**: Confirmed — every one of ADR-11's 11 required-behaviour items concerns a mechanism
this component does not have.

**Rationale**: `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`
lists 11 required behaviours (§"Required behaviours", lines 52-69): form association (needs
`ElementInternals`/`setFormValue`), event contract (`composed`/`bubbles`/cancelable custom
events), property-before-upgrade (needs a custom-element upgrade lifecycle), slot contract (needs
a shadow root with `<slot>`), focus/keyboard state attributes tracking real state (needs a
component that owns focus management beyond native semantics), `::part()` styling API (needs a
shadow root), style adoption (`adoptedStyleSheets`, needs a shadow root), registry guard
(`customElements.define`, needs a registered element), generation determinism (Node-lane wrapper
generation, needs a manifest entry), delegate/rendered-control correspondence (needs a probe
element pattern), and responsive threshold (needs a component whose behaviour, not just its CSS,
changes at a breakpoint). `sk-segmented-choice` has none of the preconditions any of these 11
items assume — no shadow root, no Lit class, no `customElements.define`, no manifest entry, no
JS-owned focus/keyboard behaviour beyond what the native `<button>` already provides. This confirms
plan.md's Charter Check section's claim and FR-014's "confirmed, not assumed" framing.

**Alternatives considered**: None — this is a scoping-boundary check against a fixed, numbered
list, not a design choice.

**Evidence**: `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`
lines 44-70 (the two-layer table and the 11-item required-behaviours list).

---

### Q8 — Is the `apps/demo/*.html` / `scripts/assemble-demo-dist.sh` no-op claim (C-008/FR-016)
actually zero-hit?

**Decision**: Confirmed — zero hits.

**Rationale**: `grep -rn "segmented" apps/demo/*.html scripts/assemble-demo-dist.sh` returns no
matches (exit code 1). Neither demo page references this component, and the assemble script's
component set is derived from what the demo pages reference, so no allowlist edit is needed
either — matching plan.md's claim that this is "confirmed by grep during plan authoring," now
independently re-confirmed.

**Alternatives considered**: None — this is a direct grep, not a design choice.

**Evidence**: `grep -rn "segmented" apps/demo/*.html scripts/assemble-demo-dist.sh` (run
2026-09-08, zero matches, exit code 1).

---

### Q9 — Is C-009's "pre-merge is not tiered" claim, and the claim that
`elements-first-programme.md` does not classify this mission, accurate?

**Decision**: Confirmed on both counts.

**Rationale**: `docs/architecture/elements-first-programme.md` line 31 states verbatim:
*"Pre-merge is not tiered. Every PR into the train gets the full gate — all four lenses — and its
evidence posted as a PR comment before the merge."* The document's tier table (lines 35-37) maps
Tiers A/B/C to internal mission slugs `M2` through `M16` — a closed, numbered foundational
programme distinct from epic #269's Work Explorer children. Neither `270` nor `segmented` appears
anywhere in the file. This confirms C-009's claim that the tier document "does not enumerate this
mission at all" and is cited only for what "Tier C" and "pre-merge" mean operationally, not as a
second classifying source.

**Alternatives considered**: None — this is a grep-and-read check against a specific document's
claims, not a design choice.

**Evidence**: `docs/architecture/elements-first-programme.md` line 31 (pre-merge-not-tiered rule);
lines 35-37 (tier table, M2-M16); `grep -n "270\|segmented" docs/architecture/elements-first-programme.md`
(zero matches, 2026-09-08).

---

### Q10 — Does GitHub issue #270's actual text match spec.md's quoted/paraphrased content, and
does epic #269 match the dependency-plan claims?

**Decision**: Confirmed — spec.md's quoted Application-ownership blockquote and Non-goals list
are verbatim matches; the rest of spec.md's paraphrase is a faithful restatement.

**Rationale**: `gh issue view 270 --repo spec-kitty/spec-kitty-design` returns the issue body
verbatim. The Application-ownership paragraph spec.md quotes as a blockquote
("Team Kitty owns the lane/person/type vocabulary…") matches the issue's own "Application
ownership" section word-for-word. The Non-goals list spec.md restates ("Tabs, tab panels, radio
group, select replacement, navigation, router binding, item arrays, keyboard roving, automatic
exclusivity, counts, badges, filter logic, persistence, animation conveying state, or a registered
`sk-segmented-choice` element") matches the issue's own Non-goals section item-for-item. The
issue's Evidence section states the 1024px figure directly ("W4 requires the group to remain
operable when the toolbar wraps at 1024px"), matching C-005's citation. "Squad tier: C —
pre-merge" appears verbatim in the issue header, matching C-009. Epic #269's dependency plan
(`gh issue view 269`) confirms the Wave 1/2/3 structure plan.md and spec.md cite: #270-#273
Wave 1 (independent, parallel), #274 Wave 2 (after #254), #275 Wave 3 (after #270-#274 and #254)
— matching C-008/FR-016's claim that composition is "epic #269's later #275/TKX6 mission."

One minor note, not a contradiction: the issue's own wording is "controls meet the 44px target
requirement," not literally "44×44px." spec.md's NFR-002/FR-006 interpretation of this as a
44×44px minimum target size is the standard reading of a CSS "target size" requirement (matching
WCAG 2.5.5/2.5.8's own "44 by 44 CSS pixels" language) and is a reasonable, not an invented,
interpretation — flagged here only for completeness, not as a defect.

**Alternatives considered**: None — this is a source-of-truth text comparison, not a design
choice.

**Evidence**: `gh issue view 270 --repo spec-kitty/spec-kitty-design` (retrieved 2026-09-08);
`gh issue view 269 --repo spec-kitty/spec-kitty-design` (retrieved 2026-09-08); `spec.md` lines
287-312 (Application ownership, Non-goals, Dependencies sections).

## Additional precedent checks

Three further evidence-log rows back narrative claims made elsewhere in this mission's design
documents but were not walked through as their own numbered question above. Recorded here for
completeness, so a reader following this document's Q-by-Q structure can find where each was
checked:

- **EV-006** — `sk-form-select.spec.ts` is structured in two `test.describe` blocks (a
  source/distribution-contract block starting `apps/storybook/src/tests/sk-form-select.spec.ts:100`,
  and a live cross-browser block starting line 180), matching the two-block Playwright spec shape
  plan.md's IC-04 cites as the pattern this mission's own spec file must follow.
- **EV-007** — `sk-notice-forced-colors.spec.ts` measures a non-color property (border width,
  `apps/storybook/src/tests/sk-notice-forced-colors.spec.ts` lines 1-58) to prove a forced-colors
  override is load-bearing rather than merely present — the same "measure width, not just color"
  technique NFR-004 and plan.md cite as this mission's own forced-colors verification approach.
- **EV-028** — `meta.json` confirms this mission's topology is `lanes` and its `target_branch` is
  `train/elements-first`, backing C-007's one-WP/one-PR delivery-contract claim.

## Discrepancies found

1. **spec.md FR-009's `sk-transition-matrix.spec.ts:285` citation points at the wrong test.**
   Line 285 (`await row.hover();`) is real code, but it lives inside
   `'non-selectable selected data has zero interaction residue'` — the negative/invariance test
   that asserts hover produces **no** delta on a non-selectable row — not the positive
   computed-style-delta pattern FR-009 is citing it for. The correct citation is line 312/326
   (`'selectable rows expose positive hover, keyboard focus-visible, and active or pressed
   deltas'`). **plan.md already caught and corrected this** in its Technical Context section
   ("spec.md's FR-009 still cites the stale `:285` line … out of this WP's scope — flagged here
   only as a note for a future spec amendment, not corrected in spec.md itself"). This research
   independently re-verified the line numbers and confirms plan.md's diagnosis is accurate — this
   is not a new discrepancy, it is corroboration of one plan.md already flagged, recorded here
   because the mission's research phase should have caught it rather than defer entirely to the
   plan phase's own reading. No file is edited to fix this per the task boundary (spec.md is
   out of scope for this backfill).

2. **spec.md's C-006 ("All commits in this mission use the `styles` conventional-commit scope,
   matching the package actually changed") is not literally true of this mission's own
   design-phase bookkeeping commits.** This mission's spec-authoring/fix commits (`9892785`,
   `d6ac1f5`, `614e2d0`), plan-authoring/fold-in commits (`d9a231d`, `d78c0d3`, `b91cc43`), and
   this research-backfill commit itself (`1cc92d0`, the current HEAD) all use the
   `docs(kitty-specs)`/`fix(kitty-specs)` scope, not `styles`. `kitty-specs` is not among
   `commitlint.config.cjs`'s `scope-enum` list (lines 82-95), and is not covered by any of that
   file's Spec-Kitty-CLI-bookkeeping exemption patterns (lines 6-78), which are anchored to a
   `-01<ULID>` mission-slug suffix inside the parens that a bare `kitty-specs` scope does not
   carry. C-006's own stated rationale ("matching the package actually changed") clearly targets
   the later WP-implementation commits that actually touch `packages/styles`, not this mission's
   own design-phase commits — so this is most likely a wording-precision gap (C-006 says "all
   commits in this mission," but evidently means "commits in this mission's implementation Work
   Package") rather than a substantive scope violation. Flagged here as a discrepancy between
   C-006's literal wording and this mission's own commit history; **not corrected in spec.md** —
   narrowing C-006 (e.g. to "All commits touching `packages/styles` in this mission's Work Package
   use the `styles` scope") is a later phase's job, not this backfill's, per this document's own
   scope boundary (see header).

3. **spec.md's C-004 cites `sk-form-select.css` as a base-state precedent for `--sk-bg-pill`
   alongside `sk-nav-pill.css`, but `sk-form-select.css` contains zero references to `--sk-bg-pill`
   (or the sibling `--sk-surface-pill`) anywhere in the file.** C-004 reads: "Base-state colours
   use `--sk-bg-pill` (the pressed/selected fill) plus the existing border/focus token families,
   matching the base-state precedent in `sk-nav-pill.css` and `sk-form-select.css`." Read as a
   single "matching...in A and B" clause, this implies both files back the `--sk-bg-pill`
   base-state usage. They do not: `sk-form-select.css`'s actual base-state tokens are
   `--sk-surface-input`, `--sk-border-default`, `--sk-border-focus`, `--sk-border-width-1`/`2`,
   `--sk-radius-sm`, and `--sk-color-red` — a different token set entirely. Only `sk-nav-pill.css`
   demonstrates the `--sk-bg-pill` active-fill pattern (EV-001), and both FR-015 and this
   document's own Q3 section correctly attribute the `--sk-bg-pill` precedent to `sk-nav-pill.css`
   alone. Q3/EV-031's original check only verified the second half of C-004's claim (neither file
   has a `forced-colors` block); it did not check whether `sk-form-select.css` actually contains
   `--sk-bg-pill`. Flagged here as a discrepancy between C-004's literal wording and the live tree;
   **not corrected in spec.md** — rewording C-004 to separate the two precedents explicitly (e.g.
   attributing `--sk-bg-pill` to `sk-nav-pill.css` alone and the border/focus token families to
   `sk-form-select.css`) is a later phase's job, not this backfill's, per this document's own scope
   boundary (see header). See evidence-log EV-033.

4. **No other factual discrepancy beyond the three above was found.** Every other claim checked
   from spec.md's Terminology section, Constraints table, and plan.md's Technical Context, Project
   Structure, Story-id ratchet, Charter Check, and Gate Enumeration sections held exactly as
   stated against the live tree on 2026-09-08 (see the evidence log for the itemised list). The
   three open findings in `reviews/plan-fresh-2.yaml` (PLAN-FRESH2-001/002/003, all
   internal-consistency issues within plan.md's own prose about visual-baseline sequencing
   wording and file-labelling convention) are unrelated to any of the live-repository facts this
   research verified — they are prose-consistency findings, not factual claims about the
   codebase, and this document does not re-litigate them.

## Summary

Every precedent, token, tooling behaviour, and line-number citation this mission's spec.md and
plan.md build on was independently re-verified against the live `train/elements-first` tree on
2026-09-08. All but three held exactly as claimed. One exception (spec.md's stale
`sk-transition-matrix.spec.ts:285` FR-009 citation) was already caught and correctly resolved by
plan.md's own Technical Context section; this research confirms that resolution is right and that
no other stale citation exists among the ones checked. The second (C-006's unqualified "all commits
in this mission use the `styles` scope" claim) is contradicted by this mission's own design-phase
bookkeeping commits and is flagged, not silently corrected, per this document's scope boundary
(see [Discrepancies found](#discrepancies-found)). The third (C-004's citation of
`sk-form-select.css` as a `--sk-bg-pill` base-state precedent, which grep confirms it is not — only
`sk-nav-pill.css` demonstrates that pattern) is likewise flagged, not corrected, for the same
reason. The mission's styles-only classification is
correctly grounded in issue #270's explicit instruction rather than in ADR-10's structural
rationale, which this research confirms does not actually cover a plain button group. (Two
separate, now-corrected errors concerned this document's own earlier drafts: Q3's token-existence
check — see the Q3 section above — and Q4's overstated "exactly the seven keywords" claim about
stylelint's `ignoreValues` versus C-010's six-keyword list — see the Q4 section above. Neither
affects the overall claim-verification tally since both were factual-accuracy defects within
already-checked questions, not unchecked claims.)
