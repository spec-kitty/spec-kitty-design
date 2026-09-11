# Mission Specification: Button Tone Record and Commit Exemptions

**Mission Branch**: `mission/button-tone-record-and-commit-exemptions`
**Created**: 2026-09-11
**Status**: Draft
**Input**: GitHub issues #420 ("spec-kitty's own tracer and retrospective auto-commits fail this
repo's scope-enum") and #403 ("sk-button's tone enum flattens a tone x intensity product; record
what a danger-primary would mean") in `spec-kitty/spec-kitty-design`.

Neither issue changes rendered output. #420 closes a real CI-failure gap in commit governance;
#403 asks for a written design-decision record, not a code change.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - spec-kitty's own auto-commits pass this repo's commitlint (Priority: P1)

A mission that runs `spec-kitty agent tracer-append` (via `append_tracer_finding`) or
`spec-kitty retrospect create` / `spec-kitty retrospect backfill` on a branch it later pushes for
a PR must not have `[ENFORCED] commitlint (FR-020)` red on commits the CLI itself authored. Today
three exact CLI-emitted message shapes are neither in `scope-enum` (`tracer`, `retrospective` are
absent) nor matched by any `SPEC_KITTY_AUTO_COMMIT_PATTERNS` entry, so they fail `lint-code` and
read as a contributor mistake rather than a tool defect.

**Why this priority**: This is the actual CI-breaking defect #420 reports; #319's post-merge
review already hit it, only escaping detection because that branch was never pushed.

**Independent Test**: Run `npx commitlint` (via `scripts/check-commitlint-config.mjs`, this
repo's self-test harness for the config) against each of the three real CLI message strings and
confirm all three are ignored and pass; run it against near-miss variants of each and confirm
they are NOT ignored and fail as ordinary conventional-commit violations.

**Acceptance Scenarios**:

1. **Given** the exact commit message `chore(tracer): append tooling-friction finding for
   <mission-slug>` (and the same for `approach` and `design-decisions`, the only three categories
   `TRACER_CATEGORIES` in `tracer_writer.py` defines), **When** commitlint evaluates it against
   this repo's config, **Then** the message is ignored by `SPEC_KITTY_AUTO_COMMIT_PATTERNS` and
   would pass if evaluated as a normal commit.
2. **Given** the exact commit message `chore(retrospective): author retrospective for
   <mission-slug>`, **When** commitlint evaluates it, **Then** it is ignored and passes.
3. **Given** the exact commit message `chore(retrospective): backfill <N> retrospective records`
   (N a positive integer), **When** commitlint evaluates it, **Then** it is ignored and passes.
4. **Given** a near-miss of any of the three shapes — a `category` value that is not one of the
   three real ones, or a `mission_slug` that is not a real Spec Kitty slug shape, or a truncated
   prefix — **When** commitlint evaluates it, **Then** the message is NOT ignored and fails
   ordinary conventional-commit validation (the same way the file's existing near-miss patterns
   are bounded).
5. **Given** `scripts/check-commitlint-config.mjs`, **When** it is run after this mission's
   change, **Then** its `generatedMessages` array includes the three real message shapes
   (asserted ignored AND valid) and its `nearMisses` array includes at least one bounded
   near-miss per new pattern (asserted NOT ignored), and the script exits 0.

---

### User Story 2 - sk-button's tone × intensity flattening is a recorded design decision (Priority: P2)

`BUTTON_VARIANTS` in `packages/elements/src/button/sk-button.markup.ts:20-25` holds `primary`,
`secondary`, `ghost`, `danger-secondary` as one flat string enum, crossing a *tone* axis (danger)
with an *intensity* axis (secondary) with no `danger-primary` sibling and nothing in the type
system or docs naming the two axes. #403 asks for a recorded decision — not a refactor — stating
either that the flattened enum is deliberate (and its ceiling), or what the migration to a split
axis would look like if `danger-primary` is ever needed, ideally both.

**Why this priority**: No code changes ship on this story; it is a documentation deliverable that
prevents the question from evaporating a third time (it was raised at the #341 pre-merge gate in
both passes and dropped without disposition both times).

**Independent Test**: The record exists at the location and in the format this repository already
uses for this kind of decision (an ADR under `docs/architecture/decisions/`, indexed in
`docs/architecture/README.md`'s `## Decisions (ADRs)` table), `node scripts/check-adr-index.mjs`
passes with the new record indexed, and the record states the codegen-source fact and references
#348.

**Acceptance Scenarios**:

1. **Given** the new ADR record, **When** a reader consults it, **Then** it states plainly that
   `BUTTON_VARIANTS` is a codegen source (`scripts/build-element-markup.mjs` derives one static
   export per entry, feeding `custom-elements.json` and the generated React wrappers), so any
   future axis split is a generated-artifact change with real blast radius, not a local edit.
2. **Given** the same record, **When** a reader looks for the ceiling of the current shape or the
   migration shape for a hypothetical `danger-primary`, **Then** at least one of the two is
   stated explicitly, grounded in the actual `BUTTON_VARIANTS` map and `sk-button.css` tone rules
   read from source (not invented).
3. **Given** the same record, **When** a reader looks for related open issues, **Then** #348 (the
   busy cue hardcoded to `.sk-button--primary`, so a fifth tone silently gets no busy-cue rule) is
   referenced as the same "tone set is not first-class" defect family, without being fixed here.
4. **Given** `docs/architecture/README.md`'s ADR table, **When** `node scripts/check-adr-index.mjs`
   runs, **Then** it passes, confirming the new record is indexed with a Status matching its own
   H1 record.

### Edge Cases

- A tracer or retrospective message whose `category` / count looks plausible but is not one the
  CLI can actually emit (e.g. a category outside `TRACER_CATEGORIES`, or non-numeric backfill
  count) must NOT be exempted — an unanchored or overly wide pattern would blanket-exempt an
  unrelated human commit that happens to start the same way.
- A message with a trailing body (multi-line commit) must still match, since commitlint's ignore
  predicates test the full message and the file's existing patterns anchor to end-of-LINE for
  exactly this reason.
- The ADR record must not assert a decision the operator has not made (no "Accepted" status) —
  #403 asks for the question and its ceiling/migration shape to be written down, not ratified.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Exempt the three real spec-kitty tracer/retrospective auto-commit shapes | As a mission agent, I want the CLI's own tracer-append and retrospect auto-commits to pass this repo's commitlint so that a PR is not red by a tool defect I did not author. | High | Open |
| FR-002 | Anchor exemptions to the real `category`/count vocabulary, not a wide character class | As a maintainer of `commitlint.config.cjs`, I want each new pattern closed over the real enumerated values so that an unrelated commit cannot slip through the same exemption. | High | Open |
| FR-003 | Extend `scripts/check-commitlint-config.mjs` with the three real messages in `generatedMessages` | As a maintainer, I want the config's self-test harness to assert the three real CLI messages are ignored and pass so that a future edit cannot silently regress the exemption. | High | Open |
| FR-004 | Extend `scripts/check-commitlint-config.mjs` with bounded near-misses in `nearMisses` | As a maintainer, I want a near-miss per new pattern asserted NOT ignored so that the exemption cannot silently widen into a blanket exemption for its scope. | High | Open |
| FR-005 | Record the sk-button tone × intensity flattening as an ADR in the established location/format | As a future contributor reading `BUTTON_VARIANTS`, I want a written record of whether the flat enum is deliberate and what its ceiling or migration shape is so that the question is answered once rather than re-raised at every pre-merge gate. | Medium | Open |
| FR-006 | State the codegen-source fact in the record | As a future contributor considering an axis split, I want the record to say plainly that `BUTTON_VARIANTS` feeds `custom-elements.json` and the generated React wrappers so that I understand the real blast radius before proposing a change. | Medium | Open |
| FR-007 | Reference #348 in the record without fixing it | As a reader of the ADR, I want the busy-cue hardcoding issue named as the same defect family so that the two records reinforce each other without conflating scope. | Low | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No rendered-output change | Neither #420's nor #403's work changes any built CSS, markup, or JS output; `npm run quality:all`'s build/test steps must show zero diff in generated artifacts attributable to this mission. | Reliability | High | Open |
| NFR-002 | Every added commitlint pattern is red-first proven | Each new pattern's near-miss case must be run and observed failing before the pattern is finalized, not merely reasoned about. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No new commitlint scope-enum entries | `tracer` and `retrospective` are exempted via `SPEC_KITTY_AUTO_COMMIT_PATTERNS` (ignore predicates), never added to `scope-enum`, matching this file's established convention for CLI-authored, non-conventional commits. | Technical | High | Open |
| C-002 | ADR record only, no code refactor for #403 | #403 is explicitly a "record the decision" issue; `BUTTON_VARIANTS`, `sk-button.css`, and the generator are read for grounding but not modified. | Technical | High | Open |
| C-003 | One bounded Work Package | Both issues are implemented and recorded in a single WP per the mission brief's lifecycle instruction. | Business | Medium | Open |

### Key Entities *(include if feature involves data)*

- **SPEC_KITTY_AUTO_COMMIT_PATTERNS entry**: An anchored regex predicate in
  `commitlint.config.cjs` that exempts one CLI-authored message shape from all commitlint rules;
  closed over a fixed prefix, a bounded vocabulary (never `\S+` or an open character class), and
  anchored to end-of-line.
- **ADR record**: A markdown file under `docs/architecture/decisions/`, indexed by row in
  `docs/architecture/README.md`'s `## Decisions (ADRs)` table with a Status the gate
  (`scripts/check-adr-index.mjs`) verifies against the record's own Status field.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All three real spec-kitty tracer/retrospective auto-commit message shapes are
  ignored by `commitlint.config.cjs` and pass commitlint, proven by running
  `node scripts/check-commitlint-config.mjs` (exit 0) after the change.
- **SC-002**: At least one bounded near-miss per new pattern is proven, by the same script run,
  to NOT be ignored and to fail commitlint.
- **SC-003**: `node scripts/check-adr-index.mjs` passes with the new ADR record indexed and its
  Status matching.
- **SC-004**: `npm run quality:lint` (or `npm run quality:all`) passes after the change with no
  new violations introduced by this mission's edits.
