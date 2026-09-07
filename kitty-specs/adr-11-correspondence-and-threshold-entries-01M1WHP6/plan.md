# Implementation Plan: ADR-11 correspondence and threshold entries

**Mission**: `adr-11-correspondence-and-threshold-entries-01M1WHP6`
**Branch**: `mission/adr-11-correspondence-and-threshold-entries`
**Base / merge target**: `train/elements-first`
**Spec**: `kitty-specs/adr-11-correspondence-and-threshold-entries-01M1WHP6/spec.md`
**Issues**: #196, #204, #233 — each with an operator ruling dated 2026-09-07

## Summary

One ADR-11 amendment adding two required behaviours, each registered, pinned and proven by a
red-first mutation; plus a `ceilingSeconds` raise on measured growth. No architectural decision
beyond the three rulings.

## Technical Context

**Language / runtime**: TypeScript, Lit 3, Vitest 4 browser mode (Playwright provider), Node lane.
**Files the mission owns**:

- `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`
- `behaviours.json`, `mutations.json`, `suite-budget.json`
- `tests/node/config-contract.test.ts`
- `fixtures/elements-behaviour/src/sk-form-input.test.ts`
- `fixtures/elements-behaviour/src/sk-page-header.test.ts`

**Files the mission must not touch** (C-002): `packages/elements/src/notice/**`,
`packages/styles/src/notice/**`, `docs/contributing/adding-a-token.md`,
`docs/design-system/using-tokens.md`. **And** `suite-budget.json:selftestCeilingSeconds` (C-001).

**No element source changes.** Both new behaviours are proven by mutating existing shipped code in
the harness's own throwaway copy; nothing in `packages/elements/src/**` is edited on this branch.

### The measurement that decided the design (IC-01)

A correspondence assertion is, by construction, violated by any defect that breaks *either* source.
Measured on this branch before writing anything: with a full host-versus-rendered-control assertion
added to `sk-form-input.test.ts`, **four** of the twenty existing `sk-form-input.ts` arms red it —

| existing arm | id today | reds the correspondence assertion |
|---|---|---|
| merged UA flag blocks a real submit | SC-003 | yes |
| post-reset validity (`probe.value` sync deleted) | SC-003 | yes |
| constraint attribute reaches the inner control (`pattern=${nothing}`) | SC-013 | yes |
| probe `type` assigned before `value` | SC-003 | yes |

Guard 5 would reject all four as collateral. Two ways out were considered:

1. **`expectCollateral: true` on each.** Rejected: it converts four surgical arms into arms with no
   blast-radius bound at all, to buy room for one new id. NFR-001 forbids it.
2. **Name the shared claim on the test instead.** Chosen. A test name may carry more than one id —
   `[SC-002][SC-003] a readonly control still submits …` is already in this file — and guard 4/5
   read the marker, so a test marked `[SC-003][SC-016]` is *named* for both. The three SC-003-side
   arms then stay named and surgical, and the SC-013 arm is re-sited onto `inputmode`, an attribute
   whose only claim is forwarding, so it no longer reaches validity at all.

That re-siting is the one judgement call in this mission and it is a like-for-like exchange, not a
weakening: the `[SC-013]` test asserts six attributes reach the inner control and the arm drops one
of them either way. It is recorded in `mutations.json`'s `$comment` with the reason.

## Charter Check

No charter surface is touched. ADR-11 is amended under the operator's #196/#204 ruling, following
the #176 (ADR-10) and #189 (ADR-11) precedent for recording an amendment's authorization on an
Accepted record.

## Project Structure

### Documentation (this mission)

```
kitty-specs/adr-11-correspondence-and-threshold-entries-01M1WHP6/
├── spec.md
├── plan.md
├── tasks.md
└── tasks/
```

### Source Code (repository root)

```
behaviours.json                 # + SC-016, + SC-017
mutations.json                  # SC-016 arm (re-keyed), 2 SC-017 arms, SC-013 arm re-sited
suite-budget.json               # ceilingSeconds only
tests/node/config-contract.test.ts
fixtures/elements-behaviour/src/sk-form-input.test.ts
fixtures/elements-behaviour/src/sk-page-header.test.ts
docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md
docs/architecture/decisions/2026-09-06-14-detached-probe-validation-seam.md   # the #196 pointer only
```

**Structure Decision**: no new directories. Every surface is an existing registry, gate input, ADR
or fixture.

## Implementation Concern Map

### IC-01 — The correspondence entry (SC-016)

- **Purpose**: give ADR-14's admitted desync class an owner in ADR-11's gate list, written from the
  three measured bugs rather than from the abstraction.
- **Relevant requirements**: FR-001, FR-003, FR-004, NFR-001.
- **Affected surfaces**: ADR-11 §Required behaviours (item 10), `behaviours.json`,
  `tests/node/config-contract.test.ts`, `fixtures/elements-behaviour/src/sk-form-input.test.ts`,
  `mutations.json`.
- **Sequencing/depends-on**: none.
- **Risks**: the collateral interaction measured above. Mitigated by dual-marking rather than by
  `expectCollateral`; re-verified by running the affected arms.

### IC-02 — The responsive-threshold entry (SC-017)

- **Purpose**: give a documented viewport threshold an id, so #182's two drop blocks — and every
  future breakpoint — can carry a mutation.
- **Relevant requirements**: FR-002, FR-003, FR-004.
- **Affected surfaces**: ADR-11 §Required behaviours (item 11), `behaviours.json`,
  `tests/node/config-contract.test.ts`, `fixtures/elements-behaviour/src/sk-page-header.test.ts`,
  `mutations.json`.
- **Sequencing/depends-on**: none.
- **Risks**: the arm must mutate the **generated** `sk-page-header.css.js`, because the `test` job
  never builds and a mutation of the authored `.css` would be semantically inert. The marked test's
  live arm must set the `sticky` **attribute** directly, so the existing SC-010 reflect arm does not
  red it as collateral.

### IC-03 — The amendment's authorization and the two records that point at it

- **Purpose**: record why an Accepted ADR is being amended, and update ADR-14's Negative
  consequence, which currently says the class has no entry.
- **Relevant requirements**: FR-005.
- **Sequencing/depends-on**: IC-01, IC-02.
- **Risks**: ADR-14 is a `Proposed` record owned by #188; only the sentence that #196 made stale is
  corrected, with the correction named as such.

### IC-04 — The wall-clock ceiling (#233)

- **Purpose**: raise `ceilingSeconds` above the observed tail with the basis stated.
- **Relevant requirements**: FR-006, NFR-003, C-001.
- **Affected surfaces**: `suite-budget.json` (`ceilingSeconds`, `measuredOn`, `runUrl`, `sha`,
  `$comment`) only.
- **Sequencing/depends-on**: none for the raise; the recorded test count depends on IC-01/IC-02
  landing, because this mission's own tests move the count.
- **Risks**: quoting a workstation figure. This file records two occasions on which that was caught;
  the recorded numbers are CI's.
