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
