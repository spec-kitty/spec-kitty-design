# Tasks: gate-wiring-shell-shape

**Input**: `plan.md`, `spec.md`
**Branch**: `mission/gate-wiring-shell-shape` (planning base **and** merge target — `single_branch`
topology; the PR onto `train/elements-first` is the operator's step, not this loop's).

Five approved follow-up issues. Two of them (#202, #205) are one file's two independent holes and
share a logical-line reader, so they are one work package rather than two. The other three are
independent surfaces with no shared code.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | A logical-line reader and word-level depth tracker for `run:` bodies (FR-001, C-001) | WP01 | |
| T002 | The gate's failure disjunction asserted by shape: gating conditionals, pure `\|\|` chains of bracket tests, non-zero exit (FR-001, FR-002, C-002) | WP01 | |
| T003 | One shared `swallows()` rule replacing the enumerated `neutered()` clause, with a single allow-listed raising fallback (FR-003, NFR-002) | WP01 | |
| T004 | `scripts/check-gate-wiring-defeats.mjs` — eight defeats plus a control, registered and CI-wired in the same change (NFR-001) | WP01 | |
| T005 | Remove sk-card's inert forced-colors block; state the real mechanism in the comment; regenerate cache-free (FR-005) | WP02 | [P] |
| T006 | `ForcedColors` stops being a byte-identical copy of `AllStatuses`; id and `expected-stories.json` unchanged (FR-004, NFR-003) | WP02 | [P] |
| T007 | The Playwright forced-colors assertion, with a Chromium floor so it cannot be vacuous (FR-004) | WP02 | [P] |
| T008 | `sad-lite.md:10` points at the gated ADR table (FR-006) | WP03 | [P] |
| T009 | `card-status-tone-axis-01M1VJNY/issue-matrix.json` filled via the CLI seam; the scraped `#146` row removed (FR-007, C-003) | WP03 | [P] |

T001–T004 are sequential: T002 and T003 both consume T001's reader, and T004 is the probe table
for both. T005–T009 touch disjoint files and carry `[P]`.

## Work Packages

### WP01 — The wiring checker reads shape, not text

- **Goal**: close #202 and #205 in `scripts/check-gate-wiring.mjs`, and make both closures
  re-runnable in `scripts/check-gate-wiring-defeats.mjs`.
- **Priority**: P0 — fourteen enforced gates reach the merge decision through the clause #202
  defeats, and every one of them is audited by the test #205 defeats.
- **Independent test**: `node scripts/check-gate-wiring-defeats.mjs` exits 0 (control passes,
  eight defeats refused); `node scripts/check-gate-wiring.mjs` exits 0 on the unmodified tree.
- **Included subtasks**: T001, T002, T003, T004.
- **Dependencies**: none.
- **Risks**: a shape rule that reds the shipped tree. Mitigated by the control case and by a full
  local sweep of every `lint-code` gate.

### WP02 — sk-card forced colors

- **Goal**: close #218 — the story asserts something, and no CSS declaration claims work it does
  not do.
- **Priority**: P1.
- **Independent test**: the new Playwright case fails when the status card's inline-start border
  stops being wider than the base card's; `git diff` shows `expected-stories.json` unchanged.
- **Included subtasks**: T005, T006, T007.
- **Dependencies**: none.
- **Risks**: forced-colors emulation differs per browser — handled by asserting the mechanism
  unconditionally and the collapse behind an engaged-check with a floor.

### WP03 — The two records

- **Goal**: close #201 and #221.
- **Priority**: P2.
- **Independent test**: no ADR range expression in `sad-lite.md`; no placeholder string and no
  non-delivered row in the card mission's `issue-matrix.json`.
- **Included subtasks**: T008, T009.
- **Dependencies**: none.
- **Risks**: editing a terminal mission's artefact outside the CLI desyncs runtime state — the
  `#177` row is written through `spec-kitty agent issue-verdict` for that reason.
