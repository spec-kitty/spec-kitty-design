---
work_package_id: WP01
title: 'develop-line governance: CI coverage, tree-sync promotion mechanism, ruleset artifact, and the three-branch doc'
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
- FR-010
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- C-001
- C-002
- C-003
- C-004
- C-005
planning_base_branch: mission/release-pipeline-develop-line
merge_target_branch: mission/release-pipeline-develop-line
branch_strategy: Planning artifacts for this mission were generated on mission/release-pipeline-develop-line. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/release-pipeline-develop-line unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
history: []
agent_profile: node-norris
authoritative_surface: .
create_intent:
- .github/rulesets/develop-ruleset.json
- scripts/promote-develop.mjs
- scripts/check-develop-ruleset-parity.mjs
- scripts/lib/promote-github.mjs
- docs/architecture/branch-model.md
execution_mode: code_change
model: ''
owned_files:
- .github/workflows/ci-quality.yml
- .github/workflows/pr-preview.yml
- .github/rulesets/develop-ruleset.json
- scripts/promote-develop.mjs
- scripts/check-develop-ruleset-parity.mjs
- scripts/check-gate-wiring.mjs
- scripts/check-gate-wiring-defeats.mjs
- scripts/lib/promote-github.mjs
- docs/architecture/branch-model.md
- docs/architecture/elements-first-run-prompt.md
role: implementer
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 — develop-line governance (REL1, issue #362, epic #361)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `node-norris`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this
work package's `task_type` and `authoritative_surface`. (`node-norris` is the closest built-in
match — plain Node.js `.mjs` scripts shelling out to `git`/`gh`, not a web framework — but nothing
here uses Express/Fastify/Nest; treat the profile's Node.js/async/test/implement/generate guidance
as applicable and its API-framework-specific guidance as not.)

---

## Objective

Make the `develop` release-candidate line governable and reachable before REL2 (#363) needs it,
without creating `develop` or touching `main`'s ruleset: extend `ci-quality.yml`'s CI coverage to
`develop`, implement the operator-ruled tree-sync promotion mechanism (Option D) as a job inside
`ci-quality.yml`, add `develop`'s ruleset artifact and its live-CI parity check, register both new
self-tests in the gate-wiring checker, and add the three-branch model doc. One PR into
`train/elements-first`, six commits (one per IC, in dependency order), one WP.

## Context

Read `kitty-specs/release-pipeline-develop-line-01M292E3/spec.md`, `plan.md`, `research.md`,
`data-model.md`, `quickstart.md`, and every file in `contracts/` before writing any code — the
plan was folded after a four-lens adversarial squad (three blockers, twenty majors, all adjudicated
as fold-ins) and is authoritative. In particular:

- `contracts/promote-develop.workflow.yml` is the literal YAML for the new `promote-develop` job.
- `contracts/ci-quality-integration.md` is the literal diff-shape for every *other* `ci-quality.yml`
  edit (trigger block, the four heavy jobs' `promote/*` skip, the `gate` job's tolerance branch),
  `pr-preview.yml`'s guard, and `check-gate-wiring.mjs`/`check-gate-wiring-defeats.mjs`.
- `contracts/promotion-script.contract.md` is the exact function signatures and the 18-probe table
  for `scripts/promote-develop.mjs --selftest`.
- `contracts/develop-ruleset.json` is the literal ruleset artifact to commit verbatim to
  `.github/rulesets/develop-ruleset.json`.
- `data-model.md` defines `PromotionDecision` (six outcomes), `PromotionCommitMessage`,
  `MergeReadiness`, and `DevelopRulesetArtifact` — the types every function below must match
  exactly, field for field.

**This mission does not create `develop`, does not apply any ruleset, and does not flip
`PROMOTE_DEVELOP_ENABLED`.** Those are GitHub repository-setting actions performed by the
orchestrator and the operator, after this PR merges — see "NOT the implementer's job" below. The
promotion job you build must run safely *before* any of that has happened (it detects
`develop`'s absence and no-ops, per Edge Cases in spec.md).

**Commit-scope rule** (this repo's `commitlint.config.cjs` / CLAUDE.md §3): every hand-authored
commit is a conventional commit whose scope is one of `tokens`, `storybook`, `doctrine`, `ci`,
`docs`, `release`, `deps`, `security`, `styles`, `elements`, `react`, `acceptance`, `merge`,
`team-overview` — no others. Use `ci` for every `.github/workflows/**`, `.github/rulesets/**`, and
`scripts/**` commit in this WP (T001–T004, T006); use `docs` for T005's doc commit. Do not invent a
scope (`spec`, `specs`, `adr`, `test`, `chore` are not scopes — they are commit *types*, and none of
them is in this enum as a scope regardless). Run `npx commitlint --from=origin/train/elements-first
--to=HEAD` after every commit and fix any failure with a new commit — never `--amend` a commit a
hook already rejected.

**Fold-in rule** (operator standing order, DIRECTIVE_025): if you find a small, domain-matched
piece of debt while implementing (e.g. a stale comment adjacent to code you're already touching),
fix it in the same commit rather than deferring it. If something is genuinely mission-sized or
outside this WP's domain, do not silently absorb it — name it and stop; do not invent a "follow-up"
without a concrete owning issue. This mission's own named exclusions (owned by #363/#364) are
listed in `plan.md`'s Fold-ins section — do not re-open those; they are the operator's scope
boundary, not gaps you found.

---

### Subtask T001 — `develop` CI coverage (IC-01)

**Purpose**: `ci-quality.yml` runs its full quality gate on `develop` pushes and PRs, additively,
with zero regression to `main`/`train/**` coverage (FR-002, FR-003, FR-004, NFR-002).

**Steps**:
1. In `.github/workflows/ci-quality.yml`, edit the trigger block: add `develop` to both
   `pull_request.branches` and `push.branches`, alongside `main` and `train/**`
   (`contracts/ci-quality-integration.md` §1). Do not add `workflow_dispatch` or the second
   `schedule` cron here — those land in T002 and T004 respectively, so this commit is FR-003 only.
2. Confirm (read the file, do not assume) that the only branch-scoped `if:` inside any job is the
   FR-041 nightly CVE audit's `main`-only guard, and that it is unaffected by this edit (FR-004) —
   record this confirmation in the PR description, not just in your own head.
3. Do not touch any job body in this subtask — the trigger-block edit is additive by construction;
   no job's `if:`/`needs:` changes here.

**Files**: `.github/workflows/ci-quality.yml` (trigger block only, ~2 line change).

**Red-first test expectation**: this is a declarative trigger-filter change with no unit test of
its own — the automated, non-fakeable proof that it actually works is T006's gate-wiring
registration (`check-gate-wiring.mjs`'s BRANCH COVERAGE loop and its defeat-table row). Before T006
lands, `check-gate-wiring.mjs` does not yet assert `develop` coverage at all, so there is nothing to
go red/green on in isolation — say so plainly rather than inventing a fake probe. What you can and
must verify locally, immediately: `git diff` shows only the two `branches:` arrays changed, and a
YAML parse of the file still succeeds (`node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/ci-quality.yml','utf8'))"` or equivalent — use whatever YAML parser is already a devDependency; do not add one just for this).

**Definition of Done**: `node scripts/check-gate-wiring.mjs` (run again after T006, since T001 alone
has no dedicated assertion) reports `develop` as covered for both `pull_request.branches` and
`push.branches`; a diff of the job **key set** before/after this commit (compare against the
pre-mission `ci-quality.yml` via `git show 907b2bbd:.github/workflows/ci-quality.yml` or the actual
merge-base) is byte-identical (NFR-002/SC-003) — run this diff and paste the (empty) result, don't
assert it from reading the YAML by eye.

---

### Subtask T002 — Promotion mechanism: job, decision engine, and GitHub-effects library (IC-02)

**Purpose**: implement Option D (tree-sync promotion) end to end — the `promote-develop` job inside
`ci-quality.yml`, `scripts/promote-develop.mjs`'s pure decision functions and `run`/`decide` CLI
modes, and `scripts/lib/promote-github.mjs`'s GitHub-facing effects. `--selftest` mode is **not**
part of this subtask — it is T003, which depends on this one.

**Steps**:
1. Add the `promote-develop` job to `.github/workflows/ci-quality.yml` **verbatim** from
   `contracts/promote-develop.workflow.yml` (the job body, action pins, `needs: [gate]`, `if:`
   guard, step order — do not reorder the five gates in the header comment: enable switch → develop
   exists → secrets → mint+checkout → App-scope guard → bot identity → run). Add `workflow_dispatch:
   {}` to the trigger block in this same commit (research.md R18 — harmless now, inert until this
   file reaches `main`).
2. Add the four heavy jobs' `promote/*` skip guard and the `gate` job's tolerance branch exactly as
   `contracts/ci-quality-integration.md` §2–§3 specify — the tolerance branch is a **positively
   scoped** exception (`head_ref == promote/*` only, only the four named `_ok` variables), never a
   general loosening of the `relevant` check. Add the matching guard to `pr-preview.yml` (§4 — read
   the file first to find the actual job/step name; don't guess it from the contract's placeholder).
3. Create `scripts/lib/promote-github.mjs`: the GitHub-facing effects (list/open/comment/close/merge
   a PR, push a branch, mint-then-checkout ordering, bot-identity `git config` calls,
   `--match-head-commit`, the post-merge tree assertion, the `promote/*` sweep) behind an injectable
   `exec` function (default `execFileSync`) so `--selftest` (T003) can substitute a recording shim
   instead of calling real GitHub or hand-writing a second simulation (research.md R23).
4. Create `scripts/promote-develop.mjs` with the exported pure functions listed in
   `contracts/promotion-script.contract.md` (`decidePromotion`, `isDevelopHealthy`,
   `buildCommitMessage`, `assessMergeReadiness`, `findPromotionPRs`, `assertSingleRepoScope`,
   `createTreeSyncCommit`, `readRefTip`) plus the `run`/`decide`/`assert-scope` CLI modes. `run`
   mode's module graph must be `node:*` built-ins only — no static `@commitlint/*` import anywhere
   reachable from `run` (research.md R13); `buildCommitMessage` reaches `@commitlint/lint` via a
   **dynamic** `import()` used only from `--selftest` (added in T003).
5. Implement the check order from `plan.md`'s Promotion algorithm exactly: enable switch (no I/O) →
   `develop` exists via remote `ls-remote` (no auth) → secrets present → mint token + checkout →
   App-scope guard → bot identity → live train tip via `ls-remote` (never `github.sha`, research.md
   R18) → `decidePromotion` → poll/merge via `assessMergeReadiness` → post-merge tree assertion →
   `promote/*` sweep (research.md R19/R22).
6. Implement the `refuse-diverged` outcome (FR-007(d)): `isDevelopHealthy` returns `false` when
   `developSha` is neither on `train`'s first-parent history nor a prior promotion commit whose
   `Train-SHA:` trailer names a train commit with a matching tree. On `false`, `decidePromotion`
   returns `refuse-diverged` with a `divergence` object; the CLI exits 1, writes the reason to
   `GITHUB_STEP_SUMMARY`, and never merges or force-pushes.
7. Implement `buildCommitMessage` to the exact shape in `data-model.md`'s `PromotionCommitMessage`
   table: `chore(release): promote <short-sha> to develop` header, the fixed 48-character body
   sentence, and a `Train-SHA: <full-sha>` trailer — this is the App's own commit message format on
   `develop`, unrelated to this WP's own commit-scope rule above.
8. Add the two new lint-code steps to `ci-quality.yml`'s `lint-code` job:
   `node scripts/promote-develop.mjs --selftest` and (placeholder for now — the script itself lands
   in T004) `node scripts/check-develop-ruleset-parity.mjs --selftest`, both marked `[ENFORCED]` in
   the step name, matching this repo's existing convention (research.md R9). It is fine for these
   steps to fail at the end of this commit alone (the scripts/modes don't exist yet in full) — they
   go green by the end of T003/T004; do not skip adding the steps now just because they're not
   green yet, and do not mark either step `continue-on-error`.

**Files**: `.github/workflows/ci-quality.yml` (new job, four jobs' guards, `gate` tolerance, two new
`lint-code` steps, `workflow_dispatch` trigger), `.github/workflows/pr-preview.yml` (one guard),
`scripts/promote-develop.mjs` (new, ~250-350 lines for this subtask's scope), `scripts/lib/promote-github.mjs` (new, ~150-200 lines).

**Red-first test expectation**: before this subtask, `scripts/promote-develop.mjs` does not exist —
`node scripts/promote-develop.mjs decide --cwd <scratch> --train HEAD --develop develop`
(quickstart.md's hand-exercise) fails with a module-not-found error. After: run quickstart.md's
exact scratch-repo recipe (create a repo, seed a commit, branch `develop`, advance `train` by one
commit, then run the `decide` subcommand) and confirm it prints a well-formed `PromotionDecision`
JSON with `outcome: "open-new"` and correct `trainSha`/`developSha` values — this is your red→green
proof for this subtask, run it, don't just read the code and assert it would work.

**Definition of Done**:
- Quickstart.md's hand-exercise (above) produces the documented JSON shape, run and pasted into the
  PR description, not merely described.
- `bash scripts/check-action-pins.sh` exits 0 (the three new pinned actions —
  `create-github-app-token@bcd2ba49...`, `checkout@34e11487...`, `setup-node@48b55a01...` — must
  already carry the SHAs from `contracts/promote-develop.workflow.yml`, not the mnemonic release
  tags in the comments).
- `node scripts/promote-develop.mjs assert-scope` run against a synthetic
  `installation/repositories` fixture (single-repo, matching) exits 0; against a two-repo or
  zero-repo fixture, exits non-zero — run both, not just the happy path.

---

### Subtask T003 — Promotion script test suite (IC-03, depends on T002)

**Purpose**: add `--selftest` mode to `scripts/promote-develop.mjs`: the 18-probe, red-first,
floor-outside-the-table, mutation-controlled suite from `contracts/promotion-script.contract.md`.

**Steps**:
1. Add the floor-outside-the-table check exactly as the contract specifies (`contracts/promotion
   -script.contract.md`, "The floor sits OUTSIDE the probe table"): refuse to report green over a
   degenerate probe set (0 expect-pass or 0 expect-fail entries), separately from the per-probe
   match assertion. Model it on `scripts/gate-selftest.mjs:150-166` (read that file first).
2. Implement all 18 probes from the contract's Probe table verbatim, including:
   - Probe 5, `expect: 'fail'` **on purpose** (the withdrawn squash approach really does conflict —
     this is a product probe proving Option D's justification hasn't gone stale, not a bug).
   - Probes 11/12, mutation controls that monkey-patch the *real, already-loaded*
     `createTreeSyncCommit`/`decidePromotion` functions in-process and assert the surrounding
     harness still catches the mutation — never a second, hand-written "simulated defeat."
   - Probe 8, reaching `@commitlint/lint`/`@commitlint/load` via a dynamic `import()` inside
     `--selftest` only, plus the companion child-process assertion that `run` mode does not fail on
     a missing-module error when `@commitlint/*` is hidden from module resolution.
   - Every probe against a **fresh scratch git repository** (`mkdtempSync`), git identity set via
     `GIT_AUTHOR_*`/`GIT_COMMITTER_*` env vars on each `execFileSync('git', ...)` call — never `git
     config --global`.
3. Add `node scripts/promote-develop.mjs --selftest` as an actual, non-placeholder `[ENFORCED]` step
   in `lint-code` (T002 already added the step name; make it real now).

**Files**: `scripts/promote-develop.mjs` (add `--selftest` mode and the `PROBES` table, ~300-400
more lines), `.github/workflows/ci-quality.yml` (no structural change — the `lint-code` step from
T002 now actually passes).

**Red-first test expectation**: before this subtask, `node scripts/promote-develop.mjs --selftest`
exits non-zero with "unknown flag" (the mode doesn't exist). After: exits 0, printing 18/18 probes
matched. As a **required, one-time** demonstration that the floor check itself discriminates (not
just present in prose): temporarily edit a scratch copy of the file so `expectedFail` is empty (e.g.
change every probe's `expect` to `'pass'`), run `--selftest` against that scratch copy, confirm it
refuses with the "degenerate probe set" message and exit code 1, then discard the scratch copy —
this is the "gates must refuse empty sets" proof, run once, not assumed.

**Definition of Done**:
- `node scripts/promote-develop.mjs --selftest` exits 0.
- The one-time degenerate-set demonstration above was actually run (paste its output showing the
  refusal) — do not simply state the floor check "would" catch this.
- Probe 5 is confirmed still `expect: 'fail'` and still fails for the *documented* reason (a real
  git conflict, checked via both the non-zero exit code and the unresolved-merge state) — re-run it
  once in isolation and paste the conflict output; if it silently starts passing, Option D's
  justification has gone stale and that is a blocker to raise, not to paper over.

---

### Subtask T004 — `develop` ruleset artifact and its live-CI parity check (IC-04)

**Purpose**: commit the ruleset artifact and build `check-develop-ruleset-parity.mjs`'s
full-parameter comparison, wired into scheduled and `push`-to-`develop` CI (FR-001, NFR-004, SC-001).

**Steps**:
1. Commit `contracts/develop-ruleset.json` verbatim to `.github/rulesets/develop-ruleset.json` — do
   not hand-edit any field; if you believe a field is wrong, stop and report it rather than
   "fixing" the artifact.
2. Create `scripts/check-develop-ruleset-parity.mjs` exporting `diffRulesetParity(live, artifact)`
   per `data-model.md`'s `DevelopRulesetArtifact` section and research.md R25: compare **every**
   parameter at every nesting level, ignoring only the eight named response-only fields (`id`,
   `node_id`, `_links`, `current_user_can_bypass`, `created_at`, `updated_at`, `source`,
   `source_type`). Returns `[]` only when the full structures match except the three named,
   documented differences (`name`, `conditions.ref_name.include`,
   `pull_request.allowed_merge_methods`).
3. Add `--selftest` (same floor-outside-table shape as T003: a same-fixture expecting `[]` and a
   different-fixture expecting a non-empty diff are both required; include one fixture that
   reintroduces a bypass actor and one missing `code_scanning` entirely, both of which must be
   caught) and `--check` (fetches the live ruleset via `gh api
   repos/spec-kitty/spec-kitty-design/rulesets/<id>` and diffs against the local artifact).
4. **Implementation decision, make it explicitly and document it in the doc from T005**: the
   ruleset's live numeric id does not exist yet (it's created by the orchestrator after this PR
   merges — data-model.md's Post-apply record). Design `--check` to take the id from a repo
   variable (e.g. `vars.DEVELOP_RULESET_ID`) or an explicit CLI flag, **never** by searching rulesets
   by name — and make the CI job that calls `--check` no-op cleanly (exit 0, `::notice::`) when that
   id is unset, the same no-op discipline `promote-develop.mjs` uses for a missing `develop`. Do not
   let this job go red before the orchestrator has done its part.
5. Add the second `schedule` cron (`'43 3 * * *'`) to `ci-quality.yml`'s trigger block
   (`contracts/ci-quality-integration.md` §1) and a new job (or a step inside an existing
   appropriate job — your call, document which) that runs `check-develop-ruleset-parity.mjs --check`
   on that schedule and on `push` to `develop`, with `permissions: { contents: read }` only
   (research.md R25).
6. Add `node scripts/check-develop-ruleset-parity.mjs --selftest` as a real `[ENFORCED]` step in
   `lint-code` (T002's placeholder step name, now made real).

**Files**: `.github/rulesets/develop-ruleset.json` (new, verbatim copy), `scripts/check-develop
-ruleset-parity.mjs` (new, ~150-200 lines), `.github/workflows/ci-quality.yml` (second cron, new
job/step, real `lint-code` step).

**Red-first test expectation**: before this subtask, `check-develop-ruleset-parity.mjs` does not
exist. After: `node scripts/check-develop-ruleset-parity.mjs --selftest` exits 0; running `--check`
locally with `DEVELOP_RULESET_ID` unset must exit 0 with a notice (not fail) — run it both set (against
a synthetic fixture, since the real ruleset does not exist yet) and unset, and confirm the two
different, correct behaviors.

**Definition of Done**:
- `node scripts/check-develop-ruleset-parity.mjs --selftest` exits 0, and both the same-fixture and
  different-fixture cases were actually run (paste both outcomes).
- `.github/rulesets/develop-ruleset.json` is byte-identical to `contracts/develop-ruleset.json`
  (`diff -u` the two files and paste the empty result).
- The unset-id no-op path was run once and produced a notice, not a failure.

---

### Subtask T005 — Branch-model doc and the run-prompt cross-link (IC-05)

**Purpose**: FR-009's three-branch doc (also carrying FR-006's GitHub Packages ruling, per M15/R27),
plus a one-line cross-link from the existing run-prompt doc.

**Steps**:
1. Create `docs/architecture/branch-model.md` covering, at minimum:
   - What `main`, `train/elements-first`, and `develop` are each for, and which kind of PR targets
     which — a reader must be able to answer "which branch does my mission PR target" without
     opening #361 or #362 (SC-006).
   - The develop-tree-is-promotion-only invariant (M14/research.md R26): `develop`'s tree is written
     only by the promotion mechanism; a version bump or any other commit must never land directly on
     `develop`, because the next promotion's health check would then correctly refuse it as
     diverged.
   - The corrected `GITHUB_TOKEN`/`workflow_dispatch` reasoning from research.md R26 (an explicit
     `workflow_dispatch`/`repository_dispatch` call from a job's own `GITHUB_TOKEN` works normally;
     only `pull_request` events opened/updated by `GITHUB_TOKEN` land in an approval-required
     state) — REL2 (#363) needs this when it decides its own rc-publish trigger.
   - The GitHub Packages visibility ruling (FR-006): one public `@spec-kitty/{elements,styles,tokens}`
     package per name, created private and flipped to public on first publish, rc and prod streams
     separated only by dist-tag (operator ruling, 2026-09-11).
   - The post-merge observation queries for SC-004/SC-005 (M11): what a future reader runs, once
     real promotion cycles exist, to confirm zero duplicate PRs across a reuse-then-supersede
     sequence and the two-cycle tree/parent/trailer postcondition — named explicitly as REL2's
     (#363) to actually execute, since no cycle can run before `develop` exists.
   - The source-variable cutover caveat (research.md R17): changing `PROMOTE_DEVELOP_SOURCE_BRANCH`
     alone is not a complete cutover; the workflow's own `on.push.branches` and the job's `if:` are
     literal strings that need a follow-up PR too.
   - A placeholder line for the `develop` ruleset's live numeric id and `DEVELOP_RULESET_ID`,
     "recorded here by the orchestrator after applying the ruleset" — do not fabricate an id.
2. Add exactly one cross-link line from `docs/architecture/elements-first-run-prompt.md` to the new
   doc (M16/research.md R28) — read that file first to place the line where it reads naturally; do
   not restructure the rest of the file.
3. **Do not** edit `docs/design-system/using-components.md` (M15 — that file's stale `npm install`
   instructions are REL3/#364's scope boundary, not this WP's).

**Files**: `docs/architecture/branch-model.md` (new), `docs/architecture/elements-first-run-prompt.md`
(one line).

**Red-first test expectation**: documentation has no automated red/green test. The non-fakeable
check is SC-006's own acceptance test, run as a real exercise: hand the finished doc (only the doc,
nothing else) to a reader who has not read #361/#362, and confirm they can correctly state which
branch a hypothetical new mission PR targets and which branch an RC-only fix must land on first. If
you cannot arrange a second reader, at minimum re-read the doc yourself after a context reset (a
fresh read, not from memory of writing it) and confirm the same.

**Definition of Done**: the doc exists, covers every bullet above, and the cross-link line is
present and reads correctly in context (open the rendered file, don't just confirm the line was
inserted).

---

### Subtask T006 — Gate-wiring registration (IC-06, depends on T001, T002/T003)

**Purpose**: register both new self-tests and the `develop` branch-coverage check in
`scripts/check-gate-wiring.mjs`, and add the two new defeat-table cases to
`scripts/check-gate-wiring-defeats.mjs` — this is named in `plan.md` as the highest-risk single
piece of this mission because it touches an already-hardened, heavily-probed file.

**Steps**:
1. Add two entries to `REQUIRED_LINT` (`scripts/check-gate-wiring.mjs:636` onward, confirm the exact
   current line by reading the file, do not assume the line number is unchanged after your own
   edits) — one per new self-test invocation, exactly as `contracts/ci-quality-integration.md` §5
   specifies (the regex patterns, descriptions, and labels for `promote-develop.mjs --selftest` and
   `check-develop-ruleset-parity.mjs --selftest`).
2. Add `'develop'` to the BRANCH COVERAGE loop (`for (const ref of ['main', 'train/elements-first'])`
   → `for (const ref of ['main', 'train/elements-first', 'develop'])`, confirmed near line 433 —
   again, read the live file rather than trusting the line number).
3. Add the two new cases to `scripts/check-gate-wiring-defeats.mjs`, following its existing
   mutate-a-parsed-copy-and-assert-the-real-checker-still-catches-it shape:
   - A mutated `ci-quality.yml` copy with `pull_request.branches` narrowed back to `[main,
     'train/**']` — the (updated) `check-gate-wiring.mjs` must still flag `develop` as uncovered.
   - A mutated `ci-quality.yml` copy where the `gate` job's `promote/*` tolerance branch (T002 §2)
     is widened to apply unconditionally (the `head_ref == promote/*` guard dropped) —
     `check-gate-wiring.mjs` must flag this as an unconditional accept of a skip that should be a
     failure. **This requires `check-gate-wiring.mjs` itself to gain a new assertion for the
     tolerance branch's conditionality** — this is real implementation work, not a small addition to
     an existing loop; do not attempt to satisfy this case with a superficial string match that
     would also pass on the widened version.

**Files**: `scripts/check-gate-wiring.mjs` (two `REQUIRED_LINT` entries, one loop-array edit, one new
conditionality assertion for the `gate` tolerance branch), `scripts/check-gate-wiring-defeats.mjs`
(two new cases).

**Red-first test expectation**: before this subtask, run `node scripts/check-gate-wiring-defeats.mjs`
against the two new mutated fixtures you are about to add — confirm they are **not yet caught**
(the checker doesn't know about them yet, so the defeat-runner should report these two as not
applicable/absent, not silently pass). After adding the entries and the new assertion: run
`node scripts/check-gate-wiring-defeats.mjs` again and confirm both new cases are now reported as
caught. Also confirm `node scripts/check-gate-wiring.mjs` itself goes from reporting `develop` as
**uncovered** (before this subtask, on the tip that already has T001's trigger-filter change but not
this subtask's coverage-loop edit) to **covered** (after) — this is the closest thing this WP has to
a true red-then-green run for T001's own change, and it belongs here because the assertion that
proves it belongs here.

**Definition of Done**:
- `node scripts/check-gate-wiring.mjs` exits 0 and reports `develop` covered, both new self-test
  invocations registered.
- `node scripts/check-gate-wiring-defeats.mjs` exits 0, and its output shows both new cases (the
  narrowed branch filter, the unconditional tolerance widening) as caught — paste the relevant
  lines, not a summary claim.
- The red-then-green sequence above was actually run in that order (not just the final green state)
  — this is the one subtask in this WP where "run it before and after" is the literal
  definition of done, not optional rigor.

---

## Definition of Done (whole WP)

All six subtask-level DoDs above, plus, run in this order on the final tree:

1. `node scripts/promote-develop.mjs --selftest` — exit 0.
2. `node scripts/check-develop-ruleset-parity.mjs --selftest` — exit 0.
3. `node scripts/check-gate-wiring.mjs` — exit 0, `develop` covered, both self-tests registered.
4. `node scripts/check-gate-wiring-defeats.mjs` — exit 0, all cases (including the two new ones)
   reported caught.
5. `bash scripts/check-action-pins.sh` — exit 0 (zero tag-only or branch-only `uses:` refs anywhere
   in `.github/workflows/*.yml`, including the three actions this WP adds).
6. `npm run quality:all` (eslint + stylelint + htmlhint across the whole repo) — exit 0. This WP
   touches no `packages/**` source, so this is a regression check, not a feature check — it must
   still be run and pass.
7. After every commit: `npx commitlint --from=origin/train/elements-first --to=HEAD` — report the
   verbatim result. Fix any failure with a new commit, never `--amend`.
8. A diff of `ci-quality.yml`'s job **key set** and every job's `if:`/`needs:`, before this WP's
   first commit vs. after its last, shows exactly one new job (`promote-develop`, whose `if:`
   structurally cannot fire on a `main` push) and the four heavy jobs' one new conjunct (which
   structurally cannot fire on anything but a `promote/*` head) — everything else byte-identical
   (NFR-002/SC-002/SC-003, research.md R29). Run this diff, paste it.

None of the above is satisfied by grepping for a string in a file — every item above is something
you run and observe the output of.

## Risks

- **`check-gate-wiring.mjs`'s new conditionality assertion (T006, step 3)** is the highest-risk
  single piece of this mission (plan.md's own words) — it is real new logic inside an
  already-hardened file with a documented history of two prior defeats of similar edits. Scope it as
  narrowly as possible; do not generalize the assertion beyond the one tolerance branch it is
  checking.
- **The `gate` job's tolerance branch (T002, step 2)** is exactly the class of edit
  `check-gate-wiring-defeats.mjs`'s own header comment warns is easy to get subtly wrong — a
  positively-scoped, `promote/*`-only exception that never touches `test`/`release-gate`/`security`/
  `workflow-pin-check`'s own strict checks.
- **The `develop`-ruleset-id bootstrap gap (T004, step 4)**: the live ruleset doesn't exist at
  implementation time. Design for graceful absence now; do not leave a job that fails red the moment
  it merges because a variable the orchestrator hasn't set yet is unset.
- **Redundant CI runs**: the four heavy jobs' skip guard and the `gate` tolerance branch both depend
  on `github.head_ref` being empty for `push` events — verify this assumption is still true for this
  GitHub Actions version rather than carrying it forward from the contract unchecked.

## Reviewer Guidance

- Check the six commits land in dependency order (T001→T006) and each is independently reviewable —
  in particular, T006's `check-gate-wiring.mjs` edit should be reviewable in isolation from the rest
  (plan.md's own stated reason for commit-level separation within this one WP).
- Verify FR-007(a)-(h) each have a corresponding, named implementation detail — do not accept "the
  script handles it" without pointing at the specific function/branch.
- Verify no ruleset bypass actor was introduced anywhere (C-005) and that `.github/rulesets/develop
  -ruleset.json` is byte-identical to `contracts/develop-ruleset.json`.
- Verify none of quickstart.md's operator/orchestrator steps were performed by this PR itself — this
  PR's diff must be entirely code, workflow, and documentation; no repository setting, App
  creation, secret, or variable exists because of this PR (C-003).
- Verify the commit-scope rule was followed (`ci` for workflow/script commits, `docs` for the doc
  commit) and that `npx commitlint --from=origin/train/elements-first --to=HEAD` is reported clean.

---

## NOT the implementer's job (operator and orchestrator actions, quickstart.md)

The implementer of this WP does **none** of the following. They are listed here so the implementer
recognizes them as out of scope rather than attempting them or blocking on them:

**Operator, before this PR can do anything beyond fail fast**:
1. Create the GitHub App `spec-kitty-design-release` with exactly the permission set in
   `plan.md`'s "App permissions and secrets" (Contents RW, Pull requests RW, Workflows RW, Metadata
   R).
2. Install it on `spec-kitty/spec-kitty-design` **only**.
3. Add the two repository secrets `SK_DESIGN_RELEASE_APP_ID` / `SK_DESIGN_RELEASE_APP_PRIVATE_KEY`.
4. Approve this mission's implemented PR (FR-008) before it merges into `train/elements-first`.
5. Leave `PROMOTE_DEVELOP_ENABLED` unset/`false` until the orchestrator's step 3 below.

**Orchestrator, after this PR merges (never before)**:
1. Cut `develop` from `train/elements-first`'s new head (a direct push).
2. Apply the ruleset with `enforcement: "evaluate"` (non-blocking); record the returned ruleset id.
3. Flip `PROMOTE_DEVELOP_ENABLED` to `true`.
4. Wait for the first real promotion PR, confirm it produced a CodeQL analysis of its own head.
5. Run `node scripts/check-develop-ruleset-parity.mjs --check`, then **PATCH** (never a second POST)
   the ruleset back to the committed artifact, active, full five-rule set.
6. Post-apply verification: exactly one active ruleset targets `develop`, matching the artifact; its
   id recorded in `docs/architecture/branch-model.md`.
7. After several real promotion cycles: recalibrate the 10-minute poll budget against observed
   CodeQL timing (research.md R5, an explicitly provisional estimate).

The implementer creates no App, no ruleset, no `develop` branch, and no repository variable, and
writes nothing to GitHub via any credential of their own during this WP.

---

Implementation command: `spec-kitty agent action implement WP01 --agent claude`
