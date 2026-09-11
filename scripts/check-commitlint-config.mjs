#!/usr/bin/env node

import assert from 'node:assert/strict';
import lint from '@commitlint/lint';
import load from '@commitlint/load';

const config = await load({}, { cwd: process.cwd() });
const isIgnored = (message) => config.ignores.some((ignore) => ignore(message));
const lintMessage = (message) =>
  lint(message, config.rules, {
    defaultIgnores: config.defaultIgnores,
    helpUrl: config.helpUrl,
    ignores: config.ignores,
    parserOpts: config.parserPreset?.parserOpts,
    plugins: config.plugins,
  });

const generatedMessages = [
  'chore(spec-kitty): status transition batch WP04',
  'chore(spec-kitty): inner-state annotation WP04\n\nDurable status evidence.',
  'chore(spec-kitty): record WP04 remediation state',
  'chore(acceptance): record FR-001=pass for team-overview-shell-elements-01M1S8R8',
  'chore(acceptance): record NFR-008=pending for team-overview-shell-elements-01M1S8R8',
  'chore(acceptance): register negative invariant NI-001 for team-overview-shell-elements-01M1S8R8',
  'Update generator config for feature adr-index-reconciliation-and-gate-01M1TAA0',
  // `spec-kitty specify` / `spec-kitty accept` bootstrap and acceptance-gate commits (PR #312,
  // run 34425464248, job `lint-code`): real messages from the
  // static-form-of-element-backed-css-01M248TF mission branch.
  'Add spec for static-form-of-element-backed-css',
  'Accept static-form-of-element-backed-css-01M248TF',
  'Record acceptance commit for static-form-of-element-backed-css-01M248TF',
  'Finalize acceptance artifacts for static-form-of-element-backed-css-01M248TF',
  // `spec-kitty agent tracer-append` / `spec-kitty retrospect create` / `spec-kitty retrospect
  // backfill` auto-commits (#420): real message shapes from specify_cli/retrospective/
  // tracer_writer.py:277 and specify_cli/cli/commands/retrospect.py:431,845 in the installed
  // spec-kitty-cli. `TRACER_CATEGORIES`' three real values, exercised individually.
  'chore(tracer): append tooling-friction finding for team-overview-shell-elements-01M1S8R8',
  'chore(tracer): append approach finding for team-overview-shell-elements-01M1S8R8',
  'chore(tracer): append design-decisions finding for team-overview-shell-elements-01M1S8R8',
  'chore(retrospective): author retrospective for team-overview-shell-elements-01M1S8R8',
  'chore(retrospective): backfill 3 retrospective records',
];

for (const message of generatedMessages) {
  assert.equal(isIgnored(message), true, `expected generated message to be ignored: ${message}`);
  const result = await lintMessage(message);
  assert.equal(result.valid, true, `expected generated message to pass: ${message}`);
}

const nearMisses = [
  'chore(spec-kitty): status transition batch WP04 and bypass checks',
  'chore(spec-kitty): inner-state annotation package-04',
  'chore(spec-kitty): record WP04 arbitrary state',
  'chore(acceptance): record FR-001=blocked for team-overview-shell-elements-01M1S8R8',
  'chore(acceptance): record FR-1=pass for team-overview-shell-elements-01M1S8R8',
  'chore(acceptance): register negative invariant NI-1 for team-overview-shell-elements-01M1S8R8',
  // The generator-config exemption is bounded by the slug shape, not by `\\S+`. Each of these
  // is what an unbounded tail would have let through.
  'Update generator config for feature X',
  'Update generator config for feature NOT-A-SLUG!!!',
  'Update generator config for feature ../../etc/passwd',
  'Update generator config for feature adr-index-reconciliation-and-gate',
  // The "Add spec for" exemption is bounded to the FRIENDLY slug shape (lowercase, digits,
  // hyphens only) — no mission-id suffix, no `\S+`. Each of these is what an unbounded tail
  // would have let through, or a case that must stay outside the pattern's own bound.
  'Add spec for X',
  'Add spec for NOT-A-SLUG!!!',
  'Add spec for ../../etc/passwd',
  'Add spec for static-form-of-element-backed-css and bypass checks',
  // The `spec-kitty accept` exemptions require the FULL slug (friendly slug + `-01` +
  // >=6 uppercase-alphanumeric mission id), not just the friendly slug, and not `\S+`.
  'Accept static-form-of-element-backed-css',
  'Accept static-form-of-element-backed-css-01M248TF and merge',
  'Accept NOT-A-SLUG!!!-01M248TF',
  'Record acceptance commit for static-form-of-element-backed-css',
  'Finalize acceptance artifacts for ../../etc/passwd-01M248TF',
  'Reject static-form-of-element-backed-css-01M248TF',
  // The tracer-append exemption is bounded to TRACER_CATEGORIES' three real values, not an open
  // category word, and to the full mission-slug shape, not `\S+`. Each of these is what an
  // unbounded version of the pattern would have let through.
  'chore(tracer): append fabricated finding for team-overview-shell-elements-01M1S8R8',
  'chore(tracer): append approach finding for not-a-real-slug',
  'chore(tracer): append approach finding for team-overview-shell-elements',
  // The retrospective-author exemption requires the full mission-slug shape, not `\S+`.
  'chore(retrospective): author retrospective for NOT-A-SLUG!!!',
  // The retrospective-backfill exemption requires a digit count and the exact plural noun
  // phrase — each of these is what a looser tail would have let through.
  'chore(retrospective): backfill retrospective records',
  'chore(retrospective): backfill 3 retrospective record',
];

for (const message of nearMisses) {
  assert.equal(isIgnored(message), false, `near-miss must not be ignored: ${message}`);
}

const validHumanMessages = [
  'chore(team-overview): refresh mission status snapshot',
  'chore(team-overview): refresh from elements train',
  'chore(merge): consolidate shell work packages',
  'chore(acceptance): preserve and migrate #145 invariant schema',
  'fix(ci): bound generated commitlint exemptions',
];

for (const message of validHumanMessages) {
  assert.equal(isIgnored(message), false, `human commit must not be ignored: ${message}`);
  const result = await lintMessage(message);
  assert.equal(result.valid, true, `expected conventional human commit to pass: ${message}`);
}

const invalidHumanMessages = [
  ['chore(arbitrary): refresh mission status snapshot', 'scope-enum'],
  ['banana(team-overview): refresh mission status snapshot', 'type-enum'],
  ['chore(team-overview): Refresh Mission Status Snapshot', 'subject-case'],
  ['chore(acceptance): Preserve Invariant Schema', 'subject-case'],
  [`chore(team-overview): ${'x'.repeat(90)}`, 'header-max-length'],
];

for (const [message, expectedRule] of invalidHumanMessages) {
  assert.equal(isIgnored(message), false, `malformed human commit must not be ignored: ${message}`);
  const result = await lintMessage(message);
  assert.equal(result.valid, false, `malformed human commit must fail: ${message}`);
  assert.ok(
    result.errors.some((error) => error.name === expectedRule),
    `expected ${expectedRule} for malformed human commit: ${message}`,
  );
}

console.log('Commitlint config probes passed.');
