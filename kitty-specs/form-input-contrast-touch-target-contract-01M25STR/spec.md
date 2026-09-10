# Mission Specification: `.sk-input` / `sk-form-input` contrast and touch-target contract

**Mission Branch**: `mission/form-input-contrast-touch-target-contract`
**Created**: 2026-09-10
**Status**: Draft
**Input**: GitHub issue spec-kitty/spec-kitty-design#321 ("[TKA2] .sk-input / sk-form-input contrast and touch-target contract"), part of epic #319 (GAP-F5-02 of the Family 5 component-gap audit).

## Provenance and authority

- Origin: approved Team Kitty Family 5 "CLI auth" pack (planning repo, `ux_redesign/families/05-cli-auth`). Opus rereview 02 verdict `approve`, 2026-09-10.
- Design authority: `train/elements-first@4c9e3ffc8f5a70c15ddfa9d1fe2b71c6c31eb812`. This mission's own branch point is `train/elements-first@4d6c5f2db5a774f4676d74129c8205e01e231f8a`.
- Family 5 status is **ready for Lynn**; Lynn's product verdict is still pending. The operator has authorized component work to proceed before that review to meet the 2026-09-15 MVP deadline. **No artifact this mission produces may claim Lynn's approval of anything.** Her later verdict may produce bounded refinement work; it is not a start, review, merge, or completion gate for this mission.
- **Binding programme decision**: `/home/jeroennouws/dev/spec-kitty-design-missions/_program-319/DECISION-border-role.md` (BORDER-ROLE-319, decided by the programme orchestrator 2026-09-10, before this mission's own spec was frozen). It rules three things this spec does not re-derive: (1) the neutral control-boundary weakness is fixed **once**, at the **token layer**, by **this mission**; (2) the sibling mission #320 (danger button) does not touch `packages/tokens` and is not this mission's concern; (3) #155 is not closed, absorbed, or widened by this mission — this mission creates the role, `.sk-button--secondary`'s own adoption of it stays #155's. This spec implements that decision; it does not reopen the altitude, owner, or three-surface obligation the decision already fixed.
- Read-first record (per the source issue): ADR-9, ADR-10, ADR-11, ADR-15 (static form of element-backed CSS — see "ADR-15 applicability" below), #155, #173, #286, #303.

## ADR-15 applicability (stated once, not re-derived per file)

ADR-15 rules on exactly three CSS construct kinds inside an *adopted* (shadow-DOM) stylesheet: a host-attribute variant axis inside a host-owned `@container`, a host-owned `container-type`, and `::slotted()`. `packages/styles/src/form-input/sk-form-input.css` declares **no** `container-type` anywhere and uses none of the three constructs — confirmed by reading the file (checked at this mission's branch point). ADR-15 therefore already rules this component collapses safely to a static class modifier with no wrapper element required, and this mission needs **no new static-form decision** — it only needs the same border and target-size values to reach both the collapsed static class (`.sk-input`, in `packages/styles/src/form-field/sk-form-field.css`) and the shadow-DOM control (`.sk-form-input__control`, adopted by `<sk-form-input>`).

## The two consumption paths, measured (not assumed)

Checked at this mission's branch point:

1. **The hand-authored static path.** `packages/styles/src/form-field/sk-form-field.css` owns `.sk-input`, consumed by five hand-authored HTML exemplars in the same directory (`sk-form-input-default.html`, `-focus.html`, `-error.html`, `-disabled.html`, `-filled.html`) and rendered in Storybook under `Form/FormField (HTML)` (story ids `form-formfield-html--form-input-default`, `-focus`, `-error`, `-disabled`, `-filled`). **There is no markup module and no generator linking this path to the element** — `packages/elements/src/form-input/` has no `sk-form-input.markup.ts`, so nothing mechanically prevents `.sk-input` and `.sk-form-input__control` from drifting apart. This absence of a generator is exactly why this contract needs its own test (see FR-006).
2. **The live element path.** `packages/styles/src/form-input/sk-form-input.css` owns `.sk-form-input__control`, adopted by `<sk-form-input>` (`packages/elements/src/form-input/sk-form-input.ts`) via the generated `packages/elements/src/form-input/sk-form-input.css.js`, built from the source `.css` by `node scripts/build-elements-css.mjs`. Rendered in Storybook under `Elements/SkFormInput` (story ids `elements-skforminput--default`, `-error`, `-disabled`).

Both files currently declare, modulo the `1px` vs `var(--sk-border-width-1)` spelling #173 already records:

```css
/* sk-form-field.css, .sk-input (today) */
border: 1px solid var(--sk-border-default);

/* sk-form-input.css, .sk-form-input__control (today) */
border: var(--sk-border-width-1) solid var(--sk-border-default);
```

Neither rule declares a `min-height`/`min-block-size` (or equivalent) target-size floor.

## Measured contrast failure (re-measured on this branch, not quoted from #155 or the programme decision file)

WCAG 1.4.11 non-text contrast ratios, computed via the standard relative-luminance formula from `packages/tokens/src/tokens.css` at this mission's branch point:

| token | dark hex | vs `--sk-surface-page` | vs `--sk-surface-card` | vs `--sk-surface-input` | light hex | vs page | vs card | vs input |
|---|---|---|---|---|---|---|---|---|
| `--sk-border-default` | `#2B313B` | 1.48 | 1.33 | 1.26 | `#EAE4D2` | 1.17 | 1.27 | 1.13 |
| `--sk-border-strong`  | `#353C48` | 1.74 | 1.57 | 1.49 | `#D6CFB9` | 1.43 | 1.56 | 1.38 |

Both existing border tokens fail the 3:1 floor against every one of the three surfaces, in both themes. This reproduces #155's published figures (1.17 light / 1.48 dark vs. page) and the programme decision's re-measurement, and additionally confirms the same failure against `--sk-surface-card`, which neither prior record measured. **Neither existing border token is adoptable as-is** — confirming the programme decision's "token-layer gap, not a component-layer mistake" framing.

## Decisions this spec makes (within the programme decision's fixed altitude/owner/obligation)

The binding programme decision fixes that the fix is a new token-layer border role, owned by this mission, obligated to clear ≥3:1 against three named surfaces in both themes (page, card, input) — the floor this mission was handed. FR-012's own test widened that floor to five surfaces after the pre-merge squad found a real composition (work-explorer's filters bar) renders the control on a surface neither the programme decision nor this spec's original draft named; see FR-012 and NFR-002 below for the current, ten-ratio scope. It explicitly leaves the exact hex, the exact token name, and whether a width change accompanies the color to this mission. This spec resolves them:

1. **Token name**: `--sk-border-control`, in the Borders block of `packages/tokens/src/tokens.css`, following the existing `--sk-border-<qualifier>` naming shape (`-default`, `-strong`, `-focus`).
2. **Value**: an **independently declared literal per theme, not an alias**. Reversed from this spec's earlier draft, which aliased `var(--sk-fg-subtle)`. The Borders block's own existing convention is literals (`--sk-border-default`, `--sk-border-strong`, `--sk-border-focus` are all literals) — a literal here is house style, not an exception. More importantly, aliasing couples a non-text 3:1 obligation to a token whose entire motivation is text contrast at 4.5:1: `--sk-fg-subtle`'s own comment in `tokens.css` records that its current value was chosen purely to fix a text-AA failure ("Was `#6E6E78`, which failed WCAG AA on BOTH surfaces... `#81818B` is the minimum same-hue lightening that clears 4.5:1"). A future text-motivated nudge to `--sk-fg-subtle` has no reason to consider this border's 3:1 floor, and nothing would catch it: `bash scripts/check-token-breaking-changes.sh` detects only removed/renamed tokens between catalogue snapshots — it computes no contrast — so an aliased `--sk-border-control` could silently drop below 3:1 with every existing gate green. (The counter-precedent — `--sk-color-data-baseline`/`--sk-chart-baseline` both alias `--sk-fg-subtle` — does not apply: those are chart marks carrying no stated WCAG contract, whereas this role's entire reason for existing is the measured 3:1 obligation this mission establishes.) **Chosen values**, same warm-neutral family as the existing Borders block, re-measured directly rather than assumed: dark `#81818B` (unchanged from the earlier draft on margin grounds — 5.01:1 / 4.51:1 / 4.28:1 against page/card/input already comfortable); light `#7A7A6E` (darkened one step from the earlier draft's `#8A8A7E` to move off a 3.09:1 knife-edge — 3.98:1 / 4.34:1 / 3.85:1 against page/card/input). Full candidate sweep and rationale in `research.md`. FR-012 makes this margin mechanically enforced rather than testimonial.
3. **Width**: **unchanged** — `var(--sk-border-width-1)` (1px) in both rules. The color alone already clears 3:1 with margin on every surface in both themes (see NFR-002); WCAG 1.4.11 is a contrast requirement, not a width requirement, and a width bump is not required to satisfy it. A width change is also visually and diff-risk-additive with no contract obligation behind it, so this spec declines one. (`.sk-input` does gain the `var(--sk-border-width-1)` **spelling** in place of its literal `1px` — see FR-002 — which is a spelling/anti-drift normalization, not a rendered width change: both compute to 1px today and after.)
4. **Target-size floor**: **44px**, matching #303's precedent ("Interactive target sizes hold at 44px in the action group at both widths") rather than an independently justified 48px. This repo has **no 44px spacing token** — the scale runs `--sk-space-8` (40px) to `--sk-space-9` (48px) with nothing between — and it has already resolved that exact gap, twice, the same way: `packages/styles/src/confirm-dialog/sk-confirm-dialog.css:165-173` and `packages/styles/src/context-nav/sk-context-nav.css` (three call sites) both declare a `min-block-size: var(--sk-space-9)` under a comment naming it "NFR-001" and "the closest token at or above the 44px floor." Family 5's "48px candidate" and #303's 44px are therefore **not competing values** — 48px (`--sk-space-9`) is simply how this repo's existing token scale already implements a 44px floor everywhere it has been declared. This spec applies that identical, already-shipped shape rather than inventing a third one.
5. **The measured contrast obligation is mechanically enforced, not only recorded.** The issue asks for measured ratios "recorded in the PR," but a recorded number cannot go red on a future regression. This mission's own thesis — that an un-enforced contract drifts, which is exactly why FR-006's anti-drift test exists for the parity half of the contract — applies equally to the contrast half. FR-012 adds a narrowly-scoped executable assertion over exactly this mission's own token and five surfaces (page, card, input, and — added after the pre-merge squad found the real work-explorer composition renders `.sk-input` on `--sk-surface-muted`, which the original three-surface scope left unguarded — muted and pill), in both themes (ten assertions). It is explicitly **not** the general WCAG 1.4.11 gate #155 raises as an open question ("Consider whether a 1.4.11 check belongs in the a11y gate") — this mission does not build that, and says so here and in the PR body so a reviewer does not read FR-012 as #155's open question being silently resolved or absorbed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One neutral control-boundary fix reaches both consumption paths (Priority: P1)

A sighted, low-vision, or color-perception-impaired user viewing a CLI-auth text field (Family 5 A3, code entry) in either theme can see the field's boundary against the page, a card, and the field's own fill, because both the static `.sk-input` exemplar and the live `<sk-form-input>` element's shadow-DOM control render the identical, newly-introduced `--sk-border-control` role.

**Why this priority**: This is the entire reason the mission exists — GAP-F5-02, and the reused-hairline defect #155 already named on a second surface (the button). Without this, Family 5's A3 screen ships a form field whose only boundary affordance is a hairline that fails WCAG 1.4.11 in both themes.

**Independent Test**: Read the computed `border-color` of `.sk-input` and of `<sk-form-input>`'s shadow-DOM `.sk-form-input__control` in both themes; compute the contrast ratio against `--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, `--sk-surface-muted`, and `--sk-surface-pill`; assert ≥3:1 on all ten combinations.

**Acceptance Scenarios**:

1. **Given** the dark theme (default), **When** the resting-state (non-focus, non-invalid, non-disabled) border color of `.sk-input` and of `.sk-form-input__control` is read, **Then** both resolve to the same value, and that value clears 3:1 contrast against `--sk-surface-page`, `--sk-surface-card`, and `--sk-surface-input`.
2. **Given** the light theme (`.sk-light`), **When** the same border color is read on both paths, **Then** both resolve to the same value, and that value clears 3:1 contrast against the light-theme `--sk-surface-page`, `--sk-surface-card`, and `--sk-surface-input`.
3. **Given** either theme, **When** the focus, `[aria-invalid="true"]`, and `:disabled` states are inspected, **Then** their existing border-color rules (`--sk-border-focus`, `--sk-color-red`, opacity dimming) are unchanged by this mission — only the resting-state border color moves.

---

### User Story 2 - The control clears a documented 44px interactive target size (Priority: P1)

A user with limited fine motor control, or anyone on a touchscreen, can reliably target the CLI-auth text field because its rendered block-size meets the WCAG 2.5.8-aligned 44px floor already established at #303, on both consumption paths, at narrow viewport widths and at 200% zoom.

**Why this priority**: The second half of GAP-F5-02's evidence — neither `.sk-input` nor `.sk-form-input__control` declares any target-size floor today, and Family 5's A3 screen is a touch- and low-vision-relevant CLI login flow.

**Independent Test**: Render both consumption paths at a narrow viewport (390px) and under a calibrated 200% zoom simulation; measure the control's rendered box; assert the measured block-size is at least 44 CSS px in both conditions, on both paths, with no clipping/overflow.

**Acceptance Scenarios**:

1. **Given** either consumption path rendered at 390px width, **When** the control's rendered box is measured, **Then** its block-size (height) is at least 44px.
2. **Given** either consumption path rendered under a calibrated 200% zoom simulation, **When** the control's rendered box is measured, **Then** its block-size remains at least 44px and the control is not clipped by any ancestor or pushed outside the viewport.

---

### User Story 3 - The static and element forms cannot silently drift apart again (Priority: P1)

A future contributor changing only one of `sk-form-field.css` or `sk-form-input.css` — by mistake, by habit, or because a generic hairline token changes upstream — is stopped by a test that fails specifically because the two files' border and target-size declarations no longer agree, rather than relying on two people remembering to hand-sync two files forever.

**Why this priority**: This is the issue's own stated "hard part" — an anti-drift proof, not two hand-synced declarations. #173 already documents that these two rules are "the same declaration block modulo `1px` vs `var(--sk-border-width-1)`" with nothing enforcing that beyond discipline; this mission is explicitly told not to repeat that shape for a WCAG-load-bearing value.

**Independent Test**: Temporarily edit only one file's border-color or `min-block-size` value to a different (but still valid) token; run the anti-drift test; confirm it fails, naming the specific file/selector/property that diverged; revert; confirm it passes.

**Acceptance Scenarios**:

1. **Given** both files declare byte-identical `border` and `min-block-size` values (modulo selector name) for their respective control rule, **When** the anti-drift test runs, **Then** it passes.
2. **Given** one file's border-color token is changed to a different valid token while the other is not, **When** the anti-drift test runs, **Then** it fails, and its failure message names which file/selector/declaration diverged from which.
3. **Given** both files are changed together to the same, but WRONG (non-canonical), token, **When** the anti-drift test runs, **Then** it still fails — because the test also asserts each file's value against the documented canonical expression, not only cross-file equality.

---

### User Story 4 - The boundary survives forced-colors mode, distinguishably from a decorative hairline (Priority: P2)

A Windows High Contrast (`forced-colors: active`) user can still perceive the field's boundary as an *interactive control* boundary, not as an inert decorative line the OS palette has flattened into invisibility or into the same color as unrelated dividers.

**Why this priority**: Named explicitly in the issue's required tests. `<input>` is a native form control, and `forced-colors` mode gives native form controls their own UA-level remap distinct from a generic bordered `<div>` — this needs to be measured on the real elements, not assumed from the general "a plain border survives forced-colors automatically" note in `adding-a-component.md` (which was measured against non-form-control elements).

**Independent Test**: Emulate `forced-colors: active`; render both consumption paths; read the computed border style/color of the control; assert a border is present (`border-style` is not `none`) and record its actual resolved system color for comparison against a plain, non-interactive bordered element in the same mode.

**Acceptance Scenarios**:

1. **Given** `forced-colors: active` is emulated, **When** either consumption path's control is inspected, **Then** its computed `border-style` is not `none` and its border remains visibly rendered.
2. **Given** the same emulation, **When** the control's resolved forced-colors border color is compared against a plain, non-interactive bordered reference element rendered in the same document, **Then** the two are recorded (not assumed) and the control's own remap is confirmed to be the UA's native form-control mapping rather than a decorative one.

---

### User Story 5 - The coordination outcome is recorded, not performed (Priority: P2)

A maintainer reading #155 later can follow a link to this mission's PR and see, in one place, that the new role exists, is measured, and is available for `.sk-button--secondary` to adopt — without this mission having touched `.sk-button--secondary`, closed #155, or widened #155's scope on #155's behalf.

**Why this priority**: Both the source issue and the binding programme decision state this explicitly as an obligation this mission owns and a boundary it must not cross.

**Independent Test**: Confirm the PR body/description names `--sk-border-control`, its measured ratios, and states plainly that `.sk-button--secondary` and `packages/styles/src/**/*button*` are untouched by this mission's diff.

**Acceptance Scenarios**:

1. **Given** the finished PR, **When** its description is read, **Then** it records the new token, its measured ratios (per-theme, `ratio : 1` format), and an explicit statement that #155 is not closed, absorbed, or widened by this mission.
2. **Given** the finished PR's diff, **When** it is scanned for button-related paths, **Then** zero files under any `*button*` component directory appear.

---

### Edge Cases

- **`sk-textarea` / `.sk-form-textarea__control`, and `sk-form-select`, now visually diverge from `.sk-input` / `.sk-form-input__control`.** All three keep `--sk-border-default` (unchanged, out of scope per the issue's own non-goals). `.sk-form-select`'s own `border-color: var(--sk-border-default)` (`packages/styles/src/form-select/sk-form-select.css`) is a third sibling instance of the identical weak hairline, not named in the source issue but found while checking this mission's blast radius — this is a **known, deliberate, and disclosed** consequence of this mission, not a silently introduced inconsistency — recorded here so a reviewer does not mistake any of the three for a missed file. Each is explicitly flagged as an adjacent instance for a future mission, not pulled into this one.
- **What happens to a form field in an unusually narrow flex/grid container (narrower than 48px inline-size)?** Only `min-block-size` is floored by this mission; `min-inline-size` is not. The control already declares `width: 100%`, so in every realistic form-field layout its inline-size tracks its container, which is expected to exceed 44px; a container deliberately narrower than that is a consumer layout defect, not a target-size defect this component can (or should) resist by imposing a `min-inline-size` that would break intentionally-narrow non-field usages. This is a deliberate scoping choice, not an oversight.
- **What happens at `[aria-invalid="true"]` or `:disabled`?** Unaffected — those rules keep their own border-color declarations (`--sk-color-red`, opacity dimming) untouched; only the resting-state (non-focus, non-invalid, non-disabled) border color and the new `min-block-size` apply universally across all states (target size is not state-conditional; a disabled or invalid control is still, physically, the same box).
- **What happens under `prefers-reduced-motion: reduce`?** Unaffected — this mission changes no `transition` or animation declaration.
- **What happens in a right-to-left (RTL) document?** Unaffected — `width: 100%` and the (unchanged) `border` shorthand apply uniformly regardless of direction; `min-block-size` is already a logical property.
- **What happens to the five hand-authored static HTML exemplars?** No markup change is required — all five (`-default`, `-focus`, `-error`, `-disabled`, `-filled`) apply only the `.sk-input`/`.sk-textarea` classes with no inline style duplicating the border or height value (verified by reading all five files at this mission's branch point); the CSS-only change reaches them automatically.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | New `--sk-border-control` token role, both themes, as an independent literal | As a library maintainer, I want a new border role in the Borders block of `packages/tokens/src/tokens.css`, defined in both `:root` (`#81818B`) and `:root[data-theme="light"], .sk-light` (`#7A7A6E`), as **independently declared literals** — not an alias of `--sk-fg-subtle` or any other token — with its derivation and measured ratios recorded in a comment beside the declaration (matching the repo's existing `--sk-fg-subtle`/rose-tint derivation convention), so that this control-boundary role's 3:1 non-text obligation can never be silently moved by a future change made for an unrelated (e.g. text-contrast) reason. | High | Open |
| FR-002 | `.sk-input` adopts the new role and the tokenized width spelling | As a user of the static form path, I want `packages/styles/src/form-field/sk-form-field.css`'s `.sk-input` resting-state `border` declaration changed from `1px solid var(--sk-border-default)` to `var(--sk-border-width-1) solid var(--sk-border-control)`, so that its boundary clears 3:1 and its width spelling matches the element path exactly (closing the #173-documented spelling gap). | High | Open |
| FR-003 | `.sk-form-input__control` adopts the new role | As a user of the live element path, I want `packages/styles/src/form-input/sk-form-input.css`'s `.sk-form-input__control` resting-state `border` declaration changed from `var(--sk-border-width-1) solid var(--sk-border-default)` to `var(--sk-border-width-1) solid var(--sk-border-control)`, so that its boundary clears 3:1. | High | Open |
| FR-004 | 44px target-size floor via `--sk-space-9` on both rules | As a user of either consumption path, I want both `.sk-input` and `.sk-form-input__control` to declare `min-block-size: var(--sk-space-9)` with a comment naming it the 44px NFR-001 floor's nearest-above token (matching the `sk-confirm-dialog`/`sk-context-nav` precedent), so that the control reliably clears 44px regardless of content. | High | Open |
| FR-005 | State rules stay untouched | As a maintainer, I want the existing focus (`--sk-border-focus`), `[aria-invalid="true"]` (`--sk-color-red`), and `:disabled` (opacity) rules left exactly as they are on both paths, so that this mission's blast radius stays scoped to the resting-state boundary and the target-size floor. | High | Open |
| FR-006 | Automated, red-capable anti-drift assertion | As a future contributor, I want a Node-lane test (`tests/node/**/*.test.ts`, picked up automatically by the existing Vitest node project) that parses both `sk-form-field.css` and `sk-form-input.css` with `postcss` (already a devDependency, used the same way in `apps/storybook/src/tests/sk-form-select.spec.ts`), extracts the `.sk-input` and `.sk-form-input__control` rules' `border` and `min-block-size` declaration values, and asserts (a) the two files' values are equal to each other and (b) each equals the documented canonical expression (`var(--sk-border-width-1) solid var(--sk-border-control)` / `var(--sk-space-9)`), so that a future single-file edit or a future both-files-wrong edit is caught mechanically rather than by review discipline. This test must be demonstrated red (by a temporary single-file divergence) before it is demonstrated green, with the transcript recorded as evidence. | High | Open |
| FR-007 | Rendered target-size measurement, both paths, both conditions | As a QA reader, I want a Playwright spec under `apps/storybook/src/tests/` (auto-collected by the existing `npx playwright test` cross-browser job — no wiring needed, per `.github/workflows/ci-quality.yml`'s own comment that an unlisted spec in that directory is a standing hazard the suite now runs wholesale) that opens `form-formfield-html--form-input-default` and `elements-skforminput--default`, measures the control's rendered block-size at a 390px viewport and under a calibrated `style.zoom = '2'` simulation (the technique and its calibration probe already established in `apps/storybook/src/tests/sk-collection.spec.ts`), and asserts ≥44px with no clipping on all four (path × condition) combinations. | High | Open |
| FR-008 | Forced-colors distinguishability, measured | As an accessibility reviewer, I want a Playwright test that emulates `forced-colors: active` (the same `page.emulateMedia({ forcedColors: 'active' })` pattern used in `apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts`) against both consumption paths, asserts the control's computed `border-style` is not `none`, and records the control's actual resolved forced-colors border color against a plain non-interactive bordered reference rendered in the same document — measured, not assumed, per `adding-a-component.md`'s own corrected-guidance precedent that this mapping must be verified per element rather than generalized. | High | Open |
| FR-009 | Generated artifacts are regenerated, never hand-edited | As a maintainer, I want `packages/tokens/dist/token-catalogue.json` (via `npx nx run tokens:catalogue`) and `packages/elements/src/form-input/sk-form-input.css.js`/`.css.d.ts` (via `node scripts/build-elements-css.mjs`) regenerated in the same commit as their source changes, and never hand-edited, so that CI's `--check` drift gates (`build-elements-css.mjs --check`) stay green. | High | Open |
| FR-010 | Coordination outcome recorded in the PR | As the maintainer of #155, I want this mission's PR body to name `--sk-border-control`, its measured per-theme ratios in `ratio : 1` format, and an explicit statement that #155 is not closed, absorbed, or widened by this mission, so that #155 can link to it as the settled token decision for its own future one-line adoption. | Medium | Open |
| FR-011 | Changelog entry | As a consumer of `@spec-kitty/styles`/`@spec-kitty/elements`, I want a `docs/design-system/changelog.md` "Changed" entry describing the new token, the border-color change, and the added `min-block-size`, so that a consumer who diffs their rendered output against an upgrade has a stated reason. | Low | Open |
| FR-012 | Executable, narrowly-scoped contrast assertion | As a library maintainer, I want a Node-lane test that parses both theme blocks of `packages/tokens/src/tokens.css`, resolves `--sk-border-control` and the five obligated surface tokens per theme (page, card, input, muted, pill), computes the WCAG relative-luminance contrast ratio, and asserts ≥3:1 on all ten (theme × surface) combinations, so that the measured table in the PR is verifiable rather than testimonial and a future edit to any of these six tokens cannot silently drop below 3:1 with every other gate green (`bash scripts/check-token-breaking-changes.sh` computes no contrast — see the "Decisions this spec makes" section). This test must be demonstrated red (a deliberate one-step hex nudge to `--sk-border-control`) before it is demonstrated green. Scoped strictly to this mission's own token and five surfaces — it is explicitly **not** the general WCAG 1.4.11 gate #155 raises as an open question, and does not attempt to build one. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Interactive target size | `.sk-input`'s and `.sk-form-input__control`'s resting-state rendered block-size is at least 44×44px-equivalent (block-size at least 44px; inline-size already guaranteed by `width: 100%` in realistic usage — see Edge Cases), on both consumption paths, at a 390px viewport and under a calibrated 200% zoom simulation. | Accessibility | High | Open |
| NFR-002 | Non-text contrast, five surfaces, both themes | The resting-state border color both rules share clears ≥3:1 against `--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, `--sk-surface-muted`, and `--sk-surface-pill`, in both themes. Measured for the chosen `--sk-border-control` literals: dark `#81818B` — page 5.01:1, card 4.51:1, input 4.28:1, muted 3.64:1, pill 3.86:1; light `#7A7A6E` — page 3.98:1, card 4.34:1, input 3.85:1, muted 3.35:1, pill 3.51:1. All ten clear 3:1; the tightest margin is light vs. muted at 3.35:1. Mechanically enforced by FR-012's executable test, not only recorded. | Accessibility | High | Open |
| NFR-003 | Zero axe-core WCAG 2.1 AA violations | Every required story state on both consumption paths (`form-formfield-html--form-input-default/-focus/-error/-disabled/-filled`, `elements-skforminput--default/-error/-disabled`, and both `LightMode` stories) scores zero WCAG 2.1 AA violations under `node scripts/run-axe-storybook.js`. | Accessibility | High | Open |
| NFR-004 | No regression to logical-property/RTL behavior | Neither `width: 100%` nor the new `min-block-size: var(--sk-space-9)` introduces any physical (non-logical) sizing property, so RTL/logical-layout behavior is unchanged by this mission. | Reliability | Medium | Open |
| NFR-005 | Anti-drift test runs in the standard suite with no new CI wiring | The FR-006 Node test and the FR-007/FR-008 Playwright tests execute under the existing `tests/node/**/*.test.ts` Vitest inclusion glob and the existing whole-`testDir` Playwright job respectively, with zero changes to `vitest.config.mts`, `playwright.config.ts`, or any CI workflow file. | Reliability | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | One Work Package, one PR | This mission delivers exactly one bounded Work Package and one PR back into `train/elements-first`. If the work cannot fit one WP, the mission stops and reports rather than splitting on its own authority. | Process | High | Open |
| C-002 | No rename of `.sk-input`/`.sk-textarea` | This mission performs and pre-empts none of #173's rename decision. Both class names are unchanged. | Technical | High | Open |
| C-003 | `sk-textarea`/`sk-form-textarea`, and `sk-form-select`, untouched | `packages/styles/src/form-field/sk-form-field.css`'s `.sk-textarea` rule, `packages/styles/src/form-textarea/sk-form-textarea.css`'s `.sk-form-textarea__control` rule, and `packages/styles/src/form-select/sk-form-select.css`'s `.sk-form-select` rule (also `border-color: var(--sk-border-default)`, verified by reading the file at this mission's branch point — a third sibling instance of the same weak hairline, not previously named in the source issue) are not edited by this mission. The resulting visual divergence from `.sk-input`/`.sk-form-input__control` is a disclosed, deliberate consequence (see Edge Cases), not a defect this mission owns; name all three (`.sk-textarea`, `.sk-form-textarea__control`, `.sk-form-select`) in the PR body as known remaining instances so the next author finds a record rather than rediscovering an inconsistency. | Technical | High | Open |
| C-004 | `#155` is not touched, closed, or widened | No file under any `*button*` component directory (`packages/styles/src/button*`, `packages/elements/src/button*`) is edited by this mission. The coordination outcome is recorded (FR-010), not performed. | Process | High | Open |
| C-005 | No collision with #320 | This mission's only edit under `packages/tokens/` is the one new Borders-block declaration (FR-001, in both theme blocks); no other token, and no file under any button/danger-related component directory, is touched — preserving the programme decision's disjointness between this mission and #320. | Technical | High | Open |
| C-006 | No validation logic, submission behavior, or copy defaults | This mission adds no `ElementInternals`/`setValidity()` change, no new validation rule, and no default copy string, consistent with the issue's non-goals and #286's open boundary. | Technical | High | Open |
| C-007 | Tokens-first CSS | Every new or changed declaration value is a `var(--sk-*)` token; no raw hex, `Npx`, or other literal appears in either changed `.css` file. | Technical | High | Open |
| C-008 | Generated packages are never hand-edited | `packages/tokens/dist/token-catalogue.json` and `packages/elements/src/form-input/sk-form-input.css.js`/`.css.d.ts` are produced only by their own generator scripts (FR-009), never hand-written. | Technical | High | Open |
| C-009 | Visual-regression baselines: corrected after this mission's own PR was found incomplete | **Amended.** This row originally claimed "no new visual-regression baseline wiring" and that the mission's diff was invisible to `apps/storybook/src/tests/visual.spec.ts` — checked only against the one existing form-related baseline (`form-skformselect-html--*`), which was and remains correctly unaffected (`.sk-form-field`'s own rule is untouched, and it never renders `.sk-input`). What went unchecked at spec-freeze time was every *pattern* story. `packages/elements/src/patterns/work-explorer.stories.ts` composes the mission's own `.sk-input` (its "Search work packages" filter field), and PR #339's pre-merge squad found this invalidated 18 existing `work-explorer-*` baselines — not because of a layout regression, but because the border-colour fix is visible there too, plus a real (disclosed, not fixed) 1px/3px/6px height cost from pinning the 44px floor to this repo's 48px token in compositions whose natural height was 45px. All 18 were harvested from the CI run that found them and refreshed, never shot locally. The same squad pass also found zero *dedicated* visual coverage existed for either consumption path (`.sk-input`, `.sk-form-input__control`) — the only coverage was this incidental one. This mission now adds a `sk-form-select`-shaped set (default-dark, light, invalid, narrow@320px, forced-colors) for both paths in `apps/storybook/src/tests/visual.spec.ts`, following this repo's own CI-authoritative harvest flow (red on first run for a missing baseline, harvested from that run's `visual-regression-diffs` artifact, never local `--update-snapshots`). | Process | Medium | Open |
| C-010 | FR-012's contrast test does not become #155's general gate | The FR-012 test asserts exactly ten ratios for this mission's own token and five surfaces — it adds no probe table, no generalized 1.4.11 gate, and does not iterate any other component's tokens. #155's "Consider whether a 1.4.11 check belongs in the a11y gate" remains open and unaddressed by this mission; the PR body states this explicitly so FR-012 is not misread as resolving it. | Process | Medium | Open |

### Key Entities

None — this mission changes presentation tokens and CSS declarations only. It introduces no new data entity, attribute, property, event, or behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `--sk-border-control` exists in both theme blocks of `packages/tokens/src/tokens.css`, as an independently declared literal (not an alias of `--sk-fg-subtle` or any other token), and clears ≥3:1 against `--sk-surface-page`, `--sk-surface-card`, `--sk-surface-input`, `--sk-surface-muted`, and `--sk-surface-pill` in both themes (ten measured ratios, all ≥3.0, none below 3.35:1).
- **SC-002**: `.sk-input` and `.sk-form-input__control`'s resting-state `border` and `min-block-size` declarations are textually identical (modulo selector name) after this mission's edit.
- **SC-003**: The FR-006 anti-drift test is demonstrated red (against a deliberate single-file divergence) and then green, with both runs recorded as evidence in the PR.
- **SC-004**: The FR-007 rendered target-size test passes on both consumption paths at 390px and under 200% zoom simulation — 4 of 4 (path × condition) combinations ≥44px with no clipping.
- **SC-005**: The FR-008 forced-colors test passes on both consumption paths, with the control's actual resolved forced-colors border color recorded (not assumed) in the PR. Chromium-only: Playwright's forced-colors emulation does not reliably override native form-control border color on Firefox or WebKit (reproduced with a bare `<input>` carrying none of this repo's CSS), the same already-disclosed limitation `sk-collection.spec.ts`, `sk-context-nav.spec.ts`, and `sk-evidence-chain.spec.ts` already scope around; the test skips on non-Chromium browsers with the same reason text those files use.
- **SC-006**: `node scripts/run-axe-storybook.js` reports zero WCAG 2.1 AA violations across all required story states on both paths.
- **SC-007**: `node scripts/build-elements-css.mjs --check` and CI's other drift gates pass with zero diffs against the committed generated artifacts.
- **SC-008**: The PR diff contains zero files under any `*button*` component directory.
- **SC-009**: The PR body states the coordination outcome (FR-010) in a form #155 can link to.
- **SC-010**: The mission ships as one Work Package and one PR against `mission/form-input-contrast-touch-target-contract`.
- **SC-011**: The FR-012 contrast test is demonstrated red (a deliberate one-step hex nudge to `--sk-border-control`) and then green, with both runs recorded as evidence in the PR — the same standard as SC-003 applied to the contrast half of the contract.
- **SC-012**: The PR body names all three known remaining weak-hairline instances (`.sk-textarea`, `.sk-form-textarea__control`, `.sk-form-select`) and states explicitly that FR-012's test is not #155's general 1.4.11 gate.
