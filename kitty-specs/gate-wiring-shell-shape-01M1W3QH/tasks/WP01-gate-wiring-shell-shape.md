---
work_package_id: WP01
title: Read the gate's shell as shape, invert the step-neutering rule, and ship the probe table
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- NFR-001
- NFR-002
- C-001
- C-002
planning_base_branch: mission/gate-wiring-shell-shape
merge_target_branch: mission/gate-wiring-shell-shape
branch_strategy: Planning artifacts for this mission were generated on mission/gate-wiring-shell-shape. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/gate-wiring-shell-shape unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - the wiring checker
history:
- at: '2026-09-06T19:45:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: scripts/check-gate-wiring.mjs
create_intent:
- scripts/check-gate-wiring-defeats.mjs
owned_files:
- scripts/check-gate-wiring.mjs
- scripts/check-gate-wiring-defeats.mjs
- .github/workflows/ci-quality.yml
execution_mode: planning_artifact
model: ''
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – The wiring checker reads shape, not text

Closes #202 and #205. See `plan.md` §2 for the design and the pre-fix measurement table.

## T001 — a logical-line reader

Add, inside `scripts/check-gate-wiring.mjs`, a reader that strips whole-line `#` comments, joins
`\`-continuations, and returns trimmed logical lines, plus a depth tracker that counts
`if`/`case`/`for`/`while`/`until` against `fi`/`esac`/`done` at word level over a copy with
`${{ … }}` masked.

## T002 — FR-001, FR-002: the gate's disjunction, by shape

Replace the `strict` and `lintStrict` regex tests with membership in the disjunct set of the
step's **gating conditionals** — depth-0 `if … ; then` whose then-branch exits non-zero. Refuse a
condition that is not a pure `||` chain of single bracket tests. Refuse the absence of any gating
conditional. Compare clauses after whitespace normalisation, inside `${{ … }}` included.

## T003 — FR-003: one swallow rule, shared

Merge `neutered()`'s enumerated `||` clause and the inverted `[ENFORCED]` rule into one
`swallows(body)` helper used by both. Allow exactly one `||` right-hand form — a provable
non-zero exit (`exit N`, `{ …; exit N; }`) — and refuse every other, so unrecognised spellings
fail closed. `lint-code`'s manifest step is the tree's one legitimate instance and must stay
green (NFR-002).

## T004 — NFR-001: the probe table

`scripts/check-gate-wiring-defeats.mjs`: the eight defeats from `plan.md` §1, each applied to a
copy of the workflow in a temp directory that the unmodified checker is run against via `cwd`.
A control case requires the unmodified workflow to pass; an empty table is refused. Register it
in `REQUIRED_LINT` and give it a `[ENFORCED]` CI line in the same change.

## Definition of done

- Every defeat in `plan.md` §1 exits 1 with a message naming it.
- `node scripts/check-gate-wiring.mjs` exits 0 on the unmodified tree.
- No shell grammar is vendored or implemented (C-001); unrecognised constructs are reported (C-002).
