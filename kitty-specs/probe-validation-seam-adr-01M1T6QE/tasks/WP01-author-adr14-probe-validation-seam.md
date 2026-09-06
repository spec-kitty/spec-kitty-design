---
work_package_id: WP01
title: Author ADR-14 — the detached-probe validation seam
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
planning_base_branch: mission/probe-validation-seam-adr
merge_target_branch: mission/probe-validation-seam-adr
branch_strategy: Planning artifacts for this mission were generated on mission/probe-validation-seam-adr. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/probe-validation-seam-adr unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
phase: Phase 1 - ADR authoring
history:
- at: '2026-09-06T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: docs/architecture/decisions/
create_intent:
- docs/architecture/decisions/2026-09-06-14-detached-probe-validation-seam.md
execution_mode: planning_artifact
model: ''
owned_files:
- docs/architecture/decisions/2026-09-06-14-detached-probe-validation-seam.md
role: implementer
tags: []
task_type: docs
tracker_refs: []
---

# Work Package Prompt: WP01 – Author ADR-14: the detached-probe validation seam

## Goal

Create `docs/architecture/decisions/2026-09-06-14-detached-probe-validation-seam.md` (ADR-14),
recording the detached-probe validation seam `sk-form-input` shipped in #180/#187, per the scope
boundary in `spec.md`. No code changes.

## Context already verified (do not re-derive from the issue text alone)

- `packages/elements/src/form-input/sk-form-input.ts`'s `willUpdate()` calls `validate()` before
  `render()` commits the current update's bindings, so on every pass — mount included — the
  rendered `<input>`'s `.validity` at read time reflects the PREVIOUS render, not the one about to
  commit. The private `#probe: HTMLInputElement` field (created once, never appended to any
  document) is synced from the element's own reactive properties on every `validate()` call, and
  its `.validity` is read instead for `patternMismatch`/`rangeUnderflow`/`rangeOverflow`/
  `stepMismatch`/`typeMismatch`.
- The measured pre-fix failure: `pattern="[a-z]+"`, then `el.value = '123'` — host reported valid,
  a real `form.requestSubmit()` succeeded with `123` in `FormData` (`research.md` R2, pass 2's
  finding).
- `badInput` is merged from the REAL rendered control, never the probe — measured directly: a
  property assignment (which is all the probe ever receives) never raises `badInput` on a bare
  native `<input>`, even with a dispatched `input` event; only genuine user keystrokes do.
  Verified against the real test `[SC-003] badInput reaches the host — REAL typing only, never a
  property assignment` in `fixtures/elements-behaviour/src/sk-form-input.test.ts`.
- The `#onInput` regression: while `badInput` is true the guarded write `this.value =
  control.value` is skipped (so the UA's raw, in-progress edit buffer is not overwritten by a
  next-render `.value=` commit); but that guard means a user who types a bad character and undoes
  it back to the IDENTICAL prior value produces a no-op assignment — Lit's dirty-check sees
  `this.value` unchanged, never reschedules `willUpdate()`, and the invalid state computed while
  `badInput` was momentarily true is left standing forever. Fixed by calling `validate()`
  unconditionally at the end of `#onInput`, not only from the write-guard branch. Verified against
  the real test `[SC-003] undoing a bad keystroke back to the IDENTICAL prior value still
  re-validates — the unconditional validate() fix` in the same test file.
- `research.md` R2's originally-rejected alternative ("re-deriving each constraint's validity in
  the element itself... a second source of truth that could disagree with the UA's own judgement")
  is a DIFFERENT mechanism than what shipped: rejecting hand-reimplementation of the UA's
  algorithm, not the probe design. But the probe **is** a second UA-computed source (its own
  `ValidityState`, independently synced) — the state it computes could, in principle, diverge from
  what the real control would compute. That risk recurred three times during #180's own
  development, per `research.md` R2's "History" subsection: (1) the original read-before-write
  timing bug; (2) the squad-fold revision's `?? ''`-pattern-compilation bug when the prescribed fix
  was "sync the rendered control"; (3) the pre-merge debugger lens's probe type-then-value
  assignment-order bug (`type` must be assigned before `value`, or a same-update `type`+`value`
  change validates the new value against the stale type). Each is a synchronization bug, not a
  reimplementation-of-the-algorithm bug — a different mechanism from R2's original concern, but the
  same underlying risk class (two sources, one relationship that must be kept exactly right).
- `research.md` R9 records the operator's ruling on value authority (already settled, cite as
  context, do not re-decide): `setFormValue(this.value)` stays raw; a non-empty `this.value` the
  current type cannot represent (probe's synced `.value` comes back empty against a non-blank
  property) is merged as the programmatic analogue of `badInput`, via the same fallback message
  table entry.
- ADR-10 (`docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md`) and
  ADR-11 (`docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`)
  each carry an operator-override notice for writing/amending an ADR outside #67 — ADR-10's for
  issue #176, ADR-11's for issue #189. Match their shape: who ruled, that the issue was filed
  rather than decided by the mission that raised it, and that the section exists under that
  specific, recorded authorization.

## Subtasks

### T001 — State the timing constraint, the mechanism, and the `badInput` exception (FR-001, FR-003)

Write the ADR's "Context and Problem Statement" / "Decision Outcome" sections stating:

- Why `willUpdate()` cannot read the rendered control's validity (the previous-render problem,
  including that a field mounting already-invalid cannot be fixed by merely syncing the rendered
  control first, because the control does not exist yet on the first `willUpdate` pass at all).
- The detached-probe mechanism: created once, never rendered or connected, synced from `this.type`/
  `this.value`/`this.pattern`/`this.min`/`this.max`/`this.step` on every `validate()` call, with
  `type` assigned before `value` (see the assignment-order bug above).
- The `badInput` exception: merged from the real rendered control, not the probe, because it is set
  only by genuine keystrokes — state this as a measured fact, citing the real test named above.

### T002 — Record the measured pre-fix failure and the `#onInput` regression/fix (FR-002, FR-004)

Add a subsection recording, as concrete measured incidents rather than abstract risk:

- The pre-fix failure (`pattern="[a-z]+"` + `el.value = '123'` → host valid, real submit succeeds
  with `123`).
- The `#onInput` no-op regression (undo-to-identical-value leaves the field permanently invalid)
  and its fix (unconditional `validate()` call), citing the real test named above.

### T003 — Restate R2's rejected alternative; cite R9 as settled context, not extended (FR-005, FR-006)

Add a subsection that:

- States plainly that the probe is itself a second, independently-synced, UA-computed source of
  validity — not the same mechanism R2's original rejection described (hand-reimplementing the
  constraint algorithm), but a design that carries a related risk: two sources whose relationship
  must be kept exactly right.
- Names the three measured synchronization bugs from #180's own development history (read-before-
  write timing; the `?? ''`/sync-the-rendered-control fix's pattern-compilation bug; the probe
  assignment-order bug) as evidence that this risk recurred in a different form, not that it was
  eliminated by choosing the probe design.
- Does NOT propose an alternative design or claim the risk is now closed — this is a restatement of
  history against the shipped code, not a re-decision.
- Cites R9's value-authority ruling (raw submission; type-unrepresentable non-empty value merges as
  the `badInput` analogue) as already-settled context, and states explicitly that this settles only
  that one narrow slice — not the broader three-way invariant question in T004 below.

### T004 — State the two open questions, unresolved (FR-007)

Add an "Open Questions" section (or equivalently titled, clearly separated section) that states,
without recommending an answer to either:

1. Whether the detached probe is the sanctioned pattern for #179 (`sk-time-series-chart`) and #122
   (shared `form-control-base`) to reuse for their own "merge UA flags from a pre-render hook"
   need, or whether post-render revalidation is the preferred general shape.
2. What invariant ties the probe, the rendered control, and `setFormValue` together — R9 settled
   the value-authority slice of this question (submission stays raw, divergence is detected); the
   broader invariant remains open.

Before writing this section, re-read every sentence for the word "should" applied to either
question — if a sentence tells a reader what #179/#122 should do, rewrite it as a statement of what
is unresolved instead. This section is a handoff to the operator, not a recommendation.

### T005 — Operator-override notice (FR-008)

Add a notice, in the shape of ADR-10's #176 / ADR-11's #189 sections, stating: ADRs are ordinarily
written only in #67 (closed); `elements-first-run-prompt.md` §4 states "ADRs 8–13 pin every
decision these missions need, and ADRs are written only in #67" and lists "Write an ADR outside
#67" under what the loop must never do; issue #188 was filed as an ADR fork rather than decided in
the #187 mission, per the operator ruling that forks go to issues while the ADR route is closed —
the same shape #176 and #189 were authorized in; this new ADR is written under that specific,
recorded authorization. Name the issue number and date.

## Definition of done

- All five subtasks landed as one coherent new ADR file (a single logical authoring pass is fine as
  one commit; splitting per-subtask is not required).
- `spec.md`'s SC-001 through SC-005 all hold (verify each one explicitly before calling this WP
  done — see `spec.md` "Success Criteria").
- `git diff 1405e75 -- packages/elements/src/form-input/sk-form-input.ts
  fixtures/elements-behaviour/src/sk-form-input.test.ts` is empty.
- Commit uses the unscoped `docs:` prefix, header ≤100 chars (`docs(adr)` FAILS commitlint in this
  repo — do not use it).

## Risks

- Do not let T003's restatement drift into re-deciding R2 or proposing a replacement design — it
  is a historical correction, not a new decision.
- Do not let T004's open-questions section drift into a recommendation by tone, even without an
  explicit "should" sentence — re-read against `spec.md` NFR-001 before commit.
- Re-verify every line-range/test-name citation against the actual files on this branch before
  writing them into the ADR — cited above from direct reads, but re-check before publishing, since
  this ADR's whole credibility rests on being more reliable than the `//` comments it supersedes as
  the durable record.
