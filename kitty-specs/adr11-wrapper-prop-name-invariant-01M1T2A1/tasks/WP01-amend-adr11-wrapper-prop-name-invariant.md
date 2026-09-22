---
work_package_id: WP01
title: Amend ADR-11 with the wrapper prop-name invariant
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
planning_base_branch: mission/adr11-wrapper-prop-name-invariant
merge_target_branch: mission/adr11-wrapper-prop-name-invariant
branch_strategy: Planning artifacts for this mission were generated on mission/adr11-wrapper-prop-name-invariant. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/adr11-wrapper-prop-name-invariant unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - ADR amendment
history:
- at: '2026-09-06T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: docs/architecture/decisions/
create_intent: []
execution_mode: planning_artifact
model: ''
owned_files:
- docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md
role: implementer
tags: []
task_type: docs
tracker_refs: []
---

# Work Package Prompt: WP01 – Amend ADR-11 with the wrapper prop-name invariant

## Goal

Amend `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`
(ADR-11) to record the wrapper prop-name invariant that issue #189 found missing. No code changes.

## Context already verified (do not re-derive from the issue text alone)

- `scripts/build-react-wrappers.mjs` on this branch already ships #187's fix
  (`loadReactPropRenameMap()`, lines ~156-186, and its use at lines ~660-671): it reads
  `node_modules/@wc-toolkit/react-wrappers/dist/index.js`'s `MAPPED_PROPS` literal by pattern
  match, falls back to a 3-entry map with a `console.warn` if the read/parse fails, and compares
  EXACT casing (not folded) between the emitted prop and the manifest field mapped through that
  table. This is Pass 2 per the script's own header comment, and it is correct — do not treat it
  as broken or redo it.
- `sk-form-input`'s three renamed fields are `readonly`→`readOnly`, `autocomplete`→`autoComplete`,
  `inputmode`→`inputMode`.
- `REACT_PROPS` (script lines ~93-105) and `loadReactPropRenameMap()` are two separate mechanisms:
  `emittedProps()` filters by `REACT_PROPS` (line ~300) before the rename-table comparison runs
  (line ~660). A manifest field whose renamed form collides with a `REACT_PROPS` entry (e.g. a
  hypothetical field literally named `tabindex` or `for`) would be filtered out of `got.values`
  before the rename comparison ever sees it, producing a "props do not match" failure that does
  not name the real cause.
- ADR-11 currently has zero mentions of `MAPPED_PROPS`, casing, or the rename invariant (confirmed
  by grep). The gap is real.
- `docs/architecture/decisions/2026-09-02-10-distribution-build-artifacts-and-canonical-markup.md`
  (ADR-10) recorded an operator override for writing an ADR outside #67, for issue #176, in a named
  subsection ("Styles-only components are a class, not a fixed exception count") that states: who
  ruled, when, that the mission's own plan raised the fork rather than resolving it, and that the
  section exists under that specific authorization. Match this shape for #189.

## Subtasks

### T001 — State the invariant (FR-001, FR-003)

Add a subsection to ADR-11 (in or immediately after "Wrapper generation — decided in principle,
generator deferred") stating:

- The generated React wrapper preserves the manifest's field **set** — a missing, extra, or
  misspelled field is a real defect the gate must catch.
- Field **casing** in the emitted wrapper follows React's own JSX naming convention for a
  specific, small set of well-known HTML-attribute-shaped names, via `@wc-toolkit/react-wrappers`'
  internal `MAPPED_PROPS` table — this is not something the manifest declares or `build-react-wrappers.mjs`
  invents; it is the generator's own behaviour.
- `MAPPED_PROPS` is **not exported** by the package, so `build-react-wrappers.mjs`'s consistency
  gate parses it out of the installed bundle (`node_modules/@wc-toolkit/react-wrappers/dist/index.js`)
  rather than hand-mirroring a copy of it, and asserts the emitted casing **exactly** (not folded)
  against what it reads.
- If the bundle cannot be read or parsed (e.g. a future major restructures it), the gate falls back
  to a narrower, hand-maintained 3-entry map, with a loud warning — a deliberate, documented
  degraded mode, not a silent one.

### T002 — Worked example and future-author obligation (FR-002, FR-005)

In the same subsection, or immediately following:

- Name `sk-form-input` as the element that first exercised this invariant, and list its three
  renamed fields (`readonly`→`readOnly`, `autocomplete`→`autoComplete`, `inputmode`→`inputMode`).
- State the obligation for future element authors: a lowercase, HTML-attribute-shaped field name
  that appears in `MAPPED_PROPS` will emit camelCase in the React wrapper, and the element's own
  contract doc (see `kitty-specs/*/contracts/*.contract.md` convention) must say so when it applies
  — using `sk-form-input`'s contract doc as the citable example other authors can copy the pattern
  from. Check `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md`
  for whether it already documents this; if it does not, say so plainly in the ADR rather than
  silently assuming it does — do not edit that contract file (out of scope for this mission).

### T003 — Assess the REACT_PROPS / rename-table duplication (FR-004)

Add a subsection assessing issue #189's third point: `REACT_PROPS` (exclusion) and the rename
table (mapping) are two mechanisms in one file for one underlying concern (generator-side prop
naming), and a field whose renamed form collides with a `REACT_PROPS` entry (`tabindex`→`tabIndex`,
`for`→`htmlFor` — note `for`/`class` are reserved words and can never be a Lit field name, so the
`for` case is theoretical; `tabindex` is not) currently fails with a message that does not name the
real cause.

Write an explicit verdict — worth consolidating, or not — with reasoning. Do not implement either
outcome in code. If the verdict is that consolidation would improve the gate, the ADR text must say
so **and** the mission's final report must flag it to the operator as a recommendation requiring a
separate, reviewed change — never implement a gate-behaviour change under this mission's own
authority.

### T004 — Operator-override notice (FR-006)

Add a notice, in the shape of ADR-10's #176 section, stating: ADRs are ordinarily written only in
#67 (closed); issue #189 was filed as an ADR fork rather than decided in the #187 mission, per an
operator ruling; this amendment is written under that specific, recorded authorization, not by this
loop's own extension of its authority. Name the issue number and, if available, the date/session of
the ruling.

## Definition of done

- All four subtasks landed as one coherent edit to ADR-11 (a single logical amendment is fine as
  one commit; splitting per-subtask is not required).
- `spec.md`'s SC-001 through SC-005 all hold (verify each one explicitly before calling this WP
  done — see `spec.md` "Success Criteria").
- `git diff adf85d6 -- scripts/build-react-wrappers.mjs` is empty.
- Commit uses the unscoped `docs:` prefix, header ≤100 chars (`docs(adr)` FAILS commitlint in this
  repo — do not use it).

## Risks

- Do not let T003's assessment drift into an implemented consolidation "while I'm in here" — the
  operator's brief for this mission is explicit that this would need a flag, not silent action.
- Re-verify the `sk-form-input` renamed-field list and the script's line numbers against the actual
  file on this branch before writing them into the ADR — they are cited approximately above and
  must be exact in the shipped amendment.
