# Implementation Plan: ADR-11 Wrapper Prop-Name Invariant

**Branch**: `mission/adr11-wrapper-prop-name-invariant` | **Date**: 2026-09-06 | **Spec**: `spec.md`
**Input**: Feature specification from `kitty-specs/adr11-wrapper-prop-name-invariant-01M1T2A1/spec.md`

## Summary

Amend ADR-11 to record an invariant that already exists in shipped code
(`scripts/build-react-wrappers.mjs`, fixed by #187) but that ADR-11 never mentions: the generated
React wrapper preserves the manifest's field **set**; field **casing** follows React/JSX convention
via `@wc-toolkit/react-wrappers`'s internal, not-exported `MAPPED_PROPS` table, which the gate
parses from the installed bundle rather than mirroring by hand. The amendment records the worked
example (`sk-form-input`), the contract-doc obligation for future authors, an explicit assessment
of whether `REACT_PROPS` and the rename table should be consolidated (issue #189's third point),
and the operator's authorization to write this ADR outside #67, in the shape ADR-10 used for #176.
No code changes. One work package.

## Technical Context

**Language/Version**: N/A (documentation-only mission; the reference code is Node.js/ESM, unchanged)
**Primary Dependencies**: None added. Reference-only: `@wc-toolkit/react-wrappers` (already a
devDependency), `scripts/build-react-wrappers.mjs` (read, not modified).
**Storage**: N/A
**Testing**: No automated test surface — the deliverable is prose. Verification is manual: every
factual claim about `build-react-wrappers.mjs`'s behaviour is checked against the file on this
branch (already done in spec.md's "Background verified" section) before being asserted in the ADR,
and the amended ADR is checked against spec.md's Success Criteria (SC-001..SC-005) before commit.
**Target Platform**: N/A
**Project Type**: single (docs artifact only — no `src/`/`tests/` tree applies)
**Performance Goals**: N/A
**Constraints**: C-001 (ADR-only scope), C-002 (commit scope discipline: unscoped `docs:`, ≤100
char headers), C-003 (no hand-edited `kitty-specs/` runtime state beyond CLI-authored files)
**Scale/Scope**: One file amended (`docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`),
one new subsection (or short addendum) within it.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No charter file conflict identified. This mission does not touch `languages_frameworks`,
`testing_requirements`, or `quality_gates` (the areas O5 amended for ADR-11 itself) — it documents
an existing, already-shipped code behaviour. The one governance rule directly in play is
`elements-first-run-prompt.md` §4's "ADRs are written only in #67," which issue #189 and this
mission's brief satisfy via the same operator-override precedent ADR-10 recorded for #176 (see
spec.md "Operator authorization for writing this ADR" and FR-006). No violation requiring
Complexity Tracking.

## Project Structure

### Documentation (this mission)

```
kitty-specs/adr11-wrapper-prop-name-invariant-01M1T2A1/
├── spec.md               # Mission specification (committed)
├── plan.md               # This file
└── tasks/                # Phase 2 output (spec-kitty tasks) — one WP
```

### Source Code (repository root)

```
docs/architecture/decisions/
└── 2026-09-02-11-verification-stack-and-wrapper-generation.md   # AMENDED (the only file changed)
```

No `src/`, `tests/`, `backend/`, `frontend/`, or platform trees apply — this is a single-file
documentation amendment, not application code. `scripts/build-react-wrappers.mjs` is read as
reference material and is explicitly out of scope for modification (spec.md C-001, SC-005).

**Structure Decision**: Single project, docs-only. One work package amends one file.

## Complexity Tracking

*No Charter Check violations. Not applicable.*

## Implementation Concern Map

### IC-01 — Amend ADR-11 with the wrapper prop-name invariant

- **Purpose**: Add the missing invariant record to ADR-11: field-set preservation vs.
  React/JSX-convention casing, the non-exported `MAPPED_PROPS` table and the fail-closed
  read-with-fallback pattern that asserts against it, the `sk-form-input` worked example, the
  contract-doc obligation for future element authors, the FR-004 assessment of the
  `REACT_PROPS`/rename-table duplication, and the operator-override notice for writing this ADR
  under #189 (matching ADR-10's #176 shape).
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002,
  C-001, C-002, C-003
- **Affected surfaces**: `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`
- **Sequencing/depends-on**: none — single concern, single file
- **Risks**: FR-004's assessment could be misread as license to change gate behaviour; the WP must
  record a verdict without touching `scripts/build-react-wrappers.mjs`, and must explicitly flag
  to the operator (in the ADR text and in the mission's final report) rather than silently deciding,
  if the verdict favors consolidation. Getting the `sk-form-input` field list wrong (there are
  exactly three renamed fields, per spec.md's verified background) would misstate the worked
  example the whole point of the amendment leans on — re-verify against the shipped script's
  docstring, not from memory, when drafting.
