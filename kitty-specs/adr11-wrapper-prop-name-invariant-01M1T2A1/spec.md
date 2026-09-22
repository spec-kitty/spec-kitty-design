# Mission Specification: ADR-11 Wrapper Prop-Name Invariant

**Mission Branch**: `mission/adr11-wrapper-prop-name-invariant`
**Created**: 2026-09-06
**Status**: Draft
**Input**: GitHub issue spec-kitty/spec-kitty-design#189 — "ADR-11's generator contract assumes
manifest field name == React prop name; that is now false."

## Adaptation note (docs-only mission)

This mission produces no application code. Its deliverable is a doctrine artifact: an amendment to
`docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md` (ADR-11).
The template's "user stories" below are read as **readers of the ADR** (a future element author, a
reviewer of a generator PR, the operator auditing a gate), and "requirements" are the specific
statements the amendment must make, not application behaviour to build. There is one work package:
author the amendment. No FRs describe code changes because none are in scope — see "Explicitly out
of scope" below.

## Background verified before writing this spec

`scripts/build-react-wrappers.mjs` was checked against the issue's claims before any planning:

- The gate fix the issue's "not blocking" section attributes to #187 **is already shipped**, on
  the commit this mission branches from (`adf85d6`, "feat(elements): sk-form-input native
  constraints and shadow-root datalist (#187)"). `loadReactPropRenameMap()` (script lines 156–186)
  reads `node_modules/@wc-toolkit/react-wrappers/dist/index.js`'s `MAPPED_PROPS` literal by
  pattern match, builds a lower-cased-fieldName → exact-JSX-propName map from every entry, and
  falls back to the original 3-entry map (`readonly`/`autocomplete`/`inputmode`) **with a
  `console.warn`** if the read or parse fails. The per-element comparison at lines 660–671
  compares `gotExact` against `wantExact` (each manifest field mapped through the table, unmapped
  fields passed through unchanged) with `JSON.stringify` equality — an **exact**, case-sensitive
  comparison, not a fold. The script's own header comment (lines 121–154) documents this as
  "Pass 2," explicitly rejecting the folded Pass-1 approach (#180) that the issue also describes
  as wrong.
- This means points 1 (the map is hand-copied and narrow) and the mechanical part of the fold
  critique in the issue are **already resolved in code**. Confirmed with the operator's brief
  before planning: do not redo this work.
- `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md` was
  grepped for `MAPPED_PROPS`, `rename`, `readOnly`, `autoComplete`, `inputMode`, `React prop` and
  `casing`: **zero matches**. ADR-11 records the wrapper-generation decision in principle (its
  "Wrapper generation" section) but says nothing about this invariant, its exception, or the fix.
  This is the actual gap the mission closes.
- `REACT_PROPS` (script lines 93–105, the generator-supplied prop exclusion set) and
  `loadReactPropRenameMap()` (the case-rename table) are confirmed as two separate mechanisms in
  the same file, used at two different points (`emittedProps()` line 300 filters by `REACT_PROPS`
  before a field is even classified; the per-element loop at line 660 applies the rename table
  afterward). A manifest field whose lower-cased name matches a `REACT_PROPS` entry's *emitted*
  name (e.g. a hypothetical Lit field literally named `tabindex` or `for`) would have its renamed
  form (`tabIndex`, `htmlFor`) filtered out of `got.values` by `REACT_PROPS` before the rename-table
  comparison ever runs, producing a "props do not match the manifest" failure that does not name
  the actual cause. This is real and current, not hypothetical-only — assessed under Requirement
  FR-004 below.

## Operator authorization for writing this ADR

Per `docs/architecture/elements-first-run-prompt.md` §4, "ADRs are written only in #67." Issue #189
is filed as `[adr]`, explicitly raised by the pre-merge gate on #187 rather than decided there, "per
the operator ruling." This mission's authorization rests on the same precedent
`2026-09-02-10-distribution-build-artifacts-and-canonical-markup.md` (ADR-10) recorded for #176: an
ADR fork the operator has separately authorized is not the mission extending its own authority. The
amendment must record this override inline, in the same shape ADR-10 used — naming the issue, the
fact that it was filed rather than decided, and that the amendment is written under that specific
authorization rather than by this loop's own judgment.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A future element author reads ADR-11 before naming a field (Priority: P1)

An author adding a new form-associated element (the issue's own example: `sk-form-textarea`
declaring `maxlength`) needs to know, before the gate runs, that a lowercase HTML-attribute-shaped
field name may emit camelCase in the React wrapper — and where to check which names are affected.

**Why this priority**: This is the concrete failure mode #187 hit and #189 exists to prevent from
recurring silently. Without it, every future element author rediscovers the casing behaviour only
when the gate reds, exactly the "cause is rediscovered each time" cost the issue names.

**Independent Test**: Read the amended ADR-11 "Wrapper generation" section and confirm it states,
without needing to open the generator's source: (a) the wrapper preserves the field *set*; (b)
casing of specific well-known fields follows React/JSX convention via a table internal to
`@wc-toolkit/react-wrappers`; (c) that table is not exported, so the gate parses it from the
installed bundle rather than mirroring it by hand; (d) `sk-form-input` is the worked example, with
its three renamed fields named explicitly; (e) an element's own contract doc must say so when one
of its fields is affected.

**Acceptance Scenarios**:

1. **Given** the amended ADR-11, **When** an author greps it for "React prop" or "casing" before
   naming a field, **Then** they find the invariant statement and the worked example without
   needing to read `build-react-wrappers.mjs`.
2. **Given** a new element declares `maxlength` (a `MAPPED_PROPS` entry not in the 3-entry
   fallback), **When** the real-table read succeeds (the normal case), **Then** the gate passes
   because the exact-casing comparison against the real table already covers it — and the ADR
   says this is expected, not a special case to special-case in code.

---

### User Story 2 - A reviewer of a future generator-touching PR checks the amendment's honesty (Priority: P1)

A pre-merge reviewer (the same kind of lens that raised #189 on #187) needs the ADR to state
plainly whether a hand-maintained mirror of a `node_modules` table is ever acceptable, and how it
stays honest if so — the issue's second explicit ask of "what an ADR should settle."

**Why this priority**: This is the load-bearing governance question the issue raises independently
of the specific 3-vs-19-entry episode: the *next* dependency-internal table this repo needs to
assert against will hit the same fork, and a reviewer needs a citable answer rather than an
implicit precedent.

**Independent Test**: The amended ADR-11 states the fail-closed pattern (`loadReactPropRenameMap`'s
read-with-warning-and-narrower-fallback) as the sanctioned shape for this class of problem — a
deliberate coupling to a package internal, verified by parsing the bundle rather than copying it,
degrading to a narrower but still-exact fallback rather than to a silent or folded one — and says
so in terms a reviewer can hold a future PR to.

**Acceptance Scenarios**:

1. **Given** a future PR reads some other dependency's internal table by pattern-matching its
   installed bundle, **When** a reviewer checks it against ADR-11, **Then** the ADR gives a
   citable yes/no/conditions answer rather than requiring the reviewer to reconstruct the reasoning
   from the script's comments.

---

### User Story 3 - The operator (or a future mission) decides whether to consolidate REACT_PROPS and the rename table (Priority: P2)

The issue's third point asks whether `REACT_PROPS` (exclusion) and the rename mechanism (mapping)
should be one mechanism, since a field named `tabindex` or `for` currently routes through the
exclusion set with a confusing message instead of surfacing the real cause.

**Why this priority**: Lower than P1 because it is explicitly a "assess and record," not "fix" —
the operator's brief for this mission says not to consolidate under this loop's own judgment if it
would change gate behaviour, only to flag it. It still needs an honest, written verdict; leaving it
unaddressed would repeat the exact "recorded here for the operator to decide" pattern ADR-10 used
for the styles-only fork, which is the sanctioned shape for exactly this kind of finding.

**Independent Test**: The amended ADR-11 states the two mechanisms, the concrete collision case
(`tabindex`/`for`), whether consolidating is judged worth it, and the reasoning either way. If the
verdict is "not now," the ADR says why (e.g., no element has yet declared such a field, so the
failure is theoretical; consolidating changes gate behaviour and needs its own PR and review, not a
docs mission's unilateral code change).

**Acceptance Scenarios**:

1. **Given** the amended ADR-11, **When** a reader asks "why are there two mechanisms," **Then**
   the answer is in the ADR, not left implicit.
2. **Given** the mission's own boundary (no gate-behaviour changes without flagging to the
   operator), **When** the mission is reviewed, **Then** `scripts/build-react-wrappers.mjs`'s
   `REACT_PROPS`/rename-table interaction is unchanged unless the operator has explicitly said
   otherwise before implementation.

### Edge Cases

- What if the real `MAPPED_PROPS` table changes shape in a future `@wc-toolkit/react-wrappers`
  major and the pattern-match extraction breaks? Already handled in code (fallback + warning);
  the ADR must describe this as the intended degraded mode, not a gap to close here.
- What if a future element declares a field that collides with a `REACT_PROPS` entry after
  renaming? Out of scope to fix; in scope to document as a known rough edge with the assessed
  verdict from User Story 3.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | State the real invariant | As a future element author, I want ADR-11 to state that the wrapper preserves the field set while casing follows React/JSX convention via the generator's internal table, so I know what the gate actually asserts. | High | Open |
| FR-002 | Record the worked example | As a future element author, I want `sk-form-input`'s three renamed fields (`readonly`→`readOnly`, `autocomplete`→`autoComplete`, `inputmode`→`inputMode`) named in the ADR, so I have a concrete precedent rather than an abstract rule. | High | Open |
| FR-003 | Record the non-exported-table fact and the sanctioned pattern | As a reviewer, I want the ADR to state that `MAPPED_PROPS` is not exported, that the gate therefore parses it from the installed bundle rather than mirroring it by hand, and that this is a deliberate, fail-closed coupling to a package internal, so I can hold a future similar PR to the same standard. | High | Open |
| FR-004 | Assess the REACT_PROPS / rename-table duplication | As the operator, I want a written verdict on whether consolidating `REACT_PROPS` and the rename table is worth it, with reasoning either way, and — if the verdict favors consolidation or any gate-behaviour change — a flag to the operator rather than a unilateral code change, so the decision authority stays where it belongs. | High | Open |
| FR-005 | State the contract-doc obligation | As a future element author, I want the ADR to say that an element's own contract doc must record when one of its fields is subject to the React casing rename, using `sk-form-input`'s contract as the worked example, so the obligation is discoverable outside this ADR too. | Medium | Open |
| FR-006 | Record the operator override for writing this ADR | As a future reader of ADR-11, I want the amendment to record, in the shape ADR-10 used for #176, that this write is authorized by the operator's ruling on issue #189 (filed as an ADR fork, not decided in-mission) and is not this loop extending its own authority under the "#67 only" rule. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No code change without a flag | If the FR-004 assessment concludes consolidation is worth doing and it would change gate behaviour, the mission does not implement it — it records the recommendation and defers to the operator. | Process | High | Open |
| NFR-002 | Verifiable against the shipped script | Every claim the amendment makes about `build-react-wrappers.mjs`'s current behaviour must be checked against the file as it exists on this branch before being written, not assumed from the issue text. | Correctness | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | ADR-only scope | The only production artifact this mission changes is `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`. No changes to `scripts/build-react-wrappers.mjs` or any generated wrapper output. | Technical | High | Open |
| C-002 | Commit scope discipline | ADR and `kitty-specs/` commits use the unscoped `docs:` prefix (`docs(adr)`/`docs(specs)` fail commitlint in this repo); headers stay ≤100 chars. | Technical | High | Open |
| C-003 | No hand-edited runtime state | `kitty-specs/` runtime artifacts (meta.json, status.events.jsonl, decisions/) are never hand-edited beyond what the CLI instructs; only `spec.md`, `plan.md`, `tasks.md`/work-package files are authored content. | Technical | High | Open |

### Key Entities

- **ADR-11**: `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`
  — the decision record being amended. The amendment lands in its "Wrapper generation — decided in
  principle, generator deferred" section (or a clearly-marked addendum immediately after it),
  matching how ADR-10 appended the "#176" fork ruling as its own titled subsection rather than
  editing prior prose.
- **`MAPPED_PROPS`**: the not-exported table inside
  `node_modules/@wc-toolkit/react-wrappers/dist/index.js` mapping lowercase HTML field names to
  their React/JSX prop names. Read, not mirrored, by `loadReactPropRenameMap()`.
- **`REACT_PROPS`**: the generator-supplied prop exclusion set in `build-react-wrappers.mjs`
  (className, htmlFor, tabIndex, etc.) — the second mechanism assessed under FR-004.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `grep -i` for `MAPPED_PROPS`, `readOnly`, `autoComplete`, or `inputMode` against the
  amended ADR-11 returns at least one match in a section stating the casing invariant (currently:
  zero matches).
- **SC-002**: The amended ADR names `sk-form-input` and all three of its renamed fields
  (`readonly`/`autocomplete`/`inputmode`) as the worked example.
- **SC-003**: The amended ADR contains an explicit statement of whether `REACT_PROPS` and the
  rename table should be consolidated, with reasoning, distinguishable from prose that merely
  restates the issue's question.
- **SC-004**: The amended ADR contains an override notice for this write, referencing issue #189
  and the operator ruling, in the same subsection shape as ADR-10's `2026-09-02` #176 override
  notice (named deciders/authorization line plus an inline "operator override, recorded for the
  record" paragraph).
- **SC-005**: `scripts/build-react-wrappers.mjs` is byte-identical to its state at branch point
  (`adf85d6`) unless the operator has explicitly authorized a change in the interim — i.e., `git
  diff adf85d6 -- scripts/build-react-wrappers.mjs` is empty at mission close, absent such
  authorization.

## Explicitly out of scope

- Implementing consolidation of `REACT_PROPS` and the rename table, regardless of FR-004's verdict.
- Any change to `build-react-wrappers.mjs`, its tests, or generated wrapper output.
- Re-litigating or re-fixing the casing gate itself (#187's fix stands, verified above).
- Amending any ADR other than ADR-11.
