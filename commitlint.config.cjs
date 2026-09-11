// Spec Kitty mission branches accumulate auto-generated bookkeeping commits
// (status transitions, lane merges, finalize-tasks bootstrap, etc.) that the
// Spec Kitty CLI emits in its own format. Those commits cannot be rewritten
// without breaking the mission state machine, so they are excluded from
// commitlint while human-authored commits stay strictly conventional.
const SPEC_KITTY_AUTO_COMMIT_PATTERNS = [
  // chore(<mission-slug>-01XXXXXX): ... — done-transition records, bootstrap.
  // Spec Kitty slug suffix is `01` + ≥6 uppercase alphanumerics (e.g. `01KQM7XS`).
  (msg) => /^(chore|feat|docs)\([^)]*-01[A-Z0-9]{6,}[^)]*\):/i.test(msg),
  // feat(kitty/mission-...): squash merge of mission
  (msg) => /^feat\(kitty\/mission-/.test(msg),
  // chore(spec): apply post-analysis remediations ... (Spec Kitty spec edits)
  (msg) => /^chore\(spec\):/.test(msg),
  // Spec Kitty CLI bookkeeping commits. These are emitted by the CLI itself while
  // advancing the mission state machine, so a mission cannot record its own progress
  // without tripping the repo's rules. Both shapes were caught by the #69 pre-merge
  // squad: the first fails `scope-enum` (bare `spec-kitty` scope, no mission ULID, so
  // the slug-suffixed pattern above misses it); the second is 102 chars against
  // config-conventional's 100-char `header-max-length` because the CLI appends the
  // full mission slug. Anchored deliberately -- an unanchored /^chore\(spec-kitty\):/
  // would exempt any commit with that scope from EVERY rule. Anchored to end-of-LINE,
  // not end-of-string: commitlint passes ignores the FULL message, body included.
  (msg) => /^chore\(spec-kitty\): status transition WP\d+\s*(\n|$)/.test(msg),
  // Newer transactional status writers use these additional exact operations.
  // Keep the first line closed over a WP id and a known operation: accepting the
  // whole `spec-kitty` scope would let arbitrary human chores bypass every rule.
  (msg) =>
    /^chore\(spec-kitty\): (?:status transition batch|inner-state annotation) WP\d+\s*(\n|$)/.test(
      msg,
    ),
  (msg) => /^chore\(spec-kitty\): record WP\d+ remediation state\s*(\n|$)/.test(msg),
  // A third `chore(spec-kitty)` shape (zoom-emulation-and-cli-commit-scopes-01M28YQ6): the CLI's
  // `BookkeepingTransaction.__exit__` (specify_cli/coordination/transaction.py:561, installed
  // spec-kitty-cli 3.2.6rc4) emits `f"chore(spec-kitty): {self.operation}"` whenever a
  // transaction is never explicitly `.commit()`/`.commit_idempotent()`-ed, and `operation` is a
  // free-form `str` at that API boundary -- not an enum. Reading every call site that reaches
  // this fallback (status_transition.py's three `operation or f"..."` defaults) confirms the
  // three patterns above already cover everything the CLI's CURRENT shipped call sites can
  // default to. This fourth pattern is NOT one of those three: it is bound to the real message
  // observed failing `lint-code` this round (`chore(spec-kitty): materialize WP01 approval note
  // into status.json`, reworded by the sibling mission that hit it). Unlike the three patterns
  // above and the tracer/retrospective pair below (each matched to a literal f-string template
  // read directly from the installed CLI), this one's source template could NOT be re-derived
  // from a literal match anywhere in that CLI despite reading transaction.py,
  // status_transition.py, workflow_executor.py, workflow.py, status/aggregate.py, implement.py,
  // review/cycle.py, tasks_verdict_persistence.py and tasks_move_task.py -- so it rests on the
  // real observed message, bound exactly as narrowly as that evidence supports (the fixed verb
  // phrase plus the `WP\d+` token, never a generalized category), not an independently
  // re-derived source match. If this needs extending, look for the actual originating commit/CLI
  // version rather than assume this comment's audit already found it.
  (msg) => /^chore\(spec-kitty\): materialize WP\d+ approval note into status\.json\s*(\n|$)/.test(msg),
  // KNOWN LIMITATION, STATED RATHER THAN LEFT SILENT (matching this repo's own convention, e.g.
  // scripts/check-visual-screenshot-softness.mjs's own doc comment). The same audit above found
  // `specify_cli/status/aggregate.py`'s `MissionStatusAggregate.save(*, operation: str)` -- a
  // documented "low-level escape hatch" that calls `txn.commit(operation)` directly: the
  // caller's string becomes the ENTIRE commit message, not a `chore(spec-kitty):`-prefixed
  // suffix at all. It currently has ZERO callers anywhere in `specify_cli` (confirmed by
  // grepping every `.save(operation=` call site), so no message from it has ever been observed
  // -- but it is a real, shipped, structurally unbounded surface: no closed regex could honestly
  // cover arbitrary caller-supplied text without becoming exactly the blanket exemption the
  // anchoring comments throughout this file warn against. This file deliberately does NOT
  // exempt it. If a future CLI version wires a caller to it and that caller's real output fails
  // lint, that is this config working as intended, not a gap in it.
  (msg) => /^chore: Record review-cycle-\d+ \([a-z-]+\) for WP\d+ on \S+\s*(\n|$)/.test(msg),
  (msg) => /^chore: update issue-matrix for \S+\s*(\n|$)/.test(msg),
  // `acceptance-verdict` owns these messages. Criterion/result vocabulary and
  // the Spec Kitty slug suffix are bounded so a normal `chore(acceptance)` does
  // not become a blanket exemption.
  (msg) =>
    /^chore\(acceptance\): record (?:FR|NFR|SC)-\d{3}=(?:pass|fail|pending) for [a-z0-9]+(?:-[a-z0-9]+)*-01[A-Z0-9]{6,}\s*(\n|$)/.test(
      msg,
    ),
  (msg) =>
    /^chore\(acceptance\): register negative invariant NI-\d{3} for [a-z0-9]+(?:-[a-z0-9]+)*-01[A-Z0-9]{6,}\s*(\n|$)/.test(
      msg,
    ),
  // Bootstrap commits emitted by older Spec Kitty CLI versions (no conv-commit format)
  (msg) => /^(Add|Map|Update) (tasks|plan|meta|charter|requirements?) /i.test(msg),
  // Same class, a message shape later CLI versions added. `spec-kitty plan` on a
  // `documentation` mission detects a docs generator and records it in meta.json under this
  // exact message ("Update generator config for feature <slug>"), which the pattern above does
  // not reach — its second group is a fixed noun list. The commit lands mid-branch, BEFORE the
  // one lanes.json records as `planning_commit_sha`, so rewording it renumbers a hash the
  // mission state machine reads back. Anchored to end-of-LINE and to the SLUG SHAPE, like its
  // siblings: an unanchored /^Update / would exempt any commit starting with that word from
  // EVERY rule, and a `\S+` tail is barely narrower — it matches `X`, `NOT-A-SLUG!!!` and
  // `../../etc/passwd`. The slug shape is the one the `chore(acceptance)` entries above already
  // bound: lowercase hyphenated words, then the Spec Kitty `-01` + ≥6 uppercase-alphanumeric
  // suffix. Found by #193, the first `documentation`-type mission on this train; probed in
  // scripts/check-commitlint-config.mjs.
  (msg) =>
    /^Update generator config for feature [a-z0-9]+(?:-[a-z0-9]+)*-01[A-Z0-9]{6,}\s*(\n|$)/.test(
      msg,
    ),
  // spec: Initial mission spec (Spec Kitty creation step)
  (msg) => /^spec: /.test(msg),
  // `spec-kitty specify` also emits this older bootstrap shape ("Add spec for <slug>") before
  // any conventional-commit history exists on the branch. The (Add|Map|Update) bootstrap pattern
  // above has a fixed noun list (tasks|plan|meta|charter|requirements) that never included
  // "spec", so this message alone reds `type may not be empty` / `subject may not be empty` —
  // live evidence in PR #312, run 34425464248, job `lint-code`. Given its own anchored pattern
  // rather than widening that list's regex or using an unanchored /^Add spec for /, which would
  // exempt any commit starting with those words from EVERY rule. Bound to the FRIENDLY slug
  // shape (lowercase letters, digits, single hyphens) rather than `\S+`: this message carries
  // the friendly slug alone, with no `-01XXXXXX` mission-id suffix (unlike the `spec-kitty
  // accept` messages below, which do carry it). Anchored to end-of-LINE like its siblings.
  (msg) => /^Add spec for [a-z0-9]+(?:-[a-z0-9]+)*\s*(\n|$)/.test(msg),
  // `spec-kitty accept` emits three of its own message shapes while recording the acceptance
  // gate outcome and none of the three existed when the exemption list above was last extended,
  // so all three also red in PR #312's `lint-code` run alongside "Add spec for" above. Each
  // carries the FULL slug (friendly slug + Spec Kitty's `-01` + >=6 uppercase-alphanumeric
  // mission id) — the same shape the `chore(acceptance)` entries above already bind, never
  // `\S+` (which would also match `X`, `NOT-A-SLUG!!!` or `../../etc/passwd`). Anchored to
  // end-of-LINE: an unanchored alternation of these three prefixes would exempt any commit
  // starting with "Accept ", "Record acceptance commit for " or "Finalize acceptance artifacts
  // for " from every rule, the same trap the `chore(spec-kitty)` comment above records.
  (msg) =>
    /^(?:Accept|Record acceptance commit for|Finalize acceptance artifacts for) [a-z0-9]+(?:-[a-z0-9]+)*-01[A-Z0-9]{6,}\s*(\n|$)/.test(
      msg,
    ),
  // op(<profile-id>): <action> [<invocation-id>] — the Op record `spec-kitty dispatch` commits
  // for every governed invocation. Same class as the entries above: a CLI-authored message this
  // project does not control. It fails BOTH enums — `op` is not a conventional type, and a
  // profile id is not a package scope — so without this every mission that deploys the
  // adversarial squad reds `[ENFORCED] commitlint (FR-020)`, which runs across all branch
  // commits (`--from=base.sha --to=head.sha`).
  //
  // Anchored to end-of-LINE like its siblings, and the action/id shapes are constrained rather
  // than left open: an unanchored /^op\(/ would exempt anything starting with `op(` from EVERY
  // rule, which is the trap the `chore(spec-kitty)` comment above records.
  (msg) => /^op\([a-z][a-z0-9-]*\): [a-z][a-z-]* \[[0-9A-Z]{6,}\]\s*(\n|$)/.test(msg),
  // spec-kitty's own `spec-kitty agent tracer-append` auto-commit (append_tracer_finding,
  // specify_cli/retrospective/tracer_writer.py:277). Neither `tracer` nor `retrospective` is in
  // scope-enum below, and this message was not covered by any pattern above (#420) -- the same
  // class as the `chore(spec-kitty)` / `op(...)` entries: a CLI-authored, non-conventional
  // message this project does not control.
  //
  // Closed over TRACER_CATEGORIES' real three values (`tooling-friction` / `approach` /
  // `design-decisions`, tracer_writer.py's own vocabulary constant -- read from source, not
  // guessed), never an open `[a-z-]+` category class, and the mission-slug tail matches the
  // `-01` + >=6 uppercase-alphanumeric suffix every neighbouring pattern in this file already
  // binds to. An unanchored /^chore\(tracer\):/ or an open category class would exempt any
  // commit with that scope from EVERY rule -- the trap the `chore(spec-kitty)` comment above
  // records. Anchored to end-of-LINE like its siblings.
  (msg) =>
    /^chore\(tracer\): append (?:tooling-friction|approach|design-decisions) finding for [a-z0-9]+(?:-[a-z0-9]+)*-01[A-Z0-9]{6,}\s*(\n|$)/.test(
      msg,
    ),
  // spec-kitty's own `spec-kitty retrospect create` auto-commit
  // (specify_cli/cli/commands/retrospect.py:431, `_maybe_auto_commit`). Same gap and same class
  // as the tracer-append entry above (#420). Bound to the full mission-slug shape, never `\S+`,
  // and anchored to end-of-LINE.
  (msg) =>
    /^chore\(retrospective\): author retrospective for [a-z0-9]+(?:-[a-z0-9]+)*-01[A-Z0-9]{6,}\s*(\n|$)/.test(
      msg,
    ),
  // spec-kitty's own `spec-kitty retrospect backfill` auto-commit
  // (specify_cli/cli/commands/retrospect.py:845, the len(created)-records summary commit). `\d+`
  // bounds the count to digits only -- never `\S+`, which would also match a non-numeric or
  // empty tail -- and the exact plural noun phrase is fixed, matching how every sibling pattern
  // in this file closes over the CLI's literal wording rather than a loose approximation of it.
  (msg) => /^chore\(retrospective\): backfill \d+ retrospective records\s*(\n|$)/.test(msg),
];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: SPEC_KITTY_AUTO_COMMIT_PATTERNS,
  rules: {
    'scope-enum': [2, 'always', [
      'tokens', 'storybook',
      'doctrine', 'ci', 'docs', 'release', 'deps', 'security',
      // Human-authored governance and integration commits use normal conventional-commit
      // validation. These are scopes, not ignores: type, subject and header
      // rules still apply to acceptance repairs, mission refreshes and explicit merges.
      'acceptance', 'merge', 'team-overview',
      // Elements-first programme (ADR-8). `styles` is html-js re-scoped, `elements`
      // is the custom-element base layer, `react` is its generated wrapper. Added
      // ahead of the packages themselves because a scope-enum miss blocks the first
      // commit of the mission that creates each one. `html-js` was dropped in M2
      // when packages/html-js became packages/styles; `angular` was retired by #69.
      'styles', 'elements', 'react',
    ]],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
  },
};
