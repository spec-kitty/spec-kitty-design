---
work_package_id: WP01
title: Decide and record the static-form ruling for element-backed CSS families (Gap G0)
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
- FR-009
planning_base_branch: mission/static-form-of-element-backed-css
merge_target_branch: mission/static-form-of-element-backed-css
branch_strategy: Planning artifacts for this mission were generated on mission/static-form-of-element-backed-css. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/static-form-of-element-backed-css unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
phase: Phase 1 - Decision (only phase; C-001 bounds this mission to one WP)
history:
- at: '2026-09-10T00:05:05Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: architect-alphonso
authoritative_surface: docs/architecture/decisions/
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- docs/architecture/decisions/**
- docs/architecture/README.md
- docs/contributing/adding-a-component.md
- packages/styles/src/app-shell/sk-app-shell.css
- packages/styles/src/action-row/sk-action-row.css
- packages/styles/src/entity-marker/sk-entity-marker.css
- packages/elements/src/app-shell/sk-app-shell.ts
- packages/elements/src/action-row/sk-action-row.ts
- packages/elements/src/entity-marker/sk-entity-marker.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Decide and record the static-form ruling for element-backed CSS families (Gap G0)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or
any user-defined profile), and behave according to its guidance before parsing the rest of this
prompt.

- **Profile**: `architect-alphonso`
- **Role**: `implementer`
- **Agent/tool**: *(assign at dispatch time)*

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`task_type: implement` against `authoritative_surface: docs/architecture/decisions/`.

---

## ⚠️ IMPORTANT: This is a decision mission, not a component build

**Read `spec.md` in full before writing anything.** This mission does not ship a component. It
ships:

1. A recorded ruling (ADR or ADR amendment) naming, **per construct kind**, whether the repo
   adopts a generated static form or a shadow-only rule.
2. The measurement that selects each construct kind's answer — committed, re-runnable evidence,
   not an assertion.
3. Whatever conditional follow-through that ruling requires (filed issues for candidate a, or
   corrected docs for candidate b) — **per construct kind independently**. A mixed outcome
   (generated for one kind, shadow-only for another) is a valid, expected result.

**Do not pre-decide the answer before running the measurement.** The spec deliberately does not
pick a winner, and neither should you before T001-T004 produce real evidence.

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `` `<div>` ``, `` `<script>` ``
Use language identifiers in code blocks: ````python`, ````bash`

---

## Objectives & Success Criteria

- Every one of spec.md's FR-001 through FR-009 is satisfied, checkably, in the resulting PR.
- The ADR/amendment addresses all three construct kinds by name (no silent omission).
- Every measurement claim is backed by a committed `measurement/<construct>/result.json` that
  conforms to `contracts/measurement-contract.md`'s schema — not a narrative claim.
- Whichever candidate wins for a construct kind, its conditional deliverable (FR-006 or FR-007) is
  complete for that construct kind before this WP is marked done.
- No component's CSS declarations, selectors, or visual contract change (C-004) — only comment
  additions to the three listed CSS/element files, and only if candidate (b) wins for that
  component's construct kind.
- Lynn's product verdict is never cited anywhere in the ADR or PR (C-003).

## Context & Constraints

- Read first, in this order: `spec.md` (the question, both candidates, all 9 FRs),
  `plan.md` (the measurement method design, Implementation Concern Map), `research.md` (verified
  evidence, including the corrected #161 finding), `data-model.md`, `contracts/measurement-contract.md`
  (the exact result-record schema), `quickstart.md` (the reproduction commands).
- `.kittify/charter/charter.md` is stale on Angular/SCSS framing (predates the elements-first
  pivot) — follow the ADRs and `docs/architecture/README.md` over it, per `plan.md`'s Charter
  Check section.
- Read the source issues live before writing anything that cites them: `gh issue view 301/300/161/239
  --repo spec-kitty/spec-kitty-design`. Do not trust this WP's paraphrase over the live issue.
- **C-001**: one Work Package, one PR. If mid-implementation you find the work does not fit,
  STOP and report rather than splitting silently.
- **C-002**: no Team/invitation/membership/bearer-link/session model may be introduced. Nothing in
  this WP should come close to this, but if a follow-through path seems to require it, stop and
  report instead.
- **C-003**: never cite Lynn's Family 4 product verdict — it is not recorded. Cite the Opus
  rereview 04 `approve` verdict (2026-09-10) and the operator's delegated-trust authorization
  instead, accurately.
- **C-005**: never hand-edit `kitty-specs/` or `.kittify/` artifacts outside the normal CLI/skill
  flow; this WP's own status transitions go through `spec-kitty agent tasks mark-status` /
  `move-task`, not manual file edits.
- **Ownership metadata note**: `kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/**`
  (T002-T004's evidence) is not listed in this WP's `owned_files` — the finalizer rejects
  `kitty-specs/` paths there by design, since mission artifacts aren't a code-ownership surface.
  Create and commit those files normally anyway (e.g. via `spec-kitty spec-commit` or a plain
  commit on this mission's branch); this is a tooling constraint on the frontmatter field, not a
  statement that the evidence files are out of scope.

## Branch Strategy

- **Strategy**: single_branch topology — planning artifacts were generated directly on
  `mission/static-form-of-element-backed-css`; completed changes commit to and merge from that
  same branch. There is no separate mission branch to cut and no worktree lane split for this WP
  (it is the only one).
- **Planning base branch**: `mission/static-form-of-element-backed-css`
- **Merge target branch**: `mission/static-form-of-element-backed-css`

> These fields are populated automatically by `spec-kitty agent mission tasks`. Do NOT change
> them manually.

## Subtasks & Detailed Guidance

### Subtask T001 – Rebuild real artifacts; re-confirm the #161 measurement fresh

- **Purpose**: Every downstream probe (T002-T004) must run against real built output, not source,
  per FR-004. This subtask also re-confirms research.md's #161 finding was not a fluke of one
  build, since a config-only reading of that issue was already shown, mid-mission, to be wrong.
- **Steps**:
  1. `npm ci --ignore-scripts` if `node_modules/` is not already present.
  2. `rm -rf packages/styles/dist packages/tokens/dist`
  3. `npx nx run tokens:build --skip-nx-cache && npx nx run styles:build --skip-nx-cache`
  4. Confirm `packages/styles/dist/app-shell/sk-app-shell.css`,
     `packages/styles/dist/action-row/sk-action-row.css`, and
     `packages/styles/dist/entity-marker/sk-entity-marker.css` exist and are non-empty.
  5. Re-run the two Node resolution probes from `quickstart.md` step 1 (subpath resolves; root
     import fails with `ERR_MODULE_NOT_FOUND` on a missing extension, not a missing file). If
     either result differs from `research.md`'s R-006, **stop and report** — do not silently
     write a ruling against evidence that no longer holds.
  6. `npx nx run storybook:storybook:build --skip-nx-cache` — this is what T002-T004's Playwright
     probes will load `iframe.html` from.
- **Files**: none created; this subtask only produces gitignored build output
  (`packages/*/dist/`, `apps/storybook/storybook-static/` or equivalent) used by later subtasks.
- **Parallel?**: No — T002-T004 depend on this subtask's build output.
- **Notes**: Do not commit `dist/` or the Storybook build output; both are gitignored. If the
  Storybook build target name differs from what's written here, use
  `npx nx show project storybook --json` to find the actual build target rather than guessing.

### Subtask T002 – Host-attribute-axis probe (`sk-app-shell`)

- **Purpose**: Produce the FR-008 measurement for construct kind 1 (`:host([presentation="..."])`
  inside a host-owned `@container`).
- **Steps**:
  1. Create `kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/host-attribute-axis/`.
  2. Write a throwaway `exemplar.html` implementing the candidate-(a) transform from `plan.md`:
     `.sk-app-shell` root div (not a custom element) linking
     `packages/styles/dist/app-shell/sk-app-shell.css` **plus** a small inline `<style>` block
     rewriting exactly `:host` → `.sk-app-shell` and `:host([presentation="X"])` →
     `.sk-app-shell--X` for the two axis values (`compact`, `rail-preserving`). Do not touch any
     other rule. Reproduce the same markup structure the element renders (check
     `packages/elements/src/app-shell/sk-app-shell.ts`'s `render()` for the real DOM shape —
     `.sk-app-shell__personal`, `__context`, `__compact-header`, `__compact-navigation`,
     `__content` — the exemplar's classes must match exactly or the comparison is invalid).
  3. Write `run.mjs` — a Playwright script that:
     - Loads the real `<sk-app-shell>` story via the built Storybook's `iframe.html` (pattern:
       `apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts`), for both
       `presentation="compact"` and `presentation="rail-preserving"`, at widths just above and
       below 860px and 1100px respectively.
     - Loads `exemplar.html` directly (`file://` or a small static server) at the same widths with
       the same attribute-equivalent class applied.
     - Captures `getComputedStyle` values named in `contracts/measurement-contract.md` §1 for
       both, plus the **composed case**: nest each version inside an outer `<div>` with its own
       `container-type: inline-size` at a third width, and re-capture.
     - Writes `result.json` per the contract's schema.
  4. Run it: `node kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/host-attribute-axis/run.mjs`
  5. Read the result. Do not edit it to make it prettier — it is evidence.
- **Files**: `measurement/host-attribute-axis/exemplar.html`, `.../run.mjs`, `.../result.json`
  (all new).
- **Parallel?**: Yes, alongside T003 and T004 (disjoint components/directories).
- **Notes**: If the composed case diverges (per plan.md's IC-01 risk), that is itself the
  negative-measurement finding for the composed scenario — record it precisely (which container
  won the "nearest ancestor" contest) rather than only reporting the isolated case as if it were
  the whole answer.

### Subtask T003 – Host-container-type probe (`sk-action-row`)

- **Purpose**: Produce the FR-008 measurement for construct kind 2 (`:host { container-type:
  inline-size }` and the 400px reflow it enables).
- **Steps**: Mirror T002's structure exactly, against `sk-action-row` and
  `contracts/measurement-contract.md` §2 (the 400px `flex-wrap`/grid-template-areas comparison,
  plus the composed/nested case). Directory:
  `kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/host-container-type/`.
  Reference `packages/elements/src/action-row/sk-action-row.ts`'s `render()` for the exact DOM
  shape to reproduce in the exemplar (`.sk-action-row`, `__trigger`, `__marker`, `__title`, etc.).
- **Files**: `measurement/host-container-type/exemplar.html`, `.../run.mjs`, `.../result.json`.
- **Parallel?**: Yes, alongside T002 and T004.
- **Notes**: Same composed-case caution as T002.

### Subtask T004 – `::slotted()` child-rule probe (`sk-entity-marker`)

- **Purpose**: Produce the FR-008 measurement for construct kind 3 (`::slotted(img)`).
- **Steps**: Mirror T002's structure, against `sk-entity-marker` and
  `contracts/measurement-contract.md` §3. The candidate-(a) transform here is `::slotted(img)` →
  `.sk-entity-marker > img`. No composed-container case applies (see the contract); instead record
  the cascade/specificity note the contract asks for. Directory:
  `kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/slotted-child-rule/`.
- **Files**: `measurement/slotted-child-rule/exemplar.html`, `.../run.mjs`, `.../result.json`.
- **Parallel?**: Yes, alongside T002 and T003.
- **Notes**: This is the simplest of the three probes — no container-query interaction, just a
  descendant-selector rewrite.

### Subtask T005 – Author the ADR or ADR amendment

- **Purpose**: Record the ruling, per construct kind, from T002-T004's actual results.
- **Steps**:
  1. Decide, from the three `result.json` files, whether each construct kind's verdict is
     `generated-static-form` or `shadow-only`. **This is the first point in the mission where the
     answer is decided — not before.**
  2. Decide whether to write a **new** ADR (e.g. `docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`,
     next available number per `docs/architecture/README.md`'s index) or an **amendment** to
     ADR-9 and/or ADR-10 (the two records this ruling is most likely to touch, per `research.md`).
     Follow the precedent in `2026-09-02-10-distribution-and-canonical-markup.md`'s own
     "Styles-only components are a class, not a fixed exception count" section for how an
     amendment is appended (a new dated subsection, never a rewrite of prior content) if you
     choose that route instead of a new file.
  3. Write the record covering, explicitly:
     - FR-002: all three construct kinds, named, each with its verdict and what the static path
       gets.
     - FR-003: #302 (TKT2/G1), #304 (TKT4/G3), #305 (TKT5/G4), #307 (TKT7/G6) — one sentence each
       on whether/how it may freeze a static API.
     - FR-004: cite the T001 measurement (subpath exports resolve; root import fails for the
       named, specific reason) as the "holds for real package consumption" evidence.
     - FR-005: relationship to #239, without answering #239.
     - FR-009: the T3/T4 inert-block failure mode, attributed as reported evidence from #301 (not
       independently re-verified — say so).
     - Cite `measurement/<construct>/result.json` paths as the evidence for each verdict.
  4. If a new ADR file was created, add its row to `docs/architecture/README.md`'s decision table
     and run `node scripts/check-adr-index.mjs` to confirm it passes.
- **Files**: `docs/architecture/decisions/<new-or-existing>.md`, possibly
  `docs/architecture/README.md`.
- **Parallel?**: No — depends on T002, T003, T004 all completing.
- **Notes**: Do not write "Lynn approved" or imply a Lynn verdict exists anywhere in this record
  (C-003).

### Subtask T006 – Conditional follow-through per construct kind

- **Purpose**: Complete FR-006 (candidate a) and/or FR-007 (candidate b), independently per
  construct kind, per whatever T005's ruling actually says.
- **Steps** (repeat per construct kind, per its own verdict):
  - **If `generated-static-form`**: file a new GitHub issue (`gh issue create --repo
    spec-kitty/spec-kitty-design`) naming the required generator change (extending
    `scripts/build-elements-css.mjs`/`build-element-markup.mjs`) and boundary-gate change
    (extending `scripts/check-adopted-css-boundaries.mjs`), with the probe table this WP's
    `result.json` already establishes identified as the acceptance evidence the new work must
    reproduce as a permanent, generated/gated artifact. Link the issue from the ADR (T005) by
    number. **Do not build the generator or the gate in this WP** — naming and filing only
    (C-001/FR-006).
  - **If `shadow-only`**: grep `docs/` and `docs/contributing/adding-a-component.md` for language
    that implies this construct kind has (or will have) a static equivalent; correct every hit in
    this same PR (NFR-002: zero remaining contradictions). Add a short header comment to the
    affected CSS file (`packages/styles/src/<name>/sk-<name>.css`) and/or the element file
    (`packages/elements/src/<name>/sk-<name>.ts`, as a `//` comment per the recipe's "rationale
    goes in `//`" rule) stating precisely what a static consumer must author instead. **No
    selector, declaration, or behavior change** — comment-only.
- **Files**: conditionally `docs/contributing/adding-a-component.md`, the three CSS/element files
  listed in this WP's `owned_files` (comment-only), and new GitHub issues (not repo files).
- **Parallel?**: No — depends on T005.
- **Notes**: A construct kind may need BOTH a filed issue and a doc note if the ruling is nuanced
  (e.g., "generated form filed as future work, but until it lands, docs must say the static path
  doesn't have it yet") — use judgment, but keep the actual verdict per construct kind singular
  and unambiguous in the ADR itself.

### Subtask T007 – Run the repo's existing gates on this mission's diff

- **Purpose**: Confirm the ADR/doc edits and the mission-scoped probe scripts introduce no
  regression, without inventing a new gate (that's explicitly deferred to filed issues under
  candidate a).
- **Steps**:
  1. `node scripts/check-adr-index.mjs` (if T005 touched the ADR index).
  2. `npm run quality:all` — confirms no lint regression from any doc/comment edits.
  3. If any of the three CSS/element files were touched (T006, candidate b), run
     `node scripts/check-adopted-css-boundaries.mjs` and `node scripts/check-element-css-hygiene.mjs`
     to confirm the comment-only edit didn't accidentally introduce a boundary violation.
  4. `git status --porcelain` — confirm no stray generated-artifact drift (this WP should not
     regenerate `custom-elements.json`, React wrappers, or styles-only barrels; if any of those
     show as modified, investigate before proceeding — this WP does not touch component behavior).
- **Files**: none (verification only).
- **Parallel?**: No — run after T005/T006 land their edits.
- **Notes**: Use `timeout >= 400000` on any Bash invocation of these scripts per this repo's own
  documented gotcha (`saas gates exceed Bash timeout` applies to the sibling repo, but the same
  caution — long-running quality gates — applies here; do not let a long `npm run quality:all` run
  auto-background and end your turn waiting on it).

### Subtask T008 – Write the PR description

- **Purpose**: Give the reviewer (and the pre-merge squad, tier C per #301) everything needed to
  verify FR-001..FR-009 without re-deriving this mission's evidence themselves.
- **Steps**: Write a PR body that:
  - States the ruling per construct kind, each with a one-line "why," linking the corresponding
    `measurement/<construct>/result.json`.
  - Lists every FR-001..FR-009 and NFR-001/002 with a one-line "where satisfied" pointer (file +
    section).
  - States what #161 does and does not block (the scoped root-barrel limitation, not "unmeasurable").
  - States the relationship to #239 without answering it.
  - Names any filed follow-up issue numbers (candidate a) or corrected files (candidate b).
  - Does not cite Lynn's verdict anywhere (C-003) — cites the Opus rereview 04 `approve` and the
    operator's delegated-trust authorization instead.
  - Notes explicitly: **merges to this repo auto-deploy nothing** (this is a docs/ADR repo, not
    the SaaS app) — no production-deploy caveat applies here, unlike Team Kitty missions.
- **Files**: none (PR body text, not a repo file).
- **Parallel?**: No — final subtask.

## Test Strategy

No new permanent test suite is added by this WP (the measurement probes are mission-scoped
evidence, not shipped tests — building a permanent gate is explicitly deferred to a filed issue
under candidate a, per FR-006). The existing repo gates (T007) stand in for a test suite here.

## Risks & Mitigations

- **Composed/nested container-type divergence** (plan.md IC-01): mitigated by requiring the
  composed case in T002/T003's probes before any `generated-static-form` verdict for those two
  construct kinds is considered complete evidence.
- **T3/T4 evidence cannot be re-verified** (spec "Evidence verification"): mitigated by requiring
  T005 to attribute it as reported testimony, not a first-party measurement.
- **Scope creep into building the generator/gate** (candidate a): mitigated by T006's explicit
  "name and file, do not build" instruction, and by T007's check that no generated-artifact drift
  appears in `git status`.
- **Citing Lynn's verdict by accident**: mitigated by C-003 called out in three separate places in
  this prompt (Objectives, T005, T008) — a reviewer should specifically grep the PR body and ADR
  text for "Lynn" and confirm no verdict is asserted.

## Review Guidance

- Confirm all three `measurement/<construct>/result.json` files exist, conform to
  `contracts/measurement-contract.md`'s schema, and include the composed case for construct kinds
  1 and 2.
- Confirm the ADR/amendment addresses all three construct kinds, all four gated children, the
  #239 relationship, the #161 scoped limitation, and the T3/T4 attribution — FR-002/003/004/005/009.
- Confirm any filed issue is naming-only (no generator/gate code in this PR) and any doc
  correction is complete (NFR-002: re-grep after the PR for language implying a static equivalent
  for a construct kind ruled shadow-only).
- Confirm no CSS declaration, selector, or component behavior changed — only comments, only where
  candidate (b) won.
- Confirm "Lynn" does not appear as an approval citation anywhere in the diff.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-10T00:05:05Z – system – Prompt created.

---

### Updating Status

Status is managed via `status.events.jsonl`. Use `spec-kitty agent tasks move-task WP01 --to
<status>` to change WP status, and `spec-kitty agent tasks mark-status T001 T002 ... --status done`
to record subtask completion.
- 2026-09-10T01:10:42Z – architect-alphonso – Cycle-1 review REJECT addressed. HIGH-1: every prescription of the static wrapper now states the component's complete :host declaration set generically, pinned by new measured outcomes (flex item, 300px: sk-app-shell computes 0px abbreviated vs 300px for the real element and the full wrapper) plus a grid-track control; a third static variant B-abbrev is committed so the regression sits in the table #309/#310 inherit. HIGH-2: the six sheets still owing a ::slotted() static-consumer instruction are enumerated and owned by newly filed #311; ADR-15 records where acceptance item 7 is discharged. MEDIUM-1: O6 relabelled a TIE by erratum rather than by rewriting the cycle-1 pre-declaration, the full three-regime by two-order cascade matrix measured, ADR-15's 'only when the page outbids it' conclusion corrected, and #304's frozen instruction now states the tie boundary. MEDIUM-2: outcomes extended below the app-shell sheet's unconditional 720px rule and onto the action-row inclusive 400px boundary, surfacing four new collapsed-form failures. LOWs: PR body deploy claim corrected to the train-vs-main distinction, acceptance-matrix filled via CLI (9/9 pass, 4 negative invariants confirmed_absent), sk-copy-field and sk-page-header named in #309, consumer-majority claim sourced to ADR-10 section 3.
