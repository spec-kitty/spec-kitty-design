# Implementation Plan: Form Input Contract Doc Refresh

**Branch**: `mission/form-input-contract-doc-refresh` | **Date**: 2026-09-06 | **Spec**: `kitty-specs/form-input-contract-doc-refresh-01M1T6VH/spec.md`
**Input**: Feature specification from `kitty-specs/form-input-contract-doc-refresh-01M1T6VH/spec.md`

## Summary

Correct two stale factual claims in `sk-form-input.contract.md`'s "React wrapper contract (delta)"
section (FR-001/FR-002 of the spec): it currently describes the #180 lower-case-fold gate, which
#187 replaced with an exact comparison against the real `MAPPED_PROPS` table
(`loadReactPropRenameMap()` in `scripts/build-react-wrappers.mjs`), and it asserts "every rename in
the generator's table is CASE-ONLY," which is false for the `for`→`htmlFor` and `class`→`className`
rows. The fix is prose-only: read the current gate source and the installed
`@wc-toolkit/react-wrappers` bundle to confirm the real behaviour, then rewrite the section to state
it, pointing to ADR-11's "wrapper prop-name invariant" section as the canonical statement of the
`for`/`class` mechanics rather than re-deriving it (FR-003/FR-004). No code, generated output, or
gate behaviour changes.

## Technical Context

**Language/Version**: N/A — Markdown prose edit only; no source language involved.
**Primary Dependencies**: Read-only inspection of `scripts/build-react-wrappers.mjs` and the
installed `node_modules/@wc-toolkit/react-wrappers/dist/index.js` bundle (to extract the real
`MAPPED_PROPS` array and confirm which rows are case-only vs. word-substitution renames).
**Storage**: N/A.
**Testing**: No test suite applies to Markdown prose. Verification is: (a) `node
scripts/build-react-wrappers.mjs --check` passes, unchanged, before and after this mission's edit
(proves no behaviour regression); (b) every factual claim in the rewritten section is checked
against the script source and/or the installed bundle at this head before being written, per
spec.md C-003.
**Target Platform**: N/A (documentation).
**Project Type**: Single doc-only mission — one file edited
(`kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md`),
plus this mission's own `kitty-specs/form-input-contract-doc-refresh-01M1T6VH/` artefacts.
**Performance Goals**: N/A.
**Constraints**: Doc-only scope (spec.md C-001) — `scripts/`, `packages/`, and work-package task
pages are off-limits; contract and research surfaces are the correction target because task pages
are frozen by standing operator ruling. No behaviour change (spec.md C-002).
**Scale/Scope**: One contract-doc section (~30 lines), no other files.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No charter violation: this mission makes no code change, adds no dependency, and does not touch
any gated surface (`scripts/`, `packages/`). The only gate relevant to this mission's own output is
`scripts/build-react-wrappers.mjs --check`, which this plan requires to remain green (verifies no
behaviour was accidentally implied differently by the doc — the doc itself is not gate-enforced,
but the mission's own verification step treats the gate as the ground truth the doc must match).

## Project Structure

### Documentation (this mission)

```
kitty-specs/form-input-contract-doc-refresh-01M1T6VH/
├── plan.md              # This file
├── spec.md              # Mission specification (already authored + committed)
└── tasks.md             # Phase 2 output (/spec-kitty.tasks command)
```

No `research.md`, `data-model.md`, `quickstart.md`, or `contracts/` are needed: there is no new
data model, no new API contract, and no quickstart to write. Research already happened — the
"Read first" investigation (issue #191, the gate source, ADR-11's invariant section) — and its
findings are captured directly in spec.md's Key Entities and this plan's Summary rather than a
separate research.md, since there is nothing left to decide once those three sources are read.

### Source Code (repository root)

```
kitty-specs/form-input-constraints-and-datalist-01M1S94Y/
└── contracts/
    └── sk-form-input.contract.md   # THE FILE EDITED — "React wrapper contract (delta)" section
```

No `src/`, `tests/`, `backend/`, `frontend/`, `api/`, `ios/`, or `android/` structure applies — this
is not a software build. The single-project template option is dropped entirely rather than forced
onto a docs mission (per the standing note that hybrid missions stall the state machine; this
mission stays single-purpose: one contract doc, one section, two factual corrections).

**Structure Decision**: Single target file, no source tree. The correction lives entirely inside
the existing `contracts/` directory of the already-closed
`form-input-constraints-and-datalist-01M1S94Y` mission, per the issue's own instruction (filed
rather than fixed inline there because that mission is closed).

## Complexity Tracking

*Fill ONLY if Charter Check has violations that must be justified*

No violations — table omitted.

## Implementation Concern Map

Single concern; a full IC map is not warranted for a one-file, one-section prose fix, but is
recorded briefly for traceability.

### IC-01 — Correct the React wrapper contract (delta) section

- **Purpose**: Replace the stale #180 gate description and the false CASE-ONLY claim with the
  verified current state (#187's exact comparison; `for`/`class` are non-case-only renames), and
  point to ADR-11 as the canonical source for the underlying mechanics.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004 (spec.md).
- **Affected surfaces**:
  `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md`
  ("React wrapper contract (delta)" section only).
- **Sequencing/depends-on**: none.
- **Risks**: Overclaiming the `class` row's internal mechanism to look parallel to `for`'s (ADR-11
  itself says its own trace of the `class` row's `originalName`/`attributeMapping` path is
  incomplete) — mitigated by deferring that detail to ADR-11 rather than re-deriving it here.
