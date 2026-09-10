# Mission Specification: action-row-static-form

**Mission Branch**: `mission/action-row-static-form`
**Created**: 2026-09-10
**Status**: Draft
**Input**: Issue #307 [TKT7] · epic #300 · ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`)

## Summary

Give `sk-action-row` a server-renderable static form with the same anatomy, reflow behaviour and
accessibility contract as the shadow-DOM custom element, so a Django-rendered page (Team Kitty's
Family 4 workspace/invitation/ledger rows) can compose it without JavaScript and without the
silent container-query failure ADR-15 measured and named. ADR-15 has already ruled on the shape:
freeze the **two-element wrapper** (`.sk-action-row-host` > `.sk-action-row`), never a
single-element collapse, and freeze the markup and its CSS contract together — including the fact
that the wrapper's CSS does not ship as package output until #309 lands.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A Django template author reproduces one action row statically (Priority: P1)

A Team Kitty template author (T1/T3/T4 in Family 4) writes the two-element wrapper markup and the
light-DOM BEM classes for one action row — mark, title, reference, metadata, tags, supporting
content — with no custom element and no JavaScript, and the row reflows at narrow widths exactly
as the shadow-DOM `sk-action-row` does at the same width.

**Why this priority**: This is the mission's entire reason for existing — #301 was opened because
Family 4 could not do this at all (`:host`-based `container-type` is inert on a document page) and
reached for a table/list/`<dl>` instead, forking the anatomy. Without this, nothing else in the
mission matters.

**Independent Test**: Render the generated static exemplar and the real `<sk-action-row>` element
at the same set of widths (desktop and the ≤400px/401px reflow boundary named in ADR-15); assert
every measured layout property is equal between the two, in one engine, the way ADR-15's own
measurement did.

**Acceptance Scenarios**:

1. **Given** a consumer authors `<div class="sk-action-row-host"><div class="sk-action-row">…`
   with the documented `.sk-action-row-host` CSS block and the built `sk-action-row.css`, **When**
   the row is rendered at 360px, **Then** `.sk-action-row` computes `flex-wrap: wrap`, matching the
   real element at the same width.
2. **Given** the same static markup, **When** it is rendered at 401px (one pixel past the
   `@container (max-width: 400px)` boundary), **Then** the trigger's three-column
   `grid-template-areas` is in effect, matching the real element.
3. **Given** a consumer instead collapses the wrapper onto `.sk-action-row` and moves
   `container-type` there, **Then** this is a documented anti-pattern this mission's docs
   explicitly reject, backed by the ADR-15 measurement showing it diverges at the reflow boundary.

---

### User Story 2 - Trailing controls never nest inside the row's link (Priority: P1)

A row is a real navigable link (#272's route mode) AND carries independent trailing controls
(resend, cancel, revoke). A screen-reader or keyboard user can reach the link and each trailing
control as separate, correctly-ordered interactive targets, and no trailing control is ever a
descendant of the anchor.

**Why this priority**: Load-bearing per the issue text and tied directly to #272's already-shipped
rule; nesting a button inside an anchor is invalid HTML and breaks activation semantics for both.

**Independent Test**: A structural assertion over the generated static markup (and the shadow
DOM) confirms `.sk-action-row__trigger .sk-action-row__controls` never matches, in both forms, for
every generated exemplar that has trailing controls.

**Acceptance Scenarios**:

1. **Given** a route-mode row with two trailing controls, **When** the DOM is inspected, **Then**
   `.sk-action-row__controls` is a sibling of the `<a class="sk-action-row__trigger">`, not a
   descendant of it.
2. **Given** the same row, **When** tabbing from the page, **Then** the anchor and each control are
   distinct tab stops in visual (DOM) order, and each interactive target measures at least 44px at
   both narrow and desktop widths.
3. **Given** a row with no trailing controls, **When** the DOM is inspected, **Then** no
   `.sk-action-row__controls` element exists at all (not merely hidden).

---

### User Story 3 - Identity and state presentation match the shadow form (Priority: P2)

A row's `aria-current` state and flush/bordered presentation render identically, and are equally
absent when not set, in the static form and the shadow form.

**Why this priority**: Family 4's T4 invitation ledger and T1 workspace rows depend on visually and
programmatically indicating the current row; a mismatch between forms is a silent regression the
same way the reflow defect was.

**Independent Test**: Render a current and a non-current row in both forms; assert the attribute
is present with the correct value in the current case and **absent from the DOM** (not `"false"`)
in the non-current case, in both forms.

**Acceptance Scenarios**:

1. **Given** a current, non-route row, **When** rendered statically, **Then** `.sk-action-row` has
   `aria-current="true"`; **given** the row is not current, **Then** the attribute is absent from
   the element entirely.
2. **Given** a current route-mode row, **When** rendered statically, **Then** the anchor carries
   `aria-current="page"` and `.sk-action-row` itself does not carry `aria-current="true"`.
3. **Given** `presentation="flush"` is applied statically (`.sk-action-row--flush`), **When**
   computed style is read, **Then** background/border/radius match the shadow form's flush
   presentation exactly, and the un-flushed case restores the card surface tokens.

---

### User Story 4 - A single row swaps as a self-contained fragment (Priority: P2)

Family 4's T4 invitation ledger replaces exactly one row's markup with a server-rendered fragment
(resend/cancel state change) without touching sibling rows or running any script.

**Why this priority**: Explicitly named in the issue ("T4's single-row swap") as the self-contained
requirement; a static form that depends on a parent wrapper's state or a build-time index would
break this use case silently.

**Independent Test**: Render one row's static markup in isolation (no surrounding collection
markup, no shared stylesheet state beyond the package CSS and the documented host rule) and assert
it presents identically to the same row rendered inside a collection.

**Acceptance Scenarios**:

1. **Given** one row's two-element markup rendered alone in a document, **When** compared to the
   same row rendered as the 3rd of 5 rows in a flush collection, **Then** the row's own
   presentation (border, reflow, `aria-current`) is identical in both placements.

---

### Edge Cases

- Long, unbroken identifiers and email addresses in title/reference/metadata contain locally with
  no document-level horizontal overflow, at both desktop and narrow widths, and at 200% zoom.
- RTL / logical-property layout: the wrapper and row use the same logical properties
  (`margin-inline-*`, `padding-inline-*`) the shadow sheet already uses, so no LTR-only assumption
  is newly introduced by the static markup.
- Forced-colors mode: the static form inherits the same `@media (forced-colors: active)` rules
  from the shared, unmodified `sk-action-row.css` — no new forced-colors rule is needed because the
  CSS file itself is unchanged; only the markup/wrapper contract is new.
- A row supplied with a trailing-controls region but zero actual interactive children inside it
  (consumer error): out of scope — the static form is not required to detect or recover from a
  consumer shipping an empty controls region, matching the shadow form's own behaviour (a shadow
  row's `.sk-action-row__controls` is unhidden purely by non-empty slot content; a static author
  who writes the wrapper with no real children has authored a defect in their own markup).
- A consumer who never links the documented `.sk-action-row-host` CSS block: out of scope for this
  mission to auto-detect (no gate exists until #310); the requirement is that the documentation
  make the failure mode and its cause unambiguous, per ADR-15.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Two-element wrapper markup, never single-element | As a library maintainer, I want the generated static form to be `.sk-action-row-host` > `.sk-action-row` so that the container-query mechanism ADR-15 measured actually works on a document page. | High | Open |
| FR-002 | Light-DOM anatomy classes | As a template author, I want BEM classes reproducing mark/title/reference/metadata/tags/supporting/controls so that a static row has the same scannable anatomy as the shadow row. | High | Open |
| FR-003 | Reflow parity, gated by a real comparison | As a library maintainer, I want a test that renders the static and shadow forms at the same widths (including the 400/401px boundary) and fails on any computed-style divergence, so that the reflow rule is provably equivalent, not merely visually similar. | High | Open |
| FR-004 | Wrapper carries the sheet's whole `:host` set, generically | As a library maintainer, I want the markup module and its docs to state "whatever `sk-action-row.css`'s `:host` declares" rather than a copied property list, so that the contract cannot silently drift from the sheet it describes. | High | Open |
| FR-005 | Wrapper CSS is documented, not shipped, until #309 | As a library maintainer, I want no `.sk-action-row-host` rule added to any package stylesheet in this mission, and the documented literal block to remain the single source a consumer (and this mission's own fixtures) copy from, so that #307 does not pre-empt #309's generator contract or create a second copy to drift. | High | Open |
| FR-006 | Trailing controls are a DOM sibling of the trigger, never a descendant | As an assistive-technology user, I want the row's link and its trailing controls to be independent interactive targets, so that no control is trapped inside a nested-interactive-content violation. | High | Open |
| FR-007 | Structural sibling-not-descendant test | As a library maintainer, I want an automated DOM query asserting `.sk-action-row__trigger .sk-action-row__controls` never matches, run against every generated static exemplar that has controls, so that a future edit cannot reintroduce nesting silently. | High | Open |
| FR-008 | Route-mode trigger in the static form | As a template author, I want the static form's trigger to render as a real `<a href>` when the row is a route (mirroring #272), so that Family 4's T1 workspace/invitation rows keep native link semantics with no JavaScript. | High | Open |
| FR-009 | Static (non-interactive) trigger when there is no route | As a template author, I want a `<div class="sk-action-row__trigger sk-action-row__trigger--static">` when the row has neither a route nor a script-driven activation, so that a purely informational row (T3 bearer-link display rows) renders correctly. | Medium | Open |
| FR-010 | No `<button>`-trigger equivalent in the static form | As a library maintainer, I want the static form to omit the shadow form's selectable-button trigger shape entirely (it requires `sk-action-row-activate`, which needs the custom element), so that the static contract does not promise activation behaviour it cannot deliver without JavaScript. | Medium | Open |
| FR-011 | `aria-current` parity, present-and-absent | As an assistive-technology user, I want `aria-current` to be present with the correct value on a current row and entirely absent (never `"false"`) on a non-current one, identically in both forms. | High | Open |
| FR-012 | Flush presentation parity, present-and-absent | As a template author, I want `.sk-action-row--flush` to produce the exact same computed surface/border/radius as the shadow form's flush presentation, and its absence to restore the bordered card surface, in both forms. | Medium | Open |
| FR-013 | Optional anatomy parts render only when supplied | As a template author, I want each optional part (mark/reference/tags/metadata/supporting) to be entirely absent from the DOM — never an empty wrapper — when I supply no content for it. | High | Open |
| FR-014 | Absent-trailing-controls renders no controls element | As a template author, I want a row with no trailing action to contain no `.sk-action-row__controls` element at all, so that no extra tab stop or layout reservation is created. | High | Open |
| FR-015 | Single-row fragment self-containment | As a template author (T4), I want one row's static markup to render correctly in isolation, with no dependency on sibling rows, a parent index, or any script, so that a server-rendered fragment swap of exactly one row works. | High | Open |
| FR-016 | Collection/flush composition unaffected | As a template author, I want a flush row inside a collection to present identically whether the collection is rendered as a batch or the row is later swapped in alone. | Medium | Open |
| FR-017 | Keyboard order and target size | As a keyboard user, I want the row anchor and each trailing control to be distinct, visually-ordered tab stops, each at least 44px, at both narrow and desktop widths, in the static form. | High | Open |
| FR-018 | `#283` boundary stated in prose | As a library maintainer, I want the spec (and ultimately the PR) to name the dividing line with `.sk-record-list` explicitly — row interactivity/trailing-action is `.sk-action-row`'s anatomy, aligned repeated-field factual ledgers with no interactivity are `.sk-record-list`'s — so the two contracts do not fork. | Medium | Open |
| FR-019 | No new user-visible literal | As a library maintainer, I want the static markup module to introduce no user-visible string that isn't a caller-supplied `content` parameter, matching the shadow element's existing slot-only render path, so that #286 is not regressed by this mission. | Medium | Open |
| FR-020 | Generated artifacts, not hand-authored HTML | As a library maintainer, I want `sk-action-row.html` and `packages/styles/src/action-row/index.ts` generated from the one authored `sk-action-row.markup.ts` module by `build-element-markup.mjs`, with `--check` verifying no drift, per ADR-10 §3. | High | Open |
| FR-021 | Long-content containment | As a template author, I want long unbroken identifiers/emails in title/reference/metadata to wrap or break within the row, at both widths and at 200% zoom, with no document-level horizontal scroll. | Medium | Open |
| FR-022 | Reduced motion preserved unchanged | As a user with `prefers-reduced-motion: reduce`, I want the row's existing background/border-color transition to not animate, exactly as the shared, unmodified stylesheet already guarantees for the shadow form — verified for the static form too since it adopts the same sheet. | Low | Open |
| FR-023 | Dark default and required `LightMode` story | As a design-system consumer, I want the static form's stories to default to dark and include a `LightMode` story using `class="sk-light"`, matching the recipe's required variant. | Medium | Open |
| FR-024 | Axe and visual regression coverage | As a library maintainer, I want the new static stories to run through the existing axe and visual-regression pipeline, and any CSS-affecting change to regenerate `SIZES.md` (measured after a real build, never from stale `dist/`). | Medium | Open |
| FR-025 | Ratchets and docs updated | As a library maintainer, I want `expected-docs.json`/parts/ratchets and the component's public docs updated to record the new markup module and the wrapper contract, including the "do not ship until #309" note, in the same PR. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Parity is a real comparison, not a visual approximation | The reflow-parity test (FR-003) compares computed CSS values (e.g. `flex-wrap`, `grid-template-areas`/`-columns`) between the static and shadow forms within one browser engine, at minimum at the exact 400px boundary and at 401px, and fails the build on any divergence. | Correctness | High | Open |
| NFR-002 | Structural gate cannot be satisfied by coincidence | The sibling-not-descendant assertion (FR-007) is a DOM query against generated output, not a hand-written example, so it re-runs against every future regeneration of the markup module. | Correctness | High | Open |
| NFR-003 | Interactive target size | Every interactive target (route anchor, each trailing control) measures ≥44×44px at both the narrow (≤400px) and desktop reflow states. | Accessibility | High | Open |
| NFR-004 | No document horizontal overflow | At 200% zoom and with the longest fixture content (long identifier/email), no document-level horizontal scrollbar appears; overflow is contained within the row. | Accessibility | Medium | Open |
| NFR-005 | Generated-artifact drift is zero | `node scripts/build-element-markup.mjs --check` and the other regeneration checks in the recipe's step 7 pass with no diff after the mission's commits. | Correctness | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Single Work Package, single PR | The entire mission ships as one bounded Work Package and one PR back into `train/elements-first`. If it cannot fit, the mission stops and reports rather than splitting. | Process | High | Open |
| C-002 | No `.sk-action-row-host` CSS shipped this mission | No file under `packages/styles/src/` gains a `.sk-action-row-host` rule; that generator output belongs to #309, gated by #310. | Technical | High | Open |
| C-003 | `sk-action-row.css` stays unmodified except its own future needs | This mission does not need to and must not edit `sk-action-row.css`'s existing rules (the header comment and reflow CSS already shipped via #301/#312); only the new markup module, generated artifacts, stories, tests, docs and ratchets are new. | Technical | Medium | Open |
| C-004 | No repo-wide #286 gate | This mission may reason about and record why no new literal is introduced, but must not build a general "no user-visible literal" enforcement mechanism — that is #286's own scope. | Technical | Medium | Open |
| C-005 | `.sk-record-list` (#283) contract is not touched or widened | No change to any `sk-record-list`-adjacent file; the boundary is stated in prose only. | Technical | Medium | Open |
| C-006 | Tokens-first, BEM, semantic surface/foreground pairs | All new/authored CSS-adjacent artifacts (if any) follow existing token and BEM conventions; `packages/react/src` remains generated-only and is never hand-edited. | Technical | Medium | Open |
| C-007 | Commit scope enum | Every commit uses the conventional scope enum this repo enforces (`styles`, `elements`, `docs`, `tokens`, etc.) — never `specs`, never `spec-kitty`, never `adr`. | Process | High | Open |

### Key Entities

- **`.sk-action-row-host`**: generated wrapper element; establishes the container query context; carries the sheet's whole `:host` declaration set; its CSS is a documented instruction, not shipped package output, until #309.
- **`.sk-action-row`**: the row root, unchanged shape; carries `--card`/`--flush` modifiers and `aria-current`.
- **Trigger** (route anchor or static div): the row's scannable primary surface; contains the optional anatomy parts.
- **`.sk-action-row__controls`**: sibling trailing-controls region; present only when the row has trailing controls.
- See `data-model.md` for the full structural relationships and invariants.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At the documented reflow boundary (400px and 401px row width), the static form's
  computed `flex-wrap` and trigger `grid-template-areas`/`grid-template-columns` are byte-identical
  (within one engine) to the shadow form's, for every generated exemplar.
- **SC-002**: Zero generated exemplars or stories have `.sk-action-row__trigger
  .sk-action-row__controls` matching in a DOM query.
- **SC-003**: 100% of the issue's required story/state matrix (one row and a collection; with/without
  mark; with/without metadata/tags/supporting; one control and several; no control; route mode with
  controls; `aria-current`; long identifiers/emails; narrow and desktop; forced colors; RTL; 200%
  zoom) exists as an authored Storybook story or test case.
- **SC-004**: `node scripts/build-element-markup.mjs --check` and the recipe's full gate list
  (adding-a-component.md step 7) pass with a clean `git status --porcelain` after `git add -A`.
- **SC-005**: The PR body states the `#283` boundary in the same prose committed to `spec.md`'s
  "Boundary with #283" note below, naming the screens/contracts on each side.
- **SC-006**: axe reports zero new violations across the new static-form stories, and visual
  regression baselines are taken from CI, not a local run.

## Boundary with #283

`.sk-record-list` (#283, OPEN, re-checked live at mission start — unmoved since 2026-09-08, zero
comments) owns **passive, aligned, repeated-field factual ledgers**: `<ol>/<li>` records, each with
its own labelled `<dl>/<dt>/<dd>` fields, reflowing into labelled narrow cards. Its own issue text
explicitly lists **"row link/action"** as a non-goal — there is no anchor, trigger or interactive
control anywhere in its contract.

`.sk-action-row`'s static form (this mission) owns **identity-plus-trailing-action rows**: a
primary scannable identity (mark/title/reference), secondary metadata/tags/supporting content, and
— critically — one or more independently interactive trailing controls, with the row body itself
optionally a real native link (#272).

**The seam**: the moment a row needs a trailing action or a native route, it is `.sk-action-row`'s
anatomy — never `.sk-record-list`'s, because `.sk-record-list` has disclaimed interactivity by
name. A row with several aligned fields, a status tag, and a trailing action (the shape that could
plausibly go either way) belongs to `.sk-action-row` on exactly that basis: it is the trailing
action, not the field count or alignment, that decides which component a row uses. This mission
does not grow `.sk-record-list`'s contract to cover trailing actions, and does not grow
`.sk-action-row`'s contract to cover aligned multi-field ledgers with no interactivity.

## Non-Goals

- Sorting, filtering, selection, pagination or virtualization.
- A new `sk-list-row` component or a data grid.
- Row activation semantics beyond what #272 already established (no new event, no new activation
  mode).
- Drag reordering, expandable rows, fetch/poll/fragment-swap machinery.
- The invitation, membership or bearer-link state machines (Team Kitty application concern).
- A static equivalent of the shadow form's selectable-`<button>` trigger (FR-010) — it requires a
  script listener the static form does not have.
- Shipping `.sk-action-row-host`'s CSS as package output (#309's scope) or an equality gate for it
  (#310's scope).
- Any change to `.sk-record-list` / #283.
- A repo-wide #286 "no user-visible literal" enforcement mechanism.
