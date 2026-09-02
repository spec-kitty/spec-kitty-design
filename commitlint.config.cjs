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
  // chore(spec-kitty): status transition WPnn — emitted by `spec-kitty agent tasks
  // move-task`. The slug-suffixed pattern above does not match it: current CLI
  // versions use a bare `spec-kitty` scope with no mission ULID. Caught by the
  // pre-merge squad on #69, where 12 such CLI-authored commits failed scope-enum.
  (msg) => /^chore\(spec-kitty\):/.test(msg),
  // Bootstrap commits emitted by older Spec Kitty CLI versions (no conv-commit format)
  (msg) => /^(Add|Map|Update) (tasks|plan|meta|charter|requirements?) /i.test(msg),
  // spec: Initial mission spec (Spec Kitty creation step)
  (msg) => /^spec: /.test(msg),
];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: SPEC_KITTY_AUTO_COMMIT_PATTERNS,
  rules: {
    'scope-enum': [2, 'always', [
      'tokens', 'storybook',
      'doctrine', 'ci', 'docs', 'release', 'deps', 'security',
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
