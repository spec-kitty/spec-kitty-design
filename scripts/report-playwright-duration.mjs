#!/usr/bin/env node
/**
 * scripts/report-playwright-duration.mjs — WP01's T006/T006a tooling (NFR-004, SC-005).
 *
 * WHAT THIS IS
 *
 * T006 records the pre-mission `playwright` job's OWN run-to-run noise and provides the means
 * to compare a later run's duration against it. T006a is the act of RUNNING this tool once,
 * after the mission's final `playwright` run, to produce the actual reading; T006 alone does
 * not satisfy SC-005, only this file's `--minutes=<N>` invocation against a real number does.
 *
 * REVISED, mid-WP01 (coordinator, 981a3f88 / 0e11c490 on mission/webkit-deflake): the ORIGINAL
 * NFR-004 ("within 5% of 25.6 min") was measured against a single run. Three runs of
 * substantially the same suite then came back at **25.6, 26.7 and 22.5 min — an 18.7% spread**.
 * A 5% tolerance sits well INSIDE that band, so it could fire on nothing (a genuinely healthy
 * run reading as a regression) and prove nothing (a genuine regression hiding inside the noise
 * reading as clean) — the exact defect this repository has already recorded twice (#233: "the
 * 25s ceiling is inside its own run-to-run noise"; #358). NFR-004/SC-005 are revised: report the
 * final duration AGAINST THE MEASURED BAND, never gated on a fixed percentage. A result inside
 * the band passes; one outside it is investigated and explained, never silently accepted or
 * silently failed — this file's exit code reflects "inside/outside the band", not a verdict on
 * whether an outside reading is acceptable, which stays a human judgement (analogous to
 * NFR-005's own semantic claim staying a reviewer judgement in scripts/scan-mission-suppressions.mjs).
 *
 * DO NOT hardcode a percentage here again — that is precisely the mistake being corrected.
 * `BASELINE_RUNS_SECONDS` below is the exact, un-rounded set of observed runs; the band is
 * DERIVED from them (min/max), never a second, independently-typed figure.
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

// The three pre-mission `playwright` job runs actually measured, in minutes, exact — never
// re-typed as a rounded or averaged figure. This is the mission's own evidence that a fixed
// percentage tolerance cannot work here: 25.6 -> 26.7 alone is already a +4.3% swing with NO
// code change at all.
//
// PROVENANCE GAP, flagged by the pre-merge squad (finding F9, PR #454): no GitHub Actions run id
// for any of these three figures is recorded anywhere in this mission's tree — not here, not in
// spec.md/plan.md/tasks.md, not in acceptance-matrix.json before this note. One figure, 26.7,
// coincides with run 35352049054 (WP05's full-suite-contention run, taken MID-MISSION on a lane
// branch that already carries WP01's rig — see tasks/WP05-radio-choice-group-settle.md), which is
// NOT a pre-mission reference run even if it is where 26.7 came from. Whichever agent set this
// constant did not cite its sources, and none could be reconstructed from the tree at closeout.
// Do not add run ids here that have not been independently verified pre-mission (base commit
// before e2cc49fd) — see acceptance-matrix.json's NFR-004/SC-005 rows for the open action.
export const BASELINE_RUNS_MINUTES = [25.6, 26.7, 22.5];
export const BASELINE_RUNS_SECONDS = BASELINE_RUNS_MINUTES.map((m) => m * 60);
export const BAND_MIN_SECONDS = Math.min(...BASELINE_RUNS_SECONDS);
export const BAND_MAX_SECONDS = Math.max(...BASELINE_RUNS_SECONDS);
export const BAND_SPREAD_FRACTION = (BAND_MAX_SECONDS - BAND_MIN_SECONDS) / BAND_MIN_SECONDS;

/** Pure. `{ insideBand }` for an actual duration in seconds against the measured pre-mission
 *  band — no percentage math, deliberately (see file header). Exported so `--selftest` can
 *  drive it directly, and so a caller does not have to re-derive the comparison. */
export function compare(actualSeconds) {
  // EPSILON: same float round-trip guard as the earlier percentage-based version carried at its
  // boundary — here it only matters if a caller passes exactly BAND_MIN_SECONDS/BAND_MAX_SECONDS
  // recomputed through a different arithmetic path than this file's own constants.
  const EPSILON = 1e-9;
  return { insideBand: actualSeconds >= BAND_MIN_SECONDS - EPSILON && actualSeconds <= BAND_MAX_SECONDS + EPSILON };
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
  const { insideBand } = compare(actualSeconds);
  console.log(`NFR-004 / SC-005 — playwright job duration (band-reported, not percentage-gated)`);
  console.log(
    `  pre-mission runs: ${BASELINE_RUNS_MINUTES.map((m) => `${m} min`).join(', ')} ` +
      `(spread: ${(BAND_SPREAD_FRACTION * 100).toFixed(1)}% — this is why there is no fixed tolerance)`,
  );
  console.log(`  measured band: ${fmtMinutes(BAND_MIN_SECONDS)} – ${fmtMinutes(BAND_MAX_SECONDS)}`);
  console.log(`  ${label}: ${fmtMinutes(actualSeconds)} (${actualSeconds.toFixed(1)}s)`);
  console.log(
    insideBand
      ? '  ✅ inside the measured band'
      : '  ⚠️  OUTSIDE the measured band — investigate and explain; this is a flag for a human, not an automatic NFR-004 failure',
  );
  return insideBand;
}

function selftest() {
  const cases = [
    { name: 'the low end of the band (22.5 min) reads inside', seconds: 22.5 * 60, expect: true },
    { name: 'the high end of the band (26.7 min) reads inside', seconds: 26.7 * 60, expect: true },
    { name: 'the original single-run baseline (25.6 min) reads inside', seconds: 25.6 * 60, expect: true },
    { name: 'a value inside the band but not equal to any of the three runs reads inside', seconds: 24 * 60, expect: true },
    { name: 'just below the band (22.4 min) reads OUTSIDE', seconds: 22.4 * 60, expect: false },
    { name: 'just above the band (26.8 min) reads OUTSIDE', seconds: 26.8 * 60, expect: false },
    { name: 'a large regression (double the high end) reads OUTSIDE', seconds: 26.7 * 60 * 2, expect: false },
  ];
  let allOk = true;
  for (const c of cases) {
    const { insideBand } = compare(c.seconds);
    const ok = insideBand === c.expect;
    allOk = allOk && ok;
    console.log(`${ok ? '✅' : '❌'} ${c.name} (${c.seconds.toFixed(1)}s -> insideBand=${insideBand})`);
  }
  if (!allOk) {
    console.error('\n❌ selftest failed.');
    process.exitCode = 1;
    return;
  }
  console.log('\n✅ all selftest cases matched — band-based, no fixed percentage.');
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
  // Band-outside is reported loudly but does not itself fail the process — T006a's own header
  // is explicit that an outside reading needs investigation and explanation, not an automatic
  // NFR-004 failure the way the old percentage gate was.
  report(actualSeconds, label);
}

main();
