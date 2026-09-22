# Implementation Plan: Button Tone Record and Commit Exemptions

**Branch**: `mission/button-tone-record-and-commit-exemptions` | **Date**: 2026-09-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/kitty-specs/button-tone-record-and-commit-exemptions-01M28PMT/spec.md`

## Summary

Two independent, low-risk fixes bundled into one mission because both are small and neither
changes rendered output:

1. **#420** — `commitlint.config.cjs`'s `SPEC_KITTY_AUTO_COMMIT_PATTERNS` array is missing
   anchored exemptions for three exact commit-message shapes the installed `spec-kitty-cli`
   emits from `tracer_writer.py:277`, `retrospect.py:431`, and `retrospect.py:845`. Add three
   new anchored, vocabulary-closed regex predicates in the file's established style, and extend
   `scripts/check-commitlint-config.mjs`'s `generatedMessages`/`nearMisses` arrays to prove both
   that the real messages pass and that near-misses still fail.
2. **#403** — Write a new ADR under `docs/architecture/decisions/` recording that
   `BUTTON_VARIANTS` (`packages/elements/src/button/sk-button.markup.ts:20-25`) flattens a
   tone × intensity product into one string enum, state the codegen-source fact (the generator
   derives one static export per key, feeding `custom-elements.json` and the generated React
   wrappers), state the ceiling of the current shape and/or the migration shape for a
   hypothetical `danger-primary`, and reference #348. Index the record in
   `docs/architecture/README.md`'s ADR table. No source code changes.

## Technical Context

**Language/Version**: Node.js (commitlint config is CommonJS `.cjs`); TypeScript for the button
markup source (read-only for this mission); Markdown for the ADR.
**Primary Dependencies**: `@commitlint/config-conventional`, `@commitlint/lint`, `@commitlint/load`
(already installed; used by `scripts/check-commitlint-config.mjs` and by CI's `lint-code` job).
**Storage**: N/A (static config + markdown files).
**Testing**: `node scripts/check-commitlint-config.mjs` (asserts ignore + lint outcomes for real
and near-miss messages); `node scripts/check-adr-index.mjs` (asserts the ADR table is complete
and status-consistent); `npm run quality:lint` / `npm run quality:all` for the repo's normal gate
suite.
**Target Platform**: N/A — repository tooling and documentation only.
**Project Type**: Single repo, tooling + docs change (no `src/` application code).
**Performance Goals**: N/A.
**Constraints**: No `scope-enum` additions (C-001); no code change to `sk-button.markup.ts` or
`sk-button.css` (C-002); the ADR must not assert an operator ratification it does not have
(Status: Proposed, not Accepted).
**Scale/Scope**: Two files edited for #420 (`commitlint.config.cjs`,
`scripts/check-commitlint-config.mjs`); two files for #403 (new ADR file,
`docs/architecture/README.md`'s index table).

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Per the charter's Review Policy and `docs/architecture/elements-first-programme.md`'s risk tiers:
this is a **routine** mission (no rendered output change, no token/component change, no PR-facing
visual diff) — it relies on the merge-gate adversarial squad alone; no post-spec/post-plan/
post-tasks squad point-cut is required. `DIRECTIVE_030` (automated tests/static gates before
handoff) applies and is satisfied by running `check-commitlint-config.mjs`, `check-adr-index.mjs`,
and `quality:lint` before declaring the WP ready for review. No token, component, or Storybook
change occurs, so the screenshot/visual-diff and token-sign-off clauses do not apply. PASS.

## Project Structure

### Documentation (this mission)

```
kitty-specs/button-tone-record-and-commit-exemptions-01M28PMT/
├── plan.md              # This file
├── spec.md              # Mission specification (committed)
└── tasks/                # WP files (Phase 2, /spec-kitty.tasks)
```

No `research.md`, `data-model.md`, `quickstart.md`, or `contracts/` are generated — both issues
are grounded directly in already-read source (the installed CLI, `commitlint.config.cjs`,
`sk-button.markup.ts`, `sk-button.css`, `docs/architecture/README.md`'s existing ADRs), and
neither introduces a data model or contract surface.

### Source Code (repository root)

```
commitlint.config.cjs                          # #420: add 3 anchored ignore predicates
scripts/check-commitlint-config.mjs             # #420: extend generatedMessages + nearMisses
docs/architecture/decisions/
└── 2026-09-11-17-sk-button-tone-intensity-flattening.md   # #403: new ADR (Proposed)
docs/architecture/README.md                     # #403: add the new ADR's row to the index table
```

**Structure Decision**: Single project — this is a documentation/tooling-config mission with no
application source tree. Both changes land in their already-established repo locations
(`commitlint.config.cjs` + its self-test script at repo root/`scripts/`; the ADR under
`docs/architecture/decisions/` per the directory `check-adr-index.mjs` treats as the source of
truth). ADR number 17 follows ADR-16 (2026-09-10), the last record in the index.

## Complexity Tracking

*No Charter Check violations — table omitted.*

## Implementation Concern Map

### IC-01 — Anchored commitlint exemptions for the three real CLI message shapes

- **Purpose**: Stop spec-kitty's own `tracer-append` and `retrospect create`/`backfill`
  auto-commits from failing `[ENFORCED] commitlint (FR-020)` on a pushed mission branch.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, NFR-002, C-001.
- **Affected surfaces**: `commitlint.config.cjs` (`SPEC_KITTY_AUTO_COMMIT_PATTERNS` array only —
  no `rules`/`scope-enum` edit); `scripts/check-commitlint-config.mjs` (`generatedMessages`,
  `nearMisses` arrays only).
- **Sequencing/depends-on**: none.
- **Risks**: An unbounded pattern (e.g. matching any `category` word or any `mission_slug`
  shape) would blanket-exempt unrelated commits sharing the same prefix — mitigated by closing
  each pattern over the real, enumerated `TRACER_CATEGORIES` vocabulary
  (`tooling-friction`/`approach`/`design-decisions`) and the established mission-slug shape
  (`[a-z0-9]+(?:-[a-z0-9]+)*-01[A-Z0-9]{6,}`) already used by every neighbouring pattern in the
  file, and by proving at least one near-miss per pattern still fails.

### IC-02 — ADR recording the sk-button tone × intensity flattening

- **Purpose**: Give the #403 question (raised twice at #341's pre-merge gate and dropped both
  times) a durable, indexed answer: what the flattened `BUTTON_VARIANTS` enum costs today and
  what changes if `danger-primary` is ever needed.
- **Relevant requirements**: FR-005, FR-006, FR-007, NFR-001, C-002.
- **Affected surfaces**: new file `docs/architecture/decisions/2026-09-11-17-sk-button-tone-
  intensity-flattening.md`; one new row in `docs/architecture/README.md`'s `## Decisions (ADRs)`
  table.
- **Sequencing/depends-on**: none (independent of IC-01).
- **Risks**: `scripts/check-adr-index.mjs` enforces the record's Status field matches the index
  row's Status column and refuses an unindexed file — mitigated by running the gate after
  writing both files, before declaring the WP done.
