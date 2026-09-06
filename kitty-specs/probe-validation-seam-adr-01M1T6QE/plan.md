# Implementation Plan: Probe Validation Seam ADR

**Branch**: `mission/probe-validation-seam-adr` | **Date**: 2026-09-06 | **Spec**: `spec.md`
**Input**: Feature specification from `kitty-specs/probe-validation-seam-adr-01M1T6QE/spec.md`

## Summary

Author a new ADR (ADR-14) recording the detached-probe validation seam `sk-form-input` shipped in
#180 and #187: `validate()` runs from `willUpdate()`, before Lit commits the current update's
bindings to the rendered control, so a permanently detached, never-connected probe `<input>` —
synced from the element's own properties every call — is the source of merged constraint-validity
flags, with `badInput` merged from the REAL rendered control as a deliberate, measured exception.
The ADR records the mechanism, the pre-fix measured failure, the `#onInput` no-op regression and
its fix, and restates `research.md` R2's originally-rejected alternative against what actually
shipped (the probe is itself a second UA-computed source; the risk R2 named recurred as three
measured synchronization bugs, not as a reimplementation bug). The ADR states, but does not
answer, the two architectural forks #188 raises — whether the pattern is sanctioned for #179/#122,
and what invariant ties probe/control/`setFormValue` together — and records the operator's
authorization to write it outside #67, in the shape ADR-10 used for #176 and ADR-11 for #189. No
code changes. One work package.

## Technical Context

**Language/Version**: N/A (documentation-only mission; the reference code — TypeScript/Lit — is
read, not modified)
**Primary Dependencies**: None added. Reference-only:
`packages/elements/src/form-input/sk-form-input.ts`,
`fixtures/elements-behaviour/src/sk-form-input.test.ts`,
`kitty-specs/form-input-constraints-and-datalist-01M1S94Y/research.md` (R2, R9).
**Storage**: N/A
**Testing**: No automated test surface — the deliverable is prose. Verification is manual: every
factual claim about `sk-form-input.ts`'s current behaviour is checked against the file and, where
a corresponding assertion exists, against the real test in `sk-form-input.test.ts`, before being
written into the ADR (already done for this plan — see spec.md's scope-boundary section, which
cites the specific test names covering the pre-fix failure and the `#onInput` regression).
**Target Platform**: N/A
**Project Type**: single (docs artifact only — no `src/`/`tests/` tree applies)
**Performance Goals**: N/A
**Constraints**: C-001 (new-ADR-only scope, no code changes), C-002 (commit scope discipline:
unscoped `docs:`, ≤100 char headers, CLI-message rewrite via `git filter-branch --msg-filter` if
needed), C-003 (no hand-edited `kitty-specs/` runtime state beyond CLI-authored files)
**Scale/Scope**: One new file
(`docs/architecture/decisions/2026-09-06-14-detached-probe-validation-seam.md`). No existing ADR
is amended.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No charter file conflict identified. This mission documents an existing, already-shipped code
behaviour and creates no new testable surface, so `languages_frameworks`/`testing_requirements`/
`quality_gates` are untouched. The one governance rule directly in play is
`elements-first-run-prompt.md` §4 ("ADRs 8–13 pin every decision these missions need, and ADRs are
written only in #67"; "Write an ADR outside #67" under "what this loop must never do") — issue
#188 and this mission's brief satisfy it via the same operator-override precedent ADR-10 recorded
for #176 and ADR-11 recorded for #189 (see spec.md "Operator authorization for writing this ADR"
and FR-008). No violation requiring Complexity Tracking.

## Project Structure

### Documentation (this mission)

```
kitty-specs/probe-validation-seam-adr-01M1T6QE/
├── spec.md               # Mission specification (committed)
├── plan.md               # This file
└── tasks/                # Phase 2 output (spec-kitty tasks) — one WP
```

### Source Code (repository root)

```
docs/architecture/decisions/
└── 2026-09-06-14-detached-probe-validation-seam.md   # NEW (the only file created)
```

No `src/`, `tests/`, `backend/`, `frontend/`, or platform trees apply — this is a single new
documentation file, not application code.
`packages/elements/src/form-input/sk-form-input.ts` and
`fixtures/elements-behaviour/src/sk-form-input.test.ts` are read as reference material and are
explicitly out of scope for modification (spec.md C-001, SC-005).

**Structure Decision**: Single project, docs-only. One work package creates one new ADR file.

## Complexity Tracking

*No Charter Check violations. Not applicable.*

## Implementation Concern Map

### IC-01 — Author ADR-14: the detached-probe validation seam

- **Purpose**: Create the new ADR recording the mechanism (`willUpdate`-vs-render timing, the
  detached probe, the `badInput` exception), the measured pre-fix failure, the `#onInput`
  regression and fix, the restated R2 rejected-alternative analysis, R9 cited as settled context,
  the two open questions #188 raises stated for the operator without a recommended answer, and the
  operator-override notice for writing this ADR (matching ADR-10's #176 / ADR-11's #189 shape).
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008,
  NFR-001, NFR-002, NFR-003, C-001, C-002, C-003
- **Affected surfaces**: `docs/architecture/decisions/2026-09-06-14-detached-probe-validation-seam.md` (new)
- **Sequencing/depends-on**: none — single concern, single new file
- **Risks**: FR-005's restatement could be misread as reopening or re-deciding R2 — the WP must
  describe the shipped design's actual synchronization-risk profile without proposing an
  alternative or claiming the risk is closed. FR-007's open-questions section could drift into a
  recommendation by tone even without an explicit "should" sentence — re-read each open-question
  paragraph against the letter of NFR-001 before commit. Getting the measured pre-fix failure or
  the `#onInput` regression's mechanics wrong would misstate the two concrete incidents the whole
  ADR leans on — re-verify against `sk-form-input.ts`'s own comments and the named tests in
  `sk-form-input.test.ts`, not from memory, when drafting.
