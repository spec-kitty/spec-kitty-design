# Mission Specification: sk-button danger-secondary axis

**Mission Branch**: `mission/button-danger-secondary-axis`
**Created**: 2026-09-10
**Status**: Draft
**Input**: GitHub issue #320 ([TKA1], GAP-F5-01 of the Family 5 component-gap audit, epic #319), read together with the binding programme decision `_program-319/DECISION-border-role.md` (BORDER-ROLE-319), which this spec treats as authoritative over the issue's own text on the one question it settles — the control-boundary token altitude.

## Source and provenance

This spec is written from a comprehensive brief: GitHub issue #320 (full acceptance criteria, required story/test matrix, non-goals and boundary already stated), epic #319 (authority, deadline posture, squad tier), and BORDER-ROLE-319 (the programme orchestrator's binding ruling that fixes the token altitude for both #320 and its sibling #321, re-measured against the pinned train ref rather than quoted). No `[NEEDS CLARIFICATION]` marker is used: BORDER-ROLE-319 resolves the one genuine open question the issue itself raised (how to satisfy "must not silently inherit `.sk-button--secondary`'s failing hairline" without a new token), and every other acceptance criterion in the issue is concrete and testable as written, once this spec resolves two textual ambiguities explicitly (the `:active` parity discrepancy and the forced-colors distinguishability mechanism — see Assumptions). Discovery is therefore brief-intake at Comprehensive quality.

**Authority.** Approved Team Kitty Family 5 "CLI auth" pack under `ux_redesign/families/05-cli-auth` (planning repo); Opus rereview 02 verdict `approve`, 2026-09-10. Design authority `train/elements-first@4c9e3ffc8f5a70c15ddfa9d1fe2b71c6c31eb812`. Family 5 is ready-for-Lynn with her product verdict still pending; the operator has authorized this component work to proceed before that review to meet the 2026-09-15 MVP deadline. No spec, plan, task, doc, story, or commit produced by this mission states or implies a Lynn product verdict.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consume a danger-secondary button with a clear control boundary (Priority: P1)

A Team Kitty developer building the Family 5 CLI-auth screens (A1 device-code verification, A2 authorization consent, A4, A5 — each with a Deny/decline action) needs a button whose tone signals denial and whose border is clearly perceptible against the page, without hand-authoring local CSS or inheriting `.sk-button--secondary`'s already-failing hairline (#155).

**Why this priority**: This is the entire reason the issue exists (see epic #319's evidence, quoted in the issue body) and every other story depends on this combination existing.

**Independent Test**: Render `<sk-button variant="danger-secondary">Deny</sk-button>` and, separately, the generated static `<button class="sk-button sk-button--danger-secondary">Deny</button>`; both must compute the same border/text colour from `--sk-on-status-danger` and no other token, and that colour must measure ≥3:1 against `--sk-surface-page` in both themes.

**Acceptance Scenarios**:

1. **Given** a page that has never set `variant="danger-secondary"`, **When** it renders any existing `<sk-button>` combination, **Then** every existing tone, size and story renders pixel-identical to its pre-mission state — no visual change for an existing consumer.
2. **Given** `variant="danger-secondary"`, **When** the element or static markup renders, **Then** its border and text colour resolve from `--sk-on-status-danger` and no other token, and never from `--sk-border-default` or `--sk-border-strong`.
3. **Given** the rendered border/text colour in each theme, **When** measured with the WCAG 1.4.11 relative-luminance formula against `--sk-surface-page`, **Then** the ratio is recorded in the PR in #155's `ratio : 1, per theme` format and is ≥3:1 in both themes.

---

### User Story 2 - Interaction states carry the danger tone through the button's existing contract (Priority: P1)

A consumer expects `danger-secondary` to behave like every other tone under hover, active, focus-visible and disabled — because a button whose danger styling vanishes on hover, or that cannot be focused with the shared token-driven ring, is a broken control regardless of colour correctness.

**Why this priority**: The issue requires "the train's interaction-state contract" preserved explicitly; a tone that only has a correct resting state is not the deliverable.

**Independent Test**: Drive `<sk-button variant="danger-secondary">` through `:hover`, `:active`, `:focus-visible` and `:disabled`/`[disabled]` in a real browser and assert the computed styles at each state, the same way `fixtures/elements-behaviour/src/sk-button.test.ts`'s existing per-tone loop does today for `primary`/`secondary`/`ghost`.

**Acceptance Scenarios**:

1. **Given** `variant="danger-secondary"`, **When** hovered, **Then** the button gives a token-driven visual signal distinct from its resting state (see Assumptions for the resolved mechanism), using only tokens already in the reused danger pair.
2. **Given** `variant="danger-secondary"`, **When** the pointer is down (`:active`), **Then** the control applies `transform: scale(0.97)` — see Assumptions for the resolution of the issue's "parity with the existing tones" clause, which the three existing tones do not currently agree on among themselves.
3. **Given** `variant="danger-secondary"`, **When** focused via keyboard, **Then** the shared `.sk-button:focus-visible` ring renders identically to every other tone (no per-tone override needed or added).
4. **Given** `variant="danger-secondary"` and `disabled`/`[disabled]`, **When** rendered, **Then** the shared `.sk-button:disabled` rule (opacity 0.4, `cursor: not-allowed`) applies identically to every other tone (no per-tone override needed or added).

---

### User Story 3 - The combination works at both sizes and stays presentational (Priority: P2)

A consumer needs `danger-secondary` to compose with the existing `--sm` and `--icon` size axis exactly the way every other tone does, and needs the button to add no decision-making of its own about when a deny action fires, what its label says, or whether a confirmation step exists.

**Why this priority**: The issue is explicit that this is a presentational-only addition; getting the boundary wrong (e.g. inferring a confirmation step, or defaulting a label) would ship scope the issue explicitly excludes and Team Kitty explicitly owns.

**Independent Test**: Render `<sk-button variant="danger-secondary" size="sm">` and `<sk-button variant="danger-secondary" size="icon" label="Deny">`; both compose independently of tone, matching the existing `size is an axis independent of tone` test's pattern. Grep the mission's diff for any new user-visible string literal in `render()` or the static path's default content, and confirm none exists (#286).

**Acceptance Scenarios**:

1. **Given** `variant="danger-secondary" size="sm"`, **When** rendered, **Then** padding and font-size come from `.sk-button--sm` exactly as for every other tone, and the tone's own colours are unaffected by size.
2. **Given** `variant="danger-secondary" size="icon" label="Deny"`, **When** rendered, **Then** the supplied `label` reaches the real control's accessible name exactly as for every other tone at `size="icon"`, and the component neither defaults nor overrides that string.
3. **Given** the mission's full diff, **When** reviewed, **Then** it contains no state machine, no confirmation step, no mutation or request-lifecycle code, and no copy default — the button remains presentational only.

---

### Edge Cases

- **Unknown `variant` value** (e.g. `variant="rogue"`): the element renders the base button and calls `console.warn`, mirroring `sk-button`'s own existing `variant`/`size` fallback policy exactly (unchanged by this mission — `danger-secondary` is simply a fourth member of the existing map). It never throws in the render path.
- **Unknown value at the static-authoring path** (`buttonStaticHtml({ variant: 'rogue' })`): throws, unchanged — `danger-secondary` joins the same map the throw already iterates.
- **`size="icon"` with no `label`**: unchanged existing behaviour — warns and renders without `aria-label` on the render path; throws on the static-authoring path. This mission adds no new icon-label logic; `danger-secondary` reuses the existing rule.
- **`disabled` combined with `danger-secondary`**: the shared `.sk-button:disabled` rule applies; no danger-specific override is introduced, so a disabled danger-secondary button does not read as "less dangerous" through any mechanism this mission controls.
- **`href` set (anchor branch) combined with `danger-secondary`**: the tone composes with the anchor branch exactly as it does with every other tone — no anchor-specific danger styling is introduced. (A denial action styled as a link is a Team Kitty authoring choice, not something this mission evaluates.)
- **Forced-colors mode**: `.sk-button--secondary` already carries an unconditional, non-transparent `border-color`, so the platform's own colour-remapping already makes a bordered button "visible" with zero authored CSS — but that same fact means `danger-secondary` and plain `secondary` would remap to the *same* system border colour and become visually identical, which is a stronger claim than the "the danger affordance remains visible" half of the issue's requirement and does not by itself satisfy the "and distinguishable from the plain secondary tone" half. See Assumptions for the resolved mechanism (a forced-colors-only, content-drawn, alt-texted-empty marker).
- **200% zoom / RTL / logical layout**: no fixed pixel dimensions or physical (`left`/`right`) properties are introduced by this axis; existing token-based spacing continues to scale, matching every existing tone.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Fourth tone value, `danger-secondary` | As a maintainer, I want `BUTTON_VARIANTS` in `sk-button.markup.ts` to gain one new entry, `'danger-secondary': 'sk-button--danger-secondary'`, alongside `primary`/`secondary`/`ghost` — a tone value, not a second boolean modifier attribute — so the existing warn/degrade (render) and throw (static) machinery, and the existing generator's one-export-per-variant behaviour, cover it with no new code path. | High | Open |
| FR-002 | Reuse the existing danger pair only | As a maintainer bound by BORDER-ROLE-319, I want `.sk-button--danger-secondary` to set `border-color` and `color` from `--sk-on-status-danger` only, and its hover fill (FR-004) from `--sk-status-danger` only — the already-published surface/foreground pair — introducing zero new tokens and zero edits to `packages/tokens/src/tokens.css`. | High | Open |
| FR-003 | No inheritance of the failing neutral hairline | As an accessibility reviewer, I want `.sk-button--danger-secondary` to never reference `--sk-border-default` or `--sk-border-strong` at any state, so it does not reproduce #155's 1.17:1/1.48:1 failure under a new class name. | High | Open |
| FR-004 | Hover state, token-driven | As a consumer, I want `.sk-button--danger-secondary:hover` to apply a visually distinct signal from the resting state using `background: var(--sk-status-danger)` (the danger pair's surface member) with `border-color`/`color` unchanged, giving the tone an interactive affordance without inventing a new border-strength token the way `.sk-button--secondary:hover` does with `--sk-border-strong`. | High | Open |
| FR-005 | Active state, explicit parity resolution | As a consumer, I want `.sk-button--danger-secondary:active { transform: scale(0.97); }` declared explicitly on the new rule — see Assumptions for why this does not also retrofit `.sk-button--secondary`/`.sk-button--ghost`, which remains out of this mission's scope. | High | Open |
| FR-006 | Focus-visible and disabled need no new CSS | As a maintainer, I want `danger-secondary` to rely entirely on the existing shared `.sk-button:focus-visible` and `.sk-button:disabled`/`.sk-button[disabled]` rules (both selector on the bare `.sk-button` class, not per-tone) — no new rule is authored for either state, and this mission's plan must confirm rather than assume that. | High | Open |
| FR-007 | `variant` type union widened | As a maintainer, I want `sk-button.ts`'s `declare variant: 'primary' \| 'secondary' \| 'ghost' \| undefined;` and its preceding JSDoc line to add `'danger-secondary'`, so the manifest, the generated React prop type, and `packages/elements/vue.d.ts` all publish the fourth value — an easy-to-miss edit since it is a hand-spelled inline union, not derived from `BUTTON_VARIANTS`. | High | Open |
| FR-008 | Works at both `--sm` and `--icon` sizes | As a consumer, I want `variant="danger-secondary"` to compose with `size="sm"` and `size="icon"` exactly as every other tone does today — no size-specific CSS or markup change, since size and tone are already independent axes. | High | Open |
| FR-009 | Icon-only accessible name unaffected | As an accessibility reviewer, I want an icon-sized `danger-secondary` button to keep the consumer-supplied `label` as its accessible name via the existing `aria-label` mechanism, unchanged by this mission. #153 (the general icon-button accessible-name issue) is not reopened or fixed here. | High | Open |
| FR-010 | Labels stay consumer-supplied | As a maintainer bound by #286, I want this mission's diff to introduce zero default, swapped, or component-owned copy — no "Deny"/"Decline" string anywhere in `sk-button.ts`, `sk-button.markup.ts`, or any generated artifact's default `content` parameter beyond the pre-existing `'Label'` placeholder already used by every other tone's generated export. | High | Open |
| FR-011 | No mutation, confirmation, or lifecycle ownership | As a reviewer, I want the diff to contain no state machine, no confirmation-dialog composition, no double-submit prevention, and no request-lifecycle code — the element remains a presentational tone addition only. | High | Open |
| FR-012 | Static form generated automatically, no hand-authored HTML | As a maintainer, I want `SkButtonDangerSecondaryHTML` to be produced entirely by `node scripts/build-element-markup.mjs` from the FR-001 `BUTTON_VARIANTS` entry (matching the existing pattern for `secondary`/`ghost`, neither of which has a dedicated `BUTTON_AXES` entry) — `packages/styles/src/button/sk-button.html` and `index.ts` regenerate with the new export and no other tone's generated output changes. | High | Open |
| FR-013 | Forced-colors distinguishability, resolved mechanism | As an accessibility reviewer, I want `danger-secondary` to remain visually distinguishable from plain `secondary` under `forced-colors: active`, via a forced-colors-only, content-drawn, alt-texted-empty marker (CSS Generated Content's `content: '<glyph>' / '';` syntax, the way `sk-disclosure` uses it) that renders in neither normal light nor dark mode and contributes nothing to the accessible name — because the two tones' borders alone remap to the same system colour and cannot by themselves satisfy "distinguishable" once `secondary` already carries an unconditional, non-transparent border (see Assumptions). The exact glyph is a plan-phase decision. | High | Open |
| FR-014 | No `forced-color-adjust: none` | As a maintainer, I want the forced-colors marker to be content-drawn, never background-drawn, and never use `forced-color-adjust: none` — `adding-a-component.md`'s own measured hazard (a background-drawn icon frozen at its authored colour goes invisible against the forced-colors ground). | High | Open |
| FR-015 | Required stories | As a design reviewer, I want stories covering: default/hover/active/focus-visible/disabled for `danger-secondary` at both `--sm` and `--icon` sizes; default (dark) and the required `LightMode` variant; both-theme contrast proof recorded in a CSS comment (FR-002's pair, #155's format); a forced-colors story or test demonstrating the FR-013 marker; matching the issue's "Required stories and tests" list. | High | Open |
| FR-016 | Behaviour test updated for the fourth tone | As CI, I want `fixtures/elements-behaviour/src/sk-button.test.ts`'s `the primary tone PAINTS, and the three tones are distinct` test's hardcoded `expect(variants.length, …).toBe(3)` updated to `toBe(4)` — the rest of that test's logic (derived from `Object.keys(BUTTON_VARIANTS)`, asserting pairwise-distinct computed style triples) needs no other change and automatically covers the new tone. | High | Open |
| FR-017 | #286 no-copy-default assertion | As CI, I want a behavioural check consistent with #286's DoD pattern (a grep-style assertion, or a test asserting `buttonStaticHtml({ variant: 'danger-secondary' })`'s default rendered content is unchanged from the shared `'Label'` placeholder) that no new copy default was introduced by this mission. | High | Open |
| FR-018 | Ratchets confirmed unchanged, not silently skipped | As a maintainer, I want the plan to explicitly confirm — not merely omit — that `expected-parts.json` (`sk-button` still declares exactly one part, `button`) and `expected-docs.json` (`sk-button` still has 5 attributes / 0 properties / 0 methods) both need **no edit**, because `danger-secondary` is a new *value* of the existing `variant` attribute, not a new attribute, property, method, or part. | High | Open |
| FR-019 | Axe and visual regression | As CI, I want the new stories added to the axe-core Storybook run and the visual-regression baseline set, with baselines taken from CI's `visual-regression-diffs` artifact rather than a local run. | High | Open |
| FR-020 | React wrapper regeneration verified | As a maintainer, I want `node scripts/build-react-wrappers.mjs --check` and `node scripts/build-vue-types.mjs --check` run and green after FR-007's type-union edit, confirming the generated `SkButton` React/Vue prop types include `'danger-secondary'` with no drift. | High | Open |
| FR-021 | Docs updated | As a consumer, I want `docs/design-system/using-components.md` (or `sk-button`'s own doc surface) to state the fourth tone, its reused-token boundary, and the #155 coordination outcome from FR-022. | Medium | Open |
| FR-022 | #155 coordination recorded, not silently widened | As a maintainer, I want the PR body to record that this mission does not touch, close, or widen #155's scope — #155 still owns `.sk-button--secondary`'s own adoption of a future neutral border role (owned by #321) — and to link that record back from #155, per the issue's explicit instruction. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Contrast threshold | `--sk-on-status-danger` measured against `--sk-surface-page` is ≥3:1 (WCAG 1.4.11) in both the default and light themes, measured (not assumed) and recorded in the PR. | Accessibility | High | Open |
| NFR-002 | Zero new tokens | The mission introduces zero new entries to `packages/tokens/src/tokens.css`; `npx nx run tokens:catalogue` output is unchanged by this mission. | Technical | High | Open |
| NFR-003 | Forced-colors distinguishability | `danger-secondary` remains visually distinguishable from plain `secondary` under `forced-colors: active` in both colour schemes, via the FR-013 mechanism, verified by an assertion in `apps/storybook/src/tests/elements-load.spec.ts` or an equivalent Playwright emulation, mirroring the class of assertion `sk-pill-tag`'s own forced-colors axis carries. | Accessibility | High | Open |
| NFR-004 | Bundle-size delta stays negligible | `packages/elements/SIZES.md`'s delta for `sk-button` stays consistent with a four-rule CSS addition (default, hover, active, forced-colors) and one widened type union — no unrelated component's recorded size moves. | Performance | Medium | Open |
| NFR-005 | No regression to existing tones or sizes | Every existing `sk-button` story, generated static export, and behaviour-test assertion renders/passes pixel- and value-identical to its pre-mission state. | Reliability | High | Open |
| NFR-006 | Zero WCAG 2.1 AA violations | axe-core reports zero violations across every new and existing `sk-button` story, where a story that fails to load counts as a failure. | Accessibility | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | One Work Package, one PR | The issue requires this mission to ship as one bounded Work Package and one PR. If tasks-phase slicing cannot fit the full scope into one WP, the mission stops and reports rather than splitting on its own authority. | Process | High | Open |
| C-002 | No edit to `packages/tokens/src/tokens.css` | Binding under BORDER-ROLE-319: this mission does not introduce or consume a neutral border token and does not touch the token file at all. | Scope | High | Open |
| C-003 | No edit to `.sk-button--secondary` or `.sk-button--ghost` | This mission adds a fourth tone; it does not repaint, retrofit, or otherwise modify the three existing tone rules (including not adding `:active` to `secondary`/`ghost` — see Assumptions on the parity resolution). | Scope | High | Open |
| C-004 | #155 is not closed, absorbed, or widened | `.sk-button--secondary`'s own hairline fix remains #155's and #321's, in that order; this mission only records coordination (FR-022). | Scope | High | Open |
| C-005 | No new component, no new attribute | The axis lands as a fourth value of the existing `variant` attribute on the existing `sk-button`; no new element, no new boolean/enum attribute, no new `::part()`. | Scope | High | Open |
| C-006 | No state machine, confirmation, or copy ownership | No deny/consent/authorization state machine, CLI or OAuth device-code flow logic, permission/scope evaluation, confirmation dialog or step, mutation/request-lifecycle code, double-submit prevention, or copy/i18n default (#286) is added by this mission. | Scope | High | Open |
| C-007 | No new palette | Every colour this mission introduces resolves from `--sk-status-danger` / `--sk-on-status-danger`; no new hex, rgba, or hsl literal, and no reach into an unrelated status pair. | Scope | High | Open |
| C-008 | Busy axis excluded | This mission adds no loading/busy state or spinner affordance — that is #305, a separate concern on the same component. | Scope | High | Open |
| C-009 | No auth-card, form-action-row, or scope-chip component | These Family 5 candidates were explicitly excluded at filing and are not revived by this mission. | Scope | High | Open |
| C-010 | Conventional commit scopes | Commits use the enumerated scopes (`styles`, `elements`, etc.) exactly; never `specs`, `spec`, `adr`, or `button`. Pure doc commits use unscoped `docs:`. | Process | Medium | Open |
| C-011 | No "Lynn approved" language | No spec, plan, task, doc, or commit in this mission states or implies a Lynn product verdict; Family 5's status remains ready-for-Lynn with the verdict pending, and this mission is authorized under the operator's own deadline-driven ruling recorded in the issue, not a product sign-off. | Governance | High | Open |
| C-012 | No hardcoded CSS values | Every new declaration is a `var(--sk-*)` reference; `stylelint-declaration-strict-value` against the generated token catalogue is the enforcing gate. | Technical | High | Open |

### Key Entities

- **`danger-secondary` tone**: a fourth entry in `BUTTON_VARIANTS` (`sk-button.markup.ts`), sibling to `primary`/`secondary`/`ghost`, backed by `.sk-button--danger-secondary` in `sk-button.css`. Composes the secondary shape (transparent background at rest, bordered) with the danger foreground/border colour.
- **Danger surface/foreground pair**: the existing `--sk-status-danger` / `--sk-on-status-danger` token pair, already published and used by `sk-status-indicator` and `sk-pill-tag`'s status axis. This mission adds no new pair and no new token.
- **Forced-colors marker**: a content-drawn, alt-texted-empty (`content: '<glyph>' / '';`) pseudo-element rule scoped to `@media (forced-colors: active)` only, existing purely to keep `danger-secondary` distinguishable from `secondary` once the platform's own colour remap makes their borders identical.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can render `variant="danger-secondary"` on `<sk-button>`, or the generated static markup, and get the same computed border/text colour from both consumption paths, with zero authored CSS outside the library.
- **SC-002**: `--sk-on-status-danger` against `--sk-surface-page` measures ≥3:1 in both the default and light themes, verified by measurement recorded in the PR in #155's format — independently re-derived by this mission, not quoted from BORDER-ROLE-319.
- **SC-003**: `danger-secondary` remains visually distinguishable from plain `secondary` under `forced-colors: active` in both colour schemes, verified by the same class of assertion `sk-pill-tag`'s equivalent axis carries.
- **SC-004**: Every pre-existing `sk-button` story, generated static export, and behaviour-test assertion renders/passes value-identical to its pre-mission state (only the hardcoded `3` → `4` tone-count literal in FR-016 changes).
- **SC-005**: Zero new design tokens exist in `packages/tokens/src/tokens.css` after this mission merges; zero edits to that file appear in the PR's diff.
- **SC-006**: The PR's own CI (axe, visual regression, ratchets, drift checks, `npm run quality:all`, `npm run test`) is green, and the mandatory pre-merge squad (tier C per the issue) has closed its findings, before the mission is presented for merge.
- **SC-007**: The PR body records the #155 coordination outcome (FR-022), and a comment recording it is posted back to #155.

## Assumptions

- **BORDER-ROLE-319 is treated as binding and is quoted here rather than paraphrased**, per this repo's own recorded lesson that a paraphrase can harden into a false citation: *"#320 does NOT introduce or consume a neutral border token, and does not touch tokens.css. A danger-toned button's boundary is the danger role itself. `--sk-on-status-danger` already resolves to `#E97373` dark / `#6B2424` light and measures 6.58:1 and 10.12:1 against the page — it clears 1.4.11 with margin, is an existing published pair member, and invents no palette... #320 therefore satisfies 'must not silently inherit `.sk-button--secondary`'s failing hairline' by never reaching for `--sk-border-default` at all. #320 must still measure and publish its own ratios rather than quoting this table."* This spec's own independent re-measurement (relative-luminance formula, computed directly from `packages/tokens/src/tokens.css`'s current dark/light hex values on this branch) reproduces those exact figures — 6.58:1 dark / 10.12:1 light against `--sk-surface-page` — and additionally measures 5.94:1 dark / 11.04:1 light against `--sk-surface-card`, and 5.63:1 dark / 9.78:1 light against `--sk-surface-input`, all clearing 3:1 with wide margin, recorded here as the independent verification the issue and BORDER-ROLE-319 both require.

- **The `:active` parity discrepancy is resolved as follows.** The issue's parenthetical is explicit: *"active (`transform: scale(0.97)` parity with the existing tones)."* Measured against the real source, only `.sk-button--primary` currently declares `:active { transform: scale(0.97) }` — `.sk-button--secondary` and `.sk-button--ghost` do not. So "parity with the existing tones" cannot mean "inherit whatever the tone it's shaped like already does," because the three existing tones disagree with each other. This spec reads the issue's explicit, named value as instructing that `danger-secondary` receive `transform: scale(0.97)` on `:active` directly — treating the value the issue names, not the base tone's current incomplete adoption of it, as the contract to honour for a brand-new tone with no prior inconsistency to inherit. This resolution deliberately does **not** retrofit `:active` onto `.sk-button--secondary` or `.sk-button--ghost` (C-003) — that is a pre-existing inconsistency across the other three tones, out of scope for a mission whose brief is one new tone, and not something #320 is positioned to rule on for the whole component.

- **The forced-colors distinguishability mechanism is resolved as follows.** `adding-a-component.md`'s own forced-colors guidance and `sk-pill-tag.css`'s own load-bearing comment establish the operating facts this spec relies on: a plain, non-transparent `border` survives `forced-colors: active` with zero author CSS (the browser remaps its colour automatically), `background` does not (it flattens to `Canvas`), and — critically — when *every* candidate tone already carries such a border, the remap makes them mutually indistinguishable by colour alone (pill-tag's own precedent explicitly accepts this consequence for its six status tones against each other). `.sk-button--secondary` already declares an unconditional, non-transparent `border-color` today, so `danger-secondary`, which reuses the same bordered shape, would remap to the *identical* system border colour as plain `secondary` — satisfying "the danger affordance remains visible" but not "and distinguishable from the plain secondary tone," which is a narrower, single-pair comparison than pill-tag's "distinguishable from no-status" case (pill-tag's base pill has no border at all, so presence-vs-absence alone was enough there). Colour and border-presence are therefore both ruled out as the mechanism. A background-drawn glyph is also ruled out, per `sk-disclosure`'s own measured finding that a background-drawn icon frozen with `forced-color-adjust: none` is frequently invisible against the forced-colors ground. What remains, and what this spec adopts: a **content-drawn, alt-texted-empty marker**, `content: '<glyph>' / '';`, rendered only inside `@media (forced-colors: active)` and never in normal light or dark rendering — mirroring `sk-disclosure__summary::before`'s own use of CSS Generated Content's alt-text syntax to keep a decorative glyph out of the accessible name. This is a genuine, if narrow, scope addition beyond "reuse the existing pair": it is presentational and forced-colors-scoped only, introduces no new token, and does not touch `secondary` or `ghost`. The exact glyph and its exact selector are left to the plan phase to choose and defend, consistent with this repo's practice of naming the mechanism at spec level and the literal value at plan level.

- **The exact tone shape (fourth `variant` value vs. a separate modifier attribute) is decided here, not left open**, per the issue's own statement that "the exact shape... is an implementation decision within this mission, not prescribed here." This spec selects a fourth `BUTTON_VARIANTS` entry over a separate boolean/attribute modifier because: (a) `danger-secondary` is mutually exclusive with `primary`/`secondary`/`ghost` — a button cannot sensibly be both `secondary` and `danger-secondary` at once, which is exactly what an enum axis (not an independent boolean) should model; (b) it requires zero new code paths — the existing warn/degrade, throw, and one-export-per-variant generator behaviour all already iterate `BUTTON_VARIANTS`; and (c) the mission's own slug and the issue's own vocabulary ("one danger-secondary combination") already name it as a single tone, not a composition of two independent axes.

- No new `[NEEDS CLARIFICATION]` markers are recorded; `spec-kitty agent decision verify` is expected to report a clean state.
