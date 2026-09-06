# Mission Specification: Probe Validation Seam ADR

**Mission Branch**: `mission/probe-validation-seam-adr`
**Created**: 2026-09-06
**Status**: Draft
**Input**: GitHub issue spec-kitty/spec-kitty-design#188 — "[adr] The detached-probe validation
seam has no ADR, and #179/#122 will both re-derive it."

## Adaptation note (docs-only mission)

This mission produces no application code. Its deliverable is a new doctrine artifact — an ADR
recording the detached-probe validation seam `sk-form-input` (#180, then #187) already shipped.
There is no existing ADR to amend; #188 asks for a **new** decision record (ADR-14), unlike #176
and #189, which each amended an existing one. The template's "user stories" below are read as
**readers of the ADR** (a future implementer of #179 or #122, a reviewer of that work, the
operator), and "requirements" are the specific statements the ADR must make, not application
behaviour to build. There is one work package: author the ADR.

## The scope boundary this spec enforces

#188 asks two different kinds of question, and this mission answers only one of them.

**DESCRIPTIVE (in scope)** — what `sk-form-input` actually shipped and why: a permanently
detached, never-connected `<input>` probe, synced from the element's own reactive properties on
every `validate()` call, read for constraint-validity flags, because `validate()` runs from
`willUpdate()` — before Lit commits this update's attribute/property bindings to the rendered
control — so the rendered control's `.validity` at read time still reflects the *previous*
render, not the one about to commit. This includes: the measured pre-fix failure
(`pattern="[a-z]+"`, `el.value = '123'` → host reports valid, a real submit succeeds with
`123`); the `badInput` exception (merged from the REAL rendered control, never the probe, because
`badInput` is set only by the UA's own response to genuine keystrokes — measured directly, a
property assignment never raises it); the `#onInput` regression and its fix (the badInput-guarded
`this.value = control.value` write becomes a no-op when a user undoes a bad keystroke back to the
identical prior value, so Lit's dirty-check schedules no update, `willUpdate()` never re-runs, and
the field is left invalid forever — fixed by calling `validate()` unconditionally from
`#onInput`, not only inside the write-guard branch); and the alternative `research.md` R2
originally rejected — hand-reimplementing constraint validity ("a second source of truth that
could disagree with the UA's own judgement") — restated against what shipped, because the probe
**is** a second UA-computed source (two separate objects, each computing its own `ValidityState`),
which is a different mechanism from what R2's rejection described but carries a related risk, one
that materialized three times during #180's own development (see below). That restatement is
descriptive: it corrects the record, it does not re-decide anything.

**PRESCRIPTIVE (explicitly out of scope)** — whether the detached probe is the *sanctioned
pattern* for #179 (`sk-time-series-chart`) and #122 (shared `form-control-base`) to reuse, or
whether post-render revalidation is the preferred general shape, is an architectural choice no
existing ADR covers and this mission does not settle it. The ADR records the open question and
states plainly that it is owed to the operator. Same for #188's second question (what invariant
ties probe, rendered control and `setFormValue` together) — R9 already records the operator's
ruling on one narrow slice of that question (value authority: detect-and-flag, keep `setFormValue`
raw), and this ADR restates that ruling as context, but the broader three-way invariant question
stays open, exactly as #188 poses it.

## Operator authorization for writing this ADR

Per `docs/architecture/elements-first-run-prompt.md` §4 ("ADRs 8–13 pin every decision these
missions need, and ADRs are written only in #67") and its "What this loop must never do" list
("Write an ADR outside #67"), writing an ADR here is normally forbidden. Issue #188 is filed as
`[adr]`, raised by the pre-merge gate on #187 rather than decided there ("Filed rather than
decided, per the operator ruling that forks go to issues while the ADR route is closed") — the
same shape #176 (amending ADR-10) and #189 (amending ADR-11) were filed and authorized in. The new
ADR must record this override inline, dated, in the shape ADR-10's and ADR-11's override notices
use: naming the issue, the fact that it was filed rather than decided, and that the write is under
that specific authorization rather than this loop's own extension of the "#67 only" rule.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A future implementer of #179 or #122 reads the ADR before touching validity merging (Priority: P1)

`sk-time-series-chart` (#179) and the shared `form-control-base` (#122) both face "merge UA
validity flags from a pre-render hook." `sk-form-textarea` is already a near line-for-line clone
of `sk-form-input`, so without a record, the second and third implementations independently
re-derive the same mechanism — or worse, re-derive the two bugs #180 already found and fixed.

**Why this priority**: This is the exact cost #188 exists to prevent — "the only durable record
today is one element's `//` comments plus one mission's contract file."

**Independent Test**: Read the ADR and confirm it states, without opening
`sk-form-input.ts`: (a) the timing constraint (`willUpdate` precedes the current update's render
commit) that makes a rendered-control read wrong on the mount pass and, if naively fixed by
syncing the rendered control instead, still wrong for a field that mounts already-invalid; (b) the
detached-probe mechanism, created once, synced by property assignment (never rendered, never
connected); (c) the `badInput` exception and why it cannot be merged from the probe; (d) the
`#onInput` no-op regression and its unconditional-revalidate fix; (e) that whether this pattern is
*sanctioned* for reuse is an open question, not settled here.

**Acceptance Scenarios**:

1. **Given** the ADR, **When** a #179 or #122 implementer greps it before writing their own
   `validate()`-equivalent, **Then** they find the mechanism, its rationale, and the exception,
   without re-reading `sk-form-input.ts`'s comments from scratch.
2. **Given** the ADR's open-question section, **When** the same implementer asks "can I just copy
   this," **Then** the ADR tells them that question is unresolved and named to the operator, not
   answered either way.

---

### User Story 2 - A reviewer of a future validity-merging PR checks the rejected-alternative record for honesty (Priority: P1)

`research.md` R2 rejected "a second source of truth that could disagree with the UA's own
judgement" as an alternative, on the grounds that it would be a needless reimplementation of what
the UA already computes correctly. The probe that shipped **is** a second source (a second,
independently-synced object producing its own `ValidityState`) — the rejection's premise needs
restating against what was actually built, not quietly left as if it still applies unmodified.

**Why this priority**: Leaving a superseded rejection standing unexamined is exactly the kind of
drift #188 was filed to stop, and the operator context names this as a required lesson from the
last three missions: "before you write a summary claim, find the case that would break it."

**Independent Test**: The ADR states plainly that the probe is a second UA-computed source, that
the two-sources risk R2 originally named did not evaporate by choosing the probe design, and that
it recurred in a different form: #180's own development history hit three separate, measured
timing/sync bugs across three passes (read-before-write against the previous render; a `?? ''`
pattern-compilation bug on the "sync the rendered control" fix; a probe type-then-value
assignment-order bug), each of which was exactly a divergence between the two sources caused by
imperfect synchronization rather than by reimplementing the wrong algorithm. The ADR does not
claim this risk is closed — it records it as a live property of the shipped design, mitigated by
narrow, tested synchronization rules, not eliminated.

**Acceptance Scenarios**:

1. **Given** the ADR, **When** a reviewer checks whether the second-source risk was "solved" or
   merely "moved," **Then** the ADR states it was moved (from an algorithm-reimplementation risk
   to a synchronization risk) and names the three measured incidents as evidence, rather than
   implying the probe design closes the question R2 raised.

---

### User Story 3 - The operator receives the two questions #188 asks that this mission does not answer (Priority: P1)

#188 asks whether the probe is the sanctioned pattern for #179/#122, and what invariant ties
probe, rendered control and `setFormValue` together. Both are architectural calls this mission is
explicitly forbidden from making.

**Why this priority**: The operator context is explicit: "Do not settle it... I will take it to
them." Silently deciding either question, or silently omitting them, both defeat the purpose of
filing this as an ADR fork.

**Independent Test**: The ADR contains a clearly labeled "Open questions" section naming both
forks verbatim (sanctioned-pattern-or-not; the three-way invariant), stating for each what is
already known (this mission's descriptive findings) and what remains undecided, with no
recommendation phrased as a settled conclusion.

**Acceptance Scenarios**:

1. **Given** the ADR, **When** a reader searches for the word "should" applied to whether #179/
   #122 must reuse the probe, **Then** no such sentence exists — the ADR states the fork and
   defers, it does not lean.
2. **Given** the ADR's "Open questions" section, **When** the operator reads it, **Then** they
   have enough of the measured record (mechanism, exception, regression, restated rejection) to
   rule on both forks without re-deriving them from `sk-form-input.ts` themselves.

### Edge Cases

- What if a future reader conflates "detached probe" with "no second source of truth risk"? The
  ADR must foreclose that reading directly (User Story 2).
- What if the ADR's own "worked example" (the `#onInput` regression) is read as proof the pattern
  is now safe in general? The ADR must not claim that — it states the specific bug and specific
  fix, not a general safety property.
- What happens to R9 (value authority) if a reader assumes this ADR settles the three-way
  invariant question? The ADR must state that R9 settled one narrow slice (submission stays raw;
  divergence is detected, not sanitized) and that the broader invariant remains open.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Record the timing constraint and the mechanism | As a future #179/#122 implementer, I want the ADR to state why `willUpdate` cannot read the rendered control's validity, and the detached-probe mechanism that solves it (created once, synced by property assignment, never rendered or connected), so I understand the constraint before reusing or replacing the pattern. | High | Open |
| FR-002 | Record the measured pre-fix failure | As a reviewer, I want the ADR to state the concrete pre-fix failure `pattern="[a-z]+"` + `el.value = '123'` → host reports valid, real submit succeeds with `123` — as the demonstrated cost of getting the timing wrong. | High | Open |
| FR-003 | Record the `badInput` exception | As a future implementer, I want the ADR to state that `badInput` is merged from the REAL rendered control, never the probe, because it is set only by the UA's response to genuine keystrokes and a property assignment can never raise it — measured, not assumed. | High | Open |
| FR-004 | Record the `#onInput` regression and its fix | As a reviewer, I want the ADR to state the specific regression (the badInput-guarded value write becomes a no-op on an undo-to-identical-value, leaving `willUpdate` unscheduled and the field permanently invalid) and its fix (`validate()` called unconditionally from `#onInput`), so a future clone of this pattern does not drop the fix along with the mechanism. | High | Open |
| FR-005 | Restate the R2 rejected alternative against what shipped | As a reviewer, I want the ADR to state that the probe is itself a second UA-computed source, that R2's original two-sources concern did not evaporate, and that it recurred as three measured synchronization bugs during #180's own development, so the historical rejection is not left implying a guarantee the shipped design does not provide. | High | Open |
| FR-006 | State R9 as settled context, not settled invariant | As a reader, I want the ADR to state R9's value-authority ruling (submission stays raw; a type-unrepresentable non-empty value is detected as the programmatic analogue of `badInput`) as already-decided context, while explicitly not extending that ruling into an answer for the broader three-way invariant question #188 raises. | Medium | Open |
| FR-007 | State the two open questions, unresolved, for the operator | As the operator, I want the ADR's "Open questions" section to name both forks from #188 verbatim (sanctioned pattern or not; the three-way invariant) without recommending an answer to either, so the decision authority stays with me. | High | Open |
| FR-008 | Record the operator override for writing this ADR | As a future reader, I want the ADR to record, in the shape ADR-10 and ADR-11 used, that this write is authorized by the operator's ruling on issue #188 (filed as an ADR fork, not decided in-mission) and is not this loop extending its own authority under the "#67 only" rule. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No prescriptive claim smuggled into descriptive prose | Every sentence describing what #179/#122 "should" do is either absent or explicitly attributed to the unresolved open-question section — never asserted as this ADR's own conclusion. | Process | High | Open |
| NFR-002 | Verified against the shipped source, not the issue's prose | Every claim about `sk-form-input.ts`'s current behaviour is checked against the file and, where a matching assertion exists, the real test in `fixtures/elements-behaviour/src/sk-form-input.test.ts`, before being written — not assumed from #188 or `research.md` alone. | Correctness | High | Open |
| NFR-003 | Unverified claims are named as such | Any claim this mission could not verify directly (e.g., the generator's `class`/`for`-shaped edge cases some other ADR left untraced) is not extended by inference in this ADR; only what was traced is asserted, and gaps are named rather than silently assumed closed. | Correctness | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | New-ADR-only scope | The only production artifact this mission creates is a new ADR file under `docs/architecture/decisions/` (ADR-14). No changes to `packages/elements/src/form-input/sk-form-input.ts`, its tests, or any other shipped code. | Technical | High | Open |
| C-002 | Commit scope discipline | ADR and `kitty-specs/` commits use the unscoped `docs:` prefix (`docs(adr)`/`docs(specs)` fail commitlint in this repo); headers stay ≤100 chars; CLI-authored commit messages that fail commitlint are rewritten with `git filter-branch --msg-filter` over `base..HEAD` before push, with the tree asserted unchanged afterward. | Technical | High | Open |
| C-003 | No hand-edited runtime state | `kitty-specs/` runtime artifacts (`meta.json`, `status.events.jsonl`, `decisions/`) are never hand-edited beyond what the CLI instructs; only `spec.md`, `plan.md`, `tasks.md`/work-package files, and the ADR itself are authored content. | Technical | High | Open |

### Key Entities

- **ADR-14** (new): `docs/architecture/decisions/2026-09-06-14-detached-probe-validation-seam.md`
  — the new decision record this mission creates, documenting the mechanism `sk-form-input`
  shipped in #180/#187.
- **`#probe`**: `packages/elements/src/form-input/sk-form-input.ts`'s private, permanently
  detached `HTMLInputElement`, created once in the field initializer, never appended to any
  document, synced on every `validate()` call.
- **`research.md` R2**: `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/research.md`'s
  section recording the probe mechanism's three-pass history and its originally-rejected
  alternative — read, restated, not amended by this mission.
- **`research.md` R9**: the same file's section recording the operator's value-authority ruling —
  cited as settled context, explicitly not extended into an answer for #188's broader invariant
  question.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The new ADR exists at `docs/architecture/decisions/2026-09-06-14-detached-probe-
  validation-seam.md` and states the timing constraint, the detached-probe mechanism, the
  `badInput` exception, and the `#onInput` regression/fix, each traceable to a specific line range
  or test in the current source.
- **SC-002**: The ADR contains an explicit restatement of R2's rejected alternative against the
  shipped design, naming the three measured synchronization bugs from #180's development history
  as evidence that the two-sources risk moved rather than closed.
- **SC-003**: The ADR contains an "Open questions" section naming both #188 forks (sanctioned
  pattern for #179/#122; the three-way probe/control/`setFormValue` invariant) with no
  recommended answer to either, and a citable, quotable form the operator can act on directly.
- **SC-004**: The ADR contains an override notice for this write, referencing issue #188 and the
  operator ruling, in the same subsection shape as ADR-10's `#176` and ADR-11's `#189` override
  notices (named deciders/authorization line plus an inline "operator override, recorded for the
  record" paragraph).
- **SC-005**: `packages/elements/src/form-input/sk-form-input.ts` and
  `fixtures/elements-behaviour/src/sk-form-input.test.ts` are byte-identical to their state at
  branch point (`1405e75`) — i.e., `git diff 1405e75 -- packages/elements/src/form-input/sk-form-input.ts fixtures/elements-behaviour/src/sk-form-input.test.ts` is empty at mission close.

## Explicitly out of scope

- Deciding whether the detached probe is the sanctioned pattern for #179 or #122.
- Deciding the invariant tying probe, rendered control and `setFormValue` together.
- Any change to `packages/elements/src/form-input/sk-form-input.ts` or its tests.
- Amending any existing ADR (8 through 13) — this mission creates a new one.
- Re-litigating R9's value-authority ruling.
