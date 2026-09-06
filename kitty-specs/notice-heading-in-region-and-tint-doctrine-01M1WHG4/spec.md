# Mission Specification: The notice heading is announced, and the tint doctrine stops forbidding what the palette does

**Mission Branch**: `mission/notice-heading-in-region-and-tint-doctrine`
**Created**: 2026-09-07
**Status**: Draft
**Input**: Operator rulings on #228 (2026-09-07) and #217 (2026-09-06), quoted on those issues.

## Context

Two ratified operator decisions, each already argued and closed on its issue. This mission carries
neither decision — it executes both, and files anything a decision did not settle rather than
deciding it here.

**#228.** `sk-notice` renders `<div part="heading">` as a **sibling before** the `keyed()` body that
carries the live-region role. A consumer following the element's own `Dismissible` story —
`<h3 slot="heading">Deploy failed</h3>` plus `message="The deploy failed on three of twelve
targets."` — gets the detail announced and the headline silent. The operator ruled: **move the
heading inside the live region**; the whole notice is announced, heading first.

**#217.** The operator ratified the rose tint literals (`--sk-surface-tint-rose` dark `#2B1515` /
light `#F8E5E5`, `--sk-on-tint-rose` light `#6B2424`). What remains is two sentences of doctrine
that forbid, or misdescribe, what the shipped token layer now does.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A screen-reader user hears the headline, not only the detail (Priority: P1)

A dashboard renders `<sk-notice tone="danger" announce="assertive" message="The deploy failed on
three of twelve targets."><h3 slot="heading">Deploy failed</h3></sk-notice>`. Today the user hears
"The deploy failed on three of twelve targets." and never hears "Deploy failed" — the headline sits
outside the live region. After this mission the region is announced whole, heading first.

**Why this priority**: it is the defect the ruling closes, and it is the only user-visible
behavioural change in the mission.

**Independent Test**: mount a notice with an announcing politeness, a `message`, and a slotted
heading; flatten the live region's assigned subtree and assert both strings are inside it. The red,
against today's template, is a heading present in the element and absent from the region.

**Acceptance Scenarios**:

1. **Given** `announce="assertive"`, a `message`, and a slotted `<h3 slot="heading">`, **When** the
   element settles, **Then** `[part="heading"]` is a descendant of the `[role="alert"]` node and the
   region's flattened text carries the heading text before the message text.
2. **Given** `announce="off"` and any tone, **When** the element settles, **Then** the shadow root
   contains no `[role]` and no `[aria-live]` anywhere — moving the heading must not create a live
   region where there was none.
3. **Given** a notice that is already announcing, **When** only `message` changes, **Then** the node
   carrying the role is the same node it was, and it still contains the heading.

---

### User Story 2 - A consumer upgrading is told what changed (Priority: P1)

The change alters what **every existing consumer** hears. A consumer who deliberately put a headline
outside the announcement — because the old `@slot heading` docblock told them it was outside — needs
to be told, in the changelog, that the headline is now announced and how to keep it silent.

**Why this priority**: the ruling names it explicitly: "it needs a changelog entry and a migration
line, not a silent template edit."

**Independent Test**: `docs/design-system/changelog.md` carries an entry under `[Unreleased]` naming
the behaviour change and the migration; the element's own `@slot heading` JSDoc no longer says the
heading is outside the region.

**Acceptance Scenarios**:

1. **Given** the changelog, **When** a consumer reads `[Unreleased]`, **Then** they find the notice
   announcement change and a migration line telling them what to do if they want the old silence.
2. **Given** the generated manifest and React wrappers, **When** the gates run, **Then** they are
   current with the amended JSDoc rather than drifted from it.

---

### User Story 3 - A future mission can tell which side of the palette line it is on (Priority: P1)

`docs/contributing/adding-a-token.md` forbids a mission from adding new colour values. The shipped
token layer contains rose literals that the operator has ratified. A mission reading the doctrine
today either believes it must not do what #177 did, or ignores the doctrine. The amended wording has
to be applicable without asking: **completing an existing family from an existing hue** is
permitted; **introducing a new hue** is not.

**Why this priority**: the ruling names the two sentences and the fact they must turn on.

**Independent Test**: a reader given a concrete case (say, "I need a teal status surface") can reach
a yes/no from the written test alone, with no judgement call left over.

**Acceptance Scenarios**:

1. **Given** `docs/contributing/adding-a-token.md`, **When** a mission needs a surface for a hue
   already in `--sk-color-*`, **Then** the doctrine permits deriving it and names the derivation
   rule and the evidence to record.
2. **Given** the same doctrine, **When** a mission needs a hue not in `--sk-color-*`, **Then** it is
   still out of the mission's hands.
3. **Given** `docs/design-system/using-tokens.md`, **When** a consumer reads the status-tone section,
   **Then** it no longer claims every status token resolves to a token above it, because
   `--sk-status-danger` resolves to `--sk-surface-tint-rose`, which is a literal.

---

### Edge Cases

- **`announce="off"`** — the region node does not exist at all, so "inside the region" has no
  referent. The heading must still render, still be in `[part="content"]`, and the element must
  still expose no `[role]` and no `[aria-live]`.
- **No heading slotted** — the heading box is empty. It must not introduce or remove vertical space
  relative to today's render, and it must not make an otherwise-empty live region non-empty.
- **Heading slotted, message assigned later** — the region is now born holding the heading rather
  than empty. This is a real widening of the `keyed()` caveat's hazard and is recorded, not fixed;
  the element cannot defer its first paint without a timer.
- **Politeness change with a heading present** — `keyed()` discards the node and builds a new one,
  which is now born holding heading *and* message.
- **`role="alert"` / `role="status"` are implicitly `aria-atomic="true"`** — so every subsequent
  re-announcement now re-reads the heading as well as the message. That repetition is a cost of the
  ruling and belongs in the migration line.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Heading inside the region | As a screen-reader user, I want a slotted heading announced with the message so that I hear the headline of the notice, not only its detail. | High | Open |
| FR-002 | Existing region guarantees survive | As a maintainer, I want the message-reaches-the-region and node-identity assertions to still hold with a heading in scope, so that the move does not trade one guarantee for another. | High | Open |
| FR-003 | A red-first test for the defect | As a maintainer, I want a test whose red is *a heading present and not announced*, so that the defect this ruling closes cannot return. | High | Open |
| FR-004 | `announce="off"` stays silent | As a consumer, I want `announce="off"` to yield no `[role]` and no `[aria-live]` anywhere, so that a silent notice stays silent. | High | Open |
| FR-005 | Documented slot contract matches | As a consumer, I want the `@slot heading` JSDoc, the class docblock and the stories to describe the new behaviour, so that the published docs are not the old contract. | High | Open |
| FR-006 | Changelog and migration line | As an upgrading consumer, I want the change and its migration recorded in the changelog, so that a behaviour change is not a silent template edit. | High | Open |
| FR-007 | `keyed()` caveat judged | As a maintainer, I want the `keyed()` caveat re-read against the new shape and widened if it is now too narrow, so that the recorded hazard matches the code. | High | Open |
| FR-008 | Palette doctrine distinguishes family from hue | As a future mission, I want `adding-a-token.md` to separate completing a family from introducing a hue, so that I can act without asking who owns the palette. | High | Open |
| FR-009 | The rule has an applicable test | As a future mission, I want a written test with a yes/no outcome, so that the distinction is checkable rather than editorial. | High | Open |
| FR-010 | Status-alias claim corrected | As a consumer, I want `using-tokens.md` to stop claiming every status token resolves to a token above, so that the doc matches the token file. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No visual change | The rendered geometry of `sk-notice` is unchanged in every story, with and without a heading: the heading→body and body→actions spacing stay `--sk-space-2`. Verified by construction (the gap the content grid supplied is replaced by an equal margin on the same box) and by the visual-regression gate. | Reliability | High | Open |
| NFR-002 | No new budget headroom consumed | Neither `ceilingSeconds` nor `selftestCeilingSeconds` in `suite-budget.json` is raised. | Performance | High | Open |
| NFR-003 | Generated artefacts current | The manifest, the React wrappers, the generated CSS/markup modules and `SIZES.md` are regenerated cache-free from a real build and committed, so no `--check` gate reds. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Two ratified decisions only | Nothing architectural is decided here. A genuine fork is filed as an issue with its measurement attached, not resolved in the diff. | Technical | High | Open |
| C-002 | Tone vocabulary untouched | The tone vocabulary, the `--sk-status-*` values and `sk-status-indicator` are not changed. | Technical | High | Open |
| C-003 | Concurrent-mission surfaces are off limits | `docs/architecture/decisions/`, `behaviours.json`, `mutations.json`, `scripts/suite-selftest.mjs`, `fixtures/*/src/config-contract.test.ts` and `suite-budget.json` belong to a concurrently running mission and are not touched. | Technical | High | Open |
| C-004 | No new behaviour id | ADR-11's applicable id set is asserted exactly by `tests/node/config-contract.test.ts`, so the new test carries no `[SC-NNN]` marker — the same boundary the four existing announcement-contract tests sit at. | Technical | High | Open |
| C-005 | PR base is the train | The PR targets `train/elements-first`. Any other base runs zero gates. | Technical | High | Open |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With `announce` on and a slotted heading, `[part="heading"]` is a descendant of the
  node carrying `role="alert"`/`role="status"`, and the region's flattened text contains the heading
  text followed by the message text. Against `train/elements-first@7e181a9` this assertion is red,
  and its red names a heading that is present and not announced.
- **SC-002**: All four pre-existing announcement-contract assertions — message reaches the region;
  node identity across a message change, a tone change and both; a politeness change builds a new
  node; `announce="off"` renders no region — still pass unchanged, now with a heading in scope.
- **SC-003**: For all six tones with `announce="off"`, the shadow root contains zero elements
  matching `[role]` and zero matching `[aria-live]`.
- **SC-004**: `docs/design-system/changelog.md` `[Unreleased]` carries the behaviour change and a
  migration line; the `@slot heading` JSDoc in `packages/elements/src/notice/sk-notice.ts` no longer
  states the heading is outside the region; the manifest and React wrappers are regenerated to match.
- **SC-005**: The `keyed()` caveat is re-read against the new shape, a written conclusion is recorded
  in the file, and the mission report states whether it was widened and why.
- **SC-006**: `docs/contributing/adding-a-token.md` distinguishes completing an existing family from
  an existing hue (permitted) from introducing a new hue (not the mission's), and carries a test a
  reader can apply to their own case without asking.
- **SC-007**: `docs/design-system/using-tokens.md` no longer claims every `--sk-status-*` token
  resolves to a token above it, and says which of them resolve to literals.
- **SC-008**: The token facts the doctrine turns on are verified in-tree before being written down:
  `--sk-color-blue-bg`/`-purple-bg`/`-green-bg` exist and are byte-identical to
  `--sk-surface-tint-sky`/`-lilac`/`-mint`; `--sk-color-red` is a foreground; no red or danger
  surface token exists.
- **SC-009**: CI on the PR against `train/elements-first` is green, with `gate` passing.
