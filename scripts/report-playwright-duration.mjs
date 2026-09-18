#!/usr/bin/env node
/**
 * scripts/report-playwright-duration.mjs — WP01's T006/T006a tooling (NFR-004, SC-005).
 *
 * WHAT THIS IS
 *
 * T006 records the pre-mission `playwright` job duration — **25.6 min (1536 s)**, measured at
 * the train tip before this mission touched anything — and provides the means to compare a
 * later run's duration against it. T006a is the act of RUNNING this tool once, after the
 * mission's final `playwright` run, to produce the actual delta; T006 alone does not satisfy
 * SC-005, only this file's `--minutes=<N>` invocation against a real number does.
 *
 * DO NOT ROUND THE BASELINE. tasks.md is explicit that "~27 min" disagrees with the 25.6 min
 * figure by 5.5% — OVER NFR-004's 5% tolerance — so a rounded baseline can make an unchanged
 * job read as already failing (or a genuinely regressed job read as passing). `BASELINE_SECONDS`
 * below is computed from the exact stated figure, never a re-typed decimal, so the two cannot
 * drift apart.
 *
 * WHAT THIS DOES NOT DO
 *
 * It does not run the `playwright` job itself, and it is not wired into
 * `.github/workflows/ci-quality.yml` (C-009 — that job's shape is enforced byte-for-byte by
 * scripts/check-gate-wiring.mjs and scripts/check-ci-quality-trigger-parity.mjs). The duration
 * it reports on is fetched from a REAL CI run's own reported timing, supplied by the caller —
 * either directly (`--seconds`/`--minutes`) or by naming a GitHub Actions run id
 * (`--run-id=<id> --job-name=<name>`, resolved via `gh run view --json jobs`).
 *
 * USAGE
 *   node scripts/report-playwright-duration.mjs --minutes=25.9
 *   node scripts/report-playwright-duration.mjs --seconds=1550
 *   node scripts/report-playwright-duration.mjs --run-id=1234567890 [--job-name=playwright]
 *   node scripts/report-playwright-duration.mjs --selftest
 */
import { execFileSync } from 'node:child_process';

// 25.6 min, exactly — the pre-mission figure at the train tip (tasks.md, NFR-004's baseline).
// Stated in minutes because that is how every mission artifact quotes it; converted once, here,
// to the seconds this file actually compares against.
export const BASELINE_MINUTES = 25.6;
export const BASELINE_SECONDS = BASELINE_MINUTES * 60;
export const TOLERANCE_FRACTION = 0.05; // NFR-004: within 5%.

/** Pure. `{ deltaPercent, withinTolerance }` for an actual duration in seconds against the
 *  pinned pre-mission baseline. Exported so `--selftest` can drive it directly without shelling
 *  out, and so a caller embedding this in another script does not have to re-derive the math. */
export function compare(actualSeconds) {
  const deltaFraction = (actualSeconds - BASELINE_SECONDS) / BASELINE_SECONDS;
  const deltaPercent = deltaFraction * 100;
  // EPSILON guards the boundary against float round-trip noise (1536 * 1.05 does not land on
  // exactly 0.05 when divided back out) — a real regression is never this close to the wire,
  // so a hair of slack here cannot hide one; it only stops the exact-5% boundary from reading
  // as "outside" for a reason that has nothing to do with NFR-004.
  const EPSILON = 1e-9;
  return { deltaPercent, withinTolerance: Math.abs(deltaFraction) <= TOLERANCE_FRACTION + EPSILON };
}

function fmtMinutes(seconds) {
  return `${(seconds / 60).toFixed(2)} min`;
}

/** Resolves a job's duration (seconds) from a GitHub Actions run id via `gh run view --json
 *  jobs`. Not called by `--selftest` — that drives `compare()` directly, never a live API. */
function resolveFromRun(runId, jobName) {
  const raw = execFileSync('gh', ['run', 'view', runId, '--json', 'jobs'], { encoding: 'utf8' });
  const { jobs } = JSON.parse(raw);
  const job = jobs.find((j) => j.name === jobName);
  if (!job) {
    throw new Error(
      `run ${runId} has no job named "${jobName}" — jobs present: ${jobs.map((j) => j.name).join(', ')}`,
    );
  }
  if (!job.startedAt || !job.completedAt) {
    throw new Error(`run ${runId}'s "${jobName}" job has no startedAt/completedAt — is it still running?`);
  }
  const seconds = (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000;
  return seconds;
}

function report(actualSeconds, label) {
  const { deltaPercent, withinTolerance } = compare(actualSeconds);
  const sign = deltaPercent >= 0 ? '+' : '';
  console.log(`NFR-004 / SC-005 — playwright job duration`);
  console.log(`  pre-mission baseline: ${BASELINE_MINUTES} min (${BASELINE_SECONDS}s), exact, not rounded`);
  console.log(`  ${label}: ${fmtMinutes(actualSeconds)} (${actualSeconds.toFixed(1)}s)`);
  console.log(`  delta: ${sign}${deltaPercent.toFixed(2)}% (tolerance: ±${TOLERANCE_FRACTION * 100}%)`);
  console.log(withinTolerance ? '  ✅ within tolerance' : '  ❌ OUTSIDE tolerance — NFR-004 not met');
  return withinTolerance;
}

function selftest() {
  const cases = [
    { name: 'unchanged duration is within tolerance', seconds: BASELINE_SECONDS, expect: true },
    { name: 'exactly +5% is within tolerance (boundary, inclusive)', seconds: BASELINE_SECONDS * 1.05, expect: true },
    { name: 'exactly -5% is within tolerance (boundary, inclusive)', seconds: BASELINE_SECONDS * 0.95, expect: true },
    { name: '+5.0001% is OUTSIDE tolerance', seconds: BASELINE_SECONDS * 1.050001, expect: false },
    { name: '"~27 min" (5.5% off) is OUTSIDE tolerance — the exact drift this file exists to catch', seconds: 27 * 60, expect: false },
    { name: 'a large regression is OUTSIDE tolerance', seconds: BASELINE_SECONDS * 2, expect: false },
  ];
  let allOk = true;
  for (const c of cases) {
    const { withinTolerance } = compare(c.seconds);
    const ok = withinTolerance === c.expect;
    allOk = allOk && ok;
    console.log(`${ok ? '✅' : '❌'} ${c.name} (${c.seconds.toFixed(1)}s -> withinTolerance=${withinTolerance})`);
  }
  if (!allOk) {
    console.error('\n❌ selftest failed.');
    process.exitCode = 1;
    return;
  }
  console.log('\n✅ all selftest cases matched.');
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) {
    selftest();
    return;
  }
  const arg = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const minutes = arg('minutes');
  const seconds = arg('seconds');
  const runId = arg('run-id');
  const jobName = arg('job-name') ?? 'playwright';

  let actualSeconds;
  let label;
  if (minutes !== undefined) {
    actualSeconds = Number(minutes) * 60;
    label = 'this run';
  } else if (seconds !== undefined) {
    actualSeconds = Number(seconds);
    label = 'this run';
  } else if (runId !== undefined) {
    actualSeconds = resolveFromRun(runId, jobName);
    label = `run ${runId}, job "${jobName}"`;
  } else {
    console.error(
      'usage: node scripts/report-playwright-duration.mjs (--minutes=N | --seconds=N | --run-id=ID [--job-name=NAME] | --selftest)',
    );
    process.exitCode = 1;
    return;
  }
  if (!Number.isFinite(actualSeconds) || actualSeconds <= 0) {
    console.error(`❌ resolved a non-positive or non-finite duration (${actualSeconds}) — refusing to report on it.`);
    process.exitCode = 1;
    return;
  }
  const ok = report(actualSeconds, label);
  process.exitCode = ok ? 0 : 1;
}

main();
