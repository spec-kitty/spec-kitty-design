# Mission Specification: component-migration-batch-layout

**Mission Branch**: `mission/component-migration-batch-layout`
**Created**: 2026-09-04
**Status**: Draft
**Input**: Issue #77 (M11), part of epic #66

## Scope, and what is already done

The issue names three components: `grid`, `section-banner`, `site-footer`. **Two are already
merged** — `grid` and `section-banner` landed in #134. **`site-footer` is the whole remaining
scope**, and it is the last unmigrated component in the catalogue apart from `form-field`, which
#141 owns.

The issue's **parallelism condition** is settled and no longer constrains this mission: generated
artefacts *are* committed here, so the batches serialise, and #78 and #79 have both merged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The footer works as a custom element (Priority: P1)

A consumer drops `<sk-site-footer>` on a page with a script tag and gets a themed footer whose
brand, link groups and legal line are their own content, not Spec Kitty's.

**Why this priority**: it is the mission. Every other story is a property of this one.

**Independent Test**: mount the element, assert the shadow root renders the layout regions and
that slotted content reaches them; assert the class list is identical to the static form's.

### User Story 2 - The static form is generated, not hand-written (Priority: P1)

A no-JavaScript consumer copies `sk-site-footer.html` and gets the same markup the element
renders, generated from one authored source with a drift gate.

**Why this priority**: ADR-10 §3, and this component is the repo's **only** hand-written
`packages/styles/src/<c>/index.ts`. Every other component's is generated.

**Independent Test**: `build-element-markup.mjs --check` is green, and the element and the static
form produce the same class list.

### User Story 3 - The light theme is real (Priority: P2)

The `LightMode` story renders the light palette, and the footer's inks meet WCAG AA on it.

**Why this priority**: the story currently wraps in `data-theme="light"`, which activates nothing
(#93). Retiring that wrapper is what exposed four failing pill-tag variants and a 1.73:1
check-bullet tick in the two preceding batches, so failures here should be **expected, not
assumed away**.

**Independent Test**: the inert-wrapper ratchet drops from 4 to 3; a both-themes contrast arm
asserts every ink the component sets, and proves the two themes resolved different surfaces.

### Edge Cases

- **The year.** `index.ts` computes `new Date().getFullYear()` at module load. Once the barrel is
  generated, its content changes on 1 January with no code change, so the drift gate would go red
  for everyone. ADR-11 item 9.
- **The logo path.** The published markup carries `src="../../packages/tokens/assets/logo.webp"`,
  which is repo-relative; a consumer copying it gets a broken image.
- **Empty link groups.** A consumer with one nav column must not get an empty second `<nav>` with
  a dangling `aria-label`.
- **Slotted state rules.** `::slotted()` matches only directly assigned children, and a
  pseudo-class must sit *inside* it — `::slotted(x):hover` does not parse and takes its whole
  comma list with it (#143).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `<sk-site-footer>` exists, registers through the guarded `define()` (ADR-10 §5), and
  reaches **both** distribution entries (ADR-10 §2).
- **FR-002**: A `sk-site-footer.markup.ts` is the single authored markup source; the static
  `.html` and the styles-layer `index.ts` are **generated** from it. The element renders its class
  list from that module — not from re-typed literals (ADR-8 criterion 3; the trap #143 fell into).
- **FR-003**: `.sk-footer-link` is renamed `.sk-site-footer__link`. 20 occurrences. This is a
  precondition, not a tidy-up: `check-adopted-css-boundaries` rejects a class not prefixed with
  its component's tag name, so the adopted sheet cannot pass otherwise.
- **FR-004**: The copyright year is **not** read from the clock at module load. It is a property
  with an explicit default, or slotted content.
- **FR-005**: Site-specific content — tagline, link labels, legal text, brand mark — is slotted or
  a property. The component owns layout, theming and the divider; not the words.
- **FR-006**: The `LightMode` story uses `class="sk-light"`, not `data-theme="light"`.
- **FR-007**: Every declared `::part()` is targetable from outside and recorded in
  `expected-parts.json` with a test that targets it.

### Non-Functional Requirements

- **NFR-001**: Zero WCAG 2.1 AA violations across all stories, in both themes.
- **NFR-002**: Token-only CSS (SK-D01). No hardcoded colour, spacing or radius values.
- **NFR-003**: No rule in the adopted sheet reaches outside the element root (ADR-9
  Confirmation #1).

### Constraints

- **C-001**: A `*.markup.ts` is a **leaf module** — the generator evaluates it from a `data:` URL,
  which has no module base, so it cannot import a helper.
- **C-002**: Caller-supplied values interpolated into attribute position must be escaped; into
  text position, neutralised. `content`-style slots are deliberately raw (#163).
- **C-003**: The mission owns exactly `site-footer`. No neighbours.

### Key Entities

- **Link group** — a heading plus a list of links, authored **entirely by the consumer** and
  slotted. The component renders only the grid that lays the columns out. An earlier revision of
  this line said "the component renders the group", which was true of the design considered
  during planning and false of the one that shipped — two lenses caught the entity model never
  being reconciled when the design moved to full slotting.
- **Brand mark** — consumer-supplied and slotted. The image is gone entirely: the markup this
  replaces carried a repo-relative `src` no consumer could resolve.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `build-element-markup.mjs --check` green — the static form is generated, and
  regenerating twice is a no-op (ADR-11 item 9).
- **SC-002**: Zero occurrences of `.sk-footer-link` outside frozen history.
- **SC-003**: `expected-inert-theme-wrappers.json` drops 4 → 3, and the named list no longer
  contains site-footer.
- **SC-004**: Every ink the component sets meets AA in **both** themes, asserted by a fixture that
  proves the two themes resolved different surfaces — not only by axe, which cannot see a
  `:hover` state and drops symbol-glyph text as an incomplete (#151).
- **SC-005**: Generating on 1 January produces byte-identical output to any other day.
- **SC-006**: All CI gates green on the PR head, with the four-lens gate's evidence posted.

## Deferred questions

- **Whether the brand mark ships at all.** A consumer's footer will not carry the Spec Kitty logo,
  so a slot is probably right — but that removes an asset reference the demo pages use. Decided
  during plan, recorded in decisions/.
