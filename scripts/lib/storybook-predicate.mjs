#!/usr/bin/env node
/**
 * scripts/lib/storybook-predicate.mjs — F6 (pre-merge squad, gate pass 2).
 *
 * The `storybook-build` job's exact relevant-change predicate, shared with
 * `scripts/check-gate-wiring.mjs` so the workflow and its structural guard cannot drift.
 */
export const STORYBOOK_PREDICATE =
  "needs.changes.outputs.tokens == 'true' || needs.changes.outputs.components == 'true'";

/**
 * The exact `if:` shared byte-for-byte by `a11y`, `visual-regression`, `playwright` and
 * `lighthouse`.
 */
export const HEAVY_JOB_PREDICATE =
  "needs.storybook-build.result == 'success'";
