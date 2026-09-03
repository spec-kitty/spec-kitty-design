#!/usr/bin/env node
/**
 * Run the behaviour suite and assert it stays under a committed ceiling (#71, FR-013).
 *
 * A number recorded in a markdown file is stale on the next merge and nothing notices.
 * measure-elements-sizes.mjs already made this argument for artifact sizes, and its own
 * docstring names THIS mission as the reason baselines must not live in prose.
 *
 * A CEILING, not exact equality: wall-clock is noisy in a way byte counts are not.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const BUDGET = 'suite-budget.json';
const budget = JSON.parse(readFileSync(BUDGET, 'utf8'));

const started = Date.now();
let failed = false;
let output = '';
try {
  // Captured, not inherited, so the floor's own line can be ASSERTED on the run the gate
  // actually performs. Asserting it on the resolved config was not enough: a CLI
  // `--reporter` overrides config reporters, so `vitest run --reporter=default` in the npm
  // script silently disconnected all five arms while the config assertion stayed green.
  // Same defect as the original, one level over — found at the second gate pass.
  output = execFileSync('npm', ['run', 'test'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (err) {
  failed = true;
  output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
}
process.stdout.write(output);

if (!/Suite floor/.test(output)) {
  console.error(
    '\n❌ the run produced no floor output at all.\n' +
      '   scripts/floor-reporter.mjs did not run — check `reporters` in vitest.config.mts and\n' +
      '   that the test script passes no `--reporter` flag, which would override it.\n' +
      '   Without the floor, an empty lane, a skipped test and an uncovered behaviour are all silent.'
  );
  process.exit(1);
}
const seconds = Math.round(((Date.now() - started) / 1000) * 10) / 10;

console.log(`\nsuite wall-clock: ${seconds}s (ceiling ${budget.ceilingSeconds}s)`);

if (failed) process.exit(1);

if (seconds > budget.ceilingSeconds) {
  console.error(
    `❌ the suite took ${seconds}s, over its committed ceiling of ${budget.ceilingSeconds}s.\n` +
      `   Either make it faster or raise the ceiling deliberately in ${BUDGET} — with the\n` +
      `   run that justifies it, so the next reader knows what changed.`
  );
  process.exit(1);
}

if (process.argv.includes('--record')) {
  budget.measuredSeconds = seconds;
  budget.measuredAt = new Date().toISOString();
  writeFileSync(BUDGET, `${JSON.stringify(budget, null, 2)}\n`);
  console.log(`recorded ${seconds}s in ${BUDGET}`);
}
