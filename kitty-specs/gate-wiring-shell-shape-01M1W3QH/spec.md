# Mission Specification: Gate wiring shell shape, and four approved follow-ups

**Mission Branch**: `mission/gate-wiring-shell-shape`
**Created**: 2026-09-06
**Status**: Draft
**Input**: Close five operator-approved follow-up issues in `spec-kitty/spec-kitty-design`: #202, #205, #218, #201, #221.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A neutered merge gate is refused rather than certified (Priority: P1)

`scripts/check-gate-wiring.mjs` is the one gate that asserts every other gate can block a merge.
It reads the workflow's shell as **text**, at two independent levels, and both levels can be
defeated by an edit that still reads as correct to a diff reader:

- **#202, one level up** — the `gate` job's failure disjunction. Appending a conjunct
  (`[ "${{ needs.lint-code.result }}" != "success" ] && [ 1 = 2 ] || \`) or wrapping the whole
  disjunction in `if false && [ … ]` leaves the substring the assertion looks for intact while the
  disjunct can no longer fire. Fourteen gates reach the merge decision through that one clause.
- **#205, one level down** — `neutered()`'s enumerated swallow list. `|| /bin/true` and a
  `set +e` … `exit 0` body both make a registered gate unable to fail `lint-code`, and both are
  invisible to the enumeration.

They are independent: fixing either leaves the other open.

**Why this priority**: every other gate in this repository, including this script's own
self-registration and the two ADR-surface gates, rests on these two assertions being true.

**Independent Test**: for each hole, apply the defeat to a scratch copy of the workflow and run
`node scripts/check-gate-wiring.mjs` — before the fix it exits 0, after the fix it exits 1 with a
message naming that specific defeat; and the unmodified tree exits 0 both times.

**Acceptance Scenarios**:

1. **Given** the unmodified workflow, **When** the checker runs, **Then** it exits 0 — the fix
   introduces no false positive.
2. **Given** a conjunct appended to any strictly-required job's disjunct, **When** the checker
   runs, **Then** it exits 1 naming that job's clause.
3. **Given** the disjunction wrapped in `if false && [ … ]`, **When** the checker runs, **Then**
   it exits 1.
4. **Given** the gate's `exit 1` weakened to `exit 0`, **When** the checker runs, **Then** it
   exits 1.
5. **Given** a registered gate's step body ending `|| /bin/true`, **When** the checker runs,
   **Then** it exits 1 naming that step.
6. **Given** a registered gate's step body wrapped in `set +e` … `exit 0`, **When** the checker
   runs, **Then** it exits 1 naming that step.
7. **Given** an unrecognised swallow spelling not enumerated anywhere, **When** the checker runs,
   **Then** it exits 1 — the rule fails closed rather than passing what it does not recognise.

---

### User Story 2 - sk-card's forced-colors claim is asserted rather than documented (Priority: P2)

`sk-card.stories.ts`'s `ForcedColors` story renders `allTones()` — byte-identical to
`AllStatuses` — emulates no media feature, and is driven by no test. The
`@media (forced-colors: active)` block in `sk-card.css` restates what the UA remap already
produces and a property forced colors never touches, so it is inert. What actually
differentiates a status card in forced colors is the widened inline-start border, set outside
the media query.

**Why this priority**: the axis #177 shipped rests on "the edge survives when the tone does not",
and that claim is currently unmade.

**Independent Test**: a Playwright case in `apps/storybook/src/tests/elements-load.spec.ts`
emulating `forcedColors: 'active'` in both colour schemes, asserting the status card's
inline-start edge is wider than the base card's and that every tone shares one ground.

**Acceptance Scenarios**:

1. **Given** forced colors active in either colour scheme, **When** the ForcedColors story loads,
   **Then** every status card's inline-start border is strictly wider than the base card's.
2. **Given** forced colors actually engaged in the browser under test, **When** the six tone cards
   are measured, **Then** their backgrounds have collapsed to a single ground.
3. **Given** the story, **When** it is compared to `AllStatuses`, **Then** its render differs —
   it contains the base card the comparison is against.
4. **Given** the story set, **When** `expected-stories.json` is compared, **Then** it is unchanged.

---

### User Story 3 - The last hand-written ADR enumeration goes (Priority: P3)

`docs/architecture/sad-lite.md:10` carries `| **Related ADRs** | ADR-001 through ADR-005 |`. The
same document's body cites ADR-6, ADR-7 and ADR-8 through ADR-13, so the range is not a scoped
statement about the document's v1.0 — it is a stale enumeration the document has already
outgrown.

**Why this priority**: documentation correctness; the shape is the one #193/#197/#199 removed
elsewhere, and this is the fifth and last instance.

**Independent Test**: no ADR range expression remains in `sad-lite.md`'s header, and the row
points at the table `scripts/check-adr-index.mjs` holds to the directory in both directions.

**Acceptance Scenarios**:

1. **Given** `sad-lite.md`, **When** the header block is read, **Then** the Related ADRs row names
   no range and links the gated index.

---

### User Story 4 - A mission's issue matrix carries truthful rows (Priority: P3)

`kitty-specs/card-status-tone-axis-01M1VJNY/issue-matrix.json` shipped with both rows at
`"verdict": "unknown"` and `"title": "<fill at WP-implementation time>"`, and with a `#146` row
scraped from a prose reference in `spec.md` rather than from a delivery target.

**Why this priority**: process artefact, no code impact, but a file nothing reads and nothing
checks will always look like this.

**Independent Test**: the file carries a filled row for the mission's own issue with a verdict
drawn from the CLI's enum, and no row asserting a verdict for an issue the mission did not
deliver.

**Acceptance Scenarios**:

1. **Given** the file, **When** it is read, **Then** no `<fill at WP-implementation time>`
   placeholder remains.
2. **Given** the file, **When** the rows are read, **Then** every row is an issue that mission
   delivered against.

---

### Edge Cases

- **The checker must not red the tree it ships with.** The `lint-code` step running
  `check-manifest-content.mjs` legitimately contains `git diff --exit-code … || { echo …; exit 1; }`
  — a fallback that *strengthens* the step. A blanket `||` ban would red a healthy tree; the rule
  must recognise a fallback whose branch exits non-zero and refuse every other form.
- **The gate's own step legitimately contains `||`** — it is a multi-line `[ … ] || [ … ]`
  disjunction. The shell-shape rule must read that as a condition, not a fallback.
- **A shell parser is out of scope.** Where a construct cannot be recognised structurally, the
  rule fails closed (reports a problem) rather than passing it.
- **Forced-colors emulation is not uniform across browsers.** The tone-collapse assertion must
  not become a green line over zero inputs: the test asserts a floor — the feature must engage in
  Chromium — and only then asserts the collapse.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Strict gate clauses are asserted by shape | As a maintainer, I want the gate's failure disjunction parsed into top-level disjuncts and each required clause asserted to be an unguarded, unconjoined test, so that appending a conjunct or wrapping the disjunction cannot leave the checker green (#202). | High | Open |
| FR-002 | The gate's failure branch must exit non-zero | As a maintainer, I want the disjunction's `then` branch asserted to exit non-zero, so that a weakened `exit 0` is refused (#202). | High | Open |
| FR-003 | Step neutering is an allow-list, not an enumeration | As a maintainer, I want `neutered()` to refuse any registered gate step whose body contains `set +e`, a trailing `exit 0`, or a `||` fallback that is not a non-zero-exit branch, so that unrecognised swallow spellings fail closed (#205). | High | Open |
| FR-004 | sk-card's forced-colors claim is asserted | As a consumer, I want a Playwright case that emulates forced colors in both colour schemes and asserts the widened inline-start edge survives while the tone surfaces collapse, so that the axis's forced-colors claim is evidence rather than a docstring (#218). | Medium | Open |
| FR-005 | sk-card's forced-colors CSS states only what it does | As a maintainer, I want the inert `@media (forced-colors: active)` block resolved — either made load-bearing or removed with the real mechanism documented — so that no declaration claims work it does not do (#218). | Medium | Open |
| FR-006 | sad-lite points at the gated ADR index | As a reader, I want `sad-lite.md`'s Related ADRs row to point at the table `check-adr-index.mjs` gates rather than enumerate a range, so that it cannot go stale silently (#201). | Low | Open |
| FR-007 | The card mission's issue matrix is truthful | As a reviewer, I want `card-status-tone-axis-01M1VJNY/issue-matrix.json` filled for the issue that mission delivered, and free of a row for an issue it only referenced, so that no row asserts an untrue verdict (#221). | Low | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Every hole is demonstrated, not asserted | Each of #202's and #205's defeats is reproduced against the pre-fix checker (exit 0 recorded verbatim), then shown to exit 1 with a message naming it after the fix. | Verification | High | Open |
| NFR-002 | No false positive on the shipped tree | `node scripts/check-gate-wiring.mjs` exits 0 on the unmodified workflow before and after the change. | Reliability | High | Open |
| NFR-003 | No forbidden surface is touched | The mission's diff contains no change to `packages/elements/src/notice/**`, `packages/styles/src/notice/**`, `expected-stories.json`, or the token catalogue. | Process | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No shell parser | The fix asserts structure over joined logical lines; it does not vendor or implement a POSIX shell grammar. | Technical | High | Open |
| C-002 | Fail closed | Any construct the shape rules cannot recognise is reported as a problem rather than accepted. | Technical | High | Open |
| C-003 | Suite budget untouched | The suite-time ceiling stays at 881.9s; #225 carries the ruling that funds the filtered-suite redesign instead. | Process | High | Open |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four #202 defeats (appended conjunct on `test`, on `release-gate`, on `lint-code`; `if false &&` wrap) exit 1 after the fix and exited 0 before it.
- **SC-002**: Both #205 defeats (`|| /bin/true`, `set +e` … `exit 0`) exit 1 after the fix and exited 0 before it.
- **SC-003**: `node scripts/check-gate-wiring.mjs` exits 0 on the unmodified tree, and the whole `lint-code` gate set stays green.
- **SC-004**: A Playwright case drives the `ForcedColors` story under `forcedColors: 'active'` in both colour schemes and fails when the status edge stops being wider than the base card's.
- **SC-005**: `docs/architecture/sad-lite.md` contains no ADR range expression.
- **SC-006**: `card-status-tone-axis-01M1VJNY/issue-matrix.json` contains no placeholder string and no row for an issue that mission did not deliver.
