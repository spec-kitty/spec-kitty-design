# Mission Specification: sk-pill-tag status-tone axis

**Mission Branch**: `mission/pill-tag-status-tone-axis`
**Created**: 2026-09-10
**Status**: Draft
**Input**: GitHub issue #302 ([TKT2], Gap G1 of the Family 4 component-gap audit, epic #300), read together with ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`), which this spec treats as authoritative over the issue's own text wherever the two differ.

## Source and provenance

This spec is written from a comprehensive brief: GitHub issue #302 (full acceptance criteria, non-goals and boundary already stated), epic #300 (dependency map and shared constraints), issue #212 (which rejected a separate `sk-avatar` and confirmed `sk-card[status]`'s ownership of the card anatomy), and ADR-15 (which resolves the one genuine open question the issue itself flagged — whether #302 could freeze a static form before #301 landed). No `[NEEDS CLARIFICATION]` marker is used: ADR-15's ruling on #302 is unambiguous and is quoted verbatim in the Assumptions section below, and every other acceptance criterion in the issue is concrete and testable as written. Discovery is therefore brief-intake at Comprehensive quality, zero gap-filling questions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consume a status-tone pill in a server-rendered or element-based screen (Priority: P1)

A Team Kitty developer building the Family 4 "Teams and membership" screens (Private marker, billing-holder badge, bearer-link state) needs a status pill that draws its colour from the library's own operational-status tokens instead of hand-authoring `.link-state--active` / `.link-state--revoked`-style rules per screen, which is what forced Family 4 to invent local CSS in the first place.

**Why this priority**: This is the entire reason the issue exists (see epic #300's evidence table) and every other story depends on this axis existing.

**Independent Test**: Render `<sk-pill-tag status="success">Active</sk-pill-tag>` and, separately, the generated static `<span class="sk-pill-tag sk-pill-tag--status-success">Active</span>`; both must compute the same background/foreground pair from `--sk-status-success` / `--sk-on-status-success`, with no other CSS authored outside the library.

**Acceptance Scenarios**:

1. **Given** a page that has never set `status`, **When** it renders `<sk-pill-tag>` or the base static markup, **Then** the pill renders exactly as it does today — no visual change for an existing consumer.
2. **Given** `status="success"`, **When** the element or static markup renders, **Then** the pill's surface and text colour resolve from `--sk-status-success` and `--sk-on-status-success` and from no other token.
3. **Given** each of the six tones in turn (`neutral`, `info`, `success`, `attention`, `danger`, `recovery`), **When** rendered, **Then** each produces a visually distinct, WCAG-AA-passing surface/foreground pair in both the default and light themes.

---

### User Story 2 - Add a tone to the vocabulary without a second edit to this component (Priority: P2)

A design-system maintainer changes `status-tones.ts` (the single authored tone vocabulary, per #146/#216) and expects every consumer of that vocabulary — `sk-card` already, `sk-pill-tag` after this mission — to pick the change up mechanically rather than through a second hand-maintained list that can silently drift.

**Why this priority**: This is what "derived, not restated" means operationally, and it is the difference between a component that stays correct under a vocabulary change and one that quietly stops matching it. It is P2 rather than P1 because it is a maintenance property, not a rendering behaviour a Family 4 screen depends on today.

**Independent Test**: A test asserts that the pill-tag's tone-to-modifier map has exactly the same keys, in the same order, as `STATUS_TONES` — the same shape as the assertion `sk-card.markup.ts` carries for `CARD_STATUSES`. No test names the six tone strings directly outside `status-tones.ts` itself.

**Acceptance Scenarios**:

1. **Given** `sk-pill-tag.markup.ts`, **When** it is read, **Then** its status modifier map is produced by mapping over the imported `STATUS_TONES` array rather than by a literal object with the six strings typed out.
2. **Given** the derived map, **When** the equality assertion in the behaviour fixture runs, **Then** it fails if the map's keys and `STATUS_TONES` ever diverge in membership or order.

---

### User Story 3 - Combine a brand colour and a status tone predictably (Priority: P2)

A consumer sets both `variant` (the brand/decorative axis — `green`, `purple`, `breaking`, `yellow`) and `status` (the operational axis) on the same pill, or on `.sk-pill-tag--eyebrow`, and needs the rendered result to be the same every time, not whichever the cascade happens to produce.

**Why this priority**: The issue requires this precedence be "decided and documented in the CSS," mirroring #177. Getting this wrong silently ships a component whose paint depends on selector order rather than a decision.

**Independent Test**: Render `variant="blue"` — actually `variant="green"` (pill-tag has no `blue`) — combined with each of the six `status` values, and separately `status` alone; the computed background and colour are identical between the two, matching the documented precedence rule.

**Acceptance Scenarios**:

1. **Given** `variant` and `status` both set, **When** the pill renders, **Then** the operational tone's surface and foreground are what paint — the brand variant contributes nothing to those two properties while a status is present, exactly as `sk-card` rules for its own two axes.
2. **Given** `shape="eyebrow"` and `status` both set, **When** the pill renders, **Then** the eyebrow's padding/radius/font-size axis and the status colour axis compose without either overriding the other's declarations (they set disjoint properties).
3. **Given** the CSS source, **When** a maintainer reads it, **Then** a comment states the precedence rule and why, the same way `sk-card.css`'s status block does — not left to be inferred from source order alone.

---

### Edge Cases

- **Unknown `status` value** (e.g. `status="rogue"`): the element renders the base tag (no status modifier) and calls `console.warn`, mirroring `sk-card`'s and `sk-pill-tag`'s own existing `variant`/`shape` fallback policy exactly. It never throws in the render path.
- **`status=""`** (present but empty): treated as absent — no warning — mirroring `sk-card`'s `status=""` rule ("an attribute present-but-empty is how a template writes 'no status'").
- **Unknown value at the static-authoring path** (`pillTagStaticHtml({ status: 'rogue' })`): throws, mirroring `cardStaticHtml`'s throw-on-authoring-path / warn-on-render-path split, because this path runs at build time before anything is painted.
- **A pill inside `sk-metric`'s annotation** (`.sk-metric__annotation sk-pill-tag::part(tag)` in `sk-metric.css:67`): this mission makes **no claim** that the static and element paths compose equivalently there. That gap is real, is tracked by #314, and this mission must not paper over it in docs, stories, or tests (see Constraints, C-006).
- **Long or wrapped label text** under a status tone: the pill must not lose its surface/foreground pairing or overflow illegibly; verified by a dedicated story per the issue's required-stories list.
- **RTL / logical layout**: status modifiers introduce no physical (`left`/`right`) properties; any new declaration (e.g. a forced-colors distinguishing border, if the plan phase determines one is needed) uses logical properties (`border-inline-start-*`), consistent with `sk-card`'s status block.
- **200% zoom**: no fixed pixel dimensions are introduced by the status axis; existing token-based spacing and font-size continue to scale.
- **Forced-colors mode**: the six tones are permitted to become mutually indistinguishable from each other (this is an accepted, documented consequence for `sk-card`'s equivalent axis), but a pill carrying a status must remain distinguishable from a pill carrying none, by a mechanism the forced-colors algorithm does not erase (see NFR-002).
- **A tone added to `STATUS_TONES` in the future**: must reach `sk-pill-tag` through the derived map with no second edit to this component (User Story 2). This mission does not add a seventh tone; it only builds the derivation.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Six status modifiers, derived vocabulary | As a maintainer, I want `.sk-pill-tag--status-<tone>` for exactly the six `STATUS_TONES` and no other value, generated from a map derived from `status-tones.ts` (mirroring `sk-card.markup.ts`'s `CARD_STATUSES`), so the tone vocabulary is authored once. | High | Open |
| FR-002 | Tokens-only surface/foreground pairs | As a maintainer, I want each `.sk-pill-tag--status-<tone>` rule to set `background` and `color` from the existing `--sk-status-<tone>` / `--sk-on-status-<tone>` pair only, introducing no new token and never mixing across pairs. | High | Open |
| FR-003 | Brand-vs-status precedence, decided and documented | As a maintainer, I want the interaction between `variant` (brand) and `status` (operational) resolved at equal specificity in source order, with the rule and rationale stated in a CSS comment, mirroring #177's ruling for `sk-card` (status supersedes brand's surface/foreground entirely while present). | High | Open |
| FR-004 | `status` attribute, same shape as `sk-card` | As a consumer, I want a reflected `status` string property/attribute on `<sk-pill-tag>` accepting the six tone values, documented with the same JSDoc pattern `sk-card.ts` uses (including the pipeline-driven inline union, per `sk-card.ts`'s own comment on why the type alias cannot be imported there). | High | Open |
| FR-005 | Unknown-value fallback, warn and degrade | As a consumer supplying an untrusted or mistyped `status`, I want the element to render the base tag and warn via `console.warn`, never throw, matching `sk-card`'s and `sk-pill-tag`'s own `variant`/`shape` policy. | High | Open |
| FR-006 | Empty-string `status` is "no status" | As a consumer whose template always emits a `status` attribute, I want `status=""` treated as absent with no warning, matching `sk-card`'s rule. | Medium | Open |
| FR-007 | Static-authoring path throws on an unknown tone | As a build pipeline, I want `pillTagStaticHtml({ status: 'bogus' })` to throw before anything is committed as generated output, matching `cardStaticHtml`'s throw/warn split rationale. | Medium | Open |
| FR-008 | Static form frozen now, unconditionally, for the tone axis only | As a maintainer bound by ADR-15's ruling on #302, I want the root-class modifier form (`sk-pill-tag.markup.ts` gaining one generated export per status tone, `packages/styles/src/pill-tag/index.ts` regenerated) to ship now, because `sk-pill-tag.css`'s only `:host` rule is `display: inline-flex` with no `container-type` and no `::slotted()` — none of ADR-15's three deferred construct kinds apply to this axis. | High | Open |
| FR-009 | No claim of static/element parity for the `::part(tag)` composition into `sk-metric` | As a maintainer, I want no doc, story, or test asserting that a status-toned static pill composes into `sk-metric`'s annotation equivalently to the element form, because `sk-metric.css:67`'s `::part(tag)` rule has no paired static spelling and that decision belongs to open issue #314, not this mission. | High | Open |
| FR-010 | Tone is decoration only | As an accessibility reviewer, I want the status axis to add no `role`, no accessible-name contribution, and no inference of tone from the slotted label text — the pill's meaning is carried entirely by its text, as `sk-card`'s equivalent axis already documents. | High | Open |
| FR-011 | No user-visible literal introduced | As a maintainer tracking open issue #286, I want this mission's `render()` change (a class-list computation only) to introduce zero new text nodes, preserving `sk-pill-tag`'s existing zero-literal `render()` (fully slot-driven today). | High | Open |
| FR-012 | Ratchets updated | As CI, I want `expected-docs.json` bumped for the new attribute (2 → 3 for `sk-pill-tag`, plus `total`), and `behaviours.json` extended with the new subject obligation from FR-013, so the new surface is governed rather than silently ungated. | High | Open |
| FR-013 | Behaviour coverage for the new reflected property | As CI, I want `sk-pill-tag` registered for SC-010 (property assignment reaches the reflected attribute on upgrade) because `status` is its first reflected string property added since SC-010 became a live obligation — mirroring #177's exact argument for why `sk-card` picked up SC-010 on `status` rather than retroactively on `variant`. `sk-pill-tag` keeps its existing SC-013/SC-014 subject status. | High | Open |
| FR-014 | Behaviour fixture derives its loop from `STATUS_TONES` | As a maintainer, I want the pill-tag behaviour test to iterate `STATUS_TONES` (imported from `status-indicator/status-tones.js`, never `@spec-kitty/elements`, per the fixture's own import rule) rather than a hardcoded six-item list, and to carry the keys-equal-vocabulary-in-order assertion from User Story 2. | High | Open |
| FR-015 | Required stories | As a design reviewer, I want stories for all six tones; brand alone; brand × each status; `shape="eyebrow"` combined with a status; no modifier; long/wrapped labels; RTL/logical layout; 200% zoom; default (dark) and the required `LightMode` variant — matching the issue's "Required stories and tests" list. | High | Open |
| FR-016 | Forced-colors distinguishability | As an accessibility reviewer, I want every tone to remain distinguishable from the no-status base pill under `forced-colors: active`, by whatever mechanism the plan phase selects (survives color remapping, e.g. a border, following `sk-card`'s precedent), even though the six tones may become indistinguishable from each other in that mode (an accepted, documented consequence, not a defect). | High | Open |
| FR-017 | Measured contrast, recorded | As an accessibility reviewer, I want sRGB contrast measured (not assumed) in both themes for (a) the pill's text on its status surface, and (b) the `--sk-on-status-<tone>` / `--sk-status-<tone>` pair itself, recorded in the CSS or docs the way `sk-pill-tag.css`'s existing tint-contrast comment records its own brand-variant measurements. | High | Open |
| FR-018 | Axe and visual regression | As CI, I want the new stories added to the axe-core Storybook run and the visual-regression baseline set, with baselines taken from CI's `visual-regression-diffs` artifact rather than a local run. | High | Open |
| FR-019 | Docs updated | As a consumer, I want `docs/design-system/using-components.md` (or the component's own doc surface) to state the `status` axis, its six values, the fallback policy, and the ADR-15-derived boundary from FR-009. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Contrast threshold | Every `--sk-on-status-<tone>` on `--sk-status-<tone>` pair, and the pill's rendered text on its status surface, measures at least 4.5:1 in both the default and light themes, measured rather than assumed (FR-017). | Accessibility | High | Open |
| NFR-002 | Forced-colors distinguishability | A status-bearing pill remains visually distinguishable from a no-status pill under `forced-colors: active` in both color schemes, by a mechanism unaffected by the algorithm's color remapping (e.g. width, not color alone). | Accessibility | High | Open |
| NFR-003 | Zero new tokens | The mission introduces zero new entries to `packages/tokens/src/tokens.css`; `npx nx run tokens:catalogue` output is unchanged by this mission. | Technical | High | Open |
| NFR-004 | Bundle-size delta stays negligible | `packages/elements/SIZES.md`'s delta for `sk-pill-tag` stays consistent with a six-rule CSS addition and one new attribute — no unrelated component's recorded size moves. | Performance | Medium | Open |
| NFR-005 | No regression to existing brand-only rendering | Every existing `sk-pill-tag` story and static export (`SkPillTagHTML`, `SkPillTagGreenHTML`, etc.) renders pixel-identical to its pre-mission baseline when `status` is absent. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | One Work Package, one PR | The issue and epic #300 require this mission to ship as one bounded Work Package and one PR. If tasks-phase slicing cannot fit the full scope into one WP, the mission stops and reports rather than splitting on its own authority. | Process | High | Open |
| C-002 | Tokens-first, BEM, no hand-edit of generated output | No raw hex/rgba/px in any new declaration; class names follow `sk-block__element--modifier`; `packages/styles/src/pill-tag/sk-pill-tag.html`, `packages/styles/src/pill-tag/index.ts`, and `packages/react/src/**` are generated and must never be hand-edited — regenerate via the documented scripts. | Technical | High | Open |
| C-003 | No new component | This mission does not create `sk-status-badge` or any new element; the axis lands on the existing `sk-pill-tag`. | Scope | High | Open |
| C-004 | No change to `sk-status-indicator`, `sk-card`, or the tone vocabulary | `status-tones.ts` is read-only for this mission; no new tone is added and no existing element's anatomy changes. | Scope | High | Open |
| C-005 | `sk-metric.css` is out of scope | This mission does not modify `packages/styles/src/metric/sk-metric.css` under any circumstance, even to "fix" the `::part(tag)` gap ADR-15 and #314 describe — that decision and its implementation belong entirely to #314. | Scope | High | Open |
| C-006 | No parity claim for the `::part()` composition | No spec, plan, task, doc, story, or test produced by this mission may assert or imply that the static pill-tag composes into `sk-metric`'s annotation equivalently to the element form. | Scope | High | Open |
| C-007 | No domain vocabulary | Private / Holder / Active / Expired / Revoked / Exhausted labels, and which tone each maps to, are Team Kitty's to own and supply as label text and application logic — this mission ships no such mapping. | Scope | High | Open |
| C-008 | No interactive affordance | No dismissal, link, or interactive behaviour is added to the pill by this mission. | Scope | Medium | Open |
| C-009 | Conventional commit scopes | Commits use the enumerated scopes (`styles`, `elements`, etc.) exactly; never `specs` or `adr`. | Process | Medium | Open |
| C-010 | No "Lynn approved" language | No spec, plan, task, or commit in this mission states or implies a Lynn product verdict; Family 4's status remains ready-for-Lynn with the verdict pending, and this mission is authorized under the operator's delegated-trust waiver only. | Governance | High | Open |
| C-011 | No repo-wide #286 gate | This mission does not build a repository-wide "no user-visible literal in `render()`" gate — that is open issue #286's deliverable. This mission's own `render()` diff (FR-011) is verified by review and by the existing zero-literal baseline, not by a new gate. | Scope | High | Open |

### Key Entities

- **Status tone**: one of the six values in `STATUS_TONES` (`neutral`, `info`, `success`, `attention`, `danger`, `recovery`), authored once in `packages/elements/src/status-indicator/status-tones.ts`. This mission consumes, and does not modify, that vocabulary.
- **`sk-pill-tag` status modifier**: `.sk-pill-tag--status-<tone>`, one per tone, a sibling axis to the existing `variant` (brand) and `shape` (size) modifiers on the same component.
- **Status surface/foreground pair**: the existing `--sk-status-<tone>` / `--sk-on-status-<tone>` token pair, already defined for `sk-card`'s equivalent axis; this mission adds no new pair.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can render any of the six status tones on `<sk-pill-tag>`, or on the generated static markup, and get the same computed surface/foreground colour from both consumption paths, with zero authored CSS outside the library.
- **SC-002**: Every `--sk-on-status-<tone>` / `--sk-status-<tone>` pairing measures at least 4.5:1 contrast in both the default and light themes, verified by measurement recorded in the PR.
- **SC-003**: A status-bearing pill remains distinguishable from a status-less pill under forced-colors mode in both color schemes, verified by the same class of assertion `sk-card`'s equivalent axis carries in `apps/storybook/src/tests/elements-load.spec.ts`.
- **SC-004**: Adding a seventh tone to `status-tones.ts` in a future mission would require editing `sk-pill-tag.markup.ts` in zero additional places beyond the one derivation already present for `sk-card` — verified by the behaviour fixture's order-and-membership assertion, not merely asserted in prose.
- **SC-005**: Every pre-existing `sk-pill-tag` story, and every pre-existing static export, renders pixel-identical to its pre-mission state when no `status` is supplied.
- **SC-006**: Zero new design tokens exist in `packages/tokens/src/tokens.css` after this mission merges.
- **SC-007**: The PR's own CI (axe, visual regression, ratchets, drift checks, `npm run quality:all`, `npm run test`) is green, and the mandatory pre-merge squad (tier C per the issue) has closed its findings, before the mission is presented for merge.

## Assumptions

- **ADR-15's ruling on #302 is treated as binding and is quoted here rather than paraphrased**, per this repo's own recorded lesson that a paraphrase can harden into a false citation: "**#302 — [TKT2] `sk-pill-tag` status-tone axis.** **May freeze the tone axis now — but not 'unconditionally', and the qualifier is not in this component's own sheet.** `sk-pill-tag.css`'s only `:host` rule is `display: inline-flex`, which its own comment records as matching the static form's display and being 'inert in a document'; the sheet uses no `container-type` and no `::slotted()`. A tone axis there is an ordinary `.sk-pill-tag--<tone>` root-class modifier and does not depend on rows 1-3 of the ruling at all. **What that check missed:** another sheet styles this component through `::part()`. ... #302 may freeze the tone axis; it must **not** freeze a claim that the static pill-tag composes into `sk-metric` equivalently. **#314 owns that decision.**" (ADR-15, "Which gated children may freeze a static API, and in what form"). This resolves the issue's own instruction to not freeze the static shape "before #301 rules" — #301's ruling (ADR-15) has now landed, and it fully permits this mission's static form, subject only to the `::part()` carve-out in FR-009/C-006.
- ADR-15's Status line records it as "Proposed," with adoption gated on the still-pending Family 4 product verdict — but ADR-15 itself states the #302 gated-children section is what tells each gated mission whether it may act, and it explicitly authorizes #302's static freeze now. This mission proceeds on that authorization, consistent with the epic's "filing is authorized at ready-for-Lynn; implementation adoption is gated on Lynn's Family 4 product verdict" framing, which governs Team Kitty's *adoption* of the shipped component, not spec-kitty-design's authoring of it.
- The component-scoped no-literal test question (raised by the task brief drawing an analogy to #308's confirm-dialog precedent) is resolved as: **not needed for this mission.** `sk-pill-tag`'s `render()` today emits zero user-visible literals (fully slot-driven: `<span part="tag" class=...><slot></slot></span>`), and this mission's only change to `render()` is widening the class-list computation to read a third property — no text node is added, removed, or made conditional. Unlike #308 (a brand-new element where copy risk is inherent to the work), there is no code path in this mission's diff that could introduce a literal, so a dedicated regression test would assert an invariant the diff cannot violate. #286 remains the owner of any repository-wide enforcement (C-011).
- "Same shape `sk-card` uses" for the attribute (issue text) is read as: a reflected string property named `status`, warn-and-degrade on the render path, throw on the static-authoring path, `status=""` treated as absent — i.e., matching `sk-card.markup.ts`/`sk-card.ts`'s existing implementation pattern, not merely "also called `status`."
- No new `[NEEDS CLARIFICATION]` markers are recorded; `spec-kitty agent decision verify` is expected to report a clean state.
