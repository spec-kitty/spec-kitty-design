# Mission Specification: Form Input Contract Doc Refresh
<!-- form-input-contract-doc-refresh-01M1T6VH — closes GitHub issue #191 -->

**Mission Branch**: `mission/form-input-contract-doc-refresh`
**Created**: 2026-09-06
**Status**: Draft
**Input**: GitHub issue #191 (spec-kitty/spec-kitty-design) — "sk-form-input.contract.md's React
wrapper section describes the superseded #180 gate and a falsified CASE-ONLY claim"

## Adaptation note (non-software-dev shape)

This mission is a documentation-accuracy correction, not a feature build. It ships no code, no
tests, and no new behaviour — the underlying component (`sk-form-input`) and its generated React
wrapper are unchanged; only the CONTRACT DOC'S NARRATIVE about the `build-react-wrappers.mjs` gate
is wrong and is being corrected. The template below is filled out in that spirit: "user stories"
here are readers of the contract doc, "requirements" are the specific factual corrections owed,
and there are no non-functional requirements (no performance/security/reliability surface changes)
— that table is marked N/A rather than populated with placeholders that do not apply.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Contract-doc reader trusts the React wrapper gate description (Priority: P1)

A future mission author (or reviewer) reads `sk-form-input.contract.md`'s "React wrapper contract
(delta)" section to understand what `scripts/build-react-wrappers.mjs`'s consistency check
actually does today, before relying on it or extending it for a new element.

**Why this priority**: The doc currently describes the SUPERSEDED #180 gate (a lower-case fold). A
reader who trusts it will misjudge what the gate catches (a folded comparison certifies nothing
about casing) and could ship a field-naming mistake believing the gate would catch it.

**Independent Test**: Read the corrected section and cross-check it against
`scripts/build-react-wrappers.mjs`'s current `loadReactPropRenameMap()` and per-element comparison
(`build-react-wrappers.mjs:660-680`) — the doc's description must match the code at this head.

**Acceptance Scenarios**:

1. **Given** the corrected contract doc, **When** a reader compares its gate description against
   `scripts/build-react-wrappers.mjs`, **Then** the doc accurately states that the gate reads the
   real `MAPPED_PROPS` table from the installed `@wc-toolkit/react-wrappers` bundle and asserts
   EXACT casing (not a fold).
2. **Given** the corrected contract doc, **When** a reader runs `node scripts/build-react-wrappers.mjs
   --check`, **Then** the observed pass/fail behaviour is consistent with what the doc describes.

---

### User Story 2 - Contract-doc reader is not misled about which renames are case-only (Priority: P1)

The same reader relies on the doc's claim about the shape of the generator's rename table when
reasoning about whether a NEW field name they are about to add is safe from an unexpected rename.

**Why this priority**: The doc currently asserts "every rename in the generator's own table is
CASE-ONLY." This is false — `for`→`htmlFor` and `class`→`className` are word substitutions. A
reader relying on the false claim could assume any collision with the table is cosmetic
(case-only) when for these two rows it is not.

**Independent Test**: Read the corrected section; verify against the installed bundle's real
`MAPPED_PROPS` array (`node_modules/@wc-toolkit/react-wrappers/dist/index.js`) that `for` and
`class` are non-case-only rows, and that the correction does not overclaim a parallel structure
between them where none has been fully traced.

**Acceptance Scenarios**:

1. **Given** the corrected contract doc, **When** a reader inspects the real `MAPPED_PROPS` table,
   **Then** the doc's claim about which rows are case-only matches what the table shows.
2. **Given** the corrected contract doc, **When** a reader looks for the full trace of the
   `for`/`class` rows' mechanics, **Then** the doc points to ADR-11's "wrapper prop-name invariant"
   section as the canonical statement rather than re-deriving or restating it, and does not assert
   a parallel between the `for` and `class` rows beyond what is verified there.

---

### Edge Cases

- What happens if a future dependency upgrade changes `MAPPED_PROPS`'s row count or the specific
  rows that are case-only? — Out of scope for this correction; the doc points to ADR-11, which
  already notes that counts of an unversioned-in-this-repo internal table are not stable across
  dependency versions and is the surface responsible for tracking that, not this contract doc.
- What happens if a future reader wants the full mechanical trace of why `for` and `class` diverge
  in how the gate vs. the generator key their lookups? — This spec's correction defers that detail
  to ADR-11 by design (one owner per fact); it does not duplicate ADR-11's trace here.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Correct the gate description | As a contract-doc reader, I want the "React wrapper contract (delta)" section to describe the CURRENT gate (#187's exact-comparison, real-table read) rather than the superseded #180 fold, so that I do not misjudge what the gate catches. | High | Done |
| FR-002 | Correct the false CASE-ONLY claim | As a contract-doc reader, I want the section to stop asserting "every rename in the generator's table is CASE-ONLY" (false for `for`/`class`) and instead state the verified, narrower truth, so that I am not misled about which field names are safe from non-cosmetic renames. | High | Done |
| FR-003 | Point to ADR-11 as the canonical source | As a contract-doc reader, I want the corrected section to cite ADR-11's "wrapper prop-name invariant" section for the full mechanical trace rather than re-stating it, so that this fact has one owner and does not drift out of sync with ADR-11 again. | High | Done |
| FR-004 | Do not overclaim the `class` row's trace | As a contract-doc reader, I want the correction to avoid asserting a parallel between the `for` and `class` rows' internal mechanics beyond what has actually been verified, so that this correction does not itself introduce a new unverified claim. | High | Done |

### Non-Functional Requirements

N/A — this mission changes documentation prose only; it introduces no performance, security, or
reliability surface. No NFR rows apply.

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Doc-only scope | This mission may edit `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md` and its own `kitty-specs/` mission artefacts only. It must NOT edit `scripts/`, `packages/`, or any work-package task page (task pages are frozen per standing operator ruling; contract and research surfaces are what track changes). | Technical | High | Done |
| C-002 | No behaviour change | The correction must not change `sk-form-input`'s shipped behaviour, its React wrapper's generated output, or the gate's pass/fail outcome. Verified: `node scripts/build-react-wrappers.mjs --check` passes unchanged before and after this mission's edit. | Technical | High | Done |
| C-003 | Verify before asserting | Every factual claim about gate behaviour in the corrected text must be backed by reading the current script source and/or the installed `@wc-toolkit/react-wrappers` bundle at this head, not by trusting the issue's description or a prior contract-doc draft. Anything not fully traceable must be labelled as such rather than asserted. | Technical | High | Done |

### Key Entities

- **`sk-form-input.contract.md`**: The contract doc being corrected. Belongs to the already-closed
  `form-input-constraints-and-datalist-01M1S94Y` mission; this mission edits only its "React wrapper
  contract (delta)" section.
- **`scripts/build-react-wrappers.mjs`**: The generator/gate script whose CURRENT behaviour
  (`loadReactPropRenameMap()`, the per-element exact-casing comparison) is the thing being
  accurately described. Not edited by this mission.
- **ADR-11 (`docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`)**:
  The canonical statement of the wrapper prop-name invariant, including the full `for`/`class`
  trace and its own stated limits. The corrected contract-doc section points here rather than
  restating it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The "React wrapper contract (delta)" section no longer describes the #180
  lower-case-fold gate; it describes #187's exact-comparison, real-table-reading gate, verified
  against `scripts/build-react-wrappers.mjs`'s current source at this head.
- **SC-002**: The section no longer asserts "every rename in the generator's table is CASE-ONLY"
  without qualification; the corrected text is consistent with the real `MAPPED_PROPS` array read
  from the installed bundle.
- **SC-003**: The section cites ADR-11's "wrapper prop-name invariant" section as the canonical
  source for the `for`/`class` mechanics rather than re-deriving or restating it in full.
- **SC-004**: `node scripts/build-react-wrappers.mjs --check` passes identically before and after
  this mission's changes (no behaviour change).
- **SC-005**: No file outside `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/
  sk-form-input.contract.md` and this mission's own `kitty-specs/form-input-contract-doc-refresh-
  01M1T6VH/` artefacts is modified.
