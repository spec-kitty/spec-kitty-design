# Mission Specification: Invalid-state control boundary contrast, light theme

**Mission Branch**: `mission/invalid-boundary-light-contrast`
**Created**: 2026-09-11
**Status**: Draft
**Input**: GitHub issue spec-kitty/spec-kitty-design#350 ("Invalid-state control boundary is less visible than the resting boundary, light theme"). Filed by the `debugger-debbie` lens at the pre-merge gate on PR #339, rather than fixed there, because the cause is a cross-cutting token, not the input rule. Refs #339, #321 (which raised the resting boundary and disclosed this gap without closing it), #155 (the original weak-boundary finding on a different control).

## Provenance and background

- #321 raised `--sk-border-control` (the resting, non-invalid boundary) to clear ≥3:1 against five light and five dark surfaces, and deliberately left the `[aria-invalid="true"]`/`:invalid` state rule untouched — that rule still borrows `--sk-color-red` for its border color. Before #321, every state on this control sat below 3:1, so the ordering between resting and invalid was moot; #321's fix makes the ordering visible and, in light theme, wrong.
- `--sk-color-red: #E97373` is declared exactly once, in `packages/tokens/src/tokens.css:24` (the root `:root` block), and is confirmed — by reading both theme blocks in full at this mission's branch point (`93c82f14`) — **not** redefined anywhere in `:root[data-theme="light"], .sk-light` (`tokens.css:384-536`). The only occurrence of the string in that block is `--sk-on-tint-rose: #6B2424` (`tokens.css:467`), a *different* token that merely resolves to `var(--sk-color-red)` in the dark block (`tokens.css:83`) — it is not a redefinition of `--sk-color-red` itself.
- This mission's job is narrow: fix the **acceptance contract** (the measurable bar and the guard that enforces it) so that either of the two directions the issue names can be judged against it, and record the choice between them as a decision for the plan phase. This spec does not choose a direction, does not touch any `.css`/`.ts` file, and does not run `spec-kitty plan`.

## Verified state (re-measured on this branch, not quoted from the issue)

All ratios below were computed independently with the standard WCAG relative-luminance contrast formula, from the literal hex values in `packages/tokens/src/tokens.css` at `93c82f14`, against all five themed surface tokens the sibling test `tests/node/form-input-border-control-contrast.test.ts` already tracks (`--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, `--sk-surface-muted`, `--sk-surface-pill`). The issue's own table names only the first four; this spec independently confirms those four and additionally measures pill (see "Fork 2" below).

**Invalid-state boundary — `--sk-color-red` (`#E97373`, both themes; no light override exists):**

| theme | vs `--sk-surface-page` | vs `--sk-surface-card` | vs `--sk-surface-input` | vs `--sk-surface-muted` | vs `--sk-surface-pill` |
|---|---|---|---|---|---|
| light | 2.69:1 | 2.93:1 | 2.60:1 | 2.26:1 | 2.37:1 |
| dark  | 6.58:1 | 5.94:1 | 5.63:1 | 4.79:1 | 5.08:1 |

**Resting boundary — `--sk-border-control` (independent literal per theme, per `tokens.css:196-212` and `tokens.css:418-421`):**

| theme | vs `--sk-surface-page` | vs `--sk-surface-card` | vs `--sk-surface-input` | vs `--sk-surface-muted` | vs `--sk-surface-pill` |
|---|---|---|---|---|---|
| light (`#7A7A6E`) | 3.98:1 | 4.34:1 | 3.85:1 | 3.35:1 | 3.51:1 |
| dark (`#81818B`)  | 5.01:1 | 4.51:1 | 4.28:1 | 3.64:1 | 3.86:1 |

**The defect, stated as a relation:** in **light** theme, the invalid boundary is less visible than the resting boundary on **all five** surfaces (2.69 < 3.98, 2.93 < 4.34, 2.60 < 3.85, 2.26 < 3.35, 2.37 < 3.51) — the invalid boundary also fails the absolute 3:1 floor on all five. In **dark** theme, the invalid boundary is *more* visible than the resting boundary on all five surfaces (6.58 > 5.01, 5.94 > 4.51, 5.63 > 4.28, 4.79 > 3.64, 5.08 > 3.86) — dark theme is correctly ordered and needs no change; this mission's dark-theme obligation is to not regress it.

**Nothing guards this today.** `tests/node/form-input-border-control-contrast.test.ts` (confirmed by reading it in full) parses `packages/tokens/src/tokens.css`, resolves `--sk-border-control` and the five surface tokens per theme, and asserts ten ratios ≥3:1. It never reads the `[aria-invalid="true"]`/`:invalid` rule's own color, and asserts no relationship between the two. A future change to either token could silently invert or re-invert the relationship with every existing gate green — the same defect shape as the bug itself, which is why the issue and this spec both treat the guard as a first-class deliverable, not an afterthought.

## Measured blast radius of `--sk-color-red` (verified, not assumed)

`git grep -c -- '--sk-color-red' -- 'packages/**'` at this branch point returns hits in `packages/tokens/src/tokens.css` (4 — two declarations, two `var()` reference sites) plus seven package source files, matching the issue's own count. Reading each hit's surrounding declaration (not just the grep count) narrows this considerably:

| file | hits | what they actually are |
|---|---|---|
| `packages/styles/src/form-field/sk-form-field.css` | 3 | `.sk-form-field--error .sk-form-field__description` (TEXT color, 4.5:1 contract); `.sk-input[aria-invalid="true"]` (border, the bug); `.sk-textarea[aria-invalid="true"]` (border, the bug) |
| `packages/styles/src/form-input/sk-form-input.css` | 2 | `.sk-form-input__control[aria-invalid="true"]` (border, the bug); `.sk-form-input__error` (TEXT color) |
| `packages/styles/src/form-select/sk-form-select.css` | 1 | `.sk-form-select:invalid` (border, plus `border-style: double` and `border-width: var(--sk-border-width-2)` — the bug, on a rule that already doubles the line weight) |
| `packages/styles/src/form-textarea/sk-form-textarea.css` | 2 | `.sk-form-textarea__control[aria-invalid="true"]` (border, the bug); `.sk-form-textarea__error` (TEXT color) |
| `packages/styles/src/ribbon-card/sk-ribbon-card.css` | 2 | `.sk-ribbon-card__ribbon--red` (BACKGROUND fill, paired with `--sk-fg-on-primary`); `.sk-ribbon-card--border-red` (decorative accent border, not a validation state) |
| `packages/styles/src/status-indicator/sk-status-indicator.css` | 3 | **All three are inside one comment**, not a declaration. The comment records that #177 deliberately made the danger marker use `--sk-on-tint-rose` (which *does* redefine per theme) precisely **because** `--sk-color-red` "is defined only in `:root` and never redefined for `.sk-light`" — the exact defect this mission is about, already solved once for this component by routing around the token rather than re-theming it. Confirmed by reading the file: `status-indicator` has **zero live declarations** consuming `--sk-color-red`; it is not a rendering consumer at all. |
| `packages/styles/src/transition-matrix/sk-transition-matrix.css` | 1 | `.sk-transition-matrix__row--blocked` (TEXT + icon color) |

So the issue's "seven consumers" is accurate as a *file* count but not as a *live-declaration* count: **six** files have real `--sk-color-red` declarations (status-indicator has none); of those six, **five** contain at least one non-text boundary/border declaration in the shape this mission is actually about (form-field ×2, form-input ×1, form-select ×1, form-textarea ×1 — five border declarations across four files), and **four** contain a text-color declaration with the separate 4.5:1 contract (form-field, form-input, form-textarea error text; transition-matrix's blocked row). Ribbon-card's two declarations are neither the invalid-state border nor body text — a background fill and a decorative brand-accent border, unrelated to form validation state. `--sk-color-red-soft` (`tokens.css:25`, the sibling brand token declared next to `--sk-color-red`) has zero consumers anywhere in `packages/**` or `docs/**` — confirmed by `git grep` — and is out of scope entirely.

This distinction matters for blast-radius containment (FR-007/NFR-004 below): **Option A** (re-theme `--sk-color-red` itself) changes rendering in all six real consumers, including the text-color and ribbon-card uses that have nothing to do with the invalid-boundary defect. **Option B** (a dedicated invalid-boundary role) touches only the five border declarations across four files, and changes nothing about text color, ribbon-card, or any other consumer.

## Visual-regression coverage today (from `apps/storybook/src/tests/visual.spec.ts`, read in full)

| consumer | light-mode baseline exists? | does it exercise the red-consuming state? |
|---|---|---|
| form-field, static `.sk-input`/`.sk-textarea` path | `sk-input-light.png` exists (default state only) | No — no light+invalid combined shot for `.sk-input`; no baseline of any kind (light or dark) for `.sk-textarea` |
| form-input, element path (`sk-form-input__control`) | `sk-form-input-light.png` exists (default state only) | No — the `error` baseline (`sk-form-input-invalid.png`) is a separate, dark-theme shot |
| form-select | `sk-form-select-light.png` exists (default state only) | No — `RequiredInvalid` (`sk-form-select-invalid.png`) is dark-theme only |
| form-textarea, element path (`sk-form-textarea__control`) | **None** | N/A — zero visual coverage of any kind exists for this component |
| ribbon-card | A `LightMode` story exists in Storybook (`sk-ribbon-card-html.stories.ts:104`) but is **not** wired into any `visual.spec.ts` test — the only wired test (`with-ribbon`) renders the default (dark) background | No |
| status-indicator | `sk-status-indicator-light.png` exists | N/A — not a real consumer (see table above) |
| transition-matrix | `sk-transition-matrix-light.png` exists, and its `LightMode` story's fixture data (`compactRoutes`) includes an `any-blocked` row with `tone: 'blocked'` | **Yes** — this is the one consumer whose existing light baseline actually renders `--sk-color-red` today |

So re-baselining cost differs sharply by consumer: transition-matrix already has the coverage; form-textarea has none to build from; the other four need a **new** light+state-triggering shot added, not just a refresh of an existing one.

## The fork this spec frames but does not decide

**[NEEDS DECISION — Fork 1, for the plan phase]: Option A vs. Option B.**

- **Option A** — give `--sk-color-red` a light-theme override that clears 3:1 as a non-text boundary, mirroring `--sk-on-tint-rose` (`#E97373` dark / `#6B2424` light). Evidence this option needs before it can be judged: (1) a derived light-theme hex, with the derivation shown (hue/lightness/saturation band, per the `adding-a-token.md` convention already used for rose), that clears ≥3:1 against all four (or five, per Fork 2) light surfaces; (2) a check of what that same override does to the four TEXT consumers (form-field, form-input, form-textarea error text; transition-matrix blocked row) — a border-motivated value is not guaranteed to still satisfy their independent 4.5:1 text contract, and must be verified, not assumed; (3) what it does to ribbon-card's background-fill and decorative-border uses, which carry no accessibility contract at all — a visual change with no compliance justification behind it, which the plan phase must decide is acceptable or must be excluded via a scoped selector/override; (4) new or refreshed light-mode visual baselines for all five non-status-indicator, non-form-textara — all **six** real consumers (form-textarea needs the coverage built from nothing).
- **Option B** — introduce a dedicated invalid-boundary token role (new name, e.g. following the `--sk-border-<qualifier>` shape `--sk-border-control` already uses) and leave `--sk-color-red` untouched everywhere. Evidence this option needs: (1) the new token declared as an independent literal or alias in **both** theme blocks, clearing ≥3:1 in light and not regressing dark; (2) an entry in `docs/contributing/adding-a-token.md`'s category table and in `docs/design-system/using-tokens.md` if the name introduces a new prefix (charter-level obligation, C-006 below); (3) the five border declarations (form-field ×2, form-input ×1, form-select ×1, form-textarea ×1) repointed from `--sk-color-red` to the new role; (4) confirmation — mechanical, not testimonial — that no other file's rendering changes (see NFR-004's diff-scope mechanism), which is structurally cheap for this option since nothing else references the new token.

Neither option is chosen here. The plan phase selects one and records the selection with the evidence this spec requires above.

**[NEEDS DECISION — Fork 2, found during this spec's own verification, for the plan phase]: does the new guard (and the fix it enforces) cover four light surfaces or five?**

The issue's own table names four light surfaces (page, card, input, muted). The **existing sibling test**, `tests/node/form-input-border-control-contrast.test.ts`, covers five — it added `--sk-surface-pill` defensively, per its own comment, "as the remaining themed surface in the same family... that a form control could plausibly sit on in a future composition," even though no known real composition renders a form control on pill today (unlike `--sk-surface-muted`, which was added after a real composition — the work-explorer filters bar — was found rendering `.sk-input` on it). This spec measured pill for both tokens above (light: red 2.37:1, border-control 3.51:1 — same inverted relationship as the other four) so the evidence exists either way. The plan phase must decide: extend the new state-color guard to the same five-surface set as its sibling (consistency, precedent, no extra cost since the numbers are already in hand), or hold to the four the issue named (narrower, matches the issue's own stated scope exactly). This spec's FR-001/NFR-001/NFR-002 below are written against the four-surface floor the issue and the brief both name explicitly, with the fifth (pill) called out as the open extension the plan phase resolves.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The invalid-state boundary is verifiably at least as visible as the resting boundary, in both themes (Priority: P1)

A sighted, low-vision, or color-perception-impaired user viewing a form control in its error state can distinguish its boundary from the surrounding surface at least as easily as they could when the same control is merely resting — in both themes — because the invalid-state border color clears the same non-text contrast floor the resting border already clears, and is never the weaker of the two.

**Why this priority**: This is the entire defect. #321 already fixed the resting state; leaving the invalid state weaker inverts the intended emphasis (an error should be at least as noticeable as a normal field, not less) and reads as a bug to any user who tabs between a resting and an errored field.

**Independent Test**: Resolve the color the `[aria-invalid="true"]`/`:invalid` control rule renders in each theme; compute its contrast ratio against `--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, and `--sk-surface-muted`; assert each ratio is ≥3:1 and is ≥ the corresponding `--sk-border-control` ratio on the same surface and theme.

**Acceptance Scenarios**:

1. **Given** light theme, **When** the invalid-state boundary color is measured against each of the four named surfaces, **Then** every ratio is ≥3:1.
2. **Given** light theme, **When** the invalid-state boundary's ratio against a given surface is compared to the resting boundary's ratio against the same surface, **Then** the invalid ratio is greater than or equal to the resting ratio, on all four surfaces.
3. **Given** dark theme, **When** the same two comparisons are run, **Then** both continue to hold (dark theme already passes both today per the Verified State table; this scenario is a regression guard, not a new requirement).

---

### User Story 2 - The relationship cannot silently invert again (Priority: P1)

A future contributor who changes `--sk-border-control`, `--sk-color-red`, or whatever new token this mission introduces, for an unrelated reason, is stopped by a failing test naming the exact surface/theme pair that broke — not by a human noticing during review, months later, the way this exact defect was found (a pre-merge squad lens on an unrelated PR).

**Why this priority**: The issue explicitly demands this as the fix's other half: "extend the contrast test to cover the state colours on the control rule so the relationship cannot silently invert again." A fix that only changes a hex without a guard is the same shape of defect as the bug itself.

**Independent Test**: Extend `tests/node/form-input-border-control-contrast.test.ts` (or a clearly-linked sibling file, if the plan phase judges the resolution logic differs enough to warrant one) to resolve the invalid-state rule's color in both themes and assert both the absolute floor and the relational comparison from User Story 1. Demonstrate the new assertions red (via a deliberate, temporary value that reintroduces the inversion) before demonstrating them green, with both transcripts recorded as evidence — the same test-first standard the sibling test's own FR-012 applied to the resting boundary.

**Acceptance Scenarios**:

1. **Given** the extended test as it will ship, **When** it is run against a deliberately reintroduced inversion (e.g., temporarily reverting the invalid-state color to today's `#E97373` with no light override), **Then** it fails, naming the specific theme/surface pair(s) that are below floor or below the resting comparison.
2. **Given** the fix in place, **When** the same test is run, **Then** it passes on every assertion.
3. **Given** the extended test, **When** it is run unmodified against the repository as it stands at `93c82f14` (before this mission's fix), **Then** it already fails on the light-theme assertions — confirming the test reproduces the real, currently-shipping defect rather than a synthetic one.

---

### User Story 3 - Dark theme is not made worse while light theme is fixed (Priority: P1)

A dark-theme user, for whom the invalid-state boundary already works correctly, experiences no reduction in that boundary's visibility as a side effect of whichever light-theme fix is chosen.

**Why this priority**: Dark theme currently measures 5.63:1 against the input surface (6.58/5.94/5.63/4.79/5.08 across the five surfaces) and is correctly ordered against the resting boundary on all five. Any token-value change made to satisfy light theme must not be allowed to move the dark-theme value backward as an unintended side effect.

**Independent Test**: Measure the invalid-state boundary's dark-theme ratio against each of the four named surfaces before and after the fix; assert the after-value is ≥ the before-value (6.58 / 5.94 / 5.63 / 4.79 respectively) on every surface.

**Acceptance Scenarios**:

1. **Given** the fix in place, **When** the invalid-state boundary's dark-theme contrast is measured against `--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, and `--sk-surface-muted`, **Then** every ratio is at least 6.58:1, 5.94:1, 5.63:1, and 4.79:1 respectively.

---

### User Story 4 - Any change to light-mode rendering elsewhere is deliberate, not incidental (Priority: P2)

A reviewer of the eventual PR can confirm, for every one of the six real consumers of `--sk-color-red`, either that its light-mode rendering changed and was re-baselined on purpose, or that it did not change at all — never left as an open question.

**Why this priority**: Option A's blast radius reaches text-color and decorative uses that have no relationship to the invalid-boundary defect; Option B's blast radius is structurally narrower but still needs to be *shown* narrow, not assumed. Either way, an un-stated visual change in a shared design-system package is a defect in its own right.

**Independent Test**: For each of the six real consumers (form-field, form-input, form-select, form-textarea, ribbon-card, transition-matrix), confirm via the PR body and its linked CI artifact either (a) a light-mode visual-regression baseline was added or refreshed for the state that consumes the changed token, harvested from a CI run per this repository's CI-authoritative convention, or (b) the token(s) that consumer references were not touched by this mission's diff, confirmed by `git grep -c -- '--sk-color-red' -- 'packages/**'` (and the new token's name, if one is introduced) returning an unchanged count and file set for that consumer's file.

**Acceptance Scenarios**:

1. **Given** the finished PR, **When** its body is read against the six-consumer list, **Then** each one is named with an explicit "changed + re-baselined" or "unchanged, proven by [mechanism]" disposition.
2. **Given** a consumer marked "unchanged," **When** its file is diffed against the mission's branch point, **Then** the diff contains no change to any `--sk-color-red`-referencing declaration in that file.
3. **Given** a consumer marked "changed + re-baselined," **When** its new or refreshed baseline is inspected, **Then** it was harvested from a CI artifact, never produced by a local `--update-snapshots` run.

---

### User Story 5 - Token discipline and human sign-off are honored (Priority: P2)

A maintainer reviewing the eventual PR sees that any new or changed token followed this repository's documented process end-to-end, and that no token-namespace change merged without an explicit human approval — because the charter requires it and no mission may waive that requirement on its own authority.

**Why this priority**: `CLAUDE.md` and `docs/contributing/adding-a-token.md` make token-layer discipline non-negotiable (both theme blocks, catalogue regeneration, category-table updates); the charter's Review Policy separately requires "One human approval required for any change to the `--sk-*` token namespace" — a governance constraint this mission cannot self-satisfy no matter which option is chosen.

**Independent Test**: Confirm any new/changed token is declared in both `:root` and `:root[data-theme="light"], .sk-light`; confirm `packages/tokens/dist/token-catalogue.json` was regenerated via `npx nx run tokens:catalogue` with zero manual edits; confirm `docs/contributing/adding-a-token.md` and `docs/design-system/using-tokens.md` gained an entry if (and only if) a new category/prefix was introduced; confirm the PR is not merged without a recorded human approval of the token change.

**Acceptance Scenarios**:

1. **Given** the finished change, **When** `packages/tokens/src/tokens.css` is inspected, **Then** every new or changed token appears in both theme blocks.
2. **Given** the finished change, **When** `packages/tokens/dist/token-catalogue.json` is regenerated fresh and diffed against the committed copy, **Then** there is no difference.
3. **Given** the PR, **When** it is examined for a merge record, **Then** a human maintainer approval of the token-namespace change is present and distinct from the mission's own adversarial-squad evidence.

---

### Edge Cases

- **What happens to `status-indicator`?** Nothing — it has zero live declarations consuming `--sk-color-red` (its three grep hits are entirely inside a comment explaining why it deliberately avoids the token). It is out of scope for this mission under either option unless the plan phase finds a reason to touch it, which this spec does not anticipate.
- **What happens to `--sk-color-red-soft`?** Nothing — confirmed unused anywhere in `packages/**` or `docs/**`; not part of this mission's blast radius.
- **What happens to ribbon-card's `LightMode` Storybook story, which exists but is not wired into `visual.spec.ts`?** If Option A is chosen, ribbon-card's background-fill and border-accent uses change in light theme and this gap becomes load-bearing — the plan phase must decide whether to wire that story into the visual-regression suite as part of this mission or exclude ribbon-card's `--red` variants from the token change via a scoped override. If Option B is chosen, this gap is irrelevant — ribbon-card is untouched.
- **What happens to `form-select`'s already-doubled invalid border (`border-style: double; border-width: var(--sk-border-width-2)`)?** Unaffected by either option's color choice — this mission changes only the color the existing rule resolves to, not its style or width.
- **What happens if the plan phase's chosen light-theme value for the invalid boundary, under Option A, fails the *text* 4.5:1 contract for the four text consumers (form-field, form-input, form-textarea error copy; transition-matrix's blocked row)?** Then Option A as stated is not viable without a further split (a border-only override plus an unchanged or separately-valued text use), and the plan phase must record that as a finding rather than ship a text regression silently — this is exactly the kind of further fork this spec's instructions anticipated finding, and it is recorded here rather than resolved.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Guard resolves the actual invalid-state color, per theme | As a library maintainer, I want the extended contrast test to resolve whatever color/token the `[aria-invalid="true"]`/`:invalid` control rule renders in each theme — not a hardcoded expectation of `--sk-color-red` — so the guard remains correct regardless of which option (A or B) the plan phase selects. | US2 | High | Open |
| FR-002 | Absolute floor: invalid boundary ≥3:1, four light surfaces | As a user, I want the invalid-state boundary color to clear ≥3:1 against `--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, and `--sk-surface-muted` in light theme, so the control's error state is perceivable against every surface it is known to render on. | US1 | High | Open |
| FR-003 | Relational floor: invalid boundary not less visible than resting boundary | As a user, I want the invalid-state boundary's contrast ratio, on each surface and in each theme, to be greater than or equal to `--sk-border-control`'s ratio on the same surface and theme, so an errored control is never *less* noticeable than a resting one. | US1 | High | Open |
| FR-004 | Dark theme does not regress | As a dark-theme user, I want the invalid-state boundary's contrast ratio against `--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, and `--sk-surface-muted` to remain at or above its current measured values (6.58:1, 5.94:1, 5.63:1, 4.79:1 respectively) after this mission ships. | US3 | High | Open |
| FR-005 | Guard demonstrated red before green | As a future contributor, I want the new/extended assertions to be shown failing against a deliberate, temporary reintroduction of the light-theme inversion, and against the repository as it stands today (`93c82f14`, before any fix), before they are shown passing against the shipped fix — both transcripts recorded as PR evidence. | US2 | High | Open |
| FR-006 | Option A/B fork resolved and recorded by the plan phase | **[NEEDS DECISION]** As the plan-phase author, I need to choose between Option A (re-theme `--sk-color-red` for light) and Option B (a dedicated invalid-boundary token role), using the evidence each requires as stated in "The fork this spec frames but does not decide" above, and record the choice — with its rationale and the evidence gathered — in `plan.md`. This spec makes neither choice. | US1 | High | Open |
| FR-007 | Blast-radius containment, mechanically proven | As a reviewer, I want every one of the six real `--sk-color-red` consumers (form-field, form-input, form-select, form-textarea, ribbon-card, transition-matrix) named in the PR with an explicit disposition — "changed, and re-baselined from a harvested CI artifact" or "unchanged, proven by an unchanged `git grep -c -- '--sk-color-red' -- 'packages/**'` count/file-set for that file" — so that no consumer's light-mode rendering changes silently. | US4 | High | Open |
| FR-008 | Five-surface guard-scope decision recorded | **[NEEDS DECISION]** As the plan-phase author, I need to decide whether the new invalid-state guard (FR-001 through FR-004) also covers `--sk-surface-pill` (matching the sibling `--sk-border-control` test's five-surface scope) or holds to the four surfaces the issue names, and record that decision — this spec provides the measured pill ratios either way (light: red 2.37:1 / border-control 3.51:1; dark: red 5.08:1 / border-control 3.86:1). | US1, US2 | Medium | Open |
| FR-009 | Token discipline: both theme blocks, catalogue regeneration | As a maintainer, I want any new or changed token declared in both `:root` and `:root[data-theme="light"], .sk-light` in the same commit, and `npx nx run tokens:catalogue` re-run so `packages/tokens/dist/token-catalogue.json` reflects it — since `scripts/check-token-breaking-changes.sh` only diffs token *names* between catalogue snapshots and is blind to a value change or to a token missing from the catalogue entirely. | US5 | High | Open |
| FR-010 | New-category documentation, if applicable | As a maintainer, I want `docs/contributing/adding-a-token.md`'s category table and `docs/design-system/using-tokens.md` updated in the same commit, but only if the chosen option (most likely Option B) introduces a new token prefix/category — not required if the fix is a value change to an existing token (Option A) or an alias within an existing category. | US5 | Medium | Open |
| FR-011 | Human sign-off on the token-namespace change | As the charter's Review Policy requires, I want the PR to carry an explicit, recorded human maintainer approval of the token-namespace change, distinct from and in addition to the mission's own adversarial-squad evidence — this mission may not self-approve a token change under any circumstance. | US5 | High | Open |
| FR-012 | Generated artifacts regenerated, never hand-edited | As a maintainer, I want `packages/tokens/dist/token-catalogue.json` and any generated `sk-*.css.js`/`.css.d.ts` files whose source `.css` changes, regenerated only via their own build scripts (`npx nx run tokens:catalogue`; the elements CSS build script), never hand-written, so CI's drift gates stay green. | US5 | Medium | Open |
| FR-013 | Delivery shape: one Work Package, one PR, `Refs #350` | As the mission owner, I want this mission delivered as exactly one bounded Work Package producing exactly one PR into `train/elements-first`, whose description uses `Refs #350` — never `Closes #350`, because a train-targeting merge fires no GitHub closing keyword and closure must stay an explicit, separate operator act. | — | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Non-text contrast, invalid boundary, light theme | The `[aria-invalid="true"]`/`:invalid` control boundary color clears ≥3:1 against `--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, and `--sk-surface-muted` in light theme. Currently measured (pre-fix): 2.69:1, 2.93:1, 2.60:1, 2.26:1 respectively — all below floor. Mechanically enforced by FR-001/FR-002's extended test, not only recorded in a PR description. | Accessibility | High | Open |
| NFR-002 | Relational contrast, both themes, four surfaces | The invalid-state boundary's contrast ratio is ≥ the resting boundary's (`--sk-border-control`) ratio, on the same surface and theme, for all four named surfaces in both themes (8 comparisons; 10 if FR-008 extends scope to pill). Currently measured: light theme fails on all four/five (2.69<3.98, 2.93<4.34, 2.60<3.85, 2.26<3.35, [2.37<3.51 if pill in scope]); dark theme already passes on all four/five (6.58>5.01, 5.94>4.51, 5.63>4.28, 4.79>3.64, [5.08>3.86 if pill in scope]). | Accessibility | High | Open |
| NFR-003 | Dark-theme non-regression floor | The invalid-state boundary's dark-theme contrast ratio against each of the four named surfaces is ≥ its current measured value: page ≥6.58:1, card ≥5.94:1, input ≥5.63:1, muted ≥4.79:1 (≥5.08:1 vs. pill if FR-008 extends scope). | Accessibility | High | Open |
| NFR-004 | Visual-regression coverage, mechanically scoped | For each of the six real `--sk-color-red` consumers, either (a) a light-mode Playwright visual-regression assertion exists and was added/refreshed for the state that consumes the token in question, harvested from a CI artifact (never a local `--update-snapshots` run), or (b) `git grep -c -- '--sk-color-red' -- 'packages/**'` (and any new token name) shows an unchanged count and file-set for that consumer's file, proving its rendering did not change. Today, only transition-matrix's existing light baseline exercises the token; form-textarea has zero baselines of any kind; form-field, form-input, and form-select have light-mode default-state baselines but none exercising the invalid/error state; ribbon-card has a `LightMode` story with no wired assertion at all. | Accessibility / Process | High | Open |
| NFR-005 | Token-catalogue freshness | Running `npx nx run tokens:catalogue` after the change produces zero diff against the committed `packages/tokens/dist/token-catalogue.json`. | Reliability | High | Open |
| NFR-006 | Zero new axe-core WCAG 2.1 AA violations | Every story touched or added by this mission (any newly-added light+invalid/error visual-regression story per NFR-004) scores zero WCAG 2.1 AA violations under `node scripts/run-axe-storybook.js`. | Accessibility | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | One Work Package, one PR | This mission delivers exactly one bounded Work Package and one PR into `train/elements-first`, described with `Refs #350` (never `Closes #350`). | Process | High | Open |
| C-002 | Token-namespace change requires human sign-off | Per the charter's Review Policy ("Token additions or renames require maintainer sign-off... One human approval required for any change to the `--sk-*` token namespace"), no token this mission adds or changes may be treated as merge-ready by the mission's own adversarial squad alone — a distinct, recorded human approval is required before merge. | Process | High | Open |
| C-003 | The A/B fork is a plan-phase decision, not a spec-phase one | This spec fixes the acceptance contract only (FR-001 through FR-005, NFR-001 through NFR-003) and does not select, imply, or default to either Option A or Option B. FR-006 records the decision as open. | Process | High | Open |
| C-004 | Guard must be demonstrated red before green | The new/extended contrast assertions must be shown failing (both against a deliberate reintroduction and against the unmodified repository at this mission's branch point) before being shown passing, with both transcripts recorded as PR evidence. | Technical | High | Open |
| C-005 | `status-indicator` is out of scope | `packages/styles/src/status-indicator/sk-status-indicator.css` is not edited by this mission under either option — confirmed to have zero live `--sk-color-red` declarations (its three grep hits are comment-only). | Technical | Medium | Open |
| C-006 | New-category documentation obligation is conditional | `docs/contributing/adding-a-token.md`'s category table and `docs/design-system/using-tokens.md` are updated in the same commit **only if** the chosen option introduces a new token prefix/category (per `adding-a-token.md`'s own "A new CATEGORY is more than a new token" section); not required for a same-category alias or an existing-token value change. | Process | Medium | Open |
| C-007 | Generated artifacts are never hand-edited | `packages/tokens/dist/token-catalogue.json` and any generated `sk-*.css.js`/`.css.d.ts` file are produced only by their own build scripts, never hand-written. | Technical | Medium | Open |
| C-008 | Tokens-first CSS | Every changed declaration value is a `var(--sk-*)` token reference; no raw hex or `rgba()` literal is introduced in any component `.css` file outside `packages/tokens/src/tokens.css` itself. | Technical | High | Open |

### Key Entities

None — this mission changes presentation tokens, a CSS state-selector rule, and a Node-lane test's assertions. It introduces no new data entity, attribute, property, event, or behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The invalid-state boundary color clears ≥3:1 against `--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, and `--sk-surface-muted` in light theme — verified by running the extended `tests/node/form-input-border-control-contrast.test.ts` (or its plan-phase-named successor) via `npx vitest run tests/node/form-input-border-control-contrast.test.ts`, all assertions passing.
- **SC-002**: On every one of the four named surfaces, in both themes, the invalid-state boundary's ratio is ≥ the resting boundary's (`--sk-border-control`) ratio — verified by the same test run's relational assertions, all passing.
- **SC-003**: The invalid-state boundary's dark-theme ratio against each of the four surfaces is ≥ its pre-fix measured value (6.58:1 / 5.94:1 / 5.63:1 / 4.79:1) — verified by the same test run.
- **SC-004**: The extended test is demonstrated failing, twice — once against a deliberate temporary reintroduction of the inversion, and once (unmodified) against the repository at `93c82f14` — and then demonstrated passing against the shipped fix, with all three runs' transcripts recorded as PR evidence.
- **SC-005**: The PR body names all six real `--sk-color-red` consumers (form-field, form-input, form-select, form-textarea, ribbon-card, transition-matrix) with an explicit "changed + re-baselined" or "unchanged, proven by [unchanged grep count/file-set]" disposition for each.
- **SC-006**: `npx nx run tokens:catalogue`, re-run after the change, produces zero diff against the committed `packages/tokens/dist/token-catalogue.json`.
- **SC-007**: The PR is not merged without a recorded human maintainer approval of the token-namespace change, distinct from the mission's own adversarial-squad evidence.
- **SC-008**: `node scripts/run-axe-storybook.js` reports zero WCAG 2.1 AA violations on every story touched or added by this mission.
- **SC-009**: The mission ships as exactly one Work Package and one PR into `train/elements-first`, with `Refs #350` (not `Closes #350`) in the PR description.
- **SC-010**: `plan.md` records an explicit resolution of both `[NEEDS DECISION]` items (FR-006's Option A/B choice and FR-008's four-vs-five-surface guard scope), each with its stated rationale and supporting evidence.
