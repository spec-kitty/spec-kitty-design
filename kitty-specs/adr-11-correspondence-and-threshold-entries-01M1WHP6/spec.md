# Mission Specification: ADR-11 correspondence and threshold entries

**Mission Branch**: `mission/adr-11-correspondence-and-threshold-entries`
**Created**: 2026-09-07
**Status**: Draft
**Input**: Issues #196, #204 and #233, each carrying an operator ruling dated 2026-09-07.

## Context

Three operator rulings, one mission.

- **#196 + #204 — one ADR-11 amendment, two entries.** ADR-11's required-behaviours list
  (`docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md:52-62`)
  is the repository's gate — *"A component is not done when it renders … This list is the gate."*
  Two behaviour classes have reached that boundary with no id: probe/rendered-control
  correspondence (#196, from ADR-14's three measured desynchronization bugs) and a responsive
  threshold (#204, from #182's reflow blocks). The operator ruled both at once, in a single
  amendment, and required each entry to be falsifiable the way ADR-11 requires — **a red-first
  mutation, not a prose obligation**. This is the fifth time a mission has reached this boundary
  (#140, #143, #77, #177, #178), each time stalling.
- **#233 — raise `ceilingSeconds` on measured growth.** Three runs of unchanged code measured
  18s / 22.9s / 25.2s against a 25s ceiling. The suite genuinely grew (647 tests when the ceiling
  was set, 762 now), so this is growth rather than the variance-driven raise #187 warned against.
  `selftestCeilingSeconds` is out of scope — that is #225's and stays until the filtered-suite
  redesign lands.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A delegate that disagrees with the rendered control fails a gate (Priority: P1)

`sk-form-input` derives five of its reported validity flags from a permanently detached probe
`<input>` rather than from the control the user interacts with. ADR-14 records **three** measured
bugs in which those two sources disagreed for the same intended state, and states plainly that its
mitigation is "narrow and empirical … not a structural guarantee that a fourth such bug cannot
exist". Nothing in ADR-11's list covers that correspondence: item 1 reaches what `setValidity`
does with the flags, never how the flags were derived.

A maintainer changing the probe's synchronization must be told by the suite — not by a future
production defect — that the two sources have drifted apart.

**Why this priority**: it is the entry the operator ruled first, and the one ADR-14's own Negative
consequences name as an unowned risk.

**Independent Test**: apply the type-before-value reversal recorded as ADR-14's third measured bug
and observe the named `[SC-016]` test go red with no collateral.

**Acceptance Scenarios**:

1. **Given** a field mounted already violating a forwarded `pattern`, **When** the suite runs,
   **Then** the flags the host reports and the flags the rendered control itself computes are
   asserted equal, and both say the value is invalid.
2. **Given** a same-update `type` and `value` change under a forwarded `pattern`, **When** the
   probe is synced value-before-type (ADR-14's third bug, reintroduced as a mutation), **Then**
   the `[SC-016]` test goes red.
3. **Given** a field with no forwarded constraint at all, **When** the suite runs, **Then**
   neither source reports a constraint flag — the shape of ADR-14's second measured bug, where
   `?? ''` compiled an unset pattern to `^(?:)$`.

---

### User Story 2 - A documented viewport threshold can carry a mutation (Priority: P1)

`sk-page-header` drops its stickiness below 720px of width and below 480px of height, in two
deliberately separate `@media` blocks so either can fail alone. Those thresholds are covered by
ordinary tests today; what they do not have is the harness re-deriving the claim, because
`scripts/suite-selftest.mjs` guard 7 rejects any mutation whose `${id}@${subject}` pair
`behaviours.json` does not declare, and `tests/node/config-contract.test.ts` pins the applicable
id set to ADR-11's list exactly. #182 shipped its reflow threshold without a mutation arm for
exactly this reason.

**Why this priority**: ruled in the same amendment, and every element with a breakpoint inherits
the gap until an id exists.

**Independent Test**: widen or narrow one drop block's condition in the generated stylesheet and
observe the named `[SC-017]` test go red with no collateral.

**Acceptance Scenarios**:

1. **Given** the committed stylesheet, **When** the width drop block's documented figure is
   changed, **Then** the `[SC-017]` test goes red.
2. **Given** the committed stylesheet, **When** the height drop block's documented figure is
   changed, **Then** the `[SC-017]` test goes red — the two blocks fail independently, which is
   why #182 wrote them separately.
3. **Given** the lane's real 414px viewport, **When** a sticky header is laid out, **Then** it is
   measured in normal flow rather than only asserted from the sheet text.

---

### User Story 3 - The wall-clock ceiling reds on slowness, not on runner variance (Priority: P2)

`suite-budget.json`'s `ceilingSeconds` is 25, enforced as an `[ENFORCED]` step the `gate` job
strictly requires. Three runs of code that did not change measured 18s, 22.9s and 25.2s, so the
distribution straddles the ceiling: the same tree passes or fails depending on the runner it lands
on. A contributor's docs-only PR went red on a suite in which 762 of 762 assertions passed.

**Why this priority**: it costs a CI round on unrelated PRs, but no behaviour is unverified while
it stands.

**Independent Test**: read `ceilingSeconds` and the recorded basis; the figure must be derivable
from the recorded worst observation and the repository's own multiplier, not chosen.

**Acceptance Scenarios**:

1. **Given** the raised ceiling, **When** a reader asks why that number, **Then** the file states
   the three measurements, the worst of them, the multiplier applied, the resulting headroom and
   the test count it was measured at.
2. **Given** `selftestCeilingSeconds`, **When** this mission finishes, **Then** it is byte-for-byte
   unchanged at 1405.5.

### Edge Cases

- **A correspondence entry is violated by every defect that breaks either source.** Measured, not
  assumed: with a full host-versus-control assertion in place, four existing mutation arms red it.
  The entry is only shippable if the registry can express that without disabling guard 5's
  collateral bound on unrelated arms.
- **A mutation on a generated artefact.** The threshold lives in
  `packages/elements/src/page-header/sk-page-header.css.js`, which is generated and committed. The
  `test` job never builds, so a mutation of the authored `.css` would be semantically inert;
  `SC-010`'s existing arm against generated `packages/react/src/SkTransitionMatrix.js` is the
  precedent for mutating the generated file instead.
- **A raise that outruns its own evidence.** `suite-budget.json` records two occasions on which
  its own arithmetic was falsified by the very next run. The new figure must be stated as
  worst-observed × a multiplier this repository has already used, not as a fit to a central
  tendency.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | ADR-11 gains a correspondence entry | As the maintainer of the gate list, I want a required behaviour for delegate/rendered-control correspondence, written from ADR-14's three measured bugs, so the desync class has an owner. | High | Open |
| FR-002 | ADR-11 gains a responsive-threshold entry | As an element author with a breakpoint, I want an id for a documented viewport threshold so the behaviour can carry a mutation. | High | Open |
| FR-003 | Both entries are registered and pinned | As the harness, I want `behaviours.json` and `tests/node/config-contract.test.ts` to carry both new ids so the registry still mirrors ADR-11 exactly. | High | Open |
| FR-004 | Each entry has a red-first mutation | As a reviewer, I want each new id to carry a mutation whose named test is demonstrated red, so neither entry is a prose obligation. | High | Open |
| FR-005 | The amendment records its authorization | As a future reader, I want the amendment to cite the #196/#204 ruling by name, following the #176 and #189 precedent for amending an Accepted record. | Medium | Open |
| FR-006 | `ceilingSeconds` is raised on a stated basis | As a contributor whose docs PR went red, I want the wall-clock ceiling above the observed tail, with the three measurements, the arithmetic and the test count recorded. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No arm loses its collateral bound | No existing mutation gains `expectCollateral`, and every mutation still produces its named red with no collateral. | Reliability | High | Open |
| NFR-002 | The mutation harness stays inside its ceiling | `scripts/suite-selftest.mjs` completes under the unchanged `selftestCeilingSeconds` of 1405.5s. | Performance | High | Open |
| NFR-003 | The raised ceiling clears the observed tail | `ceilingSeconds` is at least 1.5× the worst of the three recorded measurements. | Performance | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | `selftestCeilingSeconds` is untouched | Line 93 of `suite-budget.json` stays at 1405.5 — it is #225's and waits for the filtered-suite redesign. | Technical | High | Open |
| C-002 | A concurrent mission owns four paths | `packages/elements/src/notice/**`, `packages/styles/src/notice/**`, `docs/contributing/adding-a-token.md` and `docs/design-system/using-tokens.md` are not touched. | Technical | High | Open |
| C-003 | No architectural decision beyond the three rulings | A genuine fork is filed as an issue with its measurement attached rather than settled here. | Technical | High | Open |

### Key Entities

- **Behaviour id (`SC-0NN`)**: an entry in ADR-11's required-behaviours list, mirrored in
  `behaviours.json` with at least one subject, pinned by `tests/node/config-contract.test.ts`, and
  proven by at least one entry in `mutations.json`.
- **Subject**: the `(id, test file)` pair guard 7 and the floor reporter both key on.
- **Mutation arm**: a single string replacement that must red a test whose name carries the id,
  and no other behaviour test.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-501**: ADR-11's required-behaviours list has eleven items, and `behaviours.json`'s
  applicable set equals it exactly — asserted by `tests/node/config-contract.test.ts`, not by
  reading.
- **SC-502**: `node scripts/suite-selftest.mjs` reports every mutation producing its named red
  against a green baseline, including the two new ids, with no collateral and no
  `expectCollateral` added to any existing arm.
- **SC-503**: The verbatim failure output of each new arm is recorded on the PR, so both entries
  are demonstrably falsifiable rather than asserted.
- **SC-504**: `ceilingSeconds` is above 25.2s by the repository's own worst-observed × 1.5213
  multiplier, and `selftestCeilingSeconds` is unchanged at 1405.5.
