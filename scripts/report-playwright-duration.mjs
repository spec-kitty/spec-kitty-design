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
 * REVISED TWICE. Both revisions are kept because the first one's reasoning is still the reason
 * this tool exists, while its NUMBERS were withdrawn — see the constant below for the current
 * band, which is the only figure any caller should use.
 *
 * (1) mid-WP01 (coordinator, 981a3f88 / 0e11c490 on mission/webkit-deflake): the ORIGINAL
 * NFR-004 ("within 5% of 25.6 min") was measured against a single run. Three runs of
 * substantially the same suite came back at 25.6, 26.7 and 22.5 min — an apparent 18.7% spread.
 *
 * (2) at closeout, after the pre-merge squad (finding F9): **those three figures were WITHDRAWN.**
 * No run id existed for any of them anywhere in the mission tree, and 26.7 turned out to match a
 * MID-mission lane run, so the set was never a pre-mission reference at all. The band was
 * re-measured from named, verified, pre-mission runs. **That replacement was itself withdrawn** —
 * see the constant's own block below, which is the ONLY current statement of the band. Do not
 * quote 25.6 / 26.7 / 22.5, "18.7%", or the intermediate 19.17–26.85 / 40.1% figures from this
 * header; all three sets survive here only as the things that were wrong.
 * A 5% tolerance sits well inside even the UNDERSTATED spread, so it could fire on nothing (a
 * genuinely healthy
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
 * `BASELINE_RUNS_SECONDS` below is the set of observed readings exactly as Playwright printed
 * them (one decimal, its own precision — not rounded by this file); the band is
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
 *
 * LIFECYCLE / OWNERSHIP (pre-merge squad, architecture lens). This script has NO automated
 * caller by design: it is not in package.json scripts, not in any workflow, and deliberately not
 * registered in check-gate-wiring.mjs -- wiring it as a gate would make it fail the repository
 * on any honest new precondition wait. It is an OPERATOR instrument, run by hand at a mission's
 * closeout and quoted verbatim into that mission's report. That means nothing will exercise its
 * `--selftest` unless a human does, so run `--selftest` before trusting any figure it prints;
 * it is written to fail loudly when its own rules are neutered. If a future maintainer finds no
 * mission is using it, deleting it is the right call -- leaving it unowned and unrun is not.
 * Tracked alongside the mission-tooling follow-ups in issue #456.
 * USAGE
 *   node scripts/report-playwright-duration.mjs --minutes=25.9
 *   node scripts/report-playwright-duration.mjs --seconds=1550
 *   node scripts/report-playwright-duration.mjs --run-id=1234567890 [--job-name=playwright]
 *   node scripts/report-playwright-duration.mjs --selftest
 */
import { execFileSync } from 'node:child_process';

// BAND PROVENANCE — corrected TWICE, and the second correction was the important one.
//
// (a) The original constant `[25.6, 26.7, 22.5]` carried NO run id for any figure, and 26.7 was a
//     MID-mission lane run. Squad finding F9. Withdrawn.
//
// (b) Its first replacement named ten run ids and stated the method "every CI Quality run on
//     train/elements-first before the mission base whose `playwright` job succeeded". **The set
//     was not what that method yields.** The squad's evidence lens ran the stated method and got
//     109 qualifying runs; the ten shipped were ranks 94–109 — the slowest tail — with 93
//     qualifying runs BELOW the claimed floor. The run ids were checkable; the method that was
//     claimed to generate them was false. That is F9 recurring in a subtler form, and it was
//     caught because a lens re-ran the method instead of re-reading the list.
//
// TWO real defects were hiding under that:
//
//   1. THE SET WAS INCOMPARABLE. The suite GREW from 1229 to 2777 tests across the sampled
//      window, and duration tracks test count. A band over "every run" mixes 245-test runs with
//      2777-test runs and means nothing. The honest filter is comparable WORK, and it is stated
//      and checkable: `passed >= 2600`, i.e. within 6.4% of the closeout run's 2777. Applying it
//      adds two runs the ten missed (34629381528, 34665531460) and removes one they wrongly
//      included (34606532461, only 2324 tests).
//
//   2. THE INSTRUMENT WAS MIXED. 25.6 — the figure the ORIGINAL NFR-004 was written against — is
//      Playwright's own SUITE SELF-TIME, printed as `2777 passed (25.6m)` by run 34820757579.
//      26.85 is that same run's JOB WALL-CLOCK. They are two instruments, not an unreconciled
//      discrepancy (an earlier revision of this file recorded them as one). Comparing a
//      wall-clock reading against a band anchored on a self-time figure manufactured an
//      out-of-band result that did not exist, and then an explanation was built on top of it.
//
// CURRENT BASIS: suite self-time, over pre-mission runs doing comparable work.
// Filter: `CI Quality` on `train/elements-first`, created before the mission base run
// (e90858da), `playwright` job concluded `success`, and `passed >= 2600`. Value = the largest
// `N passed (M.Mm)` line in the job log, which is the full-suite line rather than the 346-test
// project line.
//
// run id      | head sha | date       | passed | suite min | job min
// ------------|----------|------------|--------|-----------|--------
// 34650920361 | e696278c | 2026-09-11 |   2674 |   16.5    | 19.17   <- floor
// 34777305434 | f3b105de | 2026-09-13 |   2776 |   18.7    | 20.02
// 34632185898 | 04565d55 | 2026-09-11 |   2650 |   22.7    | 23.92
// 34657971585 | 40155d58 | 2026-09-11 |   2674 |   23.1    | 24.33
// 34629381528 | bf251f33 | 2026-09-11 |   2649 |   23.8    | 25.02
// 34660223036 | d3263e94 | 2026-09-12 |   2678 |   24.2    | 25.52
// 34767078079 | 25120c70 | 2026-09-13 |   2776 |   24.3    | 25.57
// 34637284298 | 9c269b3c | 2026-09-11 |   2674 |   24.3    | 26.00
// 34673156155 | 57fe4ce7 | 2026-09-12 |   2775 |   24.6    | 26.15
// 34665531460 | b38b40e7 | 2026-09-12 |   2775 |   24.9    | 26.15
// 34820757579 | ee324f84 | 2026-09-14 |   2777 |   25.6    | 26.85   <- ceiling, and the
//                                                                       original single-run
//                                                                       baseline
//
// n = 11, band **16.5–25.6 min suite self-time**, spread 55.2% on comparable work with no code
// change. The ORIGINAL NFR-004 ("within 5% of 25.6 min") would have fired on **8 of these 11**
// unmodified pre-mission runs — which is why a fixed percentage was always the wrong instrument.
//
// PASS SUITE SELF-TIME TO THIS TOOL, not job wall-clock. They differ by 1-2 minutes of setup.
export const BASELINE_RUNS_MINUTES = [
  16.5, 18.7, 22.7, 23.1, 23.8, 24.2, 24.3, 24.3, 24.6, 24.9, 25.6,
];
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
  // Boundary cases are pinned to the CURRENT band's edges (16.5 / 25.6) and have moved TWICE:
  // from the withdrawn three-run band (22.5 / 26.7), then from the selection-biased wall-clock
  // band (19.17 / 26.85). Recorded because a boundary case that silently keeps passing after the
  // boundary moves proves nothing -- which is exactly what a stale comment claiming the old edges
  // would have concealed here.
  const cases = [
    { name: 'the band floor (16.5 min suite self-time, run 34650920361) reads inside', seconds: 16.5 * 60, expect: true },
    { name: 'the band ceiling (25.6 min, run 34820757579 — the original single-run baseline) reads inside', seconds: 25.6 * 60, expect: true },
    { name: 'a value inside the band but equal to none of the eleven runs reads inside', seconds: 20 * 60, expect: true },
    { name: 'just below the band floor (16.4 min) reads OUTSIDE', seconds: 16.4 * 60, expect: false },
    { name: 'just above the band ceiling (25.7 min) reads OUTSIDE', seconds: 25.7 * 60, expect: false },
    { name: "the closeout reading (16.8 min suite self-time) reads INSIDE — it was reported OUTSIDE only by comparing job wall-clock against a self-time band", seconds: 16.8 * 60, expect: true },
    { name: 'a large regression (double the ceiling) reads OUTSIDE', seconds: 25.6 * 60 * 2, expect: false },
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
