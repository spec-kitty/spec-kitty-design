#!/usr/bin/env node
/**
 * scripts/lib/storybook-predicate.mjs — F6 (pre-merge squad, gate pass 2).
 *
 * The `storybook-build` job's exact relevant-change predicate, shared by
 * `scripts/check-gate-wiring.mjs` (which asserts the job's own `if:` equals this exactly) and
 * `scripts/check-ci-quality-trigger-parity.mjs` (which asserts it as one of the two named
 * REL1 exception classes). Before this file existed, the same literal string was hardcoded
 * byte-identically in both checkers and had to be hand-synced on every edit — F7's own change
 * to this predicate (reading `needs.changes.outputs.is_develop_promotion_pr` instead of a
 * loose `startsWith(...)` glob) is the second time that has happened.
 */
export const STORYBOOK_PREDICATE =
  "(needs.changes.outputs.tokens == 'true' || needs.changes.outputs.components == 'true') && " +
  "needs.changes.outputs.is_develop_promotion_pr != 'true'";

/**
 * F3 (pre-merge squad, gate pass 2): the exact `if:` shared byte-for-byte by `a11y`,
 * `visual-regression`, `playwright` and `lighthouse` — before this, nothing in
 * `check-gate-wiring.mjs` independently asserted it (only `check-ci-quality-trigger-parity.mjs`
 * did, which this same fold makes non-self-referential by checking its own `BASELINE` against
 * real git history — but that is a reason for a SECOND, independent guard here, not a reason
 * to skip one).
 */
export const HEAVY_JOB_PREDICATE =
  "needs.storybook-build.result == 'success' && needs.changes.outputs.is_develop_promotion_pr != 'true'";

