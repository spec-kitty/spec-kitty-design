---
work_package_id: WP01
title: spec-kitty commit exemptions and sk-button tone-flattening ADR
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- NFR-001
- NFR-002
- C-001
- C-002
- C-003
planning_base_branch: mission/button-tone-record-and-commit-exemptions
merge_target_branch: mission/button-tone-record-and-commit-exemptions
branch_strategy: Planning artifacts for this mission were generated on mission/button-tone-record-and-commit-exemptions. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/button-tone-record-and-commit-exemptions unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
history: []
agent_profile: node-norris
authoritative_surface: commitlint.config.cjs
create_intent:
- docs/architecture/decisions/2026-09-11-17-sk-button-tone-intensity-flattening.md
execution_mode: code_change
model: ''
owned_files:
- commitlint.config.cjs
- scripts/check-commitlint-config.mjs
- docs/architecture/decisions/2026-09-11-17-sk-button-tone-intensity-flattening.md
- docs/architecture/README.md
- llms-full.txt
role: implementer
tags: []
tracker_refs: []
---

# WP01 — spec-kitty commit exemptions and sk-button tone-flattening ADR

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `node-norris`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this
work package's `task_type` and `authoritative_surface`.

---

## Objective

Close two independent, small gaps found during mission #319's post-merge review and at the #341
pre-merge gate, neither of which changes any rendered output (issues #420 and #403, epic scope
n/a):

1. Add anchored `commitlint.config.cjs` exemptions for the three exact auto-commit message shapes
   the installed `spec-kitty-cli` emits from `tracer_writer.py` and `retrospect.py`, and prove
   them (and their near-misses) with `scripts/check-commitlint-config.mjs`.
2. Record, as a new ADR, the fact that `sk-button`'s `BUTTON_VARIANTS` flattens a tone × intensity
   product into one enum — what that costs and what changes if a `danger-primary` tone is ever
   added — with no code change to the component.

## Context

Read `plan.md` in full before starting — it names the exact three CLI source lines, the real
`TRACER_CATEGORIES` vocabulary, and the ADR location/format this repo already uses.

### Subtask T001: Anchor the three real spec-kitty auto-commit message shapes in `commitlint.config.cjs`

**Purpose**: `chore(tracer): append {category} finding for {mission_slug}`
(`specify_cli/retrospective/tracer_writer.py:277`), `chore(retrospective): author retrospective
for {mission_slug}` (`specify_cli/cli/commands/retrospect.py:431`), and `chore(retrospective):
backfill {N} retrospective records` (`specify_cli/cli/commands/retrospect.py:845`) are commits
the CLI itself authors while advancing a mission. None is in `scope-enum` (`tracer` and
`retrospective` are absent) and none matches any existing `SPEC_KITTY_AUTO_COMMIT_PATTERNS`
entry, so any mission that runs `tracer-append` or `retrospect create`/`backfill` on a pushed
branch reds `[ENFORCED] commitlint (FR-020)` — see plan.md Summary for the file:line citations.

**The real `category` vocabulary** (read from `tracer_writer.py`'s `TRACER_CATEGORIES` dict, do
not guess a character class): exactly `tooling-friction`, `approach`, `design-decisions`.

**Steps**:
1. Open `commitlint.config.cjs` and read the full `SPEC_KITTY_AUTO_COMMIT_PATTERNS` array,
   including every comment, before writing anything — match its established discipline exactly:
   each pattern is a fixed literal prefix, a CLOSED vocabulary (never `\S+` or an open character
   class) for the variable part, and anchored to end-of-LINE (`\s*(\n|$)`) rather than
   end-of-string, because commitlint's ignore predicates test the FULL message body-included.
2. Add three new entries, each with its own explanatory comment in the file's voice (why it is
   closed over this vocabulary, what an unanchored version would wrongly exempt), placed near the
   other CLI-authored bookkeeping patterns (after the `op(...)` entry is a reasonable spot, but do
   not disturb the order or content of any existing entry):
   ```js
   // spec-kitty's own `tracer-append` / append_tracer_finding auto-commit
   // (specify_cli/retrospective/tracer_writer.py:277). Closed over TRACER_CATEGORIES' real
   // three values, not a wide character class — an unanchored /^chore\(tracer\):/ or an open
   // `[a-z-]+` category would exempt any commit with that scope from EVERY rule, the same trap
   // the `chore(spec-kitty)` comment above records. Mission slug shape matches the `-01` +
   // >=6 uppercase-alphanumeric suffix every neighbouring pattern in this file already binds to.
   (msg) =>
     /^chore\(tracer\): append (?:tooling-friction|approach|design-decisions) finding for [a-z0-9]+(?:-[a-z0-9]+)*-01[A-Z0-9]{6,}\s*(\n|$)/.test(
       msg,
     ),
   // spec-kitty's own `spec-kitty retrospect create` auto-commit
   // (specify_cli/cli/commands/retrospect.py:431). Same discipline: full mission-slug shape,
   // anchored to end-of-LINE.
   (msg) =>
     /^chore\(retrospective\): author retrospective for [a-z0-9]+(?:-[a-z0-9]+)*-01[A-Z0-9]{6,}\s*(\n|$)/.test(
       msg,
     ),
   // spec-kitty's own `spec-kitty retrospect backfill` auto-commit
   // (specify_cli/cli/commands/retrospect.py:845). `\d+` bounds the count to digits only —
   // never `\S+`, which would also match a non-numeric or empty tail.
   (msg) => /^chore\(retrospective\): backfill \d+ retrospective records\s*(\n|$)/.test(msg),
   ```
3. Do **not** add `tracer` or `retrospective` to `rules['scope-enum']` (C-001) — these are
   CLI-authored, non-conventional commits exempted via the ignore-predicate mechanism, exactly
   like the existing `spec-kitty`/`acceptance`/`op(...)` entries; scope-enum governs
   human-authored commits only.
4. Do not reformat, reorder, or edit any pre-existing entry in
   `SPEC_KITTY_AUTO_COMMIT_PATTERNS` or `rules`.

**Files**: `commitlint.config.cjs` (~20-30 lines added, comments included)
**Validation**: the three real message strings below are ignored and pass; the near-misses in
T002 are not ignored and fail. Do not hand-verify only — T002/T003 run the actual harness.

### Subtask T002: Extend `scripts/check-commitlint-config.mjs` — real messages must pass, near-misses must red

**Purpose**: This file is the config's own self-test harness (`generatedMessages` asserts
ignored+valid, `nearMisses` asserts NOT ignored, `validHumanMessages`/`invalidHumanMessages`
assert ordinary conventional-commit behaviour is undisturbed). A pattern with no near-miss case
proving it is bounded is "a blanket exemption wearing a disguise" — this repo's own review
standard — so this subtask is not optional polish.

**Steps**:
1. In the `generatedMessages` array, add the three real messages (use a real-shaped example
   mission slug consistent with the file's existing examples, e.g.
   `team-overview-shell-elements-01M1S8R8`, already used elsewhere in this same array):
   ```js
   'chore(tracer): append tooling-friction finding for team-overview-shell-elements-01M1S8R8',
   'chore(tracer): append approach finding for team-overview-shell-elements-01M1S8R8',
   'chore(tracer): append design-decisions finding for team-overview-shell-elements-01M1S8R8',
   'chore(retrospective): author retrospective for team-overview-shell-elements-01M1S8R8',
   'chore(retrospective): backfill 3 retrospective records',
   ```
2. In the `nearMisses` array, add at least one bounded near-miss PER new pattern — each must
   probe exactly what an unbounded version of that pattern would have let through, matching the
   file's existing near-miss style:
   ```js
   // The tracer exemption is bounded to the three real TRACER_CATEGORIES values, not an open
   // category word, and to the full mission-slug shape, not `\S+`.
   'chore(tracer): append fabricated finding for team-overview-shell-elements-01M1S8R8',
   'chore(tracer): append approach finding for not-a-real-slug',
   'chore(tracer): append approach finding for team-overview-shell-elements',
   // The retrospective-author exemption requires the full slug shape.
   'chore(retrospective): author retrospective for NOT-A-SLUG!!!',
   // The retrospective-backfill exemption requires a digit count and the exact plural noun.
   'chore(retrospective): backfill retrospective records',
   'chore(retrospective): backfill 3 retrospective record',
   ```
3. Run `node scripts/check-commitlint-config.mjs` and observe the actual pass/fail output —
   record the real command and its real result in the WP's completion notes (do not merely
   reason about the outcome).
4. **Red-first proof, executed not reasoned about**: before adding the T001 patterns (or by
   temporarily commenting them out), run the script with only the T002 additions in place and
   confirm the three real-message assertions in `generatedMessages` actually FAIL (proving the
   test can fail). Then restore the T001 patterns and re-run to green. Do the same for at least
   one `nearMisses` case: confirm it currently reds as expected with the patterns in place (a
   near-miss should never accidentally start passing).

**Files**: `scripts/check-commitlint-config.mjs` (~15-20 lines added)
**Validation**: `node scripts/check-commitlint-config.mjs` exits 0 and prints "Commitlint config
probes passed." after both T001 and T002 are complete.

### Subtask T003: Author and index the ADR recording sk-button's tone × intensity flattening

**Purpose**: #403 asks for a written decision record, not a refactor — read `sk-button.markup.ts`
lines 14-25 (the generator-derived-codegen comment and `BUTTON_VARIANTS` itself) and
`sk-button.css`'s tone rules directly; do not restate the issue body as the record.

**Steps**:
1. Create `docs/architecture/decisions/2026-09-11-17-sk-button-tone-intensity-flattening.md`,
   following this repo's established ADR shape exactly (see e.g. ADR-12 or ADR-13 for a
   proportionate example — this decision does not need ADR-15/16's exhaustive measurement
   format): H1 `# ADR 17 (2026-09-11): <title>`, then `**Date:**`, `**Status:** Proposed.` (never
   Accepted — no operator ratification exists for this), `**Deciders:**` (name that none is
   recorded — this is architect-alphonso's finding at #341, filed as #403, not a review verdict),
   `**Technical Story:**` citing #403, #341, #320, #348.
2. In "Context and Problem Statement", state precisely: `BUTTON_VARIANTS` holds `primary`,
   `secondary`, `ghost`, `danger-secondary` (quote the actual map from
   `sk-button.markup.ts:20-25`); the four are mutually exclusive today so the flat enum has no
   illegal state; the shape stops holding the moment a solid-fill `danger-primary` is wanted,
   which would make the enum a tone × intensity product flattened into sibling string values with
   no axis distinction in the type system.
3. **State the single most useful fact, sourced from `sk-button.markup.ts:14-18`'s own comment**:
   `BUTTON_VARIANTS` is a codegen source — `scripts/build-element-markup.mjs` reads
   `<COMPONENT>_VARIANTS` by convention and derives one static HTML export per key (verified at
   `build-element-markup.mjs:288-300`), which is what produces `packages/styles/src/button/
   sk-button.html`/`index.ts` and, downstream, `packages/elements/custom-elements.json` and the
   generated React wrapper's prop type. So any future axis split (e.g. separate `tone`/`intensity`
   attributes) is a generated-artifact change with real blast radius across the manifest and every
   generated wrapper — not a local edit to one file.
4. State the decision content — ground it in what is actually read, not invented: the ceiling of
   the current flat-enum shape (how many more sibling values it can hold before the "which axis
   does this name" question becomes unavoidable — today only one tone/intensity combination is
   named `danger-secondary` with no `danger-primary`, `success-secondary`, etc.), AND/OR the
   migration shape if `danger-primary` is added (e.g. what widening `BUTTON_VARIANTS` with a
   `danger-primary` sibling costs vs. what splitting into two axes would require of the generator,
   the manifest, and every consumer of the current single `variant` prop). Cite that this repo's
   own token doctrine (`packages/tokens/src/tokens.css` around line 72, the
   N-components-x-M-variants comment) already argues against an unflagged cartesian-product shape
   elsewhere — quote it accurately, do not paraphrase past what it says.
5. Add a "Related" or "More Information" paragraph naming **#348** explicitly: the busy cue is
   hardcoded to `.sk-button--primary .sk-button__busy-cue` (verified at `sk-button.css`, the
   `Busy axis` section) with no derivation from `BUTTON_VARIANTS`, so a fifth tone silently gets
   the wrong (or no) busy cue — the same "the tone set is not first-class" defect family as this
   record's subject. State plainly that this record does not fix #348.
6. Add the new record's row to `docs/architecture/README.md`'s `## Decisions (ADRs)` table,
   immediately after the ADR-16 row, with Status `Proposed` matching the record's own Status
   field exactly (the gate in T003 step 7 asserts they agree).
7. Run `node scripts/check-adr-index.mjs` and confirm it exits 0. If it reports any problem, fix
   the record or the index row — do not silence or skip the gate.

**Files**: `docs/architecture/decisions/2026-09-11-17-sk-button-tone-intensity-flattening.md`
(new, ~60-100 lines), `docs/architecture/README.md` (~1 row added)
**Validation**: `node scripts/check-adr-index.mjs` exits 0; the record states the codegen-source
fact, the ceiling and/or migration shape, and references #348; no edit to
`packages/elements/src/button/sk-button.markup.ts` or `packages/styles/src/button/sk-button.css`
(C-002).

## Definition of Done

- [ ] Three new anchored, vocabulary-closed `SPEC_KITTY_AUTO_COMMIT_PATTERNS` entries in
      `commitlint.config.cjs`; no `scope-enum` edit (T001)
- [ ] `scripts/check-commitlint-config.mjs`'s `generatedMessages` includes the three real
      messages (ignored + valid); its `nearMisses` includes a bounded near-miss per new pattern
      (not ignored); the script exits 0 (T002)
- [ ] Red-first proof executed and observed: the new `generatedMessages` assertions fail without
      the T001 patterns, and at least one new near-miss reds as expected with the patterns in
      place (T002)
- [ ] New ADR at `docs/architecture/decisions/2026-09-11-17-sk-button-tone-intensity-
      flattening.md`, Status `Proposed`, states the codegen-source fact, states the ceiling
      and/or migration shape, references #348 without fixing it (T003)
- [ ] `docs/architecture/README.md`'s ADR table carries the new record's row with a matching
      Status; `node scripts/check-adr-index.mjs` exits 0 (T003)
- [ ] No edit to `sk-button.markup.ts`, `sk-button.css`, or any other rendered-output source
      (C-002, NFR-001)
- [ ] `npm run quality:lint` (or `quality:all`) passes with no new violations
- [ ] `git status --porcelain` empty before the WP is declared ready for review

## Risks

- **A near-miss that is not actually bounded** (e.g. reusing `\S+` for the mission-slug tail)
  would silently exempt an unrelated commit — mitigated by T002's requirement to run the harness
  and observe each near-miss actually fail, not merely reason that it should.
- **Guessing the `category` vocabulary instead of reading `TRACER_CATEGORIES`** would either
  under- or over-close the pattern — mitigated by T001's explicit instruction to read the dict
  before writing the regex (already done during mission planning; re-verify at implementation
  time in case the installed CLI version differs).
- **The ADR asserting a decision nobody has ratified** — mitigated by keeping Status `Proposed`
  and naming plainly that no Deciders are recorded, matching this repo's own convention
  (`docs/architecture/README.md`'s "What a Status obliges" section) for an unratified record.

## Reviewer Guidance

Focus review on: (1) each new commitlint pattern is closed over a real, enumerated vocabulary and
anchored to end-of-line, never `\S+` or an unanchored prefix; (2) the near-miss cases in
`nearMisses` genuinely probe what an unbounded version of each new pattern would have let
through, and were actually run red before the fix, not merely written; (3) no `scope-enum` entry
was added; (4) the ADR states the codegen-source fact accurately (grounded in
`build-element-markup.mjs`'s real behaviour, not restated from the issue) and does not overclaim
an operator ratification; (5) #348 is referenced, not fixed; (6) zero edits anywhere under
`packages/elements/src/button/` or `packages/styles/src/button/`.

Implementation command: `spec-kitty agent action implement WP01 --agent claude`
