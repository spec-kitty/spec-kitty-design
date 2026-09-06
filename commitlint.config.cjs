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
  // spec: Initial mission spec (Spec Kitty creation step)
  (msg) => /^spec: /.test(msg),
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
